# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-04-purchase-limit.spec.ts >> TC-04: Purchase limit for one product >> TC-04 basket holds at most the limit of a limited product
- Location: tests/tc-04-purchase-limit.spec.ts:6:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.mdc-snackbar__label').filter({ hasText: 'You can order only up to 5 items of this product.' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.mdc-snackbar__label').filter({ hasText: 'You can order only up to 5 items of this product.' }) with timeout 5000ms
  - waiting for locator('.mdc-snackbar__label').filter({ hasText: 'You can order only up to 5 items of this product.' })

```

```yaml
- button "Open Sidenav"
- button "Back to homepage":
  - img "OWASP Juice Shop"
  - text: OWASP Juice Shop
- button "Open search"
- textbox
- button "Close search"
- button "Show/hide account menu": Account
- button "Show the shopping cart": Your Basket 5
- button "Language selection menu": EN
- heading "Your Basket (tc-04-1792593783549-44l1or@example.test)" [level=1]
- table:
  - row
  - row "Apple Juice (1000ml) Apple Juice (1000ml) 5 1.99¤":
    - cell "Apple Juice (1000ml)":
      - img "Apple Juice (1000ml)"
    - cell "Apple Juice (1000ml)"
    - cell "5":
      - button
      - text: "5"
      - button
    - cell "1.99¤"
    - cell:
      - button
- text: "Total Price: 9.95¤"
- button "Checkout"
- text: You will gain 0 Bonus Points from this order! MUT
- button "X"
```

# Test source

```ts
  1  | import { test, expect } from './fixtures';
  2  | import { PRODUCTS, PURCHASE_LIMIT } from '../data/test-data';
  3  | import { itemsTotal, price } from '../helpers/money';
  4  | 
  5  | test.describe('TC-04: Purchase limit for one product', () => {
  6  |   test('TC-04 basket holds at most the limit of a limited product', async ({
  7  |     loginAsCustomer,
  8  |     searchPage,
  9  |     basketPage,
  10 |     navBar,
  11 |   }) => {
  12 |     const product = PRODUCTS.appleJuice;
  13 |     const limitMessage = `You can order only up to ${PURCHASE_LIMIT} items of this product.`;
  14 |     const totalFor = (quantity: number) => `Total Price: ${price(itemsTotal([{ price: product.price, quantity }]))}`;
  15 |     await loginAsCustomer();
  16 | 
  17 |     await test.step('1. Add the product from the product list', async () => {
  18 |       await searchPage.goto();
  19 |       await searchPage.addToBasket(product.name);
  20 |       await expect(searchPage.snackBar.message(`Placed ${product.name} into basket.`)).toBeVisible();
  21 |       await expect(navBar.basketCounter).toHaveText('1');
  22 |     });
  23 | 
  24 |     await test.step(`2. Click plus until the quantity is ${PURCHASE_LIMIT}`, async () => {
  25 |       await basketPage.goto();
  26 |       for (let quantity = 2; quantity <= PURCHASE_LIMIT; quantity++) {
  27 |         await basketPage.plusButton(product.name).click();
  28 |         await expect(basketPage.table.quantity(product.name)).toHaveText(String(quantity));
  29 |       }
  30 |       await expect(basketPage.totalPrice).toHaveText(totalFor(PURCHASE_LIMIT));
  31 |       await expect(basketPage.snackBar.message(limitMessage)).toHaveCount(0);
  32 |     });
  33 | 
  34 |     await test.step('3. Click plus one more time', async () => {
  35 |       await basketPage.plusButton(product.name).click();
> 36 |       await expect(basketPage.snackBar.message(limitMessage)).toBeVisible();
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  37 |     });
  38 | 
  39 |     await test.step('4. Read the basket', async () => {
  40 |       await expect(basketPage.table.quantity(product.name)).toHaveText(String(PURCHASE_LIMIT));
  41 |       await expect(basketPage.totalPrice).toHaveText(totalFor(PURCHASE_LIMIT));
  42 |       await expect(navBar.basketCounter).toHaveText(String(PURCHASE_LIMIT));
  43 |     });
  44 | 
  45 |     await test.step('5. Add the product again from the product list', async () => {
  46 |       await searchPage.goto();
  47 |       await searchPage.snackBar.dismissAll();
  48 |       await searchPage.addToBasket(product.name);
  49 |       await expect(searchPage.snackBar.message(limitMessage)).toBeVisible();
  50 |       await expect(navBar.basketCounter).toHaveText(String(PURCHASE_LIMIT));
  51 |     });
  52 |   });
  53 | });
  54 | 
```