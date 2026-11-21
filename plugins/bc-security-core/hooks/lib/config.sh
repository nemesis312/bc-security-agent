#!/bin/sh
# Shared option resolution for bc-security hooks.
# bcs_enabled <ENV_SUFFIX> <jq_path>   e.g. bcs_enabled HOOK_PRE_COMMIT .hooks.preCommit
# Returns 0 when enabled. Order: env CLAUDE_PLUGIN_OPTION_<SUFFIX>=true, then
# $CLAUDE_PROJECT_DIR/.security/config.json, otherwise off.

bcs_enabled() {
  _bcs_var="CLAUDE_PLUGIN_OPTION_$1"
  eval "_bcs_val=\${$_bcs_var:-}"
  [ "$_bcs_val" = "true" ] && return 0
  command -v jq >/dev/null 2>&1 || return 1
  _bcs_file="${CLAUDE_PROJECT_DIR:-.}/.security/config.json"
  [ -f "$_bcs_file" ] || return 1
  [ "$(jq -r "$2 == true" "$_bcs_file" 2>/dev/null)" = "true" ]
}
