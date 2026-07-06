---
name: yeeflow-dashboard-generator
description: generate, inspect, validate, package, debug, and improve Yeeflow dashboard .yap app pages after studying real exports; use for dashboard-only apps, Type 103 dashboard pages, dashboard widgets, dashboard navigation, ReplaceIds rules, and staged dashboard import testing.
---

# Yeeflow Dashboard Generator

## UI Generation Hard-Gate Skill

Phase 3B adds workflow-level enforcement. Final reports for high-quality UI work must include contract, scope, runtime evidence, and structure-comparison artifact paths as applicable. Run `scripts/inspect-ui-closed-loop-workflow-enforcement.mjs` before claiming high-quality UI or design fidelity. Generation from design/mockup requires a UI contract. UI upgrades require a scope manifest. Runtime UI quality claims require runtime evidence. Design fidelity claims require structure comparison. Dynamic KPI proof requires before/after mutation evidence. Install/sign/upgrade success is not visual proof.

Use `yeeflow-ui-generation-hard-gates` for every dashboard/UI page that is expected to look production-quality, every Summary/KPI dashboard, every uncertain visual/runtime pattern, and every dashboard upgrade. High-quality UI requires a page-by-page implementation contract; uncertain UI/runtime patterns should be proven on a sandbox page first; use export-proven Yeeflow control/style shapes; Summary/KPI controls require designer-shaped hidden Summary configuration; Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; generated Summary controls must use UUID IDs and complete `Resource.exts[].attr` source metadata (`AppID`, `ListSetID`, `ListID`, `list`, `source`, `settings.values[]`); `runtimeModelProven: true` is invalid for semantic/layout-derived Summary IDs; Summary recalculation can be asynchronous or cache-delayed; semantic/non-UUID Summary IDs and other unsupported shapes remain unproven and signing-ineligible; for every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback; runtime screenshot evidence is required before claiming UI quality; install/signing/API acceptance is not runtime UI proof; UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope; broad scaffold-like UI must not be claimed as high-quality UI. Data Analytics controls require UUID/runtime-safe IDs for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table; Summary is UUID-only. Preserve existing Data Analytics control IDs during upgrades.

## Dashboard Grid-Table Collection Pattern Gate

Facility Maintenance dashboard review hard gates are generator/package/reporting rules, not Functional Specification or App Plan requirements. Generated dashboard resources must pass `scripts/validate-dashboard-generation-hard-gates.mjs` before signing readiness, signing, install/import, upgrade, or final success reporting. The gate checks decoded dashboard filter controls, Container layout serialization, KPI native Icon structure, Summary field-selection/runtime binding metadata, Dashboard Page Layouts v1.1 page-shell compliance, Event Portfolio Golden Reference conformance, and canonical application URL/report identity. Do not ask business users to specify these control-property details; generator helpers must emit them.

Dashboard Page Layouts v1.1 is the default page-level template for newly generated Dashboard pages. `dashboard-page-layouts-workbench`, `dashboard-page-layouts-two-panel-workspace`, and `dashboard-page-layouts-three-panel-workspace` are approved alternate page-level templates when explicitly selected in the App Plan. Start each Dashboard page by copying and normalizing the App Plan selected template from `docs/reference/dashboard-page-layout-templates.json`; preserve `attrs.hideHeaderAll = true`, page background `#f4f7fb`, zero root padding, selected-layout structural containers, selected-layout content slots, and the selected shell contract (`main > content` for section-first layouts, `main > left_panel + content_panel` for master-detail workspace layouts). Then select, remove, duplicate, or adapt sections based on business requirements. Do not build dashboards from scratch or loose prompt interpretation. Event Portfolio Golden Reference regions remain component/region references and may be mapped inside approved selected-layout business-content containers such as `section_content_area`; do not copy Event Portfolio as a competing page-root shell. Run `scripts/validate-dashboard-page-layout-template.mjs` or the aggregate dashboard generation hard gate before signing readiness.

Dashboard Page Layouts v1.1 controlled-slot rule: business-specific text, bindings, filters, KPI values, FontAwesome icons, actions, and Collection/table fields may change only inside the registered allowed business-content containers. New layout modules may only be added by copying one of the registered repeatable/removable modules; copied modules must preserve template hierarchy, control types, width, padding, direction, gap, background, and required children. Do not invent dashboard layout modules or place business Collections/filters directly under root `Content`. Omit `Operations` when no real actions exist. Additional KPI cards must copy `event_portfolio_kpi_planned_events` and replace only allowed KPI business content. Generator normalization may replace generic Navigator names, normalize `Main`/`Content`, zero root/Content padding, encode Full width in the v1.1-supported shape, and emit or omit empty `actions` arrays; it must not mutate real structure.

Dashboard Page Layouts Workbench controlled-slot rule: preserve `page_title_header`, top `section_content_area`, `main_work_queue_section`, `main_work_queue_wrapper`, `primary_working_area`, and optional `right_side_panel`. Business content may change only inside registered Workbench slots such as `page_title_content`, `Operations`, `section_content_area`, `section_title_header`, `dashboard_standard_filter_group`, `kpi_cards_kpi_row`, `kpi_card_wrapper`, `primary_working_area`, `right_side_panel`, and `chart_cards_section`. Remove unused copied modules, empty `section_content_area`, empty `chart_cards_section`, and empty `right_side_panel`. Put grouped Data Analytics templates in `chart_cards_section` under `primary_working_area` or `right_side_panel`, with no more than three analytics templates per chart section.

Dashboard Page Layouts master-detail workspace controlled-slot rule: use `dashboard-page-layouts-two-panel-workspace` for inbox-style list/detail pages with a left dataset list and a right selected-record detail panel. Use `dashboard-page-layouts-three-panel-workspace` when the selected record needs a main detail area plus an additional right-side information/action panel. Preserve `left_panel`, `content_panel`, `left_panel_data_items_wrapper`, `current_item_wrapper`, page temp variable `vCurrentItemID`, and the selection action that writes the clicked left-panel Collection item ID to `vCurrentItemID`. `current_item_wrapper` must bind to the same source dataset as `left_panel_data_items_wrapper`, limit records to `1`, and filter the record ID by `vCurrentItemID`. Business content may change only inside registered master-detail slots, including `left_panel_caption_title`, `left_panel_caption_add_button`, `left_panel_filter_group`, `left_panel_filter_control`, `left_panel_data_item`, `main_content_page_title`, `current_item_main_header_operations`, `page_title_header`, `current_item_subject`, `page_title_description`, `dashboard_standard_filter_group`, `current_item_fields_grid`, `current_item_standard_field`, `current_item_large_field`, `primary_working_area`, `content_card_wrapper`, `section_title_header`, `section_content_area`, `chart_cards_section`, and for three-panel layouts the additional right-panel operation/title/content slots. Keep `left_panel_caption_add_button` only for create-capable sources such as Data lists or Document libraries; remove it for Form reports, Data reports, or other read-only/reporting sources. `content_panel_empty` is the editable empty-selection state shown when no left-panel item is selected; its image, title, and description may be mapped to the app domain. Remove empty filter groups, unused Operations, empty `section_content_area`, empty `chart_cards_section`, empty `kpi_metrics_wrapper`, and empty copied section modules. Place grouped Data Analytics templates in `chart_cards_section`, with no more than three analytics templates per chart section.

Standalone `.ydp` generation and full-application `.yapk` Dashboard materialization must share the same Dashboard page-layout selection, allowed-slot materialization, component-template cloning, page-scoped dependency namespace, and dashboard hard-gate validation path. Do not hand-build a separate standalone `.ydp` page body, Collection region, KPI/Summary region, Data table, Data Analytics region, search/filter variable, temp variable, or action mapper when the full-app path would use the approved Dashboard Page Layouts and component template builders. If a standalone `.ydp` cannot carry app-level packaging context, state that proof boundary, but keep the page resource body produced through the same builders and gates as full-app materialization. Treat `STANDALONE_YDP_SHARED_GENERATION_BYPASSED` as a hard failure when a standalone export is generated from a simplified path. See `docs/standards/standalone-export-shared-generation-standard.md`.

Dashboard page parsing must not materialize planning subsections as pages. `Summary Metrics`, `Dashboard Filters`, `Data Analytics`, `Data Tables`, and `Record Display Control Selection` headings describe content for a page; they are not Dashboard page names. Generated master-detail and Workbench pages must also be domain-clean: a Service Tickets page must not retain source-template text such as `Office Asset`, `Active Loan Pipeline`, `current loan volume`, `return activity signal`, or loan-domain guidance unless the current App Plan is actually in that domain.

Official export-compatible Resource wrapping only proves package readability; it does not prove dashboard materialization quality. Continue to fail generated-final dashboards that invent layout modules outside the selected page-layout registry, place business controls outside allowed slots, render user/person fields with `dynamic-field` instead of `dynamic-user`, or rebuild approved Collection/grid-table regions as simplified lookalikes. For KPI/Summary dashboards, require the complete runtime contract: hidden Summary host, layout-resource `ReportIds`, matching `exts`, declared `tempVars`, expression-object `save_var`, visible binding to the same variable, and source field metadata. The hidden Summary host is still a business-control container: place it inside an approved KPI business slot copied from the selected page layout, such as `event_portfolio_kpi_planned_events`, `event_portfolio_kpi_approved_budget`, `event_portfolio_kpi_registration_rate`, `event_portfolio_kpi_lead_follow_up`, or `kpi_card_wrapper`; never append `*_kpi_data_host` directly under root `Content`, `content_panel`, or another structural shell container. User/person detection must also be metadata-aware: `Requester`, `Approver`, `Manager`, `Owner`, and identity-picker fields require `dynamic-user`, while ordinary identifiers such as `Employee Number`, `Employee ID`, `Employee Code`, and `Department Code` remain normal dynamic fields. For data-dependent runtime proof, install success must be followed by seed proof and refreshed browser/runtime proof; an empty installed dashboard is not proof of live data behavior.

Dashboard App Plans must include both an exact approved Collection presentation template ID and a registry-matching business rationale for each dataset region. The generator must not output `collection_control_grid_table`, `collection_control_responsive_card_grid`, or another approved ID as a bare value without explaining the selected reference's business signal, such as dense row/column scanning, work queue, record list, card browsing, responsive card browsing, multiselect/bulk operations, or primary operations table. Treat missing rationale as a planning/generation defect, not as a manual post-generation repair item.

