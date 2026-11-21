#!/bin/bash
# Copies fixtures/typosquat-package/ (without expected.json) into the empty eval workspace, dotfiles included.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/typosquat-package" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json
