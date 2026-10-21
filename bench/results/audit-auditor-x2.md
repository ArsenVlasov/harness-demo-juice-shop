# Tool-call audit (audit-auditor-x2)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T12:15:57.253Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| ? | `-` | `426601b0-2e26-4ef5-b75c-cffe6be2c6e6` | 1 | 21 | 0 | 0 | 5 | 1 |

- Outside, ?, `426601b0-2e26-4ef5-b75c-cffe6be2c6e6.jsonl:56`, Bash: /tmp/pw-audit-out
- Outside, ?, `426601b0-2e26-4ef5-b75c-cffe6be2c6e6.jsonl:63`, Bash: /tmp/js-audit
- Outside, ?, `426601b0-2e26-4ef5-b75c-cffe6be2c6e6.jsonl:78`, Bash: /tmp/audit-exp-tests
- Outside, ?, `426601b0-2e26-4ef5-b75c-cffe6be2c6e6.jsonl:84`, Write: /tmp/audit-exp/pw.config.ts, /tmp/audit-exp
- Outside, ?, `426601b0-2e26-4ef5-b75c-cffe6be2c6e6.jsonl:86`, Write: /tmp/audit-exp/exp.spec.ts
- `../`, ?, `426601b0-2e26-4ef5-b75c-cffe6be2c6e6.jsonl:98`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-r/audit-experiments/exp.spec.ts","content":"// Audit experiments. Each test does a ...`
