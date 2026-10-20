#!/usr/bin/env node
// Tamper audit of one suite (plan v2: E4 step 2, second bullet, and the risk "Прокси ломает приложение").
// The suite runs through bench/tamper-proxy.mjs: first with no change, then one time for each rule.
// Only BASE_URL changes. The test code does not change.
//
//   node bench/run-audit-tamper.mjs --suite A1=../harness-demo-runs/set-1/run-1/suite-a --rules <file>
//   node bench/run-audit-tamper.mjs --suite A1=<path> --rules <file> --only id1,id2     only these rules
//   node bench/run-audit-tamper.mjs --suite A1=<path> --rules <file> --dry              print the plan, start nothing
//   options: --port 3100 (the proxy port, not 3000), --out <name> (default tamper-<label>),
//            --recheck <n> (default 3, 0 = off), --capture, --help
//   --capture: only in the passthrough run, the proxy also gets --capture bench/results/<out>/capture-<label>.jsonl.
//            This file has one line for each response to a browser request, with the JSON body (see "Capture" in
//            bench/tamper-proxy.mjs). The lines have the time, but not the test: the windows of passthrough.json give
//            the test. The rule runs and the recheck run have no capture. The other steps do not change.
//
// Steps:
//   1. juice-shop/ must be clean. bench/results/<out>/ and <out>.json must not exist (give a new --out, or remove
//      the old results). The app restarts without a build.
//   2. Passthrough run: the proxy with no rule. The suite runs with BASE_URL=http://localhost:<port>, --retries=0,
//      --workers=1 and the json reporter. Each test must pass and must send browser HTTP requests through the proxy.
//      The run must also be valid (see "Invalid run"). If not, the audit stops before the rules: the proxy breaks
//      the app, or a test goes around BASE_URL.
//   3. For each rule: the app restarts (clean database), the proxy starts with the rule, the suite runs the same way.
//   4. Recheck (the same as in run-mutants.mjs): when a test failed in a test window where its rule fired, the app
//      restarts and the suite runs <n> more times through the proxy with no rule (--repeat-each=<n>). A failed test
//      counts as a catch only when it passed each recheck run. A failure of an unstable test is not a catch.
//   5. bench/results/<out>.json and <out>.md. The raw files go to bench/results/<out>/: passthrough.*, recheck.*
//      and rules/<rule id>.* (the Playwright report .json, the proxy log .jsonl, the outputs .playwright.txt and
//      .proxy.txt, the Playwright output folder -output/), and capture-<label>.jsonl with --capture.
// The proxy and the app stop at the end, also after an error. Ctrl-C (SIGINT) or SIGTERM: the audit stops after the
// current suite run and writes no results. The exit code is 1 when a rule run is invalid.
//
// A proxy log line goes to a test by its time. --workers=1 runs the tests one after the other, so the window of a
// test starts at its startTime in the Playwright JSON report and ends at the startTime of the next test (the last
// window has no end). The script does not use startTime + duration as the end: in Playwright 1.64.1 the duration
// does not include the worker fixtures (for example the browser launch), and the requests of the first test come
// after startTime + duration. A rule fires in a test when it changed at least one response in the window of that
// test. Verdict of a rule:
//   invalid         the rule run is not valid (see "Invalid run"). The report gives the reasons. Run the rule again.
//   not exercised   the rule fired in no test. "Matched, not changed" > 0 means that the browser got responses that
//                   match the rule, but the field was not there or had a different type: check the rule.
//   caught          the rule fired in a test, that test failed, and that test passed each recheck run
//   survived        the rule fired, and no test where it fired is a catch
// Invalid run: Playwright exit is not 0 or 1 (130 = interrupted); a test did not run to the end (interrupted,
// skipped or no result); a test of the passthrough run is not in the report; the report has errors; the proxy
// logged an error (the app did not answer: 502 or a cut body); the proxy did not exit with 0; there is no report.
// A test that fails where the rule did not fire is noise. The report lists it, but it does not change the verdict.
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { RESULTS, appTreeIsClean, env, log, opt, passedAll, readReport, run, startApp, stopApp } from './lib.mjs'
import { loadRules, usage } from './tamper-proxy.mjs'

