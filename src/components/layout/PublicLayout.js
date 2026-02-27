import { Outlet, Link, useLocation } from 'react-router-dom';
import { Church, LogIn, Menu, X, ChevronRight, Heart, Facebook, Youtube, Instagram, ArrowUp } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../auth/auth.hooks';
import Button from '../ui/Button';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { useI18n } from '../../i18n/i18n';

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { t, isRTL } = useI18n();

  /* ── Scroll detection ── */
  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 20);
      setShowTopBtn(window.scrollY > 600);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* ── Lock body scroll when mobile menu is open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = useMemo(
    () => [
      { label: t('publicLayout.home'), href: '/' },
      { label: t('publicLayout.about'), href: '#about' },
      { label: t('publicLayout.priests'), href: '#priests' },
      { label: t('publicLayout.verses'), href: '#verses' },
      { label: t('publicLayout.visit'), href: '#visit' },
    ],
    [t]
  );

  const isLinkActive = (href) => {
    if (href === '/') return location.pathname === '/' && !location.hash;
    return location.pathname === '/' && location.hash === href;
  };

  return (
    <div className="min-h-screen flex flex-col bg-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ═══════════════════════════════════════════
          HEADER – Glassmorphism with smart scroll
          ═══════════════════════════════════════════ */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-surface/90 backdrop-blur-xl border-b border-border shadow-sm shadow-black/5'
          : 'bg-transparent border-b border-transparent'
          }`}
      >
        <div className="page-container flex items-center justify-between h-16 sm:h-[4.5rem]">
          {/* Logo */}
          <Link to="/" className="relative flex items-center gap-2.5 group">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${scrolled
              ? 'bg-primary/10 text-primary'
              : 'bg-white/10 text-primary backdrop-blur-sm'
              } group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25`}>
              <Church className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-heading text-sm leading-tight block">
                كنيسة الملاك ميخائيل
              </span>
              <span className={`text-[10px] font-medium leading-none ${scrolled ? 'text-muted' : 'text-muted/70'}`}>
                Archangel Michael Church
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-all duration-300 ${isLinkActive(link.href)
                  ? 'text-primary bg-primary/8'
                  : `${scrolled ? 'text-muted' : 'text-muted/80'} hover:text-primary hover:bg-primary/5`
                  }`}
              >
                {link.label}
                {isLinkActive(link.href) && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-primary rounded-full" />
                )}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm" className="!rounded-xl !text-xs !font-bold !px-4">
                  {t('publicLayout.dashboard')}
                </Button>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button size="sm" icon={LogIn} className="!rounded-xl !text-xs !font-bold !px-4">
                  {t('publicLayout.login')}
                </Button>
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className={`lg:hidden p-2.5 rounded-xl transition-colors ${scrolled ? 'text-muted hover:bg-primary/5 hover:text-primary' : 'text-muted/80 hover:text-primary'
                }`}
              aria-label={t('publicLayout.menu')}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          MOBILE MENU – Full-screen overlay
          ═══════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-[85%] max-w-sm bg-surface shadow-2xl animate-slide-in-right flex flex-col`}>
            {/* Mobile header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Church className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-heading text-sm">كنيسة الملاك ميخائيل</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-muted hover:text-heading hover:bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile links */}
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

            {/* Mobile CTA */}
            <div className="p-5 border-t border-border">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" className="!w-full !rounded-xl !font-bold">
                    {t('publicLayout.dashboard')}
                  </Button>
                </Link>
              ) : (
                <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" icon={LogIn} className="!w-full !rounded-xl !font-bold">
                    {t('publicLayout.login')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════ */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ═══════════════════════════════════════════
          FOOTER – Modern multi-column
          ═══════════════════════════════════════════ */}
      <footer className="relative bg-gradient-to-b from-surface to-page border-t border-border">
        {/* Decorative top line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="page-container pt-14 pb-8">
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Brand column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className={`flex items-center gap-2.5 mb-4 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Church className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-heading text-sm block">كنيسة الملاك ميخائيل</span>
                  <span className="text-[10px] text-muted">Archangel Michael Church</span>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed max-w-xs">
                {t('publicLayout.location')}
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-4">
                {t('publicLayout.quickLinks')}
              </h4>
              <div className="space-y-2.5">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`block text-sm text-muted hover:text-primary transition-colors ${isRTL ? 'text-right' : ''}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-4">
                {t('publicLayout.contactUs')}
              </h4>
              <p className="text-sm text-muted leading-relaxed">
                {t('publicLayout.contactDesc')}
              </p>
            </div>

            {/* Social / Extra column */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-4">
                {isRTL ? 'تابعنا' : 'Follow Us'}
              </h4>
              <div className={`flex gap-2 ${isRTL ? 'justify-start' : ''}`}>
                {[Facebook, Youtube, Instagram].map((Icon, i) => (
                  <button
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-page border border-border text-muted hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted/60">
              {t('publicLayout.rightsReserved')} — كنيسة الملاك ميخائيل {new Date().getFullYear()}
            </p>
            <p className="text-xs text-muted/40 flex items-center gap-1">
              {isRTL ? (
                <>
                  تم التطوير بواسطة{' '}
                  <a
                    href="https://josam-portfolio.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    م/جرجس صموئيل
                  </a>{' '}
                  وارشاد الاباء الكهنة
                </>
              ) : (
                <>
                  Developed by{' '}
                  <a
                    href="https://josam-portfolio.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Eng. Gerges Samuel
                  </a>{' '}
                  under the guidance of the Priests
                </>
              )}
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════
          SCROLL TO TOP BUTTON
          ═══════════════════════════════════════════ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-all duration-500 hover:bg-primary-dark hover:shadow-xl ${showTopBtn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
          }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* ═══════════════════════════════════════════
          GLOBAL ANIMATION STYLES
          ═══════════════════════════════════════════ */}
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