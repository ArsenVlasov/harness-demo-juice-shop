#!/usr/bin/env node
// E5b of plan v2: how many tests a UI change breaks, and what the repair by an agent costs.
//
//   node bench/run-ui-change.mjs --suite A=<path>[@<ref>] --suite B=<path>[@<ref>]   all patches of sealed-ui/ as one UI release
//   node bench/run-ui-change.mjs --suite A=<path> --mode each                         one patch at a time, with a revert after each patch
//   node bench/run-ui-change.mjs --suite A=<path> --suite B=<path> --repair --budget <usd> [--model <id>]
//                                                                                     also the repair by an agent. It costs money
//   node bench/run-ui-change.mjs ... --repeats <n>                                    runs of each test on each app state, 1 to 5 (default 3)
//   node bench/run-ui-change.mjs ... --patches <dir> --out <name>                     other patch folder (default sealed-ui/), output name (default ui-change)
//   node bench/run-ui-change.mjs ... --dry                                            print the steps and the problems, change nothing
//
// <label> is a short name for file names (A, B, A-vague-2). <path> is a suite folder with its own git repo. <ref> is HEAD by default.
// The suite runs in its folder. Thus HEAD of the suite must be <ref>, and the tracked files of the suite must have no changes.
// Each suite run is one Playwright run with --repeat-each=<repeats> on a fresh start of the app. More than 5 runs on one
// start can empty the stock of a product (see bench/run-flaky.mjs).
// A broken test passes in all runs on the clean app and fails in all runs on the app with the change. An unstable test
// passes in all runs on the clean app and fails only in some runs with the change. An unstable test is not broken.
// The patches go in file-name order. The frontend gets a rebuild (npm run build:frontend, slow) before the clean runs,
// after git apply and in the revert.
// The marker juice-shop/.ui-change-active.json exists from the first git apply to the end of the revert. Thus juice-shop/
// is not clean for the other bench scripts (appTreeIsClean) during the measure, and also after a stop before the end of
// the revert. The marker gives the positions of the applied patches in file-name order, and no patch name. When the
// marker exists at the start, the script stops and prints the steps of the revert.
// The revert is in a finally block. Ctrl-C, SIGTERM and SIGHUP stop the script after the current step, then the revert
// runs to its end. A signal to this process only does not stop the child process of the current step, with one
// exception: the script sends the signal on to claude-locked.sh, and its trap stops claude.
// --repair (mode together only), for each suite with broken tests. A suite with no broken tests gets no repair.
//   1. git clone --no-local into RUNS/maintenance/<out>/<label>: <ref> on a branch main, no origin, core.hooksPath as in the suite.
//      node_modules as in bench/run-generation.sh: npm ci --offline, else cp -Rp from the suite.
//   2. Before the first repair, git apply -R puts back the source of juice-shop/. The build keeps the change, because the
//      server serves frontend/dist. Thus the agent sees the changed UI, but no diff in juice-shop/. For this reason,
//      --repair accepts only patches that change files under frontend/src/.
//   3. bench/claude-locked.sh with bench/prompt-repair.txt in the copy. The cost comes from bench/results/<out>-<label>-repair.json.
//      The work time is the wall time of claude-locked.sh. When there is no bench/results/<tag>.meta after it, the repair
//      did not start, and the script stops before the next paid step.
//   4. A suite run in the copy on the app with the change. git diff <ref> in the copy gives the changed files. The
//      assertion counts and weakening() of bench/weakening.mjs use only the code files of the diff (CODE_PATHSPEC).
// Output: bench/results/<out>.json and <out>.md. Raw reports and diffs: bench/results/<out>/. The script writes the
// output with "status": "incomplete" after each repair, and after an error that comes after a repair.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_DIR, LAB, RESULTS, RUNS, appTreeIsClean, env, log, must, opt, passedAll, readReport, run, startApp, stopApp } from './lib.mjs'
import { assertionCounts, valueCheckCounts, weakening } from './weakening.mjs'