const PROXY = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tamper-proxy.mjs')
const APP_URL = 'http://localhost:3000'
const SAMPLE = 3 // the report keeps the first 3 changed responses of a test, the first 3 fields of each, 3 reasons
const RAN = new Set(['passed', 'failed', 'timedOut']) // a test with one of these statuses ran to the end
let stopSignal = null

function readArgs () {
  const [label, ...rest] = (opt('--suite') ?? '').split('=')
  if (!/^[\w.-]+$/.test(label) || rest.length === 0 || !rest.join('=')) throw new Error('--suite <label>=<path> is necessary, for example --suite A1=../harness-demo-runs/set-1/run-1/suite-a')
  const suite = path.resolve(rest.join('='))
  if (!['ts', 'js', 'mjs', 'cjs'].some(e => fs.existsSync(path.join(suite, `playwright.config.${e}`)))) throw new Error(`no playwright.config.* in ${suite}`)
  if (!opt('--rules')) throw new Error('--rules <file> is necessary')
  const rulesFile = path.resolve(opt('--rules'))
  const rules = loadRules(rulesFile)
  const only = opt('--only')?.split(',').map(s => s.trim()).filter(Boolean)
  const unknown = (only ?? []).filter(id => !rules.some(r => r.id === id))
  if (unknown.length) throw new Error(`--only: no rule ${unknown.join(', ')} in ${rulesFile}`)
  const port = Number(opt('--port', 3100))
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 3000) throw new Error('--port must be 1024 to 65535 and not 3000 (the app port)')
  const recheck = Number(opt('--recheck', 3))
  if (!Number.isInteger(recheck) || recheck < 0 || recheck > 20) throw new Error('--recheck must be 0 to 20')
  const out = opt('--out', `tamper-${label}`)
  if (!/^[\w.-]+$/.test(out)) throw new Error('--out must be letters, digits, _, . or -')
  return { label, suite, rulesFile, rules: only ? rules.filter(r => only.includes(r.id)) : rules, port, recheck, target: APP_URL, out, raw: path.join(RESULTS, out), capture: process.argv.includes('--capture') }
}

const playwrightArgs = (cfg, name, extra = []) => ['playwright', 'test', '--retries=0', '--workers=1', '--reporter=json', `--output=${path.join(cfg.raw, `${name}-output`)}`, ...extra]
const ruleRunName = rule => path.join('rules', rule.id)
const captureFile = (cfg, name) => cfg.capture && name === 'passthrough' ? path.join(cfg.raw, `capture-${cfg.label}.jsonl`) : null

// Starts tamper-proxy.mjs as a child process and waits for its "listening" line in the log file.
async function startProxyProcess (cfg, name, ruleId) {
  const logFile = path.join(cfg.raw, `${name}.jsonl`)
  const outFile = path.join(cfg.raw, `${name}.proxy.txt`)
  const capture = captureFile(cfg, name)
  for (const f of [logFile, capture]) if (f) fs.rmSync(f, { force: true })
  const fd = fs.openSync(outFile, 'w')
  const args = [PROXY, '--port', String(cfg.port), '--target', cfg.target, '--rules', cfg.rulesFile, '--log', logFile, ...(ruleId ? ['--rule', ruleId] : []), ...(capture ? ['--capture', capture] : [])]
  const child = spawn('node', args, { env, stdio: ['ignore', fd, fd] })
  fs.closeSync(fd)
  const exit = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })))
  for (let i = 0; i < 100 && child.exitCode === null && child.signalCode === null; i++) {
    if (fs.existsSync(logFile) && fs.readFileSync(logFile, 'utf8').includes('"type":"listening"')) return { child, exit, logFile }
    await sleep(100)
  }
  child.kill('SIGKILL')
  throw new Error(`the proxy did not start on :${cfg.port}. Output (${outFile}):\n${fs.readFileSync(outFile, 'utf8').slice(-2000)}`)
}

