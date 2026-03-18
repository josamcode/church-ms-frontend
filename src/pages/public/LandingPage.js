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
  Home,
  Info,
  User,
  MessageSquare,
  ChevronRight,
  Bell,
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
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
   DESKTOP SECTION HEADER
   ════════════════════════════════════════════ */
function SectionHeader({ label, title, subtitle, centered = true, light = false }) {
  return (
    <Reveal>
      <div className={`${centered ? 'text-center' : 'text-start'} max-w-3xl ${centered ? 'mx-auto' : ''}`}>
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] ${light ? 'bg-white/10 text-white/80 border border-white/10' : 'bg-primary/6 text-primary border border-primary/10'}`}>
          <Cross className="h-3 w-3" />
          {label}
        </span>
        <h2 className={`mt-5 text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold leading-[1.15] ${light ? 'text-white' : 'text-heading'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-4 text-sm sm:text-base lg:text-lg leading-relaxed ${light ? 'text-white/60' : 'text-muted'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </Reveal>
  );
}

/* ════════════════════════════════════════════
   PRIEST CARD (desktop)
   ════════════════════════════════════════════ */
function PriestCard({ priest, isRTL, index }) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(priest.image) && !imageError;

  return (
    <Reveal delay={index * 0.12}>
      <div className="group relative">
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-secondary/15 opacity-0 blur-sm transition-opacity duration-700 group-hover:opacity-100" />
        <div className="relative overflow-hidden rounded-[1.75rem] bg-surface border border-primary/8 transition-all duration-700 group-hover:border-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/8">
          <div className="relative h-64 sm:h-72 overflow-hidden bg-gradient-to-b from-primary/8 via-primary/4 to-surface">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,var(--color-primary)_0%,transparent_70%)] opacity-10 transition-opacity duration-700 group-hover:opacity-20" />
            <div className="absolute top-4 end-4 text-primary/5 transition-all duration-700 group-hover:text-primary/10 group-hover:rotate-12">
              <Cross className="h-12 w-12" />
            </div>
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
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-surface to-transparent" />
          </div>
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
   VERSE CARD (desktop)
   ════════════════════════════════════════════ */
