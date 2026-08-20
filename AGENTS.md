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

### Remotes — only touch OUR repo

`origin` (YingpingChe-Monitor/monitor-ai-platform) is ours — the only repo to
push to, open PRs in, or modify. `upstream` (Changyi-Li/ui-prototype) is a
read-only reference — fetch for comparison only, never push or open PRs
against it. Always pass `--repo YingpingChe-Monitor/monitor-ai-platform` to
`gh pr` / `gh repo` commands; `gh` may otherwise resolve to `upstream`.
See `docs/agents/branch-strategy.md`.
