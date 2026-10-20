# Tamper audit (capture-c2)

Source: `bench/run-audit-tamper.mjs`, 2026-10-20T14:36:01.884Z.
Suite c2: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-1/run-1/suite-b`, commit 12286c65dfb0, tags gen-1.
Rules: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/tamper-rules.example.json`, sha256 `eaed14f3c06e37ca8ff7048a38e66c3409649c5a3eb5fdeecaa1bdfe91645b5e`. The proxy changes only the responses to browser requests.
Run with no rule: 8 tests passed, 695 browser requests went through the proxy.
Recheck: off (--recheck 0).

| Rule | Changed value | Verdict | Tests where it fired | Of them failed | Matched, not changed |
|---|---|---|---|---|---|
| example-order-status | the status of the order | not exercised | 0 | 0 | 0 |

Rules: 1. Caught: 0. Survived: 0. Not exercised: 1. Invalid: 0.