// Stops the proxy with SIGTERM (SIGKILL after 5 s). Returns { code, signal, early }; early: it stopped before SIGTERM.
async function stopProxyProcess ({ child, exit }) {
  await sleep(50) // the event loop sees an exit (and a signal to this process) that came during the blocking suite run
  const early = child.exitCode !== null || child.signalCode !== null
  if (!early) child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000)
  const result = await exit
  clearTimeout(timer)
  return { ...result, early }
}

// The time window [start, end) of each test result, with the same key as readReport() in lib.mjs.
// A window ends where the next result starts (--workers=1). The last window has no end.
export function readWindows (file) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'))
  const starts = []
  const walk = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      const key = `${spec.file} :: ${[...titles, spec.title].join(' > ')}`
      for (const t of spec.tests) for (const r of t.results) starts.push({ key, start: Date.parse(r.startTime) })
    }
    for (const child of suite.suites ?? []) walk(child, [...titles, child.title])
  }
  for (const s of report.suites ?? []) walk(s, [])
  starts.sort((a, b) => a.start - b.start)
  return starts.map((w, i) => ({ ...w, end: starts[i + 1]?.start ?? Infinity }))
}

export function readEvents (file) {
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l) } catch { return null } })
    .filter(e => e?.time).map(e => ({ ...e, ms: Date.parse(e.time) }))
}

// Puts each proxy event into the test whose window holds its time. Events out of all windows go to "outside".
// browserRequests counts only HTTP requests; websocket upgrades go to "upgrades".
export function attribute (rep, windows, events) {
  const counts = () => ({ browserRequests: 0, otherRequests: 0, upgrades: 0, changes: [], skips: 0, skipReasons: [], aborts: 0, errors: [] })
  const tests = Object.fromEntries(Object.entries(rep.tests).map(([k, t]) => [k, { tc: t.tc, statuses: t.statuses, passed: passedAll(t), ...counts() }]))
  const outside = counts()
  for (const e of events) {
    const w = windows.find(w => e.ms >= w.start && e.ms < w.end)
    const into = (w && tests[w.key]) || outside
    if (e.type === 'request') into[e.upgrade ? 'upgrades' : e.browser ? 'browserRequests' : 'otherRequests']++
    else if (e.type === 'change') into.changes.push({ time: e.time, method: e.method, path: e.path, changes: e.changes })
    else if (e.type === 'skip') { into.skips++; if (!into.skipReasons.includes(e.reason)) into.skipReasons.push(e.reason) }
    else if (e.type === 'abort') into.aborts++
    else if (e.type === 'error') into.errors.push(`${e.method} ${e.path}: ${e.error}`)
  }
  return { tests, outside }
}

// Starts the proxy, runs the suite through it once, stops the proxy. Returns the tests with their proxy events.
// name is the path of the raw files in cfg.raw, without an extension. extra: more Playwright arguments.
export async function suiteRun (cfg, name, ruleId, extra = []) {
  fs.mkdirSync(path.dirname(path.join(cfg.raw, name)), { recursive: true })
  const report = path.join(cfg.raw, `${name}.json`)
  fs.rmSync(report, { force: true })
  const proxy = await startProxyProcess(cfg, name, ruleId)
  let r, proxyExit
  try {
    r = run('npx', playwrightArgs(cfg, name, extra), { cwd: cfg.suite, env: { ...env, BASE_URL: `http://localhost:${cfg.port}`, PLAYWRIGHT_JSON_OUTPUT_NAME: report } })
  } finally {
    proxyExit = await stopProxyProcess(proxy)
  }
  fs.writeFileSync(path.join(cfg.raw, `${name}.playwright.txt`), r.out)
  const base = { name, exit: r.code, proxy: proxyExit, report }
  if (!fs.existsSync(report)) {
    log(`  ${name}: no report, exit ${r.code}`)
    return { ...base, noReport: `no Playwright report (${report}), exit ${r.code}: ${r.out.slice(-500)}`, errors: [], tests: {}, outside: attribute({ tests: {} }, [], []).outside }
  }
  const rep = readReport(report)
  const { tests, outside } = attribute(rep, readWindows(report), readEvents(proxy.logFile))
  const list = Object.values(tests)
  log(`  ${name}: ${list.filter(t => t.passed).length}/${list.length} tests passed, exit ${r.code}, ` +
    `browser requests ${list.reduce((n, t) => n + t.browserRequests, 0)}, changed responses ${list.reduce((n, t) => n + t.changes.length, 0)}`)
  return { ...base, errors: rep.errors, tests, outside }
}

