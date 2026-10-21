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

Locator: getByText('Thank you for your purchase!')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Thank you for your purchase!') with timeout 5000ms
  - waiting for getByText('Thank you for your purchase!')

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
- heading "MUT" [level=1]
- text: Your order has been placed and is being processed. You can check for status updates on our
- link "Track Orders":
  - /url: "#/track-result/new?id=b25c-767ee73ea2f5896a"
- text: page. Your order will be delivered in 1 days. Delivery Address Test Customer 1 Khreshchatyk Street, Kyiv, Kyiv, 01001 Ukraine Phone Number 501234567 Order Summary
- link "Tweet":
  - /url: https://twitter.com/intent/tweet?text=I just purchased%0a- Eggfruit Juice (500ml)%0a- Carrot Juice (1000ml)%0afrom @owasp_juiceshop&hashtags=security
- button "Print order confirmation"
- table:
  - row "Product Price Quantity Total Price":
    - columnheader "Product"
    - columnheader "Price"
    - columnheader "Quantity"
    - columnheader "Total Price"
  - row "Eggfruit Juice (500ml) 8.99¤ 2 17.98¤":
    - cell "Eggfruit Juice (500ml)"
    - cell "8.99¤"
    - cell "2"
    - cell "17.98¤"
  - row "Carrot Juice (1000ml) 2.99¤ 1 2.99¤":
    - cell "Carrot Juice (1000ml)"
    - cell "2.99¤"
    - cell "1"
    - cell "2.99¤"
  - row "Items Delivery Promotion Total Price 20.97¤ 0.99¤ 2.10¤ 19.86¤":
    - cell
    - cell
    - cell "Items Delivery Promotion Total Price":
      - table:
        - row "Items":
          - cell "Items"
        - row "Delivery":
          - cell "Delivery"
        - row "Promotion":
          - cell "Promotion"
        - row "Total Price":
          - cell "Total Price"
    - cell "20.97¤ 0.99¤ 2.10¤ 19.86¤":
      - table:
        - row "20.97¤":
          - cell "20.97¤"
        - row "0.99¤":
          - cell "0.99¤"
        - row "2.10¤":
          - cell "2.10¤"
        - row "19.86¤":
          - cell "19.86¤"
