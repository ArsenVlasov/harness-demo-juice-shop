# E5b: a change of the UI, suites A and B of `precise` run 1

The rules are in `bench/hypotheses-v2.md` at the tag `hypotheses-v2`, the section E5b. n = 1 for each suite and each UI patch.
The UI patches are in `sealed-ui/sealed-ui.tar`, sha256 `459ff7459d4fd59ac935fe2ec82a32b4d2fdf109787af7c0e8a5d2b812760616` (`LOG.md`, entries 21.10, 19:12 and 19:52).

## The UI patches

| Patch | Kind | Change |
|---|---|---|
| 01 | rename a button | `Add to Basket` becomes `Add to Cart` |
| 02 | the structure of a form | the login form: the label `Email address`, a new place for `Remember me` and `Forgot your password?` |
| 03 | move a step of the checkout | the panel `Add a coupon` moves from `My Payment Options` to the basket page |
| 04 | rename a button | `Place your order and pay` becomes `Confirm and pay` |

## H5b.1: broken tests, one patch at a time (`ui-change-each.md`)

A broken test passes in all 3 runs on the clean app and fails in all 3 runs with the patch.

| Patch | A broken | B broken |
|---|---|---|
| 01 | 3 (TC-02, TC-04, TC-07) | 3 (TC-02, TC-04, TC-07) |
| 02 | 0 | 0 |
| 03 | 3 (TC-05, TC-06, TC-07) | 3 (TC-05, TC-06, TC-07) |
| 04 | 0 | 0 |
| Sum | 6 | 6 |

- No test was unstable. Both suites had 8 of 8 tests green on the clean app.
- The frozen rule: broken(B) ≤ broken(A). 6 ≤ 6, so H5b.1 has support, with the mark "equal".
- With all 4 patches together (`ui-change-together.md`), each suite has 5 broken tests: TC-02, TC-04, TC-05, TC-06 and TC-07.

## H5b.2: the fix after the UI change (`ui-change-together.md`)

All 4 patches apply together. Each suite gets one fix session with `bench/prompt-repair.txt` ("Інтерфейс змінився, тести падають. Полагодь."), `claude-opus-5-5` and a cap of 10 USD.
The session runs in a copy in `harness-demo-runs/maintenance/ui-change-together/`. The run folders do not change.

| Suite | Cost, USD | Work time, min | Fixed | Still broken | Missing | `weakening()` findings | Files changed |
|---|---|---|---|---|---|---|---|
| A | 1.06 | 4.9 | 4 of 5, and 1 renamed | 0 | 1 (TC-05, renamed) | 0 | 12: 6 in `test-cases/`, 6 code files (3 specs, 3 page objects) |
| B | 0.83 | 3.4 | 2 of 5 | 3 (TC-05, TC-06, TC-07) | 0 | 0 | 1: `page-objects/search-page.ts`, 3 lines |

- The frozen rule: weakening(B) = 0 and weakening(B) ≤ weakening(A). 0 = 0 and 0 ≤ 0, so H5b.2 has support.
- For B, `weakening()` covers only the fix of patch 01 (1 file, 3 changed lines). The 3 coupon tests of B have no fix yet, so H5b.2 says nothing about a fix of the coupon flow by B.
- `weakening()` reads only the code part of the diff, not `test-cases/`. It finds patterns and counts only (see `ui-change-together.md`).
- The cost and the time of B cover 2 of 5 fixes. Thus they do not compare directly with A, which fixed 5 of 5.

### What each fix session did

