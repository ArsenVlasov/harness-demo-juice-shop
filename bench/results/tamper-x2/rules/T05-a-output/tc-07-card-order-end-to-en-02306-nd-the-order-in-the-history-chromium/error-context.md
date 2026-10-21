# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-07-card-order-end-to-end.spec.ts >> TC-07: Order with a card, from basket to order history >> order two products with a card and find the order in the history
- Location: tests/tc-07-card-order-end-to-end.spec.ts:10:7

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
  9   | test.describe('TC-07: Order with a card, from basket to order history', () => {
  10  |   test('order two products with a card and find the order in the history', async ({ loggedInPage: page, customer, request }) => {
  11  |     const products = new ProductListPage(page);
  12  |     const topBar = new TopBar(page);
  13  |     const basket = new BasketPage(page);
  14  |     const addressPage = new AddressPage(page);
  15  |     const deliveryPage = new DeliveryPage(page);
  16  |     const paymentPage = new PaymentPage(page);
  17  |     const summary = new OrderSummaryPage(page);
  18  |     const completion = new OrderCompletionPage(page);
  19  |     const confirmationTotals = new ConfirmationTotals(page);
  20  |     const history = new OrderHistoryPage(page);
  21  |     const productA = PRODUCTS.eggfruit;
  22  |     const productB = PRODUCTS.carrot;
  23  |     let orderId = '';
  24  | 
  25  |     // Preconditions 3 and 4: saved address and card; the basket is empty.
  26  |     await addSavedAddress(request, customer.token);
  27  |     await addSavedCard(request, customer.token);
  28  | 
  29  |     await test.step('1. Add product A two times and product B one time: counter 3', async () => {
  30  |       await products.search(productA.name);
  31  |       await products.addToBasket(productA.name);
  32  |       await products.addToBasket(productA.name);
  33  |       await products.search(productB.name);
  34  |       await products.addToBasket(productB.name);
  35  |       await topBar.expectBasketCounter(3);
  36  |     });
  37  | 
  38  |     await test.step('2. The basket shows both products and the total 20.97¤', async () => {
  39  |       await topBar.openBasket();
  40  |       await basket.expectRow(productA.name, 2);
  41  |       await basket.expectRow(productB.name, 1);
  42  |       await basket.expectTotal('20.97¤');
  43  |     });
  44  | 
  45  |     await test.step('3. Checkout, select the saved address and continue: delivery page opens', async () => {
  46  |       await basket.checkoutButton.click();
  47  |       await addressPage.expectOpen();
  48  |       await addressPage.selectSavedAddress();
  49  |       await addressPage.continue();
  50  |       await deliveryPage.expectOpen();
  51  |     });
  52  | 
  53  |     await test.step('4. Select One Day Delivery and continue: payment page opens', async () => {
  54  |       await deliveryPage.select(DELIVERY.oneDay.name);
  55  |       await deliveryPage.continue();
  56  |       await paymentPage.expectOpen();
  57  |     });
  58  | 
  59  |     await test.step('5. Redeem the coupon of the current month', async () => {
  60  |       await paymentPage.redeemCoupon(couponCode(10));
> 61  |       await expect(page.getByText('Your discount of 10% will be applied during checkout.')).toBeVisible();
      |                                                                                             ^ Error: expect(locator).toBeVisible() failed
  62  |     });
  63  | 
  64  |     await test.step('6. Select the saved card and continue: order summary with 19.86¤', async () => {
  65  |       await paymentPage.selectSavedCard();
  66  |       await paymentPage.continue();
  67  |       await summary.expectOpen();
  68  |       await expect(page.getByText('Test Customer').first()).toBeVisible();
  69  |       await summary.expectTotals('20.97¤', '0.99¤', '2.10¤', '19.86¤');
  70  |     });
  71  | 
  72  |     await test.step('7. Place the order: the confirmation page opens', async () => {
  73  |       await summary.placeOrder();
  74  |       orderId = await completion.expectOpen();
  75  |       expect(orderId).not.toBe('');
  76  |     });
  77  | 
  78  |     await test.step('8. The confirmation shows both products and the totals', async () => {
  79  |       await expect(page.getByText(productA.name).first()).toBeVisible();
  80  |       await expect(page.getByText(productB.name).first()).toBeVisible();
  81  |       await confirmationTotals.expectTotals('20.97¤', '0.99¤', '2.10¤', '19.86¤');
  82  |     });
  83  | 
  84  |     await test.step('9. The basket counter is 0 and the basket is empty', async () => {
  85  |       await topBar.expectBasketCounter(0);
  86  |       await topBar.openBasket();
  87  |       await basket.expectNoRow(productA.name);
  88  |       await basket.expectNoRow(productB.name);
  89  |       await expect(basket.checkoutButton).toBeDisabled();
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