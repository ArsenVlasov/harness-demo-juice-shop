// Tests for bench/weakening.mjs. Run: node --test bench/test/weakening.test.mjs
// The first two tests are ported from scripts/loop/stabilize.test.mjs of gerchik-autotest-project, with neutral names.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { assertionCounts, valueCheckCounts, weakening } from '../weakening.mjs'

const CLI = fileURLToPath(new URL('../weakening.mjs', import.meta.url))

// Ported from the source.

test('weakening: a skip, a fixed wait, retries and a timeout are findings', () => {
  const diff = [
    '--- a/tests/x.spec.ts',
    '+++ b/tests/x.spec.ts',
    "+test.skip('flaky', async () => {});",
    '+    await this.page.waitForTimeout(3000);',
    '+test.describe.configure({ retries: 2 });',
    '+    test.setTimeout(500_000);',
    '+    await this.options.waitFor({ state: "visible" });'
  ].join('\n')
  const found = weakening(diff)
  assert.equal(found.length, 4)
  assert.match(found.join('\n'), /test\.skip/)
  assert.match(found.join('\n'), /waitForTimeout/)
})

test('weakening: a removed should call is a finding, and a commented-out one does not count as added', () => {
  const removed = '-    await basketPage.shouldShowItem(productName);\n+    await basketPage.checkout();'
  assert.equal(weakening(removed).length, 1)
  const commented = '-    await x.shouldShowItem(t);\n+    // await x.shouldShowItem(t);'
  assert.equal(weakening(commented).length, 1)
  const moved = '-    await x.shouldShowItem(t);\n+    await x.shouldShowItem(t, { exact });'
  assert.deepEqual(weakening(moved), [])
})

// The other source patterns, one line each.

test('weakening: each source pattern gives one finding', () => {
  for (const line of ["+test.fixme('x', async () => {})", "+test.describe.only('x', () => {})", "+test.fail('x', async () => {})", '+describe.skip(() => {})']) {
    assert.match(weakening(line)[0], /a skipped, focused or expected-to-fail test/, line)
  }
  assert.deepEqual(weakening("+test('basket total', async ({ page }) => {})"), [])
})

test('weakening: the header lines of a diff are not code', () => {
  assert.deepEqual(weakening('--- a/tests/skip.spec.ts\n+++ b/tests/test.skip.spec.ts'), [])
})

// New: the count of expect calls and Playwright matchers.

test('assertionCounts: expect( and the matcher count as 2 calls, on each side', () => {
  const diff = [
    "-    await expect(page.getByText('Total')).toHaveText('5.98');",
    "+    await expect(page.getByText('Total')).toHaveText('6.98');"
  ].join('\n')
  assert.deepEqual(assertionCounts(diff), { added: 2, removed: 2 })
  assert.deepEqual(valueCheckCounts(diff), { added: 1, removed: 1 })
  assert.deepEqual(weakening(diff), [])
})

test('assertionCounts: expect.soft, expect.poll and each matcher family count', () => {
  const diff = [
    '+    expect.soft(total).toBe(5)',
    '+    await expect.poll(() => api.count()).toEqual(3)',
    '+    expect(list).toStrictEqual([1])',
    "+    await expect(page).toHaveURL(/basket/)",
    "+    await expect(row).toContainText('Apple')",
    "+    expect(name).toMatch(/Juice/)",
    '+    expect(flag).toBeTruthy()',
    '+    expect(() => parse()).toThrow()',
    "+    await expect(toast).not.toBeVisible()",
    '+    await basketPage.shouldShowTotal(5)'
  ].join('\n')
  assert.deepEqual(assertionCounts(diff), { added: 19, removed: 0 })
  // Value checks: toBe, toEqual, toStrictEqual, toHaveURL, toContainText, toMatch and shouldShowTotal. Not toBeTruthy, toThrow, toBeVisible.
  assert.deepEqual(valueCheckCounts(diff), { added: 7, removed: 0 })
})

