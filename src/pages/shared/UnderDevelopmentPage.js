import { Construction, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { useI18n } from '../../i18n/i18n';

export default function UnderDevelopmentPage() {
  const { t, isRTL } = useI18n();

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: t('shared.dashboard'), href: '/dashboard' }, { label: t('dashboardLayout.menu.underDevelopment') }]} />

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-7 w-fit">
          <div className="absolute inset-0 -z-10 rounded-full bg-secondary/10 blur-xl" aria-hidden />
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-warning/20 bg-warning-light shadow-card">
            <Construction className="h-9 w-9 text-warning" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-heading mb-3">{t('shared.underDevelopment.title')}</h1>
        <p className="max-w-md leading-relaxed text-muted mb-2">{t('shared.underDevelopment.description')}</p>
        <p className="text-sm text-muted mb-8">{t('shared.underDevelopment.soon')}</p>
        <Link to="/dashboard">
          <Button variant="outline" icon={isRTL ? ArrowRight : ArrowLeft}>
            {t('shared.underDevelopment.backDashboard')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
