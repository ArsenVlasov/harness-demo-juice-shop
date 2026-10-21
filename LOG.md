# Experiment log

The newest entry is at the top.
For each freeze, record the tag, the sha256, the date and the time.
For each measurement, record the command and its real result.

---

## 2026-10-21, 13:45: E4 on the client suite vague A-1, and an exploratory E4 on haiku A-3

Start from: the tool runs of this entry and the workflow that builds the rest of E4. Then the auditor sessions.

- At 13:42, Arsen chose: E4 runs as frozen on vague A-1. Also, an exploratory E4 runs on haiku A-3. This is a human intervention. Section 10 of the stage 2 plan, item 17, has it.
  - Haiku A-3 is the only suite with missed bugs (4 of 11, by a TC-07 test that failed a recheck run).
  - The choice of haiku A-3 came after the results of E2 and E3. Thus it is exploratory: it tests no hypothesis, and the README says so.
  - The caps: audit 20 USD and fix 20 USD for each suite, at most 80 USD. This is the "yes" for the auditor and fixer sessions of both suites.
- The inputs of the frozen E4 (section "Inputs of the audit and of the fix") apply to both suites:
  - vague A-1: `harness-demo-runs/set-2/run-1/suite-a` at `gen-1`, with the vague test cases.
  - haiku A-3: `harness-demo-runs/set-3/run-3/suite-a` at `gen-3`, with the precise test cases.
- The out names of the tools name no condition, run or suite: `tamper-x1` and `mutate-x1` for vague A-1, `tamper-x2` and `mutate-x2` for haiku A-3. The label is `client` in all 4 runs.
- At 13:46, Arsen said "start the tool runs". The Mac was on battery, at 76 %. This is a human intervention.
  The 4 runs started at 13:46:26 in the background, with the output in `bench/.run/e4-tools.log`:
  - `node bench/run-audit-tamper.mjs --suite client=<suite> --rules bench/tamper-rules.json --out tamper-x<k>`
  - then `node bench/run-audit-mutate.mjs --suite client=<suite> --ref gen-<n> --out mutate-x<k>`
  - first for vague A-1, then for haiku A-3
  - Before each run, a guard stops the sequence when the Mac is on battery below 30 %. These tools change no file in `juice-shop/` or in a run folder, so a stop is safe.
- At 13:43, the workflow `wf_9056a65c-c69` started. It builds the option `--hide-app-source` of `bench/claude-locked.sh` and the script `bench/e4-prepare.mjs`.

## 2026-10-21, 13:40: results of E2 and E3, and the client suite of E4

Start from: Arsen decides on E4 (the items at the end of this entry). Then the free tool runs on the client suite, and the auditor session (cap 20 USD) after his "yes".

### The re-runs, with proof

`bench/rerun-vague-slept.sh`, from 12:48:10 to 13:30:27, the last line `rerun done. Failed steps: none`. The output is in `bench/.run/rerun-vague-slept.log`.
Each step gave exit 0: vague run 2 patches (to 13:00:51), flaky (to 13:07:25), judge (to 13:10:55) and summary. Then the pair A-3 and B-4: patches (to 13:23:29), flaky, the 2 summaries, the merge and the aggregate.
The Mac did not sleep during the re-runs. `git -C juice-shop status --short`: no output. The app: `down`.

### The results: the values of runs 1, 2 and 3 (the third vague pair is A-3 and B-4)

| Metric | vague A | vague B | haiku A | haiku B |
|---|---|---|---|---|
| Realistic bugs missed, of 11 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 4 | 0 / 0 / 0 |
| Mutation score, of 14 | 14 / 14 / 14 | 14 / 14 / 14 | 14 / 14 / 10 | 14 / 14 / 14 |
| Judge steps `partial`, of 49 | 2 / 21 / 18 | 0 / 0 / 0 | 9 / 3 / 7 | 5 / 3 / 1 |
| Judge steps `missing`, of 49 | 0 / 0 / 0 | 0 / 0 / 0 | 7 / 0 / 0 | 0 / 0 / 0 |
| Flaky tests, 20 runs | 0 / 0 / 2 | 0 / 0 / 0 | 0 / 0 / 1 | 0 / 0 / 0 |
| Generation cost, USD | 2.58 / 2.66 / 2.46 | 8.45 / 8.42 / 6.76 | 0.82 / 0.77 / 0.58 | 1.57 / 1.81 / 4.25 |

- Sources: `bench/results/aggregate-vague.md`, `aggregate-haiku.md` and the files that they name. No run got the follow-up message.
- Haiku A-3 missed M01, M03, M09 and M13. Its TC-07 test failed on each of these 4 patches, but it also failed 1 of 3 recheck runs on the clean build.
  The failure: `toBeVisible` on `getByText('Placed Carrot Juice (1000ml) into basket.')`. Thus the stage 1 rule does not count these catches. This is the same pattern as precise B-3.
- Cost of E2 and E3:
  - Generation: 41.13 USD. The stopped vague B-3 has no result event, so its cost is not known.
  - Judges: 8.86 USD. The failed judge of vague run 2 during the sleep is not in this sum.

### The hypotheses, by the frozen rule "How we read n = 3"

An agent read the hypotheses again from the frozen file (`git show hypotheses-v2:...`) and the raw files, with no access to my reading (workflow `wf_c42f6ae0-902`). Its labels are the same as mine.

| Hypothesis | Label |
|---|---|
| H2.1 A-vague misses more bugs than A-precise | ceiling (0, 0, 0 against 0, 0, 0) |
| H2.1, judge steps partial plus missing | direction only (2, 21, 18 against 2, 0, 3), inconclusive |
| H2.2 B-vague misses more bugs than B-precise | opposite direction (0, 0, 0 against 0, 0, 4), inconclusive |
| H2.3 B-vague misses fewer bugs than A-vague | ceiling (0, 0, 0 against 0, 0, 0) |
| H2.3, judge steps partial plus missing | **strong support** (B 0, 0, 0 against A 2, 21, 18: no overlap) |
| H2.3, flaky tests | direction only (0, 0, 0 against 0, 0, 2), inconclusive |
| H3.3 B-haiku misses fewer bugs than A-haiku | direction only (0, 0, 0 against 0, 0, 4), inconclusive |
| H3.1 the gap of missed bugs is larger with Haiku | direction only: D(haiku) = +1.33, D(precise) = -1.33 |
| H3.2 the gap of judge steps is larger with Haiku | direction only: D(haiku) = +5.67 (A 16, 3, 7 against B 5, 3, 1), D(precise) = +1.33 |

- By the publication rule, the offer can claim only one effect. On vague test cases, by the blind judge, the suite with the harness checked the expected results more exactly.
  It must give the numbers and the spread. It must not claim that the harness catches more bugs.
- A limit that the agent found: D(precise) was known at the freeze of `hypotheses-v2.md`. The precise runs 2 and 3 ended at 16:32, and the freeze was at 19:19.
  Thus the threshold of H3.1 and H3.2 is post hoc.
- Precise B-3 and haiku A-3 are the only suites with missed bugs. In both, the cause is a TC-07 test that failed a recheck run, not a missing check.

### The client suite of E4 (the frozen rule, section "The client suite for E4")

- `node bench/select-client.mjs` (new script) wrote `bench/results/client-selection.{md,json}`.
- 12 candidates, 11 eligible. Haiku A-3 is not eligible, because its recheck gave 7 of 8.
  Each of the 11 eligible candidates misses 0 bugs, so step 3 applies: **the client suite is vague A-1** (`harness-demo-runs/set-2/run-1/suite-a`, tag `gen-1`).
- The agent of the workflow `wf_c42f6ae0-902` applied the rule to the raw Playwright reports, with no access to the script. The client suite and all values of the 12 rows are the same.
- Two notes of the agent for Arsen:
  - The plan text "take the weakest suite" would point to haiku A-3 (4 missed bugs). The frozen step 3 uses only the eligible candidates (answer 4).
  - Vague A-1 is one of the strongest vague A suites by the judge: 2 steps `partial`, against 21 (A-2) and 18 (A-3). Its tests catch each of the 11 bugs.
    Thus R1 has no value (H4.1 "not tested"), and H4.3 can only show "no change" (the frozen E4 rules for 0 missed bugs).

## 2026-10-21, 13:10: the tool-call audit fixed and run again for each session (item 1.5)

- At 12:58, the re-runs of the entry of 12:55 started in the background: `caffeinate -i bench/rerun-vague-slept.sh >bench/.run/rerun-vague-slept.log 2>&1` (commit `6efb01f`).
- Two changes in `bench/audit-tool-calls.mjs`:
  - A path ends at a backslash. In a JSON string, `\n` is not a part of a path. This removes the false alarm of `audit-haiku-1` (entry of 12:00).
  - A new column "Cross-session": each `<cross-session-message>` in a transcript (in), and each `SendMessage` call with `to` that starts with `uds:` (out).
    A `SendMessage` call to an own subagent does not count. The exit code is 1 when a call is forbidden or a cross-session message exists.
  - Test of the path regex on the false alarm: the match is only the work dir of haiku B-1.
- I ran the audit again for each session. These are 10 runs by condition: `precise` 1 to 3, `vague` 1 to 4 and `haiku` 1 to 3.
  Also the stopped vague B-3, the vague writer and the binder.
  The result: 0 forbidden calls in each session.

