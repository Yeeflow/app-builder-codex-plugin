# Yeeflow Dashboard UI/UX Patterns

This document defines the dashboard UI/UX standard extracted from `UI and UX design (1).yap`.

Use `docs/yeeflow-application-design-system.md`, `docs/yeeflow-dashboard-design-standards.md`, and `docs/yeeflow-root-style-token-reference.md` for the current reusable dashboard standard. Generated dashboards should prefer native token references and avoid arbitrary custom color palettes.

## Studied Dashboard Resource

The mini app has one root Type `103` dashboard layout:

- Layout title: `Dashboard`
- Layout type: `103`
- `LayoutView`: `null`
- `Ext2`: `{"src":true}`
- `LayoutInResources`: one embedded page JSON resource

The embedded page JSON contains:

- `title`: `Dashboard`
- `ver`: `2`
- `filterVars`: `[]`
- `tempVars`: `[]`
- `exts`: `[]`
- one `Main` container
- one nested `Content` container

## Header Visibility

Hide header bar is stored on the embedded dashboard page:

```json
{
  "attrs": {
    "hideHeaderAll": true
  }
}
```

Generator rule:

- Generated standard dashboards should set `attrs.hideHeaderAll = true`.
- Keep app/page title available in metadata, but hide the default Yeeflow page header so the generated layout controls the first viewport.

## Content Area And Padding

The studied dashboard uses zero padding:

```json
{
  "attrs": {
    "container": {
      "padding": [
        null,
        {
          "top": "--sp--s0",
          "right": "--sp--s0",
          "bottom": "--sp--s0",
          "left": "--sp--s0"
        }
      ]
    }
  }
}
```

The dashboard export did not include `attrs.container.cw`. For dashboard pages, treat zero padding plus the standard `Main` / `Content` container structure as the proven exported pattern. Do not invent a dashboard `cw` setting until another export proves it.

## Container Tree

Studied tree:

```text
Dashboard page
└─ container nv_label="Main"
   └─ container nv_label="Content"
```

`Main` style:

```json
{
  "gap": [null, "--sp--s0"],
  "direction": [null, "column"],
  "justify_content": [null, "flex-start"],
  "align_items": [null, "center"]
}
```

`Content` style:

```json
{
  "gap": [null, "--sp--s0"],
  "direction": [null, "column"],
  "justify_content": [null, "flex-start"],
  "align_items": [null, null]
}
```

## Naming Rules

Use `nv_label` for designer-facing names:

- `Main`
- `Content`

Do not use visible text controls just to label structural containers.

## Generator Rules

Dashboard generators should:

- Use Type `103` page layouts for app pages.
- Keep `LayoutView = null`.
- Store embedded page JSON in `LayoutInResources[0].Resource`.
- Use `Ext2 = "{\"src\":true}"`.
- Set `attrs.hideHeaderAll = true`.
- Set page padding to `--sp--s0` on all sides.
- Create a top-level `Main` container and nested `Content` container.
- Put KPI cards, filters, Collection controls, tables, charts, help blocks, and empty states inside `Content`.
- Use `--c--neutral-light` or `--c--background` for page/background surfaces.
- Use `--c--background` for cards and content panels.
- Use `--c--primary` for primary dashboard actions and active pagination/action states.
- Use `--c--success`, `--c--warning`, `--c--danger`, and neutral tokens for status cards and badges.
- Use `--sp--s200`, `--sp--s300`, and `--sp--s400` for dashboard content rhythm.
- Use `8px` or `12px` radius for dashboard cards, with neutral borders before shadows.

## Validator Recommendations

Safe warnings:

- Missing `attrs.hideHeaderAll = true`.
- Missing zero padding.
- Missing `Main` container.
- Missing `Content` container.
- `Content` not nested inside `Main`.
- Many arbitrary hex colors in generated dashboard styles where semantic root tokens are available.

Risky checks for later:

- Exact layout width on dashboards, because the studied export did not store `cw`.
- Exact visual dimensions, because runtime rendering must prove how Yeeflow interprets generated sizing.
- Requiring token references when Yeeflow exports resolved hex values.

## Future Dashboard Test

The first generated UI/UX standard dashboard should add content inside the proven shell:

- small page title/header block inside `Content`
- one empty-state block
- one static KPI row
- one table or Collection bound to a local included list

Do not add charts or filters in the first UI/UX standard test unless the goal is specifically to prove dashboard data binding.
