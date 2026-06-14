---
name: yeeflow-yapk-package-generator
description: Inspect, validate, compare, and plan Yeeflow .yapk existing-application upgrade packages using the product YAPK schema, including AppExportPackageInfo wrapper checks, Resource Brotli/AppPackageInfo decode attempts, signing-boundary guidance, safe redacted summaries, and future edit-encode-sign-runtime generation workflow.
---

# Yeeflow YAPK Package Generator

## UI Generation Hard-Gate Skill

Use `yeeflow-ui-generation-hard-gates` before producing or upgrading `.yapk` packages that include dashboard/UI changes, Summary/KPI dashboards, visible KPI claims, runtime screenshot proof, sandbox page proof, or UI lineage decisions. High-quality UI requires a page-by-page implementation contract; uncertain UI/runtime patterns should be proven on a sandbox page first; use export-proven Yeeflow control/style shapes; Summary/KPI controls require designer-shaped hidden Summary configuration; Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; Summary recalculation can be asynchronous or cache-delayed; semantic/non-UUID Summary IDs and other unsupported shapes remain unproven; for every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback; runtime screenshot evidence is required before claiming UI quality; install/signing/API acceptance is not runtime UI proof; UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope; broad scaffold-like UI must not be claimed as high-quality UI. Data Analytics controls require UUID/runtime-safe IDs for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Preserve existing Data Analytics control IDs during upgrades.

## Generated-Final YAPK ID And Navigation Hard Gates

Generated-final `.yapk` output must use API-issued numeric content IDs from `GET /utils/generate/ids?count=<n>` and must emit a redacted `dist/<app-name>-id-provenance-report.json` with `sourceMarker: "api-generated"`, path-to-purpose mappings, duplicate checks, unused-ID accounting, generator provenance metadata, and no non-API IDs. Local ID generation, hardcoded generated IDs, copied sample/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds are forbidden for generated-final `.yapk`. Runtime navigation groups must include API-issued `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list[]`; children must include `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`, with dashboards/pages as `Type: 103` plus `LayoutID`, approval forms as `Type: 105`, and data lists as `Type: 1`. Run `scripts/validate-yapk-id-provenance.mjs` and `scripts/validate-yapk-navigation-runtime-metadata.mjs`; stop before signing, install, upgrade-check, or handoff if either gate fails. `setsign`/`verifysign` and install acceptance do not prove ID provenance or navigation runtime metadata completeness.

YAPK upgrade ID stability hard gate: upgrade/new-version `.yapk` output must preserve IDs for existing semantic resources from the previous package/lineage manifest. Only newly added resources may consume newly API-issued IDs, removed IDs must not be reused, replacing all IDs is a hard failure, and `scripts/validate-yapk-upgrade-id-stability.mjs` must pass before signing, upgrade-check, upgrade apply, install-like writes, or handoff. Missing previous package/manifest fails closed; signing/install/upgrade acceptance is not ID-continuity proof.

YAPK upgrade app identity hard gate: UI upgrade output must also pass `scripts/inspect-yapk-upgrade-app-identity.mjs` with package lineage metadata before signing, upgrade-check, upgrade apply, install-like writes, or handoff. Generated ListSetID must match the installed/previous app ListSetID, package classification must be upgrade when the user requested an update, existing app identity and existing resource IDs must not drift, existing resources must stay within declared change scope, package lineage must be present, and `Resource.ReplaceIds` must be rebuilt from final package contents. This complements semantic ID stability; install/signing/upgrade acceptance is not ListSetID or runtime UI proof.

## Dashboard Grid-Table Collection Pattern Gate

