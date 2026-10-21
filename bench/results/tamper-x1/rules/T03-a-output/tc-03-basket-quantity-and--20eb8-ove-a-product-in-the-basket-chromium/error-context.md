# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-03-basket-quantity-and-remove.spec.ts >> TC-03: Change the quantity and remove a product in the basket
- Location: tests/tc-03-basket-quantity-and-remove.spec.ts:5:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('app-basket mat-row').filter({ has: locator('mat-cell.mat-column-product').filter({ hasText: 'Raspberry Juice (1000ml)' }) }).locator('mat-cell.mat-column-quantity > span')
Expected: "1"
Received: " 2"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('app-basket mat-row').filter({ has: locator('mat-cell.mat-column-product').filter({ hasText: 'Raspberry Juice (1000ml)' }) }).locator('mat-cell.mat-column-quantity > span') with timeout 5000ms
  - waiting for locator('app-basket mat-row').filter({ has: locator('mat-cell.mat-column-product').filter({ hasText: 'Raspberry Juice (1000ml)' }) }).locator('mat-cell.mat-column-quantity > span')
    14 × locator resolved to <span class="cell-initial-font" _ngcontent-ng-c125060177=""> 2</span>
       - unexpected value " 2"

```

```yaml
- text: "2"
```

# Test source

```ts
  1  | import { test, expect } from './support/fixtures';
  2  | import { expectPrice } from './support/assertions';
  3  | import { PRODUCTS } from './support/test-data';
  4  | 
  5  | test('TC-03: Change the quantity and remove a product in the basket', async ({
  6  |   customer,
  7  |   page,
  8  |   loginPage,
  9  |   basket,
  10 |   navBar,
  11 | }) => {
  12 |   const a = PRODUCTS.raspberryJuice;
  13 |   const b = PRODUCTS.eggfruitJuice;
  14 |   await customer.api.addToBasket(a.name, 1);
  15 |   await customer.api.addToBasket(b.name, 1);
  16 |   await loginPage.login(customer.email, customer.password);
  17 | 
  18 |   await test.step('1. Open the basket', async () => {
  19 |     await basket.open();
  20 |     await expect(basket.rows).toHaveCount(2);
> 21 |     await expect(basket.quantity(a.name)).toHaveText('1');
     |                                           ^ Error: expect(locator).toHaveText(expected) failed
  22 |     await expect(basket.quantity(b.name)).toHaveText('1');
  23 |     await expectPrice(basket.totalPrice, a.price + b.price);
  24 |     await expect(navBar.basketCounter).toHaveText('2');
  25 |   });
  26 | 
  27 |   await test.step('2. Click plus in the row of product A', async () => {
  28 |     await basket.increase(a.name);
  29 |     await expect(basket.quantity(a.name)).toHaveText('2');
  30 |     await expectPrice(basket.totalPrice, 2 * a.price + b.price);
  31 |     await expect(navBar.basketCounter).toHaveText('3');
  32 |   });
  33 | 
  34 |   await test.step('3. Click minus in the row of product A', async () => {
  35 |     await basket.decrease(a.name);
  36 |     await expect(basket.quantity(a.name)).toHaveText('1');
  37 |     await expectPrice(basket.totalPrice, a.price + b.price);
  38 |     await expect(navBar.basketCounter).toHaveText('2');
  39 |   });
  40 | 
  41 |   await test.step('4. Click minus in the row of product A again', async () => {
  42 |     await basket.decrease(a.name);
  43 |     await expect(basket.row(a.name)).toBeVisible();
  44 |     await expect(basket.quantity(a.name)).toHaveText('1');
  45 |     await expectPrice(basket.totalPrice, a.price + b.price);
  46 |     // The quantity must stay 1 also after a reload from the server.
  47 |     await page.reload();
  48 |     await basket.waitForLoad();
  49 |     await expect(basket.row(a.name)).toBeVisible();
  50 |     await expect(basket.quantity(a.name)).toHaveText('1');
  51 |     await expectPrice(basket.totalPrice, a.price + b.price);
  52 |   });
  53 | 
  54 |   await test.step('5. Click trash in the row of product A', async () => {
  55 |     await basket.remove(a.name);
  56 |     await expect(basket.row(a.name)).toHaveCount(0);
  57 |     await expect(basket.rows).toHaveCount(1);
  58 |     await expect(basket.quantity(b.name)).toHaveText('1');
  59 |     await expectPrice(basket.totalPrice, b.price);
  60 |     await expect(navBar.basketCounter).toHaveText('1');
  61 |   });
  62 | });
  63 | 
```