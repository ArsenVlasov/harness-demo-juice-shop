# TC-08: Payment with the wallet

| Field | Value |
|---|---|
| ID | TC-08 |
| Title | Payment with the wallet |
| Area | Wallet |

The customer can pay an order with the money in the wallet.
The wallet must hold at least the order total.
After each order, the shop adds the bonus points of the order to the wallet: 1 point = `1.00¤`.
The bonus points of one product are the product price divided by 10, rounded to a whole number, × quantity.

## Preconditions

1. A new customer account exists.
2. The customer is logged in.
3. The customer has one saved address and one saved card. The values are in `README.md`.
   The shop adds money to the wallet only with a saved card.
4. The basket holds the product with quantity 1. No other products are in the basket.
5. The wallet balance is `5.00¤`. To get this balance, add `5` to the wallet of the new account with the saved card. A new account has the balance `0.00¤`.

## Test data

| Name | Value |
|---|---|
| Product | `Eggfruit Juice (500ml)`, quantity 1 |
| Delivery | `Standard Delivery` |
| First balance | `5.00¤`, less than the order total |
| Top-up for part 2 | `3.99¤`, so that the balance is exactly the order total |

## Steps

Part 1: the wallet holds less than the order total.

| # | Step | Expected result |
|---|---|---|
| 1 | Open the basket `/#/basket`. Click `Checkout`. Select the saved address. Click `Continue`. | The page `Choose a delivery speed` opens. |
| 2 | Select `Standard Delivery`. Click `Continue`. | The page `My Payment Options` shows the correct wallet balance and the button `Pay` with the correct amount. |
| 3 | Read the button `Pay 8.99¤`. | The button is disabled. The customer cannot pay with the wallet. |
| 4 | Open the account menu. Click `Orders & Payment`, then `Order History`. | The page shows a message that says the order history is empty. |
| 5 | Open the account menu. Click `Orders & Payment`, then `Digital Wallet`. | The wallet balance is correct. |

Part 2: the wallet holds exactly the order total. Before step 6, add `3.99` to the wallet with the saved card.

| # | Step | Expected result |
|---|---|---|
| 6 | Open the basket `/#/basket`. Click `Checkout`. Select the saved address. Click `Continue`. Select `Standard Delivery`. Click `Continue`. | The page `My Payment Options` shows the correct wallet balance and the button `Pay` with the correct amount. The button is enabled. |
| 7 | Click `Pay 8.99¤`. | The page `Order Summary` shows the payment method `Digital Wallet` and the correct total price. |
| 8 | Click `Place your order and pay`. | The confirmation page shows a message that says the shop accepts the order. |
| 9 | Open the account menu. Click `Orders & Payment`, then `Digital Wallet`. | The wallet balance is correct. |
| 10 | Open the account menu. Click `Orders & Payment`, then `Order History`. | The page shows the correct number of orders with the correct total price and bonus. |
