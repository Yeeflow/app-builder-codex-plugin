# Application Builder Self-Test Task C Learnings

Date: 2026-05-17

This note consolidates reusable black-box findings from the Equipment Borrowing and Visitor Access self-tests. The self-test applications are evidence only; they are not product baselines and their raw generated `.yap`, `.ydl`, or `.ywf` artifacts should not be committed as reusable examples.

## Findings Summary

Equipment Borrowing passed local validators with warnings but did not receive runtime testing. The generated app included a borrowing request list, approval form, workflow-form line items, summary persistence, and a minimal dashboard. The main gaps were business-scope fidelity: Equipment Catalog was not generated as a real maintained list, line items were not persisted as child rows, availability was only admin review routing, and the dashboard was too minimal for the process.

Visitor Access passed app-level package validation with warnings but failed standalone generated-list validation. The extracted Visitors and Visit Requests lists exposed missing standalone list type metadata, duplicate `VisitorCompany` internal names, unresolved lookup/dependency maps, sample lookup target issues, and legacy custom list forms that did not meet the current `Edit Item` / `View Item` standard.

## Finding Classifications

| Finding | Classification | Reusable action |
| --- | --- | --- |
| Equipment Catalog not generated as a real active list | reusable skill/generator improvement | Builder must decide whether master/reference lists are real generated lists, external dependencies, or deferred. |
| Item sublist not persisted as direct child-row records | reusable skill/generator improvement | Planning must choose workflow sublist summary, direct child-row persistence, or separate transaction item list. Direct child-row persistence still needs proof per pattern. |
| Availability logic was review/routing-based, not true stock availability | reusable skill/generator improvement | Builder must label availability as manual review, query-based availability, or inventory/reservation based. |
| Dashboard too minimal | reusable skill/generator improvement | Dashboard scope must be meaningful for v1 while using proven widgets/Collections/KPIs. |
| `flex_grid.attrs.rows` schema warnings | validator improvement | Keep schema warnings visible; do not hard-fail until runtime evidence says the generated shape breaks import/open. |
| Environment-dependent `identity-picker` | acceptable limitation | Keep as warning and require tenant/user proof for runtime claims. |
| Calculated list-field runtime promotion warning | needs focused runtime proof | Keep warning until normalized schemas and runtime proof align. |
| App-level validation passed while extracted standalone lists failed | validator improvement | Package validator should detect child-list standalone blockers and generation must run `validate-ydl-list` for each child list. |
| `MAIN_LIST_TYPE_MISSING` on standalone lists | validator improvement | Generated lists must include `MainListType` or `ListModel.ListType`. |
| Duplicate internal field name `VisitorCompany` | validator improvement | Duplicate internal names are blocking. |
| Unresolved standalone lookup dependency | validator improvement | Lookup target/dependency resolution is blocking when it breaks import/runtime. |
| Sample lookup dependency issues | validator improvement | Sample lookup values must map to valid target rows or dependency-map references. |
| Legacy custom list forms missing `Edit Item` / `View Item` standard | validator improvement | Keep as warning unless a runtime-breaking case is proven. |

## Promoted Rules

- Master/reference lists must be explicitly planned as real active lists, external dependencies, or deferred.
- Line items must declare persistence: sublist summary only, direct child rows, or separate transaction item list.
- Review-only availability must not be described as stock control.
- Generated dashboards should include useful v1 queues/KPIs/Collections when dashboard is in scope.
- Every generated child list must pass standalone list validation, not only app-level validation.
- Generated lookup samples must point to valid target rows.
- Generated data-list custom forms should follow the current `Edit Item` / `View Item` standard.
