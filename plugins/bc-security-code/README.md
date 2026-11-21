# bc-security-code

Application code security rules (`BCS-CODE-001` to `BCS-CODE-008`) for the bc-security reviewer, mapped to the OWASP Top 10 2021, CWE and ASVS 4.0.3. Static review only; it never runs your code. Language-agnostic grep hints cover TypeScript/JavaScript, Python, Go and C#.

## What it detects

| Rule | Detects |
|---|---|
| `BCS-CODE-001` | Injection: SQL, OS command, code or template |
| `BCS-CODE-002` | Broken authentication: unverified JWT, weak password storage |
| `BCS-CODE-003` | Broken access control and IDOR |
| `BCS-CODE-004` | Multitenant data access without a tenant filter or RLS |
| `BCS-CODE-005` | Server-side request forgery (SSRF) |
| `BCS-CODE-006` | Insecure deserialization of untrusted data |
| `BCS-CODE-007` | Cross-site scripting (XSS) |
| `BCS-CODE-008` | Weak cryptography, hardcoded keys or IVs |

Private key material and signing secrets stored as credentials are reported under `BCS-SEC-001` when `bc-security-secrets` is installed; otherwise they are reported under `BCS-CODE-008`.

## About the fixtures

The fixtures under `fixtures/` are static files with deliberately vulnerable code. Credentials and keys in them are **intentionally fake**, and nothing in them is meant to run.

## Install

```text
/plugin marketplace add nemesis312/bc-security-agent
/plugin install bc-security-code@bc-security
```

It depends on `bc-security-core`, which is installed with it.
