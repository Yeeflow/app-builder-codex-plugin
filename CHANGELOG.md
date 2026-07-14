# Changelog

## Unreleased

## 0.9.68

- Add export-backed Form Action Print Page and Barcode Scan planning, shared materialization, package validation, and signing-readiness gates across supported page hosts.
- Add the `dashboard-print-multi-record-table-v1` golden layout for multi-record Dashboard printing with Collection-backed Table composition, merged cells, dynamic controls, and current-item QR codes.
- Support Text field barcode/QR scanning through canonical `Rules.allowScan`, plus Auto and EAN-13 scan modes, multiple/select/automatic scanning, result/error variables, and scan-result Collection filters.
- Keep unlearned Data List item, Document Library item, Approval Submission, and Approval Print Page print targets fail-closed until exact export-backed contracts are available.

## 0.9.67

- Add Public Form Form Action golden references, planning, materialization, and package validation for the eight product-supported step types while keeping unproven serialization fail-closed.
- Restrict anonymous Set variables and Redirect expressions to current-list fields, same-form temp variables, and fixed values; reject Query Data, Set Data List, Open Resource, Invoke Service, and other application-resource steps.
- Ignore App Plan template placeholder rows and instructional scaffolding during action intent extraction while retaining missing-table hard gates for real business requirements.
- Make the plugin metadata inspector cache-root aware so isolated installed-cache smoke does not require source-checkout marketplace files.

## 0.9.66

- Add `GET /workspaces/{category}/{id}/applications` to the capability map and provide an OAuth-backed helper that returns application counts, titles, safe metadata, and redacted application ID previews only.
- Add a dedicated dry-run-first `DELETE /applications/{id}` helper with workspace-scoped readback, exact application ID/title matching, `appID` 30/41 validation, and exact strong confirmation before execution.
- Add source/dist contract, redaction, input-gate, write-blocking, OAuth live-smoke, and application identity regression coverage without executing a destructive delete during release validation.

## 0.9.65

- Normalize Data List and Approval Form choice enums through one shared parser, including ASCII and Chinese delimiters, line breaks, JSON arrays, and structured arrays.
- Remove planning annotations such as `Planning Default` / `规划默认` from runtime option labels and preserve every explicit business option without silent 8/12-option truncation.
- Keep `Rules.choices[]` and `Rules.color_choices[]` synchronized and block merged values, planning annotations, duplicate values, missing color choices, and value/order drift before signing readiness.

## 0.9.64

- Add V1.7 export-backed Form Action Open Item Form, Open Approval Form, and Open Dashboard golden references across Approval Submission/Task, Data List/Document Library custom forms, and Dashboard.
- Materialize `listitem`, `openform`, and `opendashboard` through one shared App Plan contract and builder, including current/selected item targeting, optional target-owned custom forms, defaults, query parameters, returned item IDs, and shared open-mode sizing.
- Block Public Form usage, unresolved targets/layouts, missing selected Item/Form IDs, submitted-form input leakage, Dashboard non-temp expressions, and invalid Slide/Pop-up/Full page/New window sizing before signing readiness.
- Harden Open Resource signing gates for selected custom-form operation purpose, parseable Item/Form ID expressions, unique named Query Parameters with valid values, and Approval Set Variables target/type compatibility.
- Record safe render-only runtime proof for Add Item, New Approval Submission, and Dashboard targets while preserving no-write boundaries for selected Edit/View and Submitted Form variants that require disposable runtime IDs.

## 0.9.63

- Add export-backed Form Action Set Data List golden references for Approval submission/task forms, Data List and Document Library custom forms, and Dashboard pages, covering conditional add/update/delete, current-record updates, execution results, and trigger bindings.
- Materialize planned Set Data List steps through one shared builder and validate host, operation, target, mappings, filters, execution conditions, continue behavior, status/item-ID outputs, and bound controls before signing readiness.
- Enforce Document Library Add contracts: `_Path` is Type 16-only, Upload File (`Text4`) is required, and Form Actions accept one selected file while multi-file/List/Sub List writes remain Workflow + Loop responsibilities.
- Add source/dist planning, materialization, package, and cache regressions with 61 focused cases, including Approval Task Form parity and Document Library current-record updates.

## 0.9.62

- Scope Approval Form layout-template validation to Approval workflow envelopes (`WorkflowType = 2`) while skipping Data List and Scheduled workflow envelopes serialized in the shared `Forms[]` collection.
- Preserve strict submission-page validation for Approval forms and legacy type-missing Approval exports.
- Add mixed-envelope regression coverage proving one Approval form can coexist with Data List and Scheduled workflows without false `APPROVAL_FORM_LAYOUT_SUBMISSION_PAGE_COUNT_INVALID` signing blockers.

## 0.9.61

- Add export-backed Workflow Set Data List golden references for Approval, Data List, and Scheduled workflows, covering current-record updates plus add, update, and delete operations against Data Lists and Document Libraries.
- Enforce numeric-field Value, Increase, Decrease, Multiply, and Divide semantics; Document Library Upload File, unique Name, and folder Path contracts; and loop-backed multi-file writes before signing readiness.
- Support direct bulk writes from Approval/Scheduled List variables and Data List Sub List fields through canonical `_list.<field>` mappings, preserving a parent-record association mapping and blocking source-kind, child-field, or operation mismatches.

## 0.9.60

- Make Approval Form control materialization schema-authoritative so Text variables whose names contain `Status`, `Category`, `Type`, or `Priority` cannot silently become Radio/Select controls.
- Recursively remap or remove source-template `__ctx_coll` bindings after Dashboard Collection cloning and preserve target-schema-safe Grid/progress contracts.
- Close namespaced Delete/multiselect temp-variable dependencies, remove unplanned Workbench KPI residue, and require full page-scope dependency closure before signing readiness.

## 0.9.59

- Align upgrade-scope Approval validation with generated-export validation so only `MultiAssignmentTask` / `CandidateTask` require assignee and task-page metadata; `SetVariableTask` remains a system action.
- Resolve human-task Approved/Rejected routes through referenced SequenceFlows and recognize nested UUID-ID `Main > Content` Approval page shells through semantic labels.
- Regenerate missing or numeric focused-upgrade wrapper PackageId metadata as UUID and clear stale signatures while preserving decoded application identity through ID-lineage validation.

## 0.9.58

- Classify Approval workflow human tasks by exact stencil so `SetVariableTask` no longer receives false assignee or task-page requirements while real `MultiAssignmentTask` / `CandidateTask` nodes remain protected.
- Normalize Form Action Set Variable Host Type aliases across App Plan validation and shared Approval/Data List/Dashboard materialization; unsupported or contradictory host values now fail instead of silently dropping planned actions.
- Add focused-upgrade scope materialization that omits only byte-equivalent installed Form reports and matching navigation payload items, clears stale signatures, and preserves changed reports for scope rejection.
- Add source/dist regressions and real-candidate preflight proof while keeping Workflow SetVariableTask execution as a separate runtime-proof boundary.

## 0.9.57

- Add export-backed Set Variable golden references across Dashboard, Approval Form, Data List Form, Approval Workflow, Data List Workflow, and Scheduled Workflow surfaces.
- Materialize App Plan Form Action Set Variable steps through one shared Approval/Data List/Dashboard builder, including page-load, field-change, click, multi-assignment, conditions, continue behavior, temp-variable declarations, and Start another action chains.
- Enforce Approval Dynamic Display self-reference and declaration rules, exact workflow-variable assignment metadata, and the Data List Workflow boundary requiring Set Data List with Current list for current-record field writes.
- Add source/dist planning, generated-final, and full-materializer regressions while preserving explicit WorkflowType 1/3 full-resource materialization blockers.

## 0.9.56

