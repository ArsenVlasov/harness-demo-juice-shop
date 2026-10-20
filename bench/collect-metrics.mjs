#!/usr/bin/env node
// Collects the A/B numbers into bench/results/<out>.md (the table for the README) and <out>.csv (plan section 7).
//
//   node bench/collect-metrics.mjs                       run 1, results mutants, flaky, judge
//   node bench/collect-metrics.mjs --mutants mutants-try --flaky flaky-try --judge judge-try --out summary-try
//
// Time comes from the session transcript of each generation run, not from duration_ms: with background
// subagents, the JSON output keeps only the last result event. Gaps of more than 10 minutes between two
// transcript events are pauses and do not count as work time.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { RESULTS, SUITES, must, opt } from './lib.mjs'

const RUN = opt('--run', '1')
const MUTANTS = opt('--mutants', 'mutants')
const FLAKY = opt('--flaky', 'flaky')
const JUDGE = opt('--judge', 'judge')
const OUT = opt('--out', 'summary')
const GAP_MS = 10 * 60 * 1000
const TEST_CASES = 8

const readJson = f => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null)
const round = (n, d = 2) => (n == null ? null : +n.toFixed(d))

// Work time and tool calls from the transcript ~/.claude/projects/<suite path>/<session>.jsonl.
function transcript (suiteDir, sessionId) {
  const file = path.join(os.homedir(), '.claude', 'projects', suiteDir.replace(/[/.]/g, '-'), `${sessionId}.jsonl`)
  if (!fs.existsSync(file)) return null
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
    if (d <= GAP_MS) workMs += d
  }
  return { workMs, toolCalls }
}

function generation (s) {
  const parts = [`gen-${s}-${RUN}.json`, `gen-${s}-${RUN}-followup.json`].map(f => readJson(path.join(RESULTS, f))).filter(Boolean)
  if (parts.length === 0) return null
  const r = { cost: 0, workMs: 0, toolCalls: 0, followups: parts.length - 1, subagents: 0 }
  for (const p of parts) {
    r.cost += p.total_cost_usd
    r.subagents += p.subagent_stats?.spawned ?? 0
    const t = transcript(SUITES[s], p.session_id)
    if (t) { r.workMs += t.workMs; r.toolCalls += t.toolCalls }
  }
  return r
}

function volume (s) {
  const files = must('git', ['-C', SUITES[s], 'diff', '--name-only', 'gen-1~1', 'gen-1']).split('\n').filter(f => f && !f.startsWith('.playwright-mcp/'))
  const stat = must('git', ['-C', SUITES[s], 'diff', '--numstat', 'gen-1~1', 'gen-1', '--', ...files]).split('\n')
  const lines = stat.reduce((n, l) => n + (Number(l.split('\t')[0]) || 0), 0)
  const clean = readJson(path.join(RESULTS, `clean-${s}-${RUN}.json`))
  return { files: files.length, lines, tests: clean?.stats ? clean.stats.expected + clean.stats.unexpected + clean.stats.flaky : null }
}

function main () {
  const mutants = readJson(path.join(RESULTS, `${MUTANTS}.json`))
  const flaky = readJson(path.join(RESULTS, `${FLAKY}.json`))
  const mapping = readJson(path.join(RESULTS, JUDGE, 'mapping.json'))
  const judge = s => (mapping ? readJson(path.join(RESULTS, JUDGE, `${Object.keys(mapping).find(k => mapping[k] === s)}.json`)) : null)

  const rows = []
  const add = (metric, fn, source) => rows.push({ metric, A: fn('A'), B: fn('B'), source })
  const gen = { A: generation('A'), B: generation('B') }
  const vol = { A: volume('A'), B: volume('B') }

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
  add('Generation cost, USD', s => round(gen[s]?.cost), `gen-*-${RUN}.json`)
  add('Cost for each test case, USD', s => round(gen[s]?.cost / TEST_CASES), `gen-*-${RUN}.json`)
  add('Work time, min', s => round(gen[s]?.workMs / 60000, 1), 'transcript')
  add('Work time for each test case, min', s => round(gen[s]?.workMs / 60000 / TEST_CASES, 1), 'transcript')
  add('Tool calls of the main agent', s => gen[s]?.toolCalls, 'transcript')
  add('Subagents', s => gen[s]?.subagents, `gen-*-${RUN}.json`)
  add('Follow-up messages', s => gen[s]?.followups, `gen-*-${RUN}.json`)
  add('Tests', s => vol[s].tests, `clean-*-${RUN}.json`)
  add('Files written', s => vol[s].files, 'git diff gen-1~1 gen-1')
  add('Lines written', s => vol[s].lines, 'git diff gen-1~1 gen-1')

  const md = [
    `# Summary: suite A and suite B, run ${RUN}`,
    '',
    `Source: \`bench/collect-metrics.mjs\`, ${new Date().toISOString()}. Inputs: \`${MUTANTS}\`, \`${FLAKY}\`, \`${JUDGE}\`.`,
    '',
    '| Metric | A (no harness) | B (harness) | Source |',
    '|---|---|---|---|',
    ...rows.map(r => `| ${r.metric} | ${r.A ?? 'n/a'} | ${r.B ?? 'n/a'} | \`${r.source}\` |`),
    '',
    'Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.',
    ''
  ].join('\n')
  const csv = ['metric,A,B,source', ...rows.map(r => [r.metric, r.A, r.B, r.source].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n') + '\n'
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
