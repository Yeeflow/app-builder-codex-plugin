---
name: yeeflow-data-list-generator
description: generate, inspect, validate, package, debug, and improve yeeflow data list definitions, .ydl exports, list metadata, lookup relationships, custom list forms, views, and data-list sample data
---

# Yeeflow Data List Generator

## Data List Form Set Variable

Use `docs/standards/set-variable-golden-reference-standard.md`. A custom Data List Form `setvar` step may target a declared page temp variable or a real current-list field. Preserve expression-array conditions and boolean `continue` semantics for ordered alternative steps. When a temp variable controls Dynamic Display or read-only state, declaration, producer target, and consumer expression must resolve to the same ID.

Data List Workflow is different: `SetVariableTask` targets declared workflow variables only. Current-list fields are export-proven on the RHS, but field mutation must use Set Data List / `ContentList`. For the current item, serialize `listtype = "current"` and validate every `listdatas[]` target against the host list. Never materialize a planned Data List field write as a Set Variable target.

Custom Data List Form Set Variable actions must materialize from `Form Action Set Variable Planning` through the shared page-action helper. Data List Workflow node shapes are export-proven and validator-backed, but full-app WorkflowType 1 generation remains an explicit blocker until the host workflow envelope and FlowMappings registration are implemented.

## Generated-Final YAPK ID And Navigation Hard Gates

Generated-final `.yapk` output must use API-issued numeric content IDs from `GET /utils/generate/ids?count=<n>` and must emit a redacted `dist/<app-name>-id-provenance-report.json` with `sourceMarker: "api-generated"`, path-to-purpose mappings, duplicate checks, unused-ID accounting, generator provenance metadata, and no non-API IDs. Local ID generation, hardcoded generated IDs, copied sample/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds are forbidden for generated-final `.yapk`. Runtime navigation groups must include API-issued `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list[]`; children must include `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`, with data lists as `Type: 1` and `ListID = Childs[].List.ListID`. Run `scripts/validate-yapk-id-provenance.mjs` and `scripts/validate-yapk-navigation-runtime-metadata.mjs`; stop before signing, install, upgrade-check, or handoff if either gate fails. `setsign`/`verifysign` and install acceptance do not prove ID provenance or navigation runtime metadata completeness.

YAPK upgrade ID stability hard gate: upgrade/new-version `.yapk` output must preserve IDs for existing semantic resources from the previous package/lineage manifest. Only newly added resources may consume newly API-issued IDs, removed IDs must not be reused, replacing all IDs is a hard failure, and `scripts/validate-yapk-upgrade-id-stability.mjs` must pass before signing, upgrade-check, upgrade apply, install-like writes, or handoff. Missing previous package/manifest fails closed; signing/install/upgrade acceptance is not ID-continuity proof.

## Dashboard Grid-Table Collection Pattern Gate

When a data list is surfaced through a dashboard grid-table Collection, do not fall back to dashboard `data-list` unless Data table is explicitly requested. The dashboard wrapper must pair a header `flex_grid` and Collection in one container with `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`; planned row-click details require the Collection link metadata plus a concrete Type `1` custom detail layout for the same source list. Keep helper metadata out of encoded `Childs[]`, layouts, controls, and package schema, and treat dashboard visual proof as separate from signing/install acceptance.

##
YAP approval workspace list metadata update: child lists used by generated approval form workspaces must keep export-shaped `ListType`, full list metadata, default view/layout metadata, stringified field `Rules`, keyed `ListDatas`, and ID coverage in `Resource.ReplaceIds`. Missing list metadata can break approval form materialization even when the form tree itself looks valid.
 Canonical Schema Files

YAPK validation uses `schemas/yapk-schema.json`. YAP validation uses `schemas/yap-schema.json`. Do not hardcode versioned schema filenames in runtime logic. To update a product schema standard later, replace the canonical file contents while keeping these filenames unchanged. Keep YAP and YAPK schema standards separate: YAPK uses `AppExportPackageInfo`, Brotli `AppPackageInfo`, and `Childs[].Fields`; YAP uses the YAP wrapper, `[______gizp______]` gzip `ListExportResult`, `Defs`, and `SimplePortal`.

## Generated-Final YAP Contract

When a data list is part of a plugin-generated `.yap`, apply `docs/standards/yap-generation-contract.md` in addition to the YAP schema. Data-list generation must preserve export-style child ListModel metadata, long numeric-string IDs, globally unique field IDs, full field metadata, native `Title`, stringified and parseable field `Rules`, Type `0` default view metadata with `Ext1.Url = "default"`, field-resolving layout/query arrays, keyed `ListDatas` records, and final `Resource.ReplaceIds` coverage.

Generated YAP/YAPK data-list fields must use canonical schema storage categories only: `Text`, `Bit`, `Decimal`, or `Datetime`. Never emit helper/internal values such as `Int`, `Date`, legacy `DateTime`, `Boolean`, `Number`, or `Bool` in `FieldType`; map numeric controls to `Decimal`, switches to `Bit`, datepickers to `Datetime`, and text-backed controls to `Text`.

Product schema refresh v0.6.17: custom field names must be storage-code names. Use `FieldName = FieldType + FieldIndex`, for example `Text1`, `Decimal1`, `Bit1`, or `Datetime1`, and put the business label in `DisplayName`. `Datetime` is canonical; `DateTime` is legacy/invalid for generated packages. Custom fields require `IsSystem=false` and `FieldIndex >= 1`; the native `Title` field requires `IsSystem=true` and `FieldIndex=0`.

## YAPK Schema v5 Standard Additions

YAPK validation uses the effective composed schema loaded through `scripts/lib/load-yapk-schema.js`: product-team canonical `schemas/yapk-schema.json` plus Codex overlay `schemas/yapk-schema-codex.json`. The `x-yeeflow-standard-additions` section is actionable and not optional. Generated YAPK output must strictly follow those standards before signing, install dry-run, upgrade check, upgrade apply, or handoff. Package generation must stop if the generated output violates the effective schema or any enforceable standard addition. API install success is not runtime render proof; report local validation, API acceptance, queued import, and runtime materialization/render proof as separate scopes.


## Full Application Visual Quality Gate

Vendor Onboarding full UI v2 proved that import/install success is not enough. Do not call a generated package a full UI application unless it implements the approved plan and mockup-derived pages, forms, controls, bindings, and actions at usable quality. Blank or generic Data List custom forms are quality failures. Default/plain buttons without action bindings are quality failures. Default alert copy such as `Alert` or `Here is the description` is a quality failure. Kanban and Collection controls without meaningful dynamic item templates and item actions are quality failures.

For full application generation, run `scripts/inspect-generated-app-quality.mjs --package <package> --spec <approved-spec.md> --strict-visual-app-quality` before handoff. The strict gate must fail missing planned pages/forms, missing print pages, underbuilt dashboards, missing safe padding/card structure, placeholder controls, default buttons, missing actions, empty Kanban/Collection templates, and undocumented deferred scope. Do not return a minimal or technically importable scaffold when the user asked for the full approved application.

Before full application package generation, create a page-by-page composition checklist and get it approved when the app is mockup/spec driven. The checklist must name each required page section, Yeeflow control, source list, displayed fields, layout/card/grid/padding rule, button/action binding, item template, fallback, validation rule, and pass/fail status. Do not generate a package directly from high-level requirements when the user expects a full designed app. The generated package must implement every approved checklist item or explicitly defer it with a reason, fallback, and validation impact. Treat the approved composition checklist as the generation contract; do not generate or return a package unless every required checklist item is implemented or explicitly deferred with reason.

Business Travel schema-practice carry-forward: generated data-list and document-library child resources must include `ListModel.Flags = 1`, keep `ListModel.Type` within the schema-v2 enum, and use `ListModel.Status = 1` when Status is emitted. `Defs` and `Layouts` must be arrays, not `null`. FieldIndex/FieldName suffix synchronization, unique identifiers, and valid InternalName rules remain hard gates before import.

Pivot Table runtime-proof carry-forward: the v1 generated package imported but its seeded `ListDatas` rows did not appear and manual Add failed because data-list field definitions were cloned by array position, crossing `FieldName` and `FieldType` storage metadata. The v2 package cloned definitions by `FieldName`, included 20 safe rows, and the user confirmed rows, Pivot Tables, and Add new item worked. Future generated data lists, especially analytics/demo lists, must keep storage families aligned (`Text* -> Text`, `Datetime* -> Datetime/date`, `Decimal* -> Decimal/number`, `Bigint* -> Bigint/integer`, `Bit* -> Bit/boolean`) and validate seed-row keys against those fields before handoff.

LayoutView add-form hardening: generated Data Lists that expose the default `+ New item` action must include runtime-safe `ListModel.LayoutView` display settings. `LayoutView.add` must point to a real Type `1` New/Edit custom form layout in the same list; `opentype.add` and `modalsize.add` alone are not enough and can leave the Add modal loading forever. The focused fixed Container/Button action package is user-confirmed to import, open `Action Runtime Requests`, and render the default `+ New item` Add modal when `add/edit/view` resolve to concrete Type `1` layouts and object-shaped display-settings `sort` is omitted. `LayoutView.view` must resolve when present, `LayoutView.edit` may be `default` only when intentionally using Yeeflow default edit behavior, and display-settings `sort` should be omitted unless using an export-supported field-ID array shape. Do not put Type `0` view sort objects such as `{ SortName, SortByDesc }` in `ListModel.LayoutView.sort`. This proof does not cover Add form save/data mutation, Public Forms, Document Libraries, Form Reports, or unrelated generated app patterns.

Data List Form Layouts v1.1 is the canonical page-level golden reference for generated custom Data List New/Edit/View forms. New Item and Edit Item custom forms must clone `data_list_form_layout_new_edit_v1_1`; Standard View Item forms must clone `data_list_form_layout_view_item_v1_1`; full-page Workbench View Item forms must clone `data_list_form_layout_workbench`. The template source files live under `docs/reference/data-list-form-layout-new-edit.template.json`, `docs/reference/data-list-form-layout-view-item.template.json`, and `docs/reference/data-list-form-layout-workbench.template.json`, with registry metadata in `docs/reference/data-list-form-layout-templates.json`. Keep the template root, `main > content`, background, full-width/zero-padding root contract, content sections, widths, spacing, typography, and locked non-business regions intact. Business-specific fields and actions may be placed only in `page_title_content`, `Operations`, the `section_content_area` of `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`, `section_title_header`, and `kpi_card_wrapper`. New/Edit forms must not include related Collections, Data Analytics, or KPI regions; View forms may include approved related-data components only inside allowed slots. Workbench View Item forms must remove empty `right_side_panel` content; when the right panel is removed or has no real business content, normalize `main_work_queue_wrapper` to one `1fr` Grid column for desktop/laptop, tablet, and mobile so the form does not retain a blank second Workbench column. The host Data List `ListModel.LayoutView.add/edit/view` must point to concrete Type `1` layouts using the correct template family.

Standalone `.ydl` generation and full-application `.yapk` Data List materialization must share the same Data List schema, custom form layout, field-grid, reverse-related Collection, workflow/task-form, and validation path. Do not hand-build a separate standalone `.ydl` field mapper, form body, or custom layout shell when the full-app path would use Data List Form Layouts v1.1, Data List Form Fields Grid v1.1, Sub list, Data table, Data Analytics, or reverse-related Collection builders. If a standalone `.ydl` cannot carry app-level packaging context, state that proof boundary, but keep the generated list body and custom forms produced through the same builders and gates as full-app materialization. Treat `STANDALONE_YDL_SHARED_GENERATION_BYPASSED` as a hard failure when a standalone export is generated from a simplified path. See `docs/standards/standalone-export-shared-generation-standard.md`.

