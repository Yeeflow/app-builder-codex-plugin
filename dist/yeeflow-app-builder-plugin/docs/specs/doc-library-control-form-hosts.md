# Doc Library Control Form Hosts

Branch: `codex/doc-library-control-form-hosts`

Generated app: `Enterprise Document Center - Form Hosted Doc Library`

Generated package artifact: `enterprise-document-center-form-hosted-doc-library.yap` (ignored/uncommitted)

## Purpose

This package is a focused runtime proof for Yeeflow `Doc library` controls hosted inside forms. The previous milestone proved dashboard-hosted controls. This pass tests whether the same control schema can be generated and accepted in:

- approval form pages
- data-list custom forms
- document-library custom forms

## Document Libraries

The app keeps the runtime-proven Enterprise Document Center structure:

- `Company Policies`
  - root folders: `HR Policies`, `IT Policies`, `Finance Policies`, `Compliance Policies`
- `Project Documents`
  - root folders: `Requirements`, `Contracts`, `Meeting Notes`, `Deliverables`
- `Templates and Forms`
  - root folders: `HR Forms`, `Finance Forms`, `Project Templates`, `Legal Templates`

Each library uses `ListModel.Type = 16`, the seven native document-library fields, generated root folders, simple custom fields, Type `0` views, and no uploaded document rows or binaries.

## Approval Form Test

Approval form: `Document Review Request`

Controls generated on the submission page:

- Company Policies root-bound Doc library control
- Company Policies / HR Policies folder-bound Doc library control
- Project Documents / Contracts folder-bound Doc library control

The HR Policies control sets `caption.add = false` and `caption.search = false` to test disabled add/search settings. This is a generated runtime hypothesis until Yeeflow import/open proves the behavior.

## Data List Custom Form Test

Data list: `Document Review Tasks`

Generated custom forms:

- `New Review Task`
- `Edit Review Task`
- `View Review Task`

The forms include root/folder-bound Doc library controls. `Edit Review Task` and `View Review Task` include a Project Documents / Contracts control with add/search disabled.

## Document Library Custom Form Test

Target library: `Company Policies`

Generated form: `Policy File With Template Reference`

The form includes the native `Upload File` field plus a root-bound Doc library control for `Templates and Forms`. The form is assigned to add/edit/view together to avoid partial custom-form mapping.

## Deferred Tests

Dynamic expression folder binding is not generated in this package. The dashboard export observed `attrs.data.customPath`, but generated-package runtime behavior is still unproven.

Actual upload persistence is optional runtime testing only. If tested, use a harmless dummy file and do not commit the file or any exported document payload.

## Expected Runtime Classification

- If the package imports and each form opens with controls rendered, classify the relevant host context as runtime-proven for render/open and static root/root-folder binding.
- If disabled add/search settings render as hidden/disabled controls, classify those settings as runtime-proven for the tested host contexts.
- If a context fails while others pass, classify only that context as partial or blocked and keep the passed contexts separate.

## Runtime Result Summary

The first imported runtime app proved the document-library custom form host: `Company Policies > Add > New File` opened `Policy File With Template Reference`, and its embedded `Templates and Forms` Doc library control rendered generated folders with search/add disabled.

Approval form hosting is partial. The form imported and the Doc library controls rendered in the form builder preview, but the live request page required publishing. The publish blocker is a workflow-generation issue on the `Document Review` assignment task node: the task assignee and task form setting are not configured correctly. Treat this as a workflow/task-node follow-up, not as evidence against the Doc library control schema. A fresh import/publish pass is still required before claiming published approval-form runtime proof.

Data-list custom-form hosting remains validation-only in this pass because `Document Review Tasks` was generated and validated but was not reachable in the imported app navigation during runtime testing.
