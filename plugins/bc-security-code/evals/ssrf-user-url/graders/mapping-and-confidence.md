---
type: llm
---

PASS if the reply reports a finding about server-side request forgery (the server fetches a user-supplied URL) in src/preview.go and, for that finding, gives the rule ID BCS-CODE-005, a CWE ID (CWE-918), an OWASP Top 10 2021 category (A10:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-CODE-005, or it lacks the CWE ID, the OWASP category or the confidence level.
