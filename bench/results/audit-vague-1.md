# Tool-call audit (audit-vague-1)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T09:49:02.259Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| A | `gen-vague-A-1.json` | `3d9d67a5-c5b6-4e7e-a806-025650f2308e` | 1 | 74 | 0 | 0 | 3 | 2 |
| B | `gen-vague-B-1.json` | `b6159812-45ff-489d-876b-a62fe11c1074` | 6 | 311 | 0 | 0 | 2 | 0 |

- Outside, A, `3d9d67a5-c5b6-4e7e-a806-025650f2308e.jsonl:42`, Bash: /tmp/probe.mjs
- Outside, A, `3d9d67a5-c5b6-4e7e-a806-025650f2308e.jsonl:51`, Write: /tmp/jsprobe/probe.mjs
- Outside, A, `3d9d67a5-c5b6-4e7e-a806-025650f2308e.jsonl:53`, Bash: /tmp/jsprobe/probe.mjs
- `../`, A, `3d9d67a5-c5b6-4e7e-a806-025650f2308e.jsonl:205`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-1/suite-a/tests/pages/checkout-pages.ts","content":"import { Locator, Page } f...`
- `../`, A, `3d9d67a5-c5b6-4e7e-a806-025650f2308e.jsonl:214`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-1/suite-a/tests/support/fixtures.ts","content":"import { test as base, expect ...`
- Outside, B, `b6159812-45ff-489d-876b-a62fe11c1074.jsonl:78`, Write: /tmp/jsprobe/probe1.mjs
- Outside, B, `b6159812-45ff-489d-876b-a62fe11c1074.jsonl:847`, Bash: /tmp/check.log
