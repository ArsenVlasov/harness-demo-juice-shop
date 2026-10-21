# The client suite for E4

Source: `bench/select-client.mjs`, 2026-10-21T10:31:57.480Z. Rule: bench/hypotheses-v2.md, section "The client suite for E4" (tag hypotheses-v2).

| Candidate | Tests | Clean run | Clean build | Recheck | Eligible | Missed bugs | Mutation score | Judge partial + missing | Judge missing |
|---|---|---|---|---|---|---|---|---|---|
| vague A-1 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 2 | 0 |
| vague B-1 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 0 | 0 |
| vague A-2 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 21 | 0 |
| vague B-2 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 0 | 0 |
| vague A-3 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 18 | 0 |
| vague B-4 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 0 | 0 |
| haiku A-1 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 16 | 7 |
| haiku B-1 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 5 | 0 |
| haiku A-2 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 3 | 0 |
| haiku B-2 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 3 | 0 |
| haiku A-3 | 8 | 8 passed, 0 failed | 8 of 8 | 7 of 8 | no | 4 (M01 M03 M09 M13) | 10 of 14 | 7 | 0 |
| haiku B-3 | 8 | 8 passed, 0 failed | 8 of 8 | 8 of 8 | yes | 0 | 14 of 14 | 1 | 0 |

Step 3 applies, so the keys of step 4 do not apply.

The client suite: **vague A-1**. The reason: step 3: each eligible candidate misses 0 bugs, and A-vague run 1 is eligible.
