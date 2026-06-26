---
name: yeeflow-application-builder
description: build real Yeeflow business applications from requirements, process documents, forms, screenshots, SOPs, sample exports, and app ideas by acting as a business solution architect, designing the safest Yeeflow-native app structure, generating and validating .yap new-app packages or .yapk upgrade packages, runtime-testing when requested, documenting baselines, and coordinating Yeeflow generator skills.
---

# Yeeflow Application Builder

## Functional Specification And App Plan Stage Gates

This skill is the top-level application-building controller. For every new application build, Stage 1 is a standardized Functional Specification from the user's input with `docs/standards/functional-specification-standard-template.md`, and Stage 2 is a standardized Yeeflow App Plan from the reviewed Functional Specification with `docs/standards/app-plan-standard-template.md`.

User input may be brief, detailed, document-backed, screenshot-backed, or mixed. Classify the input detail level, interpret and supplement incomplete requirements with explicit assumptions, extract and normalize detailed requirements into the standard Functional Specification template, list business-critical clarification questions, and run the Functional Specification completeness review before moving to the App Plan. For uploaded documents, reference materials, screenshots, exports, or existing samples, do not merely copy the source material; produce a new standardized Functional Specification based on the understood requirements and keep originals as supporting references.

The Yeeflow App Plan must be generated only from the reviewed Functional Specification and must follow `docs/standards/app-plan-standard-template.md`. The App Plan converts business requirements into Yeeflow-supported resources and defines the resource generation order. It is the Yeeflow resource generation contract, not a free-form project plan, generic project plan, or ad hoc script plan.

The primary planning contracts are the human-readable Markdown files `functional-specification.md` and `yeeflow-app-plan.md`. JSON files are companion projections only and must be derived from the Markdown source for validation, traceability, or tests. Resource generation must consume the reviewed Markdown Functional Specification and Markdown App Plan first; companion JSON must not become the source of truth.

Before a plugin-only clean-room run claims that no full-app generation path exists, inspect `docs/reference/full-app-generation-entrypoints.json` with `scripts/inspect-full-app-generation-entrypoints.mjs`. Full application generation is a first-class callable Codex skill entrypoint through `yeeflow-application-builder` and `yeeflow-application-generator`, and generated-final package artifact materialization is exposed through `scripts/materialize-full-app-generated-final.mjs`. If the registry passes, planning gates pass, and business defaults are `user-default-approved-for-generation`, continue into generated-final `.yapk` package materialization instead of stopping at planning. Do not stop solely because no standalone CLI exists, and do not stop after planning when the materializer is present. Do not classify `scripts/yeeflow-application-delivery-workflow.mjs`, `scripts/yeeflow-package-api-automation.mjs`, focused `generate-*-runtime-proof.mjs` scripts, or sample-specific generators as generic full-app generators. If API-issued IDs are unavailable, hard-stop with an ID-source finding, not with a missing-generator finding.

When using `scripts/materialize-full-app-generated-final.mjs`, pass the approved Markdown `functional-specification.md`, approved Markdown `yeeflow-app-plan.md`, output directory, and an API-issued ID manifest. The materializer emits package artifacts only when it can honestly materialize the declared resource graph. It never signs, installs/imports, upgrades, seeds data, runs Version Management proof, or runs browser/runtime proof. Fixture-ID mode is regression-only and is not signing/install eligible. If it returns `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED`, treat that as the correct hard stop for the standalone materializer, not as a missing-generator finding and not as permission to sign or install a placeholder package. The blocker report must include exact resource counts, parsed resource names, and `missingResourceGraph[]`; field rows, dashboard section rows, metrics, filters, item-template rows, validator commands, and prose must not inflate resource counts.

The App Plan must follow this Yeeflow resource generation order:

1. Data lists and Document libraries
2. Approval forms
3. Form reports
4. Schedule workflows
5. AI Agents
6. Copilots
7. Custom Data List forms
8. Data List workflows
9. Notifications
10. Data List views
11. Dashboard pages
12. Application navigation
13. Target users, roles, groups, and permissions

All planned field types, variable types, control types, workflow node types, form actions, schedule configs, and configuration shapes must come from active plugin-known skills, standards, validators, template library, or export-proven references. Do not invent unsupported shapes. Unsupported or unknown capabilities must be marked `export-learning-required`, `runtime-proof-required`, or `deferred`.

Do not proceed to full-page canonical design images, page implementation blueprints, Yeeflow resource/package generation, decoded resource-vs-blueprint parity, package/sign/upgrade, or runtime proof until the Functional Specification review gate, App Plan review gate, Business Clarification Gate, Generation Readiness Review, and Functional Specification to App Plan traceability gate pass. Use `scripts/validate-functional-specification.mjs`, `scripts/validate-app-plan-resource-order.mjs`, `scripts/validate-business-clarification-gate.mjs`, `scripts/validate-generation-readiness-review.mjs`, and `scripts/validate-functional-spec-to-app-plan-traceability.mjs` for executable Markdown gate checks when the artifacts are available. These gates prove planning readiness only; they do not prove package validity, signing/API acceptance, install/upgrade success, or runtime behavior. Do not let temporary scripts or ad hoc generation logic bypass plugin knowledge, templates, validators, or export-proven references.

Before dashboard page blueprints or resources are generated, create a Dashboard Golden Reference Selection artifact for every planned dashboard page. Dashboard Page Layouts v1.1 from `docs/reference/dashboard-page-layout-templates.json` is the canonical page-level shell and section layout template; blueprint/resource generation must copy and normalize that export-shaped page shell before applying business content. The default operational dashboard component/region reference is `event_portfolio_dashboard_golden_reference` from `docs/reference/dashboard-golden-references.json`; use its export-shaped `_ak_c` / `_ak_c_opt` tree, header, filter group, KPI wrapper, KPI row, pipeline section, grid-table Collection region, campaign/readiness section, and secondary grid-table container inside approved v1.1 business-content containers such as `section_content_area` unless an explicit justified alternative is selected. Do not copy Event Portfolio as a competing page-root shell when v1.1 is selected. The selection maps App Plan/Page Function Plan business requirements to app-specific source lists, KPI fields, filters, grid/table fields, and actions, while keeping Page Function Plan business-oriented and avoiding low-level control properties. Semantic shells or provenance-only reconstructed structures are not acceptable.

Dashboard Page Layouts v1.1 now also defines controlled business-content slots and repeatable/removable modules. Planning may describe business sections, metrics, fields, and actions, but blueprint/resource generation may only change business text, bindings, filters, KPI content, icons, actions, and Collection/table fields inside registered allowed business-content containers. Additional layout sections or KPI cards must be copied from registered repeatable/removable modules, not invented from scratch, and copied modules must preserve the template structure. Remove unused copied content card modules instead of leaving empty title-only `section_content_area` slots. Business Collections/filters must not be placed directly under root `Content`; generator-normalized `Main`/`Content` labels, semantic Navigator names, zero padding, Full width encodings, and empty `actions` arrays are allowed only when the v1.1 structure remains intact.

Dashboard dataset regions that use Collection must select exactly one approved dataset presentation reference from `docs/reference/dashboard-dataset-presentation-golden-references.json` in the App Plan and preserve that reference into blueprint/resource provenance. The App Plan choice must use the selected registry entry's `suitableSourceResourceTypes`, `whenToUse`, `whenNotToUse`, and `requiredBusinessSignals`; do not pick a template only because it looks attractive or defer the choice to generation. Approved references are `collection_control_responsive_card_grid`, `collection_control_card_with_multiselect_toolbar`, `collection_control_grid_table`, `collection_control_grid_table_with_multiselect`, `collection_control_grid_table_with_search`, and `Event Pipeline Grid-Table`. `collection_control_grid_table_with_multiselect` is not limited to Project Tasks; Projects Center / Project Tasks is the export-proven source reference only. Every approved Collection template is a component-level dataset region, not a page shell: place it only inside approved Dashboard Page Layouts v1.1 business-content slots such as `section_content_area`. Do not copy the source app root shell, page header, root Content, structural wrappers, source fields, source labels, source IDs, or source domain text. Do not generate simplified or invented Dashboard Collection structures. The selected template ID is an implementation contract for that exact Dashboard page/region: dispatch each planned region to the selected template builder, emit explicit Collection-root template provenance, and never collapse multiple planned templates into one default Event Pipeline or grid-table builder.

Full-app generation must treat approved Dashboard Collection and KPI references as clone-and-map contracts. The generator may replace business text, fields, actions, filters, bindings, and IDs only inside allowed slots; it must not rebuild trained modules with helper-created lookalikes. `collection_control_grid_table_with_multiselect` requires full-width wrapper/caption/content containers, locked template gaps, source-domain text replacement, a live `grid_table_col_item_select` action binding, Designer-compatible filter condition shape, selected item temp variables, and Collection root actions. KPI rows must clone `kpi_cards_kpi_row` / `event_portfolio_kpi_planned_events`; helper cards such as `ops_kpi_*` are forbidden even when the visual result appears similar.

When the selected reference is `collection_control_responsive_card_grid`, use `docs/reference/collection-control-responsive-card-grid.template.json` as the export-shaped source of truth. Copy `collection_control_responsive_card_wrapper` and its descendants. Business mapping may edit only `card_col_title_wrapper`, `op_normal`, `card_col_item`, optional `card_col_item_multi_select`, and optional `grid_table_col_item_op_menu`. Preserve all non-editable style/layout/typography, the `card_col_body` Collection root, responsive layout, filter/fulltext shape, pagination, and source action patterns. Dynamic controls in `card_col_item` must match target field types: user fields use `dynamic-user`, image fields use `dynamic-image`, file/attachment fields use `dynamic-file`, and other fields use `dynamic-field`; do not emit `dynamic-image` when the source has no image field. For Form Report/Data Report view-only sources or display-only requirements, omit item edit/delete operation regions instead of inventing disabled actions. If item operation buttons are present, each button must bind to Collection actions; Delete requires the confirmation temp variable and conditional delete flow from the template.

When the selected reference is `collection_control_card_with_multiselect_toolbar`, use `docs/reference/collection-control-card-with-multiselect-toolbar.template.json` as the export-shaped source of truth. Copy `card_with_multiselect_toolbar_wrapper` and its descendants, plus the required page-level `filterVars`, `tempVars`, `actions`, `filter`, and `formAction` dependencies. Business mapping may edit only `card_col_title_wrapper`, `op_normal`, `op_multipleselected`, `card_col_item`, and `card_col_item_operations`. Preserve `card_col_item_multi_select`, Collection root actions, selected-state variables, bulk action wiring, layout/style/typography outside those regions, and the source card item Dynamic control family rules. Do not replace this template with a generic card Collection plus ad hoc checkbox icons.

