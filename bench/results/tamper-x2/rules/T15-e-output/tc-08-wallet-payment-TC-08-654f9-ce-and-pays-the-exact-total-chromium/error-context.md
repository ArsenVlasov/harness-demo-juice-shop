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
  - /url: "#/track-result/new?id=3023-cc574ca052b06f16"
- text: page. Your order will be delivered in 5 days. Delivery Address Test Customer 1 Khreshchatyk Street, Kyiv, Kyiv, 01001 Ukraine Phone Number 501234567 Order Summary
- link "Tweet":
  - /url: https://twitter.com/intent/tweet?text=I just purchased%0a- Eggfruit Juice (500ml)%0afrom @owasp_juiceshop&hashtags=security
- button "Print order confirmation"
- table:
  - row "Product Price Quantity Total Price":
    - columnheader "Product"
    - columnheader "Price"
    - columnheader "Quantity"
    - columnheader "Total Price"
  - row "Eggfruit Juice (500ml) 8.99¤ 1 8.99¤":
    - cell "Eggfruit Juice (500ml)"
    - cell "8.99¤"
    - cell "1"
    - cell "8.99¤"
  - row "Items Delivery Promotion Total Price 8.99¤ 0.00¤ 0.00¤ 8.99¤":
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
    - cell "8.99¤ 0.00¤ 0.00¤ 8.99¤":
      - table:
        - row "8.99¤":
          - cell "8.99¤"
        - row "0.00¤":
          - cell "0.00¤"
        - row "0.00¤":
          - cell "0.00¤"
        - row "8.99¤":
          - cell "8.99¤"
- text: You have gained 1 Bonus Points from this order!
```

# Test source

```ts
  50  |     await this.option(name).getByRole('radio').click();
  51  |   }
  52  | 
  53  |   async continue(): Promise<void> {
  54  |     await this.page.locator('button', { hasText: 'Continue' }).click();
  55  |   }
  56  | }
  57  | 
  58  | /** The page `My Payment Options` of the checkout. */
  59  | export class PaymentPage {
  60  |   constructor(private readonly page: Page) {}
  61  | 
  62  |   async expectOpen(): Promise<void> {
  63  |     await expect(this.page).toHaveURL(/#\/payment\/shop/);
  64  |     await expect(this.page.getByRole('heading', { name: 'My Payment Options' })).toBeVisible();
  65  |   }
  66  | 
  67  |   get couponPanel() {
  68  |     return this.page.getByRole('button', { name: /^Add a coupon/ });
  69  |   }
  70  | 
  71  |   get couponField() {
  72  |     return this.page.getByRole('textbox', { name: /coupon/i });
  73  |   }
  74  | 
  75  |   get redeemButton() {
  76  |     return this.page.locator('button', { hasText: 'Redeem' });
  77  |   }
  78  | 
  79  |   async redeemCoupon(code: string): Promise<void> {
  80  |     await this.couponPanel.click();
  81  |     await this.couponField.fill(code);
  82  |     await this.redeemButton.click();
  83  |   }
  84  | 
  85  |   savedCard() {
  86  |     return this.page.getByRole('row').filter({ hasText: SAVED_CARD_MASKED });
  87  |   }
  88  | 
  89  |   async selectSavedCard(): Promise<void> {
  90  |     await this.savedCard().getByRole('radio').click();
  91  |   }
  92  | 
  93  |   async continue(): Promise<void> {
  94  |     await this.page.locator('button', { hasText: 'Continue' }).click();
  95  |   }
  96  | 
  97  |   walletPayButton(total: string) {
  98  |     return this.page.getByRole('button', { name: `Pay ${total}` });
  99  |   }
  100 | }
  101 | 
  102 | /** The page `Order Summary` of the checkout. */
  103 | export class OrderSummaryPage {
  104 |   constructor(private readonly page: Page) {}
  105 | 
  106 |   async expectOpen(): Promise<void> {
  107 |     await expect(this.page).toHaveURL(/#\/order-summary/);
  108 |     await expect(this.page.getByText('Order Summary', { exact: true })).toBeVisible();
  109 |   }
  110 | 
  111 |   /** A line of the summary table, for example `Items`. The footer row is not a line. */
  112 |   line(label: string) {
  113 |     return this.page.locator('tr.mat-row').filter({ has: this.page.getByRole('cell', { name: label, exact: true }) });
  114 |   }
  115 | 
  116 |   async expectLine(label: string, value: string): Promise<void> {
  117 |     await expect(this.line(label)).toContainText(price(value));
  118 |   }
  119 | 
  120 |   async expectTotals(items: string, delivery: string, promotion: string, total: string): Promise<void> {
  121 |     await this.expectLine('Items', items);
  122 |     await this.expectLine('Delivery', delivery);
  123 |     await this.expectLine('Promotion', promotion);
  124 |     await this.expectLine('Total Price', total);
  125 |   }
  126 | 
  127 |   async placeOrder(): Promise<void> {
  128 |     await this.page.locator('button', { hasText: 'Place your order and pay' }).click();
  129 |   }
  130 | }
  131 | 
  132 | /** Totals on the confirmation page. There the labels and values sit in one nested table. */
  133 | export class ConfirmationTotals {
  134 |   constructor(private readonly page: Page) {}
  135 | 
  136 |   async expectTotals(items: string, delivery: string, promotion: string, total: string): Promise<void> {
  137 |     const values = [items, delivery, promotion, total].map(escapeRegExp).join('\\s*');
  138 |     // The outer row is the one that contains the nested table with the labels.
  139 |     const totals = this.page.getByRole('row').filter({ has: this.page.locator('table') });
  140 |     await expect(totals).toContainText(new RegExp(`Items\\s*Delivery\\s*Promotion\\s*Total Price\\s*${values}`));
  141 |   }
  142 | }
  143 | 
  144 | /** The confirmation page `/#/order-completion/<order ID>`. */
  145 | export class OrderCompletionPage {
  146 |   constructor(private readonly page: Page) {}
  147 | 
  148 |   async expectOpen(): Promise<string> {
  149 |     await expect(this.page).toHaveURL(/#\/order-completion\/.+/);
> 150 |     await expect(this.page.getByText('Thank you for your purchase!')).toBeVisible();
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
  151 |     const match = /#\/order-completion\/([^/?#]+)/.exec(this.page.url());
  152 |     if (!match) {
  153 |       throw new Error(`No order ID in URL: ${this.page.url()}`);
  154 |     }
  155 |     return decodeURIComponent(match[1]);
  156 |   }
  157 | }
  158 | 
```