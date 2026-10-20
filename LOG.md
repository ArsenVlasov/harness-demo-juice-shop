# Experiment log

The newest entry is at the top.
For each freeze, record the tag, the sha256, the date and the time.
For each measurement, record the command and its real result.

---

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
