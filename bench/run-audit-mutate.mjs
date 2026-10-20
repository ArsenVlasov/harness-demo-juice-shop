#!/usr/bin/env node
// Expectation mutation audit (plan v2, E4 step 2): changes one literal in one assertion, runs only the affected
// tests and reports the mutants that survive. A mutant that survives shows a weak check.
//
//   node bench/run-audit-mutate.mjs --suite A=<suite dir> --list              print the mutation sites and exit (no app)
//   node bench/run-audit-mutate.mjs --suite A=<suite dir> --ref gen-1         baseline, then each mutant (default ref HEAD)
//   node bench/run-audit-mutate.mjs --suite client=<dir> --out mutate-e4-before --restart-every 5 --max 20
//
// Default --out: mutate-<label>. Output: bench/results/<out>.json and .md (written again after each mutant, with
// "complete": false until the end), raw Playwright reports in bench/results/<out>/.
// The script copies the suite at the ref into a new temp folder (git archive) and never writes into the suite folder.
// node_modules of the copy is a symlink to node_modules of the suite folder (--list links it only when it exists).
//
// Sites, in the .ts files of the suite (not node_modules, test-results, .claude, scripts, .playwright-mcp, *.config.ts):
//   a. literals in the arguments of expect(...), expect.soft(...), expect.poll(...), expect.configure(...)(...), of the
//      matcher calls on them, and of the asymmetric matchers in them (expect.objectContaining(...) and similar);
//   b. literals in the arguments of calls whose name starts with should, expect, assert, verify or check (any case),
//      followed by a non-lowercase character or the end. So shouldSeeTotal() and checkTotal() count; checkout() and
//      the Playwright action check() do not.
//   Literals inside array and object literals in these arguments count too.
// Not mutated, with a reason (REASON): values of the properties timeout, intervals, delay and retries; messages;
// matcher options; attribute and property names; literals that cannot fail on a correct app (n + 1 or s_mut under
// .not, n + 1 in an upper bound); arguments of a helper parameter that reaches only a failure message; computed values.
// A helper parameter gets its role from its uses in the helper (data flow).
// Operators: n -> n + 1, "s" -> "s_mut", "" -> "_mut", `t` -> `t_mut`, /p/f -> /(?:p)_mut/f, true <-> false.
//
// Affected tests: for a site in a test of a spec file, that test (<spec>:<line>). Else each spec file that imports the
// changed file directly or through other files (relative imports, index.ts barrels and tsconfig paths).
// Status: killed (a selected test fails with the mutant and passes again on the original file), survived (each
// selected test passes), error (no report, no result, or the failed tests fail on the original file too).
// The table of tests: a killed mutant counts for the tests that killed it. Other mutants count for the selected
// tests that run the code of the site (call graph from the TypeScript declarations, the fixtures and the hooks).
// Tests that fail at the baseline are left out. The app restarts before the baseline, before the first mutant and
// after each --restart-every mutants (a new stock and a new database).
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { RESULTS, appTreeIsClean, env, log, must, opt, passedAll, readReport, run, startApp, stopApp } from './lib.mjs'

const TIMING = new Set(['timeout', 'intervals', 'delay', 'retries'])
// Option properties of Playwright matchers that give the expected state, for example toBeVisible({ visible: false }).
const STATE = new Set(['visible', 'checked', 'enabled', 'editable', 'attached', 'indeterminate'])
const PREFIXES = ['should', 'expect', 'assert', 'verify', 'check']
const ACTIONS = new Set(['check']) // Locator.check() and Page.check() are actions, not assertions
const KEY_FIRST = new Set(['toHaveAttribute', 'toHaveCSS', 'toHaveJSProperty', 'toHaveProperty'])
const LOWER = new Set(['toBeGreaterThan', 'toBeGreaterThanOrEqual'])
const UPPER = new Set(['toBeLessThan', 'toBeLessThanOrEqual'])
// The index of the first options argument of a matcher. The arguments at and after it are options.
const OPTIONS_AT = new Map([
  ...['toBeAttached', 'toBeChecked', 'toBeDisabled', 'toBeEditable', 'toBeEmpty', 'toBeEnabled', 'toBeFocused',
    'toBeHidden', 'toBeInViewport', 'toBeVisible', 'toPass', 'toHaveScreenshot', 'toMatchSnapshot'].map(n => [n, 0]),
  ...['toBeCloseTo', 'toContainClass', 'toContainText', 'toHaveAccessibleDescription', 'toHaveAccessibleErrorMessage',
    'toHaveAccessibleName', 'toHaveClass', 'toHaveCount', 'toHaveId', 'toHaveRole', 'toHaveText', 'toHaveTitle',
    'toHaveURL', 'toHaveValue', 'toHaveValues', 'toMatchAriaSnapshot'].map(n => [n, 1]),
  ...['toHaveAttribute', 'toHaveCSS', 'toHaveJSProperty'].map(n => [n, 2])
])
const ASYMMETRIC = new Set(['objectContaining', 'arrayContaining', 'stringContaining', 'stringMatching', 'closeTo'])
const SKIP_DIRS = new Set(['.git', 'node_modules', 'test-results', '.claude', 'scripts', '.playwright-mcp'])
const SUBJECT_TYPE = /\b(Locator|Page|FrameLocator|ElementHandle|APIResponse|Response|BrowserContext|APIRequestContext)\b/
const HOOKS = new Set(['beforeEach', 'beforeAll', 'afterEach', 'afterAll'])
const TEST_MODIFIERS = new Set(['only', 'skip', 'fixme', 'fail', 'slow'])
const FAILED = new Set(['failed', 'timedOut', 'interrupted'])
const UNATTRIBUTED = '(unattributed)'

