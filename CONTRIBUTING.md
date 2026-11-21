# Contributing

Thanks for helping. This repository is a Claude Code plugin marketplace (`bc-security`) with a read-only reviewer in `bc-security-core` and rule plugins for `code`, `secrets`, `infra` and `ai`. All content (prompts, docs, names) is in English.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities as described in [SECURITY.md](SECURITY.md), not in public issues.

## Ground rules

- **Zero cost.** Nothing in CI or in the checks below calls a model or needs a paid service.
- **The reviewer is read-only.** It never gets `Edit`, `Write`, `NotebookEdit` or `Bash`. The linter enforces this.
- **No external scanners and no network tools** in any agent or skill.
- **No CVE claims.** `bc-security-secrets` reports supply-chain hygiene only and never says a dependency version has a CVE.
- **Hooks stay opt-in.** No hook launches the reviewer without confirmation, and none denies a commit.

## Commits and pull requests

- Sign off every commit (Developer Certificate of Origin): `git commit -s`.
- Use conventional commits, for example `feat(code): add rule BCS-CODE-009`, `fix(core): ...`, `docs: ...`, `test: ...`. The PR title follows the same format.
- Keep a PR focused on one change.

## Free checks to run locally

Run these from the repo root:

```sh
npm test
node scripts/lint.mjs .
scripts/validate-schema.sh
claude plugin validate .
```

- `npm test` runs `node --test tests/*.test.mjs`.
- `node scripts/lint.mjs .` is the dependency-free linter for manifests, agents, skills, rules and fixtures.
- `scripts/validate-schema.sh` checks the report schema examples (`valid-*` must pass, `invalid-*` must fail). It uses `npx`, so it needs network access.
- `claude plugin validate .` is Claude Code's own marketplace validation. Run `claude plugin validate plugins/<name>` for each plugin. It needs no login.
- `scripts/check-dco.sh <base_sha> <head_sha>` lists commits in a range that lack a `Signed-off-by:` trailer.

CI (`.github/workflows/ci.yml`, `ubuntu-latest` only, no secrets) runs five jobs: `lint-and-test`, `validate-plugins`, `schema`, `dco` and `pr-title`. They are free and deterministic, and CI never calls a model. `dco` and `pr-title` run on pull requests only. The Claude Code CLI used by `validate-plugins` is pinned to an exact version in `ci.yml`; bump it deliberately. `node scripts/lint.mjs .` does not support YAML block scalars, so an agent or skill `description` must be a single-line value.

## Adding a rule

Rules live in a domain plugin: `plugins/bc-security-<domain>/skills/<skill>/references/rules.md`.

1. **ID.** Use `BCS-<DOMAIN>-<NNN>` with `DOMAIN` one of `CODE`, `SEC`, `INFRA`, `AI` and three digits, continuing the plugin's numbering (for example `BCS-INFRA-014`).
2. **References entry.** Add a `### BCS-... <title>` heading to `references/rules.md` with: what to look for, Grep hints, standards mapping (`OWASP`, `CWE`, `ASVS` or `OWASP-LLM`), a default CVSS 3.1 vector, and false-positive notes. Copy the shape of an existing entry, and add the rule to the table in the skill's `SKILL.md`.
3. **Vulnerable fixture.** Create `plugins/<plugin>/fixtures/<case>/` with the vulnerable files and an `expected.json`: `{ "rule_ids": ["BCS-CODE-001"], "clean": false }`.
4. **Clean fixture.** Add a clean counterpart (`{ "rule_ids": [], "clean": true }`) when the rule has a likely false positive, so the eval can check that it stays quiet.
5. **Eval case.** Add `plugins/<plugin>/evals/<case>/` (`prompt.md`, `case.yaml`, `scaffold.sh`, `graders/`) with the same `<case>` name. Copy an existing case from the same plugin. Mechanics are in [docs/evals.md](docs/evals.md).
6. Run the free checks. The linter fails if a rule is not referenced by any `fixtures/*/expected.json`, if a fixture has no `expected.json` or no matching `evals/<case>/prompt.md`, or if an ID is malformed.

### Fake credentials in fixtures

Fixtures that contain credentials must use **intentionally fake** values: vendor-documented examples or obviously synthetic strings, plus the comment `bc-security fixture: intentionally fake credential`. Use reserved example domains (`*.example`) so no fixture can reach a real host. Never commit a real secret or anything real-looking from your own environment. Secret scanners will flag the fixtures; that is expected.

## Evals are run by maintainers

`claude plugin eval` makes real model calls on the runner's own Claude Code login and counts against their subscription usage, so **CI never runs evals** and contributors do not have to. A maintainer runs them locally before merging a change that touches rules, prompts or agents, with `scripts/eval.sh <plugin>` (see [docs/evals.md](docs/evals.md) for the options and the results log).

Eval mechanics worth knowing before you write a case, all documented in `docs/evals.md`:

- Each run starts in an **empty** temporary workspace, not in the plugin or fixture directory. A case gets its files from `context.scaffold_script`, which copies `fixtures/<case>/` into the workspace and removes `expected.json`. Scaffold scripts only run with `--scaffold`, which `scripts/eval.sh` always passes.
- `--ablation none` skips the no-plugin baseline arm and halves the runs.
- `--case` honours only its **last** occurrence on the command line.
- Domain plugin cases load two plugins (the domain plugin and `bc-security-core`), so `scripts/eval.sh` runs them from the repo root with `--eval-dir`.
- Grade rule IDs on the final reply, not on the trace (the rules skill's own text is in the trace).

## Questions

Use GitHub Discussions for questions and ideas, and the issue forms for bugs, false positives, rule proposals and feature requests.
