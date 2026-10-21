# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-05-valid-coupon.spec.ts >> TC-05: Valid coupon on the payment step
- Location: tests/tc-05-valid-coupon.spec.ts:6:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 17.98
Received: 19.98

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
          - generic [ref=e40]: "2"
      - button "Language selection menu" [ref=e43]:
        - img [aria-hidden] [ref=e44]: language
        - generic [ref=e45]: EN
  - generic [ref=e50]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - generic [ref=e54]:
          - generic [ref=e55]: Delivery Address
          - generic [ref=e56]: Test Customer
          - generic [ref=e57]: 1 Khreshchatyk Street, Kyiv, Kyiv, 01001
          - generic [ref=e58]: Ukraine
          - generic [ref=e59]: Phone Number 501234567
        - generic [ref=e61]:
          - generic [ref=e62]: Payment Method
          - generic [ref=e63]: Card ending in 1111
          - generic [ref=e64]: Card Holder" Test Customer
      - generic [ref=e65]:
        - heading "Your Basket (tc-05-1792579685892-abzxv2@example.test)" [level=1] [ref=e66]
        - table [ref=e67]:
          - row [ref=e68]
          - row [ref=e69]:
            - cell [ref=e70]:
              - img "Eggfruit Juice (500ml)" [ref=e73]
            - cell "Eggfruit Juice (500ml)" [ref=e74]
            - cell "2" [ref=e75]
            - cell "9.99¤" [ref=e77]
    - generic [ref=e80]:
      - generic [ref=e81]: Order Summary
      - table [ref=e82]:
        - row [ref=e83]:
          - cell "Items" [ref=e84]
          - cell "19.98¤" [ref=e85]
        - row [ref=e86]:
          - cell "Delivery" [ref=e87]
          - cell "0.99¤" [ref=e88]
        - row [ref=e89]:
          - cell "Promotion" [ref=e90]
          - cell "2.00¤" [ref=e91]
        - row [ref=e92]:
          - cell "Total Price" [ref=e93]
          - cell "18.97¤" [ref=e94]
      - button "Complete your purchase" [ref=e95]:
        - img [aria-hidden] [ref=e96]: monetization_on
        - generic [ref=e97]: Place your order and pay
      - generic [ref=e100]: You will gain 2 Bonus Points from this order!
```

# Test source

```ts
  1  | import { expect, Locator } from '@playwright/test';
  2  | import { money, parsePrice } from './test-data';
  3  | 
  4  | /**
  5  |  * Waits until the price in the element equals the expected amount.
  6  |  * The shop shows some totals without trailing zeros (`0¤`), so the check compares numbers.
  7  |  */
  8  | export async function expectPrice(locator: Locator, expected: number, message?: string): Promise<void> {
  9  |   await expect
  10 |     .poll(
  11 |       async () => {
  12 |         const text = await locator.innerText();
  13 |         // The page can show an empty value while it loads data; poll again in that case.
  14 |         return /\d/.test(text) ? parsePrice(text) : text;
  15 |       },
  16 |       { message },
  17 |     )
> 18 |     .toBe(money(expected));
     |      ^ Error: expect(received).toBe(expected) // Object.is equality
  19 | }
  20 | 
```