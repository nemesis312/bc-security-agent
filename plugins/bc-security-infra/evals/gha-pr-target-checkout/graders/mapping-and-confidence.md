---
type: llm
---

PASS if the reply reports a finding about a pull_request_target workflow that checks out the pull request head and then runs its code (npm ci, npm test) and, for that finding, gives the rule ID BCS-INFRA-011, a CWE ID (CWE-94 (or CWE-829, CWE-78)), an OWASP Top 10 2021 category (A08:2021 (or A03:2021, A01:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-011, or it lacks the CWE ID, the OWASP category or the confidence level.
