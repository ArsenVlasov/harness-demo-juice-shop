# UI change and repair (ui-change-each)

Source: `bench/run-ui-change.mjs`, 2026-10-21T19:38:55.240Z. Status: complete.
Mode: each. Runs of each test on each app state: 3. Patches in the order of application: `01-rename-add-to-basket-button.patch`, `02-login-form-layout.patch`, `03-move-coupon-to-basket.patch`, `04-rename-place-order-button.patch`.

| Suite | Path | Ref | Commit |
|---|---|---|---|
| A | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-1/run-1/suite-a` | `gen-1` | `f7d78f03682f` |
| B | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-1/run-1/suite-b` | `gen-1` | `12286c65dfb0` |

A broken test passes in all runs on the clean app and fails in all runs on the app with the change.
An unstable test passes in all runs on the clean app and fails only in some runs with the change. An unstable test is not broken.

| Change | Suite | Tests | Green on the clean app | Broken | Unstable |
|---|---|---|---|---|---|
| 01-rename-add-to-basket-button | A | 8 | 8 | 3 | 0 |
| 01-rename-add-to-basket-button | B | 8 | 8 | 3 | 0 |
| 02-login-form-layout | A | 8 | 8 | 0 | 0 |
| 02-login-form-layout | B | 8 | 8 | 0 | 0 |
| 03-move-coupon-to-basket | A | 8 | 8 | 3 | 0 |
| 03-move-coupon-to-basket | B | 8 | 8 | 3 | 0 |
| 04-rename-place-order-button | A | 8 | 8 | 0 | 0 |
| 04-rename-place-order-button | B | 8 | 8 | 0 | 0 |

| Change | Suite | Broken tests | Unstable tests |
|---|---|---|---|
| 01-rename-add-to-basket-button | A | `TC-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > TC-02`<br>`TC-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > TC-04`<br>`TC-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > TC-07` | none |
| 01-rename-add-to-basket-button | B | `specs/regression/basket/add-to-basket.spec.ts :: Add a product to the basket`<br>`specs/regression/basket/purchase-limit.spec.ts :: Purchase limit for one product`<br>`specs/regression/checkout/card-order.spec.ts :: Order with a card, from basket to order history` | none |
| 02-login-form-layout | A | none | none |
| 02-login-form-layout | B | none | none |
| 03-move-coupon-to-basket | A | `TC-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > TC-05`<br>`TC-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > TC-06`<br>`TC-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > TC-07` | none |
| 03-move-coupon-to-basket | B | `specs/regression/checkout/card-order.spec.ts :: Order with a card, from basket to order history`<br>`specs/regression/coupon/invalid-and-expired-coupon.spec.ts :: Invalid coupon and expired coupon`<br>`specs/regression/coupon/valid-coupon.spec.ts :: Valid coupon on the payment step` | none |
| 04-rename-place-order-button | A | none | none |
| 04-rename-place-order-button | B | none | none |
