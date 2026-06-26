---
name: yeeflow-application-generator
description: generate, inspect, validate, package, debug, and improve small yeeflow application-level .yap packages, including multi-list apps, app shells, app navigation, lookup relationships, approval forms, contentlist persistence, replaceids, exported-back .yap comparison, and sandbox app import/export learning.
---

# Yeeflow Application Generator

## Full-App Generation Entrypoint Boundary

For plugin-only clean-room generation, inspect `docs/reference/full-app-generation-entrypoints.json` with `scripts/inspect-full-app-generation-entrypoints.mjs` before claiming that the plugin has no full-app generation path. Full application generation is a first-class callable Codex skill entrypoint through `yeeflow-application-builder` and `yeeflow-application-generator`, and generated-final package artifact materialization is exposed through `scripts/materialize-full-app-generated-final.mjs`. When the registry and planning gates pass and business defaults are `user-default-approved-for-generation`, continue into generated-final `.yapk` materialization instead of stopping after planning. Do not treat `scripts/yeeflow-application-delivery-workflow.mjs`, `scripts/yeeflow-package-api-automation.mjs`, `generate-*-runtime-proof.mjs`, or `generate-vendor-onboarding-yapk-schema-v2.mjs` as generic Functional Spec + App Plan to full-app YAPK generators. If API-issued IDs are unavailable, report the ID-source blocker rather than a missing-generator blocker.

Use `scripts/materialize-full-app-generated-final.mjs --functional-spec functional-specification.md --app-plan yeeflow-app-plan.md --out-dir dist --api-id-manifest api-issued-ids.json --json` as the concrete materialization handoff. The command emits generated-final artifacts only when it can honestly materialize the declared resource graph. It never signs, installs/imports, upgrades, seeds data, runs Version Management proof, or runs browser/runtime proof. Fixture-ID mode is allowed only for plugin regression tests and is not signing/install eligible. If it returns `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED`, stop with that concrete blocker and use the skill-orchestrated full-app generation path or a follow-up resource-graph implementation task; do not produce or sign a placeholder package. The finding must be machine-readable with exact planned resource names, counts, required output surfaces, `packageEmitted: false`, and `signingEligible: false`.

When running fixture-ID regression mode, the materializer must still allocate enough synthetic API-shaped IDs for the actual App Plan resource graph. A tiny fixed fixture set that only supports trivial packages is not sufficient for clean-room nontrivial App Plan regression. Fixture output remains regression-only, must stay marked as fixture provenance, and must not be signed, installed, imported, upgraded, or described as live Yeeflow ID provenance.

Standalone generated-final materialization must not hand-build simplified Dashboard pages. For every planned Dashboard page, start from the registered `dashboard-page-layouts-v1.1` parsed resource shell, preserve the v1.1 page structure, remove empty Operations regions, and place business record-display components only inside a `content_card_wrapper > section_content_area` business slot. Remove unused copied `content_card_wrapper`, `content_card_60_wrapper`, and `content_card_40_wrapper` modules instead of leaving title-only sections whose `section_content_area` is empty. Parse Dashboard dataset rows from the App Plan and materialize the exact selected Collection presentation template from `docs/reference/collection-control-*.template.json`; do not collapse multiple App Plan selections into `collection_control_grid_table`. The generated Collection root must carry explicit dataset presentation provenance, source resource/list binding, dataset-region metadata, page-level dependencies, and template-specific action/temp-variable contracts. Before any signing readiness claim, the materialized package must pass Dashboard Page Layouts v1.1, Dashboard Collection template conformance, Dashboard Golden Reference conformance, aggregate Dashboard hard gates, YAPK package validation, ID provenance, navigation runtime metadata, and generated-final resource completeness.

When using the standalone materializer, parse App Plan Data List fields, Custom Data List Forms, Dashboard Filters, and Record Display Control Selection as generation inputs, not documentation-only text. Generated data lists must include the planned business fields with YAPK-canonical storage names by `FieldIndex`, runtime-visible `Rules.choices` for choice fields, and default view `layout[]` / `query[]` entries. Generated custom forms must attach to the App Plan host list. Generated Dashboard filters must be real export-shaped controls inside approved v1.1 business-content slots, but page-level `select-filter` variables must not be consumed by Collection `attrs.data.filter[]` conditions with `op`/`operator = "9"` until an export-proven empty-value bypass contract exists. Prefer proven `search-filter` / `attrs.data.fulltext[]` linkage or visible unfiltered Collections, because runtime evidence showed empty select-filter variables can clear all rows on initial load. Generated grid-table Collections must replace `{{DetailLayoutID}}` with a concrete Type `1` layout from the same source list and must preserve wrapper gap contracts on the Collection parent container.

Generated Dashboard KPI cards must preserve the approved KPI card visual structure while replacing every source-template dynamic variable with a page-local Summary/temp variable contract. Do not leave visible KPI values bound to Event Portfolio template variables such as `__temp_event_portfolio_approved_budget`, `__temp_event_portfolio_registration_rate`, or `__temp_event_portfolio_lead_follow_up`. Every dynamic KPI text binding must resolve to a variable declared in the same page resource `tempVars`, and that variable must be backed by a Summary control with matching `ReportIds`, `Resource.exts`, and `save_var` metadata. Place the Summary controls inside a dedicated hidden host container with `attrs.common.hide = [null, true, true, true]`, `attrs.style.direction = [null, "row"]`, `attrs.style.widthtype = [null, "1"]`, explicit `gap`, `align_items`, `justify_content`, and a false display rule such as `attrs.display.rule = "1 == 0"`; do not append Summary controls directly to visible content regions. Summary count controls that use `ListDataID` must include designer-shaped field metadata on `attrs.data.field`, `attrs.data.fieldObject`, `attrs.data.fieldInfo`, `attrs.field`, `attrs.fieldObject`, and `attrs.fieldInfo`. Stop before signing readiness if a KPI value references an undeclared temp variable, any source-template temp variable, a Summary outside the hidden host, or missing Summary field metadata.

Generated custom Data List forms must use Data List Form Layouts v1.1 as the page-level source of truth. New Item and Edit Item custom forms must clone `data_list_form_layout_new_edit_v1_1` from `docs/reference/data-list-form-layout-new-edit.template.json`; View Item custom forms must clone `data_list_form_layout_view_item_v1_1` from `docs/reference/data-list-form-layout-view-item.template.json`. Preserve the selected template root shell, page background, root full-width/zero-padding contract, `main > content`, section card structure, widths, spacing, typography, and locked non-business regions. Business content may be inserted or changed only inside `page_title_content`, `Operations`, `section_content_area`, `section_title_header`, and `kpi_card_wrapper`. New/Edit forms are for current-record editing only and must not include related Collections, Data Analytics, KPI regions, or Dashboard page shells. View Item forms may include current-record details plus related data, approved Dashboard Collection templates, Data Analytics templates, and KPI cards, but only inside approved business slots. Every generated custom form must carry `dataListFormLayoutTemplateId` or `derivedFromDataListFormLayoutTemplate`, and signing readiness must run `scripts/validate-data-list-form-layout-template.mjs --package <package.yapk> --plan <yeeflow-app-plan.md>`.

Generated Approval form pages and workflow task forms must use Approval Form Layouts v1.1 as the page-level source of truth. The single Approval form submission page must clone `approval_form_layout_submission_v1_1` from `docs/reference/approval-form-layout-submission.template.json`; every Approval form task page, Data list workflow task form, and Schedule workflow task form must clone `approval_form_layout_task_v1_1` from `docs/reference/approval-form-layout-task.template.json`. Preserve the selected template root shell, page background, root full-width/zero-padding contract, hidden form-title CSS, `main > content`, `content` custom width 1280, section card structure, widths, spacing, typography, and the locked `action_panel_flow_history_wrapper` containing Action panel plus workflow history controls. Business content may be inserted or changed only inside `page_title_content`, `Operations`, `section_content_area`, and `section_title_header`. Approval forms and workflow task forms must not include Data Analytics templates, charts, pivot tables, Summary/KPI analytics, or `kpi_metrics_wrapper`. Every generated task page `formdef` must carry `approvalFormLayoutTemplateId` or `derivedFromApprovalFormLayoutTemplate`, and signing readiness must run `scripts/validate-approval-form-layout-template.mjs --package <package.yapk> --plan <yeeflow-app-plan.md>`.

Approval form fields must use Approval Form Field Layouts v1.1 as the field-layout source of truth. Use `docs/reference/approval-form-field-layout-templates.json` and clone either `approval_form_fields_grid_2col_v1_1` (`form_grid_fields_2col_wrapper`) or `approval_form_fields_grid_3col_v1_1` (`form_grid_fields_3col_wrapper`) for every generated Approval submission/task field group. When the host page uses Approval Form Layouts v1.1, place the cloned field-grid wrapper only inside `content_card_wrapper > section_content_area`. Preserve every non-column Grid property, set every field control margin to zero, map field controls to business-specific `nv_label`/`nav_label` values, keep Multiple line/Rich text/Sub List controls full-row on every breakpoint, keep tablet columns less than or equal to PC/laptop columns, and keep mobile at one column. The App Plan must include an Approval Form Fields Layout Template Selection table before generation, and signing readiness must run `scripts/validate-approval-form-fields-template.mjs --package <package.yapk> --plan <yeeflow-app-plan.md>`.

Approval form `Submission Form Fields` and `Task Form Fields` tables in the App Plan are generation inputs. The materializer must inject those planned fields into `Forms[].DefResource.pageurls[].formdef` inside the selected Approval Form Field Layout wrapper; a shell-only Approval form with titles, workflow skeleton, and empty business content is not signing eligible. Do not leave unrelated source-template labels such as loan/pipeline field captions in a non-loan Approval form after materialization. Task field controls should be readonly unless the App Plan states that assignees edit them.

Approval workflow publish-readiness is a generated-final hard gate. Every generated Approval form must emit a Designer-publishable `DefResource` with `flowPage`, `variables.basic/listref/filter`, submission and task `pageurls[]`, Start node task URL aliases, `MultiAssignmentTask` task URL aliases, array-shaped `usertaskassignment`, approve metadata, approved and rejected paths, an `EndRejectEvent` rejected path, complete graph refs, and non-overlapping node positions. Run `scripts/validate-approval-workflow-publish-readiness.mjs --package <package.yapk>` before signing readiness. Do not treat signing, upgrade submission, Version Management updates, or API acceptance as proof that the live Designer `ProcModel` / `DefBlob` is publish-ready.

## UI Generation Hard-Gate Skill

Phase 3B adds workflow-level enforcement. Final reports for high-quality UI work must include contract, scope, runtime evidence, and structure-comparison artifact paths as applicable. Run `scripts/inspect-ui-closed-loop-workflow-enforcement.mjs` before claiming high-quality UI or design fidelity. Generation from design/mockup requires a UI contract. UI upgrades require a scope manifest. Runtime UI quality claims require runtime evidence. Design fidelity claims require structure comparison. Dynamic KPI proof requires before/after mutation evidence. Install/sign/upgrade success is not visual proof.

Use `yeeflow-ui-generation-hard-gates` whenever application generation touches dashboard/UI pages, Summary/KPI dashboards, runtime UI proof, sandbox page proof, export-proven control/style shape decisions, or existing-app UI upgrades. High-quality UI requires a page-by-page implementation contract; uncertain UI/runtime patterns should be proven on a sandbox page first; use export-proven Yeeflow control/style shapes; Summary/KPI controls require designer-shaped hidden Summary configuration; Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; Summary recalculation can be asynchronous or cache-delayed; semantic/non-UUID Summary IDs and other unsupported shapes remain unproven; for every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback; runtime screenshot evidence is required before claiming UI quality; install/signing/API acceptance is not runtime UI proof; UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope; broad scaffold-like UI must not be claimed as high-quality UI. Data Analytics controls require UUID/runtime-safe IDs for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Preserve existing Data Analytics control IDs during upgrades.

## Generated-Final YAPK ID And Navigation Hard Gates

Generated-final `.yap` and `.yapk` application wrappers must use FontAwesome icon mode only. The top-level `IconUrl` must be a JSON string with `b`, `i`, and `c`, where `i` is a FontAwesome class string such as `fa-solid fa-screwdriver-wrench`, `fa-regular fa-calendar-check`, `fa-solid fa-laptop`, or `fa-solid fa-boxes-stacked`, and `b`/`c` are valid colors. The decoded root `ListSet.IconUrl` must carry the same FontAwesome JSON as the wrapper; existing decoded root icon surfaces must never be blank, image URLs, or mismatched FontAwesome JSON. Do not use image URLs, `https://img.yeeflow.com/...`, SVG, emoji, blank/null, or non-FontAwesome application icons. Choose an icon that matches the business domain and record the rationale in the App Plan or generation report without generated package IDs. Run `scripts/validate-application-icon.js --package <file.yap|file.yapk>` before signing, import/install, upgrade-check, upgrade, or handoff.

Generated-final `.yapk` output must use API-issued numeric content IDs from `GET /utils/generate/ids?count=<n>` and must emit a redacted `dist/<app-name>-id-provenance-report.json` with `sourceMarker: "api-generated"`, path-to-purpose mappings, duplicate checks, unused-ID accounting, generator provenance metadata, and no non-API IDs. Local ID generation, hardcoded generated IDs, copied sample/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds are forbidden for generated-final `.yapk`. Runtime navigation groups must include API-issued `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list[]`; children must include `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`, with dashboards/pages as `Type: 103` plus `LayoutID`, approval forms as `Type: 105`, and data lists as `Type: 1`. Run `scripts/validate-yapk-id-provenance.mjs` and `scripts/validate-yapk-navigation-runtime-metadata.mjs`; stop before signing, install, upgrade-check, or handoff if either gate fails. `setsign`/`verifysign` and install acceptance do not prove ID provenance or navigation runtime metadata completeness.

YAPK upgrade ID stability hard gate: upgrade/new-version `.yapk` output must preserve IDs for existing semantic resources from the previous package/lineage manifest. Only newly added resources may consume newly API-issued IDs, removed IDs must not be reused, replacing all IDs is a hard failure, and `scripts/validate-yapk-upgrade-id-stability.mjs` must pass before signing, upgrade-check, upgrade apply, install-like writes, or handoff. Missing previous package/manifest fails closed; signing/install/upgrade acceptance is not ID-continuity proof.

## Dashboard Grid-Table Collection Pattern Gate

Dashboard/app page root content-area padding is a hard gate: every generated or upgraded Type 103 dashboard/app page must serialize `Pages[].LayoutInResources[].Resource` with root `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`. Scalar padding, object/numeric padding, numeric array padding, `attrs.common.padding`, or `attrs.style.padding` alone are invalid for the root content area. Normalize existing dashboard/app page roots to this exact token-array shape before signing, installing, importing, or upgrading. Inner layout containers may keep intentional spacing.

Data-list custom form root content-area padding uses the same hard gate: every generated or upgraded New, Edit, View, Detail, or custom form under `Data.Childs[].Layouts[].LayoutInResources[].Resource` or `Childs[].Layouts[].LayoutInResources[].Resource` must parse to a root with `attrs.container.cw = "2"` and the same `--sp--s0` token-array padding. Scalar zero, numeric object zero, `attrs.common.padding`, or `attrs.style.padding` alone remain compatibility fallbacks only and do not satisfy generated-final validation. Normalize existing data-list custom form roots to this shape before signing, installing, importing, or upgrading. Inner form sections, cards, grids, controls, and content wrappers may keep intentional spacing.

