import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Edit, Lock, Unlock, Trash2,
  Users, UserCheck, LayoutGrid, TableProperties, SlidersHorizontal,
  ArrowUp, Loader2,
} from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Table, { RowActions } from '../../../components/ui/Table';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { AGE_GROUPS, formatAgeFromBirthDate, getGenderLabel, getRoleLabel } from '../../../utils/formatters';

const USERS_VIEW_MODE_STORAGE_KEY = 'users:viewMode';
const DESKTOP_QUERY = '(min-width: 640px)';

function normalizeViewMode(value) {
  return value === 'cards' ? 'cards' : 'table';
}

function getDefaultUsersViewMode() {
  if (typeof window === 'undefined') return 'table';

  const stored = window.localStorage.getItem(USERS_VIEW_MODE_STORAGE_KEY);
  if (stored === 'table' || stored === 'cards') return stored;

  const isDesktop =
    typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches;
  return isDesktop ? 'table' : 'cards';
}

function persistUsersViewMode(nextMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USERS_VIEW_MODE_STORAGE_KEY, nextMode);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

function getInitial(name) {
  if (!name) return 'U';
  return String(name).trim().charAt(0).toUpperCase();
}

function getUserPhone(user) {
  return user.phonePrimary || user.phone || user.mobile || user.mobileNumber || '';
}

function ViewModeToggle({ value, onChange, t }) {
  const options = [
    { value: 'table', icon: TableProperties, label: t('common.table.tableView') },
    { value: 'cards', icon: LayoutGrid, label: t('common.table.cardsView') },
  ];

  return (
    <div dir="ltr" className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'primary' : 'ghost'}
          size="sm"
          icon={option.icon}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          aria-label={option.label}
          title={option.label}
          className="!px-2"
        >
          <span className="sr-only">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}

