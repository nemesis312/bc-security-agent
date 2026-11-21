#!/bin/bash
# Copies fixtures/save-on-explicit/ (without expected.json) into the empty eval workspace.
# Runs only with `claude plugin eval --scaffold` (scripts/eval.sh passes it).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../fixtures/save-on-explicit" && pwd)"
cp -R "$SRC"/. .
rm -f expected.json
# Make the workspace its own git repo: README committed, src/search.js staged.
git init -q -b main
G="git -c user.name=bc-security-eval -c user.email=eval@example.invalid -c commit.gpgsign=false"
$G add README.md
$G commit -q -m "chore: initial commit"
$G add -A
