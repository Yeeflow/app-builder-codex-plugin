---
name: yeeflow-package-validator
description: Standardize Yeeflow package validation before import or runtime testing. Use when Codex generates or edits a .yap package, validates Yeeflow data lists, forms, workflows, dashboards, custom code, or expressions, diagnoses package import/materialization issues, or decides whether runtime import is safe.
---

# Yeeflow Package Validator

## Full-App Generation Entrypoint Boundary

When validating a plugin-only clean-room generation attempt, run `scripts/inspect-full-app-generation-entrypoints.mjs` before concluding that no full-app generation path exists. The registry at `docs/reference/full-app-generation-entrypoints.json` distinguishes skill-orchestrated full-app generation from validation scripts, delivery-decision helpers, package API helpers, runtime-proof demos, and sample-specific generators. Package validators must not claim package generation capability on their own, and they must not accept helper scripts as generic Functional Spec + App Plan to YAPK generators.

## UI Generation Hard-Gate Skill

Phase 3B adds workflow-level enforcement. Final reports for high-quality UI work must include contract, scope, runtime evidence, and structure-comparison artifact paths as applicable. Run `scripts/inspect-ui-closed-loop-workflow-enforcement.mjs` before claiming high-quality UI or design fidelity. Generation from design/mockup requires a UI contract. UI upgrades require a scope manifest. Runtime UI quality claims require runtime evidence. Design fidelity claims require structure comparison. Dynamic KPI proof requires before/after mutation evidence. Install/sign/upgrade success is not visual proof.

Use `yeeflow-ui-generation-hard-gates` when validation reports cover dashboard/UI quality, Summary/KPI metrics, visible KPI runtime evidence, sandbox page proof, export-proven style/control shapes, or UI upgrade lineage. High-quality UI requires a page-by-page implementation contract; uncertain UI/runtime patterns should be proven on a sandbox page first; use export-proven Yeeflow control/style shapes; Summary/KPI controls require designer-shaped hidden Summary configuration; Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; Summary recalculation can be asynchronous or cache-delayed; semantic/non-UUID Summary IDs and other unsupported shapes remain unproven; for every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback; runtime screenshot evidence is required before claiming UI quality; install/signing/API acceptance is not runtime UI proof; UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope; broad scaffold-like UI must not be claimed as high-quality UI. Data Analytics controls require UUID/runtime-safe IDs for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Preserve existing Data Analytics control IDs during upgrades.

Dashboard/app page root content-area padding is a hard gate: every generated or upgraded Type 103 dashboard/app page must serialize `Pages[].LayoutInResources[].Resource` with root `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`. Scalar padding, object/numeric padding, numeric array padding, `attrs.common.padding`, or `attrs.style.padding` alone are invalid for the root content area. Normalize existing dashboard/app page roots to this exact token-array shape before signing, installing, importing, or upgrading. Inner layout containers may keep intentional spacing.

Generated Dashboard pages must also pass Dashboard Page Layouts v1.1 validation in addition to Event Portfolio Golden Reference conformance. The page-level gate enforces the copied v1.1 shell, `main > content`, `#f4f7fb` page background, zero root page padding, canonical v1.1 `Content` container padding, Full width structural containers, section title/content areas, real Operations actions, controlled business-content slots, registered repeatable/removable modules only, canonical runtime route proof, and dashboard-only upgrade scope boundaries. Do not force v1.1 `Content` padding to zero.

Dashboard Collection dataset presentation validation is a signing-readiness gate. For `collection_control_card_with_multiselect_toolbar`, validation must require the full export-shaped template from `docs/reference/collection-control-card-with-multiselect-toolbar.template.json`: `card_with_multiselect_toolbar_wrapper` subtree, locked `card_col_item_multi_select`, Collection root actions, selected-state temp variables, page actions, form actions, filter variables, and only the allowed editable regions. For `collection_control_grid_table_with_multiselect`, validation must require the full export-shaped template from `docs/reference/collection-control-grid-table-with-multiselect.template.json`: `grid_table_col_multiselect_wrapper` subtree, locked `grid_table_col_item_select`, Collection root actions, selected-state temp variables, page actions, form actions, filter variables, and matching `grid_table_col_header` / `grid_col_item` column definitions. Do not accept simplified card/grid-table multiselect approximations as generated-final package content.

Data-list custom form root content-area padding uses the same hard gate: every generated or upgraded New, Edit, View, Detail, or custom form under `Data.Childs[].Layouts[].LayoutInResources[].Resource` or `Childs[].Layouts[].LayoutInResources[].Resource` must parse to a root with `attrs.container.cw = "2"` and the same `--sp--s0` token-array padding. Scalar zero, numeric object zero, `attrs.common.padding`, or `attrs.style.padding` alone remain compatibility fallbacks only and do not satisfy generated-final validation. Normalize existing data-list custom form roots to this shape before signing, installing, importing, or upgrading. Inner form sections, cards, grids, controls, and content wrappers may keep intentional spacing.

## Generated-Final YAPK ID And Navigation Hard Gates

Generated-final `.yap` and `.yapk` wrappers must use FontAwesome application icon mode. The top-level `IconUrl` must be a JSON string with `b`, `i`, and `c`; `i` must be a FontAwesome class string, and `b`/`c` must be valid colors. Reject blank/null icons, image URLs, `https://img.yeeflow.com/...`, data images, SVG, emoji, and non-FontAwesome token values. Run `scripts/validate-application-icon.js --package <file.yap|file.yapk>` before signing, import/install, upgrade-check, upgrade apply, or handoff. The selected icon should match the business domain according to documented mapping or generation-report rationale.

Generated-final `.yapk` output must use API-issued numeric content IDs from `GET /utils/generate/ids?count=<n>` and must emit a redacted `dist/<app-name>-id-provenance-report.json` with `sourceMarker: "api-generated"`, path-to-purpose mappings, duplicate checks, unused-ID accounting, generator provenance metadata, and no non-API IDs. Local ID generation, hardcoded generated IDs, copied sample/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds are forbidden for generated-final `.yapk`. Runtime navigation groups must include API-issued `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list[]`; children must include `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`, with dashboards/pages as `Type: 103` plus `LayoutID`, approval forms as `Type: 105`, and data lists as `Type: 1`. Run `scripts/validate-yapk-id-provenance.mjs` and `scripts/validate-yapk-navigation-runtime-metadata.mjs`; stop before signing, install, upgrade-check, or handoff if either gate fails. `setsign`/`verifysign` and install acceptance do not prove ID provenance or navigation runtime metadata completeness.

YAPK upgrade ID stability hard gate: upgrade/new-version `.yapk` output must preserve IDs for existing semantic resources from the previous package/lineage manifest. Only newly added resources may consume newly API-issued IDs, removed IDs must not be reused, replacing all IDs is a hard failure, and `scripts/validate-yapk-upgrade-id-stability.mjs` must pass before signing, upgrade-check, upgrade apply, install-like writes, or handoff. Missing previous package/manifest fails closed; signing/install/upgrade acceptance is not ID-continuity proof.

## Dashboard Grid-Table Collection Pattern Gate

Dashboard record-list sections that require the grid-table visual/runtime pattern must use grid-table style `collection` controls, not dashboard `data-list` controls, unless the user explicitly requests Data table. Pair each Collection with a header `flex_grid` in one wrapper container, set both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`, and stop before signing, install, upgrade-check, or handoff if `scripts/validate-dashboard-grid-table-collections.mjs` fails. Planned row-click details require `attrs.data.link`, `attrs.data.opentype = "slide"`, `attrs.data.modalsize = 2`, and a concrete Type `1` custom detail layout with schema-compatible `LayoutView`; hide duplicate dashboard headers with `attrs.hideHeaderAll = true`, use visible title typography such as `attrs.heads.ty = [null, "h5-medium"]`, include Text style metadata, and never let helper metadata leak into encoded package objects. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

## UI Summary/KPI Runtime Hard Gates

Generated-final UI validation must enforce `docs/standards/ui-summary-kpi-runtime-hard-gates.md`. High-quality UI claims require a page-by-page implementation contract, export-proven style shapes, grid/table quality checks, and runtime screenshot evidence; install/signing/API acceptance is not visual proof. Run `scripts/inspect-yeeflow-ui-design-contract.mjs`, `scripts/inspect-dashboard-style-shapes.mjs`, `scripts/inspect-grid-table-quality.mjs`, and `scripts/inspect-runtime-evidence.mjs`.

Summary/KPI validation must keep four proof states separate: designer-configured Summary control, validator-valid Summary contract, runtime-proven visible dynamic KPI rendering, and seed/business-semantic value correctness. Run `scripts/inspect-dashboard-summary-control-contract.mjs` and `scripts/inspect-visible-kpi-runtime-bindings.mjs`. Fallback KPI values pass only when explicitly labeled fallback, and dynamic visible binding remains a gap unless the exact UUID Summary v1.0.1 shape plus before/after mutation proof is present or another focused runtime proof exists. When seed/runtime evidence provides `expectedKpis`, visible KPI text must match those seed-derived expected values before reporting business KPI correctness.

Accept a runtime-proven dynamic visible KPI verdict only for the exact UUID Summary v1.0.1 shape plus before/after source data mutation evidence and refreshed/recalculated after-evidence. The package-side shape must include UUID Summary IDs, matching layout-resource `Resource.ReportIds[]`, matching layout-resource `Resource.exts[]`, layout-resource `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible `attrs.headc.title.variable[]`, and complete Summary field metadata. Summary recalculation can be asynchronous or cache-delayed; stale after-evidence is not proof. Semantic/non-UUID Summary IDs, unsupported surfaces, and other visible binding shapes remain unproven unless focused runtime proof exists.

YAPK UI upgrades must also pass `scripts/inspect-yapk-upgrade-app-identity.mjs` in addition to `scripts/validate-yapk-upgrade-id-stability.mjs`. Fail ListSetID drift, fresh-install classification for update requests, existing app identity drift, out-of-scope resource mutations, existing resource ID reallocation, missing package lineage, and stale final `Resource.ReplaceIds` coverage.

##
YAP approval designer-shape validation: generated-final approval form YAPs must fail for missing or duplicate control IDs, unresolved control ID references, unproven control families, missing heading/text native values, placeholder heading text such as `Here is the title`, label/native text mismatch, missing child `ListType`, incomplete list/layout/DefResource metadata, invalid `NoRule`, unpublished form status, and missing app group IDs in `Resource.ReplaceIds`. Apply these as generated-final/import-qualified checks, not global historical export blockers.
 Canonical Schema Files

YAPK validation uses `schemas/yapk-schema.json`. YAP validation uses `schemas/yap-schema.json`. Do not hardcode versioned schema filenames in runtime logic. To update a product schema standard later, replace the canonical file contents while keeping these filenames unchanged. Keep YAP and YAPK schema standards separate: YAPK uses `AppExportPackageInfo`, Brotli `AppPackageInfo`, and `Childs[].Fields`; YAP uses the YAP wrapper, `[______gizp______]` gzip `ListExportResult`, `Defs`, and `SimplePortal`.

