import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Building2,
  Eye,
  Filter,
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
import Modal from '../../../components/ui/Modal';
import PageHeader from '../../../components/ui/PageHeader';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Switch from '../../../components/ui/Switch';
import Table from '../../../components/ui/Table';
import {
  describeCriterionActualValue,
  describeMemberFacts,
  formatCurrencyEGP,
  getHouseholdSourceLabel,
  getStatusText,
} from './householdClassifications.shared';

const COPY = {
  en: {
    title: 'Household statuses',
    subtitle:
      'See how each household is classified based on the current rule definitions and member information.',
    filtersTitle: 'Filters',
    classificationFilter: 'Primary classification',
    allClassifications: 'All classifications',
    includeUnclassified: 'Include unclassified',
    totalHouseholds: 'Households',
    classifiedHouseholds: 'Classified',
    unclassifiedHouseholds: 'Unclassified',
    urgentHouseholds: 'Most in need',
    tableResults: '{count} household results',
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
    detailsTitle: 'Household details',
    membersTitle: 'Members',
    criteriaTitle: 'Rule evaluation',
    noCriteria: 'No rule matched this household yet.',
    searchPlaceholder: 'Search by household or member name',
    previous: 'Previous',
    next: 'Next',
    manageRules: 'Manage rules',
  },
  ar: {
    title: 'حالات الأسر',
    subtitle:
      'راجع تصنيف كل أسرة بناء على القواعد الحالية وبيانات أفرادها الفعلية.',
    filtersTitle: 'الفلاتر',
    classificationFilter: 'التصنيف الأساسي',
    allClassifications: 'كل التصنيفات',
    includeUnclassified: 'إظهار الأسر غير المصنفة',
    totalHouseholds: 'الأسر',
    classifiedHouseholds: 'مصنفة',
    unclassifiedHouseholds: 'غير مصنفة',
    urgentHouseholds: 'الأكثر احتياجًا',
    tableResults: '{count} نتيجة',
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
      'عدّل الفلاتر أو عرّف شروط التصنيف أولاً ثم أعد المراجعة.',
    detailsTitle: 'تفاصيل الأسرة',
    membersTitle: 'الأفراد',
    criteriaTitle: 'تقييم القواعد',
    noCriteria: 'لم تنطبق أي قاعدة على هذه الأسرة حتى الآن.',
    searchPlaceholder: 'ابحث باسم الأسرة أو أحد الأفراد',
    previous: 'السابق',
    next: 'التالي',
    manageRules: 'إدارة القواعد',
  },
};

function SummaryStat({ icon: Icon, label, value, tone = 'default' }) {
  const tones = {
    default: 'border-border bg-surface text-heading',
    success: 'border-success/20 bg-success-light text-success',
    danger: 'border-danger/20 bg-danger-light text-danger',
    warning: 'border-warning/20 bg-warning-light text-warning',
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone] || tones.default}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
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

