# E4: the client suite before and after the audit and the fix

The rules are in `bench/hypotheses-v2.md` at the tag `hypotheses-v2`: the section E4 and the section "Measures of the audit".
Each suite has one audit, one fix and one set of measurements, so n = 1.

- vague A-1 (`set-2/run-1/suite-a`, tag `gen-1`) is the client suite of the frozen rule (`bench/results/client-selection.md`, step 3). Its fix folder is `desk-q`.
- haiku A-3 (`set-3/run-3/suite-a`, tag `gen-3`) is exploratory (decision 17). Arsen selected it after the results of E2 and E3, because it is the only suite with missed bugs. Its fix folder is `desk-s`.
  It tests no hypothesis. The thresholds of H4.1, H4.2 and H4.3 do not apply to it, and it gets no support label.

## For the offer

- The frozen E4 (vague A-1) shows no missed bug before the fix and no change after it. By the section "What we publish", the offer sentence does not claim that the audit found missed bugs, or that the fix lowered them.
- The gain of haiku A-3 (4 missed bugs to 0) is exploratory. It comes completely from the stable step 1 of a flaky TC-07, not from new checks of the fix (see the notes below).
- The fix made the judge steps `partial` fewer in both suites: 2 to 0 in vague A-1, 7 to 1 in haiku A-3.

## The measurements before and after the fix

The "before" columns are the measurements of the client suite at its generation tag. The "after" columns are the measurements of the fix folder at the tag `fixed`.

| Measure | vague A-1 before | vague A-1 after | haiku A-3 before | haiku A-3 after |
|---|---|---|---|---|
| Realistic bugs missed | 0 of 11 | 0 of 11 | 4 of 11 (M01, M03, M09, M13) | 0 of 11 |
| Mutation score (14 patches) | 14 of 14 | 14 of 14 | 10 of 14 | 14 of 14 |
| Flaky tests (20 runs of each test) | 0 | 0 | 1 (TC-07: 10 passed, 10 failed) | 0 |
| Broken tests (20 runs of each test) | 0 | 0 | 0 | 0 |
| Judge steps `partial` plus `missing`, of 49 | 2 + 0 | 0 + 0 | 7 + 0 | 1 + 0 |
| `weakening()` on the diff of the fix | not applicable | no finding | not applicable | 1 finding |
| Tamper rules caught / survived, of 22 (for information) | 20 / 2 | 20 / 2 | 19 / 3 | 20 / 2 |
| Expectation mutants killed / survived / skipped (for information) | 44 / 1 / 0 of 45 | 44 / 1 / 0 of 45 | 62 / 2 / 18 of 82 | 89 / 2 / 0 of 91 |

The tamper and expectation-mutant rows are for information only. The fixer saw the audit report, so these numbers after the fix are not independent.

The sources (all in `bench/results/`):

| Measure | vague A-1 before | vague A-1 after | haiku A-3 before | haiku A-3 after |
|---|---|---|---|---|
| Bugs, patches | `mutants-vague-1.json`, suite A | `mutants-e4-after-x1.json` | `mutants-haiku-3.json`, suite A | `mutants-e4-after-x2.json` |
| Flaky, broken | `flaky-vague-1.json`, suite A | `flaky-e4-after-x1.json` | `flaky-haiku-3.json`, suite A | `flaky-e4-after-x2.json` |
| Judge | `judge-vague-1/suite-1.json` (A) | `judge-e4-after-x1/suite-1.json` | `judge-haiku-3/suite-2.json` (A) | `judge-e4-after-x2/suite-1.json` |
| `weakening()` | - | `LOG.md`, entry 21.10, 15:55 | - | `LOG.md`, entry 21.10, 15:55 |
| Tamper | `tamper-x1.md` | `tamper-e4-after-x1.md` | `tamper-x2.md` | `tamper-e4-after-x2.md` |
| Expectation mutants | `mutate-x1.md` | `mutate-e4-after-x1.md` | `mutate-x2.md` | `mutate-e4-after-x2.md` |
| Audit report, flags | `e4-audit-report-x1.md`, `e4-flags-x1.json` | - | `e4-audit-report-x2.md`, `e4-flags-x2.json` (strict), `e4-flags-x2-tcfix.json` (key) | - |

