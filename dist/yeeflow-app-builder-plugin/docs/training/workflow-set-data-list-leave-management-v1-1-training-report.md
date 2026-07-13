# Workflow Set Data List Training: Leave Management v1.1-v1.4

## Materialization Follow-through

The generated-final materializer now consumes explicit Workflow Set Data List plan records for Type 1 Data List Workflows and Type 3 Scheduled Workflows. It emits matching `Forms[]` envelopes, a Type 1 `FlowMappings[]` trigger binding, and rounded workflow definitions rather than stopping at planning validation.

For Leave Management v1.3-style multi-file Document Library writes, a nonblank `Parent Loop` is not flattened. The materializer requires an exact Loop Planning record and emits `Loop`, `LoopBody`, and the nested `ContentList`. Values/number Loop modes require exact expression-token JSON; this protects `LoopItem` file binding and `LoopIndex` title uniqueness from prose-based inference. This is schema/export regression coverage, not a claim of live document mutation proof.

## Outcome

The supplied `Leave Management-v1.1.yapk` added missing export evidence for Scheduled Workflow `ContentList` nodes and for Data List Workflow selected-target removal. The focused training converts that evidence into host-aware generation constraints and signing-time validation.

`Leave Management-v1.4.yapk` adds the direct bulk Sub list pattern. It does not wrap the write in a Loop: `ContentList` creates one target row per source List/Sub list row by retaining `key: "_list.<child field>"` in the mapping token. Approval/Scheduled host tokens use `exprType: "variable"`; Data List host tokens use `exprType: "list_field"`. The materializer, planning gate, and generic action validator now treat that distinction as a hard contract, and ensure Approval Form ContentList nodes consume their exact action-plan records rather than a guessed fallback mapping.

## Learned Golden Patterns

| Host | Scenario | Proven configuration |
| --- | --- | --- |
| Approval workflow | Existing leave-usage row | Query count branch, selected `Leave Usage Statistics`, edit `Decimal5` with `Per=1`, exact Applicant and Leave Type filters. |
| Approval workflow | Rejected leave request | Selected edit `Decimal5` with `Per=2` and the same exact identity filters. |
| Approval workflow | No usage row | Selected add with explicit record mappings. |
| Data List workflow | Update host item | `listtype=current`, `type=add`; this is an export shape and must not be normalized to edit. |
| Data List workflow | External delete | selected target, remove, exact filter. |
| Scheduled workflow | Loop updates | selected edit within Loop body with `Per=3` multiply and `Per=4` divide. |
| Scheduled workflow | Maintenance | selected add and remove nodes. |

## Implemented Gates

- `CONTENTLIST_CURRENT_TARGET_HOST_INVALID`
- `CONTENTLIST_CURRENT_REMOVE_NOT_EXPORT_PROVEN`
- `CONTENTLIST_LISTDATAS_EMPTY`
- `CONTENTLIST_MAPPING_TARGET_UNKNOWN`
- `CONTENTLIST_NUMERIC_OPERATION_TARGET_NOT_NUMBER`
- `CONTENTLIST_WHERE_FIELD_UNKNOWN`
- generated-final promotion of `CONTENTLIST_BROAD_MUTATION_FILTER_MISSING` to an error

## Document Library Extension: Leave Management v1.3

Leave Management v1.3 adds export-proven Type 16 Document Library patterns:

- a single `TravelDocument` file variable is written once to `Text4` with a dynamically unique `Title` and `_Path = LeaveType/travel documents`;
- `AdditionalDocuments` is looped through as multiple values, writing one `LoopItem` file per document with `LoopIndex` in the title;
- the Document Library workflow uses `current + add` to update current-document metadata;
- a Data List workflow uses selected-target edit/remove against the Document Library and combines business/retention filters with `_Path` folder filters.

This proves serialized node shape only. Runtime proof must still use a disposable library and verify auto-created folders, single/multiple uploads, unique titles, scoped update/delete, and file availability.
