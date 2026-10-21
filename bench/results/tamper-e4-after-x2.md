# Tamper audit (tamper-e4-after-x2)

Source: `bench/run-audit-tamper.mjs`, 2026-10-21T14:07:35.026Z.
Suite client: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-s`, commit d67bf601809c, tags fixed.
Rules: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/tamper-rules.json`, sha256 `ebca83b3b167f65720a0c411df7206c0e411c17a9548a0e42f4c572b1c5d8027`. The proxy changes only the responses to browser requests.
Run with no rule: 8 tests passed, 560 browser requests went through the proxy.
Recheck: 3 more runs with no rule. A failed test is a catch only when it passed each recheck run.

| Rule | Changed value | Verdict | Tests where it fired | Of them failed | Matched, not changed |
|---|---|---|---|---|---|
| T01-a | the price of a product in the product list | caught | 8 | 1 | 0 |
| T02-a | the price of a product in the basket | caught | 7 | 7 | 15 |
| T03-a | the quantity of a basket item, also the source of the basket counter | caught | 7 | 7 | 15 |
| T04-a | the price of each delivery speed in the list | caught | 4 | 1 | 0 |
| T04-b | the price of the selected delivery speed | caught | 4 | 4 | 0 |
| T05-a | the discount percentage of the coupon | caught | 2 | 2 | 2 |
| T06-a | the total price of the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T07-a | the quantity of a product in the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T08-a | the line Delivery of the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T08-b | the line Promotion of the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T09-a | the total price of an order in the order history | caught | 2 | 2 | 1 |
| T10-a | the quantity of a product in the order history | caught | 2 | 1 | 1 |
| T11-a | the order ID in the order history | caught | 2 | 2 | 1 |
| T12-a | the bonus points of an order in the order history | caught | 2 | 1 | 1 |
| T13-a | the wallet balance | caught | 4 | 1 | 0 |
| T14-a | the email of the customer in the session | caught | 8 | 1 | 9 |
| T14-b | the email of the customer in the session, email-only query | survived | 8 | 0 | 9 |
| T15-b | the error text You can order only up to 5 items of this product. | caught | 1 | 1 | 10 |
| T15-d | the error text Invalid coupon. | survived | 8 | 0 | 0 |
| T15-e | the message text Thank you for your purchase! | caught | 8 | 2 | 0 |
| T15-f | the message text You have not placed any orders yet. | caught | 8 | 1 | 0 |
| T16-a | the name of the payment method Digital Wallet | caught | 8 | 1 | 0 |

Rules: 22. Caught: 20. Survived: 2. Not exercised: 0. Invalid: 0.

## Survived rules

No test caught these changed values.

### T14-b: the email of the customer in the session, email-only query

Change: `set "mut@example.test"` on `user.email`, method GET, path `^/rest/user/whoami\?fields=email$`.

| Test | TC | Result | Changed responses | First change |
|---|---|---|---|---|
| `add-to-basket.spec.ts :: Add a product to the basket > add one product and check the basket` | TC-02 | passed | 2 | GET /rest/user/whoami?fields=email: user.email "tc-1792591388996-669241bf@example.test" to "mut@example.test" |
| `basket-quantity-and-remove.spec.ts :: Change the quantity and remove a product in the basket > change the quantity and remove product A` | TC-03 | passed | 2 | GET /rest/user/whoami?fields=email: user.email "tc-1792591390256-17911775@example.test" to "mut@example.test" |
| `card-order-end-to-end.spec.ts :: Order with a card, from basket to order history > order two products with a card and find the order in the history` | TC-07 | passed | 4 | GET /rest/user/whoami?fields=email: user.email "tc-1792591392307-90878895@example.test" to "mut@example.test" |
| `invalid-and-expired-coupon.spec.ts :: Invalid coupon and expired coupon > neither an invalid code nor an expired coupon gives a discount` | TC-06 | passed | 3 | GET /rest/user/whoami?fields=email: user.email "tc-1792591395336-a4d6d287@example.test" to "mut@example.test" |
| `login.spec.ts :: Login with a valid and an invalid password > login with a wrong and then a correct password` | TC-01 | passed | 1 | GET /rest/user/whoami?fields=email: user.email "tc-1792591397288-d5306e27@example.test" to "mut@example.test" |
| `purchase-limit.spec.ts :: Purchase limit for one product > the basket stops at 5 items of one product` | TC-04 | passed | 2 | GET /rest/user/whoami?fields=email: user.email "tc-1792591398584-db0ef5d0@example.test" to "mut@example.test" |
| `valid-coupon.spec.ts :: Valid coupon on the payment step > the 10% coupon of the current month reduces the items only` | TC-05 | passed | 3 | GET /rest/user/whoami?fields=email: user.email "tc-1792591406010-f50c8cb0@example.test" to "mut@example.test" |
| `wallet-payment.spec.ts :: Payment with the wallet > the wallet cannot pay a short balance and pays the exact total` | TC-08 | passed | 4 | GET /rest/user/whoami?fields=email: user.email "tc-1792591407897-bcec5028@example.test" to "mut@example.test" |

### T15-d: the error text Invalid coupon.

Change: `set "MUT"` on `INVALID_COUPON`, method GET, path `^/assets/i18n/en\.json$`.

| Test | TC | Result | Changed responses | First change |
|---|---|---|---|---|
| `add-to-basket.spec.ts :: Add a product to the basket > add one product and check the basket` | TC-02 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `basket-quantity-and-remove.spec.ts :: Change the quantity and remove a product in the basket > change the quantity and remove product A` | TC-03 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `card-order-end-to-end.spec.ts :: Order with a card, from basket to order history > order two products with a card and find the order in the history` | TC-07 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `invalid-and-expired-coupon.spec.ts :: Invalid coupon and expired coupon > neither an invalid code nor an expired coupon gives a discount` | TC-06 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `login.spec.ts :: Login with a valid and an invalid password > login with a wrong and then a correct password` | TC-01 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `purchase-limit.spec.ts :: Purchase limit for one product > the basket stops at 5 items of one product` | TC-04 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `valid-coupon.spec.ts :: Valid coupon on the payment step > the 10% coupon of the current month reduces the items only` | TC-05 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `wallet-payment.spec.ts :: Payment with the wallet > the wallet cannot pay a short balance and pays the exact total` | TC-08 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
