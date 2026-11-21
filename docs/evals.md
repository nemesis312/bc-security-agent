# Evals

Behavior tests for the plugins run with `claude plugin eval` (Claude Code 2.1.319 at the time of writing). Every eval run is a real model call on **your own Claude Code login** and counts against your plan's usage, so evals run locally only, never in CI. CI runs the free checks (`npm test`, `node scripts/lint.mjs .`, `claude plugin validate`, schema examples).

Official reference: https://code.claude.com/docs/en/plugin-evals.md

## Running

```sh
scripts/eval.sh bc-security-core                 # one plugin
scripts/eval.sh all                              # every plugin with an evals/ directory
scripts/eval.sh bc-security-core --case read-only
scripts/eval.sh bc-security-core --ablation none # skip the no-plugin baseline arm (half the runs)
```

`scripts/eval.sh` wraps:

```sh
claude plugin eval plugins/<p> --trust-plugin --no-publish --threshold 0.8 \
  --json plugins/<p>/evals/results/latest.json \
  --scaffold --allow-tools Write "Bash(git status *)" "Bash(git diff *)" \
  "Bash(git rev-parse *)" "Bash(git merge-base *)" "Bash(git ls-files *)" "Bash(date *)" "Bash(ls -ld *)" \
  [extra options]
```

