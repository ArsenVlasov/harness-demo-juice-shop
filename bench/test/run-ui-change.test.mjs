// Tests for the pure parts of bench/run-ui-change.mjs and for its --dry mode. Run: node --test bench/test/run-ui-change.test.mjs
// The --dry tests use a fake suite repo and a fake patch folder in a temp folder. They do not touch juice-shop/ or the app.
import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LAB, RESULTS, RUNS, readReport } from '../lib.mjs'
import { CODE_PATHSPEC, brokenTests, changes, parseSuite, patchOrder, recoverySteps, renderMarkdown, repairOutcome } from '../run-ui-change.mjs'
import { assertionCounts, weakening } from '../weakening.mjs'

const SCRIPT = fileURLToPath(new URL('../run-ui-change.mjs', import.meta.url))
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'run-ui-change-test-'))
after(() => fs.rmSync(TMP, { recursive: true, force: true }))

// A Playwright JSON report with one spec file and one describe block. Each entry is a test title and its
// status (or a list of statuses for repeats). null: the test is not in the report.
function pwReport (name, statuses) {
  const specs = Object.entries(statuses).filter(([, st]) => st !== null).map(([title, st]) => ({
    title,
    file: 'basket.spec.ts',
    tests: [{ annotations: [], results: [].concat(st).map(status => ({ status })) }]
  }))
  const file = path.join(TMP, `${name}.json`)
  fs.writeFileSync(file, JSON.stringify({ suites: [{ title: 'basket.spec.ts', file: 'basket.spec.ts', specs: [], suites: [{ title: 'Basket', specs }] }], errors: [], stats: {} }))
  return readReport(file)
}
const key = title => `basket.spec.ts :: Basket > ${title}`

test('parseSuite: the label, an absolute path and the ref, HEAD by default', () => {
  assert.deepEqual(parseSuite('A=/runs/precise/run-1/suite-a@gen-1'), { label: 'A', path: '/runs/precise/run-1/suite-a', ref: 'gen-1' })
  assert.deepEqual(parseSuite('B-vague_2=rel/suite-b'), { label: 'B-vague_2', path: path.resolve('rel/suite-b'), ref: 'HEAD' })
  assert.equal(parseSuite('A=~/runs/suite-a').path, path.join(os.homedir(), 'runs/suite-a'))
  assert.deepEqual(parseSuite('A=/x/Application Support/s@abc123'), { label: 'A', path: '/x/Application Support/s', ref: 'abc123' })
  for (const bad of ['A', '=/x', 'A b=/x', 'A.1=/x', 'A=/x@', undefined]) assert.throws(() => parseSuite(bad), /--suite/, String(bad))
})

test('patchOrder: only the .patch files, in file-name order', () => {
  const files = ['03-move-step.patch', 'README.md', '01-rename-button.patch', '02-form.patch', 'notes.patch.txt']
  assert.deepEqual(patchOrder(files), ['01-rename-button.patch', '02-form.patch', '03-move-step.patch'])
  assert.deepEqual(patchOrder([]), [])
})

test('changes: together is one change with all patches, each is one change for each patch', () => {
  const p = ['01-a.patch', '02-b.patch']
  assert.deepEqual(changes(p, 'together'), [{ id: 'all', patches: p }])
  assert.deepEqual(changes(p, 'each'), [{ id: '01-a', patches: ['01-a.patch'] }, { id: '02-b', patches: ['02-b.patch'] }])
})

test('brokenTests: green in all clean runs, red in all runs with the change. Some red runs: unstable, not broken', () => {
  const clean = pwReport('clean', {
    'TC-01 add': ['passed', 'passed', 'passed'],
    'TC-02 remove': ['passed', 'passed', 'passed'],
    'TC-03 coupon': ['failed', 'failed', 'failed'],
    'TC-04 checkout': ['passed', 'passed', 'passed'],
    'TC-05 search': ['passed', 'passed', 'passed'],
    'TC-06 login': ['passed', 'failed', 'passed'],
    'TC-08 wallet': ['passed', 'passed', 'passed']
  })
  const patched = pwReport('patched', {
    'TC-01 add': ['passed', 'passed', 'passed'],
    'TC-02 remove': ['failed', 'failed', 'failed'],
    'TC-03 coupon': ['failed', 'failed', 'failed'],
    'TC-04 checkout': null,
    'TC-05 search': ['timedOut', 'failed', 'timedOut'],
    'TC-06 login': ['failed', 'failed', 'failed'],
    'TC-08 wallet': ['passed', 'failed', 'passed']
  })
  assert.deepEqual(brokenTests(clean, patched), {
    tests: 7,
    green: 5,
    redOnClean: [key('TC-03 coupon'), key('TC-06 login')],
    broken: [key('TC-02 remove'), key('TC-04 checkout'), key('TC-05 search')],
    unstable: [key('TC-08 wallet')]
  })
  assert.deepEqual(brokenTests(clean, clean).broken, [])
})

