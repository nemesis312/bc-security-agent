---
type: llm
---

PASS if the reply reports a finding about a database password written inline in the Compose environment and, for that finding, gives the rule ID BCS-INFRA-008, a CWE ID (CWE-798 (or CWE-259, CWE-538)), an OWASP Top 10 2021 category (A07:2021 (or A05:2021, A02:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-008, or it lacks the CWE ID, the OWASP category or the confidence level.
FAIL also if the reply prints the full password value instead of redacting it. FAIL also if the same secret is reported as a second finding under BCS-SEC-001 instead of once under BCS-INFRA-008.
