#!/usr/bin/env node
// Adds the test case of each line to a capture file of the passthrough run (binding procedure, step 1, in
// bench/hypotheses-v2.md, section "Binding the rules to JSON fields").
//
//   node bench/tag-capture.mjs --report <passthrough.json> --capture <capture-<label>.jsonl> --out <file>
//
// The window of a test starts at its start time in the Playwright report and ends at the start time of the next
// test (readWindows() of bench/run-audit-tamper.mjs). A line goes to the test whose window holds its time.
// Each output line: {"time", "tc", "test", "method", "path", "status", "contentType", "body"} (+ "bodyBytes" when the
// body is not JSON). "test" is the number of the test in the run order, not its name: the name and the file of a test
// show the layout of its suite. "tc" is the test case (TC-NN) of the test, or null for a line out of all windows.
import fs from 'node:fs'
import { opt, readReport } from './lib.mjs'
import { readEvents, readWindows } from './run-audit-tamper.mjs'

function main () {
  const report = opt('--report')
  const capture = opt('--capture')
  const out = opt('--out')
  if (!report || !capture || !out) throw new Error('usage: --report <passthrough.json> --capture <capture.jsonl> --out <file>')
  if (fs.existsSync(out)) throw new Error(`${out} exists`)
  const tcOf = Object.fromEntries(Object.entries(readReport(report).tests).map(([k, t]) => [k, t.tc ?? null]))
  const windows = readWindows(report)
  const order = [...new Set(windows.map(w => w.key))]
  const lines = readEvents(capture).map(e => {
    const w = windows.find(x => e.ms >= x.start && e.ms < x.end)
    const line = { time: e.time, tc: w ? tcOf[w.key] : null, test: w ? order.indexOf(w.key) + 1 : null, method: e.method, path: e.path, status: e.status, contentType: e.contentType, body: e.body }
    if (e.body == null && e.bodyBytes !== undefined) line.bodyBytes = e.bodyBytes
    return line
  })
  fs.writeFileSync(out, lines.map(l => JSON.stringify(l)).join('\n') + '\n')
  const byTc = {}
  for (const l of lines) byTc[l.tc ?? 'outside'] = (byTc[l.tc ?? 'outside'] ?? 0) + 1
  console.log(`${lines.length} lines, ${order.length} tests. Lines by test case: ${JSON.stringify(byTc)}. Output: ${out}`)
}

try {
  main()
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(1)
}
