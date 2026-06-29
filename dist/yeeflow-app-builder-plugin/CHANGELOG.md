# Changelog

## Unreleased

## 0.8.89

- Release application color pattern theme config from PR #317.
- Add App Plan `Application Color Pattern Selection` for Primary, Secondary, and Neutral base colors.
- Materialize selected base colors into the Type 0 `application style.Config` while preserving the Soft outline controls default binding and fresh Type 1 style UUID remapping.
- Validate stringified color config shape, `Luminance` lightmodel, base-color readability ranges, low-chroma Neutral, and App Plan-to-package color matching before signing readiness.

## 0.8.88

- Release `section_content_area` gap s200 golden-reference enforcement from PR #315.
- Update committed Dashboard Page Layouts, Workbench Dashboard, Data List Form Layouts, Data List Form Workbench, and Approval Form Layouts golden-reference templates so real `section_content_area` controls preserve `attrs.style.gap = [null, "--sp--s200"]`.
- Reject generated or registry resources that regress `section_content_area` controls to the obsolete `--sp--s0` gap before signing readiness.
- Add focused Dashboard, Data List Form, and Approval Form layout regression coverage, standards guidance, training report, and source/dist mirrors for the new spacing contract.

## 0.8.87

- Release the Application Layout Sidebar Workspace golden reference from PR #313.
- Register `application-layout-sidebar-workspace-1` as the default application layout template for generated applications.
- Preserve the export-derived application header height, title typography, header colors, vertical navigation layout, navigation colors, and appearance settings instead of inventing application chrome.
- Require App Plans to declare the selected application layout template and reject unknown application layout IDs before generation.
- Require every generated navigation menu group and menu item to carry a business-appropriate FontAwesome icon before signing readiness.
- Add source/dist registry, standard, materializer, validator, and focused regression coverage for application layout template usage.

## 0.8.86

- Release Approval form page-title empty section cleanup from PR #311.
- Generated Approval submission/task pages and Data List/Schedule workflow task forms now remove empty `section_content_area` slots outside real business content, including `page_title_section` empty slots.
- Approval form layout validation now applies `APPROVAL_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA` to any generated empty section content slot while preserving locked workflow panel/history surfaces.
- Add source/dist regression coverage and training guidance for the cleanup contract.

## 0.8.85

- Release application control style fresh ID remap from PR #309.
- Clone the Soft outline Type 1 control style theme with a fresh package-local UUID for each fresh generated `.yapk` package instead of reusing the exported template UUID.
- Keep the Type 0 `application style` theme shape and update `Ext.controlDefaultId` to point at the fresh Type 1 control style ID.
- Reject fresh packages that reuse the exported Soft outline control style UUID or emit non-UUID control style IDs before signing readiness.
- Document that only package-local theme identity and style ID fields are remapped; style tokens, colors, layout settings, and ordinary configuration values remain unchanged.
- Add focused regression coverage for fresh style ID remap and per-package materializer uniqueness.

## 0.8.84

- Release workflow layout golden reference gates from PR #307.
- Register export-derived workflow layout references from eMemo and expense reimbursement workflow examples for generated Approval form, Data list workflow, and Scheduled workflow diagrams.
- Add generated-final validation for readable workflow node spacing, graph bounds, rounded line style, routed cross-lane/rejected/long flows, and node-overlap prevention.
- Teach the full-app materializer to emit lane-based Approval workflow positions and routed sequence-flow vertices instead of overlapping workflow nodes.
- Wire workflow layout validation into first-generation preflight and cache artifact expectations before signing readiness.

## 0.8.83

- Release Soft outline application control style default gates from PR #305.
- Register `application_control_style_soft_outline_controls` as the export-backed Application Custom Control Style golden reference for generated applications.
- Emit the Soft outline Type 1 control style theme and Type 0 `application style` default binding in generated full-app `Themes[]` output.
- Add generated-final preflight validation for default control style linkage, stringified config fidelity, and schema-safe package shape before signing readiness.
- Add focused regression coverage for exported reference validation, missing/default-link drift failures, config drift, and materializer output.

## 0.8.82

- Release Dashboard filter variable consumer materialization from PR #303.
- Wire cloned Dashboard `search-filter` variables to Collection `attrs.data.fulltext[]` consumers so keyword filter variables are backed by runtime-visible data controls.
- Treat filter producer controls as producers only; they no longer count as real consumption for `filterVars[]` runtime-binding validation.
- Prune stale generated producer bindings and unconsumed `filterVars[]` entries instead of carrying declared-but-unused Dashboard filter variables into generated-final packages.
- Add full-app materializer regression coverage that blocks generated Dashboards when `filterVars[]` entries or `search-filter` bindings are not backed by Summary, Collection, Data table, chart, or pivot consumers.

## 0.8.81

- Release generated-final preflight contract gap alignment from PR #301.
- Credit every Dashboard filter variable consumed by Collection/Data table filter and fulltext metadata instead of marking secondary consumers as unconsumed.
- Decode encoded Approval `DefResource.pageurls[]` when checking request/task page URL and workflow panel/history runtime surfaces.
- Use package-proven custom Data List form assignments to avoid stale App Plan wording false positives while keeping plan-only validation strict.
- Enforce primitive string `search-filter.attrs.placeholder` in full-app materializer regression coverage so object-shaped placeholders cannot render as `[object Object]`.

## 0.8.80

- Release search-filter placeholder runtime shape hardening from PR #299.
- Keep generated Dashboard `search-filter.attrs.placeholder` as primitive input text instead of object-shaped values.
- Reject object-shaped `search-filter` placeholders before signing readiness because they render as `[object Object]` at runtime.
- Document the runtime boundary between search-filter placeholder text and separate placeholder style metadata.

## 0.8.79

- Release generated-final preflight App Plan/runtime alignment from PR #297.
- Treat canonical Dashboard Collection exact-ID App Plan tables as authoritative over earlier prose support tables.
- Infer approved Collection template IDs for legacy prose where unambiguous and prune unused copied Dashboard filter variables during materialization.
- Treat `ListDataID` as a Yeeflow system field for Summary count validation while preserving Summary `ReportIds`, `exts`, and `tempVars` requirements.
- Keep Data List Form layout planning strict for custom New/Edit and View/Workbench Full page rows before signing readiness.

## 0.8.78

- Release Approval ContentList target and application-selection gates from PR #295.
- Parse App Plan workflow `Data Read/Write` values for generated Approval `ContentList` action nodes and resolve targets to concrete child Data Lists in the current application.
- Emit Designer-safe `ContentList` target metadata with `listtype: "select"`, `appid: 41`, current app `listsetid`, and the target child Data List `listid` so Set Data List nodes do not show `Uncategorized` or point at the root ListSet.
- Fail generated-final publish readiness when `ContentList` targets the root application ListSet, an unknown list, `listtype: "current"`, a wrong `appid`, or a wrong `listsetid`.
- Keep public YAPK validator entrypoints byte-aligned with the canonical validator to prevent duplicate-rule drift.

## 0.8.77

- Release full-app materializer template E2E gap closure from PR #293.
- Fail closed when non-fixture full-app materialization lacks tenant identity instead of emitting generated-final packages with `TenantID: "0"`.
- Ignore generic Dashboard planning support headings and coverage/decision tables when deriving real Dashboard page requirements.
- Preserve App Plan-selected Dashboard Collection, Data Analytics, and Data Table template mapping without rotating scoped records across unrelated pages.
- Keep Dashboard Summary runtime registration aligned across `save_var` and `saveVar` surfaces and classify Summary controls by type rather than business labels.
- Preserve approval business fields such as `Purpose`, normalize service-action workflow nodes, and reduce Data List form/App Plan validator false positives before signing readiness.

## 0.8.76

- Release Approval workflow node parity gates from PR #291.
- Parse App Plan `Approval Workflow Nodes` during generated-final materialization and preserve the planned workflow node graph instead of collapsing nontrivial approval processes to a single baseline `Line manager approval` task.
- Materialize planned review/approval nodes as named `MultiAssignmentTask` workflow tasks and planned action nodes as named `ContentList` workflow actions.
- Extend Approval workflow publish-readiness validation to accept the App Plan and fail generated-final packages when planned workflow nodes are missing, mismatched, or have the wrong workflow node type.
- Pass App Plan context through first-generation preflight so workflow-node parity is enforced before signing readiness.

## 0.8.75

- Release full-app materializer template coverage hardening from PR #289.
- Materialize all App Plan-selected Dashboard Collection records for a page instead of collapsing to one selected dataset/template.
- Add App Plan Data Table template extraction and generated-final Data Table template materialization for `data_table_control_standard_scroll`, `data_table_control_standard_no_scroll`, and `data_table_control_caption_scroll`.
- Align generated custom form layout ID allocation and provenance paths with actual decoded layout positions, including Workbench View Item form selections.
- Add default navigation group ID provenance when an App Plan omits explicit navigation groups.
- Allow approved Data Table controls to satisfy Dashboard business-content hard gates and prune unplanned Data List form operation containers.

## 0.8.74

- Release Data List Form Workbench App Plan registry-drift alignment from PR #287.
- Derive App Plan resource-order Data List Form Layout template allowlists from `docs/reference/data-list-form-layout-templates.json` instead of a stale private hard-coded list.
- Allow registered View-capable Data List Form Layout templates, including `data_list_form_layout_workbench`, for View Item custom form rows while keeping New/Edit rows constrained by registry usage metadata.
- Add focused regression coverage so `data_list_form_layout_workbench` cannot regress to `APP_PLAN_DATA_LIST_FORM_LAYOUT_TEMPLATE_UNKNOWN` or `APP_PLAN_DATA_LIST_FORM_LAYOUT_VIEW_TEMPLATE_MISMATCH`.
- Preserve source/dist mirror parity and cache artifact coverage for the new training report.

## 0.8.73

- Release New Vendor Approval field and tenant readiness gates from PR #285.
- Remove the full-app materializer's internal Approval form field cap so long App Plan `Submission Form Fields` and `Task Form Fields` tables are fully materialized into `DefResource.pageurls[].formdef`.
- Add regression coverage for longer Approval form field tables, including tax, bank, risk, and attachment fields that previously could be truncated.
- Resolve generated-final wrapper `TenantID` from explicit, profile-scoped, or global Yeeflow tenant metadata when available while keeping placeholder `TenantID: "0"` blocked before signing readiness.
- Update Approval form and live-install readiness standards plus generator skills with the no-truncation and tenant-readiness contracts.

## 0.8.72

- Release Collection runtime visibility and Approval task readonly gates from PR #283.
- Require generated Dashboard Collections to include resolved Primary order/sort metadata so initial runtime data visibility is deterministic.
- Require Collection fulltext and Dynamic control field-binding surfaces to resolve against the selected source list schema, including `dynamic-user` controls for user/identity fields.
- Update full-app materialization to write `attrs.source`, `attrs["obj-f"]`, `attrs.data.field`, `attrs.user.field`, and top-level field surfaces consistently for generated Dynamic field and Dynamic user controls.
- Require Approval task forms to mirror Submission form business fields as runtime-effective readonly review context unless an App Plan explicitly excludes or makes fields editable, using both top-level and attrs readonly/readOnly flags.

## 0.8.71

- Release Data table control golden reference templates from PR #281.
- Register `data_table_control_standard_scroll`, `data_table_control_standard_no_scroll`, and `data_table_control_caption_scroll` as the approved Data table presentation templates.
- Preserve the exported Data table style, layout, typography, column-width mode, caption/search/add/more toolbar contracts, and display-column binding requirements as locked template contracts.
- Require App Plans to select approved Data table templates for planned Data table regions and generated packages to materialize the selected templates.
- Enforce Data table usage across Dashboard pages, custom Data List forms, Approval submission/task forms, Data list workflow task forms, Schedule workflow task forms, and Approval print pages before signing readiness.

## 0.8.70

- Release the Data List Form Workbench View Item layout template from PR #279.
- Register `data_list_form_layout_workbench` as a full-page Data List View Item custom form template alongside the existing New/Edit and standard View Item layouts.
- Preserve the full parsed `Workbench item details` form resource as an independent JSON template and cache artifact.
- Require App Plans to declare Full page opening when selecting the Workbench View template, and require generated packages to route `ListModel.LayoutView.view` to a same-list Type 1 custom form with `opentype.view = "new"`.
- Enforce Workbench-specific rules for `primary_working_area`, optional/removable `right_side_panel`, removable `chart_cards_section`, and Data Analytics placement inside Workbench `chart_cards_section`.

