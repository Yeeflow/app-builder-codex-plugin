# IT Hardware CAPEX Request v3 UI Refresh Plan

Purpose: regenerate the IT Hardware CAPEX Request app using the manually improved Runtime V2 submission-form design rules while preserving the working v2 functional workflow and persistence baseline.

Do not start v3 generation until explicitly requested.

## Source Inputs

- Functional source: `IT Hardware CAPEX Request.md`
- Visual source: `it_hardware_capex_request_page.jsx`
- Runtime UI correction source: `IT Hardware CAPEX Request Runtime V2.yap`
- Working generator baseline: `generate-it-hardware-capex-request-v2.mjs`
- Working package baseline: `docs/generated-it-hardware-capex-request-baseline-v2.md`
- UI rules: `docs/yeeflow-form-design-quality-rules.md`
- Runtime V2 study: `docs/it-hardware-capex-request-runtime-v2-ui-study.md`

## Scope

Generate a fresh-ID v3 package with:

- root app shell
- IT Hardware CAPEX Requests data list
- custom Edit/View list forms
- app-level IT Hardware CAPEX approval form
- submission page refreshed with Runtime V2 quality rules
- task page refreshed with the same section/header/grid standards where practical
- existing v2 workflow graph and `TaskUrl` fix
- existing ContentList persistence mappings unless schema changes are required

Do not add:

- external integrations
- AI
- document libraries
- custom code
- unproven complex routing

## Required UI Changes

1. Set page background on `page.formdef.attrs.background`.
2. Keep `Main` structural.
3. Add `Form header` above normal content.
4. Put `Request summary panel` and `Request metric row` inside `Form header`.
5. Apply custom CSS gradient to `Request summary panel` only if the generated design needs it.
6. Generate corrected heading/text-editor style shape with inline width.
7. Wrap section icons in square icon badge containers.
8. Use `flex_grid` field layouts with two columns.
9. Keep textarea/richtext/list controls full row.
10. Replace editable Subtotal with native `calculated` control.
11. Use export-backed file/image attrs or fallback.
12. Treat location/cost-center/department/metadata controls as runtime-sensitive.

## Validation

Run:

- `node --check generate-it-hardware-capex-request-v3.mjs`
- `node validate-yap-package.js <v3-app-def> --mode generator --stage final`
- `node validate-yap-graph.js <v3-app-def> --mode generator --stage final`
- `node validate-ywf-def.js <v3-approval-def> --mode final`
- `node validate-ydl-list.js <v3-list-def> --mode generator --stage final`
- `node workflow-action-config-validator.js --smoke` if workflow actions changed
- wrapper build and round-trip validation

## Runtime Test

Only after local validation:

1. Import to `https://<yourdomain>.yeeflow.com`.
2. Open app.
3. Open data list; confirm no `datas/query` 400.
4. Open approval form.
5. Confirm visual shell, header, metric row, field grids, icon badges, and calculated subtotal render.
6. Publish workflow.
7. Submit a request where practical.
8. Confirm ContentList creates a record.

## Stop Conditions

- Runtime-sensitive controls fail and no focused export-backed patch is available.
- Calculated control expression cannot validate.
- Workflow publish regresses.
- ContentList persistence target cannot be verified.
- Any fix would require guessing an unproven structure.
