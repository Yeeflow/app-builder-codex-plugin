# Yeeflow `.yap` Application Package Study

This report studies two full Yeeflow application exports:

- `NHIC Innovation Ecosystem Platform.yap`
- `Procurement Management.yap`

The goal is to understand `.yap` as the application-level package format that can combine data lists, approval forms, list workflows, reports, dashboards/pages, document libraries, and AI-related resources.

This study is read-only. No package was imported, no Yeeflow UI was operated, and the source exports were not modified.

Generated study outputs:

- `nhic-yap-study-fresh-inspection.json`
- `nhic-yap-study-fresh-inspection.md`
- `nhic-yap-study-fresh-metadata.json`
- `nhic-yap-study-fresh-metadata.md`
- `procurement-yap-study-fresh-inspection.json`
- `procurement-yap-study-fresh-inspection.md`
- `procurement-yap-study-fresh-metadata.json`
- `procurement-yap-study-fresh-metadata.md`

## 1. `.yap` File Format Anatomy

Both `.yap` files are plain JSON wrappers with the same top-level shape:

```json
{
  "Title": "...",
  "Description": "...",
  "IconUrl": "...",
  "IsListSet": true,
  "Resource": "[______gizp______]..."
}
```

The `Resource` field uses the same prefix and compression pattern learned from `.ydl`:

1. Prefix: `[______gizp______]`
2. Base64 payload
3. Gzip-compressed Resource JSON
4. Resource JSON contains a `Data` property
5. `Data` is a JSON string containing the decoded application package

Decoded Resource keys:

```json
{
  "MainListType": 1024,
  "AppID": 41,
  "ReplaceIds": [],
  "ReportIds": [],
  "FormKeys": [],
  "Data": "{...}",
  "SimplePortal": null
}
```

Decoded `Resource.Data` keys:

```json
{
  "Item": {},
  "Childs": [],
  "Forms": [],
  "FormReports": [],
  "DataReports": [],
  "FormNewReports": [],
  "AppGroups": [],
  "AppTags": null,
  "AppMetadatas": null,
  "AppThemes": [],
  "AppComponents": null,
  "PortalInfo": null,
  "OtherModules": []
}
```

Confirmed differences:

| Format | Package role | Main payload | Resource wrapper |
| --- | --- | --- | --- |
| `.ydl` | Single data list package | `Data.Item` is the data list | gzip/base64 `Resource` |
| `.ywf` | Single approval form/workflow | top-level wrapper with base64 `Def` | no `.ydl/.yap` `Resource.Data` structure |
| `.yap` | Full app/listset package | `Data.Item` is root app/listset; `Data.Childs` are resources | gzip/base64 `Resource` |

## 2. Application Resource Inventory

### NHIC Innovation Ecosystem Platform

Package summary:

- Title: `NHIC Innovation Ecosystem Platform`
- AppID: `41`
- Main ListSetID: `2033878389230415872`
- MainListType: `1024`
- ReplaceIds: `175`
- ReportIds: `14`
- FormKeys: `3`

| Resource type | Count | Examples | Where stored | Notes |
| --- | ---: | --- | --- | --- |
| root app/listset | 1 | NHIC Innovation Ecosystem Platform | `Data.Item` | Main application resource. |
| data lists | 5 | Portfolio Management, Partner Management, Communication Records, NHIC Grants, Contact Database | `Data.Childs[].Item` | Child lists share the root ListSetID. |
| workflow/forms | 3 | Auto-link Partner Organization, Update partner info, Sync update Partner and Portfolio | `Data.Forms[]` | WorkflowType `1`; no approval request/approval pages. |
| list workflows | 3 | Same as workflow/forms above | `Data.Forms[]` | Use `ContentList`, `QueryData`, `AI`. |
| dashboards/pages | root has 1 layout | root app page/layout | `Data.Item.Layouts[]` | Type/layout metadata present. |
| data reports | 0 | none extracted | `Data.DataReports[]` | None in this export. |
| form reports | 0 | none extracted | `Data.FormReports[]` / `Data.FormNewReports[]` | None in this export. |
| document libraries | 0 | none extracted | `Data.Childs[]` | None found. |
| AI Agents | 6 module entries | sensitive dependency | `Data.OtherModules[]` Type `Agents` | Do not expose contents blindly. |
| Copilots/knowledge | 2 knowledge entries | sensitive dependency | `Data.OtherModules[]` Type `Knowledges` | Treat as app-level dependencies. |
| connections | 2 | sensitive dependency | `Data.OtherModules[]` Type `Connections` | Credential-like risk; do not copy blindly. |
| themes/settings | 1 theme | app theme | `Data.AppThemes[]` | App-level visual/theme resource. |

