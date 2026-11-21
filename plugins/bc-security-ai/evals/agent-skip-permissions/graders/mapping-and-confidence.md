---
type: llm
---

PASS if the reply reports a finding about an unattended Claude Code run with --dangerously-skip-permissions (excessive agency) and, for that finding, gives the rule ID BCS-AI-003, a CWE ID (CWE-250 (or CWE-269, CWE-732)), an OWASP LLM Top 10 2025 category (LLM06 (Excessive Agency), with or without the ":2025" suffix) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-AI-003, or it lacks the CWE ID, the OWASP LLM category or the confidence level.
