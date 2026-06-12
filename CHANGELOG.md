# Changelog

## Unreleased

- Add read-only workspace discovery through documented `GET /workspaces/{category}` with redacted workspace summaries.
- Make `YEEFLOW_WORKSPACE_ID` an optional package target default/override instead of a required normal OAuth setup value.
- Require package import/install/upgrade helpers to resolve and confirm an explicit target workspace while keeping workspace mutation APIs out of automatic flows.

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
- Reduce the recommended `.env.local` to `YEEFLOW_WORKSPACE_ID=<your workspace id>` while keeping `YEEFLOW_API_KEY` as a legacy/deprecated fallback only.

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
