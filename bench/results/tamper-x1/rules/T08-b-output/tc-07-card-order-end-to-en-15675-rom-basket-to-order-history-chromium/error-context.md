# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-07-card-order-end-to-end.spec.ts >> TC-07: Order with a card, from basket to order history
- Location: tests/tc-07-card-order-end-to-end.spec.ts:6:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 2

  Object {
    "delivery": 0.99,
-   "items": 20.97,
-   "promotion": 2.1,
+   "items": 21.97,
+   "promotion": 3.1,
    "total": 19.86,
  }

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e7]:
    - button "Open Sidenav" [ref=e8] [cursor=pointer]:
      - img [aria-hidden] [ref=e9]: menu
    - button "Back to homepage" [ref=e12]:
      - generic [ref=e14]:
        - img "OWASP Juice Shop" [ref=e15]
        - generic [ref=e16]: OWASP Juice Shop
    - generic "Click to search" [ref=e20]:
      - button "Open search" [ref=e21] [cursor=pointer]:
        - img [aria-hidden] [ref=e22]: search
      - generic:
        - img [aria-hidden] [ref=e25]: search
        - textbox [ref=e26]
        - button "Close search" [ref=e27] [cursor=pointer]:
          - img [aria-hidden] [ref=e28]: close
    - generic [ref=e31]:
      - button "Show/hide account menu" [ref=e32]:
        - img [aria-hidden] [ref=e33]: account_circle
        - generic [ref=e34]: Account
      - button "Show the shopping cart" [ref=e37]:
        - img [aria-hidden] [ref=e38]: shopping_cart
        - generic [ref=e39]:
          - text: Your Basket
          - generic [ref=e40]: "0"
      - button "Language selection menu" [ref=e43]:
        - img [aria-hidden] [ref=e44]: language
        - generic [ref=e45]: EN
  - generic [ref=e50]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - heading "Thank you for your purchase!" [level=1] [ref=e53]
        - generic [ref=e54]:
          - text: Your order has been placed and is being processed. You can check for status updates on our
          - link "Track Orders" [ref=e55] [cursor=pointer]:
            - /url: "#/track-result/new?id=b813-cde3096f0ff3c8c8"
          - text: page.
      - generic [ref=e56]:
        - generic [ref=e57]: Your order will be delivered in 1 days.
        - generic [ref=e59]: Delivery Address
        - generic [ref=e60]: Test Customer
        - generic [ref=e61]: 1 Khreshchatyk Street, Kyiv, Kyiv, 01001
        - generic [ref=e62]: Ukraine
        - generic [ref=e63]: Phone Number 501234567
    - generic [ref=e64]:
      - generic [ref=e65]: Order Summary
      - generic [ref=e66]:
        - link "Tweet" [ref=e67] [cursor=pointer]:
          - /url: https://twitter.com/intent/tweet?text=I just purchased%0a- Eggfruit Juice (500ml)%0a- Carrot Juice (1000ml)%0afrom @owasp_juiceshop&hashtags=security
          - img [aria-hidden] [ref=e68]: twitter
        - button "Print order confirmation" [ref=e72] [cursor=pointer]:
          - img [aria-hidden] [ref=e73]: note
    - table [ref=e77]:
      - row [ref=e78]:
        - columnheader "Product" [ref=e79]
        - columnheader "Price" [ref=e80]
        - columnheader "Quantity" [ref=e81]
        - columnheader "Total Price" [ref=e82]
      - row [ref=e83]:
        - cell "Eggfruit Juice (500ml)" [ref=e84]
        - cell "8.99¤" [ref=e85]
        - cell "2" [ref=e86]
        - cell "17.98¤" [ref=e88]
      - row [ref=e89]:
        - cell "Carrot Juice (1000ml)" [ref=e90]
        - cell "2.99¤" [ref=e91]
        - cell "1" [ref=e92]
        - cell "2.99¤" [ref=e94]
      - row [ref=e95]:
        - cell [ref=e96]
        - cell [ref=e97]
        - cell [ref=e98]:
          - table [ref=e99]:
            - row [ref=e100]:
              - cell "Items" [ref=e101]
            - row [ref=e102]:
              - cell "Delivery" [ref=e103]
            - row [ref=e104]:
              - cell "Promotion" [ref=e105]
            - row [ref=e106]:
              - cell "Total Price" [ref=e107]
        - cell [ref=e108]:
          - table [ref=e109]:
            - row [ref=e110]:
              - cell "21.97¤" [ref=e111]
            - row [ref=e112]:
              - cell "0.99¤" [ref=e113]
            - row [ref=e114]:
              - cell "3.10¤" [ref=e115]
            - row [ref=e116]:
              - cell "19.86¤" [ref=e117]
    - generic [ref=e118]: You have gained 2 Bonus Points from this order!
```

# Test source

```ts
  1   | import { test, expect } from './support/fixtures';
  2   | import { expectPrice } from './support/assertions';
  3   | import { addSavedAddressAndCard } from './support/checkout';
  4   | import { ADDRESS, CARD, CARD_LAST_DIGITS, DELIVERY, PRODUCTS, couponCode, itemsTotal, money } from './support/test-data';
  5   | 
  6   | test('TC-07: Order with a card, from basket to order history', async ({
  7   |   loggedInCustomer,
  8   |   page,
  9   |   productList,
  10  |   navBar,
  11  |   basket,
  12  |   selectAddress,
  13  |   deliveryMethod,
  14  |   payment,
  15  |   orderSummary,
  16  |   orderCompletion,
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
  79  |     await expect(orderSummary.row(a.product.name)).toContainText(String(a.quantity));
  80  |     await expect(orderSummary.row(b.product.name)).toContainText(String(b.quantity));
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
> 97  |     await expect.poll(() => orderCompletion.totals()).toEqual({
      |                                                       ^ Error: expect(received).toEqual(expected) // deep equality
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
  117 |     await expect(orderHistory.orderField(order, 'Order ID')).toHaveText(`#${orderId}`);
  118 |     await expectPrice(orderHistory.orderField(order, 'Total Price'), total);
  119 |     await expect(orderHistory.productQuantity(order, a.product.name)).toHaveText(String(a.quantity));
  120 |     await expect(orderHistory.productQuantity(order, b.product.name)).toHaveText(String(b.quantity));
  121 |   });
  122 | });
  123 | 
```