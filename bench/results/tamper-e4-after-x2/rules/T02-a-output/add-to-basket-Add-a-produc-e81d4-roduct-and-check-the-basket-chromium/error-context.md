# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-to-basket.spec.ts >> Add a product to the basket >> add one product and check the basket
- Location: tests/add-to-basket.spec.ts:8:7

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
  5  | test.describe('Add a product to the basket', {
  6  |   annotation: { type: 'test-case', description: 'TC-02' },
  7  | }, () => {
  8  |   test('add one product and check the basket', async ({ loggedInPage: page }) => {
  9  |     const products = new ProductListPage(page);
  10 |     const topBar = new TopBar(page);
  11 |     const basket = new BasketPage(page);
  12 |     const product = PRODUCTS.eggfruit;
  13 | 
  14 |     await test.step('1. The product list shows the product and an empty basket', async () => {
  15 |       await products.goto();
  16 |       await products.expectProductTile(product.name, product.price);
  17 |       await topBar.expectBasketCounter(0);
  18 |     });
  19 | 
  20 |     await test.step('2. Add the product to the basket', async () => {
  21 |       await products.addToBasket(product.name);
  22 |       await products.expectMessage(`Placed ${product.name} into basket.`);
  23 |       await topBar.expectBasketCounter(1);
  24 |     });
  25 | 
  26 |     await test.step('3. The basket shows one row with the product', async () => {
  27 |       await topBar.openBasket();
  28 |       await basket.expectProductRowCount(1);
  29 |       await basket.expectRow(product.name, 1);
> 30 |       await expect(basket.row(product.name)).toContainText(product.price);
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  31 |     });
  32 | 
  33 |     await test.step('4. The basket total is the price of the product', async () => {
  34 |       await basket.expectTotal(product.price);
  35 |     });
  36 |   });
  37 | });
  38 | 
```