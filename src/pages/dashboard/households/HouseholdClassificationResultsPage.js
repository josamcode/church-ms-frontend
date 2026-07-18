import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Coins,
  Eye,
  Filter,
  Layers,
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
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import Switch from '../../../components/ui/Switch';
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
    title: 'Household statuses',
    subtitle:
      'See how each household is classified based on the current rule definitions and member information.',
    filtersTitle: 'Filters',
    classificationFilter: 'Primary classification',
    allClassifications: 'All classifications',
    includeUnclassified: 'Include unclassified',
    categoryCardsTitle: 'Classification categories',
    categoryCardsSubtitle:
      'Each card shows the number of households currently matching one active category.',
    householdsCount: 'households',
    criteriaCount: 'criteria',
    noCategoryCards: 'No active household classification categories found.',
    tableResults: '{count} household results',
    statHouseholds: 'Households classified',
    statCategories: 'Active categories',
    statIncome: 'Total income (this page)',
    statHouseholdsHint: 'Matching the current view',
    statCategoriesHint: 'Rules currently applied',
    statIncomeHint: 'Combined declared income',
    ofTotal: 'of total',
    retry: 'Try again',
    columns: {
      householdName: 'Household',
      source: 'Source',
      members: 'Members',
      income: 'Total income',
      status: 'Primary status',
      matches: 'Matched categories',
      actions: 'Actions',
    },
    viewDetails: 'View details',
    noDataTitle: 'No household classifications found',
    noDataDescription:
      'Try adjusting your filters or define category criteria before reviewing the results.',
    searchPlaceholder: 'Search by household or member name',
    previous: 'Previous',
    next: 'Next',
    manageRules: 'Manage rules',
  },
  ar: {
    title: 'حالات الأسر',
    subtitle:
      'راجع تصنيف كل أسرة بناءً على القواعد الحالية وبيانات أفرادها الفعلية.',
    filtersTitle: 'الفلاتر',
    classificationFilter: 'التصنيف الأساسي',
    allClassifications: 'كل التصنيفات',
    includeUnclassified: 'إظهار الأسر غير المصنفة',
    categoryCardsTitle: 'فئات التصنيف',
    categoryCardsSubtitle:
      'كل بطاقة تعرض عدد الأسر المطابقة حاليًا لكل فئة نشطة.',
    householdsCount: 'أسر',
    criteriaCount: 'معايير',
    noCategoryCards: 'لا توجد فئات تصنيف أسر نشطة.',
    tableResults: '{count} نتيجة',
    statHouseholds: 'الأسر المصنفة',
    statCategories: 'الفئات النشطة',
    statIncome: 'إجمالي الدخل (هذه الصفحة)',
    statHouseholdsHint: 'ضمن العرض الحالي',
    statCategoriesHint: 'القواعد المُطبَّقة حاليًا',
    statIncomeHint: 'إجمالي الدخل المُعلن',
    ofTotal: 'من الإجمالي',
    retry: 'إعادة المحاولة',
    columns: {
      householdName: 'الأسرة',
      source: 'مصدر التجميع',
      members: 'عدد الأفراد',
      income: 'إجمالي الدخل',
      status: 'الحالة الأساسية',
      matches: 'التصنيفات المطابقة',
      actions: 'الإجراءات',
    },
    viewDetails: 'عرض التفاصيل',
    noDataTitle: 'لا توجد نتائج لتصنيف الأسر',
    noDataDescription:
      'عدّل الفلاتر أو عرّف شروط التصنيف أولًا ثم أعد المراجعة.',
    searchPlaceholder: 'ابحث باسم الأسرة أو أحد الأفراد',
    previous: 'السابق',
    next: 'التالي',
    manageRules: 'إدارة القواعد',
  },
};

