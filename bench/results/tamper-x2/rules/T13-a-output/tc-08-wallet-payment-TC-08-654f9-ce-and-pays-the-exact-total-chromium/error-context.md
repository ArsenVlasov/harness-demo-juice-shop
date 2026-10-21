# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-08-wallet-payment.spec.ts >> TC-08: Payment with the wallet >> the wallet cannot pay a short balance and pays the exact total
- Location: tests/tc-08-wallet-payment.spec.ts:9:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('body')
Timeout: 5000ms
- Expected substring  - 1
+ Received string     + 6

- 5.00
+ This website uses fruit cookies to ensure you get the juiciest tracking experience. But me wait!Me want it!
+    OWASP Juice ShopAccount account_circle  tc-1792582857084-71e3111e@example.test  check_circle_outline  Orders & Payment  expand_more  security  Privacy & Security  expand_more  power_settings_new  Logout Contactfeedback Customer Feedback sentiment_dissatisfied Complaint auto_awesome AI Chat ImprovedCompanybusiness_center About Us camera Photo Wall card_membership Deluxe Membership OWASP Juice Shopv20.3.0              menu OWASP Juice Shop searchsearchclose account_circle  Account  shopping_cart  Your Basket1 language  EN My Payment Options************1111Test Customer12/2090 Add new card  Add a credit or debit card NameCard Number0/16Expiry Month123456789101112Expiry Year20802081208220832084208520862087208820892090209120922093209420952096209720982099send Submit Pay using walletWallet Balance 6.00 Pay 8.99¤  Add a coupon  Add a coupon code to receive discounts CouponNeed a coupon code? Follow us on BlueSky or Reddit for monthly coupons and other spam!0/10 redeem  Redeem  Other payment options Donations (Thank you for supporting OWASP Juice Shop!)  Credit CardMerchandise (Official stores for OWASP Juice Shop apparel, mugs and stickers!)  Spreadshirt (US) Spreadshirt (DE) StickerYou Leanpub OpenSea navigate_before  Back You can review this order before it is finalized. navigate_next Continue
+
+
+ Open side menuChoose language Placed Eggfruit Juice (500ml) into basket.
+  X 

Call log:
  - Expect "toContainText" locator('body') with timeout 5000ms
  - waiting for locator('body')
    14 × locator resolved to <body class="bluegrey-lightgreen-theme">…</body>
       - unexpected value "This website uses fruit cookies to ensure you get the juiciest tracking experience. But me wait!Me want it!
   OWASP Juice ShopAccount account_circle  tc-1792582857084-71e3111e@example.test  check_circle_outline  Orders & Payment  expand_more  security  Privacy & Security  expand_more  power_settings_new  Logout Contactfeedback Customer Feedback sentiment_dissatisfied Complaint auto_awesome AI Chat ImprovedCompanybusiness_center About Us camera Photo Wall card_membership Deluxe Membership OWASP Juice Shopv20.3.0              menu OWASP Juice Shop searchsearchclose account_circle  Account  shopping_cart  Your Basket1 language  EN My Payment Options************1111Test Customer12/2090 Add new card  Add a credit or debit card NameCard Number0/16Expiry Month123456789101112Expiry Year20802081208220832084208520862087208820892090209120922093209420952096209720982099send Submit Pay using walletWallet Balance 6.00 Pay 8.99¤  Add a coupon  Add a coupon code to receive discounts CouponNeed a coupon code? Follow us on BlueSky or Reddit for monthly coupons and other spam!0/10 redeem  Redeem  Other payment options Donations (Thank you for supporting OWASP Juice Shop!)  Credit CardMerchandise (Official stores for OWASP Juice Shop apparel, mugs and stickers!)  Spreadshirt (US) Spreadshirt (DE) StickerYou Leanpub OpenSea navigate_before  Back You can review this order before it is finalized. navigate_next Continue


