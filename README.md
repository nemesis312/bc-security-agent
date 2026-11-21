# bc-security

A Claude Code plugin marketplace for read-only security review: one reviewer agent plus domain plugins with detection rules.

The core plugin ships a single read-only reviewer agent (tools: `Read`, `Grep`, `Glob`, `Skill`; never `Edit`, `Write`, `NotebookEdit` or `Bash`), a versioned report format and optional hooks that are off by default. Domain plugins add detection rules as skills. No external scanners or network tools are used. The reviewer answers in your language, report prose included. It runs on the model of your current session (`model: inherit`); Opus is recommended for full-repo reviews.

## Plugins

| Plugin | What it covers | Rules |
|---|---|---|
| `bc-security-core` | The `security-reviewer` agent, the `/bc-security-core:security-review` skill, the report schema and the opt-in hooks | n/a |
| `bc-security-code` | Application code: injection, broken authentication, access control and IDOR, multitenant filters, SSRF, deserialization, XSS, weak crypto | `BCS-CODE-001` to `008` |
| `bc-security-secrets` | Secrets and supply-chain hygiene: hardcoded credentials, committed `.env` files, lockfiles, version pinning, typosquatting, non-standard sources, install scripts | `BCS-SEC-001` to `007` |
| `bc-security-infra` | Dockerfile, Docker Compose and GitHub Actions workflows (static review only) | `BCS-INFRA-001` to `013` |
| `bc-security-ai` | AI agents and LLM apps: prompt injection, unsafe model output, excessive agency, MCP configuration, hidden instructions in skills and plugins, malicious hooks, secrets in system prompts (OWASP LLM Top 10 2025) | `BCS-AI-001` to `009` |

## Install

Add the marketplace, then install the domain plugins you need:

```text
/plugin marketplace add nemesis312/bc-security-agent
/plugin install bc-security-code@bc-security
```

Each domain plugin depends on `bc-security-core`, so installing a domain plugin installs core automatically. Install `bc-security-core@bc-security` on its own if you only want the reviewer and hooks. Without any domain plugin the reviewer still runs, but its report lists the missing domains as not reviewed and tells you which plugin to install.

## Usage

Run the slash command, or ask Claude for a security review in plain language (the reviewer agent is read-only and answers in chat):

```text
/bc-security-core:security-review [changes|branch [<base>]|full]
```

| Mode | Reviews |
|---|---|
| `changes` (default) | Uncommitted changes: staged, unstaged and untracked files |
| `branch [<base>]` | The current branch against `<base>` (default `main`), from the merge base |
| `full` | Every file in the repository (`git ls-files`) |

`changes` and `branch` need a git repository with at least one commit. Otherwise the skill says so, offers `full` and stops.

The skill computes the scope with read-only git commands, delegates the review to the reviewer agent, and then writes the report itself, because the reviewer cannot write files. Reports go to `.security/reports/<YYYY-MM-DD-HHMM>/` as `report.md` (for people) and `report.json` (validated by `plugins/bc-security-core/schemas/report.schema.json`, schema version `1.0.0`). Add `.security/reports/` to your own `.gitignore` if you do not want to commit them; this plugin never edits it.

### Example report excerpt

An abridged `report.json` (from the schema example `valid-full.json`; paths and findings are fake):

```json
{
  "schema_version": "1.0.0",
  "tool": { "name": "bc-security", "version": "0.1.0" },
  "language": "en",
  "scan": {
    "mode": "branch",
    "base": "main",
    "files_reviewed": ["src/example/app.js", "src/example/chat.js"],
    "domains_used": ["code", "ai", "general"],
    "domains_missing": ["secrets", "infra"]
  },
  "summary": { "critical": 0, "high": 1, "medium": 0, "low": 0, "info": 0, "to_verify": 1 },
  "findings": [
    {
      "id": "F-001",
      "rule_id": "BCS-CODE-001",
      "title": "Query built by string concatenation",
      "domain": "code",
      "severity": "high",
      "cvss": { "version": "3.1", "score": 8.1, "vector": "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N" },
      "confidence": "high",
      "standards": { "owasp_top10": "A03:2021", "cwe": ["CWE-89"], "asvs": "V5.3.4 (L1)" },
      "location": { "file": "src/example/app.js", "line_start": 10, "line_end": 12 },
      "evidence": "The query string is concatenated with a request parameter (example only).",
      "impact": "An attacker could alter the query and read or modify data.",
      "remediation": "Use parameterized queries."
    }
  ]
}
```