### Procurement Management

Package summary:

- Title: `Procurement Management`
- AppID: `41`
- Main ListSetID: `1906896262421815296`
- MainListType: `1024`
- ReplaceIds: `421`
- ReportIds: `31`
- FormKeys: `18`

| Resource type | Count | Examples | Where stored | Notes |
| --- | ---: | --- | --- | --- |
| root app/listset | 1 | Procurement Management | `Data.Item` | Main application resource. |
| data lists | 16 | PR Records, PR Details List, PO Records, PA Records, Supplier List, Purchase Category | `Data.Childs[].Item` | Includes transactional and master/reference lists. |
| report/data resources | 1 | Supplier and PO Details | `Data.Childs[].Item` plus `DataReports[]` | Report-like list resource. |
| document libraries | 2 | Template Files, PO Documents | `Data.Childs[].Item` | Used by document generation / storage. |
| form report/list resources | 1 | PR | `Data.Childs[].Item` plus `FormNewReports[]` | Derived from approval form/report data. |
| approval forms | 4 observed | Purchase Request, Purchase Order Request, Payment Request, New Supplier Form | `Data.Forms[]` | WorkflowType `2`; typically includes two `pageurls`. |
| list/process workflows | many | status update workflows, supplier sync workflows | `Data.Forms[]` | WorkflowType `1`; often no pages. |
| scheduled jobs | 3 | SharePoint sync jobs | `Data.Forms[]` | WorkflowType `3`; includes HTTP/QueryData/Loop nodes. |
| dashboards/pages | 5 root layouts | Home Page, Procurement Overview, Supplier Onboarding | `Data.Item.Layouts[]` | Type `103` pages with embedded resources. |
| data reports | 1 | Supplier and PO Details | `Data.DataReports[]` | Joins/combines source lists. |
| form new reports | 1 | PR | `Data.FormNewReports[]` | Form-derived reporting resource. |
| AI Agents | 1 module entry | sensitive dependency | `Data.OtherModules[]` Type `Agents` | AI references also appear inside forms. |
| knowledge resources | 1 | sensitive dependency | `Data.OtherModules[]` Type `Knowledges` | Treat as dependency. |
| app groups/themes | 1 group, 1 theme | app nav/theme | `Data.AppGroups[]`, `Data.AppThemes[]` | Root app UI/permissions/navigation. |
| token/credential-like list | 1 warning | Token List | child data list | Do not expose values; treat as sensitive. |

## 3. Root App / ListSet Structure

The root application is stored in `Data.Item`.

Root `Item.ListModel` fields include:

- `TenantID`
- `AppID`
- `ListID`
- `Title`
- `Description`
- `Status`
- `IconUrl`
- `TableCode`
- `IndexCode`
- `Created`
- `Modified`
- `CreatedBy`
- `ModifiedBy`
- `Perm`
- `Type`
- `Flags`
- `CustomType`
- `WorkspaceID`
- `LayoutView`
- `IsBreakInherit`
- `IsDataSeparate`
- `AdvanceList`

Important root patterns:

- `ListModel.Type = 1024` for the application/listset root.
- Root `ListID` equals the app/listset ID.
- `Resource.MainListType = 1024`.
- Root `LayoutView` can store navigation/menu structure, app page ordering, process links, resource groups, hidden flags, and theme/menu attributes.
- Root `Layouts[]` can store app pages/dashboards. Procurement includes Type `103` page layouts such as Home Page and Procurement Overview.
- Child resources link to the root app through shared `ListSetID` and `CustomType` values such as `ListSite_<ListSetID>`.

## 4. Child Data List Structure Inside `.yap`

Child lists are stored under `Data.Childs[]`, with each child using the same `Item` shape learned from standalone `.ydl`.

Typical child list shape:

```json
{
  "Item": {
    "ListModel": {},
    "Defs": [],
    "Layouts": [],
    "PublicForms": [],
    "RemindRules": [],
    "FlowMappings": [],
    "ListDatas": {}
  }
}
```

Comparison with standalone `.ydl`:

