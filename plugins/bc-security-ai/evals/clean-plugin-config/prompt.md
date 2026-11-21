---
description: "The reviewer reports no high or medium confidence findings for a team Claude Code plugin with pinned MCP packages, env-referenced tokens, an https remote server and read-only skill and agent."
plugins: ["../..", "../../../bc-security-core"]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Grep, Glob, Skill, Agent]
---

I am about to commit our team Claude Code plugin under plugins/team-tools. Please get it security reviewed and tell me what you find, here in the chat only. For each finding, include its rule ID, CWE, OWASP LLM Top 10 category and confidence. Do not create, change or save any files, and do not run shell commands.