When the selected reference is `collection_control_grid_table_with_multiselect`, use `docs/reference/collection-control-grid-table-with-multiselect.template.json` as the export-shaped source of truth. Copy `grid_table_col_multiselect_wrapper` and its descendants, plus the required page-level `filterVars`, `tempVars`, `actions`, `filter`, and `formAction` dependencies. Business mapping may edit only `grid_table_col_title_wrapper`, `op_normal`, `op_multipleselected`, `grid_table_col_header`, and `grid_col_item`. Preserve `grid_table_col_item_select`, Collection root actions, selected-state variables, bulk action wiring, layout/style/typography outside those regions, and the source grid/table Dynamic control family rules. `grid_table_col_header` and `grid_col_item` must keep the same column count, widths, and compatible grid properties. Do not replace this template with a generic grid-table Collection plus ad hoc checkbox icons.

Dashboard filters are generated with the same copy-then-map discipline. For every planned Dashboard filter, copy an approved v1.1/Event Portfolio filter module into an approved v1.1 business-content slot such as `section_content_area`, then map `attrs.data.list`, `attrs.data.field`, `display_f`, `value_f`, placeholder text, label text, and consumer filter linkage to the app domain. Do not insert ad hoc filter containers, do not copy `event_portfolio_filter_group` directly under root `Content`, and do not invent new filter layout modules. Preserve rendered label text in `attrs.lab.value`, label typography `attrs.lab.ty = [null, "xs-light"]`, tuple label layout `attrs.lablay = [null, "top"]`, placeholder color, supported radius, fixed-width positioning with custom width 200, and canonical v1.1 `Content` padding before generated-final preflight. Placeholder values for select/search filters must be valid strings or `{ "value": "..." }` objects, never numeric-key objects produced by spreading strings.

When any generated Dashboard, custom Data List form, Approval submission page, Approval task page, Data list workflow task form, or Schedule workflow task form contains two or more page-level Data Filter controls, copy `dashboard_standard_filter_group` from `docs/reference/data-filter-standard-filter-group.template.json` and place all page-level filters inside it. Preserve the wrapper row layout, gap, alignment, child label typography, tuple label layout, placeholder color, radius, fixed-width positioning, and dropdown contract. Local Collection toolbar search boxes are not page-level Data Filter groups.

Do not generate page-level select-filter to Collection `op`/`operator = "9"` runtime conditions until the empty-value bypass contract is export-proven. A static `filterBindings[]` consumer is not enough: runtime evidence showed empty select-filter variables can clear all Collection rows on initial Dashboard load. Prefer proven Search filter/fulltext linkage or visible unfiltered Collections, and let `scripts/validate-dashboard-select-filter-runtime-contract.mjs` block unproven select-filter In conditions before signing readiness.

Dashboard Golden Reference component regions are export-shaped property contracts, not just structural references. When copying Event Portfolio/v1.1 modules, the generator may replace business text, app fields, data sources, actions, icons, and labels, but it must preserve role-specific typography and filter appearance properties. Do not normalize page titles, subtitles, KPI labels/values/trends/notes, section subtitles, or grid-table column headers to one generic token such as `h5-medium`. Preserve `event_portfolio_title = h2-bold`, `event_portfolio_subtitle = body-medium`, KPI labels `s-medium`, KPI values `h2-bold`, KPI trend/note and section subtitle `caption-regular`, and grid-table column headers `caption-medium`.

Dashboard dataset presentation validation must read only canonical Dashboard record-display / dataset-presentation table rows where Collection is the selected record display control or where a selected Collection presentation reference is declared. Do not require workaround text such as `no dashboard dataset`; prose, Form Report explanations, validation command lists, identity tables, and negative guardrails are not dataset regions. App Plan wording may use equivalent business phrases for required intent, but must still preserve the canonical resource-order structure and generation-readiness semantics.

Dashboard/Data List form analytics regions must select one approved Data Analytics golden reference in the App Plan before generation. Use `docs/reference/data-analytics-golden-references.json` and choose by the registry's `suitableSourceResourceTypes`, `whenToUse`, `whenNotToUse`, and `requiredBusinessSignals`, not by visual preference alone. The App Plan's `Data Analytics Template Selection` table must name the business question, source data, grouping/axis fields, value/aggregate fields, selected template ID, and proof boundary. Approved choices are `data_analytics_pie_chart_with_title`, `data_analytics_column_chart_with_title`, `data_analytics_bar_chart_with_title`, `data_analytics_line_chart_with_title`, `data_analytics_area_chart_with_title`, and `data_analytics_pivot_table_standard`. Do not plan analytics templates for Approval forms. On Dashboard Page Layouts v1.1 pages, generation must place selected analytics templates only inside `2_columns_section` or `3_columns_section`.

Approval form pages and workflow task forms must select approved Approval Form Layouts v1.1 templates in the App Plan before generation. Use `docs/reference/approval-form-layout-templates.json`. The single Approval form submission page must select `approval_form_layout_submission_v1_1`; every Approval form task page, Data list workflow task form, and Schedule workflow task form must select `approval_form_layout_task_v1_1`. Generated task pages must clone the selected `pageurls[].formdef` task template and may edit only `page_title_content`, `Operations`, `section_content_area`, and `section_title_header`. Preserve root background, root zero padding, hidden form-title CSS, `main > content`, `content` custom width 1280, page title section, all content-card section shells, and the locked `action_panel_flow_history_wrapper` with Action panel plus workflow history controls. Approval forms and workflow task forms must not use Data Analytics templates, charts, pivot tables, Summary/KPI analytics, or `kpi_metrics_wrapper`.

## UI Generation Hard-Gate Skill

Phase 3B adds workflow-level enforcement. Final reports for high-quality UI work must include contract, scope, runtime evidence, and structure-comparison artifact paths as applicable. Run `scripts/inspect-ui-closed-loop-workflow-enforcement.mjs` before claiming high-quality UI or design fidelity. Generation from design/mockup requires a UI contract. UI upgrades require a scope manifest. Runtime UI quality claims require runtime evidence. Design fidelity claims require structure comparison. Dynamic KPI proof requires before/after mutation evidence. Install/sign/upgrade success is not visual proof.

Use `yeeflow-ui-generation-hard-gates` whenever a generated or upgraded app claims high-quality dashboard/UI output, includes Summary/KPI dashboard work, uses uncertain UI/runtime patterns, relies on runtime screenshot evidence, or changes an existing app's UI lineage. High-quality UI requires a page-by-page implementation contract; uncertain UI/runtime patterns should be proven on a sandbox page first; use export-proven Yeeflow control/style shapes; Summary/KPI controls require designer-shaped hidden Summary configuration; Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; Summary recalculation can be asynchronous or cache-delayed; semantic/non-UUID Summary IDs and other unsupported shapes remain unproven; for every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback; runtime screenshot evidence is required before claiming UI quality; install/signing/API acceptance is not runtime UI proof; UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope; broad scaffold-like UI must not be claimed as high-quality UI. Data Analytics controls require UUID/runtime-safe IDs for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Preserve existing Data Analytics control IDs during upgrades.

## Generated-Final YAPK ID And Navigation Hard Gates

Generated-final `.yapk` output must use API-issued numeric content IDs from `GET /utils/generate/ids?count=<n>` and must emit a redacted `dist/<app-name>-id-provenance-report.json` with `sourceMarker: "api-generated"`, path-to-purpose mappings, duplicate checks, unused-ID accounting, generator provenance metadata, and no non-API IDs. Local ID generation, hardcoded generated IDs, copied sample/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds are forbidden for generated-final `.yapk`. Runtime navigation groups must include API-issued `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list[]`; children must include `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`, with dashboards/pages as `Type: 103` plus `LayoutID`, approval forms as `Type: 105`, and data lists as `Type: 1`. Run `scripts/validate-yapk-id-provenance.mjs` and `scripts/validate-yapk-navigation-runtime-metadata.mjs`; stop before signing, install, upgrade-check, or handoff if either gate fails. `setsign`/`verifysign` and install acceptance do not prove ID provenance or navigation runtime metadata completeness.

Wrapper `TenantID` is tenant metadata, not a generated app content ID. Validate that it is a safe tenant metadata value, but do not require it in the API-issued content ID provenance allocation list. Continue requiring API-issued provenance for generated root/list/page/form/report/navigation resources.

Generated-final `.yapk` output must also pass `scripts/validate-generated-yapk-export-shape.mjs` through `scripts/yapk-first-generation-preflight.mjs` before signing readiness. This is a generator/package hard gate, not a Functional Specification or App Plan requirement. It rejects approval forms with minimal or noncanonical `DefResource`; missing request/task page registrations; missing `formdef.children`; duplicate designer control IDs; missing workflow graph IDs, incoming/outgoing links, task URLs, graph positions, variables, or key/defkey consistency; count-only `FormNewReports`/`DataReports`; dashboard shells or synthetic-only controls; hidden Summary hosts counted as visible KPI/content proof; Summary/chart controls without complete runtime-proven model contracts; native Title fields missing `Status: 0`, `IsSystem: true`, or `IsIndex: true`; and runtime report URLs that use install operation IDs instead of decoded package root `ListSet.ListID`.

Full E2E quality must keep these stages separate: package-generation validity, signing/verifysign, package API submission, async materialization, browser/runtime proof, optional post-install seed data, and final business-quality proof. API `Status: 0` is submitted only. Generated-final YAPK must not contain seed rows under `Childs[].List.Items`, `Childs[].ListDatas`, or `Childs[].List.ListDatas`; demo data belongs in a companion seed artifact and an explicitly approved post-install live seed flow. Approval `DefResource` must include `MultiAssignmentTask`, task assignee metadata, and Approved/Rejected paths. Dashboard runtime quality must fail empty Components shells, `Install failed` tiles, source-template text residue, raw control labels, and KPI values that do not match seed-derived expected values when such proof is provided.

YAPK upgrade ID stability hard gate: upgrade/new-version `.yapk` output must preserve IDs for existing semantic resources from the previous package/lineage manifest. Only newly added resources may consume newly API-issued IDs, removed IDs must not be reused, replacing all IDs is a hard failure, and `scripts/validate-yapk-upgrade-id-stability.mjs` must pass before signing, upgrade-check, upgrade apply, install-like writes, or handoff. Missing previous package/manifest fails closed; signing/install/upgrade acceptance is not ID-continuity proof.

