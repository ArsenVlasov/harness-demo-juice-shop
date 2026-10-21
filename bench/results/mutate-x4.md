# Expectation mutation audit: client

Source: `bench/run-audit-mutate.mjs`, 2026-10-21T15:27:32.240Z. Suite: `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-runs/set-2/run-2/suite-b` at `gen-2` (dd4680b32d9e). TypeScript 5.9.3.
The app restarts before the baseline, before the first mutant and after each 5 mutants.

Sites: 24. Mutants: 24. Killed: 23. Survived: 1. Error: 0. Skipped: 0.
A mutant that survives shows a weak check.
A failed test kills a mutant only when the test passes again on the original file.

## Tests

A killed mutant counts for the tests that killed it.
Any other mutant counts for the selected tests that run the code of its site.
The call graph uses the declarations that TypeScript finds, the fixtures and the hooks.
If no selected test runs the code, the mutant counts for the row `(unattributed)`.

| ID | Test | Sites | Killed | Survived | Error |
|---|---|---|---|---|---|
| T01 | `specs/regression/basket/add-to-basket.spec.ts :: Add a product to the basket` | 3 | 3 | 0 | 0 |
| T02 | `specs/regression/basket/basket-quantity.spec.ts :: Change the quantity and remove a product in the b` | 5 | 4 | 1 | 0 |
| T03 | `specs/regression/basket/purchase-limit.spec.ts :: Purchase limit for one product` | 4 | 4 | 0 | 0 |
| T04 | `specs/regression/login/login.spec.ts :: Login with a valid and an invalid password` | 4 | 4 | 0 | 0 |
| T05 | `specs/regression/order/card-order.spec.ts :: Order with a card, from basket to order history` | 11 | 11 | 0 | 0 |
| T06 | `specs/regression/payment/invalid-coupon.spec.ts :: Invalid coupon and expired coupon` | 6 | 6 | 0 | 0 |
| T07 | `specs/regression/payment/valid-coupon.spec.ts :: Valid coupon on the payment step` | 5 | 5 | 0 | 0 |
| T08 | `specs/regression/payment/wallet-payment.spec.ts :: Payment with the wallet` | 10 | 10 | 0 | 0 |

## Mutants

| ID | Site | Function | Original | Mutated | Tests | Status |
|---|---|---|---|---|---|---|
| S001 | `page-objects/basket-page.ts:36` | `shouldSeePage` | `/#\/basket$/` | `/(?:#\/basket$)_mut/` | failed: T01, T02, T03, T05, T06, T07, T08 | killed |
| S002 | `page-objects/checkout/address-select-page.ts:22` | `shouldSeePage` | `/#\/address\/select$/` | `/(?:#\/address\/select$)_mut/` | failed: T05, T06, T07, T08 | killed |
| S003 | `page-objects/checkout/delivery-method-page.ts:23` | `shouldSeePage` | `/#\/delivery-method$/` | `/(?:#\/delivery-method$)_mut/` | failed: T05, T06, T07, T08 | killed |
| S004 | `page-objects/checkout/order-summary-page.ts:32` | `shouldSeePage` | `/#\/order-summary$/` | `/(?:#\/order-summary$)_mut/` | failed: T05, T06, T07, T08 | killed |
| S005 | `page-objects/checkout/payment-page.ts:27` | `shouldSeePage` | `/#\/payment\/shop$/` | `/(?:#\/payment\/shop$)_mut/` | failed: T05, T06, T07, T08 | killed |
| S006 | `page-objects/components/basket-lines.component.ts:69` | `shouldSeeNoProducts` | `0` | `1` | failed: T05 | killed |
| S007 | `page-objects/login-page.ts:37` | `shouldSeeLoginForm` | `'Login'` | `'Login_mut'` | failed: T04 | killed |
| S008 | `page-objects/login-page.ts:41` | `shouldSeeLoginForm` | `/Log in/` | `/(?:Log in)_mut/` | failed: T04 | killed |
| S009 | `page-objects/login-page.ts:56` | `shouldStayOnLoginPage` | `/#\/login$/` | `/(?:#\/login$)_mut/` | failed: T04 | killed |
| S010 | `page-objects/order-history-page.ts:29` | `shouldSeePage` | `/#\/order-history$/` | `/(?:#\/order-history$)_mut/` | failed: T05, T08 | killed |
| S011 | `page-objects/order-history-page.ts:36` | `shouldSeeEmptyHistory` | `0` | `1` | failed: T08 | killed |
| S012 | `page-objects/search-page.ts:22` | `shouldSeePage` | `/#\/search/` | `/(?:#\/search)_mut/` | failed: T01, T03, T04, T05 | killed |
| S013 | `page-objects/wallet-page.ts:19` | `shouldSeePage` | `/#\/wallet$/` | `/(?:#\/wallet$)_mut/` | failed: T08 | killed |
| S014 | `tests/specs/regression/basket/add-to-basket.spec.ts:21` | - | `0` | `1` | failed: T01 | killed |
| S015 | `tests/specs/regression/basket/basket-quantity.spec.ts:38` | - | `2` | `3` | failed: T02 | killed |
| S016 | `tests/specs/regression/basket/basket-quantity.spec.ts:45` | - | `1` | `2` | ran T02 | survived |
| S017 | `tests/specs/regression/basket/basket-quantity.spec.ts:52` | - | `1` | `2` | failed: T02 | killed |
| S018 | `tests/specs/regression/order/card-order.spec.ts:96` | - | `0` | `1` | failed: T05 | killed |
| S019 | `tests/specs/regression/order/card-order.spec.ts:106` | - | `1` | `2` | failed: T05 | killed |
| S020 | `tests/specs/regression/order/card-order.spec.ts:107` | - | `0` | `1` | failed: T05 | killed |
| S021 | `tests/specs/regression/payment/wallet-payment.spec.ts:106` | - | `1` | `2` | failed: T08 | killed |
| S022 | `tests/specs/regression/payment/wallet-payment.spec.ts:107` | - | `0` | `1` | failed: T08 | killed |
| S023 | `utils/assertions/ui-assertions.ts:53` | `expectTextStays` | `false` | `true` | failed: T02, T03 | killed |
| S024 | `utils/assertions/ui-assertions.ts:67` | `expectStaysHidden` | `false` | `true` | failed: T03, T06 | killed |

