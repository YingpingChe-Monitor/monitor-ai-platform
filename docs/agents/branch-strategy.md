# Branch strategy: `main` + `template`

## Overview

Two long-lived branches:

- **`main`** — active development. All content pages, business pages, and
  template changes land here first.
- **`template`** — the reusable template baseline. Contains only template
  capabilities; content pages never go here.

`template` was created from `main` at commit `91d22f4` (login page, bilingual
shell, user menu with reset-password + notifications, sidebar active state,
theme/i18n infrastructure).

## What belongs where

| Kind of change | Branch |
|---|---|
| Content pages (dashboard data, business pages, page-specific screens) | `main` only |
| Template capabilities (login, app shell, sidebar, i18n, ui components, hooks, theme, layout, auth) | `main` first, then synced to `template` |
| Docs about template mechanics | `main` (sync if they document the template itself) |

## Syncing template changes to `template`

Template work happens on `main` like everything else; after it lands, sync
the specific commits to `template`:

```bash
git checkout template
git cherry-pick <template-commit>
git push origin template
git checkout main
```

Use `git cherry-pick` (not `git merge main`) so content-page commits stay
off `template`. If a template change spans multiple commits, cherry-pick
them in order. Resolve conflicts on `template` in favor of the template
state.

## Rules

- Never commit content-page work directly on `template`.
- Never merge `main` wholesale into `template` (it would drag content pages
  along).
- A change that touches both template code and content pages: split into two
  commits on `main`, then cherry-pick only the template commit.
- If unsure whether a change is "template" or "content", ask the human.
