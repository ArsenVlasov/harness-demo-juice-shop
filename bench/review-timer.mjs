#!/usr/bin/env node
// Timer and log for the human review of E5a (plan v2). Each command adds one row to bench/review-log.csv.
//
//   node bench/review-timer.mjs start suite-1
//   node bench/review-timer.mjs pause suite-1          then: resume suite-1
//   node bench/review-timer.mjs issue suite-1 "<text>" [--severity blocker|major|minor]
//   node bench/review-timer.mjs fix-start suite-1 [<issue no>]    then: fix-end suite-1
//   node bench/review-timer.mjs stop suite-1
//   node bench/review-timer.mjs summary [--dest <folder of the copies, default RUNS/review>]
//   --log <file>: use another log file (for a test). Default: bench/review-log.csv.
//
// Row: time (ISO, UTC), suite, event, issue no, severity, text. Issue numbers start at 1 for each suite.
// An issue without --severity counts as "unrated". A stop ends the review of the suite.
// Only one suite can run at a time: pause the running suite before a start or a resume of a different suite.
// Options use the form "--severity major". Other text that starts with "-" is an error.
// Review minutes: the time from start to stop without the pauses. Fix minutes: the time from fix-start
// to fix-end without the pauses. Diff: `git diff --shortstat` of the copy against its first commit "Review start",
// plus the count of new files that git does not track yet.
// The summary does not read bench/results/review-mapping.json: the review stays blind.
import fs from 'node:fs'
import path from 'node:path'
import { LAB, RUNS, log, must, opt } from './lib.mjs'

export const HEADER = ['time', 'suite', 'event', 'issue', 'severity', 'text']
export const SEVERITIES = ['blocker', 'major', 'minor']
const FLAGS = ['--severity', '--dest', '--log']
const LOG_FILE = path.resolve(opt('--log', path.join(LAB, 'bench', 'review-log.csv')))

