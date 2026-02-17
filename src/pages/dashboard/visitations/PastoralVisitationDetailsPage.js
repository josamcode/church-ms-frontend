import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, Clock3, UserCircle, CalendarClock, FileText, Users } from 'lucide-react';
import { usersApi, visitationsApi } from '../../../api/endpoints';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import { formatDateTime, getRoleLabel } from '../../../utils/formatters';
import { useI18n } from '../../../i18n/i18n';
import useNavigateToUser from '../../../hooks/useNavigateToUser';

const EMPTY = '---';

export default function PastoralVisitationDetailsPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const navigateToUser = useNavigateToUser();

  const { data: visitation, isLoading } = useQuery({
    queryKey: ['visitations', 'details', id],
    queryFn: async () => {
      const { data } = await visitationsApi.getById(id);
      return data?.data || null;
    },
    staleTime: 60000,
  });
  const { data: houseMembersRes, isLoading: houseMembersLoading } = useQuery({
    queryKey: ['visitations', 'house-members', visitation?.houseName],
    queryFn: async () => {
      const { data } = await usersApi.list({
        houseName: visitation.houseName,
        limit: 100,
        sort: 'fullName',
        order: 'asc',
      });
      return data?.data || [];
    },
    enabled: !!visitation?.houseName,
    staleTime: 30000,
  });

  const houseMembers = useMemo(() => {
    const members = Array.isArray(houseMembersRes) ? houseMembersRes : [];
    const normalizedHouseName = String(visitation?.houseName || '')
      .trim()
      .toLowerCase();
    return members.filter(
      (member) => String(member.houseName || '').trim().toLowerCase() === normalizedHouseName
    );
  }, [houseMembersRes, visitation?.houseName]);

  const breadcrumbItems = useMemo(
    () => [
      { label: t('shared.dashboard'), href: '/dashboard' },
      { label: t('visitations.list.page'), href: '/dashboard/visitations' },
      { label: visitation?.houseName || t('visitations.details.page') },
    ],
    [t, visitation?.houseName]
  );

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} />
        <Card>
          <p className="text-sm text-muted">{t('visitations.details.loading')}</p>
        </Card>
      </div>
    );
  }

  if (!visitation) {
    return (
      <div className="animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} />
        <EmptyState
          icon={Home}
          title={t('visitations.details.notFoundTitle')}
          description={t('visitations.details.notFoundDescription')}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <Card>
        <CardHeader
          title={t('visitations.details.title')}
          subtitle={t('visitations.details.subtitle')}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoItem icon={Home} label={t('visitations.details.houseName')} value={visitation.houseName} />
          <InfoItem
            icon={CalendarClock}
            label={t('visitations.details.visitedAt')}
            value={formatDateTime(visitation.visitedAt)}
          />
          <InfoItem
            icon={Clock3}
            label={t('visitations.details.durationMinutes')}
            value={`${visitation.durationMinutes || 10} ${t('visitations.shared.minutes')}`}
          />
          <InfoItem
            icon={CalendarClock}
            label={t('visitations.details.recordedAt')}
            value={formatDateTime(visitation.recordedAt || visitation.createdAt)}
          />
          <div className="rounded-xl border border-border bg-surface-alt/60 p-3">
            <div className="mb-1 flex items-center gap-2 text-muted">
              <UserCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {t('visitations.details.recordedBy')}
              </span>
            </div>
            <p className="text-sm font-semibold text-heading mb-2">
              {visitation.recordedBy?.fullName || EMPTY}
            </p>
            {visitation.recordedBy?.id && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigateToUser(visitation.recordedBy.id)}
              >
                {t('visitations.details.viewRecorder')}
              </Button>
            )}
          </div>
          <InfoItem
            icon={FileText}
            label={t('visitations.details.notes')}
            value={visitation.notes || EMPTY}
            className="md:col-span-2"
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title={t('visitations.details.houseMembersTitle')}
          subtitle={t('visitations.details.houseMembersSubtitle', { count: houseMembers.length })}
          action={<Users className="w-5 h-5 text-primary" />}
        />
        {houseMembersLoading ? (
          <p className="text-sm text-muted">{t('visitations.details.houseMembersLoading')}</p>
        ) : houseMembers.length === 0 ? (
          <p className="text-sm text-muted">{t('visitations.details.houseMembersEmpty')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {houseMembers.map((member) => (
              <div
                key={member._id || member.id}
                className="rounded-lg border border-border bg-surface-alt/60 p-3 cursor-pointer"
                onClick={() => navigateToUser(member._id || member.id)}

              >
                <p className="text-sm font-semibold text-heading">{member.fullName || EMPTY}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-surface-alt/60 p-3 ${className}`}>
      <div className="mb-1 flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-heading">{value || EMPTY}</p>
    </div>
  );
}
