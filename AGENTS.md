## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in this repo, operated via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles mapped to default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Branch strategy

`main` is active development (content + template changes); `template` holds
only the reusable template baseline, synced via cherry-pick. See
`docs/agents/branch-strategy.md`.
