import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Church,
  Clock3,
  Heart,
  HandHeart,
  Mail,
  MapPin,
  Phone,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
  UserCircle2,
  ChevronDown,
  Play,
  Cross,
  Star,
  Globe,
  Calendar,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useI18n } from '../../i18n/i18n';

/* ────────────────────────────────────────────
   Animation hook – triggers when element enters viewport
   ──────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ────────────────────────────────────────────
   Animated wrapper
   ──────────────────────────────────────────── */
function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [ref, inView] = useInView(0.1);
  const transforms = {
    up: 'translateY(40px)',
    down: 'translateY(-40px)',
    left: 'translateX(40px)',
    right: 'translateX(-40px)',
    none: 'translateY(0)',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate(0,0)' : transforms[direction],
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────
   Animated counter
   ──────────────────────────────────────────── */
function AnimatedCounter({ value, inView }) {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    if (!inView || isNaN(numericValue)) return;
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(numericValue / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= numericValue) { setCount(numericValue); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, numericValue]);

  if (isNaN(numericValue)) return <span>{value}</span>;
  return <span>{count}{suffix}</span>;
}

/* ────────────────────────────────────────────
   Section Header – enhanced
   ──────────────────────────────────────────── */
function SectionHeader({
  label,
  title,
  subtitle,
  centered = true,
  light = false,
}) {
  return (
    <Reveal>
      <div className={centered ? 'text-center' : 'text-start'}>
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${light ? 'bg-white/10 text-white/80' : 'bg-primary/8 text-primary'}`}>
          <Cross className="h-3 w-3" />
          {label}
        </div>
        <h2 className={`mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[2.75rem] ${light ? 'text-white' : 'text-heading'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${centered ? 'mx-auto' : ''} ${light ? 'text-white/70' : 'text-muted'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </Reveal>
  );
}

/* ────────────────────────────────────────────
   Priest Card – redesigned
   ──────────────────────────────────────────── */
function PriestCard({ priest, isRTL, index }) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(priest.image) && !imageError;

  return (
    <Reveal delay={index * 0.15}>
      <div className="group relative h-full">
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 blur transition-opacity duration-500 group-hover:opacity-100" />
        <Card className="relative h-full overflow-hidden rounded-3xl border-primary/8 bg-surface p-0 transition-all duration-500 group-hover:border-primary/20 group-hover:shadow-xl">
          {/* Image area with decorative elements */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/6 via-primary/3 to-transparent p-8 pb-4">
            {/* Decorative cross pattern */}
            <div className="absolute top-3 end-3 text-primary/8">
              <Cross className="h-16 w-16" />
            </div>
            <div className="mx-auto flex h-52 w-full max-w-[200px] items-end justify-center overflow-hidden rounded-2xl">
              {hasImage ? (
                <img
                  src={priest.image}
                  alt={priest.alt}
                  loading="lazy"
                  className="h-full w-full object-contain object-bottom transition-transform duration-700 group-hover:scale-105"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
                    <UserCircle2 className="relative h-24 w-24 text-primary/40" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className={`space-y-3 p-6 pt-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            <Badge variant="secondary" className="!rounded-full !px-3 !py-1 !text-[10px] !font-bold !uppercase !tracking-wider">
              {priest.role}
            </Badge>
            <h3 className="text-xl font-bold text-heading">{priest.name}</h3>
            <p className="text-sm leading-relaxed text-muted">{priest.bio}</p>
          </div>
        </Card>
      </div>
    </Reveal>
  );
}

/* ────────────────────────────────────────────
   Verse Card – redesigned
   ──────────────────────────────────────────── */
function VerseCard({ verse, isRTL, index }) {
  return (
    <Reveal delay={index * 0.12}>
      <Card className={`group relative h-full overflow-hidden rounded-3xl border-primary/8 bg-page transition-all duration-500 hover:border-primary/20 hover:shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Large decorative quote */}
        <div className="absolute -top-2 start-4 text-primary/6 transition-colors duration-500 group-hover:text-primary/12">
          <Quote className="h-20 w-20" />
        </div>
        <div className="relative pt-8">
          <p className="text-lg font-medium leading-relaxed text-heading">{verse.text}</p>
          <div className="mt-5 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
            <p className="text-sm font-bold text-primary">{verse.reference}</p>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
          </div>
        </div>
      </Card>
    </Reveal>
  );
}

/* ════════════════════════════════════════════
   MAIN LANDING PAGE
   ════════════════════════════════════════════ */
export default function LandingPage() {
  const { t, isRTL } = useI18n();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const textAlignClass = isRTL ? 'text-right' : 'text-left';
  const [statsRef, statsInView] = useInView(0.3);

  const getOptional = (key) => {
    const value = t(key);
    return value === key ? '' : value;
  };

  /* ── Data ── */
  const heroHighlights = [
    { icon: Calendar, text: t('landing.hero.highlights.one') },
    { icon: BookOpen, text: t('landing.hero.highlights.two') },
    { icon: Heart, text: t('landing.hero.highlights.three') },
  ];

  const priests = [
    {
      name: t('landing.priests.items.one.name'),
      role: t('landing.priests.items.one.role'),
      bio: t('landing.priests.items.one.bio'),
      alt: t('landing.priests.items.one.alt'),
      image: getOptional('landing.priests.items.one.image'),
    },
    {
      name: t('landing.priests.items.two.name'),
      role: t('landing.priests.items.two.role'),
      bio: t('landing.priests.items.two.bio'),
      alt: t('landing.priests.items.two.alt'),
      image: getOptional('landing.priests.items.two.image'),
    },
    {
      name: t('landing.priests.items.three.name'),
      role: t('landing.priests.items.three.role'),
      bio: t('landing.priests.items.three.bio'),
      alt: t('landing.priests.items.three.alt'),
      image: getOptional('landing.priests.items.three.image'),
    },
  ];

  const stats = [
    { icon: Users, value: t('landing.stats.items.families.value'), label: t('landing.stats.items.families.label') },
    { icon: Heart, value: t('landing.stats.items.members.value'), label: t('landing.stats.items.members.label') },
    { icon: Church, value: t('landing.stats.items.services.value'), label: t('landing.stats.items.services.label') },
    { icon: HandHeart, value: t('landing.stats.items.servants.value'), label: t('landing.stats.items.servants.label') },
  ];

  const verses = [
    { text: t('landing.verses.items.one.text'), reference: t('landing.verses.items.one.reference') },
    { text: t('landing.verses.items.two.text'), reference: t('landing.verses.items.two.reference') },
    { text: t('landing.verses.items.three.text'), reference: t('landing.verses.items.three.reference') },
  ];

  const lifeCards = [
    { icon: ShieldCheck, title: t('landing.life.items.one.title'), description: t('landing.life.items.one.description') },
    { icon: BookOpen, title: t('landing.life.items.two.title'), description: t('landing.life.items.two.description') },
    { icon: Sparkles, title: t('landing.life.items.three.title'), description: t('landing.life.items.three.description') },
  ];

  const contacts = [
    { icon: MapPin, label: t('landing.visit.addressLabel'), value: t('landing.visit.addressValue'), ltr: false },
    { icon: Phone, label: t('landing.visit.phoneLabel'), value: t('landing.visit.phoneValue'), ltr: true },
    { icon: Mail, label: t('landing.visit.emailLabel'), value: t('landing.visit.emailValue'), ltr: false },
    { icon: Clock3, label: t('landing.visit.hoursLabel'), value: t('landing.visit.hoursValue'), ltr: false },
  ];

  // For the location section – using translation keys with fallbacks
  const locationTitle = getOptional('landing.location.title') || (isRTL ? 'موقعنا' : 'Our Location');
  const locationLabel = getOptional('landing.location.label') || (isRTL ? 'تعال زورنا' : 'COME VISIT US');
  const locationSubtitle = getOptional('landing.location.subtitle') || (isRTL ? 'يسعدنا استقبالكم في أي وقت' : 'We would love to welcome you');
  const locationDirections = getOptional('landing.location.directions') || (isRTL ? 'احصل على الاتجاهات' : 'Get Directions');

  /* ── Scroll indicator bounce ── */
  const [showScroll, setShowScroll] = useState(true);
  useEffect(() => {
    const handler = () => setShowScroll(window.scrollY < 100);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="bg-page">
      {/* ╔══════════════════════════════════════════╗
          ║  HERO – Full viewport immersive          ║
          ╚══════════════════════════════════════════╝ */}
      <section
        id="home"
        className="relative flex min-h-[92vh] items-center overflow-hidden border-b border-border bg-page"
      >
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          {/* Gradient mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/6" />
          <div className="absolute inset-0 bg-gradient-to-tl from-primary/5 via-transparent to-transparent" />

          {/* Floating orbs */}
          <div className="absolute -top-24 -start-24 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute top-1/2 -end-20 h-96 w-96 rounded-full bg-secondary/8 blur-[120px]" />
          <div className="absolute bottom-0 start-1/3 h-64 w-64 rounded-full bg-primary/6 blur-[80px]" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />

          {/* Decorative crosses */}
          <div className="absolute top-16 end-[15%] text-primary/5 hidden lg:block">
            <Cross className="h-32 w-32 rotate-12" />
          </div>
          <div className="absolute bottom-24 start-[10%] text-primary/4 hidden lg:block">
            <Cross className="h-20 w-20 -rotate-6" />
          </div>
        </div>

        <div className="page-container relative w-full py-16 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            {/* Left / Text side */}
            <div className={textAlignClass}>
              <Reveal delay={0.1}>
                <Badge variant="secondary" className="mb-6 !rounded-full !px-4 !py-1.5 !text-xs !font-semibold">
                  <Star className="me-1.5 h-3 w-3 fill-current" />
                  {t('landing.hero.badge')}
                </Badge>
              </Reveal>

              <Reveal delay={0.2}>
                <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-heading sm:text-5xl lg:text-6xl">
                  {t('landing.hero.title')}{' '}
                  <span className="relative inline-block text-primary">
                    {t('landing.hero.highlight')}
                    <svg className="absolute -bottom-10 start-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5.5C47 2 153 2 199 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary/40" />
                    </svg>
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={0.35}>
                <p className="mt-16 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                  {t('landing.hero.description')}
                </p>
              </Reveal>

              <Reveal delay={0.5}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href="#about">
                    <Button size="lg" icon={ArrowIcon} iconPosition="end" className="!rounded-full !px-8 !shadow-lg !shadow-primary/20">
                      {t('landing.hero.primaryCta')}
                    </Button>
                  </a>
                  <a href="#visit">
                    <Button variant="outline" size="lg" className="!rounded-full !px-8">
                      {t('landing.hero.secondaryCta')}
                    </Button>
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Right / Card side */}
            <Reveal delay={0.3} dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'text-right' : 'text-left'}>
              <div className={`relative ${isRTL ? 'text-right' : 'text-left'}`}>
                {/* Decorative ring */}
                <div className="absolute -inset-3 rounded-[2rem] border border-primary/10" />
                <div className="absolute -inset-6 rounded-[2.5rem] border border-primary/5 hidden sm:block" />

                <Card className={`relative overflow-hidden !rounded-[1.5rem] border-primary/15 bg-surface/95 !p-0 shadow-2xl shadow-primary/8 backdrop-blur-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                  {/* Card header with gradient */}
                  <div className="border-b border-border bg-gradient-to-r from-primary/8 to-transparent p-5">
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30">
                        <Church className="h-6 w-6" />
                      </div>
                      <div className={textAlignClass}>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">{t('landing.hero.cardLabel')}</p>
                        <p className="text-lg font-extrabold text-heading">{t('landing.hero.cardTitle')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2 p-5">
                    {heroHighlights.map((item, i) => (
                      <div
                        key={i}
                        className={`group flex items-center gap-3 rounded-xl border border-border/80 bg-page/80 px-4 py-3.5 transition-all duration-300 hover:border-primary/20 hover:bg-primary/4 hover:shadow-sm ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary transition-colors group-hover:bg-primary/15">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-muted group-hover:text-heading transition-colors">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${showScroll ? 'opacity-100' : 'opacity-0'}`}
        >
          <a href="#about" className="flex flex-col items-center gap-1 text-muted/60 hover:text-primary transition-colors">
            <span className="text-[10px] font-semibold uppercase tracking-widest">{isRTL ? 'اكتشف المزيد' : 'Explore'}</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  ABOUT – Bento-style grid                ║
          ╚══════════════════════════════════════════╝ */}
      <section id="about" className="py-20 sm:py-28">
        <div className="page-container">
          <SectionHeader
            label={t('landing.about.label')}
            title={t('landing.about.title')}
            subtitle={t('landing.about.subtitle')}
            centered
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            {/* Main description – wider */}
            <Reveal className="lg:col-span-7">
              <Card className={`h-full !rounded-3xl border-primary/8 bg-surface ${textAlignClass}`}>
                <p className="text-base leading-loose text-muted sm:text-lg">{t('landing.about.description')}</p>
              </Card>
            </Reveal>

            {/* Mission & Vision stacked */}
            <div className="grid gap-5 lg:col-span-5">
              <Reveal delay={0.1}>
                <Card className={`!rounded-3xl border-primary/8 bg-gradient-to-br from-primary/6 to-primary/2 ${textAlignClass}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{t('landing.about.missionLabel')}</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-heading sm:text-base">{t('landing.about.missionText')}</p>
                </Card>
              </Reveal>
              <Reveal delay={0.2}>
                <Card className={`!rounded-3xl border-primary/8 bg-gradient-to-br from-secondary/8 to-secondary/3 ${textAlignClass}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20 text-primary">
                      <Globe className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{t('landing.about.visionLabel')}</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-heading sm:text-base">{t('landing.about.visionText')}</p>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  PRIESTS – Premium cards                 ║
          ╚══════════════════════════════════════════╝ */}
      <section id="priests" className="relative overflow-hidden bg-surface py-20 sm:py-28">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 start-0 h-full w-full bg-gradient-to-b from-primary/3 to-transparent" />
        </div>

        <div className="page-container relative">
          <SectionHeader
            label={t('landing.priests.label')}
            title={t('landing.priests.title')}
            subtitle={t('landing.priests.subtitle')}
            centered
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {priests.map((priest, i) => (
              <PriestCard key={priest.name} priest={priest} isRTL={isRTL} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════╗
          ║  STATS – Bold immersive with glass cards     ║
          ╚══════════════════════════════════════════════╝ */}
      <section id="stats" className="py-24 sm:py-32">
        <div className="page-container">
          <div
            ref={statsRef}
            className="grain-overlay relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary-dark to-primary p-12 sm:p-16"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -end-20 h-80 w-80 rounded-full bg-white/5 blur-[80px]" style={{ animation: 'float 12s ease-in-out infinite' }} />
              <div className="absolute -bottom-20 -start-20 h-60 w-60 rounded-full bg-white/5 blur-[60px]" style={{ animation: 'float2 14s ease-in-out infinite' }} />
              <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
                <Cross className="h-[300px] w-[300px]" />
              </div>
            </div>

            <div className="relative">
              <SectionHeader
                label={t('landing.stats.label')}
                title={t('landing.stats.title')}
                subtitle={t('landing.stats.subtitle')}
                centered
                light
              />

              <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
                {stats.map((stat, i) => (
                  <Reveal key={stat.label} delay={i * 0.12}>
                    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-500 hover:border-white/25 hover:bg-white/10">
                      <div
                        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite',
                        }}
                      />
                      <div className="relative">
                        <stat.icon className="mx-auto h-6 w-6 text-secondary" />
                        <p className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                          <AnimatedCounter value={stat.value} inView={statsInView} />
                        </p>
                        <p className="mt-2 text-xs font-medium text-white/60 sm:text-sm">{stat.label}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  VERSES – Editorial feel                 ║
          ╚══════════════════════════════════════════╝ */}
      <section id="verses" className="relative bg-surface py-20 sm:py-28">
        <div className="page-container">
          <SectionHeader
            label={t('landing.verses.label')}
            title={t('landing.verses.title')}
            subtitle={t('landing.verses.subtitle')}
            centered
          />

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {verses.map((verse, i) => (
              <VerseCard key={verse.reference} verse={verse} isRTL={isRTL} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  LIFE – Feature cards with hover effects ║
          ╚══════════════════════════════════════════╝ */}
      <section id="life" className="py-20 sm:py-28">
        <div className="page-container">
          <SectionHeader
            label={t('landing.life.label')}
            title={t('landing.life.title')}
            subtitle={t('landing.life.subtitle')}
            centered
          />

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {lifeCards.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.12}>
                <Card className={`group relative h-full overflow-hidden !rounded-3xl border-primary/8 bg-page transition-all duration-500 hover:border-primary/15 hover:shadow-xl ${textAlignClass}`}>
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/4 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative">
                    <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25 ${isRTL ? 'mr-0 ml-auto' : ''}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-heading">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  VISIT / CONTACT – Modern split layout   ║
          ╚══════════════════════════════════════════╝ */}
      <section id="visit" className="bg-surface py-20 sm:py-28">
        <div className="page-container">
          <SectionHeader
            label={t('landing.visit.label')}
            title={t('landing.visit.title')}
            subtitle={t('landing.visit.subtitle')}
            centered
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {contacts.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.1}>
                <Card className={`group !rounded-2xl border-primary/8 bg-page transition-all duration-300 hover:border-primary/15 hover:shadow-md ${textAlignClass}`}>
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="mt-0.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-heading">{item.label}</p>
                      <p className={`mt-1.5 text-sm leading-relaxed text-muted ${item.ltr ? 'direction-ltr' : ''}`}>{item.value}</p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  LOCATION – Interactive Map Section       ║
          ╚══════════════════════════════════════════╝ */}
      <section id="location" className="py-20 sm:py-28">
        <div className="page-container">
          <SectionHeader
            label={locationLabel}
            title={locationTitle}
            subtitle={locationSubtitle}
            centered
          />

          <Reveal className="mt-12">
            <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-surface shadow-xl">
              {/* Map embed */}
              <div className="relative h-[350px] w-full sm:h-[420px] lg:h-[480px]">
                <iframe
                  title={isRTL ? 'موقع الكنيسة' : 'Church Location'}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(t('landing.visit.addressValue'))}&output=embed&z=15`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {/* Gradient overlay at bottom for smooth transition */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent" />
              </div>

              {/* Bottom info bar */}
              <div className="relative border-t border-border bg-surface px-6 py-5 sm:px-8">
                <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className={textAlignClass}>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {t('landing.visit.addressLabel')}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{t('landing.visit.addressValue')}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t('landing.visit.addressValue'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="md" icon={ExternalLink} iconPosition="end" className="!rounded-full">
                      {locationDirections}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  PORTAL CTA – Premium gradient card       ║
          ╚══════════════════════════════════════════╝ */}
      <section className="border-t border-border bg-page py-20 sm:py-28">
        <div className="page-container">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-dark to-primary p-10 text-center text-white sm:p-14">
              {/* Decorative elements */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-12 -end-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-12 -start-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute top-6 start-6 text-white/5">
                  <Cross className="h-24 w-24" />
                </div>
                <div className="absolute bottom-6 end-6 text-white/5">
                  <Cross className="h-16 w-16 rotate-12" />
                </div>
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                  <Sparkles className="h-3 w-3" />
                  {t('landing.portal.label')}
                </div>
                <h3 className="mt-5 text-3xl font-extrabold sm:text-4xl">{t('landing.portal.title')}</h3>
                <p className="mx-auto mt-4 max-w-2xl text-base text-white/75 sm:text-lg">{t('landing.portal.description')}</p>
                <div className="mt-8">
                  <Link to="/auth/login">
                    <Button
                      variant="outline"
                      size="lg"
                      icon={ArrowIcon}
                      iconPosition="end"
                      className="!rounded-full !border-white/30 !bg-white/10 !px-8 !text-white !shadow-lg hover:!bg-white/20"
                    >
                      {t('landing.portal.loginCta')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}