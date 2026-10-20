#!/usr/bin/env node
// Checks a rules file for tamper-proxy.mjs against the binding tables and the captured responses.
//
//   node check-tamper-rules.mjs <rules file> <binding-tables.md> <capture file>...      the check
//   node check-tamper-rules.mjs --fields [--match <regex>] [--value <text>] <capture file>...
//   node check-tamper-rules.mjs --tables <markdown file> [--name <source name>]
//   node check-tamper-rules.mjs --help
//
// The file is standalone: it uses only Node built-ins and imports no other file. It runs as
// bench/check-tamper-rules.mjs, and also in a work folder as check-tamper-rules.mjs.
//
// Rules file: {"rules": [<rule>, ...], "unbound": [{"rule": "T15", "reason": "no JSON field ..."}, ...]}.
// Each rule has the format of tamper-rules.example.json. The check ignores the other top-level keys.
//
// Capture file: one JSON object on each line, for each response to a browser request. The check uses the keys
// "method", "path" (the request path with the query), "status", "body" (the parsed JSON body, or null when the
// body is not JSON), "tc" (the test case of the request, or null) and "test" (the number of the test, or null).
// Each line must have these keys. A line with "changed": true is not valid: a capture must come from a run with no
// rule.
//
// Binding tables: a Markdown file that holds these tables. The check finds each table by its header cells:
//   the operator table             a header cell "Operator"
//   the table of candidate values  the header cells "Rule" and "Value in v1". It must also have the column "TC".
//   the table "The rules"          the first header cell "Rule". It must also have the column "Kind".
// Each of the three tables must occur exactly one time in the file.
//
// Kinds: the column "Kind" of the table "The rules" gives the kind of each rule. The check knows these kinds:
//   number kinds   price, quantity, item count, total, discount, balance, bonus points
//   email          email
//   text kinds     message, payment method, order status
//   ID             order ID
// When a rule has more than one kind (for example "price, discount"), all its kinds must be in the same group.
// Literals: the texts in backticks in the column "Value in v1", without the signs ¤ and %. A text in angle brackets,
// for example <order ID>, is not a literal. A literal that is a decimal number is a number literal. Each other literal
// is a text literal. The rows of a rule are the rows that name the rule in the column "Rule". A rule of a number kind
// gets the number literals of its rows. A rule of a different kind gets the text literals of its rows.
// A place of a literal is a field in a captured JSON body. The "tc" of its capture line is the TC of a row that gives
// the literal.
//
// Forms of paths: the form of a path has \d+ for each number ID and [^/?]+ for each text ID ([^&]+ in the query).
// A number ID is a path part of digits only. A text ID is a path part of hex digits and dashes, with at least 8 hex
// digits and at least one digit, and with a dash or a letter a to f. For example: 5267-f9cd5882f54c75a3.
//
// Checks. Each problem gives one line that starts with the check ID:
//   K0  The inputs: the binding tables and the capture files have the expected form. A K0 problem stops the check.
//       A change of the rules file cannot correct a K0 problem.
//   K1  The rules file loads by the rules of loadRules() in tamper-proxy.mjs: the keys, id, what, method, path,
//       field, op and value. Also, each id has the form T01-a (^T(0[1-9]|1[0-6])-[a-z]$), and each path starts with ^.
//   K2  Each rule of the table "The rules" has at least one id in "rules" (bound) or one entry in "unbound", not
//       both. An "unbound" entry has only the keys "rule" and "reason". The reason starts with "no JSON field".
//       No id and no entry names a rule that is not in the table.
//       A rule in "unbound" must have no text literal at a place. A number literal with decimals (for example 8.99)
//       at a place of a rule in "unbound" gives a note. An email at a place of a rule of the kind email in "unbound"
//       also gives a note. A text literal of a bound rule at a place, when no entry of the rule gives this text at its
//       field, gives a note.
//   K3  Each bound rule matches at least one captured response that has a JSON body: the method when the rule gives
//       one, and the path regex on the path with the query. The field gives at least one value in such a body.
//       The field walk is the walk of applyRule() in tamper-proxy.mjs.
//       The path regex must also match each captured path with a JSON body that has the same method and the same form
//       as a matched path. For a matched path with a text ID, the regex must also match the same path with a different
//       ID of the same form.
//   K4  The op and the value follow the operator table, by the type of the captured values at the field:
//         all numbers                               op add, value 1
//         all strings with a decimal number         op addNumberString, value 1 (a decimal number: -?digits(.digits)?)
//         other strings                             op set, value "mut@example.test" when each value is an email,
//                                                   else value "MUT"
//       Numbers and strings together fail. Other types (null, true, an object, an array) fail.
//   K5  The kind and the literals. Each captured value at the field must agree with the kind of the rule:
//         number kinds   a number, or a string with a decimal number
//         email          a string with the form of an email
//         text kinds     a string that is not a decimal number
//         ID             a number or a string
//       Then at least one captured value at the field must equal a literal of the rule: a number literal as a number,
//       a text literal as a text with no spaces at the start and at the end. When the rule has no literal, only the
//       kind part of K5 applies, and the output gives a note.
//
// Output of the check: an "ok" line for each bound rule with no problem, the notes, and one line for each problem.
// The last line is "PASSED: all checks" (exit code 0) or "FAILED: <n> problems" (exit code 1).
//
// --fields: one line for each method and form of path of the capture files. The line gives the number of responses
//   with a JSON body, the status codes, the number of fields and the test cases ("tc").
//   --match <regex>: only the lines where "<METHOD> <form of path>" matches the regex. Each line also gets a line for
//   each field, with its types and up to 5 values.
//   --value <text>: only the fields where a value holds the text. Each field gets a line, with up to 5 values.
// --tables: prints the three binding tables of a Markdown file, each with its title. The first line gives the sha256
//   of the file, and the source name only when you give --name. The tables are copies with no change.
// Exit code 2: a usage error, or a file that the check cannot read.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// --- a copy of the rule checks of loadRules() in tamper-proxy.mjs ------------------------------------------------
// Keep this part in step with tamper-proxy.mjs. A change there of RULE_KEYS, FIELD, OPS, VALUE_TYPE, DECIMAL, of the
// checks in loadRules() or of the walk in applyRule() needs the same change here.
// The test bench/test/check-tamper-rules.test.mjs compares loadRulesProblems() with loadRules().
const RULE_KEYS = new Set(['id', 'what', 'method', 'path', 'field', 'op', 'value'])
const FIELD = /^(\[\*\]|\[\d+\]|[^.[\]]+)(\.[^.[\]]+|\[\*\]|\[\d+\])*$/
const OPS = ['add', 'mul', 'set', 'suffix', 'addNumberString']
const VALUE_TYPE = { add: 'number', mul: 'number', suffix: 'string', addNumberString: 'number' }
const DECIMAL = /^-?\d+(\.\d{1,100})?$/ // the strings that addNumberString changes
const EACH = Symbol('each array item')
const round = n => Number(n.toPrecision(15))
const parseField = field => field.match(/\[\*\]|\[\d+\]|[^.[\]]+/g)
  .map(t => t === '[*]' ? EACH : t.startsWith('[') ? Number(t.slice(1, -1)) : t)

