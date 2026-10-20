import fs from 'node:fs';
import { test } from '@playwright/test';
import { shouldBeQuiet } from '../pages/flaky-page';

// Passes at its first run in a copy of the suite and fails at each later run, like a flaky test.
// It imports shouldBeQuiet, so a mutant in that function selects this spec file, but it does not call it.
test('flaky after the first run', async () => {
  const marker = `${__filename}.ran`;
  const first = !fs.existsSync(marker);
  fs.writeFileSync(marker, 'ran');
  if (!first) throw new Error('flaky failure');
});
