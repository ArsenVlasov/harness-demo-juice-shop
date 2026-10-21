# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-08-wallet-payment.spec.ts >> TC-08: Payment with the wallet >> the wallet cannot pay a short balance and pays the exact total
- Location: tests/tc-08-wallet-payment.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('menuitem').filter({ hasText: 'Digital Wallet' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('menuitem').filter({ hasText: 'Digital Wallet' }) with timeout 5000ms
  - waiting for getByRole('menuitem').filter({ hasText: 'Digital Wallet' })

```

```yaml
- button "Open Sidenav"
- button "Back to homepage":
  - img "OWASP Juice Shop"
  - text: OWASP Juice Shop
- button "Open search"
- textbox
- button "Close search"
- button "Show/hide account menu" [expanded]: Account
- button "Show the shopping cart": Your Basket 1
- button "Language selection menu": EN
- text: Order History
- img "No results found"
- text: No results found You have not placed any orders yet.
- menu:
  - menuitem "Go to user profile": tc-1792583055315-b34376db@example.test
  - menuitem "Show Orders and Payment Menu" [expanded]: Orders & Payment
  - menuitem "Show Privacy and Security Menu": Privacy & Security
  - menuitem "Logout"
- menu:
  - menuitem "Go to order history page": Order History
  - menuitem "Go to recycling page": Recycle
  - separator
  - menuitem "Go to saved address page": My saved addresses
  - menuitem "Go to saved payment methods page": My Payment Options
  - menuitem "Go to wallet page": MUT
```

# Test source

```ts
  1   | import { expect, type Page } from '@playwright/test';
  2   | import { totalPrice } from '../helpers/money';
  3   | 
  4   | /** Closes the cookie banner if it is shown. The cookie alone does not hide it in this build. */
  5   | export async function dismissCookieBanner(page: Page): Promise<void> {
  6   |   const dismiss = page.getByRole('button', { name: 'dismiss cookie message' });
  7   |   if (await dismiss.isVisible()) {
  8   |     await dismiss.click();
  9   |   }
  10  | }
  11  | 
  12  | /** The top bar that is shown on every page of the shop. */
  13  | export class TopBar {
  14  |   constructor(private readonly page: Page) {}
  15  | 
  16  |   get accountButton() {
  17  |     return this.page.getByRole('button', { name: 'Show/hide account menu' });
  18  |   }
  19  | 
  20  |   get basketButton() {
  21  |     return this.page.locator('button', { hasText: 'Your Basket' });
  22  |   }
  23  | 
  24  |   get accountMenu() {
  25  |     return this.page.getByRole('menu').first();
  26  |   }
  27  | 
  28  |   async openAccountMenu(): Promise<void> {
  29  |     await this.accountButton.click();
  30  |     await expect(this.accountMenu).toBeVisible();
  31  |   }
  32  | 
  33  |   /** Account menu, then `Orders & Payment`, then the item, for example `Order History`. */
  34  |   async openOrdersAndPaymentItem(item: string): Promise<void> {
  35  |     await this.openAccountMenu();
  36  |     await this.accountMenu.getByRole('menuitem', { name: /Orders (&|and) Payment/ }).click();
  37  |     const menuItem = this.page.getByRole('menuitem').filter({ hasText: item });
> 38  |     await expect(menuItem).toBeVisible();
      |                            ^ Error: expect(locator).toBeVisible() failed
  39  |     await menuItem.click();
  40  |   }
  41  | 
  42  |   async openBasket(): Promise<void> {
  43  |     await this.basketButton.click();
  44  |     await expect(this.page).toHaveURL(/#\/basket/);
  45  |   }
  46  | 
  47  |   async expectBasketCounter(count: number): Promise<void> {
  48  |     await expect(this.basketButton).toHaveText(new RegExp(`Your Basket\\s*${count}\\s*$`));
  49  |   }
  50  | }
  51  | 
  52  | /** The product list `/#/search`. */
  53  | export class ProductListPage {
  54  |   constructor(private readonly page: Page) {}
  55  | 
  56  |   async goto(): Promise<void> {
  57  |     await this.page.goto('/#/search');
  58  |     await expect(this.page).toHaveURL(/#\/search/);
  59  |     await dismissCookieBanner(this.page);
  60  |   }
  61  | 
  62  |   /** Opens the product list filtered by a search term. Only the first page of the list is shown without it. */
  63  |   async search(term: string): Promise<void> {
  64  |     await this.page.goto(`/#/search?q=${encodeURIComponent(term)}`);
  65  |     await expect(this.page).toHaveURL(/#\/search/);
  66  |     await dismissCookieBanner(this.page);
  67  |   }
  68  | 
  69  |   productTile(name: string) {
  70  |     return this.page.locator('article').filter({ has: this.page.getByText(name, { exact: true }) });
  71  |   }
  72  | 
  73  |   /** Clicks `Add to Basket` on the product without checking the result. */
  74  |   async clickAddToBasket(name: string): Promise<void> {
  75  |     await this.productTile(name).getByRole('button', { name: 'Add to Basket' }).click();
  76  |   }
  77  | 
  78  |   /** Clicks `Add to Basket` and waits for the message that the product was placed into the basket. */
  79  |   async addToBasket(name: string): Promise<void> {
  80  |     await this.clickAddToBasket(name);
  81  |     await this.expectMessage(`Placed ${name} into basket.`);
  82  |   }
  83  | 
  84  |   async expectProductTile(name: string, price: string): Promise<void> {
  85  |     const tile = this.productTile(name);
  86  |     await expect(tile).toBeVisible();
  87  |     await expect(tile).toContainText(price);
  88  |     await expect(tile.getByRole('button', { name: 'Add to Basket' })).toBeVisible();
  89  |   }
  90  | 
  91  |   async expectMessage(text: string): Promise<void> {
  92  |     await expect(this.page.getByText(text).first()).toBeVisible();
  93  |   }
  94  | }
  95  | 
  96  | /** The basket `/#/basket`. */
  97  | export class BasketPage {
  98  |   constructor(private readonly page: Page) {}
  99  | 
  100 |   row(name: string) {
  101 |     return this.page.getByRole('row').filter({ hasText: name });
  102 |   }
  103 | 
  104 |   /** The quantity cell is the third cell: minus button, quantity, plus button. */
  105 |   private quantityCell(name: string) {
  106 |     return this.row(name).getByRole('cell').nth(2);
  107 |   }
  108 | 
  109 |   increase(name: string) {
  110 |     return this.quantityCell(name).getByRole('button').last();
  111 |   }
  112 | 
  113 |   decrease(name: string) {
  114 |     return this.quantityCell(name).getByRole('button').first();
  115 |   }
  116 | 
  117 |   /** The trash button is in the last cell of the row. */
  118 |   remove(name: string) {
  119 |     return this.row(name).getByRole('cell').last().getByRole('button');
  120 |   }
  121 | 
  122 |   get checkoutButton() {
  123 |     return this.page.locator('button', { hasText: 'Checkout' });
  124 |   }
  125 | 
  126 |   async expectRow(name: string, quantity: number): Promise<void> {
  127 |     await expect(this.row(name)).toBeVisible();
  128 |     await expect(this.quantityCell(name).getByText(String(quantity), { exact: true })).toBeVisible();
  129 |   }
  130 | 
  131 |   async expectNoRow(name: string): Promise<void> {
  132 |     await expect(this.row(name)).toHaveCount(0);
  133 |   }
  134 | 
  135 |   async expectTotal(total: string): Promise<void> {
  136 |     await expect(this.page.getByText(totalPrice(total))).toBeVisible();
  137 |   }
  138 | }
```