- Correct the Approval workflow `graphposition` contract using fresh-tab runtime proof: derive origin from content minima plus `90px/45px`, preserve content-span dimensions, and reject both legacy negative origins and the obsolete viewport-translation formula across full-app and standalone `.ywf` generation.
- Normalize Dashboard template temp variables into complete, scoped `id/name/type/idx` declarations, remove unused template residue, and reject name-only or undeclared temp-variable references before standalone `.ydp` or packaged handoff.

## 0.9.55

- Normalize Approval workflow initial Designer viewport translations so generated nodes open inside the visible canvas, and reject entirely offscreen transformed node extents before signing.
- Generalize installed `FormNewReports[]` omission from Dashboard-only upgrades to every non-Report upgrade, including Approval upgrades; allow only matching report-navigation payload cleanup and reject unchanged installed Form reports carried as duplicate-create candidates.

## 0.9.54

- Materialize non-empty business column titles on every Approval and Data List Sub List row control, preserving custom titles and blocking missing labels before signing.
- Add export-backed Sub List Summary generation for Approval workflow variables, Approval temporary variables, Data List fields, and Data List temporary variables with numeric-source and binding validation.
- Reuse the built-in Approval `requestTitle` variable instead of creating canonically duplicate `Request Title` declarations, and enforce literal/canonical variable ID and `idx` uniqueness across Approval variable collections.
- Enforce one canonical variable namespace across Data List custom-form and Dashboard `filterVars[]` / `tempVars[]`, with source/dist incident regressions and cache-artifact coverage.

## 0.9.53

- Normalize Approval workflow graph references to canonical matching `id` and lowercase `resourceid` across full-app materialization and standalone `.ywf` wrapper generation.
- Reject malformed SequenceFlow source, target, incoming, and outgoing identities or endpoint mismatches before signing and publish-readiness claims.
- Add a sanitized regression fixture from the Audit Stage Gate Designer incident where `source.resourceId` incorrectly substituted for a missing `source.id`.
- Add source/dist and cache-artifact coverage for the shared graph-reference helper, standalone wrapper normalization, and focused Designer editability standards.

## 0.9.52

- Normalize planning-only no-resource labels before ID allocation and full-app materialization, including punctuation variants such as `Not applicable.`.
- Prevent `Not applicable`, `Not planned`, `N/A`, `None`, and explicit no-resource decisions from becoming Pages, reports, workflows, child resources, or navigation identities.
- Add `validate-planning-placeholder-materialization.mjs` to first-generation YAPK preflight with the signing-blocking `PLANNING_PLACEHOLDER_MATERIALIZED_AS_RESOURCE` finding.
- Add source/dist regressions based on the Query Data Runtime Baseline 0.9.51 incident while preserving legitimate names such as `Not Applicable Cases`.

## 0.9.51

- Add export-proven Workflow Query Data modes for Approval, Data List, and Scheduled workflows, including count-only, single-variable, List/Complex Type, and text-result contracts.
- Add Data List (`1`), Document Library (`16`), and Form Report (`32`) Query Data source contracts for Workflow nodes and supported Form Action hosts while keeping Data Report focused-learning-required.
- Add export-backed Data List Workflow current-record count/upsert patterns and all three Loop modes: List/Sub List, multiple values, and fixed times.
- Enforce positive Page Number, Page Size `1..1000`, and a maximum of two sort fields across Workflow and Form Action Query Data planning, builders, and validators.
- Accept the Form Report not-empty filter export shape `op = "7"` with `right = null`, while retaining current-user membership `op = "11"` compatibility.
- Add shared App Plan tables and Generation Readiness gates for Workflow Query Data and Loop decisions, including complete count-branch coverage and repeated-side-effect proof boundaries.
- Fail closed when planned Data List or Scheduled Workflow hosts cannot yet be fully materialized instead of silently omitting WorkflowType `1` or `3` resources.

## 0.9.50

- Add a business-capability decision layer before Form Action Query Data mode selection, preferring direct Collection/Data Table binding for read-only multi-row regions and reserving Query-to-Sub-list for editable working copies.
- Reject ambiguous result targets, unconsumed temp JSON/temp collections, Query Data temp payloads planned as Collection/Data Table sources, and ambiguous Lookup display values used as target record identifiers.
- Require every temp collection/JSON plan to name a supported result consumer such as `JSONStringfy`, a calculation, or an explicitly justified Custom Code renderer.
- Make Generation Readiness automatically run the Query Data plan validator and fail when Form Action Query Data intent lacks the standard planning table.
- Add `Result Consumer / Use` to the App Plan template and source/dist regressions based on the Campaign/Event and Customer Service Dashboard planning failures.

## 0.9.49

- Add export-proven Form Action Query Data golden references for Approval submission/task forms, Data List and Document Library custom forms, and Dashboard pages.
- Share single/multiple-result mapping, selected-field output, result-count assignment, chained Query Data, and pagination contracts across supported hosts while preserving host-specific variable boundaries.
- Enforce `querydata_pageindex >= 1` and `1 <= querydata_pagesize <= 1000`, with defaults of page 1 and 100 rows, across planning, generation, standalone/package validation, and first-generation preflight.
- Support Dashboard temp JSON result variables, `JSONStringfy` display conversion, and Custom Code rendering boundaries while blocking Collection/Data Table controls from directly consuming temp JSON results.
- Treat Document Library custom forms like Data List custom forms for Form Action Query Data, and reject Public Form, Form Report, and Data Report as independent Form Action hosts.
- Add source/dist golden-reference, App Plan, host-matrix, generated-final, and cache-root regression coverage for the v1.1-v1.4 exported reference applications.

## 0.9.48

- Generate positive-area Workflow Designer `bounds` for every non-SequenceFlow Approval workflow node and derive `graphposition` from complete node rectangles, so rendered workflows remain selectable, editable, extensible, and publish-ready.
- Share the Designer-shape builder across standalone `.ywf` and full `.yapk` materialization, and centralize validator entrypoints on the canonical YWF validator.
- Declare QueryData result/count workflow variables with compatible types and reject missing result fields before signing readiness.
- Require ContentList add/edit mappings, edit/remove target-record criteria, and operation semantics that match business action names such as Update/Edit.
- Add source/dist incident regressions for missing bounds, bounds-position drift, incomplete graph extents, malformed assignees, undeclared query outputs, and empty/mismatched ContentList actions.

## 0.9.47

- Generate workflow assignee Expression Buttons with canonical Yeeflow `${ key:value... }` variable JSON instead of invalid `${{...}}` ordinary-JSON wrapping.
- Preserve nested `${...}` Applicant, Department Manager, and workflow user-variable manager references in `usertaskassignment[]` across standalone YWF and full YAPK materialization.
- Add recursive assignee-expression parsing and hard gates for invalid outer shape, unparseable buttons, missing/invalid nested expressions, title/value drift, and unresolved workflow variables.
- Add real-export canonical golden reference text plus source/dist Assignment Task, Approval YWF, and publish-readiness regressions for the Legal Triage failure class.

## 0.9.46

- Preserve the `collection_control_grid_table_with_multiselect` Golden Reference leading-column geometry after schema-driven field pruning.
- Keep the dedicated selection-only header/item cells fixed at `46px`, the following primary title cells at `2fr`, and remaining business columns at `1fr`.
- Add `DASH_DATASET_GRID_MULTISELECT_SELECTION_COLUMN_CONTRACT_INVALID` and source-template parity validation so matching-but-wrong `2fr` checkbox columns fail before signing readiness.
- Add source/dist full-app materialization regression coverage based on the Legal Intake Workbench Triage Queue shape.

## 0.9.45

- Prune unconfigured Public Form CTA areas, empty copied 2/3/60-40 column sections, and placeholder Operations after golden-template business mapping.
- Require retained `section_title_header` text to be business-specific and remove `section_title_area` when neither a meaningful header nor configured Operations is needed.
- Add generated-output hard gates for all five optional-region residue shapes while preserving the complete unpruned golden reference for template-authoring validation.
- Enforce the same cleanup and validator contract for standalone `.ydl` and full `.yap`/`.yapk` generation.
- Add source/dist regressions based on the BPE survey residue shape and verify the previous output is rejected before handoff.