Dashboard record-list sections that require the grid-table visual/runtime pattern must use grid-table style `collection` controls, not dashboard `data-list` controls, unless the user explicitly requests Data table. Pair each Collection with a header `flex_grid` in one wrapper container, set both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`, and stop before signing, install, upgrade-check, or handoff if `scripts/validate-dashboard-grid-table-collections.mjs` fails. Planned row-click details require `attrs.data.link`, `attrs.data.opentype = "slide"`, `attrs.data.modalsize = 2`, and a concrete Type `1` custom detail layout with schema-compatible `LayoutView`; when the App Plan does not declare row/card open behavior, emit explicit no-open metadata rather than empty or placeholder links. Hide duplicate dashboard headers with `attrs.hideHeaderAll = true`, preserve the selected Golden Reference typography tokens for titles, subtitles, KPI text, and grid-table headers, include Text style metadata, and never let helper metadata leak into encoded package objects. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

Dashboard pages must start from the full Dashboard Page Layouts v1.1 shell before inserting Collection, filter, KPI, or golden-reference components. Do not generate a page that only contains the selected Collection template without the v1.1 `Main > Content`, section title/content areas, full-width structural containers, and canonical background/padding. Card-style Collection templates are not grid-table templates; generate and validate them with their own export-shaped template contract instead of adding grid-table header/item requirements. If an App Plan declares Dashboard Summary/KPI metrics or filters, the generated dashboard must include real Summary/KPI and Data Filter/search/select/radio controls plus downstream consumers; a Collection-only page is incomplete even when the Collection template passes. Select filters must preserve `attrs.lab.value`, `attrs.lab.ty = [null, "xs-light"]`, `attrs.lablay = [null, "top"]`, field/display/value bindings, and a valid placeholder string or `{ "value": "..." }` object. Search-filter placeholders must use the same valid string or object shape. Never spread a placeholder string into numeric object keys.

For `collection_control_responsive_card_grid`, `collection_control_card_with_multiselect_toolbar`, and `collection_control_grid_table_with_multiselect`, copy from the full template artifact in `docs/reference/` and preserve source style/layout/typography metadata instead of regenerating generic cards, headings, grids, or toolbars. Responsive card grid must clone `collection_control_responsive_card_wrapper`, map `card_col_item` Dynamic controls by source field type, reject `dynamic-image` when no Image field exists, and include item operation buttons only when valid Collection actions and delete-confirmation variables are present. For grid-table multiselect, replace the template `{{DetailLayoutID}}` with a concrete Type `1` custom detail layout for the selected source list, set `attrs.data.opentype = "slide"` and `attrs.data.modalsize = 2`, and preserve `grid_table_col_multiselect_wrapper.attrs.container.gap = 0` plus `attrs.style.gap = [null, 0]`. Do not emit `link: "default"` or leave row-detail links unresolved.

Facility Maintenance dashboard review adds generation-time dashboard hard gates that must not be pushed into Functional Spec or App Plan requirements. Generated dashboard packages and final reports must pass `scripts/validate-dashboard-generation-hard-gates.mjs` before signing readiness, signing, install/import, upgrade, or final success reporting. The gate enforces select/radio/checkbox filter display/value/style metadata, Container coded width/layout keys, KPI native Icon structure, Summary field-selection plus visible KPI binding consistency, and canonical application URL identity based on decoded package `$.ListSet.ListID` rather than install/import operation IDs.

##
Designer-qualified approval form YAP update: generated approval form workspaces must use only designer-safe export-proven controls unless separately validated, assign unique designer-level `id` values to every `formdef.children` control, populate native heading/text metadata such as `attrs.headc.title.value`, keep labels synchronized with native text, preserve child `ListType`, valid `NoRule`, published form status, full list/layout/DefResource metadata, and include app group IDs in final `Resource.ReplaceIds`. Do not treat API accepted/queued, import complete, or basic render as proof of designer hydration or single-control selection.
 Canonical Schema Files

YAPK validation uses `schemas/yapk-schema.json`. YAP validation uses `schemas/yap-schema.json`. Do not hardcode versioned schema filenames in runtime logic. To update a product schema standard later, replace the canonical file contents while keeping these filenames unchanged. Keep YAP and YAPK schema standards separate: YAPK uses `AppExportPackageInfo`, Brotli `AppPackageInfo`, and `Childs[].Fields`; YAP uses the YAP wrapper, `[______gizp______]` gzip `ListExportResult`, `Defs`, and `SimplePortal`.

## Generated-Final YAP Contract

For plugin-generated `.yap` files, `schemas/yap-schema.json` is only the base structural schema. Schema pass is necessary but not sufficient. Generated-final YAP packages must also pass `docs/standards/yap-generation-contract.md` and `docs/standards/yap-export-shaped-application-generation-standard.md` before output, import handoff, or any import-qualified claim.

Do not generate thin synthetic YAP skeletons. Use a proven export-like baseline or the bundled sanitized reference at `docs/studies/normalized/yap-export-shaped-application/reference-shape.normalized.json` so first-time generation works without user-provided samples. Use long numeric-string local IDs, preserve export-observed string IDs for `pageurls` and workflow `childshapes`, rebuild `Resource.ReplaceIds` from the final decoded package, include full root/list/layout/field/form/process metadata, include app-level export fields even when empty, parse runtime-critical strings, and preserve native `Title` as warning-only when schema wording conflicts with runtime semantics.

Treat API accepted/queued as not final proof. Generated reports must state the proof boundary and must not call API status `0` with `Completed=false` import success.

Northpeak regression hardening for generated YAP apps: treat `schemas/yap-schema.json` as a must-pass generation contract. Data-list `FieldType` may only be `Text`, `Bit`, `Decimal`, or `Datetime`; put the UI/control family in `Type`. Generated approval forms must include complete request/task pageUrl registration, StartNoneEvent request-page resolution, and a real assignment task with export-shaped assignment metadata. Run schema validation, generated-final package validation, and `validate-yap-graph.js` before claiming a generated YAP is ready.

Product schema refresh v0.6.18: the canonical YAPK schema now requires decoded `AppPackageInfo` to include `ListSet`, `Pages`, and `Childs`; optional modules such as `Forms`, `FormNewReports`, `DataReports`, `Groups`, `Tags`, `Metadatas`, `Agents`, `Connections`, `Knowledges`, `Themes`, and `Components` are not canonical root requirements unless the product schema requires them elsewhere. The plugin may still require planned modules through workflow/report standards, app-plan conformance, or internal completeness checks. Schema validity alone is not app completeness.

Leave Request guardrails: treat YAPK signing, approval-form completeness, navigation runtime shape, and runtime UI proof as generated-final gates. Do not hand off a YAPK with placeholder/all-zero `Sign`; use `setsign` and `verifysign` when credentials are available. If the plan includes approval workflow/form behavior, generate complete approval form resources or mark the build incomplete/staged with user approval. Grouped navigation must use `Type: "classes"` plus `list`; `children`/`Childs` groups are local-only and invalid for runtime navigation. Reports must separate schema validation, signing proof, API install acceptance, runtime UI proof, and known deferred items.

Product schema refresh v0.6.17: custom YAP/YAPK data-list fields must use storage-code `FieldName = FieldType + FieldIndex` such as `Text1`, `Decimal1`, `Bit1`, or `Datetime1`; business labels go in `DisplayName`. `Datetime` is the canonical date/date-time storage `FieldType`; legacy `DateTime` must not be generated. Only native `Title` may be system metadata with `IsSystem=true` and `FieldIndex=0`. Generated YAPK packages must include every canonical required metadata field for structures that are present; use schema-compatible empty strings/arrays/defaults rather than unsupported `undefined` or `null`.

For generated-final YAPK data-list boolean fields, always emit `FieldType = "Bit"`, storage `FieldName = "Bit<FieldIndex>"`, runtime control `Type = "switch"`, and string `DefaultValue = "0"` or `"1"`. Never emit Bit fields as `Type = "input"` or `Type = "checkbox"`, even if the App Plan uses generic words such as boolean, checkbox, yes/no, or flag. Every default view and custom form/list `LayoutView` row that references the Bit field must also use `Type = "switch"`. Run `scripts/validate-yapk-bit-field-controls.mjs` through first-generation preflight before any signing-readiness claim.

Plan conformance v0.6.22: treat the reviewed Functional Specification and approved App Plan as the implementation contract, not loose inspiration. Full app plans must follow the canonical `docs/standards/app-plan-standard-template.md` unless the user explicitly requested a lightweight quick outline; `docs/app-plan-standard-template.md` is a compatibility entrypoint only. Lightweight plans still require Data Model and Lists, Forms and Approval Forms, Application Navigation, UI/UX and Control Mapping, Generation Contract and Hard Gates, Proof Boundary, and Assumptions/Deferred Items. Generated applications must preserve planned data lists, fields, data-list views, custom list forms/public forms, list workflows, scheduled workflows, notifications, approval forms, request/task pages, workflows, pages, reports, print pages, agents/copilots/tools, knowledge resources, integrations/connections, custom code/custom CSS, permissions/admin resources, golden/template references, and navigation/information architecture. Every future app plan must include `Generation Contract and Hard Gates`; if it is missing, stop and repair the plan before package generation unless the user explicitly asks for planning-free experimental output. If a planned item cannot be implemented, explicitly mark it `unsupported_unproven_export_shape` or `intentionally_deferred_with_reason`; do not silently omit it. Run `scripts/validate-functional-specification.mjs <spec>` and `scripts/validate-app-plan-resource-order.mjs <plan>` before generation when the artifacts are Markdown, then run `scripts/validate-app-plan-conformance.mjs --plan <plan> --package <package>` or the aggregate `scripts/inspect-generated-app-quality.mjs --plan <plan> --package <package>` after generation. Include plan section conformance in the report before claiming completion. Schema/package validity does not equal plan fidelity.

App Plan validators enforce planning intent, not one fragile sentence. They must accept semantic equivalents for required intent, including `Submission fields`, `Task page fields`, `Form reports are independent approval-based resources`, `Form reports are separate from Dashboard/page planning`, `Unsupported shapes should not be generated`, and `No Sub List actions are needed`. Dashboard dataset presentation validation must parse only canonical Dashboard record-display / dataset-presentation table rows where Collection is selected or an approved Collection presentation reference is declared; prose, Form Report explanations, validator command lists, identity rows, and negative guardrails are not Dashboard dataset regions and must not require workaround text.

Generated Dashboard filters must be copied from approved v1.1/Event Portfolio filter modules, then mapped to the current app's list, field, display/value fields, label, placeholder, and downstream Collection/KPI consumer linkage. Missing `attrs.data.field`, label typography, tuple `attrs.lablay = [null, "top"]`, placeholder color, supported radius, fixed-width positioning with custom width 200, or consumer linkage is a generated-final blocker. Do not put filters directly under root `Content`, do not copy a competing Event Portfolio root shell, do not invent ad hoc filter bars, and do not normalize the v1.1 `Content` container padding to zero.

Static consumer linkage is not runtime proof for page-level select-filter controls. Do not emit Collection `attrs.data.filter[]` `op`/`operator = "9"` conditions wired to empty page-level select-filter variables unless an export-proven empty-value bypass has been validated. Use Search filter/fulltext behavior as the safe default when filter runtime semantics are uncertain.

For any generated Dashboard, custom Data List form, Approval submission page, Approval task page, Data list workflow task form, or Schedule workflow task form with two or more page-level Data Filter controls, clone `dashboard_standard_filter_group` and map the child filters inside it. Do not scatter filters as loose siblings, do not use invented filter-row containers, and do not apply this grouping rule to Collection-local toolbar search boxes.

Generated Dashboard Golden Reference modules must preserve child-control property fidelity. The generator may replace business text, data bindings, fields, actions, and labels, but must preserve role-specific typography tokens: page title `h2-bold`, page subtitle `body-medium`, KPI labels `s-medium`, KPI values `h2-bold`, KPI trend/note and section subtitle `caption-regular`, and grid-table column headers `caption-medium`. A package that preserves structure/provenance but collapses these controls to `h5-medium` is not signing-ready.

Advanced capability conformance: if the plan requires Custom code control, custom CSS, scheduled workflows, data-list workflows, notifications, AI Agents, Copilots, knowledge resources, connection/tool access, Form Reports, or named golden template/function references, generation must either implement the planned item exactly enough for local validation or report it as deferred with reason, fallback, and proof impact. Package presence/configuration is not runtime proof for scheduled execution, notification delivery, AI/tool execution, external/API/email actions, row mutations, or custom code behavior.

Navigation conformance v0.6.22: preserve planned navigation groups and child items. Runtime grouped navigation uses `Type: "classes"` plus `list`; `children`/`Childs` are local-only shapes and must fail generated-final conformance. If grouped navigation is requested, confirm the grouped `LayoutView` export shape from export-proven references before generating grouped metadata. If the grouped shape is not proven, do not invent unsupported group fields; report grouped navigation as `unsupported_unproven_export_shape`, use best-effort flat ordering only as an explicit fallback, and do not describe grouped navigation as fully implemented.

Runtime binding lessons v0.6.19: schema pass, signing HTTP 200, `upgrade_check_passed`, and `upgrade_applied` are separate proof boundaries; none proves runtime/designer correctness. Generate dashboards with real Summary/ext/report-id bindings and filter consumers, not visual-only KPI cards. Generate approval forms with real request/task controls, page URLs, workflow control panel, workflow history, and task bindings; static text-only approval pages fail. Compare visible navigation groups/entries and hidden anchors against the approved app plan, and fail unreachable generated resources.

For requester Department/Manager autofill from native user attributes, use `getUserAttr` and verified workflow-variable token wrappers: target `Department` as `Workflow Variables:Department` with `valueType: "groupselect"` and attribute `DepartmentID`; target `Manager` as `Workflow Variables:Manager` with `valueType: "user"` and attribute `LineManager`; source `Requester` as `Workflow Variables:Requester`. Reject old `__variables_Department`, `__variables_Manager`, and `__variables_Requester` shapes. Do not query Employee Profiles for native user attributes unless the business plan explicitly requires HR master data.

Service portal payloads are plan-gated: generate them only when service portal is explicitly planned. App/navigation groups that must be runtime-persisted need API-issued long ids, not small local ids. Business policy variants such as leave balances should be modeled in policy data with submit validation/action metadata, not hardcoded as one universal rule. Run `scripts/validate-runtime-binding-lessons.mjs` alongside schema, plan-conformance, workflow, and UI validators.

## YAPK Schema v5 Standard Additions

YAPK validation uses the effective composed schema loaded through `scripts/lib/load-yapk-schema.js`: product-team canonical `schemas/yapk-schema.json` plus Codex overlay `schemas/yapk-schema-codex.json`. The `x-yeeflow-standard-additions` section is actionable and not optional. Generated YAPK output must strictly follow those standards before signing, install dry-run, upgrade check, upgrade apply, or handoff. Package generation must stop if the generated output violates the effective schema or any enforceable standard addition. API install success is not runtime render proof; report local validation, API acceptance, queued import, and runtime materialization/render proof as separate scopes.


## FormNewReports Workflow Report Standard

Product clarification for v0.6.9 and v0.6.18: `FormReports` is the legacy workflow report collection and is not required by the canonical YAPK schema for generated apps. `FormNewReports` is the current workflow report collection when workflow reports are planned or generated. Generated workflow reports must be written to `FormNewReports`; validators must not require `FormReports`. A generated package with workflow report content only in legacy `FormReports` is invalid because current workflow reports must use `FormNewReports`.

## v0.6.8 First-Generation YAPK Smoke Gate

Account Health smoke testing showed that first-generation YAPK packages must pass the runtime-hardening gates before signing. Run `scripts/yapk-first-generation-preflight.mjs --package <file.yapk> --json` before `setsign`, install dry-run, upgrade check, upgrade apply, or handoff. The preflight runs canonical schema validation, FontAwesome application icon validation, decoded `AppPackageInfo` validation, data-list system schema validation, dashboard shell/Data table/Text-control validation through the YAPK validator, dashboard generation hard gates, ID safety checks, and redacted output checks.

Generated YAPK sample data must live in `Childs[].List.Items`, and every generated sample field value must serialize as a string. Do not emit schema-forbidden `AppID` properties inside decoded `AppPackageInfo` objects such as `ListSet`, `Pages[]`, `Childs[].List`, `Childs[].Fields[]`, or `Childs[].Layouts[]`; keep wrapper `AppID = 41` and only use app references inside documented embedded dashboard control data where the runtime requires them. Root `ListSet.LayoutView` must be a JSON string when present; dashboard pages keep `LayoutView: null`; generated child `List.LayoutView` remains null unless export-proven custom form routing is complete. FieldName suffix and storage family mismatches are generated-final blockers.

## Full Application Visual Quality Gate

Vendor Onboarding full UI v2 proved that import/install success is not enough. Do not call a generated package a full UI application unless it implements the approved plan and mockup-derived pages, forms, controls, bindings, and actions at usable quality. Blank or generic Data List custom forms are quality failures. Default/plain buttons without action bindings are quality failures. Default alert copy such as `Alert` or `Here is the description` is a quality failure. Kanban and Collection controls without meaningful dynamic item templates and item actions are quality failures.

For full application generation, run `scripts/inspect-generated-app-quality.mjs --package <package> --spec <approved-spec.md> --strict-visual-app-quality` before handoff. The strict gate must fail missing planned pages/forms, missing print pages, underbuilt dashboards, missing safe padding/card structure, placeholder controls, default buttons, missing actions, empty Kanban/Collection templates, and undocumented deferred scope. Do not return a minimal or technically importable scaffold when the user asked for the full approved application.

Before full application package generation, create a page-by-page composition checklist and get it approved when the app is mockup/spec driven. The checklist must name each required page section, Yeeflow control, source list, displayed fields, layout/card/grid/padding rule, button/action binding, item template, fallback, validation rule, and pass/fail status. Do not generate a package directly from high-level requirements when the user expects a full designed app. The generated package must implement every approved checklist item or explicitly defer it with a reason, fallback, and validation impact. Treat the approved composition checklist as the generation contract; do not generate or return a package unless every required checklist item is implemented or explicitly deferred with reason.


## Template Library Contract

Full application generation must use the reusable Yeeflow UI section template library when one is available. Composition checklist sections must reference a known `templateId` from `docs/templates/yeeflow-ui-section-template-library.normalized.json`, and generated packages must satisfy the referenced template's required controls, data bindings, fields, layout/card/padding rules, style rules, and action rules. Feature knowledge alone is not enough; use reusable UI templates for dashboard headers, KPI cards, alert cards, Data table sections, Kanban/Collection item cards, detail headers, sectioned forms, document checklists, print pages, and action bars.

Inside an installed plugin cache or a repo checkout, the packaged template registry must be available at `docs/templates/yeeflow-ui-section-template-library.normalized.json`; validators should pass it as `--template-library docs/templates/yeeflow-ui-section-template-library.normalized.json`. If this path is missing, treat the installed plugin package as incomplete and refresh/reinstall from the `stable` channel before generation.

Generate full applications page by page. Validate each page/form/dashboard against template conformance before assembling or returning a package. Do not satisfy a template with placeholder controls, title-only cards, default alert copy, blank custom forms, or active buttons without valid action bindings. If a template cannot be implemented safely, explicitly defer the section with a reason, fallback, and validation impact before generation.
Use the reference app corpus as the first source of export-proven UI section patterns before inventing new layouts. Prefer safe patterns from `Company Overview (3).yap`, `Data Lists (4).yap`, `Projects Center_2.yap`, and `Sales_Management_AD.yap` for advanced dashboard controls, custom list forms, Kanban/Collection item templates, actions, Data tables, related-record sections, filters, and operational workspaces. Use `DEMO Innovation Ecosystem Platform (1).yap` / `NHIC Innovation Overview` and `Service Desk Pro (2).yap` / `Executive Dashboard` as KPI dashboard references. Use `Online Library.yap` / `Inventory` and `Print Inventory` plus `Online Library (1).yap` / `Print Inventory` as multi-inventory print and per-item QR references. Use `Sales Quotation.yap` and `Sales Quotation (1).yap` as single-item print and print-QR references. For print pages, QR Code should bind to current item/current record or a business code field; do not generate static placeholder QR URLs. A new broad golden app is no longer needed for known template-library gaps, but browser print/page-break and scanned QR destination behavior still need runtime/manual proof.

Use `docs/standards/three-column-workspace-layout-standard.md` and template `three_column_workspace_shell` when an app needs inbox-style work management, review queues, triage, service desk, CRM account workspace, renewal review, task center, or list-detail-detail experiences. This pattern is optional, not a default for every app. Do not use it for simple forms, simple dashboards, or mobile-first minimal pages. If selected, each left/main/right panel must contain meaningful business content or data-bound controls; do not hand off designer drop-zone placeholders. Dashboard hosts must still use the current dashboard wrapper and `Main > Content` rules. Approval task hosts must keep outer task page URLs as `type = 2`, outer `pagetype = 1`, and embedded `formdef.pagetype = 2`.

## Vendor Onboarding v4.1 Hard Checks

Treat the completed Vendor Onboarding v4.1 iteration as a golden generation reference. Future full-app generation must hard-check these rules before handoff: dashboard pages use `Main > Content`; layout-only Grid controls have display caption off; every Navigator control label is meaningful rather than defaults like `Container`, `Grid`, `Text`, `Dynamic field`, or `Kanban`; KPI numeric cards are data-bound through Summary controls, `attrs.save_var`, dashboard `tempVars`, and visible formatted Text controls rather than static numeric Text; active buttons use valid action bindings; dynamic controls are placed only where context supports them, especially inside Kanban/Collection/Timeline item templates; generated data lists include valid schema, visible default display fields, selected lookup display fields, runtime-visible choice options in Rules.choices, not Rules.Options, and sample data. Keep the remaining Vendor lookup picker no-record behavior as a known product-team follow-up, not a reason to remove lookup display-field validation.

## Packaged Generation Standards

Apply the packaged standards in `docs/standards/` before generating or returning application packages. `data-list-generation-standard.md` requires native `Title`, no generated `Text0` primary field, runtime-visible choice options in Rules.choices, not Rules.Options, full default view display/query shapes, lookup relationships for related lists, dependency-ordered sample rows, and selected lookup display fields. `dashboard-summary-card-generation-standard.md` applies only to Dashboard pages and supported Data List custom forms because Summary controls are not available on approval forms or Data List public forms; do not generate Summary controls on unsupported surfaces. `account-health-smoke-issue-summary.md` records the first-generation smoke failures that must remain regression-tested. Run the matching validators and treat missing standards compliance as a generation failure, not a cosmetic warning.



## Three-Column Workspace Runtime Layout Mechanics

When using or validating `three_column_workspace_shell`, choose dashboard Style 2 from `docs/standards/three-column-workspace-layout-standard.md` and `docs/studies/three-column-dashboard-layout-runtime-css-study.md`. Style 1 dashboards keep the standard `Main > Content` wrapper. Style 2 three-column workspace dashboards do not: `three_column_workspace_shell` must be the root page body layout container, with dashboard content width set to Full Width and page padding set to 0. Do not wrap the shell in default `Main > Content` containers; runtime testing showed those default-height/default-position parents can make the shell render blank or incorrectly.

It is not enough to create three labeled sections. The page/form resource must contain one positioned row shell with three direct sibling panels, fixed-width left/right panels, fill-width main panel, full-height bounded panels, hidden outer panel overflow, scrollable body regions, sticky header/action regions, and meaningful bottom/support regions when present. Generated pages that stack the left, main, and right panels vertically, nest the shell under Style 1 wrappers, omit Full Width/zero page padding, or use layout-breaking icon widths must fail validation and must not claim this template. Icon controls inside the shell should use inline width behavior and intentionally bounded sizes for the panel/header context.

Before signing, install, upgrade, or handoff, run template conformance with the template library when a checklist declares this pattern. Treat `THREE_COLUMN_*` findings such as `THREE_COLUMN_SHELL_NOT_ROOT`, `THREE_COLUMN_SHELL_NESTED_IN_MAIN_CONTENT`, `THREE_COLUMN_PARENT_HEIGHT_DEFAULT_RISK`, `THREE_COLUMN_PAGE_WIDTH_NOT_FULL`, `THREE_COLUMN_PAGE_PADDING_NOT_ZERO`, `THREE_COLUMN_ICON_WIDTH_NOT_INLINE`, `THREE_COLUMN_PANELS_STACKED_VERTICALLY`, `THREE_COLUMN_PANEL_WIDTH_MISSING`, `THREE_COLUMN_OVERFLOW_MISSING`, and `THREE_COLUMN_PLACEHOLDER_PANEL` as generated-final blockers. If exact selected-record/right-panel refresh binding is not proven, use safe static/sample detail content, but keep the layout mechanics correct. API install success is not runtime layout proof; manual runtime verification must confirm the panels render side by side and remain usable.

## Multi-Column Form Workspace Pattern

Use `docs/standards/multi-column-form-workspace-standard.md` and template `multi_column_form_workspace_shell` when a service desk, help desk, CRM workbench, support console, review queue, renewal review, case-management console, or operational inbox needs form actions, variables, selected-record state, comments/updates, dynamic form fields, or action-driven filtering. This is an approval/form workspace pattern, not a dashboard reporting pattern.

During planning, choose a dashboard when the page is primarily reporting or monitoring. Choose the form workspace when the app needs navigation containers that set filter variables, ticket/list collection items that set selected/current record state, detail panels bound to that selected state, comment/update controls, or expand/collapse icon actions. Do not add fake workflow routing just to use the form surface; if the workflow is only Start to End, document that the form is being used as a no-submit workspace shell.

When generating this pattern, build a row shell with left navigation, ticket/list collection, selected-record workspace, and right attributes/detail regions. Navigation rows should be icon plus text containers with click/form actions. Filter controls and menu actions should set variables consumed by collection filters or queries. Collection item actions should set selected/current record state. Details panels should use dynamic field/user/file controls bound to the selected record. Comment/update actions must target the selected record and related activity list only when the binding is validated. Avoid placeholder-only panels, fake Submit Request buttons, and claims of selected-record behavior when the actions and bindings are not implemented.

Before signing, install, upgrade, or handoff, run template conformance when a checklist declares `multi_column_form_workspace_shell`, `four_column_service_desk_workspace`, `service_desk_inbox_workspace`, or `action_driven_ticket_workspace`. Treat `FORM_WORKSPACE_*` findings as generated-final blockers for pages that claim this pattern, including behavior errors (`FORM_WORKSPACE_NAV_ACTION_MISSING`, `FORM_WORKSPACE_FILTER_VARIABLE_MISSING`, `FORM_WORKSPACE_COLLECTION_FILTER_MISSING`, `FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING`, `FORM_WORKSPACE_DETAIL_BINDING_MISSING`, `FORM_WORKSPACE_ICON_ACTION_MISSING`, `FORM_WORKSPACE_FAKE_SUBMIT_BUTTON`) and runtime layout-property errors (`FORM_WORKSPACE_SHELL_LAYOUT_PROPERTIES_MISSING`, `FORM_WORKSPACE_COLUMN_WIDTH_MISSING`, `FORM_WORKSPACE_COLUMN_HEIGHT_MISSING`, `FORM_WORKSPACE_COLUMN_OVERFLOW_MISSING`, `FORM_WORKSPACE_DIRECTION_INVALID`, `FORM_WORKSPACE_ELEMENT_GAP_MISSING`, `FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE`, `FORM_WORKSPACE_VERTICAL_TEXT_RISK`, `FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY`). Use `docs/studies/normalized/service-desk-pro-form-workspace/reference-property-map.normalized.json` before generating this pattern; default-container-only or semantic-only four-column layouts must fail before package handoff. API install success is not runtime interaction proof; manually verify that columns render side by side, navigation filters, selected ticket refresh, detail bindings, comments, and collapse/expand actions work.

For YAP approval/form workspaces, also apply `docs/standards/yap-approval-form-workspace-generation-standard.md` and run `scripts/inspect-yap-form-workspace-generation.mjs <package.yap>` before import or handoff. The successful Service Desk v8 smoke proved these generated-final rules: `Data.Forms[].ListID = 0`, root Type `105` navigation points to the form key, `Resource.FormKeys[]` / `Data.Forms[].Key` / Type `105` key / `DefResource.defkey` align, form content lives in `DefResource.pageurls[].formdef.children`, unsupported `formdef.controls` is not emitted, and controls use lowercase export-style names. Import acceptance is not proof that the approval form materialized; blank forms can still happen when the designer-readable tree is wrong.

Even no-submit YAP workspaces need a complete minimal workflow graph: `StartNoneEvent -> SequenceFlow -> EndNoneEvent`, with Start outgoing, End incoming, SequenceFlow source/target, and Start task URL fields pointing to the requester form page. Workspace requester pages should hide the default form header, set content width to Full width, and set padding to `0`. Icon, Text/heading, Button, and Dynamic field controls should default to inline width behavior; icons in menu/text rows should match nearby text size, such as 16px icons for 16px text. Multi-column shells use Hidden overflow, and every visible column/body region should have its own Scroll or Auto overflow. Preserve runtime-safe native `Title` fields even when canonical YAP schema tooling reports the known digit-suffix conflict; report it as `YAP_NATIVE_TITLE_SCHEMA_CONFLICT` warning until the schema is corrected.

## Public Tenant Safety

- Never hardcode a tenant-specific Yeeflow URL. Use `https://<yourdomain>.yeeflow.com` in docs and examples.
- For live user-facing API calls, use OAuth; if OAuth is not authenticated, ask the user to sign in through the Yeeflow plugin login flow.
- Do not use `YEEFLOW_API_KEY` for normal plugin/API operation; keep it only as a legacy/deprecated fallback where existing code still supports it.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- Support `YEEFLOW_PROFILE` where scripts support profiles. It selects one active local tenant profile per run using `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and `YEEFLOW_<PROFILE>_TENANT_ID`.
- Validate and redact environment variables before API calls and never print API keys, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, or generated runtime packages.
- Keep generated examples tenant-neutral unless the user explicitly requests a target-tenant-specific package and provides safe mappings.

## Plan-First Full-Scope Generation

Do not generate a `.yap` or `.yapk` package directly from a broad app request unless the user explicitly skips planning. Start from a saved or visible Functional Specification and Markdown App Plan that follows `docs/standards/app-plan-standard-template.md`: numbered plan status, requirement-to-resource mapping, resource generation order, data lists/document libraries, approval forms, Form Reports, schedule workflows, AI Agents, Copilots, custom data-list forms, data-list workflows, notifications, views, dashboards/pages, navigation, permissions, plugin capability compliance, generation hard gates, validation plan, proof boundary, assumptions, deferred items, and recommended next prompt.

The `Generation Contract and Hard Gates` section is binding during generation. It must cover output package decision, YAPK signing gate, approval-form contract, Assignment Task assignee plan, navigation runtime contract, plan-to-package conformance contract, proof-boundary contract, and runtime inspection checklist. Do not generate an approval app with `Forms: []`; do not generate Assignment Tasks without explicit assignee strategy and proof status; do not use invented job-position IDs/names; do not use `children`/`Childs` for runtime grouped navigation; do not call a placeholder-`Sign` YAPK upload-ready; and do not merge API install/import acceptance with runtime UI success.

For generated YAP root dashboards, use the current dashboard shell learned from the Vendor Onboarding v1.93 export: `Type = 103`, `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and `LayoutInResources = []` for an empty/current shell, with root navigation pointing to the dashboard `LayoutID`. Current dashboards can include inline page resources; Vendor Onboarding v1.12 proves a simple current-dashboard Data table import path when `attrs.listarr[].Field` is the source field and `FieldName` is the label. Preserve the import-learned YAP rules: `AppID = 41`, API-issued IDs, populated `ReplaceIds`, integer `Field.Category`, unique IDs, product-schema `ListExportResult`, and child `CustomType = ListSite_<root ListID>`.

