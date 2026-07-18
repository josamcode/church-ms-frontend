import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Save,
  Church,
  Sunrise,
  CalendarClock,
  UserSquare2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { divineLiturgiesApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import MultiSelectChips from '../../../components/ui/MultiSelectChips';
import PageHeader from '../../../components/ui/PageHeader';
import SideTabs from '../../../components/ui/SideTabs';
import StatCard from '../../../components/ui/StatCard';
import Table, { RowActions } from '../../../components/ui/Table';
import DataCard, { CardAvatar } from '../../../components/ui/DataCard';
import { useI18n } from '../../../i18n/i18n';
import { getDayLabel, getDayOptions } from '../meetings/meetingsForm.utils';

const DIVINE_SERVICE_TYPE = 'DIVINE_LITURGY';
const VESPERS_SERVICE_TYPE = 'VESPERS';

function toTodayDateInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function isEndTimeAfterStart(startTime, endTime) {
  if (!endTime) return true;
  const parse = (value) => {
    const [hours, minutes] = String(value || '').split(':').map((entry) => parseInt(entry, 10));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };
  const startMinutes = parse(startTime);
  const endMinutes = parse(endTime);
  if (startMinutes == null || endMinutes == null) return false;
  return endMinutes > startMinutes;
}

function emptyRecurringForm(serviceType) {
  return {
    serviceType,
    dayOfWeek: 'Sunday',
    startTime: '07:00',
    endTime: '',
    name: '',
    priestUserIds: [],
  };
}

function emptyExceptionForm() {
  return {
    date: toTodayDateInput(),
    startTime: '07:00',
    endTime: '',
    name: '',
    priestUserIds: [],
  };
}

function toRecurringPayload(form, includePriests) {
  return {
    serviceType: form.serviceType,
    dayOfWeek: form.dayOfWeek,
    startTime: form.startTime,
    ...(form.endTime ? { endTime: form.endTime } : {}),
    ...(String(form.name || '').trim() && { name: String(form.name || '').trim() }),
    ...(includePriests ? { priestUserIds: form.priestUserIds || [] } : {}),
  };
}

function toExceptionPayload(form) {
  return {
    date: form.date,
    startTime: form.startTime,
    ...(form.endTime ? { endTime: form.endTime } : {}),
    ...(String(form.name || '').trim() && { name: String(form.name || '').trim() }),
    priestUserIds: form.priestUserIds || [],
  };
}

function priestsToLabel(priests = []) {
  return (priests || [])
    .map((entry) => entry.fullName || entry.phonePrimary || '---')
    .join(', ');
}

function formatTime12(value, language) {
  const raw = String(value || '').trim();
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return raw;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  try {
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes));
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(date);
  } catch (_error) {
    const hour12 = hours % 12 || 12;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
  }
}

