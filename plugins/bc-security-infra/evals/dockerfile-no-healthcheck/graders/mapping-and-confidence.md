---
type: llm
---

PASS if the reply reports a finding about the absence of a HEALTHCHECK instruction, reported as informational and, for that finding, gives the rule ID BCS-INFRA-005, a CWE ID (CWE-693 (or CWE-1188, or no CWE other than a generic one)), an OWASP Top 10 2021 category (A05:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-005, or it lacks the CWE ID, the OWASP category or the confidence level.
FAIL also if the reply rates that finding as high, critical or medium severity (it is informational).
