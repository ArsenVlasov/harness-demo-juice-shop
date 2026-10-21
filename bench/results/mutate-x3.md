# Expectation mutation audit: client

Source: `bench/run-audit-mutate.mjs`, 2026-10-21T14:58:54.127Z. Suite: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-a` at `gen-2` (c9f7d3e2a754). TypeScript 5.9.3.
The app restarts before the baseline, before the first mutant and after each 5 mutants.

Sites: 53. Mutants: 53. Killed: 51. Survived: 2. Error: 0. Skipped: 0.
A mutant that survives shows a weak check.
A failed test kills a mutant only when the test passes again on the original file.

## Tests

A killed mutant counts for the tests that killed it.
Any other mutant counts for the selected tests that run the code of its site.
The call graph uses the declarations that TypeScript finds, the fixtures and the hooks.
If no selected test runs the code, the mutant counts for the row `(unattributed)`.

| ID | Test | Sites | Killed | Survived | Error |
|---|---|---|---|---|---|
| T01 | `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password > TC-01 login fails with a ` | 5 | 5 | 0 | 0 |
| T02 | `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > TC-02 product added from the pro` | 7 | 7 | 0 | 0 |
| T03 | `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the b` | 15 | 13 | 2 | 0 |
| T04 | `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > TC-04 basket holds at most t` | 4 | 4 | 0 | 0 |
| T05 | `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > TC-05 coupon of the current ` | 5 | 5 | 0 | 0 |
| T06 | `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > TC-06 invalid` | 7 | 7 | 0 | 0 |
| T07 | `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > TC-0` | 10 | 10 | 0 | 0 |
| T08 | `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet > TC-08 wallet pays only when it hold` | 13 | 13 | 0 | 0 |

## Mutants

| ID | Site | Function | Original | Mutated | Tests | Status |
|---|---|---|---|---|---|---|
| S001 | `helpers/api.ts:27` | `registerCustomer` | `201` | `202` | failed: T01, T02, T03, T04, T05, T06, T07, T08 | killed |
| S002 | `tests/fixtures.ts:60` | `loginAsCustomer` | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T02, T03, T04, T05, T06, T07, T08 | killed |
| S003 | `tests/tc-01-login.spec.ts:18` | - | `/Log in/` | `/(?:Log in)_mut/` | failed: T01 | killed |
| S004 | `tests/tc-01-login.spec.ts:23` | - | `'Invalid email or password.'` | `'Invalid email or password._mut'` | failed: T01 | killed |
| S005 | `tests/tc-01-login.spec.ts:24` | - | `/#\/login/` | `/(?:#\/login)_mut/` | failed: T01 | killed |
| S006 | `tests/tc-01-login.spec.ts:38` | - | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T01 | killed |
| S007 | `tests/tc-02-add-to-basket.spec.ts:21` | - | `'0'` | `'0_mut'` | failed: T02 | killed |
| S008 | `tests/tc-02-add-to-basket.spec.ts:27` | - | `'1'` | `'1_mut'` | failed: T02 | killed |
| S009 | `tests/tc-02-add-to-basket.spec.ts:32` | - | `/#\/basket/` | `/(?:#\/basket)_mut/` | failed: T02 | killed |
| S010 | `tests/tc-02-add-to-basket.spec.ts:33` | - | `1` | `2` | failed: T02 | killed |
| S011 | `tests/tc-02-add-to-basket.spec.ts:35` | - | `'1'` | `'1_mut'` | failed: T02 | killed |
| S012 | `tests/tc-03-basket-quantity-and-remove.spec.ts:31` | - | `2` | `3` | failed: T03 | killed |
| S013 | `tests/tc-03-basket-quantity-and-remove.spec.ts:32` | - | `1` | `2` | failed: T03 | killed |
| S014 | `tests/tc-03-basket-quantity-and-remove.spec.ts:32` | - | `1` | `2` | failed: T03 | killed |
| S015 | `tests/tc-03-basket-quantity-and-remove.spec.ts:37` | - | `2` | `3` | failed: T03 | killed |
| S016 | `tests/tc-03-basket-quantity-and-remove.spec.ts:37` | - | `1` | `2` | failed: T03 | killed |
| S017 | `tests/tc-03-basket-quantity-and-remove.spec.ts:42` | - | `1` | `2` | ran T03 | survived |
| S018 | `tests/tc-03-basket-quantity-and-remove.spec.ts:42` | - | `1` | `2` | failed: T03 | killed |
| S019 | `tests/tc-03-basket-quantity-and-remove.spec.ts:50` | - | `1` | `2` | failed: T03 | killed |
| S020 | `tests/tc-03-basket-quantity-and-remove.spec.ts:50` | - | `1` | `2` | failed: T03 | killed |
| S021 | `tests/tc-03-basket-quantity-and-remove.spec.ts:55` | - | `0` | `1` | ran T03 | survived |
| S022 | `tests/tc-03-basket-quantity-and-remove.spec.ts:56` | - | `1` | `2` | failed: T03 | killed |
| S023 | `tests/tc-03-basket-quantity-and-remove.spec.ts:57` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S024 | `tests/tc-03-basket-quantity-and-remove.spec.ts:59` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S025 | `tests/tc-04-purchase-limit.spec.ts:21` | - | `'1'` | `'1_mut'` | failed: T04 | killed |
| S026 | `tests/tc-04-purchase-limit.spec.ts:31` | - | `0` | `1` | failed: T04 | killed |
| S027 | `tests/tc-05-valid-coupon.spec.ts:51` | - | `'Add a coupon'` | `'Add a coupon_mut'` | failed: T05 | killed |
| S028 | `tests/tc-05-valid-coupon.spec.ts:60` | - | `0` | `1` | failed: T05 | killed |
| S029 | `tests/tc-05-valid-coupon.spec.ts:65` | - | `/#\/order-summary/` | `/(?:#\/order-summary)_mut/` | failed: T05 | killed |
| S030 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:47` | - | `'Invalid coupon.'` | `'Invalid coupon._mut'` | failed: T06 | killed |
| S031 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:48` | - | `0` | `1` | failed: T06 | killed |
| S032 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:55` | - | `'Invalid coupon.'` | `'Invalid coupon._mut'` | failed: T06 | killed |
| S033 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:56` | - | `0` | `1` | failed: T06 | killed |
| S034 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:61` | - | `/#\/order-summary/` | `/(?:#\/order-summary)_mut/` | failed: T06 | killed |
| S035 | `tests/tc-07-card-order-end-to-end.spec.ts:55` | - | `2` | `3` | failed: T07 | killed |
| S036 | `tests/tc-07-card-order-end-to-end.spec.ts:82` | - | `/#\/order-summary/` | `/(?:#\/order-summary)_mut/` | failed: T07 | killed |
| S037 | `tests/tc-07-card-order-end-to-end.spec.ts:98` | - | `/#\/order-completion\/[^/]+$/` | `/(?:#\/order-completion\/[^/]+$)_mut/` | failed: T07 | killed |
| S038 | `tests/tc-07-card-order-end-to-end.spec.ts:104` | - | `2` | `3` | failed: T07 | killed |
| S039 | `tests/tc-07-card-order-end-to-end.spec.ts:114` | - | `'0'` | `'0_mut'` | failed: T07 | killed |
| S040 | `tests/tc-07-card-order-end-to-end.spec.ts:117` | - | `0` | `1` | failed: T07 | killed |
| S041 | `tests/tc-07-card-order-end-to-end.spec.ts:123` | - | `/#\/order-history/` | `/(?:#\/order-history)_mut/` | failed: T07 | killed |
| S042 | `tests/tc-07-card-order-end-to-end.spec.ts:124` | - | `1` | `2` | failed: T07 | killed |
| S043 | `tests/tc-08-wallet-payment.spec.ts:34` | - | `0` | `1` | failed: T08 | killed |
| S044 | `tests/tc-08-wallet-payment.spec.ts:65` | - | `/#\/order-history/` | `/(?:#\/order-history)_mut/` | failed: T08 | killed |
| S045 | `tests/tc-08-wallet-payment.spec.ts:66` | - | `'You have not placed any orders yet.'` | `'You have not placed any orders yet._mut'` | failed: T08 | killed |
| S046 | `tests/tc-08-wallet-payment.spec.ts:67` | - | `0` | `1` | failed: T08 | killed |
| S047 | `tests/tc-08-wallet-payment.spec.ts:72` | - | `/#\/wallet/` | `/(?:#\/wallet)_mut/` | failed: T08 | killed |
| S048 | `tests/tc-08-wallet-payment.spec.ts:94` | - | `/#\/order-summary/` | `/(?:#\/order-summary)_mut/` | failed: T08 | killed |
| S049 | `tests/tc-08-wallet-payment.spec.ts:95` | - | `'Digital Wallet'` | `'Digital Wallet_mut'` | failed: T08 | killed |
| S050 | `tests/tc-08-wallet-payment.spec.ts:101` | - | `/#\/order-completion\/[^/]+$/` | `/(?:#\/order-completion\/[^/]+$)_mut/` | failed: T08 | killed |
| S051 | `tests/tc-08-wallet-payment.spec.ts:107` | - | `/#\/wallet/` | `/(?:#\/wallet)_mut/` | failed: T08 | killed |
| S052 | `tests/tc-08-wallet-payment.spec.ts:113` | - | `/#\/order-history/` | `/(?:#\/order-history)_mut/` | failed: T08 | killed |
| S053 | `tests/tc-08-wallet-payment.spec.ts:114` | - | `1` | `2` | failed: T08 | killed |

