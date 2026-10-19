# TC-07: Order with a card, from basket to order history

| Field | Value |
|---|---|
| ID | TC-07 |
| Title | Order with a card, from basket to order history |
| Area | Checkout |

The basket page and the order summary calculate the totals in the browser.
The shop server calculates the total again when it saves the order.
The order confirmation page and the order history show the total that the server saved.

## Preconditions

1. A new customer account exists.
2. The customer is logged in.
3. The customer has one saved address and one saved card. The values are in `README.md`.
4. The basket of the customer is empty.

## Test data

| Name | Value |
|---|---|
| Product A | `Eggfruit Juice (500ml)`, price `8.99¤`, quantity 2 |
| Product B | `Carrot Juice (1000ml)`, price `2.99¤`, quantity 1 |
| Delivery | `One Day Delivery`, price `0.99¤` |
| Coupon | the 10% coupon of the current month, see `README.md` |

Expected totals:

| Line | Calculation | Value |
|---|---|---|
| `Items` | 2 × 8.99 + 1 × 2.99 | `20.97¤` |
| `Delivery` | price of `One Day Delivery` | `0.99¤` |
| `Promotion` | 10% of `Items` | `2.10¤` |
| `Total Price` | `Items` − `Promotion` + `Delivery` | `19.86¤` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the product list `/#/search`. Click `Add to Basket` on product A two times. Click `Add to Basket` on product B one time. | The basket counter shows `3`. |
| 2 | Open the basket `/#/basket`. | The basket shows product A with quantity `2` and product B with quantity `1`. The basket shows `Total Price: 20.97¤`. |
| 3 | Click `Checkout`. Select the saved address. Click `Continue`. | The page `Choose a delivery speed` opens. |
| 4 | Select `One Day Delivery`. Click `Continue`. | The page `My Payment Options` opens. |
| 5 | Open the panel `Add a coupon`. Type the coupon code. Click `Redeem`. | The page shows `Your discount of 10% will be applied during checkout.` |
| 6 | Select the saved card. Click `Continue`. | The page `Order Summary` shows the saved address, the card, `Items` `20.97¤`, `Delivery` `0.99¤`, `Promotion` `2.10¤` and `Total Price` `19.86¤`. |
| 7 | Click `Place your order and pay`. | The confirmation page `/#/order-completion/<order ID>` shows `Thank you for your purchase!` |
| 8 | Read the order summary on the confirmation page. | It shows product A with quantity `2`, product B with quantity `1`, `Items` `20.97¤`, `Delivery` `0.99¤`, `Promotion` `2.10¤` and `Total Price` `19.86¤`. |
| 9 | Read the basket counter. Open the basket `/#/basket`. | The basket counter shows `0`. The basket has no products. The button `Checkout` is disabled. |
| 10 | Open the account menu. Click `Orders & Payment`, then `Order History`. | The page `Order History` shows one order with the order ID from step 7 and `Total Price` `19.86¤`. The order shows product A with quantity `2` and product B with quantity `1`. |
