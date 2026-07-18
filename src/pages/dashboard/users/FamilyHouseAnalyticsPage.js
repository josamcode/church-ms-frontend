import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  Crown,
  Home,
  LockKeyhole,
  MapPin,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
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
import Skeleton from '../../../components/ui/Skeleton';
import Sparkline from '../../../components/ui/Sparkline';
import StatCard from '../../../components/ui/StatCard';
import DataCard, { RankTile } from '../../../components/ui/DataCard';
import Table from '../../../components/ui/Table';
import {
  FAMILY_HOUSE_DETAILS_PATH,
  buildLookupQuery,
} from './familyHouseLookup.shared';

// Warm, on-system track palette for distribution bars (matches the tokens the
// rest of the analytics pages cycle through).
const BAR_TRACKS = [
  'bg-primary',
  'bg-secondary',
  'bg-info',
  'bg-success',
  'bg-warning',
  'bg-danger',
];

const EMPTY_ANALYTICS = {
  summary: {},
  familyRanks: [],
  houseRanks: [],
  distributions: {},
  trends: {},
};

// Keep numerals Western (0-9) with thousands grouping so this page matches the
// digit style used across the rest of the system (dashboard, other analytics).
function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function formatPercent(value) {
  return `${formatNumber(Math.round(Number(value || 0)))}%`;
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
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();

  const tr = useCallback((key, values) => t(key, values), [t]);

  const analyticsQuery = useQuery({
    queryKey: ['users', 'family-house-analytics'],
    queryFn: async () => {
      const { data } = await usersApi.getFamilyHouseAnalytics();
      return data?.data || EMPTY_ANALYTICS;
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

  // Read-only presentational derivations: monthly registration series + trend.
  const registrationSeries = useMemo(
    () => monthlyRegistrations.map((item) => Number(item.count || 0)),
    [monthlyRegistrations]
  );

  const registrationTrend = useMemo(() => {
    if (registrationSeries.length < 2) return null;
    const last = registrationSeries[registrationSeries.length - 1];
    const prev = registrationSeries[registrationSeries.length - 2];
    if (prev === 0) return null;
    return Math.round(((last - prev) / prev) * 100);
  }, [registrationSeries]);

  // Latest-month value readout for the trend card (read-only derivation).
  const latestRegistration = useMemo(
    () => (registrationSeries.length ? registrationSeries[registrationSeries.length - 1] : 0),
    [registrationSeries]
  );

  const highlights = useMemo(() => {
    const topFamily = familyRanks[0] || null;
    const topHouse = houseRanks[0] || null;
    const topCity = (distributions.cities || [])[0] || null;
    return { topFamily, topHouse, topCity };
  }, [familyRanks, houseRanks, distributions.cities]);

  const hasHighlights = Boolean(highlights.topFamily || highlights.topHouse || highlights.topCity);

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
        spark: registrationSeries,
        trend: registrationTrend,
      },
      {
        label: tr('familyHouseLookup.analytics.totalFamilies'),
        value: summary.totalFamilies,
        detail: tr('familyHouseAnalytics.metrics.coveredValue', {
          percent: formatPercent(summary.familyCoveragePct),
        }),
        icon: Building2,
        tone: 'gold',
      },
      {
        label: tr('familyHouseLookup.analytics.totalHouses'),
        value: summary.totalHouses,
        detail: tr('familyHouseAnalytics.metrics.coveredValue', {
          percent: formatPercent(summary.houseCoveragePct),
        }),
        icon: Home,
        tone: 'info',
      },
      {
        label: tr('familyHouseAnalytics.metrics.loginEnabled'),
        value: summary.loginEnabledMembers,
        detail: tr('familyHouseAnalytics.metrics.memberShare', {
          percent: formatPercent(getPercent(summary.loginEnabledMembers, totalMembers)),
        }),
        icon: UserCheck,
        tone: 'success',
      },
      {
        label: tr('familyHouseLookup.summary.lockedCount'),
        value: summary.lockedMembers,
        detail: tr('familyHouseAnalytics.metrics.memberShare', {
          percent: formatPercent(getPercent(summary.lockedMembers, totalMembers)),
        }),
        icon: LockKeyhole,
        tone: 'danger',
      },
      {
        label: tr('familyHouseAnalytics.metrics.familyCoverage'),
        value: formatPercent(summary.familyCoveragePct),
        detail: tr('familyHouseAnalytics.metrics.memberShare', {
          percent: formatPercent(summary.houseCoveragePct),
        }),
        icon: ShieldCheck,
        tone: 'default',
      },
    ],
    [summary, totalMembers, registrationSeries, registrationTrend, tr]
  );

  // Rank badge folded into the name cell so the family/house NAME is the primary
  // (first non-action) column — on mobile the Table renders that as the card
  // header, keeping the ranked list scannable instead of leading with a number.
  const familyRankColumns = useMemo(
    () => [
      {
        key: 'name',
        label: tr('familyHouseAnalytics.table.family'),
        render: (row, index) => (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-alt text-xs font-semibold text-muted tabular-nums">
              {formatNumber(index + 1)}
            </span>
            <Link
              to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('familyName', row.name)}`}
              className="truncate font-semibold text-heading hover:text-primary"
            >
              {row.name}
            </Link>
          </div>
        ),
      },
      {
        key: 'count',
        label: tr('familyHouseAnalytics.table.members'),
        render: (row) => <Badge variant="primary">{formatNumber(row.count)}</Badge>,
      },
      {
        key: 'houseCount',
        label: tr('familyHouseAnalytics.table.houses'),
        render: (row) => <span className="text-sm font-medium text-heading">{formatNumber(row.houseCount)}</span>,
      },
      {
        key: 'averageAge',
        label: tr('familyHouseAnalytics.table.avgAge'),
        render: (row) => <span className="text-sm text-muted">{row.averageAge ?? '---'}</span>,
      },
    ],
    [tr]
  );

  const houseRankColumns = useMemo(
    () => [
      {
        key: 'name',
        label: tr('familyHouseAnalytics.table.house'),
        render: (row, index) => (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-alt text-xs font-semibold text-muted tabular-nums">
              {formatNumber(index + 1)}
            </span>
            <Link
              to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('houseName', row.name)}`}
              className="truncate font-semibold text-heading hover:text-primary"
            >
              {row.name}
            </Link>
          </div>
        ),
      },
      {
        key: 'count',
        label: tr('familyHouseAnalytics.table.members'),
        render: (row) => <Badge variant="primary">{formatNumber(row.count)}</Badge>,
      },
      {
        key: 'familyCount',
        label: tr('familyHouseAnalytics.table.families'),
        render: (row) => <span className="text-sm font-medium text-heading">{formatNumber(row.familyCount)}</span>,
      },
      {
        key: 'lockedCount',
        label: tr('familyHouseAnalytics.table.locked'),
        render: (row) => <span className="text-sm text-muted">{formatNumber(row.lockedCount)}</span>,
      },
    ],
    [tr]
  );

  /* ── bespoke leaderboard cards: rank tile, family/house name, member count
        headline and the secondary counts as metadata ── */
  const renderFamilyRankCard = (row, rowIndex) => (
    <DataCard
      accent={rowIndex === 0 ? 'gold' : 'primary'}
      onClick={() => navigate(`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('familyName', row.name)}`)}
      leading={<RankTile rank={rowIndex + 1} />}
      title={row.name}
      badge={<Badge variant="primary">{formatNumber(row.count)}</Badge>}
      meta={
        <>
          <span className="inline-flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            {formatNumber(row.houseCount)}
          </span>
          {row.averageAge != null ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{tr('familyHouseAnalytics.table.avgAge')}: {row.averageAge}</span>
            </>
          ) : null}
        </>
      }
      actions={
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      }
    />
  );

  const renderHouseRankCard = (row, rowIndex) => (
    <DataCard
      accent={rowIndex === 0 ? 'gold' : 'primary'}
      onClick={() => navigate(`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('houseName', row.name)}`)}
      leading={<RankTile rank={rowIndex + 1} />}
      title={row.name}
      badge={<Badge variant="primary">{formatNumber(row.count)}</Badge>}
      meta={
        <>
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="h-3.5 w-3.5" />
            {formatNumber(row.familyCount)}
          </span>
          {row.lockedCount ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <LockKeyhole className="h-3.5 w-3.5" />
                {formatNumber(row.lockedCount)}
              </span>
            </>
          ) : null}
        </>
      }
      actions={
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      }
    />
  );

  const errorMessage = analyticsQuery.error ? normalizeApiError(analyticsQuery.error).message : null;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
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
            <Badge variant="gold" dot>{tr('familyHouseAnalytics.badges.liveDataset')}</Badge>
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
        <Card padding="lg" className="border-danger/25">
          <EmptyState
            icon={UsersIcon}
            title={tr('familyHouseAnalytics.states.errorTitle')}
            description={errorMessage}
            action={
              <Button
                variant="outline"
                icon={RefreshCw}
                loading={analyticsQuery.isFetching}
                onClick={() => analyticsQuery.refetch()}
              >
                {tr('familyHouseAnalytics.actions.refresh')}
              </Button>
            }
          />
        </Card>
      ) : analyticsQuery.isLoading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {/* ══ KPI BAND ══════════════════════════════════════════════════ */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {kpiItems.map((item) => (
              <StatCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={typeof item.value === 'string' ? item.value : formatNumber(item.value ?? 0)}
                hint={item.detail}
                tone={item.tone}
                spark={item.spark}
                trend={item.trend}
                trendLabel={
                  typeof item.trend === 'number' ? `${formatNumber(Math.abs(item.trend))}%` : undefined
                }
                isRTL={isRTL}
              />
            ))}
          </section>

          {/* ══ HIGHLIGHTS STRIP ══════════════════════════════════════════ */}
          {hasHighlights ? (
            <Card padding="md" tone="gold" className="overflow-hidden">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:divide-x sm:divide-border/60 sm:rtl:divide-x-reverse">
                {highlights.topFamily ? (
                  <HighlightItem
                    icon={Crown}
                    wrap="bg-secondary/12 text-secondary"
                    label={tr('familyHouseLookup.analytics.biggestFamilies')}
                    value={highlights.topFamily.name}
                    hint={tr('familyHouseAnalytics.metrics.memberShare', {
                      percent: formatNumber(highlights.topFamily.count),
                    })}
                  />
                ) : null}
                {highlights.topHouse ? (
                  <HighlightItem
                    icon={Home}
                    wrap="bg-primary/10 text-primary"
                    label={tr('familyHouseLookup.analytics.biggestHouses')}
                    value={highlights.topHouse.name}
                    hint={tr('familyHouseAnalytics.metrics.memberShare', {
                      percent: formatNumber(highlights.topHouse.count),
                    })}
                  />
                ) : null}
                {highlights.topCity ? (
                  <HighlightItem
                    icon={MapPin}
                    wrap="bg-info/12 text-info"
                    label={tr('familyHouseAnalytics.sections.topCities')}
                    value={highlights.topCity.name}
                    hint={tr('familyHouseAnalytics.metrics.memberShare', {
                      percent: formatNumber(highlights.topCity.count),
                    })}
                  />
                ) : null}
              </div>
            </Card>
          ) : null}

          {/* ══ REGISTRATION TREND + DATA QUALITY ══════════════════════════ */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.85fr)]">
            <Card padding="lg">
              <CardHeader
                icon={TrendingUp}
                title={tr('familyHouseAnalytics.sections.registrationTrend')}
                subtitle={tr('familyHouseAnalytics.sections.registrationTrendHint')}
                action={<Badge variant="primary">{tr('familyHouseAnalytics.badges.twelveMonths')}</Badge>}
              />
              <RegistrationTrendCard
                items={monthlyRegistrations}
                series={registrationSeries}
                latest={latestRegistration}
                trend={registrationTrend}
                totalLabel={tr('familyHouseLookup.analytics.totalMembers')}
                emptyLabel={tr('familyHouseAnalytics.states.noTrend')}
              />
            </Card>

            <Card padding="lg">
              <CardHeader
                icon={ShieldCheck}
                title={tr('familyHouseAnalytics.sections.assignmentQuality')}
                subtitle={tr('familyHouseAnalytics.sections.assignmentQualityHint')}
              />
              <CoveragePanel rows={coverageRows} total={totalMembers} />
            </Card>
          </section>

          {/* ══ RANK TABLES ════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card padding="lg">
              <CardHeader
                icon={Crown}
                title={tr('familyHouseLookup.analytics.biggestFamilies')}
                subtitle={tr('familyHouseAnalytics.sections.familyRankHint')}
                action={(
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ArrowUpRight}
                    onClick={() => navigate('/dashboard/users/family-house/details')}
                  >
                    {tr('familyHouseAnalytics.actions.explore')}
                  </Button>
                )}
              />
              <Table
                flush
                columns={familyRankColumns}
                data={familyRanks}
                loading={false}
                emptyTitle={tr('familyHouseLookup.analytics.noFamilies')}
                emptyDescription={tr('familyHouseAnalytics.states.noRankData')}
                skeletonRows={6}
                renderCard={renderFamilyRankCard}
                viewStorageKey="familyHouse:familyRanks:viewMode"
              />
            </Card>

            <Card padding="lg">
              <CardHeader
                icon={Home}
                title={tr('familyHouseLookup.analytics.biggestHouses')}
                subtitle={tr('familyHouseAnalytics.sections.houseRankHint')}
              />
              <Table
                flush
                columns={houseRankColumns}
                data={houseRanks}
                loading={false}
                emptyTitle={tr('familyHouseLookup.analytics.noHouses')}
                emptyDescription={tr('familyHouseAnalytics.states.noRankData')}
                skeletonRows={6}
                renderCard={renderHouseRankCard}
                viewStorageKey="familyHouse:houseRanks:viewMode"
              />
            </Card>
          </section>

          {/* ══ DEMOGRAPHICS + ACCOUNT MIX ═════════════════════════════════ */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card padding="lg">
              <CardHeader
                icon={UsersIcon}
                title={tr('familyHouseAnalytics.sections.demographics')}
                subtitle={tr('familyHouseAnalytics.sections.demographicsHint')}
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <BarBreakdown
                  title={tr('familyHouseAnalytics.charts.genderMix')}
                  items={(distributions.genders || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.gender),
                  }))}
                />
                <BarBreakdown
                  title={tr('familyHouseAnalytics.charts.ageGroups')}
                  items={distributions.ageGroups || []}
                />
              </div>
            </Card>

            <Card padding="lg">
              <CardHeader
                icon={UserCheck}
                title={tr('familyHouseAnalytics.sections.accountMix')}
                subtitle={tr('familyHouseAnalytics.sections.accountMixHint')}
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <BarBreakdown
                  title={tr('familyHouseAnalytics.charts.accountStatus')}
                  items={(distributions.accountStatuses || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.accountStatus),
                  }))}
                />
                <BarBreakdown
                  title={tr('familyHouseAnalytics.charts.roles')}
                  items={(distributions.roles || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.role),
                  }))}
                />
              </div>
            </Card>
          </section>

          {/* ══ CITIES / PRESENCE / EMPLOYMENT ═════════════════════════════ */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <InsightPanel
              icon={Building2}
              title={tr('familyHouseAnalytics.sections.topCities')}
              subtitle={tr('familyHouseAnalytics.sections.topCitiesHint')}
              items={distributions.cities || []}
            />
            <InsightPanel
              icon={Activity}
              title={tr('familyHouseAnalytics.sections.presence')}
              subtitle={tr('familyHouseAnalytics.sections.presenceHint')}
              items={distributions.presenceStatuses || []}
            />
            <InsightPanel
              icon={BarChart3}
              title={tr('familyHouseAnalytics.sections.employment')}
              subtitle={tr('familyHouseAnalytics.sections.employmentHint')}
              items={distributions.employmentStatuses || []}
            />
          </section>
        </>
      )}
    </div>
  );
}

