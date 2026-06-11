# Generated Design System Request Tracker Baseline

## Purpose

`Design System Request Tracker` is the first generated runtime proof package for the Yeeflow Application Design System. It is intentionally small: one dashboard, one data list with Edit/View custom forms, and one simple approval form/workflow.

## Package

- Generated local package: `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/design-system-request-tracker.v1.yap`
- Generator: `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/generate-design-system-request-tracker-v1.mjs`
- Source app definition: `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/design-system-request-tracker-app-def.v1.json`
- Approval form definition: `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/design-system-request-tracker-approval-form-def.v1.json`
- Fresh local ID family: `427`
- Fresh FlowKey/form key: `DSX`

The raw `.yap` package is a generated runtime artifact and is not committed.

## Included Scope

- Dashboard page: `Overview`
- Data list: `Requests`
- Custom list forms:
  - `Edit Item`
  - `View Item`
- Approval form: `Submit Request`
- Simple workflow:
  - submit request
  - reviewer approval assigned to the applicant/current user
  - approved path creates a `Requests` data-list record

No external connections, AI/Copilot resources, document libraries, credentials, or custom code are included.

## Design-System Coverage

The package applies the generated-app design-system standards:

- dashboard/form pages use full-width style shell and zero page padding where supported
- dashboard page hides the page header through `attrs.hideHeaderAll = true`
- `Main` container is the root visual parent
- `Content` container holds primary page content
- dashboard uses semantic sections: `Page header`, `Summary section`, `Collection section`, and `Empty state`
- data list includes `Edit Item` and `View Item` custom forms
- New/Edit map to `Edit Item`; View maps to `View Item`
- approval pages use `Form body` and `Form bottom`
- Action Panel and Flow History are generated in `Form bottom`
- visible controls use meaningful `nv_label`
- colors and spacing are token-aligned where Yeeflow page JSON supports token values

## Local Validation

All blocking local validation passed.

- `node --check generate-design-system-request-tracker-v1.mjs`: pass
- `node validate-yap-package.js ./design-system-request-tracker-app-def.v1.json --mode generator --stage final`: pass with warnings, errors `0`, warnings `5`
- `node validate-yap-graph.js ./design-system-request-tracker-app-def.v1.json --mode generator --stage final`: pass
- `node validate-ywf-def.js ./design-system-request-tracker-approval-form-def.v1.json --mode final`: pass with warnings, errors `0`, warnings `2`
- `node validate-ydl-list.js ./design-system-request-tracker-requests-list.v1.json --mode generator --stage final`: pass with warnings, errors `0`, warnings `4`
- `node scripts/smoke-control-field-schema-validation.mjs`: pass
- `node build-yap-wrapper.js ./design-system-request-tracker-app-def.v1.json ./design-system-request-tracker.v1.yap`: pass; round-trip decoded source matched
- workflow action configuration validation: pass, checked nodes `11`, supported nodes `11`, unsafe nodes `0`
- wrapper package validation: pass with warnings, errors `0`, warnings `5`
- wrapper graph validation: pass

The remaining warnings are non-blocking generation evidence warnings: schema-supported dashboard text-editor controls, environment-dependent approval-form identity-picker controls, standalone list validation context, and token color resolution.

## Runtime Result

Runtime site: `https://<yourdomain>.yeeflow.com`

Imported runtime display name: `Design System Request Tracker DSX`.

Runtime checks passed:

- app imported successfully
- app opened
- navigation rendered: `Overview`, `Requests`, `Submit Request`
- dashboard rendered the generated design-system layout
- data list opened without a visible `datas/query` 400
- master sample data loaded
- `Edit Item` custom list form rendered from `New item`
- `View Item` custom list form rendered from an existing row
- approval form imported and appeared in navigation
- approval form initially opened as unpublished, then published successfully from Yeeflow Form Builder
- approval submission form opened after publish
- `Form body` rendered request fields
- `Form bottom` rendered workflow actions; Flow History rendered on submitted/task pages
- request submitted successfully
- reviewer approval task routed to the current user
- approval completed successfully
- approved path created a `Requests` record with status `Approved`

Runtime-created record:

- Request title: `Design system runtime DSX approval test`
- Request type: `General`
- Requested by: current user value rendered in the form as `Renger from Yeeflow`; the persisted list value was the remapped user ID
- Status after approval: `Approved`

No visible console or network failure was encountered during the successful runtime path.

## Learned Runtime Details

- For generated root dashboard pages with embedded page JSON, set `LayoutInResources[0].ID` and `LayoutInResources[0].RefId` to the dashboard `LayoutID`. A separate generated resource ID imported but rendered as an empty designer placeholder.
- Child data lists must keep `ListModel.CustomType` aligned to the current root list set ID. A stale source `CustomType` can import while hiding the child list from navigation.
- Applicant/current-user assignment should use a user-typed workflow variable. The requester identity-picker rendered correctly with `value: "CurrentUser"` and could be used for the reviewer assignment.
- Yeeflow runtime record creation from the approved workflow path created the data-list row correctly.
- Generated app-level approval forms may import as unpublished. Runtime proof for approval submission must include publishing the imported form in Form Builder before testing submit/approve/persist behavior.
- For data-list persistence fields, use text fallback for environment-dependent requester fields unless a focused identity field/list persistence export proves the native data-list user field shape.

## Minor Presentation Notes

The dashboard still includes an empty-state section even when sample request cards are visible. This is acceptable for the first proof package, but future generated dashboards should conditionally show the empty state only when the bound collection has no records if that condition pattern is proven.

After the first runtime proof, the navigation color standard was tightened: generated app shells should explicitly set the navigator menu text color to the header background color and the navigator menu background to the header text color. The original runtime proof package imported and functioned, but its nav label contrast exposed this styling gap.
