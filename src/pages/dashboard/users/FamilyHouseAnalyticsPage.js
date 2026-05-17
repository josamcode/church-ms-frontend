import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  Home,
  Lock,
  RefreshCw,
  Search,
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
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import Select from '../../../components/ui/Select';
import {
  FAMILY_HOUSE_DETAILS_PATH,
  buildLookupQuery,
  normalizeText,
} from './familyHouseLookup.shared';

const CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-primary-light)',
];

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function toPercent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 0)) * 100);
}

function getLabel(value, maps = {}) {
  return maps[value] || value || '---';
}

export default function FamilyHouseAnalyticsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lookupType, setLookupType] = useState('familyName');
  const [lookupName, setLookupName] = useState('');
  const [lookupDropdownOpen, setLookupDropdownOpen] = useState(false);
  const lookupInputRef = useRef(null);

  const tf = useCallback((key, fallback, values) => {
    const value = t(key, values);
    return value === key ? fallback : value;
  }, [t]);

  const labelMaps = useMemo(
    () => ({
      gender: {
        male: tf('common.gender.male', 'Male'),
        female: tf('common.gender.female', 'Female'),
        other: tf('common.gender.other', 'Other'),
      },
      accountStatus: {
        approved: tf('accountStatuses.approved', 'Approved'),
        pending: tf('accountStatuses.pending', 'Pending'),
        rejected: tf('accountStatuses.rejected', 'Rejected'),
      },
      role: {
        SUPER_ADMIN: tf('roles.superAdmin', 'Super admin'),
        ADMIN: tf('roles.admin', 'Admin'),
        USER: tf('roles.user', 'User'),
      },
    }),
    [tf]
  );

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
      return data?.data || {};
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

  const analytics = analyticsQuery.data || {};
  const summary = analytics.summary || {};
  const distributions = analytics.distributions || {};
  const trends = analytics.trends || {};
  const familyRanks = Array.isArray(analytics.familyRanks) ? analytics.familyRanks : [];
  const houseRanks = Array.isArray(analytics.houseRanks) ? analytics.houseRanks : [];
  const monthlyRegistrations = Array.isArray(trends.monthlyRegistrations)
    ? trends.monthlyRegistrations
    : [];

  const lookupNames = useMemo(
    () => (Array.isArray(lookupNamesQuery.data) ? lookupNamesQuery.data : []),
    [lookupNamesQuery.data]
  );

  const filteredLookupNames = useMemo(() => {
    if (!normalizedLookupName) return lookupNames.slice(0, 20);
    return lookupNames
      .filter((name) => normalizeText(name).includes(normalizedLookupName))
      .slice(0, 20);
  }, [lookupNames, normalizedLookupName]);

  const coverageItems = useMemo(
    () => [
      {
        name: tf('familyHouseAnalytics.familyCoverage', 'Family coverage'),
        count: Number(summary.membersWithFamilyName || 0),
        percent: Number(summary.familyCoveragePct || 0),
      },
      {
        name: tf('familyHouseAnalytics.houseCoverage', 'House coverage'),
        count: Number(summary.membersWithHouseName || 0),
        percent: Number(summary.houseCoveragePct || 0),
      },
    ],
    [summary.membersWithFamilyName, summary.membersWithHouseName, summary.familyCoveragePct, summary.houseCoveragePct, tf]
  );

  useEffect(() => {
    const urlLookupType = searchParams.get('lookupType');
    const urlLookupName = String(searchParams.get('lookupName') || '').trim();

    if (urlLookupType === 'houseName' || urlLookupType === 'familyName') {
      setLookupType(urlLookupType);
    }

    if (urlLookupName) {
      setLookupName(urlLookupName);
      setLookupDropdownOpen(false);
    }
  }, [searchParams]);

  const handleOpenDetails = () => {
    if (!detailsHref) return;
    navigate(detailsHref);
  };

  const errorMessage = analyticsQuery.error ? normalizeApiError(analyticsQuery.error).message : null;

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users'), href: '/dashboard/users' },
          { label: tf('familyHouseLookup.analyticsPage.page', 'Family analytics') },
        ]}
      />

      <PageHeader
        title={tf('familyHouseLookup.analyticsPage.title', 'Family and House Analytics')}
        subtitle={tf(
          'familyHouseLookup.analyticsPage.subtitle',
          'Operational view of household coverage, member distribution, and registration movement.'
        )}
        actions={(
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={analyticsQuery.isFetching}
            onClick={() => analyticsQuery.refetch()}
          >
            {tf('common.actions.refresh', 'Refresh')}
          </Button>
        )}
        className="border-b border-border pb-6"
      />

      {errorMessage ? (
        <Card>
          <EmptyState
            icon={UsersIcon}
            title={tf('familyHouseLookup.empty.errorTitle', 'Unable to load analytics')}
            description={errorMessage}
          />
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={UsersIcon}
              label={tf('familyHouseLookup.analytics.totalMembers', 'Total members')}
              value={summary.totalMembers}
              detail={tf('familyHouseAnalytics.averageAge', 'Avg age: {age}', {
                age: summary.averageAge ?? '---',
              })}
              loading={analyticsQuery.isLoading}
            />
            <MetricCard
              icon={Building2}
              label={tf('familyHouseLookup.analytics.totalFamilies', 'Families')}
              value={summary.totalFamilies}
              detail={`${summary.familyCoveragePct || 0}% ${tf('familyHouseAnalytics.covered', 'covered')}`}
              loading={analyticsQuery.isLoading}
            />
            <MetricCard
              icon={Home}
              label={tf('familyHouseLookup.analytics.totalHouses', 'Houses')}
              value={summary.totalHouses}
              detail={`${summary.houseCoveragePct || 0}% ${tf('familyHouseAnalytics.covered', 'covered')}`}
              loading={analyticsQuery.isLoading}
            />
            <MetricCard
              icon={Lock}
              label={tf('familyHouseLookup.summary.lockedCount', 'Locked members')}
              value={summary.lockedMembers}
              detail={`${toPercent(summary.lockedMembers, summary.totalMembers)}% ${tf('familyHouseAnalytics.ofMembers', 'of members')}`}
              loading={analyticsQuery.isLoading}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <Card className="space-y-5">
              <PanelHeader
                icon={TrendingUp}
                title={tf('familyHouseAnalytics.registrationTrend', 'Registration trend')}
                subtitle={tf('familyHouseAnalytics.registrationTrendHint', 'New members by month')}
              />
              <LineTrendChart
                items={monthlyRegistrations}
                loading={analyticsQuery.isLoading}
                emptyLabel={tf('familyHouseAnalytics.noTrend', 'No registration trend available.')}
              />
            </Card>

            <Card className="space-y-5">
              <PanelHeader
                icon={Activity}
                title={tf('familyHouseAnalytics.coverageHealth', 'Coverage health')}
                subtitle={tf('familyHouseAnalytics.coverageHealthHint', 'How complete family and house assignments are')}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {coverageItems.map((item, index) => (
                  <ProgressRing
                    key={item.name}
                    item={item}
                    color={CHART_COLORS[index]}
                    total={summary.totalMembers}
                    loading={analyticsQuery.isLoading}
                  />
                ))}
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="space-y-5">
              <PanelHeader
                icon={BarChart3}
                title={tf('familyHouseLookup.analytics.biggestFamilies', 'Largest families')}
                subtitle={tf('familyHouseAnalytics.familyRankHint', 'Top families by number of linked members')}
              />
              <RankTable
                items={familyRanks}
                loading={analyticsQuery.isLoading}
                emptyLabel={tf('familyHouseLookup.analytics.noFamilies', 'No families found')}
                linkType="familyName"
                secondaryLabel={tf('familyHouseAnalytics.houses', 'Houses')}
                secondaryField="houseCount"
              />
            </Card>

            <Card className="space-y-5">
              <PanelHeader
                icon={Home}
                title={tf('familyHouseLookup.analytics.biggestHouses', 'Largest houses')}
                subtitle={tf('familyHouseAnalytics.houseRankHint', 'Top houses by number of members')}
              />
              <RankTable
                items={houseRanks}
                loading={analyticsQuery.isLoading}
                emptyLabel={tf('familyHouseLookup.analytics.noHouses', 'No houses found')}
                linkType="houseName"
                secondaryLabel={tf('familyHouseAnalytics.families', 'Families')}
                secondaryField="familyCount"
              />
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="space-y-5">
              <PanelHeader
                icon={UsersIcon}
                title={tf('familyHouseAnalytics.demographics', 'Demographics')}
                subtitle={tf('familyHouseAnalytics.demographicsHint', 'Age and gender composition')}
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DonutChart
                  title={tf('usersListPage.columns.gender', 'Gender')}
                  items={(distributions.genders || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.gender),
                  }))}
                  total={summary.totalMembers}
                  loading={analyticsQuery.isLoading}
                />
                <HorizontalBarList
                  title={tf('usersListPage.columns.ageGroup', 'Age group')}
                  items={distributions.ageGroups || []}
                  loading={analyticsQuery.isLoading}
                />
              </div>
            </Card>

            <Card className="space-y-5">
              <PanelHeader
                icon={UserCheck}
                title={tf('familyHouseAnalytics.accountMix', 'Account mix')}
                subtitle={tf('familyHouseAnalytics.accountMixHint', 'Account status, roles, and login readiness')}
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <HorizontalBarList
                  title={tf('usersRequestsPage.filters.status', 'Account status')}
                  items={(distributions.accountStatuses || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.accountStatus),
                  }))}
                  loading={analyticsQuery.isLoading}
                />
                <HorizontalBarList
                  title={tf('usersListPage.columns.role', 'Role')}
                  items={(distributions.roles || []).map((item) => ({
                    ...item,
                    name: getLabel(item.name, labelMaps.role),
                  }))}
                  loading={analyticsQuery.isLoading}
                />
              </div>
            </Card>

            {/* <LookupPanel
              lookupType={lookupType}
              setLookupType={setLookupType}
              lookupName={lookupName}
              setLookupName={setLookupName}
              lookupDropdownOpen={lookupDropdownOpen}
              setLookupDropdownOpen={setLookupDropdownOpen}
              lookupInputRef={lookupInputRef}
              filteredLookupNames={filteredLookupNames}
              lookupNamesLoading={lookupNamesQuery.isLoading}
              detailsHref={detailsHref}
              onOpenDetails={handleOpenDetails}
              tf={tf}
            /> */}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="space-y-5">
              <PanelHeader
                icon={Building2}
                title={tf('familyHouseAnalytics.topCities', 'Top cities')}
                subtitle={tf('familyHouseAnalytics.topCitiesHint', 'Where members are concentrated')}
              />
              <HorizontalBarList
                items={distributions.cities || []}
                loading={analyticsQuery.isLoading}
                maxItems={8}
              />
            </Card>

            <Card className="space-y-5">
              <PanelHeader
                icon={Activity}
                title={tf('familyHouseAnalytics.presence', 'Presence')}
                subtitle={tf('familyHouseAnalytics.presenceHint', 'Travel and presence profile')}
              />
              <HorizontalBarList
                items={distributions.presenceStatuses || []}
                loading={analyticsQuery.isLoading}
                maxItems={8}
              />
            </Card>

            <Card className="space-y-5">
              <PanelHeader
                icon={BarChart3}
                title={tf('familyHouseAnalytics.employment', 'Employment')}
                subtitle={tf('familyHouseAnalytics.employmentHint', 'Household work and study signals')}
              />
              <HorizontalBarList
                items={distributions.employmentStatuses || []}
                loading={analyticsQuery.isLoading}
                maxItems={8}
              />
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function PanelHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-heading">{title}</h2>
        </div>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, loading }) {
  return (
    <Card className="min-h-[132px]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </span>
        <Badge variant="secondary">Live</Badge>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-surface-alt" />
      ) : (
        <p className="mt-1 text-3xl font-semibold tracking-tight text-heading">{formatNumber(value)}</p>
      )}
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </Card>
  );
}

