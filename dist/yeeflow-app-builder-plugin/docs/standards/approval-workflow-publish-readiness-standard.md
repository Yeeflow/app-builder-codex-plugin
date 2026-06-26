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
- `childshapes[]` with a complete Start -> Assignment Task -> Approved End and Rejected End workflow graph.
- `graphposition`, `graphzoom`, and `graphver` metadata.

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
- Approved and Rejected outgoing conditions must be explicit and Designer-readable.

Required end paths:

- Approved transitions must reach `EndNoneEvent`.
- Rejected transitions must reach `EndRejectEvent`.
- A rejected transition that points to a normal end event is not publish-ready.

Required Designer graph metadata:

- Every workflow node and sequence flow must include `id` and `resourceid`, and they must match.
- Every non-sequence node must include a top-level `position` with numeric `x` and `y` coordinates.
- Non-sequence nodes must not share identical coordinates. Stacked nodes can render as a single visible node and hide required configuration errors.
- Sequence flows must include source and target references that resolve to existing workflow node IDs.

## Hard Gate

Before signing readiness, run:

```bash
node scripts/validate-approval-workflow-publish-readiness.mjs --package <generated-final.yapk>
```

`yapk-first-generation-preflight.mjs` must include this gate. A failure blocks signing, `setsign`, `verifysign`, install/import, upgrade, Version Management handoff, and browser runtime proof.

## Runtime Proof Boundary

A passing local workflow publish-readiness gate proves only that the generated package contains the required publish-ready workflow structure. It does not prove:

- Yeeflow Designer loaded the new `ProcModel` / `DefBlob`.
- The workflow published successfully in the tenant.
- Assignment routing, approval execution, rejection execution, or notification behavior works.

Those require a separate browser/runtime proof after install or upgrade, including Designer open/publish evidence and final Version Management success evidence for the exact package ID.
