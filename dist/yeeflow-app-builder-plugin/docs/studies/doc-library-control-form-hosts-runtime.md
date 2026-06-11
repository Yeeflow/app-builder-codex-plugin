# Doc Library Control Form Hosts Runtime Study

Branch: `codex/doc-library-control-form-hosts`

Generated app: `Enterprise Document Center - Form Hosted Doc Library`

Generated package: `enterprise-document-center-form-hosted-doc-library.yap` (ignored/uncommitted)

## Scope

This pass extends the dashboard Doc library control milestone into form-host contexts:

- approval forms
- data-list custom forms
- document-library custom forms

The generated package keeps the Enterprise Document Center structure with three Type `16` document libraries, generated root folders, simple custom fields, custom views, and dashboard controls for comparison. It does not include uploaded files or document binaries.

## Local Validation

The corrected package passed local validation with warnings only:

- `node --check generate-doc-library-control-form-hosts.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check validate-ydl-list.js`
- `node --check validate-ywf-def.js`
- `node --check yeeflow-control-field-schema-utils.js`
- `node --check skills/installed/yeeflow-application-generator/scripts/yeeflow-control-field-schema-utils.js`
- `node generate-doc-library-control-form-hosts.mjs <downloads>/Document\ Library\ Sample.yap`
- `node validate-yap-package.js enterprise-document-center-form-hosted-doc-library.yap --mode generator --stage final`
- `node validate-yap-graph.js enterprise-document-center-form-hosted-doc-library.yap --mode generator --stage final`
- `node validate-ywf-def.js enterprise-document-center-form-hosted-doc-library.approval-form-def.json --mode final`
- `node scripts/inspect-yap-materialization.mjs enterprise-document-center-form-hosted-doc-library.resource.json`

Final local status:

- package validation: `pass_with_warnings`, `0` errors
- graph validation: `pass_with_warnings`, `0` errors, `0` unresolved edges
- approval-form validation: `pass_with_warnings`, `0` errors
- materialization inspection: `pass`

## Runtime Evidence

Runtime testing was performed in `https://<yourdomain>.yeeflow.com/` on 2026-05-18.

### Document Library Custom Form Host

Status: runtime-proven for open/render and disabled search/add settings.

Evidence:

- The imported app opened and was not an empty shell.
- `Company Policies` opened as a Type `16` document library with generated folders visible.
- `Add > New File` opened the generated custom form `Policy File With Template Reference`.
- The form rendered the native `Upload File` field.
- The embedded Doc library control rendered the `Templates and Forms` root library.
- The control displayed generated folders: `HR Forms`, `Finance Forms`, `Project Templates`, and `Legal Templates`.
- The control was generated with `caption.search = false` and `caption.add = false`; the runtime form showed no search box and no add button for that embedded control.

### Approval Form Host

Status: partial.

Evidence:

- `Document Review Request` imported and appeared in app navigation.
- Opening it before publishing showed `This form has not been published yet`.
- Opening the form builder showed the generated Doc library controls rendered in the approval form designer preview:
  - Company Policies root-bound control with generated folders.
  - HR Policies folder-bound control with disabled search/add and folder context label.
  - Project Documents / Contracts folder-bound control.
- Publishing the first runtime import failed because the approval task node was not configured correctly.
- The blocker is in workflow generation for the `Document Review` assignment task: the task assignee and task form setting are not right.
- This is not treated as a Doc library control schema failure because the controls rendered in Form Builder preview before the workflow publish blocker.

Remaining proof required:

- Import the patched package fresh.
- Fix the workflow/task-node assignee and task form setting.
- Publish the approval form successfully.
- Open the published request page outside the designer and confirm the Doc library controls render there.

### Data List Custom Form Host

Status: validation-only / blocked in this pass.

Evidence:

- The generated `Document Review Tasks` data list is present in the package and graph validation.
- It has custom New/Edit/View forms containing Doc library controls.
- In the imported runtime app used for this pass, the data list was not visible in the top navigation, so the custom forms were not opened from the live UI.

Remaining proof required:

- Determine whether Yeeflow hides mixed data-list navigation in this app shape or whether additional app-resource metadata is needed.
- Import a patched package if needed and open the data-list custom forms directly.

## Generator Fixes From Runtime

- Shortened the generated app description to stay within Yeeflow's import field limit.
- Corrected approval page metadata to keep approval `pageurls[].pagetype = 1` while the embedded approval page form keeps `formdef.pagetype = 2`.
- Added a first-pass current-user `Requester` identity variable and approval task expression assignment, but the approval workflow still needs a focused task-node configuration fix before live request-page proof.
- Updated schema validation so `{LayoutID}` enum placeholders also accept concrete large numeric layout IDs in `attrs.caption.layout`.

## Deferred

- Dynamic expression folder binding remains unproven.
- Direct static sub-folder binding remains unproven.
- Data-list custom-form Doc library controls remain validation-only until opened in runtime.
- Published approval-form Doc library controls remain partial until the workflow/task-node assignee and task form setting are fixed, the patched package is freshly imported, and the request page opens outside Builder preview.
- Actual upload persistence was not tested.
