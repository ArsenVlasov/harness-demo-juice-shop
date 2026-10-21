# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-06-invalid-and-expired-coupon.spec.ts >> TC-06: Invalid coupon and expired coupon
- Location: tests/tc-06-invalid-and-expired-coupon.spec.ts:6:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('app-order-summary').locator('mat-row').filter({ hasText: 'Eggfruit Juice (500ml)' })
Expected substring: "2"
Received string:    " Eggfruit Juice (500ml) 3 8.99¤"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('app-order-summary').locator('mat-row').filter({ hasText: 'Eggfruit Juice (500ml)' }) with timeout 5000ms
  - waiting for locator('app-order-summary').locator('mat-row').filter({ hasText: 'Eggfruit Juice (500ml)' })
    13 × locator resolved to <mat-row role="row" _ngcontent-ng-c125060177="" class="mat-mdc-row mdc-data-table__row cdk-row">…</mat-row>
       - unexpected value " Eggfruit Juice (500ml) 3 8.99¤"

```

```yaml
- row "Eggfruit Juice (500ml) Eggfruit Juice (500ml) 3 8.99¤":
  - cell "Eggfruit Juice (500ml)":
    - img "Eggfruit Juice (500ml)"
  - cell "Eggfruit Juice (500ml)"
  - cell "3"
  - cell "8.99¤"
```

# Test source

```ts
  1  | import { test, expect } from './support/fixtures';
  2  | import { expectPrice } from './support/assertions';
  3  | import { addSavedAddressAndCard } from './support/checkout';
  4  | import { DELIVERY, PRODUCTS, expiredCouponCode, money } from './support/test-data';
  5  | 
  6  | test('TC-06: Invalid coupon and expired coupon', async ({
  7  |   customer,
  8  |   loginPage,
  9  |   basket,
  10 |   selectAddress,
  11 |   deliveryMethod,
  12 |   payment,
  13 |   orderSummary,
  14 | }) => {
  15 |   const product = PRODUCTS.eggfruitJuice;
  16 |   const quantity = 2;
  17 |   const invalidCode = 'abcdefghij';
  18 |   const expiredCoupon = expiredCouponCode(10);
  19 | 
  20 |   await addSavedAddressAndCard(customer);
  21 |   await customer.api.addToBasket(product.name, quantity);
  22 |   await loginPage.login(customer.email, customer.password);
  23 | 
  24 |   const items = money(product.price * quantity);
  25 |   const total = money(items + DELIVERY.oneDay.price);
  26 | 
  27 |   await test.step('1. Checkout with the saved address', async () => {
  28 |     await basket.open();
  29 |     await basket.checkout();
  30 |     await selectAddress.selectSavedAddressAndContinue();
  31 |     await expect(deliveryMethod.title).toBeVisible();
  32 |   });
  33 | 
  34 |   await test.step('2. Select One Day Delivery and continue', async () => {
  35 |     await deliveryMethod.selectAndContinue(DELIVERY.oneDay.name);
  36 |     await expect(payment.title).toBeVisible();
  37 |   });
  38 | 
  39 |   await test.step('3. Redeem the invalid code', async () => {
  40 |     await payment.openCouponPanel();
  41 |     await payment.redeemCoupon(invalidCode);
  42 |     await expect(payment.couponError).toHaveText('Invalid coupon.');
  43 |     await expect(payment.couponConfirmation).toHaveCount(0);
  44 |   });
  45 | 
  46 |   await test.step('4. Redeem the expired coupon', async () => {
  47 |     await payment.redeemCoupon(expiredCoupon);
  48 |     await expect(payment.couponError).toHaveText('Invalid coupon.');
  49 |     await expect(payment.couponConfirmation).toHaveCount(0);
  50 |   });
  51 | 
  52 |   await test.step('5. Select the saved card and continue', async () => {
  53 |     await payment.selectSavedCardAndContinue();
  54 |     await orderSummary.waitForLoad();
> 55 |     await expect(orderSummary.row(product.name)).toContainText(String(quantity));
     |                                                  ^ Error: expect(locator).toContainText(expected) failed
  56 |     await expectPrice(orderSummary.totals.items, items);
  57 |     await expectPrice(orderSummary.totals.delivery, DELIVERY.oneDay.price);
  58 |     await expectPrice(orderSummary.totals.promotion, 0);
  59 |     await expectPrice(orderSummary.totals.total, total);
  60 |   });
  61 | });
  62 | 
```