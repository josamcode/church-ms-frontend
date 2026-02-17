import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { visitationsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { formatDateTime } from '../../../utils/formatters';
import { useI18n } from '../../../i18n/i18n';

export default function PastoralVisitationAnalyticsPage() {
  const { t } = useI18n();
  const [months, setMonths] = useState('6');

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

  const topRecordersColumns = useMemo(
    () => [
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
        render: (row) => `${row.totalDuration || 0} ${t('visitations.shared.minutes')}`,
      },
      {
        key: 'lastRecordedAt',
        label: t('visitations.analytics.columns.lastRecord'),
        render: (row) =>
          row.lastRecordedAt ? formatDateTime(row.lastRecordedAt) : t('common.placeholder.empty'),
      },
    ],
    [t]
  );

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('visitations.analytics.page') },
        ]}
      />

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-heading">{t('visitations.analytics.title')}</h1>
          <p className="text-sm text-muted">{t('visitations.analytics.subtitle')}</p>
        </div>
        <div className="w-full sm:w-52">
          <Select
            label={t('visitations.analytics.period')}
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            options={[
              { value: '3', label: t('visitations.analytics.period3') },
              { value: '6', label: t('visitations.analytics.period6') },
              { value: '12', label: t('visitations.analytics.period12') },
              { value: '24', label: t('visitations.analytics.period24') },
            ]}
            containerClassName="!mb-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('visitations.analytics.cards.totalVisitations')}</p>
          <p className="text-2xl font-bold text-heading">{summary.totalVisitations ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('visitations.analytics.cards.visitationsInPeriod')}</p>
          <p className="text-2xl font-bold text-heading">{summary.visitationsInPeriod ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('visitations.analytics.cards.uniqueHouses')}</p>
          <p className="text-2xl font-bold text-heading">{summary.uniqueHouses ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">{t('visitations.analytics.cards.avgDurationMinutes')}</p>
          <p className="text-2xl font-bold text-heading">
            {summary.avgDurationMinutes ?? 0} {t('visitations.shared.minutes')}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title={t('visitations.analytics.monthlyTitle')}
            subtitle={t('visitations.analytics.monthlySubtitle')}
            action={<BarChart3 className="w-5 h-5 text-primary" />}
          />
          {isLoading ? (
            <p className="text-sm text-muted">{t('visitations.analytics.loading')}</p>
          ) : monthlyTrend.length === 0 ? (
            <p className="text-sm text-muted">{t('visitations.analytics.noData')}</p>
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
            title={t('visitations.analytics.topHousesTitle')}
            subtitle={t('visitations.analytics.topHousesSubtitle')}
          />
          {isLoading ? (
            <p className="text-sm text-muted">{t('visitations.analytics.loading')}</p>
          ) : topHouses.length === 0 ? (
            <p className="text-sm text-muted">{t('visitations.analytics.noHousesData')}</p>
          ) : (
            <div className="space-y-2">
              {topHouses.map((item) => (
                <div
                  key={item.houseName}
                  className="rounded-md border border-border p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-heading">{item.houseName}</p>
                    <p className="text-xs text-muted">
                      {t('visitations.analytics.avgPerHouse')} {item.avgDurationMinutes} {t('visitations.shared.minutes')}
                    </p>
                  </div>
                  <Badge variant="primary">{item.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title={t('visitations.analytics.topRecordersTitle')}
          subtitle={t('visitations.analytics.topRecordersSubtitle')}
        />
        <Table
          columns={topRecordersColumns}
          data={topRecorders}
          loading={isLoading}
          emptyTitle={t('visitations.analytics.emptyTitle')}
          emptyDescription={t('visitations.analytics.emptyDescription')}
        />
      </Card>
    </div>
  );
}
