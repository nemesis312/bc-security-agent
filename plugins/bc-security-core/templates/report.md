# bc-security report

Generated: {{scan.generated_at}} | Tool: bc-security {{tool.version}} | Language: {{language}}

## Summary

| Severity | Count |
|----------|-------|
| Critical | {{summary.critical}} |
| High     | {{summary.high}} |
| Medium   | {{summary.medium}} |
| Low      | {{summary.low}} |
| Info     | {{summary.info}} |
| To verify | {{summary.to_verify}} |

## Findings

Ordered by severity (critical, high, medium, low, info). Findings with low confidence appear under "To verify" instead.

### {{severity}}: {{id}} {{title}}

- Rule: {{rule_id}} ({{domain}})
- CVSS 3.1: {{cvss.score}} `{{cvss.vector}}`
- Confidence: {{confidence}}
- Standards: {{standards.owasp_top10}} {{standards.owasp_llm}} {{standards.cwe}} {{standards.asvs}}
- Location: `{{location.file}}:{{location.line_start}}-{{location.line_end}}`

**Evidence**

{{evidence}}

**Impact**

{{impact}}

**Remediation**

{{remediation}}

## To verify

Findings with low confidence. They need a human check before being treated as real issues. Same fields as above.

{{to_verify_findings}}

## Scope

- Mode: {{scan.mode}}
- Base: {{scan.base}}
- Files reviewed:
{{scan.files_reviewed}}
- Domains used: {{scan.domains_used}}
- Domains missing: {{scan.domains_missing}}

Missing domains were not reviewed. Install the matching plugin to cover them, for example `/plugin install bc-security-<domain>@bc-security` (domains: code, secrets, infra, ai).
