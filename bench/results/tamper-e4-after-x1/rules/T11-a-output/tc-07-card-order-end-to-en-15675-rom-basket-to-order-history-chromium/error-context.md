# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-07-card-order-end-to-end.spec.ts >> TC-07: Order with a card, from basket to order history
- Location: tests/tc-07-card-order-end-to-end.spec.ts:6:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('app-order-history').locator('.table-container').filter({ hasText: '#17f0-1c5a130ec66e2259' }).locator('.heading-row .col-vertical').filter({ has: locator('div').filter({ hasText: /^Order ID$/ }) }).locator('div').nth(1)
Expected: "#17f0-1c5a130ec66e2259"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveText" locator('app-order-history').locator('.table-container').filter({ hasText: '#17f0-1c5a130ec66e2259' }).locator('.heading-row .col-vertical').filter({ has: locator('div').filter({ hasText: /^Order ID$/ }) }).locator('div').nth(1) with timeout 5000ms
  - waiting for locator('app-order-history').locator('.table-container').filter({ hasText: '#17f0-1c5a130ec66e2259' }).locator('.heading-row .col-vertical').filter({ has: locator('div').filter({ hasText: /^Order ID$/ }) }).locator('div').nth(1)

```

```yaml
- button "Open Sidenav"
- button "Back to homepage":
  - img "OWASP Juice Shop"
  - text: OWASP Juice Shop
- button "Open search"
- textbox
- button "Close search"
- button "Show/hide account menu": Account
- button "Show the shopping cart": Your Basket 0
- button "Language selection menu": EN
- text: "Order History Order ID #MUT Total Price 19.86¤ Bonus 2 In Transit"
- button "Track Your Order"
- button "Print order confirmation"
- table:
  - row "Product Price Quantity Total Price":
    - columnheader "Product"
    - columnheader "Price"
    - columnheader "Quantity"
    - columnheader "Total Price"
    - columnheader
  - row "Eggfruit Juice (500ml) 8.99¤ 2 17.98¤ Print order confirmation":
    - cell "Eggfruit Juice (500ml)"
    - cell "8.99¤"
    - cell "2"
    - cell "17.98¤"
    - cell "Print order confirmation":
      - button "Print order confirmation"
  - row "Carrot Juice (1000ml) 2.99¤ 1 2.99¤ Print order confirmation":
    - cell "Carrot Juice (1000ml)"
    - cell "2.99¤"
    - cell "1"
    - cell "2.99¤"
    - cell "Print order confirmation":
      - button "Print order confirmation"
