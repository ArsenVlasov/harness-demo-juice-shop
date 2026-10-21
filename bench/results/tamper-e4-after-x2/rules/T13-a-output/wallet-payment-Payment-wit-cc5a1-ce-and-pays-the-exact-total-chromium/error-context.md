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

Locator: getByText(/^Wallet Balance\s*5\.00$/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/^Wallet Balance\s*5\.00$/) with timeout 5000ms
  - waiting for getByText(/^Wallet Balance\s*5\.00$/)

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
- button "Show the shopping cart": Your Basket 1
- button "Language selection menu": EN
- heading "My Payment Options" [level=1]
- table:
  - row:
    - columnheader
    - columnheader
    - columnheader
    - columnheader
  - row "************1111 Test Customer 12/2090":
    - cell:
      - radio
    - cell "************1111"
    - cell "Test Customer"
    - cell "12/2090"
- button "Add new card Add a credit or debit card"
- separator
- text: Pay using wallet Wallet Balance 6.00
- button "Pay 8.99¤" [disabled]
- separator
- button "Add a coupon Add a coupon code to receive discounts"
- separator
- button "Other payment options"
- separator
- button "Back"
- paragraph: You can review this order before it is finalized.
- button "Proceed to review" [disabled]: Continue
```

# Test source

```ts
  5   | /** The last four digits of the saved card, see test-cases/README.md. */
  6   | const SAVED_CARD_LAST_DIGITS = SAVED_CARD.number.slice(-4);
  7   | 
  8   | /** The masked number of the saved card, see test-cases/README.md. */
  9   | const SAVED_CARD_MASKED = `************${SAVED_CARD_LAST_DIGITS}`;
  10  | 
  11  | /** The page `Select an address` of the checkout. */
  12  | export class AddressPage {
  13  |   constructor(private readonly page: Page) {}
  14  | 
  15  |   async expectOpen(): Promise<void> {
  16  |     await expect(this.page).toHaveURL(/#\/address\/select/);
  17  |     await expect(this.page.getByRole('heading', { name: 'Select an address' })).toBeVisible();
  18  |   }
  19  | 
  20  |   savedAddress() {
  21  |     return this.page.getByRole('row').filter({ hasText: SAVED_ADDRESS.address });
  22  |   }
  23  | 
  24  |   async selectSavedAddress(): Promise<void> {
  25  |     await this.savedAddress().getByRole('radio').click();
  26  |   }
  27  | 
  28  |   async continue(): Promise<void> {
  29  |     await this.page.locator('button', { hasText: 'Continue' }).click();
  30  |   }
  31  | }
  32  | 
  33  | /** The page `Choose a delivery speed` of the checkout. */
  34  | export class DeliveryPage {
  35  |   constructor(private readonly page: Page) {}
  36  | 
  37  |   async expectOpen(): Promise<void> {
  38  |     await expect(this.page).toHaveURL(/#\/delivery-method/);
  39  |     await expect(this.page.getByRole('heading', { name: 'Choose a delivery speed' })).toBeVisible();
  40  |   }
  41  | 
  42  |   option(name: string) {
  43  |     return this.page.getByRole('row').filter({ hasText: name });
  44  |   }
  45  | 
  46  |   async expectOptions(): Promise<void> {
  47  |     await expect(this.option(DELIVERY.oneDay.name)).toContainText(price(DELIVERY.oneDay.price));
  48  |     await expect(this.option(DELIVERY.fast.name)).toContainText(price(DELIVERY.fast.price));
  49  |     await expect(this.option(DELIVERY.standard.name)).toContainText(price(DELIVERY.standard.price));
  50  |   }
  51  | 
  52  |   async select(name: string): Promise<void> {
  53  |     await this.option(name).getByRole('radio').click();
  54  |   }
  55  | 
  56  |   async continue(): Promise<void> {
  57  |     await this.page.locator('button', { hasText: 'Continue' }).click();
  58  |   }
  59  | }
  60  | 
  61  | /** The page `My Payment Options` of the checkout. */
  62  | export class PaymentPage {
  63  |   constructor(private readonly page: Page) {}
  64  | 
  65  |   async expectOpen(): Promise<void> {
  66  |     await expect(this.page).toHaveURL(/#\/payment\/shop/);
  67  |     await expect(this.page.getByRole('heading', { name: 'My Payment Options' })).toBeVisible();
  68  |   }
  69  | 
  70  |   get couponPanel() {
  71  |     return this.page.getByRole('button', { name: /^Add a coupon/ });
  72  |   }
  73  | 
  74  |   get couponField() {
  75  |     return this.page.getByRole('textbox', { name: /coupon/i });
  76  |   }
  77  | 
  78  |   get redeemButton() {
  79  |     return this.page.locator('button', { hasText: 'Redeem' });
  80  |   }
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
> 105 |     await expect(this.page.getByText(new RegExp(`^Wallet Balance\\s*${escapeRegExp(balance)}$`))).toBeVisible();
      |                                                                                                   ^ Error: expect(locator).toBeVisible() failed
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
  181 |     await expect(this.page.getByText('Thank you for your purchase!')).toBeVisible();
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