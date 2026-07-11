# Form Action Query Data v1.1 Golden Reference Training Report

## Training Input

- User-provided official export: `Approval form workflow sample-v1.1.yapk`
- Focus form: `Approval form with Query Data`
- Focus page: Submission form
- Focus action: `Query data sample`
- Source: `Event Planning` Data List

The raw package and decoded tenant payload are evidence only and are not committed.

## Export Findings

The action contains four Query Data steps:

1. Single record mapped to Approval workflow variables.
2. Single record mapped to page temp variables using `__temp_` target ids.
3. Multiple records mapped to a Sub list variable plus a result count mapped to a workflow number variable.
4. Multiple-record count mapped to a temp variable.

All four steps use the same confirmed Data List source, two literal filters, and two ordered sorts. The export stores filters in `querydata_filters` plural.

## New Evidence Compared With Existing Plugin Knowledge

- The v1.1 export omits `querydata_type` for single-record queries. The validator previously treated omission as unknown; it must now interpret omission as the exported default single mode while continuing to accept explicit `"single"` from older proven exports.
- Single-to-temp maps source fields directly to prefixed ids such as `__temp_<id>`. The prior validator only recognized unprefixed temp ids.
- Multiple-to-Sub-list can store count directly in a workflow number variable using `querydata_totalparent: "__variables_"`.
- Count-only is a first-class business mode. Multiple query output is valid when it has a count target and no record collection target.

## Residue Found In The Source Export

The fourth step is named and configured in the UI as count-only, but its serialized attrs retain the Sub list target and field map from the previous mode. This is not adopted as the canonical pattern. The normalized golden count-only template removes all record-output fields and keeps only source/filter/sort/type/count attributes.

This distinction prevents a generated action from silently writing a Sub list while the App Plan says it only counts records.

## Plugin Changes

- Added four sanitized golden reference templates under `docs/reference/`.
- Added a shared `form-action-query-data-utils.cjs` builder/classifier.
- Updated final YWF validation for default single mode, prefixed temp targets, count-only output, count target typing, and stale mapping rejection.
- Expanded the App Plan Form Actions table to make Query mode and targets explicit.
- Added `validate-form-action-query-data-plan.mjs` so invalid mode/target combinations and Public Form placement fail before generation.
- Added source/dist regression coverage for all modes, Public Form rejection, and malformed output configurations.
- Updated Approval Form generator guidance and the feature-learning boundary.

## Proof Boundary

This round is export-backed and validator-backed for Approval Submission Form Action structure. Custom Data List Forms are covered separately by the v1.2 training report. This round does not claim new runtime proof for Approval task/print pages, Dashboard actions, Document Library sources, Form Reports, Data Reports, or Public Forms.