| Topic | Standalone `.ydl` | Inside `.yap` | Generator implication |
| --- | --- | --- | --- |
| Root payload | `Data.Item` is the list | `Data.Item` is the app; list is in `Data.Childs[]` | App generator must wrap lists as children. |
| ListSetID | May be generated or imported standalone | Shared root ListSetID | Related lists can be packaged together. |
| Lookup target availability | Often external or staged | Target list can be in same package | `.yap` can solve staged lookup remapping. |
| ReplaceIds | Local list IDs/field/layout/sample IDs | App, child list, field, layout, report/page IDs together | Local app graph IDs should be remapped together. |
| Forms/workflows | List workflows may appear inside list package | App workflows are centralized in `Data.Forms[]` | Generate app-level workflow graph. |
| Views/custom forms | `Item.Layouts[]` | Same inside child `Item.Layouts[]` | Reuse `.ydl` custom form rules. |
| Sample data | Optional `Item.ListDatas` | Optional; samples may be present | Include only safe sample data. |

The app-level package can include both lookup source and dependent lists. That means their generated IDs can be local to the same package and remapped consistently by Yeeflow during import.

## 5. Approval Form / Workflow Structure Inside `.yap`

Application workflows/forms are stored in `Data.Forms[]`.

Each form row includes keys such as:

- `Name`
- `Key`
- `IsItemPerm`
- `AppID`
- `ListID`
- `ProcModelID`
- `Description`
- `Ext`
- `DefResource`
- `ImgResource`
- `Deployed`
- `NoRule`
- `WorkflowType`
- `Settings`

`DefResource` contains the workflow/form Def payload. It can be decoded to the same kind of Def structure used by standalone `.ywf`:

- `defkey`
- `workflowType`
- `variables`
- `pageurls`
- `childshapes`
- workflow graph metadata
- `formdef` pages
- `ContentList` nodes
- lookup controls
- AI nodes/actions where present

Comparison with standalone `.ywf`:

| Topic | Standalone `.ywf` | Inside `.yap` | Generator implication |
| --- | --- | --- | --- |
| Wrapper | `.ywf` wrapper with base64 `Def` | form row in `Data.Forms[]` with `DefResource` | App builder must embed forms rather than emit separate `.ywf`. |
| FlowKey | top-level wrapper `FlowKey` plus Def `defkey` | `Forms[].Key` plus Def `defkey` | Keep keys aligned. |
| WorkflowType | wrapper and Def | `Forms[].WorkflowType` and Def | Keep both aligned. |
| Page URLs | inside Def | inside decoded `DefResource` | Same page registration rules apply. |
| Graph metadata | inside Def | inside decoded `DefResource` | Same graph layout rules apply. |
| ContentList targets | external if standalone | can target child lists in same app package | App graph validation can resolve local targets. |
| Lookups | external or staged | can target child lists in same app package | App-level generation can avoid staged `.ydl` handoff. |

WorkflowType observations:

| WorkflowType | Observed meaning | Examples |
| ---: | --- | --- |
| `1` | List/process workflow without approval pages, or special workflow with pages in some cases | status updates, sync jobs, supplier workflows |
| `2` | Approval form/workflow with request/approval pages | PR, PO, PA, New Supplier Form |
| `3` | Scheduled/job-like workflow | SharePoint sync jobs |

## 6. Relationship / Dependency Model

Relationship graph nodes should include:

- app/listset root
- data lists
- fields
- approval forms
- list workflows
- reports
- dashboards/pages
- document libraries
- AI Agents
- knowledge/copilot-like resources
- connections

Relationship graph edges should include:

- lookup field references
- approval form lookup controls
- lookup additional-field mappings
- `ContentList` create/update/remove targets
- `QueryData` targets
- report source list references
- dashboard/page report/list references
- approval page task URL/page references
- document generation template/library references
- AI Agent/Copilot/action references
- workflow to workflow/list trigger references

### NHIC relationship summary

Observed relationships:

- `ContentList`: 3
- approval-form lookup controls: 0 found by current extractor
- document libraries: 0
- AI references: 1 workflow AI node/action
- reports: 0 extracted

Representative ContentList edges:

- Auto-link Partner Organization -> Communication Records
- Update partner info -> Portfolio Management
- Sync update Partner and Portfolio -> Communication Records

### Procurement relationship summary

Observed relationships:

- `ContentList`: 45
- lookup controls: 12
- document library dependencies: 2
- AI references: 7
- reports: 2

Representative ContentList edges:

- Purchase Request -> PR Records
- Purchase Request -> PR Details List
- Purchase Order Request -> PO Records
- Purchase Order Request -> PO-Payment Terms
- Purchase Order Request -> PR Records / PR Details List updates
- Payment Request -> PA Records
- Payment Request -> PO-Payment Terms / PO Records updates
- Purchase Order Request -> PO Documents

