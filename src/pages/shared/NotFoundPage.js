import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/i18n';

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="animate-fade-in text-center max-w-md">
        <div className="relative mx-auto mb-7 w-fit">
          <div className="absolute inset-0 -z-10 rounded-full bg-secondary/10 blur-xl" aria-hidden />
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-warning/20 bg-warning-light shadow-card">
            <SearchX className="h-9 w-9 text-warning" />
          </div>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight text-heading mb-2">404</h1>
        <h2 className="text-xl font-bold text-heading mb-3">{t('shared.notFound.title')}</h2>
        <p className="leading-relaxed text-muted mb-8">{t('shared.notFound.description')}</p>
        <Link to="/">
          <Button icon={Home}>{t('shared.notFound.backHome')}</Button>
        </Link>
      </div>
    </div>
  );
}
