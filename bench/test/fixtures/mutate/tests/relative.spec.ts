import { test } from '@playwright/test';
import { CartPage } from '../pages';
import { checkWithRetry } from '../utils/assertions';

test('relative barrel import', async () => {
  const cart = new CartPage({ title: 'Cart', total: '0.00', count: 0, items: [] });
  await cart.shouldStayEmpty();
  checkWithRetry(5, { retries: 3, delay: 10 });
});
