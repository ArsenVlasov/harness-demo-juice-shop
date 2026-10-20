import { test, expect } from '@playwright/test';
import { TOTAL } from '../data/constants';

const label = 'Total: 17.17¤';
const apiError = { message: 'Invalid coupon.', status: 'error' };

// A helper in the spec file, outside a test: a site here selects the whole spec file.
function checkLabel(text: string): void {
  expect(text).toContain('Total');
}

test('expect style', async () => {
  const total = 17;
  const price = 8.99;
  const cart = { name: 'Apple', items: [1] };
  const soft = expect.configure({ soft: true });
  const box = { check: (options: { force: boolean }) => options };
  expect(total).toBe(17);
  expect(label).not.toContain('Refund');
  expect.soft(label).toMatch(/Total: \d+/);
  await expect.poll(() => total, { timeout: 1000, intervals: [100, 200] }).toBe(17);
  expect(-1, 'below zero').toBeLessThan(0);
  expect(total).not.toBeLessThan(17);
  expect(price).toBeCloseTo(8.99, 2);
  expect(cart).toEqual({ name: 'Apple', items: [1] });
  expect(cart).toEqual(expect.objectContaining({ name: 'Apple' }));
  expect(label).toEqual(expect.not.stringContaining('Refund'));
  expect(apiError).toMatchObject({ message: 'Invalid coupon.' });
  expect(apiError).toHaveProperty('status', 'error');
  expect(label).toMatch(/Total|Refund/);
  soft(label).toContain('Total');
  box.check({ force: true });
  expect(total).toBe(TOTAL);
  expect(`${total}`).toBe(`17`);
  expect(label.length > 0).toBe(true);
  await expect(async () => {
    expect(total).toBe(17);
  }).toPass({ timeout: 500 });
  checkLabel(label);
});

test('fails at the baseline', async () => {
  expect(1).toBe(2);
});
