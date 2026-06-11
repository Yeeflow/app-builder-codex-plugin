# Generated Data List + Approval Form Integration Pattern

## 1. Scenario

This pattern was proven with the **Department Access Request** approval form and a dedicated **Department Access Requests** data list.

The full scenario includes:

- A Department Access Request approval form.
- A dedicated Department Access Requests data list used as the workflow persistence target.
- A Departments data list used as the lookup source.
- A Department lookup control on the approval form.
- A Department Code field auto-filled through the lookup control additional-field mapping.
- A workflow `ContentList` / Set Data List action that creates a row in the dedicated Department Access Requests list after approval.

The key lesson is that the approval form should not target the generated pre-import list IDs directly. Yeeflow may remap list and field IDs during import, so the final approval-form persistence target must be patched from the exported-back `.ydl` metadata.

## 2. Staged Generation Process

Use this staged process when a generated approval form needs a generated storage list:

1. Generate the data list first as a `.ydl` package.
2. Import the data list into the sandbox manually.
3. Export the imported data list back from Yeeflow.
4. Decode the exported-back `.ydl`.
5. Extract the real/remapped list metadata:
   - `AppID`
   - `ListSetID`
   - `ListID`
   - field `FieldName`
   - field `InternalName`
   - field `FieldID`
6. Patch the approval form `ContentList` target to the exported-back list metadata.
7. Validate the decoded approval form structurally:

   ```bash
   node validate-ywf-def.js ./department-access-request-def.v2-dedicated-list.json --mode final
   ```

8. Validate the decoded approval form against the generated list metadata:

   ```bash
   node validate-ywf-def-against-yap.js \
     ./department-access-request-def.v2-dedicated-list.json \
     ./department-access-requests-list-exported-metadata.json \
     --mode final \
     --profile generator
   ```

9. Build the `.ywf` only after both validations pass.
10. Import, publish, and test the approval form manually in the sandbox.

## 3. Data List Generation Details

The Department Access Requests data list included these fields:

| Display name | FieldName | Purpose |
| --- | --- | --- |
| Request No. | `Title` | Stores the approval request number. |
| Applicant | `Text1` | Stores the requester/applicant. |
| Submission Date | `Datetime1` | Stores the original submission date. |
| Department | `Text2` | Lookup to Departments. |
| Department Code | `Text3` | Stores the derived code from Departments. |
| Access Reason | `Text4` | Stores the requester reason. |
| Needed By Date | `Datetime2` | Stores the requested deadline. |
| Approval Status | `Text5` | Stores status such as Approved. |
| Approved Date | `Datetime3` | Stores workflow approval time. |
| Created From Workflow | `Text6` | Marks workflow-created rows. |
| Notes | `Text7` | Optional notes. |

The generated data list also included:

- A Department lookup field configured to the existing Departments list.
- A custom detail form based on the Asset Inventory v5 data-list form pattern.
- Views such as all requests, approved requests, pending requests, and requests by department.
- Sample records for sandbox testing.
- External Departments lookup record IDs excluded from `Resource.ReplaceIds`.

For lookup sample data, standalone `.ydl` packages must preserve external lookup IDs. If external lookup record IDs are included in `Resource.ReplaceIds`, Yeeflow may remap them during import and the lookup can display as `(Deleted)`.

## 4. Approval Form Patch Details

The Department Access Request approval form originally wrote to sandbox Procurement PR Records. Stage 2 patched only the workflow persistence target and mappings.

The `ContentList` node was changed to target:

- AppID: `41`
- ListSetID: `2041029207826120704`
- ListID: `2053754514355138562`
- Node name: `Create Department Access Request Record`
- Operation: `add`

Field mappings:

| Source | Target field |
| --- | --- |
| `RequestNo` | `Title` |
| `Applicant` | `Text1` |
| `SubmissionDate` | `Datetime1` |
| `field_9` Department lookup | `Text2` |
| `DepartmentCode` | `Text3` |
| `AccessReason` | `Text4` |
| `NeededByDate` | `Datetime2` |
| literal `Approved` | `Text5` |
| `now()` | `Datetime3` |
| literal `Yes` | `Text6` |

The patch preserved:

- Department lookup control configuration.
- Department Code additional-field mapping.
- Request page UI.
- Approval page UI.
- Workflow graph layout.
- Approval assignment.
- Page registration metadata.
- Action panel and workflow history.

## 5. Validation Rules

Before building the final patched approval `.ywf`, validate:

- No unresolved placeholders remain.
- `ContentList` target list exists in exported-back metadata.
- Every mapped target field exists.
- Source workflow variables exist.
- Source and target field types are compatible.
- Lookup source metadata resolves.
- Lookup display/sort field resolves.
- Lookup additional field source resolves.
- Lookup additional field target variable resolves.
- Generated list metadata comes from exported-back `.ydl`, not pre-import generated IDs.

Do not use pre-import generated list IDs for production-like approval form testing. They are useful for building the first list package, but the final approval form must use the imported/exported-back list metadata.

## 6. Sandbox Test Result

This pattern was validated with the Department Access Request test:

- Data list import passed.
- Approval form import passed.
- Approval form publish passed.
- Departments lookup worked.
- Department Code additional-field auto-fill worked.
- Approval workflow created a row in the dedicated Department Access Requests list.

## 7. Generator Rule

For any generated approval form that needs its own storage list:

1. Generate the data list first.
2. Import and export it back from Yeeflow.
3. Extract the exported-back list and field metadata.
4. Patch the approval form `ContentList` target and mappings.
5. Validate structurally.
6. Validate against exported-back generated-list metadata.
7. Build the final `.ywf`.

Never target pre-import generated IDs for production-like testing. Always use the real/remapped IDs from the exported-back `.ydl`.

## 8. Future Upgrade

This staged process should later become app-level `.yap` generation for multi-component packages.

That future app-level generator should package:

- Data lists.
- Approval forms.
- Lookup relationships.
- Persistence mappings.
- Views.
- Custom forms.
- Sample data.
- Dependency/remap metadata.

Until that exists, staged `.ydl` generation followed by exported-back metadata patching is the safe path.
