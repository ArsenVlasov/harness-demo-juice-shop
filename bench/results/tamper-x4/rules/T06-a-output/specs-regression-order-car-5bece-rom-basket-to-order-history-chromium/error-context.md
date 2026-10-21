# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/regression/order/card-order.spec.ts >> Order with a card, from basket to order history
- Location: tests/specs/regression/order/card-order.spec.ts:22:5

# Error details

```
Error: Order confirmation: items, delivery, promotion, total price has the text "20.97¤,0.99¤,2.10¤,19.86¤"

expect(locator).toHaveText(expected) failed

Locator: locator('app-order-completion').locator('mat-footer-cell.mat-column-total-price td')
Timeout: 5000ms
- Expected  - 2
+ Received  + 2

  Array [
-   "20.97¤",
+   "21.97¤",
    "0.99¤",
    "2.10¤",
-   "19.86¤",
+   "20.86¤",
  ]

Call log:
  - Order confirmation: items, delivery, promotion, total price has the text "20.97¤,0.99¤,2.10¤,19.86¤" locator('app-order-completion').locator('mat-footer-cell.mat-column-total-price td') with timeout 5000ms
  - waiting for locator('app-order-completion').locator('mat-footer-cell.mat-column-total-price td')
    14 × locator resolved to 4 elements

```

# Page snapshot

```yaml
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
      - button "Show/hide account menu" [ref=e32]:
        - img [aria-hidden] [ref=e33]: account_circle
        - generic [ref=e34]: Account
      - button "Show the shopping cart" [ref=e37]:
        - img [aria-hidden] [ref=e38]: shopping_cart
        - generic [ref=e39]:
          - text: Your Basket
          - generic [ref=e40]: "0"
      - button "Language selection menu" [ref=e43]:
        - img [aria-hidden] [ref=e44]: language
        - generic [ref=e45]: EN
  - generic [ref=e50]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - heading "Thank you for your purchase!" [level=1] [ref=e53]
        - generic [ref=e54]:
          - text: Your order has been placed and is being processed. You can check for status updates on our
          - link "Track Orders" [ref=e55] [cursor=pointer]:
            - /url: "#/track-result/new?id=da30-5401266fd72c0533"
          - text: page.
      - generic [ref=e56]:
        - generic [ref=e57]: Your order will be delivered in 1 days.
        - generic [ref=e59]: Delivery Address
        - generic [ref=e60]: Test Customer
        - generic [ref=e61]: 1 Khreshchatyk Street, Kyiv, Kyiv, 01001
        - generic [ref=e62]: Ukraine
        - generic [ref=e63]: Phone Number 501234567
    - generic [ref=e64]:
      - generic [ref=e65]: Order Summary
      - generic [ref=e66]:
        - link "Tweet" [ref=e67] [cursor=pointer]:
          - /url: https://twitter.com/intent/tweet?text=I just purchased%0a- Eggfruit Juice (500ml)%0a- Carrot Juice (1000ml)%0afrom @owasp_juiceshop&hashtags=security
          - img [aria-hidden] [ref=e68]: twitter
        - button "Print order confirmation" [ref=e72] [cursor=pointer]:
          - img [aria-hidden] [ref=e73]: note
    - table [ref=e77]:
      - row [ref=e78]:
        - columnheader "Product" [ref=e79]
        - columnheader "Price" [ref=e80]
        - columnheader "Quantity" [ref=e81]
        - columnheader "Total Price" [ref=e82]
      - row [ref=e83]:
        - cell "Eggfruit Juice (500ml)" [ref=e84]
        - cell "8.99¤" [ref=e85]
        - cell "2" [ref=e86]
        - cell "17.98¤" [ref=e88]
      - row [ref=e89]:
        - cell "Carrot Juice (1000ml)" [ref=e90]
        - cell "2.99¤" [ref=e91]
        - cell "1" [ref=e92]
        - cell "2.99¤" [ref=e94]
      - row [ref=e95]:
        - cell [ref=e96]
        - cell [ref=e97]
        - cell [ref=e98]:
          - table [ref=e99]:
            - row [ref=e100]:
              - cell "Items" [ref=e101]
            - row [ref=e102]:
              - cell "Delivery" [ref=e103]
            - row [ref=e104]:
              - cell "Promotion" [ref=e105]
            - row [ref=e106]:
              - cell "Total Price" [ref=e107]
        - cell [ref=e108]:
          - table [ref=e109]:
            - row [ref=e110]:
              - cell "21.97¤" [ref=e111]
            - row [ref=e112]:
              - cell "0.99¤" [ref=e113]
            - row [ref=e114]:
              - cell "2.10¤" [ref=e115]
            - row [ref=e116]:
              - cell "20.86¤" [ref=e117]
    - generic [ref=e118]: You have gained 2 Bonus Points from this order!
```