// The problems that loadRules() finds in a parsed rules file: [] when loadRules() accepts it.
// loadRules() stops at the first problem. This function gives each problem of each rule.
export function loadRulesProblems (doc) {
  if (!Array.isArray(doc?.rules) || doc.rules.length === 0) return ['no "rules" array, or an empty one']
  const problems = []
  const ids = new Set()
  doc.rules.forEach((r, i) => {
    const bad = msg => problems.push(`rule ${r?.id ?? `#${i + 1}`}: ${msg}`)
    if (r === null || typeof r !== 'object' || Array.isArray(r)) return bad('the rule is not an object')
    const extra = Object.keys(r).filter(k => !RULE_KEYS.has(k))
    if (extra.length) bad(`unknown keys: ${extra.join(', ')}`)
    if (typeof r.id !== 'string' || !/^[\w.-]+$/.test(r.id)) bad('"id" must be letters, digits, _, . or -')
    else if (ids.has(r.id.toLowerCase())) bad('the id is not unique (letter case does not count)')
    else ids.add(r.id.toLowerCase())
    if (typeof r.what !== 'string' || !r.what.trim()) bad('no "what"')
    // A method that is not a string also stops loadRules(): its toUpperCase() call fails.
    if (r.method !== undefined && (typeof r.method !== 'string' || !/^[A-Za-z]+$/.test(r.method))) bad('"method" must be an HTTP method')
    if (typeof r.path !== 'string' || !r.path) bad('no "path"')
    else { try { new RegExp(r.path) } catch (e) { bad(`"path" is not a regular expression: ${e.message}`) } } // eslint-disable-line no-new
    if (typeof r.field !== 'string' || !FIELD.test(r.field)) bad('"field" must be like data[*].price')
    if (!OPS.includes(r.op)) bad(`"op" must be one of: ${OPS.join(', ')}`)
    else if (r.value === undefined || (VALUE_TYPE[r.op] && typeof r.value !== VALUE_TYPE[r.op])) {
      bad(`"value" must be ${VALUE_TYPE[r.op] ? `a ${VALUE_TYPE[r.op]}` : 'a JSON value'} for op ${r.op}`)
    }
  })
  return problems
}

// The values at a parsed field in a JSON body. The walk is the walk of applyRule() in tamper-proxy.mjs.
function valuesAt (node, steps) {
  if (node === null || typeof node !== 'object') return []
  const [step, ...rest] = steps
  const keys = step === EACH ? (Array.isArray(node) ? [...node.keys()] : []) : [step]
  return keys.filter(k => Object.hasOwn(node, k)).flatMap(k => rest.length ? valuesAt(node[k], rest) : [node[k]])
}
// --- end of the copy -------------------------------------------------------------------------------------------------

const ID = /^T(0[1-9]|1[0-6])-[a-z]$/
const RULE_ID = /^T\d{2}$/
const NO_FIELD = /^no JSON field\b/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OPERATOR_WORDS = ['add', 'addNumberString', 'set', 'mut@example.test', 'MUT'] // K4 uses these
const KIND_GROUPS = {
  number: ['price', 'quantity', 'item count', 'total', 'discount', 'balance', 'bonus points'],
  email: ['email'],
  text: ['message', 'payment method', 'order status'],
  id: ['order ID']
}
const GROUP_OF = Object.fromEntries(Object.entries(KIND_GROUPS).flatMap(([g, kinds]) => kinds.map(k => [k, g])))
const asNumber = v => typeof v === 'number' ? v : typeof v === 'string' && DECIMAL.test(v) ? Number(v) : null
const FITS = {
  number: v => asNumber(v) !== null,
  email: v => typeof v === 'string' && EMAIL.test(v),
  text: v => typeof v === 'string' && !DECIMAL.test(v),
  id: v => typeof v === 'number' || typeof v === 'string'
}
const FITS_TEXT = { number: 'a number or a string with a decimal number', email: 'a string with the form of an email', text: 'a string that is not a decimal number', id: 'a number or a string' }
const typeOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v
const show = v => { const s = JSON.stringify(v); return s.length > 60 ? `${s.slice(0, 57)}...` : s }
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const upTo = (items, n, sep = ', ') => items.slice(0, n).join(sep) + (items.length > n ? `${sep}and ${items.length - n} more` : '')

// --- forms of paths ----------------------------------------------------------------------------------------------

const NUMBER_ID = /^\d+$/
const isTextId = s => /^[0-9A-Fa-f]+(-[0-9A-Fa-f]+)*$/.test(s) && /\d/.test(s) && /[-A-Fa-f]/.test(s) && s.replace(/-/g, '').length >= 8

// Gives each ID of a path to onNumber or onText (with true for an ID in the query), and joins the results.
function mapIds (p, onNumber, onText) {
  const part = (s, inQuery) => NUMBER_ID.test(s) ? onNumber(s) : isTextId(s) ? onText(s, inQuery) : s
  const q = p.indexOf('?')
  const base = (q < 0 ? p : p.slice(0, q)).split('/').map(s => part(s, false)).join('/')
  if (q < 0) return base
  const query = p.slice(q + 1).split('&').map(kv => {
    const i = kv.indexOf('=')
    return i < 0 ? kv : kv.slice(0, i + 1) + part(kv.slice(i + 1), true)
  })
  return `${base}?${query.join('&')}`
}

// The form of a path: \d+ for each number ID, [^/?]+ for each text ID ([^&]+ in the query).
export const pathForm = p => mapIds(p, () => '\\d+', (s, inQuery) => inQuery ? '[^&]+' : '[^/?]+')

// The same path with a different text ID of the same form (each digit + 1, each letter a-f to the next one), or null
// when the path has no text ID.
export function otherId (p) {
  let found = false
  const shift = c => /\d/.test(c) ? String((Number(c) + 1) % 10) : /[a-f]/.test(c) ? 'bcdefa'['abcdef'.indexOf(c)] : /[A-F]/.test(c) ? 'BCDEFA'['ABCDEF'.indexOf(c)] : c
  const out = mapIds(p, s => s, s => { found = true; return [...s].map(shift).join('') })
  return found ? out : null
}

// --- Markdown tables ---------------------------------------------------------------------------------------------

const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'))

// The tables of a Markdown text, in their order: [{ title, start, lines, header, rows }].
// The title is the label line just above the table ("The operator:" gives "The operator"), else the nearest heading.
export function markdownTables (md) {
  const lines = md.split('\n')
  const tables = []
  let heading = null
  let fence = false
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) { fence = !fence; continue }
    if (fence) continue
    const h = lines[i].match(/^#{1,6}\s+(.*?)\s*$/)
    if (h) { heading = h[1]; continue }
    if (!lines[i].startsWith('|')) continue
    let end = i
    while (end < lines.length && lines[end].startsWith('|')) end++
    const block = lines.slice(i, end)
    let k = i - 1
    while (k >= 0 && !lines[k].trim()) k--
    const label = k >= 0 && /^[A-Za-z].*:$/.test(lines[k].trim()) ? lines[k].trim().slice(0, -1) : null
    if (block.length >= 2 && /^\|?[\s:|-]+$/.test(block[1])) {
      tables.push({ title: label ?? heading, start: i, lines: block, header: cells(block[0]), rows: block.slice(2).map(cells) })
    }
    i = end - 1
  }
  return tables
}