## Left-out tests (they fail at the baseline)

None.

## Not mutated

### Argument reaches only a failure message: check by hand (95)

The helper puts this argument only into the message of a failed assertion. The script does not mutate it, because such a mutant cannot fail. If the argument is an expected value, the helper does not check it.

- `page-objects/basket-page.ts:36` `expectUrl(description)` `'Basket page'`
- `page-objects/basket-page.ts:37` `expectVisible(description)` `'Basket title'`
- `page-objects/basket-page.ts:57` `expectText(description)` `'Basket total price'`
- `page-objects/basket-page.ts:61` `expectDisabled(description)` `` 'Button `Checkout`' ``
- `page-objects/checkout/address-select-page.ts:22` `expectUrl(description)` `'Address step'`
- `page-objects/checkout/address-select-page.ts:23` `expectVisible(description)` `` 'Title `Select an address`' ``
- `page-objects/checkout/address-select-page.ts:28` `expectVisible(description)` `'Saved address row'`
- `page-objects/checkout/address-select-page.ts:29` `expectText(description)` `'Saved address name'`
- `page-objects/checkout/address-select-page.ts:33` `expectText(description)` `'Saved address'`
- `page-objects/checkout/address-select-page.ts:35` `expectText(description)` `'Saved address country'`
- `page-objects/checkout/components/coupon-panel.component.ts:27` `expectVisible(description)` `` 'Panel `Add a coupon`' ``
- `page-objects/checkout/components/coupon-panel.component.ts:32` `expectVisible(description)` `` 'Field `Coupon`' ``
- `page-objects/checkout/components/coupon-panel.component.ts:49` `expectText(description)` `'Coupon discount message'`
- `page-objects/checkout/components/coupon-panel.component.ts:53` `expectRejectedStatus(description)` `'Server answer to the last coupon code'`
- `page-objects/checkout/components/coupon-panel.component.ts:54` `expectText(description)` `'Coupon error message'`
- `page-objects/checkout/components/coupon-panel.component.ts:58` `expectStaysHidden(description)` `'Coupon discount message'`
- `page-objects/checkout/components/saved-cards.component.ts:18` `expectVisible(description)` `'Saved card row'`
- `page-objects/checkout/components/saved-cards.component.ts:19` `expectText(description)` `'Saved card number'`
- `page-objects/checkout/components/saved-cards.component.ts:20` `expectText(description)` `'Saved card holder'`
- `page-objects/checkout/components/saved-cards.component.ts:21` `expectText(description)` `'Saved card expiry'`
- `page-objects/checkout/components/wallet-payment.component.ts:16` `expectText(description)` `'Wallet balance on the payment page'`
- `page-objects/checkout/components/wallet-payment.component.ts:20` `expectVisible(description)` `` 'Button `Pay`' ``
- `page-objects/checkout/components/wallet-payment.component.ts:21` `expectText(description)` `` 'Button `Pay`' ``
- `page-objects/checkout/components/wallet-payment.component.ts:25` `expectDisabled(description)` `` 'Button `Pay`' ``
- `page-objects/checkout/components/wallet-payment.component.ts:29` `expectEnabled(description)` `` 'Button `Pay`' ``
- `page-objects/checkout/delivery-method-page.ts:23` `expectUrl(description)` `'Delivery step'`
- `page-objects/checkout/delivery-method-page.ts:24` `expectVisible(description)` `` 'Title `Choose a delivery speed`' ``
- `page-objects/checkout/delivery-method-page.ts:30` `expectVisible(description)` `` `Delivery method ${method.name}` ``
- `page-objects/checkout/delivery-method-page.ts:31` `expectText(description)` `'Delivery method name'`
- `page-objects/checkout/delivery-method-page.ts:32` `expectText(description)` `` `Price of ${method.name}` ``
- `page-objects/checkout/order-completion-page.ts:25` `expectUrl(description)` `'Order confirmation page'`
- `page-objects/checkout/order-completion-page.ts:26` `expectVisible(description)` `'Order confirmation title'`
- `page-objects/checkout/order-completion-page.ts:31` `expectText(description)` `'Order confirmation message'`
- `page-objects/checkout/order-completion-page.ts:43` `expectCount(description)` `'Order confirmation product rows'`
- `page-objects/checkout/order-completion-page.ts:48` `expectText(description)` `` `Quantity of ${line.product.name}` ``
- `page-objects/checkout/order-completion-page.ts:52` `expectText(description)` `` `Price of ${line.product.name}` ``
- `page-objects/checkout/order-completion-page.ts:59` `expectText(description)` `'Order confirmation: items, delivery, promotion, total price'`
- `page-objects/checkout/order-summary-page.ts:32` `expectUrl(description)` `'Order summary step'`
- `page-objects/checkout/order-summary-page.ts:33` `expectVisible(description)` `` 'Title `Order Summary`' ``
- `page-objects/checkout/order-summary-page.ts:41` `expectText(description)` `'Order summary: items'`
- `page-objects/checkout/order-summary-page.ts:42` `expectText(description)` `'Order summary: delivery'`
- `page-objects/checkout/order-summary-page.ts:43` `expectText(description)` `'Order summary: promotion'`
- `page-objects/checkout/order-summary-page.ts:44` `expectText(description)` `'Order summary: total price'`
- `page-objects/checkout/order-summary-page.ts:48` `expectContainText(description)` `'Order summary: address name'`
- `page-objects/checkout/order-summary-page.ts:52` `expectContainText(description)` `'Order summary: address'`
- `page-objects/checkout/order-summary-page.ts:54` `expectContainText(description)` `'Order summary: address country'`
- `page-objects/checkout/order-summary-page.ts:59` `expectContainText(description)` `'Order summary: card'`
- `page-objects/checkout/order-summary-page.ts:60` `expectContainText(description)` `'Order summary: card holder'`
- `page-objects/checkout/order-summary-page.ts:64` `expectContainText(description)` `'Order summary: payment method'`
- `page-objects/checkout/payment-page.ts:27` `expectUrl(description)` `'Payment step'`
- `page-objects/checkout/payment-page.ts:28` `expectVisible(description)` `` 'Title `My Payment Options`' ``
- `page-objects/components/account-menu.component.ts:17` `expectVisible(description)` `` 'Account menu item `Login`' ``
- `page-objects/components/account-menu.component.ts:21` `expectVisible(description)` `` 'Account menu item `Logout`' ``
- `page-objects/components/account-menu.component.ts:25` `expectVisible(description)` `` `Account menu item with the email ${email}` ``
- `page-objects/components/account-menu.component.ts:29` `expectHidden(description)` `` `Account menu item with the email ${email}` ``
- `page-objects/components/account-menu.component.ts:34` `expectHidden(description)` `'Account menu'`
- `page-objects/components/basket-lines.component.ts:30` `expectCount(description)` `'Basket rows'`
- `page-objects/components/basket-lines.component.ts:38` `expectVisible(description)` `` `Basket row of ${line.product.name}` ``
- `page-objects/components/basket-lines.component.ts:43` `expectText(description)` `` `Price of ${line.product.name}` ``
- `page-objects/components/basket-lines.component.ts:51` `expectText(description)` `` `Quantity of ${product.name}` ``
- `page-objects/components/basket-lines.component.ts:60` `expectTextStays(description)` `` `Quantity of ${product.name}` ``
- `page-objects/components/basket-lines.component.ts:65` `expectHidden(description)` `` `Basket row of ${product.name}` ``
- `page-objects/components/basket-lines.component.ts:69` `expectCount(description)` `'Basket rows'`
- `page-objects/components/navbar.component.ts:29` `expectText(description)` `'Basket counter in the top bar'`
- `page-objects/components/navbar.component.ts:33` `expectTextStays(description)` `'Basket counter in the top bar'`
- `page-objects/components/product-card.component.ts:27` `expectText(description)` `'Product name on the card'`
- `page-objects/components/product-card.component.ts:28` `expectText(description)` `` `Price of ${this.product.name}` ``
- `page-objects/components/product-card.component.ts:29` `expectVisible(description)` `` `Button \`Add to Basket\` of ${this.product.name}` ``
- `page-objects/components/snack-bar.component.ts:21` `expectVisible(description)` `` `Confirmation message "${text}"` ``
- `page-objects/components/snack-bar.component.ts:25` `expectVisible(description)` `` `Error message "${text}"` ``
- `page-objects/components/snack-bar.component.ts:29` `expectStaysHidden(description)` `'Error message'`
- `page-objects/components/snack-bar.component.ts:43` `expectHidden(description)` `'Pop-up messages'`
- `page-objects/login-page.ts:33` `expectVisible(description)` `'Login page title'`
- `page-objects/login-page.ts:37` `expectText(description)` `'Login page title'`
- `page-objects/login-page.ts:38` `expectVisible(description)` `` 'Field `Email`' ``
- `page-objects/login-page.ts:39` `expectVisible(description)` `` 'Field `Password`' ``
- `page-objects/login-page.ts:40` `expectVisible(description)` `` 'Button `Log in`' ``
- `page-objects/login-page.ts:41` `expectText(description)` `` 'Button `Log in`' ``
- `page-objects/login-page.ts:52` `expectText(description)` `'Login error message'`
- `page-objects/login-page.ts:56` `expectUrl(description)` `'Login page'`
- `page-objects/login-page.ts:74` `expectVisible(description)` `'Product list after the login'`
- `page-objects/order-history-page.ts:29` `expectUrl(description)` `'Order history page'`
- `page-objects/order-history-page.ts:30` `expectVisible(description)` `` 'Title `Order History`' ``
- `page-objects/order-history-page.ts:35` `expectVisible(description)` `'Empty order history message'`
- `page-objects/order-history-page.ts:36` `expectCount(description)` `'Orders in the history'`
- `page-objects/order-history-page.ts:40` `expectCount(description)` `'Orders in the history'`
- `page-objects/order-history-page.ts:51` `expectText(description)` `'Order ID'`
- `page-objects/order-history-page.ts:53` `expectText(description)` `'Order total price'`
- `page-objects/order-history-page.ts:55` `expectText(description)` `'Order bonus'`
- `page-objects/order-history-page.ts:61` `expectText(description)` `` `Quantity of ${line.product.name}` ``
- `page-objects/search-page.ts:22` `expectUrl(description)` `'Product list'`
- `page-objects/search-page.ts:23` `expectVisible(description)` `'Product list'`
- `page-objects/wallet-page.ts:19` `expectUrl(description)` `'Wallet page'`
- `page-objects/wallet-page.ts:20` `expectVisible(description)` `` 'Title `Digital Wallet`' ``
- `page-objects/wallet-page.ts:24` `expectText(description)` `'Wallet balance'`

