#!/usr/bin/env node
// Puts each changed part of the vague set next to the precise text, for the read of Arsen at checkpoint 2
// (section 8 of bench/vague-rule.md, step "After" 4).
//
//   node bench/vague-review.mjs <precise dir> <vague dir> [--out vague-review]
//
// Output: bench/results/<out>.md. One table row for each changed cell of the column "Expected result", each changed
// line of ## Test data and each changed text line of ## Steps. A removed line shows "(removed)". The steps column and
// the other lines must not change: the script lists them under "Other changes" (the checks C1 to C14 stop them).
import fs from 'node:fs'
import path from 'node:path'
import { RESULTS, opt } from './lib.mjs'

const [pDir, vDir] = process.argv.slice(2).filter(a => !a.startsWith('--') && a !== opt('--out'))
const OUT = opt('--out', 'vague-review')
const ROW = /^\| (\d+) \| (.+?) \| (.+) \|$/
const cell = s => s.replace(/\|/g, '\\|')

// The lines of a file by section, without the empty lines. The steps table rows are keyed by the step number.
function parse (file) {
  const out = { rows: {}, lines: [] }
  let section = '(top)'
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    if (l.startsWith('## ')) { section = l; continue }
    const r = l.match(ROW)
    if (section === '## Steps' && r) out.rows[r[1]] = { step: r[2], expected: r[3] }
    else if (l.trim() && !/^\|[-| ]+\|$/.test(l)) out.lines.push({ section, text: l })
  }
  return out
}

function main () {
  if (!pDir || !vDir) throw new Error('usage: node bench/vague-review.mjs <precise dir> <vague dir> [--out name]')
  const files = fs.readdirSync(pDir).filter(f => /^TC-\d\d.*\.md$/.test(f)).sort()
  const rows = []
  const other = []
  let cells = 0
  for (const f of files) {
    const p = parse(path.join(pDir, f))
    const v = parse(path.join(vDir, f))
    for (const [n, r] of Object.entries(p.rows)) {
      cells++
      const w = v.rows[n]
      if (!w) { other.push(`${f} step ${n}: the row is missing`); continue }
      if (w.step !== r.step) other.push(`${f} step ${n}: the step text changed`)
      if (w.expected !== r.expected) rows.push([f.slice(0, 5), `step ${n}`, r.expected, w.expected])
    }
    // Lines of ## Test data and text lines of ## Steps: in order, a precise line that the vague file does not hold
    // in the same place is changed or removed.
    for (const sec of ['## Test data', '## Steps']) {
      const pl = p.lines.filter(l => l.section === sec).map(l => l.text)
      const vl = v.lines.filter(l => l.section === sec).map(l => l.text)
      let j = 0
      for (const line of pl) {
        if (vl[j] === line) { j++; continue }
        const next = pl.indexOf(vl[j], pl.indexOf(line) + 1)
        if (vl[j] !== undefined && next === -1) { rows.push([f.slice(0, 5), sec.slice(3), line, vl[j]]); j++ } else rows.push([f.slice(0, 5), sec.slice(3), line, '(removed)'])
      }
      for (; j < vl.length; j++) other.push(`${f} ${sec}: a new line "${vl[j]}"`)
    }
    const pOther = p.lines.filter(l => !['## Test data', '## Steps'].includes(l.section)).map(l => l.text).join('\n')
    const vOther = v.lines.filter(l => !['## Test data', '## Steps'].includes(l.section)).map(l => l.text).join('\n')
    if (pOther !== vOther) other.push(`${f}: a line outside ## Test data and ## Steps changed`)
  }
  const md = [
    `# Vague set: each change next to the precise text (${OUT})`,
    '',
    `Source: \`bench/vague-review.mjs\`, ${new Date().toISOString()}. Precise: \`${pDir}\`. Vague: \`${vDir}\`.`,
    `${rows.length} changed parts. ${cells} expected-result cells in all.`,
    '',
    '| TC | Where | Precise | Vague |',
    '|---|---|---|---|',
    ...rows.map(r => `| ${r.map(cell).join(' | ')} |`),
    '',
    '## Other changes',
    '',
    ...(other.length ? other.map(o => `- ${o}`) : ['None.']),
    ''
  ].join('\n')
  fs.writeFileSync(path.join(RESULTS, `${OUT}.md`), md)
  console.log(`${rows.length} changed parts, ${other.length} other changes. Output: bench/results/${OUT}.md`)
}

try {
  main()
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(1)
}
