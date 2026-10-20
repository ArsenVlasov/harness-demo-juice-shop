# TC-05: Valid coupon on the payment step

| Field | Value |
|---|---|
| ID | TC-05 |
| Title | Valid coupon on the payment step |
| Area | Coupon |

The discount of a coupon applies to the price of the products only. The delivery price does not get the discount.

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
| Coupon | the coupon of the current month, see `README.md` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the basket `/#/basket`. Click `Checkout`. | The page `Select an address` shows the saved address. |
| 2 | Select the saved address. Click `Continue`. | The page `Choose a delivery speed` shows `One Day Delivery` with the correct price, `Fast Delivery` with the correct price and `Standard Delivery` with the correct price. |
| 3 | Select `One Day Delivery`. Click `Continue`. | The page `My Payment Options` shows the saved card and the panel `Add a coupon`. |
| 4 | Open the panel `Add a coupon`. Type the coupon code in the field `Coupon`. Click `Redeem`. | The page shows a message that says the coupon lowers the price at checkout. |
| 5 | Select the saved card. Click `Continue`. | The page `Order Summary` shows the correct items, delivery, promotion and total price. |
