import { useCallback, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Church,
  Clock,
  Home,
  MessageCircle,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  ArrowLeft,
  UserCircle,
  Users,
} from 'lucide-react';
import {
  authApi,
  bookingsApi,
  chatApi,
  confessionsApi,
  divineLiturgiesApi,
  meetingsApi,
  notificationsApi,
  usersApi,
  visitationsApi,
} from '../../api/endpoints';
import { useAuth } from '../../auth/auth.hooks';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { useI18n } from '../../i18n/i18n';
import { formatDate, getRoleLabel } from '../../utils/formatters';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Maps a Tailwind background utility (used across the existing data layer) to a
// concrete themed colour so SVG strokes/fills stay in sync with dark mode.
const SERIES_COLOR_VAR = {
  'bg-primary': 'var(--color-primary)',
  'bg-accent': 'var(--color-accent)',
  'bg-success': 'var(--color-success)',
  'bg-warning': 'var(--color-warning)',
  'bg-danger': 'var(--color-danger)',
};

function seriesColor(bgClass) {
  return SERIES_COLOR_VAR[bgClass] || 'var(--color-primary)';
}

function isoDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && DATE_ONLY.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function mapTrend(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const year = Number(item?.year);
    const month = Number(item?.month);
    if (!Number.isInteger(year) || !Number.isInteger(month)) return;
    map.set(monthKey(year, month), Number(item?.count) || 0);
  });
  return map;
}

