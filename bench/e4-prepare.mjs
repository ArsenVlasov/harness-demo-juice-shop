#!/usr/bin/env node
// Prepares the inputs of E4 and calculates the measures of the audit. The rules are in bench/hypotheses-v2.md at the
// tag hypotheses-v2: "E4: audit of a ready suite, before and after", "Inputs of the audit and of the fix", "The tamper
// list for the proxy" and "Measures of the audit". Decision 17 (LOG.md, 21.10, 13:45) names the client suites.
//
//   node bench/e4-prepare.mjs clean-reports --tamper <tamper .md> --mutate <mutate .md> --dest <folder>
//   node bench/e4-prepare.mjs audit-folder --suite <path>@<ref> --dest <RUNS/name> --reports <folder>
//   node bench/e4-prepare.mjs fix-folder --suite <path>@<ref> --dest <RUNS/name> --audit-report <file>
//                                        --harness-template <RUNS/templates/suite-b-precise.git>
//   node bench/e4-prepare.mjs flags --cond <condition> --tamper-json <tamper .json> --audit-report <audit-report.md>
//                                   --out <file .json>
//   node bench/e4-prepare.mjs score --flags <file .json> --mutants <mutants .json> --label <S> --judge <judge .json>
//                                   --sealed <mutants.md> --out <file name with no extension>
//   node bench/e4-prepare.mjs --help
//
// clean-reports (item 2 of the inputs). It writes <dest>/tamper-report.md and <dest>/mutate-report.md.
//   The tamper report loses the line "Source:", the line "Suite <label>:" and the line "Rules:" that names the rules
//   file. The mutate report loses the line "Source:". Each of these lines must occur exactly one time.
//   The script also removes each other line that names a path in LAB, in RUNS or in bench/, and prints that line.
//   The title of the mutate report must be "# Expectation mutation audit: client" (the label client of item 2).
//   The --out name in the title of the tamper report must not name a condition, a run or a suite (for example
//   vague, set-2, run-1, suite-a, A-1 or gen-1). The script stops on a different title.
//   It prints the sha256 of each new file. It stops when one of the two files exists in <dest>.
// audit-folder (item 3). It makes the folder of the auditor, a direct child of RUNS with a neutral name.
//   The root is a copy of the suite at <ref> (git archive) with no harness files. The list of these files comes from
//   bench/prepare-review.mjs, with the harness repository --harness-template (default RUNS/templates/suite-b-precise.git).
//   node_modules is a copy (cp -Rp) of node_modules in the suite folder.
//   reports/ gets the two files of the folder --reports. They must be clean (see clean-reports). The new folder has no .git.
//   It prints the sha256 of each file outside node_modules and of the folder.
// fix-folder (items 5 and 6). It makes the fix folder of a client suite A, a direct child of RUNS with a neutral name.
//   1. A new git repository with the branch main and one commit "Client suite": the files of the suite at <ref>
//      (git archive). It has no history, no tags and no remote of the run folder, so the fixer sees no run name.
//   2. The harness port: each path of `git diff --name-only baseline harness-v1` in --harness-template, from harness-v1.
//      A client file with the same path stays. package.json gets the npm scripts and the dev dependencies of the
//      harness package.json that it does not have.
//   3. npm install --offline --no-audit --no-fund with Node 24. It runs first in a temp clone with the same port.
//      If the offline install fails, the script stops. It does not go online. The client versions in the lock must stay.
//   4. One commit "Add harness": the paths of step 2, package.json and package-lock.json. npm adds the new packages
//      to package-lock.json, so the commit holds a lock that agrees with package.json.
//   5. git config core.hooksPath .githooks. Then one commit "Add the audit report" with audit-report.md.
//   The two commits run with no git hooks (git commit --no-verify), as in bench/finish-run.sh.
//   It prints the commits, the client files that stayed, the npm changes and the hooks setting.
// flags (section "Measures of the audit"). It writes the flag list as JSON and prints its sha256.
//   Tamper flags (rule 6 of the tamper list): a rule fired in a test, and the test passed. Then each step of the rule
//   in the TC of that test gets a flag. The steps come from the column "Test case steps" of the table "The rules" at
//   the tag hypotheses-v2. The rule ID before the letter selects the row: T02-a selects T02.
//   A test with no TC gives no flag, and the output lists it. A rule with the verdict "invalid" gives no flag.
//   Give --tamper-json again for a run again of a rule with --only (rule 5). Each rule must have a verdict in one file.
//   FLAG lines: each line of the audit report, also in a list item, of the form "FLAG TC-NN step N: <reason>".
//   These lines give no flag, and the output lists them as invalid:
//   - a line with a different form that starts with FLAG or has the word FLAG and a TC ID (for example "TC-7")
//   - a line with a range or a list of steps
//   - a line with the word FLAG two or more times
//   - a line with a reason that names a step ("step 9", "steps 8", "крок 9"), because one line names one step
//   - a line with a step that is not in the test case set of --cond (for example step 0, or TC-01 step 9).
//   Each tamper flag must also be a step of that set, else the script stops. Two flags on one step are one flag.
// score (section "Measures of the audit"). It writes <out>.md and <out>.json with R1, R2, P1, P2 and the counts of the
//   classes "hit", "weak by the judge" and "other". The missed bugs and the missed patches come from summary[<S>] of the
//   mutants file (bugsMissed and allMissed). The target steps come from the column of the expected test case step in
//   the summary table of --sealed. The script reads the table with the regex of readMutants() in bench/run-mutants.mjs.
//   Known forms of the column: "TC-07 step 8", "TC-07 steps 8 and 9", "TC-07 step 8, TC-05 step 4", "TC-02 to TC-08".
//   The script stops on a different form, also in a row of a caught patch. "TC-02 to TC-04 step 3" is not a known form.
//   Each target step and each flag must be a step of the precise set (test-cases-v1:test-cases), else the script stops.
//   The sealed session and the judge use that set.
//   With no missed bug, R1 and R2 are "not tested". With no flag or with no missed patch, P1 and P2 are "not tested".
//   The judge file is the JSON file of one suite from bench/run-judge.mjs. A step "partial" or "missing" is weak.
//
// Env, only for a test of this script: E4_RUNS replaces RUNS, and E4_NPM replaces the npm command.
// BENCH_CONDITIONS replaces bench/conditions.json (see bench/lib.mjs).
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { markdownTables } from './check-tamper-rules.mjs'
import { CONDITIONS, CONDITIONS_FILE, LAB, RUNS, log, must, opt, optAll, run } from './lib.mjs'
import { extractCopy, harnessPaths, leftoverHarness } from './prepare-review.mjs'
import { usage } from './tamper-proxy.mjs'

const RUNS_DIR = path.resolve(process.env.E4_RUNS || RUNS)
const NPM = process.env.E4_NPM || 'npm'
const NPM_ARGS = ['install', '--offline', '--no-audit', '--no-fund']
const HYPOTHESES = 'hypotheses-v2:bench/hypotheses-v2.md'
const REPORTS = ['tamper-report.md', 'mutate-report.md']
const FORBIDDEN = ['vague', 'haiku', 'precise', 'audit-x', 'patch', 'mutant', 'sealed']

