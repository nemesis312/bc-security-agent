# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Do not open a public issue or discussion for a vulnerability.

Include what you found, how to reproduce it, and the affected plugin and version. Expect an acknowledgment from the maintainer; this is a volunteer-run project, so there is no guaranteed response time.

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Scope

In scope: the code, hooks, prompts and configuration shipped in this repository, for example:

- the reviewer agent gaining a tool it should not have (it is meant to be read-only: no Edit, Write, NotebookEdit or Bash);
- a hook that blocks a commit, launches the reviewer without confirmation, or runs unexpected commands;
- prompt injection through reviewed content that makes the reviewer or the `security-review` skill write files, run commands or hide findings;
- path handling in the report-saving step (for example writing outside `.security/reports/`);
- the dev scripts under `scripts/`.

Out of scope:

- vulnerabilities in code that the plugins review, or in Claude Code itself (report those to their owners);
- the intentionally fake credentials and malicious-looking files under `plugins/*/fixtures/`. They are test data and are not real secrets;
- missed detections or false positives. Use the issue forms for those.
