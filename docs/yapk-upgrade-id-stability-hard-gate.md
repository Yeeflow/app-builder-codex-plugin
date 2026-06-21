# YAPK Upgrade ID Stability Hard Gate

YAPK upgrade and new-version workflows must preserve IDs for existing generated resources. Fresh generation still requires API-issued IDs for every generated numeric content ID; upgrades additionally require lineage continuity against the previous version.

## Blocking Rule

Before signing, `verifysign`, upgrade-check, upgrade apply, install-like package writes, or handoff, validate the new package against the previous package and ID lineage manifests:

```bash
node scripts/validate-yapk-upgrade-id-stability.mjs \
  --previous-package dist/<app>-previous.yapk \
  --previous-manifest dist/<app>-previous-id-lineage.json \
  --new-package dist/<app>.yapk \
  --new-manifest dist/<app>-id-lineage.json
```

If the previous package or previous manifest is missing, the workflow must fail closed and must not claim upgrade-safe output.

## Lineage Model

The lineage manifest should record each generated object with:

- `semanticKey`
- `objectType`
- `path`
- `id`
- `status`
- `idSource`

Use `idSource: "previous-version-preserved"` for existing objects and `idSource: "api-issued-new"` for newly added objects. The manifest must not include secrets, tokens, tenant URLs, raw API responses, workspace IDs, raw `Resource`, raw `Sign`, or private payloads.

## Upgrade Rules

- Existing application, list set, data list, field, dashboard, page, layout, form, approval process, workflow, user group, AI Agent, Copilot, navigation, tool/action, seed-record, relationship, and package-reference IDs must remain stable.
- Renamed or reconfigured objects keep the same ID when they are the same semantic object.
- Only newly added resources may consume newly generated API-issued IDs.
- Removed object IDs must not be reused for different semantic keys.
- Replacing all IDs in an upgrade is a hard failure.
- Ambiguous semantic matching fails closed and requires human review.

## Validator Behavior

The validator fails on:

- missing previous/new package or lineage manifest
- duplicate or missing semantic keys
- layout semantic keys that do not include list title, layout title, layout type, and index or an equivalent disambiguator
- existing semantic object ID changes
- removed ID reuse
- new object ID not recorded as API-issued
- manifest paths that do not resolve to declared IDs
- cross-reference mismatches when references are declared
- all existing IDs being reallocated

## Generator Requirements

Upgrade/new-version generation must load the previous package and lineage manifest first, match existing resources by stable semantic key, preserve their IDs exactly, request API-issued IDs only for new resources, and stop for human review when semantic matching is ambiguous.

## YAP Boundary

For YAP workflows, apply the same stable-ID principle to persisted schema IDs where the YAP format preserves them. If the YAP import path relies on platform `ReplaceIds` remapping, document that boundary explicitly and do not claim YAPK-style ID continuity. Local, hardcoded, random, timestamp, UUID, or fallback generated IDs remain forbidden.

## Proof Boundary

Signing, signature verification, install acceptance, upgrade-check acceptance, and upgrade apply acceptance do not prove ID continuity or final upgrade success. `upgrade-check-yapk` and `upgrade-apply-yapk` API status `0` means submitted/accepted only. Final upgrade success requires Version Management row status `Succeed` plus separate browser/runtime proof for the intended changed surface.

## Upgrade Scope, Reports, And Version Management

Before signing, upgrade-check, upgrade apply, or handoff, existing-app upgrade generation must also run the scope/report/status gates:

```bash
node scripts/validate-yapk-upgrade-scope.mjs \
  --previous-package dist/<app>-previous.yapk \
  --new-package dist/<app>-upgrade.yapk \
  --scope dist/<app>-upgrade-scope.json

node scripts/validate-yapk-upgrade-report-scope.mjs \
  --previous-package dist/<app>-previous.yapk \
  --new-package dist/<app>-upgrade.yapk \
  --scope dist/<app>-upgrade-scope.json \
  --report-proof dist/<app>-report-scope-proof.json

node scripts/inspect-yapk-upgrade-version-row.mjs \
  --evidence validation/<app>-version-management-proof.json \
  --package-id <submitted PackageId>
```

The upgrade scope JSON must declare:

- intended upgrade type, such as `field-only`, `list-only`, `dashboard`, `approval`, `report`, `workflow`, or `navigation`
- target resource type and target list/page/form/report/workflow
- allowed changes
- disallowed unrelated changes
- generated content IDs, when wrapper identity checks need to distinguish content IDs from tenant metadata

Field-only and list-only upgrades must fail when they mutate dashboards, approval forms, workflows, navigation, `FormNewReports`, or `DataReports` unless those resource types are explicitly declared in scope. If reports are intentionally included, each report must be proven new or update-safe; duplicate existing reports fail before live upgrade.

Upgrade wrapper identity should be Version Management-compatible: UUID-like `PackageId`, real tenant `TenantID`, stable root app/list IDs, and real author metadata where available. Generated numeric content IDs must not be used as upgrade `PackageId` or tenant identity.

When a visible field is added to a default data-list view, `LayoutView.layout[]` and `LayoutView.query[]` must both include the field, and the `FieldName`/`FieldID` values must match.

Approval forms are out of scope for field-only/list-only upgrades unless explicitly declared. If an upgrade package includes approval `DefResource`, it must be export-shaped and designer-safe: canonical `::brotli::` Brotli/base64 encoding, UUID page IDs, complete page registrations, `Main`/`Content` containers, page-scoped unique designer control IDs, workflow panel/history metadata, graph positions, task URL aliases, assignee configuration, and explicit Approved/Rejected outgoing paths.

Version Management proof must locate the submitted `PackageId` row and require final status `Succeed`. `Failed`, `Pending` timeout, missing row, or ambiguous rows fail. Failed rows must capture sanitized exact `View error log` text. After `Succeed`, runtime proof must open the affected surface and prove the intended change, such as the new data-list field label.
