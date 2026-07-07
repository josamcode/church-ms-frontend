import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CheckCheck, Eye, FileClock, ListFilter, Pencil, SlidersHorizontal, Users as UsersIcon, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import Section from '../../../components/ui/Section';
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import Table, { RowActions } from '../../../components/ui/Table';
import { useI18n } from '../../../i18n/i18n';
import { formatDate, getAccountStatusLabel } from '../../../utils/formatters';

const ACCOUNT_STATUS_VARIANT = {
  approved: 'success',
  rejected: 'danger',
  pending: 'warning',
};

function StatusPill({ value }) {
  return (
    <Badge variant={ACCOUNT_STATUS_VARIANT[value] || 'warning'} dot>
      {getAccountStatusLabel(value)}
    </Badge>
  );
}

export default function UsersRequestsListPage() {
  const { t, isRTL } = useI18n();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ fullName: '', accountStatus: 'pending' });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);

  const queryParams = {
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
    ...(cursor ? { cursor } : {}),
    ...(filters.fullName ? { fullName: filters.fullName } : {}),
    ...(filters.accountStatus ? { accountStatus: filters.accountStatus } : {}),
  };

  const requestsQuery = useQuery({
    queryKey: ['users', 'requests', queryParams],
    queryFn: async () => (await usersApi.list(queryParams)).data,
    keepPreviousData: true,
    staleTime: 30000,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, accountStatus }) => usersApi.update(id, { accountStatus }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.accountStatus === 'approved'
          ? 'تم اعتماد الطلب بنجاح'
          : 'تم رفض الطلب بنجاح'
      );
      queryClient.invalidateQueries({ queryKey: ['users', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const rows = useMemo(
    () => (Array.isArray(requestsQuery.data?.data) ? requestsQuery.data.data : []),
    [requestsQuery.data?.data]
  );
  const meta = requestsQuery.data?.meta || null;

  const canReview = hasPermission('USERS_UPDATE');
  const pendingCount = useMemo(
    () => rows.filter((row) => (row.accountStatus || 'pending') === 'pending').length,
    [rows]
  );
  const mutatingId = actionMutation.isLoading ? actionMutation.variables?.id : null;

  const approve = useCallback(
    (id) => actionMutation.mutate({ id, accountStatus: 'approved' }),
    [actionMutation]
  );
  const reject = useCallback(
    (id) => actionMutation.mutate({ id, accountStatus: 'rejected' }),
    [actionMutation]
  );

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        label: 'الطلب',
        render: (row) => {
          const status = row.accountStatus || 'pending';
          const initial = String(row.fullName || 'U').trim().charAt(0).toUpperCase();
          return (
            <div className="flex items-center gap-3">
              {row.avatar?.url ? (
                <img
                  src={row.avatar.url}
                  alt=""
                  className="h-9 w-9 rounded-full border border-border object-cover"
                />
              ) : (
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    status === 'pending'
                      ? 'bg-warning/12 text-warning'
                      : status === 'approved'
                        ? 'bg-success/12 text-success'
                        : 'bg-danger/12 text-danger'
                  }`}
                >
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-heading">{row.fullName || '---'}</p>
                <p className="truncate text-xs text-muted direction-ltr text-left">{row.phonePrimary || row.email || '---'}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'تاريخ الإرسال',
        render: (row) => formatDate(row.createdAt),
      },
      {
        key: 'accountStatus',
        label: 'الحالة',
        render: (row) => <StatusPill value={row.accountStatus || 'pending'} />,
      },
      {
        key: 'review',
        label: 'المراجعة',
        render: (row) => {
          if (!canReview) return <span className="text-xs text-muted">---</span>;
          const status = row.accountStatus || 'pending';
          const busy = mutatingId === row._id;
          return (
            <div className="flex items-center gap-2">
              {status !== 'approved' ? (
                <Button
                  size="sm"
                  variant="success"
                  icon={CheckCircle2}
                  loading={busy}
                  disabled={actionMutation.isLoading}
                  onClick={() => approve(row._id)}
                >
                  اعتماد
                </Button>
              ) : null}
              {status !== 'rejected' ? (
                <Button
                  size="sm"
                  variant="outline"
                  icon={XCircle}
                  disabled={actionMutation.isLoading}
                  onClick={() => reject(row._id)}
                >
                  رفض
                </Button>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'actions',
        label: '',
        cellClassName: 'w-10',
        render: (row) => (
          <RowActions
            actions={[
              { label: t('common.actions.view'), icon: Eye, onClick: () => navigate(`/dashboard/users/${row._id}`) },
              ...(hasPermission('USERS_UPDATE')
                ? [{ label: t('common.actions.edit'), icon: Pencil, onClick: () => navigate(`/dashboard/users/${row._id}/edit`) }]
                : []),
              ...(hasPermission('USERS_UPDATE') && row.accountStatus !== 'approved'
                ? [{ label: 'اعتماد', icon: CheckCircle2, onClick: () => actionMutation.mutate({ id: row._id, accountStatus: 'approved' }) }]
                : []),
              ...(hasPermission('USERS_UPDATE') && row.accountStatus !== 'rejected'
                ? [{ label: 'رفض', icon: XCircle, danger: true, onClick: () => actionMutation.mutate({ id: row._id, accountStatus: 'rejected' }) }]
                : []),
            ]}
          />
        ),
      },
    ],
    [actionMutation, approve, canReview, hasPermission, mutatingId, navigate, reject, t]
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users'), href: '/dashboard/users' },
          { label: 'طلبات المستخدمين' },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        title="طلبات المستخدمين"
        subtitle="راجع طلبات التسجيل الجديدة، ثم افتح الطلب للتعديل أو اعتمده أو ارفضه مباشرة."
        actions={
          <Link to="/dashboard/users">
            <Button variant="outline">العودة إلى المستخدمين</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={FileClock}
          label="طلبات قيد المراجعة"
          value={pendingCount}
          hint="بانتظار قرار الاعتماد أو الرفض"
          tone={pendingCount > 0 ? 'warning' : 'success'}
          isRTL={isRTL}
        />
        <StatCard
          icon={UsersIcon}
          label="المعروض الآن"
          value={rows.length}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={ListFilter}
          label="الفلاتر الحالية"
          value={filters.accountStatus ? getAccountStatusLabel(filters.accountStatus) : 'كل الحالات'}
          tone="gold"
          isRTL={isRTL}
        />
      </div>

      <Section
        title="كيف تريد فلترة الطلبات؟"
        icon={SlidersHorizontal}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({ fullName: '', accountStatus: 'pending' });
              setCursor(null);
              setCursorStack([null]);
            }}
          >
            إعادة التعيين
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SearchInput
            value={filters.fullName}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, fullName: value }));
              setCursor(null);
              setCursorStack([null]);
            }}
            placeholder="ابحث بالاسم"
          />
          <Select
            options={[
              { value: 'pending', label: 'قيد المراجعة' },
              { value: 'approved', label: 'معتمد' },
              { value: 'rejected', label: 'مرفوض' },
            ]}
            value={filters.accountStatus}
            onChange={(event) => {
              setFilters((prev) => ({ ...prev, accountStatus: event.target.value }));
              setCursor(null);
              setCursorStack([null]);
            }}
            placeholder="اختر الحالة"
            containerClassName="!mb-0"
          />
        </div>
      </Section>

      <Card padding={false} className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6">
          <CardHeader
            icon={FileClock}
            title="ما الطلبات التي تحتاج إلى مراجعة الآن؟"
            subtitle="يمكنك الاعتماد أو الرفض مباشرة من القائمة"
            className="mb-0"
            action={
              pendingCount > 0 ? (
                <Badge variant="warning" dot>
                  <CheckCheck className="h-3.5 w-3.5" />
                  {pendingCount} قيد المراجعة
                </Badge>
              ) : (
                <Badge variant="success" dot>
                  لا طلبات معلّقة
                </Badge>
              )
            }
          />
        </div>

        <div className="p-2 sm:p-3">
          <Table
            columns={columns}
            data={rows}
            loading={requestsQuery.isLoading}
            emptyTitle="لا توجد طلبات حالياً"
            emptyDescription="جرّب تغيير الفلاتر أو انتظر حتى تصل طلبات تسجيل جديدة."
            emptyIcon={FileClock}
          />
        </div>

        <div className="border-t border-border px-4 pb-4 pt-3">
          <Pagination
            meta={meta}
            loading={requestsQuery.isLoading}
            cursors={cursorStack}
            onLoadMore={() => {
              if (!meta?.nextCursor || meta.nextCursor === cursor) return;
              setCursorStack((prev) => [...prev, meta.nextCursor]);
              setCursor(meta.nextCursor);
            }}
            onPrev={() => {
              setCursorStack((prev) => {
                if (prev.length <= 1) return prev;
                const next = prev.slice(0, -1);
                setCursor(next[next.length - 1] || null);
                return next;
              });
            }}
          />
        </div>
      </Card>
    </div>
  );
}
