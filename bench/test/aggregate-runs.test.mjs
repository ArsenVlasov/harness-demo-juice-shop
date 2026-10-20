// Tests of bench/aggregate-runs.mjs with summary files in a temp folder. No app, no suite, no model.
//
//   node --test bench/test/aggregate-runs.test.mjs
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'aggregate-runs.mjs')
const CONDITIONS = {
  conditions: {
    precise: { dir: 'precise', tcSet: 'precise', model: 'claude-opus-5-5' },
    vague: { dir: 'vague', tcSet: 'vague', model: 'claude-opus-5-5' },
    haiku: { dir: 'haiku', tcSet: 'precise', model: 'claude-haiku-5-5' }
  },
  tcSets: { precise: { labDir: 'test-cases', labTag: 'test-cases-v1' }, vague: { labDir: 'test-cases-vague', labTag: 'test-cases-v2-vague' } }
}
let tmp

// A summary CSV in the format of bench/collect-metrics.mjs. Each argument is one value for A and B.
const summary = ({ missed, ids, score, judge, cost, time }) => [
  'metric,A,B,source',
  `"Realistic bugs missed","${missed[0]} of 11","${missed[1]} of 11","mutants.json"`,
  `"Bugs missed (IDs)","${ids[0]}","${ids[1]}","mutants.json"`,
  `"Mutation score","${score[0]} of 14 (0.5)","${score[1]} of 14 (1)","mutants.json"`,
  `"Judge: steps covered / partial / missing","${judge[0]}","${judge[1]}","judge/"`,
  '"Judge model","claude-opus-5-5","claude-opus-5-5","judge/"',
  `"Generation cost, USD","${cost[0]}","${cost[1]}","gen-*-1.json"`,
  `"Work time, min","${time[0]}","${time[1]}","transcript"`
].join('\n') + '\n'

const aggregate = (...args) => spawnSync(process.execPath, [SCRIPT, '--dir', tmp, ...args],
  { encoding: 'utf8', env: { ...process.env, BENCH_CONDITIONS: path.join(tmp, 'conditions.json') } })

// The rows of aggregate-<cond>.csv as { "<metric>|<suite>": { mean, min, max, n, values } }.
function readAggregate (cond) {
  const lines = fs.readFileSync(path.join(tmp, `aggregate-${cond}.csv`), 'utf8').trim().split('\n')
  assert.equal(lines[0], 'metric,suite,mean,min,max,n,values')
  const rows = {}
  for (const line of lines.slice(1)) {
    const [metric, suite, mean, min, max, n, values] = [...line.matchAll(/"((?:[^"]|"")*)"/g)].map(m => m[1].replace(/""/g, '"'))
    rows[`${metric}|${suite}`] = { mean, min, max, n, values }
  }
  return rows
}

before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aggregate-test-'))
  fs.writeFileSync(path.join(tmp, 'conditions.json'), JSON.stringify(CONDITIONS))
  // precise run 1 has the legacy name summary.csv.
  fs.writeFileSync(path.join(tmp, 'summary.csv'), summary({ missed: [0, 0], ids: ['none', 'none'], score: [14, 14], judge: ['47 / 2 / 0 of 49', '49 / 0 / 0 of 49'], cost: [2.69, 8.12], time: [12.4, 23.3] }))
  fs.writeFileSync(path.join(tmp, 'summary-precise-2.csv'), summary({ missed: [1, 0], ids: ['M03', 'none'], score: [13, 14], judge: ['46 / 3 / 0 of 49', '49 / 0 / 0 of 49'], cost: [3.01, 7.5], time: ['', 20] }))
  fs.writeFileSync(path.join(tmp, 'summary-precise-3.csv'), summary({ missed: [2, 1], ids: ['M03 M07', 'M07'], score: [12, 13], judge: ['45 / 3 / 1 of 49', '48 / 1 / 0 of 49'], cost: [2.6, 9.1], time: ['n/a', 25] }))
  // vague run 1 has the new name summary-vague-1.csv, not summary.csv.
  fs.writeFileSync(path.join(tmp, 'summary-vague-1.csv'), summary({ missed: [4, 2], ids: ['x', 'y'], score: [9, 11], judge: ['40 / 9 / 0 of 49', '44 / 5 / 0 of 49'], cost: [2, 6], time: [10, 20] }))
  fs.writeFileSync(path.join(tmp, 'summary-vague-2.csv'), summary({ missed: [6, 2], ids: ['x', 'y'], score: [7, 11], judge: ['42 / 7 / 0 of 49', '44 / 4 / 1 of 49'], cost: [4, 8], time: [30, 40] }))
})

after(() => fs.rmSync(tmp, { recursive: true, force: true }))

test('precise runs 1 to 3: mean, min, max and n for each suite', () => {
  const r = aggregate('--cond', 'precise', '--runs', '1,2,3')
  assert.equal(r.status, 0, r.stderr)
  const rows = readAggregate('precise')
  assert.deepEqual(rows['Realistic bugs missed|A'], { mean: '1', min: '0', max: '2', n: '3', values: '0 of 11; 1 of 11; 2 of 11' })
  assert.deepEqual(rows['Realistic bugs missed|B'], { mean: '0.33', min: '0', max: '1', n: '3', values: '0 of 11; 0 of 11; 1 of 11' })
  assert.equal(rows['Mutation score|A'].mean, '13')
  assert.equal(rows['Generation cost, USD|B'].mean, '8.24')
  assert.equal(rows['Generation cost, USD|B'].max, '9.1')
})

