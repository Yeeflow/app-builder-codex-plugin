# Workflow Set Data List Golden Reference Standard

## Scope and Proof Boundary

This standard governs workflow `ContentList` nodes only: Approval Form workflows, Data List workflows, and Scheduled workflows. It does not govern Form Action `Set data list` steps.

The source references are the locally supplied `Leave Management-v1.1.yapk`, `Leave Management-v1.3.yapk`, and `Leave Management-v1.4.yapk`. Their node shapes are export-proven. They are not claims that record mutations, document-library mutations, or Loop execution have been runtime-proven.

## Required Node Shape

Every workflow Set Data List node uses stencil `ContentList` and requires:

- `properties.listtype`: `current` or `select`
- `properties.type`: `add`, `edit`, or `remove`
- selected target: `appid`, `listsetid`, and `listid`
- add/edit: non-empty `listdatas[]`
- edit/remove: non-empty, field-resolved `wheres[]`

Each `listdatas[]` entry contains `Columns`, `Per`, and an expression-token `Data` array. `Columns` and all filter left-side fields must exist in the resolved target schema.

## Host Matrix

| Workflow host | Allowed target mode | Proven operations | Notes |
| --- | --- | --- | --- |
| Approval Form | `select` | add, edit, remove | `current` is prohibited. Use explicit selected-resource metadata. |
| Data List Workflow | `current`, `select` | current add; selected add, edit, remove | The export-proven `current + add` shape updates the current host item. Preserve it; do not rewrite it to edit. |
| Scheduled Workflow | `select` | add, edit, remove | Scheduled updates may occur in a Loop body. Current-list mode is prohibited. |

`select` may target a Data List or Document Library. Leave Management v1.3 proves Type 16 Document Library node shape for single-file add, Loop-driven multi-file add, folder-path mapping, external edit/remove, and current-document update. Mutation execution remains runtime-proof-required.

## Document Library Rules

For a selected Document Library `add` operation:

- map `Text4` (Upload file) from a file workflow variable or current Loop item; it must never be empty or fixed text;
- map `Title` with a dynamic uniqueness component, such as instance identity, request number, or `LoopIndex`;
- map `_Path` using `folder/subfolder` format without leading, trailing, or repeated slashes;
- use one node for a single file and a Loop-through-multiple-values body for a multi-file variable.

`_Path` is a native Document Library system field even when it is absent from the ordinary field array. For folder-scoped edit/remove, include an `_Path` condition alongside any business or retention condition. A Document Library workflow may use export-proven `current + add` to update fields on its current document record.

## Numeric Field Operations

| `Per` | Mode | Target field requirement |
| --- | --- | --- |
| `0` | Value | Any compatible field type |
| `1` | Increase | number/decimal/integer/bigint/currency |
| `2` | Decrease | number/decimal/integer/bigint/currency |
| `3` | Multiply | number/decimal/integer/bigint/currency |
| `4` | Divide | number/decimal/integer/bigint/currency |

`1` through `4` must never target text, user, lookup, date, boolean, or sub-list fields. The source value is always serialized in `Data`; the operation mode is encoded only by `Per`.

## Safety Rules

- Add/edit nodes must not have an empty mapping array.
- Edit/remove nodes must not have an empty filter array in generated-final output.
- Delete/remove requires explicit destructive business intent and a precise target filter.
- A current-list delete is not export-proven and is blocked from generated-final output.
- Document Library add requires `Title`, `Text4`, and `_Path`; mark actual file mutation execution `runtime-proof-required` until disposable-library runtime proof exists.
- Query Data count-to-branch patterns must use explicit `> 0` / `= 0` branches before update-versus-add behavior.
- Do not infer target resources or field mappings from node labels. App Plan records must state target mode, resource, operation, mappings, filters, and proof boundary explicitly.

## Required Planning Record

Every planned workflow Set Data List node must appear in the `Workflow Set Data List Action Plan` table with the host, node name, target mode/resource/type, operation, JSON mappings, JSON filters, workflow-variable declarations, `Parent Loop`, and proof boundary. Missing or ambiguous records block generated-final materialization.

### Workflow source token contract