function UserMemberCard({ user, actions, onOpen, emptyValue, t }) {
  const phone = getUserPhone(user);

  return (
    <Card
      dir="rtl"
      padding={false}
      className="group flex items-center gap-3 p-3"
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-bold text-primary"
        aria-label={user.fullName || emptyValue}
      >
        {user.avatar?.url ? (
          <img
            src={user.avatar.url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{getInitial(user.fullName)}</span>
        )}
        {user.isLocked ? (
          <span className="absolute -bottom-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white ring-2 ring-surface">
            <Lock className="h-2.5 w-2.5" aria-hidden="true" />
          </span>
        ) : null}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-start"
      >
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold leading-5 text-heading transition-colors group-hover:text-primary">
            {user.fullName || emptyValue}
          </p>
          <Badge variant={user.isLocked ? 'danger' : 'success'} size="sm" dot>
            {user.isLocked ? t('common.status.locked') : t('common.status.active')}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs font-medium leading-4 text-muted">
          {user.familyName || emptyValue}
        </p>
        <p className="mt-1 truncate text-[11px] font-medium leading-4 text-muted">
          <span dir="ltr">{phone || emptyValue}</span>
          {user.ageGroup ? <span className="text-muted"> · {user.ageGroup}</span> : null}
        </p>
      </button>

      <div className="shrink-0">
        <RowActions actions={actions} />
      </div>
    </Card>
  );
}

function UsersCardsGrid({
  users,
  loading,
  skeletonRows,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  getActions,
  onOpenUser,
  emptyValue,
  t,
}) {
  if (!loading && users.length === 0) {
    return (
      <Card padding={false}>
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {loading
        ? Array.from({ length: skeletonRows }).map((_, index) => (
          <Card key={index} padding={false} className="flex items-center gap-3 p-3">
            <Skeleton variant="circle" className="h-12 w-12 shrink-0 !rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-8 shrink-0" />
          </Card>
        ))
        : users.map((user) => (
          <UserMemberCard
            key={user._id || user.id}
            user={user}
            actions={getActions(user)}
            onOpen={() => onOpenUser(user)}
            emptyValue={emptyValue}
            t={t}
          />
        ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function UsersListPage() {
  const visibleAccountStatus = 'approved';
  const { hasPermission } = useAuth();
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ fullName: '', ageGroup: '', gender: '', role: '' });
  const [limit] = useState(100);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState(getDefaultUsersViewMode);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const baseParams = useMemo(() => ({
    limit, sort: 'createdAt', order: 'desc',
    accountStatus: visibleAccountStatus,
    ...(filters.fullName && { fullName: filters.fullName }),
    ...(filters.ageGroup && { ageGroup: filters.ageGroup }),
    ...(filters.gender && { gender: filters.gender }),
    ...(filters.role && { role: filters.role }),
  }), [limit, visibleAccountStatus, filters.fullName, filters.ageGroup, filters.gender, filters.role]);

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['users', 'infinite', baseParams],
    queryFn: async ({ pageParam }) => {
      const { data } = await usersApi.list({
        ...baseParams,
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      return data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      (lastPage?.meta?.hasNextPage && lastPage?.meta?.nextCursor) ? lastPage.meta.nextCursor : undefined,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const { data: totalUsersCount = 0, refetch: refetchTotalUsers } = useQuery({
    queryKey: ['users', 'totalCount', visibleAccountStatus],
    queryFn: async () => {
      const { data } = await usersApi.list({
        limit: 1,
        sort: 'createdAt',
        order: 'desc',
        accountStatus: visibleAccountStatus,
      });
      return Number(data?.meta?.totalCount || 0);
    },
    staleTime: 120000,
  });

  const users = useMemo(() => {
    const seen = new Set();
    const merged = [];
    (data?.pages || []).forEach((page) => {
      (page?.data || []).forEach((user) => {
        const id = user._id || user.id;
        if (id && !seen.has(id)) {
          seen.add(id);
          merged.push(user);
        }
      });
    });
    return merged;
  }, [data]);
  const loadedCount = users.length;

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ fullName: '', ageGroup: '', gender: '', role: '' });
  }, []);

  // Scroll-to-top button: visible once the page is scrolled away from the top.
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Infinite scroll. A callback ref (re)attaches the IntersectionObserver whenever the
  // sentinel mounts/remounts, so it never ends up bound to a stale node. The observer
  // just tracks visibility; the effect below turns that into next-page fetches and keeps
  // paging while the sentinel stays in view.
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
      { rootMargin: '400px' }
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);
  useEffect(() => {
    if (sentinelVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [sentinelVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget._id || deleteTarget.id);
      toast.success(t('usersListPage.messages.deletedSuccess'));
      setDeleteTarget(null);
      refetch();
      refetchTotalUsers();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewModeChange = useCallback((nextMode) => {
    const normalizedMode = normalizeViewMode(nextMode);
    setViewMode(normalizedMode);
    persistUsersViewMode(normalizedMode);
  }, []);

  const getUserActions = useCallback((row) => [
    { label: t('common.actions.view'), icon: Eye, onClick: () => navigate(`/dashboard/users/${row._id}`) },
    ...(hasPermission('USERS_UPDATE')
      ? [{ label: t('common.actions.edit'), icon: Edit, onClick: () => navigate(`/dashboard/users/${row._id}/edit`) }]
      : []),
    ...(hasPermission('USERS_LOCK') && !row.isLocked
      ? [{ label: t('common.actions.lock'), icon: Lock, onClick: () => navigate(`/dashboard/users/${row._id}/lock`) }]
      : []),
    ...(hasPermission('USERS_UNLOCK') && row.isLocked
      ? [{ label: t('common.actions.unlock'), icon: Unlock, onClick: () => navigate(`/dashboard/users/${row._id}/unlock`) }]
      : []),
    ...(hasPermission('USERS_DELETE')
      ? [{ divider: true }, { label: t('common.actions.delete'), icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) }]
      : []),
  ], [hasPermission, navigate, t]);

  const activeFilterCount = useMemo(
    () => [filters.ageGroup, filters.gender, filters.role].filter(Boolean).length,
    [filters.ageGroup, filters.gender, filters.role],
  );
  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);
  const lockedCount = useMemo(() => users.filter((r) => r.isLocked).length, [users]);
  const activeCount = users.length - lockedCount;
  const emptyValue = t('common.placeholder.empty');

  const roleOptions = [
    { value: 'SUPER_ADMIN', label: getRoleLabel('SUPER_ADMIN') },
    { value: 'ADMIN', label: getRoleLabel('ADMIN') },
    { value: 'USER', label: getRoleLabel('USER') },
  ];

  const genderOptions = [
    { value: 'male', label: getGenderLabel('male') },
    { value: 'female', label: getGenderLabel('female') },
  ];

  /** Active secondary filters rendered as removable chips under the search bar. */
  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.ageGroup) {
      chips.push({ key: 'ageGroup', label: `${t('usersListPage.filters.ageGroup')}: ${filters.ageGroup}` });
    }
    if (filters.gender) {
      chips.push({ key: 'gender', label: `${t('usersListPage.filters.gender')}: ${getGenderLabel(filters.gender)}` });
    }
    if (filters.role) {
      chips.push({ key: 'role', label: `${t('usersListPage.filters.role')}: ${getRoleLabel(filters.role)}` });
    }
    return chips;
  }, [filters.ageGroup, filters.gender, filters.role, t]);

  const columns = useMemo(() => [
    {
      key: 'fullName',
      label: t('usersListPage.columns.name'),
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {row.avatar?.url ? (
              <img
                src={row.avatar.url}
                alt=""
                className="h-9 w-9 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {getInitial(row.fullName)}
              </div>
            )}
            {row.isLocked ? (
              <span className="absolute -bottom-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white ring-2 ring-surface">
                <Lock className="h-2.5 w-2.5" aria-hidden="true" />
              </span>
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-heading">
              {row.fullName || t('common.placeholder.empty')}
            </p>
            <p className="truncate text-xs text-muted direction-ltr text-left">
              {row.phonePrimary || t('common.placeholder.empty')}
            </p>
          </div>
        </div>
      ),
      onClick: (row) => navigate(`/dashboard/users/${row._id}`),
      cellClassName: 'cursor-pointer',
    },
    {
      key: 'ageGroup',
      label: t('usersListPage.columns.ageGroup'),
      render: (row) => row.ageGroup || t('common.placeholder.empty'),
    },
    {
      key: 'age',
      label: t('usersListPage.columns.age'),
      render: (row) => formatAgeFromBirthDate(row.birthDate),
    },
    {
      key: 'gender',
      label: t('usersListPage.columns.gender'),
      render: (row) => getGenderLabel(row.gender),
    },
    {
      key: 'familyName',
      label: t('usersListPage.columns.familyName'),
      render: (row) => (row.familyName || "---"),
    },
    {
      key: 'status',
      label: t('usersListPage.columns.status'),
      render: (row) => (
        <Badge variant={row.isLocked ? 'danger' : 'success'} dot>
          {row.isLocked ? t('common.status.locked') : t('common.status.active')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      cellClassName: 'w-10',
      render: (row) => (
        <RowActions actions={getUserActions(row)} />
      ),
    },
  ], [getUserActions, navigate, t]);

  /* ── render ── */
  return (
    <div className="animate-fade-in space-y-5 pb-24 sm:space-y-6 sm:pb-10">

      {/* ══ HEADER — title, primary action, KPI stat cards ════════════════════ */}
      <header className="space-y-5">
        <Breadcrumbs
          items={[
            { label: t('shared.dashboard'), href: '/dashboard' },
            { label: t('shared.users') },
          ]}
        />

        <PageHeader
          title={t('shared.users')}
          subtitle={t('usersListPage.hero.description')}
          actions={
            hasPermission('USERS_CREATE') ? (
              <Link to="/dashboard/users/new" className="hidden shrink-0 sm:block">
                <Button icon={Plus}>{t('usersListPage.actions.addUser')}</Button>
              </Link>
            ) : null
          }
        />

        {/* KPI stat cards — one consistent treatment */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label={t('usersListPage.stats.totalUsers')} value={totalUsersCount} tone="primary" isRTL={isRTL} />
          <StatCard icon={UserCheck} label={t('usersListPage.stats.activeAccounts')} value={activeCount} tone="success" isRTL={isRTL} />
          <StatCard icon={Lock} label={t('usersListPage.stats.lockedAccounts')} value={lockedCount} tone={lockedCount > 0 ? 'danger' : 'default'} isRTL={isRTL} />
          <StatCard icon={LayoutGrid} label={t('usersListPage.stats.usersOnPage')} value={users.length} tone="gold" isRTL={isRTL} />
        </div>
      </header>

      {/* ══ CONTROL BAR — prominent search + compact filters + view toggle ════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SearchInput
            value={filters.fullName}
            onChange={(v) => handleFilterChange('fullName', v)}
            placeholder={t('usersListPage.filters.searchByName')}
            className="flex-1"
          />

          <Button
            variant="outline"
            icon={SlidersHorizontal}
            onClick={() => setFiltersOpen(true)}
            className="shrink-0"
            aria-label={t('usersListPage.filters.title')}
          >
            <span className="hidden sm:inline">{t('usersListPage.filters.title')}</span>
            {activeFilterCount > 0 ? (
              <Badge variant="primary" size="sm">{activeFilterCount}</Badge>
            ) : null}
          </Button>

          <div className="hidden sm:block">
            <ViewModeToggle value={viewMode} onChange={handleViewModeChange} t={t} />
          </div>
        </div>

        {/* Active filter chips — visible state without opening the panel */}
        {activeFilterChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterChips.map((chip) => (
              <Badge
                key={chip.key}
                variant="primary"
                removable
                onRemove={() => handleFilterChange(chip.key, '')}
              >
                {chip.label}
              </Badge>
            ))}
            <Button variant="ghost" size="xs" onClick={clearFilters}>
              {t('usersListPage.filters.clear')}
            </Button>
          </div>
        ) : null}
      </div>

      {/* ══ LIST ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-heading">{t('usersListPage.table.title')}</h2>
          <Badge variant="neutral">
            {t('usersListPage.table.results', { count: loadedCount })}
          </Badge>
        </div>

        <div>
          {viewMode === 'cards' ? (
            <UsersCardsGrid
              users={users}
              loading={isLoading}
              skeletonRows={6}
              emptyTitle={t('usersListPage.empty.title')}
              emptyDescription={
                hasActiveFilters
                  ? t('usersListPage.empty.descriptionFiltered')
                  : t('usersListPage.empty.descriptionDefault')
              }
              emptyIcon={Users}
              getActions={getUserActions}
              onOpenUser={(user) => navigate(`/dashboard/users/${user._id}`)}
              emptyValue={emptyValue}
              t={t}
            />
          ) : (
            <Table
              columns={columns}
              data={users}
              loading={isLoading}
              emptyTitle={t('usersListPage.empty.title')}
              emptyDescription={
                hasActiveFilters
                  ? t('usersListPage.empty.descriptionFiltered')
                  : t('usersListPage.empty.descriptionDefault')
              }
              emptyIcon={Users}
              renderMode="table"
            />
          )}

          {hasNextPage ? (
            <div
              ref={setLoadMoreRef}
              className="flex items-center justify-center py-6 text-sm text-muted"
            >
              {isFetchingNextPage ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('usersListPage.table.loadingMore')}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* ══ MOBILE STICKY "ADD USER" ══════════════════════════════════════════ */}
      {hasPermission('USERS_CREATE') ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-3 shadow-card sm:hidden">
          <Link to="/dashboard/users/new" className="block">
            <Button icon={Plus} fullWidth size="lg">{t('usersListPage.actions.addUser')}</Button>
          </Link>
        </div>
      ) : null}

      {/* ══ SCROLL TO TOP ═════════════════════════════════════════════════════ */}
      {showScrollTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={t('usersListPage.scrollToTop')}
          title={t('usersListPage.scrollToTop')}
          className={[
            'fixed z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-heading shadow-lg backdrop-blur transition-all hover:border-primary/40 hover:text-primary active:scale-95 animate-fade-in',
            'bottom-24 lg:bottom-6',
            isRTL ? 'left-4 lg:left-6' : 'right-4 lg:right-6',
          ].join(' ')}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}

      {/* ══ FILTERS MODAL — secondary filters behind a compact control ════════ */}
      <Modal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('usersListPage.filters.title')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={clearFilters}>
              {t('usersListPage.filters.clear')}
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>
              {t('common.actions.close')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label={t('usersListPage.filters.ageGroup')}
            options={AGE_GROUPS.map((g) => ({ value: g, label: g }))}
            value={filters.ageGroup}
            onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
            placeholder={t('usersListPage.filters.ageGroup')}
            containerClassName="!mb-0"
          />
          <Select
            label={t('usersListPage.filters.gender')}
            options={genderOptions}
            value={filters.gender}
            onChange={(e) => handleFilterChange('gender', e.target.value)}
            placeholder={t('usersListPage.filters.gender')}
            containerClassName="!mb-0"
          />
          <Select
            label={t('usersListPage.filters.role')}
            options={roleOptions}
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            placeholder={t('usersListPage.filters.role')}
            containerClassName="!mb-0"
          />

          {/* View mode toggle lives here too, so mobile users can switch layout */}
          <div className="flex items-center justify-between border-t border-border pt-4 sm:hidden">
            <span className="text-sm font-medium text-heading">{t('common.table.tableView')} / {t('common.table.cardsView')}</span>
            <ViewModeToggle value={viewMode} onChange={handleViewModeChange} t={t} />
          </div>
        </div>
      </Modal>

      {/* ══ DELETE MODAL ══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('usersListPage.delete.title')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              {t('common.actions.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {t('usersListPage.delete.confirmPrefix')}{' '}
          <strong className="text-heading">{deleteTarget?.fullName}</strong>{' '}
          {t('usersListPage.delete.confirmSuffix')}
        </p>
      </Modal>
    </div>
  );
}
