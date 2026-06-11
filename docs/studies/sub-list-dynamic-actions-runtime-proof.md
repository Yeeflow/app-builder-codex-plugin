# Sub List Dynamic Actions Runtime Proof

## Status

V1 runtime issue found. V1.2 YAPK has been generated, signed, and verified from the user-corrected V1.1 baseline. Manual runtime confirmation is still pending.

Generated package:

`/Users/Renger/Downloads/sub-list-dynamic-actions-runtime-proof.v1.yap`

Corrected baseline studied:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.1.yapk`

Generated V1.2 output:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.2-grid-fixed.yapk`

Generated V1.3 purchase-request output:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.3-purchase-request.yapk`

Generated V1.4 row-menu output:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.4-row-menu-actions.yapk`

Generated V1.5 row-menu resource-fix output:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.5-row-menu-actions-resource-fixed.yapk`

Local source package used as schema evidence:

`/Users/Renger/Downloads/Sub list Dynamic.yap`

Additional row-menu source export:

`/Users/Renger/Downloads/Sub list Dynamic (1).yap`

## Package Scope

The generated package is `Sub List Dynamic Runtime Proof`. It contains one app-level Approval Form named `Dynamic Sub List Runtime Form`.

The request page contains one Sub List control using Dynamic content layout. The Sub List has three simple row fields:

- Item Name: text
- Quantity: number
- Notes: text

The form also includes a sibling `flex_grid` header above the Sub List to exercise the table-style header pattern learned from the export.

## V1 Runtime Feedback

The V1 generated package rendered the Dynamic Sub List and generally looked good, but the table-style header Grid was wrong:

- The header Grid rendered as one column rather than a multi-column header.
- The Grid Appearance settings could not expand in Designer.
- The Sub List display caption should be turned off for this table-style layout.
- The Dynamic item template should not rely on loose controls in the Sub List body; it should use the corrected Grid/body structure from the V1.1 YAPK.

## Corrected V1.1 Structure Learned

The user-corrected V1.1 YAPK stores the table-style area as a combined section: a container holds a header `flex_grid` followed by the Dynamic Sub List. The Sub List has `displayLabel = [null,false]`, `attrs["list-display-preference"] = "dynamic"`, and local `attrs.actions[]` for `list_new`, `list_dup`, `list_del`, and `list_import`.

Inside `list-body`, the first child is a matching `flex_grid` with export-shaped `attrs.columns`, `attrs.rows`, `cgap`, `cgapU`, `content`, and `displayLabel = [null,false]`. The header and body grids use the same column-track pattern, including narrow action/icon columns and aligned field columns.

The corrected header Grid uses object-shaped responsive column settings, for example breakpoint keys with `list` and `last` track definitions. The broken V1 header used an array/object hybrid that validated locally but rendered as one column and appeared to break the Designer Appearance panel.

## Actions Included

The generated Sub List keeps a small representative action set:

| UI action | Step type | Scope |
| --- | --- | --- |
| Add sub item / Add another item | `list_new` | Current list |
| Duplicate item | `list_dup` | Current object |
| Delete item | `list_del` | Current object |
| Import items | `list_import` | Current list |

Insert before/after, Move item, Update fields, and current-object expression examples are not included in this runtime proof package.

## Local Validation

Completed:

- Generator syntax check passed.
- Package validator passed with zero errors.
- Approval form definition validator passed with zero errors.
- Sub List dynamic inspector passed and detected one Approval Form, one Sub List, one Dynamic layout, and step types `list_new`, `list_dup`, `list_del`, and `list_import`.
- Schema-standard inspector passed with zero findings.
- Wrapper round-trip/decode smoke passed.
- Normalized JSON references parse.
- Safety scan found no raw package artifacts, screenshots, decoded payloads, `.env.local`, API responses, secrets, or conflict markers in commit-scoped files.

V1.2 follow-up:

- V1.1 YAPK wrapper parsed safely.
- V1.1 top-level `Resource` decoded with the tolerant Brotli path to complete `AppPackageInfo` JSON.
- V1.1 approval form `DefResource` decoded safely.
- Broken V1 YAP and corrected V1.1 YAPK were compared structurally.
- Generator was updated so the normal path creates a V1.2 YAPK from the corrected V1.1 baseline and keeps the old YAP path behind `--legacy-yap`.
- V1.2 YAPK generation passed.
- `setsign` returned a 32-byte signature.
- `verifysign` returned HTTP 200.
- V1.2 wrapper parse and standard Brotli decode passed.
- V1.2 Sub List inspection passed: one Approval Form, one Dynamic Sub List, caption off, body grid present, five body-grid column containers, Add/Import footer buttons, and action steps `list_new`, `list_dup`, `list_del`, and `list_import`.
- The stale standalone V1 header Grid was removed from V1.2 before signing.
- The body grid field controls were wrapped in column containers before signing.

V1.3 purchase-request follow-up:

- V1.2 grid-fixed YAPK was used as the baseline.
- A second Approval Form named `Purchase Request Form` was added with form key `PRF`.
- The new form includes a Dynamic Sub List for `PurchaseItems`.
- The purchase item fields are `Item Description`, `Quantity`, and `Notes`.
- The Sub List caption remains off.
- The Dynamic Sub List keeps the corrected table-style body pattern: Sublist body -> Grid -> Container per column -> controls.
- The generated package preserves Add/Import footer buttons and action steps `list_new`, `list_dup`, `list_del`, and `list_import`.
- `setsign` returned a 32-byte signature.
- `verifysign` returned HTTP 200.
- V1.3 wrapper parse and standard Brotli decode passed.
- V1.3 package validation passed with zero errors.
- V1.3 schema-standard inspection passed.
- V1.3 Sub List inspection passed: two Approval Forms, two Dynamic Sub Lists, caption off, body grid present, column containers present, Add/Import footer buttons, and action steps `list_new`, `list_dup`, `list_del`, and `list_import`.
- Both decoded Approval Form definitions passed final validation with zero errors.

V1.3 user runtime result:

- The Purchase Request form opens.
- The Purchase Items Dynamic Sub List renders correctly.
- The Sub List caption is hidden.
- Header/body columns align.
- The row operation menu opens.
- The V1.3 row menu contains only Duplicate and Delete.
- Delete is also available as a visible last-column row action, so the menu should omit Delete and focus on row-order actions.

V1.4 row-menu follow-up:

- `Sub list Dynamic (1).yap` was studied for additional row operation menu schema.
- Insert before current item uses `list_new` with `attrs.position = "0"`.
- Insert after current item uses `list_new` with `attrs.position = "1"`.
- Move up uses `list_move` without attrs.
- Move down uses `list_move` with `attrs.moveMode = "2"`.
- Row menu buttons bind through `attrs.control_action` to local Sub List `attrs.actions[].id`.
- V1.3 YAPK was used as the baseline.
- Only the Purchase Request Form was mutated.
- The visible Delete last-column action was preserved.
- Delete was removed from the Purchase Request row menu.
- The Purchase Request row menu now contains Duplicate, Insert before, Insert after, Move up, and Move down.
- `setsign` returned a 32-byte signature.
- `verifysign` returned HTTP 200.
- V1.4 wrapper parse and standard Brotli decode passed.
- V1.4 package validation passed with zero errors.
- V1.4 schema-standard inspection passed.
- V1.4 Sub List inspection passed: two Approval Forms, two Dynamic Sub Lists, Purchase Request row menu actions resolved to `list_dup`, `list_new`, and `list_move` steps.
- Both decoded Approval Form definitions passed final validation with zero errors.

V1.4 user runtime result and V1.5 correction:

- V1.4 still showed only Duplicate and Delete in the runtime row menu.
- Local decode showed V1.4 contained the five menu items, so the issue was not the menu schema itself.
- The Purchase Request form resource identifiers inherited from the earlier add-form generation were not distinct: `ProcModelID`, `DefResourceID`, and `DeployedDefID` had collapsed to the same large rounded value.
- V1.5 keeps the five-item row menu and bumps the Purchase Request `DefResourceID` and `DeployedDefID` so Yeeflow should materialize a fresh deployed form definition instead of reusing the prior two-item menu definition.
- V1.5 generated, signed, and verified successfully.
- V1.5 Sub List inspection passed: the Purchase Request row menu contains Duplicate, Insert before, Insert after, Move up, and Move down.
- V1.5 package validation and schema-standard inspection passed with zero errors.

Skipped due to local tool hangs:

- `validate-yap-graph.js`
- `scripts/inspect-yap-materialization.mjs`
- full `scripts/inspect-yap-import-readiness.mjs`
- `git status --short`

## Manual Runtime Test Instructions

Import:

`/Users/Renger/Downloads/sub-list-dynamic-actions-runtime-proof.v1.yap`

For the purchase-request follow-up, import or upgrade with:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.3-purchase-request.yapk`

