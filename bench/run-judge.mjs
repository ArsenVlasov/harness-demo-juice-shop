#!/usr/bin/env node
// Blind judge of the coverage of the test cases (plan section 6). One judge run for each selected suite.
//
//   node bench/run-judge.mjs --model claude-opus-5-5 --budget 10                 precise run 1, suites A and B
//   node bench/run-judge.mjs --model claude-opus-5-5 --cond vague --run 2        suites A and B of run 2 of vague
//   node bench/run-judge.mjs --model claude-opus-5-5 --suite before=<dir> --suite after=<dir> --ref HEAD --out judge-e4
//   node bench/run-judge.mjs --model claude-haiku-5-5 --budget 1 --out judge-try   (a cheap test of this script)
//   node bench/run-judge.mjs --run 1 --prepare-only     prepare the blind folders, print the files and a sha256, call no model
//   node bench/run-judge.mjs --list-suites              print the selected suites and exit
//
// For each suite, the script copies the test code of the git ref (default: the tag gen-<run>) without the harness
// files into a new temp folder, under a random name suite-1 to suite-k. Without --ref, the script stops when a suite
// folder is not at gen-<run> or has changes, because run-mutants and run-flaky measure the folder (codeRef() in lib.mjs).
// For a --suite set with fix commits after gen-<run>, give --ref HEAD: each suite then gives its own HEAD.
// The judge sees only test-cases/ and code/ and the rubric bench/judge.md. It runs with the pinned CLI, read-only
// tools and no MCP.
// test-cases/ is a copy of --test-cases <dir> (default: the precise set LAB/test-cases). The judge grades each
// suite against the precise test cases, unless the pre-registration tells other.
// Default --out: judge-<cond>-<run>, or judge for precise run 1. With --suite, --out is necessary (not with --prepare-only).
// The suite selector is in bench/lib.mjs.
// The mapping of suite-1 to suite-k to the suite labels goes to bench/results/<out>/mapping.json after all runs.
import { createHash, randomInt } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { LAB, RESULTS, codeRef, condRun, log, must, opt, outOption, run, selectSuites } from './lib.mjs'

const MODEL = opt('--model')
const BUDGET = opt('--budget', '10')
const PREPARE_ONLY = process.argv.includes('--prepare-only')
const TEST_CASES = path.resolve(opt('--test-cases', path.join(LAB, 'test-cases')))
const CLAUDE_BIN = path.join(process.env.HOME, '.local', 'claude-code-2.1.299', 'node_modules', '.bin', 'claude')
const NODE_BIN = path.join(process.env.HOME, '.local', 'node-v24.21.0', 'bin')
// Top-level folders of a suite that hold test code. Everything else is project setup or harness.
const CODE_DIRS = ['tests', 'core', 'fixtures', 'page-objects', 'utils']
const DENIED_TOOLS = ['Bash', 'Write', 'Edit', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Agent', 'Task', 'Skill', 'TodoWrite']

// The steps of each test case: the rows "| N | step | expected |" of the files TC-NN-*.md in --test-cases.
function expectedSteps () {
  const dir = TEST_CASES
  const steps = []
  for (const f of fs.readdirSync(dir).filter(f => /^TC-\d\d-.*\.md$/.test(f)).sort()) {
    const tc = f.slice(0, 5)
    for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/^\| (\d+) \|/gm)) steps.push(`${tc}#${m[1]}`)
  }
  return steps
}

// A new temp folder with test-cases/ and code/: the code folders of the suite at the git ref.
function prepare (dir, ref, label) {
  const files = must('git', ['-C', dir, 'ls-tree', '-r', '-z', '--name-only', ref]).split('\0')
    .filter(f => CODE_DIRS.includes(f.split('/')[0]))
  if (files.length === 0) throw new Error(`no files in ${CODE_DIRS.join(', ')} at ${ref} in ${dir}`)
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `judge-${label}-`))
  try {
    fs.cpSync(TEST_CASES, path.join(root, 'test-cases'), { recursive: true })
    const tar = path.join(root, 'code.tar')
    fs.mkdirSync(path.join(root, 'code'))
    must('git', ['-C', dir, 'archive', '-o', tar, ref, '--', ...files])
    must('tar', ['-x', '-f', tar, '-C', path.join(root, 'code')])
    fs.rmSync(tar)
  } catch (e) {
    fs.rmSync(root, { recursive: true, force: true })
    throw e
  }
  log(`  ${label}: ${files.length} files in ${root}/code`)
  return { root, files }
}

