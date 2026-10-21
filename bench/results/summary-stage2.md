# Stage 2 summary: all experiments

This file collects the results of stage 2 of the harness demo on OWASP Juice Shop v20.3.0.
Each number comes from a file in `bench/results/` or from `LOG.md`. Each section names its source files.
The frozen rules are in `bench/hypotheses-v2.md` at the tag `hypotheses-v2` (20.10, `LOG.md` entry 19:30).
"Decision N" is item N of section 10 of the stage 2 plan (`demo-plan-v2-juice-shop.md` in the vault).
This is a demonstration, not a study.

## How to read this file

- Suites A and B come from the same agent, the same prompt and the same test cases. B works in a project with the harness (tag `harness-v1`). A has no harness.
- A group value shows runs 1, 2 and 3 as "x / y / z". The min and the max are the lowest and the highest of the 3 values. The `aggregate-*.md` files give the mean, the min and the max of each metric.
- **Exploratory** marks a result that no frozen hypothesis tests. Examples: Arsen chose the input after he saw results, or the frozen rules give the result no label.
- **Post hoc** marks a check or a label that came after the results.
- The labels come from the frozen rule "How we read n = 3". Only "strong support" lets the README or the offer claim an effect.

| Label | Frozen rule (for a metric where lower is better) |
|---|---|
| strong support | The means differ in the direction of the hypothesis. The min-max ranges do not overlap. |
| direction only | The means differ in the direction of the hypothesis. The ranges overlap. We write "inconclusive". |
| no difference | The means are equal. |
| opposite direction | The means differ in the other direction. The ranges overlap. We write "inconclusive". |
| strong opposite | The means differ in the other direction. The ranges do not overlap. |
| ceiling | Each run of both groups has the best value. We write "no difference at the ceiling". |

For the mutation score, a higher value is better, so the direction is the opposite.

## 1. Precise test cases, runs 1 to 3

Sources: `bench/results/aggregate-precise.md`, `LOG.md` entry 20.10, 16:50.

**Question.** With precise test cases and a strong writer model (`claude-opus-5-5`), does the harness give better tests?

**Frozen hypotheses.** `bench/hypotheses.md` of stage 1 (commit `f2ad506`, 20.10, 00:10). Arsen did not approve the rule "How we read n = 3" before the measurements of runs 2 and 3.
Thus each n = 3 label in this section is post hoc. `LOG.md` (20.10, 16:50) reads them descriptively: hypotheses 1 to 4 not supported, hypothesis 5 supported.

| Metric | A | B |
|---|---|---|
| Realistic bugs missed, of 11 | 0 / 0 / 0 | 0 / 0 / 4 |
| Mutation score, of 14 | 14 / 14 / 14 | 14 / 14 / 10 |
| Flaky tests in 20 runs | 1 / 0 / 0 | 0 / 0 / 2 |
| Judge steps `partial`, of 49 | 2 / 0 / 3 | 0 / 1 / 0 |
| Judge steps `missing`, of 49 | 0 / 0 / 0 | 0 / 0 / 0 |
| Cost for each test case, USD | 0.34 / 0.26 / 0.26 | 1.01 / 0.86 / 0.81 |
| Work time for each test case, min | 1.5 / 1.3 / 1.4 | 2.9 / 2.3 / 2.8 |

| Hypothesis of stage 1 | Label with n = 3 (post hoc) |
|---|---|
| 1. B misses fewer realistic bugs | opposite direction, inconclusive (mean A 0, B 1.33) |
| 2. B has a higher mutation score | opposite direction, inconclusive (mean A 14, B 12.67) |
| 3. B has fewer flaky tests | opposite direction, inconclusive (mean A 0.33, B 0.67) |
| 4. The judge marks fewer steps `missing` in B | ceiling (0 in each run of A and B) |
| 5. B takes more time and costs more for each test case | strong support for the cost and for the time: the ranges do not overlap |

- The 4 missed bugs of B-3 are M01, M03, M09 and M13. The TC-07 test of B-3 failed on each of these patches.
  It also failed 1 of 3 recheck runs on the clean build, so the frozen rule does not count these catches. The cause is a timing failure after an app start, not a missing check.
- The judge steps `partial` are not a metric of a stage 1 hypothesis. A has 2 / 0 / 3, and B has 0 / 1 / 0.

## 2. E2: vague test cases

