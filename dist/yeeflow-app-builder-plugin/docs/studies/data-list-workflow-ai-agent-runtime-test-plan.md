# Data-List Workflow AI Agent Runtime Test Plan

Source study baseline: `<downloads>/Spark & AI (1).yap`

## Classification Goal

Possible result levels:

- export-proven
- generated import/open runtime-proven
- execution-proven
- partial
- blocked

## Safety Gate

Do not run live workflow execution when any of these remain true:

- the package points to real business records
- the Agent can update real rows
- the image input comes from private or customer data
- the runtime would call live AI with non-disposable content
- the app-resource tool could update a non-test list

For this branch, those conditions remained true for the source export, so execution is blocked.

## Safe Runtime Scope

Safe-first checks for a future isolated baseline:

1. import generated sandbox package
2. open app shell
3. open Stock Box-like list
4. open workflow designer for the list workflow
5. open AI node configuration
6. confirm `label_image` and `stock_box_item_id` bindings render
7. open Agent configuration
8. confirm app-resource tool is visible and scoped to local sandbox lists
9. stop before running the flow

## Optional Execution Scope

Only if a future generated sandbox baseline is proven harmless:

- use a disposable sample image with no customer data
- use a disposable sandbox row
- confirm the target list is newly generated and not connected to real records
- run the workflow once
- record whether the Agent updates the same row and how fields change

## Current Branch Decision

- Source-export runtime execution: blocked as unsafe
- Safe generated baseline: not produced in this branch
- Runtime status: export-proven only

## Evidence To Capture In A Future Safe Pass

- package validation pass logs
- import/open screenshots or UI notes
- AI node configuration visibility
- Agent tool configuration visibility
- whether execution was skipped, partially run, or fully run
- exact sandbox-only side effects, if any
