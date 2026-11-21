---
type: llm
---

PASS if the reply says the domain rule plugins are missing or were not used (it names code, secrets, infra and ai, in any language or order) and tells the user how to install them with a command of the form `/plugin install bc-security-<domain>@bc-security` (generic `<domain>` or one command per domain both count).
FAIL if the reply does not mention missing domains, or gives no install command.
