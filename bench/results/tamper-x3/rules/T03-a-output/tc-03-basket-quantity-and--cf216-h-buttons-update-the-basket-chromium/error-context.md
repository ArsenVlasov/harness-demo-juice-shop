# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-03-basket-quantity-and-remove.spec.ts >> TC-03: Change the quantity and remove a product in the basket >> TC-03 plus, minus and trash buttons update the basket
- Location: tests/tc-03-basket-quantity-and-remove.spec.ts:6:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('app-basket').locator('app-purchase-basket mat-row').filter({ hasText: 'Raspberry Juice (1000ml)' }).locator('mat-cell').nth(2)
Expected: "1"
Received: " 2"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('app-basket').locator('app-purchase-basket mat-row').filter({ hasText: 'Raspberry Juice (1000ml)' }).locator('mat-cell').nth(2) with timeout 5000ms
  - waiting for locator('app-basket').locator('app-purchase-basket mat-row').filter({ hasText: 'Raspberry Juice (1000ml)' }).locator('mat-cell').nth(2)
    14 × locator resolved to <mat-cell role="cell" _ngcontent-ng-c125060177="" class="mat-mdc-cell mdc-data-table__cell cdk-cell content-align cdk-column-quantity mat-column-quantity">…</mat-cell>
       - unexpected value " 2"

```

```yaml
- cell "2":
  - button
  - text: "2"
  - button
```

# Test source

```ts
  1  | import { test, expect } from './fixtures';
  2  | import { PRODUCTS } from '../data/test-data';
  3  | import { itemsTotal, price } from '../helpers/money';
  4  | 
  5  | test.describe('TC-03: Change the quantity and remove a product in the basket', () => {
  6  |   test('TC-03 plus, minus and trash buttons update the basket', async ({
  7  |     api,
  8  |     loginAsCustomer,
  9  |     basketPage,
  10 |     navBar,
  11 |   }) => {
  12 |     const a = PRODUCTS.raspberryJuice;
  13 |     const b = PRODUCTS.eggfruitJuice;
  14 |     await api.addToBasket(a.id, 1);
  15 |     await api.addToBasket(b.id, 1);
  16 |     await loginAsCustomer();
  17 | 
  18 |     const expectBasket = async (qtyA: number, qtyB: number) => {
> 19 |       await expect(basketPage.table.quantity(a.name)).toHaveText(String(qtyA));
     |                                                       ^ Error: expect(locator).toHaveText(expected) failed
  20 |       await expect(basketPage.table.quantity(b.name)).toHaveText(String(qtyB));
  21 |       const total = itemsTotal([
  22 |         { price: a.price, quantity: qtyA },
  23 |         { price: b.price, quantity: qtyB },
  24 |       ]);
  25 |       await expect(basketPage.totalPrice).toHaveText(`Total Price: ${price(total)}`);
  26 |       await expect(navBar.basketCounter).toHaveText(String(qtyA + qtyB));
  27 |     };
  28 | 
  29 |     await test.step('1. Open the basket', async () => {
  30 |       await basketPage.goto();
  31 |       await expect(basketPage.table.rows).toHaveCount(2);
  32 |       await expectBasket(1, 1);
  33 |     });
  34 | 
  35 |     await test.step('2. Click plus on product A', async () => {
  36 |       await basketPage.plusButton(a.name).click();
  37 |       await expectBasket(2, 1);
  38 |     });
  39 | 
  40 |     await test.step('3. Click minus on product A', async () => {
  41 |       await basketPage.minusButton(a.name).click();
  42 |       await expectBasket(1, 1);
  43 |     });
  44 | 
  45 |     await test.step('4. Click minus on product A again: the quantity stays 1', async () => {
  46 |       await basketPage.minusButton(a.name).click();
  47 |       // Wait for any basket update request to finish before reading the state.
  48 |       await basketPage.totalPrice.page().waitForLoadState('networkidle');
  49 |       await expect(basketPage.table.row(a.name)).toBeVisible();
  50 |       await expectBasket(1, 1);
  51 |     });
  52 | 
  53 |     await test.step('5. Click trash on product A', async () => {
  54 |       await basketPage.trashButton(a.name).click();
  55 |       await expect(basketPage.table.row(a.name)).toHaveCount(0);
  56 |       await expect(basketPage.table.rows).toHaveCount(1);
  57 |       await expect(basketPage.table.quantity(b.name)).toHaveText('1');
  58 |       await expect(basketPage.totalPrice).toHaveText(`Total Price: ${price(b.price)}`);
  59 |       await expect(navBar.basketCounter).toHaveText('1');
  60 |     });
  61 |   });
  62 | });
  63 | 
```