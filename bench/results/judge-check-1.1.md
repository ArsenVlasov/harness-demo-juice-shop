# The manual check of the judge (item 1.1)

The command `node bench/judge-check-packet.mjs` wrote this file. The order: the question of principle, then the other steps of A, then the sample of item 1.1.
The notes of the judge are quoted with no change, in `text` blocks.
Write your verdict for each row into `bench/judge-check-1.1.csv`, column `arsen`: `covered`, `partial` or `missing`. Add a short note when you do not agree with the judge.
Use the rubric of the judge (`bench/judge.md`, the table "Verdict"). The judge used the precise test cases, so the step text below is the precise text.

## Part 1: one question of principle

The rubric gives `partial` to "a value that it calculates the same way as the app, not the value of the test case".
Suites A-2 and B-2 both calculate the expected totals from fixed constants. The judge gave A-2 `partial` and B-2 `covered` for these steps.

Question: a test calculates the expected value from fixed constants of the test data, with the formula of the test case. Is this check `covered` or `partial`?
Write your answer in the row `principle` of the answer sheet.

Example: TC-05 step 5 of vague run 2.

Step: Select the saved card. Click `Continue`.

Expected result: The page `Order Summary` shows `Items` `17.98¤`, `Delivery` `0.99¤`, `Promotion` `1.80¤` and `Total Price` `17.17¤`.

### A-2: the judge gave `partial`

Note of the judge:
```text
Items, Promotion and Total Price are calculated with helpers instead of being compared to `17.98¤`, `1.80¤` and `17.17¤`.
```

`data/test-data.ts`, lines 1 to 16:
```ts
   1   /** Shop catalog values of OWASP Juice Shop v20.3.0 (normal customer prices). */
   2   export const PRODUCTS = {
   3     appleJuice: { id: 1, name: 'Apple Juice (1000ml)', price: 1.99 },
   4     eggfruitJuice: { id: 3, name: 'Eggfruit Juice (500ml)', price: 8.99 },
   5     raspberryJuice: { id: 4, name: 'Raspberry Juice (1000ml)', price: 4.99 },
   6     carrotJuice: { id: 30, name: 'Carrot Juice (1000ml)', price: 2.99 },
   7   } as const;
   8   
   9   export type Product = (typeof PRODUCTS)[keyof typeof PRODUCTS];
  10   
  11   export const DELIVERY = {
  12     oneDay: { name: 'One Day Delivery', price: 0.99 },
  13     fast: { name: 'Fast Delivery', price: 0.5 },
  14     standard: { name: 'Standard Delivery', price: 0 },
  15   } as const;
  16   
```

`helpers/money.ts`, lines 14 to 28:
```ts
  14   export const itemsTotal = (lines: Line[]): number =>
  15     fromCents(lines.reduce((sum, l) => sum + toCents(l.price) * l.quantity, 0));
  16   
  17   export const itemCount = (lines: Line[]): number => lines.reduce((sum, l) => sum + l.quantity, 0);
  18   
  19   /** Discount on the price of the products only, rounded to cents. */
  20   export const discount = (items: number, percent: number): number =>
  21     fromCents(Math.round((toCents(items) * percent) / 100));
  22   
  23   export const orderTotal = (items: number, delivery: number, promotion = 0): number =>
  24     fromCents(toCents(items) + toCents(delivery) - toCents(promotion));
  25   
  26   /** Bonus points of an order: round(product price / 10) × quantity, per product. */
  27   export const bonusPoints = (lines: Line[]): number =>
  28     lines.reduce((sum, l) => sum + Math.round(l.price / 10) * l.quantity, 0);
```

`tests/tc-05-valid-coupon.spec.ts`, lines 20 to 30:
```ts
  20       const product = PRODUCTS.eggfruitJuice;
  21       const quantity = 2;
  22       const delivery = DELIVERY.oneDay;
  23       const coupon = couponCode(await appDate(request), COUPON_DISCOUNT);
  24       const items = itemsTotal([{ price: product.price, quantity }]);
  25       const promotion = discount(items, COUPON_DISCOUNT);
  26   
  27       await api.addAddress();
  28       await api.addCard();
  29       await api.addToBasket(product.id, quantity);
  30       await loginAsCustomer();
```

`tests/tc-05-valid-coupon.spec.ts`, lines 62 to 70:
```ts
  62   
  63       await test.step('5. Select the saved card and continue', async () => {
  64         await paymentPage.selectCardAndContinue(CARD_LAST_DIGITS);
  65         await expect(page).toHaveURL(/#\/order-summary/);
  66         await expect(orderSummaryPage.items).toHaveText(price(items));
  67         await expect(orderSummaryPage.delivery).toHaveText(price(delivery.price));
  68         await expect(orderSummaryPage.promotion).toHaveText(price(promotion));
  69         await expect(orderSummaryPage.totalPrice).toHaveText(price(orderTotal(items, delivery.price, promotion)));
  70       });
```

### B-2: the judge gave `covered`

Note of the judge:
```text
Checks Items 17.98¤, Delivery 0.99¤, Promotion 1.80¤ and Total Price 17.17¤ from the test data.
```

`utils/constants/shop-catalog.ts`, lines 1 to 24:
```ts
   1   import type { DeliveryMethod, LimitedProduct, Product } from '@/utils/types/shop';
   2   
   3   /** Catalog of Juice Shop v20.3.0. Prices are the prices of a normal (not deluxe) customer. */
   4   export const PRODUCTS = {
   5     appleJuice: { id: 1, name: 'Apple Juice (1000ml)', price: 1.99, purchaseLimit: 5 } satisfies LimitedProduct,
   6     eggfruitJuice: { id: 3, name: 'Eggfruit Juice (500ml)', price: 8.99 } satisfies Product,
   7     raspberryJuice: { id: 4, name: 'Raspberry Juice (1000ml)', price: 4.99 } satisfies Product,
   8     carrotJuice: { id: 30, name: 'Carrot Juice (1000ml)', price: 2.99 } satisfies Product,
   9   } as const;
  10   
  11   export const DELIVERY_METHODS = {
  12     oneDay: { name: 'One Day Delivery', price: 0.99 } satisfies DeliveryMethod,
  13     fast: { name: 'Fast Delivery', price: 0.5 } satisfies DeliveryMethod,
  14     standard: { name: 'Standard Delivery', price: 0 } satisfies DeliveryMethod,
  15   } as const;
  16   
  17   export const ALL_DELIVERY_METHODS: DeliveryMethod[] = [
  18     DELIVERY_METHODS.oneDay,
  19     DELIVERY_METHODS.fast,
  20     DELIVERY_METHODS.standard,
  21   ];
  22   
  23   export const COUPON_DISCOUNT_PERCENT = 10;
  24   
```

