# Form Actions Phase 2 Query Submit Runtime Test Plan

## Goal

Generate and runtime-test `Form Actions Phase 2 Query Submit Test v1` to prove Codex can generate the Form Actions Phase 2 patterns learned from the manually updated runtime export.

## Runtime Behaviors To Prove

- Query data multiple items.
- Query data single item.
- Query result count output.
- Query result collection mapped to a sub list.
- Explicit selected field mapping.
- Query result display from temp variables.
- `arraySum` over query result collection.
- `JSONStringfy` display of query result collection if safe.
- Submit form action step.
- Save changes submit mode.

`vLookup` should not be included until an export-backed function token is available. The Phase 2 source export only labels a button/action with vLookup; it does not contain a `vLookup` expression token.

## App

Name: `Form Actions Phase 2 Query Submit Test v1`

Scope:

- one source data list
- one target data list
- one approval form
- simple approval workflow
- ContentList persistence for submitted workflow variables
- no dashboard unless required
- no AI
- no external integrations
- no document libraries

## Source Requests Data List

Fields:

- native `Title`
- `Request Title`
- `Approval Status`
- `Final Notes`
- `Amount`
- `Active`

Include sample rows so query actions can return predictable results.

## Target Requests Data List

Fields:

- native `Title`
- `Request Title`
- `Loaded Count`
- `Selected Query Title`
- `Selected Query Status`
- `Query Summary`
- `Sum Amount`
- `Approval Status`
- `Created From Workflow`

## Approval Form

Submission page:

- `Request Title`
- `Final Notes`
- `Query Results` sub list
- `Total Items` display
- `Query Title`
- `Query Request Title`
- `Query Approval Status`
- `Query Final Notes`
- `Sum Amount Query Items`
- optional query collection JSON text display
- buttons:
  - `Load Multiple Test Requests`
  - `Load Single Test Request`
  - `Calculate Sum with arraySum`
  - `Submit form for testing`
  - `Save as draft`

Task page:

- readonly mirror of the key request/query fields
- Action Panel and Flow History in Form bottom

## Form Actions

### Load Multiple Test Requests

Steps:

1. `querydata`
   - source: Source Requests
   - type: `multiple`
   - sort by Created descending
   - map `Title`, `Request Title`, and `Approval Status` into the `Query Results` sub list
   - store count into `var_TotalQueryItems`

### Load Single Test Request

Steps:

1. `querydata`
   - source: Source Requests
   - type: `single`
   - sort by Created descending
   - map selected fields into workflow variables
   - store count into `var_TotalQueryItems`

### Calculate Sum With arraySum

Steps:

1. `querydata`
   - source: Source Requests
   - type: `multiple`
   - selected fields: `Title`, `Amount`
   - output collection: `var_CollectionofQueryItems`
   - output count: `var_TotalQueryItems`
2. `setvar`
   - set workflow variable `SumAmountQueryItems`
   - value: `arraySum(__temp_var_CollectionofQueryItems, "Amount", [], [])`

### Submit Form For Testing

Steps:

1. `submit`

### Save As Draft

Steps:

1. `submit`
   - `attrs.submitType = "3"`
   - `attrs.closeForm = true`
   - `attrs.ignoreValid = true`

## Workflow

- Start
- Submit
- Reviewer Approval
- ContentList create target record
- End
- Reject path to EndRejectEvent

Use requester/current-user expression assignment; do not hardcode tenant-specific direct users.

## Validation

Run:

- `node --check` on generator
- JSON parse checks
- `node scripts/smoke-expression-validation.mjs`
- `node validate-yap-package.js`
- `node validate-yap-graph.js`
- `node validate-ywf-def.js`
- `node validate-ydl-list.js` where practical
- `node build-yap-wrapper.js` round trip

## Runtime Checklist

- app imports
- app opens
- source list opens and sample rows load
- target list opens without `datas/query` 400
- approval form opens
- Load Multiple populates sub list
- total count display updates
- Load Single maps fields
- Calculate Sum with `arraySum` updates numeric variable
- Save as draft behaves as expected
- Submit form button submits workflow
- reviewer task opens
- approval completes
- ContentList creates target record
- temp variables are not persisted unless copied into workflow variables