/* ── Registration velocity: clean area/line trend ──────────────────────────── */

function RegistrationTrendCard({ items, series, latest, trend, totalLabel, emptyLabel }) {
  const rows = Array.isArray(items) ? items : [];

  if (!rows.length) {
    return <EmptyState compact icon={TrendingUp} title={emptyLabel} />;
  }

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? ArrowUpRight : null;
  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-muted';

  // Chart geometry — a compact, responsive area+line (Sparkline aesthetic scaled
  // up with readable month labels). Uses a normalised viewBox so it stretches.
  const width = 640;
  const height = 200;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;
  const values = rows.map((item) => Number(item.count || 0));
  const max = Math.max(...values, 1);
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const points = rows.map((item, index) => {
    const x = rows.length <= 1
      ? padX + innerW / 2
      : padX + (index / (rows.length - 1)) * innerW;
    const y = padTop + innerH - (Number(item.count || 0) / max) * innerH;
    return { x, y, label: String(item.label || ''), count: Number(item.count || 0) };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const baseY = padTop + innerH;
  const area = points.length
    ? `${line} L ${points[points.length - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`
    : '';

  // Only the first & last points get a marker. With preserveAspectRatio="none"
  // the viewBox stretches horizontally, so dense mid-dots smear into ovals on a
  // narrow screen — endpoints keep the "current value" legible and clean.
  const markerPoints = points.length > 1 ? [points[0], points[points.length - 1]] : points;

  // Thin the x-axis labels so 12 months never crush together on a 375px screen:
  // always show first & last, then step through the rest. Full month stays in
  // the title attribute for tap/hover.
  const labelStep = points.length > 7 ? Math.ceil(points.length / 6) : 1;
  const peak = points.reduce((best, p) => (p.count > best.count ? p : best), points[0]);

  return (
    <div className="space-y-4">
      {/* value readout — latest month + peak for quick context */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{totalLabel}</p>
          <p className="mt-1 text-3xl font-bold leading-none tracking-tight text-heading tabular-nums">
            {formatNumber(latest)}
          </p>
        </div>
        {typeof trend === 'number' && TrendIcon ? (
          <span className={`inline-flex items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1 text-sm font-semibold ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            {formatNumber(Math.abs(trend))}%
          </span>
        ) : null}
      </div>

      {/* area/line chart */}
      <div className="rounded-xl border border-border bg-surface-alt/30 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-40 w-full sm:h-44"
          preserveAspectRatio="none"
          role="img"
        >
          <defs>
            <linearGradient id="familyTrendArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((step) => {
            const y = padTop + innerH * step;
            return (
              <line
                key={step}
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray="3 7"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          <path d={area} fill="url(#familyTrendArea)" />
          <path
            d={line}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {markerPoints.map((p) => (
            <circle
              key={`${p.label}-dot`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="var(--color-surface)"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {/* thinned month labels — legible on narrow screens, full value in title */}
        <div className="mt-2 flex items-stretch justify-between gap-1">
          {points.map((p, index) => {
            const show = index === 0 || index === points.length - 1 || index % labelStep === 0;
            return (
              <span
                key={`${p.label}-lbl`}
                className="flex-1 truncate text-center text-[10px] font-medium text-muted"
                title={`${p.label}: ${formatNumber(p.count)}`}
              >
                {show ? (p.label.length > 5 ? p.label.slice(5) : p.label) : ' '}
              </span>
            );
          })}
        </div>
      </div>

      {/* peak-month readout keeps a second insight on-screen without a wide chart */}
      {points.length > 1 ? (
        <div className="flex items-center justify-between rounded-lg bg-surface-alt/40 px-3 py-2 text-xs">
          <span className="text-muted">{peak.label}</span>
          <span className="font-bold tabular-nums text-primary">{formatNumber(peak.count)}</span>
        </div>
      ) : null}

      {series.length > 1 ? (
        <div className="-mb-1">
          <Sparkline data={series} color="var(--color-primary)" />
        </div>
      ) : null}
    </div>
  );
}

/* ── Data quality coverage bars ────────────────────────────────────────────── */

function CoveragePanel({ rows, total }) {
  return (
    <div className="space-y-5">
      {rows.map((row) => (
        <div key={row.name}>
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-heading">{row.name}</p>
              <p className="text-xs text-muted">
                {formatNumber(row.count)} / {formatNumber(total)}
              </p>
            </div>
            <span className="text-lg font-bold tabular-nums text-heading">
              {formatPercent(row.percent)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(row.percent, 2), 100)}%`, backgroundColor: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Distribution bars (gender / age / status / roles / cities …) ──────────── */

function BarBreakdown({ title, items = [], maxItems = 8 }) {
  const rows = toRows(items, maxItems);
  const maxValue = Math.max(...rows.map((item) => item.count || 0), 1);
  const total = rows.reduce((sum, item) => sum + Number(item.count || 0), 0);

  return (
    <div className="space-y-4">
      {title ? <p className="text-sm font-semibold text-heading">{title}</p> : null}
      {!rows.length ? (
        <EmptyState compact icon={BarChart3} title="---" className="!py-8" />
      ) : (
        <div className="space-y-3.5">
          {rows.map((item, index) => {
            const pct = Math.max((item.count / maxValue) * 100, 2);
            const share = getPercent(item.count, total);
            const color = BAR_TRACKS[index % BAR_TRACKS.length];
            return (
              <div key={`${item.name}-${index}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-xs font-medium text-heading">{item.name}</span>
                  <span className="flex flex-shrink-0 items-baseline gap-1.5 tabular-nums">
                    <span className="text-xs font-bold text-primary">{formatNumber(item.count)}</span>
                    <span className="text-[10px] font-medium text-muted">{formatPercent(share)}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
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
    </div>
  );
}

/* ── Highlights strip item ─────────────────────────────────────────────────── */

function HighlightItem({ icon: Icon, wrap, label, value, hint }) {
  return (
    <div className="flex items-start gap-3 sm:px-4 sm:first:ps-0">
      <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${wrap}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
        <p className="truncate text-sm font-bold text-heading">{value}</p>
        <p className="truncate text-xs text-muted">{hint}</p>
      </div>
    </div>
  );
}

/* ── Insight panel (city / presence / employment) ──────────────────────────── */

function InsightPanel({ icon: Icon, title, subtitle, items }) {
  return (
    <Card padding="lg">
      <CardHeader icon={Icon} title={title} subtitle={subtitle} />
      <BarBreakdown items={items} maxItems={8} />
    </Card>
  );
}

/* ── Loading skeleton (matches system analytics layout) ────────────────────── */

function AnalyticsSkeleton() {
  return (
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.85fr)]">
        <Card padding="lg" className="space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </Card>
        <Card padding="lg" className="space-y-4">
          <Skeleton className="h-5 w-1/3" />
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-6 w-full" />
          ))}
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} padding="lg" className="space-y-4">
            <Skeleton className="h-5 w-1/3" />
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-6 w-full" />
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
