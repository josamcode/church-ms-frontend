import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ListChecks, Plus, Eye } from 'lucide-react';
import { visitationsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import Table from '../../../components/ui/Table';
import { useI18n } from '../../../i18n/i18n';
import useNavigateToUser from '../../../hooks/useNavigateToUser';
import { formatDateTime } from '../../../utils/formatters';

export default function PastoralVisitationListPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const navigateToUser = useNavigateToUser();
  const canCreate = hasPermission('PASTORAL_VISITATIONS_CREATE');

  const [filters, setFilters] = useState({
    houseName: '',
    dateFrom: '',
    dateTo: '',
  });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(20);

  useEffect(() => {
    setCursor(null);
    setCursorStack([null]);
  }, [filters.houseName, filters.dateFrom, filters.dateTo]);

  const listParams = useMemo(
    () => ({
      limit,
      order: 'desc',
      ...(cursor && { cursor }),
      ...(filters.houseName.trim() && { houseName: filters.houseName.trim() }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
    }),
    [cursor, filters.dateFrom, filters.dateTo, filters.houseName, limit]
  );

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

  const columns = [
    {
      key: 'houseName',
      label: t('visitations.list.columns.houseName'),
      render: (row) => <span className="font-medium text-heading">{row.houseName}</span>,
    },
    {
      key: 'visitedAt',
      label: t('visitations.list.columns.visitedAt'),
      render: (row) => formatDateTime(row.visitedAt),
    },
    {
      key: 'durationMinutes',
      label: t('visitations.list.columns.durationMinutes'),
      render: (row) => `${row.durationMinutes || 10} ${t('visitations.shared.minutes')}`,
    },
    {
      key: 'recordedBy',
      label: t('visitations.list.columns.recordedBy'),
      render: (row) =>
        row.recordedBy?.id ? (
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => navigateToUser(row.recordedBy.id)}
          >
            {row.recordedBy.fullName || t('common.placeholder.empty')}
          </button>
        ) : (
          t('common.placeholder.empty')
        ),
    },
    {
      key: 'recordedAt',
      label: t('visitations.list.columns.recordedAt'),
      render: (row) => formatDateTime(row.recordedAt || row.createdAt),
    },
    {
      key: 'details',
      label: t('visitations.list.columns.details'),
      render: (row) => (
        <Link to={`/dashboard/visitations/${row.id}`}>
          <Button type="button" variant="outline" size="sm" icon={Eye}>
            {t('visitations.list.viewDetails')}
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('visitations.list.page') },
        ]}
      />

      <Card className="mb-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-heading">{t('visitations.list.title')}</h1>
            <p className="text-sm text-muted">{t('visitations.list.subtitle')}</p>
          </div>
          {canCreate && (
            <Link to="/dashboard/visitations/new">
              <Button icon={Plus}>{t('visitations.list.createAction')}</Button>
            </Link>
          )}
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title={t('visitations.list.filtersTitle')}
          action={<ListChecks className="w-5 h-5 text-primary" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label={t('visitations.list.houseNameFilter')}
            value={filters.houseName}
            onChange={(e) => setFilters((prev) => ({ ...prev, houseName: e.target.value }))}
            placeholder={t('visitations.list.houseNameFilterPlaceholder')}
            containerClassName="!mb-0"
          />
          <Input
            label={t('visitations.list.dateFrom')}
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            containerClassName="!mb-0"
          />
          <Input
            label={t('visitations.list.dateTo')}
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            containerClassName="!mb-0"
          />
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={visitations}
          loading={isLoading}
          emptyTitle={t('visitations.list.emptyTitle')}
          emptyDescription={t('visitations.list.emptyDescription')}
        />

        <Pagination
          meta={meta}
          onLoadMore={handleNext}
          onPrev={handlePrev}
          cursors={cursorStack}
          loading={isLoading}
        />
      </Card>
    </div>
  );
}