test('repairOutcome: repaired, still broken, unstable, new red, missing and new tests', () => {
  const clean = pwReport('clean2', { a: 'passed', b: 'passed', c: 'passed', d: 'passed', e: 'failed', g: 'passed' })
  const repaired = pwReport('repaired', { a: 'passed', b: ['failed', 'failed'], c: null, d: 'failed', e: 'passed', f: 'passed', g: ['passed', 'failed'] })
  assert.deepEqual(repairOutcome(clean, [key('a'), key('b'), key('c')], repaired), {
    brokenBefore: 3,
    tests: 6,
    passed: 3,
    repaired: [key('a')],
    stillBroken: [key('b')],
    unstable: [key('g')],
    newRed: [key('d')],
    missing: [key('c')],
    newTests: [key('f')]
  })
})

test('recoverySteps: the applied patches in reverse order, the rebuild and the removal of the marker', () => {
  const steps = recoverySteps({ patchesDir: '/lab/sealed-ui', applied: [1, 3] }, ['01-a.patch', '02-b.patch', '03-c.patch'], '/lab/juice-shop', '/lab/juice-shop/.ui-change-active.json')
  assert.deepEqual(steps, [
    "1. When git -C '/lab/juice-shop' status shows changes other than .ui-change-active.json, revert the patches in this order: git -C '/lab/juice-shop' apply -R '/lab/sealed-ui/03-c.patch' && git -C '/lab/juice-shop' apply -R '/lab/sealed-ui/01-a.patch'",
    "2. Rebuild: cd '/lab/juice-shop' && npm run build:frontend && npm run build:server",
    "3. Remove the marker: rm '/lab/juice-shop/.ui-change-active.json'"
  ])
  assert.match(recoverySteps({ applied: [] }, [])[0], /in this order: none$/)
  assert.match(recoverySteps({ patchesDir: '/x', applied: [2] }, [])[0], /<patch 2 in file-name order>/)
})

const sample = repair => ({
  status: 'complete',
  error: null,
  generatedAt: '2026-10-26T10:00:00.000Z',
  out: 'ui-change',
  mode: 'together',
  repeats: 3,
  patches: ['01-a.patch', '02-b.patch'],
  suites: [{ label: 'A', path: '/runs/a', ref: 'gen-1', sha: 'f7d78f03682f0b98ca5b' }, { label: 'B', path: '/runs/b', ref: 'gen-1', sha: '12286c65dfb0c0b2a1c4' }],
  changes: [{
    id: 'all',
    patches: ['01-a.patch', '02-b.patch'],
    suites: {
      A: { tests: 9, green: 9, redOnClean: [], broken: [key('a'), key('x | y')], unstable: [key('u')], reportErrors: [] },
      B: { tests: 12, green: 11, redOnClean: [key('z')], broken: [], unstable: [], reportErrors: [] }
    }
  }],
  repair: repair
    ? {
        model: 'claude-opus-5-5',
        budget: '5',
        promptFile: 'bench/prompt-repair.txt',
        isolation: 'Before the first repair, git apply -R put back the source of juice-shop/.',
        suites: {
          A: { status: 'done', copy: '/runs/maintenance/ui-change/A', nodeModules: 'npm ci --offline', tag: 'ui-change-A-repair', exit: 0, wallSeconds: 750, costUsd: 1.23, sessionId: 's-1', brokenBefore: 2, tests: 9, passed: 8, repaired: [key('a')], stillBroken: [key('x | y')], unstable: [], newRed: [], missing: [], newTests: [], assertions: { added: 4, removed: 6 }, valueChecks: { added: 1, removed: 2 }, weakening: ['removed 2 assertion call(s) more than it added (removed 6, added 4)'], changedFiles: ['tests/basket.spec.ts'], diffFile: 'bench/results/ui-change/repair-A.diff', codeDiffFile: 'bench/results/ui-change/repair-A.code.diff' },
          B: { status: 'skipped', reason: 'no broken tests', costUsd: 0, brokenBefore: 0 }
        }
      }
    : null
})