function mapDates(values = []) {
  const map = new Map();
  values.forEach((value) => {
    const date = isoDate(value);
    if (!date) return;
    const [year, month] = date.split('-').map(Number);
    const key = monthKey(year, month);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function buildBuckets(months, language, series) {
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const now = new Date();
  const buckets = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const key = monthKey(date.getUTCFullYear(), date.getUTCMonth() + 1);
    const label = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date);
    const fullLabel = new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
    const parts = series.map((item) => ({ ...item, value: item.map.get(key) || 0 }));
    buckets.push({
      key,
      label,
      fullLabel,
      total: parts.reduce((sum, item) => sum + item.value, 0),
      parts,
    });
  }
  return buckets;
}

function familyLinksCount(profile = {}) {
  return (
    (profile?.father ? 1 : 0) +
    (profile?.mother ? 1 : 0) +
    (profile?.spouse ? 1 : 0) +
    (Array.isArray(profile?.siblings) ? profile.siblings.length : 0) +
    (Array.isArray(profile?.children) ? profile.children.length : 0) +
    (Array.isArray(profile?.familyMembers) ? profile.familyMembers.length : 0)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentational building blocks
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({ eyebrow, title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-lg font-bold tracking-tight text-heading">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-5 text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const KPI_TONES = {
  default: { icon: 'bg-primary/10 text-primary', value: 'text-heading', accent: 'before:bg-primary/40' },
  primary: { icon: 'bg-primary/10 text-primary', value: 'text-heading', accent: 'before:bg-primary/50' },
  success: { icon: 'bg-success-light text-success', value: 'text-heading', accent: 'before:bg-success/50' },
  warning: { icon: 'bg-warning-light text-warning', value: 'text-warning', accent: 'before:bg-warning/60' },
};

const KPI_SPARK_COLOR = {
  default: 'var(--color-primary)',
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
};

// Tiny inline trend chart drawn from a numeric series.
function Sparkline({ data = [], color = 'var(--color-primary)' }) {
  const rawId = useId();
  const id = rawId.replace(/[:]/g, '');
  if (!Array.isArray(data) || data.length < 2) return <div className="h-7" />;
  const w = 120;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - 2 - ((v - min) / range) * (h - 4),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function KpiCard({ label, value, hint, tone = 'default', icon: Icon = Activity, trend, spark }) {
  const palette = KPI_TONES[tone] || KPI_TONES.default;
  const sparkColor = KPI_SPARK_COLOR[tone] || KPI_SPARK_COLOR.default;
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend);
  const trendUp = trend > 0;
  const trendFlat = trend === 0;
  const TrendIcon = trendFlat ? Minus : trendUp ? TrendingUp : TrendingDown;
  const trendClass = trendFlat
    ? 'bg-surface-alt text-muted'
    : trendUp
      ? 'bg-success/10 text-success'
      : 'bg-danger/10 text-danger';
  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-3xl before:opacity-0 before:transition-opacity before:content-[''] group-hover:before:opacity-100 ${palette.accent}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
        {hasTrend ? (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${trendClass}`}>
            <TrendIcon className="h-3 w-3" />
            {trendFlat ? '0%' : `${Math.abs(trend)}%`}
          </span>
        ) : tone === 'warning' && value !== '...' && Number(value) > 0 ? (
          <span className="mt-1 flex h-2.5 w-2.5 rounded-full bg-warning ring-4 ring-warning/15" />
        ) : null}
      </div>
      <p className={`mt-4 text-3xl font-bold tracking-tight ${palette.value}`}>{value}</p>
      <p className="mt-1 text-[13px] font-semibold text-heading">{label}</p>
      {hint ? <p className="mt-0.5 text-xs leading-5 text-muted">{hint}</p> : null}
      {Array.isArray(spark) && spark.length > 1 ? (
        <div className="mt-3 -mb-1">
          <Sparkline data={spark} color={sparkColor} />
        </div>
      ) : null}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-border bg-surface p-5 shadow-card">
      <Skeleton className="h-11 w-11 !rounded-2xl" />
      <Skeleton className="mt-4 h-8 w-16" />
      <Skeleton className="mt-2 h-3.5 w-24" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly activity chart — modern SVG area chart with a segmented control
// ─────────────────────────────────────────────────────────────────────────────

const CHART_W = 640;
const CHART_H = 240;
const CHART_PX_H = 210;
const PAD_X = 16;
const PAD_TOP = 18;
const PAD_BOTTOM = 16;

function buildSmoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function MonthlyActivityChart({ buckets, isRTL, loading, emptyLabel, periodLabel, allLabel, tx }) {
  const gradientBase = useId().replace(/[:]/g, '');
  const [activeKey, setActiveKey] = useState('all');
  const [hovered, setHovered] = useState(null);

  const seriesDefs = useMemo(() => (buckets[0]?.parts || []).map((part) => ({
    key: part.key,
    label: part.label,
    color: seriesColor(part.color),
  })), [buckets]);

  const ordered = useMemo(() => (isRTL ? [...buckets].reverse() : buckets), [buckets, isRTL]);

  const hasData = buckets.length > 0 && buckets.some((bucket) => bucket.total > 0);

  const activeSeries = useMemo(() => {
    if (activeKey === 'all') return seriesDefs;
    return seriesDefs.filter((s) => s.key === activeKey);
  }, [activeKey, seriesDefs]);

  const maxValue = useMemo(() => {
    let max = 0;
    ordered.forEach((bucket) => {
      bucket.parts.forEach((part) => {
        if (activeKey !== 'all' && part.key !== activeKey) return;
        if (part.value > max) max = part.value;
      });
    });
    return Math.max(max, 1);
  }, [ordered, activeKey]);

  const scaleMax = maxValue * 1.18;
  const innerW = CHART_W - PAD_X * 2;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
  const n = ordered.length;

  const xFor = useCallback(
    (index) => (n <= 1 ? CHART_W / 2 : PAD_X + (innerW * index) / (n - 1)),
    [n, innerW]
  );
  const yFor = useCallback(
    (value) => PAD_TOP + innerH - (value / scaleMax) * innerH,
    [innerH, scaleMax]
  );

  const computedSeries = useMemo(
    () =>
      activeSeries.map((series) => {
        const points = ordered.map((bucket, index) => {
          const part = bucket.parts.find((p) => p.key === series.key);
          return { x: xFor(index), y: yFor(part?.value || 0), value: part?.value || 0 };
        });
        const line = buildSmoothPath(points);
        const area = points.length
          ? `${line} L ${points[points.length - 1].x} ${PAD_TOP + innerH} L ${points[0].x} ${PAD_TOP + innerH} Z`
          : '';
        return { ...series, points, line, area };
      }),
    [activeSeries, ordered, xFor, yFor, innerH]
  );

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const single = activeSeries.length === 1;

  const segments = [
    { key: 'all', label: allLabel },
    ...seriesDefs.map((s) => ({ key: s.key, label: s.label })),
  ];

  if (loading) {
    return (
      <div className="mt-6 space-y-4">
        <Skeleton className="h-9 w-56 !rounded-2xl" />
        <Skeleton className="h-[240px] w-full !rounded-3xl" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface-alt/30 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted shadow-card">
          <BarChart3 className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm font-semibold text-heading">{emptyLabel}</p>
        <p className="mt-1 text-xs text-muted">{periodLabel}</p>
      </div>
    );
  }

  const hoveredBucket = hovered != null ? ordered[hovered] : null;

  return (
    <div className="mt-6 space-y-5">
      {/* Segmented control + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-surface-alt/50 p-1">
          {segments.map((segment) => {
            const isActive = segment.key === activeKey;
            return (
              <button
                key={segment.key}
                type="button"
                onClick={() => {
                  setActiveKey(segment.key);
                  setHovered(null);
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted hover:text-heading'
                }`}
              >
                {segment.label}
              </button>
            );
          })}
        </div>
        <Badge variant="default" className="gap-1.5">
          <Clock className="h-3 w-3" />
          {periodLabel}
        </Badge>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="relative" style={{ height: CHART_PX_H }}>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="block h-full w-full"
          role="img"
          preserveAspectRatio="none"
        >
          <defs>
            {computedSeries.map((series, index) => (
              <linearGradient key={series.key} id={`${gradientBase}-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={series.color} stopOpacity={single ? 0.28 : 0.16} />
                <stop offset="100%" stopColor={series.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal grid lines */}
          {gridLines.map((ratio) => {
            const y = PAD_TOP + innerH * ratio;
            return (
              <line
                key={ratio}
                x1={PAD_X}
                x2={CHART_W - PAD_X}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth="1"
                strokeDasharray={ratio === 1 ? '0' : '4 6'}
                opacity={ratio === 1 ? 0.9 : 0.5}
              />
            );
          })}

          {/* Area fills + lines */}
          {computedSeries.map((series, index) => (
            <g key={series.key}>
              <path d={series.area} fill={`url(#${gradientBase}-${index})`} />
              <path
                d={series.line}
                fill="none"
                stroke={series.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Hover guide line */}
          {hovered != null ? (
            <line
              x1={xFor(hovered)}
              x2={xFor(hovered)}
              y1={PAD_TOP}
              y2={PAD_TOP + innerH}
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeDasharray="3 4"
              opacity="0.6"
            />
          ) : null}

          {/* Invisible hover bands */}
          {ordered.map((bucket, index) => {
            const bandW = innerW / Math.max(n - 1, 1);
            return (
              <rect
                key={`band-${bucket.key}`}
                x={xFor(index) - bandW / 2}
                y={0}
                width={bandW}
                height={CHART_H}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

          {/* Data points (HTML overlay — perfectly round under the stretched SVG) */}
          {computedSeries.map((series) =>
            series.points.map((point, index) => {
              const active = hovered === index;
              return (
                <span
                  key={`${series.key}-${index}`}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-surface transition-all"
                  style={{
                    left: `${(point.x / CHART_W) * 100}%`,
                    top: `${(point.y / CHART_H) * 100}%`,
                    width: active ? 12 : single ? 8 : 7,
                    height: active ? 12 : single ? 8 : 7,
                    borderColor: series.color,
                  }}
                />
              );
            })
          )}
        </div>

        {/* Month labels (HTML overlay — stays crisp under the stretched SVG) */}
        <div className="relative mt-1.5 h-4">
          {ordered.map((bucket, index) => (
            <span
              key={bucket.key}
              className={`absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold transition-colors ${
                hovered === index ? 'text-primary' : 'text-muted'
              }`}
              style={{ left: `${(xFor(index) / CHART_W) * 100}%` }}
            >
              {bucket.label}
            </span>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredBucket ? (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[150px] -translate-x-1/2 rounded-2xl border border-border bg-surface/95 p-3 shadow-dropdown backdrop-blur-sm"
            style={{ left: `${(xFor(hovered) / CHART_W) * 100}%` }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{hoveredBucket.fullLabel}</p>
            <div className="mt-2 space-y-1.5">
              {seriesDefs
                .filter((s) => activeKey === 'all' || s.key === activeKey)
                .map((s) => {
                  const part = hoveredBucket.parts.find((p) => p.key === s.key);
                  return (
                    <div key={s.key} className="flex items-center justify-between gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </span>
                      <span className="font-bold text-heading">{part?.value || 0}</span>
                    </div>
                  );
                })}
              {activeKey === 'all' ? (
                <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1.5 text-xs">
                  <span className="text-muted">{tx('Total', 'الإجمالي')}</span>
                  <span className="font-bold text-primary">{hoveredBucket.total}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {seriesDefs.map((s) => {
          const dimmed = activeKey !== 'all' && activeKey !== s.key;
          return (
            <span
              key={s.key}
              className={`inline-flex items-center gap-2 text-xs font-medium transition-opacity ${
                dimmed ? 'text-muted opacity-50' : 'text-heading'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MetricBars({ items, emptyLabel }) {
  if (!items.length || items.every((item) => item.value === 0)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-alt/30 py-8 text-center">
        <Sparkles className="h-5 w-5 text-muted" />
        <p className="mt-2 text-sm text-muted">{emptyLabel}</p>
      </div>
    );
  }
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-heading">{item.label}</p>
              {item.meta ? <p className="text-xs text-muted">{item.meta}</p> : null}
            </div>
            <Badge variant={item.variant || 'primary'}>{item.value}</Badge>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-alt">
            <div
              className={`h-full rounded-full transition-all duration-500 ${item.color || 'bg-primary'}`}
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickAction({ action, isRTL }) {
  const Icon = action.icon;
  return (
    <Link
      to={action.href}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${action.iconTone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-heading">{action.label}</p>
          <Badge variant={action.variant || 'primary'}>{action.metric}</Badge>
        </div>
        <p className="mt-0.5 truncate text-xs leading-5 text-muted">{action.desc}</p>
      </div>
      <ArrowUpRight
        className={`h-4 w-4 shrink-0 text-border transition-all group-hover:text-primary ${
          isRTL ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
        }`}
      />
    </Link>
  );
}

const PRIORITY_TONES = {
  danger: 'border-danger/25 bg-danger/[0.06]',
  warning: 'border-warning/25 bg-warning/[0.06]',
  primary: 'border-primary/20 bg-primary/[0.05]',
  success: 'border-success/25 bg-success/[0.06]',
};
const PRIORITY_ICON_TONES = {
  danger: 'text-danger',
  warning: 'text-warning',
  primary: 'text-primary',
  success: 'text-success',
};

function PriorityCard({ item, isRTL }) {
  const Icon = item.icon;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  return (
    <Link
      to={item.href}
      className={`group flex items-center gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-card ${PRIORITY_TONES[item.tone] || PRIORITY_TONES.primary}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface/70 shadow-sm ${PRIORITY_ICON_TONES[item.tone] || PRIORITY_ICON_TONES.primary}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold leading-none tracking-tight text-heading">{item.value}</p>
        <p className="mt-1 truncate text-xs font-medium text-muted">{item.label}</p>
      </div>
      <Arrow className="h-4 w-4 shrink-0 text-muted opacity-40 transition-all group-hover:opacity-100" />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const { t, isRTL, language } = useI18n();
  const tx = useCallback((en, ar) => (language === 'ar' ? ar : en), [language]);
  const dots = '...';

  const canUsers = hasPermission('USERS_VIEW');
  const canConfessions = hasPermission('CONFESSIONS_VIEW');
  const canConfessionAlerts = hasPermission('CONFESSIONS_ALERTS_VIEW');
  const canConfessionAnalytics = hasPermission('CONFESSIONS_ANALYTICS_VIEW');
  const canVisitations = hasPermission('PASTORAL_VISITATIONS_VIEW');
  const canVisitationAnalytics = hasPermission('PASTORAL_VISITATIONS_ANALYTICS_VIEW');
  const canMeetings = hasAnyPermission(['MEETINGS_VIEW', 'MEETINGS_VIEW_OWN']);
  const canBookings = hasAnyPermission(['BOOKINGS_VIEW_OWN', 'BOOKINGS_VIEW', 'BOOKINGS_MANAGE']);
  const canNotifications = hasPermission('NOTIFICATIONS_VIEW');
  const canChats = hasPermission('CHATS_VIEW');
  const canDivine = hasAnyPermission([
    'DIVINE_LITURGIES_VIEW',
    'DIVINE_LITURGIES_MANAGE',
    'DIVINE_LITURGIES_ATTENDANCE_MANAGE',
    'DIVINE_LITURGIES_ATTENDANCE_MANAGE_ASSIGNED_USERS',
  ]);

  const systemMode = hasAnyPermission([
    'USERS_VIEW',
    'CONFESSIONS_VIEW',
    'CONFESSIONS_ALERTS_VIEW',
    'CONFESSIONS_ANALYTICS_VIEW',
    'PASTORAL_VISITATIONS_VIEW',
    'PASTORAL_VISITATIONS_ANALYTICS_VIEW',
  ]);

  const usersQuery = useQuery({
    queryKey: ['dashboard', 'users', 'summary'],
    enabled: systemMode && canUsers,
    staleTime: 60000,
    queryFn: async () => {
      const [totalUsersResponse, lockedUsersResponse, familyNamesResponse] = await Promise.all([
        usersApi.list({
          limit: 1,
          sort: 'createdAt',
          order: 'desc',
        }),
        usersApi.list({
          limit: 1,
          sort: 'createdAt',
          order: 'desc',
          isLocked: true,
        }),
        usersApi.getFamilyNames(),
      ]);

      const total = Number(totalUsersResponse?.data?.meta?.totalCount || 0);
      const locked = Number(lockedUsersResponse?.data?.meta?.totalCount || 0);
      const familyNames = Array.isArray(familyNamesResponse?.data?.data)
        ? familyNamesResponse.data.data
        : [];

      return {
        total,
        active: Math.max(0, total - locked),
        locked,
        families: familyNames.length,
      };
    },
  });

  const confAnalyticsQuery = useQuery({
    queryKey: ['dashboard', 'confessions', 'analytics'],
    enabled: systemMode && canConfessionAnalytics,
    staleTime: 60000,
    queryFn: async () => (await confessionsApi.getAnalytics({ months: 6 })).data?.data || null,
  });

  const confAlertsQuery = useQuery({
    queryKey: ['dashboard', 'confessions', 'alerts'],
    enabled: systemMode && canConfessionAlerts,
    staleTime: 60000,
    queryFn: async () => (await confessionsApi.getAlerts({})).data?.data || null,
  });

  const visitAnalyticsQuery = useQuery({
    queryKey: ['dashboard', 'visitations', 'analytics'],
    enabled: systemMode && canVisitationAnalytics,
    staleTime: 60000,
    queryFn: async () => (await visitationsApi.getAnalytics({ months: 6 })).data?.data || null,
  });

  const meQuery = useQuery({
    queryKey: ['dashboard', 'me'],
    enabled: !systemMode,
    staleTime: 300000,
    queryFn: async () => (await authApi.me()).data?.data || null,
  });

  const meetingsQuery = useQuery({
    queryKey: ['dashboard', 'member', 'meetings'],
    enabled: !systemMode && canMeetings,
    staleTime: 60000,
    queryFn: async () => (await meetingsApi.meetings.list({ limit: 100, order: 'desc' })).data?.data || [],
  });

  const bookingsQuery = useQuery({
    queryKey: ['dashboard', 'member', 'bookings'],
    enabled: !systemMode && canBookings,
    staleTime: 60000,
    queryFn: async () => (await bookingsApi.self.list({ limit: 100, order: 'desc' })).data?.data || [],
  });

  const notificationsQuery = useQuery({
    queryKey: ['dashboard', 'member', 'notifications'],
    enabled: !systemMode && canNotifications,
    staleTime: 60000,
    queryFn: async () => (await notificationsApi.list({ limit: 20, order: 'desc', excludeSourceType: 'aid_recurring' })).data?.data || [],
  });

  const chatsQuery = useQuery({
    queryKey: ['dashboard', 'member', 'chats'],
    enabled: !systemMode && canChats,
    staleTime: 60000,
    queryFn: async () => (await chatApi.list()).data?.data || [],
  });

  const divineQuery = useQuery({
    queryKey: ['dashboard', 'member', 'divine'],
    enabled: !systemMode && canDivine,
    staleTime: 60000,
    queryFn: async () => (await divineLiturgiesApi.getOverview()).data?.data || null,
  });

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    [language]
  );

  const confSummary = confAnalyticsQuery.data?.summary || {};
  const visitSummary = visitAnalyticsQuery.data?.summary || {};
  const overdueAlerts = confAlertsQuery.data?.count ?? confSummary.overdueUsers ?? 0;
  const me = meQuery.data || user || {};
  const meetings = useMemo(() => (Array.isArray(meetingsQuery.data) ? meetingsQuery.data : []), [meetingsQuery.data]);
  const bookings = useMemo(() => (Array.isArray(bookingsQuery.data) ? bookingsQuery.data : []), [bookingsQuery.data]);
  const notifications = useMemo(
    () => (Array.isArray(notificationsQuery.data) ? notificationsQuery.data : []),
    [notificationsQuery.data]
  );
  const chats = useMemo(() => (Array.isArray(chatsQuery.data) ? chatsQuery.data : []), [chatsQuery.data]);
  const meetingAttendance = useMemo(
    () => (Array.isArray(me?.meetingAttendance) ? me.meetingAttendance : []),
    [me?.meetingAttendance]
  );
  const divineAttendance = useMemo(
    () => (Array.isArray(me?.divineLiturgyAttendance) ? me.divineLiturgyAttendance : []),
    [me?.divineLiturgyAttendance]
  );
  const recurringLiturgies = useMemo(
    () => (Array.isArray(divineQuery.data?.recurringDivineLiturgies) ? divineQuery.data.recurringDivineLiturgies : []),
    [divineQuery.data?.recurringDivineLiturgies]
  );
  const recurringVespers = useMemo(
    () => (Array.isArray(divineQuery.data?.recurringVespers) ? divineQuery.data.recurringVespers : []),
    [divineQuery.data?.recurringVespers]
  );
  const exceptional = useMemo(
    () => (Array.isArray(divineQuery.data?.exceptionalDivineLiturgies) ? divineQuery.data.exceptionalDivineLiturgies : []),
    [divineQuery.data?.exceptionalDivineLiturgies]
  );
  const weeklyServices = recurringLiturgies.length + recurringVespers.length;
  const pendingBookings = bookings.filter((booking) => booking?.status === 'pending').length;
  const unreadChats = chats.filter((thread) => thread?.hasUnread).length;
  const profileScore = Math.round(([
    me?.avatar?.url,
    me?.email,
    me?.address?.governorate || me?.address?.city || me?.address?.street || me?.address?.details,
    me?.familyName,
    me?.houseName,
    me?.notes,
    familyLinksCount(me) > 0,
  ].filter(Boolean).length / 7) * 100);

  const adminBuckets = useMemo(
    () =>
      buildBuckets(6, language, [
        { key: 'conf', label: tx('Confessions', 'الاعترافات'), color: 'bg-primary', map: mapTrend(confAnalyticsQuery.data?.monthlyTrend || []) },
        { key: 'visit', label: tx('Visitations', 'الزيارات'), color: 'bg-accent', map: mapTrend(visitAnalyticsQuery.data?.monthlyTrend || []) },
      ]),
    [confAnalyticsQuery.data?.monthlyTrend, language, tx, visitAnalyticsQuery.data?.monthlyTrend]
  );

  const memberBuckets = useMemo(
    () =>
      buildBuckets(6, language, [
        { key: 'meet', label: tx('Meetings', 'الاجتماعات'), color: 'bg-primary', map: mapDates(meetingAttendance.map((entry) => entry?.attendanceDate)) },
        { key: 'divine', label: tx('Liturgies', 'القداسات'), color: 'bg-success', map: mapDates(divineAttendance.map((entry) => entry?.attendanceDate)) },
        { key: 'book', label: tx('Bookings', 'الحجوزات'), color: 'bg-accent', map: mapDates(bookings.map((entry) => entry?.scheduledDate || entry?.createdAt)) },
      ]),
    [bookings, divineAttendance, language, meetingAttendance, tx]
  );

  // Derive tiny sparkline series + month-over-month trend from the monthly buckets.
  const seriesValues = (buckets, key) =>
    buckets.map((bucket) => bucket.parts.find((p) => p.key === key)?.value || 0);
  const pctChange = (arr) => {
    if (!Array.isArray(arr) || arr.length < 2) return undefined;
    const prev = arr[arr.length - 2];
    const curr = arr[arr.length - 1];
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const confSpark = seriesValues(adminBuckets, 'conf');
  const visitSpark = seriesValues(adminBuckets, 'visit');
  const meetSpark = seriesValues(memberBuckets, 'meet');
  const divineSpark = seriesValues(memberBuckets, 'divine');
  const bookSpark = seriesValues(memberBuckets, 'book');

  const nextExceptional = useMemo(() => {
    const today = isoDate(new Date());
    return exceptional
      .filter((entry) => isoDate(entry?.date) && isoDate(entry.date) >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null;
  }, [exceptional]);

  const familyItems = [
    { label: tx('Parents', 'الوالدان'), value: (me?.father ? 1 : 0) + (me?.mother ? 1 : 0), color: 'bg-primary' },
    { label: tx('Spouse', 'الزوج أو الزوجة'), value: me?.spouse ? 1 : 0, color: 'bg-accent' },
    { label: tx('Siblings', 'الإخوة'), value: Array.isArray(me?.siblings) ? me.siblings.length : 0, color: 'bg-success' },
    { label: tx('Children', 'الأبناء'), value: Array.isArray(me?.children) ? me.children.length : 0, color: 'bg-warning', variant: 'warning' },
    { label: tx('Extended family', 'أقارب آخرون'), value: Array.isArray(me?.familyMembers) ? me.familyMembers.length : 0, color: 'bg-primary' },
  ];

  const bookingItems = ['pending', 'confirmed', 'completed', 'cancelled'].map((status) => ({
    label:
      language === 'ar'
        ? status === 'confirmed'
          ? 'تمت الموافقة'
          : status === 'completed'
            ? 'مكتمل'
            : status === 'cancelled'
              ? 'مرفوض'
              : 'قيد المراجعة'
        : status === 'confirmed'
          ? 'Approved'
          : status === 'completed'
            ? 'Completed'
            : status === 'cancelled'
              ? 'Rejected'
              : 'Pending',
    value: bookings.filter((booking) => booking?.status === status).length,
    color: status === 'pending' ? 'bg-warning' : status === 'completed' ? 'bg-success' : status === 'cancelled' ? 'bg-danger' : 'bg-primary',
    variant: status === 'pending' ? 'warning' : status === 'completed' ? 'success' : status === 'cancelled' ? 'danger' : 'primary',
  }));

  const adminCards = [
    canUsers ? { icon: Users, label: tx('Total users', 'إجمالي الأفراد'), value: usersQuery.isLoading && !usersQuery.data ? dots : usersQuery.data?.total ?? 0, hint: `${usersQuery.data?.active ?? 0} ${tx('active', 'نشط')}` } : null,
    canUsers ? { icon: Building2, label: tx('Families', 'العائلات'), value: usersQuery.isLoading && !usersQuery.data ? dots : usersQuery.data?.families ?? 0, hint: tx('Distinct family', 'عدد العائلات') } : null,
    canConfessionAnalytics ? { icon: CalendarCheck2, label: tx('Confessions in 6 months', 'الاعترافات اخر 6 أشهر'), value: confAnalyticsQuery.isLoading && !confAnalyticsQuery.data ? dots : confSummary.sessionsInPeriod ?? 0, hint: `${confSummary.uniqueAttendees ?? 0} ${tx('unique people', 'شخص مختلف')}`, tone: 'primary', spark: confSpark, trend: pctChange(confSpark) } : null,
    canConfessionAlerts || canConfessionAnalytics ? { icon: BellRing, label: tx('Overdue follow-up', 'متابعة متأخرة'), value: (confAlertsQuery.isLoading && !confAlertsQuery.data) || (confAnalyticsQuery.isLoading && !confAnalyticsQuery.data) ? dots : overdueAlerts, hint: `${confSummary.upcomingSessions ?? 0} ${tx('upcoming', 'قادم')}`, tone: overdueAlerts > 0 ? 'warning' : 'success' } : null,
    canVisitationAnalytics ? { icon: Home, label: tx('Visitations in 6 months', 'الزيارات خلال 6 أشهر'), value: visitAnalyticsQuery.isLoading && !visitAnalyticsQuery.data ? dots : visitSummary.visitationsInPeriod ?? 0, hint: `${visitSummary.avgDurationMinutes ?? 0} ${tx('avg. minutes', 'متوسط دقيقة')}`, tone: 'primary', spark: visitSpark, trend: pctChange(visitSpark) } : null,
    canVisitationAnalytics ? { icon: Building2, label: tx('Visited houses', 'المنازل التي تمت زيارتها'), value: visitAnalyticsQuery.isLoading && !visitAnalyticsQuery.data ? dots : visitSummary.uniqueHouses ?? 0, hint: `${(visitAnalyticsQuery.data?.topRecorders || []).length} ${tx('active recorders', 'مسجل نشط')}` } : null,
  ].filter(Boolean);

  const memberCards = [
    { icon: UserCircle, label: tx('Profile completion', 'اكتمال الملف الشخصي'), value: meQuery.isLoading && !meQuery.data ? dots : `${profileScore}%`, hint: me?.houseName || tx('No house name yet', 'لا يوجد اسم بيت بعد'), tone: profileScore >= 70 ? 'success' : 'primary' },
    { icon: Users, label: tx('Family links', 'روابط العائلة'), value: meQuery.isLoading && !meQuery.data ? dots : familyLinksCount(me), hint: me?.familyName || tx('No family name yet', 'لا يوجد اسم عائلة بعد') },
    { icon: CalendarDays, label: tx('Meeting attendance', 'حضور الاجتماعات'), value: meQuery.isLoading && !meQuery.data ? dots : meetingAttendance.length, hint: `${meetings.length} ${tx('visible meetings', 'اجتماعات ظاهرة')}`, tone: 'primary', spark: meetSpark },
    { icon: Church, label: tx('Divine attendance', 'حضور القداسات'), value: meQuery.isLoading && !meQuery.data ? dots : divineAttendance.length, hint: `${weeklyServices} ${tx('weekly services', 'خدمات أسبوعية')}`, tone: 'success', spark: divineSpark },
    canBookings ? { icon: NotebookPen, label: tx('Pending bookings', 'الحجوزات المعلقة'), value: bookingsQuery.isLoading && !bookingsQuery.data ? dots : pendingBookings, hint: `${bookings.length} ${tx('total bookings', 'إجمالي الحجوزات')}`, tone: pendingBookings > 0 ? 'warning' : 'default', spark: bookSpark } : null,
    canChats ? { icon: MessageCircle, label: tx('Unread chats', 'دردشات غير مقروءة'), value: chatsQuery.isLoading && !chatsQuery.data ? dots : unreadChats, hint: `${chats.length} ${tx('chat threads', 'محادثة')}`, tone: unreadChats > 0 ? 'warning' : 'default' } : null,
  ].filter(Boolean);

  const actionTone = (warning = false) => (warning ? 'bg-warning-light text-warning' : 'bg-primary/10 text-primary');
  const systemActions = [
    canUsers ? { href: '/dashboard/users', icon: Users, label: tx('Users', 'الأفراد'), desc: tx('Review church accounts and follow-up.', 'راجع حسابات الكنيسة والمتابعة.'), metric: usersQuery.data?.active ?? 0, iconTone: actionTone() } : null,
    canConfessions ? { href: '/dashboard/confessions', icon: CalendarCheck2, label: tx('Confessions', 'الاعترافات'), desc: tx('Open confession sessions and scheduling.', 'افتح الجلسات والجدولة الخاصة بها.'), metric: confSummary.upcomingSessions ?? 0, iconTone: actionTone(), variant: 'primary' } : null,
    canConfessionAlerts ? { href: '/dashboard/confessions/alerts', icon: BellRing, label: tx('Alerts', 'التنبيهات'), desc: tx('Review overdue confession follow-up.', 'راجع حالات المتابعة المتأخرة.'), metric: overdueAlerts, iconTone: actionTone(overdueAlerts > 0), variant: overdueAlerts > 0 ? 'warning' : 'success' } : null,
    canConfessionAnalytics ? { href: '/dashboard/confessions/analytics', icon: BarChart3, label: tx('Confession analytics', 'تحليلات الاعتراف'), desc: tx('Inspect confession volume and trends.', 'حلل الحجم والاتجاهات الحالية.'), metric: confSummary.sessionsInPeriod ?? 0, iconTone: actionTone() } : null,
    canVisitations ? { href: '/dashboard/visitations', icon: Home, label: tx('Visitations', 'الزيارات'), desc: tx('Open the pastoral visitation records.', 'افتح سجلات الزيارات الرعوية.'), metric: visitSummary.visitationsInPeriod ?? 0, iconTone: actionTone() } : null,
    canVisitationAnalytics ? { href: '/dashboard/visitations/analytics', icon: Building2, label: tx('Visitation analytics', 'تحليلات الزيارات'), desc: tx('Track houses and recorders.', 'تابع المنازل والمسجلين.'), metric: visitSummary.uniqueHouses ?? 0, iconTone: actionTone() } : null,
  ].filter(Boolean);

  const memberActions = [
    { href: '/dashboard/profile', icon: UserCircle, label: tx('My profile', 'ملفي الشخصي'), desc: tx('Update your profile and household details.', 'حدّث بياناتك وبيانات البيت.'), metric: `${profileScore}%`, iconTone: actionTone(), variant: profileScore >= 70 ? 'success' : 'primary' },
    canMeetings ? { href: '/dashboard/meetings', icon: Users, label: tx('My meetings', 'اجتماعاتي'), desc: tx('Open the meetings and service workspace.', 'افتح الاجتماعات وصفحات الخدمة.'), metric: meetings.length, iconTone: actionTone() } : null,
    canDivine ? { href: '/dashboard/divine-liturgies', icon: CalendarDays, label: tx('Divine liturgies', 'القداسات'), desc: tx('See recurring and exceptional services.', 'راجع الخدمات الدورية والاستثنائية.'), metric: weeklyServices, iconTone: 'bg-success-light text-success', variant: 'success' } : null,
    canBookings ? { href: '/dashboard/bookings/mine', icon: NotebookPen, label: tx('My bookings', 'حجوزاتي'), desc: tx('Track approvals, notes, and request status.', 'تابع الموافقات والملاحظات وحالة الطلب.'), metric: pendingBookings, iconTone: actionTone(pendingBookings > 0), variant: pendingBookings > 0 ? 'warning' : 'primary' } : null,
    canNotifications ? { href: '/dashboard/notifications', icon: BellRing, label: tx('Notifications', 'الإشعارات'), desc: tx('Read the latest church announcements.', 'اقرأ آخر إعلانات الكنيسة.'), metric: notifications.length, iconTone: actionTone() } : null,
    canChats ? { href: '/dashboard/chats', icon: MessageCircle, label: tx('Chats', 'الدردشات'), desc: tx('Jump into unread and active conversations.', 'ادخل مباشرة إلى المحادثات غير المقروءة.'), metric: unreadChats, iconTone: actionTone(unreadChats > 0), variant: unreadChats > 0 ? 'warning' : 'primary' } : null,
  ].filter(Boolean);

  const highlights = systemMode
    ? [
      { label: tx('Top session type', 'أكثر نوع جلسة'), value: confAnalyticsQuery.data?.typeBreakdown?.[0]?.sessionType || tx('Not available', 'غير متاح') },
      { label: tx('Most visited house', 'أكثر منزل تمت زيارته'), value: visitAnalyticsQuery.data?.topHouses?.[0]?.houseName || tx('Not available', 'غير متاح') },
      { label: tx('Most active recorder', 'أكثر مسجل نشاطًا'), value: visitAnalyticsQuery.data?.topRecorders?.[0]?.fullName || tx('Not available', 'غير متاح') },
      { label: tx('Average visit duration', 'متوسط مدة الزيارة'), value: `${visitSummary.avgDurationMinutes ?? 0} ${tx('minutes', 'دقيقة')}` },
    ]
    : [
      { label: tx('Visible meetings', 'الاجتماعات الظاهرة'), value: `${meetings.length}` },
      { label: tx('Weekly services', 'الخدمات الأسبوعية'), value: `${weeklyServices}` },
      { label: tx('Active notifications', 'الإشعارات النشطة'), value: `${notifications.length}` },
      { label: tx('Next exceptional service', 'أقرب خدمة استثنائية'), value: nextExceptional?.date ? formatDate(nextExceptional.date) : tx('No upcoming exceptional service', 'لا توجد خدمة استثنائية قادمة') },
    ];

  const confessionItems = (confAnalyticsQuery.data?.typeBreakdown || []).map((item, index) => ({
    label: item.sessionType,
    value: item.count,
    color: index % 2 === 0 ? 'bg-primary' : 'bg-accent',
  }));

  const houseItems = (visitAnalyticsQuery.data?.topHouses || []).map((item, index) => ({
    label: item.houseName,
    value: item.count,
    meta: `${item.avgDurationMinutes || 0} ${tx('avg. min', 'متوسط دقيقة')}`,
    color: index % 2 === 0 ? 'bg-primary' : 'bg-accent',
  }));

  // ── Derived presentation flags ───────────────────────────────────────────
  const lastUpdated = useMemo(() => {
    const stamps = [
      usersQuery.dataUpdatedAt,
      confAnalyticsQuery.dataUpdatedAt,
      confAlertsQuery.dataUpdatedAt,
      visitAnalyticsQuery.dataUpdatedAt,
      meQuery.dataUpdatedAt,
      meetingsQuery.dataUpdatedAt,
      bookingsQuery.dataUpdatedAt,
      divineQuery.dataUpdatedAt,
    ].filter((value) => Number(value) > 0);
    if (!stamps.length) return null;
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(Math.max(...stamps)));
  }, [
    usersQuery.dataUpdatedAt,
    confAnalyticsQuery.dataUpdatedAt,
    confAlertsQuery.dataUpdatedAt,
    visitAnalyticsQuery.dataUpdatedAt,
    meQuery.dataUpdatedAt,
    meetingsQuery.dataUpdatedAt,
    bookingsQuery.dataUpdatedAt,
    divineQuery.dataUpdatedAt,
    language,
  ]);

  const cards = systemMode ? adminCards : memberCards;
  const cardsLoading = systemMode
    ? usersQuery.isLoading && !usersQuery.data && canUsers
    : meQuery.isLoading && !meQuery.data;
  const activeBuckets = systemMode ? adminBuckets : memberBuckets;
  const chartLoading = systemMode
    ? (canConfessionAnalytics && confAnalyticsQuery.isLoading && !confAnalyticsQuery.data) ||
      (canVisitationAnalytics && visitAnalyticsQuery.isLoading && !visitAnalyticsQuery.data)
    : meQuery.isLoading && !meQuery.data;
  const actions = systemMode ? systemActions : memberActions;
  const periodLabel = tx('Last 6 months', 'آخر 6 أشهر');
  const periodTotal = activeBuckets.reduce((sum, bucket) => sum + bucket.total, 0);

  const priorityItems = (systemMode
    ? [
      (canConfessionAlerts || canConfessionAnalytics) && { icon: AlertTriangle, label: tx('Overdue follow-up', 'متابعة متأخرة'), value: overdueAlerts, tone: overdueAlerts > 0 ? 'danger' : 'success', href: '/dashboard/confessions/alerts' },
      canConfessionAnalytics && { icon: CalendarClock, label: tx('Upcoming sessions', 'جلسات قادمة'), value: confSummary.upcomingSessions ?? 0, tone: 'primary', href: '/dashboard/confessions' },
      canVisitationAnalytics && { icon: Home, label: tx('Visited houses', 'منازل تمت زيارتها'), value: visitSummary.uniqueHouses ?? 0, tone: 'success', href: '/dashboard/visitations' },
      canUsers && { icon: Users, label: tx('Active accounts', 'حسابات نشطة'), value: usersQuery.data?.active ?? 0, tone: 'primary', href: '/dashboard/users' },
    ]
    : [
      canBookings && { icon: NotebookPen, label: tx('Pending bookings', 'حجوزات معلقة'), value: pendingBookings, tone: pendingBookings > 0 ? 'warning' : 'success', href: '/dashboard/bookings/mine' },
      canChats && { icon: MessageCircle, label: tx('Unread chats', 'رسائل غير مقروءة'), value: unreadChats, tone: unreadChats > 0 ? 'warning' : 'success', href: '/dashboard/chats' },
      { icon: CalendarClock, label: tx('Weekly services', 'خدمات أسبوعية'), value: weeklyServices, tone: 'primary', href: '/dashboard/divine-liturgies' },
      canNotifications && { icon: BellRing, label: tx('Active notifications', 'إشعارات نشطة'), value: notifications.length, tone: 'primary', href: '/dashboard/notifications' },
    ]
  ).filter(Boolean).slice(0, 4);

  return (
    <div className="animate-fade-in space-y-6 pb-10 sm:space-y-7">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/[0.09] via-surface to-surface-alt/50 p-6 shadow-card sm:p-7">
        <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden>
          <div className={`absolute -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl ${isRTL ? '-left-12' : '-right-12'}`} />
          <div className={`absolute -bottom-20 h-44 w-44 rounded-full bg-accent/10 blur-3xl ${isRTL ? 'right-1/3' : 'left-1/3'}`} />
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] font-semibold text-muted backdrop-blur-sm">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {todayLabel}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-heading sm:text-3xl">
              {t('dashboardHome.welcome', { name: user?.fullName || '' })}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
              {systemMode
                ? tx('Live church analytics built from your system data.', 'لوحة تحليلات حية مبنية من بيانات النظام.')
                : tx('Your own church activity, requests, and household context.', 'نشاطك الشخصي وطلباتك وسياق البيت الخاص بك.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-light px-3 py-1 text-xs font-semibold text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {tx('System online', 'النظام يعمل')}
            </span>
            <Badge variant="primary">{getRoleLabel(user?.role)}</Badge>
            <Badge variant={user?.isLocked ? 'danger' : 'success'}>
              {user?.isLocked ? t('common.status.locked') : t('common.status.active')}
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" />
              {systemMode ? tx('System analytics', 'تحليلات النظام') : tx('My analytics', 'تحليلاتي')}
            </span>
            {lastUpdated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur-sm">
                <Clock className="h-3 w-3" />
                {tx('Updated', 'آخر تحديث')} {lastUpdated}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {cardsLoading && cards.length === 0
          ? Array.from({ length: 6 }).map((_, index) => <KpiSkeleton key={index} />)
          : cards.map((card) => <KpiCard key={card.label} {...card} />)}
      </div>

      {/* ── Priority band ────────────────────────────────────────────────── */}
      {priorityItems.length > 0 ? (
        <section>
          <SectionHeading
            eyebrow={tx('Action center', 'مركز الإجراءات')}
            title={systemMode ? tx('Needs attention', 'يحتاج إلى متابعة') : tx('Your quick glance', 'لمحتك السريعة')}
            icon={AlertTriangle}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {priorityItems.map((item) => (
              <PriorityCard key={`${item.href}-${item.label}`} item={item} isRTL={isRTL} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Main analytics + Quick actions ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-card xl:col-span-2">
          <SectionHeading
            eyebrow={periodLabel}
            title={systemMode ? tx('Monthly ministry activity', 'النشاط الشهري للخدمة') : tx('My activity timeline', 'مخطط نشاطي')}
            subtitle={
              systemMode
                ? tx('Confession sessions and visitations across recent months.', 'جلسات الاعتراف والزيارات خلال الأشهر الأخيرة.')
                : tx('Meetings, liturgies, and bookings over time.', 'الاجتماعات والقداسات والحجوزات عبر الوقت.')
            }
            icon={TrendingUp}
            action={
              periodTotal > 0 ? (
                <div className="text-end">
                  <p className="text-2xl font-bold leading-none tracking-tight text-heading">{periodTotal}</p>
                  <p className="mt-1 text-[11px] font-medium text-muted">{tx('total this period', 'الإجمالي بالفترة')}</p>
                </div>
              ) : null
            }
          />
          <MonthlyActivityChart
            buckets={activeBuckets}
            isRTL={isRTL}
            loading={chartLoading}
            emptyLabel={tx('No activity recorded yet.', 'لا توجد بيانات نشاط بعد.')}
            periodLabel={periodLabel}
            allLabel={tx('All', 'الكل')}
            tx={tx}
          />
        </section>

        <section className="flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-card">
          <SectionHeading
            eyebrow={tx('Shortcuts', 'اختصارات')}
            title={tx('Quick actions', 'إجراءات سريعة')}
            subtitle={tx('Jump into the modules you need next.', 'انتقل سريعًا إلى الوحدات التي تحتاجها.')}
            icon={Sparkles}
          />
          <div className="mt-6 space-y-3">
            {actions.length === 0 ? (
              <p className="text-sm text-muted">{tx('No quick actions are available for your current access.', 'لا توجد إجراءات سريعة ضمن صلاحياتك الحالية.')}</p>
            ) : (
              actions.map((action) => (
                <QuickAction key={action.href} action={action} isRTL={isRTL} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Insight cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-card">
          <SectionHeading
            eyebrow={systemMode ? tx('Confession analytics', 'تحليلات الاعتراف') : tx('Household details', 'تفاصيل البيت')}
            title={systemMode ? tx('Confession session mix', 'توزيع أنواع جلسات الاعتراف') : tx('Family and household context', 'سياق العائلة والبيت')}
            subtitle={
              systemMode
                ? tx('Most used session types this period.', 'أكثر أنواع الجلسات استخدامًا في الفترة الحالية.')
                : tx('House data from your own profile record.', 'بيانات البيت المتاحة من ملفك الشخصي فقط.')
            }
            icon={BarChart3}
          />
          {!systemMode ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="secondary">{tx('Family', 'العائلة')}: {me?.familyName || tx('No family name yet', 'لا يوجد اسم عائلة بعد')}</Badge>
              <Badge variant="primary">{tx('House', 'البيت')}: {me?.houseName || tx('No house name yet', 'لا يوجد اسم بيت بعد')}</Badge>
            </div>
          ) : null}
          <div className="mt-6">
            <MetricBars
              items={systemMode ? confessionItems : familyItems}
              emptyLabel={tx('No data available yet.', 'لا توجد بيانات بعد.')}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-card">
          <SectionHeading
            eyebrow={systemMode ? tx('Visitation analytics', 'تحليلات الزيارات') : tx('My bookings', 'حجوزاتي')}
            title={systemMode ? tx('Top visited houses', 'أكثر المنازل افتقادًا') : tx('My booking status', 'حالة حجوزاتي')}
            subtitle={
              systemMode
                ? tx('Homes receiving the most visitation volume.', 'المنازل التي تستقبل أكبر حجم من الزيارات.')
                : tx('How your requests are distributed right now.', 'توزيع طلباتك الحالية حسب الحالة.')
            }
            icon={Home}
          />
          <div className="mt-6">
            <MetricBars
              items={systemMode ? houseItems : bookingItems}
              emptyLabel={systemMode ? tx('No data available yet.', 'لا توجد بيانات بعد.') : tx('You have not submitted any bookings yet.', 'لم تقم بإرسال أي حجز بعد.')}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-card">
          <SectionHeading
            eyebrow={tx('Summary', 'ملخص')}
            title={systemMode ? tx('Key highlights', 'أبرز المؤشرات') : tx('At a glance', 'لمحة سريعة')}
            subtitle={
              systemMode
                ? tx('Standout figures from the current period.', 'أبرز الأرقام من الفترة الحالية.')
                : tx('A quick look at your church activity.', 'نظرة سريعة على نشاطك في الكنيسة.')
            }
            icon={Activity}
          />
          <div className="mt-6 space-y-2.5">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-alt/30 px-4 py-3"
              >
                <span className="text-xs font-medium text-muted">{item.label}</span>
                <span className="truncate text-sm font-semibold text-heading">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
