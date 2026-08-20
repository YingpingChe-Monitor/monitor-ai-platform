# `npx skills add` from a private GitHub repo — research notes

Date: 2026-08-19. Context: `YingpingChe-Monitor/monitor-adaptation-web` (agent skills under `skills/<name>/SKILL.md`, e.g. `setup-monitor-adaptation`) was recently switched public → private. Question: can its skills still be installed with `npx skills add <owner>/<repo> --skill <name>`? Findings are from the CLI's source code (primary) plus live tests on this machine (owner account, `gh` CLI authenticated as `YingpingChe-Monitor` with `repo` scope, Git Credential Manager as credential helper).

## Question restated

If a GitHub repo is set to **private**, can its agent skills still be installed via the skills CLI (`npx -y skills add <owner>/<repo> --skill <name>`)? For (a) the repo owner with `gh` auth, (b) collaborators with access, (c) anonymous/unauthenticated users — and what authentication does the CLI actually use?

## Verdict (short)

**Yes — private repos work with `npx skills add`, as long as the installing machine can authenticate to GitHub.** The CLI does a plain **`git clone --depth 1 https://github.com/<owner>/<repo>.git`** through the system `git`; it never injects its own credentials. Auth therefore comes from whatever the machine already has: the git credential helper (e.g. Git Credential Manager), the `gh` CLI (fallback `gh repo clone`), or an SSH key (last fallback). Concretely, verified on this machine:

- **(a) Owner with `gh` auth + git credentials: works** — `npx -y skills add YingpingChe-Monitor/monitor-adaptation-web --skill setup-monitor-adaptation -y` installed the skill successfully (exit 0). Plain `git clone` of the private repo also succeeded with stored credentials.
- **(b) Collaborators with access: works the same way** — any GitHub user with read access whose machine has git credentials / `gh` auth / SSH for that repo can install. (Not directly testable here without a second account, but the mechanism is identical — the CLI does not care who the account is, only that the clone succeeds.)
- **(c) Anonymous/unauthenticated: fails** — `git clone` errors with `fatal: unable to get password from user` (exit 128); the CLI prints `Failed to clone repository … Installation failed` and exits 1.
- **Auth mechanism**: no `--token` flag exists in v1.5.23. `GITHUB_TOKEN`/`GH_TOKEN` env vars are read **only** for GitHub-API tree lookups (lock hashes, updates) — **not** for the git clone of a non-allow-listed repo. A bare PAT in env does not authenticate the clone; the token must be usable by git (credential helper / URL) or via `gh`.