## Dashboard Grid-Table Collection Pattern Gate

Dashboard/app page root content-area padding is a hard gate: every generated or upgraded Type 103 dashboard/app page must serialize `Pages[].LayoutInResources[].Resource` with root `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`. Scalar padding, object/numeric padding, numeric array padding, `attrs.common.padding`, or `attrs.style.padding` alone are invalid for the root content area. Normalize existing dashboard/app page roots to this exact token-array shape before signing, installing, importing, or upgrading. Inner layout containers may keep intentional spacing.

Data-list custom form root content-area padding uses the same hard gate: every generated or upgraded New, Edit, View, Detail, or custom form under `Data.Childs[].Layouts[].LayoutInResources[].Resource` or `Childs[].Layouts[].LayoutInResources[].Resource` must parse to a root with `attrs.container.cw = "2"` and the same `--sp--s0` token-array padding. Scalar zero, numeric object zero, `attrs.common.padding`, or `attrs.style.padding` alone remain compatibility fallbacks only and do not satisfy generated-final validation. Inner form sections, cards, grids, controls, and content wrappers may keep intentional spacing.

Dashboard record-list sections that require the grid-table visual/runtime pattern must use grid-table style `collection` controls, not dashboard `data-list` controls, unless the user explicitly requests Data table. Pair each Collection with a header `flex_grid` in one wrapper container, set both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`, and stop before signing, install, upgrade-check, or handoff if `scripts/validate-dashboard-grid-table-collections.mjs` fails. Planned row-click details require `attrs.data.link`, `attrs.data.opentype = "slide"`, `attrs.data.modalsize = 2`, and a concrete Type `1` custom detail layout with schema-compatible `LayoutView`; hide duplicate dashboard headers with `attrs.hideHeaderAll = true`, preserve the selected Golden Reference typography tokens for titles, subtitles, KPI text, and grid-table headers, include Text style metadata, and never let helper metadata leak into encoded package objects. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

Standard operational dashboards must preserve the Event Portfolio golden-reference export shape: `Main > Content`, clean header band, horizontal filter/action row, KPI card row, section header/actions, grid-table Collection content area, and the approved secondary readiness/grid-table section when planned. Adapt colors, tokens, FontAwesome icons, source lists, fields, metrics, filters, and actions to the current application domain; do not copy Marketing Event field names into unrelated apps. Dashboard blueprints and generated resources must keep machine-checkable `derivedFromGoldenReference` provenance and must preserve required region order, control type, nesting depth, Full-width sections/KPI cards, zero root Content padding, filter contract shape, and `dynamic-user` rendering for user/identity fields. Static filter contract validation is not runtime linkage proof; before claiming filters work at runtime, capture before/after table or KPI values around a selected filter and prove the rendered data changes.

## UI Summary/KPI Runtime Hard Gates

High-quality UI generation must start from a page-by-page implementation contract before dashboard/UI pages are modified. Run `scripts/inspect-yeeflow-ui-design-contract.mjs`, use export-proven style shapes checked by `scripts/inspect-dashboard-style-shapes.mjs`, and use sandbox pages for uncertain rendering patterns before applying them to real pages. Schema validation, signing, install, and upgrade acceptance are not visual proof.

Summary/KPI dashboards must distinguish designer-configured Summary controls, validator-valid Summary contracts, and runtime-proven visible dynamic KPI rendering. Run `scripts/inspect-dashboard-summary-control-contract.mjs`, `scripts/inspect-visible-kpi-runtime-bindings.mjs`, and `scripts/inspect-runtime-evidence.mjs` before claiming UI quality. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; otherwise stop or use an explicitly labeled fallback and record the gap.

UI upgrade packages must preserve installed app lineage. Run `scripts/inspect-yapk-upgrade-app-identity.mjs` with the lineage manifest and `scripts/validate-yapk-upgrade-id-stability.mjs` before signing, upgrade-check, upgrade apply, install-like writes, or handoff. ListSetID, app identity, existing resource IDs, declared change scope, package lineage, and final `Resource.ReplaceIds` coverage must not drift.

##
Designer-qualified approval forms: app plans that include generated YAP approval workspaces must require export-proven control families, unique designer IDs for every form control, native heading/text values (`attrs.headc.title.value` for headings), synchronized labels/native text, full child list/layout/approval metadata, valid `NoRule`, published form status, and app group ID coverage in `Resource.ReplaceIds`. Designer hydration, intended text render, and single-control selection are separate proof levels.
 Canonical Schema Files

YAPK validation uses `schemas/yapk-schema.json`. YAP validation uses `schemas/yap-schema.json`. Do not hardcode versioned schema filenames in runtime logic. To update a product schema standard later, replace the canonical file contents while keeping these filenames unchanged. Keep YAP and YAPK schema standards separate: YAPK uses `AppExportPackageInfo`, Brotli `AppPackageInfo`, and `Childs[].Fields`; YAP uses the YAP wrapper, `[______gizp______]` gzip `ListExportResult`, `Defs`, and `SimplePortal`.

## Generated-Final YAP Contract

For generated new-app `.yap` delivery, schema validation is only the first gate. Apply `docs/standards/yap-generation-contract.md` and `docs/standards/yap-export-shaped-application-generation-standard.md` before claiming a package is import-qualified.

Plan and build from an export-like structure, using the bundled sanitized reference when no user sample is available. Require long numeric-string local IDs, export-observed string IDs for `pageurls`/`childshapes`, complete final `Resource.ReplaceIds`, full root/list/layout/field/form/process metadata, app-level export structures, decoded/stringified runtime-critical validation, and explicit proof-boundary reporting. Do not call API accepted/queued import success.

## Full Application Visual Quality Gate

Vendor Onboarding full UI v2 proved that import/install success is not enough. Do not call a generated package a full UI application unless it implements the approved plan and mockup-derived pages, forms, controls, bindings, and actions at usable quality. Blank or generic Data List custom forms are quality failures. Default/plain buttons without action bindings are quality failures. Default alert copy such as `Alert` or `Here is the description` is a quality failure. Kanban and Collection controls without meaningful dynamic item templates and item actions are quality failures.

For full application generation, run `scripts/inspect-generated-app-quality.mjs --package <package> --spec <approved-spec.md> --strict-visual-app-quality` before handoff. The strict gate must fail missing planned pages/forms, missing print pages, underbuilt dashboards, missing safe padding/card structure, placeholder controls, default buttons, missing actions, empty Kanban/Collection templates, and undocumented deferred scope. Do not return a minimal or technically importable scaffold when the user asked for the full approved application.

Before full application package generation, create a page-by-page composition checklist and get it approved when the app is mockup/spec driven. The checklist must name each required page section, Yeeflow control, source list, displayed fields, layout/card/grid/padding rule, button/action binding, item template, fallback, validation rule, and pass/fail status. Do not generate a package directly from high-level requirements when the user expects a full designed app. The generated package must implement every approved checklist item or explicitly defer it with a reason, fallback, and validation impact. Treat the approved composition checklist as the generation contract; do not generate or return a package unless every required checklist item is implemented or explicitly deferred with reason.


## Template Library Contract

Full application generation must use the reusable Yeeflow UI section template library when one is available. Composition checklist sections must reference a known `templateId` from `docs/templates/yeeflow-ui-section-template-library.normalized.json`, and generated packages must satisfy the referenced template's required controls, data bindings, fields, layout/card/padding rules, style rules, and action rules. Feature knowledge alone is not enough; use reusable UI templates for dashboard headers, KPI cards, alert cards, Data table sections, Kanban/Collection item cards, detail headers, sectioned forms, document checklists, print pages, and action bars.

Inside an installed plugin cache or a repo checkout, the packaged template registry must be available at `docs/templates/yeeflow-ui-section-template-library.normalized.json`; validators should pass it as `--template-library docs/templates/yeeflow-ui-section-template-library.normalized.json`. If this path is missing, treat the installed plugin package as incomplete and refresh/reinstall from the `stable` channel before generation.

Generate full applications page by page. Validate each page/form/dashboard against template conformance before assembling or returning a package. Do not satisfy a template with placeholder controls, title-only cards, default alert copy, blank custom forms, or active buttons without valid action bindings. If a template cannot be implemented safely, explicitly defer the section with a reason, fallback, and validation impact before generation.
Use the reference app corpus as the first source of export-proven UI section patterns before inventing new layouts. Prefer safe patterns from `Company Overview (3).yap`, `Data Lists (4).yap`, `Projects Center_2.yap`, and `Sales_Management_AD.yap` for advanced dashboard controls, custom list forms, Kanban/Collection item templates, actions, Data tables, related-record sections, filters, and operational workspaces. Use `DEMO Innovation Ecosystem Platform (1).yap` / `NHIC Innovation Overview` and `Service Desk Pro (2).yap` / `Executive Dashboard` as KPI dashboard references. Use `Online Library.yap` / `Inventory` and `Print Inventory` plus `Online Library (1).yap` / `Print Inventory` as multi-inventory print and per-item QR references. Use `Sales Quotation.yap` and `Sales Quotation (1).yap` as single-item print and print-QR references. For print pages, QR Code should bind to current item/current record or a business code field; do not generate static placeholder QR URLs. A new broad golden app is no longer needed for known template-library gaps, but browser print/page-break and scanned QR destination behavior still need runtime/manual proof.

During app planning, consider `three_column_workspace_shell` only when the business workflow benefits from an inbox/workbench layout: left context or queues, main work/list area, and right detail/action context. Good fits include service desk inboxes, CRM account workspaces, renewal review, review queues, triage, and task centers. Do not select it for simple forms, simple dashboards, or mobile-first minimal pages. If selected, document the left/main/right panel content, bottom regions, actions, data bindings, host type, and runtime proof boundary in the plan.

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

When generating this pattern, build a row shell with left navigation, ticket/list collection, selected-record workspace, and right attributes/detail regions. Navigation rows should be icon plus text containers with click/form actions. Filter controls and menu actions should set variables consumed by collection filters or queries. Collection item actions should set selected/current record state. Details panels should use dynamic field/user/file controls bound to the selected record only when that exact host/control shape is export-proven for the target surface. For YAP approval/form workspaces, the designer-load-proven baseline is `list`, `container`, `heading`, and `icon`; generated approximations of `collection` and `dynamic-field` caused the form designer to keep loading, so use static designer-safe ticket cards/detail headings unless an exact export-proven control shape is available and validated. Comment/update actions must target the selected record and related activity list only when the binding is validated. Avoid placeholder-only panels, fake Submit Request buttons, and claims of selected-record behavior when the actions and bindings are not implemented.

Before signing, install, upgrade, or handoff, run template conformance when a checklist declares `multi_column_form_workspace_shell`, `four_column_service_desk_workspace`, `service_desk_inbox_workspace`, or `action_driven_ticket_workspace`. Treat `FORM_WORKSPACE_*` findings as generated-final blockers for pages that claim this pattern, including behavior errors (`FORM_WORKSPACE_NAV_ACTION_MISSING`, `FORM_WORKSPACE_FILTER_VARIABLE_MISSING`, `FORM_WORKSPACE_COLLECTION_FILTER_MISSING`, `FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING`, `FORM_WORKSPACE_DETAIL_BINDING_MISSING`, `FORM_WORKSPACE_ICON_ACTION_MISSING`, `FORM_WORKSPACE_FAKE_SUBMIT_BUTTON`) and runtime layout-property errors (`FORM_WORKSPACE_SHELL_LAYOUT_PROPERTIES_MISSING`, `FORM_WORKSPACE_COLUMN_WIDTH_MISSING`, `FORM_WORKSPACE_COLUMN_HEIGHT_MISSING`, `FORM_WORKSPACE_COLUMN_OVERFLOW_MISSING`, `FORM_WORKSPACE_DIRECTION_INVALID`, `FORM_WORKSPACE_ELEMENT_GAP_MISSING`, `FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE`, `FORM_WORKSPACE_VERTICAL_TEXT_RISK`, `FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY`). Use `docs/studies/normalized/service-desk-pro-form-workspace/reference-property-map.normalized.json` before generating this pattern; default-container-only or semantic-only four-column layouts must fail before package handoff. API install success is not runtime interaction proof; manually verify that columns render side by side, navigation filters, selected ticket refresh, detail bindings, comments, and collapse/expand actions work.

When the deliverable is a YAP approval/form workspace, add the v8 Service Desk smoke lessons before import or handoff: use `Data.Forms[].ListID = 0`, add Type `105` app navigation to the form key, align FormKeys/Data.Forms/DefResource keys, generate `DefResource.pageurls[].formdef.children` rather than `formdef.controls`, use lowercase export-style controls, include Start -> SequenceFlow -> End, hide the default form header, set Full width, set padding `0`, set Icon/Text/Button/Dynamic field controls inline when those controls are used, bound icons to nearby text size, and give each workspace column Scroll or Auto overflow. Keep child `ListDatas` as record-ID-keyed objects, not `ListDatas.Datas`; every sample row key must resolve to `Defs[].FieldName`; field `Rules` should remain stringified JSON; Service Desk-style YAP lists should preserve native `Title` and v8-compatible business field numbering from `Text2` onward. Run `scripts/inspect-yap-form-workspace-generation.mjs`; zero hard `YAP_*` errors are required. Treat `YAP_NATIVE_TITLE_SCHEMA_CONFLICT` as warning-only when runtime-safe native `Title` is preserved. Treat API `Status=0` and `Completed=false` as queue acceptance only; wait for runtime/import completion and designer-open proof before declaring success.

For any generated YAP package, rebuild `Resource.ReplaceIds` from the final decoded package after all generation and repair mutations. Include every generated root app, child list, field, layout, form/process, workflow shape/resource, app group, and local sample record ID. Do not copy `ReplaceIds` from a baseline package. The broad Service Desk YAP test failed async import until `ReplaceIds` was rebuilt from the actual final package, increasing coverage from stale baseline IDs to all generated resource IDs. Missing final-package IDs in `ReplaceIds` are generated-final blockers.

## Public Tenant Safety

- Never hardcode a tenant-specific Yeeflow URL. Use `<tenant-url>` in docs and examples.
- For live user-facing API calls, use OAuth; if OAuth is not authenticated, ask the user to sign in through the Yeeflow plugin login flow.
- Do not use `YEEFLOW_API_KEY` for normal plugin/API operation; keep it only as a legacy/deprecated fallback where existing code still supports it.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- Support `YEEFLOW_PROFILE` where scripts support profiles. It selects one active local tenant profile per run using `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and `YEEFLOW_<PROFILE>_TENANT_ID`.
- Validate and redact environment variables before API calls and never print API keys, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, or generated runtime packages.
- Keep generated examples tenant-neutral unless the user explicitly requests a target-tenant-specific package and provides safe mappings.

