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
| Product A | `Eggfruit Juice (500ml)`, quantity 2 |
| Product B | `Carrot Juice (1000ml)`, quantity 1 |
| Delivery | `One Day Delivery` |
| Coupon | the coupon of the current month, see `README.md` |

## Steps

| # | Step | Expected result |
|---|---|---|
| 1 | Open the product list `/#/search`. Click `Add to Basket` on product A two times. Click `Add to Basket` on product B one time. | The basket counter shows the correct number. |
| 2 | Open the basket `/#/basket`. | The basket shows product A with the correct quantity and product B with the correct quantity. The basket shows the correct total price. |
| 3 | Click `Checkout`. Select the saved address. Click `Continue`. | The page `Choose a delivery speed` opens. |
| 4 | Select `One Day Delivery`. Click `Continue`. | The page `My Payment Options` opens. |
| 5 | Open the panel `Add a coupon`. Type the coupon code. Click `Redeem`. | The page shows a message that says the coupon lowers the price at checkout. |
| 6 | Select the saved card. Click `Continue`. | The page `Order Summary` shows the saved address, the card, the correct items, delivery, promotion and total price. |
| 7 | Click `Place your order and pay`. | The confirmation page `/#/order-completion/<order ID>` shows a message that says the shop accepts the order. |
| 8 | Read the order summary on the confirmation page. | It shows product A with the correct quantity, product B with the correct quantity, the correct items, delivery, promotion and total price. |
| 9 | Read the basket counter. Open the basket `/#/basket`. | The basket counter shows the correct number. The basket has no products. The button `Checkout` is disabled. |
| 10 | Open the account menu. Click `Orders & Payment`, then `Order History`. | The page `Order History` shows the correct number of orders with the order ID from step 7 and the correct total price. The order shows product A with the correct quantity and product B with the correct quantity. |
