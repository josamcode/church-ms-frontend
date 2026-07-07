import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock, Home, LayoutGrid } from 'lucide-react';
import { visitationsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import PageHeader from '../../../components/ui/PageHeader';
import { formatDateTime } from '../../../utils/formatters';
import { useI18n } from '../../../i18n/i18n';

/* ── primitives ──────────────────────────────────────────────────────────── */

function SectionLabel({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/60" />
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </div>
  );
}

function formatMonthlyTrendLabel(item, language) {
  const year = Number(item?.year);
  const month = Number(item?.month);
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
    const date = new Date(Date.UTC(year, month - 1, 1));
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  const rawLabel = String(item?.label || '').trim();
  if (!rawLabel) return '';

  const parsed = new Date(`${rawLabel} 1`);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed);
  }

  return rawLabel;
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function PastoralVisitationAnalyticsPage() {
  const { t, language, isRTL } = useI18n();
  const [months, setMonths] = useState('1');

  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['visitations', 'analytics', { months }],
    queryFn: async () => {
      const { data } = await visitationsApi.getAnalytics({ months: Number(months) });
      return data?.data || null;
    },
    staleTime: 30000,
  });

  const summary = analyticsRes?.summary || {};
  const monthlyTrend = Array.isArray(analyticsRes?.monthlyTrend) ? analyticsRes.monthlyTrend : [];
  const topHouses = Array.isArray(analyticsRes?.topHouses) ? analyticsRes.topHouses : [];
  const topRecorders = Array.isArray(analyticsRes?.topRecorders) ? analyticsRes.topRecorders : [];

  const maxTrendCount = Math.max(...monthlyTrend.map((item) => item.count || 0), 1);
  const maxHouseCount = Math.max(...topHouses.map((item) => item.count || 0), 1);

  /* ── KPI config ── */
  const kpiTiles = [
    { label: t('visitations.analytics.cards.totalVisitations'), value: summary.totalVisitations ?? 0, icon: LayoutGrid, tone: 'default' },
    { label: t('visitations.analytics.cards.visitationsInPeriod'), value: summary.visitationsInPeriod ?? 0, icon: BarChart3, tone: 'primary' },
    { label: t('visitations.analytics.cards.uniqueHouses'), value: summary.uniqueHouses ?? 0, icon: Home, tone: 'gold' },
    {
      label: t('visitations.analytics.cards.avgDurationMinutes'),
      value: summary.avgDurationMinutes ?? 0,
      hint: t('visitations.shared.minutes'),
      icon: Clock,
      tone: 'info',
    },
  ];

  /* ── columns ── */
  const topRecordersColumns = useMemo(() => [
    {
      key: 'fullName',
      label: t('visitations.analytics.columns.recorder'),
      render: (row) => <span className="font-medium text-heading">{row.fullName}</span>,
    },
    {
      key: 'count',
      label: t('visitations.analytics.columns.records'),
      render: (row) => <Badge variant="primary">{row.count}</Badge>,
    },
    {
      key: 'totalDuration',
      label: t('visitations.analytics.columns.totalDuration'),
      render: (row) => (
        <span className="text-sm text-heading">
          {row.totalDuration || 0}{' '}
          <span className="text-muted">{t('visitations.shared.minutes')}</span>
        </span>
      ),
    },
    {
      key: 'lastRecordedAt',
      label: t('visitations.analytics.columns.lastRecord'),
      render: (row) => (
        <span className="text-xs text-muted">
          {row.lastRecordedAt ? formatDateTime(row.lastRecordedAt) : t('common.placeholder.empty')}
        </span>
      ),
    },
  ], [t]);

  /* ── render ── */
  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('visitations.analytics.page') },
        ]}
      />

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('shared.dashboard')}
        title={t('visitations.analytics.title')}
        subtitle={t('visitations.analytics.subtitle')}
        actions={(
          <div className="w-full sm:w-48">
            <Select
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              options={[
                { value: '1', label: t('visitations.analytics.period1') },
                { value: '3', label: t('visitations.analytics.period3') },
                { value: '6', label: t('visitations.analytics.period6') },
                { value: '12', label: t('visitations.analytics.period12') },
                { value: '24', label: t('visitations.analytics.period24') },
              ]}
              containerClassName="!mb-0"
            />
          </div>
        )}
      />

      {/* ══ KPI TILES ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpiTiles.map(({ label, value, hint, icon: Icon, tone }) => (
          <StatCard
            key={label}
            icon={Icon}
            label={label}
            value={value}
            hint={hint}
            tone={tone}
            isRTL={isRTL}
          />
        ))}
      </div>

      {/* ══ CHARTS ROW ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* monthly trend */}
        <Card padding="lg">
          <CardHeader icon={BarChart3} title={t('visitations.analytics.monthlyTitle')} />
          {isLoading ? (
            <p className="text-sm text-muted">{t('visitations.analytics.loading')}</p>
          ) : monthlyTrend.length === 0 ? (
            <p className="text-sm text-muted">{t('visitations.analytics.noData')}</p>
          ) : (
            <div className="space-y-4">
              {monthlyTrend.map((item) => {
                const pct = Math.max((item.count / maxTrendCount) * 100, 2);
                return (
                  <div key={`${item.year}-${item.month}`}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-heading">
                        {formatMonthlyTrendLabel(item, language)}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-primary">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* top houses */}
        <Card padding="lg">
          <CardHeader icon={Home} title={t('visitations.analytics.topHousesTitle')} />
          {isLoading ? (
            <p className="text-sm text-muted">{t('visitations.analytics.loading')}</p>
          ) : topHouses.length === 0 ? (
            <p className="text-sm text-muted">{t('visitations.analytics.noHousesData')}</p>
          ) : (
            <div className="space-y-5">
              {topHouses.map((item) => {
                const pct = Math.max((item.count / maxHouseCount) * 100, 2);
                return (
                  <div key={item.houseName}>
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-heading">
                          {item.houseName}
                        </p>
                        <p className="text-xs text-muted">
                          {t('visitations.analytics.avgPerHouse')}{' '}
                          <strong className="text-heading">{item.avgDurationMinutes}</strong>{' '}
                          {t('visitations.shared.minutes')}
                        </p>
                      </div>
                      <Badge variant="primary">{item.count}</Badge>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ══ TOP RECORDERS TABLE ═════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('visitations.analytics.topRecordersTitle')}</SectionLabel>
          <span className="text-xs text-muted">{topRecorders.length}</span>
        </div>

        <div className="overflow-hidden tttable">
          <Table
            columns={topRecordersColumns}
            data={topRecorders}
            loading={isLoading}
            emptyTitle={t('visitations.analytics.emptyTitle')}
            emptyDescription={t('visitations.analytics.emptyDescription')}
          />
        </div>
      </section>

    </div>
  );
}
