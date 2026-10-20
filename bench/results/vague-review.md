# Vague set: each change next to the precise text (vague-review)

Source: `bench/vague-review.mjs`, 2026-10-20T13:54:41.968Z. Precise: `test-cases`. Vague: `test-cases-vague`.
76 changed parts. 49 expected-result cells in all.

| TC | Where | Precise | Vague |
|---|---|---|---|
| TC-01 | step 2 | The page shows the error `Invalid email or password.` The login page stays open. | The page shows an error message that says the login fails. The login page stays open. |
| TC-02 | step 1 | The list shows the product with its name, its price `8.99¤` and the button `Add to Basket`. The basket counter in the top bar shows `0`. | The list shows the product with its name, its correct price and the button `Add to Basket`. The basket counter in the top bar shows the correct number. |
| TC-02 | step 2 | A message shows `Placed Eggfruit Juice (500ml) into basket.` The basket counter shows `1`. | A message says the product is in the basket. The basket counter shows the correct number. |
| TC-02 | step 3 | The basket page `/#/basket` shows one row: `Eggfruit Juice (500ml)`, quantity `1`, price `8.99¤`. | The basket page `/#/basket` shows the correct number of rows: `Eggfruit Juice (500ml)`, the correct quantity, the correct price. |
| TC-02 | step 4 | The basket shows `Total Price: 8.99¤`. | The basket shows the correct total price. |
| TC-02 | Test data | \| Product \| `Eggfruit Juice (500ml)`, price `8.99¤` \| | \| Product \| `Eggfruit Juice (500ml)` \| |
| TC-03 | step 1 | The basket shows product A with quantity `1` and product B with quantity `1`. The basket shows `Total Price: 13.98¤`. The basket counter shows `2`. | The basket shows product A with the correct quantity and product B with the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| TC-03 | step 2 | Product A has quantity `2`. The basket shows `Total Price: 18.97¤`. The basket counter shows `3`. | Product A has the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| TC-03 | step 3 | Product A has quantity `1`. The basket shows `Total Price: 13.98¤`. The basket counter shows `2`. | Product A has the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| TC-03 | step 4 | Product A keeps quantity `1`. The row of product A stays in the basket. The basket shows `Total Price: 13.98¤`. | Product A keeps the correct quantity. The row of product A stays in the basket. The basket shows the correct total price. |
| TC-03 | step 5 | The basket has no row for product A. The row of product B stays with quantity `1`. The basket shows `Total Price: 8.99¤`. The basket counter shows `1`. | The basket has no row for product A. The row of product B stays with the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| TC-03 | Test data | \| Product A \| `Raspberry Juice (1000ml)`, price `4.99¤` \| | \| Product A \| `Raspberry Juice (1000ml)` \| |
| TC-03 | Test data | \| Product B \| `Eggfruit Juice (500ml)`, price `8.99¤` \| | \| Product B \| `Eggfruit Juice (500ml)` \| |
| TC-03 | Test data | In each step, the basket total is the sum of price × quantity for all rows. | (removed) |
| TC-04 | step 1 | A message shows `Placed Apple Juice (1000ml) into basket.` The basket counter shows `1`. | A message says the product is in the basket. The basket counter shows the correct number. |
| TC-04 | step 2 | The product has quantity `5`. The basket shows `Total Price: 9.95¤`. No error message shows. | The product has the correct quantity. The basket shows the correct total price. No error message shows. |
| TC-04 | step 3 | An error message shows `You can order only up to 5 items of this product.` | An error message says the product is at its limit. |
| TC-04 | step 4 | The product keeps quantity `5`. The basket shows `Total Price: 9.95¤`. The basket counter shows `5`. | The product keeps the correct quantity. The basket shows the correct total price. The basket counter shows the correct number. |
| TC-04 | step 5 | An error message shows `You can order only up to 5 items of this product.` The basket counter shows `5`. | An error message says the product is at its limit. The basket counter shows the correct number. |
| TC-04 | Test data | \| Product \| `Apple Juice (1000ml)`, price `1.99¤` \| | \| Product \| `Apple Juice (1000ml)` \| |
| TC-04 | Test data | \| Limit \| 5 items in one basket \| | (removed) |
| TC-05 | step 2 | The page `Choose a delivery speed` shows `One Day Delivery` with price `0.99¤`, `Fast Delivery` with `0.50¤` and `Standard Delivery` with `0.00¤`. | The page `Choose a delivery speed` shows `One Day Delivery` with the correct price, `Fast Delivery` with the correct price and `Standard Delivery` with the correct price. |
| TC-05 | step 4 | The page shows `Your discount of 10% will be applied during checkout.` | The page shows a message that says the coupon lowers the price at checkout. |
| TC-05 | step 5 | The page `Order Summary` shows `Items` `17.98¤`, `Delivery` `0.99¤`, `Promotion` `1.80¤` and `Total Price` `17.17¤`. | The page `Order Summary` shows the correct items, delivery, promotion and total price. |
| TC-05 | Test data | \| Product \| `Eggfruit Juice (500ml)`, price `8.99¤`, quantity 2 \| | \| Product \| `Eggfruit Juice (500ml)`, quantity 2 \| |
| TC-05 | Test data | \| Delivery \| `One Day Delivery`, price `0.99¤` \| | \| Delivery \| `One Day Delivery` \| |
| TC-05 | Test data | \| Coupon \| the 10% coupon of the current month, see `README.md` \| | \| Coupon \| the coupon of the current month, see `README.md` \| |
| TC-05 | Test data | Expected order summary: | (removed) |
| TC-05 | Test data | \| Line \| Calculation \| Value \| | (removed) |
| TC-05 | Test data | \| `Items` \| 2 × 8.99 \| `17.98¤` \| | (removed) |
| TC-05 | Test data | \| `Delivery` \| price of `One Day Delivery` \| `0.99¤` \| | (removed) |
| TC-05 | Test data | \| `Promotion` \| 10% of `Items` \| `1.80¤` \| | (removed) |
| TC-05 | Test data | \| `Total Price` \| `Items` − `Promotion` + `Delivery` \| `17.17¤` \| | (removed) |
| TC-06 | step 3 | The page shows the error `Invalid coupon.` The page does not show `Your discount of`. | The page shows an error message that says the shop rejects the code. The page does not show a message about a discount. |
| TC-06 | step 4 | The page shows the error `Invalid coupon.` The page does not show `Your discount of`. | The page shows an error message that says the shop rejects the code. The page does not show a message about a discount. |
| TC-06 | step 5 | The page `Order Summary` shows `Items` `17.98¤`, `Delivery` `0.99¤`, `Promotion` `0.00¤` and `Total Price` `18.97¤`. | The page `Order Summary` shows the correct items, delivery, promotion and total price. |
| TC-06 | Test data | \| Product \| `Eggfruit Juice (500ml)`, price `8.99¤`, quantity 2 \| | \| Product \| `Eggfruit Juice (500ml)`, quantity 2 \| |
| TC-06 | Test data | \| Delivery \| `One Day Delivery`, price `0.99¤` \| | \| Delivery \| `One Day Delivery` \| |
| TC-06 | Test data | \| Expired coupon \| the 10% coupon of the previous month, see `README.md` \| | \| Expired coupon \| the coupon of the previous month, see `README.md` \| |
| TC-06 | Test data | Expected order summary, without a discount: | (removed) |
| TC-06 | Test data | \| Line \| Value \| | (removed) |
| TC-06 | Test data | \| `Items` \| `17.98¤` \| | (removed) |
| TC-06 | Test data | \| `Delivery` \| `0.99¤` \| | (removed) |
| TC-06 | Test data | \| `Promotion` \| `0.00¤` \| | (removed) |
| TC-06 | Test data | \| `Total Price` \| `18.97¤` \| | (removed) |
| TC-07 | step 1 | The basket counter shows `3`. | The basket counter shows the correct number. |
| TC-07 | step 2 | The basket shows product A with quantity `2` and product B with quantity `1`. The basket shows `Total Price: 20.97¤`. | The basket shows product A with the correct quantity and product B with the correct quantity. The basket shows the correct total price. |
| TC-07 | step 5 | The page shows `Your discount of 10% will be applied during checkout.` | The page shows a message that says the coupon lowers the price at checkout. |
| TC-07 | step 6 | The page `Order Summary` shows the saved address, the card, `Items` `20.97¤`, `Delivery` `0.99¤`, `Promotion` `2.10¤` and `Total Price` `19.86¤`. | The page `Order Summary` shows the saved address, the card, the correct items, delivery, promotion and total price. |
| TC-07 | step 7 | The confirmation page `/#/order-completion/<order ID>` shows `Thank you for your purchase!` | The confirmation page `/#/order-completion/<order ID>` shows a message that says the shop accepts the order. |
| TC-07 | step 8 | It shows product A with quantity `2`, product B with quantity `1`, `Items` `20.97¤`, `Delivery` `0.99¤`, `Promotion` `2.10¤` and `Total Price` `19.86¤`. | It shows product A with the correct quantity, product B with the correct quantity, the correct items, delivery, promotion and total price. |
| TC-07 | step 9 | The basket counter shows `0`. The basket has no products. The button `Checkout` is disabled. | The basket counter shows the correct number. The basket has no products. The button `Checkout` is disabled. |
| TC-07 | step 10 | The page `Order History` shows one order with the order ID from step 7 and `Total Price` `19.86¤`. The order shows product A with quantity `2` and product B with quantity `1`. | The page `Order History` shows the correct number of orders with the order ID from step 7 and the correct total price. The order shows product A with the correct quantity and product B with the correct quantity. |
| TC-07 | Test data | \| Product A \| `Eggfruit Juice (500ml)`, price `8.99¤`, quantity 2 \| | \| Product A \| `Eggfruit Juice (500ml)`, quantity 2 \| |
| TC-07 | Test data | \| Product B \| `Carrot Juice (1000ml)`, price `2.99¤`, quantity 1 \| | \| Product B \| `Carrot Juice (1000ml)`, quantity 1 \| |
| TC-07 | Test data | \| Delivery \| `One Day Delivery`, price `0.99¤` \| | \| Delivery \| `One Day Delivery` \| |
| TC-07 | Test data | \| Coupon \| the 10% coupon of the current month, see `README.md` \| | \| Coupon \| the coupon of the current month, see `README.md` \| |
| TC-07 | Test data | Expected totals: | (removed) |
| TC-07 | Test data | \| Line \| Calculation \| Value \| | (removed) |
| TC-07 | Test data | \| `Items` \| 2 × 8.99 + 1 × 2.99 \| `20.97¤` \| | (removed) |
| TC-07 | Test data | \| `Delivery` \| price of `One Day Delivery` \| `0.99¤` \| | (removed) |
| TC-07 | Test data | \| `Promotion` \| 10% of `Items` \| `2.10¤` \| | (removed) |
| TC-07 | Test data | \| `Total Price` \| `Items` − `Promotion` + `Delivery` \| `19.86¤` \| | (removed) |
| TC-08 | step 2 | The page `My Payment Options` shows `Wallet Balance` `5.00` and the button `Pay 8.99¤`. | The page `My Payment Options` shows the correct wallet balance and the button `Pay` with the correct amount. |
| TC-08 | step 4 | The page shows `You have not placed any orders yet.` | The page shows a message that says the order history is empty. |
| TC-08 | step 5 | The wallet balance is `5.00`. | The wallet balance is correct. |
| TC-08 | step 6 | The page `My Payment Options` shows `Wallet Balance` `8.99` and the button `Pay 8.99¤`. The button is enabled. | The page `My Payment Options` shows the correct wallet balance and the button `Pay` with the correct amount. The button is enabled. |
| TC-08 | step 7 | The page `Order Summary` shows the payment method `Digital Wallet` and `Total Price` `8.99¤`. | The page `Order Summary` shows the payment method `Digital Wallet` and the correct total price. |
| TC-08 | step 8 | The confirmation page shows `Thank you for your purchase!` | The confirmation page shows a message that says the shop accepts the order. |
| TC-08 | step 9 | The wallet balance is `1.00`: 8.99 − 8.99 + 1 bonus point. | The wallet balance is correct. |
| TC-08 | step 10 | The page shows one order with `Total Price` `8.99¤` and `Bonus` `1`. | The page shows the correct number of orders with the correct total price and bonus. |
| TC-08 | Test data | \| Product \| `Eggfruit Juice (500ml)`, price `8.99¤`, quantity 1 \| | \| Product \| `Eggfruit Juice (500ml)`, quantity 1 \| |
| TC-08 | Test data | \| Delivery \| `Standard Delivery`, price `0.00¤` \| | \| Delivery \| `Standard Delivery` \| |
| TC-08 | Test data | \| Order total \| `8.99¤` \| | (removed) |
| TC-08 | Test data | \| Bonus points of the order \| round(8.99 / 10) × 1 = `1` \| | (removed) |
| TC-08 | Steps | Part 2: the wallet holds exactly the order total. Before step 6, add `3.99` to the wallet with the saved card. The balance is then `8.99¤`. | Part 2: the wallet holds exactly the order total. Before step 6, add `3.99` to the wallet with the saved card. |

## Other changes

None.
