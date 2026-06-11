# Yeeflow `.yap` App Generation First Test Plan

This document defines the first safe `.yap` generation test for Codex.

Recommended test app:

**Department Access Management**

Planned components:

1. Departments data list
2. Department Access Requests data list
3. Department Access Request approval form

This plan is design-only. Do not generate or build a `.yap` package until the app-level wrapper builder and validators are ready.

## 1. Why This Is The Right First `.yap` Test

This is the right first `.yap` generation test because it combines the smallest useful set of app-level components:

- a reference data list: Departments
- a transactional/storage data list: Department Access Requests
- an approval form and workflow that reads from one list and writes to another

It uses patterns already proven independently:

- generated `.ydl` data lists
- generated data-list custom forms
- related data-list lookup fields
- generated `.ywf` approval forms
- approval-form lookup controls
- lookup additional field mapping
- `ContentList` persistence from approval workflow to data list
- app/list/field/layout/form ID remapping through `ReplaceIds`

It avoids the sensitive and higher-variance parts of `.yap` exports:

- dashboards
- data reports
- form reports
- AI Agents
- Copilots
- Connections
- Knowledges
- document libraries
- document generation
- external HTTP actions

The key thing this test should prove is that an app-level `.yap` package can remove the staged standalone import/export remapping problem. Because the Departments list, Department Access Requests list, and approval form are packaged together, internal lookup and `ContentList` references should use generated IDs consistently and be remapped together during import.

The v5 sandbox test proved the base app shell, navigation, child lists, and approval form can import and open. Export-back also proved app-level internal lookup sample values remap consistently when both source and target lists are packaged in the same `.yap`.

## 2. Target App Structure

Root application:

- App title: `Department Access Management`
- `AppID`: `41`
- root `ListSetID`: generated large numeric string ID for the sandbox package
- root `Data.Item`: app/listset resource with `ListModel.Type = 1024`

Child resources:

1. `Departments`
   - data list
   - stores department reference data
   - contains Department Name and Department Code
   - may include safe sample rows

2. `Department Access Requests`
   - data list
   - stores approved request records
   - includes a Department lookup field pointing to Departments
   - uses the proven Asset Inventory v5 custom form registration pattern

3. `Department Access Request`
   - approval form/workflow in `Data.Forms[]`
   - request page includes Department lookup and readonly Department Code
   - approval workflow writes approved records to Department Access Requests

## 3. Required Resource Graph

Required nodes:

- `app:Department Access Management`
- `list:Departments`
- `field:Departments.Title`
- `field:Departments.Text1` or equivalent Department Code field
- `list:Department Access Requests`
- `field:Department Access Requests.Department`
- `field:Department Access Requests.Department Code`
- `form:Department Access Request`
- request page
- approval page
- workflow `ContentList` node

Required edges:

- app -> Departments
- app -> Department Access Requests
- app -> Department Access Request approval form
- Department Access Requests.Department lookup -> Departments
- Department Access Requests.Department lookup display field -> Departments.Title
- approval form Department lookup -> Departments
- approval form Department lookup display/sort field -> Departments.Title
- approval form lookup additional source field -> Departments.Department Code
- approval form lookup additional target variable -> DepartmentCode
- approval form `ContentList` -> Department Access Requests
- approval form `ContentList` mappings -> Department Access Requests target fields

No edges should point to external lists or external apps in this first test.

## 4. ID And `ReplaceIds` Strategy

All local package IDs should be generated as large numeric string IDs and included in `Resource.ReplaceIds`.

Local IDs include:

- root app/listset ID
- child list IDs
- field IDs
- layout IDs
- custom form resource IDs
- approval form process/workflow IDs
- approval form page IDs where Yeeflow expects remapping
- report/form keys if present, though reports are excluded from this test
- sample record `ListDataID` values if sample data is included

Internal references must use the generated IDs consistently before packaging:

- Department Access Requests.Department lookup must point to the generated Departments ListID.
- Approval form Department lookup must point to the generated Departments ListID.
- Approval form additional field mapping must point to the generated Departments Department Code field ID/name.
- Approval workflow `ContentList` must point to the generated Department Access Requests ListID.
- `ContentList` target mappings must use generated Department Access Requests field names/IDs consistently.

