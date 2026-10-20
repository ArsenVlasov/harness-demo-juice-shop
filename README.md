# Harness demo lab: OWASP Juice Shop

This lab compares two Playwright test suites that one AI agent wrote from the same 8 test cases.
The agent wrote suite A with a plain prompt. It wrote suite B with the same prompt, in a project with an agent harness.
Then the lab adds 14 bug patches to the app and measures which suite catches them.
It also measures flaky tests, the coverage of the test cases and the cost.

This is the working lab, not the public repository. Arsen owns the experiment. The rules for each session are in `CLAUDE.md`.

## Status

- Run 1 of each suite is done and measured.
- Runs 2 and 3 come after 22.10. `bench/run-generation.sh` is ready for them.
- The Ukrainian README for the public repository is a draft in the vault: `aqa-harness-integration/demo/juice-shop-readme-draft.md`.
- Nothing is published. Publication is checkpoint 5 in `CLAUDE.md`.

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
    test-cases/              the master copy of TC-01 to TC-08
    bench/                   the scripts, the judge rubric, the prompt and results/
    juice-shop/              Juice Shop v20.3.0, built from source (not in git)
    sealed/                  the bug patches (not in git until the measurements end)
  harness-demo-runs/
    suite-a/                 suite A, a separate git repository
    suite-b/                 suite B with the harness, a separate git repository
```

## Commands

Use Node 24.21.0 from `~/.local/node-v24.21.0`. Run the measurements one after the other, because they use the same app on port 3000.

| Command | What it does |
|---|---|
| `bench/start-app.sh start` | Builds the server, starts the app in quiet mode and waits for HTTP 200 |
| `bench/run-generation.sh A 1` | One generation run of suite A with `claude -p`. It costs money |
| `node bench/run-mutants.mjs` | Runs both suites on the clean build and on each patch |
| `node bench/run-flaky.mjs` | Runs each test 20 times on the clean build |
| `node bench/run-judge.mjs --model claude-opus-5-5 --budget 10` | Runs the blind judge on both suites. It costs money |
| `node bench/collect-metrics.mjs` | Writes `bench/results/summary.md` and `summary.csv` |

## Limits

- One app, 8 test cases, 14 patches, one generation run for each suite, one model.
- The Mac slept for 8.9 hours during the generation of suite B. The work time of B does not include the sleep.
- The judge is the same model as the writer of the tests.
