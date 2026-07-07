import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Edit, FileText, Link2, Image as ImageIcon, ListTree } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { notificationsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import PageHeader from '../../../components/ui/PageHeader';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { localizeNotificationTypeName } from '../../../utils/notificationTypeLocalization';

function DetailBlock({ detail, t }) {
  if (detail.kind === 'text') {
    return (
      <div className="space-y-2">
        {detail.title ? <h4 className="text-sm font-semibold text-heading">{detail.title}</h4> : null}
        <p className="whitespace-pre-wrap text-sm text-heading">{detail.content}</p>
      </div>
    );
  }

  if (detail.kind === 'link') {
    return (
      <div className="space-y-2">
        {detail.title ? <h4 className="text-sm font-semibold text-heading">{detail.title}</h4> : null}
        <a href={detail.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
          {detail.content || detail.url}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {detail.title ? <h4 className="text-sm font-semibold text-heading">{detail.title}</h4> : null}
      {detail.url ? (
        <img src={detail.url} alt={detail.title || ''} className="max-h-[420px] w-full rounded-xl border border-border object-contain" />
      ) : null}
      {detail.content ? <p className="text-xs text-muted">{detail.content}</p> : null}
    </div>
  );
}

export default function NotificationDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const isAidNotificationRoute = location.pathname.startsWith('/dashboard/lords-brethren/aid-history/notifications');

  const canEdit = hasPermission('NOTIFICATIONS_UPDATE') && !isAidNotificationRoute;

  const { data: detailsRes, isLoading } = useQuery({
    queryKey: ['notifications', 'details', id],
    queryFn: async () => {
      const { data } = await notificationsApi.getById(id);
      return data;
    },
    enabled: Boolean(id),
  });

  const notification = detailsRes?.data || null;
  const isAidReminder = notification?.sourceType === 'aid_recurring';
  const listHref = isAidNotificationRoute || isAidReminder
    ? '/dashboard/lords-brethren/aid-history/notifications'
    : '/dashboard/notifications';
  const listLabel = isAidNotificationRoute || isAidReminder
    ? t('dashboardLayout.menu.disbursedAidHistory')
    : t('notifications.page');

  const detailBlocks = useMemo(
    () => (Array.isArray(notification?.details) ? notification.details : []),
    [notification]
  );

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Skeleton className="h-[280px] w-full rounded-3xl" />
        <Card>
          <Skeleton className="h-5 w-1/3" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      </div>
    );
  }

  if (!notification) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title={t('notifications.details.notFoundTitle')}
        />
      </Card>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: listLabel, href: listHref },
          { label: notification.name },
        ]}
      />

      <section className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="relative min-h-[280px]">
          {notification.coverImageUrl ? (
            <img src={notification.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/15 to-surface-alt" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/5" />

          <div className="absolute bottom-0 left-0 right-0 space-y-3 p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" className='bg-primary text-white'>{localizeNotificationTypeName(notification.type?.name, t)}</Badge>
              <Badge variant={notification.isActive ? 'success' : 'default'}>
                {notification.isActive ? t('notifications.status.active') : t('notifications.status.inactive')}
              </Badge>
              <span className="text-xs text-white/80">
                <CalendarDays className="mb-0.5 me-1 inline h-3 w-3" />
                {notification.eventDate ? formatDateTime(notification.eventDate) : formatDateTime(notification.createdAt)}
              </span>
            </div>

            <PageHeader
              contentOnly
              title={notification.name}
              subtitle={notification.summary}
              titleClassName="mt-0 text-3xl font-bold leading-tight text-white"
              subtitleClassName="mt-0 max-w-3xl text-sm text-white/85"
            />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader
          icon={ListTree}
          title={t('notifications.details.section')}
          subtitle={t('notifications.details.subtitle')}
          action={detailBlocks.length > 0 ? (
            <Badge variant="primary">{detailBlocks.length}</Badge>
          ) : null}
        />

        {detailBlocks.length === 0 ? (
          <EmptyState
            compact
            icon={ListTree}
            title={t('notifications.details.empty')}
          />
        ) : (
          <div className="space-y-4">
            {detailBlocks.map((detail, index) => {
              const KindIcon = detail.kind === 'link' ? Link2 : detail.kind === 'image' ? ImageIcon : FileText;
              const kindLabel = detail.kind === 'text'
                ? t('notifications.detailKinds.text')
                : detail.kind === 'link'
                  ? t('notifications.detailKinds.link')
                  : t('notifications.detailKinds.image');

              return (
                <div key={detail.id || `${detail.kind}-${index}`} className="space-y-3 rounded-xl border border-border bg-surface-alt/40 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="gap-1.5">
                      <KindIcon className="h-3 w-3" />
                      {kindLabel}
                    </Badge>
                  </div>
                  <DetailBlock detail={detail} t={t} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" icon={ArrowRight} onClick={() => navigate(listHref)}>
          {t('common.actions.back')}
        </Button>
        {canEdit && !isAidReminder ? (
          <Button type="button" icon={Edit} onClick={() => navigate(`/dashboard/notifications/${notification.id}/edit`)}>
            {t('common.actions.edit')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
