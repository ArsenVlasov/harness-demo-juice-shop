// Tests of the E5a review kit: the harness-file filter of prepare-review.mjs and the math of review-timer.mjs.
//
//   PATH=~/.local/node-v24.21.0/bin:$PATH node --test bench/test/
//
// The tests use temp git repos under $TMPDIR. They do not read or change the suites, the app or bench/results/.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { extractCopy, harnessPaths, initRepo, isHarness, leftoverHarness, normalizePackage } from '../prepare-review.mjs'
import { csvRow, diffStat, nextRow, otherRunning, parseCsv, readLog, suiteState, summarize } from '../review-timer.mjs'

const TIMER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'review-timer.mjs')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'review-test-'))
after(() => fs.rmSync(TMP, { recursive: true, force: true }))

const git = (repo, ...args) => execFileSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args],
  { encoding: 'utf8', env: { ...process.env, GIT_COMMITTER_DATE: '2020-01-02T03:04:05Z', GIT_AUTHOR_DATE: '2020-01-02T03:04:05Z' } })
function write (root, files) {
  for (const [f, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true })
    fs.writeFileSync(path.join(root, f), text)
  }
}
function commit (repo, files, tag) {
  write(repo, files)
  git(repo, 'add', '-A')
  git(repo, 'commit', '-q', '-m', tag)
  git(repo, 'tag', '-a', tag, '-m', tag)
}

// A fake suite B: baseline, then the harness, then the test cases and the generated tests.
const REPO = path.join(TMP, 'suite b')
const HARNESS_FILES = ['.claude/rules/a.md', '.claude/settings.json', '.githooks/pre-commit', '.gitignore', 'CLAUDE.md', 'docs/notes.md',
  'eslint.config.mjs', 'package.json', 'scripts/lint.mjs', 'tsconfig.json']
const HARNESS_PKG = '{\n  "name": "t",\n  "scripts": {\n    "test": "playwright test",\n    "lint": "node scripts/lint.mjs"\n  },\n  "devDependencies": {}\n}\n'
before(() => {
  fs.mkdirSync(REPO)
  git(REPO, 'init', '-q', '-b', 'main')
  commit(REPO, { 'package.json': '{}\n', 'package-lock.json': '{}\n', 'playwright.config.ts': 'export default {}\n', '.gitignore': 'node_modules/\n' }, 'baseline')
  commit(REPO, {
    'package.json': HARNESS_PKG,
    '.gitignore': 'node_modules/\n.agent-log/\n',
    'tsconfig.json': '{}\n',
    'CLAUDE.md': 'rules\n',
    '.claude/rules/a.md': 'rule\n',
    '.claude/settings.json': '{}\n',
    'docs/notes.md': 'notes\n',
    'scripts/lint.mjs': '\n',
    '.githooks/pre-commit': '\n',
    'eslint.config.mjs': '\n'
  }, 'harness-v1')
  commit(REPO, {
    'test-cases/TC-01-login.md': '# TC-01\n',
    'tests/login.spec.ts': 'test\n',
    'tests/pages/login page.ts': 'page\n',
    '.claude/rules/added-by-agent.md': 'new rule\n',
    'scripts/global-setup.ts': 'setup\n',
    'docs/coverage.md': 'coverage\n',
    '.playwright-mcp/console.log': 'log\n',
    '.agent-log/actions.jsonl': '{}\n',
    'test-results/results.json': '{}\n'
  }, 'gen-1')
})

