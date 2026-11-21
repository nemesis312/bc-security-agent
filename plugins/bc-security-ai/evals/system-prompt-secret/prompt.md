---
description: "The reviewer loads the AI rules and reports an API key embedded in a system prompt as BCS-AI-009."
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I just wrote app/billing_assistant.py. Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID, CWE, OWASP LLM Top 10 category and confidence. Do not create, change or save any files, and do not run shell commands.
