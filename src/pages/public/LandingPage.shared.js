import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Cross, Facebook, Instagram, Youtube, Twitter, UserCircle2, X, LogIn, Globe,
} from 'lucide-react';

export const DEFAULT_DIRECTIONS_URL = 'https://maps.app.goo.gl/g24SscQHQKMYSq6M9';

export const SOCIAL_META = {
  facebook: {
    icon: Facebook,
    color: '#1877F2',
    bgFrom: 'rgba(24,119,242,0.1)',
    bgTo: 'rgba(24,119,242,0.04)',
    border: 'rgba(24,119,242,0.2)',
  },
  instagram: {
    icon: Instagram,
    color: '#E1306C',
    bgFrom: 'rgba(225,48,108,0.1)',
    bgTo: 'rgba(225,48,108,0.04)',
    border: 'rgba(225,48,108,0.2)',
  },
  youtube: {
    icon: Youtube,
    color: '#FF0000',
    bgFrom: 'rgba(255,0,0,0.1)',
    bgTo: 'rgba(255,0,0,0.04)',
    border: 'rgba(255,0,0,0.18)',
  },
  twitter: {
    icon: Twitter,
    color: '#111',
    bgFrom: 'rgba(0,0,0,0.07)',
    bgTo: 'rgba(0,0,0,0.02)',
    border: 'rgba(100,100,100,0.15)',
  },
};

export function buildDefaultMapEmbedUrl(placeName) {
  return `https://maps.google.com/maps?ll=28.3705542%2C30.6619377&q=${encodeURIComponent(placeName)}&z=18&t=k&output=embed`;
}

/* ════════════════════════════════
   HOOKS
   ════════════════════════════════ */
