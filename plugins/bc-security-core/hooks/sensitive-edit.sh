#!/bin/sh
# PostToolUse (Write|Edit): opt-in notice suggesting a security review when a
# security-sensitive file was edited. Never blocks, never launches the reviewer.
# All logic runs in a subshell and the script always exits 0, so a shell-level
# error can never become a blocking exit code.
hook_dir=${0%/*}
(
  command -v jq >/dev/null 2>&1 || exit 0
  [ -r "$hook_dir/lib/config.sh" ] || exit 0
  . "$hook_dir/lib/config.sh"
  bcs_enabled HOOK_SENSITIVE_EDITS .hooks.sensitiveEdits || exit 0

  file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
  [ -n "$file" ] || exit 0

  rel=${file#"${CLAUDE_PROJECT_DIR:-}"/}
  p=$(printf '/%s' "$rel" | tr 'A-Z' 'a-z')
  base=${p##*/}

  match=0
  case "$p" in
    *auth*|*login*|*session*|*token*|*jwt*|*password*|*crypto*) match=1 ;;
    */.github/workflows/*|*/skills/*|*/hooks/*|*/agents/*) match=1 ;;
  esac
  case "$base" in
    .env*|dockerfile*|docker-compose*.y*ml|compose*.y*ml|.mcp.json) match=1 ;;
    package.json|package-lock.json|pnpm-lock.yaml|yarn.lock|requirements*.txt) match=1 ;;
    poetry.lock|go.mod|go.sum|*.csproj|packages.lock.json|gemfile*|cargo.toml|cargo.lock) match=1 ;;
  esac
  [ "$match" = 1 ] || exit 0

  jq -n --arg f "$rel" '{systemMessage: ("bc-security: " + $f + " is security-sensitive. Consider running /bc-security-core:security-review on your changes.")}'
) 2>/dev/null
exit 0
