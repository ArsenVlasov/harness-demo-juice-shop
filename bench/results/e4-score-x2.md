# Measures of the audit (label A)

The rules are in the section "Measures of the audit" of `bench/hypotheses-v2.md` at the tag `hypotheses-v2`.
The command `bench/e4-prepare.mjs score` wrote this file at 2026-10-21T12:17:52.373Z.

| Input | File | sha256 |
|---|---|---|
| flags | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/results/e4-flags-x2.json` | `73e6026dd19ac8ad9b00cc7e4140da1599d8a88ebcfccbc4c190f0d77dfb5e5f` |
| mutants | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/results/mutants-haiku-3.json` | `3e41cdae0c6ca04163c51d2868b8ea772b2b6dccb1645c405de6e02702c6055f` |
| judge | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/results/judge-haiku-3/suite-2.json` | `68b945e131e977af00f7854ba4d8d3b69b1c1edbaa818acc30e785e8443b08f6` |
| sealed | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/sealed/mutants.md` | `8490378e5d1ab2581b375b21c3318fa515f7c3618ed4081649eb288aa556c30c` |

| Measure | Result | Value |
|---|---|---|
| R1: missed bugs with a flag on a target step | 4 of 4 | 1 |
| R2: missed bugs with a flag on a step of a target test case | 4 of 4 | 1 |
| P1: hits, of all flags | 2 of 8 | 0.25 |
| P2: hits and flags that are weak by the judge, of all flags | 7 of 8 | 0.875 |
| Flags of the class "hit" | 2 | - |
| Flags of the class "weak by the judge" | 5 | - |
| Flags of the class "other" | 1 | - |

A target step is a step in the column of the expected test case step of the sealed table.
When the column names more than one step, a flag on one of them counts.
When the column names a test case with no step, R1 counts the bug as not flagged. R2 uses the test case.
A hit is a flag on a target step of a missed patch. A test case with no step gives no target step.
Each target step and each flag is a step of the set `test-cases-v1:test-cases`.

## Missed bugs

| Patch | Target steps | Flags on a target step | Flags on a target test case |
|---|---|---|---|
| M01 | `TC-07 step 8` | `TC-07#8` | `TC-07#6`, `TC-07#8`, `TC-07#9` |
| M03 | `TC-07 step 8` | `TC-07#8` | `TC-07#6`, `TC-07#8`, `TC-07#9` |
| M09 | `TC-07 step 8` | `TC-07#8` | `TC-07#6`, `TC-07#8`, `TC-07#9` |
| M13 | `TC-07 step 9` | `TC-07#9` | `TC-07#6`, `TC-07#8`, `TC-07#9` |

## Missed patches

| Patch | Kind | Target steps |
|---|---|---|
| M01 | bug | `TC-07 step 8` |
| M03 | bug | `TC-07 step 8` |
| M09 | bug | `TC-07 step 8` |
| M13 | bug | `TC-07 step 9` |

## Flags

| Step | Sources | Class | Missed patches with this target step |
|---|---|---|---|
| `TC-01#1` | `report` | weak by the judge | - |
| `TC-02#3` | `report` | weak by the judge | - |
| `TC-03#4` | `report` | other | - |
| `TC-07#6` | `report` | weak by the judge | - |
| `TC-07#8` | `report` | hit | M01, M03, M09 |
| `TC-07#9` | `report` | hit | M13 |
| `TC-08#2` | `report` | weak by the judge | - |
| `TC-08#6` | `report` | weak by the judge | - |