## 0.8.69

- Release the Workbench Dashboard page layout template from PR #277.
- Register `dashboard-page-layouts-workbench` alongside `dashboard-page-layouts-v1.1` and preserve the full parsed Workbench Dashboard page resource as an independent JSON template.
- Require App Plans to select the Dashboard page layout template per Dashboard so generation can choose between the general v1.1 shell and the Workbench shell by business fit.
- Enforce Workbench-specific layout rules for `primary_working_area`, optional/removable `right_side_panel`, repeatable/removable section modules, and `chart_cards_section`.
- Allow Data Analytics golden reference templates in Workbench only inside `chart_cards_section`, cap each chart section at three analytics templates, and reject empty chart sections before handoff.

## 0.8.68

- Release Dashboard Collection and Pie/Data Analytics golden rebuild gates from PR #275.
- Preserve the real `grid_table_col_body` Collection root when rebuilding `collection_control_grid_table_with_multiselect` regions from the approved template.
- Re-instantiate cloned Dashboard template UUID-like values per page so copied template internals do not collide across generated Dashboard resources.
- Require Pie/Data Analytics controls to clone the full approved wrapper instead of simplified chart shells and keep template provenance on the visible analytics control.
- Require chart runtime `attrs.data`, `attrs.model`, `attrs.series[]`, and `attrs.values[]` to match the host `Resource.ReportIds[]` and `Resource.exts[]` runtime model.
- Block derived pseudo-field IDs such as `ListDataID_COUNT`; COUNT analytics must use real source fields with aggregate metadata.

## 0.8.67

- Release Approval workflow condition and upgrade proof gates from PR #273.
- Generate Approval workflow outcome transitions with Designer-readable `left/op/right` Completion condition metadata instead of legacy simplified `label/value` entries.
- Bind line-manager approval tasks through the generated `ApplicantUserID` workflow variable and `LineManager` assignee expression.
- Require Approved paths to route to `EndNoneEvent` and Rejected paths to route to `EndRejectEvent` with non-overlapping workflow graph positions.
- Require Approval workflow upgrade validation to include live Designer/DefBlob proof after Version Management `Succeed`, including task name, task ID, assignee expression hash, Approved/Rejected condition hashes, designer-open proof, and publish proof.

## 0.8.66

- Release collection action layout and approval field fidelity gates from PR #271.
- Rewrite or remove unresolved Dashboard Collection action layout placeholders such as `{{layout}}` before signing readiness.
- Require Approval form field materialization to preserve App Plan planned visible labels, so technical-only bindings such as `LoanNumber` cannot mask label drift from `Loan Number`.
- Include source approval layout templates in cache artifacts and clean-checkout regression coverage so materializer and cache gates no longer depend on local ignored JSON files.
- Keep source/dist template mirrors aligned without changing signing, install, API, or runtime-proof behavior.

## 0.8.65

- Release repository root hygiene and compatibility gates from PR #269.
- Move historical root generator helpers under `tools/generators/`, runtime proof studies under `docs/studies/root-runtime-proofs/`, and runtime test specifications under `fixtures/runtime-test-specs/`.
- Keep public root CLI/validator/wrapper entrypoints stable while reducing root-level proof and generator clutter.
- Add `scripts/test-repo-root-hygiene.mjs` plus cache artifact coverage so source and dist plugin roots cannot regress back to root-level proof/generator files.
- Update source/dist references and mirror paths without changing generation, validation, signing, install, or API behavior.

## 0.8.64

- Release layout cleanup, live install readiness, and validator-entrypoint alignment gates from PR #267.
- Remove unused copied Dashboard, Data List form, and Approval form sections when their `section_content_area` or repeatable wrapper modules have no real business content.
- Keep Approval task forms aligned with Submission form business fields as readonly review context unless the App Plan explicitly excludes or makes fields editable.
- Block generated-final signing readiness when wrapper `TenantID` is missing, invalid, or placeholder `"0"`.
- Scope runtime `Install failed` tile attribution to the target app when workspace/home evidence contains unrelated historical failed apps.
- Add public `validate-yapk-package.js` entrypoint byte-parity regression coverage so root, dist, script, and skill validators cannot drift.

## 0.8.63

- Release Data List custom form LayoutView runtime-source gates from PR #265.
- Write complete rendered Type 1 custom Data List form JSON to both `Layouts[].LayoutView` and `Layouts[].LayoutInResources[0].Resource`.
- Block missing, blank, malformed, placeholder, or drifting custom form `LayoutView` surfaces before signing readiness.
- Extend full-app materializer regression coverage so generated New/Edit/View custom forms load from the same runtime and export form JSON.
- Add runtime-source standard/training docs, cache artifact expectations, and generator/package-validator skill guidance.

## 0.8.62

- Release Approval workflow publish-readiness gates from PR #263.
- Generate Approval workflow `DefResource` with Designer-publish-ready `flowPage`, structured `variables.basic/listref/filter`, and registered submission/task page URLs.
- Require Start and Assignment Task `taskurl` aliases to resolve to the correct submission/task pages.
- Require `MultiAssignmentTask` assignee array, approve metadata, rejected-path routing to `EndRejectEvent`, valid graph refs, and non-overlapping workflow node positions.
- Add generated-final preflight coverage, focused regression tests, source/dist cache artifact expectations, and generator/package-validator skill guidance.

## 0.8.61

- Release Approval form unused section cleanup gates from PR #261.
- Remove generated Approval form Operations containers unless they contain configured Yeeflow actions.
- Remove empty copied Approval form business sections while preserving the locked `action_panel_flow_history_wrapper`.
- Keep fieldless generated Approval forms valid with a no-fields business content card instead of empty template sections.
- Align approval layout registry rules, validator hard gates, full-app materializer cleanup, and focused/full-app regression tests.

## 0.8.60

