import { defineConfig } from '@playwright/test';

// The site finder skips *.config.ts files, so this call is no site.
const shouldNotBeScanned = (n: number): number => n;
shouldNotBeScanned(1);

export default defineConfig({ testDir: './tests', retries: 0, timeout: 10_000 });