const TABLES = {
  operators: { name: 'the operator table', title: 'The operator', match: t => t.header.includes('Operator') },
  candidates: { name: 'the table of candidate values', title: 'Candidate values', match: t => t.header.includes('Rule') && t.header.includes('Value in v1') },
  rules: { name: 'the table "The rules"', title: 'The rules', match: t => t.header[0] === 'Rule' }
}

// The three binding tables of a Markdown text: { tables: { operators, candidates, rules }, problems }.
export function bindingTables (md) {
  const all = markdownTables(md)
  const tables = {}
  const problems = []
  for (const [key, { name, match }] of Object.entries(TABLES)) {
    const found = all.filter(match)
    if (found.length === 1) tables[key] = found[0]
    else problems.push(`${plural(found.length, 'table')} match ${name}. Exactly 1 table must match.`)
  }
  return { tables, problems }
}

// The text of binding-tables.md: a first line with the sha256 of the source (and its name, when given), then each
// table with its title.
export function tablesText (bytes, name = null) {
  const { tables, problems } = bindingTables(bytes.toString('utf8'))
  if (problems.length) throw new Error(`${name ?? 'the source file'}: ${problems.join(' ')}`)
  const sha = crypto.createHash('sha256').update(bytes).digest('hex')
  const parts = [`These tables are copies from ${name ?? 'a source file'}, sha256 ${sha}, with no change.`]
  for (const [key, t] of Object.entries(tables).sort((a, b) => a[1].start - b[1].start)) {
    parts.push(`## ${t.title ?? TABLES[key].title}`, t.lines.join('\n'))
  }
  return `${parts.join('\n\n')}\n`
}

