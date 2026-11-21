---
type: llm
---

PASS if the reply reports a finding about a remote MCP server reached over plain http (cleartext transport, bearer token sent unencrypted) and, for that finding, gives the rule ID BCS-AI-006, a CWE ID (CWE-319 (or CWE-523)), an OWASP LLM Top 10 2025 category (LLM03 (Supply Chain), with or without the ":2025" suffix) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-AI-006, or it lacks the CWE ID, the OWASP LLM category or the confidence level.
