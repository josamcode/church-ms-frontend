import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowUp, CalendarDays, Check, CheckSquare, Clock, Loader2, Search, Square, UserCheck, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

import { divineLiturgiesApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import PageHeader from '../../../components/ui/PageHeader';
import Section from '../../../components/ui/Section';
import Select from '../../../components/ui/Select';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { useI18n } from '../../../i18n/i18n';
import { formatDate, formatDateTime } from '../../../utils/formatters';
import { getDayLabel } from '../meetings/meetingsForm.utils';
import { buildDivineLiturgyAttendanceDateOptions } from './divineLiturgyAttendanceDateOptions.utils';

const EMPTY = '---';
const USERS_PAGE_SIZE = 100;

function sortUsersByName(users = []) {
  return [...users].sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || ''), undefined, {
    sensitivity: 'base',
  }));
}

function getUserInitial(user) {
  const normalizedName = String(user?.fullName || '').trim();
  return normalizedName ? normalizedName.charAt(0).toUpperCase() : '#';
}

function groupUsersByInitial(users = []) {
  return users.reduce((groups, user) => {
    const initial = getUserInitial(user);
    const currentGroup = groups[groups.length - 1];

    if (currentGroup?.initial === initial) {
      currentGroup.users.push(user);
      return groups;
    }

    groups.push({ initial, users: [user] });
    return groups;
  }, []);
}

