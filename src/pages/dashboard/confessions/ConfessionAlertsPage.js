import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Save } from 'lucide-react';
import { confessionsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { formatDateTime } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { useI18n } from '../../../i18n/i18n';

export default function ConfessionAlertsPage() {
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const canManageThreshold = hasPermission('CONFESSIONS_ALERTS_MANAGE');
  const [searchName, setSearchName] = useState('');
  const [thresholdDraft, setThresholdDraft] = useState('');

  const { data: configRes, isLoading: configLoading } = useQuery({
    queryKey: ['confessions', 'alert-config'],
    queryFn: async () => {
      const { data } = await confessionsApi.getAlertConfig();
      return data?.data || null;
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (configRes?.alertThresholdDays) {
      setThresholdDraft(String(configRes.alertThresholdDays));
    }
  }, [configRes]);

  const { data: alertsRes, isLoading: alertsLoading } = useQuery({
    queryKey: ['confessions', 'alerts', { fullName: searchName }],
    queryFn: async () => {
      const { data } = await confessionsApi.getAlerts({
        ...(searchName && { fullName: searchName }),
      });
      return data?.data || null;
    },
    keepPreviousData: true,
    staleTime: 30000,
  });

  const updateThresholdMutation = useMutation({
    mutationFn: (value) => confessionsApi.updateAlertConfig(value),
    onSuccess: () => {
      toast.success(t('confessions.alerts.thresholdUpdated'));
      queryClient.invalidateQueries({ queryKey: ['confessions', 'alert-config'] });
      queryClient.invalidateQueries({ queryKey: ['confessions', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['confessions', 'analytics'] });
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  const thresholdDays = alertsRes?.thresholdDays || configRes?.alertThresholdDays || 0;
  const alerts = Array.isArray(alertsRes?.alerts) ? alertsRes.alerts : [];
  const alertsCount = alertsRes?.count ?? alerts.length;

  const handleSaveThreshold = () => {
    const parsed = parseInt(thresholdDraft, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error(t('confessions.alerts.thresholdValidation'));
      return;
    }
    updateThresholdMutation.mutate(parsed);
  };

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        label: t('confessions.alerts.columns.user'),
        render: (row) => (
          <div>
            <p className="font-medium text-heading">{row.fullName}</p>
            {row.phonePrimary && (
              <p className="text-xs text-muted direction-ltr text-left">{row.phonePrimary}</p>
            )}
          </div>
        ),
      },
      {
        key: 'lastSessionAt',
        label: t('confessions.alerts.columns.lastSession'),
        render: (row) => (row.lastSessionAt ? formatDateTime(row.lastSessionAt) : t('confessions.alerts.neverAttended')),
      },
      {
        key: 'daysSinceLastSession',
        label: t('confessions.alerts.columns.daysSince'),
        render: (row) => (
          <span className="font-medium text-heading">
            {row.daysSinceLastSession == null
              ? t('confessions.alerts.noSessions')
              : `${row.daysSinceLastSession} ${t('confessions.alerts.daysWord')}`}
          </span>
        ),
      },
      {
        key: 'status',
        label: t('confessions.alerts.columns.status'),
        render: (row) => (
          <Badge variant="danger">
            {row.daysSinceLastSession == null
              ? t('confessions.alerts.noSessionStatus', { days: thresholdDays })
              : t('confessions.alerts.overdueStatus', { days: row.daysSinceLastSession })}
          </Badge>
        ),
      },
    ],
    [t, thresholdDays]
  );

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('confessions.alerts.page') },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t('confessions.alerts.title')}
            subtitle={t('confessions.alerts.subtitle')}
            action={<BellRing className="w-5 h-5 text-danger" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-surface-alt p-4">
              <p className="text-xs text-muted mb-1">{t('confessions.alerts.currentThreshold')}</p>
              <p className="text-2xl font-bold text-heading">
                {thresholdDays || t('common.placeholder.empty')} {t('confessions.alerts.daysWord')}
              </p>
            </div>
            <div className="rounded-md border border-border bg-surface-alt p-4">
              <p className="text-xs text-muted mb-1">{t('confessions.alerts.alertedUsers')}</p>
              <p className="text-2xl font-bold text-heading">{alertsCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={t('confessions.alerts.settingsTitle')}
            subtitle={t('confessions.alerts.settingsSubtitle')}
          />
          {!canManageThreshold ? (
            <p className="text-sm text-muted">{t('confessions.alerts.noManagePermission')}</p>
          ) : (
            <>
              <Input
                label={t('confessions.alerts.thresholdLabel')}
                type="number"
                min="1"
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(e.target.value)}
                placeholder={configLoading ? t('common.loading') : t('confessions.alerts.thresholdPlaceholder')}
              />
              <Button
                icon={Save}
                onClick={handleSaveThreshold}
                loading={updateThresholdMutation.isPending}
                className="w-full"
              >
                {t('confessions.alerts.saveThreshold')}
              </Button>
            </>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <SearchInput
            value={searchName}
            onChange={setSearchName}
            placeholder={t('confessions.alerts.searchPlaceholder')}
          />
        </div>

        <Table
          columns={columns}
          data={alerts}
          loading={alertsLoading}
          emptyTitle={t('confessions.alerts.emptyTitle')}
          emptyDescription={t('confessions.alerts.emptyDescription')}
        />
      </Card>
    </div>
  );
}