describe('prepare-review: harness-file filter', () => {
  test('harnessPaths lists the diff files and the agent and output folders', () => {
    const h = harnessPaths(REPO)
    assert.deepEqual([...h.files].sort(), HARNESS_FILES)
    assert.deepEqual(h.dirs, ['.agent-log/', '.claude/', '.githooks/', '.playwright-mcp/', 'test-results/'])
  })

  test('isHarness keeps the project files and the test code', () => {
    const h = harnessPaths(REPO)
    for (const f of ['package.json', 'package-lock.json', 'playwright.config.ts', 'tsconfig.json', 'tests/login.spec.ts', 'test-cases/TC-01-login.md',
      'docs/coverage.md', 'scripts/global-setup.ts']) {
      assert.equal(isHarness(f, h), false, f)
    }
    for (const f of ['CLAUDE.md', '.gitignore', 'eslint.config.mjs', '.claude/rules/added-by-agent.md', '.agent-log/actions.jsonl',
      '.playwright-mcp/console.log', 'test-results/results.json', 'docs/notes.md', 'scripts/lint.mjs', '.githooks/pre-push']) {
      assert.equal(isHarness(f, h), true, f)
    }
  })

  test('extractCopy writes only the files that are not harness files', () => {
    const h = harnessPaths(REPO)
    const dir = path.join(TMP, 'copy-1')
    const t0 = Date.now() - 2000
    const { kept, dropped } = extractCopy(REPO, 'gen-1', dir, h)
    const expected = ['docs/coverage.md', 'package-lock.json', 'package.json', 'playwright.config.ts', 'scripts/global-setup.ts',
      'test-cases/TC-01-login.md', 'tests/login.spec.ts', 'tests/pages/login page.ts', 'tsconfig.json']
    assert.deepEqual([...kept].sort(), expected)
    const onDisk = fs.readdirSync(dir, { recursive: true }).filter(f => fs.statSync(path.join(dir, f)).isFile()).sort()
    assert.deepEqual(onDisk, expected)
    assert.equal(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'), HARNESS_PKG)
    assert.deepEqual(leftoverHarness(dir, h), [])
    // The paths that only the folder rules remove (prepare-review writes them to the mapping).
    // .agent-log/ is not in the ref: the .gitignore of the harness holds it.
    assert.deepEqual(dropped.filter(f => !h.files.has(f)).sort(),
      ['.claude/rules/added-by-agent.md', '.playwright-mcp/console.log', 'test-results/results.json'])
    // tar -m: the files get the time of the extraction, not the commit time (2020) of the ref.
    for (const f of [...expected, 'tests', 'docs']) assert.ok(fs.statSync(path.join(dir, f)).mtimeMs >= t0, f)
  })

  test('normalizePackage gives each copy the same scripts and keeps the other fields', () => {
    const dir = path.join(TMP, 'copy-pkg')
    write(dir, { 'package.json': HARNESS_PKG })
    assert.deepEqual(normalizePackage(dir), ['test', 'lint'])
    assert.equal(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'),
      '{\n  "name": "t",\n  "scripts": {\n    "test": "playwright test"\n  },\n  "devDependencies": {}\n}\n')
    assert.equal(normalizePackage(path.join(TMP, 'no-such-copy')), null)
  })

  test('the same list applies to a suite without the harness (suite A)', () => {
    const a = path.join(TMP, 'suite-a')
    fs.mkdirSync(a)
    git(a, 'init', '-q', '-b', 'main')
    commit(a, { 'package.json': '{}\n', '.gitignore': 'node_modules/\n', 'playwright.config.ts': '\n' }, 'baseline')
    commit(a, { 'tests/TC-01.spec.ts': 'test\n', '.playwright-mcp/x.log': 'log\n' }, 'gen-1')
    const { kept } = extractCopy(a, 'gen-1', path.join(TMP, 'copy-a'), harnessPaths(REPO))
    assert.deepEqual([...kept].sort(), ['package.json', 'playwright.config.ts', 'tests/TC-01.spec.ts'])
  })

  test('leftoverHarness finds harness files and folders in a copy', () => {
    const h = harnessPaths(REPO)
    const dir = path.join(TMP, 'copy-2')
    write(dir, { 'tests/a.spec.ts': '\n', 'CLAUDE.md': '\n', '.claude/x.md': '\n', 'node_modules/docs/x.md': '\n', 'tests/docs/y.md': '\n',
      'docs/notes.md': '\n', 'docs/own.md': '\n' })
    assert.deepEqual(leftoverHarness(dir, h).sort(), ['.claude', 'CLAUDE.md', 'docs/notes.md'])
  })

  test('initRepo makes one commit "Review start" and ignores node_modules and the outputs', () => {
    const dir = path.join(TMP, 'copy-3')
    write(dir, { 'tests/a.spec.ts': 'a\n', 'node_modules/x/index.js': '\n', 'test-results/r.json': '{}\n' })
    initRepo(dir)
    assert.equal(git(dir, 'log', '--format=%s').trim(), 'Review start')
    assert.equal(git(dir, 'ls-files').trim(), 'tests/a.spec.ts')
    assert.equal(git(dir, 'status', '--porcelain').trim(), '')
  })
})

describe('review-timer: summary math', () => {
  const at = hhmm => `2026-10-24T${hhmm}:00.000Z`
  const row = (hhmm, event, extra = {}) => ({ time: at(hhmm), suite: 'suite-1', event, issue: '', severity: '', text: '', ...extra })

  test('review and fix minutes do not count the pauses', () => {
    const rows = [
      row('10:00', 'start'), row('10:10', 'pause'), row('10:20', 'resume'),
      row('10:22', 'issue', { issue: '1', severity: 'major' }),
      row('10:25', 'fix-start', { issue: '1' }), row('10:30', 'pause'), row('10:40', 'resume'), row('10:45', 'fix-end', { issue: '1' }),
      row('10:50', 'issue', { issue: '2', severity: 'blocker' }), row('10:51', 'issue', { issue: '3' }),
      row('10:52', 'fix-start'), row('10:55', 'fix-end'),
      row('11:00', 'stop')
    ]
    // Active: 10:00-10:10, 10:20-10:30, 10:40-11:00 = 40 min. Fixes: 10:25-10:30 + 10:40-10:45 + 10:52-10:55 = 13 min.
    assert.deepEqual(summarize(rows)['suite-1'], {
      status: 'stopped', reviewMin: 40, fixMin: 13, fixes: 2, issues: { blocker: 1, major: 1, minor: 0, unrated: 1, total: 3 }
    })
  })

  test('an open review and an open fix end at "now"', () => {
    const rows = [row('10:00', 'start'), row('10:05', 'fix-start'), { ...row('10:00', 'start'), suite: 'suite-2' }, { ...row('10:06', 'pause'), suite: 'suite-2' }]
    const s = summarize(rows, Date.parse(at('10:30')))
    assert.deepEqual([s['suite-1'].status, s['suite-1'].reviewMin, s['suite-1'].fixMin], ['running', 30, 25])
    assert.deepEqual([s['suite-2'].status, s['suite-2'].reviewMin], ['paused', 6])
  })

  test('a stop after a pause adds no time', () => {
    const s = summarize([row('10:00', 'start'), row('10:15', 'pause'), row('10:50', 'stop')])['suite-1']
    assert.deepEqual([s.status, s.reviewMin], ['stopped', 15])
  })

  test('minutes keep one decimal', () => {
    const s = summarize([{ ...row('10:00', 'start') }, { ...row('10:00', 'stop'), time: '2026-10-24T10:01:30.000Z' }])['suite-1']
    assert.equal(s.reviewMin, 1.5)
  })

  test('only one suite runs at a time', () => {
    const two = suite => ({ ...row('10:00', 'start'), suite })
    const rows = [row('10:00', 'start'), { ...row('10:05', 'pause'), suite: 'suite-2' }]
    assert.deepEqual(otherRunning(rows, 'suite-2'), ['suite-1'])
    assert.throws(() => nextRow('start', 'suite-3', [], rows), /the timer of suite-1 runs\. Give pause suite-1 first/)
    assert.throws(() => nextRow('resume', 'suite-2', [], [two('suite-2'), ...rows]), /Give pause suite-1 first/)
    assert.deepEqual(nextRow('start', 'suite-3', [], [...rows, row('10:10', 'pause')]), ['', '', ''])
    assert.deepEqual(nextRow('issue', 'suite-1', ['x'], rows, 'minor'), [1, 'minor', 'x'])
  })

  test('suiteState gives the issue count and the open fix', () => {
    const rows = [row('10:00', 'start'), row('10:01', 'issue', { issue: '1' }), row('10:02', 'issue', { issue: '2' }), row('10:03', 'fix-start', { issue: '2' })]
    assert.deepEqual(suiteState(rows, 'suite-1'), { status: 'running', issues: 2, openFix: '2' })
    assert.deepEqual(suiteState(rows, 'suite-9'), { status: 'none', issues: 0, openFix: null })
  })

  test('CSV quoting keeps commas, quotes and line breaks', () => {
    const values = ['2026-10-24T10:00:00.000Z', 'suite-1', 'issue', 1, 'minor', 'a, "b"\nc']
    assert.equal(csvRow(values), '2026-10-24T10:00:00.000Z,suite-1,issue,1,minor,"a, ""b""\nc"\n')
    assert.deepEqual(parseCsv(csvRow(['h1', 'h2']) + csvRow(values)), [['h1', 'h2'], values.map(String)])
  })
})

describe('review-timer: CLI', () => {
  const logFile = path.join(TMP, 'review-log.csv')
  const dest = path.join(TMP, 'review')
  const cli = (...args) => spawnSync(process.execPath, [TIMER, ...args, '--log', logFile], { encoding: 'utf8' })

  test('the commands add rows, refuse a wrong order and print the summary', () => {
    fs.writeFileSync(logFile, 'time,suite,event,issue,severity,text\n')
    for (const args of [['start', 'suite-1'], ['issue', 'suite-1', 'Step 3: no check of "Total", price', '--severity', 'major'],
      ['issue', 'suite-1', 'unclear', 'name'], ['fix-start', 'suite-1', '1'], ['pause', 'suite-1'], ['resume', 'suite-1'],
      ['fix-end', 'suite-1'], ['stop', 'suite-1'], ['start', 'suite-2']]) {
      const r = cli(...args)
      assert.equal(r.status, 0, `${args.join(' ')}: ${r.stderr}`)
    }
    for (const args of [['pause', 'suite-1'], ['start', 'suite-1'], ['issue', 'suite-1', 'x'], ['start', 'suite1'], ['fix-end', 'suite-2'],
      ['fix-start', 'suite-2', '1'], ['issue', 'suite-2', 'x', '--severity', 'high'], ['issue', 'suite-2'], ['stop', 'suite-3'], ['jump', 'suite-2'],
      ['issue', 'suite-2', 'x', '--severity=major'], ['issue', 'suite-2', 'x', '-s', 'major'], ['issue', 'suite-2', 'x', '--severity'],
      ['start', 'suite-3']]) {
      const r = cli(...args)
      assert.notEqual(r.status, 0, `${args.join(' ')} must fail`)
      assert.match(r.stderr, /^error: /)
    }
    const rows = readLog(logFile)
    assert.deepEqual(rows.map(r => r.event), ['start', 'issue', 'issue', 'fix-start', 'pause', 'resume', 'fix-end', 'stop', 'start'])
    assert.deepEqual(rows.filter(r => r.event === 'issue').map(r => [r.issue, r.severity, r.text]),
      [['1', 'major', 'Step 3: no check of "Total", price'], ['2', '', 'unclear name']])
    assert.equal(rows.find(r => r.event === 'fix-end').issue, '1')

    write(path.join(dest, 'suite-1'), { 'tests/a.spec.ts': 'a\n' })
    initRepo(path.join(dest, 'suite-1'))
    write(path.join(dest, 'suite-1'), { 'tests/a.spec.ts': 'a\nb\n', 'tests/new.spec.ts': 'n\n', 'test-results/r.json': '{}\n' })
    const r = spawnSync(process.execPath, [TIMER, 'summary', '--dest', dest, '--log', logFile], { encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    const line1 = r.stdout.split('\n').find(l => l.startsWith('| suite-1 '))
    assert.match(line1, /^\| suite-1 \| stopped \| [\d.]+ \| 2 \| 0 \| 1 \| 0 \| 1 \| 1 \| [\d.]+ \| 1 file changed, 1 insertion\(\+\), 1 new files not in git \|$/)
    assert.match(r.stdout.split('\n').find(l => l.startsWith('| suite-2 ')), /\| running \|.*\| no copy \|$/)
  })

  test('a locked log or a locked folder of the copies gives a clear error', () => {
    const lockedLog = path.join(TMP, 'locked-log.csv')
    fs.writeFileSync(lockedLog, 'time,suite,event,issue,severity,text\n')
    const lockedDest = path.join(TMP, 'locked-review')
    fs.mkdirSync(lockedDest)
    fs.chmodSync(lockedLog, 0o000)
    fs.chmodSync(lockedDest, 0o000)
    try {
      const r1 = spawnSync(process.execPath, [TIMER, 'start', 'suite-1', '--log', lockedLog], { encoding: 'utf8' })
      assert.equal(r1.status, 1)
      assert.match(r1.stderr, /^error: .*locked-log\.csv: no access \(mode 000\)\. An agent run is active/)
      const r2 = spawnSync(process.execPath, [TIMER, 'summary', '--dest', lockedDest, '--log', logFile], { encoding: 'utf8' })
      assert.equal(r2.status, 1)
      assert.match(r2.stderr, /^error: .*locked-review: no access \(mode 000\)/)
    } finally {
      fs.chmodSync(lockedLog, 0o644)
      fs.chmodSync(lockedDest, 0o755)
    }
  })

  test('diffStat counts committed edits against the first commit', () => {
    const dir = path.join(TMP, 'copy-4')
    write(dir, { 'a.ts': 'a\n' })
    initRepo(dir)
    assert.equal(diffStat(dir), 'no changes')
    write(dir, { 'a.ts': 'b\n' })
    git(dir, 'commit', '-q', '-am', 'edit')
    assert.equal(diffStat(dir), '1 file changed, 1 insertion(+), 1 deletion(-)')
  })
})
