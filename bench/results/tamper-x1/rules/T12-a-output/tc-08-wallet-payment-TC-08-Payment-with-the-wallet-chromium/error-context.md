# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-08-wallet-payment.spec.ts >> TC-08: Payment with the wallet
- Location: tests/tc-08-wallet-payment.spec.ts:6:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('app-order-history').locator('.table-container').first().locator('.heading-row .col-vertical').filter({ has: locator('div').filter({ hasText: /^Bonus$/ }) }).locator('div').nth(1)
Expected: "1"
Received: "2"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('app-order-history').locator('.table-container').first().locator('.heading-row .col-vertical').filter({ has: locator('div').filter({ hasText: /^Bonus$/ }) }).locator('div').nth(1) with timeout 5000ms
  - waiting for locator('app-order-history').locator('.table-container').first().locator('.heading-row .col-vertical').filter({ has: locator('div').filter({ hasText: /^Bonus$/ }) }).locator('div').nth(1)
    14 × locator resolved to <div _ngcontent-ng-c4079035162="">2</div>
       - unexpected value "2"

```

```yaml
- text: "2"
```

# Test source

```ts
  2   | import { expectPrice } from './support/assertions';
  3   | import { addSavedAddressAndCard } from './support/checkout';
  4   | import { DELIVERY, PRODUCTS, bonusPoints, money, priceText } from './support/test-data';
  5   | 
  6   | test('TC-08: Payment with the wallet', async ({
  7   |   customer,
  8   |   loginPage,
  9   |   page,
  10  |   navBar,
  11  |   basket,
  12  |   selectAddress,
  13  |   deliveryMethod,
  14  |   payment,
  15  |   orderSummary,
  16  |   orderCompletion,
  17  |   orderHistory,
  18  |   wallet,
  19  | }) => {
  20  |   const line = { product: PRODUCTS.eggfruitJuice, quantity: 1 };
  21  |   const firstBalance = 5;
  22  |   const topUp = 3.99;
  23  |   const total = money(line.product.price * line.quantity + DELIVERY.standard.price);
  24  |   const bonus = bonusPoints([line]);
  25  | 
  26  |   const cardId = await addSavedAddressAndCard(customer);
  27  |   await customer.api.addToBasket(line.product.name, line.quantity);
  28  |   expect(await customer.api.topUpWallet(firstBalance, cardId)).toBe(firstBalance);
  29  |   await loginPage.login(customer.email, customer.password);
  30  | 
  31  |   // Part 1: the wallet holds less than the order total.
  32  | 
  33  |   await test.step('1. Checkout with the saved address', async () => {
  34  |     await basket.open();
  35  |     await basket.checkout();
  36  |     await selectAddress.selectSavedAddressAndContinue();
  37  |     await expect(deliveryMethod.title).toBeVisible();
  38  |   });
  39  | 
  40  |   await test.step('2. Select Standard Delivery and continue', async () => {
  41  |     await deliveryMethod.selectAndContinue(DELIVERY.standard.name);
  42  |     await expect(payment.title).toBeVisible();
  43  |     await expectPrice(payment.walletBalance, firstBalance);
  44  |     await expect(payment.walletPayButton).toHaveText(new RegExp(`Pay ${priceText(total)}`));
  45  |   });
  46  | 
  47  |   await test.step(`3. The button Pay ${priceText(total)} is disabled`, async () => {
  48  |     await expect(payment.walletPayButton).toBeDisabled();
  49  |   });
  50  | 
  51  |   await test.step('4. The order history is empty', async () => {
  52  |     await navBar.openOrderHistory();
  53  |     await expect(orderHistory.emptyMessage).toBeVisible();
  54  |     await expect(orderHistory.orders).toHaveCount(0);
  55  |   });
  56  | 
  57  |   await test.step('5. The wallet balance is unchanged', async () => {
  58  |     await navBar.openDigitalWallet();
  59  |     await expect(wallet.title).toBeVisible();
  60  |     await expectPrice(wallet.balance, firstBalance);
  61  |   });
  62  | 
  63  |   // Part 2: the wallet holds exactly the order total.
  64  |   expect(await customer.api.topUpWallet(topUp, cardId)).toBeCloseTo(firstBalance + topUp, 2);
  65  |   const balance = money(firstBalance + topUp);
  66  |   expect(balance).toBe(total);
  67  | 
  68  |   await test.step('6. Checkout again to the payment options', async () => {
  69  |     await basket.open();
  70  |     await basket.checkout();
  71  |     await selectAddress.selectSavedAddressAndContinue();
  72  |     await deliveryMethod.selectAndContinue(DELIVERY.standard.name);
  73  |     await expect(payment.title).toBeVisible();
  74  |     await expectPrice(payment.walletBalance, balance);
  75  |     await expect(payment.walletPayButton).toHaveText(new RegExp(`Pay ${priceText(total)}`));
  76  |     await expect(payment.walletPayButton).toBeEnabled();
  77  |   });
  78  | 
  79  |   await test.step(`7. Click Pay ${priceText(total)}`, async () => {
  80  |     await payment.payWithWallet();
  81  |     await orderSummary.waitForLoad();
  82  |     await expect(orderSummary.paymentMethod).toContainText('Digital Wallet');
  83  |     await expectPrice(orderSummary.totals.total, total);
  84  |   });
  85  | 
  86  |   await test.step('8. Place the order', async () => {
  87  |     await orderSummary.placeOrder();
  88  |     await expect(page).toHaveURL(/#\/order-completion\/.+/);
  89  |     await expect(orderCompletion.title).toBeVisible();
  90  |   });
  91  | 
  92  |   await test.step('9. The wallet balance is the bonus of the order', async () => {
  93  |     await navBar.openDigitalWallet();
  94  |     await expectPrice(wallet.balance, balance - total + bonus);
  95  |   });
  96  | 
  97  |   await test.step('10. The order history shows the order', async () => {
  98  |     await navBar.openOrderHistory();
  99  |     await expect(orderHistory.orders).toHaveCount(1);
  100 |     const order = orderHistory.orders.first();
  101 |     await expectPrice(orderHistory.orderField(order, 'Total Price'), total);
> 102 |     await expect(orderHistory.orderField(order, 'Bonus')).toHaveText(String(bonus));
      |                                                           ^ Error: expect(locator).toHaveText(expected) failed
  103 |   });
  104 | });
  105 | 
```