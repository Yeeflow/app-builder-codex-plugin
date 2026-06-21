# Yeeflow Application Package Generation Rules

## Canonical Schema Files

YAPK schema: `schemas/yapk-schema.json`

YAP schema: `schemas/yap-schema.json`

These filenames are stable references for package generation, validation, and inspection. When the product schema changes, replace the file contents while keeping these paths unchanged. Keep package rules separate: YAPK uses `AppExportPackageInfo`, Brotli `AppPackageInfo`, `Childs[].Fields`, and `PortalInfo: null`; YAP uses the YAP wrapper, `[______gizp______]` gzip `ListExportResult`, `Defs`, and `SimplePortal: null`.

## Package Type Decision

Ask whether the user wants a new application or an upgrade to an existing application.

Use `.yap` when:

- the user wants to create/import a new Yeeflow application
- the package should become a separate cloned app
- fresh IDs and import-time replacement are desired

Use `.yapk` when:

- the user wants to upgrade or modify an already imported Yeeflow application
- the user is using Application Settings -> Version management -> Upgrade application
- the package must map onto an existing app instead of creating a new clone

## `.yap` New Application Rules

For generated new-app packages:

- treat `schemas/yap-schema.json` as the base structural schema only; schema pass is necessary but not sufficient
- also apply `docs/standards/yap-generation-contract.md` and `docs/standards/yap-export-shaped-application-generation-standard.md`
- generate from an export-like baseline/reference shape; if no safe baseline exists, refuse import-qualified claims
- generate fresh local IDs
- use Yeeflow-compatible long numeric-string local IDs and preserve export-observed string IDs for `pageurls` and workflow `childshapes`
- allocate data-list `FieldID` values from a global app-level field ID allocator; do not reset the field ID range per list
- preserve the parent data-list `ListID` on every field; changing `FieldID` must not change `field.ListID`
- preserve real baseline `TenantID`, `CreatedBy`, and `ModifiedBy` metadata; do not remap tenant/user metadata into the generated ID family
- use a FlowKey/form key that cannot collide with reserved JSON property names
- include import-remappable IDs in `Resource.ReplaceIds`
- keep `Resource.ReplaceIds` limited to generated app-resource IDs, not tenant/user metadata
- rebuild `Resource.ReplaceIds` from the final decoded package after every generation or repair step; never reuse a baseline package's stale `ReplaceIds`
- generated-final packages must fail validation if any local root app, child list, field, layout, form/process, workflow shape, app group, or local sample record ID is missing from `Resource.ReplaceIds`
- keep app-level approval forms as `Data.Forms[].ListID = 0`
- include full export-style root/list/layout/field/form/process metadata and app-level structures even when empty or null
- parse decoded/stringified runtime-critical fields before output, including `DefResource`, field `Rules`, form `Settings`, `LayoutView`, and layout/view `Ext1` / `Ext2` / `Ext3`
- validate decoded app data, graph, child lists, approval forms, workflow actions, expressions, and wrapper round trip
- run materialization inspection before runtime import
- import through the new application/import flow

## YAP App Materialization Rules

The Custom Code Template Showcase runtime investigation proved that a generated package can pass broad JSON/package checks while importing as an empty app shell or lists without fields. Treat these as hard rules for generated `.yap` packages:

- Every `ListID` must be unique.
- Every `FieldID` must be unique across the whole application.
- Every `field.ListID` must equal the parent data list `ListID`.
- Every `FieldName`, `InternalName`, and `DisplayName` must be unique inside its own data list.
- Do not remap `TenantID`, `CreatedBy`, or `ModifiedBy` as generated app-resource IDs.
- Do not include `TenantID`, `CreatedBy`, or `ModifiedBy` in `Resource.ReplaceIds`.
- Treat stale or incomplete `Resource.ReplaceIds` as an async import failure risk. The broad Service Desk form-workspace YAP test proved that API `Status = 0` with `Completed = false` can still fail later when child list, layout, field, form/process, workflow shape, or sample record IDs are absent from `ReplaceIds`.
- `Resource.ReplaceIds` must be regenerated after the final package mutation, not copied from a successful baseline or earlier repair candidate.
- API status `0` with `Completed=false` is only API accepted/queued proof, not import success. Generated reports must state the proof boundary explicitly.
- Root Type `103` dashboard/page layout ownership must connect to the root app/ListSet `ListID`.
- Root navigation must reference real packaged dashboard/page, child-list, and approval-form resources.
- Run `scripts/inspect-yap-materialization.mjs` before runtime import.
- Do not proceed to custom-code component runtime testing if app materialization fails.

