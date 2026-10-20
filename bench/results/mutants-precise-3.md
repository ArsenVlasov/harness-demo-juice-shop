# Patches and suites (mutants-precise-3)

Source: `bench/run-mutants.mjs`, 2026-10-20T13:17:48.623Z. Recheck runs on the clean build: 3.

| ID | Kind | Expected catch | A | B |
|---|---|---|---|---|
| M01 | bug | TC-07 step 8 | caught | missed |
| M03 | bug | TC-07 step 8 | caught | missed |
| M05 | operator | TC-08 step 8 | caught | caught |
| M06 | bug | TC-08 step 9 | caught | caught |
| M07 | bug | TC-06 step 4 | caught | caught |
| M08 | bug | TC-05 step 4 | caught | caught |
| M09 | bug | TC-07 step 8 | caught | missed |
| M10 | operator | TC-04 step 2 | caught | caught |
| M11 | operator | TC-04 step 3 | caught | caught |
| M12 | bug | TC-01 step 2 | caught | caught |
| M13 | bug | TC-07 step 9 | caught | missed |
| M14 | bug | TC-08 step 9 | caught | caught |
| M15 | bug | TC-02 step 2 | caught | caught |
| M16 | bug | TC-03 step 2 | caught | caught |

| Suite | Bugs caught | Bugs missed | Mutation score |
|---|---|---|---|
| A | 11 of 11 | none | 14 of 14 (1) |
| B | 7 of 11 | M01, M03, M09, M13 | 10 of 14 (0.714) |
