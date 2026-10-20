# Rule: from precise test cases to vague test cases

Status: draft for checkpoint 2 of the stage 2 plan. Arsen approves it. Nothing is frozen.
It follows the decisions 6 to 9 in section 10 of the stage 2 plan.

This rule makes the vague set `test-cases-vague/` from the precise set at the tag `test-cases-v1` (plan v2, experiment E2).
The vague set gets the tag `test-cases-v2-vague`.
A separate session applies the rule. That session sees only the precise set, this file and the check script.
The rule is mechanical: two people who apply it must get almost the same text.
For rules B and D, the text must be the same, character for character.
Rule D follows decision 6 of the plan v2 (20.10, 15:47): the test data keeps only the inputs.
The script `check-vague.mjs` (section 6) checks each part of the rule that a script can check.

## 1. Input and output of the session

- Input: a work folder with `test-cases/` from the tag `test-cases-v1`, this file as `vague-rule.md`, and `check-vague.mjs`. The folder holds nothing else.
- Output: the folder `test-cases-vague/` in the same work folder. It holds the same file names as `test-cases/`.
- The session also gives the output of the checks (section 6) and of the sha256 step (section 7).

## 2. What stays word for word

Only the parts in section 3 change. All other text stays the same, character for character:

- the file names
- `README.md`, all of it
- in each test case file: the title line, the field table (`ID`, `Title`, `Area`) and the text before `## Preconditions`
- the preconditions and all headings
- in each test data table: the header row and the separator row
- in each test data row that rule D keeps: the name of the row and each part of the value that rule D keeps
- in each text line of the sections `## Test data` and `## Steps`: each sentence that rule D keeps
- in the steps tables: the header row, the step numbers and the step column

In the column "Expected result", these parts also stay word for word, with their quotes:

- page titles
- names of buttons, fields, links, menu items, panels and tabs
- product names and other inputs from the test data
- routes, for example `/#/basket`
- references to other steps, for example "the ID from step 2"

## 3. What changes

Three parts change:

1. Each expected block outside the steps table (rule B).
2. The test data and the text lines outside the steps tables (rule D).
3. The column "Expected result" of the steps table (rules M, L, V, K and S).

Apply rule B first, then rule D, then the rules of the column "Expected result".

### Rule B: expected blocks

An expected block starts with a line that starts with the word `Expected`, for example `Expected order summary:`.
The block holds that line, the table under it and the empty lines around the table.

- Remove the line, the empty line after it, the table and the empty line after the table.
- Do not change the test data table above the block.

Reason: an expected block gives the expected results as a table. It is not test data, also when it stands under the heading `## Test data`.

### Rule D: test data and text lines

Rule D applies after rule B, to two parts of each test case file:

- the section `## Test data`: its table and its text lines
- the text lines of the section `## Steps` outside the steps tables

A text line is a line that is not empty and is not a heading or a table line.

Rule D keeps the inputs and removes the outputs:

- An input is a value that the test chooses. The user types it or selects it, or the test sets it before a step. Examples: a product name, a quantity, a coupon code, a password, the money that the test adds to the wallet.
- An output is a value that the app gives. Examples: a price, the discount of a coupon, the purchase limit, a total, bonus points, a balance that the app shows.

Reason (decision 6 of the plan v2): when the test data keeps the outputs, an agent calculates each expected value from the test data. Then the vague set gives the same ceiling as the precise set.

The script applies rule D. `node check-vague.mjs --classes test-cases` prints one line for each test data row and for each text line.
The line gives the class of each part or sentence in square brackets. After `=>`, it gives the new line, `REMOVE THE ROW` or `REMOVE THE LINE`.
A line that the output marks `NO CHANGE` stays word for word.
Copy each new line character for character. Do not decide a class by hand. Check C14 compares each line with the result of the script.

#### D1: the parts of a test data value

The value of a test data row is a list of parts. A comma and a space outside quotes end a part.
For example, "`Eggfruit Juice (500ml)`, price `8.99¤`, quantity 2" has three parts.

In rule D, a number is a digit outside a quoted text with a letter.
A reference to a step or to a part ("step 6", "part 2") is not a number. A number word ("one") is not a number.
Thus `Eggfruit Juice (500ml)`, `Passw0rd!tc01` and "one more character" hold no number.

A calculation is one of these signs outside quotes: `+`, `−`, `×`, `=`, or a `/` or a `-` between two spaces.
A word of the list `CALC` outside quotes is also a calculation, for example "sum" or "round".

Give each part one class. Use the first test in this list that matches:

| Order | Test | Class | Example |
|---|---|---|---|
| 1 | The part holds no number. | input | `Eggfruit Juice (500ml)`, "not a coupon" |
| 2 | The part holds a calculation. | output | "round(8.99 / 10) × 1 = `1`" |
| 3 | The part holds `%`. | output | "the 10% coupon of the current month" |
| 4 | The noun of the number is in the list `INPUT`: `quantity`, `characters`, `first balance`, `top-up`. | input | "quantity 2", "10 characters" |
| 5 | All other parts. | output | "price `8.99¤`", "5 items in one basket" |

The noun of the number is the first available item of this list:

1. The word directly before the number, when the list `NOT_NOUN` does not hold it. "price `8.99¤`" gives "price".
2. The word directly after the number, when the list `NOT_NOUN` does not hold it. "10 characters" gives "characters".
3. The name of the row, in lowercase. The row `Order total` with the value "`8.99¤`" gives "order total".

A noun matches an item of `INPUT` when the noun is the same as the item, or when it starts with the item and a space. Thus "top-up for part 2" matches `top-up`.
The items of `INPUT` are the inputs of the set that hold a number:

- `quantity`: the user sets the quantity in the basket.
- `characters`: the length of a code that the user types.
- `first balance` and `top-up`: the test adds this money to the wallet with the saved card.

Decision 6 names balances as outputs. Rule D keeps the first balance of TC-08 as an input, because the test sets it.
Precondition 5 of TC-08 adds `5` to the wallet of the new account, and it keeps `5.00¤` in any case.
Arsen approved this on 20.10 at 16:40 (stage 2 plan, section 10, decision 7).

The actions:

1. Keep each input part.
2. Remove each output part with the comma and the space before it. For the first part, remove the comma and the space after it.
3. Exception: the number of an output part can stand between an article (a, an, the) and a word. Then the number describes that word.
   Remove only the number, with its quotes and its sign, and the space after it. "the 10% coupon of the current month" becomes "the coupon of the current month".
   The exception does not apply to a calculation.

#### D2: a row with no part left

When rule D1 removes all parts of a value, remove the row. Do not write a neutral value in its place.
The header row and the separator row of a table always stay.

