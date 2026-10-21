# Expectation mutation audit: client

Source: `bench/run-audit-mutate.mjs`, 2026-10-21T14:32:34.113Z. Suite: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/desk-s` at `fixed` (d67bf601809c). TypeScript 5.9.3.
The app restarts before the baseline, before the first mutant and after each 5 mutants.

Sites: 91. Mutants: 91. Killed: 89. Survived: 2. Error: 0. Skipped: 0.
A mutant that survives shows a weak check.
A failed test kills a mutant only when the test passes again on the original file.

## Tests

A killed mutant counts for the tests that killed it.
Any other mutant counts for the selected tests that run the code of its site.
The call graph uses the declarations that TypeScript finds, the fixtures and the hooks.
If no selected test runs the code, the mutant counts for the row `(unattributed)`.

| ID | Test | Sites | Killed | Survived | Error |
|---|---|---|---|---|---|
| T01 | `add-to-basket.spec.ts :: Add a product to the basket > add one product and check the basket` | 7 | 7 | 0 | 0 |
| T02 | `basket-quantity-and-remove.spec.ts :: Change the quantity and remove a product in the basket > chang` | 21 | 20 | 1 | 0 |
| T03 | `card-order-end-to-end.spec.ts :: Order with a card, from basket to order history > order two product` | 34 | 34 | 0 | 0 |
| T04 | `invalid-and-expired-coupon.spec.ts :: Invalid coupon and expired coupon > neither an invalid code no` | 18 | 18 | 0 | 0 |
| T05 | `login.spec.ts :: Login with a valid and an invalid password > login with a wrong and then a correct ` | 5 | 5 | 0 | 0 |
| T06 | `purchase-limit.spec.ts :: Purchase limit for one product > the basket stops at 5 items of one produc` | 11 | 10 | 1 | 0 |
| T07 | `valid-coupon.spec.ts :: Valid coupon on the payment step > the 10% coupon of the current month reduc` | 16 | 16 | 0 | 0 |
| T08 | `wallet-payment.spec.ts :: Payment with the wallet > the wallet cannot pay a short balance and pays t` | 18 | 18 | 0 | 0 |

## Mutants

| ID | Site | Function | Original | Mutated | Tests | Status |
|---|---|---|---|---|---|---|
| S001 | `tests/add-to-basket.spec.ts:17` | - | `0` | `1` | failed: T01 | killed |
| S002 | `tests/add-to-basket.spec.ts:23` | - | `1` | `2` | failed: T01 | killed |
| S003 | `tests/add-to-basket.spec.ts:28` | - | `1` | `2` | failed: T01 | killed |
| S004 | `tests/add-to-basket.spec.ts:29` | - | `1` | `2` | failed: T01 | killed |
| S005 | `tests/basket-quantity-and-remove.spec.ts:20` | - | `2` | `3` | failed: T02 | killed |
| S006 | `tests/basket-quantity-and-remove.spec.ts:24` | - | `1` | `2` | failed: T02 | killed |
| S007 | `tests/basket-quantity-and-remove.spec.ts:25` | - | `1` | `2` | failed: T02 | killed |
| S008 | `tests/basket-quantity-and-remove.spec.ts:26` | - | `'13.98¤'` | `'13.98¤_mut'` | failed: T02 | killed |
| S009 | `tests/basket-quantity-and-remove.spec.ts:27` | - | `2` | `3` | failed: T02 | killed |
| S010 | `tests/basket-quantity-and-remove.spec.ts:32` | - | `2` | `3` | failed: T02 | killed |
| S011 | `tests/basket-quantity-and-remove.spec.ts:33` | - | `'18.97¤'` | `'18.97¤_mut'` | failed: T02 | killed |
| S012 | `tests/basket-quantity-and-remove.spec.ts:34` | - | `3` | `4` | failed: T02 | killed |
| S013 | `tests/basket-quantity-and-remove.spec.ts:39` | - | `1` | `2` | failed: T02 | killed |
| S014 | `tests/basket-quantity-and-remove.spec.ts:40` | - | `'13.98¤'` | `'13.98¤_mut'` | failed: T02 | killed |
| S015 | `tests/basket-quantity-and-remove.spec.ts:41` | - | `2` | `3` | failed: T02 | killed |
| S016 | `tests/basket-quantity-and-remove.spec.ts:46` | - | `1` | `2` | failed: T02 | killed |
| S017 | `tests/basket-quantity-and-remove.spec.ts:47` | - | `'13.98¤'` | `'13.98¤_mut'` | failed: T02 | killed |
| S018 | `tests/basket-quantity-and-remove.spec.ts:48` | - | `2` | `3` | failed: T02 | killed |
| S019 | `tests/basket-quantity-and-remove.spec.ts:54` | - | `1` | `2` | failed: T02 | killed |
| S020 | `tests/basket-quantity-and-remove.spec.ts:55` | - | `'8.99¤'` | `'8.99¤_mut'` | failed: T02 | killed |
| S021 | `tests/basket-quantity-and-remove.spec.ts:56` | - | `1` | `2` | failed: T02 | killed |
| S022 | `tests/card-order-end-to-end.spec.ts:37` | - | `3` | `4` | failed: T03 | killed |
| S023 | `tests/card-order-end-to-end.spec.ts:42` | - | `2` | `3` | failed: T03 | killed |
| S024 | `tests/card-order-end-to-end.spec.ts:43` | - | `1` | `2` | failed: T03 | killed |
| S025 | `tests/card-order-end-to-end.spec.ts:44` | - | `'20.97¤'` | `'20.97¤_mut'` | failed: T03 | killed |
| S026 | `tests/card-order-end-to-end.spec.ts:72` | - | `'20.97¤'` | `'20.97¤_mut'` | failed: T03 | killed |
| S027 | `tests/card-order-end-to-end.spec.ts:72` | - | `'0.99¤'` | `'0.99¤_mut'` | failed: T03 | killed |
| S028 | `tests/card-order-end-to-end.spec.ts:72` | - | `'2.10¤'` | `'2.10¤_mut'` | failed: T03 | killed |
| S029 | `tests/card-order-end-to-end.spec.ts:72` | - | `'19.86¤'` | `'19.86¤_mut'` | failed: T03 | killed |
| S030 | `tests/card-order-end-to-end.spec.ts:82` | - | `2` | `3` | failed: T03 | killed |
| S031 | `tests/card-order-end-to-end.spec.ts:83` | - | `1` | `2` | failed: T03 | killed |
| S032 | `tests/card-order-end-to-end.spec.ts:84` | - | `'20.97¤'` | `'20.97¤_mut'` | failed: T03 | killed |
| S033 | `tests/card-order-end-to-end.spec.ts:84` | - | `'0.99¤'` | `'0.99¤_mut'` | failed: T03 | killed |
| S034 | `tests/card-order-end-to-end.spec.ts:84` | - | `'2.10¤'` | `'2.10¤_mut'` | failed: T03 | killed |
| S035 | `tests/card-order-end-to-end.spec.ts:84` | - | `'19.86¤'` | `'19.86¤_mut'` | failed: T03 | killed |
| S036 | `tests/card-order-end-to-end.spec.ts:88` | - | `0` | `1` | failed: T03 | killed |
| S037 | `tests/card-order-end-to-end.spec.ts:94` | - | `/#\/order-history/` | `/(?:#\/order-history)_mut/` | failed: T03 | killed |
| S038 | `tests/card-order-end-to-end.spec.ts:95` | - | `1` | `2` | failed: T03 | killed |
| S039 | `tests/card-order-end-to-end.spec.ts:96` | - | `'19.86¤'` | `'19.86¤_mut'` | failed: T03 | killed |
| S040 | `tests/card-order-end-to-end.spec.ts:97` | - | `2` | `3` | failed: T03 | killed |
| S041 | `tests/card-order-end-to-end.spec.ts:98` | - | `1` | `2` | failed: T03 | killed |
| S042 | `tests/fixtures.ts:28` | `loggedInPage` | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T01, T02, T03, T04, T06, T07, T08 | killed |
| S043 | `tests/invalid-and-expired-coupon.spec.ts:27` | - | `2` | `3` | failed: T04 | killed |
| S044 | `tests/invalid-and-expired-coupon.spec.ts:47` | - | `0` | `1` | failed: T04 | killed |
| S045 | `tests/invalid-and-expired-coupon.spec.ts:54` | - | `0` | `1` | failed: T04 | killed |
| S046 | `tests/invalid-and-expired-coupon.spec.ts:61` | - | `'17.98¤'` | `'17.98¤_mut'` | failed: T04 | killed |
| S047 | `tests/invalid-and-expired-coupon.spec.ts:61` | - | `'0.99¤'` | `'0.99¤_mut'` | failed: T04 | killed |
| S048 | `tests/invalid-and-expired-coupon.spec.ts:61` | - | `'0.00¤'` | `'0.00¤_mut'` | failed: T04 | killed |
| S049 | `tests/invalid-and-expired-coupon.spec.ts:61` | - | `'18.97¤'` | `'18.97¤_mut'` | failed: T04 | killed |
| S050 | `tests/login.spec.ts:21` | - | `/#\/login/` | `/(?:#\/login)_mut/` | failed: T05 | killed |
| S051 | `tests/login.spec.ts:33` | - | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T05 | killed |
| S052 | `tests/pages/account.ts:9` | `expectOpen` | `/#\/order-history/` | `/(?:#\/order-history)_mut/` | failed: T03, T08 | killed |
| S053 | `tests/pages/checkout.ts:16` | `expectOpen` | `/#\/address\/select/` | `/(?:#\/address\/select)_mut/` | failed: T03, T04, T07, T08 | killed |
| S054 | `tests/pages/checkout.ts:38` | `expectOpen` | `/#\/delivery-method/` | `/(?:#\/delivery-method)_mut/` | failed: T03, T04, T07, T08 | killed |
| S055 | `tests/pages/checkout.ts:66` | `expectOpen` | `/#\/payment\/shop/` | `/(?:#\/payment\/shop)_mut/` | failed: T03, T04, T07, T08 | killed |
| S056 | `tests/pages/checkout.ts:114` | `expectOpen` | `/#\/order-summary/` | `/(?:#\/order-summary)_mut/` | failed: T03, T04, T07, T08 | killed |
| S057 | `tests/pages/checkout.ts:152` | `expectTotals` | `'Items'` | `'Items_mut'` | failed: T03, T04, T07 | killed |
| S058 | `tests/pages/checkout.ts:153` | `expectTotals` | `'Delivery'` | `'Delivery_mut'` | failed: T03, T04, T07 | killed |
| S059 | `tests/pages/checkout.ts:154` | `expectTotals` | `'Promotion'` | `'Promotion_mut'` | failed: T03, T04, T07 | killed |
| S060 | `tests/pages/checkout.ts:155` | `expectTotals` | `'Total Price'` | `'Total Price_mut'` | failed: T03, T04, T07 | killed |
| S061 | `tests/pages/checkout.ts:180` | `expectOpen` | `/#\/order-completion\/.+/` | `/(?:#\/order-completion\/.+)_mut/` | failed: T03, T08 | killed |
| S062 | `tests/pages/login.ts:37` | `expectForm` | `'Email'` | `'Email_mut'` | failed: T05 | killed |
| S063 | `tests/pages/login.ts:39` | `expectForm` | `'Password'` | `'Password_mut'` | failed: T05 | killed |
| S064 | `tests/pages/login.ts:41` | `expectForm` | `'Log in'` | `'Log in_mut'` | failed: T05 | killed |
| S065 | `tests/pages/shop.ts:58` | `openBasket` | `/#\/basket/` | `/(?:#\/basket)_mut/` | failed: T01, T02, T03, T04, T06, T07, T08 | killed |
| S066 | `tests/pages/shop.ts:72` | `goto` | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T01, T04, T06, T07, T08 | killed |
| S067 | `tests/pages/shop.ts:79` | `search` | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T02, T03 | killed |
| S068 | `tests/pages/shop.ts:117` | `expectNoMessage` | `0` | `1` | ran T01, T02, T03, T04, T05, T06, T07, T08 | survived |
| S069 | `tests/pages/shop.ts:181` | `expectNoRow` | `0` | `1` | ran T01, T02, T03, T04, T05, T06, T07, T08 | survived |
| S070 | `tests/pages/shop.ts:202` | `expectEmptyWhenOpened` | `0` | `1` | failed: T03 | killed |
| S071 | `tests/purchase-limit.spec.ts:17` | - | `1` | `2` | failed: T06 | killed |
| S072 | `tests/purchase-limit.spec.ts:26` | - | `'9.95¤'` | `'9.95¤_mut'` | failed: T06 | killed |
| S073 | `tests/purchase-limit.spec.ts:27` | - | `0` | `1` | failed: T06 | killed |
| S074 | `tests/purchase-limit.spec.ts:36` | - | `5` | `6` | failed: T06 | killed |
| S075 | `tests/purchase-limit.spec.ts:37` | - | `'9.95¤'` | `'9.95¤_mut'` | failed: T06 | killed |
| S076 | `tests/purchase-limit.spec.ts:38` | - | `5` | `6` | failed: T06 | killed |
| S077 | `tests/purchase-limit.spec.ts:46` | - | `5` | `6` | failed: T06 | killed |
| S078 | `tests/valid-coupon.spec.ts:27` | - | `2` | `3` | failed: T07 | killed |
| S079 | `tests/valid-coupon.spec.ts:60` | - | `'17.98¤'` | `'17.98¤_mut'` | failed: T07 | killed |
| S080 | `tests/valid-coupon.spec.ts:60` | - | `'0.99¤'` | `'0.99¤_mut'` | failed: T07 | killed |
| S081 | `tests/valid-coupon.spec.ts:60` | - | `'1.80¤'` | `'1.80¤_mut'` | failed: T07 | killed |
| S082 | `tests/valid-coupon.spec.ts:60` | - | `'17.17¤'` | `'17.17¤_mut'` | failed: T07 | killed |
| S083 | `tests/wallet-payment.spec.ts:31` | - | `1` | `2` | failed: T08 | killed |
| S084 | `tests/wallet-payment.spec.ts:47` | - | `'5.00'` | `'5.00_mut'` | failed: T08 | killed |
| S085 | `tests/wallet-payment.spec.ts:62` | - | `'5.00'` | `'5.00_mut'` | failed: T08 | killed |
| S086 | `tests/wallet-payment.spec.ts:77` | - | `'8.99'` | `'8.99_mut'` | failed: T08 | killed |
| S087 | `tests/wallet-payment.spec.ts:85` | - | `'8.99¤'` | `'8.99¤_mut'` | failed: T08 | killed |
| S088 | `tests/wallet-payment.spec.ts:95` | - | `'1.00'` | `'1.00_mut'` | failed: T08 | killed |
| S089 | `tests/wallet-payment.spec.ts:100` | - | `1` | `2` | failed: T08 | killed |
| S090 | `tests/wallet-payment.spec.ts:101` | - | `'8.99¤'` | `'8.99¤_mut'` | failed: T08 | killed |
| S091 | `tests/wallet-payment.spec.ts:102` | - | `/Bonus\s*1(?![\d.])/` | `/(?:Bonus\s*1(?![\d.]))_mut/` | failed: T08 | killed |