function UserAttendanceCard({ user, selected = false, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(user.id)}
      aria-pressed={selected}
      className={[
        'flex w-full items-center justify-between gap-2 rounded-2xl border px-3.5 py-3 text-start transition-all duration-150 active:scale-[0.99]',
        selected
          ? 'border-success/40 bg-success-light shadow-sm'
          : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={[
            'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold',
            selected ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
          ].join(' ')}
        >
          {user.avatar?.url ? (
            <img src={user.avatar.url} alt="" className="h-full w-full object-cover" />
          ) : (
            getUserInitial(user)
          )}
        </span>
        <p className="truncate text-sm font-semibold text-heading">{user.fullName || EMPTY}</p>
      </div>
      <span className={selected ? 'shrink-0 text-success' : 'shrink-0 text-muted'}>
        {selected ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      </span>
    </button>
  );
}

function UserAttendanceGroups({ groups = [], selected = false, onToggle }) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.initial} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-sm font-bold text-primary">
              {group.initial}
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.users.map((user) => (
              <UserAttendanceCard
                key={user.id}
                user={user}
                selected={selected}
                onToggle={onToggle}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function DivineLiturgyAttendanceCheckInPage() {
  const { entryType, id } = useParams();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // Scroll-to-top button: visible once the page is scrolled away from the top.
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Registry of user id -> { fullName, avatarUrl }, accumulated across loaded pages,
  // attendance records and the "check in everyone" fetch. Checked-in users can fall
  // outside the currently loaded/searched page, so we keep their display data here.
  const userRegistryRef = useRef(new Map());
  const [userRegistryVersion, setUserRegistryVersion] = useState(0);
  const registerUsers = useCallback((list) => {
    if (!Array.isArray(list) || list.length === 0) return;
    let changed = false;
    list.forEach((user) => {
      if (!user?.id) return;
      const fullName = user.fullName || '';
      const avatarUrl = user.avatar?.url || '';
      const existing = userRegistryRef.current.get(user.id);
      if (!existing || existing.fullName !== fullName || existing.avatarUrl !== avatarUrl) {
        userRegistryRef.current.set(user.id, { fullName, avatarUrl });
        changed = true;
      }
    });
    if (changed) setUserRegistryVersion((value) => value + 1);
  }, []);

  const contextQuery = useInfiniteQuery({
    queryKey: ['divine-liturgies', 'attendance-context', entryType, id, debouncedSearch],
    enabled: Boolean(entryType && id),
    staleTime: 60000,
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await divineLiturgiesApi.getAttendanceContext(entryType, id, {
        page: pageParam,
        limit: USERS_PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      return data?.data || null;
    },
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? (lastPage.page || 1) + 1 : undefined),
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = contextQuery;
  const firstPage = contextQuery.data?.pages?.[0] || null;
  const service = firstPage?.service || null;
  const totalUsers = firstPage?.totalUsers || 0;

  const loadedUsers = useMemo(() => {
    const seen = new Set();
    const merged = [];
    (contextQuery.data?.pages || []).forEach((page) => {
      (page?.users || []).forEach((user) => {
        if (user?.id && !seen.has(user.id)) {
          seen.add(user.id);
          merged.push(user);
        }
      });
    });
    return merged;
  }, [contextQuery.data]);

  useEffect(() => {
    registerUsers(loadedUsers);
  }, [loadedUsers, registerUsers]);

  const dateOptions = useMemo(
    () => buildDivineLiturgyAttendanceDateOptions(service),
    [service]
  );

  useEffect(() => {
    if (!selectedDate && dateOptions.length > 0) {
      setSelectedDate(dateOptions[0].value);
    }
  }, [dateOptions, selectedDate]);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [selectedDate]);

  const attendanceQuery = useQuery({
    queryKey: ['divine-liturgies', 'attendance', entryType, id, selectedDate],
    enabled: Boolean(entryType && id && selectedDate),
    staleTime: 0,
    queryFn: async () => {
      const { data } = await divineLiturgiesApi.getAttendance(entryType, id, selectedDate);
      return data?.data || null;
    },
  });

  useEffect(() => {
    if (!attendanceQuery.data) return;
    setSelectedUserIds(
      Array.isArray(attendanceQuery.data.attendedUserIds)
        ? attendanceQuery.data.attendedUserIds
        : []
    );
    registerUsers(attendanceQuery.data.attendedUsers);
  }, [attendanceQuery.data, registerUsers]);

  const saveAttendanceMutation = useMutation({
    mutationFn: () => divineLiturgiesApi.updateAttendance(entryType, id, selectedDate, selectedUserIds),
    onSuccess: ({ data }) => {
      const payload = data?.data || null;
      if (payload) {
        setSelectedUserIds(Array.isArray(payload.attendedUserIds) ? payload.attendedUserIds : []);
        registerUsers(payload.attendedUsers);
      }
      toast.success(tf('divineLiturgies.attendance.messages.saved', 'Attendance saved successfully.'));
      queryClient.invalidateQueries({ queryKey: ['divine-liturgies', 'attendance', entryType, id, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['divine-liturgies', 'attendance-context', entryType, id] });
      queryClient.invalidateQueries({ queryKey: ['divine-liturgies', 'overview'] });
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const selectAllMutation = useMutation({
    mutationFn: () => divineLiturgiesApi.getAttendanceEligibleUsers(entryType, id),
    onSuccess: ({ data }) => {
      const eligible = Array.isArray(data?.data?.users) ? data.data.users : [];
      registerUsers(eligible);
      setSelectedUserIds(eligible.map((user) => user.id));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const selectedUserIdSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const normalizedSearchTerm = debouncedSearch.toLowerCase();

  // Available users come straight from the loaded (server-paginated, server-searched)
  // pages, minus anyone already checked in.
  const availableUsers = useMemo(
    () => loadedUsers.filter((user) => !selectedUserIdSet.has(user.id)),
    [loadedUsers, selectedUserIdSet]
  );
  const availableUserGroups = useMemo(
    () => groupUsersByInitial(availableUsers),
    [availableUsers]
  );

  // Checked-in users are driven by the selected id set + the name registry, so they
  // render even when outside the currently loaded page. Search filters them locally.
  const selectedUsers = useMemo(() => {
    const list = selectedUserIds.map((userId) => {
      const entry = userRegistryRef.current.get(userId);
      return {
        id: userId,
        fullName: entry?.fullName || '',
        avatar: entry?.avatarUrl ? { url: entry.avatarUrl } : null,
      };
    });
    const filtered = normalizedSearchTerm
      ? list.filter((user) => user.fullName.toLowerCase().includes(normalizedSearchTerm))
      : list;
    return sortUsersByName(filtered);
    // userRegistryVersion bumps when the registry gains data, forcing a recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserIds, normalizedSearchTerm, userRegistryVersion]);
  const selectedUserGroups = useMemo(
    () => groupUsersByInitial(selectedUsers),
    [selectedUsers]
  );

  const toggleUser = (userId) => {
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((value) => value !== userId)
        : [...current, userId]
    ));
  };

  const checkedInCount = selectedUserIds.length;
  const remainingCount = Math.max(totalUsers - checkedInCount, 0);

  // Infinite scroll. A callback ref (re)attaches the IntersectionObserver every time
  // the sentinel mounts — crucial because the available list briefly unmounts while
  // attendance loads on first render, so the sentinel node is recreated. A plain ref +
  // effect keyed on list length would keep observing the old, detached node and only
  // recover after some other state change (e.g. clicking a user), which was the lag.
  // The observer just tracks visibility; the effect below turns that into fetches, so it
  // also keeps paging while the sentinel stays in view after a page arrives.
  const observerRef = useRef(null);
  const [sentinelVisible, setSentinelVisible] = useState(false);
  const setLoadMoreRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) {
      setSentinelVisible(false);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setSentinelVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: '250px' }
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => {
    if (sentinelVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [sentinelVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // If every loaded user is already checked in, the available list is empty and the
  // sentinel never renders — keep pulling pages until some available users appear.
  // Guard with remainingCount so we don't page through everyone when all are checked
  // in (e.g. right after "check in everyone").
  useEffect(() => {
    if (
      statusFilter !== 'selected' &&
      availableUsers.length === 0 &&
      loadedUsers.length > 0 &&
      remainingCount > 0 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [statusFilter, availableUsers.length, loadedUsers.length, remainingCount, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const serviceScheduleLabel = service?.entryType === 'exception'
    ? formatDate(service?.date)
    : getDayLabel(service?.dayOfWeek, t);

  const filterOptions = [
    { value: 'all', label: tf('divineLiturgies.attendance.filters.all', 'All users') },
    { value: 'available', label: tf('divineLiturgies.attendance.filters.available', 'Available only') },
    { value: 'selected', label: tf('divineLiturgies.attendance.filters.selected', 'Checked in only') },
  ];

  const breadcrumbs = [
    { label: t('shared.dashboard'), href: '/dashboard' },
    { label: t('divineLiturgies.page'), href: '/dashboard/divine-liturgies' },
    {
      label: service?.displayName || tf('divineLiturgies.page', 'Divine Liturgy & Vespers'),
      href: '/dashboard/divine-liturgies',
    },
    { label: tf('divineLiturgies.attendance.pageTitle', 'Users Attendance Check-in') },
  ];

  if (contextQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <EmptyState
          icon={CalendarDays}
          title={tf('divineLiturgies.attendance.notFoundTitle', 'Service not found')}
          description={
            contextQuery.error
              ? normalizeApiError(contextQuery.error).message
              : tf(
                'divineLiturgies.attendance.notFoundDescription',
                'This divine liturgy record could not be loaded or may have been removed.'
              )
          }
        />
      </div>
    );
  }

  if (dateOptions.length === 0) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader
          title={tf('divineLiturgies.attendance.pageTitle', 'Users Attendance Check-in')}
          subtitle={tf(
            'divineLiturgies.attendance.pageSubtitle',
            'Choose a valid past service date, then check in the users who attended.'
          )}
        />
        <EmptyState
          icon={CalendarDays}
          title={tf('divineLiturgies.attendance.noDatesTitle', 'No eligible dates yet')}
          description={tf(
            'divineLiturgies.attendance.noDatesDescription',
            'There are no valid past dates available for this service yet.'
          )}
        />
      </div>
    );
  }

  if (totalUsers === 0) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader
          title={tf('divineLiturgies.attendance.pageTitle', 'Users Attendance Check-in')}
          subtitle={tf(
            'divineLiturgies.attendance.pageSubtitle',
            'Choose a valid past service date, then check in the users who attended.'
          )}
        />
        <EmptyState
          icon={Users}
          title={tf('divineLiturgies.attendance.noUsersTitle', 'No users available')}
          description={tf(
            'divineLiturgies.attendance.noUsersDescription',
            'No users are available for divine liturgy attendance check-in.'
          )}
        />
      </div>
    );
  }

  const isBusy = attendanceQuery.isLoading;

  return (
    <div className="animate-fade-in space-y-6 pb-28 lg:pb-24">
      <Breadcrumbs items={breadcrumbs} />

      {/* ══ HEADER / TOOLBAR ══════════════════════════════════════════════ */}
      <Card padding="lg" tone="primary">
        <PageHeader
          contentOnly
          eyebrow={service.displayName || t('divineLiturgies.page')}
          title={tf('divineLiturgies.attendance.pageTitle', 'Users Attendance Check-in')}
          subtitle={tf(
            'divineLiturgies.attendance.pageSubtitle',
            'Choose a valid past service date, then check in the users who attended.'
          )}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="primary" dot>
            <CalendarDays className="h-3.5 w-3.5" />
            {serviceScheduleLabel || EMPTY}
          </Badge>
          <Badge variant="neutral">
            <Users className="h-3.5 w-3.5" />
            {checkedInCount} {tf('divineLiturgies.attendance.selectedCount', 'checked in')}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,220px)_minmax(0,220px)_1fr_auto] lg:items-end">
          <Select
            label={tf('divineLiturgies.attendance.dateLabel', 'Service Date')}
            options={dateOptions}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            placeholder={tf('divineLiturgies.attendance.datePlaceholder', 'Select a service date')}
            containerClassName="!mb-0"
          />
          <Select
            label={tf('divineLiturgies.attendance.filters.label', 'Filter')}
            options={filterOptions}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            containerClassName="!mb-0"
          />
          <Input
            label={tf('divineLiturgies.attendance.searchLabel', 'Search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={tf('divineLiturgies.attendance.searchPlaceholder', 'Search by user name')}
            icon={Search}
            containerClassName="!mb-0"
          />
          <div className="flex items-center gap-2 lg:mb-px">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={CheckSquare}
              className="flex-1 lg:flex-none"
              onClick={() => selectAllMutation.mutate()}
              loading={selectAllMutation.isPending}
              disabled={isBusy || remainingCount === 0 || selectAllMutation.isPending}
            >
              {tf('divineLiturgies.attendance.filters.all', 'All users')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Square}
              className="flex-1 lg:flex-none"
              onClick={() => setSelectedUserIds([])}
              disabled={isBusy || checkedInCount === 0}
            >
              {tf('divineLiturgies.attendance.filters.deselectAll', 'Deselect all')}
            </Button>
          </div>
        </div>

        {attendanceQuery.error ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger-light px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{normalizeApiError(attendanceQuery.error).message}</span>
          </div>
        ) : null}

        {attendanceQuery.data?.viewerUpdatedAt ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            {tf('divineLiturgies.attendance.lastUpdated', 'Last updated')}: {formatDateTime(attendanceQuery.data.viewerUpdatedAt)} ·{' '}
            {attendanceQuery.data.viewerUpdatedBy?.fullName || EMPTY}
          </p>
        ) : null}
      </Card>

      {/* ══ SUMMARY ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={UserCheck}
          label={tf('divineLiturgies.attendance.selectedTitle', 'Checked-in Users')}
          value={checkedInCount}
          tone="success"
          isRTL={isRTL}
        />
        <StatCard
          icon={UserPlus}
          label={tf('divineLiturgies.attendance.availableTitle', 'Available Users')}
          value={remainingCount}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={Users}
          label={tf('divineLiturgies.attendance.filters.all', 'All users')}
          value={totalUsers}
          tone="gold"
          isRTL={isRTL}
        />
      </div>

      {/* ══ ATTENDEE LISTS ════════════════════════════════════════════════ */}
      {isBusy ? (
        <Card padding="none">
          <div className="border-b border-border/60 px-5 py-3.5">
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-2xl" />
            ))}
          </div>
        </Card>
      ) : (
        <>
          {statusFilter !== 'selected' && (
            <Section
              icon={UserPlus}
              title={tf('divineLiturgies.attendance.availableTitle', 'Available Users')}
              description={tf(
                'divineLiturgies.attendance.availableSubtitle',
                'Users are arranged alphabetically. Click any name to move it to the checked-in list.'
              )}
              actions={<Badge variant="neutral">{availableUsers.length}</Badge>}
            >
              {availableUsers.length === 0 ? (
                isFetchingNextPage || contextQuery.isFetching ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    compact
                    icon={Search}
                    title={tf('divineLiturgies.attendance.noAvailableUsers', 'No users match the current search or filter.')}
                  />
                )
              ) : (
                <div className="space-y-5">
                  <UserAttendanceGroups groups={availableUserGroups} onToggle={toggleUser} />
                  {hasNextPage ? (
                    <div
                      ref={setLoadMoreRef}
                      className="flex items-center justify-center py-4 text-sm text-muted"
                    >
                      {isFetchingNextPage ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {tf('divineLiturgies.attendance.loadingMore', 'Loading more users…')}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </Section>
          )}

          {statusFilter !== 'available' && (
            <Section
              icon={UserCheck}
              title={tf('divineLiturgies.attendance.selectedTitle', 'Checked-in Users')}
              description={tf(
                'divineLiturgies.attendance.selectedSubtitle',
                'Click any checked-in name to remove it from attendance and return it to the available list.'
              )}
              actions={<Badge variant="success">{selectedUsers.length}</Badge>}
              className="border-success/20"
            >
              {selectedUsers.length === 0 ? (
                <EmptyState
                  compact
                  icon={UserCheck}
                  title={tf('divineLiturgies.attendance.noSelectedUsers', 'No users are checked in for this date yet.')}
                />
              ) : (
                <UserAttendanceGroups groups={selectedUserGroups} selected onToggle={toggleUser} />
              )}
            </Section>
          )}
        </>
      )}

      {/* ══ FLOATING CONTROLS (scroll-to-top + save) ═════════════════════ */}
      <div
        className={[
          'fixed bottom-20 z-30 flex flex-col gap-3 lg:bottom-6',
          isRTL ? 'left-4 items-start lg:left-6' : 'right-4 items-end lg:right-6',
        ].join(' ')}
      >
        {showScrollTop ? (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label={tf('divineLiturgies.attendance.scrollToTop', 'Scroll to top')}
            title={tf('divineLiturgies.attendance.scrollToTop', 'Scroll to top')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-heading shadow-lg backdrop-blur transition-all hover:border-primary/40 hover:text-primary active:scale-95 animate-fade-in"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        ) : null}

        <Button
          type="button"
          icon={CheckSquare}
          size="lg"
          className="rounded-full shadow-xl shadow-primary/25"
          onClick={() => saveAttendanceMutation.mutate()}
          loading={saveAttendanceMutation.isPending}
          disabled={!selectedDate}
        >
          {t('common.actions.save')}
          <span className="ms-1 hidden rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold leading-none sm:inline">
            {checkedInCount}/{totalUsers}
          </span>
        </Button>
      </div>
    </div>
  );
}
