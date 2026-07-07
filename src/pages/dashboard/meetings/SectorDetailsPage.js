import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight, CalendarClock, CalendarDays, Clock, Edit, FileText,
  Layers3, Phone, UserCircle, Users,
} from 'lucide-react';
import { meetingsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import Section from '../../../components/ui/Section';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { getDayLabel } from './meetingsForm.utils';

const EMPTY = '---';

export default function SectorDetailsPage() {
  const { id } = useParams();
  const { t, isRTL } = useI18n();
  const { hasPermission } = useAuth();

  const tf = (key, fallback) => { const v = t(key); return v === key ? fallback : v; };

  const canUpdateSector = hasPermission('SECTORS_UPDATE');
  const canCreateMeeting = hasPermission('MEETINGS_CREATE');
  const canViewMeetings = hasPermission('MEETINGS_VIEW');
  const canManageMeeting =
    hasPermission('MEETINGS_UPDATE') ||
    hasPermission('MEETINGS_SERVANTS_MANAGE') ||
    hasPermission('MEETINGS_COMMITTEES_MANAGE') ||
    hasPermission('MEETINGS_ACTIVITIES_MANAGE');

  /* ── queries ── */
  const sectorQuery = useQuery({
    queryKey: ['meetings', 'sectors', 'details', id],
    enabled: !!id,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await meetingsApi.sectors.getById(id);
      return data?.data || null;
    },
  });

  const relatedMeetingsQuery = useQuery({
    queryKey: ['meetings', 'sectors', 'details', id, 'related-meetings'],
    enabled: !!id && canViewMeetings,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.list({ limit: 100, order: 'desc', sectorId: id });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const sector = sectorQuery.data || null;
  const meetings = useMemo(
    () => (Array.isArray(relatedMeetingsQuery.data) ? relatedMeetingsQuery.data : []),
    [relatedMeetingsQuery.data]
  );

  const stats = useMemo(() => ({
    officialsCount: (sector?.officials || []).length,
    meetingsCount: meetings.length,
    totalServants: meetings.reduce((s, m) => s + (m.servants || []).length, 0),
    totalActivities: meetings.reduce((s, m) => s + (m.activities || []).length, 0),
    totalCommittees: meetings.reduce((s, m) => s + (m.committees || []).length, 0),
  }), [sector?.officials, meetings]);

  const breadcrumbs = [
    { label: t('shared.dashboard'), href: '/dashboard' },
    { label: t('meetings.sectorsPageTitle'), href: '/dashboard/meetings/sectors' },
    { label: sector?.name || tf('meetings.sectorDetails.pageTitle', 'Sector Details') },
  ];

  /* ── loading / not found ── */
  if (sectorQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <Card tone="primary" className="overflow-hidden">
          <div className="flex items-center gap-4">
            <Skeleton variant="rect" className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <EmptyState
          icon={Layers3}
          title={tf('meetings.sectorDetails.notFoundTitle', 'Sector not found')}
          description={tf('meetings.sectorDetails.notFoundDescription', 'This sector could not be loaded or may have been removed.')}
        />
      </div>
    );
  }

  const officials = sector.officials || [];

  const kpiTiles = [
    { label: t('meetings.columns.officialsCount'), value: stats.officialsCount, icon: Users, tone: 'primary' },
    { label: t('meetings.columns.meetingsCount'), value: stats.meetingsCount, icon: CalendarDays, tone: 'gold' },
    { label: t('meetings.columns.servantsCount'), value: stats.totalServants, icon: UserCircle, tone: 'info' },
    { label: t('meetings.columns.activitiesCount'), value: stats.totalActivities, icon: CalendarClock, tone: 'success' },
    { label: t('meetings.columns.committeesCount'), value: stats.totalCommittees, icon: FileText, tone: 'warning' },
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs items={breadcrumbs} />

      {/* ══ SUMMARY HEADER ════════════════════════════════════════════════ */}
      <Card tone="primary" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-16 -end-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          {/* avatar + title */}
          <div className="flex items-center gap-4">
            {sector.avatar?.url ? (
              <img
                src={sector.avatar.url}
                alt={sector.name || ''}
                className="h-16 w-16 rounded-2xl border border-border object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/15">
                <Layers3 className="h-7 w-7 text-primary" />
              </div>
            )}

            <PageHeader
              contentOnly
              eyebrow={t('meetings.sectorsPageTitle')}
              title={sector.name || EMPTY}
              subtitle={tf('meetings.sectorDetails.subtitle', 'Full profile including officials and linked meetings.')}
              titleClassName="mt-1 text-3xl font-bold tracking-tight text-heading"
              childrenClassName="mt-3 flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                <Users className="h-3 w-3" />
                {stats.officialsCount} · {t('meetings.fields.officials')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                <CalendarDays className="h-3 w-3" />
                {stats.meetingsCount} · {t('meetings.sections.meetings')}
              </span>
            </PageHeader>
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            {canUpdateSector && (
              <Link to={`/dashboard/meetings/sectors/${sector.id}/edit`}>
                <Button variant="outline" icon={Edit}>{t('common.actions.edit')}</Button>
              </Link>
            )}
            {canCreateMeeting && (
              <Link to="/dashboard/meetings/new">
                <Button icon={CalendarDays}>{t('meetings.actions.addMeeting')}</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* ══ KPI TILES ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {kpiTiles.map(({ label, value, icon: Icon, tone }) => (
          <StatCard key={label} icon={Icon} label={label} value={value ?? 0} tone={tone} isRTL={isRTL} />
        ))}
      </div>

      {/* ══ NOTES ═════════════════════════════════════════════════════════ */}
      {(sector.notes || null) && (
        <Card tone="gold" padding="sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary">
              <FileText className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                {t('meetings.fields.notes')}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-heading">{sector.notes}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ══ OFFICIALS ═════════════════════════════════════════════════════ */}
      <Section
        icon={Users}
        title={t('meetings.fields.officials')}
        actions={
          officials.length > 0 ? (
            <Badge variant="primary">{officials.length}</Badge>
          ) : null
        }
      >
        {officials.length === 0 ? (
          <EmptyState
            compact
            icon={Users}
            title={t('meetings.empty.noOfficialsYet')}
            description={tf('meetings.sectorDetails.noOfficialsDescription', 'Add officials to define ownership and accountability.')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {officials.map((official) => {
              const officialName = official.user?.fullName || '';
              const officialInitial = String(officialName || '?').trim().charAt(0).toUpperCase();
              return (
                <div
                  key={official.id || official.name}
                  className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {officialInitial}
                    </div>
                    <div className="min-w-0">
                      {official.user?.fullName && (
                        <p className="truncate font-semibold text-heading">
                          {official.user.fullName}
                        </p>
                      )}
                      {official.user.phonePrimary && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted direction-ltr">
                          <Phone className="h-3 w-3" />
                          {official.user.phonePrimary}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* notes */}
                  {official.notes && (
                    <p className="mt-3 line-clamp-2 border-t border-border/60 pt-3 text-xs text-muted">
                      {official.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ══ LINKED MEETINGS ═══════════════════════════════════════════════ */}
      <Section
        icon={CalendarDays}
        title={t('meetings.sections.meetings')}
        actions={
          meetings.length > 0 ? (
            <Badge variant="primary">{meetings.length}</Badge>
          ) : null
        }
      >
        {!canViewMeetings ? (
          <EmptyState
            compact
            icon={CalendarDays}
            title={t('meetings.empty.noMeetingsPermissionTitle')}
            description={t('meetings.empty.noMeetingsPermissionDescription')}
          />
        ) : relatedMeetingsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarDays}
            title={t('meetings.empty.meetingsTitle')}
            description={tf('meetings.sectorDetails.noLinkedMeetingsDescription', 'No meetings are currently assigned to this sector.')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex flex-col rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                {/* top row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <p className="truncate font-semibold text-heading">{meeting.name || EMPTY}</p>
                  </div>
                  <Badge variant="primary" dot>
                    {getDayLabel(meeting.day, t)} · {meeting.time}
                  </Badge>
                </div>

                {/* stat chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-alt px-2.5 py-1 text-xs text-muted">
                    <UserCircle className="h-3.5 w-3.5" />
                    {t('meetings.columns.servantsCount')}
                    <strong className="text-heading">{(meeting.servants || []).length}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-alt px-2.5 py-1 text-xs text-muted">
                    <FileText className="h-3.5 w-3.5" />
                    {t('meetings.columns.committeesCount')}
                    <strong className="text-heading">{(meeting.committees || []).length}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-alt px-2.5 py-1 text-xs text-muted">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {t('meetings.columns.activitiesCount')}
                    <strong className="text-heading">{(meeting.activities || []).length}</strong>
                  </span>
                </div>

                {/* footer: updated + actions */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateTime(meeting.updatedAt)}
                  </span>
                  <div className="flex gap-2">
                    <Link to={`/dashboard/meetings/list/${meeting.id}`}>
                      <Button size="sm" variant="outline" icon={ArrowUpRight}>{t('common.actions.view')}</Button>
                    </Link>
                    {canManageMeeting && (
                      <Link to={`/dashboard/meetings/${meeting.id}/edit`}>
                        <Button size="sm" variant="ghost" icon={Edit}>{t('common.actions.edit')}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

    </div>
  );
}
