// Tests of bench/e4-prepare.mjs: the five subcommands of E4 and the header comment.
//
//   PATH=~/.local/node-v24.21.0/bin:$PATH node --test bench/test/e4-prepare.test.mjs
//
// A temp folder acts as RUNS (E4_RUNS), and its path holds a space. It holds fake git repositories: a template with the
// tags baseline and harness-v1, and client suites A with the tag gen-1. The test cases of a fake suite are copies of
// the lab sets at their tags. A fake npm (E4_NPM) records its calls and adds the new packages to package-lock.json.
// The fake reports come from markdown() of bench/run-audit-tamper.mjs and toMarkdown() of bench/run-audit-mutate.mjs.
// The mutants.md table is made up. The tests do not open sealed/ and do not read bench/results/.
// One test runs the real npm install --offline in a temp clone of the real client suite vague A-1, with a bare clone of
// the real template. It skips with a message when the npm cache does not hold a package.
// The tests do not change the lab or the run folders. They remove the temp folder at the end.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { LAB, RUNS } from '../lib.mjs'
import { markdown } from '../run-audit-tamper.mjs'
import { toMarkdown } from '../run-audit-mutate.mjs'
import { checkTitle, cleanReport, forbiddenWord, mergePackage, parseSteps, readMutantsTable, reportFlags, rulesTable, score, stepCounts, stepProblem, tamperFlags, treeSha, unionFlags } from '../e4-prepare.mjs'

const NODE = process.execPath
const SCRIPT = path.join(LAB, 'bench', 'e4-prepare.mjs')
const STE_LINT = path.join(LAB, '.claude', 'skills', 'asd-ste100', 'scripts', 'ste-lint.py')
const NO_LINT = fs.existsSync(STE_LINT) ? false : 'no ste-lint.py'
const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'e4-prepare-test-')))
const RUNS_T = path.join(TMP, 'my runs')
const TEMPLATE = path.join(RUNS_T, 'templates', 'suite-b-precise.git')
const SUITE = path.join(RUNS_T, 'set-2', 'run-1', 'suite-a')
const FAKE_NPM = path.join(TMP, 'bin', 'fake-npm.cjs')
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t.invalid',
  GIT_CONFIG_GLOBAL: path.join(TMP, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1'
}
const NPM_ARGS = ['install', '--offline', '--no-audit', '--no-fund']
// The step counts of the two lab sets at their tags.
const V1 = stepCounts({ labTag: 'test-cases-v1', labDir: 'test-cases' })
const VAGUE = stepCounts({ labTag: 'test-cases-v2-vague', labDir: 'test-cases-vague' })
after(() => fs.rmSync(TMP, { recursive: true, force: true }))

const sha256 = data => crypto.createHash('sha256').update(data).digest('hex')
const g = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', env: GIT_ENV }).trim()
const read = f => fs.readFileSync(f, 'utf8')
const json = v => JSON.stringify(v, null, 2) + '\n'
let npmLogs = 0

// Runs the script with RUNS_T as RUNS and the fake npm. Each run gets a new npm log file.
function e4 (args, extra = {}) {
  const npmLog = path.join(TMP, `npm-${++npmLogs}.jsonl`)
  const r = spawnSync(NODE, [SCRIPT, ...args], { encoding: 'utf8', env: { ...GIT_ENV, E4_RUNS: RUNS_T, E4_NPM: FAKE_NPM, FAKE_NPM_LOG: npmLog, ...extra } })
  const calls = fs.existsSync(npmLog) ? read(npmLog).trim().split('\n').map(l => JSON.parse(l)) : []
  return { code: r.status, out: r.stdout, err: r.stderr, calls }
}

function write (root, files) {
  for (const [f, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true })
    fs.writeFileSync(path.join(root, f), text)
  }
}

function commit (dir, files, msg, tag) {
  write(dir, files)
  g(dir, 'add', '-A')
  g(dir, 'commit', '-q', '-m', msg)
  if (tag) g(dir, 'tag', '-a', tag, '-m', tag)
}

function newRepo (dir) {
  fs.mkdirSync(dir, { recursive: true })
  g(dir, 'init', '-q', '-b', 'main')
  return dir
}

// The files of a lab test case set at its tag, as { 'test-cases/<name>': bytes }.
function labSet (tag, sub) {
  const names = execFileSync('git', ['-C', LAB, 'ls-tree', '-r', '-z', '--name-only', tag, sub], { encoding: 'utf8' }).split('\0').filter(Boolean)
  return Object.fromEntries(names.map(n => [`test-cases/${n.slice(sub.length + 1)}`, execFileSync('git', ['-C', LAB, 'show', `${tag}:${n}`])]))
}

// The file lines and the folder sha256 by the method of tc_hash() in bench/run-generation.sh, outside node_modules.
function nodeTree (dir) {
  const files = fs.readdirSync(dir, { recursive: true }).map(f => f.split(path.sep).join('/'))
    .filter(f => !f.startsWith('node_modules/') && f !== 'node_modules' && fs.lstatSync(path.join(dir, f)).isFile())
  const lines = files.map(f => `./${f}`).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))
    .map(f => `${sha256(fs.readFileSync(path.join(dir, f)))}  ${f}`)
  return { lines, sha: sha256(lines.join('\n') + '\n') }
}

const PKG = (scripts, devDependencies) => json({ name: 'juice-shop-tests', version: '1.0.0', scripts, devDependencies })
const LOCK = packages => json({ name: 'juice-shop-tests', lockfileVersion: 3, packages: { '': {}, ...packages } })
const BASELINE = {
  '.gitignore': 'node_modules/\n',
  'package.json': PKG({}, { '@playwright/test': '^1.64.1' }),
  'package-lock.json': LOCK({ 'node_modules/@playwright/test': { version: '1.64.1' } }),
  'playwright.config.ts': 'export default {}\n'
}
const HARNESS = {
  '.claude/settings.json': '{}\n',
  '.claude/rules/a.md': '# Rule A\n',
  '.githooks/pre-commit': '#!/bin/sh\nexit 0\n',
  '.gitignore': 'node_modules/\n.agent-log/\n',
  'CLAUDE.md': '# Harness rules\n',
  'docs/notes.md': 'harness notes\n',
  'eslint.config.mjs': 'export default []\n',
  'scripts/lint.mjs': 'console.log("lint")\n',
  'tsconfig.json': '{}\n',
  'package.json': PKG({ test: 'playwright test', lint: 'eslint .', 'hooks:install': 'git config core.hooksPath .githooks' },
    { '@playwright/test': '^1.64.1', eslint: '^9.39.5', typescript: '^5.9.3' }),
  'package-lock.json': LOCK({ 'node_modules/@playwright/test': { version: '1.64.1' }, 'node_modules/eslint': { version: '9.39.5' } })
}
const CLIENT = {
  'package.json': PKG({ test: 'playwright test --reporter=list' }, { '@playwright/test': '^1.64.1', z85: '0.0.2' }),
  'package-lock.json': LOCK({ 'node_modules/@playwright/test': { version: '1.64.1' }, 'node_modules/z85': { version: '0.0.2' } }),
  'CLAUDE.md': '# The notes of the client\n',
  'docs/notes.md': 'client notes\n',
  'tests/tc-01-login.spec.ts': 'test("TC-01", () => {})\n'
}
const FAKE_NPM_CODE = `#!${NODE}
const fs = require('fs')
fs.appendFileSync(process.env.FAKE_NPM_LOG, JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2) }) + '\\n')
if (process.env.FAKE_NPM_FAIL) { console.error('npm error code ENOTCACHED'); process.exit(1) }
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))
lock.packages[''].devDependencies = pkg.devDependencies
for (const n of Object.keys(pkg.devDependencies)) lock.packages['node_modules/' + n] ??= { version: '9.9.9', dev: true }
if (process.env.FAKE_NPM_BUMP) lock.packages['node_modules/@playwright/test'].version = '2.0.0'
fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\\n')
fs.mkdirSync('node_modules/@playwright/test', { recursive: true })
fs.writeFileSync('node_modules/.package-lock.json', JSON.stringify(lock))
console.log('added ' + Object.keys(pkg.devDependencies).length + ' packages in 0s')
`

