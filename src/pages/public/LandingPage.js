import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, BookOpen, Church, Clock3, Heart, HandHeart,
  Mail, MapPin, Phone, Quote, ShieldCheck, Sparkles, Users, UserCircle2,
  Cross, Star, Globe, Navigation, ExternalLink, CalendarClock, Library,
  ChevronDown,
} from 'lucide-react';
import { settingsApi, divineLiturgiesApi, archiveApi, meetingsApi } from '../../api/endpoints';
import { useAuth } from '../../auth/auth.hooks';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/i18n';
import { useLandingPublicContent } from '../../hooks/useLandingContent';
import { getLocalizedValue } from '../../utils/landingContent';
import LandingMobilePage from './LandingMobilePage';
import {
  DEFAULT_DIRECTIONS_URL, buildDefaultMapEmbedUrl, useInView, useParallax,
  useIsMobile, Reveal, StaggerChildren, AnimatedCounter,
  GuestEntryOverlay, translateDayLabel, formatServiceTime, formatExceptionDate,
  ServicePriestList,
  GOLD_TEXT, NAVY_BAND, ArchOutline, GoldDivider, DesktopSectionHeader,
} from './LandingPage.shared';

/* ────────────────────────────────────────────────────────────────
   SECTION ROUTING — the landing is one scrolling page, but each section
   is addressable as a clean URL (/about, /priests, …) instead of a #hash.
   These paths must have matching <section id="…"> anchors + router entries.
   ──────────────────────────────────────────────────────────────── */
const LANDING_SECTION_PATHS = ['about', 'priests', 'services', 'visit', 'location'];
const LANDING_HEADER_OFFSET = 80; // fixed header height to offset scroll targets

function sectionIdFromPath(pathname) {
  const seg = String(pathname || '').replace(/^\/+|\/+$/g, '').split('/')[0];
  return LANDING_SECTION_PATHS.includes(seg) ? seg : null;
}

/* ════════════════════════════════════════════════════════════════
   SANCTUARY DESIGN LANGUAGE — cinematic navy + antique gold, Tajawal display
   ════════════════════════════════════════════════════════════════ */
/* GOLD_TEXT, NAVY_BAND, ArchOutline, GoldDivider, DesktopSectionHeader are
   imported from ./LandingPage.shared (see import block above). */

/* ════════════════════════════════
   HERO — clergy deck (echoes the mobile stacked carousel) + next-liturgy card
   ════════════════════════════════ */
