# Yeeflow Document Library Runtime Test Plan

Target environment: `https://<yourdomain>.yeeflow.com`

Run this only after local validation passes.

## Import And Open

1. Import the generated `.yap`.
2. Confirm the imported app name matches the generated baseline.
3. Open the app.
4. Confirm the app does not open as an empty shell or `Start to build with Components`.
5. Confirm the document library appears in app navigation.
6. Open the document library.

## Library Structure

Confirm:

- library opens without query errors.
- default view opens.
- default document fields are present:
  - Upload File / `Text4`
  - Name / `Title`
  - Type / `Text1`
  - Size/FileSize / `Bigint2`
- support fields are present or safely hidden:
  - ParentID / `Bigint1`
  - Extension / `Text2`
  - UniqueName / `Text3`

## Upload Behavior

Use only a safe disposable test file with no private content.

Test:

- upload control opens.
- upload succeeds.
- Name is populated with the file name or expected display value.
- Type and/or Extension populate as expected.
- Size/FileSize populates as expected.
- record persists after refresh.
- list query still works after upload.

## Forms

If custom forms are included:

- New form opens.
- Edit form opens.
- View form opens.
- Upload File control renders on all included forms where expected.
- form assignment follows `ListModel.LayoutView.add/edit/view`.

## Folder Behavior

Test only if generated and safe.

For export-backed generated root folders:

- confirm every generated folder row is visible in the default library view.
- refresh the page and confirm generated folders persist.
- switch generated views and document whether folders remain visible or are hidden by view filters.
- open representative generated folders and confirm the folder page/list loads.

For manual folder creation:

- create a folder.
- open the folder.
- refresh and confirm the manually created folder persists.
- confirm `ParentID` behavior through export-back or safe metadata inspection when available.

Upload a file into the folder only if a harmless disposable test file is explicitly safe to use.

## Result Classification

Use these labels:

- runtime-proven
- partially proven
- validation-only
- blocked by package/materialization
- blocked by Yeeflow runtime context
- not tested

Validation-only success must not be reported as runtime proof.

## First Runtime Attempt

Baseline package: `document-library-runtime-baseline.v1.yap`

Result: blocked by Yeeflow runtime context / import create failure.

Observed evidence:

- local validation passed before import.
- Yeeflow accepted the `.yap` upload and showed the package name and description.
- clicking OK on the import metadata step returned `Tip: Created failed`.
- the app was not created, so app open, library open, upload, folder, and persistence checks were not reached.

Do not patch this baseline until the failing import response or an exported-back Type `16` minimal package identifies the missing or invalid property. Current status is validation-only, not runtime-proven.

## Sample Isolation Attempt

Source studied: `/Users/Renger/Downloads/Document Library Sample.yap`

What the sample proved:

- document-library-only app exports can have `Item.Layouts = []`.
- root `LayoutView` can be only `{"sortVer":1}` with no navigation `sort[]`.
- top-level `Resource.SimplePortal` is `null` in both known-good exports.
- the minimal document library has seven native fields, one empty Type `0` view, and one `New file` upload form with no `ListModel.LayoutView` assignment.

Baseline v2 changes:

- generated from `Document Library Sample.yap` rather than `Projects Center.yap`.
- removed generated root Type `103` Home page and root navigation.
- removed partial New-only custom-form assignment.
- kept one Type `16` library with no uploaded rows.

Runtime result: still blocked by Yeeflow runtime context / import create failure. Yeeflow accepted the upload and metadata dialog, then returned `Tip: Created failed`.

Baseline v3 changes:

- changed top-level `Resource.SimplePortal` from `[]` to `null`.
- switched to a fresh Yeeflow-like `2059...` ID family.
- local package, graph, materialization, wrapper round-trip, and standalone document-library validation pass with warnings only.

Runtime status for v3: validation-only. A clean v3 import attempt still needs to be repeated with reliable browser/network evidence before claiming runtime proof.