## 0.9.44

- Release runtime-proven Type 16 Document Library native field metadata for `Title`, `ParentID`, `Type`, `FileSize`, `Extension`, `UniqueName`, and `Upload File`.
- Preserve export-backed field-specific status bits, Rules, system/index flags, and the `2147483648` upload size contract while keeping `Title.FieldIndex = 0` for canonical generated-package schema compatibility.
- Add `validate-document-library-native-field-runtime-metadata.mjs` as a root and skill-local first-generation preflight hard gate.
- Add a redacted normalized reference, runtime checklist, tolerant-Brotli skill entrypoint alignment, and source/dist positive/negative regression coverage.
- Confirm the user-verified repaired Internal Audit package passes while the prior runtime-failing metadata shape is blocked before signing.

## 0.9.43

- Release complete Type 1 Data List generation hardening for applications with and without Public Forms.
- Materialize planned Public Forms through the shared full-app Data List builder only after standard New/Edit/View custom forms, field grids, views, navigation, and package contracts are complete.
- Require every generated Type 1 Data List to resolve `List.LayoutView.add/edit/view` to Type 1 custom forms; Public Forms and system/support purposes do not replace this requirement.
- Add App Plan, package, Data List Form Layouts v1.1, source/dist, and first-generation preflight regressions for Public Form-only failure shapes.
- Preserve the Type 16 Document Library boundary while enforcing the complete lifecycle on all Type 1 Data Lists.

## 0.9.42

- Release native Document Library YAPK contract and root-folder materialization hardening.
- Preserve Type 16 export-compatible native fields and navigation instead of coercing Document Libraries through normal Data List rules.
- Materialize planned root folders as API-issued-ID-backed `Childs[].List.Items` folder rows with `Text1 = "folder"`, `Bigint1 = "0"`, deterministic `Text3` path keys, and no `Text4` file payload.
- Enforce folder row shape, ID provenance, and App Plan-to-generated-final completeness across source and dist validators.
- Keep nested folder creation deferred until focused runtime proof establishes its current-product contract.

## 0.9.37

- Release App Plan referenced-resource completeness hardening.
- Generated-final validation now parses App Plan Data List field tables to discover lookup target lists and fails when referenced lookup targets are not planned/materialized.
- Generated-final validation now checks Data List navigation targets from App Plan navigation sections and fails when a navigation item points to an unplanned Data List.
- Full-app materialization now fails closed with `FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED` instead of emitting empty lookup `Rules` for missing target lists.
- Add source/dist regression coverage for missing lookup target lists, missing navigation target lists, and the Internal Audit `Risk Categories` failure shape.

## 0.9.33

- Release Dashboard Pivot table placement and Workbench filter-grid hardening.
- Generated Dashboard and Data List form Pivot tables now materialize as table-like analytics inside `content_card_wrapper > section_content_area`, preferably in `1_columns_section`, instead of being placed in `chart_cards_section`.
- Keep chart-like analytics in `chart_cards_section` with the existing no-more-than-three-per-section guidance, while blocking Pivot tables with `DATA_ANALYTICS_PIVOT_CHART_SECTION_FORBIDDEN` and `DATA_ANALYTICS_PIVOT_SECTION_PLACEMENT_INVALID`.
- Strengthen Workbench global filter placement so generated filters use the official `dashboard_standard_filter_group` `flex_grid` shape with 4 desktop columns, 2 tablet columns, 1 mobile column, 16px gaps, and hidden labels.
- Normalize empty Workbench `main_work_queue_wrapper` right-side columns to a single-column grid when no right panel content is materialized.
- Add source/dist regression coverage for Pivot placement, Workbench filter group shape, and affected Dashboard/Data List form layout gates.

## 0.9.32

- Release standalone YDL import-readiness hardening.
- Standalone Data List exports now fail strict import-ready validation when `Defs[].Rules` is emitted as object-shaped JSON instead of stringified JSON.
- Block demo `ListDatas` from writing system audit fields such as `Created`, `Modified`, `CreatedBy`, or `ModifiedBy`.
- Require standalone custom forms to use import-safe `LayoutView: null` with concrete `LayoutInResources[0].Resource`, and keep the default view URL as export-safe `default`.
- Keep standalone `.ywf`, `.ydl`, and `.ydp` generation on the shared Standalone Artifact Plan -> Trace JSON -> Shared Builder -> Standalone Export -> Plan-vs-Actual Validator path.
- RC cache smoke passed from `yeeflow-app-builder-plugin-v0.9.32-rc1`: Codex installed `yeeflow-app-builder@yeeflow` version `0.9.32`, and installed-cache YDL strict import-ready, standalone export shared-generation, and Data View fixed-filter gates passed.

## 0.9.31

- Release Data List view fixed-filter hardening.
- Generated Data List views now materialize App Plan fixed filters into `LayoutView.filter[]` instead of leaving view filters empty.
- Add export-shaped fixed-filter support for `and`/`or` combinations, two-level condition groups, non-empty checks, and Schedule-style `Date >= now` expressions.
- Block unsupported `Today` function/token usage in Data View filters; generated plans should convert business `Today` intent to Yeeflow's export-proven `now` function.
- Add source/dist regression coverage using the Event Planning Data View filter scenario: `All Events`, `Schedule Overview`, `RSVP Tracker`, and `Budget and Vendors`.
- RC cache smoke passed from `yeeflow-app-builder-plugin-v0.9.31-rc1`: Codex installed `yeeflow-app-builder@yeeflow` version `0.9.31`, and installed-cache Data View fixed-filter plus standalone export shared-generation gates passed.

## 0.9.30

- Release Dashboard grid-table column track pruning hardening.
- Generated Dashboard grid-table Collections now synchronize `flex_grid.attrs.columns["1"].list` after schema-driven header/item cell pruning, so cloned six-column golden templates cannot leave blank trailing columns when only three business columns remain visible.
- Add dataset presentation hard gates for stale `grid_table_col_header` and `grid_col_item` column definitions whose desktop track count no longer matches actual cell `children.length`.
- Add source/dist regression coverage using the Doctor Operations Dashboard failure shape: header/item children pruned to 3 while grid tracks incorrectly remain at 6.
- RC cache smoke passed from `yeeflow-app-builder-plugin-v0.9.30-rc1` content installed through the local marketplace checkout: Codex installed `yeeflow-app-builder@yeeflow` version `0.9.30`, and installed-cache dashboard dataset presentation and repo hygiene gates passed.

## 0.9.29

- Release standalone YDL shared form hard gates.
- Standalone `.ydl` generator-final validation now fails simplified custom form paths that reuse one generic form for New/Edit/View, omit concrete `Edit Item` or `View Item` forms, place current-record field controls outside `form_grid_fields_wrapper`, or bypass the shared Data List Form Layouts v1.1 and Data List Form Fields Grid v1.1 builders used by full `.yapk` materialization.
- Add regression coverage using a deliberately bad standalone YDL fixture so future standalone exports cannot pass with `Main > Content > Form body`-style hand-built forms instead of golden reference templates.

## 0.9.28

- Release Workflow action naming and connector Description hardening.
- Generated Approval form, Data list workflow, and Scheduled workflow action nodes now derive concise business-specific Action names from assignee role, job position, branch purpose, and action type instead of keeping default labels such as `Assignment Task`.
- Generated SequenceFlow connectors now write non-empty concise business Descriptions in `properties.documentation`, such as `Approved`, `Rejected`, `Completed`, or short branch conditions like `Amount >= 100`.
- Add hard gates for missing/default/overlong workflow action names and missing/default/overlong connector Descriptions across YWF, YAP/YAPK package validation, and workflow-layout golden-reference tests.
- RC install smoke passed from `yeeflow-app-builder-plugin-v0.9.28-rc1`: Codex installed `yeeflow-app-builder@yeeflow` version `0.9.28`, and installed-cache workflow layout, workflow condition, approval YWF structure, workflow assignee, and standalone export gates passed.

