# validate-yap-graph.js

`validate-yap-graph.js` is a read-only Yeeflow `.yap` application graph validator. It decodes a wrapped `.yap` export or reads a decoded `Resource.Data` JSON file, builds an internal relationship graph, and reports whether resources resolve to each other correctly.

It does not import packages, operate Yeeflow UI, modify exports, or create `.yap` packages.

## Usage

```bash
node validate-yap-graph.js "./Procurement Management.yap" --mode compatibility

node validate-yap-graph.js "./generated-app.decoded.json" \
  --mode generator \
  --stage draft \
  --json ./generated-app.graph.json \
  --md ./generated-app.graph.md

node validate-yap-graph.js "./generated-app.decoded.json" \
  --mode generator \
  --stage final
```

Options:

- `--mode compatibility`: tolerant mode for real historical exports.
- `--mode generator`: strict mode for generated app packages.
- `--stage draft`: unresolved placeholders and planned dependencies are warnings/dependencies.
- `--stage final`: unresolved placeholders and missing references are errors.
- `--json <path>`: writes the full machine-readable report.
- `--md <path>`: writes a Markdown summary.

## What It Validates

The validator builds graph nodes for:

- root app/listset resources
- data lists
- fields
- approval forms
- list workflows and scheduled workflows
- form pages
- reports
- dashboards
- document libraries
- AI agents, copilots, knowledges, connections, and other modules when detectable

It builds edges for:

- root app navigation entries to app pages, child lists, approval forms, and process links
- data-list lookup fields to target lists and display/search fields
- approval-form lookup controls to source lists and additional-field mappings
- `ContentList` workflow actions to target lists and mapped fields
- `QueryData` actions to target lists
- form page/task URL references
- report/dashboard/module references to lists when parseable
- AI/document/external workflow dependencies as dependency warnings

## Relationship Checks

The tool checks:

- lookup target lists resolve inside the package or are reported as dependencies
- lookup display and search fields resolve
- internal lookup sample values point to target sample records in the same package where sample data is available
- approval-form lookup source lists and additional mappings resolve where parseable
- `ContentList` target lists and target fields resolve
- `QueryData` target lists resolve
- workflow sequence-flow references resolve
- workflow graphs are connected enough to inspect
- reports and dashboards reference known lists when parseable
- AI, connection, knowledge, document, and external API resources are inventoried as sensitive dependencies
- local generated graph IDs are present in `Resource.ReplaceIds`
- unresolved external dependency IDs are not placed in `ReplaceIds`
- unresolved placeholders follow the requested stage policy
- list-level dependency cycles are reported
- root navigation entries resolve to known app pages, child lists, forms, or supported process links

## Output Shape

The JSON report follows this shape:

```json
{
  "status": "pass | pass_with_warnings | fail",
  "mode": "compatibility | generator",
  "stage": "draft | final",
  "errors": [],
  "warnings": [],
  "dependencies": [],
  "graph": {
    "nodes": [],
    "edges": []
  },
  "summary": {
    "nodes": 0,
    "edges": 0,
    "lists": 0,
    "fields": 0,
    "approvalForms": 0,
    "listWorkflows": 0,
    "reports": 0,
    "dashboards": 0,
    "agents": 0,
    "connections": 0,
    "lookups": 0,
    "contentListEdges": 0,
    "queryDataEdges": 0,
    "unresolvedEdges": 0,
    "cycles": 0
  }
}
```

## Severity Policy

Compatibility mode is intentionally tolerant. Real `.yap` exports can contain references to external lists, documents, AI resources, or historical workflow shapes. These are reported as warnings or dependencies.

Generator final mode is strict. A generated `.yap` package should not have unresolved lookup targets, unresolved `ContentList` targets, unresolved target fields, unresolved placeholders, or unresolved AI/resource references unless they are explicitly modeled as external dependencies and excluded from `ReplaceIds`.

## Safety Rules

- Preserve large numeric IDs as strings.
- Redact secret-like fields in reports.
- Do not print raw token, credential, client secret, API key, or authorization values.
- Do not include external dependency IDs in `ReplaceIds`.
- Do not treat a graph report as production proof until a sandbox import/export round trip confirms Yeeflow accepts and preserves the package.
- For app-level packages with internal sample lookup values, local target sample record IDs should be included in `ReplaceIds`; export-back comparison should confirm Yeeflow remapped dependent lookup values to the remapped target records.

## Known Limits

Some Yeeflow report, dashboard, AI Agent, Copilot, and external action schemas are still only partially decoded. The validator inventories and scans these resources conservatively, but deeper schema-specific validation should be added as more exports are studied.

## Recommended Future Check: ID Namespace Reuse

The Visitor Access Management v5 fresh-compatible baseline showed that graph correctness also depends on avoiding accidental reuse of a generated app namespace.

Recommended additions:

- Summarize generated ID families in the graph report.
- Summarize approval form keys/FlowKeys in the graph report.
- Warn when app, list, field, layout, form, workflow, or sample record IDs appear to come from an ID family already used by a prior generated/imported app test.
- Warn or fail when an approval form key is reused across generated app tests.
- Treat known ID-family reuse as a sandbox-readiness risk even when graph edges resolve.

Reason:

- Reused IDs and form keys can leave graph edges locally valid while Yeeflow attaches or resolves imported resources incorrectly at runtime.
- The visible failure can be a blank app or detached components after an otherwise successful import.

