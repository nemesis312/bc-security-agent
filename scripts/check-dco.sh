#!/bin/sh
# DCO check: every non-merge commit in <base_sha>..<head_sha> must carry a
# "Signed-off-by: Name <email>" trailer. Exits 1 and lists offenders otherwise.
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <base_sha> <head_sha>" >&2
  exit 2
fi
BASE=$1
HEAD=$2

for arg in "$BASE" "$HEAD"; do
  if ! printf '%s\n' "$arg" | grep -Eq '^[0-9a-f]{7,64}$'; then
    echo "invalid commit SHA argument: $arg" >&2
    exit 2
  fi
done

commits=$(git rev-list --no-merges "$BASE..$HEAD") || {
  echo "cannot list commits for $BASE..$HEAD" >&2
  exit 2
}

bad=0
for sha in $commits; do
  if ! git show -s --format=%B "$sha" | grep -Eq '^Signed-off-by: .+ <[^<>[:space:]]+>[[:space:]]*$'; then
    echo "missing Signed-off-by: $sha $(git show -s --format=%s "$sha")" >&2
    bad=$((bad + 1))
  fi
done

if [ "$bad" -ne 0 ]; then
  echo "FAIL: $bad commit(s) without a Signed-off-by trailer. Fix with: git rebase --signoff <base> (or git commit -s --amend), then force-push your branch." >&2
  exit 1
fi
echo "ok: all non-merge commits are signed off"
