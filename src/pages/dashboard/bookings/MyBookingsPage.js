import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock,
  Layers,
  NotebookPen,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { bookingsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import PageHeader from '../../../components/ui/PageHeader';
import Select from '../../../components/ui/Select';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { useI18n } from '../../../i18n/i18n';

function statusVariant(status) {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'success';
    case 'completed':
      return 'primary';
    case 'cancelled':
      return 'danger';
    default:
      return 'warning';
  }
}

function statusLabel(status, tf) {
  switch (status) {
    case 'confirmed':
      return tf('bookings.dashboard.statuses.confirmed', 'Approved');
    case 'completed':
      return tf('bookings.dashboard.statuses.completed', 'Completed');
    case 'cancelled':
      return tf('bookings.dashboard.statuses.cancelled', 'Rejected');
    case 'pending':
    default:
      return tf('bookings.dashboard.statuses.pending', 'Pending');
  }
}

function formatAdditionalValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if (value.url) return value.url;
    return JSON.stringify(value);
  }
  return String(value);
}

// Left accent rail keyed to status — the timeline reads at a glance.
const statusRail = {
  pending: 'before:bg-warning',
  confirmed: 'before:bg-success',
  completed: 'before:bg-primary',
  cancelled: 'before:bg-danger',
};