Sources: `bench/results/aggregate-vague.md`, `bench/results/decision-19-x3-x4.md`, `LOG.md` entries 21.10, 12:55 and 13:40.

**Question.** What happens when the test cases give no exact values, as in a Jira ticket?

- The set `test-cases-v2-vague` keeps the actions. A mechanical rule (`bench/vague-rule.md`) removed the numbers, the totals and the message texts from the expected results.
- The writer is `claude-opus-5-5` for A and B. The judge grades all suites against the precise test cases (`test-cases-v1`).
- The third pair is A-3 and B-4. Vague B-3 stopped when the Mac shut down. This is an outside cause, so B-3 does not count, and B-4 replaced it.
- The Mac slept during some measurements. By a rule written before the read of the results, these steps ran again (`LOG.md`, 21.10, 12:55).

**Frozen hypotheses.** The primary metric is the missed bugs. The secondary metrics are the mutation score, the judge steps `partial` plus `missing`, and the flaky tests.

- H2.1: vague test cases make suite A weaker (A-vague against A-precise).
- H2.2: vague test cases make suite B weaker (B-vague against B-precise).
- H2.3: on vague test cases, the harness keeps more checks (B-vague against A-vague).

| Metric | A-vague | B-vague |
|---|---|---|
| Realistic bugs missed, of 11 | 0 / 0 / 0 | 0 / 0 / 0 |
| Mutation score, of 14 | 14 / 14 / 14 | 14 / 14 / 14 |
| Judge steps `partial`, of 49 | 2 / 21 / 18 | 0 / 0 / 0 |
| Judge steps `missing`, of 49 | 0 / 0 / 0 | 0 / 0 / 0 |
| Flaky tests in 20 runs | 0 / 0 / 2 | 0 / 0 / 0 |
| Cost for each test case, USD | 0.32 / 0.33 / 0.31 | 1.06 / 1.05 / 0.84 |
| Work time for each test case, min | 1.4 / 1.3 / 1.4 | 3.5 / 3.5 / 2.2 |

| Hypothesis | Metric | Values | Label |
|---|---|---|---|
| H2.1 | missed bugs | A-vague 0 / 0 / 0, A-precise 0 / 0 / 0 | ceiling |
| H2.1 | mutation score | 14 / 14 / 14 against 14 / 14 / 14 | ceiling |
| H2.1 | judge `partial` plus `missing` | 2 / 21 / 18 against 2 / 0 / 3 | direction only, inconclusive |
| H2.1 | flaky tests | 0 / 0 / 2 against 1 / 0 / 0 | direction only, inconclusive |
| H2.2 | missed bugs | B-vague 0 / 0 / 0, B-precise 0 / 0 / 4 | opposite direction, inconclusive |
| H2.2 | mutation score | 14 / 14 / 14 against 14 / 14 / 10 | opposite direction, inconclusive |
| H2.2 | judge `partial` plus `missing` | 0 / 0 / 0 against 0 / 1 / 0 | opposite direction, inconclusive |
| H2.2 | flaky tests | 0 / 0 / 0 against 0 / 0 / 2 | opposite direction, inconclusive |
| H2.3 | missed bugs | B-vague 0 / 0 / 0, A-vague 0 / 0 / 0 | ceiling |
| H2.3 | mutation score | 14 / 14 / 14 against 14 / 14 / 14 | ceiling |
| H2.3 | judge `partial` plus `missing` | B 0 / 0 / 0 against A 2 / 21 / 18 | **strong support** |
| H2.3 | flaky tests | B 0 / 0 / 0 against A 0 / 0 / 2 | direction only, inconclusive |

- All six vague suites miss 0 bugs. By the frozen rule, the judge numbers are then the main signal of E2, and we claim no difference in bugs.
- The primary metric of H2.3 (missed bugs) is at the ceiling. The strong support is on a secondary metric, the judge steps.
- The judge grades the vague suites against the precise test cases. The frozen file expects more steps `partial` for a vague suite. This is the effect that E2 measures.

### The judge result of H2.3 in two forms (decision 25)

| Form | A, steps `partial` of 49 | B, steps `partial` of 49 | Status |
|---|---|---|---|
| 1. Frozen result. This is the result of record | 2 / 21 / 18 (mean 13.67) | 0 / 0 / 0 | strong support by the frozen rule |
| 2. Sensitivity check, **post hoc** | 2 / 4 / 1 (mean 2.33) | 0 / 0 / 0 | no frozen label. The ranges still do not overlap |

