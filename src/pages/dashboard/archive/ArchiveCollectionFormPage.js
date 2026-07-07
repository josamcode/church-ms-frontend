import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, FolderOpen, ImagePlus, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { archiveApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import PageHeader from '../../../components/ui/PageHeader';
import Select from '../../../components/ui/Select';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';

const DEFAULT_ARCHIVE_DATA = {
  collections: [],
  stories: [],
  honorees: [],
  counts: {
    collections: 0,
    stories: 0,
    honorees: 0,
    publishedCollections: 0,
    publishedStories: 0,
    publishedHonorees: 0,
  },
};

function createEmptyCollectionForm() {
  return {
    id: null,
    title: '',
    slug: '',
    description: '',
    narrative: '',
    status: 'draft',
    photos: [],
  };
}

function PhotoGalleryEditor({ label, photos, onChange, onUpload, uploading, canUpload }) {
  const { t } = useI18n();
  const inputRef = useRef(null);

  const updateCaption = (index, caption) => {
    const next = [...photos];
    next[index] = {
      ...next[index],
      caption,
    };
    onChange(next);
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const validFiles = files.filter((file) => file.type.startsWith('image/'));

    if (!validFiles.length) {
      toast.error(t('archivePage.gallery.invalidImage'));
      return;
    }

    if (validFiles.length !== files.length) {
      toast.error(t('archivePage.gallery.invalidImage'));
    }

    const uploadedPhotos = [];

    for (const file of validFiles) {
      try {
        const uploaded = await onUpload(file);
        if (uploaded?.url) {
          uploadedPhotos.push(uploaded);
        }
      } catch (_error) {
        // Upload errors are already handled by the mutation.
      }
    }

    if (uploadedPhotos.length) {
      onChange([...(photos || []), ...uploadedPhotos]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-heading">{label}</p>
        {canUpload ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={ImagePlus}
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {t('archivePage.gallery.uploadImage')}
            </Button>
          </>
        ) : null}
      </div>

      {!canUpload ? (
        <p className="text-xs text-muted">{t('archivePage.gallery.uploadPermissionHint')}</p>
      ) : null}

      {!photos?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
          {t('archivePage.gallery.noPhotos')}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {photos.map((photo, index) => (
            <div key={`${photo.storageKey || photo.url}-${index}`} className="rounded-2xl border border-border p-3">
              <img
                src={photo.url}
                alt={photo.caption || ''}
                loading="lazy"
                className="mb-3 h-40 w-full rounded-xl object-cover"
              />
              <div className="space-y-3">
                <Input
                  label={t('archivePage.gallery.caption')}
                  value={photo.caption || ''}
                  onChange={(event) => updateCaption(index, event.target.value)}
                  containerClassName="!mb-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="text-danger"
                  onClick={() => removePhoto(index)}
                >
                  {t('archivePage.gallery.removePhoto')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArchiveCollectionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const ta = (key, values) => t(`archivePage.${key}`, values);
  const tx = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const canManageCollections = hasPermission('ARCHIVE_COLLECTIONS_MANAGE');
  const canUpload = hasPermission('ARCHIVE_UPLOAD');
  const canPublish = hasPermission('ARCHIVE_PUBLISH');

  const [collectionForm, setCollectionForm] = useState(createEmptyCollectionForm);
  const [prefilled, setPrefilled] = useState(false);

  const statusOptions = (() => {
    const base = [{ value: 'draft', label: ta('status.draft') }];
    if (canPublish) {
      base.push({ value: 'published', label: ta('status.published') });
    }
    return base;
  })();

  // Reuse the same source of truth used by the management page so edit mode
  // prefills without an extra per-id endpoint.
  const archiveQuery = useQuery({
    queryKey: ['archive', 'manage'],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await archiveApi.getManage();
      return data?.data || DEFAULT_ARCHIVE_DATA;
    },
  });

  const archiveData = archiveQuery.data || DEFAULT_ARCHIVE_DATA;
  const existingCollection = isEdit
    ? archiveData.collections.find((entry) => String(entry.id) === String(id)) || null
    : null;

  useEffect(() => {
    if (!isEdit || prefilled) return;
    if (!existingCollection) return;

    setCollectionForm({
      id: existingCollection.id,
      title: existingCollection.title || '',
      slug: existingCollection.slug || '',
      description: existingCollection.description || '',
      narrative: existingCollection.narrative || '',
      status: existingCollection.status || 'draft',
      photos: existingCollection.photos || [],
    });
    setPrefilled(true);
  }, [isEdit, prefilled, existingCollection]);

  const syncPayload = (payload) => {
    if (!payload) return;
    queryClient.setQueryData(['archive', 'manage'], payload);
  };

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const { data } = await archiveApi.uploadImage(file);
      return data?.data || null;
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const saveCollectionMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload.id) {
        const { data } = await archiveApi.updateCollection(payload.id, payload);
        return data?.data || null;
      }
      const { data } = await archiveApi.createCollection(payload);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      syncPayload(payload);
      toast.success(ta('messages.collectionSaved'));
      navigate('/dashboard/archive');
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const uploadArchivePhoto = async (file) => uploadImageMutation.mutateAsync(file);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!collectionForm.title.trim()) {
      toast.error(ta('collections.form.title'));
      return;
    }
    saveCollectionMutation.mutate({
      id: collectionForm.id,
      title: collectionForm.title,
      slug: collectionForm.slug,
      description: collectionForm.description,
      narrative: collectionForm.narrative,
      status: collectionForm.status,
      photos: collectionForm.photos,
    });
  };

  const pageTitle = isEdit ? ta('collections.form.editTitle') : ta('collections.form.newTitle');

  const breadcrumbs = [
    { label: tx('shared.dashboard', 'Dashboard'), href: '/dashboard' },
    { label: ta('title'), href: '/dashboard/archive' },
    { label: pageTitle },
  ];

  const backButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      icon={ArrowRight}
      onClick={() => navigate('/dashboard/archive')}
    >
      {t('common.actions.back')}
    </Button>
  );

  if (!canManageCollections) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader
          eyebrow={ta('eyebrow')}
          title={tx('archivePage.accessDeniedTitle', 'Archive access is not available')}
          subtitle={tx(
            'archivePage.accessDeniedDescription',
            'You do not have permission to manage archive collections.'
          )}
          actions={backButton}
        />
      </div>
    );
  }

  if (isEdit && archiveQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader eyebrow={ta('eyebrow')} title={pageTitle} subtitle={ta('collections.subtitle')} />
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isEdit && !archiveQuery.isLoading && !existingCollection) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader
          eyebrow={ta('eyebrow')}
          title={ta('collections.empty.title')}
          subtitle={ta('collections.empty.description')}
          actions={backButton}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        eyebrow={ta('eyebrow')}
        title={pageTitle}
        subtitle={ta('collections.subtitle')}
        actions={backButton}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader
            icon={FolderOpen}
            title={ta('collections.title')}
            subtitle={ta('collections.subtitle')}
          />

          <div className="space-y-4">
            <Input
              label={ta('collections.form.title')}
              value={collectionForm.title}
              onChange={(event) =>
                setCollectionForm((current) => ({ ...current, title: event.target.value }))
              }
              required
              containerClassName="!mb-0"
            />
            <Input
              label={ta('collections.form.slug')}
              value={collectionForm.slug}
              onChange={(event) =>
                setCollectionForm((current) => ({ ...current, slug: event.target.value }))
              }
              hint={ta('collections.form.slugHint')}
              containerClassName="!mb-0"
            />
            <TextArea
              label={ta('collections.form.description')}
              value={collectionForm.description}
              onChange={(event) =>
                setCollectionForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              containerClassName="!mb-0"
            />
            <TextArea
              label={ta('collections.form.narrative')}
              value={collectionForm.narrative}
              onChange={(event) =>
                setCollectionForm((current) => ({ ...current, narrative: event.target.value }))
              }
              rows={6}
              containerClassName="!mb-0"
            />
            <Select
              label={ta('collections.form.status')}
              value={collectionForm.status}
              options={statusOptions}
              onChange={(event) =>
                setCollectionForm((current) => ({ ...current, status: event.target.value }))
              }
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={ImagePlus}
            title={ta('collections.form.photos')}
            subtitle={ta('gallery.uploadPermissionHint')}
          />
          <PhotoGalleryEditor
            label={ta('collections.form.photos')}
            photos={collectionForm.photos}
            onChange={(photos) => setCollectionForm((current) => ({ ...current, photos }))}
            onUpload={uploadArchivePhoto}
            uploading={uploadImageMutation.isPending}
            canUpload={canUpload}
          />
        </Card>

        <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-card backdrop-blur sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => navigate('/dashboard/archive')}
            className="sm:w-auto"
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            icon={Save}
            fullWidth
            loading={saveCollectionMutation.isPending}
            className="sm:w-auto"
          >
            {isEdit ? ta('actions.updateCollection') : ta('actions.createCollection')}
          </Button>
        </div>
      </form>
    </div>
  );
}
