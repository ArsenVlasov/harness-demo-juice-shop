# TC-03: Change the quantity and remove a product in the basket

| Field | Value |
|---|---|
| ID | TC-03 |
| Title | Change the quantity and remove a product in the basket |
| Area | Basket |

## Preconditions

1. A new customer account exists.
2. The customer is logged in.
3. The basket holds product A with quantity 1 and product B with quantity 1. No other products are in the basket.

## Test data

| Name | Value |
|---|---|
| Product A | `Raspberry Juice (1000ml)`, price `4.99¤` |
| Product B | `Eggfruit Juice (500ml)`, price `8.99¤` |

In each step, the basket total is the sum of price × quantity for all rows.

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the basket `/#/basket`. | The basket shows product A with quantity `1` and product B with quantity `1`. The basket shows `Total Price: 13.98¤`. The basket counter shows `2`. |
| 2 | Click the plus button in the row of product A. | Product A has quantity `2`. The basket shows `Total Price: 18.97¤`. The basket counter shows `3`. |
| 3 | Click the minus button in the row of product A. | Product A has quantity `1`. The basket shows `Total Price: 13.98¤`. The basket counter shows `2`. |
| 4 | Click the minus button in the row of product A again. | Product A keeps quantity `1`. The row of product A stays in the basket. The basket shows `Total Price: 13.98¤`. |
| 5 | Click the trash button in the row of product A. | The basket has no row for product A. The row of product B stays with quantity `1`. The basket shows `Total Price: 8.99¤`. The basket counter shows `1`. |
