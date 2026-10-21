# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-06-invalid-and-expired-coupon.spec.ts >> TC-06: Invalid coupon and expired coupon >> TC-06 invalid and expired coupons give no discount
- Location: tests/tc-06-invalid-and-expired-coupon.spec.ts:10:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('app-order-summary').locator('table').locator('tr').filter({ has: locator('td').filter({ hasText: /^\s*Items\s*$/ }) }).locator('td').nth(1)
Expected: "17.98¤"
Received: "26.97¤"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('app-order-summary').locator('table').locator('tr').filter({ has: locator('td').filter({ hasText: /^\s*Items\s*$/ }) }).locator('td').nth(1) with timeout 5000ms
  - waiting for locator('app-order-summary').locator('table').locator('tr').filter({ has: locator('td').filter({ hasText: /^\s*Items\s*$/ }) }).locator('td').nth(1)
    - locator resolved to <td class="mat-cell price" _ngcontent-ng-c4138824240="">0.00¤</td>
    - unexpected value "0.00¤"
    13 × locator resolved to <td class="mat-cell price" _ngcontent-ng-c4138824240="">26.97¤</td>
       - unexpected value "26.97¤"

```

```yaml
- cell "26.97¤"
```

# Test source

```ts
  1  | import { test, expect } from './fixtures';
  2  | import { ADDRESS, CARD_LAST_DIGITS, DELIVERY, PRODUCTS } from '../data/test-data';
  3  | import { appDate, couponCode, previousMonth } from '../helpers/coupon';
  4  | import { itemsTotal, orderTotal, price } from '../helpers/money';
  5  | 
  6  | const INVALID_CODE = 'abcdefghij';
  7  | const COUPON_DISCOUNT = 10;
  8  | 
  9  | test.describe('TC-06: Invalid coupon and expired coupon', () => {
  10 |   test('TC-06 invalid and expired coupons give no discount', async ({
  11 |     page,
  12 |     request,
  13 |     api,
  14 |     loginAsCustomer,
  15 |     basketPage,
  16 |     addressPage,
  17 |     deliveryPage,
  18 |     paymentPage,
  19 |     orderSummaryPage,
  20 |   }) => {
  21 |     const product = PRODUCTS.eggfruitJuice;
  22 |     const quantity = 2;
  23 |     const delivery = DELIVERY.oneDay;
  24 |     const expiredCoupon = couponCode(previousMonth(await appDate(request)), COUPON_DISCOUNT);
  25 |     const items = itemsTotal([{ price: product.price, quantity }]);
  26 | 
  27 |     await api.addAddress();
  28 |     await api.addCard();
  29 |     await api.addToBasket(product.id, quantity);
  30 |     await loginAsCustomer();
  31 | 
  32 |     await test.step('1. Checkout and select the saved address', async () => {
  33 |       await basketPage.goto();
  34 |       await basketPage.checkout();
  35 |       await addressPage.selectAndContinue(ADDRESS.fullName);
  36 |       await expect(deliveryPage.title).toBeVisible();
  37 |     });
  38 | 
  39 |     await test.step(`2. Select ${delivery.name} and continue`, async () => {
  40 |       await deliveryPage.selectAndContinue(delivery.name);
  41 |       await expect(paymentPage.title).toBeVisible();
  42 |     });
  43 | 
  44 |     await test.step('3. Redeem the invalid code', async () => {
  45 |       await paymentPage.openCouponPanel();
  46 |       await paymentPage.redeemCoupon(INVALID_CODE);
  47 |       await expect(paymentPage.couponError).toHaveText('Invalid coupon.');
  48 |       await expect(paymentPage.couponConfirmation).toHaveCount(0);
  49 |     });
  50 | 
  51 |     await test.step('4. Redeem the expired coupon', async () => {
  52 |       const response = page.waitForResponse((r) => r.url().includes('/rest/basket/') && r.url().includes('/coupon/'));
  53 |       await paymentPage.redeemCoupon(expiredCoupon);
  54 |       await response;
  55 |       await expect(paymentPage.couponError).toHaveText('Invalid coupon.');
  56 |       await expect(paymentPage.couponConfirmation).toHaveCount(0);
  57 |     });
  58 | 
  59 |     await test.step('5. Select the saved card and continue', async () => {
  60 |       await paymentPage.selectCardAndContinue(CARD_LAST_DIGITS);
  61 |       await expect(page).toHaveURL(/#\/order-summary/);
> 62 |       await expect(orderSummaryPage.items).toHaveText(price(items));
     |                                            ^ Error: expect(locator).toHaveText(expected) failed
  63 |       await expect(orderSummaryPage.delivery).toHaveText(price(delivery.price));
  64 |       await expect(orderSummaryPage.promotion).toHaveText(price(0));
  65 |       await expect(orderSummaryPage.totalPrice).toHaveText(price(orderTotal(items, delivery.price)));
  66 |     });
  67 |   });
  68 | });
  69 | 
```