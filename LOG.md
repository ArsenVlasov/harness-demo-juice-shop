# Experiment log

The newest entry is at the top.
For each freeze, record the tag, the sha256, the date and the time.
For each measurement, record the command and its real result.

---

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
