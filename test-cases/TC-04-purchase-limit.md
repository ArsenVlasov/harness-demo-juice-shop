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
| Product | `Apple Juice (1000ml)`, price `1.99¤` |
| Limit | 5 items in one basket |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the product list `/#/search`. Click `Add to Basket` on the product. | A message shows `Placed Apple Juice (1000ml) into basket.` The basket counter shows `1`. |
| 2 | Open the basket `/#/basket`. Click the plus button in the row of the product until the quantity is `5`. | The product has quantity `5`. The basket shows `Total Price: 9.95¤`. No error message shows. |
| 3 | Click the plus button in the row of the product one more time. | An error message shows `You can order only up to 5 items of this product.` |
| 4 | Read the basket. | The product keeps quantity `5`. The basket shows `Total Price: 9.95¤`. The basket counter shows `5`. |
| 5 | Open the product list `/#/search`. Click `Add to Basket` on the product. | An error message shows `You can order only up to 5 items of this product.` The basket counter shows `5`. |
