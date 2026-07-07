import { useQuery } from '@tanstack/react-query';
import {
  CalendarCog,
  CheckCircle2,
  Clock,
  Layers,
  ListChecks,
  Pencil,
  Plus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { bookingsApi } from '../../../api/endpoints';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { useI18n } from '../../../i18n/i18n';
import { availabilityLabel } from './bookingTypeForm.utils';

export default function BookingTypesPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

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

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: tf('bookings.dashboard.typesPage', 'Booking types') },
        ]}
      />

      <PageHeader
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

      {typesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
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
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Layers}
              tone="primary"
              label={tf('bookings.dashboard.typesTitle', 'Booking types')}
              value={bookingTypes.length}
            />
            <StatCard
              icon={CheckCircle2}
              tone="success"
              label={tf('bookings.dashboard.active', 'active')}
              value={activeCount}
            />
            <StatCard
              icon={Clock}
              tone="default"
              label={tf('bookings.dashboard.inactive', 'inactive')}
              value={inactiveCount}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {bookingTypes.map((type) => (
              <Card key={type.id} padding="lg" hover className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CalendarCog className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-heading">{type.name}</p>
                      <p className="mt-1 text-sm text-muted">
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
                  <p className="mt-3 text-sm leading-6 text-muted">{type.description}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt/60 px-3 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    {type.durationMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt/60 px-3 py-1">
                    <Users className="h-3.5 w-3.5" />
                    cap {type.capacity}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt/60 px-3 py-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    {(type.dynamicFields || []).length} fields
                  </span>
                </div>

                <div className="mt-5 border-t border-border/60 pt-4">
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
        </>
      )}
    </div>
  );
}
