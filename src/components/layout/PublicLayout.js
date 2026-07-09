import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  ArrowUp,
  CalendarDays,
  ChevronRight,
  Church,
  Facebook,
  Home,
  Images,
  Instagram,
  LayoutDashboard,
  LogIn,
  Menu,
  Twitter,
  X,
  Youtube,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../auth/auth.hooks';
import AppRouteEffects from '../../app/AppRouteEffects';
import Button from '../ui/Button';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { useI18n } from '../../i18n/i18n';
import { useLandingPublicContent } from '../../hooks/useLandingContent';

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
};

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { t, isRTL } = useI18n();
  const { text, getOptionalText, socialLinks } = useLandingPublicContent();

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 20);
      setShowTopBtn(window.scrollY > 600);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navLinks = useMemo(
    () => [
      { label: text('publicLayout.home'), href: '/' },
      { label: text('publicLayout.about'), href: '#about' },
      { label: text('publicLayout.priests'), href: '#priests' },
      // { label: text('publicLayout.verses'), href: '#verses' },
      { label: getOptionalText('publicLayout.archive', 'Archive'), href: '/archive' },
      { label: getOptionalText('publicLayout.meetings', 'Meetings'), href: '/meetings' },
      { label: text('publicLayout.visit'), href: '#visit' },
    ],
    [text, getOptionalText]
  );

  // App-like bottom tab bar for mobile — shown on non-landing public pages
  // (the landing renders its own mobile navigation).
  const showMobileTabBar = location.pathname !== '/';
  const mobileTabs = useMemo(
    () => [
      { label: text('publicLayout.home'), href: '/', icon: Home },
      { label: getOptionalText('publicLayout.meetings', 'Meetings'), href: '/meetings', icon: CalendarDays },
      { label: getOptionalText('publicLayout.archive', 'Archive'), href: '/archive', icon: Images },
      isAuthenticated
        ? { label: text('publicLayout.dashboard'), href: '/dashboard', icon: LayoutDashboard }
        : { label: text('publicLayout.login'), href: '/auth/login', icon: LogIn },
    ],
    [text, getOptionalText, isAuthenticated]
  );

  const enabledSocialLinks = useMemo(
    () => (Array.isArray(socialLinks) ? socialLinks.filter((entry) => entry?.enabled && entry?.url) : []),
    [socialLinks]
  );

  const brandPrimary = text('publicLayout.brandPrimary');
  const brandSecondary = text('publicLayout.brandSecondary');

  // The landing hero and the archive/meetings page-header bands are dark, so the
  // transparent header must render light until the user scrolls. Other public
  // pages keep dark text.
  const isLandingTop = location.pathname === '/' && !location.hash;
  const hasDarkHeaderBand =
    isLandingTop ||
    location.pathname === '/archive' ||
    location.pathname === '/meetings';
  const overHero = hasDarkHeaderBand && !scrolled;
  const ctaClass = overHero
    ? '!rounded-xl !text-xs !font-bold !px-4 !bg-secondary !text-[#1c1305] hover:!bg-[#c69a41]'
    : '!rounded-xl !text-xs !font-bold !px-4';

  const isLinkActive = (href) => {
    if (href === '/') return location.pathname === '/' && !location.hash;
    if (href.startsWith('/')) return location.pathname === href;
    return location.pathname === '/' && location.hash === href;
  };

  return (
    <div className="min-h-screen flex flex-col bg-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <AppRouteEffects />
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-surface/90 backdrop-blur-xl border-b border-border shadow-sm shadow-black/5'
          : 'bg-transparent border-b border-transparent'
          }`}
      >
        <div className="page-container flex items-center justify-between h-16 sm:h-[4.5rem]">
          <Link to="/" className="relative flex items-center gap-2.5 group">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${scrolled
                ? 'bg-primary/10 text-primary'
                : 'bg-white/10 text-primary backdrop-blur-sm'
                } group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25`}
            >
              <img src='/logo.png' />
            </div>
            <div className="hidden sm:block">
              <span
                className={`font-display font-extrabold text-sm leading-tight block ${overHero ? 'text-white' : 'text-heading'
                  }`}
              >
                {brandPrimary}
              </span>
              <span
                className={`text-[10px] font-medium leading-none ${overHero ? 'text-white/70' : scrolled ? 'text-muted' : 'text-muted/70'
                  }`}
              >
                {brandSecondary}
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-all duration-300 ${isLinkActive(link.href)
                  ? overHero
                    ? 'text-white bg-white/15'
                    : 'text-primary bg-primary/8'
                  : overHero
                    ? 'text-white/85 hover:text-white hover:bg-white/10'
                    : `${scrolled ? 'text-muted' : 'text-muted/80'} hover:text-primary hover:bg-primary/5`
                  }`}
              >
                {link.label}
                {isLinkActive(link.href) ? (
                  <span className={`absolute bottom-0 inset-x-3 h-0.5 rounded-full ${overHero ? 'bg-secondary' : 'bg-primary'}`} />
                ) : null}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm" className={ctaClass}>
                  {text('publicLayout.dashboard')}
                </Button>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button size="sm" icon={LogIn} className={ctaClass}>
                  {text('publicLayout.login')}
                </Button>
              </Link>
            )}
            {/* <button
              onClick={() => setMobileOpen(true)}
              className={`lg:hidden p-2.5 rounded-xl transition-colors ${scrolled ? 'text-muted hover:bg-primary/5 hover:text-primary' : 'text-muted/80 hover:text-primary'
                }`}
              aria-label={text('publicLayout.menu')}
            >
              <Menu className="w-5 h-5" />
            </button> */}
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-[85%] max-w-sm bg-surface shadow-2xl animate-slide-in-right flex flex-col`}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-primary">
                  <img src='/logo.png' />
                </div>
                <span className="font-extrabold text-heading text-sm">{brandPrimary}</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-muted hover:text-heading hover:bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-5 space-y-1">
              <div className="mb-4">
                <LanguageSwitcher />
              </div>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${isLinkActive(link.href)
                    ? 'bg-primary/8 text-primary'
                    : 'text-muted hover:bg-page hover:text-heading'
                    }`}
                >
                  {link.label}
                  <ChevronRight className={`w-4 h-4 opacity-40 ${isRTL ? 'rotate-180' : ''}`} />
                </a>
              ))}
            </nav>

            <div className="p-5 border-t border-border">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" className="!w-full !rounded-xl !font-bold">
                    {text('publicLayout.dashboard')}
                  </Button>
                </Link>
              ) : (
                <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" icon={LogIn} className="!w-full !rounded-xl !font-bold">
                    {text('publicLayout.login')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <main className={`flex-1 ${showMobileTabBar ? 'pb-20 lg:pb-0' : ''}`}>
        <Outlet />
      </main>

      {showMobileTabBar ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label={text('publicLayout.menu')}
        >
          <div
            className="mx-auto grid max-w-lg"
            style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, minmax(0, 1fr))` }}
          >
            {mobileTabs.map((tab) => {
              const active =
                tab.href === '/'
                  ? location.pathname === '/'
                  : location.pathname === tab.href || location.pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-semibold transition-colors ${active ? 'text-primary' : 'text-muted hover:text-heading'
                    }`}
                >
                  {active ? (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden />
                  ) : null}
                  <tab.icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                  <span className="max-w-full truncate">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      <footer className="relative bg-gradient-to-b from-surface to-page border-t border-border hidden md:flex">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="page-container pt-14 pb-8">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 ${isRTL ? 'text-right' : 'text-left'
              }`}
          >
            <div className="sm:col-span-2 lg:col-span-1">
              <div className={`flex items-center gap-2.5 mb-4 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-primary">
                  <img src='/logo.png' />
                </div>
                <div>
                  <span className="font-display font-extrabold text-heading text-sm block">{brandPrimary}</span>
                  <span className="text-[10px] text-muted">{brandSecondary}</span>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed max-w-xs">{text('publicLayout.location')}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-4">
                {text('publicLayout.quickLinks')}
              </h4>
              <div className="space-y-2.5">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`block text-sm text-muted hover:text-primary transition-colors ${isRTL ? 'text-right' : ''
                      }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-4">
                {text('publicLayout.contactUs')}
              </h4>
              <p className="text-sm text-muted leading-relaxed">{text('publicLayout.contactDesc')}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-4">
                {text('publicLayout.followUs')}
              </h4>
              <div className={`flex gap-2 ${isRTL ? 'justify-start' : ''}`}>
                {enabledSocialLinks.map((entry) => {
                  const Icon = SOCIAL_ICONS[entry.platform];
                  if (!Icon) return null;

                  return (
                    <a
                      key={entry.platform}
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-page border border-border text-muted hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all duration-300"
                      aria-label={entry.platform}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted/60">
              {text('publicLayout.rightsReserved')} - {brandPrimary} {new Date().getFullYear()}
            </p>
            <p className="text-xs text-muted/40 flex items-center gap-1">
              {text('publicLayout.footerCreditPrefix')}{' '}
              <a
                href="https://josam-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t('publicLayout.footerCreditName')}
              </a>{' '}
              {text('publicLayout.footerCreditSuffix')}
            </p>
          </div>
        </div>
      </footer>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-all duration-500 hover:bg-primary-dark hover:shadow-xl ${showTopBtn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
          }`}
        aria-label={text('publicLayout.scrollTop')}
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes slide-in-right {
          from { transform: translateX(${isRTL ? '-100%' : '100%'}); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
