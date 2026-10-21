# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-07-card-order-end-to-end.spec.ts >> TC-07: Order with a card, from basket to order history >> order two products with a card and find the order in the history
- Location: tests/tc-07-card-order-end-to-end.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('b088-6efd0e270417cabd').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('b088-6efd0e270417cabd').first() with timeout 5000ms
  - waiting for getByText('b088-6efd0e270417cabd').first()

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
- button "Show the shopping cart": Your Basket 0
- button "Language selection menu": EN
- text: "Order History Order ID #MUT Total Price 19.86¤ Bonus 2 In Transit"
- button "Track Your Order"
- button "Print order confirmation"
- table:
  - row "Product Price Quantity Total Price":
    - columnheader "Product"
    - columnheader "Price"
    - columnheader "Quantity"
    - columnheader "Total Price"
    - columnheader
  - row "Eggfruit Juice (500ml) 8.99¤ 2 17.98¤ Print order confirmation":
    - cell "Eggfruit Juice (500ml)"
    - cell "8.99¤"
    - cell "2"
    - cell "17.98¤"
    - cell "Print order confirmation":
      - button "Print order confirmation"
  - row "Carrot Juice (1000ml) 2.99¤ 1 2.99¤ Print order confirmation":
    - cell "Carrot Juice (1000ml)"
    - cell "2.99¤"
    - cell "1"
    - cell "2.99¤"
    - cell "Print order confirmation":
      - button "Print order confirmation"
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  | import { escapeRegExp, price } from '../helpers/money';
  3  | 
  4  | /** The page `Order History`, opened from the account menu. */
  5  | export class OrderHistoryPage {
  6  |   constructor(private readonly page: Page) {}
  7  | 
  8  |   async expectOpen(): Promise<void> {
  9  |     await expect(this.page).toHaveURL(/#\/order-history/);
  10 |   }
  11 | 
  12 |   async expectEmpty(): Promise<void> {
  13 |     await this.expectOpen();
  14 |     await expect(this.page.getByText('You have not placed any orders yet.')).toBeVisible();
  15 |   }
  16 | 
  17 |   /** Each order card has one `Track Your Order` button. */
  18 |   async expectOrderCount(count: number): Promise<void> {
  19 |     await expect(this.page.getByRole('button', { name: 'Track Your Order' })).toHaveCount(count);
  20 |   }
  21 | 
  22 |   /** The order card shows the order ID and the total price. */
  23 |   async expectOrder(orderId: string, total: string): Promise<void> {
  24 |     await this.expectOpen();
> 25 |     await expect(this.page.getByText(orderId).first()).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  26 |     await expect(this.page.locator('body')).toContainText(new RegExp(`Total Price\\s*${escapeRegExp(total)}`));
  27 |   }
  28 | 
  29 |   /** The product row shows the name, the quantity and the price of the product. */
  30 |   async expectProduct(name: string, quantity: number, unitPrice: string): Promise<void> {
  31 |     const row = this.page.getByRole('row').filter({ hasText: name });
  32 |     await expect(row).toContainText(price(unitPrice));
  33 |     await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
  34 |   }
  35 | }
  36 | 
  37 | /** The page `Digital Wallet`, opened from the account menu. */
  38 | export class WalletPage {
  39 |   constructor(private readonly page: Page) {}
  40 | 
  41 |   async expectBalance(balance: string): Promise<void> {
  42 |     await expect(this.page.getByText(new RegExp(`Wallet Balance\\s*${escapeRegExp(balance)}\\b`))).toBeVisible();
  43 |   }
  44 | }
  45 | 
```