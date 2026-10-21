# Flaky tests (flaky-vague-3)

Source: `bench/run-flaky.mjs`, 2026-10-21T10:23:30.147Z. 20 runs of each test, app restart every 5 runs, `--retries=0`.

| Suite | Tests | Test runs | Stable | Flaky | Broken |
|---|---|---|---|---|---|
| A | 8 | 160 | 6 | 2 | 0 |
| B | 8 | 160 | 8 | 0 | 0 |

| Suite | TC | Test | Passed | Failed | Verdict |
|---|---|---|---|---|---|
| A | TC-01 | `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password` | 20 | 0 | stable |
| A | TC-02 | `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket` | 12 | 8 | flaky |
| A | TC-03 | `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket` | 20 | 0 | stable |
| A | TC-04 | `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product` | 13 | 7 | flaky |
| A | TC-05 | `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step` | 20 | 0 | stable |
| A | TC-06 | `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon` | 20 | 0 | stable |
| A | TC-07 | `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history` | 20 | 0 | stable |
| A | TC-08 | `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet` | 20 | 0 | stable |
| B | TC-01 | `specs/regression/auth/login.spec.ts :: Login with a wrong password fails and with the correct password opens the shop` | 20 | 0 | stable |
| B | TC-02 | `specs/regression/basket/add-to-basket.spec.ts :: Add a product to an empty basket from the product list` | 20 | 0 | stable |
| B | TC-03 | `specs/regression/basket/basket-quantity.spec.ts :: Change the quantity of a product and remove it from the basket` | 20 | 0 | stable |
| B | TC-04 | `specs/regression/basket/purchase-limit.spec.ts :: A basket holds no more items of a product than its purchase limit` | 20 | 0 | stable |
| B | TC-07 | `specs/regression/checkout/card-order.spec.ts :: Order with a card and a coupon, from the basket to the order history` | 20 | 0 | stable |
| B | TC-06 | `specs/regression/coupon/invalid-coupon.spec.ts :: An invalid code and a coupon of the previous month give no discount` | 20 | 0 | stable |
| B | TC-05 | `specs/regression/coupon/valid-coupon.spec.ts :: A coupon of the current month lowers the price of the products` | 20 | 0 | stable |
| B | TC-08 | `specs/regression/wallet/wallet-payment.spec.ts :: Pay an order with the wallet only when the balance covers the total` | 20 | 0 | stable |
