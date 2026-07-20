# Core Extraction Wave 3 Batch A: Workflow Set Data List Projection

`CORE_EXTRACTION_WAVE3_BATCH_A_WORKFLOW_SET_DATA_LIST_PROJECTION_EXECUTION_PASSED`

## Outcome

One cohesive Planning Core facade, `projectWorkflowSetDataListProjection`, now owns immutable Workflow Set Data List record normalization plus scalar-variable and list-reference projection. The retained Legacy module is a compatibility shim for the two existing pure entry points. `mergeWorkflowVariableProjection` remains Host-owned because it mutates `target.basic`, `target.listref`, and `target.filter`.

## Caller Correction

The record normalizer has one materializer caller plus one local projection caller. The variable/list-reference projection has two materializer callers. Internal helpers and callbacks have their real local invocation counts recorded; no selected function retains an erroneous zero caller count.

## Scope

Ordering, case-insensitive deduplication, lossless string child IDs, list references, type/default behavior, and existing no-throw projection behavior are preserved. Workflow execution, assignments, runtime expressions, APIs, graph mutation, resource/package mutation, and frontend behavior remain excluded.

## Proof

The five-case envelope corpus passed compiled source, Plugin dist, temporary official ZIP extraction, simulated installed Plugin, actual Workflow Set Data List materialization, deterministic double-run, immutable serialization, Host merge exclusion, and a temporary-copy rollback to the frozen Legacy module.

## Progress

Wave 3 accepted-envelope progress is `1/89`. Its provisional envelope-weighted Core completion value is `29.7978`, calculated from the retained baseline of 29 and one accepted Wave 3 envelope out of 89.

## Checksums

- Planning Core artifact: `4ec60304841efb430cb6947ee1c595947e6746651ef7449adf4b226612ff2319`
- Historical ZIP (unchanged): `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`
