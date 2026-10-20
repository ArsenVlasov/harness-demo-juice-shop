#!/usr/bin/env node
// Aggregates the summaries of the runs of one condition (plan v2, item 1.4): for each numeric metric and each
// suite, the mean, the min, the max and n.
//
//   node bench/aggregate-runs.mjs --cond precise --runs 1,2,3   reads summary.csv, summary-precise-2.csv, summary-precise-3.csv
//   node bench/aggregate-runs.mjs --cond vague                  the default --runs is 1,2,3
//   node bench/aggregate-runs.mjs --cond vague --dir <folder>   reads and writes in <folder>, not in bench/results/ (for a test)
//
// Input: summary-<cond>-<n>.csv of bench/collect-metrics.mjs (summary.csv for precise run 1).
// Output: aggregate-<cond>.md and aggregate-<cond>.csv.
// Rules: a value "3 of 11" counts as 3. The metric "Judge: steps covered / partial / missing" with the value
// "47 / 2 / 0 of 49" gives three metrics: covered 47, partial 2, missing 0. An empty value and n/a do not count,
// so n can be less than the number of runs. A metric with only text values is a text metric: the script leaves it
// out of the table and lists it. The script stops when a metric has numbers and text, when a value is NaN or
// Infinity, or when the files have different suite labels. The error gives the file, the metric and the suite.
import fs from 'node:fs'
import path from 'node:path'
import { RESULTS, condRun, opt, outName } from './lib.mjs'

const NUMBER = /^(-?\d+(?:\.\d+)?)(?: of \d+(?: \([^)]*\))?)?$/
const isEmpty = v => v == null || v.trim() === '' || v.trim() === 'n/a'
const isNumber = v => NUMBER.test(v.trim())
const round = n => +n.toFixed(2)

