# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/regression/payment/invalid-coupon.spec.ts >> Invalid coupon and expired coupon
- Location: tests/specs/regression/payment/invalid-coupon.spec.ts:15:5

# Error details

```
Error: Order summary: delivery has the text "0.99¤"

expect(locator).toHaveText(expected) failed

Locator:  locator('app-order-summary').locator('tr').filter({ has: locator('td.label').filter({ hasText: 'Delivery' }) }).locator('td.price')
Expected: "0.99¤"
Received: "1.99¤"
Timeout:  5000ms

Call log:
  - Order summary: delivery has the text "0.99¤" locator('app-order-summary').locator('tr').filter({ has: locator('td.label').filter({ hasText: 'Delivery' }) }).locator('td.price') with timeout 5000ms
  - waiting for locator('app-order-summary').locator('tr').filter({ has: locator('td.label').filter({ hasText: 'Delivery' }) }).locator('td.price')
    14 × locator resolved to <td class="mat-cell price" _ngcontent-ng-c4138824240="">1.99¤</td>
       - unexpected value "1.99¤"

```

```yaml
- cell "1.99¤"
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
     |                                                                  ^ Error: Order summary: delivery has the text "0.99¤"
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