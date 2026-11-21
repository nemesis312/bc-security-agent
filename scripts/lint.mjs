#!/usr/bin/env node
// Dependency-free lint for the bc-security plugin marketplace.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const CORE = 'bc-security-core';
const RULE_ID = /^BCS-(CODE|SEC|INFRA|AI)-\d{3}$/;
const RULE_HEADING = /^###\s+(BCS-\S+)/;
const FORBIDDEN_TOOLS = ['Edit', 'Write', 'NotebookEdit', 'Bash'];

const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();
const listDirs = (p) =>
  isDir(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort() : [];
const listFiles = (p, ext) =>
  isDir(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isFile() && d.name.endsWith(ext)).map((d) => d.name).sort() : [];
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export function lint(rootDir) {
  const root = path.resolve(rootDir);
  const errors = [];
  const rel = (p) => path.relative(root, p).split(path.sep).join('/');
  const err = (file, msg) => errors.push(`${rel(file)}: ${msg}`);
  const readJson = (file) => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      err(file, `cannot read JSON (${e.code === 'ENOENT' ? 'file not found' : e.message})`);
      return null;
    }
  };

  const mpFile = path.join(root, '.claude-plugin', 'marketplace.json');
  const marketplace = readJson(mpFile);
  const entries = Array.isArray(marketplace?.plugins) ? marketplace.plugins : [];
  const pluginsDir = path.join(root, 'plugins');

  for (const dir of listDirs(pluginsDir)) {
    const pdir = path.join(pluginsDir, dir);
    const manifestFile = path.join(pdir, '.claude-plugin', 'plugin.json');
    const manifest = readJson(manifestFile);

    // Check 1: marketplace entry
    const source = `./plugins/${dir}`;
    const entry = entries.find((e) => e.source === source);
    if (!entry) {
      err(mpFile, `plugin directory plugins/${dir} has no entry with source "${source}"`);
    } else if (manifest && entry.name !== manifest.name) {
      err(mpFile, `entry name "${entry.name}" does not match name "${manifest.name}" in ${rel(manifestFile)}`);
    }
    if (!manifest) continue;

    // Check 2: dependencies
    const isCore = manifest.name === CORE;
    const deps = manifest.dependencies;
    const depNames = asList(deps).map((d) => (typeof d === 'string' ? d : d?.name));
    if (isCore) {
      if (deps !== undefined && depNames.length > 0) err(manifestFile, `${CORE} must not declare dependencies`);
    } else if (!depNames.includes(CORE)) {
      err(manifestFile, `domain plugin ${manifest.name} must list ${CORE} in dependencies`);
    }

    // Check 3: agents
    const agentsDir = path.join(pdir, 'agents');
    for (const f of listFiles(agentsDir, '.md')) {
      const file = path.join(agentsDir, f);
      const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
      for (const k of ['name', 'description']) if (!fm[k]) err(file, `agent frontmatter missing "${k}"`);
      if (fm.name === 'security-reviewer' || f === 'security-reviewer.md') {
        const tools = asList(fm.tools);
        const disallowed = asList(fm.disallowedTools);
        for (const t of FORBIDDEN_TOOLS) {
          if (tools.includes(t)) err(file, `security-reviewer must not list ${t} in tools`);
          if (!disallowed.includes(t)) err(file, `security-reviewer disallowedTools must include ${t}`);
        }
      }
    }

    // Check 4: skills
    const skillsDir = path.join(pdir, 'skills');
    for (const s of listDirs(skillsDir)) {
      const file = path.join(skillsDir, s, 'SKILL.md');
      if (!fs.existsSync(file)) {
        err(file, 'skill directory has no SKILL.md');
        continue;
      }
      const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
      if (!fm.name) err(file, 'skill frontmatter missing "name"');
      const d = typeof fm.description === 'string' ? fm.description : '';
      if (d.length < 1 || d.length > 1024) {
        err(file, `skill description must be 1-1024 chars (got ${d.length})`);
      }
    }

    // Check 6: fixtures need expected.json and an eval prompt
    const fixturesDir = path.join(pdir, 'fixtures');
    const referenced = new Set();
    for (const c of listDirs(fixturesDir)) {
      const cdir = path.join(fixturesDir, c);
      const expectedFile = path.join(cdir, 'expected.json');
      if (!fs.existsSync(expectedFile)) {
        err(cdir, 'fixture is missing expected.json');
      } else {
        const exp = readJson(expectedFile);
        for (const id of asList(exp?.rule_ids)) referenced.add(id);
      }
      const prompt = path.join(pdir, 'evals', c, 'prompt.md');
      if (!fs.existsSync(prompt)) {
        err(cdir, `fixture has no matching eval prompt (expected ${rel(prompt)})`);
      }
    }

    // Check 5: rule IDs in domain plugins
    if (!isCore) {
      for (const s of listDirs(skillsDir)) {
        const refDir = path.join(skillsDir, s, 'references');
        for (const f of listFiles(refDir, '.md')) {
          const file = path.join(refDir, f);
          for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
            const m = line.match(RULE_HEADING);
            if (!m) continue;
            if (!RULE_ID.test(m[1])) {
              err(file, `invalid rule ID "${m[1]}" (expected BCS-(CODE|SEC|INFRA|AI)-NNN)`);
            } else if (!referenced.has(m[1])) {
              err(file, `rule ${m[1]} is not referenced by any fixtures/*/expected.json in ${manifest.name}`);
            }
          }
        }
      }
    }
  }

  // Marketplace entries pointing at missing directories
  for (const e of entries) {
    if (typeof e.source === 'string' && e.source.startsWith('./') && !isDir(path.join(root, e.source))) {
      err(mpFile, `entry "${e.name}" source "${e.source}" does not exist`);
    }
  }

  return { errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { errors } = lint(process.argv[2] ?? '.');
  if (errors.length) {
    console.error(errors.map((e) => `error: ${e}`).join('\n'));
    console.error(`\n${errors.length} lint error(s)`);
    process.exit(1);
  }
  console.log('lint ok');
}
