import { useMemo } from 'react';
import { Users, UserCheck, Shield, CalendarCheck2, BellRing, BarChart3 } from 'lucide-react';
import { useAuth } from '../../auth/auth.hooks';
import Card from '../../components/ui/Card';
import { getRoleLabel } from '../../utils/formatters';
import { useI18n } from '../../i18n/i18n';

export default function DashboardHome() {
  const { user, hasPermission } = useAuth();
  const { t, isRTL } = useI18n();

  const quickStats = useMemo(
    () => [
      {
        label: t('dashboardHome.cards.userManagementTitle'),
        icon: Users,
        desc: t('dashboardHome.cards.userManagementDesc'),
        href: '/dashboard/users',
        perm: 'USERS_VIEW',
      },
      {
        label: t('dashboardHome.cards.profileTitle'),
        icon: UserCheck,
        desc: t('dashboardHome.cards.profileDesc'),
        href: '/dashboard/profile',
        perm: 'AUTH_VIEW_SELF',
      },
      {
        label: t('dashboardHome.cards.sessionsTitle'),
        icon: CalendarCheck2,
        desc: t('dashboardHome.cards.sessionsDesc'),
        href: '/dashboard/confessions',
        perm: 'CONFESSIONS_VIEW',
      },
      {
        label: t('dashboardHome.cards.alertsTitle'),
        icon: BellRing,
        desc: t('dashboardHome.cards.alertsDesc'),
        href: '/dashboard/confessions/alerts',
        perm: 'CONFESSIONS_ALERTS_VIEW',
      },
      {
        label: t('dashboardHome.cards.analyticsTitle'),
        icon: BarChart3,
        desc: t('dashboardHome.cards.analyticsDesc'),
        href: '/dashboard/confessions/analytics',
        perm: 'CONFESSIONS_ANALYTICS_VIEW',
      },
    ],
    [t]
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-heading mb-1">
          {t('dashboardHome.welcome', { name: user?.fullName || '' })}
        </h1>
        <p className="text-muted">{t('dashboardHome.role', { role: getRoleLabel(user?.role) })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {quickStats.filter((item) => hasPermission(item.perm)).map((stat) => (
          <a key={stat.href} href={stat.href}>
            <Card className="hover:shadow-dropdown transition-shadow cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-heading">{stat.label}</h3>
                  <p className="text-sm text-muted mt-0.5">{stat.desc}</p>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-heading">{t('dashboardHome.systemInfo')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted">{t('dashboardHome.userName')}</span>
            <span className={`font-medium text-heading ${isRTL ? 'mr-2' : 'ml-2'}`}>{user?.fullName}</span>
          </div>
          <div>
            <span className="text-muted">{t('dashboardHome.roleLabel')}</span>
            <span className={`font-medium text-heading ${isRTL ? 'mr-2' : 'ml-2'}`}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
          <div>
            <span className="text-muted">{t('dashboardHome.phone')}</span>
            <span className={`font-medium text-heading direction-ltr ${isRTL ? 'mr-2' : 'ml-2'}`}>
              {user?.phonePrimary}
            </span>
          </div>
          <div>
            <span className="text-muted">{t('dashboardHome.accountStatus')}</span>
            <span className={`font-medium ${isRTL ? 'mr-2' : 'ml-2'} ${user?.isLocked ? 'text-danger' : 'text-success'}`}>
              {user?.isLocked ? t('common.status.locked') : t('common.status.active')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