- Approval Form and Scheduled workflows allow `variable`, `application`, and `loop_ctx` expression sources.
- Data List workflows additionally allow current-record `list_field` expression sources.
- `workflow-field` is not a valid source token on any workflow host and must fail before materialization.
- Every `exprType: "variable"` source in `listdatas` or `wheres` planning JSON requires a `Workflow Variable Declarations JSON` entry with `id`, workflow-variable `type`, token `valueType`, business `name`, canonical `expressionName`, and optional Sub list child `key`.
- The token must match the declaration exactly by `id`, optional `key`, case-normalized `valueType`, and `name == expressionName`. Multiple child declarations sharing one variable `id` must preserve one variable `type` and business `name`.
- `buildWorkflowSetDataListProperties` intentionally preserves canonical mapping and filter JSON. The validator must reject invalid tokens; the materializer must not guess, rename, or silently repair them.

### Shared projection contract for List-variable children

Validation support is not sufficient by itself. The approved Markdown row's `Workflow Variable Declarations JSON` must survive the shared generation path:

1. Markdown table parsing preserves each declaration and its optional `_list.<child>` key.
2. The shared projection groups declarations by workflow variable `id`.
3. A List parent is emitted in `variables.basic` with `type: "list"` and a stable ListRef value.
4. Each `_list.<child>` declaration is emitted as one typed field in the matching `variables.listref` definition.
5. The generated `ContentList.properties.listdatas[].Data[]` token preserves the exact parent `id`, child `key`, `valueType`, and canonical expression `name`.

If Query Data or an Approval field already declared the same List parent and ListRef, Set Data List projection must merge into that existing ListRef. It must not create a second Complex Type under a differently-cased or derived ID.

A validator-only implementation that accepts child expressions while the projection or materializer drops their declarations is a generation defect. Missing parent variables, missing ListRef child fields, or changed decoded `ContentList` tokens are generated-final blockers.

## Bulk Sub List Writes

`Leave Management-v1.4.yapk` proves that one `ContentList` add node can write one target record for each Sub list row without an enclosing Loop. The node remains a standard selected-target `add` with `listdatas`; its row-derived mappings carry `key: "_list.<child field>"`.

- Approval Form and Scheduled workflows: each row-derived token uses `exprType: "variable"`, the declared Workflow List variable `id`, and `key: "_list.<child field>"`.
- Data List workflows: each row-derived token uses `exprType: "list_field"`, the declared current-record Sub list field `id`, and `key: "_list.<child field>"`.
- The plan must declare `Batch Source Type`, `Batch Source`, and `Batch Source Fields JSON`; generated-final preserves the exact mapping tokens instead of deriving names from prose.
- The studied operation is `add` to an explicitly selected Data List or Document Library. Do not generalize this evidence to bulk edit/remove without a new export reference.
- Also map a stable parent value, such as Applicant/Employee or approval-instance identity, to each created row whenever traceability is needed. This association is strongly recommended and emitted as a planning warning when absent.
- A Scheduled workflow follows the Approval Form List-variable shape. A Data List workflow must not use a workflow variable where the host Sub list field is required.

When `Parent Loop` is present, generated-final materializes the node as `Loop -> LoopBody -> ContentList`. The corresponding Workflow Loop Planning record is required. List loops require exact `Loop Source Parent` and `Loop Source`; values and number loops require exact `Loop Value Expression JSON`. This preserves the export-proven multi-file pattern where `LoopItem` writes `Text4` and `LoopIndex` participates in Title uniqueness.

## Regression Coverage

`scripts/test-workflow-set-data-list-golden-reference-gates.mjs` covers Approval increase/decrease, Data List current add and selected remove, Scheduled multiply/divide, Document Library single/multi-file patterns, and rejection of unsafe host mode, missing filters/mappings, unknown target fields, invalid file values, static document names, and numeric operations on non-number fields.

`scripts/test-workflow-set-data-list-plan-gates.mjs` additionally covers Approval, Scheduled, and Data List workflow source-token semantics. It requires hard failures for illegal token kinds, missing declarations, and mismatched `id`, `key`, `valueType`, or expression names.

`scripts/test-workflow-set-data-list-materialization-gates.mjs` proves the complete Markdown-to-package path for Scheduled List-variable children: Markdown declaration, shared projection, `variables.basic`, `variables.listref`, generated ResourceGraph, and decoded `ContentList` token parity.
