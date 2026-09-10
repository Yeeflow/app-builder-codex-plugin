# Yeeflow App Builder 1.15.1

Patch on stable 1.15.0. Repairs generation defects exposed by a dedicated schema regression application. The product baseline remains pinned at commit `41bdac08a55204bb033acea54cf3af8d7ca2f740`.

Unicode names retain separate resource identities. Planned fields are no longer capped at sixteen. Explicit Required, Unique and Default Value columns reach native field metadata, currency retains its native control, and explicit internal field names take precedence over display labels. Native Document Library Title sorting is preserved.

Approval plans can specify a `Branches JSON` column containing at least two `{name,target,conditioninfo}` objects. Targets must resolve uniquely to planned nodes or `End`; conditions must satisfy the pinned native SequenceFlow schema. Use InclusiveGateway with explicit mutually exclusive conditions when exclusive business routing is required. Unsupported ExclusiveGateway and unknown node types fail instead of becoming human approval tasks.

Approval Loop nodes require an exact Workflow Loop Planning row plus Workflow Set Data List Action Plan rows whose Parent Loop matches. Generation retains native Loop, LoopBody and nested actions, including the LoopBody start-port entry flow. Final validation rejects missing entry references and numeric expressions referencing undeclared or nonnumeric variables. Generated-plan conformance rejects missing resources, fields and constraints before writing an artifact.

## Verified scope

Four synthetic lists saved and read back with their layouts. Browser testing verified required-field blocking, default-on boolean, currency rendering, successful save and duplicate-code rejection. A separate native approval workflow published in Designer; low amount completed after project approval, high amount required finance approval, and both wrote exactly two synthetic detail rows. Rejection wrote zero rows. Submitted records showed Completed, Completed and Rejected, with no pending tasks.

These are bounded synthetic regression results. The complete 48-case procurement acceptance matrix, complex formulas, dynamic loop-item mappings and arbitrary action/step combinations remain unverified. No upstream raw source or tenant payload is included.

## Release checks

- Candidate commit `aeb292191408c11e2bf7731be941c0b5d327483e` installed through the private Yeeflow Git Marketplace, using `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin` sparse paths. No RC tag was used.
- All 1,825 installed files matched the distribution byte for byte. Codex app-server discovered 27 skills with zero plugin skill errors.
- Source, distribution and installed Schema/Product suites each passed 105 tests. Approval publish-readiness, workflow Set Data List materialization, QueryData, Document Library, Dashboard, hosted MCP and skill-reference gates passed. Typecheck and workspace checks passed.
- Parsed 564 JSON files and syntax-checked 528 JavaScript files. Archive integrity and 71 declared distribution mirrors passed. Release safety reported zero blocking or historical findings.
- Stable promotion adds only this release evidence and its mirror; tested executable payloads remain unchanged. Marketplace configuration returns to stable after promotion.
