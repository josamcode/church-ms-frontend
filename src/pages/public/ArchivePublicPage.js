import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Images,
  Library,
  Loader2,
  X,
} from 'lucide-react';

import { archiveApi } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/i18n';

const DEFAULT_PUBLIC_ARCHIVE = {
  collections: [],
  stories: [],
  honorees: [],
  counts: {
    collections: 0,
  },
};

/**
 * Lightbox that only renders a single collection's images. Images are never
 * mounted until a collection is opened, so a large catalogue is not rendered
 * up front.
 */
function ArchiveLightbox({ collection, photoIndex, onClose, onPrev, onNext, onSelectPhoto, tf }) {
  const photos = collection?.photos || [];
  const activePhoto = photos[photoIndex] || null;

  useEffect(() => {
    if (!activePhoto) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrev();
      if (event.key === 'ArrowRight') onNext();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhoto, onClose, onNext, onPrev]);

  if (!activePhoto) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-xl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={collection?.title || tf('archive.public.title', 'Church archive')}
    >
      <div
        className="flex h-full flex-col px-4 py-4 md:px-8 md:py-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-white">{collection?.title}</p>
            <p className="mt-1 text-sm text-white/70">
              {photoIndex + 1} / {photos.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label={tf('common.actions.close', 'Close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center">
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={onPrev}
                className="absolute start-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:start-4"
                aria-label={tf('archive.public.previous', 'Previous image')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="absolute end-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:end-4"
                aria-label={tf('archive.public.next', 'Next image')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <img
            src={activePhoto.url}
            alt={activePhoto.caption || collection?.title || ''}
            loading="lazy"
            className="max-h-full max-w-full rounded-[32px] object-contain shadow-2xl"
          />
        </div>

        <div className="mt-4">
          <p className="text-center text-sm text-white/75">
            {activePhoto.caption || collection?.title || '---'}
          </p>
          {photos.length > 1 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={`${photo.storageKey || photo.url}-${index}`}
                  type="button"
                  onClick={() => onSelectPhoto(index)}
                  className={[
                    'h-20 w-24 shrink-0 overflow-hidden rounded-2xl border transition-all duration-200',
                    index === photoIndex
                      ? 'border-white shadow-lg ring-2 ring-white/30'
                      : 'border-white/10 opacity-70 hover:opacity-100',
                  ].join(' ')}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || collection?.title || ''}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CollectionCoverCard({ collection, onOpen, tf }) {
  const coverPhoto = collection.photos?.[0] || null;
  const photoCount = collection.photos?.length || 0;

  return (
    <button type="button" onClick={() => onOpen(collection)} className="group w-full text-start">
      <div className="h-full overflow-hidden rounded-[28px] border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg">
        <div className="relative h-60 overflow-hidden bg-surface-alt">
          {coverPhoto ? (
            <>
              <img
                src={coverPhoto.url}
                alt={coverPhoto.caption || collection.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-surface-alt text-primary">
              <FolderOpen className="h-12 w-12" />
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex justify-end p-4">
            <Badge variant="default">
              {tf('archive.public.photosCount', `${photoCount} photos`, { count: photoCount })}
            </Badge>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className={`text-lg font-semibold ${coverPhoto ? 'text-white' : 'text-heading'}`}>
              {collection.title}
            </p>
            {collection.description ? (
              <p
                className={`mt-1.5 line-clamp-2 text-sm ${coverPhoto ? 'text-white/85' : 'text-muted'}`}
              >
                {collection.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Images className="h-3.5 w-3.5" />
            {tf('archive.public.openCollection', 'Open collection')}
          </span>
          <Badge variant="default">
            {tf('archive.public.photosCount', `${photoCount} photos`, { count: photoCount })}
          </Badge>
        </div>
      </div>
    </button>
  );
}

export default function ArchivePublicPage() {
  const { t } = useI18n();
  const tf = (key, fallback, values) => {
    const value = t(key, values);
    return value === key ? fallback : value;
  };

  const [openCollectionId, setOpenCollectionId] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const archiveQuery = useQuery({
    queryKey: ['archive', 'public'],
    queryFn: async () => {
      const { data } = await archiveApi.getPublic();
      return data?.data || DEFAULT_PUBLIC_ARCHIVE;
    },
    staleTime: 60000,
  });

  const archiveData = archiveQuery.data || DEFAULT_PUBLIC_ARCHIVE;

  // Only collections that actually have images are worth showing as covers.
  const collections = useMemo(
    () =>
      (Array.isArray(archiveData.collections) ? archiveData.collections : []).map((collection) => ({
        ...collection,
        photos: Array.isArray(collection.photos) ? collection.photos : [],
      })),
    [archiveData.collections]
  );

  const openCollection = useMemo(
    () => collections.find((collection) => collection.id === openCollectionId) || null,
    [collections, openCollectionId]
  );

  const openLightbox = useCallback((collection) => {
    if (!collection?.photos?.length) return;
    setOpenCollectionId(collection.id);
    setPhotoIndex(0);
  }, []);
  const closeLightbox = useCallback(() => {
    setOpenCollectionId(null);
    setPhotoIndex(0);
  }, []);
  const goPrev = useCallback(() => {
    const total = openCollection?.photos?.length || 0;
    if (!total) return;
    setPhotoIndex((current) => (current - 1 + total) % total);
  }, [openCollection?.photos?.length]);
  const goNext = useCallback(() => {
    const total = openCollection?.photos?.length || 0;
    if (!total) return;
    setPhotoIndex((current) => (current + 1) % total);
  }, [openCollection?.photos?.length]);

  const normalizedPhotoIndex = openCollection?.photos?.[photoIndex] ? photoIndex : 0;

  return (
    <div className="relative overflow-hidden bg-page">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <section className="page-container relative py-28">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Library className="h-3.5 w-3.5" />
              {tf('archive.public.eyebrow', 'Church archive')}
            </span>
            <h1 className="text-4xl font-black tracking-tight text-heading sm:text-5xl">
              {tf('archive.public.title', 'Moments and memories from our church')}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted">
              {tf(
                'archive.public.subtitle',
                'Browse our published collections. Open any collection to view its photos.'
              )}
            </p>
          </div>

          {archiveQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-[28px] border border-border bg-surface-alt/50"
                />
              ))}
            </div>
          ) : archiveQuery.isError ? (
            <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-card">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Library className="h-7 w-7" />
              </span>
              <div>
                <p className="text-base font-bold text-heading">
                  {tf('archive.public.errorTitle', 'The archive could not be loaded')}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {tf('archive.public.errorBody', 'Please try again in a little while.')}
                </p>
              </div>
              <Button
                variant="outline"
                icon={Loader2}
                loading={archiveQuery.isFetching}
                onClick={() => archiveQuery.refetch()}
              >
                {tf('archive.public.retry', 'Try again')}
              </Button>
            </div>
          ) : !collections.length ? (
            <div className="flex flex-col items-center gap-4 rounded-[28px] border border-dashed border-border bg-surface px-6 py-16 text-center shadow-card">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FolderOpen className="h-8 w-8" />
              </span>
              <div>
                <p className="text-base font-bold text-heading">
                  {tf('archive.public.emptyTitle', 'No collections yet')}
                </p>
                <p className="mt-1 max-w-md text-sm text-muted">
                  {tf(
                    'archive.public.emptyBody',
                    'Published archive collections will appear here soon.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCoverCard
                  key={collection.id}
                  collection={collection}
                  onOpen={openLightbox}
                  tf={tf}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Images are only mounted here — after a collection is opened. */}
      <ArchiveLightbox
        collection={openCollection}
        photoIndex={normalizedPhotoIndex}
        onClose={closeLightbox}
        onPrev={goPrev}
        onNext={goNext}
        onSelectPhoto={setPhotoIndex}
        tf={tf}
      />
    </div>
  );
}