No external dependency IDs should be included in `ReplaceIds`.

Because both data lists and the approval form are packaged together, Yeeflow should remap local IDs as one app graph. This should avoid the standalone `.ydl` problem where a dependent list points to a pre-import ListID that Yeeflow later remaps.

Internal lookup sample data rule:

- When a lookup target list is packaged inside the same `.yap`, target sample record IDs are local package IDs.
- Include those target sample record IDs in `ReplaceIds`.
- Dependent sample rows may store the target sample `ListDataID` as a plain string.
- Export-back from `Department Access Management_v5` confirmed Yeeflow remapped both target sample record IDs and dependent lookup values consistently.
- If the grid display appears blank while export-back values are correct, treat it as a runtime display/index/cache issue unless row forms or newly edited rows also fail.

## 5. Normalized App Spec

Proposed normalized spec shape:

```json
{
  "app": {
    "title": "Department Access Management",
    "appId": "41",
    "listSetId": "__GENERATED_LOCAL_LISTSET_ID__",
    "description": "Sandbox generated app for department access request management."
  },
  "dataLists": [
    {
      "key": "departments",
      "title": "Departments",
      "listId": "__GENERATED_DEPARTMENTS_LIST_ID__",
      "fields": [],
      "views": [],
      "customForms": [],
      "sampleData": []
    },
    {
      "key": "departmentAccessRequests",
      "title": "Department Access Requests",
      "listId": "__GENERATED_REQUESTS_LIST_ID__",
      "fields": [],
      "views": [],
      "customForms": [],
      "sampleData": []
    }
  ],
  "approvalForms": [
    {
      "key": "DAR",
      "title": "Department Access Request",
      "workflowType": 2,
      "defResource": {}
    }
  ],
  "relationships": [
    {
      "type": "dataListLookup",
      "source": "departmentAccessRequests.Department",
      "targetList": "departments",
      "displayField": "departments.Title"
    },
    {
      "type": "approvalFormLookup",
      "source": "DAR.Department",
      "targetList": "departments",
      "displayField": "departments.Title"
    },
    {
      "type": "lookupAdditionalField",
      "sourceField": "departments.DepartmentCode",
      "targetVariable": "DepartmentCode"
    },
    {
      "type": "workflowContentList",
      "sourceForm": "DAR",
      "targetList": "departmentAccessRequests"
    }
  ],
  "replaceIds": [],
  "dependencies": []
}
```

The first test should have an empty `dependencies` array except for runtime assumptions such as importing into a sandbox Yeeflow tenant.

## 6. Validation Pipeline

Before any `.yap` wrapper build:

1. Validate each generated child data list resource with `validate-ydl-list.js`.
   - Use generator/final mode for final child resources.
   - Confirm fields, views, custom forms, lookup metadata, and sample data.

2. Validate the approval form Def with `validate-ywf-def.js`.
   - Use final mode.
   - Confirm request page, approval page, variables, workflow graph, action panel/history, lookup control, additional field mapping, and `ContentList`.

3. Validate the assembled app package with `validate-yap-package.js`.
   - Use generator/final mode.
   - Confirm root app/ListSet, child resources, forms, `ReplaceIds`, and package structure.

4. Validate the assembled app relationship graph with `validate-yap-graph.js`.
   - Use generator/final mode.
   - Confirm lookup targets, display fields, approval-form lookup source, additional field mapping, `ContentList` target list, and mapped fields.

All four validation layers must pass before wrapper build.

## 7. Build Pipeline

Future build pipeline:

1. Generate decoded Departments child list resource.
2. Generate decoded Department Access Requests child list resource.
3. Generate decoded Department Access Request approval form `DefResource`.
4. Assemble decoded `.yap` `Resource.Data`:
   - `Data.Item`: root app/listset
   - `Data.Childs[]`: Departments and Department Access Requests
   - `Data.Forms[]`: Department Access Request approval form
   - reports/dashboards/modules omitted