// The role of an argument position:
//   value    an expected value: all operators
//   subject  the actual value (argument 0 of expect): literals are mutated, a computed value is not listed
//   negated  an expected value under .not: only true and false are mutated (n + 1 and s_mut make the check weaker)
//   loose    the bound of toBeLessThan(n) and similar: n + 1 makes the check weaker, so numbers are not mutated
//   key, option, timing, message, helperMessage: nothing is mutated (see REASON)
const COMPUTED = 'computed expected value'
const REASON = {
  negated: 'cannot fail: negated check',
  loose: 'cannot fail: looser bound',
  key: 'attribute or property name',
  option: 'matcher option',
  timing: 'timing option',
  message: 'message',
  helperMessage: 'argument reaches only a failure message'
}
// When the uses of a helper parameter have different roles, the first role of this list wins.
const ORDER = ['value', 'subject', 'negated', 'loose', 'key', 'option', 'timing', 'message']
// The groups of the not mutated expressions: [reason, short label, title in the report, text in the report].
const NOT_MUTATED = [
  [REASON.helperMessage, 'msg-arg', 'Argument reaches only a failure message: check by hand',
    'The helper puts this argument only into the message of a failed assertion. The script does not mutate it, ' +
    'because such a mutant cannot fail. If the argument is an expected value, the helper does not check it.'],
  [REASON.negated, 'negated', 'Cannot fail: negated check',
    'Under `.not`, n + 1 and s_mut make the check weaker. On a correct app, such a mutant cannot fail.'],
  [REASON.loose, 'looser', 'Cannot fail: looser bound',
    'In an upper bound, for example `toBeLessThan(n)`, n + 1 makes the check weaker.'],
  [COMPUTED, 'computed', 'Computed expected value', 'The expected value is not a literal, so the script does not mutate it.'],
  [REASON.message, 'message', 'Message', null],
  [REASON.option, 'option', 'Matcher option', null],
  [REASON.key, 'key', 'Attribute or property name', null],
  [REASON.timing, 'timing', 'Timing option', null],
  ['no operator', 'no-op', 'No operator (null or undefined)', null]
]

const isSpec = f => /\.(spec|test)\.ts$/.test(f)
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex')
const oneLine = s => s.replace(/\s+/g, ' ').slice(0, 100)
const posix = (root, f) => path.relative(root, f).split(path.sep).join('/')
const strongest = roles => ORDER.find(r => roles.includes(r)) ?? 'value'

function walk (node, fn) {
  fn(node)
  ts.forEachChild(node, child => { walk(child, fn) })
}

const isWrapper = n => ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isSatisfiesExpression(n) ||
  ts.isNonNullExpression(n) || ts.isTypeAssertionExpression(n)

function unwrap (n) {
  while (isWrapper(n)) n = n.expression
  return n
}

function symbolOf (checker, n) {
  const s = checker.getSymbolAtLocation(n)
  return s && s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s
}

// --- the site finder -------------------------------------------------------------------------------------------

export function listFiles (root, dir = root) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory() && !SKIP_DIRS.has(e.name)) out.push(...listFiles(root, p))
    else if (e.isFile() && e.name.endsWith('.ts') && !e.name.endsWith('.config.ts')) out.push(p)
  }
  return out.sort()
}

export function isAssertionName (name) {
  const bare = name.replace(/^#/, '')
  const prefix = PREFIXES.find(p => bare.toLowerCase().startsWith(p))
  return Boolean(prefix) && !ACTIONS.has(bare) && !/[a-z]/.test(bare.charAt(prefix.length))
}

const calleeName = e => {
  e = unwrap(e)
  return ts.isIdentifier(e) || ts.isPrivateIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : null
}

const isExpectId = e => ts.isIdentifier(e) && e.text === 'expect'
const isConfigure = e => ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression) &&
  e.expression.name.text === 'configure' && isExpectId(e.expression.expression)

// True for expect(...), expect.soft(...), expect.poll(...), expect.configure({...})(...) and a call of a variable
// that holds expect.configure({...}).
function isExpectRoot (ctx, call) {
  const e = unwrap(call.expression)
  if (isExpectId(e) || isConfigure(e)) return true
  if (ts.isPropertyAccessExpression(e)) return isExpectId(e.expression) && ['soft', 'poll'].includes(e.name.text)
  return ts.isIdentifier(e) && Boolean(symbolOf(ctx.checker, e)?.declarations?.some(d =>
    ts.isVariableDeclaration(d) && d.initializer && isConfigure(unwrap(d.initializer))))
}

// { name, negated } for a matcher call on an expect root: expect(x).toBe(1), expect(x).not.toHaveText('a'),
// expect.poll(f).resolves.toBe(2). Else null.
function matcherOf (ctx, call) {
  if (!ts.isPropertyAccessExpression(call.expression)) return null
  let negated = false
  let e = call.expression.expression
  for (; ts.isPropertyAccessExpression(e); e = e.expression) if (e.name.text === 'not') negated = !negated
  return ts.isCallExpression(e) && isExpectRoot(ctx, e) ? { name: call.expression.name.text, negated } : null
}

function matcherRole ({ name, negated }, i, arg) {
  if (KEY_FIRST.has(name) && i === 0) return 'key'
  if (i >= (OPTIONS_AT.get(name) ?? Infinity)) return 'option'
  if (name === 'toHaveAttribute' && i === 1 && arg && ts.isObjectLiteralExpression(unwrap(arg))) return 'option'
  if (LOWER.has(name) || UPPER.has(name)) return UPPER.has(name) !== negated ? 'loose' : 'value'
  return negated ? 'negated' : 'value'
}

// { name, negated } for expect.objectContaining(...), expect.not.stringContaining(...) and similar. Else null.
function asymmetricOf (e) {
  if (!ts.isCallExpression(e) || !ts.isPropertyAccessExpression(e.expression) || !ASYMMETRIC.has(e.expression.name.text)) return null
  const base = e.expression.expression
  if (isExpectId(base)) return { name: e.expression.name.text, negated: false }
  const not = ts.isPropertyAccessExpression(base) && base.name.text === 'not' && isExpectId(base.expression)
  return not ? { name: e.expression.name.text, negated: true } : null
}

const FLIP = { value: 'negated', negated: 'value' }
const asymRole = (asym, i, role) => asym.name === 'closeTo' && i === 1 ? 'option' : asym.negated ? FLIP[role] ?? role : role

const propName = p => p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null

// The role of a property value in an object literal with the role `role`. The `message` property and the other
// option properties count only in option positions. In an expected value, they are values.
function propertyRole (role, name) {
  if (TIMING.has(name)) return 'timing'
  if (role !== 'option' && role !== 'message') return role
  if (name === 'message') return 'message'
  return role === 'option' && STATE.has(name) ? 'value' : role
}

// The roles of the arguments of a call: { helper, role(i) }, or null when the call is no assertion.
// helper: the name of an assertion helper, or null for expect() and the matchers.
function rolesOf (ctx, call) {
  if (isExpectRoot(ctx, call)) return { helper: null, role: i => (i === 0 ? 'subject' : 'message') }
  const m = matcherOf(ctx, call)
  if (m) return { helper: null, role: i => matcherRole(m, i, call.arguments[i]) }
  const name = calleeName(call.expression)
  return name && isAssertionName(name) ? { helper: name, role: i => ctx.paramKind(call, i) } : null
}

