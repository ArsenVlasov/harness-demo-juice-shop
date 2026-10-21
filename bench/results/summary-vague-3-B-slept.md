# Summary: suite B, condition vague, run 4

Source: `bench/collect-metrics.mjs`, 2026-10-21T04:59:11.114Z. Inputs: `mutants-vague-3`, `flaky-vague-3`, `judge-vague-3`.

| Metric | B (harness) | Source |
|---|---|---|
| Judge: steps covered / partial / missing | 49 / 0 / 0 of 49 | `judge-vague-3/` |
| Judge model | claude-opus-5-5 | `judge-vague-3/` |
| Generation cost, USD | 6.76 | `gen-vague-*-4.json` |
| Cost for each test case, USD | 0.84 | `gen-vague-*-4.json` |
| Work time, min | 17.5 | `transcript` |
| Work time for each test case, min | 2.2 | `transcript` |
| Tool calls of the main agent | 125 | `transcript` |
| Subagents | 8 | `gen-vague-*-4.json` |
| Follow-up messages | 0 | `gen-vague-*-4.json` |
| Tests | 8 | `clean-vague-*-4.json` |
| Files written | 46 | `git diff HEAD~1 HEAD` |
| Lines written | 1961 | `git diff HEAD~1 HEAD` |

Not measured: `rules:lint` for suite A. The linter checks only the folder layout of the harness, so its numbers for A do not compare with B.
