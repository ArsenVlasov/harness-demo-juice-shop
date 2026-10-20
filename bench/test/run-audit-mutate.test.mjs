// Tests of bench/run-audit-mutate.mjs: the site finder, the roles (negated, looser bound, options, messages), the
// call graph, the mutation printer, the restore, and offline runs of the runner on the fixture suite.
// The fixture tests use no browser and no app: the runner gets a no-op app.
//
//   node --test bench/test/run-audit-mutate.test.mjs
//
// Do not run a bare `node --test` in bench/ or in the lab: Node 24 then also runs the fixture .ts files as tests.
// The call-graph test and the offline runs need node_modules with @playwright/test from a generated suite (read only,
// through a symlink). Without it, these tests are skipped.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { LAB, RUNS, must } from '../lib.mjs'
import { analyse, applyMutant, audit, isAssertionName, mutation, specsImporting, withMutant } from '../run-audit-mutate.mjs'

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'mutate')
const PRECISE_DIR = JSON.parse(fs.readFileSync(path.join(LAB, 'bench', 'conditions.json'), 'utf8')).conditions.precise.dir // set-1, not 'precise'
const MODULES = ['suite-a', 'suite-b', `${PRECISE_DIR}/run-1/suite-a`, `${PRECISE_DIR}/run-1/suite-b`]
  .map(s => path.join(RUNS, s, 'node_modules'))
  .find(m => fs.existsSync(path.join(m, '@playwright', 'test')))
const NO_MODULES = MODULES ? false : 'no node_modules with @playwright/test in a suite'
const STE_LINT = path.join(LAB, '.claude', 'skills', 'asd-ste100', 'scripts', 'ste-lint.py')

const a = analyse(FIXTURE)
const at = (file, line, original) => a.sites.find(s => s.file === file && s.line === line && (!original || s.original === original))
const rel = files => files.map(f => path.relative(a.root, f))
const by = (list, reason) => list.filter(n => n.reason === reason).map(n => `${n.file}:${n.line}${n.helper ? ` ${n.helper}(${n.param})` : ''} ${n.text}`)

// A copy of the fixture suite in a new temp folder, with node_modules linked when `modules` is given.
function fixtureCopy (prefix, modules) {
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)))
  const dir = path.join(tmp, 'suite')
  fs.cpSync(FIXTURE, dir, { recursive: true })
  if (modules) fs.symlinkSync(modules, path.join(dir, 'node_modules'), 'dir')
  const remove = () => {
    const link = path.join(dir, 'node_modules')
    if (fs.lstatSync(link, { throwIfNoEntry: false })?.isSymbolicLink()) fs.unlinkSync(link)
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  return { tmp, dir, remove }
}

