import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  BookOpen, Clock3, Mail, MapPin, Phone, Quote, ShieldCheck, Sparkles, UserCircle2,
  Cross, Star, Globe, Navigation, ExternalLink, ChevronRight, ChevronLeft,
  Share2, Sun, Sunrise,
  CalendarClock, Images, Users,
} from 'lucide-react';
import {
  SOCIAL_META, useInView, AnimatedCounter, GuestEntryOverlay,
} from './LandingPage.shared';

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
function MobileHomeScreen({
  t,
  isRTL,
  priests,
  stats,
  verses,
  heroImageSrc,
  quickActionsData,
}) {
  const [statsRef, statsInView] = useInView(0.1);

  const quickActions = [
    { icon: MapPin, label: t('landing.mobile.quickActions.location'), color: 'text-blue-600', bg: 'bg-blue-500/10', href: '#' },
    { icon: Phone, label: t('landing.mobile.quickActions.call'), color: 'text-emerald-600', bg: 'bg-emerald-500/10', href: 'tel:+' },
    { icon: Mail, label: t('landing.mobile.quickActions.email'), color: 'text-amber-600', bg: 'bg-amber-500/10', href: 'mailto:' },
    { icon: Clock3, label: t('landing.mobile.quickActions.hours'), color: 'text-rose-600', bg: 'bg-rose-500/10', href: '#' },
  ];
  const renderedQuickActions = quickActionsData || quickActions;

  const lifeItems = [
    { icon: ShieldCheck, title: t('landing.life.items.one.title'), desc: t('landing.life.items.one.description'), gradient: 'from-blue-500 to-indigo-600', num: '01' },
    { icon: BookOpen, title: t('landing.life.items.two.title'), desc: t('landing.life.items.two.description'), gradient: 'from-amber-500 to-orange-600', num: '02' },
    { icon: Sparkles, title: t('landing.life.items.three.title'), desc: t('landing.life.items.three.description'), gradient: 'from-rose-500 to-pink-600', num: '03' },
  ];

  return (
    <div className="pb-6">
      {/* ── Church hero banner ── */}
      <div className="relative mx-3 mt-3 rounded-[1.5rem] overflow-hidden" style={{ height: 220 }}>
        <img
          src={heroImageSrc || '/images/church.webp'}
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
          <p className="mt-2 text-[11px] leading-relaxed text-white/80">
            {t('landing.hero.description')}
          </p>
        </div>
      </div>


      {/* ── Quick action grid — full width 2×2 ── */}
      <div className="px-3 mt-3 grid grid-cols-4 gap-2">
        {renderedQuickActions.map((action, index) => {
          const content = (
            <>
              <div className={`w-8 h-8 rounded-xl bg-white/60 dark:bg-surface/60 flex items-center justify-center ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-bold ${action.color}`}>{action.label}</span>
            </>
          );

          if (typeof action.onClick === 'function') {
            return (
              <button
                key={index}
                type="button"
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl ${action.bg} active:scale-95 transition-transform`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {content}
              </button>
            );
          }

          return (
            <a
              key={index}
              href={action.href}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noopener noreferrer' : undefined}
              className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl ${action.bg} active:scale-95 transition-transform`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {content}
            </a>
          );
        })}
      </div>

      {/* ── Archive + Meetings entry tiles ── */}
      <div className="px-3 mt-3 grid grid-cols-2 gap-2">
        <Link
          to="/archive"
          className={`relative overflow-hidden rounded-2xl border border-border bg-surface p-4 flex items-center gap-3 active:scale-[0.98] transition-transform ${isRTL ? 'flex-row-reverse text-right' : ''}`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Images className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-heading leading-tight">{t('publicLayout.archive')}</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed line-clamp-1">{t('landing.archive.label')}</p>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
        <Link
          to="/meetings"
          className={`relative overflow-hidden rounded-2xl border border-border bg-surface p-4 flex items-center gap-3 active:scale-[0.98] transition-transform ${isRTL ? 'flex-row-reverse text-right' : ''}`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-heading leading-tight">{t('publicLayout.meetings')}</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed line-clamp-1">{t('landing.meetings.label')}</p>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
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
    <div className="pb-6">
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
   SERVICES UTILITIES
   ══════════════════════════════════════════════════════ */
function translateDayLabel(day, t) {
  if (!day) return '';
  const key = `meetings.days.${day}`;
  const value = t(key);
  return value && value !== key ? value : day;
}

function formatServiceTime(value, language) {
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

function formatExceptionDate(dateStr, language) {
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

function ServicePriestList({ priests, isRTL, t }) {
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

function ServiceTimeRow({ entry, language, t, isRTL, accent }) {
  const start = formatServiceTime(entry.startTime, language);
  const end = formatServiceTime(entry.endTime, language);
  const sep = t('landing.services.timeSeparator');

  const dayLabel = entry.dayOfWeek
    ? translateDayLabel(entry.dayOfWeek, t)
    : entry.displayName;

  const serviceName = entry.name || entry.displayName;
  const hasSecondaryName =
    entry.dayOfWeek && entry.displayName && entry.displayName !== entry.name;

  return (
    <div
      className={[
        'group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-surface/95',
        'px-5 py-5 shadow-card transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl',
        isRTL ? 'text-right' : 'text-left',
      ].join(' ')}
    >
      {/* side accent */}
      <div
        className={`absolute inset-y-0 ${isRTL ? 'right-0' : 'left-0'
          } w-1.5 bg-gradient-to-b ${accent}`}
      />

      {/* soft background glow */}
      <div
        className={`pointer-events-none absolute -top-16 ${isRTL ? '-left-16' : '-right-16'
          } h-36 w-36 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-90`}
      />

      <div
        className={[
          'relative grid gap-5',
          'sm:grid-cols-[1fr_auto_1.35fr]',
          isRTL ? 'sm:[direction:ltr]' : '',
        ].join(' ')}
      >
        {/* details */}
        <div
          className={[
            'flex min-w-0 flex-col justify-center',
            isRTL ? 'sm:[direction:rtl]' : '',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xl font-black leading-tight text-heading">
                {dayLabel}
              </p>

              {hasSecondaryName ? (
                <p className="mt-1 truncate text-sm font-semibold text-muted">
                  {serviceName}
                </p>
              ) : null}
            </div>

            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-surface-alt text-primary shadow-sm ring-1 ring-border/70">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-end gap-2" dir="ltr">
            <span className="text-5xl font-black leading-none tracking-tight text-primary">
              {start || '—'}
            </span>

            {end ? (
              <span className="pb-1 text-xs font-bold text-muted">
                {sep} {end}
              </span>
            ) : null}
          </div>

          <div className="mt-5">
            <ServicePriestList priests={entry.priests} isRTL={isRTL} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UpcomingExceptionCard({ entry, language, t, isRTL }) {
  const start = formatServiceTime(entry.startTime, language);
  const end = formatServiceTime(entry.endTime, language);
  const sep = t('landing.services.timeSeparator');
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 via-amber-500/3 to-transparent p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} text-amber-500/15`}>
        <CalendarClock className="h-12 w-12" />
      </div>
      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
          <Star className="h-4 w-4 text-white fill-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-heading leading-tight">{entry.displayName}</p>
          <p className="mt-0.5 text-[11px] text-muted leading-relaxed">{formatExceptionDate(entry.date, language)}</p>
          <p className="mt-1 text-[12px] font-bold text-amber-600 tracking-wide" dir="ltr">
            {start}
            {end ? ` ${sep} ${end}` : ''}
          </p>
          <ServicePriestList priests={entry.priests} isRTL={isRTL} t={t} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE SERVICES SCREEN
   ══════════════════════════════════════════════════════ */
function MobileServicesScreen({ t, isRTL, language, schedule, isLoading }) {
  const ta = isRTL ? 'text-right' : 'text-left';
  const liturgies = schedule?.recurringDivineLiturgies || [];
  const vespers = schedule?.recurringVespers || [];
  const upcoming = schedule?.exceptionalDivineLiturgies || [];

  return (
    <div className="pb-6">
      <div className={`px-5 pt-0 pb-3 ${ta}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.services.label')}</p>
        <h1 className="text-2xl font-black text-heading tracking-tight mt-0.5">{t('landing.services.title')}</h1>
        <p className="mt-1.5 text-[11px] text-muted leading-relaxed">{t('landing.services.subtitle')}</p>
      </div>

      <div className="px-3 space-y-6 mt-2">
        {/* Divine Liturgies */}
        <div>
          <div className={`flex items-center gap-2 px-2 mb-2 `}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg shadow-sm">
              <Sun className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-[13px] font-black text-heading uppercase tracking-wider">{t('landing.services.liturgies')}</h2>
          </div>
          {isLoading ? (
            <div className={`bg-surface border border-border rounded-2xl p-5 ${ta}`}>
              <p className="text-sm text-muted">{t('landing.services.loading')}</p>
            </div>
          ) : liturgies.length === 0 ? (
            <div className={`bg-surface border border-dashed border-border rounded-2xl p-5 ${ta}`}>
              <p className="text-sm text-muted">{t('landing.services.empty')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {liturgies.map((entry) => (
                <ServiceTimeRow
                  key={entry.id}
                  entry={entry}
                  language={language}
                  t={t}
                  isRTL={isRTL}
                  accent="from-primary to-primary-dark"
                />
              ))}
            </div>
          )}
        </div>

        {/* Vespers */}
        <div>
          <div className={`flex items-center gap-2 px-2 mb-2`}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg  shadow-sm">
              <Sunrise className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-[13px] font-black text-heading uppercase tracking-wider">{t('landing.services.vespers')}</h2>
          </div>
          {isLoading ? (
            <div className={`bg-surface border border-border rounded-2xl p-5 ${ta}`}>
              <p className="text-sm text-muted">{t('landing.services.loading')}</p>
            </div>
          ) : vespers.length === 0 ? (
            <div className={`bg-surface border border-dashed border-border rounded-2xl p-5 ${ta}`}>
              <p className="text-sm text-muted">{t('landing.services.emptyVespers')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vespers.map((entry) => (
                <ServiceTimeRow
                  key={entry.id}
                  entry={entry}
                  language={language}
                  t={t}
                  isRTL={isRTL}
                  accent="from-indigo-500 to-purple-600"
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming exceptional services */}
        {upcoming.length > 0 ? (
          <div>
            <div className={`flex items-center gap-2 px-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
                <CalendarClock className="h-3.5 w-3.5 text-white" />
              </div>
              <h2 className="text-[13px] font-black text-heading uppercase tracking-wider">{t('landing.services.upcoming')}</h2>
            </div>
            <div className="space-y-2">
              {upcoming.map((entry) => (
                <UpcomingExceptionCard
                  key={entry.id}
                  entry={entry}
                  language={language}
                  t={t}
                  isRTL={isRTL}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOBILE VISIT SCREEN
   ══════════════════════════════════════════════════════ */
function MobileVisitScreen({ t, isRTL, contacts, churchPlaceName, churchPlusCode, churchAddressLine, locationMapEmbedUrl, directionsUrl, verses, locationDirectionsLabel }) {
  const ta = isRTL ? 'text-right' : 'text-left';
  const managedLocationMetaLine = [churchPlusCode, churchAddressLine].filter(Boolean).join(' | ');
  return (
    <div className="pb-6">
      <div className={`px-5 pt-0 pb-3 ${ta}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.visit.label')}</p>
        <h1 className="text-2xl font-black text-heading tracking-tight mt-0.5">{t('landing.visit.title')}</h1>
      </div>
      <div className="px-3 space-y-2.5">
        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-border bg-surface">
          <div className="h-52 relative">
            <iframe title={t('landing.location.title')} src={locationMapEmbedUrl} className="h-full w-full border-0" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className={`p-4 border-t border-border ${ta}`}>
            <p className="text-xs font-extrabold text-heading">{churchPlaceName}</p>
            {managedLocationMetaLine ? (
              <p className="text-[10px] text-muted mt-0.5">{managedLocationMetaLine}</p>
            ) : null}
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
              <button className="w-full bg-primary text-white text-xs font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <ExternalLink className="h-3.5 w-3.5" />
                {locationDirectionsLabel}
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
function MobileSocialScreen({ t, isRTL, socialLinks = [] }) {
  const ta = isRTL ? 'text-right' : 'text-left';
  const socials = (socialLinks || [])
    .filter((entry) => entry?.enabled && entry?.url && SOCIAL_META[entry.platform])
    .map((entry) => {
      const meta = SOCIAL_META[entry.platform];
      return {
        ...meta,
        icon: meta.icon,
        name: t(`landing.social.items.${entry.platform}.name`),
        handle: entry.handle || entry.url.replace(/^https?:\/\//, ''),
        url: entry.url,
        desc: t(`landing.social.items.${entry.platform}.description`),
      };
    });

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('publicLayout.brandPrimary'),
          url: window.location.href,
        });
        return;
      }

      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch (_error) {
      // Ignore cancelled share attempts.
    }
  };

  return (
    <div className="pb-6">
      <div className={`px-5 pt-0 pb-3 ${ta}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('landing.social.label')}</p>
        <h1 className="text-2xl font-black text-heading tracking-tight mt-0.5">{t('landing.social.title')}</h1>
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
              {/* <p className="text-[11px] text-muted mt-0.5">{s.handle}</p> */}
              <p className="text-[10px] text-muted/70 mt-0.5">{s.desc}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted flex-shrink-0" />
          </a>
        ))}
        <a
          href="https://josam-portfolio.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-4 p-4 rounded-2xl border active:scale-[0.98] transition-transform duration-150 ${isRTL ? "flex-row-reverse text-right" : ""
            }`}
          style={{
            background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
            borderColor: "#bbf7d0",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden"
            style={{ backgroundColor: "#15803d" }}
          >
            <img
              src="/images/me.jpg"
              alt={t('landing.social.items.portfolio.alt')}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-heading">
              {t('landing.social.items.portfolio.name')}
            </p>

            {/* <p className="text-[11px] text-muted mt-0.5">
              {t('landing.social.items.portfolio.handle')}
            </p> */}

            <p className="text-[10px] text-muted/70 mt-0.5">
              {t('landing.social.items.portfolio.description')}
            </p>
          </div>

          <ExternalLink className="h-4 w-4 text-muted flex-shrink-0" />
        </a>
        {/* Share card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-primary p-5">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full bg-white/5 pointer-events-none" />
          <p className={`text-white/60 text-[10px] font-black uppercase tracking-widest ${ta}`}>{t('landing.social.shareLabel')}</p>
          <p className={`text-white font-extrabold text-base mt-1 leading-tight ${ta}`}>{t('landing.social.shareTitle')}</p>
          <button
            onClick={handleShare}
            className={`mt-3 bg-white/15 border border-white/20 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 active:scale-95 transition-transform ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Share2 className="h-3.5 w-3.5" />{t('landing.social.shareButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LandingMobilePage({
  t,
  isRTL,
  language,
  toggleLanguage,
  isAuthenticated,
  guestEntryOpen,
  setGuestEntryOpen,
  registrationEnabled,
  priests,
  stats,
  verses,
  heroImageSrc,
  schedule,
  isScheduleLoading,
  contacts,
  churchPlaceName,
  churchPlusCode,
  churchAddressLine,
  locationMapEmbedUrl,
  directionsUrl,
  locationDirectionsLabel,
  socialLinks,
  phoneValue,
  emailValue,
}) {
  // Which screen is shown is driven by the URL, so the single bottom tab bar in
  // PublicLayout (route-based) controls this page just like any other page.
  const location = useLocation();
  const navigate = useNavigate();
  const ROUTE_TO_TAB = { '/': 'home', '/services': 'services', '/visit': 'visit', '/social': 'social', '/about': 'about' };
  const TAB_TO_ROUTE = { home: '/', services: '/services', visit: '/visit', social: '/social', about: '/about' };
  const activeTab = ROUTE_TO_TAB[location.pathname] || 'home';
  const setActiveTab = (tab) => navigate(TAB_TO_ROUTE[tab] || '/');

  const mobileQuickActions = [
    { icon: MapPin, label: t('landing.mobile.quickActions.location'), color: 'text-blue-600', bg: 'bg-blue-500/10', onClick: () => setActiveTab('visit') },
    { icon: Phone, label: t('landing.mobile.quickActions.call'), color: 'text-emerald-600', bg: 'bg-emerald-500/10', href: phoneValue ? `tel:${phoneValue}` : '#', external: false },
    { icon: Mail, label: t('landing.mobile.quickActions.email'), color: 'text-amber-600', bg: 'bg-amber-500/10', href: emailValue ? `mailto:${emailValue}` : '#', external: false },
    { icon: Clock3, label: t('landing.mobile.quickActions.hours'), color: 'text-rose-600', bg: 'bg-rose-500/10', onClick: () => setActiveTab('visit') },
  ];

  return (
    <div className="bg-page mt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div key={activeTab} style={{ animation: 'appIn 0.2s ease' }}>
        {activeTab === 'home' && (
          <MobileHomeScreen
            t={t}
            isRTL={isRTL}
            priests={priests}
            stats={stats}
            verses={verses}
            heroImageSrc={heroImageSrc}
            quickActionsData={mobileQuickActions}
          />
        )}
        {activeTab === 'about' && <MobileAboutScreen t={t} isRTL={isRTL} />}
        {activeTab === 'services' && (
          <MobileServicesScreen
            t={t}
            isRTL={isRTL}
            language={language}
            schedule={schedule}
            isLoading={isScheduleLoading}
          />
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
            verses={verses}
            locationDirectionsLabel={locationDirectionsLabel}
          />
        )}
        {activeTab === 'social' && <MobileSocialScreen t={t} isRTL={isRTL} socialLinks={socialLinks} />}
      </div>
      <GuestEntryOverlay
        isOpen={!isAuthenticated && guestEntryOpen}
        isRTL={isRTL}
        registrationEnabled={registrationEnabled}
        onBrowse={() => setGuestEntryOpen(false)}
        onClose={() => setGuestEntryOpen(false)}
      />
      <style>{`
        @keyframes appIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}