`utils/helpers/price-helper.ts`, lines 26 to 44:
```ts
  26     static basketTotal(lines: BasketLine[]): number {
  27       return PriceHelper.roundToCents(lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0));
  28     }
  29   
  30     static itemCount(lines: BasketLine[]): number {
  31       return lines.reduce((sum, line) => sum + line.quantity, 0);
  32     }
  33   
  34     static orderTotals(lines: BasketLine[], delivery: DeliveryMethod, discountPercent: number): OrderTotals {
  35       const items = PriceHelper.basketTotal(lines);
  36       const promotion = PriceHelper.roundToCents((items * discountPercent) / PERCENT_BASE);
  37       const total = PriceHelper.roundToCents(items + delivery.price - promotion);
  38       return { items, delivery: delivery.price, promotion, total };
  39     }
  40   
  41     /** Bonus points of one product: price / 10, rounded to a whole number, × quantity. */
  42     static bonusPoints(lines: BasketLine[]): number {
  43       return lines.reduce((sum, line) => sum + Math.round(line.product.price / BONUS_DIVISOR) * line.quantity, 0);
  44     }
```

`tests/specs/regression/payment/valid-coupon.spec.ts`, lines 45 to 58:
```ts
  45         await paymentPage.redeemCoupon(CouponHelper.currentMonth(COUPON_DISCOUNT_PERCENT));
  46         await paymentPage.shouldSeeCouponDiscountMessage(COUPON_DISCOUNT_PERCENT);
  47       });
  48   
  49       await test.step('5. Select the saved card and click `Continue`', async () => {
  50         await paymentPage.selectCard(SAVED_CARD);
  51         await paymentPage.clickContinue();
  52         await orderSummaryPage.shouldSeePage();
  53         await orderSummaryPage.shouldSeeLines(basket);
  54         await orderSummaryPage.shouldSeeTotals(PriceHelper.orderTotals(basket, delivery, COUPON_DISCOUNT_PERCENT));
  55       });
  56     },
  57   );
```

## Part 2: the steps of A that the judge gave `partial` for another reason

### vague-1, TC-04 step 2

Step: Open the basket `/#/basket`. Click the plus button in the row of the product until the quantity is `5`.

Expected result: The product has quantity `5`. The basket shows `Total Price: 9.95¤`. No error message shows.

**A** (`set-2/run-1/suite-a`, tag `gen-1`), row `vague-1-A-TC-04-2`: the judge gave `partial`. Note of the judge:

```text
For 'no error message', it checks only that the limit message is absent, not that no error message at all shows.
```

`tests/tc-04-purchase-limit.spec.ts`:
```ts
  21       }
  22 >     await expect(basket.quantity(product.name)).toHaveText(String(APPLE_JUICE_LIMIT));
  23 >     await expectPrice(basket.totalPrice, APPLE_JUICE_LIMIT * product.price);
  24 >     await expect(basket.message(limitMessage)).toHaveCount(0);
  25     });
```

**B** (`set-2/run-1/suite-b`, tag `gen-1`), row `vague-1-B-TC-04-2`: the judge gave `covered`. Note of the judge:

```text
Checks each quantity up to 5, that no error message shows, and the total 9.95¤.
```

`page-objects/basket-page.ts`:
```ts
  61       await expectText(row.locator('mat-cell.mat-column-product'), line.product.name, `Name in the row ${line.product.name}`);
  62 >     await expectText(this.quantity(line.product.name), String(line.quantity), `Quantity of ${line.product.name}`);
  63       await expectText(row.locator('mat-cell.mat-column-price'), formatPrice(line.product.price), `Price of ${line.product.name}`);
  ...
  80     async shouldSeeTotalPrice(amount: number): Promise<void> {
  81 >     await expectText(this.totalPrice, `${TOTAL_PRICE_PREFIX}${formatBasketTotal(amount)}`, 'Basket total');
  82     }
```
`page-objects/components/snack-bar.component.ts`:
```ts
  32     async shouldNotSeeError(): Promise<void> {
  33 >     await expectAbsentHeld(this.error, 'Error message');
  34     }
```

### vague-1, TC-06 step 4

Step: Type the expired coupon in the field `Coupon`. Click `Redeem`.

Expected result: The page shows the error `Invalid coupon.` The page does not show `Your discount of`.

**A** (`set-2/run-1/suite-a`, tag `gen-1`), row `vague-1-A-TC-06-4`: the judge gave `partial`. Note of the judge:

```text
The old error from step 3 can satisfy the check, so the code does not reliably check that the expired coupon itself causes the error.
```

`tests/tc-06-invalid-and-expired-coupon.spec.ts`:
```ts
  47       await payment.redeemCoupon(expiredCoupon);
  48 >     await expect(payment.couponError).toHaveText('Invalid coupon.');
  49 >     await expect(payment.couponConfirmation).toHaveCount(0);
  50     });
```

**B** (`set-2/run-1/suite-b`, tag `gen-1`), row `vague-1-B-TC-06-4`: the judge gave `covered`. Note of the judge:

```text
Checks the server rejection, the Invalid coupon. text and that no discount message shows.
```

`page-objects/components/coupon-panel.component.ts`:
```ts
  53     async shouldSeeRejectedMessage(): Promise<void> {
  54 >     expectFlag(this.lastRedeemAccepted, false, 'The server accepts the last redeemed coupon');
  55       await expectVisible(this.errorMessage, 'Coupon error message');
  56 >     await expectText(this.errorMessage, UI_TEXTS.couponRejected, 'Coupon error message');
  57     }
  ...
  59     async shouldNotSeeDiscountMessage(): Promise<void> {
  60 >     await expectAbsentHeld(this.confirmationMessage, 'Coupon discount message');
  61     }
```

### vague-2, TC-01 step 1

Step: Open the login page `/#/login`.

Expected result: The page shows the title `Login`, the fields `Email` and `Password`, and the button `Log in`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-01-1`: the judge gave `partial`. Note of the judge:

```text
Only the button text is checked; the title `Login` and the field labels `Email` and `Password` are checked only for visibility.
```

`tests/tc-01-login.spec.ts`:
```ts
  13         await loginPage.goto();
  14 >       await expect(loginPage.title).toBeVisible();
  15 >       await expect(loginPage.emailInput).toBeVisible();
  16 >       await expect(loginPage.passwordInput).toBeVisible();
  17 >       await expect(loginPage.loginButton).toBeVisible();
  18 >       await expect(loginPage.loginButton).toHaveText(/Log in/);
  19       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-01-1`: the judge gave `covered`. Note of the judge:

```text
Checks the title text Login, the Email and Password fields, and the Log in button with its text.
```

`page-objects/login-page.ts`:
```ts
  36     async shouldSeeLoginForm(): Promise<void> {
  37 >     await expectText(this.title, 'Login', 'Login page title');
  38 >     await expectVisible(this.emailField, 'Field `Email`');
  39 >     await expectVisible(this.passwordField, 'Field `Password`');
  40 >     await expectVisible(this.loginButton, 'Button `Log in`');
  41 >     await expectText(this.loginButton, /Log in/, 'Button `Log in`');
  42     }
