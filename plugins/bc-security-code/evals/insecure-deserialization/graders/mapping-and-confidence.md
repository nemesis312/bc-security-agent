---
type: llm
---

PASS if the reply reports a finding about insecure deserialization of untrusted data (pickle on a cookie) in src/session.py and, for that finding, gives the rule ID BCS-CODE-006, a CWE ID (CWE-502), an OWASP Top 10 2021 category (A08:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-CODE-006, or it lacks the CWE ID, the OWASP category or the confidence level.
