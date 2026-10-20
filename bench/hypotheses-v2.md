# Pre-registration, stage 2: hypotheses and publication rules

**Draft, not frozen.** Arsen approves this file at checkpoint 3 of the stage 2 plan. Until then, the file can change.

This file is the pre-registration of stage 2 (plan v2, section 4).
We freeze it before the first generation of stage 2: the first run of the condition `vague` or `haiku`.
After the freeze, nobody changes this file. Later notes go into `LOG.md`.

`bench/hypotheses.md` (stage 1) stays as it is. It covers the condition `precise`, also its runs 2 and 3.
The rule "How we read n = 3" in this file is new. The main session measured the precise runs 2 and 3 on 20.10, from 15:31 to 16:32.
Arsen did not approve the section "How we read n = 3" before these measurements.
Thus the n = 3 labels of the stage 1 hypotheses are post hoc, and the README says so.
`LOG.md` (the entry of 20.10, 16:50) reads the stage 1 hypotheses with n = 3 descriptively, not by this rule.

## What we freeze before the first new generation

In this file, "decision N" is item N of section 10 of the stage 2 plan (plan v2).

| Item | Value |
|---|---|
| Precise test cases | TC-01 to TC-08, tag `test-cases-v1` in the lab, no change |
| Vague test cases | `test-cases-vague/`, in the lab since commit `e07d5d1`. Folder hash `cf554b7f18b27da8be60c93e22e49dcd6e45155d1b73b160bfe321ac5cd45898` (`LOG.md`, 20.10, 17:00). A separate locked session (`vague-writer-1`) applied the rule `bench/vague-rule.md` of commit `ba6f689` by its section 8 (decision 10). The tag `test-cases-v2-vague` is still to come: Arsen reads `bench/results/vague-review.md` first (checkpoint 2, part 2) |
| Harness | tag `harness-v1` of the stage 1 `suite-b`, no change. No new capability |
| Bug patches | the 14 patches in `sealed/sealed.tar`, no change: 11 realistic bugs and 3 operator mutants. Before each measurement block, the sha256 of the file must be the value in `LOG.md` |
| UI patches for E5b | not frozen here. The rules for the UI patch session are in the section E5b. The sha256 of `sealed-ui/` goes into `LOG.md` before any suite runs against a UI patch |
| Writer models | `claude-opus-5-5` for the conditions `precise` and `vague`. `claude-haiku-5-5` for the condition `haiku`. The harness reviewer `spec-reviewer` stays on Sonnet in all conditions |
| Judge | the rubric `bench/judge.md` without change, the model `claude-opus-5-5` as in stage 1. See the section "The judge" |
| Other sessions | The vague writer: `claude-opus-5-5`, done (decision 10). The tamper binder: `claude-opus-5-5` (decision 11). The auditor (E4) and the fixers (E4, E5b): `claude-opus-5-5`. This is a proposal (open question 7) |
| Claude Code | 2.1.299 from `~/.local/claude-code-2.1.299`. `bench/claude-locked.sh` checks the sha256 of the binary: `099dcc53dabbbefabed8926dab25b0318775c175a7c87bb6ba6c54fde9f8ece2` |
| Prompts | Generation: `bench/prompt-generation.txt` without change, the same for all conditions, at most one follow-up message with the standard text. E5b: `bench/prompt-repair.txt`. Vague writer: section 8 of `bench/vague-rule.md`, as `bench/prompt-vague-writer.txt` (sha256 in `LOG.md`). Audit and E4 fix: see E4 |
| Budget caps | Generation: `--max-budget-usd 40` for each run, in all conditions. Judge: 10 USD for each suite. Vague writer: 5 USD (decision 10), the session cost 1.04531 USD. Tamper binder: 5 USD (decision 11). Proposal: audit 20, E4 fix 20, E5b fix 10 USD for each suite |
| Lock | The generation runs, the vague writer, the tamper binder, the auditor and the fixers run through `bench/claude-locked.sh`. During the session, it hides these paths. Stage 1: `sealed/`, `bench/results/`, `LOG.md` and the measurement logs. The script also hides `sealed-ui/`. Decision 2 adds the lab `.git`, the vault folder `demo/` and the notes folder of the sealed hashes. It also adds the transcripts of the patch session, the other run folders and the templates. Decision 5 adds the transcripts and temp folders of the other runs, the lab `test-cases*`, the lab `README.md`, `bench/*.md` and `bench/conditions.json`. The transcripts of the lab session and `Bash(node *)` stay open (decision 2). The tool-call audit after each session covers them. `LAB/juice-shop/` also stays open, as in run 1. The auditor must not see it (plan v2, E4 step 2), so its lock must also hide `LAB/juice-shop/` (E4 inputs, item 3, open question 12). The UI patch session does not use this lock set. Its rules are in the section E5b |
| Run layout | `harness-demo-runs/<dir>/run-<n>/suite-a` and `suite-b`. `<dir>` is the neutral folder name of the condition in `bench/conditions.json` (plan v2, decision 3) |
| Folder names | `set-1` for `precise`, `set-2` for `vague`, `set-3` for `haiku` (decision 3). The `dir` values of `bench/conditions.json` are these names |
| Condition names | only in the result names (`gen-<condition>-<A or B>-<n>`) and in `LOG.md`. The lock hides both during a run |
| Runs | n = 3 for each suite in each condition: runs 1, 2 and 3. Run 1 of `precise` is the stage 1 suites (tag `gen-1`), moved into `set-1/run-1/` without change. The main session generated and measured runs 2 and 3 of `precise` (decision 4, `LOG.md`, 20.10, 16:50) |
| Clean template | each run starts from a clean template, see the list below |
| Tamper list | the rules file of the section "The tamper list for the proxy". Its sha256 and the sha256 of each capture file are in `LOG.md` |
| E5a review order | see E5a |

The clean template of a run:

- The template of `suite-a` holds the stage 1 history up to the tag `baseline` (an empty Playwright project). Then one commit adds the test case set.
- The template of `suite-b` holds the stage 1 history up to the tag `harness-v1` (the same project with the harness). Then one commit adds the test case set.
- The templates are in `harness-demo-runs/templates/`. `bench/make-template.sh` makes the templates of the vague set, after the tag `test-cases-v2-vague`. Their history does not name the set.
- The template names must not hold a condition name or a set name. The run folder has no git remote, and the lock hides the templates during a run.
- `bench/run-generation.sh` clones the template into the run folder. The run folder holds no history of other runs or of the other suite.
- The set is in `test-cases/` in each condition. Thus the prompt stays the same for all conditions.
- Before each generation, calculate the folder hash of the three copies of the set: the lab copy, the `suite-a` copy and the `suite-b` copy. They must be the same. Record them in `LOG.md`.

### Stopped runs

A run can stop before its end. The main session puts each stopped run into one of two classes. It records the class in `LOG.md` before any measurement of that run.

- **Outside cause.** Only these causes: the Mac slept or shut down. The app on port 3000 did not answer. A signal that the agent did not send stopped `bench/claude-locked.sh`. The CLI output shows an API error: an HTTP 5xx status, an overload or a network error.
- **Agent cause.** All other stops, for example the budget cap, the turn limit or an error in the work of the agent.

A run with an outside cause does not count. We do it again with the next free run number. We do not measure its suite.
A run with an agent cause counts. We measure its suite as it is.

## Measurements for each suite

Each suite of each run gets the measurements of stage 1:

- `bench/run-mutants.mjs`: the 14 patches and 3 recheck runs. A suite catches a patch by the rule of hypothesis 1 in `bench/hypotheses.md`.
- `bench/run-flaky.mjs`: 20 runs on the clean build.
- `bench/run-judge.mjs`: the blind judge with the rubric `bench/judge.md`.
- The cost and the work time for each test case, from the generation output and the transcript.

"Missed bugs" means the realistic bugs, of the 11, that a suite does not catch.

## How we read n = 3

For a metric where a lower value is better (missed bugs, judge steps, flaky tests):

| Result | Rule |
|---|---|
| Strong support | The means differ in the direction of the hypothesis. The min-max ranges do not overlap: each run of the better group is better than each run of the other group. |
| Direction only | The means differ in the direction of the hypothesis, and the ranges overlap. We write "inconclusive". |
| No difference | The means are equal. |
| Opposite direction | The means differ in the other direction, and the ranges overlap. We write "inconclusive". |
| Strong opposite | The means differ in the other direction, and the ranges do not overlap. We report it as a result against the hypothesis. |
| Ceiling | Each run of both groups has the best value, for example 0 missed bugs. We write "no difference at the ceiling". |

- Only "strong support" lets the README or the offer claim an effect. "Strong opposite" gets the same weight in the README.
- For a metric where a higher value is better (the mutation score), the direction is the opposite.
- We give the value of each run, the mean, the min and the max.
- We do not use tests of significance. With n = 3 they tell little. The table above is the full rule.
- When a group has fewer than 3 runs, we give its n. Then the best result is "direction only".

## Hypotheses

### E2: vague test cases

| ID | Hypothesis | Metric | Comparison | Support |
|---|---|---|---|---|
| H2.1 | Vague test cases make suite A weaker. | missed bugs | A-vague against A-precise, runs 1 to 3 | A-vague misses more bugs. Read by the n = 3 rule |
| H2.2 | Vague test cases make suite B weaker. | missed bugs | B-vague against B-precise | B-vague misses more bugs |
| H2.3 | On vague test cases, the harness keeps more checks. | missed bugs | B-vague against A-vague | B-vague misses fewer bugs |

Secondary metrics for H2.1 to H2.3, with the same comparisons and the same rule:

- the mutation score, of 14
- the judge steps `partial` plus `missing`, of 49
- the flaky tests in 20 runs

How we read the outcome (plan v2, E2):

- H2.1 and H2.2 have strong support, and H2.3 has none: the offer says "start the audit with the test cases".
- H2.3 has strong support: the offer can say that the harness keeps more checks on vague test cases. It gives the numbers and the spread.
- A result of "direction only": the README gives the numbers and says "inconclusive". The offer makes no claim.
- All suites miss 0 bugs: we write it. Then the judge numbers are the main signal of E2. We do not claim a difference in bugs.

### E3: a weaker model

| ID | Hypothesis | Metric | Comparison | Support |
|---|---|---|---|---|
| H3.1 | The harness helps more with Haiku than with Opus. | missed bugs | the gap D = mean(A) − mean(B) for `haiku` against the same gap for `precise` | Direction only: D(haiku) > D(precise) and D(haiku) > 0. Strong support: also H3.3 has strong support |
| H3.2 | The same for the coverage of the test cases. | judge steps `partial` plus `missing` | as H3.1 | as H3.1, with H3.3 read on the judge steps |
| H3.3 | With Haiku, suite B misses fewer bugs than suite A. | missed bugs | B-haiku against A-haiku | by the n = 3 rule |

- The condition `haiku` uses the precise test cases. The only difference from `precise` is the writer model.
- The reviewer `spec-reviewer` in B stays on Sonnet. Thus B-haiku has a stronger second model inside. The limits name this.
- Haiku on the vague test cases is extra (plan v2, E3). If it runs, we report it as exploratory, without a hypothesis.

### E4: audit of a ready suite, before and after

The rule in the section "The client suite for E4" selects one suite.
The audit, the fix and the measurements run one time, so n = 1. We report E4 as one case, without a mean or a spread.

| ID | Hypothesis | Metric | Support |
|---|---|---|---|
| H4.1 | The audit finds the weak places that let bugs through. | audit recall R1, see "Measures of the audit" | R1 ≥ 0.5 |
| H4.2 | At least half of the audit flags point to a missed patch. | audit precision P1, see "Measures of the audit" | P1 ≥ 0.5 |
| H4.3 | After the fix, the suite misses fewer bugs. | missed bugs before and after the fix | after < before. Strong support: also no more flaky tests, no more judge steps `partial` plus `missing`, and `weakening()` finds no weaker check in the diff of the fix |

