import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, CalendarDays, MapPin, Share2, MoreHorizontal, X, ChevronRight,
  Info, Images, Users, LogIn, Languages, LayoutDashboard, Sun, Moon, CalendarClock,
} from 'lucide-react';
import { useI18n } from '../../i18n/i18n';
import { useAuth } from '../../auth/auth.hooks';
import { useThemeToggle } from '../ui/ThemeToggle';

/* ══════════════════════════════════════════════════════════════════
   PUBLIC MOBILE NAV — the single bottom tab bar for the whole public
   site (phones only). Route-based, so the same bar works on the landing
   and on every other public page (archive, meetings, …).
   Tabs: Home · Services · Visit · Social · More.
   Meetings / Archive / Login / Language live in the "More" sheet.
   ══════════════════════════════════════════════════════════════════ */

function MoreSheet({ open, onClose, isRTL, t, toggleLanguage, isAuthenticated, dark, toggleTheme }) {
  const items = [
    {
      icon: Info,
      label: t('landing.mobile.moreSheet.aboutLabel'),
      desc: t('landing.mobile.moreSheet.aboutDescription'),
      to: '/about',
      accent: 'bg-amber-500/10 text-amber-600',
    },
    {
      icon: Images,
      label: t('publicLayout.archive'),
      desc: t('landing.archive.label'),
      to: '/archive',
      accent: 'bg-indigo-500/10 text-indigo-600',
    },
    {
      icon: Users,
      label: t('publicLayout.meetings'),
      desc: t('landing.meetings.label'),
      to: '/meetings',
      accent: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      icon: CalendarClock,
      label: t('publicLayout.bookings'),
      desc: t('landing.bookings.label'),
      to: '/bookings/new',
      accent: 'bg-rose-500/10 text-rose-600',
    },
    isAuthenticated
      ? {
        icon: LayoutDashboard,
        label: t('publicLayout.dashboard'),
        desc: t('landing.mobile.moreSheet.loginDescription'),
        to: '/dashboard',
        accent: 'bg-primary/10 text-primary',
      }
      : {
        icon: LogIn,
        label: t('landing.mobile.moreSheet.loginLabel'),
        desc: t('landing.mobile.moreSheet.loginDescription'),
        to: '/auth/login',
        accent: 'bg-primary/10 text-primary',
      },
    {
      icon: dark ? Sun : Moon,
      label: dark ? t('common.theme.light') : t('common.theme.dark'),
      desc: isRTL ? 'تبديل مظهر الموقع' : 'Switch the site appearance',
      action: toggleTheme,
      keepOpen: true,
      accent: 'bg-slate-500/10 text-slate-500',
    },
    {
      icon: Languages,
      label: t('landing.mobile.moreSheet.languageLabel'),
      desc: t('landing.mobile.moreSheet.languageDescription'),
      action: toggleLanguage,
      accent: 'bg-secondary/10 text-primary',
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 inset-x-0 z-[71] bg-surface rounded-t-3xl border-t border-border shadow-2xl md:hidden"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className={`px-5 pt-2 pb-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-base font-black text-heading">{t('landing.mobile.moreSheet.title')}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-page flex items-center justify-center"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>
        <div className="px-4 pb-4 space-y-2.5 flex flex-col" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {items.map((item, i) => {
            const inner = (
              <div
                className={`flex items-center gap-4 p-4 rounded-2xl bg-page border border-border active:scale-[0.98] transition-transform ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.accent}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-heading">{item.label}</p>
                  <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
              </div>
            );
            return item.to ? (
              <Link key={i} to={item.to} onClick={onClose}>{inner}</Link>
            ) : (
              <button key={i} type="button" onClick={() => { item.action?.(); if (!item.keepOpen) onClose(); }} className="w-full text-start">{inner}</button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function PublicMobileNav() {
  const { t, isRTL, toggleLanguage } = useI18n();
  const { isAuthenticated } = useAuth();
  const { dark, toggle: toggleTheme } = useThemeToggle();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = [
    { id: 'home', to: '/', icon: Home, label: t('landing.mobile.tabs.home') },
    { id: 'services', to: '/services', icon: CalendarDays, label: t('landing.mobile.tabs.services') },
    { id: 'visit', to: '/visit', icon: MapPin, label: t('landing.mobile.tabs.visit') },
    { id: 'social', to: '/social', icon: Share2, label: t('landing.mobile.tabs.social') },
    { id: 'more', icon: MoreHorizontal, label: t('landing.mobile.tabs.more') },
  ];

  const renderInner = (tab, active) => (
    <>
      <div className={`relative w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-300 ${active ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'text-muted'}`}>
        <tab.icon className="h-4 w-4" />
      </div>
      <span className={`text-[9px] font-bold tracking-wide transition-colors duration-200 ${active ? 'text-primary' : 'text-muted'}`}>{tab.label}</span>
    </>
  );

  return (
    <>
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        isRTL={isRTL}
        t={t}
        toggleLanguage={toggleLanguage}
        isAuthenticated={isAuthenticated}
        dark={dark}
        toggleTheme={toggleTheme}
      />
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden">
        <div className="absolute inset-0 bg-surface/92 backdrop-blur-xl border-t border-border" />
        <div
          className="relative flex items-center justify-around px-1"
          style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))', paddingTop: '0.45rem' }}
        >
          {tabs.map((tab) => {
            if (tab.id === 'more') {
              return (
                <button
                  key={tab.id}
                  onClick={() => setMoreOpen(true)}
                  className="flex flex-col items-center gap-0.5 flex-1 py-1"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {renderInner(tab, moreOpen)}
                </button>
              );
            }
            return (
              <Link
                key={tab.id}
                to={tab.to}
                className="flex flex-col items-center gap-0.5 flex-1 py-1"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {renderInner(tab, location.pathname === tab.to)}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
