# Generated-Final Local Draft Placeholder Hard Gate Training Report

Date: 2026-06-20

Baseline: `yeeflow-app-builder@yeeflow 0.7.0`

Training branch: `codex/generated-final-local-draft-placeholder-hard-gate`

## Goal

Fix the generated-final validation gap where a `.yapk` package could pass local generated-final checks, API-issued ID provenance, signing, and signature verification while decoded runtime resources still contained unresolved `local-draft` placeholders after API ID allocation.

The triggering Facility Maintenance forensics showed unresolved draft sentinels in runtime-bearing JSON such as:

- `exts.ListID = "local-draft"`
- filter/control `binding = "local-draft"`
- `attrs.table.link = "local-draft"`
- `attrs.data.page.PageID = "local-draft"`
- `attrs.control_action = "local-draft"`
- page resource `ver = "local-draft-1"`
- scalar Collection/Kanban/Timeline `children = "local-draft"`
- theme/form payloads such as `{"localDraft": true}` or `sourceMarker: "local-draft-no-api"`

## Changes

- Added `scripts/validate-generated-final-draft-placeholders.mjs`.
- Added recursive generated-final draft-placeholder scanning to `validate-yapk-package.js`.
- Added the generated-final draft-placeholder gate to `scripts/yapk-first-generation-preflight.mjs`.
- Extended generated-final validation to fail unresolved logical references that were not mapped to API-issued IDs.
- Registered the new validator and regression suite in `scripts/test-yapk-hard-gate-cache-artifacts.mjs`.
- Added the regression suite to `scripts/test-ui-hard-gates-all.mjs`.
- Added `scripts/test-generated-final-draft-placeholder-gates.mjs`.
- Updated YAPK guardrail docs, package-generation rules, and application/package/YAPK skill lifecycle references.

## Validation Contract

Generated-final mode fails on any unresolved draft sentinel anywhere in wrapper metadata, decoded `AppPackageInfo`, parsed page resources, form `Ext`/`DefResource`, control bindings, links, action targets, workflow/navigation metadata, theme payloads, arrays, or version fields.

Forbidden generated-final markers include:

- `local-draft`
- `localDraft`
- `local-draft-*`
- `sourceMarker: local-draft-no-api`
- equivalent unresolved generator draft sentinels
- unresolved logical references such as `logicalRef:*`, `logical-ref:*`, `appPlanRef:*`, `pageFunctionPlanRef:*`, or `blueprintRef:*`

Local draft packages may contain these markers only when explicitly validated as local-only with `--mode local-draft`.

## Generation Requirement

API-issued ID provenance is not enough by itself. Generated-final generation must be ID-first:

1. Planning and Blueprint stages may use logical references.
2. Optional local-preview/local-draft packages remain local-only and are never sign/install eligible.
3. A local draft package must never be promoted into generated-final by patching or replacing IDs.
4. Generated-final generation resolves all logical references from the approved App Plan, Page Function Plan, and Blueprints.
5. The generator allocates every required Yeeflow API-issued ID before generated-final resource creation.
6. The generator builds a complete `logicalRef -> apiIssuedId` map.
7. The generated-final package is written directly from that map.

Finalization must write API-issued IDs into nested runtime-bearing references at generation time, including Summary/list IDs, filter bindings, table links, dashboard/form action targets, form action bindings, page versions, child templates, theme metadata, workflow/notification/navigation targets, and encoded workflow/form resources.

Signing, package upload, install/import, upgrade-check, or user handoff must be blocked until:

1. package/schema validation passes,
2. API-issued ID provenance passes,
3. recursive generated-final draft-placeholder and unresolved logical-reference absence passes,
4. navigation/runtime metadata gates pass,
5. other applicable YAPK/UI hard gates pass.

## Related Findings

- No-portal YAPK packages should emit `PortalInfo: null`; omission is warning-level in this training pending broader import evidence.
- Wrapper `TenantID` is tenant metadata, not a content resource ID; API-generated TenantID allocations now produce a provenance warning for review rather than a hard blocker.
- Broad pseudo-control/resource-type behavior is intentionally out of scope for this training.

## Safety

This training does not create tags/releases/plugin archives, does not run live Yeeflow writes, and does not sign/install/import/upgrade packages.