Low-confidence findings (like `F-002` in the full example) are listed under "To verify" and counted in `to_verify` instead of in a severity bucket.

## Hooks (opt-in)

Both hooks are off by default and need `jq`; without it they do nothing. They only notify or ask. They never block a commit and never launch the reviewer.

| Hook | Event | What it does |
|---|---|---|
| `hook_sensitive_edits` | `PostToolUse` on `Write\|Edit` | Shows a notice suggesting `/bc-security-core:security-review` after a security-sensitive file is edited (auth, tokens, `.env*`, Docker/Compose, CI workflows, `.mcp.json`, skills/hooks/agents, dependency manifests and lockfiles). |
| `hook_pre_commit` | `PreToolUse` on `Bash` | Asks for confirmation before a `git commit`, suggesting a review of the staged changes first. |

An option is on when the env var `CLAUDE_PLUGIN_OPTION_<KEY>` (for example `CLAUDE_PLUGIN_OPTION_HOOK_PRE_COMMIT`) is `true`, otherwise when the repo file decides, otherwise it is off.

**Per user:** enable the options in the plugin configuration dialog (`/plugin`, or `/config`). Keys: `hook_sensitive_edits`, `hook_pre_commit`, `save_automatic_reports`.

**Per repo (team):** commit `.security/config.json`. This always works, for everyone who installs the plugin:

```json
{ "hooks": { "sensitiveEdits": true, "preCommit": true }, "reports": { "saveAutomatic": false } }
```

**Team enable through `pluginConfigs` in the project `.claude/settings.json`: not supported.** Verified on Claude Code 2.1.319: with `pluginConfigs` for the plugin in a project `.claude/settings.json`, the hook process received an empty `CLAUDE_PLUGIN_OPTION_HOOK_PRE_COMMIT`. The same value passed through `--settings` (a user-level scope) did arrive as `true`, and the settings reference lists `pluginConfigs` as user or managed scope. Use `.security/config.json` for team-wide settings, or managed settings for an organization.

**Known limits.** The `git commit` detection is a heuristic and fails open (no prompt) for: `bash -c "git commit"`, `sudo git commit`, `command git commit`, `/usr/bin/git commit`, backticks or `$(...)` inside quotes, and backslash line continuations. The hooks are a convenience, not an enforcement point.

## Team config: `.security/config.json`

A repository can commit `.security/config.json` to set defaults for everyone who installs the plugin. All keys default to `false`:

```json
{ "hooks": { "sensitiveEdits": false, "preCommit": false }, "reports": { "saveAutomatic": false } }
```

See [Hooks (opt-in)](#hooks-opt-in) for how it combines with per-user options.

## No CVE detection

bc-security reads code and configuration statically. It has no vulnerability database and no network access, so it never claims that a dependency version has a known CVE. `bc-security-secrets` reports supply-chain hygiene only (missing lockfiles, unpinned versions, typosquat-looking names, non-standard sources, install scripts). Use your package manager's audit command, Dependabot or a dedicated scanner for CVE matching.

## Fixtures contain fake secrets

The `fixtures/` directories of the plugins hold deliberately vulnerable code and configuration used by the evals. The secrets and ai plugins in particular contain **intentionally fake credentials** and files that look malicious on purpose (hook and MCP configs pointing at reserved `*.example` hosts, hidden-instruction skills, invisible Unicode). Local secret scanners, antivirus tools and GitHub push protection may flag them; none of them are real and nothing in them is executed or installed. The fixtures under `plugins/*/fixtures` also include intentionally vulnerable or typosquatted package manifests, so GitHub's dependency graph and Dependabot may raise alerts on them; maintainers dismiss those as "intentional test fixture", and they do not affect plugin users. See `plugins/bc-security-secrets/README.md` and `plugins/bc-security-ai/README.md`.

## Zero-cost CI

CI runs five free, deterministic jobs (`lint-and-test`, `validate-plugins` with `claude plugin validate`, `schema`, `dco` and `pr-title`) and never calls a model. The evals (`claude plugin eval`) are run locally by maintainers on their own Claude subscription; see [docs/evals.md](docs/evals.md). No API keys or paid services are involved.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md).

## License

MIT