// The role of the position of `n`, a use of a helper parameter: the role of the argument or the property that holds
// it. Templates, "+", parentheses and type casts around it do not change the role. Any other use is 'value'.
function roleAt (ctx, n) {
  const isPlus = p => ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.PlusToken
  while (ts.isTemplateSpan(n.parent) || ts.isTemplateExpression(n.parent) || isPlus(n.parent) || isWrapper(n.parent)) n = n.parent
  const p = n.parent
  if (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) return propertyRole(roleAt(ctx, p.parent), propName(p))
  if (ts.isSpreadAssignment(p)) return roleAt(ctx, p.parent)
  if (ts.isArrayLiteralExpression(p) || ts.isSpreadElement(p)) return roleAt(ctx, p)
  if (ts.isNewExpression(p)) return ts.isIdentifier(p.expression) && /Error$/.test(p.expression.text) ? 'message' : 'value'
  if (!ts.isCallExpression(p) || p.expression === n) return 'value'
  const i = p.arguments.indexOf(n)
  const asym = asymmetricOf(p)
  if (asym) return asymRole(asym, i, roleAt(ctx, p))
  return rolesOf(ctx, p)?.role(i) ?? 'value'
}

// The function node of a declaration: the function itself, or the function in a variable or a property. Else null.
function functionOf (d) {
  if (!d) return null
  if (ts.isFunctionLike(d)) return d.body ? d : null
  const holds = ts.isVariableDeclaration(d) || ts.isPropertyDeclaration(d) || ts.isPropertyAssignment(d)
  const init = holds && d.initializer ? unwrap(d.initializer) : null
  return init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) ? init : null
}

// The name of a named function-like node: function, method, constructor (the class name), or a function in a
// variable or a property. Else null.
function fnName (n) {
  if ((ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n)) && n.name) return n.name.text ?? null
  if (ts.isConstructorDeclaration(n)) return n.parent.name?.text ?? null
  const p = n.parent
  if ((ts.isArrowFunction(n) || ts.isFunctionExpression(n)) && p && p.initializer === n &&
    (ts.isVariableDeclaration(p) || ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p))) return p.name.text ?? null
  return null
}

function enclosingName (n) {
  for (let p = n.parent; p; p = p.parent) {
    const name = fnName(p)
    if (name) return name
  }
  return null
}

const fnAncestors = n => {
  const out = []
  for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) out.push(p)
  return out
}

function indexDecls (sources) {
  const decls = new Map()
  for (const sf of sources.values()) {
    walk(sf, n => {
      const name = fnName(n)
      if (name && n.body) decls.set(name, [...(decls.get(name) ?? []), n])
    })
  }
  return decls
}

// The functions of the suite that a call can run: the declaration that TypeScript resolves. When the type of the
// callee is unknown (no declaration): all functions of the suite with the name of the callee. A library call: none.
function declsOf (ctx, call) {
  const d = ctx.checker.getResolvedSignature(call)?.declaration
  if (d && !ctx.inSuite(d)) return []
  const fn = functionOf(d)
  return fn ? [fn] : ctx.decls.get(calleeName(call.expression)) ?? []
}

function refsTo (body, name) {
  const refs = []
  walk(body, n => {
    if (!ts.isIdentifier(n) || n.text !== name) return
    const p = n.parent
    if ((ts.isPropertyAccessExpression(p) || ts.isPropertyAssignment(p)) && p.name === n) return
    refs.push(n)
  })
  return refs
}

// paramKind(call, i): the role of argument i of the assertion helper that `call` calls, from the uses of the
// parameter in the helper. A parameter with a Locator, Page or response type is a subject. Unknown helper: 'value'.
function paramKinds (ctx) {
  const memo = new Map()
  const kindIn = (fn, i) => {
    const params = fn.parameters
    const p = params[i] ?? (params.at(-1)?.dotDotDotToken ? params.at(-1) : undefined)
    if (!p || !ts.isIdentifier(p.name)) return 'value'
    if (p.type && SUBJECT_TYPE.test(p.type.getText())) return 'subject'
    const refs = refsTo(fn.body, p.name.text)
    return refs.length > 0 ? strongest(refs.map(r => roleAt(ctx, r))) : 'value'
  }
  return (call, i) => strongest(declsOf(ctx, call).map(fn => {
    const byIndex = memo.get(fn) ?? new Map()
    memo.set(fn, byIndex)
    if (!byIndex.has(i)) {
      byIndex.set(i, 'value') // a recursive call reads 'value'
      byIndex.set(i, kindIn(fn, i))
    }
    return byIndex.get(i)
  }))
}

function paramName (ctx, call, i) {
  const params = declsOf(ctx, call)[0]?.parameters ?? []
  const p = params[i] ?? params.at(-1)
  return p ? p.name.getText() : `#${i}`
}

// True when expr is a parameter of an assertion helper. The call sites of the helper hold its literals, and the
// script scans them, so the parameter itself is no gap.
function isForwardedParam (ctx, expr) {
  if (!ts.isIdentifier(expr)) return false
  const d = symbolOf(ctx.checker, expr)?.valueDeclaration
  const name = d && ts.isParameter(d) ? fnName(d.parent) : null
  return Boolean(name) && isAssertionName(name)
}

// The reason not to mutate a literal with this operator in this role, or null.
function blocked (role, operator) {
  if (role === 'value' || role === 'subject') return null
  if (role === 'negated' && operator === 'boolean') return null
  if (role === 'loose' && operator !== 'number') return null
  return REASON[role]
}

const computedReason = role => role === 'value' || role === 'loose' ? COMPUTED : role === 'subject' || role === 'key' ? null : REASON[role]

