# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login with a valid and an invalid password >> login with a wrong and then a correct password
- Location: tests/login.spec.ts:8:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('menu').first()
Expected substring: "tc-1792591362827-71551513@example.test"
Received string:    " account_circle  mut@example.test  check_circle_outline  Orders & Payment  security  Privacy & Security  power_settings_new  Logout "
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('menu').first() with timeout 5000ms
  - waiting for getByRole('menu').first()
    - locator resolved to <div role="menu" tabindex="-1" id="mat-menu-panel-0" class="mat-mdc-menu-panel mat-menu-after mat-menu-below">…</div>
    2 × unexpected value " account_circle  mut@example.test  check_circle_outline  Orders & Payment  security  Privacy & Security  power_settings_new  Logout "
      - locator resolved to <div role="menu" tabindex="-1" id="mat-menu-panel-0" class="mat-mdc-menu-panel mat-menu-after mat-menu-below mat-menu-panel-animating">…</div>
    11 × unexpected value " account_circle  mut@example.test  check_circle_outline  Orders & Payment  security  Privacy & Security  power_settings_new  Logout "
       - locator resolved to <div role="menu" tabindex="-1" id="mat-menu-panel-0" class="mat-mdc-menu-panel mat-menu-after mat-menu-below">…</div>
    - unexpected value " account_circle  mut@example.test  check_circle_outline  Orders & Payment  security  Privacy & Security  power_settings_new  Logout "

```

```yaml
- menu:
  - menuitem "Go to user profile": mut@example.test
  - menuitem "Show Orders and Payment Menu": Orders & Payment
  - menuitem "Show Privacy and Security Menu": Privacy & Security
  - menuitem "Logout"
```

# Test source

```ts
  1  | import { expect, test } from './fixtures';
  2  | import { LoginPage } from './pages/login';
  3  | import { TopBar } from './pages/shop';
  4  | 
  5  | test.describe('Login with a valid and an invalid password', {
  6  |   annotation: { type: 'test-case', description: 'TC-01' },
  7  | }, () => {
  8  |   test('login with a wrong and then a correct password', async ({ page, customer }) => {
  9  |     const login = new LoginPage(page);
  10 |     const topBar = new TopBar(page);
  11 |     const wrongPassword = `${customer.password}x`;
  12 | 
  13 |     await test.step('1. Open the login page', async () => {
  14 |       await login.goto();
  15 |       await login.expectForm();
  16 |     });
  17 | 
  18 |     await test.step('2. Log in with the wrong password', async () => {
  19 |       await login.login(customer.email, wrongPassword);
  20 |       await expect(login.invalidCredentialsError).toBeVisible();
  21 |       await expect(page).toHaveURL(/#\/login/);
  22 |     });
  23 | 
  24 |     await test.step('3. The account menu shows Login and not the email', async () => {
  25 |       await topBar.openAccountMenu();
  26 |       await expect(topBar.accountMenu.getByRole('menuitem').filter({ hasText: 'Login' })).toBeVisible();
  27 |       await expect(topBar.accountMenu).not.toContainText(customer.email);
  28 |     });
  29 | 
  30 |     await test.step('4. Log in with the correct password', async () => {
  31 |       await page.keyboard.press('Escape');
  32 |       await login.login(customer.email, customer.password);
  33 |       await expect(page).toHaveURL(/#\/search/);
  34 |     });
  35 | 
  36 |     await test.step('5. The account menu shows the email and Logout', async () => {
  37 |       await topBar.openAccountMenu();
> 38 |       await expect(topBar.accountMenu).toContainText(customer.email);
     |                                        ^ Error: expect(locator).toContainText(expected) failed
  39 |       await expect(topBar.accountMenu.getByRole('menuitem', { name: 'Logout', exact: true })).toBeVisible();
  40 |     });
  41 |   });
  42 | });
  43 | 
```