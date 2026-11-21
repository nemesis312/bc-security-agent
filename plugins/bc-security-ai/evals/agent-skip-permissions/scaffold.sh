#!/bin/bash
# Copies fixtures/agent-skip-permissions/ (without expected.json) into the empty eval workspace, dotfiles and dot-directories included.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/agent-skip-permissions" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json