const csvField = v => /[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v
export const csvRow = values => values.map(v => csvField(String(v ?? ''))).join(',') + '\n'

// Parses CSV text with quoted fields (commas, quotes and line breaks in a field). Returns rows of strings.
export function parseCsv (text) {
  const rows = []
  let row = []; let field = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted && c === '"' && text[i + 1] === '"') {
      field += '"'
      i++
    } else if (c === '"') {
      quoted = !quoted
    } else if (quoted) {
      field += c
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      rows.push([...row, field])
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

// A locked agent run (bench/claude-locked.sh) can set mode 000 on the log and on the copies.
const lockedError = (p, e) => e.code === 'EACCES' ? new Error(`${p}: no access (mode 000). An agent run is active. Wait for the end of the run`) : e

export function readLog (file) {
  if (!fs.existsSync(file)) return []
  let text
  try { text = fs.readFileSync(file, 'utf8') } catch (e) { throw lockedError(file, e) }
  const [head, ...rows] = parseCsv(text)
  if (head?.join(',') !== HEADER.join(',')) throw new Error(`${file}: the first row is not "${HEADER.join(',')}"`)
  return rows.map(r => Object.fromEntries(HEADER.map((h, i) => [h, r[i] ?? ''])))
}

// The state of one suite after its rows: none, running, paused or stopped. Also the issue count and the open fix.
export function suiteState (rows, suite) {
  const st = { status: 'none', issues: 0, openFix: null }
  for (const r of rows.filter(r => r.suite === suite)) {
    if (r.event === 'start' || r.event === 'resume') st.status = 'running'
    else if (r.event === 'pause') st.status = 'paused'
    else if (r.event === 'stop') st.status = 'stopped'
    else if (r.event === 'issue') st.issues++
    else if (r.event === 'fix-start') st.openFix = r.issue
    else if (r.event === 'fix-end') st.openFix = null
  }
  return st
}

const overlap = ([a, b], [c, d]) => Math.max(0, Math.min(b, d) - Math.max(a, c))
const minutes = ms => Math.round(ms / 6000) / 10

// The numbers of the summary for each suite. An open interval (no stop, no fix-end) ends at `now`.
export function summarize (rows, now = Date.now()) {
  const acc = {}
  for (const r of rows) {
    const s = (acc[r.suite] ??= { status: 'none', active: [], fixes: [], since: null, fixSince: null, issues: { blocker: 0, major: 0, minor: 0, unrated: 0 } })
    const t = Date.parse(r.time)
    if (r.event === 'start' || r.event === 'resume') { s.since = t; s.status = 'running' }
    if ((r.event === 'pause' || r.event === 'stop') && s.since !== null) { s.active.push([s.since, t]); s.since = null }
    if (r.event === 'pause') s.status = 'paused'
    if (r.event === 'stop') s.status = 'stopped'
    if (r.event === 'issue') s.issues[r.severity || 'unrated']++
    if (r.event === 'fix-start') s.fixSince = t
    if (r.event === 'fix-end' && s.fixSince !== null) { s.fixes.push([s.fixSince, t]); s.fixSince = null }
  }
  const out = {}
  for (const [suite, s] of Object.entries(acc)) {
    const active = s.since === null ? s.active : [...s.active, [s.since, now]]
    const fixes = s.fixSince === null ? s.fixes : [...s.fixes, [s.fixSince, now]]
    const activeMs = active.reduce((n, [a, b]) => n + b - a, 0)
    const fixMs = fixes.reduce((n, f) => n + active.reduce((m, a) => m + overlap(f, a), 0), 0)
    const total = Object.values(s.issues).reduce((n, v) => n + v, 0)
    out[suite] = { status: s.status, reviewMin: minutes(activeMs), fixMin: minutes(fixMs), fixes: fixes.length, issues: { ...s.issues, total } }
  }
  return out
}

// git diff --shortstat of a copy against its first commit, plus the count of untracked new files.
export function diffStat (dir) {
  if (!fs.existsSync(path.join(dir, '.git'))) return 'no copy'
  const root = must('git', ['-C', dir, 'rev-list', '--max-parents=0', 'HEAD']).split('\n')[0]
  const stat = must('git', ['-C', dir, 'diff', '--shortstat', root]) || 'no changes'
  const added = must('git', ['-C', dir, 'ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean).length
  return added ? `${stat}, ${added} new files not in git` : stat
}

function positional () {
  const args = process.argv.slice(2)
  const out = []
  for (let i = 0; i < args.length; i++) {
    if (FLAGS.includes(args[i])) {
      if (!args[i + 1] || args[i + 1].startsWith('-')) throw new Error(`${args[i]} needs a value`)
      i++
    } else if (args[i].startsWith('-')) throw new Error(`unknown option ${args[i]}. Use ${FLAGS.join(', ')} with a space before the value`)
    else out.push(args[i])
  }
  return out
}

// The suites other than <suite> that have the state "running".
export const otherRunning = (rows, suite) =>
  [...new Set(rows.map(r => r.suite))].filter(s => s !== suite && suiteState(rows, s).status === 'running')

// Checks the command against the state of the suite. Returns the row values: issue no, severity, text.
export function nextRow (event, suite, args, rows, severity = '') {
  const st = suiteState(rows, suite)
  const open = st.status === 'running' || st.status === 'paused'
  const need = (ok, msg) => { if (!ok) throw new Error(`${event} ${suite}: ${msg} (state: ${st.status})`) }
  switch (event) {
    case 'start':
    case 'resume': {
      need(event === 'start' ? st.status === 'none' : st.status === 'paused',
        event === 'start' ? 'the review of this suite started before' : 'the timer is not paused')
      const busy = otherRunning(rows, suite)
      need(busy.length === 0, `the timer of ${busy.join(', ')} runs. Give pause ${busy[0]} first`)
      return ['', '', '']
    }
    case 'pause': need(st.status === 'running', 'the timer does not run'); return ['', '', '']
    case 'stop':
      need(open, 'no open review')
      need(st.openFix === null, 'a fix is open. Give fix-end first')
      return ['', '', '']
    case 'issue': {
      const text = args.join(' ').trim()
      need(open, 'no open review')
      need(text !== '', 'give the text of the issue')
      need(severity === '' || SEVERITIES.includes(severity), `--severity is ${SEVERITIES.join(', ')}`)
      return [st.issues + 1, severity, text]
    }
    case 'fix-start': {
      const no = args[0] ?? ''
      need(open, 'no open review')
      need(st.openFix === null, 'a fix is open. Give fix-end first')
      need(no === '' || (/^\d+$/.test(no) && Number(no) >= 1 && Number(no) <= st.issues), `no issue ${no}`)
      return [no, '', '']
    }
    case 'fix-end': need(st.openFix !== null, 'no open fix'); return [st.openFix, '', '']
    default: throw new Error(`unknown command ${event}. Use start, pause, resume, issue, fix-start, fix-end, stop or summary`)
  }
}

function record (event, suite, args) {
  if (!/^suite-\d+$/.test(suite ?? '')) throw new Error(`give the copy name, for example suite-1 (got: ${suite})`)
  const rows = readLog(LOG_FILE)
  const [issue, severity, text] = nextRow(event, suite, args, rows, opt('--severity', ''))
  const time = new Date().toISOString()
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, csvRow(HEADER))
  fs.appendFileSync(LOG_FILE, csvRow([time, suite, event, issue, severity, text]))
  const s = summarize([...rows, { time, suite, event, issue, severity }], Date.parse(time))[suite]
  log(`${suite} ${event}${issue ? ` ${issue}` : ''}${severity ? ` (${severity})` : ''}. Review ${s.reviewMin} min, ${s.issues.total} issues, state ${s.status}`)
}

function summary () {
  const dest = path.resolve(opt('--dest', path.join(RUNS, 'review')))
  try { if (fs.existsSync(dest)) fs.accessSync(dest, fs.constants.R_OK | fs.constants.X_OK) } catch (e) { throw lockedError(dest, e) }
  const sums = summarize(readLog(LOG_FILE))
  const names = Object.keys(sums).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
  const lines = [
    `Review log: ${LOG_FILE}. Copies: ${dest}.`,
    '',
    '| Suite | State | Review min | Issues | Blocker | Major | Minor | Unrated | Fixes | Fix min | Diff |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...names.map(n => {
      const s = sums[n]
      const i = s.issues
      return `| ${n} | ${s.status} | ${s.reviewMin} | ${i.total} | ${i.blocker} | ${i.major} | ${i.minor} | ${i.unrated} | ${s.fixes} | ${s.fixMin} | ${diffStat(path.join(dest, n))} |`
    })
  ]
  console.log(lines.join('\n'))
}

if (import.meta.main) {
  try {
    const [cmd, suite, ...args] = positional()
    if (cmd === 'summary') summary()
    else record(cmd, suite, args)
  } catch (e) {
    console.error(`error: ${e.message}`)
    process.exit(1)
  }
}
