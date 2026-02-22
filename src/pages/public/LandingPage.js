import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  ArrowUpRight,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useI18n } from '../../i18n/i18n';

/* ════════════════════════════════════════════
   HOOKS & UTILITIES
   ════════════════════════════════════════════ */

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

function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handler = () => setOffset(window.scrollY * speed);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [speed]);
  return offset;
}

/* ════════════════════════════════════════════
   ANIMATION COMPONENTS
   ════════════════════════════════════════════ */

function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [ref, inView] = useInView(0.08);
  const transforms = {
    up: 'translateY(50px)',
    down: 'translateY(-50px)',
    left: 'translateX(50px)',
    right: 'translateX(-50px)',
    scale: 'scale(0.92)',
    none: 'none',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate(0,0) scale(1)' : transforms[direction],
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

function StaggerChildren({ children, className = '', stagger = 0.08 }) {
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref} className={className}>
      {Array.isArray(children) ? children.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(30px)',
            transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * stagger}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * stagger}s`,
          }}
        >
          {child}
        </div>
      )) : children}
    </div>
  );
}

/* ── Animated counter with easing ── */
function AnimatedCounter({ value, inView }) {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    if (!inView || isNaN(numericValue)) return;
    const duration = 2200;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * numericValue));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, numericValue]);

  if (isNaN(numericValue)) return <span>{value}</span>;
  return <span>{count}{suffix}</span>;
}

/* ════════════════════════════════════════════
   SECTION HEADER – Refined
   ════════════════════════════════════════════ */
function SectionHeader({ label, title, subtitle, centered = true, light = false }) {
  return (
    <Reveal>
      <div className={`${centered ? 'text-center' : 'text-start'} max-w-3xl ${centered ? 'mx-auto' : ''}`}>
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] ${light ? 'bg-white/10 text-white/80 border border-white/10' : 'bg-primary/6 text-primary border border-primary/10'
          }`}>
          <Cross className="h-3 w-3" />
          {label}
        </span>
        <h2 className={`mt-5 text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold leading-[1.15] ${light ? 'text-white' : 'text-heading'
          }`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-4 text-sm sm:text-base lg:text-lg leading-relaxed ${light ? 'text-white/60' : 'text-muted'
            }`}>
            {subtitle}
          </p>
        )}
      </div>
    </Reveal>
  );
}

/* ════════════════════════════════════════════
   PRIEST CARD – Immersive spotlight design
   ════════════════════════════════════════════ */
function PriestCard({ priest, isRTL, index }) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(priest.image) && !imageError;

  return (
    <Reveal delay={index * 0.12}>
      <div className="group relative">
        {/* Outer glow on hover */}
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-secondary/15 opacity-0 blur-sm transition-opacity duration-700 group-hover:opacity-100" />

        <div className="relative overflow-hidden rounded-[1.75rem] bg-surface border border-primary/8 transition-all duration-700 group-hover:border-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/8">
          {/* Spotlight image area */}
          <div className="relative h-64 sm:h-72 overflow-hidden bg-gradient-to-b from-primary/8 via-primary/4 to-surface">
            {/* Radial spotlight effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,var(--color-primary)_0%,transparent_70%)] opacity-10 transition-opacity duration-700 group-hover:opacity-20" />

            {/* Decorative cross watermark */}
            <div className="absolute top-4 end-4 text-primary/5 transition-all duration-700 group-hover:text-primary/10 group-hover:rotate-12">
              <Cross className="h-12 w-12" />
            </div>

            {/* Priest image */}
            <div className="absolute inset-0 flex items-end justify-center">
              {hasImage ? (
                <img
                  src={priest.image}
                  alt={priest.alt}
                  loading="lazy"
                  className="h-full max-h-[260px] w-auto max-w-[85%] object-contain object-bottom transition-all duration-700 group-hover:scale-105"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center pb-8">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/10">
                      <UserCircle2 className="h-16 w-16 text-primary/30" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-surface to-transparent" />
          </div>

          {/* Info section */}
          <div className={`relative px-6 pb-6 -mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Star className="h-2.5 w-2.5 fill-current" />
                {priest.role}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-heading leading-tight">{priest.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">{priest.bio}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ════════════════════════════════════════════
   VERSE CARD – Editorial style
   ════════════════════════════════════════════ */
function VerseCard({ verse, isRTL, index }) {
  return (
    <Reveal delay={index * 0.12}>
      <div className={`group relative h-full ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="h-full rounded-[1.75rem] border border-primary/8 bg-gradient-to-br from-page via-surface to-page p-6 sm:p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 flex flex-col">
          {/* Quote icon */}
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25">
            <Quote className="h-5 w-5" />
          </div>

          {/* Verse text */}
          <p className="flex-1 text-base sm:text-lg font-medium leading-relaxed text-heading/90">
            "{verse.text}"
          </p>

          {/* Reference */}
          <div className="mt-6 pt-4 border-t border-primary/8">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <BookOpen className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-sm font-bold text-primary">{verse.reference}</span>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ════════════════════════════════════════════════
   MAIN LANDING PAGE
   ════════════════════════════════════════════════ */
export default function LandingPage() {
  const { t, isRTL } = useI18n();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const textAlignClass = isRTL ? 'text-right' : 'text-left';
  const [statsRef, statsInView] = useInView(0.2);
  const parallaxOffset = useParallax(0.15);

  const getOptional = (key) => {
    const value = t(key);
    return value === key ? '' : value;
  };

  /* ── Data ── */
  const heroHighlights = [
    { icon: Calendar, text: t('landing.hero.highlights.one'), color: 'from-blue-500/20 to-blue-600/10' },
    { icon: BookOpen, text: t('landing.hero.highlights.two'), color: 'from-amber-500/20 to-amber-600/10' },
    { icon: Heart, text: t('landing.hero.highlights.three'), color: 'from-rose-500/20 to-rose-600/10' },
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
    { icon: Users, value: t('landing.stats.items.families.value'), label: t('landing.stats.items.families.label'), accent: 'from-blue-400 to-blue-500' },
    { icon: Heart, value: t('landing.stats.items.members.value'), label: t('landing.stats.items.members.label'), accent: 'from-rose-400 to-rose-500' },
    { icon: Church, value: t('landing.stats.items.services.value'), label: t('landing.stats.items.services.label'), accent: 'from-amber-400 to-amber-500' },
    { icon: HandHeart, value: t('landing.stats.items.servants.value'), label: t('landing.stats.items.servants.label'), accent: 'from-emerald-400 to-emerald-500' },
  ];

  const verses = [
    { text: t('landing.verses.items.one.text'), reference: t('landing.verses.items.one.reference') },
    { text: t('landing.verses.items.two.text'), reference: t('landing.verses.items.two.reference') },
    { text: t('landing.verses.items.three.text'), reference: t('landing.verses.items.three.reference') },
  ];

  const lifeCards = [
    { icon: ShieldCheck, title: t('landing.life.items.one.title'), description: t('landing.life.items.one.description'), gradient: 'from-blue-500 to-indigo-600', lightGrad: 'from-blue-500/10 to-indigo-500/5' },
    { icon: BookOpen, title: t('landing.life.items.two.title'), description: t('landing.life.items.two.description'), gradient: 'from-amber-500 to-orange-600', lightGrad: 'from-amber-500/10 to-orange-500/5' },
    { icon: Sparkles, title: t('landing.life.items.three.title'), description: t('landing.life.items.three.description'), gradient: 'from-rose-500 to-pink-600', lightGrad: 'from-rose-500/10 to-pink-500/5' },
  ];

  const contacts = [
    { icon: MapPin, label: t('landing.visit.addressLabel'), value: t('landing.visit.addressValue'), ltr: false, color: 'bg-blue-500/10 text-blue-600' },
    { icon: Phone, label: t('landing.visit.phoneLabel'), value: t('landing.visit.phoneValue'), ltr: true, color: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Mail, label: t('landing.visit.emailLabel'), value: t('landing.visit.emailValue'), ltr: false, color: 'bg-amber-500/10 text-amber-600' },
    { icon: Clock3, label: t('landing.visit.hoursLabel'), value: t('landing.visit.hoursValue'), ltr: false, color: 'bg-rose-500/10 text-rose-600' },
  ];

  const locationTitle = getOptional('landing.location.title') || (isRTL ? 'موقعنا' : 'Our Location');
  const locationLabel = getOptional('landing.location.label') || (isRTL ? 'تعال زورنا' : 'COME VISIT US');
  const locationSubtitle = getOptional('landing.location.subtitle') || (isRTL ? 'يسعدنا استقبالكم في أي وقت' : 'We would love to welcome you');
  const locationDirections = getOptional('landing.location.directions') || (isRTL ? 'احصل على الاتجاهات' : 'Get Directions');

  /* ── Scroll indicator ── */
  const [showScroll, setShowScroll] = useState(true);
  useEffect(() => {
    const handler = () => setShowScroll(window.scrollY < 100);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="bg-page overflow-x-hidden">

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  HERO – Church image BG revealed at bottom              ║
          ║  Page color on top fades away → church photo shows      ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <section id="home" className="relative min-h-screen flex flex-col overflow-hidden">

        <div className="absolute inset-0">
          <img
            src={getOptional('landing.hero.churchImage') || '/images/church.webp'}
            alt={isRTL ? 'كنيسة الملاك ميخائيل' : 'Archangel Michael Church'}
            className="h-full w-full object-cover object-center"
            loading="eager"
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/10" />

          {/* Gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-page to-secondary/10" />
        </div>

        {/* ── GRADIENT OVERLAYS – Opaque top → transparent bottom ── */}
        <div className="pointer-events-none absolute inset-0">
          {/* Main: solid page color on top, fading to see image at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-page from-[10%] via-page/95 via-[45%] to-transparent to-[85%]" />
          {/* Subtle dark tint on the revealed image for contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[60%] to-black/40" />
          {/* Side vignette on the image area */}
          <div className="absolute inset-0 bg-gradient-to-r from-page/40 via-transparent to-page/40" />
        </div>

        {/* ── AMBIENT DECORATIONS ── */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-12 -start-20 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[120px]"
            style={{ transform: `translateY(${parallaxOffset * 0.4}px)` }}
          />
          <div
            className="absolute top-1/4 -end-16 h-[250px] w-[250px] rounded-full bg-secondary/8 blur-[100px]"
            style={{ transform: `translateY(${parallaxOffset * 0.25}px)` }}
          />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(var(--color-primary) 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />
          {/* Cathedral light beams */}
          <div className="absolute top-0 start-[22%] w-px h-[45%] bg-gradient-to-b from-primary/10 via-primary/4 to-transparent hidden lg:block" />
          <div className="absolute top-0 end-[22%] w-px h-[35%] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent hidden lg:block" />
          {/* Floating cross */}
          <div
            className="absolute top-24 end-[10%] text-primary/[0.04] hidden lg:block"
            style={{ transform: `translateY(${parallaxOffset * 0.5}px) rotate(8deg)` }}
          >
            <Cross className="h-32 w-32" />
          </div>
        </div>

        {/* ── CONTENT – Centered in the opaque zone ── */}
        <div className="relative flex-1 flex flex-col items-center justify-center page-container w-full pt-28 sm:pt-32 lg:pt-36 pb-52 sm:pb-60 md:pb-64 lg:pb-72">
          {/* Badge */}
          <Reveal delay={0.05}>
            <Badge variant="secondary" className="mb-5 sm:mb-6 !rounded-full !px-5 !py-2 !text-[10px] sm:!text-xs !font-bold !border !border-primary/10 !bg-surface/80 !backdrop-blur-sm">
              <Star className="me-1.5 h-3 w-3 fill-current text-primary" />
              {t('landing.hero.badge')}
            </Badge>
          </Reveal>

          {/* Heading */}
          <Reveal delay={0.15}>
            <h1 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.12] tracking-tight text-heading max-w-4xl">
              {t('landing.hero.title')}{' '}
              <span className="relative inline-block text-primary">
                {t('landing.hero.highlight')}
                <svg className="absolute -bottom-2 sm:-bottom-10 start-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C47 2 153 2 199 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary/30" />
                </svg>
              </span>
            </h1>
          </Reveal>

          {/* Description */}
          <Reveal delay={0.3}>
            <p className="mt-10 sm:mt-16 max-w-2xl text-center text-base sm:text-lg lg:text-xl leading-relaxed text-white">
              {t('landing.hero.description')}
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={0.4}>
            <div className="mt-7 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:items-center justify-center w-full px-4 sm:px-0">
              <a href="#about" className="w-full sm:w-auto">
                <Button size="lg" icon={ArrowIcon} iconPosition="end" className="!rounded-full !px-7 sm:!px-8 !shadow-lg !shadow-primary/20 !w-full sm:!w-auto !font-bold">
                  {t('landing.hero.primaryCta')}
                </Button>
              </a>
              <a href="#visit" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="!rounded-full !px-7 sm:!px-8 !w-full sm:!w-auto !font-bold !bg-surface/60 !backdrop-blur-sm">
                  {t('landing.hero.secondaryCta')}
                </Button>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════╗
          ║  ABOUT – Asymmetric editorial layout            ║
          ╚══════════════════════════════════════════════════╝ */}
      <section id="about" className="relative py-20 sm:py-28 lg:py-32">
        {/* Subtle bg texture */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface/50 via-transparent to-surface/50" />

        <div className="page-container relative">
          <SectionHeader
            label={t('landing.about.label')}
            title={t('landing.about.title')}
            subtitle={t('landing.about.subtitle')}
            centered
          />

          <div className="mt-12 sm:mt-16">
            {/* Main description – full width elegant card */}
            <Reveal>
              <div className={`relative overflow-hidden rounded-[1.75rem] border border-primary/8 bg-surface p-6 sm:p-8 lg:p-10 ${textAlignClass}`}>
                <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-[4rem]" />
                <div className="absolute bottom-0 start-0 w-24 h-24 bg-gradient-to-tr from-secondary/5 to-transparent rounded-tr-[3rem]" />
                <p className="relative text-base sm:text-lg leading-loose text-muted text-center ">{t('landing.about.description')}</p>
              </div>
            </Reveal>

            {/* Mission & Vision – side by side with creative styling */}
            <div className="mt-5 sm:mt-6 grid gap-5 sm:gap-6 sm:grid-cols-2">
              <Reveal delay={0.1}>
                <div className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-primary/6 via-primary/3 to-transparent p-6 sm:p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-lg ${textAlignClass}`}>
                  {/* Decorative number */}
                  <div className={`flex items-center gap-2.5 mb-4 ${isRTL ? 'flex-row' : ''}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                      <Navigation className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{t('landing.about.missionLabel')}</p>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-heading/80">{t('landing.about.missionText')}</p>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-secondary/10 bg-gradient-to-br from-secondary/8 via-secondary/3 to-transparent p-6 sm:p-8 transition-all duration-500 hover:border-secondary/20 hover:shadow-lg ${textAlignClass}`}>
                  <div className={`flex items-center gap-2.5 mb-4 ${isRTL ? 'flex-row' : ''}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                      <Globe className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{t('landing.about.visionLabel')}</p>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-heading/80">{t('landing.about.visionText')}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════╗
          ║  PRIESTS – Spotlight gallery                    ║
          ╚══════════════════════════════════════════════════╝ */}
      <section id="priests" className="relative overflow-hidden py-20 sm:py-28 lg:py-32 bg-surface">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-primary/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[150px]" />
        </div>

        <div className="page-container relative">
          <SectionHeader
            label={t('landing.priests.label')}
            title={t('landing.priests.title')}
            subtitle={t('landing.priests.subtitle')}
            centered
          />

          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {priests.map((priest, i) => (
              <PriestCard key={priest.name} priest={priest} isRTL={isRTL} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════╗
          ║  STATS – Premium glass morphism dashboard       ║
          ╚══════════════════════════════════════════════════╝ */}
      <section id="stats" className="py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <div
            ref={statsRef}
            className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-primary via-primary-dark to-primary"
          >
            {/* Layered background effects */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 -end-24 h-96 w-96 rounded-full bg-white/5 blur-[100px]" />
              <div className="absolute -bottom-24 -start-24 h-80 w-80 rounded-full bg-white/5 blur-[80px]" />
              <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02]">
                <Cross className="h-[400px] w-[400px]" />
              </div>
              {/* Noise texture */}
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
              <SectionHeader
                label={t('landing.stats.label')}
                title={t('landing.stats.title')}
                centered
                light
              />

              <div className="mt-10 sm:mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {stats.map((stat, i) => (
                  <Reveal key={stat.label} delay={i * 0.1}>
                    <div className="group relative overflow-hidden rounded-2xl sm:rounded-[1.25rem] border border-white/[0.08] bg-white/[0.04] p-4 sm:p-6 text-center backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08]">
                      {/* Hover shimmer */}
                      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 3s infinite',
                        }}
                      />

                      <div className="relative">
                        {/* Icon with gradient background */}
                        <div className={`mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.accent} shadow-lg`}>
                          <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-white">
                          <AnimatedCounter value={stat.value} inView={statsInView} />
                        </p>
                        <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/50">{stat.label}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════╗
          ║  VERSES – Elegant editorial cards               ║
          ╚══════════════════════════════════════════════════╝ */}
      <section id="verses" className="relative py-20 sm:py-28 lg:py-32 bg-surface">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)_0%,transparent_70%)] opacity-[0.03]" />
        </div>

        <div className="page-container relative">
          <SectionHeader
            label={t('landing.verses.label')}
            title={t('landing.verses.title')}
            subtitle={t('landing.verses.subtitle')}
            centered
          />

          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
            {verses.map((verse, i) => (
              <VerseCard key={verse.reference} verse={verse} isRTL={isRTL} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════╗
          ║  CHURCH LIFE – Dynamic feature showcase         ║
          ╚══════════════════════════════════════════════════╝ */}
      <section id="life" className="py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <SectionHeader
            label={t('landing.life.label')}
            title={t('landing.life.title')}
            subtitle={t('landing.life.subtitle')}
            centered
          />

          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
            {lifeCards.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-primary/8 bg-page transition-all duration-500 hover:border-primary/15 hover:shadow-2xl hover:shadow-primary/8 ${textAlignClass}`}>
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.lightGrad} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

                  <div className="relative p-6 sm:p-8">
                    {/* Number indicator */}
                    <div className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} text-[56px] sm:text-[64px] font-black text-primary/[0.04] leading-none transition-all duration-500 group-hover:text-primary/[0.08]`}>
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    {/* Icon */}
                    <div className={`mb-5 sm:mb-6 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl ${isRTL ? 'mr-0 ml-auto' : ''}`}>
                      <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-heading leading-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>

                    {/* Subtle arrow */}
                    <div className={`mt-5 sm:mt-6 flex items-center gap-1.5 text-primary/40 transition-all duration-300 group-hover:text-primary group-hover:gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold uppercase tracking-wider">{isRTL ? 'المزيد' : 'Learn More'}</span>
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════╗
          ║  VISIT – Modern contact cards + Map             ║
          ╚══════════════════════════════════════════════════╝ */}
      <section id="visit" className="relative bg-surface py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <SectionHeader
            label={t('landing.visit.label')}
            title={t('landing.visit.title')}
            subtitle={t('landing.visit.subtitle')}
            centered
          />

          {/* Contact cards */}
          <StaggerChildren className="mt-12 sm:mt-16 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2" stagger={0.08}>
            {contacts.map((item, i) => (
              <div key={item.label} className={`group relative overflow-hidden rounded-2xl border border-primary/6 bg-page p-5 sm:p-6 transition-all duration-400 hover:border-primary/15 hover:shadow-lg hover:shadow-primary/5 ${textAlignClass}`}>
                {/* Subtle hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${item.color} transition-transform duration-300 group-hover:scale-105`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-heading">{item.label}</p>
                    <p className={`mt-1 text-xs sm:text-sm leading-relaxed text-muted ${item.ltr ? 'direction-ltr' : ''}`}>{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════╗
          ║  LOCATION – Interactive map section             ║
          ╚══════════════════════════════════════════════════╝ */}
      <section id="location" className="py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <SectionHeader
            label={locationLabel}
            title={locationTitle}
            subtitle={locationSubtitle}
            centered
          />

          <Reveal className="mt-12 sm:mt-16">
            <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-primary/10 bg-surface shadow-xl shadow-primary/5">
              {/* Map */}
              <div className="relative h-[280px] sm:h-[380px] lg:h-[450px] w-full">
                <iframe
                  title={isRTL ? 'موقع الكنيسة' : 'Church Location'}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(t('landing.visit.addressValue'))}&output=embed&z=15`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-surface to-transparent" />
              </div>

              {/* Info bar */}
              <div className="relative border-t border-border bg-surface px-5 py-4 sm:px-8 sm:py-5">
                <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className={textAlignClass}>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">
                        {t('landing.visit.addressLabel')}
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm text-muted">{t('landing.visit.addressValue')}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t('landing.visit.addressValue'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button variant="outline" size="md" icon={ExternalLink} iconPosition="end" className="!rounded-full !font-bold !w-full sm:!w-auto">
                      {locationDirections}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════╗
          ║  PORTAL CTA – Premium gradient card             ║
          ╚══════════════════════════════════════════════════╝ */}
      <section className="border-t border-border bg-page py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <Reveal>
            <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] bg-gradient-to-br from-primary via-primary-dark to-primary text-center text-white">
              {/* Decorative */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-16 -end-16 h-64 w-64 rounded-full bg-white/5 blur-[60px]" />
                <div className="absolute -bottom-16 -start-16 h-64 w-64 rounded-full bg-white/5 blur-[60px]" />
                <div className="absolute top-8 start-8 text-white/[0.04]"><Cross className="h-20 w-20" /></div>
                <div className="absolute bottom-8 end-8 text-white/[0.04]"><Cross className="h-14 w-14 rotate-12" /></div>
                {/* Noise */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                }} />
              </div>

              <div className="relative px-6 py-12 sm:px-10 sm:py-16">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                  <Sparkles className="h-3 w-3" />
                  {t('landing.portal.label')}
                </div>
                <h3 className="mt-5 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-extrabold">{t('landing.portal.title')}</h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base lg:text-lg text-white">{t('landing.portal.description')}</p>
                <div className="mt-7 sm:mt-8">
                  <Link to="/auth/login">
                    <Button
                      variant="outline"
                      size="lg"
                      icon={ArrowIcon}
                      iconPosition="end"
                      className="!rounded-full !border-white/25 !bg-white/10 !px-7 sm:!px-8 !text-white !shadow-lg !font-bold hover:!bg-white/20 hover:!border-white/40"
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

      {/* ══════════════════════════════════════
         GLOBAL KEYFRAMES
         ══════════════════════════════════════ */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-15px); }
        }
      `}</style>
    </div>
  );
}