## Generated-Final YAP Contract

For existing customer/product exports, use compatibility mode and avoid rejecting historical exports globally. For plugin-generated final/import-qualified YAP packages, enforce both schema validation and `docs/standards/yap-generation-contract.md`.

Generated-final validation must fail thin synthetic skeletons, short local IDs, wrong pageurl/childshape ID type shape, empty or incomplete `Resource.ReplaceIds`, incomplete root/list/layout/field/form/process metadata, missing app-level export structures, non-string or malformed field `Rules`, malformed decoded `DefResource`, malformed form `Settings`, malformed layout/view `Ext` JSON, and reports that mark API accepted/queued as import success. Approval `DefResource` is not sufficient merely because it decodes: generated-final approval workflows require request/task/print page registrations where planned, designer-safe `formdef.children`, `MultiAssignmentTask`, task assignee metadata, task URL aliases, graph positions, and explicit Approved/Rejected paths.

Northpeak regression hardening: generated YAP data-list `FieldType` must be only `Text`, `Bit`, `Decimal`, or `Datetime` from `schemas/yap-schema.json`. Do not emit `Int`, `Date`, legacy `DateTime`, `Boolean`, `Number`, `Bool`, or helper/storage names in `FieldType`; keep UI/control type in `Type`. Generated approval forms must include request and task page `key` plus mirrored `pageUrl`/`pageurl`/`PageUrl`, request page `type=1`, outer `pagetype=1`, embedded `formdef.pagetype=1`, task page `type=2`, outer `pagetype=1`, embedded `formdef.pagetype=2`, StartNoneEvent `taskurl`/`taskUrl`/`TaskUrl` resolving to the request page, and a real task node such as `MultiAssignmentTask` with valid `approveway` and non-empty `usertaskassignment`. Treat `validate-yap-graph.js` as authoritative for real approval graph branching; form-workspace inspectors are helper/structural checks when they assume a minimal Start-to-End workflow.

Product schema refresh v0.6.18: the canonical YAPK schema now requires decoded `AppPackageInfo` to include `ListSet`, `Pages`, and `Childs`; optional modules such as `Forms`, `FormNewReports`, `DataReports`, `Groups`, `Tags`, `Metadatas`, `Agents`, `Connections`, `Knowledges`, `Themes`, and `Components` are not canonical root requirements unless required elsewhere by the schema. Keep canonical schema validation separate from internal completeness and plan-conformance validation.

Leave Request guardrails: generated-final YAPK validation must flag placeholder/all-zero `Sign` values, local-only grouped navigation using `children`/`Childs`, unresolved dashboard/page/form/list navigation targets, and approved-plan approval workflows that produce `Forms: []`. Do not let local schema validation imply upload readiness; signing with `setsign` plus `verifysign`, API install acceptance, and runtime UI proof are separate report sections.

Product schema refresh v0.6.17: generated custom YAP/YAPK fields must use storage-code `FieldName = FieldType + FieldIndex`, for example `Text1`, `Decimal1`, `Bit1`, or `Datetime1`. `Datetime` is canonical; legacy `DateTime` is invalid for generated packages. Business labels belong in `DisplayName`. Custom fields use `IsSystem=false` and `FieldIndex >= 1`; the native `Title` field uses `FieldName="Title"`, `IsSystem=true`, and `FieldIndex=0`. Generated YAPK packages must include all canonical required metadata for structures that are present, using schema-compatible empty values instead of `undefined` or unsupported `null`.

Plan conformance v0.6.22: validation must separately report schema validation, package validation, workflow graph validation, UI/materialization validation, plan-conformance validation, YAPK signing, signature verification, API install/import acceptance, runtime UI inspection, deferred items, and known risks. A package can pass schema/package checks and still fail the approved app plan. Run `scripts/validate-functional-specification.mjs <spec.md>` and `scripts/validate-app-plan-resource-order.mjs <plan.md>` before generation for standard Markdown requirements/plans, and run `scripts/validate-app-plan-conformance.mjs --plan <plan> --package <package>` for generated apps with an approved plan. Missing standard plan headings, missing resource generation order, missing Placeholder planning, mixed Form Report/Dashboard planning, missing `Generation Contract and Hard Gates`, missing approval-form contract, missing navigation contract, missing proof boundary, missing recommended next prompt, or missing advanced capability coverage for data-list views, custom list forms, list workflows, scheduled workflows, notifications, AI Agent/Copilot resources, custom code/custom CSS, and golden/template references are plan-contract errors for future generated app plans. Missing planned resources are errors unless explicitly deferred with a reason. Grouped navigation requested by the plan must use `Type: "classes"` plus `list`; local-only `children`/`Childs` group shapes are generated-final errors. Do not let schema/package pass imply plan-conformance pass.

Generated-final resource completeness v0.8.2 training: before signing readiness, run `scripts/validate-generated-final-resource-completeness.mjs --plan <yeeflow-app-plan.md> --package <app.yapk|decoded.json>` or pass `--plan <yeeflow-app-plan.md>` to `scripts/yapk-first-generation-preflight.mjs`. This gate blocks shell or partial generated-final surfaces when the approved App Plan declares resources that are absent from decoded output. It fails planned approval forms with `Forms: []`, planned Form Reports with empty `FormNewReports[]`, planned Data Reports with empty `DataReports[]`, planned dashboards whose Type 103 page is only `Main > Content` with `Content.children = []`, planned dashboard metrics/filters/record regions without corresponding generated controls, and planned navigation groups/items reduced to a generic/default group. Omissions are allowed only when the App Plan explicitly marks the item deferred with reason, fallback/user impact, and required follow-up/proof. Findings must include the App Plan reference and decoded package path; do not sign, install/import, upgrade, or hand off a package that fails this gate.

Existing-app YAPK upgrade validation must be stricter than schema/signing/API acceptance. Before signing readiness, upgrade-check, upgrade apply, or handoff, require: `validate-yapk-upgrade-id-stability.mjs`, `validate-yapk-upgrade-scope.mjs`, `validate-yapk-upgrade-report-scope.mjs` when reports are present or intentionally changed, and `inspect-yapk-upgrade-version-row.mjs` after apply. Field-only/list-only upgrades must declare exact scope and must not mutate dashboards, approval forms, workflows, navigation, FormNewReports, or DataReports unless explicitly declared. Duplicate existing reports fail unless update-safe proof is supplied. Visible default-view fields must be present in both layout and query with matching FieldID/FieldName. Upgrade API status `0` means submitted/accepted only; final success requires Version Management row `Succeed` plus separate runtime proof. Failed Version Management rows must capture sanitized exact View error log text. Approval DefResources included in upgrades must be export-shaped/designer-safe and must fail for non-UUID page IDs, duplicate designer control IDs, missing Main/Content containers, missing graph positions, missing task URLs, missing assignees, or ambiguous Approved/Rejected routes.

Advanced capability validation: compare the package and generation report against the plan for required data-list views, custom/public forms, list workflows, scheduled workflows, notifications, AI Agents/Copilots/knowledge/resources/tools, custom code/custom CSS, Form Reports, document views/forms, and named golden template/function references. Treat runtime execution and delivery as separate proof: configured workflows, notification rules, AI tool bindings, external/API/email actions, row mutations, and custom code controls are not runtime-proven until tested in an authorized tenant.

Runtime binding lessons v0.6.19: run `scripts/validate-runtime-binding-lessons.mjs <decoded-app-or-package>` for generated-final packages that include dashboards, approval forms, app navigation, app groups, service portal decisions, requester-context actions, signing/API proof reports, or policy catalogs. It catches visual-only KPI cards, Summary controls missing source fields/exts/report ids, unconsumed filter variables, invalid dashboard filter consumer fields, lookup filters using display labels, static-only approval pages, missing request/task page URLs, missing workflow panel/history, unreachable navigation resources, small placeholder app group ids, service portal payloads when excluded by plan, old `__variables_` requester-context tokens, and API/signing proof-boundary overclaims.

## YAPK Schema v5 Standard Additions

YAPK validation uses the effective composed schema loaded through `scripts/lib/load-yapk-schema.js`: product-team canonical `schemas/yapk-schema.json` plus Codex overlay `schemas/yapk-schema-codex.json`. The `x-yeeflow-standard-additions` section is actionable and not optional. Generated YAPK output must strictly follow those standards before signing, install dry-run, upgrade check, upgrade apply, or handoff. Package generation must stop if the generated output violates the effective schema or any enforceable standard addition. API install success is not runtime render proof; report local validation, API acceptance, queued import, and runtime materialization/render proof as separate scopes.


## FormNewReports Workflow Report Standard

Product clarification for v0.6.9 and v0.6.18: `FormReports` is the legacy workflow report collection and is not required by the canonical YAPK schema for generated apps. `FormNewReports` is the current workflow report collection when workflow reports are planned or generated. Generated workflow reports must be written to `FormNewReports`; validators must not require `FormReports`. A generated package with workflow report content only in legacy `FormReports` is invalid because current workflow reports must use `FormNewReports`.

## v0.6.5 First-Generation YAPK Validation

Generated YAPK validation must run before signing, not only after runtime failure. Use `scripts/yapk-first-generation-preflight.mjs --package <file.yapk> --json` for generated packages, and include `--plan <yeeflow-app-plan.md>` whenever generation was based on an approved App Plan. It combines canonical schema checks, FontAwesome application icon validation, decoded `AppPackageInfo` checks, data-list system schema gates, dashboard shell/Data table/Text-control gates, dashboard generation hard gates from Facility Maintenance review, generated-final resource completeness when a plan is supplied, ID safety gates, and redacted output checks. A package that fails this gate is not eligible for `setsign`, install, upgrade check, upgrade apply, or user handoff.

Generated dashboard packages and final/install/upgrade/runtime reports must pass `scripts/validate-dashboard-generation-hard-gates.mjs` before signing readiness, signing, install/import, upgrade, or final success reporting. Include `--plan <yeeflow-app-plan.md>` when dashboard generation was based on an approved App Plan so planned dashboard KPI/Summary, filter, and record-display regions must materialize instead of passing as empty shells. This is a generator/package/reporting hard gate only, not a Functional Specification or App Plan requirement. It rejects missing select/radio/checkbox filter display/value/style metadata, raw Container widthtype strings or missing layout keys, KPI card Heading/Text icon placeholders, Summary controls without matching designer field-selection `Resource.exts[]` and visible temp-variable binding, planned dashboard shells with empty `Content.children`, and canonical app URLs that use install/import operation return IDs instead of decoded package `$.ListSet.ListID`.