Dashboard/app page root content-area padding is a hard gate: every generated or upgraded Type 103 dashboard/app page must serialize `Pages[].LayoutInResources[].Resource` with root `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`. Scalar padding, object/numeric padding, numeric array padding, `attrs.common.padding`, or `attrs.style.padding` alone are invalid for the root content area. Normalize existing dashboard/app page roots to this exact token-array shape before signing, installing, importing, or upgrading. Inner layout containers may keep intentional spacing.

Data-list custom form root content-area padding uses the same hard gate: every generated or upgraded New, Edit, View, Detail, or custom form under `Data.Childs[].Layouts[].LayoutInResources[].Resource` or `Childs[].Layouts[].LayoutInResources[].Resource` must parse to a root with `attrs.container.cw = "2"` and the same `--sp--s0` token-array padding. Scalar zero, numeric object zero, `attrs.common.padding`, or `attrs.style.padding` alone remain compatibility fallbacks only and do not satisfy generated-final validation. Inner form sections, cards, grids, controls, and content wrappers may keep intentional spacing.

Dashboard record-list sections that require the grid-table visual/runtime pattern must use grid-table style `collection` controls, not dashboard `data-list` controls, unless the user explicitly requests Data table. Pair each Collection with a header `flex_grid` in one wrapper container, set both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`, and stop before signing, install, upgrade-check, or handoff if `scripts/validate-dashboard-grid-table-collections.mjs` fails. Planned row-click details require `attrs.data.link`, `attrs.data.opentype = "slide"`, `attrs.data.modalsize = 2`, and a concrete Type `1` custom detail layout with schema-compatible `LayoutView`; when no row/card open behavior is planned, emit explicit no-open metadata instead of unresolved or placeholder links. Hide duplicate dashboard headers with `attrs.hideHeaderAll = true`, use visible title typography such as `attrs.heads.ty = [null, "h5-medium"]`, include Text style metadata, and never let helper metadata leak into encoded package objects. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

When a Dashboard dataset region uses Collection, choose exactly one approved dataset presentation reference from `docs/reference/dashboard-dataset-presentation-golden-references.json` and carry it as blueprint/resource provenance. The App Plan selection must be justified by the selected reference's `suitableSourceResourceTypes`, `whenToUse`, `whenNotToUse`, and `requiredBusinessSignals`, and each dataset region must name only one reference. Use the selected template as the starting structure; do not simplify it or invent a new Collection shape. The allowed choices are responsive card grid, card multiselect toolbar, grid-table, grid-table with multiselect, and Event Pipeline Grid-Table; free-text search is behavior inside an approved template, not a standalone template ID. All approved Collection templates are component-level dataset regions inside Dashboard Page Layouts v1.1, so generate them only inside the `section_content_area` of `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`; never copy a source app's root shell/header/root Content/structural wrappers or source fields/labels/IDs into the current app. Treat the App Plan template ID as the dispatch key for that exact page/section: a page that plans card, search behavior, multiselect, and Event Pipeline regions must materialize those different templates in their matching regions, not convert every Collection to one Event Pipeline-style table. Card templates must not be passed through grid-table-specific validation or generation code paths; they keep their card subtree and locked multiselect controls rather than grid header/item parity.

Collection item templates must be runtime-visible, not only visually present. Resolve the Collection source schema before mapping item controls. `attrs.data.sort[]` must use a real internal field from that schema; do not keep source-template labels such as `Primary order`. `attrs.data.fulltext[].fields[]` must also resolve to real fields. Every Dynamic item control must carry matching field bindings on `attrs["obj-f"]`, `attrs.data.field`, `attrs.field`, and top-level `field`; `dynamic-user` controls must also carry `attrs.user.field`. Choose `dynamic-user`, `dynamic-image`, `dynamic-file`, or `dynamic-field` from the actual field type so rows show meaningful values at runtime. This schema-bound rule applies recursively to the whole Collection item subtree: every `exprType: "variable_ctx"` token with `ctx: "__ctx_coll"` must reference a real field from the selected Collection source list, except current-record system IDs such as `ListDataID`.

Progress bar and progress-circle controls inside Collection templates are optional semantic controls. Generate them only when the App Plan declares a progress/completion/capacity/utilization/score/rate metric and the selected Collection source list has a real numeric/decimal/percent field for that metric. Do not use Progress bar merely because a field is named `Status`, and never keep source-template bindings such as `Decimal2` or `Collection item:Completion percentage` when the target Data List lacks that field. Status/choice/text fields should render as `dynamic-field` or badge-like text. Grid/table headers must not contain duplicate visible labels after mapping; if a template has both a progress-status column and a text-status column, remove or rename them to the real business fields.

Collection item user/menu/caption styling is a golden-reference contract. Every `dynamic-user` inside approved Collection templates must set `attrs.item_style.pd` to zero spacing on all four sides (`--sp--s0`). When `grid_table_col_item_op_menu` is present, every inner Button/action_button must keep `attrs.button.normal.bg = "rgba(255, 255, 255, 0)"`, including any newly generated business operation buttons. When `grid_table_col_caption` contains `grid_table_col_title`, the title Text/heading must keep `attrs.heads.ty = [null, "l-medium"]`; only its visible title value is business-editable.

When a Dashboard or Data List form needs Data Analytics, choose an approved template from `docs/reference/data-analytics-golden-references.json`: `data_analytics_pie_chart_with_title`, `data_analytics_column_chart_with_title`, `data_analytics_bar_chart_with_title`, `data_analytics_line_chart_with_title`, `data_analytics_area_chart_with_title`, or `data_analytics_pivot_table_standard`. Clone the source template subtree and preserve style, layout, and typography; do not hand-build simplified chart or pivot lookalikes. For `data_analytics_pie_chart_with_title`, the full `pie_chart_with_title_wrapper` subtree, `pie_chart_container`, `pie_chart_title`, and `pie_chart_control` are the template contract. For chart-with-title templates, only the chart container data binding and the title Text value are business-editable. Data Analytics templates are allowed on Dashboard pages and Data List forms only, never Approval forms. On Dashboard Page Layouts v1.1 pages, place these templates only inside `content_card_wrapper`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`. On Workbench and master-detail workspace Dashboard pages, grouped analytics should be placed inside `chart_cards_section` under the approved working-area containers; use no more than three analytics templates per `chart_cards_section`. Materialization must also create the chart/pivot runtime model in the same layout resource: add the visible control ID to `Resource.ReportIds[]`, add a matching `Resource.exts[]` entry with `category: "___Pivot___"`, expected `key`, `i` equal to the control ID, source `AppID/ListID/ListSetID`, chart type for charts, and non-empty `settings.rows[]` plus `settings.values[]` fields that resolve to the source list/report. The visible control's `attrs.data.list` and `attrs.model.source` must also include the same `AppID/ListID/ListSetID`; an ext-only source binding is not enough. Mark chart controls `runtimeModelProven: true` only after this runtime model exists and resolves to real fields. The visible control must carry both `dataAnalyticsTemplateId` and `templateId`, and `attrs.data`, `attrs.model`, `attrs.series[]`, and `attrs.values[]` must match the ext rows/values. Count charts use the proven `ListDataID` identity for `field`, `fieldName`, `FieldName`, and `id` plus `COUNT`; never invent `ListDataID_COUNT`, use field UUIDs for COUNT ids, or leave empty row/value objects. A visual chart wrapper with provenance but without this aligned runtime binding is not complete generation.

When a Dashboard needs a native Data table, choose one approved Data table template from `docs/reference/data-table-golden-references.json`: `data_table_control_standard_scroll`, `data_table_control_standard_no_scroll`, or `data_table_control_caption_scroll`. Clone the selected export-shaped `data-list` control and preserve locked table/header/body/card/caption style settings. Use `standard_scroll` for many columns with readable horizontal scroll, `standard_no_scroll` for small-column auto-fit tables, and `caption_scroll` when caption title, built-in search, add item, and import/export more-menu behavior are required. Do not use Data table where a Dashboard Collection template, multiselect state, card item layout, Kanban, or Timeline is required. Generated Dashboard Data tables must carry both `templateId` and `dataTableTemplateId`, bind `attrs.data.list`, include `attrs.listarr[]` columns with real `Field` and visible `FieldName`, and pass `scripts/validate-data-table-golden-references.mjs --package <package.yapk> --plan <yeeflow-app-plan.md>`.

Template materialization fidelity is mandatory. Generator entrypoints must clone approved Dashboard Collection/KPI template subtrees from the registry artifacts and then replace only allowed business slots; do not call older helper functions that reconstruct "similar" KPI cards, grid tables, checkbox columns, toolbars, or filters. When cloning any approved template, recursively re-instantiate source-template UUID-like values and keep repeated references consistent inside that clone so different Dashboard pages never share control/action UUIDs from the reference export. Also recursively remap every package-local numeric source-template ID inside the final Dashboard resource, including `attrs.data.list`, `attrs.querydata_list`, filter option sources, local Collection actions, custom action steps, `control_action` targets, detail layout refs, and Data Analytics visible/runtime source refs. Do not copy old source `ListSetID`, `ListID`, `LayoutID`, or `FieldID` values into generated-final Dashboard JSON, and do not satisfy provenance by adding old source IDs to the manifest. If a source reference cannot be mapped to a current generated resource, remove the unsupported action/source or fail before package emission. For `collection_control_grid_table_with_multiselect`, preserve `grid_table_col_multiselect_wrapper`, `grid_table_col_caption`, and `grid_table_col_content` as Full width in every Designer-relevant width layer, preserve the real `grid_table_col_body` Collection root identity, preserve locked gap/style values for caption/operation/selected-count wrappers, replace source text such as `All tasks`, `Search tasks`, `Add Task`, `Mark as completed`, `Assignee`, `Completion (%)`, and `Progress bar` with current-app business text, keep `grid_table_col_item_select` action-bound to the Collection select/toggle action, and emit Designer-compatible filter conditions with `op/operator = "9"`, `showCus:false`, string RHS, `__filter_` id, raw filter name, and matching `filterBindings[]`. For KPI sections, clone `kpi_cards_kpi_row` and `event_portfolio_kpi_planned_events` card modules; helper-created `ops_kpi_*` cards or loose static lookalikes are not allowed.

For `collection_control_responsive_card_grid`, clone `collection_control_responsive_card_wrapper` from `docs/reference/collection-control-responsive-card-grid.template.json` and preserve the component subtree unless a region is explicitly editable. You may change `card_col_title` text, Search title/placeholder, Add item label, item Dynamic controls, and optional item-operation buttons. Do not add `dynamic-image` unless the bound source has an Image field. User fields must use `dynamic-user`; file/attachment fields must use `dynamic-file`; all other fields use `dynamic-field`. If the source is Form Report/Data Report or the region is display-only, omit `card_col_caption` and item operation menu regions rather than generating edit/delete controls.

