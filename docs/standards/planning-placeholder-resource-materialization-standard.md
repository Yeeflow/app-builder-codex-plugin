# Planning Placeholder Resource Materialization Standard

## Rule

Planning-only text that means a resource is absent must never become a generated Yeeflow resource or runtime identity. This applies to Pages, Dashboards, Data Lists, Document Libraries, Approval Forms, workflows, Form Reports, Data Reports, custom forms, navigation groups, navigation items, navigation targets, ID provenance entries, and visible runtime labels derived from resource identities.

Examples include:

- `Not applicable` and `Not applicable.`
- `Not planned`
- `N/A`
- `None`
- `Deferred`
- `No Dashboard required`
- `Dashboard not required`

Trailing punctuation, Markdown emphasis, quotes, and explanatory suffixes do not turn a placeholder into a resource name.

## Generation contract

1. Normalize candidate resource names before resource counting, API ID path allocation, materialization, and navigation generation.
2. If a Dashboard plan contains only placeholder/no-resource text, emit `Pages: []` and no Type 103 navigation surface.
3. Do not allocate API-issued IDs or provenance paths for skipped resources.
4. Do not replace an absent optional resource with a shell, placeholder page, empty report, or visible navigation label.
5. Preserve legitimate business names such as `Not Applicable Cases`; matching is semantic and whole-label based, not substring based.

## Signing hard gate

Run:

```bash
node scripts/validate-planning-placeholder-materialization.mjs \
  --package generated-final.yapk \
  --plan yeeflow-app-plan.md
```

`PLANNING_PLACEHOLDER_MATERIALIZED_AS_RESOURCE` is a signing blocker. The gate is included in `yapk-first-generation-preflight.mjs` and checks resource and navigation identity surfaces even when no App Plan is supplied.

## Required regression

The real Query Data Runtime Baseline 0.9.51 package containing `Pages[0].Title = "Not applicable."` must fail. A regenerated package from the same planning intent must contain zero Dashboard pages and zero placeholder navigation entries.

