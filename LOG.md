# Experiment log

The newest entry is at the top.
For each freeze, record the tag, the sha256, the date and the time.
For each measurement, record the command and its real result.

---

## 2026-10-20, 11:40: the pause in run B-1 removed from the README and the summary

Start from: the "Start from" line of the entry of 11:30.

- At 11:38, Arsen decided that the README and the summary must not name the pause in run B-1. This is a human intervention. Section 12 of the plan, item 19, has this decision. It changes the second part of item 17.
- Removed: the line in the limits of `README.md` and the line in the limits of the README draft `demo/juice-shop-readme-draft.md`.
  Also removed: the row of the pause in `bench/results/summary.{md,csv}`.
- `bench/collect-metrics.mjs` no longer writes that row. It still leaves gaps of more than 10 minutes out of the work time. The comment in `bench/run-generation.sh` no longer names run B-1.
- `node bench/collect-metrics.mjs`, then `diff` with the old `summary.md`: only the time stamp and the removed row are different. All other numbers are the same.
- The older entries of this log stay as they are. They are the record of the experiment.

## 2026-10-20, 11:37: unneeded files removed, lab README added

Start from: the "Start from" line of the entry of 11:30.

- Arsen chose the files to remove and the form of the README at 11:33. This is a human intervention.
- Removed from the lab, 35 paths with `git rm`. They stay in the git history at commit `ab3230a`:
  - The outputs of the script tests: `bench/results/*-try*` (22 files).
  - The outputs of the check runs of `run-generation.sh`: `bench/results/gen-A-0-check*` (10 files).
  - The failed dry-run tries: `bench/results/dry-run-B-0-auth-401.json` and `dry-run-B-0-cli-too-old.json`. The dry run `dry-run-B-1.*` stays, because it is the proof for `harness-v1`.
  - `KICKOFF.md`: the instructions of the first session. All its steps are done.
- Removed from disk: `start-claude.command`, the launcher of the first session. It was not in git.
- The older entries of this log name some of the removed files. To read such a file, use `git show ab3230a:<path>`.
- `CLAUDE.md`: the layout and the list of tracked files now name `README.md`, not `KICKOFF.md`. `ste-lint.py`: 0 hard violations.
- New `README.md` in English: the purpose of the lab, the status, the results of run 1 and the order of the freezes.
  It also gives the layout, the commands and the limits. `ste-lint.py`: 0 hard violations.
  It names no patch. The reason: the lock of `run-generation.sh` does not cover `README.md`, and the agent of runs 2 and 3 must not see the patches.
  The Ukrainian README for the public repository stays a draft in the vault.

## 2026-10-20, 11:30: `run-generation.sh` ready for runs 2 and 3, lock gap closed

Start from: runs 2 and 3 of A and B after 22.10, with `bench/run-generation.sh A <n>` and `bench/run-generation.sh B <n>`.
Each run needs "yes" from Arsen at checkpoint 4. Before each run, start the app with `bench/start-app.sh start`.

### Changes in `bench/run-generation.sh`

sha256 after the change: `d58b1a6640c47947ae999207d9096f73c7490439db4ad0ab77bbbd654932487e`.

1. Lock. During the run, these paths have mode 000: `sealed/`, `bench/results/`, `LOG.md` and each `bench/.run/measure*.log`.
   - I added `bench/.run/measure-chain.log`, because it has one line for each patch with the file name of the patch. The task did not name this file.
   - After the lock, the script tries `ls` or `cat` on each locked path. If a read works, the script stops.
   - During the run, the outputs go to `bench/.run/generation.lock/out/`. On exit, the trap restores the modes and the user items. Then it moves the outputs into `bench/results/` and removes the lock folder.
   - The trap runs on a normal exit, on an error, and on `HUP`, `INT` or `TERM`. On `TERM`, bash waits until `claude` stops and then restores. Thus the lock stays while the agent works.
   - If the trap cannot run (`kill -9` or a power loss), the lock folder stays and the next run stops. The file `bench/.run/generation.lock/restore.txt` has the `chmod` commands with the old modes.
2. Sleep. `claude -p` runs under `caffeinate -i`. This stops the idle sleep. It does not stop the sleep when the lid closes (`Clamshell Sleep` in run B-1). Thus keep the lid open on AC power.
3. Output. `--output-format stream-json --verbose` writes all events into `gen-<S>-<n>.jsonl`. The script writes the last `result` event into `gen-<S>-<n>.json`.
   This is the same object as the `json` output of run 1. The `.meta` file also gives `result_events`, the number of result events.
4. A check run adds the time to its name, for example `gen-A-0-check-112855`. The reason: `gen-A-0-check.json` of 00:09 exists, and the script does not write over a result.
5. No change in these items:
   - the pinned CLI and its sha256, `env -i` and the model `claude-opus-5-5`
   - the allowed tools, `--permission-mode acceptEdits` and the MCP config
   - the hidden user items, the budget of 40 USD, the prompt and the follow-up text

`bench/collect-metrics.mjs` needs no change. It reads `gen-<S>-<n>.json`, takes the cost from the last result event and takes the time from the transcript.

### Commands and real results

1. `SKIP_BUILD=1 bench/start-app.sh start` at 11:28: `up: http://localhost:3000/rest/admin/application-version = 200 after 4s`.
2. `bench/run-generation.sh A 0 check`, from 11:28:57 to 11:29:02, script exit 0. An outside loop wrote `stat` of the 4 paths each second. Output: `bench/results/gen-A-0-check-112855.*`.
   - Script output: 4 `locked: chmod 000` lines, 4 `probe` lines with `Permission denied`, `during: synced | CLAUDE.md: missing` and `claude exit=0, wall 5s`.
   - Result line: `{"result_events":1,"subtype":"success","is_error":false,...,"total_cost_usd":0.00190487,"permission_denials":0}`.
   - Then 4 `restored: chmod` lines, `restored: user items back in ~/.claude` and `after: graphify ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review synced | CLAUDE.md: present`.
   - Outside loop, 6 lines from 11:28:57 to 11:29:02: each line gave `0 sealed 0 bench/results 0 LOG.md 0 bench/.run/measure-chain.log`.
     From 11:28:58 to 11:29:01, the skill list was `synced` and one `caffeinate -i` process ran `claude`.
   - After the run: `stat` gave `755 sealed`, `755 bench/results`, `644 LOG.md` and `644 bench/.run/measure-chain.log`. `~/.claude-harness-demo-hidden` and `bench/.run/generation.lock` did not exist.
3. Output format: `gen-A-0-check-112855.jsonl` has 4 events: `system:init`, `assistant`, `rate_limit_event` and `result:success`.
   The keys of `gen-A-0-check-112855.json` are the same as the keys of `gen-A-1.json` and of `gen-A-0-check.json`.
4. `node bench/collect-metrics.mjs --run 0-check-112855 --out summary-check-try`: the script read the new file.
   For A, it gave `Generation cost, USD` 0 (0.0019 USD, rounded to 2 places), `Subagents` 0 and `Follow-up messages` 0. The work time was 0, because a check runs in a temp folder with no suite transcript.
   I removed the 2 `summary-check-try` files.
5. Stop test: `bench/run-generation.sh A 0 check` in the background, then `kill -TERM` at 11:29:37 while the 4 paths had mode 000. Script exit 143.
   - The restore ran at 11:29:41, after `claude` stopped: the 4 `restored: chmod` lines and the user items back in `~/.claude`.
   - `saved: gen-A-0-check-112934.jsonl gen-A-0-check-112934.meta gen-A-0-check-112934.stderr in bench/results/`. There is no `.json`, because the script stopped before that step.
   - After the test: the same modes as before the test, no hidden folder and no lock folder.
6. Cost of the 2 check runs: 0.00190487 USD each, from the last result event of each `.jsonl`.
7. `bench/start-app.sh stop`: `down: port 3000`. `git -C juice-shop status --short`: no output.

### Facts for the next steps

- I examined the 342 tool calls in the run 1 transcripts of A and B, with the 4 subagents of B. No tool call has a path in the lab, in `sealed/`, in `~/.claude/projects/` or in the session notes.
  The 2 matches in A were the XPath `../..` in a page locator.
