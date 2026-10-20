#!/usr/bin/env node
// Makes blind copies of suites for the human review of E5a (plan v2, section E5a).
//
//   node bench/prepare-review.mjs --suite A1=<path of suite A>@gen-1 --suite B1=<path of suite B>@gen-1
//   node bench/prepare-review.mjs --suite ... --dest <folder, default RUNS/review> --harness-repo <suite B repo>
//
// Give all suites of one review round in one call. A second call continues the numbers (suite-3, suite-4).
// For each suite, the script extracts the files of <ref> (git archive) into <dest>/suite-<k>. The order of k is random.
// The copy does not get the harness files. The same list applies to each suite, also to a suite A:
//   1. the paths of `git diff --name-only baseline harness-v1` in --harness-repo (default RUNS/<precise dir>/run-1/suite-b),
//   2. all files in the agent configuration folders .claude/ and .githooks/ (an agent can add files there),
//   3. all files in the output folders .agent-log/, .playwright-mcp/ and test-results/.
// Other folders of the harness (docs/, scripts/) use only the exact list 1: an agent can put its own files there.
// Exception: package.json, package-lock.json, playwright.config.ts and tsconfig.json stay when the ref holds them.
// The tests need them to run. The harness changes .gitignore, so no copy holds .gitignore. Each copy ignores
// node_modules/ and the Playwright outputs through .git/info/exclude.
// package.json of each copy gets the same "scripts": {"test": "playwright test"}. The npm scripts of the harness
// name removed files and would show which copy is B.
// The extracted files get the time of the extraction (tar -m), not the time of the source commit.
// node_modules: cp -Rp from the working tree of the source suite (a symlink would show the source path).
// Each copy gets `git init` and one commit "Review start", so `git diff` shows the edits of the reviewer.
// `npx playwright test --list` must pass in each copy (offline, no app).
// The mapping suite-<k> -> label, path, ref goes only to bench/results/review-mapping.json. The output names only the copies.
// The mapping also holds, for each copy, the paths that rules 2 and 3 removed and the npm scripts before the change.
// If a step fails, the script removes the copies of this call and does not write the mapping.
import { randomInt } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { LAB, RESULTS, RUNS, log, must, opt, run } from './lib.mjs'

export const PROJECT_FILES = ['package.json', 'package-lock.json', 'playwright.config.ts', 'tsconfig.json']
export const HARNESS_DIRS = ['.agent-log/', '.claude/', '.githooks/', '.playwright-mcp/', 'test-results/']
export const REVIEW_SCRIPTS = { test: 'playwright test' }
const EXCLUDE = ['node_modules/', '/test-results/', '/playwright-report/', '/blob-report/', '/playwright/.cache/', '.playwright-mcp/', '.agent-log/']
const MAPPING = path.join(RESULTS, 'review-mapping.json')
const gitList = (repo, cmd, ...args) => must('git', ['-C', repo, cmd, '-z', ...args]).split('\0').filter(Boolean)

// The folder name of the condition "precise" in bench/conditions.json. Arsen can change it to a neutral name.
function preciseDir () {
  const f = path.join(LAB, 'bench', 'conditions.json')
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).conditions.precise.dir : 'precise'
}

// The harness paths: { files: Set of exact paths, dirs: [folder prefixes with a slash at the end] }.
export function harnessPaths (repo) {
  return { files: new Set(gitList(repo, 'diff', '--name-only', 'baseline', 'harness-v1')), dirs: HARNESS_DIRS }
}

export const isHarness = (file, h) => !PROJECT_FILES.includes(file) && (h.files.has(file) || h.dirs.some(d => file.startsWith(d)))

// Extracts the files of <ref> without the harness paths into <dir>. Returns the kept and the dropped paths.
export function extractCopy (src, ref, dir, harness) {
  const all = gitList(src, 'ls-tree', '-r', '--name-only', ref)
  const kept = all.filter(f => !isHarness(f, harness))
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'review-tar-'))
  try {
    const tar = path.join(tmp, 'copy.tar')
    must('git', ['--literal-pathspecs', '-C', src, 'archive', '--format=tar', '-o', tar, ref, '--', ...kept])
    fs.mkdirSync(dir, { recursive: true })
    must('tar', ['-x', '-m', '-f', tar, '-C', dir])
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  return { kept, dropped: all.filter(f => isHarness(f, harness)) }
}

// Gives package.json of a copy the same scripts as each other copy. Returns the script names before the change.
export function normalizePackage (dir) {
  const f = path.join(dir, 'package.json')
  if (!fs.existsSync(f)) return null
  const pkg = JSON.parse(fs.readFileSync(f, 'utf8'))
  const before = Object.keys(pkg.scripts ?? {})
  pkg.scripts = { ...REVIEW_SCRIPTS }
  fs.writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n')
  return before
}

