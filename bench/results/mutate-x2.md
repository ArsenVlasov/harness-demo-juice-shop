# Expectation mutation audit: client

Source: `bench/run-audit-mutate.mjs`, 2026-10-21T12:01:44.665Z. Suite: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-3/run-3/suite-a` at `gen-3` (3b1063330ddc). TypeScript 5.9.3.
The app restarts before the baseline, before the first mutant and after each 5 mutants.

Sites: 82. Mutants: 82. Killed: 62. Survived: 2. Error: 0. Skipped: 18.
A mutant that survives shows a weak check.
A failed test kills a mutant only when the test passes again on the original file.

## Tests

A killed mutant counts for the tests that killed it.
Any other mutant counts for the selected tests that run the code of its site.
The call graph uses the declarations that TypeScript finds, the fixtures and the hooks.
If no selected test runs the code, the mutant counts for the row `(unattributed)`.

| ID | Test | Sites | Killed | Survived | Error |
|---|---|---|---|---|---|
| T01 | `tc-01-login.spec.ts :: TC-01: Login with a valid and an invalid password > login with a wrong and th` | 2 | 2 | 0 | 0 |
| T02 | `tc-02-add-to-basket.spec.ts :: TC-02: Add a product to the basket > add one product and check the ba` | 6 | 6 | 0 | 0 |
| T03 | `tc-03-basket-quantity-and-remove.spec.ts :: TC-03: Change the quantity and remove a product in the b` | 20 | 18 | 2 | 0 |
| T04 | `tc-04-purchase-limit.spec.ts :: TC-04: Purchase limit for one product > the basket stops at 5 items ` | 10 | 10 | 0 | 0 |
| T05 | `tc-05-valid-coupon.spec.ts :: TC-05: Valid coupon on the payment step > the 10% coupon of the curren` | 16 | 16 | 0 | 0 |
| T06 | `tc-06-invalid-and-expired-coupon.spec.ts :: TC-06: Invalid coupon and expired coupon > neither an in` | 18 | 18 | 0 | 0 |
| T07 | `tc-08-wallet-payment.spec.ts :: TC-08: Payment with the wallet > the wallet cannot pay a short balan` | 18 | 18 | 0 | 0 |

## Mutants

| ID | Site | Function | Original | Mutated | Tests | Status |
|---|---|---|---|---|---|---|
| S001 | `tests/fixtures.ts:28` | `loggedInPage` | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T02, T03, T04, T05, T06, T07 | killed |
| S002 | `tests/pages/account.ts:9` | `expectOpen` | `/#\/order-history/` | `/(?:#\/order-history)_mut/` | failed: T07 | killed |
| S003 | `tests/pages/checkout.ts:13` | `expectOpen` | `/#\/address\/select/` | `/(?:#\/address\/select)_mut/` | failed: T05, T06, T07 | killed |
| S004 | `tests/pages/checkout.ts:35` | `expectOpen` | `/#\/delivery-method/` | `/(?:#\/delivery-method)_mut/` | failed: T05, T06, T07 | killed |
| S005 | `tests/pages/checkout.ts:63` | `expectOpen` | `/#\/payment\/shop/` | `/(?:#\/payment\/shop)_mut/` | failed: T05, T06, T07 | killed |
| S006 | `tests/pages/checkout.ts:107` | `expectOpen` | `/#\/order-summary/` | `/(?:#\/order-summary)_mut/` | failed: T05, T06, T07 | killed |
| S007 | `tests/pages/checkout.ts:121` | `expectTotals` | `'Items'` | `'Items_mut'` | failed: T05, T06 | killed |
| S008 | `tests/pages/checkout.ts:122` | `expectTotals` | `'Delivery'` | `'Delivery_mut'` | failed: T05, T06 | killed |
| S009 | `tests/pages/checkout.ts:123` | `expectTotals` | `'Promotion'` | `'Promotion_mut'` | failed: T05, T06 | killed |
| S010 | `tests/pages/checkout.ts:124` | `expectTotals` | `'Total Price'` | `'Total Price_mut'` | failed: T05, T06 | killed |
| S011 | `tests/pages/checkout.ts:149` | `expectOpen` | `/#\/order-completion\/.+/` | `/(?:#\/order-completion\/.+)_mut/` | failed: T07 | killed |
| S012 | `tests/pages/shop.ts:44` | `openBasket` | `/#\/basket/` | `/(?:#\/basket)_mut/` | failed: T02, T03, T04, T05, T06, T07 | killed |
| S013 | `tests/pages/shop.ts:58` | `goto` | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T02, T04, T05, T06, T07 | killed |
| S014 | `tests/pages/shop.ts:65` | `search` | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T03 | killed |
| S015 | `tests/pages/shop.ts:132` | `expectNoRow` | `0` | `1` | ran T01, T02, T03, T04, T05, T06, T07 | survived |
| S016 | `tests/tc-01-login.spec.ts:22` | - | `/#\/login/` | `/(?:#\/login)_mut/` | failed: T01 | killed |
| S017 | `tests/tc-01-login.spec.ts:34` | - | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T01 | killed |
| S018 | `tests/tc-02-add-to-basket.spec.ts:15` | - | `0` | `1` | failed: T02 | killed |
| S019 | `tests/tc-02-add-to-basket.spec.ts:21` | - | `1` | `2` | failed: T02 | killed |
| S020 | `tests/tc-02-add-to-basket.spec.ts:26` | - | `1` | `2` | failed: T02 | killed |
| S021 | `tests/tc-03-basket-quantity-and-remove.spec.ts:18` | - | `2` | `3` | failed: T03 | killed |
| S022 | `tests/tc-03-basket-quantity-and-remove.spec.ts:22` | - | `1` | `2` | failed: T03 | killed |
| S023 | `tests/tc-03-basket-quantity-and-remove.spec.ts:23` | - | `1` | `2` | failed: T03 | killed |
| S024 | `tests/tc-03-basket-quantity-and-remove.spec.ts:24` | - | `'13.98¤'` | `'13.98¤_mut'` | failed: T03 | killed |
| S025 | `tests/tc-03-basket-quantity-and-remove.spec.ts:25` | - | `2` | `3` | failed: T03 | killed |
| S026 | `tests/tc-03-basket-quantity-and-remove.spec.ts:30` | - | `2` | `3` | failed: T03 | killed |
| S027 | `tests/tc-03-basket-quantity-and-remove.spec.ts:31` | - | `'18.97¤'` | `'18.97¤_mut'` | failed: T03 | killed |
| S028 | `tests/tc-03-basket-quantity-and-remove.spec.ts:32` | - | `3` | `4` | failed: T03 | killed |
| S029 | `tests/tc-03-basket-quantity-and-remove.spec.ts:37` | - | `1` | `2` | ran T03 | survived |
| S030 | `tests/tc-03-basket-quantity-and-remove.spec.ts:38` | - | `'13.98¤'` | `'13.98¤_mut'` | failed: T03 | killed |
| S031 | `tests/tc-03-basket-quantity-and-remove.spec.ts:39` | - | `2` | `3` | failed: T03 | killed |
| S032 | `tests/tc-03-basket-quantity-and-remove.spec.ts:44` | - | `1` | `2` | failed: T03 | killed |
| S033 | `tests/tc-03-basket-quantity-and-remove.spec.ts:45` | - | `'13.98¤'` | `'13.98¤_mut'` | failed: T03 | killed |
| S034 | `tests/tc-03-basket-quantity-and-remove.spec.ts:51` | - | `1` | `2` | failed: T03 | killed |
| S035 | `tests/tc-03-basket-quantity-and-remove.spec.ts:52` | - | `'8.99¤'` | `'8.99¤_mut'` | failed: T03 | killed |
| S036 | `tests/tc-03-basket-quantity-and-remove.spec.ts:53` | - | `1` | `2` | failed: T03 | killed |
| S037 | `tests/tc-04-purchase-limit.spec.ts:15` | - | `1` | `2` | failed: T04 | killed |
| S038 | `tests/tc-04-purchase-limit.spec.ts:24` | - | `'9.95¤'` | `'9.95¤_mut'` | failed: T04 | killed |
| S039 | `tests/tc-04-purchase-limit.spec.ts:25` | - | `0` | `1` | failed: T04 | killed |
| S040 | `tests/tc-04-purchase-limit.spec.ts:34` | - | `5` | `6` | failed: T04 | killed |
| S041 | `tests/tc-04-purchase-limit.spec.ts:35` | - | `'9.95¤'` | `'9.95¤_mut'` | failed: T04 | killed |
| S042 | `tests/tc-04-purchase-limit.spec.ts:36` | - | `5` | `6` | failed: T04 | killed |
| S043 | `tests/tc-04-purchase-limit.spec.ts:43` | - | `5` | `6` | failed: T04 | killed |
| S044 | `tests/tc-05-valid-coupon.spec.ts:25` | - | `2` | `3` | failed: T05 | killed |
| S045 | `tests/tc-05-valid-coupon.spec.ts:58` | - | `'17.98¤'` | `'17.98¤_mut'` | failed: T05 | killed |
| S046 | `tests/tc-05-valid-coupon.spec.ts:58` | - | `'0.99¤'` | `'0.99¤_mut'` | failed: T05 | killed |
| S047 | `tests/tc-05-valid-coupon.spec.ts:58` | - | `'1.80¤'` | `'1.80¤_mut'` | failed: T05 | killed |
| S048 | `tests/tc-05-valid-coupon.spec.ts:58` | - | `'17.17¤'` | `'17.17¤_mut'` | failed: T05 | killed |
| S049 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:25` | - | `2` | `3` | failed: T06 | killed |
| S050 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:45` | - | `0` | `1` | failed: T06 | killed |
| S051 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:52` | - | `0` | `1` | failed: T06 | killed |
| S052 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:59` | - | `'17.98¤'` | `'17.98¤_mut'` | failed: T06 | killed |
| S053 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:59` | - | `'0.99¤'` | `'0.99¤_mut'` | failed: T06 | killed |
| S054 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:59` | - | `'0.00¤'` | `'0.00¤_mut'` | failed: T06 | killed |
| S055 | `tests/tc-06-invalid-and-expired-coupon.spec.ts:59` | - | `'18.97¤'` | `'18.97¤_mut'` | failed: T06 | killed |
| S056 | `tests/tc-07-card-order-end-to-end.spec.ts:35` | - | `3` | `4` | - | skipped `the test fails at the baseline` |
| S057 | `tests/tc-07-card-order-end-to-end.spec.ts:40` | - | `2` | `3` | - | skipped `the test fails at the baseline` |
| S058 | `tests/tc-07-card-order-end-to-end.spec.ts:41` | - | `1` | `2` | - | skipped `the test fails at the baseline` |
| S059 | `tests/tc-07-card-order-end-to-end.spec.ts:42` | - | `'20.97¤'` | `'20.97¤_mut'` | - | skipped `the test fails at the baseline` |
| S060 | `tests/tc-07-card-order-end-to-end.spec.ts:69` | - | `'20.97¤'` | `'20.97¤_mut'` | - | skipped `the test fails at the baseline` |
| S061 | `tests/tc-07-card-order-end-to-end.spec.ts:69` | - | `'0.99¤'` | `'0.99¤_mut'` | - | skipped `the test fails at the baseline` |
| S062 | `tests/tc-07-card-order-end-to-end.spec.ts:69` | - | `'2.10¤'` | `'2.10¤_mut'` | - | skipped `the test fails at the baseline` |
| S063 | `tests/tc-07-card-order-end-to-end.spec.ts:69` | - | `'19.86¤'` | `'19.86¤_mut'` | - | skipped `the test fails at the baseline` |
| S064 | `tests/tc-07-card-order-end-to-end.spec.ts:81` | - | `'20.97¤'` | `'20.97¤_mut'` | - | skipped `the test fails at the baseline` |
| S065 | `tests/tc-07-card-order-end-to-end.spec.ts:81` | - | `'0.99¤'` | `'0.99¤_mut'` | - | skipped `the test fails at the baseline` |
| S066 | `tests/tc-07-card-order-end-to-end.spec.ts:81` | - | `'2.10¤'` | `'2.10¤_mut'` | - | skipped `the test fails at the baseline` |
| S067 | `tests/tc-07-card-order-end-to-end.spec.ts:81` | - | `'19.86¤'` | `'19.86¤_mut'` | - | skipped `the test fails at the baseline` |
| S068 | `tests/tc-07-card-order-end-to-end.spec.ts:85` | - | `0` | `1` | - | skipped `the test fails at the baseline` |
| S069 | `tests/tc-07-card-order-end-to-end.spec.ts:94` | - | `/#\/order-history/` | `/(?:#\/order-history)_mut/` | - | skipped `the test fails at the baseline` |
| S070 | `tests/tc-07-card-order-end-to-end.spec.ts:95` | - | `1` | `2` | - | skipped `the test fails at the baseline` |
| S071 | `tests/tc-07-card-order-end-to-end.spec.ts:96` | - | `'19.86¤'` | `'19.86¤_mut'` | - | skipped `the test fails at the baseline` |
| S072 | `tests/tc-07-card-order-end-to-end.spec.ts:97` | - | `2` | `3` | - | skipped `the test fails at the baseline` |
| S073 | `tests/tc-07-card-order-end-to-end.spec.ts:98` | - | `1` | `2` | - | skipped `the test fails at the baseline` |
| S074 | `tests/tc-08-wallet-payment.spec.ts:29` | - | `1` | `2` | failed: T07 | killed |
| S075 | `tests/tc-08-wallet-payment.spec.ts:46` | - | `'5.00'` | `'5.00_mut'` | failed: T07 | killed |
| S076 | `tests/tc-08-wallet-payment.spec.ts:61` | - | `'5.00'` | `'5.00_mut'` | failed: T07 | killed |
| S077 | `tests/tc-08-wallet-payment.spec.ts:76` | - | `'8.99'` | `'8.99_mut'` | failed: T07 | killed |
| S078 | `tests/tc-08-wallet-payment.spec.ts:84` | - | `'8.99¤'` | `'8.99¤_mut'` | failed: T07 | killed |
| S079 | `tests/tc-08-wallet-payment.spec.ts:94` | - | `'1.00'` | `'1.00_mut'` | failed: T07 | killed |
| S080 | `tests/tc-08-wallet-payment.spec.ts:99` | - | `1` | `2` | failed: T07 | killed |
| S081 | `tests/tc-08-wallet-payment.spec.ts:100` | - | `'8.99¤'` | `'8.99¤_mut'` | failed: T07 | killed |
| S082 | `tests/tc-08-wallet-payment.spec.ts:101` | - | `/Bonus\s*1(?![\d.])/` | `/(?:Bonus\s*1(?![\d.]))_mut/` | failed: T07 | killed |