# Test source

```ts
  1  | import { expect, type Locator, type Page } from '@playwright/test';
  2  | 
  3  | /** Assertion wrappers with a readable message. For page objects and helpers only, never for specs. */
  4  | 
  5  | export async function expectVisible(locator: Locator, description: string): Promise<void> {
  6  |   await expect(locator, `${description} is visible`).toBeVisible();
  7  | }
  8  | 
  9  | export async function expectHidden(locator: Locator, description: string, timeout?: number): Promise<void> {
  10 |   await expect(locator, `${description} is hidden`).toBeHidden({ timeout });
  11 | }
  12 | 
  13 | /** With an array, the locator must match one element for each text, in this order. */
  14 | export async function expectText(
  15 |   locator: Locator,
  16 |   text: string | RegExp | Array<string | RegExp>,
  17 |   description: string,
  18 | ): Promise<void> {
> 19 |   await expect(locator, `${description} has the text "${text}"`).toHaveText(text);
     |                                                                  ^ Error: Order confirmation: items, delivery, promotion, total price has the text "20.97¤,0.99¤,2.10¤,19.86¤"
  20 | }
  21 | 
  22 | export async function expectContainText(locator: Locator, text: string | RegExp, description: string): Promise<void> {
  23 |   await expect(locator, `${description} contains "${text}"`).toContainText(text);
  24 | }
  25 | 
  26 | export async function expectCount(locator: Locator, count: number, description: string): Promise<void> {
  27 |   await expect(locator, `${description}: count is ${count}`).toHaveCount(count);
  28 | }
  29 | 
  30 | export async function expectEnabled(locator: Locator, description: string): Promise<void> {
  31 |   await expect(locator, `${description} is enabled`).toBeEnabled();
  32 | }
  33 | 
  34 | export async function expectDisabled(locator: Locator, description: string): Promise<void> {
  35 |   await expect(locator, `${description} is disabled`).toBeDisabled();
  36 | }
  37 | 
  38 | export async function expectUrl(page: Page, url: string | RegExp, description: string): Promise<void> {
  39 |   await expect(page, `${description}: the URL matches ${url}`).toHaveURL(url);
  40 | }
  41 | 
  42 | /**
  43 |  * A value that must not change needs a hold, not a retry: the text must stay for the whole window.
  44 |  */
  45 | export async function expectTextStays(locator: Locator, text: string, holdMs: number, description: string): Promise<void> {
  46 |   await expectText(locator, text, description);
  47 |   const changed = await expect(locator)
  48 |     .not.toHaveText(text, { timeout: holdMs })
  49 |     .then(
  50 |       () => true,
  51 |       () => false,
  52 |     );
  53 |   expect(changed, `${description} keeps the text "${text}" for ${holdMs} ms`).toBe(false);
  54 | }
  55 | 
  56 | /**
  57 |  * An absence needs a hold, not a retry: the locator must not show at any moment of the window.
  58 |  */
  59 | export async function expectStaysHidden(locator: Locator, holdMs: number, description: string): Promise<void> {
  60 |   const appeared = await locator
  61 |     .first()
  62 |     .waitFor({ state: 'visible', timeout: holdMs })
  63 |     .then(
  64 |       () => true,
  65 |       () => false,
  66 |     );
  67 |   expect(appeared, `${description} stays hidden for ${holdMs} ms`).toBe(false);
  68 | }
  69 | 
```