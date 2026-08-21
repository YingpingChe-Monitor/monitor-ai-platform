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

### PowerShell encoding — never touch UTF-8 text with PS 5.1 text cmdlets

The shell here is **PowerShell 5.1** (not pwsh 7): `Get-Content`/`Set-Content`
default to the system ANSI code page (GBK/936), so reading or writing UTF-8
files with Chinese/emoji silently corrupts them (mojibake: `鐢ㄦ埛`). This
broke GitHub issue bodies published via `gh issue edit --body-file` in the
past — the corruption was irreversible (bytes lost).

Rules:

- Read/write text files (markdown, JSON, scripts) only via the `read`/`write`/
  `edit` tools, or via Python with explicit `encoding="utf-8"`. Never pass
  UTF-8 file contents through PS 5.1 `Get-Content` / `Set-Content` /
  `Out-File -Encoding utf8` (it also adds a BOM and trailing newline).
- When a command must emit file content to `gh` or `git` (e.g. issue bodies,
  commit messages with CJK), generate the file with the `write` tool or
  Python, then reference it by path.
- Console display of CJK may look garbled in `pwsh` output even when the
  underlying data is correct — verify with `read` on a written file, not by
  eyeballing terminal output.
- PowerShell text transformations (`-replace`, `.Replace()`) on files that
  contain CJK are only safe when the string came from an explicit UTF-8 read
  (`[System.IO.File]::ReadAllText(path, UTF8)`); prefer avoiding them
  entirely for CJK content.
