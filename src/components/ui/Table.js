import { ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import { SkeletonRow } from './Skeleton';
import EmptyState from './EmptyState';
import { useState, useRef, useEffect } from 'react';

export default function Table({
  columns = [],
  data = [],
  loading = false,
  skeletonRows = 5,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  sortField,
  sortOrder,
  onSort,
}) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-alt border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`p-3 text-right font-semibold text-heading whitespace-nowrap ${col.className || ''}`}
              >
                {col.sortable ? (
                  <button
                    onClick={() => onSort?.(col.key)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {col.label}
                    {sortField === col.key && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
            : data.length === 0
              ? null
              : data.map((row, i) => (
                <tr
                  key={row._id || row.id || i}
                  className="border-b border-border last:border-b-0 hover:bg-surface-alt/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`p-3 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row, i) : row[col.key] ?? '---'}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && data.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      )}
    </div>
  );
}

export function RowActions({ actions = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded hover:bg-surface-alt transition-colors"
        aria-label="خيارات"
      >
        <MoreVertical className="w-4 h-4 text-muted" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-44 bg-surface border border-border rounded-lg shadow-dropdown z-30 py-1 animate-fade-in">
          {actions.map((action, i) =>
            action.divider ? (
              <hr key={i} className="my-1 border-border" />
            ) : (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  action.onClick?.();
                }}
                disabled={action.disabled}
                className={`
                  w-full text-right px-3 py-2 text-sm flex items-center gap-2 transition-colors
                  ${action.danger ? 'text-danger hover:bg-danger-light' : 'text-base hover:bg-surface-alt'}
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