- Form 2 removes each step of A whose `partial` note names only a helper or a calculated value. These are 0 of 2 (A-1), 17 of 21 (A-2) and 17 of 18 (A-3).
- The reason: decision 19 found that B also calculates totals with `PriceHelper` from constants. The judge gave these steps of B `covered` (section 5).
- The manual check of the judge (item 1.1) gave a general answer: "the judge is right as is". It gave no verdict for each step (decision 22). The judge numbers did not change.
- The offer sentence and the client document use only form 2, with n = 3 and the spread (decision 25).
- A-2 keeps 4 steps in form 2. Of these, TC-07 step 7 and TC-08 step 8 did not show a weak check in the tamper run (section 5).

## 3. E3: a weaker writer model

Sources: `bench/results/aggregate-haiku.md`, `LOG.md` entry 21.10, 13:40.

**Question.** Does the harness help when a weaker model writes the tests?

- The writer is `claude-haiku-5-5` for A and B, with the precise test cases. The reviewer `spec-reviewer` of the harness stays on Sonnet.

| Metric | A-haiku | B-haiku |
|---|---|---|
| Realistic bugs missed, of 11 | 0 / 0 / 4 | 0 / 0 / 0 |
| Mutation score, of 14 | 14 / 14 / 10 | 14 / 14 / 14 |
| Judge steps `partial`, of 49 | 9 / 3 / 7 | 5 / 3 / 1 |
| Judge steps `missing`, of 49 | 7 / 0 / 0 | 0 / 0 / 0 |
| Flaky tests in 20 runs | 0 / 0 / 1 | 0 / 0 / 0 |
| Cost for each test case, USD | 0.1 / 0.1 / 0.07 | 0.2 / 0.23 / 0.53 |
| Work time for each test case, min | 5.2 / 2.6 / 1.9 | 3.3 / 3 / 3.5 |

| Hypothesis | Rule | Values | Label |
|---|---|---|---|
| H3.3: B-haiku misses fewer bugs than A-haiku | the n = 3 rule | B 0 / 0 / 0 against A 0 / 0 / 4 | direction only, inconclusive |
| H3.1: the gap of missed bugs is larger with Haiku | D = mean(A) minus mean(B) | D(haiku) = 1.33, D(precise) = -1.33 | direction only (H3.3 has no strong support) |
| H3.2: the gap of judge steps is larger with Haiku | the same, on `partial` plus `missing` | D(haiku) = 5.67 (A 16 / 3 / 7, B 5 / 3 / 1), D(precise) = 1.33 | direction only (the judge ranges overlap: A 3 to 16, B 1 to 5) |

- Haiku A-3 missed M01, M03, M09 and M13. Its TC-07 test failed on these patches, but it also failed 1 of 3 recheck runs on the clean build. This is the pattern of precise B-3.
- D(precise) was known when Arsen froze `hypotheses-v2.md`. Thus the threshold of H3.1 and H3.2 is post hoc.
- A message from another Claude session reached the agent of haiku B-1. The agent replied one time and went on. Arsen decided that B-1 counts (decision 16).

## 4. E4: audit of a ready suite, before and after

Sources: `bench/results/e4-before-after.md`, `e4-score-x1.md`, `e4-score-x2.md`, `e4-score-x2-tcfix.md`, `client-selection.md`, `LOG.md` entries 21.10, 15:20 to 17:45.

**Question.** Does an audit without the source code find weak tests in a ready suite? How many bugs does the suite catch before and after the fix?

**The steps.** For each suite, n = 1.

1. Tools without an LLM: the tamper proxy with the 22 frozen rules, and the expectation mutants.
2. An auditor session (`claude-opus-5-5`) reads the suite, the test cases and the 2 tool reports. It cannot read the source code or the server build of the app.
3. A fixer session with the harness fixes the suite by the audit report.
4. The same measurements as for a generation run.

**The suites.**

- vague A-1 is the client suite by the frozen rule (step 3: each of the 11 eligible suites misses 0 bugs).
- haiku A-3 is **exploratory** (decision 17). Arsen chose it after the results of E2 and E3, because it is the only suite with missed bugs. It gets no label.