5. Validate components.
6. Validate assembled app package.
7. Validate app graph.
8. Build `.yap` wrapper later with a future `build-yap-wrapper.js`.
9. Do not build if `build-yap-wrapper.js` does not exist or if any validator fails.

## 8. Stop Conditions

Stop before final `.yap` generation if any of these are true:

- unresolved IDs remain
- placeholders remain in final mode
- Departments lookup target is missing
- Department Code source field is missing
- Department Access Requests lookup target is missing
- approval form lookup source list or display field is missing
- approval form additional field mapping cannot resolve
- approval workflow `ContentList` target list is missing
- `ContentList` target fields are missing
- structural validation fails
- graph validation fails
- local generated IDs are missing from `ReplaceIds`
- external IDs appear in `ReplaceIds`
- sensitive resources are accidentally included
- root app/ListModel metadata is unclear
- dashboards, reports, AI resources, document libraries, or external HTTP actions are requested before the base app test passes

## 9. Expected Test Checklist

After a future `.yap` build/import:

1. App imports successfully.
2. `Departments` list appears.
3. `Departments` sample data appears.
4. `Department Access Requests` list appears.
5. `Department Access Requests.Department` lookup resolves to Departments.
6. Department Access Request approval form imports.
7. Approval form publishes.
8. Request page Department lookup works.
9. Department Code auto-fills from the selected Department.
10. Line manager approval route works.
11. Rejection path ends correctly.
12. Approved path creates a Department Access Requests record.
13. Created record preserves:
    - Request No.
    - Applicant
    - Submission Date
    - Department
    - Department Code
    - Access Reason
    - Needed By Date
    - Approval Status
14. Export the app back and compare:
    - remapped IDs
    - lookup references
    - `ContentList` target references
    - custom form registration
    - approval form page registration
    - `ReplaceIds`

## 10. Tool Roadmap

Recommended next tools:

1. `build-yap-wrapper.js`
   - Wrap decoded app `Resource.Data` into a `.yap` using the confirmed gzip/base64 `Resource` format.
   - Run round-trip validation before writing or immediately after writing.

2. `compare-yap-export-back.js`
   - Compare generated `.yap` decoded data with exported-back Yeeflow `.yap`.
   - Identify remapped IDs, dropped resources, rewritten metadata, and changed references.

3. `generate-yap-from-spec.js`
   - Later-stage generator that converts normalized app specs into decoded `.yap` drafts.
   - Should only be introduced after the Department Access Management hand-built first test succeeds.

The immediate next build target should be `build-yap-wrapper.js`, but only after enough decoded app package structure has been assembled and validated locally.

## 11. v5 Baseline Result

`Department Access Management_v5` is the first successful generated `.yap` baseline.

Confirmed:

- import popup showed logo, name, and description
- app installed into the workspace
- app opened from the workspace card
- root app header and navigation rendered
- Type `103` overview page opened
- `Departments` list opened and displayed 3 sample rows
- `Department Access Requests` list opened and displayed sample request rows
- `Department Access Request` approval form opened and rendered the request page

The successful app shell required:

- non-null wrapper `IconUrl`
- root `CustomType = ""`
- root `Perm = 0`
- root `WorkspaceID`
- populated root `LayoutView` navigation
- at least one root Type `103` app page layout
- `AppTags`, `AppMetadatas`, and `AppComponents` arrays
- non-empty `AppThemes`
- populated root `CreatedBy` and `ModifiedBy`

Type `103` root app pages use a distinct resource-registration rule:

- `LayoutID` is included in `ReplaceIds`
- `LayoutInResources[0].ID` and `RefId` are separate resource IDs
- those `LayoutInResources` resource IDs are excluded from `ReplaceIds`

Remaining runtime follow-up:

- If the `Department Access Requests.Department` lookup display is blank in the grid, refresh/reopen the app, open a sample row form, and create or edit one row to confirm whether runtime lookup display is healthy. Do not change the package sample-value rule unless export-back or form behavior proves the data is broken.

## 12. Visitor Access Management v5 Fresh-Compatible Follow-Up

`visitor-access-management.v5-fresh-compatible.yap` is the first successful Visitor Access Management app-level baseline.

