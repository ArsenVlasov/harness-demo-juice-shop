# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-04-purchase-limit.spec.ts >> TC-04: Purchase limit for one product
- Location: tests/tc-04-purchase-limit.spec.ts:5:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('button', { name: 'Show the shopping cart' }).locator('.warn-notification')
Expected: "1"
Received: "2"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" getByRole('button', { name: 'Show the shopping cart' }).locator('.warn-notification') with timeout 5000ms
  - waiting for getByRole('button', { name: 'Show the shopping cart' }).locator('.warn-notification')
    14 × locator resolved to <span _ngcontent-ng-c1731522247="" class="fa-layers-counter fa-layers-top-right fa-3x warn-notification">2</span>
       - unexpected value "2"

```

```yaml
- text: "2"
```

# Test source

```ts
  1  | import { test, expect } from './support/fixtures';
  2  | import { expectPrice } from './support/assertions';
  3  | import { APPLE_JUICE_LIMIT, PRODUCTS } from './support/test-data';
  4  | 
  5  | test('TC-04: Purchase limit for one product', async ({ loggedInCustomer: _, page, productList, basket, navBar }) => {
  6  |   const product = PRODUCTS.appleJuice;
  7  |   const limitMessage = `You can order only up to ${APPLE_JUICE_LIMIT} items of this product.`;
  8  | 
  9  |   await test.step('1. Add the product from the product list', async () => {
  10 |     await productList.open();
  11 |     await productList.addToBasket(product.name);
  12 |     await expect(productList.message(`Placed ${product.name} into basket.`).first()).toBeVisible();
> 13 |     await expect(navBar.basketCounter).toHaveText('1');
     |                                        ^ Error: expect(locator).toHaveText(expected) failed
  14 |   });
  15 | 
  16 |   await test.step(`2. Click plus until the quantity is ${APPLE_JUICE_LIMIT}`, async () => {
  17 |     await basket.open();
  18 |     for (let quantity = 2; quantity <= APPLE_JUICE_LIMIT; quantity++) {
  19 |       const update = await basket.increase(product.name);
  20 |       // The shop shows an error message only for a failed update, so an accepted update proves no message comes later.
  21 |       expect(update.ok(), `The shop accepts quantity ${quantity}`).toBeTruthy();
  22 |       await expect(basket.quantity(product.name)).toHaveText(String(quantity));
  23 |     }
  24 |     await expect(basket.quantity(product.name)).toHaveText(String(APPLE_JUICE_LIMIT));
  25 |     await expectPrice(basket.totalPrice, APPLE_JUICE_LIMIT * product.price);
  26 |     await expect(basket.errorMessages).toHaveCount(0);
  27 |   });
  28 | 
  29 |   await test.step('3. Click plus one more time', async () => {
  30 |     await basket.increase(product.name);
  31 |     await expect(basket.message(limitMessage).first()).toBeVisible();
  32 |   });
  33 | 
  34 |   await test.step('4. Read the basket', async () => {
  35 |     await expect(basket.quantity(product.name)).toHaveText(String(APPLE_JUICE_LIMIT));
  36 |     await expectPrice(basket.totalPrice, APPLE_JUICE_LIMIT * product.price);
  37 |     await expect(navBar.basketCounter).toHaveText(String(APPLE_JUICE_LIMIT));
  38 |     // The server must keep the limit too.
  39 |     await page.reload();
  40 |     await basket.waitForLoad();
  41 |     await expect(basket.quantity(product.name)).toHaveText(String(APPLE_JUICE_LIMIT));
  42 |     await expectPrice(basket.totalPrice, APPLE_JUICE_LIMIT * product.price);
  43 |   });
  44 | 
  45 |   await test.step('5. Add the product again from the product list', async () => {
  46 |     await productList.open();
  47 |     await productList.addToBasket(product.name);
  48 |     await expect(productList.message(limitMessage).first()).toBeVisible();
  49 |     await expect(navBar.basketCounter).toHaveText(String(APPLE_JUICE_LIMIT));
  50 |   });
  51 | });
  52 | 
```