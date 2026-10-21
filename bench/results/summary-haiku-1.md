# Summary: suite A and suite B, condition haiku, run 1

Source: `bench/collect-metrics.mjs`, 2026-10-21T08:53:33.709Z. Inputs: `mutants-haiku-1`, `flaky-haiku-1`, `judge-haiku-1`.

| Metric | A (no harness) | B (harness) | Source |
|---|---|---|---|
| Realistic bugs missed | 0 of 11 | 0 of 11 | `mutants-haiku-1.json` |
| Bugs missed (IDs) | none | none | `mutants-haiku-1.json` |
| Mutation score | 14 of 14 (1) | 14 of 14 (1) | `mutants-haiku-1.json` |
| Flaky tests (20 runs) | 0 | 0 | `flaky-haiku-1.json` |
| Broken tests (20 runs) | 0 | 0 | `flaky-haiku-1.json` |
| Judge: steps covered / partial / missing | 33 / 9 / 7 of 49 | 44 / 5 / 0 of 49 | `judge-haiku-1/` |
| Judge model | claude-opus-5-5 | claude-opus-5-5 | `judge-haiku-1/` |
| Generation cost, USD | 0.82 | 1.57 | `gen-haiku-*-1.json` |
| Cost for each test case, USD | 0.1 | 0.2 | `gen-haiku-*-1.json` |
| Work time, min | 41.7 | 26.5 | `transcript` |
| Work time for each test case, min | 5.2 | 3.3 | `transcript` |
| Tool calls of the main agent | 152 | 201 | `transcript` |
| Subagents | 0 | 1 | `gen-haiku-*-1.json` |
| Follow-up messages | 0 | 0 | `gen-haiku-*-1.json` |
| Tests | 8 | 8 | `clean-haiku-*-1.json` |
| Files written | 21 | 42 | `git diff gen-1~1 gen-1` |
| Lines written | 1120 | 1717 | `git diff gen-1~1 gen-1` |

Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.
