import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock,
  Pencil,
  Phone,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { bookingsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import PageHeader from '../../../components/ui/PageHeader';
import Select from '../../../components/ui/Select';
import StatCard from '../../../components/ui/StatCard';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';

function statusVariant(status) {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'primary';
    case 'completed':
      return 'success';
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
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if (value.url) return value.url;
    return JSON.stringify(value);
  }
  return String(value);
}

function BookingCard({ booking, canManage, onOpen, tf }) {
  return (
    <Card padding="lg" hover className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-heading">{booking.requester.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {booking.requester.phone}
                {booking.requester.email ? ` • ${booking.requester.email}` : ''}
              </span>
            </p>
          </div>
        </div>
        <Badge variant={statusVariant(booking.status)} dot>
          {statusLabel(booking.status, tf)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-alt/40 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            <Tag className="h-3.5 w-3.5" />
            {tf('bookings.dashboard.bookingType', 'Booking type')}
          </p>
          <p className="mt-2 font-semibold text-heading">{booking.bookingType?.name || '-'}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-alt/40 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            <Clock className="h-3.5 w-3.5" />
            {tf('bookings.dashboard.slot', 'Slot')}
          </p>
          <p className="mt-2 font-semibold text-heading">
            {booking.scheduledTime
              ? `${booking.scheduledDate} • ${booking.scheduledTime}`
              : booking.scheduledDate}
          </p>
        </div>
      </div>

      {booking.notes ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{booking.notes}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <CircleDot className="h-3.5 w-3.5" />
          {(booking.additionalFields || []).length}{' '}
          {tf('bookings.dashboard.additionalFieldsCount', 'dynamic fields')}
        </span>
        <Button
          type="button"
          variant={canManage ? 'primary' : 'outline'}
          size="sm"
          icon={canManage ? Pencil : CheckCircle2}
          onClick={onOpen}
        >
          {canManage
            ? tf('bookings.dashboard.manageBooking', 'Manage booking')
            : tf('bookings.dashboard.viewBooking', 'View booking')}
        </Button>
      </div>
    </Card>
  );
}

export default function BookingsRequestsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();

  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const canViewBookings = hasPermission('BOOKINGS_VIEW') || hasPermission('BOOKINGS_MANAGE');
  const canManageBookings = hasPermission('BOOKINGS_MANAGE');
  const canManageTypes = hasPermission('BOOKINGS_TYPES_MANAGE');

  const [filters, setFilters] = useState({
    q: '',
    status: '',
    bookingTypeId: '',
  });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDraft, setBookingDraft] = useState({ status: 'pending', adminNotes: '' });

  useEffect(() => {
    setCursor(null);
    setCursorStack([null]);
  }, [filters.q, filters.status, filters.bookingTypeId]);

  useEffect(() => {
    if (!selectedBooking) return;
    setBookingDraft({
      status: selectedBooking.status || 'pending',
      adminNotes: selectedBooking.adminNotes || '',
    });
  }, [selectedBooking]);

  const typesQuery = useQuery({
    queryKey: ['bookings', 'types'],
    enabled: canViewBookings || canManageTypes,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await bookingsApi.admin.listTypes();
      return data;
    },
  });

  const bookingTypes = Array.isArray(typesQuery.data?.data) ? typesQuery.data.data : [];
  const typeOptions = bookingTypes.map((type) => ({ value: type.id, label: type.name }));

  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'list', cursor, filters],
    enabled: canViewBookings,
    keepPreviousData: true,
    queryFn: async () => {
      const { data } = await bookingsApi.admin.list({
        limit: 12,
        order: 'desc',
        ...(cursor ? { cursor } : {}),
        ...(filters.q.trim() ? { q: filters.q.trim() } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.bookingTypeId ? { bookingTypeId: filters.bookingTypeId } : {}),
      });
      return data;
    },
  });

  const bookings = Array.isArray(bookingsQuery.data?.data) ? bookingsQuery.data.data : [];
  const bookingsMeta = bookingsQuery.data?.meta || null;

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

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, payload }) => bookingsApi.admin.update(id, payload),
    onSuccess: (response) => {
      const updated = response?.data?.data ?? response?.data ?? null;
      toast.success(tf('bookings.dashboard.bookingUpdated', 'Booking updated successfully.'));
      setSelectedBooking(updated);
      bookingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: tf('bookings.dashboard.requestsPage', 'Booking requests') },
        ]}
      />

      <PageHeader
        eyebrow={tf('bookings.dashboard.requestsEyebrow', 'Approval workflow')}
        title={tf('bookings.dashboard.requestsTitle', 'Booking requests')}
        subtitle={tf(
          'bookings.dashboard.requestsSubtitle',
          'Review submitted bookings, inspect their details, and approve or reject them.'
        )}
        actions={(
          <div className="flex flex-wrap gap-2">
            {canManageBookings ? (
              <Badge variant="primary" size="md" className="gap-1.5 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {tf('bookings.dashboard.managePermission', 'Booking management enabled')}
              </Badge>
            ) : null}
            {canManageTypes ? (
              <Badge variant="success" size="md" className="gap-1.5 px-3 py-1">
                <Settings2 className="h-3.5 w-3.5" />
                {tf('bookings.dashboard.typePermission', 'Type configuration enabled')}
              </Badge>
            ) : null}
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Clock}
          tone="warning"
          label={statusLabel('pending', tf)}
          value={statusCounts.pending}
        />
        <StatCard
          icon={CircleDot}
          tone="primary"
          label={statusLabel('confirmed', tf)}
          value={statusCounts.confirmed}
        />
        <StatCard
          icon={CheckCircle2}
          tone="success"
          label={statusLabel('completed', tf)}
          value={statusCounts.completed}
        />
        <StatCard
          icon={CalendarClock}
          tone="danger"
          label={statusLabel('cancelled', tf)}
          value={statusCounts.cancelled}
        />
      </div>

      <Card>
        <CardHeader
          icon={SlidersHorizontal}
          title={tf('bookings.dashboard.bookingFilters', 'Filter bookings')}
          subtitle={tf(
            'bookings.dashboard.bookingFiltersSubtitle',
            'Search by requester, type, or current status.'
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label={tf('bookings.dashboard.search', 'Search')}
            value={filters.q}
            onChange={(event) =>
              setFilters((current) => ({ ...current, q: event.target.value }))
            }
            containerClassName="!mb-0"
          />
          <Select
            label={tf('bookings.dashboard.typeFilter', 'Booking type')}
            value={filters.bookingTypeId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, bookingTypeId: event.target.value }))
            }
            options={[
              { value: '', label: tf('bookings.dashboard.allTypes', 'All types') },
              ...typeOptions,
            ]}
            containerClassName="mb-0"
          />
          <Select
            label={tf('bookings.dashboard.statusFilter', 'Status')}
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
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

      {bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title={tf('bookings.dashboard.noBookingsTitle', 'No bookings found')}
            description={tf(
              'bookings.dashboard.noBookingsBody',
              'Try changing the current filters or wait for new public submissions.'
            )}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              canManage={canManageBookings}
              onOpen={() => setSelectedBooking(booking)}
              tf={tf}
            />
          ))}
        </div>
      )}

      <Card>
        <Pagination
          meta={bookingsMeta}
          loading={bookingsQuery.isFetching}
          cursors={cursorStack}
          onLoadMore={() => {
            if (!bookingsMeta?.nextCursor) return;
            setCursorStack((current) => [...current, bookingsMeta.nextCursor]);
            setCursor(bookingsMeta.nextCursor);
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

      <Modal
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={
          selectedBooking?.requester?.name ||
          tf('bookings.dashboard.bookingDetails', 'Booking details')
        }
        size="lg"
        footer={
          canManageBookings ? (
            <>
              <Button type="button" variant="ghost" onClick={() => setSelectedBooking(null)}>
                {tf('bookings.dashboard.close', 'Close')}
              </Button>
              <Button
                type="button"
                loading={updateBookingMutation.isPending}
                onClick={() =>
                  updateBookingMutation.mutate({
                    id: selectedBooking.id,
                    payload: {
                      status: bookingDraft.status,
                      adminNotes: bookingDraft.adminNotes,
                    },
                  })
                }
              >
                {tf('bookings.dashboard.saveBooking', 'Save booking')}
              </Button>
            </>
          ) : null
        }
      >
        {selectedBooking ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card tone="muted" padding="sm">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  <User className="h-3.5 w-3.5" />
                  {tf('bookings.dashboard.contact', 'Requester')}
                </p>
                <p className="mt-2 text-sm font-semibold text-heading">{selectedBooking.requester.name}</p>
                <p className="mt-1 text-sm text-muted">{selectedBooking.requester.phone}</p>
                {selectedBooking.requester.email ? (
                  <p className="mt-1 text-sm text-muted">{selectedBooking.requester.email}</p>
                ) : null}
              </Card>
              <Card tone="muted" padding="sm">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  {tf('bookings.dashboard.slot', 'Slot')}
                </p>
                <p className="mt-2 text-sm font-semibold text-heading">
                  {selectedBooking.scheduledTime
                    ? `${selectedBooking.scheduledDate} • ${selectedBooking.scheduledTime}`
                    : selectedBooking.scheduledDate}
                </p>
                <p className="mt-1 text-sm text-muted">{selectedBooking.bookingType?.name || '-'}</p>
              </Card>
            </div>

            {selectedBooking.notes ? (
              <Card tone="muted" padding="sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {tf('bookings.dashboard.notes', 'Public notes')}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                  {selectedBooking.notes}
                </p>
              </Card>
            ) : null}

            {(selectedBooking.additionalFields || []).length ? (
              <Card tone="muted" padding="sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {tf('bookings.dashboard.additionalFields', 'Additional fields')}
                </p>
                <div className="mt-3 space-y-3">
                  {selectedBooking.additionalFields.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-xl border border-border bg-surface p-3"
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
              </Card>
            ) : null}

            {canManageBookings ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label={tf('bookings.dashboard.status', 'Status')}
                  value={bookingDraft.status}
                  onChange={(event) =>
                    setBookingDraft((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  options={[
                    { value: 'pending', label: statusLabel('pending', tf) },
                    { value: 'confirmed', label: statusLabel('confirmed', tf) },
                    { value: 'completed', label: statusLabel('completed', tf) },
                    { value: 'cancelled', label: statusLabel('cancelled', tf) },
                  ]}
                  containerClassName="mb-0"
                />
                <TextArea
                  label={tf('bookings.dashboard.adminNotes', 'Admin notes')}
                  value={bookingDraft.adminNotes}
                  onChange={(event) =>
                    setBookingDraft((current) => ({
                      ...current,
                      adminNotes: event.target.value,
                    }))
                  }
                  className="min-h-[120px]"
                  containerClassName="!mb-0"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
