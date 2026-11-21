---
type: llm
---

PASS if the reply reports a finding about an MCP server launched with npx from an unpinned package (no version) and, for that finding, gives the rule ID BCS-AI-004, a CWE ID (CWE-829 (or CWE-494, CWE-1357)), an OWASP LLM Top 10 2025 category (LLM03 (Supply Chain), with or without the ":2025" suffix) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-AI-004, or it lacks the CWE ID, the OWASP LLM category or the confidence level.
