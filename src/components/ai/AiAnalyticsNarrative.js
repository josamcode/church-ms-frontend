import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Lightbulb, ListChecks, Sparkles } from 'lucide-react';

import { aiApi } from '../../api/endpoints';
import { aiErrorMessageKey } from '../../api/aiErrors';
import { useI18n } from '../../i18n/i18n';
import Button from '../ui/Button';
import AiGeneratedBadge from '../ui/AiGeneratedBadge';

/**
 * Written explanation of the current analytics period.
 *
 * **Observations and hypotheses are rendered as two visually distinct blocks
 * with explicit headings, and must stay that way.** Observations restate the
 * figures the server sent and each is checked server-side against a real
 * metric key; hypotheses are guesses about causes that the system has no
 * information about. Merging them into one paragraph would present a guess
 * with the same authority as a measurement — which removes the entire reason
 * this feature is safe to show an administrator.
 *
 * The server assembles the numbers; this component sends only a period and a
 * scope, so no figure can be injected from the client.
 */
export default function AiAnalyticsNarrative({ period = 'month', scope = 'site', className = '' }) {
  const { t, isRTL } = useI18n();
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [narrative, setNarrative] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  const narrateMutation = useMutation({
    mutationFn: () => aiApi.narrateAnalytics({ period, scope }),
    onSuccess: (response) => {
      setNarrative(response?.data?.data?.narrative || null);
      setErrorKey(null);
    },
    onError: (error) => {
      setNarrative(null);
      setErrorKey(aiErrorMessageKey(error));
    },
  });

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <section className={`rounded-3xl border border-border bg-surface p-6 shadow-card ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" aria-hidden="true" />
            <h2 className="text-base font-bold text-heading">
              {tf('ai.analytics.title', 'Explain these numbers')}
            </h2>
          </div>
          <p className="mt-1 max-w-prose text-sm text-muted">
            {tf(
              'ai.analytics.subtitle',
              'A written summary of the current period, with observations kept separate from interpretations.'
            )}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={Sparkles}
          loading={narrateMutation.isPending}
          onClick={() => narrateMutation.mutate()}
        >
          {narrative
            ? tf('ai.analytics.regenerate', 'Explain again')
            : tf('ai.analytics.action', 'Explain the numbers')}
        </Button>
      </div>

      {errorKey ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {tf(errorKey, 'Could not generate an explanation.')}
        </p>
      ) : null}

      {narrative ? (
        <div className="mt-5 space-y-5" dir={dir}>
          <div className="flex flex-wrap items-center gap-2">
            <AiGeneratedBadge>{tf('ai.badge', 'AI generated')}</AiGeneratedBadge>
            <span className="text-xs text-muted">
              {tf('ai.reviewNotice', 'Review before publishing. AI can be wrong.')}
            </span>
          </div>

          {narrative.narrative_ar ? (
            <p className="text-sm leading-relaxed text-base">{narrative.narrative_ar}</p>
          ) : null}

          {/* Block 1 — grounded in the supplied figures. */}
          <div className="rounded-2xl border border-info/20 bg-info/[0.04] p-4">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-info" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-heading">
                {tf('ai.analytics.observationsTitle', 'Observations grounded in the numbers')}
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted">
              {tf('ai.analytics.observationsHint', 'Each of these restates a figure shown above.')}
            </p>

            <ul className="mt-3 space-y-2">
              {(narrative.observations || []).map((observation) => (
                <li key={observation.metricKey + observation.statement_ar} className="text-sm text-base">
                  <span>{observation.statement_ar}</span>
                  {/* The metric key is shown so a reader can trace any claim
                      back to the figure it came from. */}
                  <code className="ms-2 rounded bg-surface-alt px-1.5 py-0.5 text-[11px] text-muted">
                    {observation.metricKey}
                  </code>
                </li>
              ))}
            </ul>
          </div>

          {/* Block 2 — deliberately separate, deliberately styled differently. */}
          <div className="rounded-2xl border border-warning/20 bg-warning-light/40 p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-warning" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-heading">
                {tf('ai.analytics.hypothesesTitle', 'Suggested interpretations — need verification')}
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted">
              {tf(
                'ai.analytics.hypothesesHint',
                'These are guesses about why. The system has no information about causes.'
              )}
            </p>

            <ul className="mt-3 space-y-2">
              {(narrative.hypotheses || []).map((hypothesis) => (
                <li key={hypothesis.statement_ar} className="flex items-start gap-2 text-sm text-base">
                  <AiGeneratedBadge tone="hypothesis" size="sm" showIcon={false}>
                    {tf(`ai.analytics.certainty.${hypothesis.certainty}`, hypothesis.certainty)}
                  </AiGeneratedBadge>
                  <span>{hypothesis.statement_ar}</span>
                </li>
              ))}
            </ul>
          </div>

          {narrative.caveats?.length ? (
            <div className="rounded-2xl border border-border bg-surface-alt/50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-muted" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-heading">
                  {tf('ai.analytics.caveatsTitle', 'Caveats')}
                </h3>
              </div>
              <ul className="mt-2 list-disc ps-5 space-y-1 text-xs text-muted">
                {narrative.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
