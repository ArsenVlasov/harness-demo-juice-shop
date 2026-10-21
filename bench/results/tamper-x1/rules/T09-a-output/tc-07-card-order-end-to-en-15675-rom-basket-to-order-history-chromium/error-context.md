# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-07-card-order-end-to-end.spec.ts >> TC-07: Order with a card, from basket to order history
- Location: tests/tc-07-card-order-end-to-end.spec.ts:6:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 19.86
Received: 20.86

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
      - button "Show/hide account menu" [active] [ref=e32]:
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
    - generic [ref=e51]: Order History
    - generic [ref=e54]:
      - generic [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58]: Order ID
          - generic [ref=e59]: "#8569-d9e8941c5d42c53e"
        - generic [ref=e60]:
          - generic [ref=e61]: Total Price
          - generic [ref=e62]: 20.86¤
        - generic [ref=e63]:
          - generic [ref=e64]: Bonus
          - generic [ref=e65]: "2"
        - generic [ref=e66]: In Transit
        - button "Track Your Order" [ref=e69] [cursor=pointer]:
          - img [aria-hidden] [ref=e70]: local_shipping
        - button "Print order confirmation" [ref=e74] [cursor=pointer]:
          - img [aria-hidden] [ref=e75]: note
      - table [ref=e79]:
        - row [ref=e80]:
          - columnheader "Product" [ref=e81]
          - columnheader "Price" [ref=e82]
          - columnheader "Quantity" [ref=e83]
          - columnheader "Total Price" [ref=e84]
          - columnheader [ref=e85]
        - row [ref=e86]:
          - cell "Eggfruit Juice (500ml)" [ref=e87]
          - cell "8.99¤" [ref=e88]
          - cell "2" [ref=e89]
          - cell "17.98¤" [ref=e91]
          - cell [ref=e92]:
            - button "Print order confirmation" [ref=e93] [cursor=pointer]:
              - img [aria-hidden] [ref=e94]: rate_review
        - row [ref=e97]:
          - cell "Carrot Juice (1000ml)" [ref=e98]
          - cell "2.99¤" [ref=e99]
          - cell "1" [ref=e100]
          - cell "2.99¤" [ref=e102]
          - cell [ref=e103]:
            - button "Print order confirmation" [ref=e104] [cursor=pointer]:
              - img [aria-hidden] [ref=e105]: rate_review
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