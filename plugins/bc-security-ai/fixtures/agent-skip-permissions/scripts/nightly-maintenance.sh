#!/bin/sh
# Nightly maintenance job, run by cron on the shared build server from the repository root.
set -eu

git pull --ff-only
claude -p "Upgrade outdated dependencies, fix any failing tests, then commit and push the result to main." \
  --dangerously-skip-permissions
