# Harness demo lab: OWASP Juice Shop

This lab compares two Playwright test suites that one AI agent wrote from the same 8 test cases.
The agent wrote suite A with a plain prompt. It wrote suite B with the same prompt, in a project with an agent harness.
Then the lab adds 14 bug patches to the app and measures which suite catches them.
It also measures flaky tests, the coverage of the test cases and the cost.
Stage 2 adds vague test cases, a weaker writer model, an audit of a ready suite and a change of the UI.

This is the working lab, not a published report. Arsen owns the experiment. The rules for each session are in `CLAUDE.md`.
This is a demonstration, not a study.

## Status

- The measurements of stage 1 and stage 2 are done. The full summary is `bench/results/summary-stage2.md`.
- Conditions `precise`, `vague` and `haiku`: 3 runs of each suite (n = 3). E4 and E5b: n = 1. E5a did not run (decision 23).
- Decision 25 gives the judge result of H2.3 in two forms: the frozen form and a post hoc sensitivity check. The offer uses only the post hoc conservative form.
- The plan of stage 2 is `aqa-harness-integration/demo/demo-plan-v2-juice-shop.md` in the vault. Section 10 of the plan holds the decisions of Arsen.
- The vault holds 2 Ukrainian drafts: `demo/demo-block-v2-draft.md` (the block "Демо") and `demo/video-outline-v2.md` (the video). Nobody sent them.
- The git remote `origin` on GitHub is public. The main session pushes `main` only on a request of Arsen. The last push was on 22.10 (`LOG.md`, entry 00:26).
- The client document, the public README and the video wait for checkpoint 6 of the stage 2 plan.

## Results for each condition

Sources: `bench/results/aggregate-precise.md`, `aggregate-vague.md`, `aggregate-haiku.md`. The values are runs 1, 2 and 3.

| Metric | precise A | precise B | vague A | vague B | haiku A | haiku B |
|---|---|---|---|---|---|---|
| Writer model | Opus | Opus | Opus | Opus | Haiku | Haiku |
| Test cases | precise | precise | vague | vague | precise | precise |
| Realistic bugs missed, of 11 | 0 / 0 / 0 | 0 / 0 / 4 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 4 | 0 / 0 / 0 |
| Mutation score, of 14 | 14 / 14 / 14 | 14 / 14 / 10 | 14 / 14 / 14 | 14 / 14 / 14 | 14 / 14 / 10 | 14 / 14 / 14 |
| Flaky tests in 20 runs | 1 / 0 / 0 | 0 / 0 / 2 | 0 / 0 / 2 | 0 / 0 / 0 | 0 / 0 / 1 | 0 / 0 / 0 |
| Judge steps `partial`, of 49 | 2 / 0 / 3 | 0 / 1 / 0 | 2 / 21 / 18 | 0 / 0 / 0 | 9 / 3 / 7 | 5 / 3 / 1 |
| Judge steps `missing`, of 49 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 7 / 0 / 0 | 0 / 0 / 0 |
| Cost for each test case, USD, mean (min to max) | 0.29 (0.26 to 0.34) | 0.89 (0.81 to 1.01) | 0.32 (0.31 to 0.33) | 0.98 (0.84 to 1.06) | 0.09 (0.07 to 0.1) | 0.32 (0.2 to 0.53) |
| Work time for each test case, min, mean (min to max) | 1.4 (1.3 to 1.5) | 2.67 (2.3 to 2.9) | 1.37 (1.3 to 1.4) | 3.07 (2.2 to 3.5) | 3.23 (1.9 to 5.2) | 3.27 (3 to 3.5) |

- Precise B-3 and haiku A-3 each miss 4 bugs. In both suites, a TC-07 test failed a recheck run on the clean build. A missing check is not the cause.
- The judge result of H2.3 (vague) in two forms (decision 25):
  - Frozen, the result of record. Steps `partial`: A 2 / 21 / 18 against B 0 / 0 / 0. Label: strong support.
  - Post hoc sensitivity check. It leaves out each A step whose note names only a helper or a calculated value. A 2 / 4 / 1 against B 0 / 0 / 0. The offer uses only this form.

