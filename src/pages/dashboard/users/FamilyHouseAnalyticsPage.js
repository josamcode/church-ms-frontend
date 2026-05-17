import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  ChevronRight,
  Home,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useI18n } from '../../../i18n/i18n';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import {
  FAMILY_HOUSE_DETAILS_PATH,
  buildLookupQuery,
  normalizeText,
} from './familyHouseLookup.shared';

const CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
];

const EMPTY_ANALYTICS = {
  summary: {},
  familyRanks: [],
  houseRanks: [],
  distributions: {},
  trends: {},
};

function getLocale(language) {
  return language === 'ar' ? 'ar-EG' : 'en-US';
}

function formatNumber(value, language = 'en') {
  return new Intl.NumberFormat(getLocale(language)).format(Number(value || 0));
}

function formatPercent(value, language = 'en') {
  return `${formatNumber(Math.round(Number(value || 0)), language)}%`;
}

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 0)) * 100);
}

function getLabel(value, map = {}) {
  return map[value] || value || '---';
}

function toRows(items = [], maxItems = 6) {
  return (Array.isArray(items) ? items : []).slice(0, maxItems);
}

export default function FamilyHouseAnalyticsPage() {
  const { t, language, isRTL } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lookupType, setLookupType] = useState('familyName');
  const [lookupName, setLookupName] = useState('');

  const tr = useCallback((key, values) => t(key, values), [t]);
  const isFamilyLookup = lookupType === 'familyName';
  const normalizedLookupName = normalizeText(lookupName);
  const trimmedLookupName = lookupName.trim();
  const detailsHref = trimmedLookupName
    ? `${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery(lookupType, trimmedLookupName)}`
    : null;

  const analyticsQuery = useQuery({
    queryKey: ['users', 'family-house-analytics'],
    queryFn: async () => {
      const { data } = await usersApi.getFamilyHouseAnalytics();
      return data?.data || EMPTY_ANALYTICS;
    },
    staleTime: 120000,
  });

  const lookupNamesQuery = useQuery({
    queryKey: ['users', isFamilyLookup ? 'family-names' : 'house-names', 'analytics'],
    queryFn: async () => {
      const { data } = isFamilyLookup
        ? await usersApi.getFamilyNames()
        : await usersApi.getHouseNames();
      return data?.data ?? [];
    },
    staleTime: 120000,
  });

  const analytics = analyticsQuery.data || EMPTY_ANALYTICS;
  const summary = analytics.summary || EMPTY_ANALYTICS.summary;
  const distributions = analytics.distributions || EMPTY_ANALYTICS.distributions;
  const monthlyRegistrations = Array.isArray(analytics.trends?.monthlyRegistrations)
    ? analytics.trends.monthlyRegistrations
    : [];
  const familyRanks = Array.isArray(analytics.familyRanks) ? analytics.familyRanks : [];
  const houseRanks = Array.isArray(analytics.houseRanks) ? analytics.houseRanks : [];
  const totalMembers = Number(summary.totalMembers || 0);

  const labelMaps = useMemo(
    () => ({
      gender: {
        male: tr('familyHouseAnalytics.labels.male'),
        female: tr('familyHouseAnalytics.labels.female'),
        other: tr('familyHouseAnalytics.labels.other'),
      },
      accountStatus: {
        approved: tr('familyHouseAnalytics.labels.approved'),
        pending: tr('familyHouseAnalytics.labels.pending'),
        rejected: tr('familyHouseAnalytics.labels.rejected'),
      },
      role: {
        SUPER_ADMIN: tr('familyHouseAnalytics.labels.superAdmin'),
        ADMIN: tr('familyHouseAnalytics.labels.admin'),
        USER: tr('familyHouseAnalytics.labels.user'),
      },
    }),
    [tr]
  );

  const lookupNames = useMemo(
    () => (Array.isArray(lookupNamesQuery.data) ? lookupNamesQuery.data : []),
    [lookupNamesQuery.data]
  );

  const filteredLookupNames = useMemo(() => {
    const names = normalizedLookupName
      ? lookupNames.filter((name) => normalizeText(name).includes(normalizedLookupName))
      : lookupNames;
    return names.slice(0, 8);
  }, [lookupNames, normalizedLookupName]);

  const coverageRows = useMemo(
    () => [
      {
        name: tr('familyHouseAnalytics.metrics.familyCoverage'),
        count: Number(summary.membersWithFamilyName || 0),
        percent: Number(summary.familyCoveragePct || 0),
        color: 'var(--color-primary)',
      },
      {
        name: tr('familyHouseAnalytics.metrics.houseCoverage'),
        count: Number(summary.membersWithHouseName || 0),
        percent: Number(summary.houseCoveragePct || 0),
        color: 'var(--color-secondary)',
      },
      {
        name: tr('familyHouseAnalytics.metrics.loginEnabled'),
        count: Number(summary.loginEnabledMembers || 0),
        percent: getPercent(summary.loginEnabledMembers, totalMembers),
        color: 'var(--color-success)',
      },
      {
        name: tr('familyHouseAnalytics.metrics.lockedAccounts'),
        count: Number(summary.lockedMembers || 0),
        percent: getPercent(summary.lockedMembers, totalMembers),
        color: 'var(--color-danger)',
      },
    ],
    [summary, totalMembers, tr]
  );

  const kpiItems = useMemo(
    () => [
      {
        label: tr('familyHouseLookup.analytics.totalMembers'),
        value: summary.totalMembers,
        detail: tr('familyHouseAnalytics.metrics.averageAge', { age: summary.averageAge ?? '---' }),
        icon: UsersIcon,
        tone: 'primary',
      },
      {
        label: tr('familyHouseLookup.analytics.totalFamilies'),
        value: summary.totalFamilies,
        detail: tr('familyHouseAnalytics.metrics.coveredValue', {
          percent: formatPercent(summary.familyCoveragePct, language),
        }),
        icon: Building2,
        tone: 'secondary',
      },
      {
        label: tr('familyHouseLookup.analytics.totalHouses'),
        value: summary.totalHouses,
        detail: tr('familyHouseAnalytics.metrics.coveredValue', {
          percent: formatPercent(summary.houseCoveragePct, language),
        }),
        icon: Home,
        tone: 'accent',
      },
      {
        label: tr('familyHouseLookup.summary.lockedCount'),
        value: summary.lockedMembers,
        detail: tr('familyHouseAnalytics.metrics.memberShare', {
          percent: formatPercent(getPercent(summary.lockedMembers, totalMembers), language),
        }),
        icon: LockKeyhole,
        tone: 'danger',
      },
    ],
    [summary, totalMembers, language, tr]
  );

  const familyRankColumns = useMemo(
    () => [
      {
        key: 'rank',
        label: '#',
        render: (_row, index) => (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-surface-alt text-xs font-semibold text-muted">
            {index + 1}
          </span>
        ),
      },
      {
        key: 'name',
        label: tr('familyHouseAnalytics.table.family'),
        render: (row) => (
          <Link
            to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('familyName', row.name)}`}
            className="font-semibold text-heading hover:text-primary"
          >
            {row.name}
          </Link>
        ),
      },
      {
        key: 'count',
        label: tr('familyHouseAnalytics.table.members'),
        render: (row) => <Badge variant="primary">{formatNumber(row.count, language)}</Badge>,
      },
      {
        key: 'houseCount',
        label: tr('familyHouseAnalytics.table.houses'),
        render: (row) => <span className="text-sm font-medium text-heading">{formatNumber(row.houseCount, language)}</span>,
      },
      {
        key: 'averageAge',
        label: tr('familyHouseAnalytics.table.avgAge'),
        render: (row) => <span className="text-sm text-muted">{row.averageAge ?? '---'}</span>,
      },
    ],
    [language, tr]
  );

  const houseRankColumns = useMemo(
    () => [
      {
        key: 'rank',
        label: '#',
        render: (_row, index) => (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-surface-alt text-xs font-semibold text-muted">
            {index + 1}
          </span>
        ),
      },
      {
        key: 'name',
        label: tr('familyHouseAnalytics.table.house'),
        render: (row) => (
          <Link
            to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('houseName', row.name)}`}
            className="font-semibold text-heading hover:text-primary"
          >
            {row.name}
          </Link>
        ),
      },
      {
        key: 'count',
        label: tr('familyHouseAnalytics.table.members'),
        render: (row) => <Badge variant="primary">{formatNumber(row.count, language)}</Badge>,
      },
      {
        key: 'familyCount',
        label: tr('familyHouseAnalytics.table.families'),
        render: (row) => <span className="text-sm font-medium text-heading">{formatNumber(row.familyCount, language)}</span>,
      },
      {
        key: 'lockedCount',
        label: tr('familyHouseAnalytics.table.locked'),
        render: (row) => <span className="text-sm text-muted">{formatNumber(row.lockedCount, language)}</span>,
      },
    ],
    [language, tr]
  );

  useEffect(() => {
    const urlLookupType = searchParams.get('lookupType');
    const urlLookupName = String(searchParams.get('lookupName') || '').trim();

    if (urlLookupType === 'houseName' || urlLookupType === 'familyName') {
      setLookupType(urlLookupType);
    }
    if (urlLookupName) setLookupName(urlLookupName);
  }, [searchParams]);

  const errorMessage = analyticsQuery.error ? normalizeApiError(analyticsQuery.error).message : null;

  const openDetails = () => {
    if (detailsHref) navigate(detailsHref);
  };

  return (
    <div className="animate-fade-in space-y-7 pb-10">
      <Breadcrumbs
        items={[
          { label: tr('shared.dashboard'), href: '/dashboard' },
          { label: tr('shared.users'), href: '/dashboard/users' },
          { label: tr('familyHouseLookup.analyticsPage.page') },
        ]}
      />

      <PageHeader
        eyebrow={tr('familyHouseAnalytics.eyebrow')}
        title={tr('familyHouseLookup.analyticsPage.title')}
        subtitle={tr('familyHouseLookup.analyticsPage.subtitle')}
        className="border-b border-border pb-6"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{tr('familyHouseAnalytics.badges.liveDataset')}</Badge>
            <Button
              variant="outline"
              icon={RefreshCw}
              loading={analyticsQuery.isFetching}
              onClick={() => analyticsQuery.refetch()}
            >
              {tr('familyHouseAnalytics.actions.refresh')}
            </Button>
          </div>
        )}
      />

      {errorMessage ? (
        <Card>
          <EmptyState
            icon={UsersIcon}
            title={tr('familyHouseAnalytics.states.errorTitle')}
            description={errorMessage}
          />
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpiItems.map((item) => (
              <KpiTile
                key={item.label}
                item={item}
                language={language}
                loading={analyticsQuery.isLoading}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
            <Card className="space-y-5">
              <CardHeader
                title={tr('familyHouseAnalytics.sections.registrationTrend')}
                subtitle={tr('familyHouseAnalytics.sections.registrationTrendHint')}
                action={<Badge variant="primary">{tr('familyHouseAnalytics.badges.twelveMonths')}</Badge>}
              />
              <TrendChart
                items={monthlyRegistrations}
                loading={analyticsQuery.isLoading}
                emptyLabel={tr('familyHouseAnalytics.states.noTrend')}
                language={language}
              />
            </Card>

            <Card className="space-y-5">
              <CardHeader
                title={tr('familyHouseAnalytics.sections.assignmentQuality')}
                subtitle={tr('familyHouseAnalytics.sections.assignmentQualityHint')}
                action={<ShieldCheck className="h-4 w-4 text-primary" />}
              />
              <CoveragePanel
                rows={coverageRows}
                total={totalMembers}
                language={language}
                loading={analyticsQuery.isLoading}
              />
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card className="space-y-4">
              <CardHeader
                title={tr('familyHouseLookup.analytics.biggestFamilies')}
                subtitle={tr('familyHouseAnalytics.sections.familyRankHint')}
                action={<Button variant="ghost" size="sm" icon={ArrowUpRight} onClick={() => navigate('/dashboard/users/family-house/details')}>{tr('familyHouseAnalytics.actions.explore')}</Button>}
              />
              <Table
                columns={familyRankColumns}
                data={familyRanks}
                loading={analyticsQuery.isLoading}
                emptyTitle={tr('familyHouseLookup.analytics.noFamilies')}
                emptyDescription={tr('familyHouseAnalytics.states.noRankData')}
                skeletonRows={6}
              />
            </Card>

            <Card className="space-y-4">
              <CardHeader
                title={tr('familyHouseLookup.analytics.biggestHouses')}
                subtitle={tr('familyHouseAnalytics.sections.houseRankHint')}
                action={<Home className="h-4 w-4 text-primary" />}
              />
              <Table
                columns={houseRankColumns}
                data={houseRanks}
                loading={analyticsQuery.isLoading}
                emptyTitle={tr('familyHouseLookup.analytics.noHouses')}
                emptyDescription={tr('familyHouseAnalytics.states.noRankData')}
                skeletonRows={6}
              />
            </Card>
          </section>

          <section className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="h-full min-w-0 space-y-5">
              <CardHeader
                title={tr('familyHouseAnalytics.sections.demographics')}
                subtitle={tr('familyHouseAnalytics.sections.demographicsHint')}
                action={<UsersIcon className="h-4 w-4 text-primary" />}
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <DonutBreakdown
                  title={tr('familyHouseAnalytics.charts.genderMix')}
                  total={totalMembers}
                  items={(distributions.genders || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.gender),
                  }))}
                  language={language}
                  loading={analyticsQuery.isLoading}
                />
                <BarBreakdown
                  title={tr('familyHouseAnalytics.charts.ageGroups')}
                  items={distributions.ageGroups || []}
                  language={language}
                  loading={analyticsQuery.isLoading}
                />
              </div>
            </Card>

            <Card className="h-full min-w-0 space-y-5">
              <CardHeader
                title={tr('familyHouseAnalytics.sections.accountMix')}
                subtitle={tr('familyHouseAnalytics.sections.accountMixHint')}
                action={<UserCheck className="h-4 w-4 text-primary" />}
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <BarBreakdown
                  title={tr('familyHouseAnalytics.charts.accountStatus')}
                  items={(distributions.accountStatuses || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.accountStatus),
                  }))}
                  language={language}
                  loading={analyticsQuery.isLoading}
                />
                <BarBreakdown
                  title={tr('familyHouseAnalytics.charts.roles')}
                  items={(distributions.roles || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.role),
                  }))}
                  language={language}
                  loading={analyticsQuery.isLoading}
                />
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <InsightPanel
              icon={Building2}
              title={tr('familyHouseAnalytics.sections.topCities')}
              subtitle={tr('familyHouseAnalytics.sections.topCitiesHint')}
              items={distributions.cities || []}
              language={language}
              loading={analyticsQuery.isLoading}
            />
            <InsightPanel
              icon={Activity}
              title={tr('familyHouseAnalytics.sections.presence')}
              subtitle={tr('familyHouseAnalytics.sections.presenceHint')}
              items={distributions.presenceStatuses || []}
              language={language}
              loading={analyticsQuery.isLoading}
            />
            <InsightPanel
              icon={BarChart3}
              title={tr('familyHouseAnalytics.sections.employment')}
              subtitle={tr('familyHouseAnalytics.sections.employmentHint')}
              items={distributions.employmentStatuses || []}
              language={language}
              loading={analyticsQuery.isLoading}
            />
          </section>
        </>
      )}
    </div>
  );
}

