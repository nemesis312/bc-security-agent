#!/bin/bash
# Copies fixtures/git-url-dependency/ (without expected.json) into the empty eval workspace, dotfiles included.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/git-url-dependency" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json
