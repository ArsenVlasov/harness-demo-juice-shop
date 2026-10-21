# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-05-valid-coupon.spec.ts >> TC-05: Valid coupon on the payment step
- Location: tests/tc-05-valid-coupon.spec.ts:6:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('app-delivery-method').getByRole('row').filter({ hasText: 'One Day Delivery' }).getByRole('cell').nth(2)
Expected: "0.99¤"
Received: "1.99¤"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('app-delivery-method').getByRole('row').filter({ hasText: 'One Day Delivery' }).getByRole('cell').nth(2) with timeout 5000ms
  - waiting for locator('app-delivery-method').getByRole('row').filter({ hasText: 'One Day Delivery' }).getByRole('cell').nth(2)
    14 × locator resolved to <mat-cell role="cell" _ngcontent-ng-c3670083191="" class="mat-mdc-cell mdc-data-table__cell cdk-cell cdk-column-Price mat-column-Price">1.99¤</mat-cell>
       - unexpected value "1.99¤"

```

```yaml
- cell "1.99¤"
```

# Test source

```ts
  1  | import { test, expect } from './support/fixtures';
  2  | import { expectPrice } from './support/assertions';
  3  | import { addSavedAddressAndCard } from './support/checkout';
  4  | import { ADDRESS, CARD_LAST_DIGITS, DELIVERY, PRODUCTS, couponCode, money, priceText } from './support/test-data';
  5  | 
  6  | test('TC-05: Valid coupon on the payment step', async ({
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
  17 |   const discountPercent = 10;
  18 |   const coupon = couponCode(discountPercent);
  19 | 
  20 |   await addSavedAddressAndCard(customer);
  21 |   await customer.api.addToBasket(product.name, quantity);
  22 |   await loginPage.login(customer.email, customer.password);
  23 | 
  24 |   const items = money(product.price * quantity);
  25 |   const promotion = money((items * discountPercent) / 100);
  26 |   const total = money(items + DELIVERY.oneDay.price - promotion);
  27 | 
  28 |   await test.step('1. Open the basket and click Checkout', async () => {
  29 |     await basket.open();
  30 |     await basket.checkout();
  31 |     await expect(selectAddress.title).toBeVisible();
  32 |     await expect(selectAddress.savedAddressRow).toContainText(ADDRESS.fullName);
  33 |     await expect(selectAddress.savedAddressRow).toContainText(ADDRESS.streetAddress);
  34 |     await expect(selectAddress.savedAddressRow).toContainText(ADDRESS.country);
  35 |   });
  36 | 
  37 |   await test.step('2. Select the saved address and continue', async () => {
  38 |     await selectAddress.selectSavedAddressAndContinue();
  39 |     await expect(deliveryMethod.title).toBeVisible();
  40 |     for (const option of [DELIVERY.oneDay, DELIVERY.fast, DELIVERY.standard]) {
  41 |       await expect(deliveryMethod.option(option.name)).toBeVisible();
> 42 |       await expect(deliveryMethod.optionPrice(option.name)).toHaveText(priceText(option.price));
     |                                                             ^ Error: expect(locator).toHaveText(expected) failed
  43 |     }
  44 |   });
  45 | 
  46 |   await test.step('3. Select One Day Delivery and continue', async () => {
  47 |     await deliveryMethod.selectAndContinue(DELIVERY.oneDay.name);
  48 |     await expect(payment.title).toBeVisible();
  49 |     await expect(payment.savedCardRow).toContainText(CARD_LAST_DIGITS);
  50 |     await expect(payment.couponPanelButton).toBeVisible();
  51 |   });
  52 | 
  53 |   await test.step('4. Redeem the coupon of the current month', async () => {
  54 |     await payment.openCouponPanel();
  55 |     await payment.redeemCoupon(coupon);
  56 |     await expect(payment.couponConfirmation).toHaveText(
  57 |       `Your discount of ${discountPercent}% will be applied during checkout.`,
  58 |     );
  59 |     await expect(payment.couponError).toHaveCount(0);
  60 |   });
  61 | 
  62 |   await test.step('5. Select the saved card and continue', async () => {
  63 |     await payment.selectSavedCardAndContinue();
  64 |     await orderSummary.waitForLoad();
  65 |     await expect(orderSummary.row(product.name)).toContainText(String(quantity));
  66 |     await expectPrice(orderSummary.totals.items, items);
  67 |     await expectPrice(orderSummary.totals.delivery, DELIVERY.oneDay.price);
  68 |     await expectPrice(orderSummary.totals.promotion, promotion);
  69 |     await expectPrice(orderSummary.totals.total, total);
  70 |   });
  71 | });
  72 | 
```