// The harness paths (files and folders) in a copy. node_modules/ and .git/ are not part of the check.
export function leftoverHarness (dir, harness) {
  const found = []
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const p = rel ? `${rel}/${e.name}` : e.name
      if (p === 'node_modules' || p === '.git') continue
      if (isHarness(e.isDirectory() ? `${p}/` : p, harness)) found.push(p)
      else if (e.isDirectory()) walk(p)
    }
  }
  walk('')
  return found
}

export function initRepo (dir) {
  const git = (...args) => must('git', ['-C', dir, ...args])
  git('init', '-q', '-b', 'main')
  fs.appendFileSync(path.join(dir, '.git', 'info', 'exclude'), EXCLUDE.join('\n') + '\n')
  git('add', '-A')
  git('-c', 'user.name=review', '-c', 'user.email=review@localhost', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null',
    'commit', '-q', '-m', 'Review start')
}

// The values of each --suite option, parsed as <label>=<path>@<ref>.
function suiteArgs () {
  const values = process.argv.flatMap((a, i) => a === '--suite' ? [process.argv[i + 1]] : [])
  return values.map(v => {
    const m = v?.match(/^([^=]+)=(.+)@([^@]+)$/)
    if (!m) throw new Error(`--suite ${v}: use <label>=<path>@<ref>`)
    return { label: m[1], path: path.resolve(m[2]), ref: m[3] }
  })
}

function shuffle (items) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// The copy of one suite. The harness check runs last: the --list run can write test-results/.
// Returns the data for the mapping: the paths that the folder rules removed, the npm scripts before the change.
function prepareCopy (s, dir, harness) {
  const name = path.basename(dir)
  const { dropped } = extractCopy(s.path, s.ref, dir, harness)
  const originalScripts = normalizePackage(dir)
  must('cp', ['-Rp', path.join(s.path, 'node_modules'), path.join(dir, 'node_modules')])
  initRepo(dir)
  const r = run('npx', ['playwright', 'test', '--list'], { cwd: dir })
  if (r.code !== 0) throw new Error(`${name}: npx playwright test --list failed (exit ${r.code}):\n${r.out.slice(-2000)}`)
  fs.rmSync(path.join(dir, 'test-results'), { recursive: true, force: true })
  const dirty = must('git', ['-C', dir, 'status', '--porcelain'])
  if (dirty) throw new Error(`${name}: playwright --list changed the files:\n${dirty}`)
  const left = leftoverHarness(dir, harness)
  if (left.length) throw new Error(`${name} holds harness paths: ${left.join(', ')}`)
  return { droppedByFolder: dropped.filter(f => !harness.files.has(f)), originalScripts }
}

function main () {
  const suites = suiteArgs()
  const dest = path.resolve(opt('--dest', path.join(RUNS, 'review')))
  const harnessRepo = path.resolve(opt('--harness-repo', path.join(RUNS, preciseDir(), 'run-1', 'suite-b')))
  if (suites.length === 0) throw new Error('give at least one --suite <label>=<path>@<ref>')
  const labels = suites.map(s => s.label)
  if (new Set(labels).size !== labels.length) throw new Error(`labels repeat: ${labels.join(', ')}`)
  for (const s of suites) {
    s.commit = must('git', ['-C', s.path, 'rev-parse', '--verify', '--quiet', `${s.ref}^{commit}`])
    if (!fs.existsSync(path.join(s.path, 'node_modules'))) throw new Error(`no node_modules in ${s.path}`)
  }
  const harness = harnessPaths(harnessRepo)
  const mapping = fs.existsSync(MAPPING) ? JSON.parse(fs.readFileSync(MAPPING, 'utf8')) : {}
  const first = Object.keys(mapping).length + 1
  const plan = shuffle(suites).map((s, i) => ({ ...s, name: `suite-${first + i}` }))
  for (const p of plan) {
    if (fs.existsSync(path.join(dest, p.name))) throw new Error(`${path.join(dest, p.name)} exists`)
  }
  log(`${plan.length} copies in ${dest}. Harness paths: ${harness.files.size} files and the folders ${harness.dirs.join(' ')}`)

  const made = []
  try {
    for (const p of plan) {
      const dir = path.join(dest, p.name)
      made.push(dir)
      p.removed = prepareCopy(p, dir, harness)
      log(`${p.name} ready`)
    }
  } catch (e) {
    for (const dir of made) fs.rmSync(dir, { recursive: true, force: true })
    throw e
  }
  const preparedAt = new Date().toISOString()
  for (const p of plan) mapping[p.name] = { label: p.label, path: p.path, ref: p.ref, commit: p.commit, dest, preparedAt, ...p.removed }
  fs.mkdirSync(RESULTS, { recursive: true })
  fs.writeFileSync(MAPPING, JSON.stringify(mapping, null, 2) + '\n')
  log(`mapping: ${path.relative(LAB, MAPPING)}. Do not open it before the review ends.`)
}

if (import.meta.main) {
  try {
    main()
  } catch (e) {
    console.error(`error: ${e.message}`)
    process.exit(1)
  }
}
