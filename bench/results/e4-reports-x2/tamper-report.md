# Tamper audit (tamper-x2)

Run with no rule: 8 tests passed, 557 browser requests went through the proxy.
Recheck: 3 more runs with no rule. A failed test is a catch only when it passed each recheck run.

| Rule | Changed value | Verdict | Tests where it fired | Of them failed | Matched, not changed |
|---|---|---|---|---|---|
| T01-a | the price of a product in the product list | caught | 7 | 1 | 0 |
| T02-a | the price of a product in the basket | caught | 7 | 7 | 14 |
| T03-a | the quantity of a basket item, also the source of the basket counter | caught | 7 | 7 | 15 |
| T04-a | the price of each delivery speed in the list | caught | 4 | 1 | 0 |
| T04-b | the price of the selected delivery speed | caught | 4 | 4 | 0 |
| T05-a | the discount percentage of the coupon | caught | 2 | 2 | 2 |
| T06-a | the total price of the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T07-a | the quantity of a product in the saved order on the confirmation page | survived | 2 | 0 | 0 |
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

Rules: 22. Caught: 19. Survived: 3. Not exercised: 0. Invalid: 0.

## Survived rules

No test caught these changed values.

### T07-a: the quantity of a product in the saved order on the confirmation page

Change: `add 1` on `data[*].products[*].quantity`, method GET, path `^/rest/track-order/[^/?]+$`.

| Test | TC | Result | Changed responses | First change |
|---|---|---|---|---|
| `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > order two products with a card and find the order in the history` |  | passed | 1 | GET /rest/track-order/6957-ab6919b1bc5cc0f6: data[0].products[0].quantity 2 to 3 |
| `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet > the wallet cannot pay a short balance and pays the exact total` |  | passed | 1 | GET /rest/track-order/c59d-2ad5ecd65f276dda: data[0].products[0].quantity 1 to 2 |

### T14-b: the email of the customer in the session, email-only query

Change: `set "mut@example.test"` on `user.email`, method GET, path `^/rest/user/whoami\?fields=email$`.

| Test | TC | Result | Changed responses | First change |
|---|---|---|---|---|
| `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password > login with a wrong and then a correct password` |  | passed | 1 | GET /rest/user/whoami?fields=email: user.email "tc-1792582900154-b5b80656@example.test" to "mut@example.test" |
| `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > add one product and check the basket` |  | passed | 2 | GET /rest/user/whoami?fields=email: user.email "tc-1792582901534-59daa4e0@example.test" to "mut@example.test" |
| `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket > change the quantity and remove product A` |  | passed | 2 | GET /rest/user/whoami?fields=email: user.email "tc-1792582902789-0c3089a6@example.test" to "mut@example.test" |
| `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > the basket stops at 5 items of one product` |  | passed | 2 | GET /rest/user/whoami?fields=email: user.email "tc-1792582904553-76fb8b09@example.test" to "mut@example.test" |
| `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > the 10% coupon of the current month reduces the items only` |  | passed | 3 | GET /rest/user/whoami?fields=email: user.email "tc-1792582906469-3d947016@example.test" to "mut@example.test" |
| `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > neither an invalid code nor an expired coupon gives a discount` |  | passed | 3 | GET /rest/user/whoami?fields=email: user.email "tc-1792582908537-beb88c21@example.test" to "mut@example.test" |
| `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > order two products with a card and find the order in the history` |  | passed | 4 | GET /rest/user/whoami?fields=email: user.email "tc-1792582910720-75f0e87b@example.test" to "mut@example.test" |
| `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet > the wallet cannot pay a short balance and pays the exact total` |  | passed | 4 | GET /rest/user/whoami?fields=email: user.email "tc-1792582913680-582bc295@example.test" to "mut@example.test" |

### T15-d: the error text Invalid coupon.

Change: `set "MUT"` on `INVALID_COUPON`, method GET, path `^/assets/i18n/en\.json$`.

| Test | TC | Result | Changed responses | First change |
|---|---|---|---|---|
| `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password > login with a wrong and then a correct password` |  | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > add one product and check the basket` |  | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket > change the quantity and remove product A` |  | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > the basket stops at 5 items of one product` |  | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > the 10% coupon of the current month reduces the items only` |  | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > neither an invalid code nor an expired coupon gives a discount` |  | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > order two products with a card and find the order in the history` |  | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet > the wallet cannot pay a short balance and pays the exact total` |  | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
