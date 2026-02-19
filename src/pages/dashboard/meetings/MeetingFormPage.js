import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, Upload, X } from 'lucide-react';
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
  avatar: null,
  avatarRemoved: false,
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

function UserPill({ user, onRemove, disabled = false }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-2.5 py-1 text-xs">
      <span className="font-medium text-heading">{user.fullName}</span>
      <button type="button" className="text-danger disabled:opacity-50" onClick={onRemove} disabled={disabled}>
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
  const fileInputRef = useRef(null);

  const canUpdateBasics = hasPermission('MEETINGS_UPDATE');
  const canManageServants = hasPermission('MEETINGS_SERVANTS_MANAGE');
  const canManageCommittees = hasPermission('MEETINGS_COMMITTEES_MANAGE');
  const canManageActivities = hasPermission('MEETINGS_ACTIVITIES_MANAGE');
  const canViewResponsibilities = hasPermission('MEETINGS_RESPONSIBILITIES_VIEW');

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [pendingServedUser, setPendingServedUser] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  const patchListItem = (key, index, patch) => {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry
      ),
    }));
  };

  const removeListItem = (key, index) => {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('meetings.errors.avatarMustBeImage'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAvatarUploading(true);
    try {
      const { data } = await meetingsApi.meetings.uploadAvatarImage(file);
      const avatar = data?.data;
      if (!avatar?.url) {
        toast.error(t('meetings.errors.avatarUploadFailed'));
      } else {
        setForm((prev) => ({ ...prev, avatar, avatarRemoved: false }));
        toast.success(t('meetings.messages.avatarUploaded'));
      }
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatar: null, avatarRemoved: true }));
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <CardHeader title={t('meetings.sections.basicInfo')} className="mb-3" />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-surface-alt/40 p-4">
                <h4 className="text-sm font-semibold text-heading mb-2">{t('meetings.fields.avatar')}</h4>
                <p className="text-xs text-muted mb-4">{t('meetings.fields.avatarHint')}</p>

                <div className="flex items-center gap-4 flex-wrap">
                  {form.avatar?.url ? (
                    <div className="relative inline-block">
                      <img
                        src={form.avatar.url}
                        alt={form.name || t('meetings.fields.avatar')}
                        className="h-24 w-24 rounded-full border border-border object-cover"
                      />
                      {!readonlyBasics && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="absolute -top-1 -left-1 rounded-full bg-danger p-1 text-white"
                          aria-label={t('meetings.actions.removeAvatar')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full border-2 border-dashed border-border bg-surface flex items-center justify-center text-xs text-muted text-center px-2">
                      {t('meetings.empty.noAvatar')}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading || readonlyBasics}
                      className="hidden"
                      id="meeting-avatar-upload"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Upload}
                      loading={avatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={readonlyBasics}
                    >
                      {form.avatar?.url ? t('meetings.actions.changeAvatar') : t('meetings.actions.uploadAvatar')}
                    </Button>

                    {form.avatar?.url && !readonlyBasics && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={handleRemoveAvatar}
                      >
                        {t('meetings.actions.removeAvatar')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-2 rounded-xl border border-border bg-surface p-4">
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
                    placeholder={t('meetings.fields.meetingNamePlaceholder')}
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
                </div>

                <Input
                  label={t('meetings.fields.groups')}
                  value={form.groupsCsv}
                  onChange={(event) => setForm((prev) => ({ ...prev, groupsCsv: event.target.value }))}
                  placeholder={t('meetings.fields.groupsPlaceholder')}
                  disabled={readonlyBasics}
                />

                <TextArea
                  label={t('meetings.fields.notes')}
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder={t('meetings.fields.meetingNotesPlaceholder')}
                  disabled={readonlyBasics}
                />
              </div>
            </div>

            {readonlyBasics && (
              <p className="text-sm text-muted mt-3">{t('meetings.messages.basicReadOnly')}</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <CardHeader title={t('meetings.sections.leadership')} className="mb-3" />
            <UserSearchSelect
              label={t('meetings.fields.serviceSecretary')}
              value={form.serviceSecretaryUser}
              disabled={readonlyBasics}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  serviceSecretaryUser: value,
                  serviceSecretaryName: value?.fullName || prev.serviceSecretaryName,
                }))
              }
              className='mb-2'
            />
            <Input
              label={t('meetings.fields.nameFallback')}
              value={form.serviceSecretaryName}
              placeholder={t('meetings.fields.serviceSecretaryNamePlaceholder')}
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
                {form.assistantSecretaries.length === 0 && (
                  <p className="text-sm text-muted">{t('meetings.empty.noAssistantsYet')}</p>
                )}

                {form.assistantSecretaries.map((assistant, index) => (
                  <div key={index} className="rounded-md border border-border p-3">
                    <UserSearchSelect
                      label={t('meetings.fields.userLink')}
                      value={assistant.user}
                      disabled={readonlyBasics}
                      onChange={(value) =>
                        patchListItem('assistantSecretaries', index, {
                          user: value,
                          name: value?.fullName || assistant.name,
                        })
                      }
                      className='mb-2'
                    />
                    <Input
                      label={t('meetings.fields.nameFallback')}
                      value={assistant.name}
                      placeholder={t('meetings.fields.assistantNamePlaceholder')}
                      onChange={(event) =>
                        patchListItem('assistantSecretaries', index, { name: event.target.value })
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
                      onClick={() => removeListItem('assistantSecretaries', index)}
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
                disabled={readonlyBasics}
                onChange={(value) => {
                  setPendingServedUser(null);
                  if (!value?._id || readonlyBasics) return;
                  setForm((prev) => {
                    if (prev.servedUsers.some((entry) => entry._id === value._id)) return prev;
                    return { ...prev, servedUsers: [...prev.servedUsers, value] };
                  });
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {form.servedUsers.length === 0 && (
                  <p className="text-sm text-muted">{t('meetings.empty.noServedUsersYet')}</p>
                )}
                {form.servedUsers.map((user) => (
                  <UserPill
                    key={user._id}
                    user={user}
                    disabled={readonlyBasics}
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
          </div>

          {canManageServants && (
            <div className="rounded-xl border border-border bg-surface p-4">
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

              <div className="space-y-4">
                {form.servants.length === 0 && (
                  <p className="text-sm text-muted">{t('meetings.empty.noServantsYet')}</p>
                )}

                {form.servants.map((servant, index) => (
                  <div key={index} className="rounded-lg border border-border bg-surface-alt/30 p-4">
                    <UserSearchSelect
                      label={t('meetings.fields.userLink')}
                      value={servant.user}
                      onChange={(value) => {
                        patchListItem('servants', index, {
                          user: value,
                          name: value?.fullName || servant.name,
                        });
                        setErrors((prev) => ({ ...prev, [`servant_${index}`]: undefined }));
                      }}
                      className='mb-2'
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label={t('meetings.fields.nameFallback')}
                        value={servant.name}
                        placeholder={t('meetings.fields.servantNamePlaceholder')}
                        onChange={(event) => {
                          patchListItem('servants', index, { name: event.target.value });
                          setErrors((prev) => ({ ...prev, [`servant_${index}`]: undefined }));
                        }}
                        error={errors[`servant_${index}`]}
                      />
                      <Input
                        label={t('meetings.fields.responsibility')}
                        value={servant.responsibility}
                        placeholder={t('meetings.fields.servantResponsibilityPlaceholder')}
                        onChange={(event) =>
                          patchListItem('servants', index, { responsibility: event.target.value })
                        }
                      />
                      <Input
                        label={t('meetings.fields.groupsManaged')}
                        value={servant.groupsManagedCsv}
                        onChange={(event) =>
                          patchListItem('servants', index, { groupsManagedCsv: event.target.value })
                        }
                        placeholder={t('meetings.fields.csvPlaceholder')}
                      />
                    </div>

                    <TextArea
                      label={t('meetings.fields.notes')}
                      value={servant.notes}
                      placeholder={t('meetings.fields.servantNotesPlaceholder')}
                      onChange={(event) => patchListItem('servants', index, { notes: event.target.value })}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      icon={Trash2}
                      onClick={() => removeListItem('servants', index)}
                    >
                      {t('meetings.actions.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canManageCommittees && (
            <div className="rounded-xl border border-border bg-surface p-4">
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
                  <div key={index} className="rounded-lg border border-border bg-surface-alt/30 p-4">
                    <Input
                      label={t('meetings.fields.name')}
                      value={committee.name}
                      placeholder={t('meetings.fields.committeeNamePlaceholder')}
                      onChange={(event) => patchListItem('committees', index, { name: event.target.value })}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label={t('meetings.fields.memberNames')}
                        value={committee.memberNamesCsv}
                        onChange={(event) =>
                          patchListItem('committees', index, { memberNamesCsv: event.target.value })
                        }
                        placeholder={t('meetings.fields.csvPlaceholder')}
                      />
                      <Input
                        label={t('meetings.fields.memberUserIdsCsv')}
                        value={committee.memberUserIdsCsv}
                        onChange={(event) =>
                          patchListItem('committees', index, { memberUserIdsCsv: event.target.value })
                        }
                        placeholder={t('meetings.fields.idCsvPlaceholder')}
                      />
                    </div>
                    <TextArea
                      label={t('meetings.fields.committeeDetails')}
                      value={committee.detailsText}
                      placeholder={t('meetings.fields.committeeDetailsPlaceholder')}
                      onChange={(event) => patchListItem('committees', index, { detailsText: event.target.value })}
                    />
                    <TextArea
                      label={t('meetings.fields.notes')}
                      value={committee.notes}
                      placeholder={t('meetings.fields.committeeNotesPlaceholder')}
                      onChange={(event) => patchListItem('committees', index, { notes: event.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      icon={Trash2}
                      onClick={() => removeListItem('committees', index)}
                    >
                      {t('meetings.actions.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {canManageActivities && (
            <div className="rounded-xl border border-border bg-surface p-4">
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
                  <div key={index} className="rounded-lg border border-border bg-surface-alt/30 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label={t('meetings.fields.name')}
                        value={activity.name}
                        placeholder={t('meetings.fields.activityNamePlaceholder')}
                        onChange={(event) => patchListItem('activities', index, { name: event.target.value })}
                      />
                      <Select
                        label={t('meetings.fields.activityType')}
                        value={activity.type}
                        onChange={(event) => patchListItem('activities', index, { type: event.target.value })}
                        options={ACTIVITY_OPTIONS}
                      />
                      <Input
                        label={t('meetings.fields.scheduledAt')}
                        type="datetime-local"
                        value={activity.scheduledAt}
                        onChange={(event) => patchListItem('activities', index, { scheduledAt: event.target.value })}
                      />
                    </div>
                    <TextArea
                      label={t('meetings.fields.notes')}
                      value={activity.notes}
                      placeholder={t('meetings.fields.activityNotesPlaceholder')}
                      onChange={(event) => patchListItem('activities', index, { notes: event.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      icon={Trash2}
                      onClick={() => removeListItem('activities', index)}
                    >
                      {t('meetings.actions.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-2">
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
