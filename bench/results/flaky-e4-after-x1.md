# Flaky tests (flaky-e4-after-x1)

Source: `bench/run-flaky.mjs`, 2026-10-21T13:00:17.349Z. 20 runs of each test, app restart every 5 runs, `--retries=0`.

| Suite | Tests | Test runs | Stable | Flaky | Broken |
|---|---|---|---|---|---|
| after | 8 | 160 | 8 | 0 | 0 |

| Suite | TC | Test | Passed | Failed | Verdict |
|---|---|---|---|---|---|
| after | TC-01 | `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password` | 20 | 0 | stable |
| after | TC-02 | `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket` | 20 | 0 | stable |
| after | TC-03 | `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket` | 20 | 0 | stable |
| after | TC-04 | `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product` | 20 | 0 | stable |
| after | TC-05 | `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step` | 20 | 0 | stable |
| after | TC-06 | `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon` | 20 | 0 | stable |
| after | TC-07 | `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history` | 20 | 0 | stable |
| after | TC-08 | `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet` | 20 | 0 | stable |
