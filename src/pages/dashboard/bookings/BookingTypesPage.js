import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarClock,
  CalendarCog,
  CalendarRange,
  CheckCircle2,
  Clock,
  Layers,
  ListChecks,
  Pencil,
  Plus,
  RefreshCw,
  Timer,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { bookingsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { useI18n } from '../../../i18n/i18n';
import { availabilityLabel, isBookableMode } from './bookingTypeForm.utils';

// Compact labelled config stat inside a type card.
function ConfigStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-surface-alt/40 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1.5 text-sm font-bold text-heading">{value}</p>
    </div>
  );
}

export default function BookingTypesPage() {
  const navigate = useNavigate();
  const { t, isRTL } = useI18n();

  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const typesQuery = useQuery({
    queryKey: ['bookings', 'types'],
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await bookingsApi.admin.listTypes();
      return data;
    },
  });

  const bookingTypes = Array.isArray(typesQuery.data?.data) ? typesQuery.data.data : [];
  const activeCount = bookingTypes.filter((type) => type.isActive).length;
  const inactiveCount = bookingTypes.length - activeCount;
  const hasTypes = bookingTypes.length > 0;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: tf('bookings.dashboard.typesPage', 'Booking types') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={tf('bookings.dashboard.typesEyebrow', 'Booking configuration')}
        title={tf('bookings.dashboard.typesTitle', 'Booking types')}
        subtitle={tf(
          'bookings.dashboard.typesListSubtitle',
          'Review existing booking types and open the dedicated form to create or edit them.'
        )}
        actions={(
          <Button
            type="button"
            icon={Plus}
            onClick={() => navigate('/dashboard/bookings/types/new')}
          >
            {tf('bookings.dashboard.createNewType', 'Create new type')}
          </Button>
        )}
      />

      {/* ══ KPI STRIP — always visible above the collection ══════════════ */}
      {hasTypes ? (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={Layers}
            tone="gold"
            isRTL={isRTL}
            label={tf('bookings.dashboard.typesTitle', 'Booking types')}
            value={bookingTypes.length}
          />
          <StatCard
            icon={CheckCircle2}
            tone="success"
            isRTL={isRTL}
            label={tf('bookings.dashboard.active', 'active')}
            value={activeCount}
          />
          <StatCard
            icon={Clock}
            tone="default"
            isRTL={isRTL}
            label={tf('bookings.dashboard.inactive', 'inactive')}
            value={inactiveCount}
          />
        </div>
      ) : null}

      {/* ══ COLLECTION — loading / error / empty / grid ═════════════════ */}
      {typesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : typesQuery.isError ? (
        <Card className="border-danger/30">
          <EmptyState
            icon={AlertTriangle}
            title={tf('bookings.dashboard.errorTitle', 'Something went wrong')}
            description={normalizeApiError(typesQuery.error).message}
            action={(
              <Button
                type="button"
                variant="outline"
                icon={RefreshCw}
                onClick={() => typesQuery.refetch()}
              >
                {tf('bookings.dashboard.retry', 'Try again')}
              </Button>
            )}
          />
        </Card>
      ) : bookingTypes.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarCog}
            title={tf('bookings.dashboard.noTypesTitle', 'No booking types yet')}
            description={tf(
              'bookings.dashboard.noTypesBody',
              'Create the first booking type to configure availability rules and public fields.'
            )}
            action={(
              <Button
                type="button"
                icon={Plus}
                onClick={() => navigate('/dashboard/bookings/types/new')}
              >
                {tf('bookings.dashboard.createNewType', 'Create new type')}
              </Button>
            )}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {bookingTypes.map((type) => (
            <Card
              key={type.id}
              padding="lg"
              hover
              className={`relative flex flex-col overflow-hidden ps-6 before:absolute before:inset-y-0 before:start-0 before:w-1.5 ${
                type.isActive ? 'before:bg-success' : 'before:bg-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarCog className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-heading">{type.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <CalendarRange className="h-3.5 w-3.5 flex-shrink-0" />
                      {availabilityLabel(type.availabilityMode, tf)}
                    </p>
                  </div>
                </div>
                <Badge variant={type.isActive ? 'success' : 'neutral'} dot>
                  {type.isActive
                    ? tf('bookings.dashboard.active', 'active')
                    : tf('bookings.dashboard.inactive', 'inactive')}
                </Badge>
              </div>

              {type.description ? (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{type.description}</p>
              ) : null}

              {isBookableMode(type.availabilityMode) ? (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <ConfigStat
                      icon={Clock}
                      label={tf('bookings.dashboard.duration', 'Duration')}
                      value={`${type.durationMinutes} ${tf('bookings.dashboard.unitMinutes', 'min')}`}
                    />
                    <ConfigStat
                      icon={Timer}
                      label={tf('bookings.dashboard.interval', 'Interval')}
                      value={`${type.slotIntervalMinutes} ${tf('bookings.dashboard.unitMinutes', 'min')}`}
                    />
                    <ConfigStat
                      icon={Users}
                      label={tf('bookings.dashboard.capacity', 'Capacity')}
                      value={type.capacity}
                    />
                    <ConfigStat
                      icon={ListChecks}
                      label={tf('bookings.dashboard.additionalFields', 'Additional fields')}
                      value={(type.dynamicFields || []).length}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                    <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{`${type.bookingHorizonDays} ${tf('bookings.dashboard.horizonDays', 'days ahead')}`}</span>
                  </div>
                </>
              ) : (
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                  <ListChecks className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {`${(type.dynamicFields || []).length} ${tf('bookings.dashboard.additionalFields', 'Additional fields')}`}
                  </span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Pencil}
                  onClick={() => navigate(`/dashboard/bookings/types/${type.id}/edit`)}
                >
                  {tf('bookings.dashboard.editType', 'Edit type')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
