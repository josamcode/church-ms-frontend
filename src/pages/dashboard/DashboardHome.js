import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, CalendarCheck2, BellRing, BarChart3, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../auth/auth.hooks';
import Card from '../../components/ui/Card';
import { getRoleLabel } from '../../utils/formatters';
import { useI18n } from '../../i18n/i18n';

export default function DashboardHome() {
  const { user, hasPermission } = useAuth();
  const { t, isRTL } = useI18n();

  const quickActions = useMemo(
    () => [
      {
        label: t('dashboardHome.cards.userManagementTitle'),
        icon: Users,
        desc: t('dashboardHome.cards.userManagementDesc'),
        href: '/dashboard/users',
        perm: 'USERS_VIEW',
        accent: 'from-primary to-accent',
      },
      {
        label: t('dashboardHome.cards.profileTitle'),
        icon: UserCheck,
        desc: t('dashboardHome.cards.profileDesc'),
        href: '/dashboard/profile',
        perm: 'AUTH_VIEW_SELF',
        accent: 'from-accent to-info',
      },
      {
        label: t('dashboardHome.cards.sessionsTitle'),
        icon: CalendarCheck2,
        desc: t('dashboardHome.cards.sessionsDesc'),
        href: '/dashboard/confessions',
        perm: 'CONFESSIONS_VIEW',
        accent: 'from-secondary to-warning',
      },
      {
        label: t('dashboardHome.cards.alertsTitle'),
        icon: BellRing,
        desc: t('dashboardHome.cards.alertsDesc'),
        href: '/dashboard/confessions/alerts',
        perm: 'CONFESSIONS_ALERTS_VIEW',
        accent: 'from-danger to-warning',
      },
      {
        label: t('dashboardHome.cards.analyticsTitle'),
        icon: BarChart3,
        desc: t('dashboardHome.cards.analyticsDesc'),
        href: '/dashboard/confessions/analytics',
        perm: 'CONFESSIONS_ANALYTICS_VIEW',
        accent: 'from-success to-primary',
      },
      {
        label: t('dashboardHome.cards.pastoralVisitationsTitle'),
        icon: CalendarCheck2,
        desc: t('dashboardHome.cards.pastoralVisitationsDesc'),
        href: '/dashboard/visitations',
        perm: 'PASTORAL_VISITATIONS_VIEW',
        accent: 'from-info to-primary',
      },
      {
        label: t('dashboardHome.cards.pastoralVisitationsAnalyticsTitle'),
        icon: BarChart3,
        desc: t('dashboardHome.cards.pastoralVisitationsAnalyticsDesc'),
        href: '/dashboard/visitations/analytics',
        perm: 'PASTORAL_VISITATIONS_ANALYTICS_VIEW',
        accent: 'from-secondary to-accent',
      },
    ],
    [t]
  );

  const visibleActions = quickActions.filter((item) => hasPermission(item.perm));
  const accountStatusLabel = user?.isLocked ? t('common.status.locked') : t('common.status.active');
  const accountStatusClass = user?.isLocked ? 'text-danger' : 'text-success';

  return (
    <div className="animate-fade-in space-y-6">
      <Card padding={false} className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {t('dashboardLayout.menu.dashboard')}
            </p>
            <h1 className="mb-2 text-2xl font-bold text-heading lg:text-3xl">
              {t('dashboardHome.welcome', { name: user?.fullName || '' })}
            </h1>
            <p className="text-muted">{t('dashboardHome.role', { role: getRoleLabel(user?.role) })}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </div>
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('dashboardHome.systemInfo')}</h2>
          <span className="text-sm text-muted">{visibleActions.length}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleActions.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dropdown"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <item.icon className="h-5 w-5" />
                </div>
                <ArrowUpRight
                  className={`h-4 w-4 text-muted transition-transform group-hover:text-primary ${isRTL ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
                    }`}
                />
              </div>
              <h3 className="text-base font-semibold text-heading">{item.label}</h3>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
