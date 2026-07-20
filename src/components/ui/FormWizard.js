import { forwardRef, useImperativeHandle, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

/**
 * Multi-step form wizard.
 *  - Desktop: a vertical numbered step rail (sidebar) + the active step's panel.
 *  - Mobile: a compact step progress header + one step at a time, with a sticky
 *    Prev / Next / Save action bar. Not a squeezed full form.
 *
 * All step contents stay mounted (inactive ones hidden) so form state, focus,
 * and uploads are never lost when navigating between steps.
 *
 * Save is always available in the action bar, on every step — a wizard groups
 * fields for readability, it should not hold the submit hostage. Parents can
 * grab a ref and call `goToStep(id)` to surface errors that live on a step the
 * user is not currently looking at.
 *
 * steps: [{ id, label, description?, icon?, content }]
 */
function FormWizard({
  steps = [],
  onSave,
  onCancel,
  saving = false,
  saveLabel = 'Save',
  nextLabel = 'Next',
  prevLabel = 'Back',
  cancelLabel = 'Cancel',
  isRTL = false,
  defaultIndex = 0,
  footerExtra = null,
}, ref) {
  const [active, setActive] = useState(defaultIndex);

  const last = Math.max(steps.length - 1, 0);
  const safe = Math.min(Math.max(active, 0), last);
  const go = (i) => setActive(Math.min(Math.max(i, 0), last));

  useImperativeHandle(ref, () => ({
    goToStep: (id) => {
      const index = steps.findIndex((step) => step.id === id);
      if (index >= 0) setActive(index);
    },
  }), [steps]);

  if (!steps.length) return null;

  const current = steps[safe];
  const ActiveIcon = current.icon;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
      {/* ── Step rail / progress ─────────────────────────────────────────── */}
      <div className="lg:w-72 lg:shrink-0">
        {/* Mobile: label + progress bar */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-bold text-heading">{current.label}</p>
            <span className="shrink-0 text-xs font-semibold text-muted">
              {safe + 1} / {steps.length}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5" role="tablist" aria-label={current.label}>
            {steps.map((step, index) => (
              <button
                key={step.id || index}
                type="button"
                onClick={() => go(index)}
                aria-label={step.label}
                aria-selected={index === safe}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= safe ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: vertical step rail */}
        <ol className="hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-1">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isDone = index < safe;
            const isCurrent = index === safe;
            return (
              <li key={step.id || index}>
                <button
                  type="button"
                  onClick={() => go(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-all ${
                    isCurrent
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted hover:bg-surface-alt hover:text-heading'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                      isCurrent
                        ? 'bg-white/15 text-white'
                        : isDone
                          ? 'bg-success/15 text-success'
                          : 'bg-surface-alt text-muted group-hover:text-heading'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : StepIcon ? <StepIcon className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[11px] font-semibold uppercase tracking-wide ${isCurrent ? 'text-white/70' : 'text-muted/70'}`}>
                      {index + 1} / {steps.length}
                    </span>
                    <span className="block truncate text-sm font-semibold">{step.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Active step panel + actions ──────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex items-start gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
            {ActiveIcon ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ActiveIcon className="h-5 w-5" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight text-heading">{current.label}</h2>
              {current.description ? (
                <p className="mt-0.5 text-sm text-muted">{current.description}</p>
              ) : null}
            </div>
          </div>
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            {steps.map((step, index) => (
              <div key={step.id || index} className={index === safe ? 'animate-fade-in' : 'hidden'}>
                {step.content}
              </div>
            ))}
          </div>
        </div>

        {footerExtra ? <div className="mt-4">{footerExtra}</div> : null}

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-10 mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel} className="hidden sm:inline-flex">
              {cancelLabel}
            </Button>
          ) : null}
          <div className="hidden flex-1 sm:block" />
          {safe > 0 ? (
            <Button type="button" variant="outline" icon={PrevIcon} onClick={() => go(safe - 1)} className="flex-1 sm:flex-none">
              {prevLabel}
            </Button>
          ) : null}
          {safe < last ? (
            <Button
              type="button"
              variant="outline"
              icon={NextIcon}
              iconPosition="end"
              onClick={() => go(safe + 1)}
              className="flex-1 sm:flex-none"
            >
              {nextLabel}
            </Button>
          ) : null}
          {/* Save is always reachable — no need to walk to the last step to submit. */}
          <Button type="button" onClick={onSave} loading={saving} className="flex-1 sm:flex-none">
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default forwardRef(FormWizard);
