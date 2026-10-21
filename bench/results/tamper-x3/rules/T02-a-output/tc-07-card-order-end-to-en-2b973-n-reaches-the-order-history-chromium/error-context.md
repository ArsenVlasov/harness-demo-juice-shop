# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-07-card-order-end-to-end.spec.ts >> TC-07: Order with a card, from basket to order history >> TC-07 card order with a coupon reaches the order history
- Location: tests/tc-07-card-order-end-to-end.spec.ts:9:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('app-basket').locator('#price')
Expected: "Total Price: 20.97¤"
Received: "Total Price: 23.97¤"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('app-basket').locator('#price') with timeout 5000ms
  - waiting for locator('app-basket').locator('#price')
    14 × locator resolved to <div id="price" _ngcontent-ng-c125060177="">Total Price: 23.97¤</div>
       - unexpected value "Total Price: 23.97¤"

```

```yaml
- text: "Total Price: 23.97¤"
```

# Test source

```ts
  1   | import { test, expect } from './fixtures';
  2   | import { ADDRESS, CARD, CARD_LAST_DIGITS, DELIVERY, PRODUCTS } from '../data/test-data';
  3   | import { appDate, couponCode } from '../helpers/coupon';
  4   | import { discount, itemCount, itemsTotal, orderTotal, price } from '../helpers/money';
  5   | 
  6   | const COUPON_DISCOUNT = 10;
  7   | 
  8   | test.describe('TC-07: Order with a card, from basket to order history', () => {
  9   |   test('TC-07 card order with a coupon reaches the order history', async ({
  10  |     page,
  11  |     request,
  12  |     api,
  13  |     loginAsCustomer,
  14  |     navBar,
  15  |     searchPage,
  16  |     basketPage,
  17  |     addressPage,
  18  |     deliveryPage,
  19  |     paymentPage,
  20  |     orderSummaryPage,
  21  |     orderCompletionPage,
  22  |     orderHistoryPage,
  23  |   }) => {
  24  |     const a = PRODUCTS.eggfruitJuice;
  25  |     const b = PRODUCTS.carrotJuice;
  26  |     const qtyA = 2;
  27  |     const qtyB = 1;
  28  |     const lines = [
  29  |       { price: a.price, quantity: qtyA },
  30  |       { price: b.price, quantity: qtyB },
  31  |     ];
  32  |     const delivery = DELIVERY.oneDay;
  33  |     const coupon = couponCode(await appDate(request), COUPON_DISCOUNT);
  34  |     const items = itemsTotal(lines);
  35  |     const promotion = discount(items, COUPON_DISCOUNT);
  36  |     const total = orderTotal(items, delivery.price, promotion);
  37  |     let orderId = '';
  38  | 
  39  |     await api.addAddress();
  40  |     await api.addCard();
  41  |     await loginAsCustomer();
  42  | 
  43  |     await test.step('1. Add the products from the product list', async () => {
  44  |       await searchPage.goto();
  45  |       for (let i = 1; i <= qtyA; i++) {
  46  |         await searchPage.addToBasket(a.name);
  47  |         await expect(navBar.basketCounter).toHaveText(String(i));
  48  |       }
  49  |       await searchPage.addToBasket(b.name);
  50  |       await expect(navBar.basketCounter).toHaveText(String(itemCount(lines)));
  51  |     });
  52  | 
  53  |     await test.step('2. Open the basket', async () => {
  54  |       await basketPage.goto();
  55  |       await expect(basketPage.table.rows).toHaveCount(2);
  56  |       await expect(basketPage.table.quantity(a.name)).toHaveText(String(qtyA));
  57  |       await expect(basketPage.table.quantity(b.name)).toHaveText(String(qtyB));
> 58  |       await expect(basketPage.totalPrice).toHaveText(`Total Price: ${price(items)}`);
      |                                           ^ Error: expect(locator).toHaveText(expected) failed
  59  |     });
  60  | 
  61  |     await test.step('3. Checkout and select the saved address', async () => {
  62  |       await basketPage.checkout();
  63  |       await addressPage.selectAndContinue(ADDRESS.fullName);
  64  |       await expect(deliveryPage.title).toBeVisible();
  65  |     });
  66  | 
  67  |     await test.step(`4. Select ${delivery.name} and continue`, async () => {
  68  |       await deliveryPage.selectAndContinue(delivery.name);
  69  |       await expect(paymentPage.title).toBeVisible();
  70  |     });
  71  | 
  72  |     await test.step('5. Redeem the coupon of the current month', async () => {
  73  |       await paymentPage.openCouponPanel();
  74  |       await paymentPage.redeemCoupon(coupon);
  75  |       await expect(paymentPage.couponConfirmation).toHaveText(
  76  |         `Your discount of ${COUPON_DISCOUNT}% will be applied during checkout.`,
  77  |       );
  78  |     });
  79  | 
  80  |     await test.step('6. Select the saved card and continue', async () => {
  81  |       await paymentPage.selectCardAndContinue(CARD_LAST_DIGITS);
  82  |       await expect(page).toHaveURL(/#\/order-summary/);
  83  |       await expect(orderSummaryPage.deliveryAddress).toContainText(ADDRESS.fullName);
  84  |       await expect(orderSummaryPage.deliveryAddress).toContainText(
  85  |         `${ADDRESS.streetAddress}, ${ADDRESS.city}, ${ADDRESS.state}, ${ADDRESS.zipCode}`,
  86  |       );
  87  |       await expect(orderSummaryPage.deliveryAddress).toContainText(ADDRESS.country);
  88  |       await expect(orderSummaryPage.paymentMethod).toContainText(`Card ending in ${CARD_LAST_DIGITS}`);
  89  |       await expect(orderSummaryPage.paymentMethod).toContainText(CARD.fullName);
  90  |       await expect(orderSummaryPage.items).toHaveText(price(items));
  91  |       await expect(orderSummaryPage.delivery).toHaveText(price(delivery.price));
  92  |       await expect(orderSummaryPage.promotion).toHaveText(price(promotion));
  93  |       await expect(orderSummaryPage.totalPrice).toHaveText(price(total));
  94  |     });
  95  | 
  96  |     await test.step('7. Place the order', async () => {
  97  |       await orderSummaryPage.placeOrderButton.click();
  98  |       await expect(page).toHaveURL(/#\/order-completion\/[^/]+$/);
  99  |       await expect(orderCompletionPage.confirmation).toBeVisible();
  100 |       orderId = orderCompletionPage.orderId();
  101 |     });
  102 | 
  103 |     await test.step('8. Read the order summary on the confirmation page', async () => {
  104 |       await expect(orderCompletionPage.rows).toHaveCount(2);
  105 |       await expect(orderCompletionPage.quantity(a.name)).toHaveText(String(qtyA));
  106 |       await expect(orderCompletionPage.quantity(b.name)).toHaveText(String(qtyB));
  107 |       await expect(orderCompletionPage.items).toHaveText(price(items));
  108 |       await expect(orderCompletionPage.delivery).toHaveText(price(delivery.price));
  109 |       await expect(orderCompletionPage.promotion).toHaveText(price(promotion));
  110 |       await expect(orderCompletionPage.totalPrice).toHaveText(price(total));
  111 |     });
  112 | 
  113 |     await test.step('9. The basket is empty', async () => {
  114 |       await expect(navBar.basketCounter).toHaveText('0');
  115 |       await basketPage.goto();
  116 |       await expect(basketPage.totalPrice).toBeVisible();
  117 |       await expect(basketPage.table.rows).toHaveCount(0);
  118 |       await expect(basketPage.checkoutButton).toBeDisabled();
  119 |     });
  120 | 
  121 |     await test.step('10. Open the order history', async () => {
  122 |       await navBar.openOrderHistory();
  123 |       await expect(page).toHaveURL(/#\/order-history/);
  124 |       await expect(orderHistoryPage.orders).toHaveCount(1);
  125 |       const order = orderHistoryPage.order(orderId);
  126 |       await expect(order.orderId).toHaveText(`#${orderId}`);
  127 |       await expect(order.totalPrice).toHaveText(price(total));
  128 |       await expect(order.quantity(a.name)).toHaveText(String(qtyA));
  129 |       await expect(order.quantity(b.name)).toHaveText(String(qtyB));
  130 |     });
  131 |   });
  132 | });
  133 | 
```