import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Plus, ListChecks } from 'lucide-react';
import { confessionsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import TextArea from '../../../components/ui/TextArea';
import Button from '../../../components/ui/Button';
import UserSearchSelect from '../../../components/UserSearchSelect';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime } from '../../../utils/formatters';
import { localizeSessionTypeName } from '../../../utils/sessionTypeLocalization';
import toast from 'react-hot-toast';
import { useI18n } from '../../../i18n/i18n';

function toDateTimeInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export default function ConfessionSessionsPage() {
  const { user, hasPermission } = useAuth();
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();

  const canCreate = hasPermission('CONFESSIONS_CREATE');
  const canAssign = hasPermission('CONFESSIONS_ASSIGN_USER');
  const canManageTypes = hasPermission('CONFESSIONS_SESSION_TYPES_MANAGE');

  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [form, setForm] = useState({
    sessionTypeId: '',
    scheduledAt: toDateTimeInputValue(),
    nextSessionAt: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [newTypeName, setNewTypeName] = useState('');

  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(20);

  const sessionQueryParams = useMemo(
    () => ({
      limit,
      order: 'desc',
      ...(cursor && { cursor }),
    }),
    [cursor, limit]
  );

  const { data: sessionTypesRes, isLoading: sessionTypesLoading } = useQuery({
    queryKey: ['confessions', 'session-types'],
    queryFn: async () => {
      const { data } = await confessionsApi.getSessionTypes();
      return data?.data || [];
    },
    staleTime: 60000,
  });

  const sessionTypes = useMemo(
    () => (Array.isArray(sessionTypesRes) ? sessionTypesRes : []),
    [sessionTypesRes]
  );
  const sessionTypeOptions = useMemo(
    () =>
      sessionTypes.map((type) => ({
        value: type.id,
        label: localizeSessionTypeName(type.name, t),
      })),
    [sessionTypes, t]
  );

  useEffect(() => {
    if (!form.sessionTypeId && sessionTypes.length > 0) {
      setForm((prev) => ({ ...prev, sessionTypeId: sessionTypes[0].id }));
    }
  }, [form.sessionTypeId, sessionTypes]);

  useEffect(() => {
    if (!canAssign && user && !selectedAttendee) {
      setSelectedAttendee({
        _id: user._id || user.id,
        fullName: user.fullName,
        phonePrimary: user.phonePrimary,
      });
    }
  }, [canAssign, user, selectedAttendee]);

  const { data: sessionsRes, isLoading: sessionsLoading } = useQuery({
    queryKey: ['confessions', 'sessions', sessionQueryParams],
    queryFn: async () => {
      const { data } = await confessionsApi.listSessions(sessionQueryParams);
      return data;
    },
    keepPreviousData: true,
    staleTime: 30000,
  });

  const sessions = sessionsRes?.data || [];
  const sessionsMeta = sessionsRes?.meta || null;

  const createSessionMutation = useMutation({
    mutationFn: (payload) => confessionsApi.createSession(payload),
    onSuccess: () => {
      toast.success(t('confessions.sessions.successCreated'));
      setForm((prev) => ({
        ...prev,
        scheduledAt: toDateTimeInputValue(),
        nextSessionAt: '',
        notes: '',
      }));
      if (canAssign) {
        setSelectedAttendee(null);
      }
      queryClient.invalidateQueries({ queryKey: ['confessions', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['confessions', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['confessions', 'analytics'] });
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: (name) => confessionsApi.createSessionType(name),
    onSuccess: (res) => {
      const createdType = res?.data?.data;
      toast.success(t('confessions.sessions.successTypeCreated'));
      setNewTypeName('');
      queryClient.invalidateQueries({ queryKey: ['confessions', 'session-types'] });
      if (createdType?.id) {
        setForm((prev) => ({ ...prev, sessionTypeId: createdType.id }));
      }
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.sessionTypeId) nextErrors.sessionTypeId = t('confessions.sessions.errors.typeRequired');
    if (!form.scheduledAt) nextErrors.scheduledAt = t('confessions.sessions.errors.scheduledRequired');
    if (canAssign && !(selectedAttendee?._id || selectedAttendee?.id)) {
      nextErrors.attendee = t('confessions.sessions.attendeeRequired');
    }
    if (form.nextSessionAt && form.scheduledAt) {
      const scheduledAt = new Date(form.scheduledAt);
      const nextSessionAt = new Date(form.nextSessionAt);
      if (nextSessionAt <= scheduledAt) {
        nextErrors.nextSessionAt = t('confessions.sessions.errors.nextAfterCurrent');
      }
    }
    return nextErrors;
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      sessionTypeId: form.sessionTypeId,
      scheduledAt: toIsoDateTime(form.scheduledAt),
      ...(form.nextSessionAt && { nextSessionAt: toIsoDateTime(form.nextSessionAt) }),
      ...(form.notes?.trim() && { notes: form.notes.trim() }),
    };

    if (canAssign && (selectedAttendee?._id || selectedAttendee?.id)) {
      payload.attendeeUserId = selectedAttendee._id || selectedAttendee.id;
    }

    createSessionMutation.mutate(payload);
  };

  const handleCreateType = (e) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    createTypeMutation.mutate(trimmed);
  };

  const handleNext = () => {
    if (sessionsMeta?.nextCursor) {
      setCursorStack((prev) => [...prev, sessionsMeta.nextCursor]);
      setCursor(sessionsMeta.nextCursor);
    }
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
      key: 'attendee',
      label: t('confessions.sessions.columns.attendee'),
      render: (row) => (
        <div>
          <p className="font-medium text-heading">{row.attendee?.fullName || t('common.placeholder.empty')}</p>
          {row.attendee?.phonePrimary && (
            <p className="text-xs text-muted direction-ltr text-left">{row.attendee.phonePrimary}</p>
          )}
        </div>
      ),
    },
    {
      key: 'sessionType',
      label: t('confessions.sessions.columns.type'),
      render: (row) => localizeSessionTypeName(row.sessionType?.name, t),
    },
    {
      key: 'scheduledAt',
      label: t('confessions.sessions.columns.scheduledAt'),
      render: (row) => formatDateTime(row.scheduledAt),
    },
    {
      key: 'nextSessionAt',
      label: t('confessions.sessions.columns.nextSessionAt'),
      render: (row) => (row.nextSessionAt ? formatDateTime(row.nextSessionAt) : t('common.placeholder.empty')),
    },
  ];

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('confessions.sessions.page') },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader
            title={t('confessions.sessions.createTitle')}
            subtitle={t('confessions.sessions.createSubtitle')}
          />

          {!canCreate ? (
            <p className="text-sm text-muted">{t('confessions.sessions.noCreatePermission')}</p>
          ) : (
            <form onSubmit={handleCreateSession}>
              {canAssign ? (
                <div>
                  <UserSearchSelect
                    label={t('confessions.sessions.attendee')}
                    value={selectedAttendee}
                    onChange={setSelectedAttendee}
                    searchApi={confessionsApi.searchUsers}
                    queryKeyPrefix="confessions-users"
                    className='mb-4'
                  />
                  {errors.attendee && <p className="text-xs text-danger -mt-2 mb-3">{errors.attendee}</p>}
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-md border border-border bg-surface-alt">
                  <p className="text-sm text-muted">
                    {t('confessions.sessions.attendeeFallback')}
                    <span className={`font-medium text-heading ${isRTL ? 'mr-1' : 'ml-1'}`}>{user?.fullName}</span>
                  </p>
                </div>
              )}

              <Input
                label={t('confessions.sessions.sessionDate')}
                type="datetime-local"
                required
                dir="ltr"
                className="text-left"
                value={form.scheduledAt}
                onChange={(e) => updateField('scheduledAt', e.target.value)}
                error={errors.scheduledAt}
              />

              <Select
                label={t('confessions.sessions.sessionType')}
                required
                options={sessionTypeOptions}
                value={form.sessionTypeId}
                onChange={(e) => updateField('sessionTypeId', e.target.value)}
                error={errors.sessionTypeId}
                placeholder={
                  sessionTypesLoading
                    ? t('confessions.sessions.loadingTypes')
                    : t('confessions.sessions.selectType')
                }
              />

              {canManageTypes && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-base mb-1.5">
                    {t('confessions.sessions.addTypeTitle')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder={t('confessions.sessions.typeNamePlaceholder')}
                      className="input-base flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      icon={Plus}
                      loading={createTypeMutation.isPending}
                      onClick={handleCreateType}
                    >
                      {t('confessions.sessions.addTypeAction')}
                    </Button>
                  </div>
                </div>
              )}

              <Input
                label={t('confessions.sessions.nextSessionDate')}
                type="datetime-local"
                dir="ltr"
                className="text-left"
                value={form.nextSessionAt}
                onChange={(e) => updateField('nextSessionAt', e.target.value)}
                error={errors.nextSessionAt}
              />

              <TextArea
                label={t('confessions.sessions.notes')}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder={t('confessions.sessions.notesPlaceholder')}
              />

              <Button
                type="submit"
                icon={CalendarPlus}
                loading={createSessionMutation.isPending}
                className="w-full"
              >
                {t('confessions.sessions.createAction')}
              </Button>
            </form>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title={t('confessions.sessions.recentTitle')}
            subtitle={t('confessions.sessions.recentSubtitle')}
            action={<ListChecks className="w-5 h-5 text-primary" />}
          />

          <Table
            columns={columns}
            data={sessions}
            loading={sessionsLoading}
            emptyTitle={t('confessions.sessions.emptyTitle')}
            emptyDescription={t('confessions.sessions.emptyDescription')}
          />

          <Pagination
            meta={sessionsMeta}
            onLoadMore={handleNext}
            onPrev={handlePrev}
            cursors={cursorStack}
            loading={sessionsLoading}
          />
        </Card>
      </div>
    </div>
  );
}