// The reasons why a suite run is not valid (see "Invalid run" in the header). passKeys: the tests of the passthrough.
export function runProblems (res, passKeys = null) {
  const problems = []
  if (res.noReport) problems.push(res.noReport)
  else if (![0, 1].includes(res.exit)) problems.push(`Playwright exit ${res.exit}${res.exit === 130 ? ' (interrupted)' : ''}`)
  problems.push(...res.errors.map(e => `report error: ${e}`))
  for (const k of passKeys ?? []) if (!res.noReport && !res.tests[k]) problems.push(`${k}: not in the report`)
  for (const [k, t] of Object.entries(res.tests)) {
    if (t.statuses.length === 0 || !t.statuses.every(s => RAN.has(s))) problems.push(`${k}: ${t.statuses.join(',') || 'no result'} (the test did not run to the end)`)
  }
  const errors = [...Object.values(res.tests).flatMap(t => t.errors), ...res.outside.errors]
  if (errors.length) problems.push(`${errors.length} proxy errors (the app did not answer), first: ${errors.slice(0, SAMPLE).join('; ')}`)
  const p = res.proxy
  if (p && (p.early || p.code !== 0 || p.signal)) problems.push(`the proxy ${p.early ? 'stopped during the run' : 'did not exit clean'}: code ${p.code}, signal ${p.signal}`)
  return problems
}

export function passthroughProblems (pass) {
  const problems = runProblems(pass)
  if (!pass.noReport && Object.keys(pass.tests).length === 0) problems.push('the report has no tests')
  for (const [k, t] of Object.entries(pass.tests)) {
    if (!t.statuses.length || !t.statuses.every(s => RAN.has(s))) continue // runProblems gives it
    if (!t.passed) problems.push(`${k}: ${t.statuses.join(',')} with no rule. The proxy breaks the app, or the test is not stable.`)
    else if (t.browserRequests === 0) problems.push(`${k}: no browser HTTP request went through the proxy. The test goes around BASE_URL.`)
  }
  return problems
}

// stable: the set of test keys that passed each recheck run, or null when there is no recheck.
export function verdict (tests, stable = null) {
  const fired = Object.entries(tests).filter(([, t]) => t.changes.length > 0)
  if (fired.length === 0) return 'not exercised'
  return fired.some(([k, t]) => !t.passed && (!stable || stable.has(k))) ? 'caught' : 'survived'
}

// The result of the recheck run for ruleRow: { runs, stable (Set of test keys), problems }, or null for no recheck.
export function recheckResult (res, runs, passKeys) {
  const stable = new Set(Object.entries(res.tests).filter(([, t]) => passedAll(t) && t.statuses.length === runs).map(([k]) => k))
  return { runs, stable, problems: runProblems(res, passKeys) }
}