```

# Test source

```ts
  17  |   orderHistory,
  18  | }) => {
  19  |   const a = { product: PRODUCTS.eggfruitJuice, quantity: 2 };
  20  |   const b = { product: PRODUCTS.carrotJuice, quantity: 1 };
  21  |   const discountPercent = 10;
  22  |   const coupon = couponCode(discountPercent);
  23  | 
  24  |   await addSavedAddressAndCard(loggedInCustomer);
  25  | 
  26  |   const items = itemsTotal([a, b]);
  27  |   const promotion = money((items * discountPercent) / 100);
  28  |   const total = money(items + DELIVERY.oneDay.price - promotion);
  29  |   let orderId = '';
  30  | 
  31  |   await test.step('1. Add product A two times and product B one time', async () => {
  32  |     await productList.open();
  33  |     await productList.addToBasket(a.product.name);
  34  |     await expect(navBar.basketCounter).toHaveText('1');
  35  |     await productList.addToBasket(a.product.name);
  36  |     await expect(navBar.basketCounter).toHaveText('2');
  37  |     await productList.addToBasket(b.product.name);
  38  |     await expect(navBar.basketCounter).toHaveText(String(a.quantity + b.quantity));
  39  |   });
  40  | 
  41  |   await test.step('2. Open the basket', async () => {
  42  |     await basket.open();
  43  |     await expect(basket.rows).toHaveCount(2);
  44  |     await expect(basket.quantity(a.product.name)).toHaveText(String(a.quantity));
  45  |     await expect(basket.quantity(b.product.name)).toHaveText(String(b.quantity));
  46  |     await expectPrice(basket.totalPrice, items);
  47  |   });
  48  | 
  49  |   await test.step('3. Checkout with the saved address', async () => {
  50  |     await basket.checkout();
  51  |     await selectAddress.selectSavedAddressAndContinue();
  52  |     await expect(deliveryMethod.title).toBeVisible();
  53  |   });
  54  | 
  55  |   await test.step('4. Select One Day Delivery and continue', async () => {
  56  |     await deliveryMethod.selectAndContinue(DELIVERY.oneDay.name);
  57  |     await expect(payment.title).toBeVisible();
  58  |   });
  59  | 
  60  |   await test.step('5. Redeem the coupon of the current month', async () => {
  61  |     await payment.openCouponPanel();
  62  |     await payment.redeemCoupon(coupon);
  63  |     await expect(payment.couponConfirmation).toHaveText(
  64  |       `Your discount of ${discountPercent}% will be applied during checkout.`,
  65  |     );
  66  |   });
  67  | 
  68  |   await test.step('6. Select the saved card and continue to the order summary', async () => {
  69  |     await payment.selectSavedCardAndContinue();
  70  |     await orderSummary.waitForLoad();
  71  |     await expect(orderSummary.deliveryAddress).toContainText(ADDRESS.fullName);
  72  |     await expect(orderSummary.deliveryAddress).toContainText(
  73  |       `${ADDRESS.streetAddress}, ${ADDRESS.city}, ${ADDRESS.state}, ${ADDRESS.zipCode}`,
  74  |     );
  75  |     await expect(orderSummary.deliveryAddress).toContainText(ADDRESS.country);
  76  |     await expect(orderSummary.paymentMethod).toContainText(`Card ending in ${CARD_LAST_DIGITS}`);
  77  |     await expect(orderSummary.paymentMethod).toContainText(CARD.fullName);
  78  |     await expect(orderSummary.basketRows).toHaveCount(2);
  79  |     await expect(orderSummary.quantity(a.product.name)).toHaveText(String(a.quantity));
  80  |     await expect(orderSummary.quantity(b.product.name)).toHaveText(String(b.quantity));
  81  |     await expectPrice(orderSummary.totals.items, items);
  82  |     await expectPrice(orderSummary.totals.delivery, DELIVERY.oneDay.price);
  83  |     await expectPrice(orderSummary.totals.promotion, promotion);
  84  |     await expectPrice(orderSummary.totals.total, total);
  85  |   });
  86  | 
  87  |   await test.step('7. Place the order', async () => {
  88  |     orderId = await orderSummary.placeOrder();
  89  |     expect(orderId).not.toBe('');
  90  |     await expect(page).toHaveURL(new RegExp(`#/order-completion/${orderId}$`));
  91  |     await expect(orderCompletion.title).toBeVisible();
  92  |   });
  93  | 
  94  |   await test.step('8. Read the order summary on the confirmation page', async () => {
  95  |     await expect(orderCompletion.productRow(a.product.name)).toContainText(` ${a.quantity} `);
  96  |     await expect(orderCompletion.productRow(b.product.name)).toContainText(` ${b.quantity} `);
  97  |     await expect.poll(() => orderCompletion.totals()).toEqual({
  98  |       items,
  99  |       delivery: DELIVERY.oneDay.price,
  100 |       promotion,
  101 |       total,
  102 |     });
  103 |   });
  104 | 
  105 |   await test.step('9. The basket is empty', async () => {
  106 |     await expect(navBar.basketCounter).toHaveText('0');
  107 |     await basket.open();
  108 |     await expect(basket.rows).toHaveCount(0);
  109 |     await expect(basket.checkoutButton).toBeDisabled();
  110 |   });
  111 | 
  112 |   await test.step('10. Open the order history', async () => {
  113 |     await navBar.openOrderHistory();
  114 |     await expect(orderHistory.title).toBeVisible();
  115 |     await expect(orderHistory.orders).toHaveCount(1);
  116 |     const order = orderHistory.order(orderId);
> 117 |     await expect(orderHistory.orderField(order, 'Order ID')).toHaveText(`#${orderId}`);
      |                                                              ^ Error: expect(locator).toHaveText(expected) failed
  118 |     await expectPrice(orderHistory.orderField(order, 'Total Price'), total);
  119 |     await expect(orderHistory.productQuantity(order, a.product.name)).toHaveText(String(a.quantity));
  120 |     await expect(orderHistory.productQuantity(order, b.product.name)).toHaveText(String(b.quantity));
  121 |   });
  122 | });
  123 | 
```