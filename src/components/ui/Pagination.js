import Button from './Button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useI18n } from '../../i18n/i18n';

export default function Pagination({
  meta,
  onLoadMore,
  onPrev,
  loading = false,
  cursors = [],
}) {
  const { t, isRTL } = useI18n();

  if (!meta) return null;

  const canGoBack = cursors && cursors.length > 1;
  const canLoadMore = meta.hasMore;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted">{t('common.pagination.showing', { count: meta.count })}</p>
      <div className="flex items-center gap-2">
        {onPrev && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!canGoBack || loading}
            icon={isRTL ? ChevronRight : ChevronLeft}
          >
            {t('common.pagination.previous')}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadMore}
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
