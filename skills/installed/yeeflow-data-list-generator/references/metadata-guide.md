# Metadata Guide

Use metadata to avoid guessing Yeeflow IDs and dependencies.

## Tools

- `inspect-ydl-package.js`: detailed package inventory for a `.ydl`.
- `extract-ydl-metadata.js`: clean list metadata from one or more `.ydl` exports.
- `inspect-yap-package.js` and `extract-yap-metadata.js` in the project can provide app-level metadata when available.

## .ydl Metadata

Good for:

- local list structure
- fields and field types
- views
- custom forms
- list workflows inside the list
- sample data value shapes
- lookup relationships among supplied `.ydl` files

Limitations:

- standalone `.ydl` files may not include all lookup targets
- ListSetID may be missing or only inferable
- external workflow targets may not resolve

## Full .yap Metadata

Use full `.yap` app metadata when final confidence matters.

It resolves:

- app/listset context
- all app lists
- lookup target lists
- display fields
- workflow target lists
- related app resources

In the NHIC study, `.ydl` metadata alone left several lookup targets unresolved. Full `.yap` metadata resolved the additional lists such as NHIC Grants and Contact Database.

## Dependency Maps

Use dependency maps for generated lists when dependencies are external or staged.

Include:

- source list/field
- dependency type
- target app/listset/list IDs
- target display field
- target sample/reference record IDs when sample lookup values are used
- status, such as `resolved`

Dependency maps are required for safe non-empty external lookup sample data.

## Safety Rules

- Preserve large numeric IDs as strings.
- Redact secrets/tokens/client credentials.
- Do not treat sample IDs as production metadata.
- Do not guess production IDs.
- For staged related standalone lists, import/export the reference list first and use exported-back metadata.