### Notes on the rows

- The missed bugs of haiku A-3:
  - Before the fix, the test of TC-07 failed at step 1 on M01, M09 and M13: the message `Placed Carrot Juice (1000ml) into basket.` did not show (`tests/pages/shop.ts:92`). On M03, it failed at the totals check of step 8.
  - The same test also failed at step 1 in one recheck run on the clean build (`mutants-haiku-3/recheck-A.json`). Thus the stage 1 rule does not count any of the 4 failures (`droppedByRecheck` in `mutants-haiku-3.json`).
  - After the fix, TC-07 catches M01, M03 and M09 at the totals check of step 8 (`ConfirmationTotals.expectTotals`). It catches M13 at the basket counter check of step 9 (`expectBasketCounter(0)`). TC-07 passed 20 of 20 runs and the 3 rechecks.
  - The suite had these two checks, and their calls in the spec, with no change at `gen-3`. At step 1, the fix changed `addToBasket` to `addOneMoreToBasket`.
  - Thus the change of 4 to 0 comes completely from a stable step 1. The checks that the fix added for TC-07 steps 6, 8 and 9 do not catch these patches.
- The judge steps that changed:
  - vague A-1 before: TC-04 step 2 and TC-06 step 4 are `partial`. After: none.
  - haiku A-3 before: 7 steps are `partial`. They are TC-01 step 1, TC-02 step 3, TC-06 step 4, TC-07 steps 6 and 8, and TC-08 steps 2 and 6. After: only TC-06 step 4.
    The note of the judge after the fix: the error message can stay from step 3. Also, the check of "no discount" can pass before the server responds.
- The finding of `weakening()` in the fix of haiku A-3: "added a timeout option (timeout: MESSAGE_LIFETIME)". The line waits until an old message is gone. By the frozen rule, the finding counts.
- The tamper rule that changed is T07-a in haiku A-3: it survived before, and the suite catches it after. T07-a changes the quantity of a product in the saved order on the confirmation page. In both suites, T14-b and T15-d survive before and after.
- The expectation mutants:
  - vague A-1: the same mutant S023 survives before and after.
  - haiku A-3: the tool skipped 18 mutants before the fix, because TC-07 failed on the original file. After the fix, it skipped none, and the code has 91 sites, not 82.
  - haiku A-3: the check `toHaveCount(0)` of `expectNoRow` survives before (S015) and after (S069). The fix killed S029. The new survivor S068 is in `expectNoMessage`, a helper that the fix added, on the line that `weakening()` flagged.
- The size of the fixes: both diffs include the hook log `.agent-log/actions.jsonl` of the harness. The client `.gitignore` does not ignore it.
  - vague A-1: `git diff --shortstat fixed~1 fixed` gives 9 files, +224, -13. Of these, the hook log is +154. Without it: 8 files, +70, -13.
  - haiku A-3: 17 files, +497, -41. Of these, the hook log is +290. Without it: 16 files, +207, -41. The fixer renamed 8 spec files.
  - `summary-e4-after-x2.md` gives 969 lines, because it counts each renamed file as a new file.

## The hypotheses of E4 (vague A-1 only)

| ID | Support rule | vague A-1 |
|---|---|---|
| H4.1 | R1 ≥ 0.5 | not tested: the suite misses no realistic bug |
| H4.2 | P1 ≥ 0.5 | not tested: the suite misses no patch |
| H4.3 | after < before | no change: 0 of 11 before and after. When the client suite misses no realistic bug, the frozen rule allows only "no change" |

## The measures of the audit

The frozen rule puts all measures in one table. The scores come from `bench/e4-prepare.mjs score`.

