import { expect, type Locator } from '@playwright/test';

export async function expectText(actual: Locator | string, text: string, description: string): Promise<void> {
  expect(actual, `${description} must have the text "${text}"`).toBe(text);
}

export async function expectNumber(actual: number, expected: number, description: string): Promise<void> {
  expect(actual, description).toBe(expected);
}

export function expectStaysEmpty(items: unknown[], description: string): void {
  const appeared = items.length > 0;
  expect(appeared, `${description} must stay empty`).toBe(false);
}

export function checkWithRetry(value: number, options: { retries: number; delay: number }): void {
  expect(value).toBeGreaterThan(options.retries + 1);
}
