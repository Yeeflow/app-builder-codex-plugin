# Workflow Query Data V1.6 Training Report

## Inputs

- User-provided `Approval form workflow sample-V1.6.yapk`
- Existing workflow Query Data study and normalized action reference
- Existing Form Action Query Data v1.1-v1.4 standards

## Newly Proven Shapes

1. Approval Workflow count-only QueryData with a number count variable and complete `> 0` / `<= 0` branch pair.
2. Approval Workflow single QueryData mapping a User field to a User workflow variable, then assigning a later Approval Task to that variable.
3. Scheduled Workflow multiple QueryData mapping rows into a List variable backed by a ListRef/Complex Type definition.
4. Loop-through-list configuration with `bodyRef` and `loop_ctx` row-field expressions.
5. Query count branch followed by `InvokeCode`, List input, text output, and summary email composition.

## Corrected Existing Gaps

- Count-only multiple results are valid without `listName` or `fields`.
- A List-variable result uses `fieldMap` plus `vartype = list`; it does not use the text-result `fields[]` shape.
- Workflow Query Data sorts serialize under `properties.sorts` in this export.
- Query Data output variables are normal workflow variables, never page temp variables.
- Loop list targets and QueryData List targets require cross-validation against `variables.basic` and `variables.listref`.

## Non-Promoted Claims

- The sample does not prove serialization for Loop through multiple values or Loop for fixed times.
- Import/open and execution are not claimed by this export study.
- The literal organizer email is not reusable training data.
- `Query Campaigns` has an empty exported filter, so its described SelectedCampaign filter is not treated as present.

## Implementation Scope

- Golden reference registry and standard
- App Plan Workflow Query Data planning table
- Generation Readiness integration
- Shared materializer modes for Approval Workflow QueryData
- Workflow action and YWF cross-reference hard gates
- Focused positive and negative regression fixtures
- Source/dist and installed-skill mirror parity

## Materialization Boundary

This round integrates the shared QueryData modes into the existing Approval Workflow materializer. The repository already contains export studies and validators for `WorkflowType = 1` Data List workflows and `WorkflowType = 3` Scheduled Workflows, but the full-app materializer does not yet emit those workflow resource envelopes. V1.6 therefore strengthens their planning, golden-reference, and validation contracts without making a false full-app generation claim. Scheduled/Data List Workflow emission remains `focused-proof-required` until a host-specific builder is connected.
