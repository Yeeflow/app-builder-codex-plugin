# Approval Workflow Publish Readiness Standard

This standard applies to every generated Approval form workflow in generated-final `.yapk` packages. It also applies to workflow task surfaces produced for Data list workflows and Schedule workflows when they use Yeeflow Approval-style task forms.

## Purpose

Generated Approval forms must be publish-ready in Yeeflow Designer, not merely importable as a shell. A package is not signing-ready when the Approval form has fields but the workflow graph cannot publish, when nodes stack at the same canvas coordinates, or when the Designer `ProcModel` / `DefBlob` runtime state is not represented by the generated `DefResource`.

API submission, package signing, signature verification, upgrade acceptance, and Version Management row updates are separate proof boundaries. None of them proves that the Approval workflow can be opened and published in Designer.

## Required Workflow Shape

Every generated Approval form `Forms[].DefResource` must decode from canonical `::brotli::` + Brotli JSON and must pass final-mode Approval workflow validation.

Required root sections:

- `flowPage` as an array.
- `variables.basic`, `variables.listref`, and `variables.filter` as arrays.
- `pageurls[]` with exactly one submission/request page and at least one task page.
- `childshapes[]` with a complete Start -> planned workflow node(s) -> Approved End and Rejected End workflow graph.
- `graphposition`, `graphzoom`, and `graphver` metadata.
- `graphposition.x/y` must equal the workflow content minimum plus the runtime-proven `90px/45px` insets, and `width/height` must equal the content span with the standard small-workflow minimum. Origin or span mismatch is a signing blocker.

## App Plan Workflow Node Parity

When the App Plan includes an `Approval Workflow Nodes` table, the generated `Forms[].DefResource` must materialize that table. The generator must not collapse a multi-node approval process to a single baseline task such as `Line manager approval`.

Required parity rules:

- Every planned human review or approval node must appear as a workflow task node with the same business node name.
- Planned `AssignmentTask`, review, approval, and task nodes must materialize as `MultiAssignmentTask` unless the App Plan explicitly selects a separately proven task stencil.
- Planned system/action nodes such as `ContentList` steps must appear as named workflow nodes in the graph. If the generator cannot safely bind the write target yet, it must fail before signing rather than silently omitting the step.
- Planned Start and End nodes may be represented by the canonical generated Start and End nodes, but they must not be used as a reason to omit intermediate planned nodes.
- Approved paths may move from one planned task to the next planned task or action node before eventually reaching `EndNoneEvent`.
- Rejected paths from approval tasks must still terminate at `EndRejectEvent`.
- The generated node positions must remain non-overlapping across every planned node.

Required Start node:

- Stencil `StartNoneEvent`.
- `properties.taskurl`, `properties.taskUrl`, and `properties.TaskUrl` must all reference the submission page ID.
- Outgoing `SequenceFlow` references must include matching `id` and `resourceid`.

Required Assignment Task node:

- Stencil `MultiAssignmentTask` unless a separately proven task type is intentionally selected.
- `properties.pagetype = 1`.
- `properties.taskurl`, `properties.taskUrl`, and `properties.TaskUrl` must all reference the task page ID.
- `properties.usertaskassignment` must be a non-empty array.
- `properties.approveway` and `properties.approvepercentage` must be present.
- Applicant line-manager assignment must use the export-proven `ApplicantUserID` + `LineManager` expression button shape, not a legacy `Applicant` shortcut or a free-text placeholder. The outer expression must use `${ key:value... }`, never `${{...}}`; its `param.id` must contain nested `${...}` application variable JSON. A manager label is not sufficient when the Expression Button cannot be recursively parsed.
- Approved and Rejected outgoing conditions must be explicit and Designer-readable:
  - `conditioninfo[]` rows must use `left`, `op`, and `right`.
  - `left` must be a task Outcome expression that references the current `MultiAssignmentTask` id.
  - `op` must be `s.=`.
  - `right` must be the matching `Task outcome:Approved` or `Task outcome:Rejected` button.
  - Simplified `{ "label": "Task outcome:Approved", "value": "Approved" }` and `{ "label": "Task outcome:Rejected", "value": "Rejected" }` objects are not publish-ready.

Required end paths:

- Approved transitions must target a valid next planned workflow node or `EndNoneEvent`, and the approved path must eventually reach `EndNoneEvent`.
- Rejected transitions must reach `EndRejectEvent`.
- A rejected transition that points to a normal end event is not publish-ready.

Required `ContentList` action node:

- Planned system write nodes such as `Create Vendor Master` must materialize as `ContentList` nodes, not as omitted comments or generic placeholders.
- The generator must resolve the App Plan `Data Read/Write` target to a concrete child Data List in the current application. For example, `Vendor Master create` must target the `Vendor Master` child list, not the root application ListSet.
- `properties.listid` must be the target child Data List ID.
- `properties.listid` must not equal the root application `ListSet.ListID` or `ListSet.ListSetID`.
- `properties.listtype` must be `select`. `current` is not acceptable for generated-final packages because Designer can show the Application selector as `Uncategorized`.
- `properties.appid` must be `41`.
- `properties.listsetid` must equal the current application ListSet ID.
- If the target child list cannot be resolved from the App Plan and generated resource graph, the generator must fail before signing readiness instead of silently using the root ListSet or `listtype: current`.

Required Designer graph metadata:

- Every workflow node and sequence flow must include `id` and `resourceid`, and they must match.
- Every non-sequence node must include a top-level `position` with numeric `x` and `y` coordinates.
- Non-sequence nodes must not share identical coordinates. Stacked nodes can render as a single visible node and hide required configuration errors.
- Sequence flows must include source and target references that resolve to existing workflow node IDs.

## Visual Layout Readability

Approval workflow publish-readiness is paired with the workflow layout golden-reference gate. Generated workflows must be readable in Designer, not merely valid JSON.

Additional layout requirements:

- Main-path nodes should progress left-to-right with stable column spacing.
- System/action nodes such as `ContentList` should use a separate action lane when that improves readability.
- Rejected/cancel/exception paths should route to a lower reject lane and must include explicit `vertices`.
- Cross-lane and long SequenceFlow edges must include explicit `vertices`; diagonal lines that cross several nodes are not acceptable.
- Generated workflows must not emit compressed graphs where many nodes fit into a small rectangle or sit near enough to visually overlap.

Before signing readiness, run both workflow gates:

```bash
node scripts/validate-approval-workflow-publish-readiness.mjs --package <generated-final.yapk> --plan <yeeflow-app-plan.md>
node scripts/validate-workflow-layout-golden-reference.mjs --package <generated-final.yapk>
```

## Hard Gate

Before signing readiness, run:

```bash
node scripts/validate-approval-workflow-publish-readiness.mjs --package <generated-final.yapk> --plan <yeeflow-app-plan.md>
```

`yapk-first-generation-preflight.mjs` must include this gate and the workflow layout golden-reference gate, and must pass the App Plan path to publish-readiness whenever one is available. A failure blocks signing, `setsign`, `verifysign`, install/import, upgrade, Version Management handoff, and browser runtime proof.

New parity failure codes include:

- `APPROVAL_WORKFLOW_PLANNED_TASK_COUNT_MISMATCH`
- `APPROVAL_WORKFLOW_PLANNED_NODE_NOT_MATERIALIZED`
- `APPROVAL_WORKFLOW_PLANNED_NODE_TYPE_MISMATCH`

## Runtime Proof Boundary

A passing local workflow publish-readiness gate proves only that the generated package contains the required publish-ready workflow structure. It does not prove:

- Yeeflow Designer loaded the new `ProcModel` / `DefBlob`.
- The workflow published successfully in the tenant.
- Assignment routing, approval execution, rejection execution, or notification behavior works.

Those require a separate browser/runtime proof after install or upgrade, including Designer open/publish evidence and final Version Management success evidence for the exact package ID.

For existing-app upgrades, `upgrade-check`, `upgrade-apply`, and Version Management `Succeed` still do not prove that the live Approval workflow Designer surface was overwritten. When an upgrade changes an Approval workflow, the proof bundle must compare the package-side workflow summary with a live Designer/DefBlob summary after the Version Management row reaches `Succeed`. At minimum the proof must include task name/id when available, assignee expression hash, Approved condition hash, Rejected condition hash, Designer-open evidence, and publish-success evidence. If the live summary still reflects the previous workflow, classify the upgrade proof as failed even when the package itself is fresh-install publish-ready.