export function ruleRow (rule, res, passKeys, recheck = null) {
  const entries = Object.entries(res.tests)
  const problems = runProblems(res, passKeys)
  const firedFailed = entries.some(([, t]) => t.changes.length > 0 && !t.passed)
  if (firedFailed && recheck?.problems.length) problems.push(`the recheck run is not valid: ${recheck.problems.join('; ')}`)
  const stable = recheck && !recheck.problems.length ? recheck.stable : null
  const all = [...entries.map(([, t]) => t), res.outside]
  return {
    id: rule.id,
    what: rule.what,
    method: rule.method ?? 'any',
    path: rule.path,
    field: rule.field,
    op: rule.op,
    value: rule.value,
    verdict: problems.length ? 'invalid' : verdict(res.tests, stable),
    problems,
    fired: entries.filter(([, t]) => t.changes.length > 0).map(([test, t]) => ({
      test, tc: t.tc, passed: t.passed, statuses: t.statuses, stableInRecheck: t.passed || !stable ? null : stable.has(test),
      changedResponses: t.changes.length,
      sample: t.changes.slice(0, SAMPLE).map(c => ({ ...c, changes: c.changes.slice(0, SAMPLE), changedFields: c.changes.length }))
    })),
    noise: entries.filter(([, t]) => !t.passed && t.changes.length === 0).map(([k, t]) => `${k} [${t.statuses.join(',')}]`),
    skips: all.reduce((n, t) => n + t.skips, 0),
    skipReasons: [...new Set(all.flatMap(t => t.skipReasons))].slice(0, SAMPLE),
    changesOutsideTests: res.outside.changes.length,
    exit: res.exit,
    proxyExit: res.proxy ?? null
  }
}

// Runs the passthrough, each rule and the recheck. restartApp() gives a fresh app. checkStop() throws after a stop
// signal; the audit calls it after each suite run, so a stopped run never gets a verdict.
export async function audit (cfg, { restartApp, checkStop }) {
  restartApp()
  log('passthrough run: the proxy with no rule')
  const pass = await suiteRun(cfg, 'passthrough', null)
  checkStop()
  const problems = passthroughProblems(pass)
  if (problems.length) throw new Error(`the run with no rule failed, so no rule ran:\n  ${problems.join('\n  ')}\nReport: ${pass.report}`)
  const passKeys = Object.keys(pass.tests)
  const runs = []
  for (const rule of cfg.rules) {
    checkStop()
    log(`rule ${rule.id}: ${rule.what}`)
    restartApp()
    const res = await suiteRun(cfg, ruleRunName(rule), rule.id)
    checkStop()
    const fired = Object.values(res.tests).filter(t => t.changes.length > 0)
    log(`  fired in ${fired.length} tests, ${fired.filter(t => !t.passed).length} of them failed${runProblems(res, passKeys).length ? '; the run is not valid' : ''}`)
    runs.push({ rule, res })
  }
  const needRecheck = cfg.recheck > 0 && runs.some(({ res }) => Object.values(res.tests).some(t => t.changes.length > 0 && !t.passed))
  let recheck = null
  if (needRecheck) {
    log(`recheck: ${cfg.recheck} more runs of the suite with no rule`)
    restartApp()
    const res = await suiteRun(cfg, 'recheck', null, [`--repeat-each=${cfg.recheck}`])
    checkStop()
    recheck = recheckResult(res, cfg.recheck, passKeys)
  }
  const rows = runs.map(({ rule, res }) => ruleRow(rule, res, passKeys, recheck))
  for (const r of rows) log(`  ${r.id}: ${r.verdict}`)
  return {
    passthrough: {
      tests: passKeys.length,
      browserRequests: Object.values(pass.tests).reduce((n, t) => n + t.browserRequests, 0),
      browserRequestsByTest: Object.fromEntries(Object.entries(pass.tests).map(([k, t]) => [k, t.browserRequests]))
    },
    recheck: recheck && { runs: recheck.runs, stable: [...recheck.stable], problems: recheck.problems },
    rules: rows
  }
}

function suiteId (suite) {
  const commit = run('git', ['-C', suite, 'rev-parse', 'HEAD'])
  const tags = run('git', ['-C', suite, 'tag', '--points-at', 'HEAD'])
  return { commit: commit.code === 0 ? commit.out.trim() : 'unknown', tags: tags.code === 0 ? tags.out.split('\n').filter(Boolean) : [] }
}

const oldResults = cfg => [cfg.raw, path.join(RESULTS, `${cfg.out}.json`)].filter(f => fs.existsSync(f))

