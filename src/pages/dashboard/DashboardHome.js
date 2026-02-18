import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
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
} from 'lucide-react';
import { confessionsApi, healthApi, usersApi, visitationsApi } from '../../api/endpoints';
import { useAuth } from '../../auth/auth.hooks';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { formatDateTime, getRoleLabel } from '../../utils/formatters';
import { useI18n } from '../../i18n/i18n';

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

export default function DashboardHome() {
  const { user, hasPermission } = useAuth();
  const { t, isRTL, language } = useI18n();

  const canViewUsers = hasPermission('USERS_VIEW');
  const canViewConfessions = hasPermission('CONFESSIONS_VIEW');
  const canViewConfessionAlerts = hasPermission('CONFESSIONS_ALERTS_VIEW');
  const canViewConfessionAnalytics = hasPermission('CONFESSIONS_ANALYTICS_VIEW');
  const canViewVisitations = hasPermission('PASTORAL_VISITATIONS_VIEW');
  const canViewVisitationAnalytics = hasPermission('PASTORAL_VISITATIONS_ANALYTICS_VIEW');

  const usersSummaryQuery = useQuery({
    queryKey: ['dashboard', 'users', 'summary'],
    enabled: canViewUsers,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await usersApi.list({ limit: 100, sort: 'createdAt', order: 'desc' });
      const users = Array.isArray(data?.data) ? data.data : [];
      const locked = users.filter((entry) => entry.isLocked).length;
      return {
        totalOnBoard: users.length,
        locked,
        active: users.length - locked,
      };
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
      const { data } = await confessionsApi.listSessions({ limit: 4, order: 'desc' });
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  const recentVisitationsQuery = useQuery({
    queryKey: ['dashboard', 'visitations', 'recent'],
    enabled: canViewVisitations,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await visitationsApi.list({ limit: 4, order: 'desc' });
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

  const accountStatusLabel = user?.isLocked ? t('common.status.locked') : t('common.status.active');
  const accountStatusClass = user?.isLocked ? 'text-danger' : 'text-success';
  const overdueAlerts =
    confessionsAlertsQuery.data?.count ?? confessionsAnalyticsQuery.data?.summary?.overdueUsers ?? 0;
  const activityVolume =
    (confessionsAnalyticsQuery.data?.summary?.sessionsInPeriod || 0) +
    (visitationAnalyticsQuery.data?.summary?.visitationsInPeriod || 0);

  const controlActions = useMemo(
    () => [
      {
        label: t('dashboardHome.cards.userManagementTitle'),
        icon: Users,
        desc: t('dashboardHome.cards.userManagementDesc'),
        href: '/dashboard/users',
        perm: 'USERS_VIEW',
        context: canViewUsers
          ? t('dashboardHome.control.actionContext.lockedAccounts', { count: usersSummaryQuery.data?.locked ?? 0 })
          : '',
      },
      {
        label: t('dashboardHome.cards.profileTitle'),
        icon: UserCheck,
        desc: t('dashboardHome.cards.profileDesc'),
        href: '/dashboard/profile',
        perm: 'AUTH_VIEW_SELF',
        context: accountStatusLabel,
      },
      {
        label: t('dashboardHome.cards.sessionsTitle'),
        icon: CalendarCheck2,
        desc: t('dashboardHome.cards.sessionsDesc'),
        href: '/dashboard/confessions',
        perm: 'CONFESSIONS_VIEW',
        context: t('dashboardHome.control.actionContext.upcoming', {
          count: confessionsAnalyticsQuery.data?.summary?.upcomingSessions ?? 0,
        }),
      },
      {
        label: t('dashboardHome.cards.alertsTitle'),
        icon: BellRing,
        desc: t('dashboardHome.cards.alertsDesc'),
        href: '/dashboard/confessions/alerts',
        perm: 'CONFESSIONS_ALERTS_VIEW',
        context: t('dashboardHome.control.actionContext.pending', { count: overdueAlerts }),
      },
      {
        label: t('dashboardHome.cards.analyticsTitle'),
        icon: BarChart3,
        desc: t('dashboardHome.cards.analyticsDesc'),
        href: '/dashboard/confessions/analytics',
        perm: 'CONFESSIONS_ANALYTICS_VIEW',
        context: t('dashboardHome.control.actionContext.inPeriod', {
          count: confessionsAnalyticsQuery.data?.summary?.sessionsInPeriod ?? 0,
        }),
      },
      {
        label: t('dashboardHome.cards.pastoralVisitationsTitle'),
        icon: Building2,
        desc: t('dashboardHome.cards.pastoralVisitationsDesc'),
        href: '/dashboard/visitations',
        perm: 'PASTORAL_VISITATIONS_VIEW',
        context: t('dashboardHome.control.actionContext.recentRecords', {
          count: recentVisitationsQuery.data?.length ?? 0,
        }),
      },
      {
        label: t('dashboardHome.cards.pastoralVisitationsAnalyticsTitle'),
        icon: BarChart3,
        desc: t('dashboardHome.cards.pastoralVisitationsAnalyticsDesc'),
        href: '/dashboard/visitations/analytics',
        perm: 'PASTORAL_VISITATIONS_ANALYTICS_VIEW',
        context: t('dashboardHome.control.actionContext.uniqueHouses', {
          count: visitationAnalyticsQuery.data?.summary?.uniqueHouses ?? 0,
        }),
      },
    ],
    [
      accountStatusLabel,
      canViewUsers,
      confessionsAnalyticsQuery.data?.summary?.sessionsInPeriod,
      confessionsAnalyticsQuery.data?.summary?.upcomingSessions,
      overdueAlerts,
      recentVisitationsQuery.data?.length,
      t,
      usersSummaryQuery.data?.locked,
      visitationAnalyticsQuery.data?.summary?.uniqueHouses,
    ]
  );

  const visibleActions = controlActions.filter((item) => hasPermission(item.perm));

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    [language]
  );

  const priorityQueue = useMemo(() => {
    const items = [];

    if (canViewConfessionAlerts) {
      items.push({
        id: 'overdue-alerts',
        label: t('dashboardHome.control.priority.overdueConfessionFollowUpTitle'),
        description: t('dashboardHome.control.priority.overdueConfessionFollowUpDesc'),
        value: overdueAlerts,
        href: '/dashboard/confessions/alerts',
        variant: overdueAlerts > 0 ? 'danger' : 'success',
      });
    }

    if (canViewUsers) {
      const lockedAccounts = usersSummaryQuery.data?.locked || 0;
      items.push({
        id: 'locked-accounts',
        label: t('dashboardHome.control.priority.lockedAccountsTitle'),
        description: t('dashboardHome.control.priority.lockedAccountsDesc'),
        value: lockedAccounts,
        href: '/dashboard/users',
        variant: lockedAccounts > 0 ? 'warning' : 'success',
      });
    }

    if (canViewConfessionAnalytics) {
      const upcoming = confessionsAnalyticsQuery.data?.summary?.upcomingSessions || 0;
      items.push({
        id: 'upcoming-sessions',
        label: t('dashboardHome.control.priority.upcomingSessionsTitle'),
        description: t('dashboardHome.control.priority.upcomingSessionsDesc'),
        value: upcoming,
        href: '/dashboard/confessions',
        variant: upcoming > 0 ? 'primary' : 'default',
      });
    }

    if (canViewVisitationAnalytics) {
      const inPeriod = visitationAnalyticsQuery.data?.summary?.visitationsInPeriod || 0;
      items.push({
        id: 'visitations-period',
        label: t('dashboardHome.control.priority.visitationsInPeriodTitle'),
        description: t('dashboardHome.control.priority.visitationsInPeriodDesc'),
        value: inPeriod,
        href: '/dashboard/visitations/analytics',
        variant: inPeriod > 0 ? 'primary' : 'default',
      });
    }

    return items.sort((a, b) => b.value - a.value);
  }, [
    canViewConfessionAlerts,
    canViewConfessionAnalytics,
    canViewUsers,
    canViewVisitationAnalytics,
    confessionsAnalyticsQuery.data?.summary?.upcomingSessions,
    overdueAlerts,
    t,
    usersSummaryQuery.data?.locked,
    visitationAnalyticsQuery.data?.summary?.visitationsInPeriod,
  ]);

  const recentActivity = useMemo(() => {
    const sessionEvents = (recentSessionsQuery.data || []).map((entry) => ({
      id: `session-${entry.id}`,
      time: entry.scheduledAt,
      title: entry.attendee?.fullName || t('common.placeholder.empty'),
      subtitle: `${t('dashboardLayout.menu.confessionSessions')} - ${entry.sessionType?.name || t('common.placeholder.empty')}`,
      href: '/dashboard/confessions',
      icon: CalendarCheck2,
    }));

    const visitationEvents = (recentVisitationsQuery.data || []).map((entry) => ({
      id: `visitation-${entry.id}`,
      time: entry.visitedAt || entry.createdAt,
      title: entry.houseName || t('common.placeholder.empty'),
      subtitle: `${t('dashboardLayout.menu.pastoralVisitations')} - ${entry.recordedBy?.fullName || t('common.placeholder.empty')}`,
      href: `/dashboard/visitations/${entry.id}`,
      icon: Building2,
    }));

    return [...sessionEvents, ...visitationEvents]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  }, [recentSessionsQuery.data, recentVisitationsQuery.data, t]);

  const moduleStatuses = [
    {
      id: 'api',
      label: t('dashboardHome.control.moduleLabels.apiHealth'),
      query: healthQuery,
      enabled: true,
      details: t('dashboardHome.control.moduleDetails.uptime', {
        value: formatUptime(healthQuery.data?.uptime, t),
      }),
    },
    {
      id: 'users',
      label: t('dashboardLayout.menu.users'),
      query: usersSummaryQuery,
      enabled: canViewUsers,
      details: t('dashboardHome.control.moduleDetails.users', {
        active: usersSummaryQuery.data?.active ?? 0,
        locked: usersSummaryQuery.data?.locked ?? 0,
      }),
    },
    {
      id: 'confessions',
      label: t('dashboardLayout.menu.confessionAnalytics'),
      query: confessionsAnalyticsQuery,
      enabled: canViewConfessionAnalytics,
      details: t('dashboardHome.control.moduleDetails.confessions', {
        count: confessionsAnalyticsQuery.data?.summary?.sessionsInPeriod ?? 0,
      }),
    },
    {
      id: 'visitations',
      label: t('dashboardLayout.menu.pastoralVisitationsAnalytics'),
      query: visitationAnalyticsQuery,
      enabled: canViewVisitationAnalytics,
      details: t('dashboardHome.control.moduleDetails.visitations', {
        count: visitationAnalyticsQuery.data?.summary?.visitationsInPeriod ?? 0,
      }),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <Card padding={false} className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {t('dashboardHome.control.heading')}
            </p>
            <h1 className="mb-2 text-2xl font-bold text-heading lg:text-3xl">
              {t('dashboardHome.welcome', { name: user?.fullName || '' })}
            </h1>
            <p className="text-muted">{t('dashboardHome.role', { role: getRoleLabel(user?.role) })}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">{todayLabel}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-surface/90 px-4 py-3">
              <p className="text-xs text-muted">{t('dashboardHome.accountStatus')}</p>
              <p className={`mt-1 text-sm font-semibold ${accountStatusClass}`}>{accountStatusLabel}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-surface/90 px-4 py-3">
              <p className="text-xs text-muted">{t('dashboardHome.phone')}</p>
              <p className="mt-1 text-sm font-semibold text-heading direction-ltr text-left">
                {user?.phonePrimary || t('common.placeholder.empty')}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-surface/90 px-4 py-3">
              <p className="text-xs text-muted">{t('dashboardHome.control.systemUptime')}</p>
              <p className="mt-1 text-sm font-semibold text-heading">
                {formatUptime(healthQuery.data?.uptime, t)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted">{t('dashboardHome.control.kpis.accessibleModules')}</p>
          <p className="mt-1 text-2xl font-bold text-heading">{visibleActions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t('dashboardHome.control.kpis.pendingAlerts')}</p>
          <p className={`mt-1 text-2xl font-bold ${overdueAlerts > 0 ? 'text-danger' : 'text-success'}`}>
            {overdueAlerts}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t('dashboardHome.control.kpis.recentActivityVolume')}</p>
          <p className="mt-1 text-2xl font-bold text-heading">{activityVolume}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t('dashboardHome.control.kpis.apiState')}</p>
          <p
            className={`mt-1 text-lg font-bold ${
              healthQuery.isError ? 'text-danger' : healthQuery.isLoading ? 'text-warning' : 'text-success'
            }`}
          >
            {healthQuery.isError
              ? t('dashboardHome.control.apiStateValues.issue')
              : healthQuery.isLoading
                ? t('dashboardHome.control.apiStateValues.checking')
                : t('dashboardHome.control.apiStateValues.operational')}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {t('dashboardHome.control.sections.priorityQueue')}
            </h2>
            <ListBadge count={priorityQueue.length} />
          </div>
          <div className="space-y-3">
            {priorityQueue.length === 0 && (
              <p className="text-sm text-muted">{t('dashboardHome.control.empty.priorityQueue')}</p>
            )}
            {priorityQueue.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/80 bg-surface-alt/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-heading">{item.label}</p>
                    <p className="text-xs text-muted">{item.description}</p>
                  </div>
                  <Badge variant={item.variant}>{item.value}</Badge>
                </div>
                <div className="mt-2">
                  <Link to={item.href} className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    {t('dashboardHome.control.actions.openQueue')}
                    <ArrowUpRight className={`h-3.5 w-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {t('dashboardHome.control.sections.moduleStatus')}
            </h2>
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-3">
            {moduleStatuses.map((module) => {
              const status = getStatusBadge(module.query, module.enabled, t);
              return (
                <div key={module.id} className="rounded-xl border border-border/80 bg-surface-alt/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-heading">{module.label}</p>
                    <Badge variant={status.variant}>
                      <span className="inline-flex items-center gap-1">
                        <status.icon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{module.details}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">
                    {t('dashboardHome.control.meta.lastRefresh')}{' '}
                    {module.query.dataUpdatedAt
                      ? formatDateTime(module.query.dataUpdatedAt)
                      : t('common.placeholder.empty')}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {t('dashboardHome.control.sections.controlActions')}
            </h2>
            <span className="text-xs text-muted">{visibleActions.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visibleActions.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="group rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight
                    className={`h-4 w-4 text-muted transition-transform group-hover:text-primary ${isRTL ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`}
                  />
                </div>
                <h3 className="text-sm font-semibold text-heading">{item.label}</h3>
                <p className="mt-1 text-xs text-muted">{item.desc}</p>
                <div className="mt-3">
                  <Badge
                    variant={
                      item.perm === 'CONFESSIONS_ALERTS_VIEW' && overdueAlerts > 0
                        ? 'danger'
                        : 'primary'
                    }
                  >
                    {item.context}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {t('dashboardHome.control.sections.recentActivity')}
            </h2>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          {recentSessionsQuery.isLoading || recentVisitationsQuery.isLoading ? (
            <p className="text-sm text-muted">{t('dashboardHome.control.loadingRecent')}</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted">{t('dashboardHome.control.empty.recentActivity')}</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="block rounded-xl border border-border/70 bg-surface-alt/40 p-3 transition-colors hover:border-primary/30 hover:bg-surface-alt"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-heading">{item.title}</p>
                      <p className="truncate text-xs text-muted">{item.subtitle}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">
                        {formatDateTime(item.time)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ListBadge({ count }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-alt px-2 py-1 text-xs text-muted">
      <AlertTriangle className="h-3.5 w-3.5" />
      <span>{count}</span>
    </div>
  );
}
