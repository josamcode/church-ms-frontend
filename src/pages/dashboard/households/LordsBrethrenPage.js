import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  Coins,
  Eye,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { householdClassificationsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import SearchInput from '../../../components/ui/SearchInput';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import ViewToggle from '../../../components/ui/ViewToggle';
import DataCard, { CardAvatar } from '../../../components/ui/DataCard';
import useViewMode from '../../../hooks/useViewMode';
import {
  formatCurrencyEGP,
  getHouseholdSourceLabel,
  getStatusText,
} from './householdClassifications.shared';
import {
  buildLookupQuery,
  FAMILY_HOUSE_DETAILS_PATH,
} from '../users/familyHouseLookup.shared';

const COPY = {
  en: {
    title: 'The Lords Brethren',
    subtitle:
      'View households currently classified as The Lords Brethren according to the active rules.',
    householdsCount: 'households',
    tableResults: '{count} household results',
    statHouseholds: 'Households supported',
    statMembers: 'Members on this page',
    statIncome: 'Total income (this page)',
    statHouseholdsHint: 'Matching the active criteria',
    statMembersHint: 'Across listed households',
    statIncomeHint: 'Combined declared income',
    filtersTitle: 'Filters',
    retry: 'Try again',
    columns: {
      householdName: 'Household',
      members: 'Members',
      income: 'Total income',
      status: 'Primary status',
      matches: 'Matched categories',
      actions: 'Actions',
    },
    viewDetails: 'View details',
    noDataTitle: 'No Lords Brethren households found',
    noDataDescription:
      'Currently no households meet the active criteria for being classified as The Lords Brethren.',
    searchPlaceholder: 'Search by household or member name',
    previous: 'Previous',
    next: 'Next',
    manageRules: 'Manage rules',
  },
  ar: {
    title: 'إخوة الرب',
    subtitle:
      'عرض الأسر المصنفة حاليًا كإخوة الرب وفقًا للقواعد النشطة المحددة.',
    householdsCount: 'أسر',
    tableResults: '{count} نتيجة',
    statHouseholds: 'الأسر المشمولة',
    statMembers: 'الأفراد في هذه الصفحة',
    statIncome: 'إجمالي الدخل (هذه الصفحة)',
    statHouseholdsHint: 'المطابقة للشروط النشطة',
    statMembersHint: 'ضمن الأسر المعروضة',
    statIncomeHint: 'إجمالي الدخل المُعلن',
    filtersTitle: 'الفلاتر',
    retry: 'إعادة المحاولة',
    columns: {
      householdName: 'الأسرة',
      members: 'عدد الأفراد',
      income: 'إجمالي الدخل',
      status: 'الحالة الأساسية',
      matches: 'التصنيفات المطابقة',
      actions: 'الإجراءات',
    },
    viewDetails: 'عرض التفاصيل',
    noDataTitle: 'لا توجد أسر تابعة لإخوة الرب',
    noDataDescription:
      'لا توجد أسر تطابق الشروط النشطة الحالية لتصنيف إخوة الرب.',
    searchPlaceholder: 'ابحث باسم الأسرة أو أحد الأفراد',
    previous: 'السابق',
    next: 'التالي',
    manageRules: 'إدارة القواعد',
  },
};

function HouseholdStatusBadge({ classification, language }) {
  if (!classification) {
    return <Badge>{getStatusText('unclassified', language)}</Badge>;
  }

  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        color: classification.color || '#2563eb',
        borderColor: `${classification.color || '#2563eb'}33`,
        backgroundColor: `${classification.color || '#2563eb'}12`,
      }}
    >
      {classification.name}
    </span>
  );
}

