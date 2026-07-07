/**
 * Titled content section — a consistent wrapper for detail / settings / form
 * groups. Renders a header (icon, title, description, actions) and a body.
 */
export default function Section({
  title,
  description,
  icon: Icon,
  actions,
  children,
  as: Tag = 'section',
  bodyClassName = '',
  className = '',
  divided = true,
}) {
  const hasHeader = title || description || actions || Icon;

  return (
    <Tag className={`rounded-xl border border-border bg-surface shadow-card ${className}`}>
      {hasHeader && (
        <div
          className={`flex flex-wrap items-start justify-between gap-3 px-5 py-4 ${
            divided ? 'border-b border-border/70' : ''
          }`}
        >
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-[18px] w-[18px]" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-base font-bold leading-tight text-heading">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`px-5 py-5 ${bodyClassName}`}>{children}</div>
    </Tag>
  );
}