- Release Data Analytics v1.1 section placement slots from PR #259.
- Allow all six approved Data Analytics golden reference templates on Dashboard Page Layouts v1.1 and Data List Form View Item Layouts v1.1 inside `content_card_wrapper`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`.
- Keep Data Analytics templates forbidden on Approval forms and Data List New/Edit forms.
- Align the Data Analytics validator, full-app materializer slot lookup, registry, standards, and focused regression tests with the expanded placement contract.

## 0.8.59

- Release Approval form field materialization hard gates from PR #257.
- Parse App Plan `Submission Form Fields` and `Task Form Fields` as generation inputs for Approval forms.
- Materialize planned business fields into `Forms[].DefResource.pageurls[].formdef` using approved Approval Form Field Layouts v1.1 wrappers.
- Block shell-only Approval forms where the layout, titles, and workflow skeleton exist but planned submission/task field controls are missing.
- Scrub unrelated source-template business labels from generated Approval form content and extend package-plus-plan validation for planned field completeness.

## 0.8.58

- Release Data List custom form default-layout hard gates from PR #254.
- Require every generated business Data List and Document Library to plan and assign custom New/Edit/View custom forms instead of Yeeflow default layouts.
- Block missing, `default`, unresolved, cross-list, or Type 0 form routing before signing readiness.
- Require App Plan Section 10 to cover every Section 4 business list/library with `data_list_form_layout_new_edit_v1_1` and `data_list_form_layout_view_item_v1_1` selections unless an explicit system/support-list exemption is declared.
- Align full-app materialization, generated data-list schema validation, and default YAPK package validation with export-resolved same-list Type 1 custom form routing.

## 0.8.57

- Release Dashboard Collection search-template retirement and analytics identity hardening from PR #252.
- Remove `collection_control_grid_table_with_search` from the approved Dashboard Collection golden reference set; generated App Plans must choose one of the remaining approved Collection templates.
- Treat search/fulltext as behavior inside an approved Collection template instead of a standalone template ID.
- Recursively rewrite copied Collection source IDs and placeholders inside generated Dashboard Collection action/data payloads before signing readiness.
- Ensure generated Data Analytics controls, including Pivot table controls, use UUID-shaped runtime IDs and keep `ReportIds[]` / `exts[].i` aligned.
- Narrow Data Analytics source-field identity scanning so display labels such as `series[].name` are not treated as source field references.

## 0.8.56

- Release Approval Form Fields Grid v1.1 golden references from PR #250.
- Register `approval_form_fields_grid_2col_v1_1` and `approval_form_fields_grid_3col_v1_1` as approved Approval form field layout templates.
- Require App Plans to select an approved Approval form field-grid template for each generated submission/task form field group.
- Add generated-final and first-generation preflight validation for approved wrapper placement, responsive column limits, zero field margins, full-row span controls, business-specific field `nav_label`, and package-level Approval form field layout conformance.
- Update Approval form, full-app generation, app builder, and package-validator guidance so generated Approval form fields clone the approved field-grid templates inside `content_card_wrapper > section_content_area`.

## 0.8.55

- Release Data Analytics runtime binding hard gates from PR #248.
- Require generated Pie, Column, Bar, Line, Area, and Pivot templates to include matching `Resource.ReportIds[]` and `Resource.exts[]` runtime registrations.
- Enforce chart/pivot runtime entries with `category: "___Pivot___"`, expected `key`, `i` equal to the visible control ID, source `AppID/ListID/ListSetID`, chart type when applicable, and source-field-backed `settings.rows[]` / `settings.values[]`.
- Update full-app materialization so generated Dashboard Data Analytics templates emit runtime contracts instead of provenance-only visual wrappers.
- Add focused regression coverage for missing runtime `exts[]`, missing `ReportIds[]`, and unresolved analytics source fields before signing readiness.

## 0.8.54

- Release Dashboard filter runtime and full-upgrade proof gates from PR #246.
- Block unproven page-level select-filter variables consumed by Collection `In` (`op/operator = 9`) conditions because empty select-filter state can clear all Collection rows at runtime.
- Prefer proven search-filter/fulltext Collection display until an export-proven select-filter empty-value bypass contract exists.
- Add generated-final preflight validation for Dashboard select-filter runtime safety.
- Require dashboard-only upgrades for existing complete apps to be full upgrade packages with non-Dashboard resources preserved and unchanged-diff proof.
- Add runtime proof inspection for business rows, absence of `No data` and `[object Object]`, real Data List Collection bindings, search-filter behavior, Version Management `Succeed`, and error-log capture when upgrade processing fails.

## 0.8.53

- Release standard Data Filter group golden reference gates from PR #244.
- Register `dashboard_standard_filter_group` as the approved wrapper for pages/forms that contain two or more page-level Data Filter controls.
- Require Dashboard pages, custom Data List forms, Approval submission/task forms, Data list workflow task forms, and Schedule workflow task forms to place multiple page-level filters inside the approved group while excluding local Collection toolbar search controls.
- Add generated-final and first-generation preflight validation for group provenance, row layout, gap/alignment, label typography, label layout, placeholder styling, radius, fixed-width positioning, and loose sibling filter rejection.
- Update App Plan, Dashboard, Data List Form, Approval Form, full-app materialization, builder, generator, and package-validator guidance so future generation selects and preserves the standard filter group.

## 0.8.52

- Release Approval Form Layouts v1.1 golden references from PR #241.
- Register export-shaped submission and task form page templates parsed from the Approval form page layout export.
- Require App Plans to select `approval_form_layout_submission_v1_1` for submission pages and `approval_form_layout_task_v1_1` for task pages.
- Add generated-final and first-generation preflight validation for template provenance, locked `action_panel_flow_history_wrapper`, hidden-title CSS, content width, allowed business slots, and Approval-form Data Analytics exclusion.
- Make the standalone full-app materializer clone the selected Approval form layout templates instead of emitting minimal hand-written form definitions.

## 0.8.51

- Release live E2E install readiness gates from PR #239.
- Require generated-final wrapper/root identity alignment before signing: `wrapper.ListID` must equal decoded `ListSet.ListID`, and every Dashboard page must target that decoded root.
- Re-instantiate UUID-shaped Dashboard template control IDs per generated page while preserving action/control references.
- Validate IDs embedded inside Dashboard JSON resources and encoded approval `DefResource` payloads against API-issued ID provenance.
- Treat install/import API `apiStatus: 0` as submitted-only and require exact Version Management `PackageId` row status `Succeed` for final install success claims.

## 0.8.50

- Release signing-readiness preflight handoff reporting from PR #237.
- Keep standalone materializer output explicitly signing-ineligible before generated-final preflight.
- Add `materializerSigningEligible`, `preflightEligibleForSigning`, `signingReadinessSource`, and `signingReadiness` fields to separate materializer artifact generation from pre-sign local readiness.
- Make `yapk-first-generation-preflight` report `preflightEligibleForSigning: true` only when all local generated-final gates pass.

## 0.8.49

- Release Dashboard select-filter option-source placeholder hard gates from PR #235.
- Stop generated Dashboard select filters from emitting literal `{{ListDataID}}` current-item placeholders in `attrs.data.filter[].value`.
- Emit `filter: []` for select-filter option sources when no validated runtime option-source filter is required.
- Add a specific generated-final validator code, `DASH_SELECT_FILTER_OPTION_SOURCE_PLACEHOLDER_UNRESOLVED`, plus focused regression coverage and training guidance.

## 0.8.48

- Release Dashboard Collection action placeholder hard gates from PR #233.
- Rewrite generated Dashboard Collection template action references so source-template placeholders such as `{{ListSetID}}`, `{{ListID}}`, `{{DetailLayoutID}}`, `{{sourceLongId}}`, and `{{search}}` cannot reach generated-final resources.
- Prune copied detail/open action buttons when a generated Collection has no concrete detail layout, instead of leaving unsupported template actions behind.
- Emit expression-token filter/fulltext conditions for generated Dashboard Collection filters instead of literal placeholder strings.
- Add dataset golden-reference validation and focused regression coverage for unresolved `{{...}}` placeholders anywhere inside decoded Dashboard resources.

## 0.8.47

- Release full-app Data Analytics materialization runtime gates from PR #231.
- Parse App Plan Data Analytics Template Selection rows and materialize selected approved Pie, Column, Bar, Line, Area, and Pivot templates inside Dashboard Page Layouts v1.1 two/three-column sections.
- Add App Plan/package conformance to the Data Analytics golden-reference validator and run it from first-generation preflight so planned analytics templates cannot be silently omitted.
- Bind generated chart/pivot controls to included data-list fields with runtime model metadata and template provenance instead of simplified visual-only controls.
- Add runtime-safe fallback choices for select fields, map identity fields to Dynamic user controls, prevent unresolved Collection detail-link placeholders, and emit post-install seed-data companion artifacts instead of embedding sample rows in generated-final `.yapk` content.

## 0.8.46

- Release root application icon, Dashboard empty-section, and filter-shape hard gates from PR #229.
- Validate decoded root `ListSet.IconUrl` surfaces in addition to wrapper `IconUrl`, and block blank, image-based, or mismatched root application icon metadata before signing readiness.
- Reject visible Dashboard Page Layouts v1.1 content-card sections whose `section_content_area` remains empty after template copy-and-map.
- Enforce select-filter rendered label values and valid select/search placeholder shapes so string-spread numeric placeholder objects cannot render as `[object Object]`.
- Make the standalone full-app materializer propagate FontAwesome root icons, remove unused copied dashboard sections, and emit safe filter label/placeholder metadata.

## 0.8.45

- Release YAPK Bit/switch field hard gates from PR #227.
- Add generated-final validation for Bit field metadata, string defaults, and default/custom `LayoutView` switch-control rows.
- Run the Bit field validator from first-generation YAPK preflight so wrong `input`/`checkbox` Bit controls block signing readiness.
- Make standalone full-app materialization emit planned boolean, yes/no, and flag fields as `FieldType: "Bit"` with runtime `Type: "switch"` and string default values.
- Preserve existing root identity, TenantID/signing readiness, already-installed response classification, approval export-shape, and runtime proof boundaries from the 0.8.42 Office Asset analysis.

## 0.8.44

- Release Data List Form Fields Grid v1.1 and Sub List control golden references from PR #225.
- Register `data_list_form_fields_grid_v1_1` for generated Data List form field layouts and require all current-record fields to live inside the template grid instead of ad hoc form-control placement.
- Register `data_list_form_control_sublist_v1_1` for Sub list fields and require Sub list controls to preserve the approved export-shaped template except for mapped list/field/title/content metadata.
- Enforce generated field-control `nav_label` metadata, zero field margins, responsive grid column/span constraints, one direct control per grid cell unless wrapped by an approved Container/Grid, and full-row treatment for Multiple line, Rich text, and Sub list controls.
- Allow field-grid and Collection templates in Dashboard/Data List Form Layouts v1.1 only inside `section_content_area` under `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`.

## 0.8.43

- Release Data List Form Layouts v1.1 golden references from PR #223.
- Register export-shaped New/Edit and View Item custom Data List form templates parsed from the Data list page layouts export.
- Require App Plans to select `data_list_form_layout_new_edit_v1_1` for New/Edit forms and `data_list_form_layout_view_item_v1_1` for View forms.
- Add generated-final and first-generation preflight validation for template provenance, allowed business slots, New/Edit related-data exclusions, View Item title/KPI regions, and full-app materializer clone-and-map output.
- Preserve proof boundaries: local fixture regression may prove the custom form layout contract, but signing/install/runtime proof still require OAuth, API-issued IDs, and all generated-final gates to pass.

## 0.8.42

- Release Dashboard Summary hidden-host and field metadata gates from PR #221.
- Place generated Dashboard KPI Summary controls inside a dedicated hidden host container instead of visible content regions.
- Add designer-shaped `ListDataID` field metadata to generated Summary count controls so the Summary runtime contract can resolve target list fields.
- Run the Dashboard Summary control contract inspector from first-generation YAPK preflight before signing readiness can be considered.
- Preserve proof boundaries: local fixture regression can prove the generated-final Summary contract, but signing/install/runtime proof still require OAuth, API-issued IDs, and all generated-final gates to pass.

## 0.8.41

- Release full-app materializer fixture ID demand alignment from PR #219.
- Allocate enough synthetic API-shaped fixture IDs for nontrivial App Plan regression materialization instead of using a tiny fixed six-ID set.
- Keep fixture provenance clearly regression-only through `api-generated-fixture-for-tests` and keep fixture output `signingEligible: false`.
- Preserve proof boundaries: fixture materialization must not be signed, installed/imported, upgraded, seeded, sent through Version Management, or reported as live Yeeflow ID provenance.

## 0.8.40

- Release Dashboard KPI temp variable binding hard gates from PR #217.
- Rebind every generated Dashboard KPI value to page-local Summary/temp variables instead of retaining Event Portfolio source-template variables.
- Generate hidden Summary controls, `Resource.ReportIds`, `Resource.exts`, and page `tempVars` for each visible KPI value produced by the standalone full-app materializer.
- Fail generated-final Dashboard validation when visible KPI text references source-template variables such as `__temp_event_portfolio_*` or any undeclared page-local temp variable.
- Preserve generated-final signing boundaries: local fixture regression may prove preflight, but signing/install/runtime proof still require API-issued IDs and all generated-final gates to pass.

## 0.8.39

- Release full-app Dashboard filter, dataset-region, and resource-depth materialization from PR #215.
- Generate App Plan-declared Dashboard select filters with field metadata, styling contract, and Collection consumption bindings instead of search-only filter output.
- Align Dashboard dataset-region parsing so generated regions match App Plan rows and approved internal Collection wrapper IDs are not treated as selected template IDs.
- Complete grid-table Collection gap/detail-layout contracts and preserve source-list detail links for generated Dashboard Collections.
- Expand generated data lists with planned business fields and attach custom data-list forms to the correct host lists.
- Preserve generated-final signing boundaries: local fixture regression may prove preflight, but signing/install/runtime proof still require API-issued IDs and all generated-final gates to pass.

## 0.8.38

- Release full-app Dashboard v1.1 Collection template materialization from PR #213.
- Make the standalone full-app materializer clone the registered `dashboard-page-layouts-v1.1` shell for generated Dashboard pages instead of assembling minimal heading/Summary/filter/Collection pages by hand.
- Parse Dashboard dataset presentation rows from the Markdown App Plan and materialize the exact selected Collection template inside the approved `content_card_wrapper > section_content_area` business slot.
- Preserve Collection template provenance, source-list binding, dataset-region metadata, page-level temp variables, actions, form actions, multiselect/delete-operation dependencies, and Summary/KPI temp-variable bindings.
- Align aggregate Dashboard hard gates so approved Collection template internals are delegated to specialized Collection template validators instead of producing false generic container/dynamic-user failures.

## 0.8.37

- Release Area chart and Data Analytics template selection guidance from PR #211.
- Add the `data_analytics_area_chart_with_title` golden reference template and register all six approved Data Analytics templates: Pie chart, Column chart, Bar chart, Line chart, Area chart, and Pivot table.
- Expand each Data Analytics golden reference with App Plan selection guidance, including summary, suitable source resource types, when to use, when not to use, required business signals, required App Plan declaration, proof boundary, and generation proof.
- Require App Plans to use the Data Analytics Template Selection table when Dashboard sections plan chart/data-analytics regions, with exactly one approved template ID per analytics region.
- Preserve Dashboard/Data List form usage only, block Approval form usage, and keep Dashboard Page Layouts v1.1 analytics placement limited to 2-column or 3-column sections.

## 0.8.36

- Release full-app materializer generated-final preflight alignment from PR #209.
- Preserve API-issued IDs as strings to avoid JavaScript precision loss and duplicate decoded IDs.
- Emit ID provenance paths that match the actual decoded package, including data-list fields/layouts, approval DefResource IDs, custom form layouts, and dashboard layout resources.
- Materialize runtime navigation metadata, generated data-list default views, canonical approval DefResource workflow/task/action metadata, and dashboard Summary/filter/Collection runtime metadata so nontrivial full-app packages pass generated-final preflight gates before signing can be considered.
- Extend full-app materializer regression coverage to require ID provenance, runtime navigation, data-list schema, YAPK package, generated export-shape, and generated-final resource-completeness validation for nontrivial App Plans.

## 0.8.35

- Release minimal full-app materializer resource-graph generation from PR #207.
- Materialize supported nontrivial App Plans into generated-final `.yapk` packages with schema-shaped data lists, approval forms, FormNewReports, custom list layouts, dashboard pages, and grouped navigation.
- Keep standalone materializer output `signingEligible: false` until generated-final preflight passes, preserving the signing/install/runtime proof boundary.
- Update full-app entrypoint standard, registry, focused regression coverage, cache artifact checks, and dist mirrors.

## 0.8.34

- Release generated-final resource-completeness path-independent test harness hardening from PR #205.
- Resolve the generated-final resource-completeness validator through an absolute path in the focused regression harness.
- Invoke the validator from an external working directory so source checkouts, installed caches, and active marketplace payloads exercise the same path-independent contract.
- Emit explicit diagnostics when validator JSON or `findings[]` output is missing, instead of ambiguous undefined findings.
- Keep the planned approval form with decoded `Forms: []` regression case strict with `GENERATED_FINAL_FORMS_EMPTY_WITH_PLANNED_APPROVAL_FORMS`.

## 0.8.33

- Release full-app materializer resource-demand precision gates from PR #203.
- Require fail-closed materializer reports to include exact planned resource names, counts, and missing generated-final output surfaces.
- Prevent App Plan field rows, dashboard section rows, metric rows, filter rows, item-template rows, validator commands, and prose from inflating resource-demand counts.
- Keep nontrivial App Plans package-free and not signing/install eligible until the full resource graph can be materialized and generated-final preflight passes.

## 0.8.32

- Release full-app materializer fail-closed resource-graph gates from PR #201.
- Make `scripts/materialize-full-app-generated-final.mjs` fail closed for nontrivial App Plans until full resource-graph materialization is implemented.
- Prevent placeholder/schema-smoke packages from reporting `signingEligible: true` or being treated as signing/install eligible.
- Align materializer smoke provenance metadata with `api-generated` allocation source expectations and use a domain-safe default FontAwesome icon.

## 0.8.31

- Release the full-app generated-final materialization entrypoint from PR #199.
- Add `scripts/materialize-full-app-generated-final.mjs` as a standalone Node CLI that consumes approved `functional-specification.md`, `yeeflow-app-plan.md`, and an API-issued ID manifest to emit a generated-final `.yapk`, decoded resource, ID provenance report, and generation report.
- Keep the signing/install boundary explicit: fixture ID mode is regression-only and not signing/install eligible, while normal generated-final materialization requires API-issued IDs before package artifacts can proceed toward signing readiness.
- Register the materialization entrypoint in the full-app generation entrypoint registry, cache artifact checks, aggregate UI hard gates, and builder/generator/package-validator skill guidance.

## 0.8.30

- Release Data Analytics golden reference templates from PR #197.
- Add export-shaped Pie chart, Column chart, Bar chart, Line chart, and Pivot table template artifacts with a closed approved registry.
- Add generated-final validation for approved analytics template provenance, chart wrapper/title fidelity, Dashboard Page Layouts v1.1 2/3-column placement, Data List form allowance, and Approval form exclusion.
- Register the analytics gate in first-generation YAPK preflight, aggregate UI hard gates, cache artifact checks, and generator/validator skill guidance.

## 0.8.29

- Release first-generation smoke and installed-cache-root alignment from PR #195.
- Keep Account Health first-generation smoke positive fixtures generated-final preflight-clean, with embedded seed rows, missing native Title index metadata, and legacy simplified dashboard shells retained as negative regressions.
- Allow cache artifact and aggregate UI hard gates to run from both source checkouts and installed Codex plugin payload roots without requiring a nested `dist/yeeflow-app-builder-plugin` directory inside installed cache payloads.

## 0.8.28

- Release the full export-shaped `collection_control_grid_table` template from PR #193.
- Add the sanitized Projects Center v1.7 / Collection_control_grid_table wrapper template as a tracked reference artifact.
- Require generated dashboards to preserve `grid_table_col_wrapper`, locked wrapper/caption/operation/action structure, approved editable title/search/button/header/item/operation regions, and field-type compatible Dynamic controls.
- Enforce `grid_table_col_header` and `grid_col_item` column count, width, and property parity, and block simplified grid-table approximations, mismatched header/item fields, missing operation action bindings, and invalid mutable controls for display-only sources before signing readiness.

## 0.8.27

- Release the full export-shaped `collection_control_responsive_card_grid` template from PR #191.
- Add the sanitized Company Overview v1.4 / Collection_control_responsive_card_grid wrapper template as a tracked reference artifact.
- Require generated dashboards to preserve `collection_control_responsive_card_wrapper`, locked responsive-card structure, approved editable title/search/button/item regions, optional caption/item-operation rules, field-type compatible Dynamic controls, and delete-confirmation temp variable/action dependencies.
- Block simplified responsive-card approximations, dynamic-image controls without Image fields, missing item operation action bindings, and drift outside approved template slots before signing readiness.

## 0.8.26

- Release Dashboard template materialization fidelity gates from PR #189.
- Treat approved Dashboard Collection/KPI templates as clone-and-map contracts rather than visual suggestions.
- Enforce grid-table multiselect full-width wrapper/caption/content layers, locked spacing parity, source-domain text replacement, row-select action wiring, Designer-compatible filter condition shape, and approved KPI row/card materialization.

## 0.8.25

- Release clean full E2E install, seed, approval, and dashboard quality gates from PR #187.
- Treat package API `Status: 0` as submitted/accepted only; final success still requires async materialization and browser/runtime proof.
- Block generated-final YAPK seed rows in `Childs[].List.Items`, strengthen approval `DefResource` task-routing checks, reject install-failed/empty Components runtime evidence, and enforce dashboard source-template/generic-label cleanup plus seed-derived KPI expected-value proof.

## 0.8.24

- Release Dashboard multiselect template fidelity and materialization gates from PR #185.
- Enforce source-template Text typography/color metadata for card and grid-table multiselect templates before release/cache smoke.
- Harden grid-table multiselect wrapper/detail contracts with zero-gap metadata, `{{DetailLayoutID}}` replacement, slide-open detail layout rules, and generator guidance for real Summary/KPI/Data Filter materialization.

## 0.8.23

- Release Dashboard shell and Collection validator alignment from PR #183.
- Require generated dashboards to instantiate the full Dashboard Page Layouts v1.1 shell before placing dataset components.
- Keep grid-table-specific checks scoped to grid-table templates so card multiselect templates are validated by their own export-shaped contract.
- Accept explicit no-open metadata when row/card open behavior is not planned, and parse the current unified App Plan Dashboard schema during generated-final completeness validation.

## 0.8.22

- Release the full export-shaped `collection_control_grid_table_with_multiselect` template from PR #181.
- Add the sanitized Projects Center v1.6 / All Tasks - multiple select wrapper template as a tracked reference artifact.
- Require generated dashboards to preserve `grid_table_col_multiselect_wrapper`, locked `grid_table_col_item_select`, Collection root actions, selected-state variables, page-level filter/temp/action/formAction dependencies, and approved editable regions.
- Enforce matching `grid_table_col_header` and `grid_col_item` column counts, widths, and compatible grid properties, and block simplified grid-table multiselect approximations before signing readiness.

## 0.8.21

- Release the full export-shaped `collection_control_card_with_multiselect_toolbar` template from PR #179.
- Add the sanitized Company Overview v1.3 / Collection card multiple select wrapper template as a tracked reference artifact.
- Require generated dashboards to preserve `card_with_multiselect_toolbar_wrapper`, locked `card_col_item_multi_select`, Collection root actions, selected-state variables, page-level filter/temp/action/formAction dependencies, and approved editable regions.
- Add focused regressions for simplified card multiselect structures, missing page-level dependencies, missing button action bindings, and optional item operation removal.

## 0.8.20

- Release Dashboard Collection template materialization conformance gates from PR #177.
- Compare App Plan Dashboard dataset regions against generated Dashboard Collection regions when both plan and package are available.
- Fail generated-final packages when selected templates are not materialized, region templates mismatch, planned template diversity collapses to one generated template, planned Collection regions are missing, or matched Collections lack explicit root provenance.
- Add focused regressions proving multi-template App Plans cannot pass when generation collapses every Collection to Event Pipeline Grid-Table.

## 0.8.19

- Release Dashboard Golden Reference property fidelity gates from PR #175.
- Enforce module-level typography fidelity for dashboard title, subtitle, KPI label/value/trend/note, section subtitle, and grid-table column headers.
- Enforce select-filter appearance fidelity, including xs-light label typography, tuple-shaped top label layout, placeholder color, supported border radius, and fixed-width positioning.
- Add focused regressions proving structure/provenance-only dashboards fail before signing when child-control properties drift.

## 0.8.18

- Release Dashboard filter module synthesis gates from PR #173.
- Require generated Dashboard filters to be copied from approved Dashboard Page Layouts v1.1 / Event Portfolio filter modules and placed only inside approved business-content slots such as `section_content_area`.
- Preserve app-specific `attrs.data.field`, `display_f`, `value_f`, labels, placeholders, typography, placeholder color, supported border radius, and Collection/KPI consumer linkage before generated-final preflight can pass.
- Add focused regressions for missing filter field/style metadata, copied filter groups placed directly under root `Content`, invented ad hoc filter modules, and obsolete forced-zero v1.1 `Content` padding.

## 0.8.17

- Release validator semantic tolerance and Dashboard dataset line-scope fixes from PR #171.
- Narrow Dashboard dataset presentation App Plan validation to canonical dataset/reference table rows, avoiding false positives from prose, Form Report explanations, identity tables, and validator command lists.
- Allow semantic-equivalent App Plan wording for required planning intent while preserving canonical resource-order, schema, and low-level implementation leakage gates.
- Add focused regressions for the 0.8.16 dashboard dataset no-workaround probe and literal-phrase semantic-equivalent probe.

## 0.8.16

- Release full-app skill-callable generation entrypoint contract from PR #169.
- Mark the `yeeflow-application-builder` and `yeeflow-application-generator` full-app generation skills as first-class callable Codex skill entrypoints.
- Add machine-readable `invocationContract` metadata so clean-room runs continue from approved `functional-specification.md` and `yeeflow-app-plan.md` into generated-final `.yapk` creation instead of stopping solely because no standalone CLI exists.
- Extend `inspect-full-app-generation-entrypoints.mjs` and its regression suite to fail descriptive-only entrypoint records, weak planning-pass continuation contracts, and callable contracts missing required Markdown inputs.
- Keep delivery, package API, runtime-proof, and sample-specific helper scripts explicitly forbidden as generic full-app generators.

## 0.8.15

- Release full-app entrypoint cache-path alignment from PR #167.
- Allow the full-app entrypoint registry to validate both source checkout skill paths and installed plugin payload skill paths.
- Add `bundledPath` coverage for `yeeflow-application-builder` and `yeeflow-application-generator`, so active plugin cache validation resolves `skills/<skill-name>/SKILL.md` instead of failing on source-only `skills/installed/<skill-name>/SKILL.md`.
- Add installed-cache-layout regression coverage for `inspect-full-app-generation-entrypoints.mjs`.

## 0.8.14

- Release full-app generation entrypoint and Collection template exact-match gates from PR #165.
- Register skill-orchestrated full-app generation entrypoints so clean-room generation can continue from `functional-specification.md` and `yeeflow-app-plan.md` without misclassifying proof, delivery, package API, runtime-proof, or sample helper scripts as full-app generators.
- Require Dashboard Collection template validation to use exact template-token matching instead of substring matching, so `collection_control_grid_table_with_multiselect` and `collection_control_grid_table_with_search` no longer collide with the base `collection_control_grid_table` template.
- Keep all approved Dashboard Collection presentation templates as component-level dataset regions inside Dashboard Page Layouts v1.1 slots, with generated-final package and UI hard gates still enforcing provenance, slot placement, and no simplified/invented Collection structures.

## 0.8.13

- Release Dashboard Collection template slot decision gates from PR #163.
- Require App Plan Dashboard dataset regions that use Collection to select exactly one approved presentation reference using registry guidance: source resource type, when-to-use, when-not-to-use, and required business signals.
- Treat all approved Dashboard Collection templates as component-level dataset regions inside Dashboard Page Layouts v1.1, normally under `section_content_area`, not as page shells.
- Fail generated Dashboard Collections placed directly under root `Content`, copied source shells, page headers, or structural wrappers.
- Continue blocking invented/simplified Collection templates and source-reference leakage from Event Portfolio, Projects Center, Project Tasks, or other proof apps.
- Register the new training report in YAPK cache artifact checks.

## 0.8.12

- Release Dashboard root binding, v1.1 Content padding, and runtime proof gates from PR #161.
- Fail generated-final Dashboard Type 103 pages when `Pages[].ListID` drifts from the decoded package root `ListSet.ListID`; `LayoutID` remains the page layout resource ID.
- Enforce Dashboard Page Layouts v1.1 `Content` padding parity with the canonical template, replacing obsolete forced-zero Content normalization.
- Derive package API canonical runtime URLs from the decoded package root ListSetID instead of install response IDs.
- Preserve sanitized install/sign response messages and classify already-installed fresh-install responses as upgrade follow-up, not final success.
- Register focused dashboard install/runtime root-binding regressions in aggregate UI and YAPK cache gates.

## 0.8.11

- Release Dashboard dataset presentation Golden References from PR #159.
- Register approved Dashboard Collection dataset templates: responsive card grid, card multiselect toolbar, grid-table, grid-table with multiselect, grid-table with search, and Event Pipeline Grid-Table.
- Require App Plan Dashboard dataset regions that use Collection to select one approved presentation reference and explain the business rationale without runtime IDs or low-level payload properties.
- Add generated package validation for missing template provenance, unknown template IDs, simplified grid-table structures, missing multiselect action contracts, and missing search/fulltext linkage.
- Register the new gate in Dashboard hard gates, first-generation YAPK preflight, aggregate UI gates, and YAPK cache artifact checks.
- Clarify that Projects Center / Project Tasks is source proof for the multiselect grid-table template, not a business-domain restriction.

## 0.8.10

- Release YAPK Dashboard runtime materialization and preflight gates from PR #157.
- Fail generated-final KPI cards that claim live metrics without Summary controls, `ReportIds`, `exts`, `tempVars`, `attrs.save_var`, and visible KPI value bindings.
- Fail unconsumed dashboard filters, placeholder filter operator/value metadata such as bare `0`, business/data controls inside `page_title_section`, simplified grid-table/Data table lookalikes, shared primary Collection wrappers, and Dynamic user field-family mismatches.
- Fail generated-final YAPK packages that embed sample rows under `Childs[].ListDatas` or `Childs[].List.ListDatas`; sample data must be emitted as a separate seed artifact and live-seeded only with explicit approval.
- Fail App Plan resource-completeness validation when a non-empty resource-like plan parses to zero resources, preventing parser fail-open signing readiness.
- Register the focused runtime-materialization regression suite in aggregate UI and YAPK cache hard gates.

## 0.8.9

- Release Dashboard Page Layouts v1.1 validator alignment from PR #155.
- Align aggregate dashboard and YAPK validators so Dashboard Page Layouts v1.1 is treated as the page shell.
- Keep Event Portfolio Golden Reference checks as component/region checks inside approved v1.1 business-content slots and section content areas, rather than as a competing page-root contract.
- Reuse v1.1-style identity detection for `Main`, `Content`, actions, and navigator/control labels across `id`, `name`, `label`, `nv_label`, `nav_label`, attrs variants, and case-insensitive values.
- Allow required generator normalization for Main/Content labels, background, padding, Full-width settings, empty `actions: []`, meaningful navigator/control names, and `Operations` removal when no real actions exist.
- Continue failing competing Event Portfolio root shells, invented dashboard layout modules, and business Collection/table content placed directly under root `Content` instead of approved section content.

## 0.8.8

- Release Dashboard Page Layouts v1.1 controlled-slot and repeatable-module enforcement from PR #153.
- Register explicit allowed business-content containers for dashboard business text, bindings, filters, KPI values, FontAwesome icons, actions, and Collection/table fields.
- Register explicit repeatable/removable modules for content cards, 2-column, 3-column, 60/40 sections, KPI rows, and KPI cards.
- Reject invented dashboard layout modules outside approved business-content containers.
- Require copied layout modules to preserve template structure, hierarchy, control types, width, padding, direction, gap, background, and required children.
- Require added KPI cards to copy the approved `event_portfolio_kpi_planned_events` card pattern.
- Keep `Operations` omitted unless real configured actions exist, and continue blocking visual-only action placeholders.

## 0.8.7

- Release Dashboard Page Layouts v1.1 template adoption from PR #151.
- Register Dashboard Page Layouts v1.1 as the required page shell for newly generated Dashboard pages.
- Enforce the standard dashboard page structure, including page background, `Main > Content`, page title/header, content cards, 1/2/3-column sections, 60/40 section, and KPI wrapper.
- Use the v1.1 page shell together with Event Portfolio component/region golden references.
- Add Full-width structural container checks and section title/content area checks.
- Allow `Operations` containers only when real configured actions exist.
- Require canonical runtime route proof.
- Preserve dashboard-only upgrade scope by blocking unrelated resource changes and preserving Dashboard `LayoutID` values.

## 0.8.6

- Release Dashboard Golden Reference export-shape parity from PR #149.
- Update the Event Portfolio Dashboard Golden Reference source and enforce strict `_ak_c` / `_ak_c_opt` export-shape parity.
- Add golden-reference quality lint for required regions, Full-width sections/KPI cards, root Content zero-padding, and high-level Container layout.
- Keep the approved table-internal `flex_grid` exceptions explicit.
- Strengthen filter label/placeholder and field/display/value/apply contract gates plus static filter consumer linkage checks.
- Add runtime filter before/after data-change proof gating before claiming filter linkage success.
- Enforce `dynamic-user` rendering for user/identity fields.
- Reject provenance-only simplified dashboard shells.

## 0.8.4

- Release existing-app YAPK upgrade scope, lineage, and Version Management gates from PR #145.
- Require upgrade packages to declare intended scope and block unrelated-resource mutations for field-only/list-only upgrades.
- Add upgrade report scope and duplicate report checks for `FormNewReports` and `DataReports`.
- Strengthen upgrade ID preservation with layout semantic-key disambiguation.
- Enforce default view `LayoutView.layout[]` and `LayoutView.query[]` consistency for visible field additions.
- Add upgrade wrapper identity checks for Version Management-compatible package metadata.
- Classify upgrade API status `0` as submitted/accepted, not final success.
- Require Version Management final `Succeed` row proof, failed-row error-log capture, and separate runtime change proof.
- Add approval `DefResource` upgrade-scope and export-shape readiness checks.

## 0.8.3

- Release generated-final YAPK export-shape and runtime materialization gates from PR #143.
- Add approval `DefResource` export-shape checks for canonical `::brotli::` Brotli/base64 encoding, process metadata, page registrations, form/task page metadata, workflow graph IDs, positions, variables, links, task URLs, and key/defkey consistency.
- Reject minimal approval placeholders and count-only FormNewReports/DataReports placeholders unless explicitly deferred with App Plan impact.
- Strengthen Dashboard runtime-safe materialization checks so synthetic-only controls, hidden Summary hosts, unsafe Summary/chart models, and empty business sections do not satisfy App Plan resources.
- Support `PortalInfo: null` for no-portal YAPK packages while continuing to reject `{}` and `[]`.
- Enforce native Title export metadata, including `Status: 0`, `IsSystem: true`, and `IsIndex: true`.
- Clarify TenantID as wrapper tenant metadata rather than generated app content ID provenance.
- Report runtime URL mismatches separately when install/API-reported IDs differ from the decoded package root `ListSet.ListID`.

## 0.8.2

- Add generated-final resource completeness gates that compare decoded packages against the approved App Plan before signing readiness.
- Fail planned approval-form applications that generate `Forms: []`, planned Form Reports with empty `FormNewReports[]`, and planned Data Reports with empty `DataReports[]`.
- Fail shell-only dashboards when the App Plan declares KPI/Summary metrics, filters, Collection/Data table/Kanban/Timeline regions, or dynamic item-template display needs but generated Type 103 dashboard content is empty.
- Fail generic/default-only navigation when the App Plan declares concrete navigation groups/items and planned resources are not reachable.
- Wire the completeness gate into first-generation YAPK preflight when `--plan <yeeflow-app-plan.md>` is supplied and make dashboard generation hard gates plan-aware for dashboard materialization.
- Keep omissions allowed only for App Plan items explicitly marked deferred with reason, fallback/user impact, and follow-up proof.

## 0.8.1

- Fix App Plan planning schema/validator consistency introduced around the `0.8.0` planning-quality release.
- Keep `yeeflow-app-plan.md` as the single primary Markdown App Plan artifact with the canonical `# <Application Name> - Yeeflow App Plan` resource-order schema.
- Make `validate-app-plan-template.mjs` validate the same canonical resource-order App Plan contract as `validate-app-plan-resource-order.mjs` instead of requiring a competing `Yeeflow Application Plan` schema.
- Clarify Functional Specification generation so `functional-specification.md` must emit every required canonical section in the standardized Markdown template, including not-applicable sections with rationale.
- Preserve the overall App Plan template structure and continue enhancing only Dashboard Pages Plan with legal Yeeflow control-type planning.
- Keep prevention of low-level implementation leakage in Functional Specification, App Plan, and Page Function Plan planning surfaces.
- Prevent negative guardrail wording such as unsupported-shape blockers from being misclassified as planned unsupported controls.
- Add focused Office Asset Loan style schema consistency regressions proving the Functional Specification, App Plan template validator, resource-order validator, Dashboard Pages Plan checks, implementation-leakage checks, and guardrail-wording checks agree.

