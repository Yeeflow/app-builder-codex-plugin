# Data List MCP View Completion Training Report

## Feedback translated into a hard rule

Four generated CRM resources (`Customer Master`, `Sales Quotations`, `Quotation Line Items`, and `Quotation Versions`) persisted fields but returned `Layouts: []` and an empty list display-routing value. This is an incomplete Data List, not an acceptable hidden support resource.

## Root cause

The resource plan omitted a Data View contract, and the existing completion fixture accepted a nominal Type 0 layout without checking its persisted view metadata, columns, query coverage, or field resolution. A successful MCP save/readback therefore did not prove a usable View existed.

## Reinforcement

1. Plan the default Type 0 View and New/Edit/View form routes before a Data List MCP call.
2. Treat navigation visibility independently from list completeness: hidden lists still require a default view and resolved forms.
3. Re-read the saved resource and fail closed when the default view lacks `Ext1.Url = "default"`, parseable `LayoutView`, resolved columns, or query coverage.
4. Keep `apiAccepted`, `persistedReadback`, Designer-open, and browser action runtime as distinct evidence levels.

## Regression scope

`test-data-list-completion-contract.mjs` now rejects empty layouts, an empty default-view `LayoutView`, missing default URL metadata, unresolved view columns, and missing visible-column query coverage.