Dashboard record-list sections that require the grid-table visual/runtime pattern must use grid-table style `collection` controls, not dashboard `data-list` controls, unless the user explicitly requests Data table. Pair each Collection with a header `flex_grid` in one wrapper container, set both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`, and stop before signing, install, upgrade-check, or handoff if `scripts/validate-dashboard-grid-table-collections.mjs` fails. Planned row-click details require `attrs.data.link`, `attrs.data.opentype = "slide"`, `attrs.data.modalsize = 2`, and a concrete Type `1` custom detail layout with schema-compatible `LayoutView`; hide duplicate dashboard headers with `attrs.hideHeaderAll = true`, use visible title typography such as `attrs.heads.ty = [null, "h5-medium"]`, include Text style metadata, and never let helper metadata leak into encoded package objects. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

High-quality dashboard/UI upgrades must also satisfy `docs/standards/ui-summary-kpi-runtime-hard-gates.md`: page-by-page UI implementation contract, export-proven style shapes, Summary/KPI designer-shaped metadata, visible KPI runtime evidence or explicitly labeled fallback, runtime screenshot evidence before UI-quality claims, and Collection grid-table quality when planned. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; other shapes remain unproven unless focused runtime proof exists.

## Canonical Schema Files

YAPK validation uses `schemas/yapk-schema.json`. YAP validation uses `schemas/yap-schema.json`. Do not hardcode versioned schema filenames in runtime logic. To update a product schema standard later, replace the canonical file contents while keeping these filenames unchanged. Keep YAP and YAPK schema standards separate: YAPK uses `AppExportPackageInfo`, Brotli `AppPackageInfo`, and `Childs[].Fields`; YAP uses the YAP wrapper, `[______gizp______]` gzip `ListExportResult`, `Defs`, and `SimplePortal`.

## Leave Request Guardrails

Leave Request runtime repair proved that local YAPK validation, API signing, API install acceptance, and runtime UI proof are separate gates. Never call a generated `.yapk` upload-ready, install-ready, or handoff-ready when `Sign` is still a placeholder or all-zero 32-byte value. When OAuth/API-key access is available, validate content, call `POST /utils/apppackage/setsign`, confirm the expected signature shape, call `POST /utils/apppackage/verifysign`, and report signing proof separately from schema and runtime proof.

If an approved app plan includes an approval workflow/form, do not ship `Forms: []` unless the package is explicitly marked incomplete/staged and the user approves that scope. Generated approval forms must include request/task pages, workflow control panel, workflow history, encoded process `DefResource`, and workflow childshapes.

Root navigation must use export-proven grouped shape `{ "Type": "classes", "list": [...] }`. Do not use local-only `children` or `Childs` navigation groups. Use `Type: 103` for dashboard/page entries, `Type: 105` with `ListID = Forms[].Key` for approval forms, and `Type: 1` with a valid child list ID for data lists. Every intended page/list/form must be visible in navigation or documented as hidden/deferred.

For new generated app plans, require the standard app-plan structure from `docs/app-plan-standard-template.md` when present, or a user-approved lightweight quick outline that still includes Data Model and Lists, Forms and Approval Forms, Application Navigation, UI/UX and Control Mapping, Generation Contract and Hard Gates, Proof Boundary, and Assumptions/Deferred Items, before YAPK generation. Treat its output package, signing, approval-form, navigation, advanced capability, plan-to-package conformance, proof-boundary, and runtime inspection clauses as binding during content validation, signing, and handoff reporting. Advanced capability coverage includes planned data-list views, custom list forms/public forms, list workflows, scheduled workflows, notifications, AI Agents/Copilots/knowledge resources, custom code/custom CSS, Form Reports, document views/forms, and named golden/template references. Do not call these runtime-proven from wrapper validity, schema validity, signing, or API acceptance alone.

## YAPK Schema v5 Standard Additions

YAPK validation uses `schemas/yapk-schema.json`, which now contains v5 schema content. The `x-yeeflow-standard-additions` section is actionable and not optional. Generated YAPK output must strictly follow those standards before signing, install dry-run, upgrade check, upgrade apply, or handoff. Package generation must stop if the generated output violates `schemas/yapk-schema.json` or any enforceable standard addition. API install success is not runtime render proof; report local validation, API acceptance, queued import, and runtime materialization/render proof as separate scopes.


## FormNewReports Workflow Report Standard

Product clarification for v0.6.9: `FormReports` is the legacy workflow report collection and is not required for generated YAPK apps. `FormNewReports` is the current workflow report collection. Generated workflow reports must be written to `FormNewReports`; validators must not require `FormReports`, but may allow it as legacy when old packages include it. A generated package with workflow report content only in legacy `FormReports` is invalid because current workflow reports must use `FormNewReports`.

## v0.6.9 Runtime Hardening Gate

Customer Success Renewal Management proved that schema/signature/API acceptance is still weaker than runtime materialization. Before signing, install, upgrade check, or upgrade apply, generated YAPK packages must pass schema-v5, actionable standard-addition, and product-runtime gates:

- Wrapper is `AppExportPackageInfo`; `Resource` decodes as Brotli/base64 `AppPackageInfo`.
- `AppPackageInfo` required keys are present.
- `AppID = 41` packages use `TableCode: "flowcraft"` and `IndexCode: "flowcraft"` on root and child list resources.
- Optional no-portal structures should be omitted unless a proven portal module is generated; `{}` and `[]` are invalid legacy `PortalInfo` shapes.
- All YAPK read/edit/write scripts use lossless parsing/serialization for 64-bit IDs.
- New package/list/field/layout/dashboard/resource IDs are API-issued. Local fallback IDs, rounded IDs, duplicate IDs, and unsafe JS numeric IDs are blockers.
- After every generated YAPK mutation, validate the final decoded `AppPackageInfo` ID/remap coverage. Do not carry stale object IDs or remap assumptions from a baseline package into a broader generated package; missing final-package IDs can pass upload/signing and still fail during install/upgrade materialization.
- Data lists preserve native/system `Title`; generated custom `Text0` primary fields are invalid.
- FieldName suffix matches `FieldIndex`; storage family matches FieldName family; select/radio/checkbox/tag options are non-empty.
- Default data views include visible columns and required system query fields. Generated child `List.LayoutView` is null unless custom form routing is fully resolved from export evidence.
- Dashboard pages use current shell: `Type: 103`, `LayoutView: null`, `Ext2` containing `{"src":true}`, `LayoutInResources[0].ID` and `RefId` equal `LayoutID`, navigation targets included dashboard `LayoutID`, and JSON contains `Main > Content`.
- Dashboard Data table controls require `attrs.data.list`, non-empty `attrs.listarr`, and each column must include `Field` and `FieldName`; `Field` resolves to a source list field or known system field.
- Generated Text controls use native heading/Text shape: `type:"heading"`, `label:"Text"`, `attrs.headc.title.value` or `.variable`, `attrs.heads.ty`, and plain-string `attrs.heads.color`. Do not generate ad hoc `type:"text"` controls.
- If the plan declares `three_column_workspace_shell`, the layout pattern lives inside page/form resources only; preserve the YAPK wrapper/content boundary (`AppExportPackageInfo`, Brotli `AppPackageInfo`, `Pages[]`, optional `Forms[]`/`FormNewReports[]` when planned, and `Childs[].Fields`). Validate meaningful left/main/right panel content, no placeholder-only final panels, current dashboard shell rules for dashboard pages, and approval task page URL rules for task pages before signing or handoff.

Use `full-app-plan-conformance` for approved full applications; it requires plan/spec/template coverage. Use `focused-runtime-repair` for declared repair scopes; missing full plan/spec must not fail the repair when the scope is explicit, but all non-regression gates still apply.

Package API helper operations are split: use `upgrade-check-yapk` for `UpgradeCheck:true` and `upgrade-apply-yapk` for committed `UpgradeCheck:false`. Never classify `UpgradeCheck:true` as applied success; it is only `upgrade_check_passed`.

## v0.6.6 First-Generation Smoke Gate

Account Health smoke testing added a pre-sign gate for new generated YAPK packages. Run `scripts/yapk-first-generation-preflight.mjs --package <file.yapk> --json` before signing or package-helper dry-runs. The preflight uses the canonical `schemas/yapk-schema.json`, decodes `Resource` as Brotli/base64 `AppPackageInfo`, runs the YAPK runtime validator, and runs the generated data-list system schema validator in strict mode.

Do not write, sign, or hand off a generated YAPK when decoded app objects contain extra `AppID` fields, root `ListSet.LayoutView` is null/object/array instead of a JSON string, sample rows are outside `Childs[].List.Items`, sample row values are non-string, native/system `Title` is missing, a generated `Text0` primary field exists, FieldName suffix/index or storage family is mismatched, dashboard `Ext2` lacks `{"src":true}`, `LayoutInResources` IDs do not match `LayoutID`, Data table columns lack `Field`, or generated Text controls use ad hoc `type:"text"`.

## Full Application Visual Quality Gate

Vendor Onboarding full UI v2 proved that import/install success is not enough. Do not call a generated package a full UI application unless it implements the approved plan and mockup-derived pages, forms, controls, bindings, and actions at usable quality. Blank or generic Data List custom forms are quality failures. Default/plain buttons without action bindings are quality failures. Default alert copy such as `Alert` or `Here is the description` is a quality failure. Kanban and Collection controls without meaningful dynamic item templates and item actions are quality failures.

For full application generation, run `scripts/inspect-generated-app-quality.mjs --package <package> --spec <approved-spec.md> --strict-visual-app-quality` before handoff. The strict gate must fail missing planned pages/forms, missing print pages, underbuilt dashboards, missing safe padding/card structure, placeholder controls, default buttons, missing actions, empty Kanban/Collection templates, and undocumented deferred scope. Do not return a minimal or technically importable scaffold when the user asked for the full approved application.

## Vendor Onboarding v4.1 YAPK Hard Checks

Treat the user-confirmed Vendor Onboarding v4.1 package family as a golden YAPK generation reference. For upgrade packages, preserve all existing IDs and allocate new IDs only for newly added resources. Dashboard pages must use the standard `Main > Content` shell with page content-area padding set to zero, layout Grid display captions disabled, meaningful Navigator labels on every control, and dynamic controls only inside row-context item templates such as Kanban, Collection, or Timeline. Active dashboard buttons must use the correct button/action control shape and bind to real actions, such as opening the Vendors new-item form or navigating to the compliance queue dashboard.

KPI cards must not use static number Text controls. Use the Service Desk Pro Executive Dashboard pattern: hidden Summary controls calculate values, `attrs.save_var` writes them to dashboard temp variables, and visible formatted Text controls display the temp variable values. Generated data lists inside YAPK packages must pass system schema validation: native `Title`, no generated `Text0` primary field, unique field identifiers, `FieldName` suffix matching `FieldIndex`, valid storage family, populated select/multi-select choices, default view display fields, lookup display fields selected and resolved, and sample data seeded in lookup dependency order. The remaining Vendor lookup picker no-record behavior is a known product-team follow-up; do not weaken lookup display-field validation to work around it.

## Packaged Generation Standards

Apply the packaged standards in `docs/standards/` before generating or returning application packages. `data-list-generation-standard.md` requires native `Title`, no generated `Text0` primary field, runtime-visible choice options in Rules.choices, not Rules.Options, full default view display/query shapes, lookup relationships for related lists, dependency-ordered sample rows, and selected lookup display fields. `dashboard-summary-card-generation-standard.md` applies only to Dashboard pages and supported Data List custom forms because Summary controls are not available on approval forms or Data List public forms; do not generate Summary controls on unsupported surfaces. `account-health-smoke-issue-summary.md` records the first-generation smoke failures that must remain regression-tested. Run the matching validators and treat missing standards compliance as a generation failure, not a cosmetic warning.

## YAPK-First Application Delivery Workflow

YAPK is the default package type for new app delivery as well as existing app upgrades. Generate YAP only when explicitly requested or when a fallback/debug task is specifically about YAP import. For a new app, validate decoded application content first, then wrap as `AppExportPackageInfo` with Brotli/base64 `AppPackageInfo`.

If package API automation is requested, use OAuth workspace discovery first and ignore local `YEEFLOW_WORKSPACE_ID` for package write target selection. Ask the user to choose a redacted `flowcraft` workspace, then pass `--selected-workspace-id` or documented user-selected `--workspace-id`; otherwise stop with `workspace_selection_required` before request shaping. Ask before auto-installing a new YAPK. For existing app changes, generate a versioned YAPK and call upgrade automation only after the target app/package is clearly identified and confirmed. Classify API results as `success`, `already_installed`, `api_rejected`, or `http_rejected`; keep duplicate/already-installed responses separate from unknown failures and suggest upgrade, cleanup, or renamed/new-version delivery.


## Three-Column Workspace Runtime Layout Mechanics

When using or validating `three_column_workspace_shell`, choose dashboard Style 2 from `docs/standards/three-column-workspace-layout-standard.md` and `docs/studies/three-column-dashboard-layout-runtime-css-study.md`. Style 1 dashboards keep the standard `Main > Content` wrapper. Style 2 three-column workspace dashboards do not: `three_column_workspace_shell` must be the root page body layout container, with dashboard content width set to Full Width and page padding set to 0. Do not wrap the shell in default `Main > Content` containers; runtime testing showed those default-height/default-position parents can make the shell render blank or incorrectly.

It is not enough to create three labeled sections. The page/form resource must contain one positioned row shell with three direct sibling panels, fixed-width left/right panels, fill-width main panel, full-height bounded panels, hidden outer panel overflow, scrollable body regions, sticky header/action regions, and meaningful bottom/support regions when present. Generated pages that stack the left, main, and right panels vertically, nest the shell under Style 1 wrappers, omit Full Width/zero page padding, or use layout-breaking icon widths must fail validation and must not claim this template. Icon controls inside the shell should use inline width behavior and intentionally bounded sizes for the panel/header context.

Before signing, install, upgrade, or handoff, run template conformance with the template library when a checklist declares this pattern. Treat `THREE_COLUMN_*` findings such as `THREE_COLUMN_SHELL_NOT_ROOT`, `THREE_COLUMN_SHELL_NESTED_IN_MAIN_CONTENT`, `THREE_COLUMN_PARENT_HEIGHT_DEFAULT_RISK`, `THREE_COLUMN_PAGE_WIDTH_NOT_FULL`, `THREE_COLUMN_PAGE_PADDING_NOT_ZERO`, `THREE_COLUMN_ICON_WIDTH_NOT_INLINE`, `THREE_COLUMN_PANELS_STACKED_VERTICALLY`, `THREE_COLUMN_PANEL_WIDTH_MISSING`, `THREE_COLUMN_OVERFLOW_MISSING`, and `THREE_COLUMN_PLACEHOLDER_PANEL` as generated-final blockers. If exact selected-record/right-panel refresh binding is not proven, use safe static/sample detail content, but keep the layout mechanics correct. API install success is not runtime layout proof; manual runtime verification must confirm the panels render side by side and remain usable.

## Multi-Column Form Workspace Pattern

Use `docs/standards/multi-column-form-workspace-standard.md` and template `multi_column_form_workspace_shell` when a service desk, help desk, CRM workbench, support console, review queue, renewal review, case-management console, or operational inbox needs form actions, variables, selected-record state, comments/updates, dynamic form fields, or action-driven filtering. This is an approval/form workspace pattern, not a dashboard reporting pattern.

During planning, choose a dashboard when the page is primarily reporting or monitoring. Choose the form workspace when the app needs navigation containers that set filter variables, ticket/list collection items that set selected/current record state, detail panels bound to that selected state, comment/update controls, or expand/collapse icon actions. Do not add fake workflow routing just to use the form surface; if the workflow is only Start to End, document that the form is being used as a no-submit workspace shell.

When generating this pattern, build a row shell with left navigation, ticket/list collection, selected-record workspace, and right attributes/detail regions. Navigation rows should be icon plus text containers with click/form actions. Filter controls and menu actions should set variables consumed by collection filters or queries. Collection item actions should set selected/current record state. Details panels should use dynamic field/user/file controls bound to the selected record. Comment/update actions must target the selected record and related activity list only when the binding is validated. Avoid placeholder-only panels, fake Submit Request buttons, and claims of selected-record behavior when the actions and bindings are not implemented.

Before signing, install, upgrade, or handoff, run template conformance when a checklist declares `multi_column_form_workspace_shell`, `four_column_service_desk_workspace`, `service_desk_inbox_workspace`, or `action_driven_ticket_workspace`. Treat `FORM_WORKSPACE_*` findings as generated-final blockers for pages that claim this pattern, including behavior errors (`FORM_WORKSPACE_NAV_ACTION_MISSING`, `FORM_WORKSPACE_FILTER_VARIABLE_MISSING`, `FORM_WORKSPACE_COLLECTION_FILTER_MISSING`, `FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING`, `FORM_WORKSPACE_DETAIL_BINDING_MISSING`, `FORM_WORKSPACE_ICON_ACTION_MISSING`, `FORM_WORKSPACE_FAKE_SUBMIT_BUTTON`) and runtime layout-property errors (`FORM_WORKSPACE_SHELL_LAYOUT_PROPERTIES_MISSING`, `FORM_WORKSPACE_COLUMN_WIDTH_MISSING`, `FORM_WORKSPACE_COLUMN_HEIGHT_MISSING`, `FORM_WORKSPACE_COLUMN_OVERFLOW_MISSING`, `FORM_WORKSPACE_DIRECTION_INVALID`, `FORM_WORKSPACE_ELEMENT_GAP_MISSING`, `FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID`, `FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE`, `FORM_WORKSPACE_VERTICAL_TEXT_RISK`, `FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY`). Use `docs/studies/normalized/service-desk-pro-form-workspace/reference-property-map.normalized.json` before generating this pattern; default-container-only or semantic-only four-column layouts must fail before package handoff. API install success is not runtime interaction proof; manually verify that columns render side by side, navigation filters, selected ticket refresh, detail bindings, comments, and collapse/expand actions work.

The YAP Service Desk v8 smoke lessons are shared layout guidance for YAPK page/form resources but not a reason to mix package wrappers. Keep YAPK output as `AppExportPackageInfo` with Brotli/base64 `AppPackageInfo`; do not put YAP `ListExportResult` in YAPK `Resource`. When a YAPK form/page declares `multi_column_form_workspace_shell`, still enforce inline Icon/Text/Button/Dynamic field controls, contextual bounded icons, Hidden shell overflow, independent Scroll/Auto column overflow, and complete page/form materialization checks appropriate to YAPK. The YAP-only Type `105`, `Data.Forms[].ListID = 0`, and `DefResource.pageurls[].formdef.children` rules belong to YAP generation/debugging and should be translated only when a YAPK export proves the equivalent shape.

## Public Tenant Safety

- Never hardcode a tenant-specific Yeeflow URL. Use `https://<yourdomain>.yeeflow.com` in docs and examples.
- For live user-facing API calls, use OAuth; if OAuth is not authenticated, ask the user to sign in through the Yeeflow plugin login flow.
- Do not use `YEEFLOW_API_KEY` for normal plugin/API operation; keep it only as a legacy/deprecated fallback where existing code still supports it.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- Support `YEEFLOW_PROFILE` where scripts support profiles. It selects one active local tenant profile per run using `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and `YEEFLOW_<PROFILE>_TENANT_ID`.
- Validate and redact environment variables before API calls and never print API keys, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, or generated runtime packages.
- Keep generated examples tenant-neutral unless the user explicitly requests a target-tenant-specific package and provides safe mappings.

Use this skill for Yeeflow `.yapk` version-management packages for existing application upgrades.

## YAPK From Scratch Hardening

YAPK-from-scratch generation is allowed only after the inner application content passes package/app/workflow publish-readiness validation. Generate and validate `AppPackageInfo` first, then Brotli/base64/sign only after content validators, graph validators, workflow publish-readiness checks, and placeholder scans pass.

Shared YAP/YAPK application-content rule from Vendor Onboarding v1.12: generated dashboard Data table controls must use `attrs.listarr[].Field` for the actual source field internal name and `attrs.listarr[].FieldName` for the visible label. Missing `Field` can pass superficial label checks but fail at runtime with the deleted-fields query error. Preserve the same current-dashboard and YAP import rules when the inner content is later wrapped as YAPK: current dashboard shell `Type = 103`, `LayoutView = null`, `Ext2 = "{\"src\":true}"`, fixed `AppID = 41` for YAP imports, API-issued IDs for generated object IDs, integer `Field.Category`, unique IDs, populated `ReplaceIds`, and `CustomType = ListSite_<root ListID>` where applicable.

YAPK schema v4 rule from Vendor Onboarding v1.13-v1.15, updated for v0.6.18 canonical schema: generated `.yapk` packages must be top-level `AppExportPackageInfo`, and `Resource` must be `base64(Brotli(JSON.stringify(AppPackageInfo)))`. Do not wrap YAP `ListExportResult` or direct `ListExportInfo` inside YAPK `Resource`. Decoded `AppPackageInfo` must include the canonical required objects/arrays `ListSet`, `Pages`, and `Childs`; optional modules such as `Forms`, `FormNewReports`, `DataReports`, `Groups`, `Tags`, `Metadatas`, `Agents`, `Connections`, `Knowledges`, `Themes`, and `Components` are generated when planned or needed by internal standards. Each `Childs[]` entry must use `Fields`, not YAP `Defs`, plus `List`, `Layouts`, `RemindRules`, `PublicForms`, and `FlowMappings`. `LongAsString` fields such as wrapper `TenantID`, wrapper `ListID`, and layout `LayoutID` stay numeric strings. Schema integer IDs such as `ListID`, `FieldID`, `ID`, and `RefId` must be emitted without JavaScript rounding; use lossless parsing/writing. For generated Vendor Onboarding-style packages, keep `AppID = 41`, use the generate-unique-ids API for new generated package/object IDs, and validate dashboard Data table `Field` bindings before signing.

Signing and `verifysign` validate wrapper/resource integrity, not full business publish-readiness. Do not run `setsign` for generated content when any of these are present: missing/non-1 root or child list flags, unresolved sequence-flow variables, undeclared Set Variable targets, undeclared assignment-expression variables, unresolved required placeholders, or tenant-specific user/group/position placeholders.

Official v0.6.19 proof boundary update: signing HTTP 200 alone is not package-signing proof; verify expected signature shape, 32-byte signature where applicable, and `verifysign` before install/upgrade is called signed. `upgrade_check_passed` and `upgrade_applied` are API proof only and do not prove navigation, dashboard bindings, approval form controls, requester-context actions, or designer/runtime correctness. Include separate proof sections and run runtime-binding validation before handoff.

For YAPK apps with navigation groups, use API-issued long ids for app/navigation groups when runtime persistence requires ids; small local ids such as `1`, `2`, `3`, or `4` are generated-placeholder errors. Generate service portal payloads only when the approved app plan includes service portal behavior; otherwise keep portal resources, portal permissions, and portal navigation absent or explicitly rejected by the validator.

Generation order for new content: build `AppPackageInfo`, validate decoded content, run workflow publish-readiness checks, scan placeholders, Brotli-compress `Resource`, base64 encode, update wrapper metadata, call `setsign`, call `verifysign`, and write the generated `.yapk` outside git, normally to Downloads. Never commit generated `.yapk` packages, raw `Resource`, raw `Sign`, decoded full payloads, API responses, tenant IDs, or private data.

## API-Backed Install And Upgrade Automation

When the user explicitly asks to automate `.yapk` install or upgrade, use `scripts/yeeflow-package-api-automation.mjs --operation install-yapk` or `--operation upgrade-yapk` only after schema, decode, graph, import-readiness, dashboard, data-list, and safety validation pass. Package automation ignores local `YEEFLOW_WORKSPACE_ID` and active profile workspace variables for package write targets; discover `flowcraft` workspaces through OAuth, require explicit user selection via `--selected-workspace-id` or documented user-selected `--workspace-id`, and fail with `workspace_selection_required` before request shaping if selection is missing. The helper must run dry-run first and requires `--execute` before calling product APIs. Package automation uses `POST /files/upload` followed by `POST /listset/package/install` or `POST /listset/package/upgrade`; runtime proof shows upload may respond as text/plain JSON metadata with `id`, `name`, and `fileSize`, which must be parsed and redacted. If the upload response does not expose package-file metadata, require explicit uploaded file metadata from a safe source. API success is not enough: verify the app opens and the intended upgrade changes render before recording runtime proof.

For successful live new-app install, report selected workspace display name/category/redacted ID preview, result status, safe ListSetID, and an application access link only when the OAuth/session tenant URL and ListSetID are both safely resolved. Use `<tenant-url>/#/list-set/41/<listset-id>`. If unavailable, report `Application link: unavailable; ListSetID or tenant URL was not safely resolved.` Never derive the tenant URL from `.env.local`.

