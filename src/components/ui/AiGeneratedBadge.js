import { Sparkles } from 'lucide-react';

/**
 * Marks content that a language model produced.
 *
 * Always render this next to AI output. The point is not decoration: a reader
 * who cannot tell generated text from written text has no reason to check it,
 * and unlabelled model output is the failure mode this whole feature is
 * designed to avoid.
 */

const toneStyles = {
  draft: 'bg-secondary/10 text-secondary border-secondary/20',
  observation: 'bg-info/10 text-info border-info/20',
  hypothesis: 'bg-warning-light text-warning border-warning/20',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
};

export default function AiGeneratedBadge({
  children,
  tone = 'draft',
  size = 'md',
  showIcon = true,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${toneStyles[tone] || toneStyles.draft} ${sizes[size] || sizes.md} ${className}
      `}
    >
      {showIcon && <Sparkles className={iconSizes[size] || iconSizes.md} aria-hidden="true" />}
      {children}
    </span>
  );
}
