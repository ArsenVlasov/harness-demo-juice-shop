# Summary: suite A and suite B, run 2

Source: `bench/collect-metrics.mjs`, 2026-10-20T13:01:55.911Z. Inputs: `mutants-precise-2`, `flaky-precise-2`, `judge-precise-2`.

| Metric | A (no harness) | B (harness) | Source |
|---|---|---|---|
| Realistic bugs missed | 0 of 11 | 0 of 11 | `mutants-precise-2.json` |
| Bugs missed (IDs) | none | none | `mutants-precise-2.json` |
| Mutation score | 14 of 14 (1) | 14 of 14 (1) | `mutants-precise-2.json` |
| Flaky tests (20 runs) | 0 | 0 | `flaky-precise-2.json` |
| Broken tests (20 runs) | 0 | 0 | `flaky-precise-2.json` |
| Judge: steps covered / partial / missing | 49 / 0 / 0 of 49 | 48 / 1 / 0 of 49 | `judge-precise-2/` |
| Judge model | claude-opus-5-5 | claude-opus-5-5 | `judge-precise-2/` |
| Generation cost, USD | 2.06 | 6.9 | `gen-precise-*-2.json` |
| Cost for each test case, USD | 0.26 | 0.86 | `gen-precise-*-2.json` |
| Work time, min | 10.5 | 18.7 | `transcript` |
| Work time for each test case, min | 1.3 | 2.3 | `transcript` |
| Tool calls of the main agent | 68 | 146 | `transcript` |
| Subagents | 0 | 4 | `gen-precise-*-2.json` |
| Follow-up messages | 0 | 0 | `gen-precise-*-2.json` |
| Tests | 9 | 8 | `clean-precise-*-2.json` |
| Files written | 21 | 42 | `git diff gen-2~1 gen-2` |
| Lines written | 1123 | 1915 | `git diff gen-2~1 gen-2` |

Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.
