import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  FileText,
  FolderOpen,
  ImagePlus,
  Pencil,
  Save,
  ShieldCheck,
  ShieldOff,
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

function formatDateValue(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function PermissionPill({ label, enabled }) {
  return (
    <div className="rounded-2xl border border-border bg-page/60 p-4">
      <div className="flex items-center gap-3">
        <div
          className={[
            'flex h-10 w-10 items-center justify-center rounded-2xl',
            enabled ? 'bg-success-light text-success' : 'bg-danger-light text-danger',
          ].join(' ')}
        >
          {enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-heading">{label}</p>
          <p className="text-xs text-muted">{enabled ? 'Enabled' : 'Not granted'}</p>
        </div>
      </div>
    </div>
  );
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
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file.');
      return;
    }

    try {
      const uploaded = await onUpload(file);
      if (uploaded?.url) {
        onChange([...(photos || []), uploaded]);
      }
    } catch (_error) {
      // Upload errors are already handled by the mutation.
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
              Upload image
            </Button>
          </>
        ) : null}
      </div>

      {!canUpload && !readOnly ? (
        <p className="text-xs text-muted">
          You can edit details here, but image uploads require the archive upload permission.
        </p>
      ) : null}

      {!photos?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
          No photos added yet.
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
                <p className="text-xs text-muted">{photo.caption || 'No caption'}</p>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Caption"
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
                    Remove photo
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
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  photosCount,
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
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
        <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
      </div>
      <p className="mt-3 text-sm text-muted">{description || 'No summary provided yet.'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="default">{photosCount} photos</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" icon={Pencil} disabled={!canEdit} onClick={onEdit}>
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={Trash2}
          className="text-danger"
          disabled={!canDelete}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function ArchiveManagementPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [collectionForm, setCollectionForm] = useState(createEmptyCollectionForm);
  const [storyForm, setStoryForm] = useState(createEmptyStoryForm);
  const [honoreeForm, setHonoreeForm] = useState(createEmptyHonoreeForm);

  const tx = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

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
    const base = [{ value: 'draft', label: 'Draft' }];
    if (canPublish) {
      base.push({ value: 'published', label: 'Published' });
    }
    return base;
  }, [canPublish]);

  const collectionOptions = useMemo(
    () => [
      { value: '', label: 'No collection' },
      ...archiveData.collections.map((collection) => ({
        value: collection.id,
        label: collection.title,
      })),
    ],
    [archiveData.collections]
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
      toast.success('Collection saved successfully.');
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
      toast.success('Collection deleted successfully.');
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
      toast.success('Story saved successfully.');
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
      toast.success('Story deleted successfully.');
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
      toast.success('Honoree entry saved successfully.');
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
      toast.success('Honoree entry deleted successfully.');
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const uploadArchivePhoto = async (file) => uploadImageMutation.mutateAsync(file);

  const selectCollectionForEdit = (collection) => {
    if (collection.status === 'published' && !canPublish) {
      toast.error('Published collections can only be edited by users with archive publish permission.');
      return;
    }

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
      toast.error('Published stories can only be edited by users with archive publish permission.');
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
      toast.error('Published honoree entries can only be edited by users with archive publish permission.');
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
      toast.error('Published collections require archive publish permission to delete.');
      return;
    }
    if (window.confirm(`Delete collection "${collection.title}"?`)) {
      deleteCollectionMutation.mutate(collection.id);
    }
  };

  const confirmDeleteStory = (story) => {
    if (story.status === 'published' && !canPublish) {
      toast.error('Published stories require archive publish permission to delete.');
      return;
    }
    if (window.confirm(`Delete story "${story.title}"?`)) {
      deleteStoryMutation.mutate(story.id);
    }
  };

  const confirmDeleteHonoree = (honoree) => {
    if (honoree.status === 'published' && !canPublish) {
      toast.error('Published honoree entries require archive publish permission to delete.');
      return;
    }
    if (window.confirm(`Delete honoree entry for "${honoree.fullName}"?`)) {
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

  const permissionCards = [
    { label: 'Archive view', enabled: canView },
    { label: 'Archive upload', enabled: canUpload },
    { label: 'Collections manage', enabled: canManageCollections },
    { label: 'Stories manage', enabled: canManageStories },
    { label: 'Honorees manage', enabled: canManageHonorees },
    { label: 'Archive publish', enabled: canPublish },
  ];

  if (archiveQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-6 pb-10">
        <Breadcrumbs
          items={[
            { label: tx('shared.dashboard', 'Dashboard'), href: '/dashboard' },
            { label: 'Archive' },
          ]}
        />
        <PageHeader
          title="Archive"
          subtitle="Loading archive workspace and permission rules..."
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
            { label: 'Archive' },
          ]}
        />
        <PageHeader
          title="Archive"
          subtitle="The archive workspace could not be loaded."
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
          { label: 'Archive' },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow="Permissions-first content workspace"
        title="Archive"
        subtitle="Collections, photo stories, and honored people all live here, with separate permissions for viewing, uploads, section management, and publishing."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => archiveQuery.refetch()}>
              Refresh
            </Button>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Collections</p>
          <p className="mt-2 text-3xl font-bold text-heading">{archiveData.counts.collections}</p>
          <p className="mt-1 text-xs text-muted">{archiveData.counts.publishedCollections} published</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Stories</p>
          <p className="mt-2 text-3xl font-bold text-heading">{archiveData.counts.stories}</p>
          <p className="mt-1 text-xs text-muted">{archiveData.counts.publishedStories} published</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Honorees</p>
          <p className="mt-2 text-3xl font-bold text-heading">{archiveData.counts.honorees}</p>
          <p className="mt-1 text-xs text-muted">{archiveData.counts.publishedHonorees} published</p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Collections"
          subtitle="Collections are the archive containers. Stories and honored people can reference them, and collections can keep their own photo sets and narrative."
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,400px)_1fr]">
          <div className="space-y-4 rounded-2xl border border-border bg-page/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-heading">
                {collectionForm.id ? 'Edit collection' : 'New collection'}
              </p>
              {collectionForm.id ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetCollectionForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
            {canManageCollections ? (
              <>
                <Input
                  label="Collection title"
                  value={collectionForm.title}
                  onChange={(event) =>
                    setCollectionForm((current) => ({ ...current, title: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <Input
                  label="Slug"
                  value={collectionForm.slug}
                  onChange={(event) =>
                    setCollectionForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  hint="Leave blank to generate from the title."
                  containerClassName="!mb-0"
                />
                <TextArea
                  label="Short description"
                  value={collectionForm.description}
                  onChange={(event) =>
                    setCollectionForm((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={3}
                  containerClassName="!mb-0"
                />
                <TextArea
                  label="Narrative"
                  value={collectionForm.narrative}
                  onChange={(event) =>
                    setCollectionForm((current) => ({ ...current, narrative: event.target.value }))
                  }
                  rows={6}
                  containerClassName="!mb-0"
                />
                <Select
                  label="Status"
                  value={collectionForm.status}
                  options={statusOptions}
                  onChange={(event) =>
                    setCollectionForm((current) => ({ ...current, status: event.target.value }))
                  }
                />
                <PhotoGalleryEditor
                  label="Collection photos"
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
                  {collectionForm.id ? 'Update collection' : 'Create collection'}
                </Button>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                You can view archive collections, but collection editing is hidden until the
                archive collections permission is granted.
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!archiveData.collections.length ? (
              <EmptyState
                icon={FolderOpen}
                title="No collections yet"
                description="Create the first collection to start organizing archive photos and narratives."
              />
            ) : (
              archiveData.collections.map((collection) => (
                <ArchiveListItem
                  key={collection.id}
                  icon={FolderOpen}
                  title={collection.title}
                  subtitle={`${collection.storyCount} stories, ${collection.honoreeCount} honorees`}
                  description={collection.description || collection.narrative}
                  status={collection.status}
                  photosCount={collection.photos.length}
                  canEdit={canManageCollections && (canPublish || collection.status !== 'published')}
                  canDelete={canManageCollections && (canPublish || collection.status !== 'published')}
                  onEdit={() => selectCollectionForEdit(collection)}
                  onDelete={() => confirmDeleteCollection(collection)}
                />
              ))
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Stories"
          subtitle="Stories keep their own narrative and photos. Attach them to a collection when you want them grouped in a larger archive track."
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,400px)_1fr]">
          <div className="space-y-4 rounded-2xl border border-border bg-page/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-heading">
                {storyForm.id ? 'Edit story' : 'New story'}
              </p>
              {storyForm.id ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetStoryForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
            {canManageStories ? (
              <>
                <Input
                  label="Story title"
                  value={storyForm.title}
                  onChange={(event) =>
                    setStoryForm((current) => ({ ...current, title: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <Input
                  label="Slug"
                  value={storyForm.slug}
                  onChange={(event) =>
                    setStoryForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  hint="Leave blank to generate from the story title."
                  containerClassName="!mb-0"
                />
                <Select
                  label="Collection"
                  value={storyForm.collectionId}
                  options={collectionOptions}
                  onChange={(event) =>
                    setStoryForm((current) => ({ ...current, collectionId: event.target.value }))
                  }
                />
                <Input
                  label="Event date"
                  type="date"
                  value={storyForm.eventDate}
                  onChange={(event) =>
                    setStoryForm((current) => ({ ...current, eventDate: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <TextArea
                  label="Summary"
                  value={storyForm.summary}
                  onChange={(event) =>
                    setStoryForm((current) => ({ ...current, summary: event.target.value }))
                  }
                  rows={3}
                  containerClassName="!mb-0"
                />
                <TextArea
                  label="Narrative"
                  value={storyForm.narrative}
                  onChange={(event) =>
                    setStoryForm((current) => ({ ...current, narrative: event.target.value }))
                  }
                  rows={6}
                  containerClassName="!mb-0"
                />
                <Select
                  label="Status"
                  value={storyForm.status}
                  options={statusOptions}
                  onChange={(event) =>
                    setStoryForm((current) => ({ ...current, status: event.target.value }))
                  }
                />
                <PhotoGalleryEditor
                  label="Story photos"
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
                  {storyForm.id ? 'Update story' : 'Create story'}
                </Button>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                You can view stories here, but story creation and editing require the archive stories
                permission.
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!archiveData.stories.length ? (
              <EmptyState
                icon={FileText}
                title="No stories yet"
                description="Archive stories will appear here once the first narrative is created."
              />
            ) : (
              archiveData.stories.map((story) => (
                <ArchiveListItem
                  key={story.id}
                  icon={FileText}
                  title={story.title}
                  subtitle={[
                    story.collectionTitle || 'No collection',
                    formatDateValue(story.eventDate),
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
          title="Honored People"
          subtitle="Use this section for people being honored, with their own photos, context, and optional collection placement."
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,400px)_1fr]">
          <div className="space-y-4 rounded-2xl border border-border bg-page/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-heading">
                {honoreeForm.id ? 'Edit honoree entry' : 'New honoree entry'}
              </p>
              {honoreeForm.id ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetHonoreeForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
            {canManageHonorees ? (
              <>
                <Input
                  label="Full name"
                  value={honoreeForm.fullName}
                  onChange={(event) =>
                    setHonoreeForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <Input
                  label="Honor title"
                  value={honoreeForm.honorTitle}
                  onChange={(event) =>
                    setHonoreeForm((current) => ({ ...current, honorTitle: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <Select
                  label="Collection"
                  value={honoreeForm.collectionId}
                  options={collectionOptions}
                  onChange={(event) =>
                    setHonoreeForm((current) => ({ ...current, collectionId: event.target.value }))
                  }
                />
                <Input
                  label="Honor date"
                  type="date"
                  value={honoreeForm.honorDate}
                  onChange={(event) =>
                    setHonoreeForm((current) => ({ ...current, honorDate: event.target.value }))
                  }
                  containerClassName="!mb-0"
                />
                <TextArea
                  label="Summary"
                  value={honoreeForm.summary}
                  onChange={(event) =>
                    setHonoreeForm((current) => ({ ...current, summary: event.target.value }))
                  }
                  rows={3}
                  containerClassName="!mb-0"
                />
                <TextArea
                  label="Narrative"
                  value={honoreeForm.narrative}
                  onChange={(event) =>
                    setHonoreeForm((current) => ({ ...current, narrative: event.target.value }))
                  }
                  rows={6}
                  containerClassName="!mb-0"
                />
                <Select
                  label="Status"
                  value={honoreeForm.status}
                  options={statusOptions}
                  onChange={(event) =>
                    setHonoreeForm((current) => ({ ...current, status: event.target.value }))
                  }
                />
                <PhotoGalleryEditor
                  label="Honoree photos"
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
                  {honoreeForm.id ? 'Update honoree entry' : 'Create honoree entry'}
                </Button>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                You can view honoree entries here, but this section stays read-only until the
                archive honorees permission is granted.
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!archiveData.honorees.length ? (
              <EmptyState
                icon={Award}
                title="No honoree entries yet"
                description="Add the first honored person entry when the archive is ready to record recognitions."
              />
            ) : (
              archiveData.honorees.map((honoree) => (
                <ArchiveListItem
                  key={honoree.id}
                  icon={Award}
                  title={honoree.fullName}
                  subtitle={[
                    honoree.honorTitle || 'No title',
                    honoree.collectionTitle || 'No collection',
                    formatDateValue(honoree.honorDate),
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
