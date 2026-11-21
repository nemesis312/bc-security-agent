import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lint } from '../scripts/lint.mjs';
import { parseFrontmatter } from '../scripts/lib/frontmatter.mjs';

const fx = (name) =>
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'lint', name);
const errorsOf = (name) => lint(fx(name)).errors;
const assertHas = (name, ...needles) => {
  const errors = errorsOf(name);
  assert.ok(errors.length > 0, `${name}: expected errors`);
  assert.ok(
    errors.some((e) => needles.every((n) => e.includes(n))),
    `${name}: no error containing ${JSON.stringify(needles)} in:\n${errors.join('\n')}`,
  );
};

test('good fixture has no errors', () => {
  assert.deepEqual(errorsOf('good'), []);
});

test('bad-marketplace-name-mismatch', () =>
  assertHas('bad-marketplace-name-mismatch', 'bc-security-code', 'marketplace.json'));
test('bad-plugin-not-listed', () =>
  assertHas('bad-plugin-not-listed', 'plugins/bc-security-code', 'marketplace.json'));
test('bad-missing-dependency', () =>
  assertHas('bad-missing-dependency', 'bc-security-code', 'bc-security-core', 'plugin.json'));
test('bad-core-has-dependencies', () =>
  assertHas('bad-core-has-dependencies', 'bc-security-core', 'dependencies'));
test('bad-reviewer-has-write', () =>
  assertHas('bad-reviewer-has-write', 'security-reviewer', 'Write'));
test('bad-reviewer-missing-disallowed', () =>
  assertHas('bad-reviewer-missing-disallowed', 'security-reviewer', 'disallowedTools', 'Bash'));
test('bad-agent-no-description', () =>
  assertHas('bad-agent-no-description', 'security-reviewer.md', 'description'));
test('bad-skill-no-description', () =>
  assertHas('bad-skill-no-description', 'skills/code-rules/SKILL.md', 'description'));
test('bad-skill-long-description', () =>
  assertHas('bad-skill-long-description', 'skills/code-rules/SKILL.md', '1024'));
test('bad-rule-without-fixture', () =>
  assertHas('bad-rule-without-fixture', 'BCS-CODE-002', 'rules.md'));
test('bad-rule-bad-id', () => assertHas('bad-rule-bad-id', 'BCS-CODEX-12', 'rules.md'));
test('bad-fixture-without-eval', () =>
  assertHas('bad-fixture-without-eval', 'fixtures/case-a', 'evals/case-a/prompt.md'));
test('bad-fixture-without-expected', () =>
  assertHas('bad-fixture-without-expected', 'fixtures/case-a', 'expected.json'));

test('parseFrontmatter: comma list', () => {
  const fm = parseFrontmatter('---\nname: x\ntools: Read, Grep, Glob\n---\nbody');
  assert.equal(fm.name, 'x');
  assert.deepEqual(fm.tools, ['Read', 'Grep', 'Glob']);
});
test('parseFrontmatter: dash list', () => {
  const fm = parseFrontmatter('---\nname: x\ndisallowedTools:\n  - Edit\n  - Write\n---\n');
  assert.deepEqual(fm.disallowedTools, ['Edit', 'Write']);
});
test('parseFrontmatter: description keeps commas as a string, quotes stripped', () => {
  const fm = parseFrontmatter('---\ndescription: "a, b, c"\nother: plain\n---\n');
  assert.equal(fm.description, 'a, b, c');
  assert.equal(fm.other, 'plain');
});
test('parseFrontmatter: no frontmatter returns empty object', () => {
  assert.deepEqual(parseFrontmatter('# just text'), {});
});