## Results of the experiments of stage 2

The labels follow `bench/hypotheses-v2.md` at the tag `hypotheses-v2`. Section numbers point to `bench/results/summary-stage2.md`.

| Experiment | Main result | Label |
|---|---|---|
| E2, vague test cases (section 2) | All 6 vague suites miss 0 bugs. Judge steps `partial`: A 2 / 21 / 18, B 0 / 0 / 0 | H2.3, judge metric: strong support. H2.3, missed bugs: ceiling. H2.1: ceiling and direction only. H2.2: opposite direction |
| E3, Haiku as the writer (section 3) | Missed bugs A 0 / 0 / 4, B 0 / 0 / 0. Judge gap larger with Haiku | H3.1, H3.2 and H3.3: direction only |
| E4, audit and fix of vague A-1 (section 4) | 0 of 11 missed before and after the fix. Audit: 1.18 USD, 31.2 min. Fix: 2.22 USD | H4.1 and H4.2: not tested. H4.3: no change |
| E4, haiku A-3 (section 4) | 4 of 11 missed before, 0 after, from a stable step 1, not from new checks. R1 4 of 4, P1 2 of 8. Audit: 1.54 USD, 36.6 min | exploratory, no label |
| Decision 19, vague A-2 and B-2 (section 5) | Tamper 20 caught and 2 survived in both. The judge applies its rule on calculated values differently to A and B | exploratory, no label |
| E5a, review time (section 6) | Did not run. The estimate of Arsen is 1 to 2 hours for each suite, not measured | H5a.1 and H5a.2: not tested |
| E5b, change of the UI (section 7) | 6 broken tests in A and in B. `weakening()`: 0 and 0. A changed 6 test-case files. B asked if the coupon move is a bug | H5b.1: support, "equal". H5b.2: support. The behavior difference: exploratory, n = 1 |

Section 9 of the summary has the table "What the data supports". Section 10 has the ROI scenario. The scenario is not a measurement.

## Order of the freezes

Each step is a commit, a tag or a sha256. `LOG.md` holds the proof of each step.

| Step | Where | When |
|---|---|---|
| Test cases | tag `test-cases-v1` in this repository | 19.10, 22:52 |
| Harness | tag `harness-v1` in `suite-b` | 19.10, 23:33 |
| Bug patches | `sealed/sealed.tar`, not in git, sha256 `2a2dcc7d...` | 20.10, 00:05 |
| Pre-registration of stage 1 | `bench/hypotheses.md`, commit `f2ad506` | 20.10, 00:10 |
| Generation run 1 | tag `gen-1` in `suite-a` and `suite-b` | 20.10, from 00:13 |
| Vague test cases | tag `test-cases-v2-vague`, folder hash `cf554b7f...` | 20.10, 19:17 |
| Tamper list | `bench/tamper-rules.json`, sha256 `ebca83b3...` | 20.10, 19:19 |
| Pre-registration of stage 2 | `bench/hypotheses-v2.md`, tag `hypotheses-v2`, sha256 `b37745fa...` | 20.10, 19:19 |
| Generation of E2 and E3 | tags `gen-<n>` in the run folders of `set-2` and `set-3` | 20.10, from 19:22 |
| E4 tools, audit, fix and measurements | `desk-p`, `desk-r` (audit), tag `fixed` in `desk-q` and `desk-s` | 21.10, 13:46 to 17:32 |
| UI patches | `sealed-ui/sealed-ui.tar`, not in git, sha256 `459ff745...` | 21.10, 19:50 |
| E5b runs and fixes | `harness-demo-runs/maintenance/ui-change-together/` | 21.10, 22:26 to 22:53 |

- The plan puts `sealed-ui/` before the E4 audit. The UI patch session ran after E4. E4 does not use the UI patches, and the UI patch session could not read the run folders.

