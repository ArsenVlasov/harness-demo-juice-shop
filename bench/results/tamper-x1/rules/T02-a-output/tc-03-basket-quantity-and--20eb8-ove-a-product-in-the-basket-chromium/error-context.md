# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-03-basket-quantity-and-remove.spec.ts >> TC-03: Change the quantity and remove a product in the basket
- Location: tests/tc-03-basket-quantity-and-remove.spec.ts:5:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 13.98
Received: 15.98

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
      - heading "Your Basket (tc-03-1792579670937-pb5toc@example.test)" [level=1] [ref=e52]
      - table [ref=e53]:
        - row [ref=e54]
        - row [ref=e55]:
          - cell [ref=e56]:
            - img "Raspberry Juice (1000ml)" [ref=e59]
          - cell "Raspberry Juice (1000ml)" [ref=e60]
          - cell "1" [ref=e61]:
            - button [ref=e62] [cursor=pointer]:
              - img [aria-hidden] [ref=e63]: minus-square
            - button [ref=e68] [cursor=pointer]:
              - img [aria-hidden] [ref=e69]: plus-square
          - cell "5.99¤" [ref=e73]
          - cell [ref=e74]:
            - button [ref=e75] [cursor=pointer]:
              - img [aria-hidden] [ref=e76]: trash-alt
        - row [ref=e80]:
          - cell [ref=e81]:
            - img "Eggfruit Juice (500ml)" [ref=e84]
          - cell "Eggfruit Juice (500ml)" [ref=e85]
          - cell "1" [ref=e86]:
            - button [ref=e87] [cursor=pointer]:
              - img [aria-hidden] [ref=e88]: minus-square
            - button [ref=e93] [cursor=pointer]:
              - img [aria-hidden] [ref=e94]: plus-square
          - cell "9.99¤" [ref=e98]
          - cell [ref=e99]:
            - button [ref=e100] [cursor=pointer]:
              - img [aria-hidden] [ref=e101]: trash-alt
      - generic [ref=e105]: "Total Price: 15.98¤"
    - button [ref=e106]:
      - generic [ref=e107]:
        - img [aria-hidden] [ref=e108]: cart-arrow-down
        - text: Checkout
    - generic [ref=e112]: You will gain 2 Bonus Points from this order!
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