## 0.8.0

- Release richer Functional Specification business logic requirements, including business process, roles, rules, data lifecycle, reporting, audit, and clarification gates.
- Standardize the primary Markdown Functional Specification template and require `functional-specification.md` as the human-readable source, with JSON allowed only as companion trace/projection artifacts.
- Add Functional Spec Dashboard business requirements for business questions, source objects, metrics, metric logic, regions, display fields, filters, actions, mobile needs, and exceptions.
- Preserve the overall App Plan template structure while enhancing only the Dashboard Pages Plan section.
- Require `yeeflow-app-plan.md` as the primary Markdown App Plan artifact and keep companion JSON projections secondary.
- Add detailed Dashboard Pages Plan mapping from Functional Spec dashboard requirements to legal Yeeflow control-type categories, including Summary/KPI, Data Filter, Collection, Data table, Kanban, timelines, Text/Heading, Button/action, Container, Grid/flex grid, and proof/deferred handling for unproven analytics.
- Prevent low-level implementation leakage in Functional Specification, App Plan, and Page Function Plan planning surfaces, including runtime IDs, `ListID`, `PageID`, `FormID`, `LayoutID`, `ProcKey`, `actionTypeCode`, JSON property paths, generated payloads, and fake placeholder IDs.
- Require generated application wrapper icons to use FontAwesome icon JSON strings and reject image URL, emoji, SVG, missing-field, or domain-inappropriate application icons.
- Add dashboard generation-time hard gates for filter display/value/style metadata, coded Container width/layout values, native KPI Icon controls, Summary field-selection/runtime binding consistency, and canonical application URL/app identity reporting from decoded `ListSet.ListID`.

