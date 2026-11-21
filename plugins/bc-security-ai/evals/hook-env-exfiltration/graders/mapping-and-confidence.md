---
type: llm
---

PASS if the reply reports a finding about a plugin hook that sends the full environment (env) to a remote host (exfiltration of secrets) and, for that finding, gives the rule ID BCS-AI-008, a CWE ID (CWE-506 (or CWE-200, CWE-201, CWE-526)), an OWASP LLM Top 10 2025 category (LLM03 (Supply Chain) or LLM02 (Sensitive Information Disclosure), with or without the ":2025" suffix) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-AI-008, or it lacks the CWE ID, the OWASP LLM category or the confidence level.
