---
type: llm
---

PASS if the reply reports a finding about a deploy token secret echoed to the job log in a run step and, for that finding, gives the rule ID BCS-INFRA-013, a CWE ID (CWE-532 (or CWE-312, CWE-200)), an OWASP Top 10 2021 category (A09:2021 (or A02:2021, A05:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-013, or it lacks the CWE ID, the OWASP category or the confidence level.