- When the client suite misses no realistic bug, R1 has no value. Then H4.1 is "not tested", and H4.3 can only show "no change".
- When the client suite misses no patch at all, no flag can be a hit. Then H4.2 is also "not tested".
- When the audit gives no flag, H4.2 is "not tested", and R1 is 0.
- With small numbers, we give each ratio as "k of m", not only as a percentage.
- We also run the tamper proxy and the expectation mutants after the fix. We report these numbers, but they do not test a hypothesis. The fixer saw the audit report, so these numbers are not independent.
- We report the cost and the time of the audit and of the fix, and the minutes of Arsen on the audit.

#### Inputs of the audit and of the fix

Each item below is frozen with this file.

1. **Test case set.** The auditor and the fixer get the set of the condition of the client suite.
   For `vague`, this is the vague set. For `haiku`, this is the precise set.
   Reason: a real client has only its own test cases. With the precise set, the audit would see exact values that the client does not have.
2. **Tools.** The main session runs `bench/run-audit-tamper.mjs` (the frozen tamper list) and `bench/run-audit-mutate.mjs` on the client suite at its tag `gen-<n>`.
   Both tools get the label `client` (`--suite client=<path>`) and an `--out` name that names no condition, run or suite.
   The header of each `.md` report names the suite path, the commit, the tags and the paths in `bench/`.
   Thus a script of the main session removes these lines. In the tamper report: the lines that start with `Source:` and `Suite`, and the line `Rules:` that names the rules file. In the mutate report: the line that starts with `Source:`.
   The main session records the sha256 of each cleaned report in `LOG.md`. It gives the cleaned `.md` reports to the auditor. These reports name rules, tests and literals, not bug patches.
3. **Auditor.** A separate session in a new folder inside `harness-demo-runs/`, with a neutral name. It runs through `bench/claude-locked.sh`. Its lock must also hide `LAB/juice-shop/` (plan v2, E4 step 2, open question 12). Its folder holds only:
   - a copy of the client suite at `gen-<n>`, without the harness files (the list of `bench/prepare-review.mjs`)
   - `test-cases/` of item 1
   - the two cleaned tool reports of item 2
   The copy of the suite is the root of the folder, and its `test-cases/` is the set of item 1.
   The main session puts the two reports into the folder as `reports/tamper-report.md` (`run-audit-tamper.mjs`) and `reports/mutate-report.md` (`run-audit-mutate.mjs`).
   The auditor can open the app on port 3000. It does not get the name of the suite or the reason for the choice.
4. **Audit report.** The auditor writes `audit-report.md` in the form of the client document. Each flag is one line: `FLAG TC-NN step N: <reason>`.
   One line names one step. A range or a list of steps in a FLAG line is not allowed.
5. **Fix folder.** A second copy of the client suite at `gen-<n>`, in a new folder inside `harness-demo-runs/` with a neutral name. The run folder does not change (lab rule 5).
   The copy holds the client's `test-cases/` (item 1) and the audit report as `audit-report.md`.
6. **Harness in the fix folder.** For a client suite B, the harness is in the copy already.
   For a client suite A, one commit "Add harness" adds the paths of `git diff --name-only baseline harness-v1` from the B template.
   When the client suite has a file with the same path, the client file stays. `package.json` gets the npm scripts and dev dependencies of the harness that it does not have.
   The main session records the commit and the list of client files that stayed in `LOG.md`, before the fix starts.
7. **Fixer.** A session with the harness, through `bench/claude-locked.sh`, with the fix folder as `--dir`. At most one follow-up message, with the standard text of the generation.
   The prompts of the fixer and of the auditor (item 3) are proposals (open question 12). Both are in Ukrainian. Each session gets its prompt with no change.
   - The fixer: `За звітом аудиту audit-report.md виправ слабкі тести. Тест-кейси в test-cases/.`
   - The auditor:

     ```text
     Перевір автотести Playwright у цій папці: чи перевіряють вони те, що вимагають тест-кейси з папки test-cases/.
     Застосунок запущено на http://localhost:3000.
     У папці reports/ є звіти двох інструментів:
     - reports/tamper-report.md: підміна значень у JSON-відповідях сервера.
     - reports/mutate-report.md: зміна очікуваних значень у перевірках expect.
     Не змінюй код тестів.
     Напиши звіт audit-report.md: список слабких тестів, що саме кожен тест не перевіряє, і пріоритет кожної проблеми.
     Для кожного кроку тест-кейсу, який тести не перевіряють або перевіряють слабко, додай у звіт окремий рядок:
     FLAG TC-NN step N: <причина>
     Тут TC-NN це ID тест-кейсу, а N це номер кроку. Один рядок FLAG називає тільки один крок.
     Діапазон або список кроків в одному рядку FLAG не допускається.
     ```
8. **After the fix.** The main session tags the fix commit and measures the fix folder: `run-mutants.mjs`, `run-flaky.mjs` and the judge.
9. **Audit of the tool calls.** It follows the audit and the fix, as in plan v2 item 1.5.
   No tool call goes to `sealed/`, `bench/results/`, `LOG.md`, `demo/` or other folders of `harness-demo-runs/`. No tool call of the auditor goes to `juice-shop/`.

### E5a: time of a person to accept a suite

| ID | Hypothesis | Metric | Support |
|---|---|---|---|
| H5a.1 | Arsen needs less time to make B-1 ready to merge than A-1 (condition `precise`, run 1). | review minutes and issues of severity `blocker` or `major`, from `bench/review-timer.mjs summary` | B minutes ≤ 0.8 × A minutes, and B issues ≤ A issues |
| H5a.2 | After the E4 fix, the client suite needs less review time than before. | the same | Exploratory. We report the numbers and give no support label |

