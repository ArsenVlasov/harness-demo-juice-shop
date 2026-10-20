# TC-02: Add a product to the basket

| Field | Value |
|---|---|
| ID | TC-02 |
| Title | Add a product to the basket |
| Area | Basket |

## Preconditions

1. A new customer account exists.
2. The customer is logged in.
3. The basket of the customer is empty.

## Test data

| Name | Value |
|---|---|
| Product | `Eggfruit Juice (500ml)` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the product list `/#/search`. | The list shows the product with its name, its correct price and the button `Add to Basket`. The basket counter in the top bar shows the correct number. |
| 2 | Click `Add to Basket` on the product. | A message says the product is in the basket. The basket counter shows the correct number. |
| 3 | Open the basket with the button `Your Basket` in the top bar. | The basket page `/#/basket` shows the correct number of rows: `Eggfruit Juice (500ml)`, the correct quantity, the correct price. |
| 4 | Read the total of the basket. | The basket shows the correct total price. |
