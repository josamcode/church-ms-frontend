import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, BookOpen, Church, Clock3, Heart, HandHeart,
  Mail, MapPin, Phone, Quote, ShieldCheck, Sparkles, Users, UserCircle2,
  Cross, Star, Globe, Navigation, ExternalLink, CalendarClock, Library,
} from 'lucide-react';
import { settingsApi, divineLiturgiesApi, archiveApi } from '../../api/endpoints';
import { useAuth } from '../../auth/auth.hooks';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useI18n } from '../../i18n/i18n';
import { useLandingPublicContent } from '../../hooks/useLandingContent';
import { getLocalizedValue } from '../../utils/landingContent';
import LandingMobilePage from './LandingMobilePage';
import {
  DEFAULT_DIRECTIONS_URL, buildDefaultMapEmbedUrl, useInView, useParallax,
  useIsMobile, Reveal, StaggerChildren, AnimatedCounter, SectionHeader,
  GuestEntryOverlay, translateDayLabel, formatServiceTime, formatExceptionDate,
  ServicePriestList,
} from './LandingPage.shared';

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
   DESKTOP SERVICES SECTION
   ══════════════════════════════════════════════════════ */
function DesktopServiceCard({ entry, language, t, isRTL, accent, accentText, index }) {
  const start = formatServiceTime(entry.startTime, language);
  const end = formatServiceTime(entry.endTime, language);
  const sep = t('landing.services.timeSeparator');

  const title = entry.dayOfWeek
    ? translateDayLabel(entry.dayOfWeek, t)
    : entry.displayName;

  return (
    <Reveal delay={index * 0.06}>
      <article
        className={`
          group relative h-full rounded-2xl border border-border bg-surface p-5
          transition-all duration-300
          hover:border-primary/25 hover:shadow-md
          ${isRTL ? 'text-right' : 'text-left'}
        `}
      >
        <div className={`flex h-full gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Accent marker */}
          <div
            className={`
              mt-1 h-10 w-1 flex-shrink-0 rounded-full bg-gradient-to-b ${accent}
            `}
          />

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div
              className={`flex items-start justify-between gap-4`}
            >
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-tight text-heading">
                  {title}
                </h3>

                {entry.dayOfWeek && entry.name ? (
                  <p className="mt-1 text-sm leading-5 text-muted">
                    {entry.name}
                  </p>
                ) : null}
              </div>

              <div
                className={`
                  flex shrink-0 items-center gap-1.5 rounded-full border border-border
                  bg-background px-3 py-1 text-xs font-semibold ${accentText}
                `}
                dir="ltr"
              >
                <span className='text-lg'>
                  {start}
                  {end ? ` ${sep} ${end}` : ''}
                </span>
              </div>
            </div>

            {/* Priests */}
            {Array.isArray(entry.priests) && entry.priests.length > 0 && (
              <div className="mt-4 border-t border-border/70 pt-4">
                <ServicePriestList priests={entry.priests} isRTL={isRTL} t={t} />
              </div>
            )}
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
      <div className={`group relative h-full overflow-hidden rounded-[1.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/8 via-amber-500/3 to-transparent p-6 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-amber-500/15`}>
          <CalendarClock className="h-16 w-16" />
        </div>
        <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <Star className="h-5 w-5 text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold text-heading leading-tight">{entry.displayName}</p>
            <p className="mt-1 text-xs text-muted leading-relaxed">{formatExceptionDate(entry.date, language)}</p>
            <p className="mt-2 text-sm font-bold text-amber-600 tracking-wide" dir="ltr">
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

function DesktopServicesSection({ t, isRTL, language, schedule, isLoading }) {
  const liturgies = schedule?.recurringDivineLiturgies || [];
  const vespers = schedule?.recurringVespers || [];
  const upcoming = schedule?.exceptionalDivineLiturgies || [];

  return (
    <section id="services" className="relative py-20 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-transparent to-surface/40" />
        <div className="absolute top-1/3 -end-32 h-[400px] w-[400px] rounded-full bg-primary/[0.04] blur-[140px]" />
        <div className="absolute bottom-1/4 -start-32 h-[360px] w-[360px] rounded-full bg-indigo-500/[0.05] blur-[140px]" />
      </div>
      <div className="page-container relative">
        <SectionHeader
          label={t('landing.services.label')}
          title={t('landing.services.title')}
          subtitle={t('landing.services.subtitle')}
          centered
        />

        {/* Divine Liturgies */}
        <div className="mt-12 sm:mt-16">
          <Reveal>
            <div className={`flex items-center gap-3 mb-5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-heading">
                {t('landing.services.liturgies')}
              </h3>
            </div>
          </Reveal>
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-border bg-surface p-8 text-center">
              <p className="text-sm text-muted">{t('landing.services.loading')}</p>
            </div>
          ) : liturgies.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-surface p-8 text-center">
              <p className="text-sm text-muted">{t('landing.services.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {liturgies.map((entry, i) => (
                <DesktopServiceCard
                  key={entry.id}
                  entry={entry}
                  language={language}
                  t={t}
                  isRTL={isRTL}
                  accent="from-primary to-primary-dark"
                  accentText="text-primary"
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* Vespers */}
        <div className="mt-10 sm:mt-12">
          <Reveal>
            <div className={`flex items-center gap-3 mb-5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-heading">
                {t('landing.services.vespers')}
              </h3>
            </div>
          </Reveal>
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-border bg-surface p-8 text-center">
              <p className="text-sm text-muted">{t('landing.services.loading')}</p>
            </div>
          ) : vespers.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-surface p-8 text-center">
              <p className="text-sm text-muted">{t('landing.services.emptyVespers')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vespers.map((entry, i) => (
                <DesktopServiceCard
                  key={entry.id}
                  entry={entry}
                  language={language}
                  t={t}
                  isRTL={isRTL}
                  accent="from-indigo-500 to-purple-600"
                  accentText="text-indigo-600"
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming exceptional services */}
        {upcoming.length > 0 ? (
          <div className="mt-10 sm:mt-12">
            <Reveal>
              <div className={`flex items-center gap-3 mb-5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                  <CalendarClock className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-heading">
                  {t('landing.services.upcoming')}
                </h3>
              </div>
            </Reveal>
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
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DesktopArchiveCard({ collection, isRTL, index, tf }) {
  const cover = collection?.photos?.[0] || null;
  const photoCount = collection?.photos?.length || 0;

  return (
    <Reveal delay={index * 0.12}>
      <Link
        to="/archive"
        className={`group relative block h-full overflow-hidden rounded-[1.75rem] border border-primary/8 bg-surface hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/8 transition-all duration-500 ${isRTL ? 'text-right' : 'text-left'}`}
      >
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-page">
          {cover ? (
            <>
              <img
                src={cover.url}
                alt={cover.caption || collection.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-primary/40">
              <Library className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className={`text-lg font-extrabold leading-tight ${cover ? 'text-white' : 'text-heading'}`}>
              {collection.title}
            </p>
            <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${cover ? 'text-white/80' : 'text-muted'}`}>
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

  // Degrade gracefully: hide the whole section when there is nothing to show.
  if (!isLoading && !teaser.length) return null;

  return (
    <section id="archive" className="relative py-20 sm:py-28 lg:py-32 bg-surface">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)_0%,transparent_70%)] opacity-[0.03]" />
      </div>
      <div className="page-container relative">
        <SectionHeader
          label={tf('landing.archive.label', 'Our Archive')}
          title={tf('landing.archive.title', 'Moments and memories')}
          subtitle={tf('landing.archive.subtitle', 'A glimpse of our published collections.')}
          centered
        />

        {isLoading ? (
          <div className="mt-12 rounded-[1.5rem] border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">{tf('landing.archive.loading', 'Loading archive...')}</p>
          </div>
        ) : (
          <>
            <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teaser.map((collection, i) => (
                <DesktopArchiveCard
                  key={collection.id}
                  collection={collection}
                  isRTL={isRTL}
                  index={i}
                  tf={tf}
                />
              ))}
            </div>
            <Reveal>
              <div className="mt-10 flex justify-center">
                <Link to="/archive">
                  <Button size="lg" className="!rounded-xl !font-bold">
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
      { icon: Users, value: contentStats.find((entry) => entry.id === 'families')?.resolvedValue || '0', label: t('landing.stats.items.families.label'), accent: 'from-blue-400 to-blue-500' },
      { icon: Heart, value: contentStats.find((entry) => entry.id === 'members')?.resolvedValue || '0', label: t('landing.stats.items.members.label'), accent: 'from-rose-400 to-rose-500' },
      { icon: Church, value: contentStats.find((entry) => entry.id === 'services')?.resolvedValue || '0', label: t('landing.stats.items.services.label'), accent: 'from-amber-400 to-amber-500' },
      { icon: HandHeart, value: contentStats.find((entry) => entry.id === 'servants')?.resolvedValue || '0', label: t('landing.stats.items.servants.label'), accent: 'from-emerald-400 to-emerald-500' },
    ]
    : [
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
    { icon: MapPin, label: t('landing.visit.addressLabel'), value: managedChurchAddressLine, ltr: false, color: 'bg-blue-500/10 text-blue-600' },
    { icon: Phone, label: t('landing.visit.phoneLabel'), value: managedPhoneValue, ltr: true, color: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Mail, label: t('landing.visit.emailLabel'), value: managedEmailValue, ltr: false, color: 'bg-amber-500/10 text-amber-600' },
    { icon: Clock3, label: t('landing.visit.hoursLabel'), value: t('landing.visit.hoursValue'), ltr: false, color: 'bg-rose-500/10 text-rose-600' },
  ];


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

  /* ══ DESKTOP (unchanged) ══ */
  return (
    <div className="bg-page overflow-x-hidden">

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img src={managedHeroImageSrc} alt={t('publicLayout.brandPrimary')} className="h-full w-full object-cover object-center" loading="eager" onError={(e) => { e.target.style.display = 'none'; }} />
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
          <Reveal delay={0.28}>
            <p className="mx-auto -mt-5 max-w-2xl px-4 text-center text-sm sm:text-base lg:text-lg leading-relaxed text-muted">
              {t('landing.hero.description')}
            </p>
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

      {/* SERVICES (Divine Liturgies & Vespers) */}
      <DesktopServicesSection
        t={t}
        isRTL={isRTL}
        language={language}
        schedule={divineLiturgiesSchedule}
        isLoading={divineLiturgiesQuery.isLoading}
      />

      {/* ARCHIVE (teaser) */}
      <DesktopArchiveSection
        isRTL={isRTL}
        collections={archiveCollections}
        isLoading={archiveQuery.isLoading}
        tf={tf}
      />

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
                      <span className="text-xs font-bold uppercase tracking-wider">{managedLifeCta}</span>
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
            {managedContacts.map((item) => (
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
          <SectionHeader label={managedLocationLabel} title={managedLocationTitle} subtitle={managedLocationSubtitle} centered />
          <Reveal className="mt-12 sm:mt-16">
            <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-primary/10 bg-surface shadow-xl shadow-primary/5">
              <div className="relative h-[280px] sm:h-[380px] lg:h-[450px] w-full">
                <iframe title={managedLocationTitle} src={managedLocationMapEmbedUrl} className="h-full w-full border-0" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-surface to-transparent" />
              </div>
              <div className="relative border-t border-border bg-surface px-5 py-4 sm:px-8 sm:py-5">
                <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
                    <div className={textAlignClass}>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">{t('landing.visit.addressLabel')}</p>
                      <p className="mt-0.5 text-sm sm:text-base font-semibold text-heading">{managedChurchPlaceName}</p>
                      {managedLocationMetaLine ? (
                        <p className="mt-0.5 text-xs sm:text-sm text-muted">{managedLocationMetaLine}</p>
                      ) : null}
                    </div>
                  </div>
                  <a href={managedDirectionsUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button variant="outline" size="md" icon={ExternalLink} iconPosition="end" className="!rounded-full !font-bold !w-full sm:!w-auto">{managedLocationDirections}</Button>
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
                <p className="mx-auto mt-4 max-w-2xl text-sm lg:text-lg text-white/70">{t('landing.portal.description')}</p>
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
