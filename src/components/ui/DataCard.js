/**
 * Shared card language for list/directory screens.
 *
 * `DataCard` is one horizontal composition — leading media, a title row with
 * an inline status, supporting lines, a trailing action menu and an optional
 * footer band — that each screen tailors through slots. It generalizes the
 * anatomy hand-built for the Users directory so the whole app reads as one
 * product without forcing an identical layout onto every entity.
 */

const accentRail = {
  primary: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  gold: 'bg-secondary',
  muted: 'bg-border',
};

const avatarTones = {
  primary: 'bg-primary/10 text-primary',
  gold: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  muted: 'bg-surface-alt text-muted',
};

const avatarSizes = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-14 w-14 text-base',
};

export function getInitials(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '؟';
  return trimmed.charAt(0).toUpperCase();
}

/**
 * Leading media for a card: a rounded initials/icon/photo tile that matches
 * the Users directory avatar treatment. Pass `name` for initials, `src` for a
 * photo, or `icon` for a glyph. `badge` renders a small status overlay.
 */
export function CardAvatar({
  name,
  src,
  icon: Icon,
  size = 'md',
  tone = 'primary',
  badge,
  className = '',
  onClick,
  ariaLabel,
}) {
  const toneClass = avatarTones[tone] || avatarTones.primary;
  const sizeClass = avatarSizes[size] || avatarSizes.md;
  const Wrapper = typeof onClick === 'function' ? 'button' : 'span';

  return (
    <Wrapper
      type={Wrapper === 'button' ? 'button' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-bold ${sizeClass} ${toneClass} ${
        Wrapper === 'button' ? 'transition-transform focus:outline-none focus:ring-2 focus:ring-primary/25' : ''
      } ${className}`}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : Icon ? (
        <Icon className="h-1/2 w-1/2" aria-hidden="true" />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
      {badge ? (
        <span className="absolute -bottom-0.5 -left-0.5 flex items-center justify-center">
          {badge}
        </span>
      ) : null}
    </Wrapper>
  );
}

export default function DataCard({
  onClick,
  leading,
  title,
  badge,
  subtitle,
  meta,
  actions,
  accent,
  footer,
  align = 'center',
  className = '',
  ...props
}) {
  const clickable = typeof onClick === 'function';
  const BodyTag = clickable ? 'button' : 'div';
  const railClass = accent ? accentRail[accent] || accentRail.muted : null;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-all hover:border-primary/25 hover:shadow-md ${className}`}
      {...props}
    >
      {railClass ? (
        <span className={`absolute inset-y-0 start-0 w-1 ${railClass}`} aria-hidden="true" />
      ) : null}

      <div className={`flex gap-3 p-3 ps-3.5 ${align === 'start' ? 'items-start' : 'items-center'}`}>
        {leading ? <div className="shrink-0">{leading}</div> : null}

        <BodyTag
          type={clickable ? 'button' : undefined}
          onClick={onClick}
          className={`min-w-0 flex-1 text-start ${clickable ? 'focus:outline-none' : ''}`}
        >
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate text-sm font-bold leading-5 text-heading transition-colors group-hover:text-primary">
              {title}
            </div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-xs font-medium leading-4 text-muted">{subtitle}</div>
          ) : null}
          {meta ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium leading-4 text-muted">
              {meta}
            </div>
          ) : null}
        </BodyTag>

        {actions ? <div className="shrink-0 self-start">{actions}</div> : null}
      </div>

      {footer ? (
        <div className="border-t border-border/70 bg-surface-alt/30 px-3.5 py-2.5">{footer}</div>
      ) : null}
    </div>
  );
}
