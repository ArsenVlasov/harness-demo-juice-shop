# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wallet-payment.spec.ts >> Payment with the wallet >> the wallet cannot pay a short balance and pays the exact total
- Location: tests/wallet-payment.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Pay 8.99¤' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Pay 8.99¤' }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Pay 8.99¤' })

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
- text: Pay using wallet Wallet Balance 5.00
- button "Pay 9.99¤" [disabled]
- separator
- button "Add a coupon Add a coupon code to receive discounts"
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
  2   | import { addMoneyToWallet, addSavedAddress, addSavedCard } from './helpers/api';
  3   | import { DELIVERY, PRODUCTS } from './helpers/test-data';
  4   | import { AddressPage, DeliveryPage, OrderCompletionPage, OrderSummaryPage, PaymentPage } from './pages/checkout';
  5   | import { OrderHistoryPage, WalletPage } from './pages/account';
  6   | import { BasketPage, ProductListPage, TopBar } from './pages/shop';
  7   | 
  8   | test.describe('Payment with the wallet', {
  9   |   annotation: { type: 'test-case', description: 'TC-08' },
  10  | }, () => {
  11  |   test('the wallet cannot pay a short balance and pays the exact total', async ({ loggedInPage: page, customer, request }) => {
  12  |     const products = new ProductListPage(page);
  13  |     const topBar = new TopBar(page);
  14  |     const basket = new BasketPage(page);
  15  |     const addressPage = new AddressPage(page);
  16  |     const deliveryPage = new DeliveryPage(page);
  17  |     const paymentPage = new PaymentPage(page);
  18  |     const summary = new OrderSummaryPage(page);
  19  |     const completion = new OrderCompletionPage(page);
  20  |     const history = new OrderHistoryPage(page);
  21  |     const wallet = new WalletPage(page);
  22  |     const product = PRODUCTS.eggfruit;
  23  |     let orderId = '';
  24  | 
  25  |     // Preconditions 3, 4 and 5: saved address and card, basket with product quantity 1, wallet 5.00¤.
  26  |     const cardId = await addSavedCard(request, customer.token);
  27  |     await addSavedAddress(request, customer.token);
  28  |     await addMoneyToWallet(request, customer.token, cardId, 5);
  29  |     await products.goto();
  30  |     await products.addToBasket(product.name);
  31  |     await topBar.expectBasketCounter(1);
  32  | 
  33  |     // Part 1: the wallet holds less than the order total.
  34  |     await test.step('1. Checkout, select the saved address and continue: delivery page opens', async () => {
  35  |       await topBar.openBasket();
  36  |       await basket.checkoutButton.click();
  37  |       await addressPage.expectOpen();
  38  |       await addressPage.selectSavedAddress();
  39  |       await addressPage.continue();
  40  |       await deliveryPage.expectOpen();
  41  |     });
  42  | 
  43  |     await test.step('2. Select Standard Delivery and continue: wallet balance 5.00 and the pay button 8.99¤', async () => {
  44  |       await deliveryPage.select(DELIVERY.standard.name);
  45  |       await deliveryPage.continue();
  46  |       await paymentPage.expectOpen();
  47  |       await paymentPage.expectWalletBalance('5.00');
> 48  |       await expect(paymentPage.walletPayButton('8.99¤')).toBeVisible();
      |                                                          ^ Error: expect(locator).toBeVisible() failed
  49  |     });
  50  | 
  51  |     await test.step('3. The pay button 8.99¤ is disabled', async () => {
  52  |       await expect(paymentPage.walletPayButton('8.99¤')).toBeDisabled();
  53  |     });
  54  | 
  55  |     await test.step('4. Order history shows no orders', async () => {
  56  |       await topBar.openOrdersAndPaymentItem('Order History');
  57  |       await history.expectEmpty();
  58  |     });
  59  | 
  60  |     await test.step('5. Digital wallet shows the balance 5.00', async () => {
  61  |       await topBar.openOrdersAndPaymentItem('Digital Wallet');
  62  |       await wallet.expectBalance('5.00');
  63  |     });
  64  | 
  65  |     // Part 2: the wallet holds exactly the order total.
  66  |     await test.step('6. Add 3.99 with the saved card; checkout to payment: pay button 8.99¤ is enabled', async () => {
  67  |       await addMoneyToWallet(request, customer.token, cardId, 3.99);
  68  |       await page.goto('/#/basket');
  69  |       await basket.checkoutButton.click();
  70  |       await addressPage.expectOpen();
  71  |       await addressPage.selectSavedAddress();
  72  |       await addressPage.continue();
  73  |       await deliveryPage.expectOpen();
  74  |       await deliveryPage.select(DELIVERY.standard.name);
  75  |       await deliveryPage.continue();
  76  |       await paymentPage.expectOpen();
  77  |       await paymentPage.expectWalletBalance('8.99');
  78  |       await expect(paymentPage.walletPayButton('8.99¤')).toBeEnabled();
  79  |     });
  80  | 
  81  |     await test.step('7. Pay with the wallet: order summary shows Digital Wallet and 8.99¤', async () => {
  82  |       await paymentPage.walletPayButton('8.99¤').click();
  83  |       await summary.expectOpen();
  84  |       await expect(page.getByText('Digital Wallet').first()).toBeVisible();
  85  |       await expect(summary.line('Total Price')).toContainText('8.99¤');
  86  |     });
  87  | 
  88  |     await test.step('8. Place the order: the confirmation shows the thank you text', async () => {
  89  |       await summary.placeOrder();
  90  |       orderId = await completion.expectOpen();
  91  |     });
  92  | 
  93  |     await test.step('9. Digital wallet shows the balance 1.00 (8.99 - 8.99 + 1 bonus point)', async () => {
  94  |       await topBar.openOrdersAndPaymentItem('Digital Wallet');
  95  |       await wallet.expectBalance('1.00');
  96  |     });
  97  | 
  98  |     await test.step('10. Order history shows one order with total 8.99¤ and bonus 1', async () => {
  99  |       await topBar.openOrdersAndPaymentItem('Order History');
  100 |       await history.expectOrderCount(1);
  101 |       await history.expectOrder(orderId, '8.99¤');
  102 |       await expect(page.locator('body')).toContainText(/Bonus\s*1(?![\d.])/);
  103 |     });
  104 |   });
  105 | });
  106 | 
```