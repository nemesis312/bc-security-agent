---
type: llm
---

PASS if the reply reports a finding about a JWT accepted without signature or expiry verification in src/auth.py and, for that finding, gives the rule ID BCS-CODE-002, a CWE ID (CWE-347, or a closely related authentication CWE such as CWE-287 or CWE-613), an OWASP Top 10 2021 category (A07:2021, or A02:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-CODE-002, or it lacks the CWE ID, the OWASP category or the confidence level.