| Measure | vague A-1 (`e4-score-x1.md`) | haiku A-3, strict (`e4-score-x2.md`) | haiku A-3, key variant (`e4-score-x2-tcfix.md`) |
|---|---|---|---|
| R1 | not tested | 4 of 4 | 4 of 4 |
| R2 | not tested | 4 of 4 | 4 of 4 |
| P1 | not tested | 2 of 8 | 2 of 23 |
| P2 | not tested | 7 of 8 | 8 of 23 |
| Flags: hit / weak by the judge / other | 0 / 2 / 20, of 22 | 2 / 5 / 1, of 8 | 2 / 6 / 15, of 23 |

- haiku A-3 has no support label. Its values are exploratory.
- The strict variant has 0 tamper flags for haiku A-3. The tool reads no TC ID from these tests (`tc` null in `tamper-x2.json`). The reason: the file name and the title do not hold the ID in the form `TC-NN`. The key variant reads the ID from the key of the test and gives 19 tamper flags. The main session decided the two variants and logged them before the score (`LOG.md`, entry 21.10, 15:20).
- The script dropped 1 FLAG line of haiku A-3: `FLAG TC-04 step 5`, because its reason also names step 3. This parse rule was in `bench/e4-prepare.mjs` from 14:38, before the auditor sessions. The prompt of the auditor forbids only a line that names a range or a list of steps.
  With this line, the strict variant has 9 flags: P1 2 of 9, P2 7 of 9, and the classes 2 / 5 / 2. The fix of this flag later gave the `weakening()` finding.
- The 2 hits of haiku A-3 are on TC-07 steps 8 and 9. The reasons of these flags are other weak checks: the quantities are not checked, and `expectNoRow` can pass before the basket loads. The cause of the missed bugs was the flaky step 1 of TC-07. The audit named this cause in its finding 9, but with no FLAG line, so R1 does not include it.

## The cost and the time

| Part | Suite | Cost, USD | Time |
|---|---|---|---|
| Audit tools: `tamper-x1` and `mutate-x1` | vague A-1 | 0 | 1663 s (13:46:26 to 14:14:09) |
| Audit tools: `tamper-x2` and `mutate-x2` | haiku A-3 | 0 | 1835 s (14:31:10 to 15:01:45), after one stopped attempt |
| Auditor session `auditor-x1` | vague A-1 | 1.18 | 211 s |
| Auditor session `auditor-x2` | haiku A-3 | 1.54 | 358 s |
| Fixer session `fixer-x1` | vague A-1 | 2.22 | 606 s |
| Fixer session `fixer-x2` | haiku A-3 | 4.11 | 1153 s |
| Judge after the fix | vague A-1 | 0.87 | 174 s |
| Judge after the fix | haiku A-3 | 0.55 | 89 s |

- The audit of each suite is the tool runs plus the auditor session. For vague A-1, it took about 31 minutes and 1.18 USD. For haiku A-3, it took about 37 minutes and 1.54 USD.
- The minutes of Arsen on the audit: not measured. The procedure had no step for Arsen between the audit and the fix. The fixer got the audit report with no change (the same sha256 as `e4-audit-report-x1.md` and `e4-audit-report-x2.md`). No entry of `LOG.md` records time of Arsen on the reports.
- The tool-call audits of the 4 sessions: 0 forbidden calls and 0 cross-session messages (`audit-auditor-x1`, `audit-auditor-x2`, `audit-fixer-x1`, `audit-fixer-x2`).

## Limits

- n = 1 for each suite.
- The frozen rule selects the client suite as the weakest of the candidates, by the bug patches. The same patches give the score of the audit. Thus the gain before and after does not carry over to a typical suite. This applies most to haiku A-3: Arsen selected it after the results, as the only suite with missed bugs.
- vague A-1 came from step 3 of the rule: all 11 eligible suites miss 0 bugs. The judge gives it 2 `partial` steps, against 21 for vague A-2 and 18 for vague A-3. Thus E4 on vague A-1 cannot show a gain in missed bugs.
- The writer of vague A-1, the auditor, both fixers and the judge are all `claude-opus-5-5`. The auditor and the judge do the same task (they compare the tests with the test cases) with the same model. Thus P2 is not independent of the judge.
- The fixer saw the audit report. Thus the tamper and expectation-mutant numbers after the fix are not independent.
