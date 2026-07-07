import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'لا توجد بيانات',
  description = '',
  action,
  className = '',
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center animate-fade-in ${
        compact ? 'py-10' : 'py-16'
      } ${className}`}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 -z-10 rounded-full bg-secondary/10 blur-lg" aria-hidden />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-alt/70 shadow-xs">
          <Icon className="h-7 w-7 text-muted" />
        </div>
      </div>
      <h3 className="mb-1 text-lg font-bold text-heading">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