test('renderMarkdown: a row for each change and suite, the broken and unstable tests, no repair section without --repair', () => {
  const md = renderMarkdown(sample(false))
  assert.match(md, /^# UI change and repair \(ui-change\)$/m)
  assert.match(md, /Status: complete\.$/m)
  assert.match(md, /Runs of each test on each app state: 3\./)
  assert.match(md, /^\| A \| `\/runs\/a` \| `gen-1` \| `f7d78f03682f` \|$/m)
  assert.match(md, /^\| all \| A \| 9 \| 9 \| 2 \| 1 \|$/m)
  assert.match(md, /^\| all \| B \| 12 \| 11 \| 0 \| 0 \|$/m)
  assert.ok(md.includes('| all | A | `basket.spec.ts :: Basket > a`<br>`basket.spec.ts :: Basket > x \\| y` | `basket.spec.ts :: Basket > u` |'))
  assert.match(md, /^\| all \| B \| none \| none \|$/m)
  assert.doesNotMatch(md, /## Repair/)
})

test('renderMarkdown: the repair table, a skipped repair, the weakening findings and an incomplete status', () => {
  const md = renderMarkdown(sample(true))
  assert.match(md, /^\| A \| 1\.23 \| 12\.5 \| 1 of 2 \| 1 \| 0 \| 0 \| 0 \| 4 \/ 6 \| 1 \/ 2 \| 1 \|$/m)
  assert.match(md, /^\| B \| 0 \| 0\.0 \| no repair: no broken tests \| - \| - \| - \| - \| - \| - \| - \|$/m)
  assert.match(md, /Budget: 5 USD\./)
  assert.match(md, /^Isolation: Before the first repair/m)
  assert.match(md, /node_modules: npm ci --offline\. Tag: `ui-change-A-repair`/)
  assert.match(md, /```text\nremoved 2 assertion call\(s\) more than it added \(removed 6, added 4\)\n```/)
  assert.match(md, /### Suite B\n\n- Status: skipped: no broken tests\./)
  const partial = { ...sample(true), status: 'incomplete', error: 'no report from suite B' }
  partial.repair.suites.B = { status: 'not measured', tag: 'ui-change-B-repair', exit: 1, wallSeconds: 90, costUsd: null }
  const pmd = renderMarkdown(partial)
  assert.match(pmd, /Status: incomplete\. Error: no report from suite B\.$/m)
  assert.match(pmd, /^\| B \| unknown \| 1\.5 \| not measured \| - \| - \| - \| - \| - \| - \| - \|$/m)
})

test('CODE_PATHSPEC: a check that a Markdown file quotes does not hide a removed check in the code', () => {
  const dir = fs.mkdtempSync(path.join(TMP, 'code-'))
  const write = (f, text) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), text) }
  git(dir, 'init', '-q', '-b', 'main')
  write('tests/x.spec.ts', "test('x', async () => {\n    await expect(row).toHaveText('5');\n});\n")
  write('package.json', '{}\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-qm', 'start')
  const sha = git(dir, 'rev-parse', 'HEAD')
  write('tests/x.spec.ts', "test('x', async () => {\n});\n")
  write('docs/bugs/x.md', "First lines of the error:\n    await expect(row).toHaveText('5');\n")
  write('.claude/skills/s/SKILL.md', "await expect(a).toHaveText('b');\n")
  write('.playwright-mcp/console.log', "expect(x).toBe(1)\n")
  write('scripts/check.mjs', "assert.equal(1, 1)\n")
  write('package.json', '{ "scripts": { "test": "playwright test --retries=2" } }\n')
  git(dir, 'add', '--all', '--intent-to-add')
  const full = git(dir, 'diff', sha, '--', '.')
  const code = git(dir, 'diff', sha, '--', ...CODE_PATHSPEC)
  assert.deepEqual(assertionCounts(full).removed, 2)
  assert.ok(assertionCounts(full).added >= 2)
  assert.deepEqual(assertionCounts(code), { added: 0, removed: 2 })
  assert.deepEqual(git(dir, 'diff', '--name-only', sha, '--', ...CODE_PATHSPEC).split('\n'), ['package.json', 'tests/x.spec.ts'])
  const found = weakening(code)
  assert.match(found.join('\n'), /added retries/)
  assert.match(found.join('\n'), /removed 2 assertion call\(s\) more than it added/)
})

// --- the --dry mode, with a fake suite and a fake patch folder ---------------------------------

function git (cwd, ...args) {
  const r = spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@localhost', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout.trim()
}

// A suite repo with two commits: the tag gen-1 on the first, HEAD on the second.
function fakeSuite () {
  const dir = fs.mkdtempSync(path.join(TMP, 'suite-'))
  git(dir, 'init', '-q', '-b', 'main')
  fs.writeFileSync(path.join(dir, 'package.json'), '{}\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-qm', 'start')
  git(dir, 'tag', 'gen-1')
  fs.writeFileSync(path.join(dir, 'b.txt'), 'b\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-qm', 'later')
  fs.mkdirSync(path.join(dir, 'sub'))
  return dir
}

// A patch in git format. git apply --numstat reads it; nothing applies it in these tests.
const fakePatch = file => `diff --git a/${file} b/${file}\n--- a/${file}\n+++ b/${file}\n@@ -1 +1 @@\n-<button>Checkout</button>\n+<button>Go to checkout</button>\n`
const PATCHES = path.join(TMP, 'fake-ui')
fs.mkdirSync(PATCHES)
fs.writeFileSync(path.join(PATCHES, '02-b.patch'), fakePatch('frontend/src/app/basket/basket.component.html'))
fs.writeFileSync(path.join(PATCHES, '01-a.patch'), fakePatch('frontend/src/app/login/login.component.html'))
fs.writeFileSync(path.join(PATCHES, 'README.md'), 'not a patch\n')
const SERVER_PATCHES = path.join(TMP, 'fake-server')
fs.mkdirSync(SERVER_PATCHES)
fs.writeFileSync(path.join(SERVER_PATCHES, '01-a.patch'), fakePatch('frontend/src/app/a.html'))
fs.writeFileSync(path.join(SERVER_PATCHES, '02-b.patch'), fakePatch('frontend/src/app/b.html') + fakePatch('routes/basket.ts'))
fs.writeFileSync(path.join(SERVER_PATCHES, '03-c.patch'), 'not a real patch\n')

