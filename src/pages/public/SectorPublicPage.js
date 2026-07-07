import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  LayoutGrid,
  Loader2,
  Users,
} from 'lucide-react';

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

export default function SectorPublicPage() {
  const { id } = useParams();
  const { isRTL, t } = useI18n();
  const tf = useTf();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const sectorQuery = useQuery({
    queryKey: ['public', 'sector', id],
    queryFn: async () => (await meetingsApi.public.getSector(id)).data?.data || null,
    enabled: Boolean(id),
    staleTime: 60000,
    retry: false,
  });

  const sector = sectorQuery.data || null;
  const meetings = Array.isArray(sector?.meetings) ? sector.meetings : [];

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

          {sectorQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/60 p-6 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tf('meetings.public.sectorLoading', 'Loading sector...')}
            </div>
          ) : sectorQuery.isError || !sector ? (
            <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger-light/40 p-6 text-sm text-danger">
              <AlertCircle className="h-4 w-4" />
              {tf('meetings.public.sectorNotFound', 'This sector could not be found.')}
            </div>
          ) : (
            <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/8 bg-surface p-8">
                <div className="absolute top-0 end-0 h-32 w-32 rounded-bl-[4rem] bg-gradient-to-bl from-primary/6 to-transparent" />
                <div className={`relative flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {tf('meetings.public.sectorEyebrow', 'Sector')}
                    </p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-heading">{sector.name}</h1>
                  </div>
                </div>
              </div>

              <div>
                <div className={`mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Users className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-black uppercase tracking-wider text-heading">
                    {tf('meetings.public.sectorMeetings', 'Meetings in this sector')}
                  </h2>
                </div>

                {meetings.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-border bg-surface/60 p-8 text-center">
                    <p className="text-sm text-muted">
                      {tf('meetings.public.sectorNoMeetings', 'There are no meetings in this sector yet.')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {meetings.map((meeting) => {
                      const day = translateDay(meeting.day, t);
                      return (
                        <Link
                          key={meeting._id}
                          to={`/meetings/${meeting._id}`}
                          className={`group relative block overflow-hidden rounded-2xl border border-primary/8 bg-surface p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-md ${
                            isRTL ? 'text-right' : 'text-left'
                          }`}
                        >
                          <div className={`flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className="min-w-0 flex-1 truncate text-base font-bold text-heading">{meeting.name}</h3>
                            <ChevronRight
                              className={`h-4 w-4 flex-shrink-0 text-primary/40 transition-colors group-hover:text-primary ${
                                isRTL ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          <div className={`mt-3 flex flex-wrap gap-2 ${isRTL ? 'justify-end' : ''}`}>
                            {day ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {day}
                              </span>
                            ) : null}
                            {meeting.time ? (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted"
                                dir="ltr"
                              >
                                <Clock3 className="h-3.5 w-3.5" />
                                {meeting.time}
                              </span>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <Link
                to="/meetings"
                className={`inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:underline ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                {tf('meetings.public.viewAll', 'View all meetings')}
                <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
