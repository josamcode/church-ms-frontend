import { forwardRef } from 'react';
import { Loader } from 'lucide-react';

const variants = {
  primary:
    'bg-primary text-white shadow-sm hover:bg-primary-dark hover:shadow-md focus:ring-primary',
  secondary:
    'bg-secondary text-white shadow-sm hover:opacity-90 hover:shadow-md focus:ring-secondary',
  outline:
    'border border-border bg-surface text-base hover:bg-surface-alt hover:border-muted/40 focus:ring-primary',
  ghost: 'bg-transparent text-base hover:bg-surface-alt focus:ring-primary',
  tonal: 'bg-primary/10 text-primary hover:bg-primary/15 focus:ring-primary',
  soft: 'bg-secondary/10 text-secondary hover:bg-secondary/15 focus:ring-secondary',
  destructive: 'bg-danger text-white shadow-sm hover:opacity-90 hover:shadow-md focus:ring-danger',
  success: 'bg-success text-white shadow-sm hover:opacity-90 hover:shadow-md focus:ring-success',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const iconSizes = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      icon: Icon,
      iconPosition = 'start',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const iconClass = iconSizes[size] || iconSizes.md;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg font-semibold
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-page
          active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
          ${fullWidth ? 'w-full' : ''}
          ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}
        `}
        {...props}
      >
        {loading && <Loader className={`${iconClass} animate-spin`} />}
        {!loading && Icon && iconPosition === 'start' && <Icon className={iconClass} />}
        {children}
        {!loading && Icon && iconPosition === 'end' && <Icon className={iconClass} />}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
