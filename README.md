# Monitor Adaptation Platform (template)

Runnable template installed by the `setup-monitor-adaptation` agent skill. It mirrors the monitor-ai-platform project: a Next.js web app, a TypeScript API starter, and research docs — kept whole so it can grow (real API, more apps) later.

## Layout

| Path | What it is |
|---|---|
| `apps/web` | Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui — the product UI. Package `monitor-adaptation-web`. |
| `apps/api` | TypeScript starter (`tsx`, `vitest`, `tsc`) — currently a hello-world, not a server yet. Package `ts-template`. |
| `docs/research` | Research notes. |

## Quick start (web)

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 and sign in with `admin` / `123456`.

What you get: a mock-login shell (bilingual zh/en, theme toggle), a dashboard (KPI cards, chart, data table), a card gallery at `/prototype/cards`, an image-preview demo at `/components/image-preview` (lightbox / gallery / zoom implementations), a PDF-preview demo at `/components/pdf-preview` (embed / pdf.js / react-pdf), and a sidebar user menu with **Account** (reset-password dialog) and **Notifications** (unread badge, search, mark-read/delete) — all demo data, no backend.

## Quick start (api)

```bash
cd apps/api
npm install
npm run dev   # prints "Hello, TypeScript!" and exits
```

## Notes

- No environment variables are required anywhere; auth is mocked and all dashboard data is hardcoded.
- `apps/web` declares `engines.node >=20` and ships a `.nvmrc` (Node 20).
- Read `CONTEXT.md` before extending the project — the `add-page` / `remove-page` commands (when installed) rely on it.
