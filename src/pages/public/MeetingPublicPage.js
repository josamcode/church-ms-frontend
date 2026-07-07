import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Clock3, Loader2, Users } from 'lucide-react';

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

export default function MeetingPublicPage() {
  const { id } = useParams();
  const { isRTL, t } = useI18n();
  const tf = useTf();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const meetingQuery = useQuery({
    queryKey: ['public', 'meeting', id],
    queryFn: async () => (await meetingsApi.public.getMeeting(id)).data?.data || null,
    enabled: Boolean(id),
    staleTime: 60000,
    retry: false,
  });

  const meeting = meetingQuery.data || null;
  const day = translateDay(meeting?.day, t);

  return (
    <div className="relative overflow-hidden bg-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <section className="page-container relative py-28">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link
            to="/meetings"
            className={`inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
          >
            <BackIcon className="h-4 w-4" />
            {tf('meetings.public.backToList', 'Back to meetings')}
          </Link>

          {meetingQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/60 p-6 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tf('meetings.public.loading', 'Loading meeting...')}
            </div>
          ) : meetingQuery.isError || !meeting ? (
            <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger-light/40 p-6 text-sm text-danger">
              <AlertCircle className="h-4 w-4" />
              {tf('meetings.public.notFound', 'This meeting could not be found.')}
            </div>
          ) : (
            <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/8 bg-surface p-8">
                <div className="absolute top-0 end-0 h-32 w-32 rounded-bl-[4rem] bg-gradient-to-bl from-primary/6 to-transparent" />
                <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {meeting.sector?.name ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        {meeting.sector.name}
                      </p>
                    ) : null}
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-heading">{meeting.name}</h1>
                  </div>
                </div>

                <div className={`relative mt-6 flex flex-wrap gap-3 ${isRTL ? 'justify-end' : ''}`}>
                  {day ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-heading">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {day}
                    </span>
                  ) : null}
                  {meeting.time ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-heading" dir="ltr">
                      <Clock3 className="h-4 w-4 text-primary" />
                      {meeting.time}
                    </span>
                  ) : null}
                </div>
              </div>

              {meeting.sector?._id ? (
                <Link
                  to={`/sectors/${meeting.sector._id}`}
                  className={`inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:underline ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}
                >
                  {tf('meetings.public.viewSector', 'View sector details')}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
