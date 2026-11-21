#!/bin/sh
# PreToolUse (Bash): opt-in prompt before `git commit`. Only ever asks; never denies,
# never launches the reviewer. All logic runs in a subshell and the script always
# exits 0, so a shell-level error can never become a blocking exit code.
hook_dir=${0%/*}
(
  command -v jq >/dev/null 2>&1 || exit 0
  [ -r "$hook_dir/lib/config.sh" ] || exit 0
  . "$hook_dir/lib/config.sh"
  bcs_enabled HOOK_PRE_COMMIT .hooks.preCommit || exit 0

  cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null) || exit 0
  [ -n "$cmd" ] || exit 0

  # Blank out quoted strings (so "git commit" inside echo is ignored), then split
  # the command line into simple commands.
  sep=$(printf '\001')
  segments=$(printf '%s' "$cmd" | tr '\n' "$sep" \
    | sed -e 's/"[^"]*"/Q/g' -e "s/'[^']*'/Q/g" \
    | sed -e 's/&&/;/g' -e 's/||/;/g' -e 's/[|&(){}]/;/g' \
    | tr ";$sep" '\n\n')

  found=0
  set -f
  oldifs=$IFS
  IFS='
'
  for seg in $segments; do
    IFS=$oldifs
    # shellcheck disable=SC2086
    set -- $seg
    while [ $# -gt 0 ]; do
      case "$1" in *=*) shift ;; *) break ;; esac
    done
    if [ "${1:-}" = "git" ]; then
      shift
      while [ $# -gt 0 ]; do
        case "$1" in
          -C|-c|--git-dir|--work-tree|--namespace) shift; [ $# -gt 0 ] && shift ;;
          -*) shift ;;
          *) break ;;
        esac
      done
      if [ "${1:-}" = "commit" ]; then found=1; break; fi
    fi
    IFS='
'
  done
  IFS=$oldifs
  [ "$found" = 1 ] || exit 0

  jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: "bc-security: run a security review of the staged changes first? Use /bc-security-core:security-review, or approve to commit anyway."}}'
) 2>/dev/null
exit 0
