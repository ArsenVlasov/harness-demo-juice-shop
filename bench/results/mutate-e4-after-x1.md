# Expectation mutation audit: client

Source: `bench/run-audit-mutate.mjs`, 2026-10-21T13:39:14.491Z. Suite: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-q` at `fixed` (2fbd06d55dc0). TypeScript 5.9.3.
The app restarts before the baseline, before the first mutant and after each 5 mutants.

Sites: 45. Mutants: 45. Killed: 44. Survived: 1. Error: 0. Skipped: 0.
A mutant that survives shows a weak check.
A failed test kills a mutant only when the test passes again on the original file.

## Tests

A killed mutant counts for the tests that killed it.
Any other mutant counts for the selected tests that run the code of its site.
The call graph uses the declarations that TypeScript finds, the fixtures and the hooks.
If no selected test runs the code, the mutant counts for the row `(unattributed)`.

| ID | Test | Sites | Killed | Survived | Error |
|---|---|---|---|---|---|
| T01 | `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password` | 7 | 7 | 0 | 0 |
| T02 | `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket` | 6 | 6 | 0 | 0 |
| T03 | `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the b` | 15 | 14 | 1 | 0 |
| T04 | `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product` | 3 | 3 | 0 | 0 |
| T05 | `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step` | 2 | 2 | 0 | 0 |
| T06 | `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon` | 6 | 6 | 0 | 0 |
| T07 | `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history` | 8 | 8 | 0 | 0 |
| T08 | `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet` | 5 | 5 | 0 | 0 |

## Mutants

| ID | Site | Function | Original | Mutated | Tests | Status |
|---|---|---|---|---|---|---|
| S001 | `tests/support/shop-api.ts:22` | `register` | `201` | `202` | failed: T01, T02, T03, T04, T05, T06, T07, T08 | killed |
| S002 | `tests/tc-01-login.spec.ts:11` | - | `'Login'` | `'Login_mut'` | failed: T01 | killed |
| S003 | `tests/tc-01-login.spec.ts:16` | - | `/Log in/` | `/(?:Log in)_mut/` | failed: T01 | killed |
| S004 | `tests/tc-01-login.spec.ts:21` | - | `'Invalid email or password.'` | `'Invalid email or password._mut'` | failed: T01 | killed |
| S005 | `tests/tc-01-login.spec.ts:22` | - | `/#\/login/` | `/(?:#\/login)_mut/` | failed: T01 | killed |
| S006 | `tests/tc-01-login.spec.ts:29` | - | `/Login/` | `/(?:Login)_mut/` | failed: T01 | killed |
| S007 | `tests/tc-01-login.spec.ts:37` | - | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T01 | killed |
| S008 | `tests/tc-02-add-to-basket.spec.ts:13` | - | `'0'` | `'0_mut'` | failed: T02 | killed |
| S009 | `tests/tc-02-add-to-basket.spec.ts:19` | - | `'1'` | `'1_mut'` | failed: T02 | killed |
| S010 | `tests/tc-02-add-to-basket.spec.ts:25` | - | `/#\/basket/` | `/(?:#\/basket)_mut/` | failed: T02 | killed |
| S011 | `tests/tc-02-add-to-basket.spec.ts:26` | - | `1` | `2` | failed: T02 | killed |
| S012 | `tests/tc-02-add-to-basket.spec.ts:28` | - | `'1'` | `'1_mut'` | failed: T02 | killed |
| S013 | `tests/tc-03-basket-quantity-and-remove.spec.ts:20` | - | `2` | `3` | failed: T03 | killed |
| S014 | `tests/tc-03-basket-quantity-and-remove.spec.ts:21` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S015 | `tests/tc-03-basket-quantity-and-remove.spec.ts:22` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S016 | `tests/tc-03-basket-quantity-and-remove.spec.ts:24` | - | `'2'` | `'2_mut'` | failed: T03 | killed |
| S017 | `tests/tc-03-basket-quantity-and-remove.spec.ts:29` | - | `'2'` | `'2_mut'` | failed: T03 | killed |
| S018 | `tests/tc-03-basket-quantity-and-remove.spec.ts:31` | - | `'3'` | `'3_mut'` | failed: T03 | killed |
| S019 | `tests/tc-03-basket-quantity-and-remove.spec.ts:36` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S020 | `tests/tc-03-basket-quantity-and-remove.spec.ts:38` | - | `'2'` | `'2_mut'` | failed: T03 | killed |
| S021 | `tests/tc-03-basket-quantity-and-remove.spec.ts:44` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S022 | `tests/tc-03-basket-quantity-and-remove.spec.ts:50` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S023 | `tests/tc-03-basket-quantity-and-remove.spec.ts:56` | - | `0` | `1` | ran T03 | survived |
| S024 | `tests/tc-03-basket-quantity-and-remove.spec.ts:57` | - | `1` | `2` | failed: T03 | killed |
| S025 | `tests/tc-03-basket-quantity-and-remove.spec.ts:58` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S026 | `tests/tc-03-basket-quantity-and-remove.spec.ts:60` | - | `'1'` | `'1_mut'` | failed: T03 | killed |
| S027 | `tests/tc-04-purchase-limit.spec.ts:13` | - | `'1'` | `'1_mut'` | failed: T04 | killed |
| S028 | `tests/tc-04-purchase-limit.spec.ts:26` | - | `0` | `1` | failed: T04 | killed |
| S029 | `tests/tc-05-valid-coupon.spec.ts:59` | - | `0` | `1` | failed: T05 | killed |
| S030 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:42` | - | `'Invalid coupon.'` | `'Invalid coupon._mut'` | failed: T06 | killed |
| S031 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:43` | - | `0` | `1` | failed: T06 | killed |
| S032 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:48` | - | `'Invalid coupon.'` | `'Invalid coupon._mut'` | failed: T06 | killed |
| S033 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:49` | - | `0` | `1` | failed: T06 | killed |
| S034 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:58` | - | `0` | `1` | failed: T06 | killed |
| S035 | `tests/tc-07-card-order-end-to-end.spec.ts:34` | - | `'1'` | `'1_mut'` | failed: T07 | killed |
| S036 | `tests/tc-07-card-order-end-to-end.spec.ts:36` | - | `'2'` | `'2_mut'` | failed: T07 | killed |
| S037 | `tests/tc-07-card-order-end-to-end.spec.ts:43` | - | `2` | `3` | failed: T07 | killed |
| S038 | `tests/tc-07-card-order-end-to-end.spec.ts:78` | - | `2` | `3` | failed: T07 | killed |
| S039 | `tests/tc-07-card-order-end-to-end.spec.ts:106` | - | `'0'` | `'0_mut'` | failed: T07 | killed |
| S040 | `tests/tc-07-card-order-end-to-end.spec.ts:108` | - | `0` | `1` | failed: T07 | killed |
| S041 | `tests/tc-07-card-order-end-to-end.spec.ts:115` | - | `1` | `2` | failed: T07 | killed |
| S042 | `tests/tc-08-wallet-payment.spec.ts:54` | - | `0` | `1` | failed: T08 | killed |
| S043 | `tests/tc-08-wallet-payment.spec.ts:82` | - | `'Digital Wallet'` | `'Digital Wallet_mut'` | failed: T08 | killed |
| S044 | `tests/tc-08-wallet-payment.spec.ts:88` | - | `/#\/order-completion\/.+/` | `/(?:#\/order-completion\/.+)_mut/` | failed: T08 | killed |
| S045 | `tests/tc-08-wallet-payment.spec.ts:99` | - | `1` | `2` | failed: T08 | killed |