Business Travel hardening rules: set `Flags = 1` on root app/list-set and child list resources; declare every workflow variable used by sequence flows, Set Variable nodes, task assignments, form bindings, summaries, and ContentList mappings; remove stale renamed variables from conditions; do not use placeholders such as `__POSITION_ID_REQUIRED_*`; direct position assignment requires a real numeric tenant position ID or a user-approved post-import binding/fallback. Preserve the proof boundary: these rules harden content validation and do not prove arbitrary YAPK-from-scratch generation for all app types or tenant-specific routing.

Current proof boundary:

- `.yapk` wrapper schema is product-schema-backed as `AppExportPackageInfo`.
- Product schema describes `Resource` as a Brotli compressed string whose decompressed JSON should match `AppPackageInfo`.
- In the current local study, readable historical `.yapk` artifacts did not Brotli-decode through tested variants, so Resource decode is not yet artifact-proven for those files.
- A focused runtime-generation attempt against `Projects Center_1-v1..0.yapk` found that the original Resource emits complete parseable `AppPackageInfo` JSON from a streaming Brotli decoder before ending with `Z_BUF_ERROR`. Product's provided C# compression helper returns `MemoryStream.ToArray()` after `BrotliStream.Flush()` but before disposing the `BrotliStream`, which explains an unfinished Brotli stream. Treat this as a tolerant decode path, not as a general permission to ignore decompression errors.
- The same focused experiment added one minimal data list, re-encoded Resource with finalized standard Brotli, called `setsign`, and passed `verifysign`. User confirmed v1.4 upgraded successfully, the generated text-only list appeared, the add form rendered, and saving a record succeeded. Treat only this minimal text-only data-list-add path as runtime-proven.
- After `.env.local` credentials were added, the signing service accepted the same original `Projects Center_1-v1..0.yapk` wrapper when `/v1` was appended to the configured base URL: `setsign` returned a 32-byte sign and `verifysign` passed for both regenerated and original signs. This proves server-side signing/verification for the original valid Resource, not local Resource decoding or content mutation.
- `setsign` / `verifysign` are evidence-backed for wrappers with already-valid existing Resource payloads.
- Wrapper-only signed packages can be accepted but do not change app content when `Resource` is unchanged.
- `.yap` gzip Resource encoding is not valid `.yapk` Resource encoding.
- Offline `.yapk` content generation is proven only for the focused minimal text-only data-list-add path tested in `Projects Center_1-v1..0.yapk`; broader field types and richer app mutations remain experimental until separately runtime-proven.