### Cannot fail: negated check (0)

Under `.not`, n + 1 and s_mut make the check weaker. On a correct app, such a mutant cannot fail.

None.

### Cannot fail: looser bound (0)

In an upper bound, for example `toBeLessThan(n)`, n + 1 makes the check weaker.

None.

### Computed expected value (116)

The expected value is not a literal, so the script does not mutate it.

- `page-objects/basket-page.ts:57` `` `Total Price: ${PriceHelper.format(amount)}` ``
- `page-objects/basket-page.ts:80` `product`
- `page-objects/basket-page.ts:80` `quantity`
- `page-objects/checkout/address-select-page.ts:29` `address.fullName`
- `page-objects/checkout/address-select-page.ts:32` `` `${address.streetAddress}, ${address.city}, ${address.state}, ${address.zipCode}` ``
- `page-objects/checkout/address-select-page.ts:35` `address.country`
- `page-objects/checkout/components/coupon-panel.component.ts:49` `UI_MESSAGES.couponDiscount(discountPercent)`
- `page-objects/checkout/components/coupon-panel.component.ts:54` `UI_MESSAGES.invalidCoupon`
- `page-objects/checkout/components/saved-cards.component.ts:19` `` new RegExp(`\\*+${lastDigits}$`) ``
- `page-objects/checkout/components/saved-cards.component.ts:20` `card.fullName`
- `page-objects/checkout/components/saved-cards.component.ts:21` `` `${card.expMonth}/${card.expYear}` ``
- `page-objects/checkout/components/wallet-payment.component.ts:16` `PriceHelper.formatBalance(amount)`
- `page-objects/checkout/components/wallet-payment.component.ts:21` `` `Pay ${PriceHelper.format(amount)}` ``
- `page-objects/checkout/delivery-method-page.ts:31` `method.name`
- `page-objects/checkout/delivery-method-page.ts:32` `PriceHelper.format(method.price)`
- `page-objects/checkout/order-completion-page.ts:25` `ORDER_COMPLETION_URL`
- `page-objects/checkout/order-completion-page.ts:31` `UI_MESSAGES.orderPlaced`
- `page-objects/checkout/order-completion-page.ts:43` `lines.length`
- `page-objects/checkout/order-completion-page.ts:48` `String(line.quantity)`
- `page-objects/checkout/order-completion-page.ts:51` `PriceHelper.format(line.product.price)`
- `page-objects/checkout/order-completion-page.ts:59` `expected`
- `page-objects/checkout/order-summary-page.ts:41` `PriceHelper.format(totals.items)`
- `page-objects/checkout/order-summary-page.ts:42` `PriceHelper.format(totals.delivery)`
- `page-objects/checkout/order-summary-page.ts:43` `PriceHelper.format(totals.promotion)`
- `page-objects/checkout/order-summary-page.ts:44` `PriceHelper.format(totals.total)`
- `page-objects/checkout/order-summary-page.ts:48` `address.fullName`
- `page-objects/checkout/order-summary-page.ts:51` `` `${address.streetAddress}, ${address.city}, ${address.state}, ${address.zipCode}` ``
- `page-objects/checkout/order-summary-page.ts:54` `address.country`
- `page-objects/checkout/order-summary-page.ts:59` `UI_MESSAGES.cardPaymentMethod(lastDigits)`
- `page-objects/checkout/order-summary-page.ts:60` `card.fullName`
- `page-objects/checkout/order-summary-page.ts:64` `UI_MESSAGES.walletPaymentMethod`
- `page-objects/components/basket-lines.component.ts:30` `lines.length`
- `page-objects/components/basket-lines.component.ts:32` `line`
- `page-objects/components/basket-lines.component.ts:39` `line.product`
- `page-objects/components/basket-lines.component.ts:39` `line.quantity`
- `page-objects/components/basket-lines.component.ts:42` `PriceHelper.format(line.product.price)`
- `page-objects/components/basket-lines.component.ts:50` `String(quantity)`
- `page-objects/components/basket-lines.component.ts:58` `String(quantity)`
- `page-objects/components/navbar.component.ts:29` `String(count)`
- `page-objects/components/navbar.component.ts:33` `String(count)`
- `page-objects/components/product-card.component.ts:27` `this.product.name`
- `page-objects/components/product-card.component.ts:28` `PriceHelper.format(this.product.price)`
- `page-objects/login-page.ts:52` `UI_MESSAGES.invalidLogin`
- `page-objects/order-history-page.ts:51` `` `#${entry.orderId}` ``
- `page-objects/order-history-page.ts:53` `PriceHelper.format(entry.totalPrice)`
- `page-objects/order-history-page.ts:55` `String(entry.bonus)`
- `page-objects/order-history-page.ts:61` `String(line.quantity)`
- `page-objects/wallet-page.ts:24` `PriceHelper.formatBalance(amount)`
- `tests/specs/regression/basket/add-to-basket.spec.ts:20` `product`
- `tests/specs/regression/basket/add-to-basket.spec.ts:26` `UI_MESSAGES.placedIntoBasket(product.name)`
- `tests/specs/regression/basket/add-to-basket.spec.ts:27` `PriceHelper.itemCount(basketAfterAdding)`
- `tests/specs/regression/basket/add-to-basket.spec.ts:33` `basketAfterAdding`
- `tests/specs/regression/basket/add-to-basket.spec.ts:37` `PriceHelper.basketTotal(basketAfterAdding)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:31` `startBasket`
- `tests/specs/regression/basket/basket-quantity.spec.ts:32` `PriceHelper.basketTotal(startBasket)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:33` `PriceHelper.itemCount(startBasket)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:38` `productA`
- `tests/specs/regression/basket/basket-quantity.spec.ts:39` `PriceHelper.basketTotal(basketWithTwoOfA)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:40` `PriceHelper.itemCount(basketWithTwoOfA)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:45` `productA`
- `tests/specs/regression/basket/basket-quantity.spec.ts:46` `PriceHelper.basketTotal(startBasket)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:47` `PriceHelper.itemCount(startBasket)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:52` `productA`
- `tests/specs/regression/basket/basket-quantity.spec.ts:53` `startBasket`
- `tests/specs/regression/basket/basket-quantity.spec.ts:54` `PriceHelper.basketTotal(startBasket)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:59` `productA`
- `tests/specs/regression/basket/basket-quantity.spec.ts:60` `basketWithoutA`
- `tests/specs/regression/basket/basket-quantity.spec.ts:61` `PriceHelper.basketTotal(basketWithoutA)`
- `tests/specs/regression/basket/basket-quantity.spec.ts:62` `PriceHelper.itemCount(basketWithoutA)`
- `tests/specs/regression/basket/purchase-limit.spec.ts:23` `UI_MESSAGES.placedIntoBasket(product.name)`
- `tests/specs/regression/basket/purchase-limit.spec.ts:24` `PriceHelper.itemCount(basketWithOne)`
- `tests/specs/regression/basket/purchase-limit.spec.ts:30` `product`
- `tests/specs/regression/basket/purchase-limit.spec.ts:30` `limit`
- `tests/specs/regression/basket/purchase-limit.spec.ts:31` `PriceHelper.basketTotal(basketAtLimit)`
- `tests/specs/regression/basket/purchase-limit.spec.ts:37` `UI_MESSAGES.purchaseLimit(limit)`
- `tests/specs/regression/basket/purchase-limit.spec.ts:41` `product`
- `tests/specs/regression/basket/purchase-limit.spec.ts:41` `limit`
- `tests/specs/regression/basket/purchase-limit.spec.ts:43` `product`
- `tests/specs/regression/basket/purchase-limit.spec.ts:43` `limit`
- `tests/specs/regression/basket/purchase-limit.spec.ts:44` `PriceHelper.basketTotal(basketAtLimit)`
- `tests/specs/regression/basket/purchase-limit.spec.ts:45` `PriceHelper.itemCount(basketAtLimit)`
- `tests/specs/regression/basket/purchase-limit.spec.ts:51` `UI_MESSAGES.purchaseLimit(limit)`
- `tests/specs/regression/basket/purchase-limit.spec.ts:52` `PriceHelper.itemCount(basketAtLimit)`
- `tests/specs/regression/login/login.spec.ts:34` `customer.email`
- `tests/specs/regression/login/login.spec.ts:45` `customer.email`
- `tests/specs/regression/order/card-order.spec.ts:51` `PriceHelper.itemCount(basket)`
- `tests/specs/regression/order/card-order.spec.ts:56` `basket`
- `tests/specs/regression/order/card-order.spec.ts:57` `PriceHelper.basketTotal(basket)`
- `tests/specs/regression/order/card-order.spec.ts:71` `COUPON_DISCOUNT_PERCENT`
- `tests/specs/regression/order/card-order.spec.ts:78` `SAVED_ADDRESS`
- `tests/specs/regression/order/card-order.spec.ts:79` `SAVED_CARD`
- `tests/specs/regression/order/card-order.spec.ts:80` `basket`
- `tests/specs/regression/order/card-order.spec.ts:81` `orderTotals`
- `tests/specs/regression/order/card-order.spec.ts:91` `basket`
- `tests/specs/regression/order/card-order.spec.ts:92` `orderTotals`
- `tests/specs/regression/order/card-order.spec.ts:107` `orderId`
- `tests/specs/regression/order/card-order.spec.ts:107` `orderTotals.total`
- `tests/specs/regression/order/card-order.spec.ts:107` `basket`
- `tests/specs/regression/payment/invalid-coupon.spec.ts:47` `basket`
- `tests/specs/regression/payment/invalid-coupon.spec.ts:48` `PriceHelper.orderTotals(basket, delivery, NO_DISCOUNT_PERCENT)`
- `tests/specs/regression/payment/valid-coupon.spec.ts:25` `SAVED_ADDRESS`
- `tests/specs/regression/payment/valid-coupon.spec.ts:32` `ALL_DELIVERY_METHODS`
- `tests/specs/regression/payment/valid-coupon.spec.ts:39` `SAVED_CARD`
- `tests/specs/regression/payment/valid-coupon.spec.ts:46` `COUPON_DISCOUNT_PERCENT`
- `tests/specs/regression/payment/valid-coupon.spec.ts:53` `basket`
- `tests/specs/regression/payment/valid-coupon.spec.ts:54` `PriceHelper.orderTotals(basket, delivery, COUPON_DISCOUNT_PERCENT)`
- `tests/specs/regression/payment/wallet-payment.spec.ts:50` `WALLET_AMOUNTS.firstBalance`
- `tests/specs/regression/payment/wallet-payment.spec.ts:51` `orderTotals.total`
- `tests/specs/regression/payment/wallet-payment.spec.ts:68` `WALLET_AMOUNTS.firstBalance`
- `tests/specs/regression/payment/wallet-payment.spec.ts:78` `balanceBeforeOrder`
- `tests/specs/regression/payment/wallet-payment.spec.ts:79` `orderTotals.total`
- `tests/specs/regression/payment/wallet-payment.spec.ts:87` `orderTotals`
- `tests/specs/regression/payment/wallet-payment.spec.ts:99` `balanceAfterOrder`
- `tests/specs/regression/payment/wallet-payment.spec.ts:107` `orderTotals.total`
- `tests/specs/regression/payment/wallet-payment.spec.ts:107` `bonus`
- `utils/assertions/response-assertions.ts:8` `FIRST_CLIENT_ERROR_STATUS`

