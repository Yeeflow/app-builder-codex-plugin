# Approval Form Controls Runtime Test Plan

Date: 2026-05-14

## Goal

Continue approval-form control runtime testing after the successful `Approval Form Controls Test v1` baseline. The plan is to prove remaining safe controls through small staged packages rather than one large high-risk app.

## Rules For Every Stage

- Use a fresh local ID family.
- Use a fresh FlowKey/form key.
- Keep `Data.Forms[].ListID = 0`.
- Preserve native Title metadata on every generated data list.
- Use one small persistence list unless the stage specifically tests list/sublist behavior.
- Use a simple approval workflow.
- Use `ContentList` persistence only where the value shape is safe to map.
- Do not include AI, external connections, document libraries, or reports.
- Keep the Yeeflow design-system shell: page-level background, structural `Main`, `Content`, `Form body`, `Form bottom`, Action Panel, and Flow History.
- Use learned Text control standards and meaningful `nv_label` values.
- Runtime status is not promoted until import, app open, form render, submit, task approval, and persistence checks pass.

## Stage 2 - Advanced Input Controls

Package: `Approval Form Controls Test v2`

Generator: `generate-approval-form-controls-test-v2-advanced-inputs.mjs`

Controls under test:

- `percent`
- `daterange`
- `time`
- `hyperlink`
- `rate`
- `calculated`

Infrastructure controls:

- `input` for request title
- `input_number` as calculation source
- `textarea` for notes/reviewer comments
- `identity-picker` for current-user task assignment
- `workflowControlPanel`
- `workflowHistory`

Runtime checks:

- App imports.
- App opens.
- Approval form opens.
- Percent, date range, time, hyperlink, rate, and calculated controls render.
- User can enter values.
- Calculated value updates from source number and percent.
- Submit works.
- Approval task opens.
- Approval works.
- Data-list record is created through `ContentList`.
- Persisted fields appear in the list view.

## Stage 3 - Upload and Media Controls

Controls:

- `file-upload`
- `icon-upload`

Test only after Stage 2 passes. Use a small safe upload file. Do not test large files or customer data.

## Stage 4 - People and Organization Pickers

Controls:

- `identity-picker` multiple
- `organization-picker`
- `cost-center-picker`
- `location-picker`

These are tenant/environment-sensitive and should use export-backed minimal attrs. Use text fallback if a picker cannot resolve safely.

## Stage 5 - Metadata and Tags

Controls:

- `metadata`
- `mutiple-metadata`
- `tag`

Metadata controls require known `source` and `categoryId`. Stop if category metadata cannot be resolved from a safe export.

## Stage 6 - Lookup and List Controls

Controls:

- `lookup`
- `lookup-list`
- `list`
- `listref`
- `data-list`

Use an internal packaged source list. Start with single lookup selection before lookup-list or sublist/listref.

## Stage 7 - Signer and Special Controls

Controls:

- `signer`
- tabs/layout controls if still unproven
- any remaining safe controls from the coverage matrix

Signer requires focused export-backed proof before generated runtime testing.

## Stop Conditions

Stop the current stage if:

- local validators fail with unclear root cause
- import fails and browser evidence does not identify a clear isolation step
- a control source cannot resolve
- a value binding cannot resolve
- ContentList mapping is type-unsafe
- continuing would require guessing an unproven shape
