---
type: llm
---

PASS if the reply reports a finding about a dependency resolved from a git URL pointing at a mutable branch (#main) instead of a registry release and, for that finding, gives the rule ID BCS-SEC-006, a CWE ID (CWE-829), an OWASP Top 10 2021 category (A08:2021 or A06:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-SEC-006, or it lacks the CWE ID, the OWASP category or the confidence level.
FAIL also if the reply asserts or implies that a dependency version has a CVE, names a CVE ID, or claims a "known vulnerable" version. A statement that the review makes no CVE claims or cannot check advisories is fine.