// The literals of a cell of the column "Value in v1": [{ kind: 'number' | 'text', value, text }].
export function literalsOf (cell) {
  const literals = []
  for (const [, raw] of cell.matchAll(/`([^`]*)`/g)) {
    const text = raw.replace(/[¤%]/g, '').trim()
    if (!text || /^<.*>$/.test(text)) continue
    literals.push(DECIMAL.test(text) ? { kind: 'number', value: Number(text), text } : { kind: 'text', value: text, text })
  }
  return literals
}

// The binding tables in the form that the check uses: { ruleIds, rules, problems }.
// rules: Map rule ID -> { id, kind, group, tcs: Set of the TCs of its rows, literals: [{ kind, value, text, tc }] }.
function readTables (md) {
  const { tables, problems } = bindingTables(md)
  if (problems.length) return { problems }
  const column = (t, name, label) => {
    const i = t.header.indexOf(name)
    if (i < 0) problems.push(`${label} has no column "${name}"`)
    return i
  }
  const kindCol = column(tables.rules, 'Kind', 'the table "The rules"')
  const tcCol = column(tables.candidates, 'TC', 'the table of candidate values')
  if (problems.length) return { problems }
  const rules = new Map()
  for (const row of tables.rules.rows) {
    const id = row[0]
    if (!RULE_ID.test(id) || !ID.test(`${id}-a`)) { problems.push(`the table "The rules" has the rule ID "${id}". The check knows only T01 to T16.`); continue }
    if (rules.has(id)) { problems.push(`the table "The rules" has the rule ${id} more than one time.`); continue }
    const kinds = (row[kindCol] ?? '').split(',').map(k => k.trim()).filter(Boolean)
    const groups = [...new Set(kinds.map(k => GROUP_OF[k]))]
    if (kinds.length === 0 || groups.includes(undefined)) {
      problems.push(`the table "The rules" gives the kind "${row[kindCol] ?? ''}" for ${id}. The check knows these kinds: ${Object.keys(GROUP_OF).join(', ')}.`)
    } else if (groups.length > 1) problems.push(`the table "The rules" gives kinds of different groups for ${id}: ${kinds.join(', ')}.`)
    rules.set(id, { id, kind: kinds.join(', '), group: groups[0], tcs: new Set(), literals: [] })
  }
  const opCol = tables.operators.header.indexOf('Operator')
  const opText = tables.operators.rows.map(r => r[opCol] ?? '').join(' ')
  for (const word of OPERATOR_WORDS) if (!opText.includes(`\`${word}\``)) problems.push(`the operator table does not give \`${word}\`. The check K4 uses it.`)
  const ruleCol = tables.candidates.header.indexOf('Rule')
  const valueCol = tables.candidates.header.indexOf('Value in v1')
  for (const row of tables.candidates.rows) {
    const tc = (row[tcCol] ?? '').trim()
    const literals = literalsOf(row[valueCol] ?? '')
    for (const id of new Set((row[ruleCol] ?? '').match(/\bT\d{2}\b/g) ?? [])) {
      const rule = rules.get(id)
      if (!rule) { problems.push(`the table of candidate values names the rule ${id}, but the table "The rules" does not have it.`); continue }
      rule.tcs.add(tc)
      const kind = rule.group === 'number' ? 'number' : 'text'
      for (const l of literals) if (l.kind === kind) rule.literals.push({ ...l, tc })
    }
  }
  return { ruleIds: [...rules.keys()], rules, problems }
}