## Default Workflow

1. Preserve originals. Do not copy raw `.yapk` files into the repo.
2. Inspect wrapper metadata with redaction. Never print raw `Resource`, `Sign`, tenant IDs, app IDs, list IDs, package IDs, private URLs, API keys, raw API responses, or decoded full payloads.
3. Validate wrapper required keys:
   - `PackageId`
   - `TenantID`
   - `AppID`
   - `ListID`
   - `Title`
   - `Description`
   - `IconUrl`
   - `Resource`
   - `Notes`
   - `Author`
   - `Date`
   - `Version`
   - `Sign`
4. Check schema rules:
   - `TenantID` and `ListID` should be numeric strings.
   - `Date` should be UTC `yyyy-MM-ddTHH:mm:ssZ`.
   - `Resource` must not use the `.yap` `[______gizp______]` prefix.
5. Attempt Resource decode using project tooling:
   - `node scripts/inspect-yapk-schema-standard.mjs <package.yapk>`
   - `node validate-yapk-package.js <package.yapk> [--baseline <baseline.yapk>]`
6. If Resource decodes, validate decoded `AppPackageInfo` shape:
   - canonical required top-level keys: `ListSet`, `Pages`, `Childs`
   - optional modules such as `Forms`, `FormNewReports`, `DataReports`, `Groups`, `Tags`, `Metadatas`, `Agents`, `Connections`, `Knowledges`, `Themes`, and `Components` must be present when generated, planned, or required by internal completeness standards
   - `ListPackageInfo` children require `List`, `Fields`, `Layouts`, `RemindRules`, `PublicForms`, `FlowMappings`
   - `FieldName` must end with digits and suffix must equal `FieldIndex`
   - `InternalName` must match `^[a-zA-Z0-9_]+$`
   - `NoRule.Prefix` must contain `{index}`
   - `List.Type` uses the product enum values
   - `List.Flags` includes `Show = 1`
