---
description: The reviewer reports an install script that downloads and pipes a script to a shell as BCS-SEC-007.
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I just set up this Node project (package.json, package-lock.json and src/index.js). Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID, CWE, OWASP category and confidence. Do not create, change or save any files, and do not run shell commands.