// The literals of a rule, each with the TCs of the rows that give it: Map value -> Set of TCs.
function literalTcs (rule, kind) {
  const out = new Map()
  for (const l of rule.literals) if (l.kind === kind) out.set(l.value, new Set([...(out.get(l.value) ?? []), l.tc]))
  return out
}

// --- capture files -----------------------------------------------------------------------------------------------

// Reads capture files [{ name, text }]: { lines: [{ file, line, method, path, status, tc, body }], problems }.
// It gives at most 5 problem lines for each file, and then the number of the other lines with a problem.
export function readCaptures (files) {
  const lines = []
  const problems = []
  for (const { name, text } of files) {
    let count = 0
    const mine = []
    text.split('\n').forEach((raw, i) => {
      if (!raw.trim()) return
      count++
      const where = `${name} line ${i + 1}`
      let e
      try { e = JSON.parse(raw) } catch { return mine.push(`${where}: the line is not JSON`) }
      if (e === null || typeof e !== 'object' || Array.isArray(e)) return mine.push(`${where}: the line is not a JSON object`)
      if (e.changed === true) return mine.push(`${where}: "changed" is true. A capture must come from a run with no rule.`)
      if (typeof e.method !== 'string' || typeof e.path !== 'string') return mine.push(`${where}: no "method" or "path" text`)
      if (!Object.hasOwn(e, 'body')) return mine.push(`${where}: no "body" key`)
      if (!Object.hasOwn(e, 'tc') || !Object.hasOwn(e, 'test')) return mine.push(`${where}: no "tc" key or no "test" key. Each line must give the test case ("tc") and the test ("test") of the response, or null.`)
      if ((e.tc !== null && typeof e.tc !== 'string') || (e.test !== null && typeof e.test !== 'number')) return mine.push(`${where}: "tc" must be a text or null, and "test" must be a number or null`)
      lines.push({ file: name, line: i + 1, method: e.method.toUpperCase(), path: e.path, status: e.status, tc: e.tc, body: e.body })
    })
    if (count === 0) mine.push(`${name}: the file has no capture line`)
    problems.push(...mine.slice(0, 5))
    if (mine.length > 5) problems.push(`${name}: ${mine.length - 5} more lines with a problem`)
  }
  return { lines, problems }
}

// Each leaf value of a JSON body with its field name in the notation of "field" ([*] for each array item).
function leaves (node, label, emit) {
  const name = label || '(the body)'
  if (Array.isArray(node)) return node.length ? node.forEach(v => leaves(v, `${label}[*]`, emit)) : emit(name, node)
  if (node !== null && typeof node === 'object') {
    const keys = Object.keys(node)
    return keys.length ? keys.forEach(k => leaves(node[k], label ? `${label}.${k}` : k, emit)) : emit(name, node)
  }
  emit(name, node)
}

// The places in the capture lines of the TCs tcs where a leaf value passes test: [{ l, field }].
function placesOf (lines, tcs, test) {
  const out = []
  for (const l of lines) {
    if (l.body === null || !tcs.has(l.tc)) continue
    leaves(l.body, '', (field, v) => { if (test(v)) out.push({ l, field }) })
  }
  return out
}
const placesText = places => upTo([...new Set(places.map(p => `${p.l.method} ${pathForm(p.l.path)}, field ${p.field} (${p.l.tc})`))], 3, '; ')

// --- the check ---------------------------------------------------------------------------------------------------

// The operator of the operator table for the captured values at a field: { op, value, type } or { problem }.
function operatorFor (values) {
  const types = [...new Set(values.map(typeOf))]
  if (types.length > 1) return { problem: `the captured values have mixed types (${types.join(', ')})` }
  if (types[0] === 'number') return { op: 'add', value: 1, type: 'numbers' }
  if (types[0] !== 'string') return { problem: `the captured values are of the type ${types[0]}, not numbers or strings` }
  if (values.every(v => DECIMAL.test(v))) return { op: 'addNumberString', value: 1, type: 'strings with a decimal number' }
  if (values.every(v => EMAIL.test(v))) return { op: 'set', value: 'mut@example.test', type: 'emails' }
  return { op: 'set', value: 'MUT', type: 'strings' }
}

// True when a captured value equals a literal: a number literal as a number, a text literal as a trimmed text.
const equals = (literal, v) => literal.kind === 'number'
  ? asNumber(v) !== null && round(asNumber(v)) === round(literal.value)
  : typeof v === 'string' && v.trim() === literal.value

