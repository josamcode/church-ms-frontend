import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Save, Users, CalendarClock } from 'lucide-react';
import { confessionsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import PageHeader from '../../../components/ui/PageHeader';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { useI18n } from '../../../i18n/i18n';
import useNavigateToUser from '../../../hooks/useNavigateToUser';

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

/* ── page ────────────────────────────────────────────────────────────────── */

export default function ConfessionAlertsPage() {
  const { hasPermission } = useAuth();
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const navigateToUser = useNavigateToUser();

  const canManageThreshold = hasPermission('CONFESSIONS_ALERTS_MANAGE');
  const [searchName, setSearchName] = useState('');
  const [alertsPage, setAlertsPage] = useState(1);
  const [thresholdDraft, setThresholdDraft] = useState('');
  const alertsPageSize = 100;

  /* ── queries ── */
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
    queryKey: ['confessions', 'alerts', { fullName: searchName, page: alertsPage, limit: alertsPageSize }],
    queryFn: async () => {
      const { data } = await confessionsApi.getAlerts({
        page: alertsPage,
        limit: alertsPageSize,
        ...(searchName && { fullName: searchName }),
      });
      return data?.data || null;
    },
    keepPreviousData: true,
    staleTime: 30000,
  });

  /* ── mutation ── */
  const updateThresholdMutation = useMutation({
    mutationFn: (value) => confessionsApi.updateAlertConfig(value),
    onSuccess: () => {
      toast.success(t('confessions.alerts.thresholdUpdated'));
      queryClient.invalidateQueries({ queryKey: ['confessions', 'alert-config'] });
      queryClient.invalidateQueries({ queryKey: ['confessions', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['confessions', 'analytics'] });
    },
    onError: (err) => toast.error(normalizeApiError(err).message),
  });

  /* ── derived ── */
  const thresholdDays = alertsRes?.thresholdDays || configRes?.alertThresholdDays || 0;
  const alerts = useMemo(
    () => (Array.isArray(alertsRes?.alerts) ? alertsRes.alerts : []),
    [alertsRes?.alerts]
  );
  const alertsCount = alertsRes?.count ?? alerts.length;
  const alertsMeta = alertsRes?.meta || {};
  const alertsTotalPages = Math.max(Number(alertsMeta.totalPages) || 1, 1);
  const currentAlertsPage = Number(alertsMeta.page) || alertsPage;

  useEffect(() => {
    if (alertsPage > alertsTotalPages) {
      setAlertsPage(alertsTotalPages);
    }
  }, [alertsPage, alertsTotalPages]);

  const handleSaveThreshold = () => {
    const parsed = parseInt(thresholdDraft, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error(t('confessions.alerts.thresholdValidation'));
      return;
    }
    updateThresholdMutation.mutate(parsed);
  };

  /* ── table columns ── */
  const columns = useMemo(() => [
    {
      key: 'fullName',
      label: t('confessions.alerts.columns.user'),
      render: (row) => (
        <button
          type="button"
          onClick={() => navigateToUser(row.userId)}
          className="group text-start"
        >
          <p className="font-medium text-heading transition-colors group-hover:text-primary">
            {row.fullName}
          </p>
          {row.phonePrimary && (
            <p className="text-xs text-muted direction-ltr">{row.phonePrimary}</p>
          )}
        </button>
      ),
    },
    {
      key: 'lastSessionAt',
      label: t('confessions.alerts.columns.lastSession'),
      render: (row) => (
        <span className="text-sm text-heading">
          {row.lastSessionAt
            ? formatDateTime(row.lastSessionAt)
            : <span className="text-muted">{t('confessions.alerts.neverAttended')}</span>}
        </span>
      ),
    },
    {
      key: 'daysSinceLastSession',
      label: t('confessions.alerts.columns.daysSince'),
      render: (row) => (
        <span className="font-semibold text-heading">
          {row.daysSinceLastSession == null
            ? <span className="text-muted">{t('confessions.alerts.noSessions')}</span>
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
  ], [navigateToUser, t, thresholdDays]);

  /* ── render ── */
  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('confessions.alerts.page') },
        ]}
      />

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('shared.dashboard')}
        title={t('confessions.alerts.title')}
        subtitle={t('confessions.alerts.subtitle')}
        actions={(
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold
            ${alertsCount > 0
              ? 'border-danger/30 bg-danger-light text-danger'
              : 'border-success/30 bg-success-light text-success'
            }`}
          >
            <BellRing className="h-3.5 w-3.5" />
            {alertsCount} {t('confessions.alerts.alertedUsers')}
          </div>
        )}
      />

      {/* ══ KPI + SETTINGS ROW ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* threshold tile */}
        <StatCard
          icon={CalendarClock}
          label={t('confessions.alerts.currentThreshold')}
          value={thresholdDays || '—'}
          hint={t('confessions.alerts.daysWord')}
          tone="gold"
          isRTL={isRTL}
        />

        {/* alerted users tile */}
        <StatCard
          icon={Users}
          label={t('confessions.alerts.alertedUsers')}
          value={alertsCount}
          hint={t('confessions.alerts.alertedUsers')}
          tone={alertsCount > 0 ? 'danger' : 'success'}
          isRTL={isRTL}
        />

        {/* threshold settings tile */}
        <Card padding="sm" className="flex flex-col">
          <p className="section-label">{t('confessions.alerts.settingsTitle')}</p>
          <p className="mt-1 text-xs text-muted">{t('confessions.alerts.settingsSubtitle')}</p>

          {!canManageThreshold ? (
            <p className="mt-4 text-sm text-muted">{t('confessions.alerts.noManagePermission')}</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <Input
                label={t('confessions.alerts.thresholdLabel')}
                type="number"
                min="1"
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(e.target.value)}
                placeholder={configLoading ? t('common.loading') : t('confessions.alerts.thresholdPlaceholder')}
                containerClassName="!mb-0"
              />
              <Button
                icon={Save}
                onClick={handleSaveThreshold}
                loading={updateThresholdMutation.isPending}
                className="w-full"
              >
                {t('confessions.alerts.saveThreshold')}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ══ ALERTS TABLE ════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('confessions.alerts.page')}</SectionLabel>
          <span className="text-xs text-muted">{alertsCount}</span>
        </div>

        {/* search */}
        <div className="max-w-sm">
          <SearchInput
            value={searchName}
            onChange={(nextValue) => {
              setSearchName(nextValue);
              setAlertsPage(1);
            }}
            placeholder={t('confessions.alerts.searchPlaceholder')}
          />
        </div>

        <div className="overflow-hidden tttable">
          <Table
            columns={columns}
            data={alerts}
            loading={alertsLoading}
            emptyTitle={t('confessions.alerts.emptyTitle')}
            emptyDescription={t('confessions.alerts.emptyDescription')}
          />
          {alertsTotalPages > 1 && (
            <div className="border-t border-border px-4 pb-4 pt-2">
              <Pagination
                page={currentAlertsPage}
                totalPages={alertsTotalPages}
                onPageChange={setAlertsPage}
                loading={alertsLoading}
              />
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
