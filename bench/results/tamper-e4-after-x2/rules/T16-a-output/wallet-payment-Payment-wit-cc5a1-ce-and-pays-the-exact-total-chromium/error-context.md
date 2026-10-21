# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wallet-payment.spec.ts >> Payment with the wallet >> the wallet cannot pay a short balance and pays the exact total
- Location: tests/wallet-payment.spec.ts:11:7

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
  - menuitem "Go to user profile": tc-1792591567569-42a3e38d@example.test
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
  1   | import { expect, type Locator, type Page, type Request } from '@playwright/test';
  2   | import { totalPrice } from '@/tests/helpers/money';
  3   | import { ROUTES } from '@/utils/constants/routes';
  4   | import { DateHelper } from '@/utils/helpers/date-helper';
  5   | 
  6   | /** The shop hides a message after about 5 seconds. */
  7   | const MESSAGE_LIFETIME = DateHelper.secondsToMs(10);
  8   | 
  9   | /** The part of the `GET /rest/basket/:id` response that the tests read. */
  10  | interface BasketContent {
  11  |   data: { Products: { name: string }[] };
  12  | }
  13  | 
  14  | function isBasketContentRequest(request: Request): boolean {
  15  |   return request.method() === 'GET' && new URL(request.url()).pathname.startsWith(ROUTES.basket);
  16  | }
  17  | 
  18  | /** Closes the cookie banner if it is shown. The cookie alone does not hide it in this build. */
  19  | export async function dismissCookieBanner(page: Page): Promise<void> {
  20  |   const dismiss = page.getByRole('button', { name: 'dismiss cookie message' });
  21  |   if (await dismiss.isVisible()) {
  22  |     await dismiss.click();
  23  |   }
  24  | }
  25  | 
  26  | /** The top bar that is shown on every page of the shop. */
  27  | export class TopBar {
  28  |   constructor(private readonly page: Page) {}
  29  | 
  30  |   get accountButton() {
  31  |     return this.page.getByRole('button', { name: 'Show/hide account menu' });
  32  |   }
  33  | 
  34  |   get basketButton() {
  35  |     return this.page.locator('button', { hasText: 'Your Basket' });
  36  |   }
  37  | 
  38  |   get accountMenu() {
  39  |     return this.page.getByRole('menu').first();
  40  |   }
  41  | 
  42  |   async openAccountMenu(): Promise<void> {
  43  |     await this.accountButton.click();
  44  |     await expect(this.accountMenu).toBeVisible();
  45  |   }
  46  | 
  47  |   /** Account menu, then `Orders & Payment`, then the item, for example `Order History`. */
  48  |   async openOrdersAndPaymentItem(item: string): Promise<void> {
  49  |     await this.openAccountMenu();
  50  |     await this.accountMenu.getByRole('menuitem', { name: /Orders (&|and) Payment/ }).click();
  51  |     const menuItem = this.page.getByRole('menuitem').filter({ hasText: item });
> 52  |     await expect(menuItem).toBeVisible();
      |                            ^ Error: expect(locator).toBeVisible() failed
  53  |     await menuItem.click();
  54  |   }
  55  | 
  56  |   async openBasket(): Promise<void> {
  57  |     await this.basketButton.click();
  58  |     await expect(this.page).toHaveURL(/#\/basket/);
  59  |   }
  60  | 
  61  |   async expectBasketCounter(count: number): Promise<void> {
  62  |     await expect(this.basketButton).toHaveText(new RegExp(`Your Basket\\s*${count}\\s*$`));
  63  |   }
  64  | }
  65  | 
  66  | /** The product list `/#/search`. */
  67  | export class ProductListPage {
  68  |   constructor(private readonly page: Page) {}
  69  | 
  70  |   async goto(): Promise<void> {
  71  |     await this.page.goto('/#/search');
  72  |     await expect(this.page).toHaveURL(/#\/search/);
  73  |     await dismissCookieBanner(this.page);
  74  |   }
  75  | 
  76  |   /** Opens the product list filtered by a search term. Only the first page of the list is shown without it. */
  77  |   async search(term: string): Promise<void> {
  78  |     await this.page.goto(`/#/search?q=${encodeURIComponent(term)}`);
  79  |     await expect(this.page).toHaveURL(/#\/search/);
  80  |     await dismissCookieBanner(this.page);
  81  |   }
  82  | 
  83  |   productTile(name: string) {
  84  |     return this.page.locator('article').filter({ has: this.page.getByText(name, { exact: true }) });
  85  |   }
  86  | 
  87  |   /** Clicks `Add to Basket` on the product without checking the result. */
  88  |   async clickAddToBasket(name: string): Promise<void> {
  89  |     await this.productTile(name).getByRole('button', { name: 'Add to Basket' }).click();
  90  |   }
  91  | 
  92  |   /** Clicks `Add to Basket` and waits for the message that the product was placed into the basket. */
  93  |   async addToBasket(name: string): Promise<void> {
  94  |     await this.clickAddToBasket(name);
  95  |     await this.expectMessage(`Placed ${name} into basket.`);
  96  |   }
  97  | 
  98  |   /** Clicks `Add to Basket` on a product that is already in the basket and waits for the message about one more item. */
  99  |   async addOneMoreToBasket(name: string): Promise<void> {
  100 |     await this.clickAddToBasket(name);
  101 |     await this.expectMessage(`Added another ${name} to basket.`);
  102 |   }
  103 | 
  104 |   async expectProductTile(name: string, price: string): Promise<void> {
  105 |     const tile = this.productTile(name);
  106 |     await expect(tile).toBeVisible();
  107 |     await expect(tile).toContainText(price);
  108 |     await expect(tile.getByRole('button', { name: 'Add to Basket' })).toBeVisible();
  109 |   }
  110 | 
  111 |   async expectMessage(text: string): Promise<void> {
  112 |     await expect(this.page.getByText(text).first()).toBeVisible();
  113 |   }
  114 | 
  115 |   /** Waits until the message is gone, for example a message that is left from a previous step. */
  116 |   async expectNoMessage(text: string): Promise<void> {
  117 |     await expect(this.page.getByText(text)).toHaveCount(0, { timeout: MESSAGE_LIFETIME });
  118 |   }
  119 | }
  120 | 
  121 | /** The basket `/#/basket`. */
  122 | export class BasketPage {
  123 |   constructor(private readonly page: Page) {}
  124 | 
  125 |   row(name: string) {
  126 |     return this.page.getByRole('row').filter({ hasText: name });
  127 |   }
  128 | 
  129 |   /** The quantity cell is the third cell: minus button, quantity, plus button. */
  130 |   private quantityCell(name: string) {
  131 |     return this.row(name).getByRole('cell').nth(2);
  132 |   }
  133 | 
  134 |   increase(name: string) {
  135 |     return this.quantityCell(name).getByRole('button').last();
  136 |   }
  137 | 
  138 |   decrease(name: string) {
  139 |     return this.quantityCell(name).getByRole('button').first();
  140 |   }
  141 | 
  142 |   /** The trash button is in the last cell of the row. */
  143 |   remove(name: string) {
  144 |     return this.row(name).getByRole('cell').last().getByRole('button');
  145 |   }
  146 | 
  147 |   get checkoutButton() {
  148 |     return this.page.locator('button', { hasText: 'Checkout' });
  149 |   }
  150 | 
  151 |   /** Rows with cells. The table also has an empty row without cells. */
  152 |   get productRows() {
```