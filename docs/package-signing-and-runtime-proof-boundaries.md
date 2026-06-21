# Package Signing And Runtime Proof Boundaries

Generated package reports must keep proof scopes separate.

## Proof Scopes

- Schema validation proves local package shape only.
- ID provenance validation proves generated numeric content IDs are covered by an API-issued ID manifest only.
- Upgrade ID stability validation proves existing YAPK semantic resources preserved their previous IDs and only new resources consumed newly API-issued IDs.
- Navigation runtime metadata validation proves decoded navigation group/item metadata is complete and target-resolvable only.
- Dashboard grid-table Collection validation proves encoded dashboard controls satisfy the planned local structure only: Collection/header wrapper, gap serialization, detail-link resolution, header/title metadata, helper-leak checks, and Type `1` detail layout shape.
- Signing readiness TenantID validation proves wrapper tenant metadata is present, non-placeholder, and matches the resolved OAuth tenant context when available.
- API signing proves wrapper signature integrity only.
- `verifysign` proves the signed wrapper/resource pair verifies through the signing endpoint.
- API install/import/upgrade acceptance proves API acceptance only.
- Runtime UI proof requires inspecting the installed app.

Do not describe a package as upload-ready, install-ready, upgrade-ready, or handoff-ready solely because local validators pass. Do not describe API acceptance as runtime UI proof. Do not use signing, install acceptance, upgrade-check acceptance, or upgrade acceptance as evidence for ID provenance, upgrade ID continuity, navigation runtime metadata completeness, or dashboard runtime/designer visual fidelity.

## Signing Requirements

For upload-ready YAPK handoff, use documented endpoints only:

- `POST /utils/apppackage/setsign`
- `POST /utils/apppackage/verifysign`

When credentials are available, a generated package should be API-signed and verified before handoff. If signing is not performed, report the package as unsigned/incomplete and explain the missing environment or approval.

Before calling `setsign`, run signing-readiness validation. `wrapper.TenantID` must be real tenant metadata from OAuth context, not `"0"`, empty, local draft, or a generated app content ID. ID provenance validation must ignore `wrapper.TenantID` as generated content while signing readiness validates it separately.

Signing helpers must save redacted pre- and post-`setsign` evidence. Request metadata should include endpoint, method, content type, body mode, package path, filename, byte size, TenantID, wrapper keys, Sign presence, auth mode, and redacted tenant/workspace context. `setsign` response parsing must accept a top-level JSON string signature and supported object-field signatures, redact signature values in saved reports, and fail clearly for unknown response shapes.

## Report Template

Generation reports should include:

- schema validation: pass/fail and validator names
- ID provenance validation: pending, passed, failed, or not applicable, with manifest path
- upgrade ID stability validation: pending, passed, failed, or not applicable, with previous/new package and lineage manifest paths
- navigation runtime metadata validation: pending, passed, failed, or not applicable, with validator result
- dashboard grid-table Collection validation: pending, passed, failed, or not applicable, with validator result
- wrapper gap validation: pending, passed, failed, or not applicable
- detail layout link validation: pending, passed, failed, or not applicable
- dashboard header visibility validation: pending, passed, failed, or not applicable
- dashboard title/text style validation: pending, passed, failed, or not applicable
- signing-readiness TenantID validation: pending, passed, failed, or not applicable
- schema helper-leak validation: pending, passed, failed, or not applicable
- app-plan conformance: pending, passed, failed, or not applicable
- UI/control quality: pending, passed, failed, or not applicable
- approval-form validation: pending, passed, failed, or not applicable
- signing proof: unsigned, signed, verified, or blocked
- signature verification: not run, passed, failed, or blocked
- API install acceptance: not run, dry-run only, accepted, rejected, or blocked
- runtime UI proof: not run, partial, passed, or failed
- runtime/designer visual proof: not run, partial, passed, or failed
- known deferred items: explicit list and approval status
- known risks: explicit list and owner/next action

## Runtime UI Checklist

Runtime proof should confirm:

- app opens
- navigation groups render
- approval form appears
- request page opens
- task pages exist
- data lists open
- dashboards/pages render
- generated pages are reachable
- dashboard duplicate header is hidden when planned
- dashboard title sizing/style is visible and matches the plan
- grid-table header and Collection have no visible gap
- Collection row click opens the planned slide detail
- detail modal size matches the plan
- dashboard still renders after navigation refresh