## 0.9.27

- Release Workflow Designer local forward merge vertex-economy hardening.
- Generated Approval form, Data list workflow, and Scheduled workflow diagrams now keep nearby upper/lower-lane Completed or Approved merge connectors on rounded auto-routing with empty `vertices[]` instead of adding visual-noise bends.
- Preserve explicit `vertices[]` for true same-column vertical branch routes and long return/backward routes, matching the provided good workflow design reference instead of removing every vertex indiscriminately.
- Add `WORKFLOW_LAYOUT_LOCAL_FORWARD_VERTICES_UNNECESSARY` validation and source/dist regression coverage so the provided bad design fails exactly on the two unnecessary local merge connectors while the wrapped good design passes.
- RC install smoke passed from `yeeflow-app-builder-plugin-v0.9.27-rc1`: Codex installed `yeeflow-app-builder@yeeflow` version `0.9.27`, and installed-cache plus marketplace-payload workflow layout, workflow condition, approval YWF structure, and standalone export gates passed.

## 0.9.26

- Release explicit Workflow branch condition coverage hardening.
- Generated Approval form, Data list workflow, and Scheduled workflow fan-out branches now fail generated-final validation when business-variable equality branches do not cover all known choices and no explicit complement branch exists.
- Treat blank/unconditioned outgoing SequenceFlow branches as invalid fallbacks because Yeeflow workflow has no implicit `else` / `default` branch semantics.
- Add `WORKFLOW_BRANCH_CONDITION_COVERAGE_INCOMPLETE` and `WORKFLOW_BRANCH_UNCONDITIONAL_DEFAULT_NOT_SUPPORTED` regression coverage for option-variable fan-out cases such as `TravelType == type1`, `TravelType == type2`, and explicit `TravelType != type1 AND TravelType != type2` complements.
- RC install smoke passed from `yeeflow-app-builder-plugin-v0.9.26-rc1`: Codex installed `yeeflow-app-builder@yeeflow` version `0.9.26`, marketplace metadata resolved from the stable snapshot, and installed-cache workflow condition, approval YWF structure, workflow layout, and standalone export gates passed.

## 0.9.25

- Release Workflow Condition editor grouping and expression-right hardening.
- Support export-shaped `right.type = 2` Expression editor comparison values for workflow variable conditions while preserving direct `right.type = 0` as the default for fixed literal values.
- Add two-layer Condition editor group validation so top-level group wrappers use `left: null`, `op: "isNull"`, `right: null`, and non-empty child `conditions[]`.
- Block third-level nested groups, empty groups, and group wrappers that carry real left/right operands.
- Strengthen Assignment Task `Approved`, `Rejected`, and `Completed` outcome conditions so generated flows use source-task Outcome expression-button HTML instead of generic `Outcome` variable tokens.
- Add source/dist regression coverage for direct values, expression-editor values, grouped `and`/`or` child conditions, and task outcome condition shapes.
- RC install smoke passed from `yeeflow-app-builder-plugin-v0.9.25-rc1`: Codex installed `yeeflow-app-builder@yeeflow` version `0.9.25`, marketplace metadata resolved from the RC snapshot, and installed-cache workflow condition, approval YWF structure, workflow layout, workflow assignee, and standalone export gates passed.

## 0.9.24

- Release Workflow Designer motif-first readability hardening.
- Add local Inclusive Gateway fan-out validation so business branch targets stay near the gateway and use upper/lower lanes instead of distant long connectors.
- Add local normal End merge validation so multi-source completion paths converge beside the incoming source group.
- Add local rejection vertex-economy validation so nearby `Rejected -> End with rejection` paths use rounded auto-routing instead of unnecessary `vertices[]`.
- Add concise connector label validation so full business logic remains in `conditioninfo` while visible labels stay readable.
- Extend source/dist workflow layout regression coverage for gateway locality, End merge locality, local rejection vertices, and overlong condition labels.

## 0.9.23

- Release Workflow Designer readability gate hardening.
- Treat medium workflow width as an advisory readability signal instead of an isolated hard compression target; readable multi-row workflows may exceed 2600px when row density and labels remain clear.
- Add long connector label collision gates for node overlap and label overlap.
- Add shared vertical route lane density validation so multiple long vertical connector segments cannot collapse into one visual wall.
- Add source/dist regression coverage for readable wide folded workflows, label collisions, and vertical route lane density.

## 0.9.22

- Release standalone export, Job Position assignee, and Workflow Designer vertical-route hardening.
- Standalone `.ydl` and `.ydp` export generation now shares the same Data List and Dashboard builders, golden reference templates, field/control mapping, filter/action naming, validator gates, and source/dist mirror rules used by full `.yapk` materialization.
- Workflow Assignment Task Job position routing now requires OAuth refresh attempts, read-only lookup proof, duplicate-name scans, and single-create proof before using an existing or newly created Job Position ID; placeholder assignees remain allowed only as exhausted fallback.
- Workflow Designer connector layout now applies net-gap midpoint routing to vertical connector segments as well as horizontal return segments.
- Add `WORKFLOW_LAYOUT_ROUTE_X_CROSSES_INTERMEDIATE_COLUMN` validation so vertical connector lanes fail when they pass through intermediate workflow column node bounds.
- Add source/dist regression coverage for standalone export shared generation, Job Position assignee guardrails, and vertical workflow routeX lane safety.

## 0.9.21

- Release multi-row workflow return-route hardening.
- Generated Approval form, Data list workflow, and Scheduled workflow graphs now choose a safe open adjacent row-gap lane for long backward/return connectors that cross intermediate rows instead of using only the source/target row midpoint.
- Add `WORKFLOW_LAYOUT_ROUTE_Y_CROSSES_INTERMEDIATE_ROW` validation so return connector horizontal segments fail when they pass through an intermediate workflow row's node bounds.
- Extend source/dist regression coverage for multi-row return routing and preserve the Workflow Designer v2 rounded connector contract.

## 0.9.20

- Release Workflow Designer connector layout hardening.
- Generated Approval form, Data list workflow, and Scheduled workflow graphs now keep direct Submitted and adjacent same-row forward connectors on rounded auto-routing without cosmetic `vertices[]`.
- Row-gap return connectors must route through the exact midpoint lane between rows, while external return lanes are reserved for genuinely long or crowded reroutes.
- Add source/dist regression coverage for unnecessary Submitted vertices, unnecessary direct-forward vertices, row-gap midpoint route drift, and reference-only workflow layout validation.

## 0.9.19

- Release shared Approval Form Layouts v1.1 generation for standalone `.ywf` and full `.yapk` paths.
- Standalone `.ywf` approval pages and packaged Approval form pages now use the same shared layout builder for submission/task templates, field control mapping, task readonly flags, empty-section cleanup, and source-template residue cleanup.
- Add source/dist regression coverage proving standalone `.ywf` submission and task pages pass the same `approval-form-layouts-v1.1` validator used by packaged applications.
- Document the shared-builder contract so future Approval layout fixes are made once and apply to both generation paths.

## 0.9.18

- Release complex workflow lane layout hardening.
- Generated Approval form, Data list workflow, and Scheduled workflow graphs now split complex rejected paths into local `EndRejectEvent` groups instead of routing every rejection into one global endpoint.
- Medium-complexity workflows now fold later steps into upper/lower lanes before they become over-wide horizontal strips.
- Long backward reroutes, including request-clarification return paths, must include explicit `vertices[]` instead of relying only on Designer auto-routing.
- Add source/dist regression coverage for distant same-lane rejection endpoints, dense workflow rows, gateway condition label congestion, and six-approval materializer output with multiple local rejection endpoints.

## 0.9.17

