# Package Signing And Runtime Proof Boundaries

Generated package reports must keep proof scopes separate.

## Proof Scopes

- Schema validation proves local package shape only.
- ID provenance validation proves generated numeric content IDs are covered by an API-issued ID manifest only.
- Navigation runtime metadata validation proves decoded navigation group/item metadata is complete and target-resolvable only.
- API signing proves wrapper signature integrity only.
- `verifysign` proves the signed wrapper/resource pair verifies through the signing endpoint.
- API install/import/upgrade acceptance proves API acceptance only.
- Runtime UI proof requires inspecting the installed app.

Do not describe a package as upload-ready, install-ready, or handoff-ready solely because local validators pass. Do not describe API acceptance as runtime UI proof. Do not use signing or install acceptance as evidence for ID provenance or navigation runtime metadata completeness.

## Signing Requirements

For upload-ready YAPK handoff, use documented endpoints only:

- `POST /utils/apppackage/setsign`
- `POST /utils/apppackage/verifysign`

When credentials are available, a generated package should be API-signed and verified before handoff. If signing is not performed, report the package as unsigned/incomplete and explain the missing environment or approval.

## Report Template

Generation reports should include:

- schema validation: pass/fail and validator names
- ID provenance validation: pending, passed, failed, or not applicable, with manifest path
- navigation runtime metadata validation: pending, passed, failed, or not applicable, with validator result
- app-plan conformance: pending, passed, failed, or not applicable
- UI/control quality: pending, passed, failed, or not applicable
- approval-form validation: pending, passed, failed, or not applicable
- signing proof: unsigned, signed, verified, or blocked
- signature verification: not run, passed, failed, or blocked
- API install acceptance: not run, dry-run only, accepted, rejected, or blocked
- runtime UI proof: not run, partial, passed, or failed
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
