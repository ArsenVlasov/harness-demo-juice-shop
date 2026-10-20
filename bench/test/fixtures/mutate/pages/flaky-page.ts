import { expect } from '@playwright/test';

// Only tests/flaky.spec.ts imports this file, and its test does not call this function.
export function shouldBeQuiet(state: string): void {
  expect(state).toBe('quiet');
}