- Arsen reviews copies without the harness files. `bench/prepare-review.mjs` makes the copies.
- Round 1: A-1 and B-1. `prepare-review.mjs` gives them the names `suite-1` and `suite-2` in a random order. Arsen reviews `suite-1` first.
- Round 2, after the E4 fix: the client suite before and after the fix, as `suite-3` and `suite-4`.
  The main session tells Arsen the order: the copy "after" first, then the copy "before".
  When the second review starts, Arsen knows most of its code from the first review. This makes the second review faster, so it works against H5a.2.
- Arsen can also see which copy of round 2 is "after": it has more checks, and it comes first. Thus round 2 is not blind, and H5a.2 is exploratory.
- The map of the names goes only to `bench/results/review-mapping.json`. Arsen does not open it before all reviews end.
- Arsen uses the checklist `bench/review-checklist.md` for each copy. We record the order of the reviews.
- We also report the fix minutes and the `git diff --shortstat` of each copy.
- n = 1 for each suite. The margin of 20 % is there because the timer has a noise of some minutes.

### E5b: a change of the UI

| ID | Hypothesis | Metric | Support |
|---|---|---|---|
| H5b.1 | Suite B has no more broken tests than suite A after the UI patches. | tests that pass on the clean build and fail after a UI patch, sum over all UI patches | broken(B) ≤ broken(A). We mark an equal result as "equal" |
| H5b.2 | The fix of suite B after the UI change makes no check weaker. It also makes no more checks weaker than the fix of suite A. | the checks that `weakening()` of the harness finds in the diff of the fix | weakening(B) = 0 and weakening(B) ≤ weakening(A) |

- Proposal: E5b uses suites A and B of `precise` run 1 (open question 6).
- The fix runs in a copy of the suite, outside the run folder. The run folders do not change.
- The fixer gets the standard message of `bench/prompt-repair.txt`.
- `bench/weakening.mjs` is the port of `weakening()` from the harness. We run it on the diffs of both fixes.
- We report the cost and the time of each fix.
- n = 1 for each suite and each UI patch.

The UI patch session:

- It is a separate session. It sees only `juice-shop/` and `test-cases/`. It does not see a suite, a review copy, `bench/results/`, `sealed/` or `LOG.md`.
  During the session, the folders of `harness-demo-runs/` have mode 000. An audit of the tool calls follows the session.
- It writes 3 to 5 patches. Plan v2 gives three kinds of patch: rename a button, change the structure of a form, move a step of the checkout.
  Each patch is of one of these kinds.
- The sha256 of `sealed-ui/` goes into `LOG.md` before any suite runs against a UI patch.
- At checkpoint 5, Arsen can reject a UI patch only for one of two reasons. The patch is not one of the three kinds. Or a person cannot do a step of TC-01 to TC-08 by hand on the patched app.
  He records the reason in `LOG.md`. He does not choose patches by the tests that they break.

## The judge

The judge grades each suite of each condition against the precise test cases (`test-cases-v1`), also the suites of `vague`.
The rubric `bench/judge.md` does not change. The judge sees the suites as `suite-1` and `suite-2`, as in stage 1.

The reasons:

1. The precise test cases define the right behavior of the shop. The vague test cases leave out the values, but the behavior stays the same. A test that does not compare a value lets a wrong value through, whatever test case its writer had.
2. The bug patches break the same behavior. One reference for all conditions makes the numbers of `precise`, `vague` and `haiku` comparable.
3. Suites A and B of one condition get the same reference. Thus the comparison of A and B stays fair.
4. The rubric gives `covered` only when the code checks "the value that the test case gives". With the vague test cases as the reference, a check that a total is visible would get `covered`. The judge would then grade the test case, not the test.

For a vague suite, we expect more steps `partial`. This is the effect that E2 measures.

## The client suite for E4

The plan text (plan v2, E4, step 1): take the weakest suite of E2 or E3 by the number of missed bugs.
If all suites are equally strong, take A-vague of run 1. A rule written in advance makes the choice.

The rule:

1. Candidates: each suite of the conditions `vague` and `haiku` that has all measurements (`run-mutants.mjs` and the judge).
2. Eligible candidates: the candidates whose tests all pass on the clean build, in the clean run and in the recheck runs of `run-mutants.mjs`.
   If no candidate is eligible, each candidate counts as an eligible candidate, and key 0 applies.
3. Plan rule for equal strength: when each eligible candidate misses 0 bugs, the client suite is A-vague run 1, if it is an eligible candidate. Else step 4 applies.
4. Sort the eligible candidates by the keys below. The first suite of the order is the client suite.

| Key | Order |
|---|---|
| 0 | Only when no candidate is eligible: fewer tests that fail on the clean build first |
| 1 | More missed bugs first, of 11 |
| 2 | Lower mutation score first, of 14 |
| 3 | More judge steps `partial` plus `missing` first |
| 4 | More judge steps `missing` first |
| 5 | Suite A before suite B |
| 6 | The condition `vague` before `haiku` |
| 7 | The lower run number first |

Keys 5 to 7 name each suite one time, so the order has no tie.

Who applies the rule, and when:

- Claude in the main session applies the rule after all measurements of E2 and E3 end, and before the audit starts.
- It writes the table of all candidates with their keys and the selected suite into `LOG.md`. Arsen checks the table.
- The auditor does not get the name of the suite or the reason for the choice (E4, inputs).

## The tamper list for the proxy

Source: only the expected results of TC-01 to TC-08 (`test-cases-v1`). Not the bug patches, not the code of the app.

The rule:

1. An expected result can name a value that the server sends. For each such value, a rule changes it in the JSON response that the page shows it from.
   The kinds: price, quantity, total, discount, balance, order status, email, item count, order ID, bonus points.
2. A value that the browser calculates gets no rule of its own. The rules on its inputs cover it.
   TC-07 says that the basket page and the order summary calculate the totals in the browser.