// A git repository with the fixture suite in a new temp folder.
function fixtureRepo (prefix, modules) {
  const copy = fixtureCopy(prefix, null)
  const git = args => must('git', ['-C', copy.dir, '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args])
  git(['init', '-q'])
  git(['add', '-A'])
  git(['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '-m', 'fixture'])
  if (modules) fs.symlinkSync(modules, path.join(copy.dir, 'node_modules'), 'dir')
  return { ...copy, repo: copy.dir, git }
}

const noopApp = (calls, failAt = Infinity) => ({
  check: () => calls.push('check'),
  restart: () => {
    calls.push('restart')
    if (calls.filter(c => c === 'restart').length >= failAt) throw new Error('start-app failed (test)')
  },
  stop: () => calls.push('stop')
})

test('site finder: expect() in specs and should* page-object methods', () => {
  assert.deepEqual(a.sites.map(s => `${s.id} ${s.file}:${s.line} ${s.original} -> ${s.mutated}`), [
    'S001 pages/cart-page.ts:26 0 -> 1',
    "S002 pages/cart-page.ts:35 'Cart' -> 'Cart_mut'",
    "S003 pages/flaky-page.ts:5 'quiet' -> 'quiet_mut'",
    'S004 pages/login-page.ts:10 true -> false',
    "S005 pages/login-page.ts:14 'Login' -> 'Login_mut'",
    "S006 tests/pages.spec.ts:7 '17.17' -> '17.17_mut'",
    'S007 tests/pages.spec.ts:9 2 -> 3',
    "S008 tests/pages.spec.ts:10 'Cart' -> 'Cart_mut'",
    "S009 tests/pages.spec.ts:11 'Apple' -> 'Apple_mut'",
    'S010 tests/pages.spec.ts:11 1 -> 2',
    'S011 tests/relative.spec.ts:8 5 -> 6',
    "S012 tests/values.spec.ts:9 'Total' -> 'Total_mut'",
    'S013 tests/values.spec.ts:18 17 -> 18',
    'S014 tests/values.spec.ts:20 /Total: \\d+/ -> /(?:Total: \\d+)_mut/',
    'S015 tests/values.spec.ts:21 17 -> 18',
    'S016 tests/values.spec.ts:22 -1 -> 0',
    'S017 tests/values.spec.ts:23 17 -> 18', // not.toBeLessThan(17) is a lower bound: n + 1 makes it stricter
    'S018 tests/values.spec.ts:24 8.99 -> 9.99',
    "S019 tests/values.spec.ts:25 'Apple' -> 'Apple_mut'",
    'S020 tests/values.spec.ts:25 1 -> 2',
    "S021 tests/values.spec.ts:26 'Apple' -> 'Apple_mut'", // in expect.objectContaining(...)
    "S022 tests/values.spec.ts:28 'Invalid coupon.' -> 'Invalid coupon._mut'", // `message` in an expected value
    "S023 tests/values.spec.ts:29 'error' -> 'error_mut'",
    'S024 tests/values.spec.ts:30 /Total|Refund/ -> /(?:Total|Refund)_mut/',
    "S025 tests/values.spec.ts:31 'Total' -> 'Total_mut'", // soft = expect.configure({ soft: true })
    'S026 tests/values.spec.ts:34 `17` -> `17_mut`',
    'S027 tests/values.spec.ts:35 true -> false',
    'S028 tests/values.spec.ts:37 17 -> 18',
    'S029 tests/values.spec.ts:43 1 -> 2',
    'S030 tests/values.spec.ts:43 2 -> 3',
    'S031 utils/assertions.ts:13 false -> true'
  ])
})

test('site finder: literals that cannot fail, options, names and timing are not mutated', () => {
  assert.deepEqual(by(a.notMutated, 'cannot fail: negated check'), [
    "pages/cart-page.ts:21 ''", // .not.toBe('')
    "tests/values.spec.ts:19 'Refund'", // .not.toContain('Refund')
    "tests/values.spec.ts:27 'Refund'" // expect.not.stringContaining('Refund')
  ])
  assert.deepEqual(by(a.notMutated, 'cannot fail: looser bound'), ['tests/values.spec.ts:22 0']) // toBeLessThan(0)
  assert.deepEqual(by(a.notMutated, 'matcher option'), ['tests/values.spec.ts:24 2']) // toBeCloseTo(8.99, 2)
  assert.deepEqual(by(a.notMutated, 'attribute or property name'), ["tests/values.spec.ts:29 'status'"])
  assert.deepEqual(by(a.notMutated, 'timing option'), [
    'tests/relative.spec.ts:8 retries: 3',
    'tests/relative.spec.ts:8 delay: 10',
    'tests/values.spec.ts:21 timeout: 1000',
    'tests/values.spec.ts:21 intervals: [100, 200]',
    'tests/values.spec.ts:38 timeout: 500'
  ])
  const all = [...a.sites.map(s => `${s.file} ${s.original}`), ...a.notMutated.map(n => `${n.file} ${n.text}`)]
  assert.deepEqual(all.filter(x => /express|force|soft: true|^scripts\/|config\.ts/.test(x)), []) // actions, configure, skipped files
})

test('site finder: messages, and arguments that reach only a failure message', () => {
  assert.deepEqual(by(a.notMutated, 'message'), [
    'pages/cart-page.ts:21 `Cart total must be ${amount}`',
    "tests/values.spec.ts:22 'below zero'",
    'utils/assertions.ts:4 `${description} must have the text "${text}"`',
    'utils/assertions.ts:13 `${description} must stay empty`'
  ])
  assert.deepEqual(by(a.notMutated, 'argument reaches only a failure message'), [
    "pages/cart-page.ts:16 expectText(description) 'Cart total'",
    'pages/cart-page.ts:25 expectNumber(description) `Item count`',
    "pages/cart-page.ts:43 expectStaysEmpty(description) 'Cart items'",
    "tests/pages.spec.ts:8 shouldShowTotal(amount) '17.17'", // the hidden weak check
    "tests/pages.spec.ts:10 shouldHaveTitle(description) 'Cart page title'"
  ])
})

test('site finder: lists computed expected values, not the parameters of assertion helpers', () => {
  assert.deepEqual(by(a.notMutated, 'computed expected value'), [
    'pages/cart-page.ts:43 this.state.items',
    'tests/values.spec.ts:33 TOTAL',
    'utils/assertions.ts:17 options.retries + 1'
  ])
})

test('site finder: affected tests through an index.ts barrel, tsconfig paths and relative imports', () => {
  const importers = ['tests/login.spec.ts', 'tests/pages.spec.ts', 'tests/relative.spec.ts']
  assert.deepEqual(rel(specsImporting(a.deps, at('pages/cart-page.ts', 26).abs)), importers) // behind the barrel
  assert.deepEqual(rel(specsImporting(a.deps, at('utils/assertions.ts', 13).abs)), importers) // behind the page object
  assert.deepEqual(rel(specsImporting(a.deps, at('pages/flaky-page.ts', 5).abs)), ['tests/flaky.spec.ts'])
  assert.deepEqual(rel(specsImporting(a.deps, path.join(a.root, 'data', 'constants.ts'))), ['tests/values.spec.ts'])
  assert.equal(at('pages/cart-page.ts', 26).test, null)
  assert.equal(at('pages/cart-page.ts', 26).enclosing, 'shouldHaveCount')
  assert.equal(at('tests/values.spec.ts', 9).test, null) // in a helper of the spec file, outside a test
  assert.deepEqual([at('tests/pages.spec.ts', 7).test.line, at('tests/values.spec.ts', 18).test.line, at('tests/values.spec.ts', 43, '1').test.line], [4, 12, 42])
})

test('call graph: by resolved declarations, fixtures and auto fixtures, not by method names', { skip: NO_MODULES }, () => {
  const copy = fixtureCopy('mutate-graph-', MODULES)
  try {
    const g = analyse(copy.dir)
    const runsIn = (file, line) => g.sites.find(s => s.file === file && s.line === line).reachedBy.map(t => `${t.file}:${t.line}`)
    assert.deepEqual(runsIn('pages/cart-page.ts', 35), []) // CartPage.shouldSeePage: no test calls it
    assert.deepEqual(runsIn('pages/login-page.ts', 14), ['tests/login.spec.ts:3']) // LoginPage.shouldSeePage
    assert.deepEqual(runsIn('pages/login-page.ts', 10), ['tests/login.spec.ts:3', 'tests/login.spec.ts:8']) // auto fixture
    assert.deepEqual(runsIn('pages/cart-page.ts', 26), ['tests/pages.spec.ts:4'])
    assert.deepEqual(runsIn('utils/assertions.ts', 13), ['tests/relative.spec.ts:5'])
    assert.deepEqual(runsIn('tests/values.spec.ts', 9), ['tests/values.spec.ts:12']) // checkLabel()
    assert.deepEqual(runsIn('pages/flaky-page.ts', 5), []) // imported, not called
  } finally {
    copy.remove()
  }
})

test('isAssertionName: prefixes with a word boundary, not the action check()', () => {
  for (const n of ['shouldSeeTotal', 'expectTotals', 'assertTotal', 'verifyItems', 'checkTotal', 'expect', 'ShouldSee', 'CHECK_TOTAL', '#verifyX', 'Check']) {
    assert.equal(isAssertionName(n), true, n)
  }
  for (const n of ['check', 'checkout', 'checkoutToDelivery', 'checked', 'expectation', 'verifying', 'shouldered', 'toBe', 'assertion']) {
    assert.equal(isAssertionName(n), false, n)
  }
})

test('mutation printer: each operator', () => {
  const mutate = code => {
    const sf = ts.createSourceFile('x.ts', `const v = ${code};`, ts.ScriptTarget.Latest, true)
    return mutation(sf.statements[0].declarationList.declarations[0].initializer, sf)?.mutated ?? null
  }
  const cases = [
    ['17', '18'], ['17.98', '18.98'], ['0.1', '1.1'], ['-1', '0'], ['-0.5', '0.5'], ['1_000', '1001'], ['0x10', '17'],
    ['1e3', '1001'], ['10n', '11n'], ["'abc'", "'abc_mut'"], ['"17.17¤"', '"17.17¤_mut"'], ['""', '"_mut"'], ["''", "'_mut'"],
    ['`tpl`', '`tpl_mut`'], ["'it\\'s'", "'it\\'s_mut'"], ['/a\\/b/gi', '/(?:a\\/b)_mut/gi'], ['/#\\/basket$/', '/(?:#\\/basket$)_mut/'],
    ['/#\\/login|#\\/register/', '/(?:#\\/login|#\\/register)_mut/'], ['true', 'false'], ['false', 'true'], ['null', null],
    ['`a${b}`', null], ['x', null], ['f(1)', null]
  ]
  for (const [code, expected] of cases) assert.equal(mutate(code), expected, code)
  assert.ok(!/(?:#\/login|#\/register)_mut/.test('#/login'), 'the mutant of an alternation does not match the original value')
})

test('applyMutant: changes only the site, keeps a BOM, and refuses a stale position', () => {
  const s = at('tests/values.spec.ts', 18)
  const text = fs.readFileSync(s.abs, 'utf8')
  const out = applyMutant(text, s)
  assert.equal(out.length, text.length)
  assert.equal(out.slice(0, s.start), text.slice(0, s.start))
  assert.equal(out.slice(s.start, s.start + 2), '18')
  assert.equal(out.slice(s.start + 2), text.slice(s.end))
  assert.equal(applyMutant(`\uFEFF${text}`, s), `\uFEFF${out}`) // TypeScript positions start after a BOM
  assert.throws(() => applyMutant(`x${text}`, s), /does not hold 17/)
})

test('withMutant: restores the original bytes after a pass, a throw and an overwrite', () => {
  const copy = fixtureCopy('mutate-restore-', null)
  try {
    const s = analyse(copy.dir).sites.find(x => x.file === 'tests/values.spec.ts' && x.original === "'Invalid coupon.'")
    const before = fs.readFileSync(s.abs)
    assert.ok(before.includes(Buffer.from('17.17¤')))
    const seen = withMutant(s, () => fs.readFileSync(s.abs, 'utf8'))
    assert.ok(seen.includes("toMatchObject({ message: 'Invalid coupon._mut' })"))
    assert.ok(fs.readFileSync(s.abs).equals(before))
    assert.throws(() => withMutant(s, () => { throw new Error('boom') }), /boom/)
    assert.ok(fs.readFileSync(s.abs).equals(before))
    withMutant(s, () => fs.writeFileSync(s.abs, 'junk'))
    assert.ok(fs.readFileSync(s.abs).equals(before))
  } finally {
    copy.remove()
  }
})

test('audit: a suite without node_modules stops before the app starts, and leaves no copy', () => {
  const { tmp, repo, remove } = fixtureRepo('mutate-nomodules-', null)
  try {
    const calls = []
    assert.throws(() => audit({ label: 'nomodules', suite: repo, results: path.join(tmp, 'results'), app: noopApp(calls) }), /node_modules\. Run npm ci/)
    assert.deepEqual(calls, ['check'])
    assert.deepEqual(fs.readdirSync(os.tmpdir()).filter(d => d.startsWith('audit-mutate-nomodules-')), [])
  } finally {
    remove()
  }
})

test('audit: offline run on the fixture suite with a no-op app', { skip: NO_MODULES, timeout: 600_000 }, () => {
  const copiesBefore = fs.readdirSync(os.tmpdir()).filter(d => d.startsWith('audit-mutate-fixture-'))
  const { tmp, repo, git, remove } = fixtureRepo('mutate-audit-', MODULES)
  try {
    const calls = []
    const results = path.join(tmp, 'results')
    const r = audit({ label: 'fixture', suite: repo, out: 'mutate-fixture', restartEvery: 5, results, app: noopApp(calls) })
    const status = Object.fromEntries(r.mutants.map(m => [m.id, m.status]))
    const expected = Object.fromEntries(r.mutants.map(m => [m.id, 'killed']))
    Object.assign(expected, { S001: 'survived', S002: 'survived', S003: 'error', S011: 'survived', S029: 'skipped', S030: 'skipped' })
    assert.deepEqual(status, expected)
    assert.deepEqual(r.totals, { sites: 31, mutants: 31, killed: 25, survived: 3, error: 1, skipped: 2 })
    assert.equal(r.complete, true)
    assert.deepEqual(r.baseline.leftOut.map(l => l.test), ['values.spec.ts :: fails at the baseline'])

    const m = id => r.mutants.find(x => x.id === id)
    // The flaky test fails with the mutant and again on the original file: no kill.
    assert.deepEqual([m('S003').killers, m('S003').unconfirmed], [[], ['flaky.spec.ts :: flaky after the first run']])
    assert.match(m('S003').note, /do not pass on the original file either/)
    // LoginPage.shouldSeePage: four tests ran, one failed. Only that test gets the kill.
    assert.deepEqual(m('S005').tests.sort(), ['login.spec.ts :: login page', 'login.spec.ts :: only the automatic fixture', 'pages.spec.ts :: should style', 'relative.spec.ts :: relative barrel import'])
    assert.deepEqual(m('S005').counted, ['login.spec.ts :: login page'])
    assert.deepEqual(m('S004').counted.sort(), ['login.spec.ts :: login page', 'login.spec.ts :: only the automatic fixture'])
    assert.deepEqual(m('S002').counted, ['(unattributed)']) // CartPage.shouldSeePage: no test runs it
    assert.deepEqual(m('S013').targets, ['(?:^|/)tests/values\\.spec\\.ts$:12'])

    assert.deepEqual(r.tests, {
      'flaky.spec.ts :: flaky after the first run': { id: 'T01', sites: 0, killed: 0, survived: 0, error: 0 },
      'login.spec.ts :: login page': { id: 'T02', sites: 2, killed: 2, survived: 0, error: 0 },
      'login.spec.ts :: only the automatic fixture': { id: 'T03', sites: 1, killed: 1, survived: 0, error: 0 },
      'pages.spec.ts :: should style': { id: 'T04', sites: 6, killed: 5, survived: 1, error: 0 },
      'relative.spec.ts :: relative barrel import': { id: 'T05', sites: 2, killed: 1, survived: 1, error: 0 },
      'values.spec.ts :: expect style': { id: 'T06', sites: 17, killed: 17, survived: 0, error: 0 },
      '(unattributed)': { id: '-', sites: 2, killed: 0, survived: 1, error: 1 }
    })
    assert.deepEqual(calls, ['check', ...Array(7).fill('restart'), 'stop']) // baseline, before mutants 1, 6, 11, 16, 21, 26

    const md = fs.readFileSync(path.join(results, 'mutate-fixture.md'), 'utf8')
    for (const h of ['## Tests', '## Mutants', '### Argument reaches only a failure message: check by hand (5)',
      '### Cannot fail: negated check (3)', '### Computed expected value (3)', '### Timing option (5)']) assert.ok(md.includes(h), h)
    assert.ok(md.includes('`tests/pages.spec.ts:8` `shouldShowTotal(amount)` `\'17.17\'`'))
    assert.match(md, /\| S005 \| .* \| failed: T02 \| killed \|/)
    assert.match(md, /\| S003 \| .* \| failed: T01\. Failed again on the original: T01 \| error /)
    assert.match(md, /\| S001 \| .* \| ran T02, T03, T04, T05 \| survived \|/)
    if (fs.existsSync(STE_LINT)) {
      const lint = spawnSync('python3', [STE_LINT, path.join(results, 'mutate-fixture.md')], { encoding: 'utf8' })
      assert.equal(lint.status, 0, lint.stdout + lint.stderr)
      assert.match(lint.stdout, /\(0 hard,/)
    }
    assert.equal(git(['status', '--short', '--untracked-files=no']), '') // the suite folder has no change
    assert.ok(fs.existsSync(path.join(MODULES, '@playwright', 'test'))) // the remove of the copy kept the modules
    assert.deepEqual(fs.readdirSync(os.tmpdir()).filter(d => d.startsWith('audit-mutate-fixture-')), copiesBefore) // copy removed
  } finally {
    remove()
  }
})

test('audit: a stop in the middle keeps the result of the finished mutants', { skip: NO_MODULES, timeout: 300_000 }, () => {
  const { tmp, repo, remove } = fixtureRepo('mutate-stop-', MODULES)
  try {
    const calls = []
    const results = path.join(tmp, 'results')
    // The third restart (before mutant 6) fails.
    assert.throws(() => audit({ label: 'stop', suite: repo, out: 'mutate-stop', results, app: noopApp(calls, 3) }), /start-app failed/)
    const saved = JSON.parse(fs.readFileSync(path.join(results, 'mutate-stop.json'), 'utf8'))
    assert.equal(saved.complete, false)
    assert.deepEqual(saved.mutants.map(x => `${x.id} ${x.status}`), ['S001 survived', 'S002 survived', 'S003 error', 'S004 killed', 'S005 killed'])
    assert.match(fs.readFileSync(path.join(results, 'mutate-stop.md'), 'utf8'), /\*\*Not complete\.\*\* The run stopped after 5 of 31 sites/)
    assert.equal(calls.at(-1), 'stop')
    assert.deepEqual(fs.readdirSync(os.tmpdir()).filter(d => d.startsWith('audit-mutate-stop-')), [])
  } finally {
    remove()
  }
})
