# YAP/YAPK Export-Shaped Application Generation Standard

When generating a new `.yap` application package, do not emit a thin synthetic skeleton. Generate an export-shaped, import-qualified YAP package that matches real Yeeflow app exports closely enough for async import/materialization.

For generated-final `.yapk` packages, apply the same principle at AppPackageInfo resource level: resources must be export-shaped enough for signing, install/materialization, designer opening, navigation, and browser runtime proof. Do not satisfy an approved App Plan with count-only resources, synthetic placeholders, dashboard shells, hidden implementation hosts, or incomplete approval/report definitions.

## A. Build From An Export-Like Baseline

- Use a proven exported YAP structure as the structural base.
- Preserve export-style wrapper, resource, and data shapes.
- Do not invent minimal JSON shapes just because validators accept them.
- For new app generation, use synthetic business content but export-like technical structure.
- The plugin must work without user-provided exported YAP samples.
- A bundled sanitized baseline/reference shape must be sufficient for first-time YAP generation.
- If no safe baseline exists, the generator must refuse import-qualified claims and report missing baseline.

## B. Baseline Reference Sanitization Rules

Any bundled or committed reference baseline must be normalized, tenant-neutral, structurally export-like, and free of copied customer/business data, tenant/user/workspace/private IDs, private URLs, raw package payloads from private apps, raw `Resource`, and raw `Sign`.

Replace tenant/user/workspace/private IDs with generated local placeholders. Do not commit raw sample application files.

## C. Use Export-Style IDs

- Use Yeeflow-compatible long numeric-string local IDs.
- Keep ID type/shape consistent with export patterns.
- Avoid short synthetic numeric IDs for app/list/field/layout/form/workflow/sample IDs.
- Preserve real-export type shape per location.
- If real exports use strings for `pageurls` / `childshapes`, use strings there.
- If schema currently says integer but real exports use string, validators should report schema/runtime mismatch rather than force an invalid runtime shape.

## D. Rebuild Resource.ReplaceIds From The Final Decoded Package

`Resource.ReplaceIds` must not be empty for generated YAP packages with local generated resources. Rebuild it after every generation or repair step.

Include every generated local app/list set ID, child list ID, field ID, layout/view ID, form/process ID, workflow node/resource ID, app group ID, sample record ID, and other generated local resource IDs. Exclude tenant/user metadata and external dependency IDs. Never copy `ReplaceIds` from a baseline package. Fail generation if `ReplaceIds` is empty or incomplete.

## E. Preserve Full Root/List/Layout Metadata

Generated root and child list models must include export-style metadata, not only title, list ID, and type. Include import-safe values for `WorkspaceID`, `TenantID`, `AppID`, `TableCode`, `IndexCode`, flags/status fields, `Perm`, `Ext1`, `Ext2`, `Ext3`, audit fields where baseline-safe, and valid `LayoutView`.

## F. Generate Full Field Metadata

Each field should include export-like metadata: `FieldID`, `ListID`, `AppID`, `FieldName`, `InternalName`, `DisplayName`, `FieldType`, `Type`, `Category`, `FieldIndex`, `Status`, `IsSystem`, `IsIndex`, stringified `Rules`, and storage family aligned with `FieldName`.

## G. Generate Full Layout/View Metadata

Each data list must have import-ready default views: Type `0` default view, visible columns resolving to real fields, query fields resolving to real fields/system fields, `Ext1.Url = "default"`, and export-style layout metadata and IDs.

## H. Approval Form DefResource Must Be Export-Shaped

For approval/form workspaces, include `Data.Forms[].ListID = 0`, root Type `105` navigation to the form key, aligned `FormKeys`, `Data.Forms[].Key`, root nav key, and `DefResource.key/defkey`.

Use `DefResource.pageurls[].formdef.children`; do not use `formdef.controls`. Use designer-safe controls only unless export-proven. Include `name`, `title`, `workflowType`, `AppListSetID`, `ProcModelAppID`, `ProcModelListID`, `ProcModelListSetID`, `ext`, `lineType`, `iconURL`, `flowPage`, `variables`, `graphposition`, `graphzoom`, `graphver`, workflow node `id/resourceid`, positions, source/target references, and task URL fields.

For YAPK approval forms, `Data.Forms[].DefResource` must use the canonical base64 encoding of bytes beginning with `::brotli::` followed by Brotli-compressed JSON. Generated-final validation must fail minimal placeholder definitions, missing request/task page metadata, missing `formdef.children`, duplicated designer control IDs, missing workflow graph positions, unresolved task URLs, missing variables, or key/defkey mismatch. Do not pass validation by deleting a planned approval form.