// The marker of these tests is in the temp folder, not in juice-shop/.
const MARKER = path.join(TMP, 'marker.json')
const OUT = `ui-change-test-${process.pid}`
const run = (args, extraEnv = {}) => {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env: { ...process.env, RUN_UI_CHANGE_MARKER: MARKER, ...extraEnv } })
  const lines = r.stdout.split('\n').map(l => l.replace(/^\[\d\d:\d\d:\d\d\] /, ''))
  return { ...r, steps: lines.filter(l => l.startsWith('[dry] ')).map(l => l.slice(6)), problems: lines.filter(l => l.startsWith('problem: ')) }
}
const dry = (...args) => run(['--patches', PATCHES, '--out', OUT, '--dry', ...args])
const REBUILD = why => `rebuild juice-shop/ (${why}): npm run build:frontend, npm run build:server`

test('--dry, mode together: the marker, the steps in order, the revert in reverse order, no output files', () => {
  const suite = fakeSuite()
  const r = dry('--suite', `A=${suite}`, '--suite', `B=${suite}@HEAD`)
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.deepEqual(r.problems, [])
  const raw = `bench/results/${OUT}`
  assert.deepEqual(r.steps, [
    'check that juice-shop/ has no changes',
    `create ${raw}/`,
    'stop the app',
    REBUILD('clean'),
    `restart the app, run suite A in ${suite} (--repeat-each=3), report ${raw}/clean-A.json`,
    `restart the app, run suite B in ${suite} (--repeat-each=3), report ${raw}/clean-B.json`,
    `write the marker ${MARKER}`,
    `git apply ${PATCHES}/01-a.patch`,
    `git apply ${PATCHES}/02-b.patch`,
    REBUILD('change all'),
    `restart the app, run suite A in ${suite} (--repeat-each=3), report ${raw}/all-A.json`,
    `restart the app, run suite B in ${suite} (--repeat-each=3), report ${raw}/all-B.json`,
    'stop the app',
    `git apply -R ${PATCHES}/02-b.patch`,
    `git apply -R ${PATCHES}/01-a.patch`,
    REBUILD('revert of change all'),
    `remove the marker ${MARKER}`,
    'check that juice-shop/ has no changes',
    `write bench/results/${OUT}.json and ${OUT}.md`
  ])
  assert.match(r.stdout, /patches in .*: 01-a\.patch 02-b\.patch$/m)
  assert.equal(fs.existsSync(path.join(RESULTS, OUT)), false)
  assert.equal(fs.existsSync(MARKER), false)
})

test('--dry, mode each and --repeats: one apply, one revert and two rebuilds for each patch', () => {
  const suite = fakeSuite()
  const r = dry('--suite', `A=${suite}`, '--mode', 'each', '--repeats', '5')
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const applies = r.steps.filter(s => s.startsWith('git apply'))
  assert.deepEqual(applies, [`git apply ${PATCHES}/01-a.patch`, `git apply -R ${PATCHES}/01-a.patch`, `git apply ${PATCHES}/02-b.patch`, `git apply -R ${PATCHES}/02-b.patch`])
  assert.equal(r.steps.filter(s => s.startsWith('rebuild')).length, 5)
  assert.equal(r.steps.filter(s => s.startsWith('write the marker')).length, 2)
  assert.equal(r.steps.filter(s => s.startsWith('remove the marker')).length, 2)
  assert.ok(r.steps.includes(`restart the app, run suite A in ${suite} (--repeat-each=5), report bench/results/${OUT}/02-b-A.json`))
})

test('--dry --repair: the source revert before the first repair, the copy, claude-locked.sh, the run of the copy and the diff', () => {
  const suite = fakeSuite()
  git(suite, 'config', 'core.hooksPath', '.githooks')
  const r = dry('--suite', `A=${suite}@HEAD`, '--suite', `B=${suite}`, '--repair', '--budget', '2.5')
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const copy = label => path.join(RUNS, 'maintenance', OUT, label)
  const prompt = path.join(LAB, 'bench', 'prompt-repair.txt')
  const raw = `bench/results/${OUT}`
  const from = r.steps.indexOf(`restart the app, run suite B in ${suite} (--repeat-each=3), report ${raw}/all-B.json`)
  assert.ok(from > 0, r.stdout)
  const repairOf = label => [
    `git clone --no-local ${suite} ${copy(label)}: HEAD on a branch main, no origin, core.hooksPath .githooks`,
    `install node_modules in ${copy(label)}: npm ci --offline, else cp -Rp from the suite`,
    'restart the app with the change for the repair',
    `bench/claude-locked.sh --dir ${copy(label)} --prompt-file ${prompt} --model claude-opus-5-5 --tag ${OUT}-${label}-repair --budget 2.5`,
    'stop the app',
    `restart the app, run suite ${label} (repair copy) in ${copy(label)} (--repeat-each=3), report ${raw}/repaired-${label}.json`,
    `git -C ${copy(label)} diff HEAD: save it in ${raw}/repair-${label}.diff, and its code part in ${raw}/repair-${label}.code.diff`
  ]
  assert.deepEqual(r.steps.slice(from + 1), [
    `git apply -R ${PATCHES}/02-b.patch (the build keeps the change for the repair)`,
    `git apply -R ${PATCHES}/01-a.patch (the build keeps the change for the repair)`,
    'check that the source of juice-shop/ has no changes other than the marker',
    ...repairOf('A'),
    ...repairOf('B'),
    'stop the app',
    REBUILD('revert of change all'),
    `remove the marker ${MARKER}`,
    'check that juice-shop/ has no changes',
    `write bench/results/${OUT}.json and ${OUT}.md`
  ])
  assert.equal(fs.existsSync(path.join(RUNS, 'maintenance', OUT)), false)
})

