---
type: llm
---

PASS if the reply reports a finding about a RUN instruction that downloads a script with curl and pipes it to a shell and, for that finding, gives the rule ID BCS-INFRA-004, a CWE ID (CWE-494 (or CWE-829)), an OWASP Top 10 2021 category (A08:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-004, or it lacks the CWE ID, the OWASP category or the confidence level.