Representative lookup edges:

- Purchase Request category lookup -> Purchase Category
- Purchase Order request lookup -> PR Records
- Purchase Order item lookup-list -> PR Details List
- Purchase Order supplier lookup -> Supplier List
- Payment supplier lookup -> Supplier List
- Payment records lookup-list -> PO-Payment Terms

Report edges:

- Supplier and PO Details report -> PO Details List + supplier/pre-supplier list inputs
- PR form new report -> PR form/report data

## 7. ReplaceIds and Import Remapping

`Resource.ReplaceIds` is central to app import/remapping.

Observed counts:

| Package | ReplaceIds | ReportIds | FormKeys |
| --- | ---: | ---: | ---: |
| NHIC Innovation Ecosystem Platform | 175 | 14 | 3 |
| Procurement Management | 421 | 31 | 18 |

Observed ReplaceIds contents:

| ID type | NHIC in ReplaceIds | Procurement in ReplaceIds | Notes |
| --- | ---: | ---: | --- |
| root app/listset ID | yes | yes | App root ID is local and remappable. |
| child list IDs | yes | yes | All extracted child list IDs are included. |
| field IDs | yes | yes | All extracted field IDs are included. |
| layout/page IDs | yes | yes | All extracted layout IDs are included. |
| sample record IDs | none observed | none observed | These exports did not include list sample records in ReplaceIds. |
| form keys | stored separately | stored separately | `FormKeys[]` tracks workflow/form keys. |
| report IDs | stored separately and/or in ReplaceIds-related structures | stored separately and/or in ReplaceIds-related structures | Reports need their own validation. |
| generated app graph IDs | yes | yes | Additional internal IDs appear beyond list/field/layout IDs. |

Rules:

- IDs local to the generated `.yap` should be in `ReplaceIds`.
- External dependency IDs should not be in `ReplaceIds`.
- Local related lists can be packaged together so lookup target and dependent lookup fields are remapped consistently.
- App-level packages can solve the staged standalone lookup issue by including both sides of a relationship in one local ID graph.
- Sensitive external resources such as live connections, credentials, AI agent IDs, external document templates, or production library IDs should not be guessed or blindly copied.

This differs from standalone `.ydl`: in `.ydl`, external lookup record/list IDs must be excluded from `ReplaceIds` or the imported dependent list can point to remapped IDs that do not exist. In `.yap`, if both lists are local to the package, both IDs can be remapped together.

Export-back from the generated `Department Access Management_v5` package confirms the internal sample lookup rule:

- Department target sample records were remapped.
- Department Access Request sample lookup values were also remapped.
- Exported-back request rows point to the exported-back Department `ListDataID` values.
- Therefore app-level internal lookup sample references are structurally valid when the target sample records exist in the same package and those local sample IDs are included in `ReplaceIds`.

## 8. App-Level Generation Implications

A future generated app such as **Department Access Management** can include:

- Departments data list
- Department Access Requests data list
- Department Access Request approval form
- Department lookup relationship
- Department Code additional-field mapping
- workflow `ContentList` persistence into Department Access Requests
- basic views/custom forms

IDs that can be generated together and remapped together:

- root app/listset ID
- child list IDs
- field IDs
- custom form layout IDs
- view layout IDs
- workflow/process model IDs
- workflow graph resource IDs
- report/page IDs if generated

IDs that should remain external unless bundled:

- user/group/position IDs
- external app/list IDs
- external document library IDs
- external AI agent/copilot IDs
- connection/credential IDs
- external file/template IDs

If Department Access Management packages Departments and Department Access Requests in the same `.yap`, the request list lookup to Departments can target the generated local Departments ListID. Both list IDs and fields can be included in `ReplaceIds`, and Yeeflow should remap the whole graph consistently on import.

## 9. App-Level Generation Pipeline

Recommended pipeline:

```text
Business requirement
-> app decomposition
-> resource model
-> data lists
-> relationships/lookups
-> approval forms
-> workflows
-> reports/dashboards if needed
-> AI resources if needed
-> dependency graph
-> decoded .yap draft
-> validate components
-> validate app graph
-> build .yap wrapper
-> sandbox import
-> export-back comparison
```

Component validators should still run:

- data lists through `validate-ydl-list.js`-equivalent checks
- approval forms through `validate-ywf-def.js`-equivalent checks
- app relationships through a new app graph validator

