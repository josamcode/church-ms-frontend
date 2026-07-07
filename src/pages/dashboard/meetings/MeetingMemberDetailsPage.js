import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight, CalendarDays, Layers3, MessageSquareText, Phone,
  Save, StickyNote, UserCircle, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import Section from '../../../components/ui/Section';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';

const EMPTY = '---';

export default function MeetingMemberDetailsPage() {
  const { meetingId, memberId } = useParams();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [note, setNote] = useState('');

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
    setNote('');
  }, [meetingId, memberId]);

  const saveNotesMutation = useMutation({
    mutationFn: () => meetingsApi.meetings.updateMemberNotes(meetingId, memberId, note.trim()),
    onSuccess: () => {
      toast.success(tf('meetings.memberDetails.messages.notesUpdated', 'Member note added successfully.'));
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['meetings', 'member', meetingId, memberId] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'details', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'list'] });
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const member = memberQuery.data || null;
  const noteItems = Array.isArray(member?.notes) ? member.notes : [];
  const canEditNote = Boolean(member?.canEditNote);
  const groups = useMemo(() => (Array.isArray(member?.groups) ? member.groups : []), [member?.groups]);

  const lastNoteAt = noteItems.length > 0 ? noteItems[0]?.updatedAt : null;
  const initial = String(member?.fullName || '?').trim().charAt(0).toUpperCase();

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
        <Card tone="primary" className="overflow-hidden">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="h-16 w-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
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

      {/* ══ SUMMARY HEADER ════════════════════════════════════════════════ */}
      <Card tone="primary" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-16 -end-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-2xl font-bold text-primary ring-1 ring-primary/15">
              {initial}
            </div>
            <PageHeader
              contentOnly
              eyebrow={tf('meetings.memberDetails.pageTitle', 'Member Details')}
              title={member.fullName || EMPTY}
              titleClassName="mt-1 text-3xl font-bold tracking-tight text-heading"
              childrenClassName="mt-2 flex flex-wrap items-center gap-2"
            >
              {member.phonePrimary && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted direction-ltr">
                  <Phone className="h-3 w-3" />
                  {member.phonePrimary}
                </span>
              )}
              <Link to={`/dashboard/meetings/list/${meetingId}`}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/12">
                  <CalendarDays className="h-3 w-3" />
                  {member.meeting?.name || tf('meetings.memberDetails.meetingFallback', 'Meeting')}
                </span>
              </Link>
            </PageHeader>
          </div>

          <Link to={`/dashboard/meetings/list/${meetingId}`}>
            <Button variant="outline" icon={ArrowUpRight}>
              {member.meeting?.name || tf('meetings.memberDetails.meetingFallback', 'Meeting')}
            </Button>
          </Link>
        </div>
      </Card>

      {/* ══ KPI TILES ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Layers3}
          label={tf('meetings.memberDetails.groupsTitle', 'Groups')}
          value={groups.length}
          tone="primary"
          isRTL={isRTL}
        />
        <StatCard
          icon={StickyNote}
          label={tf('meetings.memberDetails.noteHistoryTitle', 'Note History')}
          value={noteItems.length}
          tone="gold"
          isRTL={isRTL}
        />
        <StatCard
          icon={MessageSquareText}
          label={tf('meetings.memberDetails.noteTitle', 'Note')}
          value={lastNoteAt ? formatDateTime(lastNoteAt) : EMPTY}
          hint={lastNoteAt ? undefined : tf('meetings.memberDetails.noNotesYet', 'No notes added yet.')}
          isRTL={isRTL}
        />
      </div>

      {/* ══ GROUPS ════════════════════════════════════════════════════════ */}
      {groups.length > 0 && (
        <Section
          icon={Layers3}
          title={tf('meetings.memberDetails.groupsTitle', 'Groups')}
        >
          <div className="flex flex-wrap gap-2">
            {groups.map((groupName) => (
              <Badge key={groupName} variant="primary" size="md" dot>
                {groupName}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {/* ══ NOTE EDITOR ═══════════════════════════════════════════════════ */}
      <Section
        icon={MessageSquareText}
        title={tf('meetings.memberDetails.noteTitle', 'Note')}
        actions={
          canEditNote ? (
            <Button
              icon={Save}
              onClick={() => saveNotesMutation.mutate()}
              disabled={!note.trim()}
              loading={saveNotesMutation.isPending}
            >
              {t('common.actions.save')}
            </Button>
          ) : null
        }
      >
        <TextArea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={tf('meetings.memberDetails.notePlaceholder', 'Write a note...')}
          disabled={!canEditNote}
        />

        {/* ── NOTE HISTORY TIMELINE ── */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="section-label">
              {tf('meetings.memberDetails.noteHistoryTitle', 'Note History')}
            </span>
            <div className="h-px flex-1 bg-border/60" />
            {noteItems.length > 0 && (
              <span className="text-[11px] font-semibold tabular-nums text-muted">
                {noteItems.length}
              </span>
            )}
          </div>

          {noteItems.length === 0 ? (
            <EmptyState
              compact
              icon={StickyNote}
              title={tf('meetings.memberDetails.noNotesYet', 'No notes added yet.')}
            />
          ) : (
            <ol className="relative space-y-4 ps-6">
              {/* connector line */}
              <span
                className="pointer-events-none absolute inset-y-1 start-[7px] w-px bg-border/70"
                aria-hidden
              />
              {noteItems.map((item, index) => {
                const author =
                  item.updatedBy?.fullName
                  || item.addedBy?.fullName
                  || tf('meetings.memberDetails.unknownNoteAuthor', 'Unknown servant');
                return (
                  <li
                    key={item.id || `${item.updatedAt || ''}-${item.note || ''}`}
                    className="relative"
                  >
                    {/* node */}
                    <span
                      className={`absolute -start-6 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-surface ${
                        index === 0 ? 'bg-primary' : 'bg-border'
                      }`}
                      aria-hidden
                    />
                    <div className="rounded-xl border border-border/80 bg-surface-alt/50 px-3.5 py-3">
                      <p className="whitespace-pre-wrap break-words text-sm text-heading">
                        {item.note || EMPTY}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1 font-medium text-heading/80">
                          <UserCircle className="h-3.5 w-3.5" />
                          {tf('meetings.memberDetails.noteByLabel', 'By')} {author}
                        </span>
                        <span className="tabular-nums">{formatDateTime(item.updatedAt)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Section>
    </div>
  );
}
