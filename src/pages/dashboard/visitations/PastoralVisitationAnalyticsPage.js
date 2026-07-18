import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Clock, Home, LayoutGrid, TrendingUp, Trophy, Sparkles, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { visitationsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import DataCard, { RankTile } from '../../../components/ui/DataCard';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import PageHeader from '../../../components/ui/PageHeader';
import { formatDateTime } from '../../../utils/formatters';
import { useI18n } from '../../../i18n/i18n';

/* ── presentational helpers (read-only derivations) ───────────────────────── */

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

// Month-over-month % change from a numeric series. Guards divide-by-zero.
function momChange(series) {
  if (!Array.isArray(series) || series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return null;
  return Math.round(((last - prev) / prev) * 100);
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function PastoralVisitationAnalyticsPage() {
  const { t, language, isRTL } = useI18n();
  const [months, setMonths] = useState('1');

  const {
    data: analyticsRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['visitations', 'analytics', { months }],
    queryFn: async () => {
      const { data } = await visitationsApi.getAnalytics({ months: Number(months) });
      return data?.data || null;
    },
    staleTime: 30000,
  });

  const summary = analyticsRes?.summary || {};
  const monthlyTrend = useMemo(
    () => (Array.isArray(analyticsRes?.monthlyTrend) ? analyticsRes.monthlyTrend : []),
    [analyticsRes],
  );
  const topHouses = useMemo(
    () => (Array.isArray(analyticsRes?.topHouses) ? analyticsRes.topHouses : []),
    [analyticsRes],
  );
  const topRecorders = Array.isArray(analyticsRes?.topRecorders) ? analyticsRes.topRecorders : [];

  const maxTrendCount = Math.max(...monthlyTrend.map((item) => item.count || 0), 1);
  const maxHouseCount = Math.max(...topHouses.map((item) => item.count || 0), 1);

  /* ── derived series & highlights (pure, read-only) ── */
  const trendSeries = useMemo(() => monthlyTrend.map((item) => item.count || 0), [monthlyTrend]);
  const trendPct = useMemo(() => momChange(trendSeries), [trendSeries]);

  const busiestMonth = useMemo(() => {
    if (monthlyTrend.length === 0) return null;
    return monthlyTrend.reduce((best, item) => ((item.count || 0) > (best.count || 0) ? item : best), monthlyTrend[0]);
  }, [monthlyTrend]);

  const topHouse = useMemo(() => {
    if (topHouses.length === 0) return null;
    return topHouses.reduce((best, item) => ((item.count || 0) > (best.count || 0) ? item : best), topHouses[0]);
  }, [topHouses]);

  const avgPerMonth = useMemo(() => {
    if (trendSeries.length === 0) return 0;
    const total = trendSeries.reduce((sum, n) => sum + n, 0);
    return Math.round(total / trendSeries.length);
  }, [trendSeries]);

  const hasHighlights = Boolean(busiestMonth || topHouse) && trendSeries.length > 0;

  /* ── KPI config ── */
  const kpiTiles = [
    {
      key: 'totalVisitations',
      label: t('visitations.analytics.cards.totalVisitations'),
      value: summary.totalVisitations ?? 0,
      icon: LayoutGrid,
      tone: 'primary',
    },
    {
      key: 'visitationsInPeriod',
      label: t('visitations.analytics.cards.visitationsInPeriod'),
      value: summary.visitationsInPeriod ?? 0,
      icon: BarChart3,
      tone: 'info',
      spark: trendSeries,
      trend: trendPct,
      trendLabel: trendPct != null ? `${Math.abs(trendPct)}%` : undefined,
    },
    {
      key: 'uniqueHouses',
      label: t('visitations.analytics.cards.uniqueHouses'),
      value: summary.uniqueHouses ?? 0,
      icon: Home,
      tone: 'gold',
    },
    {
      key: 'avgDurationMinutes',
      label: t('visitations.analytics.cards.avgDurationMinutes'),
      value: summary.avgDurationMinutes ?? 0,
      hint: t('visitations.shared.minutes'),
      icon: Clock,
      tone: 'success',
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

  /* ── bespoke leaderboard card: rank tile, recorder name, record count and
        the total-minutes + last-record metadata ── */
  const renderTopRecorderCard = (row, rowIndex) => (
    <DataCard
      accent={rowIndex === 0 ? 'gold' : 'primary'}
      leading={<RankTile rank={rowIndex + 1} />}
      title={row.fullName}
      badge={<Badge variant="primary">{row.count}</Badge>}
      meta={
        <>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {row.totalDuration || 0} {t('visitations.shared.minutes')}
          </span>
          {row.lastRecordedAt ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatDateTime(row.lastRecordedAt)}</span>
            </>
          ) : null}
        </>
      }
    />
  );

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

      {isError ? (
        /* ══ ERROR STATE ═══════════════════════════════════════════════ */
        <Card padding="lg" tone="default" className="border-danger/25">
          <EmptyState
            icon={AlertTriangle}
            title={t('visitations.analytics.emptyTitle')}
            description={t('visitations.analytics.noData')}
            action={(
              <Button
                variant="outline"
                icon={RefreshCw}
                onClick={() => refetch()}
                aria-label={t('visitations.analytics.loading')}
              >
                {t('visitations.analytics.loading')}
              </Button>
            )}
          />
        </Card>
      ) : isLoading ? (
        /* ══ LOADING STATE ═════════════════════════════════════════════ */
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="md" className="space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-6 w-full" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} padding="lg" className="space-y-4">
                <Skeleton className="h-5 w-1/3" />
                {Array.from({ length: 5 }).map((__, j) => (
                  <Skeleton key={j} className="h-6 w-full" />
                ))}
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ══ KPI BAND ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpiTiles.map(({ key, label, value, hint, icon: Icon, tone, spark, trend, trendLabel }) => (
              <StatCard
                key={key}
                icon={Icon}
                label={label}
                value={value}
                hint={hint}
                tone={tone}
                spark={spark}
                trend={trend}
                trendLabel={trendLabel}
                isRTL={isRTL}
              />
            ))}
          </div>

          {/* ══ HIGHLIGHTS STRIP ══════════════════════════════════════════ */}
          {hasHighlights && (
            <Card padding="md" tone="gold" className="overflow-hidden">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:divide-x sm:divide-border/60 sm:rtl:divide-x-reverse">
                {busiestMonth && (
                  <div className="flex items-start gap-3 sm:px-4 sm:first:ps-0">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TrendingUp className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                        {t('visitations.analytics.monthlyTitle')}
                      </p>
                      <p className="truncate text-sm font-bold text-heading">
                        {formatMonthlyTrendLabel(busiestMonth, language)}
                      </p>
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-heading">{busiestMonth.count}</span>{' '}
                        {t('visitations.analytics.cards.visitationsInPeriod')}
                      </p>
                    </div>
                  </div>
                )}
                {topHouse && (
                  <div className="flex items-start gap-3 sm:px-4">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary">
                      <Trophy className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                        {t('visitations.analytics.topHousesTitle')}
                      </p>
                      <p className="truncate text-sm font-bold text-heading">{topHouse.houseName}</p>
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-heading">{topHouse.count}</span>{' '}
                        {t('visitations.analytics.columns.records')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 sm:px-4">
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-info/12 text-info">
                    <Sparkles className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                      {t('visitations.analytics.cards.visitationsInPeriod')}
                    </p>
                    <p className="truncate text-sm font-bold text-heading">{avgPerMonth}</p>
                    <p className="text-xs text-muted">{t('visitations.analytics.monthlySubtitle')}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ══ CHARTS ROW ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* monthly trend */}
            <Card padding="lg">
              <CardHeader
                icon={BarChart3}
                title={t('visitations.analytics.monthlyTitle')}
                subtitle={t('visitations.analytics.monthlySubtitle')}
              />
              {monthlyTrend.length === 0 ? (
                <EmptyState compact icon={BarChart3} title={t('visitations.analytics.noData')} />
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
              <CardHeader
                icon={Home}
                title={t('visitations.analytics.topHousesTitle')}
                subtitle={t('visitations.analytics.topHousesSubtitle')}
              />
              {topHouses.length === 0 ? (
                <EmptyState compact icon={Home} title={t('visitations.analytics.noHousesData')} />
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
          <Card padding="lg">
            <CardHeader
              icon={Trophy}
              title={t('visitations.analytics.topRecordersTitle')}
              subtitle={t('visitations.analytics.topRecordersSubtitle')}
              action={<Badge variant="gold">{topRecorders.length}</Badge>}
            />
            <div className="overflow-hidden tttable">
              <Table
                flush
                columns={topRecordersColumns}
                data={topRecorders}
                loading={isLoading}
                emptyTitle={t('visitations.analytics.emptyTitle')}
                emptyDescription={t('visitations.analytics.emptyDescription')}
                renderCard={renderTopRecorderCard}
              />
            </div>
          </Card>
        </>
      )}

    </div>
  );
}