## 0.6.64

- Release Business Clarification unique unresolved gate summary reporting from PR #95.
- Preserve raw Business Clarification findings while adding JSON summary fields: `rawFindingCount`, `uniqueUnresolvedGateCount`, `uniqueUnresolvedGateKeys`, and `gateOccurrences`.
- Make user-facing planning reports distinguish duplicated findings from unique unresolved business decisions when the same gate appears in both the Functional Specification and Yeeflow App Plan.
- Keep planning and generation mode behavior unchanged: planning mode can pass with warnings for `default-applied-for-planning`, while generation mode remains blocked until gates are answered or explicitly approved for generation.
- Add focused regression coverage proving five duplicated business gates across Functional Specification and App Plan produce ten raw findings but five unique unresolved gates.

## 0.6.63

- Release planning default approval and exact type gates from PR #93.
- Add Business Clarification validation modes for planning and generation.
- Allow `default-applied-for-planning` only for planning-mode validation and block it in generation-mode validation.
- Require `user-default-approved-for-generation` before default-based generation can proceed.
- Require warning/error counts to have matching warning/error findings.
- Reject combined exact type/control headings in Generation Readiness validation.
- Reject slash-combined exact implementation values such as `Lookup / lookup control`.
- Reject broad `where supported` implementation wording unless marked `runtime-proof-required`, `export-learning-required`, or `deferred` with reason, fallback, and proof impact.
- Require App Plan exact Yeeflow type/control/action values to be split into separate columns.
- Add focused regression coverage in `scripts/test-planning-default-approval-and-exact-type-gates.mjs`.

## 0.6.62

- Release Business Clarification and App Plan precision gates from PR #91.
- Update the Business Clarification validator so it ignores generic hard-gate/proof/validation/schema/runtime/package tables and only parses explicit business clarification sections.
- Require final planning output to enumerate every unresolved business decision gate, or clearly state that approving all recommended defaults covers each named gate.
- Require generation readiness reports to separate structural generation readiness from overall readiness blocked by Business Clarification Gate.
- Reject ambiguous App Plan implementation wording such as slash-combined types or "where supported" actions unless marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
- Require Document Library planning to use a clear selected Yeeflow resource type or mark uncertainty with the required proof/deferred label.
- Add focused Vendor-style regression coverage in `scripts/test-business-clarification-and-app-plan-precision-gates.mjs`.

## 0.6.61

- Release App Plan control-selection, action, and plugin-supported type/property planning gates.
- Require every App Plan record display section to select a supported display control: Data table, Collection, Kanban, Vertical timeline, or Horizontal timeline.
- Prefer Collection over Data table when both controls can satisfy the requirement, unless a dense native table/grid is specifically required.
- Require Collection, Kanban, Vertical timeline, and Horizontal timeline plans to include item-template Dynamic controls with source-field bindings.
- Require Collection/Kanban custom item actions to be explicitly planned with current-item context and steps, or explicitly marked not applicable.
- Require Approval Form and Custom Data List form Sub List custom List actions to be explicitly planned with current-row context and steps, or explicitly marked not applicable.
- Require App Plan output to use plugin-supported Yeeflow control, action, workflow node, field, variable, property, and binding types, or mark unsupported shapes as `export-learning-required`, `runtime-proof-required`, or `deferred`.
- Update `scripts/validate-app-plan-resource-order.mjs`, `scripts/validate-generation-readiness-review.mjs`, and `scripts/validate-functional-spec-to-app-plan-traceability.mjs` to enforce these planning gates.
- Add regression coverage in `scripts/test-app-plan-control-action-property-gates.mjs`.

## 0.6.60

