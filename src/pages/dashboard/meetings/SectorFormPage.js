import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Info, Plus, Trash2, Upload, UsersRound, X } from 'lucide-react';
import { mapFieldErrors, normalizeApiError } from '../../../api/errors';
import { meetingsApi } from '../../../api/endpoints';
import UserSearchSelect from '../../../components/UserSearchSelect';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import FormWizard from '../../../components/ui/FormWizard';
import Input from '../../../components/ui/Input';
import PageHeader from '../../../components/ui/PageHeader';
import Skeleton from '../../../components/ui/Skeleton';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';
import { buildSectorPayload, mapSectorToForm } from './meetingsForm.utils';

const EMPTY_FORM = {
  name: '',
  avatar: null,
  avatarRemoved: false,
  notes: '',
  officials: [],
};

export default function SectorFormPage() {
  const { t, isRTL } = useI18n();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [avatarUploading, setAvatarUploading] = useState(false);

  const sectorQuery = useQuery({
    queryKey: ['meetings', 'sectors', 'details', id],
    enabled: isEdit,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.sectors.getById(id);
      return data?.data || null;
    },
  });

  useEffect(() => {
    if (sectorQuery.data) {
      setForm(mapSectorToForm(sectorQuery.data));
    }
  }, [sectorQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? meetingsApi.sectors.update(id, payload) : meetingsApi.sectors.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? t('meetings.messages.sectorUpdated') : t('meetings.messages.sectorCreated'));
      queryClient.invalidateQueries({ queryKey: ['meetings', 'sectors'] });
      navigate('/dashboard/meetings/sectors');
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setErrors(mapFieldErrors(normalized.details));
      toast.error(normalized.message);
    },
  });

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = t('meetings.errors.nameRequired');
    }

    form.officials.forEach((official, index) => {
      if (!official.user?._id && !official.name.trim()) {
        nextErrors[`officials_${index}`] = t('meetings.errors.officialNameOrUserRequired');
      }
    });

    return nextErrors;
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
      const { data } = await meetingsApi.sectors.uploadAvatarImage(file);
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
    event?.preventDefault?.();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(t('meetings.messages.fixValidationErrors'));
      return;
    }

    saveMutation.mutate(buildSectorPayload(form));
  };

  const handleCancel = () => navigate('/dashboard/meetings/sectors');

  const updateOfficial = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      officials: prev.officials.map((official, officialIndex) =>
        officialIndex === index ? { ...official, ...patch } : official
      ),
    }));
    setErrors((prev) => ({ ...prev, [`officials_${index}`]: undefined }));
  };

  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: t('shared.dashboard'), href: '/dashboard' },
        { label: t('meetings.sectorsPageTitle'), href: '/dashboard/meetings/sectors' },
        { label: isEdit ? t('meetings.actions.editSectorPage') : t('meetings.actions.createSectorPage') },
      ]}
    />
  );

  if (isEdit && sectorQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        {breadcrumbs}
        <PageHeader
          className="border-b border-border pb-6"
          eyebrow={t('meetings.sectorsPageTitle')}
          title={t('meetings.actions.editSectorPage')}
          subtitle={t('meetings.sections.sectorsSubtitle')}
        />
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <Skeleton className="h-5 w-40" />
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
            <Skeleton className="mt-4 h-24 w-full" />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-28 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const validationSummary =
    Object.values(errors).some(Boolean) ? (
      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {t('meetings.messages.fixValidationErrors')}
      </div>
    ) : null;

  const steps = [
    {
      id: 'basic',
      label: t('meetings.sections.basicInfo'),
      description: t('meetings.sections.sectorsSubtitle'),
      icon: Info,
      content: (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-alt/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-secondary" />
              <h4 className="text-sm font-semibold text-heading">{t('meetings.fields.avatar')}</h4>
            </div>
            <p className="mb-4 text-xs text-muted">{t('meetings.fields.avatarHint')}</p>

            <div className="flex flex-wrap items-center gap-4">
              {form.avatar?.url ? (
                <div className="relative inline-block">
                  <img
                    src={form.avatar.url}
                    alt={form.name || t('meetings.fields.avatar')}
                    className="h-24 w-24 rounded-full border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -left-1 rounded-full bg-danger p-1 text-white"
                    aria-label={t('meetings.actions.removeAvatar')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface px-2 text-center text-xs text-muted">
                  {t('meetings.empty.noAvatar')}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                  className="hidden"
                  id="sector-avatar-upload"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Upload}
                  loading={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.avatar?.url ? t('meetings.actions.changeAvatar') : t('meetings.actions.uploadAvatar')}
                </Button>

                {form.avatar?.url && (
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

          <div className="rounded-xl border border-border bg-surface p-4 xl:col-span-2">
            <Input
              label={t('meetings.fields.name')}
              required
              value={form.name}
              placeholder={t('meetings.fields.namePlaceholder')}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, name: event.target.value }));
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
            />

            <TextArea
              label={t('meetings.fields.notes')}
              value={form.notes}
              placeholder={t('meetings.fields.sectorNotesPlaceholder')}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              containerClassName="!mb-0"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'officials',
      label: t('meetings.fields.officials'),
      icon: UsersRound,
      content: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  officials: [...prev.officials, { user: null, name: '', title: '', notes: '' }],
                }))
              }
            >
              {t('meetings.actions.addOfficial')}
            </Button>
          </div>

          {form.officials.length === 0 && (
            <p className="text-sm text-muted">{t('meetings.empty.noOfficialsYet')}</p>
          )}

          {form.officials.map((official, index) => (
            <div key={index} className="rounded-xl border border-border bg-surface-alt/30 p-4">
              <UserSearchSelect
                label={t('meetings.fields.userLink')}
                value={official.user}
                onChange={(value) =>
                  updateOfficial(index, {
                    user: value,
                    name: value?.fullName || official.name,
                  })
                }
              />

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  label={t('meetings.fields.nameFallback')}
                  value={official.name}
                  placeholder={t('meetings.fields.officialNamePlaceholder')}
                  onChange={(event) => updateOfficial(index, { name: event.target.value })}
                  error={errors[`officials_${index}`]}
                />
                <Input
                  label={t('meetings.fields.title')}
                  value={official.title}
                  placeholder={t('meetings.fields.officialTitlePlaceholder')}
                  onChange={(event) => updateOfficial(index, { title: event.target.value })}
                />
              </div>

              <TextArea
                label={t('meetings.fields.notes')}
                value={official.notes}
                placeholder={t('meetings.fields.officialNotesPlaceholder')}
                onChange={(event) => updateOfficial(index, { notes: event.target.value })}
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
                    officials: prev.officials.filter((_, officialIndex) => officialIndex !== index),
                  }))
                }
              >
                {t('meetings.actions.remove')}
              </Button>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {breadcrumbs}

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('meetings.sectorsPageTitle')}
        title={isEdit ? t('meetings.actions.editSectorPage') : t('meetings.actions.createSectorPage')}
        subtitle={t('meetings.sections.sectorsSubtitle')}
      />

      <div className="mx-auto max-w-4xl">
        <FormWizard
          steps={steps}
          onSave={handleSubmit}
          onCancel={handleCancel}
          saving={saveMutation.isPending}
          saveLabel={t('common.actions.save')}
          nextLabel={t('common.pagination.next')}
          prevLabel={t('common.pagination.previous')}
          cancelLabel={t('common.actions.cancel')}
          isRTL={isRTL}
          footerExtra={validationSummary}
        />
      </div>
    </div>
  );
}