## Left-out tests (they fail at the baseline)

None.

## Not mutated

### Argument reaches only a failure message: check by hand (0)

The helper puts this argument only into the message of a failed assertion. The script does not mutate it, because such a mutant cannot fail. If the argument is an expected value, the helper does not check it.

None.

### Cannot fail: negated check (2)

Under `.not`, n + 1 and s_mut make the check weaker. On a correct app, such a mutant cannot fail.

- `tests/card-order-end-to-end.spec.ts:78` `''`
- `tests/login.spec.ts:27` `customer.email`

### Cannot fail: looser bound (0)

In an upper bound, for example `toBeLessThan(n)`, n + 1 makes the check weaker.

None.

### Computed expected value (50)

The expected value is not a literal, so the script does not mutate it.

- `tests/add-to-basket.spec.ts:16` `product.name`
- `tests/add-to-basket.spec.ts:16` `product.price`
- `tests/add-to-basket.spec.ts:22` `` `Placed ${product.name} into basket.` ``
- `tests/add-to-basket.spec.ts:29` `product.name`
- `tests/add-to-basket.spec.ts:30` `product.price`
- `tests/add-to-basket.spec.ts:34` `product.price`
- `tests/basket-quantity-and-remove.spec.ts:24` `productA.name`
- `tests/basket-quantity-and-remove.spec.ts:25` `productB.name`
- `tests/basket-quantity-and-remove.spec.ts:32` `productA.name`
- `tests/basket-quantity-and-remove.spec.ts:39` `productA.name`
- `tests/basket-quantity-and-remove.spec.ts:46` `productA.name`
- `tests/basket-quantity-and-remove.spec.ts:53` `productA.name`
- `tests/basket-quantity-and-remove.spec.ts:54` `productB.name`
- `tests/card-order-end-to-end.spec.ts:42` `productA.name`
- `tests/card-order-end-to-end.spec.ts:43` `productB.name`
- `tests/card-order-end-to-end.spec.ts:82` `productA.name`
- `tests/card-order-end-to-end.spec.ts:82` `productA.price`
- `tests/card-order-end-to-end.spec.ts:83` `productB.name`
- `tests/card-order-end-to-end.spec.ts:83` `productB.price`
- `tests/card-order-end-to-end.spec.ts:89` `() => topBar.openBasket()`
- `tests/card-order-end-to-end.spec.ts:96` `orderId`
- `tests/card-order-end-to-end.spec.ts:97` `productA.name`
- `tests/card-order-end-to-end.spec.ts:97` `productA.price`
- `tests/card-order-end-to-end.spec.ts:98` `productB.name`
- `tests/card-order-end-to-end.spec.ts:98` `productB.price`
- `tests/login.spec.ts:38` `customer.email`
- `tests/pages/account.ts:26` `` new RegExp(`Total Price\\s*${escapeRegExp(total)}`) ``
- `tests/pages/account.ts:32` `price(unitPrice)`
- `tests/pages/checkout.ts:47` `price(DELIVERY.oneDay.price)`
- `tests/pages/checkout.ts:48` `price(DELIVERY.fast.price)`
- `tests/pages/checkout.ts:49` `price(DELIVERY.standard.price)`
- `tests/pages/checkout.ts:128` `SAVED_ADDRESS.name`
- `tests/pages/checkout.ts:130` `` `${SAVED_ADDRESS.address}, ${SAVED_ADDRESS.city}, ${SAVED_ADDRESS.state}, ${SAVED_ADDRESS.zip}` ``
- `tests/pages/checkout.ts:132` `SAVED_ADDRESS.country`
- `tests/pages/checkout.ts:133` `SAVED_ADDRESS.mobileNumber`
- `tests/pages/checkout.ts:138` `` new RegExp(`Card ending in\\s*${SAVED_CARD_LAST_DIGITS}`) ``
- `tests/pages/checkout.ts:139` `SAVED_CARD.name`
- `tests/pages/checkout.ts:148` `price(value)`
- `tests/pages/checkout.ts:171` `` new RegExp(`Items\\s*Delivery\\s*Promotion\\s*Total Price\\s*${values}`) ``
- `tests/pages/checkout.ts:193` `String(quantity)`
- `tests/pages/shop.ts:62` `` new RegExp(`Your Basket\\s*${count}\\s*$`) ``
- `tests/pages/shop.ts:95` `` `Placed ${name} into basket.` ``
- `tests/pages/shop.ts:101` `` `Added another ${name} to basket.` ``
- `tests/purchase-limit.spec.ts:24` `product.name`
- `tests/purchase-limit.spec.ts:24` `quantity`
- `tests/purchase-limit.spec.ts:32` `PURCHASE_LIMIT_MESSAGE`
- `tests/purchase-limit.spec.ts:36` `product.name`
- `tests/purchase-limit.spec.ts:43` `PURCHASE_LIMIT_MESSAGE`
- `tests/purchase-limit.spec.ts:45` `PURCHASE_LIMIT_MESSAGE`
- `tests/wallet-payment.spec.ts:101` `orderId`

### Message (1)

- `tests/pages/shop.ts:201` `'products in the basket on the server'`

### Matcher option (0)

None.

### Attribute or property name (0)

None.

### Timing option (1)

- `tests/pages/shop.ts:117` `timeout: MESSAGE_LIFETIME`

### No operator (null or undefined) (0)

None.
