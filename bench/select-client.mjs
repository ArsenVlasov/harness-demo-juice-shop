#!/usr/bin/env node
// Applies the frozen rule "The client suite for E4" of bench/hypotheses-v2.md (tag hypotheses-v2).
//
//   node bench/select-client.mjs            writes bench/results/client-selection.md and .json
//
// Candidates: each suite of the conditions vague and haiku with all measurements (run-mutants and the judge).
// The vague runs are pairs 1 and 2, and the pair A-3 with B-4 (out name 3), because vague B-3 stopped
// (LOG.md, 20.10, 23:20). Eligible: each test passes in the clean run (clean-<c>-<S>-<n>.json), on the clean build of
// run-mutants and in its recheck runs. If no candidate is eligible, each candidate is eligible and key 0 applies.
// Plan rule: when each eligible candidate misses 0 bugs, the client suite is A-vague run 1, if it is eligible.
// Else the order of the keys: 0 (only without eligible candidates) fewer tests that fail on the clean build;
// 1 more missed bugs; 2 lower mutation score; 3 more judge steps partial plus missing; 4 more judge steps missing;
// 5 A before B; 6 vague before haiku; 7 the lower run number.
import fs from 'node:fs'
import path from 'node:path'
import { RESULTS } from './lib.mjs'

// [condition, label in the measurement files, out number of the measurements, generation run number]
const CANDIDATES = [
  ['vague', 'A', 1, 1], ['vague', 'B', 1, 1], ['vague', 'A', 2, 2], ['vague', 'B', 2, 2], ['vague', 'A', 3, 3], ['vague', 'B', 3, 4],
  ['haiku', 'A', 1, 1], ['haiku', 'B', 1, 1], ['haiku', 'A', 2, 2], ['haiku', 'B', 2, 2], ['haiku', 'A', 3, 3], ['haiku', 'B', 3, 3]
]
const read = f => JSON.parse(fs.readFileSync(path.join(RESULTS, f), 'utf8'))

function measure ([cond, s, out, run]) {
  const m = read(`mutants-${cond}-${out}.json`)
  const sum = m.summary[s]
  const suite = m.suites[s]
  const map = read(`judge-${cond}-${out}/mapping.json`)
  const label = Object.keys(map).find(k => map[k] === s)
  const j = read(`judge-${cond}-${out}/${label}.json`)
  const clean = read(`clean-${cond}-${s}-${run}.json`).stats
  const cleanRunOk = clean.unexpected === 0 && clean.flaky === 0 && clean.expected > 0
  const buildOk = suite.cleanGreen.length === suite.tests
  const recheckOk = Array.isArray(suite.recheckGreen) && suite.recheckGreen.length === suite.tests
  return {
    name: `${cond} ${s}-${run}`, cond, suite: s, run,
    tests: suite.tests, cleanRun: `${clean.expected} passed, ${clean.unexpected} failed`, cleanRunOk,
    cleanBuild: `${suite.cleanGreen.length} of ${suite.tests}`, recheck: recheckOk ? `${suite.recheckGreen.length} of ${suite.tests}` : `${suite.recheckGreen?.length ?? 0} of ${suite.tests}`,
    failOnClean: (suite.tests - suite.cleanGreen.length) + clean.unexpected,
    eligible: cleanRunOk && buildOk && recheckOk,
    missed: sum.bugsTotal - sum.bugsCaught, missedIds: sum.bugsMissed, score: sum.allCaught,
    partialMissing: j.counts.partial + j.counts.missing, missing: j.counts.missing,
    sources: [`mutants-${cond}-${out}.json`, `judge-${cond}-${out}/${label}.json`, `clean-${cond}-${s}-${run}.json`]
  }
}

function main () {
  const rows = CANDIDATES.map(measure)
  let pool = rows.filter(r => r.eligible)
  const noneEligible = pool.length === 0
  if (noneEligible) pool = rows
  let client, reason, keysUsed = false
  const plan = rows.find(r => r.cond === 'vague' && r.suite === 'A' && r.run === 1)
  if (!noneEligible && pool.every(r => r.missed === 0) && plan.eligible) {
    client = plan
    reason = 'step 3: each eligible candidate misses 0 bugs, and A-vague run 1 is eligible'
  } else {
    const keys = [
      ...(noneEligible ? [[r => r.failOnClean, 'asc']] : []),
      [r => r.missed, 'desc'], [r => r.score, 'asc'], [r => r.partialMissing, 'desc'], [r => r.missing, 'desc'],
      [r => (r.suite === 'A' ? 0 : 1), 'asc'], [r => (r.cond === 'vague' ? 0 : 1), 'asc'], [r => r.run, 'asc']
    ]
    pool.sort((a, b) => {
      for (const [k, dir] of keys) { const d = k(a) - k(b); if (d) return dir === 'asc' ? d : -d }
      return 0
    })
    client = pool[0]
    keysUsed = true
    reason = `step 4: the first suite in the order of the keys${noneEligible ? ' (with key 0: no candidate is eligible)' : ''}`
  }
  const order = keysUsed ? pool.map(r => r.name) : null
  const out = { generatedAt: new Date().toISOString(), rule: 'bench/hypotheses-v2.md, section "The client suite for E4" (tag hypotheses-v2)', client: client.name, reason, order, rows }
  const md = [
    '# The client suite for E4',
    '',
    `Source: \`bench/select-client.mjs\`, ${out.generatedAt}. Rule: ${out.rule}.`,
    '',
    '| Candidate | Tests | Clean run | Clean build | Recheck | Eligible | Missed bugs | Mutation score | Judge partial + missing | Judge missing |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map(r => `| ${r.name} | ${r.tests} | ${r.cleanRun} | ${r.cleanBuild} | ${r.recheck} | ${r.eligible ? 'yes' : 'no'} | ${r.missed}${r.missedIds.length ? ` (${r.missedIds.join(' ')})` : ''} | ${r.score} of 14 | ${r.partialMissing} | ${r.missing} |`),
    '',
    keysUsed ? `The order of the ${noneEligible ? '' : 'eligible '}candidates by the keys: ${order.join(', ')}.` : 'Step 3 applies, so the keys of step 4 do not apply.',
    '',
    `The client suite: **${client.name}**. The reason: ${reason}.`,
    ''
  ].join('\n')
  fs.writeFileSync(path.join(RESULTS, 'client-selection.json'), JSON.stringify(out, null, 2) + '\n')
  fs.writeFileSync(path.join(RESULTS, 'client-selection.md'), md)
  console.log(md)
}

try {
  main()
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(1)
}
