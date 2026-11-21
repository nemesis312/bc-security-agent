---
type: llm
---

PASS if the reply reports a finding about a base image that uses the mutable latest tag instead of a pinned version or digest and, for that finding, gives the rule ID BCS-INFRA-002, a CWE ID (CWE-1357 (or CWE-829)), an OWASP Top 10 2021 category (A06:2021 (or A08:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-002, or it lacks the CWE ID, the OWASP category or the confidence level.