| Report | A: tool calls, forbidden, cross-session | B: tool calls, forbidden, cross-session |
|---|---|---|
| `audit` (precise 1) | 96, 0, 0 | 246, 0, 0 |
| `audit-precise-2` | 68, 0, 0 | 247, 0, 0 |
| `audit-precise-3` | 63, 0, 0 | 232, 0, 0 |
| `audit-vague-1` | 74, 0, 0 | 311, 0, 0 |
| `audit-vague-2` | 73, 0, 0 | 321, 0, 0 |
| `audit-vague-3` (A-3) and `audit-vague-4` (B-4) | 68, 0, 0 | 280, 0, 0 |
| `audit-haiku-1` | 152, 0, 0 | 245, 0, 2 (the message of 09:36 and the reply, entry of 12:00) |
| `audit-haiku-2` | 133, 0, 0 | 266, 0, 0 |
| `audit-haiku-3` | 129, 0, 0 | 420, 0, 0 |
| `audit-vague-B-3-stopped` | | 268, 0, 0 |
| `audit-vague-writer-1`, `audit-binder-1` | 24, 0, 0 and 12, 0, 0 | |

- The "outside" paths of all reports, checked by hand:
  - Files of the agents in `/tmp`: backups of specs, probe scripts, check logs. Examples: `/tmp/spec-backup`, `/tmp/jsprobe/probe.mjs`, `/tmp/check.log`.
  - The socket of the message of haiku B-1.
  - `/Users/` in haiku A-3: the endpoint `/api/Users/` of the app.
  No outside path is in the lab, the vault or another run folder.
- The `../` entries are imports between files of the suite and XPath locators.

## 2026-10-21, 12:55: the resume sequence ended, the Mac slept 512 minutes, a rule for the re-runs

Start from: the re-runs of this entry. Then all results of E2 and E3 in the next entry.

### The end of `bench/resume-e2-e3.sh`, from `bench/.run/resume-e2-e3.log`

- 23:10:32 to 12:45:58. The last line: `resume done. Failed steps: flaky vague 2 judge vague 2 mutants vague 3 flaky vague 3 chain haiku (see its own lines)`.
- Vague B-4: generation 23:10:36 to 23:28:18, then the clean run and the commit, each exit 0. No follow-up.
- Haiku A-1 to B-3: each generation, clean run and commit gave exit 0, from 07:59:15 to 11:25:35. No follow-up.
- The chain of `haiku` reported `Failed steps: audit 1 audit 2`. The entry of 12:00 explains the false alarm of these audits.
  All measurements of `haiku` gave exit 0.

### The sleep of the Mac

- At 00:07:23, `pmset -g log` gives "Entering Sleep state due to 'Clamshell Sleep'": the lid was closed. `caffeinate -i` does not stop this sleep.
- I counted the time from each `Sleep` line to the next `Wake` or `DarkWake` line. The "Wake Requests" lines are not wakes.
  The result: 23 intervals, 512 minutes in total, from 00:07:23 to 08:56:26.
- The minutes of sleep in each step:

| Step | Time | Exit | Asleep |
|---|---|---|---|
| vague B-4 generation | 23:10:36 to 23:28:18 | 0 | 0 min |
| vague run 1: patches, flaky, judge | 23:28:45 to 23:55:48 | 0 | 0 min |
| vague run 2: patches | 23:55:48 to 00:14:46 | 0 | 6.7 min |
| vague run 2: flaky | 00:14:46 to 00:46:54 | 1 | 30.0 min |
| vague run 2: judge | 00:46:54 to 01:56:05 | 1 | 63.7 min |
| vague pair A-3 and B-4: patches | 01:56:05 to 02:51:36 | 1 | 54.8 min |
| vague pair A-3 and B-4: flaky | 02:51:36 to 04:59:55 | 1 | 126.8 min |
| vague pair A-3 and B-4: judge | 04:59:55 to 07:59:10 | 0 | 175.2 min |
| haiku A-1 generation | 07:59:15 to 09:26:14 | 0 | 55.0 min |
| all other steps of `haiku` | 09:26:46 to 12:45:58 | 0 | 0 min |

### The rule for the re-runs, written before I read any result of these steps

1. The patches (`run-mutants.mjs`) and flaky (`run-flaky.mjs`) depend on the time: a test that stops during a sleep can fail without a code cause.
   Thus each of these steps with more than 0 minutes of sleep runs again, also when its exit was 0.
2. The judge does not depend on the time. A judge step runs again only when it failed (exit not 0).
3. A generation run that ended with a result is not a stopped run (section "Stopped runs" of `bench/hypotheses-v2.md`). Haiku A-1 slept 55 minutes and ended with `success`, so it counts.
   Stage 1 did the same for B-1 (plan, section 12, decision 17).
4. The outputs of the steps that run again keep their files with the suffix `-slept`. I do not read them before the re-runs end.
   The summaries and the aggregate of `vague` that used them get the suffix `-slept` too.

The re-runs by this rule: vague run 2 patches, flaky and judge. Vague pair A-3 and B-4 patches and flaky. Then `collect-metrics` for vague runs 2, 3 (A) and 4 (B), the merge and the aggregate of `vague`.
The judge of the pair (exit 0) stays. The steps of vague run 1 and all steps of `haiku` stay.

## 2026-10-21, 12:00: a message from another Claude session reached haiku B-1, B-1 stays valid

Start from: the end of `bench/resume-e2-e3.sh` (the measurements of `haiku`). Then the next entry with all results of E2 and E3.

### What happened, with proof

- At 06:36:24Z (09:36 local), another Claude session of Arsen sent a message to the local sessions. Its name: "failed tests", session `local_de4f8de5-b672-4661-8fbd-499a00b2a68b`, socket `uds:/tmp/cc-socks/24641.sock`.
  The text asked if the session works in the checkout `gerchik-autotest-project`, and it named a branch of that project.
- The generation agent of haiku B-1 (session `a0b1104a-e859-49e3-9791-0760e39cc827`) got the message as a queued prompt. The transcript of B-1 has it at line 326.
- At 06:36:29Z, the agent replied one time with `SendMessage`: "No, I work in .../set-3/run-1/suite-b, not in gerchik-autotest-project. I do not touch that checkout or its branch, so create your branch there freely."
  Then it went on with its task.
- A script read each transcript of each generation run, with the subagents (`set-1`, `set-2`, `set-3`, `field-map`, `tc-rewrite`):
  - Incoming cross-session messages: 1, the message above.
  - The other `SendMessage` calls (precise B-2: 1, haiku B-3: 5) go to the own `spec-reviewer` subagents of the session. This is the work of the harness.
- `grep -rliE "gerchik|GD-[0-9]"` on the `.ts`, `.md` and `.json` files of `set-1`, `set-2` and `set-3`, without `node_modules` and `.agent-log`: no file.
- The audit `audit-haiku-1` gave exit 1 with 1 forbidden call. It is a false alarm: the path is the work dir of B-1 with the escaped text `\n\nSpecs` after it. The regex takes `\n` into the path.
  I fix the regex after the chain, because the chain still runs the script. Then I run all audits again.

### Decision of Arsen at 11:58 (a human intervention)

- Haiku B-1 stays valid. Section 10 of the stage 2 plan, item 16, has this decision. The pre-registration has no rule for a message from outside.
- The README names the limit: the lock does not stop messages between Claude sessions on one Mac.
- During locked sessions, Arsen runs no other session that sends messages to the local sessions.
- The tool-call audit gets a check for incoming cross-session messages.

## 2026-10-20, 23:20: the Mac shut down during vague B-3, manual restore, B-3 does not count

Start from: the background sequence of this entry: vague B-4, the measurements of `vague`, then the chain of `haiku`. The next entry records the results.

### What happened, with proof

- The vague chain ran from 19:22:00. These steps gave exit 0, from `bench/.run/chain-vague-1-3.log`:
  - the generation, the clean run and the commit of A-1, B-1, A-2, B-2 and A-3, from 19:22:04 to 20:55:13
  - `RUN: bench/run-generation.sh vague B 3` at 20:55:18, and `claude runs in .../set-2/run-3/suite-b` at 20:55:39. The log has no later line.
- The Mac ran on battery. `pmset -g log` gives at 20:13:57 `BatteryHealth Warning level: 2 time: 45` and at 20:32:57 `Warning level: 3 time: 18`.
  The last write of `gen-vague-B-3.jsonl` was at 21:18. `sysctl kern.boottime` gives `Tue Oct 20 23:02:55 2026`. At 23:05, `pmset -g batt` gave `AC Power`, 26 %, charging.
  Thus the battery ran out, and the Mac shut down during B-3. The Claude Code session of the lab also stopped. The chain of `haiku` did not start.
- The trap of `bench/claude-locked.sh` did not run, because the processes stopped with the power.
  At 23:04 the lock folder `bench/.run/generation.lock` and the locked paths had mode 000, and the user items were in `~/.claude-harness-demo-hidden` (since 20:55).
- At 23:04, no process of the generation ran. `pgrep` found only the Playwright MCP servers of the Claude app and two `test-server` processes of the Playwright extension of VS Code.
  VS Code started them at 23:03:49 with the system Node 22, in its workspaces `harness-demo-runs` and `gerchik-autotest-project`. They are not part of the experiment.

### The manual restore at 23:06 (the case "kill -9" of the header of `bench/claude-locked.sh`)

