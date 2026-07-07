# Workflow Condition Editor Variable Condition Training Report

Date: 2026-07-07

## Purpose

Train the plugin to generate and validate Yeeflow Workflow connector conditions that use the current Condition editor shape:

- left side: Workflow variable selector (`left.type = 1`);
- right side: direct value (`right.type = 0`) or Expression editor value (`right.type = 2`);
- condition rows stored in `SequenceFlow.properties.conditioninfo[]`;
- optional two-layer condition groups stored as top-level group wrapper rows with child `conditions[]`.

This focused training applies to Approval form workflow, Data list workflow, and Scheduled workflow generation.

## Reference Inputs

The user provided:

- a complete Approval form `.ywf` export containing workflow variables and condition rows;
- decoded Workflow JSON samples with `conditioninfo[]` rows for all relevant Workflow variable types, including direct right values and Expression editor right values;
- UI screenshots showing the Condition editor left variable selector, type group selector, operator selector, and right value editor.

The reference shows that Workflow variable types are converted into a smaller set of Condition editor groups: `general`, `string`, `number`, `boolean`, and `datetime`.

## Learned Rules

1. `left.type = 1` means a direct workflow-variable selector for this training scope.
2. `left.value` must be an expression token with `exprType = "variable"`, `type = "expr"`, `valueType`, and a resolvable Workflow variable `id`.
3. `right.type = 0` stores the direct/static value.
4. `right.type = 2` stores an Expression editor value as a non-empty expression-token array.
5. Prefer `right.type = 0` for fixed known comparison values; use `right.type = 2` only for dynamic values, functions, calculations, current date/user context, applicant attributes, or value assembly.
6. The `group` field must match the editor group derived from the selected variable type.
7. The operator prefix must match the group:
   - `s.` for String;
   - `n.` for Number;
   - `b.` for Boolean;
   - `dt.` for Date Time;
   - no prefix for General null checks.
8. Non-primitive selectors such as User, Department, Location, Cost Center, Lookup, Metadata, and Dictionary values compare as String.
9. File, Image, and Signature variables use General null-check conditions.
10. Date Time variables such as `EffectiveDate` use `group: "datetime"` and support `dt.=`, `dt.!=`, `dt.>=`, `dt.<=`, `dt.>`, `dt.<`, `isNull`, and `isNotNull`. Direct right values should be date/time strings such as `2026-07-07 04:45:58`; null checks use `right: null`.
11. Multiple condition rows can use `pre = "and"` or `pre = "or"`.
12. The Condition editor supports at most two layers: top-level rows plus one child group layer. A group wrapper row uses `left: null`, `op: "isNull"`, `right: null`, and a non-empty `conditions[]` array.
13. Each child condition row has its own `pre` value. Use child `and` rows for grouped ranges such as `EffectiveDate >= X AND EffectiveDate < Y`; use child `or` rows for grouped alternatives such as `Name == Food OR Name == Drink`.
14. Do not generate third-level nested `conditions[]` groups.
15. Assignment task `Approved`, `Rejected`, and `Completed` outgoing conditions must compare the source task's `Outcome` expression-button against the matching `Task outcome:*` expression-button. Do not use a generic/simple `Outcome` variable token.

## Implemented Plugin Changes

- Added shared Workflow condition editor validation helper:
  - `scripts/lib/workflow-condition-editor-utils.cjs`
- Connected the helper to standalone `.ywf` validation:
  - `validate-ywf-def.js`
- Connected the helper to packaged app validation:
  - `validate-yap-package.js`
- Added focused regression tests:
  - `scripts/test-workflow-condition-editor-gates.mjs`
- Strengthened Approval task outcome condition regression:
  - `scripts/test-approval-ywf-form-structure-gates.mjs`
- Added export-backed study documentation:
  - `docs/studies/workflow-condition-editor-direct-value.md`
- Updated generator skills and workflow condition docs.

## New Hard Gate Coverage

The regression gate covers:

- positive direct-value rows for text, number, boolean, metadata, user, department, lookup, location, multi-metadata, file, image, signature, dictionary, and Date Time variables;
- all Date Time direct-value operators: `dt.=`, `dt.!=`, `dt.>=`, `dt.<=`, `dt.>`, `dt.<`, `isNull`, and `isNotNull`;
- Expression editor right values (`right.type = 2`) for string concatenation, numeric calculation, Boolean `iif`, current user, applicant Department/Location via `getUserAttr`, variable-to-variable comparison, and relative Date Time via `dateAdd(now(), "month", 1)`;
- export-shaped two-layer condition groups, including a child `and` date range group and a child `or` text alternative group;
- unresolved left workflow variable;
- wrong Condition editor group;
- wrong operator prefix;
- missing `right.type = 0` for direct values;
- invalid `right.type = 2` expression token arrays;
- empty child groups;
- third-level nested child groups;
- group wrapper rows that incorrectly carry real left/right operands;
- wrong literal type for numeric right values;
- invalid `pre` value.
- simplified Assignment task outcome conditions that use `left.value.id = "Outcome"` instead of the source task Outcome expression-button.

## Proof Boundary

This is export-proven and validator-backed. It does not prove runtime execution for every operator or every expression function. The right-side Expression editor mode is generation-shape learned from the provided reference examples; focused runtime proof is still separate.
