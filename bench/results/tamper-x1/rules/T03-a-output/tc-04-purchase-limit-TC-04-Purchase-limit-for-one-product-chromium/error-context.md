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
    - locator resolved to <span _ngcontent-ng-c1731522247="" class="fa-layers-counter fa-layers-top-right fa-3x warn-notification">0</span>
    - unexpected value "0"
    13 × locator resolved to <span _ngcontent-ng-c1731522247="" class="fa-layers-counter fa-layers-top-right fa-3x warn-notification">2</span>
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
  19 |       await basket.increase(product.name);
  20 |       await expect(basket.quantity(product.name)).toHaveText(String(quantity));
  21 |     }
  22 |     await expect(basket.quantity(product.name)).toHaveText(String(APPLE_JUICE_LIMIT));
  23 |     await expectPrice(basket.totalPrice, APPLE_JUICE_LIMIT * product.price);
  24 |     await expect(basket.message(limitMessage)).toHaveCount(0);
  25 |   });
  26 | 
  27 |   await test.step('3. Click plus one more time', async () => {
  28 |     await basket.increase(product.name);
  29 |     await expect(basket.message(limitMessage).first()).toBeVisible();
  30 |   });
  31 | 
  32 |   await test.step('4. Read the basket', async () => {
  33 |     await expect(basket.quantity(product.name)).toHaveText(String(APPLE_JUICE_LIMIT));
  34 |     await expectPrice(basket.totalPrice, APPLE_JUICE_LIMIT * product.price);
  35 |     await expect(navBar.basketCounter).toHaveText(String(APPLE_JUICE_LIMIT));
  36 |     // The server must keep the limit too.
  37 |     await page.reload();
  38 |     await basket.waitForLoad();
  39 |     await expect(basket.quantity(product.name)).toHaveText(String(APPLE_JUICE_LIMIT));
  40 |     await expectPrice(basket.totalPrice, APPLE_JUICE_LIMIT * product.price);
  41 |   });
  42 | 
  43 |   await test.step('5. Add the product again from the product list', async () => {
  44 |     await productList.open();
  45 |     await productList.addToBasket(product.name);
  46 |     await expect(productList.message(limitMessage).first()).toBeVisible();
  47 |     await expect(navBar.basketCounter).toHaveText(String(APPLE_JUICE_LIMIT));
  48 |   });
  49 | });
  50 | 
```