- text: You have gained 2 Bonus Points from this order!
```

# Test source

```ts
  81  | 
  82  |   async redeemCoupon(code: string): Promise<void> {
  83  |     await this.couponPanel.click();
  84  |     await this.couponField.fill(code);
  85  |     await this.redeemButton.click();
  86  |   }
  87  | 
  88  |   savedCard() {
  89  |     return this.page.getByRole('row').filter({ hasText: SAVED_CARD_MASKED });
  90  |   }
  91  | 
  92  |   async selectSavedCard(): Promise<void> {
  93  |     await this.savedCard().getByRole('radio').click();
  94  |   }
  95  | 
  96  |   async continue(): Promise<void> {
  97  |     await this.page.locator('button', { hasText: 'Continue' }).click();
  98  |   }
  99  | 
  100 |   walletPayButton(total: string) {
  101 |     return this.page.getByRole('button', { name: `Pay ${total}` });
  102 |   }
  103 | 
  104 |   async expectWalletBalance(balance: string): Promise<void> {
  105 |     await expect(this.page.getByText(new RegExp(`^Wallet Balance\\s*${escapeRegExp(balance)}$`))).toBeVisible();
  106 |   }
  107 | }
  108 | 
  109 | /** The page `Order Summary` of the checkout. */
  110 | export class OrderSummaryPage {
  111 |   constructor(private readonly page: Page) {}
  112 | 
  113 |   async expectOpen(): Promise<void> {
  114 |     await expect(this.page).toHaveURL(/#\/order-summary/);
  115 |     await expect(this.page.getByText('Order Summary', { exact: true })).toBeVisible();
  116 |   }
  117 | 
  118 |   /** A small card with a title, for example `Delivery Address`. The page frame is also a card, it holds the small cards. */
  119 |   private infoCard(title: string) {
  120 |     return this.page
  121 |       .locator('mat-card')
  122 |       .filter({ has: this.page.getByText(title, { exact: true }) })
  123 |       .filter({ hasNot: this.page.locator('mat-card') });
  124 |   }
  125 | 
  126 |   async expectSavedAddress(): Promise<void> {
  127 |     const card = this.infoCard('Delivery Address');
  128 |     await expect(card).toContainText(SAVED_ADDRESS.name);
  129 |     await expect(card).toContainText(
  130 |       `${SAVED_ADDRESS.address}, ${SAVED_ADDRESS.city}, ${SAVED_ADDRESS.state}, ${SAVED_ADDRESS.zip}`,
  131 |     );
  132 |     await expect(card).toContainText(SAVED_ADDRESS.country);
  133 |     await expect(card).toContainText(SAVED_ADDRESS.mobileNumber);
  134 |   }
  135 | 
  136 |   async expectSavedCard(): Promise<void> {
  137 |     const card = this.infoCard('Payment Method');
  138 |     await expect(card).toContainText(new RegExp(`Card ending in\\s*${SAVED_CARD_LAST_DIGITS}`));
  139 |     await expect(card).toContainText(SAVED_CARD.name);
  140 |   }
  141 | 
  142 |   /** A line of the summary table, for example `Items`. The footer row is not a line. */
  143 |   line(label: string) {
  144 |     return this.page.locator('tr.mat-row').filter({ has: this.page.getByRole('cell', { name: label, exact: true }) });
  145 |   }
  146 | 
  147 |   async expectLine(label: string, value: string): Promise<void> {
  148 |     await expect(this.line(label)).toContainText(price(value));
  149 |   }
  150 | 
  151 |   async expectTotals(items: string, delivery: string, promotion: string, total: string): Promise<void> {
  152 |     await this.expectLine('Items', items);
  153 |     await this.expectLine('Delivery', delivery);
  154 |     await this.expectLine('Promotion', promotion);
  155 |     await this.expectLine('Total Price', total);
  156 |   }
  157 | 
  158 |   async placeOrder(): Promise<void> {
  159 |     await this.page.locator('button', { hasText: 'Place your order and pay' }).click();
  160 |   }
  161 | }
  162 | 
  163 | /** Totals on the confirmation page. There the labels and values sit in one nested table. */
  164 | export class ConfirmationTotals {
  165 |   constructor(private readonly page: Page) {}
  166 | 
  167 |   async expectTotals(items: string, delivery: string, promotion: string, total: string): Promise<void> {
  168 |     const values = [items, delivery, promotion, total].map(escapeRegExp).join('\\s*');
  169 |     // The outer row is the one that contains the nested table with the labels.
  170 |     const totals = this.page.getByRole('row').filter({ has: this.page.locator('table') });
  171 |     await expect(totals).toContainText(new RegExp(`Items\\s*Delivery\\s*Promotion\\s*Total Price\\s*${values}`));
  172 |   }
  173 | }
  174 | 
  175 | /** The confirmation page `/#/order-completion/<order ID>`. */
  176 | export class OrderCompletionPage {
  177 |   constructor(private readonly page: Page) {}
  178 | 
  179 |   async expectOpen(): Promise<string> {
  180 |     await expect(this.page).toHaveURL(/#\/order-completion\/.+/);
> 181 |     await expect(this.page.getByText('Thank you for your purchase!')).toBeVisible();
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
  182 |     const match = /#\/order-completion\/([^/?#]+)/.exec(this.page.url());
  183 |     if (!match) {
  184 |       throw new Error(`No order ID in URL: ${this.page.url()}`);
  185 |     }
  186 |     return decodeURIComponent(match[1]);
  187 |   }
  188 | 
  189 |   /** The product row has the cells: product, price, quantity, total price. */
  190 |   async expectProduct(name: string, quantity: number, unitPrice: string): Promise<void> {
  191 |     const cells = this.page.getByRole('row').filter({ hasText: name }).getByRole('cell');
  192 |     await expect(cells.nth(1)).toHaveText(unitPrice);
  193 |     await expect(cells.nth(2)).toHaveText(String(quantity));
  194 |   }
  195 | }
  196 | 
```