## Left-out tests (they fail at the baseline)

None.

## Not mutated

### Argument reaches only a failure message: check by hand (0)

The helper puts this argument only into the message of a failed assertion. The script does not mutate it, because such a mutant cannot fail. If the argument is an expected value, the helper does not check it.

None.

### Cannot fail: negated check (1)

Under `.not`, n + 1 and s_mut make the check weaker. On a correct app, such a mutant cannot fail.

- `tests/tc-01-login.spec.ts:31` `customer.email`

### Cannot fail: looser bound (0)

In an upper bound, for example `toBeLessThan(n)`, n + 1 makes the check weaker.

None.

### Computed expected value (63)

The expected value is not a literal, so the script does not mutate it.

- `tests/tc-01-login.spec.ts:43` `customer.email`
- `tests/tc-02-add-to-basket.spec.ts:18` `product.name`
- `tests/tc-02-add-to-basket.spec.ts:19` `price(product.price)`
- `tests/tc-02-add-to-basket.spec.ts:36` `price(product.price)`
- `tests/tc-02-add-to-basket.spec.ts:40` `` `Total Price: ${price(product.price)}` ``
- `tests/tc-03-basket-quantity-and-remove.spec.ts:19` `String(qtyA)`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:20` `String(qtyB)`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:25` `` `Total Price: ${price(total)}` ``
- `tests/tc-03-basket-quantity-and-remove.spec.ts:26` `String(qtyA + qtyB)`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:58` `` `Total Price: ${price(b.price)}` ``
- `tests/tc-04-purchase-limit.spec.ts:28` `String(quantity)`
- `tests/tc-04-purchase-limit.spec.ts:30` `totalFor(PURCHASE_LIMIT)`
- `tests/tc-04-purchase-limit.spec.ts:40` `String(PURCHASE_LIMIT)`
- `tests/tc-04-purchase-limit.spec.ts:41` `totalFor(PURCHASE_LIMIT)`
- `tests/tc-04-purchase-limit.spec.ts:42` `String(PURCHASE_LIMIT)`
- `tests/tc-04-purchase-limit.spec.ts:50` `String(PURCHASE_LIMIT)`
- `tests/tc-05-valid-coupon.spec.ts:36` `ADDRESS.streetAddress`
- `tests/tc-05-valid-coupon.spec.ts:43` `price(method.price)`
- `tests/tc-05-valid-coupon.spec.ts:58` `` `Your discount of ${COUPON_DISCOUNT}% will be applied during checkout.` ``
- `tests/tc-05-valid-coupon.spec.ts:66` `price(items)`
- `tests/tc-05-valid-coupon.spec.ts:67` `price(delivery.price)`
- `tests/tc-05-valid-coupon.spec.ts:68` `price(promotion)`
- `tests/tc-05-valid-coupon.spec.ts:69` `price(orderTotal(items, delivery.price, promotion))`
- `tests/tc-06-invalid-and-expired-coupon.spec.ts:62` `price(items)`
- `tests/tc-06-invalid-and-expired-coupon.spec.ts:63` `price(delivery.price)`
- `tests/tc-06-invalid-and-expired-coupon.spec.ts:64` `price(0)`
- `tests/tc-06-invalid-and-expired-coupon.spec.ts:65` `price(orderTotal(items, delivery.price))`
- `tests/tc-07-card-order-end-to-end.spec.ts:47` `String(i)`
- `tests/tc-07-card-order-end-to-end.spec.ts:50` `String(itemCount(lines))`
- `tests/tc-07-card-order-end-to-end.spec.ts:56` `String(qtyA)`
- `tests/tc-07-card-order-end-to-end.spec.ts:57` `String(qtyB)`
- `tests/tc-07-card-order-end-to-end.spec.ts:58` `` `Total Price: ${price(items)}` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:76` `` `Your discount of ${COUPON_DISCOUNT}% will be applied during checkout.` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:83` `ADDRESS.fullName`
- `tests/tc-07-card-order-end-to-end.spec.ts:85` `` `${ADDRESS.streetAddress}, ${ADDRESS.city}, ${ADDRESS.state}, ${ADDRESS.zipCode}` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:87` `ADDRESS.country`
- `tests/tc-07-card-order-end-to-end.spec.ts:88` `` `Card ending in ${CARD_LAST_DIGITS}` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:89` `CARD.fullName`
- `tests/tc-07-card-order-end-to-end.spec.ts:90` `price(items)`
- `tests/tc-07-card-order-end-to-end.spec.ts:91` `price(delivery.price)`
- `tests/tc-07-card-order-end-to-end.spec.ts:92` `price(promotion)`
- `tests/tc-07-card-order-end-to-end.spec.ts:93` `price(total)`
- `tests/tc-07-card-order-end-to-end.spec.ts:105` `String(qtyA)`
- `tests/tc-07-card-order-end-to-end.spec.ts:106` `String(qtyB)`
- `tests/tc-07-card-order-end-to-end.spec.ts:107` `price(items)`
- `tests/tc-07-card-order-end-to-end.spec.ts:108` `price(delivery.price)`
- `tests/tc-07-card-order-end-to-end.spec.ts:109` `price(promotion)`
- `tests/tc-07-card-order-end-to-end.spec.ts:110` `price(total)`
- `tests/tc-07-card-order-end-to-end.spec.ts:126` `` `#${orderId}` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:127` `price(total)`
- `tests/tc-07-card-order-end-to-end.spec.ts:128` `String(qtyA)`
- `tests/tc-07-card-order-end-to-end.spec.ts:129` `String(qtyB)`
- `tests/tc-08-wallet-payment.spec.ts:36` `FIRST_BALANCE`
- `tests/tc-08-wallet-payment.spec.ts:55` `FIRST_BALANCE.toFixed(2)`
- `tests/tc-08-wallet-payment.spec.ts:56` `` `Pay ${price(total)}` ``
- `tests/tc-08-wallet-payment.spec.ts:73` `FIRST_BALANCE.toFixed(2)`
- `tests/tc-08-wallet-payment.spec.ts:80` `balanceBeforeOrder`
- `tests/tc-08-wallet-payment.spec.ts:87` `balanceBeforeOrder.toFixed(2)`
- `tests/tc-08-wallet-payment.spec.ts:88` `` `Pay ${price(total)}` ``
- `tests/tc-08-wallet-payment.spec.ts:96` `price(total)`
- `tests/tc-08-wallet-payment.spec.ts:108` `balanceAfterOrder.toFixed(2)`
- `tests/tc-08-wallet-payment.spec.ts:116` `price(total)`
- `tests/tc-08-wallet-payment.spec.ts:117` `String(bonus)`

### Message (7)

- `helpers/api.ts:27` `await response.text()`
- `helpers/api.ts:42` `await response.text()`
- `helpers/api.ts:53` `await response.text()`
- `helpers/api.ts:59` `await response.text()`
- `helpers/api.ts:68` `await response.text()`
- `helpers/api.ts:77` `await response.text()`
- `helpers/api.ts:82` `await response.text()`

### Matcher option (1)

- `tests/tc-08-wallet-payment.spec.ts:80` `2`

### Attribute or property name (0)

None.

### Timing option (0)

None.

### No operator (null or undefined) (0)

None.