function buildCategorySummaryCards(categories, breakdown = []) {
  const breakdownMap = new Map(
    (Array.isArray(breakdown) ? breakdown : []).map((entry) => [String(entry.id), entry])
  );

  const activeCategories = (Array.isArray(categories) ? categories : []).filter(
    (category) => category?.isActive !== false
  );

  if (activeCategories.length > 0) {
    return activeCategories.map((category) => {
      const summaryEntry = breakdownMap.get(String(category.id));
      return {
        id: String(category.id),
        name: category.name,
        color: category.color || summaryEntry?.color || '#2563eb',
        count:
          summaryEntry?.count ??
          (Number.isFinite(Number(category.count)) ? Number(category.count) : 0),
        criteriaCount: Number(category.criteriaCount) || 0,
      };
    });
  }

  return (Array.isArray(breakdown) ? breakdown : []).map((entry) => ({
    id: String(entry.id),
    name: entry.name,
    color: entry.color || '#2563eb',
    count: entry.count || 0,
    criteriaCount: 0,
  }));
}

function splitCardsIntoRows(cards = []) {
  const total = cards.length;
  if (total === 0) return [];
  if (total <= 4) return [cards];

  const rowsCount = Math.ceil(total / 3);
  const baseSize = Math.floor(total / rowsCount);
  const remainder = total % rowsCount;
  const rowSizes = Array.from({ length: rowsCount }, (_, index) =>
    baseSize + (index < remainder ? 1 : 0)
  );

  const rows = [];
  let cursor = 0;

  rowSizes.forEach((size) => {
    rows.push(cards.slice(cursor, cursor + size));
    cursor += size;
  });

  return rows;
}