1. `chmod 755 bench/.run/generation.lock`, then `bash bench/.run/generation.lock/restore.txt` (86 lines).
   The `chmod` lines for `/private/tmp/claude-501/...` gave "No such file or directory": macOS clears `/private/tmp` at a start.
2. `CLAUDE.md` back into `~/.claude/`, the 8 skill folders back into `~/.claude/skills/`, `rmdir ~/.claude-harness-demo-hidden`.
   After: `skills/` holds `graphify`, 7 `ponytail*` skills and `synced`, and `~/.claude/CLAUDE.md` exists.
3. The 3 outputs `gen-vague-B-3.jsonl`, `.meta` and `.stderr` moved into `bench/results/`, then the lock folder was removed.
4. `find` with `-perm 000` in the lab, in `harness-demo-runs/`, in the vault `demo/`, in `~/.claude/projects`, in `~/.claude/file-history` and in the notes folder: no path.
   `git -C juice-shop status --short`: no output. The app: `down`.

### The class of the stop (section "Stopped runs" of `bench/hypotheses-v2.md`)

- Vague B-3 is an **outside cause**: "the Mac slept or shut down". I record the class here, before any measurement of `vague`.
- By the frozen rule, B-3 does not count, and nobody measures it. The run is done again with the next free run number: **B-4** in `set-2/run-4/suite-b`.
  The run folder `set-2/run-3/suite-b` stays as the stop left it, with no commit and no tag.
  It has 47 untracked files and no change in tracked files. The sha256 of the list of their hashes is `5e8717a2d7c996bfc32a421f97c8c6b5c7fad4264c4fb741f4eaf210aae09bc5`.
- `gen-vague-B-3.jsonl` has 363 assistant events and no result event, so no cost total exists for B-3.
- The completed runs of `vague`, from `gen-vague-<S>-<n>.json`, each `success`, `is_error` `false`:
  - A-1: 2.5814886 USD. A-2: 2.6647486 USD. A-3: 2.4633298 USD. B-1: 8.4544828 USD. B-2: 8.4205507 USD.
  - The clean runs: A-1 `8 passed (12.0s)`, A-2 `8 passed (12.0s)`, A-3 `8 passed (18.4s)`, B-1 `8 passed (24.9s)`, B-2 `8 passed (20.9s)`. No run got the follow-up.

### A fact about all B runs: the trust warning

- Each `gen-*-B-*.stderr`, also `gen-B-1.stderr` of run 1, holds: "Ignoring 7 permissions.allow entries from .claude/settings.json: this workspace has not been trusted."
  Thus the CLI ignored the 7 `allow` entries of the harness in each B run, and in the same way in each run.
- `--allowedTools` of the generation holds each of these 7 commands. The hooks of the harness ran in each B run.
  `.agent-log/actions.jsonl` has 479 lines in `set-1/run-1`, 484 and 453 in runs 2 and 3, and 610, 633 and 522 in `set-2` runs 1 to 3.

### The plan for the rest of E2 and E3 (the "yes" of 19:21, item 15)

1. Vague B-4: `bench/run-generation.sh vague B 4`, the clean run, the one follow-up if the clean run fails, the commit with the tag `gen-4`.
2. The measurements of `vague`: runs 1 and 2 as pairs, as in the chain. The third pair is A-3 and B-4, measured in one call: `--suite A=set-2/run-3/suite-a --suite B=set-2/run-4/suite-b --ref HEAD --out <kind>-vague-3`.
   `collect-metrics` runs for A with `--run 3` and for B with `--run 4`. A script then puts the A column and the B column into `summary-vague-3.csv` for the aggregate.
   The tool-call audit also covers the stopped B-3.
3. The chain of `haiku`: `bench/run-chain.sh haiku 1 2 3` with `AGG_RUNS=1,2,3`.
- The Mac is now on AC power. The redo costs about one B run (8 to 9 USD). This stays in the estimate of item 15.
- The sequence is the new script `bench/resume-e2-e3.sh`. Before the start, I tested 3 parts of it on known data:
  - `collect-metrics` with one `--suite` gives a summary with one column.
  - I took the merge code from the script with `awk` and ran it with `node -e`.
    It put the A column of one file and the B column of another file into one file.
    `aggregate-runs` read that file and gave the right values.
  - The audit of the stopped B-3 uses its session id `a8607a75-091d-4563-b68a-155632680a90`, from the first event of `gen-vague-B-3.jsonl`.
- At 23:35: `caffeinate -i bench/resume-e2-e3.sh >bench/.run/resume-e2-e3.log 2>&1`, in the background.

## 2026-10-20, 19:25: checkpoint 4 for E2 and E3, the chains start

Start from: the results of the 2 chains in `bench/.run/chain-vague-1-3.log` and `bench/.run/chain-haiku-1-3.log`. The next entry records them.
Then the selection of the client suite for E4 (the frozen rule of `bench/hypotheses-v2.md`).

- At 19:21, Arsen gave "yes" to the generation of E2 and E3 with the measurements. This is a human intervention. Section 10 of the stage 2 plan, item 15, has it.
- Records before the generation, at 19:21:
  - `~/.claude/CLAUDE.md` sha256 `34e89d97e28b08be9465cd96b652cfeb3199217a9cc82f3ba74e15c65a8f5b70`, the same as at 14:07.
  - `skills/`: `graphify`, 7 `ponytail*` skills and `synced`. The manifest of `synced` has sha256 `237ada3fe59f8af7a542987801012e57371983f00151abda1241eff1c1d3e372`, the same as at 14:07.
  - No `agents/`, no `hooks/`, no installed plugin. `settings.json`: `{"skipWorkflowUsageWarning":true,"theme":"dark"}`.
  - `git -C juice-shop status --short`: no output. The app: `down`. No lock folder.
  - The test case sets: `bench/run-generation.sh` checks the hash of `test-cases/` in each new run folder against the lab copy at the tag of the set.
    For `vague`, this is `cf554b7f18b27da8be60c93e22e49dcd6e45155d1b73b160bfe321ac5cd45898`. For `haiku`, this is `096f5035db6fcc2b53709c2c0f69f56f5ea9a8e1959101974c7e5763c694d067`.
- The command, one chain after the other, in the background, with the output in files that the lock covers:
  - `AGG_RUNS=1,2,3 caffeinate -i bench/run-chain.sh vague 1 2 3 >bench/.run/chain-vague-1-3.log 2>&1`
  - then `AGG_RUNS=1,2,3 caffeinate -i bench/run-chain.sh haiku 1 2 3 >bench/.run/chain-haiku-1-3.log 2>&1`
- The order inside each chain: A-1, B-1, A-2, B-2, A-3, B-3. Then for each run: the audit, the patches, flaky, the judge and the summary. Then the aggregate.
  The folders: `set-2/run-<n>/` for `vague`, `set-3/run-<n>/` for `haiku`. The judge is `claude-opus-5-5`, with 10 USD for each suite (answer 8).

## 2026-10-20, 19:30: freezes of stage 2: the vague set, the tamper list, `hypotheses-v2.md`

Start from: checkpoint 4 of E2 and E3 (the generation of the conditions `vague` and `haiku`, 3 runs each). It needs "yes" from Arsen, because it costs money.
Before E4: the option of `bench/claude-locked.sh` that hides `LAB/juice-shop/` from the auditor (answer 12).

### Decisions of Arsen at 19:17 (human interventions)

Section 10 of the stage 2 plan, items 12 to 14, has them.

1. Item 12: the review of 19:08 to 19:13 was a quick look, not the E5a review. The 4 rows of `bench/review-log.csv` stay as they are, and the timer is not reset.
   - The rows: `suite-1` from 16:08:38Z to 16:12:24Z (3.8 minutes), `suite-2` from 16:12:51Z to 16:13:50Z (1.0 minute), 0 issues, 0 fixes.
   - The full review by the checklist comes later. It is the result of round 1. `bench/hypotheses-v2.md` names the quick look in the section E5a and in the limits.
   - `suite-1` has 4 new files `.DS_Store` from the macOS Finder. They are not changes of Arsen.
2. Item 13, checkpoint 2, part 2: "yes" to the vague set after the read of `bench/results/vague-review.md`.
3. Item 14, checkpoint 3: "yes" to `bench/hypotheses-v2.md`. I read this as "yes" to the recommended answer of each of the 12 open questions and to the tamper list.
   The answers are in the file, in the section "Open questions and the answers of Arsen".

### The freezes, with proof

| Step | Item | Value | Time |
|---|---|---|---|
| 1 | Tag `test-cases-v2-vague` (annotated, object `9a48e1ec74d492992215e0e9179864a0afccfe3b`) | on commit `a711e435e8782fa176a005ed034f1660362871f0`. `git archive` of `test-cases-vague` at the tag: folder hash `cf554b7f18b27da8be60c93e22e49dcd6e45155d1b73b160bfe321ac5cd45898` | 19:17 |
| 2 | `templates/suite-a-vague.git` | `main` `cc6af4a9698d60182df56f66cc058f8317c77ed0`, parent `dbd7f98` (tag `baseline`), refs `main` and `baseline` | 19:18:10 |
| 2 | `templates/suite-b-vague.git` | `main` `1180bf2e56ca2323d9dd3752f43678d31fa75299`, parent `29c5d5f` (tag `harness-v1`), refs `main`, `baseline` and `harness-v1` | 19:18:12 |
| 3 | `bench/tamper-rules.json` (the tamper list) | `ebca83b3b167f65720a0c411df7206c0e411c17a9548a0e42f4c572b1c5d8027` | 19:19 |
| 3 | `bench/hypotheses-v2.md` (frozen, with the answers and the lines of item 12) | `b37745fa88d8c90d949ad3b32eea88abf8feeff24fa6cfad0ceaf753fb21c332`, tag `hypotheses-v2` | 19:19 |

