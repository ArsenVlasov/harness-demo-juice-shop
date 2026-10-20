#!/usr/bin/env node
// Collects the numbers of the selected suites into bench/results/<out>.md (the table for the README) and <out>.csv
// (plan section 7).
//
//   node bench/collect-metrics.mjs                          precise run 1: suites A and B, results mutants, flaky, judge
//   node bench/collect-metrics.mjs --cond vague --run 2     run 2 of vague: mutants-vague-2, flaky-vague-2, judge-vague-2
//   node bench/collect-metrics.mjs --mutants mutants-try --flaky flaky-try --judge judge-try --out summary-try
//   node bench/collect-metrics.mjs --suite before=<dir> --suite after=<dir> --ref HEAD --mutants mutants-e4 --out summary-e4
//   node bench/collect-metrics.mjs --list-suites            print the selected suites and exit
//
// Defaults: --mutants mutants-<cond>-<run>, --flaky flaky-<cond>-<run>, --judge judge-<cond>-<run>,
// --out summary-<cond>-<run>, --ref gen-<run>. For precise run 1: mutants, flaky, judge, summary.
// With --suite, --out is necessary. Without --ref, the script stops when a suite folder is not at gen-<run> or has
// changes (codeRef() in lib.mjs). The suite selector is in bench/lib.mjs.
// The generation results are gen-<cond>-<suite>-<run>.json and -followup.json (gen-<suite>-1.json for precise run 1),
// see resultName() in lib.mjs. "Tests" comes from the last clean run: clean-<cond>-<suite>-<run>-followup.json when
// it exists (bench/finish-run.sh writes it after a follow-up), else clean-<cond>-<suite>-<run>.json.
//
// Time comes from the session transcript of each generation run, not from duration_ms: with background
// subagents, the JSON output keeps only the last result event. Gaps of more than 10 minutes between two
// transcript events are pauses and do not count as work time. The gap before the follow-up message does not count
// either: its start time comes from the first line of gen-...-followup.meta, in the local time of this computer.
// A missing transcript gives n/a, not 0. The script finds the transcript <session_id>.jsonl in any folder under
// ~/.claude/projects/, because the folder name changes when a suite moves.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { RESULTS, codeRef, condRun, must, opt, outName, outOption, resultName, selectSuites } from './lib.mjs'

const GAP_MS = 10 * 60 * 1000
const TEST_CASES = 8
const PROJECTS = path.join(os.homedir(), '.claude', 'projects')
const HEADERS = { A: 'A (no harness)', B: 'B (harness)' }

const readJson = f => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null)
// null (n/a in the table) for a value that is not a finite number, for example the cost of a missing gen file.
const round = (n, d = 2) => (typeof n === 'number' && Number.isFinite(n) ? +n.toFixed(d) : null)
// v / d, or null when v is null: null / 60000 is 0 in JS.
const div = (v, d) => (v == null ? null : v / d)
const listWords = items => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)

// The transcript file of a session: <session_id>.jsonl in a folder under ~/.claude/projects/, or null.
function transcriptFile (sessionId) {
  if (!sessionId || !fs.existsSync(PROJECTS)) return null
  const found = fs.readdirSync(PROJECTS).map(d => path.join(PROJECTS, d, `${sessionId}.jsonl`)).filter(f => fs.existsSync(f)).sort()
  if (found.length > 1) console.error(`warning: ${found.length} transcripts for session ${sessionId}, the script uses ${found[0]}`)
  return found[0] ?? null
}

// The start time (ms) in the first line of a .meta file of bench/claude-locked.sh: "..., start 2026-10-20 10:16:00 EEST".
// `date` writes the local time, so the script reads it as the local time of this computer.
function metaStart (file) {
  if (!fs.existsSync(file)) return null
  const m = fs.readFileSync(file, 'utf8').split('\n')[0].match(/.*, start (\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)\b/)
  return m ? new Date(...m.slice(1).map((v, i) => Number(v) - (i === 1 ? 1 : 0))).getTime() : null
}

