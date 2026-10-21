# Summary: suite A and suite B, condition vague, run 2

Source: `bench/collect-metrics.mjs`, 2026-10-20T22:56:05.456Z. Inputs: `mutants-vague-2`, `flaky-vague-2`, `judge-vague-2`.

| Metric | A (no harness) | B (harness) | Source |
|---|---|---|---|
| Realistic bugs missed | 4 of 11 | 10 of 11 | `mutants-vague-2.json` |
| Bugs missed (IDs) | M01 M03 M09 M13 | M01 M03 M06 M07 M08 M09 M13 M14 M15 M16 | `mutants-vague-2.json` |
| Mutation score | 8 of 14 (0.571) | 1 of 14 (0.071) | `mutants-vague-2.json` |
| Generation cost, USD | 2.66 | 8.42 | `gen-vague-*-2.json` |
| Cost for each test case, USD | 0.33 | 1.05 | `gen-vague-*-2.json` |
| Work time, min | 10.3 | 28.2 | `transcript` |
| Work time for each test case, min | 1.3 | 3.5 | `transcript` |
| Tool calls of the main agent | 73 | 193 | `transcript` |
| Subagents | 0 | 4 | `gen-vague-*-2.json` |
| Follow-up messages | 0 | 0 | `gen-vague-*-2.json` |
| Tests | 8 | 8 | `clean-vague-*-2.json` |
| Files written | 22 | 49 | `git diff gen-2~1 gen-2` |
| Lines written | 1277 | 2153 | `git diff gen-2~1 gen-2` |

Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.
