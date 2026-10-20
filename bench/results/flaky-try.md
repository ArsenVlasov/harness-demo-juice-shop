# Flaky tests (flaky-try)

Source: `bench/run-flaky.mjs`, 2026-10-20T07:00:14.305Z. 2 runs of each test, app restart every 1 runs, `--retries=0`.

| Suite | Tests | Test runs | Stable | Flaky | Broken |
|---|---|---|---|---|---|
| A | 8 | 16 | 8 | 0 | 0 |
| B | 8 | 16 | 8 | 0 | 0 |

| Suite | TC | Test | Passed | Failed | Verdict |
|---|---|---|---|---|---|
| A | TC-01 | `TC-01-login.spec.ts :: TC-01: Login with a valid and an invalid password > TC-01` | 2 | 0 | stable |
| A | TC-02 | `TC-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > TC-02` | 2 | 0 | stable |
| A | TC-03 | `TC-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket > TC-03` | 2 | 0 | stable |
| A | TC-04 | `TC-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > TC-04` | 2 | 0 | stable |
| A | TC-05 | `TC-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > TC-05` | 2 | 0 | stable |
| A | TC-06 | `TC-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > TC-06` | 2 | 0 | stable |
| A | TC-07 | `TC-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > TC-07` | 2 | 0 | stable |
| A | TC-08 | `TC-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet > TC-08` | 2 | 0 | stable |
| B | TC-01 | `specs/regression/auth/login.spec.ts :: Login with a valid and an invalid password` | 2 | 0 | stable |
| B | TC-02 | `specs/regression/basket/add-to-basket.spec.ts :: Add a product to the basket` | 2 | 0 | stable |
| B | TC-03 | `specs/regression/basket/basket-quantity-and-remove.spec.ts :: Change the quantity and remove a product in the basket` | 2 | 0 | stable |
| B | TC-04 | `specs/regression/basket/purchase-limit.spec.ts :: Purchase limit for one product` | 2 | 0 | stable |
| B | TC-07 | `specs/regression/checkout/card-order.spec.ts :: Order with a card, from basket to order history` | 2 | 0 | stable |
| B | TC-06 | `specs/regression/coupon/invalid-and-expired-coupon.spec.ts :: Invalid coupon and expired coupon` | 2 | 0 | stable |
| B | TC-05 | `specs/regression/coupon/valid-coupon.spec.ts :: Valid coupon on the payment step` | 2 | 0 | stable |
| B | TC-08 | `specs/regression/wallet/wallet-payment.spec.ts :: Payment with the wallet` | 2 | 0 | stable |