- Release the executable Business Clarification Gate validator at `scripts/validate-business-clarification-gate.mjs`.
- Release the executable Generation Readiness Review validator at `scripts/validate-generation-readiness-review.mjs`.
- Release the Functional Specification to App Plan traceability validator at `scripts/validate-functional-spec-to-app-plan-traceability.mjs`.
- Add regression coverage in `scripts/test-clarification-readiness-traceability-gates.mjs`.
- Block progression beyond planning when business decision gates remain unanswered, App Plan resource areas are missing, empty, placeholder-only, or incomplete, or Functional Specification requirements are not mapped to App Plan resources or explicit deferred/not-applicable coverage.
- Require these gates to pass before full-page design images, page implementation blueprints, resource generation, decoded resource-vs-blueprint parity, package/sign/upgrade, or runtime proof.
- Clarify that these validators prove planning readiness and traceability only, not package validity, business correctness, signing/API acceptance, or runtime behavior.

## 0.6.59

- Release the required Stage 1 Functional Specification template and review gate for every new application build.
- Release the required Stage 2 Yeeflow App Plan resource-order template and review gate, generated only from the reviewed Functional Specification.
- Document canonical templates at `docs/standards/functional-specification-standard-template.md` and `docs/standards/app-plan-standard-template.md`, while keeping `docs/app-plan-standard-template.md` as the compatibility entrypoint.
- Add `scripts/validate-functional-specification.mjs`, `scripts/validate-app-plan-resource-order.mjs`, and regression coverage in `scripts/test-functional-specification-and-app-plan-gates.mjs`.
- Require the App Plan to be a Yeeflow resource generation contract organized by Yeeflow resource generation order, not a generic project plan.
- Treat Form Report as a standalone Yeeflow resource based on Approval Form, not Dashboard or Data List view planning.
- Require Placeholder planning for Data List fields, Approval Form Submission fields, Task Form fields, and Custom Data List Form fields.
- Require Functional Specification and App Plan gates to pass before full-page canonical design images, page implementation blueprints, resource generation, decoded resource-vs-blueprint parity, package/sign/upgrade, or runtime proof.

## 0.6.58

- Release full-page design artifact, page implementation blueprint, staged workflow, and decoded resource-vs-blueprint parity gates.
- Require canonical page PNGs to be full-page implementation-ready artifacts, not first-viewport mockups; reject viewport-only designs when below-fold content exists.
- Reject missing planned sections, missing table/form detail, missing page end, unresolved placeholder regions, SVG-only artifacts, and design-board substitutes for canonical per-page PNGs.
- Require every page to have an implementation blueprint before Yeeflow resource generation.
- Require blueprints to map every visible design element to Yeeflow controls with hierarchy, control type, `id`, semantic `nv_label`, parent/child relationships, exact property paths, sizing/spacing/border/background/shadow/typography rules, data/list/field bindings, Summary/KPI aggregation, Data Filter variables, Collection/table columns, row links, Dynamic user/person bindings, progress/status/badge bindings, actions, interactions, and runtime proof plan.
- Require blueprint property paths to validate against the normalized control-property registry or evidence-backed extension registry.
- Require decoded resources to match the blueprint before package/sign/upgrade; fail on missing section/control, wrong control type, missing required property, missing binding, missing action, missing or invalid `nv_label`, and placeholder/static substitutions for mapped design elements.
- Enforce staged workflow exit criteria: functional spec before app plan, app plan before full-page designs, full-page designs before blueprint, blueprint/control-property validation before resource generation, decoded resource-vs-blueprint parity before package/sign/upgrade, and runtime proof kept separate from local/schema/API proof.
- Keep navigation active-style gates from `0.6.57`, Supplier runtime/design and proof-layer gates from `0.6.56`, dashboard/data-list custom form root-padding gates from `0.6.55`, and Summary/filter/collection/content fidelity gates as baseline behavior.
- Keep approval-form root padding deferred because evidence remains mixed, and do not claim pixel-perfect or live-runtime proof before actual runtime evidence exists.

## 0.6.57

- Release horizontal navigation active-state runtime gates.
- Do not treat `ListSet.LayoutView.attrs["navigator-menu"]` active-state metadata as runtime proof.
- Do not treat `LayoutView.customcss` as runtime-injected proof without DOM/style tag evidence.
- Require hidden `codein` CSS injectors for app chrome styling to be placed inside rendered page containers such as `Content`, not directly under the visual resource root.
- Require runtime proof that the style tag exists, the intended selector exists, `.ak-listset-new-navigation-item.active` exists, the active background is transparent, active text is blue, and the active bottom border is blue, solid, and nonzero.
- Require a fresh top-level cache-busted load after upgrade when app chrome or page resources changed.
- Reinforce that package schema validation, signing, upgrade API acceptance, ID stability, decoded CSS presence, and decoded control presence are not enough to claim app chrome style success.
- Keep Supplier runtime/design and validation-layer proof gates from `0.6.56` as baseline behavior and keep dashboard/data-list custom form root-padding gates from `0.6.55` as baseline behavior.
- Keep approval-form root padding deferred because evidence remains mixed.
- Confirm this release does not claim pixel-perfect comparison or live runtime proof before actual runtime evidence exists.

## 0.6.56

- Release Supplier runtime/design fidelity gates and Supplier validation-layer proof gates.
- Add runtime proof gates for installed application `ListSetID` and runtime URL proof, including rejection of install-log IDs as runtime `ListSetID` proof.
- Require design section mapping, KPI count/design mapping, page background and chrome consistency, real Data Filter bindings, filter/action row `nv_label`, Collection source/detail-link validation, real analytics controls for chart sections, progress/status treatment, and Summary/KPI raw-variable prevention.
- Require one canonical PNG per planned page, reject SVG files and design boards as replacements for canonical per-page PNGs, and validate design manifest page count, order, and name mapping.
- Require layered proof reporting across `schemaValidation`, `appPlanConformance`, `designContractValidation`, `controlBindingValidation`, `exactMetadataShapeValidation`, `idStabilityValidation`, `signVerify`, `installOrUpgrade`, `runtimeBrowserProof`, and `pixelComparison`.
- Prevent false proof claims: schema pass is not UI proof, API/sign/install acceptance is not runtime/browser proof, proof layers must not be collapsed, decoded `ListSetID` must be tied to runtime URL proof, design-control mapping must be explicit, and the control-binding graph must be complete.
- Keep the root padding hard gates from `0.6.55` as baseline behavior and keep approval-form root padding deferred because evidence remains mixed.
- Confirm this release does not claim pixel-perfect comparison or live runtime proof unless runtime screenshots/pixel comparison and browser evidence are actually run.

## 0.6.55

- Release dashboard and data-list custom form root padding hard gates.
- Require dashboard/app page roots to use `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`.
- Require data-list custom form roots under `Data.Childs[].Layouts[].LayoutInResources[].Resource` and `Childs[].Layouts[].LayoutInResources[].Resource` to use the same exact token-array zero-padding shape.
- Reject invalid root padding shapes including scalar zero, numeric object zero, numeric array zero, `attrs.common.padding` alone, `attrs.style.padding` alone, and missing or wrong `attrs.container.cw`.
- Normalize dashboard page roots and data-list custom form roots during upgrade/patch flows before signing or installing.
- Keep intentional spacing allowed on inner containers, cards, grids, and forms.
- Defer approval form root padding hard gates because existing approval form evidence is mixed and needs a separate export/runtime proof task.

## 0.6.54

- Release Summary/filter/collection/full-page fidelity gates.
- Keep Summary controls as normal `type: "summary"` controls and reject invalid `_ak_c` clipboard wrapper child objects.
- Require page `Resource.exts[]` Summary pivot metadata with `AppID`, `ListID`, `ListSetID`, and nonempty `settings.values[]`.
- Require COUNT Summary settings to use `ListDataID`.
- Require top-level and attrs-level `save_var` / `saveVar`.
- Require hidden Summary source hosts to hide on desktop, tablet, and mobile with `display:none`.
- Require visible KPI values to bind to Summary temp variables instead of rendering raw variables.
- Reinforce real Data Filter controls instead of static Text, Add/New Containers with `action-type = "5"` and target list metadata, Collection grid-table column gap `0`, resolved collection links, progress controls instead of raw formula text, Dynamic user controls bound to User/identity fields, and field type compatibility gates.
- Confirm this release does not claim pixel-perfect visual diffing, automatic screenshot parsing, or live runtime proof before install/cache smoke and focused runtime testing are performed.


## 0.6.53

- Release Runtime Sample Data and KPI/Table Presentation Fidelity Gates.
- Add runtime sample-data proof gates for redacted `/users/search` `AccountID` provenance, scoped item PATCH proof for blank User/person values, Events/list item batch-create proof for runtime sample rows, and retry/backoff or delayed verification for batch-created rows.
- Add Collection grid-table fidelity checks for root overflow hidden, aligned header/body grids, padding parity, real progress bar controls for progress-like columns, numeric progress source fields, Dynamic user/person controls bound to User/identity fields, and semantic `nv_label` values.
- Add KPI presentation fidelity checks for `formatNumber(...)`, compact K/M/B formatting, fixed decimal formatting, long raw decimal rejection, and unformatted large-number rejection.
- Reinforce that runtime values remain live and mock values are visual targets only.
- Confirm this release does not claim pixel-perfect visual diffing, automatic screenshot parsing, or live runtime proof before install/cache smoke and focused runtime testing are performed.

## 0.6.52

- Release KPI/card/table/action content fidelity gates.
- Add KPI/card rich structure validation for fixed icon tiles, centered icons, inline body layout, text stacks, Summary/value hierarchy, trend text, and helper text.
- Add Summary/raw-variable prevention so visible runtime text and Summary values cannot expose internal variable tokens.
- Add live KPI mock-vs-runtime data-value boundary reporting instead of forcing static mock values as runtime proof.
- Add rich table treatment checks for badge, progress, avatar/person, header hierarchy, and row density when design fidelity is claimed.
- Add Action Container behavior fidelity checks, including add-list `action-type = "5"`, target list metadata, child Heading/Text action labels, and semantic `nv_label` requirements.
- Confirm content fidelity is now executable through `scripts/inspect-ui-control-property-fidelity.mjs`.
- Confirm this release does not claim pixel-perfect visual diffing, automatic screenshot parsing, or live runtime proof before install/cache smoke and focused Marketing Event runtime testing are performed.

## 0.6.51

- Add Non-Container Advanced Style Fidelity Gates.
- Extend the Yeeflow control-property knowledge base with evidence-backed Advanced-tab rules for non-Container controls.
- Keep Container controls special: Container width, height, and layout remain under `attrs.style`, including `attrs.style.height`, `attrs.style.cushei`, and `attrs.style.cusheiu`.
- Define the non-Container common Advanced-tab style model with `attrs.common.positioning`, `attrs.common.sizing`, `attrs.common.margin`, `attrs.common.padding`, `attrs.common.border`, and `attrs.common.background`.
- Define non-Container width modes: `attrs.common.positioning.widthtype = [null, "1"]` for full width, `[null, "2"]` for inline width, and `[null, "3"]` for custom width.
- Update Data Filter dropdown runtime 180px width to require `attrs.common.positioning.widthtype = [null, "3"]`, `attrs.common.positioning.width = [null, 180]`, and `attrs.common.positioning.widthu = [null, "px"]`.
- Add hard gates for non-Container width model mismatch, Data Filter runtime custom width, Container rules applied to non-Container controls, common margin/padding, common border/background/hover/shadow, and the two-color gradient boundary.
- Reinforce that the normalized product catalog remains the base source of truth and extension registry entries remain evidence-backed rather than replacements for `control-configurations.json`.
- Confirm this release does not claim pixel-perfect visual diffing or automatic screenshot parsing.

## 0.6.50

- Bump the active plugin version after Data Filter row hierarchy and Navigator label fidelity gates.
- Require the filter/action parent row to be full width.
- Require inline left filter groups and inline right action groups.
- Require filter wrapper containers to stay inline/default-height and not own fixed filter width.
- Require Data Filter controls to own fixed/custom 180px width.
- Reject legacy Status/Event Type wrapper width behavior under the 180px extension pattern.
- Add semantic `nv_label` guidance for Yeeflow designer Navigator-visible control names.
- Distinguish `id`, `label`, `name`, and `nv_label` for generated controls.
- Add decoded Resource attr validation so normalized specs cannot hide package-level mismatches.
- Keep the normalized control registry as source of truth and the extension registry evidence-backed.
- Confirm this release does not claim pixel-perfect visual diffing or automatic screenshot parsing.

## 0.6.44

