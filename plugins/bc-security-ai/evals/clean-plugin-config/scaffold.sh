#!/bin/bash
# Copies fixtures/clean-plugin-config/ (without expected.json) into the empty eval workspace, dotfiles and dot-directories included.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/clean-plugin-config" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json
