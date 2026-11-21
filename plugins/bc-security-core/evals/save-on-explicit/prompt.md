---
description: An explicit review of staged changes writes report.md and report.json, and the JSON carries schema_version 1.0.0.
runs: 1
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

/bc-security-core:security-review changes
