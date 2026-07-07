import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  ChevronDown,
  Clock3,
  Flame,
  Globe2,
  MousePointerClick,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { systemAnalyticsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import PageHeader from '../../../components/ui/PageHeader';
import { formatDateTime } from '../../../utils/formatters';
import { useI18n } from '../../../i18n/i18n';

function SectionLabel({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/60" />
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
    </div>
  );
}

function formatDuration(totalSeconds = 0, t) {
  const normalizedSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const remainingSeconds = normalizedSeconds % 60;
  const hoursLabel = t('systemAnalyticsPage.units.hoursShort');
  const minutesLabel = t('systemAnalyticsPage.units.minutesShort');
  const secondsLabel = t('systemAnalyticsPage.units.secondsShort');

  if (hours > 0) {
    return `${hours}${hoursLabel} ${minutes}${minutesLabel}`;
  }

  if (minutes > 0) {
    return `${minutes}${minutesLabel} ${remainingSeconds}${secondsLabel}`;
  }

  return `${remainingSeconds}${secondsLabel}`;
}

function formatSurfaceLabel(surface, t) {
  return t(`systemAnalyticsPage.surfaces.${surface || 'other'}`);
}

function surfaceVariant(surface) {
  switch (surface) {
    case 'public':
      return 'success';
    case 'auth':
      return 'warning';
    case 'dashboard':
      return 'primary';
    default:
      return 'default';
  }
}

function formatTrendLabel(dateValue, language) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;

  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function compactPath(path) {
  const value = String(path || '/');
  return value.length > 40 ? `${value.slice(0, 37)}...` : value;
}

function getSessionDisplayName(session, t) {
  return (
    session.user?.fullName ||
    t('systemAnalyticsPage.table.anonymous', {
      id: String(session.visitorId || '').slice(-6),
    })
  );
}

// Read-only presentational helper: month-over-month (point-over-point) % change.
function pointChange(series = []) {
  if (!Array.isArray(series) || series.length < 2) return null;
  const last = Number(series[series.length - 1] || 0);
  const prev = Number(series[series.length - 2] || 0);
  if (prev === 0) return null;
  return Math.round(((last - prev) / prev) * 100);
}

export default function SystemAnalyticsPage() {
  const { language, t, isRTL } = useI18n();
  const [days, setDays] = useState('7');
  const [surface, setSurface] = useState('all');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['system-analytics', { days, surface }],
    queryFn: async () => {
      const { data } = await systemAnalyticsApi.getOverview({
        days: Number(days),
        surface,
        limit: 20,
      });
      return data?.data || null;
    },
    staleTime: 30000,
  });

  const summary = analytics?.summary || {};
  const dailyTrend = Array.isArray(analytics?.dailyTrend) ? analytics.dailyTrend : [];
  const topPages = Array.isArray(analytics?.topPages) ? analytics.topPages : [];
  const recentSessions = Array.isArray(analytics?.recentSessions) ? analytics.recentSessions : [];
  const surfaceBreakdown = Array.isArray(analytics?.surfaceBreakdown)
    ? analytics.surfaceBreakdown
    : [];
  const selectedSession = recentSessions.find(
    (session) => session.sessionId === selectedSessionId
  );
  const selectedSessionPaths = Array.isArray(selectedSession?.paths)
    ? selectedSession.paths
    : [];

  const maxTrendSessions = Math.max(...dailyTrend.map((entry) => entry.sessions || 0), 1);
  const maxPageActiveSeconds = Math.max(
    ...topPages.map((entry) => entry.activeSeconds || 0),
    1
  );
  const totalSurfaceSessions = Math.max(
    surfaceBreakdown.reduce((sum, entry) => sum + (entry.sessions || 0), 0),
    1
  );

  // ---- Read-only presentational derivations for sparklines & insights ----
  const sessionSeries = useMemo(
    () => dailyTrend.map((entry) => Number(entry.sessions || 0)),
    [dailyTrend]
  );
  const visitorSeries = useMemo(
    () => dailyTrend.map((entry) => Number(entry.uniqueVisitors || 0)),
    [dailyTrend]
  );
  const activeSecondsSeries = useMemo(
    () => dailyTrend.map((entry) => Number(entry.activeSeconds || 0)),
    [dailyTrend]
  );
  const avgSecondsSeries = useMemo(
    () =>
      dailyTrend.map((entry) => {
        const s = Number(entry.sessions || 0);
        return s > 0 ? Math.round(Number(entry.activeSeconds || 0) / s) : 0;
      }),
    [dailyTrend]
  );

  const insights = useMemo(() => {
    const busiestDay = dailyTrend.reduce(
      (best, entry) => ((entry.sessions || 0) > (best?.sessions || 0) ? entry : best),
      null
    );
    const topSurface = surfaceBreakdown.reduce(
      (best, entry) => ((entry.sessions || 0) > (best?.sessions || 0) ? entry : best),
      null
    );
    const topPage = topPages[0] || null;
    return { busiestDay, topSurface, topPage };
  }, [dailyTrend, surfaceBreakdown, topPages]);

  const kpiTiles = [
    {
      label: t('systemAnalyticsPage.cards.sessions'),
      value: summary.totalSessions ?? 0,
      icon: Activity,
      tone: 'primary',
      spark: sessionSeries,
      trend: pointChange(sessionSeries),
    },
    {
      label: t('systemAnalyticsPage.cards.uniqueVisitors'),
      value: summary.uniqueVisitors ?? 0,
      icon: Globe2,
      tone: 'info',
      spark: visitorSeries,
      trend: pointChange(visitorSeries),
    },
    {
      label: t('systemAnalyticsPage.cards.authenticatedSessions'),
      value: summary.authenticatedSessions ?? 0,
      icon: Shield,
      tone: 'success',
    },
    {
      label: t('systemAnalyticsPage.cards.avgTimeSpent'),
      value: formatDuration(summary.avgActiveSeconds ?? 0, t),
      icon: Clock3,
      tone: 'gold',
      spark: avgSecondsSeries,
      trend: pointChange(avgSecondsSeries),
    },
    {
      label: t('systemAnalyticsPage.cards.totalTimeSpent'),
      value: formatDuration(summary.totalActiveSeconds ?? 0, t),
      icon: BarChart3,
      tone: 'default',
      spark: activeSecondsSeries,
      trend: pointChange(activeSecondsSeries),
    },
    {
      label: t('systemAnalyticsPage.cards.avgPageViews'),
      value: summary.avgPageViewsPerSession ?? 0,
      icon: Users,
      tone: 'default',
    },
  ];

  const recentSessionColumns = useMemo(
    () => [
      {
        key: 'visitor',
        label: t('systemAnalyticsPage.table.visitorOrUser'),
        render: (row) => (
          <div
            className="flex max-w-[240px] items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-expanded={selectedSessionId === row.sessionId}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-heading">
                {getSessionDisplayName(row, t)}
              </span>
              <span className="block truncate text-xs text-muted">
                {row.user?.role || row.sessionId}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                selectedSessionId === row.sessionId ? 'rotate-180' : ''
              }`}
            />
          </div>
        ),
        onClick: (row) => {
          setSelectedSessionId((current) => (current === row.sessionId ? '' : row.sessionId));
        },
      },
      {
        key: 'surface',
        label: t('systemAnalyticsPage.table.surface'),
        render: (row) => (
          <Badge variant={surfaceVariant(row.surface)}>
            {formatSurfaceLabel(row.surface, t)}
          </Badge>
        ),
      },
      {
        key: 'time',
        label: t('systemAnalyticsPage.table.timeSpent'),
        render: (row) => (
          <span className="font-medium text-heading">
            {formatDuration(row.totalActiveSeconds, t)}
          </span>
        ),
      },
      {
        key: 'pages',
        label: t('systemAnalyticsPage.table.pages'),
        render: (row) => (
          <span className="text-sm text-heading">
            {t('systemAnalyticsPage.text.pagesSummary', {
              views: row.totalPageViews,
              paths: row.pathsVisitedCount,
            })}
          </span>
        ),
      },
      {
        key: 'entryPath',
        label: t('systemAnalyticsPage.table.entry'),
        render: (row) => (
          <span className="block max-w-[220px] truncate text-sm text-muted">
            {compactPath(row.entryPath)}
          </span>
        ),
      },
      {
        key: 'startedAt',
        label: t('systemAnalyticsPage.table.started'),
        render: (row) => (
          <span className="text-xs text-muted">{formatDateTime(row.startedAt)}</span>
        ),
      },
      {
        key: 'lastSeenAt',
        label: t('systemAnalyticsPage.table.lastSeen'),
        render: (row) => (
          <span className="text-xs text-muted">{formatDateTime(row.lastSeenAt)}</span>
        ),
      },
    ],
    [selectedSessionId, t]
  );

  const highlightCards = [
    insights.busiestDay
      ? {
          icon: Flame,
          tone: 'text-warning',
          wrap: 'bg-warning/10',
          label: t('systemAnalyticsPage.sections.sessionTrend'),
          value: formatTrendLabel(insights.busiestDay.date, language),
          hint: t('systemAnalyticsPage.text.sessionsCount', {
            count: insights.busiestDay.sessions,
          }),
        }
      : null,
    insights.topSurface
      ? {
          icon: Shield,
          tone: 'text-primary',
          wrap: 'bg-primary/10',
          label: t('systemAnalyticsPage.sections.surfaceBreakdown'),
          value: formatSurfaceLabel(insights.topSurface.surface, t),
          hint: t('systemAnalyticsPage.text.sessionsCount', {
            count: insights.topSurface.sessions,
          }),
        }
      : null,
    insights.topPage
      ? {
          icon: MousePointerClick,
          tone: 'text-info',
          wrap: 'bg-info/10',
          label: t('systemAnalyticsPage.sections.topPages'),
          value: insights.topPage.title || compactPath(insights.topPage.path),
          hint: t('systemAnalyticsPage.text.viewsCount', {
            count: insights.topPage.views,
          }),
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('systemAnalyticsPage.page') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('systemAnalyticsPage.eyebrow')}
        title={t('systemAnalyticsPage.title')}
        // subtitle={t('systemAnalyticsPage.subtitle')}
        actions={(
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <div className="w-full sm:w-40">
              <Select
                value={days}
                onChange={(event) => setDays(event.target.value)}
                options={[
                  { value: '7', label: t('systemAnalyticsPage.filters.days7') },
                  { value: '14', label: t('systemAnalyticsPage.filters.days14') },
                  { value: '30', label: t('systemAnalyticsPage.filters.days30') },
                  { value: '90', label: t('systemAnalyticsPage.filters.days90') },
                ]}
                containerClassName="!mb-0"
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={surface}
                onChange={(event) => setSurface(event.target.value)}
                options={[
                  { value: 'all', label: t('systemAnalyticsPage.filters.allSurfaces') },
                  { value: 'public', label: t('systemAnalyticsPage.surfaces.public') },
                  { value: 'auth', label: t('systemAnalyticsPage.surfaces.auth') },
                  { value: 'dashboard', label: t('systemAnalyticsPage.surfaces.dashboard') },
                  { value: 'other', label: t('systemAnalyticsPage.surfaces.other') },
                ]}
                containerClassName="!mb-0"
              />
            </div>
          </div>
        )}
      />

      {/* KPI band */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[132px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {kpiTiles.map(({ label, value, icon: Icon, tone, spark, trend }) => (
            <StatCard
              key={label}
              icon={Icon}
              label={label}
              value={value}
              tone={tone}
              spark={spark}
              trend={trend}
              trendLabel={typeof trend === 'number' ? `${Math.abs(trend)}%` : undefined}
              isRTL={isRTL}
            />
          ))}
        </div>
      )}

      {/* Highlights strip */}
      {!isLoading && highlightCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {highlightCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card"
              >
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${item.wrap} ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {item.label}
                  </p>
                  <p className="truncate text-sm font-bold text-heading">{item.value}</p>
                  <p className="truncate text-xs text-muted">{item.hint}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" padding="lg">
          <CardHeader
            icon={BarChart3}
            title={t('systemAnalyticsPage.sections.sessionTrend')}
            action={
              typeof pointChange(sessionSeries) === 'number' ? (
                <Badge variant={pointChange(sessionSeries) >= 0 ? 'success' : 'danger'} dot>
                  {pointChange(sessionSeries) >= 0 ? '+' : ''}
                  {pointChange(sessionSeries)}%
                </Badge>
              ) : null
            }
          />

          <div>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : dailyTrend.length === 0 ? (
              <EmptyState
                compact
                icon={TrendingUp}
                title={t('systemAnalyticsPage.states.noSessionData')}
              />
            ) : (
              <div className="space-y-4">
                {dailyTrend.map((entry) => {
                  const percentage = Math.max(
                    ((entry.sessions || 0) / maxTrendSessions) * 100,
                    2
                  );

                  return (
                    <div key={entry.date}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-heading">
                          {formatTrendLabel(entry.date, language)}
                        </span>
                        <span className="text-xs font-bold text-primary">
                          {t('systemAnalyticsPage.text.sessionsCount', {
                            count: entry.sessions,
                          })}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted">
                        {t('systemAnalyticsPage.text.visitorsAndDuration', {
                          visitors: entry.uniqueVisitors,
                          duration: formatDuration(entry.activeSeconds, t),
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader
            icon={Shield}
            title={t('systemAnalyticsPage.sections.surfaceBreakdown')}
          />

          <div>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-1.5">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {surfaceBreakdown.map((entry) => {
                  const percentage = Math.max(
                    ((entry.sessions || 0) / totalSurfaceSessions) * 100,
                    2
                  );

                  return (
                    <div key={entry.surface}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <Badge variant={surfaceVariant(entry.surface)}>
                          {formatSurfaceLabel(entry.surface, t)}
                        </Badge>
                        <span className="text-xs font-bold text-heading">
                          {entry.sessions}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted">
                        {formatDuration(entry.activeSeconds, t)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card padding="lg">
          <CardHeader
            icon={Globe2}
            title={t('systemAnalyticsPage.sections.topPages')}
          />

          <div>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="space-y-1.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : topPages.length === 0 ? (
              <EmptyState
                compact
                icon={Globe2}
                title={t('systemAnalyticsPage.states.noTopPages')}
              />
            ) : (
              <div className="space-y-4">
                {topPages.map((entry) => {
                  const percentage = Math.max(
                    ((entry.activeSeconds || 0) / maxPageActiveSeconds) * 100,
                    2
                  );

                  return (
                    <div key={entry.path}>
                      <div className="mb-1.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-heading">
                            {entry.title || compactPath(entry.path)}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {entry.path}
                          </p>
                        </div>
                        <Badge variant="primary">
                          {t('systemAnalyticsPage.text.viewsCount', {
                            count: entry.views,
                          })}
                        </Badge>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted">
                        {t('systemAnalyticsPage.text.durationAndSessions', {
                          duration: formatDuration(entry.activeSeconds, t),
                          sessions: entry.sessions,
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader
            icon={Clock3}
            title={t('systemAnalyticsPage.sections.storedSessions')}
          />

          <div>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-[68px] rounded-xl" />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <EmptyState
                compact
                icon={Clock3}
                title={t('systemAnalyticsPage.states.noRecentSessions')}
              />
            ) : (
              <div className="space-y-3">
                {recentSessions.slice(0, 5).map((session) => (
                  <div
                    key={session.sessionId}
                    className="rounded-xl border border-border/70 bg-surface-alt/35 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-heading">
                          {session.user?.fullName ||
                            t('systemAnalyticsPage.table.anonymous', {
                              id: String(session.visitorId || '').slice(-6),
                            })}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {compactPath(session.entryPath)}
                        </p>
                      </div>
                      <Badge variant={surfaceVariant(session.surface)}>
                        {formatSurfaceLabel(session.surface, t)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                      <span>{formatDuration(session.totalActiveSeconds, t)}</span>
                      <span>{t('systemAnalyticsPage.text.viewsCount', {
                        count: session.totalPageViews,
                      })}</span>
                      <span>{formatDateTime(session.startedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('systemAnalyticsPage.sections.recentSessions')}</SectionLabel>
          <span className="text-xs text-muted">{recentSessions.length}</span>
        </div>

        {selectedSession ? (
          <Card tone="primary" padding="sm">
            <div className="flex flex-col gap-2 border-b border-border/70 pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-heading">
                  {t('systemAnalyticsPage.text.sessionPagesTitle', {
                    name: getSessionDisplayName(selectedSession, t),
                  })}
                </p>
                <p className="mt-1 truncate text-xs text-muted">
                  {selectedSession.sessionId}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={surfaceVariant(selectedSession.surface)}>
                  {formatSurfaceLabel(selectedSession.surface, t)}
                </Badge>
                <Badge variant="primary">
                  {t('systemAnalyticsPage.text.pagesSummary', {
                    views: selectedSession.totalPageViews,
                    paths: selectedSession.pathsVisitedCount,
                  })}
                </Badge>
              </div>
            </div>

            {selectedSessionPaths.length === 0 ? (
              <p className="pt-4 text-sm text-muted">
                {t('systemAnalyticsPage.states.noSessionPaths')}
              </p>
            ) : (
              <div className="mt-3 divide-y divide-border/70">
                {selectedSessionPaths.map((entry) => (
                  <div
                    key={`${selectedSession.sessionId}-${entry.path}`}
                    className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-heading">
                        {entry.title || compactPath(entry.path)}
                      </p>
                      <p className="break-all text-xs text-muted">{entry.path}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted sm:justify-end">
                      <span>
                        {t('systemAnalyticsPage.text.viewsCount', {
                          count: entry.views,
                        })}
                      </span>
                      <span>{formatDuration(entry.activeSeconds, t)}</span>
                      {entry.lastSeenAt ? <span>{formatDateTime(entry.lastSeenAt)}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}

        <div className="overflow-hidden tttable">
          <Table
            columns={recentSessionColumns}
            data={recentSessions}
            loading={isLoading}
            emptyTitle={t('systemAnalyticsPage.states.emptyTitle')}
            emptyDescription={t('systemAnalyticsPage.states.emptyDescription')}
          />
        </div>
      </section>
    </div>
  );
}
