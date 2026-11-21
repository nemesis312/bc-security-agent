#!/bin/bash
# Copies fixtures/weak-crypto-hardcoded-key/ (without expected.json) into the empty eval workspace.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/weak-crypto-hardcoded-key" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json
