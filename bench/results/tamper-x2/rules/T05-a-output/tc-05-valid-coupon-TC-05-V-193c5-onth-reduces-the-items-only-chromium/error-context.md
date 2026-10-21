# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-05-valid-coupon.spec.ts >> TC-05: Valid coupon on the payment step >> the 10% coupon of the current month reduces the items only
- Location: tests/tc-05-valid-coupon.spec.ts:9:7

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
- button "Show the shopping cart": Your Basket 2
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
- button "Pay 16.99¤" [disabled]
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
  1  | import { expect, test } from './fixtures';
  2  | import { addSavedAddress, addSavedCard } from './helpers/api';
  3  | import { couponCode } from './helpers/coupon';
  4  | import { DELIVERY, PRODUCTS } from './helpers/test-data';
  5  | import { AddressPage, DeliveryPage, OrderSummaryPage, PaymentPage } from './pages/checkout';
  6  | import { BasketPage, ProductListPage, TopBar } from './pages/shop';
  7  | 
  8  | test.describe('TC-05: Valid coupon on the payment step', () => {
  9  |   test('the 10% coupon of the current month reduces the items only', async ({ loggedInPage: page, customer, request }) => {
  10 |     const products = new ProductListPage(page);
  11 |     const topBar = new TopBar(page);
  12 |     const basket = new BasketPage(page);
  13 |     const addressPage = new AddressPage(page);
  14 |     const deliveryPage = new DeliveryPage(page);
  15 |     const paymentPage = new PaymentPage(page);
  16 |     const summary = new OrderSummaryPage(page);
  17 |     const product = PRODUCTS.eggfruit;
  18 | 
  19 |     // Preconditions 3 and 4: saved address and card, basket with product quantity 2.
  20 |     await addSavedAddress(request, customer.token);
  21 |     await addSavedCard(request, customer.token);
  22 |     await products.goto();
  23 |     await products.addToBasket(product.name);
  24 |     await products.addToBasket(product.name);
  25 |     await topBar.expectBasketCounter(2);
  26 | 
  27 |     await test.step('1. Checkout shows the saved address', async () => {
  28 |       await topBar.openBasket();
  29 |       await basket.checkoutButton.click();
  30 |       await addressPage.expectOpen();
  31 |       await expect(addressPage.savedAddress()).toBeVisible();
  32 |     });
  33 | 
  34 |     await test.step('2. Select the saved address and continue: delivery speeds with prices', async () => {
  35 |       await addressPage.selectSavedAddress();
  36 |       await addressPage.continue();
  37 |       await deliveryPage.expectOpen();
  38 |       await deliveryPage.expectOptions();
  39 |     });
  40 | 
  41 |     await test.step('3. Select One Day Delivery and continue: payment options and the coupon panel', async () => {
  42 |       await deliveryPage.select(DELIVERY.oneDay.name);
  43 |       await deliveryPage.continue();
  44 |       await paymentPage.expectOpen();
  45 |       await expect(paymentPage.savedCard()).toBeVisible();
  46 |       await expect(paymentPage.couponPanel).toBeVisible();
  47 |     });
  48 | 
  49 |     await test.step('4. Redeem the coupon of the current month', async () => {
  50 |       await paymentPage.redeemCoupon(couponCode(10));
> 51 |       await expect(page.getByText('Your discount of 10% will be applied during checkout.')).toBeVisible();
     |                                                                                             ^ Error: expect(locator).toBeVisible() failed
  52 |     });
  53 | 
  54 |     await test.step('5. Select the saved card and continue: order summary with the discount', async () => {
  55 |       await paymentPage.selectSavedCard();
  56 |       await paymentPage.continue();
  57 |       await summary.expectOpen();
  58 |       await summary.expectTotals('17.98¤', '0.99¤', '1.80¤', '17.17¤');
  59 |     });
  60 |   });
  61 | });
  62 | 
```