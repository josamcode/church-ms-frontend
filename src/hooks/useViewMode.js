import { useCallback, useState } from 'react';

const DESKTOP_QUERY = '(min-width: 640px)';

function readStored(storageKey) {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === 'table' || value === 'cards' ? value : null;
  } catch {
    return null;
  }
}

function isDesktop() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(DESKTOP_QUERY).matches
  );
}

/**
 * Per-page table/cards view mode with localStorage persistence.
 *
 * Mirrors the behavior hand-built for the Users directory so every list
 * screen shares one contract: honor the remembered choice, otherwise fall
 * back to a responsive default (table on desktop, cards on phones). Each
 * screen keeps its own storage key so preferences never bleed across pages.
 */
export default function useViewMode(
  storageKey,
  { desktopDefault = 'table', mobileDefault = 'cards' } = {},
) {
  const [viewMode, setViewModeState] = useState(() => {
    const stored = readStored(storageKey);
    if (stored) return stored;
    return isDesktop() ? desktopDefault : mobileDefault;
  });

  const setViewMode = useCallback(
    (next) => {
      const normalized = next === 'cards' ? 'cards' : 'table';
      setViewModeState(normalized);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, normalized);
        } catch {
          /* ignore persistence failures (private mode / quota) */
        }
      }
    },
    [storageKey],
  );

  return [viewMode, setViewMode];
}
