# Native Collection rich content training

## Scope and proof

This learning round uses a previously saved/read-back Dashboard and desktop browser observations. It is a narrow live-update baseline, not a fresh-import or all-host baseline. Reusable files contain no tenant payloads or business rows. Local fixtures are synthetic.

Preserve native `attrs.tablecols` for desktop/tablet and the separate mobile `children` item tree. Never replace a native Collection with a fabricated paired Flex Grid merely to style it. Preserve list binding, fulltext, sort, pagination, local actions, current-item context, and unrelated page regions.

## Generation recipe

1. Inventory actual fields and existing functions before interpreting an image. A pictured field, upload, progress calculation, or selected-detail pane is not evidence that it exists. Compare the returned image against the approved toolbar order too.
2. Keep the required content_card_wrapper under section_content_area. A Collection with its own caption does not need a repeated section_title_area. Preserve unique business descriptions if they carry information.
3. For single-select badges, use `buildCollectionNativeBadge` from `scripts/lib/collection-native-badge.mjs`. Supply resolved field names, actual values, reviewed palettes, and a page-wide unique ID allocator. The helper is opt-in; do not convert ordinary text fields into badges automatically.
4. The generated Container owns control_display rules targeting its own ID. Each rule compares a variable_ctx expression in __ctx_coll against an exact value and applies style_class/action_style. The Text binds the real field and inherits color. Unknown values remain visible using the neutral base style; never relabel or rewrite records to match a mockup. Empty values do not imply a business status.
5. Give newly materialized native columns stable identities, preserving existing IDs. Review missing/conflicting identities with the dashboard collection inspector. Historical omissions are advisory, not a hard claim of invalid product schema.
6. Include both tablecols descendants and ordinary children in control ID/binding/action audits. Desktop success is not mobile success.

## Runtime-sensitive styling

In the observed runtime, setting column attrs.width and attrs.minWidth alone still produced 200px col elements and a 1200px table. The exact native property mapping remains unresolved. Do not train those paths as a proven width solution.

An observed fallback is `attrs.common.css` scoped with `selector`, using `.ant-table-thead>tr>th`, `.ant-table-tbody>tr>td`, and `table.ant-table-fixed` / col selectors. This can style header density, horizontal separators, hover, and widths. Keep it scoped to the target card, derive widths from its real columns, preserve narrow-screen scrolling, and verify DOM measurements after reload. Do not ship tenant-specific CSS classes or promote these implementation selectors as a stable platform API. Native style support and this fallback are distinct claims.

## Required acceptance matrix and open learning

| Area | Established observation | Still required before broader claims |
|---|---|---|
| Badge | Saved/readback and desktop colored labels | All palettes, unknown/empty values, alternate hosts and mobile |
| Filters | Search, displayed Status/Owner/Channel selections, combinations and individual clears worked | Exhaustive options, values occurring only after first source page, duplicates, empty owner, remote search and no-match recovery |
| Owner | Visible identity label and combined equality worked | DOM title was [object Object]; accessibility and value serialization need explicit coverage |
| Add | Existing New/Edit form opened and was cancelled | Submission/persistence not tested by this design pass |
| Edit | Existing Edit item route opened a View layout | Inspect actual action mode, target-owned layout and editable form controls; a label is not execution proof |
| Selection | Hover tint | Persistent selection and linked-detail state are separate capabilities |
| Responsive | Native mobile subtree preserved | Desktop rich fields/styles and mobile controls must be compared and tested independently |

Do not infer complete filter candidates from a successful selection: observed candidate lists omitted a status present elsewhere in the page summary. Cause (pagination, configuration, or other runtime behavior) is unresolved. Do not change source records or invent a pagination property to hide this gap.

Run `node scripts/test-collection-native-rich-training.mjs`, the Collection generation tests, responsive routing tests, and dashboard grid-table tests. Run equivalent distribution tests. Retain separate labels for local validation, persisted readback, rendering, and business action execution. Training this document does not publish a plugin or prove the open cases.

## Training validation result

Release 1.15.5 resolves the earlier preflight failure below: two synthetic Dashboard Search controls inherited attrs.binding from the responsive template, while the canonical exported path is control.binding. The generator now normalizes legacy placement and rejects conflicting values. Regression tests verify declarations and fulltext consumers. Source and distribution full-app tests pass; both complete UI suites pass 29/29. The earlier failure paragraph is retained as historical diagnosis, not the current release status.

The new badge/identity/traversal regression and the existing Collection generation, responsive routing, and dashboard grid-table suites passed in source and plugin distribution. The aggregate UI suite passed 14/15 source suites and 13/14 distribution suites. Both failed the full-app materialization entrypoint preflight at `dashboard-select-filter-runtime-contract` with `FILTER_VARIABLE_MISSING`. Causality is not established; do not report aggregate readiness or release readiness until this failure is investigated. Source and distribution had a pre-existing difference in aggregate suite membership; this round preserves that difference.

This round changes source and distribution learning assets only. It does not merge, tag, publish, install a new version, or run new live tenant mutations. The open capability matrix remains an explicit continuation backlog.