| Hypothesis (vague A-1) | Support rule | Label |
|---|---|---|
| H4.1: the audit finds the weak places that let bugs through | R1 ≥ 0.5 | not tested: the suite misses no realistic bug |
| H4.2: at least half of the flags point to a missed patch | P1 ≥ 0.5 | not tested: the suite misses no patch |
| H4.3: after the fix, the suite misses fewer bugs | after < before | no change: 0 of 11 before and after |

| Measure | vague A-1 before | vague A-1 after | haiku A-3 before (exploratory) | haiku A-3 after (exploratory) |
|---|---|---|---|---|
| Realistic bugs missed | 0 of 11 | 0 of 11 | 4 of 11 | 0 of 11 |
| Mutation score | 14 of 14 | 14 of 14 | 10 of 14 | 14 of 14 |
| Flaky tests in 20 runs | 0 | 0 | 1 | 0 |
| Judge steps `partial` plus `missing`, of 49 | 2 | 0 | 7 | 1 |
| `weakening()` findings in the fix | - | 0 | - | 1 |
| Tamper rules caught / survived, of 22 (for information) | 20 / 2 | 20 / 2 | 19 / 3 | 20 / 2 |
| Expectation mutants killed / survived / skipped (for information) | 44 / 1 / 0 of 45 | 44 / 1 / 0 of 45 | 62 / 2 / 18 of 82 | 89 / 2 / 0 of 91 |

- The fixer saw the audit report. Thus the tamper and mutant numbers after the fix are not independent.
- haiku A-3: the change from 4 to 0 missed bugs comes completely from a stable step 1 of TC-07. The checks that catch the 4 patches were in the suite before the fix.
- T14-b and T15-d survive in each audited suite, before and after the fix. T14-b changes the email in one session query. T15-d changes the text `Invalid coupon.` in the translation file.

**The measures of the audit.** The frozen rule puts all measures in one table.

| Measure | vague A-1 | haiku A-3, strict (exploratory) | haiku A-3, key variant (exploratory) |
|---|---|---|---|
| R1 | not tested | 4 of 4 | 4 of 4 |
| R2 | not tested | 4 of 4 | 4 of 4 |
| P1 | not tested | 2 of 8 | 2 of 23 |
| P2 | not tested (the classes give 2 of 22) | 7 of 8 | 8 of 23 |
| Flags: hit / weak by the judge / other | 0 / 2 / 20, of 22 | 2 / 5 / 1, of 8 | 2 / 6 / 15, of 23 |

- haiku A-3: the 2 hits are TC-07 steps 8 and 9. The reasons of these flags are other weak checks. The cause of the 4 missed bugs was the flaky step 1 of TC-07.
- The strict variant reads no TC ID from the haiku A-3 tests, so it has 0 tamper flags. The key variant reads the ID from the test key. The main session logged both variants before the score.
- The script dropped 1 FLAG line of haiku A-3. With it, the strict variant gives P1 2 of 9 and P2 7 of 9.

**Cost and time.**

| Part | vague A-1 | haiku A-3 |
|---|---|---|
| Audit tools (tamper and mutants), 0 USD | 1663 s | 1835 s |
| Auditor session | 1.18 USD, 211 s | 1.54 USD, 358 s |
| Audit total (tools plus auditor) | 1.18 USD, 31.2 min | 1.54 USD, 36.6 min |
| Fixer session | 2.22 USD, 606 s | 4.11 USD, 1153 s |
| Audit plus fix | 3.40 USD, 41.3 min | 5.66 USD, 55.8 min |
| Minutes of Arsen on the audit | not measured | not measured |

- The times are machine times. The sums come from the values in `e4-before-after.md`, with a command (`LOG.md`, entry 22.10, 00:26).
- The tool-call audits of the 4 sessions found 0 forbidden calls and 0 cross-session messages.

## 5. Decision 19: tamper and mutants on vague A-2 and B-2 (exploratory)

Source: `bench/results/decision-19-x3-x4.md`, `LOG.md` entry 21.10, 18:35.

**Question.** The judge gave vague A-2 21 steps `partial`. Do these steps show as weak checks in the behavior of the tests?

- **Exploratory.** Arsen chose A-2 after the judge results.
- The main session wrote the expectation before the runs. More rules of the group of prices, totals, the discount and the bonus survive in A-2 than in B-2.

