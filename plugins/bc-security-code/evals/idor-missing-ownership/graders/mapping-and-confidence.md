---
type: llm
---

PASS if the reply reports a finding about an insecure direct object reference (invoice returned without checking that it belongs to the caller) in src/invoices.go and, for that finding, gives the rule ID BCS-CODE-003, a CWE ID (CWE-639 or CWE-862), an OWASP Top 10 2021 category (A01:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-CODE-003, or it lacks the CWE ID, the OWASP category or the confidence level.