Ask focused clarification questions when blocking details are missing, especially purpose, roles, required lists/fields, status model, approval flow, dashboards, actions/workflows, integrations, package type, or output format. Ask only enough to prevent a bad package. For non-blocking gaps, document assumptions in the plan and proceed.

Default to the full functional application described in the plan, not a simple/MVP/basic v1 build. Implement all planned core lists, fields, forms, dashboards, actions, workflows, and major controls in one package when feasible. If something cannot be generated safely, document it as excluded/deferred with a reason and workaround; do not silently omit planned features.

After generation, compare the package against the plan before handoff. Planned data lists, important fields, forms, approval form and task pages when required, dashboards/pages, navigation groups, print pages, Data table columns, actions/workflows, permissions/integrations, padding/layout standards, and data bindings must exist or be explicitly marked deferred. Do not mark the package ready when the implementation is a smaller version than the plan.

Any hard-gate failure in section 18 must stop handoff: unsigned placeholder-`Sign` YAPK when signing is required, approval-required plans producing `Forms: []`, runtime navigation groups using `children`/`Childs`, missing planned resources without deferral, or proof reports that collapse runtime proof into local validation/API acceptance.

## Web App UI/UX Control Mapping

Design the Yeeflow app like a modern web application first, then map the design to Yeeflow controls. Use the best combination of standard Yeeflow controls, style settings, custom CSS, and Custom code control when needed.

The app plan must include `UI/UX and Control Mapping`. For each page/form/dashboard, state the user goal, layout pattern, selected Yeeflow controls, rationale, data bindings, actions, styling approach, custom CSS/custom code needs, alternatives considered, and validation checks.

Map web-app patterns to Yeeflow controls intentionally: admin grids to Data table with columns/actions; card feeds to Collection with dynamic fields; task boards to Kanban; histories to Vertical/Horizontal Timeline; dense detail pages to Tabs/Toggle/containers/grids/dividers/alerts; line items to Dynamic Sub List; printable records to Print Page; status visualization to Steps bar/progress/badges/alerts; shortcuts to Icon list or button/card layouts; QR/barcode needs to QR Code/Barcode; embedded safe external content to Embed; documents to Document embed; and true custom UI to scoped CSS or Custom code only when standard controls are insufficient.

Do not emit isolated controls without a product-design rationale. Combine controls into useful page patterns such as overview dashboard, record detail page, approval experience, or operations board. Use styling capabilities for padding, spacing, grid columns, section backgrounds, border radius, borders/shadows where supported, typography, status colors, icons, responsiveness, and safe custom CSS when needed.

## Visual Design To Implementation Workflow

If the user provides UI mockup images, screenshots, wireframes, or a rich UI design description, first extract a UI implementation spec before generating package JSON. Treat the visual reference as the source for page structure, section hierarchy, Yeeflow control mapping, data bindings, table columns, item templates, actions, style settings, custom CSS, and custom code decisions.

Use `docs/generated-app-plans/ui-implementation-spec-template.md` when available. Do not generate a package from visual references until the spec identifies each major visible region and maps it to supported Yeeflow controls or to documented custom CSS/Custom code when standard controls are insufficient.

When the spec is available, run `scripts/inspect-generated-app-quality.mjs --package <package> --spec <spec.md>` as part of final validation. Treat gaps between the visual spec and package as blockers or manual review warnings depending on confidence.

## Generated Application UI Quality Gate

Before package generation, write a short UI plan covering pages, sections, data sources, controls, displayed fields, and safe spacing. Use the plan to avoid broad unfinished dashboards and to prefer fewer, complete controls.

Generated dashboards and Data List custom forms must have safe left/right padding through a root or near-root page section/container. Aim for 24px to 32px desktop horizontal padding when supported, with smaller responsive padding on narrower surfaces. Major dashboard cards, tables, charts, and form sections should sit inside sections, cards, or containers rather than directly against page edges.

Every dashboard Data table (`type = "data-list"`) must resolve its source list and include nonempty `attrs.listarr` display columns. Use 3 to 5 meaningful columns when fields are available, including the primary title/name field and useful status/date/owner/amount/progress fields. Each column must include `Field` for the actual source field internal name, such as `Text0`, and `FieldName` for the visible label, such as `Vendor Name`. Missing `Field` caused the Vendor Onboarding v1.11 runtime error `Field(s) ,,,,, have been deleted`; v1.12 fixed it and imported successfully. Empty Data table columns, unresolved source lists, missing `Field`, and unresolved display fields are generated-final blockers.

Data-bound controls are not complete until sources and field bindings resolve. Collection/Kanban/Timeline item templates need dynamic fields; progress and steps controls need valid values or bindings; action buttons must reference valid actions. Run `scripts/inspect-generated-ui-quality.mjs` as part of final package validation and do not hand off packages that fail the generated UI quality gate.

Business Travel runtime-practice rule: every generated root app/listset and child list-like resource must emit `ListModel.Flags = 1`. Emit `ListModel.Status = 1` when including Status, keep `ListModel.Type` inside the schema-v2 enum `1`, `16`, `32`, `64`, `128`, `1024`, and keep `Defs`/`Layouts` arrays. Before package handoff, validate that workflow variables are declared before use in controls, summaries, sequence-flow conditions, Set Variable targets, task-assignment expressions, and ContentList mappings. Do not emit placeholder user/group/position IDs into final packages; direct `method="position"` assignees require real numeric position IDs or a user-approved fallback. The fixed Business Travel package is user-proven for import/open/workflow publish only; do not infer workflow execution, routing, data mutation, or true Finance Manager assignment.

Generated-final YAPK app generation must keep package structure, runtime seed data, and quality proof as separate stages. Never embed seed/demo rows under `Childs[].List.Items`, `Childs[].ListDatas`, or `Childs[].List.ListDatas`; emit a companion seed artifact and require explicit post-install live seeding approval. API `Status: 0` from install/import means submitted only, not materialized. Do not claim final success until async materialization and browser runtime proof show the decoded root app opens without `Install failed`, empty Components shell text, model-load errors, or empty planned dashboards after seed.

YAPK-from-scratch hardening addendum: if the requested output is `.yapk` instead of `.yap`, keep the same generated-app correctness gate before encoding/signing. The inner `AppPackageInfo` must pass package, app-creation, graph, workflow publish-readiness, and placeholder checks before Brotli/base64/sign. Signing/verifysign is not a substitute for generated-app validation.

