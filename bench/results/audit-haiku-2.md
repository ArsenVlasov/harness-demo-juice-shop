# Tool-call audit (audit-haiku-2)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T09:49:03.158Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| A | `gen-haiku-A-2.json` | `335537f1-98db-424d-96f6-4bc1650587f6` | 1 | 133 | 0 | 0 | 0 | 18 |
| B | `gen-haiku-B-2.json` | `8a527009-8d1c-4555-8f39-5f7e09911eb8` | 2 | 266 | 0 | 0 | 2 | 2 |

- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:275`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-01-login.spec.ts","content":"// TC-01: Login with a valid a...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:277`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-02-add-to-basket.spec.ts","content":"// TC-02: Add a produc...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:279`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-03-basket-quantity-and-remove.spec.ts","content":"// TC-03:...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:281`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-04-purchase-limit.spec.ts","content":"// TC-04: Purchase li...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:288`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-05-valid-coupon.spec.ts","content":"// TC-05: Valid coupon ...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:290`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-06-invalid-and-expired-coupon.spec.ts","content":"// TC-06:...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:292`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-07-card-order-end-to-end.spec.ts","content":"// TC-07: Orde...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:294`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-08-wallet-payment.spec.ts","content":"// TC-08: Payment wit...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:318`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-08-wallet-payment.spec.ts","old_string"...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:344`, Bash: `{"command":"sed -i '' \"s#from '\\.\\./#from './#\" tests/TC-01-login.spec.ts tests/TC-02-add-to-basket.spec.ts tests/TC-03-basket-quantity-and-remove.spec.ts t...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:349`, Edit: `{"replace_all":true,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-01-login.spec.ts","old_string":"from '.....`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:351`, Edit: `{"replace_all":true,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-02-add-to-basket.spec.ts","old_string":"...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:353`, Edit: `{"replace_all":true,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-03-basket-quantity-and-remove.spec.ts","...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:355`, Edit: `{"replace_all":true,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-04-purchase-limit.spec.ts","old_string":...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:357`, Edit: `{"replace_all":true,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-05-valid-coupon.spec.ts","old_string":"f...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:359`, Edit: `{"replace_all":true,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-06-invalid-and-expired-coupon.spec.ts","...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:361`, Edit: `{"replace_all":true,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-07-card-order-end-to-end.spec.ts","old_s...`
- `../`, A, `335537f1-98db-424d-96f6-4bc1650587f6.jsonl:363`, Edit: `{"replace_all":true,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-a/tests/TC-08-wallet-payment.spec.ts","old_string":...`
- Outside, B, `8a527009-8d1c-4555-8f39-5f7e09911eb8.jsonl:721`, Bash: /tmp/check-out.txt
- Outside, B, `8a527009-8d1c-4555-8f39-5f7e09911eb8.jsonl:929`, Bash: /tmp/c.txt
- `../`, B, `8a527009-8d1c-4555-8f39-5f7e09911eb8.jsonl:677`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-b/page-objects/order-history-page.ts","content":"import type { Locator...`
- `../`, B, `8a527009-8d1c-4555-8f39-5f7e09911eb8.jsonl:703`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-2/suite-b/page-objects/order-history-page.ts","old_string"...`