// Collects the sites and the not mutated expressions in one argument with the role `role`.
function collect (ctx, expr, role, extra) {
  expr = unwrap(expr)
  const m = mutation(expr, ctx.sf)
  if (m) {
    const why = blocked(role, m.operator)
    return why ? ctx.skip(expr, why, extra) : ctx.site(expr, m)
  }
  const asym = asymmetricOf(expr)
  if (asym) return expr.arguments.forEach((a, i) => collect(ctx, a, asymRole(asym, i, role), extra))
  if (ts.isArrayLiteralExpression(expr)) return expr.elements.forEach(e => collect(ctx, e, role, extra))
  if (ts.isObjectLiteralExpression(expr)) return expr.properties.forEach(p => collectProperty(ctx, p, role, extra))
  if (isForwardedParam(ctx, expr)) return
  const empty = expr.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(expr) && expr.text === 'undefined')
  const why = empty && ['value', 'loose', 'negated'].includes(role) ? 'no operator' : computedReason(role)
  if (why) ctx.skip(expr, why, extra)
}

function collectProperty (ctx, p, role, extra) {
  const r = propertyRole(role, propName(p))
  if (r === 'timing') return ctx.skip(p, REASON.timing, extra)
  if (ts.isPropertyAssignment(p)) return collect(ctx, p.initializer, r, extra)
  if (ts.isShorthandPropertyAssignment(p)) return collect(ctx, p.name, r, extra)
  if (ts.isSpreadAssignment(p)) return collect(ctx, p.expression, role, extra)
}

function onCall (ctx, call) {
  const roles = rolesOf(ctx, call)
  if (!roles) return
  call.arguments.forEach((a, i) => {
    const role = roles.role(i)
    if (role !== 'message' || !roles.helper) return collect(ctx, a, role)
    collect(ctx, a, 'helperMessage', { helper: roles.helper, param: paramName(ctx, call, i) })
  })
}

// The mutation of one literal: { operator, mutated }, or null when the node is not a literal with an operator.
export function mutation (node, sf) {
  const raw = node.getText(sf)
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { operator: 'string', mutated: `${raw.slice(0, -1)}_mut${raw.slice(-1)}` }
  }
  if (ts.isRegularExpressionLiteral(node)) {
    // The group keeps a top-level alternation whole: /a|b/ -> /(?:a|b)_mut/, not /a|b_mut/.
    const end = raw.lastIndexOf('/')
    return { operator: 'regex', mutated: `/(?:${raw.slice(1, end)})_mut${raw.slice(end)}` }
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { operator: 'boolean', mutated: 'false' }
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { operator: 'boolean', mutated: 'true' }
  if (ts.isBigIntLiteral(node)) return { operator: 'number', mutated: `${BigInt(raw.slice(0, -1).replace(/_/g, '')) + 1n}n` }
  const negative = ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)
  if (!ts.isNumericLiteral(node) && !negative) return null
  const digits = (negative ? node.operand.getText(sf) : raw).replace(/_/g, '')
  const n = Number(digits) * (negative ? -1 : 1) + 1
  const decimals = /^\d*\.(\d+)$/.exec(digits)?.[1].length
  return { operator: 'number', mutated: decimals ? n.toFixed(decimals) : String(n) }
}

// --- the call graph and the tests --------------------------------------------------------------------------------

// Map<class, its direct subclasses> for the classes of the suite.
function subclassMap (checker, sources) {
  const map = new Map()
  for (const sf of sources.values()) {
    walk(sf, n => {
      if (!ts.isClassLike(n)) return
      for (const h of n.heritageClauses ?? []) {
        if (h.token !== ts.SyntaxKind.ExtendsKeyword) continue
        for (const base of symbolOf(checker, h.types[0].expression)?.declarations ?? []) {
          if (ts.isClassLike(base)) map.set(base, [...(map.get(base) ?? []), n])
        }
      }
    })
  }
  return map
}

// The members with the name of the class member d in the subclasses of its class: a call can run any of them.
function overridesOf (ctx, d) {
  if (!ts.isClassLike(d.parent) || !d.name) return []
  const name = d.name.getText()
  const out = []
  const visit = cls => {
    for (const sub of ctx.subclasses.get(cls) ?? []) {
      for (const m of sub.members) if (m.name?.getText() === name) out.push(functionOf(m))
      visit(sub)
    }
  }
  visit(d.parent)
  return out.filter(Boolean)
}

// The functions of the suite that the code of fn refers to: by the declarations of its names, its `new` calls and
// super() calls. A method also gives the methods that override it.
function directTargets (ctx, fn) {
  if (ctx.targets.has(fn)) return ctx.targets.get(fn)
  const out = new Set()
  walk(fn, n => {
    if (ts.isIdentifier(n) || ts.isPrivateIdentifier(n)) {
      for (const d of symbolOf(ctx.checker, n)?.declarations ?? []) {
        if (!ctx.inSuite(d)) continue
        const f = functionOf(d)
        if (f && f !== fn) out.add(f)
        for (const o of overridesOf(ctx, d)) out.add(o)
      }
    } else if (ts.isNewExpression(n) || (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.SuperKeyword)) {
      const f = functionOf(ctx.checker.getResolvedSignature(n)?.declaration)
      if (f && ctx.inSuite(f)) out.add(f)
    }
  })
  ctx.targets.set(fn, [...out])
  return ctx.targets.get(fn)
}

function reachOf (ctx, starts) {
  const seen = new Set(starts)
  const queue = [...seen]
  while (queue.length > 0) {
    for (const f of directTargets(ctx, queue.pop())) if (!seen.has(f)) { seen.add(f); queue.push(f) }
  }
  return seen
}

// The fixture names that a function asks for in its first parameter: async ({ page, loginPage }) => ...
const fixtureNames = fn => {
  const p = fn.parameters?.[0]?.name
  return p && ts.isObjectBindingPattern(p) ? p.elements.map(e => (e.propertyName ?? e.name).getText()) : []
}

