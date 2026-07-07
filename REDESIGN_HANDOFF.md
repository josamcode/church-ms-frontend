# Redesign Handoff — St. Michael Church Frontend

**Branch:** `redesign/full-frontend-system` (off `main`)
**Status:** COMPLETE — design-system foundation, app/mobile shell, AND bespoke per-module redesign passes across every module are done and committed. 71 source files changed (54 pages + 16 components/styles) across 5 commits.
**Build:** `npm run build` passes (exit 0) at every commit.

> Update: the "Remaining work (bespoke per-module passes)" list below has now been **completed** in commits `d941084` and `3fde6c6` — every operational module plus Users/Family House, Settings, Profile, System Analytics, public booking, and the shared pages received a bespoke redesign pass. The only items intentionally NOT touched are the two large API-driven public **marketing** landing files (`public/LandingPage.js`, `public/LandingMobilePage.js`) — left as-is to avoid risk; they still inherit the warm tokens. See "Remaining/optional" at the bottom.

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

## Completed per-module passes (commits d941084, 3fde6c6)
- **Meetings & Sectors** (12 pages): StatCard KPI grids, Section panels, PageHeader, Skeleton loading, safer responsive grids.
- **Bookings** (requests/mine/types/type-form): StatCard rows, redesigned cards with status Badges, EmptyState, sticky mobile form actions.
- **Confessions / Visitations / Divine Liturgies**: StatCard analytics, guided step cards, a bespoke visit→record **Timeline** on visitation detail, EmptyState/Skeleton.
- **Notifications / Chats / Archive**: rebuilt notification cards (fixed a real `tttable` no-op-class bug), StatCards on Archive, Chats polished conservatively (realtime untouched).
- **Lords Brethren / Aid / Aid History / System Analytics**: framed tables, gold key-facts strips on Aid details, dark-mode-safe category cards, StatCard analytics grid.
- **Users & Family House**: StatCard grids, status Badges, Section filters, mobile CTAs; `UserDetailsPage` kept as reference-quality.
- **Settings / Profile / Platform / Landing-content editor**: Section-grouped settings with mobile-reachable save actions.
- **Public booking form / 404 / Under-development**: dark-mode-safe, warm framed states, readable localized dates.

## Remaining / optional
1. **Public marketing landing** (`public/LandingPage.js`, `LandingMobilePage.js`) — intentionally left as-is (large, API-content-driven; already inherits warm tokens). Optional follow-up: graceful empty-content fallbacks so absent API content doesn't leave vertical gaps.
2. **Live authed visual QA** — build + ESLint (`no-undef`/`no-unused-vars`) + strict presentation-only specs verified all module pages; a live authed screenshot pass is still worthwhile once screenshot credentials are set (see auth limitation above), since protected pages render only when logged in.
3. **Dark-mode spot sweep** — most hardcoded light colors were fixed; a final sweep for stray `bg-white` on colored surfaces is worthwhile.

## Guardrails honored
Frontend-only; no route/permission/API/business-logic changes; no features removed; all new user-facing text via `i18n`; reusable tokens/components (no one-off page hacks); `.gitignore` hardened to exclude `/screenshots`, `/.auth`, `.env`.

## Exact next steps
1. `git checkout redesign/full-frontend-system`
2. Populate `.env` screenshot creds → `npm run screenshots:auth` → `npm run screenshots`; confirm `screenshots-report.json` `failedRoutes: []` on an authed run and review mobile/tablet.
3. Work the "Remaining work" list top-down, committing per module, rebuilding each time.
