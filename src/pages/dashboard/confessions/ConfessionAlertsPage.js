import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  Save,
  Users,
  CalendarClock,
  AlertTriangle,
  UserX,
  ShieldCheck,
  Settings2,
} from 'lucide-react';
import { confessionsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card from '../../../components/ui/Card';
import Section from '../../../components/ui/Section';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
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

  /* ── read-only presentation counts + severity ordering ── */
  const neverAttendedCount = useMemo(
    () => alerts.filter((row) => row.daysSinceLastSession == null).length,
    [alerts]
  );
  const maxOverdueDays = useMemo(
    () =>
      alerts.reduce(
        (max, row) =>
          typeof row.daysSinceLastSession === 'number'
            ? Math.max(max, row.daysSinceLastSession)
            : max,
        0
      ),
    [alerts]
  );
  // Presentation-only ordering: most urgent first (never-attended, then longest overdue).
  const sortedAlerts = useMemo(() => {
    const rank = (row) =>
      row.daysSinceLastSession == null ? Number.POSITIVE_INFINITY : row.daysSinceLastSession;
    return [...alerts].sort((a, b) => rank(b) - rank(a));
  }, [alerts]);

  const severityForRow = useCallback(
    (row) => {
      if (row.daysSinceLastSession == null) return 'danger';
      const ratio = thresholdDays > 0 ? row.daysSinceLastSession / thresholdDays : 1;
      if (ratio >= 2) return 'danger';
      if (ratio >= 1.4) return 'warning';
      return 'info';
    },
    [thresholdDays]
  );

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

  const allCaughtUp = !alertsLoading && alertsCount === 0 && !searchName;

  /* ── table columns ── */
  const columns = useMemo(() => [
    {
      key: 'fullName',
      label: t('confessions.alerts.columns.user'),
      render: (row) => (
        <button
          type="button"
          onClick={() => navigateToUser(row.userId)}
          className="group flex items-center gap-3 text-start"
        >
          <span
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              row.daysSinceLastSession == null
                ? 'bg-danger/10 text-danger'
                : 'bg-warning/10 text-warning'
            }`}
          >
            {String(row.fullName || '؟').trim().charAt(0)}
          </span>
          <span className="min-w-0">
            <p className="truncate font-semibold text-heading transition-colors group-hover:text-primary">
              {row.fullName}
            </p>
            {row.phonePrimary && (
              <p className="text-xs text-muted direction-ltr">{row.phonePrimary}</p>
            )}
          </span>
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
            : <span className="font-medium text-danger">{t('confessions.alerts.neverAttended')}</span>}
        </span>
      ),
    },
    {
      key: 'daysSinceLastSession',
      label: t('confessions.alerts.columns.daysSince'),
      render: (row) =>
        row.daysSinceLastSession == null ? (
          <span className="text-sm font-medium text-muted">{t('confessions.alerts.noSessions')}</span>
        ) : (
          <span className="inline-flex items-baseline gap-1">
            <span className="text-xl font-bold leading-none text-heading">
              {row.daysSinceLastSession}
            </span>
            <span className="text-xs text-muted">{t('confessions.alerts.daysWord')}</span>
          </span>
        ),
    },
    {
      key: 'status',
      label: t('confessions.alerts.columns.status'),
      render: (row) => (
        <Badge variant={severityForRow(row)} dot>
          {row.daysSinceLastSession == null
            ? t('confessions.alerts.noSessionStatus', { days: thresholdDays })
            : t('confessions.alerts.overdueStatus', { days: row.daysSinceLastSession })}
        </Badge>
      ),
    },
  ], [navigateToUser, t, thresholdDays, severityForRow]);

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
        eyebrow={t('confessions.alerts.page')}
        title={t('confessions.alerts.title')}
        subtitle={t('confessions.alerts.subtitle')}
        actions={(
          <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold
            ${alertsCount > 0
              ? 'border-danger/30 bg-danger-light text-danger'
              : 'border-success/30 bg-success-light text-success'
            }`}
          >
            {alertsCount > 0 ? <BellRing className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {alertsCount} {t('confessions.alerts.alertedUsers')}
          </div>
        )}
      />

      {/* ══ KPI STRIP ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label={t('confessions.alerts.alertedUsers')}
          value={alertsCount}
          hint={t('confessions.alerts.subtitle')}
          tone={alertsCount > 0 ? 'danger' : 'success'}
          isRTL={isRTL}
        />
        <StatCard
          icon={UserX}
          label={t('confessions.alerts.neverAttended')}
          value={neverAttendedCount}
          hint={t('confessions.alerts.noSessions')}
          tone={neverAttendedCount > 0 ? 'warning' : 'success'}
          isRTL={isRTL}
        />
        <StatCard
          icon={AlertTriangle}
          label={t('confessions.alerts.columns.daysSince')}
          value={maxOverdueDays > 0 ? `${maxOverdueDays}` : '—'}
          hint={t('confessions.alerts.daysWord')}
          tone={maxOverdueDays >= thresholdDays * 2 && maxOverdueDays > 0 ? 'danger' : 'warning'}
          isRTL={isRTL}
        />
        <StatCard
          icon={CalendarClock}
          label={t('confessions.alerts.currentThreshold')}
          value={thresholdDays || '—'}
          hint={t('confessions.alerts.daysWord')}
          tone="gold"
          isRTL={isRTL}
        />
      </div>

      {/* ══ ALERT SETTINGS ══════════════════════════════════════════════ */}
      <Section
        icon={Settings2}
        title={t('confessions.alerts.settingsTitle')}
        description={t('confessions.alerts.settingsSubtitle')}
      >
        {!canManageThreshold ? (
          <p className="text-sm text-muted">{t('confessions.alerts.noManagePermission')}</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:max-w-xs sm:flex-1">
              <Input
                label={t('confessions.alerts.thresholdLabel')}
                type="number"
                min="1"
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(e.target.value)}
                placeholder={configLoading ? t('common.loading') : t('confessions.alerts.thresholdPlaceholder')}
                containerClassName="!mb-0"
              />
            </div>
            <Button
              icon={Save}
              onClick={handleSaveThreshold}
              loading={updateThresholdMutation.isPending}
            >
              {t('confessions.alerts.saveThreshold')}
            </Button>
          </div>
        )}
      </Section>

      {/* ══ FOLLOW-UP CENTER ════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('confessions.alerts.page')}</SectionLabel>
          {alertsCount > 0 && (
            <span className="rounded-full bg-danger-light px-2.5 py-0.5 text-xs font-semibold text-danger">
              {alertsCount}
            </span>
          )}
        </div>

        {/* filter bar */}
        <Card tone="muted" padding="sm">
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
        </Card>

        {allCaughtUp ? (
          <Card padding="lg" className="border-success/20 bg-success/[0.04]">
            <EmptyState
              icon={ShieldCheck}
              title={t('confessions.alerts.emptyTitle')}
              description={t('confessions.alerts.emptyDescription')}
            />
          </Card>
        ) : (
          <div>
            <Table
              columns={columns}
              data={sortedAlerts}
              loading={alertsLoading}
              renderMode="auto"
              emptyIcon={BellRing}
              emptyTitle={t('confessions.alerts.emptyTitle')}
              emptyDescription={t('confessions.alerts.emptyDescription')}
            />
            {alertsTotalPages > 1 && (
              <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
                <Pagination
                  page={currentAlertsPage}
                  totalPages={alertsTotalPages}
                  onPageChange={setAlertsPage}
                  loading={alertsLoading}
                />
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