// The fixture functions of the test object `id` (for example `test`), from its chain of
// `const test = base.extend({...})` declarations: { byName: Map<name, functions>, auto: functions }.
function fixturesOf (ctx, id) {
  const byName = new Map()
  const auto = []
  for (const seen = new Set(); id && ts.isIdentifier(id);) {
    const decl = symbolOf(ctx.checker, id)?.declarations?.find(d => ts.isVariableDeclaration(d) && d.initializer)
    const init = decl && unwrap(decl.initializer)
    if (!init || seen.has(init) || !ts.isCallExpression(init) || !ts.isPropertyAccessExpression(init.expression) ||
      init.expression.name.text !== 'extend') break
    seen.add(init)
    const obj = init.arguments[0] && unwrap(init.arguments[0])
    for (const p of obj && ts.isObjectLiteralExpression(obj) ? obj.properties : []) {
      let fn = ts.isMethodDeclaration(p) ? p : ts.isPropertyAssignment(p) ? unwrap(p.initializer) : null
      let isAuto = false
      if (fn && ts.isArrayLiteralExpression(fn)) { // [async ({ page }, use) => ..., { auto: true }]
        const o = fn.elements[1] && unwrap(fn.elements[1])
        isAuto = Boolean(o && ts.isObjectLiteralExpression(o) && o.properties.some(q =>
          propName(q) === 'auto' && ts.isPropertyAssignment(q) && q.initializer.kind !== ts.SyntaxKind.FalseKeyword))
        fn = fn.elements[0] && unwrap(fn.elements[0])
      }
      if (!fn || !ts.isFunctionLike(fn) || !fn.body) continue
      byName.set(propName(p), [...(byName.get(propName(p)) ?? []), fn])
      if (isAuto) auto.push(fn)
    }
    id = init.expression.expression
  }
  return { byName, auto }
}

// The functions where a test starts: its body, the hooks of its file, the auto fixtures of its test object, and the
// fixtures that these ask for.
function startsOf (ctx, base, fns) {
  const fx = fixturesOf(ctx, base)
  const starts = new Set([...fns, ...fx.auto])
  const queue = [...starts]
  while (queue.length > 0) {
    for (const name of fixtureNames(queue.pop())) {
      for (const f of fx.byName.get(name) ?? []) if (!starts.has(f)) { starts.add(f); queue.push(f) }
    }
  }
  return starts
}

// test(...) and it(...) calls with a function as the last argument. reach: the functions that the test can run.
function findTests (ctx, abs, sf) {
  const tests = []
  const hooks = []
  walk(sf, n => {
    const fn = ts.isCallExpression(n) ? n.arguments.at(-1) : null
    if (!fn || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) return
    const e = n.expression
    const base = ts.isIdentifier(e) ? e : ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) ? e.expression : null
    if (base?.text !== 'test' && base?.text !== 'it') return
    const member = ts.isPropertyAccessExpression(e) ? e.name.text : null
    if (member === null || TEST_MODIFIERS.has(member)) tests.push({ n, fn, base })
    else if (HOOKS.has(member)) hooks.push(fn)
  })
  const line = pos => sf.getLineAndCharacterOfPosition(pos).line + 1
  return tests.map(({ n, fn, base }) => ({
    abs, start: n.getStart(sf), end: n.getEnd(), line: line(n.getStart(sf)), endLine: line(n.getEnd()),
    reach: reachOf(ctx, startsOf(ctx, base, [fn, ...hooks]))
  }))
}

function compilerOptions (root) {
  const file = path.join(root, 'tsconfig.json')
  const fallback = { module: ts.ModuleKind.Preserve, moduleResolution: ts.ModuleResolutionKind.Bundler, allowJs: true }
  if (!fs.existsSync(file)) return fallback
  const { config, error } = ts.readConfigFile(file, ts.sys.readFile)
  if (error) throw new Error(`cannot read ${file}: ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}`)
  return { ...fallback, ...ts.parseJsonConfigFileContent(config, ts.sys, root).options }
}

function moduleSpecifiers (sf) {
  const out = []
  walk(sf, n => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
      out.push(n.moduleSpecifier.text)
    } else if (ts.isCallExpression(n) && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0]) &&
      (n.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(n.expression) && n.expression.text === 'require'))) {
      out.push(n.arguments[0].text)
    } else if (ts.isExternalModuleReference(n) && ts.isStringLiteral(n.expression)) {
      out.push(n.expression.text)
    }
  })
  return out
}

// file -> the files of the suite that it imports (only files of the suite, not packages).
function importGraph (root, sources, options) {
  const deps = new Map()
  for (const [file, sf] of sources) {
    const out = new Set()
    for (const spec of moduleSpecifiers(sf)) {
      const resolved = ts.resolveModuleName(spec, file, options, ts.sys).resolvedModule?.resolvedFileName
      if (resolved && sources.has(path.resolve(resolved))) out.add(path.resolve(resolved))
    }
    deps.set(file, out)
  }
  return deps
}

// The spec files that import `target` directly or through other files (with `target` itself when it is a spec).
export function specsImporting (deps, target) {
  const hit = new Set([target])
  let grew = true
  while (grew) {
    grew = false
    for (const [f, ds] of deps) if (!hit.has(f) && [...ds].some(d => hit.has(d))) { hit.add(f); grew = true }
  }
  return [...hit].filter(isSpec).sort()
}

// Finds the mutation sites, the not mutated expressions, the tests and the import graph of the suite in `root`.
// Each site has reachedBy: the tests that can run its code.
export function analyse (rootDir) {
  const root = fs.realpathSync(rootDir)
  const files = listFiles(root)
  const options = { ...compilerOptions(root), noEmit: true }
  const program = ts.createProgram(files, options, ts.createCompilerHost(options, true))
  const sources = new Map(files.map(f => {
    const sf = program.getSourceFile(f)
    if (!sf) throw new Error(`TypeScript did not load ${f}`)
    return [f, sf]
  }))
  const suiteFiles = new Set(sources.values())
  const checker = program.getTypeChecker()
  const ctx = {
    checker,
    inSuite: n => suiteFiles.has(n.getSourceFile()),
    decls: indexDecls(sources),
    subclasses: subclassMap(checker, sources),
    targets: new Map()
  }
  ctx.paramKind = paramKinds(ctx)
  const sites = []
  const notMutated = []
  for (const [abs, sf] of sources) {
    const file = posix(root, abs)
    const at = n => ({ file, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1 })
    const fctx = {
      ...ctx,
      sf,
      site: (n, m) => sites.push({ ...at(n), abs, start: n.getStart(sf), end: n.getEnd(), original: n.getText(sf), ...m, enclosing: enclosingName(n), fns: fnAncestors(n) }),
      skip: (n, reason, extra) => notMutated.push({ ...at(n), text: oneLine(n.getText(sf)), reason, ...extra })
    }
    walk(sf, n => { if (ts.isCallExpression(n)) onCall(fctx, n) })
  }
  const tests = [...sources].filter(([f]) => isSpec(f)).flatMap(([f, sf]) => findTests(ctx, f, sf))
  for (const t of tests) t.file = posix(root, t.abs)
  sites.sort((a, b) => a.file.localeCompare(b.file) || a.start - b.start)
  sites.forEach((s, i) => {
    s.id = `S${String(i + 1).padStart(3, '0')}`
    s.test = tests.find(t => t.abs === s.abs && s.start >= t.start && s.end <= t.end) ?? null
    s.reachedBy = s.test ? [s.test] : tests.filter(t => s.fns.some(f => t.reach.has(f)))
  })
  return { root, sources, sites, notMutated, tests, deps: importGraph(root, sources, options) }
}