7. Compare packages using safe stats only:
   - Resource string length
   - decoded byte length
   - Brotli success/failure
   - decoded top-level key list when available
   - list/page/form/report/module counts
   - Resource changed/unchanged boolean
   - common-prefix/suffix and same-position byte ratio

## Generation Boundary

Do not claim `.yapk` generation is solved just because the wrapper validates or signs.

Future generation requires all of:

1. Decode `Resource` to schema-valid `AppPackageInfo`. If standard Brotli ends with `Z_BUF_ERROR`, a streaming decoder may be used only when the emitted UTF-8 text parses as complete JSON with the expected `AppPackageInfo` keys.
2. Edit the decoded object safely.
3. Brotli encode the updated `AppPackageInfo`.
4. Put the encoded Resource into a valid wrapper.
5. Sign with a product-supported signing path.
6. Verify the signature.
7. Runtime upgrade in Yeeflow and confirm the intended content changed.

Until step 7 succeeds for the exact mutation type, classify output as schema study, planning guidance, or experimental validation only. Continue using `.yap` for generated new/cloned application creation. For `.yapk`, the current proven generation scope is a minimal text-only data list.

When editing decoded `AppPackageInfo`, preserve 64-bit numeric IDs. Plain JavaScript `JSON.parse` rounds large IDs and must not be used for app-content mutation unless a lossless JSON parser is used. The first focused edit used Python JSON handling for the app payload and Node only for byte-level compression/API calls.

