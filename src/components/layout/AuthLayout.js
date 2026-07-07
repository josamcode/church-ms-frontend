import { Outlet, Link, useLocation } from 'react-router-dom';
import AppRouteEffects from '../../app/AppRouteEffects';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { useI18n } from '../../i18n/i18n';

export default function AuthLayout() {
  const { t } = useI18n();
  const location = useLocation();
  const isRegisterPage = location.pathname === '/auth/register';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-page p-4">
      <AppRouteEffects />

      {/* Ambient warm background */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-secondary/10 blur-[90px]" />
      </div>

      <div className={`w-full ${isRegisterPage ? 'max-w-6xl' : 'max-w-md'}`}>
        <div className="mb-3 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface p-2 shadow-md ring-1 ring-secondary/25">
              <img src="/logo.png" alt="" className="h-full w-full object-contain" />
            </span>
            <span>
              <h1 className="text-xl font-bold tracking-tight text-heading">{t('common.appName')}</h1>
              <p className="mt-0.5 text-xs text-muted">{t('auth.authLayoutSubTitle')}</p>
            </span>
          </Link>
        </div>

        <div
          className={`rounded-2xl border border-border bg-surface shadow-lg ${
            isRegisterPage ? 'p-4 sm:p-6 lg:p-8' : 'p-6 sm:p-8'
          }`}
        >
          <Outlet />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          {t('auth.rightsReserved')} — {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