- The lock does not cover these paths:
  - `~/.claude/projects/` has the transcripts of the lab sessions and of the session that wrote the patches. This path was also open in run 1.
  - The shared notes folder of the lab sessions has `sealed-hashes.md` with the file names of the patches. This path was also open in run 1.
  - The lab `.git` folder has the old `bench/results/` files as compressed objects.
  - The vault folder `demo/` has `juice-shop-readme-draft.md` with the patch list (entry of 10:55).
  - `Bash(node *)` lets the agent run any code, also `chmod`. Thus mode 000 stops `cat`, `ls` and `grep`, but not an agent that tries to go around the lock.
  - Arsen decides if runs 2 and 3 keep this state or if the lock covers more paths.
- `collect-metrics.mjs` (function `volume`) and `run-judge.mjs` (`TAG`) use the tag `gen-1`. For runs 2 and 3, they must use `gen-<n>`.

## 2026-10-20, 10:55: README draft and offer sentence draft, not published

Start from: Arsen reads the two drafts and checks the judge by hand on 2 test cases in each suite. Nothing is published before checkpoint 5.

- Arsen asked for a README draft in Ukrainian with a short English paragraph, and for the offer sentence, from `bench/results/summary.md`. He said: do not publish anything.
- The drafts are in the vault folder `demo/`, not in the lab. The reason: `CLAUDE.md` allows only English `.md` files in the lab and in the suites, and the publication repository does not exist yet.
  - `demo/juice-shop-readme-draft.md`: Ukrainian, with an English paragraph. It holds the result table, the setup, the freeze order and the result for each hypothesis.
    It also holds the patch list, the commands, the limits and the full rule `juice-shop-app`.
  - `demo/demo-block-draft.md`: Russian notes by the vault rules, with two Ukrainian variants of the sentence and the source of each number.
- I compared each number in the drafts with `bench/results/summary.csv`, `flaky.json` and `judge/`. All numbers match. Cost ratio B to A: 3.01. Time ratio: 1.88.
- `grep -c -P '[\x{2013}\x{2014}]'` gives 0 for both drafts (the vault rule: no em dash and no en dash).
- The README draft has no diffs of the patches. Generation runs 2 and 3 are still ahead, and the vault is outside the lock of `run-generation.sh`. The diffs go into the README at publication.
- Placeholders: the links to the DOU article, the repository and the video, and the result of the manual check of the judge.

## 2026-10-20, 10:40: measurements of run 1 done

Start from: Arsen checks the judge by hand on 2 test cases in each suite (section 6 of the plan). Then the Thursday tasks of section 9: the README from `bench/results/summary.md`, the video and the offer sentence.
Before generation runs 2 and 3, close the lock gap of the entry of 10:10.

### Commands and real results

The chain ran from 10:10:56 to 10:37:54 under `caffeinate -i`. Each step gave exit 0. The full output is in `bench/.run/measure-chain.log` (not in git).
After the chain: `git -C juice-shop status --short` gave no output, and `bench/start-app.sh status` gave `down`.

1. `node bench/run-mutants.mjs`, 10:10:56 to 10:26:21. Output: `bench/results/mutants.{json,md}` and 32 raw reports in `bench/results/mutants/`.
   - Clean build: A `8/8`, B `8/8`. Recheck with `--repeat-each=3`: A `24/24`, B `24/24`. No catch was dropped by the recheck.
   - Each of the 14 patches failed at least one test in each suite. A: 11 of 11 bugs caught, 14 of 14 patches (score 1). B: the same.
   - For each patch, the catching test is the test case that `sealed/mutants.md` names. A and B have the same list of catching test cases for each patch. Examples: M08 is caught by TC-05 and TC-07. M15 is caught by TC-02 to TC-08.
2. `node bench/run-flaky.mjs`, 10:26:21 to 10:34:25. 4 chunks of 5 runs for each suite, with an app restart before each chunk. Output: `bench/results/flaky.{json,md}`.
   - A: 160 test runs, 7 stable tests, 1 flaky test, 0 broken tests. The flaky test is TC-08: 19 passed, 1 failed, in chunk 1.
     The failure: `apiRequestContext.put: read ECONNRESET` on `PUT /rest/wallet/balance`, in the API top-up before part 2 (`support/api.ts:110`). It started at 07:26:34 UTC, 13 seconds after the app start, with 40 tests in parallel.
     It is not a wrong check. The server closed the connection. Neither suite retries an API call. Under the pre-registered rule, the test counts as flaky.
   - B: 160 test runs, 8 stable tests, 0 flaky tests, 0 broken tests.
3. `node bench/run-judge.mjs --model claude-opus-5-5 --budget 10`, 10:34:25 to 10:37:54. Output: `bench/results/judge.md` and `bench/results/judge/`. Mapping: `suite-1` = A, `suite-2` = B.
   - A (`suite-1`): 49 of 49 steps, `covered` 47, `partial` 2, `missing` 0. Cost 0.6099514 USD, 35 turns, 0 permission denials.
     - TC-01 step 1, `partial`: the code checks that the fields are visible, but not the labels `Email` and `Password`.
     - TC-04 step 2, `partial`: for "No error message shows", the code checks only that the limit message is absent.
   - B (`suite-2`): 49 of 49 steps, `covered` 49, `partial` 0, `missing` 0. Cost 0.7164904 USD, 43 turns, 0 permission denials.
   - The Haiku test at 10:03 gave 47, 2, 0 for both suites. Thus the result of the judge depends on the model. There is one judge run for each suite.
4. `node bench/collect-metrics.mjs`, 10:37:54. Output: `bench/results/summary.{md,csv}`.
5. `ste-lint.py` on `mutants.md`, `flaky.md`, `judge.md` and `summary.md` in `bench/results/`: 0 hard violations.

sha256: `mutants.json` `29d676d16f24f1138afa27afee7a2abfc4544a81350e8536774698b13f4ee37d`, `flaky.json` `4bee9742c010006e0d86505674da3e64ad389ef54ac2e92c765c29f6e6bdc898`, `summary.md` `758c8c7ba07131d6f9a1ccd9b12a44ed625a846cdbe592f219e10432d215c8e4`.

### Result for each pre-registered hypothesis (`bench/hypotheses.md`)

| Hypothesis | A | B | Result |
|---|---|---|---|
| 1. B misses fewer realistic bugs | 0 of 11 missed | 0 of 11 missed | Not supported. No difference |
| 2. B has a higher mutation score | 14 of 14 | 14 of 14 | Not supported. No difference |
| 3. B has fewer flaky tests | 1 (a connection reset in an API precondition) | 0 | Supported, by 1 test in 1 of 160 runs. A weak difference |
| 4. The judge marks fewer steps `missing` in B | 0 | 0 | Not supported. `partial`: A 2, B 0 |
| 5. B takes more time and costs more | 0.34 USD and 1.5 min for each test case | 1.01 USD and 2.9 min for each test case | Supported |

The publication rule of `bench/hypotheses.md` applies: A caught as many bugs as B. Thus the offer sentence must not claim that the harness catches more bugs.
It can name only the metrics with a difference: the 2 partial steps, the 1 flaky test and the cost. The sample is 1 run for each suite.

## 2026-10-20, 10:11: judge model decided, full measurements start

- At 10:10, Arsen chose Opus 5.5 (`claude-opus-5-5`) for the judge, as section 6 of the plan says. This is a human intervention. Section 12 of the plan, item 18, has this decision.
  The README must name in its limits that the judge and the writer of the tests are the same model.
- Arsen told me to run the full measurements now, one after the other: `run-mutants.mjs`, `run-flaky.mjs`, `run-judge.mjs --model claude-opus-5-5 --budget 10`, `collect-metrics.mjs`.
- The chain runs under `caffeinate -i`. The results follow in the next entry.

## 2026-10-20, 10:10: measurement scripts ready, tested on small sets

Start from: Arsen decides the judge model (section 12 of the plan, item 3). Then run the full measurements, one after the other, because they use the same app on :3000:

1. `node bench/run-mutants.mjs` (about 15 minutes).
2. `node bench/run-flaky.mjs` (20 runs of each test).
3. `node bench/run-judge.mjs --model <judge model> --budget 10` (costs money).
4. `node bench/collect-metrics.mjs`.

Use Node 24.21.0: `~/.local/node-v24.21.0/bin/node`.

### Human intervention

- At 09:49, Arsen decided that run B-1 stays valid after the sleep of the Mac. The README must name the sleep in its limits. Section 12 of the plan, item 17, has this decision.

### What I did, with proof

All test outputs have the suffix `-try`. They test the scripts. They are not measurements, and they do not go into the README.

