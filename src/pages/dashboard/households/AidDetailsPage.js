import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Edit2,
  HandCoins,
  Hourglass,
  RotateCw,
  Sparkles,
  StickyNote,
  Users,
} from 'lucide-react';
import { aidsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import { localizeAidOccurrence } from '../../../utils/aidOccurrenceLocalization';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import Section from '../../../components/ui/Section';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';

const COPY = {
  en: {
    title: 'Aid Details',
    subtitle: 'View the details of this aid group and the beneficiary households.',
    emptyTitle: 'No records found',
    emptyDesc: 'No household records were found for this aid group.',
    detailsSection: 'Group Specifications',
    beneficiariesSection: 'Beneficiary Households',
    editAction: 'Edit Aid Group',
    recurringSection: 'Recurring Aid Reminder',
    recurringSubtitle: 'This reminder is tied to a recurring aid group.',
    dueToday: 'Due today',
    pending: 'Pending',
    readyToApprove: 'Approve and record this repeat only after the households receive it.',
    keepPending: 'If they have not received it yet, leave this reminder pending and approve it later today.',
    approveAction: 'Approve And Record',
    approveSuccess: 'The repeated aid was approved and recorded successfully.',
    dueDate: 'Current due date',
    nextRepeat: 'Next repeat date',
    originalDate: 'Original aid date',
    fields: {
      date: 'Date',
      category: 'Category',
      occurrence: 'Occurrence',
      description: 'Description',
      notes: 'Notes',
    },
  },
  ar: {
    title: 'تفاصيل المساعدة',
    subtitle: 'اعرض تفاصيل مجموعة المساعدة والأسر المستفيدة منها.',
    emptyTitle: 'لا توجد سجلات',
    emptyDesc: 'لم يتم العثور على سجلات أسر لهذه المجموعة من المساعدات.',
    detailsSection: 'بيانات مجموعة المساعدة',
    beneficiariesSection: 'الأسر المستفيدة',
    editAction: 'تعديل مجموعة المساعدة',
    recurringSection: 'تذكير مساعدة متكررة',
    recurringSubtitle: 'هذا التذكير مرتبط بمجموعة مساعدة متكررة.',
    dueToday: 'مستحقة اليوم',
    pending: 'قيد الانتظار',
    readyToApprove: 'اعتمد وسجل هذا التكرار فقط بعد أن تستلم الأسر المساعدة فعليًا.',
    keepPending: 'إذا لم تستلم الأسر المساعدة بعد، اترك التذكير معلقًا واعتمده لاحقًا اليوم.',
    approveAction: 'اعتماد وتسجيل',
    approveSuccess: 'تم اعتماد وتسجيل تكرار المساعدة بنجاح.',
    dueDate: 'تاريخ الاستحقاق الحالي',
    nextRepeat: 'تاريخ التكرار التالي',
    originalDate: 'تاريخ المساعدة الأصلي',
    fields: {
      date: 'التاريخ',
      category: 'الفئة',
      occurrence: 'التكرار',
      description: 'الوصف',
      notes: 'ملاحظات',
    },
  },
};

function formatDateLabel(value, language) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function buildAidDetailsUrl(group) {
  const params = new URLSearchParams({
    date: group.date,
    category: group.category,
    occurrence: group.occurrence,
    description: group.description,
  });

  return `/dashboard/lords-brethren/aid-history/details?${params.toString()}`;
}

/* Vertical lifecycle timeline for the recurring reminder */
function ReminderTimeline({ events, isRTL }) {
  return (
    <ol className="relative space-y-5">
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;
        return (
          <li key={event.key} className="relative flex gap-3.5">
            {!isLast && (
              <span
                className={`absolute top-9 h-[calc(100%+0.25rem)] w-px bg-border ${isRTL ? 'right-[17px]' : 'left-[17px]'}`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${event.iconWrap}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{event.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-heading">{event.value}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function AidDetailsPage() {
  const { language, t } = useI18n();
  const isRTL = language === 'ar';
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canEdit = hasPermission('HOUSEHOLD_CLASSIFICATIONS_MANAGE');

  const queryDate = searchParams.get('date');
  const queryCategory = searchParams.get('category');
  const queryOccurrence = searchParams.get('occurrence');
  const queryDescription = searchParams.get('description');
  const reminderId = searchParams.get('reminderId');
  const dueDate = searchParams.get('dueDate');
  const nextDueDate = searchParams.get('nextDueDate');

  const payloadParams = useMemo(
    () => ({
      date: queryDate,
      category: queryCategory,
      occurrence: queryOccurrence,
      description: queryDescription,
    }),
    [queryDate, queryCategory, queryOccurrence, queryDescription]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['aid-details', payloadParams],
    queryFn: async () => {
      if (!queryDate || !queryCategory || !queryOccurrence || !queryDescription) return [];
      const resp = await aidsApi.getAidDetails(payloadParams);
      return resp.data?.data || [];
    },
    enabled: !!(queryDate && queryCategory && queryOccurrence && queryDescription),
  });

  const beneficiaries = data || [];
  const isReminderContext = Boolean(reminderId && dueDate);
  const isDueToday = Boolean(dueDate) && dueDate === new Date().toISOString().slice(0, 10);
  const localizedOccurrence = localizeAidOccurrence(queryOccurrence || '-', language);
  const groupNotes = beneficiaries?.[0]?.notes;

  const approveMutation = useMutation({
    mutationFn: () => aidsApi.approveReminder(reminderId),
    onSuccess: (response) => {
      const group = response?.data?.data?.group;

      toast.success(copy.approveSuccess);
      queryClient.invalidateQueries({ queryKey: ['aid-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['aids-history'] });
      queryClient.invalidateQueries({ queryKey: ['aid-details'] });

      if (group?.date && group?.category && group?.occurrence && group?.description) {
        navigate(buildAidDetailsUrl(group));
      }
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const handleOpenEdit = () => {
    const params = new URLSearchParams({
      date: queryDate,
      category: queryCategory,
      occurrence: queryOccurrence,
      description: queryDescription,
    });
    navigate(`/dashboard/lords-brethren/aid?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('dashboardLayout.menu.theLordsBrethren'), href: '/dashboard/lords-brethren' },
          { label: t('dashboardLayout.menu.disbursedAidHistory'), href: '/dashboard/lords-brethren/aid-history' },
          { label: copy.title },
        ]}
      />

      {/* ══ SUMMARY HEADER CARD ═════════════════════════════════════════ */}
      <Card padding="lg" tone="gold">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/12 text-secondary">
              <HandCoins className="h-7 w-7" />
            </div>
            <PageHeader
              contentOnly
              eyebrow={t('dashboardLayout.menu.disbursedAidHistory')}
              title={queryCategory || copy.title}
              titleClassName="mt-1 text-3xl font-bold tracking-tight text-heading"
              childrenClassName="mt-2 flex flex-wrap items-center gap-2"
            >
              <Badge variant="gold" dot>
                {formatDateLabel(queryDate, language)}
              </Badge>
              <Badge variant="secondary">
                <RotateCw className="h-3 w-3" />
                {localizedOccurrence}
              </Badge>
              {isReminderContext ? (
                <Badge variant={isDueToday ? 'warning' : 'primary'} dot>
                  {isDueToday ? copy.dueToday : copy.pending}
                </Badge>
              ) : null}
              <Badge variant="default">
                <Users className="h-3 w-3" />
                {beneficiaries.length}
              </Badge>
            </PageHeader>
          </div>

          {canEdit ? (
            <Button variant="outline" icon={Edit2} onClick={handleOpenEdit}>
              {copy.editAction}
            </Button>
          ) : null}
        </div>

        {queryDescription ? (
          <p className="mt-5 border-t border-secondary/20 pt-4 text-sm leading-relaxed text-base">
            {queryDescription}
          </p>
        ) : null}
      </Card>

      {/* ══ KEY FACTS ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          tone="gold"
          label={copy.beneficiariesSection}
          value={isLoading ? '…' : beneficiaries.length}
          isRTL={isRTL}
        />
        <StatCard
          icon={CalendarDays}
          tone="primary"
          label={copy.fields.date}
          value={formatDateLabel(queryDate, language)}
          isRTL={isRTL}
        />
        <StatCard
          icon={RotateCw}
          tone="info"
          label={copy.fields.occurrence}
          value={localizedOccurrence}
          isRTL={isRTL}
        />
        <StatCard
          icon={Sparkles}
          tone="success"
          label={copy.fields.category}
          value={queryCategory || '-'}
          isRTL={isRTL}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {/* ══ GROUP SPECIFICATIONS ═══════════════════════════════════ */}
          <Section icon={Sparkles} title={copy.detailsSection}>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted">{copy.fields.date}</p>
                <div className="flex items-center gap-2 font-medium text-heading">
                  <CalendarDays className="h-4 w-4 text-muted" />
                  {formatDateLabel(queryDate, language)}
                </div>
              </div>

              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted">{copy.fields.category}</p>
                <Badge variant="success">{queryCategory || '-'}</Badge>
              </div>

              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted">{copy.fields.occurrence}</p>
                <div className="flex items-center gap-2 font-medium text-heading">
                  <RotateCw className="h-4 w-4 text-muted" />
                  {localizedOccurrence}
                </div>
              </div>

              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted">{copy.fields.description}</p>
                <div className="text-sm font-medium leading-relaxed text-heading">{queryDescription || '-'}</div>
              </div>

              {groupNotes ? (
                <div className="rounded-xl border border-border bg-surface-alt/40 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                    <StickyNote className="h-3.5 w-3.5" />
                    {copy.fields.notes}
                  </p>
                  <p className="whitespace-pre-wrap text-sm font-medium text-heading">{groupNotes}</p>
                </div>
              ) : null}
            </div>
          </Section>

          {/* ══ RECURRING REMINDER — TIMELINE + ACTION ═════════════════ */}
          {isReminderContext ? (
            <Card className="space-y-5 border-primary/15 bg-primary/[0.04]">
              <div className="space-y-1 border-b border-primary/10 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Hourglass className="h-[18px] w-[18px]" />
                  </span>
                  <p className="text-sm font-semibold text-heading">{copy.recurringSection}</p>
                  <Badge variant={isDueToday ? 'warning' : 'primary'} dot>
                    {isDueToday ? copy.dueToday : copy.pending}
                  </Badge>
                </div>
                <p className="text-sm text-muted">{copy.recurringSubtitle}</p>
              </div>

              <ReminderTimeline
                isRTL={isRTL}
                events={[
                  {
                    key: 'original',
                    icon: CalendarDays,
                    iconWrap: 'border-border bg-surface-alt text-muted',
                    label: copy.originalDate,
                    value: formatDateLabel(queryDate, language),
                  },
                  {
                    key: 'due',
                    icon: CalendarClock,
                    iconWrap: isDueToday
                      ? 'border-warning/25 bg-warning/10 text-warning'
                      : 'border-primary/20 bg-primary/10 text-primary',
                    label: copy.dueDate,
                    value: formatDateLabel(dueDate, language),
                  },
                  {
                    key: 'next',
                    icon: RotateCw,
                    iconWrap: 'border-border bg-surface-alt text-muted',
                    label: copy.nextRepeat,
                    value: formatDateLabel(nextDueDate, language),
                  },
                ]}
              />

              <div className="space-y-3 rounded-2xl border border-border/70 bg-surface/90 p-4">
                <p className="text-sm text-heading">{copy.readyToApprove}</p>
                <p className="text-sm text-muted">{copy.keepPending}</p>

                {canEdit && isDueToday ? (
                  <Button
                    type="button"
                    icon={CheckCircle2}
                    loading={approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                    className="w-full"
                  >
                    {copy.approveAction}
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : null}
        </div>

        {/* ══ BENEFICIARY HOUSEHOLDS ═══════════════════════════════════ */}
        <div className="lg:col-span-2">
          <Section
            icon={Users}
            title={copy.beneficiariesSection}
            actions={<Badge variant="secondary">{beneficiaries.length}</Badge>}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-[66px] w-full rounded-xl" />
                ))}
              </div>
            ) : beneficiaries.length === 0 ? (
              <EmptyState icon={HandCoins} title={copy.emptyTitle} description={copy.emptyDesc} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {beneficiaries.map((row) => (
                  <button
                    key={row.houseName}
                    onClick={() =>
                      navigate(
                        `/dashboard/users/family-house/details?lookupType=houseName&lookupName=${encodeURIComponent(
                          row.houseName
                        )}`
                      )
                    }
                    className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-start shadow-sm transition-all hover:border-primary/30 hover:bg-surface-alt hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-heading transition-colors group-hover:text-primary">
                        {row.houseName}
                      </p>
                    </div>
                    <ChevronLeft
                      className={`h-4 w-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 ${isRTL ? '' : 'rotate-180'}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
