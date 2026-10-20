# Harness demo lab: OWASP Juice Shop

This lab compares two Playwright test suites that one AI agent wrote from the same 8 test cases.
The agent wrote suite A with a plain prompt. It wrote suite B with the same prompt, in a project with an agent harness.
Then the lab adds 14 bug patches to the app and measures which suite catches them.
It also measures flaky tests, the coverage of the test cases and the cost.

This is the working lab, not the public repository. Arsen owns the experiment. The rules for each session are in `CLAUDE.md`.

## Status

- Runs 1, 2 and 3 of each suite on the precise test cases are done and measured (n = 3).
- Stage 2 started on 20.10. Its plan is `aqa-harness-integration/demo/demo-plan-v2-juice-shop.md` in the vault.
  The next steps are the vague test cases (E2) and the Haiku runs (E3). The rule for the vague set waits for checkpoint 2.
- The Ukrainian README for the public repository is a draft in the vault: `aqa-harness-integration/demo/juice-shop-readme-draft.md`.
- Nothing is published. Publication is checkpoint 5 in `CLAUDE.md`.

## Results of runs 1 to 3, precise test cases

Source: `bench/results/aggregate-precise.md`. Values for runs 1, 2 and 3.

| Metric | A (no harness) | B (harness) |
|---|---|---|
| Realistic bugs missed, of 11 | 0 / 0 / 0 | 0 / 0 / 4 |
| Mutation score, of 14 | 14 / 14 / 14 | 14 / 14 / 10 |
| Flaky tests in 20 runs | 1 / 0 / 0 | 0 / 0 / 2 |
| Blind judge: steps partial, of 49 | 2 / 0 / 3 | 0 / 1 / 0 |
| Generation cost for each test case, USD | 0.34 / 0.26 / 0.26 | 1.01 / 0.86 / 0.81 |
| Work time for each test case, min | 1.5 / 1.3 / 1.4 | 2.9 / 2.3 / 2.8 |

- In run 3, the TC-07 test of B failed on each of the 4 missed patches. It also failed one recheck run on the clean build, so the pre-registered rule does not count these catches.
  The failure is a timing failure right after an app start: the product list was not visible in time.
- No step was `missing` for the judge in any run.

## Results of run 1

Source: `bench/results/summary.md`. The model `claude-opus-5-5` wrote both suites.

| Metric | A (no harness) | B (harness) |
|---|---|---|
| Realistic bugs missed | 0 of 11 | 0 of 11 |
| Mutation score (bugs and operator mutants) | 14 of 14 | 14 of 14 |
| Flaky tests in 20 runs | 1 of 8 | 0 of 8 |
| Blind judge: steps covered / partial / missing | 47 / 2 / 0 of 49 | 49 / 0 / 0 of 49 |
| Generation cost for each test case | 0.34 USD | 1.01 USD |
| Work time for each test case | 1.5 min | 2.9 min |

- Both suites caught each patch with the test case that the patch targets.
- The flaky test of A failed once because the server closed the connection (`ECONNRESET`) during an API precondition. It is not a wrong check.
- `bench/hypotheses.md` holds the pre-registered hypotheses. `LOG.md` (entry 2026-10-20, 10:40) gives the result for each hypothesis.

## Order of the freezes

Each step is a commit or a tag. `LOG.md` holds the sha256 and the time of each step.

| Step | Where | When |
|---|---|---|
| Test cases | tag `test-cases-v1` in this repository | 19.10, 22:52 |
| Harness | tag `harness-v1` in `suite-b` | 19.10, 23:33 |
| Bug patches | `sealed/sealed.tar`, not in git | 20.10, 00:05 |
| Pre-registration | `bench/hypotheses.md`, commit `f2ad506` | 20.10, 00:10 |
| Generation run 1 | tag `gen-1` in `suite-a` and `suite-b` | 20.10, from 00:13 |

After the generation, nobody changes the test code in the suites.

## Layout

```
WorkFolder/
  harness-demo-juice-shop/   this lab
    README.md                this file
    CLAUDE.md                the rules of the experiment
    LOG.md                   the experiment log, the newest entry at the top
    test-cases/              the master copy of TC-01 to TC-08 (the precise set)
    bench/                   the scripts, the judge rubric, the prompt, conditions.json and results/
    juice-shop/              Juice Shop v20.3.0, built from source (not in git)
    sealed/                  the bug patches (not in git until the measurements end)
  harness-demo-runs/
    templates/               the start state of a generation run, one bare git repository for each suite and set
    set-<k>/run-<n>/suite-a/ suite A of run n, a separate git repository
    set-<k>/run-<n>/suite-b/ suite B of run n, with the harness, a separate git repository
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

The E4 and E5 scripts (`tamper-proxy.mjs`, `run-audit-tamper.mjs`, `run-audit-mutate.mjs`, `run-ui-change.mjs`, `prepare-review.mjs`, `review-timer.mjs`) have their usage in their header comments.

## Limits

- One app, 8 test cases, 14 patches, one generation run for each suite, one model.
- The judge is the same model as the writer of the tests.
