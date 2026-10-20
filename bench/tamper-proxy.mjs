#!/usr/bin/env node
// Reverse proxy for the E4 audit (plan v2, E4 step 2): it changes one field in the JSON responses of the app.
// The tests go to the proxy port through BASE_URL. The test code does not change.
//
//   node bench/tamper-proxy.mjs --port 3100 --target http://localhost:3000                              no change
//   node bench/tamper-proxy.mjs --port 3100 --target http://localhost:3000 --rules <file> --rule <id>    rule <id>
//   options: --scope browser|all (default browser), --log <jsonl file> (default: standard output), --help
//   --rules is necessary only with --rule. Without --rule, the proxy checks the rules file if you give it.
//
// Without --rule, each request and each response goes through without a change: the body byte for byte and the
// headers, but not the hop-by-hop headers (Connection, Keep-Alive, Transfer-Encoding, Upgrade, TE, Trailer,
// Proxy-*, and the headers that Connection names). The Host header stays as the client sent it.
// Websocket upgrades go through as raw pipes, with no change.
// The proxy opens a new upstream connection for each request (no keep-alive). Thus an idle connection that the app
// closes cannot give a false upstream error.
//
// Rules file: {"rules": [<rule>, ...]}. The proxy ignores the other top-level keys. See bench/tamper-rules.example.json.
//   id      a unique name: letters, digits, _, . or -. Two ids must not differ only in letter case.
//   what    the value that the test case names, in plain words (for the report)
//   method  optional: the HTTP method. Without it, all methods match.
//   path    a regular expression on the request path with the query, for example ^/api/example/items(\?|$)
//   field   the path in the JSON body: dot notation, [*] for each array item, [n] for item n.
//           Examples: total, data[*].price, [*].name, data.items[0].quantity
//   op      add (number + value), mul (number * value), set (value replaces the field), suffix (string + value)
//   value   a number for add and mul, a string for suffix, any JSON value for set
// Only the active rule (--rule) applies. A missing field, or a field with the wrong type for op, does not change.
// add and mul round the result to 15 significant digits, so 0.1 + 0.2 gives 0.3.
// A body that does not parse as JSON goes through unchanged. The proxy decodes gzip, deflate, br and zstd bodies.
// A changed body goes out without Content-Encoding and with a new Content-Length. For a request that matches the rule,
// the proxy removes If-None-Match and If-Modified-Since, so that the app sends a full body and not 304.
//
// Scope browser (default): only the responses to browser requests change. A browser request has all three Fetch
// Metadata headers Sec-Fetch-Site, Sec-Fetch-Mode and Sec-Fetch-Dest. Chromium sends them on each HTTP request to a
// trustworthy origin, and http://localhost and http://127.0.0.1 are trustworthy. The Playwright APIRequestContext
// (the request fixture, page.request, context.request) sends none of them. The fetch() of Node (undici) sends only
// Sec-Fetch-Mode, so one header is not sufficient. Thus the API calls for the test preconditions get the true values.
// The test bench/test/tamper-proxy.test.mjs checks this with Playwright 1.64.1, Chromium 156 and Node 24.
// The proxy does not use Sec-CH-UA: client hints depend on the browser settings. The websocket handshake of Chromium
// has no Fetch Metadata, so an upgrade is a browser request when it has the Origin header. The Node WebSocket sends
// no Origin. Upgrades never change, so this affects only the log.
// BASE_URL must use localhost or 127.0.0.1. On other http hosts, Chromium sends no Fetch Metadata.
// Scope all: the responses to all requests that match the rule change.
//
// Log: one JSON line for each event, each with "time" (ISO) and "type":
//   listening  the proxy is ready: port, target, rule, scope
//   request    each request: method, path, browser (true or false), upgrade (only for a websocket)
//   change     each changed response: rule, method, path, status, changes: [{field, old, new}]
//   skip       a response that matched the rule but did not change: rule, method, path, status, reason
//   abort      the client closed the connection before the end of the response, or an open websocket closed with
//              a socket error: method, path (error for a websocket). This is not an error of the proxy.
//   error      the app did not answer or broke the response (the client gets 502 or a cut body): method, path, error
// SIGTERM or SIGINT: the proxy closes all connections and exits with code 0.
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import zlib from 'node:zlib'
import { log, opt } from './lib.mjs'

const HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'proxy-connection', 'te', 'trailer', 'transfer-encoding', 'upgrade'])
const RULE_KEYS = new Set(['id', 'what', 'method', 'path', 'field', 'op', 'value'])
const FIELD = /^(\[\*\]|\[\d+\]|[^.[\]]+)(\.[^.[\]]+|\[\*\]|\[\d+\])*$/
const EACH = Symbol('each array item')
const round = n => Number(n.toPrecision(15))
const OPS = {
  add: (old, v) => typeof old === 'number' ? round(old + v) : undefined,
  mul: (old, v) => typeof old === 'number' ? round(old * v) : undefined,
  set: (old, v) => v,
  suffix: (old, v) => typeof old === 'string' ? old + v : undefined
}
const VALUE_TYPE = { add: 'number', mul: 'number', suffix: 'string' }
const inflate = b => { try { return zlib.inflateSync(b) } catch { return zlib.inflateRawSync(b) } }
const DECODE = { gzip: zlib.gunzipSync, 'x-gzip': zlib.gunzipSync, deflate: inflate, br: zlib.brotliDecompressSync, zstd: zlib.zstdDecompressSync }

// The leading comment of a script file, without the comment marks. For --help.
export function usage (fileUrl) {
  const lines = fs.readFileSync(fileURLToPath(fileUrl), 'utf8').split('\n').slice(1)
  return lines.slice(0, lines.findIndex(l => !l.startsWith('//'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n')
}

// Reads and checks a rules file. Returns the rules with a compiled path (re) and a parsed field (steps).
export function loadRules (file) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(doc?.rules) || doc.rules.length === 0) throw new Error(`${file}: no "rules" array`)
  const ids = new Set()
  return doc.rules.map((r, i) => {
    const bad = msg => new Error(`${file}, rule ${r?.id ?? `#${i + 1}`}: ${msg}`)
    if (r === null || typeof r !== 'object' || Array.isArray(r)) throw bad('the rule is not an object')
    const extra = Object.keys(r).filter(k => !RULE_KEYS.has(k))
    if (extra.length) throw bad(`unknown keys: ${extra.join(', ')}`)
    if (typeof r.id !== 'string' || !/^[\w.-]+$/.test(r.id)) throw bad('"id" must be letters, digits, _, . or -')
    if (ids.has(r.id.toLowerCase())) throw bad('the id is not unique (letter case does not count)')
    ids.add(r.id.toLowerCase())
    if (typeof r.what !== 'string' || !r.what.trim()) throw bad('no "what"')
    if (r.method !== undefined && !/^[A-Za-z]+$/.test(r.method)) throw bad('"method" must be an HTTP method')
    if (typeof r.path !== 'string' || !r.path) throw bad('no "path"')
    let re
    try { re = new RegExp(r.path) } catch (e) { throw bad(`"path" is not a regular expression: ${e.message}`) }
    if (typeof r.field !== 'string' || !FIELD.test(r.field)) throw bad('"field" must be like data[*].price')
    if (!Object.hasOwn(OPS, r.op)) throw bad(`"op" must be one of: ${Object.keys(OPS).join(', ')}`)
    if (r.value === undefined || (VALUE_TYPE[r.op] && typeof r.value !== VALUE_TYPE[r.op])) {
      throw bad(`"value" must be ${VALUE_TYPE[r.op] ? `a ${VALUE_TYPE[r.op]}` : 'a JSON value'} for op ${r.op}`)
    }
    return { ...r, method: r.method?.toUpperCase(), re, steps: parseField(r.field) }
  })
}

const parseField = field => field.match(/\[\*\]|\[\d+\]|[^.[\]]+/g)
  .map(t => t === '[*]' ? EACH : t.startsWith('[') ? Number(t.slice(1, -1)) : t)

// Applies the rule to the parsed JSON body in place. Returns [{field, old, new}] for each value that changed.
export function applyRule (json, rule) {
  const changes = []
  const visit = (node, steps, label) => {
    if (node === null || typeof node !== 'object') return
    const [step, ...rest] = steps
    const keys = step === EACH ? (Array.isArray(node) ? [...node.keys()] : []) : [step]
    for (const key of keys) {
      if (!Object.hasOwn(node, key)) continue
      const name = typeof key === 'number' ? `${label}[${key}]` : label ? `${label}.${key}` : key
      if (rest.length) { visit(node[key], rest, name); continue }
      const next = OPS[rule.op](node[key], rule.value)
      if (next === undefined || isDeepStrictEqual(next, node[key])) continue
      changes.push({ field: name, old: node[key], new: next })
      node[key] = next
    }
  }
  visit(json, rule.steps, '')
  return changes
}

// Decodes, parses and changes one response body. Returns { body, changes }, or { reason } when nothing changes.
export function tamperBody (raw, encoding, rule) {
  let body = raw
  const codings = (encoding ?? '').split(',').map(s => s.trim().toLowerCase()).filter(s => s && s !== 'identity')
  for (const coding of codings.reverse()) {
    if (!Object.hasOwn(DECODE, coding) || !DECODE[coding]) return { reason: `unknown content-encoding ${coding}` }
    try { body = DECODE[coding](body) } catch (e) { return { reason: `cannot decode ${coding}: ${e.message}` } }
  }
  let json
  try { json = JSON.parse(body.toString('utf8')) } catch { return { reason: 'the body is not JSON' } }
  const changes = applyRule(json, rule)
  if (changes.length === 0) return { reason: `no value to change at ${rule.field}` }
  return { body: Buffer.from(JSON.stringify(json)), changes }
}

const FETCH_METADATA = ['sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest']
export const isBrowser = (headers, upgrade = false) => upgrade ? 'origin' in headers : FETCH_METADATA.every(h => h in headers)

// Copies a raw header list [name, value, ...] without the hop-by-hop headers and without the names in drop.
function endToEnd (raw, drop = []) {
  const skip = new Set([...HOP, ...drop])
  for (let i = 0; i < raw.length; i += 2) {
    if (raw[i].toLowerCase() === 'connection') raw[i + 1].split(',').forEach(t => skip.add(t.trim().toLowerCase()))
  }
  const out = []
  for (let i = 0; i < raw.length; i += 2) if (!skip.has(raw[i].toLowerCase())) out.push(raw[i], raw[i + 1])
  return out
}

// Starts the proxy. emit gets each log event. Resolves with the server after "listening".
// server.shutdown() closes all connections, the websocket pipes too.
export function startProxy ({ port, target, rule = null, scope = 'browser', emit }) {
  const up = new URL(target)
  if (up.protocol !== 'http:') throw new Error(`the target must be an http:// URL, not ${target}`)
  if (!['browser', 'all'].includes(scope)) throw new Error(`the scope must be browser or all, not ${scope}`)
  const upstream = { host: up.hostname, port: Number(up.port || 80), agent: new http.Agent({ keepAlive: false }) }
  const sockets = new Set()
  const track = s => { sockets.add(s); s.once('close', () => sockets.delete(s)) }
  const now = () => new Date().toISOString()

  const server = http.createServer((req, res) => {
    const browser = isBrowser(req.headers)
    const at = { method: req.method, path: req.url }
    emit({ time: now(), type: 'request', ...at, browser })
    const active = rule && (scope === 'all' || browser) && (!rule.method || rule.method === req.method) && rule.re.test(req.url)
    const headers = endToEnd(req.rawHeaders, active ? ['if-none-match', 'if-modified-since'] : [])
    let settled = false // true after the first error or abort: one log line for each request
    const fail = err => {
      if (settled) return
      settled = true
      emit({ time: now(), type: 'error', ...at, error: err.message })
      if (res.headersSent) return res.destroy()
      res.writeHead(502, { 'content-type': 'text/plain' })
      res.end(`tamper-proxy: upstream error: ${err.message}\n`)
    }
    const upReq = http.request({ ...upstream, method: req.method, path: req.url, headers }, upRes => {
      upRes.on('error', fail)
      upRes.on('close', () => { if (!upRes.complete) fail(new Error('the app closed the response before its end')) })
      if (!active) {
        res.writeHead(upRes.statusCode, upRes.statusMessage, endToEnd(upRes.rawHeaders))
        upRes.pipe(res)
        return
      }
      const chunks = []
      upRes.on('data', c => chunks.push(c))
      upRes.on('end', () => {
        const raw = Buffer.concat(chunks)
        const out = tamperBody(raw, upRes.headers['content-encoding'], rule)
        const base = { time: now(), rule: rule.id, ...at, status: upRes.statusCode }
        if (!out.body) {
          emit({ ...base, type: 'skip', reason: out.reason })
          res.writeHead(upRes.statusCode, upRes.statusMessage, endToEnd(upRes.rawHeaders))
          res.end(raw)
          return
        }
        emit({ ...base, type: 'change', changes: out.changes })
        const outHeaders = endToEnd(upRes.rawHeaders, ['content-encoding', 'content-length'])
        res.writeHead(upRes.statusCode, upRes.statusMessage, [...outHeaders, 'Content-Length', String(out.body.length)])
        res.end(out.body)
      })
    })
    upReq.on('error', fail)
    // The client went away first (for example, the page closed). Stop the upstream request; this is not an error.
    res.on('close', () => {
      if (res.writableFinished || settled) return
      settled = true
      emit({ time: now(), type: 'abort', ...at })
      upReq.destroy()
    })
    req.pipe(upReq)
  })

  server.on('connection', track)
  server.on('upgrade', (req, socket, head) => {
    emit({ time: now(), type: 'request', method: req.method, path: req.url, browser: isBrowser(req.headers, true), upgrade: true })
    const upSocket = net.connect(upstream.port, upstream.host)
    track(upSocket)
    let connected = false
    const close = () => { socket.destroy(); upSocket.destroy() }
    socket.on('error', close)
    socket.on('close', close)
    upSocket.on('close', close)
    // Before the connection to the app: the app is down (error). After it: the websocket closed with a socket error
    // that the browser also gets without the proxy (abort).
    upSocket.on('error', err => {
      emit({ time: now(), type: connected ? 'abort' : 'error', method: req.method, path: req.url, error: err.message })
      close()
    })
    upSocket.on('connect', () => {
      connected = true
      const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`]
      for (let i = 0; i < req.rawHeaders.length; i += 2) lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`)
      upSocket.write(`${lines.join('\r\n')}\r\n\r\n`)
      if (head.length) upSocket.write(head)
      upSocket.pipe(socket)
      socket.pipe(upSocket)
    })
  })
  server.shutdown = () => new Promise(resolve => {
    server.close(() => resolve())
    for (const s of sockets) s.destroy()
    upstream.agent.destroy()
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => {
      server.off('error', reject)
      emit({ time: now(), type: 'listening', port: server.address().port, target, rule: rule?.id ?? null, scope })
      resolve(server)
    })
  })
}

