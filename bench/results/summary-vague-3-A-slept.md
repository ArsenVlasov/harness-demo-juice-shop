# Summary: suite A, condition vague, run 3

Source: `bench/collect-metrics.mjs`, 2026-10-21T04:59:10.873Z. Inputs: `mutants-vague-3`, `flaky-vague-3`, `judge-vague-3`.

| Metric | A (no harness) | Source |
|---|---|---|
| Judge: steps covered / partial / missing | 31 / 18 / 0 of 49 | `judge-vague-3/` |
| Judge model | claude-opus-5-5 | `judge-vague-3/` |
| Generation cost, USD | 2.46 | `gen-vague-*-3.json` |
| Cost for each test case, USD | 0.31 | `gen-vague-*-3.json` |
| Work time, min | 11.4 | `transcript` |
| Work time for each test case, min | 1.4 | `transcript` |
| Tool calls of the main agent | 68 | `transcript` |
| Subagents | 0 | `gen-vague-*-3.json` |
| Follow-up messages | 0 | `gen-vague-*-3.json` |
| Tests | 8 | `clean-vague-*-3.json` |
| Files written | 20 | `git diff HEAD~1 HEAD` |
| Lines written | 1238 | `git diff HEAD~1 HEAD` |

Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.