function HeroPriestPortrait({ priest, isCenter }) {
  const [err, setErr] = useState(false);
  const hasImg = Boolean(priest.image) && !err;
  return (
    <div className="relative w-full">
      <div
        className={`pointer-events-none absolute -inset-2 rounded-t-[5.5rem] rounded-b-[1.5rem] bg-gradient-to-b from-secondary/30 via-secondary/5 to-transparent blur-lg transition-opacity duration-500 ${isCenter ? 'opacity-100' : 'opacity-0'
          }`}
      />
      <div className="relative overflow-hidden rounded-t-[5rem] rounded-b-[1.4rem] border border-secondary/30 bg-gradient-to-b from-[#15273c] to-[#0c1a2b] shadow-2xl shadow-black/50">
        <div className="relative aspect-[3/4] w-full">
          {hasImg ? (
            <img
              src={priest.image}
              alt={priest.alt}
              loading="lazy"
              onError={() => setErr(true)}
              className="absolute inset-0 h-full w-full object-cover object-top pt-4"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-secondary/30">
              <UserCircle2 className="h-20 w-20" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#07121f] via-[#07121f]/65 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-center">
            <span className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-black/30 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-secondary backdrop-blur-sm">
              <Star className="h-2 w-2 fill-current" />
              {priest.role}
            </span>
            <p className="font-display mt-1.5 text-sm font-bold leading-tight text-white">{priest.name}</p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-1.5 rounded-t-[4.5rem] rounded-b-[1.1rem] border border-secondary/20" />
      </div>
      <div className="absolute -top-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-secondary/40 bg-secondary text-white shadow-lg">
        <Cross className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function HeroClergyDeck({ priests, eyebrow }) {
  const list = Array.isArray(priests) ? priests.filter((p) => p && p.name) : [];
  const total = list.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (total <= 1 || paused) return undefined;
    const id = setInterval(() => setActive((p) => (p + 1) % total), 4500);
    return () => clearInterval(id);
  }, [total, paused]);

  if (!total) return null;

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <ArchOutline className="mt-1 w-[360px] max-w-[86%] text-secondary/15" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[90px]" />

      {eyebrow ? (
        <div className="relative mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-white/[0.05] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-secondary backdrop-blur-sm">
            {/* <Cross className="h-3 w-3" /> */}
            {eyebrow}
          </span>
        </div>
      ) : null}

      <div
        className="relative flex h-[380px] items-center justify-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {list.map((priest, i) => {
          const diff = (i - active + total) % total;
          const isCenter = diff === 0;
          const isRight = diff === 1 && total > 1;
          const isLeft = diff === total - 1 && total > 2;
          if (!isCenter && !isRight && !isLeft) return null;

          let style;
          if (isCenter) {
            style = { zIndex: 20, opacity: 1, transform: 'translateX(0) rotate(0deg) scale(1)', filter: 'none' };
          } else if (isLeft) {
            style = { zIndex: 10, opacity: 0.5, transform: 'translateX(-44%) rotate(-7deg) scale(0.82)', transformOrigin: 'bottom right', filter: 'brightness(0.6)' };
          } else {
            style = { zIndex: 10, opacity: 0.5, transform: 'translateX(44%) rotate(7deg) scale(0.82)', transformOrigin: 'bottom left', filter: 'brightness(0.6)' };
          }

          return (
            <div
              key={priest.name || i}
              onClick={() => !isCenter && setActive(i)}
              className={`absolute w-[280px] ${isCenter ? '' : 'cursor-pointer'}`}
              style={{ transition: 'all 0.6s cubic-bezier(0.34,1.1,0.64,1)', ...style }}
            >
              <HeroPriestPortrait priest={priest} isCenter={isCenter} />
            </div>
          );
        })}
      </div>

      {total > 1 ? (
        <div className="relative mt-6 flex items-center justify-center gap-2">
          {list.map((_, i) => (
            <button key={i} type="button" onClick={() => setActive(i)} aria-label={`clergy ${i + 1}`}>
              <span className={`block rounded-full transition-all duration-300 ${i === active ? 'h-2 w-6 bg-secondary' : 'h-2 w-2 bg-white/25 hover:bg-white/50'}`} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HeroNextLiturgy({ service, label }) {
  if (!service) return null;
  return (
    <div className="group inline-flex max-w-full items-stretch gap-3 rounded-2xl border border-white/12 bg-[#0e1d2f]/70 p-2.5 text-start shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 hover:border-secondary/30">
      {service.timeText ? (
        <div className="flex min-w-[104px] flex-col items-center justify-center rounded-xl border border-secondary/25 bg-gradient-to-b from-secondary/[0.14] to-secondary/[0.04] px-4 py-3 text-center">
          <CalendarClock className="mb-1 h-4 w-4 text-secondary" />
          <span dir="ltr" className="font-display text-lg font-bold leading-tight text-white">
            {service.timeText}
          </span>
        </div>
      ) : null}
      <div className="flex min-w-0 max-w-[240px] flex-col justify-center px-1 pe-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">{label}</span>
        </div>
        <h3 className="font-display mt-1 truncate text-base font-bold leading-tight text-white">{service.title}</h3>
        {service.dateText ? <p className="mt-0.5 truncate text-xs text-white/55">{service.dateText}</p> : null}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   CLERGY — icon-style arched portraits
   ════════════════════════════════ */
function DesktopPriestCard({ priest, isRTL, index }) {
  const [err, setErr] = useState(false);
  const hasImg = Boolean(priest.image) && !err;
  return (
    <Reveal delay={index * 0.12}>
      <div className="group relative flex flex-col items-center text-center">
        {/* Arched portrait frame */}
        <div className="relative w-full max-w-[280px]">
          <div className="pointer-events-none absolute -inset-3 rounded-t-[8rem] rounded-b-[1.75rem] bg-gradient-to-b from-secondary/25 via-secondary/5 to-transparent opacity-0 blur-md transition-opacity duration-700 group-hover:opacity-100" />
          <div
            className="relative overflow-hidden rounded-t-[7rem] rounded-b-[1.75rem] border border-secondary/30 bg-gradient-to-b from-primary/12 via-surface to-surface shadow-lg shadow-primary/10 transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-primary/15"
          >
            <div className="relative aspect-[3/4] w-full">
              {hasImg ? (
                <img
                  src={priest.image}
                  alt={priest.alt}
                  loading="lazy"
                  onError={() => setErr(true)}
                  className="absolute inset-0 h-full w-full pt-4 object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-secondary/10 blur-2xl" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-secondary/25 bg-gradient-to-br from-primary/12 to-primary/4 text-primary/40">
                      <UserCircle2 className="h-16 w-16" />
                    </div>
                  </div>
                </div>
              )}
              {/* soft bottom fade for legibility */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
            {/* inner hairline frame */}
            <div className="pointer-events-none absolute inset-2 rounded-t-[6.4rem] rounded-b-[1.4rem] border border-secondary/25" />
          </div>
          {/* apex cross medallion */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-secondary/40 bg-secondary text-white shadow-md">
            <Cross className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
            <Star className="h-2.5 w-2.5 fill-current" />
            {priest.role}
          </span>
          <h3 className="font-display mt-3 text-xl font-bold leading-tight text-heading">{priest.name}</h3>
          {priest.bio ? (
            <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-muted line-clamp-3">{priest.bio}</p>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
}

/* ══════════════════════════════════════════════════════
   SERVICES — weekly service board
   ══════════════════════════════════════════════════════ */
function DesktopServiceCard({ entry, language, t, isRTL, accent, index }) {
  const start = formatServiceTime(entry.startTime, language);
  const end = formatServiceTime(entry.endTime, language);
  const sep = t('landing.services.timeSeparator');
  const title = entry.dayOfWeek ? translateDayLabel(entry.dayOfWeek, t) : entry.displayName;

  return (
    <Reveal delay={index * 0.06}>
      <article
        className={`group relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-lg hover:shadow-primary/5 ${isRTL ? 'text-right' : 'text-left'
          }`}
      >
        <div className={`flex h-full gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`mt-1 h-full w-1 flex-shrink-0 rounded-full bg-gradient-to-b ${accent}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold leading-tight text-heading">{title}</h3>
                {entry.dayOfWeek && entry.name ? (
                  <p className="mt-1 text-sm leading-5 text-muted">{entry.name}</p>
                ) : null}
              </div>
              <div
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/[0.08] px-3 py-1 text-sm font-bold text-secondary"
                dir="ltr"
              >
                <Clock3 className="h-3.5 w-3.5" />
                <span>
                  {start}
                  {end ? ` ${sep} ${end}` : ''}
                </span>
              </div>
            </div>
            {Array.isArray(entry.priests) && entry.priests.length > 0 ? (
              <div className="mt-4 border-t border-border/70 pt-4">
                <ServicePriestList priests={entry.priests} isRTL={isRTL} t={t} />
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function DesktopUpcomingExceptionCard({ entry, language, t, isRTL, index }) {
  const start = formatServiceTime(entry.startTime, language);
  const end = formatServiceTime(entry.endTime, language);
  const sep = t('landing.services.timeSeparator');
  return (
    <Reveal delay={index * 0.06}>
      <div
        className={`group relative h-full overflow-hidden rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/[0.1] via-secondary/[0.04] to-transparent p-6 transition-all duration-500 hover:shadow-xl hover:shadow-secondary/10 ${isRTL ? 'text-right' : 'text-left'
          }`}
      >
        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-secondary/15`}>
          <CalendarClock className="h-16 w-16" />
        </div>
        <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-[#8a5f16] shadow-lg">
            <Star className="h-5 w-5 fill-white text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold leading-tight text-heading">{entry.displayName}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{formatExceptionDate(entry.date, language)}</p>
            <p className="mt-2 text-sm font-bold tracking-wide text-secondary" dir="ltr">
              {start}
              {end ? ` ${sep} ${end}` : ''}
            </p>
            <ServicePriestList priests={entry.priests} isRTL={isRTL} t={t} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function DesktopServiceGroup({ title, icon: Icon, children }) {
  return (
    <div className="mt-12">
      <Reveal>
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-secondary/40" />
          <div className="flex items-center gap-2 text-secondary">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <h3 className="font-display text-lg font-bold tracking-wide text-heading">{title}</h3>
          </div>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-secondary/40" />
        </div>
      </Reveal>
      {children}
    </div>
  );
}

/* Next-occurrence helpers — used to pick the single upcoming Divine Liturgy that
   headlines the featured card. Recurring entries carry a capitalized weekday
   (JS getDay() order); exceptional entries carry a concrete `date` (YYYY-MM-DD). */
const DL_DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function parseHourMinute(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value || ''));
  return match ? [parseInt(match[1], 10), parseInt(match[2], 10)] : [0, 0];
}

function nextLiturgyMs(entry, now) {
  const [hh, mm] = parseHourMinute(entry.startTime);
  if (entry.date) {
    const [y, m, d] = String(entry.date).split('-').map((n) => parseInt(n, 10));
    if (!y || !m || !d) return Infinity;
    return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  }
  const dow = DL_DAY_INDEX[entry.dayOfWeek];
  if (dow == null) return Infinity;
  const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  let diff = (dow - dt.getDay() + 7) % 7;
  if (diff === 0 && dt.getTime() <= now.getTime()) diff = 7; // already passed today → next week
  dt.setDate(dt.getDate() + diff);
  return dt.getTime();
}

/* Featured "upcoming Divine Liturgy" — the tall hero card of the liturgies grid,
   carrying the next service's details plus a verse inviting people to attend. */
function DesktopFeaturedLiturgyCard({ entry, dateParts, language, t, isRTL }) {
  const isException = Boolean(entry.date);
  const title = isException ? entry.displayName : translateDayLabel(entry.dayOfWeek, t);
  const start = formatServiceTime(entry.startTime, language);
  const end = formatServiceTime(entry.endTime, language);
  const sep = t('landing.services.timeSeparator');
  const eyebrow = isRTL ? 'القداس القادم' : 'Next Divine Liturgy';
  const fullDate = dateParts ? [dateParts.day, dateParts.month, dateParts.year].filter(Boolean).join(' ') : '';
  const priests = Array.isArray(entry.priests) ? entry.priests : [];
  const verse = isRTL
    ? { text: '«فَرِحْتُ بِالْقَائِلِينَ لِي: إِلَى بَيْتِ الرَّبِّ نَذْهَبُ»', ref: 'مزمور ١٢٢: ١' }
    : { text: '“I was glad when they said unto me, Let us go into the house of the Lord.”', ref: 'Psalm 122:1' };

  return (
    <Reveal>
      <article
        className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-secondary/30 p-7 text-white shadow-2xl shadow-primary/20 ${isRTL ? 'text-right' : 'text-left'}`}
        style={{ background: NAVY_BAND }}
      >
        <div className="relative flex h-full flex-col">
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-secondary">{eyebrow}</span>
          </div>

          <h3 className="font-display mt-4 text-3xl font-bold leading-tight text-white lg:text-4xl">{title}</h3>
          {!isException && entry.name ? <p className="mt-1.5 text-sm text-white/60">{entry.name}</p> : null}

          {/* Date + time — understated detail rows */}
          <div className={`mt-6 space-y-2.5 ${isRTL ? 'text-right' : 'text-left'}`}>
            {fullDate ? (
              <div className="flex items-center gap-2.5">
                <CalendarClock className="h-4 w-4 shrink-0 text-secondary/90" />
                <span className="text-[15px] font-semibold text-white/90">{fullDate}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-2.5">
              <Clock3 className="h-4 w-4 shrink-0 text-secondary/90" />
              <span dir="ltr" className="text-[15px] font-semibold text-white/90">
                {start}
                {end ? ` ${sep} ${end}` : ''}
              </span>
            </div>
          </div>

          <GoldDivider light className="mt-7 mb-6" />

          <figure>
            <Quote className={`h-6 w-6 text-secondary/40 ${isRTL ? 'ms-auto' : ''}`} />
            <blockquote className="font-display mt-2 text-lg font-bold leading-relaxed text-white/95">
              {verse.text}
            </blockquote>
            <figcaption className={`mt-3 flex items-center gap-2 text-xs font-bold text-secondary ${isRTL ? 'flex-row-reverse' : ''}`}>
              <BookOpen className="h-3.5 w-3.5" />
              {verse.ref}
            </figcaption>
          </figure>
        </div>
      </article>
    </Reveal>
  );
}

function DesktopServicesSection({ t, isRTL, language, schedule, isLoading }) {
  const liturgies = schedule?.recurringDivineLiturgies || [];
  const vespers = schedule?.recurringVespers || [];
  const upcoming = schedule?.exceptionalDivineLiturgies || [];

  /* Pick the single soonest liturgy (recurring or exceptional) to headline the
     featured card, and drop it from the remaining grids to avoid duplication. */
  const featuredInfo = (() => {
    if (isLoading) return null;
    const now = new Date();
    const ranked = [...upcoming, ...liturgies]
      .map((e) => ({ e, ms: nextLiturgyMs(e, now) }))
      .filter((c) => Number.isFinite(c.ms) && c.ms >= now.getTime() - 6 * 3600 * 1000)
      .sort((a, b) => a.ms - b.ms);
    if (!ranked.length) return null;
    const { e, ms } = ranked[0];
    const d = new Date(ms);
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    let dateParts = { day: '', month: '', year: '', weekday: '' };
    try {
      const parts = new Intl.DateTimeFormat(locale, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }).formatToParts(d);
      const get = (tp) => (parts.find((x) => x.type === tp) || {}).value || '';
      dateParts = { day: get('day'), month: get('month'), year: get('year'), weekday: get('weekday') };
    } catch (_e) { /* Intl unavailable — leave blanks */ }
    return { entry: e, dateParts };
  })();
  const featuredId = featuredInfo?.entry?.id;
  const restLiturgies = featuredId ? liturgies.filter((e) => e.id !== featuredId) : liturgies;
  const restUpcoming = featuredId ? upcoming.filter((e) => e.id !== featuredId) : upcoming;

  const emptyBox = (msg) => (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
      <p className="text-sm text-muted">{msg}</p>
    </div>
  );

  return (
    <section id="services" className="relative overflow-hidden py-24 lg:py-32 bg-surface-alt">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 -end-32 h-[380px] w-[380px] rounded-full bg-primary/[0.05] blur-[140px]" />
        <div className="absolute bottom-1/4 -start-32 h-[340px] w-[340px] rounded-full bg-secondary/[0.05] blur-[140px]" />
      </div>
      <div className="page-container relative">
        <DesktopSectionHeader
          label={t('landing.services.label')}
          title={t('landing.services.title')}
          subtitle={t('landing.services.subtitle')}
        />

        <DesktopServiceGroup title={t('landing.services.liturgies')} icon={Church}>
          {isLoading
            ? emptyBox(t('landing.services.loading'))
            : liturgies.length === 0 && upcoming.length === 0
              ? emptyBox(t('landing.services.empty'))
              : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 lg:items-start">
                  {featuredInfo ? (
                    <div className="lg:col-span-1">
                      <DesktopFeaturedLiturgyCard
                        entry={featuredInfo.entry}
                        dateParts={featuredInfo.dateParts}
                        language={language}
                        t={t}
                        isRTL={isRTL}
                      />
                    </div>
                  ) : null}
                  {restLiturgies.length ? (
                    <div
                      className={`grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 ${featuredInfo ? 'lg:col-span-2' : 'lg:col-span-3'}`}
                    >
                      {restLiturgies.map((entry, i) => (
                        <DesktopServiceCard
                          key={entry.id}
                          entry={entry}
                          language={language}
                          t={t}
                          isRTL={isRTL}
                          accent="from-secondary to-[#8a5f16]"
                          index={i}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
        </DesktopServiceGroup>

        <DesktopServiceGroup title={t('landing.services.vespers')} icon={Clock3}>
          {isLoading
            ? emptyBox(t('landing.services.loading'))
            : vespers.length === 0
              ? emptyBox(t('landing.services.emptyVespers'))
              : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {vespers.map((entry, i) => (
                    <DesktopServiceCard
                      key={entry.id}
                      entry={entry}
                      language={language}
                      t={t}
                      isRTL={isRTL}
                      accent="from-primary to-primary-light"
                      index={i}
                    />
                  ))}
                </div>
              )}
        </DesktopServiceGroup>

        {restUpcoming.length > 0 ? (
          <DesktopServiceGroup title={t('landing.services.upcoming')} icon={CalendarClock}>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {restUpcoming.map((entry, i) => (
                <DesktopUpcomingExceptionCard
                  key={entry.id}
                  entry={entry}
                  language={language}
                  t={t}
                  isRTL={isRTL}
                  index={i}
                />
              ))}
            </div>
          </DesktopServiceGroup>
        ) : null}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   ARCHIVE (teaser)
   ══════════════════════════════════════════════════════ */
function DesktopArchiveCard({ collection, isRTL, index, tf }) {
  const cover = collection?.photos?.[0] || null;
  const photoCount = collection?.photos?.length || 0;
  return (
    <Reveal delay={index * 0.12}>
      <Link
        to="/archive"
        className={`group relative block h-full overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-2xl hover:shadow-primary/10 ${isRTL ? 'text-right' : 'text-left'
          }`}
      >
        <div className="relative h-60 overflow-hidden bg-gradient-to-br from-primary/12 via-surface to-surface-alt">
          {cover ? (
            <>
              <img
                src={cover.url}
                alt={cover.caption || collection.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-secondary/40">
              <Library className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className={`font-display text-lg font-bold leading-tight ${cover ? 'text-white' : 'text-heading'}`}>
              {collection.title}
            </p>
            <p
              className={`mt-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${cover ? 'text-secondary/90' : 'text-muted'
                }`}
            >
              <Library className="h-3.5 w-3.5" />
              {tf('landing.archive.photos', `${photoCount} photos`, { count: photoCount })}
            </p>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

function DesktopArchiveSection({ isRTL, collections, isLoading, tf }) {
  const teaser = (Array.isArray(collections) ? collections : [])
    .filter((collection) => Array.isArray(collection?.photos) && collection.photos.length)
    .slice(0, 3);
  if (!isLoading && !teaser.length) return null;

  return (
    <section id="archive" className="relative py-24 lg:py-32">
      <div className="page-container relative">
        <DesktopSectionHeader
          label={tf('landing.archive.label', 'Our Archive')}
          title={tf('landing.archive.title', 'Moments and memories')}
          subtitle={tf('landing.archive.subtitle', 'A glimpse of our published collections.')}
        />
        {isLoading ? (
          <div className="mt-14 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">{tf('landing.archive.loading', 'Loading archive...')}</p>
          </div>
        ) : (
          <>
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teaser.map((collection, i) => (
                <DesktopArchiveCard key={collection.id} collection={collection} isRTL={isRTL} index={i} tf={tf} />
              ))}
            </div>
            <Reveal>
              <div className="mt-10 flex justify-center">
                <Link to="/archive">
                  <Button size="lg" icon={Library} className="!rounded-full !px-8 !font-bold">
                    {tf('landing.archive.viewAll', 'View the full archive')}
                  </Button>
                </Link>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   MEETINGS (teaser)
   ══════════════════════════════════════════════════════ */
function DesktopMeetingCard({ meeting, isRTL, index, t }) {
  const day = translateDayLabel(meeting.day, t);
  return (
    <Reveal delay={index * 0.1}>
      <Link
        to={`/meetings/${meeting._id}`}
        className={`group relative block h-full overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-2xl hover:shadow-primary/10 ${isRTL ? 'text-right' : 'text-left'
          }`}
      >
        <div className="absolute top-0 end-0 h-24 w-24 rounded-bl-[3rem] bg-gradient-to-bl from-secondary/[0.08] to-transparent" />
        <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display truncate text-lg font-bold leading-tight text-heading">{meeting.name}</h3>
            {meeting.sector?.name ? (
              <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wider text-secondary">
                {meeting.sector.name}
              </p>
            ) : null}
          </div>
        </div>
        <div className={`relative mt-5 flex flex-wrap gap-2 ${isRTL ? 'justify-end' : ''}`}>
          {day ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-muted">
              <CalendarClock className="h-3.5 w-3.5" />
              {day}
            </span>
          ) : null}
          {meeting.time ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-muted"
              dir="ltr"
            >
              <Clock3 className="h-3.5 w-3.5" />
              {meeting.time}
            </span>
          ) : null}
        </div>
      </Link>
    </Reveal>
  );
}

function DesktopMeetingsSection({ isRTL, meetings, isLoading, tf, t }) {
  const teaser = (Array.isArray(meetings) ? meetings : []).slice(0, 6);
  if (!isLoading && !teaser.length) return null;

  return (
    <section id="meetings" className="relative py-24 lg:py-32 bg-surface-alt">
      <div className="page-container relative">
        <DesktopSectionHeader
          label={tf('landing.meetings.label', 'Meetings & Sectors')}
          title={tf('landing.meetings.title', 'Join one of our meetings')}
          subtitle={tf('landing.meetings.subtitle', 'A glimpse of the meetings held across our sectors.')}
        />
        {isLoading ? (
          <div className="mt-14 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">{tf('landing.meetings.loading', 'Loading meetings...')}</p>
          </div>
        ) : (
          <>
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teaser.map((meeting, i) => (
                <DesktopMeetingCard key={meeting._id} meeting={meeting} isRTL={isRTL} index={i} t={t} />
              ))}
            </div>
            <Reveal>
              <div className="mt-10 flex justify-center">
                <Link to="/meetings">
                  <Button size="lg" icon={Users} className="!rounded-full !px-8 !font-bold">
                    {tf('landing.meetings.viewAll', 'View all meetings')}
                  </Button>
                </Link>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { language, isRTL, toggleLanguage } = useI18n();
  const { isAuthenticated } = useAuth();
  const {
    text: t,
    getOptionalText,
    heroImageUrl,
    priests: contentPriests,
    stats: contentStats,
    location,
    socialLinks,
  } = useLandingPublicContent();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const textAlignClass = isRTL ? 'text-right' : 'text-left';
  const [statsRef, statsInView] = useInView(0.2);
  const parallaxOffset = useParallax(0.15);
  const isMobile = useIsMobile();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const spyNavRef = useRef(false);
  const didInitialScrollRef = useRef(false);
  const [guestEntryOpen, setGuestEntryOpen] = useState(!isAuthenticated);
  const publicSiteQuery = useQuery({
    queryKey: ['settings', 'public-site'],
    queryFn: async () => (await settingsApi.getPublicSite()).data?.data || null,
    staleTime: 60000,
  });
  const registrationEnabled = publicSiteQuery.data?.registrationEnabled !== false;

  const divineLiturgiesQuery = useQuery({
    queryKey: ['public', 'divine-liturgies'],
    queryFn: async () => (await divineLiturgiesApi.getPublicOverview()).data?.data || null,
    staleTime: 60000,
  });
  const divineLiturgiesSchedule = divineLiturgiesQuery.data || null;

  const archiveQuery = useQuery({
    queryKey: ['archive', 'public'],
    queryFn: async () => (await archiveApi.getPublic()).data?.data || null,
    staleTime: 60000,
  });
  const archiveCollections = Array.isArray(archiveQuery.data?.collections)
    ? archiveQuery.data.collections
    : [];

  const meetingsQuery = useQuery({
    queryKey: ['public', 'meetings'],
    queryFn: async () => (await meetingsApi.public.getMeetings()).data?.data || [],
    staleTime: 60000,
  });
  const publicMeetings = Array.isArray(meetingsQuery.data) ? meetingsQuery.data : [];

  useEffect(() => {
    setGuestEntryOpen(!isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!guestEntryOpen || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [guestEntryOpen]);

  /* ── Clean-URL section scrolling ──
     Scroll to the section named by the pathname (e.g. /about). URL changes that
     come from the scroll-spy below are flagged via `spyNavRef` and skipped here,
     so passive scrolling never triggers a scroll-back. */
  useEffect(() => {
    if (isMobile) return undefined;
    if (spyNavRef.current) {
      spyNavRef.current = false; // URL was updated by scrolling, not a navigation intent
      return undefined;
    }
    const section = sectionIdFromPath(routerLocation.pathname);

    const doScroll = () => {
      if (!section) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(section);
      if (!el) return;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - LANDING_HEADER_OFFSET,
        behavior: 'smooth',
      });
    };

    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      if (section) {
        const id = setTimeout(doScroll, 350); // let first paint settle on deep links
        return () => clearTimeout(id);
      }
      return undefined; // landing at '/' → already at the top
    }
    doScroll();
    return undefined;
  }, [routerLocation.pathname, isMobile]);

  /* ── Scroll-spy → reflect the visible section in the URL.
     Debounced: it only runs ~140ms AFTER scrolling settles, so nothing renders
     mid-scroll (the scroll handler itself just resets a timer). The URL is
     updated via replace and flagged so the effect above ignores it. */
  useEffect(() => {
    if (isMobile) return undefined;
    const ids = ['home', ...LANDING_SECTION_PATHS];
    const probe = LANDING_HEADER_OFFSET + 12;
    let timer = null;

    const settle = () => {
      let current = 'home';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - probe <= 0) current = id;
      }
      const targetPath = current === 'home' ? '/' : `/${current}`;
      if (window.location.pathname !== targetPath) {
        spyNavRef.current = true;
        navigate(targetPath, { replace: true });
      }
    };

    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, 140);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [isMobile, navigate]);

  const getOptional = (k) => getOptionalText(k, '');
  const getOpt = (k, fb) => getOptionalText(k, fb);
  const tf = (k, fb, values) => {
    const resolved = getOptionalText(k, fb);
    if (!values) return resolved;
    return String(resolved).replace(/\{(\w+)\}/g, (_, name) =>
      values[name] == null ? `{${name}}` : String(values[name])
    );
  };

  /* ── Shared data ── */
  const priests = (contentPriests || []).length
    ? contentPriests.map((entry) => ({
      name: entry?.user?.fullName || '',
      role: getLocalizedValue(entry?.role, language, 'en', ''),
      bio: getLocalizedValue(entry?.bio, language, 'en', ''),
      alt: getLocalizedValue(entry?.alt, language, 'en', entry?.user?.fullName || ''),
      image: entry?.user?.avatar?.url || '',
    }))
    : [
      { name: t('landing.priests.items.one.name'), role: t('landing.priests.items.one.role'), bio: t('landing.priests.items.one.bio'), alt: t('landing.priests.items.one.alt'), image: getOptional('landing.priests.items.one.image') },
      { name: t('landing.priests.items.two.name'), role: t('landing.priests.items.two.role'), bio: t('landing.priests.items.two.bio'), alt: t('landing.priests.items.two.alt'), image: getOptional('landing.priests.items.two.image') },
      { name: t('landing.priests.items.three.name'), role: t('landing.priests.items.three.role'), bio: t('landing.priests.items.three.bio'), alt: t('landing.priests.items.three.alt'), image: getOptional('landing.priests.items.three.image') },
    ];
  const stats = (contentStats || []).length
    ? [
      { icon: Users, value: contentStats.find((entry) => entry.id === 'families')?.resolvedValue || '0', label: t('landing.stats.items.families.label') },
      { icon: Heart, value: contentStats.find((entry) => entry.id === 'members')?.resolvedValue || '0', label: t('landing.stats.items.members.label') },
      { icon: Church, value: contentStats.find((entry) => entry.id === 'services')?.resolvedValue || '0', label: t('landing.stats.items.services.label') },
      { icon: HandHeart, value: contentStats.find((entry) => entry.id === 'servants')?.resolvedValue || '0', label: t('landing.stats.items.servants.label') },
    ]
    : [
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

  const managedHeroImageSrc = heroImageUrl || getOptional('landing.hero.churchImage') || '/images/church.webp';
  const managedPhoneValue = t('landing.visit.phoneValue');
  const managedEmailValue = t('landing.visit.emailValue');
  const managedChurchPlaceName = location?.placeName || t('publicLayout.brandPrimary');
  const managedChurchPlusCode = location?.plusCode || '';
  const managedChurchAddressLine = location?.addressLine || t('landing.visit.addressValue');
  const managedLocationMetaLine = [managedChurchPlusCode, managedChurchAddressLine].filter(Boolean).join(' | ');
  const managedLocationMapEmbedUrl =
    location?.mapEmbedUrl || buildDefaultMapEmbedUrl(managedChurchPlaceName);
  const managedDirectionsUrl = location?.directionsUrl || DEFAULT_DIRECTIONS_URL;
  const managedLocationTitle = getOpt('landing.location.title', 'Our Location');
  const managedLocationLabel = getOpt('landing.location.label', 'Come Visit Us');
  const managedLocationSubtitle = getOpt('landing.location.subtitle', 'We would love to welcome you');
  const managedLocationDirections = getOpt('landing.location.directions', 'Get Directions');
  const managedLifeCta = getOpt('landing.life.cta', 'Learn More');
  const managedContacts = [
    { icon: MapPin, label: t('landing.visit.addressLabel'), value: managedChurchAddressLine, ltr: false },
    { icon: Phone, label: t('landing.visit.phoneLabel'), value: managedPhoneValue, ltr: true },
    { icon: Mail, label: t('landing.visit.emailLabel'), value: managedEmailValue, ltr: false },
    { icon: Clock3, label: t('landing.visit.hoursLabel'), value: t('landing.visit.hoursValue'), ltr: false },
  ];

  /* ── Featured "next liturgy" strip data ── */
  const featuredService = (() => {
    const upcoming = divineLiturgiesSchedule?.exceptionalDivineLiturgies || [];
    const sep = t('landing.services.timeSeparator');
    const timeOf = (e) =>
      [formatServiceTime(e.startTime, language), e.endTime ? formatServiceTime(e.endTime, language) : null]
        .filter(Boolean)
        .join(` ${sep} `);
    if (upcoming.length) {
      const e = upcoming[0];
      return { title: e.displayName, dateText: formatExceptionDate(e.date, language), timeText: timeOf(e) };
    }
    const rec = divineLiturgiesSchedule?.recurringDivineLiturgies || [];
    if (rec.length) {
      const e = rec[0];
      const title = e.dayOfWeek ? translateDayLabel(e.dayOfWeek, t) : e.displayName;
      return { title, dateText: '', timeText: timeOf(e) };
    }
    return null;
  })();
  const nextLiturgyLabel = isRTL ? 'فَرِحْتُ بِالْقَائِلِينَ لِي: «إِلَى بَيْتِ الرَّبِّ نَذْهَبُ».' : 'I was glad when they said to me, “Let’s go to Yahweh’s house!”';

  /* ══ MOBILE ══ */
  if (isMobile) {
    return (
      <LandingMobilePage
        t={t}
        isRTL={isRTL}
        language={language}
        toggleLanguage={toggleLanguage}
        isAuthenticated={isAuthenticated}
        guestEntryOpen={guestEntryOpen}
        setGuestEntryOpen={setGuestEntryOpen}
        registrationEnabled={registrationEnabled}
        priests={priests}
        stats={stats}
        verses={verses}
        heroImageSrc={managedHeroImageSrc}
        schedule={divineLiturgiesSchedule}
        isScheduleLoading={divineLiturgiesQuery.isLoading}
        contacts={managedContacts}
        churchPlaceName={managedChurchPlaceName}
        churchPlusCode={managedChurchPlusCode}
        churchAddressLine={managedChurchAddressLine}
        locationMapEmbedUrl={managedLocationMapEmbedUrl}
        directionsUrl={managedDirectionsUrl}
        locationDirectionsLabel={managedLocationDirections}
        socialLinks={socialLinks}
        phoneValue={managedPhoneValue}
        emailValue={managedEmailValue}
      />
    );
  }

  /* ══ DESKTOP — "Sanctuary" cinematic navy & gold ══ */
  return (
    <div className="bg-page overflow-x-hidden">

      {/* ═══════════ HERO ═══════════ */}
      <section
        id="home"
        className="relative flex min-h-screen pt-20 flex-col overflow-hidden text-white"
        style={{ backgroundColor: '#0b1a2d' }}
      >
        {/* Cinematic church image */}
        <div className="absolute inset-0">
          <img
            src={managedHeroImageSrc}
            alt={t('publicLayout.brandPrimary')}
            loading="eager"
            className="h-full w-full object-cover object-center"
            style={{ opacity: 0.4, transform: `translateY(${parallaxOffset * 0.16}px) scale(1.08)` }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Scrims + vignette */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(9,20,33,0.82) 0%, rgba(9,20,33,0.6) 42%, rgba(9,20,33,0.8) 74%, #0b1a2d 100%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(6,14,25,0.35) 60%, rgba(6,14,25,0.85) 100%)' }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />
        </div>

        {/* Content — asymmetric split: message + clergy deck */}
        <div className="relative flex flex-1 flex-col justify-center page-container w-full pt-0 pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
            {/* Message */}
            <div className="text-center lg:text-start">
              <Reveal delay={0.16}>
                <h1 className="font-display text-4xl font-bold leading-[1.16] tracking-tight text-white sm:text-5xl lg:text-[3.15rem] xl:text-[3.6rem]">
                  {t('landing.hero.title')}{' '}
                  <span className="mt-2 block" style={GOLD_TEXT}>
                    {t('landing.hero.highlight')}
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 lg:mx-0 lg:text-lg">
                  {t('landing.hero.description')}
                </p>
              </Reveal>
              <Reveal delay={0.42}>
                <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
                  <Link to="/about">
                    <Button
                      size="lg"
                      icon={ArrowIcon}
                      iconPosition="end"
                      className="!rounded-full !border !border-secondary !bg-secondary !px-8 !font-bold !text-[#1c1305] !shadow-lg !shadow-black/30 hover:!bg-[#c69a41] hover:!border-[#c69a41]"
                    >
                      {t('landing.hero.primaryCta')}
                    </Button>
                  </Link>
                  <Link to="/visit">
                    <Button
                      variant="outline"
                      size="lg"
                      className="!rounded-full !border-white/25 !bg-white/[0.06] !px-8 !font-bold !text-white backdrop-blur-sm hover:!bg-white/15 hover:!border-white/40"
                    >
                      {t('landing.hero.secondaryCta')}
                    </Button>
                  </Link>
                </div>
              </Reveal>
              {/* {featuredService ? (
                <Reveal delay={0.54}>
                  <div className="mt-9 flex justify-center lg:justify-start">
                    <HeroNextLiturgy service={featuredService} label={nextLiturgyLabel} />
                  </div>
                </Reveal>
              ) : null} */}
            </div>

            {/* Clergy deck */}
            <Reveal delay={0.2} direction="left">
              <HeroClergyDeck priests={priests} eyebrow={t('landing.priests.label')} />
            </Reveal>
          </div>
        </div>

        {/* Scroll cue */}
        {/* <div className="relative z-10 flex w-full justify-center pb-8">
          <ChevronDown className="h-6 w-6 animate-bounce text-white/35" />
        </div> */}

        {/* Wavy bottom edge — melts the navy hero into the section below */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-[3] h-[60px] w-full sm:h-[90px] lg:h-[80px]"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,60 C220,116 430,116 660,78 C900,38 1160,6 1440,58 L1440,120 L0,120 Z"
            style={{ fill: 'rgb(var(--color-bg-rgb))' }}
          />
        </svg>
      </section>

      {/* ═══════════ ABOUT (asymmetric) ═══════════ */}
      <section id="about" className="relative py-24 lg:py-32">
        <div className="page-container relative">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-16">
            {/* Arched emblem / photo */}
            <Reveal direction="right">
              <div className="relative mx-auto w-full max-w-sm">
                <div className="pointer-events-none absolute -inset-4 rounded-t-[11rem] rounded-b-3xl bg-gradient-to-b from-secondary/20 via-transparent to-transparent blur-md" />
                <div
                  className="relative overflow-hidden rounded-t-[10rem] rounded-b-3xl border border-secondary/30 shadow-2xl shadow-primary/15"
                  style={{ aspectRatio: '3 / 4' }}
                >
                  <img src={managedHeroImageSrc} alt={managedChurchPlaceName} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/45 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute inset-2 rounded-t-[9.3rem] rounded-b-[1.4rem] border border-secondary/30" />
                  <div className={`absolute inset-x-0 bottom-0 p-6 ${textAlignClass}`}>
                    <p className="font-display text-lg font-bold text-white">{managedChurchPlaceName}</p>
                    {managedChurchAddressLine ? (
                      <p className="mt-1 text-xs text-white/80">{managedChurchAddressLine}</p>
                    ) : null}
                  </div>
                </div>
                <div className="absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-secondary/40 bg-secondary text-white shadow-lg">
                  <Cross className="h-5 w-5" />
                </div>
              </div>
            </Reveal>

            {/* Text */}
            <div className={textAlignClass}>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/[0.08] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-secondary">
                  <Cross className="h-3 w-3" />
                  {t('landing.about.label')}
                </span>
                <h2 className="font-display mt-5 text-3xl font-bold leading-[1.22] text-heading lg:text-[2.6rem]">
                  {t('landing.about.title')}
                </h2>
                <p className="mt-5 text-base leading-loose text-muted lg:text-lg">{t('landing.about.description')}</p>
              </Reveal>

              <div className="mt-8 space-y-5">
                <Reveal delay={0.1}>
                  <div className={`flex gap-4 ${isRTL ? '' : 'flex-row-reverse text-right'}`}>
                    <div className="mt-1 h-auto w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-secondary to-secondary/20" />
                    <div>
                      <div className={`flex items-center gap-2.5 ${isRTL ? '' : 'flex-row-reverse'}`}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Navigation className="h-[18px] w-[18px]" />
                        </div>
                        <p className="font-display text-lg font-bold text-heading">{t('landing.about.missionLabel')}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{t('landing.about.missionText')}</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delay={0.18}>
                  <div className={`flex gap-4 ${isRTL ? '' : 'flex-row-reverse text-right'}`}>
                    <div className="mt-1 h-auto w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-secondary to-secondary/20" />
                    <div>
                      <div className={`flex items-center gap-2.5 ${isRTL ? '' : 'flex-row-reverse'}`}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                          <Globe className="h-[18px] w-[18px]" />
                        </div>
                        <p className="font-display text-lg font-bold text-heading">{t('landing.about.visionLabel')}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{t('landing.about.visionText')}</p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CLERGY ═══════════ */}
      <section id="priests" className="relative overflow-hidden py-24 lg:py-32 bg-surface">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/[0.03] blur-[150px]" />
        </div>
        <div className="page-container relative">
          <DesktopSectionHeader
            label={t('landing.priests.label')}
            title={t('landing.priests.title')}
            subtitle={t('landing.priests.subtitle')}
          />
          <div className="mt-16 grid grid-cols-1 gap-y-14 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {priests.map((p, i) => (
              <DesktopPriestCard key={p.name || i} priest={p} isRTL={isRTL} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SERVICES ═══════════ */}
      <DesktopServicesSection
        t={t}
        isRTL={isRTL}
        language={language}
        schedule={divineLiturgiesSchedule}
        isLoading={divineLiturgiesQuery.isLoading}
      />

      {/* ═══════════ ARCHIVE ═══════════ */}
      <DesktopArchiveSection
        isRTL={isRTL}
        collections={archiveCollections}
        isLoading={archiveQuery.isLoading}
        tf={tf}
      />

      {/* ═══════════ MEETINGS ═══════════ */}
      <DesktopMeetingsSection
        isRTL={isRTL}
        meetings={publicMeetings}
        isLoading={meetingsQuery.isLoading}
        tf={tf}
        t={t}
      />

      {/* ═══════════ STATS (dark gold band) ═══════════ */}
      <section id="stats" className="py-24 lg:py-32">
        <div className="page-container">
          <div ref={statsRef} className="relative overflow-hidden rounded-[2.5rem]" style={{ background: NAVY_BAND }}>
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 -end-24 h-96 w-96 rounded-full bg-secondary/10 blur-[110px]" />
              <div className="absolute -bottom-24 -start-24 h-80 w-80 rounded-full bg-primary-light/10 blur-[90px]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.02]">
                <Cross className="h-[420px] w-[420px]" />
              </div>
            </div>
            <div className="relative px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
              <DesktopSectionHeader label={t('landing.stats.label')} title={t('landing.stats.title')} tone="dark" />
              <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {stats.map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.1}>
                    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-center backdrop-blur-sm transition-all duration-500 hover:border-secondary/30 hover:bg-white/[0.07] sm:p-6">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/25 to-secondary/5 text-secondary">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <p className="font-display text-3xl font-bold tracking-tight text-white lg:text-5xl" style={GOLD_TEXT}>
                        <AnimatedCounter value={s.value} inView={statsInView} />
                      </p>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/55 sm:text-xs">{s.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ VERSES (stillness) ═══════════ */}
      {/* <section id="verses" className="relative py-24 lg:py-32 bg-surface-alt">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-secondary)_0%,transparent_70%)] opacity-[0.035]" />
        </div>
        <div className="page-container relative">
          <DesktopSectionHeader
            label={t('landing.verses.label')}
            title={t('landing.verses.title')}
            subtitle={t('landing.verses.subtitle')}
          />
          <div className="mx-auto mt-14 max-w-4xl">
            <Reveal>
              <figure className="relative overflow-hidden rounded-[2rem] border border-secondary/25 bg-surface px-8 py-14 text-center shadow-xl shadow-primary/5">
                <Quote className="pointer-events-none absolute -top-2 left-1/2 h-24 w-24 -translate-x-1/2 text-secondary/10" />
                <div className="relative">
                  <blockquote className="font-display mx-auto max-w-2xl text-2xl font-bold leading-relaxed text-heading lg:text-[1.9rem]">
                    {verses[0].text}
                  </blockquote>
                  <GoldDivider className="mt-7" />
                  <figcaption className="mt-5 inline-flex items-center gap-2 font-bold text-secondary">
                    <BookOpen className="h-4 w-4" />
                    {verses[0].reference}
                  </figcaption>
                </div>
              </figure>
            </Reveal>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {verses.slice(1).map((v, i) => (
                <Reveal key={v.reference} delay={0.1 + i * 0.1}>
                  <figure className={`h-full rounded-2xl border border-border bg-surface p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <Quote className="h-5 w-5 text-secondary/50" />
                    <blockquote className="mt-3 text-base font-medium leading-relaxed text-heading/90">{v.text}</blockquote>
                    <figcaption className={`mt-4 flex items-center gap-2 text-sm font-bold text-secondary ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <BookOpen className="h-3.5 w-3.5" />
                      {v.reference}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* ═══════════ LIFE ═══════════ */}
      {/* <section id="life" className="py-24 lg:py-32">
        <div className="page-container">
          <DesktopSectionHeader
            label={t('landing.life.label')}
            title={t('landing.life.title')}
            subtitle={t('landing.life.subtitle')}
          />
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {lifeCards.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className={`group relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-8 transition-all duration-500 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-2xl hover:shadow-primary/10 ${textAlignClass}`}>
                  <div className={`absolute top-6 ${isRTL ? 'left-7' : 'right-7'} font-display text-6xl font-black leading-none text-secondary/[0.08] transition-colors duration-500 group-hover:text-secondary/15`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="relative">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-secondary/25 bg-gradient-to-br from-primary/10 to-secondary/10 text-primary transition-transform duration-500 group-hover:scale-110">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-xl font-bold leading-tight text-heading">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
                    <div className={`mt-6 flex items-center gap-1.5 text-secondary/50 transition-all duration-300 group-hover:gap-2.5 group-hover:text-secondary ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold uppercase tracking-wider">{managedLifeCta}</span>
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section> */}

      {/* ═══════════ VISIT ═══════════ */}
      <section id="visit" className="relative py-24 lg:py-32 bg-surface-alt">
        <div className="page-container">
          <DesktopSectionHeader
            label={t('landing.visit.label')}
            title={t('landing.visit.title')}
            subtitle={t('landing.visit.subtitle')}
          />
          <StaggerChildren className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.08}>
            {managedContacts.map((item) => (
              <div
                key={item.label}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-400 hover:border-secondary/30 hover:shadow-lg hover:shadow-primary/5 ${textAlignClass}`}
              >
                <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/[0.08] text-secondary transition-transform duration-300 group-hover:scale-105">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-heading">{item.label}</p>
                    <p className={`mt-1 text-sm leading-relaxed text-muted ${item.ltr ? 'direction-ltr' : ''}`}>{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ═══════════ LOCATION ═══════════ */}
      <section id="location" className="py-24 lg:py-32">
        <div className="page-container">
          <DesktopSectionHeader label={managedLocationLabel} title={managedLocationTitle} subtitle={managedLocationSubtitle} />
          <Reveal className="mt-14">
            <div className="relative overflow-hidden rounded-[2rem] border border-secondary/20 bg-surface shadow-xl shadow-primary/5">
              <div className="relative h-[320px] w-full sm:h-[420px] lg:h-[460px]">
                <iframe
                  title={managedLocationTitle}
                  src={managedLocationMapEmbedUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-surface to-transparent" />
              </div>
              <div className="relative border-t border-border bg-surface px-6 py-5 sm:px-8">
                <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className={textAlignClass}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">{t('landing.visit.addressLabel')}</p>
                      <p className="mt-0.5 font-display text-base font-bold text-heading">{managedChurchPlaceName}</p>
                      {managedLocationMetaLine ? <p className="mt-0.5 text-sm text-muted">{managedLocationMetaLine}</p> : null}
                    </div>
                  </div>
                  <a href={managedDirectionsUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button variant="outline" size="md" icon={ExternalLink} iconPosition="end" className="!w-full !rounded-full !font-bold sm:!w-auto">
                      {managedLocationDirections}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ PORTAL CTA ═══════════ */}
      <section className="border-t border-border py-24 lg:py-32">
        <div className="page-container">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] text-center text-white" style={{ background: NAVY_BAND }}>
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-16 -end-16 h-64 w-64 rounded-full bg-secondary/10 blur-[70px]" />
                <div className="absolute -bottom-16 -start-16 h-64 w-64 rounded-full bg-primary-light/10 blur-[70px]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
                <div className="absolute top-8 start-8 text-white/[0.05]"><Cross className="h-20 w-20" /></div>
                <div className="absolute bottom-8 end-8 text-white/[0.05]"><Cross className="h-14 w-14 rotate-12" /></div>
              </div>
              <div className="relative px-6 py-16 sm:px-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-white/[0.06] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-secondary">
                  <Sparkles className="h-3 w-3" />
                  {t('landing.portal.label')}
                </div>
                <h3 className="font-display mt-6 text-3xl font-bold text-white lg:text-4xl">{t('landing.portal.title')}</h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70 lg:text-lg">{t('landing.portal.description')}</p>
                <div className="mt-8">
                  <Link to="/auth/login">
                    <Button
                      size="lg"
                      icon={ArrowIcon}
                      iconPosition="end"
                      className="!rounded-full !border !border-secondary !bg-secondary !px-8 !font-bold !text-[#1c1305] !shadow-lg !shadow-black/30 hover:!bg-[#c69a41] hover:!border-[#c69a41]"
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

      <GuestEntryOverlay
        isOpen={!isAuthenticated && guestEntryOpen}
        isRTL={isRTL}
        registrationEnabled={registrationEnabled}
        onBrowse={() => setGuestEntryOpen(false)}
        onClose={() => setGuestEntryOpen(false)}
      />
    </div>
  );
}
