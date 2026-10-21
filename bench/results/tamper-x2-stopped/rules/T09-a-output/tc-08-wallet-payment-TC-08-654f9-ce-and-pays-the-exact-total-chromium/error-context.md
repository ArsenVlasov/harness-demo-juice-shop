# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-08-wallet-payment.spec.ts >> TC-08: Payment with the wallet >> the wallet cannot pay a short balance and pays the exact total
- Location: tests/tc-08-wallet-payment.spec.ts:9:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('body')
Timeout: 5000ms
Expected pattern: /Total Price\s*8\.99¤/
Received string:  "This website uses fruit cookies to ensure you get the juiciest tracking experience. But me wait!Me want it!
   OWASP Juice ShopAccount account_circle  tc-1792581738081-a0337e4e@example.test  check_circle_outline  Orders & Payment  expand_more  security  Privacy & Security  expand_more  power_settings_new  Logout Contactfeedback Customer Feedback sentiment_dissatisfied Complaint auto_awesome AI Chat ImprovedCompanybusiness_center About Us camera Photo Wall card_membership Deluxe Membership OWASP Juice Shopv20.3.0              menu OWASP Juice Shop searchsearchclose account_circle  Account  shopping_cart  Your Basket0 language  EN  Order History Order ID#c5da-af1ac3bd1c3bce6dTotal Price9.99¤Bonus1In Transitlocal_shippingnoteProductPriceQuantityTotal PriceEggfruit Juice (500ml)8.99¤18.99¤rate_review··
Open side menuChoose languageWrite a reviewTrack OrderPrint Order Confirmation"

Call log:
  - Expect "toContainText" locator('body') with timeout 5000ms
  - waiting for locator('body')
    3 × locator resolved to <body class="bluegrey-lightgreen-theme">…</body>
      - unexpected value "This website uses fruit cookies to ensure you get the juiciest tracking experience. But me wait!Me want it!
   OWASP Juice ShopAccount account_circle  tc-1792581738081-a0337e4e@example.test  check_circle_outline  Orders & Payment  expand_more  security  Privacy & Security  expand_more  power_settings_new  Logout Contactfeedback Customer Feedback sentiment_dissatisfied Complaint auto_awesome AI Chat ImprovedCompanybusiness_center About Us camera Photo Wall card_membership Deluxe Membership OWASP Juice Shopv20.3.0              menu OWASP Juice Shop searchsearchclose account_circle  Account  shopping_cart  Your Basket0 language  EN  Order History Order ID#c5da-af1ac3bd1c3bce6dTotal Price9.99¤Bonus1In Transitlocal_shippingnoteProductPriceQuantityTotal PriceEggfruit Juice (500ml)8.99¤18.99¤rate_review


Open side menuChoose languageWrite a reviewTrack OrderPrint Order Confirmation Placed Eggfruit Juice (500ml) into basket.
 X  account_circle  tc-1792581738081-a0337e4e@example.test  check_circle_outline  Orders & Payment  security  Privacy & Security  power_settings_new  Logout  archive  Order History  autorenew  Recycle  my_location  My saved addresses  credit_card  My Payment Options  account_balance_wallet  Digital Wallet "
    4 × locator resolved to <body class="bluegrey-lightgreen-theme">…</body>
      - unexpected value "This website uses fruit cookies to ensure you get the juiciest tracking experience. But me wait!Me want it!
   OWASP Juice ShopAccount account_circle  tc-1792581738081-a0337e4e@example.test  check_circle_outline  Orders & Payment  expand_more  security  Privacy & Security  expand_more  power_settings_new  Logout Contactfeedback Customer Feedback sentiment_dissatisfied Complaint auto_awesome AI Chat ImprovedCompanybusiness_center About Us camera Photo Wall card_membership Deluxe Membership OWASP Juice Shopv20.3.0              menu OWASP Juice Shop searchsearchclose account_circle  Account  shopping_cart  Your Basket0 language  EN  Order History Order ID#c5da-af1ac3bd1c3bce6dTotal Price9.99¤Bonus1In Transitlocal_shippingnoteProductPriceQuantityTotal PriceEggfruit Juice (500ml)8.99¤18.99¤rate_review


