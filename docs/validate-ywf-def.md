# Decoded Yeeflow Def Validator

Validate decoded Yeeflow approval form `Def` JSON drafts before base64 wrapping or `.ywf` wrapper generation.

This tool is intentionally read-only. It does not import into Yeeflow, operate the UI, create final `.ywf` files, or base64 encode drafts.

It also loads `workflow-action-configurations.normalized.json` through `workflow-action-config-validator.js` to validate workflow action properties against the normalized node/action reference.

## Usage

```bash
node validate-ywf-def.js ./travel-request-def.json --mode draft
node validate-ywf-def.js ./travel-request-def.json --mode final
```

With a dependency mapping file:

```bash
node validate-ywf-def.js ./travel-request-def.json --mode draft --dependency-map ./travel-request-dependencies.json
```

## Modes

- `draft`: unresolved `__...REQUIRED...__` placeholders are allowed and reported.
- `final`: unresolved placeholders fail validation.

## Output

The script prints a structured JSON report:

```json
{
  "status": "pass | pass_with_warnings | fail",
  "mode": "draft",
  "errors": [],
  "warnings": [],
  "placeholders": [],
  "summary": {
    "variables": 0,
    "listrefs": 0,
    "pages": 0,
    "controls": 0,
    "workflowNodes": 0,
    "sequenceFlows": 0,
    "approvalTasks": 0,
    "contentListNodes": 0
  }
}
```

## Scope

The validator checks decoded `Def` structure, variables and listrefs, page/control bindings, approval page workflow controls, task URL page references, workflow graph connectivity, workflow designer layout readiness, approval/reject paths, sequence-flow condition shape, ContentList mappings, SetVariableTask variable references, normalized workflow action required properties, enum values, value types, `QueryData` filters, `Loop`/`Delay` condition shapes, unsafe external/credential actions, and placeholder policy.

Publish-ready page checks include:

- Every `pageurls[]` entry has page-level `pagetype`.
- Request page entries include `name`, matching real exports where this is often an empty string.
- `formdef.pagetype` matches the page `type`.
- `formdef.ver` is `2`, matching the inspected current approval exports.
- `formdef.exts`, when present, is an array.
- Request pages include `workflowControlPanel` for Save as draft / Submit.
- Request pages should include `workflowHistory`; missing history is currently a warning.
- Readonly request Applicant controls use `value: "CurrentUser"` and `attrs.default: "currentUser"`.
- Readonly request Submission Date controls use `attrs.default: "currentDate"` and `attrs.date_type: "0"`.
- Datepicker controls with static timestamp values but no current-date default are warned.

Workflow designer layout readiness includes:

- `graphposition` has numeric `x`, `y`, `width`, and `height`.
- Every non-`SequenceFlow` workflow node has `id === resourceid`.
- Every non-`SequenceFlow` workflow node has top-level `position: { "x": number, "y": number }`.
- Every node `incoming`/`outgoing` SequenceFlow reference includes matching `id` and `resourceid`.
- Every `SequenceFlow` has `id === resourceid`.
- Every `SequenceFlow` has explicit `source` and `target` references to existing non-SequenceFlow nodes.
- Every `SequenceFlow.source` matches the source inferred from node `outgoing`.
- Every `SequenceFlow.target` node includes the flow in its `incoming`.

It cannot prove that unresolved Yeeflow environment resources are correct. App IDs, ListSetIDs, ListIDs, field internal names, approver IDs, document templates, Agent IDs, and live import behavior must still be verified separately before final `.ywf` generation.
