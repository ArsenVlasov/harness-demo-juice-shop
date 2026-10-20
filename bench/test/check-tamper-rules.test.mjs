// Tests of bench/check-tamper-rules.mjs (the check of the rules file of the binder session) and of
// bench/make-binder-folder.sh.
//
//   node --test bench/test/check-tamper-rules.test.mjs
//
// The binding tables come from the current bench/hypotheses-v2.md, by `check-tamper-rules.mjs --tables`. Thus the
// tests use the real rules T01 to T16, their kinds and the real literal values of the table of candidate values.
// The capture file is made up: the JSON shapes of a small shop, with values from the table of candidate values, in the
// format of bench/tag-capture.mjs (each line with "tc" and "test").
// The tests of make-binder-folder.sh use a temp folder as RUNS (CL_RUNS) and the real lab. The script reads only the
// tag test-cases-v1, bench/hypotheses-v2.md, bench/tamper-rules.example.json and bench/check-tamper-rules.mjs of the lab.
// Temp files go to the system temp folder. The tests remove them at the end.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, describe, test } from 'node:test'
import { LAB } from '../lib.mjs'
import { bindingTables, check, fieldsText, literalsOf, loadRulesProblems, markdownTables, otherId, pathForm, readCaptures, tablesText } from '../check-tamper-rules.mjs'
import { loadRules } from '../tamper-proxy.mjs'

const NODE = process.execPath
const CHECK = path.join(LAB, 'bench', 'check-tamper-rules.mjs')
const MAKE = path.join(LAB, 'bench', 'make-binder-folder.sh')
const HYP = path.join(LAB, 'bench', 'hypotheses-v2.md')
const EXAMPLE = path.join(LAB, 'bench', 'tamper-rules.example.json')
const STE_LINT = path.join(LAB, '.claude', 'skills', 'asd-ste100', 'scripts', 'ste-lint.py')
const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'check-tamper-rules-')))
after(() => fs.rmSync(TMP, { recursive: true, force: true }))

const sha256 = data => crypto.createHash('sha256').update(data).digest('hex')
const write = (name, text) => { const f = path.join(TMP, name); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); return f }
const jsonl = lines => lines.map(l => JSON.stringify(l)).join('\n') + '\n'
const node = (args, opts = {}) => {
  const r = spawnSync(NODE, args, { encoding: 'utf8', ...opts })
  return { code: r.status, out: r.stdout, err: r.stderr, lines: r.stdout.trimEnd().split('\n') }
}

