import { test } from './fixtures';

test('login page', async ({ login }) => {
  await login.shouldSeePage();
});

// This test does not call shouldSeePage. The automatic fixture `ready` runs for it too.
test('only the automatic fixture', async () => {});
