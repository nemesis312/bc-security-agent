---
type: llm
---

PASS if the reply reports a finding about cross-site scripting (user input written into HTML without encoding) in src/search.ts and, for that finding, gives the rule ID BCS-CODE-007, a CWE ID (CWE-79), an OWASP Top 10 2021 category (A03:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-CODE-007, or it lacks the CWE ID, the OWASP category or the confidence level.
