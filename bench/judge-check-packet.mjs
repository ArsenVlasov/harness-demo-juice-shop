#!/usr/bin/env node
// Makes the packet for the manual check of the judge (plan v2 item 1.1, decision 20): the precise test case step, the
// verdict and the note of the judge for suite A and suite B, and the code lines of the evidence of the judge, from each
// suite at its generation tag.
//
//   node bench/judge-check-packet.mjs
//
// Output: bench/results/judge-check-1.1.md (the packet) and bench/judge-check-1.1.csv (the answer sheet of Arsen, one
// row for each step and suite). The script does not overwrite an answer sheet that exists.
import fs from 'node:fs'
import path from 'node:path'
import { LAB, RESULTS, RUNS, must } from './lib.mjs'

// The vague pairs that the judge read. The pair of run 3 is A-3 and B-4 (LOG.md, entry 21.10, 23:20).
const PAIRS = {
  'vague-1': { judge: 'judge-vague-1', A: ['set-2/run-1/suite-a', 'gen-1'], B: ['set-2/run-1/suite-b', 'gen-1'] },
  'vague-2': { judge: 'judge-vague-2', A: ['set-2/run-2/suite-a', 'gen-2'], B: ['set-2/run-2/suite-b', 'gen-2'] },
  'vague-3': { judge: 'judge-vague-3', A: ['set-2/run-3/suite-a', 'gen-3'], B: ['set-2/run-4/suite-b', 'gen-4'] },
}

// Part 2: the steps of A with `partial` and a note that names no helper or calculated value.
// Part 3: the sample of item 1.1, TC-07 and TC-08 of A-2 and A-3: the steps with a note about a helper.
const PARTS = [
  {
    title: 'Part 2: the steps of A that the judge gave `partial` for another reason',
    items: [['vague-1', 'TC-04', 2], ['vague-1', 'TC-06', 4], ['vague-2', 'TC-01', 1], ['vague-2', 'TC-06', 4],
      ['vague-2', 'TC-07', 7], ['vague-2', 'TC-08', 8], ['vague-3', 'TC-08', 4]],
  },
  {
    title: 'Part 3: the sample of item 1.1, TC-07 and TC-08 of vague runs 2 and 3, the steps with a note about a helper',
    items: [2, 6, 8, 10].map(s => ['TC-07', s]).concat([2, 6, 7, 9, 10].map(s => ['TC-08', s]))
      .flatMap(([tc, s]) => [['vague-2', tc, s], ['vague-3', tc, s]]),
  },
]

const SHEET = path.join(LAB, 'bench', 'judge-check-1.1.csv')
const show = (repo, ref, file) => must('git', ['-C', path.join(RUNS, repo), 'show', `${ref}:${file}`])

// The step row of a precise test case: { step, expected }.
function stepOf (tc, n) {
  const file = fs.readdirSync(path.join(LAB, 'test-cases')).find(f => f.startsWith(`${tc}-`))
  const row = fs.readFileSync(path.join(LAB, 'test-cases', file), 'utf8').split('\n')
    .map(l => l.match(/^\| (\d+) \| (.+?) \| (.+) \|$/)).find(m => m && Number(m[1]) === n)
  if (!row) throw new Error(`${tc} has no step ${n}`)
  return { step: row[2], expected: row[3] }
}

const judges = {}
function verdictOf (run, suite, tc, n) {
  const p = PAIRS[run]
  if (!judges[run]) {
    const map = JSON.parse(fs.readFileSync(path.join(RESULTS, p.judge, 'mapping.json'), 'utf8'))
    judges[run] = Object.fromEntries(Object.entries(map).map(([file, label]) =>
      [label, JSON.parse(fs.readFileSync(path.join(RESULTS, p.judge, `${file}.json`), 'utf8'))]))
  }
  return judges[run][suite].verdicts.find(v => v.tc === tc && v.step === n)
}

// The lines of the evidence, with one line of context on each side, grouped by file.
function excerpt (repo, ref, evidence) {
  const byFile = new Map()
  for (const e of evidence) {
    const [file, line] = [e.slice(0, e.lastIndexOf(':')), Number(e.slice(e.lastIndexOf(':') + 1))]
    byFile.set(file, [...(byFile.get(file) ?? []), line])
  }
  const out = []
  for (const [file, lines] of byFile) {
    const text = show(repo, ref, file).split('\n')
    const keep = new Set(lines.flatMap(l => [l - 1, l, l + 1]).filter(l => l >= 1 && l <= text.length))
    out.push(`\`${file}\`:`, '```ts')
    let last = 0
    for (const l of [...keep].sort((a, b) => a - b)) {
      if (last && l > last + 1) out.push('  ...')
      out.push(`${String(l).padStart(4)}${lines.includes(l) ? ' >' : '  '} ${text[l - 1]}`)
      last = l
    }
    out.push('```')
  }
  return out
}

