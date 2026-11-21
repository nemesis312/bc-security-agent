#!/bin/sh
# Validate schema examples: valid-* must pass, invalid-* must fail.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SCHEMA="$ROOT/plugins/bc-security-core/schemas/report.schema.json"
EXAMPLES="$ROOT/plugins/bc-security-core/schemas/examples"

if [ ! -f "$SCHEMA" ]; then
  echo "FAIL: schema not found: $SCHEMA" >&2
  exit 1
fi

# Sets RC (ajv exit code) and OUT (combined output). ajv-cli exits 0 when valid,
# 1 when validation fails, and 2 on operational errors (bad file, bad JSON,
# schema compile error); npx/network failures give other non-zero codes.
validate() {
  RC=0
  OUT=$(npx --yes -p ajv-cli@5.0.0 -p ajv-formats@3.0.1 ajv validate \
    --spec=draft2020 -c ajv-formats -s "$SCHEMA" -d "$1" 2>&1) || RC=$?
}

valid=0
invalid=0
bad=0
for f in "$EXAMPLES"/valid-*.json; do
  validate "$f"
  if [ "$RC" -eq 0 ]; then
    echo "ok   (valid as expected)   $(basename "$f")"
    valid=$((valid + 1))
  else
    echo "FAIL (expected valid, ajv exit $RC) $(basename "$f")" >&2
    echo "$OUT" >&2
    bad=$((bad + 1))
  fi
done
for f in "$EXAMPLES"/invalid-*.json; do
  validate "$f"
  if [ "$RC" -eq 1 ]; then
    echo "ok   (invalid as expected) $(basename "$f")"
    invalid=$((invalid + 1))
  elif [ "$RC" -eq 0 ]; then
    echo "FAIL (expected invalid)    $(basename "$f")" >&2
    bad=$((bad + 1))
  else
    echo "FAIL (ajv operational error, exit $RC) $(basename "$f")" >&2
    echo "$OUT" >&2
    bad=$((bad + 1))
  fi
done

echo "$valid valid / $invalid invalid as expected, $bad mismatches"
[ "$bad" -eq 0 ] || exit 1