- Release shared End with Rejection workflow layout hardening.
- Generated Approval form, Data list workflow, and Scheduled workflow graphs now center shared `EndRejectEvent` nodes by source Assignment Task center points instead of fixed or top-left coordinates.
- First-row Approval Assignment Task rejection endpoints must be placed above the source row; lower-row Approval Assignment Task rejection endpoints must be placed below the source row.
- Add source/dist regression coverage for three-source off-center shared rejection endpoints and first-row rejection endpoints incorrectly placed below the source row.
- Extend the materializer fixture to generate three Approval Assignment Tasks before a system action, proving generated packages satisfy the new center and row-direction gates.

## 0.9.16

- Release Approval YWF form structure and Workflow Designer v2 line-style hardening.
- Generated Approval form YWF/YAP resources must use string form-control bindings, current date picker control types, valid numeric width config, and complete `Form body` / `Form bottom` regions.
- Workflow history and workflow control panel controls must remain inside `Form bottom`, while label-only Approval outcome condition rows now fail before signing readiness.
- Generated Approval form, Data list workflow, and Scheduled workflow diagrams now emit Workflow Designer v2 properties with root `graphver: 2`, `lineType: "rounded"`, and rounded SequenceFlow metadata while preserving `graphzoom`.
- Add focused source/dist regression gates for Approval YWF form structure, rounded line style, and workflow layout/assignee guardrail compatibility.

## 0.9.15

- Release repo hygiene duplicate-copy guardrails.
- Add repo hygiene protection for tracked and untracked Finder/copy-style duplicate artifacts such as `name 2.md`, `name 3.json`, `name 4.mjs`, and `SKILL 2.md`.
- Document that release packaging and cache smoke must use tracked-file manifests instead of raw working-tree zips, so local duplicate artifacts cannot enter plugin releases.
- Allow the hygiene guard to run from installed plugin cache roots without `.git` metadata while preserving stricter source checkout checks.

## 0.9.14

- Release Workflow Assignment Task assignee golden references.
- Materialize export-backed assignee shapes for Line manager approval, Department head approval, workflow user variable assignees, workflow user Line manager assignees, and multiple assignee tasks.
- Support Job position assignees only when a proven existing or newly created Job position ID is available; fail closed instead of copying sample tenant-local IDs.
- Add assignee golden-reference JSON and training guidance for Approval form, Data list workflow, and Scheduled workflow Assignment Tasks.
- Extend source/dist guardrails so unsupported or fallback assignee shapes fail before signing readiness.

## 0.9.13

- Release Workflow layout golden reference v2 hardening.
- Enforce same-horizontal-lane grouping for Approval Assignment Task Rejected paths that share one `EndRejectEvent`; tasks on different y lanes must use separate rejection endpoints.
- Keep the existing maximum of three approval-task rejected sources per shared End with Rejection node and preserve centered above/below placement.
- Add 16:9 Designer canvas guidance and hard gates that reject large single-row sprawl and workflows with more than five vertical rows.
- Extend source/dist workflow layout regression fixtures for cross-lane shared rejection, too-many-rows, and single-row-sprawl failures.

## 0.9.12

- Release reverse-related View Item Collection Search variable and Add button contract hardening.
- Bind reverse-related Search controls to Yeeflow system filter ids such as `__filter_filter_doctor_profiles_1` instead of plain business variable names.
- Register generated reverse-related Search variables in form `filterVars[]` and make Collection `fulltext` consume the same system id.
- Preserve the golden reference inline-width Add button positioning with `attrs.common.positioning.widthtype = [null, "2"]` and standard container sizing.
- Add hard gates for split Search variable contracts, undeclared filterVars, fulltext id drift, and Add buttons that lose inline width.

## 0.9.11

- Release reverse-related View Item Collection search and card style fidelity.
- Hide reverse-related Collection Search filter titles with `displayLabel: [null, false]` while keeping the placeholder visible.
- Preserve the Data List View Item `content_card_wrapper` golden card style for reverse-related sections, including white background, 28px padding, `#d8e1ef` border, 16px radius, drop shadow, and full-width parity.
- Add hard gates for visible reverse-related Search labels and shallow card wrappers that copy `nv_label` without golden card styling.
- Extend source/dist regression coverage and training guidance for the 0.9.10 partial stylefix failure.

## 0.9.10

- Release reverse-related View Item Collection grid-table golden reference fidelity.
- Materialize reverse-related child Collections by cloning the full `collection_control_grid_table` `grid_table_col_wrapper` before remapping title, toolbar Search/Add, lookup filters, fulltext, header columns, and item-context fields.
- Preserve golden-reference Collection style contracts while still pruning unproven row operation/dropbar residue from reverse-related row templates.
- Add hard gates so shallow hand-built grid-like wrappers without `collection_control_grid_table` provenance fail before signing readiness.
- Extend the reverse-related Collection training report and source/dist regression coverage for the 0.9.9 styling regression.

## 0.9.9

- Release reverse-related View Item Collection official YDL shape hardening.
- Materialize reverse-related child Collections with the official independent section wrapper, caption, toolbar Search/Add slots, content/header/body layers, and official Collection attrs.
- Resolve planned lookup display names to runtime storage fields for lookup filters and Add passvalues while preserving App Plan conformance through planned/resolved aliases.
- Normalize reverse-related row `dynamic-field` controls to simple item-context bindings and reject extra generated binding metadata that can keep the View Item designer in Loading.
- Add hard gates for partial/shallow reverse-related Collection shapes, missing official Search/Add slots, and item-context extra bindings before signing readiness.

## 0.9.8

- Release reverse-related View Item Collection independent-section hardening.
- Materialize reverse-related child Collections as independent official-shape `Content.children[]` sections after current-record details instead of nesting them inside details cards, field grids, or `section_content_area`.
- Preserve official toolbar Search/Add and lookup-filter/passvalues behavior while normalizing child Collection row `dynamic-field` controls to `source: "3"` and explicit child-list fields.
- Parse every `Reverse-Related Collection Selection` subsection in the Custom Data List Forms plan so multi-parent apps materialize all planned child Collections instead of stopping at the first table.
- Add hard gates for nested reverse-related Collection sections, unofficial Collection attrs, and missing/invalid child Collection item context before signing readiness.

## 0.9.7

- Release reverse-related View Item Collection designer safety hardening.
- Preserve official-shape toolbar Search/Add controls for reverse-related Collection sections while pruning unproven row `dropbar`, `grid_table_col_item_op_menu`, and copied edit/delete row operation residue from cloned Collection rows.
- Add `DATA_LIST_FORM_REVERSE_RELATED_ROW_OPERATION_UNPROVEN` validation and source/dist regression coverage so reverse-related View Item designer-unsafe row operations fail before signing readiness.

## 0.9.6

- Release full-app generated-final preflight closure for schema-bound Collection cleanup and reverse-related View Item sections.
- Parse explicit lookup-target columns in App Plan field tables so Text-backed lookup fields receive target list/rule metadata before data-list schema validation.
- Materialize planned reverse-related child Collections on Data List View Item forms with lookup filters, search/fulltext bindings, Add-record actions, and current-record `ListDataID` passvalues defaults.
- Omit placeholder Form reports such as `Not planned`, filter invalid navigation children, and align live-install readiness UUID checks with Summary/Data Analytics runtime registration contracts.

## 0.9.5

- Release Dashboard Collection schema-bound progress binding hardening.
- Recursively validate Collection item `__ctx_coll` expressions against the selected source Data List schema, including Progress bar percentage expressions and copied template variables.
- Block Progress bar / progress-circle controls unless App Plan semantics and source schema provide a real numeric/decimal/percent progress metric.
- Reject duplicate visible grid-table column labels such as copied `Status` / `Status` columns after business field mapping.
- Add source/dist regression coverage and training guidance for removing source-template `Decimal2` / `Completion percentage` residue before signing readiness.

