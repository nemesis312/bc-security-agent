import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve(import.meta.dirname, '..', 'scripts', 'check-dco.sh');

function git(dir, ...args) {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'dco-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.name', 'Test User');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'commit.gpgsign', 'false');
  git(dir, 'config', 'core.hooksPath', '/dev/null');
  writeFileSync(join(dir, 'base.txt'), 'base\n');
  git(dir, 'add', 'base.txt');
  git(dir, 'commit', '-q', '-s', '-m', 'chore: base');
  return dir;
}

function commit(dir, name, message, { signoff = false } = {}) {
  writeFileSync(join(dir, name), name + '\n');
  git(dir, 'add', name);
  git(dir, 'commit', '-q', ...(signoff ? ['-s'] : []), '-m', message);
  return git(dir, 'rev-parse', 'HEAD');
}

function run(dir, base, head) {
  return spawnSync('sh', [SCRIPT, base, head], { cwd: dir, encoding: 'utf8' });
}

test('fails and names the unsigned commit', () => {
  const dir = makeRepo();
  try {
    const base = git(dir, 'rev-parse', 'HEAD');
    const signed = commit(dir, 'a.txt', 'feat: signed', { signoff: true });
    const unsigned = commit(dir, 'b.txt', 'feat: unsigned');
    const r = run(dir, base, git(dir, 'rev-parse', 'HEAD'));
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, new RegExp(unsigned));
    assert.doesNotMatch(r.stderr + r.stdout, new RegExp(signed));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('passes when every commit is signed off', () => {
  const dir = makeRepo();
  try {
    const base = git(dir, 'rev-parse', 'HEAD');
    commit(dir, 'a.txt', 'feat: one', { signoff: true });
    commit(dir, 'b.txt', 'feat: two', { signoff: true });
    const r = run(dir, base, git(dir, 'rev-parse', 'HEAD'));
    assert.equal(r.status, 0, r.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('lists every unsigned commit', () => {
  const dir = makeRepo();
  try {
    const base = git(dir, 'rev-parse', 'HEAD');
    const u1 = commit(dir, 'a.txt', 'feat: one');
    const u2 = commit(dir, 'b.txt', 'feat: two');
    const r = run(dir, base, git(dir, 'rev-parse', 'HEAD'));
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, new RegExp(u1));
    assert.match(r.stderr + r.stdout, new RegExp(u2));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ignores merge commits', () => {
  const dir = makeRepo();
  try {
    const base = git(dir, 'rev-parse', 'HEAD');
    git(dir, 'checkout', '-q', '-b', 'side');
    commit(dir, 's.txt', 'feat: side', { signoff: true });
    git(dir, 'checkout', '-q', 'main');
    commit(dir, 'm.txt', 'feat: main', { signoff: true });
    git(dir, 'merge', '-q', '--no-ff', '-m', 'Merge branch side', 'side');
    const r = run(dir, base, git(dir, 'rev-parse', 'HEAD'));
    assert.equal(r.status, 0, r.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('requires the exact case-sensitive trailer', () => {
  const dir = makeRepo();
  try {
    const base = git(dir, 'rev-parse', 'HEAD');
    const bad = commit(dir, 'a.txt', 'feat: x\n\nsigned-off-by: Test User <test@example.com>');
    const r = run(dir, base, git(dir, 'rev-parse', 'HEAD'));
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, new RegExp(bad));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('usage error without arguments', () => {
  const r = spawnSync('sh', [SCRIPT], { encoding: 'utf8' });
  assert.equal(r.status, 2);
});

test('fails closed when the base commit does not exist', () => {
  const dir = makeRepo();
  try {
    const head = git(dir, 'rev-parse', 'HEAD');
    const r = run(dir, 'deadbeef', head);
    assert.notEqual(r.status, 0);
    assert.doesNotMatch(r.stdout, /^ok/m);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('rejects non-hex arguments (no option injection)', () => {
  const dir = makeRepo();
  try {
    const head = git(dir, 'rev-parse', 'HEAD');
    const r = run(dir, '--all', head);
    assert.equal(r.status, 2);
    const r2 = run(dir, head, 'HEAD; echo hi');
    assert.equal(r2.status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