// The binding tables of the current hypotheses-v2.md.
const TABLES_TEXT = tablesText(fs.readFileSync(HYP))
const TABLES = write('binding-tables.md', TABLES_TEXT)
const RULE_IDS = Array.from({ length: 16 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`)

// A made-up shop. The values come from the column "Value in v1" of the table of candidate values.
let testNo = 0
const at = (method, p, body, status, tc) => ({ time: '2026-10-20T12:00:00.000Z', tc, test: tc === null ? null : ++testNo, method, path: p, status, contentType: 'application/json; charset=utf-8', body })
const ORDER_ID = '5267-f9cd5882f54c75a3'
const SHOP = [
  at('GET', '/api/products?q=', { status: 'success', data: [{ id: 1, name: 'Eggfruit Juice (500ml)', price: 8.99 }, { id: 2, name: 'Apple Juice (1000ml)', price: 1.99 }] }, 200, 'TC-02'),
  { ...at('GET', '/main.js', null, 200, null), contentType: 'application/javascript', bodyBytes: 5120 },
  at('POST', '/api/login', { error: 'Invalid email or password.' }, 401, 'TC-01'),
  at('GET', '/api/whoami', { user: { id: 21, email: 'tc01-x@example.test', image: '/assets/u.png' } }, 200, 'TC-01'),
  at('GET', '/api/basket/7', { data: { id: 7, items: [{ name: 'Eggfruit Juice (500ml)', price: 8.99, quantity: 1 }] } }, 200, 'TC-02'),
  at('GET', '/api/basket/8', { data: { id: 8, items: [{ name: 'Apple Juice (1000ml)', price: 1.99, quantity: 5 }] } }, 200, 'TC-04'),
  at('PUT', '/api/basket-items/12', { error: 'You can order only up to 5 items of this product.' }, 400, 'TC-04'),
  at('GET', '/api/deliveries', { data: [{ name: 'Standard Delivery', price: 0.99 }, { name: 'Fast Delivery', price: 0.5 }] }, 200, 'TC-05'),
  at('PUT', '/api/basket/7/coupon/abc', { discount: 10 }, 200, 'TC-05'),
  at('GET', `/api/orders/${ORDER_ID}`, { data: { totalPrice: 19.86, items: 20.97, delivery: 0.99, promotion: 2.1, products: [{ quantity: 2 }, { quantity: 1 }] } }, 200, 'TC-07'),
  at('GET', '/api/order-history', { data: [{ orderId: ORDER_ID, totalPrice: 19.86, bonus: 1, products: [{ quantity: 2 }, { quantity: 1 }] }] }, 200, 'TC-07'),
  at('GET', '/api/wallet', { status: 'success', data: '5.00' }, 200, 'TC-08'),
  at('GET', '/api/mixed/1', { v: 1 }, 200, 'TC-08'),
  at('GET', '/api/mixed/2', { v: '1' }, 200, 'TC-08')
]
const CAPTURE = write('capture.jsonl', jsonl(SHOP))
// A second capture with a different order ID, as from a second run.
const ORDER_2 = write('capture-2.jsonl', jsonl([{ ...SHOP[9], path: '/api/orders/0be3-c1a9d4f27e88aa01' }]))

const rule = (id, what, method, p, field, op = 'add', value = 1) => ({ id, what, method, path: p, field, op, value })
const ORDER = '^/api/orders/[^/?]+$'
const HISTORY = '^/api/order-history$'
const PASS = {
  rules: [
    rule('T01-a', 'the price of a product in the list', 'GET', '^/api/products(\\?|$)', 'data[*].price'),
    rule('T02-a', 'the price of a basket item', 'GET', '^/api/basket/\\d+$', 'data.items[*].price'),
    rule('T03-a', 'the quantity of a basket item', 'GET', '^/api/basket/\\d+$', 'data.items[*].quantity'),
    rule('T04-a', 'the price of a delivery speed', 'GET', '^/api/deliveries$', 'data[*].price'),
    rule('T05-a', 'the discount of the coupon', 'PUT', '^/api/basket/\\d+/coupon/', 'discount'),
    rule('T06-a', 'the total of the saved order', 'GET', ORDER, 'data.totalPrice'),
    rule('T07-a', 'the quantity of a product in the saved order', 'GET', ORDER, 'data.products[*].quantity'),
    rule('T08-a', 'the line Items of the saved order', 'GET', ORDER, 'data.items'),
    rule('T08-b', 'the line Delivery of the saved order', 'GET', ORDER, 'data.delivery'),
    rule('T08-c', 'the line Promotion of the saved order', 'GET', ORDER, 'data.promotion'),
    rule('T09-a', 'the total of an order in the history', 'GET', HISTORY, 'data[*].totalPrice'),
    rule('T10-a', 'the quantity of a product in the history', 'GET', HISTORY, 'data[*].products[*].quantity'),
    rule('T11-a', 'the order ID in the history', 'GET', HISTORY, 'data[*].orderId', 'set', 'MUT'),
    rule('T12-a', 'the bonus points of an order', 'GET', HISTORY, 'data[*].bonus'),
    rule('T13-a', 'the wallet balance', 'GET', '^/api/wallet$', 'data', 'addNumberString', 1),
    rule('T14-a', 'the email of the customer', 'GET', '^/api/whoami$', 'user.email', 'set', 'mut@example.test'),
    rule('T15-a', 'the login error message', 'POST', '^/api/login$', 'error', 'set', 'MUT'),
    rule('T15-b', 'the error message of the maximum quantity', 'PUT', '^/api/basket-items/\\d+$', 'error', 'set', 'MUT')
  ],
  unbound: [{ rule: 'T16', reason: 'no JSON field holds the name of the payment method' }]
}

let n = 0
// Runs the check CLI on a rules document (an object, or a text for a broken file).
function runCheck (doc, { tables = TABLES, captures = [CAPTURE] } = {}) {
  const file = write(`rules-${++n}.json`, typeof doc === 'string' ? doc : JSON.stringify(doc, null, 2))
  return node([CHECK, file, tables, ...captures])
}
const variant = change => { const d = structuredClone(PASS); change(d); return d }
const ruleOf = (d, id) => d.rules.find(r => r.id === id)
const unbindAll = (d, keep) => {
  d.rules = d.rules.filter(r => keep.includes(r.id.slice(0, 3)))
  d.unbound = RULE_IDS.filter(id => !keep.includes(id)).map(id => ({ rule: id, reason: 'no JSON field holds the value' }))
}

describe('the check passes', () => {
  test('the good rules file: exit 0, an ok line for each rule, notes for K5, PASSED as the last line', () => {
    const r = runCheck(PASS)
    assert.equal(r.code, 0, r.out + r.err)
    assert.equal(r.lines.at(-1), 'PASSED: all checks')
    assert.equal(r.lines.filter(l => l.startsWith('ok ')).length, PASS.rules.length)
    assert.ok(r.lines.includes('ok T01-a: 1 response, 2 values at data[*].price, op add 1, K5 8.99'), r.out)
    assert.ok(r.lines.includes('ok T13-a: 1 response, 1 value at data, op addNumberString 1, K5 "5.00"'), r.out)
    assert.ok(r.lines.includes('ok T08-c: 1 response, 1 value at data.promotion, op add 1, K5 2.1'), r.out)
    assert.ok(r.lines.includes('ok T15-b: 1 response, 1 value at error, op set "MUT", K5 "You can order only up to 5 items of this product."'), r.out)
    // T11: the rows give no text literal ("the ID of step 7"). T14: the rows give no literal.
    assert.deepEqual(r.lines.filter(l => l.startsWith('note ')), [
      'note K5 T11-a: the rows of T11 give no text literal, so K5 checks only the kind (order ID)',
      'note K5 T14-a: the rows of T14 give no text literal, so K5 checks only the kind (email)'
    ])
    assert.equal(r.lines.filter(l => /^K\d/.test(l)).length, 0)
  })

  test('the check runs alone in a work folder, with no file of the lab', () => {
    const dir = path.join(TMP, 'standalone')
    fs.mkdirSync(dir)
    fs.copyFileSync(CHECK, path.join(dir, 'check-tamper-rules.mjs'))
    fs.copyFileSync(TABLES, path.join(dir, 'binding-tables.md'))
    fs.copyFileSync(CAPTURE, path.join(dir, 'capture-1.jsonl'))
    fs.writeFileSync(path.join(dir, 'tamper-rules.json'), JSON.stringify(PASS))
    const r = node(['check-tamper-rules.mjs', 'tamper-rules.json', 'binding-tables.md', 'capture-1.jsonl'], { cwd: dir })
    assert.equal(r.code, 0, r.out + r.err)
    assert.equal(r.lines.at(-1), 'PASSED: all checks')
    const imports = [...fs.readFileSync(CHECK, 'utf8').matchAll(/^import .* from '([^']+)'/gm)].map(m => m[1])
    assert.ok(imports.length > 0 && imports.every(i => i.startsWith('node:')), imports.join(', '))
  })

  test('two capture files: the values of both count, and a general path matches both order IDs', () => {
    const [first, ...rest] = SHOP
    const a = write('two/capture-A.jsonl', jsonl([first]))
    const b = write('two/capture-B.jsonl', jsonl(rest))
    const r = runCheck(PASS, { captures: [a, b, ORDER_2] })
    assert.equal(r.code, 0, r.out + r.err)
    assert.ok(r.lines.includes('ok T06-a: 2 responses, 2 values at data.totalPrice, op add 1, K5 19.86'), r.out)
  })

  test('K2: a bound rule that leaves out a text in a JSON field gives a note, not a problem', () => {
    const r = runCheck(variant(d => { d.rules = d.rules.filter(x => x.id !== 'T15-b') }))
    assert.equal(r.code, 0, r.out + r.err)
    assert.ok(r.lines.includes('note K2 T15: no entry of the rule gives this text of the rule, but the capture holds it in a JSON field: ' +
      '"You can order only up to 5 items of this product." at PUT /api/basket-items/\\d+, field error (TC-04). ' +
      'Bind the field when the page of the rule\'s steps shows the text from it.'), r.out)
  })

  test('K2: a rule in "unbound" passes when its text is only in a response of a different test case', () => {
    const shop = SHOP.map(l => l.path === '/api/login' ? { ...l, tc: 'TC-03' } : l.path === '/api/basket-items/12' ? { ...l, tc: 'TC-02' } : l)
    const cap = write('k2/other-tc.jsonl', jsonl(shop))
    const r = runCheck(variant(d => {
      d.rules = d.rules.filter(x => !x.id.startsWith('T15'))
      d.unbound.push({ rule: 'T15', reason: 'no JSON field holds a message of the steps' })
    }), { captures: [cap] })
    assert.equal(r.code, 0, r.out + r.err)
    assert.ok(!r.lines.some(l => l.includes('T15')), r.out)
  })
})

// Each broken variant: the change, the expected problem line, the number of problems, and the capture files.
const BROKEN = [
  ['K1: an op that does not exist', d => { d.rules[0].op = 'plus' }, /^K1 rule T01-a: "op" must be one of: add, mul, set, suffix, addNumberString$/, 1],
  ['K1: an id with the wrong form', d => { d.rules[0].id = 'T1-a' }, /^K1 rule T1-a: the id must have the form T01-a/, 2], // and K2 T01
  ['K1: an id out of T01 to T16', d => { d.rules[0].id = 'T17-a' }, /^K1 rule T17-a: the id must have the form T01-a/, 2],
  ['K1: an unknown key', d => { d.rules[0].note = 'x' }, /^K1 rule T01-a: unknown keys: note$/, 1],
  ['K1: a path with no ^', d => { d.rules[0].path = '/api/products' }, /^K1 rule T01-a: the path must start with \^$/, 1],
  ['K1: a value of the wrong type', d => { d.rules[0].value = '1' }, /^K1 rule T01-a: "value" must be a number for op add$/, 1],
  ['K1: two ids that differ only in letter case', d => { d.rules.push({ ...d.rules[0], id: 't01-A' }) }, /^K1 rule t01-A: the id is not unique/, 2],
  ['K2: a rule in neither list', d => { d.unbound = [] }, /^K2 T16: the rule has no binding and is not in "unbound"$/, 1],
  ['K2: a rule in both lists', d => { d.unbound.push({ rule: 'T13', reason: 'no JSON field' }) }, /^K2 T13: the rule has a binding \(T13-a\) and is also in "unbound"\. Keep only one\.$/, 1],
  ['K2: a reason that is not "no JSON field"', d => { d.unbound[0].reason = 'the page builds the name' }, /^K2 "unbound" entry 1 \(T16\): the reason must start with "no JSON field"$/, 1],
  ['K2: an unbound rule that is not in the table', d => { d.unbound.push({ rule: 'T17', reason: 'no JSON field' }) }, /^K2 "unbound" entry 2: "rule" "T17" is not a rule of the table "The rules"$/, 1],
  ['K2: no "unbound" array', d => { delete d.unbound }, /^K2 no "unbound" array/, 2], // and K2 T16
  ['K2: a rule in "unbound" with its texts in JSON fields', d => {
    d.rules = d.rules.filter(r => !r.id.startsWith('T15'))
    d.unbound.push({ rule: 'T15', reason: 'no JSON field holds a message' })
  }, /^K2 T15: the rule is in "unbound", but the capture holds its text in a JSON field: "Invalid email or password\." at POST \/api\/login, field error \(TC-01\); "You can order only up to 5 items of this product\." at PUT \/api\/basket-items\/\\d\+, field error \(TC-04\)\. Bind these fields\.$/, 1],
  ['K2: one bound rule and 15 rules in "unbound"', d => unbindAll(d, ['T01']), /^K2 T15: the rule is in "unbound", but the capture holds its text in a JSON field: "Invalid email or password\."/, 1],
  ['K3: a field that is not in the capture', d => { ruleOf(d, 'T02-a').field = 'data.items[*].cost' }, /^K3 T02-a: the field data\.items\[\*\]\.cost gives no value in the 2 responses that match GET \^\/api\/basket\/\\d\+\$ \(\/api\/basket\/7, \/api\/basket\/8\)$/, 1],
  ['K3: a path that is not in the capture', d => { ruleOf(d, 'T04-a').path = '^/api/delivery-methods$' }, /^K3 T04-a: no captured response with a JSON body matches GET \^\/api\/delivery-methods\$$/, 1],
  ['K3: a method that is not in the capture', d => { ruleOf(d, 'T05-a').method = 'GET' }, /^K3 T05-a: no captured response with a JSON body matches GET /, 1],
  ['K3: a response with no JSON body', d => { Object.assign(d.rules[0], { path: '^/main\\.js$', field: 'x' }) }, /^K3 T01-a: no captured response with a JSON body matches GET \^\/main\\\.js\$$/, 1],
  ['K3: a path with the captured text ID', d => { ruleOf(d, 'T06-a').path = `^/api/orders/${ORDER_ID}$` },
    /^K3 T06-a: the path \^\/api\/orders\/5267-f9cd5882f54c75a3\$ matches \/api\/orders\/5267-f9cd5882f54c75a3, but not \/api\/orders\/6378-a0de6993a65d86b4, the same path with a different ID\. An ID of this form changes from one run to the next run\. Write \[\^\/\?\]\+ for it\.$/, 1],
  ['K3: a path with \\d+ only for the digits of a text ID', d => { ruleOf(d, 'T06-a').path = '^/api/orders/\\d+-f\\d+cd\\d+f\\d+c\\d+a\\d+$' }, /^K3 T06-a: .* but not \/api\/orders\/6378-a0de6993a65d86b4, the same path with a different ID\./, 1],
  ['K3: a path that does not match a captured path of the same form', d => { ruleOf(d, 'T06-a').path = '^/api/orders/5267-[0-9a-f]+$' },
    /^K3 T06-a: the path \^\/api\/orders\/5267-\[0-9a-f\]\+\$ matches \/api\/orders\/5267-f9cd5882f54c75a3, but not \/api\/orders\/0be3-c1a9d4f27e88aa01, a captured path of the same form \(GET \/api\/orders\/\[\^\/\?\]\+\)\. Write \\d\+ for a number ID and \[\^\/\?\]\+ for a text ID\.$/, 1, [CAPTURE, ORDER_2]],
  ['K3: a path with a fixed number ID that changes in the capture', d => { ruleOf(d, 'T02-a').path = '^/api/basket/7$' }, /^K3 T02-a: the path \^\/api\/basket\/7\$ matches \/api\/basket\/7, but not \/api\/basket\/8, a captured path of the same form \(GET \/api\/basket\/\\d\+\)\./, 1],
  ['K4: the wrong op for numbers', d => { Object.assign(d.rules[0], { op: 'set', value: 'MUT' }) }, /^K4 T01-a: op set, value "MUT"\. The captured values at data\[\*\]\.price are numbers, so the operator table gives op add, value 1$/, 1],
  ['K4: the wrong value', d => { d.rules[0].value = 2 }, /^K4 T01-a: op add, value 2\. .* gives op add, value 1$/, 1],
  ['K4: add on strings with a decimal number', d => { ruleOf(d, 'T13-a').op = 'add' }, /^K4 T13-a: op add, value 1\. The captured values at data are strings with a decimal number, so the operator table gives op addNumberString, value 1$/, 1],
  ['K4: MUT on emails', d => { ruleOf(d, 'T14-a').value = 'MUT' }, /^K4 T14-a: op set, value "MUT"\. The captured values at user\.email are emails, so the operator table gives op set, value "mut@example\.test"$/, 1],
  ['K4: mut@example.test on a text that is not an email', d => { ruleOf(d, 'T15-a').value = 'mut@example.test' }, /^K4 T15-a: .* are strings, so the operator table gives op set, value "MUT"$/, 1],
  ['K4: mixed types', d => { d.rules.push(rule('T13-b', 'the wallet balance, as a number or a text', 'GET', '^/api/mixed/\\d+$', 'v')) }, /^K4 T13-b: at v, the captured values have mixed types \(number, string\)$/, 1],
  ['K4: values that are objects', d => { ruleOf(d, 'T07-a').field = 'data.products[*]' }, /^K4 T07-a: at data\.products\[\*\], the captured values are of the type object, not numbers or strings$/, 2], // and K5
  ['K5: a literal mismatch', d => { ruleOf(d, 'T01-a').field = 'data[*].id' }, /^K5 T01-a: no captured value at data\[\*\]\.id equals a literal of T01\. Literals: 8\.99\. Captured: 1, 2$/, 1],
  ['K5: a price on a text field', d => { Object.assign(ruleOf(d, 'T01-a'), { field: 'data[*].name', op: 'set', value: 'MUT' }) }, /^K5 T01-a: T01 is of the kind price, so each value at data\[\*\]\.name must be a number or a string with a decimal number\. Captured: "Eggfruit Juice \(500ml\)", "Apple Juice \(1000ml\)"$/, 1],
  ['K5: a total on the order ID field', d => { Object.assign(ruleOf(d, 'T09-a'), { field: 'data[*].orderId', op: 'set', value: 'MUT' }) }, /^K5 T09-a: T09 is of the kind total, so each value at data\[\*\]\.orderId must be a number or a string with a decimal number\. Captured: "5267-f9cd5882f54c75a3"$/, 1],
  ['K5: a quantity on an email field', d => { Object.assign(ruleOf(d, 'T10-a'), { path: '^/api/whoami$', field: 'user.email', op: 'set', value: 'mut@example.test' }) }, /^K5 T10-a: T10 is of the kind quantity, so each value at user\.email must be a number/, 1],
  ['K5: an email rule on a text that is not an email', d => { Object.assign(ruleOf(d, 'T14-a'), { field: 'user.image', op: 'set', value: 'MUT' }) }, /^K5 T14-a: T14 is of the kind email, so each value at user\.image must be a string with the form of an email\. Captured: "\/assets\/u\.png"$/, 1],
  ['K5: a message rule on a number field', d => { Object.assign(ruleOf(d, 'T15-a'), { method: 'PUT', path: '^/api/basket/\\d+/coupon/', field: 'discount', op: 'add', value: 1 }) }, /^K5 T15-a: T15 is of the kind message, so each value at discount must be a string that is not a decimal number\. Captured: 10$/, 1],
  ['K5: a message field with a text that is not a literal', d => { Object.assign(ruleOf(d, 'T15-a'), { method: 'GET', path: '^/api/deliveries$', field: 'data[*].name' }) }, /^K5 T15-a: no captured value at data\[\*\]\.name equals a literal of T15\./, 1]
]

describe('each broken variant fails with a clear line', () => {
  for (const [name, change, line, count, captures] of BROKEN) {
    test(name, () => {
      const r = runCheck(variant(change), captures ? { captures } : {})
      assert.equal(r.code, 1, r.out + r.err)
      assert.ok(r.lines.some(l => line.test(l)), `no line matches ${line}:\n${r.out}`)
      const problems = r.lines.filter(l => /^K\d /.test(l))
      assert.equal(problems.length, count, r.out)
      assert.equal(r.lines.at(-1), `FAILED: ${count} problem${count === 1 ? '' : 's'}`)
      assert.equal(r.lines.filter(l => l.startsWith('ok ')).length, 0) // no ok lines when the check fails
    })
  }

  test('K2: one bound rule and 15 rules in "unbound" also gives notes for the numbers and the email', () => {
    const r = runCheck(variant(d => unbindAll(d, ['T01'])))
    assert.equal(r.code, 1, r.out)
    const note = id => r.lines.find(l => l.startsWith(`note K2 ${id}: the rule is in "unbound", but the capture holds a value of its kind in a JSON field: `))
    assert.match(note('T09') ?? '', /: 19\.86 at GET \/api\/orders\/\[\^\/\?\]\+, field data\.totalPrice \(TC-07\); GET \/api\/order-history, field data\[\*\]\.totalPrice \(TC-07\)/, r.out)
    assert.match(note('T04') ?? '', /: 0\.99 at GET \/api\/deliveries, field data\[\*\]\.price \(TC-05\)/, r.out)
    assert.match(note('T14') ?? '', /: an email at GET \/api\/whoami, field user\.email \(TC-01\)\. Make sure that the page of the rule's steps does not show the value from such a field\.$/, r.out)
    assert.equal(note('T13'), undefined, 'the capture holds "5.00" (TC-08), but 5.00 is an integer, so it gives no note')
    assert.equal(note('T16'), undefined, 'T16 is of a text kind, and its text is not in the capture')
  })

  test('K1: a rules file that is not JSON', () => {
    const r = runCheck('{"rules": [')
    assert.equal(r.code, 1)
    assert.match(r.lines[0], /^K1 the rules file is not JSON: /)
    assert.equal(r.lines.at(-1), 'FAILED: 1 problem')
  })

  test('K1: an empty "rules" array', () => {
    const r = runCheck({ rules: [], unbound: RULE_IDS.map(id => ({ rule: id, reason: 'no JSON field' })) })
    assert.equal(r.code, 1)
    assert.ok(r.lines.includes('K1 no "rules" array, or an empty one'), r.out)
    assert.ok(r.lines.some(l => l.startsWith('K2 T15: the rule is in "unbound"')), r.out)
  })
})

describe('K0: the inputs', () => {
  test('a capture line with "changed": true', () => {
    const cap = write('k0/changed.jsonl', jsonl([...SHOP, { ...SHOP[0], changed: true }]))
    const r = runCheck(PASS, { captures: [cap] })
    assert.equal(r.code, 1)
    assert.deepEqual(r.lines, [`K0 changed.jsonl line ${SHOP.length + 1}: "changed" is true. A capture must come from a run with no rule.`, 'FAILED: 1 problem'])
  })

  test('a capture line that is not JSON, and an empty capture file', () => {
    const bad = write('k0/bad.jsonl', `${JSON.stringify(SHOP[0])}\n{"method": "GET"\n`)
    const empty = write('k0/empty.jsonl', '\n')
    const r = runCheck(PASS, { captures: [bad, empty] })
    assert.equal(r.code, 1)
    assert.deepEqual(r.lines, ['K0 bad.jsonl line 2: the line is not JSON', 'K0 empty.jsonl: the file has no capture line', 'FAILED: 2 problems'])
  })

  test('a raw capture with no "tc" and no "test": at most 5 lines for each file', () => {
    const raw = write('k0/raw.jsonl', jsonl(SHOP.slice(0, 8).map(({ tc, test, ...l }) => l)))
    const r = runCheck(PASS, { captures: [raw] })
    assert.equal(r.code, 1)
    assert.equal(r.lines[0], 'K0 raw.jsonl line 1: no "tc" key or no "test" key. Each line must give the test case ("tc") and the test ("test") of the response, or null.')
    assert.deepEqual(r.lines.slice(5), ['K0 raw.jsonl: 3 more lines with a problem', 'FAILED: 6 problems'])
  })

  test('a "tc" that is not a text', () => {
    const cap = write('k0/tc.jsonl', jsonl([{ ...SHOP[0], tc: 2 }]))
    assert.deepEqual(runCheck(PASS, { captures: [cap] }).lines, ['K0 tc.jsonl line 1: "tc" must be a text or null, and "test" must be a number or null', 'FAILED: 1 problem'])
  })

  test('binding tables with no table "The rules"', () => {
    const tables = write('k0/no-rules.md', TABLES_TEXT.slice(0, TABLES_TEXT.indexOf('## The rules')))
    const r = runCheck(PASS, { tables })
    assert.equal(r.code, 1)
    assert.deepEqual(r.lines, ['K0 0 tables match the table "The rules". Exactly 1 table must match.', 'FAILED: 1 problem'])
  })

  test('binding tables with an operator table that does not give addNumberString', () => {
    const tables = write('k0/no-op.md', TABLES_TEXT.replace(/`addNumberString`/g, '`plusOne`'))
    const r = runCheck(PASS, { tables })
    assert.equal(r.code, 1)
    assert.ok(r.lines.includes('K0 the operator table does not give `addNumberString`. The check K4 uses it.'), r.out)
  })

  test('binding tables with a kind that the check does not know, and with no column "Kind"', () => {
    assert.ok(TABLES_TEXT.includes('| T12 | bonus points |'))
    const unknown = runCheck(PASS, { tables: write('k0/kind.md', TABLES_TEXT.replace('| T12 | bonus points |', '| T12 | points |')) })
    assert.equal(unknown.code, 1)
    assert.match(unknown.lines[0], /^K0 the table "The rules" gives the kind "points" for T12\. The check knows these kinds: price, quantity, item count, total, discount, balance, bonus points, email, message, payment method, order status, order ID\.$/)
    const none = runCheck(PASS, { tables: write('k0/no-kind.md', TABLES_TEXT.replace('| Rule | Kind |', '| Rule | Sort |')) })
    assert.deepEqual(none.lines, ['K0 the table "The rules" has no column "Kind"', 'FAILED: 1 problem'])
  })

  test('a usage error gives exit code 2', () => {
    assert.equal(node([CHECK, 'only-one-file.json']).code, 2)
    assert.equal(node([CHECK, path.join(TMP, 'no-such-file.json'), TABLES, CAPTURE]).code, 2)
  })
})

describe('K1 stays in step with loadRules() of tamper-proxy.mjs', () => {
  const base = { id: 'T01-a', what: 'w', method: 'GET', path: '^/a$', field: 'a', op: 'add', value: 1 }
  const docs = [
    { rules: [base] }, { rules: [] }, { rules: 'x' }, {}, { rules: [null] }, { rules: [[1]] },
    { rules: [{ ...base, x: 1 }] }, { rules: [{ ...base, id: 'a b' }] }, { rules: [{ ...base, id: 5 }] },
    { rules: [base, { ...base, id: 't01-A' }] }, { rules: [{ ...base, what: ' ' }] }, { rules: [{ ...base, what: undefined }] },
    { rules: [{ ...base, method: 'G3T' }] }, { rules: [{ ...base, method: ['GET'] }] }, { rules: [{ ...base, method: undefined }] },
    { rules: [{ ...base, method: 'get' }] }, { rules: [{ ...base, path: '' }] }, { rules: [{ ...base, path: '(' }] },
    { rules: [{ ...base, field: 'a..b' }] }, { rules: [{ ...base, field: '[*].x' }] }, { rules: [{ ...base, field: 'data[0].x' }] },
    { rules: [{ ...base, field: 'a.' }] }, { rules: [{ ...base, op: 'plus' }] }, { rules: [{ ...base, op: 'toString' }] },
    { rules: [{ ...base, value: '1' }] }, { rules: [{ ...base, op: 'mul', value: 2 }] }, { rules: [{ ...base, op: 'set', value: null }] },
    { rules: [{ ...base, op: 'set', value: undefined }] }, { rules: [{ ...base, op: 'suffix', value: 1 }] },
    { rules: [{ ...base, op: 'suffix', value: '-x' }] }, { rules: [{ ...base, op: 'addNumberString', value: '1' }] },
    { rules: [{ ...base, op: 'addNumberString', value: 1 }] }
  ]
  docs.forEach((doc, i) => {
    const text = JSON.stringify(doc)
    test(`rules file ${i + 1}: ${text.slice(0, 90)}`, () => {
      const file = write(`sync/${i + 1}.json`, text)
      let threw = null
      try { loadRules(file) } catch (e) { threw = e.message }
      const problems = loadRulesProblems(JSON.parse(text))
      assert.equal(problems.length > 0, threw !== null, `loadRules: ${threw ?? 'accepts'}. The check: ${problems.join(' | ') || 'accepts'}`)
    })
  })
})

describe('parts of the check', () => {
  test('literalsOf: backticks, ¤, %, and angle brackets', () => {
    const lit = cell => literalsOf(cell).map(l => [l.kind, l.value])
    assert.deepEqual(lit('`1`, `8.99¤`'), [['number', 1], ['number', 8.99]])
    assert.deepEqual(lit('`10%`'), [['number', 10]])
    assert.deepEqual(lit('the ID of step 7, `19.86¤`, `2`, `1`'), [['number', 19.86], ['number', 2], ['number', 1]])
    assert.deepEqual(lit('`<order ID>`, `Thank you for your purchase!`'), [['text', 'Thank you for your purchase!']])
    assert.deepEqual(lit('the email of the new account'), [])
    assert.deepEqual(lit('`0.99¤`, `0.50¤` and `0.00¤`'), [['number', 0.99], ['number', 0.5], ['number', 0]])
  })

  test('pathForm and otherId: number IDs, text IDs, and parts that are not IDs', () => {
    assert.equal(pathForm('/rest/track-order/5267-f9cd5882f54c75a3'), '/rest/track-order/[^/?]+')
    assert.equal(pathForm('/rest/basket/12/checkout'), '/rest/basket/\\d+/checkout')
    assert.equal(pathForm('/assets/i18n/en.json'), '/assets/i18n/en.json')
    assert.equal(pathForm('/api/x/deadbeef/2fa/0be3c1a9d4f27e88'), '/api/x/deadbeef/2fa/[^/?]+')
    assert.equal(pathForm('/x?id=0be3c1a9d4f27e88&n=5&q=apple'), '/x?id=[^&]+&n=\\d+&q=apple')
    assert.equal(otherId('/rest/track-order/5267-f9cd5882f54c75a3'), '/rest/track-order/6378-a0de6993a65d86b4')
    assert.equal(otherId('/x?id=0BE3C1A9D4F27E88'), '/x?id=1CF4D2B0E5A38F99')
    assert.equal(otherId('/rest/basket/12'), null)
  })

  test('markdownTables: label lines, headings, and no table from a fenced block', () => {
    const md = ['# Doc', '', 'The operator:', '', '| Value type | Operator |', '|---|---|', '| number | `add` 1 |', '',
      '## Other', '', 'Some text.', '', '| Rule | Kind |', '|---|---|', '| T01 | price |', '', '~~~', '| Rule | fake |', '|---|---|', '~~~', ''].join('\n')
    const tables = markdownTables(md)
    assert.deepEqual(tables.map(t => [t.title, t.header, t.rows]), [
      ['The operator', ['Value type', 'Operator'], [['number', '`add` 1']]],
      ['Other', ['Rule', 'Kind'], [['T01', 'price']]]
    ])
  })

  test('the binding tables of hypotheses-v2.md: three tables, the rules T01 to T16, a first line with the sha256', () => {
    const bytes = fs.readFileSync(HYP)
    const text = tablesText(bytes)
    const lines = text.split('\n')
    assert.equal(lines[0], `These tables are copies from a source file, sha256 ${sha256(bytes)}, with no change.`)
    assert.equal(tablesText(bytes, 'x.md').split('\n')[0], `These tables are copies from x.md, sha256 ${sha256(bytes)}, with no change.`)
    assert.deepEqual(lines.filter(l => l.startsWith('## ')), ['## The operator', '## Candidate values for each test case step', '## The rules'])
    const { tables, problems } = bindingTables(text)
    assert.deepEqual(problems, [])
    assert.deepEqual(tables.rules.rows.map(r => r[0]), RULE_IDS)
    for (const t of Object.values(tables)) assert.ok(bytes.toString('utf8').includes(t.lines.join('\n')), `${t.title}: not a copy with no change`)
    assert.doesNotMatch(text, /Values with no rule|vague|patch|mutant|sealed|harness|suite|hypothes|pre-registration|experiment|audit|freeze|plan v2/i)
  })

  test('--tables on the command line', () => {
    const r = node([CHECK, '--tables', HYP])
    assert.equal(r.code, 0, r.err)
    assert.match(r.lines[0], /^These tables are copies from a source file, sha256 [0-9a-f]{64}, with no change\.$/)
    assert.deepEqual(bindingTables(r.out).problems, [])
  })

  test('--fields: the forms of paths, the fields of the lines that match, and the fields that hold a value', () => {
    const all = node([CHECK, '--fields', CAPTURE, ORDER_2])
    assert.equal(all.code, 0, all.err)
    assert.ok(all.lines.includes('GET /api/basket/\\d+: 2 responses, status 200, 4 fields, test cases TC-02 TC-04'), all.out)
    assert.ok(all.lines.includes('GET /api/orders/[^/?]+: 2 responses, status 200, 5 fields, test cases TC-07'), all.out)
    assert.ok(all.lines.includes('POST /api/login: 1 response, status 401, 1 field, test cases TC-01'), all.out)
    assert.equal(all.lines.at(-1), 'Not in this list: 1 response with no JSON body.')
    assert.ok(!all.lines.some(l => l.startsWith('  ')), 'no field lines without --match or --value')
    const match = node([CHECK, '--fields', '--match', '^GET /api/basket', CAPTURE])
    assert.deepEqual(match.lines.slice(0, 5), ['GET /api/basket/\\d+: 2 responses, status 200, 4 fields, test cases TC-02 TC-04', '  data.id (number): 7, 8',
      '  data.items[*].name (string): "Eggfruit Juice (500ml)", "Apple Juice (1000ml)"', '  data.items[*].price (number): 8.99, 1.99', '  data.items[*].quantity (number): 1, 5'])
    const value = node([CHECK, '--fields', '--value', 'Invalid email', CAPTURE])
    assert.deepEqual(value.lines, ['POST /api/login: 1 response, status 401, 1 field, test cases TC-01', '  error (string): "Invalid email or password."', 'Not in this list: 1 response with no JSON body.'])
    const changed = write('fields/changed.jsonl', jsonl([{ ...SHOP[0], changed: true }]))
    assert.equal(node([CHECK, '--fields', changed]).code, 1)
  })

  test('check() and fieldsText() as functions', () => {
    const r = check({ rulesText: JSON.stringify(PASS), tablesMd: TABLES_TEXT, captures: [{ name: 'c.jsonl', text: jsonl(SHOP) }] })
    assert.deepEqual(r.problems, [])
    assert.match(fieldsText(readCaptures([{ name: 'c.jsonl', text: jsonl(SHOP) }]).lines), /^GET \/api\/products\?q=: 1 response/)
  })
})

describe('make-binder-folder.sh', () => {
  const runs = path.join(TMP, 'runs')
  fs.mkdirSync(runs)
  const capA = write('caps/capture-A.jsonl', jsonl(SHOP.slice(0, 7)))
  const capB = write('caps/capture-B.jsonl', jsonl(SHOP.slice(7)))
  const make = (args, env = {}) => {
    const r = spawnSync('/bin/bash', [MAKE, ...args], { encoding: 'utf8', env: { ...process.env, CL_RUNS: runs, ...env } })
    return { code: r.status, out: r.stdout, err: r.stderr }
  }
  const tempsBefore = fs.readdirSync(os.tmpdir()).filter(d => d.startsWith('make-binder-folder.')).sort()
  const tcFiles = spawnSync('git', ['-C', LAB, 'ls-tree', '-r', '--name-only', 'test-cases-v1', 'test-cases'], { encoding: 'utf8' }).stdout.trim().split('\n')
  const listFiles = dir => fs.readdirSync(dir, { recursive: true }).filter(f => fs.statSync(path.join(dir, f)).isFile()).sort()
  let made = null

  test('makes the folder with only the listed files and prints the hashes', () => {
    const work = path.join(runs, 'field-map')
    const r = make([work, capA, capB])
    made = r
    assert.equal(r.code, 0, r.out + r.err)
    const expected = [...tcFiles, 'binding-tables.md', 'capture-A.jsonl', 'capture-B.jsonl', 'tamper-rules.example.json'].sort()
    assert.deepEqual(listFiles(work), expected)
    for (const f of tcFiles) {
      const atTag = spawnSync('git', ['-C', LAB, 'show', `test-cases-v1:${f}`]).stdout
      assert.ok(fs.readFileSync(path.join(work, f)).equals(atTag), `${f} is not the file at test-cases-v1`)
    }
    assert.ok(fs.readFileSync(path.join(work, 'capture-A.jsonl')).equals(fs.readFileSync(capA)))
    assert.ok(fs.readFileSync(path.join(work, 'tamper-rules.example.json')).equals(fs.readFileSync(EXAMPLE)))

    // Line 1 of binding-tables.md gives the sha256 but not the source name. The log line gives both.
    const tables = fs.readFileSync(path.join(work, 'binding-tables.md'), 'utf8')
    const sha = tables.split('\n')[0].match(/^These tables are copies from a source file, sha256 ([0-9a-f]{64}), with no change\.$/)?.[1]
    assert.ok(sha, tables.split('\n')[0])
    assert.match(r.out, new RegExp(`binding-tables\\.md from bench/hypotheses-v2\\.md \\(sha256 ${sha}\\)`))
    assert.deepEqual(bindingTables(tables).problems, [])
    assert.doesNotMatch(tables, /hypothes|pre-registration|experiment/i)

    // The hashes: one line for each file, then the hash of test-cases/ and of the folder (the test-cases-v1 method).
    const out = r.out.trim().split('\n')
    const fileLines = out.filter(l => /^[0-9a-f]{64} {2}\.\//.test(l))
    const want = expected.map(f => `${sha256(fs.readFileSync(path.join(work, f)))}  ./${f}`).sort((a, b) => a.slice(66) < b.slice(66) ? -1 : 1)
    assert.deepEqual(fileLines, want)
    const tcLines = tcFiles.map(f => `${sha256(fs.readFileSync(path.join(work, f)))}  ./${f.slice('test-cases/'.length)}`)
    assert.ok(out.includes(`folder test-cases/: ${sha256(tcLines.join('\n') + '\n')}`), r.out)
    assert.ok(out.includes(`folder field-map/: ${sha256(want.join('\n') + '\n')}`), r.out)
    assert.equal(out.at(-1), `next: copy bench/check-tamper-rules.mjs (sha256 ${sha256(fs.readFileSync(CHECK))}) into the folder as check-tamper-rules.mjs. Record in LOG.md its sha256 and the change from steps 2 and 4: the folder holds the check, and the binder runs it.`)

    // The flow of the binder: the check, copied into the folder, passes on the good rules file.
    fs.copyFileSync(CHECK, path.join(work, 'check-tamper-rules.mjs'))
    fs.writeFileSync(path.join(work, 'tamper-rules.json'), JSON.stringify(PASS, null, 2))
    const c = node(['check-tamper-rules.mjs', 'tamper-rules.json', 'binding-tables.md', 'capture-A.jsonl', 'capture-B.jsonl'], { cwd: work })
    assert.equal(c.code, 0, c.out + c.err)
    assert.equal(c.lines.at(-1), 'PASSED: all checks')
  })

  test('a word of the plan in tamper-rules.example.json gives a warning, not a refusal', () => {
    assert.ok(made, 'the first test made the folder')
    const words = [...fs.readFileSync(EXAMPLE, 'utf8').matchAll(/vague|patch|mutant|sealed|harness|suite|bug|hypothes|pre-registration|experiment|audit|freeze|plan v2/gi)]
    if (words.length) assert.match(made.err, /^warning: tamper-rules\.example\.json holds a word that tells about the plan: \d+:/m)
    else assert.doesNotMatch(made.err, /warning/)
  })

  test('binding-tables.md has 0 hard STE violations', { skip: fs.existsSync(STE_LINT) ? false : 'no ste-lint.py' }, () => {
    const lint = spawnSync('python3', [STE_LINT, path.join(runs, 'field-map', 'binding-tables.md')], { encoding: 'utf8' })
    assert.equal(lint.status, 0, lint.stdout + lint.stderr)
    assert.match(lint.stdout, /\(0 hard,/)
  })

  const raw = SHOP.map(({ tc, test, ...l }) => l)
  const refusals = [
    ['an existing folder', () => [path.join(runs, 'field-map'), capA], /exists/],
    ['a name with "vague"', () => [path.join(runs, 'Vague-map'), capA], /holds one of the words: vague, patch, mutant, sealed/],
    ['a name with "patch"', () => [path.join(runs, 'patch-list'), capA], /holds one of the words/],
    ['a folder outside RUNS', () => [path.join(TMP, 'elsewhere'), capA], /must be a direct child of RUNS/],
    ['a folder below a child of RUNS', () => { fs.mkdirSync(path.join(runs, 'sub'), { recursive: true }); return [path.join(runs, 'sub', 'map'), capA] }, /must be a direct child of RUNS/],
    ['a capture file inside RUNS', () => { const f = path.join(runs, 'capture-C.jsonl'); fs.copyFileSync(capA, f); return [path.join(runs, 'map-2'), f] }, /is inside RUNS/],
    ['a capture file name with "sealed"', () => [path.join(runs, 'map-3'), write('caps/sealed-1.jsonl', jsonl(SHOP))], /capture file name sealed-1\.jsonl holds one of the words/],
    ['a capture file with "changed": true', () => [path.join(runs, 'map-4'), write('caps/capture-D.jsonl', jsonl([{ ...SHOP[0], changed: true }]))], /a capture file has a K0 problem: K0 capture-D\.jsonl line 1: "changed" is true/],
    ['a raw capture of the proxy, with no "tc" and no "test"', () => [path.join(runs, 'map-8'), write('caps/capture-E.jsonl', jsonl(raw))], /a capture file has a K0 problem: K0 capture-E\.jsonl line 1: no "tc" key or no "test" key/],
    ['a capture file that is not .jsonl', () => [path.join(runs, 'map-5'), write('caps/capture.txt', jsonl(SHOP))], /bad capture file name/],
    ['two capture files with the same name', () => [path.join(runs, 'map-6'), capA, write('caps/other/capture-A.jsonl', jsonl(SHOP))], /two capture files have the name capture-A\.jsonl/]
  ]
  for (const [name, args, message] of refusals) {
    test(`refuses ${name}, and makes no folder`, () => {
      const a = args()
      const existed = fs.existsSync(a[0])
      const r = make(a)
      assert.equal(r.code, 1, r.out + r.err)
      assert.match(r.err, message)
      assert.equal(fs.existsSync(a[0]), existed)
    })
  }

  test('a usage error gives exit code 2', () => {
    assert.equal(make([path.join(runs, 'map-7')]).code, 2)
    assert.equal(fs.existsSync(path.join(runs, 'map-7')), false)
  })

  test('the script removes its temp folders', () => {
    assert.deepEqual(fs.readdirSync(os.tmpdir()).filter(d => d.startsWith('make-binder-folder.')).sort(), tempsBefore)
  })
})