## Visitor Access v6.1 Graph Lesson

The Visitor Access Management v6.1 test confirms the graph-level expansion rule:

- Keep the resource graph shape from the known-good baseline.
- Add one field/change at a time.
- Use a fresh ID family and fresh form key for every import-test package.
- Preserve proven field slots unless explicitly testing a new slot.

The v6 failure also exposed a package-level registration rule that graph resolution alone may not catch:

- App-level approval forms must use `Data.Forms[].ListID = 0`.
- The approval process ID belongs in `ProcModelID`.
- If `ListID` is set to `ProcModelID`, the graph can still look internally consistent, but Yeeflow may import the app with the approval form missing.

Current validator coordination:

- `validate-yap-package.js` owns the `APPROVAL_FORM_LISTID_NOT_ZERO` structural check.
- `validate-yap-graph.js` confirms the approval form navigation, pages, lookup controls, and `ContentList` edges resolve after that structural rule passes.

## Visitor Access v10 Graph Baseline

The Visitor Access Management v10 package confirms the graph-validation pattern for incremental generated app expansion through `Text12`.

Successful chain:

| Version | Field | Slot | ID family | FlowKey |
| --- | --- | --- | --- | --- |
| v6.1 | Visitor Name | `Text8` | `211...` | `VAW` |
| v7 | Visitor Company | `Text9` | `212...` | `VAX` |
| v8 | Access Area | `Text10` | `213...` | `VAY` |
| v9 | Host Employee | `Text11` | `214...` | `VAZ` |
| v10 | Visitor Contact | `Text12` | `215...` | `VBA` |

The v10 graph validation passed with:

- two data lists
- one approval form
- root navigation edges to Overview, Departments, Visitor Access Requests, and Visitor Access Request
- Department lookup edges resolving to the internal Departments list and its `Title`/`Text1` fields
- approval-form lookup controls resolving to Departments
- one `ContentList` edge resolving to Visitor Access Requests
- no unresolved edges
- no cycles

Current proven Visitor schema:

| Field | Slot |
| --- | --- |
| Department lookup | `Text2` |
| Department Code | `Text3` |
| Visit Purpose | `Text4` |
| Visitor Name | `Text8` |
| Visitor Company | `Text9` |
| Access Area | `Text10` |
| Host Employee | `Text11` |
| Visitor Contact | `Text12` |
| Visit Date | `Datetime2` |

Graph validator expectations for future expansions:

- The new field should be represented as a local field node.
- Root navigation should remain unchanged except for deliberate app-shell work.
- The approval form should still resolve from root navigation Type `105`.
- `ContentList` must continue to target the generated request list.
- Lookup edges to Departments must remain intact.
- No reports, dashboards beyond the Type `103` shell page, AI resources, connections, document libraries, or list workflows should appear during a one-field expansion.

## Multi-Type Field Graph Recommendations

The manual Visitor Access Management v10 export confirms graph relationships that should be represented for richer approval controls. See `docs/approval-form-and-yap-field-type-pattern-study.md`.

Recommended graph checks:

- Create graph nodes for approval form variables, not only controls/pages.
- Create edges from form controls to their bound variables.
- Create edges from dynamic display target controls to source variables referenced in `attrs.control_display[]`.
- Create edges from `ContentList` source variables to target data-list fields.
- Annotate `ContentList` edges with type compatibility:
  - `number -> Decimal/input_number`
  - `boolean -> Bit/switch`
  - `text -> Text/input/radio`
- Warn when a data-list field exists for an approval variable but no `ContentList` mapping persists it.
- Warn when a new request-page business control is not mirrored on the approval page as readonly, unless the control is explicitly request-only.

## Proven v11 Multi-Type Graph Baseline

`visitor-access-management.v11-five-fields-multitype.yap` passed graph validation and runtime testing with a multi-field, multi-type expansion.

Graph validation summary:

- Fresh ID family: `216...`
- Fresh FlowKey/form key: `VBB`
- App-level approval form `Data.Forms[].ListID = 0`
- Nodes: `39`
- Edges: `21`
- Lists: `2`
- Fields: `27`
- Approval forms: `1`
- Lookup edges: `3`
- ContentList edges: `1`
- Unresolved edges: `0`
- Cycles: `0`
- ReplaceIds: `46`

Confirmed target fields and mappings:

| Source variable | Target field | Compatibility |
| --- | --- | --- |
| `VisitorEmail` | `Text13` | text -> Text/input |
| `VisitorPhone` | `Text14` | text -> Text/input |
| `NumberofVisitors` | `Decimal1` | number -> Decimal/input_number |
| `AccessType` | `Text15` | text/radio dropdown -> Text/radio |
| `RequiresEscort` | `Bit1` | boolean/switch -> Bit/switch |

Conditional display graph rule:

- `EscortUser` is a form-only variable/control.
- Its target control contains `attrs.control_display[]`.
- The display condition references source variable `RequiresEscort`.
- The condition value is boolean `true`.
- It is not a graph persistence edge in v11 because there is no target storage field.

Graph validator implication:

- Multi-field expansion should still produce one coherent `ContentList` target edge to the generated request list.
- Richer control types should not alter root navigation, Department lookup edges, approval-form lookup edges, or app shell edges.
- The graph should flag a new persisted business variable if no compatible `ContentList` target field exists.
- Form-only conditional fields may be allowed when explicitly documented as not persisted.