const CLAUDE_LOCKED = path.join(LAB, 'bench', 'claude-locked.sh')
const PROMPT_FILE = path.join(LAB, 'bench', 'prompt-repair.txt')
// RUN_UI_CHANGE_MARKER: another path of the marker, only for a test of this script.
const MARKER = process.env.RUN_UI_CHANGE_MARKER || path.join(APP_DIR, '.ui-change-active.json')
const BIG = { maxBuffer: 64 * 1024 * 1024 }
const REPAIR_TIMEOUT_MS = 4 * 60 * 60 * 1000
const NO_LOCKS = { env: { ...env, GIT_OPTIONAL_LOCKS: '0' } } // git status must not write the index of a suite
const NOT_LOGS = ':(exclude).playwright-mcp'
// The code files of a suite for weakening() and the counts. Not Markdown (a bug report can quote a check), not the
// harness (.claude/, .githooks/, scripts/) and not the browser logs of the MCP server.
export const CODE_PATHSPEC = ['*.ts', '*.tsx', '*.js', '*.mjs', '*.cjs', 'package.json', NOT_LOGS, ':(exclude).claude', ':(exclude).githooks', ':(exclude)scripts']
const BUDGET = /^[0-9]+([.][0-9]+)?$/ // the same check as bench/claude-locked.sh
const SIGNALS = { SIGHUP: 129, SIGINT: 130, SIGTERM: 143 }
const STOP_CODES = [-1, ...Object.values(SIGNALS)] // -1: a signal or the time limit of run() stopped the child
const ISOLATION = 'Before the first repair, git apply -R put back the source of juice-shop/. The build (frontend/dist, build/) kept the change, so the app showed the change, but juice-shop/ had no diff.'

// ---- pure parts, tested in bench/test/run-ui-change.test.mjs ----

/** "<label>=<path>[@<ref>]" -> { label, path, ref }. A path with "@" in it is not supported. */
export function parseSuite (arg) {
  const m = /^([A-Za-z0-9_-]+)=(.+)$/.exec(arg ?? '')
  if (!m) throw new Error(`--suite needs <label>=<path>[@<ref>], got "${arg}"`)
  const at = m[2].lastIndexOf('@')
  const [dir, ref] = at > 0 ? [m[2].slice(0, at), m[2].slice(at + 1)] : [m[2], 'HEAD']
  if (!ref) throw new Error(`--suite ${arg}: the ref after "@" is empty`)
  return { label: m[1], path: path.resolve(dir.replace(/^~(?=\/)/, os.homedir())), ref }
}

/** The .patch files of a folder in file-name order (code point order: use a two-digit prefix). */
export const patchOrder = files => files.filter(f => f.endsWith('.patch')).sort()

/** Mode together: one change with all patches. Mode each: one change for each patch. */
export const changes = (patches, mode) => mode === 'each'
  ? patches.map(p => ({ id: p.replace(/\.patch$/, ''), patches: [p] }))
  : [{ id: 'all', patches }]

// A test that is not in a report did not pass. All statuses of a test are the runs of --repeat-each.
const failedAll = t => !t || t.statuses.every(s => s !== 'passed')
const mixed = t => !passedAll(t) && !failedAll(t)
const greenKeys = rep => Object.keys(rep.tests).filter(k => passedAll(rep.tests[k]))

/** Two flattened reports of readReport(): the clean runs and the runs with the change. */
export function brokenTests (clean, patched) {
  const green = greenKeys(clean)
  return {
    tests: Object.keys(clean.tests).length,
    green: green.length,
    redOnClean: Object.keys(clean.tests).filter(k => !passedAll(clean.tests[k])),
    broken: green.filter(k => failedAll(patched.tests[k])),
    unstable: green.filter(k => mixed(patched.tests[k]))
  }
}

/** The runs of the repair copy against the clean runs and the broken tests. */
export function repairOutcome (clean, broken, after) {
  const green = greenKeys(clean)
  const keys = Object.keys(after.tests)
  const has = k => k in after.tests
  return {
    brokenBefore: broken.length,
    tests: keys.length,
    passed: keys.filter(k => passedAll(after.tests[k])).length,
    repaired: broken.filter(k => passedAll(after.tests[k])),
    stillBroken: broken.filter(k => has(k) && failedAll(after.tests[k])),
    unstable: green.filter(k => has(k) && mixed(after.tests[k])),
    newRed: green.filter(k => !broken.includes(k) && has(k) && failedAll(after.tests[k])),
    missing: green.filter(k => !has(k)),
    newTests: keys.filter(k => !(k in clean.tests))
  }
}

/** The steps of a revert by hand, from the marker of a run that did not end its revert. */
export function recoverySteps (marker, patchFiles, appDir = APP_DIR, markerFile = MARKER) {
  const files = [...(marker.applied ?? [])].reverse().map(n => path.join(marker.patchesDir ?? '', patchFiles[n - 1] ?? `<patch ${n} in file-name order>`))
  const q = s => `'${s}'`
  return [
    `1. When git -C ${q(appDir)} status shows changes other than ${path.basename(markerFile)}, revert the patches in this order: ${files.map(f => `git -C ${q(appDir)} apply -R ${q(f)}`).join(' && ') || 'none'}`,
    `2. Rebuild: cd ${q(appDir)} && npm run build:frontend && npm run build:server`,
    `3. Remove the marker: rm ${q(markerFile)}`
  ]
}

