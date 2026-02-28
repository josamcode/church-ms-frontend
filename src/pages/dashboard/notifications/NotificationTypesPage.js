import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import { notificationsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import PageHeader from '../../../components/ui/PageHeader';
import Table from '../../../components/ui/Table';
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

export default function NotificationTypesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { data: typesRes, isLoading } = useQuery({
    queryKey: ['notifications', 'types'],
    queryFn: async () => {
      const { data } = await notificationsApi.listTypes();
      return data;
    },
    staleTime: 60000,
  });

  const createTypeMutation = useMutation({
    mutationFn: (typeName) => notificationsApi.createType(typeName),
    onSuccess: () => {
      toast.success(tf('notifications.messages.typeCreated', 'Notification type created successfully.'));
      setName('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['notifications', 'types'] });
    },
    onError: (queryError) => {
      toast.error(normalizeApiError(queryError).message);
    },
  });

  const types = Array.isArray(typesRes?.data) ? typesRes.data : [];

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: t('notifications.types.columns.name'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-heading">
              {localizeNotificationTypeName(row.name, t)}
            </span>
            {row.isDefault ? <Badge variant="default">{t('notifications.types.columns.default')}</Badge> : null}
          </div>
        ),
      },
      {
        key: 'order',
        label: t('notifications.types.columns.order'),
        render: (row) => <span className="text-sm text-heading">{row.order}</span>,
      },
      {
        key: 'createdAt',
        label: t('notifications.types.columns.createdAt'),
        render: (row) => <span className="text-xs text-muted">{formatDateTime(row.createdAt)}</span>,
      },
    ],
    [t]
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError(tf('notifications.validation.typeRequired', 'Notification type is required.'));
      return;
    }

    createTypeMutation.mutate(trimmed);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('notifications.page'), href: '/dashboard/notifications' },
          { label: t('notifications.types.page') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('shared.dashboard')}
        title={t('notifications.types.title')}
        subtitle={t('notifications.types.subtitle')}
      />

      <section className="space-y-3">
        <SectionLabel>{t('notifications.types.createTitle')}</SectionLabel>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-[1fr_auto]">
          <Input
            label={t('notifications.types.form.name')}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            error={error}
            containerClassName="!mb-0"
          />
          <div className="flex items-end">
            <Button type="submit" icon={Plus} loading={createTypeMutation.isPending}>
              {t('common.actions.add')}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('notifications.types.page')}</SectionLabel>
          <span className="text-xs text-muted">{types.length}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Table
            columns={columns}
            data={types}
            loading={isLoading}
            emptyTitle={t('notifications.types.empty.title')}
            emptyDescription={t('notifications.types.empty.description')}
          />
        </div>
      </section>
    </div>
  );
}
