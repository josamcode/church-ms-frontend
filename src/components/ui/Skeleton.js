export default function Skeleton({ className = '', variant = 'rect' }) {
  const base =
    'relative overflow-hidden bg-surface-alt rounded before:absolute before:inset-0 ' +
    'before:-translate-x-full before:bg-gradient-to-r before:from-transparent ' +
    'before:via-white/40 dark:before:via-white/[0.06] before:to-transparent ' +
    'motion-safe:before:animate-shimmer';
  const variants = {
    rect: '',
    circle: '!rounded-full',
    text: 'h-4',
  };
  return <div className={`${base} ${variants[variant]} ${className}`} />;
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-3.5">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