// The reports of the two tools, in their real markdown form. A line of each report names a path in the lab.
const LAB_PATH = path.join(LAB, 'bench', 'results', 'tamper-x9', 'rules', 'T03-a.json')
const fired = (test, tc, passed) => ({ test, tc, passed, statuses: [passed ? 'passed' : 'failed'], stableInRecheck: passed ? null : true, changedResponses: 1,
  sample: [{ method: 'GET', path: '/rest/basket/1', changes: [{ field: 'data.Products[0].price', old: 1.99, new: 2.99 }], changedFields: 1 }] })
const ruleRow = (id, verdict, firedList, problems = []) => ({ id, what: `value of ${id}`, method: 'GET', path: '^/rest/basket/', field: 'data.Products[*].price', op: 'add', value: 1,
  verdict, problems, fired: firedList, noise: [], skips: 0, skipReasons: [], changesOutsideTests: 0, exit: 0, proxyExit: { code: 0, signal: null, early: false } })
const TAMPER_OUT = {
  generatedAt: '2026-10-21T12:00:00.000Z',
  out: 'tamper-x9',
  suite: { label: 'client', path: path.join(RUNS, 'set-2', 'run-1', 'suite-a'), commit: 'a'.repeat(40), tags: ['gen-1'] },
  rulesFile: path.join(LAB, 'bench', 'tamper-rules.json'),
  rulesSha256: 'b'.repeat(64),
  passthrough: { tests: 8, browserRequests: 120 },
  recheck: { runs: 3, stable: [], problems: [] },
  recheckRuns: 3,
  rules: [
    ruleRow('T02-a', 'survived', [fired('tests/tc-03.spec.ts :: TC-03 > quantity', 'TC-03', true), fired('tests/tc-05.spec.ts :: TC-05 > coupon', 'TC-05', false)]),
    ruleRow('T03-a', 'caught', [fired('tests/tc-03.spec.ts :: TC-03 > quantity', 'TC-03', true), fired('tests/tc-04.spec.ts :: TC-04 > limit', 'TC-04', false)]),
    ruleRow('T14-a', 'survived', [fired('tests/tc-07.spec.ts :: TC-07 > order', 'TC-07', true)]),
    ruleRow('T01-a', 'survived', [fired('tests/setup.spec.ts :: products', null, true)]),
    ruleRow('T06-a', 'invalid', [fired('tests/tc-07.spec.ts :: TC-07 > order', 'TC-07', true)], [`no Playwright report (${LAB_PATH}), exit 1: x`]),
    ruleRow('T15-b', 'invalid', [], ['Playwright exit 130 (interrupted)']),
    ruleRow('T13-a', 'not exercised', [])
  ],
  summary: { rules: 7, caught: 1, survived: 3, notExercised: 1, invalid: 2 }
}
const MUTATE_OUT = {
  label: 'client', generatedAt: '2026-10-21T12:00:00.000Z', suite: path.join(RUNS, 'set-2', 'run-1', 'suite-a'), ref: 'gen-1', commit: 'c'.repeat(40),
  typescript: '5.9.3', restartEvery: 5, max: null, complete: true,
  totals: { sites: 2, mutants: 2, killed: 0, survived: 1, error: 1, skipped: 0 },
  baseline: { report: 'mutate-x9/baseline.json', tests: 1, leftOut: [] },
  tests: { 'tests/tc-01-login.spec.ts :: TC-01 > login': { id: 'T01', sites: 2, killed: 0, survived: 1, error: 1 } },
  mutants: [
    { id: 'M001', file: 'tests/tc-01-login.spec.ts', line: 3, function: 'test', original: "'Login'", mutated: "'Login_mut'", targets: [], tests: ['tests/tc-01-login.spec.ts :: TC-01 > login'], status: 'survived', counted: [] },
    { id: 'M002', file: 'tests/tc-01-login.spec.ts', line: 4, function: 'test', original: '1', mutated: '2', targets: [], tests: ['tests/tc-01-login.spec.ts :: TC-01 > login'], status: 'error', note: `no report, exit 1: ENOENT ${path.join(LAB, 'bench', 'results', 'mutate-x9', 'M002.json')}`, counted: [] }
  ],
  notMutated: []
}
const TAMPER_MD = markdown(TAMPER_OUT)
const MUTATE_MD = toMarkdown(MUTATE_OUT)

before(() => {
  write(TMP, { gitconfig: '', 'bin/fake-npm.cjs': FAKE_NPM_CODE })
  fs.chmodSync(FAKE_NPM, 0o755)
  // The template: baseline, the harness (harness-v1), then the test cases.
  const work = newRepo(path.join(TMP, 'template-work'))
  commit(work, BASELINE, 'Baseline', 'baseline')
  write(work, HARNESS)
  fs.chmodSync(path.join(work, '.githooks', 'pre-commit'), 0o755)
  commit(work, {}, 'Add the test harness', 'harness-v1')
  commit(work, labSet('test-cases-v1', 'test-cases'), 'Add test cases')
  fs.mkdirSync(path.dirname(TEMPLATE), { recursive: true })
  execFileSync('git', ['clone', '-q', '--bare', '--no-local', work, TEMPLATE], { env: GIT_ENV })
  // The client suite A of the vague set: gen-1 holds the vague set. gen-2 has a changed test case. A commit after gen-1.
  newRepo(SUITE)
  commit(SUITE, BASELINE, 'Baseline', 'baseline')
  commit(SUITE, labSet('test-cases-v2-vague', 'test-cases-vague'), 'Add test cases')
  commit(SUITE, CLIENT, 'Generation run', 'gen-1')
  commit(SUITE, { 'test-cases/README.md': 'changed\n' }, 'A change of the test cases', 'gen-2')
  g(SUITE, 'checkout', '-q', '-B', 'main', 'gen-1')
  commit(SUITE, { 'tests/later.spec.ts': 'later\n' }, 'A commit after gen-1')
  write(SUITE, { 'node_modules/@playwright/test/package.json': '{}\n', 'node_modules/.package-lock.json': '{}\n', 'test-results/x.txt': 'x\n' })
  // A suite of the condition haiku (precise set) that holds the vague set, and a suite B.
  for (const s of ['set-3/run-3/suite-a', 'set-2/run-1/suite-b']) {
    execFileSync('git', ['clone', '-q', '--no-local', SUITE, path.join(RUNS_T, s)], { env: GIT_ENV })
    fs.cpSync(path.join(SUITE, 'node_modules'), path.join(RUNS_T, s, 'node_modules'), { recursive: true })
  }
})

// --- the header comments ---------------------------------------------------------------------------------------------

