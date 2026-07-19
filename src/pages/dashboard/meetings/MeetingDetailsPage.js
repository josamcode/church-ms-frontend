import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowUpRight, CalendarClock, CalendarDays, ClipboardCheck, Clock, Edit, FileText,
  Layers3, ListChecks, Phone, Settings2, StickyNote, UserCircle, Users,
} from 'lucide-react';
import { meetingsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import NotificationTemplateEditor from '../../../components/notifications/NotificationTemplateEditor';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import PageHeader from '../../../components/ui/PageHeader';
import SettingsLayout from '../../../components/ui/SettingsLayout';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import Tabs from '../../../components/ui/Tabs';
import { useI18n } from '../../../i18n/i18n';
import { formatDateTime } from '../../../utils/formatters';
import { getActivityTypeLabel, getDayLabel } from './meetingsForm.utils';

const EMPTY = '---';
const MEETING_REMINDER_DEFAULTS = Object.freeze({
  leadMinutes: 60,
  template: {
    title: {
      ar: 'تذكير بموعد الاجتماع',
      en: 'تذكير بموعد الاجتماع',
    },
    message: {
      ar: 'سيتبقى {reminderLeadTime} على اجتماع {meetingName} يوم {meetingDay} في {meetingDateTime}.',
      en: 'سيتبقى {reminderLeadTime} على اجتماع {meetingName} يوم {meetingDay} في {meetingDateTime}.',
    },
  },
});
const MEETING_REMINDER_TOKENS = Object.freeze([
  {
    key: 'meetingName',
    token: '{meetingName}',
    label: { ar: 'اسم الاجتماع', en: 'Meeting name' },
    sampleValue: { ar: 'اجتماع الشباب', en: 'Youth Meeting' },
  },
  {
    key: 'meetingDay',
    token: '{meetingDay}',
    label: { ar: 'يوم الاجتماع', en: 'Meeting day' },
    sampleValue: { ar: 'الأحد', en: 'Sunday' },
  },
  {
    key: 'meetingTime',
    token: '{meetingTime}',
    label: { ar: 'وقت الاجتماع', en: 'Meeting time' },
    sampleValue: { ar: '6:30 م', en: '6:30 PM' },
  },
  {
    key: 'meetingDateTime',
    token: '{meetingDateTime}',
    label: { ar: 'تاريخ ووقت الاجتماع', en: 'Meeting date/time' },
    sampleValue: { ar: '10 أبريل 2026، 6:30 م', en: 'Apr 10, 2026, 6:30 PM' },
  },
  {
    key: 'sectorName',
    token: '{sectorName}',
    label: { ar: 'اسم القطاع', en: 'Sector name' },
    sampleValue: { ar: 'قطاع الشباب', en: 'Youth Sector' },
  },
  {
    key: 'reminderLeadTime',
    token: '{reminderLeadTime}',
    label: { ar: 'المدة قبل الاجتماع', en: 'Reminder lead time' },
    sampleValue: { ar: 'ساعة واحدة', en: '1 hour' },
  },
]);

function buildMeetingReminderForm(reminderSettings = {}) {
  const titleAr = String(
    reminderSettings?.template?.title?.ar
      || MEETING_REMINDER_DEFAULTS.template.title.ar
  );
  const messageAr = String(
    reminderSettings?.template?.message?.ar
      || MEETING_REMINDER_DEFAULTS.template.message.ar
  );
  const parsedLeadMinutes = Number(reminderSettings?.leadMinutes);

  return {
    leadMinutes: Number.isFinite(parsedLeadMinutes)
      ? parsedLeadMinutes
      : MEETING_REMINDER_DEFAULTS.leadMinutes,
    template: {
      title: {
        ar: titleAr,
        en: String(reminderSettings?.template?.title?.en || titleAr),
      },
      message: {
        ar: messageAr,
        en: String(reminderSettings?.template?.message?.en || messageAr),
      },
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Primitives
───────────────────────────────────────────────────────────────────────────── */

function Field({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-heading">{value || EMPTY}</p>
    </div>
  );
}

/** Person card used in leadership/assistants */
function PersonChip({ person, roleLabel }) {
  if (!person) return null;
  const initial = String(person.name || person.user?.fullName || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/30">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {initial}
        </div>
        <div className="min-w-0">
          {roleLabel && (
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
              {roleLabel}
            </p>
          )}
          <p className="truncate font-semibold text-heading">
            {person.name || person.user?.fullName || EMPTY}
          </p>
          {person.user?.fullName && person.name && person.user.fullName !== person.name && (
            <p className="truncate text-xs text-muted">{person.user.fullName}</p>
          )}
          {person.user?.phonePrimary && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted direction-ltr">
              <Phone className="h-3 w-3" />
              {person.user.phonePrimary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Clickable user card for group served users.
 * Clicking navigates to /dashboard/users/:userId
 */
function UserCard({ user, onOpenMember, showPhone = true }) {
  const userId = user?.id || user?._id;
  const name = user?.fullName || EMPTY;
  const initial = String(name).trim().charAt(0).toUpperCase();
  const phone = user?.phonePrimary;

  return (
    <button
      type="button"
      onClick={() => userId && onOpenMember(userId)}
      disabled={!userId || !onOpenMember}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-start transition-all duration-150 hover:border-primary/30 hover:shadow-sm disabled:pointer-events-none disabled:opacity-60"
    >
      {/* avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        {initial}
      </div>

      {/* text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-heading transition-colors group-hover:text-primary">
          {name}
        </p>
        {showPhone && phone && (
          <p className="truncate text-xs text-muted direction-ltr">{phone}</p>
        )}
      </div>

      {/* arrow */}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-border transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function MeetingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const { hasPermission } = useAuth();
  const [reminderForm, setReminderForm] = useState(buildMeetingReminderForm);

  const canUpdateMeeting =
    hasPermission('MEETINGS_UPDATE') ||
    hasPermission('MEETINGS_SERVANTS_MANAGE') ||
    hasPermission('MEETINGS_COMMITTEES_MANAGE') ||
    hasPermission('MEETINGS_ACTIVITIES_MANAGE');
  const canManageAttendance =
    hasPermission('MEETINGS_ATTENDANCE_MANAGE') ||
    hasPermission('MEETINGS_UPDATE') ||
    hasPermission('MEETINGS_SERVANTS_MANAGE');
  const canManageDocumentation =
    hasPermission('MEETINGS_DOCUMENTATION_MANAGE') ||
    hasPermission('MEETINGS_UPDATE') ||
    hasPermission('MEETINGS_SERVANTS_MANAGE');
  const canViewSector = hasPermission('SECTORS_VIEW');
  const canViewUsers = hasPermission('USERS_VIEW');

  const meetingQuery = useQuery({
    queryKey: ['meetings', 'details', id],
    enabled: !!id,
    staleTime: 60000,
    queryFn: async () => {
      const { data } = await meetingsApi.meetings.getById(id);
      return data?.data || null;
    },
  });

  const reminderMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await meetingsApi.meetings.updateReminderSettings(id, payload);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      queryClient.setQueryData(['meetings', 'details', id], payload);
      setReminderForm(buildMeetingReminderForm(payload?.reminderSettings));
      toast.success(
        t('meetings.meetingDetails.reminderSettings.saved')
      );
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message
        || error?.message
        || t('meetings.meetingDetails.reminderSettings.saveFailed')
      );
    },
  });

  const meeting = meetingQuery.data || null;
  const canManageReminderSettings = Boolean(meeting?.viewerContext?.canManageReminderSettings);
  const canManageDocumentationSettings = Boolean(meeting?.viewerContext?.canManageDocumentationSettings);
  const canViewAllDetails = Boolean(meeting?.viewerContext?.canViewAllDetails);
  const canViewAllServedUsers = Boolean(meeting?.viewerContext?.canViewAllServedUsers);
  const canViewLeadership = Boolean(meeting?.viewerContext?.canViewLeadership ?? canViewAllDetails);
  const canViewServants = Boolean(meeting?.viewerContext?.canViewServants ?? canViewAllDetails);
  const canViewCommittees = Boolean(meeting?.viewerContext?.canViewCommittees ?? canViewAllDetails);
  const canViewActivities = Boolean(meeting?.viewerContext?.canViewActivities ?? canViewAllDetails);
  const canOpenMemberFromGroups = meeting?.viewerContext?.accessLevel !== 'member';
  const canViewMemberPhoneInGroups = meeting?.viewerContext?.accessLevel !== 'member';

  useEffect(() => {
    if (!meeting?.reminderSettings) return;
    setReminderForm(buildMeetingReminderForm(meeting.reminderSettings));
  }, [meeting?.id, meeting?.reminderSettings]);

  const updateReminderField = useCallback((field, language, value) => {
    setReminderForm((current) => {
      const previousArabicValue = String(current?.template?.[field]?.ar || '');
      const previousEnglishValue = String(current?.template?.[field]?.en || '');
      const nextLocalizedField = {
        ...(current?.template?.[field] || { ar: '', en: '' }),
        [language]: value,
      };

      if (language === 'ar') {
        const shouldMirrorEnglish = !previousEnglishValue.trim() || previousEnglishValue === previousArabicValue;
        if (shouldMirrorEnglish) {
          nextLocalizedField.en = value;
        }
      }

      return {
        ...current,
        template: {
          ...(current?.template || {}),
          [field]: nextLocalizedField,
        },
      };
    });
  }, []);

  const reminderLanguageTabs = useMemo(
    () => [
      {
        label: t('platformSettingsPage.languages.ar'),
        content: (
          <NotificationTemplateEditor
            t={t}
            language="ar"
            sectionTitle={t('meetings.meetingDetails.reminderSettings.title')}
            sectionSubtitle={t('meetings.meetingDetails.reminderSettings.subtitle')}
            template={reminderForm?.template}
            tokenList={MEETING_REMINDER_TOKENS}
            onFieldChange={updateReminderField}
          />
        ),
      },
      {
        label: t('platformSettingsPage.languages.en'),
        content: (
          <NotificationTemplateEditor
            t={t}
            language="en"
            sectionTitle={t('meetings.meetingDetails.reminderSettings.title')}
            sectionSubtitle={t('meetings.meetingDetails.reminderSettings.subtitle')}
            template={reminderForm?.template}
            tokenList={MEETING_REMINDER_TOKENS}
            onFieldChange={updateReminderField}
          />
        ),
      },
    ],
    [reminderForm?.template, t, updateReminderField]
  );
  const leadershipCards = useMemo(() => {
    const assistants = meeting?.assistantSecretaries || [];
    const leaders = [];
    if (meeting?.serviceSecretary) leaders.push({ person: meeting.serviceSecretary, role: 'service' });
    assistants.forEach((assistant) => leaders.push({ person: assistant, role: 'assistant' }));
    return leaders;
  }, [meeting]);

  const stats = useMemo(() => ({
    assistantsCount: (meeting?.assistantSecretaries || []).length,
    servedUsersCount: (meeting?.servedUsers || []).length,
    groupsCount: (meeting?.groups || []).length,
    groupMembersCount: (meeting?.groupAssignments || []).reduce(
      (count, assignment) => count + (assignment?.servedUsers || []).length,
      0
    ),
    servantsCount: (meeting?.servants || []).length,
    committeesCount: (meeting?.committees || []).length,
    activitiesCount: (meeting?.activities || []).length,
  }), [meeting]);

  const openMeetingMember = (memberId) => {
    if (!id || !memberId) return;
    if (canViewAllDetails && canViewUsers) {
      navigate(`/dashboard/users/${memberId}`);
      return;
    }
    navigate(`/dashboard/meetings/list/${id}/members/${memberId}`);
  };

  const handleSaveReminderSettings = useCallback(() => {
    reminderMutation.mutate({
      leadMinutes: Number(reminderForm?.leadMinutes || 0),
      template: reminderForm?.template || MEETING_REMINDER_DEFAULTS.template,
    });
  }, [reminderForm, reminderMutation]);

  const breadcrumbs = [
    { label: t('shared.dashboard'), href: '/dashboard' },
    { label: t('meetings.meetingsPageTitle'), href: '/dashboard/meetings/list' },
    { label: meeting?.name || t('meetings.meetingDetails.pageTitle') },
  ];

  if (meetingQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <Card tone="primary" className="overflow-hidden">
          <div className="flex items-center gap-4">
            <Skeleton variant="rect" className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <EmptyState
          icon={CalendarDays}
          title={t('meetings.meetingDetails.notFoundTitle')}
          description={t('meetings.meetingDetails.notFoundDescription')}
        />
      </div>
    );
  }

  const kpiTiles = canViewAllDetails
    ? [
      { label: t('meetings.fields.assistants'), value: stats.assistantsCount, icon: Users, tone: 'primary' },
      ...(canViewAllServedUsers
        ? [{ label: t('meetings.fields.servedUsers'), value: stats.servedUsersCount, icon: UserCircle, tone: 'gold' }]
        : []),
      { label: t('meetings.columns.groupsCount'), value: stats.groupsCount, icon: ListChecks, tone: 'info' },
      { label: t('meetings.columns.servantsCount'), value: stats.servantsCount, icon: Users, tone: 'success' },
      { label: t('meetings.columns.committeesCount'), value: stats.committeesCount, icon: FileText, tone: 'warning' },
      { label: t('meetings.columns.activitiesCount'), value: stats.activitiesCount, icon: CalendarClock, tone: 'default' },
    ]
    : [
      { label: t('meetings.columns.groupsCount'), value: stats.groupsCount, icon: ListChecks, tone: 'primary' },
      {
        label: t('meetings.memberDetails.groupsTitle'),
        value: stats.groupMembersCount,
        icon: UserCircle,
        tone: 'gold',
      },
    ];

  const activities = meeting.activities || [];
  const hasDatedActivities = activities.some((activity) => activity.scheduledAt);

  /* ══ SIDEBAR-NAVIGABLE DETAIL SECTIONS ═══════════════════════════════════════
     Instead of stacking every section down one long page, each detail area is a
     section in a left rail (see SettingsLayout) so only one is shown at a time. */
  const detailSections = [
    canViewLeadership && {
      id: 'leadership',
      label: t('meetings.sections.leadership'),
      icon: Users,
      title: t('meetings.sections.leadership'),
      description: t('meetings.meetingDetails.leadershipDescription'),
      count: leadershipCards.length,
      content: leadershipCards.length === 0 ? (
        <EmptyState compact icon={Users} title={t('meetings.meetingDetails.noLeadershipTitle')} description={t('meetings.meetingDetails.noLeadershipDescription')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leadershipCards.map(({ person, role }, i) => (
            <PersonChip
              key={`${role}_${person?.user?.id || person?.id || person?.name || 'p'}_${i}`}
              person={person}
              roleLabel={role === 'service' ? t('meetings.fields.serviceSecretary') : t('meetings.fields.assistants')}
            />
          ))}
        </div>
      ),
    },
    {
      id: 'groups',
      label: t('meetings.fields.groups'),
      icon: ListChecks,
      title: t('meetings.fields.groups'),
      description: t('meetings.meetingDetails.groupsDescription'),
      count: (meeting.groupAssignments || []).length,
      actions: (
        <div className="flex flex-wrap items-center gap-2">
          {canManageDocumentation && canOpenMemberFromGroups && (
            <Link to={`/dashboard/meetings/list/${id}/documentation`}>
              <Button variant="outline" size="sm" icon={FileText}>
                {t('meetings.actions.openDailyDocumentation')}
              </Button>
            </Link>
          )}
          {canManageDocumentationSettings && (
            <Link to={`/dashboard/meetings/list/${id}/settings`}>
              <Button variant="outline" size="sm" icon={Settings2}>
                {t('meetings.actions.openDocumentationSettings')}
              </Button>
            </Link>
          )}
          {canManageAttendance && canOpenMemberFromGroups && stats.groupMembersCount > 0 && (
            <Link to={`/dashboard/meetings/list/${id}/attendance`}>
              <Button variant="outline" size="sm" icon={ClipboardCheck}>
                {t('meetings.actions.openAttendanceCheckIn')}
              </Button>
            </Link>
          )}
        </div>
      ),
      content: (meeting.groups || []).length === 0 ? (
        <EmptyState compact icon={ListChecks} title={t('meetings.meetingDetails.noGroupsTitle')} description={t('meetings.meetingDetails.noGroupsDescription')} />
      ) : (
        <div className="space-y-4">
          {(meeting.groupAssignments || []).map((assignment, i) => {
            const users = assignment.servedUsers || [];
            return (
              <div key={`${assignment.group}_${i}`} className="rounded-2xl border border-border bg-surface">
                {/* group header */}
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <ListChecks className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="font-semibold text-heading">{assignment.group}</p>
                  </div>
                  <Badge variant="default" size="sm">
                    {users.length} {t('meetings.meetingDetails.members')}
                  </Badge>
                </div>

                {/* user cards grid */}
                <div className="p-4">
                  {users.length === 0 ? (
                    <p className="text-xs text-muted">{t('common.placeholder.empty')}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {users.map((user) => (
                        <UserCard
                          key={user.id || user._id || user.fullName}
                          user={user}
                          onOpenMember={canOpenMemberFromGroups ? openMeetingMember : null}
                          showPhone={canViewMemberPhoneInGroups}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    canViewServants && {
      id: 'servants',
      label: t('meetings.sections.servants'),
      icon: Users,
      title: t('meetings.sections.servants'),
      description: t('meetings.meetingDetails.servantsDescription'),
      count: (meeting.servants || []).length,
      content: (meeting.servants || []).length === 0 ? (
        <EmptyState compact icon={Users} title={t('meetings.empty.noServantsYet')} description={t('meetings.meetingDetails.noServantsDescription')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(meeting.servants || []).map((servant) => (
            <div key={servant.id} className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/30">
              {/* avatar row */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {String(servant.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-heading">{servant.name || EMPTY}</p>
                  <p className="truncate text-xs text-muted">
                    {servant.responsibility || t('common.placeholder.empty')}
                  </p>
                </div>
              </div>

              {/* groups managed */}
              {(servant.groupsManaged || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(servant.groupsManaged || []).map((groupName) => (
                    <Badge key={`${servant.id}_${groupName}`} variant="primary" size="sm">
                      {groupName}
                    </Badge>
                  ))}
                </div>
              )}

              {/* footer */}
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-xs text-muted">
                  {t('meetings.fields.servedUsers')}:{' '}
                  <strong className="text-heading">{(servant.servedUsers || []).length}</strong>
                </span>
              </div>

              {servant.notes && (
                <p className="mt-2 line-clamp-2 text-xs text-muted">{servant.notes}</p>
              )}
            </div>
          ))}
        </div>
      ),
    },
    canViewCommittees && {
      id: 'committees',
      label: t('meetings.sections.committees'),
      icon: FileText,
      title: t('meetings.sections.committees'),
      description: t('meetings.meetingDetails.committeesDescription'),
      count: (meeting.committees || []).length,
      content: (meeting.committees || []).length === 0 ? (
        <EmptyState compact icon={FileText} title={t('meetings.empty.noCommitteesYet')} description={t('meetings.meetingDetails.noCommitteesDescription')} />
      ) : (
        <div className="space-y-3">
          {(meeting.committees || []).map((committee) => (
            <div key={committee.id} className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-heading">{committee.name || EMPTY}</p>
                  {committee.notes && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{committee.notes}</p>
                  )}
                </div>
                <Badge variant="default" size="sm">
                  {(committee.members || []).length} {t('meetings.meetingDetails.members')}
                </Badge>
              </div>
              {(committee.memberNames || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(committee.memberNames || []).map((name, idx) => (
                    <span key={`${committee.id}_${idx}`} className="rounded-full border border-border bg-surface-alt px-2.5 py-0.5 text-xs font-medium text-heading">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
    canViewActivities && {
      id: 'activities',
      label: t('meetings.sections.activities'),
      icon: CalendarClock,
      title: t('meetings.sections.activities'),
      description: t('meetings.meetingDetails.activitiesDescription'),
      count: activities.length,
      content: activities.length === 0 ? (
        <EmptyState compact icon={CalendarClock} title={t('meetings.empty.noActivitiesYet')} description={t('meetings.meetingDetails.noActivitiesDescription')} />
      ) : hasDatedActivities ? (
        /* ── ACTIVITIES TIMELINE ── */
        <ol className="relative space-y-4 ps-6">
          <span
            className="pointer-events-none absolute inset-y-1 start-[7px] w-px bg-border/70"
            aria-hidden
          />
          {activities.map((activity, index) => (
            <li key={activity.id} className="relative">
              <span
                className={`absolute -start-6 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-surface ${
                  index === 0 ? 'bg-primary' : 'bg-border'
                }`}
                aria-hidden
              />
              <div className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-heading">{activity.name || EMPTY}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      {activity.scheduledAt ? formatDateTime(activity.scheduledAt) : t('common.placeholder.empty')}
                    </p>
                    {activity.notes && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{activity.notes}</p>
                    )}
                  </div>
                  {activity.type && <Badge variant="secondary">{getActivityTypeLabel(activity.type, t)}</Badge>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-heading">{activity.name || EMPTY}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {activity.scheduledAt ? formatDateTime(activity.scheduledAt) : t('common.placeholder.empty')}
                  </p>
                  {activity.notes && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{activity.notes}</p>
                  )}
                </div>
                {activity.type && <Badge variant="secondary">{getActivityTypeLabel(activity.type, t)}</Badge>}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    canManageReminderSettings && {
      id: 'reminder',
      label: t('meetings.meetingDetails.reminderSettings.railLabel'),
      icon: CalendarClock,
      title: t('meetings.meetingDetails.reminderSettings.section'),
      description: t('meetings.meetingDetails.reminderSettings.subtitle'),
      actions: (
        <Button
          type="button"
          loading={reminderMutation.isPending}
          onClick={handleSaveReminderSettings}
        >
          {t('common.actions.save')}
        </Button>
      ),
      content: (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-heading">
              {t('platformSettingsPage.notifications.reminderTiming.title')}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {t('platformSettingsPage.notifications.reminderTiming.subtitle')}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
              <Input
                type="number"
                min="0"
                max="10080"
                step="1"
                label={t('platformSettingsPage.notifications.reminderTiming.fieldLabel')}
                hint={t('platformSettingsPage.notifications.reminderTiming.hint')}
                value={reminderForm?.leadMinutes ?? 0}
                onChange={(event) => setReminderForm((current) => ({
                  ...current,
                  leadMinutes: event.target.value,
                }))}
                containerClassName="!mb-0"
              />

              <div className="rounded-2xl border border-border/60 bg-surface-alt/40 p-4">
                <p className="text-sm font-semibold text-heading">
                  {t('platformSettingsPage.notifications.reminderTiming.previewLabel')}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {t('platformSettingsPage.notifications.reminderTiming.previewValue', {
                    count: Number(reminderForm?.leadMinutes || 0),
                  })}
                </p>
              </div>
            </div>
          </div>

          <Tabs variant="inline" tabs={reminderLanguageTabs} />
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs items={breadcrumbs} />

      {/* ══ SUMMARY HEADER ════════════════════════════════════════════════ */}
      <Card tone="primary" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-16 -end-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {meeting.avatar?.url ? (
              <img src={meeting.avatar.url} alt={meeting.name || ''} className="h-16 w-16 rounded-2xl border border-border object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/15">
                <CalendarDays className="h-7 w-7 text-primary" />
              </div>
            )}
            <PageHeader
              contentOnly
              eyebrow={t('meetings.meetingsPageTitle')}
              title={meeting.name || EMPTY}
              titleClassName="mt-1 text-3xl font-bold tracking-tight text-heading"
              childrenClassName="mt-3 flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                <CalendarDays className="h-3 w-3" />
                {getDayLabel(meeting.day, t)} · {meeting.time || EMPTY}
              </span>
              {meeting.sector?.name && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                  <Layers3 className="h-3 w-3" />
                  {meeting.sector.name}
                </span>
              )}
              {meeting.serviceSecretary?.name && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                  <UserCircle className="h-3 w-3" />
                  {meeting.serviceSecretary.name}
                </span>
              )}
            </PageHeader>
          </div>

          <div className="flex flex-wrap gap-2">
            {canViewSector && meeting.sector?.id && (
              <Link to={`/dashboard/meetings/sectors/${meeting.sector.id}`}>
                <Button variant="ghost" icon={Layers3}>{t('meetings.columns.sector')}</Button>
              </Link>
            )}
            {canUpdateMeeting && (
              <Link to={`/dashboard/meetings/${meeting.id}/edit`}>
                <Button variant="outline" icon={Edit}>{t('common.actions.edit')}</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* ══ KPI TILES ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpiTiles.map(({ label, value, icon: Icon, tone }) => (
          <StatCard key={label} icon={Icon} label={label} value={value ?? 0} tone={tone} isRTL={isRTL} />
        ))}
      </div>

      {/* ══ METADATA ══════════════════════════════════════════════════════ */}
      <Card padding="none">
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 px-6 py-5 sm:grid-cols-4">
          <Field icon={Clock} label={t('meetings.columns.updatedAt')} value={formatDateTime(meeting.updatedAt)} />
          <Field icon={CalendarDays} label={t('meetings.meetingDetails.createdAt')} value={formatDateTime(meeting.createdAt)} />
          <Field icon={Layers3} label={t('meetings.columns.sector')} value={meeting.sector?.name} />
          <Field icon={UserCircle} label={t('meetings.fields.serviceSecretary')} value={meeting.serviceSecretary?.name} />
        </div>
      </Card>

      {/* notes */}
      {meeting.notes && (
        <Card tone="gold" padding="sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary">
              <StickyNote className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{t('meetings.fields.notes')}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-heading">{meeting.notes}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ══ DETAIL SECTIONS (sidebar rail — one section at a time) ═════════ */}
      {detailSections.length > 0 && <SettingsLayout sections={detailSections} />}
    </div>
  );
}