| Run | Suite | Result |
|---|---|---|
| `tamper-x3` | vague A-2 | 20 caught, 2 survived (T14-b, T15-d), of 22 |
| `tamper-x4` | vague B-2 | 20 caught, 2 survived (T14-b, T15-d), of 22 |
| `mutate-x3` | vague A-2 | 51 killed, 2 survived, 0 skipped, of 53 |
| `mutate-x4` | vague B-2 | 23 killed, 1 survived, 0 skipped, of 24 |

- The expectation did not come true. No rule of the group survived in A-2 or in B-2.
- The cause: the helpers of A-2 calculate each expected value from fixed constants in `data/test-data.ts`. They do not read the page. Thus a changed price fails the test.
- 2 independent agents checked the 21 steps `partial` of A-2. 13 steps failed at the step itself under a tamper rule. 6 steps did not run, because the test failed earlier.
  1 step has only the rule T15-d, and 1 step has no rule.
- **The judge applies its rule on calculated values differently to A and B.** B-2 also calculates totals with `PriceHelper` from constants. The judge gave these steps of B-2 `covered` and the same steps of A-2 `partial`.

| Suite | Steps `partial` plus `missing` | Of them, the note names a helper or a calculated value | Other steps |
|---|---|---|---|
| vague A-1 | 2 | 0 | 2 |
| vague A-2 | 21 | 17 | 4 |
| vague A-3 | 18 | 17 | 1 |
| vague B-1, B-2, B-4 | 0, 0, 0 | 0 | 0 |

- This check came after the results. It does not change the frozen result of H2.3. It is the reason for form 2 in section 2.

## 6. E5a: time of a person to accept a suite

Sources: `bench/review-log.csv`, `bench/review-log-full.csv`, decisions 12, 22, 23 and 24.

**Question.** How many minutes does an AQA need to make a suite ready to merge?

| Hypothesis | Label |
|---|---|
| H5a.1: Arsen needs less time to make B-1 ready to merge than A-1 | not tested |
| H5a.2: after the E4 fix, the client suite needs less review time | not tested |

- The quick look of 20.10 (3.8 and 1.0 minutes, 0 issues) is not a result (decision 12).
- On 21.10, Arsen started the full review of `suite-1` and stopped it after 3.2 minutes. This is a stopped start, not a result (decision 23).
- Arsen estimates the manual review of one suite at 1 to 2 hours (decision 24). His first estimate was 30 to 60 minutes (decision 23).
  This is an estimate, not a measurement. It is the same for A and B, so it shows no difference between A and B.

## 7. E5b: a change of the UI

Sources: `bench/results/e5b-summary.md`, `ui-change-each.md`, `ui-change-together.md`, `LOG.md` entry 21.10, 23:03.

**Question.** Which suite is cheaper to maintain when the UI changes?

- The suites are A and B of precise run 1, with n = 1. A separate session wrote 4 UI patches.
- Patches 01 and 04 rename a button. Patch 02 changes the layout of the login form. Patch 03 moves the coupon panel from the payment step to the basket.

| Hypothesis | Rule | Values | Label |
|---|---|---|---|
| H5b.1: B has no more broken tests than A | broken(B) ≤ broken(A), sum over the patches | A 6, B 6 (patches 01 and 03 break 3 tests each) | support, "equal" |
| H5b.2: the fix of B makes no check weaker, and not more than the fix of A | weakening(B) = 0 and ≤ weakening(A) | A 0, B 0 | support |

| Fix session (all 4 patches together) | A | B |
|---|---|---|
| Cost, USD | 1.06 | 0.83 |
| Work time, min | 4.9 | 3.4 |
| Tests fixed, of 5 broken | 4, and TC-05 renamed | 2 |
| Tests still broken | 0 | 3 (TC-05, TC-06, TC-07) |
| Files changed | 12: 6 test-case files, 6 code files | 1 code file, 3 lines |

- For B, `weakening()` covers only the 3-line fix of patch 01. H5b.2 says nothing about a fix of the coupon flow by B.
- The cost and the time of B cover 2 of 5 fixes. Thus they do not compare directly with A.

**A difference outside the frozen metrics (exploratory, n = 1).**

- A made its tests green with code changes (`8 passed (15.1s)`). After that, it changed 6 files in `test-cases/` to match the new UI. It told the person in its last message.
- B changed the button name in its code without a question. Then it stopped at the move of the coupon. It did not change the test cases, by the rule of its harness (`AGENTS.md:52-53`). It asked if the move is intended or a bug.
- The E5b design treats each UI patch as an intended release. By that design, A finished the task and B did not. `e5b-summary.md` reads this as a trade-off, not as a win for one side.

