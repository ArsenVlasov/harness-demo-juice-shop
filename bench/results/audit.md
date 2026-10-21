# Tool-call audit (audit)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T09:49:01.826Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| A | `gen-A-1.json` | `053d47d4-ecc4-45f4-b32f-c7f7a78e83e6` | 1 | 96 | 0 | 0 | 0 | 3 |
| B | `gen-B-1.json` | `fba4515d-3f52-47a5-99d2-856588a726b1` | 5 | 246 | 0 | 0 | 2 | 0 |

- `../`, A, `053d47d4-ecc4-45f4-b32f-c7f7a78e83e6.jsonl:272`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/suite-a/tests/support/fixtures.ts","old_string":"import { Customer, ...`
- `../`, A, `053d47d4-ecc4-45f4-b32f-c7f7a78e83e6.jsonl:355`, mcp__playwright__browser_run_code_unsafe: `{"code":"async (page) => {\n  const B='http://localhost:3000';\n  const clean = s => s.replace(/<svg.*?<\\/svg>/gs,'').replace(/<!--.*?-->/g,'').replace(/ _ngco...`
- `../`, A, `053d47d4-ecc4-45f4-b32f-c7f7a78e83e6.jsonl:360`, mcp__playwright__browser_run_code_unsafe: `{"code":"async (page) => {\n  const clean = s => s.replace(/<svg.*?<\\/svg>/gs,'').replace(/<!--.*?-->/g,'').replace(/ _ngcontent[^ >]*/g,'').replace(/ _nghost[...`
- Outside, B, `fba4515d-3f52-47a5-99d2-856588a726b1.jsonl:514`, Bash: /tmp/spec-backup, /tmp/spec-backup/, /tmp/spec-backup/specs
- Outside, B, `fba4515d-3f52-47a5-99d2-856588a726b1.jsonl:690`, Bash: /tmp/check.log