const cell = s => String(s).replace(/\|/g, '\\|').replace(/`/g, "'")
const codeList = (xs, sep = ', ') => xs?.length ? xs.map(x => `\`${cell(x)}\``).join(sep) : 'none'
const pair = c => c ? `${c.added} / ${c.removed}` : '-'

function repairRow (s, r) {
  if (r.status === 'skipped') return `| ${s} | 0 | 0.0 | no repair: ${r.reason} | - | - | - | - | - | - | - |`
  const time = r.wallSeconds == null ? '-' : (r.wallSeconds / 60).toFixed(1)
  const head = `| ${s} | ${r.costUsd ?? 'unknown'} | ${time} |`
  if (!r.repaired) return `${head} ${r.status} | - | - | - | - | - | - | - |`
  return `${head} ${r.repaired.length} of ${r.brokenBefore} | ${r.stillBroken.length} | ${r.unstable.length} | ${r.newRed.length} | ${r.missing.length} | ${pair(r.assertions)} | ${pair(r.valueChecks)} | ${r.weakening.length} |`
}

function repairDetails (s, r) {
  if (!r.repaired) return [`### Suite ${s}`, '', `- Status: ${r.status}${r.reason ? `: ${r.reason}` : ''}.`, '']
  return [
    `### Suite ${s}`,
    '',
    `- Copy: \`${cell(r.copy)}\`. node_modules: ${r.nodeModules}. Tag: \`${r.tag}\`. Exit code of claude-locked.sh: ${r.exit}${r.subtype ? ` (${r.subtype})` : ''}. Session: ${r.sessionId ? `\`${r.sessionId}\`` : 'unknown'}.`,
    `- After the repair, ${r.passed} of ${r.tests} tests pass in all runs on the app with the change.`,
    `- Still broken: ${codeList(r.stillBroken)}.`,
    `- Unstable: ${codeList(r.unstable)}.`,
    `- New red: ${codeList(r.newRed)}.`,
    `- Missing: ${codeList(r.missing)}.`,
    `- New tests: ${codeList(r.newTests)}.`,
    `- Changed files: ${codeList(r.changedFiles)}.`,
    `- Diff: \`${r.diffFile}\`. Code part of the diff: \`${r.codeDiffFile}\`.`,
    '',
    ...(r.weakening.length ? ['Weakening findings:', '', '```text', ...r.weakening, '```', ''] : ['Weakening findings: none.', ''])
  ]
}

export function renderMarkdown (out) {
  const rows = out.changes.flatMap(c => Object.entries(c.suites).filter(([, v]) => v).map(([s, v]) => ({ id: c.id, s, v })))
  const md = [
    `# UI change and repair (${out.out})`,
    '',
    `Source: \`bench/run-ui-change.mjs\`, ${out.generatedAt}. Status: ${out.status}${out.error ? `. Error: ${cell(out.error)}` : ''}.`,
    `Mode: ${out.mode}. Runs of each test on each app state: ${out.repeats}. Patches in the order of application: ${codeList(out.patches)}.`,
    '',
    '| Suite | Path | Ref | Commit |',
    '|---|---|---|---|',
    ...out.suites.map(s => `| ${s.label} | \`${cell(s.path)}\` | \`${cell(s.ref)}\` | \`${s.sha.slice(0, 12)}\` |`),
    '',
    'A broken test passes in all runs on the clean app and fails in all runs on the app with the change.',
    'An unstable test passes in all runs on the clean app and fails only in some runs with the change. An unstable test is not broken.',
    '',
    '| Change | Suite | Tests | Green on the clean app | Broken | Unstable |',
    '|---|---|---|---|---|---|',
    ...rows.map(({ id, s, v }) => `| ${id} | ${s} | ${v.tests} | ${v.green} | ${v.broken.length} | ${v.unstable.length} |`),
    '',
    '| Change | Suite | Broken tests | Unstable tests |',
    '|---|---|---|---|',
    ...rows.map(({ id, s, v }) => `| ${id} | ${s} | ${codeList(v.broken, '<br>')} | ${codeList(v.unstable, '<br>')} |`),
    ''
  ]
  if (!out.repair) return md.join('\n')
  const reps = Object.entries(out.repair.suites)
  md.push(
    '## Repair',
    '',
    `Prompt: \`${out.repair.promptFile}\`. Model: \`${out.repair.model}\`. Budget: ${out.repair.budget ? `${out.repair.budget} USD` : 'the default of claude-locked.sh'}.`,
    `Isolation: ${out.repair.isolation}`,
    'The work time is the wall time of `bench/claude-locked.sh`. A suite with no broken tests gets no repair.',
    'A missing test passes on the clean app, but the copy does not have it after the repair.',
    '',
    'The assertion calls, the value checks and the weakening findings come from `bench/weakening.mjs` on the code files of the diff.',
    'They are pattern and count checks. Thus also read the diff. These checks do not find a check in a try/catch block.',
    'They also do not find a helper that does not check, or a locator that finds a different element.',
    'Do not compare the counts of two suites: `expect(x).toHaveText(t)` is 2 calls, and a wrapper call such as `expectText(x, t)` is 1 call.',
    '',
    '| Suite | Cost, USD | Work time, min | Repaired | Still broken | Unstable | New red | Missing | Assertion calls added / removed | Value checks added / removed | Weakening findings |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...reps.map(([s, r]) => repairRow(s, r)),
    ''
  )
  for (const [s, r] of reps) md.push(...repairDetails(s, r))
  return md.join('\n')
}

