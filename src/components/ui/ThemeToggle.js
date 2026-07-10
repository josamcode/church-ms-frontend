import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useI18n } from '../../i18n/i18n';

/*
 * Shared light/dark theme helpers. The app uses Tailwind's `darkMode: 'class'`,
 * so the theme is just the `.dark` class on <html>, persisted to localStorage
 * (applied on first load in src/index.js). This mirrors the dashboard toggle.
 */
export function isDarkTheme() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

export function applyTheme(dark) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch (_e) {
    /* storage unavailable — ignore */
  }
}

export function useThemeToggle() {
  const [dark, setDark] = useState(isDarkTheme);
  // Flip based on the live DOM state, so multiple toggles stay in sync.
  const toggle = () => {
    const next = !isDarkTheme();
    applyTheme(next);
    setDark(next);
  };
  return { dark, toggle };
}

// Icon button — drop into headers/toolbars. Pass `className` to style it.
export default function ThemeToggle({ className = '' }) {
  const { t } = useI18n();
  const { dark, toggle } = useThemeToggle();
  const label = dark ? t('common.theme.light') : t('common.theme.dark');
  const Icon = dark ? Sun : Moon;
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={className}>
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
