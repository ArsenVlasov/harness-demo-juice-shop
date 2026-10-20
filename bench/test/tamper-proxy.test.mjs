// Offline tests of bench/tamper-proxy.mjs and of the logic of bench/run-audit-tamper.mjs.
//
//   node --test bench/test/tamper-proxy.test.mjs
//
// A fake upstream runs as a child process (this file with TAMPER_FAKE_UPSTREAM=1) on a random port. It serves JSON,
// gzip, deflate and br JSON, chunked JSON, text, broken JSON, an HTML page, a request echo and a websocket echo.
// The real-browser tests use Playwright from a suite: TAMPER_TEST_PLAYWRIGHT=<node_modules folder>, else the
// node_modules folder of the first suite in harness-demo-runs (suite-a, suite-b, or <set>/run-<n>/suite-a|b) that has
// Playwright. Without Playwright, they skip. TAMPER_REQUIRE_BROWSER=1: a test fails when no Playwright is found.
// No test uses port 3000. Temp files go to the system temp folder. The tests remove them at the end.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import { LAB, RUNS } from '../lib.mjs'
import { attribute, audit, markdown, passthroughProblems, readEvents, readWindows, recheckResult, ruleRow, runProblems, suiteRun, summary, verdict } from '../run-audit-tamper.mjs'
import { applyRule, isBrowser, loadRules, startProxy } from '../tamper-proxy.mjs'

const THIS_FILE = fileURLToPath(import.meta.url)
const PROXY = path.join(LAB, 'bench', 'tamper-proxy.mjs')
const RUNNER = path.join(LAB, 'bench', 'run-audit-tamper.mjs')
const EXAMPLE = path.join(LAB, 'bench', 'tamper-rules.example.json')
const { NODE_TEST_CONTEXT, ...CHILD_ENV } = process.env
const BROWSER = { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' }
const FETCH_METADATA = ['sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest']
const ITEMS = { data: [{ name: 'apple', price: 1.5, qty: 2 }, { name: 'pear', price: 2, qty: 1 }], total: 5 }
const ORDER = { data: { id: 7, total: 12.5, status: 'placed' } }
const PAGE = `<!doctype html><title>shop</title><p id="total">...</p><p id="names">...</p>
<script>fetch('/api/example/items').then(r => r.json()).then(j => {
  document.querySelector('#total').textContent = String(j.total)
  document.querySelector('#names').textContent = j.data.map(d => d.name).join(',')
})</script>`

// --- the fake upstream (child process) ----------------------------------------------------------
function serveFakeUpstream () {
  const json = Buffer.from(JSON.stringify(ITEMS))
  const routes = {
    '/': ['text/html', Buffer.from(PAGE)],
    '/api/example/items': ['application/json', json, { etag: '"v1"', 'x-hop': 'secret', connection: 'keep-alive, x-hop' }],
    '/api/example/orders/7': ['application/json', Buffer.from(JSON.stringify(ORDER))],
    '/api/example/gzip': ['application/json', zlib.gzipSync(json), { 'content-encoding': 'gzip' }],
    '/api/example/deflate': ['application/json', zlib.deflateSync(json), { 'content-encoding': 'deflate' }],
    '/api/example/br': ['application/json', zlib.brotliCompressSync(json), { 'content-encoding': 'br' }],
    '/api/example/text': ['text/plain', Buffer.from('price 1.5')],
    '/api/example/broken': ['application/json', Buffer.from('{"price": 1.5')],
    '/api/example/bad-gzip': ['application/json', Buffer.from('not gzip'), { 'content-encoding': 'gzip' }]
  }
  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://upstream')
    if (pathname === '/api/example/chunked') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(json.subarray(0, 10))
      return res.end(json.subarray(10))
    }
    if (pathname === '/slow') { setTimeout(() => { res.writeHead(200); res.end('late') }, 400); return }
    if (pathname === '/api/example/cut') {
      res.writeHead(200, { 'content-type': 'application/json', 'content-length': 100 })
      res.write('{"total": 5')
      return setTimeout(() => res.socket.destroy(), 50)
    }
    if (pathname === '/echo') {
      const chunks = []
      req.on('data', c => chunks.push(c))
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() }))
      })
      return
    }
    const [type, body, extra = {}] = routes[pathname] ?? []
    if (!body) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': type, 'content-length': body.length, ...extra })
    res.end(body)
  })
  // A small websocket echo: one masked text frame of less than 126 bytes in, the same text out.
  server.on('upgrade', (req, socket) => {
    const accept = crypto.createHash('sha1').update(`${req.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64')
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
    socket.on('data', frame => {
      if ((frame[0] & 0x0f) === 8) return socket.end()
      const len = frame[1] & 0x7f
      const mask = frame.subarray(2, 6)
      const data = Buffer.from(frame.subarray(6, 6 + len)).map((b, i) => b ^ mask[i % 4])
      socket.write(Buffer.concat([Buffer.from([0x81, len]), data]))
    })
    socket.on('error', () => {})
  })
  server.listen(0, () => console.log(JSON.stringify({ port: server.address().port })))
}

// --- helpers ----------------------------------------------------------------------------------------
let TMP, upstream

async function startUpstream () {
  const child = spawn(process.execPath, [THIS_FILE], { env: { ...CHILD_ENV, TAMPER_FAKE_UPSTREAM: '1' }, stdio: ['ignore', 'pipe', 'inherit'] })
  const line = await new Promise((resolve, reject) => {
    child.stdout.once('data', d => resolve(String(d)))
    child.once('exit', code => reject(new Error(`the fake upstream stopped, exit ${code}`)))
  })
  const { port } = JSON.parse(line)
  return { child, port, url: `http://localhost:${port}` }
}

function request (port, urlPath, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: 'localhost', port, path: urlPath, method, headers, agent: false }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
    })
    req.on('error', reject)
    req.end(body)
  })
}

let ruleFiles = 0
function writeRules (rules) {
  const file = path.join(TMP, `rules-${++ruleFiles}.json`)
  fs.writeFileSync(file, JSON.stringify({ rules }))
  return file
}
const makeRule = r => loadRules(writeRules([{ id: 'r', what: 'a value', ...r }]))[0]

async function withProxy (opts, fn) {
  const events = []
  const server = await startProxy({ port: 0, target: upstream.url, emit: e => events.push(e), ...opts })
  try {
    return await fn(server.address().port, events)
  } finally {
    await server.shutdown()
  }
}

const freePort = () => new Promise(resolve => {
  const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)) })
})

async function waitFor (check, what, ms = 5000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(50)) if (check()) return
  throw new Error(`timeout: ${what}`)
}

function wsEcho (url, text) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    ws.onopen = () => ws.send(text)
    ws.onmessage = m => { resolve({ ws, data: String(m.data) }) }
    ws.onerror = () => reject(new Error(`websocket error on ${url}`))
  })
}

