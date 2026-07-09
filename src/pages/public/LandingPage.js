import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

/* ════════════════════════════════════════════════════════════════
   SANCTUARY DESIGN LANGUAGE — cinematic navy + antique gold, Tajawal display
   ════════════════════════════════════════════════════════════════ */
/* GOLD_TEXT, NAVY_BAND, ArchOutline, GoldDivider, DesktopSectionHeader are
   imported from ./LandingPage.shared (see import block above). */

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

function DesktopServicesSection({ t, isRTL, language, schedule, isLoading }) {
  const liturgies = schedule?.recurringDivineLiturgies || [];
  const vespers = schedule?.recurringVespers || [];
  const upcoming = schedule?.exceptionalDivineLiturgies || [];

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
            : liturgies.length === 0
              ? emptyBox(t('landing.services.empty'))
              : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {liturgies.map((entry, i) => (
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

        {upcoming.length > 0 ? (
          <DesktopServiceGroup title={t('landing.services.upcoming')} icon={CalendarClock}>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((entry, i) => (
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
  const nextLiturgyLabel = isRTL ? 'القداس القادم' : 'Next Liturgy';

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
        className="relative flex min-h-screen flex-col overflow-hidden text-white"
        style={{ backgroundColor: '#0b1a2d' }}
      >
        {/* Cinematic church image */}
        <div className="absolute inset-0">
          <img
            src={managedHeroImageSrc}
            alt={t('publicLayout.brandPrimary')}
            loading="eager"
            className="h-full w-full object-cover object-center"
            style={{ opacity: 0.5, transform: `translateY(${parallaxOffset * 0.18}px) scale(1.06)` }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Scrims + vignette */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(9,20,33,0.74) 0%, rgba(9,20,33,0.5) 38%, rgba(9,20,33,0.78) 72%, #0b1a2d 100%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 32%, transparent 0%, rgba(6,14,25,0.35) 62%, rgba(6,14,25,0.85) 100%)' }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />
        </div>

        {/* Decorative gold arch */}
        <div className="pointer-events-none absolute inset-x-0 top-10 flex justify-center">
          <ArchOutline className="mt-20 w-[560px] max-w-[78%] text-secondary/25" />
          <div
            className="absolute left-1/2 top-[92px] -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-secondary/40 bg-[#0b1a2d] text-secondary"
          >
            <Cross className="h-4 w-4" />
          </div>
        </div>

        {/* Content */}
        <div className="relative flex flex-1 flex-col items-center justify-center page-container w-full pt-44 pb-20">
          <Reveal delay={0.05}>
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-white/[0.06] px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] text-secondary backdrop-blur-sm">
              <Cross className="h-3 w-3" />
              {t('landing.hero.badge')}
            </span>
          </Reveal>
          <Reveal delay={0.16}>
            <h1 className="font-display mt-8 max-w-4xl text-center text-4xl font-bold leading-[1.18] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              {t('landing.hero.title')}{' '}
              <span className="mt-3 block" style={GOLD_TEXT}>
                {t('landing.hero.highlight')}
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mx-auto mt-7 max-w-2xl text-center text-base leading-relaxed text-white/70 lg:text-lg">
              {t('landing.hero.description')}
            </p>
          </Reveal>
          <Reveal delay={0.42}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <a href="#about">
                <Button
                  size="lg"
                  icon={ArrowIcon}
                  iconPosition="end"
                  className="!rounded-full !border !border-secondary !bg-secondary !px-8 !font-bold !text-[#1c1305] !shadow-lg !shadow-black/30 hover:!bg-[#c69a41] hover:!border-[#c69a41]"
                >
                  {t('landing.hero.primaryCta')}
                </Button>
              </a>
              <a href="#visit">
                <Button
                  variant="outline"
                  size="lg"
                  className="!rounded-full !border-white/25 !bg-white/[0.06] !px-8 !font-bold !text-white backdrop-blur-sm hover:!bg-white/15 hover:!border-white/40"
                >
                  {t('landing.hero.secondaryCta')}
                </Button>
              </a>
            </div>
          </Reveal>
        </div>

        {/* Next liturgy strip */}
        {featuredService ? (
          <div className="relative z-10 w-full page-container pt-0 pb-12">
            <Reveal delay={0.55}>
              <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 backdrop-blur-md sm:flex-row">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">{nextLiturgyLabel}</p>
                    <p className="mt-0.5 font-display text-base font-bold text-white">
                      {featuredService.title}
                      {featuredService.dateText ? <span className="text-white/60"> · {featuredService.dateText}</span> : null}
                    </p>
                  </div>
                </div>
                {featuredService.timeText ? (
                  <div dir="ltr" className="text-lg font-bold text-white/90">{featuredService.timeText}</div>
                ) : null}
              </div>
            </Reveal>
          </div>
        ) : (
          <div className="relative z-10 flex w-full justify-center pb-10">
            <ChevronDown className="h-6 w-6 animate-bounce text-white/40" />
          </div>
        )}
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
                  <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <div className="mt-1 h-auto w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-secondary to-secondary/20" />
                    <div>
                      <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
                  <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <div className="mt-1 h-auto w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-secondary to-secondary/20" />
                    <div>
                      <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
