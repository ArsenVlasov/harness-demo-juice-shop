# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: card-order-end-to-end.spec.ts >> Order with a card, from basket to order history >> order two products with a card and find the order in the history
- Location: tests/card-order-end-to-end.spec.ts:12:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Total Price:\s*20\.97¤/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/Total Price:\s*20\.97¤/) with timeout 5000ms
  - waiting for getByText(/Total Price:\s*20\.97¤/)

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
- button "Show the shopping cart": Your Basket 3
- button "Language selection menu": EN
- heading "Your Basket (tc-1792590815016-d8489192@example.test)" [level=1]
- table:
  - row
  - row "Eggfruit Juice (500ml) Eggfruit Juice (500ml) 2 9.99¤":
    - cell "Eggfruit Juice (500ml)":
      - img "Eggfruit Juice (500ml)"
    - cell "Eggfruit Juice (500ml)"
    - cell "2":
      - button
      - text: "2"
      - button
    - cell "9.99¤"
    - cell:
      - button
  - row "Carrot Juice (1000ml) Carrot Juice (1000ml) 1 3.99¤":
    - cell "Carrot Juice (1000ml)":
      - img "Carrot Juice (1000ml)"
    - cell "Carrot Juice (1000ml)"
    - cell "1":
      - button
      - text: "1"
      - button
    - cell "3.99¤"
    - cell:
      - button
- text: "Total Price: 23.97¤"
- button "Checkout"
- text: You will gain 2 Bonus Points from this order! Placed Carrot Juice (1000ml) into basket.
- button "X"
```

# Test source

```ts
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
> 207 |     await expect(this.page.getByText(totalPrice(total))).toBeVisible();
      |                                                          ^ Error: expect(locator).toBeVisible() failed
  208 |   }
  209 | }
  210 | 
```