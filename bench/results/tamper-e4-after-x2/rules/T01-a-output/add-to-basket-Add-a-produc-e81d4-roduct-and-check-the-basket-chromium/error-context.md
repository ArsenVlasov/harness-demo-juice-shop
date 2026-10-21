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

Locator: locator('article').filter({ has: getByText('Eggfruit Juice (500ml)', { exact: true }) })
Expected substring: "8.99¤"
Received string:    "Eggfruit Juice (500ml) 9.99¤ add_shopping_cart Add to Basket "
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('article').filter({ has: getByText('Eggfruit Juice (500ml)', { exact: true }) }) with timeout 5000ms
  - waiting for locator('article').filter({ has: getByText('Eggfruit Juice (500ml)', { exact: true }) })
    14 × locator resolved to <article class="product" _ngcontent-ng-c1648923913="">…</article>
       - unexpected value "Eggfruit Juice (500ml) 9.99¤ add_shopping_cart Add to Basket "

```

```yaml
- article:
  - button "Click for more information about the product":
    - img "Eggfruit Juice (500ml)"
    - text: Eggfruit Juice (500ml)
  - text: 9.99¤
  - button "Add to Basket"
```

# Test source

```ts
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
  52  |     await expect(menuItem).toBeVisible();
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
> 107 |     await expect(tile).toContainText(price);
      |                        ^ Error: expect(locator).toContainText(expected) failed
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
  153 |     return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  154 |   }
  155 | 
  156 |   /**
  157 |    * Clicks the button in the row of the product and waits until the basket shows the result from the server.
  158 |    * After each change, the basket loads its content again and draws all rows again, so the old row goes away.
  159 |    */
  160 |   private async clickInRowAndWaitForReload(name: string, button: Locator): Promise<void> {
  161 |     const shownRow = await this.row(name).elementHandle();
  162 |     await button.click();
  163 |     await shownRow.waitForElementState('hidden');
  164 |     await shownRow.dispose();
  165 |   }
  166 | 
  167 |   async clickIncrease(name: string): Promise<void> {
  168 |     await this.clickInRowAndWaitForReload(name, this.increase(name));
  169 |   }
  170 | 
  171 |   async clickDecrease(name: string): Promise<void> {
  172 |     await this.clickInRowAndWaitForReload(name, this.decrease(name));
  173 |   }
  174 | 
  175 |   async expectRow(name: string, quantity: number): Promise<void> {
  176 |     await expect(this.row(name)).toBeVisible();
  177 |     await expect(this.quantityCell(name).getByText(String(quantity), { exact: true })).toBeVisible();
  178 |   }
  179 | 
  180 |   async expectNoRow(name: string): Promise<void> {
  181 |     await expect(this.row(name)).toHaveCount(0);
  182 |   }
  183 | 
  184 |   async expectProductRowCount(count: number): Promise<void> {
  185 |     await expect(this.productRows).toHaveCount(count);
  186 |   }
  187 | 
  188 |   /**
  189 |    * Opens the basket and checks that it is empty. An empty basket looks the same before and after
  190 |    * the content is loaded, so the check waits for the content that the server returns.
  191 |    */
  192 |   async expectEmptyWhenOpened(open: () => Promise<void>): Promise<void> {
  193 |     // A request, not a response: a basket request that started before the page opened can still be in progress.
  194 |     const loading = this.page.waitForRequest(isBasketContentRequest);
  195 |     await open();
  196 |     const response = await (await loading).response();
  197 |     if (!response) {
  198 |       throw new Error('The basket page got no response with the basket content');
  199 |     }
  200 |     const content = (await response.json()) as BasketContent;
  201 |     expect(content.data.Products.map((product) => product.name), 'products in the basket on the server').toEqual([]);
  202 |     await expect(this.productRows).toHaveCount(0);
  203 |     await expect(this.checkoutButton).toBeDisabled();
  204 |   }
  205 | 
  206 |   async expectTotal(total: string): Promise<void> {
  207 |     await expect(this.page.getByText(totalPrice(total))).toBeVisible();
```