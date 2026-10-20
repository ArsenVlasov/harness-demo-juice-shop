# TC-06: Invalid coupon and expired coupon

| Field | Value |
|---|---|
| ID | TC-06 |
| Title | Invalid coupon and expired coupon |
| Area | Coupon |

The shop must not give a discount for a code that is not a coupon. The shop must not give a discount for a coupon of a past month.

## Preconditions

1. A new customer account exists.
2. The customer is logged in.
3. The customer has one saved address and one saved card. The values are in `README.md`.
4. The basket holds the product with quantity 2. No other products are in the basket.

## Test data

| Name | Value |
|---|---|
| Product | `Eggfruit Juice (500ml)`, quantity 2 |
| Delivery | `One Day Delivery` |
| Invalid code | `abcdefghij`, 10 characters, not a coupon |
| Expired coupon | the coupon of the previous month, see `README.md` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the basket `/#/basket`. Click `Checkout`. Select the saved address. Click `Continue`. | The page `Choose a delivery speed` opens. |
| 2 | Select `One Day Delivery`. Click `Continue`. | The page `My Payment Options` opens. |
| 3 | Open the panel `Add a coupon`. Type the invalid code in the field `Coupon`. Click `Redeem`. | The page shows an error message that says the shop rejects the code. The page does not show a message about a discount. |
| 4 | Type the expired coupon in the field `Coupon`. Click `Redeem`. | The page shows an error message that says the shop rejects the code. The page does not show a message about a discount. |
| 5 | Select the saved card. Click `Continue`. | The page `Order Summary` shows the correct items, delivery, promotion and total price. |
