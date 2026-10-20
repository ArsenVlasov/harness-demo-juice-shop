// Shared helpers for the bench scripts: paths, the app, the suite runs and the Playwright JSON report.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const LAB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const APP_DIR = path.join(LAB, 'juice-shop')
export const SEALED = path.join(LAB, 'sealed')
export const RESULTS = path.join(LAB, 'bench', 'results')
export const RUNS = path.resolve(LAB, '..', 'harness-demo-runs')
export const SUITES = { A: path.join(RUNS, 'suite-a'), B: path.join(RUNS, 'suite-b') }
const START_APP = path.join(LAB, 'bench', 'start-app.sh')
const NODE_BIN = path.join(process.env.HOME, '.local', 'node-v24.21.0', 'bin')
export const env = { ...process.env, PATH: `${NODE_BIN}:${process.env.PATH}` }

export const log = msg => console.log(`[${new Date().toTimeString().slice(0, 8)}] ${msg}`)

export function opt (name, fallback) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : fallback
}

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

// Runs one suite once against the running app and returns its flattened report.
export function runSuite (suiteId, outFile, extraArgs = []) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  const r = run('npx', ['playwright', 'test', '--retries=0', '--reporter=json', ...extraArgs],
    { cwd: SUITES[suiteId], env: { ...env, PLAYWRIGHT_JSON_OUTPUT_NAME: outFile } })
  if (!fs.existsSync(outFile)) throw new Error(`no report from suite ${suiteId} (${outFile}), exit ${r.code}:\n${r.out.slice(-2000)}`)
  const rep = readReport(outFile)
  const runs = Object.values(rep.tests).reduce((n, t) => n + t.statuses.length, 0)
  const passed = Object.values(rep.tests).reduce((n, t) => n + t.statuses.filter(s => s === 'passed').length, 0)
  log(`  suite ${suiteId} ${path.basename(outFile)}: ${passed}/${runs} test runs passed, exit ${r.code}${rep.errors.length ? `, errors: ${rep.errors.join(' | ')}` : ''}`)
  return rep
}
