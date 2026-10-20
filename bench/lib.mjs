// Shared helpers for the bench scripts: paths, conditions and runs, the suite selector, the app, the suite runs
// and the Playwright JSON report.
//
// The suite selector (options of each measurement script):
//   --cond <c> --run <n>        suites A and B of run n of condition c (defaults: precise, 1)
//   --suite <label>=<path> ...  one or more suites with any labels; they replace A and B. Then --out is necessary.
//   --list-suites               print the selected suites and exit
// BENCH_CONDITIONS=<file> replaces bench/conditions.json (only for a test of the scripts).
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const LAB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const APP_DIR = path.join(LAB, 'juice-shop')
export const SEALED = path.join(LAB, 'sealed')
export const RESULTS = path.join(LAB, 'bench', 'results')
export const RUNS = path.resolve(LAB, '..', 'harness-demo-runs')
export const CONDITIONS_FILE = process.env.BENCH_CONDITIONS || path.join(LAB, 'bench', 'conditions.json')
// The conditions of stage 2 (plan v2, section 4), or null when the file does not exist.
export const CONDITIONS = fs.existsSync(CONDITIONS_FILE) ? JSON.parse(fs.readFileSync(CONDITIONS_FILE, 'utf8')) : null
const START_APP = path.join(LAB, 'bench', 'start-app.sh')
const NODE_BIN = path.join(process.env.HOME, '.local', 'node-v24.21.0', 'bin')
export const env = { ...process.env, PATH: `${NODE_BIN}:${process.env.PATH}` }

export const log = msg => console.log(`[${new Date().toTimeString().slice(0, 8)}] ${msg}`)

export function opt (name, fallback) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : fallback
}

// All values of an option that a script can get more than one time, in the order of the command line.
export const optAll = name => process.argv.flatMap((a, i) => (a === name && i + 1 < process.argv.length ? [process.argv[i + 1]] : []))

export function run (cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env, timeout: 30 * 60 * 1000, ...opts })
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}

export function must (cmd, args, opts) {
  const r = run(cmd, args, opts)
  if (r.code !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (${r.code}):\n${r.out}`)
  return r.out.trim()
}

export const appTreeIsClean = () => must('git', ['-C', APP_DIR, 'status', '--short']) === ''
export const stopApp = () => must(START_APP, ['stop'])
export const startApp = build => must(START_APP, ['start'], { env: { ...env, SKIP_BUILD: build ? '0' : '1' } })

// --- conditions, runs and result names --------------------------------------------------------

// The options --cond (default precise) and --run (default 1) of a script.
export function condRun () {
  const cond = opt('--cond', 'precise')
  const run = opt('--run', '1')
  if (!/^[a-z][\w-]*$/.test(cond)) throw new Error(`--cond ${cond}: not a condition name`)
  if (!/^[1-9]\d*$/.test(run)) throw new Error(`--run ${run}: not a run number`)
  if (CONDITIONS && !CONDITIONS.conditions[cond]) throw new Error(`--cond ${cond}: not in ${CONDITIONS_FILE}`)
  return { cond, run }
}

// The run folder of suite A or B: RUNS/<conditions[cond].dir>/run-<n>/suite-<a|b>.
export function runDir (cond, suiteId, n) {
  if (!CONDITIONS) throw new Error(`no ${CONDITIONS_FILE}. Agent L2 writes it.`)
  const c = CONDITIONS.conditions[cond]
  if (!c) throw new Error(`condition ${cond} is not in ${CONDITIONS_FILE}`)
  if (!['A', 'B'].includes(suiteId)) throw new Error(`suite ${suiteId}: use A or B`)
  return path.join(RUNS, c.dir, `run-${n}`, `suite-${suiteId.toLowerCase()}`)
}

// Run 1 of the precise test cases is the run of stage 1. Its files keep the names of stage 1.
const isLegacy = (cond, n) => cond === 'precise' && String(n) === '1'

// The name of a result file of a generation run, in bench/results/.
//   resultName('gen', 'vague', 'A', 2)                    gen-vague-A-2.json
//   resultName('gen', 'vague', 'A', 2, '-followup.json')  gen-vague-A-2-followup.json
//   resultName('clean', 'precise', 'B', 1, '.txt')        clean-B-1.txt (the legacy name)
export const resultName = (kind, cond, suiteId, n, suffix = '.json') =>
  `${kind}-${isLegacy(cond, n) ? '' : `${cond}-`}${suiteId}-${n}${suffix}`

// The default --out of a measurement: <kind>-<cond>-<n>, or <kind> for precise run 1 (mutants, flaky, judge, summary).
export const outName = (kind, cond, n) => (isLegacy(cond, n) ? kind : `${kind}-${cond}-${n}`)

// The --out of a measurement script. Without --out: outName(kind, cond, run). With --suite, --out is necessary,
// because the default name is the output of suites A and B, and a different suite set must not replace it.
export function outOption (kind) {
  const out = opt('--out')
  if (out) return out
  const { cond, run } = condRun()
  if (optAll('--suite').length) throw new Error(`give --out with --suite. The default ${outName(kind, cond, run)} is the output of suites A and B.`)
  return outName(kind, cond, run)
}

// --- the suite selector -------------------------------------------------------------------------

// The suites of a script as { label: folder }. See the header of this file.
export function selectSuites () {
  const given = optAll('--suite')
  let suites
  if (given.length === 0) {
    const { cond, run } = condRun()
    suites = { A: runDir(cond, 'A', run), B: runDir(cond, 'B', run) }
  } else {
    suites = {}
    for (const g of given) {
      const m = g.match(/^([A-Za-z0-9_-]+)=(.+)$/)
      if (!m) throw new Error(`--suite ${g}: use <label>=<path>`)
      if (suites[m[1]]) throw new Error(`--suite: the label ${m[1]} is given two times`)
      suites[m[1]] = path.resolve(m[2])
    }
  }
  if (process.argv.includes('--list-suites')) {
    for (const [s, dir] of Object.entries(suites)) console.log(`${s}\t${dir}\t${fs.existsSync(dir) ? 'exists' : 'MISSING'}`)
    process.exit(0)
  }
  const missing = Object.entries(suites).filter(([, dir]) => !fs.existsSync(dir))
  if (missing.length) throw new Error(`no suite folder: ${missing.map(([s, d]) => `${s}=${d}`).join(', ')}`)
  return suites
}

// Why the code at the git ref is not the code in the suite folder, or null when it is the same code.
export function refDiffers (dir, ref) {
  const at = must('git', ['-C', dir, 'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`])
  const head = must('git', ['-C', dir, 'rev-parse', '--verify', 'HEAD^{commit}'])
  if (at !== head) return `HEAD ${head.slice(0, 12)} is not ${ref} ${at.slice(0, 12)}`
  // --no-optional-locks: git status does not write the index of the suite.
  const changes = must('git', ['--no-optional-locks', '-C', dir, 'status', '--porcelain'])
  return changes ? `the working tree has changes in ${changes.split('\n').length} paths` : null
}

