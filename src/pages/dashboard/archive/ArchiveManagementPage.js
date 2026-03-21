import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  ExternalLink,
  FileText,
  FolderOpen,
  ImagePlus,
  Images,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { archiveApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import PageHeader from '../../../components/ui/PageHeader';
import Select from '../../../components/ui/Select';
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

function createEmptyStoryForm() {
  return {
    id: null,
    title: '',
    slug: '',
    summary: '',
    narrative: '',
    collectionId: '',
    eventDate: '',
    status: 'draft',
    photos: [],
  };
}

function createEmptyHonoreeForm() {
  return {
    id: null,
    fullName: '',
    honorTitle: '',
    summary: '',
    narrative: '',
    collectionId: '',
    honorDate: '',
    status: 'draft',
    photos: [],
  };
}

function getStatusBadgeVariant(status) {
  return status === 'published' ? 'success' : 'warning';
}

function formatDateValue(value, locale, emptyLabel) {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale);
}

function PhotoGalleryEditor({
  label,
  photos,
  onChange,
  onUpload,
  uploading,
  canUpload,
  readOnly,
}) {
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
        {!readOnly && canUpload ? (
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

      {!canUpload && !readOnly ? (
        <p className="text-xs text-muted">
          {t('archivePage.gallery.uploadPermissionHint')}
        </p>
      ) : null}

      {!photos?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
          {t('archivePage.gallery.noPhotos')}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {photos.map((photo, index) => (
            <div key={`${photo.publicId || photo.url}-${index}`} className="rounded-2xl border border-border p-3">
              <img
                src={photo.url}
                alt={photo.caption || ''}
                className="mb-3 h-40 w-full rounded-xl object-cover"
              />
              {readOnly ? (
                <p className="text-xs text-muted">{photo.caption || '---'}</p>
              ) : (
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveListItem({
  icon: Icon,
  title,
  subtitle,
  description,
  status,
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  photosCount,
  active = false,
}) {
  const { t } = useI18n();
  const statusKey = `archivePage.status.${status}`;
  const translatedStatus = t(statusKey);
  const statusLabel = translatedStatus === statusKey ? status : translatedStatus;
  const showActions = Boolean((canView && onView) || (canEdit && onEdit) || (canDelete && onDelete));

  return (
    <div
      className={[
        'rounded-2xl border p-4 transition-colors duration-200',
        active ? 'border-primary/40 bg-primary/5' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-heading">{title}</p>
            {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(status)}>{statusLabel}</Badge>
      </div>
      <p className="mt-3 text-sm text-muted">{description || t('archivePage.list.noSummary')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="default">{t('archivePage.list.photosCount', { count: photosCount })}</Badge>
      </div>
      {showActions ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {canView && onView ? (
            <Button type="button" variant="outline" size="sm" icon={Images} onClick={onView}>
              {t('common.actions.view')}
            </Button>
          ) : null}
          {canEdit && onEdit ? (
            <Button type="button" variant="outline" size="sm" icon={Pencil} onClick={onEdit}>
              {t('common.actions.edit')}
            </Button>
          ) : null}
          {canDelete && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Trash2}
              className="text-danger"
              onClick={onDelete}
            >
              {t('common.actions.delete')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CollectionBrowserPanel({
  collection,
  selectedPhotoIndex,
  onSelectPhoto,
  onOpenImage,
  storyCount,
  honoreeCount,
}) {
  const { t } = useI18n();
  const featuredPhoto = collection?.photos?.[selectedPhotoIndex] || collection?.photos?.[0] || null;

  if (!collection) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-page/50 p-5 text-sm text-muted">
        {t('archivePage.collections.browser.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-page/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t('archivePage.collections.browser.label')}
          </p>
          <div>
            <h4 className="text-lg font-semibold text-heading">{collection.title}</h4>
            <p className="mt-1 text-sm text-muted">
              {collection.description || t('archivePage.list.noSummary')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">
            {t('archivePage.collections.browser.mediaCount', { count: collection.photos.length })}
          </Badge>
          <Badge variant="default">
            {t('archivePage.collections.browser.storyCount', { count: storyCount })}
          </Badge>
          <Badge variant="default">
            {t('archivePage.collections.browser.honoreeCount', { count: honoreeCount })}
          </Badge>
        </div>
      </div>

      <p className="text-sm leading-7 text-muted">
        {collection.narrative || t('archivePage.collections.browser.noNarrative')}
      </p>

      {featuredPhoto ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-black/5">
            <img
              src={featuredPhoto.url}
              alt={featuredPhoto.caption || collection.title}
              className="h-72 w-full object-cover md:h-96"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {featuredPhoto.caption || '---'}
            </p>
            <Button type="button" variant="outline" size="sm" icon={ExternalLink} onClick={onOpenImage}>
              {t('archivePage.collections.browser.openImage')}
            </Button>
          </div>
          {collection.photos.length > 1 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {collection.photos.map((photo, index) => (
                <button
                  key={`${photo.publicId || photo.url}-${index}`}
                  type="button"
                  onClick={() => onSelectPhoto(index)}
                  className={[
                    'overflow-hidden rounded-2xl border text-start transition-colors duration-200',
                    index === selectedPhotoIndex ? 'border-primary/50 ring-2 ring-primary/10' : 'border-border',
                  ].join(' ')}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || collection.title}
                    className="h-28 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs text-muted">
                      {photo.caption || '---'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
          {t('archivePage.collections.browser.noMedia')}
        </div>
      )}
    </div>
  );
}

export default function ArchiveManagementPage() {
  const { t, language } = useI18n();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [collectionForm, setCollectionForm] = useState(createEmptyCollectionForm);
  const [storyForm, setStoryForm] = useState(createEmptyStoryForm);
  const [honoreeForm, setHonoreeForm] = useState(createEmptyHonoreeForm);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [activeCollectionPhotoIndex, setActiveCollectionPhotoIndex] = useState(0);

  const tx = useCallback((key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  }, [t]);
  const ta = useCallback((key, values) => t(`archivePage.${key}`, values), [t]);
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const formatArchiveDate = (value) => formatDateValue(value, locale, ta('placeholders.noDate'));

  const canView = hasPermission('ARCHIVE_VIEW');
  const canUpload = hasPermission('ARCHIVE_UPLOAD');
  const canManageCollections = hasPermission('ARCHIVE_COLLECTIONS_MANAGE');
  const canManageStories = hasPermission('ARCHIVE_STORIES_MANAGE');
  const canManageHonorees = hasPermission('ARCHIVE_HONOREES_MANAGE');
  const canPublish = hasPermission('ARCHIVE_PUBLISH');

  const archiveQuery = useQuery({
    queryKey: ['archive', 'manage'],
    queryFn: async () => {
      const { data } = await archiveApi.getManage();
      return data?.data || DEFAULT_ARCHIVE_DATA;
    },
  });

  const archiveData = archiveQuery.data || DEFAULT_ARCHIVE_DATA;

  const statusOptions = useMemo(() => {
    const base = [{ value: 'draft', label: ta('status.draft') }];
    if (canPublish) {
      base.push({ value: 'published', label: ta('status.published') });
    }
    return base;
  }, [canPublish, ta]);

  const collectionOptions = useMemo(
    () => [
      { value: '', label: ta('placeholders.noCollection') },
      ...archiveData.collections.map((collection) => ({
        value: collection.id,
        label: collection.title,
      })),
    ],
    [archiveData.collections, ta]
  );
  const activeCollection = useMemo(
    () =>
      archiveData.collections.find((collection) => collection.id === activeCollectionId) ||
      archiveData.collections[0] ||
      null,
    [activeCollectionId, archiveData.collections]
  );
  const normalizedActiveCollectionPhotoIndex = activeCollection?.photos?.[activeCollectionPhotoIndex]
    ? activeCollectionPhotoIndex
    : 0;
  const activeCollectionPhoto =
    activeCollection?.photos?.[normalizedActiveCollectionPhotoIndex] || null;
  const activeCollectionStoryCount = useMemo(
    () => archiveData.stories.filter((story) => story.collectionId === activeCollection?.id).length,
    [activeCollection?.id, archiveData.stories]
  );
  const activeCollectionHonoreeCount = useMemo(
    () => archiveData.honorees.filter((honoree) => honoree.collectionId === activeCollection?.id).length,
    [activeCollection?.id, archiveData.honorees]
  );

  const syncPayload = (payload) => {
    queryClient.setQueryData(['archive', 'manage'], payload);
  };

  const resetCollectionForm = () => setCollectionForm(createEmptyCollectionForm());
  const resetStoryForm = () => setStoryForm(createEmptyStoryForm());
  const resetHonoreeForm = () => setHonoreeForm(createEmptyHonoreeForm());

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
      resetCollectionForm();
      toast.success(ta('messages.collectionSaved'));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await archiveApi.removeCollection(id);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      syncPayload(payload);
      if (collectionForm.id && !payload.collections.some((entry) => entry.id === collectionForm.id)) {
        resetCollectionForm();
      }
      toast.success(ta('messages.collectionDeleted'));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const saveStoryMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload.id) {
        const { data } = await archiveApi.updateStory(payload.id, payload);
        return data?.data || null;
      }
      const { data } = await archiveApi.createStory(payload);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      syncPayload(payload);
      resetStoryForm();
      toast.success(ta('messages.storySaved'));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await archiveApi.removeStory(id);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      syncPayload(payload);
      if (storyForm.id && !payload.stories.some((entry) => entry.id === storyForm.id)) {
        resetStoryForm();
      }
      toast.success(ta('messages.storyDeleted'));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const saveHonoreeMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload.id) {
        const { data } = await archiveApi.updateHonoree(payload.id, payload);
        return data?.data || null;
      }
      const { data } = await archiveApi.createHonoree(payload);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      syncPayload(payload);
      resetHonoreeForm();
      toast.success(ta('messages.honoreeSaved'));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const deleteHonoreeMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await archiveApi.removeHonoree(id);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      syncPayload(payload);
      if (honoreeForm.id && !payload.honorees.some((entry) => entry.id === honoreeForm.id)) {
        resetHonoreeForm();
      }
      toast.success(ta('messages.honoreeDeleted'));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const uploadArchivePhoto = async (file) => uploadImageMutation.mutateAsync(file);
  const openCollectionBrowser = (collection) => {
    setActiveCollectionId(collection.id);
    setActiveCollectionPhotoIndex(0);
  };

  const selectCollectionForEdit = (collection) => {
    if (collection.status === 'published' && !canPublish) {
      return;
    }

    openCollectionBrowser(collection);
    setCollectionForm({
      id: collection.id,
      title: collection.title || '',
      slug: collection.slug || '',
      description: collection.description || '',
      narrative: collection.narrative || '',
      status: collection.status || 'draft',
      photos: collection.photos || [],
    });
  };

  const selectStoryForEdit = (story) => {
    if (story.status === 'published' && !canPublish) {
      return;
    }

    setStoryForm({
      id: story.id,
      title: story.title || '',
      slug: story.slug || '',
      summary: story.summary || '',
      narrative: story.narrative || '',
      collectionId: story.collectionId || '',
      eventDate: story.eventDate || '',
      status: story.status || 'draft',
      photos: story.photos || [],
    });
  };

  const selectHonoreeForEdit = (honoree) => {
    if (honoree.status === 'published' && !canPublish) {
      return;
    }

    setHonoreeForm({
      id: honoree.id,
      fullName: honoree.fullName || '',
      honorTitle: honoree.honorTitle || '',
      summary: honoree.summary || '',
      narrative: honoree.narrative || '',
      collectionId: honoree.collectionId || '',
      honorDate: honoree.honorDate || '',
      status: honoree.status || 'draft',
      photos: honoree.photos || [],
    });
  };

  const confirmDeleteCollection = (collection) => {
    if (collection.status === 'published' && !canPublish) {
      return;
    }
    if (window.confirm(ta('confirmations.deleteCollection', { title: collection.title }))) {
      deleteCollectionMutation.mutate(collection.id);
    }
  };

  const confirmDeleteStory = (story) => {
    if (story.status === 'published' && !canPublish) {
      return;
    }
    if (window.confirm(ta('confirmations.deleteStory', { title: story.title }))) {
      deleteStoryMutation.mutate(story.id);
    }
  };

  const confirmDeleteHonoree = (honoree) => {
    if (honoree.status === 'published' && !canPublish) {
      return;
    }
    if (window.confirm(ta('confirmations.deleteHonoree', { name: honoree.fullName }))) {
      deleteHonoreeMutation.mutate(honoree.id);
    }
  };

  const handleCollectionSubmit = () => {
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

  const handleStorySubmit = () => {
    saveStoryMutation.mutate({
      id: storyForm.id,
      title: storyForm.title,
      slug: storyForm.slug,
      summary: storyForm.summary,
      narrative: storyForm.narrative,
      collectionId: storyForm.collectionId || null,
      eventDate: storyForm.eventDate || null,
      status: storyForm.status,
      photos: storyForm.photos,
    });
  };

  const handleHonoreeSubmit = () => {
    saveHonoreeMutation.mutate({
      id: honoreeForm.id,
      fullName: honoreeForm.fullName,
      honorTitle: honoreeForm.honorTitle,
      summary: honoreeForm.summary,
      narrative: honoreeForm.narrative,
      collectionId: honoreeForm.collectionId || null,
      honorDate: honoreeForm.honorDate || null,
      status: honoreeForm.status,
      photos: honoreeForm.photos,
    });
  };

  if (archiveQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-6 pb-10">
        <Breadcrumbs
          items={[
            { label: tx('shared.dashboard', 'Dashboard'), href: '/dashboard' },
            { label: ta('title') },
          ]}
        />
        <PageHeader
          title={ta('title')}
          subtitle={ta('loadingSubtitle')}
        />
      </div>
    );
  }

  if (archiveQuery.isError) {
    return (
      <div className="animate-fade-in space-y-6 pb-10">
        <Breadcrumbs
          items={[
            { label: tx('shared.dashboard', 'Dashboard'), href: '/dashboard' },
            { label: ta('title') },
          ]}
        />
        <PageHeader
          title={ta('title')}
          subtitle={ta('loadErrorSubtitle')}
        />
        <Card>
          <p className="text-sm text-danger">{normalizeApiError(archiveQuery.error).message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: tx('shared.dashboard', 'Dashboard'), href: '/dashboard' },
          { label: ta('title') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={ta('eyebrow')}
        title={ta('title')}
        subtitle={ta('subtitle')}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => archiveQuery.refetch()}>
              {ta('actions.refresh')}
            </Button>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">{ta('stats.collections')}</p>
          <p className="mt-2 text-3xl font-bold text-heading">{archiveData.counts.collections}</p>
          <p className="mt-1 text-xs text-muted">
            {ta('stats.published', { count: archiveData.counts.publishedCollections })}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">{ta('stats.stories')}</p>
          <p className="mt-2 text-3xl font-bold text-heading">{archiveData.counts.stories}</p>
          <p className="mt-1 text-xs text-muted">
            {ta('stats.published', { count: archiveData.counts.publishedStories })}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">{ta('stats.honorees')}</p>
          <p className="mt-2 text-3xl font-bold text-heading">{archiveData.counts.honorees}</p>
          <p className="mt-1 text-xs text-muted">
            {ta('stats.published', { count: archiveData.counts.publishedHonorees })}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={ta('collections.title')}
          subtitle={ta('collections.subtitle')}
        />
        <div className={`grid gap-6 ${canManageCollections ? 'xl:grid-cols-[minmax(0,400px)_1fr]' : ''}`}>
          {canManageCollections ? (
            <div className="space-y-4 rounded-2xl border border-border bg-page/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-heading">
                  {collectionForm.id ? ta('collections.form.editTitle') : ta('collections.form.newTitle')}
                </p>
                {collectionForm.id ? (
                  <Button type="button" variant="ghost" size="sm" onClick={resetCollectionForm}>
                    {t('common.actions.cancel')}
                  </Button>
                ) : null}
              </div>
              <Input
                label={ta('collections.form.title')}
                value={collectionForm.title}
                onChange={(event) =>
                  setCollectionForm((current) => ({ ...current, title: event.target.value }))
                }
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
              <PhotoGalleryEditor
                label={ta('collections.form.photos')}
                photos={collectionForm.photos}
                onChange={(photos) =>
                  setCollectionForm((current) => ({ ...current, photos }))
                }
                onUpload={uploadArchivePhoto}
                uploading={uploadImageMutation.isPending}
                canUpload={canUpload}
                readOnly={false}
              />
              <Button
                type="button"
                icon={Save}
                loading={saveCollectionMutation.isPending}
                onClick={handleCollectionSubmit}
              >
                {collectionForm.id ? ta('actions.updateCollection') : ta('actions.createCollection')}
              </Button>
            </div>
          ) : null}

          <div className="space-y-4">
            {archiveData.collections.length ? (
              <CollectionBrowserPanel
                collection={activeCollection}
                selectedPhotoIndex={normalizedActiveCollectionPhotoIndex}
                onSelectPhoto={setActiveCollectionPhotoIndex}
                onOpenImage={() => {
                  if (activeCollectionPhoto?.url) {
                    window.open(activeCollectionPhoto.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                storyCount={activeCollectionStoryCount}
                honoreeCount={activeCollectionHonoreeCount}
              />
            ) : null}
            {!archiveData.collections.length ? (
              <EmptyState
                icon={FolderOpen}
                title={ta('collections.empty.title')}
                description={ta('collections.empty.description')}
              />
            ) : (
              archiveData.collections.map((collection) => (
                <ArchiveListItem
                  key={collection.id}
                  icon={FolderOpen}
                  title={collection.title}
                  subtitle={ta('collections.list.itemSubtitle', {
                    stories: collection.storyCount,
                    honorees: collection.honoreeCount,
                  })}
                  description={collection.description || collection.narrative}
                  status={collection.status}
                  photosCount={collection.photos.length}
                  canView={canView}
                  canEdit={canManageCollections && (canPublish || collection.status !== 'published')}
                  canDelete={canManageCollections && (canPublish || collection.status !== 'published')}
                  onView={() => openCollectionBrowser(collection)}
                  onEdit={() => selectCollectionForEdit(collection)}
                  onDelete={() => confirmDeleteCollection(collection)}
                  active={activeCollection?.id === collection.id}
                />
              ))
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={ta('stories.title')}
          subtitle={ta('stories.subtitle')}
        />
        <div className={`grid gap-6 ${canManageStories ? 'xl:grid-cols-[minmax(0,400px)_1fr]' : ''}`}>
          {canManageStories ? (
            <div className="space-y-4 rounded-2xl border border-border bg-page/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-heading">
                  {storyForm.id ? ta('stories.form.editTitle') : ta('stories.form.newTitle')}
                </p>
                {storyForm.id ? (
                  <Button type="button" variant="ghost" size="sm" onClick={resetStoryForm}>
                    {t('common.actions.cancel')}
                  </Button>
                ) : null}
              </div>
              <Input
                label={ta('stories.form.title')}
                value={storyForm.title}
                onChange={(event) =>
                  setStoryForm((current) => ({ ...current, title: event.target.value }))
                }
                containerClassName="!mb-0"
              />
              <Input
                label={ta('stories.form.slug')}
                value={storyForm.slug}
                onChange={(event) =>
                  setStoryForm((current) => ({ ...current, slug: event.target.value }))
                }
                hint={ta('stories.form.slugHint')}
                containerClassName="!mb-0"
              />
              <Select
                label={ta('stories.form.collection')}
                value={storyForm.collectionId}
                options={collectionOptions}
                onChange={(event) =>
                  setStoryForm((current) => ({ ...current, collectionId: event.target.value }))
                }
              />
              <Input
                label={ta('stories.form.eventDate')}
                type="date"
                value={storyForm.eventDate}
                onChange={(event) =>
                  setStoryForm((current) => ({ ...current, eventDate: event.target.value }))
                }
                containerClassName="!mb-0"
              />
              <TextArea
                label={ta('stories.form.summary')}
                value={storyForm.summary}
                onChange={(event) =>
                  setStoryForm((current) => ({ ...current, summary: event.target.value }))
                }
                rows={3}
                containerClassName="!mb-0"
              />
              <TextArea
                label={ta('stories.form.narrative')}
                value={storyForm.narrative}
                onChange={(event) =>
                  setStoryForm((current) => ({ ...current, narrative: event.target.value }))
                }
                rows={6}
                containerClassName="!mb-0"
              />
              <Select
                label={ta('stories.form.status')}
                value={storyForm.status}
                options={statusOptions}
                onChange={(event) =>
                  setStoryForm((current) => ({ ...current, status: event.target.value }))
                }
              />
              <PhotoGalleryEditor
                label={ta('stories.form.photos')}
                photos={storyForm.photos}
                onChange={(photos) => setStoryForm((current) => ({ ...current, photos }))}
                onUpload={uploadArchivePhoto}
                uploading={uploadImageMutation.isPending}
                canUpload={canUpload}
                readOnly={false}
              />
              <Button
                type="button"
                icon={Save}
                loading={saveStoryMutation.isPending}
                onClick={handleStorySubmit}
              >
                {storyForm.id ? ta('actions.updateStory') : ta('actions.createStory')}
              </Button>
            </div>
          ) : null}

          <div className="space-y-4">
            {!archiveData.stories.length ? (
              <EmptyState
                icon={FileText}
                title={ta('stories.empty.title')}
                description={ta('stories.empty.description')}
              />
            ) : (
              archiveData.stories.map((story) => (
                <ArchiveListItem
                  key={story.id}
                  icon={FileText}
                  title={story.title}
                  subtitle={[
                    story.collectionTitle || ta('placeholders.noCollection'),
                    formatArchiveDate(story.eventDate),
                  ].join(' | ')}
                  description={story.summary || story.narrative}
                  status={story.status}
                  photosCount={story.photos.length}
                  canEdit={canManageStories && (canPublish || story.status !== 'published')}
                  canDelete={canManageStories && (canPublish || story.status !== 'published')}
                  onEdit={() => selectStoryForEdit(story)}
                  onDelete={() => confirmDeleteStory(story)}
                />
              ))
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={ta('honorees.title')}
          subtitle={ta('honorees.subtitle')}
        />
        <div className={`grid gap-6 ${canManageHonorees ? 'xl:grid-cols-[minmax(0,400px)_1fr]' : ''}`}>
          {canManageHonorees ? (
            <div className="space-y-4 rounded-2xl border border-border bg-page/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-heading">
                  {honoreeForm.id ? ta('honorees.form.editTitle') : ta('honorees.form.newTitle')}
                </p>
                {honoreeForm.id ? (
                  <Button type="button" variant="ghost" size="sm" onClick={resetHonoreeForm}>
                    {t('common.actions.cancel')}
                  </Button>
                ) : null}
              </div>
              <Input
                label={ta('honorees.form.fullName')}
                value={honoreeForm.fullName}
                onChange={(event) =>
                  setHonoreeForm((current) => ({ ...current, fullName: event.target.value }))
                }
                containerClassName="!mb-0"
              />
              <Input
                label={ta('honorees.form.honorTitle')}
                value={honoreeForm.honorTitle}
                onChange={(event) =>
                  setHonoreeForm((current) => ({ ...current, honorTitle: event.target.value }))
                }
                containerClassName="!mb-0"
              />
              <Select
                label={ta('honorees.form.collection')}
                value={honoreeForm.collectionId}
                options={collectionOptions}
                onChange={(event) =>
                  setHonoreeForm((current) => ({ ...current, collectionId: event.target.value }))
                }
              />
              <Input
                label={ta('honorees.form.honorDate')}
                type="date"
                value={honoreeForm.honorDate}
                onChange={(event) =>
                  setHonoreeForm((current) => ({ ...current, honorDate: event.target.value }))
                }
                containerClassName="!mb-0"
              />
              <TextArea
                label={ta('honorees.form.summary')}
                value={honoreeForm.summary}
                onChange={(event) =>
                  setHonoreeForm((current) => ({ ...current, summary: event.target.value }))
                }
                rows={3}
                containerClassName="!mb-0"
              />
              <TextArea
                label={ta('honorees.form.narrative')}
                value={honoreeForm.narrative}
                onChange={(event) =>
                  setHonoreeForm((current) => ({ ...current, narrative: event.target.value }))
                }
                rows={6}
                containerClassName="!mb-0"
              />
              <Select
                label={ta('honorees.form.status')}
                value={honoreeForm.status}
                options={statusOptions}
                onChange={(event) =>
                  setHonoreeForm((current) => ({ ...current, status: event.target.value }))
                }
              />
              <PhotoGalleryEditor
                label={ta('honorees.form.photos')}
                photos={honoreeForm.photos}
                onChange={(photos) => setHonoreeForm((current) => ({ ...current, photos }))}
                onUpload={uploadArchivePhoto}
                uploading={uploadImageMutation.isPending}
                canUpload={canUpload}
                readOnly={false}
              />
              <Button
                type="button"
                icon={Save}
                loading={saveHonoreeMutation.isPending}
                onClick={handleHonoreeSubmit}
              >
                {honoreeForm.id ? ta('actions.updateHonoree') : ta('actions.createHonoree')}
              </Button>
            </div>
          ) : null}

          <div className="space-y-4">
            {!archiveData.honorees.length ? (
              <EmptyState
                icon={Award}
                title={ta('honorees.empty.title')}
                description={ta('honorees.empty.description')}
              />
            ) : (
              archiveData.honorees.map((honoree) => (
                <ArchiveListItem
                  key={honoree.id}
                  icon={Award}
                  title={honoree.fullName}
                  subtitle={[
                    honoree.honorTitle || ta('placeholders.noTitle'),
                    honoree.collectionTitle || ta('placeholders.noCollection'),
                    formatArchiveDate(honoree.honorDate),
                  ].join(' | ')}
                  description={honoree.summary || honoree.narrative}
                  status={honoree.status}
                  photosCount={honoree.photos.length}
                  canEdit={canManageHonorees && (canPublish || honoree.status !== 'published')}
                  canDelete={canManageHonorees && (canPublish || honoree.status !== 'published')}
                  onEdit={() => selectHonoreeForEdit(honoree)}
                  onDelete={() => confirmDeleteHonoree(honoree)}
                />
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