After each generation, nobody changes the test code in the run folders.

## Layout

```
WorkFolder/
  harness-demo-juice-shop/   this lab
    README.md                this file
    CLAUDE.md                the rules of the experiment
    LOG.md                   the experiment log, the newest entry at the top
    test-cases/              the master copy of TC-01 to TC-08 (the precise set)
    test-cases-vague/        the vague set (tag test-cases-v2-vague)
    bench/                   the scripts, the judge rubric, the prompts, conditions.json and results/
    juice-shop/              Juice Shop v20.3.0, built from source (not in git)
    sealed/                  the bug patches (not in git until the measurements end)
    sealed-ui/               the UI patches of E5b (not in git)
  harness-demo-runs/
    templates/               the start state of a generation run, one bare git repository for each suite and set
    set-<k>/run-<n>/suite-a/ suite A of run n, a separate git repository
    set-<k>/run-<n>/suite-b/ suite B of run n, with the harness, a separate git repository
    desk-<p|q|r|s>/          the E4 folders: the auditor folders (p, r) and the fix folders (q, s)
    maintenance/             the E5b fix copies
    review/                  the blind review copies of E5a
```

`bench/conditions.json` maps the conditions to the folders:

- `set-1`: the precise test cases with Opus.
- `set-2`: the vague test cases with Opus.
- `set-3`: the precise test cases with Haiku.

Run 1 of stage 1 is in `set-1/run-1/`.

## Commands

Use Node 24.21.0 from `~/.local/node-v24.21.0`. Run the measurements one after the other, because they use the same app on port 3000.
`<c>` is a condition of `bench/conditions.json`: `precise`, `vague` or `haiku`. `<n>` is the run number.

| Command | What it does |
|---|---|
| `bench/start-app.sh start` | Builds the server, starts the app in quiet mode and waits for HTTP 200 |
| `bench/run-generation.sh <c> A <n>` | One generation run of suite A in a new run folder, with the lock. It costs money |
| `bench/finish-run.sh <c> A <n> clean` | Runs the suite once on a clean app |
| `bench/finish-run.sh <c> A <n> commit` | Commits the run folder as the agent left it, with the tag `gen-<n>` |
| `bench/run-chain.sh <c> <n>...` | All of the above for A and B, then the measurements. It costs money |
| `node bench/audit-tool-calls.mjs --cond <c> --run <n>` | Checks the tool calls of the generation sessions for paths outside the run folder |
| `node bench/run-mutants.mjs --cond <c> --run <n>` | Runs both suites on the clean build and on each patch |
| `node bench/run-flaky.mjs --cond <c> --run <n>` | Runs each test 20 times on the clean build |
| `node bench/run-judge.mjs --cond <c> --run <n> --model claude-opus-5-5 --budget 10` | Runs the blind judge on both suites. It costs money |
| `node bench/collect-metrics.mjs --cond <c> --run <n>` | Writes `bench/results/summary-<c>-<n>.md` and `.csv` (`summary` for run 1) |
| `node bench/aggregate-runs.mjs --cond <c> --runs 1,2,3` | Writes the mean, the min and the max over the runs |

The E4 and E5 scripts (`tamper-proxy.mjs`, `run-audit-tamper.mjs`, `run-audit-mutate.mjs`, `e4-prepare.mjs`, `run-ui-change.mjs`, `prepare-review.mjs`, `review-timer.mjs`) have their usage in their header comments.

## Limits

- This is a demonstration, not a study. One app, 8 test cases, 14 bug patches, 4 UI patches.
- n = 3 for each condition. n = 1 for E4 and E5b. E5a did not run.
- For the suites of Opus, the judge is the same model as the writer. The auditor and the judge do the same task with the same model.
- The judge applies its rule on calculated values differently to A and B (decision 19). B also calculates totals with helpers from constants, and the judge gave these steps of B `covered`.
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