## UI Summary/KPI Runtime Hard Gates

Dashboard UI work must be page-by-page, contract-driven, and proof-boundary explicit. Before generating or upgrading dashboard UI, run `scripts/inspect-yeeflow-ui-design-contract.mjs` for the implementation contract and `scripts/inspect-dashboard-style-shapes.mjs` for export-proven `attrs.common` card/style shapes. Use a sandbox page first for uncertain UI patterns, verify runtime screenshot evidence, and do not claim UI quality from schema/install/signing success.

Summary/KPI dashboard generation must pass `scripts/inspect-dashboard-summary-control-contract.mjs`: hidden Summary host uses `attrs.common.hide = [null, true, true, true]`, `attrs.style.direction = [null, "row"]`, optional `attrs.display.rule = "1 == 0"`, designer-shaped field metadata, valid count/ListDataID or numeric aggregate fields, expression-object `save_var`, unique temp variables, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`. Visible KPI values must pass `scripts/inspect-visible-kpi-runtime-bindings.mjs`; raw temp variable names, blank runtime render, unlabeled fallbacks, or unproven dynamic binding claims are failures.

When dynamic visible KPI binding is requested, generate the exact UUID Summary v1.0.1 shape: UUID Summary control IDs, matching layout-resource `Resource.ReportIds[]`, matching layout-resource `Resource.exts[]` entries with `category: "___Pivot___"` and `key: "summary"`, matching layout-resource `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible Heading/Text `attrs.headc.title.variable[]`, and complete `attrs.data.field` / `attrs.field` / `fieldObject` / `fieldInfo` metadata. Top-level `Pages[].ReportIds` is optional compatibility metadata only. Before claiming dynamic KPI proof, require before/after source data mutation evidence, expected-value notes, inspector output, and refreshed/recalculated after-evidence; Summary recalculation can be asynchronous or cache-delayed. If the exact shape or proof is missing, stop or use explicitly labeled fallback values. Do not claim dynamic binding solved for semantic/non-UUID Summary IDs, approval forms, public forms, unsupported surfaces, or other visible binding shapes.

Runtime UI evidence must pass `scripts/inspect-runtime-evidence.mjs` before high-quality UI claims: visible KPI values, hidden Summary controls not visible, card-like dashboard sections, visible filters/actions, non-scaffold tables/grids, distinct badges/chips, and no plain scaffold page. Collection grid-table claims must also pass `scripts/inspect-grid-table-quality.mjs`.

## Canonical Schema Files

YAPK validation uses `schemas/yapk-schema.json`. YAP validation uses `schemas/yap-schema.json`. Do not hardcode versioned schema filenames in runtime logic. To update a product schema standard later, replace the canonical file contents while keeping these filenames unchanged. Keep YAP and YAPK schema standards separate: YAPK uses `AppExportPackageInfo`, Brotli `AppPackageInfo`, and `Childs[].Fields`; YAP uses the YAP wrapper, `[______gizp______]` gzip `ListExportResult`, `Defs`, and `SimplePortal`.

## YAPK Schema v5 Standard Additions

YAPK validation uses `schemas/yapk-schema.json`, which now contains v5 schema content. The `x-yeeflow-standard-additions` section is actionable and not optional. Generated YAPK output must strictly follow those standards before signing, install dry-run, upgrade check, upgrade apply, or handoff. Package generation must stop if the generated output violates `schemas/yapk-schema.json` or any enforceable standard addition. API install success is not runtime render proof; report local validation, API acceptance, queued import, and runtime materialization/render proof as separate scopes.


## Full Application Visual Quality Gate

Vendor Onboarding full UI v2 proved that import/install success is not enough. Do not call a generated package a full UI application unless it implements the approved plan and mockup-derived pages, forms, controls, bindings, and actions at usable quality. Blank or generic Data List custom forms are quality failures. Default/plain buttons without action bindings are quality failures. Default alert copy such as `Alert` or `Here is the description` is a quality failure. Kanban and Collection controls without meaningful dynamic item templates and item actions are quality failures.

For full application generation, run `scripts/inspect-generated-app-quality.mjs --package <package> --spec <approved-spec.md> --strict-visual-app-quality` before handoff. The strict gate must fail missing planned pages/forms, missing print pages, underbuilt dashboards, missing safe padding/card structure, placeholder controls, default buttons, missing actions, empty Kanban/Collection templates, and undocumented deferred scope. Do not return a minimal or technically importable scaffold when the user asked for the full approved application.

Before full application package generation, create a page-by-page composition checklist and get it approved when the app is mockup/spec driven. The checklist must name each required page section, Yeeflow control, source list, displayed fields, layout/card/grid/padding rule, button/action binding, item template, fallback, validation rule, and pass/fail status. Do not generate a package directly from high-level requirements when the user expects a full designed app. The generated package must implement every approved checklist item or explicitly defer it with a reason, fallback, and validation impact. Treat the approved composition checklist as the generation contract; do not generate or return a package unless every required checklist item is implemented or explicitly deferred with reason.

## Template Library Contract

Full application generation must use the reusable Yeeflow UI section template library when one is available. Composition checklist sections must reference a known `templateId` from `docs/templates/yeeflow-ui-section-template-library.normalized.json`, and generated packages must satisfy the referenced template's required controls, data bindings, fields, layout/card/padding rules, style rules, and action rules. Feature knowledge alone is not enough; use reusable UI templates for dashboard headers, KPI cards, alert cards, Data table sections, Kanban/Collection item cards, detail headers, sectioned forms, document checklists, print pages, and action bars.

Generate full applications page by page. Validate each page/form/dashboard against template conformance before assembling or returning a package. Do not satisfy a template with placeholder controls, title-only cards, default alert copy, blank custom forms, or active buttons without valid action bindings. If a template cannot be implemented safely, explicitly defer the section with a reason, fallback, and validation impact before generation.
Use the reference app corpus as the first source of export-proven UI section patterns before inventing new layouts. Prefer safe patterns from `Company Overview (3).yap`, `Data Lists (4).yap`, `Projects Center_2.yap`, and `Sales_Management_AD.yap` for advanced dashboard controls, custom list forms, Kanban/Collection item templates, actions, Data tables, related-record sections, filters, and operational workspaces. Use `DEMO Innovation Ecosystem Platform (1).yap` / `NHIC Innovation Overview` and `Service Desk Pro (2).yap` / `Executive Dashboard` as KPI dashboard references. Use `Online Library.yap` / `Inventory` and `Print Inventory` plus `Online Library (1).yap` / `Print Inventory` as multi-inventory print and per-item QR references. Use `Sales Quotation.yap` and `Sales Quotation (1).yap` as single-item print and print-QR references. For print pages, QR Code should bind to current item/current record or a business code field; do not generate static placeholder QR URLs. A new broad golden app is no longer needed for known template-library gaps, but browser print/page-break and scanned QR destination behavior still need runtime/manual proof.

For operational dashboard pages that need inbox-style work management, consider `three_column_workspace_shell` from `docs/standards/three-column-workspace-layout-standard.md`: left context/queue panel, main content/work panel, and right detail/action panel with optional bottom regions. Use it for service desk, CRM, renewal review, task center, triage, and list-detail-detail dashboards. Do not use it for simple dashboards or pages where any panel would be placeholder-only. Keep Type `103`, current dashboard shell, embedded page wrapper, native Heading/Text controls, and data-bound panel content validation intact.

## Vendor Onboarding v4.1 Hard Checks

Treat the completed Vendor Onboarding v4.1 iteration as a golden generation reference. Future full-app generation must hard-check these rules before handoff: dashboard pages use `Main > Content`; layout-only Grid controls have display caption off; every Navigator control label is meaningful rather than defaults like `Container`, `Grid`, `Text`, `Dynamic field`, or `Kanban`; KPI numeric cards are data-bound through Summary controls, `attrs.save_var`, dashboard `tempVars`, and visible formatted Text controls rather than static numeric Text; active buttons use valid action bindings; dynamic controls are placed only where context supports them, especially inside Kanban/Collection/Timeline item templates; generated data lists include valid schema, visible default display fields, selected lookup display fields, runtime-visible choice options in Rules.choices, not Rules.Options, and sample data. Keep the remaining Vendor lookup picker no-record behavior as a known product-team follow-up, not a reason to remove lookup display-field validation.

## Packaged Generation Standards

Apply the packaged standards in `docs/standards/` before generating or returning application packages. `data-list-generation-standard.md` requires native `Title`, no generated `Text0` primary field, runtime-visible choice options in Rules.choices, not Rules.Options, full default view display/query shapes, lookup relationships for related lists, dependency-ordered sample rows, and selected lookup display fields. `dashboard-summary-card-generation-standard.md` applies only to Dashboard pages and supported Data List custom forms because Summary controls are not available on approval forms or Data List public forms; do not generate Summary controls on unsupported surfaces. `account-health-smoke-issue-summary.md` records the first-generation smoke failures that must remain regression-tested. Run the matching validators and treat missing standards compliance as a generation failure, not a cosmetic warning.

## Runtime Binding Lessons

Dashboard/app page root content-area padding is a hard gate: every generated or upgraded Type 103 dashboard/app page must serialize `Pages[].LayoutInResources[].Resource` with root `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`. Scalar padding, object/numeric padding, numeric array padding, `attrs.common.padding`, or `attrs.style.padding` alone are invalid for the root content area. Normalize existing dashboard/app page roots to this exact token-array shape before signing, installing, importing, or upgrading. Inner layout containers may keep intentional spacing.

Data-list custom form root content-area padding uses the same hard gate: every generated or upgraded New, Edit, View, Detail, or custom form under `Data.Childs[].Layouts[].LayoutInResources[].Resource` or `Childs[].Layouts[].LayoutInResources[].Resource` must parse to a root with `attrs.container.cw = "2"` and the same `--sp--s0` token-array padding. Scalar zero, numeric object zero, `attrs.common.padding`, or `attrs.style.padding` alone remain compatibility fallbacks only and do not satisfy generated-final validation. Inner form sections, cards, grids, controls, and content wrappers may keep intentional spacing.

Official v0.6.19 adds dashboard runtime-binding guardrails from real generated-app repairs. Treat Summary, Collection, Data table, chart, and pivot controls as data-bound controls, not visual widgets. Every generated Summary needs `attrs.data.list`, a resolvable aggregate field, matching layout-resource `Resource.exts[]` with `category: "___Pivot___"` and `key: "summary"`, `exts[].i` equal to the Summary control id, `settings.values[]` with aggregate field/type/function, and layout-resource `Resource.ReportIds[]` registration. A static KPI card is not a Summary.