- Each template: `main~1` and the tags are the same objects as in the precise template. `test-cases/` at `main` has the folder hash `cf554b7f...`.
  No ref, commit message or path in the 2 templates holds the word "vague" (`grep -ci vague`: 0).
- The items that freeze with `bench/hypotheses-v2.md`, with their sha256 at 19:19:
  - `bench/review-checklist.md`: `0b0d872ada9dce24967a95f356f309654cbdb993025903633de43c408faf0894` (answer 10)
  - `bench/vague-rule.md`: `44c1a2b2ef840d5046c938a66a25b335584ffe0b4d3d75efc937e6e9dd2873ad`
  - `bench/judge.md`: `f3c58491c43ceee7cbf7f765ea407f272f86f8dff81fec8261f0ecf7272e4a06`
  - `bench/prompt-generation.txt`: `1bda417b1472066ef6638a25de05cf740152ba1c7f898b4361bbe7d390fbad7b`
  - `bench/prompt-repair.txt`: `feab2ff3539951d71324f1c5ea42268d015fd3df573c03c8c6f7e758abdac4c4`
  - `bench/conditions.json`: `7d1e68a0b40daf50196589e92602bf300949129ed233cb79bc208eb22c24996f`
- `sealed/sealed.tar`: `2a2dcc7d623dd235bb00e7ed8c52eb3abd2613710500a0b6b63800090ff1ff05`. This is the value of the freeze of stage 1. The patches did not change.

## 2026-10-20, 19:10: E5a, round 1: the blind review copies

Start from: Arsen reviews `harness-demo-runs/review/suite-1` first, then `suite-2`, with `bench/review-timer.mjs` and `bench/review-checklist.md`. Checkpoints 2 (part 2) and 3 still wait for Arsen.

- At about 19:00, Arsen said "yes, make the E5a copies". This is a human intervention.
- `node bench/prepare-review.mjs --suite A1=../harness-demo-runs/set-1/run-1/suite-a@gen-1 --suite B1=../harness-demo-runs/set-1/run-1/suite-b@gen-1`, 19:05:35 to 19:05:50, exit 0.
  - The script removed the harness paths: 44 files and the folders `.agent-log/`, `.claude/`, `.githooks/`, `.playwright-mcp/` and `test-results/`.
  - `suite-1`: commit `94286ee` "Review start", 55 files. `suite-2`: commit `ad7051b` "Review start", 37 files. `git status --short` is empty in both.
  - The mapping is only in `bench/results/review-mapping.json`. I did not open it. Arsen must not open it before both reviews end.
- Checks after the script:
  - No copy holds `.claude/`, `.githooks/`, `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `docs/`, `scripts/`, the ESLint config or `.agent-log/`.
  - `package.json` of each copy has only `{"test":"playwright test"}` as its scripts.
  - `npx playwright test --list` in each copy: `Total: 8 tests in 8 files`, with no app.
  - `git status --short` is empty in `set-1/run-1/suite-a` and `suite-b`.
- A limit of the blindness: the two copies have a different layout and a different number of files. Arsen knows the harness, so he can guess which copy is B. `bench/hypotheses-v2.md` names this limit.
- During a locked session, `bench/claude-locked.sh` locks `harness-demo-runs/review/`. Then the review must wait.

## 2026-10-20, 18:15: the tamper list is bound and checked (checkpoint 3 waits for Arsen)

Start from: checkpoint 3. Arsen reviews `bench/hypotheses-v2.md` (12 open questions) and the tamper list `bench/tamper-rules.json`.

### The binder session, with proof

- `bench/claude-locked.sh ... --tag binder-1` from 18:06:06 to 18:08:00, `claude exit=0, wall 112s`. Output: `bench/results/binder-1.*` and `bench/.run/binder.log`.
- Result line: `"subtype":"success","is_error":false,"session_id":"6714c8d7-5a0a-4ab0-a942-baa8da9d94ba","num_turns":13,"total_cost_usd":0.7249854,"permission_denials":3`.
- After the session: the modes came back, and `after: ... synced | CLAUDE.md: present`. No lock folder and no folder of hidden items stayed.
- The rules file `harness-demo-runs/field-map/tamper-rules.json`: 22 bound rules, `"unbound": []`. sha256 `ebca83b3b167f65720a0c411df7206c0e411c17a9548a0e42f4c572b1c5d8027`.
  The lab copy `bench/tamper-rules.json` has the same sha256.
- Step 4 in the lab: `node bench/check-tamper-rules.mjs <field-map>/tamper-rules.json <field-map>/binding-tables.md <field-map>/capture-c1.jsonl <field-map>/capture-c2.jsonl`.
  The result: 22 `ok` lines, 3 `note K5` lines (T11-a, T14-a and T14-b have no text literal) and `PASSED: all checks`, exit 0.
- Choices of the binder, from its last message:
  - T15-d, T15-e, T15-f and T16-a change texts in the translation file `GET /assets/i18n/en.json`. The page shows these texts from that file, not from an API response.
  - The binder removed T15-a ("Placed … into basket.") and T15-c ("Your discount of …"). In `en.json` they are templates with placeholders, and K5 accepts only the exact text.
  - "Invalid email or password." is in no JSON field of the capture. T15 has other bound texts, so it is not in `unbound`.
  - It removed T08-c (the price total of each product row of the saved order), because its values are not values of T08.
- Step 5, the tool-call audit: `node bench/audit-tool-calls.mjs --session 6714c8d7-5a0a-4ab0-a942-baa8da9d94ba --out audit-binder-1`, exit 0.
  12 tool calls, 0 forbidden, 0 outside, 0 `../`. Each path is in `harness-demo-runs/field-map/`.

### A correction: the allow list does not stop each shell command

- In the binder session, these commands ran with no matching `--allow` rule: `cd`, `ls`, `cat` and `grep` inside the work folder.
  Also `grep -v ... tamper-rules.json > tamper-rules.tmp && mv tamper-rules.tmp tamper-rules.json`.
  The CLI refused only the 3 commands with a shell variable, a `for` loop or a heredoc. Its reasons: "A variable in this command can't be checked before it runs" and "Contains brace with quote character".
- Thus Claude Code 2.1.299 runs read-only shell commands without a rule. With `--permission-mode acceptEdits`, it also runs a file change in the work folder.
- The same applies to the vague writer session of 16:51. The entry of 16:55 says that the session "gets only these tools". That is not exact.
  The audit of 17:00 shows that its calls stayed in its folder: 10 `Read`, 9 `Write` and 4 `Bash` calls ran, and 1 `Bash` call was denied.
- The guards of each locked session are the `chmod 000` lock and the tool-call audit. The tool list only makes some calls harder.

## 2026-10-20, 18:10: the binder package, the binder folder, the binder session starts

Start from: the result of the binder session in `bench/results/binder-1.*`. Then the check in the lab (step 4), the tool-call audit (step 5) and checkpoint 3.

- The workflow `wf_8a5196e5-ed6`, 17:15 to 18:00: 3 agents, 0 errors (1 author, 1 reviewer, 1 fix agent). New files:
  - `bench/make-binder-folder.sh`: it makes the binder folder and prints the sha256 of each file.
  - `bench/prompt-binder.txt`: the prompt. It names no bug, patch, experiment, harness or suite. `ste-lint.py`: 0 hard violations.
  - `bench/check-tamper-rules.mjs`: the check of step 4 (checks K0 to K5), standalone. Its mode `--fields` lists the paths and fields of the capture.
  - `bench/test/check-tamper-rules.test.mjs`.
- The reviewer found 2 major and 4 minor problems. The fix agent fixed both major problems:
  - A rule in `unbound` whose text is in a JSON field now fails K2.
  - An ID of hex text in a path now becomes `[^/?]+`.
  It rejected 4 parts, each with a reason. The rejected parts are in files of other owners.
- My changes after the workflow:
  - `bench/tamper-rules.example.json`: the text "in the pre-registration" is gone, because it names a part of the experiment. New sha256 `d62a08d409a09a291ec4dc19ab1e15570a86a1150f9a83a97371b1ed185b4416`.
  - `bench/hypotheses-v2.md`, binding steps 2 and 4: the binder folder also holds the check, and the binder runs it. Then the main session runs the same check again in the lab.
    This is a change from the procedure of 17:20. `ste-lint.py`: 0 hard violations.
- `node --test bench/test/tamper-proxy.test.mjs bench/test/check-tamper-rules.test.mjs` at 18:04: `tests 155`, `pass 154`, `fail 0`. The skipped test runs only with `TAMPER_REQUIRE_BROWSER=1`.

### The binder folder `harness-demo-runs/field-map/`, made at 18:05:15

`bash bench/make-binder-folder.sh ../harness-demo-runs/field-map bench/results/capture-tagged/capture-c1.jsonl bench/results/capture-tagged/capture-c2.jsonl`, exit 0.

| File | sha256 |
|---|---|
| `binding-tables.md` (from `bench/hypotheses-v2.md` with sha256 `1478dbe70829888843d658124ea21ee2d394afe5588a75a4c0c87a77143a634f`) | `7b0ea13e0456702f8fbf49c5649fd57135423fe4296b2c0f0c434ccf3f824590` |
| `capture-c1.jsonl` | `5d1669e0a7b78b2ec791a8899fc146f0da392095a38a124e088b9d1e43ff21a4` |
| `capture-c2.jsonl` | `737947529c3c998a8d55eb6dcd0e7743af2df49e977887c89f0a69ccad6da0f4` |
| `tamper-rules.example.json` | `d62a08d409a09a291ec4dc19ab1e15570a86a1150f9a83a97371b1ed185b4416` |
| `test-cases/` (folder hash, the hash of `test-cases-v1`) | `096f5035db6fcc2b53709c2c0f69f56f5ea9a8e1959101974c7e5763c694d067` |
| `check-tamper-rules.mjs`, copied after the builder | `133e9225ffc8f4885c83d61005732c158a14a9d50482f759109d298e2b06c491` |
| the folder, after the copy of the check | `720917335d469e5f5d64fbd01e468df59cde09aabb22b3bb5f873a440b9af607` |

- The captures in the folder are the tagged captures of the entry of 17:40, with the same sha256.
- The prompt: `bench/prompt-binder.txt`, sha256 `f9c2859810e1c701a9d633a4b4ce1dcd1cc92e38d1a27a0c65b2bc7063114888`.
- The command (decision 11), with the output in `bench/.run/binder.log`:
  `bench/claude-locked.sh --dir ../harness-demo-runs/field-map --prompt-file bench/prompt-binder.txt --model claude-opus-5-5 --tag binder-1 --budget 5`
  plus `--allow Read --allow Write --allow Edit --allow Glob --allow Grep --allow "Bash(node check-tamper-rules.mjs *)"`, `--deny WebFetch --deny WebSearch --deny Agent --deny Task --deny Skill --deny NotebookEdit` and `--no-mcp`.

## 2026-10-20, 17:40: checkpoint 3: the documents and the proxy updated, the capture of step 1 done

Start from: the binder session (decision 11), after the workflow `wf_8a5196e5-ed6` gives the binder package. Then the check of its rules file and the audit of its tool calls.

- At 17:12, Arsen gave "yes" to the binder session: `claude-opus-5-5`, `--max-budget-usd 5`. This is a human intervention. Section 10 of the stage 2 plan, item 11, has it.
- The workflow `wf_6a422e0d-60e`, 16:55 to 17:20: 6 agents, 0 errors (2 authors, 2 reviewers, 2 fix agents).
  - `bench/hypotheses-v2.md` follows the decisions 2 to 11. The open questions that a decision answered are gone. 12 open questions stay.
    The file now has a prompt for the auditor of E4 and the procedure of step 1 of the binding.
    It also has a step that removes the name of the suite from the tool reports for the auditor.
    `ste-lint.py`: 0 hard violations, 7950 words.
  - `bench/tamper-proxy.mjs`: new option `--capture <file>` (the JSON body of each response to a browser request) and new op `addNumberString`.
    `bench/run-audit-tamper.mjs` gives `--capture` to the proxy in the passthrough run only.
    A reviewer found a crash of the proxy on a very deep JSON body. The fix agent fixed it, also on the change path.
    `TAMPER_REQUIRE_BROWSER=1 node --test bench/test/tamper-proxy.test.mjs`: `tests 48`, `pass 48`, `fail 0`, with a real Chromium.
  - New sha256 of `bench/tamper-rules.example.json`: `eaed14f3c06e37ca8ff7048a38e66c3409649c5a3eb5fdeecaa1bdfe91645b5e`.

### Step 1 of the binding: the capture, with proof

1. The command for each suite of `set-1/run-1`, with the labels `c1` (suite A) and `c2` (suite B):
   `node bench/run-audit-tamper.mjs --suite c1=../harness-demo-runs/set-1/run-1/suite-a --rules bench/tamper-rules.example.json --only example-order-status --recheck 0 --capture --out capture-c1`
   The runner needs one rule. The example rule matches no path of the app, so it changes nothing. The output is in `bench/.run/capture.log`.
   - `c1`, 17:33:22 to 17:34:14, exit 0. `passthrough: 8/8 tests passed, exit 0, browser requests 448, changed responses 0`.
   - `c2`, 17:34:18 to 17:36:01, exit 0. `passthrough: 8/8 tests passed, exit 0, browser requests 695, changed responses 0`.
   - This is also the check of the risk "Прокси ломает приложение" (plan v2, section 9): each test passes through the proxy with no rule.
   - After the runs: `git status --short` was empty in `juice-shop/` and in both suite folders. The app was down.
2. New script `bench/tag-capture.mjs`: it adds the test case and the number of the test to each capture line, by the time windows of `passthrough.json`.
   It does not keep the name or the file of a test, because they show the layout of a suite.

| Label | Capture before the script | Tagged capture (`bench/results/capture-tagged/`) | Lines |
|---|---|---|---|
| `c1` | `d63e7c98f4cd0161ba756b1e56a61ce52a406994ddd182cd9920b34f41300be7` | `5d1669e0a7b78b2ec791a8899fc146f0da392095a38a124e088b9d1e43ff21a4` | 447, 160 with a JSON body |
| `c2` | `6bd7ffd547ea901cb84b01812f093ddc9d74f5ff80b0b335d8cbbdb8ae11f5b7` | `737947529c3c998a8d55eb6dcd0e7743af2df49e977887c89f0a69ccad6da0f4` | 658, 171 with a JSON body |

3. A search of the tagged captures for "sealed", "mutant", "patch", "suite-a", "suite-b" and "harness" finds only "patch". All hits are data of the shop: the product "OWASP Juice Shop-CTF Velcro Patch" and the text "patched/upgraded".

## 2026-10-20, 17:15: the push is blocked, a test of the mutation audit, the preparation of checkpoint 3

- At 16:54, Arsen asked for a commit and a push. The commits are in the lab: `bef1f28`, `ba6f689`, `6f817a9` and `e07d5d1`.
  The push did not run. The permission check of the Claude Code session refused `git push origin main` ("Out-of-Place Publication").
  `gh repo view` gives `"visibility":"PUBLIC"` for `github.com/ArsenVlasov/harness-demo-juice-shop`. `origin/main` is at `3d30a93`. Arsen does the push himself.
- I searched the transcripts of runs 2 and 3 for `github.com`. The hits are in file contents that the agents read (the `z85` package and the Playwright config template). No tool call names GitHub.
  Each `browser_navigate` call of runs 2 and 3 goes to `http://localhost:3000`.
