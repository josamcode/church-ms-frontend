import { TrendingUp, TrendingDown } from 'lucide-react';
import Sparkline from './Sparkline';

const tones = {
  default: {
    iconWrap: 'bg-surface-alt text-muted',
    accent: 'from-border/0 to-border/0',
    spark: 'var(--color-primary)',
  },
  primary: {
    iconWrap: 'bg-primary/10 text-primary',
    accent: 'from-primary/60 to-primary/0',
    spark: 'var(--color-primary)',
  },
  gold: {
    iconWrap: 'bg-secondary/12 text-secondary',
    accent: 'from-secondary/60 to-secondary/0',
    spark: 'var(--color-secondary)',
  },
  success: {
    iconWrap: 'bg-success/12 text-success',
    accent: 'from-success/60 to-success/0',
    spark: 'var(--color-success)',
  },
  warning: {
    iconWrap: 'bg-warning/12 text-warning',
    accent: 'from-warning/60 to-warning/0',
    spark: 'var(--color-warning)',
  },
  danger: {
    iconWrap: 'bg-danger/12 text-danger',
    accent: 'from-danger/60 to-danger/0',
    spark: 'var(--color-danger)',
  },
  info: {
    iconWrap: 'bg-info/12 text-info',
    accent: 'from-info/60 to-info/0',
    spark: 'var(--color-info)',
  },
};

/**
 * Reusable KPI tile. Keeps dashboards visually consistent.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
  trend,
  trendLabel,
  spark,
  onClick,
  className = '',
  isRTL = false,
}) {
  const t = tones[tone] || tones.default;
  const clickable = typeof onClick === 'function';
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null;
  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-muted';

  const Wrapper = clickable ? 'button' : 'div';

  return (
    <Wrapper
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      className={`stat-card group text-start ${
        clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/25' : ''
      } ${className}`}
    >
      {/* top accent bar */}
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${t.accent} ${
          isRTL ? 'bg-gradient-to-l' : ''
        }`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold leading-none tracking-tight text-heading sm:text-[28px]">
            {value}
          </p>
        </div>
        {Icon && (
          <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${t.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {(hint || TrendIcon) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {TrendIcon && (
            <span className={`inline-flex items-center gap-1 font-semibold ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              {trendLabel}
            </span>
          )}
          {hint && <span className="truncate text-muted">{hint}</span>}
        </div>
      )}
      {Array.isArray(spark) && spark.length > 1 && (
        <div className="mt-3 -mb-1">
          <Sparkline data={spark} color={t.spark} />
        </div>
      )}
    </Wrapper>
  );
}
