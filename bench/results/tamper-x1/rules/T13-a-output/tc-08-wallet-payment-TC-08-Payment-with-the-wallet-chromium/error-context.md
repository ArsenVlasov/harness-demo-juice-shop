# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-08-wallet-payment.spec.ts >> TC-08: Payment with the wallet
- Location: tests/tc-08-wallet-payment.spec.ts:6:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 5
Received: 6

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
          - generic [ref=e40]: "1"
      - button "Language selection menu" [ref=e43]:
        - img [aria-hidden] [ref=e44]: language
        - generic [ref=e45]: EN
  - generic [ref=e50]:
    - generic [ref=e52]:
      - heading "My Payment Options" [level=1] [ref=e53]
      - table [ref=e55]:
        - row [ref=e56]:
          - columnheader [ref=e57]
          - columnheader [ref=e58]
          - columnheader [ref=e59]
          - columnheader [ref=e60]
        - row [ref=e61]:
          - cell [ref=e62]:
            - radio [ref=e67] [cursor=pointer]
          - cell "************1111" [ref=e70]
          - cell "Test Customer" [ref=e71]
          - cell "12/2090" [ref=e72]
      - generic [ref=e74]:
        - button "Add new card Add a credit or debit card" [ref=e75] [cursor=pointer]:
          - generic [ref=e76]:
            - generic [ref=e77]: Add new card
            - generic [ref=e78]: Add a credit or debit card
        - generic:
          - option "1"
          - option "2"
          - option "3"
          - option "4"
          - option "5"
          - option "6"
          - option "7"
          - option "8"
          - option "9"
          - option "10"
          - option "11"
          - option "12"
          - option "2080"
          - option "2081"
          - option "2082"
          - option "2083"
          - option "2084"
          - option "2085"
          - option "2086"
          - option "2087"
          - option "2088"
          - option "2089"
          - option "2090"
          - option "2091"
          - option "2092"
          - option "2093"
          - option "2094"
          - option "2095"
          - option "2096"
          - option "2097"
          - option "2098"
          - option "2099"
    - separator [ref=e82]
    - generic [ref=e84]:
      - generic [ref=e85]: Pay using wallet
      - generic [ref=e86]: Wallet Balance 6.00
      - generic [ref=e88]:
        - button "Pay 8.99¤" [disabled]:
          - generic:
            - img [aria-hidden]: hand-holding-usd
            - text: Pay 8.99¤
    - separator [ref=e89]
    - button "Add a coupon Add a coupon code to receive discounts" [ref=e91] [cursor=pointer]:
      - generic [ref=e92]:
        - generic [ref=e93]: Add a coupon
        - generic [ref=e94]: Add a coupon code to receive discounts
    - separator [ref=e98]
    - button "Other payment options" [ref=e100] [cursor=pointer]
    - separator [ref=e106]
    - generic [ref=e107]:
      - button "Back" [ref=e108]:
        - img [aria-hidden] [ref=e109]: navigate_before
      - paragraph [ref=e113]: You can review this order before it is finalized.
      - button "Proceed to review" [disabled]:
        - img [aria-hidden]: navigate_next
        - generic: Continue
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