## 8. Cost and work time for each test case

Sources: `aggregate-precise.md`, `aggregate-vague.md`, `aggregate-haiku.md`. The ratio is the mean of the listed B values divided by the mean of the listed A values. A command gave it (`LOG.md`, entry 22.10, 00:26).

| Condition | Cost for each test case, USD, A | B | B / A | Work time for each test case, min, A | B | B / A |
|---|---|---|---|---|---|---|
| precise (Opus) | 0.34 / 0.26 / 0.26, mean 0.29 | 1.01 / 0.86 / 0.81, mean 0.89 | 3.12 | 1.5 / 1.3 / 1.4, mean 1.4 | 2.9 / 2.3 / 2.8, mean 2.67 | 1.90 |
| vague (Opus) | 0.32 / 0.33 / 0.31, mean 0.32 | 1.06 / 1.05 / 0.84, mean 0.98 | 3.07 | 1.4 / 1.3 / 1.4, mean 1.37 | 3.5 / 3.5 / 2.2, mean 3.07 | 2.24 |
| haiku (Haiku) | 0.1 / 0.1 / 0.07, mean 0.09 | 0.2 / 0.23 / 0.53, mean 0.32 | 3.56 | 5.2 / 2.6 / 1.9, mean 3.23 | 3.3 / 3 / 3.5, mean 3.27 | 1.01 |

- The cost of the stopped vague B-3 is not known: its output has no result event. It is not in the table.
- The Mac slept 55 minutes during the generation of haiku A-1. The work time leaves out gaps of more than 10 minutes between transcript events, so it can still include shorter sleeps.
- Stage 2 has no frozen hypothesis on cost. Stage 1 hypothesis 5 covers the precise condition.

## 9. What the data supports

| Claim | Evidence | Strength |
|---|---|---|
| The harness catches more bugs. | Missed bugs: precise A 0 / 0 / 0, B 0 / 0 / 4. Vague 0 / 0 / 0 for A and B. Haiku A 0 / 0 / 4, B 0 / 0 / 0. 16 of 18 suites miss 0 bugs. The 2 others miss 4 bugs each because a TC-07 test failed a recheck run, not because a check is missing. Labels: ceiling (vague), opposite direction (precise, post hoc), direction only (haiku). | not supported |
| The harness gives more complete checks on vague test cases, frozen form (result of record). | Judge steps `partial` of 49: A 2 / 21 / 18, B 0 / 0 / 0. H2.3, judge metric: strong support. The judge is the same model as the writer and applies its rule on calculated values differently to A and B (section 5). | supported |
| The same claim, conservative form (decision 25). The offer uses only this form. | Without the A steps whose note names only a helper or a calculated value. A 2 / 4 / 1, B 0 / 0 / 0, n = 3. The ranges do not overlap. The check is post hoc, so it has no frozen label. The effect claim rests on the frozen strong support. A-2 keeps 4 steps. Of these, TC-07 step 7 and TC-08 step 8 failed under the tamper rule T15-e, so they do check the text. | supported (post hoc sensitivity check, judge only, no frozen label) |
| The tests of A-2 are weaker in behavior than the tests of B-2. | Decision 19 (exploratory): tamper 20 / 2 for both, the same 2 survived rules. Mutants: A-2 2 of 53 survived, B-2 1 of 24. | not supported |
| Vague test cases make suite A weaker (H2.1). | Missed bugs and mutation score: ceiling. Judge steps `partial` plus `missing`: 2 / 21 / 18 against 2 / 0 / 3, direction only. Flaky tests: 0 / 0 / 2 against 1 / 0 / 0, direction only. | not supported for bugs (ceiling). Direction only for the judge and the flaky tests |
| Vague test cases make suite B weaker (H2.2). | B-vague is better than B-precise in 4 of 4 metrics, with overlap: opposite direction, inconclusive. | not supported |
| The harness helps more with a weaker model (H3.1 to H3.3). | Missed bugs: B-haiku 0 / 0 / 0 against A-haiku 0 / 0 / 4. Judge gap D(haiku) 5.67 against D(precise) 1.33. The threshold is post hoc. | direction only |
| The audit without the source code finds weak checks. | Frozen E4 (vague A-1): H4.1 and H4.2 not tested. H4.3 no change, 0 of 11 missed before and after. 22 flags, 2 weak by the judge. Exploratory haiku A-3: R1 4 of 4, R2 4 of 4. P1 2 of 8 (2 of 23 in the key variant), P2 7 of 8 (8 of 23). Both hits flag other weak checks. The cause of the 4 misses, a flaky step 1 of TC-07, is only in finding 9 of the audit report, with no FLAG line. The audit cost 1.18 and 1.54 USD (about 1.2 to 1.5 USD). It took 31.2 and 36.6 min of machine time (about 31 to 37 min). These are measured, n = 1 for each suite. haiku A-3 is exploratory. The minutes of a person were not measured. | not tested (no hypothesis on cost or time) |
| After a UI change, B has no more broken tests than A (H5b.1). | 6 broken tests in A, 6 in B. | supported (equal) |
| The fix of B after a UI change makes no check weaker (H5b.2). | `weakening()`: 0 findings in A, 0 in B. For B, this covers only a 3-line fix. B fixed 2 of 5 broken tests. | supported (B fixed 2 of 5) |
| Without the harness, the agent changes the test cases to match a UI change. With the harness, it asks a person first. | E5b, n = 1. A made the suite green, then changed 6 test-case files to the new UI. B stopped at the coupon move, did not change the test cases (`AGENTS.md:52-53`), and asked if the move is a bug. | not tested (exploratory example, n = 1) |
| The harness saves AQA review minutes. | E5a did not run (decision 23). The 1 to 2 hours are an estimate of Arsen, the same for A and B. | not tested |
| The harness costs more and takes more time for each test case. | Cost B / A: 3.12 (precise), 3.07 (vague), 3.56 (haiku). The cost ranges do not overlap in any condition. Time B / A: 1.90, 2.24 and 1.01. The time ranges overlap only for haiku. | supported for the cost in 3 of 3 conditions. Time: supported for precise and vague, direction only for haiku. Post hoc for precise (stage 1 hypothesis 5). Exploratory for vague and haiku (no stage 2 hypothesis) |

