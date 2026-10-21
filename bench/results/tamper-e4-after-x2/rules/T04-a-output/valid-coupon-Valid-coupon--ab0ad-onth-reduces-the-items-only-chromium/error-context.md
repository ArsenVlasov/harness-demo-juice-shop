# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: valid-coupon.spec.ts >> Valid coupon on the payment step >> the 10% coupon of the current month reduces the items only
- Location: tests/valid-coupon.spec.ts:11:7

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
  2   | import { escapeRegExp, price } from '@/tests/helpers/money';
  3   | import { DELIVERY, SAVED_ADDRESS, SAVED_CARD } from '@/tests/helpers/test-data';
  4   | 
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
> 47  |     await expect(this.option(DELIVERY.oneDay.name)).toContainText(price(DELIVERY.oneDay.price));
      |                                                     ^ Error: expect(locator).toContainText(expected) failed
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
```