Approval form designer hydration is part of import qualification for generated approval workspace packages. Every generated control in `formdef.children` must have a unique designer-level `id`; IDs must be unique across the full form tree and any control references must resolve. Heading/text controls must set native rendered text metadata, including `attrs.headc.title.value` for headings, and must not fall back to placeholder text such as `Here is the title`. Control labels and native rendered values should stay synchronized. Use only designer-safe export-proven approval controls unless another control family has separate designer proof.

## I. Preserve App-Level Export Fields

Include expected app-level structures even when empty: `SimplePortal`, `PortalInfo`, `AppTags`, `AppMetadatas`, `AppComponents`, `AppThemes`, `OtherModules`, report arrays, permissions arrays, and app group structures where needed.

## J. Validate Decoded Runtime-Critical Strings

Generated-final validation must parse and validate decoded `DefResource`, stringified field `Rules`, form `Settings`, layout/view `Ext1`, `Ext2`, `Ext3` JSON where applicable, workflow graph strings where applicable, and `LayoutView` where applicable. Fail generated-final validation when runtime-critical strings are malformed.

## K. Native Title Exception Policy

Allow native Title schema conflict only as warning: `YAP_NATIVE_TITLE_SCHEMA_CONFLICT`. Do not fix native Title into an artificial generated field name if that breaks runtime semantics. Preserve runtime-safe native `Title` with `FieldName: "Title"`, `InternalName: "Title"`, and native/system metadata consistent with real exports.

## L. Validate Import Qualification, Not Only Schema

Before handoff/import, run YAP schema validation, YAP generation contract validation, YAP package validator, graph validator, approval/form workspace inspector, data-list/default-view checks, decoded-string checks, `ReplaceIds` final coverage check, export-shaped metadata completeness check, and safety scan.

For generated-final YAPK handoff, run `scripts/yapk-first-generation-preflight.mjs`; it includes `scripts/validate-generated-yapk-export-shape.mjs` before signing readiness. The export-shape gate rejects count-only `FormNewReports`/`DataReports`, dashboard pages without visible resource-bound business controls, Summary/chart controls without the complete runtime-proven model contract, hidden Summary hosts counted as visible content, and native Title fields missing export-aligned `Status: 0`, `IsSystem: true`, and `IsIndex: true`.

Generated-final YAPK packages must be preflight-clean before `setsign`. Treat `scripts/yapk-first-generation-preflight.mjs --package <file.yapk> --plan <yeeflow-app-plan.md> --json` as the signing-readiness entrypoint when a plan exists. Do not sign a package that fails canonical schema validation, decoded export-shape validation, generated-final resource completeness, ID provenance, app icon, navigation metadata, dashboard materialization, or redacted-output checks. Signing can prove only package wrapper integrity; it cannot repair app content.

Generated-final YAPK packages must not embed business seed rows in `Childs[].ListDatas` or `Childs[].List.ListDatas`. Sample/demo data belongs in a separate seed artifact and may be inserted only through an explicitly approved live seeding step after install/runtime scope is clear. Keeping seed rows outside the package prevents import failures and keeps schema validation focused on application structure.

Dashboard KPI cards must be backed by real Summary controls when dynamic metrics are claimed. A KPI card is not generated-final materialized if it is only static text, a styled number, or a hidden Summary host. The package-side contract must include the Summary control, `Resource.ReportIds[]`, `Resource.exts[]`, `Resource.tempVars[]`, `attrs.save_var`, and a visible text binding to the same saved temp variable.

Dashboard filters must be consumed by at least one Collection/table/KPI consumer. Filter controls with bare scalar operator/value placeholders such as `0`, or filters that expose UI state without a matching consumer query/filter binding, are not generated-final ready. Static package validation proves the linkage contract only; browser/runtime proof is still required before claiming data changes after a filter selection.

For approval forms, validate three separate gates: import-qualified means the package is export-shaped and locally import-ready; designer-qualified means the form opens in designer, intended text renders, and selecting one control selects only that control; runtime-qualified means the opened app/form behaves correctly in the target runtime.

## M. Proof Language Rule

Never call a YAP import successful from API status `0` / `Completed=false`.

Use separate proof levels: local validation passed, API accepted/queued, async import completed, app opened, form designer hydrated, controls render with intended text, single-control designer selection verified, and workflow designer hydrated. Generated reports must include a proof boundary field and must fail validation if they label API accepted/queued as import successful.