Dashboard filters must bind to stable page `filterVars[]` entries such as `filter_{PageName}_{FilterName}` and each declared filter variable must be consumed by Summary `Conditions[]`, Collection/Data table `attrs.data.filter[]`, or a proven chart/pivot condition. Consumer fields must resolve on the consumer source list. Lookup-backed filters should compare record ids/ListDataID-style values, not display labels. Run `scripts/validate-runtime-binding-lessons.mjs` for focused dashboard binding audits before handoff.

When combining a Dashboard page-layout golden reference with component templates, do not merge template-owned dependencies directly under their canonical source names. Namespace every cloned component template's `filterVars`, `tempVars`, `actions`, and `formAction` entries by page and region, then rewrite all `__filter_...`, `__temp_...`, and action references inside the clone. One Dashboard page must not contain two Search/Data Filter controls that produce the same filter variable unless they are the same control instance. Validate with `scripts/validate-page-scope-template-dependencies.mjs` and rely on the `page-scope-template-dependencies` preflight gate before signing.

Generated-final dashboard materialization completeness: when an approved App Plan declares dashboard KPI/Summary metrics, filters, Collection/Data table/Kanban/Timeline regions, or dynamic item-template display needs, the generated Type 103 dashboard must contain corresponding non-empty controls. A `Main > Content` shell with `Content.children = []`, or a container-only dashboard with no business controls, is not a generated-final dashboard. Run `scripts/validate-dashboard-generation-hard-gates.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>` and `scripts/validate-generated-final-resource-completeness.mjs --plan <yeeflow-app-plan.md> --package <app.yapk|decoded.json>` before signing readiness.


## Application Navigation References

When a dashboard/application page is included in app navigation, reference the root app page layout from `Data.Item.ListModel.LayoutView.sort[]` using `Type = 103` and `ListID = Data.Item.Layouts[].LayoutID`. Use optional `DisplayName` for a custom menu label and omit it for title fallback. Use a string `Icon`, or `Icon: ""` for no-icon.

Dashboard menu items can be top-level resources or children inside a top-level `Type = "classes"` navigation group. Do not create nested groups. Validate the menu reference resolves to an included Type 103 layout before wrapper build.

Current dashboard shell learning: the Vendor Onboarding v1.93 export proves that newly created current-version dashboards are still root `Type = 103` layouts, but the blank current dashboard shell uses `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and `LayoutInResources = []`. Do not generate new app dashboards with the legacy blank-string shell (`LayoutView = ""`, empty `Ext2`, or null/missing `LayoutInResources`). Keep navigation registration in root `ListModel.LayoutView.sort[]` pointing to the generated dashboard `LayoutID`. Vendor Onboarding v1.12 proves that current dashboards can include inline `LayoutInResources` content when the shell stays current and the embedded controls use runtime-correct bindings.

YAPK schema v2 caveat from Vendor Onboarding v1.13: when the same current dashboard is wrapped in a `.yapk`, the YAPK `ListLayoutInfo` schema requires `LayoutView` to be a string and `LayoutID` to be `LongAsString`. Preserve the current dashboard marker with `Type = 103`, `Ext2 = "{\"src\":true}"`, and valid `LayoutInResources`; validate Data table `Field` source bindings before signing.

Use this skill when the user asks to generate, debug, validate, or learn Yeeflow dashboard packages, including minimal dashboard-only apps, dashboard widgets, dashboard page JSON, Type `103` navigation, dashboard `exts`, and dashboard import failures.

When dashboard changes target an existing imported application, route package-type decisions through `yeeflow-application-builder` / `yeeflow-application-generator`. Generate `.yap` for new/cloned apps. For `.yapk` upgrades, start from a Yeeflow Version management baseline and preserve app identity/stable IDs; do not attempt to patch dashboard internals in `.yapk` while its `Resource` payload remains opaque.

For unproven dashboard areas, use this with `yeeflow-feature-learning-orchestrator`: study real exports first, then generate the smallest importable test.

## Plan-To-Dashboard Generation

For full application generation, dashboard work must come from the application plan. Confirm each planned dashboard/page, business question, source list, control type, displayed fields, actions, filters, and proof boundary before generating controls. If dashboard requirements are unclear and the dashboard is central to the app, ask focused questions; otherwise document assumptions in the plan.

Do not substitute a static or minimal dashboard for a planned functional dashboard. Generate the full planned dashboard scope when it is inside proven patterns: source lists, KPI summaries, queues, charts, Data tables, Collection/Kanban/Timeline views, actions, and filters as appropriate. Staged/minimal dashboard packages are only for explicit MVP requests or focused runtime proof.

Dashboard Page Layouts v1.1 remains the page shell even when the dashboard's main business content is a Collection template. Insert approved Collection templates only into the `section_content_area` of `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`; never generate a dashboard whose only meaningful content is the Collection component without the v1.1 shell. If the App Plan declares Summary/KPI metrics or filters, materialize them as real Summary/KPI and Data Filter/search/select/radio controls with valid bindings and consumers before handoff.

For Collection templates, do not rebuild the visual tree by hand. `collection_control_responsive_card_grid`, `collection_control_card_with_multiselect_toolbar`, and `collection_control_grid_table_with_multiselect` must be cloned from their full JSON template artifacts, preserving their exported style/layout/typography contracts. Grid-table multiselect must replace `{{DetailLayoutID}}` with a concrete custom detail layout id for the source list and keep row open metadata `opentype = "slide"` / `modalsize = 2`; `link: "default"` is not a valid generated-final value.

## Web App Dashboard Pattern Mapping

Design dashboards like modern web application pages first, then map the design to Yeeflow controls. Decide the user goal, information priority, main actions, density, responsive expectation, and operational vs executive use before selecting controls.

Use dashboard control combinations intentionally:

- overview dashboard: KPI cards, Progress circle/bar, status Alerts, Collection or Data table, and quick action buttons
- operational queue: Data table with configured columns plus filters/actions, or Collection/Kanban when cards/status lanes serve the workflow better
- status board: Kanban with group/category field, meaningful item template fields, and item actions
- activity/history view: Vertical Timeline or Horizontal Timeline with date/title/status fields
- reporting dashboard: summaries, charts/Pivot Table when proven, Data table drill-down, and explanatory sections
- shortcut hub: Icon list or button/card layout with clear action labels

Use styling capabilities for padded sections, card/container spacing, grid columns, section backgrounds, typography hierarchy, status colors, icons, border radius, borders/shadows where supported, and responsive layout. Use scoped custom CSS only for safe spacing/alignment, scrollable/fixed-width tables, card polish, conditional visual states, or dashboard grouping when standard style settings are insufficient. Use Custom code control only for true custom dashboard UI needs that standard controls cannot satisfy.

When dashboard mockups or screenshots are provided, extract dashboard sections into the UI implementation spec before generation. Map each visible dashboard block to Yeeflow controls: KPI cards, Summary/Text/Dynamic fields, Progress circle/bar, Alert, Data table, Collection, Kanban, Timeline, Icon list, filters, action buttons, containers/grids, and custom CSS only where needed for layout polish. Do not replace a high-quality dashboard mockup with an empty shell or static placeholder page.

## Generated Dashboard Quality Gate

Before generating a dashboard, create a compact page plan with major sections, data sources, controls, displayed fields, and padding/container choices. Use fewer polished sections instead of many incomplete widgets.

Every generated dashboard should use safe horizontal page padding through a root or near-root section/container. Recommended default desktop padding is 24px to 32px, with smaller responsive padding where supported. Do not place major tables, charts, KPI groups, cards, Collection/Kanban/Timeline controls, or action panels directly against the page edge.

Every Data table control (`type = "data-list"`) must configure `attrs.data.list` and nonempty `attrs.listarr` display columns. For dashboard Data tables, `attrs.data.list` should include `AppID`, `ListID`, `Type`, `Title`, and `ListSetID`. Column entries must include `Field` for the actual source field internal name, such as `Text0`, and `FieldName` for the visible label, such as `Vendor Name`; `FieldName` alone is not a query binding. Include 3 to 5 meaningful columns when fields exist, prioritizing title/name, status, date, owner, amount, and progress fields. If the source fields are not known, do not generate a Data table; use a card, Collection, or clear empty-state message instead. Empty Data table columns or missing `Field` bindings are generated-final errors. Vendor Onboarding v1.11 proved that omitting `Field` can produce `Field(s) ,,,,, have been deleted. Please check the query configuration.`; v1.12 fixed this with `Field` source bindings and imported successfully.

Collection, Kanban, and Timeline controls must include meaningful item-template dynamic fields. Progress controls must have numeric values or valid bindings. Steps bars must have steps or valid field bindings. QR/barcode/embed/document controls need safe configuration or should be omitted. Run the generated UI quality inspector before handoff and fix dashboard warnings/errors that indicate missing padding, empty controls, or unresolved data bindings.

Fail dashboard quality review when controls lack business rationale, advanced controls are present without meaningful content, Custom code is used where standard controls would be better, or the generated dashboard does not match the app plan's `UI/UX and Control Mapping` section.

## What To Load

- For the proven minimal dashboard shell, read `references/minimal-dashboard-pattern.md`.
- For proven static page-builder elements, read `references/simple-elements-pattern.md`.
- For proven local data-bound summary/table elements, read `references/data-bound-elements-pattern.md`.
- For proven local data-bound chart widgets, read `references/chart-widgets-pattern.md`.
- For proven dashboard filter controls and filter-bound chart conditions, read `references/filter-controls-pattern.md`.
- For the first proven Service Desk Pro-style static Executive Dashboard rebuild, read `references/service-desk-pro-stage-c-pattern.md`.
- For the first proven Service Desk Pro-style local Support Tickets source list, read `references/service-desk-pro-stage-d-pattern.md`.
- For the proven Service Desk Pro KPI summary stages and pending first chart package, read `references/service-desk-pro-stage-e-f-pattern.md`.
- For proven Service Desk Pro Support Teams filters, opendashboard actions, Drill-down data-list tables, static Drill-down filters, submitted-period binding, and Settings/Help Guide polish, read `references/service-desk-pro-stage-i-l-pattern.md`.
- For the first studied dashboard Collection control pattern, read `references/collection-control-pattern.md`.
- For Knowledge Base-style dashboard apps with article/category Collections and local data lists, read `references/knowledge-base-pattern.md`.
- For validator and wrapper expectations, read `references/validator-rules.md`.
- Before operating Yeeflow UI, read `references/runtime-testing.md`.
- For app shell/list/form hard rules, also use `yeeflow-application-generator`, `yeeflow-data-list-generator`, and `yeeflow-approval-form-generator` as needed.
- For dashboard expressions, data filters, dynamic display/style rules, filter-bound chart conditions, Collection item text expressions, and formula-like widget settings, also use `yeeflow-expression-generator`, `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, `yeeflow-expression-utils.js`, `docs/yeeflow-expression-generation-rules.md`, and `docs/yeeflow-expression-editor-ui-contexts.md`.

