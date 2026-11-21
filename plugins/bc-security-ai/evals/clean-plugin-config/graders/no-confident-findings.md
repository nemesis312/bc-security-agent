---
type: llm
---

PASS if the reply reports no labeled security findings with high or medium confidence for this project: either no findings at all, or only low-confidence items, or items of severity info that carry no BCS-* rule ID (general hardening suggestions are ignored regardless of their confidence).
FAIL if the reply reports any finding labeled with a BCS-AI rule ID at high or medium confidence (for example an unpinned MCP package, an inline secret, a plain-http MCP server, hidden instructions, a dangerous hook or excessive tool permissions), or any non-info finding at high or medium confidence.
Ignore remarks that example hostnames, package names or environment variable names are placeholders: they are not security findings. Rule checks reported as passed are not findings.
