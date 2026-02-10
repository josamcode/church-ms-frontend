import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  Shield,
  Zap,
  Database,
  Puzzle,
  LogIn,
  ChevronDown,
  ChevronUp,
  Users,
  Lock,
  BarChart3,
  Settings,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/i18n';

function FAQ({ items, isRTL }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-3">
      {items.map((faq, index) => (
        <div key={index} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className={`w-full flex items-center justify-between p-4 hover:bg-surface-alt transition-colors ${
              isRTL ? 'text-right' : 'text-left'
            }`}
          >
            <span className="font-medium text-heading">{faq.q}</span>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 text-muted flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted flex-shrink-0" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-sm text-muted animate-fade-in">{faq.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const { t, isRTL } = useI18n();
  const ExploreIcon = isRTL ? ArrowLeft : ArrowRight;

  const features = useMemo(
    () => [
      {
        icon: Database,
        title: t('landing.features.dataTitle'),
        desc: t('landing.features.dataDesc'),
      },
      {
        icon: Shield,
        title: t('landing.features.securityTitle'),
        desc: t('landing.features.securityDesc'),
      },
      {
        icon: Zap,
        title: t('landing.features.performanceTitle'),
        desc: t('landing.features.performanceDesc'),
      },
      {
        icon: Puzzle,
        title: t('landing.features.scalabilityTitle'),
        desc: t('landing.features.scalabilityDesc'),
      },
    ],
    [t]
  );

  const steps = useMemo(
    () => [
      { num: '1', icon: Users, title: t('landing.steps.oneTitle'), desc: t('landing.steps.oneDesc') },
      { num: '2', icon: Lock, title: t('landing.steps.twoTitle'), desc: t('landing.steps.twoDesc') },
      { num: '3', icon: BarChart3, title: t('landing.steps.threeTitle'), desc: t('landing.steps.threeDesc') },
      { num: '4', icon: Settings, title: t('landing.steps.fourTitle'), desc: t('landing.steps.fourDesc') },
    ],
    [t]
  );

  const faqs = useMemo(
    () => [
      { q: t('landing.faqs.oneQ'), a: t('landing.faqs.oneA') },
      { q: t('landing.faqs.twoQ'), a: t('landing.faqs.twoA') },
      { q: t('landing.faqs.threeQ'), a: t('landing.faqs.threeA') },
      { q: t('landing.faqs.fourQ'), a: t('landing.faqs.fourA') },
    ],
    [t]
  );

  const stats = useMemo(
    () => [
      { label: t('landing.stats.activeMembers'), value: '+500' },
      { label: t('landing.stats.registeredFamilies'), value: '+120' },
      { label: t('landing.stats.apiEndpoints'), value: '16' },
      { label: t('landing.stats.permissions'), value: '15' },
    ],
    [t]
  );

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary/5 via-transparent to-secondary/5">
        <div className="page-container py-20 md:py-28 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-heading leading-tight mb-6">
            {t('landing.heroTitle')}
            <br />
            <span className="text-primary">{t('landing.heroHighlight')}</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-8">{t('landing.heroDescription')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/login">
              <Button size="lg" icon={LogIn}>
                {t('landing.login')}
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" icon={ExploreIcon} iconPosition="end">
                {t('landing.discover')}
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {stats.map((item, index) => (
              <div key={index} className="bg-surface rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-primary">{item.value}</div>
                <div className="text-xs text-muted mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-surface">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-heading mb-3">{t('landing.featuresTitle')}</h2>
            <p className="text-muted max-w-lg mx-auto">{t('landing.featuresSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-page rounded-lg border border-border p-6 text-center hover:shadow-dropdown transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-heading mb-2">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-heading mb-3">{t('landing.howTitle')}</h2>
            <p className="text-muted max-w-lg mx-auto">{t('landing.howSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs text-primary font-bold mb-1">
                  {t('landing.stepLabel', { num: step.num })}
                </div>
                <h3 className="font-bold text-heading mb-1">{step.title}</h3>
                <p className="text-sm text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-surface">
        <div className="page-container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-heading mb-3">{t('landing.faqTitle')}</h2>
          </div>
          <FAQ items={faqs} isRTL={isRTL} />
        </div>
      </section>

      <section className="py-20 bg-primary text-white">
        <div className="page-container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('landing.ctaTitle')}</h2>
          <p className="text-white/80 max-w-lg mx-auto mb-8">{t('landing.ctaDescription')}</p>
          <Link to="/auth/login">
            <Button variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
              {t('landing.login')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