When a dashboard/reporting control depends on a data-list, document-library, or Form Report view, inspect `docs/studies/data-view-resource-settings.md` first. Data views are `Layouts[]` entries with URL/default/filter/sort/user-filter settings; do not treat a dashboard data source as runtime-proven just because a view exists in the package. Confirm the target list-like resource and selected view fields/filters resolve before generation, and keep view-driven dashboard behavior runtime-sensitive until focused proof observes it.

When a dashboard uses Data Filter controls, inspect `docs/studies/data-filter-controls.md`, `docs/studies/normalized/data-filter-controls/`, and `references/filter-controls-pattern.md` first. `Sales_Management_AD.yap` export-proves dashboard Checkbox, Select, Range, Check range, Date, Relative period, Apply button, and Remove filters shapes. `CRM - Customer relationship management.yap` export-proves Search, Radio, Hierarchy, and Sorting shapes. Filter variables live in embedded page `filterVars[]`, value-producing controls bind with `__filter_`, and downstream table/report/chart consumers use expression-token references in data filter conditions, fulltext filters, or sorting-filter entries. Use Apply button only for click-apply filters and treat Remove filters as a special reset control. Dashboard schema is export-proven; approval/data-list form hosts and interactive runtime behavior still need separate proof.

When a dashboard uses Pivot Table controls, inspect `docs/studies/pivot-table-control.md`, `docs/studies/normalized/pivot-table-control/`, `docs/studies/pivot-table-control-runtime-proof.md`, and `scripts/inspect-pivot-table-controls.mjs` first. `CRM - Customer relationship management (1).yap` export-proves the dashboard host schema: the page contains visible `type = "pivot-table"` controls and matching layout-resource `Resource.exts[]` entries with `category = "___Pivot___"`, `key = "PivotTable"`, and `i` equal to the control id. The focused v2 generated package proves a representative Dashboard Pivot Table app can be manually imported and used with 20 safe synthetic data-list rows, and the user confirmed new items can be added in that package's data list. The v1/v2 diff strongly indicates the seed/add fix was field storage alignment: clone data-list field definitions by `FieldName`, not array position, so `FieldID`, `FieldName`, `FieldType`, `Type`, and row-cell references stay aligned. Use Pivot Tables for multidimensional summaries with rows, columns, and values. Resolve every source and field before handoff, use count aggregations for counts and numeric aggregations only on numeric/currency fields, restrict date groupings to date/time fields, and style `header`, `body`, `subtotal`, and `grandtotal` sections for readable dashboard tables. Data Filter variable references in Pivot Table conditions must resolve to page `filterVars[]`; the CRM Pivot Tables did not themselves consume filter variables, so interactive filtering remains unproven until runtime-tested.

## Core Rule

Do not start complex dashboard generation from a complex dashboard export.

Start from the smallest proven dashboard app, then add one capability at a time:

1. empty Type `103` dashboard shell
2. embedded page JSON with no widgets
3. one static visual/control
4. one local data list
5. one simple dashboard widget
6. one dashboard `exts` data source
7. one chart widget type or one chart style change
8. one dashboard filter
9. multiple widgets/filters/actions
10. Service Desk Pro-style dashboard reconstruction

Each import-test package must use a fresh local ID family.

## Generated Dashboard UI/UX Standard

When the active workspace contains `docs/yeeflow-application-design-system.md` and `docs/yeeflow-dashboard-design-standards.md`, use them as the default dashboard design standard. Use `docs/yeeflow-dashboard-ui-ux-patterns.md` for export-level evidence. The first official UI/UX reference export is `UI and UX design (1).yap`.

Grid caption rule from Vendor Onboarding v4.2/v4.4: generated dashboard Grid controls use `type = "flex_grid"` and must keep display caption turned off. The product-edited examples do this with `displayLabel: [null, false]`. Generated `flex_grid` controls must set `displayLabel: [null, false]`, and should not emit `nv_label: "Grid"` unless the user explicitly asks for a visible Grid caption.

Default generated dashboards should:

Dashboard/app page root content-area padding is a hard gate: every generated or upgraded Type 103 dashboard/app page must serialize `Pages[].LayoutInResources[].Resource` with root `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`. Scalar padding, object/numeric padding, numeric array padding, `attrs.common.padding`, or `attrs.style.padding` alone are invalid for the root content area. Normalize existing dashboard/app page roots to this exact token-array shape before signing, installing, importing, or upgrading. Inner layout containers may keep intentional spacing.

Data-list custom form root content-area padding uses the same hard gate: every generated or upgraded New, Edit, View, Detail, or custom form under `Data.Childs[].Layouts[].LayoutInResources[].Resource` or `Childs[].Layouts[].LayoutInResources[].Resource` must parse to a root with `attrs.container.cw = "2"` and the same `--sp--s0` token-array padding. Scalar zero, numeric object zero, `attrs.common.padding`, or `attrs.style.padding` alone remain compatibility fallbacks only and do not satisfy generated-final validation. Inner form sections, cards, grids, controls, and content wrappers may keep intentional spacing.

