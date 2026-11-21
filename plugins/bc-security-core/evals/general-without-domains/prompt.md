---
description: With only the core plugin installed, the report lists every domain as missing and gives the install hint.
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

Have the security reviewer look at src/files.js and show me its full report, including the scope section. Chat only, no files.