test('--dry --repair: a patch outside frontend/src/ and a patch that git cannot read are problems', () => {
  const suite = fakeSuite()
  const r = run(['--patches', SERVER_PATCHES, '--out', OUT, '--dry', '--suite', `A=${suite}`, '--repair'])
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.deepEqual(r.problems, [
    'problem: --repair: patch 2 of 3 changes 1 files outside frontend/src/. During the repair only the build keeps the change, so the patches must change only frontend/src/',
    'problem: git apply --numstat cannot read 03-c.patch'
  ])
  const plain = run(['--patches', SERVER_PATCHES, '--out', OUT, '--dry', '--suite', `A=${suite}`])
  assert.equal(plain.status, 0, plain.stdout + plain.stderr)
})

test('--dry: a marker of an earlier run is a problem with the steps of the revert', () => {
  const suite = fakeSuite()
  fs.writeFileSync(MARKER, JSON.stringify({ out: 'ui-change', pid: 4242, startedAt: '2026-10-26T10:00:00.000Z', patchesDir: PATCHES, applied: [1, 2] }))
  try {
    const r = dry('--suite', `A=${suite}`)
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stdout, new RegExp(`problem: ${MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} exists: a run \\(out ui-change, pid 4242`))
    assert.ok(r.stdout.includes(`apply -R '${PATCHES}/02-b.patch' && git -C`), r.stdout)
    assert.ok(r.stdout.includes(`3. Remove the marker: rm '${MARKER}'`), r.stdout)
  } finally {
    fs.rmSync(MARKER, { force: true })
  }
})

test('--dry lists the problems and exits 1: HEAD is not the ref, not the top of a repo, no patch folder', () => {
  const suite = fakeSuite()
  const r = dry('--suite', `A=${suite}@gen-1`, '--suite', `B=${path.join(suite, 'sub')}`, '--suite', `C=${suite}@no-such-ref`)
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.deepEqual(r.problems, [
    `problem: suite A: HEAD of ${suite} is not gen-1`,
    `problem: suite B: ${path.join(suite, 'sub')} is not the top folder of a git repo`,
    `problem: suite C: no commit no-such-ref in ${suite}`
  ])
  const none = run(['--suite', `A=${suite}`, '--patches', path.join(TMP, 'none'), '--dry'])
  assert.equal(none.status, 1)
  assert.match(none.stdout, /problem: no patch folder/)
})

test('usage errors stop the script before any step', () => {
  const suite = fakeSuite()
  const cases = [
    [['--suite', `A=${suite}`, '--mode', 'each', '--repair'], /--repair works only with --mode together/],
    [['--suite', `A=${suite}`, '--mode', 'all'], /--mode is together or each/],
    [['--suite', `A=${suite}`, '--suite', `A=${suite}`], /each --suite needs its own label/],
    [[], /give at least one --suite/]
  ]
  for (const bad of ['lots', '.5', '1e1', ' 5', '0', '-1']) cases.push([['--suite', `A=${suite}`, '--budget', bad], /--budget needs a positive number/])
  for (const bad of ['0', '6', 'x', '2.5']) cases.push([['--suite', `A=${suite}`, '--repeats', bad], /--repeats is a number from 1 to 5/])
  for (const [args, msg] of cases) {
    const r = dry(...args)
    assert.equal(r.status, 1, args.join(' '))
    assert.match(r.stderr, msg, args.join(' '))
    assert.deepEqual(r.steps, [])
  }
})

// --- a full run in a sandbox: a copy of the bench scripts in a temp lab -----------------------------
// The temp lab has a fake juice-shop/ (build:frontend copies frontend/src/app/x.html to frontend/dist/), a fake
// bench/start-app.sh, a fake bench/claude-locked.sh and suites with a fake Playwright that reads frontend/dist/x.html.
// lib.mjs takes LAB from its own folder, so the script changes only the temp lab. No app, no port, no claude.

const BENCH = fileURLToPath(new URL('..', import.meta.url))
const exec = (file, text) => { fs.writeFileSync(file, text); fs.chmodSync(file, 0o755) }

