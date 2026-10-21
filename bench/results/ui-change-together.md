# UI change and repair (ui-change-together)

Source: `bench/run-ui-change.mjs`, 2026-10-21T19:53:54.931Z. Status: complete.
Mode: together. Runs of each test on each app state: 3. Patches in the order of application: `01-rename-add-to-basket-button.patch`, `02-login-form-layout.patch`, `03-move-coupon-to-basket.patch`, `04-rename-place-order-button.patch`.

| Suite | Path | Ref | Commit |
|---|---|---|---|
| A | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-1/run-1/suite-a` | `gen-1` | `f7d78f03682f` |
| B | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-1/run-1/suite-b` | `gen-1` | `12286c65dfb0` |

A broken test passes in all runs on the clean app and fails in all runs on the app with the change.
An unstable test passes in all runs on the clean app and fails only in some runs with the change. An unstable test is not broken.

| Change | Suite | Tests | Green on the clean app | Broken | Unstable |
|---|---|---|---|---|---|
| all | A | 8 | 8 | 5 | 0 |
| all | B | 8 | 8 | 5 | 0 |

| Change | Suite | Broken tests | Unstable tests |
|---|---|---|---|
| all | A | `TC-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > TC-02`<br>`TC-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > TC-04`<br>`TC-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > TC-05`<br>`TC-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > TC-06`<br>`TC-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > TC-07` | none |
| all | B | `specs/regression/basket/add-to-basket.spec.ts :: Add a product to the basket`<br>`specs/regression/basket/purchase-limit.spec.ts :: Purchase limit for one product`<br>`specs/regression/checkout/card-order.spec.ts :: Order with a card, from basket to order history`<br>`specs/regression/coupon/invalid-and-expired-coupon.spec.ts :: Invalid coupon and expired coupon`<br>`specs/regression/coupon/valid-coupon.spec.ts :: Valid coupon on the payment step` | none |

## Repair

Prompt: `bench/prompt-repair.txt`. Model: `claude-opus-5-5`. Budget: 10 USD.
Isolation: Before the first repair, git apply -R put back the source of juice-shop/. The build (frontend/dist, build/) kept the change, so the app showed the change, but juice-shop/ had no diff.
The work time is the wall time of `bench/claude-locked.sh`. A suite with no broken tests gets no repair.
A missing test passes on the clean app, but the copy does not have it after the repair.

The assertion calls, the value checks and the weakening findings come from `bench/weakening.mjs` on the code files of the diff.
They are pattern and count checks. Thus also read the diff. These checks do not find a check in a try/catch block.
They also do not find a helper that does not check, or a locator that finds a different element.
Do not compare the counts of two suites: `expect(x).toHaveText(t)` is 2 calls, and a wrapper call such as `expectText(x, t)` is 1 call.

| Suite | Cost, USD | Work time, min | Repaired | Still broken | Unstable | New red | Missing | Assertion calls added / removed | Value checks added / removed | Weakening findings |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 1.0601524 | 4.9 | 4 of 5 | 0 | 0 | 0 | 1 | 24 / 20 | 7 / 6 | 0 |
| B | 0.8262537999999999 | 3.4 | 2 of 5 | 3 | 0 | 0 | 0 | 1 / 1 | 0 / 0 | 0 |

### Suite A

- Copy: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/maintenance/ui-change-together/A`. node_modules: npm ci --offline. Tag: `ui-change-together-A-repair`. Exit code of claude-locked.sh: 0 (success). Session: `e6ce8f22-aa31-4355-80e6-2e0819385082`.
- After the repair, 8 of 8 tests pass in all runs on the app with the change.
- Still broken: none.
- Unstable: none.
- New red: none.
- Missing: `TC-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > TC-05`.
- New tests: `TC-05-valid-coupon.spec.ts :: TC-05: Valid coupon in the basket > TC-05`.
- Changed files: `test-cases/README.md`, `test-cases/TC-02-add-to-basket.md`, `test-cases/TC-04-purchase-limit.md`, `test-cases/TC-05-valid-coupon.md`, `test-cases/TC-06-invalid-and-expired-coupon.md`, `test-cases/TC-07-card-order-end-to-end.md`, `tests/TC-05-valid-coupon.spec.ts`, `tests/TC-06-invalid-and-expired-coupon.spec.ts`, `tests/TC-07-card-order-end-to-end.spec.ts`, `tests/pages/basket-page.ts`, `tests/pages/payment-page.ts`, `tests/pages/product-list-page.ts`.
- Diff: `bench/results/ui-change-together/repair-A.diff`. Code part of the diff: `bench/results/ui-change-together/repair-A.code.diff`.

Weakening findings: none.

### Suite B

- Copy: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/maintenance/ui-change-together/B`. node_modules: npm ci --offline. Tag: `ui-change-together-B-repair`. Exit code of claude-locked.sh: 0 (success). Session: `7ae9e5c6-6702-4c6d-9daf-174a4bc589ce`.
- After the repair, 5 of 8 tests pass in all runs on the app with the change.
- Still broken: `specs/regression/checkout/card-order.spec.ts :: Order with a card, from basket to order history`, `specs/regression/coupon/invalid-and-expired-coupon.spec.ts :: Invalid coupon and expired coupon`, `specs/regression/coupon/valid-coupon.spec.ts :: Valid coupon on the payment step`.
- Unstable: none.
- New red: none.
- Missing: none.
- New tests: none.
- Changed files: `page-objects/search-page.ts`.
- Diff: `bench/results/ui-change-together/repair-B.diff`. Code part of the diff: `bench/results/ui-change-together/repair-B.code.diff`.

Weakening findings: none.
