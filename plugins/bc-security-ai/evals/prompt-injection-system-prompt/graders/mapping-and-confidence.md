---
type: llm
---

PASS if the reply reports a finding about untrusted ticket content (customer name and message) concatenated into the system prompt (prompt injection) and, for that finding, gives the rule ID BCS-AI-001, a CWE ID (CWE-77 (or CWE-1427, CWE-74)), an OWASP LLM Top 10 2025 category (LLM01 (Prompt Injection), with or without the ":2025" suffix) and a confidence level (high, medium or low), in any language, order or format.
FAIL if that finding is missing, or it is not labeled with rule ID BCS-AI-001, or it lacks the CWE ID, the OWASP LLM category or the confidence level.