// ---- steps with side effects ----

let DRY = false
let STOP = null // the first signal
let REVERTING = false // the revert goes on after a signal
let CHILD = null // the child process of runAsync(). A signal goes on to it
const rel = p => path.relative(LAB, p).startsWith('..') ? p : path.relative(LAB, p)
const seconds = t0 => Math.round((Date.now() - t0) / 1000)
const repairDir = (o, s) => path.join(RUNS, 'maintenance', o.out, s.label)
const repairTag = (o, s) => `${o.out}-${s.label}-repair`
const tick = () => new Promise(resolve => setImmediate(resolve))

// Logs the step and runs it. On --dry it only logs and returns null. The signal listeners run during tick(),
// so a signal stops the script before the next step, except in the revert.
async function step (what, fn) {
  await tick()
  if (STOP && !REVERTING) throw new Error(`stopped by ${STOP}`)
  log(DRY ? `[dry] ${what}` : what)
  return DRY ? null : fn()
}

function stopped (r, what) {
  if (STOP_CODES.includes(r.code)) throw new Error(`${what} stopped (exit ${r.code}): a signal or the time limit`)
}

// As run() of lib.mjs, but the event loop runs, so a signal listener can send the signal on to the child.
function runAsync (cmd, args, { timeout, ...opts }) {
  return new Promise(resolve => {
    let out = ''
    const child = spawn(cmd, args, { env, ...opts })
    const timer = setTimeout(() => child.kill('SIGTERM'), timeout)
    const done = code => { clearTimeout(timer); CHILD = null; resolve({ code, out }) }
    CHILD = child
    child.stdout.on('data', d => { out += d })
    child.stderr.on('data', d => { out += d })
    child.on('error', e => { out += e.message; done(-1) })
    child.on('close', code => done(code ?? -1))
  })
}

function readJson (file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return null }
}

function isExecutable (file) {
  try { fs.accessSync(file, fs.constants.X_OK); return true } catch { return false }
}

// The changes in juice-shop/ other than the marker.
const treeChanges = () => must('git', ['-C', APP_DIR, 'status', '--porcelain'], NO_LOCKS).split('\n').filter(l => l && !l.endsWith(path.basename(MARKER)))

function writeMarker (o, st) {
  const marker = {
    note: 'bench/run-ui-change.mjs measures a UI change. juice-shop/ or its build is not clean until the end of its revert.',
    out: o.out,
    pid: process.pid,
    startedAt: st.startedAt,
    patchesDir: o.patches,
    applied: st.positions
  }
  fs.writeFileSync(MARKER, JSON.stringify(marker, null, 2) + '\n')
}

function writeOut (o, out, t0, status) {
  Object.assign(out, { status, generatedAt: new Date().toISOString(), wallSeconds: seconds(t0) })
  fs.writeFileSync(path.join(RESULTS, `${o.out}.json`), JSON.stringify(out, null, 2) + '\n')
  fs.writeFileSync(path.join(RESULTS, `${o.out}.md`), renderMarkdown(out))
}

const rebuild = why => step(`rebuild juice-shop/ (${why}): npm run build:frontend, npm run build:server`, () => {
  const t0 = Date.now()
  must('npm', ['run', '--silent', 'build:frontend'], { cwd: APP_DIR, ...BIG })
  must('npm', ['run', '--silent', 'build:server'], { cwd: APP_DIR, ...BIG })
  log(`  rebuild done in ${seconds(t0)} s`)
})