1. `bench/lib.mjs`: the shared helpers. They give the paths and the app start and stop through `bench/start-app.sh`.
   They also give one suite run with `--retries=0 --reporter=json` and the parser of the Playwright JSON report.
2. `bench/run-mutants.mjs`: it runs the clean build first. Then, for each patch, it applies the patch, builds, starts the app for each suite and reverts the patch.
   At the end, it runs the recheck on the clean build.
   A patch is caught when a test passes on the clean build, fails with the patch and passes the recheck. The kinds come from the summary table of `sealed/mutants.md`.
   - Test 1 at 09:50: `--only 12,15 --recheck 1`. Clean: A `8/8`, B `8/8`. M12: A `7/8`, B `7/8`. M15: A `1/8`, B `1/8`. Recheck: A `8/8`, B `8/8`. Both suites caught both patches. The run took 3.5 minutes.
   - Test 2 at 09:55, after the move of the helpers into `lib.mjs`: `--only 12 --recheck 1`. M12 caught by A and B. Output: `bench/results/mutants-try.*`.
   - After each test: `git -C juice-shop status --short` gave no output, and the app was down.
3. `bench/run-flaky.mjs`: 20 runs of each test, in chunks of 5 with an app restart before each chunk. The reason for the chunks: the random stock of 30 to 99 items (entry of 22:50 on 19.10).
   - Test at 10:00: `--repeats 2 --chunk 1`. A: 16 test runs, 8 stable. B: 16 test runs, 8 stable. Output: `bench/results/flaky-try.*`.
4. `bench/judge.md` (the rubric) and `bench/run-judge.mjs`. The script copies the folders `tests`, `core`, `fixtures`, `page-objects` and `utils` of the tag `gen-1` into a new temp folder.
   The name is `suite-1` or `suite-2` at random. The judge gets the pinned CLI, `env -i`, no MCP, and no `Bash`, `Write`, `Edit`, `Agent` or `Skill`. The script writes the mapping only after both judge runs. It removes the temp folders.
   - Test at 10:03: `--model claude-haiku-5-5 --budget 1 --out judge-try`. Each suite: 49 of 49 steps judged, `covered` 47, `partial` 2, `missing` 0.
     Cost: `suite-1` 0.04136093 USD, 43 turns. `suite-2` 0.01798023 USD, 36 turns. 0 permission denials. Mapping: `suite-1` = B, `suite-2` = A.
5. `bench/collect-metrics.mjs`: it writes `summary.md` and `summary.csv`. It takes the time from the transcript and removes gaps of more than 10 minutes as sleep.
   - Test at 10:08 with the `-try` inputs: work time A 12.4 min, B 23.3 min. Sleep during B 534.8 min. Cost for each test case A 0.34 USD, B 1.01 USD. Output: `bench/results/summary-try.*`.
6. `ste-lint.py` on `bench/judge.md` and on the 4 `-try` summaries: 0 hard violations.

### What failed

- The Claude app quit at about 09:59, during the first test of `run-flaky.mjs`. The shell command ended with exit 137.
  After the restart, I checked the state. `juice-shop/` had no changes. The app was down with an old PID file. `sealed/` had mode 755. `~/.claude-harness-demo-hidden` did not exist, and the user skills were in place. `git diff` in the lab was empty.
  I removed the partial output `bench/results/flaky-try/` and ran the test again.

### Facts for the next steps

- `rules:lint` does not compare A and B. The linter checks only the paths of the harness layout (`tests/specs/regression/`, `page-objects/`). `collect-metrics.mjs` states this and gives no number.
- Before generation runs 2 and 3: `bench/results/` now holds the names of the patches (`mutants-try.json`). It will hold all results. The generation agent can read them with `Bash(cat *)`, because the lock covers only `sealed/`.
  Before runs 2 and 3, extend the lock of `run-generation.sh` to `bench/results/` and `LOG.md`, or move these files out of the lab during each run.
- For runs 2 and 3, also add `caffeinate -i` and `--output-format stream-json --verbose` to `run-generation.sh` (entry of 09:50).

## 2026-10-20, 09:50: generation run 1 of A and B done, both suites pass on a clean app

Start from: Arsen decides if run B-1 stays valid after the sleep of the Mac (see "What failed"). Then the Wednesday tasks of section 9: `run-mutants.mjs`, `run-flaky.mjs`, the judge and `collect-metrics.mjs`.

### Generation, with proof

The command for each suite: `bench/run-generation.sh A 1` and `bench/run-generation.sh B 1`, in one background chain with an app restart before each run.
The full output is in `bench/.run/generation-chain.log` (not in git). The numbers below come from `bench/results/gen-A-1.json`, `gen-B-1.json` and the session transcripts in `~/.claude/projects/`.

| Item | A-1 | B-1 |
|---|---|---|
| Session | `053d47d4-ecc4-45f4-b32f-c7f7a78e83e6` | `fba4515d-3f52-47a5-99d2-856588a726b1` |
| Start, end | 00:13:53, 00:26:18 | 00:26:30, 09:44:37 |
| `claude exit` | 0 | 0 |
| `subtype`, `is_error` | `success`, `false` | `success`, `false` |
| `total_cost_usd` | 2.6937032 | 8.1161744 (Opus 7.2811094, Sonnet 0.835065) |
| `duration_api_ms` | 470457 | 1142262 |
| Wall time | 745 s | 33487 s, of which the Mac slept 32088 s. Without the sleep: 1399 s |
| Tool calls in the main transcript | 96 | 155 |
| Subagents | 0 | 4, all `spec-reviewer` |
| Skill calls | none | 1, `ui-autotest` |
| `permission_denials` | 4 | 0 in the last result. The agent log shows 8 blocked `Bash` and 5 blocked `browser_run_code_unsafe` calls |
| Files changed | 27, +1254 lines | 45, +2008 lines |
| Follow-up message | not needed | not needed |

- In `gen-B-1.json`, `duration_ms` 27052 and `num_turns` 2 cover only the last of 5 result events (`result_index` 4, `origin` `task-notification`). The reason: the agent started its 4 reviewers in the background.
  `total_cost_usd` is the sum of all events: it is equal to the sum of `modelUsage`. Thus `collect-metrics.mjs` must take the turns and the time from the transcript, not from `num_turns` and `duration_ms`.
- `npm run agent:log` in `suite-b/`: `Log: 479 entries across 1 session(s)`.
- Commit of each output, unchanged, with the tag `gen-1`:
  - `suite-a` `f7d78f03682f0b98ca5be006e33b5cb5391225d7`, tree `dc4c52c58649cf4291c260601de81b8b3c32b1b6`.
  - `suite-b` `12286c65dfb0c0b2a1c47ef0e09e1dd777b337bb`, tree `2a22235ccbc8a98cc10b0d777ad16faeda4118fe`.
  - From now on, `git diff gen-1` in each suite must show no change in the test code.
- After each run: `restored: chmod 755 sealed/` and `restored: user items back in ~/.claude`.

### Run on a clean app, with proof

Command, for each suite after `bench/start-app.sh stop` and `start`: `npx playwright test --retries=0` with Node 24.21.0.

| Suite | Result | Time | Output |
|---|---|---|---|
| A | `8 passed (14.1s)`, exit 0 | 09:46:14 to 09:46:30 | `bench/results/clean-A-1.txt`, `clean-A-1.json` |
| B | `8 passed (25.4s)`, exit 0 | 09:46:42 to 09:47:09 | `bench/results/clean-B-1.txt`, `clean-B-1.json` |

Both suites pass. Thus no suite gets the follow-up message (section 5 of the plan).

sha256: `gen-A-1.json` `8476928216efa26b249133d095b721ee5e147dfee7004ef7997215c505c79cbd`, `gen-B-1.json` `1d13e33648c73485fe46a4c41bc815a264798950296c5747806316c3d18009cf`.

### What failed

- The Mac went to sleep during run B-1. `pmset -g log` shows `Entering Sleep state due to 'Clamshell Sleep'` at 00:35:14 for 32088 s, and `Wake` at 09:30:02.
  The transcript of B-1 has no event between 00:35:12 and 09:30:01. At 09:30:01 it has `API Error: Your computer went to sleep mid-response. The response above may be incomplete.`
  The agent then continued and finished. One model response was cut. Run A-1 had no sleep. This is not a human intervention in the code, but it is a difference between A and B.