YAPK schema v4 generation rule from Vendor Onboarding v1.13-v1.15, updated for v0.6.18 canonical schema: a generated `.yapk` is not a YAP wrapper. Emit top-level `AppExportPackageInfo`, set `Resource` to base64 Brotli JSON for decoded `AppPackageInfo`, and make `Childs[]` entries use `Fields` rather than YAP `Defs`. Preserve `LongAsString` fields as strings, keep `AppID = 41` where the import rules require it, use API-issued IDs for new generated package/object IDs, omit optional no-portal structures unless a proven portal module is generated, and validate dashboard Data table `Field` source bindings before signing.

## YAPK-First Application Delivery Workflow

For new application generation, default to YAPK delivery. Generate `.yap` only when the user explicitly asks for a YAP file, when the task is specifically about YAP import/debugging, or when a documented fallback requires it. A generated app is not ready just because the package is installable; validate the decoded application, lists, dashboards, forms, actions, visual/template gates, and safety scans before wrapping or handing it off.

When package automation is requested, use OAuth `flowcraft` workspace discovery and ignore local `YEEFLOW_WORKSPACE_ID` for package write target selection. Do not auto-install without explicit confirmation and an explicit user-selected workspace passed with `--selected-workspace-id` or documented user-selected `--workspace-id`. For existing app changes, produce a versioned YAPK and upgrade only when the target app/package is clearly identified and approved. Package API result classes are `success`, `already_installed`, `api_rejected`, and `http_rejected`; an `already_installed` result should lead to upgrade flow, cleanup, or a renamed/new-version package, not blind retries.

Pivot Table runtime-proof data-list rule: if a generated app includes seeded data for dashboards, charts, Pivot Tables, or demos, generate add-ready data lists using the v2 seed/add-ready pattern from `docs/studies/pivot-table-control-runtime-proof.md`. Clone field definitions by target `FieldName`, not by array position, so `FieldName`, `FieldType`, `Type`, and seed-row keys remain aligned. `FIELD_NAME_FIELDTYPE_MISMATCH` is a generated-final blocker because v1 showed that crossed storage metadata can import but leave seeded rows invisible and Add new item failing.

Use this skill for small Yeeflow application packages that combine related data lists and approval forms. New app delivery defaults to `.yapk`; `.yap` remains explicit-only or fallback/debug-scoped. Keep v1 scoped to proven patterns: data lists, custom list forms, lookup relationships, simple approval forms, and `ContentList` persistence.

Approval task form hardening: generated approval workflow task pages used by Assignment Task / `MultiAssignmentTask` or Claim Task / `CandidateTask` must pass strict import/publish readiness before package handoff. Each task node must reference a real task page, set `properties.pagetype = 1`, and mirror the same task page ID across `properties.taskurl`, `properties.taskUrl`, and `properties.TaskUrl`. The referenced task `pageurls[]` entry must be `type = 2` with outer `pagetype = 1`; this entry is the page host. Only the embedded `pageurls[].formdef.pagetype` should be `2` for the approval/task form definition. Missing/null TaskUrl, unresolved task form IDs, task pages with outer `pagetype = 2`, or task formdefs with `formdef.pagetype != 2` are hard errors for generated-final approval packages.

Generated approval forms are published by default unless the user explicitly asks for draft output: set `Data.Forms[].Deployed = true`, `Data.Forms[].Status = 1`, and any present DefResource publish flags (`deployed`, `status`, `published`) to published values. Submit pages should not expose internal routing details, budget owner, finance approver, or decision notes unless requested; task pages may show reviewer routing and decision sections.

For existing-app upgrades, do not reuse `.yap` new-app generation rules blindly. Defer `.yapk` inspection, validation, comparison, signing-boundary guidance, and future generation planning to `yeeflow-yapk-package-generator`. Yeeflow Version management downloads `.yapk` packages for Upgrade application. Product schema defines the wrapper as `AppExportPackageInfo` and describes `Resource` as Brotli-compressed `AppPackageInfo`. Focused runtime proof exists only for narrow mutation paths, so preserve the proof boundary. Until the exact content type passes edit -> encode -> sign -> verify -> runtime upgrade, only inspect/validate wrappers and produce change plans or `.yap` clones; do not claim externally edited app-content `.yapk` packages as broadly valid upgrades.

For component details, also use the installed skills:

- `yeeflow-data-list-generator` for `.ydl` child list structure, fields, views, custom forms, sample data, and lookup fields.
- `yeeflow-approval-form-generator` for approval form Def structure, request/approval pages, lookup controls, workflow graph, and `ContentList` mapping.
- For Knowledge Base-style local list plus dashboard packages, read `references/knowledge-base-app-pattern.md` and also use `yeeflow-dashboard-generator`.

## Standard Workflow

1. Decompose the app requirement into resources, relationships, and stop conditions.
2. Create a `Capability Coverage Plan` before choosing the final resource graph.
3. Create a normalized app spec before generating package JSON.
4. Generate or patch decoded `.yap` Resource/Data JSON only after the graph is clear.
5. Validate every generated child data list with `scripts/validate-ydl-list.js --mode generator --stage final`, using an app/dependency map when lookup relationships require it. App-level validation is not enough.
6. Validate child approval forms where practical.
7. Validate the assembled app with `scripts/validate-yap-package.js`.
8. Validate app relationships with `scripts/validate-yap-graph.js`.
9. Build the wrapper with `scripts/build-yap-wrapper.js` only after validation passes.
10. Report sandbox import checklist and require export-back learning before production-like use.

For package type selection, use `docs/yeeflow-application-package-generation-rules.md` when present.

Never import into Yeeflow or operate the UI unless the user explicitly asks. Preserve large numeric IDs as strings. Redact secret/token/client values.

## API-Backed Import Automation

When the user explicitly asks to automate package delivery after generation, prefer `scripts/yeeflow-package-api-automation.mjs --operation install-yapk` for new YAPK apps and use `--operation import-yap` only for explicit YAP tasks. Package automation ignores local `YEEFLOW_WORKSPACE_ID` and active profile workspace variables for package write targets; the helper must stop with `workspace_selection_required` before request shaping until an API-discovered `flowcraft` workspace is explicitly selected and passed with `--selected-workspace-id` or documented user-selected `--workspace-id`. The helper must run dry-run first and must require `--execute` before calling product import/install/upgrade APIs. Never print API keys, raw package `Resource`, raw `Sign`, decoded payloads, raw API responses, tenant IDs, private URLs, or private IDs. Treat API success as action acceptance proof only; still require runtime app-open and behavior checks before calling the generated app accepted. YAP import remains not proven when the package import endpoint returns non-zero API status; document the redacted failure class and ask for product clarification instead of retrying blindly.

For successful live install/import of a new app, report the selected workspace display name/category/redacted ID preview, result status, safe `ListSetID` when resolved, and the application access link built only from OAuth/session tenant context plus ListSetID: `<tenant-url>/#/list-set/41/<listset-id>`. If either value is missing, report `Application link: unavailable; ListSetID or tenant URL was not safely resolved.` The link is not runtime proof; the user must open it and verify navigation, dashboards, lists, forms, and workflows.

## New Capability Runtime Gate

When implementing a capability learned from exports but not yet focused-runtime-tested, keep the generated package and claims inside the proven boundary. Do not promote export-only schemas into broad generation rules or runtime-ready package behavior.

Before generating with a newly learned feature, decide whether the work is:

- export-proven only
- validator-backed only
- planning-guidance only
- import-proven only
- configuration-visible only
- render-only proven
- partial runtime proof
- runtime-proven for a specific tested host/scope

If generated package import/rendering, workflow execution, app setting rendering, AI/email/external execution, custom code execution, document upload/persistence, user/group membership, permissions, or row mutation is involved, recommend a focused runtime baseline before merge or broad reuse. The baseline should use the smallest possible app, fresh IDs, local validation before build, and runtime testing only after the user requests it. If runtime is deferred, report the feature as export-proven/validator-backed/planning-guidance/import-proven/partial and list the focused runtime follow-up.

Shared data-view generation note: data lists, document libraries, and Form Reports expose list-like views through `Layouts[]`. `Data Lists (1).yap` export-proves data-list view metadata on `Title`, `Type`, `Ext1.Url`, `IsDefault`, and `IsItemPerm`, plus settings in parsed `LayoutView`. Known exported data-list view type codes are `0` list, `999` gallery, `104` kanban, and `100` calendar. Use `scripts/inspect-data-views.mjs` and `docs/studies/data-view-resource-settings.md` before generating advanced views. Treat non-list Type `16`/Type `32` advanced view settings as product-documented until a matching export proves the exact shape.

Data Filter controls note: use `docs/studies/data-filter-controls.md` and `scripts/inspect-data-filter-controls.mjs` before generating dashboard filters. Data Filter controls are reusable across approval forms, data list forms, and dashboard pages at the product level, but the Sales and CRM exports only prove dashboard page usage. Define `page.filterVars[]` before referencing them, bind value-producing filters with `binding = "__filter_" + filterVarId`, wire downstream data-bound controls to filter variables through expression-token arrays, and validate every reference before handoff. Use Search for fulltext paths, Select/Checkbox/Radio for option filters, Range/Check range for numeric bands, Date/Relative period for time filters, Hierarchy for hierarchical sources, and Sorting for preconfigured sort presets. Use `Value change`/default mode for lightweight filters and `Click on apply button` with a valid Apply button for multi/heavy filters. Apply button and Remove filters are special controls, not normal value-producing filters. `docs/studies/data-filter-controls-runtime-proof.md` proves generated dashboard import/open/render plus one Search click-apply and one Radio value-change interaction only; keep Remove filters reset, Hierarchy interaction, exhaustive filter semantics, approval-form usage, and data-list-form usage unproven at runtime. Do not generate unsupported filter types or host contexts without schema proof.

Pivot Table controls note: use `docs/studies/pivot-table-control.md`, `docs/studies/pivot-table-control-runtime-proof.md`, and `scripts/inspect-pivot-table-controls.mjs` before generating multidimensional dashboard analytics. Pivot Table is a Data Analytics control; dashboard usage is export-proven from the CRM sample, Data List form availability is product-understanding-backed, and Approval Forms / Data List Public Forms are not supported hosts. Generate the visible control as `type = "pivot-table"` and pair it with a matching embedded `exts[]` entry using `category = "___Pivot___"`, `key = "PivotTable"`, and `i` equal to the control id. Configure `attr.settings.rows[]`, `columns[]`, and `values[]` from fields on the selected Data List, Document Library, Form Report, or Data Report source; use `COUNT` / `COUNT_DISTINCT` for record counts and `SUM`, `AVG`, `MIN`, or `MAX` only for compatible numeric/currency fields. Date grouping values observed in export are `DAY`, `MONTH`, `QUARTER`, and `YEAR` and must only be used on date/time fields. Pivot Tables can consume Data Filter variables in conditions when the `__filter_<filterVarId>` reference resolves to the host page `filterVars[]`. Style header, body, subtotal, and grand total sections for readability, align numeric values consistently, include runtime-accepted synthetic seed rows when populated analytics proof is required, and validate source, field, aggregation, date-grouping, seed/add-readiness, and filter references before handoff.

Data Analytics chart controls use the same runtime registration boundary as Pivot Table controls. When generating Pie, Column, Bar, Line, Area, or Pivot golden reference templates, the visible control subtree and template provenance are not sufficient. The host layout resource must include the chart/pivot control ID in `Resource.ReportIds[]` and a matching `Resource.exts[]` entry with `category = "___Pivot___"`, key `pie-chart`, `bar-chart`, `line-chart`, or `PivotTable`, `i` equal to the visible control ID, source `AppID`, `ListID`, `ListSetID`, chart type for chart controls, and non-empty `attr.settings.rows[]` plus `attr.settings.values[]` whose field references resolve to the selected source. Missing runtime `exts[]`, missing `ReportIds[]`, unresolved source fields, or template-provenance-only chart wrappers must fail generated-final preflight before signing.

Collection/Kanban action note: use `docs/studies/collection-kanban-actions.md` and `scripts/inspect-collection-kanban-actions.mjs` before generating dashboard Collection or Kanban item actions. `Company Overview (2).yap` export-proves local `attrs.actions[]` with `type = "coll"`, item-template `attrs.control_action` bindings, current item expressions through `ctx = "__ctx_coll"` / `ListDataID`, edit-item form opening through `listitem` / `op_type = "edit"`, delete/update/select patterns, and page-level bulk update/delete actions using temp variables. Generate item selection with declared selected IDs/count temp variables, checked/unchecked icon dynamic display rules, and a bulk toolbar shown only when count is greater than zero. Validate every local action id, page action id, variable reference, source-list field, target layout, and `setdatalist` update field. Runtime execution is user-confirmed for the focused correct-project v2 package only; keep broader generated apps scoped and retest before expanding claims.

Focused runtime package note: `docs/studies/collection-kanban-actions-runtime-proof.md` documents the correct-project generated runtime-proven package for Collection/Kanban item actions. Use it as the smallest current generated pattern for one local Data List, one dashboard, Collection and Kanban controls, item-template action buttons, current item context, selected IDs/count variables, checked/unchecked icon rules, and bulk update/delete actions. The user-confirmed proof covers only the v2 package and tested actions; do not generalize to all Collection action step types, Trigger list workflow, Barcode/NFC/AI assistant, or cross-host approval/data-list form behavior.

Correct-project v2 runtime note: `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` was generated by `generate-collection-kanban-actions-runtime-proof.mjs` from the clean `formreport-clean` repo and user-tested successfully for import, dashboard open, edit/delete/update, selection toggle/count, bulk toolbar, bulk mark completed, and bulk delete.

Data List permissions and notifications note: use `docs/studies/data-list-document-library-permissions-notifications.md` before generating permission-sensitive lists. Export-proven Data List package fields include `ListModel.Perm`, `IsBreakInherit`, `IsItemPerm`, view-level `Layouts[].IsItemPerm`, and notification `RemindRules[]`. Detailed administrator/basic/advanced audience matrices are UI-confirmed but not export-located in the current package, so do not generate those rows as schema-proven. Document Library permissions/notifications are product-documented only until a Type `16` export proves the package shape. Form Reports must not receive Data List / Document Library manage-permission or custom-notification settings.

## Application Capability Planning Checklist

For full app generation, write a `Capability Coverage Plan` before implementation. Use `docs/studies/application-planning-capability-coverage.md` when present. The plan must select relevant capabilities, explicitly exclude irrelevant ones, defer partial or unproven features honestly, and assign each selected capability to the right generator, validator, and runtime-test path.

Consider these areas before package generation:

- Core resources: data lists, approval forms, dashboards, document libraries, reports, follow-up/task lists, master/reference lists, transaction lists, custom forms, and root app pages.
- AI experience: Copilot, quick prompts, local resource tools, connected Agents, image uploads, attachments, and whether Copilot behavior is import-only, config-visible, or runtime-executed.
- AI Agents: reusable Agents, input/output variables, image/file inputs, application-resource access, same-row updates through native `ListDataID`, record create/update/read behavior, draft generation, summaries, scoring, recommendations, and human review.
- Workflow and automation: approval workflows, data-list workflows with `FlowMappings[]`, scheduled workflows with `WorkflowType = 3`, triggers, `QueryData`, `AI`/AI Assistant, `MailTask`/Send email, HTTP/API/resource actions, and execution deferral.
- Document management: Type `16` libraries, canonical `New Document Library` base, default document fields, multiple libraries, generated root folders, custom fields/views/forms, and Doc library controls on dashboards/forms.
- Navigation and shell: custom `LayoutView.sort[]`, `Type: "classes"` groups with `list[]`, resource item labels/icons/no-icon, layout values `default`/`left`/`onheader`/`none`, header `attrs.appearance`, export-proven `height: 46`, `hideTitle: true`, and `Data.AppGroups[]`.
- Permissions and users: app user groups, role-based experiences, permission-sensitive resource exposure, and the current rule that member assignment is not export-proven and must not be generated with real users.
- Integrations: Connections, HTTP API, OAuth, OpenAPI/REST tools, external calls, post-import configuration, credential safety, and whether execution is deferred.
- Runtime and validation: expected import proof, runtime proof, render-only proof, validation-only areas, validators to run, and artifacts/private data that must never be committed.

If a package plan needs real users, departments, locations, or positions, route that lookup through `yeeflow-api-operator` only when local credentials exist and API lookup is authorized. Do not invent org/reference data when the API can safely confirm it, but do not make API access a prerequisite for normal package generation. Avoid embedding private user data in generated packages; use placeholders, empty groups, requester/current-user assignment, or post-import configuration unless the user explicitly approves a narrow safe use.

The plan should include these subsections:

- selected capabilities
- intentionally excluded capabilities
- deferred or unproven capabilities
- runtime test boundary
- safety boundary
- skill and validator dependencies

Before generating a package, self-check:

- Did the plan consider the learned capability set without overusing irrelevant capabilities?
- Did it mark partial or unproven capabilities honestly?
- Did it assign each selected capability to the right specialized skill?
- Did it include validation and runtime-test boundaries?
- Did it avoid real users, emails, tenant IDs, raw exports, decoded payloads, credentials, tokens, private files, and generated package artifacts in commit scope?

## Supported Full Application Package Shape

For full application generation, use the proven app-level structures below as building blocks, but do not restrict the output to a minimal v1 when the plan requires more. A complete planned app may include:

- root app/listset shell
- child data lists in `Data.Childs[]`
- data-list fields, views, sample records, and custom forms
- internal lookup relationships between lists
- one or more simple approval forms in `Data.Forms[]`
- export-proven Form Report resources in `Data.FormNewReports[]` plus Type `32` child resources when using `yeeflow-form-report-generator`
- approval form lookup controls
- lookup additional field mappings
- approval workflow `ContentList` create/update actions targeting included lists
- workflow action validation against the normalized node/action configuration reference
- generated multi-type approval/list fields, including text, number, radio/dropdown, switch, and conditional display
- simple root navigation and one Type `103` app page

## Form Report Resources

Use `yeeflow-form-report-generator` when an app needs Form Reports. `AI Training-2 (1).yap` export-proves Form Report as an app-level resource with `Data.FormNewReports[]`, a matching `Data.Childs[]` child resource where `ListModel.Type = 32`, and a required approval-form source via `DefKey` -> `Data.Forms[].Key`.

