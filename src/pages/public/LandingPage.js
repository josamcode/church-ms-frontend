import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Church, Clock3, Heart, HandHeart,
  Mail, MapPin, Phone, Quote, ShieldCheck, Sparkles, Users, UserCircle2,
  Cross, Star, Globe, Navigation, ExternalLink, ChevronRight, ChevronLeft,
  Home, Share2, X, LogIn, Languages, Facebook, Instagram, Youtube, Twitter,
  MoreHorizontal,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useI18n } from '../../i18n/i18n';

/* ════════════════════════════════
   HOOKS
   ════════════════════════════════ */
function useInView(t = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.unobserve(el); }
    }, { threshold: t });
    obs.observe(el); return () => obs.disconnect();
  }, [t]);
  return [ref, inView];
}
function useParallax(speed = 0.3) {
  const [off, setOff] = useState(0);
  useEffect(() => {
    const h = () => setOff(window.scrollY * speed);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [speed]);
  return off;
}
function useIsMobile() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const c = () => setV(window.innerWidth < 768);
    c(); window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, []);
  return v;
}

/* ════════════════════════════════
   DESKTOP ANIMATION UTILS
   ════════════════════════════════ */
function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [ref, inView] = useInView(0.08);
  const T = {
    up: 'translateY(50px)', down: 'translateY(-50px)',
    left: 'translateX(50px)', right: 'translateX(-50px)',
    scale: 'scale(0.92)', none: 'none',
  };
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translate(0,0) scale(1)' : T[direction],
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>{children}</div>
  );
}
function StaggerChildren({ children, className = '', stagger = 0.08 }) {
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref} className={className}>
      {Array.isArray(children) ? children.map((c, i) => (
        <div key={i} style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translateY(30px)',
          transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * stagger}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * stagger}s`,
        }}>{c}</div>
      )) : children}
    </div>
  );
}
function AnimatedCounter({ value, inView }) {
  const [count, setCount] = useState(0);
  const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const suf = value.replace(/[0-9]/g, '');
  useEffect(() => {
    if (!inView || isNaN(num)) return;
    const dur = 2200, t0 = performance.now();
    const run = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [inView, num]);
  if (isNaN(num)) return <span>{value}</span>;
  return <span>{count}{suf}</span>;
}
function SectionHeader({ label, title, subtitle, centered = true, light = false }) {
  return (
    <Reveal>
      <div className={`${centered ? 'text-center mx-auto' : 'text-start'} max-w-3xl`}>
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] ${light ? 'bg-white/10 text-white/80 border border-white/10' : 'bg-primary/6 text-primary border border-primary/10'}`}>
          <Cross className="h-3 w-3" />{label}
        </span>
        <h2 className={`mt-5 text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold leading-[1.15] ${light ? 'text-white' : 'text-heading'}`}>{title}</h2>
        {subtitle && <p className={`mt-4 text-sm sm:text-base lg:text-lg leading-relaxed ${light ? 'text-white/60' : 'text-muted'}`}>{subtitle}</p>}
      </div>
    </Reveal>
  );
}

/* ════════════════════════════════
   DESKTOP CARDS
   ════════════════════════════════ */
function DesktopPriestCard({ priest, isRTL, index }) {
  const [e, setE] = useState(false);
  const hasImg = Boolean(priest.image) && !e;
  return (
    <Reveal delay={index * 0.12}>
      <div className="group relative">
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-secondary/15 opacity-0 blur-sm group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative overflow-hidden rounded-[1.75rem] bg-surface border border-primary/8 group-hover:border-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/8 transition-all duration-700">
          <div className="relative h-64 sm:h-72 overflow-hidden bg-gradient-to-b from-primary/8 via-primary/4 to-surface">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,var(--color-primary)_0%,transparent_70%)] opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
            <div className="absolute top-4 end-4 text-primary/5 group-hover:text-primary/10 group-hover:rotate-12 transition-all duration-700"><Cross className="h-12 w-12" /></div>
            <div className="absolute inset-0 flex items-end justify-center">
              {hasImg
                ? <img src={priest.image} alt={priest.alt} loading="lazy" className="h-full max-h-[260px] w-auto max-w-[85%] object-contain object-bottom group-hover:scale-105 transition-all duration-700" onError={() => setE(true)} />
                : <div className="flex items-center justify-center pb-8"><div className="relative"><div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse" /><div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/10"><UserCircle2 className="h-16 w-16 text-primary/30" /></div></div></div>
              }
            </div>
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-surface to-transparent" />
          </div>
          <div className={`relative px-6 pb-6 -mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="mb-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"><Star className="h-2.5 w-2.5 fill-current" />{priest.role}</span></div>
            <h3 className="text-lg sm:text-xl font-extrabold text-heading leading-tight">{priest.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">{priest.bio}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
function DesktopVerseCard({ verse, isRTL, index }) {
  return (
    <Reveal delay={index * 0.12}>
      <div className={`group relative h-full ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="h-full rounded-[1.75rem] border border-primary/8 bg-gradient-to-br from-page via-surface to-page p-6 sm:p-8 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 flex flex-col">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-500"><Quote className="h-5 w-5" /></div>
          <p className="flex-1 text-base sm:text-lg font-medium leading-relaxed text-heading/90">"{verse.text}"</p>
          <div className="mt-6 pt-4 border-t border-primary/8">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}><BookOpen className="h-3.5 w-3.5 text-primary/60" /><span className="text-sm font-bold text-primary">{verse.reference}</span></div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE PRIEST CAROUSEL — stacked 3D, auto 3s
   ══════════════════════════════════════════════════════ */
