# Patches and suites (mutants-vague-2)

Source: `bench/run-mutants.mjs`, 2026-10-20T21:14:46.204Z. Recheck runs on the clean build: 3.

| ID | Kind | Expected catch | A | B |
|---|---|---|---|---|
| M01 | bug | TC-07 step 8 | missed | missed |
| M03 | bug | TC-07 step 8 | missed | missed |
| M05 | operator | TC-08 step 8 | caught | missed |
| M06 | bug | TC-08 step 9 | caught | missed |
| M07 | bug | TC-06 step 4 | caught | missed |
| M08 | bug | TC-05 step 4 | caught | missed |
| M09 | bug | TC-07 step 8 | missed | missed |
| M10 | operator | TC-04 step 2 | missed | missed |
| M11 | operator | TC-04 step 3 | missed | missed |
| M12 | bug | TC-01 step 2 | caught | caught |
| M13 | bug | TC-07 step 9 | missed | missed |
| M14 | bug | TC-08 step 9 | caught | missed |
| M15 | bug | TC-02 step 2 | caught | missed |
| M16 | bug | TC-03 step 2 | caught | missed |

| Suite | Bugs caught | Bugs missed | Mutation score |
|---|---|---|---|
| A | 7 of 11 | M01, M03, M09, M13 | 8 of 14 (0.571) |
| B | 1 of 11 | M01, M03, M06, M07, M08, M09, M13, M14, M15, M16 | 1 of 14 (0.071) |
