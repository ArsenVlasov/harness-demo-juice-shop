# Summary: suite after, run 1

Source: `bench/collect-metrics.mjs`, 2026-10-21T14:33:57.962Z. Inputs: `mutants-e4-after-x2`, `flaky-e4-after-x2`, `judge-e4-after-x2`.

| Metric | after | Source |
|---|---|---|
| Realistic bugs missed | 0 of 11 | `mutants-e4-after-x2.json` |
| Bugs missed (IDs) | none | `mutants-e4-after-x2.json` |
| Mutation score | 14 of 14 (1) | `mutants-e4-after-x2.json` |
| Flaky tests (20 runs) | 0 | `flaky-e4-after-x2.json` |
| Broken tests (20 runs) | 0 | `flaky-e4-after-x2.json` |
| Judge: steps covered / partial / missing | 48 / 1 / 0 of 49 | `judge-e4-after-x2/` |
| Judge model | claude-opus-5-5 | `judge-e4-after-x2/` |
| Generation cost, USD | n/a | `gen-*-1.json` |
| Cost for each test case, USD | n/a | `gen-*-1.json` |
| Work time, min | n/a | `transcript` |
| Work time for each test case, min | n/a | `transcript` |
| Tool calls of the main agent | n/a | `transcript` |
| Subagents | n/a | `gen-*-1.json` |
| Follow-up messages | n/a | `gen-*-1.json` |
| Tests | n/a | `clean-*-1.json` |
| Files written | 16 | `git diff fixed~1 fixed` |
| Lines written | 969 | `git diff fixed~1 fixed` |

Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.
