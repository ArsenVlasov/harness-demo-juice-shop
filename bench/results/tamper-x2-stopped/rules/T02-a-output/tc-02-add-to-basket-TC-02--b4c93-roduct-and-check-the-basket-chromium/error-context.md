# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-02-add-to-basket.spec.ts >> TC-02: Add a product to the basket >> add one product and check the basket
- Location: tests/tc-02-add-to-basket.spec.ts:6:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('row').filter({ hasText: 'Eggfruit Juice (500ml)' })
Expected substring: "8.99¤"
Received string:    " Eggfruit Juice (500ml) 1 9.99¤"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('row').filter({ hasText: 'Eggfruit Juice (500ml)' }) with timeout 5000ms
  - waiting for getByRole('row').filter({ hasText: 'Eggfruit Juice (500ml)' })
    14 × locator resolved to <mat-row role="row" _ngcontent-ng-c125060177="" class="mat-mdc-row mdc-data-table__row cdk-row">…</mat-row>
       - unexpected value " Eggfruit Juice (500ml) 1 9.99¤"

```

```yaml
- row "Eggfruit Juice (500ml) Eggfruit Juice (500ml) 1 9.99¤":
  - cell "Eggfruit Juice (500ml)":
    - img "Eggfruit Juice (500ml)"
  - cell "Eggfruit Juice (500ml)"
  - cell "1":
    - button
    - text: "1"
    - button
  - cell "9.99¤"
  - cell:
    - button
```

# Test source

```ts
  1  | import { expect, test } from './fixtures';
  2  | import { BasketPage, ProductListPage, TopBar } from './pages/shop';
  3  | import { PRODUCTS } from './helpers/test-data';
  4  | 
  5  | test.describe('TC-02: Add a product to the basket', () => {
  6  |   test('add one product and check the basket', async ({ loggedInPage: page }) => {
  7  |     const products = new ProductListPage(page);
  8  |     const topBar = new TopBar(page);
  9  |     const basket = new BasketPage(page);
  10 |     const product = PRODUCTS.eggfruit;
  11 | 
  12 |     await test.step('1. The product list shows the product and an empty basket', async () => {
  13 |       await products.goto();
  14 |       await products.expectProductTile(product.name, product.price);
  15 |       await topBar.expectBasketCounter(0);
  16 |     });
  17 | 
  18 |     await test.step('2. Add the product to the basket', async () => {
  19 |       await products.addToBasket(product.name);
  20 |       await products.expectMessage(`Placed ${product.name} into basket.`);
  21 |       await topBar.expectBasketCounter(1);
  22 |     });
  23 | 
  24 |     await test.step('3. The basket shows one row with the product', async () => {
  25 |       await topBar.openBasket();
  26 |       await basket.expectRow(product.name, 1);
> 27 |       await expect(basket.row(product.name)).toContainText(product.price);
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  28 |     });
  29 | 
  30 |     await test.step('4. The basket total is the price of the product', async () => {
  31 |       await basket.expectTotal(product.price);
  32 |     });
  33 |   });
  34 | });
  35 | 
```