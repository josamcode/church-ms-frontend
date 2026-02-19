import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Layers3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeApiError } from '../../../api/errors';
import { meetingsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Table, { RowActions } from '../../../components/ui/Table';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';

const SECTOR_PERMISSIONS = ['SECTORS_VIEW', 'SECTORS_CREATE', 'SECTORS_UPDATE', 'SECTORS_DELETE'];

export default function SectorsManagementPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission, hasAnyPermission } = useAuth();

  const canViewSectors = hasPermission('SECTORS_VIEW');
  const canCreateSectors = hasPermission('SECTORS_CREATE');
  const canUpdateSectors = hasPermission('SECTORS_UPDATE');
  const canDeleteSectors = hasPermission('SECTORS_DELETE');
  const canViewMeetings = hasPermission('MEETINGS_VIEW');
  const canManageSectorRows = canUpdateSectors || canDeleteSectors;

  const canAccessSectorsModule = hasAnyPermission(SECTOR_PERMISSIONS);

  const [search, setSearch] = useState('');

  const sectorsQuery = useQuery({
    queryKey: ['meetings', 'sectors', 'management', search],
    enabled: canViewSectors,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.sectors.list({
        limit: 200,
        order: 'asc',
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

  const sectors = useMemo(
    () => (Array.isArray(sectorsQuery.data) ? sectorsQuery.data : []),
    [sectorsQuery.data]
  );
  const meetings = useMemo(
    () => (Array.isArray(meetingsQuery.data) ? meetingsQuery.data : []),
    [meetingsQuery.data]
  );

  const meetingsCountBySector = useMemo(
    () =>
      meetings.reduce((acc, meeting) => {
        const sectorId = meeting?.sector?.id;
        if (!sectorId) return acc;
        acc[sectorId] = (acc[sectorId] || 0) + 1;
        return acc;
      }, {}),
    [meetings]
  );

  const stats = useMemo(() => {
    const totalOfficials = sectors.reduce((sum, sector) => sum + (sector.officials || []).length, 0);
    const sectorsWithoutOfficials = sectors.filter((sector) => !(sector.officials || []).length).length;
    const linkedMeetings = sectors.reduce(
      (sum, sector) => sum + (meetingsCountBySector[sector.id] || 0),
      0
    );
    return {
      totalSectors: sectors.length,
      totalOfficials,
      sectorsWithoutOfficials,
      linkedMeetings,
    };
  }, [sectors, meetingsCountBySector]);

  const sectorColumns = [
    {
      key: 'name',
      label: t('meetings.columns.sector'),
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar?.url ? (
            <img
              src={row.avatar.url}
              alt={row.name}
              className="h-9 w-9 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {String(row.name || '').slice(0, 2).toUpperCase() || '--'}
            </span>
          )}
          <span className="font-medium text-heading">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'officials',
      label: t('meetings.columns.officials'),
      render: (row) => {
        const officials = row.officials || [];
        if (!officials.length) return t('common.placeholder.empty');
        const top = officials
          .slice(0, 2)
          .map((official) => official.name)
          .filter(Boolean);
        const suffix = officials.length > 2 ? ` +${officials.length - 2}` : '';
        return `${top.join(', ')}${suffix}`;
      },
    },
    {
      key: 'officialsCount',
      label: t('meetings.columns.officialsCount'),
      render: (row) => (row.officials || []).length,
    },
    ...(canViewMeetings
      ? [
          {
            key: 'meetingsCount',
            label: t('meetings.columns.meetingsCount'),
            render: (row) => meetingsCountBySector[row.id] || 0,
          },
        ]
      : []),
    {
      key: 'updatedAt',
      label: t('meetings.columns.updatedAt'),
      render: (row) => formatDateTime(row.updatedAt),
    },
    ...(canManageSectorRows
      ? [
          {
            key: 'actions',
            label: t('common.table.actions'),
            render: (row) => (
              <RowActions
                actions={[
                  ...(canUpdateSectors
                    ? [
                        {
                          label: t('common.actions.edit'),
                          onClick: () => navigate(`/dashboard/meetings/sectors/${row.id}/edit`),
                        },
                      ]
                    : []),
                  ...(canDeleteSectors
                    ? [
                        {
                          label: t('common.actions.delete'),
                          danger: true,
                          onClick: () => {
                            if (window.confirm(t('meetings.messages.confirmDeleteSector'))) {
                              deleteSectorMutation.mutate(row.id);
                            }
                          },
                        },
                      ]
                    : []),
                ]}
              />
            ),
          },
        ]
      : []),
  ];

  if (!canAccessSectorsModule) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs
          items={[
            { label: t('shared.dashboard'), href: '/dashboard' },
            { label: t('meetings.sectorsPageTitle') },
          ]}
        />
        <EmptyState
          title={t('meetings.empty.noSectorsPermissionTitle')}
          description={t('meetings.empty.noSectorsPermissionDescription')}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('meetings.sectorsPageTitle') },
        ]}
      />

      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-heading">{t('meetings.sectorsPageTitle')}</h1>
            <p className="text-sm text-muted">{t('meetings.sectorsPageSubtitle')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" icon={CalendarRange} onClick={() => navigate('/dashboard/meetings')}>
              {t('meetings.actions.openDashboard')}
            </Button>
            {canCreateSectors && (
              <Button icon={Layers3} onClick={() => navigate('/dashboard/meetings/sectors/new')}>
                {t('meetings.actions.addSector')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {canViewSectors && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-muted">{t('meetings.dashboard.cards.totalSectors')}</p>
            <p className="mt-1 text-2xl font-bold text-heading">{stats.totalSectors}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">{t('meetings.dashboard.cards.sectorsWithoutOfficials')}</p>
            <p className="mt-1 text-2xl font-bold text-warning">{stats.sectorsWithoutOfficials}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">{t('meetings.columns.officialsCount')}</p>
            <p className="mt-1 text-2xl font-bold text-heading">{stats.totalOfficials}</p>
          </Card>
          {canViewMeetings && (
            <Card className="p-4">
              <p className="text-xs text-muted">{t('meetings.columns.meetingsCount')}</p>
              <p className="mt-1 text-2xl font-bold text-heading">{stats.linkedMeetings}</p>
            </Card>
          )}
        </div>
      )}

      {canViewSectors ? (
        <Card>
          <CardHeader
            title={t('meetings.sections.sectors')}
            subtitle={t('meetings.sections.sectorsSubtitle')}
          />

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <Input
              label={t('meetings.filters.search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('meetings.filters.searchSectorsPlaceholder')}
              containerClassName="!mb-0"
            />
          </div>

          <Table
            columns={sectorColumns}
            data={sectors}
            loading={sectorsQuery.isLoading || (canViewMeetings && meetingsQuery.isLoading)}
            emptyTitle={t('meetings.empty.sectorsTitle')}
            emptyDescription={t('meetings.empty.sectorsDescription')}
          />
        </Card>
      ) : (
        <EmptyState
          title={t('meetings.empty.noSectorsPermissionTitle')}
          description={t('meetings.empty.noSectorsPermissionDescription')}
        />
      )}
    </div>
  );
}