- For the next runs: start each run with `caffeinate -i` and keep the lid open on AC power. Also keep all result events (`--output-format stream-json --verbose`), because `json` keeps only the last one.

## 2026-10-20, 00:13: checkpoint 4, generation of A and B starts

- Checkpoint 4: Arsen approved the patch set and `bench/hypotheses.md` at 00:12. He told me to run the generation of suite A, then suite B, with at most 40 USD for each run. This is a human intervention.
- Before the start: `git status --short` in the lab, in `suite-a/` and in `suite-b/` gives no changed path. Lab commit `f2ad506`.
- The results follow in the next entry.

## 2026-10-20, 00:10: freeze `sealed`, pre-registration, generation script ready

Start from: checkpoint 4. Arsen reads `sealed/mutants.md` and `bench/hypotheses.md` and gives his "yes" for the generation.
Then run the commands below, one suite after the other. Each run costs money, at most 40 USD.

1. `bench/start-app.sh stop`, then `bench/start-app.sh start`. This gives a clean database and a clean server build.
2. `bench/run-generation.sh A 1`, then `bench/run-generation.sh B 1`.
3. If the tests of a suite fail on the clean app after its run: `bench/run-generation.sh A 1 followup` (or `B 1 followup`). This is the one standard follow-up message.

### Decisions of Arsen (human intervention)

Arsen answered three questions at 23:50. Section 12 of the plan, items 14 to 16, has the decisions.

- Item 4 (permissions): the list from the entry of 23:31, `env -i`, `--permission-mode acceptEdits`, the Playwright MCP only. In addition, `chmod 000 sealed/` during each generation run, then the old mode again.
- Item 5 (user-level skills): during each generation run, `~/.claude/CLAUDE.md` and the skills `graphify` and `ponytail*` go into `~/.claude-harness-demo-hidden/`. After the run, they go back.
- The first patch session: start it again. See below.

### The step `sealed`

- The first patch session started at 23:35. Somebody removed it before it wrote a file. At 23:44, `ls -la sealed/` showed an empty folder, and `get_session` gave `Session ... not found`.
- At 23:51, this session started a new separate session with the working folder `sealed/`.
  Before the start, I wrote `sealed/.claude/settings.json` (sha256 `f6782102f92d927745e746bd6157596a8ea7e2a69b4535a96d1df473471c3c45`).
  It denies reads of `harness-demo-runs/`, `gerchik-autotest-project/`, the lab `LOG.md` and `bench/`. It denies writes to `test-cases/`, `LOG.md`, `bench/`, the suites and the plan.
  `LOG.md` is on the list because it describes the harness.
- The patch session sealed 14 patches on 2026-10-20 at 00:05:11 EEST: 11 realistic bugs and 3 operator mutants.
  The descriptions, the checks and the open points for Arsen are in `sealed/mutants.md`.
- This entry does not give the names of the patches. The reason: the generation agent has `Bash(cat *)`, and it can read `LOG.md`. The names go into the log after the generation.
- sha256, checked by this session with `shasum -a 256`:

  | File | sha256 |
  |---|---|
  | `sealed/sealed.tar` | `2a2dcc7d623dd235bb00e7ed8c52eb3abd2613710500a0b6b63800090ff1ff05` |
  | patch 01 | `819ea60e50e1749cfd48f31bcba941cf6f5b698fd3c6af6f93648303a87ab866` |
  | patch 03 | `451a56c07ba064a5d08cd6b8c17feb94ac583f7a396d7cad3186192e86ad72dc` |
  | patch 05 | `c729deb5dfa86879bdc146f30955b0546379921c23202eba28dfa7bbd7af0346` |
  | patch 06 | `10669996424d528093ac6d1db151deac4b91bda2b4d225d431999a2792e74615` |
  | patch 07 | `4599f2e2a0c69f4e2541fb8d1f885e556477ef279eaf602de96341e813b5d446` |
  | patch 08 | `ee4bd6f72a764587691049f7e8806d0ab6b5ecf794894b15f36e33e406c3c8f3` |
  | patch 09 | `b10792ff0f894b790b25b367c39e1fe2ed9bb1ac0fc2abc211eee76b5ad4eda9` |
  | patch 10 | `ca958586e02253f6738d66233fbf540e3b3c62bc46bd86bcc09fcac70bd434a1` |
  | patch 11 | `e2d52ebbfc1c00dbe4f984046de22a700416c0bfd51d13cd578448dcdd8f4ffb` |
  | patch 12 | `47c4c9a17364c9b4e778f4456de43f0600312f59ec81ad0ba42f97e9dbbc90ad` |
  | patch 13 | `db71a33fea01e25569b0f468252bb5dddaf8b26c1c2e590cd5495d4e1b56fb84` |
  | patch 14 | `43ec311589bc627304b7224993bd90bd5eb7a333d63737c18ce94a17ed9c03be` |
  | patch 15 | `c7022544afa72d294e58461006e96d615cf9ff5969596e42605f31af702c0715` |
  | patch 16 | `f28dda342884bd1f1b0a9a99aa7274ec1dce3d9f0411f5f838e0674c39dc3e83` |
  | `sealed/mutants.md` | `8490378e5d1ab2581b375b21c3318fa515f7c3618ed4081649eb288aa556c30c` |

- `tar -tvf sealed/sealed.tar` lists the 14 `.patch` files and `mutants.md` only.
- `git -C juice-shop status --short` gives no output. `git -C juice-shop describe --tags` gives `v20.3.0` (commit `f189f521266f42c6bd05884468292000cee852ed`).
- `build/routes/order.js` holds `wallet.balance >= totalPrice` 1 time, the original line. `git check-ignore -v sealed/sealed.tar` gives `.gitignore:4:sealed/`.
- This session read the final report of the patch session. Thus it knows the list of patches. It does not write tests. The harness was frozen at 23:33, before the patches.

### Test cases in the suites (pre-generation step 1 and 2 of `CLAUDE.md`)

- `cp -R test-cases` into `suite-a/` and `suite-b/`. The hash command of the entry of 22:52 gives `096f5035db6fcc2b53709c2c0f69f56f5ea9a8e1959101974c7e5763c694d067` for the 3 copies. `diff -r` finds no difference.
- Commits: `suite-a` `25a5dbf`, `suite-b` `268e15c` (`harness-v1-1-g268e15c`). The git tree of `test-cases/` is `50384a8f6d5240f928e8bf8cd5a79e6f820e27a2` in the two suites and in the lab tag `test-cases-v1`.

### Pre-registration (plan section 5, step 5)

- `bench/hypotheses.md`, sha256 `d7b41763e802f3e6eb12f8947c36d9c7b73c9101e8ff101230bfbb69525a62cf`. `ste-lint.py`: 0 hard violations.
- It names no patch. Arsen approves it at checkpoint 4.

### Generation script

- `bench/run-generation.sh`, sha256 `04e5f3208e9f7e80d0f0178ece2fb77daf273af272d754f0111314e3705e76f0`.
  It checks the CLI sha256, a clean `juice-shop/`, the app on :3000 and a clean suite. Then it locks `sealed/`, hides the user-level items and runs `claude -p`.
  A trap restores `sealed/` and the user items on each exit.
- `bench/prompt-generation.txt`: the prompt from section 5 of the plan, extracted with `awk`, 4 lines. sha256 of the file `1bda417b1472066ef6638a25de05cf740152ba1c7f898b4361bbe7d390fbad7b`.
- Check run at 00:08:57: `bench/run-generation.sh A 0 check`. This mode uses Haiku and a temp folder, not a suite. The result, from `bench/results/gen-A-0-check.meta`:
  - `locked: chmod 000 sealed/ (was 755)`, later `restored: chmod 755 sealed/`.
  - `during: synced | CLAUDE.md: missing`, later `after: graphify ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review synced | CLAUDE.md: present`.
  - `cli: 2.1.299 (Claude Code)`, `claude exit=0`, `is_error` `false`, `result` `ok`, `total_cost_usd` 0.00190407.

### Facts for the generation

- The CLI 2.1.299 also loads account-synced skills, for example `anthropic-skills:docx`, `anthropic-skills:pdf` and `anthropic-skills:asd-ste100`. It also loads its own built-in skills, for example `code-review` and `simplify`.
  The proof is the `system` `init` event of `--output-format stream-json --verbose`. These skills hold no rules for test code. A and B both see them.
