/**
 * DashboardHome — Redesigned
 *
 * Design decisions:
 *  - Removed the gradient hero card — replaced with a clean inline greeting strip
 *  - Collapsed 4-col KPI row into 3 meaningful stats (removed noise)
 *  - Priority queue & module status merged into one tight status column
 *  - Control actions grid is the real focal point — given the most space
 *  - Recent activity is a slim timeline strip, not heavy cards
 *  - No AlertTriangle decorating section headers — icons only when semantic
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Server,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
  Activity,
} from 'lucide-react';
import { confessionsApi, healthApi, usersApi, visitationsApi } from '../../api/endpoints';
import { useAuth } from '../../auth/auth.hooks';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { formatDateTime, getRoleLabel } from '../../utils/formatters';
import { useI18n } from '../../i18n/i18n';

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

function formatUptime(seconds, t) {
  if (!Number.isFinite(seconds) || seconds <= 0) return t('dashboardHome.control.uptime.unknown');
  const totalMinutes = Math.floor(seconds / 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return t('dashboardHome.control.uptime.daysHours', { days, hours });
  if (hours > 0) return t('dashboardHome.control.uptime.hoursMinutes', { hours, minutes });
  return t('dashboardHome.control.uptime.minutes', { minutes });
}

function getStatusBadge(query, enabled, t) {
  if (!enabled) return { label: t('dashboardHome.control.status.noAccess'), variant: 'default', icon: ShieldCheck };
  if (query.isError) return { label: t('dashboardHome.control.status.issue'), variant: 'danger', icon: XCircle };
  if (query.isLoading) return { label: t('dashboardHome.control.status.loading'), variant: 'warning', icon: Clock3 };
  if (query.isFetching) return { label: t('dashboardHome.control.status.refreshing'), variant: 'secondary', icon: Clock3 };
  return { label: t('dashboardHome.control.status.operational'), variant: 'success', icon: CheckCircle2 };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function DashboardHome() {
  const { user, hasPermission } = useAuth();
  const { t, isRTL, language } = useI18n();

  const canViewUsers = hasPermission('USERS_VIEW');
  const canViewConfessions = hasPermission('CONFESSIONS_VIEW');
  const canViewConfessionAlerts = hasPermission('CONFESSIONS_ALERTS_VIEW');
  const canViewConfessionAnalytics = hasPermission('CONFESSIONS_ANALYTICS_VIEW');
  const canViewVisitations = hasPermission('PASTORAL_VISITATIONS_VIEW');
  const canViewVisitationAnalytics = hasPermission('PASTORAL_VISITATIONS_ANALYTICS_VIEW');

  /* ── queries ── */
  const usersSummaryQuery = useQuery({
    queryKey: ['dashboard', 'users', 'summary'],
    enabled: canViewUsers,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await usersApi.list({ limit: 100, sort: 'createdAt', order: 'desc' });
      const users = Array.isArray(data?.data) ? data.data : [];
      const locked = users.filter((e) => e.isLocked).length;
      return { totalOnBoard: users.length, locked, active: users.length - locked };
    },
  });

  const confessionsAnalyticsQuery = useQuery({
    queryKey: ['dashboard', 'confessions', 'analytics'],
    enabled: canViewConfessionAnalytics,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await confessionsApi.getAnalytics({ months: 3 });
      return data?.data || null;
    },
  });

  const confessionsAlertsQuery = useQuery({
    queryKey: ['dashboard', 'confessions', 'alerts'],
    enabled: canViewConfessionAlerts,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await confessionsApi.getAlerts({});
      return data?.data || null;
    },
  });

  const visitationAnalyticsQuery = useQuery({
    queryKey: ['dashboard', 'visitations', 'analytics'],
    enabled: canViewVisitationAnalytics,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await visitationsApi.getAnalytics({ months: 3 });
      return data?.data || null;
    },
  });

  const recentSessionsQuery = useQuery({
    queryKey: ['dashboard', 'confessions', 'recent'],
    enabled: canViewConfessions,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await confessionsApi.listSessions({ limit: 5, order: 'desc' });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const recentVisitationsQuery = useQuery({
    queryKey: ['dashboard', 'visitations', 'recent'],
    enabled: canViewVisitations,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await visitationsApi.list({ limit: 5, order: 'desc' });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const healthQuery = useQuery({
    queryKey: ['dashboard', 'health'],
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await healthApi.check();
      return data?.data || null;
    },
  });

  /* ── derived ── */
  const overdueAlerts =
    confessionsAlertsQuery.data?.count ?? confessionsAnalyticsQuery.data?.summary?.overdueUsers ?? 0;

  const activityVolume =
    (confessionsAnalyticsQuery.data?.summary?.sessionsInPeriod || 0) +
    (visitationAnalyticsQuery.data?.summary?.visitationsInPeriod || 0);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      }).format(new Date()),
    [language]
  );

  /* ── control actions ── */
  const controlActions = useMemo(() => [
    {
      label: t('dashboardHome.cards.userManagementTitle'),
      icon: Users,
      desc: t('dashboardHome.cards.userManagementDesc'),
      href: '/dashboard/users',
      perm: 'USERS_VIEW',
      badge: canViewUsers
        ? t('dashboardHome.control.actionContext.lockedAccounts', { count: usersSummaryQuery.data?.locked ?? 0 })
        : '',
      badgeVariant: (usersSummaryQuery.data?.locked ?? 0) > 0 ? 'warning' : 'default',
    },
    {
      label: t('dashboardHome.cards.sessionsTitle'),
      icon: CalendarCheck2,
      desc: t('dashboardHome.cards.sessionsDesc'),
      href: '/dashboard/confessions',
      perm: 'CONFESSIONS_VIEW',
      badge: t('dashboardHome.control.actionContext.upcoming', {
        count: confessionsAnalyticsQuery.data?.summary?.upcomingSessions ?? 0,
      }),
      badgeVariant: 'primary',
    },
    {
      label: t('dashboardHome.cards.alertsTitle'),
      icon: BellRing,
      desc: t('dashboardHome.cards.alertsDesc'),
      href: '/dashboard/confessions/alerts',
      perm: 'CONFESSIONS_ALERTS_VIEW',
      badge: t('dashboardHome.control.actionContext.pending', { count: overdueAlerts }),
      badgeVariant: overdueAlerts > 0 ? 'danger' : 'default',
    },
    {
      label: t('dashboardHome.cards.analyticsTitle'),
      icon: BarChart3,
      desc: t('dashboardHome.cards.analyticsDesc'),
      href: '/dashboard/confessions/analytics',
      perm: 'CONFESSIONS_ANALYTICS_VIEW',
      badge: t('dashboardHome.control.actionContext.inPeriod', {
        count: confessionsAnalyticsQuery.data?.summary?.sessionsInPeriod ?? 0,
      }),
      badgeVariant: 'primary',
    },
    {
      label: t('dashboardHome.cards.pastoralVisitationsTitle'),
      icon: Building2,
      desc: t('dashboardHome.cards.pastoralVisitationsDesc'),
      href: '/dashboard/visitations',
      perm: 'PASTORAL_VISITATIONS_VIEW',
      badge: t('dashboardHome.control.actionContext.recentRecords', {
        count: recentVisitationsQuery.data?.length ?? 0,
      }),
      badgeVariant: 'primary',
    },
    {
      label: t('dashboardHome.cards.pastoralVisitationsAnalyticsTitle'),
      icon: BarChart3,
      desc: t('dashboardHome.cards.pastoralVisitationsAnalyticsDesc'),
      href: '/dashboard/visitations/analytics',
      perm: 'PASTORAL_VISITATIONS_ANALYTICS_VIEW',
      badge: t('dashboardHome.control.actionContext.uniqueHouses', {
        count: visitationAnalyticsQuery.data?.summary?.uniqueHouses ?? 0,
      }),
      badgeVariant: 'primary',
    },
  ], [
    canViewUsers, confessionsAnalyticsQuery.data, overdueAlerts,
    recentVisitationsQuery.data, t, user?.isLocked,
    usersSummaryQuery.data?.locked, visitationAnalyticsQuery.data,
  ]);

  const visibleActions = controlActions.filter((item) => hasPermission(item.perm));

  /* ── priority queue ── */
  const priorityQueue = useMemo(() => {
    const items = [];
    if (canViewConfessionAlerts)
      items.push({ id: 'overdue', label: t('dashboardHome.control.priority.overdueConfessionFollowUpTitle'), value: overdueAlerts, href: '/dashboard/confessions/alerts', variant: overdueAlerts > 0 ? 'danger' : 'success' });
    if (canViewUsers) {
      const locked = usersSummaryQuery.data?.locked || 0;
      items.push({ id: 'locked', label: t('dashboardHome.control.priority.lockedAccountsTitle'), value: locked, href: '/dashboard/users', variant: locked > 0 ? 'warning' : 'success' });
    }
    if (canViewConfessionAnalytics) {
      const upcoming = confessionsAnalyticsQuery.data?.summary?.upcomingSessions || 0;
      items.push({ id: 'upcoming', label: t('dashboardHome.control.priority.upcomingSessionsTitle'), value: upcoming, href: '/dashboard/confessions', variant: upcoming > 0 ? 'primary' : 'default' });
    }
    if (canViewVisitationAnalytics) {
      const inPeriod = visitationAnalyticsQuery.data?.summary?.visitationsInPeriod || 0;
      items.push({ id: 'visitations', label: t('dashboardHome.control.priority.visitationsInPeriodTitle'), value: inPeriod, href: '/dashboard/visitations/analytics', variant: inPeriod > 0 ? 'primary' : 'default' });
    }
    return items.sort((a, b) => b.value - a.value);
  }, [canViewConfessionAlerts, canViewConfessionAnalytics, canViewUsers, canViewVisitationAnalytics, confessionsAnalyticsQuery.data, overdueAlerts, t, usersSummaryQuery.data?.locked, visitationAnalyticsQuery.data]);

  /* ── recent activity ── */
  const recentActivity = useMemo(() => {
    const sessions = (recentSessionsQuery.data || []).map((e) => ({
      id: `s-${e.id}`, time: e.scheduledAt,
      title: e.attendee?.fullName || t('common.placeholder.empty'),
      subtitle: e.sessionType?.name || t('common.placeholder.empty'),
      href: '/dashboard/confessions',
      icon: CalendarCheck2,
    }));
    const visits = (recentVisitationsQuery.data || []).map((e) => ({
      id: `v-${e.id}`, time: e.visitedAt || e.createdAt,
      title: e.houseName || t('common.placeholder.empty'),
      subtitle: e.recordedBy?.fullName || t('common.placeholder.empty'),
      href: `/dashboard/visitations/${e.id}`,
      icon: Building2,
    }));
    return [...sessions, ...visits]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 6);
  }, [recentSessionsQuery.data, recentVisitationsQuery.data, t]);

  /* ── module statuses ── */
  const moduleStatuses = [
    { id: 'api', label: t('dashboardHome.control.moduleLabels.apiHealth'), query: healthQuery, enabled: true, details: formatUptime(healthQuery.data?.uptime, t) },
    { id: 'users', label: t('dashboardLayout.menu.users'), query: usersSummaryQuery, enabled: canViewUsers, details: `${usersSummaryQuery.data?.active ?? 0} active · ${usersSummaryQuery.data?.locked ?? 0} locked` },
    { id: 'confessions', label: t('dashboardLayout.menu.confessionAnalytics'), query: confessionsAnalyticsQuery, enabled: canViewConfessionAnalytics, details: `${confessionsAnalyticsQuery.data?.summary?.sessionsInPeriod ?? 0} sessions` },
    { id: 'visitations', label: t('dashboardLayout.menu.pastoralVisitationsAnalytics'), query: visitationAnalyticsQuery, enabled: canViewVisitationAnalytics, details: `${visitationAnalyticsQuery.data?.summary?.visitationsInPeriod ?? 0} visitations` },
  ];

  /* ── render ── */
  return (
    <div className="animate-fade-in space-y-8 pb-10">

      {/* ══ GREETING STRIP ══════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={todayLabel}
        title={t('dashboardHome.welcome', { name: user?.fullName || '' })}
        subtitle={getRoleLabel(user?.role)}
        actions={(
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium
              ${user?.isLocked
                ? 'border-danger/30 bg-danger-light text-danger'
                : 'border-success/30 bg-success-light text-success'
              }`}>
              {user?.isLocked ? t('common.status.locked') : t('common.status.active')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-muted">
              <Server className="h-3 w-3" />
              {formatUptime(healthQuery.data?.uptime, t)}
            </span>
          </div>
        )}
      />

      {/* ══ KPI ROW — 3 tiles only ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          label={t('dashboardHome.control.kpis.pendingAlerts')}
          value={overdueAlerts}
          valueClass={overdueAlerts > 0 ? 'text-danger' : 'text-success'}
          sub={t('dashboardHome.control.priority.overdueConfessionFollowUpTitle')}
        />
        <KpiTile
          label={t('dashboardHome.control.kpis.recentActivityVolume')}
          value={activityVolume}
          sub={t('dashboardHome.control.kpis.recentActivityVolume')}
        />
        <KpiTile
          label={t('dashboardHome.control.kpis.accessibleModules')}
          value={visibleActions.length}
          sub={`${usersSummaryQuery.data?.active ?? '—'} ${t('dashboardLayout.menu.users').toLowerCase()}`}
        />
      </div>

      {/* ══ MAIN GRID — Actions (wide) + Sidebar (narrow) ══════════════════ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Control Actions (2/3 width) ── */}
        <section className="space-y-4 xl:col-span-2">
          <SectionLabel>{t('dashboardHome.control.sections.controlActions')}</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleActions.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
              >
                {/* top row */}
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-4.5 w-4.5" />
                  </span>
                  <ArrowUpRight
                    className={`h-4 w-4 text-border transition-all group-hover:text-primary ${isRTL ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
                      }`}
                  />
                </div>

                {/* text */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-heading">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted line-clamp-2">{item.desc}</p>
                </div>

                {/* badge */}
                <div className="mt-3">
                  <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Sidebar (1/3 width) — Priority + Module Status ── */}
        <div className="space-y-6">

          {/* Priority Queue */}
          <section className="space-y-3">
            <SectionLabel>{t('dashboardHome.control.sections.priorityQueue')}</SectionLabel>
            <div className="rounded-2xl border border-border bg-surface p-5">
              {priorityQueue.length === 0 ? (
                <p className="text-sm text-muted">{t('dashboardHome.control.empty.priorityQueue')}</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {priorityQueue.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="group flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <p className="text-sm font-medium text-heading group-hover:text-primary transition-colors">
                        {item.label}
                      </p>
                      <Badge variant={item.variant}>{item.value}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Module Status */}
          <section className="space-y-3">
            <SectionLabel>{t('dashboardHome.control.sections.moduleStatus')}</SectionLabel>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="divide-y divide-border/60">
                {moduleStatuses.map((module) => {
                  const status = getStatusBadge(module.query, module.enabled, t);
                  return (
                    <div key={module.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-heading">{module.label}</p>
                        <p className="mt-0.5 text-xs text-muted">{module.details}</p>
                      </div>
                      <Badge variant={status.variant}>
                        <span className="inline-flex items-center gap-1">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ══ RECENT ACTIVITY — slim timeline ════════════════════════════════ */}
      {(canViewConfessions || canViewVisitations) && (
        <section className="space-y-4">
          <SectionLabel>{t('dashboardHome.control.sections.recentActivity')}</SectionLabel>
          {recentSessionsQuery.isLoading || recentVisitationsQuery.isLoading ? (
            <p className="text-sm text-muted">{t('dashboardHome.control.loadingRecent')}</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted">{t('dashboardHome.control.empty.recentActivity')}</p>
          ) : (
            <div className="rounded-2xl border border-border bg-surface">
              <div className="divide-y divide-border/60">
                {recentActivity.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-alt/40 first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-heading">{item.title}</p>
                      <p className="truncate text-xs text-muted">{item.subtitle}</p>
                    </div>
                    <p className="shrink-0 text-[11px] text-muted">{formatDateTime(item.time)}</p>
                    <ArrowUpRight className={`h-3.5 w-3.5 shrink-0 text-border transition-all group-hover:text-primary ${isRTL ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Micro components
───────────────────────────────────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">{children}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function KpiTile({ label, value, valueClass = 'text-heading', sub }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      <div className="mt-4">
        <p className={`text-4xl font-bold tracking-tight ${valueClass}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}
