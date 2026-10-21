# Tool-call audit (audit-vague-3)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T09:49:02.621Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| A | `gen-vague-A-3.json` | `f925384c-049e-4466-a06c-438243fb319f` | 1 | 68 | 0 | 0 | 1 | 4 |

- Outside, A, `f925384c-049e-4466-a06c-438243fb319f.jsonl:44`, Bash: /tmp/jsprobe, /tmp/jsprobe/probe.spec.ts
- `../`, A, `f925384c-049e-4466-a06c-438243fb319f.jsonl:219`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-3/suite-a/tests/pages/LoginPage.ts","content":"import { expect, type Locator, ...`
- `../`, A, `f925384c-049e-4466-a06c-438243fb319f.jsonl:223`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-3/suite-a/tests/pages/BasketPage.ts","content":"import { expect, type Locator,...`
- `../`, A, `f925384c-049e-4466-a06c-438243fb319f.jsonl:230`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-3/suite-a/tests/pages/CheckoutPages.ts","content":"import { expect, type Locat...`
- `../`, A, `f925384c-049e-4466-a06c-438243fb319f.jsonl:232`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-3/suite-a/tests/pages/AccountPages.ts","content":"import { expect, type Locato...`