- At 17:00, Arsen said: "proceed work due to our plan". This is a human intervention.

### Test of `bench/run-audit-mutate.mjs` on a small set (plan v2, day plan of 22.10)

1. `node bench/run-audit-mutate.mjs --suite A1=../harness-demo-runs/set-1/run-1/suite-a --ref gen-1 --list`: 85 sites in 25 files, no app.
2. `... --max 4 --out mutate-try`, 17:07:52 to 17:09:40, exit 0. The baseline: 8 tests, 0 left out. `A1: 3 killed, 1 survived, 0 error, 0 skipped of 4`.
   - The killed mutants are 3 URL checks in page objects. Each mutant failed 8 tests.
   - The survived mutant is `tests/pages/header.ts:35`, `toHaveCount(0)` to `toHaveCount(1)`, in the helper `closeAccountMenu()`. The menu closes with an animation, and during it the menu still exists.
     Thus a check that waits for a count can pass on a passing UI state. This is a limit of the tool: a survived mutant in a helper is not always a weak check of a test case value.
3. After the test: `git status --short` was empty in the suite folder and in `juice-shop/`, and the app was down. I removed the test output `bench/results/mutate-try*`.

### Checkpoint 3: the preparation

A background workflow (run `wf_6a422e0d-60e`) has 2 jobs, each with a reviewer:

1. It updates `bench/hypotheses-v2.md` for the decisions 6 to 10. It also writes the missing prompt of the auditor of E4.
2. It adds a capture of the JSON bodies and the operator `addNumberString` to `bench/tamper-proxy.mjs`. The binding procedure of the tamper list needs both.

## 2026-10-20, 17:00: the vague set is written and checked, Arsen reads it next

Start from: Arsen reads `bench/results/vague-review.md` (checkpoint 2, part 2). After his "yes": the tag `test-cases-v2-vague`, then `bench/make-template.sh A vague` and `B vague`.

### The session, with proof

- `bench/claude-locked.sh ... --tag vague-writer-1` from 16:51:25 to 16:53:57, `claude exit=0, wall 150s`. Output: `bench/results/vague-writer-1.*` and `bench/.run/vague-writer.log`.
- Result line: `"subtype":"success","is_error":false,"session_id":"0313c40d-b117-43f1-a737-a59768e8d73e","num_turns":25,"total_cost_usd":1.04531,"permission_denials":1`.
- The denied call: `cd .../harness-demo-runs/tc-rewrite/test-cases && for f in TC-*.md; do ...; cat "$f"; done`. The allowed tools do not hold it. The agent then read each file with `Read`.
- After the session: the modes came back, and `after: ... synced | CLAUDE.md: present`. No lock folder and no folder of hidden items stayed.
- The last message of the session holds the output of the 3 commands of sections 6 and 7:
  - `node check-vague.mjs test-cases test-cases-vague`: `PASSED: all checks`.
  - The folder hash: `cf554b7f18b27da8be60c93e22e49dcd6e45155d1b73b160bfe321ac5cd45898`.
