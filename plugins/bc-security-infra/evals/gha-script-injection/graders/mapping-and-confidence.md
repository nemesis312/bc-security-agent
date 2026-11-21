---
type: llm
---

PASS if the reply reports a finding about an expression ${{ github.event.issue.title }} interpolated directly in a run step (script injection) and, for that finding, gives the rule ID BCS-INFRA-012, a CWE ID (CWE-78 (or CWE-94, CWE-77)), an OWASP Top 10 2021 category (A03:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-012, or it lacks the CWE ID, the OWASP category or the confidence level.
