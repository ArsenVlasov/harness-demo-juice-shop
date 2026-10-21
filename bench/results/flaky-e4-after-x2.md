# Flaky tests (flaky-e4-after-x2)

Source: `bench/run-flaky.mjs`, 2026-10-21T13:46:52.145Z. 20 runs of each test, app restart every 5 runs, `--retries=0`.

| Suite | Tests | Test runs | Stable | Flaky | Broken |
|---|---|---|---|---|---|
| after | 8 | 160 | 8 | 0 | 0 |

| Suite | TC | Test | Passed | Failed | Verdict |
|---|---|---|---|---|---|
| after | TC-02 | `add-to-basket.spec.ts :: Add a product to the basket > add one product and check the basket` | 20 | 0 | stable |
| after | TC-03 | `basket-quantity-and-remove.spec.ts :: Change the quantity and remove a product in the basket > change the quantity and remove product A` | 20 | 0 | stable |
| after | TC-07 | `card-order-end-to-end.spec.ts :: Order with a card, from basket to order history > order two products with a card and find the order in the history` | 20 | 0 | stable |
| after | TC-06 | `invalid-and-expired-coupon.spec.ts :: Invalid coupon and expired coupon > neither an invalid code nor an expired coupon gives a discount` | 20 | 0 | stable |
| after | TC-01 | `login.spec.ts :: Login with a valid and an invalid password > login with a wrong and then a correct password` | 20 | 0 | stable |
| after | TC-04 | `purchase-limit.spec.ts :: Purchase limit for one product > the basket stops at 5 items of one product` | 20 | 0 | stable |
| after | TC-05 | `valid-coupon.spec.ts :: Valid coupon on the payment step > the 10% coupon of the current month reduces the items only` | 20 | 0 | stable |
| after | TC-08 | `wallet-payment.spec.ts :: Payment with the wallet > the wallet cannot pay a short balance and pays the exact total` | 20 | 0 | stable |
