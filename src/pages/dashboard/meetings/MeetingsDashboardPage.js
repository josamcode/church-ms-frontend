import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarPlus,
  Layers3,
  ListChecks,
  Users,
} from 'lucide-react';
import { meetingsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { DAY_VALUES, getDayLabel } from './meetingsForm.utils';

const SECTOR_PERMISSIONS = ['SECTORS_VIEW', 'SECTORS_CREATE', 'SECTORS_UPDATE', 'SECTORS_DELETE'];
const MEETING_PERMISSIONS = [
  'MEETINGS_VIEW',
  'MEETINGS_CREATE',
  'MEETINGS_UPDATE',
  'MEETINGS_DELETE',
  'MEETINGS_SERVANTS_MANAGE',
  'MEETINGS_COMMITTEES_MANAGE',
  'MEETINGS_ACTIVITIES_MANAGE',
  'MEETINGS_RESPONSIBILITIES_VIEW',
  'MEETINGS_SERVANT_HISTORY_VIEW',
];

export default function MeetingsDashboardPage() {
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();

  const canViewSectors = hasPermission('SECTORS_VIEW');
  const canViewMeetings = hasPermission('MEETINGS_VIEW');
  const canViewResponsibilities = hasPermission('MEETINGS_RESPONSIBILITIES_VIEW');
  const canCreateSectors = hasPermission('SECTORS_CREATE');
  const canCreateMeetings = hasPermission('MEETINGS_CREATE');

  const canManageSectors = hasAnyPermission(SECTOR_PERMISSIONS);
  const canManageMeetings = hasAnyPermission(MEETING_PERMISSIONS);

  const sectorsQuery = useQuery({
    queryKey: ['meetings', 'dashboard', 'sectors'],
    enabled: canViewSectors,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await meetingsApi.sectors.list({ limit: 200, order: 'asc' });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const meetingsQuery = useQuery({
    queryKey: ['meetings', 'dashboard', 'meetings'],
    enabled: canViewMeetings,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.list({ limit: 100, order: 'desc' });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const responsibilitiesQuery = useQuery({
    queryKey: ['meetings', 'dashboard', 'responsibilities'],
    enabled: canViewResponsibilities,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await meetingsApi.responsibilities.list({ limit: 8 });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const sectors = useMemo(
    () => (Array.isArray(sectorsQuery.data) ? sectorsQuery.data : []),
    [sectorsQuery.data]
  );
  const meetings = useMemo(
    () => (Array.isArray(meetingsQuery.data) ? meetingsQuery.data : []),
    [meetingsQuery.data]
  );
  const responsibilities = useMemo(
    () => (Array.isArray(responsibilitiesQuery.data) ? responsibilitiesQuery.data : []),
    [responsibilitiesQuery.data]
  );

  const summary = useMemo(() => {
    const result = {
      totalSectors: sectors.length,
      totalMeetings: meetings.length,
      totalServants: 0,
      totalCommittees: 0,
      totalActivities: 0,
      uniqueServedUsers: 0,
      sectorsWithoutOfficials: 0,
      meetingsWithoutServants: 0,
      meetingsWithoutActivities: 0,
      meetingsWithoutCommittees: 0,
    };

    const servedUsers = new Set();

    sectors.forEach((sector) => {
      if (!(sector.officials || []).length) {
        result.sectorsWithoutOfficials += 1;
      }
    });

    meetings.forEach((meeting) => {
      const servantsCount = (meeting.servants || []).length;
      const committeesCount = (meeting.committees || []).length;
      const activitiesCount = (meeting.activities || []).length;

      result.totalServants += servantsCount;
      result.totalCommittees += committeesCount;
      result.totalActivities += activitiesCount;

      if (!servantsCount) result.meetingsWithoutServants += 1;
      if (!committeesCount) result.meetingsWithoutCommittees += 1;
      if (!activitiesCount) result.meetingsWithoutActivities += 1;

      (meeting.servedUsers || []).forEach((user) => {
        const userId = user?.id || user?._id;
        if (userId) servedUsers.add(String(userId));
      });
    });

    result.uniqueServedUsers = servedUsers.size;
    return result;
  }, [sectors, meetings]);

  const sectorHealth = useMemo(() => {
    const bySector = new Map();

    const getKey = (sector) => String(sector?.id || sector?._id || sector?.name || 'unknown');
    const getName = (sector) => sector?.name || t('common.placeholder.empty');

    sectors.forEach((sector) => {
      const key = getKey(sector);
      bySector.set(key, {
        id: sector.id || sector._id || key,
        name: sector.name,
        officialsCount: (sector.officials || []).length,
        meetingsCount: 0,
        servantsCount: 0,
        activitiesCount: 0,
      });
    });

    meetings.forEach((meeting) => {
      const key = getKey(meeting.sector || {});
      const current = bySector.get(key) || {
        id: meeting.sector?.id || key,
        name: getName(meeting.sector),
        officialsCount: 0,
        meetingsCount: 0,
        servantsCount: 0,
        activitiesCount: 0,
      };

      current.meetingsCount += 1;
      current.servantsCount += (meeting.servants || []).length;
      current.activitiesCount += (meeting.activities || []).length;
      bySector.set(key, current);
    });

    return [...bySector.values()].sort((a, b) => {
      if (b.meetingsCount !== a.meetingsCount) return b.meetingsCount - a.meetingsCount;
      return b.servantsCount - a.servantsCount;
    });
  }, [sectors, meetings, t]);

  const weeklyLoad = useMemo(() => {
    const counts = meetings.reduce((acc, meeting) => {
      const day = meeting?.day;
      if (!day) return acc;
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return DAY_VALUES.map((day) => ({
      day,
      label: getDayLabel(day, t),
      count: counts[day] || 0,
    }));
  }, [meetings, t]);

  const maxDailyLoad = Math.max(...weeklyLoad.map((entry) => entry.count), 1);

  const kpiCards = [
    canViewSectors
      ? { key: 'sectors', label: t('meetings.dashboard.cards.totalSectors'), value: summary.totalSectors, variant: 'default' }
      : null,
    canViewMeetings
      ? { key: 'meetings', label: t('meetings.dashboard.cards.totalMeetings'), value: summary.totalMeetings, variant: 'default' }
      : null,
    canViewMeetings
      ? { key: 'servants', label: t('meetings.dashboard.cards.totalServants'), value: summary.totalServants, variant: 'primary' }
      : null,
    canViewMeetings
      ? { key: 'servedUsers', label: t('meetings.dashboard.cards.servedUsers'), value: summary.uniqueServedUsers, variant: 'primary' }
      : null,
    canViewSectors
      ? {
          key: 'missingOfficials',
          label: t('meetings.dashboard.cards.sectorsWithoutOfficials'),
          value: summary.sectorsWithoutOfficials,
          variant: summary.sectorsWithoutOfficials > 0 ? 'warning' : 'success',
        }
      : null,
    canViewMeetings
      ? {
          key: 'missingServants',
          label: t('meetings.dashboard.cards.meetingsWithoutServants'),
          value: summary.meetingsWithoutServants,
          variant: summary.meetingsWithoutServants > 0 ? 'danger' : 'success',
        }
      : null,
  ].filter(Boolean);

  const actionItems = [
    canViewSectors
      ? {
          key: 'sectorsWithoutOfficials',
          title: t('meetings.dashboard.actionItems.sectorsWithoutOfficialsTitle'),
          description: t('meetings.dashboard.actionItems.sectorsWithoutOfficialsDesc', {
            count: summary.sectorsWithoutOfficials,
          }),
          count: summary.sectorsWithoutOfficials,
          href: '/dashboard/meetings/sectors',
          variant: summary.sectorsWithoutOfficials > 0 ? 'warning' : 'success',
        }
      : null,
    canViewMeetings
      ? {
          key: 'meetingsWithoutServants',
          title: t('meetings.dashboard.actionItems.meetingsWithoutServantsTitle'),
          description: t('meetings.dashboard.actionItems.meetingsWithoutServantsDesc', {
            count: summary.meetingsWithoutServants,
          }),
          count: summary.meetingsWithoutServants,
          href: '/dashboard/meetings/list',
          variant: summary.meetingsWithoutServants > 0 ? 'danger' : 'success',
        }
      : null,
    canViewMeetings
      ? {
          key: 'meetingsWithoutActivities',
          title: t('meetings.dashboard.actionItems.meetingsWithoutActivitiesTitle'),
          description: t('meetings.dashboard.actionItems.meetingsWithoutActivitiesDesc', {
            count: summary.meetingsWithoutActivities,
          }),
          count: summary.meetingsWithoutActivities,
          href: '/dashboard/meetings/list',
          variant: summary.meetingsWithoutActivities > 0 ? 'warning' : 'success',
        }
      : null,
    canViewMeetings
      ? {
          key: 'meetingsWithoutCommittees',
          title: t('meetings.dashboard.actionItems.meetingsWithoutCommitteesTitle'),
          description: t('meetings.dashboard.actionItems.meetingsWithoutCommitteesDesc', {
            count: summary.meetingsWithoutCommittees,
          }),
          count: summary.meetingsWithoutCommittees,
          href: '/dashboard/meetings/list',
          variant: summary.meetingsWithoutCommittees > 0 ? 'warning' : 'success',
        }
      : null,
  ].filter(Boolean);

  if (!canManageSectors && !canManageMeetings) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs
          items={[
            { label: t('shared.dashboard'), href: '/dashboard' },
            { label: t('meetings.dashboardTitle') },
          ]}
        />
        <EmptyState
          title={t('meetings.dashboard.status.noPermissionsTitle')}
          description={t('meetings.dashboard.status.noPermissionsDescription')}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('meetings.dashboardTitle') },
        ]}
      />

      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">{t('meetings.dashboardTitle')}</h1>
            <p className="mt-1 text-sm text-muted">{t('meetings.dashboardSubtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={Layers3} onClick={() => navigate('/dashboard/meetings/sectors')}>
              {t('meetings.actions.manageSectors')}
            </Button>
            <Button variant="outline" icon={ListChecks} onClick={() => navigate('/dashboard/meetings/list')}>
              {t('meetings.actions.manageMeetings')}
            </Button>
            {canCreateSectors && (
              <Button variant="ghost" icon={Layers3} onClick={() => navigate('/dashboard/meetings/sectors/new')}>
                {t('meetings.actions.addSector')}
              </Button>
            )}
            {canCreateMeetings && (
              <Button icon={CalendarPlus} onClick={() => navigate('/dashboard/meetings/new')}>
                {t('meetings.actions.addMeeting')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {kpiCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kpiCards.map((item) => (
            <Card key={item.key} className="p-4">
              <p className="text-xs text-muted">{item.label}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-heading">{item.value}</p>
                <Badge variant={item.variant}>{item.value}</Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('meetings.dashboard.status.noData')}
          description={t('meetings.empty.noDashboardDataDescription')}
        />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={t('meetings.dashboard.sections.sectorHealth')}
            subtitle={t('meetings.dashboard.sections.sectorHealthSubtitle')}
          />
          {sectorsQuery.isLoading || meetingsQuery.isLoading ? (
            <p className="text-sm text-muted">{t('common.loading')}</p>
          ) : sectorHealth.length === 0 ? (
            <EmptyState
              title={t('meetings.empty.noDashboardDataTitle')}
              description={t('meetings.empty.noDashboardDataDescription')}
            />
          ) : (
            <div className="space-y-2">
              {sectorHealth.slice(0, 8).map((sector) => (
                <div
                  key={sector.id}
                  className="rounded-xl border border-border/80 bg-surface-alt/40 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-heading">{sector.name}</p>
                    <Badge variant={sector.meetingsCount > 0 ? 'primary' : 'default'}>
                      {sector.meetingsCount} {t('meetings.dashboard.labels.meetings')}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                    <span>{sector.officialsCount} {t('meetings.dashboard.labels.officials')}</span>
                    <span>{sector.servantsCount} {t('meetings.dashboard.labels.servants')}</span>
                    <span>{sector.activitiesCount} {t('meetings.dashboard.labels.activities')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title={t('meetings.dashboard.sections.weeklyLoad')}
            subtitle={t('meetings.dashboard.sections.weeklyLoadSubtitle')}
          />
          {meetingsQuery.isLoading ? (
            <p className="text-sm text-muted">{t('common.loading')}</p>
          ) : weeklyLoad.every((entry) => entry.count === 0) ? (
            <EmptyState
              title={t('meetings.empty.noDashboardDataTitle')}
              description={t('meetings.empty.noDashboardDataDescription')}
            />
          ) : (
            <div className="space-y-2.5">
              {weeklyLoad.map((entry) => (
                <div key={entry.day}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-heading">{entry.label}</span>
                    <span className="text-muted">{entry.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-alt">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.max((entry.count / maxDailyLoad) * 100, entry.count ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={t('meetings.dashboard.sections.actionCenter')}
            subtitle={t('meetings.dashboard.sections.actionCenterSubtitle')}
          />
          {actionItems.length === 0 ? (
            <EmptyState
              title={t('meetings.dashboard.status.noData')}
              description={t('meetings.dashboard.status.noData')}
            />
          ) : (
            <div className="space-y-3">
              {actionItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className="group block rounded-xl border border-border bg-surface-alt/40 p-3 transition-colors hover:border-primary/30 hover:bg-surface-alt"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-heading">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">{item.description}</p>
                    </div>
                    <Badge variant={item.variant}>{item.count}</Badge>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    {t('common.actions.view')}
                    <ArrowUpRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        isRTL ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
                      }`}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title={t('meetings.dashboard.sections.responsibilities')}
            subtitle={t('meetings.dashboard.sections.responsibilitiesSubtitle')}
          />
          {!canViewResponsibilities ? (
            <EmptyState
              title={t('meetings.dashboard.status.noData')}
              description={t('meetings.dashboard.status.noData')}
            />
          ) : responsibilitiesQuery.isLoading ? (
            <p className="text-sm text-muted">{t('common.loading')}</p>
          ) : responsibilities.length === 0 ? (
            <EmptyState
              title={t('meetings.dashboard.status.noResponsibilities')}
              description={t('meetings.dashboard.status.noResponsibilities')}
            />
          ) : (
            <div className="space-y-2.5">
              {responsibilities.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/80 bg-surface-alt/40 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-heading">{item.label}</p>
                    <Badge variant="primary">
                      {t('meetings.dashboard.labels.usageCount', { count: item.usageCount || 0 })}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {item.lastUsedAt ? formatDateTime(item.lastUsedAt) : t('common.placeholder.empty')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="bg-surface-alt/40">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-warning-light text-warning">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-heading">{t('meetings.dashboard.sections.quickActions')}</h3>
            <p className="mt-1 text-xs text-muted">
              {t('meetings.dashboardSubtitle')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {canManageSectors && (
                <Button size="sm" variant="outline" icon={Layers3} onClick={() => navigate('/dashboard/meetings/sectors')}>
                  {t('meetings.actions.manageSectors')}
                </Button>
              )}
              {canManageMeetings && (
                <Button size="sm" variant="outline" icon={BarChart3} onClick={() => navigate('/dashboard/meetings/list')}>
                  {t('meetings.actions.manageMeetings')}
                </Button>
              )}
              {canCreateMeetings && (
                <Button size="sm" icon={Users} onClick={() => navigate('/dashboard/meetings/new')}>
                  {t('meetings.actions.addMeeting')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
