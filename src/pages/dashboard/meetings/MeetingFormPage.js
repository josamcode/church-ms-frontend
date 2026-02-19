import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2 } from 'lucide-react';
import { mapFieldErrors, normalizeApiError } from '../../../api/errors';
import { meetingsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import UserSearchSelect from '../../../components/UserSearchSelect';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';
import {
  ACTIVITY_OPTIONS,
  DAY_OPTIONS,
  buildMeetingPayload,
  mapMeetingToForm,
} from './meetingsForm.utils';

const EMPTY_FORM = {
  sectorId: '',
  name: '',
  day: 'Sunday',
  time: '18:00',
  avatarUrl: '',
  avatarPublicId: '',
  serviceSecretaryUser: null,
  serviceSecretaryName: '',
  assistantSecretaries: [],
  servedUsers: [],
  groupsCsv: '',
  servants: [],
  committees: [],
  activities: [],
  notes: '',
};

function UserPill({ user, onRemove }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-2 py-1 text-xs">
      <span className="font-medium text-heading">{user.fullName}</span>
      <button type="button" className="text-danger" onClick={onRemove}>
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function MeetingFormPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const canUpdateBasics = hasPermission('MEETINGS_UPDATE');
  const canManageServants = hasPermission('MEETINGS_SERVANTS_MANAGE');
  const canManageCommittees = hasPermission('MEETINGS_COMMITTEES_MANAGE');
  const canManageActivities = hasPermission('MEETINGS_ACTIVITIES_MANAGE');
  const canViewResponsibilities = hasPermission('MEETINGS_RESPONSIBILITIES_VIEW');

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [pendingServedUser, setPendingServedUser] = useState(null);

  const sectorsQuery = useQuery({
    queryKey: ['meetings', 'sectors', 'list'],
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.sectors.list({ limit: 200, order: 'asc' });
      return data?.data || [];
    },
  });

  const meetingQuery = useQuery({
    queryKey: ['meetings', 'details', id],
    enabled: isEdit,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.getById(id);
      return data?.data || null;
    },
  });

  const responsibilitiesQuery = useQuery({
    queryKey: ['meetings', 'responsibilities'],
    enabled: canViewResponsibilities && canManageServants,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.responsibilities.list({ limit: 30 });
      return data?.data || [];
    },
  });

  useEffect(() => {
    if (meetingQuery.data) {
      setForm(mapMeetingToForm(meetingQuery.data));
    }
  }, [meetingQuery.data]);

  const sectors = Array.isArray(sectorsQuery.data) ? sectorsQuery.data : [];
  const sectorOptions = sectors.map((sector) => ({ value: sector.id, label: sector.name }));

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (!isEdit) {
        return meetingsApi.meetings.create(payload);
      }

      const { servants, committees, activities, ...basicPayload } = payload;

      if (canUpdateBasics) {
        await meetingsApi.meetings.updateBasic(id, basicPayload);
      }
      if (canManageServants) {
        await meetingsApi.meetings.updateServants(id, servants || []);
      }
      if (canManageCommittees) {
        await meetingsApi.meetings.updateCommittees(id, committees || []);
      }
      if (canManageActivities) {
        await meetingsApi.meetings.updateActivities(id, activities || []);
      }

      return meetingsApi.meetings.getById(id);
    },
    onSuccess: () => {
      toast.success(isEdit ? t('meetings.messages.meetingUpdated') : t('meetings.messages.meetingCreated'));
      queryClient.invalidateQueries({ queryKey: ['meetings', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'responsibilities'] });
      navigate('/dashboard/meetings');
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setErrors(mapFieldErrors(normalized.details));
      toast.error(normalized.message);
    },
  });

  const validateForm = () => {
    const nextErrors = {};

    if (!form.sectorId) nextErrors.sectorId = t('meetings.errors.sectorRequired');
    if (!form.name.trim()) nextErrors.name = t('meetings.errors.nameRequired');
    if (!form.time) nextErrors.time = t('meetings.errors.timeRequired');

    if (canManageServants) {
      form.servants.forEach((servant, index) => {
        if (!servant.user?._id && !servant.name.trim()) {
          nextErrors[`servant_${index}`] = t('meetings.errors.servantNameOrUserRequired');
        }
      });
    }

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(t('meetings.messages.fixValidationErrors'));
      return;
    }

    const payload = buildMeetingPayload(form, {
      includeServants: canManageServants,
      includeCommittees: canManageCommittees,
      includeActivities: canManageActivities,
    });

    saveMutation.mutate(payload);
  };

  const readonlyBasics = isEdit && !canUpdateBasics;

  if (isEdit && meetingQuery.isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">{t('common.loading')}</p>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('meetings.pageTitle'), href: '/dashboard/meetings' },
          { label: isEdit ? t('meetings.actions.editMeetingPage') : t('meetings.actions.createMeetingPage') },
        ]}
      />

      <Card>
        <CardHeader
          title={isEdit ? t('meetings.actions.editMeetingPage') : t('meetings.actions.createMeetingPage')}
          subtitle={t('meetings.sections.meetingsSubtitle')}
        />

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader title={t('meetings.sections.basicInfo')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t('meetings.fields.sector')}
                required
                value={form.sectorId}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, sectorId: event.target.value }));
                  setErrors((prev) => ({ ...prev, sectorId: undefined }));
                }}
                options={sectorOptions}
                placeholder={t('meetings.fields.selectSector')}
                error={errors.sectorId}
                disabled={readonlyBasics}
              />
              <Input
                label={t('meetings.fields.name')}
                required
                value={form.name}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, name: event.target.value }));
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
                disabled={readonlyBasics}
              />
              <Select
                label={t('meetings.fields.day')}
                required
                value={form.day}
                onChange={(event) => setForm((prev) => ({ ...prev, day: event.target.value }))}
                options={DAY_OPTIONS}
                disabled={readonlyBasics}
              />
              <Input
                label={t('meetings.fields.time')}
                required
                type="time"
                value={form.time}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, time: event.target.value }));
                  setErrors((prev) => ({ ...prev, time: undefined }));
                }}
                error={errors.time}
                disabled={readonlyBasics}
              />
              <Input
                label={t('meetings.fields.avatarUrl')}
                value={form.avatarUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))}
                disabled={readonlyBasics}
              />
              <Input
                label={t('meetings.fields.avatarPublicId')}
                value={form.avatarPublicId}
                onChange={(event) => setForm((prev) => ({ ...prev, avatarPublicId: event.target.value }))}
                disabled={readonlyBasics}
              />
            </div>

            <Input
              label={t('meetings.fields.groups')}
              value={form.groupsCsv}
              onChange={(event) => setForm((prev) => ({ ...prev, groupsCsv: event.target.value }))}
              placeholder={t('meetings.fields.csvPlaceholder')}
              disabled={readonlyBasics}
            />

            <TextArea
              label={t('meetings.fields.notes')}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              disabled={readonlyBasics}
            />
          </Card>

          <Card className="mt-4">
            <CardHeader title={t('meetings.sections.leadership')} />
            <UserSearchSelect
              label={t('meetings.fields.serviceSecretary')}
              value={form.serviceSecretaryUser}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  serviceSecretaryUser: value,
                  serviceSecretaryName: value?.fullName || prev.serviceSecretaryName,
                }))
              }
            />
            <Input
              label={t('meetings.fields.nameFallback')}
              value={form.serviceSecretaryName}
              onChange={(event) => setForm((prev) => ({ ...prev, serviceSecretaryName: event.target.value }))}
              disabled={readonlyBasics}
            />

            <div className="rounded-lg border border-border p-3 mt-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-heading">{t('meetings.fields.assistants')}</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={Plus}
                  disabled={readonlyBasics}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      assistantSecretaries: [...prev.assistantSecretaries, { user: null, name: '' }],
                    }))
                  }
                >
                  {t('meetings.actions.addAssistant')}
                </Button>
              </div>

              <div className="space-y-3">
                {form.assistantSecretaries.map((assistant, index) => (
                  <div key={index} className="rounded-md border border-border p-3">
                    <UserSearchSelect
                      label={t('meetings.fields.userLink')}
                      value={assistant.user}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          assistantSecretaries: prev.assistantSecretaries.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, user: value, name: value?.fullName || entry.name }
                              : entry
                          ),
                        }))
                      }
                    />
                    <Input
                      label={t('meetings.fields.nameFallback')}
                      value={assistant.name}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          assistantSecretaries: prev.assistantSecretaries.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, name: event.target.value } : entry
                          ),
                        }))
                      }
                      disabled={readonlyBasics}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      icon={Trash2}
                      disabled={readonlyBasics}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          assistantSecretaries: prev.assistantSecretaries.filter(
                            (_, entryIndex) => entryIndex !== index
                          ),
                        }))
                      }
                    >
                      {t('meetings.actions.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 mt-3">
              <h4 className="text-sm font-semibold text-heading mb-2">{t('meetings.fields.servedUsers')}</h4>
              <UserSearchSelect
                label={t('meetings.actions.addServedUser')}
                value={pendingServedUser}
                onChange={(value) => {
                  setPendingServedUser(null);
                  if (!value?._id) return;
                  setForm((prev) => {
                    if (prev.servedUsers.some((entry) => entry._id === value._id)) return prev;
                    return { ...prev, servedUsers: [...prev.servedUsers, value] };
                  });
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {form.servedUsers.map((user) => (
                  <UserPill
                    key={user._id}
                    user={user}
                    onRemove={() =>
                      setForm((prev) => ({
                        ...prev,
                        servedUsers: prev.servedUsers.filter((entry) => entry._id !== user._id),
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          </Card>

          {canManageServants && (
            <Card className="mt-4">
              <CardHeader
                title={t('meetings.sections.servants')}
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        servants: [
                          ...prev.servants,
                          { name: '', user: null, responsibility: '', groupsManagedCsv: '', servedUserIdsCsv: '', notes: '' },
                        ],
                      }))
                    }
                  >
                    {t('meetings.actions.addServant')}
                  </Button>
                }
              />

              {canViewResponsibilities && (responsibilitiesQuery.data || []).length > 0 && (
                <div className="mb-3 rounded-lg border border-border bg-surface-alt p-2">
                  <p className="text-xs font-semibold text-muted mb-1">{t('meetings.fields.responsibilitySuggestions')}</p>
                  <div className="flex flex-wrap gap-1">
                    {(responsibilitiesQuery.data || []).slice(0, 20).map((entry) => (
                      <span key={entry.id} className="rounded-full border border-border px-2 py-1 text-xs text-muted">
                        {entry.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {form.servants.length === 0 && (
                  <p className="text-sm text-muted">{t('meetings.empty.noServantsYet')}</p>
                )}

                {form.servants.map((servant, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <UserSearchSelect
                      label={t('meetings.fields.userLink')}
                      value={servant.user}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          servants: prev.servants.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, user: value, name: value?.fullName || entry.name }
                              : entry
                          ),
                        }))
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label={t('meetings.fields.nameFallback')}
                        value={servant.name}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            servants: prev.servants.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, name: event.target.value } : entry
                            ),
                          }))
                        }
                        error={errors[`servant_${index}`]}
                      />
                      <Input
                        label={t('meetings.fields.responsibility')}
                        value={servant.responsibility}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            servants: prev.servants.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, responsibility: event.target.value } : entry
                            ),
                          }))
                        }
                      />
                      <Input
                        label={t('meetings.fields.groupsManaged')}
                        value={servant.groupsManagedCsv}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            servants: prev.servants.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, groupsManagedCsv: event.target.value } : entry
                            ),
                          }))
                        }
                        placeholder={t('meetings.fields.csvPlaceholder')}
                      />
                      <Input
                        label={t('meetings.fields.servedUsersCsv')}
                        value={servant.servedUserIdsCsv}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            servants: prev.servants.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, servedUserIdsCsv: event.target.value } : entry
                            ),
                          }))
                        }
                        placeholder={t('meetings.fields.idCsvPlaceholder')}
                      />
                    </div>

                    <TextArea
                      label={t('meetings.fields.notes')}
                      value={servant.notes}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          servants: prev.servants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, notes: event.target.value } : entry
                          ),
                        }))
                      }
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      icon={Trash2}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          servants: prev.servants.filter((_, entryIndex) => entryIndex !== index),
                        }))
                      }
                    >
                      {t('meetings.actions.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {canManageCommittees && (
            <Card className="mt-4">
              <CardHeader
                title={t('meetings.sections.committees')}
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        committees: [
                          ...prev.committees,
                          { name: '', memberNamesCsv: '', memberUserIdsCsv: '', detailsText: '', notes: '' },
                        ],
                      }))
                    }
                  >
                    {t('meetings.actions.addCommittee')}
                  </Button>
                }
              />

              <div className="space-y-4">
                {form.committees.length === 0 && <p className="text-sm text-muted">{t('meetings.empty.noCommitteesYet')}</p>}
                {form.committees.map((committee, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <Input
                      label={t('meetings.fields.name')}
                      value={committee.name}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          committees: prev.committees.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, name: event.target.value } : entry
                          ),
                        }))
                      }
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label={t('meetings.fields.memberNames')}
                        value={committee.memberNamesCsv}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            committees: prev.committees.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, memberNamesCsv: event.target.value } : entry
                            ),
                          }))
                        }
                        placeholder={t('meetings.fields.csvPlaceholder')}
                      />
                      <Input
                        label={t('meetings.fields.memberUserIdsCsv')}
                        value={committee.memberUserIdsCsv}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            committees: prev.committees.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, memberUserIdsCsv: event.target.value } : entry
                            ),
                          }))
                        }
                        placeholder={t('meetings.fields.idCsvPlaceholder')}
                      />
                    </div>
                    <TextArea
                      label={t('meetings.fields.committeeDetails')}
                      value={committee.detailsText}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          committees: prev.committees.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, detailsText: event.target.value } : entry
                          ),
                        }))
                      }
                    />
                    <TextArea
                      label={t('meetings.fields.notes')}
                      value={committee.notes}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          committees: prev.committees.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, notes: event.target.value } : entry
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      icon={Trash2}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          committees: prev.committees.filter((_, entryIndex) => entryIndex !== index),
                        }))
                      }
                    >
                      {t('meetings.actions.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {canManageActivities && (
            <Card className="mt-4">
              <CardHeader
                title={t('meetings.sections.activities')}
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        activities: [...prev.activities, { name: '', type: 'activity', scheduledAt: '', notes: '' }],
                      }))
                    }
                  >
                    {t('meetings.actions.addActivity')}
                  </Button>
                }
              />

              <div className="space-y-4">
                {form.activities.length === 0 && <p className="text-sm text-muted">{t('meetings.empty.noActivitiesYet')}</p>}
                {form.activities.map((activity, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label={t('meetings.fields.name')}
                        value={activity.name}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            activities: prev.activities.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, name: event.target.value } : entry
                            ),
                          }))
                        }
                      />
                      <Select
                        label={t('meetings.fields.activityType')}
                        value={activity.type}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            activities: prev.activities.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, type: event.target.value } : entry
                            ),
                          }))
                        }
                        options={ACTIVITY_OPTIONS}
                      />
                      <Input
                        label={t('meetings.fields.scheduledAt')}
                        type="datetime-local"
                        value={activity.scheduledAt}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            activities: prev.activities.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, scheduledAt: event.target.value } : entry
                            ),
                          }))
                        }
                      />
                    </div>
                    <TextArea
                      label={t('meetings.fields.notes')}
                      value={activity.notes}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          activities: prev.activities.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, notes: event.target.value } : entry
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      icon={Trash2}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          activities: prev.activities.filter((_, entryIndex) => entryIndex !== index),
                        }))
                      }
                    >
                      {t('meetings.actions.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {readonlyBasics && (
            <p className="text-sm text-muted mt-4">{t('meetings.messages.basicReadOnly')}</p>
          )}

          <div className="flex gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/meetings')}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" icon={Save} loading={saveMutation.isPending}>
              {t('common.actions.save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
