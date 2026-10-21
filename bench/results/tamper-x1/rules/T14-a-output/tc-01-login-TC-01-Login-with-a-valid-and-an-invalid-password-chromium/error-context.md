# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-01-login.spec.ts >> TC-01: Login with a valid and an invalid password
- Location: tests/tc-01-login.spec.ts:3:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('menu').first()
Expected substring: "tc-01-1792580189402-3we8lu@example.test"
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
  3  | test('TC-01: Login with a valid and an invalid password', async ({ page, customer, loginPage, navBar }) => {
  4  |   const wrongPassword = `${customer.password}x`;
  5  | 
  6  |   await test.step('1. Open the login page', async () => {
  7  |     await loginPage.open();
  8  |     await expect(loginPage.title).toHaveText('Login');
  9  |     await expect(page.getByText('Email', { exact: true })).toBeVisible();
  10 |     await expect(loginPage.emailInput).toBeVisible();
  11 |     await expect(page.getByText('Password', { exact: true })).toBeVisible();
  12 |     await expect(loginPage.passwordInput).toBeVisible();
  13 |     await expect(loginPage.loginButton).toHaveText(/Log in/);
  14 |   });
  15 | 
  16 |   await test.step('2. Log in with the wrong password', async () => {
  17 |     await loginPage.submit(customer.email, wrongPassword);
  18 |     await expect(loginPage.errorMessage).toHaveText('Invalid email or password.');
  19 |     await expect(page).toHaveURL(/#\/login/);
  20 |     await expect(loginPage.title).toBeVisible();
  21 |   });
  22 | 
  23 |   await test.step('3. The account menu shows Login and no email', async () => {
  24 |     await navBar.openAccountMenu();
  25 |     await expect(navBar.loginMenuItem).toBeVisible();
  26 |     await expect(navBar.loginMenuItem).toHaveText(/Login/);
  27 |     await expect(navBar.accountMenu).not.toContainText(customer.email);
  28 |     await expect(navBar.logoutMenuItem).toBeHidden();
  29 |   });
  30 | 
  31 |   await test.step('4. Close the menu and log in with the correct password', async () => {
  32 |     await navBar.closeMenu();
  33 |     await loginPage.submit(customer.email, customer.password);
  34 |     await expect(page).toHaveURL(/#\/search/);
  35 |   });
  36 | 
  37 |   await test.step('5. The account menu shows the email and Logout', async () => {
  38 |     await navBar.openAccountMenu();
> 39 |     await expect(navBar.accountMenu).toContainText(customer.email);
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  40 |     await expect(navBar.logoutMenuItem).toBeVisible();
  41 |     await expect(navBar.loginMenuItem).toBeHidden();
  42 |   });
  43 | });
  44 | 
```