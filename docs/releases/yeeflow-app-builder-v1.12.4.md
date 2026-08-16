# Yeeflow App Builder v1.12.4

## Version decision

- Previous stable version: `1.12.3`
- New version: `1.12.4` (patch)
- Scope: Dashboard KPI, Summary, Text, temporary-variable binding closure, and Golden Reference Collection Designer-editability.

## Included changes

- Declare Dashboard `tempVars[].id` and `.name` as the same unprefixed semantic ID.
- Require Summary `attrs.save_var.id = "__temp_" + declaredId` and `name = declaredId`.
- Require visible KPI Heading/Text `attrs.headc.title.variable[]` to use the same runtime-id/raw-name pair.
- Fail closed for prefixed declarations, double runtime prefixes, name mismatches, and unresolved references.
- Keep `{ prefix: "__temp_", value: declaredId }` limited to property families proven to use that serialization; it is not the default Summary/KPI Text format.
- Require Collection creation and update paths to clone the complete selected Golden Reference subtree rather than assemble `attrs.tablecols` manually.
- For Golden References that use native `list-column` nodes, require unique UUID `id`/`mapkey` values and item-context Dynamic children with `attrs.source = "3"` plus a resolved `attrs["obj-f"]` field.
- Treat `DASHBOARD_COLLECTION_DESIGNER_COLUMN_INVALID` and `DASHBOARD_COLLECTION_DESIGNER_COLUMN_DYNAMIC_BINDING_INVALID` as fail-closed; validate before save and from persisted readback.

## Verification boundary

- Source and distribution regression checks establish structural configuration closure.
- API acceptance and persisted readback do not prove Designer rendering, Collection editability, or browser KPI refresh; those remain separate evidence levels.
