# Yeeflow Data List UI/UX Patterns

This document defines the data-list UI/UX standard extracted from `UI and UX design (1).yap`.

Use `docs/yeeflow-application-design-system.md`, `docs/yeeflow-data-list-form-design-standards.md`, and `docs/yeeflow-root-style-token-reference.md` for the current reusable data-list form standard. Generated data-list views and custom forms should prefer native tokens for colors, spacing, and typography when style attributes are generated.

## Studied Data List Resource

The mini app contains one data list:

- List title: `Data List`
- List type: `1`
- Fields: native `Title`
- Custom forms:
  - `Edit Item`
  - `View Item`

The data list is intentionally minimal. It proves custom list form registration, display-setting mapping, page width, padding, and container naming.

Compatibility note: the studied export stores `Title.Status = 1` and `Title.FieldIndex = 1`. That is accepted as source-export evidence only. Generated packages must continue to follow the stricter generated-list rule: native `Title` metadata with `Status = 0`, `IsSystem = true`, `IsIndex = true`, and `FieldIndex = 0` where the generator controls field metadata.

## Custom Form Requirement

Every generated data list should have at least two custom list forms:

1. `Edit Item`
2. `View Item`

Display settings should map:

```json
{
  "add": "<Edit Item LayoutID>",
  "edit": "<Edit Item LayoutID>",
  "view": "<View Item LayoutID>",
  "opentype": {
    "add": "modal"
  },
  "modalsize": {}
}
```

The studied export maps New and Edit to the same `Edit Item` form and View to `View Item`.

## Custom Form Storage

Both custom forms are stored as Type `1` layouts on the data list:

- `Layout.Type = 1`
- `Layout.Title = "Edit Item"` or `"View Item"`
- `Layout.LayoutView = null`
- `Layout.Ext2 = "{\"src\":true}"`
- `Layout.IsItemPerm = false`
- `Layout.LayoutInResources[0].Resource` contains the form JSON

The studied export used `LayoutInResources[0].ID` and `RefId` values that match after numeric precision preservation. Generators should continue using the proven generated-list rule: `LayoutInResources[0].ID` and `RefId` match the custom form `LayoutID`.

## Form Page Settings

Both `Edit Item` and `View Item` form resources use:

```json
{
  "attrs": {
    "container": {
      "cw": "2",
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

`cw = "2"` is the studied full-width content setting for custom list forms.

## Container Tree

Both custom list forms use:

```text
Custom list form
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

## Edit Versus View Form Pattern

The mini app's `Edit Item` and `View Item` forms have the same shell structure. Their difference is role and display-setting assignment:

- New item: `Edit Item`
- Edit item: `Edit Item`
- View item: `View Item`

Future generated forms should use the same shell but can vary controls:

- `Edit Item`: editable controls for business fields.
- `View Item`: readonly/display controls for business fields.

## Generator Rules

Data-list generators should:

- Always preserve native `Title` metadata.
- Create both `Edit Item` and `View Item` custom forms for generated lists unless explicitly scoped out.
- Assign New/Edit/View display settings as proven above.
- Use full-width `cw = "2"` and zero padding.
- Use `Main` and `Content` containers by `nv_label`.
- Place business controls inside `Content`.
- Use meaningful `nv_label` names for section containers and important controls.
- Use `--c--background` for form/card surfaces.
- Use `--c--neutral-light-active` for neutral borders.
- Use `--c--neutral-light-hover` for subtle table/filter/addon backgrounds.
- Use `--fs--base` for normal field labels and values.
- Use `--fs--s` or `--fs--xs` for help text and metadata.
- Use `6px` radius for controls and `8px` or `12px` radius for form sections.

## Validator Recommendations

Safe warnings:

- Missing `Edit Item` custom form.
- Missing `View Item` custom form.
- New or Edit display setting not mapped to `Edit Item`.
- View display setting not mapped to `View Item`.
- Missing full-width `cw = "2"`.
- Missing zero padding.
- Missing `Main` or `Content` container.
- `Content` not nested inside `Main`.
- Excessive hard-coded colors in generated custom form styles when root tokens are available.

Keep existing hard errors for:

- Invalid custom form resource JSON.
- Missing required custom form resource keys.
- Unresolved field bindings.
- Broken custom form registration.

## Future Data-List Test

The first generated UI/UX standard data-list test should include:

- native `Title`
- one or two simple business fields
- `Edit Item` custom form with editable fields inside `Content`
- `View Item` custom form with readonly/display fields inside `Content`
- New/Edit/View display settings mapped to the correct form layouts