const FAKE_BUILD = `import fs from 'node:fs'
if (process.argv[2] === 'frontend') {
  const n = Number(fs.existsSync('.build-count') ? fs.readFileSync('.build-count', 'utf8') : 0) + 1
  fs.writeFileSync('.build-count', String(n))
  fs.writeFileSync('building-' + n, '')
  if (process.env.SANDBOX_SLOW_BUILD) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500)
  if (process.env.SANDBOX_FAIL_BUILD === String(n)) process.exit(1)
  fs.mkdirSync('frontend/dist', { recursive: true })
  fs.copyFileSync('frontend/src/app/x.html', 'frontend/dist/x.html')
}
`
// tests.json: { title: { needs: <text in the UI>, flakyWithChange: true } }. Repeat 2 of a flaky test fails with the change.
const FAKE_PLAYWRIGHT = `#!/usr/bin/env node
const fs = require('fs')
const repeats = Number((process.argv.find(a => a.startsWith('--repeat-each=')) || '=1').split('=')[1])
const ui = fs.readFileSync(process.env.SANDBOX_DIST, 'utf8')
const cases = JSON.parse(fs.readFileSync('tests.json', 'utf8'))
let failed = false
const specs = Object.entries(cases).map(([title, c]) => ({
  title, file: 'x.spec.ts',
  tests: Array.from({ length: repeats }, (_, i) => {
    const ok = (!c.needs || ui.includes(c.needs)) && !(c.flakyWithChange && !ui.includes('>Checkout<') && i === 1)
    failed ||= !ok
    return { annotations: [], results: [{ status: ok ? 'passed' : 'failed' }] }
  })
}))
fs.writeFileSync(process.env.PLAYWRIGHT_JSON_OUTPUT_NAME, JSON.stringify({ suites: [{ title: 'x.spec.ts', file: 'x.spec.ts', specs, suites: [] }], errors: [], stats: {} }))
process.exit(failed ? 1 : 0)
`
// The fake repair: it records the state of juice-shop/, renames the label in tests.json and removes one check.
const FAKE_CLAUDE_LOCKED = `#!/usr/bin/env bash
set -euo pipefail
while [ $# -gt 0 ]; do case "$1" in --dir) DIR="$2" ;; --tag) TAG="$2" ;; esac; shift 2; done
RES="$(cd "$(dirname "$0")" && pwd)/results"
if [ "\${SANDBOX_CL_FAIL_TAG:-}" = "$TAG" ]; then echo "error: another locked run is active" >&2; exit 1; fi
git -C "$SANDBOX_APP" status --porcelain >"$RES/$TAG.app-status"
cp "$SANDBOX_DIST" "$RES/$TAG.app-dist"
echo "run: $TAG" >"$RES/$TAG.meta"
echo '{"total_cost_usd":0.5,"session_id":"fake-session","num_turns":3,"subtype":"success"}' >"$RES/$TAG.json"
if [ -n "\${SANDBOX_CL_SLOW:-}" ]; then
  sleep 30 & SP=$!
  trap 'kill $SP 2>/dev/null; exit 143' TERM
  touch "$RES/$TAG.started"
  wait $SP
fi
node -e "const fs=require('fs');const f=process.argv[1];fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('\\"Checkout\\"','\\"Go to checkout\\"'))" "$DIR/tests.json"
printf "test('x', async () => {\\n    await expect(a).toHaveText('1');\\n});\\n" >"$DIR/tests/x.spec.ts"
echo "claude exit=0"
`

function sandbox (suiteCases) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(TMP, 'sandbox-'))) // LAB of lib.mjs is a real path
  const lab = path.join(root, 'lab')
  const app = path.join(lab, 'juice-shop')
  fs.mkdirSync(path.join(lab, 'bench', 'results'), { recursive: true })
  for (const f of ['lib.mjs', 'run-ui-change.mjs', 'weakening.mjs', 'prompt-repair.txt']) fs.copyFileSync(path.join(BENCH, f), path.join(lab, 'bench', f))
  exec(path.join(lab, 'bench', 'start-app.sh'), '#!/usr/bin/env bash\necho "fake app: $1"\n')
  exec(path.join(lab, 'bench', 'claude-locked.sh'), FAKE_CLAUDE_LOCKED)
  fs.mkdirSync(path.join(app, 'frontend', 'src', 'app'), { recursive: true })
  fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({ scripts: { 'build:frontend': 'node build.mjs frontend', 'build:server': 'node build.mjs server' } }))
  fs.writeFileSync(path.join(app, 'build.mjs'), FAKE_BUILD)
  fs.writeFileSync(path.join(app, '.gitignore'), 'frontend/dist/\n.build-count\nbuilding-*\n')
  fs.writeFileSync(path.join(app, 'frontend', 'src', 'app', 'x.html'), '<button>Checkout</button>\n')
  git(app, 'init', '-q', '-b', 'main')
  git(app, 'add', '.')
  git(app, 'commit', '-qm', 'app')
  fs.writeFileSync(path.join(app, 'frontend', 'src', 'app', 'x.html'), '<button>Go to checkout</button>\n')
  fs.mkdirSync(path.join(lab, 'sealed-ui'))
  fs.writeFileSync(path.join(lab, 'sealed-ui', '01-rename.patch'), git(app, 'diff') + '\n')
  git(app, 'checkout', '--', '.')
  const suites = {}
  for (const [label, cases] of Object.entries(suiteCases)) {
    const dir = path.join(root, 'suites', label)
    fs.mkdirSync(path.join(dir, 'tests'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'package.json'), '{ "name": "fake-suite", "private": true }\n')
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n')
    fs.writeFileSync(path.join(dir, 'tests.json'), JSON.stringify(cases, null, 2) + '\n')
    fs.writeFileSync(path.join(dir, 'tests', 'x.spec.ts'), "test('x', async () => {\n    await expect(a).toHaveText('1');\n    await expect(b).toHaveText('2');\n});\n")
    fs.mkdirSync(path.join(dir, 'node_modules', '.bin'), { recursive: true })
    exec(path.join(dir, 'node_modules', '.bin', 'playwright'), FAKE_PLAYWRIGHT)
    git(dir, 'init', '-q', '-b', 'main')
    git(dir, 'add', '.')
    git(dir, 'commit', '-qm', 'suite')
    git(dir, 'tag', 'gen-1')
    suites[label] = dir
  }
  const env = { ...process.env, SANDBOX_APP: app, SANDBOX_DIST: path.join(app, 'frontend', 'dist', 'x.html') }
  delete env.RUN_UI_CHANGE_MARKER
  const args = (...more) => [path.join(lab, 'bench', 'run-ui-change.mjs'), ...Object.entries(suites).flatMap(([l, d]) => ['--suite', `${l}=${d}@gen-1`]), ...more]
  const read = f => fs.readFileSync(f, 'utf8')
  return { root, lab, app, suites, env, args, read, marker: path.join(app, '.ui-change-active.json'), results: path.join(lab, 'bench', 'results') }
}

