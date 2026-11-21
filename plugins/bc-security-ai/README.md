# bc-security-ai

AI agent and LLM application security rules (`BCS-AI-001` to `BCS-AI-009`) for the bc-security reviewer, mapped to the OWASP LLM Top 10 2025 and CWE: prompt injection into system prompts, unsafe handling of model output, excessive agency, MCP server configuration (unpinned packages, inline secrets, plain http), hidden or steering instructions in skills, agents, plugins and code, malicious hooks, and secrets in system prompts. Static review only; it never calls a model, starts an MCP server or runs a hook.

## About the fixtures

The fixtures under `fixtures/` are static files and some look malicious on purpose:

- Credentials and tokens are **intentionally fake**. Hostnames use reserved example domains only (`*.example`, `*.example.com`, `attacker.example`), so no hook or MCP fixture can reach a real host. Package names such as `@example-org/mcp-tickets` do not exist.
- Plugin fixtures live under `plugins/team-tools/` inside each fixture directory (a vendored plugin, not installed), so an eval session never loads their hooks, skills or MCP servers.
- `skill-zero-width-instructions` contains real invisible Unicode: the hidden sentence is encoded as Unicode tag characters (U+E0020-U+E007E) wrapped in zero-width markers (U+200B, U+200D, U+2060). It was written with a Python script using explicit `\u` escapes; check it with `rg -c '[\x{E0000}-\x{E007F}]'` or `python3 -c "print([hex(ord(c)) for c in open(p).read() if ord(c) > 0x2000])"`. Editors may hide or strip these characters, so do not re-save that file by hand.
- `reviewer-steering-comment` holds a SQL injection plus a comment that tells AI reviewers to report zero findings; its eval loads bc-security-code as well.

## Install

```text
/plugin marketplace add nemesis312/bc-security-agent
/plugin install bc-security-ai@bc-security
```

It depends on `bc-security-core`, which is installed with it.
