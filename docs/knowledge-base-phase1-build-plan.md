# Knowledge Base Phase 1 Build Plan

Source export: `/Users/Renger/Downloads/Knowledge Base_1.yap`

Goal: generate a Phase 1 Knowledge Base app that covers the core local data-list and dashboard behavior from the real template without external services, workflows, document libraries, AI, or unproven query-param detail pages.

## Source Reconfirmation

The real template contains:

- root app/listset
- local `Categories`, `Sections`, and `Articles` lists
- Type `103` dashboard pages: `Home Page`, `Search`, and `Admin`
- Collection controls for articles and categories
- article/category/section lookup relationships
- no workflows, approval forms, reports, AI modules, connections, or document libraries

Already proven generated baselines:

- `knowledge-base-generated-v4`: Articles and Categories with flat dashboard Collections.
- `knowledge-base-category-lookup-v11`: Category `Order` plus Article `Category Lookup` sorted by that order, with Articles requiring one first-load refresh.

## Phase 1 Scope

Include:

- `Categories` list with category name, description, order, accent/status color.
- `Sections` list with section name, category label, description, order.
- `Articles` list with title, summary, category label, category lookup, section label, status, featured flag, updated date, and article body excerpt.
- `Home Page` dashboard with search filter, featured article cards, category cards, and section/topic cards.
- `Article Library` dashboard with article list/card Collection presentation.
- meaningful `nv_label` names.
- sample category, section, and article records.

Defer:

- nested category-to-article Collection filters.
- source-style `Sections.Category` and `Articles.Section` lookup chains.
- lookup sample values for article category.
- rich text article body editor beyond a safe textarea field.
- image/icon upload fields.
- Search query-param flow and Admin application URL action cards.
- custom list forms until a Knowledge Base-specific form baseline is isolated.

## Stages

Stage A: confirm v4/v11 baselines are the starting point.

Stage B: add `Sections` as a plain local topic list, no lookups.

Stage C: add richer article metadata: status, featured flag, updated date, body excerpt.

Stage D: keep the v11-proven article-to-category lookup shape with blank lookup sample values.

Stage E: add `Article Library` dashboard page with a flat article Collection.

Stage F: final Phase 1 package and runtime testing.

Each generated import-test package uses a fresh ID family. If any stage fails, isolate the new feature with a smaller fresh-ID package.

## Stop Conditions

- dashboard Collection source list does not resolve.
- list validation or graph validation fails.
- import fails and Chrome/runtime evidence does not identify a clear isolation step.
- Articles list still hangs after one refresh.
- a feature requires external credentials or unproven nested/query-param behavior.
