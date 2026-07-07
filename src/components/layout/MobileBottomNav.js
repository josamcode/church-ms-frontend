import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';

/**
 * App-like bottom tab bar for mobile / PWA. Hidden on lg+.
 * `items` are permission-filtered primary destinations; `onMore` opens the
 * full navigation drawer.
 */
export default function MobileBottomNav({ items = [], onMore, moreActive = false, moreLabel = 'More' }) {
  const columns = items.length + 1;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-surface/95 backdrop-blur-md pb-safe lg:hidden"
      aria-label={moreLabel}
    >
      <div
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={item.onClick}
            aria-current={item.active ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors ${
              item.active ? 'text-primary' : 'text-muted hover:text-heading'
            }`}
          >
            {item.active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden />
            )}
            <span className="relative flex h-6 w-6 items-center justify-center">
              <item.icon className="h-[21px] w-[21px]" strokeWidth={item.active ? 2.4 : 1.9} />
              {item.badge ? (
                <span className="absolute -top-1.5 -right-2 flex min-w-[16px] items-center justify-center rounded-full bg-danger px-1 py-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-surface">
                  {item.badge}
                </span>
              ) : null}
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}

        <button
          type="button"
          onClick={onMore}
          aria-current={moreActive ? 'page' : undefined}
          className={`relative flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors ${
            moreActive ? 'text-primary' : 'text-muted hover:text-heading'
          }`}
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <MoreHorizontal className="h-[21px] w-[21px]" strokeWidth={1.9} />
          </span>
          <span>{moreLabel}</span>
        </button>
      </div>
    </nav>
  );
}