- A (no harness):
  - It changed the button name in its page object.
  - It moved the coupon methods from the payment page object to the basket page object.
  - It put the coupon steps of TC-05, TC-06 and TC-07 before `Checkout`.
  - After these code changes, the full suite gave `8 passed (15.1s)` (transcript line 130). The test-case files do not change a test result.
  - Then A wrote "All 8 pass. Now syncing the test-case docs with the new UI" and changed 6 files in `test-cases/`: `README.md`, TC-02, TC-04, TC-05, TC-06 and TC-07. It tried `sed -i` first. After the denial, it used `Edit`.
  - These edits cover patches 01, 03 and 04. Patch 04 broke no test of A, but A also changed TC-07 step 7 to `Confirm and pay`.
  - Example: TC-05 is now "Valid coupon in the basket", with 6 steps, not 5. The coupon steps moved to the basket (new steps 1 and 2). The payment step no longer expects the panel `Add a coupon`.
  - Its test "TC-05: Valid coupon on the payment step" is now "TC-05: Valid coupon in the basket". Thus the report counts it as "missing".
  - Its last message lists the test-case edits under "Що варто переглянути" ("what to review"). It also says: if the move of the coupon is not intended, it is a regression, and the test cases must go back.
- B (harness):
  - It changed the button name in `page-objects/search-page.ts`. TC-02 and TC-04 pass again. It did not ask before this change.
  - Thus its code now expects `Add to Cart`, and its test cases (TC-02, TC-04, TC-07) still say `Add to Basket`. Its message says so and asks a person to update these test cases.
  - It stopped at the move of the coupon. Its reasons: the specs must follow the test cases, and the test cases require the panel on the payment page. It cannot change `test-cases/`.
  - The rule is in its harness: `AGENTS.md:52-53` (loaded through `CLAUDE.md`): "The test cases in `test-cases/` are read-only. Never change a test case. If a test case looks wrong, say so. Let the human change it." Also `.claude/rules/project-base.md:17`.
  - It asks: is the move intended, or is it a bug? For a bug, it offers a draft bug report. For an intended change, it asks for new test cases first.
  - Its message says that 3 of 5 tests are green again. The measurement gives 2 of 5. It ran only the folders `basket` and `checkout`, not the whole suite.

### The tool-call audits

| Session | Suite | Tool calls | Forbidden | Cross-session | Outside |
|---|---|---|---|---|---|
| `e6ce8f22-aa31-4355-80e6-2e0819385082` | A | 40 | 0 | 0 | 0 |
| `7ae9e5c6-6702-4c6d-9daf-174a4bc589ce` | B | 25 | 0 | 0 | 1 (`/tmp/check.log`, a denied call: it did not run) |

Denied calls: A 4, B 5. 7 of the 9 needed an approval because they are outside the allowed list (`curl`, `sed -i`, `sed -n` with a range, a redirect to `/tmp`). The safety checks of the CLI stopped 2 (a glob in a file path, and a shell variable).

## Reading

- By the frozen rules, both hypotheses of E5b have support: H5b.1 with the mark "equal", and H5b.2 with 0 findings on both sides.
- The frozen metrics do not measure one difference that we saw. It is exploratory, with n = 1:
  - A fix that makes the code follow the UI makes the suite green on that change, bug or not. This is true for A on patches 01 and 03, and for B on patch 01.
  - A then also changed the test cases. This removes the mismatch between the code and the test cases that a reviewer could see. A told the person about these edits, after it made them.
  - B did not change the test cases. It asked a person before it made a change for patch 03. It did not ask before its change for patch 01.
- The E5b design treats each UI patch as an intended release (`sealed-ui/ui-patches.md`), and the prompt asks for a fix. By that design, A finished the task, and B did not: 3 tests of B stay red until a person writes new test cases.
- Thus the difference is a trade-off, not a win for one side. A gives green tests at once and moves the change of the specification to a later review. B keeps the specification as it is, and asks for a decision of a person first.

## Limits

- n = 1 for each suite and each patch.
- The prompt of the fix does not say if the change of the UI is intended.
- The fix of B is not complete: 3 of 5 broken tests need a decision of a person and one more fix step. E5b does not measure this step.
- The lint rules of B forbid some patterns that `weakening()` finds, for example `waitForTimeout`. Thus a part of the result of B in H5b.2 can come from its lint (`bench/hypotheses-v2.md`, the limits).
- `weakening()` does not find a check in a try/catch block, a helper that does not check, or a locator that finds a different element.
- The fix sessions used the same model as the writer of the suites.