function printPlan (cfg, id, sha) {
  const pwCmd = (name, extra) => `BASE_URL=http://localhost:${cfg.port} npx ${playwrightArgs(cfg, name, extra).join(' ')}`
  log(`suite ${cfg.label}: ${cfg.suite} at ${id.commit.slice(0, 12)}${id.tags.length ? ` (tags ${id.tags.join(', ')})` : ''}`)
  log(`rules: ${cfg.rulesFile}, sha256 ${sha}, ${cfg.rules.length} selected: ${cfg.rules.map(r => r.id).join(' ')}`)
  log(`proxy: :${cfg.port} to ${cfg.target}, scope browser. Results: ${path.join(RESULTS, cfg.out)}.{json,md}, raw files in ${cfg.raw}/`)
  for (const f of oldResults(cfg)) log(`warning: ${f} exists. A real run stops; give a new --out or remove the old results.`)
  const n = cfg.rules.length
  console.log([
    '  1. check that juice-shop/ is clean and that the results do not exist; restart the app without a build',
    `  2. passthrough: proxy with no rule${cfg.capture ? `, --capture ${captureFile(cfg, 'passthrough')}` : ''}; ${pwCmd('passthrough')}`,
    ...cfg.rules.map((r, i) => `  ${i + 3}. ${r.id} (${r.what}): restart the app; proxy --rule ${r.id}; the same suite run, raw files ${ruleRunName(r)}.*`),
    cfg.recheck > 0
      ? `  ${n + 3}. only when a test failed where its rule fired: restart the app; proxy with no rule; ${pwCmd('recheck', [`--repeat-each=${cfg.recheck}`])}`
      : `  ${n + 3}. no recheck (--recheck 0): each fired test that failed is a catch`,
    `  ${n + 4}. write ${cfg.out}.json and ${cfg.out}.md; stop the app`
  ].join('\n'))
}

const cell = s => String(s).replaceAll('|', '\\|')
const showValue = v => JSON.stringify(v)
const firedResult = f => f.passed ? 'passed' : `${f.statuses.join(',')}${f.stableInRecheck === false ? ', not stable in the recheck' : ''}`

export function markdown (out) {
  const s = out.summary
  const survived = out.rules.filter(r => r.verdict === 'survived')
  const invalid = out.rules.filter(r => r.verdict === 'invalid')
  const notChanged = out.rules.filter(r => r.verdict === 'not exercised' && r.skips > 0)
  const noisy = out.rules.filter(r => r.verdict !== 'invalid' && r.noise.length)
  const recheck = out.recheck
    ? `Recheck: ${out.recheck.runs} more runs with no rule. A failed test is a catch only when it passed each recheck run.`
    : `Recheck: ${out.recheckRuns > 0 ? 'not necessary (no test failed where its rule fired)' : 'off (--recheck 0)'}.`
  return [
    `# Tamper audit (${out.out})`,
    '',
    `Source: \`bench/run-audit-tamper.mjs\`, ${out.generatedAt}.`,
    `Suite ${out.suite.label}: \`${out.suite.path}\`, commit ${out.suite.commit.slice(0, 12)}${out.suite.tags.length ? `, tags ${out.suite.tags.join(', ')}` : ''}.`,
    `Rules: \`${out.rulesFile}\`, sha256 \`${out.rulesSha256}\`. The proxy changes only the responses to browser requests.`,
    `Run with no rule: ${out.passthrough.tests} tests passed, ${out.passthrough.browserRequests} browser requests went through the proxy.`,
    recheck,
    '',
    '| Rule | Changed value | Verdict | Tests where it fired | Of them failed | Matched, not changed |',
    '|---|---|---|---|---|---|',
    ...out.rules.map(r => `| ${cell(r.id)} | ${cell(r.what)} | ${r.verdict} | ${r.fired.length} | ${r.fired.filter(f => !f.passed).length} | ${r.skips} |`),
    '',
    `Rules: ${s.rules}. Caught: ${s.caught}. Survived: ${s.survived}. Not exercised: ${s.notExercised}. Invalid: ${s.invalid}.`,
    ...(invalid.length ? ['', '## Invalid runs', '', 'These rules have no verdict. Run them again with --only and a new --out.', ''] : []),
    ...invalid.map(r => `- ${cell(r.id)}: ${r.problems.map(cell).join('; ')}`),
    ...(notChanged.length ? ['', '## Matched, not changed', '', 'The browser got responses that match these rules, but the rule changed no value. Check the field and the op.', ''] : []),
    ...notChanged.map(r => `- ${cell(r.id)}: ${r.skips} responses, field \`${r.field}\`, op ${r.op}. Reasons: ${r.skipReasons.map(cell).join('; ')}`),
    ...(survived.length ? ['', '## Survived rules', '', 'No test caught these changed values.'] : []),
    ...survived.flatMap(r => [
      '',
      `### ${r.id}: ${r.what}`,
      '',
      `Change: \`${r.op} ${showValue(r.value)}\` on \`${r.field}\`, method ${r.method}, path \`${r.path}\`.`,
      '',
      '| Test | TC | Result | Changed responses | First change |',
      '|---|---|---|---|---|',
      ...r.fired.map(f => {
        const c = f.sample[0]?.changes[0]
        return `| \`${cell(f.test)}\` | ${f.tc ?? ''} | ${cell(firedResult(f))} | ${f.changedResponses} | ${c ? cell(`${f.sample[0].method} ${f.sample[0].path}: ${c.field} ${showValue(c.old)} to ${showValue(c.new)}`) : ''} |`
      })
    ]),
    ...(noisy.length ? ['', '## Noise', '', 'These tests failed where the rule did not fire. They do not change the verdict.', ''] : []),
    ...noisy.map(r => `- ${cell(r.id)}: ${r.noise.map(cell).join('; ')}`),
    ''
  ].join('\n')
}