function KpiTile({ item, language, loading }) {
  const Icon = item.icon;
  const toneClasses = {
    primary: 'text-primary bg-primary/10 border-primary/15',
    secondary: 'text-secondary bg-secondary/10 border-secondary/15',
    accent: 'text-accent bg-accent/10 border-accent/15',
    danger: 'text-danger bg-danger-light border-danger/15',
  };

  return (
    <Card className="relative overflow-hidden p-0" padding={false}>
      <div className="flex min-h-[142px] flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-[11rem] text-[11px] font-semibold uppercase tracking-widest text-muted">
            {item.label}
          </p>
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${toneClasses[item.tone] || toneClasses.primary}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div>
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-surface-alt" />
          ) : (
            <p className="text-4xl font-semibold tracking-tight text-heading tabular-nums">
              {formatNumber(item.value, language)}
            </p>
          )}
          <p className="mt-2 text-sm text-muted">{item.detail}</p>
        </div>
      </div>
    </Card>
  );
}

function TrendChart({ items, loading, emptyLabel, language }) {
  const width = 900;
  const height = 320;
  const padding = { top: 28, right: 26, bottom: 44, left: 46 };
  const rows = Array.isArray(items) ? items : [];
  const maxValue = Math.max(...rows.map((item) => item.count || 0), 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const points = rows.map((item, index) => {
    const x = rows.length <= 1
      ? padding.left + chartWidth / 2
      : padding.left + (index / (rows.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((item.count || 0) / maxValue) * chartHeight;
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : '';

  if (loading) return <ChartSkeleton />;
  if (!rows.length) return <p className="rounded-lg bg-surface-alt/50 p-4 text-sm text-muted">{emptyLabel}</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-alt/20">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full">
        <defs>
          <linearGradient id="familyTrendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const y = padding.top + chartHeight * step;
          const value = Math.round(maxValue * (1 - step));
          return (
            <g key={step}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--color-border)" strokeDasharray="4 8" />
              <text x={padding.left - 12} y={y + 5} textAnchor="end" className="fill-muted text-[18px]">
                {formatNumber(value, language)}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const barHeight = height - padding.bottom - point.y;
          const barWidth = Math.max(chartWidth / Math.max(rows.length, 1) - 18, 12);
          return (
            <rect
              key={`${point.label}-bar`}
              x={point.x - barWidth / 2}
              y={point.y}
              width={barWidth}
              height={barHeight}
              rx="4"
              fill={index % 2 ? 'rgba(var(--color-secondary-rgb), 0.24)' : 'rgba(var(--color-primary-rgb), 0.18)'}
            />
          );
        })}
        <path d={areaPath} fill="url(#familyTrendArea)" />
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="6" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="3" />
            <text x={point.x} y={height - 14} textAnchor="middle" className="fill-muted text-[18px]">
              {String(point.label).slice(5)}
            </text>
            <text x={point.x} y={Math.max(point.y - 14, 18)} textAnchor="middle" className="fill-heading text-[20px] font-semibold">
              {formatNumber(point.count, language)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CoveragePanel({ rows, total, language, loading }) {
  if (loading) return <SkeletonStack count={4} />;

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.name} className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-heading">{row.name}</p>
              <p className="text-xs text-muted">
                {formatNumber(row.count, language)} / {formatNumber(total, language)}
              </p>
            </div>
            <span className="text-xl font-semibold text-heading tabular-nums">
              {formatPercent(row.percent, language)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(Math.max(row.percent, 2), 100)}%`, backgroundColor: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutBreakdown({ title, items, total, language, loading }) {
  const rows = toRows(items, 5).filter((item) => item.count > 0);
  let cursor = 0;
  const gradient = rows.length
    ? rows.map((item, index) => {
      const start = cursor;
      const end = cursor + getPercent(item.count, total);
      cursor = end;
      return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${end}%`;
    }).join(', ')
    : 'var(--color-border) 0% 100%';

  if (loading) return <ChartSkeleton compact />;

  return (
    <div>
      <p className="text-sm font-semibold text-heading">{title}</p>
      <div className="mt-4 flex items-center gap-5">
        <div
          className="grid h-32 w-32 shrink-0 place-items-center rounded-full border border-border"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="grid h-20 w-20 place-items-center rounded-full border border-border bg-surface text-sm font-semibold text-heading shadow-sm">
            {formatNumber(total, language)}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {rows.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span className="truncate text-muted">{item.name}</span>
              </span>
              <span className="font-semibold text-heading">{formatNumber(item.count, language)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarBreakdown({ title, items = [], language, loading, maxItems = 6 }) {
  const rows = toRows(items, maxItems);
  const maxValue = Math.max(...rows.map((item) => item.count || 0), 1);

  if (loading) return <SkeletonStack count={maxItems} />;

  return (
    <div className="space-y-3">
      {title ? <p className="text-sm font-semibold text-heading">{title}</p> : null}
      {!rows.length ? (
        <p className="rounded-md bg-surface-alt px-3 py-2 text-sm text-muted">---</p>
      ) : rows.map((item, index) => {
        const width = Math.max((item.count / maxValue) * 100, 4);
        return (
          <div key={`${item.name}-${index}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-muted">{item.name}</span>
              <span className="font-semibold text-heading">{formatNumber(item.count, language)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${width}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LookupConsole({
  lookupType,
  onLookupTypeChange,
  lookupName,
  onLookupNameChange,
  filteredLookupNames,
  lookupLoading,
  detailsHref,
  onOpenDetails,
  tr,
  isRTL,
}) {
  return (
    <div className="space-y-4">
      <Select
        value={lookupType}
        onChange={(event) => {
          onLookupTypeChange(event.target.value);
          onLookupNameChange('');
        }}
        options={[
          { value: 'familyName', label: tr('familyHouseLookup.filters.familyName') },
          { value: 'houseName', label: tr('familyHouseLookup.filters.houseName') },
        ]}
        containerClassName="!mb-0"
      />
      <SearchInput
        value={lookupName}
        onChange={onLookupNameChange}
        debounceMs={120}
        placeholder={tr('familyHouseAnalytics.lookup.placeholder')}
      />
      <div className="min-h-[150px] rounded-lg border border-border bg-surface-alt/35 p-2">
        {lookupLoading ? (
          <SkeletonStack count={4} />
        ) : filteredLookupNames.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted">{tr('familyHouseAnalytics.lookup.noMatches')}</p>
        ) : filteredLookupNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onLookupNameChange(name)}
            className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-heading transition hover:bg-surface"
          >
            <span className="truncate">{name}</span>
            <ChevronRight className={`h-4 w-4 text-muted ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={!detailsHref} icon={ArrowUpRight} onClick={onOpenDetails}>
          {tr('familyHouseAnalytics.actions.openDetails')}
        </Button>
        {detailsHref ? (
          <Link to={detailsHref} className="text-sm font-semibold text-primary hover:underline">
            {tr('familyHouseAnalytics.actions.viewProfile')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function InsightPanel({ icon: Icon, title, subtitle, items, language, loading }) {
  return (
    <Card className="space-y-5">
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
      />
      <BarBreakdown items={items} language={language} loading={loading} maxItems={8} />
    </Card>
  );
}

function ChartSkeleton({ compact = false }) {
  return <div className={`${compact ? 'h-40' : 'h-[320px]'} animate-pulse rounded-lg bg-surface-alt`} />;
}

function SkeletonStack({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-9 animate-pulse rounded-md bg-surface-alt" />
      ))}
    </div>
  );
}