function VerseCard({ verse, isRTL, index }) {
  return (
    <Reveal delay={index * 0.12}>
      <div className={`group relative h-full ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="h-full rounded-[1.75rem] border border-primary/8 bg-gradient-to-br from-page via-surface to-page p-6 sm:p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 flex flex-col">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25">
            <Quote className="h-5 w-5" />
          </div>
          <p className="flex-1 text-base sm:text-lg font-medium leading-relaxed text-heading/90">
            "{verse.text}"
          </p>
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

/* ════════════════════════════════════════════
   MOBILE APP COMPONENTS
   ════════════════════════════════════════════ */

/* Mobile Bottom Tab Bar */
function MobileTabBar({ activeTab, onTabChange, tabs }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-surface/85 backdrop-blur-xl border-t border-border" />
      <div className="relative flex items-center justify-around px-2 pb-safe pt-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-0 flex-1 transition-all duration-200"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'text-muted'}`}>
                <tab.icon className="h-4 w-4" />
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-primary animate-ping opacity-20" style={{ animationDuration: '2s' }} />
                )}
              </div>
              <span className={`text-[9px] font-semibold tracking-wide transition-colors duration-200 truncate ${isActive ? 'text-primary' : 'text-muted'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* Mobile App Screen Header */
function AppScreenHeader({ title, subtitle, rightAction }) {
  return (
    <div className="px-5 pt-4 pb-2">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-heading tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted mt-0.5 font-medium">{subtitle}</p>}
        </div>
        {rightAction}
      </div>
    </div>
  );
}

/* Mobile Home Screen */
function MobileHomeScreen({ t, isRTL, priests, stats, getOptional, statsInView, statsRef }) {
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-page pb-24">
      {/* Hero card — app style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary mx-4 mt-4 rounded-[1.75rem] shadow-2xl shadow-primary/25">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute top-4 right-4 text-white/[0.06]"><Cross className="h-16 w-16" /></div>
        </div>

        {/* Church image overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-[1.75rem]">
          <img
            src={getOptional('landing.hero.churchImage') || '/images/church.webp'}
            alt=""
            className="h-full w-full object-cover object-center opacity-20"
            loading="eager"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/30" />
        </div>

        <div className="relative p-6 pb-8">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 mb-4">
            <Star className="h-2.5 w-2.5 fill-current" />
            {t('landing.hero.badge')}
          </span>

          <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
            {t('landing.hero.title')}{' '}
            <span className="text-white/70">{t('landing.hero.highlight')}</span>
          </h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-2">
            {t('landing.about.description')}
          </p>

          <div className="mt-5 flex gap-2">
            <Link to="/auth/login" className="flex-1">
              <button className="w-full bg-white text-primary font-bold text-sm rounded-2xl py-3 px-4 shadow-lg transition-all duration-200 active:scale-95">
                {t('landing.portal.loginCta')}
              </button>
            </Link>
            <a href="#visit" className="flex-shrink-0">
              <button className="bg-white/15 backdrop-blur-sm border border-white/20 text-white font-bold text-sm rounded-2xl py-3 px-4 transition-all duration-200 active:scale-95">
                {t('landing.hero.secondaryCta')}
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div ref={statsRef} className="px-4 mt-4 grid grid-cols-2 gap-3">
        {stats.slice(0, 4).map((stat, i) => (
          <div key={stat.label} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3"
            style={{
              opacity: statsInView ? 1 : 0,
              transform: statsInView ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.accent} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-heading leading-none">
                <AnimatedCounter value={stat.value} inView={statsInView} />
              </p>
              <p className="text-[10px] text-muted font-medium mt-0.5 truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Section: Our Priests */}
      <div className="mt-6">
        <div className="px-5 mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-heading">{t('landing.priests.label')}</h2>
          <span className="text-xs text-primary font-semibold">{isRTL ? 'الكل' : 'All'}</span>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
          {priests.map((priest, i) => (
            <MobilePriestCard key={priest.name} priest={priest} isRTL={isRTL} />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-5 grid grid-cols-2 gap-3">
        <a href="tel:+" className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform duration-150">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Phone className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-heading">{t('landing.visit.phoneLabel')}</p>
            <p className="text-[10px] text-muted">{isRTL ? 'اتصل بنا' : 'Call us'}</p>
          </div>
        </a>
        <a href="#location" className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform duration-150">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-heading">{t('landing.visit.addressLabel')}</p>
            <p className="text-[10px] text-muted">{isRTL ? 'الموقع' : 'Directions'}</p>
          </div>
        </a>
      </div>
    </div>
  );
}

/* Mobile Priest Card (horizontal scroll) */
function MobilePriestCard({ priest, isRTL }) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(priest.image) && !imageError;

  return (
    <div className="flex-shrink-0 w-44 bg-surface border border-border rounded-2xl overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
      <div className="relative h-36 bg-gradient-to-b from-primary/10 to-surface overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)_0%,transparent_70%)] opacity-15" />
        {hasImage ? (
          <img src={priest.image} alt={priest.alt} className="h-full w-full object-contain object-bottom" onError={() => setImageError(true)} />
        ) : (
          <div className="flex items-end justify-center h-full pb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/10 flex items-center justify-center">
              <UserCircle2 className="h-10 w-10 text-primary/30" />
            </div>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-surface to-transparent" />
      </div>
      <div className={`px-3 pb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
        <span className="inline-flex items-center gap-1 bg-primary/8 border border-primary/10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          {priest.role}
        </span>
        <p className="text-xs font-extrabold text-heading mt-1 leading-tight">{priest.name}</p>
        <p className="text-[10px] text-muted mt-0.5 line-clamp-2 leading-relaxed">{priest.bio}</p>
      </div>
    </div>
  );
}