export default function DivineLiturgiesPage() {
  const { t, language, isRTL } = useI18n();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canView = hasPermission('DIVINE_LITURGIES_VIEW');
  const canManage = hasPermission('DIVINE_LITURGIES_MANAGE');
  const canManageAttendance =
    hasPermission('DIVINE_LITURGIES_ATTENDANCE_MANAGE') ||
    hasPermission('DIVINE_LITURGIES_ATTENDANCE_MANAGE_ASSIGNED_USERS') ||
    canManage;

  const [divineEditId, setDivineEditId] = useState(null);
  const [divineForm, setDivineForm] = useState(() => emptyRecurringForm(DIVINE_SERVICE_TYPE));
  const [showDivineForm, setShowDivineForm] = useState(false);

  const [vespersEditId, setVespersEditId] = useState(null);
  const [vespersForm, setVespersForm] = useState(() => emptyRecurringForm(VESPERS_SERVICE_TYPE));
  const [showVespersForm, setShowVespersForm] = useState(false);

  const [exceptionEditId, setExceptionEditId] = useState(null);
  const [exceptionForm, setExceptionForm] = useState(() => emptyExceptionForm());
  const [showExceptionForm, setShowExceptionForm] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ['divine-liturgies', 'overview'],
    queryFn: async () => {
      const { data } = await divineLiturgiesApi.getOverview();
      return data?.data || null;
    },
    staleTime: 30000,
  });

  const recurringMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id
        ? divineLiturgiesApi.updateRecurring(id, payload)
        : divineLiturgiesApi.createRecurring(payload),
    onSuccess: (_res, variables) => {
      toast.success(
        variables.id
          ? t('divineLiturgies.messages.recurringUpdated')
          : t('divineLiturgies.messages.recurringCreated')
      );
      queryClient.invalidateQueries({ queryKey: ['divine-liturgies', 'overview'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id) => divineLiturgiesApi.deleteRecurring(id),
    onSuccess: () => {
      toast.success(t('divineLiturgies.messages.recurringDeleted'));
      queryClient.invalidateQueries({ queryKey: ['divine-liturgies', 'overview'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const exceptionMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id
        ? divineLiturgiesApi.updateException(id, payload)
        : divineLiturgiesApi.createException(payload),
    onSuccess: (_res, variables) => {
      toast.success(
        variables.id
          ? t('divineLiturgies.messages.exceptionUpdated')
          : t('divineLiturgies.messages.exceptionCreated')
      );
      queryClient.invalidateQueries({ queryKey: ['divine-liturgies', 'overview'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteExceptionMutation = useMutation({
    mutationFn: (id) => divineLiturgiesApi.deleteException(id),
    onSuccess: () => {
      toast.success(t('divineLiturgies.messages.exceptionDeleted'));
      queryClient.invalidateQueries({ queryKey: ['divine-liturgies', 'overview'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const churchPriests = useMemo(
    () => (Array.isArray(overviewQuery.data?.churchPriests) ? overviewQuery.data.churchPriests : []),
    [overviewQuery.data]
  );
  const recurringDivine = useMemo(
    () =>
      Array.isArray(overviewQuery.data?.recurringDivineLiturgies)
        ? overviewQuery.data.recurringDivineLiturgies
        : [],
    [overviewQuery.data]
  );
  const recurringVespers = useMemo(
    () =>
      Array.isArray(overviewQuery.data?.recurringVespers) ? overviewQuery.data.recurringVespers : [],
    [overviewQuery.data]
  );
  const exceptionalCases = useMemo(
    () =>
      Array.isArray(overviewQuery.data?.exceptionalDivineLiturgies)
        ? overviewQuery.data.exceptionalDivineLiturgies
        : [],
    [overviewQuery.data]
  );

  const dayOptions = getDayOptions(t);
  const churchPriestOptions = useMemo(
    () =>
      churchPriests
        .map((entry) => entry.user)
        .filter(Boolean)
        .map((user) => ({ value: user.id, label: user.fullName || user.phonePrimary || user.id })),
    [churchPriests]
  );

  const validateRecurringForm = (form) => {
    if (!form.dayOfWeek) {
      toast.error(t('divineLiturgies.errors.dayRequired'));
      return false;
    }
    if (!form.startTime) {
      toast.error(t('divineLiturgies.errors.startTimeRequired'));
      return false;
    }
    if (!isEndTimeAfterStart(form.startTime, form.endTime)) {
      toast.error(t('divineLiturgies.errors.endTimeInvalid'));
      return false;
    }
    return true;
  };

  const validateExceptionForm = (form) => {
    if (!form.date) {
      toast.error(t('divineLiturgies.errors.dateRequired'));
      return false;
    }
    if (!form.startTime) {
      toast.error(t('divineLiturgies.errors.startTimeRequired'));
      return false;
    }
    if (!isEndTimeAfterStart(form.startTime, form.endTime)) {
      toast.error(t('divineLiturgies.errors.endTimeInvalid'));
      return false;
    }
    return true;
  };

  const handleSubmitDivine = async (event) => {
    event.preventDefault();
    if (!validateRecurringForm(divineForm)) return;

    const payload = toRecurringPayload(divineForm, true);
    await recurringMutation.mutateAsync({ id: divineEditId, payload });
    setDivineEditId(null);
    setDivineForm(emptyRecurringForm(DIVINE_SERVICE_TYPE));
    setShowDivineForm(false);
  };

  const handleSubmitVespers = async (event) => {
    event.preventDefault();
    if (!validateRecurringForm(vespersForm)) return;

    const payload = toRecurringPayload(vespersForm, false);
    await recurringMutation.mutateAsync({ id: vespersEditId, payload });
    setVespersEditId(null);
    setVespersForm(emptyRecurringForm(VESPERS_SERVICE_TYPE));
    setShowVespersForm(false);
  };

  const handleSubmitException = async (event) => {
    event.preventDefault();
    if (!validateExceptionForm(exceptionForm)) return;

    const payload = toExceptionPayload(exceptionForm);
    await exceptionMutation.mutateAsync({ id: exceptionEditId, payload });
    setExceptionEditId(null);
    setExceptionForm(emptyExceptionForm());
    setShowExceptionForm(false);
  };

  const getRecurringDisplayName = (row) => {
    const manualName = String(row?.name || '').trim();
    if (manualName) return manualName;

    const dayLabel = getDayLabel(row?.dayOfWeek, t) || row?.dayOfWeek || '';

    if (language === 'ar') {
      if (row?.serviceType === DIVINE_SERVICE_TYPE) {
        return `قداس يوم ${dayLabel}`;
      }
      if (row?.serviceType === VESPERS_SERVICE_TYPE) {
        return `عشية القداس يوم ${dayLabel}`;
      }
    }

    if (row?.serviceType === DIVINE_SERVICE_TYPE) {
      return `${dayLabel} Divine Liturgy`;
    }
    if (row?.serviceType === VESPERS_SERVICE_TYPE) {
      return `${dayLabel} Vespers of the Divine Liturgy`;
    }

    return row?.displayName || '';
  };

  const getExceptionDisplayName = (row) => {
    const manualName = String(row?.name || '').trim();
    if (manualName) return manualName;

    const dateLabel = row?.date || '';
    if (!dateLabel) return row?.displayName || '';

    if (language === 'ar') {
      return `قداس استثنائي (${dateLabel})`;
    }

    return `Exceptional Divine Liturgy (${dateLabel})`;
  };

  /* ── edit/delete handlers shared by table columns and card views ── */
  const handleEditDivine = (row) => {
    setDivineEditId(row.id);
    setDivineForm({
      serviceType: DIVINE_SERVICE_TYPE,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime || '',
      endTime: row.endTime || '',
      name: row.name || '',
      priestUserIds: (row.priests || []).map((entry) => entry.id).filter(Boolean),
    });
    setShowDivineForm(true);
  };

  const handleEditVespers = (row) => {
    setVespersEditId(row.id);
    setVespersForm({
      serviceType: VESPERS_SERVICE_TYPE,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime || '',
      endTime: row.endTime || '',
      name: row.name || '',
      priestUserIds: [],
    });
    setShowVespersForm(true);
  };

  const handleDeleteRecurring = (id) => {
    if (!window.confirm(t('divineLiturgies.confirmations.deleteRecurring'))) return;
    deleteRecurringMutation.mutate(id);
  };

  const handleEditException = (row) => {
    setExceptionEditId(row.id);
    setExceptionForm({
      date: row.date,
      startTime: row.startTime || '',
      endTime: row.endTime || '',
      name: row.name || '',
      priestUserIds: (row.priests || []).map((entry) => entry.id).filter(Boolean),
    });
    setShowExceptionForm(true);
  };

  const handleDeleteException = (id) => {
    if (!window.confirm(t('divineLiturgies.confirmations.deleteException'))) return;
    deleteExceptionMutation.mutate(id);
  };

  const recurringColumns = (includePriests, onEdit, onDelete, attendanceEntryType = 'recurring') => [
    {
      key: 'displayName',
      label: t('divineLiturgies.table.displayName'),
      render: (row) => <span className="text-sm font-semibold text-heading">{getRecurringDisplayName(row)}</span>,
    },
    {
      key: 'dayOfWeek',
      label: t('divineLiturgies.table.dayOfWeek'),
      render: (row) => <Badgeify>{getDayLabel(row.dayOfWeek, t)}</Badgeify>,
    },
    {
      key: 'startTime',
      label: t('divineLiturgies.table.startTime'),
      render: (row) => (
        <span className="text-sm text-heading">{formatTime12(row.startTime, language)}</span>
      ),
    },
    {
      key: 'endTime',
      label: t('divineLiturgies.table.endTime'),
      render: (row) => (
        <span className="text-sm text-heading">
          {row.endTime ? formatTime12(row.endTime, language) : t('common.placeholder.empty')}
        </span>
      ),
    },
    ...(includePriests
      ? [
        {
          key: 'priests',
          label: t('divineLiturgies.table.priests'),
          render: (row) => (
            <span className="text-sm text-heading">
              {row.priests?.length ? priestsToLabel(row.priests) : t('common.placeholder.empty')}
            </span>
          ),
        },
      ]
      : []),
    ...(canManageAttendance
      ? [
        {
          key: 'attendance',
          label: t('divineLiturgies.table.attendance'),
          render: (row) => (
            <Link to={`/dashboard/divine-liturgies/attendance/${attendanceEntryType}/${row.id}`}>
              <Button type="button" variant="outline" size="sm">
                {t('divineLiturgies.actions.openAttendanceCheckIn')}
              </Button>
            </Link>
          ),
        },
      ]
      : []),
    ...(canManage
      ? [
        {
          key: 'actions',
          label: '',
          cellClassName: 'w-10',
          render: (row) => (
            <RowActions
              actions={[
                { label: t('common.actions.edit'), onClick: () => onEdit(row) },
                { divider: true },
                { label: t('common.actions.delete'), danger: true, onClick: () => onDelete(row.id) },
              ]}
            />
          ),
        },
      ]
      : []),
  ];

  const exceptionColumns = [
    {
      key: 'displayName',
      label: t('divineLiturgies.table.displayName'),
      render: (row) => (
        <span className="text-sm font-semibold text-heading">{getExceptionDisplayName(row)}</span>
      ),
    },
    {
      key: 'date',
      label: t('divineLiturgies.table.date'),
      render: (row) => <Badgeify>{row.date}</Badgeify>,
    },
    {
      key: 'startTime',
      label: t('divineLiturgies.table.startTime'),
      render: (row) => (
        <span className="text-sm text-heading">{formatTime12(row.startTime, language)}</span>
      ),
    },
    {
      key: 'endTime',
      label: t('divineLiturgies.table.endTime'),
      render: (row) => (
        <span className="text-sm text-heading">
          {row.endTime ? formatTime12(row.endTime, language) : t('common.placeholder.empty')}
        </span>
      ),
    },
    {
      key: 'priests',
      label: t('divineLiturgies.table.priests'),
      render: (row) => (
        <span className="text-sm text-heading">
          {row.priests?.length ? priestsToLabel(row.priests) : t('common.placeholder.empty')}
        </span>
      ),
    },
    ...(canManageAttendance
      ? [
        {
          key: 'attendance',
          label: t('divineLiturgies.table.attendance'),
          render: (row) => (
            <Link to={`/dashboard/divine-liturgies/attendance/exception/${row.id}`}>
              <Button type="button" variant="outline" size="sm">
                {t('divineLiturgies.actions.openAttendanceCheckIn')}
              </Button>
            </Link>
          ),
        },
      ]
      : []),
    ...(canManage
      ? [
        {
          key: 'actions',
          label: '',
          cellClassName: 'w-10',
          render: (row) => (
            <RowActions
              actions={[
                { label: t('common.actions.edit'), onClick: () => handleEditException(row) },
                { divider: true },
                { label: t('common.actions.delete'), danger: true, onClick: () => handleDeleteException(row.id) },
              ]}
            />
          ),
        },
      ]
      : []),
  ];

  /* ── shared card composition for a scheduled service (recurring or exception).
        Divine liturgies lead with a church glyph, vespers with a sunrise. ── */
  const renderServiceCard = ({
    row,
    icon,
    tone,
    accent,
    badgeLabel,
    priests,
    attendanceHref,
    onEdit,
    onDelete,
    title,
  }) => (
    <DataCard
      accent={accent}
      leading={<CardAvatar icon={icon} tone={tone} />}
      title={title}
      badge={<Badgeify>{badgeLabel}</Badgeify>}
      subtitle={
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5" />
          {formatTime12(row.startTime, language)}
          {row.endTime ? ` – ${formatTime12(row.endTime, language)}` : ''}
        </span>
      }
      meta={
        priests?.length ? (
          <span className="inline-flex items-center gap-1">
            <UserSquare2 className="h-3.5 w-3.5" />
            {priestsToLabel(priests)}
          </span>
        ) : null
      }
      footer={
        canManageAttendance ? (
          <Link to={attendanceHref} className="block">
            <Button type="button" variant="outline" size="sm" fullWidth>
              {t('divineLiturgies.actions.openAttendanceCheckIn')}
            </Button>
          </Link>
        ) : null
      }
      actions={
        canManage ? (
          <RowActions
            actions={[
              { label: t('common.actions.edit'), onClick: () => onEdit(row) },
              { divider: true },
              { label: t('common.actions.delete'), danger: true, onClick: () => onDelete(row.id) },
            ]}
          />
        ) : null
      }
    />
  );

  const renderRecurringCard = (includePriests, onEdit, onDelete, attendanceEntryType = 'recurring') => (row) =>
    renderServiceCard({
      row,
      icon: includePriests ? Church : Sunrise,
      tone: includePriests ? 'primary' : 'gold',
      accent: includePriests ? 'primary' : 'gold',
      badgeLabel: getDayLabel(row.dayOfWeek, t),
      priests: includePriests ? row.priests : null,
      attendanceHref: `/dashboard/divine-liturgies/attendance/${attendanceEntryType}/${row.id}`,
      onEdit,
      onDelete,
      title: getRecurringDisplayName(row),
    });

  const renderExceptionCard = (row) =>
    renderServiceCard({
      row,
      icon: Church,
      tone: 'info',
      accent: 'info',
      badgeLabel: row.date,
      priests: row.priests,
      attendanceHref: `/dashboard/divine-liturgies/attendance/exception/${row.id}`,
      onEdit: handleEditException,
      onDelete: handleDeleteException,
      title: getExceptionDisplayName(row),
    });

  const recurringLoading = recurringMutation.isPending || deleteRecurringMutation.isPending;
  const exceptionLoading = exceptionMutation.isPending || deleteExceptionMutation.isPending;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('divineLiturgies.page') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('shared.dashboard')}
        title={t('divineLiturgies.title')}
        subtitle={t('divineLiturgies.subtitle')}
        actions={(
          canView ? (
            <Link to="/dashboard/divine-liturgies/priests">
              <Button variant="outline" icon={UserSquare2}>{t('divineLiturgies.actions.openChurchPriests')}</Button>
            </Link>
          ) : null
        )}
      />

      {/* ══ KPI STRIP ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Church}
          label={t('divineLiturgies.sections.recurringDivine')}
          value={recurringDivine.length}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={Sunrise}
          label={t('divineLiturgies.sections.recurringVespers')}
          value={recurringVespers.length}
          tone="gold"
          isRTL={isRTL}
        />
        <StatCard
          icon={CalendarClock}
          label={t('divineLiturgies.sections.exceptions')}
          value={exceptionalCases.length}
          tone={exceptionalCases.length > 0 ? 'warning' : 'default'}
          isRTL={isRTL}
        />
        <StatCard
          icon={UserSquare2}
          label={t('divineLiturgies.sections.priests')}
          value={churchPriests.length}
          tone="info"
          isRTL={isRTL}
        />
      </div>

      {/* ══ ERROR ═════════════════════════════════════════════════════════ */}
      {overviewQuery.isError && (
        <Card tone="muted" padding="lg">
          <EmptyState
            icon={AlertTriangle}
            title={t('divineLiturgies.title')}
            description={normalizeApiError(overviewQuery.error).message}
            action={(
              <Button variant="outline" icon={RotateCcw} onClick={() => overviewQuery.refetch()}>
                {t('common.actions.loadMore')}
              </Button>
            )}
          />
        </Card>
      )}

      {/* ══ AREAS — TABBED so only one shows at a time ════════════════════ */}
      <SideTabs
        ariaLabel={t('divineLiturgies.title')}
        tabs={[
          {
            id: 'divine',
            label: t('divineLiturgies.sections.recurringDivine'),
            icon: Church,
            content: (
      <section className="space-y-4">
        {canManage && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-alt text-primary">
                <Church className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-heading">
                {t('divineLiturgies.sections.recurringDivine')}
              </h2>
            </div>
            <Button
              type="button"
              icon={showDivineForm || divineEditId ? Save : Plus}
              variant={showDivineForm || divineEditId ? 'outline' : 'primary'}
              onClick={() => {
                if (showDivineForm || divineEditId) {
                  setDivineEditId(null);
                  setDivineForm(emptyRecurringForm(DIVINE_SERVICE_TYPE));
                  setShowDivineForm(false);
                } else {
                  setShowDivineForm(true);
                }
              }}
            >
              {showDivineForm || divineEditId
                ? t('divineLiturgies.actions.cancelEdit')
                : t('divineLiturgies.actions.createRecurring')}
            </Button>
          </div>
        )}
        {canManage && (
          <div className={showDivineForm || divineEditId ? '' : 'hidden'}>
          <Card padding="lg" className="space-y-4">
            <CardHeader icon={Church} title={t('divineLiturgies.sections.recurringDivine')} />
            <form onSubmit={handleSubmitDivine}>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <Input
                  label={t('divineLiturgies.fields.name')}
                  value={divineForm.name}
                  onChange={(event) =>
                    setDivineForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder={t('divineLiturgies.placeholders.divineName')}
                  containerClassName="!mb-0"
                />
                <SelectDay
                  label={t('divineLiturgies.fields.dayOfWeek')}
                  value={divineForm.dayOfWeek}
                  options={dayOptions}
                  onChange={(value) => setDivineForm((prev) => ({ ...prev, dayOfWeek: value }))}
                />
                <Input
                  label={t('divineLiturgies.fields.startTime')}
                  type="time"
                  value={divineForm.startTime}
                  onChange={(event) =>
                    setDivineForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <Input
                  label={t('divineLiturgies.fields.endTime')}
                  type="time"
                  value={divineForm.endTime}
                  onChange={(event) =>
                    setDivineForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <MultiSelectChips
                  label={t('divineLiturgies.fields.priests')}
                  options={churchPriestOptions}
                  values={divineForm.priestUserIds}
                  onChange={(values) =>
                    setDivineForm((prev) => ({ ...prev, priestUserIds: values }))
                  }
                  placeholder={t('common.search.placeholder')}
                  containerClassName="!mb-0"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  icon={divineEditId ? Save : Plus}
                  loading={recurringLoading}
                >
                  {divineEditId
                    ? t('divineLiturgies.actions.updateRecurring')
                    : t('divineLiturgies.actions.createRecurring')}
                </Button>
                {divineEditId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setDivineEditId(null);
                      setDivineForm(emptyRecurringForm(DIVINE_SERVICE_TYPE));
                    }}
                  >
                    {t('divineLiturgies.actions.cancelEdit')}
                  </Button>
                )}
              </div>
            </form>
          </Card>
          </div>
        )}

        <Table
          columns={recurringColumns(true, handleEditDivine, handleDeleteRecurring)}
          renderCard={renderRecurringCard(true, handleEditDivine, handleDeleteRecurring)}
          data={recurringDivine}
          loading={overviewQuery.isLoading}
          emptyTitle={t('divineLiturgies.empty.recurringDivine')}
          emptyDescription={t('common.placeholder.empty')}
          emptyIcon={Church}
        />
      </section>
            ),
          },
          {
            id: 'vespers',
            label: t('divineLiturgies.sections.recurringVespers'),
            icon: Sunrise,
            content: (
      /* ══ RECURRING VESPERS ═══════════════════════════════════════════ */
      <section className="space-y-4">
        {canManage && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-alt text-primary">
                <Sunrise className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-heading">
                {t('divineLiturgies.sections.recurringVespers')}
              </h2>
            </div>
            <Button
              type="button"
              icon={showVespersForm || vespersEditId ? Save : Plus}
              variant={showVespersForm || vespersEditId ? 'outline' : 'primary'}
              onClick={() => {
                if (showVespersForm || vespersEditId) {
                  setVespersEditId(null);
                  setVespersForm(emptyRecurringForm(VESPERS_SERVICE_TYPE));
                  setShowVespersForm(false);
                } else {
                  setShowVespersForm(true);
                }
              }}
            >
              {showVespersForm || vespersEditId
                ? t('divineLiturgies.actions.cancelEdit')
                : t('divineLiturgies.actions.createRecurring')}
            </Button>
          </div>
        )}
        {canManage && (
          <div className={showVespersForm || vespersEditId ? '' : 'hidden'}>
          <Card padding="lg" className="space-y-4">
            <CardHeader icon={Sunrise} title={t('divineLiturgies.sections.recurringVespers')} />
            <form onSubmit={handleSubmitVespers}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Input
                  label={t('divineLiturgies.fields.name')}
                  value={vespersForm.name}
                  onChange={(event) =>
                    setVespersForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder={t('divineLiturgies.placeholders.vespersName')}
                  containerClassName="!mb-0"
                />
                <SelectDay
                  label={t('divineLiturgies.fields.dayOfWeek')}
                  value={vespersForm.dayOfWeek}
                  options={dayOptions}
                  onChange={(value) => setVespersForm((prev) => ({ ...prev, dayOfWeek: value }))}
                />
                <Input
                  label={t('divineLiturgies.fields.startTime')}
                  type="time"
                  value={vespersForm.startTime}
                  onChange={(event) =>
                    setVespersForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <Input
                  label={t('divineLiturgies.fields.endTime')}
                  type="time"
                  value={vespersForm.endTime}
                  onChange={(event) =>
                    setVespersForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  icon={vespersEditId ? Save : Plus}
                  loading={recurringLoading}
                >
                  {vespersEditId
                    ? t('divineLiturgies.actions.updateRecurring')
                    : t('divineLiturgies.actions.createRecurring')}
                </Button>
                {vespersEditId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setVespersEditId(null);
                      setVespersForm(emptyRecurringForm(VESPERS_SERVICE_TYPE));
                    }}
                  >
                    {t('divineLiturgies.actions.cancelEdit')}
                  </Button>
                )}
              </div>
            </form>
          </Card>
          </div>
        )}

        {recurringVespers.length > 0 && (
          <Table
            columns={recurringColumns(false, handleEditVespers, handleDeleteRecurring)}
            renderCard={renderRecurringCard(false, handleEditVespers, handleDeleteRecurring)}
            data={recurringVespers}
            loading={overviewQuery.isLoading}
            emptyTitle={t('divineLiturgies.empty.recurringVespers')}
            emptyDescription={t('common.placeholder.empty')}
            emptyIcon={Sunrise}
          />
        )}
      </section>
            ),
          },
          {
            id: 'exceptions',
            label: t('divineLiturgies.sections.exceptions'),
            icon: CalendarClock,
            content: (
      /* ══ EXCEPTIONAL CASES ═══════════════════════════════════════════ */
      <section className="space-y-4">
        {canManage && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-alt text-primary">
                <CalendarClock className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-heading">
                {t('divineLiturgies.sections.exceptions')}
              </h2>
            </div>
            <Button
              type="button"
              icon={showExceptionForm || exceptionEditId ? Save : Plus}
              variant={showExceptionForm || exceptionEditId ? 'outline' : 'primary'}
              onClick={() => {
                if (showExceptionForm || exceptionEditId) {
                  setExceptionEditId(null);
                  setExceptionForm(emptyExceptionForm());
                  setShowExceptionForm(false);
                } else {
                  setShowExceptionForm(true);
                }
              }}
            >
              {showExceptionForm || exceptionEditId
                ? t('divineLiturgies.actions.cancelEdit')
                : t('divineLiturgies.actions.createException')}
            </Button>
          </div>
        )}
        {canManage && (
          <div className={showExceptionForm || exceptionEditId ? '' : 'hidden'}>
          <Card padding="lg" className="space-y-4">
            <CardHeader icon={CalendarClock} title={t('divineLiturgies.sections.exceptions')} />
            <form onSubmit={handleSubmitException}>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <Input
                  label={t('divineLiturgies.fields.name')}
                  value={exceptionForm.name}
                  onChange={(event) =>
                    setExceptionForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder={t('divineLiturgies.placeholders.exceptionName')}
                  containerClassName="!mb-0"
                />
                <Input
                  label={t('divineLiturgies.fields.date')}
                  type="date"
                  value={exceptionForm.date}
                  onChange={(event) =>
                    setExceptionForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <Input
                  label={t('divineLiturgies.fields.startTime')}
                  type="time"
                  value={exceptionForm.startTime}
                  onChange={(event) =>
                    setExceptionForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <Input
                  label={t('divineLiturgies.fields.endTime')}
                  type="time"
                  value={exceptionForm.endTime}
                  onChange={(event) =>
                    setExceptionForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <MultiSelectChips
                  label={t('divineLiturgies.fields.priests')}
                  options={churchPriestOptions}
                  values={exceptionForm.priestUserIds}
                  onChange={(values) =>
                    setExceptionForm((prev) => ({ ...prev, priestUserIds: values }))
                  }
                  placeholder={t('common.search.placeholder')}
                  containerClassName="!mb-0"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  icon={exceptionEditId ? Save : Plus}
                  loading={exceptionLoading}
                >
                  {exceptionEditId
                    ? t('divineLiturgies.actions.updateException')
                    : t('divineLiturgies.actions.createException')}
                </Button>
                {exceptionEditId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setExceptionEditId(null);
                      setExceptionForm(emptyExceptionForm());
                    }}
                  >
                    {t('divineLiturgies.actions.cancelEdit')}
                  </Button>
                )}
              </div>
            </form>
          </Card>
          </div>
        )}

        {exceptionalCases.length > 0 && (
          <Table
            columns={exceptionColumns}
            renderCard={renderExceptionCard}
            data={exceptionalCases}
            loading={overviewQuery.isLoading}
            emptyTitle={t('divineLiturgies.empty.exceptions')}
            emptyDescription={t('common.placeholder.empty')}
            emptyIcon={CalendarClock}
          />
        )}
      </section>
            ),
          },
        ]}
      />
    </div>
  );
}

function Badgeify({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-surface-alt/70 px-2.5 py-0.5 text-xs font-medium text-base">
      {children}
    </span>
  );
}

function SelectDay({ label, value, options, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-base">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-base w-full"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
