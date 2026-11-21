---
type: llm
---

PASS if the reply reports a finding about a third-party action (some-vendor/publish-artifact) referenced by the mutable tag v2 instead of a commit SHA and, for that finding, gives the rule ID BCS-INFRA-010, a CWE ID (CWE-829 (or CWE-1357)), an OWASP Top 10 2021 category (A08:2021 (or A06:2021)) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-INFRA-010, or it lacks the CWE ID, the OWASP category or the confidence level.