- set embedded page `attrs.hideHeaderAll = true`
- set embedded page `attrs.container.padding` to `[null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`
- set full-page background on embedded page `attrs.background` when needed
- use a top-level container with `nv_label: "Main"`
- place the main visible content inside a child container with `nv_label: "Content"`
- place all visible dashboard sections inside `Main > Content`, not directly on the page root
- keep Type `103` `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and embedded page JSON in `LayoutInResources[0].Resource`
- for generated root dashboard pages with embedded page JSON, set `LayoutInResources[0].ID` and `RefId` to the dashboard `LayoutID`; Design System Request Tracker v1 proved this renders the runtime dashboard, while a separate generated resource ID rendered an empty designer placeholder

For real application-builder packages, do not stop at an empty dashboard unless the app scope explicitly says dashboard is deferred. A runtime-safe v1 dashboard should include meaningful, locally proven sections such as request queues, status counts, simple source-list Collections, or KPI cards backed by included data lists. Keep advanced widgets, filters, reservations, and charts within proven dashboard patterns and mark anything unproven as focused runtime proof.

Functional dashboard rule: when a plan/spec says KPI, summary, count, total, queue, report, analytics, trend, or chart, generate a functional dashboard control rather than a static Text mockup. Use `summary` controls for counts/totals, `data-list` or proven `collection` controls for operational queues and report tables, and `pie-chart`/`bar-chart`/`line-chart` controls when the chart model and binding shape are known. If a planned chart has a known model, generate the real chart and seed or confirm representative source rows for runtime validation. Treat an empty chart as a no-data / insufficient-source-data condition, not as a broken chart. Use a data-bound list/table fallback only when the chart control fails structurally after valid source data exists, and keep fallback tables as complementary drill-down/reporting views when charts work. Static Text controls are allowed for headings, descriptions, labels, instructions, and explanatory notes only; a hardcoded Text value such as `0`, `0.00`, `N/A`, or placeholder copy must not be used as a KPI/report/queue substitute unless explicitly labeled demo/placeholder content.

Form Report data-source note: product understanding says Form Reports can feed Lookup fields, Data table controls, Collections, and analytics controls such as Summary, Pie chart, Column chart, Line chart, and Pivot table. `AI Training-2 (1).yap` did not include dashboard/control references to Form Reports, so dashboard generators must not claim or invent the binding schema. Use Form Reports as dashboard data sources only after a real export or focused runtime baseline proves the control reference shape.

Global page background rule: do not set full-page background color on the dashboard `Main` container. `Main` stays structural; page background belongs on embedded page attrs. Use backgrounds on `Page header`, cards, KPI containers, Collection sections, or other specific visible containers only when those surfaces need their own color.

Shared CAPEX/design-system carry-forward: dashboard pages in generated app packages should follow the same `Main` structural parent, `Content` visible content, token-aligned color, meaningful `nv_label`, and Text Style Sample rules used by the latest CAPEX v4 Text Standard baseline. Dashboard-specific generation still requires dashboard export proof for new controls, but shared page/header/container rules apply globally.

Use `docs/yeeflow-root-style-token-reference.md` for dashboard color, spacing, radius, and typography guidance. Prefer semantic tokens for generated dashboard surfaces and statuses: primary, success, warning, danger, and neutral. Avoid arbitrary custom palettes; do not inject the full root stylesheet.

Generated dashboards should use clear sections (`Page header`, `Summary section`, `Body section`, `Collection section`, `Empty state`), meaningful `nv_label` names, token-aligned neutral surfaces, and Collection controls for repeatable list-style content when source lists are local and proven.

When the workspace includes `docs/yeeflow-text-control-generation-standards.md`, generated dashboard headings, labels, card titles, KPI text, and empty states must follow the Text Style Sample native Text shape: `type: "heading"`, inline width by default, `attrs.heads.ty = [null, token]` or a custom typography object, and plain string `attrs.heads.color`.

Dashboard expressions must use Yeeflow expression-token arrays. Dashboard Collection item expressions may use export-backed context variables such as `exprType: "variable_ctx"` with `ctx: "__ctx_coll"`; validate those against the collection source list before build. Do not invent expression functions or operators for chart filters, text expressions, or data filters. Treat `addWorkDays` and `addWorkHours` as expression-editor UI-observed but metadata-pending until export-backed parameter examples are captured.

Form Actions carry-forward: approval-form exports and generated runtime tests prove the front-end form action model (`formdef.actions[]`, `action_button.attrs.control_action`, `formAction.onLoad`, temp variables, `setvar`, `confirm`, `querydata`, `querydata_filters`, `arraySum`, `JSONStringfy`, and `submit`). Dashboard actions may share concepts, but dashboard generation must not assume the same wrapper until a dashboard export proves the exact dashboard action location and trigger shape. Reuse button style guidance only as visual guidance. Do not generate Submit form or Save changes steps on dashboard pages.

Collection/Kanban actions learning: `Company Overview (2).yap` export-proves local actions on Dashboard Collection and Kanban controls. Store local item actions on the host control as `attrs.actions[]` with `type = "coll"` and bind item-template buttons, containers, or icons with `attrs.control_action` to a local action id. Current item operation expressions use `exprType = "variable_ctx"`, `ctx = "__ctx_coll"`, and field ids such as `ListDataID` or source-list fields; Kanban category styling can also use `ctx = "__ctx_kanban"` / `_cate`. Export-proven action steps include `listitem` with `op_type = "edit"`, `deleteitem`, `setdatalist`, `setvar`, `confirm`, and `otheraction`. The screenshot UI additionally shows View item, Edit item, Delete item, Update fields, and Trigger list workflow as Collection item step labels, but schemas not present in the export should remain UI-reference-backed until separately exported. Validate local action bindings, current-item field references, target layouts, update fields, and page temp-variable references before handoff.

App Plan gate: before dashboard generation, the approved App Plan must select the Data List record display control for each page section, state why Data table, Collection, Kanban, Vertical Timeline, or Horizontal Timeline was chosen, list item-template Dynamic controls and bound fields for every Collection/Kanban/Timeline control, and plan Collection/Kanban item actions or explicitly state `No Collection/Kanban item actions required`. Do not treat unsupported control types, action shapes, property paths, bindings, or configuration shapes as generation-ready unless they are marked `export-learning-required`, `runtime-proof-required`, or `deferred`.

Collection selection/bulk pattern: `Collection of activity` export-proves a generated dashboard pattern for selected item IDs and count. Use dashboard `tempVars[]` for selected IDs and selected count, an absolute-positioned item-template container as the click target, checked/unchecked icon controls with dynamic display rules, and a bulk toolbar whose display rule checks selected count greater than zero. Bulk update/delete can be page-level `actions[]` using `setdatalist` with `ListDataID` and selected ID arrays, followed by `setvar` cleanup and optional `confirm` result messages. Treat runtime execution of edit/delete/update/select/bulk actions as unproven until a focused generated runtime package tests it.

Collection/Kanban actions runtime proof package: `docs/studies/collection-kanban-actions-runtime-proof.md` records the user-confirmed correct-project v2 runtime pass. Do not reuse earlier wrong-project artifacts or claims. Keep the runtime claim limited to `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` and the tested actions only.

Correct-project v2 runtime-proven package: `tools/generators/generate-collection-kanban-actions-runtime-proof.mjs` emits `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` from the clean `formreport-clean` project. It includes one Data List, one dashboard, Collection and Kanban controls, local `attrs.actions[]`, item-template `attrs.control_action` bindings, `__ctx_coll` / `ListDataID`, selected IDs/count temp variables, checked/unchecked icon rules, and bulk update/delete page actions. The user confirmed import, dashboard open, Collection/Kanban render, Edit item, Delete item, Mark current item as Completed, selection toggle, selected count, bulk toolbar, bulk mark completed, and bulk delete for this package only.

For app-shell navigation around dashboards, keep the menu readable by inverting the root header colors: `navigator-menu.bgc` should equal `appearance.color`, and `navigator-menu.color` should equal `appearance.bgc`.

## Doc Library Controls On Dashboards

Use dashboard Doc library controls when a dashboard should expose Yeeflow Document Library resources directly. `Enterprise Document Center Folders Runtime.yap` proves the dashboard control shape:

- place the control in `Item.Layouts[].LayoutInResources[0].Resource`
- use `type: "document-library"` and `nv_label: "Doc library"`
- set `attrs.data.list` with `AppID`, target Type `16` `ListID`, `Type: 16`, target `Title`, and app root `ListSetID`
- for a root-folder view, set `attrs.data.folder.path = "0/<folder ListDataID>"` and `attrs.data.folder.label` to the folder title
- populate `attrs.listarr[]` with target-library fields; the first Name column may use the observed `Attrs.table.cw = [null, 40]` and `cwu = [null, "%"]`
- when using a caption, the export-proven settings are `display: true`, `add: true`, `search: true`, `placeholder`, `addtext`, `layout` pointing to the target library `New file` form `LayoutID`, and `op: "modal"`
- disabled search/add settings are runtime-proven for a document-library custom-form hosted Doc library control, but disabled dashboard states are still untested; do not generalize the disabled-state proof across hosts without a focused runtime test
- do not claim dynamic folder paths or non-dashboard approval/data-list form contexts as runtime-proven until focused generated packages test them
- do not generate uploaded document rows or document binaries for dashboard control tests

## Custom Code Controls On Dashboards

Use a dashboard Custom Code control only when native dashboard controls, Collections, filters, summaries, charts, and actions cannot deliver the needed interaction.

Generation rules:

- Place the control in the embedded dashboard page JSON under `Item.Layouts[].LayoutInResources[0].Resource`.
- Use `type: "codein"` and include a valid script in `attrs["codein-script"]`, or use a future export-backed script reference pattern if one is proven.
- Configure input parameters in `attrs["codein-script-param"]`; required parameters from the script's `inputParameters()` must be present.
- For writable dashboard outputs, define dashboard `tempVars[]` and bind output parameters with `{ "type": 1, "value": { "prefix": "__temp_", "value": "<TempVarId>" } }`.
- Keep parameter types aligned with TSX expectations. Smart Lookup Picker-style list id, display field, value field, and booleans are expression parameters (`type: 2`); text labels and numeric config may be static strings.
- Give the surrounding section and control a meaningful `nv_label`/title rather than relying only on the generic `Custom code` label.
- Do not use dashboard custom code as a substitute for data-bound KPI, chart, queue, or report controls.
- Test dashboard render separately from save/writeback, because dashboard temp-variable setters may behave differently from approval-form fields.

## Minimal Proven Baseline

The first proven generated dashboard package is:

- workspace artifact: `generated-dashboard-minimal-v1.yap`
- source export studied: `Test Dashboard Only.yap`
- app shape: one root app/listset, one Type `103` dashboard layout, no child resources
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened, and rendered the empty dashboard page shell

The second proven generated dashboard package is:

- workspace artifact: `generated-dashboard-simple-elements-v2.yap`
- source export studied: `Test Dashboard Only (2).yap`
- app shape: one root app/listset, one Type `103` dashboard layout, one embedded static page JSON resource, no child resources
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened, and rendered static dashboard elements

The first proven Yeeflow Application Design System dashboard package is:

- workspace artifact: `design-system-request-tracker.v1.yap`
- app shape: one Type `103` dashboard, one Requests data list with Edit/View custom forms, and one simple approval workflow
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, dashboard rendered the `Main` -> `Content` design-system layout, Requests opened without a visible query failure, approval submitted/routed/completed, and the approved workflow path created a Requests record
- dashboard resource note: use `LayoutInResources[0].ID = RefId = LayoutID` for generated embedded dashboard page JSON

The third proven generated dashboard package is:

- workspace artifact: `generated-dashboard-data-bound-v3.yap`
- source export studied: `Generated Dashboard Simple Elements v2.yap`
- app shape: one root app/listset, one Type `103` dashboard layout, one local child data list, two summary controls, one dashboard data table control
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened, rendered summary values and table rows, and the local `Event Planning` list opened without a visible query failure

The fourth proven generated dashboard package is:

- workspace artifact: `generated-dashboard-chart-widgets-v4.yap`
- source export studied: `Generated Dashboard Data Bound v3.yap`
- app shape: one root app/listset, one Type `103` dashboard layout, one local child data list, two summary controls, one dashboard data table control, and three chart widgets
- chart widgets proven: pie, column, and line
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened, rendered summary values, table rows, and visible pie, column, and line chart output; the local `Event Planning` list opened without a visible query failure

The fifth proven generated dashboard package is:

- workspace artifact: `generated-dashboard-filter-controls-v5.yap`
- source export studied: `Generated Dashboard Chart Widgets v4.yap`
- app shape: v4 chart package plus one filter container, one search filter, one radio filter, one range filter, and chart conditions bound to page filter variables
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened, rendered search/radio/range filters, rendered summary values, table rows, and visible pie/column/line chart output, and opened the local `Event Planning` source list without a visible query failure

The first proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-b-or-c.generated.yap`
- source export studied: `Service Desk Pro (1).yap`
- app shape: one root app/listset, one Type `103` Executive Dashboard page, static Service Desk-style header, filter note, KPI placeholders, chart placeholders, and operational placeholders
- intentionally excluded: child data lists, `exts`, `filterVars`, `tempVars`, summaries, charts, reports, Settings actions, drill-down actions, forms, workflows, AI modules, and document libraries
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage C`, and rendered the static Executive Dashboard content

The second proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-d.generated.yap`
- source export studied: `Service Desk Pro (1).yap`
- app shape: Stage C static Executive Dashboard plus one local `Support Tickets` child data list
- minimal list fields proven: native `Title` as `Ticket Title`, `Text1` Ticket ID, `Text2` Priority, `Text3` Status, `Text4` Assigned Team, `Datetime1` Created Time, `Decimal1` First Response Hours, `Decimal2` Resolution Hours, `Bit1` First Response SLA Compliance, `Bit2` Resolution SLA Compliance
- intentionally excluded: dashboard `exts`, bound summaries, charts, filters, reports, Settings, drill-down actions, forms, workflows, AI modules, and document libraries
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage D`, and opened `Support Tickets` with six rendered sample rows and no visible `datas/query` failure

The third proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-e.generated.yap`
- app shape: Stage D plus one bound `Total Submitted` summary over the local `Support Tickets` list
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage E`, and rendered `Total Submitted = 6`

The fourth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-f1.generated.yap`
- app shape: Stage E plus four bound KPI summaries over the local `Support Tickets` list
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage F1`, and rendered `Total Submitted = 6`, `Resolved Tickets = 2`, `Open Tickets = 4`, and `Critical Open = 0`

The fifth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-f2.generated.yap`
- app shape: Stage F1 plus one `Open Tickets by Priority` column chart
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage F2`, kept the KPI values `6`, `2`, `4`, and `0`, and rendered the `Open Tickets by Priority` column chart with Medium and High buckets

The sixth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-g.generated.yap`
- app shape: Stage F2 plus one static Type `103` `Settings` page
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage G`, and rendered the static Settings configuration cards

The seventh proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-h.generated.yap`
- app shape: Stage G plus static Type `103` `Drill-down Tickets List` and `Help Guide` pages
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage H`, rendered Drill-down Tickets List and Help Guide pages, and opened the local `Support Tickets` source list with six rows

The eighth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-i.generated.yap`
- app shape: Stage H plus local `Support Teams` data list, Support Teams select filter control, and submitted-period staged control
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage I`, rendered the Support Teams select filter, and opened the local `Support Teams` list with rows

The ninth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-j.generated.yap`
- app shape: Stage I plus one `opendashboard` action from the Executive Dashboard operational card to the included `Drill-down Tickets List` Type `103` page
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage J`, and clicking the `Drill-down Tickets List` card opened the staged Drill-down page in a modal

The tenth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-k.generated.yap`
- app shape: Stage J with the Drill-down static rows replaced by a dashboard `data-list` control bound to local `Support Tickets`
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage K`, and rendered the bound Support Tickets table both by direct navigation and inside the Executive Dashboard modal

The eleventh proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-l.generated.yap`
- app shape: Stage K plus one static scalar Drill-down table filter, `Text2 = High`
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage L`, and rendered only the high-priority tickets `T-1001` and `T-1006`

The twelfth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-m.generated.yap`
- app shape: Stage L export-back study plus submitted-period conditions on all local KPI summaries and the local priority chart, Settings 3-column layout polish, and an improved static Help Guide layout
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage M`, rendered the KPI cards, and clicking `Today` changed the KPI values from `6`, `2`, `4`, `0` to `0`, `0`, `0`, `0`; Settings, Help Guide, Drill-down, Support Tickets, and Support Teams also rendered successfully

The thirteenth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-n.generated.yap`
- app shape: Stage M with fresh IDs and Executive Dashboard helper copy updated to describe the active Submitted period binding
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage N`, rendered the active helper copy, changed KPI values from `6`, `2`, `4`, `0` to `0`, `0`, `0`, `0` after clicking `Today`, and successfully opened Settings, Help Guide, Drill-down Tickets List, Support Tickets, and Support Teams

The first studied Service Desk Pro Collection export is:

- source export: `Service Desk Pro Dashboard Stage M.yap`
- studied dashboard: `Tickets with Collection`
- app shape: Stage M plus one Type `103` dashboard containing two Collection controls bound to local `Support Tickets`
- learned patterns: card/grid Collection, table-style Collection, dynamic fields with `source: "3"`, collection item expressions with `ctx: "__ctx_coll"`, `dateFormat` expression wrapper, conditional priority badge styles in `attrs.control_display`, and designer `nv_label` naming
- generation status: documented and validator-covered, but not yet a generated runtime baseline; first generated package should use one card/grid Collection only

The first runtime-proven generated Knowledge Base-style package is:

- workspace artifact: `knowledge-base-generated-v4.yap`
- source export studied: `Knowledge Base_1.yap`
- app shape: one root app/listset, one Type `103` Home dashboard page, local `Categories` and `Articles` data lists, plain text article category labels, article/category sample rows, Article Collection with fulltext search, Category Collection, and `dynamic-field` controls inside Collection item templates
- intentionally deferred: article-to-category lookup metadata, `Sections`, richtext body fields, icon-upload/image controls, article detail links, nested category-to-article Collections, Search query-param flow, Admin action cards, forms, workflows, reports, AI modules, connections, and document libraries
- validation result: generator syntax passed, package/graph validation passed, wrapper round-trip passed; only `APP_THEME_EMPTY` warning remains
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, opened as `Knowledge Base Generated v4`, rendered Home article/category Collection cards, and opened both `Categories` and `Articles` with sample rows
- key lesson: native generated `Title` fields require `FieldIndex: 0` in addition to `Status: 0`, `IsSystem: true`, and `IsIndex: true`

## Stop Conditions

Stop before final generation if:

- no real dashboard export has been studied
- Type `103` dashboard navigation does not resolve to a root layout
- `LayoutInResources` behavior is being guessed instead of copied from a studied pattern
- local root/dashboard IDs are missing from `ReplaceIds`
- tenant/user metadata is remapped into a generated local ID family
- widget `exts` reference lists or reports not included in the package
- dashboard `exts[].i` does not resolve to a page control id
- dashboard `exts[].i` is missing from `Resource.ReportIds` when report ids are present
- dashboard chart `exts[].settings.rows[]` or `values[]` field references do not resolve to the source list fields
- dashboard Pivot Table source, row, column, value, date-grouping, aggregation, or filter-variable references do not resolve
- dashboard filter control binding does not resolve to page `filterVars`
- dashboard chart condition variable expression does not resolve to page `filterVars`
- `save_var` references do not resolve to `tempVars`
- `opendashboard` actions reference missing Type `103` pages
- query-param to `tempVars` mapping is needed before original Service Desk drill-down filters are generated
- original Service Desk `collection` card layout is copied without a local runtime baseline
- Settings tile actions reference external `ListSetID` or `ProcKey` dependencies not included in the package
- submitted-period conditions are duplicated on the same dashboard binding
- validator or wrapper round-trip checks fail

## Required Validation

Run the relevant local scripts before runtime testing:

```bash
node validate-yap-package.js <resource-or-yap> --mode generator --stage final
node validate-yap-graph.js <resource-or-yap> --mode generator --stage final
node build-yap-wrapper.js <resource.json> <output.yap> --title "<title>" --validation-mode generator
```

`APP_THEME_EMPTY` is acceptable for the minimal dashboard-only baseline because the studied export uses `AppThemes: []`. Treat it as a warning for richer apps, not a blocker for the empty dashboard shell.

## Runtime Proof

A dashboard package is not considered learned until it imports and opens in Yeeflow. When the user explicitly asks for runtime testing, use:

`https://<yourdomain>.yeeflow.com`