export default function LordsBrethrenPage() {
  const { hasPermission } = useAuth();
  const { language, t, isRTL } = useI18n();
  const navigate = useNavigate();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useViewMode('households:lordsBrethren:viewMode');

  const householdsQuery = useQuery({
    queryKey: [
      'household-classifications',
      'lords-brethren',
      page,
      search,
    ],
    queryFn: async () => {
      const { data } = await householdClassificationsApi.listHouseholds({
        page,
        limit: 10,
        search: search.trim() || undefined,
        isLordsBrethren: true,
        includeUnclassified: false,
      });

      return {
        households: Array.isArray(data?.data) ? data.data : [],
        meta: data?.meta || {},
        summary: data?.summary || {},
      };
    },
    keepPreviousData: true,
    staleTime: 30000,
  });

  const households = useMemo(
    () => householdsQuery.data?.households ?? [],
    [householdsQuery.data?.households]
  );
  const meta = householdsQuery.data?.meta || {};

  // Read-only derived summary counts for the KPI strip (presentation only).
  const localeCode = language === 'ar' ? 'ar-EG' : 'en-US';
  const formatCount = (n) => new Intl.NumberFormat(localeCode).format(Number(n) || 0);
  const householdsTotal = meta.totalCount ?? households.length;
  const membersOnPage = households.reduce(
    (sum, row) => sum + (Number(row.memberCount) || 0),
    0
  );
  const incomeOnPage = households.reduce(
    (sum, row) => sum + (Number(row.totalMemberIncome) || 0),
    0
  );

  const columns = useMemo(
    () => [
      {
        key: 'householdName',
        label: copy.columns.householdName,
        render: (row) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              <HeartHandshake className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-heading">{row.householdName}</p>
              {row.source ? (
                <p className="truncate text-xs text-muted">
                  {getHouseholdSourceLabel(row.source, language)}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: 'memberCount',
        label: copy.columns.members,
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
            <Users className="h-3.5 w-3.5" />
            {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US').format(
              Number(row.memberCount) || 0
            )}
          </span>
        ),
      },
      {
        key: 'totalMemberIncome',
        label: copy.columns.income,
        render: (row) => (
          <span className="font-bold tracking-tight text-secondary">
            {formatCurrencyEGP(row.totalMemberIncome, language)}
          </span>
        ),
      },
      {
        key: 'primaryClassification',
        label: copy.columns.status,
        render: (row) => (
          <HouseholdStatusBadge
            classification={row.primaryClassification}
            language={language}
          />
        ),
      },
      {
        key: 'matchedCategories',
        label: copy.columns.matches,
        render: (row) => (
          <div className="flex flex-wrap gap-1.5">
            {(row.matchedCategories || []).slice(0, 3).map((category) => (
              <HouseholdStatusBadge
                key={category.id}
                classification={category}
                language={language}
              />
            ))}
            {!row.matchedCategories?.length ? (
              <Badge>{getStatusText('unclassified', language)}</Badge>
            ) : null}
          </div>
        ),
      },
      {
        key: 'actions',
        label: copy.columns.actions,
        render: (row) => (
          <Link
            to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('houseName', row.householdName)}`}
          >
            <Button type="button" variant="outline" size="sm" icon={Eye}>
              {copy.viewDetails}
            </Button>
          </Link>
        ),
      },
    ],
    [copy, language]
  );

  /* ── bespoke card: a support tile — household leads, members + income are the
        headline metrics, matched categories grouped in the footer band ── */
  const renderHouseholdCard = (row) => {
    const matched = row.matchedCategories || [];
    return (
      <DataCard
        accent="gold"
        onClick={() =>
          navigate(`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('houseName', row.householdName)}`)
        }
        leading={<CardAvatar icon={HeartHandshake} tone="gold" />}
        title={row.householdName}
        badge={<HouseholdStatusBadge classification={row.primaryClassification} language={language} />}
        subtitle={row.source ? getHouseholdSourceLabel(row.source, language) : null}
        meta={
          <>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatCount(row.memberCount)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-bold text-secondary">
              <Coins className="h-3.5 w-3.5" />
              {formatCurrencyEGP(row.totalMemberIncome, language)}
            </span>
          </>
        }
        actions={
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        }
        footer={
          matched.length ? (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {copy.columns.matches}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matched.slice(0, 3).map((category) => (
                  <HouseholdStatusBadge key={category.id} classification={category} language={language} />
                ))}
              </div>
            </div>
          ) : null
        }
      />
    );
  };

  const errorMessage = householdsQuery.error
    ? normalizeApiError(householdsQuery.error).message
    : null;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: copy.title },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={copy.title}
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          hasPermission('HOUSEHOLD_CLASSIFICATIONS_MANAGE') ? (
            <Link to="/dashboard/households/classifications">
              <Button icon={ShieldCheck}>{copy.manageRules}</Button>
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={HeartHandshake}
          label={copy.statHouseholds}
          value={householdsQuery.isLoading ? '—' : formatCount(householdsTotal)}
          hint={copy.statHouseholdsHint}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={Users}
          label={copy.statMembers}
          value={householdsQuery.isLoading ? '—' : formatCount(membersOnPage)}
          hint={copy.statMembersHint}
          tone="info"
          isRTL={isRTL}
        />
        <StatCard
          icon={Coins}
          label={copy.statIncome}
          value={
            householdsQuery.isLoading ? '—' : formatCurrencyEGP(incomeOnPage, language)
          }
          hint={copy.statIncomeHint}
          tone="gold"
          isRTL={isRTL}
        />
      </div>

      <SearchInput
        value={search}
        onChange={(next) => {
          setSearch(next);
          setPage(1);
        }}
        placeholder={copy.searchPlaceholder}
        className="w-full"
      />

      {errorMessage ? (
        <Card tone="muted">
          <EmptyState
            icon={AlertTriangle}
            title={copy.noDataTitle}
            description={errorMessage}
            action={
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={() => householdsQuery.refetch()}
              >
                {copy.retry}
              </Button>
            }
          />
        </Card>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-[18px] w-[18px]" />
              </span>
              <h2 className="text-base font-bold leading-tight text-heading">{copy.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              {!householdsQuery.isLoading && households.length ? (
                <Badge variant="secondary">
                  {copy.tableResults.replace(
                    '{count}',
                    formatCount(meta.totalCount || households.length)
                  )}
                </Badge>
              ) : null}
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          <Table
            columns={columns}
            data={households}
            loading={householdsQuery.isLoading}
            emptyTitle={copy.noDataTitle}
            emptyDescription={copy.noDataDescription}
            emptyIcon={Users}
            renderMode={viewMode}
            renderCard={renderHouseholdCard}
            cardGridClassName="grid grid-cols-1 gap-3 xl:grid-cols-2"
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={!meta.hasPrevPage}
            >
              {copy.previous}
            </Button>
            <span className="text-xs font-medium text-muted">
              {meta.page || 1} / {meta.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => current + 1)}
              disabled={!meta.hasNextPage}
            >
              {copy.next}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