test('assertionCounts: a matcher on its own line counts, comments and similar names do not', () => {
  const diff = [
    '+    await expect(page)',
    "+      .toHaveTitle('OWASP Juice Shop')",
    "+    // await expect(page).toHaveTitle('x')",
    '+     * expect(x).toBe(1)',
    '+    const r = myexpect(x)',
    '+    reporter.toBeDone = true',
    '+    async shouldShowTotal (total) {'
  ].join('\n')
  assert.deepEqual(assertionCounts(diff), { added: 2, removed: 0 })
})

test('weakening: a removed expect is a finding with the counts', () => {
  const diff = [
    '--- a/tests/basket.spec.ts',
    '+++ b/tests/basket.spec.ts',
    '@@ -10,3 +10,2 @@',
    "     await page.getByRole('button', { name: 'Checkout' }).click();",
    "-    await expect(page.getByText('Order confirmed')).toBeVisible();",
    "-    await expect(page.getByTestId('total')).toHaveText('5.98');",
    "+    await expect(page.getByText('Order confirmed')).toBeVisible();"
  ].join('\n')
  assert.deepEqual(assertionCounts(diff), { added: 2, removed: 4 })
  assert.deepEqual(weakening(diff), [
    'removed 2 assertion call(s) more than it added (removed 4, added 2)',
    'removed 1 value check(s) more than it added (removed 1, added 0): a check of a value was removed or became a check of presence or state'
  ])
})

test('weakening: an assertion that moves into a new page object is not a finding', () => {
  const diff = [
    'diff --git a/tests/basket.spec.ts b/tests/basket.spec.ts',
    '--- a/tests/basket.spec.ts',
    '+++ b/tests/basket.spec.ts',
    '@@ -1,1 +1,1 @@',
    "-    await expect(page.getByTestId('total')).toHaveText('5.98');",
    "+    await basketPage.shouldShowTotal('5.98');",
    'diff --git a/page-objects/basket-page.ts b/page-objects/basket-page.ts',
    'new file mode 100644',
    '--- /dev/null',
    '+++ b/page-objects/basket-page.ts',
    '@@ -0,0 +1,3 @@',
    '+  async shouldShowTotal (total: string) {',
    "+    await expect(this.page.getByTestId('total')).toHaveText(total);",
    '+  }'
  ].join('\n')
  assert.deepEqual(assertionCounts(diff), { added: 3, removed: 2 })
  assert.deepEqual(weakening(diff), [])
})

// New: test.slow and a larger timeout.

test('weakening: an added test.slow is a finding', () => {
  assert.deepEqual(weakening('+    test.slow();'), ['added a slow test (test.slow): test.slow();'])
  assert.equal(weakening("+test.describe.slow('x', () => {})").length, 1)
  assert.deepEqual(weakening("-    test.slow();\n+    await expect(x).toBeVisible();"), [])
})

test('weakening: a larger timeout value is a finding, the same or a smaller one is not', () => {
  const larger = "-    await expect(row).toBeVisible({ timeout: 5000 });\n+    await expect(row).toBeVisible({ timeout: 30_000 });"
  assert.deepEqual(weakening(larger), ['added a larger timeout (timeout: 5000 to 30_000): await expect(row).toBeVisible({ timeout: 30_000 });'])
  const product = "-  timeout: 60_000,\n+  timeout: 2 * 60_000,"
  assert.match(weakening(product)[0], /a larger timeout \(timeout: 60_000 to 2 \* 60_000\)/)
  assert.deepEqual(weakening("-  { timeout: 10000 }\n+  { timeout: 10_000 }"), [])
  assert.deepEqual(weakening("-  { timeout: 10000 }\n+  { timeout: 5000 }"), [])
})

test('weakening: a new timeout option is a finding, a moved one in the same hunk is not', () => {
  assert.deepEqual(weakening("+    await page.getByText('Basket').click({ timeout: 15000 });"),
    ["added a timeout option (timeout: 15000): await page.getByText('Basket').click({ timeout: 15000 });"])
  const moved = ['@@ -1,3 +1,3 @@', '-  use: { actionTimeout: 10000 },', '+  use: { baseURL, actionTimeout: 10000 },'].join('\n')
  assert.deepEqual(weakening(moved), [])
  const otherKey = ['-  use: { actionTimeout: 10000 },', '+  use: { navigationTimeout: 10000 },'].join('\n')
  assert.match(weakening(otherKey)[0], /a timeout option \(navigationTimeout: 10000\)/)
})