Generated-final dashboard and YAPK validation must now fail closed for the 0.8.9 and 0.8.24 Office Asset findings: KPI cards that lack Summary controls plus `ReportIds`/`exts`/`tempVars`/visible `save_var` binding; filters that are not consumed by Collection/table/KPI query/filter metadata; filter operator/value placeholders such as bare `0`; Collection/Data table/Summary/KPI/record controls inside `page_title_section`; grid-table record regions implemented as simplified Data table lookalikes instead of reference Collection subtrees; multiple unrelated grid-table Collections sharing one `content_card_wrapper`; user/identity fields rendered as generic Dynamic field controls; visible Dashboard source-template residue or generic control labels such as `Grid`, `Container`, `Text`, or `Placeholder`; and generated-final packages embedding sample rows under `Childs[].ListDatas`, `Childs[].List.ListDatas`, or `Childs[].List.Items`. Run `scripts/test-yapk-dashboard-runtime-materialization-preflight-gates.mjs` with the dashboard/YAPK suites when changing these rules.

For generated-final YAPK signing readiness, `scripts/yapk-first-generation-preflight.mjs --package <file.yapk> --plan <yeeflow-app-plan.md> --json` is the gating command when a plan exists. Do not call `setsign` if preflight fails canonical schema, decoded export-shape, generated-final resource completeness, ID provenance, app icon, navigation runtime metadata, dashboard materialization, or redacted-output checks. API status `0` means submitted/accepted only; final install/upgrade success requires async materialization proof plus separate browser/runtime proof against the decoded package root `ListSet.ListID`. Runtime proof must fail `Install failed` tiles, empty `Start to build with Components` shells, model-load errors, empty dashboards after seed, and visible source-domain/control-name residue.

Generated dashboard packages must also pass the default Dashboard Golden Reference conformance gate. Validate the registry/reference quality, selection, blueprint, package export-shape parity, and runtime filter proof when linkage is claimed with `scripts/validate-dashboard-golden-reference-conformance.mjs`; dashboard packages must preserve the selected `_ak_c` / `_ak_c_opt` component-region shape, selected sub-region provenance, required type/full-width/filter contracts, FontAwesome icons, `dynamic-user` rendering for user fields, and app-specific domain fields instead of copying Marketing Event fields such as Event, Stage, Region, Registration, or Budget into unrelated apps. When Dashboard Page Layouts v1.1 is present, v1.1 is the page shell and Event Portfolio regions are validated inside approved v1.1 slots; do not require the Event Portfolio root-depth/order contract at the page root, but still reject competing copied Event Portfolio root shells, invented layout modules, and business controls directly under root `Content`.

Generated dashboard packages must also pass Dashboard dataset presentation Golden Reference conformance. Run `scripts/validate-dashboard-dataset-presentation-golden-references.mjs` against the registry, App Plan, and generated package. Every Dashboard Collection must use one approved presentation template from `docs/reference/dashboard-dataset-presentation-golden-references.json`; validators should fail missing provenance, unknown template IDs, simplified/provenance-only Collections, grid-table/header/item mismatches, missing multiselect action contracts, missing search/fulltext linkage, App Plan-selected templates not materialized, region/template mismatches, collapsed template diversity, missing planned Collection regions, and missing explicit Collection-root provenance.

Generated dashboard packages must also pass Type `103` root-binding validation. Every decoded `Pages[]` item with `Type: 103` must set `ListID` to decoded `ListSet.ListID`; the page `LayoutID` remains the dashboard layout resource ID, and navigation may target that `LayoutID`. A copied dashboard page that retains a source/baseline page `ListID` is invalid because it can install without surfacing in the app. Stop on `YAPK_DASHBOARD_PAGE_ROOT_BINDING_INVALID` or `DASHBOARD_V11_CONTENT_PADDING_MISMATCH` before signing, install, upgrade-check, upgrade apply, or handoff.

Runtime application links must be based on wrapper `ListID` / decoded `ListSet.ListID` when package-root proof exists. Install response `Data.ID` is not application-root proof unless explicitly named as `ListSetID` or equivalent. Preserve sanitized non-secret API `Message` text for non-zero package API statuses. Status `540017` means already installed in tenant; stop fresh-install retries and proceed through upgrade-check / upgrade-apply with lineage proof.

Account Health regressions are now hard blockers: schema-forbidden decoded `AppID` fields, non-string or missing root `ListSet.LayoutView`, sample values that are not strings under `Childs[].List.Items`, missing native/system `Title`, generated `Text0` primary fields, FieldName/FieldIndex suffix mismatches, FieldName/storage-family mismatches, dashboard shells without the `src` marker, mismatched `LayoutInResources` IDs, Data table columns without `Field`, and ad hoc generated `type:"text"` Text controls.

## Full Application Visual Quality Gate

Vendor Onboarding full UI v2 proved that import/install success is not enough. Do not call a generated package a full UI application unless it implements the approved plan and mockup-derived pages, forms, controls, bindings, and actions at usable quality. Blank or generic Data List custom forms are quality failures. Default/plain buttons without action bindings are quality failures. Default alert copy such as `Alert` or `Here is the description` is a quality failure. Kanban and Collection controls without meaningful dynamic item templates and item actions are quality failures.

For full application generation, run `scripts/inspect-generated-app-quality.mjs --package <package> --spec <approved-spec.md> --strict-visual-app-quality` before handoff. The strict gate must fail missing planned pages/forms, missing print pages, underbuilt dashboards, missing safe padding/card structure, placeholder controls, default buttons, missing actions, empty Kanban/Collection templates, and undocumented deferred scope. Do not return a minimal or technically importable scaffold when the user asked for the full approved application.

Before full application package generation, create a page-by-page composition checklist and get it approved when the app is mockup/spec driven. The checklist must name each required page section, Yeeflow control, source list, displayed fields, layout/card/grid/padding rule, button/action binding, item template, fallback, validation rule, and pass/fail status. Do not generate a package directly from high-level requirements when the user expects a full designed app. The generated package must implement every approved checklist item or explicitly defer it with a reason, fallback, and validation impact. Treat the approved composition checklist as the generation contract; do not generate or return a package unless every required checklist item is implemented or explicitly deferred with reason.


## Template Library Contract

Full application generation must use the reusable Yeeflow UI section template library when one is available. Composition checklist sections must reference a known `templateId` from `docs/templates/yeeflow-ui-section-template-library.normalized.json`, and generated packages must satisfy the referenced template's required controls, data bindings, fields, layout/card/padding rules, style rules, and action rules. Feature knowledge alone is not enough; use reusable UI templates for dashboard headers, KPI cards, alert cards, Data table sections, Kanban/Collection item cards, detail headers, sectioned forms, document checklists, print pages, and action bars.

Inside an installed plugin cache or a repo checkout, the packaged template registry must be available at `docs/templates/yeeflow-ui-section-template-library.normalized.json`; validators should pass it as `--template-library docs/templates/yeeflow-ui-section-template-library.normalized.json`. If this path is missing, treat the installed plugin package as incomplete and refresh/reinstall from the `stable` channel before generation.

Generate full applications page by page. Validate each page/form/dashboard against template conformance before assembling or returning a package. Do not satisfy a template with placeholder controls, title-only cards, default alert copy, blank custom forms, or active buttons without valid action bindings. If a template cannot be implemented safely, explicitly defer the section with a reason, fallback, and validation impact before generation.
Use the reference app corpus as the first source of export-proven UI section patterns before inventing new layouts. Prefer safe patterns from `Company Overview (3).yap`, `Data Lists (4).yap`, `Projects Center_2.yap`, and `Sales_Management_AD.yap` for advanced dashboard controls, custom list forms, Kanban/Collection item templates, actions, Data tables, related-record sections, filters, and operational workspaces. Use `DEMO Innovation Ecosystem Platform (1).yap` / `NHIC Innovation Overview` and `Service Desk Pro (2).yap` / `Executive Dashboard` as KPI dashboard references. Use `Online Library.yap` / `Inventory` and `Print Inventory` plus `Online Library (1).yap` / `Print Inventory` as multi-inventory print and per-item QR references. Use `Sales Quotation.yap` and `Sales Quotation (1).yap` as single-item print and print-QR references. For print pages, QR Code should bind to current item/current record or a business code field; do not generate static placeholder QR URLs. A new broad golden app is no longer needed for known template-library gaps, but browser print/page-break and scanned QR destination behavior still need runtime/manual proof.

When a composition checklist references `three_column_workspace_shell`, validate it as an optional declared pattern only. Check for left/main/right panel containers, meaningful panel content, no designer drop-zone placeholders, current dashboard wrapper rules for dashboard hosts, and correct approval task URL pagetype rules for task hosts. Do not enforce this layout globally on packages that do not declare the pattern.

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

When generating this pattern, build a row shell with left navigation, ticket/list collection, selected-record workspace, and right attributes/detail regions. Navigation rows should be icon plus text containers with click/form actions. Filter controls and menu actions should set variables consumed by collection filters or queries. Collection item actions should set selected/current record state. Details panels should use dynamic field/user/file controls bound to the selected record only when the exact host/control shape is export-proven for the target surface. For YAP approval/form workspaces, the designer-load-proven baseline is `list`, `container`, `heading`, and `icon`; generated approximations of `collection` and `dynamic-field` caused the approval form designer to keep loading, so validate them as risky unless explicitly marked/export-proven. Comment/update actions must target the selected record and related activity list only when the binding is validated. Avoid placeholder-only panels, fake Submit Request buttons, and claims of selected-record behavior when the actions and bindings are not implemented.

Before signing, install, upgrade, or handoff, run template conformance when a checklist declares `multi_column_form_workspace_shell`, `four_column_service_desk_workspace`, `service_desk_inbox_workspace`, or `action_driven_ticket_workspace`. Treat `FORM_WORKSPACE_*` findings as generated-final blockers for pages that claim this pattern, including behavior errors (`FORM_WORKSPACE_NAV_ACTION_MISSING`, `FORM_WORKSPACE_FILTER_VARIABLE_MISSING`, `FORM_WORKSPACE_COLLECTION_FILTER_MISSING`, `FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING`, `FORM_WORKSPACE_DETAIL_BINDING_MISSING`, `FORM_WORKSPACE_ICON_ACTION_MISSING`, `FORM_WORKSPACE_FAKE_SUBMIT_BUTTON`) and runtime layout-property errors (`FORM_WORKSPACE_SHELL_LAYOUT_PROPERTIES_MISSING`, `FORM_WORKSPACE_COLUMN_WIDTH_MISSING`, `FORM_WORKSPACE_COLUMN_HEIGHT_MISSING`, `FORM_WORKSPACE_COLUMN_OVERFLOW_MISSING`, `FORM_WORKSPACE_DIRECTION_INVALID`, `FORM_WORKSPACE_ELEMENT_GAP_MISSING`, `FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE`, `FORM_WORKSPACE_VERTICAL_TEXT_RISK`, `FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY`). Use `docs/studies/normalized/service-desk-pro-form-workspace/reference-property-map.normalized.json` before generating this pattern; default-container-only or semantic-only four-column layouts must fail before package handoff. API install success is not runtime interaction proof; manually verify that columns render side by side, navigation filters, selected ticket refresh, detail bindings, comments, and collapse/expand actions work.

