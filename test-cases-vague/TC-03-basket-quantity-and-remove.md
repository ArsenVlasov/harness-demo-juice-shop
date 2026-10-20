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
| Product A | `Raspberry Juice (1000ml)` |
| Product B | `Eggfruit Juice (500ml)` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the basket `/#/basket`. | The basket shows product A with the correct quantity and product B with the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| 2 | Click the plus button in the row of product A. | Product A has the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| 3 | Click the minus button in the row of product A. | Product A has the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| 4 | Click the minus button in the row of product A again. | Product A keeps the correct quantity. The row of product A stays in the basket. The basket shows the correct total price. |
| 5 | Click the trash button in the row of product A. | The basket has no row for product A. The row of product B stays with the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