Standalone `.ydl` generation must also be plan-first. Before generating a standalone Data List export, create a Data List artifact plan that declares `Artifact Type: data_list`, fields/storage/control mappings, views and fixed `LayoutView.filter[]` rules, New/Edit/View/Workbench form template selections, field-grid selections, reverse-related Collection plans, workflows, sample-data/lookup proof boundaries, shared builder family, generation contract, and proof boundary. Project that plan into trace JSON with `artifactType: "data_list"`, `dataList.fields[]`, `dataList.views[]`, `dataList.forms[]`, `sharedBuilder.required = true`, validator list, and `conformance.planToActualRequired = true`. Run `scripts/validate-standalone-artifact-plan-trace.mjs --plan <data-list-plan.md> --trace <data-list-plan.trace.json>` before standalone handoff. Treat `STANDALONE_ARTIFACT_PLAN_MISSING`, `STANDALONE_ARTIFACT_TRACE_MISSING`, `STANDALONE_ARTIFACT_SHARED_BUILDER_MISSING`, and `STANDALONE_ARTIFACT_PLAN_TO_ACTUAL_NOT_REQUIRED` as hard failures.

Standalone `.ydl` exports must also pass import-readiness validation before handoff: `node validate-ydl-list.js <file-or-decoded-json> --mode generator --stage final --strict-import-ready`. The strict import contract requires `Defs[].Rules` to stay stringified JSON, demo `ListDatas` to omit audit/system fields (`Created`, `Modified`, `CreatedBy`, `ModifiedBy`, and display-name variants), Type `1` custom form layouts to keep `LayoutView: null` while storing the form JSON in `LayoutInResources[0].Resource`, and the default Type `0` view to keep `Ext1.Url = "default"`. Business slugs belong only on non-default views. Do not confuse the Type `1` layout's own `LayoutView` with `Item.ListModel.LayoutView`, which is still where New/Edit/View display settings reference concrete custom form LayoutIDs. The packaged `scripts/validate-ydl-list.js` entrypoint is a shim to the shared root validator, and `scripts/build-ydl-wrapper.js` must run the same `--strict-import-ready` gate before writing and again after round-trip decode.

Reverse-related child-record sections on Data List View Item forms must be planned and generated from lookup relationships. When a child Data List contains a lookup field to the host list and users need to inspect or create child rows from the parent record, add a `Reverse-Related Collection Selection` row to Section 10 of the App Plan and generate a reverse-related Collection section only on the parent View Item or Workbench View Item form. The Collection must filter child rows with `childLookupField == current host ListDataID`; any search-filter must be consumed by Collection `attrs.data.fulltext[]`; any Add `action_button` must target the child list and include `attrs.passvalues[]` where `Name` is the child lookup `FieldName` and `Value` is the current host `ListDataID` expression. Never use parent display text, title, labels, hardcoded row IDs, or sample IDs as lookup values. Mark generated sections with reverse-related metadata so `validate-data-list-form-layout-template.mjs` can enforce the contract. Run the validator with both `--plan` and `--package` so planned reverse-related rows fail when the generated package omits the matching section.

Current-record fields on New/Edit/View custom Data List forms must use the Data List Form Fields Grid v1.1 template `data_list_form_fields_grid_v1_1` from `docs/reference/data-list-form-field-layout-templates.json`. Clone `form_grid_fields_wrapper` into the selected page-level template's approved content-card `section_content_area`, then place field controls inside that Grid. Approved hosts are `content_card_wrapper`, `content_card_60_wrapper`, and `content_card_40_wrapper`. Do not place Data List field controls directly in `section_content_area`. Set every generated field control margin to zero and assign each field control a business-specific `nv_label`/`nav_label` based on the actual field or field group purpose. Multiple line, Rich text, and Sub list controls must span the full parent Grid width on every responsive breakpoint. PC/laptop columns should be 2 or 3, tablet columns must not exceed PC/laptop columns, and mobile columns should be 1. If several fields share a Dynamic display rule, group them in a Container or nested Grid and put the rule on the group.

Sub list fields on custom Data List forms must use the control-level golden reference template `data_list_form_control_sublist_v1_1` from `docs/reference/data-list-form-control-sublist.template.json`. Clone the full `list` control subtree and preserve its table, header, row, card, border, padding, typography, and zero-margin settings. Only map the business Sub list label/title/name/binding/nav label, `attrs.list-variables`, `attrs.list-fields`, nested field control types, and the column-span metadata required by the parent Grid. Do not generate simplified `list` controls for Sub list fields.

Persisted Data List Sub list fields must be real `Type: "list"` / `FieldType: "Text"` fields whose stringified `Rules["list-variables"]` define the row schema. Add `Sub List Row Fields` to the App Plan field table, then use that single schema to build both field Rules and the custom-form `attrs.list-variables/list-fields`; never keep business columns from the cloned template. Every nested row control must have a non-empty business `label`, bind to its row field ID, reference the parent Sub list binding and control ID, and use a unique control ID. Text/user/date/number/boolean/file rows map to input/identity-picker/datepicker/input_number/switch/file-upload. Data List official exports do not require Approval Form's `label_var: null`; validate the Data List label contract without importing that Approval-only rule. Treat all `DATA_LIST_FORM_SUBLIST_COLUMN_*`, `DATA_LIST_FORM_SUBLIST_ROW_SCHEMA_MISMATCH`, and `DATA_LIST_FORM_SUBLIST_FIELD_RULES_SCHEMA_MISMATCH` findings as pre-signing failures.

Data List Sub List Summary contract: plan summaries in `Sub List Summaries` with `sourceRowField:summaryType:targetKind:targetId`, then materialize `attrs["list-fields-summary"][]` from the same plan on every generated custom form that renders the Sub List. Generated summaries support export-proven `total` and `avg`, require numeric row sources, and may be visible without binding. Use `__list_` only for a real numeric host field and `__temp_` only for a declared form-resource `tempVars[]` entry; never use Approval's `__variables_` prefix. Summary IDs must be UUIDs and all missing/mismatched source, prefix, target, and target-type findings are pre-signing failures.

Plan-to-list generation: generate Data Lists from the application plan, not from a minimal placeholder guess. Confirm each planned list's business purpose, key fields, status/state fields, lookups, line-item relationships, forms, views, dashboards, workflow writes, and reporting use before packaging. If required fields or process statuses are missing, ask focused clarification questions before generation. If a non-blocking field is uncertain, state the assumption in the plan.

Do not omit planned lists, important fields, New/Edit/View forms, lookup/master lists, or required sample/reference rows silently. A generated list is complete only when it supports the planned forms, dashboards, actions, workflows, and validation checks. Lists used by Data tables, Collection/Kanban/Timeline controls, charts, Pivot Tables, or approval persistence must expose the fields those controls display or write.

Data List forms should be designed like web-app record pages before controls are selected. Decide whether each form should be simple, dense, printable, mobile-friendly, review-focused, or operational. Map multi-section detail pages to Tabs, Toggle, containers, grids, dividers, alerts, Steps bar, Progress controls, and status fields. Map line items, invoice details, purchase items, and repeating request details to Dynamic Sub List with body grid, containers, row actions, and summary settings. Map printable records to Print Page with read-only fields and Dynamic Sub List where needed.

Use style settings for safe padding, card/section spacing, grid columns, typography hierarchy, status colors, responsive layout, and print readability. Use scoped custom CSS only for special sub-list/table layouts, print-page formatting, spacing/alignment refinement, or visual states when standard settings are insufficient. Use Custom code control only when a record-page interaction cannot be met with standard controls, form actions, lookup configuration, expressions, or custom CSS.

When Data List form or print-page mockups are provided, extract them into the UI implementation spec before generation. Preserve the visible layout hierarchy, section cards, Tabs/Toggle structure, field groups, Dynamic Sub List rows, file/document areas, action buttons, read-only print fields, QR/barcode areas, and print CSS requirements. Do not simplify mockup-backed forms into raw ungrouped fields.

Generated Data List form quality: New/Edit/View custom forms should use an outer page section/container with safe left/right padding. Recommended desktop horizontal padding is 24px to 32px when supported, with smaller responsive padding for narrower surfaces. Group fields into clear sections or cards, avoid controls touching page edges, and keep row/section spacing readable so generated forms are usable without manual designer cleanup.

Data-bound controls placed on Data List forms must resolve their source, field bindings, and actions before handoff. Do not generate empty tables, empty dynamic item templates, unbound progress/steps controls, or buttons without valid actions. When a Data List feeds a dashboard Data table, Collection, Kanban, Timeline, chart, or Pivot Table, plan the displayed fields and validate that the fields resolve to the selected source list.

Native Data table controls on Custom Data List forms, Data List workflow task forms, and Schedule workflow task forms must use an approved Data table golden reference from `docs/reference/data-table-golden-references.json`. Choose `data_table_control_standard_scroll` for many-column horizontal-scroll tables, `data_table_control_standard_no_scroll` for small-column auto-fit tables, or `data_table_control_caption_scroll` when caption title, search, add item, and import/export menu behavior are required. Clone the selected export-shaped `data-list` control, preserve locked style/layout attrs, map only source list, display columns, and allowed caption text, and include both `templateId` and `dataTableTemplateId`. Do not use Data table as a substitute for rich Collection/card/multiselect/Kanban/Timeline templates. Run `scripts/validate-data-table-golden-references.mjs --package <package.yapk> --plan <yeeflow-app-plan.md>` before signing readiness when generated forms include native Data tables.

App Plan gate: before data-list or custom-form generation, the approved App Plan must state how each Data List is displayed on pages, including Data table, Collection, Kanban, Vertical Timeline, or Horizontal Timeline selection and reason. Custom Data List forms that include a Sub List must either plan Sub List list actions with current row context, steps, affected Summary fields, parent field bindings, and runtime proof boundary, or explicitly state `No custom Sub List actions required`. Unknown field/control/action/property shapes must be marked `export-learning-required`, `runtime-proof-required`, or `deferred` before generation.

The App Plan must also include a Data List Form Layout Template Selection table for each custom Data List form. New/Edit form rows must select `data_list_form_layout_new_edit_v1_1`; standard View form rows must select `data_list_form_layout_view_item_v1_1`; full-page Workbench View form rows must select `data_list_form_layout_workbench` and declare Open in: Full page. It must also include a Form Fields Layout Template Selection table for each generated current-record field group, selecting `data_list_form_fields_grid_v1_1` and declaring PC/laptop, tablet, and mobile column counts plus any full-row field controls. When reverse-related child-record display is needed, it must include a Reverse-Related Collection Selection table that names the host list, View Item form, child list, child lookup field, approved grid-table Collection template, search plan, Add plan, and `<child lookup FieldName> = current ListDataID` default. The App Plan should describe business sections and related data needs, but it must not contain generated `ListID`, `LayoutID`, `FieldID`, JSON payloads, or low-level runtime properties. Run `scripts/validate-data-list-form-layout-template.mjs --plan <yeeflow-app-plan.md>` and, after materialization, `scripts/validate-data-list-form-layout-template.mjs --package <generated-final.yapk> --plan <yeeflow-app-plan.md>`; keep generation blocked when selected templates, responsive field-grid rules, or planned reverse-related sections do not match the generated package.

## Template Library Contract

