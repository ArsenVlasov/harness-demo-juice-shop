# Tool-call audit (audit-fixer-x1)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T12:52:20.032Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| ? | `-` | `9ce9f102-9946-41db-88c2-17976983fb4b` | 2 | 81 | 0 | 0 | 3 | 3 |

- Outside, ?, `9ce9f102-9946-41db-88c2-17976983fb4b.jsonl:92`, Bash: /tmp/probe, /tmp/probe/probe.spec.ts
- Outside, ?, `9ce9f102-9946-41db-88c2-17976983fb4b.jsonl:239`, Bash: /tmp/mutation-backup, /tmp/mutation-backup/
- Outside, ?, `9ce9f102-9946-41db-88c2-17976983fb4b.jsonl:328`, Bash: /tmp/check.log
- `../`, ?, `9ce9f102-9946-41db-88c2-17976983fb4b.jsonl:92`, Bash: `{"command":"mkdir -p /tmp/probe && cd /Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-q && cat > /tmp/probe/probe.spec.ts <<'EOF'\nimport { test ...`
- `../`, ?, `9ce9f102-9946-41db-88c2-17976983fb4b.jsonl:137`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-q/tests/pages/basket-page.ts","old_string":"import { Locator, P...`
- `../`, ?, `9ce9f102-9946-41db-88c2-17976983fb4b.jsonl:151`, Edit: `{"replace_all":false,"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-q/tests/pages/basket-page.ts","old_string":"import { nextBasket...`
