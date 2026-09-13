# Native Collection column width and text density

## Evidence and scope

Native Dashboard table columns support `attrs.tablecols[i].attrs.cw` (responsive numeric value) and `cwu` (responsive unit). User-authored Designer samples plus persisted readback established `[null,160]` for 160px with the default unit omitted and `[null,15]` / `[null,"%"]` for 15%. Native `dynamic-field` Text length is `attrs["t-len"] = [null,180]`. This is NOT the Text/heading `attrs.headc.title["text-len"]` property. `attrs.width` or `minWidth` alone is not the proven Column width mapping.

Source-list bound Dashboard updates were saved, read back and observed on desktop. Percentage columns resolved to container-relative pixel col widths. Native text length reduced excessive narrative row height. These observations do not prove alternate hosts, mobile cards, every breakpoint, multilingual truncation, or form submissions. Existing functions, paging and data remained unchanged.

## Generation contract

Use `scripts/lib/collection-native-density.cjs` through the actual Dashboard materializer. Apply density AFTER the Collection is placed in its page slot, with resolved source fields. A full page does not imply that each Collection has full page width. Row siblings and Grid ancestry constrain the slot. Unknown or constrained slots use deliberate pixel widths and retain native horizontal scrolling. Full-width slots with up to eight columns use percentages totaling 100 unless explicit native widths take precedence. More columns use readable pixel widths instead of squeezing all content into one screen.

Widths reflect field roles and choices: Title and narrative receive more room, people/dates moderate room, choice/numeric fields compact room, operation/selection columns narrow room. Choice option lengths come from schema, not only the first page of records. General text and lookup labels must not be assumed short. The helper uses conservative starting widths; the runtime reviewer must refine them from actual content and container measurements. Do not turn sample 160px/15% values into universal defaults. Do not globally force a fixed row height.

New sample-derived business columns discard reference widths and text limits before binding; these values belonged to sample fields. Preserve native column IDs, selection-column shape, sorting, item context and actions. New generation defaults ordinary record Collections to 10 per page. Do not rewrite card, Kanban, Flex Grid or Data Table layouts with the native table policy. Preserve the separate mobile card subtree; desktop width settings are not mobile proof.

The automatic pass covers newly materialized standard responsive record tables. Pre-embedded master-detail selection/detail collections and print-specific layouts retain their separate policies and are not automatically replanned by this pass.

For existing applications, the helper is a no-op unless `mode:"existing", authorized:true` expresses the user's scope. Existing device overrides and text limits stay in place unless specifically changed. Never replace unrelated CSS, filters, actions, data, paging, or source schemas to adjust density.

## Native text length and complete information

Only narrative fields such as Next Action, Blocker, Failure Reason, description/notes, or schema-confirmed textareas qualify for default display limits. Default Next Action is 180 and other narratives 160 when a complete-value route is established. Keep Title, identity/reference/receipt/URL, people, dates, numbers and ordinary unknown text complete. `Text lengths` may use `"full"` to explicitly keep full display.

Text length is NOT a line clamp and cannot promise exactly three lines or a fixed row height. It changes displayed text, not stored data. The native tooltip may contain the truncated value too; do not claim hovering reveals the full text. Keep the source list or a verified record-detail route accessible. No verified route means no automatic truncation. Never fabricate a detail action from a button's label. User-approved clipping must preserve an independent full-value path.

## Plan and overrides

The Collection selection table in App Plan section 14, also used by standalone Dashboard generation, accepts these optional columns:

| Dataset region | Source list | Selected template | Display fields | Column widths | Text lengths | Full value access |
|---|---|---|---|---|---|---|
| Work queue | Work Items | collection_control_responsive | Title, State, Next Action, Due Date | {"Title":"30%"} | {"Next Action":180} | source-list |

`Column widths` and `Text lengths` are JSON objects keyed by exact resolved field name or display name. Use `"120px"` / `"15%"` width strings and positive integer lengths or `"full"`. A partial percentage plan allocates the remaining percentage by field role; invalid budgets fail. Unknown fields, conflicting aliases, invalid values and ambiguous partially specified mixed units fail before generation. Complete intentional mixed-unit plans preserve native intent and require runtime checking.

`Full value access` is `source-list`, `record-detail`, or `none`. For new generated Data Lists with a resolved list ID and detail layout, the materializer defaults to the source-list route; this is not a claim that the table Title is clickable. `record-detail` must be confirmed by the functional plan. `none` disables automatic truncation and rejects explicit clipping. Missing route evidence appears as a density warning rather than silently hiding content.

## Validation and training acceptance

New materialized native Collections carry `collectionDensityPolicy.version = 1`. The public Collection gate requires native widths for that policy, checks responsive shapes, numeric positive widths, supported units, percentage budget and text lengths. Historical missing widths remain advisory unless `requireNativeCollectionDensity` is explicitly requested; old specimens must not be retroactively declared product-invalid.

Run `node scripts/test-collection-native-density.mjs` and the native-rich and full UI suites in source and distribution. Tests must exercise Markdown plan parsing through the real builder, full and constrained placement, role-aware allocation, explicit overrides, narrow operation columns, mixed-width rejection, wrong schema keys, unbounded identifier/title values, missing full-value route, existing-instance no-op, unrelated configuration and device preservation, and corrupted generated artifacts through the public validator. Helper-only tests are insufficient.

For live acceptance: snapshot first; save; allow bounded readback reconciliation for asynchronous persistence without immediately repeating writes; verify exact scope and persisted content; wait for each Collection's query to settle; then measure actual col widths, table/container overflow and row heights. A transient zero-row DOM is not proof of no data. Re-test search/clear, sort, paging and record routes. A successful input fill does not prove the controlled input changed. Record desktop and mobile proof separately.

Native Column width and Text length are first choice. Custom CSS is a scoped fallback only after an observed native limitation, never the default width solution. Source/generator tests do not constitute a new live application acceptance or plugin publication.