// --- mutate and restore ------------------------------------------------------------------------------------------

export function applyMutant (text, site) {
  const at = text.charCodeAt(0) === 0xFEFF ? 1 : 0 // the TypeScript host drops a BOM: its positions start after it
  const [start, end] = [site.start + at, site.end + at]
  if (text.slice(start, end) !== site.original) throw new Error(`${site.file}:${site.line} does not hold ${site.original}`)
  return text.slice(0, start) + site.mutated + text.slice(end)
}

// Writes the mutant, calls fn, then writes the original bytes back and checks their sha256.
export function withMutant (site, fn) {
  const original = fs.readFileSync(site.abs)
  const hash = sha256(original)
  fs.writeFileSync(site.abs, applyMutant(original.toString('utf8'), site))
  try {
    return fn()
  } finally {
    fs.writeFileSync(site.abs, original)
    const back = sha256(fs.readFileSync(site.abs))
    if (back !== hash) throw new Error(`restore of ${site.file} failed: sha256 ${back}, expected ${hash}`)
  }
}

// --- the runner ------------------------------------------------------------------------------------------------

// required: stop when the suite has no node_modules. Else link node_modules only when it exists.
function copySuite (label, suiteDir, ref, required) {
  const suite = path.resolve(suiteDir)
  const commit = must('git', ['-C', suite, 'rev-parse', '--verify', `${ref}^{commit}`])
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `audit-mutate-${label}-`)))
  const tar = `${dir}.tar`
  const modules = path.join(suite, 'node_modules')
  const linked = fs.existsSync(modules)
  try {
    must('git', ['-C', suite, 'archive', '--format=tar', '-o', tar, commit])
    must('tar', ['-xf', tar, '-C', dir])
    if (required && !linked) throw new Error(`no ${modules}. Run npm ci in the suite first.`)
    if (linked) fs.symlinkSync(modules, path.join(dir, 'node_modules'), 'dir')
  } catch (e) {
    removeCopy(dir)
    throw e
  } finally {
    fs.rmSync(tar, { force: true })
  }
  return { dir, commit, linked }
}

// Removes the symlink first, so the remove cannot touch node_modules of the suite.
function removeCopy (dir) {
  const link = path.join(dir, 'node_modules')
  if (fs.lstatSync(link, { throwIfNoEntry: false })?.isSymbolicLink()) fs.unlinkSync(link)
  fs.rmSync(dir, { recursive: true, force: true })
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const fileArg = file => `(?:^|/)${escapeRe(file)}$` // Playwright reads a CLI file filter as a regex

function playwright (dir, reportFile, targets) {
  fs.rmSync(reportFile, { force: true })
  return run('npx', ['playwright', 'test', '--retries=0', '--reporter=json', ...targets],
    { cwd: dir, env: { ...env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile } })
}

// The tests of a Playwright JSON report with their location: [{ key, abs, line }]. The key is the key of readReport().
function reportTests (file) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'))
  const out = []
  const visit = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      out.push({ key: `${spec.file} :: ${[...titles, spec.title].join(' > ')}`, abs: path.join(report.config.rootDir, spec.file), line: spec.line })
    }
    for (const child of suite.suites ?? []) visit(child, [...titles, child.title])
  }
  for (const s of report.suites ?? []) visit(s, [])
  return out
}

const outcome = t => !t ? 'missing' : t.statuses.some(s => FAILED.has(s)) ? 'failed' : passedAll(t) ? 'passed' : 'missing'

function verdict (reportFile, keys, r) {
  if (!fs.existsSync(reportFile)) return { status: 'error', results: {}, note: `no report, exit ${r.code}: ${oneLine(r.out.slice(-300))}` }
  const rep = readReport(reportFile)
  const results = Object.fromEntries(keys.map(k => [k, outcome(rep.tests[k])]))
  const values = Object.values(results)
  const status = values.includes('failed') ? 'killed' : values.every(v => v === 'passed') ? 'survived' : 'error'
  const note = status === 'error' ? `no result for a selected test${rep.errors.length ? `: ${rep.errors.join(' | ')}` : ''}` : undefined
  return { status, results, note }
}

// Runs the selected tests with the mutant. A failed test kills the mutant only when it passes again on the original
// file. Else the failure comes from a flaky test or from the app state, and the status is error.
function runMutant (dir, raw, site, sel, target) {
  const reportFile = path.join(raw, `${site.id}.json`)
  const res = withMutant(site, () => playwright(dir, reportFile, sel.targets))
  const v = verdict(reportFile, sel.keys, res)
  if (v.status !== 'killed') return v
  const failed = sel.keys.filter(k => v.results[k] === 'failed')
  const againFile = path.join(raw, `${site.id}-again.json`)
  const r = playwright(dir, againFile, [...new Set(failed.map(target))])
  const again = fs.existsSync(againFile) ? readReport(againFile).tests : {}
  const killers = failed.filter(k => outcome(again[k]) === 'passed')
  const unconfirmed = failed.filter(k => !killers.includes(k))
  if (killers.length > 0) return { ...v, killers, unconfirmed }
  return { ...v, status: 'error', killers, unconfirmed, note: `the failed tests do not pass on the original file either (flaky test or app state), exit ${r.code}` }
}

// The tests that a mutant counts for in the table of tests: the tests that killed it. Else the selected tests that
// run the code of its site. With no such test: the row UNATTRIBUTED.
function counted (site, m, where) {
  if (m.status === 'killed') return m.killers
  const keys = m.tests.filter(k => site.reachedBy.includes(where.get(k)))
  return keys.length > 0 ? keys : [UNATTRIBUTED]
}

