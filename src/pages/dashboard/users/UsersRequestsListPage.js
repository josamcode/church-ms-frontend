import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Eye,
  FileClock,
  Inbox,
  ListFilter,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import Section from '../../../components/ui/Section';
import Select from '../../../components/ui/Select';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { RowActions } from '../../../components/ui/Table';
import { useI18n } from '../../../i18n/i18n';
import {
  formatAgeFromBirthDate,
  formatDate,
  getAccountStatusLabel,
} from '../../../utils/formatters';

const ACCOUNT_STATUS_VARIANT = {
  approved: 'success',
  rejected: 'danger',
  pending: 'warning',
};

// Presentation-only urgency ranking so pending requests always float to the top.
const STATUS_ORDER = { pending: 0, rejected: 1, approved: 2 };

function StatusPill({ value }) {
  return (
    <Badge variant={ACCOUNT_STATUS_VARIANT[value] || 'warning'} dot>
      {getAccountStatusLabel(value)}
    </Badge>
  );
}

// One quiet key/value chip inside a request card — muted label + value, no icon.
function AttributeChip({ label, value, ltr = false }) {
  if (!value || value === '---') return null;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-surface-alt/50 px-2.5 py-1 text-xs">
      <span className="shrink-0 text-muted">{label}</span>
      <span className={`truncate text-heading/80 ${ltr ? 'direction-ltr' : ''}`}>{value}</span>
    </span>
  );
}

