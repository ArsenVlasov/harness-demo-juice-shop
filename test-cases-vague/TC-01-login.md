# TC-01: Login with a valid and an invalid password

| Field | Value |
|---|---|
| ID | TC-01 |
| Title | Login with a valid and an invalid password |
| Area | Login |

## Preconditions

1. A customer account exists. The test knows its email and its password.
2. Nobody is logged in to the shop in the browser.

## Test data

| Name | Value |
|---|---|
| Email | the email of the new account, for example `tc01-<unique>@example.test` |
| Password | the password of the new account, for example `Passw0rd!tc01` |
| Wrong password | the account password with one more character, for example `Passw0rd!tc01x` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the login page `/#/login`. | The page shows the title `Login`, the fields `Email` and `Password`, and the button `Log in`. |
| 2 | Type the email and the wrong password. Click `Log in`. | The page shows an error message that says the login fails. The login page stays open. |
| 3 | Open the account menu with the button `Account` in the top bar. | The menu shows the item `Login`. The menu does not show the email. |
| 4 | Close the menu. Type the email and the correct password. Click `Log in`. | The shop opens the product list `/#/search`. |
| 5 | Open the account menu with the button `Account`. | The menu shows the email of the account. The menu shows the item `Logout`. |
