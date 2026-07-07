import { useState } from 'react';

/**
 * Professional settings shell:
 *  - Desktop: a vertical section rail (sidebar) + a single content panel.
 *  - Mobile: a clean horizontal section switcher (no nested cards).
 * The active section's header (icon + title + description) is rendered by the
 * shell, and the page provides FLAT content (rows/fields) — never card-in-card.
 *
 * sections: [{ id, label, icon, title, description, content }]
 */
export default function SettingsLayout({ sections = [], defaultIndex = 0 }) {
  const [active, setActive] = useState(defaultIndex);
  if (!sections.length) return null;
  const safe = Math.min(Math.max(active, 0), sections.length - 1);
  const current = sections[safe];
  const CurrentIcon = current.icon;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
      {/* ── Section rail ─────────────────────────────────────────────────── */}
      <nav className="lg:w-64 lg:shrink-0" aria-label={current.title}>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {sections.map((section, index) => {
            const isActive = index === safe;
            const Icon = section.icon;
            return (
              <button
                key={section.id || index}
                type="button"
                onClick={() => setActive(index)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all lg:w-full',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:bg-surface-alt hover:text-heading',
                ].join(' ')}
              >
                {Icon && (
                  <span
                    className={[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-white/15 text-white' : 'bg-surface-alt text-muted group-hover:text-heading',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                <span className="whitespace-nowrap">{section.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Content panel ────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex items-start gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
            {CurrentIcon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CurrentIcon className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight text-heading">{current.title}</h2>
              {current.description && (
                <p className="mt-0.5 text-sm text-muted">{current.description}</p>
              )}
            </div>
          </div>
          <div className="px-5 py-5 sm:px-6 sm:py-6">{current.content}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * A flat setting row: label/description on the start, control on the end,
 * with an optional top divider. Use inside SettingsLayout content — no cards.
 */
export function SettingRow({ icon: Icon, title, description, children, divided = false, className = '' }) {
  return (
    <div
      className={[
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        divided ? 'border-t border-border/70 pt-5 mt-5' : '',
        className,
      ].join(' ')}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
        <div className="min-w-0">
          {title && <p className="text-sm font-semibold text-heading">{title}</p>}
          {description && <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {children != null && <div className="shrink-0 sm:pt-0.5">{children}</div>}
    </div>
  );
}