## 0.9.4

- Release reverse-related Collection section planning and materialization gates.
- Add App Plan coverage for Data List View Item reverse-related Collection sections, including host list, child list, lookup field, approved Collection template, search/fulltext, Add button, and `ListDataID` passvalues requirements.
- Validate generated View Item forms against planned reverse-related sections so child-list Collections, lookup filters, search controls, and Add-record default values are materialized before signing readiness.
- Update application/data-list/package skills and source/dist regression coverage for reverse-related business relationship usage.

## 0.9.3

- Release Dashboard Collection style contract hardening.
- Enforce approved Collection template style fidelity for dynamic-user zero item padding, transparent operation menu buttons, and Large medium grid-table caption title typography.
- Add source/dist dataset-presentation regression coverage for Collection template artifact drift and generated package typography drift.
- Harden App Plan field-table parsing and lookup seed data proof so planned fields and lookup ListDataID storage remain generation/runtime-safe.


## 0.9.2

- Release Dashboard v1.1 Summary host and identity-field hardening.
- Nest generated v1.1 Dashboard Summary hidden hosts inside approved KPI business slots instead of appending invented `*_kpi_data_host` containers under root `Content` / `content_panel`.
- Keep identifier labels such as `Employee Number`, `Employee ID`, and `Department Code` as normal `dynamic-field` controls while continuing to require `dynamic-user` for true identity-picker fields.
- Add focused source/dist regression coverage for the Hospital Doctor Dashboard failure shape and align the v1.1 validator fixture with current navigator-label, action, and source-template-residue gates.

## 0.9.1

- Release tolerant-Brotli UI hard-gate alignment.
- Route UI hard-gate package readers through the shared tolerant `.yapk` Resource decoder so Yeeflow official export-compatible payloads do not fail Summary/KPI inspection with strict Brotli `unexpected end of file`.
- Add source/dist regression coverage for the Summary inspector reading official-style tolerant-Brotli packages.
- Document post-install seed-writer proof boundaries and remaining Dashboard materialization hard gates after Resource wrapping succeeds.

## 0.9.0

- Release Service Portal generator training.
- Add a dedicated `yeeflow-service-portal-generator` skill for planning, inspecting, validating, and generating Service Portal payloads in `.yapk` applications.
- Add export-backed Service Portal standards covering decoded `PortalInfo`, `ListSet.Ext3.externalPortal`, Type `128` portal user system lists, portal user groups, portal source resources, menus, list form routing, portal permissions, and portal-aware dashboard bindings.
- Add a normalized Supplier Management Service Portal reference and training report while keeping login-page customization export location and exact permission bit semantics marked as open questions.
- Add `inspect-service-portal-yapk.mjs` plus focused self-tests so packages with Service Portal can validate current-app Data List, Document Library, and Dashboard exposure while blocking unsupported Approval form and Form report portal source resources before signing readiness.

## 0.8.117

- Release official YAPK Resource export compatibility.
- Encode generated `.yapk` wrapper `Resource` values with Yeeflow official-export-compatible tolerant Brotli shape instead of standard complete Node Brotli.
- Preserve official AppPackageInfo export surfaces by emitting `FormReports: []` and `CustomServices: []` arrays even when no report or custom service resources are planned.
- Route public package validators and related YAPK inspectors through the shared tolerant Brotli decoder so current Yeeflow official exports do not fail strict decode before package-shape validation.
- Add focused source/dist regression coverage for official Resource strict-decode failure, tolerant decode success, and required empty `FormReports` / `CustomServices` array gates.

## 0.8.116

- Release Custom Capability App Plan planning.
- Add a standard App Plan `Custom Code and Custom Service Planning` section covering native capability decisions, Custom Code plan rows, Custom Service plan rows, invocation plans, and runtime proof requirements.
- Add `custom-capability-app-plan-planning-standard.md` and training documentation so Custom Code controls, Form Action Custom Code steps, Custom Service resources, `invokeservice` form actions, and `InvokeCode` workflow actions are planned before generation.
- Update Custom Code, Custom Service, and Feature Learning skills to block unplanned custom capability shortcuts and prevent `Not planned` / `N/A` / `None` placeholder rows from materializing.
- Add focused source/dist regression coverage for the custom capability App Plan contract and cache artifact mirrors.

## 0.8.115

- Release Custom Service generator and invocation training.
- Add a dedicated Yeeflow Custom Service generator skill for Node.js 22 `.ycs` services, including strict `run({ inputs, connections, modules, logger })` guidance, server-side queue execution boundaries, and safe fallback recommendations for client-side Custom Code.
- Normalize exported Custom Service references for plain input/output services, HTML table generation, Excel-to-Data-List import patterns, and SharePoint OAuth connection-variable usage.
- Document and gate Custom Service invocation shapes for Approval/Data List/Dashboard form actions, Approval/Data List/Scheduled workflow actions, workflow variables, Data List fields, temp variables, and connection bindings.
- Add focused source/dist regression coverage so Custom Service examples, invocation contracts, and cache artifacts stay aligned before release/cache smoke.

## 0.8.114

- Release Custom Code surface-contract cache-root alignment.
- Make `test-custom-code-surface-contract-gates.mjs` root-mode aware so the same focused gate validates both source checkouts (`skills/installed/...`) and installed plugin cache roots (`skills/...`).
- Preserve the 0.8.113 Custom Code control versus Form Action Custom Code step runtime contract while restoring installed-cache smoke coverage.

## 0.8.113

- Release Custom Code control versus Form Action Custom Code step contract hardening.
- Add a dedicated Form Action Custom Code step runtime standard that requires `execute(context, fieldsValues)` and keeps package materialization gated until action-step JSON storage shape is export-proven.
- Update the Yeeflow Custom Code generator skill and reference standard to classify `control` versus `form_action_step` before generation, preserving `render(...)` only for visible Custom Code controls.
- Align Custom Code decision guidance and Form Action generation rules so App Plans declare the custom-code surface, host action, parameters, read/write fields, native fallback, and runtime proof boundary.
- Add focused regression coverage and source/dist mirror checks for Custom Code surface entrypoint drift.

## 0.8.112

- Release focused Service Tickets master-detail workspace cleanup.
- Prune empty `section_title_area` containers inside generated two-panel and three-panel workspace content cards instead of preserving template-only shells.
- Skip Dashboard v1.1 content-card slot repair on master-detail workspace pages so optional title/action areas remain removable when not backed by business content.
- Keep Priority/Status select-filter option sets exact when explicit App Plan choices or field rules exist, without appending generic workflow/status fallback values such as Draft, Submitted, or Completed.
- Add focused Service Tickets regression coverage and training documentation for empty section cleanup and exact filter option-source behavior.

## 0.8.111

- Release Data Analytics runtime export-shape and Service Tickets workbench Dashboard plan-shape hardening.
- Reject chart/pivot `Resource.exts[]` runtime rows and values that lack export-shaped metadata required by Yeeflow runtime materialization.
- Parse bullet-form Dashboard page layout selections under `## 14. Dashboard Pages Plan`, preserving `dashboard-page-layouts-two-panel-workspace` and `dashboard-page-layouts-three-panel-workspace` instead of silently falling back to `dashboard-page-layouts-v1.1`.
- Add Service Tickets regression coverage for the real App Plan shape that requires a left Ticket list, selected-ticket detail workspace, and Priority/Status filter controls.

## 0.8.110

- Release consolidated App Plan Data List schema support.
- Parse table-driven `List | Field label | Internal field | Field type | Purpose` rows as planned Data List schema, without treating schema headings as real resources.
- Preserve explicit internal fields such as `Title`, `Text5`, and `Datetime1`; keep identity-picker, lookup, and file-upload fields schema-safe on Text-backed storage.
- Resolve lookup targets from App Plan purpose text and keep Dashboard Priority/Status filter option sources tied to planned fields.
- Add focused Service Tickets regression coverage and training documentation for field materialization, dashboard layout selection, custom form host assignment, seed artifacts, and template residue cleanup.

