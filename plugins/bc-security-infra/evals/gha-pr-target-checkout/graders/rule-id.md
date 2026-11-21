---
type: regex
target: last_message
flags: im
# Matches the ID only where the reply labels a finding with it: a "Rule"/"Rule ID"
# field (plain, bold, code span or table cell), a Markdown heading, or a findings-table row
# that starts with F-NNN.
# A bare mention such as "BCS-INFRA-011 (...): not applicable" does not match.
pattern: '(Rule(\s+ID)?(\s*/\s*domain)?\s*(\*\*)?\s*[:|]?\s*(\*\*)?\s*[:|]?\s*[`*]*BCS-INFRA-011\b|\|\s*F-\d{3}[^\n|]*\|[^\n]*\bBCS-INFRA-011\b|^#{1,6}[^\n]*\bBCS-INFRA-011\b)'
---
