import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Skeleton from '../../components/ui/Skeleton';
import { formatDate, getGenderLabel, getRoleLabel } from '../../utils/formatters';
import { useI18n } from '../../i18n/i18n';
import {
  Calendar, Clock3, Mail, MapPin, Phone,
  ShieldCheck, Tag, UserCircle,
} from 'lucide-react';

/* ── primitives ──────────────────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

/** Overline label + value */
function Field({ icon: Icon, label, value, ltr = false, tone = 'default' }) {
  const { t } = useI18n();
  const toneClass =
    tone === 'success' ? 'text-success' :
      tone === 'danger' ? 'text-danger' :
        'text-heading';

  return (
    <div>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-muted" />}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      </div>
      <p className={`mt-1 text-sm font-medium ${toneClass} ${ltr ? 'direction-ltr text-left' : ''}`}>
        {value || t('common.placeholder.empty')}
      </p>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { t } = useI18n();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await authApi.me();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-52 w-full" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-72 w-full xl:col-span-2" />
          <Skeleton className="h-72 w-full xl:col-span-1" />
        </div>
      </div>
    );
  }

  const empty = t('common.placeholder.empty');
  const roleLabel = getRoleLabel(user?.role) || empty;
  const statusLabel = user?.isLocked ? t('common.status.locked') : t('common.status.active');
  const statusVariant = user?.isLocked ? 'danger' : 'success';
  const primaryPhone = user?.phonePrimary || empty;
  const secondaryPhone = user?.phoneSecondary || empty;
  const email = user?.email || empty;
  const addressValue =
    [user?.address?.governorate, user?.address?.city, user?.address?.street]
      .filter(Boolean).join(', ') || empty;

  const initial = String(user?.fullName || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('dashboardLayout.menu.profile') },
        ]}
      />

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-surface">
        {/* tinted gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/6" />

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between">

          {/* avatar + name */}
          <div className="flex items-center gap-5">
            {user?.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt=""
                className="h-20 w-20 rounded-2xl border-2 border-primary/20 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/10 text-2xl font-bold text-primary shadow-inner">
                {initial}
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70">
                {t('dashboardLayout.menu.profile')}
              </p>
              <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-heading">
                {user?.fullName || empty}
              </h1>
              <p className="mt-1 text-sm text-muted direction-ltr text-left">{email}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="primary">{roleLabel}</Badge>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
                {user?.ageGroup && <Badge>{user.ageGroup}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MAIN GRID ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Personal details ─── */}
        <div className="space-y-4 xl:col-span-2">
          <SectionLabel>{t('profilePage.sections.profileDetails.title')}</SectionLabel>

          <div className="rounded-2xl border border-border bg-surface px-6 py-5">
            <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              <Field icon={Calendar} label={t('profilePage.fields.birthDate')} value={formatDate(user?.birthDate)} />
              <Field icon={UserCircle} label={t('profilePage.fields.gender')} value={getGenderLabel(user?.gender)} />
              <Field icon={Phone} label={t('profilePage.fields.primaryPhone')} value={primaryPhone} ltr />
              <Field icon={Phone} label={t('profilePage.fields.secondaryPhone')} value={secondaryPhone} ltr />
              <Field icon={Mail} label={t('profilePage.fields.email')} value={email} ltr />
              <Field icon={ShieldCheck} label={t('profilePage.fields.role')} value={roleLabel} />
            </div>
          </div>
        </div>

        {/* ── Location + tags ─── */}
        <div className="space-y-4">
          <SectionLabel>{t('profilePage.sections.locationAndTags.title')}</SectionLabel>

          <div className="rounded-2xl border border-border bg-surface px-6 py-5 space-y-5">
            <Field icon={MapPin} label={t('profilePage.fields.address')} value={addressValue} />
            <Field icon={UserCircle} label={t('profilePage.fields.familyName')} value={user?.familyName || empty} />
            <Field icon={UserCircle} label={t('profilePage.fields.houseName')} value={user?.houseName || empty} />

            {/* tags */}
            <div>
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-muted" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                  {t('profilePage.fields.tags')}
                </p>
              </div>
              <div className="mt-2">
                {user?.tags?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">{empty}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ACCOUNT SNAPSHOT ════════════════════════════════════════════ */}
      <div className="space-y-4">
        <SectionLabel>{t('profilePage.sections.accountSnapshot.title')}</SectionLabel>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* status tile */}
          <div className={`flex flex-col justify-between rounded-2xl border p-5
            ${user?.isLocked
              ? 'border-danger/25 bg-danger-light'
              : 'border-success/25 bg-success-light'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                {t('profilePage.fields.accountStatus')}
              </p>
              <ShieldCheck className={`h-4 w-4 ${user?.isLocked ? 'text-danger' : 'text-success'}`} />
            </div>
            <p className={`mt-4 text-2xl font-bold tracking-tight
              ${user?.isLocked ? 'text-danger' : 'text-success'}`}>
              {statusLabel}
            </p>
            <div className={`mt-4 h-0.5 w-10 rounded-full
              ${user?.isLocked ? 'bg-danger' : 'bg-success'}`} />
          </div>

          {/* joined */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                {t('profilePage.fields.joinedOn')}
              </p>
              <Clock3 className="h-4 w-4 text-muted" />
            </div>
            <p className="mt-4 text-xl font-bold tracking-tight text-heading">
              {formatDate(user?.createdAt) || empty}
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-border" />
          </div>

          {/* last updated */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                {t('profilePage.fields.lastUpdated')}
              </p>
              <Clock3 className="h-4 w-4 text-muted" />
            </div>
            <p className="mt-4 text-xl font-bold tracking-tight text-heading">
              {formatDate(user?.updatedAt) || empty}
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-border" />
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── QuickStat: compact pill for hero strip ─────────────────────────────── */
function QuickStat({ label, value, ltr = false }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-border/70 bg-surface/80 px-4 py-3 backdrop-blur-sm sm:min-w-[180px]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-heading ${ltr ? 'direction-ltr text-left' : ''}`}>
        {value || t('common.placeholder.empty')}
      </p>
    </div>
  );
}