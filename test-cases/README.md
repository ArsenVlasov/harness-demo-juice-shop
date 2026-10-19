# Test cases: OWASP Juice Shop v20.3.0

These test cases describe what must work for a customer of the shop.
Each file holds one test case with these parts:

- ID and title
- preconditions
- test data
- steps, with one expected result for each step

## Test environment

- The app is OWASP Juice Shop v20.3.0 at `http://localhost:3000`.
- The app runs in quiet mode (`NODE_ENV=quiet`). Quiet mode turns off the welcome banner, the challenge notifications and the hints.
- The app creates a new database at each start.
- The cookie banner shows on the first visit. The cookie `cookieconsent_status=dismiss` hides it.
- The UI language is English.
- The app shows prices with the sign `¤`.

## Test data rules

- Each test case uses a new customer account. Register the account before the test. Each account has a unique email.
- The account is a normal customer account, not a deluxe account. A deluxe account gets other prices and no purchase limit.
- A test case must not use data from another test case.
- Product names and prices come from the shop catalog of v20.3.0.

## Saved address and saved card

Some test cases need a saved address or a saved card. Create them before the test with these values.

| Field | Value |
|---|---|
| Address: `Country` | `Ukraine` |
| Address: `Name` | `Test Customer` |
| Address: `Mobile Number` | `501234567` |
| Address: `ZIP Code` | `01001` |
| Address: `Address` | `1 Khreshchatyk Street` |
| Address: `City` | `Kyiv` |
| Address: `State` | `Kyiv` |
| Card: `Name` | `Test Customer` |
| Card: `Card Number` | `4111111111111111` |
| Card: `Expiry Month` | `12` |
| Card: `Expiry Year` | `2090` |

## Coupon codes

The shop accepts a coupon only in the month that the coupon names.
A coupon code is the Z85 encoding (ZeroMQ RFC 32) of the text `<MMM><YY>-<NN>`:

- `<MMM>` is the month in capital letters: `JAN`, `FEB`, `MAR`, `APR`, `MAY`, `JUN`, `JUL`, `AUG`, `SEP`, `OCT`, `NOV`, `DEC`.
- `<YY>` is the last two digits of the year.
- `<NN>` is the discount in percent, with two digits.

Calculate the code when the test runs. Use the date of the machine that runs the app.
The npm package `z85` does the encoding: `z85.encode('OCT26-10')`.

Examples for October 2026:

| Text | Code | Meaning in October 2026 |
|---|---|---|
| `OCT26-10` | `pEw8phz3Tq` | valid coupon, 10% discount |
| `SEP26-10` | `q:<Irhz3Tq` | expired coupon, it names the previous month |

## Test cases

| ID | Title |
|---|---|
| TC-01 | Login with a valid and an invalid password |
| TC-02 | Add a product to the basket |
| TC-03 | Change the quantity and remove a product in the basket |
| TC-04 | Purchase limit for one product |
| TC-05 | Valid coupon on the payment step |
| TC-06 | Invalid coupon and expired coupon |
| TC-07 | Order with a card, from basket to order history |
| TC-08 | Payment with the wallet |
