# Decision 19: the tamper proxy and the expectation mutants on vague A-2 and B-2

This is an exploratory measurement. Arsen selected vague A-2 after the results of the judge, so it tests no hypothesis of stage 2 (`LOG.md`, entry 21.10, 15:00).
The results do not go into the reports of E4.

## The runs

| Run | Suite | Command result |
|---|---|---|
| `tamper-x3` | vague A-2 (`set-2/run-2/suite-a`, tag `gen-2`, `c9f7d3e2a754`) | `Rules: 22. Caught: 20. Survived: 2.` Survived: T14-b, T15-d |
| `mutate-x3` | vague A-2 | `client: 51 killed, 2 survived, 0 error, 0 skipped of 53`. Survived: S017, S021 (`tests/tc-03-basket-quantity-and-remove.spec.ts`) |
| `tamper-x4` | vague B-2 (`set-2/run-2/suite-b`, tag `gen-2`, `dd4680b32d9e`) | `Rules: 22. Caught: 20. Survived: 2.` Survived: T14-b, T15-d |
| `mutate-x4` | vague B-2 | `client: 23 killed, 1 survived, 0 error, 0 skipped of 24`. Survived: S016 (`basket-quantity.spec.ts`) |

`bench/run-x3-x4.sh` ran the 4 steps from 17:32:56 to 18:28:00 on AC power. Each step gave `EXIT 0`. The frozen rules are `bench/tamper-rules.json`, sha256 `ebca83b3…`.

## The expectation, written before the runs, and the result

- The group of rules for prices, totals, the discount and the bonus: T01-a, T02-a, T04-a, T04-b, T05-a, T06-a, T08-a, T08-b, T09-a, T12-a and T13-a.
- The expectation: more rules of this group survive in A-2 than in B-2. Support for the judge: at least one rule of the group survives in A-2, and none survives in B-2.
- The result: no rule of the group survives in A-2 or in B-2. A-2 and B-2 have the same table.
- Thus, as decision 19 says for this case: on these changed values, the weakness of the helpers did not show.
- The note on the mutants was also wrong. It said that A-2 has fewer mutants, because the helpers have fewer literals. A-2 has 53 sites, and B-2 has 24.

## Why the expectation was wrong

- The expectation said that a test of A-2 reads the changed price on the page and calculates the total with the same formula. The code does not do this.
- The helpers in `helpers/money.ts` (`itemsTotal()`, `orderTotal()`, `discount()`, `bonusPoints()`) calculate each value from fixed constants in `data/test-data.ts`, for example `eggfruitJuice: price 8.99`. No helper reads a value from the page.
- Thus a changed price on the page fails the test. Examples from `tamper-x3/rules/*.playwright.txt`:
  - T02-a, TC-03 step 1: expected `Total Price: 13.98¤`, received `Total Price: 15.98¤`.
  - T02-a, TC-07 step 2: expected `Total Price: 20.97¤`, received `Total Price: 23.97¤`.
  - T09-a, TC-07 step 10: expected `19.86¤`, received `20.86¤`.
  - T12-a, TC-08 step 10: expected bonus `1`, received `2`.
- The bug patches also failed on values from the helpers in A-2 (`mutants-vague-2/*-A.json`), for example M01: Promotion `2.10¤` expected, `2.20¤` received. A-2 caught 11 of 11 bugs.

## The judge steps `partial` of vague A-2, step by step

A workflow with 2 independent agents (run `wf_94c9d4db-d14`) checked the 21 steps `partial` of A-2 (`judge-vague-2/suite-2.json`).
One agent found the failure line of each tamper rule in `tamper-x3/rules/*.playwright.txt`. The other agent tried to refute the reading.

| Class | Steps | Count |
|---|---|---|
| A tamper rule on the step made the test fail at this step | TC-03 step 1, TC-04 step 2, TC-05 step 5, TC-06 step 5, TC-07 steps 2, 6, 7, 8, 10, TC-08 steps 2, 7, 8, 10 | 13 |
| The test failed at an earlier step, so the check of this step did not run | TC-03 steps 2, 3, 4, TC-04 step 4, TC-08 steps 6, 9 | 6 |
| The rule on the step survived in each suite (T15-d), so it gives no data on this step | TC-06 step 4 | 1 |
| No tamper rule targets this step | TC-01 step 1 | 1 |

- 17 of the 21 steps are `partial` because the expected total comes from a helper, not from a literal number.
- Of these 17 steps, 11 failed at the step itself under a tamper rule. In 9 of these 11, the check that failed is a value from a helper. The other 6 steps did not run.
- The judge gave TC-07 step 7 and TC-08 step 8 `partial` with the note "checked only for visibility". The locator matches the heading by its name `Thank you for your purchase!`, so it also checks the text. T15-e changed the text, and both tests failed.
- The limit: the order summary of TC-05, TC-06 and TC-07 has the lines Promotion and Total Price. No tamper rule was the first to fail on these lines. For these lines, the evidence is the code: they compare with values from the constants.
- The refuter found no way in which the helpers of A-2 are weaker in behavior. Its verdict: "reading-holds".
  The one real cost is review: a person must calculate each total. Also, a helper that copies a wrong rule of the app would agree with the app. The bug patches M01 (the discount base) and M14 (the bonus) did not show such a case.

## The judge applies its rule differently to A and B

- The rubric is `bench/judge.md:16`. It gives `partial` when the code checks "a value that it calculates the same way as the app, not the value of the test case".
- B-2 also calculates the totals from constants: `PriceHelper.orderTotals()`, `basketTotal()` and `bonusPoints()` in `utils/helpers/price-helper.ts`. For example, `valid-coupon.spec.ts` calls `shouldSeeTotals(PriceHelper.orderTotals(basket, delivery, COUPON_DISCOUNT_PERCENT))`.
- The judge gave these steps of B-2 `covered`, with the values in its notes. For TC-05 step 5, its note for B-2 is "Checks Items 17.98¤, Delivery 0.99¤, Promotion 1.80¤ and Total Price 17.17¤ from the test data". For A-2, its note for the same step is "calculated with helpers instead of being compared to 17.98¤, 1.80¤ and 17.17¤".
- Each vague B suite has 8 files that use total helpers (`git grep` at its tag). The judge gave each vague B suite 0 steps `partial`.
- Count of the steps `partial` plus `missing` with a note about helpers or calculated values:

| Suite | `partial` plus `missing` | Of them, the note names a helper or a calculated value | The other steps |
|---|---|---|---|
| vague A-1 | 2 | 0 | 2 |
| vague A-2 | 21 | 17 | 4 |
| vague A-3 | 18 | 17 | 1 |
| vague B-1, B-2, B-4 | 0, 0, 0 | 0 | 0 |

- Without the steps with a helper note, the counts are A 2 / 4 / 1 and B 0 / 0 / 0. Two of the 4 other steps of A-2 (TC-07 step 7, TC-08 step 8) did not show a weakness in the tamper run (see above).
- This is a check after the results. It does not change the frozen result of H2.3. It is a limit on the reading of H2.3, and the manual check of the judge (item 1.1) must look at it first.
