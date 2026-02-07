import Button from './Button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function Pagination({
  meta,
  onLoadMore,
  onPrev,
  loading = false,
  cursors = [],
}) {
  if (!meta) return null;

  const canGoBack = cursors && cursors.length > 1;
  const canLoadMore = meta.hasMore;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted">
        عرض {meta.count} نتيجة
      </p>
      <div className="flex items-center gap-2">
        {onPrev && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!canGoBack || loading}
            icon={ChevronRight}
          >
            السابق
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={!canLoadMore || loading}
          loading={loading}
          icon={ChevronLeft}
          iconPosition="end"
        >
          التالي
        </Button>
      </div>
    </div>
  );
}