- Bump the active plugin version after Yeeflow application layout design standards.
- Add `docs/standards/yeeflow-application-layout-design-rules.md` for generated Yeeflow UI design images.
- Add `scripts/inspect-application-layout-design-rules.mjs` and `scripts/test-application-layout-design-rules.mjs` for application-layout compliance validation and regression coverage.
- Treat PNG/JPEG screenshots as the primary visual source for application layout rules; treat YAPK exports as supporting structural references only.
- Require generated page design images to use one consistent official layout across the same app: `application-layout-1-vertical-nav`, `application-layout-2-horizontal-nav`, `application-layout-3-header-nav`, or `application-layout-4-no-nav`.
- Require header/nav/content safe-area rules, page title/action placement, dropdown or expanded menu behavior, and forbidden chrome patterns in design-image specs or UI contracts.
- Support JSON and Markdown contracts and accept equivalent structured fields; a literal `visualLayoutMatrix` field is not required when header/nav/content/page-title/dropdown/forbidden-pattern rules are clearly present.
- Reject arbitrary SaaS shells, unsupported sidebars, unsupported top bars, floating navs, and unsupported navigation chrome.
- Keep screenshot-derived rules human-reviewed or review-required unless a real parser exists; do not claim pixel-perfect verification or automated screenshot understanding.
- Confirm no raw YAPK files, screenshots, raw decoded package payloads, raw `Resource`, raw `Sign`, tenant URLs, workspace IDs, secrets, or private values are committed.

## 0.6.43

- Bump the active plugin version after Phase 3B UI workflow enforcement.
- Add `scripts/inspect-ui-closed-loop-workflow-enforcement.mjs` to validate workflow/report metadata only; it does not parse or mutate real YAPK packages, call Yeeflow APIs, generate packages, sign, install, import, upgrade, or create runtime evidence.
- Connect Phase 1, Phase 2, and Phase 3A gates at workflow/report level.
- Enforce required artifacts for high-quality UI/design-fidelity/runtime-quality/dynamic-KPI claims: UI contract, UI contract validation result, scope manifest for upgrade work, scope validation result, runtime evidence, runtime evidence validation result, design/runtime structure comparison findings, before/after KPI mutation evidence when dynamic KPI proof is claimed, and final report artifact paths.
- Reinforce that install/upgrade success is not visual proof, structure comparison is not dynamic KPI proof, and dynamic KPI proof requires before/after mutation evidence.
- Document standard artifact paths: `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.md`, `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.json`, `docs/ui-upgrade-scopes/<app-or-package>/<page>.scope.json`, `dist/runtime-evidence/<app-or-package>/<page>.runtime-evidence.redacted.json`, `dist/runtime-evidence/<app-or-package>/<page>.design-runtime-structure.findings.json`, and `dist/runtime-evidence/<app-or-package>/<page>.closed-loop-workflow.findings.json`.
- Note that Phase 3B closes the planned UI-quality track; future work is normal incremental improvement unless a new runtime issue class is discovered.

## 0.6.42

- Bump the active plugin version after Phase 3A UI closed-loop hard gates.
- Make the closed-loop workflow mandatory for high-quality UI, design/mockup, dashboard redesign, runtime-proof, Marketing Event-style, and one-page-at-a-time work.
- Require UI contract generation, UI contract validation, scope manifest, scope validation, local UI/package hard gates, write confirmation before signing/install/upgrade, redacted runtime evidence, design/runtime structure comparison, and iteration on exact failing controls.
- Reinforce that package validation, signing, install, upgrade-check, and upgrade-apply success are not visual proof.
- Reinforce that dynamic KPI proof requires before/after mutation evidence.
- Add Marketing Event-inspired synthetic regressions for missing design contract, missing runtime evidence, one-page scope drift, Summary layout-resource ReportIds/exts/tempVars, top-level Pages[].ReportIds optional-only boundary, Summary save_var.name and COUNT ListDataID, grid-table detail-link/template/column failures, fake upgrade success evidence, missing table section, plain scaffold/placeholder detection, warning vs --strict, and dynamic KPI proof boundary.
- Keep Phase 3B/future work as deeper workflow enforcement around Phase 2 findings, broader synthetic Marketing Event regression expansion, and live runtime automation only after explicit authorization.

## 0.6.41

- Bump the active plugin version after Phase 2 design-to-runtime structural comparison.
- Add `scripts/compare-design-to-runtime-structure.mjs` to compare UI contract expectations against redacted runtime evidence and emit structured JSON/Markdown findings.
- Accept Phase 1 evidence from `scripts/capture-runtime-ui-evidence.mjs` and keep design images as review-required references unless a reliable image parser exists.
- Report structural findings for page/section mismatch, KPI count/label/value mismatch, table section/header/column mismatch, missing filters/actions, missing or weak badges, weak card/spacing/scaffold signals, placeholder/raw-variable text, weak runtime evidence, design image review requirements, and dynamic KPI proof boundaries.
- Keep the proof boundary explicit: this release does not claim pixel-perfect visual diffing, full automatic image understanding, or dynamic KPI proof.
- Keep dynamic KPI proof governed by the existing before/after mutation evidence rules.
- Define comparison exit behavior: warning status exits 0, fail status exits nonzero, and `--strict` makes warnings exit nonzero.
- Keep Phase 3 as deeper hard-gate integration, stronger workflow enforcement around Phase 2 findings, and expanded Marketing Event regression coverage.

## 0.6.40

- Bump the active plugin version after Phase 1 of the high-quality UI closed-loop infrastructure.
- Add `scripts/generate-ui-contract-from-design.mjs` for design/mockup-to-contract scaffolding with human-review-required boundaries when no reliable vision parser is available.
- Add `scripts/capture-runtime-ui-evidence.mjs` for redacted runtime UI evidence capture compatible with the existing runtime/KPI inspectors.
- Add `scripts/validate-ui-upgrade-scope.mjs` for page/scope validation that blocks unrelated ListSetID, app identity, page/resource, list/field, form, workflow, navigation, and numeric ID drift during UI upgrades.
- Strengthen the workflow from agent discipline to contract -> scope gate -> runtime evidence, while keeping redaction-safe evidence boundaries explicit.
- Keep Phase 2 as visual structure comparison and Phase 3 as deeper hard-gate integration plus Marketing Event regression expansion.
- Do not claim pixel-perfect visual diffing or full automatic image understanding in this release.

## 0.6.39

- Bump the active plugin version after the Summary layout-resource `ReportIds` contract fix.
- Treat dashboard layout-resource `Resource.ReportIds` as the authoritative Summary registration location; top-level `Pages[].ReportIds` is optional compatibility metadata.
- Stop failing Summary validation when top-level `Pages[].ReportIds` is empty or missing, while still failing missing layout-resource `ReportIds`, matching `Resource.exts`, matching `Resource.tempVars`, Summary field/list metadata, or raw temp-variable visible text.
- Keep dynamic KPI proof scoped to the exact UUID Summary shape plus before/after mutation evidence; validator success alone is not runtime dynamic KPI proof.
- Confirm the proven UUID KPI proof package passes, Marketing Event v1.0.17 passes with static-compatibility warnings only, Marketing Event v1.0.18 passes, and Data Analytics identity and Summary contract validators agree on layout-resource registration.

## 0.6.38

- Bump the active plugin version after the Data Analytics Summary validator fix.
- Fix false positives in `inspect-data-analytics-control-identity.mjs` for valid Summary analytics controls: `attrs.save_var.name` is validated as a temp variable expression name against `Resource.tempVars[]`, not as a source-list field.
- Accept Summary `COUNT` aggregate `ListDataID` as a valid count aggregate shape and accept resource-level `ReportIds[]` registration for exported Summary resources.
- Collect Summary field references only from explicit Summary field, value, and filter locations while keeping non-Summary analytics field validation strict.
- Keep existing analytics guardrails active for missing `exts`, missing `ReportIds`, missing temp variables, placeholder/invented fields, runtime-proof claims without evidence, and upgrade ID drift.
- Confirm the proven UUID KPI proof package and the Marketing Event v1.0.18 unsigned package pass Data Analytics identity validation.

## 0.6.37

- Promote KPI Runtime Binding Proof v1.0.1 into UI/Summary/KPI standards, skills, validators, and synthetic tests.
- Treat dynamic visible KPI binding as proven only for the exact UUID Summary v1.0.1 shape: UUID Summary IDs, matching `Resource.ReportIds[]`, matching `Resource.exts[]`, dashboard `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible `attrs.headc.title.variable[]`, complete Summary field metadata, and no static/fallback proof values.
- Require before/after source data mutation evidence, expected-value notes, inspector output, and refreshed/recalculated runtime evidence before claiming dynamic KPI proof; Summary recalculation can be asynchronous or cache-delayed.
- Keep semantic/non-UUID Summary IDs, approval forms, public forms, unsupported surfaces, and other visible binding shapes unproven unless focused runtime proof exists. Fallback KPI values must remain explicitly labeled fallback.
- Add Data Analytics control identity hard-gate coverage for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Analytics controls require UUID/runtime-safe IDs by default, required registration/`Resource.exts[]` matching when applicable, designer-shaped settings/data fields, runtime evidence for runtime claims, and existing analytics ID preservation during upgrades.

## 0.6.36

- Bump the active plugin version after the UI runtime evidence developer-experience helpers merge.
- Add the synthetic/redacted `docs/examples/runtime-evidence.redacted.example.json` template for UI/KPI runtime proof reports.
- Add `scripts/test-ui-hard-gates-all.mjs` to run the related UI hard-gate tests together, including UI contract, style shape, Summary/KPI, visible KPI runtime binding, runtime evidence, grid/table quality, and skill wording checks.
- Document that the runtime evidence template is shaped for `scripts/inspect-runtime-evidence.mjs` and `scripts/inspect-visible-kpi-runtime-bindings.mjs`.
- Keep dynamic visible KPI binding unresolved unless runtime-proven; future promotion requires a dedicated golden runtime package/evidence fixture.
- Keep UI/Summary/KPI hard-gate behavior unchanged.

## 0.6.35

- Bump the active plugin version after the UI hard-gate skill test layout compatibility fix.
- Make `scripts/test-ui-generation-hard-gate-skills.mjs` support both the source layout path `skills/installed/yeeflow-ui-generation-hard-gates/SKILL.md` and the installed plugin cache layout path `skills/yeeflow-ui-generation-hard-gates/SKILL.md`.
- Report which UI hard-gate skill path is used and fail only when neither supported path exists.
- Keep UI/Summary/KPI hard-gate behavior unchanged; fully dynamic visible KPI binding remains unresolved unless runtime-proven.

## 0.6.34

- Bump the active plugin version after the UI/Summary/KPI runtime hard gates and UI generation hard-gate skill routing merge.
- Require high-quality UI claims to start from a page-by-page UI implementation contract; scaffold-like UI must not be claimed as high-quality UI.
- Require uncertain UI/runtime patterns to be proven on a sandbox page first and require/prefer export-proven Yeeflow control/style shapes.
- Add Summary/KPI hard gates for designer-shaped hidden Summary configuration, real field and filter bindings, temp variables, `save_var` expression objects, and page `ReportIds`.
- Keep visible KPI dynamic binding unresolved unless runtime-proven; fallback KPI values must be explicitly labeled fallback.
- Require runtime screenshot/evidence before claiming UI quality, and keep install/signing/API acceptance separate from runtime UI proof.
- Add grid/table quality, YAPK upgrade app identity/ListSetID stability, existing ID, lineage, and declared change-scope gates.
- Add safe tolerant Brotli diagnostics for official designer exports without exposing package payload content.
- Add the reusable `yeeflow-ui-generation-hard-gates` skill and route relevant generation, dashboard, package, runtime, and learning skills through it.

## 0.6.33

- Bump the active plugin version after the workflow assignment job-position guardrails merge.
- Require every workflow Assignment Task to have an explicit assignee strategy and proof boundary in the app plan and generated application report.
- Validate manager-based assignees only for supported expression-editor patterns: line manager, department manager, and location manager.
- Require job-position assignees to use discovered existing, user-selected existing, or admin-created-after-confirmation proof metadata; the plugin must not invent job-position IDs or names.
- Map `positions.list` as read-only `GET /positions` and `positions.users.list` as read-only `GET /positions/{id}/users` for discovery/lookup only.
- Keep job-position create, update, assign, and remove operations classified as writes that require explicit confirmation and confirmed system-admin permission; no current-user/system-admin permission API is claimed unless mapped.
- Block missing job positions unless admin status is separately confirmed and explicit write confirmation is provided, otherwise ask for system-admin creation or an existing job position/fallback.
- Fail generated-final validation on empty assignees, placeholder assignees, invented job-position references, malformed manager expressions, missing job-position proof, and unconfirmed job-position creation paths before signing, install, upgrade, or handoff.
- State that runtime/browser workflow verification with a safe request is still required to prove actual assignment routing.

## 0.6.32

- Bump the active plugin version after the universal login UX and YAPK upgrade ID stability hard-gate merge.
- Apply universal login UX to every Yeeflow API operation: unauthenticated calls return `auth_required` / `login_flow_required`, preserve the original operation or capability, and direct normal users to the plugin login flow.
- Keep local Node OAuth commands, Codex cache paths, API keys, and `.env.local` guidance out of normal user-facing recovery; CLI OAuth scripts remain developer/local diagnostics only.
- Require YAPK upgrade/new-version workflows to prove previous package/manifest continuity before signing, upgrade-check, upgrade, install-like writes, or handoff.
- Preserve IDs for existing semantic resources, assign new API-issued IDs only to newly added resources, forbid removed-ID reuse, and fail closed on missing or ambiguous lineage.
- Treat replacing all IDs in an upgrade as a hard failure, and keep signing/install/upgrade acceptance separate from ID-continuity proof and browser runtime proof.

## 0.6.31

- Add package workspace selection hard gate: package install/import/upgrade ignore local `YEEFLOW_WORKSPACE_ID`, stop with `workspace_selection_required` before request shaping when no API-discovered `flowcraft` workspace is explicitly selected, and keep signing/API acceptance separate from runtime/browser proof.
- Add application access-link reporting for successful install/import only when the safe OAuth/session tenant URL and install/import `ListSetID` are both resolved; links use `<tenant-url>/#/list-set/41/<listset-id>` and are never guessed from `.env.local`.
- Add signing helper regression coverage so scripts do not import helpers from hardcoded versioned Codex cache paths.

