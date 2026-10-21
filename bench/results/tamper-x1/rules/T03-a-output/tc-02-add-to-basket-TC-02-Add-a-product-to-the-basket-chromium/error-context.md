# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-02-add-to-basket.spec.ts >> TC-02: Add a product to the basket
- Location: tests/tc-02-add-to-basket.spec.ts:5:5

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
  3  | import { PRODUCTS, priceText } from './support/test-data';
  4  | 
  5  | test('TC-02: Add a product to the basket', async ({ page, loggedInCustomer: _, productList, navBar, basket }) => {
  6  |   const product = PRODUCTS.eggfruitJuice;
  7  | 
  8  |   await test.step('1. Open the product list', async () => {
  9  |     await productList.open();
  10 |     await expect(productList.productName(product.name)).toHaveText(product.name);
  11 |     await expect(productList.productPrice(product.name)).toHaveText(priceText(product.price));
  12 |     await expect(productList.addToBasketButton(product.name)).toBeVisible();
  13 |     await expect(navBar.basketCounter).toHaveText('0');
  14 |   });
  15 | 
  16 |   await test.step('2. Add the product to the basket', async () => {
  17 |     await productList.addToBasket(product.name);
  18 |     await expect(productList.message(`Placed ${product.name} into basket.`).first()).toBeVisible();
> 19 |     await expect(navBar.basketCounter).toHaveText('1');
     |                                        ^ Error: expect(locator).toHaveText(expected) failed
  20 |   });
  21 | 
  22 |   await test.step('3. Open the basket', async () => {
  23 |     await navBar.openBasket();
  24 |     await basket.waitForLoad();
  25 |     await expect(page).toHaveURL(/#\/basket/);
  26 |     await expect(basket.rows).toHaveCount(1);
  27 |     await expect(basket.row(product.name)).toBeVisible();
  28 |     await expect(basket.quantity(product.name)).toHaveText('1');
  29 |     await expect(basket.price(product.name)).toHaveText(priceText(product.price));
  30 |   });
  31 | 
  32 |   await test.step('4. Read the total of the basket', async () => {
  33 |     await expectPrice(basket.totalPrice, product.price);
  34 |   });
  35 | });
  36 | 
```