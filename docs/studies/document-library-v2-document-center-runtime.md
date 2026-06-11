# Document Library v2 Runtime Study: Enterprise Document Center

Date: 2026-05-18

Branch: `codex/document-library-v2-document-center`

Generated app: `Enterprise Document Center`

Generated package artifact: `enterprise-document-center-v2-folders.yap`

Runtime upload copy used for test: `/Users/Renger/Downloads/enterprise-document-center-v2-folders-runtime-upload.yap`

The runtime upload copy was removed after testing. The generated `.yap` artifact remains ignored/uncommitted in the workspace.

## Scope

This pass tested the next Document Library generation layer beyond the minimal `New Document Library` base definition.

The generated app contains three Type 16 document libraries:

- Company Policies
- Project Documents
- Templates and Forms

Each library preserves the runtime-passed native document-library base shape:

- `ListModel.Type = 16`
- native/default fields: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, `Text4`
- `Text4` remains the file-upload field
- default Type 0 view with `LayoutView = ""`
- one unassigned `New file` form
- generated root-level folder rows
- no uploaded file rows
- no document binaries

## Local Validation

Local validation passed before runtime import:

- `node --check generate-enterprise-document-center-v2.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check validate-ydl-list.js`
- `node --check scripts/inspect-yap-materialization.mjs`
- package validation on `enterprise-document-center-v2-folders.resource.json`
- graph validation on `enterprise-document-center-v2-folders.resource.json`
- materialization inspection on `enterprise-document-center-v2-folders.resource.json`
- standalone `validate-ydl-list.js` checks for all three generated document-library resources
- JSON parse checks for generated app/resource/report files
- `git diff --check`

All validator failures were zero. Warnings remained for runtime-sensitive document-library behavior and the root app not including a Type 103 dashboard/page resource.

## Runtime Result

Status: partial runtime proof, with generated folder rows runtime-proven for import/open/list/persistence.

Runtime-tested in `https://<yourdomain>.yeeflow.com`.

Observed results:

- Package upload was accepted.
- Import metadata was read correctly:
- app name in package: `Enterprise Document Center`
- app name used at import to avoid duplicate-name conflict: `Enterprise Document Center Folders Runtime`
- description: document-library v2 generation package with multiple Type 16 libraries, custom fields, custom views, and generated folder rows
- Import completed without the previous `Tip Created failed` error.
- App appeared in Shared Workspace search results.
- App opened into the first document library instead of an empty shell.
- App did not open to `Start to build with Components`.
- Navigation showed all three document libraries.
- Each document library opened:
  - Company Policies
  - Project Documents
  - Templates and Forms
- Custom view tabs appeared for each library.
- Company Policies displayed:
  - All Items
  - All Policies
  - Active Policies
  - Policies Pending Review
  - By Department
- Project Documents displayed:
  - All Items
  - All Project Documents
  - By Project
  - Contracts
  - Latest Versions
- Templates and Forms displayed:
  - All Items
  - All Templates
  - Active Templates
  - By Department
- Company Policies display-field menu exposed generated custom fields:
  - Department
  - Policy Category
  - Effective Date
  - Review Date
  - Owner
  - Status
- Generated root folders appeared in all three document libraries.
- The Add menu exposed document-library actions:
  - New Folder
  - New File
  - Batch Upload

## Folder Runtime Notes

The generated package pre-generates root-level folder rows using the export-backed folder shape observed in `Document Library Sample.yap` and `Projects Center.yap`.

Generated folder row shape:

- `ListDatas` object entry under the Type `16` library.
- object key equals the row `ListDataID`.
- `Title` stores the folder display name.
- `Bigint1 = "0"` for root folders.
- `Text1 = "folder"`.
- `Bigint2 = ""`.
- `Text2 = ""`.
- `Text3 = "0_<lowercase folder title>"`.
- `Text4` is omitted.
- custom fields generated on the library are included as blank strings.
- folder `ListDataID` values are included in `ReplaceIds`.

Generated folder rows runtime-tested:

- Company Policies: `HR Policies`, `IT Policies`, `Finance Policies`, `Compliance Policies`.
- Project Documents: `Requirements`, `Contracts`, `Meeting Notes`, `Deliverables`.
- Templates and Forms: `HR Forms`, `Finance Forms`, `Project Templates`, `Legal Templates`.

Persistence and manual creation checks:

- Templates and Forms remained visible after refresh; generated folders persisted.
- Manual folder `Runtime Check Templates` was created and appeared immediately.
- Company Policies generated folders were visible after import and after navigation. Manual folder `Runtime Check Policies` returned `Added Successfully`; the row did not appear until page refresh, then persisted. This resolves the earlier Company Policies issue as a UI/table refresh delay, not a persistence failure.
- Project Documents generated folders were visible after import and after navigation. Manual folder `Runtime Check Project Docs` appeared immediately and persisted in the table.

Therefore:

- Generated root-level folder row import/display/persistence is runtime-proven for this v2 package.
- Manual `New Folder` creation is runtime-proven across all three generated libraries.
- Nested generated folders remain unproven.
- Opening every generated folder was not exhaustively tested; the generated folder rows render as clickable folder links and top-level list behavior is proven.

## Upload Runtime Notes

Upload behavior was not tested in this pass.

Do not claim runtime proof for uploaded-file persistence, automatic population of `Name`, `Type`, `Size`, `Extension`, `UniqueName`, or `Upload file`, or real document binary handling from this package.

The proven claim is limited to import/open acceptance of the `Text4` file-upload field shape inherited from the runtime-passed `New Document Library` base.

## Generation Rule Outcome

This pass supports the following generation rule:

- A generated app may include multiple Type 16 document libraries based on the canonical `New Document Library` shape.
- Simple custom fields can be added to Type 16 document libraries using proven Yeeflow list field patterns.
- Multiple Type 0 custom views can be generated for Type 16 document libraries.
- Minimal generated packages should continue to exclude uploaded file rows and document binaries.
- Root-level folder rows may be generated using the export-backed shape above.
- Generate folder rows only under Type `16` document libraries.
- Keep generated folder rows root-level unless nested folder behavior is explicitly export-backed and runtime-tested.
- Do not generate uploaded file rows or document binaries.

## Remaining Gaps

- Nested generated folder rows.
- Exhaustive open/navigation behavior for every generated folder.
- Actual uploaded-file behavior with a harmless test file.
- Rich assigned New/Edit/View custom-form mappings beyond the unassigned `New file` base form.
- Whether a Type 103 dashboard/page should be added to avoid root-app warnings in larger app packages.

## Follow-up: Doc Library Dashboard Control

The v3 follow-up package `enterprise-document-center-doc-library-control-v3.yap` added a Type `103` dashboard named `Document Center` with four `type = "document-library"` controls.

Runtime result: dashboard Doc library controls are runtime-proven for root-library display, static root-folder display, caption/search/add enabled settings, and opening the target library `New file` modal. The generated `.yap` artifact remains ignored/uncommitted.

Runtime-proven dashboard controls:

- `Company Policies Root`: root-bound Company Policies control showing generated root folders.
- `HR Policies Folder`: static folder-bound control for Company Policies / HR Policies.
- `Project Contracts Folder`: static folder-bound control for Project Documents / Contracts.
- `Templates Root`: root-bound Templates and Forms control showing generated root folders.

Still unproven:

- Actual file upload/persistence through a dashboard Doc library control.
- Dynamic expression-based folder paths in generated packages.
- Disabled caption/search/add states.
- Doc library controls hosted on approval forms, data-list forms, or document-library forms.
