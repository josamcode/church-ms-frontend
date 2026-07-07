import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, Check, CheckSquare, Clock, Search, UserCheck, UserPlus, Users } from 'lucide-react';
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
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
            selected ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
          ].join(' ')}
        >
          {getUserInitial(user)}
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

  const contextQuery = useQuery({
    queryKey: ['divine-liturgies', 'attendance-context', entryType, id],
    enabled: Boolean(entryType && id),
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await divineLiturgiesApi.getAttendanceContext(entryType, id);
      return data?.data || null;
    },
  });

  const service = contextQuery.data?.service || null;
  const users = useMemo(
    () => sortUsersByName(Array.isArray(contextQuery.data?.users) ? contextQuery.data.users : []),
    [contextQuery.data]
  );
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
  }, [attendanceQuery.data]);

  const saveAttendanceMutation = useMutation({
    mutationFn: () => divineLiturgiesApi.updateAttendance(entryType, id, selectedDate, selectedUserIds),
    onSuccess: ({ data }) => {
      const payload = data?.data || null;
      if (payload) {
        setSelectedUserIds(Array.isArray(payload.attendedUserIds) ? payload.attendedUserIds : []);
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

  const selectedUserIdSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const normalizedSearchTerm = String(searchTerm || '').trim().toLowerCase();

  const availableUsers = useMemo(
    () =>
      users.filter((user) => (
        !selectedUserIdSet.has(user.id) &&
        (
          !normalizedSearchTerm ||
          String(user.fullName || '').toLowerCase().includes(normalizedSearchTerm)
        )
      )),
    [users, selectedUserIdSet, normalizedSearchTerm]
  );
  const availableUserGroups = useMemo(
    () => groupUsersByInitial(availableUsers),
    [availableUsers]
  );
  const selectedUsers = useMemo(
    () =>
      users.filter((user) => (
        selectedUserIdSet.has(user.id) &&
        (
          !normalizedSearchTerm ||
          String(user.fullName || '').toLowerCase().includes(normalizedSearchTerm)
        )
      )),
    [users, selectedUserIdSet, normalizedSearchTerm]
  );
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

  const totalUsers = users.length;
  const checkedInCount = selectedUserIds.length;
  const remainingCount = Math.max(totalUsers - checkedInCount, 0);

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

  if (users.length === 0) {
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
    <div className="animate-fade-in space-y-6 pb-28 lg:pb-10">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={CheckSquare}
            className="lg:mb-px"
            onClick={() => setSelectedUserIds(users.map((user) => user.id))}
            disabled={isBusy || remainingCount === 0}
          >
            {tf('divineLiturgies.attendance.filters.all', 'All users')}
          </Button>
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
                <EmptyState
                  compact
                  icon={Search}
                  title={tf('divineLiturgies.attendance.noAvailableUsers', 'No users match the current search or filter.')}
                />
              ) : (
                <UserAttendanceGroups groups={availableUserGroups} onToggle={toggleUser} />
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

      {/* ══ STICKY SAVE ═══════════════════════════════════════════════════ */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-3xl items-center gap-3 lg:max-w-none lg:justify-end">
          <span className="hidden text-sm text-muted sm:inline lg:me-auto">
            {checkedInCount} / {totalUsers} {tf('divineLiturgies.attendance.selectedCount', 'checked in')}
          </span>
          <Button
            type="button"
            icon={CheckSquare}
            fullWidth
            className="lg:w-auto"
            onClick={() => saveAttendanceMutation.mutate()}
            loading={saveAttendanceMutation.isPending}
            disabled={!selectedDate}
          >
            {t('common.actions.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
