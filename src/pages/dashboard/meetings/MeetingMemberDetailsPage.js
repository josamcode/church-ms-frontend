import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, Phone, Save, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import TextArea from '../../../components/ui/TextArea';
import Badge from '../../../components/ui/Badge';
import { useI18n } from '../../../i18n/i18n';

const EMPTY = '---';

export default function MeetingMemberDetailsPage() {
  const { meetingId, memberId } = useParams();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [notes, setNotes] = useState('');

  const memberQuery = useQuery({
    queryKey: ['meetings', 'member', meetingId, memberId],
    enabled: Boolean(meetingId && memberId),
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.getMemberById(meetingId, memberId);
      return data?.data || null;
    },
  });

  useEffect(() => {
    setNotes(memberQuery.data?.notes || '');
  }, [memberQuery.data?.notes]);

  const saveNotesMutation = useMutation({
    mutationFn: () => meetingsApi.meetings.updateMemberNotes(meetingId, memberId, notes),
    onSuccess: () => {
      toast.success(tf('meetings.memberDetails.messages.notesUpdated', 'Member notes updated successfully.'));
      queryClient.invalidateQueries({ queryKey: ['meetings', 'member', meetingId, memberId] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'details', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'list'] });
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const member = memberQuery.data || null;
  const canEditNotes = Boolean(member?.canEditNotes);

  const breadcrumbs = [
    { label: t('shared.dashboard'), href: '/dashboard' },
    { label: t('meetings.meetingsPageTitle'), href: '/dashboard/meetings/list' },
    member?.meeting?.name
      ? { label: member.meeting.name, href: `/dashboard/meetings/list/${meetingId}` }
      : { label: tf('meetings.memberDetails.meetingFallback', 'Meeting'), href: `/dashboard/meetings/list/${meetingId}` },
    { label: member?.fullName || tf('meetings.memberDetails.pageTitle', 'Member Details') },
  ];

  if (memberQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <p className="text-sm text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <EmptyState
          icon={Users}
          title={tf('meetings.memberDetails.notFoundTitle', 'Member not found')}
          description={tf(
            'meetings.memberDetails.notFoundDescription',
            'This meeting member is not available or you do not have access to it.'
          )}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs items={breadcrumbs} />

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold tracking-tight text-heading">{member.fullName || EMPTY}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-muted direction-ltr">
            <Phone className="h-3 w-3" />
            {member.phonePrimary || EMPTY}
          </span>
          <Link to={`/dashboard/meetings/list/${meetingId}`}>
            <Badge variant="default">{member.meeting?.name || tf('meetings.memberDetails.meetingFallback', 'Meeting')}</Badge>
          </Link>
        </div>
      </div>

      {(member.groups || []).length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            {tf('meetings.memberDetails.groupsTitle', 'Groups')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(member.groups || []).map((groupName) => (
              <span
                key={groupName}
                className="rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {groupName}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-muted" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            {t('meetings.fields.notes')}
          </p>
        </div>

        <div className="mt-3">
          <TextArea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={tf('meetings.memberDetails.notesPlaceholder', 'Write member notes...')}
            disabled={!canEditNotes}
          />
        </div>

        {canEditNotes && (
          <div className="mt-3 flex justify-end">
            <Button
              icon={Save}
              onClick={() => saveNotesMutation.mutate()}
              loading={saveNotesMutation.isPending}
            >
              {t('common.actions.save')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

