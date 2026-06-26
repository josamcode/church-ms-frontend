import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Edit, Lock, Unlock, Trash2,
  Users, UserCheck, Flame, LayoutGrid, TableProperties,
} from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import Button from '../../../components/ui/Button';
import Table, { RowActions } from '../../../components/ui/Table';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Modal from '../../../components/ui/Modal';
import PageHeader from '../../../components/ui/PageHeader';
import EmptyState from '../../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { AGE_GROUPS, formatAgeFromBirthDate, getGenderLabel, getRoleLabel } from '../../../utils/formatters';
import { AGE_GROUP_VALUES } from '../../../constants/householdProfiles';

const USERS_VIEW_MODE_STORAGE_KEY = 'users:viewMode';
const DESKTOP_QUERY = '(min-width: 640px)';
const AGE_GROUP_TONES = ['child', 'teenager', 'young', 'middleAge', 'senior'];

const AGE_GROUP_BADGE_CLASSES = {
  child: 'bg-slate-50 text-slate-500 ring-slate-200',
  teenager: 'bg-violet-50 text-violet-600 ring-violet-200',
  young: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  middleAge: 'bg-amber-50 text-amber-600 ring-amber-200',
  senior: 'bg-rose-50 text-rose-600 ring-rose-200',
  unknown: 'bg-surface-alt text-muted ring-border',
};

const AGE_GROUP_FALLBACK_TONES = {
  child: 'child',
  children: 'child',
  kid: 'child',
  teenager: 'teenager',
  teen: 'teenager',
  young: 'young',
  youth: 'young',
  middle_age: 'middleAge',
  middle_aged: 'middleAge',
  senior: 'senior',
  elderly: 'senior',
};

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

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function getGenderTone(value) {
  const normalized = normalizeText(value);
  if (['male', 'm', 'ذكر', 'ولد', 'رجل'].includes(normalized)) return 'male';
  if (['female', 'f', 'أنثى', 'انثى', 'بنت', 'سيدة'].includes(normalized)) return 'female';
  return 'unknown';
}

function getAvatarToneClass(gender) {
  const tone = getGenderTone(gender);
  if (tone === 'male') return 'border-sky-200 ring-sky-200 bg-sky-50 text-sky-700';
  if (tone === 'female') return 'border-pink-200 ring-pink-200 bg-pink-50 text-pink-700';
  return 'border-border ring-border bg-surface-alt text-muted';
}

function getAgeGroupTone(ageGroup) {
  const normalized = normalizeText(ageGroup);
  if (!normalized) return 'unknown';

  const existingValueIndex = AGE_GROUP_VALUES.findIndex((value) => normalizeText(value) === normalized);
  if (existingValueIndex >= 0) return AGE_GROUP_TONES[existingValueIndex] || 'unknown';

  const localizedValueIndex = AGE_GROUPS.findIndex((value) => normalizeText(value) === normalized);
  if (localizedValueIndex >= 0) return AGE_GROUP_TONES[localizedValueIndex] || 'unknown';

  return AGE_GROUP_FALLBACK_TONES[normalized] || 'unknown';
}

function getUserPhone(user) {
  return user.phonePrimary || user.phone || user.mobile || user.mobileNumber || '';
}