const sha256 = data => crypto.createHash('sha256').update(data).digest('hex')
const shaFile = file => sha256(fs.readFileSync(file))
const fail = msg => { throw new Error(msg) }
const real = p => fs.realpathSync(p)
const readJson = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch (e) { return fail(`cannot read the JSON file ${file}: ${e.message}`) } }
const git = (dir, ...args) => must('git', ['-C', dir, ...args])
const lsTree = (repo, ref) => git(repo, 'ls-tree', '-r', '-z', '--name-only', ref).split('\0').filter(Boolean)

// The commit sha of ref in repo, or a stop with a clear message.
function commitOf (repo, ref) {
  const r = run('git', ['-C', repo, 'rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`])
  return r.code === 0 ? r.out.trim() : fail(`no commit ${ref} in ${repo}`)
}

function need (name) {
  const v = opt(name)
  if (!v || v.startsWith('--')) fail(`give ${name}`)
  return v
}

function needFile (name) {
  const f = path.resolve(need(name))
  if (!fs.statSync(f, { throwIfNoEntry: false })?.isFile()) fail(`${name}: no file ${f}`)
  return f
}

// Stops when a file exists. A result file goes into LOG.md with its sha256, so the script never writes it again.
function mustNotExist (...files) {
  const old = files.filter(f => fs.lstatSync(f, { throwIfNoEntry: false }))
  if (old.length) fail(`${old.join(' and ')} exists. Give a new name.`)
}

// --- clean-reports --------------------------------------------------------------------------------------------------

const TAMPER_HEADER = [
  { name: 'Source:', test: l => l.startsWith('Source:') },
  { name: 'Suite', test: l => l.startsWith('Suite') },
  { name: 'Rules: with the rules file', test: l => /^Rules: `[^`]+`, sha256 `[0-9a-f]{64}`/.test(l) }
]
const MUTATE_HEADER = [{ name: 'Source:', test: l => l.startsWith('Source:') }]
// The title of each report. Group 1 is the name in the title: the --out name of the tamper tool, the label of the mutate tool.
const KINDS = {
  tamper: { title: /^# Tamper audit \((.+)\)$/, form: '# Tamper audit (<out>)', header: TAMPER_HEADER, tool: 'run-audit-tamper.mjs' },
  mutate: { title: /^# Expectation mutation audit: (client)$/, form: '# Expectation mutation audit: client', header: MUTATE_HEADER, tool: 'run-audit-mutate.mjs' }
}

// Stops when the first line is not the title of the tool, or when the name in the title can tell the condition, the run
// or the suite. The cleaning keeps the title, so the auditor sees it.
export function checkTitle (text, kind) {
  const k = KINDS[kind]
  const title = text.split('\n')[0]
  const m = title.match(k.title) ?? fail(`the ${kind} report does not start with "${k.form}". It is not the markdown of bench/${k.tool}, or its label is not client (item 2).`)
  const word = forbiddenWord(m[1])
  if (word) fail(`the title "${title}" of the ${kind} report holds "${word}". Item 2: the --out name names no condition, run or suite. Run bench/${k.tool} again with a neutral --out.`)
}

// The path that a line names (a root folder or a pattern), or null. The auditor must not see these paths.
export function namesPath (line) {
  const roots = new Set([LAB, RUNS_DIR, ...[LAB, RUNS_DIR].filter(p => fs.existsSync(p)).map(real)])
  const root = [...roots].find(r => line.includes(r))
  if (root) return root
  const re = [/harness-demo-juice-shop/, /harness-demo-runs/, /(?<![\w.-])bench\//, /(?<![\w.-])sealed(-ui)?\//, /\bset-\d+\/run-\d+/]
  return re.find(r => r.test(line))?.source ?? null
}

// The report without its header lines and without the lines that name a path: { text, removed: [{ line, why, text }] }.
export function cleanReport (text, kind) {
  const k = KINDS[kind]
  const lines = text.split('\n')
  checkTitle(text, kind)
  for (const h of k.header) {
    const n = lines.filter(h.test).length
    if (n !== 1) fail(`the ${kind} report has ${n} lines "${h.name}", not 1. It is not the markdown of bench/${k.tool}.`)
  }
  const removed = []
  const kept = lines.filter((l, i) => {
    const h = k.header.find(h => h.test(l))
    const p = h ? null : namesPath(l)
    if (h || p) removed.push({ line: i + 1, why: h ? `the header line "${h.name}"` : `it names a path (${p})`, text: l })
    return !h && !p
  })
  return { text: kept.join('\n'), removed }
}

// The lines that clean-reports removes from a report, for the check of audit-folder.
export const uncleanLines = (text, kind) => text.split('\n')
  .map((l, i) => ({ line: i + 1, text: l }))
  .filter(({ text: l }) => KINDS[kind].header.some(h => h.test(l)) || namesPath(l))

function cleanReports () {
  const inputs = { tamper: needFile('--tamper'), mutate: needFile('--mutate') }
  const dest = path.resolve(need('--dest'))
  const outs = { tamper: path.join(dest, REPORTS[0]), mutate: path.join(dest, REPORTS[1]) }
  mustNotExist(...Object.values(outs))
  const cleaned = Object.fromEntries(Object.entries(inputs).map(([kind, f]) => [kind, cleanReport(fs.readFileSync(f, 'utf8'), kind)]))
  fs.mkdirSync(dest, { recursive: true })
  for (const [kind, c] of Object.entries(cleaned)) {
    fs.writeFileSync(outs[kind], c.text)
    log(`${kind}: ${inputs[kind]} (sha256 ${shaFile(inputs[kind])})`)
    for (const r of c.removed) log(`  removed line ${r.line}, ${r.why}: ${r.text}`)
    const words = c.text.split('\n').flatMap((l, i) => /\b(vague|haiku|precise)\b/i.test(l) ? [`line ${i + 1}`] : [])
    if (words.length) log(`  warning: these lines name a condition word (vague, haiku or precise): ${words.join(', ')}`)
    if (kind === 'mutate' && c.text.includes('**Not complete.**')) log('  warning: the mutate report says "Not complete"')
    log(`  wrote ${outs[kind]}, sha256 ${shaFile(outs[kind])}`)
  }
}

// --- suites, conditions and the new folders in RUNS -------------------------------------------------------------------

// The value of --suite as { dir, ref, commit }.
function suiteOption () {
  const v = need('--suite')
  const m = v.match(/^(.+)@([^@]+)$/)
  if (!m) fail(`--suite ${v}: use <path>@<ref>`)
  const dir = path.resolve(m[1])
  if (!fs.existsSync(path.join(dir, '.git'))) fail(`no git repository in ${dir}`)
  return { dir, ref: m[2], commit: commitOf(dir, m[2]) }
}

// The condition of a run folder RUNS/<dir>/run-<n>/suite-<a|b>, from bench/conditions.json.
export function conditionOf (dir) {
  if (!CONDITIONS) fail(`no ${CONDITIONS_FILE}`)
  const rel = path.relative(real(RUNS_DIR), real(dir)).split(path.sep).join('/')
  const m = rel.match(/^([^/]+)\/run-\d+\/suite-([ab])$/)
  if (!m) fail(`${dir} is not a run folder RUNS/<set>/run-<n>/suite-<a|b> (RUNS: ${RUNS_DIR})`)
  const found = Object.entries(CONDITIONS.conditions).filter(([, c]) => c.dir === m[1])
  if (found.length !== 1) fail(`${found.length} conditions in ${CONDITIONS_FILE} have the folder ${m[1]}, not 1`)
  const [cond, c] = found[0]
  const set = CONDITIONS.tcSets[c.tcSet] ?? fail(`no tcSet ${c.tcSet} in ${CONDITIONS_FILE}`)
  return { cond, tcSet: c.tcSet, labDir: set.labDir, labTag: set.labTag, suiteId: m[2].toUpperCase() }
}

// The word of a name (a folder, a report title) that can tell the session the condition, the run or the measurement,
// or null. A suite and run ID such as A-1 or b2 and a tag such as gen-1 also count.
export function forbiddenWord (name) {
  const lower = name.toLowerCase()
  const words = new Set(FORBIDDEN)
  for (const [c, v] of Object.entries(CONDITIONS?.conditions ?? {})) [c, v.dir, v.tcSet].forEach(w => words.add(w.toLowerCase()))
  return [...words].find(w => lower.includes(w)) ??
    lower.match(/set-?\d|run-?\d|suite-?[ab]\b|(?<![a-z0-9])(?:[ab]-?\d+|gen-?\d+)(?![a-z0-9])/)?.[0] ?? null
}

// The absolute path of a new folder: a direct child of RUNS with a neutral name that does not exist.
function checkDest (value) {
  const dest = path.resolve(value)
  const name = path.basename(dest)
  if (fs.lstatSync(dest, { throwIfNoEntry: false })) fail(`${dest} exists`)
  const parent = path.dirname(dest)
  if (!fs.existsSync(parent) || real(parent) !== real(RUNS_DIR)) fail(`--dest must be a direct child of RUNS (${RUNS_DIR}), not ${dest}`)
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name === '.' || name === '..') fail(`bad folder name: ${name}`)
  const word = forbiddenWord(name)
  if (word) fail(`the folder name ${name} holds "${word}". The session sees the path of its folder, so give a neutral name.`)
  return path.join(real(RUNS_DIR), name)
}

// The lines "<sha256>  ./<path>" of each file of dir outside node_modules, in the order of LC_ALL=C sort.
const FILE_LINES = 'cd "$1" && find . -path ./node_modules -prune -o -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256'
export const fileLines = dir => must('sh', ['-c', FILE_LINES, 'sh', dir])
// The sha256 of a folder by the method of tc_hash() in bench/run-generation.sh, with no files in node_modules.
export const treeSha = dir => sha256(fileLines(dir) + '\n')

// The sha256 of test-cases/ of the suite at its commit must be the sha256 of the lab set of its condition (item 1).
function testCasesCheck (s, c) {
  const tmp = real(fs.mkdtempSync(path.join(os.tmpdir(), 'e4-tc-')))
  try {
    const hash = (repo, ref, sub, name) => {
      const tar = path.join(tmp, `${name}.tar`)
      fs.mkdirSync(path.join(tmp, name))
      git(repo, 'archive', '-o', tar, ref, '--', sub)
      must('tar', ['-x', '-f', tar, '-C', path.join(tmp, name)])
      return treeSha(path.join(tmp, name, sub))
    }
    const lab = hash(LAB, c.labTag, c.labDir, 'lab')
    const suite = hash(s.dir, s.commit, 'test-cases', 'suite')
    if (suite !== lab) fail(`test-cases/ of ${s.dir} at ${s.ref} has sha256 ${suite}, not ${lab} of the lab set ${c.labTag}:${c.labDir} (condition ${c.cond})`)
    return { sha: suite, source: `${c.labTag}:${c.labDir}` }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

// Runs fn to make the folder dest. When fn fails, the script removes dest.
function makeFolder (dest, fn) {
  try {
    return fn()
  } catch (e) {
    fs.rmSync(dest, { recursive: true, force: true })
    throw new Error(`${e.message}\nThe script removed ${dest}.`)
  }
}

// --- audit-folder ---------------------------------------------------------------------------------------------------

function auditFolder () {
  const s = suiteOption()
  const dest = checkDest(need('--dest'))
  const reports = path.resolve(need('--reports'))
  const template = path.resolve(opt('--harness-template', path.join(RUNS_DIR, 'templates', 'suite-b-precise.git')))
  const c = conditionOf(s.dir)
  const modules = path.join(s.dir, 'node_modules')
  if (!fs.existsSync(path.join(modules, '@playwright', 'test', 'package.json'))) fail(`no @playwright/test in ${modules}`)
  for (const [f, kind] of [[REPORTS[0], 'tamper'], [REPORTS[1], 'mutate']]) {
    const file = path.join(reports, f)
    if (!fs.existsSync(file)) fail(`no ${file}. Make it with clean-reports.`)
    const text = fs.readFileSync(file, 'utf8')
    try { checkTitle(text, kind) } catch (e) { fail(`${file}: ${e.message}`) }
    const bad = uncleanLines(text, kind)
    if (bad.length) fail(`${file} is not clean. Lines: ${bad.map(b => `${b.line}: ${b.text}`).join(' | ')}`)
  }
  const harness = harnessPaths(template)
  const tc = testCasesCheck(s, c)
  log(`suite ${s.dir} at ${s.ref} (${s.commit.slice(0, 12)}), condition ${c.cond}. test-cases/ sha256 ${tc.sha} equals ${tc.source}`)
  makeFolder(dest, () => {
    const { dropped } = extractCopy(s.dir, s.commit, dest, harness)
    must('cp', ['-Rp', modules, path.join(dest, 'node_modules')])
    fs.mkdirSync(path.join(dest, 'reports'))
    for (const f of REPORTS) fs.copyFileSync(path.join(reports, f), path.join(dest, 'reports', f))
    if (fs.existsSync(path.join(dest, '.git'))) fail(`${dest} has .git`)
    const left = leftoverHarness(dest, harness)
    if (left.length) fail(`${dest} holds harness paths: ${left.join(', ')}`)
    if (treeSha(path.join(dest, 'test-cases')) !== tc.sha) fail(`test-cases/ in ${dest} is not the set ${tc.source}`)
    log(`auditor folder ${dest}`)
    log(`harness paths not in the copy (${harness.files.size} files of ${template} and the folders ${harness.dirs.join(' ')}): ${dropped.join(', ') || 'none'}`)
    const lock = path.join(dest, 'node_modules', '.package-lock.json')
    log(`node_modules: cp -Rp from ${modules}, node_modules/.package-lock.json sha256 ${fs.existsSync(lock) ? shaFile(lock) : 'none'}`)
    log('sha256 of each file outside node_modules:')
    console.log(fileLines(dest))
    log(`folder sha256 (the files outside node_modules, the method of tc_hash in bench/run-generation.sh): ${treeSha(dest)}`)
  })
}

// --- fix-folder -----------------------------------------------------------------------------------------------------

// Adds the scripts and the dev dependencies of the harness package.json that the client package.json does not have.
// A client value that is not the harness value stays, and the result lists it in "differ".
export function mergePackage (clientText, harnessText) {
  const pkg = JSON.parse(clientText)
  const harness = JSON.parse(harnessText)
  const added = { scripts: {}, devDependencies: {} }
  const differ = []
  for (const key of Object.keys(added)) {
    const have = key === 'scripts' ? [pkg.scripts] : [pkg.devDependencies, pkg.dependencies, pkg.optionalDependencies, pkg.peerDependencies]
    for (const [name, value] of Object.entries(harness[key] ?? {})) {
      const current = have.map(o => o?.[name]).find(v => v !== undefined)
      if (current === undefined) {
        pkg[key] ??= {}
        pkg[key][name] = added[key][name] = value
      } else if (current !== value) differ.push(`${key}.${name}: the client has ${JSON.stringify(current)}, the harness has ${JSON.stringify(value)}`)
    }
  }
  return { text: JSON.stringify(pkg, null, 2) + '\n', added, differ }
}

// Copies the harness paths that the client tree at HEAD does not have from harness-v1 of the template into dir,
// then merges package.json. Returns { added, stayed, absent, pkg }.
export function portHarness (dir, template, files) {
  const atHarness = new Set(lsTree(template, 'harness-v1'))
  const client = new Set(lsTree(dir, 'HEAD'))
  const absent = files.filter(f => !atHarness.has(f))
  const stayed = files.filter(f => atHarness.has(f) && client.has(f))
  const added = files.filter(f => atHarness.has(f) && !client.has(f))
  if (added.length) {
    const tmp = real(fs.mkdtempSync(path.join(os.tmpdir(), 'e4-port-')))
    try {
      const tar = path.join(tmp, 'harness.tar')
      must('git', ['--literal-pathspecs', '-C', template, 'archive', '-o', tar, 'harness-v1', '--', ...added])
      must('tar', ['-x', '-m', '-f', tar, '-C', dir])
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  }
  let pkg = null
  if (stayed.includes('package.json')) {
    pkg = mergePackage(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'), git(template, 'show', 'harness-v1:package.json'))
    fs.writeFileSync(path.join(dir, 'package.json'), pkg.text)
  }
  return { added, stayed, absent, pkg }
}

const npmInstall = dir => run(NPM, NPM_ARGS, { cwd: dir })
// The summary line of npm ("added 115 packages in 4s"). run() puts stderr after stdout, so it is not the last line.
const npmSummary = out => out.split('\n').find(l => /^(added|removed|changed|up to date)\b/.test(l)) ?? out.trim().split('\n').at(-1)
const npmFailure = (where, r) => `npm ${NPM_ARGS.join(' ')} fails in ${where} (exit ${r.code}). The script does not go online. Output:\n${r.out.slice(-2000)}`

// The offline install in a temp clone of the suite with the same port. It stops the script when the install fails.
function npmTrial (s, template, files) {
  const tmp = real(fs.mkdtempSync(path.join(os.tmpdir(), 'e4-npm-try-')))
  try {
    const dir = path.join(tmp, 'suite')
    must('git', ['clone', '-q', '--no-local', '--no-hardlinks', s.dir, dir])
    git(dir, 'checkout', '-q', '--detach', s.commit)
    portHarness(dir, template, files)
    const r = npmInstall(dir)
    if (r.code !== 0) fail(npmFailure('a temp clone', r))
    return npmSummary(r.out)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

// { package path: version } of package-lock.json in dir, without the root entry, or null with no lock.
function lockVersions (dir) {
  const f = path.join(dir, 'package-lock.json')
  if (!fs.existsSync(f)) return null
  const lock = JSON.parse(fs.readFileSync(f, 'utf8'))
  return Object.fromEntries(Object.entries(lock.packages ?? {}).filter(([k]) => k !== '').map(([k, v]) => [k, v.version]))
}

export function lockChanges (before, after) {
  if (!before || !after) return { added: [], changed: [], note: before ? 'npm removed package-lock.json' : 'the client has no package-lock.json' }
  return {
    added: Object.keys(after).filter(k => !(k in before)),
    changed: Object.keys(before).filter(k => after[k] !== before[k]).map(k => `${k} ${before[k]} to ${after[k] ?? 'none'}`)
  }
}

// Files in .git (not objects/, not binary) that name RUNS, LAB, the suite folder, a set, a template or a condition.
function gitLeaks (dir, s) {
  const texts = [...new Set([RUNS_DIR, real(RUNS_DIR), LAB, real(LAB), s.dir, 'harness-demo-runs', 'harness-demo-juice-shop', 'templates/'])]
  const res = [/\bvague\b/i, /\bhaiku\b/i, /\bprecise\b/i, /\bset-\d+\//]
  const found = []
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const p = path.join(rel, e.name)
      if (e.isDirectory()) { if (p !== path.join('.git', 'objects')) walk(p); continue }
      const buf = fs.readFileSync(path.join(dir, p))
      if (buf.includes(0)) continue
      const text = buf.toString('utf8')
      if (texts.some(t => text.includes(t)) || res.some(re => re.test(text))) found.push(p)
    }
  }
  walk('.git')
  return found
}

function commitPaths (dir, paths, message) {
  git(dir, 'add', '-A', '--', ...paths)
  git(dir, '-c', 'commit.gpgsign=false', 'commit', '-q', '--no-verify', '-m', message)
  const dirty = git(dir, 'status', '--porcelain')
  if (dirty) fail(`after the commit "${message}", git status shows changes:\n${dirty}`)
}

// A new repository with one commit of the client files at the ref. The history of the run folder ("Generation run
// A-1, as the agent left it", the tags gen-<n>) would tell the fixer the run and the suite.
function initAt (s, dest) {
  fs.mkdirSync(dest)
  must('git', ['init', '-q', '-b', 'main', dest])
  must('sh', ['-c', 'git -C "$1" archive "$2" | tar -x -m -C "$3"', 'sh', s.dir, s.commit, dest])
  git(dest, 'add', '-A')
  git(dest, '-c', 'commit.gpgsign=false', 'commit', '-q', '--no-verify', '-m', 'Client suite')
  const dirty = git(dest, 'status', '--porcelain')
  if (dirty) fail(`after the commit "Client suite", git status shows changes:\n${dirty}`)
}

function fixFolder () {
  const s = suiteOption()
  const dest = checkDest(need('--dest'))
  const report = needFile('--audit-report')
  const template = path.resolve(need('--harness-template'))
  const c = conditionOf(s.dir)
  if (c.suiteId !== 'A') fail(`${s.dir} is a suite B. A client suite B has the harness already (item 6). This script ports the harness only into a client suite A.`)
  for (const tag of ['baseline', 'harness-v1']) commitOf(template, `refs/tags/${tag}`)
  const files = [...harnessPaths(template).files]
  const tc = testCasesCheck(s, c)
  log(`suite ${s.dir} at ${s.ref} (${s.commit.slice(0, 12)}), condition ${c.cond}. test-cases/ sha256 ${tc.sha} equals ${tc.source}`)
  const trial = npmTrial(s, template, files)
  log(`npm ${NPM_ARGS.join(' ')} works in a temp clone with the same port: ${trial}`)
  makeFolder(dest, () => {
    initAt(s, dest)
    const port = portHarness(dest, template, files)
    const before = lockVersions(dest)
    const r = npmInstall(dest)
    if (r.code !== 0) fail(npmFailure(dest, r))
    const lock = lockChanges(before, lockVersions(dest))
    if (lock.changed.length) fail(`npm changed the versions of client packages in package-lock.json: ${lock.changed.join(', ')}`)
    commitPaths(dest, [...port.added, ...['package.json', 'package-lock.json'].filter(f => fs.existsSync(path.join(dest, f)))], 'Add harness')
    git(dest, 'config', 'core.hooksPath', '.githooks')
    const copy = path.join(dest, 'audit-report.md')
    mustNotExist(copy)
    fs.copyFileSync(report, copy)
    commitPaths(dest, ['audit-report.md'], 'Add the audit report')
    fs.rmSync(path.join(dest, '.git', 'logs'), { recursive: true, force: true })
    const leaks = gitLeaks(dest, s)
    if (leaks.length) fail(`these files in .git name RUNS, the lab, a set or a condition: ${leaks.join(', ')}`)
    if (git(dest, 'remote')) fail(`${dest} has a remote`)
    printFix(dest, s, template, port, lock, report, r)
  })
}

function printFix (dest, s, template, port, lock, report, npm) {
  log(`fix folder ${dest}: branch ${git(dest, 'symbolic-ref', '--short', 'HEAD')}, tags ${git(dest, 'tag').split('\n').join(' ') || 'none'}, no remote, no reflog`)
  log('commits of the fix folder:')
  console.log(git(dest, 'log', '--reverse', '--stat', '--format=commit %H %s'))
  log(`harness: ${port.added.length} paths from harness-v1 of ${template}${port.absent.length ? `. Not in harness-v1: ${port.absent.join(', ')}` : ''}`)
  log(`client files that stayed: ${port.stayed.join(', ') || 'none'}`)
  if (port.pkg) {
    log(`package.json, scripts added: ${JSON.stringify(port.pkg.added.scripts)}`)
    log(`package.json, devDependencies added: ${JSON.stringify(port.pkg.added.devDependencies)}`)
    for (const d of port.pkg.differ) log(`package.json, the client value stays: ${d}`)
  }
  log(`npm ${NPM_ARGS.join(' ')}: ${npmSummary(npm.out)}`)
  log(`package-lock.json: ${lock.note ?? `${lock.added.length} packages added, no version of a client package changed`}`)
  const nmLock = path.join(dest, 'node_modules', '.package-lock.json')
  log(`node_modules/.package-lock.json sha256 ${fs.existsSync(nmLock) ? shaFile(nmLock) : 'none'}`)
  log(`core.hooksPath: ${git(dest, 'config', '--get', 'core.hooksPath')}`)
  log(`audit-report.md: sha256 ${shaFile(path.join(dest, 'audit-report.md'))} (source ${report}, sha256 ${shaFile(report)})`)
  log(`HEAD ${git(dest, 'rev-parse', 'HEAD')}, tree ${git(dest, 'rev-parse', 'HEAD^{tree}')}`)
}

// --- test case steps ------------------------------------------------------------------------------------------------

// The steps that a text names: [{ tc, step }], with step null for a test case with no step. Known forms:
// "TC-07 step 8", "TC-07 steps 8 and 9", "TC-02 steps 2 to 4", "TC-07 step 8, TC-05 step 4", "TC-02 to TC-08",
// and items that a period or "and" separates ("TC-02 steps 3, 4. TC-03 steps 1 to 5"). It stops on other text,
// also on a test case range with steps ("TC-02 to TC-04 step 3"): the meaning of that form is not clear.
// It does not check that a step exists. stepProblem() does that.
export function parseSteps (text) {
  const s = text.trim().replace(/\.$/, '')
  const item = /(TC-(\d\d))(?: to TC-(\d\d))?(?: steps? (\d+(?: to \d+)?(?:(?:, and |, | and )\d+(?: to \d+)?)*))?/y
  const sep = /(?:\. |; |, and |, | and )(?=TC-)/y
  const range = (a, b, what) => {
    if (b < a) fail(`"${text}": the ${what} range ${a} to ${b} goes down`)
    return Array.from({ length: b - a + 1 }, (_, i) => a + i)
  }
  const out = []
  let at = 0
  for (;;) {
    item.lastIndex = at
    const m = item.exec(s)
    if (!m) fail(`unknown form of test case steps: "${text}" (at "${s.slice(at)}")`)
    if (m[3] && m[4]) fail(`unknown form of test case steps: "${text}" (a test case range with steps, at "${m[0]}")`)
    const tcs = m[3] ? range(Number(m[2]), Number(m[3]), 'test case').map(n => `TC-${String(n).padStart(2, '0')}`) : [m[1]]
    const steps = m[4] ? m[4].split(/, and |, | and /).flatMap(p => { const [a, b] = p.split(' to ').map(Number); return b === undefined ? [a] : range(a, b, 'step') }) : [null]
    for (const tc of tcs) for (const step of steps) if (!out.some(o => o.tc === tc && o.step === step)) out.push({ tc, step })
    at = item.lastIndex
    if (at === s.length) return out
    sep.lastIndex = at
    if (!sep.exec(s)) fail(`unknown form of test case steps: "${text}" (at "${s.slice(at)}")`)
    at = sep.lastIndex
  }
}

const key = f => `${f.tc}#${f.step}`
const byStep = (a, b) => a.tc.localeCompare(b.tc) || a.step - b.step

// The sealed session and the judge use this set. Thus the target steps and the judge steps are steps of this set.
const REFERENCE_SET = { labTag: 'test-cases-v1', labDir: 'test-cases' }

// The number of steps of each test case of a lab set at its tag: { source, counts: { 'TC-01': 5, ... } }.
// The rows of the section "## Steps" of each file TC-NN-*.md must have the numbers 1 to N.
export function stepCounts ({ labTag, labDir }) {
  const source = `${labTag}:${labDir}`
  const files = lsTree(LAB, `${labTag}^{commit}`).filter(f => path.posix.dirname(f) === labDir && /^TC-\d\d-.+\.md$/.test(path.posix.basename(f)))
  if (files.length === 0) fail(`no files TC-NN-*.md in ${source}`)
  const counts = {}
  for (const f of files) {
    const tc = path.posix.basename(f).slice(0, 5)
    if (counts[tc]) fail(`${source} has two files of ${tc}`)
    const section = git(LAB, 'show', `${labTag}:${f}`).split(/^## /m).find(s => s.startsWith('Steps\n')) ?? fail(`${labTag}:${f} has no section "## Steps"`)
    const nums = [...section.matchAll(/^\| (\d+) \|/gm)].map(m => Number(m[1]))
    if (nums.length === 0 || nums.some((n, i) => n !== i + 1)) fail(`${labTag}:${f}: the step rows have the numbers ${nums.join(', ') || 'none'}, not 1 to N`)
    counts[tc] = nums.length
  }
  return { source, counts }
}

// Why { tc, step } is not a step of the set, or null. A step null names only the test case.
export function stepProblem (set, tc, step) {
  const n = set.counts[tc]
  if (n === undefined) return `${set.source} has no ${tc}`
  if (step !== null && !(Number.isInteger(step) && step >= 1 && step <= n)) return `${tc} has no step ${step} (${tc} has the steps 1 to ${n} in ${set.source})`
  return null
}

// --- flags ----------------------------------------------------------------------------------------------------------

// The table "The rules" of the frozen file: { T01: [{ tc, step }], ... }.
export function rulesTable (md) {
  const tables = markdownTables(md).filter(t => t.header[0] === 'Rule' && t.header.includes('Test case steps'))
  if (tables.length !== 1) fail(`${tables.length} tables "The rules" in ${HYPOTHESES}, not 1`)
  const col = tables[0].header.indexOf('Test case steps')
  const out = {}
  for (const row of tables[0].rows) {
    if (!/^T\d\d$/.test(row[0]) || out[row[0]]) fail(`the table "The rules": bad or repeated rule ID ${row[0]}`)
    out[row[0]] = parseSteps(row[col])
    if (out[row[0]].some(s => s.step === null)) fail(`the table "The rules", rule ${row[0]}: a test case with no step`)
  }
  return out
}

// Rule 6 of the tamper list. reports: [{ file, json }] of run-audit-tamper.mjs. table: the result of rulesTable().
export function tamperFlags (reports, table) {
  const rows = new Map()
  for (const { file, json } of reports) {
    if (!Array.isArray(json?.rules)) fail(`${file}: no list "rules". It is not the JSON report of bench/run-audit-tamper.mjs.`)
    for (const r of json.rules) rows.set(r.id, [...(rows.get(r.id) ?? []), { ...r, file }])
  }
  const out = { flags: [], testsWithNoTc: [], firedWithNoStep: [], invalidRules: [] }
  for (const [id, list] of rows) {
    const valid = list.filter(r => r.verdict !== 'invalid')
    if (valid.length === 0) { out.invalidRules.push(id); continue }
    if (valid.length > 1) fail(`rule ${id} has a verdict in ${valid.length} reports: ${valid.map(r => r.file).join(', ')}. Give each rule with a verdict one time.`)
    const base = id.match(/^(T\d\d)-[a-z]+$/)?.[1] ?? fail(`rule ID ${id} is not of the form T<NN>-<letter>`)
    const steps = table[base] ?? fail(`rule ${id}: no rule ${base} in the table "The rules"`)
    for (const f of valid[0].fired ?? []) {
      if (f.passed !== true) continue
      if (f.tc == null) { out.testsWithNoTc.push({ rule: id, test: f.test }); continue }
      if (!/^TC-\d\d$/.test(f.tc)) fail(`rule ${id}, test ${f.test}: the TC "${f.tc}" is not of the form TC-NN`)
      const mine = steps.filter(s => s.tc === f.tc)
      if (mine.length === 0) out.firedWithNoStep.push({ rule: id, test: f.test, tc: f.tc })
      for (const s of mine) out.flags.push({ tc: s.tc, step: s.step, source: id, reason: `tamper rule ${id} fired in the test "${f.test}", and the test passed` })
    }
  }
  return out
}

const FLAG = /^FLAG (TC-\d\d) step (\d+): (.+)$/
// A text that names a step, in English or in Ukrainian (the language of the auditor): "step 9", "steps 8", "крок 9",
// "кроки 8", "у кроці 6".
const NAMES_STEP = /(?<![\p{L}\d])(?:steps?|крок\p{L}*|кроц\p{L}*)\s+\d/iu
const STEP_LIST = /\bsteps\b|\bstep\s+\d+\s*(?:-|to|,|and|&|\/)\s*\d+/i

// The FLAG lines of audit-report.md: { flags, invalid: [{ line, text, reason }] }. set: the result of stepCounts().
// A line that looks like a FLAG line and gives no flag goes into the list invalid, so that no FLAG line goes away
// with no record.
export function reportFlags (text, set) {
  if (!set?.counts) fail('reportFlags: give the test case set (stepCounts())')
  const out = { flags: [], invalid: [] }
  text.split('\n').forEach((raw, i) => {
    const body = raw.trim().replace(/^(?:[-*+]|\d+[.)])\s+/, '')
    const m = body.match(FLAG)
    const flagWords = (body.match(/\bFLAG\b/g) ?? []).length
    const invalid = reason => out.invalid.push({ line: i + 1, text: raw, reason })
    if (m) {
      const problem = stepProblem(set, m[1], Number(m[2]))
      if (flagWords > 1) invalid('the word FLAG two or more times. One line names one step.')
      else if (NAMES_STEP.test(m[3])) invalid('the reason names a step too. One line names one step.')
      else if (problem) invalid(`no such step: ${problem}`)
      else out.flags.push({ tc: m[1], step: Number(m[2]), source: 'report', reason: `audit report line ${i + 1}: ${m[3].trim()}` })
    } else if (/^FLAG\b/.test(body) || (/\bflag\b/i.test(body) && /\bTC-?\d/i.test(body))) {
      const list = STEP_LIST.test(body) || (body.match(/TC-\d\d/g) ?? []).length > 1
      invalid(flagWords > 1 ? 'the word FLAG two or more times. One line names one step.'
        : list ? 'a range or a list of steps' : 'not of the form "FLAG TC-NN step N: <reason>"')
    }
  })
  return out
}

// One flag for each step: [{ tc, step, sources, reasons }]. The tamper rule IDs come first, then "report".
export function unionFlags (...lists) {
  const map = new Map()
  for (const f of lists.flat()) {
    const k = key(f)
    const e = map.get(k) ?? { tc: f.tc, step: f.step, sources: [], reasons: [] }
    if (!e.sources.includes(f.source)) e.sources.push(f.source)
    e.reasons.push(f.reason)
    map.set(k, e)
  }
  const bySource = (a, b) => (a === 'report') - (b === 'report') || a.localeCompare(b)
  return [...map.values()].map(e => ({ ...e, sources: e.sources.sort(bySource) })).sort(byStep)
}

// The test case set of a condition of bench/conditions.json, as stepCounts() gives it.
function conditionSet (cond) {
  if (!CONDITIONS) fail(`no ${CONDITIONS_FILE}`)
  const c = CONDITIONS.conditions[cond] ?? fail(`--cond ${cond}: not in ${CONDITIONS_FILE}. Known: ${Object.keys(CONDITIONS.conditions).join(', ')}`)
  return stepCounts(CONDITIONS.tcSets[c.tcSet] ?? fail(`no tcSet ${c.tcSet} in ${CONDITIONS_FILE}`))
}

function flagsCommand () {
  const set = conditionSet(need('--cond'))
  const tamperFiles = optAll('--tamper-json').map(f => path.resolve(f))
  if (tamperFiles.length === 0) fail('give --tamper-json')
  for (const f of tamperFiles) if (!fs.existsSync(f)) fail(`--tamper-json: no file ${f}`)
  const reportFile = needFile('--audit-report')
  const outFile = path.resolve(need('--out'))
  mustNotExist(outFile)
  const shown = run('git', ['-C', LAB, 'show', HYPOTHESES])
  if (shown.code !== 0) fail(`git show ${HYPOTHESES} failed in ${LAB}: ${shown.out}`)
  const md = shown.out
  const tamper = tamperFlags(tamperFiles.map(file => ({ file, json: readJson(file) })), rulesTable(md))
  for (const f of tamper.flags) {
    const problem = stepProblem(set, f.tc, f.step)
    if (problem) fail(`the tamper flag ${f.tc} step ${f.step} of rule ${f.source} is not a step of the set of --cond: ${problem}`)
  }
  const report = reportFlags(fs.readFileSync(reportFile, 'utf8'), set)
  const flags = unionFlags(tamper.flags, report.flags)
  const out = {
    generatedAt: new Date().toISOString(),
    inputs: {
      tamperJson: tamperFiles.map(file => ({ file, sha256: shaFile(file) })),
      auditReport: { file: reportFile, sha256: shaFile(reportFile) },
      rulesTable: { source: HYPOTHESES, sha256: sha256(md) },
      testCaseSet: { condition: opt('--cond'), source: set.source, steps: set.counts }
    },
    counts: { flags: flags.length, tamperFlags: unionFlags(tamper.flags).length, reportFlags: unionFlags(report.flags).length, invalidLines: report.invalid.length },
    flags,
    invalidLines: report.invalid,
    testsWithNoTc: tamper.testsWithNoTc,
    firedWithNoStep: tamper.firedWithNoStep,
    invalidRules: tamper.invalidRules
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n')
  log(`flags: ${out.counts.flags} (tamper ${out.counts.tamperFlags}, report ${out.counts.reportFlags}). Invalid FLAG lines: ${report.invalid.length}`)
  for (const l of report.invalid) log(`  invalid line ${l.line} (${l.reason}): ${l.text}`)
  for (const t of tamper.testsWithNoTc) log(`  no TC, no flag: rule ${t.rule}, test ${t.test}`)
  if (tamper.invalidRules.length) log(`  rules with the verdict "invalid", no flag: ${tamper.invalidRules.join(', ')}`)
  log(`wrote ${outFile}, sha256 ${shaFile(outFile)}`)
}

// --- score ----------------------------------------------------------------------------------------------------------

// The regex of readMutants() in bench/run-mutants.mjs. That script runs main() on import, so this is a copy.
const MUTANT_ROW = /^\| (M\d+) \| `(\d+-[\w-]+\.patch)` \| `([^`]+)` \| (bug|operator) \| ([^|]+) \|$/gm

// The rows of the summary table of sealed/mutants.md: [{ id, patch, file, kind, expected, targets }].
// set: the result of stepCounts(). Each target must be a test case or a step of the set.
export function readMutantsTable (text, set) {
  if (!set?.counts) fail('readMutantsTable: give the test case set (stepCounts())')
  const rows = [...text.matchAll(MUTANT_ROW)].map(([, id, patch, file, kind, step]) => ({ id, patch, file, kind, expected: step.trim() }))
  if (rows.length === 0) fail('no row of the summary table of mutants.md')
  const ids = rows.map(r => r.id)
  if (new Set(ids).size !== ids.length) fail(`repeated patch IDs in mutants.md: ${ids.join(', ')}`)
  return rows.map(r => {
    const targets = parseSteps(r.expected)
    for (const t of targets) {
      const problem = stepProblem(set, t.tc, t.step)
      if (problem) fail(`patch ${r.id}, "${r.expected}": ${problem}`)
    }
    return { ...r, targets }
  })
}

const ratio = (k, m) => ({ k, m, value: +(k / m).toFixed(3), text: `${k} of ${m}` })
const notTested = why => ({ k: null, m: null, value: null, text: `not tested (${why})` })

// The measures of the audit. flags: the flags list. mutants: the mutants JSON. judge: the JSON of one judge suite.
// sealed: the result of readMutantsTable(). set: the reference set (stepCounts(REFERENCE_SET)).
export function score ({ flags, mutants, label, judge, sealed, set }) {
  if (!set?.counts) fail('score: give the reference test case set (stepCounts())')
  const sum = mutants.summary?.[label] ?? fail(`no summary.${label} in the mutants file. Labels: ${Object.keys(mutants.summary ?? {}).join(', ')}`)
  if (!Array.isArray(sum.bugsMissed) || !Array.isArray(sum.allMissed)) fail(`summary.${label} has no lists bugsMissed and allMissed`)
  if (!Array.isArray(judge.verdicts)) fail('the judge file has no list "verdicts". Give the JSON file of one suite of bench/run-judge.mjs.')
  for (const f of flags) if (!/^TC-\d\d$/.test(f.tc) || !Number.isInteger(f.step)) fail(`bad flag ${JSON.stringify(f)}`)
  for (const f of flags) {
    const problem = stepProblem(set, f.tc, f.step)
    if (problem) fail(`the flag ${f.tc} step ${f.step} is not a step of the reference set: ${problem}`)
  }
  if (new Set(flags.map(key)).size !== flags.length) fail('the flag list names a step two times. Make it with the subcommand flags.')
  const rows = new Map(sealed.map(r => [r.id, r]))
  const patch = id => {
    const r = rows.get(id) ?? fail(`patch ${id} of the mutants file is not in the summary table of mutants.md`)
    const m = mutants.mutants?.find(x => x.id === id)
    if (m && m.kind !== r.kind) fail(`patch ${id}: the kind ${m.kind} of the mutants file is not the kind ${r.kind} of mutants.md`)
    if (m && m.expected !== undefined && m.expected !== r.expected) fail(`patch ${id}: the expected step of the mutants file is not the one of mutants.md`)
    return r
  }
  const missed = sum.allMissed.map(patch)
  const bugs = sum.bugsMissed.map(patch)
  for (const b of bugs) if (b.kind !== 'bug' || !sum.allMissed.includes(b.id)) fail(`patch ${b.id} of bugsMissed is not a missed bug in allMissed`)
  const targetOf = new Map()
  for (const p of missed) for (const t of p.targets) if (t.step !== null) targetOf.set(key(t), [...(targetOf.get(key(t)) ?? []), p.id])
  const weak = new Set(judge.verdicts.filter(v => v.verdict === 'partial' || v.verdict === 'missing').map(v => `${v.tc}#${Number(v.step)}`))
  const missedBugs = bugs.map(b => {
    const steps = b.targets.filter(t => t.step !== null).map(key)
    const tcs = new Set(b.targets.map(t => t.tc))
    const onStep = flags.filter(f => steps.includes(key(f))).map(key)
    const onTc = flags.filter(f => tcs.has(f.tc)).map(key)
    return { id: b.id, expected: b.expected, r1: onStep.length > 0, r2: onTc.length > 0, flagsOnTargetSteps: onStep, flagsOnTargetTestCases: onTc }
  })
  const classified = [...flags].sort(byStep).map(f => {
    const patches = targetOf.get(key(f)) ?? []
    return { tc: f.tc, step: f.step, sources: f.sources ?? [], class: patches.length ? 'hit' : weak.has(key(f)) ? 'weak by the judge' : 'other', patches }
  })
  const count = c => classified.filter(f => f.class === c).length
  const counts = { hit: count('hit'), weak: count('weak by the judge'), other: count('other') }
  const noP = !flags.length ? 'no flag' : !missed.length ? 'no missed patch' : null
  return {
    label,
    R1: bugs.length ? ratio(missedBugs.filter(b => b.r1).length, bugs.length) : notTested('no missed bug'),
    R2: bugs.length ? ratio(missedBugs.filter(b => b.r2).length, bugs.length) : notTested('no missed bug'),
    P1: noP ? notTested(noP) : ratio(counts.hit, flags.length),
    P2: noP ? notTested(noP) : ratio(counts.hit + counts.weak, flags.length),
    counts,
    missedBugs,
    missedPatches: missed.map(p => ({ id: p.id, kind: p.kind, expected: p.expected })),
    flags: classified
  }
}

const cell = s => String(s).replaceAll('|', '\\|')
const code = s => `\`${cell(s)}\``
const steps = list => list.map(code).join(', ') || 'none'

export function scoreMarkdown (r, inputs, generatedAt) {
  const measure = (name, m) => `| ${name} | ${m.text} | ${m.value ?? '-'} |`
  return [
    `# Measures of the audit (label ${r.label})`,
    '',
    'The rules are in the section "Measures of the audit" of `bench/hypotheses-v2.md` at the tag `hypotheses-v2`.',
    `The command \`bench/e4-prepare.mjs score\` wrote this file at ${generatedAt}.`,
    '',
    '| Input | File | sha256 |',
    '|---|---|---|',
    ...inputs.map(i => `| ${i.name} | ${code(i.file)} | ${code(i.sha256)} |`),
    '',
    '| Measure | Result | Value |',
    '|---|---|---|',
    measure('R1: missed bugs with a flag on a target step', r.R1),
    measure('R2: missed bugs with a flag on a step of a target test case', r.R2),
    measure('P1: hits, of all flags', r.P1),
    measure('P2: hits and flags that are weak by the judge, of all flags', r.P2),
    `| Flags of the class "hit" | ${r.counts.hit} | - |`,
    `| Flags of the class "weak by the judge" | ${r.counts.weak} | - |`,
    `| Flags of the class "other" | ${r.counts.other} | - |`,
    '',
    'A target step is a step in the column of the expected test case step of the sealed table.',
    'When the column names more than one step, a flag on one of them counts.',
    'When the column names a test case with no step, R1 counts the bug as not flagged. R2 uses the test case.',
    'A hit is a flag on a target step of a missed patch. A test case with no step gives no target step.',
    `Each target step and each flag is a step of the set \`${REFERENCE_SET.labTag}:${REFERENCE_SET.labDir}\`.`,
    '',
    '## Missed bugs',
    '',
    ...(r.missedBugs.length
      ? ['| Patch | Target steps | Flags on a target step | Flags on a target test case |', '|---|---|---|---|',
          ...r.missedBugs.map(b => `| ${b.id} | ${code(b.expected)} | ${steps(b.flagsOnTargetSteps)} | ${steps(b.flagsOnTargetTestCases)} |`)]
      : ['None.']),
    '',
    '## Missed patches',
    '',
    ...(r.missedPatches.length
      ? ['| Patch | Kind | Target steps |', '|---|---|---|', ...r.missedPatches.map(p => `| ${p.id} | ${p.kind} | ${code(p.expected)} |`)]
      : ['None.']),
    '',
    '## Flags',
    '',
    ...(r.flags.length
      ? ['| Step | Sources | Class | Missed patches with this target step |', '|---|---|---|---|',
          ...r.flags.map(f => `| ${code(key(f))} | ${steps(f.sources)} | ${f.class} | ${f.patches.join(', ') || '-'} |`)]
      : ['None.']),
    ''
  ].join('\n')
}

function scoreCommand () {
  const files = { flags: needFile('--flags'), mutants: needFile('--mutants'), judge: needFile('--judge'), sealed: needFile('--sealed') }
  const label = need('--label')
  const base = path.resolve(need('--out')).replace(/\.(md|json)$/, '')
  mustNotExist(`${base}.md`, `${base}.json`)
  const flagList = readJson(files.flags)
  if (!Array.isArray(flagList.flags)) fail(`${files.flags} has no list "flags". Make it with the subcommand flags.`)
  const set = stepCounts(REFERENCE_SET)
  const r = score({
    flags: flagList.flags,
    mutants: readJson(files.mutants),
    label,
    judge: readJson(files.judge),
    sealed: readMutantsTable(fs.readFileSync(files.sealed, 'utf8'), set),
    set
  })
  const generatedAt = new Date().toISOString()
  const inputs = Object.entries(files).map(([name, file]) => ({ name, file, sha256: shaFile(file) }))
  fs.mkdirSync(path.dirname(base), { recursive: true })
  fs.writeFileSync(`${base}.json`, JSON.stringify({ generatedAt, inputs, ...r }, null, 2) + '\n')
  fs.writeFileSync(`${base}.md`, scoreMarkdown(r, inputs, generatedAt))
  for (const m of ['R1', 'R2', 'P1', 'P2']) log(`${m}: ${r[m].text}${r[m].value === null ? '' : ` = ${r[m].value}`}`)
  log(`classes: hit ${r.counts.hit}, weak by the judge ${r.counts.weak}, other ${r.counts.other}`)
  for (const ext of ['md', 'json']) log(`wrote ${base}.${ext}, sha256 ${shaFile(`${base}.${ext}`)}`)
}

// --- command line -----------------------------------------------------------------------------------------------------

const COMMANDS = { 'clean-reports': cleanReports, 'audit-folder': auditFolder, 'fix-folder': fixFolder, flags: flagsCommand, score: scoreCommand }

function main () {
  const cmd = process.argv[2]
  if (!cmd || cmd === '--help') return console.log(usage(import.meta.url))
  if (!COMMANDS[cmd]) fail(`unknown subcommand ${cmd}. Known: ${Object.keys(COMMANDS).join(', ')}. See --help.`)
  COMMANDS[cmd]()
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    main()
  } catch (e) {
    console.error(`error: ${e.message}`)
    process.exit(1)
  }
}
