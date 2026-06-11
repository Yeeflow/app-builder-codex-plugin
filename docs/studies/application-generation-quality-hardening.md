# Application Generation Quality Hardening

## Reason For Study

The public v0.6.1 Yeeflow App Builder plugin generated an application with lower UI quality than prior local generation and testing. The observed issues were:

- A dashboard Data table control had no display fields configured, causing the table to fail or not load.
- Dashboard and Data List custom form layouts had no safe left/right padding, placing content too close to the window edges.
- The generated application did not consistently follow the local generation layout and validation standards.

## Dashboard Quality Standards

Generated dashboards should be conservative, stable, and readable by default.

- Every dashboard page should use an outer page section/container with safe left/right padding.
- Recommended default horizontal padding is 24px to 32px on desktop, with smaller responsive padding on tablet/mobile when supported.
- Major content groups should sit inside section, card, container, or grid structures.
- Avoid placing major controls directly under the page root or flush against the browser/window edge.
- Prefer fewer well-configured dashboard controls over many thin or incomplete controls.
- Empty or unconfigured controls should be omitted until they can be configured safely.

## Data List Custom Form Quality Standards

Generated New/Edit/View forms should be usable without manual designer cleanup.

- New/Edit/View custom forms should use an outer container/section with safe left/right padding.
- Form content should be grouped into clear sections or cards.
- Controls should not touch page/window edges.
- Rows and sections should have visible spacing.
- Required business fields should be easy to scan.
- Internal routing/reviewer-only fields should stay off submitter-facing forms unless explicitly requested.

## Data Table Standards

Dashboard Data table controls are `type: "data-list"`. They must not be generated with an empty display-field configuration.

For every generated Data table:

- Configure `attrs.data.list`.
- Configure `attrs.listarr[]` with meaningful display columns.
- Use at least 3 to 5 meaningful display columns when fields are available.
- Include a primary title/name field when available.
- Include status, date, owner, amount, priority, progress, or category fields when relevant to the business process.
- Avoid hidden/system fields unless they are needed for a clear operational reason.
- Ensure every displayed field resolves to the selected source data list.

If suitable fields are not available, do not generate a Data table. Use a Collection, cards, summary controls, or a simple message instead.

Empty Data table display fields are a generated-final hard error.

## Control Completeness Standards

- Collection, Kanban, and Timeline item templates must include meaningful dynamic fields.
- Progress controls must have numeric values or valid bindings.
- Steps bar controls must have valid steps or a valid current-step binding.
- QR Code, Barcode, Embed, and Document embed controls must have valid safe configuration or be omitted.
- Buttons and actions must bind to valid actions and targets.
- Any generated control requiring a data source or field binding must resolve before package handoff.

## Application Planning Guidance

Before generating a package, create a short UI plan:

- pages
- major sections
- data sources
- controls per page
- fields shown per data-bound control
- layout and padding approach

If a user request is vague, generate a conservative polished application rather than a broad unfinished dashboard. The default posture should be: fewer controls, better configured, validated before handoff.

## Validation Guidance

Generated packages should pass a UI quality gate before being considered ready. The gate should check:

- dashboard pages
- Data List custom forms
- root/container padding
- Data tables and configured columns
- empty controls
- unresolved field bindings
- major content sections/cards

Use `scripts/inspect-generated-ui-quality.mjs` together with the strict package validator and import-readiness gate.

## Proof Boundary

This branch encodes generation and validation standards. It does not prove every generated future app will be visually perfect. It should reduce known failures such as empty Data tables and no-padding layouts.

Runtime confirmation requires a focused generated application proof using the new quality gate, followed by import/open/render checks in Yeeflow.