Reasons:

1. A neutral value is new text. Two people can write it in different words.
2. The steps table keeps the check of the value, for example "the correct total price" in TC-08 step 7. The row name alone is not an input.
3. Rule B removes an expected value outside the steps table in the same way.

In the set, rule D2 removes the row `Limit` of TC-04 and the rows `Order total` and `Bonus points of the order` of TC-08.

#### D3: text lines

Split each text line into sentences, as rule S does. Give each sentence one class. Use the first test in this list that matches:

| Order | Test | Class | Action |
|---|---|---|---|
| 1 | The first word, or the first word after the first comma, is in the list `ACTIONS`: add, click, close, enter, open, read, select, type. Quoted texts do not count. | action | Keep the sentence. |
| 2 | The sentence holds a calculation, as in rule D1. | calculation | Remove the sentence. |
| 3 | The sentence holds a number, as in rule D1. | result | Remove the sentence. |
| 4 | All other sentences. | kept | Keep the sentence. |

Remove a sentence with the space before it. For the first sentence, remove the space after it.
When no sentence of a line stays, remove the line and the empty line after it.
Do not apply rule V to a result sentence. Remove it.

Reasons:

1. An action sentence tells the user what to type or to select. Its values are inputs.
2. A calculation tells how the app calculates an output.
   An example is the line "In each step, the basket total is the sum of price × quantity for all rows." in TC-03.
3. A result sentence gives an expected result outside the steps table, as an expected block does (rule B). The steps table keeps the same check.
   For example, rule D3 removes "The balance is then `8.99¤`." in TC-08, and TC-08 step 6 checks the wallet balance.

### The class of each quoted text

A quoted text is a text in backticks. In the column "Expected result", give each quoted text one class.
Use the first test in this list that matches:

| Order | Test | Class | Rule |
|---|---|---|---|
| 1 | The text starts with `/`. | route | K |
| 2 | The text is directly followed by a value, with one space between them. Or the text has the form `<words>: <value>`. | label | L |
| 3 | The text ends with `.`, `!` or `?`. Or it has two or more words, and a message in any file of the set starts with it. | message | M |
| 4 | The text holds a digit and no letter, for example `8.99¤`, `2` or `10%`. | value | V |
| 5 | All other quoted texts. | kept | K |

The script prints the class of each quoted text and the phrases that each cell needs: `node check-vague.mjs --classes test-cases`.
Use this output. Do not decide a class or a phrase by hand.
A cell that the output marks `NO CHANGE` stays word for word.

### Rule M: message texts

1. Replace the quoted message text with one phrase:
   - "an error message that says <meaning>", when the same sentence calls the text an error
   - "a message that says <meaning>", in all other cases
2. Remove the words "the error", "the message" or "the text" directly before the quote. The new phrase replaces them.
3. When the subject of the sentence is "A message" or "An error message" and the verb is "shows", write "<subject> says <meaning>".
   Example: "A message shows `Email sent.`" becomes "A message says the shop sent the email."
4. When the quoted text is only the first part of a message, write "a message about <noun>".
   The noun is the main noun of the part. Example: "does not show `Your bonus of`" becomes "does not show a message about a bonus".

The meaning is one clause in the present simple, with 8 words or fewer. It must obey these limits:

- It holds no number and no quoted text.
- It holds no run of 3 words from the message text, in any letter case. For a message of 2 words, the limit is a run of 2 words.
- It holds a word of the message only when the test case file holds that word outside the column "Expected result". For this limit, use the file after rules B and D.
- It does not hold all the content words of the message.

Content words are all words except articles, pronouns, prepositions, conjunctions and auxiliary verbs. The script holds the full list (`STOP`).
Two words are the same word when their first 4 letters are the same. A word of 4 letters or fewer must be the same in full.
Product names and other inputs from the test data do not count as words of the message.
A word that the precise cell holds outside its quotes is not a content word of the message.

Example: the message `Unknown gift card.` in a test case that holds the words "gift card" in its title.
"the gift card is unknown" breaks the last two limits. "the code is wrong" obeys all limits.

### Rule L: labels

A label names a value on the page, for example `Subtotal` in "`Subtotal` `6.98¤`" or in "`Subtotal: 6.98¤`".

1. Replace the label and its value with "the correct <label>". Write the label in lowercase, without quotes.
   Example: "shows `Subtotal` `6.98¤`" becomes "shows the correct subtotal".
2. When two or more label and value pairs stand in one list, write "the correct" one time, before the first label.
   Example: "shows `Items` `6.98¤`, `Fee` `0.50¤` and `Total` `7.48¤`" becomes "shows the correct items, fee and total".

### Rule V: values

A value is a quoted text of the class "value", or a number outside quotes that is not a step number.

1. Remove the value. Write the word "correct" with a noun that names the value:
   - When a noun stands directly before the value, use that noun. "price `3.49¤`" becomes "the correct price".
   - When the verb "is" or "are" stands directly before the value, write "correct" alone. "The balance is `4.00`." becomes "The balance is correct."
   - In other cases, use the noun of the last value before it in the same sentence.
   - When no value stands before it, the noun depends on the value. Use "amount" for money (a value with `¤` or a decimal point).
     Use "percentage" for a value with `%`. Use "number" for a whole number.

   Words such as "shows", "with" and "and" are not nouns. The script holds the full list (`NOT_NOUN`).
2. Keep a possessive word ("its", "their") before the noun. In other cases, write "the". "its price `3.49¤`" becomes "its correct price".
3. A number word with a noun counts as a value. Replace both with "the correct number of <noun in the plural>".
   "shows one row" becomes "shows the correct number of rows". "shows two rows" also becomes "shows the correct number of rows".
   Reason: the vague text keeps the count as a requirement, but it does not give the count.
4. Remove each calculation, with the colon or the words that introduce it.
   A calculation holds numbers with `+`, `−`, `×`, `/`, `=` or "round". "is `0.00`: 4.00 − 4.00" becomes "is correct".

### Rule K: kept quoted texts

1. A kept quoted text stays word for word, with its quotes.
2. When a kept quoted text holds a value, remove the value from the quote. Then write "with the correct <noun>" after the quote.
   The noun depends only on the value: "amount" for money, "percentage" for a value with `%`, "number" for a whole number.
   Example: "the button `Pay 2.98¤`" becomes "the button `Pay` with the correct amount".

Page titles and the names of buttons, fields, links, menu items and panels stay. The reasons:

1. They show where the user is and what the user clicks. They are not results that the shop calculates.
2. The step column keeps them word for word. If only the expected result lost them, the two columns would not agree.
3. E2 measures one change: the expected values lose their exact form. If the page titles also go, a weak suite can come from lost navigation. Then E2 would mix two effects.
4. A vague test case in Jira also names the page, for example "the order summary page opens".

