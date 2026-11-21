---
type: llm
---

PASS if the reply reports a finding about SQL injection (user input concatenated into a SQL query) in src/orders.ts and, for that finding, gives the rule ID BCS-CODE-001, a CWE ID (CWE-89), an OWASP Top 10 2021 category (A03:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-CODE-001, or it lacks the CWE ID, the OWASP category or the confidence level.