// The suites of harness-demo-runs in the old layout (suite-a) and in the new one (<set>/run-<n>/suite-a). A folder
// that this process cannot read (for example, locked during a generation run) does not count.
function findPlaywright (runs = RUNS, given = process.env.TAMPER_TEST_PLAYWRIGHT) {
  const list = dir => { try { return fs.readdirSync(dir) } catch { return [] } }
  const suites = [path.join(runs, 'suite-a'), path.join(runs, 'suite-b')]
  for (const set of list(runs)) {
    for (const run of list(path.join(runs, set)).filter(r => /^run-\d+$/.test(r))) suites.push(path.join(runs, set, run, 'suite-a'), path.join(runs, set, run, 'suite-b'))
  }
  const dirs = [given, ...suites.map(s => path.join(s, 'node_modules'))]
  return dirs.filter(Boolean).find(d => fs.existsSync(path.join(d, 'playwright', 'package.json')) && fs.existsSync(path.join(d, '@playwright', 'test', 'package.json'))) ?? null
}
const PW_MODULES = findPlaywright()
const NO_PW = PW_MODULES ? false : 'no Playwright found'

// --- the tests ----------------------------------------------------------------------------------------
function registerTests () {
  TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tamper-test-'))
  before(async () => { upstream = await startUpstream() })
  after(() => {
    upstream?.child.kill()
    fs.rmSync(TMP, { recursive: true, force: true })
  })

  describe('rules file', () => {
    test('the example file loads', () => {
      const rules = loadRules(EXAMPLE)
      assert.deepEqual(rules.map(r => [r.id, r.op]), [['example-item-price-plus-1', 'add'], ['example-order-total-x2', 'mul'], ['example-order-status', 'set']])
      assert.equal(rules[0].method, 'GET')
      assert.ok(rules[0].re.test('/api/example/items?page=2'))
      assert.ok(!rules[0].re.test('/api/example/items2'))
    })

    test('a bad rule stops with a clear message', () => {
      const good = { id: 'x', what: 'w', path: '^/a$', field: 'a', op: 'add', value: 1 }
      const cases = [
        [{ op: 'pow' }, /"op" must be one of: add, mul, set, suffix/],
        [{ path: '(' }, /"path" is not a regular expression/],
        [{ field: 'data..price' }, /"field" must be like data\[\*\]\.price/],
        [{ value: '1' }, /"value" must be a number for op add/],
        [{ op: 'suffix', value: 1 }, /"value" must be a string for op suffix/],
        [{ feild: 'a' }, /unknown keys: feild/],
        [{ what: ' ' }, /no "what"/],
        [{ id: 'a b' }, /"id" must be letters/],
        [{ method: 'G E T' }, /"method" must be an HTTP method/]
      ]
      for (const [patch, message] of cases) assert.throws(() => loadRules(writeRules([{ ...good, ...patch }])), message)
      assert.throws(() => loadRules(writeRules([good, good])), /rule x: the id is not unique/)
      assert.throws(() => loadRules(writeRules([{ ...good, id: 'Total' }, { ...good, id: 'total' }])), /rule total: the id is not unique \(letter case does not count\)/)
      assert.throws(() => loadRules(writeRules([])), /no "rules" array/)
    })
  })

  describe('applyRule', () => {
    const clone = () => structuredClone(ITEMS)
    test('add on each array item ([*]) logs the old and the new value', () => {
      const json = clone()
      const changes = applyRule(json, makeRule({ path: '.', field: 'data[*].price', op: 'add', value: 1 }))
      assert.deepEqual(changes, [{ field: 'data[0].price', old: 1.5, new: 2.5 }, { field: 'data[1].price', old: 2, new: 3 }])
      assert.deepEqual(json.data.map(d => d.price), [2.5, 3])
    })
    test('mul rounds to 15 significant digits', () => {
      const json = clone()
      applyRule(json, makeRule({ path: '.', field: 'data[*].price', op: 'mul', value: 1.1 }))
      assert.deepEqual(json.data.map(d => d.price), [1.65, 2.2])
    })
    test('set changes the value; set to the same value is no change', () => {
      const json = clone()
      assert.deepEqual(applyRule(json, makeRule({ path: '.', field: 'total', op: 'set', value: 0 })), [{ field: 'total', old: 5, new: 0 }])
      assert.deepEqual(applyRule(json, makeRule({ path: '.', field: 'total', op: 'set', value: 0 })), [])
    })
    test('suffix changes strings; a wrong type is no change', () => {
      const json = clone()
      assert.equal(applyRule(json, makeRule({ path: '.', field: 'data[*].name', op: 'suffix', value: ' X' })).length, 2)
      assert.deepEqual(json.data.map(d => d.name), ['apple X', 'pear X'])
      assert.deepEqual(applyRule(json, makeRule({ path: '.', field: 'total', op: 'suffix', value: 'X' })), [])
      assert.deepEqual(applyRule(json, makeRule({ path: '.', field: 'data[*].name', op: 'add', value: 1 })), [])
    })
    test('[*] at the top, [n], nested [*][*], and missing paths', () => {
      const top = [{ price: 1 }, { price: 2 }]
      assert.deepEqual(applyRule(top, makeRule({ path: '.', field: '[*].price', op: 'add', value: 1 })).map(c => c.field), ['[0].price', '[1].price'])
      const json = clone()
      assert.deepEqual(applyRule(json, makeRule({ path: '.', field: 'data[1].price', op: 'add', value: 1 })), [{ field: 'data[1].price', old: 2, new: 3 }])
      assert.equal(json.data[0].price, 1.5)
      const grid = { rows: [[1, 2], [3]] }
      applyRule(grid, makeRule({ path: '.', field: 'rows[*][*]', op: 'mul', value: 10 }))
      assert.deepEqual(grid.rows, [[10, 20], [30]])
      assert.deepEqual(applyRule(clone(), makeRule({ path: '.', field: 'data[*].cost', op: 'add', value: 1 })), [])
      assert.deepEqual(applyRule(clone(), makeRule({ path: '.', field: 'total[*]', op: 'add', value: 1 })), [])
      assert.deepEqual(applyRule(clone(), makeRule({ path: '.', field: 'data.price', op: 'add', value: 1 })), [])
    })
  })

  describe('proxy', () => {
    test('with no rule: each body and header goes through byte for byte', async () => {
      await withProxy({}, async (port, events) => {
        for (const p of ['/', '/api/example/items', '/api/example/gzip', '/api/example/deflate', '/api/example/br', '/api/example/chunked', '/api/example/text', '/api/example/broken', '/api/example/orders/7']) {
          const headers = { ...BROWSER, 'accept-encoding': 'gzip, deflate, br' }
          const [direct, via] = await Promise.all([request(upstream.port, p, { headers }), request(port, p, { headers })])
          assert.equal(via.status, direct.status, p)
          assert.ok(via.body.equals(direct.body), `body of ${p}`)
          for (const h of ['content-type', 'content-encoding', 'content-length', 'etag']) assert.equal(via.headers[h], direct.headers[h], `${h} of ${p}`)
        }
        const direct = await request(upstream.port, '/api/example/items')
        const via = await request(port, '/api/example/items')
        assert.equal(direct.headers['x-hop'], 'secret')
        assert.equal(via.headers['x-hop'], undefined, 'a header that Connection names is hop-by-hop')
        assert.equal(events.filter(e => e.type === 'change').length, 0)
      })
    })

    test('request: hop-by-hop headers stay at the proxy; Host, other headers and the body go through', async () => {
      await withProxy({}, async port => {
        const headers = { connection: 'x-req-hop', 'x-req-hop': '1', 'proxy-authorization': 'Basic eDp5', te: 'trailers', 'x-keep': 'yes', 'content-type': 'text/plain' }
        const echo = JSON.parse((await request(port, '/echo?a=1', { method: 'POST', headers, body: 'abc' })).body)
        assert.equal(echo.method, 'POST')
        assert.equal(echo.url, '/echo?a=1')
        assert.equal(echo.body, 'abc')
        assert.equal(echo.headers.host, `localhost:${port}`)
        assert.equal(echo.headers['x-keep'], 'yes')
        for (const h of ['x-req-hop', 'proxy-authorization', 'te']) assert.equal(echo.headers[h], undefined, h)
      })
    })

    test('a rule changes the JSON of a browser request; the log has the old and the new values', async () => {
      const rule = makeRule({ id: 'price', method: 'GET', path: '^/api/example/items$', field: 'data[*].price', op: 'add', value: 1 })
      await withProxy({ rule }, async (port, events) => {
        const via = await request(port, '/api/example/items', { headers: BROWSER })
        assert.deepEqual(JSON.parse(via.body).data.map(d => d.price), [2.5, 3])
        assert.equal(Number(via.headers['content-length']), via.body.length)
        assert.equal(via.headers.etag, '"v1"')
        const change = events.find(e => e.type === 'change')
        assert.deepEqual({ ...change, time: undefined }, {
          time: undefined, type: 'change', rule: 'price', method: 'GET', path: '/api/example/items', status: 200,
          changes: [{ field: 'data[0].price', old: 1.5, new: 2.5 }, { field: 'data[1].price', old: 2, new: 3 }]
        })
        assert.ok(!Number.isNaN(Date.parse(change.time)))
        assert.deepEqual(events.filter(e => e.type === 'request').map(e => [e.method, e.path, e.browser]), [['GET', '/api/example/items', true]])
      })
    })

    test('scope browser: a request with no Fetch Metadata gets the true body; scope all changes it', async () => {
      const rule = makeRule({ path: '^/api/example/items$', field: 'total', op: 'set', value: 0 })
      const direct = await request(upstream.port, '/api/example/items')
      await withProxy({ rule }, async (port, events) => {
        const via = await request(port, '/api/example/items')
        assert.ok(via.body.equals(direct.body))
        assert.deepEqual(events.filter(e => e.type !== 'listening').map(e => [e.type, e.browser]), [['request', false]])
      })
      await withProxy({ rule, scope: 'all' }, async port => {
        assert.equal(JSON.parse((await request(port, '/api/example/items')).body).total, 0)
      })
    })

    test('Fetch Metadata: only all three headers make a browser request; Node fetch() is not a browser', async () => {
      assert.equal(isBrowser(BROWSER), true)
      for (const h of FETCH_METADATA) {
        const { [h]: _, ...rest } = BROWSER
        assert.equal(isBrowser(rest), false, `without ${h}`)
      }
      assert.equal(isBrowser({ 'sec-fetch-mode': 'websocket' }, true), false, 'the Node WebSocket: no Origin')
      assert.equal(isBrowser({ origin: 'http://localhost:1' }, true), true, 'the Chromium websocket handshake has Origin')
      const rule = makeRule({ path: '^/api/example/items$', field: 'total', op: 'set', value: 0 })
      await withProxy({ rule }, async (port, events) => {
        const echo = await (await fetch(`http://localhost:${port}/echo`)).json()
        const items = await (await fetch(`http://localhost:${port}/api/example/items`)).json()
        console.log(`Node ${process.version} fetch(): ` + FETCH_METADATA.map(h => `${h}=${echo.headers[h]}`).join(', '))
        assert.equal(echo.headers['sec-fetch-mode'], 'cors', 'undici sends Sec-Fetch-Mode')
        assert.equal(items.total, 5, 'the rule does not change the answer to Node fetch()')
        assert.deepEqual(events.filter(e => e.type !== 'listening').map(e => [e.type, e.path, e.browser]), [['request', '/echo', false], ['request', '/api/example/items', false]])
      })
    })

    test('the client goes away: an abort line, not an error. The app cuts the body: an error line', async () => {
      const getCut = port => new Promise(resolve => http.get({ host: 'localhost', port, path: '/api/example/cut', headers: BROWSER, agent: false }, res => {
        res.on('error', () => {})
        res.on('close', () => resolve({ status: res.statusCode, complete: res.complete }))
        res.resume()
      }))
      await withProxy({}, async (port, events) => {
        const req = http.request({ host: 'localhost', port, path: '/slow', agent: false })
        req.on('error', () => {})
        req.end()
        await sleep(100)
        req.destroy()
        await waitFor(() => events.some(e => e.type === 'abort'), 'the abort line')
        await sleep(500) // the late answer of /slow comes now; the proxy must not log it as an error
        assert.deepEqual(await getCut(port), { status: 200, complete: false })
        await waitFor(() => events.some(e => e.type === 'error'), 'the error line')
        assert.deepEqual(events.filter(e => ['abort', 'error'].includes(e.type)).map(e => [e.type, e.path]), [['abort', '/slow'], ['error', '/api/example/cut']])
      })
      const rule = makeRule({ path: '^/api/example/cut$', field: 'total', op: 'add', value: 1 })
      await withProxy({ rule }, async (port, events) => {
        assert.deepEqual(await getCut(port), { status: 502, complete: true }, 'a rule buffers the body, so the client gets 502')
        const errors = events.filter(e => e.type === 'error')
        assert.equal(errors.length, 1)
        assert.match(errors[0].error, /^(aborted|the app closed the response before its end)$/)
      })
    })

    test('each op through the proxy, with the example rules', async () => {
      const rules = loadRules(EXAMPLE)
      const get = async (rule, p) => withProxy({ rule }, async port => JSON.parse((await request(port, p, { headers: BROWSER })).body))
      assert.deepEqual((await get(rules[0], '/api/example/items?page=1')).data.map(d => d.price), [2.5, 3])
      assert.equal((await get(rules[1], '/api/example/orders/7')).data.total, 25)
      assert.equal((await get(rules[2], '/api/example/orders/7')).data.status, 'cancelled')
      const suffix = makeRule({ path: '^/api/example/items$', field: 'data[*].name', op: 'suffix', value: ' (fake)' })
      assert.deepEqual((await get(suffix, '/api/example/items')).data.map(d => d.name), ['apple (fake)', 'pear (fake)'])
    })

    test('gzip, deflate, br and chunked bodies: decoded, changed, sent with no Content-Encoding', async () => {
      const rule = makeRule({ path: '^/api/example/(gzip|deflate|br|chunked)$', field: 'total', op: 'add', value: 1 })
      await withProxy({ rule }, async (port, events) => {
        for (const p of ['/api/example/gzip', '/api/example/deflate', '/api/example/br', '/api/example/chunked']) {
          const via = await request(port, p, { headers: { ...BROWSER, 'accept-encoding': 'gzip, deflate, br' } })
          assert.equal(via.headers['content-encoding'], undefined, p)
          assert.equal(via.headers['transfer-encoding'], undefined, p)
          assert.equal(Number(via.headers['content-length']), via.body.length, p)
          assert.equal(JSON.parse(via.body).total, 6, p)
        }
        assert.equal(events.filter(e => e.type === 'change').length, 4)
      })
    })

    test('a body that is not JSON goes through unchanged, and the log says why', async () => {
      const rule = makeRule({ path: '^/api/example/(text|broken|bad-gzip)$', field: 'total', op: 'add', value: 1 })
      await withProxy({ rule }, async (port, events) => {
        for (const p of ['/api/example/text', '/api/example/broken', '/api/example/bad-gzip']) {
          const [direct, via] = await Promise.all([request(upstream.port, p), request(port, p, { headers: BROWSER })])
          assert.ok(via.body.equals(direct.body), p)
          assert.equal(via.headers['content-encoding'], direct.headers['content-encoding'], p)
        }
        assert.deepEqual(events.filter(e => e.type === 'skip').map(e => [e.path, e.reason.replace(/:.*/, '')]), [
          ['/api/example/text', 'the body is not JSON'], ['/api/example/broken', 'the body is not JSON'], ['/api/example/bad-gzip', 'cannot decode gzip']
        ])
      })
    })

    test('method and path with the query must match', async () => {
      const post = makeRule({ method: 'post', path: '^/api/example/items$', field: 'total', op: 'add', value: 1 })
      await withProxy({ rule: post }, async (port, events) => {
        assert.equal(JSON.parse((await request(port, '/api/example/items', { headers: BROWSER })).body).total, 5)
        assert.deepEqual(events.map(e => e.type), ['listening', 'request'])
      })
      const query = makeRule({ path: '^/api/example/items\\?v=2$', field: 'total', op: 'add', value: 1 })
      await withProxy({ rule: query }, async port => {
        assert.equal(JSON.parse((await request(port, '/api/example/items?v=2', { headers: BROWSER })).body).total, 6)
        assert.equal(JSON.parse((await request(port, '/api/example/items', { headers: BROWSER })).body).total, 5)
      })
    })

    test('a matching request loses If-None-Match and If-Modified-Since; other requests keep them', async () => {
      const headers = { ...BROWSER, 'if-none-match': '"v1"', 'if-modified-since': 'Tue, 20 Oct 2026 10:00:00 GMT' }
      const rule = makeRule({ path: '^/echo$', field: 'method', op: 'suffix', value: '!' })
      await withProxy({ rule }, async port => {
        const echo = JSON.parse((await request(port, '/echo', { headers })).body)
        assert.equal(echo.method, 'GET!')
        assert.equal(echo.headers['if-none-match'], undefined)
        assert.equal(echo.headers['if-modified-since'], undefined)
      })
      await withProxy({}, async port => {
        const echo = JSON.parse((await request(port, '/echo', { headers })).body)
        assert.equal(echo.headers['if-none-match'], '"v1"')
      })
    })

    test('a websocket upgrade goes through as a raw pipe', async () => {
      await withProxy({}, async (port, events) => {
        const { ws, data } = await wsEcho(`ws://localhost:${port}/socket`, 'hello')
        assert.equal(data, 'hello')
        ws.close()
        assert.deepEqual(events.filter(e => e.upgrade).map(e => [e.type, e.method, e.path, e.browser]), [['request', 'GET', '/socket', false]])
      })
    })

    test('upstream down: 502 and an error line', async () => {
      const port = await freePort()
      const events = []
      const server = await startProxy({ port: 0, target: `http://localhost:${port}`, emit: e => events.push(e) })
      try {
        const via = await request(server.address().port, '/api/example/items')
        assert.equal(via.status, 502)
        assert.equal(events.filter(e => e.type === 'error').length, 1)
      } finally {
        await server.shutdown()
      }
    })
  })

  describe('proxy command line', () => {
    test('--help prints the usage', () => {
      const r = spawnSync(process.execPath, [PROXY, '--help'], { encoding: 'utf8', env: CHILD_ENV })
      assert.equal(r.status, 0)
      assert.match(r.stdout, /Rules file: \{"rules"/)
      assert.match(r.stdout, /Sec-Fetch-Mode/)
    })

    test('an unknown rule stops with exit 1 and the list of rules', () => {
      const r = spawnSync(process.execPath, [PROXY, '--rules', EXAMPLE, '--rule', 'nope'], { encoding: 'utf8', env: CHILD_ENV })
      assert.equal(r.status, 1)
      assert.match(r.stderr, /no rule "nope" in .*example-item-price-plus-1, example-order-total-x2, example-order-status/)
    })

    test('it starts, changes, logs to the file, and exits 0 on SIGTERM with an open websocket', async () => {
      const port = await freePort()
      const logFile = path.join(TMP, 'cli.jsonl')
      const child = spawn(process.execPath, [PROXY, '--port', String(port), '--target', upstream.url, '--rules', EXAMPLE, '--rule', 'example-order-status', '--log', logFile],
        { env: CHILD_ENV, stdio: ['ignore', 'pipe', 'pipe'] })
      let output = ''
      child.stdout.on('data', d => { output += d })
      child.stderr.on('data', d => { output += d })
      const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })))
      await waitFor(() => fs.existsSync(logFile) && fs.readFileSync(logFile, 'utf8').includes('"listening"'), 'the listening line')
      const order = JSON.parse((await request(port, '/api/example/orders/7', { headers: BROWSER })).body)
      assert.equal(order.data.status, 'cancelled')
      const { ws } = await wsEcho(`ws://localhost:${port}/socket`, 'x')
      child.kill('SIGTERM')
      const result = await Promise.race([exited, sleep(5000).then(() => 'timeout')])
      ws.close()
      assert.deepEqual(result, { code: 0, signal: null }, output)
      assert.match(output, /tamper-proxy on :\d+ to http:\/\/localhost:\d+, rule example-order-status, scope browser/)
      assert.match(output, /tamper-proxy stopped \(SIGTERM\)/)
      const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').map(l => JSON.parse(l))
      assert.deepEqual(lines.map(l => l.type), ['listening', 'request', 'change', 'request'])
      assert.deepEqual(lines[0], { ...lines[0], port, rule: 'example-order-status', scope: 'browser' })
      assert.deepEqual(lines[2].changes, [{ field: 'data.status', old: 'placed', new: 'cancelled' }])
      assert.equal(lines[3].upgrade, true)
    })
  })

  test('findPlaywright: the old layout and <set>/run-<n>/suite-a|b', () => {
    const runs = path.join(TMP, 'runs')
    const fakePlaywright = dir => {
      for (const p of ['playwright', '@playwright/test']) {
        fs.mkdirSync(path.join(dir, 'node_modules', p), { recursive: true })
        fs.writeFileSync(path.join(dir, 'node_modules', p, 'package.json'), '{}')
      }
      return path.join(dir, 'node_modules')
    }
    assert.equal(findPlaywright(runs, undefined), null)
    fs.mkdirSync(path.join(runs, 'set-1', 'run-1', 'suite-a'), { recursive: true }) // no node_modules
    fs.mkdirSync(path.join(runs, 'set-1', 'templates'), { recursive: true })
    const setTwo = fakePlaywright(path.join(runs, 'set-2', 'run-3', 'suite-b'))
    assert.equal(findPlaywright(runs, undefined), setTwo)
    const old = fakePlaywright(path.join(runs, 'suite-a'))
    assert.equal(findPlaywright(runs, undefined), old)
    assert.equal(findPlaywright(runs, setTwo), setTwo, 'TAMPER_TEST_PLAYWRIGHT comes first')
    assert.equal(findPlaywright(path.join(TMP, 'missing'), undefined), null)
  })

  test('Playwright is found (only with TAMPER_REQUIRE_BROWSER=1)', { skip: process.env.TAMPER_REQUIRE_BROWSER !== '1' }, () => {
    assert.ok(PW_MODULES, 'TAMPER_REQUIRE_BROWSER=1, but no suite in harness-demo-runs has Playwright. Set TAMPER_TEST_PLAYWRIGHT.')
  })

  describe('real browser: Chromium through the proxy', { skip: NO_PW }, () => {
    const pw = PW_MODULES && createRequire(import.meta.url)(path.join(PW_MODULES, 'playwright'))
    let browser
    before(async () => { browser = await pw.chromium.launch() })
    after(async () => { await browser?.close() })
    const newContext = (port) => browser.newContext({ ...pw.devices['Desktop Chrome'], baseURL: `http://localhost:${port}` })

    test('Chromium sends the three Fetch Metadata headers on each request; the APIRequestContext sends none', async () => {
      await withProxy({}, async (port, events) => {
        const context = await newContext(port)
        const page = await context.newPage()
        await page.goto('/')
        await page.locator('#total').filter({ hasText: '5' }).waitFor()
        const fromPage = await page.evaluate(() => fetch('/echo').then(r => r.json()))
        const fromXhr = await page.evaluate(() => new Promise(resolve => {
          const x = new XMLHttpRequest()
          x.open('GET', '/echo')
          x.onload = () => resolve(JSON.parse(x.responseText))
          x.send()
        }))
        const fromPageRequest = await (await page.request.get('/echo')).json()
        const api = await pw.request.newContext({ baseURL: `http://localhost:${port}` })
        const fromApi = await (await api.get('/echo')).json()
        await api.dispose()
        await context.close()
        const meta = h => FETCH_METADATA.map(m => h[m]).join('/')
        console.log(`Chromium ${browser.version()}: site/mode/dest fetch=${meta(fromPage.headers)}, xhr=${meta(fromXhr.headers)}, ` +
          `sec-ch-ua=${fromPage.headers['sec-ch-ua']}; page.request=${meta(fromPageRequest.headers)}, request.newContext=${meta(fromApi.headers)}`)
        assert.deepEqual(FETCH_METADATA.map(m => fromPage.headers[m]), ['same-origin', 'cors', 'empty'])
        assert.deepEqual(FETCH_METADATA.map(m => fromXhr.headers[m]), ['same-origin', 'cors', 'empty'])
        for (const h of FETCH_METADATA) {
          assert.equal(fromPageRequest.headers[h], undefined, `page.request ${h}`)
          assert.equal(fromApi.headers[h], undefined, `request.newContext ${h}`)
        }
        const requests = events.filter(e => e.type === 'request' && e.path !== '/favicon.ico')
        assert.deepEqual(requests.map(e => [e.path, e.browser]), [['/', true], ['/api/example/items', true], ['/echo', true], ['/echo', true], ['/echo', false], ['/echo', false]])
      })
    })

    test('scope browser: the page shows the changed value; the API call gets the true value', async () => {
      const rule = makeRule({ id: 'total', path: '^/api/example/items$', field: 'total', op: 'set', value: 99 })
      await withProxy({ rule }, async (port, events) => {
        const context = await newContext(port)
        const page = await context.newPage()
        await page.goto('/')
        await page.locator('#total').filter({ hasText: '99' }).waitFor()
        const api = await (await context.request.get('/api/example/items')).json()
        await context.close()
        assert.equal(api.total, 5)
        assert.deepEqual(events.filter(e => e.type === 'change').map(e => [e.path, e.changes]), [['/api/example/items', [{ field: 'total', old: 5, new: 99 }]]])
      })
    })

    test('a websocket from Chromium goes through the proxy', async () => {
      await withProxy({}, async (port, events) => {
        const context = await newContext(port)
        const page = await context.newPage()
        await page.goto('/')
        const echo = await page.evaluate(() => new Promise((resolve, reject) => {
          const ws = new WebSocket(`${location.origin.replace('http', 'ws')}/socket`)
          ws.onopen = () => ws.send('from chromium')
          ws.onmessage = m => { resolve(m.data); ws.close() }
          ws.onerror = () => reject(new Error('websocket error'))
        }))
        await context.close()
        assert.equal(echo, 'from chromium')
        assert.deepEqual(events.filter(e => e.upgrade).map(e => [e.path, e.browser]), [['/socket', true]])
      })
    })
  })

  describe('audit runner', () => {
    const report = statuses => ({
      errors: [],
      tests: Object.fromEntries(Object.entries(statuses).map(([k, s], i) => [k, { tc: `TC-0${i + 1}`, statuses: [s] }]))
    })
    const windows = [{ key: 't1', start: 1000, end: 2000 }, { key: 't2', start: 2100, end: 3000 }, { key: 't3', start: 3100, end: 4000 }]
    const at = (ms, e) => ({ ...e, time: new Date(ms).toISOString(), ms })
    const change = { method: 'GET', path: '/a', changes: [{ field: 'x', old: 1, new: 2 }] }
    // A test and a suite run in the shape that attribute() and suiteRun() give.
    const tst = (statuses, fired, more = {}) => ({
      tc: null, statuses, passed: statuses.length > 0 && statuses.every(s => s === 'passed'), browserRequests: 1, otherRequests: 0, upgrades: 0,
      changes: fired ? [change] : [], skips: 0, skipReasons: [], aborts: 0, errors: [], ...more
    })
    const runResult = (tests, more = {}) => ({ exit: 0, errors: [], proxy: { code: 0, signal: null, early: false }, tests, outside: attribute({ tests: {} }, [], []).outside, ...more })
    const [exampleRule] = loadRules(EXAMPLE)

    test('attribute puts each log line into the test window that holds its time', () => {
      const events = [
        at(1000, { type: 'request', browser: true }), at(1600, { type: 'change', ...change }),
        at(2050, { type: 'request', browser: true }), at(2500, { type: 'change', ...change, changes: [] }),
        at(2600, { type: 'skip', reason: 'no value to change at x' }), at(2650, { type: 'skip', reason: 'no value to change at x' }),
        at(2700, { type: 'request', browser: true, upgrade: true }), at(2800, { type: 'abort' }),
        at(2900, { type: 'error', method: 'GET', path: '/b', error: 'connect ECONNREFUSED' }),
        at(3500, { type: 'request', browser: false }), at(4001, { type: 'change', ...change })
      ]
      const { tests, outside } = attribute(report({ t1: 'passed', t2: 'failed', t3: 'passed' }), windows, events)
      assert.deepEqual([tests.t1.browserRequests, tests.t1.changes.length, tests.t1.passed], [1, 1, true])
      assert.deepEqual([tests.t2.browserRequests, tests.t2.upgrades, tests.t2.changes.length, tests.t2.skips, tests.t2.skipReasons, tests.t2.aborts, tests.t2.errors, tests.t2.passed],
        [0, 1, 1, 2, ['no value to change at x'], 1, ['GET /b: connect ECONNREFUSED'], false])
      assert.deepEqual([tests.t3.browserRequests, tests.t3.otherRequests, tests.t3.changes.length], [0, 1, 0])
      assert.deepEqual([outside.browserRequests, outside.changes.length], [1, 1])
      assert.equal(verdict(tests), 'caught')
      assert.deepEqual(passthroughProblems(runResult(tests, { errors: ['global setup failed'] })), [
        'report error: global setup failed',
        '1 proxy errors (the app did not answer), first: GET /b: connect ECONNREFUSED',
        't2: failed with no rule. The proxy breaks the app, or the test is not stable.',
        't3: no browser HTTP request went through the proxy. The test goes around BASE_URL.'
      ])
      assert.deepEqual(passthroughProblems(runResult({})), ['the report has no tests'])
      assert.deepEqual(passthroughProblems(runResult({ s: tst(['skipped'], false) })), ['s: skipped (the test did not run to the end)'])
    })

    test('runProblems: each reason for an invalid run', () => {
      const keys = ['a', 'b']
      const ok = { a: tst(['passed'], true), b: tst(['failed', 'timedOut'], false) }
      assert.deepEqual(runProblems(runResult(ok), keys), [])
      assert.deepEqual(runProblems(runResult(ok, { exit: 130 }), keys), ['Playwright exit 130 (interrupted)'])
      assert.deepEqual(runProblems(runResult({ a: ok.a, b: tst(['interrupted'], false) }), keys), ['b: interrupted (the test did not run to the end)'])
      assert.deepEqual(runProblems(runResult({ a: tst([], true) }), keys), ['b: not in the report', 'a: no result (the test did not run to the end)'])
      assert.deepEqual(runProblems(runResult({}, { exit: 1, errors: ['global setup failed'] }), ['a']), ['report error: global setup failed', 'a: not in the report'])
      assert.deepEqual(runProblems(runResult({ a: tst(['failed'], true, { errors: ['GET /api/x: socket hang up'] }), b: ok.b }), keys),
        ['1 proxy errors (the app did not answer), first: GET /api/x: socket hang up'])
      assert.deepEqual(runProblems(runResult(ok, { proxy: { code: 1, signal: null, early: true } }), keys), ['the proxy stopped during the run: code 1, signal null'])
      assert.deepEqual(runProblems(runResult(ok, { proxy: { code: null, signal: 'SIGKILL', early: false } }), keys), ['the proxy did not exit clean: code null, signal SIGKILL'])
      assert.deepEqual(runProblems(runResult({}, { exit: 1, noReport: 'no Playwright report (x.json), exit 1: boom' }), keys), ['no Playwright report (x.json), exit 1: boom'])
    })

    test('ruleRow: an interrupted run or a run with report errors gets "invalid", not a verdict', () => {
      // The scenario of the review: t1 fired and passed, the run stopped in t2 (Ctrl-C). Before the fix: "caught".
      const stopped = ruleRow(exampleRule, runResult({ t1: tst(['passed'], true), t2: tst(['interrupted'], false) }, { exit: 130 }), ['t1', 't2'])
      assert.deepEqual([stopped.verdict, stopped.problems], ['invalid', ['Playwright exit 130 (interrupted)', 't2: interrupted (the test did not run to the end)']])
      // A global setup error and no tests. Before the fix: "not exercised".
      const setup = ruleRow(exampleRule, runResult({}, { exit: 1, errors: ['global setup failed'] }), ['t1'])
      assert.deepEqual([setup.verdict, setup.problems], ['invalid', ['report error: global setup failed', 't1: not in the report']])
      assert.equal(ruleRow(exampleRule, runResult({ t1: tst(['passed'], true) }), ['t1']).verdict, 'survived')
    })

    test('verdict and recheck: a failed test that is not stable is not a catch', () => {
      const t = (passed, fired) => ({ passed, changes: fired ? [{}] : [] })
      assert.equal(verdict({ a: t(true, true), b: t(false, false) }), 'survived')
      assert.equal(verdict({ a: t(true, true), b: t(false, true) }), 'caught')
      assert.equal(verdict({ a: t(true, false), b: t(false, false) }), 'not exercised')
      assert.equal(verdict({ a: t(true, true), b: t(false, true) }, new Set(['a', 'b'])), 'caught')
      assert.equal(verdict({ a: t(true, true), b: t(false, true) }, new Set(['a'])), 'survived')

      const keys = ['flaky', 'green']
      const recheck = recheckResult(runResult({ flaky: tst(['passed', 'failed'], false), green: tst(['passed', 'passed'], false) }), 2, keys)
      assert.deepEqual([[...recheck.stable], recheck.problems], [['green'], []])
      assert.deepEqual([...recheckResult(runResult({ green: tst(['passed'], false) }), 2, ['green']).stable], [], 'a test with fewer results than runs is not stable')
      const rule = runResult({ flaky: tst(['failed'], true), green: tst(['passed'], true) })
      const row = ruleRow(exampleRule, rule, keys, recheck)
      assert.equal(row.verdict, 'survived')
      assert.deepEqual(row.fired.map(f => [f.test, f.stableInRecheck]), [['flaky', false], ['green', null]])
      assert.equal(ruleRow(exampleRule, rule, keys, null).verdict, 'caught', 'no recheck: each fired failure is a catch')
      const badRecheck = recheckResult(runResult({ flaky: tst(['interrupted'], false) }, { exit: 130 }), 2, keys)
      const row2 = ruleRow(exampleRule, rule, keys, badRecheck)
      assert.equal(row2.verdict, 'invalid')
      assert.match(row2.problems.at(-1), /^the recheck run is not valid: Playwright exit 130 \(interrupted\); green: not in the report; flaky: interrupted/)
      assert.equal(ruleRow(exampleRule, runResult({ green: tst(['passed'], true) }), ['green'], badRecheck).verdict, 'survived', 'a rule with no fired failure does not need the recheck')
    })

    test('markdown: invalid runs, matched but not changed, survived tests with their result', () => {
      const keys = ['t1', 't2']
      const rows = [
        ruleRow(exampleRule, runResult({ t1: tst(['failed'], true), t2: tst(['passed'], false) }), keys),
        ruleRow({ ...exampleRule, id: 'wrong-field', field: 'data.price' }, runResult({ t1: tst(['passed'], false, { skips: 2, skipReasons: ['no value to change at data.price'] }), t2: tst(['passed'], false) }), keys),
        ruleRow({ ...exampleRule, id: 'stopped' }, runResult({ t1: tst(['passed'], true), t2: tst(['interrupted'], false) }, { exit: 130 }), keys),
        ruleRow({ ...exampleRule, id: 'weak' }, runResult({ t1: tst(['failed'], true), t2: tst(['passed'], true) }), keys, { runs: 3, stable: new Set(['t2']), problems: [] })
      ]
      const md = markdown({
        out: 'tamper-U', generatedAt: '2026-10-20T10:00:00.000Z', suite: { label: 'U', path: '/x', commit: 'unknown', tags: [] }, rulesFile: EXAMPLE,
        rulesSha256: 'abc', passthrough: { tests: 2, browserRequests: 9 }, recheck: { runs: 3 }, recheckRuns: 3, rules: rows, summary: summary(rows)
      })
      assert.match(md, /\| example-item-price-plus-1 \| the price of each item in the list \| caught \| 1 \| 1 \| 0 \|/)
      assert.match(md, /\| wrong-field \| the price of each item in the list \| not exercised \| 0 \| 0 \| 2 \|/)
      assert.match(md, /\| stopped \| .* \| invalid \| 1 \| 0 \| 0 \|/)
      assert.match(md, /Rules: 4\. Caught: 1\. Survived: 1\. Not exercised: 1\. Invalid: 1\./)
      assert.match(md, /## Invalid runs\n\nThese rules have no verdict.*\n\n- stopped: Playwright exit 130 \(interrupted\); t2: interrupted \(the test did not run to the end\)/)
      assert.match(md, /## Matched, not changed\n\n.*\n\n- wrong-field: 2 responses, field `data\.price`, op add\. Reasons: no value to change at data\.price/)
      assert.match(md, /### weak: .*\n[\s\S]*\| `t1` \|  \| failed, not stable in the recheck \| 1 \| GET \/a: x 1 to 2 \|\n\| `t2` \|  \| passed \| 1 \|/)
      assert.match(md, /Recheck: 3 more runs with no rule/)
      assert.doesNotMatch(md, /## Noise/, 'an invalid run gives no noise lines')
    })

    test('readEvents reads the JSON lines and skips broken lines', () => {
      const file = path.join(TMP, 'events.jsonl')
      fs.writeFileSync(file, '{"time":"2026-10-20T10:00:00.000Z","type":"request","browser":true}\nnot json\n{"type":"no time"}\n')
      assert.deepEqual(readEvents(file).map(e => [e.type, e.ms]), [['request', Date.parse('2026-10-20T10:00:00.000Z')]])
      assert.deepEqual(readEvents(path.join(TMP, 'missing.jsonl')), [])
    })

    test('readWindows: same keys as readReport, sorted, each window ends at the next start', () => {
      const file = path.join(TMP, 'report.json')
      const result = (startTime, duration) => ({ startTime, duration, status: 'passed' })
      fs.writeFileSync(file, JSON.stringify({
        suites: [{
          title: 'a.spec.ts',
          specs: [{ file: 'a.spec.ts', title: 'second', tests: [{ results: [result('2026-10-20T10:00:05.000Z', 100)] }] }],
          suites: [{ title: 'group', specs: [{ file: 'a.spec.ts', title: 'first', tests: [{ results: [result('2026-10-20T10:00:01.000Z', 100)] }] }] }]
        }]
      }))
      const ms = iso => Date.parse(`2026-10-20T10:00:0${iso}.000Z`)
      assert.deepEqual(readWindows(file), [
        { key: 'a.spec.ts :: group > first', start: ms(1), end: ms(5) },
        { key: 'a.spec.ts :: second', start: ms(5), end: Infinity }
      ])
    })

    test('--help and --dry start nothing', () => {
      const suite = path.join(TMP, 'dry-suite')
      fs.mkdirSync(suite, { recursive: true })
      fs.writeFileSync(path.join(suite, 'playwright.config.mjs'), 'export default {}\n')
      const help = spawnSync(process.execPath, [RUNNER, '--help'], { encoding: 'utf8', env: CHILD_ENV })
      assert.equal(help.status, 0)
      assert.match(help.stdout, /Verdict of a rule/)
      assert.match(help.stdout, /Invalid run:/)
      const dry = spawnSync(process.execPath, [RUNNER, '--suite', `T1=${suite}`, '--rules', EXAMPLE, '--only', 'example-order-status', '--dry'], { encoding: 'utf8', env: CHILD_ENV })
      assert.equal(dry.status, 0, dry.stderr)
      assert.match(dry.stdout, /1 selected: example-order-status/)
      assert.match(dry.stdout, /3\. example-order-status \(the status of the order\): restart the app; proxy --rule example-order-status; the same suite run, raw files rules\/example-order-status\.\*/)
      assert.match(dry.stdout, /4\. only when a test failed where its rule fired: restart the app; proxy with no rule; .*--repeat-each=3/)
      assert.match(dry.stdout, /dry run: no app, no proxy, no suite run/)
      const bad = spawnSync(process.execPath, [RUNNER, '--suite', `T1=${suite}`, '--rules', EXAMPLE, '--port', '3000', '--dry'], { encoding: 'utf8', env: CHILD_ENV })
      assert.equal(bad.status, 1)
      assert.match(bad.stderr, /--port must be 1024 to 65535 and not 3000/)
      const badRecheck = spawnSync(process.execPath, [RUNNER, '--suite', `T1=${suite}`, '--rules', EXAMPLE, '--recheck', 'x', '--dry'], { encoding: 'utf8', env: CHILD_ENV })
      assert.equal(badRecheck.status, 1)
      assert.match(badRecheck.stderr, /--recheck must be 0 to 20/)
    })

    // A temp Playwright project. node_modules is a symlink to the node_modules of a suite (read only).
    function makeSuite (name, tests) {
      const suite = path.join(TMP, name)
      fs.mkdirSync(path.join(suite, 'tests'), { recursive: true })
      fs.symlinkSync(PW_MODULES, path.join(suite, 'node_modules'))
      fs.writeFileSync(path.join(suite, 'playwright.config.mjs'), "export default { testDir: 'tests', expect: { timeout: 2000 }, use: { baseURL: process.env.BASE_URL } }\n")
      fs.writeFileSync(path.join(suite, 'tests', 'shop.spec.mjs'), ["import { test, expect } from '@playwright/test'", ...tests, ''].join('\n'))
      return suite
    }
    const key = title => `shop.spec.mjs :: ${title}`
    const TOTAL_IS_EXACT = "test('total is exact', async ({ page }) => { await page.goto('/'); await expect(page.locator('#total')).toHaveText('5') })"

    test('real Playwright: the passthrough check finds tests that go around the browser (request fixture, Node fetch)', { skip: NO_PW }, async () => {
      const suite = makeSuite('pw-bypass', [
        TOTAL_IS_EXACT,
        "test('api only', async ({ request }) => { expect((await request.get('/api/example/items')).ok()).toBe(true) })",
        "test('node fetch only', async () => { expect((await fetch(`${process.env.BASE_URL}/api/example/items`)).ok).toBe(true) })"
      ])
      const cfg = { label: 'T', suite, rulesFile: EXAMPLE, port: await freePort(), recheck: 0, target: upstream.url, out: 'tamper-T', raw: path.join(TMP, 'raw-bypass') }
      const pass = await suiteRun(cfg, 'passthrough', null)
      const first = JSON.parse(fs.readFileSync(pass.report, 'utf8')).suites[0].specs[0].tests[0].results[0]
      const firstBrowserRequest = readEvents(path.join(cfg.raw, 'passthrough.jsonl')).find(e => e.type === 'request' && e.browser)
      console.log(`first test: startTime ${first.startTime}, startTime + duration ${new Date(Date.parse(first.startTime) + first.duration).toISOString()}, ` +
        `first browser request ${firstBrowserRequest.time}`)
      assert.deepEqual(Object.values(pass.tests).map(t => t.passed), [true, true, true])
      assert.ok(pass.tests[key('total is exact')].browserRequests >= 2)
      assert.deepEqual([pass.tests[key('api only')].otherRequests, pass.tests[key('node fetch only')].otherRequests], [1, 1])
      assert.deepEqual(passthroughProblems(pass), [
        `${key('api only')}: no browser HTTP request went through the proxy. The test goes around BASE_URL.`,
        `${key('node fetch only')}: no browser HTTP request went through the proxy. The test goes around BASE_URL.`
      ])
    })

    test('real Playwright: audit() gives caught, survived, not exercised (with and without matches), invalid; recheck', { skip: NO_PW }, async () => {
      const suite = makeSuite('pw-audit', [
        TOTAL_IS_EXACT,
        "test('total is shown', async ({ page }) => {",
        "  await page.goto('/')",
        "  await expect(page.locator('#total')).not.toHaveText('...')",
        "  // the rule stop-run sets the total to -1: then the test stops its Playwright run, the same as Ctrl-C",
        "  if (await page.locator('#total').textContent() === '-1') { process.kill(process.ppid, 'SIGINT'); await page.waitForTimeout(20000) }",
        '})',
        "test('names, not stable', async ({ page }, testInfo) => {",
        "  await page.goto('/')",
        "  await expect(page.locator('#names')).toHaveText('apple,pear')",
        '  expect(testInfo.repeatEachIndex).toBe(0)',
        '})'
      ])
      const rulesFile = writeRules([
        { id: 'total-plus-1', what: 'the total', method: 'GET', path: '^/api/example/items$', field: 'total', op: 'add', value: 1 },
        { id: 'name-suffix', what: 'the item names', path: '^/api/example/items$', field: 'data[*].name', op: 'suffix', value: ' X' },
        { id: 'unused', what: 'nothing', path: '^/api/example/none$', field: 'total', op: 'add', value: 1 },
        { id: 'wrong-field', what: 'the total, wrong field path', path: '^/api/example/items$', field: 'data.total', op: 'add', value: 1 },
        { id: 'stop-run', what: 'the total, a test stops the run', path: '^/api/example/items$', field: 'total', op: 'set', value: -1 }
      ])
      const cfg = { label: 'T', suite, rulesFile, rules: loadRules(rulesFile), port: await freePort(), recheck: 2, target: upstream.url, out: 'tamper-T', raw: path.join(TMP, 'raw-audit') }
      let restarts = 0
      const result = await audit(cfg, { restartApp: () => { restarts++ }, checkStop: () => {} })
      const rows = Object.fromEntries(result.rules.map(r => [r.id, r]))
      console.log(result.rules.map(r => `${r.id}: ${r.verdict}${r.problems.length ? ` (${r.problems.join('; ')})` : ''}`).join('\n'))
      assert.deepEqual(result.rules.map(r => [r.id, r.verdict]), [
        ['total-plus-1', 'caught'], ['name-suffix', 'survived'], ['unused', 'not exercised'], ['wrong-field', 'not exercised'], ['stop-run', 'invalid']
      ])
      assert.equal(restarts, 7, 'the passthrough, 5 rules and the recheck each start on a fresh app')
      assert.deepEqual(rows['total-plus-1'].fired.map(f => [f.test, f.passed, f.stableInRecheck]), [
        [key('total is exact'), false, true], [key('total is shown'), true, null], [key('names, not stable'), true, null]
      ])
      assert.deepEqual(rows['total-plus-1'].fired[0].sample[0].changes, [{ field: 'total', old: 5, new: 6 }])
      assert.deepEqual(rows['name-suffix'].fired.map(f => [f.test, f.passed, f.stableInRecheck]), [
        [key('total is exact'), true, null], [key('total is shown'), true, null], [key('names, not stable'), false, false]
      ])
      assert.deepEqual([rows.unused.skips, rows['wrong-field'].skips, rows['wrong-field'].skipReasons], [0, 3, ['no value to change at data.total']])
      assert.ok(rows['stop-run'].problems.some(p => /interrupted/.test(p)), rows['stop-run'].problems.join('; '))
      assert.deepEqual([result.recheck.runs, result.recheck.stable, result.recheck.problems], [2, [key('total is exact'), key('total is shown')], []])
      for (const f of ['passthrough.json', 'passthrough.jsonl', 'recheck.json', 'rules/total-plus-1.json', 'rules/total-plus-1.jsonl', 'rules/stop-run.playwright.txt']) {
        assert.ok(fs.existsSync(path.join(cfg.raw, f)), f)
      }
      const md = markdown({
        out: 'tamper-T', generatedAt: '2026-10-20T10:00:00.000Z', suite: { label: 'T', path: suite, commit: 'unknown', tags: [] },
        rulesFile, rulesSha256: 'abc', recheckRuns: 2, ...result, summary: summary(result.rules)
      })
      console.log(md)
      assert.match(md, /\| total-plus-1 \| the total \| caught \| 3 \| 1 \| 0 \|/)
      assert.match(md, /\| name-suffix \| the item names \| survived \| 3 \| 1 \| 0 \|/)
      assert.match(md, /\| wrong-field \| the total, wrong field path \| not exercised \| 0 \| 0 \| 3 \|/)
      assert.match(md, /\| `shop.spec.mjs :: names, not stable` \|  \| failed, not stable in the recheck \| 1 \| GET \/api\/example\/items: data\[0\]\.name "apple" to "apple X" \|/)
      assert.match(md, /- stop-run: .*interrupted/)
      assert.doesNotMatch(md, /## Noise/, 'an invalid run gives no noise lines')
    })

    test('real Playwright: audit() checks the stop signal after the last rule run, before a verdict', { skip: NO_PW }, async () => {
      const suite = makeSuite('pw-stop', [TOTAL_IS_EXACT])
      const rulesFile = writeRules([{ id: 'unused', what: 'nothing', path: '^/api/example/none$', field: 'total', op: 'add', value: 1 }])
      const cfg = { label: 'T', suite, rulesFile, rules: loadRules(rulesFile), port: await freePort(), recheck: 0, target: upstream.url, out: 'tamper-T', raw: path.join(TMP, 'raw-stop') }
      let calls = 0
      // Calls: 1 after the passthrough, 2 before the rule, 3 after the rule run. A signal came during the rule run.
      const checkStop = () => { if (++calls === 3) throw new Error('stopped by SIGINT. No results are written.') }
      await assert.rejects(audit(cfg, { restartApp: () => {}, checkStop }), /stopped by SIGINT/)
      assert.ok(fs.existsSync(path.join(cfg.raw, 'rules', 'unused.json')), 'the rule run ended before the stop')
    })
  })
}

if (process.env.TAMPER_FAKE_UPSTREAM === '1') serveFakeUpstream()
else registerTests()
