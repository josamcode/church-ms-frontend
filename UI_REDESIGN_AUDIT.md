# UI Redesign Audit — St. Michael Church Management System

**Branch:** `redesign/full-frontend-system`
**Baseline screenshots:** `frontend/screenshots/2026-07-07-14-46` (desktop 1440, tablet 768, mobile 390 — 60 routes each, 0 failed)
**Stack:** CRA + React 18 + React Router 6 + Tailwind (CSS-variable tokens) + framer-motion + lucide-react + react-query. RTL/Arabic-first with English fallback via `i18n`.

---

## 1. Visual audit — what's actually there

The app is **more mature than "weak"** — it already has a token system, dark mode, RTL, a responsive `Table` with a mobile card view + toggle, and a full lucide icon set. The problems are consistency, warmth, and mobile app-feel, not a missing foundation. Findings:

### Strengths to preserve
- Navy + gold identity is appropriate for an Egyptian Orthodox church. Keep it.
- CSS-variable token architecture (`tokens.css` → Tailwind `rgb(var(--x))`) is good — elevate it, don't replace it.
- `Table.js` already renders touch cards on mobile with a view toggle — build on it, don't reinvent.
- Dashboard, user-detail, and multi-step user form are structurally sound.

### Problems (ranked by visible impact)
1. **English leaks into the Arabic UI.** 25 keys exist in `en` but not `ar`, so `t()` falls back to English. Most visible: `usersForm.create.title` → "Create User", `usersForm.create.subtitle` → "Add a new user profile…", plus `usersExplorerPage.*` and 5 `notifications.*` keys. Looks broken/half-built.
2. **Cold, generic palette.** `--color-bg #f8f9fc` is a cold blue-gray that reads "SaaS template." No warmth, no reverence. Borders and surfaces are flat.
3. **Cramped desktop tables.** Users list packs ~60 rows at `p-3`, tiny type, thin rows, no zebra/rhythm, weak header — hard to scan.
4. **No mobile app shell.** Mobile navigation is only a hamburger drawer. No bottom tab bar, no sticky primary actions → feels like a squeezed desktop site, not a PWA.
5. **Public landing is fragile.** Renders large empty vertical gaps + an empty navy block when landing content/API is absent — no graceful fallback.
6. **Flat primitives.** `Button`/`Card`/`Badge` are functional but generic — single shadow, no hover lift, no tonal/soft variants, no `StatCard`, no `Section` wrapper, no `Sheet`/bottom-sheet.
7. **Typography lacks hierarchy.** One heading weight/size ramp; Arabic (Cairo) needs its own tuned tracking/leading vs Inter.
8. **Loading/empty/error states** exist but are visually plain and inconsistent between modules.

---

## 2. Design direction

**"Warm sanctuary, modern administration."** Respectful, calm, premium — not corporate, not childish, not AI-generic.

- **Palette:** Keep deep navy (`--color-primary`) as the authority color and antique gold (`--color-secondary`) as the sacred accent. **Warm every neutral**: page background moves from cold `#f8f9fc` to a soft parchment/warm-ivory; surfaces stay clean white but sit on warmth; borders gain a faint warm tint. Dark mode stays deep midnight-navy, coherent.
- **Typography:** Cairo for Arabic (tuned tracking `normal`, slightly heavier headings), Inter for Latin. A real type scale: display / h1 / h2 / section-label / body / caption.
- **Depth:** Layered, soft shadows (ambient + key), 1px hairline borders, generous radii (`xl`/`2xl` for cards, `lg` for controls). Subtle hover lift on interactive cards.
- **Rhythm:** 4px spacing base, consistent section spacing, roomier tables, calmer density.
- **Motion:** Quiet — fade/slide on mount, 150–200ms, `motion-safe` only. No bounce.
- **Arabic copy:** Natural, respectful register suitable for a church (فصحى مبسّطة). No literal machine translations.

---

## 3. Component plan (tokens + shared primitives — highest leverage)

Changes here propagate to all 60 routes.

| Component | Action |
|---|---|
| `styles/tokens.css` | Warm the neutral ramp; deepen/enrich primary & gold; add radius, ring, elevation, and warm-surface tokens; keep dark mode coherent. |
| `styles/globals.css` | Tuned Cairo/Inter typography; refined `.card`/`.input-base`; add `.stat-card`, `.chip`, `.section`, `.soft-*` helpers; selection color; safe-area + bottom-nav spacing utilities; shimmer. |
| `ui/Button` | Add `xs` size, `fullWidth`, `tonal`/`soft` variants, icon-only, refined shadow + active press. Keep existing variants/props. |
| `ui/Card` | Padding scale (`sm/md/lg`), `hover`/`interactive`, tonal header; polish `CardHeader`. |
| `ui/StatCard` (new) | Reusable KPI tile (icon, value, label, delta, tone) — dashboards use ad-hoc markup today. |
| `ui/Section` (new) | Titled content section wrapper (title, description, actions, body) for detail/settings pages. |
| `ui/Badge` | Add tonal/soft status tones (success/warning/danger/info/neutral/gold). |
| `ui/Table` | Roomier padding, zebra option, stronger header, better mobile card typography; keep the API + toggle. |
| `ui/EmptyState` / `Skeleton` | Warmer illustration frame; shimmer skeletons; consistent sizing. |
| `ui/Sheet` (new) | Bottom-sheet/drawer for mobile filters & actions. |
| `layout/DashboardLayout` | Add **MobileBottomNav** (app-like tab bar + "more" sheet), safe-area insets, topbar/sidebar polish. |

---

## 4. Module plan (phases)

1. **Design system foundation** — tokens, globals, Button, Card, Badge, StatCard, Section, EmptyState, Skeleton, Table. *(build + commit)*
2. **App shell & mobile shell** — DashboardLayout topbar/sidebar polish, MobileBottomNav, safe-area, AuthLayout/PublicLayout. *(build + commit)*
3. **Dashboard, Auth, Public, Settings, Profile** — StatCard adoption, warm hero, public-landing empty-state fallback, auth polish. *(build + commit)*
4. **Users & Family House** — fix missing AR keys, roomier list, guided create/edit, richer detail/timeline. *(build + commit)*
5. **Meetings, Bookings, Divine Liturgies, Confessions, Visitations** — smart list/card views, grouped forms, useful detail pages. *(build + commit)*
6. **Notifications, Chats, Archive, Lord's Brethren, Aid** — consistent lists, mobile flows, fix remaining AR keys. *(build + commit)*
7. **Final polish & screenshot review** — regenerate screenshots, verify 0 failed, fix regressions, summary.

**Guardrails:** frontend-only; no route/permission/API/business-logic changes; no deleted features; all user text via `i18n`; reusable tokens/components over one-off hacks; keep `npm run build` green and screenshots at 0 failed after every phase.
