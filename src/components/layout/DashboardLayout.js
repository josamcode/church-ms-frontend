import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Church, LayoutDashboard, Users, UserCircle, LogOut, Menu,
  ChevronLeft, Sun, Moon, Construction,
} from 'lucide-react';
import { useAuth } from '../../auth/auth.hooks';
import Tooltip from '../ui/Tooltip';

const menuItems = [
  { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { label: 'الملف الشخصي', href: '/dashboard/profile', icon: UserCircle, permission: 'AUTH_VIEW_SELF' },
  { label: 'المستخدمون', href: '/dashboard/users', icon: Users, permission: 'USERS_VIEW' },
  { type: 'divider' },
  { label: 'قيد التطوير', href: '/dashboard/under-development', icon: Construction, permission: null },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

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
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-border cursor-pointer" onClick={() => navigate('/')}>
        <Church className="w-7 h-7 text-primary flex-shrink-0" />
        {!collapsed && (
          <span className="font-bold text-heading text-sm truncate">كنيسة الملاك ميخائيل</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item, i) =>
          item.type === 'divider' ? (
            <hr key={i} className="my-2 border-border" />
          ) : (
            <Tooltip key={item.href} content={collapsed ? item.label : null} position="left">
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

      {/* Bottom */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          onClick={toggleDark}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted hover:text-base hover:bg-surface-alt transition-colors w-full"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!collapsed && <span>{darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-danger hover:bg-danger-light transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-page flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 right-0 h-screen bg-surface border-l border-border z-30 transition-all duration-300
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        `}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -left-3 top-20 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-muted hover:text-base shadow-sm"
          aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[260px] bg-surface border-l border-border animate-slide-right z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'lg:mr-[72px]' : 'lg:mr-[260px]'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border h-16 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-muted hover:text-base rounded-md"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
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

        {/* Page Content */}
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
