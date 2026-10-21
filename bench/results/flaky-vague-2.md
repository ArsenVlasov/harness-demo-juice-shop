# Flaky tests (flaky-vague-2)

Source: `bench/run-flaky.mjs`, 2026-10-21T10:00:51.659Z. 20 runs of each test, app restart every 5 runs, `--retries=0`.

| Suite | Tests | Test runs | Stable | Flaky | Broken |
|---|---|---|---|---|---|
| A | 8 | 160 | 8 | 0 | 0 |
| B | 8 | 160 | 8 | 0 | 0 |

| Suite | TC | Test | Passed | Failed | Verdict |
|---|---|---|---|---|---|
| A | TC-01 | `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password > TC-01 login fails with a wrong password and works with the correct one` | 20 | 0 | stable |
| A | TC-02 | `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > TC-02 product added from the product list shows in the basket` | 20 | 0 | stable |
| A | TC-03 | `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket > TC-03 plus, minus and trash buttons update the basket` | 20 | 0 | stable |
| A | TC-04 | `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > TC-04 basket holds at most the limit of a limited product` | 20 | 0 | stable |
| A | TC-05 | `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > TC-05 coupon of the current month lowers the price of the products` | 20 | 0 | stable |
| A | TC-06 | `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > TC-06 invalid and expired coupons give no discount` | 20 | 0 | stable |
| A | TC-07 | `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > TC-07 card order with a coupon reaches the order history` | 20 | 0 | stable |
| A | TC-08 | `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet > TC-08 wallet pays only when it holds the order total` | 20 | 0 | stable |
| B | TC-02 | `specs/regression/basket/add-to-basket.spec.ts :: Add a product to the basket` | 20 | 0 | stable |
| B | TC-03 | `specs/regression/basket/basket-quantity.spec.ts :: Change the quantity and remove a product in the basket` | 20 | 0 | stable |
| B | TC-04 | `specs/regression/basket/purchase-limit.spec.ts :: Purchase limit for one product` | 20 | 0 | stable |
| B | TC-01 | `specs/regression/login/login.spec.ts :: Login with a valid and an invalid password` | 20 | 0 | stable |
| B | TC-07 | `specs/regression/order/card-order.spec.ts :: Order with a card, from basket to order history` | 20 | 0 | stable |
| B | TC-06 | `specs/regression/payment/invalid-coupon.spec.ts :: Invalid coupon and expired coupon` | 20 | 0 | stable |
| B | TC-05 | `specs/regression/payment/valid-coupon.spec.ts :: Valid coupon on the payment step` | 20 | 0 | stable |
| B | TC-08 | `specs/regression/payment/wallet-payment.spec.ts :: Payment with the wallet` | 20 | 0 | stable |
