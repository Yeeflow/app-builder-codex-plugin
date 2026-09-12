# Yeeflow App Builder 1.15.4

Patch candidate based on stable 1.15.3.

## Changes

- Registered dataset-caption-v1 card composition for one caption-bearing Collection or Kanban, retaining the content card and content slot while removing redundant outer headings.
- Shared generator/final validation for empty KPI and layout modules, duplicate headings, invalid card variants and Search-before-Add toolbar order.
- Preserve independent descriptions, dynamic headings, actions, filters, table/mobile views and data-bound controls with no rows.
- Source, plugin skills, standards and regression coverage are mirrored explicitly into the release payload.

## Evidence boundary

Local structural regression and packaging checks do not prove tenant saves or responsive browser runtime. Existing applications are unchanged. Kanban composition is conditional, not a new Kanban Golden reference. Marketplace installation smoke must pass before final tagging/stable promotion.

## Verified candidate checks

- Shared composition regression: 16 cases, including three Collection references, conditional Kanban cards, title/action preservation, empty module cleanup, idempotence, unchanged dataset definitions, actual shared builder output and aggregate negative gates.
- Existing standard layout (20), controlled slots (9), Workbench (14), master-detail (22) and plan conformance (6) cases passed. Dashboard generation, dataset presentation, Custom Code and standalone YDP suites passed.
- TypeScript build passed. Distribution and extracted-archive composition, skill-reference, MCP integration and YDP checks passed.
- Payload: 1,833 files, 27 skills, 532 JavaScript syntax checks and 564 JSON parse checks. ZIP integrity and byte parity passed; release safety scan found zero blocking findings. Core and execution-service distributions validated.
- Marketplace installation and tenant browser runtime are not claimed. Candidate is ready for private Marketplace install smoke; final tag/stable promotion remains pending that confirmation.
