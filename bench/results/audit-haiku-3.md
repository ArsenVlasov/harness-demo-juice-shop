# Tool-call audit (audit-haiku-3)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T09:49:03.387Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| A | `gen-haiku-A-3.json` | `a2978af1-b469-4cb2-91e4-3831db918677` | 1 | 129 | 0 | 0 | 11 | 11 |
| B | `gen-haiku-B-3.json` | `0b1d8508-90e2-4bf6-b29a-51e2b1d73f64` | 9 | 420 | 0 | 0 | 3 | 0 |

- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:121`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:129`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:141`, Write: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:248`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:253`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:261`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:266`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:274`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:282`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:288`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:295`, mcp__playwright__browser_run_code_unsafe: /Users/
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:155`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/shop.ts","content":"import { expect, type Page } from '@...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:157`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/checkout.ts","content":"import { expect, type Page } fro...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:159`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/account.ts","content":"import { expect, type Page } from...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:167`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/tc-01-login.spec.ts","content":"import { expect, test } from '...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:172`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/tc-01-login.spec.ts","old_string":"import ...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:221`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/shop.ts","old_string":"import { esca...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:301`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/shop.ts","content":"import { expect, type Page } from '@...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:303`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/checkout.ts","content":"import { expect, type Page } fro...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:328`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/account.ts","content":"import { expect, type Page } from...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:445`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/checkout.ts","old_string":"import { ...`
- `../`, A, `a2978af1-b469-4cb2-91e4-3831db918677.jsonl:508`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a/tests/pages/account.ts","content":"import { expect, type Page } from...`
- Outside, B, `0b1d8508-90e2-4bf6-b29a-51e2b1d73f64.jsonl:1002`, Bash: /tmp/probe-wallet.spec.ts, /tmp/probe-dir
- Outside, B, `0b1d8508-90e2-4bf6-b29a-51e2b1d73f64.jsonl:1228`, Bash: /tmp/check.log
- Outside, B, `0b1d8508-90e2-4bf6-b29a-51e2b1d73f64.jsonl:1288`, Bash: /tmp/final-check.log
