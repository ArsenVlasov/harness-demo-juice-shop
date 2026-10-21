# Measures of the audit (label A)

The rules are in the section "Measures of the audit" of `bench/hypotheses-v2.md` at the tag `hypotheses-v2`.
The command `bench/e4-prepare.mjs score` wrote this file at 2026-10-21T12:17:51.928Z.

| Input | File | sha256 |
|---|---|---|
| flags | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/results/e4-flags-x1.json` | `cba6e5da2f818075eba2f778eb0252618472fe0ab534e851432b699bd5a71627` |
| mutants | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/results/mutants-vague-1.json` | `281304e36e6346835f2d131c74f81cfafb0de751dc504ef540b4b1882c9fb549` |
| judge | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/bench/results/judge-vague-1/suite-1.json` | `25fb36d649404261061d4025e0c7da30d1f9efb8a5f6f6a9f0567138ba0e068d` |
| sealed | `/Users/arsenvlasov/Documents/WorkFolder/harness-demo-juice-shop/sealed/mutants.md` | `8490378e5d1ab2581b375b21c3318fa515f7c3618ed4081649eb288aa556c30c` |

| Measure | Result | Value |
|---|---|---|
| R1: missed bugs with a flag on a target step | not tested (no missed bug) | - |
| R2: missed bugs with a flag on a step of a target test case | not tested (no missed bug) | - |
| P1: hits, of all flags | not tested (no missed patch) | - |
| P2: hits and flags that are weak by the judge, of all flags | not tested (no missed patch) | - |
| Flags of the class "hit" | 0 | - |
| Flags of the class "weak by the judge" | 2 | - |
| Flags of the class "other" | 20 | - |

A target step is a step in the column of the expected test case step of the sealed table.
When the column names more than one step, a flag on one of them counts.
When the column names a test case with no step, R1 counts the bug as not flagged. R2 uses the test case.
A hit is a flag on a target step of a missed patch. A test case with no step gives no target step.
Each target step and each flag is a step of the set `test-cases-v1:test-cases`.

## Missed bugs

None.

## Missed patches

None.

## Flags

| Step | Sources | Class | Missed patches with this target step |
|---|---|---|---|
| `TC-01#2` | `T15-d`, `T15-e`, `T15-f` | other | - |
| `TC-01#3` | `report` | other | - |
| `TC-01#5` | `T14-b` | other | - |
| `TC-02#1` | `report` | other | - |
| `TC-02#2` | `T15-d`, `T15-e`, `T15-f` | other | - |
| `TC-04#1` | `T15-d`, `T15-e`, `T15-f` | other | - |
| `TC-04#2` | `report` | weak by the judge | - |
| `TC-04#3` | `T15-d`, `T15-e`, `T15-f` | other | - |
| `TC-04#5` | `T15-d`, `T15-e`, `T15-f` | other | - |
| `TC-05#4` | `T15-d`, `T15-e`, `T15-f` | other | - |
| `TC-06#3` | `T15-d`, `T15-e`, `T15-f` | other | - |
| `TC-06#4` | `T15-d`, `T15-e`, `T15-f` | weak by the judge | - |
| `TC-06#5` | `T04-a` | other | - |
| `TC-07#5` | `T15-d`, `T15-f` | other | - |
| `TC-07#6` | `T04-a`, `report` | other | - |
| `TC-07#7` | `T15-d`, `T15-f` | other | - |
| `TC-07#9` | `report` | other | - |
| `TC-08#2` | `T04-a` | other | - |
| `TC-08#4` | `T15-d` | other | - |
| `TC-08#6` | `T04-a` | other | - |
| `TC-08#7` | `T04-a` | other | - |
| `TC-08#8` | `T15-d` | other | - |
