---
type: llm
---

PASS if the final reply says the changes could not be computed because there is no git repository or no git history (for example no commits yet), and offers or suggests running the review in `full` mode (whole repository).
FAIL if the reply presents a security review of the files as if changes had been found, or does not mention `full` mode as the way forward.