// A CSV text with quoted cells ("" is a quote in a cell) as a list of rows.
function parseCsv (text) {
  const rows = []; let row = []; let cell = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted && c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
    else if (c === '"') quoted = !quoted
    else if (quoted) cell += c
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

// The rows of one summary file: { file, labels, rows: [{ metric, values: { label: text } }] }.
function readSummary (dir, cond, n) {
  const file = path.join(dir, `${outName('summary', cond, n)}.csv`)
  if (!fs.existsSync(file)) throw new Error(`no ${file}. Run bench/collect-metrics.mjs --cond ${cond} --run ${n} first.`)
  const [head, ...body] = parseCsv(fs.readFileSync(file, 'utf8'))
  if (head?.[0] !== 'metric' || head.at(-1) !== 'source' || head.length < 3) throw new Error(`${file}: the header is not metric,<suites>,source`)
  const labels = head.slice(1, -1)
  return { file, labels, rows: body.map(r => ({ metric: r[0], values: Object.fromEntries(labels.map((s, i) => [s, r[i + 1]])) })) }
}

// The [metric, value] pairs of one cell. "a b / c / d" with "1 / 2 / 3 of 9" gives "a b", "a c", "a d".
function cells (metric, value) {
  const names = metric.split(' / ')
  if (names.length > 1) {
    const values = isEmpty(value) ? names.map(() => '') : value.split(' / ')
    const stem = names[0].slice(0, names[0].lastIndexOf(' ') + 1)
    if (values.length === names.length) return names.map((name, i) => [i === 0 ? name : stem + name, values[i]])
  }
  return [[metric, value]]
}

// { metric: { label: [text of run 1, text of run 2, ...] } }, with the metrics in the order of the files.
function collect (summaries) {
  const table = {}
  summaries.forEach((sum, i) => {
    for (const row of sum.rows) {
      for (const s of sum.labels) {
        for (const [metric, value] of cells(row.metric, row.values[s])) {
          table[metric] ??= {}
          table[metric][s] ??= Array(summaries.length).fill('')
          table[metric][s][i] = value ?? ''
        }
      }
    }
  })
  return table
}

function stats (values) {
  const nums = values.filter(v => !isEmpty(v)).map(v => Number(v.trim().match(NUMBER)[1]))
  if (nums.length === 0) return { mean: null, min: null, max: null, n: 0 }
  return { mean: round(nums.reduce((a, b) => a + b, 0) / nums.length), min: Math.min(...nums), max: Math.max(...nums), n: nums.length }
}

// Stops at a value NaN or Infinity, and at a metric with numbers and text. Both show an error in an input file.
function checkValues (table, summaries) {
  for (const [metric, bySuite] of Object.entries(table)) {
    const cells = Object.entries(bySuite).flatMap(([s, values]) => values.map((v, i) => ({ s, v: v.trim(), file: path.basename(summaries[i].file) })))
      .filter(c => !isEmpty(c.v))
    const where = c => `${c.file}, metric "${metric}", suite ${c.s}: "${c.v}"`
    const bad = cells.find(c => /^-?(NaN|Infinity)$/.test(c.v))
    if (bad) throw new Error(`${where(bad)} is not a number. Make the summary again with bench/collect-metrics.mjs.`)
    const text = cells.find(c => !isNumber(c.v))
    if (text && cells.some(c => isNumber(c.v))) throw new Error(`${where(text)} is text, but the metric has numbers in other cells`)
  }
}

function main () {
  const { cond } = condRun()
  const dir = path.resolve(opt('--dir', RESULTS))
  const runs = opt('--runs', '1,2,3').split(',').map(s => s.trim())
  if (runs.some(n => !/^[1-9]\d*$/.test(n)) || new Set(runs).size !== runs.length) throw new Error(`--runs ${runs}: give different run numbers, for example 1,2,3`)
  const summaries = runs.map(n => readSummary(dir, cond, n))
  const other = summaries.find(x => x.labels.join() !== summaries[0].labels.join())
  if (other) throw new Error(`${path.basename(other.file)} has the suites ${other.labels}, ${path.basename(summaries[0].file)} has ${summaries[0].labels}`)
  const table = collect(summaries)
  checkValues(table, summaries)
  const isText = m => Object.values(table[m]).flat().some(v => !isEmpty(v) && !isNumber(v))
  const textMetrics = Object.keys(table).filter(isText)
  const rows = Object.keys(table).filter(m => !isText(m))
    .flatMap(m => Object.entries(table[m]).map(([s, values]) => ({ metric: m, suite: s, ...stats(values), values })))

  const show = v => (v == null ? 'n/a' : v)
  const shown = values => values.map(v => (isEmpty(v) ? 'n/a' : v.trim())).join('; ')
  const md = [
    `# Aggregate: condition ${cond}, runs ${runs.join(', ')}`,
    '',
    `Source: \`bench/aggregate-runs.mjs\`, ${new Date().toISOString()}. Inputs: ${summaries.map(x => `\`${path.basename(x.file)}\``).join(', ')}.`,
    '',
    'A value "X of N" counts as X. An empty value and n/a do not count, so n can be less than the number of runs.',
    '',
    `| Metric | Suite | Mean | Min | Max | n | Values (runs ${runs.join(', ')}) |`,
    '|---|---|---|---|---|---|---|',
    ...rows.map(r => `| ${r.metric} | ${r.suite} | ${show(r.mean)} | ${show(r.min)} | ${show(r.max)} | ${r.n} | ${shown(r.values)} |`),
    '',
    `Text metrics, not in the table: ${textMetrics.map(m => `\`${m}\``).join(', ') || 'none'}.`,
    ''
  ].join('\n')
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = ['metric,suite,mean,min,max,n,values',
    ...rows.map(r => [r.metric, r.suite, r.mean, r.min, r.max, r.n, shown(r.values)].map(cell).join(','))].join('\n') + '\n'
  fs.writeFileSync(path.join(dir, `aggregate-${cond}.md`), md)
  fs.writeFileSync(path.join(dir, `aggregate-${cond}.csv`), csv)
  console.log(md)
}

try {
  main()
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(1)
}
