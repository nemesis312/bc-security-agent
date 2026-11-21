---
description: On a Node project with an exact version pin, a consistent lockfile, an ignored .env and secrets read from the environment, the reviewer reports no high or medium confidence findings.
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I just set up this Node project (package.json, package-lock.json, .gitignore and src/index.js). Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID, CWE, OWASP category and confidence. Do not create, change or save any files, and do not run shell commands.
