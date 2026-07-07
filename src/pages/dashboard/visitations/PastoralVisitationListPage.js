import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Eye,
  Plus,
  Home,
  ClipboardList,
  Clock,
  Filter,
  Users,
} from 'lucide-react';
import { visitationsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import StatCard from '../../../components/ui/StatCard';
import Pagination from '../../../components/ui/Pagination';
import PageHeader from '../../../components/ui/PageHeader';
import Table from '../../../components/ui/Table';
import { useI18n } from '../../../i18n/i18n';
import useNavigateToUser from '../../../hooks/useNavigateToUser';
import { formatDateTime } from '../../../utils/formatters';

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

export default function PastoralVisitationListPage() {
  const { t, isRTL } = useI18n();
  const { hasPermission } = useAuth();
  const navigateToUser = useNavigateToUser();
  const canCreate = hasPermission('PASTORAL_VISITATIONS_CREATE');

  const [filters, setFilters] = useState({ houseName: '', dateFrom: '', dateTo: '' });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(20);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const hasActiveFilters = Object.values(filters).some(Boolean);

  /* reset pagination when filters change */
  useEffect(() => {
    setCursor(null);
    setCursorStack([null]);
  }, [filters.houseName, filters.dateFrom, filters.dateTo]);

  const listParams = useMemo(() => ({
    limit,
    order: 'desc',
    ...(cursor && { cursor }),
    ...(filters.houseName.trim() && { houseName: filters.houseName.trim() }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
  }), [cursor, filters, limit]);

  const { data: listRes, isLoading } = useQuery({
    queryKey: ['visitations', 'list', listParams],
    queryFn: async () => {
      const { data } = await visitationsApi.list(listParams);
      return data;
    },
    keepPreviousData: true,
    staleTime: 30000,
  });

  const visitations = Array.isArray(listRes?.data) ? listRes.data : [];
  const meta = listRes?.meta || null;

  /* ── read-only presentation KPIs (from already-fetched page data) ── */
  const pageCount = visitations.length;
  const totalLabel = meta?.count != null ? meta.count : pageCount;
  const totalMinutes = useMemo(
    () => visitations.reduce((sum, row) => sum + (Number(row.durationMinutes) || 10), 0),
    [visitations]
  );
  const distinctHouses = useMemo(
    () =>
      new Set(
        visitations
          .map((row) => String(row.houseName || '').trim())
          .filter(Boolean)
      ).size,
    [visitations]
  );
  const distinctRecorders = useMemo(
    () =>
      new Set(
        visitations
          .map((row) => row.recordedBy?.id)
          .filter(Boolean)
      ).size,
    [visitations]
  );

  const handleNext = () => {
    if (!meta?.nextCursor) return;
    setCursorStack((prev) => [...prev, meta.nextCursor]);
    setCursor(meta.nextCursor);
  };

  const handlePrev = () => {
    setCursorStack((prev) => {
      const next = prev.slice(0, -1);
      setCursor(next[next.length - 1] || null);
      return next;
    });
  };

  /* ── columns ── */
  const columns = useMemo(() => [
    {
      key: 'houseName',
      label: t('visitations.list.columns.houseName'),
      render: (row) => {
        const houseName = String(row.houseName || '').trim();
        if (!houseName) {
          return (
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-muted">
                <Home className="h-4 w-4" />
              </span>
              <span className="text-muted text-sm">{t('common.placeholder.empty')}</span>
            </span>
          );
        }

        const query = new URLSearchParams({ lookupType: 'houseName', lookupName: houseName }).toString();
        return (
          <Link
            to={`/dashboard/users/family-house/details?${query}`}
            className="group flex items-center gap-3"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Home className="h-4 w-4" />
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-heading transition-colors group-hover:text-primary">
              {houseName}
              <ArrowUpRight className="h-3 w-3 text-border transition-colors group-hover:text-primary" />
            </span>
          </Link>
        );
      },
    },
    {
      key: 'visitedAt',
      label: t('visitations.list.columns.visitedAt'),
      render: (row) => <span className="text-sm font-medium text-heading">{formatDateTime(row.visitedAt)}</span>,
    },
    {
      key: 'durationMinutes',
      label: t('visitations.list.columns.durationMinutes'),
      render: (row) => (
        <Badge variant="info" dot>
          {row.durationMinutes || 10} {t('visitations.shared.minutes')}
        </Badge>
      ),
    },
    {
      key: 'recordedBy',
      label: t('visitations.list.columns.recordedBy'),
      render: (row) =>
        row.recordedBy?.id ? (
          <button
            type="button"
            onClick={() => navigateToUser(row.recordedBy.id)}
            className="group text-start"
          >
            <p className="font-medium text-heading transition-colors group-hover:text-primary">
              {row.recordedBy.fullName || t('common.placeholder.empty')}
            </p>
          </button>
        ) : (
          <span className="text-sm text-muted">{t('common.placeholder.empty')}</span>
        ),
    },
    {
      key: 'recordedAt',
      label: t('visitations.list.columns.recordedAt'),
      render: (row) => <span className="text-xs text-muted">{formatDateTime(row.recordedAt || row.createdAt)}</span>,
    },
    {
      key: 'details',
      label: '',
      cellClassName: 'w-10',
      render: (row) => (
        <Link to={`/dashboard/visitations/${row.id}`}>
          <Button type="button" variant="ghost" size="sm" icon={Eye}>
            {t('visitations.list.viewDetails')}
          </Button>
        </Link>
      ),
    },
  ], [navigateToUser, t]);

  /* ── render ── */
  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('visitations.list.page') },
        ]}
      />

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('visitations.list.page')}
        title={t('visitations.list.title')}
        subtitle={t('visitations.list.subtitle')}
        actions={
          canCreate ? (
            <Link to="/dashboard/visitations/new">
              <Button icon={Plus}>{t('visitations.list.createAction')}</Button>
            </Link>
          ) : null
        }
      />

      {/* ══ KPI STRIP ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label={t('visitations.list.page')}
          value={totalLabel}
          hint={t('visitations.list.subtitle')}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={Home}
          label={t('visitations.list.columns.houseName')}
          value={distinctHouses}
          hint={t('visitations.list.title')}
          tone="gold"
          isRTL={isRTL}
        />
        <StatCard
          icon={Clock}
          label={t('visitations.list.columns.durationMinutes')}
          value={`${totalMinutes} ${t('visitations.shared.minutes')}`}
          hint={t('visitations.list.columns.visitedAt')}
          tone="info"
          isRTL={isRTL}
        />
        <StatCard
          icon={Users}
          label={t('visitations.list.columns.recordedBy')}
          value={distinctRecorders}
          hint={t('visitations.list.columns.recordedAt')}
          tone="success"
          isRTL={isRTL}
        />
      </div>

      {/* ══ FILTERS ═════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('visitations.list.filtersTitle')}</SectionLabel>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilters({ houseName: '', dateFrom: '', dateTo: '' })}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t('usersListPage.filters.clear')}
            </button>
          )}
        </div>

        <Card tone="muted" padding="sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              icon={Filter}
              value={filters.houseName}
              onChange={(e) => setFilter('houseName', e.target.value)}
              placeholder={t('visitations.list.houseNameFilterPlaceholder')}
              containerClassName="!mb-0"
            />
            <Input
              type="date"
              dir="ltr"
              value={filters.dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value)}
              containerClassName="!mb-0"
            />
            <Input
              type="date"
              dir="ltr"
              value={filters.dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value)}
              containerClassName="!mb-0"
            />
          </div>
        </Card>
      </section>

      {/* ══ TABLE ═══════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('visitations.list.page')}</SectionLabel>
          {meta?.count != null && (
            <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-muted">
              {meta.count}
            </span>
          )}
        </div>

        <div>
          <Table
            columns={columns}
            data={visitations}
            loading={isLoading}
            renderMode="auto"
            emptyIcon={Home}
            emptyTitle={t('visitations.list.emptyTitle')}
            emptyDescription={t('visitations.list.emptyDescription')}
          />
          {(meta?.nextCursor || cursorStack.length > 1) && (
            <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
              <Pagination
                meta={meta}
                onLoadMore={handleNext}
                onPrev={handlePrev}
                cursors={cursorStack}
                loading={isLoading}
              />
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
