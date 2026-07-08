import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Edit, Lock, Unlock, Trash2, X,
  Users, UserCheck, Flame, LayoutGrid, TableProperties, SlidersHorizontal, Phone,
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
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
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

/** Compact inline KPI pill — lives in the header so it never eats the first mobile screen. */
function StatPill({ icon: Icon, label, value, tone = 'default' }) {
  const tones = {
    default: 'bg-surface-alt/70 text-muted ring-border/60',
    primary: 'bg-primary/10 text-primary ring-primary/15',
    success: 'bg-success-light text-success ring-success/20',
    danger: 'bg-danger-light text-danger ring-danger/20',
    gold: 'bg-secondary/10 text-secondary ring-secondary/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone] || tones.default}`}
      title={label}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      <span className="tabular-nums">{value}</span>
      <span className="font-medium opacity-80">{label}</span>
    </span>
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

function UserMemberCard({ user, actions, onOpen, emptyValue, t }) {
  const phone = getUserPhone(user);
  const avatarClassName = getAvatarToneClass(user.gender);

  return (
    <article
      dir="rtl"
      className="group relative flex items-center gap-3 rounded-2xl border border-border/80 bg-surface p-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
    >
      <button
        type="button"
        onClick={onOpen}
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 text-sm font-bold ring-2 ring-offset-2 ring-offset-surface transition-colors ${avatarClassName}`}
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
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium leading-4 text-muted/90">
          <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span dir="ltr" className="truncate">{phone || emptyValue}</span>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        <AgeGroupBadge ageGroup={user.ageGroup} />
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
  t,
}) {
  if (!loading && users.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface shadow-card">
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
            className="flex animate-pulse items-center gap-3 rounded-2xl border border-border/80 bg-surface p-3 shadow-card"
          >
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-surface-alt" />
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
  const { t } = useI18n();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ fullName: '', ageGroup: '', gender: '', role: '' });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(100);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState(getDefaultUsersViewMode);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

      {/* ══ HEADER — title, KPI pills, primary action (compact, first-screen) ═══ */}
      <header className="space-y-3">
        <Breadcrumbs
          items={[
            { label: t('shared.dashboard'), href: '/dashboard' },
            { label: t('shared.users') },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">
              {t('shared.users')}
            </h1>
            <p className="mt-1 text-sm text-muted">{t('usersListPage.hero.description')}</p>
          </div>

          {hasPermission('USERS_CREATE') ? (
            <Link to="/dashboard/users/new" className="hidden shrink-0 sm:block">
              <Button icon={Plus}>{t('usersListPage.actions.addUser')}</Button>
            </Link>
          ) : null}
        </div>

        {/* KPI pills — numbers without eating the first mobile screen */}
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon={Users} label={t('usersListPage.stats.totalUsers')} value={totalUsersCount} tone="primary" />
          <StatPill icon={UserCheck} label={t('usersListPage.stats.activeAccounts')} value={activeCount} tone="success" />
          <StatPill icon={Lock} label={t('usersListPage.stats.lockedAccounts')} value={lockedCount} tone={lockedCount > 0 ? 'danger' : 'default'} />
          <StatPill icon={LayoutGrid} label={t('usersListPage.stats.usersOnPage')} value={users.length} tone="gold" />
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
            className="relative shrink-0"
            aria-label={t('usersListPage.filters.title')}
          >
            <span className="hidden sm:inline">{t('usersListPage.filters.title')}</span>
            {activeFilterCount > 0 ? (
              <span className="ms-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
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
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-danger"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t('usersListPage.filters.clear')}
            </button>
          </div>
        ) : null}
      </div>

      {/* ══ LIST ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-heading">{t('usersListPage.table.title')}</h2>
          <Badge variant="secondary">
            {t('usersListPage.table.results', { count: meta?.count ?? users.length })}
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

          <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
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

      {/* ══ MOBILE STICKY "ADD USER" ══════════════════════════════════════════ */}
      {hasPermission('USERS_CREATE') ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 shadow-lg backdrop-blur-sm sm:hidden">
          <Link to="/dashboard/users/new" className="block">
            <Button icon={Plus} fullWidth size="lg">{t('usersListPage.actions.addUser')}</Button>
          </Link>
        </div>
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
