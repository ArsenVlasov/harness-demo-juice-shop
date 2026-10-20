#!/usr/bin/env node
// Runs suites A and B against the clean build and against each sealed patch (plan sections 6 and 7).
//
//   node bench/run-mutants.mjs                    all patches, both suites, recheck 3
//   node bench/run-mutants.mjs --only 01,05       only these patch numbers (for a test of this script)
//   node bench/run-mutants.mjs --out mutants-try  write to bench/results/mutants-try/ and mutants-try.{json,md}
//
// A patch counts as caught by a suite when a test of that suite:
//   1. passes on the clean build,
//   2. fails on the build with the patch,
//   3. passes the recheck runs on the clean build at the end (default 3).
// The app restarts before each suite run, so each run starts with a clean database.
import fs from 'node:fs'
import path from 'node:path'
import { APP_DIR, RESULTS, SEALED, SUITES, appTreeIsClean, log, must, opt, passedAll, runSuite, startApp, stopApp } from './lib.mjs'

const ONLY = opt('--only')?.split(',').map(s => s.padStart(2, '0'))
const OUT = opt('--out', 'mutants')
const RECHECK = Number(opt('--recheck', 3))
const RAW = path.join(RESULTS, OUT)

// Kinds and expected test case steps come from the summary table of sealed/mutants.md.
function readMutants () {
  const table = fs.readFileSync(path.join(SEALED, 'mutants.md'), 'utf8')
  const rows = [...table.matchAll(/^\| (M\d+) \| `(\d+-[\w-]+\.patch)` \| `([^`]+)` \| (bug|operator) \| ([^|]+) \|$/gm)]
  return rows.map(([, id, patch, file, kind, step]) => ({ id, patch, file, kind, expected: step.trim() }))
}

// Builds the app once, then runs each suite on a fresh start of the app.
function runBothSuites (label, extraArgs) {
  const reports = {}
  Object.keys(SUITES).forEach((suiteId, i) => {
    stopApp()
    startApp(i === 0)
    reports[suiteId] = runSuite(suiteId, path.join(RAW, `${label}-${suiteId}.json`), extraArgs)
  })
  stopApp()
  return reports
}

function main () {
  if (!appTreeIsClean()) throw new Error('juice-shop/ has changes. Revert them before this run.')
  const mutants = readMutants().filter(m => !ONLY || ONLY.includes(m.patch.slice(0, 2)))
  if (mutants.length === 0) throw new Error('no patch selected')
  log(`patches: ${mutants.map(m => m.id).join(' ')}. Suites: ${Object.keys(SUITES).join(' ')}. Raw reports: ${RAW}`)

  log('clean build')
  const clean = runBothSuites('clean')

  const results = []
  for (const m of mutants) {
    const patchFile = path.join(SEALED, m.patch)
    log(`${m.id} ${m.patch}`)
    must('git', ['-C', APP_DIR, 'apply', '--check', patchFile])
    must('git', ['-C', APP_DIR, 'apply', patchFile])
    let reports
    try {
      reports = runBothSuites(m.patch.slice(0, 2))
    } finally {
      try { stopApp() } catch (e) { log(`warning: ${e.message}`) }
      must('git', ['-C', APP_DIR, 'apply', '-R', patchFile])
      if (!appTreeIsClean()) throw new Error(`juice-shop/ is not clean after the revert of ${m.patch}`)
    }
    results.push({ ...m, reports })
  }

  log(`recheck: ${RECHECK} more runs on the clean build`)
  const recheck = RECHECK > 0 ? runBothSuites('recheck', [`--repeat-each=${RECHECK}`]) : null
  must('npm', ['run', '--silent', 'build:server'], { cwd: APP_DIR })
  if (!appTreeIsClean()) throw new Error('juice-shop/ is not clean at the end')

  const out = { generatedAt: new Date().toISOString(), recheckRuns: RECHECK, suites: {}, mutants: [], summary: {} }
  for (const s of Object.keys(SUITES)) {
    const tests = clean[s].tests
    out.suites[s] = {
      tests: Object.keys(tests).length,
      cleanGreen: Object.keys(tests).filter(k => passedAll(tests[k])),
      recheckGreen: recheck ? Object.keys(recheck[s].tests).filter(k => passedAll(recheck[s].tests[k])) : null
    }
  }
  for (const m of results) {
    const row = { id: m.id, patch: m.patch, file: m.file, kind: m.kind, expected: m.expected, suites: {} }
    for (const s of Object.keys(SUITES)) {
      const failed = Object.entries(m.reports[s].tests).filter(([, t]) => !passedAll(t)).map(([k, t]) => ({ test: k, tc: t.tc, statuses: t.statuses }))
      const greenOnClean = failed.filter(f => out.suites[s].cleanGreen.includes(f.test))
      const catching = greenOnClean.filter(f => !recheck || out.suites[s].recheckGreen.includes(f.test))
      row.suites[s] = {
        caught: catching.length > 0,
        catchingTests: catching.map(f => f.test),
        failedTests: failed.map(f => `${f.test} [${f.statuses.join(',')}]`),
        droppedByRecheck: greenOnClean.filter(f => !catching.includes(f)).map(f => f.test),
        reportErrors: m.reports[s].errors
      }
    }
    out.mutants.push(row)
  }
  for (const s of Object.keys(SUITES)) {
    const bugs = out.mutants.filter(m => m.kind === 'bug')
    const caught = out.mutants.filter(m => m.suites[s].caught)
    out.summary[s] = {
      bugsCaught: bugs.filter(m => m.suites[s].caught).length,
      bugsTotal: bugs.length,
      bugsMissed: bugs.filter(m => !m.suites[s].caught).map(m => m.id),
      allCaught: caught.length,
      allTotal: out.mutants.length,
      allMissed: out.mutants.filter(m => !m.suites[s].caught).map(m => m.id),
      mutationScore: +(caught.length / out.mutants.length).toFixed(3)
    }
  }

  const md = [
    `# Patches and suites (${OUT})`,
    '',
    `Source: \`bench/run-mutants.mjs\`, ${out.generatedAt}. Recheck runs on the clean build: ${RECHECK}.`,
    '',
    '| ID | Kind | Expected catch | A | B |',
    '|---|---|---|---|---|',
    ...out.mutants.map(m => `| ${m.id} | ${m.kind} | ${m.expected} | ${m.suites.A.caught ? 'caught' : 'missed'} | ${m.suites.B.caught ? 'caught' : 'missed'} |`),
    '',
    '| Suite | Bugs caught | Bugs missed | Mutation score |',
    '|---|---|---|---|',
    ...Object.entries(out.summary).map(([s, v]) => `| ${s} | ${v.bugsCaught} of ${v.bugsTotal} | ${v.bugsMissed.join(', ') || 'none'} | ${v.allCaught} of ${v.allTotal} (${v.mutationScore}) |`),
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