3. The proxy applies one rule in one suite run, with the scope `browser` (the default of `bench/tamper-proxy.mjs`).
   Only the responses to browser requests change. The API calls of the test preconditions get the true values (open question 5).
4. First, the suite runs through the proxy with no rule. Each test must pass (plan v2, section 9).
   If a test fails, `bench/run-audit-tamper.mjs` stops before the rules. Then the main session runs the same command again with a new `--out`, at most 3 times in total.
   If all 3 runs fail, the tamper part of the audit has no result for this suite. We record this in `LOG.md`. Nobody removes a test from the run.
5. `bench/run-audit-tamper.mjs` gives the verdict of each rule: `caught`, `survived`, `not exercised` or `invalid`. A failed test counts as a catch only when it passes each recheck run.
   An `invalid` rule runs again with `--only` and a new `--out`, at most 2 more times. After that, it has no verdict, and we record it.
6. Flags come from each pair of a rule and a test. The list `fired` of the JSON report names each test where the rule changed a response.
   When a rule fired in a test and the test passed, the audit flags the steps of that rule in the TC of that test.
   The TC of a test is its field `tc` in the report. A test with no TC gives no flag, and the report lists it.
   A rule that did not fire in a test gives no flag for the TC of that test. A failed test that did not pass the recheck gives no flag.
   Flags of different rules add up. A catch of one rule does not remove a flag of a different rule.
7. A rule can change a value that the browser then sends back to the server. Then a test can fail for a changed server state, not for a check.
   This can only hide a flag, because flags come only from tests that passed.
   When more than one response can be the source of a value, the binder binds each of them. Then a different rule on the same value can still give the flag.

The operator:

| Value type | Operator | Example |
|---|---|---|
| number | `add` 1 | `8.99` becomes `9.99`. `2` becomes `3` |
| number in a JSON string | `addNumberString` 1: add 1 to the decimal number in the string, and keep the number of decimals | `"8.99"` becomes `"9.99"`. `"2"` becomes `"3"` |
| string | `set` to a fixed text: `mut@example.test` for an email, `MUT` for all other strings | `tc01-x@example.test` becomes `mut@example.test` |

The reasons for "add 1":

- It changes each value that the page shows. Prices have two decimals, so a rounding step does not hide the change.
- The value stays valid: no negative number, no zero, no empty field. The page still works and the flow continues.
- Other operators are weaker here. "Multiply by 2" keeps 0 as 0. "Subtract 1" can make a negative value. "Add 0.01" can disappear in a rounded value.
- One fixed operator for all numbers means that nobody tunes it for a value.

The reasons for the string operator:

- The fixed text does not hold the old string. Thus a test that compares the full text or a part of the text fails.
- The operator `suffix` would keep the old string as a part. A check with `toContainText` would stay green, and the proxy would call a working check weak.
- An email keeps the form of an email.

### Candidate values for each test case step

The column "What" comes from the expected result of the step. The column "Rule" names the rule of the table "The rules" that covers the value.
The column "JSON field" comes from the binding before the freeze (see below). It stays "to complete" until then.
"browser (TC-07)" means that TC-07 says that the browser calculates the value. "unknown" means that the binding decides.

| TC | Step | What the expected result names | Value in v1 | Source | Rule | JSON field |
|---|---|---|---|---|---|---|
| TC-01 | 2 | error message | `Invalid email or password.` | unknown | T15 | to complete |
| TC-01 | 5 | email of the account in the menu | the email of the new account | server | T14 | to complete |
| TC-02 | 1 | price of the product in the list | `8.99¤` | server | T01 | to complete |
| TC-02 | 2 | basket counter, message | `1`, `Placed Eggfruit Juice (500ml) into basket.` | unknown | T03, T15 | to complete |
| TC-02 | 3 | quantity and price in the basket row | `1`, `8.99¤` | server | T03, T02 | to complete |
| TC-02 | 4 | basket total | `8.99¤` | browser (TC-07) | T02, T03 | none |
| TC-03 | 1 | quantities, basket total, counter | `1`, `1`, `13.98¤`, `2` | server, browser (TC-07), unknown | T03, T02 | to complete |
| TC-03 | 2 | quantity of A, total, counter | `2`, `18.97¤`, `3` | as step 1 | T03, T02 | to complete |
| TC-03 | 3 | quantity of A, total, counter | `1`, `13.98¤`, `2` | as step 1 | T03, T02 | to complete |
| TC-03 | 4 | quantity of A, total | `1`, `13.98¤` | as step 1 | T03, T02 | to complete |
| TC-03 | 5 | quantity of B, total, counter | `1`, `8.99¤`, `1` | as step 1 | T03, T02 | to complete |
| TC-04 | 1 | counter, message | `1`, `Placed Apple Juice (1000ml) into basket.` | unknown | T03, T15 | to complete |
| TC-04 | 2 | quantity, total | `5`, `9.95¤` | server, browser (TC-07) | T03, T02 | to complete |
| TC-04 | 3 | error message | `You can order only up to 5 items of this product.` | unknown | T15 | to complete |
| TC-04 | 4 | quantity, total, counter | `5`, `9.95¤`, `5` | server, browser (TC-07), unknown | T03, T02 | to complete |
| TC-04 | 5 | error message, counter | the message of step 3, `5` | unknown | T15, T03 | to complete |
| TC-05 | 2 | delivery prices | `0.99¤`, `0.50¤`, `0.00¤` | server | T04 | to complete |
| TC-05 | 4 | discount in the message | `10%` | server | T05, T15 | to complete |
| TC-05 | 5 | `Items`, `Delivery`, `Promotion`, `Total Price` | `17.98¤`, `0.99¤`, `1.80¤`, `17.17¤` | browser (TC-07) | T02, T03, T04, T05 | none |
| TC-06 | 3 | error message | `Invalid coupon.` | unknown | T15 | to complete |
| TC-06 | 4 | error message | `Invalid coupon.` | unknown | T15 | to complete |
| TC-06 | 5 | `Items`, `Delivery`, `Promotion`, `Total Price` | `17.98¤`, `0.99¤`, `0.00¤`, `18.97¤` | browser (TC-07) | T02, T03, T04 | none |
| TC-07 | 1 | counter | `3` | unknown | T03 | to complete |
| TC-07 | 2 | quantities, total | `2`, `1`, `20.97¤` | server, browser (TC-07) | T03, T02 | to complete |
| TC-07 | 5 | discount in the message | `10%` | server | T05, T15 | to complete |
| TC-07 | 6 | `Items`, `Delivery`, `Promotion`, `Total Price` | `20.97¤`, `0.99¤`, `2.10¤`, `19.86¤` | browser (TC-07) | T02, T03, T04, T05 | none |
| TC-07 | 7 | order ID in the route, message | `<order ID>`, `Thank you for your purchase!` | server, unknown | T15 (no rule for the ID) | to complete |
| TC-07 | 8 | quantities and the four lines of the saved order | `2`, `1`, `20.97¤`, `0.99¤`, `2.10¤`, `19.86¤` | server (TC-07) | T06, T07, T08 | to complete |
| TC-07 | 10 | order ID, total, quantities | the ID of step 7, `19.86¤`, `2`, `1` | server (TC-07) | T11, T09, T10 | to complete |
| TC-08 | 2 | wallet balance, amount on the button `Pay` | `5.00`, `8.99¤` | server, unknown | T13, T02, T03, T04 | to complete |
| TC-08 | 4 | message | `You have not placed any orders yet.` | unknown | T15 | to complete |
| TC-08 | 5 | wallet balance | `5.00` | server | T13 | to complete |
| TC-08 | 6 | wallet balance, amount on the button `Pay` | `8.99`, `8.99¤` | server, unknown | T13, T02, T03, T04 | to complete |
| TC-08 | 7 | payment method, total | `Digital Wallet`, `8.99¤` | unknown, browser (TC-07) | T16, T02, T03, T04 | to complete |
| TC-08 | 8 | message | `Thank you for your purchase!` | unknown | T15 | to complete |
| TC-08 | 9 | wallet balance | `1.00` | server | T13 | to complete |
| TC-08 | 10 | order total, bonus points | `8.99¤`, `1` | server | T09, T12 | to complete |