// Work time and tool calls from the transcript of a session. starts: the start times of the follow-ups. The delta
// from the last event before a start to the first event after it is the wait for the follow-up, not work.
function transcript (sessionId, starts) {
  const file = transcriptFile(sessionId)
  if (!file) return null
  const times = []; let toolCalls = 0
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue
    const e = JSON.parse(line)
    if (e.timestamp) times.push(Date.parse(e.timestamp))
    const content = e.message?.content
    if (Array.isArray(content)) toolCalls += content.filter(c => c.type === 'tool_use').length
  }
  times.sort((a, b) => a - b)
  let workMs = 0
  for (let i = 1; i < times.length; i++) {
    const d = times[i] - times[i - 1]
    if (d <= GAP_MS && !starts.some(t => times[i - 1] < t && t <= times[i])) workMs += d
  }
  return { workMs, toolCalls }
}

// Cost, time and tool calls of the first run and the follow-up. A follow-up that resumes the same session
// adds to the same transcript, so the script reads each transcript one time.
function generation (cond, run, s) {
  const parts = [resultName('gen', cond, s, run), resultName('gen', cond, s, run, '-followup.json')]
    .map(f => readJson(path.join(RESULTS, f))).filter(Boolean)
  if (parts.length === 0) return null
  const r = { cost: 0, workMs: 0, toolCalls: 0, followups: parts.length - 1, subagents: 0 }
  for (const p of parts) {
    r.cost += p.total_cost_usd
    r.subagents += p.subagent_stats?.spawned ?? 0
  }
  const starts = []
  if (r.followups) {
    const meta = resultName('gen', cond, s, run, '-followup.meta')
    const t = metaStart(path.join(RESULTS, meta))
    if (t == null) { console.error(`warning: suite ${s}: no start time in ${meta}. Work time is n/a.`); r.workMs = null } else starts.push(t)
  }
  for (const id of new Set(parts.map(p => p.session_id))) {
    const t = transcript(id, starts)
    if (!t) {
      console.error(`warning: suite ${s}: no transcript for session ${id}. Work time and tool calls are n/a.`)
      r.workMs = null; r.toolCalls = null
    } else if (r.toolCalls != null) {
      if (r.workMs != null) r.workMs += t.workMs
      r.toolCalls += t.toolCalls
    }
  }
  return r
}

// Files and lines of the generation commit, and the tests of the last clean run (cleanSuffix: '-followup.json' or '.json').
function volume (dir, ref, cond, run, s) {
  const files = must('git', ['-C', dir, 'diff', '--name-only', `${ref}~1`, ref]).split('\n').filter(f => f && !f.startsWith('.playwright-mcp/'))
  const stat = must('git', ['-C', dir, 'diff', '--numstat', `${ref}~1`, ref, '--', ...files]).split('\n')
  const lines = stat.reduce((n, l) => n + (Number(l.split('\t')[0]) || 0), 0)
  const cleanSuffix = ['-followup.json', '.json'].find(x => fs.existsSync(path.join(RESULTS, resultName('clean', cond, s, run, x)))) ?? '.json'
  const clean = readJson(path.join(RESULTS, resultName('clean', cond, s, run, cleanSuffix)))
  return { files: files.length, lines, cleanSuffix, tests: clean?.stats ? clean.stats.expected + clean.stats.unexpected + clean.stats.flaky : null }
}

// Stops when an input file has no data for a selected suite.
function checkInput (name, has, labels) {
  const missing = labels.filter(s => !has(s))
  if (missing.length) throw new Error(`${name} has no suite ${missing.join(', ')}. Give the input for this suite set.`)
}

