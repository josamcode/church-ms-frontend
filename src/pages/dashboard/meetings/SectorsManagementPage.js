import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarRange,
  Clock,
  Layers3,
  Users,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Search,
  RotateCcw,
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
import StatCard from '../../../components/ui/StatCard';
import Table, { RowActions } from '../../../components/ui/Table';
import DataCard, { CardAvatar } from '../../../components/ui/DataCard';
import PageHeader from '../../../components/ui/PageHeader';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';

const SECTOR_PERMISSIONS = ['SECTORS_VIEW', 'SECTORS_CREATE', 'SECTORS_UPDATE', 'SECTORS_DELETE'];

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="section-label">{children}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export default function SectorsManagementPage() {
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission, hasAnyPermission } = useAuth();

  const canViewSectors = hasPermission('SECTORS_VIEW');
  const canCreateSectors = hasPermission('SECTORS_CREATE');
  const canUpdateSectors = hasPermission('SECTORS_UPDATE');
  const canDeleteSectors = hasPermission('SECTORS_DELETE');
  const canViewMeetings = hasPermission('MEETINGS_VIEW');
  const canManageSectorRows = canViewSectors || canUpdateSectors || canDeleteSectors;
  const canAccessSectorsModule = hasAnyPermission(SECTOR_PERMISSIONS);

  const [search, setSearch] = useState('');

  /* ── queries ── */
  const sectorsQuery = useQuery({
    queryKey: ['meetings', 'sectors', 'management', search],
    enabled: canViewSectors,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.sectors.list({
        limit: 200, order: 'asc',
        ...(search.trim() && { search: search.trim() }),
      });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const meetingsQuery = useQuery({
    queryKey: ['meetings', 'sectors', 'meetingCounts'],
    enabled: canViewSectors && canViewMeetings,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.list({ limit: 100, order: 'desc' });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const deleteSectorMutation = useMutation({
    mutationFn: (id) => meetingsApi.sectors.remove(id),
    onSuccess: () => {
      toast.success(t('meetings.messages.sectorDeleted'));
      queryClient.invalidateQueries({ queryKey: ['meetings', 'sectors'] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'list'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const sectors = useMemo(() => (Array.isArray(sectorsQuery.data) ? sectorsQuery.data : []), [sectorsQuery.data]);
  const meetings = useMemo(() => (Array.isArray(meetingsQuery.data) ? meetingsQuery.data : []), [meetingsQuery.data]);

  const meetingsCountBySector = useMemo(() =>
    meetings.reduce((acc, m) => {
      const id = m?.sector?.id;
      if (id) acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {}),
    [meetings]);

  const stats = useMemo(() => {
    const totalOfficials = sectors.reduce((s, sec) => s + (sec.officials || []).length, 0);
    const sectorsWithoutOfficials = sectors.filter((sec) => !(sec.officials || []).length).length;
    const linkedMeetings = sectors.reduce((s, sec) => s + (meetingsCountBySector[sec.id] || 0), 0);
    return { totalSectors: sectors.length, totalOfficials, sectorsWithoutOfficials, linkedMeetings };
  }, [sectors, meetingsCountBySector]);

  const coveredSectors = Math.max(stats.totalSectors - stats.sectorsWithoutOfficials, 0);

  /* ── row actions shared by the table column and the card view ── */
  const buildSectorActions = useCallback((row) => [
    { label: t('common.actions.view'), onClick: () => navigate(`/dashboard/meetings/sectors/${row.id}`) },
    ...(canUpdateSectors
      ? [{ label: t('common.actions.edit'), onClick: () => navigate(`/dashboard/meetings/sectors/${row.id}/edit`) }]
      : []),
    ...(canDeleteSectors
      ? [{ divider: true }, {
        label: t('common.actions.delete'),
        danger: true,
        onClick: () => {
          if (window.confirm(t('meetings.messages.confirmDeleteSector'))) {
            deleteSectorMutation.mutate(row.id);
          }
        },
      }]
      : []),
  ], [canDeleteSectors, canUpdateSectors, deleteSectorMutation, navigate, t]);

  /* ── columns ── */
  const sectorColumns = useMemo(() => [
    {
      key: 'name',
      label: t('meetings.columns.sector'),
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/dashboard/meetings/sectors/${row.id}`)}
          className="group flex items-center gap-3 text-start"
        >
          {row.avatar?.url ? (
            <img
              src={row.avatar.url}
              alt={row.name}
              className="h-10 w-10 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/12 text-xs font-bold text-secondary">
              {String(row.name || '').slice(0, 2).toUpperCase() || '--'}
            </span>
          )}
          <span className="font-semibold text-heading transition-colors group-hover:text-primary">
            {row.name}
          </span>
        </button>
      ),
    },
    {
      key: 'officials',
      label: t('meetings.columns.officials'),
      render: (row) => {
        const officials = row.officials || [];
        if (!officials.length) return <span className="text-sm text-muted">{t('common.placeholder.empty')}</span>;
        const top = officials.slice(0, 2).map((o) => o.name).filter(Boolean);
        const suffix = officials.length > 2 ? officials.length - 2 : 0;
        return (
          <span className="flex flex-wrap items-center gap-1.5">
            {top.map((name, i) => (
              <Badge key={`${name}-${i}`} variant="default" size="sm">{name}</Badge>
            ))}
            {suffix > 0 && <Badge variant="neutral" size="sm">{`+${suffix}`}</Badge>}
          </span>
        );
      },
    },
    {
      key: 'officialsCount',
      label: t('meetings.columns.officialsCount'),
      render: (row) => {
        const count = (row.officials || []).length;
        return (
          <Badge variant={count === 0 ? 'warning' : 'success'} size="sm" dot={count === 0}>
            {count}
          </Badge>
        );
      },
    },
    ...(canViewMeetings ? [{
      key: 'meetingsCount',
      label: t('meetings.columns.meetingsCount'),
      render: (row) => {
        const count = meetingsCountBySector[row.id] || 0;
        return <Badge variant={count > 0 ? 'primary' : 'neutral'} size="sm">{count}</Badge>;
      },
    }] : []),
    {
      key: 'updatedAt',
      label: t('meetings.columns.updatedAt'),
      render: (row) => <span className="text-xs text-muted">{formatDateTime(row.updatedAt)}</span>,
    },
    ...(canManageSectorRows ? [{
      key: 'actions',
      label: '',
      cellClassName: 'w-10',
      render: (row) => <RowActions actions={buildSectorActions(row)} />,
    }] : []),
  ], [buildSectorActions, canManageSectorRows, canViewMeetings, meetingsCountBySector, navigate, t]);

  /* ── bespoke mobile card: sector avatar, official coverage badge, and the
        officials + meeting-count + last-update metadata ── */
  const renderSectorCard = (row) => {
    const officialsCount = (row.officials || []).length;
    const meetingsCount = meetingsCountBySector[row.id] || 0;
    return (
      <DataCard
        accent="gold"
        onClick={() => navigate(`/dashboard/meetings/sectors/${row.id}`)}
        leading={<CardAvatar name={row.name} src={row.avatar?.url} tone="gold" />}
        title={row.name}
        badge={
          <Badge variant={officialsCount === 0 ? 'warning' : 'success'} size="sm" dot={officialsCount === 0}>
            {t('meetings.columns.officialsCount')}: {officialsCount}
          </Badge>
        }
        subtitle={
          officialsCount ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {(row.officials || []).slice(0, 3).map((o) => o.name).filter(Boolean).join('، ')}
            </span>
          ) : (
            <span className="text-muted">{t('common.placeholder.empty')}</span>
          )
        }
        meta={
          <>
            {canViewMeetings ? (
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                {t('meetings.columns.meetingsCount')}: {meetingsCount}
              </span>
            ) : null}
            {row.updatedAt ? (
              <>
                {canViewMeetings ? <span aria-hidden="true">·</span> : null}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(row.updatedAt)}
                </span>
              </>
            ) : null}
          </>
        }
        actions={canManageSectorRows ? <RowActions actions={buildSectorActions(row)} /> : null}
      />
    );
  };

  /* ── guard ── */
  if (!canAccessSectorsModule) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={[{ label: t('shared.dashboard'), href: '/dashboard' }, { label: t('meetings.sectorsPageTitle') }]} />
        <Card tone="muted" padding="lg">
          <EmptyState icon={ShieldCheck} title={t('meetings.empty.noSectorsPermissionTitle')} description={t('meetings.empty.noSectorsPermissionDescription')} />
        </Card>
      </div>
    );
  }

  /* ── kpi config ── */
  const kpiTiles = [
    { label: t('meetings.dashboard.cards.totalSectors'), value: stats.totalSectors, icon: Layers3, tone: 'primary' },
    { label: t('meetings.columns.officialsCount'), value: stats.totalOfficials, icon: Users, tone: 'gold' },
    {
      label: t('meetings.dashboard.cards.sectorsWithoutOfficials'),
      value: stats.sectorsWithoutOfficials,
      icon: AlertTriangle,
      tone: stats.sectorsWithoutOfficials > 0 ? 'warning' : 'success',
      hint: `${coveredSectors} / ${stats.totalSectors}`,
    },
    ...(canViewMeetings
      ? [{ label: t('meetings.columns.meetingsCount'), value: stats.linkedMeetings, icon: BarChart3, tone: 'info' }]
      : []),
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('meetings.sectorsPageTitle') },
        ]}
      />

      {/* ══ HEADER ════════════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('shared.dashboard')}
        title={t('meetings.sectorsPageTitle')}
        subtitle={t('meetings.sectorsPageSubtitle')}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" icon={CalendarRange} onClick={() => navigate('/dashboard/meetings')}>
              {t('meetings.actions.openDashboard')}
            </Button>
            {canCreateSectors && (
              <Button icon={Layers3} onClick={() => navigate('/dashboard/meetings/sectors/new')}>
                {t('meetings.actions.addSector')}
              </Button>
            )}
          </div>
        )}
      />

      {/* ══ KPI STRIP ═════════════════════════════════════════════════════ */}
      {canViewSectors && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {kpiTiles.map(({ label, value, icon: Icon, tone, hint }) => (
            <StatCard key={label} icon={Icon} label={label} value={value} tone={tone} hint={hint} isRTL={isRTL} />
          ))}
        </div>
      )}

      {/* ══ SEARCH ════════════════════════════════════════════════════════ */}
      {canViewSectors && (
        <Card padding="sm" tone="muted" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="h-3.5 w-3.5" />
            </span>
            <span className="section-label">{t('meetings.filters.search')}</span>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('meetings.filters.searchSectorsPlaceholder')}
            containerClassName="!mb-0"
            className="w-full"
          />
        </Card>
      )}

      {/* ══ TABLE ═════════════════════════════════════════════════════════ */}
      {canViewSectors ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>{t('meetings.sections.sectors')}</SectionLabel>
            <Badge variant="neutral" size="sm">{sectors.length}</Badge>
          </div>

          {sectorsQuery.isError ? (
            <Card tone="muted" padding="lg">
              <EmptyState
                icon={AlertTriangle}
                title={t('meetings.empty.sectorsTitle')}
                description={normalizeApiError(sectorsQuery.error).message}
                action={(
                  <Button variant="outline" icon={RotateCcw} onClick={() => sectorsQuery.refetch()}>
                    {t('common.actions.loadMore')}
                  </Button>
                )}
              />
            </Card>
          ) : (
            <Table
              columns={sectorColumns}
              data={sectors}
              loading={sectorsQuery.isLoading || (canViewMeetings && meetingsQuery.isLoading)}
              emptyTitle={t('meetings.empty.sectorsTitle')}
              emptyDescription={t('meetings.empty.sectorsDescription')}
              emptyIcon={Layers3}
              renderCard={renderSectorCard}
            />
          )}
        </section>
      ) : (
        <Card tone="muted" padding="lg">
          <EmptyState
            icon={ShieldCheck}
            title={t('meetings.empty.noSectorsPermissionTitle')}
            description={t('meetings.empty.noSectorsPermissionDescription')}
          />
        </Card>
      )}

    </div>
  );
}