test('the judge metric gives three metrics: covered, partial, missing', () => {
  const rows = readAggregate('precise')
  assert.deepEqual(rows['Judge: steps covered|A'], { mean: '46', min: '45', max: '47', n: '3', values: '47; 46; 45' })
  assert.deepEqual(rows['Judge: steps partial|A'], { mean: '2.67', min: '2', max: '3', n: '3', values: '2; 3; 3' })
  assert.deepEqual(rows['Judge: steps missing|A'], { mean: '0.33', min: '0', max: '1', n: '3', values: '0 of 49; 0 of 49; 1 of 49' })
  assert.equal(rows['Judge: steps partial|B'].mean, '0.33')
})

test('empty and n/a values do not count in n', () => {
  const rows = readAggregate('precise')
  assert.deepEqual(rows['Work time, min|A'], { mean: '12.4', min: '12.4', max: '12.4', n: '1', values: '12.4; n/a; n/a' })
  assert.equal(rows['Work time, min|B'].n, '3')
})

test('text metrics are not in the table and the md lists them', () => {
  const rows = readAggregate('precise')
  assert.equal(Object.keys(rows).some(k => k.startsWith('Bugs missed (IDs)') || k.startsWith('Judge model')), false)
  const md = fs.readFileSync(path.join(tmp, 'aggregate-precise.md'), 'utf8')
  assert.match(md, /Text metrics, not in the table: `Bugs missed \(IDs\)`, `Judge model`\./)
  assert.match(md, /Inputs: `summary\.csv`, `summary-precise-2\.csv`, `summary-precise-3\.csv`/)
  assert.match(md, /\| Realistic bugs missed \| A \| 1 \| 0 \| 2 \| 3 \| 0 of 11; 1 of 11; 2 of 11 \|/)
})

test('vague run 1 reads summary-vague-1.csv, not the legacy summary.csv', () => {
  const r = aggregate('--cond', 'vague', '--runs', '1,2')
  assert.equal(r.status, 0, r.stderr)
  const rows = readAggregate('vague')
  assert.deepEqual(rows['Realistic bugs missed|A'], { mean: '5', min: '4', max: '6', n: '2', values: '4 of 11; 6 of 11' })
  assert.match(fs.readFileSync(path.join(tmp, 'aggregate-vague.md'), 'utf8'), /Inputs: `summary-vague-1\.csv`, `summary-vague-2\.csv`/)
})

test('a missing summary file stops the script with exit 1', () => {
  const r = aggregate('--cond', 'vague', '--runs', '1,2,3')
  assert.equal(r.status, 1)
  assert.match(r.stderr, /no .*summary-vague-3\.csv/)
})

test('a condition that is not in conditions.json stops the script', () => {
  const r = aggregate('--cond', 'nosuch', '--runs', '1')
  assert.equal(r.status, 1)
  assert.match(r.stderr, /--cond nosuch: not in/)
})

test('bad run numbers stop the script', () => {
  for (const runs of ['1,1', '0,2', 'a']) {
    const r = aggregate('--cond', 'precise', '--runs', runs)
    assert.equal(r.status, 1, runs)
    assert.match(r.stderr, /--runs/)
  }
})

// Two haiku summaries for one test: run 1 from summary(), run 2 from summary() with one changed line.
function haikuRuns (change) {
  const base = { missed: [1, 0], ids: ['M03', 'none'], score: [13, 14], judge: ['46 / 3 / 0 of 49', '49 / 0 / 0 of 49'], cost: [3, 7], time: [10, 20] }
  fs.writeFileSync(path.join(tmp, 'summary-haiku-1.csv'), summary(base))
  fs.writeFileSync(path.join(tmp, 'summary-haiku-2.csv'), change(summary(base)))
  return aggregate('--cond', 'haiku', '--runs', '1,2')
}

test('a NaN value stops the script and the error gives the file, the metric and the suite', () => {
  const r = haikuRuns(csv => csv.replace('"Work time, min","10","20"', '"Work time, min","10","NaN"'))
  assert.equal(r.status, 1)
  assert.match(r.stderr, /summary-haiku-2\.csv, metric "Work time, min", suite B: "NaN" is not a number/)
})

test('a metric with numbers and text stops the script', () => {
  const r = haikuRuns(csv => csv.replace('"Generation cost, USD","3","7"', '"Generation cost, USD","3","unknown"'))
  assert.equal(r.status, 1)
  assert.match(r.stderr, /summary-haiku-2\.csv, metric "Generation cost, USD", suite B: "unknown" is text/)
})

test('files with different suite labels stop the script', () => {
  const r = haikuRuns(csv => csv.replace('metric,A,B,source', 'metric,before,after,source'))
  assert.equal(r.status, 1)
  assert.match(r.stderr, /summary-haiku-2\.csv has the suites before,after, summary-haiku-1\.csv has A,B/)
})

test('a metric with only n/a values stays in the table with n 0', () => {
  const r = haikuRuns(csv => csv)
  assert.equal(r.status, 0, r.stderr)
  fs.writeFileSync(path.join(tmp, 'summary-haiku-2.csv'), fs.readFileSync(path.join(tmp, 'summary-haiku-2.csv'), 'utf8') + '"Tests","",""\n')
  fs.writeFileSync(path.join(tmp, 'summary-haiku-1.csv'), fs.readFileSync(path.join(tmp, 'summary-haiku-1.csv'), 'utf8') + '"Tests","n/a","n/a"\n')
  const r2 = aggregate('--cond', 'haiku', '--runs', '1,2')
  assert.equal(r2.status, 0, r2.stderr)
  assert.deepEqual(readAggregate('haiku')['Tests|A'], { mean: '', min: '', max: '', n: '0', values: 'n/a; n/a' })
  assert.match(fs.readFileSync(path.join(tmp, 'aggregate-haiku.md'), 'utf8'), /Text metrics, not in the table: `Bugs missed \(IDs\)`, `Judge model`\./)
})
