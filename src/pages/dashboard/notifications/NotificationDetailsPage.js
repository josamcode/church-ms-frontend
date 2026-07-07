import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Edit,
  FileText,
  Image as ImageIcon,
  Link2,
  ListTree,
  Tag,
} from 'lucide-react';
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
import Section from '../../../components/ui/Section';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { localizeNotificationTypeName } from '../../../utils/notificationTypeLocalization';

function DetailBlock({ detail, t }) {
  if (detail.kind === 'text') {
    return (
      <div className="space-y-2">
        {detail.title ? <h4 className="text-sm font-semibold text-heading">{detail.title}</h4> : null}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-heading">{detail.content}</p>
      </div>
    );
  }

  if (detail.kind === 'link') {
    return (
      <div className="space-y-2">
        {detail.title ? <h4 className="text-sm font-semibold text-heading">{detail.title}</h4> : null}
        <a
          href={detail.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Link2 className="h-3.5 w-3.5" />
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

/** Meta chip in the hero */
function MetaChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
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

  const typeName = localizeNotificationTypeName(notification?.type?.name, t);

  /* count of detail blocks by kind — read-only derivation */
  const blockCounts = useMemo(() => {
    return detailBlocks.reduce(
      (acc, block) => {
        if (block.kind === 'link') acc.link += 1;
        else if (block.kind === 'image') acc.image += 1;
        else acc.text += 1;
        return acc;
      },
      { text: 0, link: 0, image: 0 }
    );
  }, [detailBlocks]);

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Skeleton className="h-[280px] w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-xl" />
          ))}
        </div>
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

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
        <div className="relative min-h-[300px]">
          {notification.coverImageUrl ? (
            <img src={notification.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/15 to-surface-alt" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/5" />

          <div className="absolute bottom-0 left-0 right-0 space-y-3 p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" className="bg-primary text-white">{typeName}</Badge>
              <Badge variant={notification.isActive ? 'success' : 'default'} dot>
                {notification.isActive ? t('notifications.status.active') : t('notifications.status.inactive')}
              </Badge>
              <MetaChip icon={CalendarDays}>
                {notification.eventDate ? formatDateTime(notification.eventDate) : formatDateTime(notification.createdAt)}
              </MetaChip>
            </div>

            <PageHeader
              contentOnly
              title={notification.name}
              subtitle={notification.summary}
              titleClassName="mt-0 text-3xl font-bold leading-tight text-white"
              subtitleClassName="mt-1 max-w-3xl text-sm leading-relaxed text-white/85"
            />
          </div>
        </div>
      </section>

      {/* ══ META FACTS ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
            <Tag className="h-3.5 w-3.5" />
            {t('notifications.form.type')}
          </p>
          <p className="mt-1.5 truncate text-sm font-semibold text-heading">{typeName}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            {t('notifications.form.eventDate')}
          </p>
          <p className="mt-1.5 truncate text-sm font-semibold text-heading">
            {notification.eventDate ? formatDateTime(notification.eventDate) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            {t('notifications.status.active')}
          </p>
          <div className="mt-1.5">
            <Badge variant={notification.isActive ? 'success' : 'default'} dot>
              {notification.isActive ? t('notifications.status.active') : t('notifications.status.inactive')}
            </Badge>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
            <ListTree className="h-3.5 w-3.5" />
            {t('notifications.details.section')}
          </p>
          <p className="mt-1.5 text-sm font-semibold text-heading">{detailBlocks.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,300px)]">
        {/* ══ DETAIL BLOCKS ═════════════════════════════════════════════ */}
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
                  <div key={detail.id || `${detail.kind}-${index}`} className="overflow-hidden rounded-xl border border-border bg-surface-alt/40">
                    <div className="flex items-center gap-2 border-b border-border/70 bg-surface/60 px-4 py-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <KindIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">{kindLabel}</span>
                    </div>
                    <div className="p-4">
                      <DetailBlock detail={detail} t={t} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ══ LIFECYCLE TIMELINE ════════════════════════════════════════ */}
        <div className="space-y-6">
          <Section title={t('notifications.form.eventDate')} icon={CalendarDays}>
            <ol className="relative space-y-6">
              {[
                {
                  key: 'created',
                  icon: CalendarPlus,
                  iconWrap: 'border-border bg-surface-alt text-muted',
                  label: t('notifications.form.createTitle'),
                  value: formatDateTime(notification.createdAt),
                },
                {
                  key: 'event',
                  icon: CalendarDays,
                  iconWrap: 'border-primary/20 bg-primary/10 text-primary',
                  label: t('notifications.form.eventDate'),
                  value: notification.eventDate ? formatDateTime(notification.eventDate) : '—',
                },
              ].map((event, index, arr) => {
                const Icon = event.icon;
                const isLast = index === arr.length - 1;
                return (
                  <li key={event.key} className="relative flex gap-4">
                    {!isLast && (
                      <span
                        className="absolute top-9 h-[calc(100%+0.5rem)] w-px bg-border ltr:left-[17px] rtl:right-[17px]"
                        aria-hidden
                      />
                    )}
                    <span
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${event.iconWrap}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 pt-1">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{event.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-heading">{event.value}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Section>

          {(blockCounts.text > 0 || blockCounts.link > 0 || blockCounts.image > 0) ? (
            <Section title={t('notifications.details.section')} icon={ListTree}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <FileText className="h-4 w-4" />
                    {t('notifications.detailKinds.text')}
                  </span>
                  <span className="font-semibold tabular-nums text-heading">{blockCounts.text}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <Link2 className="h-4 w-4" />
                    {t('notifications.detailKinds.link')}
                  </span>
                  <span className="font-semibold tabular-nums text-heading">{blockCounts.link}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <ImageIcon className="h-4 w-4" />
                    {t('notifications.detailKinds.image')}
                  </span>
                  <span className="font-semibold tabular-nums text-heading">{blockCounts.image}</span>
                </div>
              </div>
            </Section>
          ) : null}
        </div>
      </div>

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
