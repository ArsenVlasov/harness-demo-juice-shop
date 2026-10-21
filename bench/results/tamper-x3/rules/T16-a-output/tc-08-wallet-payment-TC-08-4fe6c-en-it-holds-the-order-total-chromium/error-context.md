# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-08-wallet-payment.spec.ts >> TC-08: Payment with the wallet >> TC-08 wallet pays only when it holds the order total
- Location: tests/tc-08-wallet-payment.spec.ts:9:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('app-order-summary').locator('mat-card').filter({ hasText: 'Payment Method' }).last()
Expected substring: "Digital Wallet"
Received string:    "Payment MethodMUT"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('app-order-summary').locator('mat-card').filter({ hasText: 'Payment Method' }).last() with timeout 5000ms
  - waiting for locator('app-order-summary').locator('mat-card').filter({ hasText: 'Payment Method' }).last()
    13 × locator resolved to <mat-card appearance="outlined" _ngcontent-ng-c4138824240="" class="mat-mdc-card mdc-card mat-elevation-z0 flex-40 mat-mdc-card-outlined mdc-card--outlined">…</mat-card>
       - unexpected value "Payment MethodMUT"

```

```yaml
- text: Payment Method MUT
```

# Test source

```ts
  1   | import { test, expect } from './fixtures';
  2   | import { ADDRESS, DELIVERY, PRODUCTS } from '../data/test-data';
  3   | import { bonusPoints, fromCents, itemsTotal, orderTotal, price, toCents } from '../helpers/money';
  4   | 
  5   | const FIRST_BALANCE = 5;
  6   | const TOP_UP = 3.99;
  7   | 
  8   | test.describe('TC-08: Payment with the wallet', () => {
  9   |   test('TC-08 wallet pays only when it holds the order total', async ({
  10  |     page,
  11  |     api,
  12  |     loginAsCustomer,
  13  |     navBar,
  14  |     basketPage,
  15  |     addressPage,
  16  |     deliveryPage,
  17  |     paymentPage,
  18  |     orderSummaryPage,
  19  |     orderCompletionPage,
  20  |     orderHistoryPage,
  21  |     walletPage,
  22  |   }) => {
  23  |     const product = PRODUCTS.eggfruitJuice;
  24  |     const lines = [{ price: product.price, quantity: 1 }];
  25  |     const delivery = DELIVERY.standard;
  26  |     const total = orderTotal(itemsTotal(lines), delivery.price);
  27  |     const bonus = bonusPoints(lines);
  28  |     const balanceBeforeOrder = fromCents(toCents(FIRST_BALANCE) + toCents(TOP_UP));
  29  |     const balanceAfterOrder = fromCents(toCents(balanceBeforeOrder) - toCents(total) + toCents(bonus));
  30  | 
  31  |     await api.addAddress();
  32  |     const cardId = await api.addCard();
  33  |     await api.addToBasket(product.id, 1);
  34  |     expect(await api.walletBalance()).toBe(0);
  35  |     await api.topUpWallet(FIRST_BALANCE, cardId);
  36  |     expect(await api.walletBalance()).toBe(FIRST_BALANCE);
  37  |     await loginAsCustomer();
  38  | 
  39  |     const checkoutToPayment = async () => {
  40  |       await basketPage.goto();
  41  |       await basketPage.checkout();
  42  |       await addressPage.selectAndContinue(ADDRESS.fullName);
  43  |       await expect(deliveryPage.title).toBeVisible();
  44  |     };
  45  | 
  46  |     // Part 1: the wallet holds less than the order total.
  47  | 
  48  |     await test.step('1. Checkout and select the saved address', async () => {
  49  |       await checkoutToPayment();
  50  |     });
  51  | 
  52  |     await test.step(`2. Select ${delivery.name} and continue`, async () => {
  53  |       await deliveryPage.selectAndContinue(delivery.name);
  54  |       await expect(paymentPage.title).toBeVisible();
  55  |       await expect(paymentPage.walletBalance).toHaveText(FIRST_BALANCE.toFixed(2));
  56  |       await expect(paymentPage.payWithWalletButton).toHaveText(`Pay ${price(total)}`);
  57  |     });
  58  | 
  59  |     await test.step(`3. The button Pay ${price(total)} is disabled`, async () => {
  60  |       await expect(paymentPage.payWithWalletButton).toBeDisabled();
  61  |     });
  62  | 
  63  |     await test.step('4. The order history is empty', async () => {
  64  |       await navBar.openOrderHistory();
  65  |       await expect(page).toHaveURL(/#\/order-history/);
  66  |       await expect(orderHistoryPage.root).toContainText('You have not placed any orders yet.');
  67  |       await expect(orderHistoryPage.orders).toHaveCount(0);
  68  |     });
  69  | 
  70  |     await test.step('5. The wallet balance is unchanged', async () => {
  71  |       await navBar.openDigitalWallet();
  72  |       await expect(page).toHaveURL(/#\/wallet/);
  73  |       await expect(walletPage.balance).toHaveText(FIRST_BALANCE.toFixed(2));
  74  |     });
  75  | 
  76  |     // Part 2: the wallet holds exactly the order total.
  77  | 
  78  |     await test.step(`Top up the wallet with ${TOP_UP} from the saved card`, async () => {
  79  |       await api.topUpWallet(TOP_UP, cardId);
  80  |       expect(await api.walletBalance()).toBeCloseTo(balanceBeforeOrder, 2);
  81  |     });
  82  | 
  83  |     await test.step('6. Checkout to the payment step again', async () => {
  84  |       await checkoutToPayment();
  85  |       await deliveryPage.selectAndContinue(delivery.name);
  86  |       await expect(paymentPage.title).toBeVisible();
  87  |       await expect(paymentPage.walletBalance).toHaveText(balanceBeforeOrder.toFixed(2));
  88  |       await expect(paymentPage.payWithWalletButton).toHaveText(`Pay ${price(total)}`);
  89  |       await expect(paymentPage.payWithWalletButton).toBeEnabled();
  90  |     });
  91  | 
  92  |     await test.step(`7. Click Pay ${price(total)}`, async () => {
  93  |       await paymentPage.payWithWalletButton.click();
  94  |       await expect(page).toHaveURL(/#\/order-summary/);
> 95  |       await expect(orderSummaryPage.paymentMethod).toContainText('Digital Wallet');
      |                                                    ^ Error: expect(locator).toContainText(expected) failed
  96  |       await expect(orderSummaryPage.totalPrice).toHaveText(price(total));
  97  |     });
  98  | 
  99  |     await test.step('8. Place the order', async () => {
  100 |       await orderSummaryPage.placeOrderButton.click();
  101 |       await expect(page).toHaveURL(/#\/order-completion\/[^/]+$/);
  102 |       await expect(orderCompletionPage.confirmation).toBeVisible();
  103 |     });
  104 | 
  105 |     await test.step('9. The wallet balance is the rest plus the bonus', async () => {
  106 |       await navBar.openDigitalWallet();
  107 |       await expect(page).toHaveURL(/#\/wallet/);
  108 |       await expect(walletPage.balance).toHaveText(balanceAfterOrder.toFixed(2));
  109 |     });
  110 | 
  111 |     await test.step('10. The order history shows the order', async () => {
  112 |       await navBar.openOrderHistory();
  113 |       await expect(page).toHaveURL(/#\/order-history/);
  114 |       await expect(orderHistoryPage.orders).toHaveCount(1);
  115 |       const order = orderHistoryPage.nth(0);
  116 |       await expect(order.totalPrice).toHaveText(price(total));
  117 |       await expect(order.bonus).toHaveText(String(bonus));
  118 |     });
  119 |   });
  120 | });
  121 | 
```