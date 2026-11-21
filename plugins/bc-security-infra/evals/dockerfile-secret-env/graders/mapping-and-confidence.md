---
type: llm
---

PASS if the reply reports a finding about a secret (database password) written into an ENV instruction of the Dockerfile and, for that finding, gives the rule ID BCS-INFRA-003, a CWE ID (CWE-538 (or CWE-798, CWE-312)), an OWASP Top 10 2021 category (A05:2021 (or A02:2021, A07:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-003, or it lacks the CWE ID, the OWASP category or the confidence level.
FAIL also if the reply prints the full password value instead of redacting it. FAIL also if the same secret is reported as a second finding under BCS-SEC-001 instead of once under BCS-INFRA-003.
