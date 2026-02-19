import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Church,
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Construction,
  CalendarCheck2,
  BellRing,
  BarChart3,
  Sparkles,
  Building2,
  CalendarDays,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/auth.hooks';
import Tooltip from '../ui/Tooltip';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { useI18n } from '../../i18n/i18n';
import { getRoleLabel } from '../../utils/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// NavItem
// ─────────────────────────────────────────────────────────────────────────────
function NavItem({ item, active, collapsed, isRTL, tooltipSide, onClick, nested = false }) {
  if (collapsed) {
    return (
      <Tooltip content={item.label} position={tooltipSide}>
        <Link
          to={item.href}
          onClick={onClick}
          className={[
            'relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150',
            active
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'text-muted hover:bg-surface-alt hover:text-heading',
          ].join(' ')}
        >
          <item.icon className="h-[18px] w-[18px]" />
          {active && (
            <span className={`absolute inset-y-2.5 w-0.5 rounded-full bg-white/50 ${isRTL ? 'right-0.5' : 'left-0.5'}`} />
          )}
        </Link>
      </Tooltip>
    );
  }

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={[
        'group relative flex w-full items-center gap-3 rounded-xl font-medium transition-all duration-150 select-none',
        nested ? 'py-2 px-3 text-[13px]' : 'px-3 py-2.5 text-sm',
        active
          ? 'bg-primary text-white shadow-md shadow-primary/20'
          : 'text-muted hover:bg-surface-alt hover:text-heading',
      ].join(' ')}
    >
      {active && (
        <span className={`absolute inset-y-2.5 w-0.5 rounded-full bg-white/50 ${isRTL ? 'right-0' : 'left-0'}`} />
      )}
      <span className={[
        'flex flex-shrink-0 items-center justify-center rounded-lg transition-colors',
        nested ? 'h-6 w-6' : 'h-7 w-7',
        active ? 'text-white' : 'text-muted group-hover:text-heading',
      ].join(' ')}>
        <item.icon className={nested ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NavGroup — open state is CONTROLLED from outside (passed as props)
// ─────────────────────────────────────────────────────────────────────────────
function NavGroup({ group, open, onToggle, isRTL, tooltipSide, isItemActive, onLinkClick }) {
  const groupActive =
    (group.parentVisible && isItemActive(group.parent)) ||
    group.children.some((c) => isItemActive(c));

  const hasChildren = group.children.length > 0;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        {group.parentVisible ? (
          <Link
            to={group.parent.href}
            onClick={onLinkClick}
            className={[
              'group relative flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
              groupActive
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-muted hover:bg-surface-alt hover:text-heading',
            ].join(' ')}
          >
            {groupActive && (
              <span className={`absolute inset-y-2.5 w-0.5 rounded-full bg-white/50 ${isRTL ? 'right-0' : 'left-0'}`} />
            )}
            <span className={[
              'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
              groupActive ? 'text-white' : 'text-muted group-hover:text-heading',
            ].join(' ')}>
              <group.parent.icon className="h-4 w-4" />
            </span>
            <span className="truncate">{group.parent.label}</span>
          </Link>
        ) : (
          <div className="flex flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted/50">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
              <group.parent.icon className="h-4 w-4" />
            </span>
            <span className="truncate">{group.parent.label}</span>
          </div>
        )}

        {hasChildren && (
          <button
            type="button"
            onClick={onToggle}
            className={[
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 hover:bg-surface-alt hover:text-heading',
              groupActive ? 'text-primary' : 'text-muted',
            ].join(' ')}
            aria-expanded={open}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className={[
          'space-y-0.5',
          isRTL ? 'mr-[18px] border-r border-border/40 pr-2' : 'ml-[18px] border-l border-border/40 pl-2',
        ].join(' ')}>
          {group.children.map((child) => (
            <NavItem
              key={child.href}
              item={child}
              active={isItemActive(child)}
              collapsed={false}
              isRTL={isRTL}
              tooltipSide={tooltipSide}
              onClick={onLinkClick}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavDivider({ collapsed }) {
  return (
    <div className={`my-1.5 ${collapsed ? 'flex justify-center' : ''}`}>
      <div className={`h-px bg-border/50 ${collapsed ? 'w-8' : 'w-full'}`} />
    </div>
  );
}

function NavSectionLabel({ label }) {
  return (
    <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted/40 first:mt-0">
      {label}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DashboardLayout
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const { user, logout, hasPermission } = useAuth();
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Menu definitions ──────────────────────────────────────────────────────

  const topItems = useMemo(() => [
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
  ], [t]);

  const groupedItems = useMemo(() => [
    {
      key: 'users',
      parent: {
        label: t('dashboardLayout.menu.users'),
        href: '/dashboard/users',
        icon: Users,
        permission: 'USERS_VIEW',
        matchChildren: true,
      },
      children: [
        {
          label: t('dashboardLayout.menu.familyHouseLookup'),
          href: '/dashboard/users/family-house',
          icon: Building2,
          permission: 'USERS_VIEW',
          matchChildren: false,
        },
      ],
    },
    {
      key: 'confessions',
      parent: {
        label: t('dashboardLayout.menu.confessionSessions'),
        href: '/dashboard/confessions',
        icon: CalendarCheck2,
        permission: 'CONFESSIONS_VIEW',
        matchChildren: false,
      },
      children: [
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
      ],
    },
    {
      key: 'visitations',
      parent: {
        label: t('dashboardLayout.menu.pastoralVisitations'),
        href: '/dashboard/visitations',
        icon: CalendarCheck2,
        permission: 'PASTORAL_VISITATIONS_VIEW',
        matchChildren: true,
      },
      children: [
        {
          label: t('dashboardLayout.menu.pastoralVisitationsCreate'),
          href: '/dashboard/visitations/new',
          icon: Sparkles,
          permission: 'PASTORAL_VISITATIONS_CREATE',
          matchChildren: false,
        },
        {
          label: t('dashboardLayout.menu.pastoralVisitationsAnalytics'),
          href: '/dashboard/visitations/analytics',
          icon: BarChart3,
          permission: 'PASTORAL_VISITATIONS_ANALYTICS_VIEW',
          matchChildren: false,
        },
      ],
    },
    {
      key: 'meetings',
      parent: {
        label: t('dashboardLayout.menu.meetingsAndSectors'),
        href: '/dashboard/meetings',
        icon: CalendarDays,
        permission: ['SECTORS_VIEW', 'MEETINGS_VIEW'],
        matchChildren: false,
      },
      children: [],
    },
  ], [t]);

  const bottomItems = useMemo(() => [
    {
      label: t('dashboardLayout.menu.underDevelopment'),
      href: '/dashboard/under-development',
      icon: Construction,
      permission: null,
      matchChildren: false,
    },
  ], [t]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isItemAllowed = useCallback((item) => {
    if (!item.permission) return true;
    if (Array.isArray(item.permission)) return item.permission.some((p) => hasPermission(p));
    return hasPermission(item.permission);
  }, [hasPermission]);

  const isItemActive = useCallback((item) => {
    if (!item?.href) return false;
    if (location.pathname === item.href) return true;
    if (!item.matchChildren) return false;
    return location.pathname.startsWith(`${item.href}/`);
  }, [location.pathname]);

  // ── Filtered menu ─────────────────────────────────────────────────────────

  const visibleTopItems = useMemo(() => topItems.filter(isItemAllowed), [topItems, isItemAllowed]);

  const visibleGroups = useMemo(() =>
    groupedItems
      .map((group) => {
        const parentVisible = isItemAllowed(group.parent);
        const children = group.children.filter(isItemAllowed);
        if (!parentVisible && children.length === 0) return null;
        return { ...group, parentVisible, children };
      })
      .filter(Boolean),
    [groupedItems, isItemAllowed]
  );

  const visibleBottomItems = useMemo(() => bottomItems.filter(isItemAllowed), [bottomItems, isItemAllowed]);

  // ── Group open state — lives HERE, never inside NavGroup ─────────────────
  // Initialise once; auto-open groups whose route is active.
  const [openGroups, setOpenGroups] = useState(() => {
    const init = {};
    return init;
  });

  // Whenever the pathname changes, ensure groups with an active child are open.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      visibleGroups.forEach((group) => {
        const isActive =
          (group.parentVisible && isItemActive(group.parent)) ||
          group.children.some((c) => isItemActive(c));
        if (isActive && !next[group.key]) {
          next[group.key] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [location.pathname, visibleGroups, isItemActive]);

  const toggleGroup = useCallback((key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Active item (for breadcrumb) ──────────────────────────────────────────

  const activeItem = useMemo(() => {
    const flat = [
      ...visibleTopItems,
      ...visibleGroups.flatMap((g) => [...(g.parentVisible ? [g.parent] : []), ...g.children]),
      ...visibleBottomItems,
    ];
    return flat
      .filter((item) => item.href)
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isItemActive(item));
  }, [visibleTopItems, visibleGroups, visibleBottomItems, isItemActive]);

  // ── Theme / auth ──────────────────────────────────────────────────────────

  const toggleDark = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth/login');
  }, [logout, navigate]);

  const tooltipSide = isRTL ? 'left' : 'right';
  const CollapseIcon = isRTL
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft);

  // ── Nav JSX helpers (pure JSX, not components — no state risk) ────────────

  const renderExpandedNav = (onLinkClick) => (
    <>
      <NavSectionLabel label={t('dashboardLayout.section.main')} />

      {visibleTopItems.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          active={isItemActive(item)}
          collapsed={false}
          isRTL={isRTL}
          tooltipSide={tooltipSide}
          onClick={onLinkClick}
        />
      ))}

      {visibleGroups.length > 0 && (
        <>
          <NavDivider collapsed={false} />
          <NavSectionLabel label={t('dashboardLayout.section.manage')} />
          {visibleGroups.map((group) => (
            <NavGroup
              key={group.key}
              group={group}
              open={!!openGroups[group.key]}
              onToggle={() => toggleGroup(group.key)}
              isRTL={isRTL}
              tooltipSide={tooltipSide}
              isItemActive={isItemActive}
              onLinkClick={onLinkClick}
            />
          ))}
        </>
      )}

      {visibleBottomItems.length > 0 && (
        <>
          <NavDivider collapsed={false} />
          <NavSectionLabel label={t('dashboardLayout.section.other')} />
          {visibleBottomItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isItemActive(item)}
              collapsed={false}
              isRTL={isRTL}
              tooltipSide={tooltipSide}
              onClick={onLinkClick}
            />
          ))}
        </>
      )}
    </>
  );

  const renderCollapsedNav = () => (
    <>
      {visibleTopItems.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          active={isItemActive(item)}
          collapsed
          isRTL={isRTL}
          tooltipSide={tooltipSide}
          onClick={() => { }}
        />
      ))}

      {visibleGroups.length > 0 && <NavDivider collapsed />}

      {visibleGroups.map((group) =>
        group.parentVisible ? (
          <NavItem
            key={group.parent.href}
            item={group.parent}
            active={isItemActive(group.parent) || group.children.some((c) => isItemActive(c))}
            collapsed
            isRTL={isRTL}
            tooltipSide={tooltipSide}
            onClick={() => { }}
          />
        ) : null
      )}

      {visibleBottomItems.length > 0 && <NavDivider collapsed />}

      {visibleBottomItems.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          active={isItemActive(item)}
          collapsed
          isRTL={isRTL}
          tooltipSide={tooltipSide}
          onClick={() => { }}
        />
      ))}
    </>
  );

  // ── Sidebar footer (shared between desktop & mobile) ─────────────────────
  // Defined as a real component OUTSIDE render so it never remounts.
  // We pass all dependencies as props.

  const footerProps = {
    collapsed,
    darkMode,
    toggleDark,
    handleLogout,
    tooltipSide,
    user,
    t,
    isRTL,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-page">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-primary/8 blur-[80px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/8 blur-[60px]" />
      </div>

      <div className="flex">

        {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
        <aside
          className={[
            'fixed top-0 z-30 hidden h-screen flex-col bg-surface transition-[width] duration-300 ease-in-out lg:flex',
            isRTL ? 'right-0 border-l border-border/70' : 'left-0 border-r border-border/70',
            collapsed ? 'w-[68px]' : 'w-[260px]',
          ].join(' ')}
        >
          {/* Brand */}
          <div className={[
            'flex flex-shrink-0 items-center gap-3 border-b border-border/60',
            collapsed ? 'justify-center px-2 py-[14px]' : 'px-4 py-[14px]',
          ].join(' ')}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
              <Church className="h-[18px] w-[18px]" />
            </button>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold leading-tight tracking-tight text-heading">
                  {t('common.appName')}
                </p>
                <p className="truncate text-[11px] leading-tight text-muted/60">
                  {user?.role ? getRoleLabel(user.role) : ''}
                </p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className={[
            'flex-1 overflow-y-auto overflow-x-hidden py-3',
            collapsed ? 'flex flex-col items-center gap-1 px-2' : 'space-y-0.5 px-3',
          ].join(' ')}>
            {collapsed ? renderCollapsedNav() : renderExpandedNav(() => { })}
          </nav>

          {/* Footer */}
          <SidebarFooter {...footerProps} onLinkClick={() => { }} />

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={[
              'absolute top-[52px] flex h-5 w-5 items-center justify-center rounded-full border border-border/80 bg-surface text-muted shadow-sm transition-all hover:border-primary/40 hover:text-primary',
              isRTL ? '-left-2.5' : '-right-2.5',
            ].join(' ')}
            aria-label={collapsed ? t('dashboardLayout.expandSidebar') : t('dashboardLayout.collapseSidebar')}
          >
            <CollapseIcon className="h-2.5 w-2.5" />
          </button>
        </aside>

        {/* ── Mobile Drawer ──────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
            <aside className={[
              'absolute top-0 flex h-full w-[260px] flex-col bg-surface shadow-2xl',
              isRTL ? 'right-0 border-l border-border/70' : 'left-0 border-r border-border/70',
            ].join(' ')}>
              {/* Header + close */}
              <div className="flex flex-shrink-0 items-center gap-3 border-b border-border/60 px-4 py-[14px]">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30"
                >
                  <Church className="h-[18px] w-[18px]" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold leading-tight tracking-tight text-heading">
                    {t('common.appName')}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted/60">
                    {user?.role ? getRoleLabel(user.role) : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-alt hover:text-heading"
                  aria-label={t('common.actions.close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-3 py-3">
                {renderExpandedNav(() => setSidebarOpen(false))}
              </nav>

              {/* Footer */}
              <SidebarFooter {...footerProps} onLinkClick={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* ── Main area ─────────────────────────────────────────────────── */}
        <div className={[
          'flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ease-in-out',
          collapsed
            ? isRTL ? 'lg:mr-[68px]' : 'lg:ml-[68px]'
            : isRTL ? 'lg:mr-[260px]' : 'lg:ml-[260px]',
        ].join(' ')}>

          {/* Topbar */}
          <header className="sticky top-0 z-20 flex h-[56px] flex-shrink-0 items-center gap-3 border-b border-border/70 bg-surface/95 px-4 backdrop-blur-sm lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:bg-surface-alt hover:text-heading lg:hidden"
              aria-label={t('common.actions.openMenu')}
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Breadcrumb */}
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="hidden text-[13px] text-muted/50 lg:inline">{t('common.appName')}</span>
              {activeItem ? (
                <>
                  <ChevronRight className="hidden h-3 w-3 flex-shrink-0 text-muted/30 lg:block" />
                  <h1 className="truncate text-[13px] font-semibold text-heading">{activeItem.label}</h1>
                </>
              ) : (
                <h1 className="truncate text-[13px] font-semibold text-heading">
                  {t('dashboardLayout.menu.dashboard')}
                </h1>
              )}
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              <button
                onClick={toggleDark}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:bg-surface-alt hover:text-heading"
                aria-label={darkMode ? t('common.theme.light') : t('common.theme.dark')}
              >
                {darkMode ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
              </button>

              <Link
                to="/dashboard/profile"
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface-alt/40 px-2 py-1.5 transition-colors hover:border-primary/25 hover:bg-surface-alt"
              >
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="h-7 w-7 rounded-full border border-border/60 object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <UserCircle className="h-[16px] w-[16px] text-primary" />
                  </div>
                )}
                <span className="hidden max-w-[140px] truncate text-[13px] font-medium text-heading md:inline">
                  {user?.name || '—'}
                </span>
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SidebarFooter — defined at module level so it NEVER remounts
// ─────────────────────────────────────────────────────────────────────────────
function SidebarFooter({ collapsed, darkMode, toggleDark, handleLogout, tooltipSide, user, t, isRTL, onLinkClick }) {
  return (
    <div className={[
      'border-t border-border/60',
      collapsed ? 'flex flex-col items-center gap-1 p-2' : 'space-y-1 p-3',
    ].join(' ')}>

      {!collapsed && (
        <div className="rounded-xl bg-surface-alt/50 p-1">
          <LanguageSwitcher className="w-full justify-center" />
        </div>
      )}

      <Tooltip
        content={collapsed ? (darkMode ? t('common.theme.light') : t('common.theme.dark')) : null}
        position={tooltipSide}
      >
        <button
          onClick={toggleDark}
          className={[
            'flex items-center rounded-xl text-sm text-muted transition-colors hover:bg-surface-alt hover:text-heading',
            collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-3 py-2.5',
          ].join(' ')}
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
            {darkMode ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
          </span>
          {!collapsed && (
            <span className="font-medium">
              {darkMode ? t('common.theme.light') : t('common.theme.dark')}
            </span>
          )}
        </button>
      </Tooltip>

      <Tooltip content={collapsed ? t('common.actions.logout') : null} position={tooltipSide}>
        <button
          onClick={handleLogout}
          className={[
            'flex items-center rounded-xl text-sm font-medium text-danger transition-colors hover:bg-danger-light',
            collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-3 py-2.5',
          ].join(' ')}
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
            <LogOut className="h-[15px] w-[15px]" />
          </span>
          {!collapsed && <span>{t('common.actions.logout')}</span>}
        </button>
      </Tooltip>

      {!collapsed ? (
        <Link
          to="/dashboard/profile"
          onClick={onLinkClick}
          className="mt-1 flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface-alt/40 px-3 py-2.5 transition-colors hover:border-primary/25 hover:bg-surface-alt"
        >
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt="" className="h-8 w-8 flex-shrink-0 rounded-full border border-border/60 object-cover" />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-[18px] w-[18px] text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-heading">{user?.name || '—'}</p>
            <p className="truncate text-[11px] leading-tight text-muted/60">
              {user?.role ? getRoleLabel(user.role) : ''}
            </p>
          </div>
        </Link>
      ) : (
        <Tooltip content={user?.name || ''} position={tooltipSide}>
          <Link
            to="/dashboard/profile"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-surface-alt/40 transition-colors hover:border-primary/25 hover:bg-surface-alt"
          >
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <UserCircle className="h-[18px] w-[18px] text-muted" />
            )}
          </Link>
        </Tooltip>
      )}
    </div>
  );
}