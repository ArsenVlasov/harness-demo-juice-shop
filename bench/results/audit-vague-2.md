# Tool-call audit (audit-vague-2)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T09:49:02.480Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| A | `gen-vague-A-2.json` | `5f11fcee-66b3-4ec1-aa06-457994256a62` | 1 | 73 | 0 | 0 | 0 | 9 |
| B | `gen-vague-B-2.json` | `2206e2bb-314e-4aaa-8305-08c28d30baf0` | 5 | 321 | 0 | 0 | 1 | 0 |

- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:208`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/helpers/api.ts","content":"import { expect, type APIRequestContext }...`
- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:235`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/tests/fixtures.ts","content":"import { test as base, expect } from '...`
- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:244`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/tests/tc-02-add-to-basket.spec.ts","content":"import { test, expect ...`
- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:246`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/tests/tc-03-basket-quantity-and-remove.spec.ts","content":"import { ...`
- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:248`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/tests/tc-04-purchase-limit.spec.ts","content":"import { test, expect...`
- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:255`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/tests/tc-05-valid-coupon.spec.ts","content":"import { test, expect }...`
- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:257`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/tests/tc-06-invalid-and-expired-coupon.spec.ts","content":"import { ...`
- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:262`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/tests/tc-07-card-order-end-to-end.spec.ts","content":"import { test,...`
- `../`, A, `5f11fcee-66b3-4ec1-aa06-457994256a62.jsonl:269`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a/tests/tc-08-wallet-payment.spec.ts","content":"import { test, expect...`
- Outside, B, `2206e2bb-314e-4aaa-8305-08c28d30baf0.jsonl:863`, Bash: /tmp/check.log