export default function MyBookingsPage() {
  const { t, isRTL } = useI18n();
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [status, setStatus] = useState('');
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);

  useEffect(() => {
    setCursor(null);
    setCursorStack([null]);
  }, [status]);

  const myBookingsQuery = useQuery({
    queryKey: ['bookings', 'mine', cursor, status],
    keepPreviousData: true,
    queryFn: async () => {
      const { data } = await bookingsApi.self.list({
        limit: 12,
        order: 'desc',
        ...(cursor ? { cursor } : {}),
        ...(status ? { status } : {}),
      });
      return data;
    },
  });

  const bookings = Array.isArray(myBookingsQuery.data?.data) ? myBookingsQuery.data.data : [];
  const meta = myBookingsQuery.data?.meta || null;

  const statusCounts = bookings.reduce(
    (acc, booking) => {
      if (booking.status === 'pending') acc.pending += 1;
      else if (booking.status === 'confirmed') acc.confirmed += 1;
      else if (booking.status === 'completed') acc.completed += 1;
      else if (booking.status === 'cancelled') acc.cancelled += 1;
      return acc;
    },
    { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
  );

  const isInitialLoading = myBookingsQuery.isLoading;
  const isError = myBookingsQuery.isError;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: tf('bookings.dashboard.myPage', 'My bookings') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={tf('bookings.dashboard.myEyebrow', 'Booking tracking')}
        title={tf('bookings.dashboard.myTitle', 'My bookings')}
        subtitle={tf(
          'bookings.dashboard.mySubtitle',
          'See the status of the bookings you submitted and read any notes left by the manager.'
        )}
        actions={(
          <Link
            to="/bookings/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <NotebookPen className="h-4 w-4" />
            {tf('bookings.public.submitAnother', 'Book a new appointment')}
          </Link>
        )}
      />

      {/* ══ KPI STRIP ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={Layers}
          tone="primary"
          isRTL={isRTL}
          label={tf('bookings.dashboard.myTitle', 'My bookings')}
          value={bookings.length}
        />
        <StatCard
          icon={Clock}
          tone="warning"
          isRTL={isRTL}
          label={statusLabel('pending', tf)}
          value={statusCounts.pending}
        />
        <StatCard
          icon={CheckCircle2}
          tone="success"
          isRTL={isRTL}
          label={statusLabel('confirmed', tf)}
          value={statusCounts.confirmed}
        />
        <StatCard
          icon={CircleDot}
          tone="primary"
          isRTL={isRTL}
          label={statusLabel('completed', tf)}
          value={statusCounts.completed}
        />
        <StatCard
          icon={XCircle}
          tone="danger"
          isRTL={isRTL}
          label={statusLabel('cancelled', tf)}
          value={statusCounts.cancelled}
        />
      </div>

      {/* ══ FILTER ═══════════════════════════════════════════════════════ */}
      <Card tone="muted">
        <CardHeader
          icon={SlidersHorizontal}
          title={tf('bookings.dashboard.statusFilter', 'Status')}
          subtitle={tf('bookings.dashboard.mySubtitle', 'See the status of the bookings you submitted and read any notes left by the manager.')}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label={tf('bookings.dashboard.statusFilter', 'Status')}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { value: '', label: tf('bookings.dashboard.allStatuses', 'All statuses') },
              { value: 'pending', label: statusLabel('pending', tf) },
              { value: 'confirmed', label: statusLabel('confirmed', tf) },
              { value: 'completed', label: statusLabel('completed', tf) },
              { value: 'cancelled', label: statusLabel('cancelled', tf) },
            ]}
            containerClassName="mb-0"
          />
        </div>
      </Card>

      {/* ══ BOOKINGS — loading / error / empty / list ════════════════════ */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <Card className="border-danger/30">
          <EmptyState
            icon={AlertTriangle}
            title={tf('bookings.dashboard.errorTitle', 'Something went wrong')}
            description={normalizeApiError(myBookingsQuery.error).message}
            action={(
              <Button
                type="button"
                variant="outline"
                icon={RefreshCw}
                onClick={() => myBookingsQuery.refetch()}
              >
                {tf('bookings.dashboard.retry', 'Try again')}
              </Button>
            )}
          />
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title={tf('bookings.dashboard.myEmptyTitle', 'No bookings yet')}
            description={tf(
              'bookings.dashboard.myEmptyBody',
              'Once you submit a booking while signed in, it will appear here with its approval status.'
            )}
            action={(
              <Link
                to="/bookings/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <NotebookPen className="h-4 w-4" />
                {tf('bookings.public.submitAnother', 'Book a new appointment')}
              </Link>
            )}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              padding="lg"
              hover
              className={`relative overflow-hidden ps-6 before:absolute before:inset-y-0 before:start-0 before:w-1.5 ${statusRail[booking.status] || statusRail.pending}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-heading">
                      {booking.bookingType?.name || tf('bookings.dashboard.bookingType', 'Booking type')}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      {booking.scheduledTime
                        ? `${booking.scheduledDate} • ${booking.scheduledTime}`
                        : booking.scheduledDate}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant(booking.status)} dot>
                  {statusLabel(booking.status, tf)}
                </Badge>
              </div>

              {booking.adminNotes ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      {tf('bookings.dashboard.adminNotes', 'Admin notes')}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                      {booking.adminNotes}
                    </p>
                  </div>
                </div>
              ) : null}

              {booking.notes ? (
                <div className="mt-4 rounded-xl border border-border bg-surface-alt/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {tf('bookings.dashboard.notes', 'Public notes')}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                    {booking.notes}
                  </p>
                </div>
              ) : null}

              {(booking.additionalFields || []).length ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-heading">
                    {tf('bookings.dashboard.additionalFields', 'Additional fields')}
                  </p>
                  {booking.additionalFields.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-xl border border-border bg-surface-alt/40 p-3"
                    >
                      <p className="text-sm font-semibold text-heading">{field.label}</p>
                      {field.type === 'image' &&
                      typeof field.value === 'object' &&
                      field.value?.url ? (
                        <a
                          href={field.value.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block"
                        >
                          <img
                            src={field.value.url}
                            alt={field.label}
                            className="max-h-56 rounded-2xl border border-border object-contain shadow-sm transition-transform duration-200 hover:scale-[1.01]"
                          />
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-muted">
                          {formatAdditionalValue(field.value)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {(meta?.nextCursor || cursorStack.length > 1) && !isError ? (
        <Card padding="sm">
          <Pagination
            meta={meta}
            loading={myBookingsQuery.isFetching}
            cursors={cursorStack}
            onLoadMore={() => {
              if (!meta?.nextCursor) return;
              setCursorStack((current) => [...current, meta.nextCursor]);
              setCursor(meta.nextCursor);
            }}
            onPrev={() => {
              setCursorStack((current) => {
                const next = current.slice(0, -1);
                setCursor(next[next.length - 1] || null);
                return next;
              });
            }}
          />
        </Card>
      ) : null}
    </div>
  );
}
