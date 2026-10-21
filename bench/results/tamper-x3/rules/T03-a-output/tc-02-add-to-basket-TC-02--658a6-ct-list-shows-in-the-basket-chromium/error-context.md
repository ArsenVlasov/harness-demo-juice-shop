# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-02-add-to-basket.spec.ts >> TC-02: Add a product to the basket >> TC-02 product added from the product list shows in the basket
- Location: tests/tc-02-add-to-basket.spec.ts:6:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('button', { name: 'Show the shopping cart' }).locator('.fa-layers-counter')
Expected: "1"
Received: "2"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" getByRole('button', { name: 'Show the shopping cart' }).locator('.fa-layers-counter') with timeout 5000ms
  - waiting for getByRole('button', { name: 'Show the shopping cart' }).locator('.fa-layers-counter')
    14 × locator resolved to <span _ngcontent-ng-c1731522247="" class="fa-layers-counter fa-layers-top-right fa-3x warn-notification">2</span>
       - unexpected value "2"

```

```yaml
- text: "2"
```

# Test source

```ts
  1  | import { test, expect } from './fixtures';
  2  | import { PRODUCTS } from '../data/test-data';
  3  | import { price } from '../helpers/money';
  4  | 
  5  | test.describe('TC-02: Add a product to the basket', () => {
  6  |   test('TC-02 product added from the product list shows in the basket', async ({
  7  |     page,
  8  |     loginAsCustomer,
  9  |     searchPage,
  10 |     navBar,
  11 |     basketPage,
  12 |   }) => {
  13 |     const product = PRODUCTS.eggfruitJuice;
  14 |     await loginAsCustomer();
  15 | 
  16 |     await test.step('1. Open the product list', async () => {
  17 |       await searchPage.goto();
  18 |       await expect(searchPage.productCard(product.name)).toContainText(product.name);
  19 |       await expect(searchPage.productCard(product.name)).toContainText(price(product.price));
  20 |       await expect(searchPage.addToBasketButton(product.name)).toBeVisible();
  21 |       await expect(navBar.basketCounter).toHaveText('0');
  22 |     });
  23 | 
  24 |     await test.step('2. Add the product to the basket', async () => {
  25 |       await searchPage.addToBasket(product.name);
  26 |       await expect(searchPage.snackBar.message(`Placed ${product.name} into basket.`)).toBeVisible();
> 27 |       await expect(navBar.basketCounter).toHaveText('1');
     |                                          ^ Error: expect(locator).toHaveText(expected) failed
  28 |     });
  29 | 
  30 |     await test.step('3. Open the basket', async () => {
  31 |       await navBar.openBasket();
  32 |       await expect(page).toHaveURL(/#\/basket/);
  33 |       await expect(basketPage.table.rows).toHaveCount(1);
  34 |       await expect(basketPage.table.row(product.name)).toBeVisible();
  35 |       await expect(basketPage.table.quantity(product.name)).toHaveText('1');
  36 |       await expect(basketPage.table.price(product.name)).toHaveText(price(product.price));
  37 |     });
  38 | 
  39 |     await test.step('4. Read the total of the basket', async () => {
  40 |       await expect(basketPage.totalPrice).toHaveText(`Total Price: ${price(product.price)}`);
  41 |     });
  42 |   });
  43 | });
  44 | 
```