## What To Load

Use these project references when present:

- `docs/yeeflow-yapk-version-package-study.md`
- `docs/studies/normalized/yapk-schema-standard/`
- `yeeflow-yapk-schema-standard-summary.json`
- `validate-yapk-package.js`
- `scripts/inspect-yapk-schema-standard.mjs`

Also use:

- `yeeflow-package-validator` for import-safety framing.
- `yeeflow-runtime-test-orchestrator` when a user explicitly asks for runtime upgrade proof.
- `yeeflow-application-builder` only for business-solution design or `.yap` clone alternatives.

## Stop Conditions

Stop and report the proof boundary when:

- Resource does not Brotli-decode to JSON.
- Resource decodes but fails schema-critical `AppPackageInfo` checks.
- The task requires app-content mutation but no product-supported Resource-generation/signing/runtime proof is available.
- The only successful change is wrapper metadata or `Sign`, because unchanged Resource means unchanged app content.
- Any raw package, payload, private ID, API response, secret, screenshot, or decoded full payload would need to be committed.

## Runtime-generation Experiment Notes

For `Projects Center_1-v1..0.yapk`, the safe result is:

- wrapper JSON parse: succeeded
- Resource base64 decode: succeeded
- Resource standard Brotli sync decode: failed with final `unexpected end of file`
- Resource tolerant streaming decode: emitted complete parseable `AppPackageInfo` JSON
- requested data-list add: completed locally
- finalized standard Brotli re-encode: completed
- `setsign`/`verifysign`: passed
- generated package: `/Users/Renger/Downloads/Projects Center_1-v1.1-yapk-runtime-test.yapk`
- runtime upgrade/list/form materialization: user-proven
- record creation: failed with `Add failed`

