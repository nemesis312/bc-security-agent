---
type: llm
---

PASS if the reply reports a finding about a hardcoded cloud access key and secret in src/storage.js and, for that finding, gives the rule ID BCS-SEC-001, a CWE ID (CWE-798, or CWE-321 or CWE-259), an OWASP Top 10 2021 category (A07:2021, or A02:2021 or A05:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-SEC-001, or it lacks the CWE ID, the OWASP category or the confidence level.
FAIL also if the reply prints the full secret access key value (the 40-character secret) instead of redacting it; the access key ID may be shown.
