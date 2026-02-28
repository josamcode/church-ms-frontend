import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { notificationsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Card, { CardHeader } from '../../../components/ui/Card';
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
  const { id } = useParams();
  const { t } = useI18n();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('NOTIFICATIONS_UPDATE');

  const { data: detailsRes, isLoading } = useQuery({
    queryKey: ['notifications', 'details', id],
    queryFn: async () => {
      const { data } = await notificationsApi.getById(id);
      return data;
    },
    enabled: Boolean(id),
  });

  const notification = detailsRes?.data || null;

  const detailBlocks = useMemo(
    () => (Array.isArray(notification?.details) ? notification.details : []),
    [notification]
  );

  if (isLoading) {
    return <div className="py-10 text-sm text-muted">{t('common.loading')}</div>;
  }

  if (!notification) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <h3 className="text-lg font-semibold text-heading">{t('notifications.details.notFoundTitle')}</h3>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('notifications.page'), href: '/dashboard/notifications' },
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
              <Badge variant="primary">{localizeNotificationTypeName(notification.type?.name, t)}</Badge>
              <Badge variant={notification.isActive ? 'success' : 'default'}>
                {notification.isActive ? t('notifications.status.active') : t('notifications.status.inactive')}
              </Badge>
              <span className="text-xs text-white/80">
                <CalendarDays className="mb-0.5 me-1 inline h-3 w-3" />
                {notification.eventDate ? formatDateTime(notification.eventDate) : formatDateTime(notification.createdAt)}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-white">{notification.name}</h1>
            {notification.summary ? <p className="max-w-3xl text-sm text-white/85">{notification.summary}</p> : null}
          </div>
        </div>
      </section>

      <Card>
        <CardHeader
          title={t('notifications.details.section')}
          subtitle={t('notifications.details.subtitle')}
        />

        {detailBlocks.length === 0 ? (
          <p className="text-sm text-muted">{t('notifications.details.empty')}</p>
        ) : (
          <div className="space-y-4">
            {detailBlocks.map((detail, index) => (
              <div key={detail.id || `${detail.kind}-${index}`} className="space-y-3 rounded-xl border border-border bg-surface-alt/40 p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    {detail.kind === 'text'
                      ? t('notifications.detailKinds.text')
                      : detail.kind === 'link'
                        ? t('notifications.detailKinds.link')
                        : t('notifications.detailKinds.image')}
                  </Badge>
                </div>
                <DetailBlock detail={detail} t={t} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" icon={ArrowRight} onClick={() => navigate('/dashboard/notifications')}>
          {t('common.actions.back')}
        </Button>
        {canEdit ? (
          <Button type="button" icon={Edit} onClick={() => navigate(`/dashboard/notifications/${notification.id}/edit`)}>
            {t('common.actions.edit')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