### Rule S: sentence length and style

1. A sentence in a cell has 25 words or fewer. Quoted texts do not count.
2. When a changed sentence has more than 25 words, split it in two at the comma nearest to the middle.
   Start the second sentence with the subject and the verb of the first sentence.
3. Use the verbs "shows" and "says" for messages. Do not use a semicolon.

A sentence ends with `.`, `!` or `?` before a space and a capital letter, or at the end of the cell. A quoted text can hold this end.

## 4. What the session must not do

- Do not add, remove, merge, split or reorder steps, rows, lines, sentences or files. Only rules B and D can remove a row, a line or a sentence. Only rule S2 can split a sentence.
- Do not change text outside the parts of section 3.
- Do not add hints: no "exactly", no "equals", no formula, no range, no "calculate", no notes, no examples, no reasons.
- Do not add a quoted text that the precise file does not hold.
- Do not use the values of the precise set to write a meaning or a noun.
- Do not open the app, a browser, the internet, the code of the app, a test suite or a folder outside the work folder.
- Do not change `check-vague.mjs`. Run only `node check-vague.mjs`, with the arguments of sections 6 and 7.
- Do not change a word for style. Change only what a rule in section 3 tells you to change.

## 5. Worked example on a made-up test case

We made up this test case. It is not one of TC-01 to TC-08.

Precise version:

~~~markdown
# TC-90: Gift card on the payment step

| Field | Value |
|---|---|
| ID | TC-90 |
| Title | Gift card on the payment step |
| Area | Gift card |

A gift card pays a part of the order. The shop takes the value of the gift card from the total price.

## Preconditions

1. A new customer account exists.
2. The basket of the customer is empty.

## Test data

| Name | Value |
|---|---|
| Product | `Mango Smoothie (300ml)`, price `3.49¤`, quantity 2 |
| Gift card | `GIFT-4000`, value `4.00¤` |
| Wrong code | `GIFT-0000` |
| Gift card balance after the order | `0.00¤` |

The total price is the sum of price × quantity, minus the value of the gift card.

Expected receipt:

| Line | Value |
|---|---|
| `Items` | `6.98¤` |
| `Gift card` | `4.00¤` |
| `Total Price` | `2.98¤` |

## Steps

Before step 1, click `Add to Basket` on the product two times. The basket counter then shows `2`.

| # | Step | Expected result |
|---|---|---|
| 1 | Open the basket `/#/basket`. Click `Checkout`. | The page `Payment` shows the field `Gift card code` and the button `Apply`. The basket counter shows `2`. |
| 2 | Type the wrong code. Click `Apply`. | The page shows the error `Unknown gift card.` The page shows one row: `Mango Smoothie (300ml)`, quantity `2`, price `3.49¤`. |
| 3 | Type the gift card code. Click `Apply`. | A message shows `Gift card of 4.00¤ added.` The button `Pay 2.98¤` is enabled. |
| 4 | Click `Pay 2.98¤`. | The page `Receipt` shows `Items` `6.98¤`, `Gift card` `4.00¤` and `Total Price` `2.98¤`. The gift card balance is `0.00`: 4.00 − 4.00. |
~~~

Vague version. Rule B removed the block `Expected receipt:`. Rule D changed the test data and the text line under `## Steps`.
The text above `## Test data` did not change.

~~~markdown
## Test data

| Name | Value |
|---|---|
| Product | `Mango Smoothie (300ml)`, quantity 2 |
| Gift card | `GIFT-4000` |
| Wrong code | `GIFT-0000` |

## Steps

Before step 1, click `Add to Basket` on the product two times.

| # | Step | Expected result |
|---|---|---|
| 1 | Open the basket `/#/basket`. Click `Checkout`. | The page `Payment` shows the field `Gift card code` and the button `Apply`. The basket counter shows the correct number. |
| 2 | Type the wrong code. Click `Apply`. | The page shows an error message that says the code is wrong. The page shows the correct number of rows: `Mango Smoothie (300ml)`, the correct quantity, the correct price. |
| 3 | Type the gift card code. Click `Apply`. | A message says the gift card applies to the order. The button `Pay` with the correct amount is enabled. |
| 4 | Click `Pay 2.98¤`. | The page `Receipt` shows the correct items, gift card and total price. The gift card balance is correct. |
~~~

The changes of rule D, one by one:

| Line | Precise text | Class | Rule | Vague text |
|---|---|---|---|---|
| `Product` | `Mango Smoothie (300ml)` | input, no number | D1, test 1 | the same |
| `Product` | price `3.49¤` | output, noun "price" | D1, test 5 | removed, with the comma before it |
| `Product` | quantity 2 | input, noun "quantity" | D1, test 4 | the same |
| `Gift card` | value `4.00¤` | output, noun "value" | D1, test 5 | removed |
| `Gift card balance after the order` | `0.00¤` | output, noun from the row name | D1, test 5, and D2 | the row goes |
| text line under `## Test data` | The total price is the sum of price × quantity, minus the value of the gift card. | calculation | D3, test 2 | the line goes, with the empty line after it |
| text line under `## Steps`, sentence 1 | Before step 1, click `Add to Basket` on the product two times. | action | D3, test 1 | the same |
| text line under `## Steps`, sentence 2 | The basket counter then shows `2`. | result | D3, test 3 | removed |

The action sentence keeps the number word "two": in rule D, a number word is not a number. The cell of step 1 still checks the basket counter.

The changes in the column "Expected result", one by one:

| Step | Precise text | Class | Rule | Vague text |
|---|---|---|---|---|
| 1 | `Payment`, `Gift card code`, `Apply` | kept | K | the same |
| 1 | shows `2` | value | V1, no noun before it | shows the correct number |
| 2 | the error `Unknown gift card.` | message | M1, M2 | an error message that says the code is wrong |
| 2 | one row | number word | V3 | the correct number of rows |
| 2 | `Mango Smoothie (300ml)` | kept, input | K | the same |
| 2 | quantity `2`, price `3.49¤` | value | V1, noun before it | the correct quantity, the correct price |
| 3 | A message shows `Gift card of 4.00¤ added.` | message | M3 | A message says the gift card applies to the order. |
| 3 | the button `Pay 2.98¤` | kept with a value | K2 | the button `Pay` with the correct amount |
| 4 | `Items` `6.98¤`, `Gift card` `4.00¤` and `Total Price` `2.98¤` | label | L2 | the correct items, gift card and total price |
| 4 | is `0.00`: 4.00 − 4.00 | value and calculation | V1, V4 | is correct |

