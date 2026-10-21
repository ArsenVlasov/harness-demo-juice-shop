# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-05-valid-coupon.spec.ts >> TC-05: Valid coupon on the payment step >> the 10% coupon of the current month reduces the items only
- Location: tests/tc-05-valid-coupon.spec.ts:9:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('row').filter({ hasText: 'One Day Delivery' })
Expected pattern: /0\.99¤/
Received string:  " One Day Delivery1.99¤1 Days"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('row').filter({ hasText: 'One Day Delivery' }) with timeout 5000ms
  - waiting for getByRole('row').filter({ hasText: 'One Day Delivery' })
    14 × locator resolved to <mat-row role="row" _ngcontent-ng-c3670083191="" class="mat-mdc-row mdc-data-table__row cdk-row">…</mat-row>
       - unexpected value " One Day Delivery1.99¤1 Days"

```

```yaml
- row "One Day Delivery 1.99¤ 1 Days":
  - cell:
    - radio
  - cell "One Day Delivery"
  - cell "1.99¤"
  - cell "1 Days"
```

# Test source

```ts
  1   | import { expect, type Page } from '@playwright/test';
  2   | import { escapeRegExp, price } from '../helpers/money';
  3   | import { DELIVERY, SAVED_ADDRESS } from '../helpers/test-data';
  4   | 
  5   | /** The masked number of the saved card, see test-cases/README.md. */
  6   | const SAVED_CARD_MASKED = '************1111';
  7   | 
  8   | /** The page `Select an address` of the checkout. */
  9   | export class AddressPage {
  10  |   constructor(private readonly page: Page) {}
  11  | 
  12  |   async expectOpen(): Promise<void> {
  13  |     await expect(this.page).toHaveURL(/#\/address\/select/);
  14  |     await expect(this.page.getByRole('heading', { name: 'Select an address' })).toBeVisible();
  15  |   }
  16  | 
  17  |   savedAddress() {
  18  |     return this.page.getByRole('row').filter({ hasText: SAVED_ADDRESS.address });
  19  |   }
  20  | 
  21  |   async selectSavedAddress(): Promise<void> {
  22  |     await this.savedAddress().getByRole('radio').click();
  23  |   }
  24  | 
  25  |   async continue(): Promise<void> {
  26  |     await this.page.locator('button', { hasText: 'Continue' }).click();
  27  |   }
  28  | }
  29  | 
  30  | /** The page `Choose a delivery speed` of the checkout. */
  31  | export class DeliveryPage {
  32  |   constructor(private readonly page: Page) {}
  33  | 
  34  |   async expectOpen(): Promise<void> {
  35  |     await expect(this.page).toHaveURL(/#\/delivery-method/);
  36  |     await expect(this.page.getByRole('heading', { name: 'Choose a delivery speed' })).toBeVisible();
  37  |   }
  38  | 
  39  |   option(name: string) {
  40  |     return this.page.getByRole('row').filter({ hasText: name });
  41  |   }
  42  | 
  43  |   async expectOptions(): Promise<void> {
> 44  |     await expect(this.option(DELIVERY.oneDay.name)).toContainText(price(DELIVERY.oneDay.price));
      |                                                     ^ Error: expect(locator).toContainText(expected) failed
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
  140 |     await expect(totals).toContainText(new RegExp(`Items\\s*Delivery\\s*Promotion\\s*Total Price\\s*${values}`));
  141 |   }
  142 | }
  143 | 
  144 | /** The confirmation page `/#/order-completion/<order ID>`. */
```