---
type: llm
---

PASS if the reply reports no labeled security findings with high or medium confidence for this project: either no findings at all, or only low-confidence items, or items of severity info that carry no BCS-* rule ID (general hardening suggestions are ignored regardless of their confidence).
FAIL if the reply reports any finding labeled with a BCS-INFRA or BCS-SEC rule ID at high or medium confidence (for example a missing USER, an unpinned image or action, a hardcoded secret, an exposed port, missing permissions, or a spurious BCS-INFRA-005 no-healthcheck item), or any non-info finding at high or medium confidence.
Ignore remarks that a placeholder or synthetic digest or SHA would not resolve at build time: they are not security findings. Rule checks reported as passed are not findings.
