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
| Product | `Eggfruit Juice (500ml)`, price `8.99¤` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the product list `/#/search`. | The list shows the product with its name, its price `8.99¤` and the button `Add to Basket`. The basket counter in the top bar shows `0`. |
| 2 | Click `Add to Basket` on the product. | A message shows `Placed Eggfruit Juice (500ml) into basket.` The basket counter shows `1`. |
| 3 | Open the basket with the button `Your Basket` in the top bar. | The basket page `/#/basket` shows one row: `Eggfruit Juice (500ml)`, quantity `1`, price `8.99¤`. |
| 4 | Read the total of the basket. | The basket shows `Total Price: 8.99¤`. |