async function main () {
  if (process.argv.includes('--help')) return console.log(usage(import.meta.url))
  const port = Number(opt('--port', 3100))
  const target = opt('--target', 'http://localhost:3000')
  const rulesFile = opt('--rules')
  const ruleId = opt('--rule')
  const scope = opt('--scope', 'browser')
  const logFile = opt('--log')
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`--port must be a port number, not ${opt('--port')}`)
  if (ruleId && !rulesFile) throw new Error('--rule needs --rules <file>')
  const rules = rulesFile ? loadRules(rulesFile) : []
  const rule = ruleId ? rules.find(r => r.id === ruleId) : null
  if (ruleId && !rule) throw new Error(`no rule "${ruleId}" in ${rulesFile}. Rules: ${rules.map(r => r.id).join(', ')}`)
  const fd = logFile ? fs.openSync(logFile, 'a') : null
  const emit = fd === null ? e => process.stdout.write(`${JSON.stringify(e)}\n`) : e => fs.writeSync(fd, `${JSON.stringify(e)}\n`)
  const server = await startProxy({ port, target, rule, scope, emit })
  log(`tamper-proxy on :${server.address().port} to ${target}, rule ${rule?.id ?? 'none'}, scope ${scope}${logFile ? `, log ${logFile}` : ''}`)
  const stop = async signal => {
    await server.shutdown()
    log(`tamper-proxy stopped (${signal})`)
    process.exit(0)
  }
  process.once('SIGTERM', () => stop('SIGTERM'))
  process.once('SIGINT', () => stop('SIGINT'))
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main().catch(e => {
    console.error(`error: ${e.message}`)
    process.exit(1)
  })
}
