# Tool-call audit (audit-fixer-x2)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T12:52:20.201Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| ? | `-` | `81ebe4ac-891f-47d8-b0f6-1ae450a3296c` | 2 | 153 | 0 | 0 | 8 | 4 |

- Outside, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:125`, Bash: /tmp/audit-explore, /tmp/audit-explore/explore.cjs, /Users/
- Outside, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:130`, Write: /tmp/audit-explore/explore.cjs, /Users/
- Outside, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:132`, Bash: /tmp/audit-explore/explore.cjs
- Outside, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:145`, mcp__playwright__browser_run_code_unsafe: /Users/
- Outside, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:349`, Write: /Users/
- Outside, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:352`, Bash: /Users/
- Outside, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:358`, Edit: /Users/
- Outside, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:529`, Bash: /tmp/check.log
- `../`, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:189`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-s/tests/pages/shop.ts","old_string":"import { expect, type Page...`
- `../`, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:211`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-s/tests/pages/shop.ts","old_string":"import { totalPrice } from...`
- `../`, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:217`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-s/tests/pages/checkout.ts","old_string":"import { escapeRegExp,...`
- `../`, ?, `81ebe4ac-891f-47d8-b0f6-1ae450a3296c.jsonl:348`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-s/tests/pages/account.ts","old_string":"from '../helpers/money'...`
