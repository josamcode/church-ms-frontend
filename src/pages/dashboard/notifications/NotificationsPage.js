import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { notificationsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { localizeNotificationTypeName } from '../../../utils/notificationTypeLocalization';

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">{children}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('NOTIFICATIONS_CREATE');
  const canEdit = hasPermission('NOTIFICATIONS_UPDATE');
  const canManageTypes = hasPermission('NOTIFICATIONS_TYPES_MANAGE');

  const [filters, setFilters] = useState({ q: '', typeId: '', isActive: 'all' });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(20);

  useEffect(() => {
    setCursor(null);
    setCursorStack([null]);
  }, [filters.q, filters.typeId, filters.isActive]);

  const { data: typesRes } = useQuery({
    queryKey: ['notifications', 'types'],
    queryFn: async () => {
      const { data } = await notificationsApi.listTypes();
      return data;
    },
    staleTime: 60000,
  });

  const typeOptions = useMemo(() => {
    const types = Array.isArray(typesRes?.data) ? typesRes.data : [];
    return types.map((type) => ({
      value: type.id,
      label: localizeNotificationTypeName(type.name, t),
    }));
  }, [typesRes, t]);

  const listParams = useMemo(() => {
    const params = {
      limit,
      order: 'desc',
      ...(cursor && { cursor }),
      ...(filters.q.trim() && { q: filters.q.trim() }),
      ...(filters.typeId && { typeId: filters.typeId }),
    };

    if (filters.isActive === 'active') params.isActive = true;
    if (filters.isActive === 'inactive') params.isActive = false;

    return params;
  }, [cursor, filters, limit]);

  const { data: listRes, isLoading } = useQuery({
    queryKey: ['notifications', 'list', listParams],
    queryFn: async () => {
      const { data } = await notificationsApi.list(listParams);
      return data;
    },
    keepPreviousData: true,
    staleTime: 30000,
  });

  const notifications = Array.isArray(listRes?.data) ? listRes.data : [];
  const meta = listRes?.meta || null;

  const hasActiveFilters = Boolean(filters.q || filters.typeId || filters.isActive !== 'all');

  const handleNext = () => {
    if (!meta?.nextCursor) return;
    setCursorStack((prev) => [...prev, meta.nextCursor]);
    setCursor(meta.nextCursor);
  };

  const handlePrev = () => {
    setCursorStack((prev) => {
      const next = prev.slice(0, -1);
      setCursor(next[next.length - 1] || null);
      return next;
    });
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: t('notifications.columns.name'),
        render: (row) => (
          <div className="space-y-1">
            <p className="font-medium text-heading">{row.name}</p>
            {row.summary ? <p className="text-xs text-muted line-clamp-2">{row.summary}</p> : null}
          </div>
        ),
      },
      {
        key: 'type',
        label: t('notifications.columns.type'),
        render: (row) => (
          <Badge variant="primary">
            {localizeNotificationTypeName(row.type?.name, t)}
          </Badge>
        ),
      },
      {
        key: 'detailsCount',
        label: t('notifications.columns.detailsCount'),
        render: (row) => (
          <span className="text-sm text-heading">{Array.isArray(row.details) ? row.details.length : 0}</span>
        ),
      },
      {
        key: 'eventDate',
        label: t('notifications.columns.eventDate'),
        render: (row) =>
          row.eventDate ? (
            <span className="text-sm text-heading">{formatDateTime(row.eventDate)}</span>
          ) : (
            <span className="text-sm text-muted">{t('common.placeholder.empty')}</span>
          ),
      },
      {
        key: 'status',
        label: t('notifications.columns.status'),
        render: (row) => (
          <Badge variant={row.isActive ? 'success' : 'default'}>
            {row.isActive ? t('notifications.status.active') : t('notifications.status.inactive')}
          </Badge>
        ),
      },
      {
        key: 'updatedAt',
        label: t('notifications.columns.updatedAt'),
        render: (row) => <span className="text-xs text-muted">{formatDateTime(row.updatedAt)}</span>,
      },
      {
        key: 'actions',
        label: '',
        cellClassName: 'w-[100px]',
        render: (row) =>
          canEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Pencil}
              onClick={() => navigate(`/dashboard/notifications/${row.id}/edit`)}
            >
              {t('common.actions.edit')}
            </Button>
          ) : null,
      },
    ],
    [canEdit, navigate, t]
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('notifications.page') },
        ]}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{t('shared.dashboard')}</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-heading">{t('notifications.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('notifications.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManageTypes ? (
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/notifications/types')}>
              {t('notifications.actions.manageTypes')}
            </Button>
          ) : null}
          {canCreate ? (
            <Button type="button" icon={Plus} onClick={() => navigate('/dashboard/notifications/new')}>
              {t('notifications.actions.create')}
            </Button>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('notifications.filters.title')}</SectionLabel>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => setFilters({ q: '', typeId: '', isActive: 'all' })}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t('usersListPage.filters.clear')}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            containerClassName="!mb-0"
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            placeholder={t('notifications.filters.searchPlaceholder')}
          />
          <Select
            containerClassName="mb-0"
            value={filters.typeId}
            onChange={(event) => setFilters((prev) => ({ ...prev, typeId: event.target.value }))}
            options={[{ value: '', label: t('notifications.filters.allTypes') }, ...typeOptions]}
          />
          <Select
            containerClassName="mb-0"
            value={filters.isActive}
            onChange={(event) => setFilters((prev) => ({ ...prev, isActive: event.target.value }))}
            options={[
              { value: 'all', label: t('notifications.filters.allStatus') },
              { value: 'active', label: t('notifications.status.active') },
              { value: 'inactive', label: t('notifications.status.inactive') },
            ]}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('notifications.page')}</SectionLabel>
          {meta?.count != null ? <span className="text-xs text-muted">{meta.count}</span> : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Table
            columns={columns}
            data={notifications}
            loading={isLoading}
            emptyTitle={t('notifications.empty.title')}
            emptyDescription={t('notifications.empty.description')}
          />
          <div className="border-t border-border px-4 pb-4 pt-2">
            <Pagination
              meta={meta}
              onLoadMore={handleNext}
              onPrev={handlePrev}
              cursors={cursorStack}
              loading={isLoading}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