- The meanings of the messages (rule M), from the last message of the session:

| Message | Meaning |
|---|---|
| `Invalid email or password.` | the login fails |
| `Placed … into basket.` | the product is in the basket |
| `You can order only up to 5 items of this product.` | the product is at its limit |
| `Your discount of 10% will be applied during checkout.` | the coupon lowers the price at checkout |
| `Invalid coupon.` | the shop rejects the code |
| `Your discount of` (the first part of a message) | a message about a discount |
| `Thank you for your purchase!` | the shop accepts the order |
| `You have not placed any orders yet.` | the order history is empty |

### The steps "After" of section 8 of the rule

1. Tool-call audit: `node bench/audit-tool-calls.mjs --session 0313c40d-b117-43f1-a737-a59768e8d73e --out audit-vague-writer-1`, exit 0.
   24 tool calls, 0 forbidden, 0 outside, 0 `../`. Each path is in `harness-demo-runs/tc-rewrite/`.
   The calls: 10 `Read` (the rule and the 9 files), 9 `Write` (the 9 vague files), 5 `Bash` (4 ran, 1 was denied).
2. `cp -R` of `test-cases-vague/` into the lab. `node <work folder>/check-vague.mjs test-cases test-cases-vague` in the lab: `PASSED: all checks`, exit 0.
   The shell commands of section 7 on the lab copy: `cf554b7f18b27da8be60c93e22e49dcd6e45155d1b73b160bfe321ac5cd45898`, the same hash as in the session.
3. `ste-lint.py` on each of the 9 vague files: 0 hard violations in each file.
4. `node bench/vague-review.mjs test-cases test-cases-vague` (new script): `76 changed parts, 0 other changes`.
   Output: `bench/results/vague-review.md`, one row for each changed cell or line, with the precise text next to it. `ste-lint.py`: 0 hard violations.
- The set is in git now, as Arsen asked at 16:54 ("commit it and push"). It gets no tag before the "yes" of Arsen.

## 2026-10-20, 16:55: checkpoint 2, part 1: the vague writer session starts

Start from: the result of the vague writer session in `bench/results/vague-writer-1.*`. The next entry records it and the steps "After" of section 8 of `bench/vague-rule.md`.

- At 16:48, Arsen gave "yes" to the rule `bench/vague-rule.md` of commit `ba6f689`. He also gave "yes" to the session that applies it: model `claude-opus-5-5`, `--max-budget-usd 5`.
  This is a human intervention. Section 10 of the stage 2 plan, item 10, has it.
- `bench/claude-locked.sh`: new options `--allow <tool>` (repeated, replaces the generation tool list), `--deny <tool>` and `--no-mcp`. The reason: section 8 of the rule gives the session other tools and no MCP server.
  - Sandbox test at 16:52 with `CL_FAKE_CLAUDE` and all roots in a temp folder. With the new options, the arguments were `--strict-mcp-config --allowedTools Read Write Edit Glob Grep Bash(node check-vague.mjs *) --disallowedTools WebFetch WebSearch Agent Task`, with no `--mcp-config`.
  - With no new option, the arguments were the same as before: the generation tool list and `--mcp-config`. All modes came back after each test.
- The work folder `harness-demo-runs/tc-rewrite/`, made at 16:50 by section 8, steps 1 and 2. It holds only these 3 inputs:
  - `test-cases/` from `git archive test-cases-v1 test-cases`. Folder sha256 `096f5035db6fcc2b53709c2c0f69f56f5ea9a8e1959101974c7e5763c694d067`, the hash of `test-cases-v1`.
  - `vague-rule.md` from `git show ba6f689:bench/vague-rule.md`, sha256 `44c1a2b2ef840d5046c938a66a25b335584ffe0b4d3d75efc937e6e9dd2873ad`. It is byte for byte the lab copy.
  - `check-vague.mjs`, taken by `awk` from the `~~~js` block of that file, sha256 `33de4bb4b4bfb10033a75e055deca54ac2a76fc171209c005ecedc23ebfcec5c`. `node --check`: no error.
- The prompt: `bench/prompt-vague-writer.txt`, taken by `awk` from the `~~~text` block of section 8, sha256 `0a7bc2184a377cfb58dac15a8376b4ac3692d37b34be5c7bd95f0d138b9727e3`.
- The command (section 8, step 4), with the output in `bench/.run/vague-writer.log`:
  `bench/claude-locked.sh --dir harness-demo-runs/tc-rewrite --prompt-file bench/prompt-vague-writer.txt --model claude-opus-5-5 --tag vague-writer-1 --budget 5`
  plus `--allow Read --allow Write --allow Edit --allow Glob --allow Grep --allow "Bash(node check-vague.mjs *)"`, `--deny WebFetch --deny WebSearch --deny Agent --deny Task --deny Skill --deny NotebookEdit` and `--no-mcp`.
  `--deny Skill`: the synced user skills (for example `asd-ste100`) must not change the words of the cells.

## 2026-10-20, 16:50: runs 2 and 3 measured (n = 3 for the precise test cases), vague rule revised

Start from: checkpoint 2 of the stage 2 plan. Arsen gives "yes" to the rule `bench/vague-rule.md`.
Then a separate locked session writes `test-cases-vague/` (section 8 of the rule), and Arsen reads each changed cell.
After that: checkpoint 3 (`bench/hypotheses-v2.md`).

### Measurements of runs 2 and 3, with proof

The commands ran one after the other from 15:50:07 to 16:32:48, each with exit 0. The output is in `bench/.run/measure-precise-2-3.log` (not in git).
`run-mutants` run 2 ran in the chain before the stop (entry of 15:55).

1. `node bench/run-flaky.mjs --cond precise --run 2`, 15:50:07 to 15:57:57. A: 9 tests, 180 test runs, 9 stable. B: 8 tests, 160 test runs, 8 stable.
2. `node bench/run-judge.mjs --cond precise --run 2 --model claude-opus-5-5 --budget 10`, to 16:01:55. Mapping: `suite-1` = A, `suite-2` = B.
   - A: 49 of 49 steps, `covered` 49, `partial` 0, `missing` 0. Cost 0.5713158 USD.
   - B: 49 of 49 steps, `covered` 48, `partial` 1, `missing` 0. Cost 0.7489724 USD.
     The partial step is TC-06 step 4. The note: the error from step 3 can pass the check of the expired coupon.
3. `node bench/run-mutants.mjs --cond precise --run 3`, 16:01:55 to 16:17:48. A: 11 of 11 bugs, 14 of 14 patches. B: 7 of 11 bugs, 10 of 14 patches.
   - B missed M01, M03, M09 and M13. For each of them, the TC-07 test of B failed on the build with the patch.
     The TC-07 test also failed 1 of the 3 recheck runs on the clean build. The pre-registered rule (`bench/hypotheses.md`, hypothesis 1) then does not count the catch.
     Thus the misses come from a flaky test, not from a weak check.
   - The recheck failure: `Error: Product list should be visible`, `expect(locator).toBeVisible() failed`, `Locator: getByRole('article').first()`.
4. `node bench/run-flaky.mjs --cond precise --run 3`, to 16:28:59. A: 8 tests, 160 test runs, 8 stable. B: 8 tests, 160 test runs, 6 stable, 2 flaky.
   - The flaky tests of B are TC-04 and TC-07, each 19 passed and 1 failed. Both failures are in chunk 1 (`B-1.json`), with the same error as the recheck failure.
   - Chunk 1 and the recheck both start right after an app start, with the tests in parallel. The flaky test of A-1 failed in the same place (entry of 10:40).
5. `node bench/run-judge.mjs --cond precise --run 3 --model claude-opus-5-5 --budget 10`, to 16:32:47. Mapping: `suite-1` = A, `suite-2` = B.
   - A: `covered` 46, `partial` 3, `missing` 0. Cost 0.573344 USD. Partial: TC-03 step 4, TC-04 step 5, TC-06 step 4.
     All 3 notes say that the check can pass on the page state of the step before.
   - B: `covered` 49, `partial` 0, `missing` 0. Cost 0.7920594 USD.
6. `node bench/collect-metrics.mjs --cond precise --run 2` and `--run 3`: `bench/results/summary-precise-2.{md,csv}` and `summary-precise-3.{md,csv}`.
7. `node bench/aggregate-runs.mjs --cond precise --runs 1,2,3`: `bench/results/aggregate-precise.{md,csv}`.
   I changed the separator of the run values from a semicolon to " / " (STE has no semicolon). I updated the tests: `node --test bench/test/aggregate-runs.test.mjs` gave `tests 12`, `pass 12`, `fail 0`. Then I ran the aggregate again.
8. `ste-lint.py` on each new `.md` file in `bench/results/`: 0 hard violations.

The generation runs, from `gen-precise-<S>-<n>.json`. Each has `subtype` `success` and `is_error` `false`:

| Run | Suite | Session | Cost, USD | Clean run |
|---|---|---|---|---|
| 2 | A | `8d708ec4-bb43-468a-8d95-95248cb89299` | 2.0601526 | `9 passed (11.3s)` |
| 2 | B | `8f7f9cc3-f988-4abd-9cea-30573a1bb321` | 6.9024895 | `8 passed (24.4s)` |
| 3 | A | `adada483-23a5-4fb9-99c2-43a81df8fd90` | 2.0575258 | `8 passed (12.0s)` |
| 3 | B | `f32e8e6a-72cb-427c-8d05-32c943a95c83` | 6.4910248 | `8 passed (18.7s)` |