Full application generation must use the reusable Yeeflow UI section template library when one is available. Composition checklist sections must reference a known `templateId` from `docs/templates/yeeflow-ui-section-template-library.normalized.json`, and generated packages must satisfy the referenced template's required controls, data bindings, fields, layout/card/padding rules, style rules, and action rules. Feature knowledge alone is not enough; use reusable UI templates for dashboard headers, KPI cards, alert cards, Data table sections, Kanban/Collection item cards, detail headers, sectioned forms, document checklists, print pages, and action bars.

Generate full applications page by page. Validate each page/form/dashboard against template conformance before assembling or returning a package. Do not satisfy a template with placeholder controls, title-only cards, default alert copy, blank custom forms, or active buttons without valid action bindings. If a template cannot be implemented safely, explicitly defer the section with a reason, fallback, and validation impact before generation.
Use the reference app corpus as the first source of export-proven UI section patterns before inventing new layouts. Prefer safe patterns from `Company Overview (3).yap`, `Data Lists (4).yap`, `Projects Center_2.yap`, and `Sales_Management_AD.yap` for advanced dashboard controls, custom list forms, Kanban/Collection item templates, actions, Data tables, related-record sections, filters, and operational workspaces. Use `DEMO Innovation Ecosystem Platform (1).yap` / `NHIC Innovation Overview` and `Service Desk Pro (2).yap` / `Executive Dashboard` as KPI dashboard references. Use `Online Library.yap` / `Inventory` and `Print Inventory` plus `Online Library (1).yap` / `Print Inventory` as multi-inventory print and per-item QR references. Use `Sales Quotation.yap` and `Sales Quotation (1).yap` as single-item print and print-QR references. For print pages, QR Code should bind to current item/current record or a business code field; do not generate static placeholder QR URLs. A new broad golden app is no longer needed for known template-library gaps, but browser print/page-break and scanned QR destination behavior still need runtime/manual proof.

## Vendor Onboarding v4.1 Hard Checks

Treat the completed Vendor Onboarding v4.1 iteration as a golden generation reference. Future full-app generation must hard-check these rules before handoff: dashboard pages use `Main > Content`; layout-only Grid controls have display caption off; every Navigator control label is meaningful rather than defaults like `Container`, `Grid`, `Text`, `Dynamic field`, or `Kanban`; KPI numeric cards are data-bound through Summary controls, `attrs.save_var`, dashboard `tempVars`, and visible formatted Text controls rather than static numeric Text; active buttons use valid action bindings; dynamic controls are placed only where context supports them, especially inside Kanban/Collection/Timeline item templates; generated data lists include valid schema, visible default display fields, selected lookup display fields, runtime-visible choice options in Rules.choices, not Rules.Options, and sample data. Keep the remaining Vendor lookup picker no-record behavior as a known product-team follow-up, not a reason to remove lookup display-field validation.

## Packaged Generation Standards

Apply the packaged standards in `docs/standards/` before generating or returning application packages. `data-list-generation-standard.md` requires native `Title`, no generated `Text0` primary field, runtime-visible choice options in Rules.choices, not Rules.Options, full default view display/query shapes, lookup relationships for related lists, dependency-ordered sample rows, and selected lookup display fields. `dashboard-summary-card-generation-standard.md` applies only to Dashboard pages and supported Data List custom forms because Summary controls are not available on approval forms or Data List public forms; do not generate Summary controls on unsupported surfaces. `account-health-smoke-issue-summary.md` records the first-generation smoke failures that must remain regression-tested. Run the matching validators and treat missing standards compliance as a generation failure, not a cosmetic warning.

Preserve App Plan field-key contracts during materialization. Business fields named `Status`, `State`, `Stage`, `Priority`, `Requester`, `Assigned Agent`, or similar labels are real fields, not placeholders. If the App Plan specifies a schema-safe key such as `Status | Text5`, keep that exact `FieldName` and align `FieldIndex`, `InternalName`, default view columns, form controls, filters, Collections, and sample rows to it. User/person/assignee/requester/agent/owner fields should remain identity-picker-compatible controls with schema-safe Text-backed storage unless the App Plan explicitly states otherwise; do not let them regress to ordinary text inputs.


## Application Navigation References

When a generated application exposes data lists through the app navigation menu, reference each list from the root app `Data.Item.ListModel.LayoutView.sort[]` using `Type = 1`, the list `ListID`, root `ListSetID`, `Title`, optional `DisplayName`, optional `Icon`, and boolean `IsHidden` when needed. Omit `DisplayName` to allow Yeeflow to use the data list title as the menu label. Use `Icon: ""` for no-icon.

Data-list menu items can be top-level resources or children of a top-level custom group. Groups are app-level navigation items with `Type = "classes"` and cannot be nested; maximum menu depth is two layers. Validate navigation references with the package validator before building a wrapper.

Use this skill when the user asks to inspect, validate, generate, package, debug, or improve Yeeflow data-list `.ydl` exports or decoded data-list JSON.

Data Filter controls can be used in data list forms at the product level, but the Sales and CRM exports only prove dashboard page usage. Until a data-list-form export proves the exact host schema, treat data-list-form Data Filter placement and runtime behavior as product-documented only. Reuse the shared rules from `docs/studies/data-filter-controls.md`: filter variables bridge value-producing filter controls and downstream data-bound consumers; Search, Radio, Hierarchy, and Sorting are dashboard export-proven from the CRM sample; Apply button and Remove filters are special controls; generated packages must validate every filter variable reference before handoff.

Pivot Table controls can be used in Data List forms at the product level, but the CRM sample currently export-proves only Type `103` dashboard usage. Until a data-list-form export proves the exact host schema, treat Data List form Pivot Table placement as product-understanding-backed and keep runtime behavior unproven. Reuse `docs/studies/pivot-table-control.md`: Pivot Tables are Data Analytics controls with rows, columns, values, supported list-like data sources, compatible aggregations, optional date grouping, optional data filter conditions, and readable header/body/grand-total styling. Place `data_analytics_pivot_table_standard` / `pivot_table_standard` inside `content_card_wrapper > section_content_area`, preferably in a one-column section; use multi-column sections only for narrow/few-column pivots. Do not place Pivot tables in `chart_cards_section`, and do not generate Pivot Tables on Data List Public Forms. Validate every source, field, aggregation, date-grouping, and filter-variable reference before handoff.

Collection/Kanban dashboard action note: `Company Overview (2).yap` export-proves Collection/Kanban current-item actions against Data List sources, including edit form open, delete/update through `ListDataID`, selection variables, and bulk `setdatalist` operations. When a generated Data List is the source for dashboard Collection/Kanban actions, make sure its fields, edit/view layouts, and safe Add/Edit/View forms resolve before wiring item actions. Data List custom-form action support is not proven by this export; keep cross-host action claims product/user-understanding-backed until a Data List custom-form export is studied.

For existing-app upgrades, data-list changes should be packaged as `.yapk` only from a Yeeflow Version management baseline and only when the upgrade package structure is safe. Preserve existing list IDs and app identity. Do not apply new-app `.yap` fresh-ID rules to existing list objects, and do not claim offline `.yapk` list mutation is safe while the studied `.yapk` `Resource` remains opaque/signed.

## Standard Workflow

Follow the staged path:

```text
business requirement
  -> decomposition
  -> normalized data-list spec
  -> decoded .ydl draft
  -> structural validation
  -> app-context/dependency validation when needed
  -> wrapper build
  -> sandbox import by user/operator
  -> export-back learning
```

Prefer native Yeeflow list features first: fields, Rules, lookups, views, custom list forms, public forms, sample data, notifications, permissions, and list workflows only when truly needed. In a full application plan, each planned list should explicitly decide required views, default columns, filters/sorts/grouping, custom New/Edit/View/Public/Print forms, list workflows, notifications/reminders, permissions, sample rows, and dashboard/report consumers before generation. Planned list fields should use the standard detailed table: `Field Name`, `Display Name`, `Type`, `Required`, `IsUnique`, `Placeholder`, `Example/Values`, `Description`, and `Notes`, so generation has both internal identifiers and user-facing copy. Full-app materialization must also tolerate legacy App Plan field tables that use `Display Name | Storage Name | Control`; `Storage Name` maps to the internal field key, and `Control` can infer Text/Decimal/Datetime/Bit storage when `Type` or `Field type` is absent. Recognizable field tables must never silently collapse to a Title-only list; unsupported headings should fail before generated-final handoff. Planned custom list form controls must also state `Read Only`, `Default Value`, `Auto Fill / Source`, and `Custom Validation` so generated New/Edit/View/Public/Print forms preserve intended editability, defaults, calculated values, lookup additions, current-user/requester context, and submit/save blockers. For special validation, document the rule, trigger, error message, implementation approach, and proof level before generation.

Lookup field seed values must be generated and written as target-record `ListDataID` references. A lookup field's user-facing title or code is only display text; it is not the stored value. Companion seed artifacts must mark lookup fields with `seedValueType: "lookup"`, `requiresLookupListDataIDResolution: true`, `storedValueField: "ListDataID"`, and target-list/display-field metadata so the live seed writer can create/read parent rows before writing dependent rows.

Data-view generation should follow `docs/studies/data-view-resource-settings.md` and the redacted refs under `docs/studies/normalized/data-views/`. Export-proven view rules from `Data Lists (1).yap`:

- Views are `Layouts[]` entries.
- View URL/key lives in parsed `Ext1.Url` and should be unique within the resource.
- Default view detection uses `IsDefault = true`; do not rely only on the title `All Items` because one sampled default was renamed.
- Type `0` is list view, Type `999` gallery, Type `104` kanban, and Type `100` calendar.
- Fixed filters live in `LayoutView.filter[]`; end-user filterable fields live in `LayoutView.query[]` entries with `IsFilter = true`.
- Business-specific Data Views must materialize fixed dataset constraints in `LayoutView.filter[]`; adding only `query[]` user filters is not enough. For Event Planning-style views, `Schedule Overview` uses `Datetime1 op "7" right null` and `Datetime1 op "3" right [{type:"func",func:"now",params:[]}]`, `RSVP Tracker` uses `Text3` and `Text4` non-empty filters joined with `and`, and `Budget and Vendors` uses `Text7` or `Decimal1` non-empty filters joined with `or`.
- App Plan Section 13 may label the fixed-filter column as `Filter Conditions`, `Fixed Filters`, `Filter`, `Filters`, `Data Filter`, or `Data Filters`; all of these must feed `LayoutView.filter[]`.
- Fixed-filter cells must be executable field-level conditions. Do not write or accept vague phrases such as `All active meetings`, `lifecycle tracking`, or `active items` unless they are converted to concrete conditions such as `Meeting Status = Active`, `Meeting Date is not empty`, or `Minutes Status != Closed`.
- If a non-empty fixed-filter cell is not an explicit all-record/no-filter marker and materializes to an empty `LayoutView.filter[]`, stop with `DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED` instead of handing off a package.
- If a planned Data View references non-Title columns, query/search fields, or fixed filters, the Data List must have a parseable field table. Do not fall back to a native `Title`-only list/view; stop with `DATA_LIST_FIELD_TABLE_REQUIRED_FOR_PLANNED_VIEW`.
- Yeeflow Data View filters do not use a `Today` function in the current export-proven shape. Convert business wording such as `Date >= Today` to the `now` function token and run `scripts/test-data-list-view-filter-gates.mjs` / `validate-ydl-list.js --mode generator --stage final`.
- Sort fields in `LayoutView.sort[]` must resolve to valid fields or known system fields.
- Gallery uses `TitleField` and optional `CoverField`; kanban uses `TitleField`, `CategoryField`, optional `CoverField`, and `IncludeUncategorized`; calendar uses `Columns` and calendar color/scope settings.
- Data List permission flags are export-proven in `Data Lists (1).yap` at `ListModel.Perm`, `ListModel.IsBreakInherit`, `ListModel.IsItemPerm`, and view-level `Layouts[].IsItemPerm`. UI-confirmed administrators, basic edit/view audiences, and advanced edit/delete/new/import/export matrix rows were not located in the package payload after deep nested-JSON search; treat those detailed audiences as unproven for generation and warn on opaque custom audiences.
- Data List notifications are export-proven in `Data.Childs[].RemindRules[]`. `Event planning 5` contains item-added Type `1`, regular reminder Type `2`, date-field reminder Type `3`, and item-changed Type `4` rules. `Rules` and `Receiver` are stringified JSON; recipients can be users Type `1`, departments Type `2`, user groups Type `3`, and list-field recipients via `Receiver.ListDefs[]`. Do not claim notification delivery without runtime proof.