## Left-out tests (they fail at the baseline)

None.

## Not mutated

### Argument reaches only a failure message: check by hand (0)

The helper puts this argument only into the message of a failed assertion. The script does not mutate it, because such a mutant cannot fail. If the argument is an expected value, the helper does not check it.

None.

### Cannot fail: negated check (2)

Under `.not`, n + 1 and s_mut make the check weaker. On a correct app, such a mutant cannot fail.

- `tests/tc-01-login.spec.ts:30` `ANY_EMAIL`
- `tests/tc-07-card-order-end-to-end.spec.ts:89` `''`

### Cannot fail: looser bound (0)

In an upper bound, for example `toBeLessThan(n)`, n + 1 makes the check weaker.

None.

### Computed expected value (77)

The expected value is not a literal, so the script does not mutate it.

- `tests/pages/basket-page.ts:29` `(await serverBasket).Products.length`
- `tests/pages/nav-bar.ts:43` `String(itemCount(await serverBasket))`
- `tests/support/assertions.ts:18` `money(expected)`
- `tests/tc-01-login.spec.ts:42` `customer.email`
- `tests/tc-02-add-to-basket.spec.ts:10` `product.name`
- `tests/tc-02-add-to-basket.spec.ts:11` `priceText(product.price)`
- `tests/tc-02-add-to-basket.spec.ts:29` `priceText(product.price)`
- `tests/tc-02-add-to-basket.spec.ts:33` `product.price`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:23` `a.price + b.price`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:30` `2 * a.price + b.price`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:37` `a.price + b.price`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:45` `a.price + b.price`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:51` `a.price + b.price`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:59` `b.price`
- `tests/tc-04-purchase-limit.spec.ts:22` `String(quantity)`
- `tests/tc-04-purchase-limit.spec.ts:24` `String(APPLE_JUICE_LIMIT)`
- `tests/tc-04-purchase-limit.spec.ts:25` `APPLE_JUICE_LIMIT * product.price`
- `tests/tc-04-purchase-limit.spec.ts:35` `String(APPLE_JUICE_LIMIT)`
- `tests/tc-04-purchase-limit.spec.ts:36` `APPLE_JUICE_LIMIT * product.price`
- `tests/tc-04-purchase-limit.spec.ts:37` `String(APPLE_JUICE_LIMIT)`
- `tests/tc-04-purchase-limit.spec.ts:41` `String(APPLE_JUICE_LIMIT)`
- `tests/tc-04-purchase-limit.spec.ts:42` `APPLE_JUICE_LIMIT * product.price`
- `tests/tc-04-purchase-limit.spec.ts:49` `String(APPLE_JUICE_LIMIT)`
- `tests/tc-05-valid-coupon.spec.ts:32` `ADDRESS.fullName`
- `tests/tc-05-valid-coupon.spec.ts:33` `ADDRESS.streetAddress`
- `tests/tc-05-valid-coupon.spec.ts:34` `ADDRESS.country`
- `tests/tc-05-valid-coupon.spec.ts:42` `priceText(option.price)`
- `tests/tc-05-valid-coupon.spec.ts:49` `CARD_LAST_DIGITS`
- `tests/tc-05-valid-coupon.spec.ts:57` `` `Your discount of ${discountPercent}% will be applied during checkout.` ``
- `tests/tc-05-valid-coupon.spec.ts:65` `String(quantity)`
- `tests/tc-05-valid-coupon.spec.ts:66` `items`
- `tests/tc-05-valid-coupon.spec.ts:67` `DELIVERY.oneDay.price`
- `tests/tc-05-valid-coupon.spec.ts:68` `promotion`
- `tests/tc-05-valid-coupon.spec.ts:69` `total`
- `tests/tc-06-invalid-and-expired-coupon.spec.ts:55` `String(quantity)`
- `tests/tc-06-invalid-and-expired-coupon.spec.ts:56` `items`
- `tests/tc-06-invalid-and-expired-coupon.spec.ts:57` `DELIVERY.oneDay.price`
- `tests/tc-06-invalid-and-expired-coupon.spec.ts:59` `total`
- `tests/tc-07-card-order-end-to-end.spec.ts:38` `String(a.quantity + b.quantity)`
- `tests/tc-07-card-order-end-to-end.spec.ts:44` `String(a.quantity)`
- `tests/tc-07-card-order-end-to-end.spec.ts:45` `String(b.quantity)`
- `tests/tc-07-card-order-end-to-end.spec.ts:46` `items`
- `tests/tc-07-card-order-end-to-end.spec.ts:64` `` `Your discount of ${discountPercent}% will be applied during checkout.` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:71` `ADDRESS.fullName`
- `tests/tc-07-card-order-end-to-end.spec.ts:73` `` `${ADDRESS.streetAddress}, ${ADDRESS.city}, ${ADDRESS.state}, ${ADDRESS.zipCode}` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:75` `ADDRESS.country`
- `tests/tc-07-card-order-end-to-end.spec.ts:76` `` `Card ending in ${CARD_LAST_DIGITS}` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:77` `CARD.fullName`
- `tests/tc-07-card-order-end-to-end.spec.ts:79` `String(a.quantity)`
- `tests/tc-07-card-order-end-to-end.spec.ts:80` `String(b.quantity)`
- `tests/tc-07-card-order-end-to-end.spec.ts:81` `items`
- `tests/tc-07-card-order-end-to-end.spec.ts:82` `DELIVERY.oneDay.price`
- `tests/tc-07-card-order-end-to-end.spec.ts:83` `promotion`
- `tests/tc-07-card-order-end-to-end.spec.ts:84` `total`
- `tests/tc-07-card-order-end-to-end.spec.ts:90` `` new RegExp(`#/order-completion/${orderId}$`) ``
- `tests/tc-07-card-order-end-to-end.spec.ts:95` `` ` ${a.quantity} ` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:96` `` ` ${b.quantity} ` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:98` `items`
- `tests/tc-07-card-order-end-to-end.spec.ts:99` `DELIVERY.oneDay.price`
- `tests/tc-07-card-order-end-to-end.spec.ts:100` `promotion`
- `tests/tc-07-card-order-end-to-end.spec.ts:101` `total`
- `tests/tc-07-card-order-end-to-end.spec.ts:117` `` `#${orderId}` ``
- `tests/tc-07-card-order-end-to-end.spec.ts:118` `total`
- `tests/tc-07-card-order-end-to-end.spec.ts:119` `String(a.quantity)`
- `tests/tc-07-card-order-end-to-end.spec.ts:120` `String(b.quantity)`
- `tests/tc-08-wallet-payment.spec.ts:28` `firstBalance`
- `tests/tc-08-wallet-payment.spec.ts:43` `firstBalance`
- `tests/tc-08-wallet-payment.spec.ts:44` `` new RegExp(`Pay ${priceText(total)}`) ``
- `tests/tc-08-wallet-payment.spec.ts:60` `firstBalance`
- `tests/tc-08-wallet-payment.spec.ts:64` `firstBalance + topUp`
- `tests/tc-08-wallet-payment.spec.ts:66` `total`
- `tests/tc-08-wallet-payment.spec.ts:74` `balance`
- `tests/tc-08-wallet-payment.spec.ts:75` `` new RegExp(`Pay ${priceText(total)}`) ``
- `tests/tc-08-wallet-payment.spec.ts:83` `total`
- `tests/tc-08-wallet-payment.spec.ts:94` `balance - total + bonus`
- `tests/tc-08-wallet-payment.spec.ts:101` `total`
- `tests/tc-08-wallet-payment.spec.ts:102` `String(bonus)`

### Message (10)

- `tests/pages/basket-page.ts:28` `'The basket table shows the products of the server basket'`
- `tests/pages/nav-bar.ts:42` `'The basket counter shows the item count of the server basket'`
- `tests/support/assertions.ts:16` `message`
- `tests/support/shop-api.ts:22` `await response.text()`
- `tests/support/shop-api.ts:27` `await response.text()`
- `tests/support/shop-api.ts:48` `await response.text()`
- `tests/support/shop-api.ts:56` `await response.text()`
- `tests/support/shop-api.ts:70` `await response.text()`
- `tests/support/shop-api.ts:80` `await response.text()`
- `tests/tc-04-purchase-limit.spec.ts:21` `` `The shop accepts quantity ${quantity}` ``

### Matcher option (1)

- `tests/tc-08-wallet-payment.spec.ts:64` `2`

### Attribute or property name (0)

None.

### Timing option (0)

None.

### No operator (null or undefined) (0)

None.