## Runtime-Proven Minimal Baseline

Package: `document-library-sample-new-library-only.v1.yap`

Source shape: `New Document Library` from `/Users/Renger/Downloads/Document Library Sample.yap`

Result: runtime-proven for import/open by user manual test.

Generated baseline alignment: `document-library-runtime-baseline.v4.yap` uses this runtime-passed `New Document Library` base definition with fresh IDs. The generated `.yap` runtime artifact remains ignored/uncommitted; the committed source is the generator and study guidance.

What is proven:

- A document-library-only app can contain a single Type `16` child resource cloned from `New Document Library`.
- The base document-library definition is the `New Document Library` shape, not the earlier generated `Baseline Documents` experiment.
- The seven native fields are sufficient for import/open when paired with the sample's minimal library view/form structure.
- The default Type `0` view should preserve the sample's empty string `LayoutView = ""`; changing it to `null` is not the canonical base shape.
- The `New file` Type `1` upload form can remain unassigned in `ListModel.LayoutView` for a newly-created-library baseline.
- Root app `Item.Layouts = []`, root `LayoutView = {"sortVer":1}`, and top-level `Resource.SimplePortal = null` are valid for this minimal document-library-only package.

What remains unproven:

- upload persistence behavior.
- folder create/open behavior.
- custom New/Edit/View form assignment for generated libraries.
- configured views with additional custom fields in a generated package.

## V2 Enterprise Document Center Runtime Pass

Package: `enterprise-document-center-v2.yap`

Generated app: `Enterprise Document Center`

Result: partial runtime proof.

What is proven:

- A generated app can import/open with three Type `16` document libraries cloned from the canonical `New Document Library` base.
- Navigation can expose all three generated libraries.
- Each generated library opens as a document library, not as an empty app shell.
- Simple custom field definitions can be included in Type `16` libraries.
- Multiple configured Type `0` views can be included in generated Type `16` libraries.
- The document-library Add menu exposes New Folder, New File, and Batch Upload in the generated libraries.

What is partially proven:

- Manual folder creation: `Templates and Forms` created `HR Forms` and displayed the row; `Company Policies` accepted `HR Policies` with an `Added Successfully` toast but did not visibly refresh the row during the spot-check.

What remains unproven:

- generated folder-row import shape.
- folder persistence after refresh across all libraries.
- actual upload persistence with a harmless test file.
- richer assigned New/Edit/View form mapping beyond the unassigned `New file` base form.

## V2 Generated Folder Runtime Pass

Package: `enterprise-document-center-v2-folders.yap`

Generated app: `Enterprise Document Center`; imported as `Enterprise Document Center Folders Runtime` to avoid duplicate app-name conflict.

Result: partial runtime proof, with generated root folders runtime-proven.

What is proven:

- The generated app imports/opens with three Type `16` document libraries and generated root folder rows.
- Generated folders appear in all three document libraries:
  - Company Policies: `HR Policies`, `IT Policies`, `Finance Policies`, `Compliance Policies`.
  - Project Documents: `Requirements`, `Contracts`, `Meeting Notes`, `Deliverables`.
  - Templates and Forms: `HR Forms`, `Finance Forms`, `Project Templates`, `Legal Templates`.
- Generated folders persist after refresh/navigation checks.
- Manual `New Folder` creation works across all three libraries:
  - `Runtime Check Policies`
  - `Runtime Check Project Docs`
  - `Runtime Check Templates`
- Company Policies may require a page refresh after the success toast before the newly created manual folder appears; after refresh, the folder persisted.
- The Add menu still exposes `New Folder`, `New File`, and `Batch Upload`.

What remains unproven:

- nested generated folder rows.
- exhaustive open/navigation behavior for every generated folder.
- actual upload persistence with a harmless test file.
- richer assigned New/Edit/View form mapping beyond the unassigned `New file` base form.
