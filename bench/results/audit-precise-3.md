# Tool-call audit (audit-precise-3)

Source: `bench/audit-tool-calls.mjs`, 2026-10-21T09:49:02.112Z. Plan v2, item 1.5.

| Suite | Result file | Session | Transcripts | Tool calls | Forbidden | Cross-session | Outside | `../` |
|---|---|---|---|---|---|---|---|---|
| A | `gen-precise-A-3.json` | `adada483-23a5-4fb9-99c2-43a81df8fd90` | 1 | 63 | 0 | 0 | 0 | 1 |
| B | `gen-precise-B-3.json` | `f32e8e6a-72cb-427c-8d05-32c943a95c83` | 4 | 232 | 0 | 0 | 1 | 0 |

- `../`, A, `adada483-23a5-4fb9-99c2-43a81df8fd90.jsonl:213`, Write: `{"file_path":"/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-1/run-3/suite-a/tests/support/fixtures.ts","content":"import { test as base, Page } ...`
- Outside, B, `f32e8e6a-72cb-427c-8d05-32c943a95c83.jsonl:599`, Bash: /tmp/check.log
