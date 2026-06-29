# Not-Planned Resource Generation Hard Gates Training Report

## Source Evidence

This training round is based on `not-planned-resource-generation-plugin-training-report.md` from the Business Travel Request 0.8.89 validation run.

The validation found that an App Plan placeholder row with `Form Report Name = Not planned` and `Required = No` was materialized as a real `FormNewReports[]` resource and as a navigation target. Yeeflow rejected the upgrade because `Not planned / Form report / is in application` was treated as a real resource conflict.

## Training Decision

Planning placeholders are explicit non-resources. They must never be treated as names, resource identities, navigation targets, hidden helper resources, sample-data surfaces, permissions, workflows, or layout bindings.

The blocked placeholder values include:

- `Not planned`
- `Not required`
- `N/A`
- `NA`
- `None`
- `Not applicable`
- `No form report`
- `No dashboard`
- `No data report`
- equivalent `No ...` planning placeholders

Rows marked `Required = No`, `Include = No`, `Generate = No`, `In Package = No`, or `In Navigation = No` must be filtered before generated-final resource demand is calculated.

## Generator Rules

- `FormNewReports[]` must be empty when the Form Reports Plan contains only placeholder or `Required = No` rows.
- Navigation generation must use only planned resources that were actually materialized.
- A placeholder row must not create matching child resources, layouts, permissions, sample rows, dashboard bindings, workflow bindings, or navigation items.
- Duplicate navigation entries targeting the same package-local resource are blocked unless a future export-proven pattern proves a safe use case.

## Hard Gates

`scripts/validate-yapk-live-install-readiness.mjs` now fails packages when:

- a placeholder is materialized as a resource name in `FormNewReports[]`, `DataReports[]`, `Pages[]`, `Childs[]`, or `Forms[]`;
- a placeholder appears as a visible navigation group or item;
- duplicate navigation entries point at the same package-local resource type and target ID.

`scripts/validate-generated-final-resource-completeness.mjs` now ignores `Required = No` and placeholder rows when calculating required generated-final surfaces.

## Regression Coverage

Focused tests now cover:

- placeholder `FormNewReports[].Name = Not planned` fails live-install readiness;
- placeholder navigation entries fail live-install readiness;
- duplicate navigation targets fail live-install readiness;
- Form Reports Plan `Required = No` / `Not planned` rows do not require `FormNewReports[]`.

## Proof Boundary

This training prevents a known local-to-live materialization failure before signing readiness. It does not prove live install, Version Management `Succeed`, or runtime rendering; those remain separate evidence boundaries.
