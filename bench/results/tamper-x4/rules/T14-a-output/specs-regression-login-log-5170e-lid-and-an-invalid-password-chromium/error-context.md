# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/regression/login/login.spec.ts >> Login with a valid and an invalid password
- Location: tests/specs/regression/login/login.spec.ts:7:5

# Error details

```
Error: Account menu item with the email customer-1792595465329-e2770300@example.test is visible

expect(locator).toBeVisible() failed

Locator: locator('.cdk-overlay-container').getByRole('menuitem').filter({ hasText: 'customer-1792595465329-e2770300@example.test' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Account menu item with the email customer-1792595465329-e2770300@example.test is visible locator('.cdk-overlay-container').getByRole('menuitem').filter({ hasText: 'customer-1792595465329-e2770300@example.test' }) with timeout 5000ms
  - waiting for locator('.cdk-overlay-container').getByRole('menuitem').filter({ hasText: 'customer-1792595465329-e2770300@example.test' })

```

```yaml
- button "Open Sidenav"
- button "Back to homepage":
  - img "OWASP Juice Shop"
  - text: OWASP Juice Shop
- button "Open search"
- textbox
- button "Close search"
- button "Show/hide account menu" [expanded]: Account
- button "Show the shopping cart": Your Basket 0
- button "Language selection menu": EN
- main:
  - text: All Products
  - article:
    - button "Click for more information about the product":
      - img "Apple Juice (1000ml)"
      - text: Apple Juice (1000ml)
    - text: 1.99¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Apple Pomace"
      - text: Apple Pomace
    - text: 0.89¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Banana Juice (1000ml)"
      - text: Banana Juice (1000ml)
    - text: 1.99¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Basil Smoothie"
      - text: Basil Smoothie
    - text: 2.99¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Berry Juice (1000ml)"
      - text: Berry Juice (1000ml)
    - text: 3.49¤
    - button "Add to Basket"
  - article:
    - complementary: Only 1 left
    - button "Click for more information about the product":
      - img "Best Juice Shop Salesman Artwork"
      - text: Best Juice Shop Salesman Artwork
    - text: 5000¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Bragă (500ml)"
      - text: Bragă (500ml)
    - text: 2.49¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Carrot Juice (1000ml)"
      - text: Carrot Juice (1000ml)
    - text: 2.99¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Dragonfruit Juice (500ml)"
      - text: Dragonfruit Juice (500ml)
    - text: 3.99¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Eggfruit Juice (500ml)"
      - text: Eggfruit Juice (500ml)
    - text: 8.99¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Elderflower Cordial (500ml)"
      - text: Elderflower Cordial (500ml)
    - text: 3.29¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Fruit Press"
      - text: Fruit Press
    - text: 89.99¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Grape Juice (1000ml)"
      - text: Grape Juice (1000ml)
    - text: 2.99¤
    - button "Add to Basket"
  - article:
    - button "Click for more information about the product":
      - img "Green Smoothie"
      - text: Green Smoothie
    - text: 1.99¤
    - button "Add to Basket"
  - article:
    - complementary: Only 1 left
    - button "Click for more information about the product":
      - img "Juice Shop \"Permafrost\" 2020 Edition"
      - text: Juice Shop "Permafrost" 2020 Edition
    - text: 9999.99¤
    - button "Add to Basket"
  - group:
    - combobox "Items per page:": "15"
    - status: 1 – 15 of 46
    - button "Previous page" [disabled]
    - button "Next page"
- menu:
  - menuitem "Go to user profile": mut@example.test
  - menuitem "Show Orders and Payment Menu": Orders & Payment
  - menuitem "Show Privacy and Security Menu": Privacy & Security
  - menuitem "Logout"
```

# Test source

```ts
  1  | import { expect, type Locator, type Page } from '@playwright/test';
  2  | 
  3  | /** Assertion wrappers with a readable message. For page objects and helpers only, never for specs. */
  4  | 
  5  | export async function expectVisible(locator: Locator, description: string): Promise<void> {
> 6  |   await expect(locator, `${description} is visible`).toBeVisible();
     |                                                      ^ Error: Account menu item with the email customer-1792595465329-e2770300@example.test is visible
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
  19 |   await expect(locator, `${description} has the text "${text}"`).toHaveText(text);
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