// One Playwright run with --repeat-each on a fresh start of the app. Returns the flattened report, or null on --dry.
function suiteRun (o, label, dir, file) {
  return step(`restart the app, run suite ${label} in ${dir} (--repeat-each=${o.repeats}), report ${rel(file)}`, () => {
    fs.rmSync(file, { force: true })
    stopApp()
    startApp(false)
    const r = run('npx', ['playwright', 'test', '--retries=0', `--repeat-each=${o.repeats}`, '--reporter=json'], { cwd: dir, env: { ...env, PLAYWRIGHT_JSON_OUTPUT_NAME: file }, ...BIG })
    stopApp()
    stopped(r, `suite ${label}`)
    if (!fs.existsSync(file)) throw new Error(`no report from suite ${label} (${file}), exit ${r.code}:\n${r.out.slice(-2000)}`)
    const rep = readReport(file)
    const all = Object.values(rep.tests)
    if (all.some(t => t.statuses.includes('interrupted'))) throw new Error(`the run of suite ${label} was interrupted`)
    log(`  suite ${label}: ${all.filter(passedAll).length} of ${all.length} tests passed in all runs, exit ${r.code}${rep.errors.length ? `, errors: ${rep.errors.join(' | ')}` : ''}`)
    return rep
  })
}

// As bench/run-generation.sh: npm ci --offline, else a copy of node_modules from the suite. The copy is at HEAD of the
// suite, and the suite has no changes in tracked files, so the two package-lock.json files are the same.
function installNodeModules (s, copy) {
  const r = run('npm', ['ci', '--offline', '--no-audit', '--no-fund'], { cwd: copy, ...BIG })
  stopped(r, 'npm ci')
  let method = 'npm ci --offline'
  if (r.code !== 0) {
    log(`  npm ci --offline failed (exit ${r.code}): ${r.out.split('\n').find(l => /err/i.test(l)) ?? ''}`)
    fs.rmSync(path.join(copy, 'node_modules'), { recursive: true, force: true })
    must('cp', ['-Rp', path.join(s.path, 'node_modules'), path.join(copy, 'node_modules')])
    method = `cp -Rp from ${s.path}/node_modules`
  }
  if (run('git', ['-C', copy, 'status', '--porcelain']).out.trim()) throw new Error(`${copy} has changes after the install of node_modules`)
  log(`  node_modules: ${method}`)
  return method
}

// Puts back the source of juice-shop/ for the repair. The build keeps the change.
async function revertSource (st) {
  while (st.inSource.length) {
    const f = st.inSource.at(-1)
    await step(`git apply -R ${rel(f)} (the build keeps the change for the repair)`, () => must('git', ['-C', APP_DIR, 'apply', '-R', f]))
    st.inSource.pop()
  }
  await step(`check that the source of juice-shop/ has no changes other than the marker`, () => {
    const left = treeChanges()
    if (left.length) throw new Error(`juice-shop/ has changes in ${left.length} paths after git apply -R`)
  })
}

