#!/bin/bash
# Copies fixtures/compose-db-public-port/ (without expected.json) into the empty eval workspace, dotfiles and dot-directories included.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/compose-db-public-port" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json