These steps name no value of the kinds of rule 1: TC-01 steps 1, 3 and 4. TC-05 steps 1 and 3. TC-06 steps 1 and 2. TC-07 steps 3, 4 and 9. TC-08 steps 1 and 3.
TC-05 steps 1 and 3 name the saved address and the saved card. The server sends them, but they are not of the kinds of rule 1 (see the table "Values with no rule").

### The rules

| Rule | Kind | The value that the rule changes | Test case steps |
|---|---|---|---|
| T01 | price | the price of a product in the product list | TC-02 step 1 |
| T02 | price | the price of a product in the basket | TC-02 steps 3, 4. TC-03 steps 1 to 5. TC-04 steps 2, 4. TC-05 step 5. TC-06 step 5. TC-07 steps 2, 6. TC-08 steps 2, 6, 7 |
| T03 | quantity, item count | the quantity of a basket item. It also covers the basket counter, if the browser calculates the counter from the quantities | TC-02 steps 2 to 4. TC-03 steps 1 to 5. TC-04 steps 1, 2, 4, 5. TC-05 step 5. TC-06 step 5. TC-07 steps 1, 2, 6. TC-08 steps 2, 6, 7 |
| T04 | price | the price of a delivery speed | TC-05 steps 2, 5. TC-06 step 5. TC-07 step 6. TC-08 steps 2, 6, 7 |
| T05 | discount | the discount percentage of a coupon | TC-05 steps 4, 5. TC-07 steps 5, 6 |
| T06 | total | the total price of the saved order, on the confirmation page | TC-07 step 8 |
| T07 | quantity | the quantity of a product in the saved order, on the confirmation page | TC-07 step 8 |
| T08 | price, discount | the lines `Items`, `Delivery` and `Promotion` of the saved order, on the confirmation page. One rule for each field that the binding finds | TC-07 step 8 |
| T09 | total | the total price of an order in the order history | TC-07 step 10. TC-08 step 10 |
| T10 | quantity | the quantity of a product in the order history | TC-07 step 10 |
| T11 | order ID | the order ID in the order history | TC-07 step 10 |
| T12 | bonus points | the bonus points of an order in the order history | TC-08 step 10 |
| T13 | balance | the wallet balance | TC-08 steps 2, 5, 6, 9 |
| T14 | email | the email of the customer in the session | TC-01 step 5 |
| T15 | message | a message text, only if the binding finds the text in a JSON field. One rule for each text | TC-01 step 2. TC-02 step 2. TC-04 steps 1, 3, 5. TC-05 step 4. TC-06 steps 3, 4. TC-07 steps 5, 7. TC-08 steps 4, 8 |
| T16 | payment method | the name of the payment method, only if the binding finds it in a JSON field | TC-08 step 7 |

Values with no rule:

| Value | Where | Reason |
|---|---|---|
| totals of the basket and of the order summary | TC-02 to TC-08 | The browser calculates them (TC-07). The rules on their inputs cover them. |
| the basket counter `0`, the promotion `0.00¤` | TC-02 step 1, TC-06 step 5, TC-07 step 9 | No server value exists to change: the basket is empty, or no coupon applies. |
| the order ID in the route | TC-07 step 7 | The page loads the order with this ID. A change can break that request, and then a red test shows a broken page, not a check. T11 covers the order ID. |
| product names | all test cases | They are test data, not results. Tests use them to find rows, so a red test would not show a check of a value. |
| the saved address and the saved card | TC-05 steps 1, 3. TC-07 step 6 | The server sends them, and `README.md` gives their values. But they are not of the kinds of rule 1. Those kinds come from plan v2, E4 (open question 5). |
| an order status | none | No expected result of TC-01 to TC-08 names an order status. |
| page titles and button names | all test cases | They are texts of the page, not data that the server sends. |