```

### vague-2, TC-06 step 4

Step: Type the expired coupon in the field `Coupon`. Click `Redeem`.

Expected result: The page shows the error `Invalid coupon.` The page does not show `Your discount of`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-06-4`: the judge gave `partial`. Note of the judge:

```text
The `Invalid coupon.` error left over from step 3 can satisfy the check, so the error is not proven to come from the expired coupon.
```

`tests/tc-06-invalid-and-expired-coupon.spec.ts`:
```ts
  54         await response;
  55 >       await expect(paymentPage.couponError).toHaveText('Invalid coupon.');
  56 >       await expect(paymentPage.couponConfirmation).toHaveCount(0);
  57       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-06-4`: the judge gave `covered`. Note of the judge:

```text
Checks the rejected status for the expired code, the error text and that no discount message shows.
```

`utils/assertions/response-assertions.ts`:
```ts
   7     expect(status, `${description}: the server sent an answer`).toBeDefined();
   8 >   expect(status, `${description}: the server rejected the request`).toBeGreaterThanOrEqual(FIRST_CLIENT_ERROR_STATUS);
   9   }
```
`page-objects/checkout/components/coupon-panel.component.ts`:
```ts
  53       expectRejectedStatus(this.lastRedeemStatus, 'Server answer to the last coupon code');
  54 >     await expectText(this.errorMessage, UI_MESSAGES.invalidCoupon, 'Coupon error message');
  55     }
```
`utils/assertions/ui-assertions.ts`:
```ts
  66       );
  67 >   expect(appeared, `${description} stays hidden for ${holdMs} ms`).toBe(false);
  68   }
```

### vague-2, TC-07 step 7

Step: Click `Place your order and pay`.

Expected result: The confirmation page `/#/order-completion/<order ID>` shows `Thank you for your purchase!`

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-07-7`: the judge gave `partial`. Note of the judge:

```text
The confirmation element is checked only for visibility, not for the text `Thank you for your purchase!`.
```

`tests/tc-07-card-order-end-to-end.spec.ts`:
```ts
  97         await orderSummaryPage.placeOrderButton.click();
  98 >       await expect(page).toHaveURL(/#\/order-completion\/[^/]+$/);
  99 >       await expect(orderCompletionPage.confirmation).toBeVisible();
 100         orderId = orderCompletionPage.orderId();
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-07-7`: the judge gave `covered`. Note of the judge:

```text
Checks the order-completion URL with an ID and the thank-you message.
```

`page-objects/checkout/order-completion-page.ts`:
```ts
  24     async shouldSeePage(): Promise<void> {
  25 >     await expectUrl(this.page, ORDER_COMPLETION_URL, 'Order confirmation page');
  26       await expectVisible(this.title, 'Order confirmation title');
  ...
  30       await this.shouldSeePage();
  31 >     await expectText(this.title, UI_MESSAGES.orderPlaced, 'Order confirmation message');
  32     }
```

### vague-2, TC-08 step 8

Step: Click `Place your order and pay`.

Expected result: The confirmation page shows `Thank you for your purchase!`

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-08-8`: the judge gave `partial`. Note of the judge:

```text
The confirmation element is checked only for visibility, not for the text `Thank you for your purchase!`.
```

`tests/tc-08-wallet-payment.spec.ts`:
```ts
 100         await orderSummaryPage.placeOrderButton.click();
 101 >       await expect(page).toHaveURL(/#\/order-completion\/[^/]+$/);
 102 >       await expect(orderCompletionPage.confirmation).toBeVisible();
 103       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-08-8`: the judge gave `covered`. Note of the judge:

```text
Checks the confirmation URL and the thank-you message.
```

`page-objects/checkout/order-completion-page.ts`:
```ts
  24     async shouldSeePage(): Promise<void> {
  25 >     await expectUrl(this.page, ORDER_COMPLETION_URL, 'Order confirmation page');
  26       await expectVisible(this.title, 'Order confirmation title');
  ...
  30       await this.shouldSeePage();
  31 >     await expectText(this.title, UI_MESSAGES.orderPlaced, 'Order confirmation message');
  32     }
```

### vague-3, TC-08 step 4

Step: Open the account menu. Click `Orders & Payment`, then `Order History`.

Expected result: The page shows `You have not placed any orders yet.`

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-08-4`: the judge gave `partial`. Note of the judge:

```text
The empty message is matched with a loose regex (/no results|no orders/i), not the exact text You have not placed any orders yet.
```

`tests/tc-08-wallet-payment.spec.ts`:
```ts
  54       await navBar.openOrderHistory();
  55 >     await expect(orderHistoryPage.orders).toHaveCount(0);
  56 >     await expect(orderHistoryPage.emptyMessage).toBeVisible();
  57     });
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-08-4`: the judge gave `covered`. Note of the judge:

```text
Checks the empty order history message.
```

`page-objects/order-history-page.ts`:
```ts
  33     async shouldSeePage(): Promise<void> {
  34 >     await expectText(this.title, UI_TITLES.orderHistory, 'Order history title');
  35     }
  ...
  37     async shouldSeeNoOrdersMessage(): Promise<void> {
  38 >     await expectText(this.emptyMessage, UI_MESSAGES.noOrdersYet, 'Empty order history message');
  39     }
```

## Part 3: the sample of item 1.1, TC-07 and TC-08 of vague runs 2 and 3, the steps with a note about a helper

### vague-2, TC-07 step 2

Step: Open the basket `/#/basket`.

