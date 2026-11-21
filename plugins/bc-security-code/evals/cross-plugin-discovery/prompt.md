---
description: Gate. With core and code loaded, the core reviewer discovers the bc-security-code rules skill through the Skill tool and cites BCS-CODE rule IDs.
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I just wrote src/orders.ts. Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID. Do not create, change or save any files, and do not run shell commands.