Caveat: private-repo support has a long tail of open bugs (updates/folder-hash, URL auth-prefix stripping, telemetry) — see [Open issues](#open-issues-and-prs).

## Evidence — source (skills CLI v1.5.23)

### Package identity

- npm package **`skills`** (not `@skills/cli` / `@vercel/skills`, both 404 on the registry), latest **1.5.23**, published 2026-08-18; bin `skills` → `bin/cli.mjs`; repo `git+https://github.com/vercel-labs/skills.git`; engines `node >=22.20.0`; runtime deps only `tar` + `yaml` (no octokit).
  Sources: https://www.npmjs.com/package/skills, `npm view skills --json`, https://registry.npmjs.org/skills/-/skills-1.5.23.tgz, https://github.com/vercel-labs/skills
- Provenance of the source read for this report: `git clone` of vercel-labs/skills was blocked on this network, so the tree was taken from `https://codeload.github.com/vercel-labs/skills/tar.gz/refs/heads/main`; verified byte-exact for v1.5.23 (main HEAD `435076e78988e1e6ec40d00b0b1d76bdbbc5419a` == npm `gitHead`; published README hashes identically). All quotes below are from `src/*.ts` at that commit; permalinks use `blob/435076e.../src/<file>`.

### How `add` fetches the repo: git clone over HTTPS

- Shorthand `owner/repo` is normalized to an HTTPS **git** URL — the GitHub REST API is *not* the fetch path for a normal `skills add`:
  - `src/source-parser.ts:453-463` (https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/source-parser.ts): `url: `https://${githubHost}/${owner}/${repo}.git``
- The clone is a shallow `git clone --depth 1` via the system `git` (simple-git):
  - `src/git.ts:241` — `const cloneOptions = ref ? ['--depth', '1', '--branch', ref] : ['--depth', '1'];`
  - `src/git.ts:245` — `await createGitClient().clone(url, tempDir, cloneOptions);` into a fresh `mkdtemp(join(tmpdir(), 'skills-'))` (src/git.ts:240) — matches the observed `Cloning into 'C:\Users\...\AppData\Local\Temp\skills-<rand>'` output.
  - `src/git.ts:104-170` (`createGitClient`): sets `GIT_TERMINAL_PROMPT: '0'` (non-interactive), `allowUnsafeCredentialHelper: true` (src/git.ts:141) — i.e. the user's **normal git credential configuration is used as-is; the CLI injects no token**.
- On auth-looking clone failure, fallbacks in order: `gh repo clone` then SSH — `src/git.ts:268-288`; `tryGhClone` runs `gh auth status -h <host>` then `gh repo clone <slug> <tmp> -- --depth=1` (src/git.ts:177-204); SSH fallback `ssh -o BatchMode=yes` (src/git.ts:280-284).
- A GitHub-API "blob" fast-path exists **only** for allow-listed owners `vercel`, `vercel-labs`, `heygen-com` and repo `zapier/connectors` (`src/add.ts:1182-1203`, `src/blob.ts:51-56`). `YingpingChe-Monitor` is not allow-listed, so `add` always clones.

### Auth mechanism

- **No `--token` / `-t` flag** in v1.5.23 (`parseAddOptions`, `src/add.ts:2157-2229`). A `--token` flag exists only in unmerged PR https://github.com/vercel-labs/skills/pull/498.
- The only token source is env vars (`src/skill-lock.ts:139-148`):
  ```ts
  export function getGitHubToken(): string | null {
    if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
    if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
    return null;
  }
  ```
  Used as `Authorization: Bearer <token>` only for GitHub-API tree lookups (`src/blob.ts:124-126`), with `gh api` as fallback (`src/blob.ts:172-207`). The CLI deliberately never runs `gh auth token` and never copies gh's stored credential into the process (README.md:66; grep of `src/` finds no call).
- Clone auth = git credential helper → `gh repo clone` → SSH (see above). Empirical confirmation on this machine: the private-repo clone succeeded via the machine's stored credentials, and CLI installs also succeeded whenever the machine's credentials/`gh` auth were available.

### Documented private-repo statements (README + issues)

- README "### Private Repositories" (https://github.com/vercel-labs/skills#readme, lines 50-70): *"Use the same command for public and private repositories. The CLI uses the authentication already configured for the repository URL"* (README.md:52); chain documented as Git credential helper → `gh repo clone` → SSH (README.md:66); *"`GITHUB_TOKEN` or `GH_TOKEN` can be set explicitly for GitHub API access, including private repository downloads and update checks. They are optional for installs when Git, GitHub CLI, or SSH authentication is already configured."* (README.md:70).
- Source comment `src/blob.ts:145-152`: *"A private repo answers 401/404 to an anonymous request (GitHub hides its existence); a token may turn that into a 200. See issue #1318."*
- `skills.sh` (https://skills.sh → https://www.skills.sh/) is the client-rendered "Agent Skills Directory"; its only install text is the hero snippet `npx skills add <owner/repo>` — no auth/private guidance there. README is canonical.

### Failure behavior (message + exit code)

- `src/add.ts:2052-2067` — on clone failure: prints `Failed to clone repository`, then the error lines, then `Installation failed`, then `process.exit(1)`.
- Auth-failure message (`src/git.ts:206-233`):
  ```
  Authentication failed for <url>.
    - For private repos, ensure you have access
    - Retry with SSH: npx skills add git@github.com:<owner>/<repo>.git
    - Check access with: gh auth status -h github.com or ssh -T git@github.com
  ```
  Note `"Repository not found"` is classified as an **auth** failure (`src/git.ts:98`), so a private repo cloned anonymously (or a nonexistent repo) yields the same auth message, exit 1.
- Generic failure: `Failed to clone <url>: <detail>` (`src/git.ts:297`); 5-min timeout, overridable via `SKILLS_CLONE_TIMEOUT_MS` (`src/git.ts:255-265`).

### Open issues and PRs

Open bugs on private-repo support (via `gh api search/issues`): [#12](https://github.com/vercel-labs/skills/issues/12), [#162](https://github.com/vercel-labs/skills/issues/162), [#381](https://github.com/vercel-labs/skills/issues/381), [#436](https://github.com/vercel-labs/skills/issues/436), [#474](https://github.com/vercel-labs/skills/issues/474), [#699](https://github.com/vercel-labs/skills/issues/699), [#1031](https://github.com/vercel-labs/skills/issues/1031), [#1246](https://github.com/vercel-labs/skills/issues/1246), [#1302](https://github.com/vercel-labs/skills/issues/1302), [#1441](https://github.com/vercel-labs/skills/issues/1441), [#1574](https://github.com/vercel-labs/skills/issues/1574), [#1593](https://github.com/vercel-labs/skills/issues/1593), [#1817](https://github.com/vercel-labs/skills/issues/1817). Unmerged PRs: [\#498](https://github.com/vercel-labs/skills/pull/498) (`--token` flag), [\#1624](https://github.com/vercel-labs/skills/pull/1624) (auth clone via `GITHUB_TOKEN`/`GH_TOKEN`), [\#1039](https://github.com/vercel-labs/skills/pull/1039) (auth raw.githubusercontent.com in blob path). Notably #1246 reports `parseSource` strips `x-access-token:<TOKEN>@` prefixes from HTTPS URLs, breaking URL-embedded-token clones.

## Evidence — empirical on this machine (2026-08-19)

Environment: git 2.55.0.windows.4; `gh` authenticated as `YingpingChe-Monitor`, token scopes `gist, read:org, repo, workflow` (repo scope present); git global credential helper = `manager` (Git Credential Manager). Repo confirmed private: `gh repo view ... --json name,visibility` → `{"name":"monitor-adaptation-web","visibility":"PRIVATE"}`. No `-g` installs, no git/gh config changes (env-scoped overrides only).

### Test A — owner, authenticated: SUCCESS

In a scratch dir: `npx -y skills add YingpingChe-Monitor/monitor-adaptation-web --skill setup-monitor-adaptation -y`:

```
◇  Installed 1 skill
✓ .\.agents\skills\setup-monitor-adaptation
  universal: Cursor, GitHub Copilot, Amp, Antigravity, Antigravity CLI +12 more
  symlinked: Claude Code
Done!  Review skills before use; they run with full agent permissions.
EXIT=0
```

Installed artifact verified: `.agents/skills/setup-monitor-adaptation/SKILL.md` present with the repo's frontmatter (`name: setup-monitor-adaptation`, `disable-model-invocation: true`); `.claude/` symlink dir created; project-root `skills-lock.json` written:

```json
{
  "version": 1,
  "skills": {
    "setup-monitor-adaptation": {
      "source": "YingpingChe-Monitor/monitor-adaptation-web",
      "sourceType": "github",
      "skillPath": "skills/setup-monitor-adaptation/SKILL.md",
      "computedHash": "c9bc8def3de511c0d6fc63df9fdb09822dbf02491ce563e1b523b40f4c51d3e8"
    }
  }
}
```

### Network flakiness (noted per instructions)

The first two CLI attempts and several plain `git clone`s failed with `fatal: unable to access 'https://github.com/<repo>.git/': Recv failure: Connection was reset` — a transient network reset on `github.com`'s git endpoint, **not** an auth failure (a public repo `git ls-remote https://github.com/vercel-labs/skills.git` failed identically; `api.github.com` and `codeload.github.com` stayed reachable). Plain `git clone` of the private repo then succeeded on the next attempt, and Test A succeeded on its next attempt — i.e. the resets were the cause of the initial failures, and retries beat them.

### Test B — unauthenticated simulation

- `git clone https://github.com/YingpingChe-Monitor/monitor-adaptation-web.git` with `GIT_TERMINAL_PROMPT=0` and credential helper disabled (`-c credential.helper= -c credential.interactive=false`): **`fatal: unable to get password from user`**, git exit 128 (server demanded auth; no credentials available).
- Anonymous GitHub API on the private repo: `GET https://api.github.com/repos/YingpingChe-Monitor/monitor-adaptation-web` (no token) → **404** (GitHub hides private repos from anonymous API — matches `src/blob.ts:145-152`).
- Authenticated control: `gh api`/`curl` tarball of the private repo with the gh token → **200 OK**, 202,487-byte gzip (`1F 8B`) — the same credentials the clone uses do grant access.
- CLI-level unauthenticated run: same `npx skills add ...` under `GIT_TERMINAL_PROMPT=0` with the git credential helper neutralized (`[credential] helper =` in an isolated global config via `GIT_CONFIG_GLOBAL`), `gh` isolated (`GH_CONFIG_DIR` → empty dir → "You are not logged into any GitHub hosts"), and SSH forced to fail (`GIT_SSH_COMMAND` → nonexistent key). Output — byte-for-byte the message documented in `src/git.ts:206-233`:
  ```
  ■  Failed to clone repository
  │  Authentication failed for https://github.com/YingpingChe-Monitor/monitor-adaptation-web.git.
  │    - For private repos, ensure you have access
  │    - Retry with SSH: npx skills add git@github.com:YingpingChe-Monitor/monitor-adaptation-web.git
  │    - Check access with: gh auth status -h github.com or ssh -T git@github.com
  └  Installation failed
  EXIT=1   (installed=False)
  ```
  This exercises the full fallback chain in order (git creds → `gh repo clone` → SSH) exactly as coded.
- Note: CLI attempts where only `GITHUB_TOKEN`/`GH_TOKEN` were removed (git helper still active) still **succeeded** — the machine's stored Git Credential Manager credential authenticated the clone. This is the mechanism-(a) case, not the gh fallback. True anonymity requires all three auth paths (git creds, gh, SSH) absent, as in the run above.

## Practical guidance

- **Owner / current machine**: nothing to do — `npx skills add YingpingChe-Monitor/monitor-adaptation-web --skill setup-monitor-adaptation -y` works as-is with existing gh auth + git credentials.
- **Collaborators**: need (1) GitHub access to the repo (collaborator/team with read), and (2) one of, on their machine: a git credential helper storing a token (e.g. `gh auth login` then `gh auth setup-git`, or GCM with a PAT), an authenticated `gh` CLI (fallback `gh repo clone`), or an SSH key registered on GitHub. Then the same command works.
- **Is a PAT needed?** Not for installs when git/gh/SSH auth exists. A bare `GITHUB_TOKEN`/`GH_TOKEN` env var does **not** authenticate the clone in v1.5.23 for non-allow-listed repos (token is only attached to API tree lookups; PR #1624 to change this is unmerged). To use a PAT for the clone, configure git to present it (credential helper, or URL credentials — though issue #1246 warns `parseSource` strips `x-access-token:` prefixes from URLs). No `--token` flag exists (PR #498 unmerged).
- **SSH**: `npx skills add git@github.com:YingpingChe-Monitor/monitor-adaptation-web.git --skill setup-monitor-adaptation` is a supported alternative (SSH URLs are preserved in `skills-lock.json`; src/add.ts:80-98).
- **Updates** (`skills update`) hit the GitHub trees API for lock-hash lookups — for private repos set `GITHUB_TOKEN`/`GH_TOKEN` or rely on the `gh api` fallback; open bugs #162/#436/#1441/#1574 make updates the flakiest part of private-repo support.
- **Manual fallback**: the skills are plain files under `skills/<name>/SKILL.md` — copy them from any clone the user can access into the target project's `.agents/skills/` (or equivalent) if the CLI path is not available.
- **Telemetry**: private repos are excluded from telemetry/audit by design (`isRepoPrivate` check), though issues #699/#1593/#1817 allege leaks; `DISABLE_TELEMETRY=1` disables it.

## Cleanup note

All scratch artifacts lived under `D:\Src\monitor-skills\monitor-adaptation-web\.scratch\research-private\` (test dirs, the skills source tree `skills-src/`, intermediate notes `part1-findings.md`, tarball captures, and a cloned copy of the private repo) and were **removed** after the tests; nothing was installed globally and no git/gh config was modified (only env-scoped overrides inside the scratch command runs, plus the npx package cache). The only persisted output is this file.

## Key sources

- CLI repo: https://github.com/vercel-labs/skills ; npm: https://www.npmjs.com/package/skills ; tarball: https://registry.npmjs.org/skills/-/skills-1.5.23.tgz
- README (Private Repositories section): https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/README.md
- Source (commit 435076e, == v1.5.23): [src/add.ts](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/add.ts) · [src/git.ts](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/git.ts) · [src/blob.ts](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/blob.ts) · [src/source-parser.ts](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/source-parser.ts) · [src/skill-lock.ts](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/skill-lock.ts)
- Docs site: https://skills.sh (no auth guidance; README canonical)
- Issues/PRs: listed in [Open issues and PRs](#open-issues-and-prs)
- GitHub API reference for private-repo 404 behavior: https://docs.github.com/en/rest/repos/repos (private repos return 404 to unauthenticated callers)