## Plan-First Full-Scope Generation

For application-generation requests, create `functional-specification.md` as the primary human-readable Functional Specification Markdown file and then `yeeflow-app-plan.md` as the primary human-readable Yeeflow App Plan Markdown file before building a `.yap` or `.yapk` package unless the user explicitly asks only for study/review. JSON files may exist only as companion/projection artifacts for validators, traceability, or tests, such as `functional-specification.trace.json`, `app-plan.trace.json`, or `page-function-plan.trace.json`; JSON must not replace the primary Markdown documents. Save safe Functional Specifications and App Plans under `docs/generated-app-plans/` when suitable for git. If an artifact contains tenant-specific, private, or runtime-generated details that should not be committed, save it outside git and clearly report the path. Run `scripts/validate-planning-artifact-formats.mjs --dir <artifact-dir>` when a planning artifact directory is produced.

Generation must be based on the reviewed Markdown planning contracts first. Companion JSON projections may accelerate validators or traceability checks, but they must be consistent with and derived from `functional-specification.md` and `yeeflow-app-plan.md`; they must not replace, override, or silently narrow those Markdown documents.

Every Functional Specification must follow `docs/standards/functional-specification-standard-template.md` and emit every canonical numbered section in order, including sections that are not applicable with a concrete rationale. Do not merge, rename, skip, or compress required Functional Specification sections. Every full App Plan must follow the canonical `docs/standards/app-plan-standard-template.md`, use the title shape `# <Application Name> - Yeeflow App Plan`, and be saved as the primary Markdown artifact `yeeflow-app-plan.md`. `docs/app-plan-standard-template.md` and `scripts/validate-app-plan-template.mjs` are compatibility entrypoints only; they must validate the same resource-order `yeeflow-app-plan.md` contract as `scripts/validate-app-plan-resource-order.mjs`, not a competing `Yeeflow Application Plan` schema. The App Plan must be organized by Yeeflow resource generation order and must include concrete resource, field, control, workflow, action, proof-boundary, and validation details. It must explicitly choose how Data List records are displayed on pages, plan item-template Dynamic controls for Collection/Kanban/Timeline controls, plan Collection/Kanban item actions or an explicit no-action decision, and plan Sub List list actions or an explicit no-action decision when Sub List controls appear. Do not produce app plans that are only brief object lists.