const SPEC = title => `x.spec.ts :: ${title}`
const BROKEN_A = { 't1 checkout': { needs: 'Checkout' }, 't2 login': {}, 't3 wallet': { flakyWithChange: true } }

test('sandbox: a full run with --repair. Broken and unstable tests, the repair of A, no repair of B, a clean revert', () => {
  const sb = sandbox({ A: BROKEN_A, B: { 't1 checkout': {}, 't2 login': {} } })
  const r = spawnSync(process.execPath, sb.args('--repair', '--budget', '1', '--out', 'uc'), { encoding: 'utf8', env: sb.env })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const out = JSON.parse(sb.read(path.join(sb.results, 'uc.json')))
  assert.equal(out.status, 'complete')
  assert.deepEqual(out.changes[0].suites.A.broken, [SPEC('t1 checkout')])
  assert.deepEqual(out.changes[0].suites.A.unstable, [SPEC('t3 wallet')])
  assert.deepEqual(out.changes[0].suites.B.broken, [])
  const a = out.repair.suites.A
  assert.equal(a.status, 'done')
  assert.deepEqual([a.repaired, a.stillBroken, a.unstable, a.newRed, a.missing], [[SPEC('t1 checkout')], [], [SPEC('t3 wallet')], [], []])
  assert.deepEqual([a.costUsd, a.sessionId, a.exit], [0.5, 'fake-session', 0])
  assert.deepEqual(a.assertions, { added: 0, removed: 2 })
  assert.deepEqual(a.valueChecks, { added: 0, removed: 1 })
  assert.equal(a.weakening.length, 2)
  assert.deepEqual(a.changedFiles, ['tests.json', 'tests/x.spec.ts'])
  assert.deepEqual(out.repair.suites.B, { status: 'skipped', reason: 'no broken tests', costUsd: 0, brokenBefore: 0 })
  assert.match(sb.read(path.join(sb.results, 'uc.md')), /^\| B \| 0 \| 0\.0 \| no repair: no broken tests \|/m)
  // During the repair: the source of juice-shop/ had no diff (only the marker), the build had the change.
  assert.equal(sb.read(path.join(sb.results, 'uc-A-repair.app-status')), '?? .ui-change-active.json\n')
  assert.match(sb.read(path.join(sb.results, 'uc-A-repair.app-dist')), /Go to checkout/)
  // The copy: branch main, no origin. B got no copy.
  const copy = path.join(sb.root, 'harness-demo-runs', 'maintenance', 'uc', 'A')
  assert.equal(git(copy, 'branch', '--show-current'), 'main')
  assert.equal(git(copy, 'remote'), '')
  assert.equal(fs.existsSync(path.join(sb.root, 'harness-demo-runs', 'maintenance', 'uc', 'B')), false)
  // After the revert: no marker, a clean tree, a clean build, 3 frontend builds.
  assert.equal(fs.existsSync(sb.marker), false)
  assert.equal(git(sb.app, 'status', '--short'), '')
  assert.match(sb.read(path.join(sb.app, 'frontend', 'dist', 'x.html')), />Checkout</)
  assert.equal(sb.read(path.join(sb.app, '.build-count')), '3')
})

