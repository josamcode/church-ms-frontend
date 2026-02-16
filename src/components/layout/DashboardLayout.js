import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  Church,
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Construction,
  CalendarCheck2,
  BellRing,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../auth/auth.hooks';
import Tooltip from '../ui/Tooltip';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { useI18n } from '../../i18n/i18n';
import { getRoleLabel } from '../../utils/formatters';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { user, logout, hasPermission } = useAuth();
  const { t, isRTL, language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo(
    () => [
      {
        label: t('dashboardLayout.menu.dashboard'),
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: null,
        matchChildren: false,
      },
      {
        label: t('dashboardLayout.menu.profile'),
        href: '/dashboard/profile',
        icon: UserCircle,
        permission: 'AUTH_VIEW_SELF',
        matchChildren: false,
      },
      {
        label: t('dashboardLayout.menu.users'),
        href: '/dashboard/users',
        icon: Users,
        permission: 'USERS_VIEW',
        matchChildren: true,
      },
      {
        label: t('dashboardLayout.menu.confessionSessions'),
        href: '/dashboard/confessions',
        icon: CalendarCheck2,
        permission: 'CONFESSIONS_VIEW',
        matchChildren: false,
      },
      {
        label: t('dashboardLayout.menu.confessionAlerts'),
        href: '/dashboard/confessions/alerts',
        icon: BellRing,
        permission: 'CONFESSIONS_ALERTS_VIEW',
        matchChildren: false,
      },
      {
        label: t('dashboardLayout.menu.confessionAnalytics'),
        href: '/dashboard/confessions/analytics',
        icon: BarChart3,
        permission: 'CONFESSIONS_ANALYTICS_VIEW',
        matchChildren: false,
      },
      { type: 'divider' },
      {
        label: t('dashboardLayout.menu.underDevelopment'),
        href: '/dashboard/under-development',
        icon: Construction,
        permission: null,
        matchChildren: false,
      },
    ],
    [t]
  );

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const filteredItems = menuItems.filter(
    (item) => item.type === 'divider' || !item.permission || hasPermission(item.permission)
  );

  const isItemActive = (item) => {
    if (!item?.href) return false;
    if (location.pathname === item.href) return true;
    if (!item.matchChildren) return false;
    return location.pathname.startsWith(`${item.href}/`);
  };

  const activeItem = [...filteredItems]
    .filter((item) => item.href)
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isItemActive(item));
  const sidebarTooltipPosition = isRTL ? 'left' : 'right';

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    [language]
  );

  const SidebarContent = ({ mobile = false } = {}) => {
    const compact = collapsed && !mobile;

    return (
      <div className="relative flex h-full flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />

        <div className="relative flex min-h-0 flex-1 flex-col">
          <button
            type="button"
            className={`mx-3 mt-3 flex items-center gap-3 rounded-2xl border-b border-border/70 bg-surface-alt/50 px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-surface-alt ${compact ? 'justify-center' : ''
              }`}
            onClick={() => navigate('/')}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Church className="h-5 w-5" />
            </div>
            {!compact && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-heading">{t('common.appName')}</p>
              </div>
            )}
          </button>

          <nav className={`relative flex-1 space-y-1.5 overflow-y-auto py-3 ${compact ? 'px-2' : 'px-3'}`}>
            {filteredItems.map((item, i) => {
              if (item.type === 'divider') {
                return <hr key={i} className={`my-2 border-border ${compact ? 'mx-1' : ''}`} />;
              }

              const active = isItemActive(item);
              return (
                <Tooltip key={item.href} content={compact ? item.label : null} position={sidebarTooltipPosition} className="w-[calc(100%-20px)]">
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex w-full items-center rounded-xl border py-2.5 text-sm font-medium transition-all
                    ${compact ? 'justify-center px-2' : 'gap-3 px-3'}
                    ${active
                        ? 'border-primary/25 bg-primary/10 text-primary shadow-card'
                        : 'border-transparent text-muted hover:border-border/60 hover:bg-surface-alt/80 hover:text-heading'
                      }`}
                  >
                    {active && (
                      <span
                        className={`absolute inset-y-2 w-1 rounded-full bg-primary ${isRTL ? 'right-1' : 'left-1'}`}
                        aria-hidden
                      />
                    )}
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors
                      ${active ? 'bg-primary/15 text-primary' : 'bg-surface-alt/70 text-muted group-hover:bg-surface-alt'}`}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    {!compact && <span className="truncate">{item.label}</span>}
                    {!compact && active && (
                      <span className={`${isRTL ? 'mr-auto' : 'ml-auto'} inline-flex h-2 w-2 rounded-full bg-primary`} />
                    )}
                  </Link>
                </Tooltip>);
            })}
          </nav>
        </div>

        <div className={`space-y-2 border-t border-border/80 ${compact ? 'p-2' : 'p-3'}`}>
          {!compact && (
            <div className="rounded-xl border border-border/80 bg-surface-alt/60 p-2">
              <LanguageSwitcher className="w-full justify-center" />
            </div>
          )}

          <Tooltip content={compact ? (darkMode ? t('common.theme.light') : t('common.theme.dark')) : null} position={sidebarTooltipPosition}>
            <button
              onClick={toggleDark}
              className={`group flex w-full items-center rounded-xl border border-transparent py-2.5 text-sm text-muted transition-all hover:border-border/70 hover:bg-surface-alt hover:text-heading ${compact ? 'justify-center px-2' : 'gap-3 px-3'
                }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt/80 text-muted transition-colors group-hover:text-heading">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </span>
              {!compact && <span>{darkMode ? t('common.theme.light') : t('common.theme.dark')}</span>}
            </button>
          </Tooltip>

          <Tooltip content={compact ? t('common.actions.logout') : null} position={sidebarTooltipPosition}>
            <button
              onClick={handleLogout}
              className={`group flex w-full items-center rounded-xl border border-transparent py-2.5 text-sm text-danger transition-all hover:border-danger/20 hover:bg-danger-light ${compact ? 'justify-center px-2' : 'gap-3 px-3'
                }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-light text-danger">
                <LogOut className="h-4 w-4" />
              </span>
              {!compact && <span>{t('common.actions.logout')}</span>}
            </button>
          </Tooltip>
        </div>
      </div>
    );
  };

  const CollapseIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-page">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="flex">
        <aside
          className={`fixed top-0 z-30 hidden h-screen flex-col bg-surface/95 shadow-lg backdrop-blur-sm transition-all duration-300 lg:flex
          ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} border-border/80
          ${collapsed ? 'w-[76px]' : 'w-[280px]'}
        `}
        >
          <SidebarContent />
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`absolute top-24 flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-surface text-muted shadow-card transition-colors hover:text-heading ${isRTL ? '-left-3.5' : '-right-3.5'
              }`}
            aria-label={collapsed ? t('dashboardLayout.expandSidebar') : t('dashboardLayout.collapseSidebar')}
          >
            <CollapseIcon className={`h-3.5 w-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </aside>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
            <aside
              className={`absolute top-0 h-full w-[280px] animate-slide-right border-border/80 bg-surface z-10 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'
                }`}
            >
              <SidebarContent mobile />
            </aside>
          </div>
        )}

        <div
          className={`flex-1 transition-all duration-300 ${collapsed
            ? isRTL
              ? 'lg:mr-[76px]'
              : 'lg:ml-[76px]'
            : isRTL
              ? 'lg:mr-[280px]'
              : 'lg:ml-[280px]'
            }`}
        >
          <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-muted hover:bg-surface-alt hover:text-base lg:hidden"
              aria-label={t('common.actions.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-heading md:text-lg">{activeItem?.label || t('dashboardLayout.menu.dashboard')}</h1>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="hidden md:inline-flex">
                <LanguageSwitcher />
              </div>

              <button
                onClick={toggleDark}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-alt hover:text-heading"
                aria-label={darkMode ? t('common.theme.light') : t('common.theme.dark')}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <Link
                to="/dashboard/profile"
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 text-sm transition-colors hover:border-primary/30 hover:bg-surface-alt"
              >
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt=""
                    className="h-8 w-8 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                )}
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1240px] px-4 py-5 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
