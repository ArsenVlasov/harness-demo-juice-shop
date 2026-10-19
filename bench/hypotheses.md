# Pre-registration: hypotheses and publication rules

This file is step 5 of section 5 of the plan.
We wrote it after the freeze of the bug patches (`sealed/`) and before the generation of suites A and B.
After the generation starts, nobody changes this file. Later notes go into `LOG.md`.

## What we froze before the generation

| Item | Value |
|---|---|
| Test cases | TC-01 to TC-08, tag `test-cases-v1` in the lab |
| Harness | tag `harness-v1` in `suite-b/` |
| Bug patches | 14 patches in `sealed/sealed.tar`: 11 realistic bugs and 3 operator mutants. The sha256 is in `LOG.md` |
| Model | `claude-opus-5-5` for A and B. The harness reviewer `spec-reviewer` uses Sonnet |
| Claude Code | 2.1.299 from `~/.local/claude-code-2.1.299` |
| Runs | 1 generation run for each suite before 22.10. Runs 2 and 3 come later |
| Budget | `--max-budget-usd 40` for each generation run |
| Follow-up message | at most one, the standard text from section 5 of the plan, the same for A and B |

## Hypotheses

Each hypothesis names its metric. Section 6 of the plan defines each metric.

1. **Caught bugs.** Suite B misses fewer of the 11 realistic bugs than suite A.
   A suite catches a bug when at least one test fails on the build with the bug.
   The same test must pass on the clean build.
   A test that catches a bug must pass 3 more runs on the clean build. Else the catch does not count.
2. **Mutation score.** Suite B catches more of all 14 patches than suite A.
3. **Flaky tests.** Suite B has fewer flaky tests than suite A in 20 runs on the clean build (`--repeat-each=20 --retries=0`).
   A flaky test passes in some runs and fails in other runs. A test that fails in all runs counts as broken, not as flaky.
4. **Coverage of the test cases.** The blind judge marks fewer expected results as `missing` in suite B than in suite A.
5. **Cost.** Suite B takes more time and costs more for each test case than suite A.

We do not expect a difference in the number of tests or lines. We report these numbers for information only.
The rule lint of the harness is the opinion of the harness. We do not use it to grade suite A.

## What we publish

- We publish all results, for each run, also when the difference is small or when suite A is better.
- We show all runs, not the best run. We show n, the number of runs.
- We publish the patches, the sha256 values and the order of the freezes: test cases, harness, patches, this file, generation.
- If suite A catches as many bugs as suite B, or more, the offer sentence does not claim that the harness catches more bugs.
  It then names only the metrics where a difference exists, for example flaky tests or coverage.
- The README lists the limits: one demo app, 8 test cases, 14 patches, few runs, one model. This is a demonstration, not a study.