## `.yapk` Existing Upgrade Rules

For existing-app upgrade packages:

- start from a `.yapk` generated by Yeeflow Version management for the target app
- preserve app identity fields such as `PackageId`, `TenantID`, `AppID`, and `ListID` unless a Yeeflow-generated version package proves a different rule
- preserve the installed app `ListSetID`; if generated `ListSetID` differs from the installed/previous application, stop
- preserve stable object IDs; do not apply fresh-ID generation to existing app objects as if the package were a `.yap`
- load the previous package and ID lineage/provenance manifest before generation
- classify the package as an upgrade when the user requested an update; do not silently create a fresh-install package
- match existing resources by stable semantic key and keep their IDs exactly
- keep existing pages/resources byte-stable when the declared scope is a sandbox/test page only
- allocate new API-issued IDs only for newly added resources
- fail closed when semantic matching is ambiguous or when the previous package/manifest is missing
- never reuse removed IDs for different objects
- rebuild `Resource.ReplaceIds` from final package contents after all edits
- use Application Settings -> Version management -> Upgrade application for runtime testing
- do not generate a `.yap` when the user asked to upgrade the current app, unless they explicitly want a separate clone

## Generated-Final `.yapk` Hard Gates

Planning and Blueprint stages may use stable logical references, and an optional local preview/local-draft package may be generated for local-only structural validation. That local draft package must never be promoted into generated-final by patching or replacing IDs.

Generated-final `.yapk` generation is ID-first:

1. Resolve all logical resource references from the approved App Plan, Page Function Plan, and Blueprints.
2. Allocate every required Yeeflow API-issued ID before generated-final resource creation.
3. Build a complete `logicalRef -> apiIssuedId` map.
4. Generate the generated-final package directly from that ID map.

All runtime-bearing references must be written with final API-issued IDs at generation time, including resource IDs, Data list IDs, Approval form IDs / ProcKeys, Dashboard page IDs, Layout IDs, Form IDs, FormAction IDs, `ListID`, `PageID`, `ProcKey`, `LayoutID`, table links, Collection/Kanban/Timeline bindings, Data Filter bindings, Button/Container action targets, Sub list bindings, workflow/notification/navigation targets, and page resource version fields where required.

For generated-final `.yapk` application output, generation must stop before signing, install, upgrade-check, or handoff unless all generated-final hard gates pass:

- API-Issued Content ID Provenance Gate: every numeric generated application content ID is allocated through `GET /utils/generate/ids?count=<n>` and recorded in `dist/<app-name>-id-provenance-report.json` with `sourceMarker: "api-generated"`.
- Navigation Runtime Metadata Gate: every runtime navigation group includes API-issued `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list[]`; every child includes `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`; targets resolve to `Pages[].LayoutID`, `Forms[].Key`, or `Childs[].List.ListID`.
- Recursive Generated-Final Draft Placeholder and Logical Ref Gate: no `local-draft`, `localDraft`, `local-draft-*`, `sourceMarker: local-draft-no-api`, equivalent draft sentinel, or unresolved logical reference may remain anywhere in wrapper metadata, decoded `AppPackageInfo`, parsed page resources, form `Ext`/`DefResource`, control bindings, links, action targets, workflow/navigation metadata, theme payloads, arrays, or version fields.
- Signing-Readiness TenantID Gate: wrapper `TenantID` is tenant metadata, not generated app content ID. It must be present, non-empty, not `"0"`, not local/draft/placeholder-like, and must match the resolved OAuth tenant context when available before `setsign`.

Local ID fallback is forbidden for generated-final output, including local sequential counters, local `id()` helpers, hardcoded generated IDs, copied sample/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds.

API-issued ID provenance is not enough by itself. Finalization must replace nested runtime-bearing references such as `exts.ListID`, filter/control `binding`, `attrs.table.link`, `attrs.data.page.PageID`, `attrs.control_action`, page resource `ver`, Collection/Kanban/Timeline `children`, theme `Ext`, and encoded approval/workflow payloads before any signing or install/import readiness claim.

Required validators:

```bash
node scripts/validate-yapk-id-provenance.mjs --package dist/<app>.yapk --manifest dist/<app>-id-provenance-report.json
node scripts/validate-generated-final-draft-placeholders.mjs --package dist/<app>.yapk --mode generated-final
node scripts/validate-yapk-navigation-runtime-metadata.mjs --package dist/<app>.yapk --id-provenance dist/<app>-id-provenance-report.json
node scripts/validate-yapk-signing-readiness.mjs --package dist/<app>.yapk --expected-tenant-id <oauth-tenant-id>
node scripts/validate-yapk-upgrade-id-stability.mjs --previous-package dist/<app>-previous.yapk --previous-manifest dist/<app>-previous-id-lineage.json --new-package dist/<app>.yapk --new-manifest dist/<app>-id-lineage.json
node scripts/inspect-yapk-upgrade-app-identity.mjs --package dist/<app>.yapk --lineage dist/<app>-lineage.json
```

`validate-yapk-upgrade-id-stability.mjs` and `inspect-yapk-upgrade-app-identity.mjs` are required for upgrade/new-version output, not first-generation output. `setsign` / `verifysign` prove wrapper/resource signature only. Package API install/upgrade acceptance proves action acceptance only. Neither proves ID provenance, TenantID correctness before signing, upgrade ID continuity, ListSetID/app identity stability, navigation runtime metadata completeness, or runtime UI materialization.

For UI-heavy packages, also apply `docs/standards/ui-summary-kpi-runtime-hard-gates.md`. High-quality UI requires a page-by-page implementation contract, export-proven control/style shapes, and runtime screenshot evidence. Summary/KPI controls require designer-shaped metadata and runtime evidence. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with UUID Summary IDs, matching `Resource.ReportIds[]`, matching `Resource.exts[]`, dashboard `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible `attrs.headc.title.variable[]`, complete field metadata, before/after mutation proof, and refreshed/recalculated runtime evidence. Other shapes remain unproven unless focused runtime proof exists, and fallback KPI values must be explicitly labeled as fallback.

## Current `.yapk` Limitation

The first studied `.yapk` version package stores `Resource` as an opaque high-entropy base64 payload, not as `[______gizp______]` gzip data. Existing `.yap` decoder/builder scripts cannot decode or rebuild that resource.

Safe current behavior:

- inspect wrapper metadata
- validate package structure
- preserve opaque `Resource` and `Sign`
- treat offline wrapper edits as study-only unless runtime-proven for the exact package
- compare multiple Yeeflow-generated `.yapk` versions to understand package identity and feasibility

Unsafe until proven:

- modifying app lists, dashboards, forms, workflows, or app resource internals inside `.yapk`
- editing wrapper metadata such as `Version`, `Notes`, `Description`, or `Date`
- recalculating or replacing `Sign`
- fresh-ID regeneration for existing app upgrades
- claiming app-content upgrade runtime readiness from local validation alone

Runtime update: a metadata-only proof package that preserved `Resource`, `Sign`, `PackageId`, `TenantID`, `AppID`, and `ListID`, but edited `Version`, `Notes`, `Description`, and `Date`, was rejected by Yeeflow Upgrade application after the metadata preview step. This suggests Yeeflow validates more than the opaque `Resource` and may include wrapper metadata in package integrity checks. Until proven otherwise, `.yapk` generation must preserve the exact Yeeflow-generated wrapper or use a Yeeflow-supported version-generation/signing path.

Multi-version feasibility update: three Yeeflow-generated `.yapk` packages from the same app lineage showed stable `TenantID`, `AppID`, `ListID`, app title/description/icon, and author, while `PackageId`, `Version`, `Notes`, `Date`, `Sign`, and `Resource` changed. All resources stayed opaque/high-entropy, normal decompression failed, and searched app strings were not readable. Classification is **not locally generatable with current knowledge**. Use Yeeflow Version management to generate official `.yapk` upgrade packages.

Product schema follow-up: `yapk-schema.json` defines `.yapk` as `AppExportPackageInfo` and describes top-level `Resource` as a Brotli compressed string whose decompressed JSON should match `AppPackageInfo`. This is the target schema for `yeeflow-yapk-package-generator`, but readable historical artifacts did not verify the Brotli path in the current study. Continue treating app-content `.yapk` mutation as unsupported until a Resource decode/edit/Brotli encode/sign/verify/runtime-upgrade path is proven.

## Required User Guidance

When a user asks to modify a Yeeflow app, clarify the target package type:

```text
Should I create a new `.yap` application package, or an upgrade `.yapk` package for the existing imported app?
```

If they choose `.yapk`, request a baseline `.yapk` from Version management and explain that object identity should be preserved.
