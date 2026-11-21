---
type: llm
---

PASS if the reply reports a finding about a secret token written inline in the MCP server configuration (.mcp.json env) and, for that finding, gives the rule ID BCS-AI-005, a CWE ID (CWE-798 (or CWE-312, CWE-522)), an OWASP LLM Top 10 2025 category (LLM03 (Supply Chain) or LLM02 (Sensitive Information Disclosure), with or without the ":2025" suffix) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-AI-005, or it lacks the CWE ID, the OWASP LLM category or the confidence level.