Learning sequence:

- Expanded Visitor app packages failed during import.
- Isolation packages failed.
- A control package based on the working Department Access Management v5 structure imported.
- A v5-compatible Visitor package that reused the old `206...` local ID family and `DAR` key imported but opened as a blank app.
- The fresh-compatible v5 package imported and opened after using a fresh local ID family and fresh approval form key `VAV`.

Fresh ID policy for future app-level tests:

- Every generated `.yap` app test should use a fresh local ID family.
- Every generated approval form inside a generated `.yap` should use a fresh FlowKey/form key.
- Do not reuse local generated IDs from an app that has already been imported into the sandbox.
- Reused local IDs can import but leave the app blank or components detached.
- Validators and generators should warn or fail on known ID-family/key reuse when prior generated/imported artifacts are detectable.

Visitor Access v6 expansion plan:

- Start from the v5 fresh-compatible baseline.
- Add exactly one extra Visitor request field to the list and approval form.
- Validate and build.
- Import-test and export back.
- Repeat one field at a time until the expanded schema is proven.

## 13. Visitor Access v6.1 One-Field Expansion Result

The first successful expansion after the v5 fresh-compatible baseline is `Visitor Access Management v6.1`.

What was added:

- `Visitor Name`
- data-list field slot: `Visitor Access Requests.Text8`
- approval form variable: `VisitorName`
- request page control
- approval page readonly control
- workflow `ContentList` mapping: `VisitorName -> Text8`
- sample row values

Failure and fix sequence:

- v6 added `Visitor Name`, but the approval form was missing after import.
- Root cause: app-level approval form `Data.Forms[0].ListID` was set to `ProcModelID`.
- Correct rule: app-level approval form registration must keep `Data.Forms[].ListID = 0`.
- v6 formfix restored `ListID = 0`, but reused the same `210...` ID family and `VAN` key after the broken v6 package had already been imported.
- That reuse produced a blank/detached app shell.
- v6.1 used a fresh `211...` ID family and fresh form key `VAW`.
- v6.1 imported, opened, showed navigation, showed the approval form, and rendered `Visitor Name`.

Updated expansion rule:

- Every import-test package must get a fresh local ID family, even if the previous package failed.
- Every import-test approval form must get a fresh FlowKey/form key.
- Keep app-level approval form `ListID = 0`.
- Add one field/change at a time and preserve proven field slots unless the test is specifically about a new slot.

## 14. Visitor Access v7 Expansion Result

`Visitor Access Management v7` successfully expanded the working v6.1 baseline by one additional text field.

v7 change:

- Added `Visitor Company` as `Visitor Access Requests.Text9`.
- Used fresh ID family `212...`.
- Used fresh FlowKey/form key `VAX`.
- Preserved app-level approval form `Data.Forms[].ListID = 0`.
- Added `VisitorCompany -> Text9` to workflow `ContentList`.

Confirmed result:

- App imported and opened correctly.
- App navigation rendered.
- Approval form appeared.
- `Visitor Name` rendered.
- `Visitor Company` rendered.
- `ContentList` persisted `VisitorCompany` to `Text9`.

Expansion rule confirmed:

- One-field expansion from a known-good generated `.yap` baseline is the safe path.
- Text field expansion into a new `Text*` slot is safe when the data list, custom form, approval form request page, approval page readonly view, sample rows, and `ContentList` mapping are updated consistently.

Current proven Visitor request schema:

| Field | Slot |
| --- | --- |
| Department lookup | `Text2` |
| Department Code | `Text3` |
| Visit Purpose | `Text4` |
| Visitor Name | `Text8` |
| Visitor Company | `Text9` |
| Access Area | `Text10` |
| Host Employee | `Text11` |
| Visitor Contact | `Text12` |
| Visit Date | `Datetime2` |

## 15. Visitor Access v8-v10 Expansion Results

The Visitor Access Management app has now passed three more one-field expansion tests from the latest known-good baseline.