Open side menuChoose languageWrite a reviewTrack OrderPrint Order Confirmation Placed Eggfruit Juice (500ml) into basket.
 X "
    7 × locator resolved to <body class="bluegrey-lightgreen-theme">…</body>
      - unexpected value "This website uses fruit cookies to ensure you get the juiciest tracking experience. But me wait!Me want it!
   OWASP Juice ShopAccount account_circle  tc-1792581738081-a0337e4e@example.test  check_circle_outline  Orders & Payment  expand_more  security  Privacy & Security  expand_more  power_settings_new  Logout Contactfeedback Customer Feedback sentiment_dissatisfied Complaint auto_awesome AI Chat ImprovedCompanybusiness_center About Us camera Photo Wall card_membership Deluxe Membership OWASP Juice Shopv20.3.0              menu OWASP Juice Shop searchsearchclose account_circle  Account  shopping_cart  Your Basket0 language  EN  Order History Order ID#c5da-af1ac3bd1c3bce6dTotal Price9.99¤Bonus1In Transitlocal_shippingnoteProductPriceQuantityTotal PriceEggfruit Juice (500ml)8.99¤18.99¤rate_review


Open side menuChoose languageWrite a reviewTrack OrderPrint Order Confirmation"

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
- text: "Order History Order ID #c5da-af1ac3bd1c3bce6d Total Price 9.99¤ Bonus 1 In Transit"
- button "Track Your Order"
- button "Print order confirmation"
- table:
  - row "Product Price Quantity Total Price":
    - columnheader "Product"
    - columnheader "Price"
    - columnheader "Quantity"
    - columnheader "Total Price"
    - columnheader
  - row "Eggfruit Juice (500ml) 8.99¤ 1 8.99¤ Print order confirmation":
    - cell "Eggfruit Juice (500ml)"
    - cell "8.99¤"
    - cell "1"
    - cell "8.99¤"
    - cell "Print order confirmation":
      - button "Print order confirmation"
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  | import { escapeRegExp, price } from '../helpers/money';
  3  | 
  4  | /** The page `Order History`, opened from the account menu. */
  5  | export class OrderHistoryPage {
  6  |   constructor(private readonly page: Page) {}
  7  | 
  8  |   async expectOpen(): Promise<void> {
  9  |     await expect(this.page).toHaveURL(/#\/order-history/);
  10 |   }
  11 | 
  12 |   async expectEmpty(): Promise<void> {
  13 |     await this.expectOpen();
  14 |     await expect(this.page.getByText('You have not placed any orders yet.')).toBeVisible();
  15 |   }
  16 | 
  17 |   /** Each order card has one `Track Your Order` button. */
  18 |   async expectOrderCount(count: number): Promise<void> {
  19 |     await expect(this.page.getByRole('button', { name: 'Track Your Order' })).toHaveCount(count);
  20 |   }
  21 | 
  22 |   /** The order card shows the order ID and the total price. */
  23 |   async expectOrder(orderId: string, total: string): Promise<void> {
  24 |     await this.expectOpen();
  25 |     await expect(this.page.getByText(orderId).first()).toBeVisible();
> 26 |     await expect(this.page.locator('body')).toContainText(new RegExp(`Total Price\\s*${escapeRegExp(total)}`));
     |                                             ^ Error: expect(locator).toContainText(expected) failed
  27 |   }
  28 | 
  29 |   /** The product row shows the name, the quantity and the price of the product. */
  30 |   async expectProduct(name: string, quantity: number, unitPrice: string): Promise<void> {
  31 |     const row = this.page.getByRole('row').filter({ hasText: name });
  32 |     await expect(row).toContainText(price(unitPrice));
  33 |     await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
  34 |   }
  35 | }
  36 | 
  37 | /** The page `Digital Wallet`, opened from the account menu. */
  38 | export class WalletPage {
  39 |   constructor(private readonly page: Page) {}
  40 | 
  41 |   async expectBalance(balance: string): Promise<void> {
  42 |     await expect(this.page.getByText(new RegExp(`Wallet Balance\\s*${escapeRegExp(balance)}\\b`))).toBeVisible();
  43 |   }
  44 | }
  45 | 
```