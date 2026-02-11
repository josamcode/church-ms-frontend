import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { confessionsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { formatDateTime } from '../../../utils/formatters';
import { localizeSessionTypeName } from '../../../utils/sessionTypeLocalization';
import { useI18n } from '../../../i18n/i18n';

export default function ConfessionAnalyticsPage() {
  const [months, setMonths] = useState('6');
  const { t } = useI18n();

  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['confessions', 'analytics', { months }],
    queryFn: async () => {
      const { data } = await confessionsApi.getAnalytics({ months: Number(months) });
      return data?.data || null;
    },
    staleTime: 30000,
  });

  const summary = analyticsRes?.summary || {};
  const typeBreakdown = Array.isArray(analyticsRes?.typeBreakdown)
    ? analyticsRes.typeBreakdown
    : [];
  const monthlyTrend = Array.isArray(analyticsRes?.monthlyTrend)
    ? analyticsRes.monthlyTrend
    : [];
  const topAttendees = Array.isArray(analyticsRes?.topAttendees)
    ? analyticsRes.topAttendees
    : [];

  const maxTrendCount = Math.max(...monthlyTrend.map((item) => item.count || 0), 1);

  const topAttendeesColumns = useMemo(
    () => [
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
        render: (row) => (row.lastSessionAt ? formatDateTime(row.lastSessionAt) : t('common.placeholder.empty')),
      },
    ],
    [t]
  );

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('confessions.analytics.page') },
        ]}
      />

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-heading">{t('confessions.analytics.title')}</h1>
          <p className="text-sm text-muted">{t('confessions.analytics.subtitle')}</p>
        </div>
        <div className="w-full sm:w-52">
          <Select
            label={t('confessions.analytics.period')}
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('confessions.analytics.cards.totalSessions')}</p>
          <p className="text-2xl font-bold text-heading">{summary.totalSessions ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('confessions.analytics.cards.sessionsInPeriod')}</p>
          <p className="text-2xl font-bold text-heading">{summary.sessionsInPeriod ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('confessions.analytics.cards.uniqueAttendees')}</p>
          <p className="text-2xl font-bold text-heading">{summary.uniqueAttendees ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('confessions.analytics.cards.upcomingSessions')}</p>
          <p className="text-2xl font-bold text-heading">{summary.upcomingSessions ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('confessions.analytics.cards.overdueUsers')}</p>
          <p className="text-2xl font-bold text-danger">{summary.overdueUsers ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('confessions.analytics.cards.alertThreshold')}</p>
          <p className="text-2xl font-bold text-heading">
            {summary.alertThresholdDays ?? 0} {t('confessions.alerts.daysWord')}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title={t('confessions.analytics.monthlyTitle')}
            subtitle={t('confessions.analytics.monthlySubtitle')}
            action={<BarChart3 className="w-5 h-5 text-primary" />}
          />
          {isLoading ? (
            <p className="text-sm text-muted">{t('confessions.analytics.loading')}</p>
          ) : monthlyTrend.length === 0 ? (
            <p className="text-sm text-muted">{t('confessions.analytics.noData')}</p>
          ) : (
            <div className="space-y-3">
              {monthlyTrend.map((item) => (
                <div key={`${item.year}-${item.month}`}>
                  <div className="flex items-center justify-between text-xs text-muted mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium text-heading">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.max((item.count / maxTrendCount) * 100, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title={t('confessions.analytics.sessionTypesTitle')}
            subtitle={t('confessions.analytics.sessionTypesSubtitle')}
          />
          {isLoading ? (
            <p className="text-sm text-muted">{t('confessions.analytics.loading')}</p>
          ) : typeBreakdown.length === 0 ? (
            <p className="text-sm text-muted">{t('confessions.analytics.noTypeData')}</p>
          ) : (
            <div className="space-y-2">
              {typeBreakdown.map((item) => (
                <div
                  key={item.sessionType}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <span className="font-medium text-heading">
                    {localizeSessionTypeName(item.sessionType, t)}
                  </span>
                  <Badge variant="primary">{item.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title={t('confessions.analytics.topAttendeesTitle')}
          subtitle={t('confessions.analytics.topAttendeesSubtitle')}
        />
        <Table
          columns={topAttendeesColumns}
          data={topAttendees}
          loading={isLoading}
          emptyTitle={t('confessions.analytics.emptyTitle')}
          emptyDescription={t('confessions.analytics.emptyDescription')}
        />
      </Card>
    </div>
  );
}
