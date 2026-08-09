# Yeeflow App Builder v1.9.0

## Summary

v1.9.0 hardens generated Data List forms and Dashboard Collections so a persisted resource remains editable in Yeeflow Designer, not only renderable at runtime. It also makes a complete Data List lifecycle a generated-final requirement.

## Included changes

- Materialize missing same-application `AppID`, `ListSetID`, and `ListID` source identity for Data List-bound controls, including controls inside JSON-encoded layout resources.
- Preserve explicit source identities and do not rewrite an already configured binding.
- Fail incomplete Type 1 Data Lists that lack a default Type 0 view or a resolvable Type 1 New, Edit, or View form through `ListModel.LayoutView`.
- Extend responsive multi-select Collection coverage to verify complete Designer source identity for every Data List-bound control.
- Fail Gantt configuration that lacks its complete source identity before packaging.
- Restore a version-aware source/distribution topology contract and validate all packaged script relationships.

## Validation

- Source and distribution Data List completion regressions: PASS.
- Source and distribution responsive Collection, Tab, and Gantt regressions: PASS.
- Source/distribution topology generation and validation: PASS.

## Proof boundary

This release proves bundled materialization, static validation, and configuration-readback safety. An exact-tag private Marketplace installation plus focused Designer and tenant runtime checks are still required before claiming Designer rendering, Collection actions, Gantt scheduling, dependency execution, or end-user behavior.