## Left-out tests (they fail at the baseline)

- `tc-07-card-order-end-to-end.spec.ts :: TC-07: Order with a card, from basket to order history > orde` [failed]

## Not mutated

### Argument reaches only a failure message: check by hand (0)

The helper puts this argument only into the message of a failed assertion. The script does not mutate it, because such a mutant cannot fail. If the argument is an expected value, the helper does not check it.

None.

### Cannot fail: negated check (2)

Under `.not`, n + 1 and s_mut make the check weaker. On a correct app, such a mutant cannot fail.

- `tests/tc-01-login.spec.ts:28` `customer.email`
- `tests/tc-07-card-order-end-to-end.spec.ts:75` `''`

### Cannot fail: looser bound (0)

In an upper bound, for example `toBeLessThan(n)`, n + 1 makes the check weaker.

None.

### Computed expected value (38)

The expected value is not a literal, so the script does not mutate it.

- `tests/pages/account.ts:26` `` new RegExp(`Total Price\\s*${escapeRegExp(total)}`) ``
- `tests/pages/account.ts:32` `price(unitPrice)`
- `tests/pages/checkout.ts:44` `price(DELIVERY.oneDay.price)`
- `tests/pages/checkout.ts:45` `price(DELIVERY.fast.price)`
- `tests/pages/checkout.ts:46` `price(DELIVERY.standard.price)`
- `tests/pages/checkout.ts:117` `price(value)`
- `tests/pages/checkout.ts:140` `` new RegExp(`Items\\s*Delivery\\s*Promotion\\s*Total Price\\s*${values}`) ``
- `tests/pages/shop.ts:48` `` new RegExp(`Your Basket\\s*${count}\\s*$`) ``
- `tests/pages/shop.ts:81` `` `Placed ${name} into basket.` ``
- `tests/tc-01-login.spec.ts:39` `customer.email`
- `tests/tc-02-add-to-basket.spec.ts:14` `product.name`
- `tests/tc-02-add-to-basket.spec.ts:14` `product.price`
- `tests/tc-02-add-to-basket.spec.ts:20` `` `Placed ${product.name} into basket.` ``
- `tests/tc-02-add-to-basket.spec.ts:26` `product.name`
- `tests/tc-02-add-to-basket.spec.ts:27` `product.price`
- `tests/tc-02-add-to-basket.spec.ts:31` `product.price`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:22` `productA.name`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:23` `productB.name`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:30` `productA.name`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:37` `productA.name`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:44` `productA.name`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:50` `productA.name`
- `tests/tc-03-basket-quantity-and-remove.spec.ts:51` `productB.name`
- `tests/tc-04-purchase-limit.spec.ts:22` `product.name`
- `tests/tc-04-purchase-limit.spec.ts:22` `quantity`
- `tests/tc-04-purchase-limit.spec.ts:30` `PURCHASE_LIMIT_MESSAGE`
- `tests/tc-04-purchase-limit.spec.ts:34` `product.name`
- `tests/tc-04-purchase-limit.spec.ts:42` `PURCHASE_LIMIT_MESSAGE`
- `tests/tc-07-card-order-end-to-end.spec.ts:40` `productA.name`
- `tests/tc-07-card-order-end-to-end.spec.ts:41` `productB.name`
- `tests/tc-07-card-order-end-to-end.spec.ts:87` `productA.name`
- `tests/tc-07-card-order-end-to-end.spec.ts:88` `productB.name`
- `tests/tc-07-card-order-end-to-end.spec.ts:96` `orderId`
- `tests/tc-07-card-order-end-to-end.spec.ts:97` `productA.name`
- `tests/tc-07-card-order-end-to-end.spec.ts:97` `productA.price`
- `tests/tc-07-card-order-end-to-end.spec.ts:98` `productB.name`
- `tests/tc-07-card-order-end-to-end.spec.ts:98` `productB.price`
- `tests/tc-08-wallet-payment.spec.ts:100` `orderId`

### Message (0)

None.

### Matcher option (0)

None.

### Attribute or property name (0)

None.

### Timing option (0)

None.

### No operator (null or undefined) (0)

None.
