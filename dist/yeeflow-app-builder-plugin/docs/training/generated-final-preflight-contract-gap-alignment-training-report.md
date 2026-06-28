# Generated-Final Preflight Contract Gap Alignment Training Report

## Context

Office Asset Loan Management validation against active plugin `0.8.79` showed strong generated-final progress, but first-generation preflight still stopped before signing. The package already materialized Dashboard Collection, Data Analytics, Data Table, export-shape, ID provenance, navigation, select-filter, live-install readiness, and empty-section cleanup gates. Remaining failures were concentrated in validator/generator contract alignment:

- Dashboard filter variables could be declared and consumed by separate Collection surfaces, but the runtime binding validator only credited a single consumer value per Collection.
- Approval runtime surface checks inspected top-level form metadata but missed request/task page registrations stored only inside encoded `DefResource`.
- Data List form layout matching relied on exact App Plan prose even when the generated package already proved New/Edit, View, and Workbench form assignments through Type `1` custom form layouts.
- Search filter placeholders can regress to object-shaped values such as `{ "value": "Search ..." }`, which render as `[object Object]` at runtime.

## Training Decisions

### Runtime Binding Lessons

The runtime binding validator must credit every dashboard filter variable consumed by a Collection or Data table, including variables consumed across `attrs.data.filter[]`, `attrs.data.fulltext[]`, and related consumer metadata. A single Collection can legitimately consume multiple declared variables, so validators must not mark the second variable as unconsumed.

Approval form runtime surface validation must decode `DefResource` when the form-level `pageurls` array is absent. Supported generated-final encodings include direct objects, JSON strings, Brotli base64, and `base64("::brotli::" + Brotli(JSON))`. Request/task page URL checks and workflow panel/history checks must use decoded `DefResource.pageurls[]` before reporting missing runtime surfaces.

### Data List Form Layout Matching

Plan-only validation remains strict: App Plans must explicitly select approved Data List Form Layouts v1.1 templates and must state Workbench View Item forms open as Full page.

Generated-final validation with both `--plan` and `--package` may use package coverage as proof when older App Plan wording is stale but the package demonstrates compliance:

- New/Edit entry points point to Type `1` custom forms using `data_list_form_layout_new_edit_v1_1`.
- View entry points point to Type `1` custom forms using `data_list_form_layout_view_item_v1_1` or `data_list_form_layout_workbench`.
- Workbench view open mode is validated from package `ListModel.LayoutView.view` / layout metadata rather than requiring duplicate prose in the App Plan section.

This is not a relaxation for package output. It prevents App Plan parser false positives while still requiring the generated package to prove the custom form assignment contract.

### Search Filter Placeholder Shape

Generated `search-filter` controls must serialize `attrs.placeholder` as a primitive string. Template/helper wrapper objects and string-spread numeric-key objects are forbidden because the browser renders them as `[object Object]`. The full-app materializer regression test now scans generated packages and fails if any generated search filter placeholder is not a primitive string.

## Validation Added

- Runtime binding regression: one generated Collection consumes multiple filter variables without false unconsumed-variable findings.
- Runtime binding regression: encoded Approval `DefResource.pageurls[]` satisfies request/task page URL and workflow panel/history surface checks.
- Data List form layout regression: generated package coverage suppresses stale App Plan New/Edit/View row false positives only when the package proves Type `1` custom form assignments.
- Data List form Workbench regression: generated package coverage proves Full page open mode for Workbench View Item forms, while plan-only validation still fails missing Full page wording.
- Full-app materializer regression: generated search-filter placeholders must be primitive strings.

## Safety Boundary

These changes do not sign, install, import, upgrade, seed data, or claim browser/runtime proof. They align generated-final preflight semantics so signing readiness can be evaluated by the correct package facts and runtime contracts before any live Yeeflow write.
