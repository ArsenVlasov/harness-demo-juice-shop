#!/usr/bin/env node
// Runs each selected suite many times on the clean build and finds flaky and broken tests (plan sections 6 and 7).
//
//   node bench/run-flaky.mjs                          precise run 1: suites A and B, 20 runs of each test, in chunks of 5
//   node bench/run-flaky.mjs --cond vague --run 2     suites A and B of run 2 of condition vague
//   node bench/run-flaky.mjs --suite before=<dir> --suite after=<dir> --out flaky-e4
//   node bench/run-flaky.mjs --repeats 2 --chunk 1 --out flaky-try
//   node bench/run-flaky.mjs --list-suites            print the selected suites and exit
//
// Default --out: flaky-<cond>-<run>, or flaky for precise run 1. With --suite, --out is necessary.
// The suite selector is in bench/lib.mjs.
//
// Why chunks: the app gives each product a random stock of 30 to 99 at each start. TC-07 and TC-08 buy
// 3 items of one product in each run, so 20 runs on one app start can empty the stock. The app restarts
// before each chunk. A chunk is one `--repeat-each=<chunk> --retries=0` run with the default workers.
//
// stable: passed in all runs. flaky: passed in some runs and failed in other runs. broken: failed in all runs.
import fs from 'node:fs'
import path from 'node:path'
import { RESULTS, appTreeIsClean, log, opt, outOption, runSuiteAt, selectSuites, startApp, stopApp } from './lib.mjs'

const REPEATS = Number(opt('--repeats', 20))
const CHUNK = Number(opt('--chunk', 5))

function main () {
  const SUITES = selectSuites()
  const OUT = outOption('flaky')
  const RAW = path.join(RESULTS, OUT)
  if (REPEATS % CHUNK !== 0) throw new Error('--repeats must be a multiple of --chunk')
  if (!appTreeIsClean()) throw new Error('juice-shop/ has changes. Revert them before this run.')
  const chunks = REPEATS / CHUNK
  log(`${REPEATS} runs of each test, ${chunks} chunks of ${CHUNK}, suites ${Object.entries(SUITES).map(([s, d]) => `${s}=${d}`).join(' ')}`)

  const out = { generatedAt: new Date().toISOString(), repeats: REPEATS, chunk: CHUNK, suites: {} }
  let built = false
  for (const [s, dir] of Object.entries(SUITES)) {
    const tests = {}
    for (let i = 1; i <= chunks; i++) {
      stopApp()
      startApp(!built)
      built = true
      const rep = runSuiteAt(dir, path.join(RAW, `${s}-${i}.json`), [`--repeat-each=${CHUNK}`])
      for (const [k, t] of Object.entries(rep.tests)) {
        tests[k] ??= { tc: t.tc, passed: 0, failed: 0, other: {} }
        for (const st of t.statuses) {
          if (st === 'passed') tests[k].passed++
          else { tests[k].failed++; tests[k].other[st] = (tests[k].other[st] ?? 0) + 1 }
        }
      }
    }
    stopApp()
    for (const t of Object.values(tests)) {
      t.verdict = t.failed === 0 ? 'stable' : t.passed === 0 ? 'broken' : 'flaky'
    }
    const list = Object.values(tests)
    out.suites[s] = {
      tests,
      summary: {
        tests: list.length,
        runs: list.reduce((n, t) => n + t.passed + t.failed, 0),
        stable: list.filter(t => t.verdict === 'stable').length,
        flaky: list.filter(t => t.verdict === 'flaky').length,
        broken: list.filter(t => t.verdict === 'broken').length
      }
    }
  }

  const md = [
    `# Flaky tests (${OUT})`,
    '',
    `Source: \`bench/run-flaky.mjs\`, ${out.generatedAt}. ${REPEATS} runs of each test, app restart every ${CHUNK} runs, \`--retries=0\`.`,
    '',
    '| Suite | Tests | Test runs | Stable | Flaky | Broken |',
    '|---|---|---|---|---|---|',
    ...Object.entries(out.suites).map(([s, v]) => `| ${s} | ${v.summary.tests} | ${v.summary.runs} | ${v.summary.stable} | ${v.summary.flaky} | ${v.summary.broken} |`),
    '',
    '| Suite | TC | Test | Passed | Failed | Verdict |',
    '|---|---|---|---|---|---|',
    ...Object.entries(out.suites).flatMap(([s, v]) => Object.entries(v.tests).map(([k, t]) => `| ${s} | ${t.tc} | \`${k}\` | ${t.passed} | ${t.failed} | ${t.verdict} |`)),
    ''
  ].join('\n')
  fs.writeFileSync(path.join(RESULTS, `${OUT}.json`), JSON.stringify(out, null, 2) + '\n')
  fs.writeFileSync(path.join(RESULTS, `${OUT}.md`), md)
  console.log('\n' + md)
}

try {
  main()
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(1)
}