// The git ref of the test code for run-judge and collect-metrics: --ref, or the tag gen-<run>.
// run-mutants and run-flaky measure the suite folder, not a ref. So without --ref, the script stops when a suite
// folder is not at gen-<run> or has changes. With --ref, it only gives a warning.
export function codeRef (suites, run) {
  const given = opt('--ref')
  const ref = given ?? `gen-${run}`
  for (const [s, dir] of Object.entries(suites)) {
    const why = refDiffers(dir, ref)
    if (!why) continue
    const msg = `suite ${s} (${dir}): ${why}. run-mutants and run-flaky measure the folder, not ${ref}.`
    if (!given) throw new Error(`${msg} To use a different ref, give --ref, for example --ref HEAD.`)
    console.error(`warning: ${msg}`)
  }
  return ref
}

// --- the Playwright report and the suite runs ---------------------------------------------------

// Flattens a Playwright JSON report into { tests: { key -> { tc, statuses[] } }, errors[] }.
// The key is "<spec file> :: <describe titles> > <test title>". Repeats add more statuses to one key.
export function readReport (file) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'))
  const tests = {}
  const walk = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      const key = `${spec.file} :: ${[...titles, spec.title].join(' > ')}`
      for (const t of spec.tests) {
        const ann = (t.annotations ?? []).find(a => a.type === 'test-case')?.description
        const tc = ann ?? (`${spec.file} ${spec.title}`.match(/TC-\d\d/) ?? [null])[0]
        tests[key] ??= { tc, statuses: [] }
        for (const r of t.results) tests[key].statuses.push(r.status)
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...titles, child.title])
  }
  for (const s of report.suites ?? []) walk(s, [])
  return { tests, errors: (report.errors ?? []).map(e => e.message?.split('\n')[0]), stats: report.stats }
}

export const passedAll = t => Boolean(t) && t.statuses.length > 0 && t.statuses.every(s => s === 'passed')

// Runs the suite in the folder dir once against the running app and returns its flattened report.
// extraEnv goes to the Playwright process, for example { BASE_URL: 'http://localhost:3100' }.
export function runSuiteAt (dir, outFile, extraArgs = [], extraEnv = {}) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  const r = run('npx', ['playwright', 'test', '--retries=0', '--reporter=json', ...extraArgs],
    { cwd: dir, env: { ...env, ...extraEnv, PLAYWRIGHT_JSON_OUTPUT_NAME: outFile } })
  if (!fs.existsSync(outFile)) throw new Error(`no report from the suite in ${dir} (${outFile}), exit ${r.code}:\n${r.out.slice(-2000)}`)
  const rep = readReport(outFile)
  const runs = Object.values(rep.tests).reduce((n, t) => n + t.statuses.length, 0)
  const passed = Object.values(rep.tests).reduce((n, t) => n + t.statuses.filter(s => s === 'passed').length, 0)
  const name = dir.startsWith(RUNS + path.sep) ? path.relative(RUNS, dir) : dir
  log(`  suite ${name} ${path.basename(outFile)}: ${passed}/${runs} test runs passed, exit ${r.code}${rep.errors.length ? `, errors: ${rep.errors.join(' | ')}` : ''}`)
  return rep
}
