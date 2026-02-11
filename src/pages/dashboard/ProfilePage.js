import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/endpoints';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Skeleton from '../../components/ui/Skeleton';
import { formatDate, getGenderLabel, getRoleLabel } from '../../utils/formatters';
import { useI18n } from '../../i18n/i18n';
import { UserCircle, Phone, Mail, MapPin, Calendar, Tag, ShieldCheck, Clock3 } from 'lucide-react';

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
    [user?.address?.governorate, user?.address?.city, user?.address?.street].filter(Boolean).join(', ') || empty;

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('dashboardLayout.menu.profile') },
        ]}
      />

      <Card padding={false} className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {user?.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt=""
                className="h-20 w-20 rounded-2xl border border-border object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <UserCircle className="h-11 w-11 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-heading">{user?.fullName || empty}</h1>
              <p className="mt-1 text-sm text-muted direction-ltr text-left">{email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="primary">{roleLabel}</Badge>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
                {user?.ageGroup && <Badge>{user.ageGroup}</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:min-w-[220px]">
            <MiniStat label={t('profilePage.fields.primaryPhone')} value={primaryPhone} ltr />
            <MiniStat label={t('profilePage.fields.birthDate')} value={formatDate(user?.birthDate) || empty} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={t('profilePage.sections.profileDetails.title')}
            subtitle={t('profilePage.sections.profileDetails.subtitle')}
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoRow icon={Calendar} label={t('profilePage.fields.birthDate')} value={formatDate(user?.birthDate)} />
            <InfoRow icon={UserCircle} label={t('profilePage.fields.gender')} value={getGenderLabel(user?.gender)} />
            <InfoRow icon={Phone} label={t('profilePage.fields.primaryPhone')} value={primaryPhone} dir="ltr" />
            <InfoRow icon={Phone} label={t('profilePage.fields.secondaryPhone')} value={secondaryPhone} dir="ltr" />
            <InfoRow icon={Mail} label={t('profilePage.fields.email')} value={email} dir="ltr" />
            <InfoRow icon={ShieldCheck} label={t('profilePage.fields.role')} value={roleLabel} />
          </div>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader
            title={t('profilePage.sections.locationAndTags.title')}
            subtitle={t('profilePage.sections.locationAndTags.subtitle')}
          />
          <div className="space-y-3 text-sm">
            <InfoRow icon={MapPin} label={t('profilePage.fields.address')} value={addressValue} />
            <InfoRow icon={UserCircle} label={t('profilePage.fields.familyName')} value={user?.familyName || empty} />
            <div className="rounded-xl border border-border bg-surface-alt/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-muted">
                <Tag className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">{t('profilePage.fields.tags')}</span>
              </div>
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
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('profilePage.sections.accountSnapshot.title')}
          subtitle={t('profilePage.sections.accountSnapshot.subtitle')}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoRow icon={ShieldCheck} label={t('profilePage.fields.accountStatus')} value={statusLabel} tone={statusVariant} />
          <InfoRow icon={Clock3} label={t('profilePage.fields.joinedOn')} value={formatDate(user?.createdAt)} />
          <InfoRow icon={Clock3} label={t('profilePage.fields.lastUpdated')} value={formatDate(user?.updatedAt)} />
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, ltr = false }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-border/80 bg-surface/90 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-heading ${ltr ? 'direction-ltr text-left' : ''}`}>
        {value || t('common.placeholder.empty')}
      </p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, dir, tone = 'default' }) {
  const { t } = useI18n();
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-heading';

  return (
    <div className="rounded-xl border border-border bg-surface-alt/60 p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className={`mt-1 text-sm font-semibold ${toneClass} ${dir === 'ltr' ? 'direction-ltr text-left' : ''}`}>
            {value || t('common.placeholder.empty')}
          </p>
        </div>
      </div>
    </div>
  );
}
