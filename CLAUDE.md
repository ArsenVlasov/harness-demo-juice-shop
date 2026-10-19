# Harness demo on OWASP Juice Shop

This folder is the lab for the experiment in the card `^demo1022` (KANBAN DESK in the vault of Arsen).
Arsen owns the experiment.

The goal: compare two test suites that an agent writes from the same test cases.

- Suite A: the agent works without a harness.
- Suite B: the agent works with the harness from gerchik-autotest-project.

The result is real numbers for the offer.

## Sources

- **Plan, the source of truth:** `/Users/arsenvlasov/Documents/aqa-harness-integration/demo/demo-plan-juice-shop.md`.
  Read all of the plan before you start work. Write the decisions of Arsen into the plan, in a new section «12. Решения».
- **Harness source, read-only:** `/Users/arsenvlasov/Documents/WorkFolder/gerchik-autotest-project`.
- **Experiment log:** `LOG.md` in this folder. Record these items in it:
  - each freeze: the tag, the sha256, the date and the time
  - each human intervention
  - each measurement command and its real result
  - the end of each session, with a "Start from" line

## Language

- Write every `.md` file in this folder and in `harness-demo-runs/` in English.
- Product UI strings stay as they are, in quotes or backticks.
- After each change to a `.md` file, apply the `asd-ste100` skill to the file.
- Then run the linter: `python3 .claude/skills/asd-ste100/scripts/ste-lint.py <file>`. It must report 0 hard violations.
- The vault is an exception. Its rules are in the section "The Obsidian vault".

## Layout

```
WorkFolder/
  harness-demo-juice-shop/   the lab (this folder)
    CLAUDE.md, KICKOFF.md, LOG.md
    test-cases/              master copy of the test cases
    bench/                   measurement scripts, the judge, results/
    juice-shop/              clone of Juice Shop v20.3.0, the bench scripts apply the bug patches here
    sealed/                  the bug patches, create this folder only after the tag harness-v1
  harness-demo-runs/         generation folders, outside the lab on purpose
    suite-a/                 Playwright project, the agent without the harness
    suite-b/                 the same project with the harness
```

The suites are outside the lab for this reason: Claude Code loads each `CLAUDE.md` from the working folder up to the root folder.
A suite inside the lab would load this file and see the rules of the experiment.

Git:

- The lab repository tracks `CLAUDE.md`, `KICKOFF.md`, `LOG.md`, `.claude/`, `test-cases/` and `bench/`.
- The lab `.gitignore` holds `juice-shop/` and `sealed/`.
- `suite-a/` and `suite-b/` are separate git repositories. The generation agent must not see the history of the other suite or the bug patches.
- `sealed/` stays out of git until the measurements end. Record its sha256 in `LOG.md`.

Before generation:

1. Copy `test-cases/` into `suite-a/test-cases/` and into `suite-b/test-cases/`.
2. Calculate the hashes of the three copies. They must be the same. Record them in `LOG.md`.
3. Record in `LOG.md` the contents of the user-level `~/.claude/` folder: `CLAUDE.md`, skills, agents and hooks.
   Both suites see these files. If they hold rules for test code, stop and ask Arsen.

## Rules that keep the experiment honest

1. Follow the order in section 5 of the plan. Do not skip a step:
   `test-cases-v1` → `harness-v1` → `sealed` → pre-registration → generation of A and B → measurements.
2. Before the tag `harness-v1`, nobody creates or reads `sealed/`.
3. A **separate** Claude Code session writes the bug patches. That session starts in `sealed/`.
   It gets access only to `juice-shop/` and `test-cases/`. It does not change the harness.
4. For the generation of A and B, use `claude -p` with the prompt from section 5 of the plan. Use the same prompt for both suites.
   The working folder is `suite-a/` or `suite-b/`. Do not use `--add-dir`. Save the JSON output in `bench/results/`.
5. After generation, nobody changes the test code in `suite-a/` and `suite-b/`. This rule applies to Arsen and to this session.
   The only permitted input is the standard follow-up message from section 5 of the plan.
6. In `suite-b/`, port and adapt the harness as section 1 of the plan tells.
   Do not add capabilities that gerchik-autotest-project does not have.
   The harness must not contain knowledge about the bug patches.
7. A number without the command output is not a result. Do not write "passed" if you did not run the command.

## Security

- In gerchik-autotest-project, never read these paths with any tool (Read, cat, grep or other):
  `.env`, `.env.*`, `config/.env`, `.auth/`, `test-data/users/static/`, `.agent-log/`.
- Do not change files in gerchik-autotest-project. Do not run tests or npm scripts there.
- Do not port data about the Gerchik product into `suite-b/`. This includes names, endpoints, `GD-*` tickets, roles and examples from the LMS and the Admin Panel.
- Do the cleanup and the grep check from section 1 of the plan.

## The Obsidian vault (aqa-harness-integration)

- Write only in `demo/`.
- The vault rules apply there: the text is in Russian, with no em dash and no en dash.
- Do not change `KANBAN DESK.md` or `outreach/PIPELINE.md`.
- Do not publish or send the README, the screen recording or the offer sentence without approval from Arsen.

## Checkpoints: stop and wait for "yes" from Arsen

1. The answers to the questions in section 11 of the plan.
2. The draft test cases, before the tag `test-cases-v1`.
3. The harness in `suite-b/` and the dry run, before the tag `harness-v1`.
4. The generation of A and B, before it starts. It costs money.
5. The publication of the repository.
