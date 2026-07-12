# Approval Workflow Designer Editability Standard

Status: generated-final hard contract for standalone `.ywf` and Approval workflows embedded in `.yapk`.

## Scope

An importable workflow is not necessarily editable or publishable. Generated Approval workflows must preserve the current Workflow Designer node hitboxes, workflow action outputs, and data-mutation semantics in addition to graph connectivity and visual layout.

Standalone `.ywf` generation and full-application `.yapk` materialization must call the same workflow Designer-shape utilities. Do not hand-build a second graph shape for standalone output.

## Designer Node Shape

Every non-`SequenceFlow` node must include:

- matching non-empty `id` and `resourceid`;
- numeric `position.x` and `position.y`;
- `bounds.upperLeft` and `bounds.lowerRight` with positive width and height;
- `bounds.upperLeft` equal to `position`;
- a root `graphposition` whose `x/y` are initial viewport translation offsets derived from all node bounds and `graphzoom`, not model-coordinate bounding-box origins.

For generated workflows, use `screen = model * graphzoom + graphposition`. Place the leftmost/topmost node at safe initial canvas insets (`80px` left and `120px` top by default). `graphposition.width/height` describe scaled content dimensions. Do not write `minNode - margin` into `graphposition.x/y`; that pans negative-coordinate workflows above and left of the visible canvas.

Default export-observed sizes used by the shared builder are:

- event nodes: `36 x 36`;
- gateway nodes: `46 x 46`;
- task/action nodes: `190 x 86`.

Missing bounds are a Designer hit-testing defect: the canvas may render, while nodes cannot be selected or configured and adjacent nodes cannot be added reliably.

## SequenceFlow Reference Shape

Every graph reference must use the canonical export shape:

```json
{ "id": "<shape-id>", "resourceid": "<shape-id>" }
```

For each `SequenceFlow`:

- `source` and `target` must each contain matching `id` and `resourceid`;
- `incoming[0]` must be the same canonical node reference as `source`;
- `outgoing[0]` must be the same canonical node reference as `target`;
- the source node must include the flow in its canonical `outgoing[]`;
- the target node must include the flow in its canonical `incoming[]`;
- camel-case `resourceId` is not a substitute for a missing `id` or lowercase `resourceid`.

The shared generator must pass all graph shapes through
`normalizeApprovalWorkflowGraphReferences()` before DefResource encoding. A graph that can be
reconstructed indirectly from node `outgoing[]` is still broken when the SequenceFlow source
endpoint itself is not canonical; Designer may render only some nodes, omit connectors, and make
the canvas non-editable.

The standalone `build-ywf-wrapper.js` entrypoint must run the same normalizer before Base64
encoding. Standalone wrapper generation is not allowed to preserve malformed input references.

## Query Data Outputs

A `QueryData` node that writes results to workflow variables must declare those variables in `DefResource.variables.basic` before publish:

- `result.listName` must resolve when `result.listParent = "__variables_"`;
- the variable type must equal `result.vartype`;
- multiple results must select at least one `result.fields[]` entry;
- `result.totalCount` must resolve to a `number` variable;
- workflow-variable counts use `result.querycount_prefix = "__variables_"`.

The shared materializer must create these variables. A validator-only fix is insufficient.

## Content List Actions

Content List operations must express a real mutation:

- `add` and `edit` require at least one `listdatas[]` field mapping;
- every mapping requires `Columns`, `Per: "0"`, and non-empty `Data`;
- `edit` and `remove` require at least one `wheres[]` target-record condition;
- an action named Update/Edit must not use `type: "add"`;
- unresolved edit/remove target criteria are generation blockers, not permission to guess a record.

## Assignment And Wrapper Shape

- Assignee Expression Buttons must use the shared assignee serializer; `${{...}}` and plain nested JSON are forbidden.
- Approval tasks normally omit `tasktype`; Complete tasks use `tasktype: "complete"`.
- Standalone `.ywf` wrappers use `Settings: null` through the standard wrapper builder.
- Start/end nodes preserve export-shaped email defaults when email is disabled.

## Required Gates

Before signing, install, import, or publish claims, run:

```bash
node validate-ywf-def.js <decoded-def.json> --mode final
node scripts/validate-approval-workflow-publish-readiness.mjs --resource <decoded-def.json>
node scripts/test-approval-workflow-publish-readiness-gates.mjs
```

Generated-final blockers include:

- `APPROVAL_WORKFLOW_NODE_BOUNDS_MISSING`
- `APPROVAL_WORKFLOW_NODE_BOUNDS_POSITION_MISMATCH`
- `APPROVAL_WORKFLOW_INITIAL_VIEWPORT_NODE_EXTENT_OFFSCREEN`
- `APPROVAL_WORKFLOW_GRAPHPOSITION_DIMENSIONS_INVALID`
- `APPROVAL_WORKFLOW_SEQUENCEFLOW_SOURCE_ID_MISSING`
- `APPROVAL_WORKFLOW_SEQUENCEFLOW_SOURCE_IDENTITY_MISMATCH`
- `APPROVAL_WORKFLOW_SEQUENCEFLOW_TARGET_ID_MISSING`
- `APPROVAL_WORKFLOW_SEQUENCEFLOW_TARGET_IDENTITY_MISMATCH`
- `APPROVAL_WORKFLOW_SEQUENCEFLOW_INCOMING_REF_INVALID`
- `APPROVAL_WORKFLOW_SEQUENCEFLOW_OUTGOING_REF_INVALID`
- `APPROVAL_WORKFLOW_SEQUENCEFLOW_INCOMING_ENDPOINT_MISMATCH`
- `APPROVAL_WORKFLOW_SEQUENCEFLOW_OUTGOING_ENDPOINT_MISMATCH`
- `QUERYDATA_RESULT_VARIABLE_NOT_FOUND`
- `QUERYDATA_COUNT_VARIABLE_NOT_FOUND`
- `QUERYDATA_RESULT_FIELDS_EMPTY`
- `CONTENTLIST_EMPTY_LISTDATAS`
- `CONTENTLIST_EMPTY_WHERES`
- `CONTENTLIST_OPERATION_SEMANTICS_MISMATCH`
- workflow assignee expression serialization errors

Passing local validators proves structural Designer readiness only. Designer open/edit/publish remains a distinct runtime proof layer.