- In the dry run, the CLI did not use the `permissions.allow` list of `suite-b/.claude/settings.json`, because nobody trusted the folder. The hooks ran. The generation keeps this state. Nobody accepts the trust dialog in `suite-a/` or `suite-b/`.
- Section 4 of the plan in the vault holds the draft table of the patches. `Bash(cat *)` can read it. No file in the suites names the plan or the vault. This is the same for A and B.
- From the patch session: a second app copy started in `juice-shop/` resets `data/juiceshop.sqlite` and removes `ftp/*.pdf`. The patch session ran its copy on :3001 from a separate runtime folder. `run-mutants.mjs` must do the same if two copies run at the same time.

## 2026-10-19, 23:43: Claude Code 2.1.299 pinned for A and B (open item 3)

Start from: the open items 4 and 5 of the entry of 23:33. Then checkpoint 4.

- Arsen decided the open item 3 at 23:40: A and B both use Claude Code 2.1.299. This is a human intervention. Section 12 of the plan, item 13, has this decision.
  The reason: the dry run of `harness-v1` used 2.1.299. The global CLI 2.1.139 cannot use Opus 5.5.
- Install command, with Node 24.21.0 and npm 11.19.0:
  `npm install --prefix ~/.local/claude-code-2.1.299 --no-fund --no-audit @anthropic-ai/claude-code@2.1.299`.
  The output: `added 2 packages in 14s`. The global CLI `/usr/local/bin/claude` stays at 2.1.139.
- npm 11 printed a warning that the `postinstall` script (`node install.cjs`) is not in `allowScripts`. The binary is in place all the same:
  `bin/claude.exe` and `claude-code-darwin-x64/claude` have the same inode `42098332` (a hard link) and the size 257765072 bytes.
- The path for `claude -p` in A and B: `~/.local/claude-code-2.1.299/node_modules/.bin/claude`.
- `--version`: `2.1.299 (Claude Code)`.
- sha256 of the binary: `099dcc53dabbbefabed8926dab25b0318775c175a7c87bb6ba6c54fde9f8ece2`.
  The command: `shasum -a 256 ~/.local/claude-code-2.1.299/node_modules/@anthropic-ai/claude-code/bin/claude.exe`.
- `codesign -dv` of the binary: `Identifier=com.anthropic.claude-code`, `TeamIdentifier=Q6L2SF6YDW`.
- The dry run used the 2.1.299 build of the Claude desktop app, not this file:
  `~/Library/Application Support/Claude/claude-code/2.1.299/d55abe38f797/claude.app/Contents/MacOS/claude`, sha256 `4e2f7e75be0616fea955e2bc7cbf897b7c288e2a44cba140b9cec140ef42e44b`.
  The version is the same, but the two files are different. The desktop app updates its copy, so A and B must not use it.
- Check call at 23:41:51, through `env -i` as in the dry run, with `DISABLE_AUTOUPDATER=1`:
  `claude -p "Reply with the word ok." --model claude-opus-5-5 --output-format json --max-budget-usd 0.5`.
  The result: `exit=0`, `is_error` `false`, `result` `ok`, `duration_ms` 2023, `num_turns` 1, `total_cost_usd` 0.240776. `modelUsage` has `claude-opus-5-5` only.
- Use `DISABLE_AUTOUPDATER=1` for the generation of A and B too.

## 2026-10-19, 23:33: freeze `harness-v1`

Start from: the separate session for `sealed/` (plan section 5, step 4). That session starts in `sealed/` and gets access only to `juice-shop/` and `test-cases/`.
Before the generation, Arsen decides the open items 3 to 5 below.

- Checkpoint 3: Arsen approved the harness and the decisions 1 and 2 at 23:33. This is a human intervention.
  - Decision 1: `z85@0.0.2` stays in the baseline of both suites.
  - Decision 2: step names are English. A spec links its test case through the annotation `{ type: 'test-case', description: 'TC-NN' }`.
- Tag: `harness-v1`, an annotated tag in `suite-b/`. The tag object is `1aab2a8032b98854c6251d4c58692be482e3f363`.
- Commit `29c5d5f82481a1b82494f88ef2dce18e3e6701b1`, tree `799785108e24cb49c94239ce8e335a27c30a7fa5`, 45 tracked files. `git status --short` gave no output before the tag.
- Hash of the tracked files of `suite-b/`: `23a0c66d27b1648ec54bc134df466ec25d13808013f6424a951006e46f207220`.
- Hash command, in `suite-b/`: `git ls-files -z | sort -z | xargs -0 shasum -a 256 | shasum -a 256`.
- `sealed/` does not exist at the time of the tag.
- Open items for checkpoint 4 (the generation), from the entries of 23:20 and 23:31:
  3. The Claude Code version for A and B: the global CLI 2.1.139 cannot use Opus 5.5.
  4. The permission list and the `env -i` start of `claude -p`.
  5. The user-level `ponytail` skills, which both suites see.

## 2026-10-19, 23:31: dry run done, checkpoint 3

Start from: checkpoint 3. Arsen reads the harness in `suite-b/` (commit `29c5d5f`) and this entry.
After his "yes": set the tag `harness-v1` in `suite-b/`, record the sha256, then start the separate session for `sealed/`.
Before that, Arsen decides the open items of checkpoint 3 below.

### What I did, with proof

1. **The CLI login.** After the first sign-in of Arsen, `claude -p` still gave 401. The keychain item `Claude Code-credentials` had the date `20261019170829Z`, before the sign-in.
   Arsen then ran `claude auth login` in a terminal. The new date is `20261019202319Z`. A test call `claude -p "Reply with the word ok." --model claude-haiku-5-5` gave `ok`.
2. **The CLI version.** The run with `/usr/local/bin/claude` (Homebrew cask, 2.1.139) gave `API Error: 400 Claude Code 2.1.139 does not support this model; version 2.1.280 or newer is required.` The cost was 0.
   I did not change the global install. For the dry run, I used the CLI of the Claude desktop app: `~/Library/Application Support/Claude/claude-code/2.1.299/.../claude`, `2.1.299 (Claude Code)`.
3. **Environment of the run.** The shell of this session holds variables of the desktop app, for example `CLAUDE_CODE_SIMPLE` and `ANTHROPIC_BASE_URL`. I started `claude -p` through `env -i` with only `HOME`, `USER`, `LOGNAME`, `SHELL`, `TERM`, `LANG`, `TMPDIR` and `PATH`. `PATH` starts with `~/.local/node-v24.21.0/bin`.
4. **App.** `bench/start-app.sh stop`, then `start`: `up: ... = 200 after 3s, node v24.21.0, pid 18954`. Thus the database was clean.
5. **Dry run.** A new throwaway copy of `suite-b/` at `a79ecf2`, with `test-cases/README.md` and `test-cases/TC-90-product-search.md` only.
   The command is the same as in the entry of 23:20: Opus 5.5, `--output-format json`, `--max-budget-usd 15`, `--permission-mode acceptEdits`, the Playwright MCP only, the same `--allowedTools`.
   Start 23:25:17, end 23:29:07, `claude exit=0`. The JSON is `bench/results/dry-run-B-1.json` (sha256 `fef2b56ad88f61137bc46c5943d0a605e8646ae917b874a1856fe717f48defbc`):

   | Field | Value |
   |---|---|
   | `is_error` | `false` |
   | `duration_ms` | 226305 |
   | `num_turns` | 42 |
   | `total_cost_usd` | 1.3518927 (`claude-opus-5-5` 1.233, `claude-sonnet-5-5` 0.119) |
   | `permission_denials` | 8 |

6. **Evidence that the harness works in `claude -p`:**

   | What | Proof |
   |---|---|
   | Hooks `log-action` and `guard` (PreToolUse, PostToolUse) | `npm run agent:log` in the copy: `Log: 96 entries across 1 session(s)`. Each tool has `proposed` and `ok` rows |
   | Skill `ui-autotest` | Transcript: one `Skill` call with `skill: "ui-autotest"`. It was the first tool call of the agent |
   | Agent `spec-reviewer` | Transcript: one `Agent` call with `subagent_type: "spec-reviewer"`. The subagent used only `Read` (10) and `Glob` (2). `modelUsage` shows `claude-sonnet-5-5`. Verdict: `CHANGES` |
   | Rules | At the start: `juice-shop-app.md` and `project-base.md`. Later, 12 `nested_memory` attachments: each path-scoped rule loaded when the agent touched a matching file |
   | Hook `post-edit-check` | It ran on each `Write` and `Edit` (same PostToolUse event as `log-action`). It gave no finding, because the code had no violation. A clean result gives no output. I ran it again on the new spec: exit 0 |
   | Section 12 "Prove it" | The agent ran `npm run check`, a green run, and a mutation run: `Apple Pomace` → `Apple PomaceX`, the test failed on `Product card "Apple PomaceX" should be visible`. Then it reverted the change |

