#!/bin/sh
# Run a plugin's eval suite locally with `claude plugin eval`.
#
#   scripts/eval.sh [plugin|all] [--case <glob>] [extra claude plugin eval options...]
#
# Uses your own Claude Code login (subscription quota). Never run it in CI.
# See docs/evals.md for the case layout, the tool grants and why each is needed.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

usage() {
  echo "usage: scripts/eval.sh [plugin|all] [--case <glob>] [extra claude plugin eval options...]" >&2
  exit 2
}

case "${1:-}" in
  -h|--help) usage ;;
  ''|-*) TARGET=all ;;
  *) TARGET=$1; shift ;;
esac

# Gated tools the cases need (granted for the whole run):
# - Write: the security-review skill writes report.md/report.json in the main session.
# - Bash(git ...): the skill computes the review scope with read-only git commands.
# - Bash(date ...): the skill timestamps the report folder.
# - Bash(ls -ld ...): the skill checks .security/ is a real directory, not a symlink.
# The reviewer agent itself never gets these: its frontmatter disallows them.
set -- --scaffold \
  --allow-tools Write \
    "Bash(git status *)" "Bash(git diff *)" "Bash(git rev-parse *)" \
    "Bash(git merge-base *)" "Bash(git ls-files *)" "Bash(date *)" "Bash(ls -ld *)" \
  "$@"

if [ "$TARGET" = "all" ]; then
  PLUGINS=$(cd "$ROOT/plugins" && for d in */; do [ -d "$d/evals" ] && printf '%s\n' "${d%/}"; done)
else
  [ -d "$ROOT/plugins/$TARGET/evals" ] || { echo "error: no evals in plugins/$TARGET" >&2; exit 2; }
  PLUGINS=$TARGET
fi
[ -n "$PLUGINS" ] || { echo "error: no plugin with an evals/ directory" >&2; exit 2; }

status=0
for p in $PLUGINS; do
  dir="$ROOT/plugins/$p"
  mkdir -p "$dir/evals/results"
  echo "== $p" >&2
  # Domain plugin cases also load bc-security-core (prompt.md `plugins:`), and the
  # harness only loads plugins inside the target directory. So a domain plugin is
  # evaluated with the repo root as the target and its suite picked by --eval-dir;
  # the core plugin keeps its own directory as the target.
  if [ "$p" = "bc-security-core" ]; then
    target=$dir; evaldir=
  else
    target=$ROOT; evaldir="--eval-dir plugins/$p/evals"
  fi
  # The target goes first: --allow-tools and --json would otherwise swallow it.
  # shellcheck disable=SC2086 # $evaldir is intentionally split into two words.
  claude plugin eval "$target" $evaldir --trust-plugin --no-publish --threshold 0.8 \
    --json "$dir/evals/results/latest.json" "$@" || status=$?
  echo "   results: plugins/$p/evals/results/latest.json" >&2
done
exit "$status"
