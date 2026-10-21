# Aggregate: condition vague, runs 1, 2, 3

Source: `bench/aggregate-runs.mjs`, 2026-10-21T10:30:27.574Z. Inputs: `summary-vague-1.csv`, `summary-vague-2.csv`, `summary-vague-3.csv`.

A value "X of N" counts as X. An empty value and n/a do not count, so n can be less than the number of runs.

| Metric | Suite | Mean | Min | Max | n | Values (runs 1, 2, 3) |
|---|---|---|---|---|---|---|
| Realistic bugs missed | A | 0 | 0 | 0 | 3 | 0 of 11 / 0 of 11 / 0 of 11 |
| Realistic bugs missed | B | 0 | 0 | 0 | 3 | 0 of 11 / 0 of 11 / 0 of 11 |
| Mutation score | A | 14 | 14 | 14 | 3 | 14 of 14 (1) / 14 of 14 (1) / 14 of 14 (1) |
| Mutation score | B | 14 | 14 | 14 | 3 | 14 of 14 (1) / 14 of 14 (1) / 14 of 14 (1) |
| Flaky tests (20 runs) | A | 0.67 | 0 | 2 | 3 | 0 / 0 / 2 |
| Flaky tests (20 runs) | B | 0 | 0 | 0 | 3 | 0 / 0 / 0 |
| Broken tests (20 runs) | A | 0 | 0 | 0 | 3 | 0 / 0 / 0 |
| Broken tests (20 runs) | B | 0 | 0 | 0 | 3 | 0 / 0 / 0 |
| Judge: steps covered | A | 35.33 | 28 | 47 | 3 | 47 / 28 / 31 |
| Judge: steps covered | B | 49 | 49 | 49 | 3 | 49 / 49 / 49 |
| Judge: steps partial | A | 13.67 | 2 | 21 | 3 | 2 / 21 / 18 |
| Judge: steps partial | B | 0 | 0 | 0 | 3 | 0 / 0 / 0 |
| Judge: steps missing | A | 0 | 0 | 0 | 3 | 0 of 49 / 0 of 49 / 0 of 49 |
| Judge: steps missing | B | 0 | 0 | 0 | 3 | 0 of 49 / 0 of 49 / 0 of 49 |
| Generation cost, USD | A | 2.57 | 2.46 | 2.66 | 3 | 2.58 / 2.66 / 2.46 |
| Generation cost, USD | B | 7.88 | 6.76 | 8.45 | 3 | 8.45 / 8.42 / 6.76 |
| Cost for each test case, USD | A | 0.32 | 0.31 | 0.33 | 3 | 0.32 / 0.33 / 0.31 |
| Cost for each test case, USD | B | 0.98 | 0.84 | 1.06 | 3 | 1.06 / 1.05 / 0.84 |
| Work time, min | A | 10.9 | 10.3 | 11.4 | 3 | 11 / 10.3 / 11.4 |
| Work time, min | B | 24.6 | 17.5 | 28.2 | 3 | 28.1 / 28.2 / 17.5 |
| Work time for each test case, min | A | 1.37 | 1.3 | 1.4 | 3 | 1.4 / 1.3 / 1.4 |
| Work time for each test case, min | B | 3.07 | 2.2 | 3.5 | 3 | 3.5 / 3.5 / 2.2 |
| Tool calls of the main agent | A | 71.67 | 68 | 74 | 3 | 74 / 73 / 68 |
| Tool calls of the main agent | B | 168 | 125 | 193 | 3 | 186 / 193 / 125 |
| Subagents | A | 0 | 0 | 0 | 3 | 0 / 0 / 0 |
| Subagents | B | 5.67 | 4 | 8 | 3 | 5 / 4 / 8 |
| Follow-up messages | A | 0 | 0 | 0 | 3 | 0 / 0 / 0 |
| Follow-up messages | B | 0 | 0 | 0 | 3 | 0 / 0 / 0 |
| Tests | A | 8 | 8 | 8 | 3 | 8 / 8 / 8 |
| Tests | B | 8 | 8 | 8 | 3 | 8 / 8 / 8 |
| Files written | A | 21 | 20 | 22 | 3 | 21 / 22 / 20 |
| Files written | B | 47.33 | 46 | 49 | 3 | 47 / 49 / 46 |
| Lines written | A | 1263 | 1238 | 1277 | 3 | 1274 / 1277 / 1238 |
| Lines written | B | 2094.33 | 1961 | 2169 | 3 | 2169 / 2153 / 1961 |

Text metrics, not in the table: `Bugs missed (IDs)`, `Judge model`.