For YAP approval/form workspaces that claim `multi_column_form_workspace_shell`, run `scripts/inspect-yap-form-workspace-generation.mjs <package.yap>` in addition to YAP schema, materialization, graph, and UI quality checks. This scoped validator catches Service Desk v8 lessons: app-level form `ListID = 0`, Type `105` navigation, aligned form keys/DefResource keys, `formdef.children` instead of unsupported `formdef.controls`, lowercase export-style controls, designer-safe control families, Start/SequenceFlow/End workflow graph, Start task URL, hidden form header, Full width, padding `0`, inline Icon/Text/Button/Dynamic field controls, contextual bounded icons, shell Hidden overflow, independent Scroll/Auto column overflow, keyed `ListDatas`, row keys that resolve to `Defs[].FieldName`, stringified field `Rules`, and v8-compatible Service Desk field numbering.

For generated YAP packages, validate `Resource.ReplaceIds` against the final decoded package, not against an earlier baseline. It must include every generated local root app/listset, child list, field, layout/custom form, approval form/process, workflow shape/resource, app group, and local sample record ID that Yeeflow must remap on import. It must exclude tenant/user metadata and external dependency IDs. Treat `REPLACEIDS_EMPTY`, `LOCAL_ID_NOT_IN_REPLACEIDS`, and truncated missing-ID findings as generated-final blockers. The broad Service Desk YAP test proved that stale baseline `ReplaceIds` can pass API queue acceptance and then fail async import.

Treat hard `YAP_*` form-workspace findings as blockers for generated form workspaces: `YAP_FORM_LISTID_MATERIALIZATION_INVALID`, `YAP_FORM_NAV_TYPE105_MISSING`, `YAP_FORM_KEY_MISMATCH`, `YAP_FORM_DEFKEY_MISMATCH`, `YAP_FORMDEF_CONTROLS_UNSUPPORTED`, `YAP_FORMDEF_CHILDREN_MISSING`, `YAP_FORM_CONTROL_EXPORT_SHAPE_INVALID`, `YAP_FORM_DESIGNER_READABLE_TREE_MISSING`, `YAP_FORM_DESIGNER_UNPROVEN_CONTROL`, `YAP_LISTDATAS_KEYED_RECORDS_MISSING`, `YAP_LISTDATA_FIELD_UNKNOWN`, `YAP_FIELD_RULES_NOT_STRING`, `YAP_SERVICE_DESK_FIELD_NUMBERING_DRIFT`, `YAP_WORKFLOW_START_MISSING`, `YAP_WORKFLOW_SEQUENCE_MISSING`, `YAP_WORKFLOW_END_MISSING`, `YAP_WORKFLOW_START_TASKURL_MISSING`, `YAP_FORM_PAGE_HEADER_NOT_HIDDEN`, `YAP_FORM_PAGE_WIDTH_NOT_FULL`, `YAP_FORM_PAGE_PADDING_NOT_ZERO`, `YAP_ICON_WIDTH_NOT_INLINE`, `YAP_TEXT_WIDTH_NOT_INLINE`, `YAP_BUTTON_WIDTH_NOT_INLINE`, `YAP_DYNAMIC_FIELD_WIDTH_NOT_INLINE`, and workspace overflow/icon sizing errors. Keep `YAP_NATIVE_TITLE_SCHEMA_CONFLICT` as a warning, not a hard failure, when the package uses runtime-safe native `Title`. Treat package API `Status=0` and `Completed=false` as queued import acceptance only; it does not prove async import completion or designer materialization.

## Public Tenant Safety

- Never hardcode a tenant-specific Yeeflow URL. Use `https://<yourdomain>.yeeflow.com` in docs and examples.
- Before Yeeflow API work, check local auth status with `node scripts/yeeflow-oauth-status.mjs` or `node scripts/yeeflow-api-auth-smoke.mjs`.
- Before using a Yeeflow REST API, check the capability map with `node scripts/yeeflow-api-list-capabilities.mjs` or `scripts/lib/yeeflow-api-capabilities.mjs`.
- Use only documented capabilities from the map. Do not guess endpoint paths or expose unrestricted raw API calls; report missing API coverage when no mapped capability exists.
- Prefer Browser OAuth-backed Yeeflow API calls for user-facing usage. If OAuth is not authenticated, ask the user to sign in to Yeeflow using the plugin login flow; never ask for a Yeeflow password. If this runtime cannot start the plugin login action, ask the user to open the Yeeflow plugin login action in Codex, then retry the original request.
- Prefer read-only capabilities for inspection and verification. Require explicit user confirmation for write capabilities and stronger confirmation for package install/import/upgrade/delete.
- Use OAuth for normal user-facing API access; if OAuth is not authenticated, ask the user to sign in through the Yeeflow plugin login flow.
- Keep legacy `YEEFLOW_API_KEY` mode as an internal fallback only where existing code still supports it; do not ask users to paste API keys, OAuth tokens, auth codes, cookies, Authorization headers, or client secrets into chat.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- Support `YEEFLOW_PROFILE` where scripts support profiles. It selects one active local tenant profile per run using `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and `YEEFLOW_<PROFILE>_TENANT_ID`.
- Validate and redact environment variables before API calls and never print API keys, OAuth access tokens, refresh tokens, ID tokens, auth codes, cookies, Authorization headers, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, or generated runtime packages.
- Keep generated examples tenant-neutral unless the user explicitly requests a target-tenant-specific package and provides safe mappings.

## Generated UI Quality Validation

Generated application validation must include UI quality checks before import or handoff. Run `scripts/inspect-generated-ui-quality.mjs` and the aggregate import-readiness gate when available. Treat Data table controls with a data source but zero display columns as generated-final errors. Dashboard Data table columns must use `attrs.listarr[].Field` for the source field binding and `attrs.listarr[].FieldName` for the visible label; missing `Field` must fail generated-final validation because Vendor Onboarding v1.11 showed it causes the runtime deleted-fields query error. Display columns must resolve to fields on the selected source list.

Dashboard pages and Data List custom forms should have safe left/right padding through a root or near-root container/section. Missing safe padding is at least a warning and can block handoff when the generated page visibly places major content against the window edge. Major dashboard controls directly under the page root without a wrapper container/section should warn.

Generated root dashboard shells should use the current export-proven shape from the Vendor Onboarding v1.93 `New Dashboard`: root `Type = 103`, `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and `LayoutInResources = []` when no inline page resource is present. Generated-final validation should flag legacy blank dashboard shells with `DASHBOARD_USES_LEGACY_SCHEMA` or `DASHBOARD_CURRENT_VERSION_MARKER_MISSING`. If a dashboard includes inline page resources, continue validating the page JSON, data sources, controls, and table columns normally. Vendor Onboarding v1.12 is import-proven for current-dashboard inline content with a simple Data table using `Field` source bindings.

Empty dynamic item templates, unresolved data-bound controls, missing progress/steps values, and buttons/actions without valid bindings should be reported before runtime testing. Do not classify a generated package as ready when table, form, dashboard, or data-binding quality checks fail.

## Plan-To-Package Validation

For full application generation, validate against the saved Markdown app plan when available. Use `scripts/inspect-generated-app-quality.mjs --package <package> --plan <plan.md>` to combine plan presence, package inventory, and generated UI quality checks. Planned data lists, important fields, forms, approval forms/task pages, dashboards/pages, reports, navigation, major controls, workflows/actions, permissions/integrations, Data table columns, layout padding, and bindings must be present or explicitly documented as deferred with a reason and workaround.

Do not mark a package ready when it implements only a simple/MVP subset of a full-scope plan. Missing plan coverage is a generated-final error when the plan has machine-readable checklist items or when a human review clearly shows planned features were omitted. If the plan is prose-only, report coverage gaps as warnings and require manual review before handoff.

The app plan should include a `UI/UX and Control Mapping` section. During validation, check that controls were selected with business rationale, Data tables have display columns, Collection/Kanban/Timeline templates include meaningful dynamic fields, dashboards/forms have padding and grouping, advanced controls have meaningful content, Custom code is not used where standard controls would be better, and the generated package matches the mapped page/form/dashboard design.

When a UI implementation spec exists, validate against it with `scripts/inspect-generated-app-quality.mjs --package <package> --spec <spec.md>` or with both `--plan` and `--spec`. The spec should come from mockup images, screenshots, wireframes, or design descriptions and should map every visible section to Yeeflow controls, bindings, actions, styling, custom CSS, or Custom code. Structural gaps against the spec should block handoff when they prove the package simplified or omitted the design.

Business Travel runtime-practice update: `yap-v1-schema_v2.json` and the Business Travel repair pass make `ListModel.Flags = 1` mandatory for generated root and child list-like resources. `ListModel.Status` is schema-fixed to `1` when present, and `ListModel.Type` must be one of `1`, `16`, `32`, `64`, `128`, or `1024`. Import, app open, workflow open, and workflow publish are user-proven for the fixed Business Travel package only. Workflow publish blockers must still be caught separately for new packages: sequence-flow conditions, Set Variable targets, task-assignment expressions, form bindings, and summaries must reference declared workflow variables; direct position assignees require numeric position IDs and must never use placeholders such as `__POSITION_ID_REQUIRED_*__`. Workflow execution, request submission, routing, data mutation, and true Finance Manager assignment remain unproven.

YAPK-from-scratch validation update: validate generated `.yapk` content before signing. Decoded `AppPackageInfo` must pass package/app creation checks, graph checks, workflow publish-readiness checks, placeholder scans, and final ID/remap coverage checks before Brotli/base64/sign. Treat `YAPK_CONTENT_VALIDATION_FAILED_BEFORE_SIGNING` as blocking. `setsign` and `verifysign` prove wrapper/resource integrity only; they do not prove generated-app correctness, workflow publish-readiness, workflow execution, or tenant-specific routing.

YAPK schema v4 validation rule from Vendor Onboarding v1.13-v1.15, updated for v0.6.18 canonical schema: validate `.yapk` as `AppExportPackageInfo`, decode `Resource` as base64 Brotli JSON, and require decoded `AppPackageInfo`. Fail YAPK packages that decode to YAP `ListExportResult` with `YAPK_RESOURCE_NOT_APP_PACKAGE_INFO`. Require `Childs[].Fields` rather than `Defs`, preserve `LongAsString` fields as numeric strings, keep generated package `AppID = 41` where applicable, and fail missing dashboard Data table `attrs.listarr[].Field` source bindings with `DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING`. Optional no-portal structures should be omitted unless a proven portal module is generated; empty-object `PortalInfo: {}` and empty-array `PortalInfo: []` remain invalid legacy shapes.

## Core Rule

Validate before import. Do not runtime-test a package with blocking structural, graph, wrapper, workflow, list, field, materialization, FlowKey, or unsafe `.yapk` issues.

New application creation defaults to `.yapk`; `.yap` should be generated only when explicitly requested or when a fallback/debug task specifically requires it. Existing app upgrade `.yapk` validation should defer to `yeeflow-yapk-package-generator`. Product schema defines `.yapk` as `AppExportPackageInfo` with `Resource` described as Brotli-compressed `AppPackageInfo`. Treat `.yapk` content generation as proof-boundary-sensitive until the exact generated content type passes Resource decode/edit/encode/sign/verify/runtime-upgrade.