Generation guidance:

- Generate Form Reports only after the source approval form exists.
- One approval form may have multiple Form Reports.
- Do not generate a standalone Form Report without an approval source.
- Do not attach workflows, public edit/create forms, or direct item mutation behavior to Form Reports.
- Fields must come from approval variables, system fields, or the selected one sub-list fields.
- Keep report field keys unique and warn on duplicate display names.
- Use `Settings.SubListID = ""`/empty for no selected sub-list; use one `vlist_<variableId>` value for one selected sub-list.
- Treat selected-sub-list row multiplication, row-click detail behavior, Excel export execution, and Form Report as a dashboard/lookup/data-table data source as runtime-sensitive until a focused baseline proves them.

Generated child data lists must also be valid as standalone extracted list definitions:

- include required list type metadata such as `ListModel.ListType` or a wrapper `MainListType`
- keep `FieldName` and `InternalName` unique
- keep `DisplayName` unique inside each data list, or treat duplicates as a materialization-risk blocker for generated packages
- allocate `FieldID` values from a global app-level allocator; never reuse the same FieldID range across multiple child lists
- ensure every field's `ListID` equals the parent child-list `ListID` after any FieldID remapping
- resolve local lookup target lists and display fields
- provide valid referenced sample rows for lookup sample values
- include usable master/reference sample data when approval forms or dashboards depend on those lists
- include current-standard `Edit Item` and `View Item` custom forms; map New/Edit to `Edit Item` and View to `View Item`

## YAP App Materialization Rules

Generated `.yap` packages must pass materialization inspection before runtime import:

- Every `ListID` must be unique.
- Every `FieldID` must be unique across the whole application, not only inside each list.
- Every `field.ListID` must equal the parent data-list `ListID`.
- Every `FieldName`, `InternalName`, and `DisplayName` must be unique inside its own data list.
- Preserve real baseline `TenantID`, `CreatedBy`, and `ModifiedBy`; do not remap them into the generated ID family and do not include them in `Resource.ReplaceIds`.
- Build `ReplaceIds` from generated app-resource IDs only.
- Keep all numeric-looking generated IDs within signed `System.Int64` range (`<= 9223372036854775807`). Yeeflow import/materialization parses fields such as child-list `LayoutID` as `System.Int64`; 20-digit IDs such as `73221000000000001001` fail import.
- When generating app-contained AI Agent or Copilot records in `OtherModules Type = "Agents"`, set top-level `Publisher: 0` by default. `Publisher: null` caused generated AI-resource app import failure; the regenerated Asia Tech visitor Copilot package imported after changing Publisher to `0`.
- Root Type `103` dashboard/page layout ownership must connect to the root app/ListSet `ListID`, and root navigation must reference existing packaged resources.
- Run `scripts/inspect-yap-materialization.mjs` before runtime import.
- If app materialization fails, stop and fix the app shell/resource linkage before testing custom code controls or workflow behavior.

## Generated App UI/UX Standard

Use `docs/yeeflow-application-design-system.md` as the master reusable generated-app design system when present in the active workspace. Use `docs/yeeflow-application-ui-ux-standards.md`, `docs/yeeflow-application-layout-standards.md`, `docs/yeeflow-application-style-token-standards.md`, `docs/yeeflow-dashboard-ui-ux-patterns.md`, `docs/yeeflow-data-list-ui-ux-patterns.md`, and `docs/yeeflow-approval-form-ui-ux-patterns.md` as supporting references.

The first official reference export is `UI and UX design (1).yap`. It proves this native shell:

- dashboard pages set `attrs.hideHeaderAll = true`, page padding to `--sp--s0` on all sides, and use `Main` -> `Content` containers named through `nv_label`
- generated data lists include `Edit Item` and `View Item` custom forms; New/Edit map to `Edit Item`, View maps to `View Item`
- custom list forms use `attrs.container.cw = "2"`, zero padding, and `Main` -> `Content`
- approval form pages use `attrs.container.cw = "2"`, zero padding, `Main` -> `Content`, with business controls in `Form body` and workflow controls in `Form bottom`
- default approval forms include both `workflowControlPanel` and `workflowHistory` in `Form bottom` unless the user explicitly asks to omit them

Treat validator UI/UX standard findings as warnings until the first generated UI/UX standard package has passed runtime import/open and export-back comparison.

Runtime update: `Design System Request Tracker DSX` proved the generated design-system package pattern through import, dashboard render, Requests list query, Edit/View custom forms, approval form publish, submission form render, reviewer approval routing, approval completion, and workflow-created list record. Use its dashboard `LayoutInResources[0].ID = RefId = LayoutID` pattern for generated root app dashboards with embedded page JSON. Expect imported app-level approval forms to require publishing in Yeeflow Form Builder before submit/approve runtime testing.

Use `docs/yeeflow-root-style-token-reference.md` as the root style/design-token reference. Generated apps should use Yeeflow-native root style tokens such as `--c--primary`, `--c--success`, `--c--warning`, `--c--danger`, `--c--neutral-light-active`, `--fs--base`, and `--sp--s200` where supported. Avoid arbitrary custom colors and do not inject the full root stylesheet into generated apps. Do not require token references when a real Yeeflow export stores resolved hex values.

Generated apps should apply the Yeeflow Application Design System by default: use `Main` / `Content` containers, meaningful `nv_label` names, token-aligned colors and spacing, Edit/View custom forms for generated data lists, `Form body` / `Form bottom` approval pages, and clear dashboard sections plus Collection naming. Treat design-system validator findings as warnings until runtime import/open/export-back proof exists for the specific generated package.

Global page background rule: when any generated dashboard, data-list custom form, approval submission page, or approval task page needs a full-page background color, set it on the page/form background setting, not on `Main`. `Main` is a structural layout container. Only section/card/header-specific backgrounds should live on those specific containers.

Approval-form UI quality update: when the workspace includes `docs/yeeflow-form-design-quality-rules.md`, apply it to app-level approval forms. Rich request forms should set page-level background on `formdef.attrs.background`, add a `Form header` for request-summary panels, generate corrected inline text/icon controls, use the Text Style Sample native Text shape (`heading` controls, `[null, token]` typography, plain string `heads.color`), use square icon badge wrappers, organize normal fields with two-column `flex_grid` controls, full-span long controls, and use native `calculated` controls for formula fields where the expression is known.

Layout quality hardening: Grid/flex_grid controls used only to place child controls should turn captions off with `displayLabel: [null, false]` unless the user explicitly asks for a visible grid title. Use flex_grid for aligned fields, but use container/card blocks with row direction and spacing/gap for route summaries, KPI/status blocks, and horizontal business-context panels.

CAPEX runtime baseline: `IT Hardware CAPEX Request v4 Text Standard` was generated by `generate-it-hardware-capex-request-v3.mjs` after the Runtime V2 design study and Text Style Sample study. The package imported, opened, rendered the approval form, and the generated Text control Typography and Text shadow designer popups opened successfully. Treat `docs/generated-it-hardware-capex-request-text-standard-baseline.md`, `docs/it-hardware-capex-request-runtime-v2-ui-study.md`, and `docs/yeeflow-text-control-generation-standards.md` as the current rich approval-form UI baseline before generating similar business applications.

Approval control anatomy update: when the workspace includes `docs/ai-training-approval-form-control-study.md`, use that study before adding broad native approval controls to an app package. It documents the export-backed variable/control binding model for `input`, `textarea`, `richtext`, choices, switches, numeric/date controls, file/image upload, user/department/location/cost center/metadata pickers, lookup, lookup-list, sublist/listref, data-list display, tabs, and action buttons. Do not promote those advanced controls into a generated `.yap` without resolved local app/list dependencies, fresh IDs, validator review, and focused runtime proof.

Approval Form Controls Test v2 runtime update: app-level packages can now use the proven advanced-input batch when scoped and validated: `percent`, `time`, `hyperlink`, `rate`, and `calculated`. The v2 package imported, opened, rendered the form, submitted, opened the reviewer task, approved, and created the target `ContentList` record. Keep `daterange` in partial-proof status until both mapped date fields are exposed and verified in a generated list view.

Approval Form Controls Test v6 runtime update: app-level packages can now use internal packaged single-select approval-form `lookup` controls and workflow-form `list` / `listref` controls when scoped and validated. The v6 package imported, opened source and target lists without `datas/query` 400, selected a packaged lookup record, populated readonly fields via `attrs.addition[]`, added/edited a list row, submitted, opened the reviewer task, approved, and created the target `ContentList` record. Do not persist raw lookup variables into plain text fields when the expected value is readable display text: v6 proved that this stores the internal local row ID. Use lookup addition/autofill variables or explicit summary variables for readable persistence. Direct child-row-to-data-list persistence for list/listref remains deferred; use a text summary or a separately modeled child list until export-backed proof exists.

Sublist summary workflow runtime update: `Expression Sublist Summary Workflow Test v1` proved app-level generation for listref row calculations, list summary display, summary-to-variable binding, and workflow routing from a summary-bound numeric variable. It imported, opened, rendered row-level `Sub Total = Quantity * Unit Price`, displayed Quantity Sum / Unit Price Average / Sub Total Sum, bound Sub Total Sum to `TotalAmount`, routed `USD 17.00` to Line Manager Approval, routed `USD 6000.00` to Department Manager Approval, completed both approvals, and persisted readable ContentList rows. For v1 app packages, branch-specific ContentList nodes are acceptable for persisting route labels after the branch; direct child-row persistence remains deferred.

Employee Family Implant patch learning: when requirements allow multiple products/services/items on one request, model those selections as a workflow-form `list` / `listref` instead of single top-level product fields. Put the product lookup inside the row, autofill row product name/type/unit price into readonly row fields, calculate row subtotal with `variable_ctx` current-object tokens, bind subtotal summary to a top-level total with `attrs["list-fields-summary"]`, and use that top-level total for workflow routing, quota checks, and `ContentList` persistence. Persist a readable product summary text variable until direct child-row persistence is runtime-proven for the target app.

Employee Family Implant Test export update: for requester/applicant forms, prefer a required applicant identity control with `attrs.default = "currentUser"` and `value = "CurrentUser"` over a duplicate page-load Set variable default. Snapshot actions should start from the applicant variable and use `getUserAttr(RequesterApplicant, ...)`; Current User is only the control default source. Submit-time quota validation should be wired through `formdef.formAction.onSubmit`, call the reusable quota-check action first, and then conditionally submit. Conditional warning/confirm/check steps before submit usually need step-level `continue: true` (`Continue next step when condition is not met`) so the valid path reaches the submit step. Treat recursive `otheraction` self-calls as generator errors.

Sublist summary binding update: the manually reselected Product Selection summary in `Employee & Family Implant Application Management_Test.yap` still exports as `{ "prefix": "__variables_", "value": "TotalApplicationAmount" }`. Do not invent extra name/label/type metadata. Instead validate that the target variable exists and is numeric, the source row field exists and is numeric, and runtime tests blur/commit row edits before asserting the summary-bound total. A later comparison export, `Implant Application Request (1).ywf`, proved an import-time FlowKey collision: generated FlowKey `EFI` was replaced inside the JSON property name `prefix`, producing `pr<runtimeFlowKey>x` and breaking summary-to-variable binding, while a designer-created comparison sublist kept `prefix` and worked. Avoid FlowKeys/form keys that are substrings of reserved JSON property names such as `prefix`; inspect generated/wrapped/exported forms for corrupted summary binding keys before runtime claims. For policy-critical form actions such as quota checks, submit guards, workflow amount routing, and persistence, add an explicit preflight set-variable step that recalculates the top-level total with `arraySum(<ListVariableId>, "<SubtotalFieldId>", [], [])`; use this recalculated workflow variable even when summary binding is also present.

Expression generation update: when a package includes calculated controls, dynamic display rules, custom validation rules, lookup/data filters, workflow transition conditions, workflow action conditions, default values, request numbers, or subtotal/total/date/string formulas, use `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, `yeeflow-expression-utils.js`, `docs/yeeflow-expression-editor-ui-contexts.md`, and the `yeeflow-expression-generator` skill. Generate Yeeflow expression-token arrays, not JavaScript formulas. Validate expressions before package build and keep unknown functions/operators as stop conditions for generated final packages. Use enriched business-scenario metadata for function selection, but do not generate UI-observed metadata-pending functions such as `addWorkDays` or `addWorkHours`.

For purchase/order-style approvals with line items, prefer native list summary binding over hand-built top-level total formulas. Bind subtotal sum to a top-level number variable and use that variable for ContentList persistence, dynamic display, validation, and workflow branch conditions.

Form Actions Phase 1 update: app-level approval packages may include native form actions only when using the export-backed Phase 1 patterns from `docs/form-actions-phase-1-study.md`. Keep form actions distinct from workflow graph actions. Use form actions for page initialization, temp UI state, Set variable defaults, and confirmation dialogs. Wire action buttons with `attrs.control_action`, page load with `formdef.formAction.onLoad`, and validate that every referenced action exists in `formdef.actions[]`. Do not promote `listitem` form action steps or dashboard/data-list form actions to generated baselines until a focused runtime test proves them.

Form Actions Phase 2 update: app-level approval packages can use Query data and Submit form actions with the runtime-proven generated patterns from `docs/generated-form-actions-phase-2-query-submit-test-v1-baseline.md`, `docs/form-actions-phase-2-query-data-filter-patch-study.md`, `docs/yeeflow-form-action-query-data-step-rules.md`, and `docs/yeeflow-form-action-submit-step-rules.md`. Query multiple can populate form list variables or temp collections; query single can map fields to workflow variables; counts can be stored in temp variables and copied to workflow variables; Query data filters use `attrs.querydata_filters` plural; variable/calculated filter right operands use expression-token arrays with `showCus: false`, while literal values use primitives with direct-value mode. Do not generate `<input ...>` expression-button HTML strings inside `querydata_filters[].right`. `arraySum` can aggregate a temp query collection. The collection display function token is `JSONStringfy`; `vLookup` is label-observed only and deferred. Submit form is `type: "submit"`; Save changes uses `attrs.submitType = "3"`. Do not generate `arraySub`.

Workflow transition condition update: `Implant Application Request (4).ywf` proves latest SequenceFlow `conditioninfo[]` rows support independent operand modes. Use direct-selector `left.type = 1` and direct/static `right.type = 0` for simple routes such as `ApplicationType == Family`; use `type = 2` on the side that needs expression editor for date tenure, numeric thresholds, dynamic cycle comparisons, or expression-to-expression routes. Prefer these wrapper objects over legacy HTML expression-button strings for newly generated workflow transitions.

User/profile expression runtime update: app-level approval packages can use `getUserAttr`, `getOrgAttr`, and `getLocAttr` for current-user profile summaries after `Expression User Profile Test v1`. The generated package imported, opened, rendered user/profile expressions on submission and task pages, completed approval, and created a readable ContentList record. Use the exact application current-user token shape, descriptor-object attribute parameters, fallback arrays, and `getOrgAttr` for department/organization values. Location and Boarding Date remain tenant-data dependent when the current user profile lacks those attributes.

Navigation contrast rule: when root `LayoutView.attrs.appearance` defines a header background and text color, generated apps should invert that pair for `LayoutView.attrs["navigator-menu"]`. Use the header text color as the navigator background and the header background as the navigator text/icon color. For the standard shell, use `appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" }` and `"navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" }`.

Theme color rule: generated `Data.AppThemes[].Config.neutral.lightmodel` should be `"Luminance"`, not `"Lightness"`.

Keep these out of a generated package only when they are not in the app plan, are explicitly deferred, or require a focused research/runtime-proof branch before safe generation:

- data reports and form reports
- AI Agents, Copilots, Connections, Knowledges
- document generation and templates
- external HTTP/API actions
- complex list workflows or scheduled workflows

## Scheduled Workflow Generation Boundary

`AI Agent and Copilot Local Resource Baseline8.yap` proves Scheduled Workflow app resources are `Data.Forms[]` entries with `WorkflowType = 3`, `ListID = 0`, JSON-string `Settings`, and JSON-string `DefResource`.

`Scheduled Workflow Safe Runtime Baseline` proves a generated import/open/designer baseline when the package uses one harmless local list, one local `Email generation` Agent, one Scheduled Workflow, a far-future non-deployed weekly schedule, `QueryData -> AI -> MailTask`, and a reserved safe test recipient placeholder. The Codex-observed runtime pass proved import, app open, local list render, Scheduled Workflow listing/detail, recurrence render, variables render, designer open, and non-executing `QueryData`, `AI`, and `MailTask` configuration panels. User-confirmed function test passed; exact execution scope not yet documented.

For generated Scheduled Workflow packages, validate schedule `Settings` (`TimeZone`, `Times[]`, `StartDate`, `Frequency`, `Interval`, optional `Values[]`, optional `IsWorkday`), workflow variables, `QueryData` list references, `AI` Agent references, and `MailTask` recipient safety. Do not generate a package that can send real email or call live AI automatically during import/open testing. Do not claim schedule trigger execution, manual run behavior, email delivery, AI Assistant execution, or workflow-triggered AI Agent execution from the safe runtime baseline unless the exact user-confirmed test scope is documented.

Data-list workflow AI update: `Spark & AI (1).yap` proves list/process workflows (`WorkflowType = 1`) can register against a host data list through `FlowMappings[]` with `Setting.NewTrigger = true` and call an app-contained Agent from a workflow `AI` node. The proven current-row mapping pattern passes an `icon-upload` field into Agent input `type = "img"` and passes native `ListDataID` into a text input so the Agent can update the same row through an application-resource access tool. Generated app packages may model this only when the host list, workflow registration, Agent, and tool-scoped target lists all exist locally and runtime execution remains safely disabled until sandbox proof.

Asia Tech visitor Copilot import learning: app-contained Agents/Copilot plus a data-list workflow imported successfully after two materialization fixes: generated child-list `LayoutID` values were kept inside `System.Int64`, and every AI Agent/Copilot resource used `Publisher: 0` instead of `null`. This proves import acceptance only; Copilot chat, Agent execution, image extraction, workflow execution, and row mutation still require controlled runtime tests.

