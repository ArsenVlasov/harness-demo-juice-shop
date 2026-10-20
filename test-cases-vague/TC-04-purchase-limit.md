# TC-04: Purchase limit for one product

| Field | Value |
|---|---|
| ID | TC-04 |
| Title | Purchase limit for one product |
| Area | Basket |

Some products have a limit: one basket can hold only a set number of items of the product.

## Preconditions

1. A new customer account exists. It is a normal customer account, not a deluxe account.
2. The customer is logged in.
3. The basket of the customer is empty.

## Test data

| Name | Value |
|---|---|
| Product | `Apple Juice (1000ml)` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the product list `/#/search`. Click `Add to Basket` on the product. | A message says the product is in the basket. The basket counter shows the correct number. |
| 2 | Open the basket `/#/basket`. Click the plus button in the row of the product until the quantity is `5`. | The product has the correct quantity. The basket shows the correct total price. No error message shows. |
| 3 | Click the plus button in the row of the product one more time. | An error message says the product is at its limit. |
| 4 | Read the basket. | The product keeps the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| 5 | Open the product list `/#/search`. Click `Add to Basket` on the product. | An error message says the product is at its limit. The basket counter shows the correct number. |