When package API automation is in scope, validate request shaping before execution, confirm the active workspace, and require explicit confirmation for install/upgrade. API result summaries should classify `success`, `already_installed`, `api_rejected`, and `http_rejected` so duplicate/already-installed responses do not get mixed with unknown validation failures.

For any Yeeflow REST API operation, consult `scripts/lib/yeeflow-api-capabilities.mjs` first. If the needed capability is absent, do not invent an endpoint; report the gap and use browser/manual workflow only if the user allows it.

Validation is not runtime proof. When validating a newly learned capability, report whether the package is export-proven, validator-backed, import-proven, configuration-visible, render-only, partial, or runtime-proven. Use validator hard errors only for proven invalid generated shapes; otherwise prefer warnings/dependencies and require a focused runtime baseline before broad runtime claims.

Data Filter validation: use `scripts/inspect-data-filter-controls.mjs` with dashboard packages and enforce the rules from `docs/studies/data-filter-controls.md`. Value-producing Data Filter bindings must resolve to `page.filterVars[]`; downstream `__filter_` expression tokens in `attrs.data.filter[]`, `attrs.data.fulltext[]`, `attrs.data.sortingfilter[]`, and `exts[].attr.settings.Conditions[]` must resolve; click-apply filters must reference an existing Apply button; explicit Remove filters targets must resolve when present; Search, Radio, Hierarchy, and Sorting variants are dashboard export-proven from the CRM sample; unknown filter control types and unsupported variable shapes should warn first unless export evidence proves them invalid. `docs/studies/data-filter-controls-runtime-proof.md` adds generated dashboard import/open/render proof for Search, Radio, Range, Sorting, Apply button, and downstream table/chart surfaces, but does not upgrade Remove filters reset, Hierarchy interaction, all operators, approval-form filters, or data-list-form filters to runtime-proven.

Pivot Table validation: use `scripts/inspect-pivot-table-controls.mjs` with dashboard packages and enforce the rules from `docs/studies/pivot-table-control.md`. Pivot Table dashboard controls must have a matching `page.exts[]` `PivotTable` entry; the data source must resolve to a supported list-like source; row, column, and value fields must resolve to source fields; `SUM`, `AVG`, `MIN`, and `MAX` require compatible numeric/currency fields where detectable; date grouping must only be applied to date/time fields; and filter condition fields plus `__filter_<filterVarId>` variable references must resolve. Generated-final validation should fail unresolved Pivot Table references, unsupported Approval Form/Public Form hosts, and incompatible generated aggregations. Unknown schema variants should warn first in compatibility/source-export mode unless a focused export proves them invalid. This is export-proven and validator-backed, not runtime proof.

Seed/add-readiness validation: `docs/studies/pivot-table-control-runtime-proof.md` strongly indicates that v1 missing seed rows and Add failed came from crossed data-list field storage metadata caused by cloning `Defs[]` by array position. Generated-final validation must hard-error `FIELD_NAME_FIELDTYPE_MISMATCH`: `Text*` fields need text storage, `Datetime*` fields need date/datetime storage, `Decimal*` fields need decimal/number storage, `Bigint*` fields need integer storage, and `Bit*` fields need boolean storage. Use the app-creation rules inspector and aggregate import-readiness gate before handing off analytics/demo packages with seed data.

System schema validation: apply `docs/yeeflow-system-configuration-schema-specifications.md` and run `scripts/validate-data-list-system-schema.mjs` for generated or repaired data lists. Generated-final validation should hard-error missing native `Title`, custom `Text0` primary fields, unsupported field `Type`, duplicate `DisplayName` / `FieldName` / `InternalName`, invalid `InternalName`, `FieldName` suffix mismatches, empty select/radio/checkbox/tag options, legacy-only Rules.Options choice paths, unresolved lookup targets, missing `Title` in the default view, and generated default lists that keep unsafe custom `ListModel.LayoutView` routing without an export-proven form route.

LayoutView add-form readiness: `docs/studies/data-list-layoutview-add-form-runtime-fix.md` proves a generated Data List can import/open but leave the default `+ New item` modal loading forever when `ListModel.LayoutView` contains only `opentype.add` / `modalsize.add` and no concrete `add` layout reference. The user-confirmed fixed package proves Add modal rendering for the focused generated Container/Button action package when `LayoutView.add/edit/view` resolve to concrete Type `1` layouts and object-shaped display-settings `sort` is omitted. Generated-final validation must hard-error `LAYOUTVIEW_ADD_LAYOUT_MISSING` when a generated Data List lacks a resolvable `LayoutView.add` custom form target, and hard-error unsupported display-settings sort object entries such as `{ SortName, SortByDesc }`. Type `0` view layout sort objects are separate and remain valid only inside `Layouts[].LayoutView`, not `ListModel.LayoutView`. Do not classify Add form save/data mutation or other resource hosts as proven from this package.

Collection/Kanban action validation: use `docs/studies/collection-kanban-actions.md` and `scripts/inspect-collection-kanban-actions.mjs` for dashboard Collection/Kanban local item actions. Generated-final validation should hard-error unresolved item-template `attrs.control_action` references, unresolved page/temp variable references, unresolved current-item fields, unresolved `listitem` target layouts, and unresolved `setdatalist` fields. Validate local `attrs.actions[]` as arrays, prefer local action `type = "coll"`, require nonempty steps, allow export-proven step types (`listitem`, `deleteitem`, `setdatalist`, `setvar`, `confirm`, `otheraction`) and keep unstudied/screenshot-only step types warning-first until export-proven. Bulk selection patterns should validate declared selected IDs/count variables, dynamic display references, and page-level bulk actions. Runtime mutation proof currently covers only the user-tested v2 generated package.

Collection/Kanban runtime-proof validation note: `docs/studies/collection-kanban-actions-runtime-proof.md` records the user-confirmed correct-project v2 runtime pass. Keep the validator gate strict on action bindings, variable references, target layouts, and update fields. Do not reuse earlier wrong-project runtime claims; the runtime proof is limited to the tested v2 package and actions.

Correct-project v2 validation note: `<local manual-test package path>` reported zero errors from package validation, graph validation, import-readiness, Collection/Kanban action inspection, and Kanban/Collection Dynamic inspection before the user runtime pass. Warnings are acceptable only when documented as non-blocking and not promoted beyond the tested scope.

## Validation Workflow

1. Identify the package type and source of truth. Preserve generated `.yap` files unless the task explicitly asks to regenerate them.
2. Run available repo validators for package, graph, workflow, data list, wrapper round trip, materialization, expressions, dashboards, and custom code.
3. Inspect field/list integrity and FlowKey safety.
4. Classify every finding as blocking, warning, or informational.
5. Decide whether import/runtime testing is safe.
6. Report exact commands, files checked, findings, and next actions.

Use [package-validation-lifecycle.md](references/package-validation-lifecycle.md) for the detailed sequence.

## Planning Coverage Inputs

When a generated package comes from a full application build, compare validation scope against its `Capability Coverage Plan` when available. The validator guidance should make sure selected capabilities are actually checked and partial/deferred capabilities are not accidentally promoted to runtime-ready claims.

Planning-sensitive checks include signed `System.Int64` ID boundaries, AI Agent/Copilot numeric `Publisher`, document-library Type `16` and folder rules, Doc library control references, data-list and scheduled workflow designer metadata, `QueryData`/`AI`/`MailTask` references, application settings navigation/header/user-group structures, app-resource access tool permissions, and secret/private-data scans. This is a validation-scope check, not a reason to add new hard errors unless the invalid shape is already proven.

## Required Validation Areas

Load [yap-materialization-rules.md](references/yap-materialization-rules.md) when package materialization or import safety is in scope. Check:

- `validate-yap-package`
- `validate-yap-graph`
- `validate-ywf-def`
- `validate-ydl-list`
- workflow action config validation
- expression smoke tests
- wrapper round trip
- materialization inspection
- custom code inspection
- dashboard inspection
- FlowKey safety
- prefix or `pr<id>x` corruption checks
- app-wide unique `FieldID`
- `field.ListID` equals parent data list `ListID`
- unique `FieldName`, `InternalName`, and `DisplayName` inside each list
- `FieldName` storage prefixes aligned with `FieldType`, so generated seed rows and Add new item use runtime-compatible list field storage
- no remapping of `TenantID`, `CreatedBy`, or `ModifiedBy`
- no numeric-looking generated ID exceeds the signed `System.Int64` maximum, especially `LayoutID`
- generated app-contained AI Agent/Copilot resources use numeric `Publisher`, normally `0`, rather than `null`
- data-list workflow DefResource includes designer-open metadata: pageurls array, variables.basic/listref/filter arrays, flowPage array, graphposition, graphzoom, graphver, childshape id/resourceid, node position, and SequenceFlow source/target id/resourceid
- generated data-list Add Item triggers keep `FlowMappings.Setting.NewTrigger = true`, `FlowMappings.FieldName = null`, and `Data.Forms[].Settings = null`
- app-resource access tool `resources.dataLists.items[]` entries use compact `id` plus numeric bitmask `permissions`
- application settings validate root `LayoutView.sort[]`, navigation groups, app-resource menu references, `attrs["navigator-menu"].position`, header `attrs.appearance`, and `Data.AppGroups[]`

For document libraries, also check:

- `ListModel.Type = 16`
- root app navigation references the library as `Type = 16` for mixed/richer apps; document-library-only packages may use the sample-proven root `LayoutView = {"sortVer":1}` with no Type `103` page or nav, reported as warnings
- top-level `Resource.SimplePortal = null`
- default fields exist: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, and `Text4`
- `Text4` uses `Type = "file-upload"` and library upload rules
- `Title` keeps document-library native metadata and is not forced into normal data-list `Status = 0`
- field `ListID` values match the parent library `ListID`
- `FieldID` values are unique across the app
- Type `0` view field references resolve when view JSON is present
- Type `1` custom form bindings resolve to library fields
- partial document-library `ListModel.LayoutView` assignments are warnings; the runtime-proven minimal base is the `New Document Library` shape with default Type `0` view `LayoutView = ""` and the single `New file` form unassigned, while configured libraries assign `add`, `edit`, and `view` together
- multiple Type `16` document libraries with simple custom fields and configured Type `0` views are runtime-accepted by the `Enterprise Document Center` v2 pass
- root-level folder rows are runtime-accepted when `Text1 = "folder"`, `Bigint1 = "0"`, `Bigint2 = ""`, `Text2 = ""`, `Text3` carries the export-style unique name, `Text4` is omitted, and folder IDs are included in `ReplaceIds`
- nested folder rows should warn unless their nonzero `Bigint1` parent resolves to another folder row
- folder rows should warn if they include uploaded file payloads or document binaries
- generated packages do not embed raw file/document payloads unless focused runtime export-back proof exists

For Doc library controls on dashboards and form-hosted JSON surfaces, also check:

- controls use `type = "document-library"`
- `attrs.data.list.ListID` resolves to an included Type `16` document library
- `attrs.data.list.Type` is `16`
- `attrs.listarr[].Field` values resolve to target library fields
- `attrs.data.folder.path` folder IDs resolve to `ListDatas` rows in the target library when present
- folder rows referenced by controls use `Text1 = "folder"` and contain no `Text4` upload payload
- `attrs.caption.layout` resolves to a layout on the target document library when present; accept concrete large numeric layout IDs for enum placeholders such as `{LayoutID}`
- caption `display`, `add`, and `search` values are booleans when present
- dynamic `attrs.data.customPath` is an expression-token array when present; warn rather than claim runtime proof
- document-library custom-form controls are runtime-proven for root-bound display and disabled search/add; approval-form controls remain partial until live published request-page proof; data-list custom-form controls remain validation-only

For shared data views on list-like resources, also check:

- each data-list, document-library, or Form Report child resource has at least one view where the resource shape expects views
- exactly one default view is present where possible, detected by `IsDefault = true`
- view names and parsed `Ext1.Url` keys are unique within a resource
- known view type codes are `0` list, `999` gallery, `104` kanban, and `100` calendar
- visible columns in `LayoutView.layout[]`, fixed filters in `LayoutView.filter[]`, user filters in `LayoutView.query[]`, sort fields in `LayoutView.sort[]`, and type-specific field selectors resolve to resource fields or known system fields
- unknown view types, opaque permission audiences, and Type `16`/Type `32` advanced view settings should warn rather than fail until matching exports prove the exact schema
- Form Report `LayoutView.Attr_IsViewDetail` is recognized as the detail-page access flag, but row-click/detail behavior is not runtime proof

For Data List permissions and notifications, use `docs/studies/data-list-document-library-permissions-notifications.md`, `scripts/inspect-data-list-permissions.mjs`, and `scripts/inspect-data-list-notifications.mjs`. Validate `ListModel.Perm`, `IsBreakInherit`, `IsItemPerm`, `AdvanceList`, and view-level `Layouts[].IsItemPerm` warning-first. Validate `RemindRules[]` warning-first: parse stringified `Rules` and `Receiver`, recognize notification Type `1` item-added, Type `2` regular reminder, Type `3` date-field reminder, Type `4` item-changed, and recipient Type `1` user, Type `2` department, Type `3` user group, plus `Receiver.ListDefs[]` list-field recipients. Detailed administrator/basic/advanced permission audience matrices are UI-confirmed but not export-located in `Data Lists (1).yap`; do not hard-fail missing detailed audiences or treat them as generation-ready.

For Form Reports, also check:

- `Data.FormNewReports[]` entries parse `Settings` JSON with `Fields`, `Filters`, and `SubListID`
- `Data.FormNewReports[].DefKey` resolves to an included approval form key
- matching `Data.Childs[]` resource exists with `ListModel.Type = 32` and `ListModel.ListID = FormNewReports[].ID`
- Form Report child resources do not define workflows, public edit/create forms, or sample data mutation surfaces
- field keys/internal names are unique inside the report
- fields reference source approval variables or selected sub-list fields
- variable-to-report-field mappings are compatible when known
- additional settings are present for number, percent, currency, switch, date/time, picker, metadata, and lookup report fields
- no more than one sub-list is selected; warn if multiple-sub-list generation is attempted
- if a sub-list is selected, selected sub-list field mappings exist
- inherited permissions and view detail-page access flags are recognized
- unknown custom permission audiences, export audience details, row multiplication, row-click behavior, Excel export execution, and data-source use are warnings/runtime-sensitive, not runtime proof

## Severity

Use [validation-error-severity.md](references/validation-error-severity.md) to decide what blocks import. When uncertain, mark the finding as blocking until a proven Yeeflow import/runtime counterexample exists.

## Reporting

Report validation as:

- package path and package type
- validators and inspections run
- blocking issues
- warnings
- accepted risks
- runtime import decision
- exact follow-up needed

Do not claim runtime proof from local validation alone.

`docs/studies/data-list-field-creation-runtime-proof.md` upgrades only a focused generated Data List path to runtime-import/open/field-creation proof: representative columns rendered and `Runtime Extra Field` saved without the duplicate-value error. Keep validator warnings for runtime-sensitive field semantics such as lookup value resolution, calculated results, file/image upload behavior, picker selection, sub-list row entry, metadata, and Document Library behavior unless a future focused runtime proof covers them.

<!-- agent-copilot-application-resource-learning:start -->
## AI Agent/Copilot Validation Addendum

Validate app-level OtherModules for Connections, Agents, and Knowledges. Count AI Agent resources as Agents module entries with Type = 0 and Copilots as Type = 1. Validate Settings/Draft JSON, Components arrays, tool Settings.Data.Value references, connected-Agent references, connection references, publisher metadata, and redaction-sensitive Config keys.

Use hard errors only for generated-final invalid JSON, missing generated IDs, missing/null/non-numeric generated AI resource `Publisher`, unresolved generated-final tool references, invalid app-resource access list entries or non-numeric permissions, list-workflow designer shape gaps, signed `System.Int64` overflow IDs, or embedded secret/token/password/API-key values. Use warnings/dependencies for connection-backed tools, credentialstype/run-as settings, OpenAPI operations, application-resource access, and runtime-sensitive external calls.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Scheduled Workflow Validation Addendum

Validate app-level Scheduled Workflow resources as `Data.Forms[]` entries with `WorkflowType = 3`, `ListID = 0`, parseable JSON `Settings`, and parseable JSON `DefResource`. `Settings` should include `TimeZone`, `Times[]`, `StartDate`, `Frequency`, and `Interval`; weekly schedules use `Values[]`, and daily working-day schedules use `IsWorkday: true`.

`Workflow Actions Runtime Baseline (1).yap` proves scheduled workflow Start/Assignment action coverage: `StartNoneEvent` has no incoming flow, has email-notification fields, and omits approval-only terminate/recall fields; scheduled `MultiAssignmentTask` can use the same `properties.usertaskassignment[]` family with an Applicant Line Manager expression. Validate this warning-first and do not require data-list field expression sources in scheduled workflows unless another scheduled export proves them.

For workflow actions, validate `MailTask` recipient/subject/body presence, warn on fixed literal recipients, validate `QueryData` target list references and multi-result output variables, and validate `AI` agent-mode actions resolve `properties.data.AgentID` to an included app AI Agent. `Spark & AI (1).yap` adds proven checks for data-list workflow AI usage: `inputVariables[]` and `outputVariables[]` should be arrays, image inputs can be `type = "img"` with list-field mappings using `valueType = "icon-upload"` or `file-upload`, and data-list workflows should be registered on the host list through `FlowMappings[]` with `Setting.NewTrigger = true` when they are new-item triggered. The Asia Tech manual workflow comparison adds that Add Item new-item triggers should use `FlowMappings.FieldName = null` and `Data.Forms[].Settings = null`; non-null field bindings belong only to separately proven flow-status conditions. For import/open-safe generated baselines, a resolved local `AI` action with no credentials is a runtime-sensitive dependency rather than a package-blocking error; unresolved Agent references, unresolved `QueryData` targets, unresolved app-resource tool list references, unsafe real recipients, embedded secrets, and credential-bearing external actions remain blockers. Treat AI execution, image analysis, and row-update tools as runtime-sensitive unless explicitly configured for a safe sandbox.
<!-- scheduled-workflow-ai-assistant-learning:end -->

<!-- workflow-assignment-task-assignee-learning:start -->
## Workflow Assignment Task Assignee Validation Addendum

Validate `MultiAssignmentTask.properties.usertaskassignment[]` warning-first. `Test ABC.yap` export-proves methods `direct`, `expression`, `position`, `positionorg`, `positionorgexpr`, `positionloc`, and `positionlocexpr`; each entry should include `type`, `method`, and `title`, with `value` for direct/static/expression forms and `position` for position-based forms. `Test ABC (1).yap` adds multiple assignee entries, user-group expression, position all-users expression, `issequential`, `approveway` variants, custom percentage, and email notification fields. `Test ABC (2).yap` adds absent `tasktype` approval/default, `tasktype="complete"`, due-date fields, working-calendar flag, and `notifyrules[]` reminder timing. `Test ABC (3).yap` adds approval-form Start action `terminate`, `terminate-conditions`, `revoke-conditions`, and Start email notification. `Purchase Requests.ydl` adds data-list workflow Start email settings without terminate/recall fields, list-item assignee expressions such as Created By -> LineManager, and data-list task form controls with `isListControl` plus `____customListFields_` bindings. Warn for missing/empty/opaque assignee config, unknown methods, missing position references, missing static values, expression values that are not expression-button-shaped strings, list-item assignee expressions that lack runtime proof, direct-user tenant sensitivity, unknown task type, malformed due-date/reminder settings, malformed Start action condition settings, email-enabled nodes missing recipient/subject/body fields, and unresolved data-list task-form field bindings. Do not hard-error compatibility exports or claim routing, Complete task execution, due-date scheduling, recall/terminate behavior, data-list list-field routing, task-form save/edit behavior, or email delivery proof until a focused runtime baseline passes.

`Workflow Actions Runtime Baseline (2)_Task forms.yap` adds approval workflow task-form validation guidance. Validate `Data.Forms[].DefResource.pageurls[]`: submission pages use `type=1`, task pages use `type=2`, and generated `MultiAssignmentTask`/`CandidateTask` nodes must resolve to task pages. AP Approval demo runtime practice adds a generated-final hard gate: task nodes must carry `properties.pagetype = 1`, task page references must be mirrored across `taskurl`, `taskUrl`, and `TaskUrl`, referenced task page hosts must have outer `pagetype = 1`, and embedded task `formdef.pagetype` must be `2`. Missing/null TaskUrl, unresolved task form IDs, task pages with outer `pagetype = 2`, or task formdefs with `formdef.pagetype != 2` are hard errors for generated approval workflow packages. Warn when a task form is likely incompatible with the task type. Warn when custom `action_button.attrs.control_action` values are missing, unresolved, or point to an action whose Submit form operation does not match the button label. `Workflow Action Approval Test.ywf` corrects the Add others/Add assignee binding and should be used as the positive reference: Add others resolves to `submitType = "5"`, Reject resolves to `submitType = "2"`, Reassign resolves to `submitType = "4"`, and Complete resolves to a complete/default submit action by task context. The focused `Workflow Task Form Runtime Baseline` imported, opened, rendered the task-form selector and workflow designer, and published successfully, so the task-form configuration family is import/open/designer/publish-proven. Warn when reassign/add-assignee Submit form steps lack a user-valued expression, when comment/remark expressions reference missing variables, or when custom complete/approval operations are paired with the wrong `tasktype`. Treat Action Panel buttons as derived from task context; do not require explicit child buttons under `workflowControlPanel`. Do not claim task operation execution, task-owner field persistence, reassign/add-assignee behavior, Complete task execution, or email delivery until a safe operation-level baseline observes them.