For the row-menu follow-up, import or upgrade with:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.4-row-menu-actions.yapk`

For the resource-ID fix follow-up, import or upgrade with:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.5-row-menu-actions-resource-fixed.yapk`

Then verify:

- The app imports successfully.
- The Approval Form opens.
- The Dynamic Sub List renders without missing binding or render errors.
- The header grid appears above the Sub List.
- Add another item works.
- Duplicate item works.
- Delete item works.
- Import items opens or behaves correctly.
- The `Purchase Request Form` opens.
- The `Purchase Items` Dynamic Sub List renders with hidden caption.
- The purchase header/body columns align in the corrected table-style layout.
- Grid Appearance settings open in Designer.
- In `Purchase Request Form`, the row menu shows Duplicate, Insert before, Insert after, Move up, and Move down.
- Delete remains available in the last column if intended.
- Duplicate works.
- Insert before works.
- Insert after works.
- Move up works.
- Move down works.

Record the exact runtime result before promoting any action from pending to runtime-proven.

## Proof Boundary

This package is generated from export-proven Approval Form Dynamic Sub List schema and is pending manual runtime testing.

Runtime proof, once confirmed, applies only to this generated package, the Approval Form host, and the exact tested actions. It must not be generalized to all Sub List actions, Data List custom forms, workflow execution, current-object expression evaluation, scrollbar behavior, or row persistence.