function MobilePriestCarousel({ priests, isRTL }) {
  const [active, setActive] = useState(0);
  const total = priests.length;

  useEffect(() => {
    const id = setInterval(() => setActive(p => (p + 1) % total), 3000);
    return () => clearInterval(id);
  }, [total]);

  const prev = () => setActive(p => (p - 1 + total) % total);
  const next = () => setActive(p => (p + 1) % total);

  return (
    <div className="relative select-none" style={{ WebkitUserSelect: 'none' }}>
      <div className="relative h-72 mx-10 flex items-center justify-center">
        {priests.map((priest, i) => {
          const diff = (i - active + total) % total;
          const isCenter = diff === 0;
          const isRight = diff === 1;
          const isLeft = diff === total - 1;
          if (!isCenter && !isRight && !isLeft) return null;

          let style;
          if (isCenter) {
            style = { zIndex: 10, opacity: 1, transform: 'translateX(0) rotate(0deg) scale(1)', filter: 'none' };
          } else if (isLeft) {
            style = { zIndex: 5, opacity: 0.75, transform: 'translateX(-58%) rotate(-6deg) scale(0.85)', transformOrigin: 'top right', filter: 'brightness(0.85)' };
          } else {
            style = { zIndex: 5, opacity: 0.75, transform: 'translateX(58%) rotate(6deg) scale(0.85)', transformOrigin: 'top left', filter: 'brightness(0.85)' };
          }

          return (
            <div
              key={priest.name}
              onClick={() => !isCenter && setActive(i)}
              className="absolute w-48 cursor-pointer"
              style={{ transition: 'all 0.55s cubic-bezier(0.34,1.2,0.64,1)', ...style }}
            >
              <PriestMiniCard priest={priest} isRTL={isRTL} isCenter={isCenter} />
            </div>
          );
        })}
      </div>
      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {priests.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ WebkitTapHighlightColor: 'transparent' }}>
            <span className={`block rounded-full transition-all duration-300 ${i === active ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-primary/25'}`} />
          </button>
        ))}
      </div>
      {/* Arrows */}
      <button onClick={isRTL ? next : prev} className="absolute left-0 top-[44%] -translate-y-1/2 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shadow-md active:scale-90 transition-transform" style={{ WebkitTapHighlightColor: 'transparent' }}>
        <ChevronLeft className="h-4 w-4 text-muted" />
      </button>
      <button onClick={isRTL ? prev : next} className="absolute right-0 top-[44%] -translate-y-1/2 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shadow-md active:scale-90 transition-transform" style={{ WebkitTapHighlightColor: 'transparent' }}>
        <ChevronRight className="h-4 w-4 text-muted" />
      </button>
    </div>
  );
}