7. **My own check of the result, in the copy:** `npm run check` exit 0 (`No new rule violations.`, `pass 9`, `fail 0`). `npx playwright test`: `1 passed (2.0s)`. The agent wrote 8 files:
   - a spec and 2 page objects (59 and 21 lines)
   - a fixture with the two cookies of `juice-shop-app.md`
   - `ui-assertions.ts` and 3 constant files

   It did not change `test-cases/` and did not commit.
8. **Fix after the dry run.** Commit `29c5d5f` in `suite-b/`. My port said "each test uses a new customer". The source rule covers only tests that need a user. The agent asked whether a guest test must create a customer. Now the text says "each test that needs a customer account".
   This does not change anything for TC-01 to TC-08: each of them needs a customer. STE lint: 0 hard on the 4 changed files. The grep of item 5 of the entry of 23:20 is still empty after this commit.

### Findings of the dry run

- **The tag dictionary.** TC-90 has the area "Catalog". No tag of the dictionary fits. The agent added `@catalog` to the dictionary and asked the human. This breaks the rule `autotest-tags.md`. I did not change the rule: TC-01 to TC-08 fit the five tags, and the source rule is the same.
- **The project `allow` list is not used.** The stderr of the run: `Ignoring 7 permissions.allow entries from .claude/settings.json: this workspace has not been trusted.` The hooks still ran.
  For the generation, this makes A and B more equal: only the `--allowedTools` of the command count. `suite-a/` has no settings file.
- **8 permission denials.** Compound commands with `cd` or `for`, a heredoc and a `Write` into `/tmp`, and `rm ... && npm run check`. The agent found another way each time. The same list applies to A.
- **The answer language.** The agent wrote its final answer in Russian, the language of the prompt. The code and the step names are English.

### Open decisions for Arsen (checkpoint 3)

These items of the entry of 23:20 stay open:

- `z85` in the baseline
- English step names
- the `test-case` annotation
- the parts that I did not port
- the permission list
- the user-level `ponytail` skills

Two items are new:

- **The Claude Code version for the generation.** The global CLI 2.1.139 cannot use Opus 5.5. The options are `brew upgrade --cask claude-code` (2.1.303 now) or the CLI of the desktop app (2.1.299). A and B must use the same version. Record it before the generation.
- **The run environment.** I propose `env -i` with the variables of item 3 for both generation runs. The variables of the desktop app then cannot change the run.

### Human interventions

- After 23:20: Arsen signed in. The keychain item of the CLI did not change.
- 23:23: Arsen ran `claude auth login` in a terminal. After that, `claude -p` worked.

### What failed

- `bench/results/dry-run-B-0-auth-401.json`: the run of 23:18, 401, cost 0.
- `bench/results/dry-run-B-0-cli-too-old.json`: the run of 23:24, 400 for the CLI version, cost 0.

## 2026-10-19, 23:20: baseline and harness done, dry run blocked by the CLI login

Start from: Arsen signs in to the `claude` CLI again. Then run the dry run (item 6) and finish this entry. Then stop at checkpoint 3.

A side session did this work. The parent session gave the task: the Tuesday tasks of section 9 of the plan, up to checkpoint 3.

### What I did, with proof

1. **Baseline (plan section 5, step 1).** `suite-a/` and `suite-b/` in `harness-demo-runs/` are two separate git repositories. Neither has a remote.
   - Command, in `suite-a/`, with Node 24.21.0 first in `PATH`: `npm init playwright@1.17.139 -- --quiet --browser=chromium --lang=ts --no-examples`. Result: `@playwright/test` 1.64.1, no example spec.
   - Changes to the generated files: `baseURL: process.env.BASE_URL ?? 'http://localhost:3000'`, reporter `[['list'], ['json', { outputFile: 'test-results/results.json' }]]`, package name `juice-shop-tests`.
     The reason for the name: the blind judge must not see `suite-a` in `package.json`. The reason for the reporter: the generated `html` reporter starts a server after a failed run and waits for Ctrl+C. In `claude -p`, that stops the agent.
   - `z85@0.0.2` is in the baseline. Juice Shop v20.3.0 uses the same package. See the open decisions.
   - `suite-b/` got the same four files through `git archive` from `suite-a/`, then `npm ci`.
   - Proof: both baseline commits have the tree `e07518ed4b2b68e40188f8b1b53017f155f38113`. The commits are `dbd7f98` (suite-a) and `06c74f1` (suite-b). Each repository has the tag `baseline`.
   - `npx playwright test --list` on the baseline: `Error: No tests found`, exit 1.
2. **Harness in `suite-b/` (plan section 1).** Commits `66c11c5` "Add the test harness" and `a79ecf2` (self-test fix). 45 tracked files. The source stayed read-only. I did not read the forbidden paths. I did not run anything in the source.
   - Taken as they are: `.claude/hooks/log-action.mjs`, `scripts/agent-log-summary.mjs`, skill `karpathy-guidelines`, `eslint.config.mjs` (without the Allure ignore paths), `tsconfig.json`, `.githooks/pre-commit`.
   - Adapted documents: `AGENTS.md` (74 lines), `CLAUDE.md`, `ARCHITECTURE.md`, `docs/core-beliefs.md`. The core beliefs are items 1-4, 6-8 and 10-12 of the source, with the numbers 1-10 now.
   - Adapted harness parts: 13 rules, skill `ui-autotest` with 3 references, skill `bug-report` with its template, agent `spec-reviewer`, `.claude/settings.json`.
   - Adapted scripts: hooks `guard.mjs` and `post-edit-check.mjs`, `scripts/rules-lint.mjs`, `scripts/harness/pre-commit.mjs`, `scripts/harness/edit-hooks.test.mjs`, `scripts/hooks-selftest.mjs`.
   - New: the rule `juice-shop-app.md` (item 3) and `docs/references/endpoints.csv` with 15 endpoints from `server.ts`.
   - `rules-lint` keeps 7 checks: `no-expect-in-regression-specs`, `no-hardcoded-waits`, `pom-size`, `no-tc-ids-in-names`, `no-relative-imports`, `no-hardcoded-endpoints`, `seconds-to-ms-max-30`. The baseline is `{}`.
   - `npm run check` = typecheck + lint + specs:compile + rules:lint + harness:test.
   - Harness dependencies, only in `suite-b/`: `eslint` 9.39.5, `@eslint/js` 9.39.5, `typescript` 5.9.3, `typescript-eslint` 8.72.0, `globals` 16.5.0. These are the majors of the source.
   - `npm run hooks:install` ran in `suite-b/`. Thus `core.hooksPath = .githooks`. The commit `66c11c5` went through the pre-commit hook.
3. **The rule `juice-shop-app`.** It holds the six facts from the entry of 22:50:
   - quiet mode
   - the cookie banner
   - the language message
   - a new database at each start
   - the coupon month in the local time of the server
   - 15 or 16 products on one page
   I wrote it in about 15 minutes. I read the facts again in the code of the tag: `navbar.component.ts` (`checkLanguage`, 5 s message), `search-result.component.ts` (`Math.ceil(15 / columns) * columns`), `lib/utils.ts` (`toMMMYY`), `config/quiet.yml`.
   It does not hold these facts: the totals that the order summary calculates in the browser, the wallet check `>=`, the random stock. These facts point to the planned bug patches of section 4. The harness must not know them.
4. **Checks in `suite-b/`, with Node 24.21.0:**

   | Command | Result |
   |---|---|
   | `npm run harness:test` | `tests 9`, `pass 9`, `fail 0` |
   | `npm run hooks:selftest` | `All checks passed.` (28 checks: guard, post-edit-check, log-action) |
   | `npm run typecheck` | exit 0 |
   | `npm run lint` | `0 errors, 43 warnings` (all in `scripts/*.mjs`: `no-console`, return types) |
   | `npm run rules:lint` | 7 × `✓ ... 0 file(s)`, `No new rule violations.` |
   | `npm run check` | exit 1 at `specs:compile`: `Error: No tests found`. Expected: the suite has no spec yet, and zero is not a pass (core belief 4) |