## 10. Proposed `.yap` Normalized Spec

```json
{
  "app": {
    "title": "",
    "description": "",
    "appId": "41",
    "listSetId": "",
    "mainListType": 1024,
    "icon": null,
    "navigation": [],
    "theme": {}
  },
  "resources": {
    "dataLists": [],
    "approvalForms": [],
    "reports": [],
    "dashboards": [],
    "agents": [],
    "copilots": [],
    "documentLibraries": []
  },
  "relationships": [],
  "replaceIds": [],
  "dependencies": [],
  "importAssumptions": []
}
```

Section definitions:

| Section | Meaning | `.yap` mapping |
| --- | --- | --- |
| `app` | Root app/listset identity, nav, theme | `Resource`, `Data.Item.ListModel`, root `Layouts`, `AppThemes` |
| `resources.dataLists` | Data list specs, fields, views, custom forms, optional samples | `Data.Childs[].Item` |
| `resources.approvalForms` | Approval form Defs and workflow metadata | `Data.Forms[]` with `WorkflowType: 2` |
| `resources.reports` | Data reports / form reports | `Data.DataReports[]`, `Data.FormReports[]`, `Data.FormNewReports[]`, report resources in `Childs` |
| `resources.dashboards` | App pages/dashboard layouts | root `Data.Item.Layouts[]` Type `103` |
| `resources.agents` | AI Agent resources | `Data.OtherModules[]` Type `Agents` |
| `resources.copilots` | Knowledge/copilot-like resources | `Data.OtherModules[]` Type `Knowledges` or future confirmed modules |
| `resources.documentLibraries` | Document storage/template libraries | child items with document-library resource type |
| `relationships` | Graph edges between resources | lookup rules, ContentList nodes, QueryData nodes, reports, dashboard refs |
| `replaceIds` | Local IDs remapped on import | `Resource.ReplaceIds` |
| `dependencies` | External IDs/resources not bundled | dependency map / validator input |
| `importAssumptions` | Sandbox/prod import expectations | report/handoff metadata |

## 11. Required Validators / Tools

| Tool | Purpose | Inputs | Outputs | Key checks |
| --- | --- | --- | --- | --- |
| `inspect-yap-package.js` improvements | Continue deep package inventory | `.yap` | JSON/Markdown | Resource modules, app pages, dashboards, reports, AI resources, secrets redaction |
| `extract-yap-metadata.js` improvements | Clean app graph metadata | `.yap` | metadata JSON/Markdown | lists, fields, forms, reports, document libraries, AI refs, relationships |
| `validate-yap-package.js` | Structural validation of decoded `.yap` | decoded app JSON or `.yap` | validation report | wrapper, Resource, Data keys, root app, child resources, forms, reports |
| `validate-yap-graph.js` | Cross-resource graph validation | decoded app JSON + optional dependency map | graph report | lookup targets, ContentList targets, reports, dashboard refs, AI/docs refs |
| `build-yap-wrapper.js` | Build gzip/base64 `.yap` wrapper | decoded app JSON | `.yap` + round-trip report | no placeholders, ReplaceIds policy, wrapper round-trip equality |
| `compare-yap-export-back.js` | Import/export learning | source decoded app + exported-back app | diff report | ID remaps, normalized fields, dropped resources, relationship integrity |
| `generate-yap-dependency-map.js` | Dependency planning | normalized spec + metadata | dependency JSON | unresolved external users/groups/positions/docs/AI/connections |

## 12. Stop Conditions

Stop before final `.yap` generation when:

- resource graph has unresolved IDs
- lookup targets are missing
- `ContentList` targets are missing
- `QueryData` targets are missing
- report source lists/fields are missing
- dashboards reference missing reports/lists/fields
- approval forms have invalid page registration or workflow graph metadata
- AI Agent/Copilot references are unresolved
- credential/connection resources are present or required
- token/secret-like resources would be copied or exposed
- document templates/libraries are unresolved
- user/group/position IDs are unresolved
- validators fail
- production import is requested without sandbox proof

## 13. First Future Generation Test Recommendation

Recommended first app-level generation test:

**Department Access Management**

Resources:

- Departments data list
- Department Access Requests data list
- Department Access Request approval form

Relationships:

- Department Access Requests.Department lookup -> Departments.Title
- Department Access approval form Department lookup -> Departments.Title
- lookup additional field Department Code -> DepartmentCode variable
- approval workflow `ContentList` -> Department Access Requests

Intentionally exclude at first:

- AI Agent/Copilot resources
- external connections
- document generation
- dashboards beyond simple app/list navigation
- advanced reports
- production user/position dependencies beyond already proven line-manager pattern

Why this is the right first test:

- It is small enough to validate completely.
- It exercises the key reason `.yap` matters: packaging related lists and approval form persistence together.
- It removes the staged `.ydl` import/export handoff for local lookup/list IDs.
- It reuses proven data-list custom form patterns and approval form patterns.
- It avoids sensitive modules and external connections.

## 14. Final Summary

Confidently understood:

- `.yap` uses the same gzip/base64 `Resource` wrapper as `.ydl`.
- `Data.Item` is the root app/listset.
- `Data.Childs[]` contains child resources such as data lists, document libraries, and report/list resources.
- `Data.Forms[]` contains approval forms, process/list workflows, and scheduled/job workflows.
- Approval forms inside `.yap` contain the same decoded Def patterns learned from `.ywf`.
- Data lists inside `.yap` contain the same list model/fields/layout patterns learned from `.ydl`.
- `ReplaceIds` includes local app/list/field/layout/internal IDs and enables import-time remapping.
- `.yap` is the right packaging level for multi-component generated apps because related resources can be remapped together.

Needs more export examples:

- clean app packages with multiple generated lists and no legacy modules
- dashboard-only apps
- apps with data reports generated from scratch
- apps with form reports generated from scratch
- apps with document libraries but no external templates
- AI Agent/Copilot packaging where sensitive resources are safe to inspect
- apps with permissions/groups intentionally configured

Should not be guessed:

- production ListSetID/ListID/FieldID values
- user/group/position IDs
- external document template/library IDs
- AI agent/copilot IDs
- connection/credential IDs
- report internals not validated by export-back comparison
- dashboard component source references

Recommended next tool to build first:

`validate-yap-package.js`, followed by `validate-yap-graph.js`.

The first tool should confirm the structural package shape. The second should confirm cross-resource relationships. Together they create the safety gate needed before attempting `build-yap-wrapper.js`.

## 15. Generated v5 App Baseline Addendum

The first successful generated app-level `.yap` baseline is `Department Access Management_v5`.

It proves that a generated package can import and open when the root app shell is complete:

- top-level wrapper title, description, and non-null `IconUrl`
- root `Data.Item.ListModel.Type = 1024`
- root `CustomType = ""`
- root `Perm = 0`
- root `WorkspaceID` present
- root `LayoutView` navigation populated
- root Type `103` app page layout present
- `AppTags`, `AppMetadatas`, and `AppComponents` arrays present
- `AppThemes` present and non-empty
- root `CreatedBy` and `ModifiedBy` populated

The Type `103` app page rule is now confirmed:

- the page `LayoutID` is local and included in `ReplaceIds`
- the embedded page resource `LayoutInResources[0].ID` and `RefId` are separate IDs
- those embedded resource IDs are excluded from `ReplaceIds`

The v5 app imported, opened, rendered navigation, opened both child lists, and opened the approval request form. Export-back then confirmed generated request sample rows store plain target Department `ListDataID` strings and Yeeflow remapped those values to the exported-back Department records. If a lookup grid cell appears blank despite exported-back values matching target records, classify it as a runtime display/index/cache issue unless item-form lookup values or manually edited rows also fail.

## 16. Fresh ID Family Policy For Generated App Tests

The successful Visitor Access Management v5 fresh-compatible test added one more app-level generation rule.

Observed behavior:

- A v5-compatible Visitor package that reused the old `206...` generated ID family and `DAR` approval form key imported but opened as a blank app.
- A fresh-compatible Visitor package with a new local ID family and fresh approval form key `VAV` imported and opened successfully.

Generation rule:

- Treat each generated `.yap` app test as a new local ID namespace.
- Generate a fresh root ListSetID/app ID family.
- Generate fresh child list IDs, field IDs, layout IDs, sample record IDs, approval form/process IDs, page IDs, and workflow node IDs.
- Generate a fresh FlowKey/form key for each approval form in the package.
- Include local generated IDs in `ReplaceIds` according to the normal app-level rules.
- Do not reuse generated IDs or approval form keys from an app that has already been imported into the sandbox, unless the explicit goal is to study update/merge behavior.

Runtime implication:

- ID/key reuse can pass local structural and graph validation.
- ID/key reuse can also import successfully.
- The failure may appear only after opening the app, as a blank app or detached components.

Validator recommendation:

- When detectable, validators should warn or fail if a generated app reuses an ID family or form key observed in prior generated/imported test artifacts.
- Validation output should summarize generated ID families and form keys to make accidental reuse visible.

## 17. App-Level Approval Form Registration Rule

The Visitor Access Management v6 one-field expansion exposed a required approval form registration rule inside app-level `.yap` packages.

Working app-level approval form rows use:

```json
{
  "Key": "VAW",
  "ListID": 0,
  "ProcModelID": "2110030000000000001"
}
```

Rule:

- `Data.Forms[].ListID` must be `0` for app-level approval forms.
- The approval form/process identity belongs in `Data.Forms[].ProcModelID`.
- Root navigation Type `105` should point to the form key, not to `ProcModelID`.
- `ProcModelID` should remain a local generated ID and should be included in `ReplaceIds`.

Failure mode:

- If `Data.Forms[].ListID` is set to `ProcModelID`, Yeeflow can import/open the app and show data lists, but the approval form may be missing from navigation.

The corrected v6.1 package used:

- fresh ID family `211...`
- fresh form key `VAW`
- `Data.Forms[].ListID = 0`
- `Visitor Name` added as `Visitor Access Requests.Text8`

It imported, opened, rendered navigation, displayed the approval form, and showed `Visitor Name` on the request page.

## 18. Visitor Access v7 Expansion Evidence

The Visitor Access Management v7 package confirmed that incremental one-field expansion is safe when all app/list/form/workflow references are updated together.

v7 added:

- `Visitor Company`
- data-list field slot `Visitor Access Requests.Text9`
- workflow variable `VisitorCompany`
- custom list form control
- approval request page control
- approval page readonly control
- sample data values
- `ContentList` mapping `VisitorCompany -> Text9`

Confirmed successful package settings:

- fresh ID family `212...`
- fresh form key `VAX`
- app-level approval form `Data.Forms[].ListID = 0`
- approval form `ProcModelID = 2120030000000000001`
- request list `ListID = 2120020000000001000`
- `Visitor Company` field ID `2120020000000001013`

Confirmed runtime result:

- app imported and opened
- app navigation rendered
- approval form appeared
- `Visitor Name` and `Visitor Company` rendered
- `ContentList` persisted `VisitorCompany` to `Text9`

Current proven Visitor Access request schema:

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

- Start from the latest known-good baseline.
- Add one text field/change at a time.
- Use a fresh ID family and fresh FlowKey for every import-test package.
- Preserve proven field slots.
- Update data-list field definitions, custom forms, approval pages, workflow variables, `ContentList` mappings, views, and sample rows consistently.

## 19. Visitor Access v8-v10 Expansion Evidence

The Visitor Access Management v8, v9, and v10 packages extended the v7 baseline one field at a time and confirmed the generated app expansion pattern through `Text12`.

Successful expansion chain:

| Version | Added field | Slot | ID family | FlowKey | Confirmed result |
| --- | --- | --- | --- | --- | --- |
| v6.1 | Visitor Name | `Text8` | `211...` | `VAW` | Approval form rendered the field. |
| v7 | Visitor Company | `Text9` | `212...` | `VAX` | Field rendered and persisted. |
| v8 | Access Area | `Text10` | `213...` | `VAY` | Field rendered and persisted. |
| v9 | Host Employee | `Text11` | `214...` | `VAZ` | Field rendered and persisted. |
| v10 | Visitor Contact | `Text12` | `215...` | `VBA` | Field rendered and persisted. |

v10 specifically proved:

- `Visitor Contact` can be added as a simple single-line text field in `Visitor Access Requests.Text12`.
- A fresh `215...` ID family avoids collisions with prior imported generated apps.
- A fresh FlowKey `VBA` avoids approval-form registration/key reuse issues.
- `Data.Forms[].ListID = 0` remains required for app-level approval forms.
- The new field must be added consistently to the data-list `Defs`, list views, custom list form, approval request page, approval readonly page, workflow variable list, `ContentList` mapping, and sample rows.

Current proven Visitor Access request schema:

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

- Expand from a known-good `.yap` baseline one change at a time.
- Use a fresh ID family and fresh FlowKey/form key for every import-test package.
- Keep app-level approval form `Data.Forms[].ListID = 0`.
- Preserve proven slots unless intentionally testing a new field type or slot.
- Validate package, graph, and approval form before wrapper build.

Recommended next tests:

- Convert `Access Area` from text to choice/dropdown.
- Test `Host Employee` as a user picker or lookup.
- Add dashboard/report resources only after the core app remains stable.

