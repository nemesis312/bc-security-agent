---
type: llm
---

PASS if the reply reports a finding about a PostgreSQL database port published on all interfaces (5432:5432 with no 127.0.0.1 binding) and, for that finding, gives the rule ID BCS-INFRA-007, a CWE ID (CWE-668 (or CWE-200)), an OWASP Top 10 2021 category (A05:2021 (or A01:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-007, or it lacks the CWE ID, the OWASP category or the confidence level.
