const variantStyles = {
  default: 'bg-surface-alt/70 text-base border-border/60',
  neutral: 'bg-surface-alt/70 text-muted border-border/60',
  primary: 'bg-primary/10 text-primary border-primary/15',
  success: 'bg-success-light text-success border-success/20',
  danger: 'bg-danger-light text-danger border-danger/20',
  warning: 'bg-warning-light text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  gold: 'bg-secondary/10 text-secondary border-secondary/20',
};

const dotStyles = {
  default: 'bg-muted',
  neutral: 'bg-muted',
  primary: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  secondary: 'bg-secondary',
  gold: 'bg-secondary',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  removable,
  onRemove,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${variantStyles[variant] || variantStyles.default} ${sizes[size] || sizes.md} ${className}
      `}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant] || dotStyles.default}`} />}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label="×"
        >
          &times;
        </button>
      )}
    </span>
  );
}
