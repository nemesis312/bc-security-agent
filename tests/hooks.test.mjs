import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "plugins", "bc-security-core");
const hooks = join(root, "hooks");

function project(config) {
  const dir = mkdtempSync(join(tmpdir(), "bcs-hooks-"));
  if (config) {
    mkdirSync(join(dir, ".security"));
    writeFileSync(join(dir, ".security", "config.json"), JSON.stringify(config));
  }
  return dir;
}

function run(script, input, { config, env = {}, path = process.env.PATH, shell } = {}) {
  const dir = project(config);
  try {
    const file = join(hooks, script);
    const r = spawnSync(shell || file, shell ? [file] : [], {
      input: typeof input === "string" ? input : JSON.stringify(input),
      env: { PATH: path, CLAUDE_PROJECT_DIR: dir, ...env },
      encoding: "utf8",
    });
    assert.ok(!/"permissionDecision"\s*:\s*"deny"/.test(r.stdout), "never deny");
    return { code: r.status, out: r.stdout, err: r.stderr, dir };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });
const edit = (file_path) => ({ tool_name: "Edit", tool_input: { file_path } });
const onCommit = { config: { hooks: { preCommit: true } } };
const onEdit = { config: { hooks: { sensitiveEdits: true } } };
const decision = (out) => JSON.parse(out).hookSpecificOutput.permissionDecision;

test("hooks.json wires both scripts", () => {
  const h = JSON.parse(readFileSync(join(hooks, "hooks.json"), "utf8")).hooks;
  assert.equal(h.PostToolUse[0].matcher, "Write|Edit");
  assert.match(h.PostToolUse[0].hooks[0].command, /hooks\/sensitive-edit\.sh/);
  assert.equal(h.PreToolUse[0].matcher, "Bash");
  assert.match(h.PreToolUse[0].hooks[0].command, /hooks\/pre-commit\.sh/);
});

test("disabled by default: no config, no env", () => {
  for (const [s, i] of [["pre-commit.sh", bash("git commit -m x")], ["sensitive-edit.sh", edit("src/auth/login.ts")]]) {
    const r = run(s, i);
    assert.equal(r.out, "");
    assert.equal(r.code, 0);
  }
});

test("pre-commit enabled via repo file asks", () => {
  const r = run("pre-commit.sh", bash("git commit -m x"), onCommit);
  assert.equal(r.code, 0);
  assert.equal(decision(r.out), "ask");
  assert.match(JSON.parse(r.out).hookSpecificOutput.permissionDecisionReason, /security-review/);
});

test("pre-commit enabled via env asks, and env wins over repo false", () => {
  const env = { CLAUDE_PLUGIN_OPTION_HOOK_PRE_COMMIT: "true" };
  assert.equal(decision(run("pre-commit.sh", bash("git commit -m x"), { env }).out), "ask");
  const both = run("pre-commit.sh", bash("git commit -m x"), { env, config: { hooks: { preCommit: false } } });
  assert.equal(decision(both.out), "ask");
});

test("env value other than true does not enable", () => {
  const r = run("pre-commit.sh", bash("git commit -m x"), { env: { CLAUDE_PLUGIN_OPTION_HOOK_PRE_COMMIT: "false" } });
  assert.equal(r.out, "");
});

test("commit variants ask", () => {
  for (const c of ["git -C dir commit", "git commit --amend -m x", "cd a && git commit -m x", "git add . ; git commit -m 'a b'", "git -c user.name=x commit -m y", 'git commit -m "fix; && stuff"', "FOO=1 git commit", "git add .\ngit commit -m x", "git -C \"my dir\" commit"]) {
    assert.equal(decision(run("pre-commit.sh", bash(c), onCommit).out), "ask", c);
  }
});

test("non-commit commands stay silent", () => {
  for (const c of ["git commit-tree abc", 'echo "git commit"', "echo 'git commit -m x'", "git log", "git status && git diff", "grep commit file"]) {
    const r = run("pre-commit.sh", bash(c), onCommit);
    assert.equal(r.out, "", c);
    assert.equal(r.code, 0);
  }
});

test("sensitive paths produce a notice", () => {
  for (const f of ["src/auth/login.ts", "/abs/My Project/.env.local", ".github/workflows/ci.yml", "./Dockerfile", "docker-compose.prod.yml", "package-lock.json", "app/Foo.csproj", "plugins/x/skills/a/SKILL.md", ".mcp.json", "SRC/AUTH/X.ts"]) {
    const r = run("sensitive-edit.sh", edit(f), onEdit);
    assert.equal(r.code, 0, f);
    assert.match(JSON.parse(r.out).systemMessage, /bc-security-core:security-review/, f);
  }
});

test("sensitive-edit enabled via env", () => {
  const r = run("sensitive-edit.sh", edit("src/auth.ts"), { env: { CLAUDE_PLUGIN_OPTION_HOOK_SENSITIVE_EDITS: "true" } });
  assert.ok(JSON.parse(r.out).systemMessage);
});

