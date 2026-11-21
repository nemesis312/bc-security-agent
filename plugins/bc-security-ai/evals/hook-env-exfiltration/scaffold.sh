#!/bin/bash
# Copies fixtures/hook-env-exfiltration/ (without expected.json) into the empty eval workspace, dotfiles and dot-directories included.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/hook-env-exfiltration" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json