## 0.8.109

- Release FormNewReports upgrade omission hardening.
- Allow Dashboard-only upgrade scope validation to treat `FormNewReports: []` as an omission of unchanged installed Form reports, not a deletion, when report changes are not in scope.
- Keep real Form report changes blocked unless report scope and update-safe proof are explicitly provided.
- Add regression coverage for the verified Office Asset Dashboard runtime fix shape where omitting unchanged installed `FormNewReports[]` avoided Version Management duplicate report failure.
- Save the FormNewReports upgrade omission training report and align the full-app generation standard with the live upgrade boundary.

## 0.8.108

- Release Service Tickets semantic materialization hardening.
- Parse Dashboard page selection tables that use `Dashboard | Layout template | Dataset presentation` and materialize only the explicitly planned Dashboard page, instead of treating `Left panel work queue`, `Right panel selected ticket detail`, or `Explicit dashboard exclusions` subsections as standalone Dashboard resources.
- Parse App Plan Data List field tables that use `Internal Name`, `Business Type`, `Yeeflow Type`, and `Choices`, preserving planned Service Tickets fields such as Priority `Text7`, Status `Text5`, and Text-backed `identity-picker` requester/agent fields.
- Add a focused Service Tickets regression fixture that rejects generic workspace pages, Title-only business Data Lists, and unsupported `FieldType: "User"` output before signing readiness.
- Save the Service Tickets semantic materialization training report and keep source/dist materializer and regression gates aligned.

## 0.8.107

- Release refreshed Dashboard master-detail workspace YDP templates.
- Update `dashboard-page-layouts-two-panel-workspace` and `dashboard-page-layouts-three-panel-workspace` from the latest YDP exports, including 520px left panel width, relocated `left_panel_sidebar`, and the editable `left_panel_caption_icon_wrapper` / `left_panel_caption_icon` source icon slot.
- Add explicit `current_item_main_header_edit_item_button` and `current_item_main_header_delete_item_button` slots while keeping repeatable `current_item_main_header_operations_button` for additional business actions.
- Prune generated no-action workspace operation containers across current-item and additional-header operation regions, not only generic `Operations` containers.
- Extend master-detail workspace template gates, plan-conformance tests, and dist mirrors so the updated operation-slot contract is enforced before signing readiness.

## 0.8.106

- Release Service Tickets runtime semantics, Data Analytics parser alignment, and Dashboard content-card fidelity hardening.
- Preserve proven option-source choices for master-detail Priority/Status filters, bind those filters to matching business fields, and validate selected-record detail labels against the rendered Dynamic controls.
- Emit structured seed-data requirements for `identity-picker` and `file-upload` fields while keeping generated storage schema-safe as `FieldType: "Text"` for identity-picker fields.
- Align Data Analytics App Plan parsing for Region/Surface tables and preserve Dashboard `content_card_wrapper` section title/header slots required by golden-reference fidelity gates.
- Reject loan/asset source-template copy outside matching business domains so Service Tickets-style pages cannot silently keep unrelated template helper text.

## 0.8.105

- Release Dashboard master-detail workspace action and filter binding hardening.
- Preserve `dashboard-page-layouts-two-panel-workspace` and `dashboard-page-layouts-three-panel-workspace` page-layout root `actions`, `formAction`, `tempVars`, and `filterVars` during full-app materialization instead of replacing them with only inserted component-template dependencies.
- Remove generated visual-only operation/search/add/header controls whose action references do not resolve to a page action/formAction or nearest Collection/Kanban local action.
- Bind master-detail left-panel filters by business semantics, so `Priority Level` resolves to the source Priority field and `Status` resolves to the source Status field instead of neighboring ticket number/title fields.
- Keep hidden Summary runtime hosts out of visible master-detail business sections to avoid empty cards below planned KPI rows.
- Add two-panel and three-panel regression coverage for unresolved page action references and mismatched left-panel filter field bindings.

## 0.8.104

- Release full-app materializer resource/runtime fixes.
- Preserve a single native `Title` field per Data List; business title-like fields such as Asset Tag, Request Number, Loan Number, and Review Number update the existing native Title display metadata instead of creating a second `FieldName/InternalName = Title` field.
- Guard API-issued content IDs against rounded 19-digit values before generated-final materialization, so unsafe numeric precision loss cannot enter signed packages.
- Parse App Plan Data Analytics rows that use `Section | Surface | ...` tables, and materialize planned chart/pivot templates into visible controls plus `Resource.ReportIds[]` / `Resource.exts[]` runtime models.
- Rebind visible Dashboard KPI card values to the same Summary `save_var` expression object used by the hidden Summary runtime control, while removing source-template Event Portfolio KPI variable and text residue.
- Preserve the corrected identity-picker storage contract: user/person/requester/assignee fields remain schema-safe `TextN` fields with `FieldType: "Text"` and `Type: "identity-picker"`, not `FieldType: "User"`.

## 0.8.103

- Release Data List identity-picker storage correction.
- Generate user/person/requester/assignee/agent/owner fields as schema-safe `TextN` fields with `FieldType: "Text"` and `Type: "identity-picker"`.
- Remap legacy App Plan `UserN` / `User` field wording to Text-backed identity-picker output instead of emitting unsupported YAPK Data List storage fields.
- Update Service Tickets regression coverage and training guidance to reject `FieldType: "User"` and `FieldName: "UserN"` generated output before signing readiness.

## 0.8.102

- Release installed-cache validator mirror smoke alignment.
- Check the actual installed plugin cache public validator mirrors: `scripts/validate-yapk-package.js` and `skills/yeeflow-application-generator/scripts/validate-yapk-package.js`.
- Keep source checkout validation strict for root, dist, scripts, installed-skill, and dist-skill byte parity.

## 0.8.101

- Release cache-aware validator-entrypoint smoke hardening.
- Teach `test-yapk-validator-entrypoint-drift.mjs` to distinguish source checkouts from installed plugin cache roots so cache smoke no longer expects a nested `dist/yeeflow-app-builder-plugin` directory inside the installed payload.
- Preserve source checkout dist mirror byte-parity checks while validating installed cache-root public validator entrypoints directly.

## 0.8.100

- Release Dashboard dataset template-selection and v1.1 section-fidelity validator tightening.
- Validate Dashboard Collection App Plan template choices against the selected rationale/display-need guidance instead of broad row context such as page names or source list names.
- Reject conflicting template rationale signals, including responsive-card selections justified by dense row/column/table scanning without explicit card-browsing intent.
- Require copied Dashboard Page Layouts v1.1 `content_card_wrapper` modules to preserve both `section_title_area` and `section_content_area`; no-title content modules must use a separately approved template instead of mutating the canonical wrapper.
- Keep negative regression fixtures for `DASH_DATASET_APP_PLAN_SELECTION_RATIONALE_MISMATCH` and `DASH_LAYOUT_RESOURCE_SECTION_TITLE_AREA_MISSING` as release gates.

## 0.8.99

- Release Service Tickets user/person field, filter, and template-residue hardening.
- Corrected by 0.8.103: user/person fields must use schema-safe `TextN` storage plus `Type: "identity-picker"`; generated `UserN` / `FieldType: "User"` Data List fields are not valid under the current YAPK schema.
- Keep master-detail left record-list Collections free of unsafe empty select-filter conditions until a proven optional-filter runtime contract exists.
- Scrub unrelated Office Asset/Event Portfolio source-template metadata from Service Tickets generated Dashboard and custom Data List form business resources.
- Derive KPI/Summary temp variables, Summary IDs, and generated metadata from planned business metric names instead of source golden-reference slot names.
- Add focused Service Tickets regression coverage for Text-backed identity-picker fields, left-list filter safety, App Plan selected two-panel layout materialization, custom form host assignment, and template-residue cleanup.


