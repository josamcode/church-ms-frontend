import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  ChevronDown,
  Clock3,
  Globe2,
  Shield,
  Users,
} from 'lucide-react';
import { systemAnalyticsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
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

  const kpiTiles = [
    {
      label: t('systemAnalyticsPage.cards.sessions'),
      value: summary.totalSessions ?? 0,
      icon: Activity,
      tone: 'primary',
    },
    {
      label: t('systemAnalyticsPage.cards.uniqueVisitors'),
      value: summary.uniqueVisitors ?? 0,
      icon: Globe2,
      tone: 'info',
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
    },
    {
      label: t('systemAnalyticsPage.cards.totalTimeSpent'),
      value: formatDuration(summary.totalActiveSeconds ?? 0, t),
      icon: BarChart3,
      tone: 'default',
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpiTiles.map(({ label, value, icon: Icon, tone }) => (
          <StatCard
            key={label}
            icon={Icon}
            label={label}
            value={value}
            tone={tone}
            isRTL={isRTL}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" padding="lg">
          <CardHeader
            icon={BarChart3}
            title={t('systemAnalyticsPage.sections.sessionTrend')}
          />

          <div>
            {isLoading ? (
              <p className="text-sm text-muted">{t('systemAnalyticsPage.states.loadingAnalytics')}</p>
            ) : dailyTrend.length === 0 ? (
              <p className="text-sm text-muted">{t('systemAnalyticsPage.states.noSessionData')}</p>
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
              <p className="text-sm text-muted">{t('systemAnalyticsPage.states.loadingBreakdown')}</p>
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
              <p className="text-sm text-muted">{t('systemAnalyticsPage.states.loadingTopPages')}</p>
            ) : topPages.length === 0 ? (
              <p className="text-sm text-muted">{t('systemAnalyticsPage.states.noTopPages')}</p>
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
              <p className="text-sm text-muted">{t('systemAnalyticsPage.states.loadingSessions')}</p>
            ) : recentSessions.length === 0 ? (
              <p className="text-sm text-muted">{t('systemAnalyticsPage.states.noRecentSessions')}</p>
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