For domain plugins the target is the repo root plus `--eval-dir plugins/<p>/evals`, so their cases can also load `bc-security-core` (see [Domain plugin cases](#domain-plugin-cases-two-plugins-loaded)). Any extra option is passed through (for example `--ablation none`, `--runs 3`, `--keep-temp`, `-j 4`). The JSON result lands in `plugins/<p>/evals/results/latest.json` (git-ignored) and the HTML report in `plugins/<p>/evals/results/<timestamp>/report.html`. The script never needs `ANTHROPIC_API_KEY`; it uses whatever login your normal `claude` sessions use.

Each case sets `runs: 1` in its frontmatter to save quota. Use `--runs 3` before trusting a borderline score.

## Case layout

```text
plugins/<plugin>/
├── fixtures/<case>/          # files the case reviews + expected.json (checked by lint)
└── evals/<case>/
    ├── prompt.md             # frontmatter: runs, max_turns, allowed_tools…; body: the prompt
    ├── case.yaml             # schema_version "1.1", name, context.scaffold_script
    ├── scaffold.sh           # copies fixtures/<case>/ into the workspace
    └── graders/*.md          # one grader per file
```

`node scripts/lint.mjs .` requires every `fixtures/<case>/` to have `expected.json` and a matching `evals/<case>/prompt.md`. An eval case without a fixture is allowed.

## How a case gets its fixture working directory

Each run starts in an **empty** temporary workspace, not in the plugin or fixture directory, and the agent cannot read the eval directory. A case gets its files through `context.scaffold_script` in `case.yaml`:

- The harness runs the script **in place** (`$0` is `plugins/<p>/evals/<case>/scaffold.sh`) with the empty workspace as the current directory, so the script copies `"$(dirname "$0")/../../fixtures/<case>"` into `.` and deletes the copied `expected.json` (the agent must not see the expected answer).
- The script runs as you, outside the sandbox, only when `--scaffold` is passed. `scripts/eval.sh` always passes it. Without it, the workspace stays empty.
- The script gets a minimal environment (`PATH`, a temporary `HOME`, `TMPDIR`, `TERM=dumb`) and a 120 s limit; a non-zero exit scores the run 0 with `scaffold failed` and makes no model call.
- A case that needs a git repository creates it in the script (`git init`, a commit, staged changes). Pass identity inline (`git -c user.name=… -c user.email=…@example.invalid -c commit.gpgsign=false commit …`).
- `file_exists` graders only see files **created during the run**, so fixture files never count as output.

`context.add_dirs` was not used: it only accepts directories inside the case directory, and our fixtures live in `fixtures/<case>/`.

### The workspace is inside a commit-less git repository

The workspace is `<tmp>/home/cwd`, and the harness makes `<tmp>/home` a git repository **with no commits**. So inside an eval run `git rev-parse --show-toplevel` succeeds (it returns the temporary home), `git status` lists the harness's own files (`.gitconfig`, `.config/`, `.npm/`), and `git rev-parse --verify HEAD` fails. A truly "non-git" directory cannot be reproduced. The `no-git-repo` case therefore covers the skill's "no usable git history" branch: the skill checks both `git rev-parse --show-toplevel` and `git rev-parse --verify --quiet HEAD` and, if either fails, says so, offers `full` and stops. Cases that need a real repository (`save-on-explicit`) run `git init` in the workspace, which takes precedence over the outer one.

On macOS the git shim may also print `xcrun` cache warnings on stderr inside the sandbox; they are harmless.

## Tool grants

A run only gets the read-only tools the case lists in `allowed_tools` (`Read`, `Grep`, `Glob`, `Skill`, `Agent`, …). `Bash`, `Write` and `Edit` need an operator grant with `--allow-tools`, which applies to **every case in the run**. `scripts/eval.sh` grants the minimum the `security-review` skill needs in the main session:

| Grant | Why |
|---|---|
| `Write` | The skill writes `report.md` and `report.json` (the reviewer cannot). |
| `Bash(git status *)`, `Bash(git diff *)` | `changes` mode scope, and `git diff --name-only` in `branch` mode. |
| `Bash(git rev-parse *)` | Checks for a repository and a `HEAD` commit, and validates the `branch` base. |
| `Bash(git merge-base *)` | `branch` mode. |
| `Bash(git ls-files *)` | `full` mode. |
| `Bash(date *)` | Timestamps for `generated_at` and the report folder. |
| `Bash(ls -ld *)` | Checks that `.security/` and `.security/reports/` are real directories (not symlinks) and whether the report folder already exists. |

`Edit` and `NotebookEdit` are never granted. The reviewer agent never gets any of these: its frontmatter has `tools: Read, Grep, Glob, Skill` and `disallowedTools: Edit, Write, NotebookEdit, Bash`, and the lint enforces it. Granted Bash runs under Claude Code's OS sandbox (writes confined to the workspace, no network).

## What `tool_used` counts

The run's trace (`trace.jsonl`, stream JSON) holds the main session's messages **and** every subagent's messages; subagent messages carry a `parent_tool_use_id`. `tool_used` graders count calls across that whole trace. This was verified on 2026-11-07: a `tool_used: Read` grader matching `plugin.json` passed in `read-only` although only the `security-reviewer` subagent read that file. Likewise, a `regex` with `target: trace` sees the subagent's hand-back, while the default `last_message` sees only the main session's final reply (which may summarize the report and drop details such as CWE IDs).

Consequences:

- `tool_used: Edit/Write/NotebookEdit/Bash` with `max: 0` fails if **either** the main session or the reviewer calls the tool. In `read-only` the user asks for a chat-only review with no files and no shell, so the main session has no legitimate reason to call them, and the graders really test the whole run, reviewer included.
- `--allow-tools` grants apply to every case, so `read-only` still runs with `Write` and the git `Bash` grants available. The case's value comes from the prompt not needing them; do not phrase it in a way that triggers the `security-review` skill (which always writes the report).
- Read-only `Bash` commands (for example `ls`) may run without a grant; they would still be counted by a `tool_used: Bash` grader.

## Core cases (`bc-security-core`)

| Case | What it checks | Graders |
|---|---|---|
| `read-only` | A natural request ("get it security reviewed, chat only, no files, no shell") on a file with an obvious SQL injection. It does not use the skill, so nothing in the run has a reason to write. | `tool_used` Edit/Write/NotebookEdit/Bash `max: 0`, `tool_used` Agent matching `security-reviewer` (delegation happened), `regex` `CWE-89` on the trace (the reviewer's report; the main session's summary may drop CWE IDs) |
| `no-git-repo` | `/bc-security-core:security-review` without usable git history. | `llm`: explains there is no repo/history and offers `full`; `file_exists` `.security/reports/**` with `exists: false`; `tool_used` Agent `max: 0` |
| `general-without-domains` | Only the core plugin is loaded (the harness loads only the plugin under test). | `llm`: the report lists code, secrets, infra and ai as missing with the install hint; `regex` for `/plugin install bc-security-…@bc-security` |
| `save-on-explicit` | `/bc-security-core:security-review changes` on a git fixture with a staged file. | `file_exists` for `report.md` and `report.json`; `tool_used` Write whose input targets `report.json` and contains `"schema_version": "1.0.0"` |

The `tool_used` graders in `read-only` are `arm: with-only`, since the no-plugin baseline cannot delegate to the reviewer.

## Domain plugin cases (two plugins loaded)

A domain plugin has no agent of its own: the core `security-reviewer` discovers its rules skill with the Skill tool. So every domain case loads both plugins with `plugins:` in the `prompt.md` frontmatter (paths relative to the case directory):

```yaml
plugins: ["../..", "../../../bc-security-core"]
```

The harness only loads `plugins:` entries inside its **containment root**: the enclosing plugin when the target is a plugin directory, otherwise the target directory. With `plugins/bc-security-code` as the target, `../../../bc-security-core` is rejected ("outside the containment root"). `scripts/eval.sh` therefore runs domain plugins with the repo root as the target and picks the suite with `--eval-dir plugins/<p>/evals` (results still land in `plugins/<p>/evals/results/`). The core plugin keeps its own directory as the target. Nothing is bundled or preloaded: the second plugin is loaded exactly as an installed dependency would be.

Domain case prompts follow the `read-only` pattern (review in chat, no files, no shell), so the `security-review` skill does not fire and no report is written. Vulnerable cases also ask for each finding's rule ID, CWE, OWASP category and confidence, which keeps the `llm` grader on the short final message.

| Grader | Type | Purpose |
|---|---|---|
| `rule-id` | `regex`, `target: last_message` | The final reply labels a finding with the expected rule ID: a `Rule`/`Rule ID` field (plain, bold, code span or table cell), a Markdown heading, or a findings-table row starting with `F-NNN` (flags `im`). A bare mention such as "BCS-CODE-003: not applicable" does not match |
| `mapping-and-confidence` | `llm` | The final reply reports the issue labeled with the expected rule ID, with a CWE ID, an OWASP Top 10 2021 category and a confidence level |
| `no-confident-findings` (clean cases) | `llm` | No finding with high or medium confidence |

**Do not grade rule IDs with `target: trace`.** Once the rules skill loads, its index table and `references/rules.md` are in the trace as tool results, so every rule ID matches there whether or not it was reported. Grade IDs on `last_message` with the finding-label anchor above.

## Code cases (`bc-security-code`)

| Case | Fixture | Expected rule |
|---|---|---|
| `cross-plugin-discovery` | `sql-injection` (TS) | Gate for spec §6.2: `tool_used: Skill` `min: 1`, and the anchored `regex` for `BCS-CODE-NNN` on the final reply. The prompt asks for rule IDs without naming any skill or ID format; the main session only sees the reviewer's hand-back, so a labeled `BCS-CODE-` ID in its reply shows the reviewer applied the rules |
| `sql-injection` | `src/orders.ts` (TS) | BCS-CODE-001 |
| `jwt-no-verification` | `src/auth.py` (Python) | BCS-CODE-002 |
| `idor-missing-ownership` | `src/invoices.go` (Go) | BCS-CODE-003 |
| `tenant-filter-missing` | `src/InvoiceRepository.cs` (C#) | BCS-CODE-004 |
| `ssrf-user-url` | `src/preview.go` (Go) | BCS-CODE-005 |
| `insecure-deserialization` | `src/session.py` (Python) | BCS-CODE-006 |
| `xss-reflected` | `src/search.ts` (TS) | BCS-CODE-007 |
| `weak-crypto-hardcoded-key` | `src/TokenProtector.cs` (C#) | BCS-CODE-008 |
| `clean-parameterized-query` | `src/orders.ts` (TS) | none (`clean: true`) |

## Secrets cases (`bc-security-secrets`)

| Case | Expected rule |
|---|---|
| `hardcoded-aws-key` | BCS-SEC-001 |
| `env-committed` | BCS-SEC-002 |
| `lockfile-missing` | BCS-SEC-003 |
| `unpinned-versions` | BCS-SEC-004 |
| `typosquat-package` | BCS-SEC-005 |
| `git-url-dependency` | BCS-SEC-006 |
| `install-script-download-exec` | BCS-SEC-007 |
| `clean-pinned-lockfile` | none (`clean: true`) |

## Infra cases (`bc-security-infra`)

| Case | Expected rule |
|---|---|
| `dockerfile-root-user` | BCS-INFRA-001 |
| `dockerfile-latest-base` | BCS-INFRA-002 |
| `dockerfile-secret-env` | BCS-INFRA-003 |
| `dockerfile-curl-pipe-sh` | BCS-INFRA-004 |
| `dockerfile-no-healthcheck` | BCS-INFRA-005 |
| `compose-privileged` | BCS-INFRA-006 |
| `compose-db-public-port` | BCS-INFRA-007 |
| `compose-inline-secret` | BCS-INFRA-008 |
| `gha-permissions-missing` | BCS-INFRA-009 |
| `gha-unpinned-action` | BCS-INFRA-010 |
| `gha-pr-target-checkout` | BCS-INFRA-011 |
| `gha-script-injection` | BCS-INFRA-012 |
| `gha-secret-echo` | BCS-INFRA-013 |
| `clean-hardened-dockerfile`, `clean-workflow` | none (`clean: true`) |

## AI cases (`bc-security-ai`)

| Case | Expected rule |
|---|---|
| `prompt-injection-system-prompt` | BCS-AI-001 |
| `llm-output-eval` | BCS-AI-002 |
| `agent-skip-permissions` | BCS-AI-003 |
| `mcp-unpinned-npx` | BCS-AI-004 |
| `mcp-inline-secret` | BCS-AI-005 |
| `mcp-plain-http` | BCS-AI-006 |
| `skill-html-comment-directive`, `skill-zero-width-instructions` | BCS-AI-007 |
| `hook-curl-pipe-sh`, `hook-env-exfiltration` | BCS-AI-008 |
| `system-prompt-secret` | BCS-AI-009 |
| `reviewer-steering-comment` | BCS-CODE-001 and BCS-AI-007 (loads bc-security-code too) |
| `clean-llm-app`, `clean-plugin-config` | none (`clean: true`) |

## Running domain plugins

- Domain plugins run with the repo root as the target plus `--eval-dir plugins/<p>/evals` (`scripts/eval.sh` does this for you).
- The no-plugin baseline arm is unproven for domain plugins. Always pass `--ablation none`.
- `scripts/eval.sh --case` honours only its last occurrence. To run several cases, run them separately, one `--case` per invocation.

## Results log

| Date | Plugin | Command | Result |
|---|---|---|---|
| 2026-11-07 | bc-security-core | `scripts/eval.sh bc-security-core --ablation none --keep-temp -j 4` | run 1: 4/4 cases ≥ 0.8, overall 0.96; `read-only` 0.83 (`CWE-89` grader on `last_message` failed: the reviewer reported CWE-89 but the main session's summary dropped it) |
| 2026-11-07 | bc-security-core | same | run 2 (CWE-89 grader moved to `target: trace`): 4/4 cases at 1.00, `read-only` 1.00; about 80 s, list-price estimate about $1.08 (subscription quota, no API key) |
| 2026-11-07 | bc-security-core | `scripts/eval.sh bc-security-core --ablation none -j 4` | run 3, after the prompt-injection, Skill-scope, base-validation, symlink and malformed-JSON fixes: 4/4 cases at 1.00; `no-git-repo` llm judge voted PASS PASS FAIL (passes on 2 of 3); about 75 s, list-price estimate about $1.07 |
| 2026-11-07 | bc-security-code | `claude plugin eval . --eval-dir plugins/bc-security-code/evals --ablation none --case cross-plugin-discovery` (before `scripts/eval.sh` learned `--eval-dir`) | gate: 1.00; the reviewer subagent called `Skill` with `bc-security-code:code-rules`, read `references/rules.md` and reported `BCS-CODE-001`; about 80 s, list-price estimate about $0.38 |
| 2026-11-07 | bc-security-code | `scripts/eval.sh bc-security-code --ablation none -j 4` | 10/10 cases at 1.00; every run invoked `bc-security-code:code-rules` from the reviewer; about 230 s, list-price estimate about $3.49 (subscription quota, no API key) |
| 2026-11-07 | bc-security-code | `scripts/eval.sh bc-security-code --ablation none -j 4` | fix round 1 (rule IDs graded on `last_message` with a finding-label anchor, llm graders require the rule ID, SSRF and crypto fixtures made single-weakness): 9/10 cases, overall 0.95. The 8 vulnerable cases and the clean case scored 1.00. `cross-plugin-discovery` scored 0.50: `Skill` passed, but the regex (then without the heading alternative) missed `### Critical: SQL injection — **BCS-CODE-001**`. The heading alternative was added afterwards and checked offline against the stored replies of both runs (all 9 labeled cases match, both clean replies match none); not re-run live. About 213 s, list-price estimate about $3.48 |
| 2026-11-07 | bc-security-code | `scripts/eval.sh bc-security-code --ablation none --case cross-plugin-discovery` | gate, live: run A 0.50 (`code-rule-id` missed ``**Rule ID:** `BCS-CODE-001` ``, an ID in a code span); the Rule-field anchor then allowed a leading backtick or `*`; run B 1.00 (`Skill` called with `bc-security-code:code-rules`, labeled ID matched). About 60 s and $0.30-0.36 per run |
| 2026-11-07 | bc-security-secrets | `scripts/eval.sh bc-security-secrets --ablation none -j 4` | 8/8 cases at 1.00 |
| 2026-11-07 | bc-security-infra | `scripts/eval.sh bc-security-infra --ablation none -j 4` | full run: 13/15 cases passing; after the fix round every fixed case passed |
| 2026-11-07 | bc-security-ai | `scripts/eval.sh bc-security-ai --ablation none -j 4` | 14/14 cases at 1.0 |

The `save-on-explicit` run 1 `report.json` was extracted from the trace and validated with ajv against `schemas/report.schema.json`: valid, and `summary` followed the counting rule (1 critical, 1 to verify).
