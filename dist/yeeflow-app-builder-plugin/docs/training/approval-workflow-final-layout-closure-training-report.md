# Approval Workflow Final Layout Closure Training Report

## Trigger

ComfortDelGro Audit Management Approval Forms demonstrated that a payload can persist while its Workflow Designer diagram remains unreadable. The observed pattern was long backward/cross-row flows, including lines ending at early `EndRejectEvent` nodes, with no explicit route vertices.

## Learned rule

Workflow topology, node placement, connector routing, graph bounds, and validation are one atomic generation stage. A post-layout node insertion or a direct MCP save bypasses that stage and must not be described as workflow-ready.

## Implemented reinforcement

- The final layout closure standard now requires complete-topology-first generation and save/readback validation.
- Sequential generated workflows fold after five execution nodes; their row transitions use explicit safe routing rather than a long dense row.
- The layout validator now rejects rejected/return flows to a non-local `EndRejectEvent` when they omit `vertices[]`.
- Route geometry validation is applied to those explicitly routed non-local rejection flows.
- Regression coverage distinguishes an allowed local rejection auto-route from a required remote rejection route.

## Proof boundary

The regression suite proves source and distribution structural behavior. It does not prove tenant-specific assignee resolution, email delivery, or browser workflow execution. Those require the designated `designerOpen` and disposable-request runtime evidence.
