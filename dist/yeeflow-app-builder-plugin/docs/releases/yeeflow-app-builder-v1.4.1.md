# Yeeflow App Builder v1.4.1

## Summary

Yeeflow App Builder v1.4.1 hardens standalone live Document Library creation through the hosted MCP. It prevents duplicate resource identities before writes, shares the Type `16` native-field contract with full-app generation, and standardizes persisted baseline, customization, and final readback phases.

## Version

- Previous version: `1.4.0`
- New version: `1.4.1`
- Version decision: patch, because this release fixes live Document Library creation and adds compatible validators and orchestration without adding a new component type or changing the MCP contract

## Changes

- Added a shared seven-field native Document Library materializer for `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, and `Text4`.
- Routed full-app Document Library native-field generation and live MCP Document creation through the same native-field specification.
- Added global uniqueness validation across ListID, every FieldID, and every LayoutID.
- Decoupled custom field storage `FieldIndex` from numeric ID allocation order.
- Added validated custom field support for the export-proven live subset, including Text, identity-picker, radio, date, number, and switch storage mappings.
- Added v1.1-based default view, New/Edit form, and View form materialization with resolved custom-field bindings.
- Added two-phase live creation: native baseline, persisted baseline readback, customizations merge, final save, and persisted final readback.
- Added direct normalization for decoded details, `{ Data: detail }` envelopes, and MCP text-content tool-result envelopes.
- Added regression coverage for the duplicate FieldID failure class observed during live `Leave Policy Documents` creation.

## Validation

- Focused live Document Library materializer, two-phase merge, readback, duplicate-ID, and native-field regression suites: passed on source and distributed Plugin surfaces.
- Existing Data List Workflow Type 1 materializer, live bundle, and merge/readback suites: passed.
- Full-application entrypoint and Document Library package-materialization gates: passed.
- TypeScript build, Plugin manifest, hosted MCP configuration, embedded-credential rejection, Skill reference structure, and repository hygiene: passed.
- Standalone resource release gates: passed for 29 focused cases across four resource types.
- Packaged JavaScript syntax, JSON parsing, source/dist parity, ZIP integrity, and forbidden-file checks: passed.
- Release-safety audit against the committed RC change set: passed with zero blockers, historical debt, or placeholder findings.

## Private Marketplace Install Smoke

- Pending RC installation and fresh-process verification.

## Proof Boundaries

- Local materialization proves deterministic component shaping and fail-closed identity validation only.
- MCP baseline save acceptance does not prove the baseline persisted; baseline readback is required before customization.
- Final MCP readback proves the Type `16` resource, native fields, custom fields, and form bindings persisted.
- Designer open/edit, actual document upload, file persistence, and Security Level access enforcement remain separate runtime evidence.

## Known Limitations

- The safe live path intentionally uses two saves when custom fields are present because the online create endpoint can collapse custom-field identity failures into a generic system error.
- Security Level is metadata unless corresponding library/item permissions or workflow enforcement are separately configured and tested.

## Release Status

Release candidate preparation is in progress. The final tag and stable promotion remain blocked until exact-RC Marketplace installation, payload provenance, installed tests, and fresh-process Skill/MCP smoke pass and are recorded here.