export function useInView(t = 0.15) {
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
export function useParallax(speed = 0.3) {
  const [off, setOff] = useState(0);
  useEffect(() => {
    const h = () => setOff(window.scrollY * speed);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [speed]);
  return off;
}
export function useIsMobile() {
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
export function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
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
export function StaggerChildren({ children, className = '', stagger = 0.08 }) {
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
export function AnimatedCounter({ value, inView }) {
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
export function SectionHeader({ label, title, subtitle, centered = true, light = false }) {
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

export function GuestEntryPanel({
  isRTL,
  registrationEnabled = true,
  onBrowse,
  onClose,
  compact = false,
  className = '',
}) {
  const copy = isRTL
    ? {
      badge: 'بوابة الدخول',
      title: 'اختر الطريقة المناسبة للدخول',
      subtitle:
        'ابدأ بالطريقة التي تناسبك. يمكنك إرسال طلب حساب جديد، أو تسجيل الدخول إذا كان لديك حساب بالفعل، أو تصفح المنصة أولًا.',
      joinTitle: 'إنشاء طلب حساب جديد',
      joinBody:
        'أرسل بياناتك ليتم مراجعتها واعتماد حسابك قبل تفعيل إمكانية الدخول.',
      joinHint: 'ابدأ التسجيل',
      joinClosed: 'التسجيل غير متاح حاليًا',
      joinClosedBody:
        'تم إيقاف استقبال طلبات الحسابات الجديدة من إعدادات النظام في الوقت الحالي.',
      loginTitle: 'تسجيل الدخول',
      loginBody:
        'إذا كان لديك حساب بالفعل، انتقل مباشرة إلى صفحة تسجيل الدخول للوصول إلى خدماتك.',
      loginHint: 'اذهب لتسجيل الدخول',
      browseTitle: 'تصفح أولًا',
      browseBody:
        'استكشف الواجهة العامة وتعرف على الخدمات والأنشطة قبل إنشاء حساب أو تسجيل الدخول.',
      browseHint: 'ابدأ التصفح',
      closeLabel: 'إغلاق نافذة الدخول',
    }
    : {
      badge: 'Entry Gateway',
      title: 'Choose how you want to continue',
      subtitle:
        'Start in the way that fits you best. You can submit a new account request, sign in if you already have an account, or explore the platform first.',
      joinTitle: 'Create a new account request',
      joinBody:
        'Submit your details so the team can review and approve your access.',
      joinHint: 'Start registration',
      joinClosed: 'Registration is currently unavailable',
      joinClosedBody:
        'New account requests are temporarily disabled from system settings.',
      loginTitle: 'Sign in',
      loginBody:
        'Already have an account? Go directly to the sign-in page and access your services.',
      loginHint: 'Go to sign in',
      browseTitle: 'Browse first',
      browseBody:
        'Explore the public experience and discover the services and community before continuing.',
      browseHint: 'Start browsing',
      closeLabel: 'Close entry modal',
    };

  const textAlignClass = isRTL ? 'text-right' : 'text-left';
  const rowDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
  const arrowRotate = isRTL ? 'rotate-180' : '';
  const gridCols = compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-3';
  const panelClasses = compact
    ? 'rounded-[20px] p-3.5 shadow-[0_16px_48px_rgba(2,6,23,0.14)]'
    : 'rounded-[32px] p-5 shadow-[0_30px_100px_rgba(2,6,23,0.18)] sm:p-7 lg:p-8';
  const headerTitleClasses = compact
    ? 'mt-1 pe-9 text-[1.35rem] font-black leading-tight tracking-tight text-slate-950'
    : 'mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl';
  const headerBodyClasses = compact
    ? 'mt-2 max-w-xl pe-1 text-[12px] leading-5 text-slate-600'
    : 'mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]';
  const gridClasses = compact ? 'mt-4 grid gap-2.5' : 'mt-8 grid gap-4 lg:gap-5';
  const closeButtonClasses = compact
    ? `absolute top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/85 text-slate-700 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:bg-white ${isRTL ? 'left-2.5' : 'right-2.5'}`
    : `absolute top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/85 text-slate-700 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:bg-white ${isRTL ? 'left-4' : 'right-4'}`;

  const baseCard =
    compact
      ? 'group relative overflow-hidden rounded-[18px] border border-white/60 bg-white/80 p-3 backdrop-blur-xl transition-all duration-300 hover:shadow-xl'
      : 'group relative overflow-hidden rounded-[28px] border border-white/60 bg-white/80 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-6';
  const mutedCard =
    'shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:border-slate-200 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]';
  const primaryCard =
    'border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.90)),radial-gradient(circle_at_top,rgba(var(--color-primary-rgb,59_130_246),0.14),transparent_45%)] shadow-[0_14px_40px_rgba(59,130,246,0.12)] hover:border-primary/30 hover:shadow-[0_22px_60px_rgba(59,130,246,0.16)]';

  const OptionCard = ({
    as = 'div',
    to,
    href,
    onClick,
    icon,
    iconWrapClass,
    title,
    body,
    hint,
    variant = 'default',
    disabled = false,
  }) => {
    const Component = as;
    const classes = `${baseCard} ${variant === 'primary' ? primaryCard : mutedCard} ${disabled ? 'cursor-default border-rose-200 bg-rose-50/90 hover:translate-y-0 hover:shadow-none' : ''
      }`;

    const props = {
      className: classes,
      ...(to ? { to } : {}),
      ...(href ? { href } : {}),
      ...(onClick ? { onClick } : {}),
      ...(disabled ? {} : {}),
    };

    return (
      <Component {...props}>
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/55 to-transparent" />
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
        </div>

        <div className={`relative flex h-full flex-col ${textAlignClass}`}>
          <div className={`flex items-start justify-between ${compact ? 'gap-3' : 'gap-4'} ${rowDirection}`}>
            <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'} ${rowDirection}`}>
              <div
                className={`flex shrink-0 items-center justify-center ${compact ? 'h-9 w-9 rounded-[14px]' : 'h-14 w-14 rounded-2xl'} ${iconWrapClass}`}
              >
                {icon}
              </div>

              <div>
                <h3 className={`${compact ? 'text-sm leading-snug' : 'text-lg'} font-extrabold tracking-tight text-slate-900`}>
                  {title}
                </h3>
              </div>
            </div>
          </div>

          <p className={`relative ${compact ? 'mt-2 text-[12px] leading-5' : 'mt-4 text-sm leading-7'} text-slate-600`}>{body}</p>

          <div className={`${compact ? 'mt-3' : 'mt-6'} flex-1`} />

          <div
            className={`relative ${compact ? 'mt-1 pt-2.5 text-[12px]' : 'mt-2 pt-4 text-sm'} flex items-center justify-between border-t border-slate-200/70 font-semibold ${disabled ? 'text-rose-600' : 'text-slate-800'
              } ${rowDirection}`}
          >
            <span>{hint}</span>
            {!disabled ? (
              <span className={`transition-transform duration-300 group-hover:translate-x-1 ${arrowRotate}`}>
                →
              </span>
            ) : null}
          </div>
        </div>
      </Component>
    );
  };

  return (
    <div
      className={`relative overflow-hidden border border-white/70 bg-[rgba(248,250,252,0.78)] backdrop-blur-2xl ${panelClasses} ${className}`}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(255,255,255,0.82)_40%,rgba(248,250,252,0.72)_100%)]" />
        <div className="absolute -top-24 left-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.closeLabel}
          className={closeButtonClasses}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className={`relative z-10 ${textAlignClass}`}>
        <div className="max-w-3xl">
          <h2 className={headerTitleClasses}>
            {copy.title}
          </h2>

          <p className={headerBodyClasses}>
            {copy.subtitle}
          </p>
        </div>

        <div className={`${gridClasses} ${gridCols}`}>
          {registrationEnabled ? (
            <OptionCard
              as={Link}
              to="/auth/register"
              title={copy.joinTitle}
              body={copy.joinBody}
              hint={copy.joinHint}
              variant="primary"
              iconWrapClass="bg-primary text-white shadow-[0_12px_30px_rgba(59,130,246,0.28)]"
              icon={<UserCircle2 className="h-6 w-6" />}
            />
          ) : (
            <OptionCard
              title={copy.joinClosed}
              body={copy.joinClosedBody}
              hint={isRTL ? 'غير متاح الآن' : 'Unavailable right now'}
              disabled
              iconWrapClass="bg-rose-500 text-white shadow-[0_12px_30px_rgba(244,63,94,0.20)]"
              icon={<UserCircle2 className="h-6 w-6" />}
            />
          )}

          <OptionCard
            as={Link}
            to="/auth/login"
            title={copy.loginTitle}
            body={copy.loginBody}
            hint={copy.loginHint}
            iconWrapClass="bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
            icon={<LogIn className="h-6 w-6" />}
          />

          {onBrowse ? (
            <OptionCard
              as="button"
              onClick={onBrowse}
              title={copy.browseTitle}
              body={copy.browseBody}
              hint={copy.browseHint}
              iconWrapClass="bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.20)]"
              icon={<Globe className="h-6 w-6" />}
            />
          ) : (
            <OptionCard
              as="a"
              href="#about"
              title={copy.browseTitle}
              body={copy.browseBody}
              hint={copy.browseHint}
              iconWrapClass="bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.20)]"
              icon={<Globe className="h-6 w-6" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function GuestEntryOverlay({ isOpen, isRTL, registrationEnabled, onBrowse, onClose }) {
  const isMobile = useIsMobile();
  const panelRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-[rgba(2,6,23,0.55)] backdrop-blur-md"
      onPointerDown={(event) => {
        if (panelRef.current && !panelRef.current.contains(event.target)) onClose?.();
      }}
    >
      <div className="flex min-h-screen items-start justify-center px-4 py-6 sm:items-center sm:px-6 lg:px-8">
        <div ref={panelRef} className={`w-full ${isMobile ? 'max-w-[22rem]' : 'max-w-6xl'}`}>
          <GuestEntryPanel
            isRTL={isRTL}
            registrationEnabled={registrationEnabled}
            onBrowse={onBrowse}
            onClose={onClose}
            compact={isMobile}
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
}

export function translateDayLabel(day, t) {
  if (!day) return '';
  const key = `meetings.days.${day}`;
  const value = t(key);
  return value && value !== key ? value : day;
}

export function formatServiceTime(value, language) {
  if (!value || typeof value !== 'string') return '';
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return value;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  try {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  } catch (_e) {
    return value;
  }
}

export function formatExceptionDate(dateStr, language) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map((part) => parseInt(part, 10));
    const date = new Date(year, month - 1, day);
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (_e) {
    return dateStr;
  }
}

export function ServicePriestList({ priests, isRTL, t }) {
  if (!Array.isArray(priests) || priests.length === 0) return null;
  return (
    <div className={`mt-3 flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex flex-wrap items-center gap-1.5`}>
        {priests.map((priest, i) => (
          <span
            key={priest.id || `${priest.fullName}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary"
          >
            {priest.avatar?.url ? (
              <img src={priest.avatar.url} alt="" className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <UserCircle2 className="h-3.5 w-3.5" />
            )}
            <span className="text-heading/85">{priest.fullName}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SANCTUARY DESIGN PRIMITIVES — shared across the public site
   (landing, archive, meetings). Cinematic navy + antique gold.
   ════════════════════════════════════════════════════════════════ */
export const GOLD_TEXT = {
  backgroundImage: 'linear-gradient(180deg,#f0d792 0%,#d5ab55 48%,#a9791f 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};
export const NAVY_BAND = 'linear-gradient(160deg,#0c1c30 0%,#12293f 46%,#0a1626 100%)';

// A Coptic/Byzantine rounded-arch outline, drawn as a hairline.
export function ArchOutline({ className = '' }) {
  return (
    <svg viewBox="0 0 300 180" fill="none" preserveAspectRatio="xMidYMin meet" className={className} aria-hidden="true">
      <path
        d="M6 178 L6 92 C6 34 66 6 150 6 C234 6 294 34 294 92 L294 178"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Gold hairline divider with a small cross at its center.
export function GoldDivider({ light = false, className = '' }) {
  const line = light ? 'via-white/35' : 'via-secondary/45';
  const cross = light ? 'text-white/70' : 'text-secondary';
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className={`h-px w-14 bg-gradient-to-r from-transparent ${line} to-transparent`} />
      <Cross className={`h-3.5 w-3.5 ${cross}`} />
      <span className={`h-px w-14 bg-gradient-to-l from-transparent ${line} to-transparent`} />
    </div>
  );
}

// Centered section header — ceremonial display type + gold eyebrow + divider.
export function DesktopSectionHeader({ label, title, subtitle, tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <Reveal>
      <div className="mx-auto max-w-3xl text-center">
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] ${
              dark
                ? 'border-white/15 bg-white/[0.06] text-secondary'
                : 'border-secondary/25 bg-secondary/[0.08] text-secondary'
            }`}
          >
            <Cross className="h-3 w-3" />
            {label}
          </span>
        </div>
        <h2
          className={`font-display mt-6 text-3xl sm:text-4xl lg:text-[2.9rem] font-bold leading-[1.22] ${
            dark ? 'text-white' : 'text-heading'
          }`}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className={`mx-auto mt-4 max-w-2xl text-sm sm:text-base lg:text-lg leading-relaxed ${
              dark ? 'text-white/60' : 'text-muted'
            }`}
          >
            {subtitle}
          </p>
        ) : null}
        <GoldDivider light={dark} className="mt-7" />
      </div>
    </Reveal>
  );
}

// Cinematic navy hero band for interior public pages (archive, meetings).
export function SanctuaryPageHeader({ eyebrow, title, subtitle, icon: Icon = Cross }) {
  return (
    <section className="relative overflow-hidden text-white" style={{ background: NAVY_BAND }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <div className="absolute -top-24 -end-24 h-96 w-96 rounded-full bg-secondary/10 blur-[110px]" />
        <div className="absolute -bottom-24 -start-24 h-80 w-80 rounded-full bg-primary-light/10 blur-[90px]" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <ArchOutline className="mt-10 w-[460px] max-w-[72%] text-secondary/25" />
      </div>
      <div className="page-container relative pb-16 pt-36 text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-white/[0.06] px-5 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-secondary backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5" />
            {eyebrow}
          </span>
          <h1 className="font-display mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.2] text-white lg:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 lg:text-base">{subtitle}</p>
          ) : null}
          <GoldDivider light className="mt-7" />
        </Reveal>
      </div>
    </section>
  );
}