// K5 for one bound rule: { problem } or { note } or { hit }.
function kindCheck (r, rule, values) {
  const misfits = [...new Set(values.filter(v => !FITS[rule.group](v)).map(show))]
  if (misfits.length) return { problem: `${rule.id} is of the kind ${rule.kind}, so each value at ${r.field} must be ${FITS_TEXT[rule.group]}. Captured: ${upTo(misfits, 5)}` }
  const kind = rule.group === 'number' ? 'number' : 'text'
  if (rule.literals.length === 0) return { note: `the rows of ${rule.id} give no ${kind} literal, so K5 checks only the kind (${rule.kind})` }
  const hit = values.find(v => rule.literals.some(l => equals(l, v)))
  if (hit !== undefined) return { hit }
  const literals = [...new Set(rule.literals.map(l => JSON.stringify(l.value)))]
  return { problem: `no captured value at ${r.field} equals a literal of ${rule.id}. Literals: ${upTo(literals, 8)}. Captured: ${upTo([...new Set(values.map(show))], 5)}` }
}

// The check of a rules file. Inputs: the text of the rules file, the text of the binding tables, the capture files
// [{ name, text }]. Returns { oks, notes, problems }: lists of output lines.
export function check ({ rulesText, tablesMd, captures }) {
  const oks = []
  const notes = []
  const problems = []
  const tables = readTables(tablesMd)
  const cap = readCaptures(captures)
  for (const p of [...tables.problems, ...cap.problems]) problems.push(`K0 ${p}`)
  if (problems.length) return { oks, notes, problems }

  // K1
  let doc
  try { doc = JSON.parse(rulesText) } catch (e) { return { oks, notes, problems: [`K1 the rules file is not JSON: ${e.message}`] } }
  for (const p of loadRulesProblems(doc)) problems.push(`K1 ${p}`)
  const rules = Array.isArray(doc?.rules) ? doc.rules.filter(r => r !== null && typeof r === 'object' && !Array.isArray(r)) : []
  for (const r of rules) {
    if (typeof r.id === 'string' && !ID.test(r.id)) problems.push(`K1 rule ${r.id}: the id must have the form T01-a: ${ID.source}`)
    if (typeof r.path === 'string' && r.path && !r.path.startsWith('^')) problems.push(`K1 rule ${r.id}: the path must start with ^`)
  }

  // K2: the two lists
  const known = new Set(tables.ruleIds)
  const bound = new Map() // rule ID -> [rule id]
  for (const r of rules) {
    if (typeof r.id !== 'string' || !ID.test(r.id)) continue
    const base = r.id.slice(0, 3)
    if (!known.has(base)) problems.push(`K2 rule ${r.id}: ${base} is not a rule of the table "The rules"`)
    bound.set(base, [...(bound.get(base) ?? []), r.id])
  }
  const unbound = new Map()
  if (!Array.isArray(doc?.unbound)) problems.push('K2 no "unbound" array. Write "unbound": [] when each rule has a binding.')
  else {
    doc.unbound.forEach((u, i) => {
      const at = `K2 "unbound" entry ${i + 1}`
      if (u === null || typeof u !== 'object' || Array.isArray(u)) return problems.push(`${at}: the entry is not an object`)
      const extra = Object.keys(u).filter(k => k !== 'rule' && k !== 'reason')
      if (extra.length) problems.push(`${at}: unknown keys: ${extra.join(', ')}`)
      if (typeof u.rule !== 'string' || !known.has(u.rule)) return problems.push(`${at}: "rule" ${show(u.rule)} is not a rule of the table "The rules"`)
      if (unbound.has(u.rule)) problems.push(`${at}: ${u.rule} is in "unbound" more than one time`)
      if (typeof u.reason !== 'string' || !NO_FIELD.test(u.reason.trim())) problems.push(`${at} (${u.rule}): the reason must start with "no JSON field"`)
      unbound.set(u.rule, u.reason)
    })
  }
  for (const id of tables.ruleIds) {
    if (bound.has(id) && unbound.has(id)) problems.push(`K2 ${id}: the rule has a binding (${bound.get(id).join(', ')}) and is also in "unbound". Keep only one.`)
    if (!bound.has(id) && !unbound.has(id)) problems.push(`K2 ${id}: the rule has no binding and is not in "unbound"`)
  }

  // K3, K4 and K5: only for the rules with a valid id, path, field, op and value.
  const loadable = rules.filter(r => typeof r.id === 'string' && ID.test(r.id) && known.has(r.id.slice(0, 3)) && loadRulesProblems({ rules: [r] }).length === 0)
  const given = new Map() // rule id -> the captured values at its field
  for (const r of loadable) {
    const re = new RegExp(r.path)
    const method = r.method?.toUpperCase()
    const matched = cap.lines.filter(l => l.body !== null && (!method || l.method === method) && re.test(l.path))
    const where = `${method ?? 'any method'} ${r.path}`
    if (matched.length === 0) { problems.push(`K3 ${r.id}: no captured response with a JSON body matches ${where}`); continue }
    const before = problems.length
    const forms = new Map(matched.map(l => [`${l.method} ${pathForm(l.path)}`, l]))
    const sibling = cap.lines.find(l => l.body !== null && forms.has(`${l.method} ${pathForm(l.path)}`) && !re.test(l.path))
    const fixed = sibling ? null : matched.find(l => otherId(l.path) !== null && !re.test(otherId(l.path)))
    if (sibling) {
      const form = `${sibling.method} ${pathForm(sibling.path)}`
      problems.push(`K3 ${r.id}: the path ${r.path} matches ${forms.get(form).path}, but not ${sibling.path}, a captured path of the same form (${form}). Write \\d+ for a number ID and [^/?]+ for a text ID.`)
    } else if (fixed) {
      problems.push(`K3 ${r.id}: the path ${r.path} matches ${fixed.path}, but not ${otherId(fixed.path)}, the same path with a different ID. An ID of this form changes from one run to the next run. Write [^/?]+ for it.`)
    }
    const values = matched.flatMap(l => valuesAt(l.body, parseField(r.field)))
    if (values.length === 0) {
      const paths = [...new Set(matched.map(l => l.path))]
      problems.push(`K3 ${r.id}: the field ${r.field} gives no value in the ${plural(matched.length, 'response')} that match ${where} (${upTo(paths, 3)})`)
      continue
    }
    given.set(r.id, values)
    const want = operatorFor(values)
    if (want.problem) problems.push(`K4 ${r.id}: at ${r.field}, ${want.problem}`)
    else if (r.op !== want.op || r.value !== want.value) {
      problems.push(`K4 ${r.id}: op ${r.op}, value ${show(r.value)}. The captured values at ${r.field} are ${want.type}, so the operator table gives op ${want.op}, value ${show(want.value)}`)
    }
    const k5 = kindCheck(r, tables.rules.get(r.id.slice(0, 3)), values)
    if (k5.problem) problems.push(`K5 ${r.id}: ${k5.problem}`)
    if (k5.note) notes.push(`note K5 ${r.id}: ${k5.note}`)
    if (problems.length === before) {
      oks.push(`ok ${r.id}: ${plural(matched.length, 'response')}, ${plural(values.length, 'value')} at ${r.field}, op ${r.op} ${show(r.value)}${k5.hit !== undefined ? `, K5 ${show(k5.hit)}` : ''}`)
    }
  }

  // K2: the values of the rules at their places
  for (const id of tables.ruleIds) {
    const rule = tables.rules.get(id)
    if (unbound.has(id) && !bound.has(id)) {
      const texts = []
      for (const [text, tcs] of literalTcs(rule, 'text')) {
        const places = placesOf(cap.lines, tcs, v => typeof v === 'string' && v.trim() === text)
        if (places.length) texts.push(`${show(text)} at ${placesText(places)}`)
      }
      if (texts.length) problems.push(`K2 ${id}: the rule is in "unbound", but the capture holds its text in a JSON field: ${texts.join('; ')}. Bind these fields.`)
      const numbers = []
      for (const [value, tcs] of literalTcs(rule, 'number')) {
        if (Number.isInteger(value)) continue
        const places = placesOf(cap.lines, tcs, v => asNumber(v) !== null && round(asNumber(v)) === round(value))
        if (places.length) numbers.push(`${value} at ${placesText(places)}`)
      }
      if (rule.group === 'email') {
        const places = placesOf(cap.lines, rule.tcs, v => typeof v === 'string' && EMAIL.test(v))
        if (places.length) numbers.push(`an email at ${placesText(places)}`)
      }
      if (numbers.length) notes.push(`note K2 ${id}: the rule is in "unbound", but the capture holds a value of its kind in a JSON field: ${upTo(numbers, 3, '; ')}. Make sure that the page of the rule's steps does not show the value from such a field.`)
    } else if (bound.has(id) && rule.group !== 'number') {
      const missing = []
      for (const [text, tcs] of literalTcs(rule, 'text')) {
        if (bound.get(id).some(rid => (given.get(rid) ?? []).some(v => typeof v === 'string' && v.trim() === text))) continue
        const places = placesOf(cap.lines, tcs, v => typeof v === 'string' && v.trim() === text)
        if (places.length) missing.push(`${show(text)} at ${placesText(places)}`)
      }
      if (missing.length) notes.push(`note K2 ${id}: no entry of the rule gives this text of the rule, but the capture holds it in a JSON field: ${missing.join('; ')}. Bind the field when the page of the rule's steps shows the text from it.`)
    }
  }
  const byCheck = (a, b) => a.replace(/^note /, '').slice(0, 2).localeCompare(b.replace(/^note /, '').slice(0, 2))
  return { oks, notes: notes.sort(byCheck), problems: problems.sort(byCheck) }
}

