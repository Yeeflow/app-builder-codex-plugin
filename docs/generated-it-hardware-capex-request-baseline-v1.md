# Generated IT Hardware CAPEX Request Baseline v1

## Package

- App: `IT Hardware CAPEX Request`
- Generated app JSON: `it-hardware-capex-request-app-def.v1.json`
- Approval form Def JSON: `it-hardware-capex-request-approval-form-def.v1.json`
- List validation JSON: `it-hardware-capex-request-list-def.v1.json`
- Wrapper: `it-hardware-capex-request.generated.v1.yap`
- User-test copy: `/Users/Renger/Downloads/IT Hardware CAPEX Request Generated v1.yap`
- Generator: `generate-it-hardware-capex-request-v1.mjs`
- ID family: `438...`
- Flow key: `CAPX`

## Resources

- Root app shell with one Type 103 `Overview` dashboard.
- Data list: `IT Hardware CAPEX Requests`.
- Custom list forms: `Edit Item`, `View Item`.
- App-level approval form: `IT Hardware CAPEX Request`.
- Submission page: `IT Hardware CAPEX Request Form`.
- Task page: `IT Hardware CAPEX Request Task`.

## UI Pattern

The baseline translates the JSX page into native Yeeflow form structures:

- request summary panel with metric cards
- workflow route panel
- routing controls panel
- ten card-style business sections
- two-column-oriented field grouping approximated with native containers
- `Form bottom` with Action Panel and Flow History

## Data List

The generated list preserves native Title metadata:

- `FieldName: "Title"`
- `Status: 0`
- `IsSystem: true`
- `IsIndex: true`

V1 persists 32 core fields into safe Text, Decimal, Bit, and Datetime fields. Environment-dependent values such as identity, location, and cost center are persisted to Text fallback fields.

## Approval Controls

Native controls included:

- `input`
- `textarea`
- `richtext`
- `input_number`
- `currency`
- `radio`
- `checkbox`
- `switch`
- `datepicker`
- `file-upload`
- `icon-upload`
- `identity-picker`
- `location-picker`
- `cost-center-picker`
- `signer`

Warnings remain for runtime-unproven or environment-dependent controls. These are intentionally documented rather than promoted as fully proven.

## Dynamic Display

Implemented via `attrs.control_display`:

- Single Source Justification shown when Single Source Procurement is true.
- Contract Reference shown when Existing Contract Available is true.
- Security Risk Notes shown when Security Review Required or Contains Data Storage is true.
- Disposal Plan shown when Disposal Needed is true.
- Installation Site Details shown when Installation Required is true.
- Downtime Details shown when Downtime Expected is true.

## Workflow

V1 uses a linear safe workflow:

Start -> Set Request No. and Status -> Line Manager Approval -> IT Architecture Review -> IT Security Review -> Finance Approval -> Procurement Review -> Procurement Processing -> Goods Receipt and Asset Registration -> Requester Confirmation -> ContentList -> End

Every review/task has a rejection path to End with Rejection. InclusiveGateway conditional routing is deferred to v2.

## Validation

- `node --check generate-it-hardware-capex-request-v1.mjs`: pass
- `validate-yap-package.js`: pass with warnings, 0 errors
- `validate-yap-graph.js`: pass, 0 warnings
- `validate-ywf-def.js`: pass with warnings, 0 errors
- `validate-ydl-list.js`: pass with warnings, 0 errors
- control/field schema smoke: pass
- `build-yap-wrapper.js`: pass
- wrapper round trip: decoded equals source, package validation passed, graph validation passed, no placeholders

## Known Warnings

- `text-editor` and `icon` controls are schema-supported/unclassified.
- `richtext`, `checkbox`, file upload, icon upload, signer, identity picker, location picker, and cost-center picker are runtime-unproven or environment-dependent in this generated package.
- File, image, and signer values are not persisted through `ContentList` in v1.
- Later manual Runtime V2 UI refinement proved that v1/v2 form layout quality was not yet the default standard. Future regeneration should apply `docs/yeeflow-form-design-quality-rules.md`, including page-level background, `Form header`, request metric row, inline text/icon widths, square icon badge wrappers, two-column `flex_grid` field sections, runtime-sensitive picker/image handling, and native calculated controls for formula fields.

## Runtime Status

Runtime testing found a concrete v1 workflow publish issue:

- Import/app-open: confirmed in Chrome.
- Dashboard: opened and rendered a simple native workspace page.
- Data list: opened without `datas/query` 400 and showed generated sample rows.
- Custom list form: opened and rendered the generated CAPEX field groups.
- Approval form designer: opened and rendered the generated form/workflow.
- Publish result: failed with `Configuration error on node Request Submission: TaskUrl is null`.

This v1 package is retained as the first generated baseline and failure evidence. The fix is captured in v2 by adding the runtime-required uppercase `TaskUrl` property to workflow task nodes and regenerating with a fresh ID family and FlowKey.
