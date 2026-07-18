import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Users, CalendarDays, CalendarClock, AlertTriangle, Clock,
  TrendingUp, Sparkles, Trophy, RefreshCw,
} from 'lucide-react';
import { confessionsApi } from '../../../api/endpoints';
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
import { localizeSessionTypeName } from '../../../utils/sessionTypeLocalization';
import { useI18n } from '../../../i18n/i18n';

/* ── presentational helpers (read-only derivations) ───────────────────────── */

// Month-over-month % change from a numeric series. Guards divide-by-zero.
function momChange(series) {
  if (!Array.isArray(series) || series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return null;
  return Math.round(((last - prev) / prev) * 100);
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function ConfessionAnalyticsPage() {
  const [months, setMonths] = useState('6');
  const { t, isRTL } = useI18n();

  const {
    data: analyticsRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['confessions', 'analytics', { months }],
    queryFn: async () => {
      const { data } = await confessionsApi.getAnalytics({ months: Number(months) });
      return data?.data || null;
    },
    staleTime: 30000,
  });

  const summary = analyticsRes?.summary || {};
  const typeBreakdown = useMemo(
    () => (Array.isArray(analyticsRes?.typeBreakdown) ? analyticsRes.typeBreakdown : []),
    [analyticsRes],
  );
  const monthlyTrend = useMemo(
    () => (Array.isArray(analyticsRes?.monthlyTrend) ? analyticsRes.monthlyTrend : []),
    [analyticsRes],
  );
  const topAttendees = Array.isArray(analyticsRes?.topAttendees) ? analyticsRes.topAttendees : [];

  const maxTrendCount = Math.max(...monthlyTrend.map((item) => item.count || 0), 1);
  const maxTypeCount = Math.max(...typeBreakdown.map((item) => item.count || 0), 1);

  /* ── derived series & highlights (pure, read-only) ── */
  const trendSeries = useMemo(() => monthlyTrend.map((item) => item.count || 0), [monthlyTrend]);
  const trendPct = useMemo(() => momChange(trendSeries), [trendSeries]);

  const busiestMonth = useMemo(() => {
    if (monthlyTrend.length === 0) return null;
    return monthlyTrend.reduce((best, item) => ((item.count || 0) > (best.count || 0) ? item : best), monthlyTrend[0]);
  }, [monthlyTrend]);

  const topType = useMemo(() => {
    if (typeBreakdown.length === 0) return null;
    return typeBreakdown.reduce((best, item) => ((item.count || 0) > (best.count || 0) ? item : best), typeBreakdown[0]);
  }, [typeBreakdown]);

  const avgPerMonth = useMemo(() => {
    if (trendSeries.length === 0) return 0;
    const total = trendSeries.reduce((sum, n) => sum + n, 0);
    return Math.round(total / trendSeries.length);
  }, [trendSeries]);

  const hasHighlights = Boolean(busiestMonth || topType) && trendSeries.length > 0;

  /* ── KPI config ── */
  const kpiTiles = [
    {
      key: 'totalSessions',
      label: t('confessions.analytics.cards.totalSessions'),
      value: summary.totalSessions ?? 0,
      icon: BarChart3,
      tone: 'primary',
    },
    {
      key: 'sessionsInPeriod',
      label: t('confessions.analytics.cards.sessionsInPeriod'),
      value: summary.sessionsInPeriod ?? 0,
      icon: CalendarDays,
      tone: 'info',
      spark: trendSeries,
      trend: trendPct,
      trendLabel: trendPct != null ? `${Math.abs(trendPct)}%` : undefined,
    },
    {
      key: 'uniqueAttendees',
      label: t('confessions.analytics.cards.uniqueAttendees'),
      value: summary.uniqueAttendees ?? 0,
      icon: Users,
      tone: 'success',
    },
    {
      key: 'upcomingSessions',
      label: t('confessions.analytics.cards.upcomingSessions'),
      value: summary.upcomingSessions ?? 0,
      icon: CalendarClock,
      tone: 'gold',
    },
    {
      key: 'overdueUsers',
      label: t('confessions.analytics.cards.overdueUsers'),
      value: summary.overdueUsers ?? 0,
      icon: AlertTriangle,
      tone: (summary.overdueUsers ?? 0) > 0 ? 'warning' : 'success',
    },
    {
      key: 'alertThreshold',
      label: t('confessions.analytics.cards.alertThreshold'),
      value: `${summary.alertThresholdDays ?? 0}`,
      hint: t('confessions.alerts.daysWord'),
      icon: Clock,
      tone: 'default',
    },
  ];

  /* ── columns ── */
  const topAttendeesColumns = useMemo(() => [
    {
      key: 'fullName',
      label: t('confessions.analytics.columns.user'),
      render: (row) => <span className="font-medium text-heading">{row.fullName}</span>,
    },
    {
      key: 'sessionsCount',
      label: t('confessions.analytics.columns.sessions'),
      render: (row) => <Badge variant="primary">{row.sessionsCount}</Badge>,
    },
    {
      key: 'lastSessionAt',
      label: t('confessions.analytics.columns.lastSession'),
      render: (row) => (
        <span className="text-sm text-heading">
          {row.lastSessionAt
            ? formatDateTime(row.lastSessionAt)
            : <span className="text-muted">{t('common.placeholder.empty')}</span>}
        </span>
      ),
    },
  ], [t]);

  /* ── bespoke leaderboard card: rank tile, attendee name, session count and
        the last-session date — the top attendee reads in gold ── */
  const renderTopAttendeeCard = (row, rowIndex) => (
    <DataCard
      accent={rowIndex === 0 ? 'gold' : 'primary'}
      leading={<RankTile rank={rowIndex + 1} />}
      title={row.fullName}
      badge={<Badge variant="primary">{row.sessionsCount}</Badge>}
      meta={
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {row.lastSessionAt ? formatDateTime(row.lastSessionAt) : t('common.placeholder.empty')}
        </span>
      }
    />
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('confessions.analytics.page') },
        ]}
      />

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('shared.dashboard')}
        title={t('confessions.analytics.title')}
        subtitle={t('confessions.analytics.subtitle')}
        actions={(
          <div className="w-full sm:w-48">
            <Select
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              options={[
                { value: '3', label: t('confessions.analytics.period3') },
                { value: '6', label: t('confessions.analytics.period6') },
                { value: '12', label: t('confessions.analytics.period12') },
                { value: '24', label: t('confessions.analytics.period24') },
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
            title={t('confessions.analytics.emptyTitle')}
            description={t('confessions.analytics.noData')}
            action={(
              <Button
                variant="outline"
                icon={RefreshCw}
                onClick={() => refetch()}
                aria-label={t('confessions.analytics.loading')}
              >
                {t('confessions.analytics.loading')}
              </Button>
            )}
          />
        </Card>
      ) : isLoading ? (
        /* ══ LOADING STATE ═════════════════════════════════════════════ */
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
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
                        {t('confessions.analytics.monthlyTitle')}
                      </p>
                      <p className="truncate text-sm font-bold text-heading">{busiestMonth.label}</p>
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-heading">{busiestMonth.count}</span>{' '}
                        {t('confessions.analytics.cards.sessionsInPeriod')}
                      </p>
                    </div>
                  </div>
                )}
                {topType && (
                  <div className="flex items-start gap-3 sm:px-4">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary">
                      <Trophy className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                        {t('confessions.analytics.sessionTypesTitle')}
                      </p>
                      <p className="truncate text-sm font-bold text-heading">
                        {localizeSessionTypeName(topType.sessionType, t)}
                      </p>
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-heading">{topType.count}</span>{' '}
                        {t('confessions.analytics.columns.sessions')}
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
                      {t('confessions.analytics.cards.sessionsInPeriod')}
                    </p>
                    <p className="truncate text-sm font-bold text-heading">{avgPerMonth}</p>
                    <p className="text-xs text-muted">{t('confessions.analytics.monthlySubtitle')}</p>
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
                title={t('confessions.analytics.monthlyTitle')}
                subtitle={t('confessions.analytics.monthlySubtitle')}
              />
              {monthlyTrend.length === 0 ? (
                <EmptyState compact icon={CalendarDays} title={t('confessions.analytics.noData')} />
              ) : (
                <div className="space-y-4">
                  {monthlyTrend.map((item) => {
                    const pct = Math.max((item.count / maxTrendCount) * 100, 2);
                    return (
                      <div key={`${item.year}-${item.month}`}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-medium text-heading">{item.label}</span>
                          <span className="text-xs font-bold tabular-nums text-primary">{item.count}</span>
                        </div>
                        {/* track */}
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

            {/* session type breakdown */}
            <Card padding="lg">
              <CardHeader
                icon={CalendarDays}
                title={t('confessions.analytics.sessionTypesTitle')}
                subtitle={t('confessions.analytics.sessionTypesSubtitle')}
              />
              {typeBreakdown.length === 0 ? (
                <EmptyState compact icon={CalendarDays} title={t('confessions.analytics.noTypeData')} />
              ) : (
                <div className="space-y-4">
                  {typeBreakdown.map((item, i) => {
                    const pct = Math.max((item.count / maxTypeCount) * 100, 2);
                    /* cycle through a small palette for visual variety */
                    const trackColors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-warning'];
                    const color = trackColors[i % trackColors.length];
                    return (
                      <div key={item.sessionType}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="truncate text-xs font-medium text-heading">
                            {localizeSessionTypeName(item.sessionType, t)}
                          </span>
                          <Badge variant="primary">{item.count}</Badge>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${color}`}
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

          {/* ══ TOP ATTENDEES TABLE ══════════════════════════════════════════ */}
          <Card padding="lg">
            <CardHeader
              icon={Users}
              title={t('confessions.analytics.topAttendeesTitle')}
              subtitle={t('confessions.analytics.topAttendeesSubtitle')}
              action={<Badge variant="gold">{topAttendees.length}</Badge>}
            />
            <div className="overflow-hidden tttable">
              <Table
                flush
                columns={topAttendeesColumns}
                data={topAttendees}
                loading={isLoading}
                emptyTitle={t('confessions.analytics.emptyTitle')}
                emptyDescription={t('confessions.analytics.emptyDescription')}
                renderCard={renderTopAttendeeCard}
                viewStorageKey="confessions:topAttendees:viewMode"
              />
            </div>
          </Card>
        </>
      )}

    </div>
  );
}
