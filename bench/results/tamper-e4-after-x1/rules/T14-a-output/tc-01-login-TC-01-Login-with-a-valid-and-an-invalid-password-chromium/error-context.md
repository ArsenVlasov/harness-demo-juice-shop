# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-01-login.spec.ts >> TC-01: Login with a valid and an invalid password
- Location: tests/tc-01-login.spec.ts:6:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('menu').first()
Expected substring: "tc-01-1792588646574-avip2t@example.test"
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
  1  | import { test, expect } from './support/fixtures';
  2  | 
  3  | /** Any email address, not only the email of this customer. */
  4  | const ANY_EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  5  | 
  6  | test('TC-01: Login with a valid and an invalid password', async ({ page, customer, loginPage, navBar }) => {
  7  |   const wrongPassword = `${customer.password}x`;
  8  | 
  9  |   await test.step('1. Open the login page', async () => {
  10 |     await loginPage.open();
  11 |     await expect(loginPage.title).toHaveText('Login');
  12 |     await expect(page.getByText('Email', { exact: true })).toBeVisible();
  13 |     await expect(loginPage.emailInput).toBeVisible();
  14 |     await expect(page.getByText('Password', { exact: true })).toBeVisible();
  15 |     await expect(loginPage.passwordInput).toBeVisible();
  16 |     await expect(loginPage.loginButton).toHaveText(/Log in/);
  17 |   });
  18 | 
  19 |   await test.step('2. Log in with the wrong password', async () => {
  20 |     await loginPage.submit(customer.email, wrongPassword);
  21 |     await expect(loginPage.errorMessage).toHaveText('Invalid email or password.');
  22 |     await expect(page).toHaveURL(/#\/login/);
  23 |     await expect(loginPage.title).toBeVisible();
  24 |   });
  25 | 
  26 |   await test.step('3. The account menu shows Login and no email', async () => {
  27 |     await navBar.openAccountMenu();
  28 |     await expect(navBar.loginMenuItem).toBeVisible();
  29 |     await expect(navBar.loginMenuItem).toHaveText(/Login/);
  30 |     await expect(navBar.accountMenu).not.toContainText(ANY_EMAIL);
  31 |     await expect(navBar.logoutMenuItem).toBeHidden();
  32 |   });
  33 | 
  34 |   await test.step('4. Close the menu and log in with the correct password', async () => {
  35 |     await navBar.closeMenu();
  36 |     await loginPage.submit(customer.email, customer.password);
  37 |     await expect(page).toHaveURL(/#\/search/);
  38 |   });
  39 | 
  40 |   await test.step('5. The account menu shows the email and Logout', async () => {
  41 |     await navBar.openAccountMenu();
> 42 |     await expect(navBar.accountMenu).toContainText(customer.email);
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  43 |     await expect(navBar.logoutMenuItem).toBeVisible();
  44 |     await expect(navBar.loginMenuItem).toBeHidden();
  45 |   });
  46 | });
  47 | 
```