// One sha256 of a code tree: the sorted relative paths with the sha256 of each file.
function treeHash (codeDir) {
  const files = fs.readdirSync(codeDir, { recursive: true }).filter(f => fs.statSync(path.join(codeDir, f)).isFile()).sort()
  const h = createHash('sha256')
  for (const f of files) h.update(`${f}\0${createHash('sha256').update(fs.readFileSync(path.join(codeDir, f))).digest('hex')}\n`)
  return { files, sha256: h.digest('hex') }
}

// Random blind labels suite-1 to suite-k for the suite labels: { 'suite-1': 'B', 'suite-2': 'A' }.
function blindMapping (labels) {
  const order = [...labels]
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]]
  }
  return Object.fromEntries(order.map((s, i) => [`suite-${i + 1}`, s]))
}

const listWords = items => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)

function judge (label, root, steps, raw) {
  const prompt = fs.readFileSync(path.join(LAB, 'bench', 'judge.md'), 'utf8')
  const env = {
    HOME: process.env.HOME, USER: process.env.USER, LOGNAME: process.env.LOGNAME ?? process.env.USER, SHELL: process.env.SHELL ?? '/bin/zsh',
    TERM: process.env.TERM ?? 'xterm-256color', LANG: process.env.LANG ?? 'en_US.UTF-8', TMPDIR: os.tmpdir(),
    PATH: `${NODE_BIN}:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`, DISABLE_AUTOUPDATER: '1'
  }
  const started = Date.now()
  const r = run(CLAUDE_BIN, ['-p', prompt, '--model', MODEL, '--output-format', 'json', '--max-budget-usd', BUDGET,
    '--permission-mode', 'default', '--strict-mcp-config', '--disallowedTools', ...DENIED_TOOLS], { cwd: root, env })
  fs.writeFileSync(path.join(raw, `${label}.raw.json`), r.out)
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
  fs.writeFileSync(path.join(raw, `${label}.json`), JSON.stringify(res, null, 2) + '\n')
  log(`  ${label}: ${JSON.stringify(counts)}, judged ${verdicts.length} of ${steps.length} steps, cost ${meta.total_cost_usd}${missingSteps.length || extraSteps.length ? `, MISMATCH missing ${missingSteps} extra ${extraSteps}` : ''}`)
  return res
}

// --prepare-only: the blind folders without a model call. It prints the files and the tree sha256 of each suite.
function prepareOnly (suites, ref) {
  for (const [label, s] of Object.entries(blindMapping(Object.keys(suites)))) {
    const { root } = prepare(suites[s], ref, label)
    try {
      const t = treeHash(path.join(root, 'code'))
      console.log(`${label} = ${s} (${suites[s]} at ${ref}): ${t.files.length} files, code tree sha256 ${t.sha256}`)
      for (const f of t.files) console.log(`  ${f}`)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
}

function main () {
  const suites = selectSuites()
  const ref = codeRef(suites, condRun().run)
  if (PREPARE_ONLY) return prepareOnly(suites, ref)
  const out = outOption('judge')
  const raw = path.join(RESULTS, out)
  if (!MODEL) throw new Error('give --model. Arsen decides the judge model (plan section 12, item 3).')
  if (fs.existsSync(raw)) throw new Error(`${raw} exists. Use another --out.`)
  fs.mkdirSync(raw, { recursive: true })
  const steps = expectedSteps()
  const mapping = blindMapping(Object.keys(suites))
  log(`judge model ${MODEL}, budget ${BUDGET} USD for each suite, ${steps.length} steps, ref ${ref}, test cases ${TEST_CASES}`)
  const results = {}
  for (const [label, s] of Object.entries(mapping)) {
    const { root } = prepare(suites[s], ref, label)
    try {
      results[label] = judge(label, root, steps, raw)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
  fs.writeFileSync(path.join(raw, 'mapping.json'), JSON.stringify(mapping, null, 2) + '\n')

  const bySuite = Object.fromEntries(Object.entries(mapping).map(([label, s]) => [s, results[label]]))
  const md = [
    `# Blind judge (${out})`,
    '',
    `Source: \`bench/run-judge.mjs\`, model \`${MODEL}\`, ${new Date().toISOString()}. The judge saw the suites as ${listWords(Object.keys(mapping).map(l => `\`${l}\``))}. Mapping: \`${out}/mapping.json\`.`,
    '',
    '| Suite | Judged as | Steps | Covered | Partial | Missing | Cost USD |',
    '|---|---|---|---|---|---|---|',
    ...Object.keys(suites).map(s => { const r = bySuite[s]; return `| ${s} | ${r.label} | ${r.stepsJudged} of ${r.stepsExpected} | ${r.counts.covered} | ${r.counts.partial} | ${r.counts.missing} | ${r.cost} |` }),
    ''
  ].join('\n')
  fs.writeFileSync(path.join(RESULTS, `${out}.md`), md)
  console.log('\n' + md)
}

try {
  main()
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(1)
}