function main () {
  const suites = selectSuites()
  const labels = Object.keys(suites)
  const { cond, run } = condRun()
  const MUTANTS = opt('--mutants', outName('mutants', cond, run))
  const FLAKY = opt('--flaky', outName('flaky', cond, run))
  const JUDGE = opt('--judge', outName('judge', cond, run))
  const OUT = outOption('summary')
  const REF = codeRef(suites, run)
  const genSource = resultName('gen', cond, '*', run)

  const mutants = readJson(path.join(RESULTS, `${MUTANTS}.json`))
  const flaky = readJson(path.join(RESULTS, `${FLAKY}.json`))
  const mapping = readJson(path.join(RESULTS, JUDGE, 'mapping.json'))
  const judge = s => (mapping ? readJson(path.join(RESULTS, JUDGE, `${Object.keys(mapping).find(k => mapping[k] === s)}.json`)) : null)
  if (mutants) checkInput(`${MUTANTS}.json`, s => mutants.summary[s], labels)
  if (flaky) checkInput(`${FLAKY}.json`, s => flaky.suites[s], labels)
  if (mapping) checkInput(`${JUDGE}/mapping.json`, s => Object.values(mapping).includes(s), labels)

  const rows = []
  const add = (metric, fn, source) => rows.push({ metric, values: Object.fromEntries(labels.map(s => [s, fn(s)])), source })
  const gen = Object.fromEntries(labels.map(s => [s, generation(cond, run, s)]))
  const vol = Object.fromEntries(labels.map(s => [s, volume(suites[s], REF, cond, run, s)]))
  const cleanSuffixes = [...new Set(labels.map(s => vol[s].cleanSuffix))]
  const cleanSource = cleanSuffixes.length === 1 ? resultName('clean', cond, '*', run, cleanSuffixes[0])
    : labels.map(s => resultName('clean', cond, s, run, vol[s].cleanSuffix)).join(', ')

  if (mutants) {
    add('Realistic bugs missed', s => `${mutants.summary[s].bugsTotal - mutants.summary[s].bugsCaught} of ${mutants.summary[s].bugsTotal}`, `${MUTANTS}.json`)
    add('Bugs missed (IDs)', s => mutants.summary[s].bugsMissed.join(' ') || 'none', `${MUTANTS}.json`)
    add('Mutation score', s => `${mutants.summary[s].allCaught} of ${mutants.summary[s].allTotal} (${mutants.summary[s].mutationScore})`, `${MUTANTS}.json`)
  }
  if (flaky) {
    add(`Flaky tests (${flaky.repeats} runs)`, s => flaky.suites[s].summary.flaky, `${FLAKY}.json`)
    add(`Broken tests (${flaky.repeats} runs)`, s => flaky.suites[s].summary.broken, `${FLAKY}.json`)
  }
  if (mapping) {
    add('Judge: steps covered / partial / missing', s => { const j = judge(s); return `${j.counts.covered} / ${j.counts.partial} / ${j.counts.missing} of ${j.stepsExpected}` }, `${JUDGE}/`)
    add('Judge model', s => judge(s).model, `${JUDGE}/`)
  }
  add('Generation cost, USD', s => round(gen[s]?.cost), genSource)
  add('Cost for each test case, USD', s => round(div(gen[s]?.cost, TEST_CASES)), genSource)
  add('Work time, min', s => round(div(gen[s]?.workMs, 60000), 1), 'transcript')
  add('Work time for each test case, min', s => round(div(gen[s]?.workMs, 60000 * TEST_CASES), 1), 'transcript')
  add('Tool calls of the main agent', s => gen[s]?.toolCalls, 'transcript')
  add('Subagents', s => gen[s]?.subagents, genSource)
  add('Follow-up messages', s => gen[s]?.followups, genSource)
  add('Tests', s => vol[s].tests, cleanSource)
  add('Files written', s => vol[s].files, `git diff ${REF}~1 ${REF}`)
  add('Lines written', s => vol[s].lines, `git diff ${REF}~1 ${REF}`)

  const md = [
    `# Summary: ${listWords(labels.map(s => `suite ${s}`))}, ${cond === 'precise' ? '' : `condition ${cond}, `}run ${run}`,
    '',
    `Source: \`bench/collect-metrics.mjs\`, ${new Date().toISOString()}. Inputs: \`${MUTANTS}\`, \`${FLAKY}\`, \`${JUDGE}\`.`,
    '',
    `| Metric | ${labels.map(s => HEADERS[s] ?? s).join(' | ')} | Source |`,
    `|---|${labels.map(() => '---|').join('')}---|`,
    ...rows.map(r => `| ${r.metric} | ${labels.map(s => r.values[s] ?? 'n/a').join(' | ')} | \`${r.source}\` |`),
    '',
    'Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.',
    ''
  ].join('\n')
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [['metric', ...labels, 'source'].join(','), ...rows.map(r => [r.metric, ...labels.map(s => r.values[s]), r.source].map(cell).join(','))].join('\n') + '\n'
  fs.writeFileSync(path.join(RESULTS, `${OUT}.md`), md)
  fs.writeFileSync(path.join(RESULTS, `${OUT}.csv`), csv)
  console.log(md)
}

try {
  main()
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(1)
}
