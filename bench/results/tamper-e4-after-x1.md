# Tamper audit (tamper-e4-after-x1)

Source: `bench/run-audit-tamper.mjs`, 2026-10-21T13:21:45.184Z.
Suite client: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-q`, commit 2fbd06d55dc0, tags fixed.
Rules: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/tamper-rules.json`, sha256 `ebca83b3b167f65720a0c411df7206c0e411c17a9548a0e42f4c572b1c5d8027`. The proxy changes only the responses to browser requests.
Run with no rule: 8 tests passed, 564 browser requests went through the proxy.
Recheck: 3 more runs with no rule. A failed test is a catch only when it passed each recheck run.

| Rule | Changed value | Verdict | Tests where it fired | Of them failed | Matched, not changed |
|---|---|---|---|---|---|
| T01-a | the price of a product in the product list | caught | 8 | 1 | 0 |
| T02-a | the price of a product in the basket | caught | 7 | 7 | 6 |
| T03-a | the quantity of a basket item, also the source of the basket counter | caught | 7 | 7 | 7 |
| T04-a | the price of each delivery speed in the list | caught | 4 | 1 | 0 |
| T04-b | the price of the selected delivery speed | caught | 4 | 4 | 0 |
| T05-a | the discount percentage of the coupon | caught | 2 | 2 | 2 |
| T06-a | the total price of the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T07-a | the quantity of a product in the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T08-a | the line Delivery of the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T08-b | the line Promotion of the saved order on the confirmation page | caught | 2 | 1 | 0 |
| T09-a | the total price of an order in the order history | caught | 2 | 2 | 1 |
| T10-a | the quantity of a product in the order history | caught | 2 | 1 | 1 |
| T11-a | the order ID in the order history | caught | 2 | 1 | 1 |
| T12-a | the bonus points of an order in the order history | caught | 2 | 1 | 1 |
| T13-a | the wallet balance | caught | 4 | 1 | 0 |
| T14-a | the email of the customer in the session | caught | 8 | 1 | 9 |
| T14-b | the email of the customer in the session, email-only query | survived | 8 | 0 | 9 |
| T15-b | the error text You can order only up to 5 items of this product. | caught | 1 | 1 | 8 |
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
| `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password` | TC-01 | passed | 1 | GET /rest/user/whoami?fields=email: user.email "tc-01-1792588677920-6hjmpr@example.test" to "mut@example.test" |
| `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket` | TC-02 | passed | 2 | GET /rest/user/whoami?fields=email: user.email "tc-02-1792588679632-po9h84@example.test" to "mut@example.test" |
| `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket` | TC-03 | passed | 4 | GET /rest/user/whoami?fields=email: user.email "tc-03-1792588680982-csn4r5@example.test" to "mut@example.test" |
| `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product` | TC-04 | passed | 4 | GET /rest/user/whoami?fields=email: user.email "tc-04-1792588683328-5w90bx@example.test" to "mut@example.test" |
| `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step` | TC-05 | passed | 3 | GET /rest/user/whoami?fields=email: user.email "tc-05-1792588686582-dlbmar@example.test" to "mut@example.test" |
| `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon` | TC-06 | passed | 3 | GET /rest/user/whoami?fields=email: user.email "tc-06-1792588688731-6q6orx@example.test" to "mut@example.test" |
| `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history` | TC-07 | passed | 4 | GET /rest/user/whoami?fields=email: user.email "tc-07-1792588690483-8wh7r2@example.test" to "mut@example.test" |
| `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet` | TC-08 | passed | 4 | GET /rest/user/whoami?fields=email: user.email "tc-08-1792588693973-c0kzgj@example.test" to "mut@example.test" |

### T15-d: the error text Invalid coupon.

Change: `set "MUT"` on `INVALID_COUPON`, method GET, path `^/assets/i18n/en\.json$`.

| Test | TC | Result | Changed responses | First change |
|---|---|---|---|---|
| `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password` | TC-01 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket` | TC-02 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the basket` | TC-03 | passed | 2 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product` | TC-04 | passed | 2 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step` | TC-05 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon` | TC-06 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history` | TC-07 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
| `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet` | TC-08 | passed | 1 | GET /assets/i18n/en.json: INVALID_COUPON "Invalid coupon." to "MUT" |
