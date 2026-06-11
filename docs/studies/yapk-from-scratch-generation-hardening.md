# YAPK From Scratch Generation Hardening

Date: 2026-05-28

Source context: Business Travel generated application / YAPK-from-scratch attempt observed in a companion Codex project.

## Result

The Business Travel repair sequence shows that generating and signing a `.yapk` wrapper is not enough. The inner generated `AppPackageInfo` must first pass app-creation, package, graph, workflow publish-readiness, and placeholder checks. Signing and `verifysign` validate wrapper/resource integrity; they do not prove that the generated application can import, open, publish workflows, route tasks, or run the business process.

## Issues Captured

### 1. ListModel.Flags Required

Known-good generated app/list resources require `Flags = 1`.

- `.yap` generated resources: `Data.Item.ListModel.Flags = 1` and each applicable `Data.Childs[].ListModel.Flags = 1`.
- `.yapk` decoded `AppPackageInfo`: root app/list-set and every child list package must carry the equivalent `Flags = 1` / `Show = 1` marker before signing.

Validator rule: `LISTMODEL_FLAGS_MISSING_OR_INVALID` / `YAPK_LISTMODEL_FLAGS_MISSING_OR_INVALID`.

### 2. Stale Sequence-Flow Variable

The generated workflow still referenced `EstimatedTotalAmount` in the Finance Required and Finance Not Required sequence conditions, but the real workflow variable was `TotalAmount`.

Repair:

- Finance Required: `TotalAmount > 5000`
- Finance Not Required: `TotalAmount <= 5000`

Validator rule: `WORKFLOW_SEQUENCE_CONDITION_VARIABLE_UNRESOLVED`.

### 3. SetVariable Target Missing

The `Set_TR#` step assigned a value to `TRid`, but `TRid` was not declared in `DefResource.variables.basic[]`.

Required variable:

```json
{
  "idx": "btr1-var-trid",
  "id": "TRid",
  "name": "Travel Request No.",
  "type": "text"
}
```

Validator rule: `SETVARIABLE_UNKNOWN_VARIABLE`.

### 4. Assignment Variable Missing

The Manager Approval assignment used an expression equivalent to `Workflow Variables:Applicant:Line Manager`, and form pages also bound applicant controls to `Applicant`, but `Applicant` was missing from `DefResource.variables.basic[]`.

Required variable:

```json
{
  "idx": "btr1-var-applicant",
  "id": "Applicant",
  "name": "Applicant",
  "type": "user",
  "editable": true
}
```

Validator rule: `ASSIGNMENT_TASK_VARIABLE_UNRESOLVED`.

### 5. Invalid Position Placeholder

The Finance Approval assignment used `__POSITION_ID_REQUIRED_FINANCE_MANAGER__`. Yeeflow direct position assignment requires `method = "position"` with a real numeric position ID. A placeholder string can block workflow publish.

The repair removed the invalid placeholder and used a publishable applicant line-manager assignment. This is publish-oriented only; it is not proof of true Finance Manager routing. A true Finance Manager assignment requires a tenant-specific numeric position ID or a safe user/group mapping.

Validator rule: `ASSIGNMENT_TASK_POSITION_ID_INVALID`.

## Generation Rules

- Generate the application content first, whether the final wrapper is `.yap` or `.yapk`.
- Set `Flags = 1` on the root app/list-set and every generated child data-list/list-like resource where the schema expects the show flag.
- Declare every workflow variable used by sequence-flow conditions, Set Variable nodes, task assignments, form bindings, summaries, and ContentList mappings.
- After renaming a variable, scan all sequence-flow conditions and assignment expressions for stale names or IDs.
- Do not emit tenant-specific user, group, department, location, or position placeholders into generated-final packages.
- Direct position assignment requires a real numeric position ID. Without one, use a publishable safe assignment pattern or mark the assignment as requiring post-import tenant binding.
- For generated `.yapk`, do not Brotli/base64/sign until decoded `AppPackageInfo` content validators pass.

## Validator Rules

- Hard error when root or child list resource flags are missing or not `1`.
- Hard error when sequence-flow condition variables do not resolve to `DefResource.variables.basic[]` / workflow variable declarations.
- Hard error when Set Variable targets are undeclared or their `id` / `idx` no longer match a declared variable.
- Hard error when task-assignment rich text or expression JSON references an undeclared workflow variable.
- Hard error when direct position assignment contains a non-numeric value or a required placeholder.
- Hard error before signing when decoded YAPK `AppPackageInfo` validation fails or unresolved placeholders remain.

## YAPK Content Before Signing Gate

The safe generation order is:

1. Generate `AppPackageInfo` / application content.
2. Run package/app-level validators against decoded content.
3. Run graph and workflow publish-readiness checks.
4. Run placeholder and tenant-sensitive assignment scans.
5. Brotli-compress `Resource`.
6. Base64-encode `Resource`.
7. Update wrapper metadata such as `PackageId`, `Version`, `Date`, and `Notes`.
8. Run `setsign`.
9. Run `verifysign`.
10. Write the generated `.yapk` outside the repository, normally to Downloads.

## Proof Boundary

These lessons are based on user-observed import/publish failures and successful repairs in the Business Travel generation process.

They harden generated `AppPackageInfo`, `.yap`, and `.yapk` content validation.

They do not prove arbitrary YAPK-from-scratch generation for all app types.

They do not prove tenant-specific assignment routing without real user/group/position IDs.

YAPK signing and `verifysign` must still be run after content validation.
