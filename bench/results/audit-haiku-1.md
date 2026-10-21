# Tool-call audit (audit-haiku-1)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T09:49:02.974Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| A | `gen-haiku-A-1.json` | `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5` | 1 | 152 | 0 | 0 | 0 | 18 |
| B | `gen-haiku-B-1.json` | `a0b1104a-e859-49e3-9791-0760e39cc827` | 2 | 245 | 0 | 2 | 3 | 1 |

- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:140`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/support/fixtures.ts","content":"import { test as base, expect ...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:148`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/support/fixtures.ts","content":"import { test as base, expect,...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:173`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-01-login.spec.ts","content":"import { test, expect } from '...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:175`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-02-add-to-basket.spec.ts","content":"import { test, expect,...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:177`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-03-basket-quantity-and-remove.spec.ts","content":"import { ...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:179`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-04-purchase-limit.spec.ts","content":"import { test, expect...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:187`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-05-valid-coupon.spec.ts","content":"import { test, expect, ...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:189`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-06-invalid-and-expired-coupon.spec.ts","content":"import { ...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:196`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-07-card-order-end-to-end.spec.ts","content":"import { test,...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:198`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-08-wallet-payment.spec.ts","content":"import { test, expect...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:234`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/support/fixtures.ts","old_string":"import ...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:329`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-06-invalid-and-expired-coupon.spec.ts",...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:333`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/TC-05-valid-coupon.spec.ts","old_string":"...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:443`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/zz-debug.spec.ts","content":"import { test, expect, logIn } fr...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:460`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/zz-debug.spec.ts","content":"import { test, logIn } from './su...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:471`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/zz-debug.spec.ts","content":"import { test, logIn } from './su...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:482`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/zz-debug.spec.ts","content":"import { test, logIn } from './su...`
- `../`, A, `3a4ff5b9-c37f-46a3-a0df-88fcf88339d5.jsonl:513`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-a/tests/zz-debug.spec.ts","content":"import { test, logIn } from './su...`
- Outside, B, `a0b1104a-e859-49e3-9791-0760e39cc827.jsonl:360`, SendMessage: /tmp/cc-socks/24641.sock, /Users/arsenvlasov/Documents/WorkFo…
- Outside, B, `a0b1104a-e859-49e3-9791-0760e39cc827.jsonl:845`, Bash: /tmp/check.log
- Outside, B, `a0b1104a-e859-49e3-9791-0760e39cc827.jsonl:854`, Bash: /tmp/check.log
- Cross-session (in), B, `a0b1104a-e859-49e3-9791-0760e39cc827.jsonl:326`: from "failed tests": Are you working in /Users/arsenvlasov/Documents/WorkFolder/gerchik-autotest-project (the main checkout, now on branch test/GD-6991_Create-s...
- Cross-session (out), B, `a0b1104a-e859-49e3-9791-0760e39cc827.jsonl:360`: to uds:/tmp/cc-socks/24641.sock: No, I work in /Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-b, not in gerchik-autotest-project. I...
- `../`, B, `a0b1104a-e859-49e3-9791-0760e39cc827.jsonl:672`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-1/suite-b/page-objects/order-history-page.ts","old_string"...`
