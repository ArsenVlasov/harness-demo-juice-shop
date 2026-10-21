# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-01-login.spec.ts >> TC-01: Login with a valid and an invalid password >> login with a wrong and then a correct password
- Location: tests/tc-01-login.spec.ts:6:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('menu').first()
Expected substring: "tc-1792582869785-f5007d28@example.test"
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
  5  | test.describe('TC-01: Login with a valid and an invalid password', () => {
  6  |   test('login with a wrong and then a correct password', async ({ page, customer }) => {
  7  |     const login = new LoginPage(page);
  8  |     const topBar = new TopBar(page);
  9  |     const wrongPassword = `${customer.password}x`;
  10 | 
  11 |     await test.step('1. Open the login page', async () => {
  12 |       await login.goto();
  13 |       await expect(login.heading).toBeVisible();
  14 |       await expect(login.emailField).toBeVisible();
  15 |       await expect(login.passwordField).toBeVisible();
  16 |       await expect(login.loginButton).toBeVisible();
  17 |     });
  18 | 
  19 |     await test.step('2. Log in with the wrong password', async () => {
  20 |       await login.login(customer.email, wrongPassword);
  21 |       await expect(login.invalidCredentialsError).toBeVisible();
  22 |       await expect(page).toHaveURL(/#\/login/);
  23 |     });
  24 | 
  25 |     await test.step('3. The account menu shows Login and not the email', async () => {
  26 |       await topBar.openAccountMenu();
  27 |       await expect(topBar.accountMenu.getByRole('menuitem').filter({ hasText: 'Login' })).toBeVisible();
  28 |       await expect(topBar.accountMenu).not.toContainText(customer.email);
  29 |     });
  30 | 
  31 |     await test.step('4. Log in with the correct password', async () => {
  32 |       await page.keyboard.press('Escape');
  33 |       await login.login(customer.email, customer.password);
  34 |       await expect(page).toHaveURL(/#\/search/);
  35 |     });
  36 | 
  37 |     await test.step('5. The account menu shows the email and Logout', async () => {
  38 |       await topBar.openAccountMenu();
> 39 |       await expect(topBar.accountMenu).toContainText(customer.email);
     |                                        ^ Error: expect(locator).toContainText(expected) failed
  40 |       await expect(topBar.accountMenu.getByRole('menuitem', { name: 'Logout', exact: true })).toBeVisible();
  41 |     });
  42 |   });
  43 | });
  44 | 
```