Do not claim runtime behavior for view switching, permissions, calendar rendering, or kanban drag/drop without a focused runtime baseline.

## Hard Stop Conditions

Do not build a final `.ydl` when:

- placeholders remain
- `validate-ydl-list.js --mode generator --stage final` fails
- required app/list/field metadata is missing
- generated field storage metadata is crossed, such as `Text*` with `FieldType: Datetime`, `Datetime*` with `FieldType: Text`, or `Decimal*` with `FieldType: Text`
- generated main/list metadata is missing `MainListType` or `ListModel.ListType`
- duplicate `FieldName` or `InternalName` values exist
- standalone `.ydl` strict import-ready validation fails, including object-shaped `Defs[].Rules`, seeded audit fields in `ListDatas`, non-null Type `1` custom-form `LayoutView`, missing `LayoutInResources[0].Resource`, or a default view URL other than `default`
- standalone `.ydl` custom forms are generated from a simplified path instead of the shared Data List Form Layouts v1.1 and Data List Form Fields Grid v1.1 builders
- a generated standalone `.ydl` reuses one generic custom form for New, Edit, and View instead of concrete New/Edit and View Item layouts
- current-record custom form fields are placed outside `form_grid_fields_wrapper`
- lookup targets or target display fields are unresolved
- full-app App Plans reference lookup target lists that are not planned/generated as Data Lists; do not silently emit lookup `Rules: ""` for missing targets
- sample lookup values are unknown or unsafe
- sample lookup values do not map to valid referenced target rows
- external resolved lookup IDs would be included in `Resource.ReplaceIds`
- production IDs are guessed
- custom form bindings are unresolved
- workflow, AI, HTTP/API, credential, user, file, or external dependencies are unresolved
- list workflow actions do not satisfy the normalized action reference from `workflow-action-configurations.normalized.json`
- no sandbox import/export round trip has proven production readiness

Do not import anything, operate Yeeflow UI, or modify original exports unless the user explicitly asks.

## Scripts

Use bundled scripts from `scripts/`:

- `inspect-ydl-package.js`: decode `.ydl` and inventory fields, views, forms, workflows, lookups, sample data.
- `inspect-data-views.mjs`: decode `.yap` and inventory data-list/document-library/Form Report view schema without writing raw payloads.
- `extract-ydl-metadata.js`: extract machine-readable metadata from one or more `.ydl` files.
- `validate-ydl-list.js`: validate decoded data-list JSON or `.ydl` wrapper.
- `validate-ydl-against-yap.js`: validate list dependencies against `.yap` metadata or compatible metadata.
- `build-ydl-wrapper.js`: build `.ydl` wrapper only after final validation passes.

Common commands:

```bash
node scripts/validate-ydl-list.js ./draft.json --mode generator --stage draft
node scripts/validate-ydl-list.js ./final.json --mode generator --stage final --dependency-map ./dependencies.json --strict-import-ready
node scripts/build-ydl-wrapper.js ./final.json ./output.ydl --title "List Name" --description "Sandbox generated list" --dependency-map ./dependencies.json
```

When a generated data list includes workflow actions, run workflow-aware validators and stop on missing required action properties, invalid enum/type values, invalid `QueryData` filters, invalid `SequenceFlow` conditions, invalid `Loop`/`Delay` condition shapes, or unsafe external/credential-related actions. Never bundle credentials, API keys, tokens, connection secrets, or tenant-specific sensitive values.

Scheduled Workflow export learning: `AI Agent and Copilot Local Resource Baseline8.yap` proves `QueryData` can be used from an app-level Scheduled Workflow (`WorkflowType = 3`) to query a local data list and write multiple results into a text workflow variable with `result.listParent = "__variables_"`, `result.listName`, `result.vartype = "text"`, and `result.fields[]`. Validate that the queried list and selected fields resolve before generating or runtime-testing.

The V1.6/V1.7 Workflow Query Data exports prove shared QueryData result contracts plus Data List Workflow current-record usage. Multiple rows intended for iteration use a List workflow variable backed by `variables.listref`/Complex Type fields, `result.vartype = "list"`, `fieldMap`, and `fields = null`. V1.7 proves count-only QueryData in `WorkflowType = 1` using current-record `ListDataID`, complete `> 0` / `<= 0` branching, and downstream ContentList edit/add. It also proves all three Loop modes: List variable (`__variables_`) or Data List Sub List (`__list_`), multiple values (`loopType = "values"`, `type = 2`, expression array), and fixed times (`loopType = "number"`, numeric expression array). Every Loop requires a resolving LoopBody, whose actions are nested in `LoopBody.children[]`. Current iteration is `LoopIndex`; current row values use `LoopItem.<field>`.

V1.10 proves Data List Workflow QueryData against Document Library (`listtype = 16`) and Form Report (`32`), including current-record lookup filters, List/ListRef result mappings, counts, non-default Page Number/Page Size, and two sorts. The same export also proves single-result Form Action queries from a Data List custom form. Form Report is a source only; Data Report remains deferred.

Data-list workflow export learning: `Spark & AI (1).yap` proves list workflows are registered on the host list through `FlowMappings[]`, with new-item trigger shape `Setting.NewTrigger = true`, and the workflow definition itself remains a `Data.Forms[]` entry with `WorkflowType = 1` and nonzero `ListID`. `FlowMappings.FieldName` may be null, or may resolve to a real host-list `flowstatus` field as V1.7 proves; never bind an ordinary business field as a substitute trigger field. Keep `Data.Forms[].Settings = null`. The same export proves a workflow `AI` node can call an app-contained Agent, map an `icon-upload` list field into an Agent input `type = "img"`, and pass native `ListDataID` into a text input for same-row update behavior. Treat any generated list workflow that can call live AI or update rows through an Agent tool as runtime-sensitive until proven safe in an isolated sandbox package.

Data-list workflow Assignment Task learning: `Purchase Requests.ydl` proves a data-list workflow can use the same `MultiAssignmentTask` action family as approval workflows, while adding list-item context to assignee expressions. The studied export uses `FlowMappings[].Setting.NewTrigger = true`, `WorkflowType = 1`, a Start action with email notification fields but no terminate/recall fields, and an Assignment Task with a Created By list-field expression resolving `LineManager`. Its task form mixes normal task-form controls with list-bound controls using `isListControl = true`, `identifier`, `InternalName`, `fieldID`, and `____customListFields_` binding. Preserve custom list fields as read-only when the task should not update source list data; default/native fields such as Created By appear read-only in the studied export, but broader native-field behavior remains runtime-pending. Use `docs/studies/workflow-approval-vs-data-list-actions.md` and normalized refs under `docs/studies/normalized/workflow-task-forms/` before generating data-list workflow Assignment Tasks.

Scheduled workflow comparison: `Workflow Actions Runtime Baseline (1).yap` proves scheduled workflow Start and Assignment Task shapes without data-list list-field expression sources. Do not transfer `Created By` or custom list-field assignee context from data-list workflows into scheduled workflows unless a scheduled export or focused runtime baseline proves that host context.

## References

Load only the relevant reference:

- `references/operating-playbook.md`: end-to-end rules and readiness levels.
- `references/ydl-structure-study.md`: wrapper format and decoded structure.
- `references/baseline-asset-inventory-v5.md`: proven single-list custom form baseline.
- `references/related-list-lookup-pattern.md`: staged lookup and sample-data rules.
- `references/approval-form-integration-pattern.md`: generated storage list handoff to approval-form `ContentList` persistence.
- `references/knowledge-base-list-pattern.md`: Knowledge Base category/article list and lookup pattern.
- `references/validation-guide.md`: validator and builder usage.
- In the active generator workspace, use `docs/workflow-action-configuration-reference.md`, `docs/workflow-action-generation-rules.md`, and `workflow-action-configurations.normalized.json` as the official workflow action configuration reference when validating list workflows.
- In the active generator workspace, use `field-configurations.normalized.json`, `docs/yeeflow-field-configuration-reference.md`, and `docs/yeeflow-control-field-generation-rules.md` as the data-list field schema reference.
- In the active generator workspace, use `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, `yeeflow-expression-utils.js`, `docs/yeeflow-expression-generation-rules.md`, and `docs/yeeflow-expression-editor-ui-contexts.md` before generating data-list calculated fields, custom form calculated controls, lookup filters, list workflow conditions, or request-number/default-value formulas. Use enriched function metadata for selection, but keep metadata-pending functions such as `addWorkDays` and `addWorkHours` deferred.
- In the active generator workspace, use `control-configurations.normalized.json`, `docs/yeeflow-control-to-field-mapping.md`, and `yeeflow-control-field-schema-utils.js` when translating approval-form controls into persisted data-list fields.
- In the active generator workspace, use `docs/yeeflow-form-design-quality-rules.md` when data-list custom forms need to align with rich approval-form section/grid/text/icon standards.
- For generated data-list persistence, prefer Text fallback for requester/user values unless a focused native data-list identity/user field export proves the persisted shape.
- When app-level approval forms use advanced native controls, read `docs/ai-training-approval-form-control-study.md` for export-backed approval variable/control anatomy before choosing persisted data-list field fallbacks. It improves mapping context for file/image, user/department/location/cost center, metadata, lookup, lookup-list, and sublist controls, but those persisted field shapes remain runtime-sensitive unless a focused data-list export proves them.
- `references/metadata-guide.md`: `.ydl` and `.yap` metadata lessons.
- `references/examples-summary.md`: proven examples and intentionally omitted bulky artifacts.

## Generation Rules

- Use `AppID: 41` for sandbox/test packages unless target metadata says otherwise.
- Generate large numeric string IDs for sandbox `ListSetID`, `ListID`, `FieldID`, `LayoutID`, and sample `ListDataID`.
- For child lists inside a `.yap`, allocate `FieldID` values from a global app-level field ID allocator; do not reset or reuse the same field IDs per list.
- For child lists inside a `.yap`, every field's `ListID` must equal the parent data-list `ListID`; changing `FieldID` must not change `field.ListID`.
- For production or existing apps, use confirmed metadata only.
- HARD RULE: preserve `FieldName: "Title"` and `InternalName: "Title"` as Yeeflow's native primary/display field in every generated data list. `Title` must be `Type: "input"`, `FieldType: "Text"`, `IsSystem: true`, and `IsIndex: true` when emitted. Do not replace `Title` with a custom `Text0` primary field.
- HARD RULE: generated field metadata must satisfy `docs/yeeflow-system-configuration-schema-specifications.md`: supported field `Type`, unique `DisplayName` / `FieldName` / `InternalName` inside each list, valid alphanumeric/underscore `InternalName`, max 255-character identifiers, and `FieldName` numeric suffix equal to `FieldIndex`.
- HARD RULE: generated default data-list routing should keep `ListModel.LayoutView` / `List.LayoutView` as `null` unless an export-proven custom add/edit/view layout route is intentionally configured. The default Type `0` view should include `Title` as the first visible field and preserve system query fields such as `ListDataID`, `CreatedBy`, `ModifiedBy`, `Created`, and `Modified` where the baseline export uses them.
- Generated fields must keep `FieldName`, `InternalName`, and `DisplayName` unique inside each list. Duplicate display names are a Yeeflow materialization risk for generated app packages.
- HARD RULE: every generated list must pass standalone `validate-ydl-list.js --mode generator --stage final`. App-level `.yap` package validation does not replace list-level validation.
- Generated list metadata must include required list type metadata (`MainListType` for wrappers or `ListModel.ListType` for extracted list objects).
- Generated fields must have unique `FieldName` and `InternalName` values. Duplicate internal names are blocking because they can pass broad package checks while breaking list import/query behavior.
- Business concepts such as "Request No.", "Name", "Equipment Name", or "Center / Department Name" may be displayed on `Title`, but the underlying `Title` metadata must remain native/system/indexed. Use `Text1`, `Text2`, etc. for additional business text fields.
- Use `Decimal` + `input_number` fields for persisted numbers; `Decimal1` is the proven generated slot in Visitor Access Management v11.
- Use `Bit` + `switch` fields for persisted booleans; `Bit1` is the proven generated slot in Visitor Access Management v11.
- Use calculated data-list fields only when the field formula is export-backed. When an approval form has calculated display values such as `Subtotal = Quantity * Unit Price`, prefer persisting the source quantity/unit price plus a Decimal result only if `ContentList` mapping is type-compatible and validated.
- For approval-form sub list/listref totals, prefer persisting summary-bound top-level variables such as `TotalAmount`, `TotalQuantity`, and `AverageUnitPrice` into Decimal fields. `Expression Sublist Summary Workflow Test v1` proved this path for generated app packages. Direct child-row-to-data-list persistence remains deferred until a focused export/runtime proof exists.
- Use Yeeflow expression-token arrays for calculated/default/filter formulas. Do not generate JavaScript formulas or invented expression function names.
- Use text/radio-compatible fields for single-select storage; selected option values are stored as text.
- Custom forms must follow the Asset Inventory v5 pattern:
  - `Layout.Type = 1`
  - `Layout.LayoutView = null`
  - `Layout.Ext2 = "{\"src\":true}"`
  - `Layout.IsItemPerm = false`
  - `LayoutInResources[0].ID = LayoutID`
  - `LayoutInResources[0].RefId = LayoutID`
  - `LayoutInResources[0].Resource` is a JSON string with `children`, `attrs`, `title`, `filterVars`, `ver`, `tempVars`
  - `Item.ListModel.LayoutView.add/edit/view` points to the custom form `LayoutID`
  - for generated lists with default New item enabled, `Item.ListModel.LayoutView.add` is mandatory and must resolve before handoff
- Single lookup sample values are plain target record `ListDataID` strings.
- For staged standalone related lists, import/export the reference list first, patch the dependent lookup to real metadata, and exclude external lookup IDs from `Resource.ReplaceIds`.
- For app-level `.yap` internal lookup samples, target sample record IDs are local IDs, should be included in `ReplaceIds`, and dependent lookup sample values may reference those local IDs.
- Lookup dependencies must resolve to a target list and display/search field. Standalone generated lists need a dependency map for external lookups; app-level internal lookups should resolve inside the package.
- Sample lookup values must map to actual referenced target rows. If the master/reference list is local, include sample/reference rows; if it is external, provide a dependency map or omit unsafe sample lookup values.
- Master/reference lists referenced by generated forms, dashboards, or workflows must be usable runtime lists, not placeholders. Include sample data where needed for local validation and runtime smoke testing.
- For generated `ListDatas` seed rows, clone field definition templates by target `FieldName`, not by `Defs[]` array position. Seed row keys must resolve to fields whose `FieldName`, `FieldType`, and `Type` agree with the runtime value format. Do not claim analytics runtime proof from empty/unpopulated controls.
- For generated lists intended as approval-form storage targets, build/import/export the `.ydl` first, then use exported-back list and field metadata to patch the approval form `ContentList` target.

## Document Library Carry-Forward

Document libraries reuse many data-list mechanics but are not normal data lists. When an app package includes a document library, route app-level generation through `yeeflow-application-generator` and validate the resource as Type `16`.

Data List / Document Library manage-permissions and custom notifications are product-documented for both resource types, but this pass export-proved the package fields only for Data Lists because `Data Lists (1).yap` contains no Type `16` resources. Do not clone Data List `RemindRules` or permission flag generation into Document Library packages as export-proven until a focused Type `16` export proves the exact schema.

Form Reports reuse list-like child resources and Type `0` views but are not normal data lists. `AI Training-2 (1).yap` export-proves Form Reports as Type `32` app child resources generated from submitted approval form variables and optional one sub-list. Do not add arbitrary custom data-list fields, data-list workflows, sample `ListDatas`, or editable forms to a Form Report. If a business requirement needs editable operational records, generate a normal data list; if it needs submitted approval reporting, route through `yeeflow-form-report-generator`.

- `ListModel.Type = 16` identifies document libraries.
- Full-app App Plan resource typing is authoritative. If a Section 4 resource or navigation target is planned as a Document Library, the application generator must emit a native Type `16` child and Type `16` navigation entry, not a Type `1` Data List with file-upload fields. Use a separate Type `1` register/index list only when the business also needs workflow metadata.
- Document libraries use the same `Defs[]`, Type `0` views, and Type `1` custom form storage model where export-proven.
- Preserve document default fields exactly from `Projects Center.yap`: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, and `Text4`.
- Preserve the Type `16` runtime metadata contract: `Title` keeps `FieldIndex=0`, `Status=1`, `IsSystem=true`, `IsIndex=true`, and `displayLabel + isLibrary`; support-field statuses are `Bigint1=127`, `Text1=119`, `Bigint2=99`, `Text2=99`, `Text3=319`, and `Text4=57`; every support field uses `IsSystem=false` and `IsIndex=false`; `Bigint1/Text3` use `isNotInListFiles`, `Bigint2/Text2` use `readonly`, and every native field uses `displayLabel=true`.
- `Text4` Upload File is `FieldType = "Text"` and `Type = "file-upload"` with Rules `displayLabel=true`, `required=true`, `isLabrary=true`, and `PROP_MAXSIZE=2147483648`. Do not add legacy `Text4.Rules.isLibrary`.
- Run `scripts/validate-document-library-native-field-runtime-metadata.mjs --package <generated-final.yapk>` before signing; the same contract is a first-generation preflight hard gate. Correct Type `16`, navigation, and folder structure do not compensate for invalid native field metadata.
- Do not enforce generated data-list `Title.Status = 0` on document libraries; the studied document libraries use `Status = 1`.
- `Document Library Sample.yap` plus the runtime-passed one-library clone prove the minimal base definition is the `New Document Library` shape: default Type `0` view `LayoutView = ""`, one unassigned `New file` upload form, and no uploaded rows. Do not use the earlier generated `Baseline Documents` package as the base definition.
- The `Enterprise Document Center` v2 runtime pass accepted multiple generated Type `16` libraries with simple custom fields and configured Type `0` views.
- Do not require root app navigation or Type `103` pages for document-library-only packages; validate them as warnings in that narrow sample-proven shape.
- Root-level folder rows are runtime-proven for generated document libraries when represented in `ListDatas` with `ListDataID`, `Title`, `Bigint1 = "0"`, `Text1 = "folder"`, blank `Bigint2`/`Text2`, `Text3 = "0_<lowercase folder title>"`, no `Text4`, and blank generated custom-field values.
- Treat nested generated folder-row support through nonzero `Bigint1` / ParentID as unproven until export-backed and runtime-tested.
- Dashboard Doc library controls can display Type `16` libraries and root folders through `type = "document-library"`, `attrs.data.list`, and `attrs.data.folder.path = "0/<folder ListDataID>"`. Document-library custom-form hosting is runtime-proven for a root-bound embedded control with disabled search/add. Data-list custom-form hosting is still validation-only; do not claim it until an imported generated data-list form is reachable and the embedded Doc library control renders at runtime.
- Do not include raw uploaded document data or private file metadata in generated packages.

## YAP App Materialization Rules

When data lists are embedded in a generated `.yap` application:

- Every `FieldID` must be unique across the whole `.yap`.
- Every `field.ListID` must equal the parent list `ListID`.
- Every list must contain fields owned by that list before import.
- The app generator must not remap `field.ListID` when remapping `FieldID`.
- Run standalone `validate-ydl-list`, app-level `validate-yap-package`, and `scripts/inspect-yap-materialization.mjs` before runtime import.

## Benefit / Quota Usage Lists

For family quota, annual benefit, budget usage, entitlement consumption, or similar audit lists, include fields that support reliable query and reporting:

- native `Title` as usage record/application display
- source application number
- request/form/workflow correlation key when later update/release is needed
- applicant identifier
- applicant readable name
- readable cycle/year label
- numeric cycle number when the cycle is employee-anniversary or otherwise not a simple calendar year
- amount
- usage status such as In Progress, Occupied, Approved, Confirmed, Released, Rejected, or Not Applicable
- source application status
- submitted/approved/released timestamps when useful for audit
- source application id/link/notes when available

Quota check queries should match applicant identity + cycle number/year + active/occupied status, then aggregate amount with `arraySum`.

If quota is occupied on submission, the list must support the full lifecycle:

- create a usage row at submission/start with an in-progress/occupied status
- include in-progress/occupied and approved/confirmed statuses in future quota queries
- update or release the matching row on rejection/cancel/final approval when a runtime-safe workflow action exists
- exclude released/rejected rows from remaining-quota calculations

If update/delete is not runtime-proven, include enough fields for HR manual release and document the fallback rather than pretending the lifecycle is complete.

## Generated List Runtime Purpose

Before adding a list to a v1 app package, state:

- who maintains it
- who reads it
- which form/workflow/action writes or updates it
- whether it drives calculation, routing, reporting, audit, or configuration

Do not generate idle configuration or audit lists in v1. Use them or defer them.

## Generated Data List UI/UX Standard

When the active workspace contains `docs/yeeflow-application-design-system.md` and `docs/yeeflow-data-list-form-design-standards.md`, use them as the default generated data-list form standard. Use `docs/yeeflow-data-list-ui-ux-patterns.md` for export-level evidence. The first official UI/UX reference export is `UI and UX design (1).yap`.

Generated data lists should include two custom list forms by default:

- `Edit Item`
- `View Item`

New and Edit display settings should use `Edit Item`; View should use `View Item`. Both custom forms should use `attrs.container.cw = "2"`, zero padding with `--sp--s0` on all sides, and a `Main` -> `Content` container shell named with `nv_label`.

Global page background rule: for generated `Edit Item` and `View Item` custom forms, set full-page background on the custom form page `attrs.background`, not on `Main.attrs.common.background`. Keep `Main` structural. Use backgrounds on `Content`, field groups, cards, headers, and readonly sections only when those containers are intended as visible surfaces.

Use `docs/yeeflow-root-style-token-reference.md` for custom form token guidance. Prefer `--c--background`, `--c--neutral-light-active`, `--c--neutral-light-hover`, `--fs--base`, and spacing tokens such as `--sp--s150` and `--sp--s200` where the form schema supports style values. Avoid arbitrary custom colors and do not inject the full root stylesheet.

When the workspace includes `docs/yeeflow-text-control-generation-standards.md`, generated data-list custom form headings, helper text, card titles, and empty states must follow the Text Style Sample standard: native `heading` Text controls, inline width, `attrs.heads.ty = [null, token]` or a custom typography object, and plain string `attrs.heads.color`.

## Custom Code Controls In Data-List Forms

Use Custom Code controls in data-list custom forms only when native fields, lookup fields, form layout, validation, calculated fields, or list rules cannot deliver the required interaction.

Generation rules:

- Place the control in the custom form page JSON under `Childs[].Layouts[].LayoutInResources[0].Resource`.
- Use `type: "codein"` and include a valid script in `attrs["codein-script"]`, or use a future export-backed script reference pattern if one is proven.
- Configure `attrs["codein-script-param"]` with all required input parameters from the script.
- Bind writable outputs to list fields with `{ "type": 1, "value": { "prefix": "__list_", "value": "<FieldName>" } }`.
- Ensure every writable output field exists in the current list and is text-compatible for JSON/string outputs unless runtime proof supports another field type.
- Keep native `Title` semantics intact. If a custom code control writes to `Title`, document the reason and verify it does not break display/query behavior.
- Public-form usage is not proven by the Smart Lookup Picker export. Do not generate public-form custom code unless a focused public-form export/runtime test proves script loading, permissions, query access, and writeback.
- Run custom-code inspection and list validation before wrapper build.

CAPEX design carry-forward: the `IT Hardware CAPEX Request v4 Text Standard` baseline confirms that generated app packages should keep data-list custom forms aligned with the same page-background, `Main`/`Content`, Text, icon, and field-grid rules used by rich approval forms. Keep normal fields in clear grouped layouts and use Text/Decimal/Bit fallback persistence for runtime-sensitive controls unless native field proof exists.

Form Action Query Data v1.2 update: Custom Data List Form wrappers are export-proven. Apply `docs/standards/form-action-query-data-golden-reference-standard.md` and build through `scripts/lib/form-action-query-data-utils.cjs`. Page-load actions bind through `formAction.onLoad`; field-change actions bind through the source control's `attrs.control_event_rule`. Single queries may map to declared `__temp_` variables, current record fields through `____customListFields_<FieldName>`, or both. Multiple queries may populate the current record's real Sub list field through `querydata_listname_parent: "__list_"`; every target row id must exist in the Sub list schema, and an optional result count uses a declared temp variable. Do not copy Approval `__variables_` targets into a Data List Form.

For reverse-related rows, prefer Collection or Data Table when the requirement is read-only display. Use Query Data into a current-record Sub list only when rows become an editable working copy, such as quotation lines loaded by product type before quantity/description edits. Prefer New/Edit forms; a View Item host requires an explicit save/edit workflow and business rationale. Run `validate-form-action-query-data-custom-forms.mjs --strict-generated` before signing.
Planning must name the exact Query Data mode and current-record target; terms such as `temp collection / import buffer`, `Query Data or lookup-bound display`, and `preferably` are not generation-ready. Lookup-based filters must use the stored target record `ListDataID`, not the display title. Run `validate-form-action-query-data-plan.mjs` through Generation Readiness whenever a Data List or Document Library custom form plans Query Data.

Generated list forms should use meaningful `nv_label` names for `Main`, `Content`, `Field group`, and `Readonly section`. Keep `Edit Item` input-optimized and `View Item` display-optimized unless the user explicitly scopes out custom forms.

## Field Schema Rules

Before generating data-list fields, check the normalized field reference. Safe default field/control types are `input`, `textarea`, `input_number`, `currency`, `radio`, `switch`, `datepicker`, and `lookup` when the lookup target is local and resolved.

Always preserve the native `Title` field metadata: `FieldName: Title`, `Status: 0`, `IsSystem: true`, and `IsIndex: true`. Keep runtime-visible choice options non-empty in `Rules.choices` for `radio`/`checkbox`; keep switch defaults boolean-like; keep lookup `Rules` complete with app/listset/list/display-field metadata. Approval Form Controls Test v2 proves data-list persistence/display for `Decimal` fields with `percent` and `rate` control types, `Datetime` fields with `time`, and `Text` fields with `hyperlink` in generated app packages. Approval Form Controls Test v6 proves that readable approval-form lookup persistence should use `attrs.addition[]`/autofill variables or explicit summary text: raw lookup variables mapped into plain Text fields store the internal local row ID. Use fallback Text/Decimal fields for environment-dependent pickers, tag, metadata, and rich text until native runtime proof exists. Defer direct file/image binary fields, signer, lookup-list, nested list row persistence, embedded data-list display, and calculated-column generation unless a focused export/import proves the shape.

Sublist summary persistence update: generated approval apps can persist list summary aggregates into Decimal fields through ContentList after binding list summaries to top-level number variables. This is the preferred v1 storage pattern for totals and averages from line-item controls.

Multi-item request persistence update: when an approval form uses a workflow-form sublist/listref for multiple product/service/request lines, do not assume direct child-row-to-data-list persistence unless a focused runtime proof exists. For v1 app packages, persist the parent transaction with summary fields such as readable line summary text, total amount, and custom-package/high-value flags. If row-level reporting is required, model a separate child transaction list and add runtime proof for conditional row creation before promoting it to a baseline.

## Field Type And Sample Rules

Generated `.ydl` lists and `.yap` child lists can now use these proven field shapes:

| Intent | FieldName example | FieldType | Type | Sample value |
| --- | --- | --- | --- | --- |
| text | `Text13` | `Text` | `input` | string |
| number | `Decimal1` | `Decimal` | `input_number` | numeric value |
| single select storage | `Text15` | `Text` | `radio` | selected option text |
| boolean switch | `Bit1` | `Bit` | `switch` | `"1"` or `"0"` |
| percent | `Decimal2` | `Decimal` | `percent` | numeric value displayed as percent |
| rating | `Decimal4` | `Decimal` | `rate` | numeric value such as `3.5` |
| time | `Datetime1` | `Datetime` | `time` | time string/display such as `10:30:00` |
| hyperlink | `Text1` | `Text` | `hyperlink` | URL string rendered as an open link |

Custom list forms should use matching bound controls for these fields:

- number fields: `input_number`
- choice/dropdown storage: `radio` or dropdown-compatible radio attrs when supported by the form pattern
- switch fields: `switch`
- percent fields: `percent`
- rating fields: `rate`
- time fields: `time`
- URL fields: `hyperlink`

When an approval form writes to a generated data list, require compatible mappings:

- text variables -> `Text/input`
- number variables -> `Decimal/input_number`
- radio/dropdown text variables -> `Text/radio`
- boolean switch variables -> `Bit/switch`
- percent variables -> `Decimal/percent`
- rating variables -> `Decimal/rate`
- time/date variables -> `Datetime/time`
- URL text variables -> `Text/hyperlink`

## Approval Form Storage Integration

When a generated data list will store records created by a generated approval form:

1. Generate and validate the data list first.
2. Build the `.ydl` only after final validation passes.
3. The user imports the `.ydl` and exports the imported list back.
4. Extract exported-back `AppID`, `ListSetID`, `ListID`, `FieldName`, `InternalName`, and `FieldID` values.
5. Hand that metadata to the approval-form generator.
6. Patch the approval form `ContentList` target and mappings from exported-back metadata.
7. Build the final `.ywf` only after approval-form structural and app-context validations pass.

Do not let the approval form target pre-import generated list IDs for production-like testing.

For app-level generated runtime packages, local generated list IDs can be used inside the same `.yap` and should be included in the package replacement set. For production-like standalone approval/list integration, patch `ContentList` from exported-back list metadata. The Form Actions Phase 1 runtime test proved front-end form actions but did not yet prove ContentList persistence in that package; keep persistence claims tied to actual target-list row evidence.

## Staged Integration Checklist

- data list final validation passed
- `.ydl` wrapper round-trip validation passed
- user imported data list
- user exported data list back
- exported-back metadata extracted
- external lookup sample IDs excluded from `Resource.ReplaceIds`
- approval form `ContentList` target patched to exported-back list metadata
- approval form validates against generated-list metadata
- approval `.ywf` wrapper round-trip validation passed

## Output Expectations

When generating, report:

- requirement decomposition
- native feature plan
- normalized spec
- dependency map
- decoded draft/final path
- validation results
- wrapper build result if created
- stop conditions and sandbox limitations

<!-- workflow-claim-task-learning:start -->
## Data-List Workflow Claim Task Guidance

Use `docs/studies/workflow-claim-task-action.md` before generating data-list workflow Claim Tasks. In the studied data-list workflow, Claim Task is `CandidateTask`, uses `properties.usertaskassignment[]`, references a task form through `properties.taskurl`, and supports `tasktype="approve"` and `tasktype="complete"`. The export proves mixed receiver sources: direct user, applicant line manager expression, and list-item Created By line manager expression.

Preserve list-item/Created By expression-button strings; do not convert them into static user IDs. Treat data-list Claim Task receiver expansion, claim ownership, task routing, and email delivery as unproven until a focused runtime baseline uses safe list records and safe receivers.
<!-- workflow-claim-task-learning:end -->

<!-- workflow-set-variable-learning:start -->
## Data-List Workflow Set Variable Guidance

Use `docs/studies/workflow-set-variable-action.md` before generating data-list workflow Set variable actions. In the studied data-list workflow, Set variable is `SetVariableTask` and targets workflow variables through `properties.variablesetting[]`; it does not target data-list fields.

Data-list field values can appear on the right side as expression-token values such as `exprType="list_field"`. Preserve those tokens when they are export-backed. If the business requirement is to add, update, or delete list records/fields, generate Set data list / `ContentList` instead of Set variable. Do not claim data-list field value resolution or workflow variable mutation without focused runtime proof.

Use `docs/studies/workflow-set-data-list-action.md` before generating data-list workflow Set data list actions. In the studied data-list workflows, Set data list is `ContentList`. `listtype="current"` targets the current list context; `listtype="select"` targets another selected data list and includes `appid`, `listsetid`, and `listid`. Add/edit mappings use `listdatas[]` entries with `Columns`, `Per`, and expression-token-array `Data`; filters use `wheres[]`. Data-list field values can appear as `exprType="list_field"` in `Data`, including sub-list/detail fields with `valueType="list"`. Use explicit filters for edit/remove and treat remove/delete as destructive. Document-library targets are product-documented but not export-proven in this sample.

Signal event is currently not data-list-workflow-proven. `Workflow Actions Runtime Baseline (6)_Signal event.yap` found `SignalEvent` only in an approval-form workflow and found no data-list or scheduled Signal event. Do not generate data-list Signal event branches unless a future export or focused runtime proof demonstrates that host.
<!-- workflow-set-variable-learning:end -->

<!-- app-creation-rules-learning:start -->
## App Creation Rule Guardrails

For generated data lists, allocate `FieldIndex` and `FieldName` together. The numeric suffix at the absolute end of `FieldName` must equal `FieldIndex`; for example `FieldIndex: 11` requires `Text11`, `Decimal11`, or the matching storage prefix with suffix `11`, never a reused lower suffix such as `Text6`.

Within one list, `DisplayName`, `FieldName`, and `InternalName` must each be unique. `InternalName` may contain only `[a-zA-Z0-9_]`, and all three field identifiers are limited to 255 characters. Unknown field `Type` values should warn, but identifier duplicates, invalid `InternalName`, and FieldIndex/FieldName suffix mismatches are generation-blocking errors. Do not import a generated `.ydl` or `.yap` until `validate-ydl-list.js`, `validate-yap-package.js`, or `scripts/inspect-app-creation-rules.mjs` passes these checks.

Runtime proof update: `docs/studies/yeeflow-app-creation-rules-runtime-proof.md` proves the fixed workflow field-rule package imported, opened `Purchase Requests Runtime Test`, opened the New Field panel, and saved a new single-line field without the previous duplicate-value error. Treat that as data-list-field-creation proof for synchronized generated field rules only; it is not workflow routing or data mutation proof.
<!-- app-creation-rules-learning:end -->

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the v0.5.12 app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; and generated non-system `FieldName` suffix matching `FieldIndex`. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.

Focused runtime proof in `docs/studies/data-list-field-creation-runtime-proof.md` confirms a generated package imported, opened `Field Creation Runtime Test`, displayed representative columns for `input`, `input_number`, `currency`, `percent`, `switch`, `checkbox`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `file-upload`, and `icon-upload`, opened `+ New column`, and saved `Runtime Extra Field` without the duplicate-value error. Keep the boundary narrow: this proves representative import/open/field-creation, not exhaustive data entry, lookup resolution, calculated results, uploads, picker selection, sub-list row behavior, metadata, Document Library, workflow, or Form Report.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom List Form Field Learning

Use `docs/studies/data-list-custom-form-fields.md`, `docs/studies/normalized/data-list-custom-forms/`, and `scripts/inspect-data-list-custom-forms.mjs` before generating or validating Data List custom list forms. `Data Lists (3).yap` export-proves three Type `1` target data lists with four custom list forms: `Layouts[]` entries with `Type = 1`, embedded JSON in `LayoutInResources[0].Resource`, `LayoutInResources[0].ID = RefId = LayoutID`, `LayoutView = null`, and display assignment through `ListModel.LayoutView.add/edit/view`.

Custom list form display settings are stored separately in `ListModel.LayoutView`: `add`, `edit`, and `view` select either a custom form `LayoutID` or `default`; `opentype.add/edit/view` controls opening mode; `modalsize.add/edit/view` controls size. Export-proven mappings are `opentype = "modal"` for Pop-up window, `opentype = "slide"` for Slide in, missing New/Edit open mode as Pop-up window, and missing View open mode as Slide in. Export-proven sizes are `0` Medium, `1` Small, `2` Large, `3` Full screen, with missing size meaning Default. Full page is visible in UI reference screenshots but not export-proven in the target lists.

When generating display settings, choose New/Edit/View independently. Default to conservative settings if the user does not specify: New Item in Pop-up window with Medium or Large, Edit Item in Pop-up window or Slide in with Medium/Large, and View Item in Slide in with Medium. Use Large or Full screen for long forms and avoid relying on size behavior for Full page. Validate display form references before packaging.

Custom list form resources use `children`, `attrs`, `title`, `filterVars`, `ver`, `tempVars`, `exts`, optional `actions`, optional `formAction`, and optional `filter`. List-bound controls usually live under a `container` -> `container` -> `flex_grid` shell. Controls bind to Data List fields with `binding = Defs[].FieldName`, `fieldID = Defs[].FieldID`, matching `type`, a label, field metadata, and field-specific `attrs` copied from field rules. Validate that bindings and field IDs resolve in the same list.

Variable-id uniqueness is scoped to each custom Data List form resource. `filterVars[]` and `tempVars[]` share one namespace and must be unique after system-prefix removal, lowercasing, and punctuation/space removal. Namespace template-cloned variables before merging, rewrite all consumers, and block `PAGE_SCOPE_VARIABLE_ID_DUPLICATE` before standalone `.ydl` or full-app `.yapk` handoff.

Sub-list fields use a parent `type = "list"` control with `attrs.list-variables[]` and `attrs.list-fields[]`. Nested controls are scoped to the sub-list with bindings such as `field_1`, `attrs.list_field = true`, `attrs.list_field_binding` pointing to the parent field, and `attrs.list_control_id` pointing to the parent list control. Do not validate nested sub-list control bindings as top-level `Defs[]` fields.

Data List custom form temp variables are form-scoped, not workflow variables. They live in `Resource.tempVars[]` with `idx` and `id`; form actions may reference them via `exprType = "variable"` aliases such as `__temp_var_*` / `var_*`. Validate action references, button `attrs.control_action`, `formAction` hooks, Set variable list-field targets, and temp variable references before package handoff. This export proves `setvar` action steps only; submit/save execution remains unproven for Data List custom forms.

Document Library custom-form applicability remains product/user-understanding-backed unless a Type `16` export proves the exact custom form shape. Runtime rendering, field save behavior, action execution, sub-list row entry, upload behavior, lookup resolution, and Document Library custom-form behavior are not runtime-proven by this learning pass.
<!-- data-list-custom-form-fields-learning:end -->

<!-- data-list-public-form-learning:start -->
## Data List Public Form Generation

Use `docs/studies/data-list-public-forms.md`, `docs/studies/normalized/data-list-public-forms/`, `docs/reference/public-form-page-layout-standard.template.json`, and `scripts/inspect-data-list-public-forms.mjs` before generating or validating Data List Public Forms. Public Forms are stored separately from Custom List Forms under `Data.Childs[].PublicForms[]`; each entry has a JSON-string `Resource` with `pagetype = 3`, `ver = 2`, `attrs`, `children`, and `tempVars`.

Public Forms are additive functionality, never an alternative Data List generation mode. Every generated Type `1` Data List must complete the same shared generation path whether or not it has Public Forms: schema and fields, default/business views, Data List Form Layouts v1.1 New/Edit/View forms, Data List Form Fields Grid v1.1, resolved `ListModel.LayoutView.add/edit/view`, workflows, navigation, permissions, package validation, and full generated-final preflight. Do not hand-build a Public Form-only list with `LayoutView: null` and only Type `0` views. `YAPK_PUBLIC_FORM_CANNOT_REPLACE_CUSTOM_FORMS`, `DATA_LIST_PUBLIC_FORM_CUSTOM_FORMS_REQUIRED`, and `DATA_LIST_FORM_LAYOUT_DISPLAY_SETTINGS_MISSING` are hard failures.

Public Forms must be generated from a golden reference page layout template. The default template is `public-form-page-layout-standard`, learned from `Customer Satisfaction.ydl` / `Public form page layout standard`. App Plans and standalone Data List artifact plans must declare the Public Form template selection and generated output must pass plan-vs-actual template conformance. Do not hand-build a simplified Public Form body or reuse a Custom List Form / Approval Form layout as a substitute.

When using `public-form-page-layout-standard`, preserve the locked root page contract: `Resource.pagetype = 3`, `Resource.ver = 2`, root Content area full width (`attrs.container.cw = "2"`), root Content padding `--sp--s0` on all sides, and the template background. Keep `public_form_title_wrapper`, `public_form_content_section`, and `pubic_form_bottom_section` custom widths synchronized; the default width is `1280px`. If a business case requires a different width, all three width anchors must change together.

Only approved editable regions may change: `public_form_title_section`, `public_form_title_header`, `public_form_title_text`, `public_form_description`, optional `public_form_title_cta_area` and CTA buttons, `public_form_content_section`, approved section containers (`1_columns_section`, `2_columns_section`, `3_columns_section`, `2_columns_60/40_section`), `content_card_wrapper` / `content_card_60_wrapper` / `content_card_40_wrapper`, `section_title_header`, `section_title_text`, `section_title_description`, `Operations`, `section_content_area`, `pubic_form_bottom_section`, `section_content_center_area`, and `pubic_form_submit_button`. If no CTA is required, omit `public_form_title_cta_area`. All business field controls must live inside an approved content card's `section_content_area`. `pubic_form_submit_button` is required by default and must stay inside `pubic_form_bottom_section > section_content_center_area`.

The full Public Form golden reference is an optional module library, not a generated-output checklist. After mapping the App Plan, prune every unused module: remove an unplanned CTA area; remove copied `1_columns_section` / `2_columns_section` / `3_columns_section` / `2_columns_60/40_section` instances with no mapped business content; replace retained section title/description placeholders with business-specific copy; and remove `Operations` when it has no real configured actions. If neither a business-specific `section_title_header` nor configured `Operations` remains, remove the whole `section_title_area`. Apply this same cleanup in standalone `.ydl` and full `.yap`/`.yapk` generation. Generated output must fail on `PUBLIC_FORM_TEMPLATE_UNUSED_CTA_AREA`, `PUBLIC_FORM_TEMPLATE_UNUSED_LAYOUT_SECTION`, `PUBLIC_FORM_TEMPLATE_SECTION_TITLE_HEADER_NOT_BUSINESS_MAPPED`, `PUBLIC_FORM_TEMPLATE_OPERATIONS_EMPTY_OR_PLACEHOLDER`, or `PUBLIC_FORM_TEMPLATE_EMPTY_SECTION_TITLE_AREA`.

Public Form field-entry regions may use the Public Form-specific field template `public_form_fields_1col_v1_1` and may reuse Data List Form field templates `data_list_form_fields_grid_v1_1` and `data_list_form_control_sublist_v1_1` when the mapped fields are public-form-compatible. This does not replace the Public Form page layout template: the field Grid/Sub List must be placed inside an approved Public Form content card's `section_content_area`. Use `public_form_fields_1col_v1_1` for survey/questionnaire Public Forms, forms with a small number of fields, and forms with long question prompts. Its root is `form_grid_fields_1col_wrapper`, a one-column `flex_grid`; preserve its root Grid attributes exactly. Each cell must be a `form_grid_field_container` containing a `form_grid_field_title` heading and a `form_grid_field_control` list-bound control. Every field control must hide the native Display title with `displayLabel: [null, false]` and set `attrs.common.margin` to `--sp--s0` on all sides. Preserve the selected field grid/sub-list structure, spacing, responsive columns, zero-margin discipline, and designer labels while remapping only field labels, bindings, field IDs, option rules, placeholders, column spans, dynamic display/custom validation/action settings, and business-specific `nv_label` / `nav_label`. If several fields share a Dynamic display rule, group them in a Container or nested Grid and put the rule on the group. Never use these templates to materialize login-dependent or public-form-disallowed fields into anonymous Public Forms.

Public Forms are anonymous/no-login collection forms, so use a restricted field/control set. Export-proven top-level public field types from `Data Lists (4).yap` are `input`, `textarea`, `richtext`, `input_number`, `percent`, `currency`, `switch`, `radio`, `checkbox`, `datepicker`, `time`, `file-upload`, `icon-upload`, `rate`, `hyperlink`, `signer`, and `list`. The native primary `Title` field appears as an export-proven special case; do not treat that as permission to add other default/system fields.

Do not generate default/system fields such as Id, Created By, Created Time, Modified By, or Modified Time into Public Forms. Public Forms also must not include anonymous-unsafe Data List field families: User (`identity-picker` / `user`), Department (`organization-picker` / `groupselect` / `department`), Metadata (`metadata`), Tag (`tag`), Multi Meta (`mutiple-metadata` / `multiple-metadata`), Location (`location-picker` / `location`), Cost center (`cost-center-picker` / `costcenter`), Lookup (`lookup`), calculated columns, or autonumber fields unless a future product/export/runtime proof expands the allowlist. If the source Data List contains these fields, omit them from the Public Form and document that they remain for authenticated custom forms/internal views only.

Use only Public Form controls that are export-proven or UI-reference-backed, and include a `submit-button` for anonymous collection forms. Public Forms must not include data-browsing or filter controls, including Collection/Data table/Data list controls, Pivot Table, Chart/Data Analytics, Summary/KPI, Data filter, Search filter, Select filter, Date/Number/User filters, or Dynamic record display controls such as Dynamic field, Dynamic user, Dynamic image, or Dynamic file.

For generated Public Form layout, use the export-proven grid shape from `Data Lists (4).yap`: `flex_grid` with `ver: 1`, structured `columns`/`rows`, `cgap`, and `cgapU`. Turn the grid caption off with `displayLabel: [null, false]` when the grid is only a layout wrapper. Put `submit-button` in a separate centered container and set inline width with `common.positioning.widthtype: [null, "2"]`.

Shared form layout rule: Grid/flex_grid controls used only to place other controls should turn off captions with `displayLabel: [null, false]`. Use grids for structured field layout, but use container/card blocks with row direction and spacing for route summaries, status/KPI blocks, and horizontal information panels.

Validate Public Form template conformance with the shared helper `scripts/lib/public-form-template-utils.cjs`, which is wired into both `validate-ydl-list.js` and `validate-yap-package.js`. Run `scripts/test-data-list-public-form-template-gates.mjs` when modifying Public Form generation, validators, or templates.

Focused runtime proof in `docs/studies/data-list-public-form-runtime-proof.md` confirms a generated Public Form package imported, opened the app/list, displayed the Public Form inside the data list, opened the designer, rendered representative allowed list-bound controls, and passed after the grid/display-caption and centered inline submit-button fix. Public share URLs and share codes must be redacted in docs/logs/normalized refs. This proof is for Type `1` Data Lists only; anonymous submit behavior, public URL access outside the authenticated designer unless separately confirmed, save behavior, uploads, sub-list entry, and Document Library public forms are not runtime-proven.
<!-- data-list-public-form-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Guardrails

YAP native Title runtime-safety note: the Service Desk form-workspace v8 validator records `YAP_NATIVE_TITLE_SCHEMA_CONFLICT` as a warning, not a hard failure. If a generated YAP preserves a runtime-safe native Title field with `FieldName = "Title"` and `InternalName = "Title"`, do not replace it with a generated `Text0` primary field just to satisfy stale digit-suffix tooling. Preserve runtime-safe native Title and track the schema update separately.

Service Desk form-workspace import lesson: when generating child data lists inside a YAP approval/form workspace, preserve the v8-compatible list shape. `ListDatas` must be a record-ID-keyed object, not `{ Datas: [...] }`; sample row keys must resolve to fields in `Defs[]`; field `Rules` should be stringified JSON, including stringified choice rules; native `Title` stays native; and Service Desk-style business fields start at `Text2` rather than drifting to `Text1` or synthetic `Lookup1`. Run `scripts/inspect-yap-form-workspace-generation.mjs` for this pattern because these data-list shape errors can make package imports fail asynchronously after the API has queued the import.

Data List and Document Library generation must follow `docs/studies/yap-schema-standard.md`: every root or child `ListExportItem` needs `Defs` and `Layouts` arrays. Empty arrays are valid; `null` is product-team-confirmed invalid and must block generation/import.

Continue applying app-creation field gates for unique `DisplayName`, `FieldName`, and `InternalName`, valid `InternalName`, supported field type guidance, and FieldIndex/FieldName suffix synchronization. Validate generated packages with `scripts/inspect-yap-schema-standard.mjs`, `scripts/inspect-app-creation-rules.mjs`, `scripts/inspect-data-list-fields.mjs`, and package validation before runtime import tests.
<!-- yap-schema-standard-learning:end -->
<!-- projects-center-import-failure-hardening:start -->
## Generated Data List Import-Readiness

For newly generated app-contained data lists, compatibility validation is not enough. Every Type `1` child data list must emit `ListModel.ListType = 1`; its native `Title` field must use `Status = 0`, `IsSystem = true`, `IsIndex = true`, and `FieldIndex = 0`; and all list/data-view columns must resolve to real fields or explicitly supported system fields for that view context.

Do not carry export-native view columns such as stale `ListDataID`, `CreatedBy`, `Created`, `ModifiedBy`, `Modified`, or copied field IDs into generated-final list views unless the current validator explicitly allows that context. Missing `ListType`, export-native unsafe Title metadata, and unresolved view columns are generated-final hard errors and must be fixed before a `.yap` is handed off.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Data List Quick-Create Actions

Dashboard Container/Button `Add list item` actions are export-proven in `docs/studies/container-button-action-settings.md`. Use them for quick-create experiences such as Add task, Create item, Add vendor, New invoice, and Upload document when the target is a Data List or Document Library.

Generated Add list item actions must reference a real target `ListID`, any chosen add/edit form `LayoutID` must resolve, `passvalues[].Name` must reference fields on the target list, and generated lists should remain add-ready. Prefer this structural action over a raw link when the target list/library is included in the package.
<!-- container-button-action-settings-learning:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Dynamic Content On Custom Forms

Use `docs/studies/data-list-print-page-dynamic-sub-list.md` and `docs/studies/sub-list-dynamic-content.md` for Data List custom form Dynamic Sub List generation and validation. `Sales Quotation.yap` export-proves a Type `1` Data List custom form named `Print Page` on the `Quotation` list with a read-only/display-oriented Sub List field using `attrs["list-display-preference"] = "dynamic"`, a `list-body` item template, field controls scoped with `attrs.list_field = true`, and `attrs.list_field_binding` pointing to the parent Sub List field.

For Data List print pages, use a dedicated Type `1` custom form as the print target. The `View Quotation` form export-proves a form action step `type = "print"` with `attrs.printtype = "select"`, `attrs.layout` resolving to the Print Page layout, and `attrs.listdataid[]` passing the current record through a `ListDataID` list-field expression. Validate that print targets resolve and that generated Print Page Dynamic Sub Lists bind to a real Sub List field whose row schema comes from `Rules["list-variables"]`.

Read-only print forms should avoid Add/Import/Edit row actions unless intentionally requested. Dynamic item template field controls must bind to row fields and keep `attrs.list_field_binding` aligned with the parent Sub List binding. Runtime print preview/execution remains unproven until a focused runtime test, and Dashboard/Approval Form Print page action availability is product/schema-understanding-backed unless separately export-proven.
<!-- sub-list-dynamic-content-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Dynamic Controls On Data List Custom Forms

Use `docs/studies/kanban-collection-dynamic-controls.md` when a Data List custom form needs read-only/current-record display via Dynamic controls. `Company Overview.yap` export-proves three `dynamic-field` controls on the `Company Overview` Data List custom form `View page`. These controls use `attrs.source = "4"` to read the current list item and `attrs["obj-f"]` to identify the current list field.

For generated Data List custom forms, validate that Dynamic controls with source `4` bind to fields on the host list. Prefer Dynamic user for identity fields, Dynamic image for image fields, Dynamic file for attachment/file fields, and Dynamic field for general values. This export does not prove Dynamic user/image/file on Data List custom forms; it proves those specialized controls inside Dashboard Kanban/Collection templates only.
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

## Multi-Column Form Workspace Pattern

Use `docs/standards/multi-column-form-workspace-standard.md` and template `multi_column_form_workspace_shell` when a service desk, help desk, CRM workbench, support console, review queue, renewal review, case-management console, or operational inbox needs form actions, variables, selected-record state, comments/updates, dynamic form fields, or action-driven filtering. This is an approval/form workspace pattern, not a dashboard reporting pattern.

During planning, choose a dashboard when the page is primarily reporting or monitoring. Choose the form workspace when the app needs navigation containers that set filter variables, ticket/list collection items that set selected/current record state, detail panels bound to that selected state, comment/update controls, or expand/collapse icon actions. Do not add fake workflow routing just to use the form surface; if the workflow is only Start to End, document that the form is being used as a no-submit workspace shell.

When generating this pattern, build a row shell with left navigation, ticket/list collection, selected-record workspace, and right attributes/detail regions. Navigation rows should be icon plus text containers with click/form actions. Filter controls and menu actions should set variables consumed by collection filters or queries. Collection item actions should set selected/current record state. Details panels should use dynamic field/user/file controls bound to the selected record. Comment/update actions must target the selected record and related activity list only when the binding is validated. Avoid placeholder-only panels, fake Submit Request buttons, and claims of selected-record behavior when the actions and bindings are not implemented.

Before signing, install, upgrade, or handoff, run template conformance when a checklist declares `multi_column_form_workspace_shell`, `four_column_service_desk_workspace`, `service_desk_inbox_workspace`, or `action_driven_ticket_workspace`. Treat `FORM_WORKSPACE_*` findings as generated-final blockers for pages that claim this pattern, including behavior errors (`FORM_WORKSPACE_NAV_ACTION_MISSING`, `FORM_WORKSPACE_FILTER_VARIABLE_MISSING`, `FORM_WORKSPACE_COLLECTION_FILTER_MISSING`, `FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING`, `FORM_WORKSPACE_DETAIL_BINDING_MISSING`, `FORM_WORKSPACE_ICON_ACTION_MISSING`, `FORM_WORKSPACE_FAKE_SUBMIT_BUTTON`) and runtime layout-property errors (`FORM_WORKSPACE_SHELL_LAYOUT_PROPERTIES_MISSING`, `FORM_WORKSPACE_COLUMN_WIDTH_MISSING`, `FORM_WORKSPACE_COLUMN_HEIGHT_MISSING`, `FORM_WORKSPACE_COLUMN_OVERFLOW_MISSING`, `FORM_WORKSPACE_DIRECTION_INVALID`, `FORM_WORKSPACE_ELEMENT_GAP_MISSING`, `FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE`, `FORM_WORKSPACE_VERTICAL_TEXT_RISK`, `FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY`). Use `docs/studies/normalized/service-desk-pro-form-workspace/reference-property-map.normalized.json` before generating this pattern; default-container-only or semantic-only four-column layouts must fail before package handoff. API install success is not runtime interaction proof; manually verify that columns render side by side, navigation filters, selected ticket refresh, detail bindings, comments, and collapse/expand actions work.

Query Data pagination is shared with Approval and Dashboard hosts: omitted Page Size means 100, explicit Page Size is 1..1000, omitted Page Number means 1, and non-default Page Number uses `querydata_pageindex`. v1.4 proves native Type 16 Document Library custom forms use the same Form Action Query Data wrapper and target rules as Data List custom forms. Form Report and Data Report cannot host independent Form Actions.

Data List and Document Library New/Edit/View custom forms share the export-proven Form Action Set Data List contract. A View Item form may use current-record `edit` to mutate the displayed record because it has no Submit Form path. On New/Edit forms, prefer Set Variable plus Submit Form for pending field values; direct current-record mutation needs an explicit immediate-side-effect rationale. Selected-resource add/edit/remove may target a Data List or Document Library, and selected edit/remove requires filters. Document Library Add requires native Upload File `Text4`, allows `_Path`, and accepts one file per step. Form Action steps cannot Loop or expand Sub List/multi-file sources; use Workflow Set Data List for bulk expansion. Follow `docs/standards/form-action-set-data-list-golden-reference-standard.md` and run both dedicated validators before signing.

Data List and Document Library custom forms also share the V1.7 Open Resource contract. They are the only hosts that may select Current item for `listitem`; omission of `data.list`, `source_type`, and `listdataid` means Current item. Selected item mode resolves the target resource, requires an ID for Edit/View, and may choose only a target-owned Type 1 custom layout. `openform` and `opendashboard` use the same shared builder as Approval and Dashboard hosts. Public Forms remain forbidden.
