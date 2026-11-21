# bc-security-infra

Infrastructure security rules (`BCS-INFRA-001` to `BCS-INFRA-013`) for the bc-security reviewer: Dockerfile, Docker Compose and GitHub Actions workflows. Static review only; it never runs `docker` or workflows.

## About the fixtures

The fixtures under `fixtures/` are static files. Credentials in them are **intentionally fake** and carry the comment `bc-security fixture: intentionally fake credential`. Image digests and action commit SHAs are **synthetic** (repeated hex patterns) and do not point to real images or commits; each file says so in a comment. GitHub Actions fixtures live under `.github/workflows/` inside each fixture directory.

## Install

```text
/plugin marketplace add nemesis312/bc-security-agent
/plugin install bc-security-infra@bc-security
```

It depends on `bc-security-core`, which is installed with it.
