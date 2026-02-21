import { Outlet, Link, useLocation } from 'react-router-dom';
import { Church, LogIn, Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth.hooks';
import Button from '../ui/Button';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { useI18n } from '../../i18n/i18n';

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

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
    <div className="min-h-screen flex flex-col bg-page">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-border">
        <div className="page-container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Church className="w-7 h-7 text-primary" />
            <span className="font-bold text-heading text-base hidden sm:inline">كنيسة الملاك ميخائيل</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isLinkActive(link.href) ? 'text-primary' : 'text-muted'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm">{t('publicLayout.dashboard')}</Button>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button size="sm" icon={LogIn}>
                  {t('publicLayout.login')}
                </Button>
              </Link>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 text-muted hover:text-base"
              aria-label={t('publicLayout.menu')}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-surface animate-slide-up">
            <nav className="page-container py-4 space-y-2">
              <div className="pb-2">
                <LanguageSwitcher />
              </div>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm py-2 text-muted hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-surface border-t border-border">
        <div className="page-container py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Church className="w-6 h-6 text-primary" />
                <span className="font-bold text-heading">كنيسة الملاك ميخائيل</span>
              </div>
              <p className="text-sm text-muted">{t('publicLayout.location')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-heading mb-3">{t('publicLayout.quickLinks')}</h4>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-heading mb-3">{t('publicLayout.contactUs')}</h4>
              <p className="text-sm text-muted">{t('publicLayout.contactDesc')}</p>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-4 text-center text-xs text-muted">
            {t('publicLayout.rightsReserved')} — كنيسة الملاك ميخائيل {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
