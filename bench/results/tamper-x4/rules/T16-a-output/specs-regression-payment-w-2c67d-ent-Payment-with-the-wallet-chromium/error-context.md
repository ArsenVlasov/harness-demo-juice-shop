# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/regression/payment/wallet-payment.spec.ts >> Payment with the wallet
- Location: tests/specs/regression/payment/wallet-payment.spec.ts:22:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('.cdk-overlay-container').getByRole('menuitem').filter({ hasText: 'Digital Wallet' })

```

# Page snapshot

```yaml
- generic:
  - generic [ref=e4]:
    - generic [ref=e7]:
      - button "Open Sidenav" [ref=e8] [cursor=pointer]:
        - img [aria-hidden] [ref=e9]: menu
      - button "Back to homepage" [ref=e12]:
        - generic [ref=e14]:
          - img "OWASP Juice Shop" [ref=e15]
          - generic [ref=e16]: OWASP Juice Shop
      - generic "Click to search" [ref=e20]:
        - button "Open search" [ref=e21] [cursor=pointer]:
          - img [aria-hidden] [ref=e22]: search
        - generic:
          - img [aria-hidden] [ref=e25]: search
          - textbox [ref=e26]
          - button "Close search" [ref=e27] [cursor=pointer]:
            - img [aria-hidden] [ref=e28]: close
      - generic [ref=e31]:
        - button "Show/hide account menu" [expanded] [ref=e32]:
          - img [aria-hidden] [ref=e33]: account_circle
          - generic [ref=e34]: Account
        - button "Show the shopping cart" [ref=e37]:
          - img [aria-hidden] [ref=e38]: shopping_cart
          - generic [ref=e39]:
            - text: Your Basket
            - generic [ref=e40]: "1"
        - button "Language selection menu" [ref=e43]:
          - img [aria-hidden] [ref=e44]: language
          - generic [ref=e45]: EN
    - generic [ref=e50]:
      - generic [ref=e51]: Order History
      - generic [ref=e53]:
        - img "No results found" [ref=e54]
        - generic [ref=e55]: No results found
        - generic [ref=e57]: You have not placed any orders yet.
  - generic:
    - menu [ref=e62]:
      - generic [ref=e63]:
        - menuitem "Go to user profile" [active] [ref=e64] [cursor=pointer]:
          - img [aria-hidden] [ref=e65]: account_circle
          - generic [ref=e66]: customer-1792595701117-2ccaf671@example.test
        - menuitem "Show Orders and Payment Menu" [expanded] [ref=e67] [cursor=pointer]:
          - img [aria-hidden] [ref=e68]: check_circle_outline
          - generic [ref=e69]: Orders & Payment
        - menuitem "Show Privacy and Security Menu" [ref=e72] [cursor=pointer]:
          - img [aria-hidden] [ref=e73]: security
          - generic [ref=e74]: Privacy & Security
        - menuitem "Logout" [ref=e77] [cursor=pointer]:
          - img [aria-hidden] [ref=e78]: power_settings_new
    - menu [ref=e81]:
      - generic [ref=e82]:
        - menuitem "Go to order history page" [ref=e83] [cursor=pointer]:
          - img [aria-hidden] [ref=e84]: archive
          - generic [ref=e85]: Order History
        - menuitem "Go to recycling page" [ref=e86] [cursor=pointer]:
          - img [aria-hidden] [ref=e87]: autorenew
          - generic [ref=e88]: Recycle
        - separator [ref=e89]
        - menuitem "Go to saved address page" [ref=e90] [cursor=pointer]:
          - img [aria-hidden] [ref=e91]: my_location
          - generic [ref=e92]: My saved addresses
        - menuitem "Go to saved payment methods page" [ref=e93] [cursor=pointer]:
          - img [aria-hidden] [ref=e94]: credit_card
          - generic [ref=e95]: My Payment Options
        - menuitem "Go to wallet page" [ref=e96] [cursor=pointer]:
          - img [aria-hidden] [ref=e97]: account_balance_wallet
          - generic [ref=e98]: MUT
```

# Test source

```ts
  1  | import type { Locator, Page } from '@playwright/test';
  2  | import { expectHidden, expectVisible } from '@/utils/assertions/ui-assertions';
  3  | 
  4  | /** The menu of the button `Account` in the top bar, with the sub-menu `Orders & Payment`. */
  5  | export class AccountMenuComponent {
  6  |   private readonly menuItems: Locator;
  7  | 
  8  |   constructor(private readonly page: Page) {
  9  |     this.menuItems = page.locator('.cdk-overlay-container').getByRole('menuitem');
  10 |   }
  11 | 
  12 |   private item(text: string): Locator {
  13 |     return this.menuItems.filter({ hasText: text });
  14 |   }
  15 | 
  16 |   async shouldSeeLoginItem(): Promise<void> {
  17 |     await expectVisible(this.item('Login'), 'Account menu item `Login`');
  18 |   }
  19 | 
  20 |   async shouldSeeLogoutItem(): Promise<void> {
  21 |     await expectVisible(this.item('Logout'), 'Account menu item `Logout`');
  22 |   }
  23 | 
  24 |   async shouldSeeEmail(email: string): Promise<void> {
  25 |     await expectVisible(this.item(email), `Account menu item with the email ${email}`);
  26 |   }
  27 | 
  28 |   async shouldNotSeeEmail(email: string): Promise<void> {
  29 |     await expectHidden(this.item(email), `Account menu item with the email ${email}`);
  30 |   }
  31 | 
  32 |   async close(): Promise<void> {
  33 |     await this.page.keyboard.press('Escape');
  34 |     await expectHidden(this.menuItems, 'Account menu');
  35 |   }
  36 | 
  37 |   async clickOrderHistory(): Promise<void> {
  38 |     await this.item('Orders & Payment').click();
  39 |     await this.item('Order History').click();
  40 |   }
  41 | 
  42 |   async clickDigitalWallet(): Promise<void> {
  43 |     await this.item('Orders & Payment').click();
> 44 |     await this.item('Digital Wallet').click();
     |                                       ^ Error: locator.click: Test timeout of 120000ms exceeded.
  45 |   }
  46 | }
  47 | 
```