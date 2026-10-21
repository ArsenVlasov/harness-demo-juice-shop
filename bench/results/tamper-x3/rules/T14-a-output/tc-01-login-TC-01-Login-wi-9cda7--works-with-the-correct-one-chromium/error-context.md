# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-01-login.spec.ts >> TC-01: Login with a valid and an invalid password >> TC-01 login fails with a wrong password and works with the correct one
- Location: tests/tc-01-login.spec.ts:4:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('menuitem', { name: 'Go to user profile' })
Expected substring: "tc-01-1792593722885-0f0g33@example.test"
Received string:    " account_circle  mut@example.test "
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('menuitem', { name: 'Go to user profile' }) with timeout 5000ms
  - waiting for getByRole('menuitem', { name: 'Go to user profile' })
    14 × locator resolved to <button tabindex="0" role="menuitem" mat-menu-item="" _ngcontent-ng-c1731522247="" aria-label="Go to user profile" class="mat-mdc-menu-item mat-focus-indicator cdk-focused cdk-mouse-focused">…</button>
       - unexpected value " account_circle  mut@example.test "

```

```yaml
- menuitem "Go to user profile": mut@example.test
```

# Test source

```ts
  1  | import { test, expect } from './fixtures';
  2  | 
  3  | test.describe('TC-01: Login with a valid and an invalid password', () => {
  4  |   test('TC-01 login fails with a wrong password and works with the correct one', async ({
  5  |     page,
  6  |     customer,
  7  |     loginPage,
  8  |     navBar,
  9  |   }) => {
  10 |     const wrongPassword = `${customer.password}x`;
  11 | 
  12 |     await test.step('1. Open the login page', async () => {
  13 |       await loginPage.goto();
  14 |       await expect(loginPage.title).toBeVisible();
  15 |       await expect(loginPage.emailInput).toBeVisible();
  16 |       await expect(loginPage.passwordInput).toBeVisible();
  17 |       await expect(loginPage.loginButton).toBeVisible();
  18 |       await expect(loginPage.loginButton).toHaveText(/Log in/);
  19 |     });
  20 | 
  21 |     await test.step('2. Log in with the wrong password', async () => {
  22 |       await loginPage.login(customer.email, wrongPassword);
  23 |       await expect(loginPage.errorMessage).toHaveText('Invalid email or password.');
  24 |       await expect(page).toHaveURL(/#\/login/);
  25 |       await expect(loginPage.title).toBeVisible();
  26 |     });
  27 | 
  28 |     await test.step('3. Open the account menu: nobody is logged in', async () => {
  29 |       await navBar.openAccountMenu();
  30 |       await expect(navBar.loginMenuItem).toBeVisible();
  31 |       await expect(navBar.accountMenu).not.toContainText(customer.email);
  32 |       await expect(navBar.logoutMenuItem).toBeHidden();
  33 |     });
  34 | 
  35 |     await test.step('4. Close the menu and log in with the correct password', async () => {
  36 |       await navBar.closeMenu();
  37 |       await loginPage.login(customer.email, customer.password);
  38 |       await expect(page).toHaveURL(/#\/search/);
  39 |     });
  40 | 
  41 |     await test.step('5. Open the account menu: the customer is logged in', async () => {
  42 |       await navBar.openAccountMenu();
> 43 |       await expect(navBar.profileMenuItem).toContainText(customer.email);
     |                                            ^ Error: expect(locator).toContainText(expected) failed
  44 |       await expect(navBar.logoutMenuItem).toBeVisible();
  45 |     });
  46 |   });
  47 | });
  48 | 
```