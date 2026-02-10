import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../auth/auth.hooks';
import Tooltip from '../ui/Tooltip';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { useI18n } from '../../i18n/i18n';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { user, logout, hasPermission } = useAuth();
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();

  const menuItems = useMemo(
    () => [
      { label: t('dashboardLayout.menu.dashboard'), href: '/dashboard', icon: LayoutDashboard, permission: null },
      { label: t('dashboardLayout.menu.profile'), href: '/dashboard/profile', icon: UserCircle, permission: 'AUTH_VIEW_SELF' },
      { label: t('dashboardLayout.menu.users'), href: '/dashboard/users', icon: Users, permission: 'USERS_VIEW' },
      {
        label: t('dashboardLayout.menu.confessionSessions'),
        href: '/dashboard/confessions',
        icon: CalendarCheck2,
        permission: 'CONFESSIONS_VIEW',
      },
      {
        label: t('dashboardLayout.menu.confessionAlerts'),
        href: '/dashboard/confessions/alerts',
        icon: BellRing,
        permission: 'CONFESSIONS_ALERTS_VIEW',
      },
      {
        label: t('dashboardLayout.menu.confessionAnalytics'),
        href: '/dashboard/confessions/analytics',
        icon: BarChart3,
        permission: 'CONFESSIONS_ANALYTICS_VIEW',
      },
      { type: 'divider' },
      { label: t('dashboardLayout.menu.underDevelopment'), href: '/dashboard/under-development', icon: Construction, permission: null },
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-2 p-4 border-b border-border cursor-pointer"
        onClick={() => navigate('/')}
      >
        <Church className="w-7 h-7 text-primary flex-shrink-0" />
        {!collapsed && <span className="font-bold text-heading text-sm truncate">{t('common.appName')}</span>}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item, i) =>
          item.type === 'divider' ? (
            <hr key={i} className="my-2 border-border" />
          ) : (
            <Tooltip key={item.href} content={collapsed ? item.label : null} position={isRTL ? 'left' : 'right'}>
              <NavLink
                to={item.href}
                end={item.href === '/dashboard'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-base hover:bg-surface-alt'}`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </Tooltip>
          )
        )}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {!collapsed && <LanguageSwitcher className="w-full justify-center" />}
        <button
          onClick={toggleDark}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted hover:text-base hover:bg-surface-alt transition-colors w-full"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!collapsed && <span>{darkMode ? t('common.theme.light') : t('common.theme.dark')}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-danger hover:bg-danger-light transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>{t('common.actions.logout')}</span>}
        </button>
      </div>
    </div>
  );

  const CollapseIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-page flex">
      <aside
        className={`hidden lg:flex flex-col fixed top-0 h-screen bg-surface z-30 transition-all duration-300
          ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} border-border
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        `}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`absolute top-20 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-muted hover:text-base shadow-sm ${isRTL ? '-left-3' : '-right-3'
            }`}
          aria-label={collapsed ? t('dashboardLayout.expandSidebar') : t('dashboardLayout.collapseSidebar')}
        >
          <CollapseIcon className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside
            className={`absolute top-0 h-full w-[260px] bg-surface animate-slide-right z-10 border-border ${isRTL ? 'right-0 border-l' : 'left-0 border-r'
              }`}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <div
        className={`flex-1 transition-all duration-300 ${collapsed
            ? isRTL
              ? 'lg:mr-[72px]'
              : 'lg:ml-[72px]'
            : isRTL
              ? 'lg:mr-[260px]'
              : 'lg:ml-[260px]'
          }`}
      >
        <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border h-16 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-muted hover:text-base rounded-md"
            aria-label={t('common.actions.openMenu')}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              {user?.avatar?.url ? (
                <img
                  src={user.avatar.url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
              )}
              <span className="hidden sm:inline font-medium text-heading">{user?.fullName}</span>
            </Link>
          </div>
        </header>

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
