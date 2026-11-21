# bc-security-secrets

Secrets and supply-chain hygiene rules (`BCS-SEC-001` to `BCS-SEC-007`) for the bc-security reviewer. It reports hygiene only and never claims that a dependency version has a CVE.

## About the fixtures

The credential fixtures under `fixtures/` contain **intentionally fake** values: vendor-documented example credentials or obviously synthetic strings. Each file that holds one starts with the comment `bc-security fixture: intentionally fake credential`. Secret scanners will flag these files; that is expected and they are not real secrets.

## Install

```text
/plugin marketplace add nemesis312/bc-security-agent
/plugin install bc-security-secrets@bc-security
```

It depends on `bc-security-core`, which is installed with it.