function select (a, site, located, leftOut) {
  if (site.test) {
    const keys = site.test.keys.filter(k => !leftOut.has(k))
    const note = site.test.keys.length === 0 ? 'the test is not in the baseline report' : 'the test fails at the baseline'
    return { keys, targets: [`${fileArg(site.test.file)}:${site.test.reportLine}`], note }
  }
  const specs = new Set(specsImporting(a.deps, site.abs))
  const keys = [...new Set(located.filter(w => specs.has(w.abs) && !leftOut.has(w.key)).map(w => w.key))]
  const files = [...new Set(located.filter(w => keys.includes(w.key)).map(w => posix(a.root, w.abs)))]
  const note = specs.size === 0 ? 'no spec file imports this file' : 'no test of the importing spec files passes at the baseline'
  return { keys, targets: files.map(fileArg), note }
}

const realApp = {
  check: () => { if (!appTreeIsClean()) throw new Error('juice-shop/ has changes. Revert them before this run.') },
  restart: () => { stopApp(); log(`  ${startApp(false)}`) },
  stop: () => stopApp()
}

export function audit ({ label, suite, ref = 'HEAD', out = `mutate-${label}`, restartEvery = 5, max = Infinity, results = RESULTS, app = realApp }) {
  app.check()
  const { dir, commit } = copySuite(label, suite, ref, true)
  const raw = path.join(results, out)
  try {
    const a = analyse(dir)
    fs.mkdirSync(raw, { recursive: true })
    log(`${label}: ${a.sites.length} sites in ${a.sources.size} files, ${a.tests.length} tests. Copy of ${ref} (${commit.slice(0, 7)}) in ${dir}`)
    app.restart()
    const baseFile = path.join(raw, 'baseline.json')
    const r = playwright(dir, baseFile, [])
    if (!fs.existsSync(baseFile)) throw new Error(`no baseline report, exit ${r.code}:\n${r.out.slice(-2000)}`)
    const base = readReport(baseFile)
    const located = reportTests(baseFile)
    const where = new Map()
    for (const t of a.tests) {
      const mine = located.filter(w => w.abs === t.abs && w.line >= t.line && w.line <= t.endLine)
      t.keys = [...new Set(mine.map(w => w.key))]
      t.reportLine = mine[0]?.line ?? t.line
      for (const k of t.keys) where.set(k, t)
    }
    const target = k => {
      const w = located.find(x => x.key === k)
      return `${fileArg(posix(a.root, w.abs))}:${w.line}`
    }
    const leftOut = new Set(Object.keys(base.tests).filter(k => !passedAll(base.tests[k])))
    if (leftOut.size === Object.keys(base.tests).length) {
      throw new Error(`no test passes at the baseline (${leftOut.size} tests). Check the app. Report errors: ${base.errors.join(' | ') || 'none'}`)
    }
    log(`baseline: ${Object.keys(base.tests).length} tests, ${leftOut.size} left out (fail at the baseline), exit ${r.code}`)

    const mutants = []
    const save = complete => {
      const result = summarize({ label, suite, ref, commit, restartEvery, max, a, base, leftOut, mutants, complete, out })
      fs.writeFileSync(path.join(results, `${out}.json`), JSON.stringify(result, null, 2) + '\n')
      fs.writeFileSync(path.join(results, `${out}.md`), toMarkdown(result))
      return result
    }
    let ran = 0
    for (const site of a.sites.slice(0, max)) {
      const sel = select(a, site, located, leftOut)
      const m = { id: site.id, file: site.file, line: site.line, operator: site.operator, original: site.original, mutated: site.mutated, function: site.enclosing, targets: sel.targets, tests: sel.keys }
      if (sel.keys.length === 0) {
        Object.assign(m, { status: 'skipped', note: sel.note, results: {}, counted: [] })
        log(`${m.id} ${m.file}:${m.line} skipped: ${sel.note}`)
      } else {
        if (ran % restartEvery === 0) app.restart()
        ran++
        const started = Date.now()
        Object.assign(m, runMutant(dir, raw, site, sel, target))
        m.counted = counted(site, m, where)
        log(`${m.id} ${m.file}:${m.line} ${oneLine(m.original)} -> ${oneLine(m.mutated)}: ${m.status} (${sel.keys.length} test${sel.keys.length === 1 ? '' : 's'}, ${Math.round((Date.now() - started) / 1000)}s)`)
      }
      mutants.push(m)
      save(false)
    }
    const result = save(true)
    log(`saved: ${path.join(results, `${out}.json`)} and .md`)
    return result
  } finally {
    removeCopy(dir)
    try { app.stop() } catch (e) { log(`warning: ${e.message}`) }
  }
}

