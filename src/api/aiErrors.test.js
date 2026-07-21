import { aiErrorMessageKey, ERROR_KEY_BY_CODE, FALLBACK_KEY } from './aiErrors';
import { translations } from '../i18n/translations';

describe('aiErrorMessageKey', () => {
  it.each(Object.entries(ERROR_KEY_BY_CODE))(
    'maps %s to %s from an axios error shape',
    (errorCode, expectedKey) => {
      expect(aiErrorMessageKey({ response: { data: { errorCode } } })).toBe(expectedKey);
    }
  );

  // The real backend envelope: `{ success: false, error: { code } }`.
  it.each(Object.entries(ERROR_KEY_BY_CODE))(
    'maps %s from the real backend error envelope (data.error.code)',
    (code, expectedKey) => {
      expect(aiErrorMessageKey({ response: { data: { error: { code } } } })).toBe(expectedKey);
    }
  );

  it('reads a bare errorCode when there is no axios envelope', () => {
    expect(aiErrorMessageKey({ errorCode: 'AI_QUOTA_EXCEEDED' })).toBe('ai.errors.quota');
    expect(aiErrorMessageKey({ code: 'AI_QUOTA_EXCEEDED' })).toBe('ai.errors.quota');
  });

  it('falls back for an unknown code', () => {
    expect(aiErrorMessageKey({ response: { data: { errorCode: 'WAT' } } })).toBe(FALLBACK_KEY);
  });

  it('falls back for a network error with no response at all', () => {
    expect(aiErrorMessageKey(new Error('Network Error'))).toBe(FALLBACK_KEY);
  });

  it('never throws on null, undefined, or a primitive', () => {
    expect(aiErrorMessageKey(null)).toBe(FALLBACK_KEY);
    expect(aiErrorMessageKey(undefined)).toBe(FALLBACK_KEY);
    expect(aiErrorMessageKey('boom')).toBe(FALLBACK_KEY);
  });

  // A distinct code that resolves to a generic message is worse than useless:
  // it looks handled while telling the user nothing actionable.
  it('gives each known code its own distinct message key', () => {
    const keys = Object.values(ERROR_KEY_BY_CODE);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain(FALLBACK_KEY);
  });
});

describe('every AI error key resolves in both languages', () => {
  function lookup(tree, dottedPath) {
    return dottedPath.split('.').reduce((node, part) => (node ? node[part] : undefined), tree);
  }

  it.each([...Object.values(ERROR_KEY_BY_CODE), FALLBACK_KEY])(
    '%s exists in en and ar',
    (key) => {
      expect(typeof lookup(translations.en, key)).toBe('string');
      expect(typeof lookup(translations.ar, key)).toBe('string');
    }
  );
});

describe('ai translation section parity', () => {
  function flatten(node, prefix = '') {
    return Object.entries(node).flatMap(([key, value]) =>
      value && typeof value === 'object'
        ? flatten(value, `${prefix}${key}.`)
        : [`${prefix}${key}`]
    );
  }

  it('defines the section in both languages', () => {
    expect(translations.en.ai).toBeDefined();
    expect(translations.ar.ai).toBeDefined();
  });

  // A key present in only one tree silently falls back to English at runtime,
  // which reads as a missing translation rather than an error.
  it('has identical key sets in en and ar', () => {
    expect(flatten(translations.ar.ai).sort()).toEqual(flatten(translations.en.ai).sort());
  });

  it('has no empty string values', () => {
    for (const tree of [translations.en.ai, translations.ar.ai]) {
      flatten(tree).forEach((path) => {
        const value = path.split('.').reduce((node, part) => node[part], tree);
        expect(typeof value === 'string' && value.length > 0).toBe(true);
      });
    }
  });

  it('keeps the observation and hypothesis headings distinct in both languages', () => {
    // The UI renders these as two separate blocks on purpose; identical or
    // missing headings would defeat the separation.
    for (const tree of [translations.en.ai, translations.ar.ai]) {
      expect(tree.analytics.observationsTitle).not.toBe(tree.analytics.hypothesesTitle);
      expect(tree.analytics.observationsTitle.length).toBeGreaterThan(0);
      expect(tree.analytics.hypothesesTitle.length).toBeGreaterThan(0);
    }
  });
});

describe('AI permission mirror', () => {
  const { PERMISSIONS, PERMISSION_LABELS } = require('../constants/permissions');
  const AI_PERMISSIONS = ['AI_DRAFT_CONTENT', 'AI_EXPLAIN_ANALYTICS', 'AI_DATA_QUALITY_REVIEW'];

  it.each(AI_PERMISSIONS)('%s is present in the permission list', (permission) => {
    expect(PERMISSIONS).toContain(permission);
  });

  it.each(AI_PERMISSIONS)('%s has a human-readable label', (permission) => {
    expect(typeof PERMISSION_LABELS[permission]).toBe('string');
    expect(PERMISSION_LABELS[permission].length).toBeGreaterThan(0);
  });
});
