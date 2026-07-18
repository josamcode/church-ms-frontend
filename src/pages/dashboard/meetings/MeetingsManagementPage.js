import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  CalendarPlus,
  Users,
  Layers3,
  ListChecks,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Filter,
  CalendarClock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeApiError } from '../../../api/errors';
import { meetingsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import Table, { RowActions } from '../../../components/ui/Table';
import DataCard, { CardAvatar } from '../../../components/ui/DataCard';
import PageHeader from '../../../components/ui/PageHeader';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { getDayLabel, getDayOptions } from './meetingsForm.utils';

const MEETING_PERMISSIONS = [
  'MEETINGS_VIEW_OWN',
  'MEETINGS_VIEW', 'MEETINGS_CREATE', 'MEETINGS_UPDATE', 'MEETINGS_DELETE',
  'MEETINGS_SERVANTS_MANAGE', 'MEETINGS_COMMITTEES_MANAGE', 'MEETINGS_ACTIVITIES_MANAGE',
];

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="section-label">{children}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export default function MeetingsManagementPage() {
  const { t, isRTL } = useI18n();
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAnyPermission, hasPermission } = useAuth();

  const canViewMeetings = hasPermission('MEETINGS_VIEW');
  const canViewOwnMeetings = hasPermission('MEETINGS_VIEW_OWN');
  const canCreateMeetings = hasPermission('MEETINGS_CREATE');
  const canUpdateMeetings = hasPermission('MEETINGS_UPDATE');
  const canUpdateMeetingsSections =
    hasPermission('MEETINGS_SERVANTS_MANAGE') ||
    hasPermission('MEETINGS_COMMITTEES_MANAGE') ||
    hasPermission('MEETINGS_ACTIVITIES_MANAGE');
  const canDeleteMeetings = hasPermission('MEETINGS_DELETE');
  const canViewMeetingsList =
    canViewMeetings ||
    canViewOwnMeetings ||
    canUpdateMeetings ||
    canUpdateMeetingsSections ||
    canDeleteMeetings;
  const meetingsListTitle = (canViewMeetings || canUpdateMeetings || canUpdateMeetingsSections || canDeleteMeetings)
    ? t('meetings.meetingsPageTitle')
    : tf('meetings.myMeetingsPageTitle', 'My Meetings');
  const canManageMeetingRows =
    canViewMeetingsList || canUpdateMeetings || canUpdateMeetingsSections || canDeleteMeetings;
  const canAccessMeetingsModule = hasAnyPermission(MEETING_PERMISSIONS);
  const canViewSectors = hasPermission('SECTORS_VIEW');

  const [filters, setFilters] = useState({ sectorId: '', day: '', search: '' });

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  /* ── queries ── */
  const sectorsQuery = useQuery({
    queryKey: ['meetings', 'list', 'sectors'],
    enabled: canViewMeetings || canCreateMeetings || canUpdateMeetings || canViewSectors,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.sectors.list({ limit: 200, order: 'asc' });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const meetingsQuery = useQuery({
    queryKey: ['meetings', 'list', filters],
    enabled: canViewMeetingsList,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.list({
        limit: 100,
        order: 'desc',
        ...(filters.sectorId && { sectorId: filters.sectorId }),
        ...(filters.day && { day: filters.day }),
        ...(filters.search.trim() && { search: filters.search.trim() }),
      });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id) => meetingsApi.meetings.remove(id),
    onSuccess: () => {
      toast.success(t('meetings.messages.meetingDeleted'));
      queryClient.invalidateQueries({ queryKey: ['meetings', 'list'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const sectors = useMemo(() => (Array.isArray(sectorsQuery.data) ? sectorsQuery.data : []), [sectorsQuery.data]);
  const meetings = useMemo(() => (Array.isArray(meetingsQuery.data) ? meetingsQuery.data : []), [meetingsQuery.data]);

  const sectorOptions = sectors.map((s) => ({ value: s.id, label: s.name }));
  const dayOptions = getDayOptions(t);

  /* ── stats ── */
  const stats = useMemo(() => {
    const r = { totalMeetings: meetings.length, totalServants: 0, totalCommittees: 0, totalActivities: 0, totalGroups: 0, meetingsWithoutServants: 0 };
    meetings.forEach((m) => {
      const sc = (m.servants || []).length;
      const cc = (m.committees || []).length;
      const ac = (m.activities || []).length;
      const gc = (m.groups || []).length;
      r.totalServants += sc;
      r.totalCommittees += cc;
      r.totalActivities += ac;
      r.totalGroups += gc;
      if (!sc) r.meetingsWithoutServants += 1;
    });
    return r;
  }, [meetings]);

  const coveredMeetings = Math.max(stats.totalMeetings - stats.meetingsWithoutServants, 0);

  /* ── row actions shared by the table column and the card view ── */
  const buildMeetingActions = useCallback((row) => [
    ...(canViewMeetingsList
      ? [{ label: t('common.actions.view'), onClick: () => navigate(`/dashboard/meetings/list/${row.id}`) }]
      : []),
    ...((canUpdateMeetings || canUpdateMeetingsSections)
      ? [{ label: t('common.actions.edit'), onClick: () => navigate(`/dashboard/meetings/${row.id}/edit`) }]
      : []),
    ...(canDeleteMeetings
      ? [{ divider: true }, {
        label: t('common.actions.delete'),
        danger: true,
        onClick: () => {
          if (window.confirm(t('meetings.messages.confirmDeleteMeeting'))) {
            deleteMeetingMutation.mutate(row.id);
          }
        },
      }]
      : []),
  ], [canDeleteMeetings, canUpdateMeetings, canUpdateMeetingsSections, canViewMeetingsList, deleteMeetingMutation, navigate, t]);

  /* ── columns ── */
  const meetingColumns = useMemo(() => [
    {
      key: 'name',
      label: t('meetings.columns.meeting'),
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/dashboard/meetings/list/${row.id}`)}
          className="group flex items-center gap-3 text-start"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-heading transition-colors group-hover:text-primary">
              {row.name}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {getDayLabel(row.day, t)} · {row.time}
            </span>
          </span>
        </button>
      ),
    },
    {
      key: 'sector',
      label: t('meetings.columns.sector'),
      render: (row) => row.sector?.name
        ? <Badge variant="gold" dot>{row.sector.name}</Badge>
        : <span className="text-muted text-sm">{t('common.placeholder.empty')}</span>,
    },
    {
      key: 'schedule',
      label: t('meetings.columns.schedule'),
      render: (row) => (
        <Badge variant="neutral" size="sm">
          {getDayLabel(row.day, t)} · {row.time}
        </Badge>
      ),
    },
    {
      key: 'groupsCount',
      label: t('meetings.columns.groupsCount'),
      render: (row) => <span className="text-sm font-semibold text-heading">{(row.groups || []).length}</span>,
    },
    {
      key: 'servantsCount',
      label: t('meetings.columns.servantsCount'),
      render: (row) => {
        const count = (row.servants || []).length;
        return count === 0
          ? <Badge variant="warning" size="sm" dot>{count}</Badge>
          : <Badge variant="success" size="sm">{count}</Badge>;
      },
    },
    {
      key: 'committeesCount',
      label: t('meetings.columns.committeesCount'),
      render: (row) => <span className="text-sm text-heading">{(row.committees || []).length}</span>,
    },
    {
      key: 'updatedAt',
      label: t('meetings.columns.updatedAt'),
      render: (row) => <span className="text-xs text-muted">{formatDateTime(row.updatedAt)}</span>,
    },
    ...(canManageMeetingRows ? [{
      key: 'actions',
      label: '',
      cellClassName: 'w-10',
      render: (row) => <RowActions actions={buildMeetingActions(row)} />,
    }] : []),
  ], [buildMeetingActions, canManageMeetingRows, navigate, t]);

  /* ── bespoke mobile card: meeting identity + schedule, with servant coverage
        and group/committee counts as scannable metadata ── */
  const renderMeetingCard = (row) => {
    const servantsCount = (row.servants || []).length;
    return (
      <DataCard
        accent="primary"
        onClick={() => navigate(`/dashboard/meetings/list/${row.id}`)}
        leading={<CardAvatar icon={CalendarClock} tone="primary" />}
        title={row.name}
        badge={
          row.sector?.name ? (
            <Badge variant="gold" size="sm" dot>{row.sector.name}</Badge>
          ) : null
        }
        subtitle={
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {getDayLabel(row.day, t)} · {row.time}
          </span>
        }
        meta={
          <>
            <span className={`inline-flex items-center gap-1 ${servantsCount === 0 ? 'text-warning' : ''}`}>
              <Users className="h-3.5 w-3.5" />
              {t('meetings.columns.servantsCount')}: {servantsCount}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Layers3 className="h-3.5 w-3.5" />
              {t('meetings.columns.groupsCount')}: {(row.groups || []).length}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {t('meetings.columns.committeesCount')}: {(row.committees || []).length}
            </span>
          </>
        }
        actions={canManageMeetingRows ? <RowActions actions={buildMeetingActions(row)} /> : null}
      />
    );
  };

  /* ── guard ── */
  if (!canAccessMeetingsModule) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={[{ label: t('shared.dashboard'), href: '/dashboard' }, { label: meetingsListTitle }]} />
        <Card tone="muted" padding="lg">
          <EmptyState icon={ShieldCheck} title={t('meetings.empty.noMeetingsPermissionTitle')} description={t('meetings.empty.noMeetingsPermissionDescription')} />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: meetingsListTitle },
        ]}
      />

      {/* ══ HEADER ════════════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('shared.dashboard')}
        title={meetingsListTitle}
        subtitle={t('meetings.meetingsPageSubtitle')}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" icon={BarChart3} onClick={() => navigate('/dashboard/meetings')}>
              {t('meetings.actions.openDashboard')}
            </Button>
            {canCreateMeetings && (
              <Button icon={CalendarPlus} onClick={() => navigate('/dashboard/meetings/new')}>
                {t('meetings.actions.addMeeting')}
              </Button>
            )}
          </div>
        )}
      />

      {/* ══ KPI STRIP ═════════════════════════════════════════════════════ */}
      {canViewMeetingsList && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard
            icon={ListChecks}
            label={t('meetings.dashboard.cards.totalMeetings')}
            value={stats.totalMeetings}
            tone="primary"
            isRTL={isRTL}
          />
          <StatCard
            icon={Users}
            label={t('meetings.dashboard.cards.totalServants')}
            value={stats.totalServants}
            tone="gold"
            isRTL={isRTL}
          />
          <StatCard
            icon={Layers3}
            label={t('meetings.columns.groupsCount')}
            value={stats.totalGroups}
            tone="info"
            isRTL={isRTL}
          />
          <StatCard
            icon={Layers3}
            label={t('meetings.columns.committeesCount')}
            value={stats.totalCommittees}
            tone="default"
            isRTL={isRTL}
          />
          <StatCard
            icon={AlertTriangle}
            label={t('meetings.dashboard.cards.meetingsWithoutServants')}
            value={stats.meetingsWithoutServants}
            tone={stats.meetingsWithoutServants > 0 ? 'warning' : 'success'}
            hint={`${coveredMeetings} / ${stats.totalMeetings}`}
            isRTL={isRTL}
          />
        </div>
      )}

      {/* ══ FILTERS ═══════════════════════════════════════════════════════ */}
      {canViewMeetingsList && (
        <Card padding="sm" tone="muted" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Filter className="h-3.5 w-3.5" />
              </span>
              <span className="section-label">{t('meetings.filters.sector')}</span>
              {hasActiveFilters && (
                <Badge variant="primary" size="sm">{activeFilterCount}</Badge>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => setFilters({ sectorId: '', day: '', search: '' })}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t('usersListPage.filters.clear')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Select
              value={filters.sectorId}
              onChange={(e) => setFilter('sectorId', e.target.value)}
              options={[{ value: '', label: t('meetings.filters.allSectors') }, ...sectorOptions]}
              placeholder={t('meetings.filters.allSectors')}
              containerClassName="!mb-0"
            />
            <Select
              value={filters.day}
              onChange={(e) => setFilter('day', e.target.value)}
              options={[{ value: '', label: t('meetings.filters.allDays') }, ...dayOptions]}
              placeholder={t('meetings.filters.allDays')}
              containerClassName="!mb-0"
            />
            <Input
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder={t('meetings.filters.searchPlaceholder')}
              containerClassName="!mb-0"
            />
          </div>
        </Card>
      )}

      {/* ══ TABLE ═════════════════════════════════════════════════════════ */}
      {canViewMeetingsList ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>{t('meetings.sections.meetings')}</SectionLabel>
            <Badge variant="neutral" size="sm">{meetings.length}</Badge>
          </div>

          {meetingsQuery.isError ? (
            <Card tone="muted" padding="lg">
              <EmptyState
                icon={AlertTriangle}
                title={t('meetings.empty.meetingsTitle')}
                description={normalizeApiError(meetingsQuery.error).message}
                action={(
                  <Button variant="outline" icon={RotateCcw} onClick={() => meetingsQuery.refetch()}>
                    {t('common.actions.loadMore')}
                  </Button>
                )}
              />
            </Card>
          ) : (
            <Table
              columns={meetingColumns}
              data={meetings}
              loading={meetingsQuery.isLoading}
              emptyTitle={t('meetings.empty.meetingsTitle')}
              emptyDescription={t('meetings.empty.meetingsDescription')}
              emptyIcon={CalendarClock}
              renderCard={renderMeetingCard}
            />
          )}
        </section>
      ) : (
        <Card tone="muted" padding="lg">
          <EmptyState
            icon={ShieldCheck}
            title={t('meetings.empty.noMeetingsPermissionTitle')}
            description={t('meetings.empty.noMeetingsPermissionDescription')}
          />
        </Card>
      )}

    </div>
  );
}
