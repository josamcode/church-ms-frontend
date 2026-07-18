import { LayoutGrid, TableProperties } from 'lucide-react';
import Button from './Button';
import { useI18n } from '../../i18n/i18n';

/**
 * Table / cards view switch shared across every list screen so the control
 * looks and behaves identically everywhere. Extracted from the hand-built
 * Users directory to keep the app reading as one product.
 */
export default function ViewToggle({ value, onChange, className = '' }) {
  const { t } = useI18n();
  const options = [
    { value: 'table', icon: TableProperties, label: t('common.table.tableView') },
    { value: 'cards', icon: LayoutGrid, label: t('common.table.cardsView') },
  ];

  return (
    <div
      dir="ltr"
      className={`inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface p-1 ${className}`}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'primary' : 'ghost'}
          size="sm"
          icon={option.icon}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          aria-label={option.label}
          title={option.label}
          className="!px-2"
        >
          <span className="sr-only">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