5. **Cleanup grep (plan section 1).** Command, in `harness-demo-runs/`:

   ```
   grep -riE "gerchik|GD-[0-9]|GD-TC|LMS|admin.panel|Ментор|pro.trading|stage\.json|aio|atlassian|jenkins|gitlab" suite-b /Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench --exclude-dir=node_modules --exclude-dir=.git
   ```

   Result: no output, `grep exit=1`.
   With `node_modules/`, the same pattern matches 30 files of third-party packages (`playwright-core`, `typescript`, `js-yaml` and others). `node_modules/` is git-ignored and is not published.
   A second grep for product examples (`HomePage|investment|CourseApi|Stripe|UserFactory|createStudent|linkTestCase|labelSuite|allure|Jira|UserManager|student`) found only two Allure ignore paths in `eslint.config.mjs`. I removed them.
6. **Dry run (plan section 5, step 3): not done.**
   - Throwaway copy: `cp -R suite-b` into the session scratch folder, as `suite-b-dry/`. No `CLAUDE.md` is in a parent folder of the copy.
   - Test case outside the set: `TC-90` "Search for products by name", 3 steps. I checked each expected result on the clean app with a scratch Playwright script.
     The results: `All Products`, 15 cards at 1280 px, `Search Results - apple` with `Apple Juice (1000ml)`, `Apple Pomace`, `Pineapple Juice (1000ml)`, then `No results found`.
   - App: `bench/start-app.sh stop`, then `start`: `up: ... = 200 after 4s, node v24.21.0, pid 17473`.
   - MCP: `bench/mcp-playwright.json` holds only `@playwright/mcp@0.0.83 --headless --isolated` (sha256 `7e02986be31b88c32f01e4978e0c9fd034fdbb1e3687c363f5aafe0103d7be5b`).
   - Prompt: the text of section 5 without changes, sha256 `1bda417b1472066ef6638a25de05cf740152ba1c7f898b4361bbe7d390fbad7b`.
   - Command, in `suite-b-dry/`: `claude -p "<prompt>" --model claude-opus-5-5 --output-format json --max-budget-usd 15 --permission-mode acceptEdits --strict-mcp-config --mcp-config bench/mcp-playwright.json --allowedTools <the list in the open decisions>`.
   - Result at 23:18, in `bench/results/dry-run-B-0-auth-401.json` (the first name was `dry-run-B-1.json`): `"is_error":true`, `"api_error_status":401`, `"result":"Failed to authenticate. API Error: 401 OAuth access token has expired. Re-authenticate to continue."`, `"total_cost_usd":0`.
   - A second call `claude -p "Reply with the word ok." --model claude-haiku-5-5` gave the same 401. `claude auth status` gives `"loggedIn": true`. Thus the CLI keeps an expired token and does not refresh it.
7. **STE.** I wrote each `.md` file by the rules of the `asd-ste100` skill. `ste-lint.py` gives `0 hard` for each of the 25 `.md` files in `suite-b/` and for the 2 files of the dry-run test case.

### Open decisions for Arsen (checkpoint 3)

- `z85@0.0.2` in the baseline of both suites. The reason: `suite-b/.claude/settings.json` keeps the rule of the source "ask before `npm install`". In `claude -p`, nobody can answer the question, so B cannot install a package. A also cannot install it with the proposed list below. With `z85` in the baseline, both suites can calculate the coupon code.
- Step names in `test.step` are English. The source rule asks for Ukrainian names. Section 12, item 2 says that code is English.
- `linkTestCase(id)` and Allure are gone. A spec links its test case through the Playwright annotation `{ type: 'test-case', description: 'TC-NN' }`.
- Not ported:
  - the hook `session-start.mjs`: it reads session notes, and the plan does not take them
  - the line "Use plan mode" in `CLAUDE.md`: in `claude -p`, nobody approves a plan
  - the script `collect-evidence.mjs` of `bug-report`: it reads Allure results
  - the Jira duplicate search of `bug-report`, and the static users
- Proposed permissions for the generation of A and B, the same for both: `--permission-mode acceptEdits` and `--allowedTools "Bash(npx playwright test)" "Bash(npx playwright test *)" "Bash(npm run *)" "Bash(npx tsc *)" "Bash(npx eslint *)" "Bash(node *)" "Bash(ls)" "Bash(ls *)" "Bash(cat *)" "Bash(head *)" "Bash(tail *)" "Bash(grep *)" "Bash(wc *)" "Bash(echo *)" "Bash(git status)" "Bash(git status *)" "Bash(git diff)" "Bash(git diff *)" "Bash(git log *)" "Skill" "Agent" "Task" "mcp__playwright"`.
  The reason for `acceptEdits` and not `bypassPermissions`: the agent must not read the lab folder or another suite.
- The user-level `~/.claude/` (pre-generation step 3 of `CLAUDE.md`): `CLAUDE.md` names the skills `graphify` and `api-test`. The folder `skills/` holds `graphify` and seven `ponytail*` skills. The description of `ponytail` says "Use on ANY coding task". Both suites see it. This can change the test code of A and B. No user-level hooks and no agents.

### Human interventions

- None in this part. The task came from the parent session.

### What failed

- The dry run did not start: the OAuth token of the `claude` CLI expired (item 6).
- `hooks-selftest.mjs` left an empty folder `tests/specs/regression/` after its post-edit check. The fix is in commit `a79ecf2`.

## 2026-10-19, 22:52: freeze `test-cases-v1`

Start from: the Tuesday tasks in section 9 of the plan. Port the harness into `suite-b/` and do the dry run. Then stop at checkpoint 3.

- Checkpoint 2: Arsen approved the test cases TC-01 to TC-08 at 22:51. This is a human intervention.
- Arsen decided to keep the cookie line in `test-cases/README.md`. Suites A and B both see it. Section 12 of the plan, item 8, has this decision.
- Tag: `test-cases-v1`. The tag points to the first commit of the lab. That commit adds this entry.
- Hash of `test-cases/`: `096f5035db6fcc2b53709c2c0f69f56f5ea9a8e1959101974c7e5763c694d067`.
- Hash command, in `test-cases/`: `find . -type f -name '*.md' | sort | xargs shasum -a 256 | shasum -a 256`.
  Use the same command for the copies in `suite-a/test-cases/` and `suite-b/test-cases/` before the generation.
- The sha256 of each file:

  | File | sha256 |
  |---|---|
  | `README.md` | `d30b62c5378270a5ce8878e48ffb65f74d3ae86f54031d252c784bf3ad0f21ed` |
  | `TC-01-login.md` | `69e5cd8848b1ecff16da2d59fc958f4552a997d2cdafc0262a84e0146b0d4b44` |
  | `TC-02-add-to-basket.md` | `60b0a7be209fed851402d5c44c8b9b5a3521b55c5050fb71dd60af24258f8b41` |
  | `TC-03-basket-quantity-and-remove.md` | `ed67217736aa419b3acb3482682a027d25894a25857561e187c8e7d5f98ebe6a` |
  | `TC-04-purchase-limit.md` | `01e04a99b914de10b3ea8fcc5392f73bb02008c1ec399f74ca7c25039a1c1dd3` |
  | `TC-05-valid-coupon.md` | `be50c8a43fbea8501fd7b1941cd4826f282be166bfe85f4e471af07bc2d85f21` |
  | `TC-06-invalid-and-expired-coupon.md` | `ed0f3d76478a719eabdfbee48019bfa3fc3821514124e8fe858bf9667645c4dd` |
  | `TC-07-card-order-end-to-end.md` | `515ccf68de626b209c3f0bb50dcffa59c49ea70c627839ff4f7f5690db13e3b6` |
  | `TC-08-wallet-payment.md` | `8d9f9841db06d60cf3c78843451e0754e914b3ee13b239dab9a3bac6b70b7cf8` |

- The commit does not include `start-claude.command`. `CLAUDE.md` does not name it in the list of tracked files.

## 2026-10-19, 22:50: Monday tasks done, test cases ready for checkpoint 2

Start from: checkpoint 2. Arsen reads `test-cases/` and does each test case by hand on a clean build.
After his "yes", commit the lab files, set the tag `test-cases-v1` and record the sha256 here.
Then do the Tuesday tasks in section 9 of the plan: port the harness into `suite-b/`.

### What I did, with proof

The first part of this session ended without a log entry. The items 1 to 4 below come from the files on disk and from section 12 of the plan.