test("non-sensitive path stays silent, project dir name is ignored", () => {
  assert.equal(run("sensitive-edit.sh", edit("src/utils/math.ts"), onEdit).out, "");
  const dir = mkdtempSync(join(tmpdir(), "bcs-auth-"));
  try {
    mkdirSync(join(dir, ".security"));
    writeFileSync(join(dir, ".security", "config.json"), JSON.stringify({ hooks: { sensitiveEdits: true } }));
    const r = spawnSync(join(hooks, "sensitive-edit.sh"), {
      input: JSON.stringify(edit(join(dir, "src", "math.ts"))),
      env: { PATH: process.env.PATH, CLAUDE_PROJECT_DIR: dir }, encoding: "utf8",
    });
    assert.equal(r.stdout, "");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("robustness: bad JSON, missing fields", () => {
  for (const [s, o] of [["pre-commit.sh", onCommit], ["sensitive-edit.sh", onEdit]]) {
    for (const input of ["not json", "{}", "", '{"tool_input":{}}']) {
      const r = run(s, input, o);
      assert.equal(r.out, "", `${s} ${input}`);
      assert.equal(r.code, 0);
    }
  }
});

test("robustness: no jq on PATH exits 0 silently", () => {
  const bin = mkdtempSync(join(tmpdir(), "bcs-nojq-"));
  try {
    for (const t of ["cat", "sed", "tr", "dirname", "printf"]) {
      const p = spawnSync("/bin/sh", ["-c", `command -v ${t}`], { encoding: "utf8" }).stdout.trim();
      if (p) symlinkSync(p, join(bin, t));
    }
    const env = { CLAUDE_PLUGIN_OPTION_HOOK_PRE_COMMIT: "true", CLAUDE_PLUGIN_OPTION_HOOK_SENSITIVE_EDITS: "true" };
    for (const [s, i] of [["pre-commit.sh", bash("git commit -m x")], ["sensitive-edit.sh", edit("src/auth.ts")]]) {
      const r = run(s, i, { path: bin, env });
      assert.equal(r.out, "");
      assert.equal(r.code, 0);
    }
    const sanity = spawnSync("/bin/sh", ["-c", "command -v jq"], { env: { PATH: bin }, encoding: "utf8" });
    assert.equal(sanity.stdout.trim(), "");
  } finally { rmSync(bin, { recursive: true, force: true }); }
});

test("scripts never print deny", () => {
  for (const s of ["pre-commit.sh", "sensitive-edit.sh", "hooks.json", "lib/config.sh"]) {
    assert.doesNotMatch(readFileSync(join(hooks, s), "utf8"), /deny/i, s);
  }
});

const hasDash = existsSync("/bin/dash");
const dashTest = (name, fn) => test(name, { skip: !hasDash && "dash not installed" }, fn);
const bothOn = { config: { hooks: { preCommit: true, sensitiveEdits: true } }, shell: "/bin/dash" };

dashTest("dash: odd git global options never exit non-zero", () => {
  for (const c of ["git -C", "git --exec-path", "git -c", "git --git-dir", "git -C dir -c"]) {
    for (const s of ["pre-commit.sh", "sensitive-edit.sh"]) {
      const r = run(s, bash(c), bothOn);
      assert.equal(r.code, 0, `${s} ${c}`);
      assert.equal(r.out, "", `${s} ${c}`);
    }
  }
});

dashTest("dash: commit variants and non-commits behave the same", () => {
  for (const c of ["git -C dir commit", "git commit --amend -m x", "cd a && git commit -m x", "git add .\ngit commit -m x"]) {
    assert.equal(decision(run("pre-commit.sh", bash(c), bothOn).out), "ask", c);
  }
  for (const c of ["git commit-tree abc", 'echo "git commit"', "git log"]) {
    assert.equal(run("pre-commit.sh", bash(c), bothOn).out, "", c);
  }
  assert.ok(JSON.parse(run("sensitive-edit.sh", edit("src/auth.ts"), bothOn).out).systemMessage);
});

test("hardened config: malformed or wrongly typed values fail closed", () => {
  const raw = [
    ["malformed", "{not json"],
    ["string true", '{"hooks":{"preCommit":"true","sensitiveEdits":"true"}}'],
    ["number 1", '{"hooks":{"preCommit":1,"sensitiveEdits":1}}'],
    ["hooks string", '{"hooks":"x"}'],
    ["array", "[1]"],
  ];
  for (const [name, text] of raw) {
    for (const [s, i] of [["pre-commit.sh", bash("git commit -m x")], ["sensitive-edit.sh", edit("src/auth.ts")]]) {
      const dir = mkdtempSync(join(tmpdir(), "bcs-cfg-"));
      try {
        mkdirSync(join(dir, ".security"));
        writeFileSync(join(dir, ".security", "config.json"), text);
        const r = spawnSync(join(hooks, s), { input: JSON.stringify(i), env: { PATH: process.env.PATH, CLAUDE_PROJECT_DIR: dir }, encoding: "utf8" });
        assert.equal(r.status, 0, `${name} ${s}`);
        assert.equal(r.stdout, "", `${name} ${s}`);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    }
  }
});
