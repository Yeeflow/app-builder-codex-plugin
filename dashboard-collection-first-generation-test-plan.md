# Dashboard Collection First Generation Test Plan

## Objective

Generate the smallest import-testable Yeeflow dashboard package that proves Codex can create a Collection control over a local data list.

## Source Pattern

Source export studied read-only: `/Users/Renger/Downloads/Service Desk Pro Dashboard Stage M.yap`

Studied dashboard: `Tickets with Collection`

## First Test Scope

Include:

- one root app
- one local Support Tickets-like data list
- one Type `103` dashboard page
- one Collection control only
- one repeated item template
- dynamic fields for ticket title, priority, status, and assigned team
- one conditional style badge based on priority
- meaningful `nv_label` names for the section, Collection, item wrapper, and badge container

Exclude:

- table-style Collection
- dashboard charts
- KPI summaries
- dashboard filters except those required by the Collection itself
- approval forms
- workflows
- reports
- AI, connections, document libraries, and external dependencies

## Result

Completed:

- `generated-dashboard-collection-card-v1.yap` passed validation, wrapper build, import, and runtime rendering.
- `generated-dashboard-collection-table-v3.yap` passed validation, wrapper build, import, and runtime rendering as the second isolated table-style Collection test.

Failed learning artifact:

- `generated-dashboard-collection-table-v2.yap` imported but rendered vertically because its `flex_grid` controls used `attrs.layout.cols` instead of the export-shaped `attrs.columns` and `attrs.rows`.

Current status:

- Collection card/grid pattern is proven.
- Collection table-style pattern is proven.
- Dynamic fields, `__ctx_coll` dateFormat expressions, and conditional style rules are proven.
- Hide/show dynamic display actions, full-text search/filter binding, sorting, pagination, and empty states are not yet proven.

## Validation

Before building:

- `node validate-yap-package.js <resource.json> --mode generator --stage final`
- `node validate-yap-graph.js <resource.json> --mode generator --stage final`

Before runtime:

- build wrapper with `build-yap-wrapper.js`
- run package and graph validation on the wrapper

Runtime:

- import into `https://<yourdomain>.yeeflow.com`
- confirm import metadata parses
- confirm app opens
- confirm dashboard navigation renders
- confirm Collection cards render local Support Tickets rows
- confirm dynamic fields show item values
- confirm priority badge styling changes by item
- confirm local Support Tickets list opens without visible query errors

## Stop Conditions

- Collection data source cannot resolve to the local list
- dynamic fields do not resolve to source-list fields
- `__ctx_coll` expressions cannot be validated
- conditional style rules fail JSON validation
- wrapper validation fails
- runtime import fails without collectable browser evidence
