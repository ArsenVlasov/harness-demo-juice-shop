# Review checklist: ready to merge

Use this checklist for each copy `suite-<k>` in E5a (plan v2).
The criteria apply to each copy in the same way.
They are general criteria for Playwright tests that come from test cases.
They do not come from the rules of a harness.

## Rules for the reviewer

1. Review only the copies. The default folder of the copies is `harness-demo-runs/review/`.
2. Do not open the source suites during the review.
3. Do not open `bench/results/review-mapping.json` before each copy has the event `stop`.
4. Use the same criteria and the same severity scale for each copy.
5. Make all edits in the copy. The command `git diff` in the copy shows the edits.
6. Record each event with `bench/review-timer.mjs`. Pause the timer for each break.
7. Review one copy at a time. Pause the timer of a copy before you start or resume a different copy.
8. Do the review only when no agent run is active. During a run of `bench/claude-locked.sh`, the copies have mode 000.
9. Pause the timer before an agent run starts. Resume the timer after the run ends.

Known limit: the reviewer knows the test cases and the harness. The README must state this limit.

## Timer commands

Run the commands from the lab folder.

| Step | Command |
|---|---|
| Start the review | `node bench/review-timer.mjs start suite-1` |
| Record an issue | `node bench/review-timer.mjs issue suite-1 "<text>" --severity major` |
| Start a fix | `node bench/review-timer.mjs fix-start suite-1 <issue no>` |
| End the fix | `node bench/review-timer.mjs fix-end suite-1` |
| Pause the timer | `node bench/review-timer.mjs pause suite-1` |
| Continue after a pause | `node bench/review-timer.mjs resume suite-1` |
| End the review | `node bench/review-timer.mjs stop suite-1` |
| Show the results | `node bench/review-timer.mjs summary` |

## Severity

| Severity | Rule | Examples |
|---|---|---|
| `blocker` | The suite cannot merge with this issue. | A test fails. A test case has no test. An expected result has no check. |
| `major` | The test can give a wrong result. | A weak check. A fixed wait. Shared data. A test that needs a different test. |
| `minor` | The test gives a true result, but people cannot easily read or change it. | An unclear name. A long locator that works. |

## Checklist

### 1. Steps and expected results

- [ ] Each test case has a test. The reviewer can find the test for each test case.
- [ ] The test does each step of the test case in the UI, in the order of the test case.
- [ ] Preconditions can use the API.
- [ ] Each expected result has a check. A wrong value makes the test fail.
- [ ] The check uses the exact value from the test case: the text, the number or the price.
- [ ] If the test case gives no exact value, the check uses a specific value.
- [ ] A check that an element is visible is not sufficient for an expected value.
- [ ] The test does not calculate the expected value with the same logic as the app.
- [ ] A log line, a comment or an unchecked value is not a check.

### 2. Waits

- [ ] The tests do not use fixed waits: no `waitForTimeout`, no `setTimeout`, no sleep.
- [ ] The tests wait for a state: an assertion that retries, a URL, a response or a visible element.

### 3. Isolation and data

- [ ] Each test makes the data that it needs, or it uses data that no test changes.
- [ ] No test changes data that a different test uses.
- [ ] No test needs a different test to run first. The order of the tests does not change the results.
- [ ] Each test passes when it runs alone: `npx playwright test <file> -g "<title>"`.

### 4. Locators

- [ ] The locators use the role, the label, the text or a test ID.
- [ ] The locators do not use long CSS chains or XPath chains.
- [ ] The locators do not use an index without a reason.

### 5. Names

- [ ] The name of each test tells what the test checks.
- [ ] The names of the files and the helpers tell what they hold.

### 6. Stability

- [ ] No test has `test.only`, `test.skip` or `test.fixme`.
- [ ] The copy passes 3 runs in a row on a new app start. Use the procedure below.

Do these steps for each copy. The app uses port 3000. The measurement scripts use the same port.

1. Make sure that no measurement runs.
2. Pause the timer: `node bench/review-timer.mjs pause suite-<k>`.
3. In the lab folder, run `[ -z "$(git -C juice-shop status --porcelain)" ] && echo clean`.
4. If the command does not print `clean`, stop the review and tell the lab session. Do not look at the changed files.
5. Restart the app with a new server build: `bench/start-app.sh stop && bench/start-app.sh start`.
6. Resume the timer: `node bench/review-timer.mjs resume suite-<k>`.
7. In the copy, run `npx playwright test --retries=0` 3 times in a row. All tests pass in each run.

Each app start gives each product a random stock of 30 to 99 items. Some tests buy items in each run.
Thus, do not do more than 5 runs on one app start. A run of one test is also a run.
Before more runs, do steps 1 to 6 again.

## Ready to merge

The copy is ready to merge when these 3 conditions are true:

1. Each `blocker` issue and each `major` issue has a fix.
2. Each checklist item is true, or the log has a `minor` issue for the item.
3. The last 3 runs in a row pass.

Then record the event `stop` for the copy.