| Version | Field added | Slot | ID family | FlowKey | Result |
| --- | --- | --- | --- | --- | --- |
| v8 | Access Area | `Text10` | `213...` | `VAY` | Imported/opened; field rendered and persisted. |
| v9 | Host Employee | `Text11` | `214...` | `VAZ` | Imported/opened; field rendered and persisted. |
| v10 | Visitor Contact | `Text12` | `215...` | `VBA` | Imported/opened; field rendered and persisted. |

The v10 package confirms the current text-field expansion chain:

- v6.1 `Visitor Name -> Text8`
- v7 `Visitor Company -> Text9`
- v8 `Access Area -> Text10`
- v9 `Host Employee -> Text11`
- v10 `Visitor Contact -> Text12`

Current proven Visitor request schema:

| Field | Slot |
| --- | --- |
| Department lookup | `Text2` |
| Department Code | `Text3` |
| Visit Purpose | `Text4` |
| Visitor Name | `Text8` |
| Visitor Company | `Text9` |
| Access Area | `Text10` |
| Host Employee | `Text11` |
| Visitor Contact | `Text12` |
| Visit Date | `Datetime2` |

Generator rule:

- Expand from a known-good baseline one change at a time.
- Use a fresh ID family and fresh FlowKey/form key for every import-test package.
- Keep app-level approval form `Data.Forms[].ListID = 0`.
- Update the list field definition, list views where useful, custom list form, approval request page, approval readonly page, workflow variable, `ContentList` mapping, and sample rows together.
- Validate with `validate-yap-package.js`, `validate-yap-graph.js`, and `validate-ywf-def.js` before wrapper build.

Next recommended tests:

- Convert `Access Area` from a simple text field to a choice/dropdown.
- Test `Host Employee` as a user picker or lookup.
- Add dashboard/report resources only after the core app remains stable.

## 16. Visitor Access v11 Multi-Type Expansion Result

`Visitor Access Management v11` is the first successful generated multi-field, multi-type app expansion.

v11 started from the working v10 baseline and added five persisted fields in one package:

| Field | Slot | Type |
| --- | --- | --- |
| Visitor Email | `Text13` | text/input |
| Visitor Phone | `Text14` | text/input |
| Number of Visitors | `Decimal1` | Decimal/input_number |
| Access Type | `Text15` | Text/radio dropdown |
| Requires Escort | `Bit1` | Bit/switch |

Successful package settings:

- Fresh ID family: `216...`
- Fresh FlowKey/form key: `VBB`
- App-level approval form `Data.Forms[].ListID = 0`
- No unresolved placeholders
- No dashboards, reports, AI resources, connections, document libraries, list workflows, custom code, or external actions

v11 also included `Escort User` as an approval-form-only conditional/display field. It is shown when `RequiresEscort == true` using the target control `attrs.control_display[]` rule and is not persisted in v11.

Confirmed ContentList mappings:

| Source variable | Target field |
| --- | --- |
| `VisitorEmail` | `Text13` |
| `VisitorPhone` | `Text14` |
| `NumberofVisitors` | `Decimal1` |
| `AccessType` | `Text15` |
| `RequiresEscort` | `Bit1` |

The v11 result changes the expansion guidance:

- One-field expansion remains the safest way to isolate an unknown field/control type.
- Multi-field expansion is acceptable after the individual field/control types have been proven from export evidence and validator checks.
- A multi-field package must still use a fresh ID family and fresh FlowKey.
- Data-list definitions, custom list form controls, approval request controls, approval readonly controls, workflow variables, sample values, and `ContentList` mappings must be updated as a consistent set.

Current proven Visitor schema:

| Field | Slot |
| --- | --- |
| Department lookup | `Text2` |
| Department Code | `Text3` |
| Visit Purpose | `Text4` |
| Visitor Name | `Text8` |
| Visitor Company | `Text9` |
| Access Area | `Text10` |
| Host Employee | `Text11` |
| Visitor Contact | `Text12` |
| Visitor Email | `Text13` |
| Visitor Phone | `Text14` |
| Number of Visitors | `Decimal1` |
| Access Type | `Text15` |
| Requires Escort | `Bit1` |
| Visit Date | `Datetime2` |