export function summary (rules) {
  const count = v => rules.filter(r => r.verdict === v).length
  return { rules: rules.length, caught: count('caught'), survived: count('survived'), notExercised: count('not exercised'), invalid: count('invalid') }
}

async function main () {
  if (process.argv.includes('--help')) return console.log(usage(import.meta.url))
  const cfg = readArgs()
  const id = suiteId(cfg.suite)
  const sha = crypto.createHash('sha256').update(fs.readFileSync(cfg.rulesFile)).digest('hex')
  printPlan(cfg, id, sha)
  if (process.argv.includes('--dry')) return log('dry run: no app, no proxy, no suite run')
  if (!appTreeIsClean()) throw new Error('juice-shop/ has changes. Revert them before this run.')
  const old = oldResults(cfg)
  if (old.length) throw new Error(`${old.join(' and ')} exists. Give a new --out, or remove the old results first.`)
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopSignal = signal })
  const checkStop = () => { if (stopSignal) throw new Error(`stopped by ${stopSignal}. No results are written.`) }

  let result
  try {
    stopApp()
    result = await audit(cfg, { restartApp: () => { stopApp(); startApp(false) }, checkStop })
  } finally {
    try { log(stopApp()) } catch (e) { log(`warning: ${e.message}`) }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    out: cfg.out,
    suite: { label: cfg.label, path: cfg.suite, ...id },
    rulesFile: cfg.rulesFile,
    rulesSha256: sha,
    proxy: { port: cfg.port, target: cfg.target, scope: 'browser' },
    command: `BASE_URL=http://localhost:${cfg.port} npx ${playwrightArgs(cfg, '<run>').join(' ')}`,
    recheckRuns: cfg.recheck,
    ...result,
    summary: summary(result.rules)
  }
  const md = markdown(out)
  fs.writeFileSync(path.join(RESULTS, `${cfg.out}.json`), JSON.stringify(out, null, 2) + '\n')
  fs.writeFileSync(path.join(RESULTS, `${cfg.out}.md`), md)
  console.log('\n' + md)
  if (out.summary.invalid) {
    console.error(`error: ${out.summary.invalid} rule runs are not valid: ${result.rules.filter(r => r.verdict === 'invalid').map(r => r.id).join(', ')}. See ${cfg.out}.md.`)
    process.exitCode = 1
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main().catch(e => {
    console.error(`error: ${e.message}`)
    process.exit(1)
  })
}
