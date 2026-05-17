import Button from './Button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useI18n } from '../../i18n/i18n';

export default function Pagination({
  meta,
  onLoadMore,
  onPrev,
  loading = false,
  cursors = [],
  pageInfo = null,
  page,
  totalPages,
  onPageChange,
}) {
  const { t, isRTL } = useI18n();

  const explicitPage = Number(page);
  const explicitTotalPages = Number(totalPages ?? meta?.totalPages);
  const hasPagePagination = Number.isFinite(explicitPage) || Number.isFinite(explicitTotalPages);
  const hasCursorPagination = Boolean(meta);

  if (!hasCursorPagination && !hasPagePagination) return null;

  const currentPage = Math.max(
    Number.isFinite(explicitPage) ? explicitPage : Array.isArray(cursors) ? cursors.length : 1,
    1
  );
  const knownTotalPages = Number.isFinite(explicitTotalPages)
    ? Math.max(explicitTotalPages, 1)
    : null;
  const canGoBack = hasPagePagination
    ? currentPage > 1
    : Array.isArray(cursors) && cursors.length > 1;
  const canLoadMore = hasPagePagination
    ? currentPage < knownTotalPages
    : Boolean(meta?.hasMore ?? meta?.nextCursor);
  const handlePrevious = onPageChange ? () => onPageChange(currentPage - 1) : onPrev;
  const handleNext = onPageChange ? () => onPageChange(currentPage + 1) : onLoadMore;
  const resolvedPageInfo = pageInfo || (
    knownTotalPages ? `${currentPage}/${knownTotalPages}` : String(currentPage)
  );

  return (
    <div className="flex items-center justify-end pt-4">
      {/* <p className="text-sm text-muted">{t('common.pagination.showing', { count: meta.count })}</p> */}
      <div className="flex items-center gap-2">
        {(onPrev || onPageChange) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!canGoBack || loading}
            icon={isRTL ? ChevronRight : ChevronLeft}
          >
            {t('common.pagination.previous')}
          </Button>
        )}
        <span className="min-w-12 text-center text-sm font-medium text-muted direction-ltr">
          {resolvedPageInfo}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canLoadMore || loading}
          loading={loading}
          icon={isRTL ? ChevronLeft : ChevronRight}
          iconPosition="end"
        >
          {t('common.pagination.next')}
        </Button>
      </div>
    </div>
  );
}
