# Changelog

## Unreleased

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