async function repairSuite (o, s, clean, broken, raw, out) {
  const copy = repairDir(o, s)
  const tag = repairTag(o, s)
  const diffFile = path.join(raw, `repair-${s.label}.diff`)
  const codeDiffFile = path.join(raw, `repair-${s.label}.code.diff`)
  await step(`git clone --no-local ${s.path} ${copy}: ${s.ref} on a branch main, no origin${s.hooksPath ? `, core.hooksPath ${s.hooksPath}` : ''}`, () => {
    fs.mkdirSync(path.dirname(copy), { recursive: true })
    must('git', ['clone', '--quiet', '--no-local', '--no-hardlinks', s.path, copy])
    must('git', ['-C', copy, 'checkout', '--quiet', '-B', 'main', s.sha])
    must('git', ['-C', copy, 'remote', 'remove', 'origin'])
    if (s.hooksPath) must('git', ['-C', copy, 'config', 'core.hooksPath', s.hooksPath])
  })
  const nodeModules = await step(`install node_modules in ${copy}: npm ci --offline, else cp -Rp from the suite`, () => installNodeModules(s, copy))
  await step('restart the app with the change for the repair', () => { stopApp(); startApp(false) })
  const args = ['--dir', copy, '--prompt-file', PROMPT_FILE, '--model', o.model, '--tag', tag, ...(o.budget ? ['--budget', o.budget] : [])]
  const t0 = Date.now()
  const r = await step(`bench/claude-locked.sh ${args.join(' ')}`, () => runAsync(CLAUDE_LOCKED, args, { timeout: REPAIR_TIMEOUT_MS }))
  const rec = { status: 'not measured', copy, nodeModules, tag, exit: r?.code ?? null, wallSeconds: seconds(t0) }
  if (r) {
    log(`  claude-locked.sh exit ${r.code} after ${rec.wallSeconds} s: ${r.out.trim().split('\n').slice(-3).join(' | ')}`)
    if (!fs.existsSync(path.join(RESULTS, `${tag}.meta`))) {
      throw new Error(`claude-locked.sh exit ${r.code}, and there is no bench/results/${tag}.meta. The repair did not start (a check before the run failed, or a usage error), or its outputs stay in bench/.run/generation.lock/out. The script stops before the next paid step.\n${r.out.slice(-1500)}`)
    }
    const meta = readJson(path.join(RESULTS, `${tag}.json`))
    if (!meta) log(`warning: no bench/results/${tag}.json, so the cost is unknown`)
    Object.assign(rec, { costUsd: meta?.total_cost_usd ?? null, sessionId: meta?.session_id ?? null, turns: meta?.num_turns ?? null, subtype: meta?.subtype ?? null })
    out.repair.suites[s.label] = rec
    if (STOP_CODES.includes(r.code)) {
      rec.status = 'stopped'
      throw new Error(`claude-locked.sh stopped (exit ${r.code}): a signal or the time limit`)
    }
  }
  await step('stop the app', stopApp)
  const after = await suiteRun(o, `${s.label} (repair copy)`, copy, path.join(raw, `repaired-${s.label}.json`))
  const diff = await step(`git -C ${copy} diff ${s.ref}: save it in ${rel(diffFile)}, and its code part in ${rel(codeDiffFile)}`, () => {
    must('git', ['-C', copy, 'add', '--all', '--intent-to-add'])
    const gitDiff = (...spec) => must('git', ['-C', copy, 'diff', '--no-color', '--no-ext-diff', s.sha, '--', ...spec], BIG)
    const full = gitDiff('.', NOT_LOGS)
    const code = gitDiff(...CODE_PATHSPEC)
    fs.writeFileSync(diffFile, full ? `${full}\n` : '')
    fs.writeFileSync(codeDiffFile, code ? `${code}\n` : '')
    return { code, files: must('git', ['-C', copy, 'diff', '--name-only', s.sha, '--', '.', NOT_LOGS]).split('\n').filter(Boolean) }
  })
  if (DRY) return
  Object.assign(rec, { status: 'done' }, repairOutcome(clean, broken, after), {
    assertions: assertionCounts(diff.code),
    valueChecks: valueCheckCounts(diff.code),
    weakening: weakening(diff.code),
    changedFiles: diff.files,
    diffFile: rel(diffFile),
    codeDiffFile: rel(codeDiffFile)
  })
}

async function repairAll (o, st, result, clean, raw, out, t0) {
  for (const s of o.suites) {
    const broken = result.suites[s.label]?.broken ?? null // null on --dry: no run, so the steps of a repair show
    if (broken && broken.length === 0) {
      log(`suite ${s.label}: no broken tests, so no repair`)
      out.repair.suites[s.label] = { status: 'skipped', reason: 'no broken tests', costUsd: 0, brokenBefore: 0 }
      continue
    }
    if (st.inSource.length) await revertSource(st)
    await repairSuite(o, s, clean[s.label], broken ?? [], raw, out)
    if (!DRY) writeOut(o, out, t0, 'incomplete')
  }
}

async function revert (c, st) {
  REVERTING = true
  try {
    await step('stop the app', () => { try { stopApp() } catch (e) { log(`warning: ${e.message}`) } })
    while (st.inSource.length) {
      const f = st.inSource.at(-1)
      await step(`git apply -R ${rel(f)}`, () => must('git', ['-C', APP_DIR, 'apply', '-R', f]))
      st.inSource.pop()
    }
    if (st.positions.length) await rebuild(`revert of change ${c.id}`)
    await step(`remove the marker ${rel(MARKER)}`, () => fs.rmSync(MARKER, { force: true }))
    await step('check that juice-shop/ has no changes', () => {
      if (!appTreeIsClean()) throw new Error(`juice-shop/ has changes after the revert of change ${c.id}`)
    })
  } finally {
    REVERTING = false
  }
}

async function measureChange (o, c, clean, raw, out, t0) {
  // inSource: the applied patches in the source of juice-shop/. positions: all applied patches (the build has them).
  const st = { startedAt: new Date().toISOString(), inSource: [], positions: [] }
  log(`change ${c.id}: ${c.patches.join(' ')}`)
  try {
    await step(`write the marker ${rel(MARKER)}`, () => writeMarker(o, st))
    for (const p of c.patches) {
      const f = path.join(o.patches, p)
      const applied = await step(`git apply ${rel(f)}`, () => {
        must('git', ['-C', APP_DIR, 'apply', '--check', f])
        must('git', ['-C', APP_DIR, 'apply', f])
        return true
      })
      st.inSource.push(f)
      st.positions.push(o.patchFiles.indexOf(p) + 1)
      if (applied) writeMarker(o, st)
    }
    await rebuild(`change ${c.id}`)
    const result = { id: c.id, patches: c.patches, suites: {} }
    out.changes.push(result)
    for (const s of o.suites) {
      const patched = await suiteRun(o, s.label, s.path, path.join(raw, `${c.id}-${s.label}.json`))
      result.suites[s.label] = patched && { ...brokenTests(clean[s.label], patched), reportErrors: patched.errors }
    }
    if (o.repair) await repairAll(o, st, result, clean, raw, out, t0)
  } catch (e) {
    log(`error: ${e.message.split('\n')[0]}. The revert starts now.`)
    throw e
  } finally {
    await revert(c, st)
  }
}