`Workflow Actions Runtime Baseline (3)_Claim task.yap` adds Claim Task validation guidance. Validate `CandidateTask` warning-first: receiver/candidate config should live in `properties.usertaskassignment[]`, task forms should resolve through `properties.taskurl`, explicit `tasktype` should be `approve` or `complete`, due-date/email fields should preserve their studied shapes, and data-list Created By/list-item receiver expressions should remain expression-button strings. Warn on the config-reference typo `properties.tasktype ` with a trailing space because the export uses `properties.tasktype`. Do not treat Claim Task claim-pool behavior, group expansion, list-field expansion, claim locking, quick completion, or email delivery as validator/runtime proof.

`Workflow Actions Runtime Baseline (4)_Set variable.yap` adds Set variable validation guidance. Validate `SetVariableTask` warning-first: `properties.formtype` should be `current` or `custom`, `properties.variablesetting[]` should be a nonempty array, and each assignment should include `idx`, `id`, `name`, `type`, and an expression-token-array `value`. For `formtype="custom"`, warn if `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.ProcKey`, or `properties.formids` is missing. Warn that data-list `exprType="list_field"` values are export-proven only as right-side expressions; Set variable should not be used as proof of list-field mutation.

`Workflow Actions Runtime Baseline (5)_Set data list.yap` adds Set data list validation guidance. Validate `ContentList` warning-first: `properties.listtype` should be `current` or `select`, `properties.type` should be `add`, `edit`, or `remove`, selected-list mode should include `appid`, `listsetid`, and `listid`, and add/edit should include `properties.listdatas[]`. Each mapping should include `Columns`, `Per`, and expression-token-array `Data`; export-proven `Per` codes are `0`, `1`, `2`, `3`, and `4`. Edit/remove should include nonempty `properties.wheres[]`; warn strongly when filters are missing or empty because update/delete is high-impact. Data-list `exprType="list_field"` values and sub-list/detail mappings are export-proven schema only. Do not treat record mutation, current-list update, document-library mutation, numeric operation execution, or sub-list row iteration as runtime proof.

`Workflow Actions Runtime Baseline (6)_Signal event.yap` adds Signal event validation guidance. Validate `SignalEvent` warning-first: it should have no incoming flow, at least one outgoing flow, and nonempty `properties.eventdefinitions[]` containing `CancelEventDefinition` and/or `RevokeEventDefinition`. Graph validation should allow `SignalEvent` as a no-incoming event-source component root alongside `StartNoneEvent`. Warn if Signal event appears outside approval-form workflows until an export proves another host, and reuse Set data list broad-filter checks for downstream cleanup branches. Do not treat recall/terminate firing or cleanup mutation as runtime proof.
<!-- workflow-assignment-task-assignee-learning:end -->

<!-- application-settings-navigation-user-groups-learning:start -->
## Application Settings Validation Addendum

Validate application settings from the root app `Data.Item.ListModel.LayoutView` JSON string. Menu structure lives in `sort[]`; menu layout lives in `attrs["navigator-menu"].position`; header appearance lives in `attrs.appearance`.

Use hard errors for generated-final malformed structures: unparseable `LayoutView`, invalid layout position values, nested navigation groups, depth greater than two, group missing text, non-object menu items, resource children on non-group items, missing resource references, non-boolean `IsHidden`, non-boolean `hideTitle`, and invalid header height types. Use warnings for runtime-sensitive or partially understood shapes such as unstudied positive header heights, null icons, member-looking app-group fields, process/link menu items, and group IDs missing from `ReplaceIds`.

Runtime-proven layout values for generated packages are `default`, `left`, `onheader`, and `none`. Runtime-proven no-icon is `Icon: ""`; custom `DisplayName`, omitted `DisplayName` resource-name fallback, `Type: "classes"` groups, and `list[]` child resources are runtime-proven. App user groups are `Data.AppGroups[]` records with `ID`, `Name`, and `Description`; empty groups are settings-visible runtime-proven and group IDs belong in `ReplaceIds`, but member schema is not export-proven. Generated packages must not embed real user emails or private identities in app group metadata.

Workflow assignment task assignee validation should remain warning-first in compatibility mode. `Test ABC (1).yap` export-proves multiple `MultiAssignmentTask.properties.usertaskassignment[]` entries, user-group expression, position all-users expression, `issequential=true`, absent-`issequential` parallel/default shape, `approveway` variants, custom percentage, and email notification fields. Validators should warn for unknown assignee methods, unknown `approveway`, invalid `issequential`, missing custom percentage, and incomplete email notification shape, but should not hard-error existing exports solely from this study.

For assignment-routing API coverage, `yeeflow-api-operator` can safely confirm documented read-only categories for users, user detail, departments, locations, location detail, positions, position assignments, groups, and group members. This supports validation/planning only; do not turn API-readable org data into hard package errors or runtime-routing claims.
<!-- application-settings-navigation-user-groups-learning:end -->

<!-- app-creation-rules-learning:start -->
## App Creation Rule Validation Addendum

Use `docs/studies/yeeflow-app-creation-rules.md` and `scripts/inspect-app-creation-rules.mjs` for product-team app creation rules. In generated-final mode, hard-error duplicate `DisplayName`, `FieldName`, and `InternalName` within one list; identifier length above 255; invalid `InternalName` characters; generated non-system `FieldName` missing a numeric suffix; any `FieldName` numeric suffix that does not equal `FieldIndex`; and `FieldName`/`FieldType` storage-family mismatches that can break seeded rows and Add new item behavior.

Hard-error invalid process keys (`Data.Forms[].Key`, `FlowKey`, and decoded `defkey`) when they contain anything outside `[a-zA-Z0-9_]` or exceed 255 characters. For approval forms, hard-error missing or malformed `NoRule`, missing `{index}` in `NoRule.Prefix`, and invalid `StartIndex`, `CustomLength`, or `AutoIncrement`. Unknown list field `Type` values remain warning-first unless a focused runtime/import failure proves a specific type invalid.

Runtime proof update: `docs/studies/yeeflow-app-creation-rules-runtime-proof.md` confirms a fixed workflow field-rule package with these checks imported, opened, and allowed a new data-list field to be saved without the previous duplicate-value error. Keep validator output precise: this proves the field-rule guardrails for the tested package, not workflow routing, data-list workflow execution, or Form Report runtime behavior.
<!-- app-creation-rules-learning:end -->

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; generated non-system `FieldName` suffix matching `FieldIndex`; and generated seed/add-ready fields keeping `FieldName` storage prefix aligned with `FieldType`. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom List Form Validation

Use `docs/studies/data-list-custom-form-fields.md` and `scripts/inspect-data-list-custom-forms.mjs` for Data List custom form validation. `Data Lists (3).yap` export-proves custom list forms as Type `1` layouts with embedded JSON in `LayoutInResources[0].Resource`, display assignment through `ListModel.LayoutView.add/edit/view`, and list-bound controls under a `container` -> `container` -> `flex_grid` shell.

Validate custom list forms separately from approval submission/task forms. Check that embedded form resources parse; `children`, `filterVars`, and `tempVars` are arrays; control ids are unique; list-bound `binding` and `fieldID` resolve to the same `Defs[]` field; `action_button.attrs.control_action` resolves to `actions[].id`; `formAction` hooks resolve; `setvar` action list-field targets resolve; temp variable references resolve; and sub-list parent controls include `attrs.list-variables[]` plus `attrs.list-fields[]`.

Validate display settings in `ListModel.LayoutView` separately from embedded form layout content. New/Edit/View assignments in `add`, `edit`, and `view` must resolve to `default` or an existing custom form `LayoutID`. Known opening modes are `modal` for Pop-up window and `slide` for Slide in; missing New/Edit mode defaults to Pop-up window and missing View mode defaults to Slide in. Known sizes are `0` Medium, `1` Small, `2` Large, and `3` Full screen; missing size is Default. Unknown modes/sizes and Full page size assumptions should warn first unless future product evidence proves they break import/open.

Nested sub-list controls use `attrs.list_field = true`, `attrs.list_field_binding`, `attrs.list_control_id`, and scoped bindings such as `field_1`; do not hard-fail them as missing top-level list fields. Unknown action step types, unknown control shapes, and Document Library applicability should warn until export/runtime proof exists. Runtime form rendering, save behavior, action execution, sub-list row entry, and Document Library custom forms are not proven by this export.
<!-- data-list-custom-form-fields-learning:end -->

<!-- data-list-public-form-learning:start -->
## Data List Public Form Validation

Use `docs/studies/data-list-public-forms.md` and `scripts/inspect-data-list-public-forms.mjs` for Data List Public Form validation. Public Forms live in `Data.Childs[].PublicForms[]`; each entry should include parseable JSON-string `Resource` with `pagetype = 3`, `children[]`, `attrs`, `tempVars`, and `ver`.

Validate Public Forms separately from Custom List Forms and approval forms. Check that list-bound controls resolve to fields in the same list, control ids are unique, `Resource.children` is an array, known public-field disallow rules are enforced, and a collection form includes a `submit-button`. Hard-error generated-final public forms that include Id/Created/Modified default fields, login-dependent fields, known UI-unavailable field types, or unresolved `binding`/`fieldID` references. Treat unknown controls/settings warning-first until product or runtime proof says they break import/open.

The export-proven top-level public field allowlist from `Data Lists (4).yap` is `input`, `textarea`, `richtext`, `input_number`, `percent`, `currency`, `switch`, `radio`, `checkbox`, `datepicker`, `time`, `file-upload`, `icon-upload`, `rate`, `hyperlink`, `signer`, and `list`, with `Title` as a special primary-field exception. Public share URLs and codes must be redacted in committed docs, normalized refs, and validation reports.

For generated Public Form runtime packages, warn on thin/non-export-shaped grid attrs if they make designer settings unreliable. Prefer `flex_grid` with `ver: 1`, structured `columns`/`rows`, `cgap`, and `cgapU`; use `displayLabel: [null, false]` for layout-only grids; and prefer a centered submit container with inline submit width `common.positioning.widthtype: [null, "2"]`. `docs/studies/data-list-public-form-runtime-proof.md` proves import/open/designer/control-render for this focused pattern only, not anonymous submit or data mutation.
<!-- data-list-public-form-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Validation

Use `docs/studies/yap-schema-standard.md` and `scripts/inspect-yap-schema-standard.mjs` for product-team YAP schema checks. Hard-error malformed wrappers, missing `[______gizp______]` `Resource` prefix, malformed decoded `Resource`, missing `ListExportInfo.Item`, missing `Defs`/`Layouts`, `Defs: null`, `Layouts: null`, and non-array `Defs`/`Layouts` on root or child list-export items. Empty `[]` is valid.

Preserve the existing hard errors for invalid process keys, invalid approval/process `NoRule`, and missing `{index}` in `NoRule.Prefix`. Validate AI Agent/Copilot Access app resource permission bitmasks for approval forms, data lists, document libraries, and AI agents. Warn, do not hard-fail, for `formReports` and `dataReports` permission bit conflicts until product team clarifies schema Read `8` versus rules-doc Submit `1`.

Do not enforce schema `additionalProperties: false` as a global hard error yet; treat unknown product fields as warnings because the provided schema is partial relative to known exports.
<!-- yap-schema-standard-learning:end -->
<!-- projects-center-import-failure-hardening:start -->
## Generated App Import-Readiness Validation

