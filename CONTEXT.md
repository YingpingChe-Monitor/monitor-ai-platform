# CONTEXT — project conventions

Read this file before modifying the project. It is the single source of truth for how this template is structured; the `setup-monitor-adaptation` / `add-page` / `remove-page` skill family keeps it current.

## Layout

- `apps/web` — Next.js 16 (App Router) web app, package `monitor-adaptation-web`. This is the product UI.
- `apps/api` — TypeScript starter (package `ts-template`): `src/index.ts` prints "Hello, TypeScript!" and exits. Not a server yet; no HTTP port.
- `docs/research` — research notes.

## Web app facts

- **Framework**: Next.js 16 App Router (`app/` dir), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base-nova style, `components.json`).
- **Ports**: dev and start both serve on http://localhost:3000.
- **Routes**:
  - `/login` — `app/(auth)/login/page.tsx`, mock login form with language switcher and theme toggle.
  - `/` — `app/(app)/page.tsx`, the dashboard: `SectionCards` (4 KPI cards), `ChartAreaInteractive` (recharts area chart), `DataTable` over `app/(app)/data.json` (68 rows). All data hardcoded.
  - `/prototype/cards` — `app/(app)/prototype/cards/page.tsx`, shadcn card gallery.
  - `/components/image-preview` — `app/(app)/components/image-preview/page.tsx`, image preview demo with four switchable implementations: lightbox (`components/image-lightbox.tsx`), gallery (`components/blocks/gallery-1.tsx`), `cambio` zoom (`components/ui/cambio-image.tsx`, dep `cambio`), medium zoom (`components/kibo-ui/image-zoom/`, dep `react-medium-image-zoom`), orchestrated by `components/image-preview-demo.tsx`.
  - `/components/pdf-preview` — `app/(app)/components/pdf-preview/page.tsx`, PDF preview demo with three switchable implementations: iframe embed (`components/pdf-viewer-embed.tsx`), pdf.js (`components/pdf-viewer-pdfjs.tsx`), react-pdf (`components/pdf-viewer-react-pdf.tsx`, dep `react-pdf`), orchestrated by `components/pdf-preview-demo.tsx`; sample file `public/sample.pdf`.
  - `/components/autocomplete` — `app/(app)/components/autocomplete/page.tsx`, autocomplete demo with five variants (plain single/multi Select, searchable single/multi Combobox with tokenized filter, chips + create), orchestrated by `components/autocomplete-demo.tsx`; new kit component `components/ui/combobox.tsx` (wraps `@base-ui/react`).
- **Auth** — mock, client-side only: `lib/auth.ts` hardcodes user `admin` / `123456` (name `管理员`); session persisted in localStorage key `monitor_g5_session`. `changePassword()` validates the current password and stores per-user overrides in localStorage key `monitor_g5_password_overrides` (refresh-proof; the mock login reads overrides too). `hooks/use-auth-guard.tsx` exports `AuthGuard` (redirects to `/login` when no session; wrap protected pages) and `GuestOnlyGuard` (used on the login page). Session storage is plaintext localStorage — never treat it as real auth.
- **i18n** — next-intl, cookie `locale`, default `zh`; most UI strings live in `messages/zh.json` and `messages/en.json` (keep both in sync); switch via the server action in `app/actions/locale.ts`. Note: some sample components (`section-cards.tsx`, `chart-area-interactive.tsx`, data-table headers/toasts) hardcode English strings — leave them as-is unless localizing.
- **Shell / navigation** — `components/app-shell.tsx` + `components/app-sidebar.tsx`; sidebar menu is built in `components/nav-main.tsx` from the i18n dictionary: two groups — "Examples" (Dashboard, Cards) and "Components" (Image Preview, PDF Preview, Autocomplete, label 控件仓库 in zh) — whose **active state derives from the current pathname** — adding a sub-item with a `url` gives the highlight for free. Bottom of the sidebar is `components/nav-user.tsx`, the user menu: **Account** (opens `ResetPasswordDialog`), **Notifications** (opens `NotificationsDialog` with an unread badge), language popover, log out. Branding lives in `components/brand-header.tsx` and `public/logo.png` / `logo-sm.png`.
- **Dialogs** (mounted inside `nav-user.tsx`, not routes):
  - `components/notifications-dialog.tsx` — 6 mock notifications (`NOTIFICATION_IDS` / `INITIAL_READ_IDS`), search filter, mark-as-read / delete (in-memory state), type badges, i18n strings in the `Notifications` section.
  - `components/reset-password-dialog.tsx` — current/new/confirm password form (new password min 6 chars), validates against the mock `changePassword()`, i18n strings in the `Account` section.
- **UI kit** — shadcn/ui components under `components/ui/`; page-level components under `components/`.
- **Page layout primitives** — `components/page-container.tsx` exports `PageContainer` (page root: dashboard-matching `px-4 lg:px-6` + vertical rhythm) and `PageGrid` (main + aside: side by side on wide containers, stacked below ~896px container width; columns are `minmax(0, …)` fractions and every cell is `min-w-0`). Pages scaffolded by `/add-page` root in `PageContainer` and use `PageGrid` for multi-block pages; the hard rules are: no fixed pixel widths (`w-[…]`/`min-w-[…]`/`max-w-[…]`), no bare multi-column grids (container-query prefix + `grid-cols-1` fallback only), controls rows `flex flex-wrap`, tables keep their `overflow-x-auto` wrapper.
- **Scripts** (`apps/web`): `dev`, `build`, `start`, `lint` (eslint). No test script.