In step 2, the meaning uses "code" and "wrong" from the step column. It does not use "unknown": the file holds that word only in the message.
In step 3, the meaning uses "gift card" from the title. It does not use "added", and it does not hold all content words of the message.
The step column of step 4 still holds `Pay 2.98¤`. The rule does not change the step column.

## 6. Checks at the end

The session runs the checks after it writes the vague set. All checks must pass.
When a check fails, change only the cell or the line that the check names. Then run all checks again.

| ID | Check | Condition that the script tests |
|---|---|---|
| C1 | The same files | The two folders hold the same file names. |
| C2 | Other files stay | Each file that is not a test case file (for example `README.md`) is byte for byte the same. |
| C3 | The same structure | After rules B and D on the precise file, both files have the same headings. Each line outside the sections `## Test data` and `## Steps` is the same. In `## Steps`, the tables have the same lines in the same places. Each step row has the same number and the same step text. Each other table line is the same. |
| C4 | No expected block | No line in a vague file starts with `Expected`. |
| C5 | No value | The vague expected cell holds no digit, no `¤` and no `%`. A digit of a different script, for example a full-width digit, is also a digit. The script ignores step references and quoted inputs from the test data. |
| C6 | No number word | The vague expected cell holds none of these words outside quotes: zero to ten, once, twice, single, double, half. It also holds no other number word that the precise cell does not hold. These words are eleven to nineteen, twenty to ninety, hundred, thousand, million, dozen and the ordinals, for example first, fifth and twentieth. |
| C7 | No quoted message | No quoted text in the vague expected cell ends with `.`, `!`, `?` or `:`. |
| C8 | The quoted texts | The quoted texts of the vague cell are the kept quoted texts of the precise cell, in the same order. A kept text with a value is there without its value. Thus no label, message, value or new quote stays. |
| C9 | The phrases with "correct" | Each phrase that rules V and K give is in the vague cell, as many times as the rules give it. Each label is in the vague cell in lowercase, after the word "correct" in the same sentence. |
| C10 | Message words | The cell obeys the limits of rule M for each message of the precise cell. The script tests the words of the full cell outside quotes. |
| C11 | Cells with no change | A precise cell with no value, label, message, number or number word is the same in the vague set, character for character. |
| C12 | Sentences and length | The vague cell has the same number of sentences as the precise cell. Rule S2 can add one sentence for each precise sentence that can grow past 25 words. The cell also stays under a word limit that the script calculates from the precise cell. |
| C13 | No new hint | The vague cell holds no hint word that the precise cell does not hold. The hint words are in the script (`HINTS`), for example "exactly", "equals", "minus", "plus", "sum" and "tenth". |
| C14 | Rule D | Each line of the section `## Test data` and each text line of the section `## Steps` is the same as the line that rule D gives, character for character. The vague file has no extra line and no missing line there. `--classes` prints these lines. |

The script is below. It uses only Node built-ins.
The main session puts it into the work folder as `check-vague.mjs` (section 8). Run it with Node 24:

~~~bash
node check-vague.mjs --classes test-cases
node check-vague.mjs test-cases test-cases-vague
node check-vague.mjs --sha256 test-cases-vague
~~~

Exit 0 and the line `PASSED: all checks` mean that all checks pass. Exit 1 lists each problem with the file, the step or the line, and the check ID.

~~~js
#!/usr/bin/env node
// Checks a vague test case set against the precise set (bench/vague-rule.md, checks C1 to C14).
//
//   node check-vague.mjs <precise dir> <vague dir>   run the checks, exit 1 when a check fails
//   node check-vague.mjs --classes <precise dir>     print the lines that rule D gives, the class of each quote
//                                                    and the phrases that each cell needs
//   node check-vague.mjs --sha256 <dir>              print the sha256 of each file and of the folder (section 7)
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const ROW = /^\| (\d+) \| (.+?) \| (.+) \|$/
const DATA_ROW = /^\| (.+?) \| (.+) \|$/
const VALUE = /^[^A-Za-z]*\d[^A-Za-z]*$/
const LABEL_COLON = /^[A-Za-z][^:]*: [^A-Za-z]*\d[^A-Za-z]*$/
const NUMBER_WORDS = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|once|twice|single|double|half)\b/i
// Check C6: the other number words and the ordinals. A vague cell can hold one only when the precise cell holds it.
const MORE_NUMBER_WORDS = /\b(eleven|twelve|(?:thir|four|fif|six|seven|eigh|nine)teen|(?:twen|thir|for|fif|six|seven|eigh|nine)ty|hundreds?|thousands?|millions?|dozens?|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|[a-z]+teenth|[a-z]+ieth)\b/gi
const HINTS = /\b(exactly|equals?|calculat\w*|comput\w*|formula|api|locator|selector|regex|approximately|round\w*|minus|plus|sums?|times|multipl\w*|divid\w*|percent|tenths?|for example)\b|e\.g\./gi
const STEP_REF = /\b(?:[Ss]teps?|[Pp]arts?) \d+(?: (?:and|to) \d+)?/g
const STOP = new Set(('a an the this that these those it its you your we our they their he she his her i me my of to in on at for with ' +
  'by from into onto up out about as and or but nor not no is are was were be been being am do does did have has had will would ' +
  'can could shall should may might must any some all there here than then so if when').split(' '))
const NOT_NOUN = new Set('is are was shows show says with of and or has have keeps keep stays the a an to at by from than its their until for in on'.split(' '))
// Rule D: the nouns of the inputs, the verbs of an action sentence, the signs and words of a calculation.
const INPUT = ['quantity', 'characters', 'first balance', 'top-up']
const ACTIONS = new Set('add click close enter open read select type'.split(' '))
const CALC = /[+−×=]|\s[/-]\s|\b(sums?|round\w*|divided|multipl\w*|minus|plus|percent)\b/i
const ADJ = /\b(?:a|an|the) (`?\d[\d.,]*[¤%]?`? )(?=[A-Za-z])/i

