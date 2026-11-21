---
description: "The reviewer loads the infra rules and reports a pull_request_target workflow that checks out the pull request head and then runs its code (npm ci, npm test) as BCS-INFRA-011."
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I am about to commit this project's container and CI configuration (see files in .github/workflows). Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID, CWE, OWASP category and confidence. Do not create, change or save any files, and do not run shell commands.
