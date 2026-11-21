---
type: llm
---

PASS if the reply reports a finding about model output passed to Python eval() (improper output handling leading to code execution) and, for that finding, gives the rule ID BCS-AI-002, a CWE ID (CWE-94 (or CWE-95, CWE-1426)), an OWASP LLM Top 10 2025 category (LLM05 (Improper Output Handling), with or without the ":2025" suffix) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-AI-002, or it lacks the CWE ID, the OWASP LLM category or the confidence level.