const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8')
const tcFiles = dir => fs.readdirSync(dir).filter(f => /^TC-\d\d.*\.md$/.test(f)).sort()
const spans = text => [...text.matchAll(/`([^`]+)`/g)].map(m => m[1])
const words = text => text.toLowerCase().match(/[a-z]+/g) ?? []
const stem = w => (w.length > 4 ? w.slice(0, 4) : w)
const runs = (w, n) => w.slice(0, Math.max(0, w.length - n + 1)).map((_, i) => w.slice(i, i + n).join(' '))
const unvalue = s => s.replace(/\s*\d[\d.,]*\s*[¤%]?/g, '').trim()
const noQuotes = text => text.replace(/`[^`]*`/g, ' ')
const lintWords = text => noQuotes(text).split(/\s+/).filter(Boolean).length
const kindNoun = v => (/%/.test(v) ? 'percentage' : /¤|\d\.\d/.test(v) ? 'amount' : 'number')
const plural = n => (/(s|x|ch|sh)$/.test(n) ? `${n}es` : /[^aeiou]y$/.test(n) ? `${n.slice(0, -1)}ies` : `${n}s`)
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const count = (text, re) => (text.match(re) ?? []).length
const without = (text, list) => [...list].reduce((t, s) => t.split(s).join(' '), text)
// Rule D: the text without the quotes that hold a letter and without the references to steps and parts.
const bare = text => text.replace(/`[^`]*`/g, q => (/[A-Za-z]/.test(q) ? ' ' : q.slice(1, -1))).replace(STEP_REF, ' ')

// The quotes of a text, each with the text after it and the next quote.
function quotes (text) {
  const parts = text.split('`')
  const out = []
  for (let i = 1; i < parts.length - 1; i += 2) out.push({ s: parts[i], gap: parts[i + 1], next: parts[i + 2] })
  return out
}

// Splits a cell into sentences. A sentence ends with . ! or ?, also inside a quote at its end,
// before a space and a capital letter or a backtick, or at the end of the cell.
function sentences (cell) {
  const masked = cell.replace(/`[^`]*`/g, q => '`' + q.slice(1, -2).replace(/./g, 'q') + (/[.!?]/.test(q.at(-2)) ? q.at(-2) : 'q') + '`')
  const out = []
  let start = 0
  for (const m of masked.matchAll(/[.!?]`?(?=\s+[A-Z`]|$)/g)) {
    out.push(cell.slice(start, m.index + m[0].length).trim())
    start = m.index + m[0].length
  }
  if (cell.slice(start).trim()) out.push(cell.slice(start).trim())
  return out
}

// Rule V4: remove each calculation (a colon, then numbers with an operator) up to the end of its sentence.
const dropCalcs = cell => sentences(cell).map(s => s.replace(/:\s[^`]*\d[^`]*?(\s[+−×/=-]\s|round)[^`]*?([.!?])$/, '$2')).join(' ')

// Rule B: remove each block that starts with a line "Expected ...": the line, the table and the empty lines.
function dropExpectedBlocks (lines) {
  const out = []
  let i = 0
  while (i < lines.length) {
    if (!/^Expected\b/.test(lines[i])) { out.push(lines[i++]); continue }
    i++
    while (lines[i] === '') i++
    while (lines[i]?.startsWith('|')) i++
    if (lines[i] === '') i++
  }
  return out
}

// Rule D1: splits a test data value into parts at each comma and space outside quotes.
function splitParts (value) {
  const parts = ['']
  let quoted = false
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '`') quoted = !quoted
    if (!quoted && value.startsWith(', ', i)) { parts.push(''); i++ } else parts[parts.length - 1] += value[i]
  }
  return parts
}

// Rule D1: the class of one part of a test data value.
function partClass (part, name) {
  const b = bare(part)
  if (!/\d/.test(b)) return 'input'
  if (CALC.test(noQuotes(part))) return 'output, calculation'
  if (b.includes('%')) return 'output, percentage'
  const t = b.match(/[A-Za-z][A-Za-z-]*|\d[\d.,]*\d|\d/g)
  const k = t.findIndex(x => /^\d/.test(x))
  const noun = ([t[k - 1], t[k + 1]].find(x => /^[A-Za-z]/.test(x ?? '') && !NOT_NOUN.has(x.toLowerCase())) ?? name).toLowerCase()
  return `${INPUT.some(n => noun === n || noun.startsWith(`${n} `)) ? 'input' : 'output'}, noun "${noun}"`
}

// Rule D3: the class of one sentence of a text line.
function sentenceClass (s) {
  const n = noQuotes(s)
  const first = text => (text.match(/[A-Za-z]+/)?.[0] ?? '').toLowerCase()
  const comma = n.indexOf(', ')
  if (ACTIONS.has(first(n)) || (comma >= 0 && ACTIONS.has(first(n.slice(comma + 2))))) return 'action'
  if (CALC.test(n)) return 'calculation'
  if (/\d/.test(bare(s))) return 'result'
  return 'kept'
}

// Rule D: keeps the inputs and removes the outputs in the section "## Test data" and in the text lines of "## Steps".
// Gives the new lines and one report line for each test data row and each text line.
function ruleD (lines) {
  const out = []
  const report = []
  let section = ''
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.startsWith('## ')) section = l
    const data = section === '## Test data'
    const row = data && lines[i - 1]?.startsWith('|') && !/^\|[-| ]+\|$/.test(l) ? l.match(DATA_ROW) : null
    if (row) {
      const parts = splitParts(row[2]).map(p => ({ p, c: partClass(p, row[1]) }))
      const kept = parts.flatMap(({ p, c }) => (c.startsWith('input') ? [p] : c.endsWith('calculation') || !ADJ.test(p) ? [] : [p.replace(ADJ, (all, num) => all.slice(0, -num.length))]))
      const next = kept.length ? `| ${row[1]} | ${kept.join(', ')} |` : null
      if (next !== null) out.push(next)
      report.push(`test data "${row[1]}": ${next === l ? 'NO CHANGE | ' : ''}${parts.map(x => `[${x.p}] ${x.c}`).join(' | ')}${next === l ? '' : ` => ${next ?? 'REMOVE THE ROW'}`}`)
      continue
    }
    if (!(data || section === '## Steps') || !l.trim() || l.startsWith('|') || l.startsWith('#')) { out.push(l); continue }
    const ss = sentences(l).map(s => ({ s, c: sentenceClass(s) }))
    const kept = ss.filter(x => x.c === 'action' || x.c === 'kept').map(x => x.s)
    const next = kept.length === ss.length ? l : kept.length ? kept.join(' ') : null
    if (next !== null) out.push(next)
    else if (lines[i + 1] === '') i++
    report.push(`${data ? 'test data' : 'steps'} text: ${next === l ? 'NO CHANGE | ' : ''}${ss.map(x => `[${x.s}] ${x.c}`).join(' | ')}${next === l ? '' : ` => ${next ?? 'REMOVE THE LINE'}`}`)
  }
  return { lines: out, report }
}

