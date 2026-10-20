#!/usr/bin/env node
// Blind judge of the coverage of the test cases (plan section 6). One judge run for each suite.
//
//   node bench/run-judge.mjs --model claude-opus-5-5 --budget 10
//   node bench/run-judge.mjs --model claude-haiku-5-5 --budget 1 --out judge-try   (a cheap test of this script)
//
// For each suite, the script copies the test code of the tag gen-1 without the harness files into a new
// temp folder, under the random name suite-1 or suite-2. The judge sees only test-cases/ and code/ and the
// rubric bench/judge.md. It runs with the pinned CLI, read-only tools and no MCP.
// The mapping of suite-1 and suite-2 to A and B goes to bench/results/<out>/mapping.json after both runs.
import { randomInt } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { LAB, RESULTS, SUITES, log, must, opt, run } from './lib.mjs'

const MODEL = opt('--model')
const BUDGET = opt('--budget', '10')
const OUT = opt('--out', 'judge')
const RAW = path.join(RESULTS, OUT)
const CLAUDE_BIN = path.join(process.env.HOME, '.local', 'claude-code-2.1.299', 'node_modules', '.bin', 'claude')
const NODE_BIN = path.join(process.env.HOME, '.local', 'node-v24.21.0', 'bin')
const TAG = 'gen-1'
// Top-level folders of a suite that hold test code. Everything else is project setup or harness.
const CODE_DIRS = ['tests', 'core', 'fixtures', 'page-objects', 'utils']
const DENIED_TOOLS = ['Bash', 'Write', 'Edit', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Agent', 'Task', 'Skill', 'TodoWrite']

// The steps of each test case: the rows "| N | step | expected |" of the files test-cases/TC-NN-*.md.
function expectedSteps () {
  const dir = path.join(LAB, 'test-cases')
  const steps = []
  for (const f of fs.readdirSync(dir).filter(f => /^TC-\d\d-.*\.md$/.test(f)).sort()) {
    const tc = f.slice(0, 5)
    for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/^\| (\d+) \|/gm)) steps.push(`${tc}#${m[1]}`)
  }
  return steps
}

function prepare (suiteId, label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `judge-${label}-`))
  fs.cpSync(path.join(LAB, 'test-cases'), path.join(root, 'test-cases'), { recursive: true })
  const files = must('git', ['-C', SUITES[suiteId], 'ls-tree', '-r', '--name-only', TAG]).split('\n')
    .filter(f => CODE_DIRS.includes(f.split('/')[0]))
  fs.mkdirSync(path.join(root, 'code'))
  must('sh', ['-c', `git -C "${SUITES[suiteId]}" archive ${TAG} -- ${files.map(f => `'${f}'`).join(' ')} | tar -x -C "${path.join(root, 'code')}"`])
  log(`  ${label}: ${files.length} files in ${root}/code`)
  return root
}

function judge (label, root, steps) {
  const prompt = fs.readFileSync(path.join(LAB, 'bench', 'judge.md'), 'utf8')
  const env = {
    HOME: process.env.HOME, USER: process.env.USER, LOGNAME: process.env.LOGNAME ?? process.env.USER, SHELL: process.env.SHELL ?? '/bin/zsh',
    TERM: process.env.TERM ?? 'xterm-256color', LANG: process.env.LANG ?? 'en_US.UTF-8', TMPDIR: os.tmpdir(),
    PATH: `${NODE_BIN}:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`, DISABLE_AUTOUPDATER: '1'
  }
  const started = Date.now()
  const r = run(CLAUDE_BIN, ['-p', prompt, '--model', MODEL, '--output-format', 'json', '--max-budget-usd', BUDGET,
    '--permission-mode', 'default', '--strict-mcp-config', '--disallowedTools', ...DENIED_TOOLS], { cwd: root, env })
  fs.writeFileSync(path.join(RAW, `${label}.raw.json`), r.out)
  let meta
  try { meta = JSON.parse(r.out) } catch { throw new Error(`${label}: the CLI output is not JSON (exit ${r.code}). See ${label}.raw.json`) }
  const text = meta.result ?? ''
  const verdicts = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)).results
  const got = verdicts.map(v => `${v.tc}#${v.step}`)
  const missingSteps = steps.filter(s => !got.includes(s))
  const extraSteps = got.filter(s => !steps.includes(s))
  const counts = { covered: 0, partial: 0, missing: 0 }
  for (const v of verdicts) counts[v.verdict] = (counts[v.verdict] ?? 0) + 1
  const res = {
    label, model: MODEL, cost: meta.total_cost_usd, durationMs: Date.now() - started, isError: meta.is_error,
    stepsExpected: steps.length, stepsJudged: verdicts.length, missingSteps, extraSteps, counts, verdicts
  }
  fs.writeFileSync(path.join(RAW, `${label}.json`), JSON.stringify(res, null, 2) + '\n')
  log(`  ${label}: ${JSON.stringify(counts)}, judged ${verdicts.length} of ${steps.length} steps, cost ${meta.total_cost_usd}${missingSteps.length || extraSteps.length ? `, MISMATCH missing ${missingSteps} extra ${extraSteps}` : ''}`)
  return res
}

function main () {
  if (!MODEL) throw new Error('give --model. Arsen decides the judge model (plan section 12, item 3).')
  if (fs.existsSync(RAW)) throw new Error(`${RAW} exists. Use another --out.`)
  fs.mkdirSync(RAW, { recursive: true })
  const steps = expectedSteps()
  const flip = randomInt(2) === 1
  const mapping = { 'suite-1': flip ? 'B' : 'A', 'suite-2': flip ? 'A' : 'B' }
  log(`judge model ${MODEL}, budget ${BUDGET} USD for each suite, ${steps.length} steps`)
  const results = {}
  for (const label of ['suite-1', 'suite-2']) {
    const root = prepare(mapping[label], label)
    try {
      results[label] = judge(label, root, steps)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
  fs.writeFileSync(path.join(RAW, 'mapping.json'), JSON.stringify(mapping, null, 2) + '\n')

  const bySuite = Object.fromEntries(Object.entries(mapping).map(([label, s]) => [s, results[label]]))
  const md = [
    `# Blind judge (${OUT})`,
    '',
    `Source: \`bench/run-judge.mjs\`, model \`${MODEL}\`, ${new Date().toISOString()}. The judge saw the suites as \`suite-1\` and \`suite-2\`. Mapping: \`${OUT}/mapping.json\`.`,
    '',
    '| Suite | Judged as | Steps | Covered | Partial | Missing | Cost USD |',
    '|---|---|---|---|---|---|---|',
    ...['A', 'B'].map(s => { const r = bySuite[s]; return `| ${s} | ${r.label} | ${r.stepsJudged} of ${r.stepsExpected} | ${r.counts.covered} | ${r.counts.partial} | ${r.counts.missing} | ${r.cost} |` }),
    ''
  ].join('\n')
  fs.writeFileSync(path.join(RESULTS, `${OUT}.md`), md)
  console.log('\n' + md)
}

try {
  main()
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(1)
}
