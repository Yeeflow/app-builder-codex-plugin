# Package Signing And Runtime Proof Boundaries

Generated package reports must keep proof scopes separate.

## Proof Scopes

- Schema validation proves local package shape only.
- Generation mode validation proves only that the package was classified as Draft / Offline Mode or Final / Authorized Generation Mode and that final-mode ID allocation evidence exists before resource generation.
- ID provenance validation proves generated numeric content IDs are covered by an API-issued ID manifest only.
- Upgrade ID stability validation proves existing YAPK semantic resources preserved their previous IDs and only new resources consumed newly API-issued IDs.
- Navigation runtime metadata validation proves decoded navigation group/item metadata is complete and target-resolvable only.
- Dashboard grid-table Collection validation proves encoded dashboard controls satisfy the planned local structure only: Collection/header wrapper, gap serialization, detail-link resolution, header/title metadata, helper-leak checks, and Type `1` detail layout shape.
- API signing proves wrapper signature integrity only.
- `verifysign` proves the signed wrapper/resource pair verifies through the signing endpoint.
- API install/import/upgrade acceptance proves API acceptance only.
- Runtime UI proof requires inspecting the installed app.

Do not describe a package as upload-ready, install-ready, upgrade-ready, generated-final, or handoff-ready solely because local validators pass. Draft / Offline Mode output is local unsigned draft output only and is blocked from generated-final signing/install claims because API-issued ID provenance is absent. Do not describe API acceptance as runtime UI proof. Do not use signing, install acceptance, upgrade-check acceptance, or upgrade acceptance as evidence for generation mode authorization, ID provenance, upgrade ID continuity, navigation runtime metadata completeness, or dashboard runtime/designer visual fidelity.

## Signing Requirements

For upload-ready YAPK handoff, use documented endpoints only:

- `POST /utils/apppackage/setsign`
- `POST /utils/apppackage/verifysign`

When credentials are available, a generated package should be API-signed and verified before handoff. If signing is not performed, report the package as unsigned/incomplete and explain the missing environment or approval.

## Report Template

Generation reports should include:

- schema validation: pass/fail and validator names
- generation mode validation: draft-offline, final-authorized, passed, failed, or blocked, with generation mode report path
- ID provenance validation: pending, passed, failed, or not applicable, with manifest path
- upgrade ID stability validation: pending, passed, failed, or not applicable, with previous/new package and lineage manifest paths
- navigation runtime metadata validation: pending, passed, failed, or not applicable, with validator result
- dashboard grid-table Collection validation: pending, passed, failed, or not applicable, with validator result
- wrapper gap validation: pending, passed, failed, or not applicable
- detail layout link validation: pending, passed, failed, or not applicable
- dashboard header visibility validation: pending, passed, failed, or not applicable
- dashboard title/text style validation: pending, passed, failed, or not applicable
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