function RequestCard({
  row,
  canReview,
  busy,
  actionsLocked,
  onApprove,
  onReject,
  rowActions,
}) {
  const status = row.accountStatus || 'pending';
  const initial = String(row.fullName || 'U').trim().charAt(0).toUpperCase();
  const isPending = status === 'pending';
  const age = formatAgeFromBirthDate(row.birthDate);

  const avatarTone =
    status === 'approved'
      ? 'bg-success/12 text-success'
      : status === 'rejected'
        ? 'bg-danger/12 text-danger'
        : 'bg-warning/12 text-warning';

  return (
    <Card
      padding={false}
      className={`relative overflow-hidden ${isPending ? '!border-warning/25' : ''}`}
    >
      {/* Urgency rail — highlights pending items at a glance (RTL-safe: logical inline-start). */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 start-0 w-1 ${
          isPending ? 'bg-warning/70' : 'bg-transparent'
        }`}
      />

      <div className="flex items-start gap-3 p-4">
        {/* Identity */}
        {row.avatar?.url ? (
          <img
            src={row.avatar.url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarTone}`}
          >
            {initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/dashboard/users/${row._id}`}
                className="block truncate font-semibold text-heading transition-colors hover:text-primary"
              >
                {row.fullName || '---'}
              </Link>
              <p className="mt-0.5 text-xs text-muted">{formatDate(row.createdAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <StatusPill value={status} />
              {rowActions}
            </div>
          </div>

          {/* Key attributes — quiet label/value chips, no per-attribute icons */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <AttributeChip label="العائلة" value={row.familyName} />
            <AttributeChip label="البيت" value={row.houseName} />
            <AttributeChip label="الفئة" value={row.ageGroup} />
            {age && age !== '---' ? (
              <AttributeChip label="السن" value={`${age} سنة`} />
            ) : null}
            <AttributeChip
              label={row.phonePrimary ? 'الهاتف' : 'البريد'}
              value={row.phonePrimary || row.email}
              ltr={Boolean(row.phonePrimary)}
            />
          </div>
        </div>
      </div>

      {/* Inline decision actions — a single status always leaves at least one action available. */}
      {canReview ? (
        <div className="flex items-center gap-2 border-t border-border/70 px-4 py-3">
          {status !== 'approved' ? (
            <Button
              size="sm"
              variant="success"
              icon={CheckCircle2}
              loading={busy}
              disabled={actionsLocked}
              fullWidth
              onClick={() => onApprove(row._id)}
            >
              اعتماد
            </Button>
          ) : null}
          {status !== 'rejected' ? (
            <Button
              size="sm"
              variant="outline"
              icon={XCircle}
              disabled={actionsLocked}
              fullWidth
              onClick={() => onReject(row._id)}
            >
              رفض
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function RequestCardSkeleton() {
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <Skeleton variant="circle" className="h-11 w-11" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/70 px-4 py-3">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </Card>
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Presentation-only: surface most-urgent (pending) requests first without mutating source order.
  const sortedRows = useMemo(() => {
    return [...rows]
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const sa = STATUS_ORDER[a.row.accountStatus || 'pending'] ?? 0;
        const sb = STATUS_ORDER[b.row.accountStatus || 'pending'] ?? 0;
        if (sa !== sb) return sa - sb;
        return a.index - b.index;
      })
      .map((entry) => entry.row);
  }, [rows]);

  const mutatingId = actionMutation.isLoading ? actionMutation.variables?.id : null;
  const hasActiveFilters = Boolean(filters.fullName) || filters.accountStatus !== 'pending';

  const approve = useCallback(
    (id) => actionMutation.mutate({ id, accountStatus: 'approved' }),
    [actionMutation]
  );
  const reject = useCallback(
    (id) => actionMutation.mutate({ id, accountStatus: 'rejected' }),
    [actionMutation]
  );

  const resetPaging = useCallback(() => {
    setCursor(null);
    setCursorStack([null]);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ fullName: '', accountStatus: 'pending' });
    resetPaging();
  }, [resetPaging]);

  const buildRowActions = useCallback(
    (row) => (
      <RowActions
        actions={[
          {
            label: t('common.actions.view'),
            icon: Eye,
            onClick: () => navigate(`/dashboard/users/${row._id}`),
          },
          ...(hasPermission('USERS_UPDATE')
            ? [
                {
                  label: t('common.actions.edit'),
                  icon: Pencil,
                  onClick: () => navigate(`/dashboard/users/${row._id}/edit`),
                },
              ]
            : []),
          ...(hasPermission('USERS_UPDATE') && row.accountStatus !== 'approved'
            ? [
                {
                  label: 'اعتماد',
                  icon: CheckCircle2,
                  onClick: () => actionMutation.mutate({ id: row._id, accountStatus: 'approved' }),
                },
              ]
            : []),
          ...(hasPermission('USERS_UPDATE') && row.accountStatus !== 'rejected'
            ? [
                {
                  label: 'رفض',
                  icon: XCircle,
                  danger: true,
                  onClick: () => actionMutation.mutate({ id: row._id, accountStatus: 'rejected' }),
                },
              ]
            : []),
        ]}
      />
    ),
    [actionMutation, hasPermission, navigate, t]
  );

  const isInitialLoading = requestsQuery.isLoading;
  const isError = requestsQuery.isError && !requestsQuery.isLoading;
  const isEmpty = !isInitialLoading && !isError && sortedRows.length === 0;

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users'), href: '/dashboard/users' },
          { label: 'طلبات المستخدمين' },
        ]}
      />

      {/* ── Hero: this IS an actionable inbox ───────────────────────────── */}
      <Card padding={false} className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Inbox className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <PageHeader
                contentOnly
                title="طلبات المستخدمين"
                titleClassName="!text-2xl sm:!text-3xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-end">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                قيد المراجعة
              </p>
              <p className="text-3xl font-bold leading-none tracking-tight text-warning">
                {pendingCount}
              </p>
            </div>
            <Link to="/dashboard/users" className="hidden sm:block">
              <Button variant="outline">العودة إلى المستخدمين</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* ── Compact stat strip (kept, condensed on mobile) ──────────────── */}
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
          className="col-span-2 sm:col-span-1"
          icon={ListFilter}
          label="الفلاتر الحالية"
          value={filters.accountStatus ? getAccountStatusLabel(filters.accountStatus) : 'كل الحالات'}
          tone="gold"
          isRTL={isRTL}
        />
      </div>

      {/* ── Filters: compact toggle on mobile, inline on desktop ────────── */}
      <Section
        title="فلترة الطلبات"
        icon={SlidersHorizontal}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={SlidersHorizontal}
              className="sm:hidden"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? 'إخفاء' : 'الفلاتر'}
            </Button>
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetFilters}>
                إعادة التعيين
              </Button>
            ) : null}
          </div>
        }
        bodyClassName={filtersOpen ? '' : 'hidden sm:block'}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SearchInput
            value={filters.fullName}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, fullName: value }));
              resetPaging();
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
              resetPaging();
            }}
            placeholder="اختر الحالة"
            containerClassName="!mb-0"
          />
        </div>
      </Section>

      {/* ── The inbox ───────────────────────────────────────────────────── */}
      <Card padding={false} className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6">
          <CardHeader
            icon={FileClock}
            title="الطلبات التي تحتاج إلى مراجعة"
            subtitle="يمكنك الاعتماد أو الرفض مباشرة من كل طلب"
            className="mb-0"
            action={
              pendingCount > 0 ? (
                <Badge variant="warning" dot>
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

        <div className="p-4 sm:p-5">
          {isError ? (
            <Card tone="muted">
              <EmptyState
                icon={AlertTriangle}
                title="تعذّر تحميل الطلبات"
                description={normalizeApiError(requestsQuery.error).message}
                action={
                  <Button
                    variant="outline"
                    icon={RotateCcw}
                    onClick={() => requestsQuery.refetch()}
                    loading={requestsQuery.isFetching}
                  >
                    إعادة المحاولة
                  </Button>
                }
              />
            </Card>
          ) : isInitialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <RequestCardSkeleton key={index} />
              ))}
            </div>
          ) : isEmpty ? (
            <EmptyState
              icon={CheckCheck}
              title={
                hasActiveFilters ? 'لا توجد طلبات مطابقة' : 'تمت مراجعة كل الطلبات'
              }
              description={
                hasActiveFilters
                  ? 'جرّب تغيير الفلاتر لعرض طلبات أخرى.'
                  : 'رائع! لا توجد طلبات بانتظار المراجعة الآن.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" icon={RotateCcw} onClick={resetFilters}>
                    إعادة التعيين
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="space-y-3">
              {sortedRows.map((row) => (
                <RequestCard
                  key={row._id}
                  row={row}
                  canReview={canReview}
                  busy={mutatingId === row._id}
                  actionsLocked={actionMutation.isLoading}
                  onApprove={approve}
                  onReject={reject}
                  rowActions={buildRowActions(row)}
                />
              ))}
            </div>
          )}
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
