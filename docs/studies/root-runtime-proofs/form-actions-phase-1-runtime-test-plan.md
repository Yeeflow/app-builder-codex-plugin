# Form Actions Phase 1 Runtime Test Plan

## App

`Form Actions Phase 1 Test v1`

## Purpose

Prove generated support for Yeeflow Form Actions Phase 1:

- button styles
- temp variables
- page-load action
- button click action
- Set variable step
- Show confirm dialog step

## Scope

- one target data list for final persisted records
- one approval form
- simple approval workflow
- ContentList persistence of workflow variables only
- no AI
- no external integrations
- no document libraries
- no dashboard unless required by app shell

## Form Scenario

Submission page:

- Request Title
- Confirmation Result display
- Temp Status display
- Button Style Gallery
- Action Button Row
- Notes

Buttons:

- Primary Start
- Soft On hold
- Outline Save
- Neutral Verify
- Dashed Import
- Add New item with plus icon
- Next with right arrow icon
- Set Default Title
- Show Confirm Dialog
- Reset Temp Status

Actions:

- Page Load: set Temp Status to `Ready` and Notes to a default value
- Set Default Title: set Request Title if empty
- Toggle Status: set Temp Status by toggling a temp counter
- Show Confirm Dialog: show confirm dialog and store result into temp variable
- Reset Temp Status: set Temp Status to `Reset`

## Runtime Checklist

1. App imports.
2. App opens.
3. Target data list opens without `datas/query` 400.
4. Approval form opens.
5. Page-load action initializes visible temp status.
6. Styled buttons render with expected native styles.
7. Set Default Title button updates Request Title.
8. Toggle Status button updates temp display.
9. Confirm button opens dialog.
10. Confirm/cancel result updates display variable.
11. Submit works.
12. Reviewer task opens.
13. Approval completes.
14. ContentList creates target record.

## Current Runtime Evidence

The first imported runtime app passed items 1-13 after the assignment task assignee was manually corrected from invalid `User:Renger` to a valid tenant user. Item 14 is still pending: the target data list did not show a new ContentList row after approval.

The regenerated local package now uses requester-expression assignment and workflow-variable button mappings for ContentList. Re-import that package before marking Phase 1 as a full runtime pass.

## Stop Conditions

Stop and inspect export/runtime evidence if:

- button action wiring does not trigger
- page-load action does not run
- temp variable expression cannot render
- confirm dialog result shape is unclear
- validator failures point to unresolved action structure