// --- --fields ----------------------------------------------------------------------------------------------------

// The text of --fields for the capture lines.
export function fieldsText (lines, { match = null, value = null } = {}) {
  const groups = new Map()
  let noBody = 0
  for (const l of lines) {
    if (l.body === null) { noBody++; continue }
    const key = `${l.method} ${pathForm(l.path)}`
    let g = groups.get(key)
    if (!g) groups.set(key, (g = { key, count: 0, status: new Set(), tcs: new Set(), fields: new Map() }))
    g.count++
    g.status.add(l.status)
    if (l.tc !== null) g.tcs.add(l.tc)
    leaves(l.body, '', (name, v) => {
      let f = g.fields.get(name)
      if (!f) g.fields.set(name, (f = { types: new Set(), values: new Set(), hit: false }))
      f.types.add(typeOf(v))
      if (f.values.size < 6) f.values.add(show(v))
      if (value !== null && JSON.stringify(v).includes(value)) f.hit = true
    })
  }
  const out = []
  const re = match === null ? null : new RegExp(match)
  for (const g of groups.values()) {
    if (re && !re.test(g.key)) continue
    const fields = [...g.fields].filter(([, f]) => value === null || f.hit)
    if (value !== null && fields.length === 0) continue
    const tcs = g.tcs.size ? `, test cases ${[...g.tcs].sort().join(' ')}` : ''
    out.push(`${g.key}: ${plural(g.count, 'response')}, status ${[...g.status].join(', ')}, ${plural(g.fields.size, 'field')}${tcs}`)
    if (re === null && value === null) continue
    for (const [name, f] of fields) {
      const vals = [...f.values]
      out.push(`  ${name} (${[...f.types].join(', ')}): ${vals.slice(0, 5).join(', ')}${vals.length > 5 ? ', ...' : ''}`)
    }
  }
  if (out.length === 0) out.push('no path matches')
  out.push(`Not in this list: ${plural(noBody, 'response')} with no JSON body.`)
  return out.join('\n')
}