// The paths that a patch changes (git apply --numstat), or null when git cannot read the patch.
function patchPaths (file) {
  const r = run('git', ['apply', '--numstat', file], { cwd: LAB })
  return r.code === 0 ? r.out.trim().split('\n').filter(Boolean).map(l => l.split('\t').slice(2).join('\t')) : null
}

// Read-only checks. On --dry the problems go to the log, else the first problem stops the script.
function preflight (o) {
  const problems = []
  if (fs.existsSync(MARKER)) {
    const m = readJson(MARKER) ?? {}
    const files = m.patchesDir && fs.existsSync(m.patchesDir) ? patchOrder(fs.readdirSync(m.patchesDir)) : []
    problems.push([`${MARKER} exists: a run (out ${m.out}, pid ${m.pid}, start ${m.startedAt}) did not end its revert. Check that no run is active, then do these steps:`, ...recoverySteps(m, files)].join('\n'))
  }
  if (!fs.existsSync(o.patches)) problems.push(`no patch folder ${o.patches}`)
  else if (o.patchFiles.length === 0) problems.push(`no .patch file in ${o.patches}`)
  if (o.repair) {
    o.patchFiles.forEach((p, i) => {
      const paths = patchPaths(path.join(o.patches, p))
      if (!paths) problems.push(`git apply --numstat cannot read ${p}`)
      else if (paths.some(f => !f.startsWith('frontend/src/'))) {
        problems.push(`--repair: patch ${i + 1} of ${o.patchFiles.length} changes ${paths.filter(f => !f.startsWith('frontend/src/')).length} files outside frontend/src/. During the repair only the build keeps the change, so the patches must change only frontend/src/`)
      }
    })
  }
  try { fs.accessSync(RESULTS, fs.constants.W_OK) } catch { problems.push('bench/results/ is not writable. A generation run can lock it') }
  if (fs.existsSync(path.join(RESULTS, `${o.out}.json`))) problems.push(`bench/results/${o.out}.json exists. Use another --out`)
  if (o.repair && !isExecutable(CLAUDE_LOCKED)) problems.push('no executable bench/claude-locked.sh')
  if (o.repair && !fs.existsSync(PROMPT_FILE)) problems.push('no bench/prompt-repair.txt')
  for (const s of o.suites) {
    if (!fs.existsSync(s.path)) { problems.push(`suite ${s.label}: no folder ${s.path}`); continue }
    const top = run('git', ['-C', s.path, 'rev-parse', '--show-toplevel'])
    if (top.code !== 0 || fs.realpathSync(top.out.trim()) !== fs.realpathSync(s.path)) {
      problems.push(`suite ${s.label}: ${s.path} is not the top folder of a git repo`)
      continue
    }
    const sha = run('git', ['-C', s.path, 'rev-parse', '--verify', '--quiet', `${s.ref}^{commit}`])
    if (sha.code !== 0) { problems.push(`suite ${s.label}: no commit ${s.ref} in ${s.path}`); continue }
    s.sha = sha.out.trim()
    if (run('git', ['-C', s.path, 'rev-parse', 'HEAD']).out.trim() !== s.sha) problems.push(`suite ${s.label}: HEAD of ${s.path} is not ${s.ref}`)
    if (run('git', ['-C', s.path, 'status', '--porcelain', '--untracked-files=no'], NO_LOCKS).out.trim()) problems.push(`suite ${s.label}: ${s.path} has changes in tracked files`)
    s.hooksPath = run('git', ['-C', s.path, 'config', '--get', 'core.hooksPath']).out.trim() || null
    if (o.repair && fs.existsSync(repairDir(o, s))) problems.push(`suite ${s.label}: ${repairDir(o, s)} exists`)
    if (o.repair && fs.existsSync(path.join(RESULTS, `${repairTag(o, s)}.json`))) problems.push(`suite ${s.label}: bench/results/${repairTag(o, s)}.json exists`)
  }
  return problems
}