function ProgressRing({ item, total, color, loading }) {
  const percent = Math.min(Math.max(Number(item.percent || 0), 0), 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface-alt/40 p-4">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 shrink-0">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(var(--color-border-rgb), 0.8)" strokeWidth="10" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={loading ? circumference : offset}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-heading">{item.name}</p>
        <p className="mt-1 text-2xl font-semibold text-heading">{loading ? '...' : `${percent}%`}</p>
        <p className="mt-1 text-sm text-muted">
          {formatNumber(item.count)} / {formatNumber(total)}
        </p>
      </div>
    </div>
  );
}

function LineTrendChart({ items, loading, emptyLabel }) {
  const width = 720;
  const height = 240;
  const padding = 28;
  const maxValue = Math.max(...items.map((item) => item.count || 0), 1);
  const points = items.map((item, index) => {
    const x = items.length <= 1
      ? width / 2
      : padding + (index / (items.length - 1)) * (width - padding * 2);
    const y = height - padding - ((item.count || 0) / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  if (loading) {
    return <div className="h-[260px] animate-pulse rounded-lg bg-surface-alt" />;
  }

  if (!items.length) {
    return <p className="rounded-lg border border-border bg-surface-alt/40 p-4 text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-alt/30 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        {[0, 1, 2, 3].map((tick) => {
          const y = padding + tick * ((height - padding * 2) / 3);
          return <line key={tick} x1={padding} x2={width - padding} y1={y} y2={y} stroke="var(--color-border)" strokeDasharray="4 6" />;
        })}
        <path d={areaPath} fill="rgba(var(--color-primary-rgb), 0.12)" />
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="3" />
            <text x={point.x} y={height - 6} textAnchor="middle" className="fill-muted text-[20px]">
              {point.label.slice(5)}
            </text>
            <text x={point.x} y={Math.max(point.y - 12, 14)} textAnchor="middle" className="fill-heading text-[22px] font-semibold">
              {point.count}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RankTable({ items, loading, emptyLabel, linkType, secondaryLabel, secondaryField }) {
  const maxValue = Math.max(...items.map((item) => item.count || 0), 1);

  if (loading) return <SkeletonRows count={6} />;
  if (!items.length) return <p className="rounded-lg bg-surface-alt/40 p-4 text-sm text-muted">{emptyLabel}</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {items.map((item, index) => {
        const width = Math.max((item.count / maxValue) * 100, 5);
        return (
          <div key={`${item.name}-${index}`} className="border-b border-border last:border-b-0">
            <div className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-surface-alt text-xs font-semibold text-muted">
                {index + 1}
              </span>
              <div className="min-w-0">
                <Link
                  to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery(linkType, item.name)}`}
                  className="truncate text-sm font-semibold text-heading hover:text-primary"
                >
                  {item.name}
                </Link>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-heading">{formatNumber(item.count)}</p>
                <p className="text-xs text-muted">{secondaryLabel}: {formatNumber(item[secondaryField])}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ title, items, total, loading }) {
  const normalized = items.filter((item) => item.count > 0);
  let cursor = 0;
  const gradient = normalized.length
    ? normalized.map((item, index) => {
      const start = cursor;
      const end = cursor + toPercent(item.count, total);
      cursor = end;
      return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${end}%`;
    }).join(', ')
    : 'var(--color-border) 0% 100%';

  if (loading) return <div className="h-[220px] animate-pulse rounded-lg bg-surface-alt" />;

  return (
    <div className="rounded-lg border border-border bg-surface-alt/30 p-4">
      <p className="text-sm font-semibold text-heading">{title}</p>
      <div className="mt-4 flex items-center gap-5">
        <div
          className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="grid h-16 w-16 place-items-center rounded-full bg-surface text-sm font-semibold text-heading">
            {formatNumber(total)}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {normalized.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span className="truncate text-muted">{item.name}</span>
              </span>
              <span className="font-semibold text-heading">{formatNumber(item.count)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HorizontalBarList({ title, items = [], loading, maxItems = 6 }) {
  const rows = items.slice(0, maxItems);
  const maxValue = Math.max(...rows.map((item) => item.count || 0), 1);

  if (loading) return <SkeletonRows count={maxItems} />;

  return (
    <div className="space-y-3">
      {title ? <p className="text-sm font-semibold text-heading">{title}</p> : null}
      {!rows.length ? (
        <p className="rounded-lg bg-surface-alt/40 p-3 text-sm text-muted">---</p>
      ) : rows.map((item, index) => {
        const width = Math.max((item.count / maxValue) * 100, 4);
        return (
          <div key={`${item.name}-${index}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-muted">{item.name}</span>
              <span className="font-semibold text-heading">{formatNumber(item.count)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full"
                style={{ width: `${width}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LookupPanel({
  lookupType,
  setLookupType,
  lookupName,
  setLookupName,
  lookupDropdownOpen,
  setLookupDropdownOpen,
  lookupInputRef,
  filteredLookupNames,
  lookupNamesLoading,
  detailsHref,
  onOpenDetails,
  tf,
}) {
  return (
    <Card className="space-y-4">
      <PanelHeader
        icon={Search}
        title={tf('familyHouseAnalytics.lookupTitle', 'Drill down')}
        subtitle={tf('familyHouseAnalytics.lookupHint', 'Open a family or house profile from the analytics context')}
      />
      <Select
        value={lookupType}
        onChange={(event) => {
          setLookupType(event.target.value);
          setLookupName('');
          setLookupDropdownOpen(false);
        }}
        options={[
          { value: 'familyName', label: tf('familyHouseLookup.lookupType.familyName', 'Family name') },
          { value: 'houseName', label: tf('familyHouseLookup.lookupType.houseName', 'House name') },
        ]}
      />
      <div className="relative">
        <input
          ref={lookupInputRef}
          value={lookupName}
          onChange={(event) => {
            setLookupName(event.target.value);
            setLookupDropdownOpen(true);
          }}
          onFocus={() => setLookupDropdownOpen(true)}
          placeholder={tf('familyHouseAnalytics.lookupPlaceholder', 'Search by name')}
          className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-base outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {lookupDropdownOpen && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-border bg-surface shadow-card">
            {lookupNamesLoading ? (
              <p className="px-3 py-2 text-sm text-muted">...</p>
            ) : filteredLookupNames.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">{tf('familyHouseAnalytics.noMatches', 'No matches')}</p>
            ) : filteredLookupNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setLookupName(name);
                  setLookupDropdownOpen(false);
                  lookupInputRef.current?.focus();
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-heading hover:bg-surface-alt"
              >
                <span className="truncate">{name}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button disabled={!detailsHref} icon={ArrowUpRight} onClick={onOpenDetails}>
          {tf('familyHouseAnalytics.openDetails', 'Open details')}
        </Button>
        {detailsHref ? (
          <Link to={detailsHref} className="text-sm font-medium text-primary hover:underline">
            {tf('familyHouseAnalytics.copyLinkLabel', 'View profile')}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

function SkeletonRows({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded bg-surface-alt" />
      ))}
    </div>
  );
}
