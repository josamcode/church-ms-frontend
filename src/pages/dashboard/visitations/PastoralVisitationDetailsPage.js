import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Clock3, FileText, Home, UserCircle, Users } from 'lucide-react';
import { usersApi, visitationsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/ui/PageHeader';
import Section from '../../../components/ui/Section';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { formatDateTime } from '../../../utils/formatters';
import { useI18n } from '../../../i18n/i18n';
import useNavigateToUser from '../../../hooks/useNavigateToUser';

const EMPTY = '---';

/* ── primitives ──────────────────────────────────────────────────────────── */

/** Thin field: overline label + value */
function Field({ label, value, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-muted" />}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      </div>
      <p className="mt-1 text-sm font-medium text-heading">{value || EMPTY}</p>
    </div>
  );
}

/** Vertical event timeline (visit → record) */
function Timeline({ events }) {
  return (
    <ol className="relative space-y-6">
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;
        return (
          <li key={event.key} className="relative flex gap-4">
            {/* connector line */}
            {!isLast && (
              <span
                className="absolute top-9 h-[calc(100%+0.5rem)] w-px bg-border ltr:left-[17px] rtl:right-[17px]"
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${event.iconWrap}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                {event.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-heading">{event.value}</p>
              {event.meta && <p className="mt-0.5 text-xs text-muted">{event.meta}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Clickable member card */
function MemberCard({ member, navigateToUser }) {
  const userId = member._id || member.id;
  const name = member.fullName || EMPTY;
  const initial = String(name).trim().charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => userId && navigateToUser(userId)}
      disabled={!userId}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-start transition-all duration-150 hover:border-primary/30 hover:shadow-sm disabled:pointer-events-none disabled:opacity-60"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        {initial}
      </div>
      <p className="truncate text-sm font-semibold text-heading transition-colors group-hover:text-primary">
        {name}
      </p>
    </button>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function PastoralVisitationDetailsPage() {
  const { id } = useParams();
  const { t, language } = useI18n();
  const isRTL = language === 'ar';
  const navigateToUser = useNavigateToUser();

  /* ── queries ── */
  const { data: visitation, isLoading } = useQuery({
    queryKey: ['visitations', 'details', id],
    queryFn: async () => {
      const { data } = await visitationsApi.getById(id);
      return data?.data || null;
    },
    staleTime: 60000,
  });

  const { data: houseMembersRes, isLoading: houseMembersLoading } = useQuery({
    queryKey: ['visitations', 'house-members', visitation?.houseName],
    queryFn: async () => {
      const { data } = await usersApi.list({ houseName: visitation.houseName, limit: 100, sort: 'fullName', order: 'asc' });
      return data?.data || [];
    },
    enabled: !!visitation?.houseName,
    staleTime: 30000,
  });

  const houseMembers = useMemo(() => {
    const members = Array.isArray(houseMembersRes) ? houseMembersRes : [];
    const normalizedHouse = String(visitation?.houseName || '').trim().toLowerCase();
    return members.filter((m) => String(m.houseName || '').trim().toLowerCase() === normalizedHouse);
  }, [houseMembersRes, visitation?.houseName]);

  const breadcrumbItems = useMemo(() => [
    { label: t('shared.dashboard'), href: '/dashboard' },
    { label: t('visitations.list.page'), href: '/dashboard/visitations' },
    { label: visitation?.houseName || t('visitations.details.page') },
  ], [t, visitation?.houseName]);

  const durationLabel = `${visitation?.durationMinutes || 10} ${t('visitations.shared.minutes')}`;

  /* ── states ── */
  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <Card padding="lg" className="flex items-center gap-4">
          <Skeleton variant="circle" className="h-14 w-14" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[104px] w-full rounded-xl" />
          ))}
        </div>
        <Card padding="lg" className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      </div>
    );
  }

  if (!visitation) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <EmptyState
          icon={Home}
          title={t('visitations.details.notFoundTitle')}
          description={t('visitations.details.notFoundDescription')}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs items={breadcrumbItems} />

      {/* ══ SUMMARY HEADER CARD ═════════════════════════════════════════ */}
      <Card padding="lg" tone="primary">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <PageHeader
              contentOnly
              eyebrow={t('visitations.list.page')}
              title={visitation.houseName || EMPTY}
              titleClassName="mt-1 text-3xl font-bold tracking-tight text-heading"
              childrenClassName="mt-2 flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                <CalendarClock className="h-3 w-3" />
                {formatDateTime(visitation.visitedAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-muted">
                <Clock3 className="h-3 w-3" />
                {durationLabel}
              </span>
            </PageHeader>
          </div>
          {visitation.recordedBy?.id && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={UserCircle}
              onClick={() => navigateToUser(visitation.recordedBy.id)}
            >
              {t('visitations.details.viewRecorder')}
            </Button>
          )}
        </div>

        {/* key facts */}
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-border/60 pt-5 sm:grid-cols-4">
          <Field
            label={t('visitations.details.visitedAt')}
            value={formatDateTime(visitation.visitedAt)}
            icon={CalendarClock}
          />
          <Field
            label={t('visitations.details.durationMinutes')}
            value={durationLabel}
            icon={Clock3}
          />
          <Field
            label={t('visitations.details.recordedBy')}
            value={visitation.recordedBy?.fullName || EMPTY}
            icon={UserCircle}
          />
          <Field
            label={t('visitations.details.houseName')}
            value={visitation.houseName}
            icon={Home}
          />
        </div>
      </Card>

      {/* ══ KEY FACTS ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          tone="primary"
          label={t('visitations.details.visitedAt')}
          value={formatDateTime(visitation.visitedAt)}
          isRTL={isRTL}
        />
        <StatCard
          icon={Clock3}
          tone="info"
          label={t('visitations.details.durationMinutes')}
          value={durationLabel}
          isRTL={isRTL}
        />
        <StatCard
          icon={Users}
          tone="gold"
          label={t('visitations.details.houseMembersTitle')}
          value={houseMembersLoading ? '…' : houseMembers.length}
          isRTL={isRTL}
        />
        <StatCard
          icon={UserCircle}
          tone="success"
          label={t('visitations.details.recordedBy')}
          value={visitation.recordedBy?.fullName || EMPTY}
          isRTL={isRTL}
        />
      </div>

      {/* ══ TIMELINE + NOTES ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Section title={t('visitations.details.recordedAt')} icon={CalendarClock}>
          <Timeline
            events={[
              {
                key: 'visited',
                icon: CalendarClock,
                iconWrap: 'border-primary/20 bg-primary/10 text-primary',
                label: t('visitations.details.visitedAt'),
                value: formatDateTime(visitation.visitedAt),
                meta: durationLabel,
              },
              {
                key: 'recorded',
                icon: UserCircle,
                iconWrap: 'border-border bg-surface-alt text-muted',
                label: t('visitations.details.recordedBy'),
                value: visitation.recordedBy?.fullName || EMPTY,
                meta: formatDateTime(visitation.recordedAt || visitation.createdAt),
              },
            ]}
          />
        </Section>

        <Section title={t('visitations.details.notes')} icon={FileText}>
          {visitation.notes ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-heading">
              {visitation.notes}
            </p>
          ) : (
            <p className="text-sm text-muted">{EMPTY}</p>
          )}
        </Section>
      </div>

      {/* ══ HOUSE MEMBERS ═══════════════════════════════════════════════ */}
      <Section
        title={t('visitations.details.houseMembersTitle')}
        icon={Users}
        actions={
          <span className="text-[11px] font-semibold tabular-nums text-muted">
            {houseMembers.length}
          </span>
        }
      >
        {houseMembersLoading ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[58px] w-full rounded-2xl" />
            ))}
          </div>
        ) : houseMembers.length === 0 ? (
          <EmptyState
            compact
            icon={Users}
            title={t('visitations.details.houseMembersEmpty')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {houseMembers.map((member) => (
              <MemberCard
                key={member._id || member.id}
                member={member}
                navigateToUser={navigateToUser}
              />
            ))}
          </div>
        )}
      </Section>

    </div>
  );
}
