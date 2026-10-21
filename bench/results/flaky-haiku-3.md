# Flaky tests (flaky-haiku-3)

Source: `bench/run-flaky.mjs`, 2026-10-21T09:35:55.595Z. 20 runs of each test, app restart every 5 runs, `--retries=0`.

| Suite | Tests | Test runs | Stable | Flaky | Broken |
|---|---|---|---|---|---|
| A | 8 | 160 | 7 | 1 | 0 |
| B | 8 | 160 | 8 | 0 | 0 |

| Suite | TC | Test | Passed | Failed | Verdict |
|---|---|---|---|---|---|
| A | null | `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password > login with a wrong and then a correct password` | 20 | 0 | stable |
| A | null | `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > add one product and check the basket` | 20 | 0 | stable |
| A | null | `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket > change the quantity and remove product A` | 20 | 0 | stable |
| A | null | `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > the basket stops at 5 items of one product` | 20 | 0 | stable |
| A | null | `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > the 10% coupon of the current month reduces the items only` | 20 | 0 | stable |
| A | null | `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > neither an invalid code nor an expired coupon gives a discount` | 20 | 0 | stable |
| A | null | `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > order two products with a card and find the order in the history` | 10 | 10 | flaky |
| A | null | `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet > the wallet cannot pay a short balance and pays the exact total` | 20 | 0 | stable |
| B | TC-01 | `specs/regression/auth/login.spec.ts :: Login with a customer account > Login with a valid and an invalid password` | 20 | 0 | stable |
| B | TC-02 | `specs/regression/basket/add-to-basket.spec.ts :: Add a product to the basket > Add a product to the basket from the product list` | 20 | 0 | stable |
| B | TC-03 | `specs/regression/basket/basket-quantity.spec.ts :: Change the quantity and remove a product in the basket > Change the quantity and remove a product in the basket` | 20 | 0 | stable |
| B | TC-04 | `specs/regression/basket/purchase-limit.spec.ts :: Purchase limit for one product > Purchase limit for one product in the basket` | 20 | 0 | stable |
| B | TC-07 | `specs/regression/checkout/card-order.spec.ts :: Order with a card, from basket to order history > Order two Eggfruit Juice and one Carrot Juice with a card and a coupon` | 20 | 0 | stable |
| B | TC-06 | `specs/regression/coupon/invalid-coupon.spec.ts :: Invalid coupon and expired coupon > Invalid and expired coupons give no discount on the payment step` | 20 | 0 | stable |
| B | TC-05 | `specs/regression/coupon/valid-coupon.spec.ts :: Valid coupon on the payment step > Valid coupon of the current month gives the discount on the products` | 20 | 0 | stable |
| B | TC-08 | `specs/regression/wallet/wallet-payment.spec.ts :: Payment with the wallet > Pay with the wallet only when the balance covers the order total` | 20 | 0 | stable |
