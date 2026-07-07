import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, ChevronRight, Clock3, Loader2, Users } from 'lucide-react';

import { meetingsApi } from '../../api/endpoints';
import { useI18n } from '../../i18n/i18n';

function useTf() {
  const { t } = useI18n();
  return (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
}

function translateDay(day, t) {
  if (!day) return '';
  const key = `meetings.days.${day}`;
  const value = t(key);
  return value && value !== key ? value : day;
}

function MeetingCard({ meeting, isRTL, tf, t }) {
  const day = translateDay(meeting.day, t);

  return (
    <Link
      to={`/meetings/${meeting._id}`}
      className={`group relative block h-full overflow-hidden rounded-[1.75rem] border border-primary/8 bg-surface p-6 transition-all duration-500 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/8 ${
        isRTL ? 'text-right' : 'text-left'
      }`}
    >
      <div className="absolute top-0 end-0 h-24 w-24 rounded-bl-[3rem] bg-gradient-to-bl from-primary/6 to-transparent" />
      <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-extrabold leading-tight text-heading">{meeting.name}</h3>
          {meeting.sector?.name ? (
            <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wider text-primary">
              {meeting.sector.name}
            </p>
          ) : null}
        </div>
      </div>

      <div className={`relative mt-5 flex flex-wrap gap-2 ${isRTL ? 'justify-end' : ''}`}>
        {day ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            {day}
          </span>
        ) : null}
        {meeting.time ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted" dir="ltr">
            <Clock3 className="h-3.5 w-3.5" />
            {meeting.time}
          </span>
        ) : null}
      </div>

      <div
        className={`relative mt-5 flex items-center gap-1.5 text-primary/40 transition-all duration-300 group-hover:gap-2.5 group-hover:text-primary ${
          isRTL ? 'flex-row-reverse' : ''
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-wider">
          {tf('meetings.public.viewDetails', 'View details')}
        </span>
        <ChevronRight className={`h-3.5 w-3.5 ${isRTL ? 'rotate-180' : ''}`} />
      </div>
    </Link>
  );
}

export default function MeetingsPublicPage() {
  const { isRTL, t } = useI18n();
  const tf = useTf();

  const meetingsQuery = useQuery({
    queryKey: ['public', 'meetings'],
    queryFn: async () => (await meetingsApi.public.getMeetings()).data?.data || [],
    staleTime: 60000,
  });

  const meetings = useMemo(
    () => (Array.isArray(meetingsQuery.data) ? meetingsQuery.data : []),
    [meetingsQuery.data]
  );

  return (
    <div className="relative overflow-hidden bg-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <section className="page-container relative py-28">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className={`max-w-2xl space-y-4 ${isRTL ? 'text-right ms-auto' : ''}`}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Users className="h-3.5 w-3.5" />
              {tf('meetings.public.eyebrow', 'Meetings')}
            </span>
            <h1 className="text-4xl font-black tracking-tight text-heading sm:text-5xl">
              {tf('meetings.public.title', 'Meeting schedules')}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted">
              {tf(
                'meetings.public.subtitle',
                'Browse the meetings held across our sectors, including their day and time.'
              )}
            </p>
          </div>

          {meetingsQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/60 p-6 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tf('meetings.public.loading', 'Loading meetings...')}
            </div>
          ) : meetingsQuery.isError ? (
            <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger-light/40 p-6 text-sm text-danger">
              <AlertCircle className="h-4 w-4" />
              {tf('meetings.public.error', 'We could not load the meetings right now. Please try again later.')}
            </div>
          ) : meetings.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-surface/60 p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted">
                {tf('meetings.public.empty', 'There are no meetings to show at the moment.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting._id} meeting={meeting} isRTL={isRTL} tf={tf} t={t} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