test('weakening: a timeout option that moves to another hunk or file with the same value is not a finding', () => {
  const moved = [
    'diff --git a/tests/basket.spec.ts b/tests/basket.spec.ts',
    '@@ -1,1 +1,1 @@',
    "-    await page.getByText('Basket').click({ timeout: 10000 });",
    "+    await basketPage.open();",
    'diff --git a/page-objects/basket-page.ts b/page-objects/basket-page.ts',
    '@@ -9,0 +9,1 @@',
    "+    await this.link.click({ timeout: 10_000 });"
  ].join('\n')
  assert.deepEqual(weakening(moved), [])
  const larger = ['@@ -1,1 +1,0 @@', '-  { timeout: 5000 }', '@@ -9,0 +9,1 @@', '+  { timeout: 30000 }'].join('\n')
  assert.deepEqual(weakening(larger), ['added a larger timeout (timeout: 5000 to 30000): { timeout: 30000 }'])
})

test('weakening: a timeout with a name is a finding only when the text changes', () => {
  assert.deepEqual(weakening('-  { timeout: SHORT }\n+  { timeout: SHORT }'), [])
  assert.match(weakening('-  { timeout: SHORT }\n+  { timeout: LONG }')[0], /a changed timeout \(timeout: SHORT to LONG\)/)
  assert.deepEqual(weakening('+  // { timeout: 99000 }'), [])
})

test('the CLI reads a diff on stdin, prints the counts and exits 1 on a finding', () => {
  const run = input => spawnSync(process.execPath, [CLI], { input, encoding: 'utf8' })
  const bad = run("-    await expect(x).toBeVisible();\n+    test.slow();\n")
  assert.equal(bad.status, 1)
  assert.match(bad.stdout, /assertion calls: added 0, removed 2/)
  assert.match(bad.stdout, /test\.slow/)
  const clean = run("+    await expect(x).toBeVisible();\n")
  assert.equal(clean.status, 0)
  assert.equal(clean.stdout, 'assertion calls: added 2, removed 0\nvalue checks: added 0, removed 0\n')
})

// New (review 1): assertion wrappers, value checks, .catch and more time rules.

test('assertionCounts: wrapper calls with and without a receiver count, definitions and "expected" names do not', () => {
  const diff = [
    "+    await expectText(this.totalPrice, SHOP_MESSAGES.totalPrice(amount), 'Basket total');",
    "+    await expectStaysHidden(this.row(product), 'Basket row');",
    '+    await this.shouldSeePage();',
    '+      await summary.expectTotals({ total: 5 });',
    '+    expect(flag).toBe(true)',
    "+    assert.equal(rows, 2)",
    '+export async function expectText(',
    '+export function expectCount(locator: Locator, count: number): void {',
    '+  async shouldSeeTotalPrice(amount: string): Promise<void> {',
    '+  shouldSeeLine(line: BasketLine): Promise<void> {',
    '+  public shouldSeePage() {',
    '+    const expectedTotals = expectedPrice(3);'
  ].join('\n')
  // expectText, expectStaysHidden, shouldSeePage, expectTotals, expect + toBe, assert.equal.
  assert.deepEqual(assertionCounts(diff), { added: 7, removed: 0 })
  // expectText, expectTotals and toBe.
  assert.deepEqual(valueCheckCounts(diff), { added: 3, removed: 0 })
})

test('weakening: the removed wrapper checks of a page object are findings (suite B style)', () => {
  const diff = [
    '--- a/page-objects/basket-page.ts',
    '+++ b/page-objects/basket-page.ts',
    '@@ -92,12 +92,10 @@',
    '   async shouldSeeTotalPrice(amount: string): Promise<void> {',
    "-    await expectText(this.totalPrice, SHOP_MESSAGES.totalPrice(amount), 'Basket total');",
    "+    await expectVisible(this.totalPrice, 'Basket total');",
    '   }',
    "-    await expectText(this.quantity(product), String(quantity), 'Quantity');",
    "-    await expectCount(this.rows, lines.length, 'rows');"
  ].join('\n')
  assert.deepEqual(assertionCounts(diff), { added: 1, removed: 3 })
  assert.deepEqual(weakening(diff), [
    'removed 2 assertion call(s) more than it added (removed 3, added 1)',
    'removed 3 value check(s) more than it added (removed 3, added 0): a check of a value was removed or became a check of presence or state'
  ])
})

