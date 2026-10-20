import { test } from '@playwright/test';
import { CartPage } from '@/pages';

test('should style', async () => {
  const cart = new CartPage({ title: 'Cart', total: '17.17', count: 2, items: [{ name: 'Apple', qty: 1 }] });
  await cart.checkout('express');
  await cart.shouldHaveTotal('17.17');
  await cart.shouldShowTotal('17.17');
  await cart.shouldHaveCount(2);
  await cart.shouldHaveTitle('Cart', 'Cart page title');
  await cart.verifyItems([{ name: 'Apple', qty: 1 }]);
});
