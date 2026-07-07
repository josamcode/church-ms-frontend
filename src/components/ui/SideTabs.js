import { useState } from 'react';

/**
 * Professional section navigation for detail pages:
 *  - Desktop: a vertical tab rail (sidebar) alongside the active content.
 *  - Mobile: a clean horizontal scroll of pill tabs.
 * Content is rendered as-is (no card wrapper) so the tab body keeps its own
 * cards/sections — no card-in-card.
 *
 * tabs: [{ id, label, icon, badge?, content }]
 */
export default function SideTabs({ tabs = [], defaultIndex = 0, className = '', ariaLabel = 'Sections' }) {
  const [active, setActive] = useState(defaultIndex);
  if (!tabs.length) return null;
  const safe = Math.min(Math.max(active, 0), tabs.length - 1);

  return (
    <div className={`flex flex-col gap-5 lg:flex-row lg:gap-7 ${className}`}>
      <nav className="lg:w-60 lg:shrink-0" aria-label={ariaLabel}>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {tabs.map((tab, index) => {
            const isActive = index === safe;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id || index}
                type="button"
                onClick={() => setActive(index)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all lg:w-full ${
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface-alt hover:text-heading'
                }`}
              >
                {Icon ? (
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'bg-white/15 text-white' : 'bg-surface-alt text-muted group-hover:text-heading'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge != null ? (
                  <span
                    className={`ms-auto hidden min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold lg:inline-flex ${
                      isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="min-w-0 flex-1 animate-fade-in">{tabs[safe].content}</div>
    </div>
  );
}
