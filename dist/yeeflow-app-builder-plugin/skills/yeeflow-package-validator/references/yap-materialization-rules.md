# YAP Materialization Rules

Materialization checks answer whether Yeeflow can create the expected runtime objects from a package.

## Required Objects

For an application-level `.yap`, confirm the package contains the expected:

- app metadata
- data lists
- approval forms
- dashboards or app pages
- workflows
- resources or embedded definitions needed by those objects

## Identity And Relationship Rules

- Keep generated app IDs, list IDs, field IDs, form IDs, workflow IDs, and page IDs internally consistent.
- Ensure fields belong to their parent list through matching `ListID`.
- Ensure lookups target existing lists and target fields.
- Ensure approval forms bind to the correct main list.
- Keep `Data.Forms[].ListID = 0` when the package format requires app-level packaging with wrapper-owned binding.
- Avoid reusing stale ID families from unrelated app generation runs.

## Corruption Checks

Search decoded package content for:

- malformed prefixes
- accidental `pr<id>x` insertion into field names or resource keys
- duplicated internal names
- unresolved lookup targets
- missing workflow variables
- broken task URLs
- stale resource references

## `.yap` Versus `.yapk`

- `.yap` can be generated for new application creation.
- `.yapk` is treated as read-only/server-generated until Yeeflow signing and Resource mechanisms are proven.
- Do not mutate `.yapk` contents for an upgrade claim. Export, inspect, and document findings instead.
- Product signing utilities can sign and verify wrappers only when `Resource` is already valid `.yapk` opaque payload. Wrapper-sign success does not prove app-content mutation, and unchanged `Resource` means unchanged app content.

## Import Decision

Materialization failures are usually blocking. Do not import if required lists, forms, workflows, pages, or resources cannot be created from the package or if identity corruption is detected.
