# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-07-card-order-end-to-end.spec.ts >> TC-07: Order with a card, from basket to order history >> order two products with a card and find the order in the history
- Location: tests/tc-07-card-order-end-to-end.spec.ts:10:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('row').filter({ has: locator('table') })
Expected pattern: /Items\s*Delivery\s*Promotion\s*Total Price\s*20\.97¤\s*0\.99¤\s*2\.10¤\s*19\.86¤/
Received string:  "ItemsDeliveryPromotionTotal Price21.97¤0.99¤3.10¤19.86¤"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('row').filter({ has: locator('table') }) with timeout 5000ms
  - waiting for getByRole('row').filter({ has: locator('table') })
    14 × locator resolved to <mat-footer-row role="row" mat-footer-row="" _ngcontent-ng-c1619742415="" class="mat-mdc-footer-row mdc-data-table__row cdk-footer-row">…</mat-footer-row>
       - unexpected value "ItemsDeliveryPromotionTotal Price21.97¤0.99¤3.10¤19.86¤"

```

```yaml
- row "Items Delivery Promotion Total Price 21.97¤ 0.99¤ 3.10¤ 19.86¤":
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
  - cell "21.97¤ 0.99¤ 3.10¤ 19.86¤":
    - table:
      - row "21.97¤":
        - cell "21.97¤"
      - row "0.99¤":
        - cell "0.99¤"
      - row "3.10¤":
        - cell "3.10¤"
      - row "19.86¤":
        - cell "19.86¤"
```

# Test source

```ts
  40  |     return this.page.getByRole('row').filter({ hasText: name });
  41  |   }
  42  | 
  43  |   async expectOptions(): Promise<void> {
  44  |     await expect(this.option(DELIVERY.oneDay.name)).toContainText(price(DELIVERY.oneDay.price));
  45  |     await expect(this.option(DELIVERY.fast.name)).toContainText(price(DELIVERY.fast.price));
  46  |     await expect(this.option(DELIVERY.standard.name)).toContainText(price(DELIVERY.standard.price));
  47  |   }
  48  | 
  49  |   async select(name: string): Promise<void> {
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
> 140 |     await expect(totals).toContainText(new RegExp(`Items\\s*Delivery\\s*Promotion\\s*Total Price\\s*${values}`));
      |                          ^ Error: expect(locator).toContainText(expected) failed
  141 |   }
  142 | }
  143 | 
  144 | /** The confirmation page `/#/order-completion/<order ID>`. */
  145 | export class OrderCompletionPage {
  146 |   constructor(private readonly page: Page) {}
  147 | 
  148 |   async expectOpen(): Promise<string> {
  149 |     await expect(this.page).toHaveURL(/#\/order-completion\/.+/);
  150 |     await expect(this.page.getByText('Thank you for your purchase!')).toBeVisible();
  151 |     const match = /#\/order-completion\/([^/?#]+)/.exec(this.page.url());
  152 |     if (!match) {
  153 |       throw new Error(`No order ID in URL: ${this.page.url()}`);
  154 |     }
  155 |     return decodeURIComponent(match[1]);
  156 |   }
  157 | }
  158 | 
```