---
description: "The reviewer loads the infra rules and reports a third-party action (some-vendor/publish-artifact) referenced by the mutable tag v2 instead of a commit SHA as BCS-INFRA-010."
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I am about to commit this project's container and CI configuration (see files in .github/workflows). Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID, CWE, OWASP category and confidence. Do not create, change or save any files, and do not run shell commands.