Expected result: The basket shows product A with quantity `2` and product B with quantity `1`. The basket shows `Total Price: 20.97¤`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-07-2`: the judge gave `partial`. Note of the judge:

```text
The total is calculated with itemsTotal() instead of being compared to the literal `20.97¤`.
```

`tests/tc-07-card-order-end-to-end.spec.ts`:
```ts
  55         await expect(basketPage.table.rows).toHaveCount(2);
  56 >       await expect(basketPage.table.quantity(a.name)).toHaveText(String(qtyA));
  57 >       await expect(basketPage.table.quantity(b.name)).toHaveText(String(qtyB));
  58 >       await expect(basketPage.totalPrice).toHaveText(`Total Price: ${price(items)}`);
  59       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-07-2`: the judge gave `covered`. Note of the judge:

```text
Checks quantities 2 and 1 and Total Price: 20.97¤.
```

`page-objects/components/basket-lines.component.ts`:
```ts
  29     async shouldSeeLines(lines: BasketLine[]): Promise<void> {
  30 >     await expectCount(this.rows, lines.length, 'Basket rows');
  31       for (const line of lines) {
  ...
  47     async shouldSeeQuantity(product: Product, quantity: number): Promise<void> {
  48 >     await expectText(
  49         this.row(product).locator('mat-cell.mat-column-quantity'),
```
`page-objects/basket-page.ts`:
```ts
  56     async shouldSeeTotalPrice(amount: number): Promise<void> {
  57 >     await expectText(this.totalPrice, `Total Price: ${PriceHelper.format(amount)}`, 'Basket total price');
  58     }
```

### vague-3, TC-07 step 2

Step: Open the basket `/#/basket`.

Expected result: The basket shows product A with quantity `2` and product B with quantity `1`. The basket shows `Total Price: 20.97¤`.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-07-2`: the judge gave `partial`. Note of the judge:

```text
The total 20.97¤ comes from the itemsTotal helper, not the value in the test case.
```

`tests/tc-07-card-order-end-to-end.spec.ts`:
```ts
  43       await basketPage.open();
  44 >     await expect(basketPage.rows).toHaveCount(2);
  45       await basketPage.expectLine(a.name, a.quantity, a.price);
```
`tests/pages/BasketPage.ts`:
```ts
  49       await expect(this.row(productName)).toHaveCount(1);
  50 >     await expect(this.quantity(productName)).toHaveText(String(quantity));
  51 >     await expect(this.price(productName)).toHaveText(money(price));
  52     }
  ...
  54     async expectTotal(total: number): Promise<void> {
  55 >     await expect(this.totalPrice).toHaveText(`Total Price: ${money(total)}`);
  56     }
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-07-2`: the judge gave `covered`. Note of the judge:

```text
Checks quantities 2 and 1 and Total Price: 20.97¤.
```

`page-objects/basket-page.ts`:
```ts
  73       await expectVisible(row, `Basket row of ${line.product.name}`);
  74 >     await expectText(this.quantityCell(line.product), String(line.quantity), `Quantity of ${line.product.name}`);
  75       await expectText(row.locator('.mat-column-price'), PriceHelper.format(line.product.price), `Price of ${line.product.name}`);
  ...
  82     async shouldSeeTotalPrice(total: number): Promise<void> {
  83 >     await expectText(this.totalPrice, `Total Price: ${PriceHelper.format(total)}`, 'Basket total price');
  84     }
```

### vague-2, TC-07 step 6

Step: Select the saved card. Click `Continue`.

Expected result: The page `Order Summary` shows the saved address, the card, `Items` `20.97¤`, `Delivery` `0.99¤`, `Promotion` `2.10¤` and `Total Price` `19.86¤`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-07-6`: the judge gave `partial`. Note of the judge:

```text
Items, Promotion and Total Price are calculated with helpers instead of being compared to `20.97¤`, `2.10¤` and `19.86¤`.
```

`tests/tc-07-card-order-end-to-end.spec.ts`:
```ts
  82         await expect(page).toHaveURL(/#\/order-summary/);
  83 >       await expect(orderSummaryPage.deliveryAddress).toContainText(ADDRESS.fullName);
  84         await expect(orderSummaryPage.deliveryAddress).toContainText(
  ...
  87         await expect(orderSummaryPage.deliveryAddress).toContainText(ADDRESS.country);
  88 >       await expect(orderSummaryPage.paymentMethod).toContainText(`Card ending in ${CARD_LAST_DIGITS}`);
  89         await expect(orderSummaryPage.paymentMethod).toContainText(CARD.fullName);
  90 >       await expect(orderSummaryPage.items).toHaveText(price(items));
  91 >       await expect(orderSummaryPage.delivery).toHaveText(price(delivery.price));
  92 >       await expect(orderSummaryPage.promotion).toHaveText(price(promotion));
  93 >       await expect(orderSummaryPage.totalPrice).toHaveText(price(total));
  94       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-07-6`: the judge gave `covered`. Note of the judge:

```text
Checks the address, the card ending in 1111, and the totals 20.97¤, 0.99¤, 2.10¤ and 19.86¤.
```

`page-objects/checkout/order-summary-page.ts`:
```ts
  40     async shouldSeeTotals(totals: OrderTotals): Promise<void> {
  41 >     await expectText(this.totalsValue('Items'), PriceHelper.format(totals.items), 'Order summary: items');
  42 >     await expectText(this.totalsValue('Delivery'), PriceHelper.format(totals.delivery), 'Order summary: delivery');
  43 >     await expectText(this.totalsValue('Promotion'), PriceHelper.format(totals.promotion), 'Order summary: promotion');
  44 >     await expectText(this.totalsValue('Total Price'), PriceHelper.format(totals.total), 'Order summary: total price');
  45     }
  ...
  47     async shouldSeeAddress(address: SavedAddress): Promise<void> {
  48 >     await expectContainText(this.addressCard, address.fullName, 'Order summary: address name');
  49 >     await expectContainText(
  50         this.addressCard,
  ...
  58       const lastDigits = String(card.cardNum).slice(-CARD_VISIBLE_DIGITS);
  59 >     await expectContainText(this.paymentCard, UI_MESSAGES.cardPaymentMethod(lastDigits), 'Order summary: card');
  60       await expectContainText(this.paymentCard, card.fullName, 'Order summary: card holder');
```

### vague-3, TC-07 step 6

Step: Select the saved card. Click `Continue`.

Expected result: The page `Order Summary` shows the saved address, the card, `Items` `20.97¤`, `Delivery` `0.99¤`, `Promotion` `2.10¤` and `Total Price` `19.86¤`.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-07-6`: the judge gave `partial`. Note of the judge:

```text
The address and card are checked, but the totals come from the orderTotals helper, not the values in the test case.
```

`tests/pages/CheckoutPages.ts`:
```ts
 131     for (const [label, value] of rows) {
 132 >     await expect(table.getByRole('row', { name: `${label} ${money(value)}`, exact: true })).toBeVisible();
 133     }
  ...
 151       await expect(this.page).toHaveURL(/#\/order-summary$/);
 152 >     await expect(this.page.getByText('Order Summary', { exact: true })).toBeVisible();
 153     }
  ...
 155     async expectSavedAddress(): Promise<void> {
 156 >     await expect(this.addressCard).toContainText(SavedAddress.fullName);
 157 >     await expect(this.addressCard).toContainText(
 158         `${SavedAddress.streetAddress}, ${SavedAddress.city}, ${SavedAddress.state}, ${SavedAddress.zipCode}`,
 159       );
 160 >     await expect(this.addressCard).toContainText(SavedAddress.country);
 161     }
  ...
 163     async expectSavedCard(): Promise<void> {
 164 >     await expect(this.paymentCard).toContainText(`Card ending in ${SavedCard.cardNum.slice(-4)}`);
 165 >     await expect(this.paymentCard).toContainText(SavedCard.fullName);
 166     }
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-07-6`: the judge gave `covered`. Note of the judge:

```text
Checks the address, the card ending in 1111, and Items 20.97¤, Delivery 0.99¤, Promotion 2.10¤, Total 19.86¤.
```

`page-objects/order-summary-page.ts`:
```ts
  39     async shouldSeeDeliveryAddress(address: SavedAddress): Promise<void> {
  40 >     await expectContainText(this.addressCard, address.fullName, 'Delivery address name');
  41 >     await expectContainText(
  42         this.addressCard,
  ...
  45       );
  46 >     await expectContainText(this.addressCard, address.country, 'Delivery address country');
  47     }
  ...
  49     async shouldSeePaymentCard(card: SavedCard): Promise<void> {
  50 >     await expectContainText(this.paymentCard, `Card ending in ${lastCardDigits(card)}`, 'Payment card');
  51       await expectContainText(this.paymentCard, card.fullName, 'Payment card holder');
  ...
  67     async shouldSeeTotals(totals: OrderTotals): Promise<void> {
  68 >     await expectText(this.totalsRow('Items').locator('td.price'), PriceHelper.format(totals.items), 'Items price');
  69 >     await expectText(this.totalsRow('Delivery').locator('td.price'), PriceHelper.format(totals.delivery), 'Delivery price');
  70 >     await expectText(this.totalsRow('Promotion').locator('td.price'), PriceHelper.format(totals.promotion), 'Promotion');
  71 >     await expectText(this.totalsRow('Total Price').locator('td.price'), PriceHelper.format(totals.total), 'Total price');
  72     }
```

### vague-2, TC-07 step 8

Step: Read the order summary on the confirmation page.

Expected result: It shows product A with quantity `2`, product B with quantity `1`, `Items` `20.97¤`, `Delivery` `0.99¤`, `Promotion` `2.10¤` and `Total Price` `19.86¤`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-07-8`: the judge gave `partial`. Note of the judge:

```text
Items, Promotion and Total Price are calculated with helpers instead of being compared to `20.97¤`, `2.10¤` and `19.86¤`.
```

`tests/tc-07-card-order-end-to-end.spec.ts`:
```ts
 104         await expect(orderCompletionPage.rows).toHaveCount(2);
 105 >       await expect(orderCompletionPage.quantity(a.name)).toHaveText(String(qtyA));
 106 >       await expect(orderCompletionPage.quantity(b.name)).toHaveText(String(qtyB));
 107 >       await expect(orderCompletionPage.items).toHaveText(price(items));
 108 >       await expect(orderCompletionPage.delivery).toHaveText(price(delivery.price));
 109 >       await expect(orderCompletionPage.promotion).toHaveText(price(promotion));
 110 >       await expect(orderCompletionPage.totalPrice).toHaveText(price(total));
 111       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-07-8`: the judge gave `covered`. Note of the judge:

```text
Checks both quantities and the four totals 20.97¤, 0.99¤, 2.10¤ and 19.86¤.
```

`page-objects/checkout/order-completion-page.ts`:
```ts
  42     async shouldSeeLines(lines: BasketLine[]): Promise<void> {
  43 >     await expectCount(this.productRows, lines.length, 'Order confirmation product rows');
  44       for (const line of lines) {
  ...
  47         });
  48 >       await expectText(row.locator('mat-cell.mat-column-quantity'), String(line.quantity), `Quantity of ${line.product.name}`);
  49         await expectText(
  ...
  58       const expected = [totals.items, totals.delivery, totals.promotion, totals.total].map(PriceHelper.format);
  59 >     await expectText(this.totalsValues, expected, 'Order confirmation: items, delivery, promotion, total price');
  60     }
```

### vague-3, TC-07 step 8

Step: Read the order summary on the confirmation page.

Expected result: It shows product A with quantity `2`, product B with quantity `1`, `Items` `20.97¤`, `Delivery` `0.99¤`, `Promotion` `2.10¤` and `Total Price` `19.86¤`.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-07-8`: the judge gave `partial`. Note of the judge:

```text
The test compares the server-saved totals with values calculated the way the client calculates them, not with the values in the test case.
```

`tests/pages/CheckoutPages.ts`:
```ts
 204     async expectLine(productName: string, quantity: number, price: number): Promise<void> {
 205 >     await expect(
 206         this.itemsTable.getByRole('row', {
  ...
 213     async expectTotals(totals: OrderTotals): Promise<void> {
 214 >     await expect(this.totalsLabels).toHaveText(['Items', 'Delivery', 'Promotion', 'Total Price']);
 215 >     await expect(this.totalsValues).toHaveText([
 216         money(totals.items),
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-07-8`: the judge gave `covered`. Note of the judge:

```text
Checks both quantities and the four totals 20.97¤, 0.99¤, 2.10¤ and 19.86¤.
```

`page-objects/order-completion-page.ts`:
```ts
  42       await expectVisible(row, `Order row of ${line.product.name}`);
  43 >     await expectText(row.locator('.mat-column-quantity'), String(line.quantity), `Quantity of ${line.product.name}`);
  44     }
  ...
  47       for (const [index, key] of TOTALS_ORDER.entries()) {
  48 >       await expectText(this.totalsPrices.nth(index), PriceHelper.format(totals[key]), `Order ${key}`);
  49       }
```

### vague-2, TC-07 step 10

Step: Open the account menu. Click `Orders & Payment`, then `Order History`.

Expected result: The page `Order History` shows one order with the order ID from step 7 and `Total Price` `19.86¤`. The order shows product A with quantity `2` and product B with quantity `1`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-07-10`: the judge gave `partial`. Note of the judge:

```text
The order total is calculated with helpers instead of being compared to the literal `19.86¤`.
```

`tests/tc-07-card-order-end-to-end.spec.ts`:
```ts
 123         await expect(page).toHaveURL(/#\/order-history/);
 124 >       await expect(orderHistoryPage.orders).toHaveCount(1);
 125         const order = orderHistoryPage.order(orderId);
 126 >       await expect(order.orderId).toHaveText(`#${orderId}`);
 127 >       await expect(order.totalPrice).toHaveText(price(total));
 128 >       await expect(order.quantity(a.name)).toHaveText(String(qtyA));
 129 >       await expect(order.quantity(b.name)).toHaveText(String(qtyB));
 130       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-07-10`: the judge gave `covered`. Note of the judge:

```text
Checks one order, the order ID from step 7, Total Price 19.86¤ and both quantities.
```

`page-objects/order-history-page.ts`:
```ts
  39     async shouldSeeOrderCount(count: number): Promise<void> {
  40 >     await expectCount(this.orders, count, 'Orders in the history');
  41     }
  ...
  50       if (entry.orderId) {
  51 >       await expectText(this.headingValue(order, 'Order ID'), `#${entry.orderId}`, 'Order ID');
  52       }
  53 >     await expectText(this.headingValue(order, 'Total Price'), PriceHelper.format(entry.totalPrice), 'Order total price');
  54       if (entry.bonus !== undefined) {
  ...
  60         });
  61 >       await expectText(row.locator('mat-cell.mat-column-quantity'), String(line.quantity), `Quantity of ${line.product.name}`);
  62       }
```

### vague-3, TC-07 step 10

Step: Open the account menu. Click `Orders & Payment`, then `Order History`.

Expected result: The page `Order History` shows one order with the order ID from step 7 and `Total Price` `19.86¤`. The order shows product A with quantity `2` and product B with quantity `1`.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-07-10`: the judge gave `partial`. Note of the judge:

```text
The order Total Price comes from the orderTotals helper, not the value 19.86¤ in the test case.
```

`tests/tc-07-card-order-end-to-end.spec.ts`:
```ts
  97       await navBar.openOrderHistory();
  98 >     await expect(orderHistoryPage.title).toHaveText('Order History');
  99 >     await expect(orderHistoryPage.orders).toHaveCount(1);
 100       const order = orderHistoryPage.order(orderId);
 101 >     await expect(order).toHaveCount(1);
 102       await orderHistoryPage.expectOrder(order, totals.total);
```
`tests/pages/AccountPages.ts`:
```ts
  24     async expectOrder(order: Locator, total: number, bonus?: number): Promise<void> {
  25 >     await expect(this.field(order, 'Total Price')).toHaveText(money(total));
  26       if (bonus !== undefined) await expect(this.field(order, 'Bonus')).toHaveText(String(bonus));
  ...
  30       const row = order.locator('mat-row').filter({ has: this.page.getByRole('cell', { name: productName, exact: true }) });
  31 >     await expect(row).toHaveCount(1);
  32 >     await expect(row.locator('.mat-column-quantity')).toHaveText(String(quantity));
  33     }
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-07-10`: the judge gave `covered`. Note of the judge:

```text
Checks one order with the step 7 ID, total 19.86¤ and both product quantities.
```

`page-objects/order-history-page.ts`:
```ts
  33     async shouldSeePage(): Promise<void> {
  34 >     await expectText(this.title, UI_TITLES.orderHistory, 'Order history title');
  35     }
  ...
  41     async shouldSeeOrderCount(count: number): Promise<void> {
  42 >     await expectCount(this.orders, count, 'Orders in the history');
  43     }
  ...
  47       await expectVisible(order, `Order #${orderId}`);
  48 >     await expectText(this.headingValue(order, ORDER_ID_COLUMN), `#${orderId}`, 'Order ID');
  49 >     await expectText(this.headingValue(order, TOTAL_PRICE_COLUMN), PriceHelper.format(total), 'Order total price');
  50     }
  ...
  61       await expectVisible(row, `Order row of ${line.product.name}`);
  62 >     await expectText(row.locator('.mat-column-quantity'), String(line.quantity), `Quantity of ${line.product.name}`);
  63     }
```

### vague-2, TC-08 step 2

Step: Select `Standard Delivery`. Click `Continue`.

Expected result: The page `My Payment Options` shows `Wallet Balance` `5.00` and the button `Pay 8.99¤`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-08-2`: the judge gave `partial`. Note of the judge:

```text
The Pay button amount is calculated with orderTotal() instead of being compared to the literal `8.99¤`.
```

`tests/tc-08-wallet-payment.spec.ts`:
```ts
  53         await deliveryPage.selectAndContinue(delivery.name);
  54 >       await expect(paymentPage.title).toBeVisible();
  55 >       await expect(paymentPage.walletBalance).toHaveText(FIRST_BALANCE.toFixed(2));
  56 >       await expect(paymentPage.payWithWalletButton).toHaveText(`Pay ${price(total)}`);
  57       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-08-2`: the judge gave `covered`. Note of the judge:

```text
Checks the payment page, the balance 5.00 and the button text Pay 8.99¤.
```

`page-objects/checkout/payment-page.ts`:
```ts
  27       await expectUrl(this.page, /#\/payment\/shop$/, 'Payment step');
  28 >     await expectVisible(this.title, 'Title `My Payment Options`');
  29     }
```
`page-objects/checkout/components/wallet-payment.component.ts`:
```ts
  15     async shouldSeeBalance(amount: number): Promise<void> {
  16 >     await expectText(this.balance, PriceHelper.formatBalance(amount), 'Wallet balance on the payment page');
  17     }
  ...
  20       await expectVisible(this.payButton, 'Button `Pay`');
  21 >     await expectText(this.payButton, `Pay ${PriceHelper.format(amount)}`, 'Button `Pay`');
  22     }
```

### vague-3, TC-08 step 2

Step: Select `Standard Delivery`. Click `Continue`.

Expected result: The page `My Payment Options` shows `Wallet Balance` `5.00` and the button `Pay 8.99¤`.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-08-2`: the judge gave `partial`. Note of the judge:

```text
The Pay button amount comes from the orderTotals helper, not the value 8.99¤ in the test case.
```

`tests/pages/CheckoutPages.ts`:
```ts
  88     async expectOpen(): Promise<void> {
  89 >     await expect(this.page).toHaveURL(/#\/payment\/shop$/);
  90 >     await expect(this.heading).toBeVisible();
  91     }
  ...
  99     async expectWallet(balance: number, payAmount: number): Promise<void> {
 100 >     await expect(this.walletBalance).toHaveText(balance.toFixed(2));
 101 >     await expect(this.payWithWalletButton).toHaveText(`Pay ${money(payAmount)}`);
 102     }
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-08-2`: the judge gave `covered`. Note of the judge:

```text
Checks wallet balance 5.00 and the button text Pay 8.99¤.
```

`page-objects/payment-page.ts`:
```ts
  27     async shouldSeePage(): Promise<void> {
  28 >     await expectText(this.title, UI_TITLES.paymentOptions, 'Payment step title');
  29     }
```
`page-objects/components/wallet-payment.component.ts`:
```ts
  16     async shouldSeeBalance(amount: number): Promise<void> {
  17 >     await expectText(this.balance, amount.toFixed(2), 'Wallet balance');
  18     }
  ...
  20     async shouldSeePayButton(amount: number): Promise<void> {
  21 >     await expectText(this.payButton, `Pay ${PriceHelper.format(amount)}`, 'Wallet button `Pay`');
  22     }
```

### vague-2, TC-08 step 6

Step: Open the basket `/#/basket`. Click `Checkout`. Select the saved address. Click `Continue`. Select `Standard Delivery`. Click `Continue`.

Expected result: The page `My Payment Options` shows `Wallet Balance` `8.99` and the button `Pay 8.99¤`. The button is enabled.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-08-6`: the judge gave `partial`. Note of the judge:

```text
The balance and the Pay amount are calculated with helpers instead of being compared to the literal `8.99`.
```

`tests/tc-08-wallet-payment.spec.ts`:
```ts
  86         await expect(paymentPage.title).toBeVisible();
  87 >       await expect(paymentPage.walletBalance).toHaveText(balanceBeforeOrder.toFixed(2));
  88 >       await expect(paymentPage.payWithWalletButton).toHaveText(`Pay ${price(total)}`);
  89 >       await expect(paymentPage.payWithWalletButton).toBeEnabled();
  90       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-08-6`: the judge gave `covered`. Note of the judge:

```text
Checks the balance 8.99, the button text Pay 8.99¤ and that the button is enabled.
```

`page-objects/checkout/components/wallet-payment.component.ts`:
```ts
  15     async shouldSeeBalance(amount: number): Promise<void> {
  16 >     await expectText(this.balance, PriceHelper.formatBalance(amount), 'Wallet balance on the payment page');
  17     }
  ...
  20       await expectVisible(this.payButton, 'Button `Pay`');
  21 >     await expectText(this.payButton, `Pay ${PriceHelper.format(amount)}`, 'Button `Pay`');
  22     }
  ...
  28     async shouldSeePayButtonEnabled(): Promise<void> {
  29 >     await expectEnabled(this.payButton, 'Button `Pay`');
  30     }
```

### vague-3, TC-08 step 6

Step: Open the basket `/#/basket`. Click `Checkout`. Select the saved address. Click `Continue`. Select `Standard Delivery`. Click `Continue`.

Expected result: The page `My Payment Options` shows `Wallet Balance` `8.99` and the button `Pay 8.99¤`. The button is enabled.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-08-6`: the judge gave `partial`. Note of the judge:

```text
The balance 8.99 and the Pay amount are calculated by the test, not taken from the values in the test case.
```

`tests/pages/CheckoutPages.ts`:
```ts
  99     async expectWallet(balance: number, payAmount: number): Promise<void> {
 100 >     await expect(this.walletBalance).toHaveText(balance.toFixed(2));
 101 >     await expect(this.payWithWalletButton).toHaveText(`Pay ${money(payAmount)}`);
 102     }
```
`tests/tc-08-wallet-payment.spec.ts`:
```ts
  71       await paymentPage.expectWallet(fullBalance, totals.total);
  72 >     await expect(paymentPage.payWithWalletButton).toBeEnabled();
  73     });
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-08-6`: the judge gave `covered`. Note of the judge:

```text
Checks balance 8.99, the button text Pay 8.99¤ and that the button is enabled.
```

`page-objects/payment-page.ts`:
```ts
  27     async shouldSeePage(): Promise<void> {
  28 >     await expectText(this.title, UI_TITLES.paymentOptions, 'Payment step title');
  29     }
```
`page-objects/components/wallet-payment.component.ts`:
```ts
  16     async shouldSeeBalance(amount: number): Promise<void> {
  17 >     await expectText(this.balance, amount.toFixed(2), 'Wallet balance');
  18     }
  ...
  20     async shouldSeePayButton(amount: number): Promise<void> {
  21 >     await expectText(this.payButton, `Pay ${PriceHelper.format(amount)}`, 'Wallet button `Pay`');
  22     }
  ...
  28     async shouldSeePayButtonEnabled(): Promise<void> {
  29 >     await expectEnabled(this.payButton, 'Wallet button `Pay`');
  30     }
```

### vague-2, TC-08 step 7

Step: Click `Pay 8.99¤`.

Expected result: The page `Order Summary` shows the payment method `Digital Wallet` and `Total Price` `8.99¤`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-08-7`: the judge gave `partial`. Note of the judge:

```text
Total Price is calculated with orderTotal() instead of being compared to the literal `8.99¤`.
```

`tests/tc-08-wallet-payment.spec.ts`:
```ts
  94         await expect(page).toHaveURL(/#\/order-summary/);
  95 >       await expect(orderSummaryPage.paymentMethod).toContainText('Digital Wallet');
  96 >       await expect(orderSummaryPage.totalPrice).toHaveText(price(total));
  97       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-08-7`: the judge gave `covered`. Note of the judge:

```text
Checks the Order Summary page, the Digital Wallet payment method and Total Price 8.99¤.
```

`page-objects/checkout/order-summary-page.ts`:
```ts
  31     async shouldSeePage(): Promise<void> {
  32 >     await expectUrl(this.page, /#\/order-summary$/, 'Order summary step');
  33       await expectVisible(this.summary.getByText('Order Summary', { exact: true }), 'Title `Order Summary`');
  ...
  43       await expectText(this.totalsValue('Promotion'), PriceHelper.format(totals.promotion), 'Order summary: promotion');
  44 >     await expectText(this.totalsValue('Total Price'), PriceHelper.format(totals.total), 'Order summary: total price');
  45     }
  ...
  63     async shouldSeeWalletPayment(): Promise<void> {
  64 >     await expectContainText(this.paymentCard, UI_MESSAGES.walletPaymentMethod, 'Order summary: payment method');
  65     }
```

### vague-3, TC-08 step 7

Step: Click `Pay 8.99¤`.

Expected result: The page `Order Summary` shows the payment method `Digital Wallet` and `Total Price` `8.99¤`.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-08-7`: the judge gave `partial`. Note of the judge:

```text
Total Price comes from the orderTotals helper, not the value 8.99¤ in the test case.
```

`tests/pages/CheckoutPages.ts`:
```ts
 131     for (const [label, value] of rows) {
 132 >     await expect(table.getByRole('row', { name: `${label} ${money(value)}`, exact: true })).toBeVisible();
 133     }
  ...
 151       await expect(this.page).toHaveURL(/#\/order-summary$/);
 152 >     await expect(this.page.getByText('Order Summary', { exact: true })).toBeVisible();
 153     }
```
`tests/tc-08-wallet-payment.spec.ts`:
```ts
  77       await summaryPage.expectOpen();
  78 >     await expect(summaryPage.paymentCard).toContainText('Digital Wallet');
  79       await summaryPage.expectTotals(totals);
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-08-7`: the judge gave `covered`. Note of the judge:

```text
Checks the payment method Digital Wallet and Total Price 8.99¤.
```

`page-objects/order-summary-page.ts`:
```ts
  35     async shouldSeePage(): Promise<void> {
  36 >     await expectText(this.title, UI_TITLES.orderSummary, 'Order summary title');
  37     }
  ...
  54     async shouldSeeWalletPaymentMethod(): Promise<void> {
  55 >     await expectContainText(this.paymentCard, WALLET_PAYMENT_METHOD, 'Payment method');
  56     }
  ...
  70       await expectText(this.totalsRow('Promotion').locator('td.price'), PriceHelper.format(totals.promotion), 'Promotion');
  71 >     await expectText(this.totalsRow('Total Price').locator('td.price'), PriceHelper.format(totals.total), 'Total price');
  72     }
```

### vague-2, TC-08 step 9

Step: Open the account menu. Click `Orders & Payment`, then `Digital Wallet`.

Expected result: The wallet balance is `1.00`: 8.99 − 8.99 + 1 bonus point.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-08-9`: the judge gave `partial`. Note of the judge:

```text
The expected balance is calculated with bonusPoints() and cent arithmetic instead of being compared to the literal `1.00`.
```

`tests/tc-08-wallet-payment.spec.ts`:
```ts
 107         await expect(page).toHaveURL(/#\/wallet/);
 108 >       await expect(walletPage.balance).toHaveText(balanceAfterOrder.toFixed(2));
 109       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-08-9`: the judge gave `covered`. Note of the judge:

```text
Checks the balance 1.00.
```

`page-objects/wallet-page.ts`:
```ts
  23     async shouldSeeBalance(amount: number): Promise<void> {
  24 >     await expectText(this.balance, PriceHelper.formatBalance(amount), 'Wallet balance');
  25     }
```

### vague-3, TC-08 step 9

Step: Open the account menu. Click `Orders & Payment`, then `Digital Wallet`.

Expected result: The wallet balance is `1.00`: 8.99 − 8.99 + 1 bonus point.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-08-9`: the judge gave `partial`. Note of the judge:

```text
The balance 1.00 is calculated with bonusPoints, which copies the app's bonus formula, not the value in the test case.
```

`tests/pages/AccountPages.ts`:
```ts
  46       await expect(this.heading).toBeVisible();
  47 >     await expect(this.balance).toHaveText(balance.toFixed(2));
  48     }
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-08-9`: the judge gave `covered`. Note of the judge:

```text
Checks wallet balance 1.00 after the order and the bonus.
```

`page-objects/wallet-page.ts`:
```ts
  18     async shouldSeePage(): Promise<void> {
  19 >     await expectText(this.title, UI_TITLES.digitalWallet, 'Wallet page title');
  20     }
  ...
  22     async shouldSeeBalance(amount: number): Promise<void> {
  23 >     await expectText(this.balance, amount.toFixed(2), 'Wallet balance');
  24     }
```

### vague-2, TC-08 step 10

Step: Open the account menu. Click `Orders & Payment`, then `Order History`.

Expected result: The page shows one order with `Total Price` `8.99¤` and `Bonus` `1`.

**A** (`set-2/run-2/suite-a`, tag `gen-2`), row `vague-2-A-TC-08-10`: the judge gave `partial`. Note of the judge:

```text
Total Price and Bonus are calculated with helpers instead of being compared to `8.99¤` and `1`.
```

`tests/tc-08-wallet-payment.spec.ts`:
```ts
 113         await expect(page).toHaveURL(/#\/order-history/);
 114 >       await expect(orderHistoryPage.orders).toHaveCount(1);
 115         const order = orderHistoryPage.nth(0);
 116 >       await expect(order.totalPrice).toHaveText(price(total));
 117 >       await expect(order.bonus).toHaveText(String(bonus));
 118       });
```

**B** (`set-2/run-2/suite-b`, tag `gen-2`), row `vague-2-B-TC-08-10`: the judge gave `covered`. Note of the judge:

```text
Checks one order with Total Price 8.99¤ and Bonus 1.
```

`page-objects/order-history-page.ts`:
```ts
  39     async shouldSeeOrderCount(count: number): Promise<void> {
  40 >     await expectCount(this.orders, count, 'Orders in the history');
  41     }
  ...
  52       }
  53 >     await expectText(this.headingValue(order, 'Total Price'), PriceHelper.format(entry.totalPrice), 'Order total price');
  54       if (entry.bonus !== undefined) {
  55 >       await expectText(this.headingValue(order, 'Bonus'), String(entry.bonus), 'Order bonus');
  56       }
