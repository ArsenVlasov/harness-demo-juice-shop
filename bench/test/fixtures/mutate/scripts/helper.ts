import { expect } from '@playwright/test';

// The site finder skips the scripts/ folder, so this assertion is no site.
export function scriptCheck(): void {
  expect(1).toBe(1);
}
