---
type: llm
---

PASS if the reply reports a finding about an API key embedded in the system prompt and, for that finding, gives the rule ID BCS-AI-009, a CWE ID (CWE-200 (or CWE-798, CWE-312)), an OWASP LLM Top 10 2025 category (LLM07 (System Prompt Leakage) or LLM02 (Sensitive Information Disclosure), with or without the ":2025" suffix) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-AI-009, or it lacks the CWE ID, the OWASP LLM category or the confidence level.