```

### vague-3, TC-08 step 10

Step: Open the account menu. Click `Orders & Payment`, then `Order History`.

Expected result: The page shows one order with `Total Price` `8.99¤` and `Bonus` `1`.

**A** (`set-2/run-3/suite-a`, tag `gen-3`), row `vague-3-A-TC-08-10`: the judge gave `partial`. Note of the judge:

```text
The total and the bonus are calculated with the app's formulas, not taken as the values 8.99¤ and 1 from the test case.
```

`tests/tc-08-wallet-payment.spec.ts`:
```ts
  93       await navBar.openOrderHistory();
  94 >     await expect(orderHistoryPage.orders).toHaveCount(1);
  95       await orderHistoryPage.expectOrder(orderHistoryPage.orders.first(), totals.total, bonus);
```
`tests/pages/AccountPages.ts`:
```ts
  24     async expectOrder(order: Locator, total: number, bonus?: number): Promise<void> {
  25 >     await expect(this.field(order, 'Total Price')).toHaveText(money(total));
  26 >     if (bonus !== undefined) await expect(this.field(order, 'Bonus')).toHaveText(String(bonus));
  27     }
```

**B** (`set-2/run-4/suite-b`, tag `gen-4`), row `vague-3-B-TC-08-10`: the judge gave `covered`. Note of the judge:

```text
Checks one order with total 8.99¤ and bonus 1.
```

`page-objects/order-history-page.ts`:
```ts
  41     async shouldSeeOrderCount(count: number): Promise<void> {
  42 >     await expectCount(this.orders, count, 'Orders in the history');
  43     }
  ...
  54       const order = this.orders.first();
  55 >     await expectText(this.headingValue(order, TOTAL_PRICE_COLUMN), PriceHelper.format(total), 'Order total price');
  56 >     await expectText(this.headingValue(order, BONUS_COLUMN), String(bonus), 'Order bonus');
  57     }
```

