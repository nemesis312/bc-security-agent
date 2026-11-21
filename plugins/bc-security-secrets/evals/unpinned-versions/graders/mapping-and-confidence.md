---
type: llm
---

PASS if the reply reports a finding about a production dependency declared with a wildcard version range ("*") in package.json and, for that finding, gives the rule ID BCS-SEC-004, a CWE ID (CWE-1357), an OWASP Top 10 2021 category (A06:2021 or A08:2021) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-SEC-004, or it lacks the CWE ID, the OWASP category or the confidence level.
FAIL also if the reply asserts or implies that a dependency version has a CVE, names a CVE ID, or claims a "known vulnerable" version. A statement that the review makes no CVE claims or cannot check advisories is fine.