// For each file: the lines after rules B and D, the report of rule D, the inputs (quotes with a letter in the test data
// and README.md), the step rows and the stems of the words outside the expected-result column. For the set: the message texts.
function context (dir) {
  const readme = fs.existsSync(path.join(dir, 'README.md')) ? read(dir, 'README.md') : ''
  const files = {}
  const messages = []
  for (const f of tcFiles(dir)) {
    const { lines, report } = ruleD(dropExpectedBlocks(read(dir, f).split('\n')))
    const testData = []
    let inside = false
    for (const l of lines) {
      if (l.startsWith('## ')) inside = l === '## Test data'
      else if (inside) testData.push(l)
    }
    const inputs = new Set([...spans(testData.join('\n')), ...spans(readme)].filter(s => /[A-Za-z]/.test(s)))
    const rows = lines.map(l => l.match(ROW)).filter(Boolean)
    const outside = lines.map(l => l.match(ROW)?.[2] ?? l).join(' ')
    files[f] = { lines, report, inputs, rows, allowed: new Set(words(outside).map(stem)) }
    for (const r of rows) messages.push(...quotes(r[3]).map(q => q.s).filter(s => /[.!?]$/.test(s)))
  }
  return { files, messages }
}

function classOf (q, file, ctx) {
  if (q.s.startsWith('/')) return 'kept'
  if ((/[A-Za-z]/.test(q.s) && q.gap === ' ' && VALUE.test(q.next ?? '')) || LABEL_COLON.test(q.s)) return 'label'
  if (ctx.messages.some(m => m === q.s || (m.startsWith(q.s) && q.s.includes(' ')))) return 'message'
  if (VALUE.test(q.s)) return 'value'
  if (file.inputs.has(q.s) || !/\d/.test(q.s)) return 'kept'
  return 'kept without the value'
}

// What rules V, L, K and M need from one precise cell: the kept quotes, the phrases with "correct", the labels,
// the messages, and an upper limit of the words of each sentence after the change.
function analyse (cell, file, ctx) {
  const out = { kept: [], phrases: [], labels: [], messages: [], est: [], changes: false }
  for (const sentence of sentences(dropCalcs(cell))) {
    const parts = sentence.replace(STEP_REF, ' ').split('`')
    let lastNoun = null
    let skip = false
    let est = lintWords(sentence)
    const value = (prev, v) => {
      if (prev === 'is' || prev === 'are') return out.phrases.push('(is|are) correct')
      const noun = prev && /^[a-z]+$/.test(prev) && !NOT_NOUN.has(prev) ? prev : lastNoun ?? kindNoun(v)
      lastNoun = noun
      out.phrases.push(`correct ${noun}`)
    }
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        const tokens = parts[i].match(/[A-Za-z]+|\d[\d.,]*\d|\d/g) ?? []
        tokens.forEach((t, k) => {
          if (/^\d/.test(t)) { value(tokens[k - 1]?.toLowerCase(), t); est += 3; out.changes = true }
          if (NUMBER_WORDS.test(t) && tokens[k + 1] && tokens[k + 1] !== 'more') {
            out.phrases.push(`correct number of ${plural(tokens[k + 1].toLowerCase())}`)
            est += 3
            out.changes = true
          }
        })
        continue
      }
      if (skip) { skip = false; continue }
      const q = { s: parts[i], gap: parts[i + 1], next: parts[i + 2] }
      const c = classOf(q, file, ctx)
      const prev = (parts[i - 1].match(/[A-Za-z]+(?=[^A-Za-z]*$)/)?.[0] ?? '').toLowerCase() || null
      if (c === 'kept') out.kept.push(q.s)
      if (c === 'kept without the value') {
        out.kept.push(unvalue(q.s))
        out.phrases.push(`with the correct ${kindNoun(q.s)}`)
        est += 4
      }
      if (c === 'label') {
        const label = q.s.split(':')[0].toLowerCase()
        out.labels.push(label)
        est += 2 + words(label).length
        skip = !LABEL_COLON.test(q.s)
      }
      if (c === 'value') { value(prev, q.s); est += 3 }
      if (c === 'message') { out.messages.push(q.s); est += 13 }
      if (c !== 'kept') out.changes = true
    }
    out.est.push(est)
  }
  return out
}

// Rule M, check C10: the words of each message in the vague cell.
function messageProblems (precise, vague, a, file) {
  const problems = []
  const keptStems = new Set(words(noQuotes(precise)).map(stem))
  const vw = words(without(noQuotes(vague), file.inputs))
  const vStems = new Set(vw.map(stem))
  for (const m of a.messages) {
    const mw = words(without(m, file.inputs))
    const size = Math.min(3, mw.length)
    const left = runs(vw, size)
    if (size >= 2 && runs(mw, size).some(r => left.includes(r))) problems.push(`C10 a run of ${size} words of \`${m}\` is left`)
    const content = [...new Set(mw.filter(w => !STOP.has(w)).map(stem))].filter(s => !keptStems.has(s))
    const banned = content.filter(s => !file.allowed.has(s) && vStems.has(s))
    const shown = [...new Set(vw.filter(w => banned.includes(stem(w))))]
    if (banned.length) problems.push(`C10 a word of \`${m}\` that the test case does not hold elsewhere: ${shown.join(', ')}`)
    if (content.length >= 2 && content.every(s => vStems.has(s))) problems.push(`C10 each content word of \`${m}\` is left`)
  }
  return problems
}

function checkCell (at, precise, vague, file, ctx, fail) {
  const a = analyse(precise, file, ctx)
  const vq = quotes(vague).map(q => q.s)
  const plain = vague.replace(/`[^`]*`/g, m => (file.inputs.has(m.slice(1, -1)) ? ' ' : m)).replace(STEP_REF, ' ')
  const text = noQuotes(vague).toLowerCase().replace(/\s+/g, ' ')
  if (/[\p{Nd}¤%]/u.test(plain)) fail(at, 'C5 a digit, ¤ or % is left')
  if (NUMBER_WORDS.test(noQuotes(vague))) fail(at, 'C6 a number word is left')
  const more = [...noQuotes(vague).matchAll(MORE_NUMBER_WORDS)].map(m => m[0].toLowerCase()).filter(w => !words(noQuotes(precise)).includes(w))
  if (more.length) fail(at, `C6 a number word that the precise cell does not hold: ${[...new Set(more)].join(', ')}`)
  if (vq.some(q => /[.!?:]$/.test(q))) fail(at, 'C7 a quoted text ends with . ! ? or :')
  if (vq.join('\n') !== a.kept.join('\n')) fail(at, `C8 the quotes are [${vq.join('] [')}], the rule gives [${a.kept.join('] [')}]`)
  const need = {}
  for (const p of a.phrases) need[p] = (need[p] ?? 0) + 1
  for (const [p, n] of Object.entries(need)) {
    const re = new RegExp(`\\b${p.startsWith('(') ? p : escape(p)}\\b${p.endsWith(' number') ? '(?! of\\b)' : ''}`, 'g')
    if (count(text, re) < n) fail(at, `C9 "${p}" ${n} time(s), found ${count(text, re)}`)
  }
  for (const l of a.labels) if (!new RegExp(`\\bcorrect\\b[^.]*\\b${escape(l)}\\b`).test(text)) fail(at, `C9 no "correct ... ${l}" for the label \`${l}\``)
  for (const p of messageProblems(precise, vague, a, file)) fail(at, p)
  if (!a.changes && vague !== precise) fail(at, 'C11 the cell has nothing to change, but it changed')
  const ps = a.est.length
  const vs = sentences(vague)
  const splits = a.est.filter(e => e > 25).length
  if (vs.length < ps || vs.length > ps + splits) fail(at, `C12 ${vs.length} sentences, the precise cell has ${ps}${splits ? ` (+${splits} allowed)` : ''}`)
  const limit = a.est.reduce((x, y) => x + y, 0) + 5 * splits
  if (lintWords(vague) > limit) fail(at, `C12 ${lintWords(vague)} words, the limit is ${limit}`)
  const added = [...noQuotes(vague).matchAll(HINTS)].map(m => m[0].toLowerCase()).filter(h => !noQuotes(precise).toLowerCase().includes(h))
  if (added.length) fail(at, `C13 a hint word: ${[...new Set(added)].join(', ')}`)
}

