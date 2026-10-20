import { test as base } from '@playwright/test';
import { LoginPage } from '@/pages';

// The fixture `ready` is automatic: it runs for each test of this test object.
export const test = base.extend<{ login: LoginPage; ready: void }>({
  login: async ({}, use) => {
    await use(new LoginPage({ title: 'Login', ready: true }));
  },
  ready: [
    async ({ login }, use) => {
      await login.shouldBeReady();
      await use();
    },
    { auto: true },
  ],
});
