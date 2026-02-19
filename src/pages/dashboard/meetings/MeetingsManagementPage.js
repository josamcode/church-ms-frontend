import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, CalendarPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeApiError } from '../../../api/errors';
import { meetingsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table, { RowActions } from '../../../components/ui/Table';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { getDayLabel, getDayOptions } from './meetingsForm.utils';

const MEETING_PERMISSIONS = [
  'MEETINGS_VIEW',
  'MEETINGS_CREATE',
  'MEETINGS_UPDATE',
  'MEETINGS_DELETE',
  'MEETINGS_SERVANTS_MANAGE',
  'MEETINGS_COMMITTEES_MANAGE',
  'MEETINGS_ACTIVITIES_MANAGE',
];

export default function MeetingsManagementPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAnyPermission, hasPermission } = useAuth();

  const canViewMeetings = hasPermission('MEETINGS_VIEW');
  const canCreateMeetings = hasPermission('MEETINGS_CREATE');
  const canUpdateMeetings = hasPermission('MEETINGS_UPDATE');
  const canUpdateMeetingsSections =
    hasPermission('MEETINGS_SERVANTS_MANAGE') ||
    hasPermission('MEETINGS_COMMITTEES_MANAGE') ||
    hasPermission('MEETINGS_ACTIVITIES_MANAGE');
  const canDeleteMeetings = hasPermission('MEETINGS_DELETE');
  const canManageMeetingRows = canUpdateMeetings || canUpdateMeetingsSections || canDeleteMeetings;

  const canAccessMeetingsModule = hasAnyPermission(MEETING_PERMISSIONS);
  const canViewSectors = hasPermission('SECTORS_VIEW');

  const [filters, setFilters] = useState({
    sectorId: '',
    day: '',
    search: '',
  });

  const sectorsQuery = useQuery({
    queryKey: ['meetings', 'list', 'sectors'],
    enabled: canViewMeetings || canCreateMeetings || canUpdateMeetings || canViewSectors,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.sectors.list({ limit: 250, order: 'asc' });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const meetingsQuery = useQuery({
    queryKey: ['meetings', 'list', filters],
    enabled: canViewMeetings,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.list({
        limit: 400,
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

  const sectors = useMemo(
    () => (Array.isArray(sectorsQuery.data) ? sectorsQuery.data : []),
    [sectorsQuery.data]
  );
  const meetings = useMemo(
    () => (Array.isArray(meetingsQuery.data) ? meetingsQuery.data : []),
    [meetingsQuery.data]
  );

  const sectorOptions = sectors.map((sector) => ({ value: sector.id, label: sector.name }));
  const dayOptions = getDayOptions(t);

  const stats = useMemo(() => {
    const result = {
      totalMeetings: meetings.length,
      totalServants: 0,
      totalCommittees: 0,
      totalActivities: 0,
      totalGroups: 0,
      meetingsWithoutServants: 0,
    };

    meetings.forEach((meeting) => {
      const servantsCount = (meeting.servants || []).length;
      const committeesCount = (meeting.committees || []).length;
      const activitiesCount = (meeting.activities || []).length;
      const groupsCount = (meeting.groups || []).length;

      result.totalServants += servantsCount;
      result.totalCommittees += committeesCount;
      result.totalActivities += activitiesCount;
      result.totalGroups += groupsCount;
      if (!servantsCount) result.meetingsWithoutServants += 1;
    });

    return result;
  }, [meetings]);

  const meetingColumns = [
    {
      key: 'name',
      label: t('meetings.columns.meeting'),
      render: (row) => <span className="font-medium text-heading">{row.name}</span>,
    },
    {
      key: 'sector',
      label: t('meetings.columns.sector'),
      render: (row) => row.sector?.name || t('common.placeholder.empty'),
    },
    {
      key: 'schedule',
      label: t('meetings.columns.schedule'),
      render: (row) => `${getDayLabel(row.day, t)} - ${row.time}`,
    },
    {
      key: 'groupsCount',
      label: t('meetings.columns.groupsCount'),
      render: (row) => (row.groups || []).length,
    },
    {
      key: 'servantsCount',
      label: t('meetings.columns.servantsCount'),
      render: (row) => (row.servants || []).length,
    },
    {
      key: 'committeesCount',
      label: t('meetings.columns.committeesCount'),
      render: (row) => (row.committees || []).length,
    },
    {
      key: 'activitiesCount',
      label: t('meetings.columns.activitiesCount'),
      render: (row) => (row.activities || []).length,
    },
    {
      key: 'updatedAt',
      label: t('meetings.columns.updatedAt'),
      render: (row) => formatDateTime(row.updatedAt),
    },
    ...(canManageMeetingRows
      ? [
          {
            key: 'actions',
            label: t('common.table.actions'),
            render: (row) => (
              <RowActions
                actions={[
                  ...((canUpdateMeetings || canUpdateMeetingsSections)
                    ? [{ label: t('common.actions.edit'), onClick: () => navigate(`/dashboard/meetings/${row.id}/edit`) }]
                    : []),
                  ...(canDeleteMeetings
                    ? [{
                        label: t('common.actions.delete'),
                        danger: true,
                        onClick: () => {
                          if (window.confirm(t('meetings.messages.confirmDeleteMeeting'))) {
                            deleteMeetingMutation.mutate(row.id);
                          }
                        },
                      }]
                    : []),
                ]}
              />
            ),
          },
        ]
      : []),
  ];

  if (!canAccessMeetingsModule) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs
          items={[
            { label: t('shared.dashboard'), href: '/dashboard' },
            { label: t('meetings.meetingsPageTitle') },
          ]}
        />
        <EmptyState
          title={t('meetings.empty.noMeetingsPermissionTitle')}
          description={t('meetings.empty.noMeetingsPermissionDescription')}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('meetings.meetingsPageTitle') },
        ]}
      />

      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-heading">{t('meetings.meetingsPageTitle')}</h1>
            <p className="text-sm text-muted">{t('meetings.meetingsPageSubtitle')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" icon={BarChart3} onClick={() => navigate('/dashboard/meetings')}>
              {t('meetings.actions.openDashboard')}
            </Button>
            {canCreateMeetings && (
              <Button icon={CalendarPlus} onClick={() => navigate('/dashboard/meetings/new')}>
                {t('meetings.actions.addMeeting')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {canViewMeetings && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs text-muted">{t('meetings.dashboard.cards.totalMeetings')}</p>
            <p className="mt-1 text-2xl font-bold text-heading">{stats.totalMeetings}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">{t('meetings.dashboard.cards.totalServants')}</p>
            <p className="mt-1 text-2xl font-bold text-heading">{stats.totalServants}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">{t('meetings.columns.groupsCount')}</p>
            <p className="mt-1 text-2xl font-bold text-heading">{stats.totalGroups}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">{t('meetings.columns.committeesCount')}</p>
            <p className="mt-1 text-2xl font-bold text-heading">{stats.totalCommittees}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">{t('meetings.dashboard.cards.meetingsWithoutServants')}</p>
            <p className="mt-1 text-2xl font-bold text-warning">{stats.meetingsWithoutServants}</p>
          </Card>
        </div>
      )}

      {canViewMeetings ? (
        <Card>
          <CardHeader
            title={t('meetings.sections.meetings')}
            subtitle={t('meetings.sections.meetingsSubtitle')}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <Select
              label={t('meetings.filters.sector')}
              value={filters.sectorId}
              onChange={(event) => setFilters((prev) => ({ ...prev, sectorId: event.target.value }))}
              options={[{ value: '', label: t('meetings.filters.allSectors') }, ...sectorOptions]}
              containerClassName="!mb-0"
            />
            <Select
              label={t('meetings.filters.day')}
              value={filters.day}
              onChange={(event) => setFilters((prev) => ({ ...prev, day: event.target.value }))}
              options={[{ value: '', label: t('meetings.filters.allDays') }, ...dayOptions]}
              containerClassName="!mb-0"
            />
            <Input
              label={t('meetings.filters.search')}
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder={t('meetings.filters.searchPlaceholder')}
              containerClassName="!mb-0"
            />
          </div>

          <div className="mt-4">
            <Table
              columns={meetingColumns}
              data={meetings}
              loading={meetingsQuery.isLoading}
              emptyTitle={t('meetings.empty.meetingsTitle')}
              emptyDescription={t('meetings.empty.meetingsDescription')}
            />
          </div>
        </Card>
      ) : (
        <EmptyState
          title={t('meetings.empty.noMeetingsPermissionTitle')}
          description={t('meetings.empty.noMeetingsPermissionDescription')}
        />
      )}
    </div>
  );
}
