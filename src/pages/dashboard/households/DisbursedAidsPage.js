import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, HandCoins, History, Plus, Filter, BellRing, Users, Layers } from 'lucide-react';
import { aidsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Pagination from '../../../components/ui/Pagination';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import ViewToggle from '../../../components/ui/ViewToggle';
import DataCard, { CardAvatar } from '../../../components/ui/DataCard';
import useViewMode from '../../../hooks/useViewMode';

const COPY = {
  en: {
    title: 'Disbursed Aid History',
    subtitle: 'View a timeline of all aid distributed to households.',
    addAction: 'Disburse Aid',
    filtersTitle: 'Filters',
    searchPlaceholder: 'Search by description...',
    categoryFilter: 'All Categories',
    emptyTitle: 'No distributed aid found',
    emptyDesc: 'Once aid is disbursed, the records will appear here.',
    statRecords: 'Records on this page',
    statBeneficiaries: 'Beneficiaries reached',
    statCategories: 'Aid categories',
    statPage: 'Current page',
    statRecordsHint: 'Aid entries shown below',
    statBeneficiariesHint: 'Across the listed records',
    statCategoriesHint: 'Distinct on this page',
    columns: {
      date: 'Date',
      category: 'Category',
      occurrence: 'Occurrence',
      description: 'Description',
      beneficiaries: 'Beneficiaries',
    },
  },
  ar: {
    title: 'المساعدات المصروفة',
    subtitle: 'عرض السجل الزمني لجميع المساعدات التي تم صرفها للأسر.',
    addAction: 'صرف مساعدة',
    filtersTitle: 'عوامل التصفية',
    searchPlaceholder: 'ابحث بالوصف...',
    categoryFilter: 'جميع الفئات',
    emptyTitle: 'لا توجد مساعدات منصرفة',
    emptyDesc: 'بمجرد صرف المساعدات للأسر، ستظهر السجلات هنا.',
    statRecords: 'سجلات هذه الصفحة',
    statBeneficiaries: 'المستفيدون',
    statCategories: 'فئات المساعدة',
    statPage: 'الصفحة الحالية',
    statRecordsHint: 'المساعدات المعروضة أدناه',
    statBeneficiariesHint: 'ضمن السجلات المعروضة',
    statCategoriesHint: 'المميزة في هذه الصفحة',
    columns: {
      date: 'التاريخ',
      category: 'فئة المساعدة',
      occurrence: 'الدورية',
      description: 'الوصف',
      beneficiaries: 'المستفيدين',
    },
  },
};

export default function DisbursedAidsPage() {
  const { language, t, isRTL } = useI18n();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const canCreate = hasPermission('HOUSEHOLD_CLASSIFICATIONS_MANAGE');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode] = useViewMode('households:disbursedAids:viewMode');
  const limit = 20;

  const { data: optionsData } = useQuery({
    queryKey: ['aids-options'],
    queryFn: async () => {
      const resp = await aidsApi.getOptions();
      return resp.data?.data || { categories: [], occurrences: [], descriptions: [] };
    },
    staleTime: 60000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['aids-history', page, limit, search, category],
    queryFn: async () => {
      const resp = await aidsApi.getDisbursedAids({ page, limit, search, category });
      return resp.data || { data: [], meta: { totalPages: 1 } };
    },
  });

  const items = data?.data || [];
  const meta = data?.meta || { totalPages: 1 };

  const categoryOptions = [
    { label: copy.categoryFilter, value: '' },
    ...(optionsData?.categories || []).map((cat) => ({ label: cat, value: cat })),
  ];

  // Read-only derived summary counts for the KPI strip (presentation only).
  const localeCode = language === 'ar' ? 'ar-EG' : 'en-US';
  const beneficiariesOnPage = items.reduce(
    (sum, row) => sum + (Number(row.beneficiariesCount) || 0),
    0
  );
  const categoriesOnPage = new Set(
    items.map((row) => row.category).filter(Boolean)
  ).size;
  const formatCount = (n) => new Intl.NumberFormat(localeCode).format(Number(n) || 0);

  const handleRowClick = (row) => {
    // Navigate to details page with query params
    const searchParams = new URLSearchParams({
      date: row.date,
      category: row.category,
      occurrence: row.occurrence,
      description: row.description,
    });
    navigate(`/dashboard/lords-brethren/aid-history/details?${searchParams.toString()}`);
  };

  const formatAidDate = (value) =>
    value
      ? new Date(value).toLocaleDateString(localeCode, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  /* ── bespoke card: a ledger entry — the aid description leads with its
        category, disbursement date + cadence support it, beneficiaries metric ── */
  const renderAidCard = (row) => (
    <DataCard
      accent="gold"
      onClick={() => handleRowClick(row)}
      leading={<CardAvatar icon={HandCoins} tone="gold" />}
      title={row.description || row.category || copy.columns.description}
      badge={row.category ? <Badge variant="gold" size="sm" dot>{row.category}</Badge> : null}
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatAidDate(row.date)}
          </span>
          {row.occurrence ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{row.occurrence}</span>
            </>
          ) : null}
        </span>
      }
      meta={
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {formatCount(row.beneficiariesCount ?? 0)} {copy.columns.beneficiaries}
        </span>
      }
    />
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('dashboardLayout.menu.theLordsBrethren'), href: '/dashboard/lords-brethren' },
          { label: copy.title },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('dashboardLayout.menu.theLordsBrethren')}
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              icon={BellRing}
              onClick={() => navigate('/dashboard/lords-brethren/aid-history/notifications')}
            >
              {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            </Button>
            {canCreate ? (
              <Button
                icon={Plus}
                onClick={() => navigate('/dashboard/lords-brethren/aid')}
              >
                {copy.addAction}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={History}
          label={copy.statRecords}
          value={isLoading ? '—' : formatCount(items.length)}
          hint={copy.statRecordsHint}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={Users}
          label={copy.statBeneficiaries}
          value={isLoading ? '—' : formatCount(beneficiariesOnPage)}
          hint={copy.statBeneficiariesHint}
          tone="gold"
          isRTL={isRTL}
        />
        <StatCard
          icon={Layers}
          label={copy.statCategories}
          value={isLoading ? '—' : formatCount(categoriesOnPage)}
          hint={copy.statCategoriesHint}
          tone="info"
          isRTL={isRTL}
        />
      </div>

      <Card className="space-y-4" tone="muted">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-heading">{copy.filtersTitle}</p>
        </div>
        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[1.4fr_1fr]">
          <SearchInput
            value={search}
            onChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
            placeholder={copy.searchPlaceholder}
          />
          <Select
            options={categoryOptions}
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            containerClassName="!mb-0"
          />
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="h-[18px] w-[18px]" />
            </span>
            <h2 className="truncate text-lg font-bold leading-tight text-heading">{copy.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && items.length ? (
              <Badge variant="secondary">{formatCount(items.length)}</Badge>
            ) : null}
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>
        <Table
          renderMode={viewMode}
          renderCard={renderAidCard}
          cardGridClassName="grid grid-cols-1 gap-3 xl:grid-cols-2"
          columns={[
            {
              key: 'date',
              label: copy.columns.date,
              render: (row) => (
                <div className="flex items-center gap-2 font-semibold text-heading">
                  <CalendarDays className="h-4 w-4 text-muted" />
                  {row.date ? new Date(row.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </div>
              ),
              onClick: handleRowClick,
            },
            {
              key: 'category',
              label: copy.columns.category,
              render: (row) =>
                row.category ? (
                  <Badge variant="gold" dot>
                    {row.category}
                  </Badge>
                ) : (
                  <span className="text-muted">-</span>
                ),
              onClick: handleRowClick,
            },
            {
              key: 'occurrence',
              label: copy.columns.occurrence,
              cellClassName: 'text-muted',
              onClick: handleRowClick,
            },
            {
              key: 'description',
              label: copy.columns.description,
              onClick: handleRowClick,
            },
            {
              key: 'beneficiariesCount',
              label: copy.columns.beneficiaries,
              render: (row) => (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                  <Users className="h-3.5 w-3.5" />
                  {row.beneficiariesCount ?? 0}
                </span>
              ),
              onClick: handleRowClick,
            },
          ]}
          data={items}
          loading={isLoading}
          emptyTitle={copy.emptyTitle}
          emptyDescription={copy.emptyDesc}
          emptyIcon={HandCoins}
        />

        {meta.totalPages > 1 && (
          <div className="pt-1">
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