Asia Tech visitor Copilot post-import learning: list workflow designer opening requires export-like DefResource metadata. Generate `pageurls: []`, `variables.basic/listref/filter` arrays, `flowPage: []`, `graphposition`, `graphzoom`, `graphver`, childshape `id` plus `resourceid`, node `position`, and SequenceFlow source/target `id` plus `resourceid`. The simplified graph shape imported but the designer failed with `Cannot read properties of undefined (reading 'find')`.

Asia Tech visitor Copilot trigger-condition learning: for data-list Add Item / new-item triggers, register the trigger through the host list `FlowMappings[]` row using `Setting = {"NewTrigger": true}` and `FieldName = null`. Keep `Data.Forms[].Settings = null` and `Data.Forms[].Deployed = true`. Do not bind `FlowMappings.FieldName` to a normal list field for a new-item trigger; doing so can make the frontend show an empty trigger condition and prevent the workflow designer from opening. Use flow-status `FieldName` only when a separate export-proven flow-status condition is intentionally generated.

For app-contained AI Agent/Copilot Access application resources tools, generate compact resource permissions: `resources.dataLists.items[] = [{ id: <ListID>, permissions: <bitmask> }]`. Permission bits are create/add = `1`, update/edit = `2`, delete = `4`, read/view = `8`; combine with bitwise OR, for example read/create/update = `11`. Do not emit verbose `AppID/ListID/ListSetID/Title` resource entries or string permission arrays.

## Document Library Resource Rules

Use these only after the document-library study docs and validators are present in the active workspace. `Projects Center.yap` proved that Yeeflow Document Library is a first-class app child resource, similar to a data list but not identical.

- Generate document libraries with `ListModel.Type = 16`.
- Keep the normal child-resource envelope: `ListModel`, `Defs`, `Layouts`, `ListDatas`, `FlowMappings`, `PublicForms`, and `RemindRules`.
- Link the library from root app navigation with `Type = 16` for mixed/richer apps. The focused `Document Library Sample.yap` proves document-library-only apps may omit root pages and navigation, using root `LayoutView = {"sortVer":1}`.
- Set top-level wrapper `Resource.SimplePortal = null` for generated document-library `.yap` packages. Both known-good document-library exports use `null`; generated `[]` wrappers failed at Yeeflow create.
- Use `CustomType = "ListSite_<root app ListID>"` for app-owned libraries.
- Preserve the default document fields: `Title` Name, `Bigint1` ParentID, `Text1` Type, `Bigint2` FileSize/Size, `Text2` Extension, `Text3` UniqueName, and `Text4` Upload File.
- `Text4` is export-backed as `FieldType = "Text"` plus `Type = "file-upload"` with `Rules.isLabrary = true`; do not invent an unproven Attachment field schema.
- Do not apply normal generated data-list `Title.Status = 0` rules to document libraries; studied document libraries keep `Title` native/system/indexed but use `Status = 1`.
- Support simple custom fields and Type `0` views using existing data-list rules where compatible. The `Enterprise Document Center` v2 runtime pass accepted multiple Type `16` libraries with simple custom fields and configured views.
- Root-level generated folder rows are runtime-proven when using the export-backed shape: put rows in `ListDatas`, set `ListDataID` to the object key, `Title` to the folder name, `Bigint1 = "0"`, `Text1 = "folder"`, `Bigint2 = ""`, `Text2 = ""`, `Text3 = "0_<lowercase folder title>"`, omit `Text4`, include blank generated custom-field values, and include folder IDs in `ReplaceIds`.
- Keep generated folders root-level unless nested folder behavior is separately export-backed and runtime-tested.
- For a minimal newly-created library baseline, use the runtime-proven `New Document Library` resource shape from `Document Library Sample.yap`: default Type `0` view `LayoutView = ""`, one unassigned `New file` form, no `ListModel.LayoutView` add/edit/view mapping, and no uploaded rows. Do not use the earlier generated `Baseline Documents` experiment as the base definition.
- Dashboard Doc library controls are export-proven in `Enterprise Document Center Folders Runtime.yap`. Generate them with `type = "document-library"` in a Type `103` dashboard page resource, target a Type `16` library through `attrs.data.list`, and target a root folder through `attrs.data.folder.path = "0/<folder ListDataID>"`. Caption/search/add true settings are export-proven when `attrs.caption.layout` points to the target library `New file` form. The form-host study proved document-library custom-form hosting for a root-bound control and disabled search/add settings; approval-form hosting is partial because controls rendered in Form Builder preview but the live request form still needs a fresh import/publish proof after adding a required task assignee. Data-list custom-form hosting remains validation-only until a reachable imported data-list form proves it. Keep dynamic folder paths unclaimed until runtime-tested.
- Do not fake uploaded document rows or private document payloads in baseline packages.
- Do not claim nested folder or upload runtime proof until Yeeflow import/open/upload/persistence behavior is tested.

## Hard Stop Conditions

Stop before final `.yap` build if any of these are true:

- unresolved resource graph
- any generated child data list fails standalone `validate-ydl-list`
- duplicate data-list field `FieldName` or `InternalName`
- duplicate data-list field `DisplayName` in a generated final package unless explicitly accepted as a materialization risk
- duplicate `FieldID` anywhere across the generated `.yap`
- any field whose `ListID` does not match its parent data-list `ListID`
- generated fake-ID remapping of `TenantID`, `CreatedBy`, or `ModifiedBy`
- any generated numeric-looking ID exceeds `9223372036854775807`
- generated app-contained AI Agent/Copilot resource has missing, null, empty, or non-numeric `Publisher`
- generated main/child lists are missing required list type metadata
- missing lookup target list or display/search field
- lookup target list, display field, dependency map, or sample lookup target row is unresolved
- a form lookup depends on a missing or empty master/reference list without an explicit external-data plan
- missing `ContentList` target list or target field
- invalid or incomplete root app shell
- missing root navigation or app page
- unresolved AI/connection/knowledge/document/external resources
- workflow action properties do not satisfy `workflow-action-configurations.normalized.json`
- expression formulas or conditions do not satisfy the normalized expression references
- placeholders remain in final mode
- validators fail
- sensitive credential-like resources would be copied
- production use is requested without sandbox import/export-back proof

## Current Advanced Baseline

Use Visitor Access Management v11 as the current advanced generated `.yap` baseline for small app packages.

Confirmed v11 settings:

- fresh `216...` local ID family
- fresh FlowKey/form key `VBB`
- `Data.Forms[].ListID = 0`
- `ProcModelID` carries the approval process ID
- app imported and passed runtime testing
- package, graph, approval form, and wrapper round-trip validations passed

Proven v11 field/control types:

- text/input
- number/input_number
- single select radio/dropdown using `radio` control plus `attrs.displayStyle = "dropdown"`
- switch/boolean
- conditional display using target control `attrs.control_display[]`

Proven v11 storage and `ContentList` mappings:

| Business field | Variable | Target |
| --- | --- | --- |
| Visitor Email | `VisitorEmail` | `Text13` |
| Visitor Phone | `VisitorPhone` | `Text14` |
| Number of Visitors | `NumberofVisitors` | `Decimal1` |
| Access Type | `AccessType` | `Text15` |
| Requires Escort | `RequiresEscort` | `Bit1` |

Sample value shapes:

- Decimal: numeric values
- choice/dropdown: selected option text
- data-list Bit/switch: `"1"` or `"0"`
- approval switch variable/control: boolean `true` or `false`

`EscortUser` is proven as a form-only conditional field shown when `RequiresEscort == true`; it is not persisted in v11.

## Child Data List Title Field Rule

HARD RULE: every generated child data list must preserve `FieldName: "Title"` as Yeeflow's native primary/display field.

Required metadata:

- `Status: 0`
- `IsSystem: true`
- `IsIndex: true`

Do not generate `Title` as an ordinary custom business field. Heep Hong IT eWorkflow Option A v7 proved that `Title` with `Status: 1`, `IsSystem: false`, and `IsIndex: false` can import and render list metadata while causing `api/crafts/datas/{AppID}/{ListID}/query` to fail with HTTP `400`. Option A v8 restored the native `Title` metadata and fixed the data-grid query.

Business labels such as `Request No.`, `Name`, `Equipment Name`, or `Center / Department Name` may be displayed on `Title`, but the underlying metadata must remain native/system/indexed. Use `Text1`, `Text2`, etc. for additional business fields.

## Root App Shell Rules

For generated packages, the root app shell is mandatory. Use the v5 baseline rules:

- top-level wrapper `Title`, `Description`, and FontAwesome JSON-string `IconUrl`
- `Resource.MainListType = 1024`
- root `Data.Item.ListModel.Type = 1024`
- root `CustomType = ""`
- root `Perm = 0`
- root `WorkspaceID` present
- root `LayoutView` navigation populated
- `Data.AppTags`, `Data.AppMetadatas`, and `Data.AppComponents` arrays present
- `Data.AppThemes` non-empty
- root `CreatedBy` and `ModifiedBy` populated

For root Type `103` app pages:

- include the page `LayoutID` in `ReplaceIds`
- for generated root dashboard pages with embedded page JSON, use the dashboard `LayoutID` for `LayoutInResources[0].ID` and `RefId`; Design System Request Tracker v1 proved that a separate generated resource ID can import but render as an empty designer placeholder
- for data-list persistence, prefer Text fallback for requester/user values unless a focused native data-list identity/user field export proves the persisted shape; approval forms may still use identity-picker/current-user values for workflow assignment when that pattern is proven
- Type `103` `LayoutInResources` resource IDs are excluded from `ReplaceIds`
- `LayoutInResources[0].Resource` must contain valid page JSON

Minimal dashboard-only exception: `Test Dashboard Only.yap` and the generated `generated-dashboard-minimal-v1.yap` runtime baseline prove that an empty dashboard shell can use `LayoutInResources: []`, `Ext2: "{\"src\":true}"`, and only two `ReplaceIds` (root app/ListSet ID plus dashboard `LayoutID`). Use `yeeflow-dashboard-generator` before generating dashboard-specific packages.

Read `references/baseline-department-access-management-v5.md` before changing app shell or Type `103` page logic.

## App-Level Approval Form Rules

- `Data.Forms[].ListID` must be numeric `0` for app-level approval forms.
- `ProcModelID` carries the generated approval process ID and should be included in `ReplaceIds`.
- Root navigation Type `105` should point to the form key.
- Use a fresh FlowKey/form key for every generated import-test package.
- Do not reuse a FlowKey/form key from a previously imported generated app unless explicitly testing update behavior.
- For generated YAP approval/form workspaces such as `multi_column_form_workspace_shell`, use export-style `DefResource.pageurls[].formdef.children`, not `formdef.controls`; align `FormKeys`, `Data.Forms[].Key`, Type `105` navigation, and `DefResource.defkey/key`; include StartNoneEvent -> SequenceFlow -> EndNoneEvent; hide the form header, set content width Full width, and set padding `0`.
- The designer-load-proven Service Desk YAP baseline uses lowercase `list`, `container`, `heading`, and `icon` controls. Do not generate YAP approval workspace `collection` or `dynamic-field` approximations unless their exact shape is export-proven for that form surface and marked/validated as export-proven; otherwise use static designer-safe ticket cards/detail headings and report dynamic selected-record behavior as unproven.
- Keep child `ListDatas` as record-ID-keyed objects rather than `ListDatas.Datas`; every sample row key must resolve to a field in `Defs[]`; keep field `Rules` as stringified JSON; preserve runtime-safe native `Title` and Service Desk-style business field numbering from `Text2` onward.
- Run `scripts/inspect-yap-form-workspace-generation.mjs` before import or handoff. Hard `YAP_*` findings block import. `YAP_NATIVE_TITLE_SCHEMA_CONFLICT` is warning-only when native `Title` is runtime-safe. API `Status=0` with `Completed=false` is queued import acceptance only, not proof that async import or the form designer succeeded.

## Benefit / Quota Usage App Rules

When an application tracks benefit quota, annual entitlement, family usage, budget usage, or similar consumption:

- generate a persistent usage/transaction list when the business needs audit, reporting, or quota checks
- include applicant identifier, applicant name, readable cycle/year, numeric cycle number when applicable, amount, usage status, source application number, and notes
- if the quota cycle is employee anniversary year or another non-calendar cycle, include a numeric cycle field and query usage by applicant + numeric cycle + active/occupied status
- if the business confirms quota is occupied on submission, create the usage record at submission/start of workflow, not only after final approval
- include in-progress/occupied and approved/confirmed statuses in quota checks; exclude released/rejected statuses
- update the usage record to approved/confirmed on final approval and released/rejected on rejection when `ContentList edit/remove` is runtime-safe
- store a correlation key such as application number, request instance key, form instance id, or workflow instance id so later update/release actions can target the matching usage row
- if edit/remove is not yet proven, document a manual HR release fallback and create a focused learning task; do not leave the usage list unused

## Workflow Branch Coverage Rules

When generating approval workflows:

- every multi-branch review node must cover all meaningful outcomes and policy-routing values
- variables used for branch conditions must be required, auto-derived, or backed by fallback routes
- yes/no flags that drive routing should cover `Yes`, `No`, empty/null, and unexpected values
- route empty or unexpected policy values to specialist review/fallback rather than a dead end
- validate that normal, exception, rejected, and fallback paths all reach an end or persistence node

## Generated List Runtime Purpose Rule

Every generated data list should have at least one active purpose:

- maintained as master/config data and read by form/workflow/dashboard logic
- written as transaction/usage/audit data by workflow or ContentList
- read for quota, routing, reporting, search, dashboard, or export

Do not include unused configuration lists. If a list is only intended for a future phase, mark it deferred and omit it unless the user explicitly asks for a placeholder.
- use `arraySum` over the query result collection for used amount
- use the top-level total variable from sublist summaries/recalculation for quota checks, workflow routing, and ContentList persistence
- preserve safe FlowKey rules so summary binding keys such as `prefix` cannot be corrupted by import replacement

## ReplaceIds And Lookup Sample Rules

Generated YAP packages must rebuild `Resource.ReplaceIds` from the final decoded package after every generation, repair, ID remap, baseline copy, or form/workflow mutation. Do not copy `ReplaceIds` from a successful baseline package and assume it still applies. The broad Service Desk form-workspace YAP runtime test proved that stale `ReplaceIds` can pass local shape checks and API queue acceptance, then fail during Yeeflow's async import/materialization step.

Local app graph IDs should be included in `Resource.ReplaceIds`:

- root app/listset ID
- child list IDs
- field IDs
- view/custom form layout IDs
- data-list custom form resource IDs where the data-list rule requires it
- approval form/process IDs, workflow shape/resource IDs, and form keys
- app group IDs when generated
- local sample record `ListDataID` values
- root Type `103` page `LayoutID`

Generated-final packages must fail validation if any local root app, child list, field, layout, form/process, workflow shape, app group, or local sample record ID is absent from `Resource.ReplaceIds`. After the package is serialized, run the package validator in generator/final mode and treat `REPLACEIDS_EMPTY`, `LOCAL_ID_NOT_IN_REPLACEIDS`, and truncated missing-ID findings as blockers.

Do not include external dependency IDs in `ReplaceIds`.

For standalone `.ydl` with external lookup sample data, external target record IDs must be excluded from the dependent package `ReplaceIds`.

For app-level `.yap` with internal lookup sample data:

- target sample record IDs are local package IDs
- include target sample record IDs in `ReplaceIds`
- dependent sample lookup values may reference those local target sample IDs as plain strings
- export-back from v5 proved Yeeflow remaps target records and dependent lookup values consistently

If grid display appears blank but export-back lookup values match exported target records, classify it as a runtime display/index/cache issue unless the item form lookup value or manually edited rows are also broken.

## ID And Expansion Strategy

- Every generated `.yap` import-test package needs a fresh local ID family.
- Do not reuse ID families from previously imported generated apps, even if the earlier import failed.
- Start from a known-good baseline.
- Add one field/change at a time for unproven field/control types.
- Multi-field expansion is allowed only after the underlying field/control types are proven by export-backed examples and generated import tests.
- Preserve proven field slots unless deliberately testing a new slot.

## Validation Commands

Use these from the project root or adapt paths to the current workspace:

```bash
node scripts/validate-yap-package.js ./app-def.json --mode generator --stage final
node scripts/validate-yap-graph.js ./app-def.json --mode generator --stage final --json ./app-graph.json --md ./app-graph.md
node scripts/validate-ywf-def.js ./extracted-approval-form-def.json --mode final
node scripts/validate-ydl-list.js ./extracted-child-list.json --mode generator --stage final
node scripts/build-yap-wrapper.js ./app-def.json ./app.yap --title "App Name" --description "Description"
node scripts/validate-yapk-package.js "./Existing App Version.yapk" --baseline "./Baseline Version.yapk"
```

When a package includes Custom Code controls, also run:

```bash
node scripts/inspect-yap-custom-code-controls.mjs ./app.yap --out ./custom-code-control-inspection.json
```

For real historical exports, use compatibility mode:

```bash
node scripts/validate-yap-package.js "./Existing App.yap" --mode compatibility
node scripts/validate-yap-graph.js "./Existing App.yap" --mode compatibility
```

## References

Load only the relevant reference:

- `references/yap-structure-study.md`: `.yap` wrapper, root app, child resources, forms, reports/modules, ReplaceIds.
- `yeeflow-yapk-package-generator` plus `docs/yeeflow-yapk-version-package-study.md` and `docs/yeeflow-application-package-generation-rules.md` when present: `.yapk` version package wrapper, product schema, package-type decision, Resource decode/signing boundary, and current content-generation limitations.
- `references/first-test-plan.md`: first safe app-generation test strategy.
- `references/baseline-department-access-management-v5.md`: successful v5 baseline and root app shell rules.
- `references/baseline-visitor-access-management-v11.md`: Visitor Access v5-v11 generated baselines, including v11 multi-type proof.
- `references/data-list-approval-integration-pattern.md`: generated data list plus approval form integration.
- `references/related-list-lookup-pattern.md`: standalone related-list lookup rules and `.yap` internal lookup contrast.
- `references/validate-yap-package.md`: package validator behavior.
- `references/validate-yap-graph.md`: graph validator behavior.
- `references/build-yap-wrapper.md`: wrapper builder usage and safety rules.
- `references/examples-summary.md`: proven baseline and quick pattern reminders.
- In the active generator workspace, use `docs/workflow-action-configuration-reference.md`, `docs/workflow-action-generation-rules.md`, and `workflow-action-configurations.normalized.json` as the official workflow action configuration reference when generating or validating workflow nodes.
- In the active generator workspace, use `control-configurations.normalized.json`, `field-configurations.normalized.json`, `docs/yeeflow-control-to-field-mapping.md`, and `docs/yeeflow-control-field-generation-rules.md` when planning approval-form controls, data-list persistence, custom list forms, and app-level control-to-field mappings.
- In the active generator workspace, use `workflow-action-config-validator.js`, `yeeflow-control-field-schema-utils.js`, and `yeeflow-expression-utils.js` when available; these are the compact helper/validator entry points for workflow action, control/field schema, and expression checks.

## Workflow Action Configuration Reference

The app validator stack should validate workflow nodes against the normalized action reference when present. Stop before wrapper build on missing required node properties, invalid enum values, invalid value types, invalid `ContentList` mappings, invalid `QueryData` filters, invalid `SequenceFlow` conditions, invalid `Loop`/`Delay` condition shapes, and unsafe external or credential-related actions.

## Application Settings Generation

Root application settings are generated in `Data.Item.ListModel.LayoutView` as a JSON string. Preserve `add/edit/view`, write `sort[]` for navigation, write `attrs.appearance` for header appearance, write `attrs["navigator-menu"]` for menu styling/layout, and keep `sortVer = 1`.

For navigation, generate top-level resources directly in `sort[]` and custom groups as `Type: "classes"` with `ID`, `Title`, `Icon`, and `list[]`. Groups cannot be nested, and the maximum supported menu depth is top-level item plus child resource. Use `DisplayName` only when custom display text is required; omit it to use the resource `Title` fallback. Use `Icon: ""` for no-icon. Use `IsHidden` only as a boolean.

Navigation layout values are `default` for horizontal/default, `left` for vertical, `onheader` for on-header, and `none` for no menu; all four values are runtime-proven for generated packages. Header settings live in `attrs.appearance`; omit `height` for default 56px, use runtime-proven `height: 46` for the small header, and use runtime-proven `hideTitle: true` to hide the application title. Additional header height variants remain unproven until a focused runtime baseline tests them.

Application user groups are generated as empty `Data.AppGroups[]` records with fresh `ID`, `Name`, and nullable `Description`; include group IDs in `Resource.ReplaceIds[]`. Empty app groups are import/open and settings-visible runtime-proven. Do not include group members, real users, emails, or tenant-local identities until a member-bearing export proves the schema.

Treat `GenerateDocument`, `ConvertToPdf`, `AddWatermark`, and `DocumentRecognition` as partially supported until template/document-library dependencies are proven. Treat `AI`, `AzureOpenAI`, `Connector`, `HttpRequest`, `AcrobatSign`, `DocuSign`, and `PandaDoc` as external/credential-sensitive; do not bundle secrets, tokens, passwords, API keys, connection IDs, or tenant-specific credential values.

Workflow assignment rule: generated app packages must not hardcode tenant-specific direct users in approval task `usertaskassignment`. A direct `method: "users"` or `method: "direct"` assignment with a local user ID/title can import but fail publish if the user is not valid in the target tenant. Prefer requester/current-user expression assignment or require an explicit export-backed user mapping.

Assignment task assignee generation update: use `docs/studies/workflow-assignment-task-assignee-settings.md`, `docs/studies/workflow-assignment-task-generation-rules.md`, and `docs/studies/normalized/workflow-assignment-task-assignees/` for export-proven `MultiAssignmentTask.properties.usertaskassignment[]` shapes. `Test ABC.yap` proves direct user, applicant line manager, applicant department manager, direct job position, job position by selected department, job position by applicant department, job position by selected location, and job position by applicant location shapes. These are export-proven and validator-backed only; do not claim runtime routing until a focused runtime baseline passes. Job-position, department, and location assignment may require real org data; use `yeeflow-api-operator` read-only lookup only when local credentials are present and authorized.

Scheduled workflow assignment update: `Workflow Actions Runtime Baseline (1).yap` proves a Scheduled Workflow (`WorkflowType = 3`, `ListID = 0`) can include a `StartNoneEvent` with email fields and no terminate/recall fields, followed by a `MultiAssignmentTask.properties.usertaskassignment[]` Applicant Line Manager expression. This does not prove scheduled assignment routing, scheduled email delivery, or data-list field expression context; do not trigger scheduled workflows during generation checks unless a separate safe runtime test is explicitly scoped.

Approval workflow task-form update: `Workflow Actions Runtime Baseline (2)_Task forms.yap` proves an approval form can include one submission page and multiple task-form pages in `Data.Forms[].DefResource.pageurls[]`. Generate task pages separately from the submission page, associate Assignment Task nodes through `MultiAssignmentTask.properties.taskurl`, and keep task forms compatible with the task type. Standard Action Panel task forms are export-proven; custom `action_button` + `formdef.actions[]` task forms are export-proven for approve, reject, reassign, add-assignee, and complete Submit form configurations. Do not claim custom task-operation runtime behavior until focused runtime proof executes the operations safely.

Form Actions baseline: use `docs/yeeflow-form-action-generation-rules.md` for generated front-end form logic. Button styles, button click triggers, page-load triggers, temp variables, `setvar`, `confirm`, Query data multiple/single mapping, query count, Query data filters via `querydata_filters`, temp query collection aggregation, default Submit form, Save changes, approval completion, and ContentList persistence are runtime-proven in focused generated packages.

## Custom Code Control Rules

When an app package includes a Yeeflow Custom Code control:

- Generate the script first or confirm that an existing script is available in the package; do not create a `codein` control with a missing script.
- Use the export-backed control shape: `type: "codein"` with `attrs["codein-script"]` for embedded source and `attrs["codein-script-param"]` for the parameter map, unless a future export proves a separate script-resource reference pattern.
- Required input parameters declared by the script must be present, and parameter names must be unique.
- Parameter value shapes must match the script's Yeeflow parameter expectations. For Smart Lookup Picker-style controls, expression/static values use `{ type: 2, value: [token...] }`, while output targets use `{ type: 1, value: { prefix, value } }`.
- Dashboard output targets should resolve to dashboard temp variables (`__temp_`), approval-form output targets to workflow/form variables (`__variables_`), and data-list custom-form output targets to list fields (`__list_`).
- Every Custom Code control should have a meaningful surrounding section/title and a clear `nv_label` or nearby label. A generic `Custom code` label is acceptable in an export study but should be improved in generated packages.
- Do not silently fall back to static text or placeholder content when a custom component is required by the app design.
- Public-form custom code must be treated as unproven unless a focused export/runtime test proves the script is safe with public permissions and data access.
- Treat static inspection as configuration proof only. Runtime render, lookup query, and writeback must be tested before claiming support.

## Control-To-Field Mapping Rules

Use generation-safe mappings first: `input` to Text, `textarea` to Text, `input_number` to Decimal, `currency` to Decimal, `radio` to Text choice, `switch` to Bit, `datepicker` to Datetime, and resolved local `lookup` to a lookup field when the target field is lookup-compatible. Use the v6 lookup rule for app packages: persist readable lookup values through `attrs.addition[]` target variables or explicit summaries, and store raw row IDs only intentionally. Use fallback mappings for rich text, identity/organization/location/cost-center pickers, tag, metadata, and direct file/image binary persistence until runtime proof exists. Percent, hyperlink, and rate have generated runtime proof when mapped to Decimal/Text fields as documented in the coverage matrix. Defer signer, lookup-list, nested list row persistence, embedded data-list display, and calculated-column approval variables unless a focused export/import proves the structure.

## Output Expectations

When generating or debugging a `.yap`, report:

- files created or changed
- resource inventory
- generated IDs and `ReplaceIds` strategy
- lookup and `ContentList` mappings
- validation results
- wrapper build result, if built
- unresolved risks and stop conditions
- sandbox import/export-back checklist

<!-- agent-copilot-application-resource-learning:start -->
## AI Agent, Copilot, And Connection Boundary

The DEMO Innovation Ecosystem Platform study proves app-level AI resources in OtherModules: Connections, Agents, and Knowledges. Agents module entries use Type = 0 for AI Agents and Type = 1 for Copilots. Tools can target local data lists, current app resources, connected Agents, or application connections.

Do not include AI Agents, Copilots, or Connections in generated final .yap packages until the target resource graph is fully resolved and local validation passes. External connection tools require placeholders and post-import reconfiguration; do not generate packages that require real Outlook, SharePoint, OAuth, or HTTP credentials.
<!-- agent-copilot-application-resource-learning:end -->

<!-- workflow-claim-task-learning:start -->
## Workflow Claim Task Generation Boundary

Use `docs/studies/workflow-claim-task-action.md` before generating Claim Task nodes. Claim Task is export-proven as `CandidateTask` in approval-form and data-list workflows. It shares task form association (`properties.taskurl`) and receiver editor storage (`properties.usertaskassignment[]`) with Assignment Task, but the semantics are receiver/candidate pool ownership rather than direct assignee ownership. Generate Claim Task only when the business process expects a pool/team to claim work; use Assignment Task for direct user assignment.

Preserve `tasktype="approve"` or `tasktype="complete"` when present, preserve due-date and email fields, and preserve receiver expression-button strings. Do not generate the config-reference typo `properties.tasktype ` with a trailing space. Do not claim claim execution, claim locking, pending-task ownership, quick completion, or email delivery without a focused runtime baseline.
<!-- workflow-claim-task-learning:end -->

<!-- workflow-set-variable-learning:start -->
## Workflow Set Variable Generation Boundary

Use `docs/studies/workflow-set-variable-action.md` before generating workflow Set variable nodes. Set variable is export-proven as `SetVariableTask` in approval-form and data-list workflows. Generate `properties.variablesetting[]` rows for workflow-variable assignments: the row `id` is the target workflow variable and `value` is the expression-token array.

Use `formtype="current"` for the current workflow. Use `formtype="custom"` only for another approval form workflow instance and preserve `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.ProcKey`, and `properties.formids`. In data-list workflows, list fields may be used as right-side `exprType="list_field"` values, but Set variable must not be used to write list fields; use Set data list / `ContentList` for data-list mutation. Do not claim runtime variable mutation or another-workflow updates without focused runtime proof.

Use `docs/studies/workflow-set-data-list-action.md` before generating workflow Set data list nodes. Set data list is export-proven as `ContentList` in approval-form and data-list workflows. Use it for data-source item/field mutation, not workflow-variable mutation. Preserve `properties.listtype` (`select` or data-list-context `current`), `properties.type` (`add`, `edit`, `remove`), `properties.listdatas[]` mappings, and `properties.wheres[]` filters. Selected-list mode must preserve target metadata in `appid`, `listsetid`, and `listid`. Edit/remove are high-impact; generate explicit safe filters and avoid remove unless the user explicitly requests destructive behavior. Preserve numeric operation codes `Per="0".."4"` only where target field metadata supports number operations. Do not claim add/update/delete, current-list mutation, document-library mutation, or sub-list row iteration without focused runtime proof.

Use `docs/studies/workflow-signal-event-action.md` before generating approval workflow Signal event branches. Signal event is export-proven as `SignalEvent` in an approval-form workflow. It has no incoming flow, should have at least one outgoing flow, and uses `properties.eventdefinitions[]` with `CancelEventDefinition` and/or `RevokeEventDefinition`. Treat it as a special event source for recall/terminate compensation, not a normal action in the Start branch. Validate downstream Set data list filters carefully and do not claim recall/terminate or cleanup execution without focused runtime proof.
<!-- workflow-set-variable-learning:end -->

<!-- app-creation-rules-learning:start -->
## App Creation Rule Guardrails

Before generating or importing any `.yap`, enforce the product-team app creation rules in `docs/studies/yeeflow-app-creation-rules.md`. Generated list fields must keep `FieldIndex` synchronized with the numeric suffix at the absolute end of `FieldName` (`FieldIndex: 11` uses `Text11`, not `Text6`) and must keep the `FieldName` storage prefix aligned with `FieldType` (`Text*` text, `Datetime*` date, `Decimal*` numeric). `DisplayName`, `FieldName`, and `InternalName` must each be unique within the same list; `InternalName` and process keys may contain only letters, numbers, and underscores; all three field identifiers and process keys are limited to 255 characters.

Approval forms must emit `NoRule` as an object with `Prefix`, `StartIndex`, `CustomLength`, and `AutoIncrement`; `NoRule.Prefix` must include `{index}`. Treat these as generation-blocking validation errors, not style warnings. Any generated package failing these checks must not be imported.

Focused runtime proof in `docs/studies/yeeflow-app-creation-rules-runtime-proof.md` confirms the repaired workflow field-rule package imported and accepted a manually saved new data-list field. This upgrades only the app/list import-open and data-list field-creation path for the synchronized `FieldIndex`/`FieldName`, unique identifier, valid process-key, and valid `NoRule` rules; do not extend it to workflow routing or Form Report behavior.
<!-- app-creation-rules-learning:end -->

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; generated non-system `FieldName` suffix matching `FieldIndex`; and `FieldName` storage prefix matching `FieldType` for generated seed/add-ready lists. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.

Focused runtime proof in `docs/studies/data-list-field-creation-runtime-proof.md` confirms generated Data List import/open behavior and post-import manual field creation for a representative subset: `input`, `textarea` schema, `input_number`, `currency`, `percent`, `switch`, `checkbox`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `file-upload`, `icon-upload`, local `lookup` schema, `calculated-column` schema, and `list` schema. Use this to prefer native generated fields for import/open baselines, but do not claim record entry, lookup resolution, calculated results, uploads, picker selection, nested row behavior, Document Library, workflow, or Form Report runtime behavior.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom List Form Generation

Use `docs/studies/data-list-custom-form-fields.md`, `docs/studies/data-list-layoutview-add-form-runtime-fix.md`, `docs/studies/normalized/data-list-custom-forms/`, and `scripts/inspect-data-list-custom-forms.mjs` when an app needs generated Data List custom forms. Generate custom forms as Data List `Layouts[]` entries with `Type = 1`, `LayoutView = null`, `LayoutInResources[0].ID = RefId = LayoutID`, and embedded form JSON in `LayoutInResources[0].Resource`. Assign forms through `ListModel.LayoutView.add/edit/view`; the export-proven patterns include separate add/edit forms and one form reused for add/edit/view.

Display settings are separate from the form layouts: `ListModel.LayoutView.add/edit/view` selects a custom form `LayoutID` or `default`, `opentype` stores opening mode, and `modalsize` stores size. For generated Data Lists where the default `+ New item` action should work, `ListModel.LayoutView.add` must be a real local Type `1` layout ID; generating only `opentype.add` and `modalsize.add` can make the Add modal load forever. The focused fixed Container/Button action package is user-confirmed to import, open `Action Runtime Requests`, and render the default `+ New item` Add modal when `add/edit/view` resolve to concrete Type `1` layouts and object-shaped display-settings `sort` is omitted. Export-proven modes include Pop-up window via `modal`, Slide in via `slide`, New page via `new`, and missing defaults of Pop-up window for New/Edit plus Slide in for View. Export-proven sizes are `0` Medium, `1` Small, `2` Large, `3` Full screen, with missing as Default. Choose mode/size by form complexity and validate references before package handoff. Omit `ListModel.LayoutView.sort` unless using an export-supported field-ID array shape; do not use Type `0` view sort objects such as `{ SortName, SortByDesc }` in display settings. Document Library applicability for these settings remains product/user-understanding-backed until a Type `16` export proves it; Add form save/data mutation remains separately unproven.

For list fields on forms, generate controls under a conservative `container` -> `container` -> `flex_grid` shell. Each top-level field control should use the field `Type`, `binding = FieldName`, `fieldID = FieldID`, label/display metadata, and compatible `attrs` from field rules. Keep default/system fields explicit and system-aware. Validate no duplicate control ids, no unresolved bindings, no fieldID/binding mismatches, and no overlap-prone layout inventions.

For sub-list fields, generate a parent `type = "list"` control and nested controls only inside `attrs.list-fields[]`, with `attrs.list_field = true`, `attrs.list_field_binding` pointing to the parent field, and scoped bindings such as `field_1`. Generate temp variables and form actions only when needed; action buttons, `formAction` hooks, Set variable list-field targets, and temp variable references must resolve. Do not assume approval-form action behavior for Data List custom forms without Data List export/runtime proof.

Document Library custom-list-form applicability is product/user-understanding-backed unless a Type `16` export proves the exact shape. Runtime rendering/action execution is not proven by the export-learning pass.
<!-- data-list-custom-form-fields-learning:end -->

<!-- data-list-public-form-learning:start -->
## Data List Public Form Generation

Use `docs/studies/data-list-public-forms.md`, `docs/studies/normalized/data-list-public-forms/`, and `scripts/inspect-data-list-public-forms.mjs` when an app requires an anonymous public data-collection form. Public Forms are not Custom List Forms: store them under the Data List `PublicForms[]` collection with a JSON-string `Resource`, keep them separate from `Layouts[]`, and validate public-form controls independently from authenticated New/Edit/View forms.

Generate only public-safe top-level field controls proven in `Data Lists (4).yap`: `input`, `textarea`, `richtext`, `input_number`, `percent`, `currency`, `switch`, `radio`, `checkbox`, `datepicker`, `time`, `file-upload`, `icon-upload`, `rate`, `hyperlink`, `signer`, and `list`. The `Title` primary field is export-proven as a special system-field exception; do not include Id/Created/Modified default fields or login-dependent picker fields.

