# Summary: suite A and suite B, condition haiku, run 3

Source: `bench/collect-metrics.mjs`, 2026-10-21T09:45:58.524Z. Inputs: `mutants-haiku-3`, `flaky-haiku-3`, `judge-haiku-3`.

| Metric | A (no harness) | B (harness) | Source |
|---|---|---|---|
| Realistic bugs missed | 4 of 11 | 0 of 11 | `mutants-haiku-3.json` |
| Bugs missed (IDs) | M01 M03 M09 M13 | none | `mutants-haiku-3.json` |
| Mutation score | 10 of 14 (0.714) | 14 of 14 (1) | `mutants-haiku-3.json` |
| Flaky tests (20 runs) | 1 | 0 | `flaky-haiku-3.json` |
| Broken tests (20 runs) | 0 | 0 | `flaky-haiku-3.json` |
| Judge: steps covered / partial / missing | 42 / 7 / 0 of 49 | 48 / 1 / 0 of 49 | `judge-haiku-3/` |
| Judge model | claude-opus-5-5 | claude-opus-5-5 | `judge-haiku-3/` |
| Generation cost, USD | 0.58 | 4.25 | `gen-haiku-*-3.json` |
| Cost for each test case, USD | 0.07 | 0.53 | `gen-haiku-*-3.json` |
| Work time, min | 15.3 | 28.2 | `transcript` |
| Work time for each test case, min | 1.9 | 3.5 | `transcript` |
| Tool calls of the main agent | 129 | 268 | `transcript` |
| Subagents | 0 | 8 | `gen-haiku-*-3.json` |
| Follow-up messages | 0 | 0 | `gen-haiku-*-3.json` |
| Tests | 8 | 8 | `clean-haiku-*-3.json` |
| Files written | 18 | 45 | `git diff gen-3~1 gen-3` |
| Lines written | 1086 | 2056 | `git diff gen-3~1 gen-3` |

Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.
