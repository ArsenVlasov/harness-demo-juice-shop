# Summary: suite A and suite B, condition vague, run 1

Source: `bench/collect-metrics.mjs`, 2026-10-20T20:55:48.654Z. Inputs: `mutants-vague-1`, `flaky-vague-1`, `judge-vague-1`.

| Metric | A (no harness) | B (harness) | Source |
|---|---|---|---|
| Realistic bugs missed | 0 of 11 | 0 of 11 | `mutants-vague-1.json` |
| Bugs missed (IDs) | none | none | `mutants-vague-1.json` |
| Mutation score | 14 of 14 (1) | 14 of 14 (1) | `mutants-vague-1.json` |
| Flaky tests (20 runs) | 0 | 0 | `flaky-vague-1.json` |
| Broken tests (20 runs) | 0 | 0 | `flaky-vague-1.json` |
| Judge: steps covered / partial / missing | 47 / 2 / 0 of 49 | 49 / 0 / 0 of 49 | `judge-vague-1/` |
| Judge model | claude-opus-5-5 | claude-opus-5-5 | `judge-vague-1/` |
| Generation cost, USD | 2.58 | 8.45 | `gen-vague-*-1.json` |
| Cost for each test case, USD | 0.32 | 1.06 | `gen-vague-*-1.json` |
| Work time, min | 11 | 28.1 | `transcript` |
| Work time for each test case, min | 1.4 | 3.5 | `transcript` |
| Tool calls of the main agent | 74 | 186 | `transcript` |
| Subagents | 0 | 5 | `gen-vague-*-1.json` |
| Follow-up messages | 0 | 0 | `gen-vague-*-1.json` |
| Tests | 8 | 8 | `clean-vague-*-1.json` |
| Files written | 21 | 47 | `git diff gen-1~1 gen-1` |
| Lines written | 1274 | 2169 | `git diff gen-1~1 gen-1` |

Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.
