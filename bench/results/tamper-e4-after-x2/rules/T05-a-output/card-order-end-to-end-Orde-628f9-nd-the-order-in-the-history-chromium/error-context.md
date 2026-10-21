# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: card-order-end-to-end.spec.ts >> Order with a card, from basket to order history >> order two products with a card and find the order in the history
- Location: tests/card-order-end-to-end.spec.ts:12:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Your discount of 10% will be applied during checkout.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Your discount of 10% will be applied during checkout.') with timeout 5000ms
  - waiting for getByText('Your discount of 10% will be applied during checkout.')

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
- button "Show the shopping cart": Your Basket 3
- button "Language selection menu": EN
- heading "My Payment Options" [level=1]
- table:
  - row:
    - columnheader
    - columnheader
    - columnheader
    - columnheader
  - row "************1111 Test Customer 12/2090":
    - cell:
      - radio
    - cell "************1111"
    - cell "Test Customer"
    - cell "12/2090"
- button "Add new card Add a credit or debit card"
- separator
- text: Pay using wallet Wallet Balance 0.00
- button "Pay 19.65¤" [disabled]
- separator
- button "Add a coupon Add a coupon code to receive discounts" [expanded]
- region "Add a coupon Add a coupon code to receive discounts":
  - text: Your discount of 11% will be applied during checkout. Coupon
  - textbox "Coupon":
    - /placeholder: Please enter your coupon code
  - text: Need a coupon code? Follow us on
  - link "BlueSky":
    - /url: https://bsky.app/profile/owasp-juice.shop
  - text: or
  - link "Reddit":
    - /url: https://www.reddit.com/r/owasp_juiceshop
  - text: for monthly coupons and other spam! 0/10
  - button "Redeem" [disabled]
- separator
- button "Other payment options"
- separator
- button "Back"
- paragraph: You can review this order before it is finalized.
- button "Proceed to review" [disabled]: Continue
```

# Test source

```ts
  1   | import { expect, test } from './fixtures';
  2   | import { addSavedAddress, addSavedCard } from './helpers/api';
  3   | import { couponCode } from './helpers/coupon';
  4   | import { DELIVERY, PRODUCTS } from './helpers/test-data';
  5   | import { AddressPage, ConfirmationTotals, DeliveryPage, OrderCompletionPage, OrderSummaryPage, PaymentPage } from './pages/checkout';
  6   | import { BasketPage, ProductListPage, TopBar } from './pages/shop';
  7   | import { OrderHistoryPage } from './pages/account';
  8   | 
  9   | test.describe('Order with a card, from basket to order history', {
  10  |   annotation: { type: 'test-case', description: 'TC-07' },
  11  | }, () => {
  12  |   test('order two products with a card and find the order in the history', async ({ loggedInPage: page, customer, request }) => {
  13  |     const products = new ProductListPage(page);
  14  |     const topBar = new TopBar(page);
  15  |     const basket = new BasketPage(page);
  16  |     const addressPage = new AddressPage(page);
  17  |     const deliveryPage = new DeliveryPage(page);
  18  |     const paymentPage = new PaymentPage(page);
  19  |     const summary = new OrderSummaryPage(page);
  20  |     const completion = new OrderCompletionPage(page);
  21  |     const confirmationTotals = new ConfirmationTotals(page);
  22  |     const history = new OrderHistoryPage(page);
  23  |     const productA = PRODUCTS.eggfruit;
  24  |     const productB = PRODUCTS.carrot;
  25  |     let orderId = '';
  26  | 
  27  |     // Preconditions 3 and 4: saved address and card; the basket is empty.
  28  |     await addSavedAddress(request, customer.token);
  29  |     await addSavedCard(request, customer.token);
  30  | 
  31  |     await test.step('1. Add product A two times and product B one time: counter 3', async () => {
  32  |       await products.search(productA.name);
  33  |       await products.addToBasket(productA.name);
  34  |       await products.addOneMoreToBasket(productA.name);
  35  |       await products.search(productB.name);
  36  |       await products.addToBasket(productB.name);
  37  |       await topBar.expectBasketCounter(3);
  38  |     });
  39  | 
  40  |     await test.step('2. The basket shows both products and the total 20.97¤', async () => {
  41  |       await topBar.openBasket();
  42  |       await basket.expectRow(productA.name, 2);
  43  |       await basket.expectRow(productB.name, 1);
  44  |       await basket.expectTotal('20.97¤');
  45  |     });
  46  | 
  47  |     await test.step('3. Checkout, select the saved address and continue: delivery page opens', async () => {
  48  |       await basket.checkoutButton.click();
  49  |       await addressPage.expectOpen();
  50  |       await addressPage.selectSavedAddress();
  51  |       await addressPage.continue();
  52  |       await deliveryPage.expectOpen();
  53  |     });
  54  | 
  55  |     await test.step('4. Select One Day Delivery and continue: payment page opens', async () => {
  56  |       await deliveryPage.select(DELIVERY.oneDay.name);
  57  |       await deliveryPage.continue();
  58  |       await paymentPage.expectOpen();
  59  |     });
  60  | 
  61  |     await test.step('5. Redeem the coupon of the current month', async () => {
  62  |       await paymentPage.redeemCoupon(couponCode(10));
> 63  |       await expect(page.getByText('Your discount of 10% will be applied during checkout.')).toBeVisible();
      |                                                                                             ^ Error: expect(locator).toBeVisible() failed
  64  |     });
  65  | 
  66  |     await test.step('6. Select the saved card and continue: order summary with 19.86¤', async () => {
  67  |       await paymentPage.selectSavedCard();
  68  |       await paymentPage.continue();
  69  |       await summary.expectOpen();
  70  |       await summary.expectSavedAddress();
  71  |       await summary.expectSavedCard();
  72  |       await summary.expectTotals('20.97¤', '0.99¤', '2.10¤', '19.86¤');
  73  |     });
  74  | 
  75  |     await test.step('7. Place the order: the confirmation page opens', async () => {
  76  |       await summary.placeOrder();
  77  |       orderId = await completion.expectOpen();
  78  |       expect(orderId).not.toBe('');
  79  |     });
  80  | 
  81  |     await test.step('8. The confirmation shows both products and the totals', async () => {
  82  |       await completion.expectProduct(productA.name, 2, productA.price);
  83  |       await completion.expectProduct(productB.name, 1, productB.price);
  84  |       await confirmationTotals.expectTotals('20.97¤', '0.99¤', '2.10¤', '19.86¤');
  85  |     });
  86  | 
  87  |     await test.step('9. The basket counter is 0 and the basket is empty', async () => {
  88  |       await topBar.expectBasketCounter(0);
  89  |       await basket.expectEmptyWhenOpened(() => topBar.openBasket());
  90  |     });
  91  | 
  92  |     await test.step('10. Order history shows the order with the total 19.86¤', async () => {
  93  |       await topBar.openOrdersAndPaymentItem('Order History');
  94  |       await expect(page).toHaveURL(/#\/order-history/);
  95  |       await history.expectOrderCount(1);
  96  |       await history.expectOrder(orderId, '19.86¤');
  97  |       await history.expectProduct(productA.name, 2, productA.price);
  98  |       await history.expectProduct(productB.name, 1, productB.price);
  99  |     });
  100 |   });
  101 | });
  102 | 
```