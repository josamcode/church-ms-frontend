import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarPlus,
  CalendarCheck,
  CalendarClock,
  UserCircle,
  Layers,
  ListChecks,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { confessionsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import StatCard from '../../../components/ui/StatCard';
import PageHeader from '../../../components/ui/PageHeader';
import { formatDateTime } from '../../../utils/formatters';
import { localizeSessionTypeName } from '../../../utils/sessionTypeLocalization';
import { useI18n } from '../../../i18n/i18n';
import useNavigateToUser from '../../../hooks/useNavigateToUser';

/* ── shared section label ──────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export default function ConfessionSessionsPage() {
  const { user, hasPermission } = useAuth();
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const navigateToUser = useNavigateToUser();
  const canCreate = hasPermission('CONFESSIONS_CREATE');
  const currentUserId = user?._id || user?.id || null;
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(20);
  const [showMineOnly, setShowMineOnly] = useState(false);

  const resetPagination = () => {
    setCursor(null);
    setCursorStack([null]);
  };

  const sessionQueryParams = useMemo(
    () => ({
      limit,
      order: 'desc',
      ...(cursor && { cursor }),
      ...(showMineOnly && currentUserId ? { createdByUserId: currentUserId } : {}),
    }),
    [cursor, currentUserId, limit, showMineOnly]
  );

  const { data: sessionsRes, isLoading: sessionsLoading } = useQuery({
    queryKey: ['confessions', 'sessions', sessionQueryParams],
    queryFn: async () => {
      const { data } = await confessionsApi.listSessions(sessionQueryParams);
      return data;
    },
    keepPreviousData: true,
    staleTime: 30000,
  });

  const sessions = sessionsRes?.data ?? [];
  const sessionsMeta = sessionsRes?.meta ?? null;
  const sectionTitle = showMineOnly
    ? tf('confessions.sessions.mineTitle', 'My Created Sessions')
    : t('confessions.sessions.recentTitle');
  const emptyTitle = showMineOnly
    ? tf('confessions.sessions.emptyMineTitle', 'No created confession sessions yet')
    : t('confessions.sessions.emptyTitle');
  const emptyDescription = showMineOnly
    ? tf(
        'confessions.sessions.emptyMineDescription',
        'Sessions created by your account will appear here.'
      )
    : t('confessions.sessions.emptyDescription');

  /* ── derived read-only KPI counts (from already-fetched page data) ── */
  const nowTs = Date.now();
  const pageCount = sessions.length;
  const upcomingCount = useMemo(
    () =>
      sessions.filter((row) => {
        const ts = new Date(row.nextSessionAt || row.scheduledAt).getTime();
        return Number.isFinite(ts) && ts >= nowTs;
      }).length,
    [sessions, nowTs]
  );
  const withFollowUpCount = useMemo(
    () => sessions.filter((row) => Boolean(row.nextSessionAt)).length,
    [sessions]
  );
  const distinctTypes = useMemo(
    () =>
      new Set(
        sessions
          .map((row) => row.sessionType?.name)
          .filter(Boolean)
      ).size,
    [sessions]
  );
  const totalLabel = sessionsMeta?.count != null ? sessionsMeta.count : pageCount;

  const handleNext = () => {
    if (sessionsMeta?.nextCursor) {
      setCursorStack((prev) => [...prev, sessionsMeta.nextCursor]);
      setCursor(sessionsMeta.nextCursor);
    }
  };

  const handlePrev = () => {
    setCursorStack((prev) => {
      const next = prev.slice(0, -1);
      setCursor(next[next.length - 1] || null);
      return next;
    });
  };

  const columns = useMemo(() => [
    {
      key: 'attendee',
      label: t('confessions.sessions.columns.attendee'),
      render: (row) => (
        <button
          type="button"
          onClick={() => navigateToUser(row.attendee?.id)}
          className="group flex items-center gap-3 text-start"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <p className="truncate font-semibold text-heading transition-colors group-hover:text-primary">
              {row.attendee?.fullName || t('common.placeholder.empty')}
            </p>
            {row.attendee?.phonePrimary && (
              <p className="text-xs text-muted direction-ltr">{row.attendee.phonePrimary}</p>
            )}
          </span>
        </button>
      ),
    },
    {
      key: 'sessionType',
      label: t('confessions.sessions.columns.type'),
      render: (row) => (
        <Badge variant="primary" dot>
          {localizeSessionTypeName(row.sessionType?.name, t)}
        </Badge>
      ),
    },
    {
      key: 'scheduledAt',
      label: t('confessions.sessions.columns.scheduledAt'),
      render: (row) => (
        <span className="text-sm font-medium text-heading">{formatDateTime(row.scheduledAt)}</span>
      ),
    },
    {
      key: 'nextSessionAt',
      label: t('confessions.sessions.columns.nextSessionAt'),
      render: (row) =>
        row.nextSessionAt ? (
          <Badge variant="info" dot>
            {formatDateTime(row.nextSessionAt)}
          </Badge>
        ) : (
          <span className="text-sm text-muted">{t('common.placeholder.empty')}</span>
        ),
    },
    {
      key: 'createdBy',
      label: t('confessions.sessions.columns.createdBy'),
      render: (row) => (
        <span className="text-sm text-heading">
          {row.createdByUser?.fullName || t('common.placeholder.empty')}
        </span>
      ),
    },
  ], [navigateToUser, t]);

  return (
    <div className="animate-fade-in space-y-8 pb-10">

      {/* ── Breadcrumbs ── */}
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('confessions.sessions.page') },
        ]}
      />

      {/* ══ PAGE HEADER ═══════════════════════════════════════════════════ */}
      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('confessions.sessions.page')}
        title={t('confessions.sessions.recentTitle')}
        subtitle={t('confessions.sessions.recentSubtitle')}
        actions={(
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <Button
                icon={CalendarPlus}
                onClick={() => navigate('/dashboard/confessions/new')}
              >
                {t('confessions.sessions.createAction')}
              </Button>
            ) : null}
          </div>
        )}
      />

      {/* ══ KPI STRIP ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label={sectionTitle}
          value={totalLabel}
          hint={t('confessions.sessions.page')}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={CalendarCheck}
          label={t('confessions.sessions.columns.scheduledAt')}
          value={upcomingCount}
          hint={t('confessions.sessions.recentSubtitle')}
          tone="success"
          isRTL={isRTL}
        />
        <StatCard
          icon={CalendarClock}
          label={t('confessions.sessions.columns.nextSessionAt')}
          value={withFollowUpCount}
          hint={t('confessions.sessions.columns.nextSessionAt')}
          tone="gold"
          isRTL={isRTL}
        />
        <StatCard
          icon={Layers}
          label={t('confessions.sessions.columns.type')}
          value={distinctTypes}
          hint={t('confessions.sessions.columns.type')}
          tone="info"
          isRTL={isRTL}
        />
      </div>

      {/* ══ FILTER BAR ════════════════════════════════════════════════════ */}
      {currentUserId ? (
        <Card tone="muted" padding="sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Filter className="h-3.5 w-3.5" />
              {tf('confessions.sessions.showMineAction', 'My created sessions')}
            </span>
            <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  if (!showMineOnly) return;
                  setShowMineOnly(false);
                  resetPagination();
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  !showMineOnly
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-heading'
                }`}
              >
                {tf('confessions.sessions.showAllAction', 'Show all sessions')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showMineOnly) return;
                  setShowMineOnly(true);
                  resetPagination();
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  showMineOnly
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-heading'
                }`}
              >
                {tf('confessions.sessions.showMineAction', 'My created sessions')}
              </button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* ══ TABLE SECTION ═════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{sectionTitle}</SectionLabel>
          {sessionsMeta?.count != null && (
            <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-muted">
              {sessionsMeta.count}
            </span>
          )}
        </div>

        <div>
          <Table
            columns={columns}
            data={sessions}
            loading={sessionsLoading}
            renderMode="auto"
            emptyIcon={CalendarPlus}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />

          {(sessionsMeta?.nextCursor || cursorStack.length > 1) && (
            <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
              <Pagination
                meta={sessionsMeta}
                onLoadMore={handleNext}
                onPrev={handlePrev}
                cursors={cursorStack}
                loading={sessionsLoading}
              />
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
