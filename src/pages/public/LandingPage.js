import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Phone,
  Mail,
  Heart,
  Users,
  BookOpen,
  Music,
  HandHeart,
  Baby,
  Cross,
  Calendar,
  ArrowRight,
  ArrowLeft,
  LogIn,
  Star,
  Church,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/i18n';

/* ─────────────────────────── FAQ Accordion ─────────────────────────── */
function FAQ({ items, isRTL }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-3">
      {items.map((faq, index) => (
        <div
          key={index}
          className="border border-border rounded-xl overflow-hidden bg-page transition-all duration-200"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className={`w-full flex items-center justify-between p-5 hover:bg-surface-alt transition-colors ${isRTL ? 'text-right flex-row-reverse' : 'text-left'
              }`}
          >
            <span className="font-semibold text-heading">{faq.q}</span>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted flex-shrink-0" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-5 pb-5 text-sm text-muted leading-relaxed animate-fade-in">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────── Service Time Card ──────────────────────── */
function ServiceCard({ icon: Icon, day, time, name, isRTL }) {
  return (
    <div className="group bg-page rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-dropdown transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h4 className="font-bold text-heading text-sm">{name}</h4>
          <p className="text-xs text-muted mt-0.5">{day}</p>
          <p className="text-sm text-primary font-semibold mt-1">{time}</p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── Ministry / Activity Card ─────────────────── */
function MinistryCard({ icon: Icon, title, desc }) {
  return (
    <div className="group bg-page rounded-xl border border-border p-6 hover:shadow-dropdown hover:border-primary/20 transition-all duration-300 text-center">
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:shadow-md transition-all duration-300">
        <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
      </div>
      <h3 className="font-bold text-heading mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{desc}</p>
    </div>
  );
}

/* ────────────────────────── Event Card ───────────────────────────── */
function EventCard({ title, date, desc, isRTL }) {
  return (
    <div className="group bg-page rounded-xl border border-border overflow-hidden hover:shadow-dropdown hover:border-primary/20 transition-all duration-300">
      <div className="bg-primary/5 border-b border-border px-5 py-3 flex items-center gap-3">
        <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm font-semibold text-primary">{date}</span>
      </div>
      <div className={`p-5 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h4 className="font-bold text-heading mb-2">{title}</h4>
        <p className="text-sm text-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════ MAIN PAGE ═══════════════════════════════ */
export default function LandingPage() {
  const { t, isRTL } = useI18n();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  /* ── All data driven by translation keys ── */

  const stats = useMemo(
    () => [
      { icon: Users, label: t('landing.stats.families'), value: t('landing.stats.familiesValue') },
      { icon: Heart, label: t('landing.stats.members'), value: t('landing.stats.membersValue') },
      { icon: Star, label: t('landing.stats.yearsServing'), value: t('landing.stats.yearsServingValue') },
      { icon: HandHeart, label: t('landing.stats.ministries'), value: t('landing.stats.ministriesValue') },
    ],
    [t]
  );

  const services = useMemo(
    () => [
      {
        icon: Cross,
        name: t('landing.services.liturgyName'),
        day: t('landing.services.liturgyDay'),
        time: t('landing.services.liturgyTime'),
      },
      {
        icon: BookOpen,
        name: t('landing.services.sundaySchoolName'),
        day: t('landing.services.sundaySchoolDay'),
        time: t('landing.services.sundaySchoolTime'),
      },
      {
        icon: Music,
        name: t('landing.services.praiseNightName'),
        day: t('landing.services.praiseNightDay'),
        time: t('landing.services.praiseNightTime'),
      },
      {
        icon: Users,
        name: t('landing.services.bibleStudyName'),
        day: t('landing.services.bibleStudyDay'),
        time: t('landing.services.bibleStudyTime'),
      },
    ],
    [t]
  );

  const ministries = useMemo(
    () => [
      {
        icon: Users,
        title: t('landing.ministries.youthTitle'),
        desc: t('landing.ministries.youthDesc'),
      },
      {
        icon: Baby,
        title: t('landing.ministries.childrenTitle'),
        desc: t('landing.ministries.childrenDesc'),
      },
      {
        icon: HandHeart,
        title: t('landing.ministries.outreachTitle'),
        desc: t('landing.ministries.outreachDesc'),
      },
      {
        icon: Music,
        title: t('landing.ministries.worshipTitle'),
        desc: t('landing.ministries.worshipDesc'),
      },
      {
        icon: BookOpen,
        title: t('landing.ministries.educationTitle'),
        desc: t('landing.ministries.educationDesc'),
      },
      {
        icon: Heart,
        title: t('landing.ministries.familyTitle'),
        desc: t('landing.ministries.familyDesc'),
      },
    ],
    [t]
  );

  const events = useMemo(
    () => [
      {
        title: t('landing.events.oneTitle'),
        date: t('landing.events.oneDate'),
        desc: t('landing.events.oneDesc'),
      },
      {
        title: t('landing.events.twoTitle'),
        date: t('landing.events.twoDate'),
        desc: t('landing.events.twoDesc'),
      },
      {
        title: t('landing.events.threeTitle'),
        date: t('landing.events.threeDate'),
        desc: t('landing.events.threeDesc'),
      },
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

  return (
    <div>
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary/5 via-transparent to-secondary/5">
        {/* Decorative cross pattern — subtle background detail */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="page-container relative py-20 md:py-32 text-center">
          {/* Small welcome badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Church className="w-4 h-4" />
            <span>{t('landing.heroBadge')}</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-heading leading-tight mb-6">
            {t('landing.heroTitle')}
            <br />
            <span className="text-primary">{t('landing.heroHighlight')}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.heroDescription')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#services">
              <Button size="lg" icon={Clock}>
                {t('landing.heroServiceBtn')}
              </Button>
            </a>
            <a href="#about">
              <Button variant="outline" size="lg" icon={ArrowIcon} iconPosition="end">
                {t('landing.heroAboutBtn')}
              </Button>
            </a>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {stats.map((item, index) => (
              <div
                key={index}
                className="bg-surface/80 backdrop-blur-sm rounded-xl border border-border p-4 text-center"
              >
                <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{item.value}</div>
                <div className="text-xs text-muted mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ABOUT ═══════════════════════ */}
      <section id="about" className="py-20 bg-surface">
        <div className="page-container max-w-4xl">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {t('landing.aboutLabel')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-heading mt-2 mb-4">
              {t('landing.aboutTitle')}
            </h2>
          </div>

          <div className="bg-page rounded-2xl border border-border p-8 md:p-10">
            <p className="text-muted leading-loose text-base md:text-lg mb-6">
              {t('landing.aboutParagraph1')}
            </p>
            <p className="text-muted leading-loose text-base md:text-lg mb-6">
              {t('landing.aboutParagraph2')}
            </p>

            {/* Mission & Vision side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                <h3 className="font-bold text-heading mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  {t('landing.missionTitle')}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {t('landing.missionText')}
                </p>
              </div>
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                <h3 className="font-bold text-heading mb-2 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  {t('landing.visionTitle')}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {t('landing.visionText')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SERVICES / TIMES ═══════════════════════ */}
      <section id="services" className="py-20">
        <div className="page-container">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {t('landing.servicesLabel')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-heading mt-2 mb-3">
              {t('landing.servicesTitle')}
            </h2>
            <p className="text-muted max-w-lg mx-auto">
              {t('landing.servicesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} isRTL={isRTL} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MINISTRIES ═══════════════════════ */}
      <section id="ministries" className="py-20 bg-surface">
        <div className="page-container">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {t('landing.ministriesLabel')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-heading mt-2 mb-3">
              {t('landing.ministriesTitle')}
            </h2>
            <p className="text-muted max-w-lg mx-auto">
              {t('landing.ministriesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ministries.map((ministry, index) => (
              <MinistryCard key={index} {...ministry} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ UPCOMING EVENTS ═══════════════════════ */}
      <section id="events" className="py-20">
        <div className="page-container">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {t('landing.eventsLabel')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-heading mt-2 mb-3">
              {t('landing.eventsTitle')}
            </h2>
            <p className="text-muted max-w-lg mx-auto">
              {t('landing.eventsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {events.map((event, index) => (
              <EventCard key={index} {...event} isRTL={isRTL} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FAQ ═══════════════════════ */}
      <section id="faq" className="py-20 bg-surface">
        <div className="page-container max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {t('landing.faqLabel')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-heading mt-2 mb-3">
              {t('landing.faqTitle')}
            </h2>
          </div>
          <FAQ items={faqs} isRTL={isRTL} />
        </div>
      </section>

      {/* ═══════════════════════ CONTACT / VISIT ═══════════════════════ */}
      <section id="contact" className="py-20">
        <div className="page-container max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {t('landing.contactLabel')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-heading mt-2 mb-3">
              {t('landing.contactTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-xl border border-border p-6 text-center hover:shadow-dropdown transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-heading text-sm mb-1">
                {t('landing.contact.addressLabel')}
              </h4>
              <p className="text-sm text-muted">{t('landing.contact.addressValue')}</p>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6 text-center hover:shadow-dropdown transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-heading text-sm mb-1">
                {t('landing.contact.phoneLabel')}
              </h4>
              <p className="text-sm text-muted direction-ltr">{t('landing.contact.phoneValue')}</p>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6 text-center hover:shadow-dropdown transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-heading text-sm mb-1">
                {t('landing.contact.emailLabel')}
              </h4>
              <p className="text-sm text-muted">{t('landing.contact.emailValue')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA FOOTER ═══════════════════════ */}
      <section className="py-20 bg-primary text-white relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-[120px]" />
        </div>

        <div className="page-container text-center relative">
          <Church className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('landing.ctaTitle')}</h2>
          <p className="text-white/80 max-w-lg mx-auto mb-8 leading-relaxed">
            {t('landing.ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/login">
              <Button
                variant="outline"
                size="lg"
                icon={LogIn}
                className="!border-white !text-white hover:!bg-white/10"
              >
                {t('landing.ctaMemberLogin')}
              </Button>
            </Link>
          </div>
          <p className="text-white/50 text-xs mt-4">{t('landing.ctaNote')}</p>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="py-8 bg-surface border-t border-border">
        <div className="page-container text-center">
          <p className="text-sm text-muted">
            {t('landing.footerText')}
          </p>
        </div>
      </footer>
    </div>
  );
}