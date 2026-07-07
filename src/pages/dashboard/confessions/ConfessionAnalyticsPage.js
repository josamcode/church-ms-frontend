import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Users, CalendarDays, CalendarClock, AlertTriangle, Clock,
} from 'lucide-react';
import { confessionsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import PageHeader from '../../../components/ui/PageHeader';
import { formatDateTime } from '../../../utils/formatters';
import { localizeSessionTypeName } from '../../../utils/sessionTypeLocalization';
import { useI18n } from '../../../i18n/i18n';

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

export default function ConfessionAnalyticsPage() {
  const [months, setMonths] = useState('6');
  const { t, isRTL } = useI18n();

  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['confessions', 'analytics', { months }],
    queryFn: async () => {
      const { data } = await confessionsApi.getAnalytics({ months: Number(months) });
      return data?.data || null;
    },
    staleTime: 30000,
  });

  const summary = analyticsRes?.summary || {};
  const typeBreakdown = Array.isArray(analyticsRes?.typeBreakdown) ? analyticsRes.typeBreakdown : [];
  const monthlyTrend = Array.isArray(analyticsRes?.monthlyTrend) ? analyticsRes.monthlyTrend : [];
  const topAttendees = Array.isArray(analyticsRes?.topAttendees) ? analyticsRes.topAttendees : [];

  const maxTrendCount = Math.max(...monthlyTrend.map((item) => item.count || 0), 1);
  const maxTypeCount = Math.max(...typeBreakdown.map((item) => item.count || 0), 1);

  /* ── KPI config ── */
  const kpiTiles = [
    { label: t('confessions.analytics.cards.totalSessions'), value: summary.totalSessions ?? 0, icon: BarChart3, tone: 'default' },
    { label: t('confessions.analytics.cards.sessionsInPeriod'), value: summary.sessionsInPeriod ?? 0, icon: CalendarDays, tone: 'primary' },
    { label: t('confessions.analytics.cards.uniqueAttendees'), value: summary.uniqueAttendees ?? 0, icon: Users, tone: 'info' },
    { label: t('confessions.analytics.cards.upcomingSessions'), value: summary.upcomingSessions ?? 0, icon: CalendarClock, tone: 'gold' },
    { label: t('confessions.analytics.cards.overdueUsers'), value: summary.overdueUsers ?? 0, icon: AlertTriangle, tone: (summary.overdueUsers ?? 0) > 0 ? 'warning' : 'success' },
    {
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

      {/* ══ KPI TILES ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
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
          <CardHeader icon={BarChart3} title={t('confessions.analytics.monthlyTitle')} />
          {isLoading ? (
            <p className="text-sm text-muted">{t('confessions.analytics.loading')}</p>
          ) : monthlyTrend.length === 0 ? (
            <p className="text-sm text-muted">{t('confessions.analytics.noData')}</p>
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
          <CardHeader icon={CalendarDays} title={t('confessions.analytics.sessionTypesTitle')} />
          {isLoading ? (
            <p className="text-sm text-muted">{t('confessions.analytics.loading')}</p>
          ) : typeBreakdown.length === 0 ? (
            <p className="text-sm text-muted">{t('confessions.analytics.noTypeData')}</p>
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
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('confessions.analytics.topAttendeesTitle')}</SectionLabel>
          <span className="text-xs text-muted">{topAttendees.length}</span>
        </div>

        <div className="overflow-hidden tttable">
          <Table
            columns={topAttendeesColumns}
            data={topAttendees}
            loading={isLoading}
            emptyTitle={t('confessions.analytics.emptyTitle')}
            emptyDescription={t('confessions.analytics.emptyDescription')}
          />
        </div>
      </section>

    </div>
  );
}
