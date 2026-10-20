#!/usr/bin/env node
// Finds the changes in a unified diff that make a test weaker (plan v2, E5b: the repair after a UI change).
//
//   git -C <suite> diff <ref> -- '*.ts' | node bench/weakening.mjs     print the counts and the findings, exit 1 on a finding
//
// Source: weakening() in gerchik-autotest-project/scripts/loop/stabilize.mjs, the stabilize loop of the harness.
// The source patterns and the rule "removed more assertion calls than it added" are the same as in the source.
// Give it the diff of the code files only. A Markdown file can quote a check (bench/run-ui-change.mjs: CODE_PATHSPEC).
// The changes from the source:
//   - Assertion calls. The source counts only .should*( calls. This count has each call of a name that starts with
//     expect, should or assert, with or without a receiver: expect(, expect.soft(, expect.poll(, expectText(,
//     basketPage.shouldSeeTotal(, summary.expectTotals(. It also has each Playwright matcher call: .toBe*(, .toEqual(,
//     .toStrictEqual(, .toHave*(, .toContain*(, .toMatch*(, .toThrow*(. A definition is not a call: function expectText(,
//     async shouldSeeTotal(, or `shouldSeeTotal(total) {` at the start of a line. Names that start with "expected" are
//     not calls. Thus `await expect(total).toHaveText('5')` is 2 calls and `await expectText(total, '5', 'Total')` is 1
//     call. Compare the counts of one suite only.
//   - Value checks. A value check compares a value: a matcher with an expected value (.toBe(, .toEqual(, .toHave*(,
//     .toContain*(, .toMatch*(, ...) or an assertion call with a value word in its name (expectText(, expectCount(,
//     shouldSeeTotalPrice(). A diff that removed more value checks than it added is a finding, for example when
//     toHaveText('5.98') became toBeVisible().
//   - An added .catch( on a line with an assertion call (or on the next line) is a finding.
//   - An added .slow (test.slow(), test.info().slow(), testInfo.slow()) and an added setDefaultTimeout or
//     setDefaultNavigationTimeout are findings.
//   - Timeout options (timeout: or a <name>Timeout: key). An added option is a finding when its value is larger than the
//     value of a removed option with the same key, or when no removed option has that key. The pairs come from the
//     whole diff, so an option that moved to a page object with the same value is not a finding. The value can be a
//     number (30_000), a product (2 * 60_000) or secondsToMs(n) / minutesToMs(n). Other values compare as text.
//   - A changed time constant (<NAME>_MS, <NAME>_TIMEOUT or <NAME>_WAIT = ...) is a finding in each direction, because a
//     shorter hold window is weaker too.
// A comment line does not count as an assertion call and does not give a timeout finding, as in the source.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const WEAK_PATTERNS = [
  // From the source, unchanged.
  [/\b(test|describe)(\.\w+)*\.(skip|fixme|only|fail)\b/, 'a skipped, focused or expected-to-fail test'],
  [/waitForTimeout/, 'a fixed wait (waitForTimeout)'],
  [/setTimeout/, 'a changed test timeout (setTimeout)'],
  [/\bretries\b/, 'retries'],
  // New.
  [/\.slow\b/, 'a slow test (test.slow)'],
  [/setDefault(?:Navigation)?Timeout/, 'a changed default timeout (setDefaultTimeout)']
]
const ASSERT_NAME = /(?<![\w$])(?:expect(?!ed|ation)|should|assert)\w*(?:\.\w+)?\s*\(/g
const MATCHER = /\.(?:toBe\w*|toEqual|toStrictEqual|toHave\w*|toContain\w*|toMatch\w*|toThrow\w*)\s*\(/g
const VALUE_MATCHER = /\.(?:toBe|toBeCloseTo|toBeGreaterThan\w*|toBeLessThan\w*|toBeInstanceOf|toEqual|toStrictEqual|toHave\w*|toContain\w*|toMatch\w*)\s*\(/g
const VALUE_WORD = /Text|Count|Value|Url|URL|Title|Total|Price|Amount|Sum|Balance|Quantity|Message|Equal|Contain|Match|Length|Attribute/
// Before the name of a definition: `function `, `async ` or a modifier of a class member.
const DEF_BEFORE = /(?:\bfunction\s*\*?|\b(?:async|public|private|protected|static|override|abstract))\s+$/
const TIMEOUT_KEY = /\b(timeout|\w+Timeout)\s*:\s*/g
const TIME_CONST = /\b([A-Z][A-Z0-9_]*(?:_MS|_TIMEOUT|_WAIT))\s*=(?!=)\s*/g
const TYPE_NAME = /^(?:number|string|boolean|any|unknown)\b/

const isComment = code => /^\s*(\/\/|\/?\*)/.test(code)
const isHeader = line => line.startsWith('+++') || line.startsWith('---')

// The index of the ")" that closes the "(" at index open, or -1 when the line does not close it.
function closingParen (code, open) {
  let depth = 0
  for (let i = open; i < code.length; i++) {
    if (code[i] === '(') depth++
    else if (code[i] === ')' && --depth === 0) return i
  }
  return -1
}

function isDefinition (code, m) {
  const before = code.slice(0, m.index)
  if (DEF_BEFORE.test(before)) return true
  if (before.trim() !== '') return false
  const close = closingParen(code, m.index + m[0].length - 1)
  return close >= 0 && /^\s*(?::[^;=]*)?\{\s*$/.test(code.slice(close + 1))
}

// The assertion calls and the value checks on one line of code.
function lineChecks (code) {
  let calls = 0
  let values = 0
  for (const m of code.matchAll(ASSERT_NAME)) {
    if (isDefinition(code, m)) continue
    calls++
    if (VALUE_WORD.test(m[0])) values++
  }
  calls += (code.match(MATCHER) ?? []).length
  values += (code.match(VALUE_MATCHER) ?? []).length
  return { calls, values }
}

function counts (diff) {
  const c = { added: 0, removed: 0, valuesAdded: 0, valuesRemoved: 0 }
  for (const line of diff.split('\n')) {
    if (isHeader(line) || !/^[+-]/.test(line)) continue
    const code = line.slice(1)
    if (isComment(code)) continue
    const { calls, values } = lineChecks(code)
    if (line[0] === '+') {
      c.added += calls
      c.valuesAdded += values
    } else {
      c.removed += calls
      c.valuesRemoved += values
    }
  }
  return c
}

/** Assertion calls on the added and on the removed lines of a unified diff. */
export function assertionCounts (diff) {
  const { added, removed } = counts(diff)
  return { added, removed }
}

/** Value checks (a subset of the assertion calls) on the added and on the removed lines of a unified diff. */
export function valueCheckCounts (diff) {
  const { valuesAdded, valuesRemoved } = counts(diff)
  return { added: valuesAdded, removed: valuesRemoved }
}

// The text of a value from index from to the next ",", ";", "}", ")" or "]" outside brackets.
function valueText (code, from) {
  let depth = 0
  for (let i = from; i < code.length; i++) {
    const ch = code[i]
    if ('([{'.includes(ch)) depth++
    else if (')]}'.includes(ch) && depth-- === 0) return code.slice(from, i).trim()
    else if ((ch === ',' || ch === ';') && depth === 0) return code.slice(from, i).trim()
  }
  return code.slice(from).trim()
}

// Milliseconds of a value, or NaN when the value is not a number, a product or secondsToMs(n) / minutesToMs(n).
function toMs (raw) {
  const num = s => Number(s.trim().replace(/_/g, ''))
  if (/^[\d_.]+(?:\s*\*\s*[\d_.]+)*$/.test(raw)) return raw.split('*').reduce((n, f) => n * num(f), 1)
  const call = /(?:^|\.)(seconds?|secs?|minutes?|mins?)ToMs\(\s*([\d_.]+)\s*\)$/i.exec(raw)
  return call ? num(call[2]) * (/^m/i.test(call[1]) ? 60_000 : 1000) : NaN
}

function timeValues (code) {
  const values = []
  for (const [re, kind] of [[TIMEOUT_KEY, 'option'], [TIME_CONST, 'const']]) {
    for (const m of code.matchAll(re)) {
      const raw = valueText(code, m.index + m[0].length)
      if (raw && !TYPE_NAME.test(raw)) values.push({ kind, key: m[1], raw, ms: toMs(raw) })
    }
  }
  return values
}

function timeChange (a, r) {
  if (a.kind === 'const') return r ? `a changed time constant (${a.key}: ${r.raw} to ${a.raw})` : null
  if (!r) return `a timeout option (${a.key}: ${a.raw})`
  if (Number.isNaN(a.ms) || Number.isNaN(r.ms)) return `a changed timeout (${a.key}: ${r.raw} to ${a.raw})`
  return a.ms > r.ms ? `a larger timeout (${a.key}: ${r.raw} to ${a.raw})` : null
}

// Pairs each added timeout option and time constant with a removed one of the same key: first one with the same
// value anywhere in the diff (a move), then one in the same hunk, then one anywhere.
function timeFindings (diff) {
  const added = []
  const removed = []
  let hunk = 0
  for (const line of diff.split('\n')) {
    if (isHeader(line) || line.startsWith('@@') || line.startsWith('diff ')) {
      hunk++
      continue
    }
    if (!/^[+-]/.test(line) || isComment(line.slice(1))) continue
    const code = line.slice(1)
    for (const t of timeValues(code)) (line[0] === '+' ? added : removed).push({ ...t, hunk, code: code.trim() })
  }
  const take = pred => {
    const i = removed.findIndex(pred)
    return i < 0 ? null : removed.splice(i, 1)[0]
  }
  const sameKey = a => r => r.kind === a.kind && r.key === a.key
  const sameValue = (a, r) => a.raw === r.raw || (!Number.isNaN(a.ms) && a.ms === r.ms)
  const rest = added.filter(a => !take(r => sameKey(a)(r) && sameValue(a, r)))
  const findings = []
  for (const a of rest) {
    const r = take(r => sameKey(a)(r) && r.hunk === a.hunk) ?? take(sameKey(a))
    const why = timeChange(a, r)
    if (why) findings.push(`added ${why}: ${a.code}`)
  }
  return findings
}

/** Findings in a unified diff that make a test weaker. Empty when the diff is clean. */
export function weakening (diff) {
  const findings = []
  let previous = ''
  for (const line of diff.split('\n')) {
    if (isHeader(line)) continue
    const code = line.slice(1)
    if (line.startsWith('+')) {
      const hit = WEAK_PATTERNS.find(([re]) => re.test(code))
      if (hit) findings.push(`added ${hit[1]}: ${code.trim()}`)
      const onCheck = lineChecks(code).calls > 0 || (/^\s*\.catch\b/.test(code) && lineChecks(previous).calls > 0)
      if (!isComment(code) && /\.catch\s*\(/.test(code) && onCheck) findings.push(`added a .catch on an assertion (its failure does not fail the test): ${code.trim()}`)
    }
    if (/^[+ ]/.test(line) && !isComment(code)) previous = code
  }
  findings.push(...timeFindings(diff))
  const c = counts(diff)
  if (c.removed > c.added) findings.push(`removed ${c.removed - c.added} assertion call(s) more than it added (removed ${c.removed}, added ${c.added})`)
  if (c.valuesRemoved > c.valuesAdded) {
    findings.push(`removed ${c.valuesRemoved - c.valuesAdded} value check(s) more than it added (removed ${c.valuesRemoved}, added ${c.valuesAdded}): a check of a value was removed or became a check of presence or state`)
  }
  return findings
}

// realpath: a path through a symlink (macOS /var is /private/var) is the same file.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const diff = fs.readFileSync(0, 'utf8')
  const c = counts(diff)
  const findings = weakening(diff)
  console.log(`assertion calls: added ${c.added}, removed ${c.removed}`)
  console.log(`value checks: added ${c.valuesAdded}, removed ${c.valuesRemoved}`)
  for (const f of findings) console.log(f)
  process.exitCode = findings.length ? 1 : 0
}