## 0.6.30

- Bump the active plugin version after the local environment cleanup and workspace discovery learning merge.
- Treat OAuth as the normal workspace discovery path, document `settings` and `flowcraft` as the current workspace categories, and use `flowcraft` for app/package workspace selection.
- Add combined workspace discovery with safe redacted summaries, including the `Shared Workspace` fallback for blank-title `Status: 1` default workspaces.
- Remove normal `.env.local` setup requirements for API base, API key, tenant URL, tenant ID, and workspace ID; package writes must use explicit or selected workspace confirmation.
- Require package writes to use an explicit or selected workspace and stop rather than guessing; workspace/package writes remain confirmation-gated.

## 0.6.29

- Bump the active plugin version after the workspace API capability/discovery merge.
- Add workspace API capability metadata for read-only `workspaces.listByCategory` (`GET /workspaces/{category}`) and `workspaces.get` (`GET /workspaces/{category}/{id}`).
- Add write-classified workspace capabilities for add/edit/delete/sort while keeping them out of automatic execution; workspace delete is destructive and requires strong confirmation.
- Add read-only workspace discovery for workspace selection with redacted workspace summaries.
- Make `.env.local` empty/absent for normal OAuth plus workspace discovery and keep package workspace targeting explicit.
- Require package import/install/upgrade helpers to resolve and confirm an explicit target workspace and stop rather than guessing when no target is selected.
- Keep `YEEFLOW_API_KEY` as a legacy/deprecated fallback only.

## 0.6.28

- Bump the active plugin version after the dashboard grid-table Collection hard-gate merge and latest `main` install/cache smoke.
- Add the Dashboard Grid-Table Collection Pattern Gate for generated-final `.yapk` dashboard record-list sections.
- Require dashboard grid-table sections to use `collection`, not dashboard `data-list`, unless Data table is explicitly requested.
- Require header `flex_grid` and Collection in one wrapper with both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`.
- Require row-click details to use Collection link metadata and concrete Type `1` custom detail layouts.
- Validate dashboard header hiding, title/text styling, helper metadata leakage prevention, and Type `1` custom detail layout `LayoutView` values.
- Keep signing/install/schema acceptance separate from dashboard runtime/designer fidelity proof.

## 0.6.27

- Bump the active plugin version after the generated-final YAPK hard-gates merge.
- Require generated-final `.yapk` packages to use API-issued content ID provenance from `GET /utils/generate/ids?count=<n>`, emit and validate an ID provenance manifest, and forbid local sequential, hardcoded, copied, random, timestamp, or UUID fallback IDs.
- Require complete navigation runtime metadata for generated-final `.yapk` packages: navigation groups include `ID`, `AppID`, `ListSetID`, `Type`, `Title`, `Icon`, and `list`; child items include `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`; `children` / `Childs` runtime groups are forbidden.
- Keep signing/install acceptance separate from ID provenance, navigation runtime metadata completeness, and runtime UI proof.

## 0.6.26

- Confirm Yeeflow OAuth supports Authorization Code with PKCE S256 for login and refresh without a client secret.
- Remove the normal local `YEEFLOW_OAUTH_CLIENT_SECRET` requirement from OAuth/API environment documentation.
- Derive tenant/user context from OAuth access token claims `tenantid`, `tenant`, and `accountid`.
- Make `YEEFLOW_TENANT_URL` an optional manual override only for tenant UI/browser links before token context is available.
- Earlier OAuth docs reduced the recommended `.env.local` footprint and kept API-key mode legacy/deprecated; current guidance no longer requires `.env.local` for normal OAuth plus workspace discovery.

## 0.6.25

- Bump the active plugin version after the PKCE OAuth support merge.
- Add initial PKCE OAuth support for login and refresh helpers.
- Keep any legacy confidential-client fallback local-only when configured for emergency compatibility.

## 0.6.24

- Bump the active plugin version after the OAuth environment defaults merge.
- Document plugin-provided fixed API/OAuth defaults and the reduced `.env.local` model.
- Keep OAuth as the preferred API auth path, preserve legacy/deprecated API-key fallback, and keep client secrets local-only.

## 0.6.23

- Add the standard Yeeflow application plan template and generation contract.
- Make `Generation Contract and Hard Gates` mandatory for app generation planning.
- Add YAPK signing, approval-form completeness, runtime navigation shape, plan-to-package conformance, proof-boundary, and lightweight-plan minimum guardrails.

## 0.6.22

- Restore safe development assets from the legacy Yeeflow Codex Plugins repo.
- Preserve clean marketplace/plugin identity.
- Keep OAuth, REST API capability map, guarded read-only helper, and write-blocking behavior.

## 2026-06-11

- Restored safe development assets from the legacy `Yeeflow/yeeflow-codex-plugins` repository into the clean App Builder Codex Plugin repository.
- Preserved the new `yeeflow` / `yeeflow-app-builder` identity and `dist/yeeflow-app-builder-plugin` active dist path while excluding old release ZIPs, raw/generated package payloads, local OAuth files, and private environment material.
- Added legacy release notes under `docs/legacy/yeeflow-codex-plugins/` as historical reference only.

## 2026-06-11

- Prepared Yeeflow App Builder Plugin v0.6.21-api-map.0 with a dependency-free Yeeflow REST API capability map for documented endpoints, read-only/write classification, parameter metadata, confirmation requirements, and safe list/call helper scripts.
- Added capability-map tests and documentation so Codex checks documented API coverage before live Yeeflow API work, prefers read-only inspection, blocks raw arbitrary paths, and keeps package install/import/upgrade behind explicit confirmation.
- Preserved Browser OAuth authentication from v0.6.20-oauth.0, legacy API-key fallback, proof-boundary language, and repository safety rules without moving `stable`, creating release tags, or publishing release artifacts.

## 2026-06-11

- Prepared Yeeflow App Builder Plugin v0.6.20-oauth.0 with dependency-free browser OAuth login helpers, PKCE/state validation, local HTTPS callback support, secure local token storage, refresh/logout/status commands, and OAuth-aware Yeeflow API authentication wrappers.
- Preserved legacy API-key mode as fallback while preferring OAuth tokens for live API calls, with redacted command output and no OAuth secrets or tokens in tracked files.
- Documented local HTTPS certificate requirements, OAuth `.env.local` setup, and read-only API auth smoke behavior without moving `stable`, creating release tags, or publishing release artifacts.

## 2026-06-10

- Prepared Yeeflow App Builder Plugin v0.6.19 release candidate by porting the validated Research v0.6.19 runtime-binding lessons hardening release into the official plugin from the v0.6.18 stable base.
- Added reusable dashboard Summary/ext/ReportIds binding validation, dashboard filter consumption checks, approval real-control validation, navigation reachability checks, requester-context getUserAttr token-wrapper validation, app group ID guardrails, service portal payload gating, signing/API proof-boundary checks, and policy-as-data guidance.
- Updated official docs/skills, dist mirrors, and the official v0.6.19 release archive workflow while preserving the v0.6.18 YAPK schema refresh, v0.6.17 Datetime migration, v0.6.16 plan-conformance, and v0.6.14/v0.6.15 schema/workflow guardrails.

## 2026-06-10

- Prepared Yeeflow App Builder Plugin v0.6.18 release candidate by porting the validated Research v0.6.18 YAPK-only schema refresh into the official plugin from the v0.6.17 stable base.
- Replaced only the official canonical YAPK schema, preserving the v0.6.17 YAP schema and Datetime migration while updating decoded `AppPackageInfo.required` to `ListSet`, `Pages`, and `Childs`.
- Updated validators, schema fixtures, docs/skills, dist mirrors, and the official v0.6.18 release archive workflow while preserving v0.6.16 plan-conformance and v0.6.14/v0.6.15 schema/workflow guardrails.

## 2026-06-10

- Prepared Yeeflow App Builder Plugin v0.6.17 release candidate by porting the validated Research v0.6.17 Datetime schema refresh into the official plugin from the v0.6.16 stable base.
- Replaced official canonical YAP/YAPK schemas with the latest product-team files, migrated generated storage FieldType rules to `Datetime`, and added legacy `DateTime` rejection coverage.
- Preserved v0.6.16 plan-conformance guardrails, v0.6.14/v0.6.15 schema/workflow guardrails, official docs/skills updates, source/dist mirrors, and the v0.6.17 official release archive workflow.

## 2026-06-10

- Prepared Yeeflow App Builder Plugin v0.6.16 release candidate by porting the validated Research v0.6.16 capability set into the official plugin from the v0.6.13 stable base.
- Added schema must-pass guardrails, latest product-team YAP/YAPK canonical schemas, stricter YAP FieldName/FieldIndex rules, stricter YAPK required metadata checks, FieldType validation, approval pageUrl/workflow validation, and Northpeak regression tests.
- Added app-plan-to-implementation conformance validation, navigation conformance guardrails, post-generation plan coverage reporting, official docs/skills updates, source/dist mirrors, and the v0.6.16 official release archive workflow.

## 2026-06-09

- Prepared Yeeflow App Builder Plugin v0.6.13 release integration for Collection card-style and Collection + Grid table-style golden references.
- Replaced canonical YAP/YAPK schemas with product-team schema files while keeping Codex YAPK additions in `schemas/yapk-schema-codex.json`.
- Added schema overlay loader validation, Collection pattern guards, source/dist mirrors, and the v0.6.13 release archive workflow.

## 2026-06-07

- Prepared Yeeflow App Builder Plugin v0.6.12 with YAP approval form designer-shape hardening.
- Added generated-final checks for unique form control designer IDs, native heading/text values, designer-safe control families, child ListType, approval NoRule/status metadata, and AppGroup ReplaceIds coverage.
- Added the redacted YAP approval form designer shape study and focused regression tests.

## 2026-06-07

- Prepared Yeeflow App Builder Plugin v0.6.11 with export-shaped YAP generation hardening.
- Added the generated-final YAP contract, export-shaped generation standard, sanitized reference shape, proof-boundary report validation, and focused regression coverage.
- Hardened YAP generated-final validators for ID shape, ReplaceIds final coverage, metadata completeness, decoded runtime-critical strings, and API queued proof language.

## 2026-06-05

- Prepared Yeeflow App Builder Plugin v0.6.10 with an additive YAPK schema merge.
- Added group and metadata required-field constraints while preserving the FormNewReports current-report standard and optional legacy FormReports compatibility.
- Added source and dist regression coverage for the schema merge.

## 2026-05-13

- Initialized Yeeflow AI Builder repository baseline.
- Added repository safety rules for raw exports, generated packages, downloaded files, and secrets.
- Added documentation placeholders for generated outputs, sanitized examples, and skill tracking.