Cost of runs 2 and 3: 17.51 USD for the generation, 2.69 USD for the judge, 0.0019 USD for the check run.

### The precise test cases, n = 3 (runs 1, 2, 3)

| Metric | A, values | B, values | A mean | B mean |
|---|---|---|---|---|
| Realistic bugs missed, of 11 | 0 / 0 / 0 | 0 / 0 / 4 | 0 | 1.33 |
| Mutation score, of 14 | 14 / 14 / 14 | 14 / 14 / 10 | 14 | 12.67 |
| Flaky tests, 20 runs | 1 / 0 / 0 | 0 / 0 / 2 | 0.33 | 0.67 |
| Judge `partial`, of 49 | 2 / 0 / 3 | 0 / 1 / 0 | 1.67 | 0.33 |
| Judge `missing`, of 49 | 0 / 0 / 0 | 0 / 0 / 0 | 0 | 0 |
| Cost for each test case, USD | 0.34 / 0.26 / 0.26 | 1.01 / 0.86 / 0.81 | 0.29 | 0.89 |
| Work time for each test case, min | 1.5 / 1.3 / 1.4 | 2.9 / 2.3 / 2.8 | 1.4 | 2.67 |

The stage 1 hypotheses (`bench/hypotheses.md`) with n = 3. This reading is descriptive. The n = 3 reading rule of `bench/hypotheses-v2.md` came after the first measurement of run 2. Thus it does not apply here.

| Hypothesis | Result with n = 3 |
|---|---|
| 1. B misses fewer realistic bugs | Not supported. A missed 0 in each run. B missed 4 in run 3, through a flaky test |
| 2. B has a higher mutation score | Not supported. A 14 in each run, B 14, 14 and 10 |
| 3. B has fewer flaky tests | Not supported. A 1, 0, 0. B 0, 0, 2. In run 1 the direction was the other way |
| 4. The judge marks fewer steps `missing` in B | Not supported. 0 for both in each run. `partial`: B is lower in 2 of 3 runs |
| 5. B takes more time and costs more | Supported in each run |

### The vague rule, revised for decision 6 (workflow `wf_49f4ee96-f4f`, 16:00 to 16:36)

- 4 agents, 0 errors: 1 author, 2 reviewers and 1 fix. Only `bench/vague-rule.md` changed. No agent wrote a vague set into the lab.
- New rule D for the test data: each value part is an input or an output. An input stays, an output goes. A row with no input goes.
  In the text lines, an action sentence stays, and a calculation or a result sentence goes.
  `check-vague.mjs --classes` prints each test data line that rule D gives. The new check C14 compares each line, character for character.
- The reviewers found 3 minor problems, and the fix agent fixed all 3. C5 now also finds non-ASCII digits, and C6 finds more number words.
- Tests of the fix agent:
  - A full vague set of the 8 files that obeys the rule: `PASSED: all checks`.
  - 21 broken variants: each one failed with the expected check.
  - The worked example TC-90: `PASSED`.
  - `ste-lint.py`: 0 hard violations.
- At 16:40, Arsen answered 3 questions about the rule. These are human interventions. Section 10 of the stage 2 plan, items 7 to 9, has them.
  1. The first balance of TC-08 stays as an input, because the test sets it.
  2. The text before `## Preconditions` and the preconditions stay word for word. They hold business rules, as a Jira ticket does.
  3. The price of `Eggfruit Juice (500ml)` can come from TC-08 (first balance plus top-up, and `Pay 8.99¤` in the step column). This stays as a known limit.
- I added these decisions to `bench/vague-rule.md`. `ste-lint.py`: `0 violations (0 hard, baseline 0), 5182 words`.

## 2026-10-20, 15:55: the chain stopped by hand, measurements resumed

- At about 15:47, Arsen stopped the background task of the chain by accident. This is a human intervention. He said that the work can go on.
- The stop came in `node bench/run-flaky.mjs --cond precise --run 2`, after 2 of its 8 chunks. The last line of `bench/.run/chain-precise-2-3.log` is `[15:46:32]   suite set-1/run-2/suite-a A-2.json: 45/45 test runs passed, exit 0`.
- The steps before the stop, from the chain log, each with exit 0:
  - the generation, the clean run and the commit of A-2, B-2, A-3 and B-3, from 14:09:47 to 15:31:10
  - `node bench/run-mutants.mjs --cond precise --run 2`, from 15:31:11 to 15:44:20
- No clean run failed. Thus no run got the follow-up message.
- State at 15:48:54: `git -C juice-shop status --short` gave no output, and the app was `down`.
  `bench/.run/generation.lock` and `~/.claude-harness-demo-hidden` did not exist, and `~/.claude/CLAUDE.md` was in place.
  `sealed`, `bench/results`, `LOG.md`, `.git` and `test-cases` had their normal modes.
- I removed the partial output `bench/results/flaky-precise-2/` (the files `A-1.json` and `A-2.json`). The new run writes it again.

### The tool-call audit of run 2: 5 false alarms, script fixed

- In the chain, `node bench/audit-tool-calls.mjs --cond precise --run 2` gave exit 1 with 5 forbidden calls in B-2. I kept this output as `bench/results/audit-precise-2-first.{txt,json}`.
  The raw report is a `.txt` file, because it quotes a shell command with a semicolon.
  - 4 calls were `Agent` calls to `spec-reviewer`. Their text holds "repo root: .../set-1/run-2/suite-b." with a period at the end.
    The regex took that period into the path.
    The path is the work dir of B-2.
  - 1 call was a `Read` of `~/.claude/projects/<key of B-2>/8f7f9cc3-f988-4abd-9cea-30573a1bb321/tool-results/bk8jg1xb2.txt`.
    This is a large tool output of the same session, which Claude Code saved in the folder of that session. The lock keeps this folder open on purpose.
- The fix in `bench/audit-tool-calls.mjs`: an end mark after a path is not part of the path. The folder of the session itself is allowed.
  The `~` form of the Playwright browser folder and of Node is also allowed.
- The new audit at 15:49:51, exit 0 for each run:

| Run | Suite | Session | Transcripts | Tool calls | Forbidden | Outside | `../` |
|---|---|---|---|---|---|---|---|
| 2 | A | `8d708ec4-bb43-468a-8d95-95248cb89299` | 1 | 68 | 0 | 0 | 0 |
| 2 | B | `8f7f9cc3-f988-4abd-9cea-30573a1bb321` | 5 | 247 | 0 | 2 | 0 |
| 3 | A | `adada483-23a5-4fb9-99c2-43a81df8fd90` | 1 | 63 | 0 | 0 | 1 |
| 3 | B | `f32e8e6a-72cb-427c-8d05-32c943a95c83` | 4 | 232 | 0 | 1 | 0 |

- The outside paths are `/tmp/specs-backup-mutation` and `/tmp/check.log` (B-2) and `/tmp/check.log` (B-3). B writes them in its own mutation step and check step.
  The `../` in A-3 is an import in `tests/support/fixtures.ts`.
- Item 1.5: no tool call of runs 2 and 3 has a path in the lab, in the vault or in another run folder.
  No tool call has a path in a transcript of another session.

### Measurements resumed

At about 15:52, I started the rest of the chain in the background, one step after the other. The output goes to `bench/.run/measure-precise-2-3.log`:
`run-flaky` run 2, `run-judge` run 2 (`claude-opus-5-5`, budget 10), `collect-metrics` run 2.
Then `run-mutants`, `run-flaky`, `run-judge` and `collect-metrics` for run 3, then `aggregate-runs --cond precise --runs 1,2,3`.

## 2026-10-20, 15:50: two decisions of Arsen during the chain

The chain locked `LOG.md` and the vault during each generation run. Thus I record these decisions after the last generation run.
Section 10 of the stage 2 plan, items 5 and 6, has them. Both are human interventions.

1. At 14:31: the extra locks stay. These are the items of `bench/claude-locked.sh` that the decision of 12:13 did not name:
   - the transcripts and temp folders of earlier runs and of the patch session
   - the lab copies of the test case sets, the lab `README.md`, `bench/*.md` and `bench/conditions.json`
2. At 15:47: in the vague set, the test data tables of the TC files keep only the inputs. Inputs are the values that the user types or selects:
   product names, the quantity to enter, the coupon code, the wallet top-up and the like.
   The app outputs go: prices, the coupon percentage, the purchase limit, sums, bonus points and balances.
   The reason: else an agent can calculate the expected values from the test data, and the vague set gives the same ceiling as stage 1.
   I change `bench/vague-rule.md` and its check script. Arsen approves the rule at checkpoint 2.

At 15:47, all 4 run folders of runs 2 and 3 had their tag (`gen-2` or `gen-3`). The next entry gives the results of the chain.

## 2026-10-20, 14:10: stage 2 scripts done, run 1 moved, lock checked, runs 2 and 3 start

Start from: the result of the chain `bench/run-chain.sh precise 2 3` in `bench/.run/chain-precise-2-3.log`. The next entry records it.
After the chain, Arsen reviews the drafts `bench/vague-rule.md` and `bench/hypotheses-v2.md` (checkpoints 2 and 3 of the stage 2 plan).

### The build workflow (run `wf_5b82493d-52b`, 12:10 to 13:58)