For newly generated `.yap` files, do not accept compatibility validation as the final result. Run strict generator/final package validation, strict graph validation, materialization inspection, schema-standard inspection, app-creation rules inspection, data-view/dashboard/page reference checks, wrapper round trip, placeholder scan, and safety scan. `scripts/inspect-yap-import-readiness.mjs` is the preferred aggregate gate when available.

Generated-final structural errors include missing/invalid Type `1` `ListModel.ListType`, unsafe native `Title` metadata, unresolved data-view columns or stale system pseudo-fields, mismatched `LayoutInResources` IDs, unresolved dashboard dynamic-display/filter references, unresolved collection `ListDataID` context filters, and `ReplaceIds` entries for `TenantID`, `CreatedBy`, or `ModifiedBy`. Warning-level results are acceptable only when classified as non-import-blocking runtime/export-derived warnings.

For generated-final YAPK packages, run `scripts/validate-generated-yapk-export-shape.mjs` before signing readiness. It is a package-generation/materialization gate, not a Functional Specification or App Plan requirement. Fail approval forms with noncanonical or minimal `DefResource`, missing request/task page registrations, missing `formdef.children`, duplicate designer IDs, missing workflow graph IDs/links/task URLs/positions/variables/key consistency; fail count-only `FormNewReports`/`DataReports`; fail dashboard shells, hidden Summary hosts counted as visible KPI/content proof, Summary/chart controls without full runtime-proven model contracts, and synthetic-only controls not bound to included resources; fail native Title fields missing `Status: 0`, `IsSystem: true`, or `IsIndex: true`. Treat wrapper `TenantID` as tenant metadata, not generated app content ID provenance.

For dashboard resources inside generated-final YAPK packages, the golden-reference gate is part of signing readiness. Do not accept `Main > Content` alone, semantic shells, or provenance-only markers as proof: the generated dashboard must carry `derivedFromGoldenReference` and preserve the selected export-shaped control tree, with planned filters, KPI wrappers, KPI row, section containers, grid-table Collection regions, and optional secondary grid-table sections present when planned.

Dashboard Collection dataset presentation validation is a signing-readiness gate. Run `scripts/validate-dashboard-dataset-presentation-golden-references.mjs --package <package.yapk> --app-plan <yeeflow-app-plan.md>` whenever Dashboard `collection` controls are generated or upgraded. Each App Plan dataset region must select exactly one approved Collection presentation reference using the registry guidance, and each generated Collection must be inside approved Dashboard Page Layouts v1.1 business-content slots such as `section_content_area`. Fail packages that invent Collection templates, simplify selected templates, place Collection templates under root `Content` or copied source shells, carry source-app fields, labels, IDs, or domain text instead of current-app mappings, fail to generate a planned region, generate a different template for the region, or collapse multiple planned templates into one effective generated template. Grid-table-specific validation applies only to grid-table templates; it must not require card multiselect templates to contain grid header/item grids, table column parity, or grid-table row-detail links. If an App Plan does not declare row/card open behavior, require explicit no-open metadata instead of unresolved or placeholder links.

The same dataset gate also validates source template fidelity. Do not sign if `collection-control-card-with-multiselect-toolbar.template.json` or `collection-control-grid-table-with-multiselect.template.json` has Text controls missing `attrs.heads.ty` or plain-string `attrs.heads.color`, grid-table multiselect wrapper gap missing `attrs.container.gap = 0` / `attrs.style.gap = [null, 0]`, or grid-table multiselect detail-open source contract missing `attrs.data.link = "{{DetailLayoutID}}"`, `attrs.data.opentype = "slide"`, and `attrs.data.modalsize = 2`. Generated packages must replace `{{DetailLayoutID}}` with a concrete Type `1` detail layout id that belongs to the source list before signing.

When an approved App Plan exists, run `scripts/validate-generated-final-resource-completeness.mjs --plan <yeeflow-app-plan.md> --package <app.yapk|decoded.json>` before signing readiness. The parser must understand the current unified App Plan schema, including `Page name:` lines, `Dashboard Page Name` tables, Dashboard Filters, Summary Metrics, and Record Display Control Selection tables. Do not treat a valid current App Plan as zero planned resources; `GENERATED_FINAL_APP_PLAN_RESOURCE_PARSE_EMPTY` is reserved for truly unparseable resource-like plans.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Container/Button Action Validation

Use `scripts/inspect-container-button-actions.mjs` with dashboard packages that contain actionable Containers or Buttons. `AP Approval Demo v3.yap` export-proves shared action settings for dashboard `container` and `action_button` controls, with action codes `2` Link, `5` Add list item, `6` Open dashboard, and `8` Open approval form.

Generated-final validation must fail unresolved Container/Button action targets: Link without URL/expression URL; Add list item without a resolvable `attrs.data.list.ListID`; passvalues that reference fields missing from the target list; selected `layout` IDs that do not resolve; Open dashboard without a resolvable Type `103` `PageID`; Open approval form without a resolvable approval form `ProcKey`; unknown generated action types; unknown open modes; and invalid custom size objects. Compatibility/source-export mode should warn first for unknown variants.

The aggregate import-readiness gate includes the Container/Button action inspector. It should not fail unrelated non-Pivot packages solely because the optional Pivot Table inspector cannot find a literal page named `Dashboard`, but it must still fail generated-final unresolved Container/Button action targets.

Focused runtime proof in `docs/studies/container-button-action-runtime-proof.md` confirms representative generated current-app action navigation after local validation. Validator-backed checks still do not prove save/submit/workflow execution, cross-app targets, form-action binding, permissions, or all open-mode/size combinations.
<!-- container-button-action-settings-learning:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Dynamic Content Validation

Use `scripts/inspect-sub-list-dynamic-controls.mjs` for packages that contain Approval Form or custom-form Sub List controls. Validate that `type = "list"` controls bind to a list variable whose value resolves to a listref, displayed fields and summaries resolve to row fields, Dynamic content layout has a `list-body` template, and row field controls inside the template keep `attrs.list_field_binding` equal to the parent Sub List binding.

Validate Sub List list actions separately from normal form actions. `attrs.actions[]` on the Sub List is the local action store; action buttons inside `list-body`, row-menu `dropbar`, or `list-footer` should resolve to those local action IDs. Export-proven step types are `list_new`, `list_import`, `list_dup`, `list_del`, and `list_move`; Insert before/after use `list_new` with `attrs.position = "0"` or `"1"`, Move up uses `list_move` without attrs, and Move down uses `list_move` with `attrs.moveMode = "2"`. Preserve `.dynamic-list .list-footer` CSS when present, but do not require it globally.

Runtime-proof candidate validation: `generate-sub-list-dynamic-actions-runtime-proof.mjs` emits a minimal Approval Form package with one Dynamic Sub List and local actions `list_new`, `list_dup`, `list_del`, and `list_import`. For this package, require zero generated-final errors, a passing `scripts/inspect-sub-list-dynamic-controls.mjs` summary with one Dynamic Sub List, valid row field bindings inside `list-body`, valid footer/action button references, and schema-standard wrapper success before manual import. Validator success is still not runtime action proof.

Table-style Dynamic Sub List validation: warn when a generated Dynamic Sub List with multiple row fields leaves its caption visible, lacks a grid/flex_grid as the first `list-body` layout structure, or uses a body grid whose child count does not match configured column tracks. Header/body layout grids should hide captions and use export-shaped responsive column settings; malformed grid shapes can render as one column and can make Designer Appearance settings fail to expand.

Row operation menu validation: warn when menu buttons do not resolve to local Sub List actions, when menu labels duplicate, or when Delete appears in the menu and as a visible last-column row action. Do not hard-error these while V1.4 Insert/Move runtime behavior is pending.

Data List custom form Print Page validation: `Sales Quotation.yap` export-proves a Type `1` custom form target named `Print Page`, a read-only/display-oriented Dynamic Sub List bound to a Sub List field, and a `View Quotation` form action step `type = "print"` with `attrs.printtype = "select"`, a resolvable `attrs.layout`, and `attrs.listdataid[]` carrying current `ListDataID`. Generated-final packages should hard-error missing or unresolved print target layouts and missing current-record context when the schema clearly requires it. Warn when the resolved target is not print-named, when print Dynamic Sub List field bindings do not resolve to `Rules["list-variables"]`, or when read-only print forms expose Add/Import/Edit row actions unexpectedly.
<!-- sub-list-dynamic-content-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Kanban/Collection Dynamic Control Validation

Use `scripts/inspect-kanban-collection-dynamic-controls.mjs` and `docs/studies/kanban-collection-dynamic-controls.md` for dashboard Kanban/Collection packages and Data List custom forms with Dynamic controls. Validate that Kanban and Collection `attrs.data.list.ListID` resolves to an included source list; Kanban `attrs.data.cateField` resolves to a source field; Dynamic controls inside Kanban/Collection item templates use source `3` and bind to source-list fields; and Dynamic controls on Data List custom forms use source `4` and bind to host-list fields.

Specialized Dynamic controls should match field families: Dynamic user to identity/person fields, Dynamic image to image fields, Dynamic file to attachment/file fields. Use warnings for historical exports and hard errors for clear generated-final mismatches. Do not treat validator success as runtime proof for Kanban rendering, drag/drop, click behavior, image/file preview, or Data List form runtime behavior.

## Timeline Dynamic Control Validation

Use `scripts/inspect-timeline-dynamic-controls.mjs` and `docs/studies/timeline-controls-dynamic-controls.md` for dashboard Vertical Timeline and Horizontal Timeline packages. Validate that `timeline-v` and `timeline-h` controls resolve `attrs.data.list.ListID` to an included source list, that timeline title/date/order fields in `attrs.data.title.variable[]` and `attrs.data.sort[]` resolve to source fields, and that item-template Dynamic controls use source `3` with resolvable `attrs["obj-f"]` bindings.

Apply the same specialized Dynamic control type checks inside timeline templates: Dynamic user should bind to identity/person fields, Dynamic image to image/icon-upload fields, Dynamic file to attachment/file fields, and Dynamic field to general fields. Use warnings for export-limited or historical variants; generated-final packages can hard-error clearly missing data sources, unresolved timeline/date fields, unresolved dynamic bindings, and clear field-family mismatches. Validator success is not runtime timeline proof.

For the focused Kanban/Collection/Timeline runtime proof generated by `generate-kanban-collection-timeline-runtime-proof.mjs`, require package validation, graph validation, schema-standard inspection, materialization inspection, Kanban/Collection Dynamic inspection, Timeline Dynamic inspection, wrapper decode, and import-readiness to report zero errors before manual import. Warnings for environment-dependent user/image/file fields are acceptable when rows intentionally omit private user IDs and binary payloads. The user-confirmed `kanban-collection-timeline-runtime-proof.v1.yap` result proves import/open/render stability for Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values, plus empty-value stability for Dynamic user/image/file controls. It does not prove non-empty user/image/file display, preview/download, drag/drop, click/open behavior, or Data List form runtime behavior.
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
