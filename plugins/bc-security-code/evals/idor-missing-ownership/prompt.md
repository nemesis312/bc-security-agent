---
description: The reviewer loads the code rules and reports an insecure direct object reference (invoice returned without checking that it belongs to the caller) in src/invoices.go as BCS-CODE-003.
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I just wrote src/invoices.go. Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID, CWE, OWASP category and confidence. Do not create, change or save any files, and do not run shell commands.