For the V1.2 YAPK follow-up, the user-corrected V1.1 YAPK is the source of truth for the grid/header/body layout. V1.2 is generated/signed/verified, but remains runtime-pending until it is imported/upgraded and manually tested.

For the V1.3 purchase-request follow-up, the V1.2 grid-fixed YAPK is the source of truth. V1.3 is generated/signed/verified and adds a second Approval Form for purchase-item Sub List testing, but remains runtime-pending until it is imported/upgraded and manually tested.

For the V1.4 row-menu follow-up, V1.3 runtime rendering is user-confirmed. V1.4 is generated/signed/verified and updates the Purchase Request row operation menu, but Insert before, Insert after, Move up, and Move down behavior remains runtime-pending until manually tested.

For the V1.5 row-menu resource-fix follow-up, V1.4 runtime proved the old two-item menu was still being materialized. V1.5 updates the Purchase Request form definition resource IDs as well as the row menu, but runtime confirmation remains pending until imported/upgraded and tested.

V1.5 runtime result: user confirmed the generated package `/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.5-row-menu-actions-resource-fixed.yapk` works well. The tested Approval Form Dynamic Sub List row menu actions Duplicate, Insert before, Insert after, Move up, and Move down work as expected. This runtime proof is limited to this generated YAPK package, the Approval Form host, and the tested row menu actions. It does not prove Data List custom form behavior, current-object expressions beyond the tested row context, workflow execution, or broader Sub List action behavior.