test('weakening: a removed page-object check in a spec is a finding (suite A style)', () => {
  const diff = ['-      await summary.expectTotals({', '+      await summary.shouldSeePage();'].join('\n')
  assert.deepEqual(assertionCounts(diff), { added: 1, removed: 1 })
  assert.match(weakening(diff).join('\n'), /removed 1 value check\(s\) more than it added/)
})

test('weakening: a value check that becomes a presence check is a finding, in both styles', () => {
  const a = ["-    await expect(btn).toHaveText('Checkout');", '+    await expect(btn).toBeVisible();'].join('\n')
  assert.deepEqual(assertionCounts(a), { added: 2, removed: 2 })
  assert.deepEqual(weakening(a), ['removed 1 value check(s) more than it added (removed 1, added 0): a check of a value was removed or became a check of presence or state'])
  const b = ["-    await expectText(this.button, 'Checkout', 'Button');", "+    await expectVisible(this.button, 'Button');"].join('\n')
  assert.deepEqual(weakening(b), weakening(a))
})

test('weakening: an added .catch on an assertion is a finding, also on the next line', () => {
  assert.deepEqual(weakening('+    await expect(toast).toHaveText(msg).catch(() => {});'),
    ['added a .catch on an assertion (its failure does not fail the test): await expect(toast).toHaveText(msg).catch(() => {});'])
  const next = ['+    await expect(toast)', '+      .toBeVisible()', '+      .catch(() => {});'].join('\n')
  assert.equal(weakening(next).length, 1)
  assert.deepEqual(weakening("+    await page.goto('/').catch(() => {});"), [])
})

test('weakening: test.info().slow(), testInfo.slow() and setDefaultTimeout are findings', () => {
  for (const line of ['+    test.info().slow();', '+    testInfo.slow();', '+    page.setDefaultTimeout(60000);', '+    page.setDefaultNavigationTimeout(60000);']) {
    assert.equal(weakening(line).length, 1, line)
  }
  assert.deepEqual(weakening('+  use: { launchOptions: { slowMo: 500 } },'), [])
})

test('weakening: secondsToMs(n) and minutesToMs(n) compare as numbers', () => {
  const larger = ['-    await expect(row).toBeVisible({ timeout: DateHelper.secondsToMs(5) });', '+    await expect(row).toBeVisible({ timeout: DateHelper.secondsToMs(30) });'].join('\n')
  assert.deepEqual(weakening(larger), ['added a larger timeout (timeout: DateHelper.secondsToMs(5) to DateHelper.secondsToMs(30)): await expect(row).toBeVisible({ timeout: DateHelper.secondsToMs(30) });'])
  assert.deepEqual(weakening('-  { timeout: 60000 }\n+  { timeout: minutesToMs(1) }'), [])
  assert.match(weakening('-  { timeout: secondsToMs(30) }\n+  { timeout: minutesToMs(1) }')[0], /a larger timeout/)
})

test('weakening: a changed time constant is a finding in each direction, a type annotation is not a timeout', () => {
  const shorter = ['-export const HOLD_WINDOW_MS = DateHelper.secondsToMs(2);', '+export const HOLD_WINDOW_MS = DateHelper.secondsToMs(1);'].join('\n')
  assert.deepEqual(weakening(shorter), ['added a changed time constant (HOLD_WINDOW_MS: DateHelper.secondsToMs(2) to DateHelper.secondsToMs(1)): export const HOLD_WINDOW_MS = DateHelper.secondsToMs(1);'])
  assert.deepEqual(weakening('+const LOAD_TIMEOUT = 5000;'), [])
  assert.deepEqual(weakening('+  async waitForTotal(timeout: number = 5000): Promise<void> {'), [])
})
