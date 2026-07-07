const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
};

const tones = {
  default: 'bg-surface border-border',
  muted: 'bg-surface-alt/50 border-border',
  primary: 'bg-primary/[0.04] border-primary/15',
  gold: 'bg-secondary/[0.06] border-secondary/20',
};

export default function Card({
  children,
  className = '',
  padding = true,
  tone = 'default',
  hover = false,
  interactive = false,
  ...props
}) {
  const padKey = padding === true ? 'md' : padding === false ? 'none' : padding;
  const padClass = paddings[padKey] ?? paddings.md;
  const toneClass = tones[tone] || tones.default;
  const hoverClass = hover || interactive ? 'card-hover' : '';
  const cursorClass = interactive ? 'cursor-pointer' : '';

  return (
    <div
      className={`rounded-xl border shadow-card ${toneClass} ${padClass} ${hoverClass} ${cursorClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-heading leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
