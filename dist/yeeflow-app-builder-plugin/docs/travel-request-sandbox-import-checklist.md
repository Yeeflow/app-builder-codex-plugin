# Travel Request Sandbox Import Checklist

This checklist prepares the Travel Request Approval draft for a controlled Yeeflow sandbox import test.

Do not use production metadata for this draft. Do not import until metadata replacement, final decoded-Def validation, and wrapper round-trip validation all pass.

## 1. Required Yeeflow Sandbox Setup

- A Yeeflow sandbox app for travel request testing.
- A target Travel Requests list inside the sandbox app.
- A Finance Manager job position in the sandbox.
- A test employee account with a valid line manager, because Manager Approval uses the Applicant Line Manager assignment pattern.
- Permission for the importer/tester to import workflow packages into the sandbox.
- Permission for the workflow to create records in the target Travel Requests list.

## 2. Required Travel Requests List Fields

Create or confirm the target list has fields that can store the final approved request.

| Business field | Suggested Yeeflow field type | Notes |
| --- | --- | --- |
| Travel Request No. | Single line text | Stores workflow tracking number. |
| Applicant | User/person field if supported | If the list only accepts text, confirm expression output is compatible before import. |
| Department | Single line text | Plain requester department. |
| Destination | Single line text | Required on form. |
| Travel Purpose | Multiple lines text | Required on form. |
| Start Date | Date or datetime | Required on form. |
| End Date | Date or datetime | Required on form. |
| Estimated Total Amount | Number, decimal, or currency | Calculated from expense rows. |
| Attachment | File/attachment field if supported | Current draft maps the form attachment variable to this field; confirm target field compatibility. |

The current draft does not persist expense line rows into a child list. Add a separate child-list persistence design before import if row-level expense persistence is required.

## 3. Collect App/List Metadata

Collect these values from trusted sandbox metadata, admin configuration, export files, or an approved sandbox inspection workflow:

- AppID for the sandbox app.
- ListSetID for the Travel Requests list.
- ListID for the Travel Requests list.
- Internal field name for each target list field.

Record them into `travel-request-sandbox-metadata.json`, copied from `travel-request-sandbox-metadata.template.json`.

Required placeholders:

- `__APP_ID_REQUIRED_TRAVEL_APP__`
- `__LISTSET_ID_REQUIRED_TRAVEL_REQUESTS__`
- `__LIST_ID_REQUIRED_TRAVEL_REQUESTS__`
- `__FIELD_INTERNAL_NAME_REQUIRED_TRAVEL_NO__`
- `__FIELD_INTERNAL_NAME_REQUIRED_APPLICANT__`
- `__FIELD_INTERNAL_NAME_REQUIRED_DEPARTMENT__`
- `__FIELD_INTERNAL_NAME_REQUIRED_DESTINATION__`
- `__FIELD_INTERNAL_NAME_REQUIRED_TRAVEL_PURPOSE__`
- `__FIELD_INTERNAL_NAME_REQUIRED_START_DATE__`
- `__FIELD_INTERNAL_NAME_REQUIRED_END_DATE__`
- `__FIELD_INTERNAL_NAME_REQUIRED_TOTAL_AMOUNT__`
- `__FIELD_INTERNAL_NAME_REQUIRED_ATTACHMENT__`

Do not guess internal names from display labels. Yeeflow internal names often differ from user-facing labels.

## 4. Collect Finance Manager Position ID

Collect the sandbox Finance Manager position ID from trusted sandbox metadata, an approved export, or an approved admin inspection workflow.

Required placeholder:

- `__POSITION_ID_REQUIRED_FINANCE_MANAGER__`

Use the real position ID, not the display name `Finance Manager`.

## 5. Fill Metadata JSON

Create a filled metadata file from the template:

```bash
cp ./travel-request-sandbox-metadata.template.json ./travel-request-sandbox-metadata.json
```

For each placeholder entry:

- Set `requiredValue` to the real sandbox value.
- Set `status` to `ready`.
- Keep `placeholder`, `whereUsed`, and `whereUsedByNode` unchanged.
- Keep `expectedCurrentValue` unchanged.

Before replacement, confirm each `whereUsedByNode.expectedCurrentValue` still matches the placeholder in `travel-request-def.json`. If any value differs, stop and inspect the draft drift before applying metadata.

## 6. Apply Metadata, Validate, Build Wrapper

Apply metadata to a new sandbox decoded Def file:

```bash
node apply-ywf-metadata.js \
  ./travel-request-def.json \
  ./travel-request-sandbox-metadata.json \
  ./travel-request-def.sandbox.json
```

Validate the sandbox decoded Def in final mode:

```bash
node validate-ywf-def.js \
  ./travel-request-def.sandbox.json \
  --mode final \
  --dependency-map ./travel-request-dependencies.json
```

Build and round-trip validate the sandbox wrapper:

```bash
node build-ywf-wrapper.js \
  ./travel-request-def.sandbox.json \
  ./travel-request.sandbox.ywf \
  --flow-name "Travel Request Approval" \
  --flow-key TR \
  --workflow-type 2 \
  --description "Sandbox generated Travel Request Approval"
```

Proceed to import testing only if all three commands return `status: "pass"` or an explicitly accepted `pass_with_warnings`.

## 7. Sandbox Import Test Steps

Use only a sandbox environment.

1. Confirm the `.ywf` wrapper was generated from `travel-request-def.sandbox.json`.
2. Confirm the wrapper report showed successful round-trip validation.
3. Import the `.ywf` into the sandbox using the approved Yeeflow import process.
4. During import, map any resources Yeeflow asks to resolve.
5. Do not publish to production.
6. If import fails, capture the exact error and stop. Do not retry with guessed metadata.

## 8. Post-Import Verification Checklist

After sandbox import:

- Form name is `Travel Request Approval`.
- Flow key is `TR`.
- Request page opens for a normal employee.
- Applicant defaults to current user and is readonly.
- Submission Date defaults to current date and is readonly.
- Travel Request No. is generated by workflow number logic.
- Required fields block submission when empty.
- Expense table allows rows and amount entry.
- Estimated Total Amount updates from expense row amounts.
- Manager Approval routes to Applicant Line Manager.
- Manager rejection reaches rejected end state.
- Manager approval with total `<= 5000` skips Finance Approval.
- Manager approval with total `> 5000` routes to Finance Approval.
- Finance Approval routes to the sandbox Finance Manager position.
- Finance rejection reaches rejected end state.
- Final approval creates a Travel Requests list record.
- Created record fields map to the correct internal fields.
- Approval page shows readonly request data, expense list, workflow control panel, and workflow history.

## 9. Known Risks and Rollback Guidance

Known risks:

- Applicant Line Manager assignment depends on Yeeflow user profile manager data.
- Finance Manager assignment depends on a real sandbox position ID.
- ContentList persistence depends on exact AppID, ListSetID, ListID, and internal field names.
- Attachment persistence may require a target file/attachment field type; confirm compatibility before final use.
- Expense rows are used for calculation but are not currently persisted to a separate child list.
- Import behavior can still depend on Yeeflow version-specific defaults that are not fully represented in the decoded Def draft.

Rollback guidance:

- Test only in sandbox.
- If import creates an unusable workflow, disable or delete the imported sandbox workflow.
- Remove any test Travel Requests records created during verification.
- Keep the original `travel-request-def.json` unchanged as the draft baseline.
- Keep the filled metadata file separate from the template.
- If validation fails, fix metadata or draft structure first; do not edit the generated `.ywf` wrapper by hand.