test('the header comments of the script and of this test file have 0 hard STE violations', { skip: NO_LINT }, () => {
  const header = file => read(file).split('\n').slice(file === SCRIPT ? 1 : 0).filter((l, i, a) => a.slice(0, i + 1).every(x => x.startsWith('//')))
    .map(l => l.replace(/^\/\/ ?/, '')).join('\n')
  for (const file of [SCRIPT, fileURLToPath(import.meta.url)]) {
    const text = header(file)
    assert.ok(text.split('\n').length > 5, file)
    const lint = spawnSync('python3', [STE_LINT], { input: text, encoding: 'utf8' })
    assert.equal(lint.status, 0, lint.stdout + lint.stderr)
    assert.match(lint.stdout, /\(0 hard,/)
  }
  assert.equal(e4(['--help']).out.trim(), header(SCRIPT).trim())
})

// --- the parsers --------------------------------------------------------------------------------------------------------

test('parseSteps: the known forms of the step column', () => {
  const k = list => list.map(s => `${s.tc}#${s.step}`)
  assert.deepEqual(k(parseSteps('TC-07 step 8')), ['TC-07#8'])
  assert.deepEqual(k(parseSteps('TC-07 steps 8 and 9')), ['TC-07#8', 'TC-07#9'])
  assert.deepEqual(k(parseSteps('TC-07 step 8, TC-05 step 4')), ['TC-07#8', 'TC-05#4'])
  assert.deepEqual(k(parseSteps('TC-02 to TC-04')), ['TC-02#null', 'TC-03#null', 'TC-04#null'])
  assert.deepEqual(k(parseSteps('TC-02 steps 2 to 4. TC-03 steps 1, 5.')), ['TC-02#2', 'TC-02#3', 'TC-02#4', 'TC-03#1', 'TC-03#5'])
  assert.deepEqual(k(parseSteps('TC-07 steps 8, 9 and 10 and TC-01 step 2')), ['TC-07#8', 'TC-07#9', 'TC-07#10', 'TC-01#2'])
  for (const bad of ['TC-07 step 8 (total)', 'tc-07 step 8', 'TC-07 steps 8-9', 'TC-07 steps', 'none', '-', 'TC-08 to TC-02', 'TC-07 steps 9 to 8',
    'TC-02 to TC-08 step 3', 'TC-02 to TC-04 steps 1 to 5', 'TC-01 step 2, TC-02 to TC-03 step 1']) {
    assert.throws(() => parseSteps(bad), /unknown form|goes down/, bad)
  }
})

test('stepCounts and stepProblem: the step rows of the lab sets at their tags', () => {
  const counts = { 'TC-01': 5, 'TC-02': 4, 'TC-03': 5, 'TC-04': 5, 'TC-05': 5, 'TC-06': 5, 'TC-07': 10, 'TC-08': 10 }
  assert.deepEqual(V1, { source: 'test-cases-v1:test-cases', counts })
  assert.deepEqual(VAGUE, { source: 'test-cases-v2-vague:test-cases-vague', counts })
  assert.equal(stepProblem(V1, 'TC-07', 10), null)
  assert.equal(stepProblem(V1, 'TC-02', null), null)
  assert.match(stepProblem(V1, 'TC-07', 0), /TC-07 has no step 0 \(TC-07 has the steps 1 to 10 in test-cases-v1:test-cases\)/)
  assert.match(stepProblem(V1, 'TC-01', 6), /TC-01 has no step 6/)
  assert.match(stepProblem(V1, 'TC-09', null), /test-cases-v1:test-cases has no TC-09/)
  assert.throws(() => stepCounts({ labTag: 'test-cases-v1', labDir: 'test-cases-vague' }), /no files TC-NN-\*\.md in test-cases-v1:test-cases-vague/)
})

test('rulesTable: the frozen table "The rules" at the tag hypotheses-v2', () => {
  const t = rulesTable(execFileSync('git', ['-C', LAB, 'show', 'hypotheses-v2:bench/hypotheses-v2.md'], { encoding: 'utf8' }))
  assert.deepEqual(Object.keys(t), Array.from({ length: 16 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`))
  const k = id => t[id].map(s => `${s.tc}#${s.step}`)
  assert.deepEqual(k('T01'), ['TC-02#1'])
  assert.deepEqual(k('T02'), ['TC-02#3', 'TC-02#4', 'TC-03#1', 'TC-03#2', 'TC-03#3', 'TC-03#4', 'TC-03#5', 'TC-04#2', 'TC-04#4',
    'TC-05#5', 'TC-06#5', 'TC-07#2', 'TC-07#6', 'TC-08#2', 'TC-08#6', 'TC-08#7'])
  assert.deepEqual(k('T13'), ['TC-08#2', 'TC-08#5', 'TC-08#6', 'TC-08#9'])
  assert.deepEqual(k('T15').filter(s => s.startsWith('TC-08')), ['TC-08#4', 'TC-08#8'])
  assert.throws(() => rulesTable('| Rule | Test case steps |\n|---|---|\n| T01 | TC-02 to TC-03 |\n'), /no step/)
})

const SEALED_MD = [
  '# Patches', '', 'A made-up table in the form of the summary table of sealed/mutants.md.', '',
  '| ID | Patch | File | Kind | Expected catch |', '|---|---|---|---|---|',
  '| M01 | `01-basket-total.patch` | `frontend/src/basket.ts` | bug | TC-07 steps 8 and 9 |',
  '| M02 | `02-wallet.patch` | `routes/wallet.ts` | bug | TC-08 step 9 |',
  '| M03 | `03-any-page.patch` | `routes/basket.ts` | bug | TC-02 to TC-08 |',
  '| M08 | `08-coupon-op.patch` | `routes/coupon.ts` | operator | TC-06 step 5 |',
  '| M09 | `09-two-places.patch` | `routes/order.ts` | bug | TC-05 step 4, TC-03 step 2 |',
  '| M13 | `13-email.patch` | `routes/user.ts` | bug | TC-01 step 5 |', ''
].join('\n')

test('readMutantsTable: the regex of readMutants(), the step column and the steps of the set', () => {
  const rows = readMutantsTable(SEALED_MD, V1)
  assert.deepEqual(rows.map(r => [r.id, r.patch, r.kind, r.expected]), [
    ['M01', '01-basket-total.patch', 'bug', 'TC-07 steps 8 and 9'], ['M02', '02-wallet.patch', 'bug', 'TC-08 step 9'],
    ['M03', '03-any-page.patch', 'bug', 'TC-02 to TC-08'], ['M08', '08-coupon-op.patch', 'operator', 'TC-06 step 5'],
    ['M09', '09-two-places.patch', 'bug', 'TC-05 step 4, TC-03 step 2'], ['M13', '13-email.patch', 'bug', 'TC-01 step 5']])
  assert.equal(rows[2].targets.length, 7)
  const bad = (from, to) => () => readMutantsTable(SEALED_MD.replace(from, to), V1)
  assert.throws(bad('TC-01 step 5', 'TC-01 step 5 (the menu)'), /unknown form/)
  assert.throws(bad('TC-02 to TC-08', 'TC-02 to TC-08 step 3'), /unknown form .*a test case range with steps/)
  assert.throws(bad('TC-01 step 5', 'TC-01 step 6'), /patch M13, "TC-01 step 6": TC-01 has no step 6/)
  assert.throws(bad('TC-08 step 9', 'TC-08 step 0'), /patch M02, "TC-08 step 0": TC-08 has no step 0/)
  assert.throws(bad('TC-07 steps 8 and 9', 'TC-07 steps 9 and 11'), /patch M01, .*TC-07 has no step 11/)
  assert.throws(bad('TC-02 to TC-08', 'TC-02 to TC-09'), /patch M03, .*has no TC-09/)
  assert.throws(() => readMutantsTable('# No table\n', V1), /no row/)
  assert.throws(bad('| M02 |', '| M01 |'), /repeated/)
  assert.throws(() => readMutantsTable(SEALED_MD), /give the test case set/)
})

// --- clean-reports ------------------------------------------------------------------------------------------------------

test('cleanReport: the header lines and the lines with a lab path go, the other lines stay', () => {
  const t = cleanReport(TAMPER_MD, 'tamper')
  assert.deepEqual(t.removed.map(r => r.why.replace(/\(.*\)/, '(...)')), ['the header line "Source:"', 'the header line "Suite"',
    'the header line "Rules: with the rules file"', 'it names a path (...)'])
  assert.match(t.removed[3].text, /^- T06-a: no Playwright report/)
  assert.deepEqual(t.text.split('\n'), TAMPER_MD.split('\n').filter(l => !t.removed.some(r => r.text === l)))
  assert.match(t.text, /^Rules: 7\. Caught: 1\. Survived: 3\./m)
  assert.doesNotMatch(t.text, /harness-demo|bench\/|Source:|^Suite/m)
  const m = cleanReport(MUTATE_MD, 'mutate')
  assert.deepEqual(m.removed.map(r => r.line), [3, MUTATE_MD.split('\n').findIndex(l => l.startsWith('| M002 |')) + 1])
  assert.match(m.text, /^\| M001 \|/m)
  assert.throws(() => cleanReport(MUTATE_MD, 'tamper'), /does not start with "# Tamper audit \(<out>\)"/)
  assert.throws(() => cleanReport(TAMPER_MD.replace('\nRun with no rule', '\nSource: again\nRun with no rule'), 'tamper'), /2 lines "Source:", not 1/)
  assert.throws(() => cleanReport(MUTATE_MD.replace(/^Source:.*\n/m, ''), 'mutate'), /0 lines "Source:", not 1/)
})

test('checkTitle: the mutate label client and a neutral --out name in the tamper title', () => {
  checkTitle(TAMPER_MD, 'tamper')
  checkTitle(MUTATE_MD, 'mutate')
  for (const label of ['A1', 'suite-a', 'clients']) {
    assert.throws(() => cleanReport(toMarkdown({ ...MUTATE_OUT, label }), 'mutate'), /does not start with "# Expectation mutation audit: client"/, label)
  }
  const outs = [['tamper-suite-a-run-1', 'suite-a'], ['tamper-A-1', 'a-1'], ['tamper-b2', 'b2'], ['tamper-gen-1', 'gen-1'], ['tamper-vague', 'vague'],
    ['set-2-tamper', 'set-2'], ['tamper-run3', 'run3'], ['tamper-haiku-x1', 'haiku']]
  for (const [out, word] of outs) {
    assert.throws(() => cleanReport(markdown({ ...TAMPER_OUT, out }), 'tamper'), new RegExp(`the title "# Tamper audit \\(${out}\\)" of the tamper report holds "${word}"`), out)
  }
  for (const out of ['tamper-x1', 'tamper-x2', 'agent-1', 'tab-12x']) assert.equal(forbiddenWord(out), null, out)
})

test('clean-reports: writes the two files, prints the removed lines and the sha256, refuses to write again', () => {
  write(TMP, { 'raw/tamper-x9.md': TAMPER_MD, 'raw/mutate-x9.md': MUTATE_MD })
  const dest = path.join(TMP, 'clean out')
  const args = ['clean-reports', '--tamper', path.join(TMP, 'raw', 'tamper-x9.md'), '--mutate', path.join(TMP, 'raw', 'mutate-x9.md'), '--dest', dest]
  const r = e4(args)
  assert.equal(r.code, 0, r.err)
  for (const [f, kind, md] of [['tamper-report.md', 'tamper', TAMPER_MD], ['mutate-report.md', 'mutate', MUTATE_MD]]) {
    const out = path.join(dest, f)
    assert.equal(read(out), cleanReport(md, kind).text)
    assert.ok(r.out.includes(`wrote ${out}, sha256 ${sha256(fs.readFileSync(out))}`), r.out)
  }
  assert.match(r.out, /removed line 3, the header line "Source:"/)
  assert.match(r.out, /removed line \d+, it names a path \(.*\): - T06-a: no Playwright report/)
  const again = e4(args)
  assert.equal(again.code, 1)
  assert.match(again.err, /exists\. Give a new name/)
})

// --- audit-folder ---------------------------------------------------------------------------------------------------

function cleanReportsFolder (name, tamperText = cleanReport(TAMPER_MD, 'tamper').text, mutateText = cleanReport(MUTATE_MD, 'mutate').text) {
  const dir = path.join(TMP, name)
  write(dir, { 'tamper-report.md': tamperText, 'mutate-report.md': mutateText })
  return dir
}

test('audit-folder: the suite at gen-1 with no harness files, node_modules, the reports, no .git', () => {
  const reports = cleanReportsFolder('reports-ok')
  const dest = path.join(RUNS_T, 'room-7')
  const r = e4(['audit-folder', '--suite', `${SUITE}@gen-1`, '--dest', dest, '--reports', reports])
  assert.equal(r.code, 0, r.err + r.out)
  const files = nodeTree(dest)
  assert.deepEqual(files.lines.map(l => l.split('  ')[1]).filter(f => !f.startsWith('./test-cases/')),
    ['./package-lock.json', './package.json', './playwright.config.ts', './reports/mutate-report.md', './reports/tamper-report.md', './tests/tc-01-login.spec.ts'])
  assert.equal(read(path.join(dest, 'package.json')), CLIENT['package.json'])
  for (const f of ['tamper-report.md', 'mutate-report.md']) assert.equal(read(path.join(dest, 'reports', f)), read(path.join(reports, f)))
  assert.ok(fs.existsSync(path.join(dest, 'node_modules', '@playwright', 'test', 'package.json')))
  assert.ok(!fs.existsSync(path.join(dest, '.git')))
  assert.match(r.out, /harness paths not in the copy .*: \.gitignore, CLAUDE\.md, docs\/notes\.md/)
  for (const l of files.lines) assert.ok(r.out.includes(l), l)
  assert.ok(r.out.includes(`folder sha256 (the files outside node_modules, the method of tc_hash in bench/run-generation.sh): ${files.sha}`), r.out)
  // The test-cases/ hash: the same value as tc_hash() of bench/run-generation.sh.
  const tcHash = execFileSync('bash', ['-c', 'cd "$1" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 | shasum -a 256 | cut -d" " -f1', 'bash', path.join(dest, 'test-cases')], { encoding: 'utf8' }).trim()
  assert.equal(treeSha(path.join(dest, 'test-cases')), tcHash)
  assert.ok(r.out.includes(`test-cases/ sha256 ${tcHash} equals test-cases-v2-vague:test-cases-vague`), r.out)
})

test('audit-folder: refusals', () => {
  const reports = cleanReportsFolder('reports-ok-2')
  const raw = cleanReportsFolder('reports-raw', TAMPER_MD)
  const badTitle = cleanReportsFolder('reports-title', cleanReport(TAMPER_MD, 'tamper').text.replace('(tamper-x9)', '(tamper-a1)'))
  const badLabel = cleanReportsFolder('reports-label', undefined, cleanReport(MUTATE_MD, 'mutate').text.replace(': client', ': A1'))
  fs.mkdirSync(path.join(RUNS_T, 'taken'))
  fs.mkdirSync(path.join(RUNS_T, 'sub'))
  const other = newRepo(path.join(TMP, 'other repo'))
  commit(other, { 'a.txt': 'a\n' }, 'one', 'gen-1')
  const cases = [
    ['an existing folder', SUITE, 'gen-1', path.join(RUNS_T, 'taken'), reports, /taken exists/],
    ['a folder outside RUNS', SUITE, 'gen-1', path.join(TMP, 'elsewhere'), reports, /must be a direct child of RUNS/],
    ['a folder below a child of RUNS', SUITE, 'gen-1', path.join(RUNS_T, 'sub', 'room'), reports, /must be a direct child of RUNS/],
    ['a name with "vague"', SUITE, 'gen-1', path.join(RUNS_T, 'Vague-room'), reports, /holds "vague"/],
    ['a name with "haiku"', SUITE, 'gen-1', path.join(RUNS_T, 'room-haiku'), reports, /holds "haiku"/],
    ['a name with "precise"', SUITE, 'gen-1', path.join(RUNS_T, 'precise'), reports, /holds "precise"/],
    ['a name with "audit-x"', SUITE, 'gen-1', path.join(RUNS_T, 'audit-x1'), reports, /holds "audit-x"/],
    ['a name with a set name', SUITE, 'gen-1', path.join(RUNS_T, 'set-2-copy'), reports, /holds "set-2"/],
    ['reports that are not clean', SUITE, 'gen-1', path.join(RUNS_T, 'room-8'), raw, /tamper-report\.md is not clean/],
    ['test cases of the wrong set', path.join(RUNS_T, 'set-3', 'run-3', 'suite-a'), 'gen-1', path.join(RUNS_T, 'room-9'), reports, /not .* of the lab set test-cases-v1:test-cases \(condition haiku\)/],
    ['a changed test case at the ref', SUITE, 'gen-2', path.join(RUNS_T, 'room-10'), reports, /test-cases\/ of .* at gen-2 has sha256 [0-9a-f]{64}, not/],
    ['a suite that is not a run folder', other, 'gen-1', path.join(RUNS_T, 'room-11'), reports, /is not a run folder/],
    ['a ref that does not exist', SUITE, 'gen-7', path.join(RUNS_T, 'room-12'), reports, /no commit gen-7/],
    ['a tamper title with a suite and run ID', SUITE, 'gen-1', path.join(RUNS_T, 'room-13'), badTitle, /tamper-report\.md: the title "# Tamper audit \(tamper-a1\)" of the tamper report holds "a1"/],
    ['a mutate label that is not client', SUITE, 'gen-1', path.join(RUNS_T, 'room-14'), badLabel, /mutate-report\.md: the mutate report does not start with "# Expectation mutation audit: client"/],
    ['a name with a suite and run ID', SUITE, 'gen-1', path.join(RUNS_T, 'desk-b1'), reports, /holds "b1"/]
  ]
  for (const [name, suite, ref, dest, rep, error] of cases) {
    const r = e4(['audit-folder', '--suite', `${suite}@${ref}`, '--dest', dest, '--reports', rep])
    assert.equal(r.code, 1, name)
    assert.match(r.err, error, name)
    if (!name.startsWith('an existing')) assert.ok(!fs.existsSync(dest), `${name}: ${dest} exists`)
  }
  assert.equal(forbiddenWord('room-7'), null)
  assert.equal(forbiddenWord('client-run2'), 'run2')
})

// --- fix-folder -----------------------------------------------------------------------------------------------------

test('mergePackage: the missing scripts and dev dependencies, the client values stay', () => {
  const m = mergePackage(CLIENT['package.json'], HARNESS['package.json'])
  const pkg = JSON.parse(m.text)
  assert.deepEqual(pkg.scripts, { test: 'playwright test --reporter=list', lint: 'eslint .', 'hooks:install': 'git config core.hooksPath .githooks' })
  assert.deepEqual(Object.keys(pkg.devDependencies), ['@playwright/test', 'z85', 'eslint', 'typescript'])
  assert.deepEqual(m.added, { scripts: { lint: 'eslint .', 'hooks:install': 'git config core.hooksPath .githooks' }, devDependencies: { eslint: '^9.39.5', typescript: '^5.9.3' } })
  assert.deepEqual(m.differ, ['scripts.test: the client has "playwright test --reporter=list", the harness has "playwright test"'])
  const dep = mergePackage(json({ dependencies: { eslint: '^9.39.5' } }), HARNESS['package.json'])
  assert.ok(!('eslint' in JSON.parse(dep.text).devDependencies)) // a dependency counts as a dev dependency that the client has
})

test('fix-folder: a new history from gen-1, the harness port with clashing files, the npm step, three commits, the hooks', () => {
  const report = path.join(TMP, 'audit report.md')
  write(TMP, { 'audit report.md': '# Audit\n\nFLAG TC-01 step 2: weak\n' })
  const dest = path.join(RUNS_T, 'desk-3')
  const r = e4(['fix-folder', '--suite', `${SUITE}@gen-1`, '--dest', dest, '--audit-report', report, '--harness-template', TEMPLATE])
  assert.equal(r.code, 0, r.err + r.out)
  // A new history: no commit, tag or message of the run folder. The tree of "Client suite" is the tree of gen-1.
  assert.deepEqual(g(dest, 'log', '--format=%s').split('\n'), ['Add the audit report', 'Add harness', 'Client suite'])
  assert.equal(g(dest, 'rev-parse', 'HEAD~2^{tree}'), g(SUITE, 'rev-parse', 'gen-1^{tree}'))
  assert.equal(g(dest, 'tag'), '')
  assert.doesNotMatch(g(dest, 'log', '--format=%B'), /Generation run|gen-1/)
  assert.equal(g(dest, 'symbolic-ref', '--short', 'HEAD'), 'main')
  assert.equal(g(dest, 'branch', '--format=%(refname:short)'), 'main')
  assert.equal(g(dest, 'remote'), '')
  assert.ok(!fs.existsSync(path.join(dest, '.git', 'logs')))
  assert.equal(g(dest, 'config', '--get', 'core.hooksPath'), '.githooks')
  assert.equal(g(dest, 'status', '--porcelain'), '')
  assert.doesNotMatch(g(dest, 'log', '--format=%s', 'main'), /after gen-1/)
  // The harness files come from harness-v1. The client files with the same path stay.
  assert.deepEqual(g(dest, 'show', '--name-only', '--format=', 'HEAD~1').split('\n').sort(),
    ['.claude/rules/a.md', '.claude/settings.json', '.githooks/pre-commit', 'eslint.config.mjs', 'package-lock.json', 'package.json', 'scripts/lint.mjs', 'tsconfig.json'])
  assert.match(g(dest, 'ls-tree', 'HEAD', '.githooks/pre-commit'), /^100755 /)
  for (const f of ['.claude/settings.json', 'scripts/lint.mjs', 'tsconfig.json']) assert.equal(read(path.join(dest, f)), HARNESS[f])
  for (const f of ['CLAUDE.md', 'docs/notes.md']) assert.equal(read(path.join(dest, f)), CLIENT[f])
  assert.equal(read(path.join(dest, '.gitignore')), BASELINE['.gitignore'])
  assert.equal(read(path.join(dest, 'package.json')), mergePackage(CLIENT['package.json'], HARNESS['package.json']).text)
  const lock = JSON.parse(read(path.join(dest, 'package-lock.json'))).packages
  assert.equal(lock['node_modules/@playwright/test'].version, '1.64.1')
  assert.equal(lock['node_modules/z85'].version, '0.0.2')
  assert.equal(lock['node_modules/eslint'].version, '9.9.9') // the fake npm added it
  assert.deepEqual(g(dest, 'show', '--name-only', '--format=', 'HEAD').split('\n'), ['audit-report.md'])
  assert.equal(read(path.join(dest, 'audit-report.md')), read(report))
  // npm ran two times: first in a temp clone, then in the fix folder.
  assert.deepEqual(r.calls.map(c => c.args), [NPM_ARGS, NPM_ARGS])
  assert.ok(!r.calls[0].cwd.startsWith(RUNS_T), r.calls[0].cwd)
  assert.equal(fs.realpathSync(r.calls[1].cwd), dest)
  assert.match(r.out, /client files that stayed: \.gitignore, CLAUDE\.md, docs\/notes\.md, package-lock\.json, package\.json/)
  assert.match(r.out, /scripts added: \{"lint":"eslint \.","hooks:install":"git config core\.hooksPath \.githooks"\}/)
  assert.match(r.out, /devDependencies added: \{"eslint":"\^9\.39\.5","typescript":"\^5\.9\.3"\}/)
  assert.match(r.out, /the client value stays: scripts\.test/)
  assert.match(r.out, /package-lock\.json: 2 packages added, no version of a client package changed/)
  assert.match(r.out, /core\.hooksPath: \.githooks/)
  assert.match(r.out, /commit [0-9a-f]{40} Add harness/)
  assert.ok(r.out.includes(`audit-report.md: sha256 ${sha256(fs.readFileSync(report))}`), r.out)
})

test('fix-folder: refusals', () => {
  const report = path.join(TMP, 'audit-report.md')
  write(TMP, { 'audit-report.md': '# Audit\n' })
  fs.mkdirSync(path.join(RUNS_T, 'desk-taken'))
  const cases = [
    ['an existing folder', SUITE, path.join(RUNS_T, 'desk-taken'), {}, /desk-taken exists/, 0],
    ['a name with "haiku"', SUITE, path.join(RUNS_T, 'haiku-fix'), {}, /holds "haiku"/, 0],
    ['a suite B', path.join(RUNS_T, 'set-2', 'run-1', 'suite-b'), path.join(RUNS_T, 'desk-4'), {}, /is a suite B/, 0],
    ['test cases of the wrong set', path.join(RUNS_T, 'set-3', 'run-3', 'suite-a'), path.join(RUNS_T, 'desk-5'), {}, /of the lab set test-cases-v1:test-cases/, 0],
    ['the offline install fails', SUITE, path.join(RUNS_T, 'desk-6'), { FAKE_NPM_FAIL: '1' }, /fails in a temp clone \(exit 1\)\. The script does not go online\.[^]*ENOTCACHED/, 1],
    ['npm changes a client version', SUITE, path.join(RUNS_T, 'desk-7'), { FAKE_NPM_BUMP: '1' }, /changed the versions of client packages in package-lock\.json: node_modules\/@playwright\/test 1\.64\.1 to 2\.0\.0[^]*removed/, 2]
  ]
  for (const [name, suite, dest, extra, error, npmCalls] of cases) {
    const r = e4(['fix-folder', '--suite', `${suite}@gen-1`, '--dest', dest, '--audit-report', report, '--harness-template', TEMPLATE], extra)
    assert.equal(r.code, 1, name)
    assert.match(r.err, error, name)
    assert.equal(r.calls.length, npmCalls, name)
    if (!name.startsWith('an existing')) assert.ok(!fs.existsSync(dest), `${name}: ${dest} exists`)
  }
  const noTemplate = e4(['fix-folder', '--suite', `${SUITE}@gen-1`, '--dest', path.join(RUNS_T, 'desk-8'), '--audit-report', report, '--harness-template', SUITE])
  assert.equal(noTemplate.code, 1)
  assert.match(noTemplate.err, /no commit refs\/tags\/harness-v1/)
})

// The real npm install --offline: a temp clone of the real client suite vague A-1 and a bare clone of the real template.
const REAL_SUITE = path.join(RUNS, 'set-2', 'run-1', 'suite-a')
const REAL_TEMPLATE = path.join(RUNS, 'templates', 'suite-b-precise.git')
const NO_REAL = fs.existsSync(path.join(REAL_SUITE, '.git')) && fs.existsSync(REAL_TEMPLATE) ? false : 'no real client suite or template'

test('fix-folder: the real npm install --offline on a temp clone of the real suites', { skip: NO_REAL, timeout: 600_000 }, t => {
  const runs = path.join(TMP, 'real runs')
  const suite = path.join(runs, 'set-2', 'run-1', 'suite-a')
  const template = path.join(runs, 'templates', 'suite-b-precise.git')
  execFileSync('git', ['clone', '-q', '--no-local', REAL_SUITE, suite], { env: GIT_ENV })
  execFileSync('git', ['clone', '-q', '--bare', '--no-local', REAL_TEMPLATE, template], { env: GIT_ENV })
  write(TMP, { 'real-report.md': '# Audit\n' })
  const dest = path.join(runs, 'desk-1')
  const r = spawnSync(NODE, [SCRIPT, 'fix-folder', '--suite', `${suite}@gen-1`, '--dest', dest, '--audit-report', path.join(TMP, 'real-report.md'), '--harness-template', template],
    { encoding: 'utf8', env: { ...GIT_ENV, E4_RUNS: runs } })
  if (r.status !== 0 && /ENOTCACHED|cache mode is 'only-if-cached'/.test(r.stderr)) return t.skip(`the npm cache does not hold a package: ${r.stderr.split('\n').find(l => /ENOTCACHED|only-if-cached/.test(l))}`)
  assert.equal(r.status, 0, r.stderr + r.stdout)
  const before = JSON.parse(execFileSync('git', ['-C', suite, 'show', 'gen-1:package-lock.json'], { encoding: 'utf8' })).packages
  const after = JSON.parse(read(path.join(dest, 'package-lock.json'))).packages
  for (const [k, v] of Object.entries(before)) if (k) assert.equal(after[k]?.version, v.version, k)
  for (const p of ['eslint', 'typescript', 'typescript-eslint', '@playwright/test']) assert.ok(fs.existsSync(path.join(dest, 'node_modules', p, 'package.json')), p)
  assert.deepEqual(g(dest, 'log', '--format=%s').split('\n'), ['Add the audit report', 'Add harness', 'Client suite'])
  assert.equal(g(dest, 'status', '--porcelain'), '')
  assert.match(r.stdout, /client files that stayed: \.gitignore, package-lock\.json, package\.json/)
  assert.match(r.stdout, /works in a temp clone with the same port: added \d+ packages/)
})

// --- flags ----------------------------------------------------------------------------------------------------------

const AUDIT_REPORT = [
  '# Audit report', '',
  'FLAG TC-03 step 2: the total of the basket has no check',
  '- FLAG TC-07 step 8: the saved order has no check',
  '1. FLAG TC-01 step 5: the email in the menu has no check',
  '   - FLAG TC-07 step 8: the same step again',
  'FLAG TC-07 steps 8 to 9: a range',
  'FLAG TC-07 step 8, 9: a list',
  '- FLAG TC-04 step 2-3: a range',
  '**FLAG** TC-01 step 1: bold',
  'FLAG TC-NN step N: <причина>',
  'FLAG TC-07 step 8: total; FLAG TC-07 step 9: also weak',
  'FLAG TC-7 step 8: one digit',
  'FLAG TC-01 step 9: TC-01 has 5 steps',
  '- FLAG TC-99 step 1: no such test case',
  'FLAG TC-03 step 0: no step zero',
  'FLAG TC-02 step 1: the same check as step 3',
  'FLAG TC-02 step 2: як у кроці 3',
  'The report has flags for TC-02 to TC-08.', ''
].join('\n')
const RERUN = { rules: [{ id: 'T15-b', verdict: 'survived', fired: [{ test: 'tests/tc-08.spec.ts :: TC-08 > wallet', tc: 'TC-08', passed: true }] }] }
const steps = list => list.map(f => `${f.tc}#${f.step}`)

const LIST = 'a range or a list of steps'
const FORM = 'not of the form "FLAG TC-NN step N: <reason>"'
const TWO = 'the word FLAG two or more times. One line names one step.'
const NAMES = 'the reason names a step too. One line names one step.'
const INVALID = [[7, LIST], [8, LIST], [9, LIST], [10, FORM], [11, FORM], [12, TWO], [13, FORM],
  [14, 'no such step: TC-01 has no step 9 (TC-01 has the steps 1 to 5 in test-cases-v2-vague:test-cases-vague)'],
  [15, 'no such step: test-cases-v2-vague:test-cases-vague has no TC-99'],
  [16, 'no such step: TC-03 has no step 0 (TC-03 has the steps 1 to 5 in test-cases-v2-vague:test-cases-vague)'], [17, NAMES], [18, NAMES]]

test('reportFlags: valid FLAG lines, also in list items, and each invalid line with its reason', () => {
  const r = reportFlags(AUDIT_REPORT, VAGUE)
  assert.deepEqual(steps(r.flags), ['TC-03#2', 'TC-07#8', 'TC-01#5', 'TC-07#8'])
  assert.equal(r.flags[0].reason, 'audit report line 3: the total of the basket has no check')
  assert.deepEqual(r.invalid.map(l => [l.line, l.reason]), INVALID)
  // Each line with the word FLAG gives a flag or an invalid entry. Only the last line (the word "flags") gives neither.
  const lines = AUDIT_REPORT.split('\n')
  const seen = new Set([...r.flags.map(f => Number(f.reason.match(/line (\d+)/)[1])), ...r.invalid.map(l => l.line)])
  assert.deepEqual(lines.flatMap((l, i) => /flag/i.test(l) && !seen.has(i + 1) ? [l] : []), ['The report has flags for TC-02 to TC-08.'])
  assert.throws(() => reportFlags(AUDIT_REPORT), /give the test case set/)
})

test('tamperFlags and unionFlags: rule 6 of the tamper list, the rerun file, the union with one flag for each step', () => {
  const table = rulesTable(execFileSync('git', ['-C', LAB, 'show', 'hypotheses-v2:bench/hypotheses-v2.md'], { encoding: 'utf8' }))
  const t = tamperFlags([{ file: 'a.json', json: TAMPER_OUT }, { file: 'b.json', json: RERUN }], table)
  assert.deepEqual(steps(unionFlags(t.flags)), ['TC-03#1', 'TC-03#2', 'TC-03#3', 'TC-03#4', 'TC-03#5', 'TC-08#4', 'TC-08#8'])
  assert.deepEqual(t.testsWithNoTc, [{ rule: 'T01-a', test: 'tests/setup.spec.ts :: products' }])
  assert.deepEqual(t.firedWithNoStep, [{ rule: 'T14-a', test: 'tests/tc-07.spec.ts :: TC-07 > order', tc: 'TC-07' }])
  assert.deepEqual(t.invalidRules, ['T06-a'])
  const u = unionFlags(t.flags, reportFlags(AUDIT_REPORT, VAGUE).flags)
  assert.deepEqual(steps(u), ['TC-01#5', 'TC-03#1', 'TC-03#2', 'TC-03#3', 'TC-03#4', 'TC-03#5', 'TC-07#8', 'TC-08#4', 'TC-08#8'])
  assert.deepEqual(u.find(f => f.tc === 'TC-03' && f.step === 2).sources, ['T02-a', 'T03-a', 'report'])
  assert.deepEqual(u.find(f => f.tc === 'TC-07').sources, ['report'])
  assert.equal(u.find(f => f.tc === 'TC-07').reasons.length, 2)
  assert.throws(() => tamperFlags([{ file: 'a.json', json: TAMPER_OUT }, { file: 'c.json', json: TAMPER_OUT }], table), /rule T02-a has a verdict in 2 reports/)
  assert.throws(() => tamperFlags([{ file: 'x.json', json: { rules: [{ id: 'T2a', verdict: 'survived', fired: [] }] } }], table), /not of the form T<NN>-<letter>/)
  assert.throws(() => tamperFlags([{ file: 'x.json', json: { rules: [{ id: 'T02-a', verdict: 'survived', fired: [{ test: 'k', tc: 'TC-3', passed: true }] }] } }], table), /not of the form TC-NN/)
  assert.throws(() => tamperFlags([{ file: 'x.json', json: [] }], table), /no list "rules"/)
})

test('flags: the JSON file, its sha256, the refusal to write it again', () => {
  write(TMP, { 'flags/tamper.json': json(TAMPER_OUT), 'flags/rerun.json': json(RERUN), 'flags/audit-report.md': AUDIT_REPORT })
  const out = path.join(TMP, 'flags', 'flag list.json')
  const args = ['flags', '--cond', 'vague', '--tamper-json', path.join(TMP, 'flags', 'tamper.json'), '--tamper-json', path.join(TMP, 'flags', 'rerun.json'),
    '--audit-report', path.join(TMP, 'flags', 'audit-report.md'), '--out', out]
  const r = e4(args)
  assert.equal(r.code, 0, r.err)
  const f = JSON.parse(read(out))
  assert.equal(f.flags.length, 9)
  assert.deepEqual(f.counts, { flags: 9, tamperFlags: 7, reportFlags: 3, invalidLines: 12 })
  assert.deepEqual(f.invalidLines.map(l => [l.line, l.reason]), INVALID)
  assert.deepEqual(f.inputs.testCaseSet, { condition: 'vague', source: VAGUE.source, steps: VAGUE.counts })
  assert.deepEqual(f.invalidRules, ['T06-a'])
  assert.equal(f.testsWithNoTc.length, 1)
  assert.equal(f.inputs.tamperJson.length, 2)
  assert.equal(f.inputs.rulesTable.sha256, sha256(execFileSync('git', ['-C', LAB, 'show', 'hypotheses-v2:bench/hypotheses-v2.md'])))
  assert.ok(r.out.includes(`wrote ${out}, sha256 ${sha256(fs.readFileSync(out))}`), r.out)
  assert.match(r.out, /invalid line 7 \(a range or a list of steps\): FLAG TC-07 steps 8 to 9/)
  assert.match(r.out, /invalid line 12 \(the word FLAG two or more times\. One line names one step\.\): FLAG TC-07 step 8: total; FLAG TC-07 step 9/)
  assert.match(r.out, /Invalid FLAG lines: 12/)
  const again = e4(args)
  assert.equal(again.code, 1)
  assert.match(again.err, /exists/)
  const noCond = e4(['flags', ...args.slice(3, -1), path.join(TMP, 'flags', 'no-cond.json')])
  assert.equal(noCond.code, 1)
  assert.match(noCond.err, /give --cond/)
  const badCond = e4(['flags', '--cond', 'nope', ...args.slice(3, -1), path.join(TMP, 'flags', 'bad-cond.json')])
  assert.equal(badCond.code, 1)
  assert.match(badCond.err, /--cond nope: not in .*conditions\.json\. Known: precise, vague, haiku/)
})

// --- score ----------------------------------------------------------------------------------------------------------

const SEALED = readMutantsTable(SEALED_MD, V1)
const flag = (tc, step) => ({ tc, step, sources: ['report'] })
const FLAGS = [flag('TC-07', 9), flag('TC-05', 2), flag('TC-03', 1), flag('TC-06', 5), flag('TC-08', 9), flag('TC-04', 3)]
const mutantsJson = (bugsMissed, allMissed) => ({
  summary: { A: { bugsCaught: 6 - bugsMissed.length, bugsTotal: 5, bugsMissed, allMissed } },
  mutants: SEALED.map(r => ({ id: r.id, kind: r.kind, expected: r.expected, suites: {} }))
})
const JUDGE = { label: 'suite-1', verdicts: [
  { tc: 'TC-08', step: 9, verdict: 'partial' }, { tc: 'TC-05', step: 2, verdict: 'missing' },
  { tc: 'TC-03', step: 1, verdict: 'covered' }, { tc: 'TC-04', step: 3, verdict: 'covered' }] }
const MISSED = mutantsJson(['M01', 'M03', 'M09', 'M13'], ['M01', 'M03', 'M08', 'M09', 'M13'])

test('score: R1, R2, P1, P2 and the classes by the rules of "Measures of the audit"', () => {
  const r = score({ flags: FLAGS, mutants: MISSED, label: 'A', judge: JUDGE, sealed: SEALED, set: V1 })
  // M01: a flag on one of its two steps. M03: a test case range with no step, so only R2. M09: a flag on its test cases,
  // not on its steps. M13: no flag in TC-01.
  assert.deepEqual(r.missedBugs.map(b => [b.id, b.r1, b.r2]), [['M01', true, true], ['M03', false, true], ['M09', false, true], ['M13', false, false]])
  assert.deepEqual(r.R1, { k: 1, m: 4, value: 0.25, text: '1 of 4' })
  assert.deepEqual(r.R2, { k: 3, m: 4, value: 0.75, text: '3 of 4' })
  // Hits: TC-07#9 (M01) and TC-06#5 (the missed operator M08). TC-08#9 is a target of M02, which the suite caught.
  assert.deepEqual(r.flags.map(f => [`${f.tc}#${f.step}`, f.class, f.patches]), [
    ['TC-03#1', 'other', []], ['TC-04#3', 'other', []], ['TC-05#2', 'weak by the judge', []],
    ['TC-06#5', 'hit', ['M08']], ['TC-07#9', 'hit', ['M01']], ['TC-08#9', 'weak by the judge', []]])
  assert.deepEqual(r.counts, { hit: 2, weak: 2, other: 2 })
  assert.deepEqual(r.P1, { k: 2, m: 6, value: 0.333, text: '2 of 6' })
  assert.deepEqual(r.P2, { k: 4, m: 6, value: 0.667, text: '4 of 6' })
})

test('score: the "not tested" rules', () => {
  const none = score({ flags: FLAGS, mutants: mutantsJson([], []), label: 'A', judge: JUDGE, sealed: SEALED, set: V1 })
  for (const m of ['R1', 'R2']) assert.deepEqual(none[m], { k: null, m: null, value: null, text: 'not tested (no missed bug)' })
  for (const m of ['P1', 'P2']) assert.equal(none[m].text, 'not tested (no missed patch)')
  assert.deepEqual(none.counts, { hit: 0, weak: 2, other: 4 })
  const noFlag = score({ flags: [], mutants: MISSED, label: 'A', judge: JUDGE, sealed: SEALED, set: V1 })
  assert.deepEqual(noFlag.R1, { k: 0, m: 4, value: 0, text: '0 of 4' })
  for (const m of ['P1', 'P2']) assert.equal(noFlag[m].text, 'not tested (no flag)')
  const operatorOnly = score({ flags: [flag('TC-06', 5)], mutants: mutantsJson([], ['M08']), label: 'A', judge: JUDGE, sealed: SEALED, set: V1 })
  assert.equal(operatorOnly.R1.text, 'not tested (no missed bug)')
  assert.deepEqual(operatorOnly.P1, { k: 1, m: 1, value: 1, text: '1 of 1' })
})

test('score: stops on inputs that do not agree', () => {
  const s = (over = {}) => () => score({ flags: FLAGS, mutants: MISSED, label: 'A', judge: JUDGE, sealed: SEALED, set: V1, ...over })
  assert.throws(s({ label: 'B' }), /no summary\.B/)
  assert.throws(s({ mutants: mutantsJson(['M07'], ['M07']) }), /patch M07 of the mutants file is not in the summary table/)
  assert.throws(s({ mutants: { ...MISSED, mutants: MISSED.mutants.map(m => m.id === 'M01' ? { ...m, kind: 'operator' } : m) } }), /the kind operator of the mutants file/)
  assert.throws(s({ mutants: { ...MISSED, mutants: MISSED.mutants.map(m => m.id === 'M13' ? { ...m, expected: 'TC-01 step 4' } : m) } }), /expected step of the mutants file/)
  assert.throws(s({ mutants: mutantsJson(['M08'], ['M08']) }), /not a missed bug/)
  assert.throws(s({ flags: [...FLAGS, flag('TC-07', 9)] }), /names a step two times/)
  assert.throws(s({ judge: { counts: {} } }), /no list "verdicts"/)
  // A flag must be a step of the reference set: a typo in a flag list stops the score, it does not change P1 with no message.
  for (const [tc, step, error] of [['TC-01', 9, /the flag TC-01 step 9 is not a step of the reference set: TC-01 has no step 9/],
    ['TC-99', 1, /has no TC-99/], ['TC-03', 0, /TC-03 has no step 0/]]) assert.throws(s({ flags: [...FLAGS, flag(tc, step)] }), error)
  assert.throws(s({ set: undefined }), /give the reference test case set/)
})

test('score: the .md and the .json files, the lint of the .md, the refusal to write again', { skip: NO_LINT }, () => {
  const dir = path.join(TMP, 'score in')
  write(dir, { 'flags.json': json({ flags: FLAGS }), 'mutants.json': json(MISSED), 'judge.json': json(JUDGE), 'mutants.md': SEALED_MD })
  const out = path.join(TMP, 'score out', 'e4-score')
  const args = ['score', '--flags', path.join(dir, 'flags.json'), '--mutants', path.join(dir, 'mutants.json'), '--label', 'A',
    '--judge', path.join(dir, 'judge.json'), '--sealed', path.join(dir, 'mutants.md'), '--out', `${out}.json`]
  const r = e4(args)
  assert.equal(r.code, 0, r.err)
  const j = JSON.parse(read(`${out}.json`))
  assert.equal(j.R1.text, '1 of 4')
  assert.deepEqual(j.inputs.map(i => i.name), ['flags', 'mutants', 'judge', 'sealed'])
  const md = read(`${out}.md`)
  assert.match(md, /\| R1: missed bugs with a flag on a target step \| 1 of 4 \| 0\.25 \|/)
  assert.match(md, /\| P2: hits and flags that are weak by the judge, of all flags \| 4 of 6 \| 0\.667 \|/)
  assert.match(md, /\| M03 \| `TC-02 to TC-08` \| none \|/)
  for (const ext of ['md', 'json']) assert.ok(r.out.includes(`wrote ${out}.${ext}, sha256 ${sha256(fs.readFileSync(`${out}.${ext}`))}`), r.out)
  assert.match(r.out, /R1: 1 of 4 = 0\.25/)
  const lint = spawnSync('python3', [STE_LINT, `${out}.md`], { encoding: 'utf8' })
  assert.equal(lint.status, 0, lint.stdout + lint.stderr)
  assert.match(lint.stdout, /\(0 hard,/)
  const none = path.join(TMP, 'score out', 'e4-none')
  write(dir, { 'none.json': json(mutantsJson([], [])) })
  const n = e4([...args.slice(0, 4), path.join(dir, 'none.json'), ...args.slice(5, -1), none])
  assert.equal(n.code, 0, n.err)
  const noneLint = spawnSync('python3', [STE_LINT, `${none}.md`], { encoding: 'utf8' })
  assert.equal(noneLint.status, 0, noneLint.stdout)
  const again = e4(args)
  assert.equal(again.code, 1)
  assert.match(again.err, /exists/)
})