Confirm:

- import metadata dialog parses name/description/icon
- import completes
- app appears in Shared Workspace
- app opens
- dashboard navigation renders
- dashboard page content renders with expected functional controls; rendering alone is not enough for a KPI/reporting dashboard
- KPI/summary cards are real `summary` controls bound through dashboard `exts`, not static Text values
- operational queues and report sections are real `data-list` or proven `collection` controls bound to source lists
- chart sections render real chart controls when chart models are known; runtime tests must create or confirm representative source records before deciding chart validity. Empty chart output with no matching records is a no-data result, while model-load failure after valid data is a chart defect. Data-bound list/table fallbacks are acceptable only for structural chart failures or as complementary drill-down views
- local source lists open without visible `datas/query` failures when the package includes dashboard data sources

For the current dashboard learning loop, the user has authorized import testing after every newly generated `.yap`; do the runtime import test after local validation for each new package unless they explicitly pause it.

If runtime fails, create a smaller isolation package with fresh IDs instead of guessing.

Dashboard Data Filter runtime proof: `docs/studies/data-filter-controls-runtime-proof.md` proves a focused generated dashboard package imported, opened, rendered a data table/list-like control, summaries, chart/report controls, Search/Radio/Range/Sorting Data Filter controls, and an Apply button. It also proves one Search click-apply interaction and one Radio value-change selection stayed stable with no visible missing-filter-variable, missing-binding, or dashboard-crash errors. Treat Range and Sorting as render-proven only in that pass, and keep Remove filters, Hierarchy, exhaustive operator semantics, approval-form usage, and data-list-form usage unproven at runtime.

## Shared Form Action Concepts

Form actions are front-end page/form logic, distinct from backend workflow graph actions. Phase 1 approval-form runtime proof covers action buttons, button click triggers, page-load triggers, temp variables, `setvar`, and `confirm`; the same concepts may apply to dashboards only after a dashboard-specific export/runtime proof. Do not promote dashboard form actions from approval-form evidence alone.

`Sales Quotation.yap` export-proves a Data List custom View form action step `type = "print"` that opens a Print Page custom form with current `ListDataID` context. Treat Print page as a shared form-action concept only where the host schema supports form actions; Dashboard and Approval Form availability remains product/schema-understanding-backed unless a dashboard or approval-form export/runtime proof contains the same step.
<!-- projects-center-import-failure-hardening:start -->
## Dashboard/Page Import-Readiness

Generated dashboards, root pages, and custom page resources must pass strict reference checks before `.yap` handoff. `LayoutInResources[].ID` and `RefId` must match the owning `LayoutID` where the current generated-page model requires inline resources. Dynamic display rules must reference the target control id, and formulas/filters must resolve against the active collection source list or page filter variables.

Do not ship dashboard collection filters that reference unresolved `__ctx_coll` fields such as `ListDataID` when that field is not present on the collection source list. Treat stale copied `controlId` values, unresolved field filters, and unresolved data source/list references as generated-final errors, not cosmetic warnings.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Container And Button Action Settings

Use `docs/studies/container-button-action-settings.md`, `docs/studies/normalized/container-button-actions/`, and `scripts/inspect-container-button-actions.mjs` when dashboards use actionable Containers or Buttons. `AP Approval Demo v3.yap` export-proves that dashboard `container` controls and `action_button` controls share the same `attrs` action-setting model.

Export-proven action codes are `2` Link, `5` Add list item, `6` Open dashboard, and `8` Open approval form. The Builder UI also shows `Action` for form/page action binding, but the target dashboard did not include action code `1`; keep dashboard-specific form-action binding warning-first until a dashboard export proves the exact target field.

Choose the action type from business intent: Link for URL destinations; Add list item for quick-create list/document flows; Open dashboard for navigation, drill-down, reports, and workspaces; Open approval form for starting workflow/request forms. Prefer structural Yeeflow references over raw links for Yeeflow resources.

Validate every generated action before handoff. `attrs.data.list.ListID` must resolve for Add list item; `attrs.data.page.PageID` must resolve to a Type `103` dashboard for Open dashboard; `attrs.data.form.ProcKey` must resolve to an included approval form for Open approval form; Link needs a literal URL or expression URL. Export-proven `op` values are empty/default, `modal`, `slide`, `target`, and `new`; export-proven `modalsize` values are `0`, `1`, `2`, `3`, and `9`, with `cusize` for custom sizing.

Focused runtime proof in `docs/studies/container-button-action-runtime-proof.md` confirms a generated dashboard package imported/opened and representative Link, Add list item, Open dashboard, and Open approval form actions worked after the approval request-page fix. Treat this as generated-package proof for current-app navigation/open behavior only; keep save/submit/workflow, cross-app targets, form-action binding, external sensitive navigation, and all open-mode/size combinations unproven.
<!-- container-button-action-settings-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Kanban, Collection, And Dynamic Controls

Use `docs/studies/kanban-collection-dynamic-controls.md`, normalized refs under `docs/studies/normalized/kanban-collection-dynamic-controls/`, and `scripts/inspect-kanban-collection-dynamic-controls.mjs` when dashboards use Kanban, Collection, or Dynamic field/user/image/file controls. `Company Overview.yap` export-proves a Dashboard Kanban control on `Company overview` and a Dashboard Collection control on `Collection of activity`, both using a Data List source named `Company Overview`.