// Splits the lines of a file into sections at each heading "## ". Each line keeps its line number.
function sectionsOf (lines) {
  const out = [{ head: '', lines: [] }]
  lines.forEach((t, i) => (t.startsWith('## ') ? out.push({ head: t, lines: [] }) : out.at(-1).lines.push({ t, n: i + 1 })))
  return out
}

// Reports the first line that is not the line that the rules give.
function differ (at, id, where, want, got, fail) {
  const i = [...Array(Math.max(want.length, got.length)).keys()].find(k => want[k]?.t !== got[k]?.t)
  if (i === undefined) return
  fail(at, `${id} ${where}: ${got[i] ? `line ${got[i].n} is "${got[i].t}"` : 'a line is missing'}, the rules give ${want[i] ? `"${want[i].t}"` : 'no line'}`)
}

function check (pDir, vDir) {
  const failures = []
  const fail = (at, msg) => failures.push(`${at}: ${msg}`)
  const pNames = fs.readdirSync(pDir).sort()
  const vNames = fs.readdirSync(vDir).sort()
  if (pNames.join('\n') !== vNames.join('\n')) fail('folder', `C1 the file names differ: [${pNames}] [${vNames}]`)
  const tcs = tcFiles(pDir)
  for (const f of pNames.filter(f => !tcs.includes(f) && vNames.includes(f))) {
    if (read(pDir, f) !== read(vDir, f)) fail(f, 'C2 the file changed')
  }
  const ctx = context(pDir)
  for (const f of tcs.filter(f => vNames.includes(f))) {
    const vLines = read(vDir, f).split('\n')
    if (vLines.some(l => /^Expected\b/.test(l))) fail(f, 'C4 a line starts with "Expected"')
    const es = sectionsOf(ctx.files[f].lines)
    const vs = sectionsOf(vLines)
    if (es.map(s => s.head).join('\n') !== vs.map(s => s.head).join('\n')) { fail(f, 'C3 the headings changed'); continue }
    const table = s => s.lines.filter(l => l.t.startsWith('|'))
    const text = s => s.lines.filter(l => !l.t.startsWith('|'))
    es.forEach((e, k) => {
      const v = vs[k]
      if (e.head === '## Test data') return differ(f, 'C14', e.head, e.lines, v.lines, fail)
      if (e.head !== '## Steps') return differ(f, 'C3', e.head || 'the top of the file', e.lines, v.lines, fail)
      differ(f, 'C14', `${e.head}, the text lines`, text(e), text(v), fail)
      const et = table(e)
      const vt = table(v)
      if (et.length !== vt.length) return fail(f, `C3 the steps tables have ${vt.length} lines, ${et.length} expected`)
      const shape = s => s.lines.map(l => l.t.startsWith('|')).join()
      if (shape(e) !== shape(v)) fail(f, 'C3 a text line or a table moved in the section ## Steps')
      et.forEach((p, i) => {
        const pr = p.t.match(ROW)
        const vr = vt[i].t.match(ROW)
        if (!pr) { if (p.t !== vt[i].t) fail(f, `C3 line ${vt[i].n} changed`); return }
        if (!vr || vr[1] !== pr[1] || vr[2] !== pr[2]) { fail(f, `C3 step ${pr[1]}: the step number or the step text changed`); return }
        checkCell(`${f} step ${pr[1]}`, pr[3], vr[3], ctx.files[f], ctx, fail)
      })
    })
  }
  return failures
}

function printClasses (dir) {
  const ctx = context(dir)
  for (const [f, file] of Object.entries(ctx.files)) {
    for (const r of file.report) console.log(`${f.slice(0, 5)} ${r}`)
    for (const r of file.rows) {
      const a = analyse(r[3], file, ctx)
      const qs = quotes(r[3]).map((q, i, all) => {
        const before = all[i - 1]
        const ofLabel = before && classOf(before, file, ctx) === 'label' && !LABEL_COLON.test(before.s)
        return `\`${q.s}\` ${ofLabel ? 'value of the label' : classOf(q, file, ctx)}`
      })
      const needs = [...a.phrases.map(p => `"${p}"`), ...a.labels.map(l => `label "${l}"`)]
      console.log(`${f.slice(0, 5)} step ${r[1]}: ${a.changes ? '' : 'NO CHANGE | '}${qs.join(' | ') || 'no quote'}${needs.length ? ` || needs ${needs.join(', ')}` : ''}`)
    }
  }
}

// The method of the freeze of test-cases-v1: sha256 of each file (sorted by path, bytes), then of that list.
function sha256Folder (dir) {
  const files = []
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(r)
      else if (e.isFile()) files.push(`./${r}`)
    }
  }
  walk('')
  files.sort((x, y) => Buffer.compare(Buffer.from(x), Buffer.from(y)))
  const list = files.map(f => `${crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')}  ${f}\n`).join('')
  return list + `${crypto.createHash('sha256').update(list).digest('hex')}  -`
}

const args = process.argv.slice(2)
if (args[0] === '--classes' && args[1]) {
  printClasses(args[1])
} else if (args[0] === '--sha256' && args[1]) {
  console.log(sha256Folder(args[1]))
} else if (args.length === 2) {
  const failures = check(args[0], args[1])
  for (const f of failures) console.log(f)
  console.log(failures.length ? `FAILED: ${failures.length} problems` : 'PASSED: all checks')
  process.exit(failures.length ? 1 : 0)
} else {
  console.error('usage: node check-vague.mjs <precise dir> <vague dir> | --classes <precise dir> | --sha256 <dir>')
  process.exit(2)
}
~~~

