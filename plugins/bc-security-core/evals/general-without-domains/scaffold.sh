#!/bin/bash
# Copies fixtures/general-without-domains/ (without expected.json) into the empty eval workspace.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/general-without-domains" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json

