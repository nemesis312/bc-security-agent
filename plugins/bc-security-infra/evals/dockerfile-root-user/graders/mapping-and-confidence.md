---
type: llm
---

PASS if the reply reports a finding about a container that runs as root because the Dockerfile sets no non-root USER and, for that finding, gives the rule ID BCS-INFRA-001, a CWE ID (CWE-250 (or CWE-269)), an OWASP Top 10 2021 category (A05:2021 (or A04:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-001, or it lacks the CWE ID, the OWASP category or the confidence level.
