# First session

You continue the experiment.
The plan is `/Users/arsenvlasov/Documents/aqa-harness-integration/demo/demo-plan-juice-shop.md`.
The work rules are in `CLAUDE.md`.

1. Read `CLAUDE.md`. Then read all of the plan.
2. Check the environment. Record the results in `LOG.md`:
   - `node -v` (the app needs version 22 to 26)
   - `npm -v`
   - `git --version`
   - `docker --version`, or "not installed"
   - `claude --version`
   - the free disk space
3. Ask Arsen the questions from section 11 of the plan. Use AskUserQuestion. Give a recommendation for each question.
   Record the answers in the plan, in a new section «12. Решения». Record them in `LOG.md` too.
4. Do the Claude tasks from the row «Пн 19.10» in section 9 of the plan:
   1. Run `git init` in the lab folder. Write `.gitignore` as `CLAUDE.md` tells.
   2. Clone the Juice Shop tag `v20.3.0` into `juice-shop/`. Start `npm install` in the background, because it takes a long time.
   3. When the install ends, start the app with `NODE_ENV=quiet npm start`.
   4. Check that `GET /rest/admin/application-version` returns 200. Record the build time in `LOG.md`.
   5. Write `bench/start-app.sh` (section 7 of the plan).
   6. While the install runs, write the draft test cases TC-01 to TC-08 in `test-cases/`, in English. Use the format from section 3 of the plan.
5. Base each test case on the code of the tag:
   - `routes/` and `lib/insecurity.ts`
   - `data/static/products.yml`, for a product with `limitPerUser`
   - the UI texts in `frontend/src/assets/i18n/`

   Do not invent behavior. If you did not check a behavior in the code or in the running app, mark it "to check".
6. Checkpoint: show the test cases to Arsen. Then stop. Set the tag `test-cases-v1` only after his "yes".
7. At the end of the session, add a block on top of `LOG.md` with three items:
   - what you did, with proof
   - what failed
   - "Start from"