function summarize ({ label, suite, ref, commit, restartEvery, max, a, base, leftOut, mutants, complete, out }) {
  const count = s => mutants.filter(m => m.status === s).length
  const row = id => ({ id, sites: 0, killed: 0, survived: 0, error: 0 })
  const tests = Object.fromEntries(Object.keys(base.tests).filter(k => !leftOut.has(k)).sort()
    .map((k, i) => [k, row(`T${String(i + 1).padStart(2, '0')}`)]))
  for (const m of mutants) {
    for (const k of m.counted) {
      const r = (tests[k] ??= row('-'))
      r.sites++
      r[m.status]++
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    label, suite, ref, commit, typescript: ts.version, restartEvery, max: Number.isFinite(max) ? max : null, complete,
    totals: { sites: a.sites.length, mutants: mutants.length, killed: count('killed'), survived: count('survived'), error: count('error'), skipped: count('skipped') },
    baseline: { report: `${out}/baseline.json`, tests: Object.keys(base.tests).length, leftOut: [...leftOut].map(k => ({ test: k, statuses: base.tests[k].statuses })) },
    tests,
    mutants,
    notMutated: a.notMutated
  }
}

// Inline code for the report. The STE linter skips inline code, so data in a cell cannot give a violation.
const cell = s => {
  const t = oneLine(String(s)).replace(/\|/g, '\\|')
  return t.includes('`') ? `\`\` ${t} \`\`` : `\`${t}\``
}

export function toMarkdown (r) {
  const t = r.totals
  const ids = keys => keys.map(k => r.tests[k]?.id ?? '?').join(', ')
  // A mutant with a failed test shows the failed tests. Any other mutant shows the selected tests.
  const testsCell = m => m.unconfirmed
    ? `failed: ${ids([...m.killers, ...m.unconfirmed])}${m.unconfirmed.length ? `. Failed again on the original: ${ids(m.unconfirmed)}` : ''}`
    : m.tests.length ? `ran ${ids(m.tests)}` : '-'
  const groups = NOT_MUTATED.flatMap(([reason, , title, text]) => {
    const rows = r.notMutated.filter(n => n.reason === reason)
    return ['', `### ${title} (${rows.length})`, '', ...(text ? [text, ''] : []),
      ...(rows.length ? rows.map(n => `- ${cell(`${n.file}:${n.line}`)}${n.helper ? ` ${cell(`${n.helper}(${n.param})`)}` : ''} ${cell(n.text)}`) : ['None.'])]
  })
  return [
    `# Expectation mutation audit: ${r.label}`,
    '',
    `Source: \`bench/run-audit-mutate.mjs\`, ${r.generatedAt}. Suite: \`${r.suite}\` at \`${r.ref}\` (${r.commit.slice(0, 12)}). TypeScript ${r.typescript}.`,
    `The app restarts before the baseline, before the first mutant and after each ${r.restartEvery} mutants.${r.max ? ` Limit: the first ${r.max} sites.` : ''}`,
    ...(r.complete ? [] : ['', `**Not complete.** The run stopped after ${t.mutants} of ${t.sites} sites. This file holds only the finished mutants.`]),
    '',
    `Sites: ${t.sites}. Mutants: ${t.mutants}. Killed: ${t.killed}. Survived: ${t.survived}. Error: ${t.error}. Skipped: ${t.skipped}.`,
    'A mutant that survives shows a weak check.',
    'A failed test kills a mutant only when the test passes again on the original file.',
    '',
    '## Tests',
    '',
    'A killed mutant counts for the tests that killed it.',
    'Any other mutant counts for the selected tests that run the code of its site.',
    'The call graph uses the declarations that TypeScript finds, the fixtures and the hooks.',
    `If no selected test runs the code, the mutant counts for the row \`${UNATTRIBUTED}\`.`,
    '',
    '| ID | Test | Sites | Killed | Survived | Error |',
    '|---|---|---|---|---|---|',
    ...Object.entries(r.tests).map(([k, v]) => `| ${v.id} | ${cell(k)} | ${v.sites} | ${v.killed} | ${v.survived} | ${v.error} |`),
    '',
    '## Mutants',
    '',
    '| ID | Site | Function | Original | Mutated | Tests | Status |',
    '|---|---|---|---|---|---|---|',
    ...r.mutants.map(m => `| ${m.id} | ${cell(`${m.file}:${m.line}`)} | ${m.function ? cell(m.function) : '-'} | ${cell(m.original)} | ${cell(m.mutated)} | ${testsCell(m)} | ${m.status}${m.note ? ` ${cell(m.note)}` : ''} |`),
    '',
    '## Left-out tests (they fail at the baseline)',
    '',
    ...(r.baseline.leftOut.length ? r.baseline.leftOut.map(l => `- ${cell(l.test)} [${l.statuses.join(', ')}]`) : ['None.']),
    '',
    '## Not mutated',
    ...groups,
    ''
  ].join('\n')
}

// --- --list ------------------------------------------------------------------------------------------------------

export function listing (a) {
  const lines = []
  for (const s of a.sites) {
    const where = s.test ? `test at line ${s.test.line}`
      : `specs: ${specsImporting(a.deps, s.abs).map(f => posix(a.root, f)).join(', ') || 'none'}; runs in: ${s.reachedBy.map(t => `${t.file}:${t.line}`).join(', ') || 'no test'}`
    lines.push(`${s.id} ${s.file}:${s.line} ${oneLine(s.original)} -> ${oneLine(s.mutated)} [${where}]`)
  }
  for (const [reason] of NOT_MUTATED) {
    const rows = a.notMutated.filter(n => n.reason === reason)
    if (rows.length > 0) lines.push('', `not mutated: ${reason} (${rows.length})`)
    for (const n of rows) lines.push(`  ${n.file}:${n.line}${n.helper ? ` ${n.helper}(${n.param})` : ''} ${n.text}`)
  }
  const cols = [['sites', 'sites'], ...NOT_MUTATED.map(([reason, short]) => [reason, short])]
  const rows = new Map()
  const bump = (file, col) => {
    const r = rows.get(file) ?? Object.fromEntries(cols.map(([c]) => [c, 0]))
    r[col]++
    rows.set(file, r)
  }
  for (const s of a.sites) bump(s.file, 'sites')
  for (const n of a.notMutated) bump(n.file, n.reason)
  const total = Object.fromEntries(cols.map(([c]) => [c, [...rows.values()].reduce((sum, r) => sum + r[c], 0)]))
  const width = Math.max(5, ...[...rows.keys()].map(f => f.length))
  const row = (name, r) => `${name.padEnd(width)}  ${cols.map(([c, short]) => String(r[c]).padStart(short.length)).join('  ')}`
  lines.push('', `${'file'.padEnd(width)}  ${cols.map(([, short]) => short).join('  ')}`)
  for (const [f, r] of [...rows].sort(([x], [y]) => x.localeCompare(y))) lines.push(row(f, r))
  lines.push(row('total', total))
  return lines.join('\n')
}

function main () {
  const [label, ...rest] = (opt('--suite') ?? '').split('=')
  if (!/^[\w.-]+$/.test(label) || rest.length === 0) throw new Error('usage: --suite <label>=<path> [--ref <ref>] [--out <name>] [--restart-every 5] [--max <n>] [--list]')
  const suite = path.resolve(rest.join('='))
  const ref = opt('--ref', 'HEAD')
  if (process.argv.includes('--list')) {
    const { dir, commit, linked } = copySuite(label, suite, ref, false)
    try {
      const types = linked ? 'node_modules linked' : 'no node_modules: the call graph does not see the fixture types'
      console.log(`${label}: ${suite} at ${ref} (${commit.slice(0, 12)}), TypeScript ${ts.version}, ${types}\n`)
      console.log(listing(analyse(dir)))
    } finally {
      removeCopy(dir)
    }
    return
  }
  const restartEvery = Number(opt('--restart-every', 5))
  const max = opt('--max') ? Number(opt('--max')) : Infinity
  if (!(restartEvery >= 1) || !(max >= 1)) throw new Error('--restart-every and --max must be 1 or more')
  const r = audit({ label, suite, ref, out: opt('--out', `mutate-${label}`), restartEvery, max })
  console.log(`\n${label}: ${r.totals.killed} killed, ${r.totals.survived} survived, ${r.totals.error} error, ${r.totals.skipped} skipped of ${r.totals.mutants}`)
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    main()
  } catch (e) {
    console.error(`error: ${e.message}`)
    process.exit(1)
  }
}
