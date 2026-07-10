import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Hash,
  Infinity as InfinityIcon,
  ListPlus,
  Plus,
  Save,
  Settings2,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { bookingsApi } from '../../../api/endpoints';
import { mapFieldErrors, normalizeApiError } from '../../../api/errors';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import PageHeader from '../../../components/ui/PageHeader';
import Select from '../../../components/ui/Select';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import Switch from '../../../components/ui/Switch';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';
import {
  FIELD_TYPES,
  WEEK_DAYS,
  buildFieldKeys,
  buildOptionValues,
  composeMode,
  createEmptyTypeForm,
  familySupportsTime,
  isBookableMode,
  mapTypeToForm,
  modeHasTime,
  modeToFamily,
  modeUsesDateRange,
  modeUsesExactTimes,
  modeUsesSpecificDates,
  modeUsesSpecificDays,
  modeUsesTimeRange,
  serializeTypeForm,
} from './bookingTypeForm.utils';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const FAMILY_META = [
  { value: 'ALWAYS', icon: InfinityIcon },
  { value: 'DATE', icon: CalendarRange },
  { value: 'DAYS', icon: CalendarDays },
  { value: 'DATES', icon: CalendarClock },
];

/* ─── small building blocks ──────────────────────────────────────────────── */

function SectionNote({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-alt/40 px-4 py-3 text-sm text-muted">
      {children}
    </div>
  );
}

function SwitchRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-alt/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-heading">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function NumberField({ label, hint, unit, value, onChange, min, max, error }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <label className="block text-sm font-semibold text-heading">{label}</label>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      <div className="relative mt-3">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`input-base ${unit ? 'pe-16' : ''} ${error ? 'border-danger' : ''}`}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-medium text-muted">
            {unit}
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function ModeCard({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex items-start gap-3 rounded-2xl border p-4 text-start transition-all ${
        active
          ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/25'
          : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-alt/40'
      }`}
    >
      <span
        className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
          active ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-heading">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
      </div>
    </button>
  );
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
    <div className="space-y-2.5">
      <label className="block text-xs font-semibold text-heading">{label}</label>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {value}
              <button
                type="button"
                className="text-primary/60 transition-colors hover:text-primary"
                onClick={() => onChange(values.filter((item) => item !== value))}
                aria-label={tf('bookings.dashboard.remove', 'Remove')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
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
        <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addDraft}>
          {tf('bookings.dashboard.addTime', 'Add time')}
        </Button>
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */

export default function BookingTypeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [typeForm, setTypeForm] = useState(createEmptyTypeForm);
  const [typeErrors, setTypeErrors] = useState({});

  const typesQuery = useQuery({
    queryKey: ['bookings', 'types'],
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await bookingsApi.admin.listTypes();
      return data;
    },
  });

  const bookingTypes = Array.isArray(typesQuery.data?.data) ? typesQuery.data.data : [];
  const selectedType = isEdit
    ? bookingTypes.find((item) => String(item.id) === String(id)) || null
    : null;

  useEffect(() => {
    if (isEdit) {
      if (!selectedType) return;
      setTypeForm(mapTypeToForm(selectedType));
      setTypeErrors({});
      return;
    }

    setTypeForm(createEmptyTypeForm());
    setTypeErrors({});
  }, [isEdit, selectedType]);

  const mode = typeForm.availabilityMode;
  const bookable = isBookableMode(mode);
  const family = modeToFamily(mode);
  const restrictTimes = modeHasTime(mode);
  const usesWindow = modeUsesTimeRange(mode);

  // Field keys + option values are generated by the system; compute them here so
  // the admin can see the identifier without ever typing it.
  const fieldKeys = useMemo(() => buildFieldKeys(typeForm.dynamicFields), [typeForm.dynamicFields]);

  const patchForm = (patch) => setTypeForm((current) => ({ ...current, ...patch }));
  const patchConfig = (patch) =>
    setTypeForm((current) => ({
      ...current,
      availabilityConfig: { ...current.availabilityConfig, ...patch },
    }));

  const setBookable = (next) => patchForm({ availabilityMode: next ? 'ALWAYS' : 'NONE' });
  const selectFamily = (nextFamily) =>
    patchForm({
      availabilityMode: composeMode(nextFamily, restrictTimes && familySupportsTime(nextFamily)),
    });
  const setRestrictTimes = (next) => patchForm({ availabilityMode: composeMode(family, next) });

  const saveTypeMutation = useMutation({
    mutationFn: ({ bookingTypeId, payload }) =>
      bookingTypeId
        ? bookingsApi.admin.updateType(bookingTypeId, payload)
        : bookingsApi.admin.createType(payload),
    onSuccess: () => {
      toast.success(
        isEdit
          ? tf('bookings.dashboard.typeUpdated', 'Booking type updated successfully.')
          : tf('bookings.dashboard.typeCreated', 'Booking type created successfully.')
      );
      queryClient.invalidateQueries({ queryKey: ['bookings', 'types'] });
      navigate('/dashboard/bookings/types');
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setTypeErrors(mapFieldErrors(normalized.details));
      toast.error(normalized.message);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!typeForm.name.trim()) {
      setTypeErrors((current) => ({
        ...current,
        name: tf('bookings.dashboard.nameRequired', 'A type name is required.'),
      }));
      toast.error(tf('bookings.dashboard.nameRequired', 'A type name is required.'));
      return;
    }
    saveTypeMutation.mutate({
      bookingTypeId: typeForm.id,
      payload: serializeTypeForm(typeForm),
    });
  };

  const breadcrumbs = [
    { label: t('shared.dashboard'), href: '/dashboard' },
    { label: tf('bookings.dashboard.typesPage', 'Booking types'), href: '/dashboard/bookings/types' },
    {
      label: isEdit
        ? tf('bookings.dashboard.editTypeTitle', 'Edit booking type')
        : tf('bookings.dashboard.createTypeTitle', 'Create booking type'),
    },
  ];

  const pageTitle = isEdit
    ? tf('bookings.dashboard.editTypeTitle', 'Edit booking type')
    : tf('bookings.dashboard.createTypeTitle', 'Create booking type');
  const pageSubtitle = tf(
    'bookings.dashboard.typeSubtitle',
    'Control public instructions, fields, and slot-generation rules from one place.'
  );

  const familyTitle = (value) => tf(`bookings.dashboard.families.${value}.title`, value);
  const familyDesc = (value) => tf(`bookings.dashboard.families.${value}.desc`, '');

  const restrictLabel = family === 'DATES'
    ? tf('bookings.dashboard.exactTimesToggle', 'Set exact times for each date')
    : tf('bookings.dashboard.timeWindowToggle', 'Limit to a daily time window');
  const restrictDesc = family === 'DATES'
    ? tf('bookings.dashboard.exactTimesToggleDesc', 'Add the precise times available on each chosen date.')
    : tf('bookings.dashboard.timeWindowToggleDesc', 'Generate slots between a start and end time using the duration and interval below.');

  if (isEdit && typesQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader title={pageTitle} subtitle={pageSubtitle} />
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isEdit && !typesQuery.isLoading && !selectedType) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader
          title={tf('bookings.dashboard.typeNotFoundTitle', 'Booking type not found')}
          subtitle={tf(
            'bookings.dashboard.typeNotFoundBody',
            'The requested booking type could not be loaded. It may have been removed.'
          )}
          actions={(
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/dashboard/bookings/types')}
            >
              {t('common.actions.back')}
            </Button>
          )}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={(
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/dashboard/bookings/types')}
          >
            {t('common.actions.back')}
          </Button>
        )}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── 1. Basic details ─────────────────────────────────────────── */}
        <Card>
          <CardHeader
            icon={Settings2}
            title={tf('bookings.dashboard.basicDetails', 'Basic details')}
            subtitle={tf(
              'bookings.dashboard.basicDetailsSubtitle',
              'The name and guidance visitors see when they pick this service.'
            )}
          />

          <Input
            label={tf('bookings.dashboard.typeName', 'Type name')}
            value={typeForm.name}
            onChange={(event) => {
              patchForm({ name: event.target.value });
              if (typeErrors.name) setTypeErrors((current) => ({ ...current, name: undefined }));
            }}
            error={typeErrors.name}
            required
            placeholder={tf('bookings.dashboard.typeNamePlaceholder', 'e.g. Confession, Meeting with the priest')}
          />

          <TextArea
            label={tf('bookings.dashboard.description', 'Short description')}
            value={typeForm.description}
            onChange={(event) => patchForm({ description: event.target.value })}
            className="min-h-[80px]"
            hint={tf('bookings.dashboard.descriptionHint', 'One line shown under the type name.')}
          />

          <TextArea
            label={tf('bookings.dashboard.instructions', 'Public instructions')}
            value={typeForm.instructions}
            onChange={(event) => patchForm({ instructions: event.target.value })}
            className="min-h-[120px]"
            hint={tf('bookings.dashboard.instructionsHint', 'Anything the visitor should read before booking.')}
            containerClassName="!mb-4"
          />

          <SwitchRow
            title={tf('bookings.dashboard.activeType', 'Active')}
            description={tf('bookings.dashboard.activeTypeDesc', 'Inactive types are hidden from the public booking page.')}
            checked={typeForm.isActive}
            onChange={(next) => patchForm({ isActive: next })}
          />
        </Card>

        {/* ── 2. Availability ──────────────────────────────────────────── */}
        <Card>
          <CardHeader
            icon={CalendarClock}
            title={tf('bookings.dashboard.availability', 'Availability')}
            subtitle={tf('bookings.dashboard.availabilitySubtitle', 'Choose when visitors are allowed to book this type.')}
          />

          <div className="space-y-4">
            <SwitchRow
              title={tf('bookings.dashboard.acceptBookings', 'Accept bookings')}
              description={tf('bookings.dashboard.acceptBookingsDesc', 'Turn off to keep this type without any bookable times.')}
              checked={bookable}
              onChange={setBookable}
            />

            {bookable ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {FAMILY_META.map((item) => (
                    <ModeCard
                      key={item.value}
                      icon={item.icon}
                      title={familyTitle(item.value)}
                      description={familyDesc(item.value)}
                      active={family === item.value}
                      onClick={() => selectFamily(item.value)}
                    />
                  ))}
                </div>

                {familySupportsTime(family) ? (
                  <SwitchRow
                    title={restrictLabel}
                    description={restrictDesc}
                    checked={restrictTimes}
                    onChange={setRestrictTimes}
                  />
                ) : null}

                {/* conditional configuration */}
                {(modeUsesDateRange(mode) || usesWindow || modeUsesSpecificDays(mode) || modeUsesSpecificDates(mode)) ? (
                  <div className="space-y-4 rounded-2xl border border-border bg-surface-alt/30 p-4">
                    {modeUsesDateRange(mode) ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label={tf('bookings.dashboard.rangeStart', 'Range start')}
                          type="date"
                          value={typeForm.availabilityConfig.dateRange.startDate}
                          onChange={(event) =>
                            patchConfig({
                              dateRange: { ...typeForm.availabilityConfig.dateRange, startDate: event.target.value },
                            })
                          }
                          containerClassName="!mb-0"
                        />
                        <Input
                          label={tf('bookings.dashboard.rangeEnd', 'Range end')}
                          type="date"
                          value={typeForm.availabilityConfig.dateRange.endDate}
                          onChange={(event) =>
                            patchConfig({
                              dateRange: { ...typeForm.availabilityConfig.dateRange, endDate: event.target.value },
                            })
                          }
                          containerClassName="!mb-0"
                        />
                      </div>
                    ) : null}

                    {usesWindow ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label={tf('bookings.dashboard.startTime', 'Default start time')}
                          type="time"
                          value={typeForm.availabilityConfig.timeRange.startTime}
                          onChange={(event) =>
                            patchConfig({
                              timeRange: { ...typeForm.availabilityConfig.timeRange, startTime: event.target.value },
                            })
                          }
                          containerClassName="!mb-0"
                        />
                        <Input
                          label={tf('bookings.dashboard.endTime', 'Default end time')}
                          type="time"
                          value={typeForm.availabilityConfig.timeRange.endTime}
                          onChange={(event) =>
                            patchConfig({
                              timeRange: { ...typeForm.availabilityConfig.timeRange, endTime: event.target.value },
                            })
                          }
                          containerClassName="!mb-0"
                        />
                      </div>
                    ) : null}

                    {modeUsesSpecificDays(mode) ? (
                      <div>
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
                                  patchConfig({
                                    specificDays: active
                                      ? typeForm.availabilityConfig.specificDays.filter((value) => value !== day.value)
                                      : [...typeForm.availabilityConfig.specificDays, day.value].sort(),
                                  })
                                }
                                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                  active ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-heading'
                                }`}
                              >
                                {tf(`bookings.dashboard.weekdays.${day.value}`, day.label)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {modeUsesSpecificDates(mode) ? (
                      <div className="space-y-3">
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
                              patchConfig({
                                specificDates: [
                                  ...typeForm.availabilityConfig.specificDates,
                                  { date: '', startTime: '', endTime: '', exactTimes: [] },
                                ],
                              })
                            }
                          >
                            {tf('bookings.dashboard.addDate', 'Add date')}
                          </Button>
                        </div>

                        {typeForm.availabilityConfig.specificDates.length === 0 ? (
                          <SectionNote>
                            {tf('bookings.dashboard.noDatesYet', 'Add at least one date visitors can book.')}
                          </SectionNote>
                        ) : null}

                        {typeForm.availabilityConfig.specificDates.map((entry, index) => (
                          <div
                            key={`specific-date-${index}`}
                            className="rounded-2xl border border-border bg-surface p-4"
                          >
                            <div className="flex items-end gap-3">
                              <Input
                                label={tf('bookings.dashboard.date', 'Date')}
                                type="date"
                                value={entry.date}
                                onChange={(event) => {
                                  const next = [...typeForm.availabilityConfig.specificDates];
                                  next[index] = { ...next[index], date: event.target.value };
                                  patchConfig({ specificDates: next });
                                }}
                                containerClassName="!mb-0 flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                icon={Trash2}
                                onClick={() =>
                                  patchConfig({
                                    specificDates: typeForm.availabilityConfig.specificDates.filter(
                                      (_, itemIndex) => itemIndex !== index
                                    ),
                                  })
                                }
                              >
                                {tf('bookings.dashboard.remove', 'Remove')}
                              </Button>
                            </div>

                            {modeUsesExactTimes(mode) ? (
                              <div className="mt-4">
                                <TimeChipsInput
                                  label={tf('bookings.dashboard.exactTimes', 'Exact times')}
                                  values={entry.exactTimes || []}
                                  onChange={(nextTimes) => {
                                    const next = [...typeForm.availabilityConfig.specificDates];
                                    next[index] = { ...next[index], exactTimes: nextTimes };
                                    patchConfig({ specificDates: next });
                                  }}
                                  tf={tf}
                                />
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <SectionNote>
                {tf(
                  'bookings.dashboard.notBookableNote',
                  'This type is saved but visitors cannot book it until you turn bookings on and pick when they are available.'
                )}
              </SectionNote>
            )}
          </div>
        </Card>

        {/* ── 3. Slot settings ─────────────────────────────────────────── */}
        {bookable ? (
          <Card>
            <CardHeader
              icon={SlidersHorizontal}
              title={tf('bookings.dashboard.slotSettings', 'Slot settings')}
              subtitle={tf('bookings.dashboard.slotSettingsSubtitle', 'Fine-tune how each bookable slot behaves.')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {usesWindow ? (
                <>
                  <NumberField
                    label={tf('bookings.dashboard.duration', 'Duration')}
                    hint={tf('bookings.dashboard.durationHint', 'Length of each appointment.')}
                    unit={tf('bookings.dashboard.unitMinutes', 'min')}
                    value={typeForm.durationMinutes}
                    onChange={(value) => patchForm({ durationMinutes: value })}
                    min={5}
                    max={1440}
                    error={typeErrors.durationMinutes}
                  />
                  <NumberField
                    label={tf('bookings.dashboard.interval', 'Slot interval')}
                    hint={tf('bookings.dashboard.intervalHint', 'Gap between slot start times.')}
                    unit={tf('bookings.dashboard.unitMinutes', 'min')}
                    value={typeForm.slotIntervalMinutes}
                    onChange={(value) => patchForm({ slotIntervalMinutes: value })}
                    min={5}
                    max={1440}
                    error={typeErrors.slotIntervalMinutes}
                  />
                </>
              ) : null}
              <NumberField
                label={tf('bookings.dashboard.capacity', 'Capacity')}
                hint={tf('bookings.dashboard.capacityHint', 'People who can book the same slot.')}
                unit={tf('bookings.dashboard.unitPerSlot', 'per slot')}
                value={typeForm.capacity}
                onChange={(value) => patchForm({ capacity: value })}
                min={1}
                max={100}
                error={typeErrors.capacity}
              />
              <NumberField
                label={tf('bookings.dashboard.horizon', 'Booking horizon')}
                hint={tf('bookings.dashboard.horizonHint', 'How far ahead visitors can book.')}
                unit={tf('bookings.dashboard.unitDays', 'days')}
                value={typeForm.bookingHorizonDays}
                onChange={(value) => patchForm({ bookingHorizonDays: value })}
                min={1}
                max={365}
                error={typeErrors.bookingHorizonDays}
              />
            </div>
          </Card>
        ) : null}

        {/* ── 4. Custom fields ─────────────────────────────────────────── */}
        <Card>
          <CardHeader
            icon={ListPlus}
            title={tf('bookings.dashboard.dynamicFields', 'Custom fields')}
            subtitle={tf(
              'bookings.dashboard.dynamicFieldsSubtitle',
              'Extra questions the visitor answers when booking. Keys are generated automatically.'
            )}
            action={(
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() =>
                  patchForm({
                    dynamicFields: [
                      ...typeForm.dynamicFields,
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
                  })
                }
              >
                {tf('bookings.dashboard.addField', 'Add field')}
              </Button>
            )}
          />

          {typeForm.dynamicFields.length === 0 ? (
            <SectionNote>
              {tf('bookings.dashboard.noFieldsYet', 'No custom fields yet. Add one to collect extra details from the visitor.')}
            </SectionNote>
          ) : (
            <div className="space-y-4">
              {typeForm.dynamicFields.map((field, index) => {
                const optionValues = buildOptionValues(field.options);
                return (
                  <div key={`field-${index}`} className="rounded-2xl border border-border bg-surface-alt/30 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Badge variant="neutral" size="sm" className="font-mono">
                        <Hash className="h-3 w-3" />
                        {fieldKeys[index]}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        icon={Trash2}
                        onClick={() =>
                          patchForm({
                            dynamicFields: typeForm.dynamicFields.filter((_, itemIndex) => itemIndex !== index),
                          })
                        }
                      >
                        {tf('bookings.dashboard.removeField', 'Remove')}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label={tf('bookings.dashboard.fieldLabel', 'Field label')}
                        value={field.label}
                        onChange={(event) => {
                          const next = [...typeForm.dynamicFields];
                          next[index] = { ...next[index], label: event.target.value };
                          patchForm({ dynamicFields: next });
                        }}
                        placeholder={tf('bookings.dashboard.fieldLabelPlaceholder', 'e.g. Full name')}
                        containerClassName="!mb-0"
                      />
                      <Select
                        label={tf('bookings.dashboard.fieldType', 'Field type')}
                        value={field.type}
                        onChange={(event) => {
                          const next = [...typeForm.dynamicFields];
                          next[index] = { ...next[index], type: event.target.value };
                          if (event.target.value !== 'select') next[index].options = [];
                          patchForm({ dynamicFields: next });
                        }}
                        options={FIELD_TYPES.map((option) => ({
                          value: option.value,
                          label: tf(`bookings.dashboard.fieldTypes.${option.value}`, option.label),
                        }))}
                        containerClassName="mb-0"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label={tf('bookings.dashboard.placeholder', 'Placeholder')}
                        value={field.placeholder}
                        onChange={(event) => {
                          const next = [...typeForm.dynamicFields];
                          next[index] = { ...next[index], placeholder: event.target.value };
                          patchForm({ dynamicFields: next });
                        }}
                        containerClassName="!mb-0"
                      />
                      <Input
                        label={tf('bookings.dashboard.helpText', 'Help text')}
                        value={field.helpText}
                        onChange={(event) => {
                          const next = [...typeForm.dynamicFields];
                          next[index] = { ...next[index], helpText: event.target.value };
                          patchForm({ dynamicFields: next });
                        }}
                        containerClassName="!mb-0"
                      />
                    </div>

                    {field.type === 'select' ? (
                      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-heading">
                            {tf('bookings.dashboard.selectOptions', 'Select options')}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            icon={Plus}
                            onClick={() => {
                              const next = [...typeForm.dynamicFields];
                              next[index] = {
                                ...next[index],
                                options: [...next[index].options, { label: '', value: '' }],
                              };
                              patchForm({ dynamicFields: next });
                            }}
                          >
                            {tf('bookings.dashboard.addOption', 'Add option')}
                          </Button>
                        </div>

                        {field.options.length === 0 ? (
                          <SectionNote>
                            {tf('bookings.dashboard.noOptionsYet', 'Add the choices visitors can pick from.')}
                          </SectionNote>
                        ) : (
                          <div className="space-y-2.5">
                            {field.options.map((option, optionIndex) => (
                              <div
                                key={`option-${index}-${optionIndex}`}
                                className="flex items-end gap-2"
                              >
                                <Input
                                  label={optionIndex === 0 ? tf('bookings.dashboard.optionLabel', 'Option') : undefined}
                                  value={option.label}
                                  onChange={(event) => {
                                    const next = [...typeForm.dynamicFields];
                                    const nextOptions = [...next[index].options];
                                    nextOptions[optionIndex] = { ...nextOptions[optionIndex], label: event.target.value };
                                    next[index] = { ...next[index], options: nextOptions };
                                    patchForm({ dynamicFields: next });
                                  }}
                                  containerClassName="!mb-0 flex-1"
                                />
                                <span className="hidden shrink-0 pb-2.5 font-mono text-[11px] text-muted sm:inline">
                                  {optionValues[optionIndex]}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={X}
                                  onClick={() => {
                                    const next = [...typeForm.dynamicFields];
                                    next[index] = {
                                      ...next[index],
                                      options: next[index].options.filter((_, i) => i !== optionIndex),
                                    };
                                    patchForm({ dynamicFields: next });
                                  }}
                                  aria-label={tf('bookings.dashboard.remove', 'Remove')}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="mt-4 border-t border-border/60 pt-3">
                      <Switch
                        checked={field.required}
                        onChange={(nextValue) => {
                          const next = [...typeForm.dynamicFields];
                          next[index] = { ...next[index], required: nextValue };
                          patchForm({ dynamicFields: next });
                        }}
                        label={tf('bookings.dashboard.requiredField', 'Required field')}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── sticky actions ───────────────────────────────────────────── */}
        <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-card backdrop-blur sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => navigate('/dashboard/bookings/types')}
            className="sm:w-auto"
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            icon={Save}
            fullWidth
            loading={saveTypeMutation.isPending}
            className="sm:w-auto"
          >
            {isEdit
              ? tf('bookings.dashboard.saveType', 'Save changes')
              : tf('bookings.dashboard.createTypeAction', 'Create type')}
          </Button>
        </div>
      </form>
    </div>
  );
}