/** Thin overline section label — shared pattern across redesigned pages */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">{children}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function ViewModeToggle({ value, onChange, t }) {
  const options = [
    { value: 'table', icon: TableProperties, label: t('common.table.tableView') },
    { value: 'cards', icon: LayoutGrid, label: t('common.table.cardsView') },
  ];

  return (
    <div dir="ltr" className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/80 bg-surface p-1 shadow-sm">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              active
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-surface-alt hover:text-heading'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AgeGroupBadge({ ageGroup }) {
  const tone = getAgeGroupTone(ageGroup);

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${AGE_GROUP_BADGE_CLASSES[tone] || AGE_GROUP_BADGE_CLASSES.unknown}`}
      aria-label={ageGroup || 'Unknown age group'}
      title={ageGroup || 'Unknown age group'}
    >
      <Flame className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
    </span>
  );
}

function UserMemberCard({ user, actions, onOpen, emptyValue }) {
  const phone = getUserPhone(user);
  const avatarClassName = getAvatarToneClass(user.gender);

  return (
    <article
      dir="rtl"
      className="group flex min-h-[84px] items-center gap-3 rounded-2xl border border-border/80 bg-white px-3 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card"
    >
      <button
        type="button"
        onClick={onOpen}
        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-sm font-bold ring-2 ring-offset-2 ring-offset-white transition-colors ${avatarClassName}`}
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
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-right"
      >
        <p className="truncate text-sm font-bold leading-5 text-heading transition-colors group-hover:text-primary">
          {user.fullName || emptyValue}
        </p>
        <p className="mt-0.5 truncate text-xs font-medium leading-4 text-muted">
          {user.familyName || emptyValue}
        </p>
        <p dir="ltr" className="mt-0.5 truncate text-right text-[11px] font-medium leading-4 text-muted/90">
          {phone || emptyValue}
        </p>
      </button>

      <AgeGroupBadge ageGroup={user.ageGroup} />

      <div className="shrink-0">
        <RowActions actions={actions} />
      </div>
    </article>
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
}) {
  if (!loading && users.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {loading
        ? Array.from({ length: skeletonRows }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[84px] animate-pulse items-center gap-3 rounded-2xl border border-border/80 bg-white px-3 py-2.5 shadow-sm"
          >
            <div className="h-12 w-12 shrink-0 rounded-full bg-surface-alt" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-surface-alt" />
              <div className="h-3 w-1/2 rounded bg-surface-alt" />
              <div className="h-3 w-1/3 rounded bg-surface-alt" />
            </div>
            <div className="h-7 w-7 shrink-0 rounded-full bg-surface-alt" />
            <div className="h-8 w-8 shrink-0 rounded-md bg-surface-alt" />
          </div>
        ))
        : users.map((user) => (
          <UserMemberCard
            key={user._id || user.id}
            user={user}
            actions={getActions(user)}
            onOpen={() => onOpenUser(user)}
            emptyValue={emptyValue}
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
  const { t } = useI18n();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ fullName: '', ageGroup: '', gender: '', role: '' });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(100);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState(getDefaultUsersViewMode);

  const queryParams = {
    limit, sort: 'createdAt', order: 'desc',
    accountStatus: visibleAccountStatus,
    ...(cursor && { cursor }),
    ...(filters.fullName && { fullName: filters.fullName }),
    ...(filters.ageGroup && { ageGroup: filters.ageGroup }),
    ...(filters.gender && { gender: filters.gender }),
    ...(filters.role && { role: filters.role }),
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: async () => {
      const { data } = await usersApi.list(queryParams);
      return data;
    },
    staleTime: 30000,
    keepPreviousData: true,
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

  const users = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta || null;

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCursor(null);
    setCursorStack([null]);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ fullName: '', ageGroup: '', gender: '', role: '' });
    setCursor(null);
    setCursorStack([null]);
  }, []);

  const handleNext = useCallback(() => {
    if (meta?.nextCursor && meta.nextCursor !== cursor) {
      setCursorStack((prev) => [...prev, meta.nextCursor]);
      setCursor(meta.nextCursor);
    }
  }, [cursor, meta?.nextCursor]);

  const handlePrev = useCallback(() => {
    setCursorStack((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      setCursor(next[next.length - 1] || null);
      return next;
    });
  }, []);

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

  const columns = useMemo(() => [
    {
      key: 'fullName',
      label: t('usersListPage.columns.name'),
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar?.url ? (
            <img
              src={row.avatar.url}
              alt=""
              className="h-8 w-8 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {getInitial(row.fullName)}
            </div>
          )}
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
    // {
    //   key: 'role',
    //   label: t('usersListPage.columns.role'),
    //   render: (row) => <Badge variant="primary">{getRoleLabel(row.role)}</Badge>,
    // },
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
    <div className="animate-fade-in space-y-8 pb-10">

      {/* ── Breadcrumbs ── */}
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users') },
        ]}
      />

      {/* ══ PAGE HEADER ═══════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        title={t('shared.users')}
        subtitle={t('usersListPage.hero.description')}
        actions={
          hasPermission('USERS_CREATE') ? (
            <Link to="/dashboard/users/new">
              <Button icon={Plus}>{t('usersListPage.actions.addUser')}</Button>
            </Link>
          ) : null
        }
      />

      {/* ══ KPI TILES ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* total on page */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              {t('usersListPage.stats.usersOnPage')}
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-alt text-muted">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-heading">{users.length}</p>
          <div className="mt-4 h-0.5 w-10 rounded-full bg-border" />
        </div>

        {/* active */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              {t('usersListPage.stats.activeAccounts')}
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-success-light text-success">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-success">{activeCount}</p>
          <div className="mt-4 h-0.5 w-10 rounded-full bg-success/40" />
        </div>

        {/* total users */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              {t('usersListPage.stats.totalUsers')}
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-primary">
            {totalUsersCount}
          </p>
          <div className="mt-4 h-0.5 w-10 rounded-full bg-primary/40" />
        </div>
      </div>

      {/* ══ FILTERS ═══════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('usersListPage.filters.title')}</SectionLabel>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t('usersListPage.filters.clear')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SearchInput
            value={filters.fullName}
            onChange={(v) => handleFilterChange('fullName', v)}
            placeholder={t('usersListPage.filters.searchByName')}
          />
          <Select
            options={AGE_GROUPS.map((g) => ({ value: g, label: g }))}
            value={filters.ageGroup}
            onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
            placeholder={t('usersListPage.filters.ageGroup')}
            containerClassName="!mb-0"
          />
          <Select
            options={genderOptions}
            value={filters.gender}
            onChange={(e) => handleFilterChange('gender', e.target.value)}
            placeholder={t('usersListPage.filters.gender')}
            containerClassName="!mb-0"
          />
          <Select
            options={roleOptions}
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            placeholder={t('usersListPage.filters.role')}
            containerClassName="!mb-0"
          />
        </div>
      </section>

      {/* ══ TABLE ═════════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>{t('usersListPage.table.title')}</SectionLabel>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              {t('usersListPage.table.results', { count: meta?.count ?? users.length })}
            </span>
            <ViewModeToggle value={viewMode} onChange={handleViewModeChange} t={t} />
          </div>
        </div>

        <div className="overflow-hidden tttable">
          {viewMode === 'cards' ? (
            <UsersCardsGrid
              users={users}
              loading={isLoading}
              skeletonRows={5}
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

          <div className="border-t border-border px-4 pb-4 pt-2">
            <Pagination
              meta={meta}
              onLoadMore={handleNext}
              onPrev={handlePrev}
              cursors={cursorStack}
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* ══ DELETE MODAL ══════════════════════════════════════════════════ */}
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
