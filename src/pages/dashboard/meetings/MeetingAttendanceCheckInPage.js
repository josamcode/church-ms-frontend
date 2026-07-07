import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Square,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { meetingsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import Section from '../../../components/ui/Section';
import Select from '../../../components/ui/Select';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { getDayLabel } from './meetingsForm.utils';
import { buildPastMeetingDateOptions } from './meetingDateOptions.utils';

const EMPTY = '---';

function toComparableId(value) {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value.id || value._id || value);
}

function buildAttendanceGroups(meeting, t) {
  const groupedMemberIds = new Set();
  const groups = (meeting?.groupAssignments || [])
    .map((assignment, index) => {
      const members = [...new Map(
        (assignment?.servedUsers || [])
          .map((user) => {
            const memberId = toComparableId(user);
            return memberId ? [memberId, { ...user, id: memberId }] : null;
          })
          .filter(Boolean)
      ).values()]
        .sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));

      members.forEach((member) => groupedMemberIds.add(member.id));

      return {
        key: assignment?.group || `group-${index}`,
        name: assignment?.group || t('meetings.fields.groups'),
        members,
      };
    })
    .filter((group) => group.members.length > 0);

  const ungroupedMembers = [...new Map(
    (meeting?.servedUsers || [])
      .map((user) => {
        const memberId = toComparableId(user);
        if (!memberId || groupedMemberIds.has(memberId)) return null;
        return [memberId, { ...user, id: memberId }];
      })
      .filter(Boolean)
  ).values()]
    .sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));

  if (ungroupedMembers.length > 0) {
    groups.push({
      key: 'ungrouped',
      name: t('meetings.attendance.ungroupedLabel'),
      members: ungroupedMembers,
    });
  }

  return groups;
}

function buildUniqueMemberIds(groups = []) {
  return [...new Set(
    groups.flatMap((group) => (group?.members || []).map((member) => member.id).filter(Boolean))
  )];
}

function MemberToggleRow({ member, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(member.id)}
      aria-pressed={checked}
      className={[
        'flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-start transition-all duration-150 active:scale-[0.99]',
        checked
          ? 'border-success/40 bg-success-light shadow-sm'
          : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
            checked ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
          ].join(' ')}
        >
          {String(member?.fullName || '?').trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-heading">{member?.fullName || EMPTY}</p>
          <p className="truncate text-xs text-muted direction-ltr text-left">{member?.phonePrimary || EMPTY}</p>
        </div>
      </div>
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
          checked ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-surface-alt/60 text-muted',
        ].join(' ')}
      >
        {checked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
      </span>
    </button>
  );
}

export default function MeetingAttendanceCheckInPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const meetingQuery = useQuery({
    queryKey: ['meetings', 'details', id],
    enabled: Boolean(id),
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.getById(id);
      return data?.data || null;
    },
  });

  const meeting = meetingQuery.data || null;
  const attendanceDateOptions = useMemo(() => buildPastMeetingDateOptions(meeting), [meeting]);
  const attendanceGroups = useMemo(() => buildAttendanceGroups(meeting, t), [meeting, t]);
  const allVisibleMemberIds = useMemo(
    () => buildUniqueMemberIds(attendanceGroups),
    [attendanceGroups]
  );

  useEffect(() => {
    if (!selectedDate && attendanceDateOptions.length > 0) {
      setSelectedDate(attendanceDateOptions[0].value);
    }
  }, [attendanceDateOptions, selectedDate]);

  useEffect(() => {
    setSelectedMemberIds([]);
  }, [selectedDate]);

  const attendanceQuery = useQuery({
    queryKey: ['meetings', 'attendance', id, selectedDate],
    enabled: Boolean(id && selectedDate),
    staleTime: 0,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.getAttendance(id, selectedDate);
      return data?.data || null;
    },
  });

  useEffect(() => {
    if (!attendanceQuery.data) return;
    setSelectedMemberIds(Array.isArray(attendanceQuery.data.attendedMemberUserIds)
      ? attendanceQuery.data.attendedMemberUserIds
      : []);
  }, [attendanceQuery.data]);

  const saveAttendanceMutation = useMutation({
    mutationFn: () => meetingsApi.meetings.updateAttendance(id, selectedDate, selectedMemberIds),
    onSuccess: ({ data }) => {
      const payload = data?.data || null;
      if (payload) {
        setSelectedMemberIds(Array.isArray(payload.attendedMemberUserIds) ? payload.attendedMemberUserIds : []);
      }
      toast.success(tf('meetings.attendance.messages.saved', 'Attendance saved successfully.'));
      queryClient.invalidateQueries({ queryKey: ['meetings', 'attendance', id, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'details', id] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'list'] });
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const selectedMemberIdSet = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds]);
  const totalVisibleMembers = allVisibleMemberIds.length;
  const presentCount = useMemo(
    () => allVisibleMemberIds.filter((memberId) => selectedMemberIdSet.has(memberId)).length,
    [allVisibleMemberIds, selectedMemberIdSet]
  );
  const absentCount = Math.max(totalVisibleMembers - presentCount, 0);

  const toggleMember = (memberId) => {
    setSelectedMemberIds((current) => (
      current.includes(memberId)
        ? current.filter((idValue) => idValue !== memberId)
        : [...current, memberId]
    ));
  };

  const breadcrumbs = [
    { label: t('shared.dashboard'), href: '/dashboard' },
    { label: t('meetings.meetingsPageTitle'), href: '/dashboard/meetings/list' },
    meeting?.name
      ? { label: meeting.name, href: `/dashboard/meetings/list/${id}` }
      : { label: tf('meetings.memberDetails.meetingFallback', 'Meeting'), href: `/dashboard/meetings/list/${id}` },
    { label: tf('meetings.attendance.pageTitle', 'Attendance Check-in') },
  ];

  if (meetingQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <EmptyState
          icon={CalendarDays}
          title={tf('meetings.meetingDetails.notFoundTitle', 'Meeting not found')}
          description={tf(
            'meetings.meetingDetails.notFoundDescription',
            'This meeting could not be loaded or may have been removed.'
          )}
        />
      </div>
    );
  }

  if (attendanceDateOptions.length === 0) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader
          title={tf('meetings.attendance.pageTitle', 'Attendance Check-in')}
          subtitle={tf(
            'meetings.attendance.pageSubtitle',
            'Choose a past meeting date and mark the members who attended.'
          )}
        />
        <EmptyState
          icon={CalendarDays}
          title={tf('meetings.attendance.noDatesTitle', 'No eligible dates yet')}
          description={tf(
            'meetings.attendance.noDatesDescription',
            'There are no past dates available for this meeting day yet.'
          )}
        />
      </div>
    );
  }

  if (attendanceGroups.length === 0 || totalVisibleMembers === 0) {
    return (
      <div className="animate-fade-in space-y-8 pb-10">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader
          title={tf('meetings.attendance.pageTitle', 'Attendance Check-in')}
          subtitle={tf(
            'meetings.attendance.pageSubtitle',
            'Choose a past meeting date and mark the members who attended.'
          )}
        />
        <EmptyState
          icon={Users}
          title={tf('meetings.attendance.noMembersTitle', 'No members available')}
          description={tf(
            'meetings.attendance.noMembersDescription',
            'No accessible meeting members are available for attendance check-in.'
          )}
        />
      </div>
    );
  }

  const isBusy = attendanceQuery.isLoading;

  return (
    <div className="animate-fade-in space-y-6 pb-28 lg:pb-10">
      <Breadcrumbs items={breadcrumbs} />

      {/* ══ HEADER / TOOLBAR ══════════════════════════════════════════════ */}
      <Card padding="lg" tone="primary">
        <PageHeader
          contentOnly
          eyebrow={meeting?.name || t('meetings.meetingsPageTitle')}
          title={tf('meetings.attendance.pageTitle', 'Attendance Check-in')}
          subtitle={tf(
            'meetings.attendance.pageSubtitle',
            'Choose a past meeting date and mark the members who attended.'
          )}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="primary" dot>
            <CalendarDays className="h-3.5 w-3.5" />
            {getDayLabel(meeting?.day, t)} · {meeting?.time || EMPTY}
          </Badge>
          <Badge variant="neutral">
            <Users className="h-3.5 w-3.5" />
            {presentCount} / {totalVisibleMembers} {tf('meetings.attendance.attendeesSelected', 'selected')}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-end">
          <Select
            label={tf('meetings.attendance.dateLabel', 'Meeting Date')}
            options={attendanceDateOptions}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            placeholder={tf('meetings.attendance.datePlaceholder', 'Select a meeting date')}
            containerClassName="!mb-0"
          />
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={CheckSquare}
              onClick={() => setSelectedMemberIds(allVisibleMemberIds)}
              disabled={isBusy || totalVisibleMembers === 0}
            >
              {tf('meetings.attendance.selectAll', 'Select all')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Square}
              onClick={() => setSelectedMemberIds([])}
              disabled={isBusy || presentCount === 0}
            >
              {tf('meetings.attendance.clearAll', 'Clear all')}
            </Button>
          </div>
        </div>

        {attendanceQuery.error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger-light px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{normalizeApiError(attendanceQuery.error).message}</span>
          </div>
        )}

        {attendanceQuery.data?.viewerUpdatedAt && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            {tf('meetings.attendance.lastUpdated', 'Last updated')}: {formatDateTime(attendanceQuery.data.viewerUpdatedAt)} ·{' '}
            {attendanceQuery.data.viewerUpdatedBy?.fullName || EMPTY}
          </p>
        )}
      </Card>

      {/* ══ SUMMARY ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={UserCheck}
          label={tf('meetings.attendance.presentLabel', 'Present')}
          value={presentCount}
          tone="success"
          isRTL={isRTL}
        />
        <StatCard
          icon={UserX}
          label={tf('meetings.attendance.absentLabel', 'Absent')}
          value={absentCount}
          tone="warning"
          isRTL={isRTL}
        />
        <StatCard
          icon={Users}
          label={tf('meetings.attendance.totalLabel', 'Total')}
          value={totalVisibleMembers}
          tone="primary"
          isRTL={isRTL}
        />
      </div>

      {/* ══ ATTENDEE LIST ═════════════════════════════════════════════════ */}
      {isBusy ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <Card key={groupIndex} padding="none">
              <div className="border-b border-border/60 px-5 py-3.5">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-16 rounded-2xl" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {attendanceGroups.map((group) => {
            const groupPresent = (group.members || []).filter((member) => selectedMemberIdSet.has(member.id)).length;
            return (
              <Section
                key={group.key}
                icon={ClipboardCheck}
                title={group.name || EMPTY}
                actions={(
                  <Badge variant={groupPresent === group.members.length ? 'success' : 'neutral'}>
                    {groupPresent} / {group.members.length}
                  </Badge>
                )}
                bodyClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {group.members.map((member) => (
                  <MemberToggleRow
                    key={member.id}
                    member={member}
                    checked={selectedMemberIdSet.has(member.id)}
                    onToggle={toggleMember}
                  />
                ))}
              </Section>
            );
          })}
        </div>
      )}

      {/* ══ STICKY SAVE ═══════════════════════════════════════════════════ */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-3xl items-center gap-3 lg:max-w-none lg:justify-end">
          <span className="hidden text-sm text-muted sm:inline lg:me-auto">
            {presentCount} / {totalVisibleMembers} {tf('meetings.attendance.attendeesSelected', 'selected')}
          </span>
          <Button
            type="button"
            icon={CheckSquare}
            fullWidth
            className="lg:w-auto"
            onClick={() => saveAttendanceMutation.mutate()}
            loading={saveAttendanceMutation.isPending}
            disabled={!selectedDate}
          >
            {t('common.actions.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