### Message (12)

- `utils/assertions/response-assertions.ts:7` `` `${description}: the server sent an answer` ``
- `utils/assertions/response-assertions.ts:8` `` `${description}: the server rejected the request` ``
- `utils/assertions/ui-assertions.ts:6` `` `${description} is visible` ``
- `utils/assertions/ui-assertions.ts:10` `` `${description} is hidden` ``
- `utils/assertions/ui-assertions.ts:19` `` `${description} has the text "${text}"` ``
- `utils/assertions/ui-assertions.ts:23` `` `${description} contains "${text}"` ``
- `utils/assertions/ui-assertions.ts:27` `` `${description}: count is ${count}` ``
- `utils/assertions/ui-assertions.ts:31` `` `${description} is enabled` ``
- `utils/assertions/ui-assertions.ts:35` `` `${description} is disabled` ``
- `utils/assertions/ui-assertions.ts:39` `` `${description}: the URL matches ${url}` ``
- `utils/assertions/ui-assertions.ts:53` `` `${description} keeps the text "${text}" for ${holdMs} ms` ``
- `utils/assertions/ui-assertions.ts:67` `` `${description} stays hidden for ${holdMs} ms` ``

### Matcher option (0)

None.

### Attribute or property name (0)

None.

### Timing option (8)

- `page-objects/checkout/components/coupon-panel.component.ts:58` `NO_CHANGE_HOLD_MS`
- `page-objects/components/basket-lines.component.ts:59` `NO_CHANGE_HOLD_MS`
- `page-objects/components/navbar.component.ts:33` `NO_CHANGE_HOLD_MS`
- `page-objects/components/snack-bar.component.ts:29` `NO_CHANGE_HOLD_MS`
- `page-objects/components/snack-bar.component.ts:44` `timeout: DateHelper.secondsToMs(10)`
- `page-objects/components/snack-bar.component.ts:43` `CLOSE_ATTEMPT_MS`
- `utils/assertions/ui-assertions.ts:10` `timeout`
- `utils/assertions/ui-assertions.ts:48` `timeout: holdMs`

### No operator (null or undefined) (0)

None.
