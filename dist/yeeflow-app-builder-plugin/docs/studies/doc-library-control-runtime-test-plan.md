# Doc Library Control Runtime Test Plan

Generated package:

`enterprise-document-center-doc-library-control-v3.yap`

Generated app:

`Enterprise Document Center - Doc Library Control`

## Local Gates

Before Yeeflow import:

- JS syntax checks for changed `.js` and `.mjs` files.
- JSON parse checks for changed `.json` files.
- `validate-yap-package.js` on the generated package.
- `validate-yap-graph.js` on the generated package.
- standalone `validate-ydl-list.js` checks for each generated Type `16` document library.
- build wrapper round trip through `build-yap-wrapper.js`.
- `git diff --check`.
- safety scan for raw exports, decoded payloads, generated `.yap` tracking, document binaries, `.env`, credentials, and token-like values.

## Runtime Test Steps

Import into `https://<yourdomain>.yeeflow.com/` only after local validation passes.

App-level checks:

- Package imports successfully.
- App opens correctly and is not an empty shell.
- All three Type `16` document libraries appear.
- Generated root folders remain visible.
- Dashboard `Document Center` appears.
- Dashboard opens without designer placeholder or blank content.

Dashboard Doc library control checks:

- `Company Policies Root` renders the Company Policies library root.
- `HR Policies Folder` renders the Company Policies / HR Policies folder context.
- `Project Contracts Folder` renders Project Documents / Contracts folder context.
- `Templates Root` renders the Templates and Forms library root.
- Caption/title area appears where configured.
- Search box appears where configured.
- Add button appears where configured and uses the target library `New file` form.
- Refresh the page and confirm controls still render.
- Navigate folders inside a control if the control UI exposes folder navigation.

Do not test real upload unless using a harmless dummy file and explicitly record the result. Do not claim upload persistence unless it is actually tested.

## Expected Proof Level

This v3 package is intended to prove dashboard Doc library controls for:

- root library display
- static root-folder display
- caption/search/add true settings
- field-column display through `listarr`

It is not intended to prove:

- dynamic expression folder paths
- add/search/caption disabled states
- approval form context
- data-list form context
- document-library form context
- actual upload behavior

## Runtime Result

Runtime-tested in `https://<yourdomain>.yeeflow.com/` on 2026-05-18.

Status: runtime-proven for dashboard root-bound and static root-folder-bound Doc library controls.

Passed checks:

- Package imported successfully.
- App opened correctly and was not an empty shell.
- All three document libraries appeared in navigation.
- Generated root folders appeared in all three document libraries:
  - Company Policies: `HR Policies`, `IT Policies`, `Finance Policies`, `Compliance Policies`
  - Project Documents: `Requirements`, `Contracts`, `Meeting Notes`, `Deliverables`
  - Templates and Forms: `HR Forms`, `Finance Forms`, `Project Templates`, `Legal Templates`
- Dashboard `Document Center` appeared and opened.
- All four generated dashboard controls rendered:
  - `Company Policies Root`
  - `HR Policies Folder`
  - `Project Contracts Folder`
  - `Templates Root`
- Root-bound controls showed the expected library-root folders.
- Static folder-bound controls showed the expected folder context.
- Caption/title, search box, and add button were visible where configured.
- Add button opened the target document-library action menu; choosing `New File` opened the target `New file` modal. No file was uploaded.
- Dashboard controls still rendered after page refresh and after navigation through document-library pages.

Deferred checks:

- Actual upload behavior and upload persistence.
- Dynamic expression-based folder binding in a generated package.
- Disabled caption/search/add settings.
- Approval form, data-list form, and document-library form host contexts.