- 24 agents, 0 errors. 7 agents wrote the files, 9 reviewers tried to break them, 7 agents fixed the findings, and 1 agent checked the interfaces.
- The reviewers found 78 problems: 8 critical, 34 major and 36 minor. The fix agents fixed 81 items and rejected 10 with a reason.
- The most important fixes:
  - `claude-locked.sh`: a second signal during the restore stopped the restore. The lock did not cover the temp folder of the patch session or the transcripts of other runs.
  - `run-audit-mutate.mjs`: mutants under `.not` cannot fail, but the script counted them as weak checks.
  - `weakening.mjs`: it did not count the wrappers `expectX(...)` of suite B.
  - `run-generation.sh`: the reflog of a new run folder named the template and the test case set.
- The agents had instructions, not a lock: they must not open `sealed/`, `LOG.md`, the patch results, the stage 1 plan or the README draft. Each agent reports that it did not open them.
- New files in `bench/`:
  - for the runs: `conditions.json`, `claude-locked.sh`, `finish-run.sh`, `migrate-layout.sh`, `make-template.sh`, `aggregate-runs.mjs`
  - for E4: `tamper-proxy.mjs`, `run-audit-tamper.mjs`, `tamper-rules.example.json`, `run-audit-mutate.mjs`, `package.json` (TypeScript for the parser)
  - for E5: `run-ui-change.mjs`, `weakening.mjs` (ported from `scripts/loop/stabilize.mjs` of the harness source), `prompt-repair.txt`, `prepare-review.mjs`, `review-timer.mjs`, `review-log.csv`, `review-checklist.md`
  - the drafts for checkpoints 2 and 3: `vague-rule.md` and `hypotheses-v2.md`
  - `test/` with the offline tests
- Changed: `lib.mjs`, `run-generation.sh`, `run-mutants.mjs`, `run-flaky.mjs`, `run-judge.mjs` and `collect-metrics.mjs`.
- I wrote 2 more scripts after the workflow:
  - `audit-tool-calls.mjs`, the tool-call audit of item 1.5.
  - `run-chain.sh`, the chain of generation and measurements.
- I changed the commit message of `finish-run.sh` to the form of run 1. The reason: the message must not name the condition, because a later agent in a copy of the run folder can read `git log`.

### Checks with proof

1. `node --test bench/test/*.test.mjs` at 14:06, after the migration: `tests 125`, `pass 124`, `fail 0`, `skipped 1`.
   The skipped test runs only with `TAMPER_REQUIRE_BROWSER=1`. The integration agent ran that test earlier: Chromium through the proxy passed.
2. `bench/migrate-layout.sh` at 14:01:59, exit 0:
   - `moved: RUNS/suite-a -> RUNS/set-1/run-1/suite-a`, the same for suite B.
   - `templates/suite-a-precise.git`: `main` `25a5dbfad88f4029ccf0a5aa3140c4cde6e28ee9` (`gen-1~1` of run 1), tree `8b481e783e807cd1f3598ec3671b07600e7bc056`, refs `main` and `baseline`.
   - `templates/suite-b-precise.git`: `main` `268e15c92998a28cd86f262b53f7e6094ef7f13a`, tree `24b7406547fcc2362f420cb2ec05dba1d33b3aaa`, refs `main`, `baseline` and `harness-v1`.
   - In each template, `git cat-file -e` fails for the `gen-1` commit and the `gen-1` tag object.
   - `test-cases sha256 in main` for both templates: `096f5035db6fcc2b53709c2c0f69f56f5ea9a8e1959101974c7e5763c694d067`. This is the hash of `test-cases-v1` in the entry of 19.10, 22:52.
   - After the move: `git status --short` is empty in both run 1 folders, and `HEAD` is `gen-1` in both.
3. Item 1.3: `node bench/collect-metrics.mjs --cond precise --run 1 --out summary-migrate-check` at 14:02, after the move.
   `diff` with `summary.csv`: no difference. `diff` with `summary.md`: only the line with the time stamp. I removed the check files.
4. `node bench/run-judge.mjs --cond precise --run 1 --prepare-only` at 14:02: A 25 files, code tree sha256 `b4695c62422a6154120c4894fe9d5ec124a1fa41ce5c5dd818eadc2beda5f6f9`.
   B 42 files, `da910f1fbb72ee95fd752bc076209c8c2cc0931a66ce9870eb924f9cf7b85777`. These are the values before the move.
5. Lock check: `bench/run-generation.sh precise A 0 check` from 14:02:30 to 14:02:38, exit 0. Output: `bench/results/gen-precise-A-0-check-140230.*`.
   - 41 paths got mode 000. Each probe gave `Permission denied`.
   - `during: synced | CLAUDE.md: missing`. Result line: `"subtype":"success","is_error":false,"total_cost_usd":0.0019040700000000001,"permission_denials":0`.
   - Then 41 `restored` lines and `after: graphify ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review synced | CLAUDE.md: present`.
   - An outside loop wrote the modes of 11 locked paths each second, from 14:02:28 to 14:02:39. All 11 had mode 000 from 14:02:33 to 14:02:37, and the old modes after.
6. `bench/audit-tool-calls.mjs` on the 2 sessions of run 1, as a test: 96 and 246 tool calls, 0 forbidden.
   The sum 342 is the same number as in the check of 11:30.
   It found 2 outside paths in B (`/tmp/spec-backup`, `/tmp/check.log`: the mutation step of B). It found 3 `../` in A (an import and an XPath). I removed the test output.

### Records before runs 2 and 3

- The test cases: the hash of each template is in item 2 above. `bench/run-generation.sh` checks the hash of `test-cases/` in each new run folder.
- The user-level `~/.claude/` at 14:07. The lock hides `CLAUDE.md`, `graphify` and the 7 `ponytail*` skills during each run, as in run 1.
  - `CLAUDE.md` sha256 `34e89d97e28b08be9465cd96b652cfeb3199217a9cc82f3ba74e15c65a8f5b70`
  - `skills/`: `graphify`, 7 `ponytail*` skills and `synced`.
  - `synced` holds `asd-ste100 docs docx google-workspace import-memory morning pdf pptx skill-creator xlsx`, manifest sha256 `237ada3fe59f8af7a542987801012e57371983f00151abda1241eff1c1d3e372`.
    The folder was there before run 1 (19.10, 23:25). It stays visible, as in run 1.
  - No `agents/`, no `hooks/`, no installed plugin. `settings.json`: `{"skipWorkflowUsageWarning":true,"theme":"dark"}`.
- Folders of the conditions (decision 3): `set-1` = `precise`, `set-2` = `vague`, `set-3` = `haiku`.
- The chain command: `caffeinate -i bench/run-chain.sh precise 2 3 >bench/.run/chain-precise-2-3.log 2>&1` with `AGG_RUNS=1,2,3`.
  The order: A-2, B-2, A-3, B-3. Then for each run: the audit, the patches, flaky, the judge and the summary.
  The judge is `claude-opus-5-5` with 10 USD for each suite. The output goes to a file that the lock covers.

## 2026-10-20, 12:13: checkpoint 1 of stage 2, and "yes" for runs 2 and 3

Arsen answered 3 questions at 12:13. These are human interventions. Section 10 of the stage 2 plan, items 2 to 4, has these decisions.

1. Lock gaps (item 1.2): the recommended set. During each generation run, these paths also get mode 000:
   - the lab `.git` folder
   - the vault folder `demo/`
   - the notes folder with `sealed-hashes.md`
   - the transcripts of the patch session in `~/.claude/projects/`
   - each other run folder and the templates in `harness-demo-runs/`

   The transcripts of the lab session and `Bash(node *)` stay open. The tool-call audit after each run (item 1.5) covers them.
   The last item of the list is a new gap. In the new layout, the finished suites of earlier runs are next to the new run folder.
2. Folder names of the conditions: neutral names, because the generation agent sees its working folder path.
   - `set-1` is `precise` (the precise test cases, model Opus).
   - `set-2` is `vague` (the vague test cases, model Opus).
   - `set-3` is `haiku` (the precise test cases, model Haiku).

   Layout: `harness-demo-runs/set-<k>/run-<n>/suite-a|suite-b`. Each run starts in a new folder from a template of the start state.
   The new folder has no history of other runs.
3. Checkpoint 4 for runs 2 and 3 of A and B on the precise test cases: "yes", tonight. Before the runs, the new scripts must pass their checks and the layout migration must pass its checks.

## 2026-10-20, 12:10: stage 2 starts, step 0 done

- At about 12:00, Arsen gave the stage 2 plan `demo/demo-plan-v2-juice-shop.md`. He told me to create or update the harness files and to go through the new plan. This is a human intervention.
  Section 10 of the stage 2 plan, item 1, has this decision.
- I read "the harness files" as the lab files in section 4 of the stage 2 plan. The frozen harness `harness-v1` in suite B stays unchanged, because E2 and E3 of the plan say "Харнес не меняем".
- Step 0 of section 4: `CLAUDE.md` now names the stage 2 plan as the source of truth for stage 2. It also names the stage 2 freeze order and the stage 2 checkpoints.
  `ste-lint.py CLAUDE.md`: `0 violations (0 hard, baseline 0), 844 words`.
- A background workflow (run `wf_5b82493d-52b`) builds the stage 2 scripts in `bench/` and the drafts for checkpoints 2 and 3. Its agents must not read `sealed/`, `LOG.md`, the patch results, the stage 1 plan or the README draft.
  They must not start the app, call `claude`, change the suites or lock real paths. The results follow in a later entry.

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