## Adding a page (the pattern `add-page` follows)

1. Create the route dir `app/(app)/<mount>/<slug>/page.tsx` as a **server component** (no `"use client"`; import the client component). Pages under `app/(app)/` are automatically protected by `AuthGuard` via `app/(app)/layout.tsx` — no per-page guard.
2. Page components live in `components/<slug>-*.tsx` (client components). Never modify shared components (`components/data-table.tsx`, `components/ui/*`).
3. Page root: `PageContainer` from `components/page-container.tsx`. Multi-block pages (form + result card, chart + table) wrap the blocks in `PageGrid` — main block first, aside second. Forms without an aside are centered and constrained (`mx-auto w-full max-w-2xl`).
4. Form pages: `CardsCreateAccount` card layout (`components/cards/create-account.tsx`) + the `reset-password-dialog` interaction pattern (manual validation, per-field errors, spinner submit with ~500ms fake delay, `toast.success`, result card in the `PageGrid` aside, prefilled mock data, no persistence). Multi-column field rows are `grid grid-cols-1 gap-4` widened by container query only (`@container/card` on the card, e.g. `@2xl/card:grid-cols-2`).
5. Listing pages: no search → `CardsPayment` style (`components/cards/payments.tsx`); search → self-contained table (`components/ui/table`) with inline controls — fuzzy `Input`, `Select` filter, and/or a date row (`Toggle` 本日/本周/本月/本年 via date-fns + custom date-range inputs); the controls row is `flex flex-wrap items-end gap-2`. Charts → recharts matching a dashboard sample (area / bar / line / KPI-card+mini chart), consuming **pre-aggregated** `{ dimension, value }` series (no front-end aggregation); chart + table go in a `PageGrid` (table main, chart aside), the chart card stays `w-full` in its shrinkable cell.
6. Mock data: under ~10 rows → inline const in the component; larger → `app/(app)/<mount>/<slug>/data.json` imported by the server page. No persistence unless the user asks (then localStorage, per the `lib/auth.ts` pattern).
7. Nav: add a sub-item to an existing group's `items` in `components/nav-main.tsx`, or push a new group object (`{ title, url: "#", icon, items }`) for a new directory. Active-state highlight is automatic via pathname.
8. Add any new user-visible strings to both `messages/zh.json` and `messages/en.json` (including `Nav` keys for the menu).
9. shadcn-only: any new UI element comes from the existing `components/ui/*` kit — never introduce a new style or library.
10. Layout hard rules (防溢出): never emit fixed pixel widths (`w-[…]`/`min-w-[…]`/`max-w-[…]` — the only sanctioned constraint is the form card's `max-w-2xl`), never bare multi-column grids (container-query prefix + `grid-cols-1` fallback), grid cells stay `min-w-0`, controls rows `flex-wrap`, tables keep `overflow-x-auto`.
11. Verify at http://localhost:3000/<route> after `npm run dev`, plus the layout self-check: no horizontal scrollbar at any reasonable width.

## Removing a page (the pattern `remove-page` follows)

1. Build the candidate list from `app/(app)/` routes (never `app/(auth)/login`); present it in Chinese with nav-derived titles and 模板自带 flags, ask which page, and get an explicit confirmation of the deletion summary before touching anything.
2. Extract the page's i18n keys first (grep `useTranslations(...)` / `t("...")` in the files to be deleted, plus the nav item's `Nav.*` keys) — they are needed after the files are gone.
3. Delete the route dir `app/(app)/<mount>/<slug>/` (page.tsx, data.json, everything inside). The root dashboard is `app/(app)/page.tsx`: delete it plus its exclusive siblings (e.g. `data.json`), never `layout.tsx`.
4. Delete the page's exclusive components: `components/` files whose only importers were the deleted files (grep first; anything still imported elsewhere survives).
5. Remove the nav sub-item from `components/nav-main.tsx`; drop the whole group (and its now-unused icon import) when its `items` empties.
6. Remove the extracted i18n keys from both `messages/zh.json` and `messages/en.json` — only keys no remaining file still references; keep both in sync.
7. Remove `app/(app)/<mount>/` when it becomes empty (never `app/(app)/` while `layout.tsx` is inside).
8. Verify: both locale files parse as JSON; grep the project for the deleted component names / i18n keys (zero hits outside the deleted files); with the dev server up, the deleted route returns 404 and `/` still returns 200 (unless the dashboard itself was deleted — then `/` 404s by design).

## Conventions

- No environment variables anywhere; keep it that way unless a real backend lands.
- Keep both locale message files in sync on every UI text change.
- Incremental template updates (via `/setup-monitor-adaptation` 增量更新) overwrite template files and **never delete anything** — user-added pages survive; files the template dropped upstream remain in place until manually removed.
- Keep this file updated when the structure above changes.
