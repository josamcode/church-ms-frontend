import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCircle2,
  Pencil,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { bookingsApi } from '../../../api/endpoints';
import { mapFieldErrors, normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import PageHeader from '../../../components/ui/PageHeader';
import Select from '../../../components/ui/Select';
import Tabs from '../../../components/ui/Tabs';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const WEEK_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const AVAILABILITY_MODES = [
  { value: 'NONE', label: 'No availability' },
  { value: 'ALWAYS', label: 'Always available' },
  { value: 'DATE_RANGE', label: 'Within a date range' },
  { value: 'DATE_TIME_RANGE', label: 'Within a date and time range' },
  { value: 'SPECIFIC_DAYS', label: 'Specific days' },
  { value: 'SPECIFIC_DAYS_TIME', label: 'Specific days and times' },
  { value: 'SPECIFIC_DATES', label: 'Specific dates' },
  { value: 'SPECIFIC_DATES_TIME', label: 'Specific dates and times' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Select' },
  { value: 'image', label: 'Image' },
];

function createEmptyTypeForm() {
  return {
    id: null,
    name: '',
    description: '',
    instructions: '',
    isActive: true,
    availabilityMode: 'NONE',
    durationMinutes: 30,
    slotIntervalMinutes: 30,
    capacity: 1,
    bookingHorizonDays: 60,
    availabilityConfig: {
      timezone: 'Africa/Cairo',
      timeRange: { startTime: '09:00', endTime: '17:00' },
      dateRange: { startDate: '', endDate: '' },
      specificDays: [],
      specificDates: [],
      exactDateTimes: [],
    },
    dynamicFields: [],
  };
}

function createAdvancedSettings(form = createEmptyTypeForm()) {
  return {
    durationMinutes: Number(form.durationMinutes) !== 30,
    slotIntervalMinutes: Number(form.slotIntervalMinutes) !== 30,
    capacity: Number(form.capacity) !== 1,
    bookingHorizonDays: Number(form.bookingHorizonDays) !== 60,
  };
}

function modeUsesAvailabilityRules(mode) {
  return !['NONE', 'ALWAYS'].includes(mode);
}

function modeUsesTimeRange(mode) {
  return ['DATE_TIME_RANGE', 'SPECIFIC_DAYS_TIME'].includes(mode);
}

function modeUsesDateRange(mode) {
  return ['DATE_RANGE', 'DATE_TIME_RANGE'].includes(mode);
}

function modeUsesSpecificDays(mode) {
  return ['SPECIFIC_DAYS', 'SPECIFIC_DAYS_TIME'].includes(mode);
}

function modeUsesSpecificDates(mode) {
  return ['SPECIFIC_DATES', 'SPECIFIC_DATES_TIME'].includes(mode);
}

function modeUsesExactTimes(mode) {
  return ['SPECIFIC_DATES_TIME', 'DATE_TIME'].includes(mode);
}

function statusVariant(status) {
  switch (status) {
    case 'confirmed':
      return 'primary';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
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

function availabilityLabel(mode) {
  if (mode === 'DATE_TIME') {
    return AVAILABILITY_MODES.find((option) => option.value === 'SPECIFIC_DATES_TIME')?.label || mode;
  }
  return AVAILABILITY_MODES.find((option) => option.value === mode)?.label || mode;
}

function TimeChipsInput({ label, values = [], onChange, tf }) {
  const [draft, setDraft] = useState('');

  const addDraft = () => {
    const nextValue = draft.trim();
    if (!TIME_PATTERN.test(nextValue)) return;
    if (values.includes(nextValue)) {
      setDraft('');
      return;
    }
    onChange([...values, nextValue].sort());
    setDraft('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-base">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary"
          >
            {value}
            <button
              type="button"
              className="text-primary/70 transition-colors hover:text-primary"
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="time"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addDraft();
            }
          }}
          className="input-base flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addDraft}>
          {tf('bookings.dashboard.addTime', 'Add time')}
        </Button>
      </div>
    </div>
  );
}

function mapTypeToForm(type) {
  const exactDatesFromLegacy = Array.isArray(type.availabilityConfig?.exactDateTimes)
    ? type.availabilityConfig.exactDateTimes.reduce((acc, entry) => {
        const existing = acc.find((item) => item.date === entry.date);
        if (existing) {
          existing.exactTimes = [...new Set([...(existing.exactTimes || []), entry.time || ''])].filter(Boolean).sort();
          return acc;
        }

        acc.push({
          date: entry.date || '',
          startTime: '',
          endTime: '',
          exactTimes: entry.time ? [entry.time] : [],
        });
        return acc;
      }, [])
    : [];

  const specificDates = Array.isArray(type.availabilityConfig?.specificDates)
    ? type.availabilityConfig.specificDates.map((entry) => ({
        date: entry.date || '',
        startTime: entry.startTime || '',
        endTime: entry.endTime || '',
        exactTimes: Array.isArray(entry.exactTimes) ? entry.exactTimes : [],
      }))
    : [];

  const mergedSpecificDates = [...specificDates];
  exactDatesFromLegacy.forEach((entry) => {
    if (mergedSpecificDates.some((item) => item.date === entry.date)) return;
    mergedSpecificDates.push(entry);
  });

  return {
    id: type.id,
    name: type.name || '',
    description: type.description || '',
    instructions: type.instructions || '',
    isActive: type.isActive !== false,
    availabilityMode: type.availabilityMode === 'DATE_TIME' ? 'SPECIFIC_DATES_TIME' : (type.availabilityMode || 'NONE'),
    durationMinutes: type.durationMinutes || 30,
    slotIntervalMinutes: type.slotIntervalMinutes || 30,
    capacity: type.capacity || 1,
    bookingHorizonDays: type.bookingHorizonDays || 60,
    availabilityConfig: {
      timezone: type.availabilityConfig?.timezone || 'Africa/Cairo',
      timeRange: {
        startTime: type.availabilityConfig?.timeRange?.startTime || '09:00',
        endTime: type.availabilityConfig?.timeRange?.endTime || '17:00',
      },
      dateRange: {
        startDate: type.availabilityConfig?.dateRange?.startDate || '',
        endDate: type.availabilityConfig?.dateRange?.endDate || '',
      },
      specificDays: Array.isArray(type.availabilityConfig?.specificDays)
        ? type.availabilityConfig.specificDays
        : [],
      specificDates: mergedSpecificDates,
      exactDateTimes: [],
    },
    dynamicFields: Array.isArray(type.dynamicFields)
      ? type.dynamicFields.map((field) => ({
          key: field.key || '',
          label: field.label || '',
          type: field.type || 'text',
          required: Boolean(field.required),
          placeholder: field.placeholder || '',
          helpText: field.helpText || '',
          options: Array.isArray(field.options)
            ? field.options.map((option) => ({
                label: option.label || '',
                value: option.value || '',
              }))
            : [],
        }))
      : [],
  };
}

function serializeTypeForm(form, options = {}) {
  const advancedSettings = options.advancedSettings || {};
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    instructions: form.instructions.trim() || null,
    isActive: Boolean(form.isActive),
    availabilityMode: form.availabilityMode,
    durationMinutes: advancedSettings.durationMinutes
      ? (Number(form.durationMinutes) || 30)
      : 30,
    slotIntervalMinutes: advancedSettings.slotIntervalMinutes
      ? (Number(form.slotIntervalMinutes) || 30)
      : 30,
    capacity: advancedSettings.capacity
      ? (Number(form.capacity) || 1)
      : 1,
    bookingHorizonDays: advancedSettings.bookingHorizonDays
      ? (Number(form.bookingHorizonDays) || 60)
      : 60,
    availabilityConfig: {
      timezone: form.availabilityConfig.timezone || 'Africa/Cairo',
      timeRange: {
        startTime: modeUsesTimeRange(form.availabilityMode)
          ? (form.availabilityConfig.timeRange.startTime || null)
          : null,
        endTime: modeUsesTimeRange(form.availabilityMode)
          ? (form.availabilityConfig.timeRange.endTime || null)
          : null,
      },
      dateRange: {
        startDate: modeUsesDateRange(form.availabilityMode)
          ? (form.availabilityConfig.dateRange.startDate || null)
          : null,
        endDate: modeUsesDateRange(form.availabilityMode)
          ? (form.availabilityConfig.dateRange.endDate || null)
          : null,
      },
      specificDays: modeUsesSpecificDays(form.availabilityMode)
        ? form.availabilityConfig.specificDays
        : [],
      specificDates: form.availabilityConfig.specificDates
        .filter((entry) => entry.date)
        .map((entry) => ({
          date: entry.date,
          startTime: null,
          endTime: null,
          exactTimes: modeUsesExactTimes(form.availabilityMode)
            ? (entry.exactTimes || []).filter(Boolean)
            : [],
        })),
      exactDateTimes: [],
    },
    dynamicFields: form.dynamicFields.map((field) => ({
      key: field.key.trim(),
      label: field.label.trim(),
      type: field.type,
      required: Boolean(field.required),
      placeholder: field.placeholder.trim() || null,
      helpText: field.helpText.trim() || null,
      options: field.type === 'select'
        ? field.options
            .filter((option) => option.label.trim() && option.value.trim())
            .map((option) => ({
              label: option.label.trim(),
              value: option.value.trim(),
            }))
        : [],
    })),
  };
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

function BookingCard({ booking, canManage, onOpen, tf }) {
  return (
    <article className="rounded-3xl border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-heading">{booking.requester.name}</p>
          <p className="mt-1 text-sm text-muted">
            {booking.requester.phone}
            {booking.requester.email ? ` • ${booking.requester.email}` : ''}
          </p>
        </div>
        <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status, tf)}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-alt/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {tf('bookings.dashboard.bookingType', 'Booking type')}
          </p>
          <p className="mt-2 font-semibold text-heading">{booking.bookingType?.name || '—'}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-alt/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {tf('bookings.dashboard.slot', 'Slot')}
          </p>
          <p className="mt-2 font-semibold text-heading">
            {booking.scheduledDate} • {booking.scheduledTime}
          </p>
        </div>
      </div>

      {booking.notes ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{booking.notes}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted">
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
    </article>
  );
}

export default function BookingsManagementPage({ mode = 'all' }) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
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
  const [typeForm, setTypeForm] = useState(createEmptyTypeForm);
  const [advancedSettings, setAdvancedSettings] = useState(createAdvancedSettings);
  const [typeErrors, setTypeErrors] = useState({});

  const applyTypeFormState = (nextForm) => {
    setTypeForm(nextForm);
    setAdvancedSettings(createAdvancedSettings(nextForm));
  };

  useEffect(() => {
    setCursor(null);
    setCursorStack([null]);
  }, [filters.q, filters.status, filters.bookingTypeId]);

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

  const saveTypeMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id ? bookingsApi.admin.updateType(id, payload) : bookingsApi.admin.createType(payload),
    onSuccess: () => {
      toast.success(
        typeForm.id
          ? tf('bookings.dashboard.typeUpdated', 'Booking type updated successfully.')
          : tf('bookings.dashboard.typeCreated', 'Booking type created successfully.')
      );
      applyTypeFormState(createEmptyTypeForm());
      setTypeErrors({});
      queryClient.invalidateQueries({ queryKey: ['bookings', 'types'] });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setTypeErrors(mapFieldErrors(normalized.details));
      toast.error(normalized.message);
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, payload }) => bookingsApi.admin.update(id, payload),
    onSuccess: (response) => {
      const updated = response?.data?.data ?? response?.data ?? null;
      toast.success(tf('bookings.dashboard.bookingUpdated', 'Booking updated successfully.'));
      setSelectedBooking(updated);
      queryClient.invalidateQueries({ queryKey: ['bookings', 'list'] });
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  useEffect(() => {
    if (!selectedBooking) return;
    setBookingDraft({
      status: selectedBooking.status || 'pending',
      adminNotes: selectedBooking.adminNotes || '',
    });
  }, [selectedBooking]);

  const tabs = (() => {
    const items = [];

    if ((mode === 'all' || mode === 'requests') && canViewBookings) {
      items.push({
        key: 'requests',
        label: tf('bookings.dashboard.bookingsTab', 'Bookings'),
        content: (
          <div className="space-y-6">
            <Card>
              <CardHeader
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
              <Card className="text-center">
                <CalendarClock className="mx-auto h-10 w-10 text-muted" />
                <p className="mt-4 text-lg font-semibold text-heading">
                  {tf('bookings.dashboard.noBookingsTitle', 'No bookings found')}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {tf(
                    'bookings.dashboard.noBookingsBody',
                    'Try changing the current filters or wait for new public submissions.'
                  )}
                </p>
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

            <Card className="rounded-3xl">
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
          </div>
        ),
      });
    }

    if ((mode === 'all' || mode === 'types') && canManageTypes) {
      items.push({
        key: 'types',
        label: tf('bookings.dashboard.typesTab', 'Booking types'),
        content: (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title={
                  typeForm.id
                    ? tf('bookings.dashboard.editTypeTitle', 'Edit booking type')
                    : tf('bookings.dashboard.createTypeTitle', 'Create booking type')
                }
                subtitle={tf(
                  'bookings.dashboard.typeSubtitle',
                  'Control public instructions, fields, and slot-generation rules from one place.'
                )}
                action={
                  typeForm.id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => applyTypeFormState(createEmptyTypeForm())}
                    >
                      {tf('bookings.dashboard.newType', 'New type')}
                    </Button>
                  ) : null
                }
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label={tf('bookings.dashboard.typeName', 'Type name')}
                  value={typeForm.name}
                  onChange={(event) =>
                    setTypeForm((current) => ({ ...current, name: event.target.value }))
                  }
                  error={typeErrors.name}
                  required
                  containerClassName="!mb-0"
                />
                <Select
                  label={tf('bookings.dashboard.mode', 'Availability mode')}
                  value={typeForm.availabilityMode}
                  onChange={(event) =>
                    setTypeForm((current) => ({
                      ...current,
                      availabilityMode: event.target.value,
                      availabilityConfig: {
                        ...current.availabilityConfig,
                        timeRange: { startTime: '09:00', endTime: '17:00' },
                        dateRange: { startDate: '', endDate: '' },
                        specificDays: [],
                        specificDates: [],
                        exactDateTimes: [],
                      },
                    }))
                  }
                  options={AVAILABILITY_MODES}
                  containerClassName="mb-0"
                />
              </div>

              <TextArea
                label={tf('bookings.dashboard.description', 'Short description')}
                value={typeForm.description}
                onChange={(event) =>
                  setTypeForm((current) => ({ ...current, description: event.target.value }))
                }
                className="min-h-[90px]"
              />

              <TextArea
                label={tf('bookings.dashboard.instructions', 'Public instructions')}
                value={typeForm.instructions}
                onChange={(event) =>
                  setTypeForm((current) => ({ ...current, instructions: event.target.value }))
                }
                className="min-h-[140px]"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  ['durationMinutes', tf('bookings.dashboard.duration', 'Duration')],
                  ['slotIntervalMinutes', tf('bookings.dashboard.interval', 'Slot interval')],
                  ['capacity', tf('bookings.dashboard.capacity', 'Capacity')],
                  ['bookingHorizonDays', tf('bookings.dashboard.horizon', 'Horizon days')],
                ].map(([fieldKey, label]) => (
                  <div
                    key={fieldKey}
                    className="rounded-2xl border border-border bg-surface-alt/35 p-4"
                  >
                    <label className="flex items-center gap-3 text-sm font-medium text-heading">
                      <input
                        type="checkbox"
                        checked={Boolean(advancedSettings[fieldKey])}
                        onChange={(event) =>
                          setAdvancedSettings((current) => ({
                            ...current,
                            [fieldKey]: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      {label}
                    </label>
                    {advancedSettings[fieldKey] ? (
                      <Input
                        type="number"
                        value={typeForm[fieldKey]}
                        onChange={(event) =>
                          setTypeForm((current) => ({
                            ...current,
                            [fieldKey]: event.target.value,
                          }))
                        }
                        containerClassName="!mb-0 mt-4"
                      />
                    ) : null}
                  </div>
                ))}
                <div className="mb-4 flex items-end rounded-2xl border border-border bg-surface-alt/35 px-4 py-3">
                  <label className="flex items-center gap-3 text-sm font-medium text-heading">
                    <input
                      type="checkbox"
                      checked={typeForm.isActive}
                      onChange={(event) =>
                        setTypeForm((current) => ({ ...current, isActive: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    {tf('bookings.dashboard.activeType', 'Type is active')}
                  </label>
                </div>
              </div>
            </Card>

            {modeUsesAvailabilityRules(typeForm.availabilityMode) ? (
              <Card className="rounded-3xl border-dashed bg-surface-alt/25">
                <CardHeader
                  title={tf('bookings.dashboard.availabilityRules', 'Availability rules')}
                  subtitle={tf(
                    'bookings.dashboard.availabilityRulesSubtitle',
                    'Configure only the parts used by the selected mode.'
                  )}
                />

                {modeUsesDateRange(typeForm.availabilityMode) ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label={tf('bookings.dashboard.rangeStart', 'Range start')}
                      type="date"
                      value={typeForm.availabilityConfig.dateRange.startDate}
                      onChange={(event) =>
                        setTypeForm((current) => ({
                          ...current,
                          availabilityConfig: {
                            ...current.availabilityConfig,
                            dateRange: {
                              ...current.availabilityConfig.dateRange,
                              startDate: event.target.value,
                            },
                          },
                        }))
                      }
                      containerClassName="!mb-0"
                    />
                    <Input
                      label={tf('bookings.dashboard.rangeEnd', 'Range end')}
                      type="date"
                      value={typeForm.availabilityConfig.dateRange.endDate}
                      onChange={(event) =>
                        setTypeForm((current) => ({
                          ...current,
                          availabilityConfig: {
                            ...current.availabilityConfig,
                            dateRange: {
                              ...current.availabilityConfig.dateRange,
                              endDate: event.target.value,
                            },
                          },
                        }))
                      }
                      containerClassName="!mb-0"
                    />
                  </div>
                ) : null}

                {modeUsesTimeRange(typeForm.availabilityMode) ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label={tf('bookings.dashboard.startTime', 'Default start time')}
                      type="time"
                      value={typeForm.availabilityConfig.timeRange.startTime}
                      onChange={(event) =>
                        setTypeForm((current) => ({
                          ...current,
                          availabilityConfig: {
                            ...current.availabilityConfig,
                            timeRange: {
                              ...current.availabilityConfig.timeRange,
                              startTime: event.target.value,
                            },
                          },
                        }))
                      }
                      containerClassName="!mb-0"
                    />
                    <Input
                      label={tf('bookings.dashboard.endTime', 'Default end time')}
                      type="time"
                      value={typeForm.availabilityConfig.timeRange.endTime}
                      onChange={(event) =>
                        setTypeForm((current) => ({
                          ...current,
                          availabilityConfig: {
                            ...current.availabilityConfig,
                            timeRange: {
                              ...current.availabilityConfig.timeRange,
                              endTime: event.target.value,
                            },
                          },
                        }))
                      }
                      containerClassName="!mb-0"
                    />
                  </div>
                ) : null}

                {modeUsesSpecificDays(typeForm.availabilityMode) ? (
                  <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
                    <p className="text-sm font-semibold text-heading">
                      {tf('bookings.dashboard.specificDays', 'Specific weekdays')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {WEEK_DAYS.map((day) => {
                        const active = typeForm.availabilityConfig.specificDays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() =>
                              setTypeForm((current) => ({
                                ...current,
                                availabilityConfig: {
                                  ...current.availabilityConfig,
                                  specificDays: active
                                    ? current.availabilityConfig.specificDays.filter(
                                        (value) => value !== day.value
                                      )
                                    : [...current.availabilityConfig.specificDays, day.value].sort(),
                                },
                              }))
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                              active
                                ? 'bg-primary text-white'
                                : 'bg-surface-alt text-muted hover:text-heading'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {modeUsesSpecificDates(typeForm.availabilityMode) ? (
                  <div className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-heading">
                        {tf('bookings.dashboard.specificDatesBlock', 'Specific dates')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={Plus}
                        onClick={() =>
                          setTypeForm((current) => ({
                            ...current,
                            availabilityConfig: {
                              ...current.availabilityConfig,
                              specificDates: [
                                ...current.availabilityConfig.specificDates,
                                { date: '', startTime: '', endTime: '', exactTimes: [] },
                              ],
                            },
                          }))
                        }
                      >
                        {tf('bookings.dashboard.addDate', 'Add date')}
                      </Button>
                    </div>

                    {typeForm.availabilityConfig.specificDates.map((entry, index) => (
                      <div
                        key={`specific-date-${index}`}
                        className="rounded-2xl border border-border bg-surface-alt/35 p-4"
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                          <Input
                            label={tf('bookings.dashboard.date', 'Date')}
                            type="date"
                            value={entry.date}
                            onChange={(event) =>
                              setTypeForm((current) => {
                                const next = [...current.availabilityConfig.specificDates];
                                next[index] = { ...next[index], date: event.target.value };
                                return {
                                  ...current,
                                  availabilityConfig: {
                                    ...current.availabilityConfig,
                                    specificDates: next,
                                  },
                                };
                              })
                            }
                            containerClassName="!mb-0"
                          />
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setTypeForm((current) => ({
                                  ...current,
                                  availabilityConfig: {
                                    ...current.availabilityConfig,
                                    specificDates: current.availabilityConfig.specificDates.filter(
                                      (_, itemIndex) => itemIndex !== index
                                    ),
                                  },
                                }))
                              }
                            >
                              {tf('bookings.dashboard.remove', 'Remove')}
                            </Button>
                          </div>
                        </div>

                        {modeUsesExactTimes(typeForm.availabilityMode) ? (
                          <div className="mt-4">
                            <TimeChipsInput
                              label={tf('bookings.dashboard.exactTimes', 'Exact times')}
                              values={entry.exactTimes || []}
                              onChange={(nextTimes) =>
                                setTypeForm((current) => {
                                  const next = [...current.availabilityConfig.specificDates];
                                  next[index] = { ...next[index], exactTimes: nextTimes };
                                  return {
                                    ...current,
                                    availabilityConfig: {
                                      ...current.availabilityConfig,
                                      specificDates: next,
                                    },
                                  };
                                })
                              }
                              tf={tf}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            ) : null}

            <Card className="rounded-3xl border-dashed bg-surface-alt/25">
              <CardHeader
                title={tf('bookings.dashboard.dynamicFields', 'Dynamic fields')}
                subtitle={tf(
                  'bookings.dashboard.dynamicFieldsSubtitle',
                  'Add optional public fields such as text, images, dates, or selects.'
                )}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={() =>
                      setTypeForm((current) => ({
                        ...current,
                        dynamicFields: [
                          ...current.dynamicFields,
                          {
                            key: '',
                            label: '',
                            type: 'text',
                            required: false,
                            placeholder: '',
                            helpText: '',
                            options: [],
                          },
                        ],
                      }))
                    }
                  >
                    {tf('bookings.dashboard.addField', 'Add field')}
                  </Button>
                }
              />

              <div className="space-y-4">
                {typeForm.dynamicFields.map((field, index) => (
                  <div key={`field-${index}`} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label={tf('bookings.dashboard.fieldKey', 'Field key')}
                        value={field.key}
                        onChange={(event) =>
                          setTypeForm((current) => {
                            const next = [...current.dynamicFields];
                            next[index] = { ...next[index], key: event.target.value };
                            return { ...current, dynamicFields: next };
                          })
                        }
                        containerClassName="!mb-0"
                      />
                      <Input
                        label={tf('bookings.dashboard.fieldLabel', 'Field label')}
                        value={field.label}
                        onChange={(event) =>
                          setTypeForm((current) => {
                            const next = [...current.dynamicFields];
                            next[index] = { ...next[index], label: event.target.value };
                            return { ...current, dynamicFields: next };
                          })
                        }
                        containerClassName="!mb-0"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Select
                        label={tf('bookings.dashboard.fieldType', 'Field type')}
                        value={field.type}
                        onChange={(event) =>
                          setTypeForm((current) => {
                            const next = [...current.dynamicFields];
                            next[index] = { ...next[index], type: event.target.value };
                            if (event.target.value !== 'select') next[index].options = [];
                            return { ...current, dynamicFields: next };
                          })
                        }
                        options={FIELD_TYPES}
                        containerClassName="mb-0"
                      />
                      <div className="mb-4 flex items-end rounded-2xl border border-border bg-surface-alt/35 px-4 py-3">
                        <label className="flex items-center gap-3 text-sm font-medium text-heading">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) =>
                              setTypeForm((current) => {
                                const next = [...current.dynamicFields];
                                next[index] = { ...next[index], required: event.target.checked };
                                return { ...current, dynamicFields: next };
                              })
                            }
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          {tf('bookings.dashboard.requiredField', 'Required field')}
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label={tf('bookings.dashboard.placeholder', 'Placeholder')}
                        value={field.placeholder}
                        onChange={(event) =>
                          setTypeForm((current) => {
                            const next = [...current.dynamicFields];
                            next[index] = { ...next[index], placeholder: event.target.value };
                            return { ...current, dynamicFields: next };
                          })
                        }
                        containerClassName="!mb-0"
                      />
                      <Input
                        label={tf('bookings.dashboard.helpText', 'Help text')}
                        value={field.helpText}
                        onChange={(event) =>
                          setTypeForm((current) => {
                            const next = [...current.dynamicFields];
                            next[index] = { ...next[index], helpText: event.target.value };
                            return { ...current, dynamicFields: next };
                          })
                        }
                        containerClassName="!mb-0"
                      />
                    </div>

                    {field.type === 'select' ? (
                      <div className="mt-4 rounded-2xl border border-border bg-surface-alt/35 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-heading">
                            {tf('bookings.dashboard.selectOptions', 'Select options')}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setTypeForm((current) => {
                                const next = [...current.dynamicFields];
                                next[index] = {
                                  ...next[index],
                                  options: [...next[index].options, { label: '', value: '' }],
                                };
                                return { ...current, dynamicFields: next };
                              })
                            }
                          >
                            {tf('bookings.dashboard.addOption', 'Add option')}
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {field.options.map((option, optionIndex) => (
                            <div
                              key={`option-${index}-${optionIndex}`}
                              className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
                            >
                              <Input
                                label={tf('bookings.dashboard.optionLabel', 'Label')}
                                value={option.label}
                                onChange={(event) =>
                                  setTypeForm((current) => {
                                    const next = [...current.dynamicFields];
                                    const nextOptions = [...next[index].options];
                                    nextOptions[optionIndex] = {
                                      ...nextOptions[optionIndex],
                                      label: event.target.value,
                                    };
                                    next[index] = { ...next[index], options: nextOptions };
                                    return { ...current, dynamicFields: next };
                                  })
                                }
                                containerClassName="!mb-0"
                              />
                              <Input
                                label={tf('bookings.dashboard.optionValue', 'Value')}
                                value={option.value}
                                onChange={(event) =>
                                  setTypeForm((current) => {
                                    const next = [...current.dynamicFields];
                                    const nextOptions = [...next[index].options];
                                    nextOptions[optionIndex] = {
                                      ...nextOptions[optionIndex],
                                      value: event.target.value,
                                    };
                                    next[index] = { ...next[index], options: nextOptions };
                                    return { ...current, dynamicFields: next };
                                  })
                                }
                                containerClassName="!mb-0"
                              />
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setTypeForm((current) => {
                                      const next = [...current.dynamicFields];
                                      next[index] = {
                                        ...next[index],
                                        options: next[index].options.filter(
                                          (_, itemIndex) => itemIndex !== optionIndex
                                        ),
                                      };
                                      return { ...current, dynamicFields: next };
                                    })
                                  }
                                >
                                  {tf('bookings.dashboard.remove', 'Remove')}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setTypeForm((current) => ({
                            ...current,
                            dynamicFields: current.dynamicFields.filter(
                              (_, itemIndex) => itemIndex !== index
                            ),
                          }))
                        }
                      >
                        {tf('bookings.dashboard.removeField', 'Remove field')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {bookingTypes.map((type) => (
                <Card key={type.id} className="rounded-3xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-heading">{type.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {availabilityLabel(type.availabilityMode)}
                      </p>
                    </div>
                    <Badge variant={type.isActive ? 'success' : 'default'}>
                      {type.isActive
                        ? tf('bookings.dashboard.active', 'active')
                        : tf('bookings.dashboard.inactive', 'inactive')}
                    </Badge>
                  </div>
                  {type.description ? (
                    <p className="mt-3 text-sm leading-6 text-muted">{type.description}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                    <span className="rounded-full bg-surface-alt px-3 py-1">
                      {type.durationMinutes} min
                    </span>
                    <span className="rounded-full bg-surface-alt px-3 py-1">
                      cap {type.capacity}
                    </span>
                    <span className="rounded-full bg-surface-alt px-3 py-1">
                      {(type.dynamicFields || []).length} fields
                    </span>
                  </div>

                  <div className="mt-5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Pencil}
                      onClick={() => applyTypeFormState(mapTypeToForm(type))}
                    >
                      {tf('bookings.dashboard.editType', 'Edit type')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => applyTypeFormState(createEmptyTypeForm())}>
                {tf('bookings.dashboard.resetForm', 'Reset')}
              </Button>
              <Button
                type="button"
                icon={Save}
                loading={saveTypeMutation.isPending}
                onClick={() =>
                  saveTypeMutation.mutate({
                    id: typeForm.id,
                    payload: serializeTypeForm(typeForm, { advancedSettings }),
                  })
                }
              >
                {typeForm.id
                  ? tf('bookings.dashboard.saveType', 'Save changes')
                  : tf('bookings.dashboard.createTypeAction', 'Create type')}
              </Button>
            </div>
          </div>
        ),
      });
    }

    return items;
  })();

  const activeTab =
    mode === 'requests'
      ? tabs.find((tab) => tab.key === 'requests') || tabs[0]
      : mode === 'types'
        ? tabs.find((tab) => tab.key === 'types') || tabs[0]
        : null;

  const pageLabel =
    mode === 'requests'
      ? tf('bookings.dashboard.requestsPage', 'Booking requests')
      : mode === 'types'
        ? tf('bookings.dashboard.typesPage', 'Booking types')
        : tf('bookings.dashboard.page', 'Bookings');

  const pageEyebrow =
    mode === 'requests'
      ? tf('bookings.dashboard.requestsEyebrow', 'Approval workflow')
      : mode === 'types'
        ? tf('bookings.dashboard.typesEyebrow', 'Booking configuration')
        : tf('bookings.dashboard.eyebrow', 'Permissions-aware module');

  const pageTitle =
    mode === 'requests'
      ? tf('bookings.dashboard.requestsTitle', 'Booking requests')
      : mode === 'types'
        ? tf('bookings.dashboard.typesTitle', 'Booking types')
        : tf('bookings.dashboard.title', 'Bookings');

  const pageSubtitle =
    mode === 'requests'
      ? tf(
          'bookings.dashboard.requestsSubtitle',
          'Review submitted bookings, inspect their details, and approve or reject them.'
        )
      : mode === 'types'
        ? tf(
            'bookings.dashboard.typesSubtitle',
            'Create and edit the booking types, instructions, availability rules, and dynamic fields shown on the public booking page.'
          )
        : tf(
            'bookings.dashboard.subtitle',
            'Review public appointment requests, update their status, and control which booking types are available.'
          );

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: pageLabel },
        ]}
      />

      <PageHeader
        eyebrow={pageEyebrow}
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={(
          <div className="flex flex-wrap gap-2">
            {canManageBookings ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {tf('bookings.dashboard.managePermission', 'Booking management enabled')}
              </span>
            ) : null}
            {canManageTypes ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success-light px-3 py-1 text-xs font-semibold text-success">
                <Settings2 className="h-3.5 w-3.5" />
                {tf('bookings.dashboard.typePermission', 'Type configuration enabled')}
              </span>
            ) : null}
          </div>
        )}
      />

      {mode === 'all' ? <Tabs tabs={tabs} /> : activeTab?.content}

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
              <Card className="rounded-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {tf('bookings.dashboard.contact', 'Requester')}
                </p>
                <p className="mt-2 text-sm font-semibold text-heading">{selectedBooking.requester.name}</p>
                <p className="mt-1 text-sm text-muted">{selectedBooking.requester.phone}</p>
                {selectedBooking.requester.email ? (
                  <p className="mt-1 text-sm text-muted">{selectedBooking.requester.email}</p>
                ) : null}
              </Card>
              <Card className="rounded-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {tf('bookings.dashboard.slot', 'Slot')}
                </p>
                <p className="mt-2 text-sm font-semibold text-heading">
                  {selectedBooking.scheduledDate} • {selectedBooking.scheduledTime}
                </p>
                <p className="mt-1 text-sm text-muted">{selectedBooking.bookingType?.name || '—'}</p>
              </Card>
            </div>

            {selectedBooking.notes ? (
              <Card className="rounded-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {tf('bookings.dashboard.notes', 'Public notes')}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                  {selectedBooking.notes}
                </p>
              </Card>
            ) : null}

            {(selectedBooking.additionalFields || []).length ? (
              <Card className="rounded-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {tf('bookings.dashboard.additionalFields', 'Additional fields')}
                </p>
                <div className="mt-3 space-y-3">
                  {selectedBooking.additionalFields.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-2xl border border-border bg-surface-alt/35 p-3"
                    >
                      <p className="text-sm font-semibold text-heading">{field.label}</p>
                      {field.type === 'image' &&
                      typeof field.value === 'object' &&
                      field.value?.url ? (
                        <a
                          href={field.value.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm text-primary hover:underline"
                        >
                          {field.value.url}
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
