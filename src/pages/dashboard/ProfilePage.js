import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Card from '../../components/ui/Card';
import Section from '../../components/ui/Section';
import StatCard from '../../components/ui/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import {
  formatDate,
  getAccountStatusLabel,
  getAccountStatusVariant,
  getGenderLabel,
  getRoleLabel,
} from '../../utils/formatters';
import { useI18n } from '../../i18n/i18n';
import {
  Calendar, CheckCircle2, Clock3, Home, Phone,
  ShieldCheck, Tag, User,
} from 'lucide-react';

/* ── primitives ──────────────────────────────────────────────────────────── */

/** Overline label + value — the atomic key-fact row inside detail sections. */
function Field({ label, value, ltr = false, tone = 'default' }) {
  const { t } = useI18n();
  const toneClass =
    tone === 'success' ? 'text-success' :
      tone === 'danger' ? 'text-danger' :
        'text-heading';

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${toneClass} ${ltr ? 'direction-ltr text-start' : ''}`}>
        {value || t('common.placeholder.empty')}
      </p>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { t, isRTL } = useI18n();

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
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const empty = t('common.placeholder.empty');
  const roleLabel = getRoleLabel(user?.role) || empty;
  const accountStatus = user?.accountStatus || 'approved';
  const accountStatusLabel = getAccountStatusLabel(accountStatus) || empty;
  const accountStatusVariant = getAccountStatusVariant(accountStatus);
  const snapshotTone =
    accountStatusVariant === 'success' ? 'success'
      : accountStatusVariant === 'danger' ? 'danger'
        : 'warning';
  const primaryPhone = user?.phonePrimary || empty;
  const secondaryPhone = user?.phoneSecondary || empty;
  const email = user?.email || empty;
  const addressValue =
    [user?.address?.governorate, user?.address?.city, user?.address?.street]
      .filter(Boolean).join(', ') || empty;

  const household = user?.familyName || user?.houseName || empty;
  const initial = String(user?.fullName || '?').trim().charAt(0).toUpperCase();

  return (
    <div className={`animate-fade-in space-y-6 pb-10 ${isRTL ? 'direction-rtl text-right' : 'text-left'}`}>

      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('dashboardLayout.menu.profile') },
        ]}
      />

      {/* ══ IDENTITY HERO ═══════════════════════════════════════════════════
          First screen: avatar + name + role/status badges + key facts. */}
      <Card padding="lg">
        {/* identity row */}
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-start">
          {user?.avatar?.url ? (
            <img
              src={user.avatar.url}
              alt=""
              className="h-24 w-24 flex-shrink-0 rounded-2xl border border-border object-cover sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/10 text-4xl font-bold text-primary sm:h-28 sm:w-28">
              {initial}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">
              {user?.fullName || empty}
            </h1>
            <p className="mt-1 break-all text-sm text-muted direction-ltr text-start sm:text-start">
              {email}
            </p>

            {/* role + account-status badges */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <Badge variant="primary" dot>{roleLabel}</Badge>
              <Badge variant={accountStatusVariant} dot>{accountStatusLabel}</Badge>
              {user?.isLocked ? <Badge variant="danger">{t('common.status.locked')}</Badge> : null}
              {user?.ageGroup && <Badge variant="gold">{user.ageGroup}</Badge>}
            </div>
          </div>
        </div>

        {/* quick facts — the most important data above the fold */}
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-border/70 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t('profilePage.fields.familyName')} value={household} />
          <Field label={t('profilePage.fields.primaryPhone')} value={primaryPhone} ltr />
          <Field label={t('profilePage.fields.joinedOn')} value={formatDate(user?.createdAt) || empty} />
        </div>
      </Card>

      {/* ══ DETAIL SECTIONS ═════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* ── Personal ─── */}
        <Section icon={User} title={t('profilePage.sections.profileDetails.title')}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Field label={t('profilePage.fields.birthDate')} value={formatDate(user?.birthDate)} />
            <Field label={t('profilePage.fields.gender')} value={getGenderLabel(user?.gender)} />
            <Field label={t('profilePage.fields.role')} value={roleLabel} />
          </div>
        </Section>

        {/* ── Contact ─── */}
        <Section icon={Phone} title={t('profilePage.fields.primaryPhone')}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Field label={t('profilePage.fields.primaryPhone')} value={primaryPhone} ltr />
            <Field label={t('profilePage.fields.secondaryPhone')} value={secondaryPhone} ltr />
            <Field label={t('profilePage.fields.email')} value={email} ltr />
          </div>
        </Section>

        {/* ── Household & location ─── */}
        <Section
          icon={Home}
          title={t('profilePage.sections.locationAndTags.title')}
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            <Field label={t('profilePage.fields.familyName')} value={user?.familyName || empty} />
            <Field label={t('profilePage.fields.houseName')} value={user?.houseName || empty} />
            <Field label={t('profilePage.fields.address')} value={addressValue} />
          </div>

          {/* tags */}
          <div className="mt-5 border-t border-border/70 pt-5">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                {t('profilePage.fields.tags')}
              </p>
            </div>
            <div className="mt-2.5">
              {user?.tags?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.tags.map((tag) => (
                    <Badge key={tag} variant="gold">{tag}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">{empty}</p>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* ══ ACCOUNT SNAPSHOT ════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            {t('profilePage.sections.accountSnapshot.title')}
          </span>
          <div className="h-px flex-1 bg-border/70" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={user?.isLocked ? ShieldCheck : CheckCircle2}
            tone={snapshotTone}
            label={t('profilePage.fields.accountStatus')}
            value={accountStatusLabel}
            hint={user?.isLocked ? t('common.status.locked') : undefined}
            isRTL={isRTL}
          />
          <StatCard
            icon={Calendar}
            tone="primary"
            label={t('profilePage.fields.joinedOn')}
            value={formatDate(user?.createdAt) || empty}
            isRTL={isRTL}
          />
          <StatCard
            icon={Clock3}
            tone="default"
            label={t('profilePage.fields.lastUpdated')}
            value={formatDate(user?.updatedAt) || empty}
            isRTL={isRTL}
          />
        </div>
      </div>

    </div>
  );
}
