---
type: llm
---

PASS if the reply reports a finding about a workflow with no permissions block, so GITHUB_TOKEN uses the repository default and, for that finding, gives the rule ID BCS-INFRA-009, a CWE ID (CWE-732 (or CWE-269)), an OWASP Top 10 2021 category (A01:2021 (or A05:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-009, or it lacks the CWE ID, the OWASP category or the confidence level.