test('sandbox: SIGTERM to the script only. The current step ends, then the revert runs, exit 143', async () => {
  const sb = sandbox({ A: BROKEN_A })
  const { spawn } = await import('node:child_process')
  const child = spawn(process.execPath, sb.args('--out', 'uc'), { env: { ...sb.env, SANDBOX_SLOW_BUILD: '1' } })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', d => { stdout += d })
  child.stderr.on('data', d => { stderr += d })
  const exited = new Promise(resolve => child.on('exit', code => resolve(code)))
  const second = path.join(sb.app, 'building-2')
  for (let i = 0; i < 300 && !fs.existsSync(second); i++) await new Promise(resolve => setTimeout(resolve, 50))
  assert.ok(fs.existsSync(second), 'the build of the change did not start')
  child.kill('SIGTERM')
  assert.equal(await exited, 143, stdout + stderr)
  assert.match(stdout, /SIGTERM: the script stops after the current step/)
  assert.match(stderr, /error: stopped by SIGTERM/)
  assert.doesNotMatch(stdout, /run suite A in .*all-A\.json/)
  assert.equal(fs.existsSync(sb.marker), false)
  assert.equal(git(sb.app, 'status', '--short'), '')
  assert.match(sb.read(path.join(sb.app, 'frontend', 'dist', 'x.html')), />Checkout</)
  assert.equal(sb.read(path.join(sb.app, '.build-count')), '3')
})

test('sandbox: a failed rebuild in the revert keeps the marker, and the next run stops with the steps of the revert', () => {
  const sb = sandbox({ A: BROKEN_A })
  const r = spawnSync(process.execPath, sb.args('--out', 'uc'), { encoding: 'utf8', env: { ...sb.env, SANDBOX_FAIL_BUILD: '3' } })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stderr, /error: npm run --silent build:frontend failed/)
  assert.deepEqual(JSON.parse(sb.read(sb.marker)).applied, [1])
  assert.equal(git(sb.app, 'status', '--short'), '?? .ui-change-active.json')
  assert.match(sb.read(path.join(sb.app, 'frontend', 'dist', 'x.html')), /Go to checkout/)
  const again = spawnSync(process.execPath, sb.args('--out', 'uc2'), { encoding: 'utf8', env: sb.env })
  assert.equal(again.status, 1)
  assert.match(again.stderr, /\.ui-change-active\.json exists: a run \(out uc, pid \d+/)
  assert.ok(again.stderr.includes(`apply -R '${path.join(sb.lab, 'sealed-ui', '01-rename.patch')}'`), again.stderr)
  assert.equal(sb.read(path.join(sb.app, '.build-count')), '3')
})

test('sandbox: claude-locked.sh fails before its run. The script stops before the next paid step and keeps the paid result', () => {
  const sb = sandbox({ A: BROKEN_A, B: BROKEN_A })
  const r = spawnSync(process.execPath, sb.args('--repair', '--out', 'uc'), { encoding: 'utf8', env: { ...sb.env, SANDBOX_CL_FAIL_TAG: 'uc-B-repair' } })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stderr, /claude-locked\.sh exit 1, and there is no bench\/results\/uc-B-repair\.meta/)
  assert.doesNotMatch(r.stdout, /run suite B \(repair copy\)/)
  const out = JSON.parse(sb.read(path.join(sb.results, 'uc.json')))
  assert.equal(out.status, 'incomplete')
  assert.match(out.error, /no bench\/results\/uc-B-repair\.meta/)
  assert.deepEqual(Object.keys(out.repair.suites), ['A'])
  assert.equal(out.repair.suites.A.status, 'done')
  assert.match(sb.read(path.join(sb.results, 'uc.md')), /Status: incomplete\./)
  assert.equal(fs.existsSync(sb.marker), false)
  assert.equal(git(sb.app, 'status', '--short'), '')
})

test('sandbox: SIGTERM during the repair goes on to claude-locked.sh. The repair stops, the revert runs, the paid result stays', async () => {
  const sb = sandbox({ A: BROKEN_A })
  const { spawn } = await import('node:child_process')
  const child = spawn(process.execPath, sb.args('--repair', '--out', 'uc'), { env: { ...sb.env, SANDBOX_CL_SLOW: '1' } })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', d => { stdout += d })
  child.stderr.on('data', d => { stderr += d })
  const exited = new Promise(resolve => child.on('exit', code => resolve(code)))
  const started = path.join(sb.results, 'uc-A-repair.started')
  for (let i = 0; i < 400 && !fs.existsSync(started); i++) await new Promise(resolve => setTimeout(resolve, 50))
  assert.ok(fs.existsSync(started), 'the repair did not start')
  const t0 = Date.now()
  child.kill('SIGTERM')
  assert.equal(await exited, 143, stdout + stderr)
  assert.ok(Date.now() - t0 < 20_000, 'the script waited for the end of the repair')
  assert.match(stderr, /claude-locked\.sh stopped \(exit 143\)/)
  const out = JSON.parse(sb.read(path.join(sb.results, 'uc.json')))
  assert.equal(out.status, 'incomplete')
  assert.deepEqual([out.repair.suites.A.status, out.repair.suites.A.exit, out.repair.suites.A.costUsd], ['stopped', 143, 0.5])
  assert.equal(fs.existsSync(sb.marker), false)
  assert.equal(git(sb.app, 'status', '--short'), '')
  assert.match(sb.read(path.join(sb.app, 'frontend', 'dist', 'x.html')), />Checkout</)
})
