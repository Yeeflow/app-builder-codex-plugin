# Core Extraction Wave 3 Batch B: Workflow Query Data Static Plan

`CORE_EXTRACTION_WAVE3_BATCH_B_WORKFLOW_QUERY_DATA_STATIC_PLAN_EXECUTION_PASSED`

## Outcome

One Planning Core facade, `projectWorkflowQueryDataStaticPlan`, now projects immutable Workflow Query Data modes, static query properties, field maps, list-variable DTOs, and loop DTOs. The retained Legacy module delegates only the selected static entry points. Query execution, retrieval, runtime expressions, workflow and package mutation, browser behavior, and frontend rendering remain outside Core.

## Caller Scope

The reconciled AST graph routes reachable materializer callers for mode normalization, query properties, loop properties, and field-map parsing. `buildWorkflowListVariable` and `buildWorkflowListLoopProperties` remain Core-facade-supported compatibility entry points with no production consumer; no route was invented for them.

## Proof

The eight-case corpus passed compiled source, Plugin dist, temporary official ZIP extraction, simulated installed Plugin, actual materializer parity, deterministic double run, deep immutability, serialization, scope/leakage gates, and a temporary-copy rollback to the frozen Legacy module.

## Progress

Wave 3 accepted-envelope progress is `2/89`; provisional weighted Core completion is `30.5955`.

## Checksums

- Planning Core artifact: `9f9a415dc4e5c50b2aef042710e05ce4c5c08481381eca7684ab102ff9a5cbca`
- Historical ZIP (unchanged): `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`