function PriestMiniCard({ priest, isRTL, isCenter }) {
  const [err, setErr] = useState(false);
  const hasImg = Boolean(priest.image) && !err;
  return (
    <div className={`rounded-2xl overflow-hidden border shadow-xl ${isCenter ? 'bg-surface border-primary/25 shadow-primary/12' : 'bg-surface/90 border-border shadow-black/5'}`}>
      <div className="relative h-36 bg-gradient-to-b from-primary/10 to-surface overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)_0%,transparent_65%)] opacity-20" />
        {hasImg
          ? <img src={priest.image} alt={priest.alt} className="absolute inset-0 w-full h-full object-contain object-bottom" onError={() => setErr(true)} />
          : <div className="absolute inset-0 flex items-end justify-center pb-3"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/15 flex items-center justify-center"><UserCircle2 className="h-10 w-10 text-primary/30" /></div></div>
        }
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-surface to-transparent" />
      </div>
      <div className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
        <span className="inline-flex items-center gap-1 bg-primary/8 border border-primary/10 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">{priest.role}</span>
        <p className="text-xs font-extrabold text-heading mt-1 leading-tight truncate">{priest.name}</p>
        {isCenter && <p className="text-[10px] text-muted mt-0.5 line-clamp-2 leading-relaxed">{priest.bio}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE MORE MENU (sheet from bottom, triggered by tab)
   ══════════════════════════════════════════════════════ */
function MobileMoreSheet({ open, onClose, isRTL, toggleLanguage }) {
  const items = [
    {
      icon: LogIn,
      label: isRTL ? 'تسجيل الدخول' : 'Login',
      desc: isRTL ? 'الوصول إلى بوابة الكنيسة' : 'Access the church portal',
      to: '/auth/login',
      accent: 'bg-primary/10 text-primary',
    },
    {
      icon: Languages,
      label: isRTL ? 'English' : 'عربي',
      desc: isRTL ? 'Switch to English' : 'التبديل إلى العربية',
      action: toggleLanguage,
      accent: 'bg-secondary/10 text-primary',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-3xl border-t border-border shadow-2xl"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {/* Title */}
        <div className={`px-5 pt-2 pb-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-base font-black text-heading">{isRTL ? 'المزيد' : 'More'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-page flex items-center justify-center" style={{ WebkitTapHighlightColor: 'transparent' }}>
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>
        {/* Items */}
        <div className="px-4 pb-4 space-y-2.5" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {items.map((item, i) => (
            item.to ? (
              <Link key={i} to={item.to} onClick={onClose}>
                <div className={`flex items-center gap-4 p-4 rounded-2xl bg-page border border-border active:scale-[0.98] transition-transform ${isRTL ? 'flex-row-reverse text-right' : ''}`} style={{ WebkitTapHighlightColor: 'transparent' }}>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.accent}`}><item.icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-heading">{item.label}</p>
                    <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                </div>
              </Link>
            ) : (
              <button key={i} onClick={() => { item.action?.(); onClose(); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-page border border-border active:scale-[0.98] transition-transform ${isRTL ? 'flex-row-reverse text-right' : ''}`} style={{ WebkitTapHighlightColor: 'transparent' }}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.accent}`}><item.icon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-sm font-extrabold text-heading ${isRTL ? 'text-right' : 'text-left'}`}>{item.label}</p>
                  <p className={`text-xs text-muted mt-0.5 ${isRTL ? 'text-right' : 'text-left'}`}>{item.desc}</p>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            )
          ))}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE SECTION LABEL — RTL/LTR aware
   ══════════════════════════════════════════════════════ */
function MobileSectionLabel({ label, isRTL }) {
  return (
    <h2 className={`text-sm font-black text-heading ${isRTL ? 'text-right' : 'text-left'}`}>{label}</h2>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE HOME SCREEN
   ══════════════════════════════════════════════════════ */
function MobileHomeScreen({ t, isRTL, priests, stats, verses, getOptional }) {
  const [statsRef, statsInView] = useInView(0.1);

  const quickActions = [
    { icon: MapPin, label: isRTL ? 'الموقع' : 'Location', color: 'text-blue-600', bg: 'bg-blue-500/10', href: '#' },
    { icon: Phone, label: isRTL ? 'اتصل' : 'Call', color: 'text-emerald-600', bg: 'bg-emerald-500/10', href: 'tel:+' },
    { icon: Mail, label: isRTL ? 'راسلنا' : 'Email', color: 'text-amber-600', bg: 'bg-amber-500/10', href: 'mailto:' },
    { icon: Clock3, label: isRTL ? 'المواعيد' : 'Hours', color: 'text-rose-600', bg: 'bg-rose-500/10', href: '#' },
  ];

  const lifeItems = [
    { icon: ShieldCheck, title: t('landing.life.items.one.title'), desc: t('landing.life.items.one.description'), gradient: 'from-blue-500 to-indigo-600', num: '01' },
    { icon: BookOpen, title: t('landing.life.items.two.title'), desc: t('landing.life.items.two.description'), gradient: 'from-amber-500 to-orange-600', num: '02' },
    { icon: Sparkles, title: t('landing.life.items.three.title'), desc: t('landing.life.items.three.description'), gradient: 'from-rose-500 to-pink-600', num: '03' },
  ];

  return (
    <div className="pb-28">
      {/* ── Church hero banner ── */}
      <div className="relative mx-3 mt-3 rounded-[1.5rem] overflow-hidden" style={{ height: 220 }}>
        <img
          src={getOptional('landing.hero.churchImage') || '/images/church.webp'}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/45 via-primary/10 to-transparent" />
        <div className="absolute top-4 right-4 text-white/[0.07] pointer-events-none"><Cross className="h-16 w-16" /></div>
        <div className={`absolute bottom-0 inset-x-0 p-5 ${isRTL ? 'text-right' : 'text-left'}`}>
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/95 border border-white/20">
            <Star className="h-2.5 w-2.5 fill-yellow-300 text-yellow-300" />
            {t('landing.hero.badge')}
          </span>
          <h1 className="text-[1.35rem] font-black text-white mt-2 leading-tight tracking-tight drop-shadow-lg">
            {t('landing.hero.title')}{' '}
            <span className="text-white/65">{t('landing.hero.highlight')}</span>
          </h1>
        </div>
      </div>

      {/* ── Quick action grid — full width 2×2 ── */}
      <div className="px-3 mt-3 grid grid-cols-4 gap-2">
        {quickActions.map((a, i) => (
          <a
            key={i}
            href={a.href}
            className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl ${a.bg} active:scale-95 transition-transform`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`w-8 h-8 rounded-xl bg-white/60 dark:bg-surface/60 flex items-center justify-center ${a.color}`}>
              <a.icon className="h-4 w-4" />
            </div>
            <span className={`text-[10px] font-bold ${a.color}`}>{a.label}</span>
          </a>
        ))}
      </div>

      {/* ── Stats — clean 2×2 cards, no internal dividers ── */}
      <div ref={statsRef} className="px-3 mt-3 grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{
              opacity: statsInView ? 1 : 0,
              transform: statsInView ? 'none' : 'translateY(14px)',
              transition: `all 0.45s ease ${i * 0.08}s`,
            }}
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <p className="text-lg font-black text-heading leading-none">
                <AnimatedCounter value={s.value} inView={statsInView} />
              </p>
              <p className="text-[10px] text-muted mt-0.5 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Priests ── */}
      <div className="mt-5">
        <div className={`px-5 mb-3 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <MobileSectionLabel label={t('landing.priests.label')} isRTL={isRTL} />
        </div>
        <MobilePriestCarousel priests={priests} isRTL={isRTL} />
      </div>

      {/* ── Featured verse ── */}
      <div className="mx-3 mt-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/3 to-transparent border border-primary/12 p-5">
          <div className="absolute top-3 right-4 text-primary/[0.07] pointer-events-none"><Quote className="h-12 w-12" /></div>
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.verses.label')}</span>
          </div>
          <p className={`text-sm font-medium leading-relaxed text-heading/90 italic ${isRTL ? 'text-right' : 'text-left'}`}>"{verses[0]?.text}"</p>
          <p className={`mt-2 text-xs font-bold text-primary ${isRTL ? 'text-right' : 'text-left'}`}>{verses[0]?.reference}</p>
        </div>
      </div>

      {/* ── Church life — vertical list, editorial style ── */}
      <div className="mt-5">
        <div className={`px-5 mb-3 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <MobileSectionLabel label={t('landing.life.label')} isRTL={isRTL} />
        </div>
        <div className="px-3 space-y-2.5">
          {lifeItems.map((item, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl border border-border bg-surface flex items-stretch ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {/* Colored left (or right for RTL) accent bar */}
              <div className={`w-1 flex-shrink-0 bg-gradient-to-b ${item.gradient} ${isRTL ? 'rounded-r-2xl' : 'rounded-l-2xl'}`} />
              <div className={`flex items-center gap-4 flex-1 px-4 py-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-heading leading-tight">{item.title}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed line-clamp-2">{item.desc}</p>
                </div>
                {/* Number watermark */}
                <span className="text-[2rem] font-black text-primary/[0.06] leading-none flex-shrink-0">{item.num}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE ABOUT SCREEN
   ══════════════════════════════════════════════════════ */
function MobileAboutScreen({ t, isRTL }) {
  const ta = isRTL ? 'text-right' : 'text-left';
  return (
    <div className="pb-28">
      <div className={`px-5 pt-0 pb-3 ${ta}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.about.label')}</p>
        <h1 className="text-2xl font-black text-heading tracking-tight mt-0.5">{t('landing.about.title')}</h1>
      </div>
      <div className="px-3 space-y-2.5">
        <div className={`bg-surface border border-border rounded-2xl p-5 ${ta}`}>
          <p className="text-sm leading-loose text-muted">{t('landing.about.description')}</p>
        </div>
        <div className={`bg-gradient-to-br from-primary/8 to-transparent border border-primary/12 rounded-2xl p-5 ${ta}`}>
          <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0"><Navigation className="h-4 w-4 text-primary" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.about.missionLabel')}</p>
          </div>
          <p className="text-sm leading-relaxed text-heading/80">{t('landing.about.missionText')}</p>
        </div>
        <div className={`bg-gradient-to-br from-secondary/8 to-transparent border border-secondary/15 rounded-2xl p-5 ${ta}`}>
          <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0"><Globe className="h-4 w-4 text-primary" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.about.visionLabel')}</p>
          </div>
          <p className="text-sm leading-relaxed text-heading/80">{t('landing.about.visionText')}</p>
        </div>
        {[
          { icon: ShieldCheck, title: t('landing.life.items.one.title'), desc: t('landing.life.items.one.description'), g: 'from-blue-500 to-indigo-600' },
          { icon: BookOpen, title: t('landing.life.items.two.title'), desc: t('landing.life.items.two.description'), g: 'from-amber-500 to-orange-600' },
          { icon: Sparkles, title: t('landing.life.items.three.title'), desc: t('landing.life.items.three.description'), g: 'from-rose-500 to-pink-600' },
        ].map((item, i) => (
          <div key={i} className={`bg-surface border border-border rounded-2xl p-4 flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.g} flex items-center justify-center flex-shrink-0 shadow-md`}><item.icon className="h-5 w-5 text-white" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-heading">{item.title}</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
            <ChevronRight className={`h-4 w-4 text-muted flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE VISIT SCREEN
   ══════════════════════════════════════════════════════ */
function MobileVisitScreen({ t, isRTL, contacts, churchPlaceName, churchPlusCode, churchAddressLine, locationMapEmbedUrl, directionsUrl, verses }) {
  const ta = isRTL ? 'text-right' : 'text-left';
  return (
    <div className="pb-28">
      <div className={`px-5 pt-0 pb-3 ${ta}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.visit.label')}</p>
        <h1 className="text-2xl font-black text-heading tracking-tight mt-0.5">{t('landing.visit.title')}</h1>
      </div>
      <div className="px-3 space-y-2.5">
        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-border bg-surface">
          <div className="h-52 relative">
            <iframe title="Church Location" src={locationMapEmbedUrl} className="h-full w-full border-0" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className={`p-4 border-t border-border ${ta}`}>
            <p className="text-xs font-extrabold text-heading">{churchPlaceName}</p>
            <p className="text-[10px] text-muted mt-0.5">{churchPlusCode} · {churchAddressLine}</p>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
              <button className="w-full bg-primary text-white text-xs font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <ExternalLink className="h-3.5 w-3.5" />
                {isRTL ? 'احصل على الاتجاهات' : 'Get Directions'}
              </button>
            </a>
          </div>
        </div>
        {/* Contact rows */}
        {contacts.map((item, i) => (
          <div key={i} className={`bg-surface border border-border rounded-2xl p-4 flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}><item.icon className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted">{item.label}</p>
              <p className={`text-xs font-semibold text-heading mt-0.5 ${item.ltr ? 'direction-ltr' : ''}`}>{item.value}</p>
            </div>
          </div>
        ))}
        {/* Verses */}
        {verses.map((v, i) => (
          <div key={i} className={`bg-surface border border-border rounded-2xl p-4 ${ta}`}>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Quote className="h-3.5 w-3.5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-relaxed text-heading/90 italic">"{v.text}"</p>
                <div className={`flex items-center gap-1.5 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}><BookOpen className="h-3 w-3 text-primary/60" /><span className="text-[10px] font-bold text-primary">{v.reference}</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE SOCIAL SCREEN
   ══════════════════════════════════════════════════════ */
function MobileSocialScreen({ t, isRTL }) {
  const ta = isRTL ? 'text-right' : 'text-left';
  const socials = [
    { icon: Facebook, name: 'Facebook', handle: '@churchmichael', color: '#1877F2', bgFrom: 'rgba(24,119,242,0.1)', bgTo: 'rgba(24,119,242,0.04)', border: 'rgba(24,119,242,0.2)', url: '#', desc: isRTL ? 'تابعنا على فيسبوك' : 'Follow us on Facebook' },
    { icon: Instagram, name: 'Instagram', handle: '@church.michael', color: '#E1306C', bgFrom: 'rgba(225,48,108,0.1)', bgTo: 'rgba(225,48,108,0.04)', border: 'rgba(225,48,108,0.2)', url: '#', desc: isRTL ? 'صورنا وأنشطتنا' : 'Our photos & activities' },
    { icon: Youtube, name: 'YouTube', handle: 'Church Michael', color: '#FF0000', bgFrom: 'rgba(255,0,0,0.1)', bgTo: 'rgba(255,0,0,0.04)', border: 'rgba(255,0,0,0.18)', url: '#', desc: isRTL ? 'قداسات مباشرة' : 'Live liturgies & sermons' },
    { icon: Twitter, name: 'X / Twitter', handle: '@churchmichael', color: '#111', bgFrom: 'rgba(0,0,0,0.07)', bgTo: 'rgba(0,0,0,0.02)', border: 'rgba(100,100,100,0.15)', url: '#', desc: isRTL ? 'آخر الأخبار' : 'Latest news & updates' },
  ];

  return (
    <div className="pb-28">
      <div className={`px-5 pt-0 pb-3 ${ta}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{isRTL ? 'تواصل معنا' : 'CONNECT WITH US'}</p>
        <h1 className="text-2xl font-black text-heading tracking-tight mt-0.5">{isRTL ? 'وسائل التواصل' : 'Social Media'}</h1>
      </div>
      <div className="px-3 space-y-2.5">
        {socials.map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-4 p-4 rounded-2xl border active:scale-[0.98] transition-transform duration-150 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
            style={{ background: `linear-gradient(135deg, ${s.bgFrom}, ${s.bgTo})`, borderColor: s.border, WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ backgroundColor: s.color }}>
              <s.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-heading">{s.name}</p>
              <p className="text-[11px] text-muted mt-0.5">{s.handle}</p>
              <p className="text-[10px] text-muted/70 mt-0.5">{s.desc}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted flex-shrink-0" />
          </a>
        ))}
        {/* Share card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-primary p-5">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full bg-white/5 pointer-events-none" />
          <p className={`text-white/60 text-[10px] font-black uppercase tracking-widest ${ta}`}>{isRTL ? 'شارك الكنيسة' : 'SHARE'}</p>
          <p className={`text-white font-extrabold text-base mt-1 leading-tight ${ta}`}>{isRTL ? 'شارك مع أصدقائك' : 'Share with friends'}</p>
          <button
            onClick={() => navigator.share?.({ title: 'Church', url: window.location.href })}
            className={`mt-3 bg-white/15 border border-white/20 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 active:scale-95 transition-transform ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Share2 className="h-3.5 w-3.5" />{isRTL ? 'مشاركة' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE BOTTOM TAB BAR (5 tabs + More)
   ══════════════════════════════════════════════════════ */
function MobileTabBar({ active, onTab, tabs, onMore }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-surface/92 backdrop-blur-xl border-t border-border" />
      <div
        className="relative flex items-center justify-around px-1"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))', paddingTop: '0.45rem' }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => tab.id === 'more' ? onMore() : onTab(tab.id)}
              className="flex flex-col items-center gap-0.5 flex-1 py-1"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={`relative w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'text-muted'}`}>
                <tab.icon className="h-4 w-4" />
              </div>
              <span className={`text-[9px] font-bold tracking-wide transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { t, isRTL, toggleLanguage } = useI18n();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const textAlignClass = isRTL ? 'text-right' : 'text-left';
  const [statsRef, statsInView] = useInView(0.2);
  const parallaxOffset = useParallax(0.15);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('home');
  const [moreOpen, setMoreOpen] = useState(false);

  const getOptional = (k) => { const v = t(k); return v === k ? '' : v; };
  const getOpt = (k, fb) => { const v = getOptional(k); return v || fb; };

  /* ── Shared data ── */
  const priests = [
    { name: t('landing.priests.items.one.name'), role: t('landing.priests.items.one.role'), bio: t('landing.priests.items.one.bio'), alt: t('landing.priests.items.one.alt'), image: getOptional('landing.priests.items.one.image') },
    { name: t('landing.priests.items.two.name'), role: t('landing.priests.items.two.role'), bio: t('landing.priests.items.two.bio'), alt: t('landing.priests.items.two.alt'), image: getOptional('landing.priests.items.two.image') },
    { name: t('landing.priests.items.three.name'), role: t('landing.priests.items.three.role'), bio: t('landing.priests.items.three.bio'), alt: t('landing.priests.items.three.alt'), image: getOptional('landing.priests.items.three.image') },
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

  const churchPlaceName = 'Church of the Archangel Michael Balqtoshh';
  const churchPlusCode = '9MC6+6QG';
  const churchAddressLine = 'Astal, West Samalout, Minya Governorate 2477363';
  const locationMapEmbedUrl = `https://maps.google.com/maps?ll=28.3705542%2C30.6619377&q=${encodeURIComponent(churchPlaceName)}&z=18&t=k&output=embed`;
  const directionsUrl = `https://maps.app.goo.gl/g24SscQHQKMYSq6M9`;
  const locationTitle = getOpt('landing.location.title', isRTL ? 'موقعنا' : 'Our Location');
  const locationLabel = getOpt('landing.location.label', isRTL ? 'تعال زورنا' : 'COME VISIT US');
  const locationSubtitle = getOpt('landing.location.subtitle', isRTL ? 'يسعدنا استقبالكم' : 'We would love to welcome you');
  const locationDirections = getOpt('landing.location.directions', isRTL ? 'احصل على الاتجاهات' : 'Get Directions');

  /* 5-tab bar (4 screens + More) */
  const mobileTabs = [
    { id: 'home', label: isRTL ? 'الرئيسية' : 'Home', icon: Home },
    { id: 'about', label: isRTL ? 'عن الكنيسة' : 'About', icon: Church },
    { id: 'visit', label: isRTL ? 'زيارة' : 'Visit', icon: MapPin },
    { id: 'social', label: isRTL ? 'تواصل' : 'Social', icon: Share2 },
    { id: 'more', label: isRTL ? 'المزيد' : 'More', icon: MoreHorizontal },
  ];

  /* ══ MOBILE ══ */
  if (isMobile) {
    return (
      <div className="bg-page mt-16" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Screen */}
        <div key={activeTab} style={{ animation: 'appIn 0.2s ease' }}>
          {activeTab === 'home' && <MobileHomeScreen t={t} isRTL={isRTL} priests={priests} stats={stats} verses={verses} getOptional={getOptional} />}
          {activeTab === 'about' && <MobileAboutScreen t={t} isRTL={isRTL} />}
          {activeTab === 'visit' && <MobileVisitScreen t={t} isRTL={isRTL} contacts={contacts} churchPlaceName={churchPlaceName} churchPlusCode={churchPlusCode} churchAddressLine={churchAddressLine} locationMapEmbedUrl={locationMapEmbedUrl} directionsUrl={directionsUrl} verses={verses} />}
          {activeTab === 'social' && <MobileSocialScreen t={t} isRTL={isRTL} />}
        </div>
        {/* More bottom sheet */}
        <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} isRTL={isRTL} toggleLanguage={toggleLanguage} />
        {/* Tab bar */}
        <MobileTabBar active={activeTab} onTab={setActiveTab} tabs={mobileTabs} onMore={() => setMoreOpen(true)} />
        <style>{`
          @keyframes appIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
          .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
          .scrollbar-hide::-webkit-scrollbar { display:none; }
        `}</style>
      </div>
    );
  }

  /* ══ DESKTOP (unchanged) ══ */
  return (
    <div className="bg-page overflow-x-hidden">

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img src={getOptional('landing.hero.churchImage') || '/images/church.webp'} alt={isRTL ? 'كنيسة الملاك ميخائيل' : 'Archangel Michael Church'} className="h-full w-full object-cover object-center" loading="eager" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-page to-secondary/10" />
        </div>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-page from-[10%] via-page/95 via-[45%] to-transparent to-[85%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[60%] to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-page/40 via-transparent to-page/40" />
        </div>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-12 -start-20 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[120px]" style={{ transform: `translateY(${parallaxOffset * 0.4}px)` }} />
          <div className="absolute top-1/4 -end-16 h-[250px] w-[250px] rounded-full bg-secondary/8 blur-[100px]" style={{ transform: `translateY(${parallaxOffset * 0.25}px)` }} />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(var(--color-primary) 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
          <div className="absolute top-0 start-[22%] w-px h-[45%] bg-gradient-to-b from-primary/10 via-primary/4 to-transparent hidden lg:block" />
          <div className="absolute top-0 end-[22%] w-px h-[35%] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent hidden lg:block" />
          <div className="absolute top-24 end-[10%] text-primary/[0.04] hidden lg:block" style={{ transform: `translateY(${parallaxOffset * 0.5}px) rotate(8deg)` }}><Cross className="h-32 w-32" /></div>
        </div>
        <div className="relative flex-1 flex flex-col items-center justify-center page-container w-full pt-28 sm:pt-32 lg:pt-36 pb-52 sm:pb-60 md:pb-64 lg:pb-72">
          <Reveal delay={0.05}>
            <Badge variant="secondary" className="mb-5 sm:mb-6 !rounded-full !px-5 !py-2 !text-[10px] sm:!text-xs !font-bold !border !border-primary/10 !bg-surface/80 !backdrop-blur-sm">
              <Star className="me-1.5 h-3 w-3 fill-current text-primary" />{t('landing.hero.badge')}
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
              <a href="#about" className="w-full sm:w-auto"><Button size="lg" icon={ArrowIcon} iconPosition="end" className="!rounded-full !px-7 sm:!px-8 !shadow-lg !shadow-primary/20 !w-full sm:!w-auto !font-bold">{t('landing.hero.primaryCta')}</Button></a>
              <a href="#visit" className="w-full sm:w-auto"><Button variant="outline" size="lg" className="!rounded-full !px-7 sm:!px-8 !w-full sm:!w-auto !font-bold !bg-surface/60 !backdrop-blur-sm">{t('landing.hero.secondaryCta')}</Button></a>
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
                <div className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-primary/6 via-primary/3 to-transparent p-6 sm:p-8 hover:border-primary/20 hover:shadow-lg transition-all duration-500 ${textAlignClass}`}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300"><Navigation className="h-5 w-5" /></div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{t('landing.about.missionLabel')}</p>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-heading/80">{t('landing.about.missionText')}</p>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <div className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-secondary/10 bg-gradient-to-br from-secondary/8 via-secondary/3 to-transparent p-6 sm:p-8 hover:border-secondary/20 hover:shadow-lg transition-all duration-500 ${textAlignClass}`}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300"><Globe className="h-5 w-5" /></div>
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
            {priests.map((p, i) => <DesktopPriestCard key={p.name} priest={p} isRTL={isRTL} index={i} />)}
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
              <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02]"><Cross className="h-[400px] w-[400px]" /></div>
            </div>
            <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
              <SectionHeader label={t('landing.stats.label')} title={t('landing.stats.title')} centered light />
              <div className="mt-10 sm:mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {stats.map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.1}>
                    <div className="group relative overflow-hidden rounded-2xl sm:rounded-[1.25rem] border border-white/[0.08] bg-white/[0.04] p-4 sm:p-6 text-center backdrop-blur-sm hover:border-white/20 hover:bg-white/[0.08] transition-all duration-500">
                      <div className="relative">
                        <div className={`mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${s.accent} shadow-lg`}><s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></div>
                        <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-white"><AnimatedCounter value={s.value} inView={statsInView} /></p>
                        <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/50">{s.label}</p>
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
        <div className="pointer-events-none absolute inset-0"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)_0%,transparent_70%)] opacity-[0.03]" /></div>
        <div className="page-container relative">
          <SectionHeader label={t('landing.verses.label')} title={t('landing.verses.title')} subtitle={t('landing.verses.subtitle')} centered />
          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
            {verses.map((v, i) => <DesktopVerseCard key={v.reference} verse={v} isRTL={isRTL} index={i} />)}
          </div>
        </div>
      </section>

      {/* LIFE */}
      <section id="life" className="py-20 sm:py-28 lg:py-32">
        <div className="page-container">
          <SectionHeader label={t('landing.life.label')} title={t('landing.life.title')} subtitle={t('landing.life.subtitle')} centered />
          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
            {lifeCards.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-primary/8 bg-page hover:border-primary/15 hover:shadow-2xl hover:shadow-primary/8 transition-all duration-500 ${textAlignClass}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.lightGrad} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative p-6 sm:p-8">
                    <div className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} text-[56px] sm:text-[64px] font-black text-primary/[0.04] leading-none group-hover:text-primary/[0.08] transition-all duration-500`}>{String(i + 1).padStart(2, '0')}</div>
                    <div className={`mb-5 sm:mb-6 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-500`}><item.icon className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-heading leading-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
                    <div className={`mt-5 sm:mt-6 flex items-center gap-1.5 text-primary/40 group-hover:text-primary group-hover:gap-2.5 transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
            {contacts.map((item) => (
              <div key={item.label} className={`group relative overflow-hidden rounded-2xl border border-primary/6 bg-page p-5 sm:p-6 hover:border-primary/15 hover:shadow-lg hover:shadow-primary/5 transition-all duration-400 ${textAlignClass}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${item.color} group-hover:scale-105 transition-transform duration-300`}><item.icon className="h-5 w-5" /></div>
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
                <iframe title={isRTL ? 'موقع الكنيسة' : 'Church Location'} src={locationMapEmbedUrl} className="h-full w-full border-0" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-surface to-transparent" />
              </div>
              <div className="relative border-t border-border bg-surface px-5 py-4 sm:px-8 sm:py-5">
                <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
                    <div className={textAlignClass}>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">{t('landing.visit.addressLabel')}</p>
                      <p className="mt-0.5 text-sm sm:text-base font-semibold text-heading">{churchPlaceName}</p>
                      <p className="mt-0.5 text-xs sm:text-sm text-muted">{churchPlusCode} · {churchAddressLine}</p>
                      <p className="mt-0.5 text-xs sm:text-sm text-muted">{t('landing.visit.addressValue')}</p>
                    </div>
                  </div>
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button variant="outline" size="md" icon={ExternalLink} iconPosition="end" className="!rounded-full !font-bold !w-full sm:!w-auto">{locationDirections}</Button>
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
                  <Sparkles className="h-3 w-3" />{t('landing.portal.label')}
                </div>
                <h3 className="mt-5 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-extrabold">{t('landing.portal.title')}</h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base lg:text-lg text-white/80">{t('landing.portal.description')}</p>
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

      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}