// --- command line ------------------------------------------------------------------------------------------------

// The leading comment of this file, without the comment marks. For --help.
function usage () {
  const lines = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1)
  return lines.slice(0, lines.findIndex(l => !l.startsWith('//'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n')
}

class UsageError extends Error {}

// Takes the options with a value out of args. Returns { values: { name: value }, rest }.
function takeOptions (args, names) {
  const values = {}
  const rest = []
  for (let i = 0; i < args.length; i++) {
    if (!names.includes(args[i])) { rest.push(args[i]); continue }
    if (i + 1 >= args.length) throw new UsageError(`${args[i]} needs a value`)
    values[args[i]] = args[++i]
  }
  return { values, rest }
}

const readText = file => {
  try { return fs.readFileSync(file, 'utf8') } catch (e) { throw new UsageError(`cannot read ${file}: ${e.message}`) }
}

function main (args) {
  if (args.includes('--help')) { console.log(usage()); return 0 }
  if (args[0] === '--tables') {
    const { values, rest } = takeOptions(args.slice(1), ['--name'])
    if (rest.length !== 1) throw new UsageError('usage: node check-tamper-rules.mjs --tables <markdown file> [--name <source name>]')
    let bytes
    try { bytes = fs.readFileSync(rest[0]) } catch (e) { throw new UsageError(`cannot read ${rest[0]}: ${e.message}`) }
    process.stdout.write(tablesText(bytes, values['--name'] ?? null))
    return 0
  }
  if (args[0] === '--fields') {
    const { values, rest } = takeOptions(args.slice(1), ['--match', '--value'])
    if (rest.length === 0) throw new UsageError('usage: node check-tamper-rules.mjs --fields [--match <regex>] [--value <text>] <capture file>...')
    if (values['--match'] !== undefined) { try { new RegExp(values['--match']) } catch (e) { throw new UsageError(`--match: ${e.message}`) } } // eslint-disable-line no-new
    const cap = readCaptures(rest.map(f => ({ name: path.basename(f), text: readText(f) })))
    if (cap.problems.length) { for (const p of cap.problems) console.log(`K0 ${p}`); return 1 }
    console.log(fieldsText(cap.lines, { match: values['--match'] ?? null, value: values['--value'] ?? null }))
    return 0
  }
  if (args.length < 3 || args.some(a => a.startsWith('--'))) {
    throw new UsageError('usage: node check-tamper-rules.mjs <rules file> <binding-tables.md> <capture file>...   (--help: the details)')
  }
  const [rulesFile, tablesFile, ...captureFiles] = args
  const result = check({
    rulesText: readText(rulesFile),
    tablesMd: readText(tablesFile),
    captures: captureFiles.map(f => ({ name: path.basename(f), text: readText(f) }))
  })
  const lines = [...(result.problems.length ? [] : result.oks), ...result.notes, ...result.problems]
  lines.push(result.problems.length ? `FAILED: ${plural(result.problems.length, 'problem')}` : 'PASSED: all checks')
  console.log(lines.join('\n'))
  return result.problems.length ? 1 : 0
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    process.exitCode = main(process.argv.slice(2))
  } catch (e) {
    console.error(`error: ${e.message}`)
    process.exitCode = e instanceof UsageError ? 2 : 1
  }
}