The v1.2 add-fix package adjusted save-path-sensitive list metadata:

- generated list `TableCode`: `flowcraft`
- date field `FieldName`: `Datetime4`
- date field `FieldType`: `Datetime`
- layout references updated to `Datetime4`
- generated package: `/Users/Renger/Downloads/Projects Center_1-v1.2-yapk-runtime-add-fix.yapk`
- `setsign`/`verifysign`: passed
- runtime add-item retest: pending

User runtime result for v1.2:

- upgrade failed
- error: `Data list: YAPK Runtime Test List (field invalid 'Test Date Datetime4!=Datetime4')`
- conclusion: do not change this package's generated date field from `Datetime4` / `Datetime` to `Datetime4` / `Datetime`

The v1.3 table-code-only package keeps the upgrade-valid date field shape and changes only:

- generated list `TableCode`: `flowcraft`
- generated package: `/Users/Renger/Downloads/Projects Center_1-v1.3-yapk-runtime-tablecode-fix.yapk`
- `setsign`/`verifysign`: passed
- inspector/validator: passed
- runtime result: upgrade succeeded, but add-item save still failed
- conclusion: `TableCode` was not the missing save-path piece

The v1.4 text-only isolation package removes the `Test Date` field to test whether the save failure is caused by Datetime control materialization:

- generated package: `/Users/Renger/Downloads/Projects Center_1-v1.4-yapk-runtime-text-only.yapk`
- fields: `Name`, `Test Status`, `Test Notes`
- `setsign`/`verifysign`: passed
- inspector/validator: passed
- runtime result: upgrade succeeded, list rendered, add form rendered, and saving a new item succeeded
- conclusion: first complete runtime proof for decode -> edit -> encode -> sign -> verify -> upgrade -> add-item-save, scoped to a minimal text-only data list

Do not generalize this to Datetime fields yet. v1.1 and v1.3 both failed record creation while including the generated Datetime field, and v1.2 failed upgrade when the Datetime field casing was changed.

Ask product to confirm whether the provided `BrotliHelper.Compress(byte[])` should dispose/close `BrotliStream` before reading `MemoryStream.ToArray()`.

When using the signing APIs:

- use OAuth through the shared Yeeflow API auth wrapper; if OAuth is not authenticated, ask the user to sign in through the Yeeflow plugin login flow
- `.env.local` may be absent or empty for normal signing/API access; if it exists and is marked macOS `dataless`, stop before reading it and ask the user to hydrate the file
- keep `YEEFLOW_API_KEY` only as a legacy/deprecated fallback where existing code still supports it
- use the plugin default API base for signing API calls; `YEEFLOW_API_BASE_URL` is only an advanced development/testing override
- treat `YEEFLOW_BASE_URL` only as a legacy API base URL alias
- derive tenant links from OAuth token context; use `YEEFLOW_TENANT_URL` only as an optional manual tenant UI/browser-link fallback, not for signing API calls
- when `YEEFLOW_PROFILE` is set, read only the active profile's optional local overrides while keeping other profiles inactive for that run
- never print or persist raw API responses, `Resource`, or `Sign`
- treat a successful `setsign`/`verifysign` on an unchanged Resource as wrapper/signing proof only

Sub List Dynamic Runtime Proof V1.2 note: the user-corrected `Sub List Dynamic Runtime Proof-V1.1.yapk` is the baseline for grid/header fixes. Generate V1.2 from that YAPK rather than the older `.yap`: tolerant-decode the V1.1 Resource, remove the stale standalone V1 header grid, wrap body-grid field controls in containers, re-encode with finalized standard Brotli, update wrapper PackageId/Version/Date/Notes, then run `setsign` and `verifysign`. The generated V1.2 package signed and verified; do not claim runtime proof until V1.2 is upgraded/imported and manually tested.

Sub List Dynamic Runtime Proof V1.4 note: V1.3 rendering was user-confirmed for the Purchase Request Dynamic Sub List, but the row menu only had Duplicate/Delete. V1.4 is generated from V1.3 by mutating only the Purchase Request form row menu to Duplicate, Insert before, Insert after, Move up, and Move down, preserving visible Delete in the last column. Sign and verify the wrapper as usual, but keep Insert/Move runtime behavior pending until user testing confirms it.

Sub List Dynamic Runtime Proof V1.5 note: V1.4 decoded locally with the five menu items but runtime still showed the old Duplicate/Delete menu. The earlier add-form generation had collapsed the Purchase Request `ProcModelID`, `DefResourceID`, and `DeployedDefID` to the same rounded large value. For form-definition mutations in YAPK upgrades, bump the target form `DefResourceID` and `DeployedDefID` along with `DefResource` so Yeeflow materializes the fresh deployed form definition. V1.5 applies that fix and remains runtime-pending.

If product states the format is exactly `base64(Brotli(AppPackageInfo JSON))`, ask for one of:

- a fresh `.yapk` known to decode with that exact path,
- the expected safe byte statistics for the decoded Brotli payload,
- confirmation that this specific package was generated by the same schema-standard exporter,
- or the product-side decode trace/error for this exact package.
