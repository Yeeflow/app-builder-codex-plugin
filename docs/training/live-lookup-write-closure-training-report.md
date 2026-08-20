# Live Lookup Write Closure Training Report

## Source Feedback

Audit-management data validation found Lookup fields whose values were target-record titles rather than target-record identifiers. The field definitions themselves were valid: each Lookup had the correct target list and display field. The failure occurred after schema creation, when a direct record write stored display text instead of the referenced target record `ListDataID`.

This is a post-install/direct-MCP write gap. Package validation and component readback can confirm a Lookup definition but cannot prove that later record mutations used a valid reference.

## Required Operator Contract

For every Lookup assignment, resolve the target record from the configured target list and persist its exact `ListDataID`. Do not write a human-readable title, number, code, label, or a guessed ID. Require one unambiguous target record, enforce the field's configured target list, then re-read the host record and resolve its persisted value back to that target list.

The new `scripts/validate-live-lookup-write-closure.mjs` validator consumes redacted evidence only. It does not issue a live write. Its contract requires:

- declared host Lookup field -> configured target list;
- structured write intent -> resolved target `ListDataID`;
- target inventory confirming that ID belongs to the configured target list; and
- persisted host-row readback with the identical stored ID.

It fails closed for raw strings, target-list mismatches, unresolved targets, missing persisted readback, and title/code values that differ from the resolved ID.

## Regression Coverage

`fixtures/live-lookup-write-closure/management-action-plan.valid.json` represents three independent Lookup assignments on a management-action-plan record. The regression verifies the successful ID-based case, plus title-based attempted writes for every field and additional raw-string, wrong-target-list, stale-readback, and missing-readback failures.

## Evidence Boundary

The generated report distinguishes `apiAccepted`, `persistedReadback`, `lookupReferenceResolved`, and `browserActionRuntime`. A passing closure validator establishes only the supplied target-resolution and persisted-readback evidence. It does not prove Designer rendering, form submission, or browser behavior; those require a focused runtime smoke test.