const md = [
  '# The manual check of the judge (item 1.1)',
  '',
  'The command `node bench/judge-check-packet.mjs` wrote this file. The order: the question of principle, then the other steps of A, then the sample of item 1.1.',
  'The notes of the judge are quoted with no change, in `text` blocks.',
  'Write your verdict for each row into `bench/judge-check-1.1.csv`, column `arsen`: `covered`, `partial` or `missing`. Add a short note when you do not agree with the judge.',
  'Use the rubric of the judge (`bench/judge.md`, the table "Verdict"). The judge used the precise test cases, so the step text below is the precise text.',
  '',
  '## Part 1: one question of principle',
  '',
  'The rubric gives `partial` to "a value that it calculates the same way as the app, not the value of the test case".',
  'Suites A-2 and B-2 both calculate the expected totals from fixed constants. The judge gave A-2 `partial` and B-2 `covered` for these steps.',
  '',
  'Question: a test calculates the expected value from fixed constants of the test data, with the formula of the test case. Is this check `covered` or `partial`?',
  'Write your answer in the row `principle` of the answer sheet.',
  '',
  'Example: TC-05 step 5 of vague run 2.',
  '',
]
const ex = stepOf('TC-05', 5)
md.push(`Step: ${ex.step}`, '', `Expected result: ${ex.expected}`, '')
for (const [label, repo, ref, files] of [
  ['A-2', 'set-2/run-2/suite-a', 'gen-2', [['data/test-data.ts', 1, 16], ['helpers/money.ts', 14, 28], ['tests/tc-05-valid-coupon.spec.ts', 20, 30], ['tests/tc-05-valid-coupon.spec.ts', 62, 70]]],
  ['B-2', 'set-2/run-2/suite-b', 'gen-2', [['utils/constants/shop-catalog.ts', 1, 24], ['utils/helpers/price-helper.ts', 26, 44], ['tests/specs/regression/payment/valid-coupon.spec.ts', 45, 58]]],
]) {
  const v = verdictOf('vague-2', label[0], 'TC-05', 5)
  md.push(`### ${label}: the judge gave \`${v.verdict}\``, '', 'Note of the judge:', '```text', v.note, '```', '')
  for (const [file, from, to] of files) {
    const text = show(repo, ref, file).split('\n')
    md.push(`\`${file}\`, lines ${from} to ${to}:`, '```ts', ...text.slice(from - 1, to).map((t, i) => `${String(from + i).padStart(4)}   ${t}`), '```', '')
  }
}

const rows = [['id', 'run', 'suite', 'tc', 'step', 'judge', 'arsen', 'note']]
rows.push(['principle', 'vague-2', 'A and B', 'TC-05', '5', 'A partial, B covered', '', ''])
for (const part of PARTS) {
  md.push(`## ${part.title}`, '')
  for (const [run, tc, n] of part.items) {
    const s = stepOf(tc, n)
    md.push(`### ${run}, ${tc} step ${n}`, '', `Step: ${s.step}`, '', `Expected result: ${s.expected}`, '')
    for (const suite of ['A', 'B']) {
      const [repo, ref] = PAIRS[run][suite]
      const v = verdictOf(run, suite, tc, n)
      const id = `${run}-${suite}-${tc}-${n}`
      md.push(`**${suite}** (\`${repo}\`, tag \`${ref}\`), row \`${id}\`: the judge gave \`${v.verdict}\`. Note of the judge:`, '', '```text', v.note, '```', '')
      md.push(...(v.evidence.length ? excerpt(repo, ref, v.evidence) : ['(no evidence lines)']), '')
      rows.push([id, run, suite, tc, String(n), v.verdict, '', ''])
    }
  }
}

fs.writeFileSync(path.join(RESULTS, 'judge-check-1.1.md'), md.join('\n') + '\n')
if (fs.existsSync(SHEET)) console.log(`${SHEET} exists: not changed`)
else fs.writeFileSync(SHEET, rows.map(r => r.map(c => (/[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n') + '\n')
console.log(`bench/results/judge-check-1.1.md: ${rows.length - 2} step rows and the row principle`)