Use conservative page structure such as `container` and `flex_grid`, and include `submit-button` when the Public Form is meant to collect submissions. For generated Public Forms, use export-shaped `flex_grid` attrs (`ver: 1`, structured `columns`/`rows`, `cgap`, `cgapU`) and set `displayLabel: [null, false]` when the grid is only a layout wrapper. Put `submit-button` inside a centered container and use inline width `common.positioning.widthtype: [null, "2"]`.

Focused runtime proof in `docs/studies/data-list-public-form-runtime-proof.md` confirms generated Data List Public Form import/open/list-open/designer-open/control-render behavior after the grid and centered inline submit fix. Redact share URLs/codes in all docs and logs. Treat anonymous submit, public URL access outside the authenticated designer unless separately confirmed, upload execution, sub-list row entry, save/data mutation, and Document Library public-form behavior as unproven until a focused runtime proof covers them.
<!-- data-list-public-form-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Guardrails

Before packaging any generated `.yap`, ensure the wrapper has schema-required `Title`, `Description`, FontAwesome JSON-string `IconUrl`, `IsListSet`, and `[______gizp______]`-prefixed `Resource`. The decoded resource must contain `Data` as a JSON string whose `ListExportInfo.Item` exists.

Every generated `ListExportItem`, including root `Item` and every `Childs[]` resource, must emit `Defs` and `Layouts` as arrays. Never emit `null`; use `[]` for empty definitions or layouts. Generated packages must pass `scripts/inspect-yap-schema-standard.mjs` and `validate-yap-package.js` before import attempts.

For app-contained AI Agent/Copilot Access app resources tools, keep resource permissions as numeric bitmasks. Use schema-backed masks for approval forms, data lists, document libraries, and AI agents. Keep `formReports` and `dataReports` warning-level until product clarifies whether the correct bit is schema Read `8` or rules-doc Submit `1`.
<!-- yap-schema-standard-learning:end -->
<!-- projects-center-import-failure-hardening:start -->
## Generated App Import-Readiness Gate

The `Projects Center_2` repair proved that compatibility validation can miss generated-import blockers. The initially delivered package passed local compatibility-style checks but failed Yeeflow import; after strict repair, the user confirmed the fixed package imported successfully. Treat that proof narrowly: it proves fixed Projects Center import only, not broad app use, data entry, document-library runtime behavior, report execution, or workflow behavior.

For every newly generated `.yap`, run strict generator/import-readiness validation before handoff. Do not say "local validation passed" when only compatibility validation passed. Compatibility mode is for historical export study; generated app handoff requires `validate-yap-package.js --mode generator --stage final`, `validate-yap-graph.js --mode generator --stage final`, materialization inspection, schema-standard inspection, app-creation rules inspection, data-view/dashboard/page reference checks, wrapper round trip, placeholder scan, and safety scan. Use `scripts/inspect-yap-import-readiness.mjs` when present.

Generation-blocking import-readiness errors include missing or invalid `ListModel.ListType` on Type `1` data lists; export-native native `Title` metadata instead of generator-safe `Status = 0`, `IsSystem = true`, `IsIndex = true`, `FieldIndex = 0`; list/data view columns pointing at unresolved system pseudo-fields or missing fields; custom page/form/dashboard `LayoutInResources[].ID` or `RefId` mismatched from the owning `LayoutID`; dashboard dynamic-display rules or filters referencing unresolved controls/fields, including stale `ListDataID` collection context filters; and `Resource.ReplaceIds` containing tenant/user metadata such as `TenantID`, `CreatedBy`, or `ModifiedBy`.

If strict validation fails, fix the package before handoff. `pass_with_warnings` is acceptable only after the remaining warnings are classified as non-import-blocking runtime/export-derived warnings.
<!-- projects-center-import-failure-hardening:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Dynamic Content Generation

When an application requirement needs editable repeating rows with a custom visual item layout, use the Sub List Dynamic content guidance in `docs/studies/sub-list-dynamic-content.md`. Generate the Sub List as a `type = "list"` control backed by a list variable and listref row schema. For Dynamic content, emit `attrs["list-display-preference"] = "dynamic"`, a `list-body` item template with row-field controls, and a `list-footer` with add/import buttons and summaries as needed.

For table-style Dynamic Sub Lists, create a sibling header `flex_grid` above the Sub List and a matching grid inside the item template. Configure Sub List list actions locally under `attrs.actions[]`; do not place those actions in `formdef.actions[]`. Export-proven row operation menu actions include Duplicate, Insert before, Insert after, Move up, and Move down; keep Delete as a visible last-column action instead of duplicating it in the menu when that column exists. Run `scripts/inspect-sub-list-dynamic-controls.mjs` and package validation before handing off generated packages. Approval Form Dynamic Sub List row actions are runtime-proven only for the focused V1.5 generated package and tested actions.

Data List custom form Dynamic Sub List usage is export-proven by `Sales Quotation.yap` on the `Quotation` list's `Print Page` custom form. For print/read-only line items, bind the Sub List control to a real Sub List field, resolve row bindings against `Rules["list-variables"]`, use Dynamic content with print-friendly layout controls, and omit Add/Import/Edit row actions unless intentionally needed. A view custom form can call a print target with a form action step `type = "print"`, `attrs.printtype = "select"`, `attrs.layout` resolving to the print layout, and `attrs.listdataid[]` carrying the current `ListDataID`. Runtime print execution remains unproven until tested.

Focused runtime package pending: `generate-sub-list-dynamic-actions-runtime-proof.mjs` generates a minimal app-level Approval Form package with one Dynamic Sub List, row bindings for `Item Name`, `Quantity`, and `Notes`, a sibling header grid, and local Sub List actions `list_new`, `list_dup`, `list_del`, and `list_import`. Use it as the current generated baseline for manual runtime testing, but do not promote Add/Duplicate/Delete/Import behavior to runtime-proven until `/Users/Renger/Downloads/sub-list-dynamic-actions-runtime-proof.v1.yap` is imported and exercised successfully.

V1 runtime feedback corrected the generated table layout. Future generated Dynamic Sub List table layouts should use the V1.1 YAPK pattern: one section containing a header `flex_grid` and the Dynamic Sub List; hide captions on the Sub List and layout grids; use export-shaped responsive grid columns with `list`/`last` track definitions; and make `list-body` start with a matching body grid instead of loose field controls. Preserve Add/Import footer buttons and local list actions only with the export-proven action schemas.
<!-- sub-list-dynamic-content-learning:end -->

<!-- container-button-action-settings-learning:start -->
## Container/Button Action Handoff

When generated dashboards, custom pages, or app shells include clickable Containers or Buttons, use the export-backed action-setting guidance in `docs/studies/container-button-action-settings.md` and validate with `scripts/inspect-container-button-actions.mjs`.

For generated apps, do not leave action targets as placeholders. Link actions need a literal URL or expression URL. Add list item actions must point to a real Data List or Document Library and any selected form layout must resolve. When relying on the Data List default New item form, the target list must have a resolvable `ListModel.LayoutView.add` custom form layout; otherwise the Add modal can hang even when the dashboard action target itself resolves. Open dashboard actions must point to an included Type `103` dashboard. Open approval form actions must point to an included approval form `ProcKey`, and final approval forms should satisfy the publish/readiness checks. Generated-final unresolved Container/Button action targets are import-readiness errors.

Choose structural Yeeflow actions instead of raw links when the target is a Yeeflow resource. Keep cross-application action targets runtime-sensitive unless a focused export/runtime proof includes the exact cross-app identity shape.

Focused runtime proof in `docs/studies/container-button-action-runtime-proof.md` confirms representative generated current-app Container/Button action navigation for Link, Add list item, Open dashboard, and Open approval form. For generated approval forms opened from dashboard actions, preserve request-page publish readiness: `DefResource.pageurls[]` should contain a request page with outer `type = 1` and `pagetype = 1`, embedded `formdef.id` equal to the page ID, embedded `formdef.pagetype = 1`, populated form name/title, array `filterVars`/`tempVars`, and Start node `taskurl`/`taskUrl`/`TaskUrl` aliases pointing at that request page. The runtime proof fixed `process request pageUrl is null key:CBAR`; do not claim submit/workflow/cross-app/form-action binding proof from it.
<!-- container-button-action-settings-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Kanban/Collection Dynamic Control Application Guidance

When app requirements call for grouped cards, activity cards, or current-record display, use the export-backed guidance in `docs/studies/kanban-collection-dynamic-controls.md`. Dashboard Kanban and Collection controls should resolve `attrs.data.list` to an included source list; Kanban must also resolve `attrs.data.cateField`. Dynamic controls inside item templates use `attrs.source = "3"` for the current Kanban/Collection item, while Data List custom forms use `attrs.source = "4"` for the current list item.

Generate Dynamic user/image/file controls only against compatible user/image/file fields, and use Dynamic field for general fields. Do not claim Vertical Timeline or Horizontal Timeline support from this learning branch, and keep runtime claims for Kanban rendering, drag/drop, click behavior, image/file preview, and Data List form behavior pending until a focused runtime package is tested.

## Timeline Dynamic Control Application Guidance

When app requirements need a chronological dashboard surface, use `docs/studies/timeline-controls-dynamic-controls.md`. Vertical Timeline (`timeline-v`) is appropriate for activity feeds, histories, lifecycle logs, and vertical milestone/event streams. Horizontal Timeline (`timeline-h`) is appropriate for roadmaps, project schedules, phase plans, campaign plans, and horizontal time progression.

Generate timeline controls with `attrs.data.list` resolving to an included source list, a resolvable date/order/title field in `attrs.data.title.variable[]` and/or `attrs.data.sort[]`, and an item template in `children[]`. Dynamic controls inside timeline templates should use `attrs.source = "3"` and `attrs["obj-f"]` just like Collection/Kanban item templates. Use Dynamic user/image/file only against compatible source field types, and use Dynamic field for general values. The focused `kanban-collection-timeline-runtime-proof.v1.yap` package proves import/open/render stability for generated Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values; keep click/open behavior, horizontal arrow scrolling, drag/drop, non-empty user/image/file display, and dynamic file/image preview/download unproven until specifically tested.

Use `generate-kanban-collection-timeline-runtime-proof.mjs` as the current minimal generated package pattern for dashboard Kanban/Collection/Timeline Dynamic controls. It keeps the source Data List local, uses safe synthetic rows, binds all item-template Dynamic controls with source `3`, and leaves user/image/file row values empty to avoid private IDs or file payloads. User-confirmed proof: the package imported, `Dynamic Controls Runtime Dashboard` opened, Kanban/Collection/Vertical Timeline/Horizontal Timeline rendered, Dynamic field values rendered, Dynamic user/image/file controls did not crash with empty values, and no missing binding/render error appeared.
<!-- kanban-collection-dynamic-controls-learning:end -->

<!-- advanced-controls-learning:start -->
## Advanced Yeeflow Controls Learning

Company Overview (3).yap export-proves advanced Dashboard and Data List custom-form control patterns documented in docs/studies/advanced-controls.md and normalized under docs/studies/normalized/advanced-controls/. Treat this as export-proven and validator-backed only unless a later focused runtime pass proves rendering and interactions.

Planning guidance:

- Use Tab (aktabs / ak-tabs-tab) for multi-tab content grouping when users need related peer views without leaving the page.
- Use Toggle (toggle / toggle-panel) for collapsible multi-section content, FAQ blocks, grouped detail panels, and optional guidance.
- Use Timer for static or dynamic date countdown/deadline indicators such as SLA, due date, campaign, and task timers.
- Use Icon list for quick links, resource shortcuts, and compact navigation lists.
- Use Divider and Spacer for layout structure and visual rhythm between control groups.
- Use Alert for info, success, warning, and error messages where guidance or status communication matters.
- Use Progress bar and Progress circle for numeric progress, completion percentages, KPI capacity, score, and utilization.
- Use Steps bar for phase/status/workflow/approval/onboarding progress; prefer static steps or field-bound single-select/status sources where supported.
- Use QR Code for record/page/form/link sharing and mobile access.
- Use Barcode for encoded record, inventory, ticket, asset, static, or dynamic values.
- Use Embed for iframe/external content such as reports, maps, dashboards, docs, and videos when tenant/security context allows it.
- Use Document embed for attachment/file previews such as contracts, invoices, images, PDFs, Word documents, and PowerPoint decks.

Validation guidance:

- Tab items need valid ids/titles and child control containers.
- Toggle sections need valid ids/titles and child control containers.
- Timer needs a valid static date or dynamic date binding.
- Icon list items should define icon/text/link settings where required.
- Progress bar/circle values must be numeric or resolve to numeric fields/variables.
- Steps bar static steps need valid items; bound sources should resolve to single-select/status fields where applicable.
- QR Code value/URL should be static, dynamic, current-item, current-page, or current-form source; implicit host-current URL behavior remains runtime-sensitive.
- Barcode value must be static or dynamic and barcode type should be supported (CODE128/CODE128A observed).
- Embed code/src/url must be configured and generated-final packages must not contain unsafe placeholder URLs.
- Document embed must bind to attachment/file fields and respect single/multiple settings when configured.
- Generated-final packages should hard-error unresolved required bindings, invalid URLs, incompatible numeric/file/status fields, unsupported barcode types, and unsupported host placement. Historical exports should warn when uncertain.

Proof boundary: Tab and Toggle dashboard usage, Additional-controls dashboard usage, and Company Overview / View page Data List form usage are export-proven only. Approval Form/Public Form support is product-understanding-backed unless separately export-proven. Runtime rendering, link navigation, QR/barcode scan behavior, iframe loading, document preview behavior, and dynamic value changes are not proven in this branch.
<!-- advanced-controls-learning:end -->

<!-- advanced-controls-runtime-proof:start -->
## Advanced Controls Runtime Proof Pattern

Use docs/studies/advanced-controls-runtime-proof.md and generate-advanced-controls-runtime-proof.mjs as the focused generated package pattern for advanced Yeeflow controls. The generated manual-test package is /Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap and is intentionally uncommitted. The user-confirmed runtime result passed for package import, dashboard open, rendering and basic interactions for the included controls, Embed safe render, Document embed empty state, and absence of missing binding/render/action errors.

Safe minimal generation pattern:

- Generate one compact dashboard named Advanced Controls Runtime Dashboard for Dashboard-host controls.
- Generate one Data List named Advanced Control Runtime Items when current-item bindings are needed.
- Use a View page for Data List form-host controls that are export-proven only on list forms, especially field-bound Steps bar and Document embed.
- Keep sample data synthetic and leave file-upload fields empty when testing Document embed safe empty state.
- Use static public Yeeflow URLs for QR Code and Embed tests; never use private tenant URLs.
- Use static safe Barcode values such as ACR-PROOF-001 and observed-supported barcode types such as CODE128/CODE128A.

Control-specific safe patterns:

- Tab: aktabs with ak-tabs-tab children, titles, one default tab, and nested content controls.
- Toggle: toggle with toggle-panel children, attrs.title.value, and nested controls.
- Timer: timer with attrs.set.date.value using a safe static future date.
- Icon list: icon_list with attrs.data.links[], safe icons, titles, and public links.
- Divider: line with explicit width, line-width, color token, and spacing.
- Alert: alert with attrs.alert.title and attrs.alert.desc; include info/success/warning/error variants when useful.
- Progress bar: progress with attrs.bar.per.value as a static numeric percentage for the runtime baseline.
- Spacer: gap with explicit attrs.space.
- Progress circle: progress-circle with static attrs.per values and common positioning.
- Steps bar: steps-bar with static steps-options on dashboards; on Data List View pages, bind current-step to a current item radio/status field only when the field resolves.
- QR Code: list-qrcode with attrs.qr-code-link.customUrl.url for static URL proof; implicit current URL modes remain host-sensitive.
- Barcode: barcode with attrs.value.value and attrs.type; prefer CODE128 for generated runtime smoke tests.
- Embed: embed with attrs.code containing a safe iframe to a public URL; iframe load success is not guaranteed until runtime-tested.
- Document embed: document-embed with attrs.doc-source bound to a file-upload field; empty-field rendering is a separate proof from non-empty document preview.

User-confirmed runtime result for the focused package:

- The package imported successfully and Advanced Controls Runtime Dashboard opened.
- Tab switching and Toggle expand/collapse worked.
- Timer, Icon list, Divider, Alert variants, Progress bar, Spacer, Progress circle, Steps bar, QR Code, Barcode, Embed, and Document embed rendered in the tested scope.
- Embed rendered safely without breaking the page.
- Document embed rendered a safe empty state.
- No missing binding, render, or action error appeared.

Validation and proof boundaries:

- The local gate should include validate-yap-package, validate-yap-graph, inspect-advanced-controls, inspect-yap-schema-standard, inspect-yap-materialization, inspect-app-creation-rules, inspect-yap-import-readiness, wrapper build/round-trip, git diff --check, and safety scan.
- Zero local validation errors only proves local readiness, not import/open/render behavior.
- Do not claim QR scan behavior, Barcode scan behavior, external iframe content loading, non-empty document preview, dynamic value changes, or Approval Form/Public Form host behavior unless those exact behaviors are tested.
- Keep generated .yap files, decoded payloads, screenshots, and private data out of commits.
<!-- advanced-controls-runtime-proof:end -->

For `collection_control_grid_table`, use `docs/reference/collection-control-grid-table.template.json` as the export-shaped source of truth. Copy `grid_table_col_wrapper` and all descendants, not a simplified header-plus-Collection lookalike. Business mapping may edit only `grid_table_col_title_wrapper`, `op_normal`, `grid_table_col_header`, `grid_col_item`, and optional `grid_table_col_item_operations`. Preserve style/layout/typography outside those regions, keep `grid_table_col_header` and `grid_col_item` column count/width/property parity, map field types to Dynamic user/image/file/field controls, and omit item operation menus for Form Report/Data Report display-only sources. If item operations are present, every button must bind to a valid action; edit/delete require matching Collection actions, and delete requires the confirmation temp variable/conditional delete flow.