## 20. Manual v10 Multi-Type Field Export Evidence

The manually updated export `/Users/rengerhu/Downloads/Visitor Access Management v10.yap` confirms additional approval-form and data-list field/control patterns inside an app-level `.yap`.

Detailed study:

- `docs/approval-form-and-yap-field-type-pattern-study.md`

Confirmed structures:

| Pattern | Approval form | Data list |
| --- | --- | --- |
| Number | variable `type = "number"`; control `type = "input_number"` | `FieldType = "Decimal"`; `Type = "input_number"` |
| Radio single select | variable `type = "text"`; control `type = "radio"` | text/radio-compatible field if persistence is needed |
| Dropdown single select | `type = "radio"` plus `attrs.displayStyle = "dropdown"` | text/radio-compatible field if persistence is needed |
| Switch | variable `type = "boolean"`; control `type = "switch"` | `FieldType = "Bit"`; `Type = "switch"` |
| Dynamic display | target control `attrs.control_display[]` | not applicable |

Important observations:

- Approval number defaults are stored as control `value`, while formatting/min settings are in `attrs`.
- Dropdown choices can include `attrs.color_choices[]` with UUID keys matching `attrs.choices[]` values.
- Switch default on the approval form is boolean `false`; list sample values use string `"0"`/`"1"`.
- The dynamic display condition for `Escort User` used `RequiresEscort == true` and a show action.
- The manual export did not map the new fields in `ContentList`; generated packages must add mappings explicitly when persistence is required.

Generator rule:

- For a multi-type generated app expansion, update data-list field definitions, approval variables, request controls, readonly approval controls, custom list form controls where needed, sample raw values, and `ContentList` mappings as one consistent type-compatible set.
- Stop before build if any field type has no confirmed pattern or no compatible target field.

## 21. Generated v11 Multi-Field, Multi-Type Evidence

`visitor-access-management.v11-five-fields-multitype.yap` confirmed that the manual v10 field-type patterns can be generated successfully inside an app-level `.yap`.

Successful package settings:

- Fresh ID family: `216...`
- Fresh FlowKey/form key: `VBB`
- App-level approval form `Data.Forms[].ListID = 0`
- Two child data lists
- One approval form
- `ReplaceIds` count: `46`
- Package validation: pass
- Graph validation: pass
- Extracted approval form validation: pass
- Wrapper round-trip validation: pass
- Runtime import/open/form test: pass

v11 added five persisted fields:

| Business field | Data-list slot | Data-list type | Approval variable/control |
| --- | --- | --- | --- |
| Visitor Email | `Text13` | `Text` / `input` | `text` / `input` |
| Visitor Phone | `Text14` | `Text` / `input` | `text` / `input` |
| Number of Visitors | `Decimal1` | `Decimal` / `input_number` | `number` / `input_number` |
| Access Type | `Text15` | `Text` / `radio` | `text` / `radio` with `displayStyle = "dropdown"` |
| Requires Escort | `Bit1` | `Bit` / `switch` | `boolean` / `switch` |

Proven `ContentList` mappings:

| Source variable | Target field |
| --- | --- |
| `VisitorEmail` | `Text13` |
| `VisitorPhone` | `Text14` |
| `NumberofVisitors` | `Decimal1` |
| `AccessType` | `Text15` |
| `RequiresEscort` | `Bit1` |

Sample value shapes confirmed for generated packages:

- Decimal: numeric values.
- Choice/dropdown: selected option text.
- Bit/switch in list sample data: string `"1"` or `"0"`.
- Boolean approval control: boolean `true` or `false`.

Conditional display:

- `Escort User` was generated as an approval-form-only text field.
- It is shown when `RequiresEscort == true`.
- The rule is stored on the `Escort User` target control in `attrs.control_display[]`.
- It was intentionally not persisted in v11 because no storage target field was added.

Generator implication:

- Multi-field expansion is now allowed after underlying field/control types are proven.
- A fresh ID family and fresh FlowKey/form key remain mandatory for sandbox import tests.
- `Data.Forms[].ListID = 0` remains mandatory for app-level approval forms.
- Each persisted field must be added consistently to the data list, custom list form, approval request page, approval readonly page, workflow variables, sample rows, and `ContentList` mapping.

Remaining gaps:

- Persisted conditional text field, such as `EscortUser -> Text16`.
- Multi-select choice.
- User picker.
- Lookup inside a line-item table.
- Dashboards and reports beyond the Type `103` root page.