export default function HouseholdClassificationResultsPage() {
  const { hasPermission } = useAuth();
  const { language, t } = useI18n();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [classificationId, setClassificationId] = useState('');
  const [includeUnclassified, setIncludeUnclassified] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);

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

  const urgentCategory = useMemo(() => {
    const breakdown = Array.isArray(summary.categoryBreakdown) ? summary.categoryBreakdown : [];
    return breakdown.reduce((best, current) => (current.count > (best?.count || 0) ? current : best), null);
  }, [summary.categoryBreakdown]);

  const columns = useMemo(
    () => [
      {
        key: 'householdName',
        label: copy.columns.householdName,
        render: (row) => (
          <div>
            <p className="font-semibold text-heading">{row.householdName}</p>
            <p className="text-xs text-muted">{row.householdKey}</p>
          </div>
        ),
      },
      {
        key: 'sourceField',
        label: copy.columns.source,
        render: (row) => getHouseholdSourceLabel(row.sourceField, language),
      },
      {
        key: 'memberCount',
        label: copy.columns.members,
        render: (row) => row.memberCount,
      },
      {
        key: 'totalMemberIncome',
        label: copy.columns.income,
        render: (row) => formatCurrencyEGP(row.totalMemberIncome, language),
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => setSelectedHousehold(row)}
          >
            {copy.viewDetails}
          </Button>
        ),
      },
    ],
    [copy, language]
  );

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
        eyebrow={copy.filtersTitle}
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

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <p className="text-sm font-semibold text-heading">{copy.filtersTitle}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.8fr_auto] items-end">
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
          <div className="flex items-end">
            <div className="rounded-xl border border-border bg-surface-alt/50 px-4 py-3">
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
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <SummaryStat
          icon={Building2}
          label={copy.totalHouseholds}
          value={summary.totalHouseholds || 0}
        />
        <SummaryStat
          icon={ShieldCheck}
          label={copy.classifiedHouseholds}
          value={summary.classifiedHouseholds || 0}
          tone="success"
        />
        <SummaryStat
          icon={BarChart3}
          label={copy.unclassifiedHouseholds}
          value={summary.unclassifiedHouseholds || 0}
          tone="warning"
        />
        <SummaryStat
          icon={Users}
          label={copy.urgentHouseholds}
          value={urgentCategory?.count || 0}
          tone="danger"
        />
      </div>

      {errorMessage ? (
        <Card>
          <EmptyState
            icon={Building2}
            title={copy.noDataTitle}
            description={errorMessage}
          />
        </Card>
      ) : (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-heading">{copy.title}</p>
            <span className="text-xs text-muted">
              {copy.tableResults.replace('{count}', String(meta.totalCount || households.length))}
            </span>
          </div>
          <Table
            columns={columns}
            data={households}
            loading={householdsQuery.isLoading}
            emptyTitle={copy.noDataTitle}
            emptyDescription={copy.noDataDescription}
            emptyIcon={Building2}
          />

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={!meta.hasPrevPage}
            >
              {copy.previous}
            </Button>
            <span className="text-xs text-muted">
              {meta.page || 1} / {meta.totalPages || 1}
            </span>
            <Button
              variant="ghost"
              onClick={() => setPage((current) => current + 1)}
              disabled={!meta.hasNextPage}
            >
              {copy.next}
            </Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={Boolean(selectedHousehold)}
        onClose={() => setSelectedHousehold(null)}
        title={selectedHousehold?.householdName || copy.detailsTitle}
        size="xl"
        footer={
          <Button variant="ghost" onClick={() => setSelectedHousehold(null)}>
            {t('common.actions.close')}
          </Button>
        }
      >
        {selectedHousehold ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <HouseholdStatusBadge
                classification={selectedHousehold.primaryClassification}
                language={language}
              />
              {(selectedHousehold.matchedCategories || []).map((category) => (
                <HouseholdStatusBadge
                  key={category.id}
                  classification={category}
                  language={language}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SummaryStat
                label={copy.columns.members}
                value={selectedHousehold.memberCount}
              />
              <SummaryStat
                label={copy.columns.income}
                value={formatCurrencyEGP(selectedHousehold.totalMemberIncome, language)}
              />
              <SummaryStat
                label={copy.columns.source}
                value={getHouseholdSourceLabel(selectedHousehold.sourceField, language)}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-heading">{copy.membersTitle}</p>
              <div className="space-y-2">
                {(selectedHousehold.members || []).map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-border bg-surface-alt/40 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-heading">{member.fullName}</p>
                        <p className="text-xs text-muted">{member.phonePrimary || '---'}</p>
                      </div>
                      <Badge>{formatCurrencyEGP(member.monthlyIncome || 0, language)}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {describeMemberFacts(member, language).map((fact) => (
                        <Badge key={`${member.id}-${fact}`} variant="secondary">
                          {fact}
                        </Badge>
                      ))}
                      {(member.diseases || []).map((disease) => (
                        <Badge key={`${member.id}-${disease}`} variant="warning">
                          {disease}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-heading">{copy.criteriaTitle}</p>
              {(selectedHousehold.categoryEvaluations || []).some((category) => category.matched) ? (
                <div className="space-y-3">
                  {(selectedHousehold.categoryEvaluations || [])
                    .filter((category) => category.matched)
                    .map((category) => (
                      <div key={category.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <HouseholdStatusBadge classification={category} language={language} />
                          <span className="text-xs text-muted">
                            {category.matchedRequiredCriteria} / {category.criteria.length}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {category.criteria.map((criterion) => (
                            <div
                              key={criterion.id}
                              className="rounded-lg border border-border bg-surface-alt/40 px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-heading">
                                  {criterion.label || criterion.metric}
                                </p>
                                <Badge variant={criterion.passed ? 'success' : 'danger'}>
                                  {criterion.passed
                                    ? getStatusText('passed', language)
                                    : getStatusText('failed', language)}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted">
                                {criterion.isRequired
                                  ? getStatusText('required', language)
                                  : getStatusText('optional', language)}
                                {' • '}
                                {describeCriterionActualValue(criterion, language)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted">{copy.noCriteria}</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