/* Mobile About Screen */
function MobileAboutScreen({ t, isRTL }) {
  const textAlignClass = isRTL ? 'text-right' : 'text-left';

  return (
    <div className="min-h-screen bg-page pb-24">
      <AppScreenHeader
        title={t('landing.about.title')}
        subtitle={t('landing.about.label')}
      />

      <div className="px-4 mt-4 space-y-3">
        {/* Main description */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className={`text-sm leading-loose text-muted ${textAlignClass}`}>
            {t('landing.about.description')}
          </p>
        </div>

        {/* Mission */}
        <div className={`bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 rounded-2xl p-5 ${textAlignClass}`}>
          <div className={`flex items-center gap-2.5 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <Navigation className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.about.missionLabel')}</p>
          </div>
          <p className="text-sm leading-relaxed text-heading/80">{t('landing.about.missionText')}</p>
        </div>

        {/* Vision */}
        <div className={`bg-gradient-to-br from-secondary/8 via-secondary/3 to-transparent border border-secondary/10 rounded-2xl p-5 ${textAlignClass}`}>
          <div className={`flex items-center gap-2.5 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.about.visionLabel')}</p>
          </div>
          <p className="text-sm leading-relaxed text-heading/80">{t('landing.about.visionText')}</p>
        </div>

        {/* Church Life items */}
        {[
          { icon: ShieldCheck, title: t('landing.life.items.one.title'), description: t('landing.life.items.one.description'), gradient: 'from-blue-500 to-indigo-600' },
          { icon: BookOpen, title: t('landing.life.items.two.title'), description: t('landing.life.items.two.description'), gradient: 'from-amber-500 to-orange-600' },
          { icon: Sparkles, title: t('landing.life.items.three.title'), description: t('landing.life.items.three.description'), gradient: 'from-rose-500 to-pink-600' },
        ].map((item, i) => (
          <div key={i} className={`bg-surface border border-border rounded-2xl p-5 flex items-start gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-heading">{item.title}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed">{item.description}</p>
            </div>
            <ChevronRight className={`h-4 w-4 text-muted flex-shrink-0 mt-0.5 ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Mobile Verses Screen */
function MobileVersesScreen({ t, isRTL, verses }) {
  const textAlignClass = isRTL ? 'text-right' : 'text-left';

  return (
    <div className="min-h-screen bg-page pb-24">
      <AppScreenHeader
        title={t('landing.verses.title')}
        subtitle={t('landing.verses.label')}
      />

      <div className="px-4 mt-4 space-y-3">
        {verses.map((verse, i) => (
          <div key={i} className={`bg-surface border border-border rounded-2xl p-5 ${textAlignClass}`}>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Quote className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed text-heading/90 italic">
                  "{verse.text}"
                </p>
                <div className={`flex items-center gap-1.5 mt-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <BookOpen className="h-3 w-3 text-primary/60" />
                  <span className="text-xs font-bold text-primary">{verse.reference}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Mobile Contact/Visit Screen */
function MobileVisitScreen({ t, isRTL, contacts, churchPlaceName, churchPlusCode, churchAddressLine, locationMapEmbedUrl, directionsUrl }) {
  const textAlignClass = isRTL ? 'text-right' : 'text-left';

  return (
    <div className="min-h-screen bg-page pb-24">
      <AppScreenHeader
        title={t('landing.visit.title')}
        subtitle={t('landing.visit.label')}
      />

      {/* Map card */}
      <div className="px-4 mt-4">
        <div className="rounded-2xl overflow-hidden border border-border bg-surface shadow-sm">
          <div className="h-48 relative">
            <iframe
              title="Church Location"
              src={locationMapEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="pointer-events-none absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-surface to-transparent" />
          </div>
          <div className="p-4 border-t border-border">
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-heading">{churchPlaceName}</p>
                <p className="text-[10px] text-muted mt-0.5">{churchPlusCode} · {churchAddressLine}</p>
              </div>
            </div>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
              <button className="w-full bg-primary text-white text-xs font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95">
                <ExternalLink className="h-3.5 w-3.5" />
                {isRTL ? 'احصل على الاتجاهات' : 'Get Directions'}
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* Contact cards */}
      <div className="px-4 mt-4 space-y-2.5">
        {contacts.map((item, i) => (
          <div key={i} className={`bg-surface border border-border rounded-2xl p-4 flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{item.label}</p>
              <p className={`text-xs font-semibold text-heading mt-0.5 ${item.ltr ? 'direction-ltr' : ''}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Portal CTA */}
      <div className="px-4 mt-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-primary p-5 text-white">
          <div className="absolute top-2 right-2 text-white/[0.06]"><Cross className="h-12 w-12" /></div>
          <div className="relative">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{t('landing.portal.label')}</span>
            <p className="text-base font-black mt-1 leading-tight">{t('landing.portal.title')}</p>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed line-clamp-2">{t('landing.portal.description')}</p>
            <Link to="/auth/login" className="mt-4 block">
              <button className="w-full bg-white text-primary text-xs font-bold rounded-xl py-2.5 transition-all duration-200 active:scale-95">
                {t('landing.portal.loginCta')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
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
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('home');

  const getOptional = (key) => {
    const value = t(key);
    return value === key ? '' : value;
  };

  /* ── Shared Data ── */
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

  const contacts = [
    { icon: MapPin, label: t('landing.visit.addressLabel'), value: t('landing.visit.addressValue'), ltr: false, color: 'bg-blue-500/10 text-blue-600' },
    { icon: Phone, label: t('landing.visit.phoneLabel'), value: t('landing.visit.phoneValue'), ltr: true, color: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Mail, label: t('landing.visit.emailLabel'), value: t('landing.visit.emailValue'), ltr: false, color: 'bg-amber-500/10 text-amber-600' },
    { icon: Clock3, label: t('landing.visit.hoursLabel'), value: t('landing.visit.hoursValue'), ltr: false, color: 'bg-rose-500/10 text-rose-600' },
  ];

  const lifeCards = [
    { icon: ShieldCheck, title: t('landing.life.items.one.title'), description: t('landing.life.items.one.description'), gradient: 'from-blue-500 to-indigo-600', lightGrad: 'from-blue-500/10 to-indigo-500/5' },
    { icon: BookOpen, title: t('landing.life.items.two.title'), description: t('landing.life.items.two.description'), gradient: 'from-amber-500 to-orange-600', lightGrad: 'from-amber-500/10 to-orange-500/5' },
    { icon: Sparkles, title: t('landing.life.items.three.title'), description: t('landing.life.items.three.description'), gradient: 'from-rose-500 to-pink-600', lightGrad: 'from-rose-500/10 to-pink-500/5' },
  ];

  const locationTitle = getOptional('landing.location.title') || (isRTL ? 'موقعنا' : 'Our Location');
  const locationLabel = getOptional('landing.location.label') || (isRTL ? 'تعال زورنا' : 'COME VISIT US');
  const locationSubtitle = getOptional('landing.location.subtitle') || (isRTL ? 'يسعدنا استقبالكم في أي وقت' : 'We would love to welcome you');
  const locationDirections = getOptional('landing.location.directions') || (isRTL ? 'احصل على الاتجاهات' : 'Get Directions');
  const churchCoordinates = '28.3705542,30.6619377';
  const churchPlaceName = 'Church of the Archangel Michael Balqtoshh';
  const churchPlusCode = '9MC6+6QG';
  const churchAddressLine = 'Astal, West Samalout, Minya Governorate 2477363';
  const locationMapEmbedUrl = `https://maps.google.com/maps?ll=${encodeURIComponent(churchCoordinates)}&q=${encodeURIComponent(churchPlaceName)}&z=18&t=k&output=embed`;
  const directionsUrl = `https://maps.app.goo.gl/g24SscQHQKMYSq6M9`;

  /* Mobile tabs config */
  const mobileTabs = [
    { id: 'home', label: isRTL ? 'الرئيسية' : 'Home', icon: Home },
    { id: 'about', label: isRTL ? 'عن الكنيسة' : 'About', icon: Church },
    { id: 'verses', label: isRTL ? 'آيات' : 'Verses', icon: BookOpen },
    { id: 'visit', label: isRTL ? 'زيارة' : 'Visit', icon: MapPin },
  ];

  /* ── Scroll indicator for desktop ── */
  const [showScroll, setShowScroll] = useState(true);
  useEffect(() => {
    const handler = () => setShowScroll(window.scrollY < 100);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* ══════════════════════════════════════════
     MOBILE APP LAYOUT
     ══════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div className="bg-page overflow-x-hidden">
        {/* Mobile Top Status Bar */}
        <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Cross className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-black text-heading truncate">
              {t('landing.hero.badge')}
            </span>
          </div>
          <Link to="/auth/login">
            <button className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-3 py-1.5 border border-primary/15">
              {t('landing.portal.loginCta')}
            </button>
          </Link>
        </div>

        {/* Active Screen */}
        <div style={{
          opacity: 1,
          animation: 'screenFadeIn 0.25s ease',
        }}>
          {activeTab === 'home' && (
            <MobileHomeScreen
              t={t}
              isRTL={isRTL}
              priests={priests}
              stats={stats}
              getOptional={getOptional}
              statsInView={statsInView}
              statsRef={statsRef}
            />
          )}
          {activeTab === 'about' && (
            <MobileAboutScreen t={t} isRTL={isRTL} />
          )}
          {activeTab === 'verses' && (
            <MobileVersesScreen t={t} isRTL={isRTL} verses={verses} />
          )}
          {activeTab === 'visit' && (
            <MobileVisitScreen
              t={t}
              isRTL={isRTL}
              contacts={contacts}
              churchPlaceName={churchPlaceName}
              churchPlusCode={churchPlusCode}
              churchAddressLine={churchAddressLine}
              locationMapEmbedUrl={locationMapEmbedUrl}
              directionsUrl={directionsUrl}
            />
          )}
        </div>

        {/* Bottom Tab Bar */}
        <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={mobileTabs} />

        <style>{`
          @keyframes screenFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DESKTOP LANDING PAGE (unchanged)
     ══════════════════════════════════════════ */
  return (
    <div className="bg-page overflow-x-hidden">

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getOptional('landing.hero.churchImage') || '/images/church.webp'}
            alt={isRTL ? 'كنيسة الملاك ميخائيل' : 'Archangel Michael Church'}
            className="h-full w-full object-cover object-center"
            loading="eager"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-page to-secondary/10" />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-page from-[10%] via-page/95 via-[45%] to-transparent to-[85%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[60%] to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-page/40 via-transparent to-page/40" />
        </div>

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
          <div className="absolute top-0 start-[22%] w-px h-[45%] bg-gradient-to-b from-primary/10 via-primary/4 to-transparent hidden lg:block" />
          <div className="absolute top-0 end-[22%] w-px h-[35%] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent hidden lg:block" />
          <div
            className="absolute top-24 end-[10%] text-primary/[0.04] hidden lg:block"
            style={{ transform: `translateY(${parallaxOffset * 0.5}px) rotate(8deg)` }}
          >
            <Cross className="h-32 w-32" />
          </div>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center page-container w-full pt-28 sm:pt-32 lg:pt-36 pb-52 sm:pb-60 md:pb-64 lg:pb-72">
          <Reveal delay={0.05}>
            <Badge variant="secondary" className="mb-5 sm:mb-6 !rounded-full !px-5 !py-2 !text-[10px] sm:!text-xs !font-bold !border !border-primary/10 !bg-surface/80 !backdrop-blur-sm">
              <Star className="me-1.5 h-3 w-3 fill-current text-primary" />
              {t('landing.hero.badge')}
            </Badge>
          </Reveal>

          <Reveal delay={0.15}>
            <h1 className="text-center mb-12 text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.12] tracking-tight text-heading max-w-4xl">
              {t('landing.hero.title')}{' '}
              <span className="relative inline-block text-primary">
                {t('landing.hero.highlight')}
                <svg className="absolute -bottom-2 sm:-bottom-10 start-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C47 2 153 2 199 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary/30" />
                </svg>
              </span>
            </h1>
          </Reveal>

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

      {/* ABOUT */}
      <section id="about" className="relative py-20 sm:py-28 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface/50 via-transparent to-surface/50" />
        <div className="page-container relative">
          <SectionHeader label={t('landing.about.label')} title={t('landing.about.title')} subtitle={t('landing.about.subtitle')} centered />
          <div className="mt-12 sm:mt-16">
            <Reveal>
              <div className={`relative overflow-hidden rounded-[1.75rem] border border-primary/8 bg-surface p-6 sm:p-8 lg:p-10 ${textAlignClass}`}>
                <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-[4rem]" />
                <div className="absolute bottom-0 start-0 w-24 h-24 bg-gradient-to-tr from-secondary/5 to-transparent rounded-tr-[3rem]" />
                <p className="relative text-base sm:text-lg leading-loose text-muted text-center">{t('landing.about.description')}</p>
              </div>
            </Reveal>
            <div className="mt-5 sm:mt-6 grid gap-5 sm:gap-6 sm:grid-cols-2">
              <Reveal delay={0.1}>
                <div className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-primary/6 via-primary/3 to-transparent p-6 sm:p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-lg ${textAlignClass}`}>
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

      {/* PRIESTS */}
      <section id="priests" className="relative overflow-hidden py-20 sm:py-28 lg:py-32 bg-surface">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-primary/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[150px]" />
        </div>
        <div className="page-container relative">
          <SectionHeader label={t('landing.priests.label')} title={t('landing.priests.title')} subtitle={t('landing.priests.subtitle')} centered />
          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {priests.map((priest, i) => (
              <PriestCard key={priest.name} priest={priest} isRTL={isRTL} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <div ref={statsRef} className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-primary via-primary-dark to-primary">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 -end-24 h-96 w-96 rounded-full bg-white/5 blur-[100px]" />
              <div className="absolute -bottom-24 -start-24 h-80 w-80 rounded-full bg-white/5 blur-[80px]" />
              <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02]">
                <Cross className="h-[400px] w-[400px]" />
              </div>
            </div>
            <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
              <SectionHeader label={t('landing.stats.label')} title={t('landing.stats.title')} centered light />
              <div className="mt-10 sm:mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {stats.map((stat, i) => (
                  <Reveal key={stat.label} delay={i * 0.1}>
                    <div className="group relative overflow-hidden rounded-2xl sm:rounded-[1.25rem] border border-white/[0.08] bg-white/[0.04] p-4 sm:p-6 text-center backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08]">
                      <div className="relative">
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

      {/* VERSES */}
      <section id="verses" className="relative py-20 sm:py-28 lg:py-32 bg-surface">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)_0%,transparent_70%)] opacity-[0.03]" />
        </div>
        <div className="page-container relative">
          <SectionHeader label={t('landing.verses.label')} title={t('landing.verses.title')} subtitle={t('landing.verses.subtitle')} centered />
          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
            {verses.map((verse, i) => (
              <VerseCard key={verse.reference} verse={verse} isRTL={isRTL} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CHURCH LIFE */}
      <section id="life" className="py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <SectionHeader label={t('landing.life.label')} title={t('landing.life.title')} subtitle={t('landing.life.subtitle')} centered />
          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
            {lifeCards.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-primary/8 bg-page transition-all duration-500 hover:border-primary/15 hover:shadow-2xl hover:shadow-primary/8 ${textAlignClass}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.lightGrad} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className="relative p-6 sm:p-8">
                    <div className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} text-[56px] sm:text-[64px] font-black text-primary/[0.04] leading-none transition-all duration-500 group-hover:text-primary/[0.08]`}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className={`mb-5 sm:mb-6 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl ${isRTL ? 'mr-0 ml-auto' : ''}`}>
                      <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-heading leading-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
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

      {/* VISIT */}
      <section id="visit" className="relative bg-surface py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <SectionHeader label={t('landing.visit.label')} title={t('landing.visit.title')} subtitle={t('landing.visit.subtitle')} centered />
          <StaggerChildren className="mt-12 sm:mt-16 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2" stagger={0.08}>
            {contacts.map((item, i) => (
              <div key={item.label} className={`group relative overflow-hidden rounded-2xl border border-primary/6 bg-page p-5 sm:p-6 transition-all duration-400 hover:border-primary/15 hover:shadow-lg hover:shadow-primary/5 ${textAlignClass}`}>
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

      {/* LOCATION */}
      <section id="location" className="py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <SectionHeader label={locationLabel} title={locationTitle} subtitle={locationSubtitle} centered />
          <Reveal className="mt-12 sm:mt-16">
            <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-primary/10 bg-surface shadow-xl shadow-primary/5">
              <div className="relative h-[280px] sm:h-[380px] lg:h-[450px] w-full">
                <iframe
                  title={isRTL ? 'موقع الكنيسة' : 'Church Location'}
                  src={locationMapEmbedUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-surface to-transparent" />
              </div>
              <div className="relative border-t border-border bg-surface px-5 py-4 sm:px-8 sm:py-5">
                <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className={textAlignClass}>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">{t('landing.visit.addressLabel')}</p>
                      <p className="mt-0.5 text-sm sm:text-base font-semibold text-heading">{churchPlaceName}</p>
                      <p className="mt-0.5 text-xs sm:text-sm text-muted">{churchPlusCode}</p>
                      <p className="mt-0.5 text-xs sm:text-sm text-muted">{churchAddressLine}</p>
                      <p className="mt-0.5 text-xs sm:text-sm text-muted">{t('landing.visit.addressValue')}</p>
                    </div>
                  </div>
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
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

      {/* PORTAL CTA */}
      <section className="border-t border-border bg-page py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <Reveal>
            <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] bg-gradient-to-br from-primary via-primary-dark to-primary text-center text-white">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-16 -end-16 h-64 w-64 rounded-full bg-white/5 blur-[60px]" />
                <div className="absolute -bottom-16 -start-16 h-64 w-64 rounded-full bg-white/5 blur-[60px]" />
                <div className="absolute top-8 start-8 text-white/[0.04]"><Cross className="h-20 w-20" /></div>
                <div className="absolute bottom-8 end-8 text-white/[0.04]"><Cross className="h-14 w-14 rotate-12" /></div>
              </div>
              <div className="relative px-6 py-12 sm:px-10 sm:py-16">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                  <Sparkles className="h-3 w-3" />
                  {t('landing.portal.label')}
                </div>
                <h3 className="mt-5 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-extrabold">{t('landing.portal.title')}</h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base lg:text-lg !text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" style={{ color: '#fff' }}>{t('landing.portal.description')}</p>
                <div className="mt-7 sm:mt-8">
                  <Link to="/auth/login">
                    <Button variant="outline" size="lg" icon={ArrowIcon} iconPosition="end" className="!rounded-full !border-white/25 !bg-white/10 !px-7 sm:!px-8 !text-white !shadow-lg !font-bold hover:!bg-white/20 hover:!border-white/40">
                      {t('landing.portal.loginCta')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

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