## 10. ROI: a scenario, not a measurement

This section is a scenario with explicit inputs. It does not test a hypothesis. It does not estimate the cost of a bug in production.

**The question of the scenario.** For one suite, compare 2 options:

1. A person does a manual review of the suite.
2. The agents do the audit and the fix, and a person checks the result.

**The inputs.**

| Input | Symbol | Value | Kind |
|---|---|---|---|
| Rate of an AQA | `r` | 25 USD for each hour. The plan also names a Senior AQA in Ukraine at about 4,000 USD for each month. At 25 USD, that is 160 hours (4,000 / 25) | input of the plan, not measured |
| Manual review of one suite | `T_manual` | 1 to 2 hours | estimate of Arsen (decision 24), not measured. Decision 23 gave 30 to 60 minutes. Arsen changed it |
| Audit cost (auditor session, the tools cost 0) | `C_audit` | vague A-1 1.1764114 USD, haiku A-3 1.5409804 USD | measured, E4, n = 1 |
| Fix cost (fixer session) | `C_fix` | vague A-1 2.2226188 USD, haiku A-3 4.1148693 USD | measured, E4, n = 1 |
| Machine time of the audit plus the fix | `t_agent` | vague A-1 41.3 min, haiku A-3 55.8 min | measured, E4, n = 1. For information, not in the formula |
| Time of a person on the audit report and the fix diff | `T_person` | not known | not measured in E4 |

**The formula.**

```text
Cost_manual = r × T_manual
Cost_agent  = C_audit + C_fix + r × T_person
Saving      = Cost_manual - Cost_agent
Break-even  : T_person* = (r × T_manual - C_audit - C_fix) / r
```

Option 2 is cheaper only while `T_person` is less than `T_person*`.

**The values.** From a command (`LOG.md`, entry 22.10, 00:26).

| Suite | `C_audit + C_fix`, USD | `Cost_manual`, `T_manual` = 1 h | `T_person*` for 1 h | `Cost_manual`, `T_manual` = 2 h | `T_person*` for 2 h |
|---|---|---|---|---|---|
| vague A-1 | 3.40 | 25 USD | 51.8 min | 50 USD | 111.8 min |
| haiku A-3 (exploratory) | 5.66 | 25 USD | 46.4 min | 50 USD | 106.4 min |

**How to read it.**