Kanban controls use `attrs.data.list` for the data source and `attrs.data.cateField` for category/grouping. Collection controls use `attrs.data.list` for the source and `attrs.layout` for card/grid layout. Dynamic controls inside Kanban/Collection item templates use current-item context with `attrs.source = "3"` and `attrs["obj-f"]` set to a field name on the selected source list. Validate the source list, Kanban category field, and every Dynamic control field binding before handoff.

Use specialized Dynamic controls for specialized source fields: Dynamic user for identity/person fields, Dynamic image for image fields, Dynamic file for attachment/file fields, and Dynamic field for general text/date/number/choice values. This export proves Dynamic user/image/file inside dashboard item templates and Dynamic field on both dashboards and a Data List View page. It does not prove timeline controls, Kanban drag/drop, Collection click behavior, or file/image preview runtime behavior.

## Vertical And Horizontal Timeline Controls

Use `docs/studies/timeline-controls-dynamic-controls.md`, normalized refs under `docs/studies/normalized/timeline-controls-dynamic-controls/`, and `scripts/inspect-timeline-dynamic-controls.mjs` when dashboards need chronological/event-style timelines. `Company Overview (1).yap` export-proves dashboard `timeline-v` and `timeline-h` controls on `Timeline with controls`.

Timeline controls bind to source data through `attrs.data.list`. The studied export uses `attrs.data.title.variable[]` with `exprType = "variable_ctx"` / `ctx = "__ctx_coll"` for timeline labels, `attrs.data.sort[]` for the date/order field, and `children[]` for the repeated item template. Dynamic controls inside timeline templates use `attrs.source = "3"` and `attrs["obj-f"]`, the same current-item field binding pattern as Collection/Kanban. Validate source list, date/title/sort fields, and every Dynamic control binding.

Use Vertical Timeline for activity feeds, histories, lifecycle logs, and vertically scanned milestones. Use Horizontal Timeline for schedules, roadmaps, project phases, campaign plans, and time progression where left-to-right scanning matters. Horizontal Timeline adds horizontal/card options such as columns, arrows, and slides-to-scroll. A focused generated package has proven import/open/render stability for Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values. Do not claim click/open behavior, scrolling semantics, drag/drop/reordering, non-empty user/image/file display, or image/file preview/download until focused runtime proof covers those paths.

Focused runtime proof: `tools/generators/generate-kanban-collection-timeline-runtime-proof.mjs` emits a minimal dashboard app with one source Data List, Kanban, Collection, `timeline-v`, `timeline-h`, and Dynamic field/user/image/file controls all bound with source `3`. `/Users/Renger/Downloads/kanban-collection-timeline-runtime-proof.v1.yap` imported successfully, opened `Dynamic Controls Runtime Dashboard`, rendered Kanban/Collection/Vertical Timeline/Horizontal Timeline, rendered Dynamic field values, and kept Dynamic user/image/file controls stable with empty values. Its synthetic rows populate text/status/date/progress; user/image/file fields require safe runtime values before claiming non-empty display, preview, or download behavior.
<!-- kanban-collection-dynamic-controls-learning:end -->

## Dashboard v1.1 Generated-Final Materialization

When generating Dashboard Page Layouts v1.1 pages, use the v1.1 page shell and place Event Portfolio golden-reference components only inside approved slots. Do not put business/data controls directly under root `Content`, and keep `page_title_section` limited to title/header content.

When generating `dashboard-page-layouts-workbench` pages, use the Workbench page shell and place Workbench business content only inside approved Workbench slots. Keep `chart_cards_section` under `primary_working_area` or `right_side_panel`, remove it when empty, split analytics across multiple chart sections when more than three are planned, and remove `right_side_panel` when it has no real business content.

Record queues, pipelines, worklists, and portfolio tables must use the golden-reference Collection subtree, not simplified Data table/static lookalikes. Each primary grid-table Collection needs an independent approved content card wrapper (`content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`) or approved grid-table wrapper copied from the template/reference.

KPI cards that display live metrics must be backed by Summary controls with matching layout `ReportIds`, `exts`, `tempVars`, `attrs.save_var`, and visible KPI text bound to the same saved variable. Static/fallback KPI text is allowed only when explicitly labeled as fallback and must not be claimed as dynamic runtime proof.

Filters must bind to valid list fields and be consumed by Collection/table/KPI query or filter metadata. A filter with UI options but no consumer linkage, or one using scalar placeholder operator/value metadata such as `0`, is not generated-final ready.

Dashboard template use must be domain-normalized before signing readiness. Template selection/provenance is not enough: rewrite every visible title, subtitle, Collection column, card field, toolbar button, batch action, row/card action, filter placeholder, empty state, and KPI label/value helper into the current App Plan business domain. Remove or rewrite source-template residue such as `All tasks - Multiple select`, `Active Survey Programs`, `Survey Program`, `Project Tasks`, unrelated `Event Pipeline`, and visible raw control labels such as `Grid`, `Container`, `Text`, `Dynamic field`, or `Placeholder`.

When runtime seed data is used to verify dashboard quality, produce expected KPI values from the seed artifact and include them in runtime evidence. Dynamic binding is not the same as business correctness; visible KPI values must match the seed-derived expected counts/sums/rates before claiming generated dashboard quality.

User/identity source fields must render with Dynamic user controls. Non-user fields must not be rendered with Dynamic user merely for styling.

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

Use docs/studies/advanced-controls-runtime-proof.md and tools/generators/generate-advanced-controls-runtime-proof.mjs as the focused generated package pattern for advanced Yeeflow controls. The generated manual-test package is /Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap and is intentionally uncommitted. The user-confirmed runtime result passed for package import, dashboard open, rendering and basic interactions for the included controls, Embed safe render, Document embed empty state, and absence of missing binding/render/action errors.

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

## Three-Column Workspace Runtime Layout Mechanics

When using or validating `three_column_workspace_shell`, choose dashboard Style 2 from `docs/standards/three-column-workspace-layout-standard.md` and `docs/studies/three-column-dashboard-layout-runtime-css-study.md`. Style 1 dashboards keep the standard `Main > Content` wrapper. Style 2 three-column workspace dashboards do not: `three_column_workspace_shell` must be the root page body layout container, with dashboard content width set to Full Width and page padding set to 0. Do not wrap the shell in default `Main > Content` containers; runtime testing showed those default-height/default-position parents can make the shell render blank or incorrectly.

It is not enough to create three labeled sections. The page/form resource must contain one positioned row shell with three direct sibling panels, fixed-width left/right panels, fill-width main panel, full-height bounded panels, hidden outer panel overflow, scrollable body regions, sticky header/action regions, and meaningful bottom/support regions when present. Generated pages that stack the left, main, and right panels vertically, nest the shell under Style 1 wrappers, omit Full Width/zero page padding, or use layout-breaking icon widths must fail validation and must not claim this template. Icon controls inside the shell should use inline width behavior and intentionally bounded sizes for the panel/header context.

Before signing, install, upgrade, or handoff, run template conformance with the template library when a checklist declares this pattern. Treat `THREE_COLUMN_*` findings such as `THREE_COLUMN_SHELL_NOT_ROOT`, `THREE_COLUMN_SHELL_NESTED_IN_MAIN_CONTENT`, `THREE_COLUMN_PARENT_HEIGHT_DEFAULT_RISK`, `THREE_COLUMN_PAGE_WIDTH_NOT_FULL`, `THREE_COLUMN_PAGE_PADDING_NOT_ZERO`, `THREE_COLUMN_ICON_WIDTH_NOT_INLINE`, `THREE_COLUMN_PANELS_STACKED_VERTICALLY`, `THREE_COLUMN_PANEL_WIDTH_MISSING`, `THREE_COLUMN_OVERFLOW_MISSING`, and `THREE_COLUMN_PLACEHOLDER_PANEL` as generated-final blockers. If exact selected-record/right-panel refresh binding is not proven, use safe static/sample detail content, but keep the layout mechanics correct. API install success is not runtime layout proof; manual runtime verification must confirm the panels render side by side and remain usable.

## Multi-Column Form Workspace Pattern

Use `docs/standards/multi-column-form-workspace-standard.md` and template `multi_column_form_workspace_shell` when a service desk, help desk, CRM workbench, support console, review queue, renewal review, case-management console, or operational inbox needs form actions, variables, selected-record state, comments/updates, dynamic form fields, or action-driven filtering. This is an approval/form workspace pattern, not a dashboard reporting pattern.

During planning, choose a dashboard when the page is primarily reporting or monitoring. Choose the form workspace when the app needs navigation containers that set filter variables, ticket/list collection items that set selected/current record state, detail panels bound to that selected state, comment/update controls, or expand/collapse icon actions. Do not add fake workflow routing just to use the form surface; if the workflow is only Start to End, document that the form is being used as a no-submit workspace shell.

When generating this pattern, build a row shell with left navigation, ticket/list collection, selected-record workspace, and right attributes/detail regions. Navigation rows should be icon plus text containers with click/form actions. Filter controls and menu actions should set variables consumed by collection filters or queries. Collection item actions should set selected/current record state. Details panels should use dynamic field/user/file controls bound to the selected record. Comment/update actions must target the selected record and related activity list only when the binding is validated. Avoid placeholder-only panels, fake Submit Request buttons, and claims of selected-record behavior when the actions and bindings are not implemented.

Before signing, install, upgrade, or handoff, run template conformance when a checklist declares `multi_column_form_workspace_shell`, `four_column_service_desk_workspace`, `service_desk_inbox_workspace`, or `action_driven_ticket_workspace`. Treat `FORM_WORKSPACE_*` findings such as `FORM_WORKSPACE_NAV_ACTION_MISSING`, `FORM_WORKSPACE_FILTER_VARIABLE_MISSING`, `FORM_WORKSPACE_COLLECTION_FILTER_MISSING`, `FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING`, `FORM_WORKSPACE_DETAIL_BINDING_MISSING`, `FORM_WORKSPACE_ICON_ACTION_MISSING`, `FORM_WORKSPACE_FAKE_SUBMIT_BUTTON`, and `FORM_WORKSPACE_PANEL_LAYOUT_INVALID` as generated-final blockers for pages that claim this pattern. API install success is not runtime interaction proof; manually verify that navigation filters, selected ticket refresh, detail bindings, comments, and collapse/expand actions work.