function getCategoryRowGridClass(length) {
  if (length === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  if (length === 3) return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
  if (length === 2) return 'grid-cols-1 md:grid-cols-2';
  return 'grid-cols-1';
}

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

function CategorySummaryCard({ category, copy, maxCount = 0, totalCount = 0, language = 'en' }) {
  const color = category.color || '#2563eb';
  const count = Number(category.count) || 0;
  const localeCode = language === 'ar' ? 'ar-EG' : 'en-US';
  const countLabel = new Intl.NumberFormat(localeCode).format(count);
  // Proportion bar: width relative to the largest category so cards are
  // visually comparable at a glance. Share % is relative to the total.
  const barWidth = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 6 : 0) : 0;
  const sharePercent = totalCount > 0 ? Math.round((count / totalCount) * 100) : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: `${color}33` }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              {copy.classificationFilter}
            </p>
            <h3
              className="mt-2 truncate text-lg font-bold tracking-tight"
              style={{ color }}
              title={category.name}
            >
              {category.name}
            </h3>
          </div>
          <span
            className="mt-1 inline-flex h-3 w-3 shrink-0 rounded-full ring-2 ring-surface"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold tracking-tight text-heading">{countLabel}</p>
            <p className="mt-1 text-sm text-muted">{copy.householdsCount}</p>
          </div>
          <Badge variant="default">
            {category.criteriaCount} {copy.criteriaCount}
          </Badge>
        </div>

        <div className="mt-4">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-surface-alt"
            role="presentation"
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${barWidth}%`, backgroundColor: color }}
            />
          </div>
          {sharePercent != null ? (
            <p className="mt-2 text-[11px] font-medium text-muted">
              {new Intl.NumberFormat(localeCode).format(sharePercent)}% {copy.ofTotal}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function HouseholdClassificationResultsPage() {
  const { hasPermission } = useAuth();
  const { language, t, isRTL } = useI18n();
  const navigate = useNavigate();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [classificationId, setClassificationId] = useState('');
  const [includeUnclassified, setIncludeUnclassified] = useState(false);
  const [viewMode, setViewMode] = useViewMode('households:classification:viewMode');

  const categoriesQuery = useQuery({
    queryKey: ['household-classifications', 'categories'],
    queryFn: async () => {
      const { data } = await householdClassificationsApi.listCategories();
      return Array.isArray(data?.data) ? data.data : [];
    },
    staleTime: 60000,
  });

  const householdsQuery = useQuery({
    queryKey: [
      'household-classifications',
      'results',
      page,
      search,
      classificationId,
      includeUnclassified,
    ],
    queryFn: async () => {
      const { data } = await householdClassificationsApi.listHouseholds({
        page,
        limit: 10,
        search: search.trim() || undefined,
        classificationId: classificationId || undefined,
        includeUnclassified,
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

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const households = useMemo(
    () => householdsQuery.data?.households ?? [],
    [householdsQuery.data?.households]
  );
  const meta = householdsQuery.data?.meta || {};
  const summary = householdsQuery.data?.summary || {};

  const categoryOptions = useMemo(
    () => [
      { value: '', label: copy.allClassifications },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories, copy.allClassifications]
  );

  const categorySummaryCards = useMemo(
    () => buildCategorySummaryCards(categories, summary.categoryBreakdown),
    [categories, summary.categoryBreakdown]
  );

  const categorySummaryRows = useMemo(
    () => splitCardsIntoRows(categorySummaryCards),
    [categorySummaryCards]
  );

  // Read-only derived values for the KPI strip + proportion bars (presentation only).
  const localeCode = language === 'ar' ? 'ar-EG' : 'en-US';
  const formatCount = (n) => new Intl.NumberFormat(localeCode).format(Number(n) || 0);
  const householdsTotal = meta.totalCount ?? households.length;
  const incomeOnPage = households.reduce(
    (sum, row) => sum + (Number(row.totalMemberIncome) || 0),
    0
  );
  const categoryMaxCount = categorySummaryCards.reduce(
    (max, category) => Math.max(max, Number(category.count) || 0),
    0
  );
  const categoryTotalCount = categorySummaryCards.reduce(
    (sum, category) => sum + (Number(category.count) || 0),
    0
  );

  const columns = useMemo(
    () => [
      {
        key: 'householdName',
        label: copy.columns.householdName,
        render: (row) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-[18px] w-[18px]" />
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

  /* ── bespoke card: household leads with its primary status; members + income
        are the headline metrics; matched categories grouped in the footer ── */
  const renderHouseholdCard = (row) => {
    const matched = row.matchedCategories || [];
    return (
      <DataCard
        accent="primary"
        onClick={() =>
          navigate(`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('houseName', row.householdName)}`)
        }
        leading={<CardAvatar icon={Building2} tone="primary" />}
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
          icon={Building2}
          label={copy.statHouseholds}
          value={householdsQuery.isLoading ? '—' : formatCount(householdsTotal)}
          hint={copy.statHouseholdsHint}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={Layers}
          label={copy.statCategories}
          value={formatCount(categorySummaryCards.length)}
          hint={copy.statCategoriesHint}
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

      <Card className="space-y-4" tone="muted">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-heading">{copy.filtersTitle}</p>
        </div>
        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[1.4fr_0.8fr_auto]">
          <SearchInput
            value={search}
            onChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
            placeholder={copy.searchPlaceholder}
          />
          <Select
            label={copy.classificationFilter}
            options={categoryOptions}
            value={classificationId}
            onChange={(event) => {
              setClassificationId(event.target.value);
              setPage(1);
            }}
            containerClassName="!mb-0"
          />
          <div className="flex items-center pb-1 lg:h-10">
            <Switch
              checked={includeUnclassified}
              onChange={(checked) => {
                setIncludeUnclassified(checked);
                setPage(1);
              }}
              label={copy.includeUnclassified}
            />
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight text-heading">
                {copy.categoryCardsTitle}
              </h2>
              <p className="mt-0.5 text-sm text-muted">{copy.categoryCardsSubtitle}</p>
            </div>
          </div>
          <Badge variant="secondary">{formatCount(categorySummaryCards.length)}</Badge>
        </div>

        {categorySummaryRows.length === 0 ? (
          <Card tone="muted">
            <EmptyState
              icon={Building2}
              title={copy.categoryCardsTitle}
              description={copy.noCategoryCards}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {categorySummaryRows.map((row, index) => (
              <div
                key={`category-summary-row-${index}`}
                className={`grid gap-4 ${getCategoryRowGridClass(row.length)}`}
              >
                {row.map((category) => (
                  <CategorySummaryCard
                    key={category.id}
                    category={category}
                    copy={copy}
                    maxCount={categoryMaxCount}
                    totalCount={categoryTotalCount}
                    language={language}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

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
            emptyIcon={Building2}
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