For generated YAP root dashboards, use the current dashboard shell learned from the Vendor Onboarding v1.93 export: root `Type = 103`, `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and `LayoutInResources = []` when no inline dashboard resource is present. Current dashboards can include inline `LayoutInResources` content; Vendor Onboarding v1.12 proves a simple current-dashboard Data table can import and render without query errors when columns use `Field` for source bindings and `FieldName` for labels. Keep root navigation pointing to the dashboard `LayoutID`, and preserve the import-learned YAP rules: `AppID = 41`, API-issued IDs, populated `ReplaceIds`, integer `Field.Category`, unique IDs, product-schema `ListExportResult`, and child `CustomType = ListSite_<root ListID>`.

The app plan must cover the canonical resource-order template sections in order: Plan Status, Requirement-to-Yeeflow Resource Mapping Summary, Resource Generation Order, Data Lists and Document Libraries Plan, Approval Forms Plan, Form Reports Plan, Schedule Workflows Plan, AI Agents Plan, Copilots Plan, Custom Data List Forms Plan, Data List Workflows Plan, Notifications Plan, Data List Views Plan, Dashboard Pages Plan, Application Navigation Plan, Target Users, Roles, Groups, and Permissions, Plugin Capability and Standards Compliance, Generation Contract and Hard Gates, Validation Plan, Proof Boundary, Assumptions, Deferred or Runtime-Proof Items, and Recommended Next Prompt.

`Generation Contract and Hard Gates` is mandatory for every future app plan. Use `docs/app-plan-generation-contract.md` when present. The section must state the output package decision (`.yapk` by default, `.yap` only when explicitly requested), whether this task should generate a package or only plan, whether API signing is required before handoff, the YAPK signing gate (`POST /utils/apppackage/setsign` and `POST /utils/apppackage/verifysign` when credentials are available), approval-form contract, navigation runtime contract, advanced capability contract, plan-to-package conformance contract, proof-boundary contract, and runtime inspection checklist. A placeholder `Sign` package is not upload-ready; local schema validation alone is not upload readiness.

If the business process includes approval, the app plan must explicitly list the approval form name, request page, task pages, approval statuses, workflow steps, Assignment Task assignee plan, workflow control panel, workflow history, and DefResource requirement. If approval form generation is deferred, mark the app staged/incomplete and get user approval before generation. A generated approval app must not silently ship with `Forms: []`.

Approval form planning must include section names, section purpose, layout, controls, bindings, required flags, read-only flags, default values, autofill/source rules, custom validation rules, descriptions, forms list, workflow node types, email settings, Assignment Task assignee strategy, task/decision settings, and transition rules. For each Assignment Task, list task name, assignment type, required job position name if applicable, source, proof status, fallback, and blocker. Manager-based assignments must use supported expression-editor patterns for line manager, department manager, or location manager. Job-position assignments must use discovered existing, user-selected existing, or admin-created-after-confirmation job positions; never invent job-position IDs or names. Missing job positions block generation unless a confirmed system admin explicitly approves creation/update and the resulting position is used. Job-position writes must not run automatically during generation. Profile/context sections may use a compact Field ID + Display Name table only when they are read-only context and have no default/autofill/validation behavior that affects generation; editable, auto-filled, or validation-sensitive sections need full control metadata.

The navigation contract must require export-proven runtime shape: groups use `Type: "classes"` with `list`, dashboards/pages use `Type: 103`, approval forms use `Type: 105` with `ListID = Forms[].Key`, and data lists use `Type: 1` with `ListID = child list ID`. Do not use `children` or `Childs` for runtime grouped navigation. Every intended page/list/form must be visible in navigation or explicitly marked hidden/deferred.

Ask focused clarification questions before generation when blocking details are missing: app purpose, roles, data lists, important fields, views, custom list forms, statuses, approval flow, dashboards/reports, required actions/workflows, scheduled workflows, notifications, AI Agent/Copilot needs, custom code/custom CSS needs, integrations, package type, or target output. Ask only the minimum needed to avoid a bad package. If uncertainty is not blocking, state assumptions in the plan and proceed.

Generation must not proceed until the Functional Specification completeness gate, App Plan review gate, Business Clarification Gate, Generation Readiness Review, Functional Specification to App Plan traceability gate, and App Plan control/action/property gates pass, or the user explicitly authorizes direct generation from the visible reviewed Functional Specification, App Plan, and assumptions while accepting the documented planning-readiness risks.

Do not default to a simple, MVP, basic, or small v1 package. The default is the complete functional application described in the plan, including all core data lists, fields, forms, dashboards, actions, workflows, and major controls that are safe to generate. Staged generation is allowed only when the user requests it, the app is too large for one safe package, critical information is missing and the user accepts assumptions, or the task is explicitly a focused runtime proof package.

After generation, compare the package against the plan. Do not return the final package until planned data lists, important fields, views, custom list forms/public forms, forms, approval form and task pages when required, dashboards/pages, navigation groups, print pages, major controls, workflows/actions, scheduled workflows, notifications, AI Agents/Copilots/knowledge resources, custom code/custom CSS, Data table display columns, padding/layout quality, permissions/integrations, golden/template references, and required bindings are present or explicitly documented as deferred with a reason and workaround.

All App Plan resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes must come from the active plugin's known skills, standards, validators, template library, control/property knowledge base, extension registry, or export-proven references. The App Plan must not invent unsupported or unconfirmed types, property paths, action shapes, or configuration shapes. Unknown shapes must be marked `export-learning-required`, `runtime-proof-required`, or `deferred` and must not be treated as generation-ready.

## Web App UI/UX To Yeeflow Control Mapping

Design the Yeeflow app like a modern web application first, then map the design to Yeeflow controls. Use the best combination of standard Yeeflow controls, style settings, custom CSS, and Custom code control when needed.

Before selecting controls, understand the business goal, target users/roles, main journeys, data-entry flows, review/approval flows, dashboard/reporting needs, mobile/desktop expectations, what users need to see first, and the actions users perform most often. Decide which pages should be simple, dense, visual, printable, or operational before choosing Yeeflow controls.

Map common web-app patterns deliberately:

- data grid/admin table -> Data table with configured columns, filters, actions, and safe padding
- card list/activity feed -> Collection with Dynamic field/user/image/file controls
- status board/task board -> Kanban with group/category field and item actions
- timeline/history/milestones -> Vertical Timeline or Horizontal Timeline
- multi-section detail page -> Tabs, Toggle, Containers, Grid, Divider, Alert, Steps bar, and Progress controls
- line items/invoice details/purchase items -> Dynamic Sub List with body grid, containers, row actions, and summary settings
- printable record -> Data List custom Print Page with read-only fields and Dynamic Sub List when needed
- process/status visualization -> Steps bar, Progress bar/circle, badges, alerts, and status fields
- quick links/shortcuts -> Icon list or button/card layout
- QR/barcode sharing/scanning -> QR Code and Barcode controls
- embedded report/map/video/page -> Embed control when safe
- attachment/document preview -> Document embed
- highly customized UI -> scoped custom CSS or Custom code control only after standard controls are insufficient

Choose control combinations based on business value, not because a control is easy to generate. Example combinations include dashboard overview with KPI cards, progress circles, alerts, data table/collection, and quick actions; record view with a header summary, tabs for details/history/files, steps bar, line-item sub list, and document embed; approval app with request form, dynamic sub list, approval timeline, print page, and dashboard status board; operations app with Kanban, Collection action buttons, bulk selection, and administrative Data table.

Use Yeeflow styling capabilities intentionally: layout padding, card/container spacing, grid columns, section backgrounds, border radius, shadows/borders where supported, typography hierarchy, status colors, icons, responsive layout, and custom CSS when needed. Generated applications should not look like raw unstyled controls placed on a blank page.

Use custom CSS only when standard style settings are not enough for fixed-width tables, scrollable layouts, spacing/alignment refinement, visual card polish, conditional visual states, print formatting, special sub-list/table layouts, or dashboard grouping. Keep custom CSS minimal, scoped, documented, safe, and never use it to hide broken structure.

Use Custom code control only when standard Yeeflow controls plus style settings/custom CSS cannot meet the requirement. Confirm whether the requirement can be solved with standard controls first, whether custom CSS is enough, whether custom code can be safely embedded and maintained, and what native fallback exists. Do not use custom code as a shortcut for normal Yeeflow controls.

Each app plan must include a `UI/UX and Control Mapping` section. For each page/form/dashboard, list the user goal, chosen layout pattern, selected Yeeflow controls, rationale, data bindings, actions, styling approach, custom CSS/custom code needs, alternatives considered when relevant, and validation checks.

For every Dashboard or page section that displays Data List records, the App Plan must include a record display control selection. Allowed display controls are Data table, Collection, Kanban, Vertical Timeline, and Horizontal Timeline. Prefer Collection over Data table when both can satisfy the requirement unless the business explicitly needs a dense native grid. Use Kanban for status/lane/work-board patterns, Vertical Timeline for activity/history/audit/event feeds, Horizontal Timeline for roadmap/phase/lifecycle/milestone progression, and Data table only for true tabular grids. The selected control and reason must be stated before design images, page blueprints, or package generation.

For every Collection, Kanban, Vertical Timeline, or Horizontal Timeline, the App Plan must list item-template Dynamic controls and bound source fields. Collection/Kanban/Timeline templates must not be empty. User/person displays must bind to User/person fields, status or priority displays must bind to supported Choice/display fields, and unsupported Dynamic controls or property paths must be marked `export-learning-required`, `runtime-proof-required`, or `deferred`.

For every Collection or Kanban, the App Plan must either state `No Collection/Kanban item actions required` or list item actions with trigger control, action type, current item context, temp variables, steps, data read/write targets, and runtime proof boundary. For every Approval Form or Custom Data List form that includes a Sub List, the App Plan must either state `No custom Sub List actions required` or list Sub List actions with current row context, steps, affected Summary fields, parent field bindings, and runtime proof boundary.

For every generated custom Data List New/Edit/View form that displays current-record fields, the App Plan must include a Form Fields Layout Template Selection table selecting `data_list_form_fields_grid_v1_1`. State each field group, PC/laptop columns, tablet columns, mobile columns, full-row field controls, and any Dynamic display grouping. Current-record fields must be generated inside `form_grid_fields_wrapper` within the page-level template's `section_content_area`; do not place field controls directly in `section_content_area`. Generated field controls must have business-specific `nv_label`/`nav_label` values. Sub list fields must clone `data_list_form_control_sublist_v1_1`; do not emit simplified `list` controls.

## Visual Design To Implementation Workflow

When the user provides UI mockup images, screenshots, generated design images, wireframes, or asks Codex to design images first, treat those visuals as implementation references, not decoration. Before package generation, extract a Markdown UI implementation spec from the visual design.

Suggested safe path:

```text
docs/generated-app-plans/<safe-app-name>-ui-implementation-spec.md
```

If the spec would include private image references, tenant data, customer names, raw payloads, or private IDs, save it outside git and report the path.

The UI implementation spec should capture pages, sections, layout hierarchy, Yeeflow controls per section, data list bindings, fields displayed, form fields, Data table columns, Collection/Kanban/Timeline item template fields, actions, workflow/form actions, style settings, custom CSS requirements, responsive considerations, print-page formatting, and validation checklist.

Preserve design quality during generation. Do not simplify a rich mockup-backed design into a blank/simple page or minimal app unless the user explicitly asks. Do not omit major pages or visible controls from the mockup. Do not generate Data tables without columns, Collection/Kanban/Timeline controls without meaningful item templates, or forms without safe padding and card/section layout.

After generation, validate against both the app plan and UI implementation spec with `scripts/inspect-generated-app-quality.mjs --package <package> --plan <plan.md> --spec <ui-implementation-spec.md>` when available.

## Generated Application UI Quality Gate

Before package generation, create a short UI plan that names the pages, major sections, data sources, controls per page, fields shown in every data-bound control, and the padding/container approach. Prefer fewer well-configured controls over a broad unfinished dashboard.

Default generated dashboards and Data List custom forms must use safe outer spacing. Use an outer page section/container with desktop left/right padding around 24px to 32px when the schema supports it, with smaller responsive padding for tablet/mobile. Do not place major controls directly against the page or window edge. Group important content in sections, cards, or containers with readable row and section spacing.

Do not generate empty or unconfigured controls. Every generated Data table must configure a data source and at least 3 to 5 meaningful display columns when fields are available, including title/name plus status, date, owner, amount, or progress fields where relevant. Dashboard Data table columns must include `Field` for the actual source field internal name and `FieldName` for the visible label; `FieldName` alone is not enough. If suitable fields are unavailable, use cards, Collection, or a simple message instead. Empty Data table display configuration or missing source `Field` bindings are generated-final hard errors.

Every data-bound control must resolve its source and field bindings before handoff. Collection, Kanban, and Timeline templates need meaningful dynamic fields; progress, steps, QR/barcode, embed, document embed, and buttons/actions need valid values, bindings, or actions. Run the generated UI quality gate together with package validation and do not claim the package is ready when table, dashboard, or form quality checks fail.

Fail the quality review when controls are selected without business rationale, Data tables have no columns, Collection/Kanban/Timeline templates are empty or too minimal, dashboards/forms lack padding or grouping, advanced controls lack meaningful content, Custom code is used where standard controls would be better, or the package does not match the `UI/UX and Control Mapping` plan.

Use this skill when the user provides business requirements, process documents, forms, screenshots, SOPs, sample exports, workflow requirements, or app ideas and asks Codex to build, implement, create, generate, test, or output a Yeeflow application package, `.yap`, or `.yapk`.

YAPK-from-scratch rule: when the requested deliverable is a generated `.yapk`, the builder must still treat the inner application as the first deliverable. Build and validate `AppPackageInfo` content before Brotli/base64/sign. Do not sign if package/app creation validators, graph validators, workflow publish-readiness checks, or placeholder scans fail. `setsign` and `verifysign` prove wrapper/resource integrity, not generated-app correctness or tenant-specific routing. Preserve the proof boundary and write generated `.yapk` output outside git.

YAPK schema v2 rule from Vendor Onboarding v1.13-v1.15, updated for v0.6.18 canonical schema: generated `.yapk` output must be `AppExportPackageInfo` with `Resource = base64(Brotli(AppPackageInfo JSON))`. Do not put YAP `ListExportResult` in YAPK `Resource`. Use `Childs[].Fields`, not `Defs`; preserve `LongAsString` fields as strings; omit optional no-portal structures unless a proven portal module is generated; keep `AppID = 41` where the import rules require it; use API-issued IDs for new generated package/object IDs; validate remap/ID coverage for the final decoded `AppPackageInfo` instead of carrying stale IDs from a prior version; and validate current-dashboard Data table `Field` bindings before signing.

## YAPK-First Application Delivery Workflow

New Yeeflow application delivery defaults to `.yapk`, not `.yap`. Generate `.yap` only when the user explicitly asks for YAP, when a product-team/debug task is specifically about YAP import, or when a documented fallback requires it. For new apps, build and validate the inner `AppPackageInfo`, then produce a YAPK package for manual install or package-API install.

Before delivery, inspect local environment presence without printing values. If package automation is requested, use OAuth `flowcraft` workspace discovery and ignore local `YEEFLOW_WORKSPACE_ID` for package write target selection; never auto-install without explicit confirmation and an explicit user-selected workspace passed with `--selected-workspace-id` or documented user-selected `--workspace-id`. For existing app changes, generate a versioned YAPK and use upgrade automation only after the target app/package is clearly identified, safe, and confirmed. Classify package API results as `success`, `already_installed`, `api_rejected`, or `http_rejected`; handle `already_installed` by recommending upgrade flow, cleanup, or a renamed/new-version package rather than retrying blindly.

This skill is the top-level application-building controller. It coordinates proven generator skills:

- `yeeflow-application-generator`
- `yeeflow-data-list-generator`
- `yeeflow-approval-form-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-expression-generator`

Use `yeeflow-feature-learning-orchestrator` instead when the task is primarily to learn an unknown Yeeflow platform feature from exports, screenshots, runtime tests, or manual fixes.

## New Capability Runtime Gate

When a requirement depends on a newly learned or partially understood Yeeflow capability, do not silently fold it into a normal app build as if it were runtime-proven. Use `yeeflow-feature-learning-orchestrator` first for export-backed learning, then make an explicit runtime decision before broad app generation or merge.

For new capabilities, require one of these labels in the plan and final report:

- export-proven only
- validator-backed only
- planning-guidance only
- import-proven only
- configuration-visible only
- render-only proven
- partial runtime proof
- runtime-proven for a specific tested host/scope

Recommend a focused runtime baseline before depending on the capability when generated package behavior, imported rendering, workflow execution, app setting rendering, AI/email/external execution, custom code execution, document upload/persistence, user/group membership, permissions, or row mutation is involved. Keep runtime baselines small and focused; do not use a full business app to prove a new platform schema unless the user explicitly accepts that risk.

## Application Capability Planning Checklist

Before implementation for any full application build, create a `Capability Coverage Plan`. Use `docs/studies/application-planning-capability-coverage.md` when present. The plan should consider the current learned capability set, select only capabilities that serve the business process, mark partial/unproven areas honestly, and assign each selected capability to the right specialized skill before package generation starts.

Cover these planning areas:

- Core resource model: data lists, approval forms, document libraries, dashboards, reports, follow-up/task lists, master/reference lists, transaction lists, and custom forms.
- AI experience: whether the app needs a Copilot, quick prompts, local resource tools, connected Agents, image upload, or attachments.
- AI Agent design: reusable Agents, required input/output variables, image/file inputs, Access application resources tools, create/update/read behavior, email draft/summarization/scoring/recommendation tasks, and human-review boundaries.
- Workflow and automation: data-list workflows, approval workflows, scheduled workflows, triggers, `QueryData`, `AI`/AI Assistant, `MailTask`/Send email, HTTP/API/resource actions, and which execution steps must remain disabled or deferred during runtime tests.
- Document management: document libraries, generated folders, custom document fields/views/forms, and Doc library controls on dashboards or forms.
- Navigation and application shell: default or custom navigation, navigation groups, top-level resources, grouped resources, layout `default`/`left`/`onheader`/`none`, header title visibility, export-proven header height settings, and app user groups.
- Permissions and users: app user groups, role-based experiences, permission-sensitive screens, and the current boundary that user-group member assignment is not export-proven and must not be generated with real users.
- Integrations and connections: HTTP API, OAuth, OpenAPI/REST tools, external calls, post-import connection setup, credential safety, and execution deferral.
- Runtime and validation plan: import-proof target, runtime-proof target, render-only or validation-only areas, validators to run, and artifacts/private data that must never be committed.

For any generated Data List that users will create records in, include a runtime-safe Add form plan. `ListModel.LayoutView.add` must resolve to a generated or export-backed Type `1` custom form layout; `opentype.add` and `modalsize.add` alone are not enough. The focused fixed Container/Button action package is user-confirmed to render the default `+ New item` Add modal for `Action Runtime Requests` after this shape was corrected, but save/data mutation and other hosts remain separate proof items. Validate the default `+ New item` path locally and include manual runtime verification of the Add modal rendering when the app depends on user-created list records.

For requirements that need actionable dashboard cards, Kanban lanes, item edit/delete buttons, selection checkboxes, or bulk update/delete behavior, use `docs/studies/collection-kanban-actions.md`. Collection/Kanban item actions are export-proven as local `attrs.actions[]` on the host control, with item-template controls binding through `attrs.control_action` and current-item context through `__ctx_coll` / `ListDataID`. Plan selected IDs/count as dashboard temp variables, use dynamic display rules for checked/unchecked icons and bulk toolbar visibility, and validate all local action bindings and variable references. Keep actual edit/delete/update/select/bulk execution as a focused runtime-test item unless that specific generated package has been tested.

The focused generated package in `docs/studies/collection-kanban-actions-runtime-proof.md` is the correct-project runtime-proven package for this pattern. It includes one Data List, one dashboard, Collection and Kanban controls, local item actions, current item context, selection state, checked/unchecked icons, selected count, and bulk update/delete actions. Scope the runtime claim to the user-tested v2 package and the tested behaviors only.

Correct-project v2 package: `<local manual-test package path>` generated by `generate-collection-kanban-actions-runtime-proof.mjs` imported and passed the user runtime checklist for dashboard open, Collection/Kanban render, Edit item, Delete item, Mark current item as Completed, selection toggle, selected count, bulk toolbar, bulk mark completed, and bulk delete. Do not generalize beyond this package and these actions.

If planning depends on real users, departments, locations, or positions, use `yeeflow-api-operator` only when local credentials are present and the user wants authorized lookup. Do not invent org/reference data when safe API lookup is available, but do not require API access for ordinary package generation. Keep generated packages free of private user data unless explicitly required, narrow in scope, and safe; prefer placeholders, empty app groups, requester/current-user expressions, or post-import configuration.

Every `Capability Coverage Plan` should include:

- selected capabilities
- intentionally excluded capabilities
- deferred or unproven capabilities
- runtime test boundary
- safety boundary
- skill and validator dependencies

Before generation, self-check that the plan considered all available learned capabilities without overusing irrelevant ones, assigned each selected capability to the correct skill, marked proof gaps honestly, and named validation/runtime-test boundaries.

## Application Settings Planning

When requirements mention application navigation, header appearance, menu layout, or app user groups, use the runtime-proven application settings model from the active workspace docs. Generate these settings in the root app `Data.Item.ListModel.LayoutView` JSON string: `sort[]` for menu structure, `attrs["navigator-menu"].position` for layout, and `attrs.appearance` for header fields.

Use `Type = "classes"` for custom navigation groups, keep groups top-level only, keep depth to two layers, require group `Title`, use optional resource `DisplayName` for custom text, omit `DisplayName` for resource-name fallback, and use `Icon: ""` for no-icon. Supported layout values `default`, `left`, `onheader`, and `none` are runtime-proven for generated packages. `attrs.appearance.height = 46` and `hideTitle: true` are runtime-proven together; additional header heights remain unproven. User groups may be generated as empty `Data.AppGroups[]` records with fresh IDs in `ReplaceIds`; do not generate real users, emails, or members until member schema is proven.

## Custom Code Planning

Use custom code as an advanced application component only when the business interaction cannot be delivered cleanly with standard Yeeflow controls, lookup settings, expressions, form actions, workflow actions, or dashboard widgets.

Use custom code when:

- standard Yeeflow controls cannot provide the required interaction
- advanced lookup/picker behavior is needed, such as a reusable search-select component over a large master list
- dynamic UI logic is too complex for standard controls, form actions, lookup filters, or expressions
- a reusable business component already exists and is appropriate for the target app
- the business value justifies the maintenance and runtime-test cost

Avoid custom code when:

- standard controls can solve the requirement
- behavior is simple enough with form actions, lookup, Query data, expressions, dynamic display, or workflow actions
- the script depends on unsupported or unproven runtime APIs
- the app must remain fully no-code for maintainability
- the behavior affects approval routing, financial authority, security, or persistence and can be implemented server/workflow-side

Planning questions before adding a Custom Code control:

- Which page or form needs the component?
- Is the placement a dashboard, approval form, data-list custom form, or public form?
- What inputs does the component need?
- Are inputs static, field-based, variable-based, temp-variable-based, or expression-based?
- Does the component write back to Yeeflow variables, fields, or temp variables?
- Is the component read-only or interactive?
- Is the component safe for public forms and anonymous/limited-permission users?
- What native fallback exists if the component fails?

When an existing script is used in an app package, coordinate with `yeeflow-custom-code-generator` for the script's parameters and with the relevant page/form generator for placement. Do not generate a Custom Code control unless the script is available or generated as part of the app package, required input parameters are configured, and a focused runtime test plan exists.

## Core Behavior

Think like an experienced business consultant and Yeeflow solution architect:

- understand the business goal before designing fields
- identify mandatory core business capabilities before proposing generation scope
- do not defer a feature that is central to the stated business process merely because it is technically sensitive; mark it as a required generation item, required focused runtime proof item, or explicit exclusion with fallback behavior instead
- recommend the best Yeeflow-native application structure
- separate full-scope must-haves from true future enhancements without defaulting to a simple/MVP first package
- separate business decision gates from technical runtime assumptions
- ask the user/business owner to confirm business decision gates before generation, unless they explicitly approve default assumptions
- present unanswered business decision gates directly in the Codex chat and stop before generation until the user answers or explicitly approves defaults
- prefer a working, high-quality app over an overloaded first package
- use proven runtime-safe patterns from the installed skills
- mark unproven features clearly and test them before depending on them
- make reasonable assumptions when requirements are unclear, document them, and keep moving unless the assumption would be risky
- when requirements imply multiple selectable business items, evaluate a sublist/listref design early instead of forcing a single lookup field
- when requirements include requester/applicant/employee identity, decide whether proxy submission is allowed; if the applicant field is editable, its change action must rerun profile snapshot and dependent policy/quota calculations
- when requirements include quota, benefit eligibility, or tenure rules, decide the quota cycle, occupation timing, release behavior, and eligibility source before generation
- every generated data list must have an active runtime purpose in the planned application or be explicitly deferred out of the package
- master/reference data lists named in requirements must be real active generated lists with fields, views, current-standard custom forms, and sample/reference rows when forms, lookups, dashboards, or workflows depend on them; do not leave them as placeholder concepts
- line-item planning must explicitly choose one persistence model: workflow sublist summary only, direct child-row persistence, or a separate transaction item list with its own runtime proof and reporting purpose
- availability, stock, booking, quota, or capacity logic must be labeled honestly as manual review only, query-based availability, or inventory/reservation based; never present review routing as true stock control
- generated dashboards must be meaningful enough for the planned application workflow while staying inside runtime-proven dashboard patterns
- dashboard KPIs, summaries, report sections, queues, analytics, trends, and charts must be implemented with data-bound dashboard controls, not static Text mockups. Use Summary controls for counts/totals, data-list or proven Collection controls for queues/report tables, and chart controls when the chart model is known/proven. Do not remove planned chart controls merely because the initial source list is empty; seed or confirm representative records before deciding chart validity. Use functional list/table fallbacks only for structural chart failures, or as complementary drill-down/reporting views beside working charts
- do not mark dashboard runtime proof as passed only because a page renders; verify source-list bindings, dashboard layout-resource `exts`, `ReportIds`, and at least one value/list/empty-state coming from the expected data source
- runtime-unproven features must be marked as required focused proof items or deferred with fallback behavior before final package claims
- workflow routing variables must be required, auto-derived, or protected by fallback branches so no approval path can dead-end on empty/unexpected values
- decide package type before generation: output `.yapk` for a new/cloned application by default, output `.yap` only when explicitly requested or needed for a documented fallback/debug task, and output versioned `.yapk` for an existing-app upgrade from a Yeeflow Version management baseline package
- for `.yapk` upgrades, preserve app identity and stable object IDs; do not apply fresh-ID `.yap` import-generation rules unless adding newly proven resources

## Default Lifecycle

For requirement-to-application requests, load `references/requirement-to-yap-generation-lifecycle.md` and follow it end to end:

1. Requirement intake
2. Functional Specification generation
3. Functional Specification review/validation gate
4. Yeeflow App Plan generation from reviewed Functional Specification
5. App Plan review/validation gate
6. Business clarification gate
7. Generation-readiness review
8. Resource/package generation
9. Local validation
10. Runtime import/testing only when requested or authorized
11. Runtime issue fixing
12. Documentation
13. Skill updates only if new reusable knowledge is learned
14. Git commit/push
15. Final package output

## Package Type Gate

Before generation, clarify whether the user wants:

- a new application package (`.yapk` by default, or `.yap` only when explicitly requested) for import/install as a separate app, or
- an existing application upgrade package (`.yapk`) for Application Settings -> Version management -> Upgrade application.

For new applications, default to the YAPK delivery workflow: fresh generated identity, safe FlowKey/form key, full local app/form/list validation, decoded `AppPackageInfo` validation, and YAPK install as a new app. Use normal `.yap` rules only when the user explicitly requests a `.yap` or the task is a YAP fallback/debug proof.

Materialization hard rules for new `.yap` packages:

- allocate `FieldID` values globally across the app; do not reset per data list
- preserve parent `ListID` on every field
- keep `FieldName`, `InternalName`, and `DisplayName` unique inside each data list
- preserve real `TenantID`, `CreatedBy`, and `ModifiedBy`; do not remap them and do not include them in `ReplaceIds`
- keep all generated numeric-looking IDs within signed `System.Int64` range; Yeeflow import can parse child `LayoutID` as `Int64`, so oversized 20-digit IDs block import
- for generated app-contained AI Agent/Copilot resources, use numeric `Publisher: 0` instead of `Publisher: null`
- for app-contained Access application resources tools, use compact `{ id, permissions }` entries with numeric bitmask permissions, not string arrays
- for data-list workflows, use export-like workflow designer graph metadata so the imported workflow designer can open
- verify root dashboard/page navigation and Type `103` ownership with materialization inspection
- do not runtime-test custom code controls until the imported app opens with real dashboard/list/form content and generated fields are visible

For existing application upgrades, request a baseline `.yapk` downloaded from Yeeflow Version management. Preserve `PackageId`, `TenantID`, `AppID`, `ListID`, stable object IDs, and other app identity fields required for upgrade. Do not generate a `.yap` when the user asked to modify the already-imported app unless they explicitly want a cloned app.

Current `.yapk` limitation: product schema defines the wrapper as `AppExportPackageInfo` and describes `Resource` as Brotli-compressed `AppPackageInfo`, but readable historical artifacts did not verify that Brotli decode path in the current study. For `.yapk` work, use `yeeflow-yapk-package-generator`; the normal `.yap` application generator must not own `.yapk` content generation. Until Yeeflow Resource decode/edit/encode/sign/verify/runtime-upgrade is proven, Codex must not output externally edited app-content `.yapk` packages as valid upgrades; use Yeeflow Version management to generate official `.yapk` packages or produce a `.yap` clone/change plan.

Also load `references/business-solution-design-principles.md` before designing the app structure.
For generation-readiness reviews, also load `references/business-decision-gates.md`, `references/application-design-quality-gates.md`, and `references/application-planning-key-design-decisions.md`.
During final validation and runtime planning, also use the active workspace checklists when present:

- `docs/yeeflow-runtime-test-checklist-template.md`
- `docs/yeeflow-application-generation-review-checklist.md`

## Business Decision Gates

Before generating a real `.yap`, identify business choices that materially change workflow, validation, data persistence, pricing, quota logic, attachment rules, dashboards, or approval responsibility.

Treat these as confirmation gates, not technical notes. `default-applied-for-planning` may be used only to create Stage 1/Stage 2 planning artifacts and run planning validators. Stop before design images, blueprints, resource generation, package generation, signing, install/upgrade, or runtime proof if business-critical gates are unanswered, only default-applied-for-planning, or otherwise not explicitly answered or `user-default-approved-for-generation`.

### Business Clarification Gate

When unanswered business-critical decisions exist, ask them directly in the Codex chat after the initial app plan/spec is created or updated.

Use this exact chat format:

```text
Business clarification required before generation:

Artifacts:
- Functional Specification: <path>
- Yeeflow App Plan: <path>
- Validation report: <path or not generated>

Validation summary:
- Functional Specification structure: pass/fail
- App Plan resource order: pass/fail
- Functional Spec to App Plan traceability: pass/fail
- Generation Readiness structural check: pass/fail
- Business Clarification Gate for planning: pass/fail
- Business Clarification Gate for generation: blocked until user approves defaults or answers gates
- Overall generation readiness: blocked by Business Clarification Gate
- No package generation was performed

Unresolved business decision gates:

1. <gateKey>: <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

2. <gateKey>: <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

Approve all recommended defaults for generation for: <gate1>, <gate2>, ...

No package generation will proceed until the business gates are answered or explicitly user-default-approved-for-generation.
```

List every unresolved business decision gate from the Functional Specification and App Plan by key and question. Deduplicate repeated gates by gate key when the same unresolved decision appears in both artifacts: report the raw finding count, unique unresolved gate count, and unique gate keys from `validate-business-clarification-gate.mjs` JSON output. If the final response offers "approve all recommended defaults", it must name every unresolved gate covered by that approval option and must say whether the approval is for planning only or for generation. Do not collapse five unresolved gates into three visible questions or rely on an ambiguous "approve defaults" sentence. Never write only `Validation results: all passed` or `all passed` when generation-mode Business Clarification is blocked.

After outputting this block, do not continue to package generation in the same turn. Wait for the user's answers or explicit approval of the recommended defaults.

Examples:

- quota cycle policy
- quota occupation/release timing
- mandatory approval roles
- pricing ownership and manual override policy
- exact attachment requirements by scenario
- whether dashboard surfaces belong in the full planned package or a later explicit phase
- status lifecycle
- compliance/audit handling
- integration responsibility
- role permissions
- what happens on approval, rejection, or resubmission

Technical assumptions are different. Token shapes, tenant profile completeness, query-data behavior, conditional ContentList behavior, route-condition behavior, and validator/runtime quirks should be tested during generation/runtime validation and handled with fallback.

App specs should record decision gates using this shape:

```json
"businessDecisionGates": [
  {
    "key": "quotaCycle",
    "question": "Should quota reset by calendar year or employee anniversary year?",
    "options": ["calendarYear", "employeeAnniversaryYear"],
    "recommendedDefault": "calendarYear",
    "requiredBeforeGeneration": true,
    "status": "unanswered"
  }
]
```

## Mandatory Full-Scope Capability Rule

Do not incorrectly move core business capabilities to a later phase. If a capability is essential to the requested business process, keep it in the planned package as either:

- a proven implementation item, or
- a required runtime proof item with a documented fallback.

Only defer true enhancements, integrations, advanced analytics, admin configurability, scheduled automation, or optional polish.

## Design Quality Gate

Before accepting generated approval forms, run a design-quality review using `yeeflow-approval-form-generator`.

Generated app packages must fail readiness if the approval form does not follow the learned Yeeflow design structure:

- page-level background, not `Main` background
- `Main` / `Content` / `Form body` / `Form bottom`
- Form header / request summary
- two-column grids for normal fields
- full-row layout for textarea, upload, list/sublist, rich text, and long helper/guidance content
- learned Text control standard, inline width by default
- meaningful `nv_label`
- Action Panel and Flow History in Form bottom

## Proven Standards To Apply

Use the current Yeeflow generation foundation by default:

- fresh ID family
- fresh FlowKey/form key
- FlowKey/form key must be safe against Yeeflow import replacement: its lowercase text must not appear inside reserved JSON property names such as `prefix`, `suffix`, `field`, `fields`, `profile`, `definition`, `workflow`, `variable`, `filter`, `ref`, `href`, `control`, `collection`, `condition`, `expression`, `attributes`, `actions`, or `binding`. Known failure: FlowKey `EFI` corrupted summary binding key `prefix` into `pr<runtimeFlowKey>x`.
- `Data.Forms[].ListID = 0`
- native Title metadata on generated data lists
- requester/current-user assignment instead of hardcoded tenant users
- page-level background, not `Main` background
- learned Text control standard
- Text controls inline width by default
- Main / Content / Form body / Form bottom
- Action Panel and Flow History in Form bottom
- two-column grids for normal fields
- full-row long controls and sublists
- meaningful `nv_label`
- approval-control runtime coverage
- expression generation rules
- sublist current-object expressions
- sublist summary binding
- workflow numeric routing
- latest workflow transition condition operand wrappers for direct selectors, direct values, and expression-editor operands
- form actions Phase 1 and Phase 2
- correct `attrs.querydata_filters`
- expression-editor token arrays with `showCus: false` for Query data filter values that reference workflow variables or calculations
- `arraySum`
- `JSONStringfy`
- readable lookup summary variables
- multi-item product/service/request lines should use sublists with row calculations and summary-bound total variables when the business process allows multiple selections
- policy-critical totals from sublists should be recalculated in quota/submit/routing/persistence preflight actions with `arraySum(<ListVariableId>, "<SubtotalFieldId>", [], [])`, even when a visible summary binding is present
- applicant/requester variables should be fixed business identities; Current User may default the applicant on a new request, but applicant profile reads, quota checks, workflow routes, and persistence should use the requester/applicant variable or snapshot variables
- editable applicant/requester controls must rerun dependent snapshot/profile/quota form actions on change when proxy submission is allowed
- user-profile-derived applicant data should be snapshotted into workflow/form variables, displayed readonly, and persisted through ContentList when needed for reporting/audit
- quota and benefit usage lists should include applicant identity, readable applicant name, cycle number/year, amount, status, and source application number
- if quota is occupied on submission, create the usage/occupation record when the workflow starts, include in-progress and approved/confirmed records in future quota checks, and release/update the matching record on rejection or final approval using a stored request/form/workflow correlation key
- employee-anniversary quota cycles should use a numeric cycle field when comparing usage records; for boarding-year eligibility, `ApplicantBoardingYears = dateDiff(ApplicantBoardingDate, now(), "year", [])`, with `0` meaning no family quota and values greater than `0` meaning eligible
- configuration lists such as attachment requirement rules must be read by form actions, workflows, dashboards, or reports in v1; otherwise remove/defer them instead of shipping dead configuration
- master data lists such as Equipment Catalog, Visitors, Departments, Products, or Resource Catalog must be generated as usable runtime lists when lookups/forms depend on them; include maintainable sample/reference rows for local validation unless the dependency is deliberately external and mapped
- do not ship generated data lists that only make the app plan look complete; each list must be opened by navigation/dashboard, queried by form actions, written by workflow, or explicitly identified as a maintained master/reference list
- request line items must declare whether they are stored only as a parent readable summary, stored as direct child rows, or stored in a separate transaction item list; direct child-row persistence remains runtime-proof scoped unless a current baseline proves it for the target pattern
- review-only availability decisions may route to an admin/security/equipment reviewer, but they are not inventory control. True stock/availability requires query-backed stock status or reservation/decrement/update behavior with focused runtime proof
- workflow branches from approval/review nodes must cover normal, exception, empty, and unexpected routing-variable cases; unknown policy values should route to review/fallback, not to a dead end
- core policy checks such as quota validation should run automatically on submit, not only through a manual check button
- submit guard actions should prove both the invalid/warning path and the valid path; conditional warning/confirm/check steps before submit usually need step-level `continue: true` so valid requests skip the warning and still reach Submit form
- required applicant identity controls with Default value = Current User should not also get redundant page-load Set variable default steps
- multi-value Set variables should be used only for independent assignments; keep ordered Set variable steps when later values depend on earlier assignments
- temp variables are frontend-only
- ContentList persistence rules

## Stop And Defer

Do not blindly implement every requested detail if it would make the package unsafe, unimportable, or dependent on unavailable tenant data. Defer features only when they are optional, integration-heavy, advanced, unclear, explicitly moved to a later phase by the user, or likely to make the full planned package hard to import and test. For generated applications, the approved app plan is a contract: every planned list, form, workflow, page, report, agent/tool, integration, permission/admin resource, and navigation group/item must be implemented, explicitly deferred with a reason, or marked unsupported/unproven in the plan-conformance report.

Do not use "runtime-sensitive" alone as a reason to defer a core business capability. For core capabilities, require focused runtime proof and fallback behavior.

Stop before generation when:

- mandatory business decision gates are unanswered
- required full-scope capabilities have been misclassified as future-phase enhancements
- approval form design quality gates are not represented in the plan/spec
- generated form structure lacks grid-based field layout or Form bottom action/history placement

Use `yeeflow-feature-learning-orchestrator` when a requested app needs an unproven platform capability that should be learned from exports before production-style generation.

<!-- projects-center-import-failure-hardening:start -->
## Generated App Import-Readiness Handoff

For newly generated `.yap` packages, compatibility validation is not enough. Before final handoff, require strict package validation, strict graph validation, materialization inspection, schema-standard inspection, app-creation rules inspection, data-view/dashboard/page reference checks, wrapper round trip, placeholder scan, and safety scan. Prefer `scripts/inspect-yap-import-readiness.mjs` when available.

The Projects Center fixed package import is user-proven only for the repaired Projects Center package. Do not claim broad app open/use, data entry, document-library upload/folder behavior, report execution, or workflow proof from that incident. Missing `ListType`, unsafe native `Title` metadata, unresolved view columns, mismatched `LayoutInResources` IDs, unresolved dashboard dynamic-display/filter references, and tenant/user metadata in `ReplaceIds` must block generated-package handoff.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Actionable Dashboard Business Choices

When translating requirements into dashboard actions, choose Container/Button action types by business intent: Link for URL destinations, Add list item for quick-create data/document flows, Open dashboard for navigation and drill-down, Open approval form for starting workflow requests, and form/page Action binding for local front-end logic when the host schema is proven.

Use structural Yeeflow targets instead of raw links for resources included in the generated app. Generated applications must validate Container/Button action targets and open behavior before `.yap` handoff, and runtime navigation/open behavior remains unproven until clicked in a focused runtime test.
<!-- container-button-action-settings-learning:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Dynamic Content Planning

For business requirements that need repeated line items with a custom row/card/table layout, consider a Sub List with Dynamic content layout before custom code. Approval Form evidence from `docs/studies/sub-list-dynamic-content.md` proves that Dynamic Sub Lists can place visual/layout controls inside each item template, including containers, grids, text/input controls, icons, dropbars, and action buttons.

Plan list actions as Sub List scoped actions: Add sub item and Import items act on the current list; Duplicate item and Delete item act on the current object; Insert before/after current item uses positioned `list_new` steps; Move up/down use `list_move` with Move down carrying `attrs.moveMode = "2"`. For business line-item tables, prefer a visible Delete column plus a row operation menu for Duplicate, Insert before, Insert after, Move up, and Move down. Do not promise runtime execution, save/mutation behavior, current-object expression evaluation, or Data List custom form behavior unless a focused runtime proof covers that exact host and operation.

For runtime follow-up planning, use `generate-sub-list-dynamic-actions-runtime-proof.mjs` and `docs/studies/sub-list-dynamic-actions-runtime-proof.md` as the current minimal candidate: one Approval Form, one Dynamic Sub List, header grid, row fields `Item Name`, `Quantity`, and `Notes`, and actions `list_new`, `list_dup`, `list_del`, and `list_import`. Treat business designs that depend on these actions as pending manual runtime confirmation until the generated package is imported and exercised.

For business table-style line items, prefer the corrected Dynamic Sub List grid pattern over custom code when it fits: one visual section, caption-off header grid, caption-off Dynamic Sub List, matching body grid inside `list-body`, and aligned action/field/icon columns. Treat V1.2 as pending until manual runtime confirms the corrected header/body layout and selected actions.

For quote/invoice/proposal scenarios that need print output, `Sales Quotation.yap` export-proves a Data List `Quotation` custom form named `Print Page` with a read-only Dynamic Sub List for line items and a View form button/action that calls it through a `type = "print"` form action step. Generate print pages as dedicated Type `1` custom forms, bind Dynamic Sub List row displays to a real Sub List field, resolve row fields from `Rules["list-variables"]`, hide edit/add actions on read-only print displays, and keep runtime print execution claims pending until the user tests the print preview.
<!-- sub-list-dynamic-content-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Kanban/Collection Dynamic Controls Planning

For business apps that need grouped work cards, activity collections, or read-only record headers, prefer native Kanban, Collection, and Dynamic controls where the source list and field bindings can be resolved. `Company Overview.yap` export-proves Dashboard Kanban/Collection item templates using Dynamic controls with source `3`, and a Data List `View page` using Dynamic field controls with source `4`.

In plans and final reports, separate export-proven schema from runtime proof. `kanban-collection-timeline-runtime-proof.v1.yap` proves import/open/render stability for the focused generated dashboard package containing Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values. It also proves Dynamic user/image/file controls do not crash with empty values. It does not prove Kanban drag/drop, item click behavior, non-empty dynamic user/image/file display, preview/download behavior, or Data List custom form runtime rendering.

## Timeline Controls Planning

For business apps that need chronological or time-progression views, consider native Vertical Timeline and Horizontal Timeline before custom code. `Company Overview (1).yap` export-proves dashboard `timeline-v` and `timeline-h` controls bound to a Data List and using Dynamic controls inside item templates.

Use Vertical Timeline for activity feeds, history, lifecycle logs, audit/event streams, approval history, and vertical milestone flows. Use Horizontal Timeline for project schedules, roadmaps, lifecycle stages, campaign plans, and phase progression. Timelines should resolve a source list plus date/title/order fields, and item templates should bind Dynamic controls with `attrs.source = "3"` and `attrs["obj-f"]`. A focused generated package has now proven import/open/render stability for timeline controls with Dynamic fields; keep intended interactions, scrolling semantics, preview/download behavior, and non-empty user/image/file display scoped to separate tests.

Runtime proof: `<local manual-test package path>` imported successfully and `Dynamic Controls Runtime Dashboard` opened. Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values rendered; Dynamic user/image/file controls were stable with empty values and no missing binding/render error appeared. User/image/file non-empty display, preview/download, drag/drop, click/open, and Data List form runtime behavior remain unproven.
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

Use docs/studies/advanced-controls-runtime-proof.md and generate-advanced-controls-runtime-proof.mjs as the focused generated package pattern for advanced Yeeflow controls. The generated manual-test package is <local manual-test package path> and is intentionally uncommitted. The user-confirmed runtime result passed for package import, dashboard open, rendering and basic interactions for the included controls, Embed safe render, Document embed empty state, and absence of missing binding/render/action errors.

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