1. Arsen answered the questions of section 11 at 22:10. The answers are in section 12 of the plan:
   - Opus 5.5 (`claude-opus-5-5`) writes the tests in A and B. The `spec-reviewer` uses Sonnet.
   - The budget limit is `--max-budget-usd 40` for one generation run.
   - One run for each suite before 22.10. Runs 2 and 3 come after 22.10.
   - Test cases and code are in English. The README is in Ukrainian with a short English paragraph.
   - Arsen approves the publication of the rule texts before checkpoint 5.
   - Node 24.21.0 is the prebuilt archive from nodejs.org in `~/.local/node-v24.21.0`. The system Node 22.19.0 stays.
   - Open item: the judge model is Opus, the same model that writes the tests. Decide before the judge runs.
2. The lab has a git repository from `git init`. The repository has no commits yet. `.gitignore` holds `juice-shop/`, `suite-a/`, `suite-b/`, `sealed/`, `.DS_Store`, `bench/.run/`.
3. `juice-shop/` is a clone of the tag. `git describe --tags` gives `v20.3.0`. `git status --short` gives no output.
   `npm install` ended with Node 24.21.0: `node_modules/` and `frontend/dist/frontend/index.html` exist. Nobody recorded the duration of `npm install`.
4. The draft test cases TC-01 to TC-08 are in `test-cases/`.
5. Environment, at 22:47:

   | Command | Result |
   |---|---|
   | `node -v` (system) | `v22.19.0` |
   | `~/.local/node-v24.21.0/bin/node -v` | `v24.21.0` |
   | `npm -v` (system / Node 24) | `10.9.3` / `11.19.0` |
   | `git --version` | `git version 2.50.1 (Apple Git-155)` |
   | `docker --version` | `Docker version 28.4.0, build d8eb465` |
   | `claude --version` | `2.1.139 (Claude Code)` |
   | `df -h /` | 732 GiB free |

6. I fixed a bug in `bench/start-app.sh`. The PID file held the bash wrapper (pid 12144), not node (pid 12145). Thus `stop` did not stop node.
   The fix: `exec nohup node build/app`. The proof:
   - `bench/start-app.sh start`: `up: http://localhost:3000/rest/admin/application-version = 200 after 3s, node v24.21.0, pid 13393`, total time `9.958 total` (build:server and start).
   - `ps -p 13393` shows `node build/app`.
   - `bench/start-app.sh stop`: `down: port 3000`. After that, `ps -ef | grep "node build/app"` gives no output.
   - `SKIP_BUILD=1 bench/start-app.sh start`, then `curl` of the version URL: `{"version":"20.3.0"} 200`.
7. I checked each `[to check]` item of the test cases. I read the code of the tag and ran two scratch scripts against the running app: an API script and a Playwright UI script.
   The scripts stay in the session scratch folder. They are not part of the lab. The code and the app agree with each item, so I removed all `[to check]` marks. Results:
   - TC-01: a wrong password gives `Invalid email or password.` (HTTP 401). The menu shows `Login` before the login. After the login, the URL is `/#/search` and the menu shows the email and `Logout`.
   - TC-02: the counter shows `0`, then `1`. The message is `Placed Eggfruit Juice (500ml) into basket.` The basket shows `Total Price: 8.99¤`.
   - TC-03: totals `13.98¤`, `18.97¤`, `13.98¤`. The minus button at quantity 1 keeps quantity 1. After the trash button: `8.99¤`, counter `1`.
   - TC-04: quantity 5 gives `9.95¤`. Quantity 6 gives `You can order only up to 5 items of this product.` in the basket and in the product list (HTTP 400). The quantity stays 5.
   - TC-05: the coupon `pEw8phz3Tq` (`OCT26-10`) gives `Your discount of 10% will be applied during checkout.` The order summary shows `17.98¤`, `0.99¤`, `1.80¤`, `17.17¤`.
   - TC-06: `abcdefghij` and `q:<Irhz3Tq` (`SEP26-10`) both give `Invalid coupon.` (HTTP 404). The order summary shows `Promotion` `0.00¤` and `Total Price` `18.97¤`.
   - TC-07: the summary, the confirmation page and the order history show `19.86¤`. After the order, the basket is empty and `Checkout` is disabled.
   - TC-08: with balance `5.00`, the button `Pay 8.99¤` is disabled. With balance `8.99`, the button is enabled. After the order, the balance is `1.00` and the order history shows `8.99¤` and `Bonus` `1`.
8. I changed two test cases:
   - TC-07: product B is now `Carrot Juice (1000ml)`, `2.99¤`. The product list shows 15 or 16 products on one page, and `Raspberry Juice (1000ml)` is not on page 1.
     The new totals are `20.97¤`, `2.10¤` and `19.86¤`. TC-03 keeps `Raspberry Juice (1000ml)`, because its precondition fills the basket through the API.
   - TC-08: the precondition now has a saved card. Without a card, `PUT /rest/wallet/balance` returns 402 `Payment not accepted.`
9. `ste-lint.py` on each file in `test-cases/`: 0 hard violations.
10. Draft hash, not a freeze: `find . -type f -name '*.md' | sort | xargs shasum -a 256 | shasum -a 256` in `test-cases/` gives `096f5035db6fcc2b53709c2c0f69f56f5ea9a8e1959101974c7e5763c694d067`.

### Human interventions

- Arsen answered the questions of section 11 (checkpoint 1).
- Arsen chose the prebuilt Node 24 archive in place of `brew install node@24`.
- Arsen wrote "proceed plan" at the start of the second part of this session.

### What failed

- The first part of this session did not write a log entry. Item 3 has no install duration for this reason.
- `brew install node@24` started to compile Node from the source code, because no bottle exists for this Intel Mac. Arsen stopped it and chose the prebuilt archive.
- `bench/start-app.sh stop` did not stop node. Item 6 has the fix.

### Facts for the next steps

- The products are in `config/default.yml`, not in `data/static/products.yml`. The plan and `KICKOFF.md` name the wrong file.
- At each start, the app gives a random stock of 30 to 99 to each product without a set quantity (`data/datacreator.ts:323`).
  TC-07 and TC-08 buy 3 items of `Eggfruit Juice (500ml)` in one run. 20 repeats buy 60 items.
  Thus the flaky run can get `We are out of stock! Sorry for the inconvenience.` `run-flaky.mjs` must restart the app between repeats, or use a smaller repeat count for each start.
- Without the cookie `language`, the app shows `Language has been changed to English` for 5 seconds on the first visit. This message can cover other messages. Input for the rule `juice-shop-app`.
- The cookie `cookieconsent_status=dismiss` hides the cookie banner. The quiet mode shows no welcome dialog.
- The server calculates the coupon month in the local time of the server (`toMMMYY` in `lib/utils.ts`).
- The server checks `wallet.balance >= totalPrice` (`routes/order.ts`). `5 + 3.99` gives exactly `8.99` in JavaScript, so the boundary in TC-08 is exact.
- The order summary page calculates the totals in the browser. The confirmation page and the order history show the totals that the server saved.
- A wallet payment through the API with a low balance gives HTTP 500 with the text `Insufficient wallet balance.`
  The UI disables the button. Thus the UI never sends this request.

### Open question for Arsen

`test-cases/README.md` tells how the cookie `cookieconsent_status=dismiss` hides the cookie banner. Suites A and B both see this text.
The plan puts the facts about the test app into the harness rule `juice-shop-app`. Keep the cookie line in the test cases, or move it to the harness only?

## 2026-10-19, 22:05: English documents, suites outside the lab

- The `.md` files of the lab are now in English. The `asd-ste100` linter reports 0 hard violations for each file.
- The skill `asd-ste100` is now in `.claude/skills/asd-ste100/`. It is a vendored copy under the MIT license, see `VENDORED.md`.
- The suites move to `WorkFolder/harness-demo-runs/`.
  The reason: Claude Code loads each `CLAUDE.md` from the working folder up to the root folder.
  A suite inside the lab would see the rules of the experiment.
- Start from: `KICKOFF.md`, the first step that is not done.

## 2026-10-19, 21:55: lab folder created

- The lab folder `harness-demo-juice-shop` holds `CLAUDE.md`, `KICKOFF.md`, `LOG.md` and `.claude/settings.json`.
- The plan is `aqa-harness-integration/demo/demo-plan-juice-shop.md`.
- Start from: `KICKOFF.md`, step 1.
