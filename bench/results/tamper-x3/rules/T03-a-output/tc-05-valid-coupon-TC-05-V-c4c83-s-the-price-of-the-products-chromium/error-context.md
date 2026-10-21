# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-05-valid-coupon.spec.ts >> TC-05: Valid coupon on the payment step >> TC-05 coupon of the current month lowers the price of the products
- Location: tests/tc-05-valid-coupon.spec.ts:9:7

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
    2 × locator resolved to <td class="mat-cell price" _ngcontent-ng-c4138824240="">0.00¤</td>
      - unexpected value "0.00¤"
    12 × locator resolved to <td class="mat-cell price" _ngcontent-ng-c4138824240="">26.97¤</td>
       - unexpected value "26.97¤"

```

```yaml
- cell "26.97¤"
```

# Test source

```ts
  1  | import { test, expect } from './fixtures';
  2  | import { ADDRESS, CARD_LAST_DIGITS, DELIVERY, PRODUCTS } from '../data/test-data';
  3  | import { appDate, couponCode } from '../helpers/coupon';
  4  | import { discount, itemsTotal, orderTotal, price } from '../helpers/money';
  5  | 
  6  | const COUPON_DISCOUNT = 10;
  7  | 
  8  | test.describe('TC-05: Valid coupon on the payment step', () => {
  9  |   test('TC-05 coupon of the current month lowers the price of the products', async ({
  10 |     page,
  11 |     request,
  12 |     api,
  13 |     loginAsCustomer,
  14 |     basketPage,
  15 |     addressPage,
  16 |     deliveryPage,
  17 |     paymentPage,
  18 |     orderSummaryPage,
  19 |   }) => {
  20 |     const product = PRODUCTS.eggfruitJuice;
  21 |     const quantity = 2;
  22 |     const delivery = DELIVERY.oneDay;
  23 |     const coupon = couponCode(await appDate(request), COUPON_DISCOUNT);
  24 |     const items = itemsTotal([{ price: product.price, quantity }]);
  25 |     const promotion = discount(items, COUPON_DISCOUNT);
  26 | 
  27 |     await api.addAddress();
  28 |     await api.addCard();
  29 |     await api.addToBasket(product.id, quantity);
  30 |     await loginAsCustomer();
  31 | 
  32 |     await test.step('1. Open the basket and click Checkout', async () => {
  33 |       await basketPage.goto();
  34 |       await basketPage.checkout();
  35 |       await expect(addressPage.title).toBeVisible();
  36 |       await expect(addressPage.address(ADDRESS.fullName)).toContainText(ADDRESS.streetAddress);
  37 |     });
  38 | 
  39 |     await test.step('2. Select the saved address and continue', async () => {
  40 |       await addressPage.selectAndContinue(ADDRESS.fullName);
  41 |       await expect(deliveryPage.title).toBeVisible();
  42 |       for (const method of [DELIVERY.oneDay, DELIVERY.fast, DELIVERY.standard]) {
  43 |         await expect(deliveryPage.price(method.name)).toHaveText(price(method.price));
  44 |       }
  45 |     });
  46 | 
  47 |     await test.step(`3. Select ${delivery.name} and continue`, async () => {
  48 |       await deliveryPage.selectAndContinue(delivery.name);
  49 |       await expect(paymentPage.title).toBeVisible();
  50 |       await expect(paymentPage.card(CARD_LAST_DIGITS)).toBeVisible();
  51 |       await expect(paymentPage.couponPanel).toContainText('Add a coupon');
  52 |     });
  53 | 
  54 |     await test.step('4. Redeem the coupon of the current month', async () => {
  55 |       await paymentPage.openCouponPanel();
  56 |       await paymentPage.redeemCoupon(coupon);
  57 |       await expect(paymentPage.couponConfirmation).toHaveText(
  58 |         `Your discount of ${COUPON_DISCOUNT}% will be applied during checkout.`,
  59 |       );
  60 |       await expect(paymentPage.couponError).toHaveCount(0);
  61 |     });
  62 | 
  63 |     await test.step('5. Select the saved card and continue', async () => {
  64 |       await paymentPage.selectCardAndContinue(CARD_LAST_DIGITS);
  65 |       await expect(page).toHaveURL(/#\/order-summary/);
> 66 |       await expect(orderSummaryPage.items).toHaveText(price(items));
     |                                            ^ Error: expect(locator).toHaveText(expected) failed
  67 |       await expect(orderSummaryPage.delivery).toHaveText(price(delivery.price));
  68 |       await expect(orderSummaryPage.promotion).toHaveText(price(promotion));
  69 |       await expect(orderSummaryPage.totalPrice).toHaveText(price(orderTotal(items, delivery.price, promotion)));
  70 |     });
  71 |   });
  72 | });
  73 | 
```