## 7. The sha256 step

After the checks pass, the session runs `node check-vague.mjs --sha256 test-cases-vague`.
The output has one line for each file and a last line with the hash of the folder.
The paths in the list are relative. Thus each copy of the folder gets the same folder hash.

The script uses the method of the freeze of `test-cases-v1`. These shell commands give the same output:

~~~bash
(cd test-cases-vague && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256)
(cd test-cases-vague && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256) | shasum -a 256
~~~

## 8. Before and after the session

The main session does these steps. The vague session does not do them.

Before:

1. Make a new work folder inside `harness-demo-runs/`. Its name does not hold the word "vague", for example `harness-demo-runs/tc-rewrite/`.
2. Put three inputs into the work folder:
   - `test-cases/` from the tag: `git -C <lab> archive test-cases-v1 test-cases | tar -x -C <work folder>`
   - this file, from the commit that Arsen approved, as `vague-rule.md`
   - `check-vague.mjs`, taken from the `~~~js` block of section 6 by a command, not by hand
3. Record the sha256 of `vague-rule.md`, of `check-vague.mjs` and of the folder `test-cases/` in `LOG.md`.
4. Run the session with `bench/claude-locked.sh`, with the work folder as `--dir`. During the run, the lock hides the other folders of the lab and of `harness-demo-runs/`.
   The session gets no MCP server. It gets only these tools: `Read`, `Write`, `Edit`, `Glob`, `Grep` and `Bash(node check-vague.mjs *)`.
   The model and the budget cap are in `bench/hypotheses-v2.md`.
5. The prompt of the session is this text, with no change:

~~~text
Apply the rule in vague-rule.md to the folder test-cases/. Write the result to the folder test-cases-vague/.
Then run the commands of sections 6 and 7 of the rule. Give the full output of each command in your last message.
~~~

After:

1. Audit the tool calls in the stream-json output of the run. Each path and each command of a tool call must stay inside the work folder.
   Record the result in `LOG.md` before checkpoint 2.
   If a tool call goes outside the work folder, the vague set is not valid. Then remove the work folder and run a new session.
2. Copy `test-cases-vague/` into the lab. Run the checks again in the lab.
   Run the shell commands of section 7 on the lab copy. The folder hash must be the same as in the output of the session.
3. Run `ste-lint.py` on each vague file. It must report 0 hard violations.
   If it reports one, give the lint lines to the same session. The session changes only the named cells and runs the checks again.
4. Arsen reads each changed cell and each line that rule D changed next to the precise text.
   He also reads each part that the output of `--classes` marks `input, noun "<noun>"` and each sentence that it marks `action`. Each of these parts keeps a number, and an action sentence can keep one.
   Then he says "yes" (checkpoint 2). He does not edit a cell. If he finds a problem, the rule or the script changes, and a new session applies the new rule to all files.
5. Commit `test-cases-vague/` in the lab and add the tag `test-cases-v2-vague`. Record the tag, the folder hash, the date and the time in `LOG.md`.
6. `bench/make-template.sh` adds the set at its tag to the templates of `suite-a` and `suite-b`, as `test-cases/`.
   Before each generation of the condition `vague`, calculate the folder hash of the lab copy and of the two copies in the run folders.
   The three hashes must be the same. Record them in `LOG.md`.

If `LOG.md` names another hash command for `test-cases-v1`, use that command for both sets. Then the hashes of the two sets are comparable.

## 9. Known limits of the rule

Rule D removes the outputs from the test data (decision 6). Some exact values, or a way to get them, stay in the vague set:

- The step column stays word for word (plan v2, E2: the actions do not change). TC-04 step 2 holds "until the quantity is `5`". This is the purchase limit.
  TC-08 steps 3 and 7 hold the button `Pay 8.99¤`. This is the order total.
- `README.md` stays word for word (plan v2, E2). It tells that the part `<NN>` of a coupon code is the discount, and its examples give a coupon with a 10% discount.
  Thus an agent can find the discount from the coupon code. The code is an input, so rule D keeps it.
  `README.md` also tells that the prices come from the shop catalog.
- In TC-08, rule D keeps the first balance and the top-up as inputs, because the test sets them. Their sum is the order total.
  The boundary test needs this by design: "Part 2: the wallet holds exactly the order total."
  Decision 6 names balances as outputs. Arsen approved the first balance as an input (decision 7).
- In TC-08, the order total is the price of `Eggfruit Juice (500ml)` (quantity 1) plus the price of `Standard Delivery`.
  The vague set does not give the price of `Standard Delivery`. If an agent uses `0.00¤` for it, the agent gets the price of `Eggfruit Juice (500ml)`.
  TC-02, TC-03, TC-05, TC-06 and TC-07 use this product. With this price, the quantities and the 10% examples of `README.md`, an agent can calculate these values:
  the values of TC-02, the total of TC-03 step 5, and the items and the promotion of TC-05 and TC-06.
  Arsen accepted this limit (decision 9). The step column stays word for word, as the plan says.
  Also, the agent sees the running app through Playwright MCP and can read each price there.
- Rule D does not apply to the text before `## Preconditions` and to the preconditions.
  In TC-08, this text keeps the calculation of the bonus points and "1 point = `1.00¤`".
  It also keeps the first balance and the balance of a new account (`0.00¤`).
  In TC-05, this text tells which part of the order gets the discount. In TC-07, it tells where the shop calculates the totals.

Thus an agent can still find some expected values. This is like a Jira ticket that names the products and the actions, but not the prices and the expected values.

Other limits:

- The meaning of a message (rule M) is the free part of the rule. C10 limits its words, but two people can still choose different words.
- The checks cannot find each wrong change. For example, a short clause inside a sentence passes when it has no hint word and the cell stays under the word limit.
  A value can also stand as a word that the lists of C6 do not hold, for example "a couple of items".
  For this reason, Arsen reads each changed cell and each line that rule D changed at checkpoint 2.
- The script finds a noun with a list of words that are not nouns. A rare word before a value can give a wrong noun.
  Rule D uses the same method and the short lists `INPUT`, `ACTIONS` and `CALC`. A new kind of test data can need a new item in a list.
  The output of `--classes` shows each phrase and each class before the session writes the file.
- Rule D keeps number words, for example "one more character" in TC-01. In the set, they tell about inputs.
- Rule D finds an action sentence by its first word, or by the first word after its first comma. A sentence with a different form can get the wrong class.
  In the set, only TC-08 has an action sentence in a text line.