- The agent cost is 3.40 to 5.66 USD for one suite. A manual review at the estimated time costs 25 to 50 USD.
- Thus option 2 is cheaper while a person spends less than about 46 to 112 minutes on the audit report and the fix diff. Nobody measured this time.
- The 2 options do not give the same product. A manual review reads the full suite. The audit gives a list of flags and a fix, and a person must still read the fix diff.
- The frozen E4 found no missed bug in vague A-1, and the fix did not change the missed bugs. Thus the scenario has no gain from caught bugs.
- E5a did not run. Thus the scenario does not show that the audit plus the fix replaces a manual review.

## 11. Limits

- This is a demonstration, not a study. One app, 8 test cases, 14 bug patches, 4 UI patches.
- n = 3 for each condition. n = 1 for E4 and E5b. E5a did not run.
- For the suites of Opus, the judge is the same model as the writer. The auditor and the judge do the same task with the same model, so P2 is not independent of the judge.
- The judge applies its rule on calculated values differently to A and B (decision 19). Form 2 of the judge result is a post hoc check of this effect.
- The manual check of the judge (item 1.1) has a general answer: "the judge is right as is". It has no verdict for each step (decision 22). The check was not blind.
- The n = 3 labels of the stage 1 hypotheses are post hoc. The threshold of H3.1 and H3.2 is post hoc.
- In B-haiku, the reviewer `spec-reviewer` runs on Sonnet, a stronger model than the writer.
- A message from another Claude session reached the agent of haiku B-1, and the agent replied one time (decision 16). The lock does not stop messages between Claude sessions on one Mac.
- The Mac slept during some measurements of E2. By a rule written before the read of the results, the time-dependent steps ran again (`LOG.md`, 21.10, 12:55). Vague B-3 stopped when the Mac shut down, so B-4 replaced it.
- A mechanical rule made the vague test cases (`bench/vague-rule.md`). They are not real Jira tickets. Their test data keeps only the inputs (decision 6).
  Some exact values, or a way to get them, stay in the vague set (section 9 of the rule). These items come word for word from the frozen limits:
  - The step column stays word for word. TC-04 step 2 gives the purchase limit. TC-08 steps 3 and 7 give the order total on the button `Pay 8.99¤`.
  - `README.md` stays word for word. The part `<NN>` of a coupon code gives the discount, and its examples give a coupon with a 10% discount.
  - The text before the preconditions and the preconditions stay word for word (decision 8). In TC-08, they keep the calculation of the bonus points and the balance of a new account. In TC-05, they tell which part of the order gets the discount.
  - In TC-08, the first balance stays as an input (decision 7). The first balance plus the top-up give the order total.
    From it, an agent can find the price of `Eggfruit Juice (500ml)`, and then some expected values of TC-02, TC-03, TC-05 and TC-06. Arsen accepted this leak as a limit (decision 9).
  - The generation agent sees the running app through Playwright MCP and can read each price there.
  - The meaning of a message (rule M) is the free part of the rule. Two people can choose different words.
  - The checks of the rule cannot find each wrong change. Rule D finds nouns and action sentences with short word lists, so a rare form can get the wrong class. Arsen reads each changed cell at checkpoint 2.
- The client suite of E4 is the weakest of up to 12 candidates, by a rule that uses the bug patches. Its "before" number is low on purpose, and the same patches give the score of the audit. The gain before and after does not carry over to a typical suite.
  Arsen chose haiku A-3 after the results.
- On vague A-2 and B-2, the tamper rules and the expectation mutants gave no difference (decision 19). B also calculates totals with helpers from constants (decision 22).
- The fixer of E4 saw the audit report. Thus the tamper and mutant numbers after the fix are not independent.
- The tamper list covers only the values that the test cases name.
- The lint rules of B forbid some patterns that `weakening()` finds. Thus a part of the result of B in H5b.2 can come from its lint.
- The review time in the ROI scenario is an estimate of Arsen. He changed it from 30 to 60 minutes to 1 to 2 hours.
- Arsen knows the test cases and the harness. He took a quick look at both copies of E5a round 1 (decision 12). E5a did not run.
- `sealed-ui/` came after the E4 audit, not before it as in the plan (`LOG.md`, entry 22.10, 00:26). E4 does not use the UI patches.
- The draft of the block "Демо" holds the E5b coupon example, with the mark "приклад, n = 1" (decision 26). The frozen rule lets the offer sentence use only measured numbers of E4 and E5a. Arsen made this deviation after the results.