### Binding the rules to JSON fields, before the freeze

The rules above name values in plain words. A binding gives each rule a request path and a JSON field.
The main session knows the bug patches, so it does not make the binding. A blind session makes it by this procedure:

1. **Capture.** The main session runs suites A and B of `set-1/run-1` through the proxy with no rule (decision 11).
   Each suite run has `--workers=1` and the json reporter. The proxy option `--capture <jsonl file>` records the bodies. Each suite gets its own capture file, outside `harness-demo-runs/`.
   A capture line has the time, but not the test. Thus a script of the main session adds the test and its TC to each line.
   It uses the method of `bench/run-audit-tamper.mjs`. The window of a test starts at its start time in the Playwright report of the same run.
   The window ends at the start time of the next test, and the last window has no end. A line goes to the test whose window holds its time.
   After the script, each line is for one response to a browser request. It holds the time, the test, the TC, the method, the path, the status and the JSON body.
   The run folders do not change. The main session makes no choice in this step. It records the sha256 of each capture file, before and after the script, in `LOG.md`.
2. **Binder.** A separate session, through `bench/claude-locked.sh`, in a new folder inside `harness-demo-runs/` with a neutral name. The model is `claude-opus-5-5`, with `--max-budget-usd 5` (decision 11). Its folder holds only:
   - `test-cases/` from the tag `test-cases-v1`
   - the operator table, the table of candidate values and the table "The rules" of this file
   - the capture files with the tests, from step 1
   - `bench/tamper-rules.example.json`, for the format
   - `bench/check-tamper-rules.mjs` as `check-tamper-rules.mjs`, the check of step 4. The binder runs it in its folder until it passes.
     Its mode `--fields` lists the paths and the fields of the capture, because `Read` cuts long JSON lines.
   `bench/make-binder-folder.sh` makes the folder and prints the sha256 of each file.
3. **Binding.** The binder works on each rule T01 to T16. It gives each pair of a path and a field where the capture holds the value of the rule.
   It binds the response that the page of the rule's steps shows the value from. When more than one response can be the source, it binds each of them.
   When no JSON field holds the value, it writes "no JSON field", and the rule has no run.
   The operator comes from the operator table, by the type of the value in the capture. The id of a bound rule is the rule ID with a letter, for example `T02-a`.
4. **Check.** A script of the main session checks the rules file. Each bound field must exist in a captured browser response that matches the path.
   When the rows of the rule give a literal value, the field must hold one of these values in the capture.
   Each rule T01 to T16 must have a binding or "no JSON field". The operators must follow the operator table.
   The binder runs the check in its folder. After the session, the main session runs the same check again in the lab, on the same files.
   If that check fails, the same binder session continues, with the check output as the only new input.
5. **Audit of the tool calls** of the binder, as in plan v2 item 1.5. The main session records it in `LOG.md`.
6. **Approval.** Arsen looks at the list at checkpoint 3. He cannot add, remove or change a bound rule.
   He can reject the full list only for a failed check or a broken format. Then the binder runs again.
7. **Freeze.** The sha256 of the rules file goes into `LOG.md`. The list freezes with this file.

## Measures of the audit

Terms:

- **Missed bug:** a realistic bug that the client suite does not catch before the fix, by the stage 1 rule.
- **Missed patch:** a missed bug or a missed operator mutant.
- **Target step:** the test case step that a patch breaks. It comes from the column of the expected test case step in `sealed/mutants.md`. The sealed session wrote that column before any suite existed.
- **Flag:** one test case step that the audit names as weak or not checked. The flags are the union of two lists:
  - the tamper flags of rule 6 of the tamper list, made by a script from the JSON report of `bench/run-audit-tamper.mjs`
  - the lines `FLAG TC-NN step N: <reason>` of `audit-report.md`
  
  Two flags on one step count as one flag.
- **Order of the work.** First, the main session records the sha256 of `audit-report.md` and of the tamper report in `LOG.md`.
  Then a script makes the flag list, and its sha256 goes into `LOG.md`. Only then does anyone read the target steps for this comparison.

Recall, two options:

| Option | Definition | Note |
|---|---|---|
| R1, recommended | missed bugs with a flag on a target step, divided by all missed bugs | It shows that the audit names the place of the problem. |
| R2 | missed bugs with a flag on any step of the target test case, divided by all missed bugs | With 8 test cases, an audit that flags each test case gets R2 = 1. Thus R2 alone is weak. |

- When the column names more than one step for a patch, a flag on one of them counts.
- When the column names a test case but no step, the bug counts as "not flagged" in R1. It stays in the R1 denominator. R2 uses its test case.

Precision. A flag can name a real weak check that no patch hits. Such a flag is not a false alarm in the plain sense, because the 14 patches are only a sample of possible bugs.
Each flag gets one of three classes:

- **Hit:** the step is a target step of a missed patch.
- **Weak by the judge:** not a hit, but the blind judge gave the step `partial` or `missing` for the client suite.
- **Other:** all other flags.

| Option | Precision | Note |
|---|---|---|
| P1, recommended, tests H4.2 | hits divided by all flags | Each flag stays in the denominator. A long list of flags lowers it. |
| P2 | (hits plus weak by the judge) divided by all flags | Not independent: the reviewer of the audit compares tests with test cases, which is the task of the judge, with the same model. |
| P3 | as P2, plus steps where a tamper rule or an expectation mutant survived | Not recommended: the audit then grades itself with its own tools. |

Recommendation: R1 and P1 test H4.1 and H4.2. R2, P2 and the three counts of the classes stand in the same table. All numbers in one table prevent a choice after the result.
The reasons:

- P1 is the plan's measure: the share of flags that match a missed patch.
- P1 punishes the audit for the limits of 14 patches. The count "weak by the judge" shows how many other flags point to real weak checks.
- P2 can be high for any audit. For a vague client suite, the judge gives many steps `partial`.
  The reviewer of the audit can find the same steps by the same method.

## What we publish

- All results of all conditions and runs. This includes a small difference, a better suite A and a hypothesis with no support.
- n and the spread for each group: the value of each run, the mean, the min and the max. E4, E5a and E5b are single cases with n = 1.
- The order of the freezes of stage 2, with each tag, sha256, date and time. The order is:
  the vague test cases, the tamper list and the client suite rule, this file, the generation of E2 and E3.
  Then `sealed-ui/`, the audit, the fix and the measurements.
- The bug patches, the UI patches, the tamper list, the capture hashes and the audit report.
- The offer sentence (plan v2, section 8) uses only measured numbers of E4 and E5a.
  If the audit flagged no missed bug, or the fix did not lower the missed bugs, the sentence does not claim it.
  For E2 and E3, the offer claims an effect only on "strong support".
- If all suites are strong (a ceiling), we write it: on precise test cases, a strong model writes strong tests. Then we offer the audit of the test cases (plan v2, section 9).
- The README lists the limits:
  - Arsen knows the test cases and the harness. His review in E5a is not blind. Round 2 of E5a is open, and the order of the reviews can change the minutes.
  - One app, 8 test cases, 14 bug patches, 3 to 5 UI patches.
  - n = 3 for each condition. n = 1 for E4, E5a and E5b.
  - The n = 3 labels of the stage 1 hypotheses are post hoc. Arsen did not approve the section "How we read n = 3" before the measurements of the precise runs 2 and 3.
  - For the suites of Opus, the judge and the writer are the same model. The reviewer of the audit and the judge do the same task with the same model.
  - In B-haiku, the reviewer `spec-reviewer` runs on Sonnet, a stronger model than the writer.
  - A mechanical rule made the vague test cases (`bench/vague-rule.md`). They are not real Jira tickets. Their test data keeps only the inputs (decision 6).
    Some exact values, or a way to get them, stay in the vague set (section 9 of the rule):
    - The step column stays word for word. TC-04 step 2 gives the purchase limit. TC-08 steps 3 and 7 give the order total on the button `Pay 8.99¤`.
    - `README.md` stays word for word. The part `<NN>` of a coupon code gives the discount, and its examples give a coupon with a 10% discount.
    - The text before the preconditions and the preconditions stay word for word (decision 8). In TC-08, they keep the calculation of the bonus points and the balance of a new account. In TC-05, they tell which part of the order gets the discount.
    - In TC-08, the first balance stays as an input (decision 7). The first balance plus the top-up give the order total.
      From it, an agent can find the price of `Eggfruit Juice (500ml)`, and then some expected values of TC-02, TC-03, TC-05 and TC-06. Arsen accepted this leak as a limit (decision 9).
    - The generation agent sees the running app through Playwright MCP and can read each price there.
    - The meaning of a message (rule M) is the free part of the rule. Two people can choose different words.
    - The checks of the rule cannot find each wrong change. Rule D finds nouns and action sentences with short word lists, so a rare form can get the wrong class. Arsen reads each changed cell at checkpoint 2.
  - The client suite of E4 is the weakest of up to 12 candidates, by a rule that uses the bug patches. Its "before" number is low on purpose, and the same patches give the score of the audit. The gain before and after does not carry over to a typical suite.
  - The tamper list covers only the values that the test cases name.
  - The lint rules of B forbid some patterns that `weakening()` finds, for example `waitForTimeout`. Thus a part of the result of B in H5b.2 can come from its lint.
  - This is a demonstration, not a study.

## Open questions for Arsen

1. **Freeze point.** Proposal: freeze this file before the first run of `vague` or `haiku`.
2. **Thresholds.** 0.5 for R1 and P1 in H4.1 and H4.2. The margin of 20 % in H5a.1.
3. **Measures of the audit.** R1 and P1 test the hypotheses, and R2, P2 and the class counts stand in the same table (recommendation). Or other options?
4. **The client suite.** Do you agree with each item?
   - "Equally strong" means that each eligible candidate misses 0 bugs.
   - A candidate is eligible only when all its tests pass on the clean build.
   - B suites are candidates too.
   - The auditor gets a copy without the harness files, and the test case set of the client suite's condition.
5. **The tamper list.** Do you agree with each item?
   - A message text gets a rule only when the server sends it in JSON.
   - The saved address, the saved card and the payment method name stay out, unless the binding finds the payment method in JSON. Or add string rules for the address and the card?
   - Strings get `set` to a fixed text, not `suffix`. A number in a string gets `addNumberString` 1: add 1, and keep the decimals.
   - The scope is `browser`, so the test preconditions get true values. With the scope `all`, a test that takes its expected value from the API stays green and counts as weak.
6. **E5b suites.** A and B of `precise` run 1?
7. **Models and caps.** `claude-opus-5-5` for the auditor and the fixers? The proposed caps in the freeze table?
8. **Judge.** Opus for all conditions, as in stage 1? An extra judge run against the vague test cases, for information only? The stage 1 judge cost about 1.3 USD (plan v2, section 6).
9. **Stopped runs.** Do you agree with the list of outside causes?
10. **E5a.** Does `bench/review-checklist.md` freeze with this file? Do you agree that round 2 goes "after" first, and that H5a.2 is exploratory?
11. **E4 fix.** Do you agree with the harness port for a client suite A (inputs, item 6)?
12. **E4 auditor.** Do you approve the prompt of the auditor and the prompt of the fixer (inputs, item 7)? Both freeze with this file.
    Do you agree with the cleaned tool reports (inputs, item 2)? The auditor lock must also hide `LAB/juice-shop/`, but `bench/claude-locked.sh` has no option for this yet. Do you agree that the script gets this option?