## 0.8.98

- Release Data Analytics runtime chart type code hardening.
- Materialize Data Analytics chart runtime extensions with Yeeflow runtime chart type codes: pie `0`, line/area `1`, bar/column `2`, while keeping pivot table runtime entries on the `PivotTable` key without semantic chart strings.
- Add `func: "DATE"` to date-based line/area chart runtime rows so trend charts can materialize after Version Management success and delayed refresh.
- Reject semantic runtime chart type strings such as `pie-chart`, `bar-chart`, `column-chart`, `line-chart`, and `area-chart` before signing readiness.
- Add regression coverage proving semantic chart type strings and missing line/area `DATE` row functions fail the Data Analytics golden-reference gate.

## 0.8.97

- Release KPI Summary / Data Analytics runtime materialization proof hardening from PR #335.
- Require delayed/refresh runtime materialization proof before accepting KPI Summary or Data Analytics runtime claims, instead of treating immediate post-install page state as final proof.
- Reject chart canvas-only evidence: Data Analytics proof must show rendered chart or pivot output in addition to visible controls and Resource.exts runtime model registration.
- Require visible KPI values to be numeric and backed by Summary runtime evidence, while keeping structural package validation, Version Management success, immediate runtime state, and delayed runtime success as separate proof layers.
- Block dashboard-only upgrade fixes from expanding to other Dashboard pages until the target page completes the full delayed/refresh runtime proof chain and non-Dashboard resources remain unchanged.

## 0.8.96

- Release page-scoped template dependency namespace and Service Tickets E2E regression hardening from PR #334.
- Rename copied golden-reference filter variables, temp variables, and form actions per generated page/form so multiple templates on the same Dashboard, Data List form, Approval form, Task form, or print page cannot collide at runtime.
- Preserve planned Service Tickets field contracts, including `Status | Text5` select fields and User/person fields as identity-picker controls with schema-safe Text-backed storage keys.
- Parse Dashboard page names only from real Dashboard page records so support subsections such as `Summary Metrics`, `Dashboard Filters`, `Data Analytics`, and `Data Tables` do not materialize as unplanned Dashboard pages.
- Attach custom Data List forms to the explicit host list from App Plan rows, and prevent comments/attachments/supporting-list View Item forms from inheriting unplanned Dashboard KPI rows or source-template title-only sections.
- Scrub source-template business residue such as `Office Asset`, `Active Loan Pipeline`, `current loan volume`, and `return activity signal` from generated Service Tickets-style Dashboard and custom form resources before signing readiness.

## 0.8.95

- Release Dashboard navigator-label, expression-binding, and business-residue cleanup hardening from PR #332.
- Recursively assign stable, business-specific `nv_label` / `nav_label` metadata inside generated Dashboard Collection item templates so Designer Navigator does not fall back to generic `Dynamic user`, `Container`, or `Text` names.
- Block visible raw formula strings in generated Dashboard text controls, including copied `iif(dateDiff(...))` expressions that should be expression bindings rather than rendered text.
- Remove source-template loan/Office Asset business copy from generated Service Tickets-style Dashboard and Data List View pages, including `Active Loan Pipeline`, `current loan volume`, `return activity signal`, and `Office Asset records` residue.
- Treat `section_title_header` and `section_title_area` as optional generated modules: when a section has no distinct business title and no configured `Operations`, generated-final validation now requires the copied title area to be removed.
- Prevent supporting custom Data List View forms such as comments or attachments from inheriting unplanned Dashboard KPI rows or title-only copied sections before signing readiness.

## 0.8.94

- Release Dashboard master-detail workspace materialization hardening from PR #329.
- Materialize two-panel and three-panel workspace Dashboards with the selected-item `vCurrentItemID` runtime contract, left-panel item selection actions, and right-panel current-item Collection `limit` plus `vCurrentItemID` filter binding.
- Remap cloned master-detail source IDs inside Dashboard templates so left/right panel Collections target the generated page data source instead of source-template IDs.
- Treat master-detail built-in Collections as page-layout runtime components so generic dataset/grid-table validators do not misclassify internal shell Collections as ordinary business dataset modules.
- Allow `left_panel_filter_group` as an approved filter host while enforcing the maximum of two Data Filter controls per group.
- Resolve data-list view navigation targets to their host Data Lists during generated-final resource completeness validation.
- Add Service Tickets regression coverage proving generated-final preflight passes for the master-detail Dashboard template flow before signing readiness.

## 0.8.93

- Release Dashboard master-detail workspace page layout templates from PR #326.
- Register `dashboard-page-layouts-two-panel-workspace` and `dashboard-page-layouts-three-panel-workspace` as approved Dashboard page layout golden references for Outlook-style dataset management pages.
- Preserve the export-derived left dataset panel, selected-item `vCurrentItemID` temp-variable contract, right current-item Collection limit/filter contract, empty-selection state, page actions, field grids, related-content working areas, and optional chart-card regions.
- Require create/add actions only for create-capable Data List or Document Library sources, while read-only/reporting sources such as Form Report and Data Report must omit the add button.
- Align App Plan resource-order validation so approved master-detail layout template IDs are not misclassified as fake placeholder IDs.
- Add focused regression coverage for two-panel and three-panel layout registry entries, editable-slot rules, locked template regions, empty-section cleanup, Data Analytics placement, and source/dist mirrors.
- Release Dashboard page layout plan conformance from PR #328.
- Parse App Plan `Dashboard Page Layout Template Selection` records into full-app materialization demand and preserve the selected layout per Dashboard page.
- Materialize generated Dashboard pages from the App Plan-selected layout template, including `dashboard-page-layouts-v1.1`, `dashboard-page-layouts-workbench`, `dashboard-page-layouts-two-panel-workspace`, and `dashboard-page-layouts-three-panel-workspace`, instead of silently falling back to v1.1.
- Make Dashboard layout validation and generated-final preflight compare each decoded Dashboard page layout against the App Plan-selected layout and fail mismatches before signing readiness.

## 0.8.92

- Release E2E helper path, title, and install reporting alignment from PR #324.
- Resolve `yapk-first-generation-preflight` relative package, App Plan, and ID provenance paths from the caller working directory while preserving plugin-root gate execution.
- Prefer explicit App Plan application names during full-app materialization and strip planning document suffixes such as `- Yeeflow App Plan` from generated app titles.
- Separate package API request acceptance from final Version Management/runtime success with `apiAccepted`, `finalResultKnown`, `finalSuccess`, and `versionManagementRequired` reporting fields.
- Emit safe canonical application links for submitted fresh installs when OAuth tenant URL and decoded package root `ListSetID` proof are available, without treating the link as runtime proof.

## 0.8.91

- Release business-semantic application color palette selection from PR #322.
- App Plans now choose Primary, Secondary, and Neutral base colors from explicit user branding or a business-domain-specific palette instead of silently falling back to the generic Yeeflow default palette.
- Materialize domain-inferred palettes into the Type 0 `application style.Config` while preserving `lightmodel: "Luminance"` and the Soft outline controls default binding.
- Reject identifiable business-domain applications that still use the generic default Primary/Secondary/Neutral palette without explicit user approval before signing readiness.
- Add focused regression coverage for travel/vendor/asset/finance/people palette inference, explicit override preservation, and App Plan-to-package color matching.

## 0.8.90

- Release Dashboard runtime data binding hardening from PR #319.
- Require visible Data Analytics chart and pivot source metadata to match the corresponding `Resource.exts[]` runtime source metadata before signing readiness.
- Require COUNT analytics values to use `ListDataID` consistently across `field`, `fieldName`, `FieldName`, and `id` instead of display fields, source UUIDs, or derived pseudo fields.
- Materialize generated Data Analytics controls with export-proven visible source surfaces and COUNT value identity, and add regression coverage for missing source metadata, source drift, invalid COUNT fields, and incomplete pivot rows/values.

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
