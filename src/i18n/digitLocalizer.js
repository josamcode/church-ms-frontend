/*
 * Global digit localization.
 *
 * The app mixes Arabic-Indic numerals (from ar-EG date/number formatters) with
 * Western numerals (from plain JS number rendering), so the same screen can show
 * both. Instead of touching every call site, this converts the digits displayed
 * in the DOM to match the active language:
 *   • Arabic  → ٠١٢٣٤٥٦٧٨٩
 *   • English → 0123456789
 *
 * It runs a MutationObserver and converts synchronously inside the observer
 * callback (a microtask that fires before the browser paints), so there is no
 * Western→Arabic flicker. Conversion is idempotent, so it never loops.
 *
 * Only visible text nodes are touched — attributes (href/value/data-*) are left
 * alone, so links, inputs and logic keep their original digits. Inputs, code
 * blocks and mailto: links are skipped; add `data-keep-digits` to any element
 * whose digits must stay exactly as authored.
 */

const WESTERN_RE = /[0-9]/g;
const ARABIC_RE = /[٠-٩]/g;
const ANY_DIGIT_RE = /[0-9٠-٩]/;
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toArabicDigits(value) {
  return String(value).replace(WESTERN_RE, (d) => AR_DIGITS[d.charCodeAt(0) - 48]);
}

export function toWesternDigits(value) {
  return String(value).replace(ARABIC_RE, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function localizeDigits(value, language) {
  return language === 'ar' ? toArabicDigits(value) : toWesternDigits(value);
}

const SKIP_TAGS = new Set([
  'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'SCRIPT', 'STYLE', 'NOSCRIPT',
  'CODE', 'PRE', 'KBD', 'SAMP',
]);

function isSkippedElement(el) {
  if (!el || el.nodeType !== 1) return false;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.isContentEditable) return true;
  if (el.hasAttribute('data-keep-digits')) return true;
  // Preserve emails — Arabic-Indic digits inside an address read as broken.
  if (el.tagName === 'A' && /^mailto:/i.test(el.getAttribute('href') || '')) return true;
  return false;
}

function isInSkippedSubtree(node) {
  let el = node.parentElement;
  while (el) {
    if (isSkippedElement(el)) return true;
    el = el.parentElement;
  }
  return false;
}

let currentLanguage = 'ar';
let observer = null;

function convertTextNode(node) {
  const value = node.nodeValue;
  if (!value || !ANY_DIGIT_RE.test(value)) return;
  if (isInSkippedSubtree(node)) return;
  const next = localizeDigits(value, currentLanguage);
  if (next !== value) node.nodeValue = next;
}

function convertSubtree(root) {
  if (!root) return;
  if (root.nodeType === 3) { convertTextNode(root); return; }
  if (root.nodeType !== 1 || isSkippedElement(root)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      return ANY_DIGIT_RE.test(n.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  for (const textNode of nodes) convertTextNode(textNode);
}

function handleMutations(mutations) {
  for (const m of mutations) {
    if (m.type === 'characterData') {
      convertTextNode(m.target);
    } else if (m.type === 'childList') {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === 1) convertSubtree(node);
        else if (node.nodeType === 3) convertTextNode(node);
      });
    }
  }
}

// Start (or re-sync) localization for the given language. Idempotent — safe to
// call on every language change; the observer is created only once.
export function startDigitLocalization(language) {
  if (typeof document === 'undefined' || !document.body) return;
  currentLanguage = language || currentLanguage;
  convertSubtree(document.body);
  if (observer) return;
  observer = new MutationObserver(handleMutations);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

export function stopDigitLocalization() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
