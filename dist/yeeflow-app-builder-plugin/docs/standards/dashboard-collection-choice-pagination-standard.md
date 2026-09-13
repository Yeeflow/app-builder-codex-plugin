# Dashboard Collection choice styles and pagination

## Planning and composition rules

For Collection choice fields such as Channel and Status, prefer conditional Container + Text badges when a compact visual category/status is useful. Determine single/multiple selection from source schema, not a field label. Map actual stored option values separately from visible labels. Use source/configured choices and known historical values; do not invent states or change records to match a design. Record the choice field, stored shape, palette, fallback and multi-value presentation in the Collection plan. Respect an explicit request for plain text or a different presentation.

The badge Container owns the Dynamic style condition and uses its own ID as controlId. Set all three channels independently: background (`normal.bgcolor`), border (`normal.border.color`, with width/type), and text (`normal.color`) in JSON action_style. Its Text inherits color and binds the real field. Border color need not equal text color. Preserve native columns, sorting, current-item expressions, action bindings, responsive item trees and schema-compatible Dynamic controls required by the selected template. Do not replace a whole native Collection with an imitation table to obtain badges.

Use `buildCollectionNativeBadge` for the established single-choice Container/Text pattern. Use `buildCollectionChoiceStyleRule` and `buildChoiceStyleCondition` in `scripts/lib/dashboard-collection-presentation.mjs` for condition/style construction. Single-choice uses equality. For a schema-verified array of scalar option values, multi-choice uses `arrayIndex(field, exactOption) >= 0`; do not compare the entire array to one string or use substring matching (Web must not match Webinar). Delimited text, lookup-object arrays, or unknown storage require explicit mapping evidence; the helper rejects unverified multi-choice storage.

For multi-choice presentation, prefer one badge per selected option after verifying item/display-rule shapes. If styling a combined label instead, plan mutually exclusive combination conditions or an explicit verified priority; do not depend on undocumented ordering of multiple matching color rules. Keep all selected values visible and define unknown/empty behavior. Unknown values use a neutral fallback rather than disappearing; empty does not mean Draft/Approved. Dynamic display rules control visibility, while Dynamic style controls appearance; one does not replace the other. Per-option rendering, conflict resolution and responsive wrapping require focused runtime proof before promotion. The membership/style builders are locally validated from known expression/schema shapes; this round does not establish multi-choice runtime behavior.

## Default pagination

New ordinary Dashboard record Collections default to **10 records per page**. The serialized property is `attrs.data.ps = 10`; `attrs.pagination.p` is pagination visual style, not page size. Golden templates may contain 9/16/20: those are source defaults, not user overrides. Apply the default after cloning/mapping, not by changing every source template.

An explicit Collection plan `Records per page` or `Page size` column overrides 10 and must be a positive integer. Plan and generation helpers carry the value into the resource. Preserve pagination display, data filters, sorting, search, sources and page style. Never interpret page size as permission to truncate/delete records. Paging must still make subsequent records reachable.

Exceptions: current-item detail Collections stay at 1; intentionally limited/top-N regions, dedicated print datasets and user-requested pagination behavior keep their semantic contracts. This default is for new generation. Existing dashboard upgrades preserve user-configured page sizes unless changing pagination is part of the authorized scope. Approval/Data List form Collections are outside this Dashboard policy.

Use `applyDashboardCollectionPagination` for new datasets. The full-app Dashboard builder and shared standalone path call it after native template cloning; master-detail left lists use it while selected-detail remains 1. Do not bypass the shared builder for standalone pages.

## Regression and proof

`scripts/test-dashboard-collection-presentation.mjs` exercises actual Dashboard materialization for default 10, explicit override and master-detail 1, plus invalid sizes, existing/limited preservation, exact multi-choice membership, and separate border/background/text. It runs through the native-rich training suite in source and distribution.

Toolbar scope, Select alignment, automatic menu placement and foreground contrast follow `collection-toolbar-style-standard.md`. Generated known dark row menus now use the tested autoposition and scoped foreground helper. Add/Select height fallback remains opt-in on the owning control rather than being applied to every template.

Proof: previous desktop toolbar save/readback/render observations remain valid only for that live repair. This round is local training and generated-resource regression. New page-size runtime navigation, multi-choice badges, hover/active states and mobile behavior are separate acceptance items. No plugin publication or live dashboard change is implied.

## Collection content density

Follow `docs/standards/native-collection-density-standard.md`. For native Table/Card Collections, plan field-aware widths after actual container placement, using native `cw/cwu`; limit narrative Dynamic fields through `t-len` only with a complete-value route. Collection selection rows accept optional `Column widths` (JSON map), `Text lengths` (JSON map) and `Full value access` (`source-list`, `record-detail`, `none`). The real materializer consumes these fields and rejects invalid overrides. Keep 10-record defaults, choice styles, scoped toolbar/menu behavior, sorting, source bindings and mobile card content intact. Pixel/percentage examples are mapping evidence, not universal layout defaults.