function options (argv) {
  const o = {
    suites: argv.flatMap((a, i) => a === '--suite' ? [parseSuite(argv[i + 1])] : []),
    patches: path.resolve(opt('--patches', path.join(LAB, 'sealed-ui'))),
    mode: opt('--mode', 'together'),
    repeats: opt('--repeats', '3'),
    repair: argv.includes('--repair'),
    model: opt('--model', 'claude-opus-5-5'),
    budget: opt('--budget'),
    out: opt('--out', 'ui-change')
  }
  if (o.suites.length === 0) throw new Error('give at least one --suite <label>=<path>[@<ref>]')
  if (new Set(o.suites.map(s => s.label)).size !== o.suites.length) throw new Error('each --suite needs its own label')
  if (!['together', 'each'].includes(o.mode)) throw new Error(`--mode is together or each, not "${o.mode}"`)
  if (o.repair && o.mode === 'each') throw new Error('--repair works only with --mode together')
  if (!/^[1-5]$/.test(o.repeats)) throw new Error(`--repeats is a number from 1 to 5, not "${o.repeats}". More runs on one app start can empty the stock of a product`)
  o.repeats = Number(o.repeats)
  if (!/^[\w.-]+$/.test(o.out)) throw new Error(`--out "${o.out}" can have only letters, digits, ".", "_" and "-"`)
  if (o.budget !== undefined && !(BUDGET.test(o.budget) && Number(o.budget) > 0)) throw new Error(`--budget needs a positive number of USD such as 5 or 2.5, not "${o.budget}"`)
  o.patchFiles = fs.existsSync(o.patches) ? patchOrder(fs.readdirSync(o.patches)) : []
  return o
}

async function main () {
  const argv = process.argv.slice(2)
  DRY = argv.includes('--dry')
  const o = options(argv)
  log(`suites: ${o.suites.map(s => `${s.label}=${s.path}@${s.ref}`).join(' ')}. Mode: ${o.mode}, ${o.repeats} runs of each test${o.repair ? `, repair with ${o.model}` : ''}`)
  log(`patches in ${o.patches}: ${o.patchFiles.join(' ') || 'none'}`)
  const problems = preflight(o)
  if (problems.length && !DRY) throw new Error(problems.join('\n'))
  for (const p of problems) log(`problem: ${p}`)

  const t0 = Date.now()
  const raw = path.join(RESULTS, o.out)
  const clean = {}
  const out = {
    status: 'running',
    error: null,
    generatedAt: null,
    out: o.out,
    mode: o.mode,
    repeats: o.repeats,
    wallSeconds: null,
    patchesDir: o.patches,
    patches: o.patchFiles,
    suites: o.suites.map(({ label, path: p, ref, sha }) => ({ label, path: p, ref, sha })),
    changes: [],
    repair: o.repair ? { model: o.model, budget: o.budget ?? null, promptFile: rel(PROMPT_FILE), isolation: ISOLATION, suites: {} } : null
  }
  try {
    await step('check that juice-shop/ has no changes', () => {
      if (!appTreeIsClean()) throw new Error('juice-shop/ has changes. Revert them before this run.')
    })
    await step(`create ${rel(raw)}/`, () => fs.mkdirSync(raw, { recursive: true }))
    await step('stop the app', stopApp)
    await rebuild('clean')
    for (const s of o.suites) clean[s.label] = await suiteRun(o, s.label, s.path, path.join(raw, `clean-${s.label}.json`))
    for (const c of changes(o.patchFiles, o.mode)) await measureChange(o, c, clean, raw, out, t0)
  } catch (e) {
    // Keep the paid results: write the output when a repair ran.
    if (!DRY && Object.values(out.repair?.suites ?? {}).some(r => r.tag)) {
      out.error = e.message.split('\n')[0]
      writeOut(o, out, t0, 'incomplete')
      log(`the results so far are in bench/results/${o.out}.json and ${o.out}.md (status incomplete)`)
    }
    throw e
  }
  if (DRY) {
    log(`[dry] write bench/results/${o.out}.json and ${o.out}.md`)
    return problems.length ? 1 : 0
  }
  writeOut(o, out, t0, 'complete')
  console.log('\n' + renderMarkdown(out))
  return 0
}

// realpath: a path through a symlink (macOS /var is /private/var) is the same file.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // A listener keeps this process alive after a signal. It sets STOP, and step() throws before the next step.
  for (const sig of Object.keys(SIGNALS)) {
    process.on(sig, () => {
      if (!STOP) log(`${sig}: the script stops after the current step. The revert runs to its end`)
      STOP ??= sig
      CHILD?.kill(sig)
    })
  }
  main().then(
    code => { process.exitCode = STOP ? SIGNALS[STOP] : code },
    e => {
      console.error(`error: ${e.message}`)
      process.exitCode = STOP ? SIGNALS[STOP] : 1
    }
  )
}
