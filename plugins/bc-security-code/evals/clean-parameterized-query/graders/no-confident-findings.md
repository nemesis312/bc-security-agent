---
type: llm
---

PASS if the reply reports no security findings with high or medium confidence for src/orders.ts: either no findings at all, or only low-confidence items presented as things to verify.
FAIL if the reply reports any finding with high or medium confidence (for example SQL injection) for src/orders.ts.
