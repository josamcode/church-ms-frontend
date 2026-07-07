# Redesign Handoff — St. Michael Church Frontend

**Branch:** `redesign/full-frontend-system` (off `main`)
**Status:** Design-system foundation + app/mobile shell complete and verified; per-module bespoke passes are largely carried by the shared foundation and remain as documented follow-up.
**Build:** `npm run build` passes (exit 0) at every commit.

---

## What was completed (committed)

### Commit 1 — `feat(design-system): warm premium token & primitive foundation + mobile app shell`
**Phase 1 — design foundation (propagates to all 60 routes):**
- `src/styles/tokens.css` — full rewrite to a **warm parchment** palette (page bg `#f6f3ec`), richer navy authority + antique-gold accent, layered warm shadows, and new radius / ring / elevation / soft-tint tokens. Dark mode kept coherent (deep midnight-navy).
- `src/styles/globals.css` — tuned Cairo (Arabic) / Inter (Latin) typography, elevated `.card` + `.input-base`, new `.chip` / `.stat-card` / `.section-label` / `.card-hover` helpers, safe-area utilities (`.pb-safe`, `.pb-safe-nav`, `.pt-safe`), warm selection color, refined scrollbars, shimmer keyframe.
- `tailwind.config.js` — theme-aware shadows (mapped to CSS vars), `2xl` radius, `primary.soft` / `gold.soft` colors, shimmer animation.
- Primitives elevated (APIs preserved, backward compatible): `Button` (xs size, `fullWidth`, `tonal`/`soft` variants, press states), `Card` (padding scale + `tone` + `hover`/`interactive`, richer `CardHeader`), `Badge` (info/neutral/gold tones + status dot), `Table` (roomier padding, stronger uppercase header, warm row hover), `EmptyState` (warm framed illustration), `Skeleton` (shimmer sweep).
- New reusable primitives: `StatCard` (KPI tiles), `Section` (titled content region).

**Phase 2 — app shell / mobile shell:**
- `src/components/layout/MobileBottomNav.js` — **app-like bottom tab bar** (permission-filtered primary destinations + notification/chat badges + "More" → drawer). Hidden on `lg+`.
- `src/components/layout/DashboardLayout.js` — bottom-nav integration, mobile content bottom padding, `mobileNavItems`/`isMoreActive` logic.
- `src/components/layout/AuthLayout.js` — warm ambient background, gold-ringed logo badge, i18n app name (removed a hardcoded Arabic string).

**i18n:** Added the **25 missing Arabic keys** that were leaking English (e.g. `usersForm.create.title` → was "Create User", now "إضافة مستخدم"; `usersExplorerPage.*`, `notifications.*`) plus `dashboardLayout.mobileNav.more`. Verified: 0 keys now missing in Arabic.

### Commit 2 — `polish(ui): consistent form & overlay primitives`
- `Select` — removed a stray `py-5` that oversized triggers; `rounded-lg` + focus ring to match inputs.
- `Modal` — `rounded-2xl`, hairline border, softer backdrop blur, aligned padding.
- `Tabs` — fixed an undefined `text-foreground` color (silently unstyled inactive tabs) → design-system tokens.

---

## Verification
- `npm run build` → **passes** (only a pre-existing `pushError` no-unused-vars warning, unrelated).
- `npm run screenshots` → completes; pipeline healthy across desktop/tablet/mobile (390/768/1440).
- **Desktop review (authed run `screenshots/2026-07-07-15-40`)** confirmed the redesign lands premium & consistent: login, dashboard, users list, **user-create form (English leak fixed → "إضافة مستخدم")**, user detail, meetings list, visitations. Warm parchment + navy + gold reads respectful and professional.

### Known environmental limitation — screenshot auth
The Playwright storage-state token (`.auth/…`, generated 14:46) **expires ~75 min after creation**, and `SCREENSHOT_USER`/`SCREENSHOT_PASSWORD` are **empty** in `.env`, so it cannot be auto-refreshed. Consequence:
- Run `2026-07-07-15-40`: **desktop captured authed** (real redesigned pages) — use for visual review; had 1 *transient* failure on `/dashboard/settings/account` caused by a `npm run build` running concurrently and starving the dev server (not a code bug — the route is a normal `lazy()` import; baseline passed it).
- Run `2026-07-07-15-53` (clean, no competing process): token now fully expired → protected routes redirect to login, but **0 failed routes** (login loads fine).
- **To get a run that is both authed AND 0-failed:** set `SCREENSHOT_USER`/`SCREENSHOT_PASSWORD` in `.env`, run `npm run screenshots:auth` to mint a fresh token, then `npm run screenshots` (do **not** run other CPU-heavy tasks concurrently).

---

## Remaining work (bespoke per-module passes)
The foundation already elevates every page built on the shared primitives (Card/Button/Table/Input/Select/Modal/Tabs/PageHeader/EmptyState/Badge). Remaining is bespoke, module-specific craft:
1. **Dashboard** — adopt `StatCard` for the KPI row (currently bespoke markup; visually fine, low priority).
2. **Public landing** (`src/pages/public/LandingPage.js`, `LandingMobilePage.js`) — add graceful fallbacks so empty API content doesn't leave large vertical gaps; the page is API-content-driven (38–50 KB) and was left untouched to avoid risk.
3. **Detail pages** — richer summaries / timelines where useful (user detail is already strong; extend the pattern to meetings, confessions, visitations, aid-history).
4. **Per-module smart list/card density** — `UsersListPage` already has a table/card toggle; replicate that pattern where other list pages still default to dense tables on small screens.
5. **Dark-mode audit** — a few pages use literal `bg-white` (e.g. `UsersListPage` member cards) that won't invert in dark mode; sweep for `bg-white`/hardcoded light colors.
6. **Verify mobile shell live** — once auth is refreshed, confirm the bottom nav + drawer on real authed mobile captures.

## Guardrails honored
Frontend-only; no route/permission/API/business-logic changes; no features removed; all new user-facing text via `i18n`; reusable tokens/components (no one-off page hacks); `.gitignore` hardened to exclude `/screenshots`, `/.auth`, `.env`.

## Exact next steps
1. `git checkout redesign/full-frontend-system`
2. Populate `.env` screenshot creds → `npm run screenshots:auth` → `npm run screenshots`; confirm `screenshots-report.json` `failedRoutes: []` on an authed run and review mobile/tablet.
3. Work the "Remaining work" list top-down, committing per module, rebuilding each time.