Open side menuChoose language Placed Eggfruit Juice (500ml) into basket.
 X "

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
- button "Show the shopping cart": Your Basket 1
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
- text: Pay using wallet Wallet Balance 6.00
- button "Pay 8.99¤" [disabled]
- separator
- button "Add a coupon Add a coupon code to receive discounts"
- separator
- button "Other payment options"
- separator
- button "Back"
- paragraph: You can review this order before it is finalized.
- button "Proceed to review" [disabled]: Continue
- text: Placed Eggfruit Juice (500ml) into basket.
- button "X"
```

# Test source

```ts
  1   | import { expect, test } from './fixtures';
  2   | import { addMoneyToWallet, addSavedAddress, addSavedCard } from './helpers/api';
  3   | import { DELIVERY, PRODUCTS } from './helpers/test-data';
  4   | import { AddressPage, DeliveryPage, OrderCompletionPage, OrderSummaryPage, PaymentPage } from './pages/checkout';
  5   | import { OrderHistoryPage, WalletPage } from './pages/account';
  6   | import { BasketPage, ProductListPage, TopBar } from './pages/shop';
  7   | 
  8   | test.describe('TC-08: Payment with the wallet', () => {
  9   |   test('the wallet cannot pay a short balance and pays the exact total', async ({ loggedInPage: page, customer, request }) => {
  10  |     const products = new ProductListPage(page);
  11  |     const topBar = new TopBar(page);
  12  |     const basket = new BasketPage(page);
  13  |     const addressPage = new AddressPage(page);
  14  |     const deliveryPage = new DeliveryPage(page);
  15  |     const paymentPage = new PaymentPage(page);
  16  |     const summary = new OrderSummaryPage(page);
  17  |     const completion = new OrderCompletionPage(page);
  18  |     const history = new OrderHistoryPage(page);
  19  |     const wallet = new WalletPage(page);
  20  |     const product = PRODUCTS.eggfruit;
  21  |     let orderId = '';
  22  | 
  23  |     // Preconditions 3, 4 and 5: saved address and card, basket with product quantity 1, wallet 5.00¤.
  24  |     const cardId = await addSavedCard(request, customer.token);
  25  |     await addSavedAddress(request, customer.token);
  26  |     await addMoneyToWallet(request, customer.token, cardId, 5);
  27  |     await products.goto();
  28  |     await products.addToBasket(product.name);
  29  |     await topBar.expectBasketCounter(1);
  30  | 
  31  |     // Part 1: the wallet holds less than the order total.
  32  |     await test.step('1. Checkout, select the saved address and continue: delivery page opens', async () => {
  33  |       await topBar.openBasket();
  34  |       await basket.checkoutButton.click();
  35  |       await addressPage.expectOpen();
  36  |       await addressPage.selectSavedAddress();
  37  |       await addressPage.continue();
  38  |       await deliveryPage.expectOpen();
  39  |     });
  40  | 
  41  |     await test.step('2. Select Standard Delivery and continue: wallet balance 5.00 and the pay button 8.99¤', async () => {
  42  |       await deliveryPage.select(DELIVERY.standard.name);
  43  |       await deliveryPage.continue();
  44  |       await paymentPage.expectOpen();
  45  |       await expect(page.getByText('Wallet Balance')).toBeVisible();
> 46  |       await expect(page.locator('body')).toContainText('5.00');
      |                                          ^ Error: expect(locator).toContainText(expected) failed
  47  |       await expect(paymentPage.walletPayButton('8.99¤')).toBeVisible();
  48  |     });
  49  | 
  50  |     await test.step('3. The pay button 8.99¤ is disabled', async () => {
  51  |       await expect(paymentPage.walletPayButton('8.99¤')).toBeDisabled();
  52  |     });
  53  | 
  54  |     await test.step('4. Order history shows no orders', async () => {
  55  |       await topBar.openOrdersAndPaymentItem('Order History');
  56  |       await history.expectEmpty();
  57  |     });
  58  | 
  59  |     await test.step('5. Digital wallet shows the balance 5.00', async () => {
  60  |       await topBar.openOrdersAndPaymentItem('Digital Wallet');
  61  |       await wallet.expectBalance('5.00');
  62  |     });
  63  | 
  64  |     // Part 2: the wallet holds exactly the order total.
  65  |     await test.step('6. Add 3.99 with the saved card; checkout to payment: pay button 8.99¤ is enabled', async () => {
  66  |       await addMoneyToWallet(request, customer.token, cardId, 3.99);
  67  |       await page.goto('/#/basket');
  68  |       await basket.checkoutButton.click();
  69  |       await addressPage.expectOpen();
  70  |       await addressPage.selectSavedAddress();
  71  |       await addressPage.continue();
  72  |       await deliveryPage.expectOpen();
  73  |       await deliveryPage.select(DELIVERY.standard.name);
  74  |       await deliveryPage.continue();
  75  |       await paymentPage.expectOpen();
  76  |       await expect(page.locator('body')).toContainText('8.99');
  77  |       await expect(paymentPage.walletPayButton('8.99¤')).toBeEnabled();
  78  |     });
  79  | 
  80  |     await test.step('7. Pay with the wallet: order summary shows Digital Wallet and 8.99¤', async () => {
  81  |       await paymentPage.walletPayButton('8.99¤').click();
  82  |       await summary.expectOpen();
  83  |       await expect(page.getByText('Digital Wallet').first()).toBeVisible();
  84  |       await expect(summary.line('Total Price')).toContainText('8.99¤');
  85  |     });
  86  | 
  87  |     await test.step('8. Place the order: the confirmation shows the thank you text', async () => {
  88  |       await summary.placeOrder();
  89  |       orderId = await completion.expectOpen();
  90  |     });
  91  | 
  92  |     await test.step('9. Digital wallet shows the balance 1.00 (8.99 - 8.99 + 1 bonus point)', async () => {
  93  |       await topBar.openOrdersAndPaymentItem('Digital Wallet');
  94  |       await wallet.expectBalance('1.00');
  95  |     });
  96  | 
  97  |     await test.step('10. Order history shows one order with total 8.99¤ and bonus 1', async () => {
  98  |       await topBar.openOrdersAndPaymentItem('Order History');
  99  |       await history.expectOrderCount(1);
  100 |       await history.expectOrder(orderId, '8.99¤');
  101 |       await expect(page.locator('body')).toContainText(/Bonus\s*1(?![\d.])/);
  102 |     });
  103 |   });
  104 | });
  105 | 
```