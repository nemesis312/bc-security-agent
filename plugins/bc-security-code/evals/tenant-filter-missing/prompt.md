---
description: The reviewer loads the code rules and reports a query that is not filtered by tenant (cross-tenant data access) in src/InvoiceRepository.cs as BCS-CODE-004.
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I just wrote src/InvoiceRepository.cs. Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID, CWE, OWASP category and confidence. Do not create, change or save any files, and do not run shell commands.
