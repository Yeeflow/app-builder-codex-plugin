# Container and Button Action Settings

Source export path: `<downloads>/AP Approval Demo v3.yap`

Target dashboard studied: `AP Approval Dashboard`

Proof labels:

- Export-proven: decoded `.yap` schema from the target dashboard.
- UI-reference-backed: screenshot showing the Builder Execute type menu.
- Product/user-understanding-backed: the product intent and business-selection guidance supplied with the task.
- Validator-backed: checks added in this branch.
- Runtime-proven: not claimed in this pass.

## Summary

Container and Button controls can be actionable dashboard controls. In the target export, the Button control serializes as `type = "action_button"`, while cards/blocks serialize as `type = "container"`. Both use the same dashboard Action settings model under `attrs`.

The export proves these action type codes on Container and Button-like controls:

| Action type code | Action name | Export field pattern | Proof |
| --- | --- | --- | --- |
| `2` | Link | `attrs["action-type"] = "2"` plus `attrs.link` | export-proven |
| `5` | Add list item | `attrs["action-type"] = "5"` plus `attrs.data.list` | export-proven |
| `6` | Open dashboard | `attrs["action-type"] = "6"` plus `attrs.data.page` | export-proven |
| `8` | Open approval form | `attrs["action-type"] = "8"` plus `attrs.data.form` | export-proven |
| `1` | Action / form action binding | UI menu and existing form-action knowledge; not found in this dashboard export | UI-reference-backed/product-backed, not export-proven here |

The screenshot shows the Execute type options `Action`, `Link`, `Add list item`, `Open dashboard`, and `Open approval form`; the screenshot is visual/UI reference only.

## Dashboard Inventory

Inspector command:

```text
node scripts/inspect-container-button-actions.mjs "<downloads>/AP Approval Demo v3.yap" --page "AP Approval Dashboard"
```

Inventory result:

| Page | Controls | Container actions | Button actions | Action types found | Target resolution | Proof |
| --- | ---: | ---: | ---: | --- | --- | --- |
| `AP Approval Dashboard` | 56 | 40 | 16 | Link, Add list item, Open dashboard, Open approval form | 55 resolve locally; 1 Open dashboard sample omits `PageID` | export-proven |

Action counts:

| Action type | Count | Container count | Button count | Target type |
| --- | ---: | ---: | ---: | --- |
| Link | 2 | 1 | 1 | URL/expression URL |
| Add list item | 24 | 15 | 9 | Data list |
| Open dashboard | 14 | 10 | 4 | Type `103` dashboard page |
| Open approval form | 16 | 14 | 2 | Approval form `ProcKey` |

Open behavior counts:

| Open mode label | Export `op` value | Count | Notes |
| --- | --- | ---: | --- |
| Default | omitted / empty | 17 | Export leaves `op` unset on several actions. |
| Pop-up window | `modal` | 21 | Often combined with `modalsize`. |
| Slide in | `slide` | 7 | Found on Open dashboard and Open approval form. |
| Full page | `target` | 5 | Found on Add list item, Open dashboard, and Open approval form. |
| New window | `new` | 6 | Found on Add list item, Open dashboard, and Open approval form. |

Size settings found:

| Size field | Values found | Notes |
| --- | --- | --- |
| `attrs.modalsize` | `0`, `1`, `2`, `3`, `9` | Export-proven size enum values. |
| `attrs.cusize` | `{ "w": number }`, `{ "w": number, "wu": "vw" }` | Used with custom size, especially `modalsize = 9`. |

Target scope:

- Current-application targets are export-proven through matching `ListSetID` / `ListID` / `PageID` / `ProcKey` values inside the same package.
- Cross-application targets were not found in this export. Treat cross-app schema as product-understanding-backed until a focused export proves the exact serialized identity requirements.
- The target dashboard contains one Open dashboard sample with `attrs.data.page` missing `PageID`; this is documented as an export finding and promoted to a generated-final hard error.

## Schema Patterns

### Shared Control Shape

The actionable control is a dashboard child node:

```json
{
  "type": "container",
  "attrs": {
    "action-type": "5"
  }
}
```

Button actions use the same `attrs` action block while the control type is `action_button`:

```json
{
  "type": "action_button",
  "attrs": {
    "button-style": "2",
    "action-type": "5"
  }
}
```

Generation rule: treat `container`, `button`, and `action_button` as sharing the same Action settings model unless a future export proves a difference.

### Action / Form Action Binding

The Builder menu includes `Action` as an Execute type, and existing form-action learning uses action-button references to front-end form actions. This target dashboard did not include action type `1`.

Validation rule: generated Action/form-action bindings should include an action reference such as `control_action`, `control-action`, or the export-proven field name from the host being generated. Because this dashboard did not export action type `1`, unknown dashboard-specific variants should warn first in compatibility mode.

### Link

Export pattern:

```json
{
  "action-type": "2",
  "link": {
    "opentype": true,
    "url": null,
    "variable": "[expression array]"
  }
}
```

The sample uses a variable expression for `Application:Application URL`; no literal external URL is preserved in normalized refs.

Generation guidance:

- Use Link for external documentation, help pages, websites, internal URLs, and direct deep links.
- Prefer structural Yeeflow actions instead of raw links when the target is a known Yeeflow resource in the package.
- Redact literal URLs in docs and normalized refs.

Validation rules:

- Link actions need `attrs.link`.
- The link should contain either a literal URL or a URL expression variable.
- Generated-final validation should fail missing Link targets.

### Add List Item

Export pattern:

```json
{
  "action-type": "5",
  "data": {
    "list": {
      "AppID": "[AppID]",
      "ListSetID": "[ListSetID]",
      "ListID": "[ListID]"
    }
  },
  "layout": "[LayoutID]",
  "passvalues": [
    {
      "Name": "Text1",
      "Value": "[expression array]"
    }
  ],
  "queryParams": [
    {
      "name": "KeyInfo",
      "value": "[expression]"
    }
  ],
  "op": "modal",
  "modalsize": 2
}
```

Generation guidance:

- Use Add list item for quick-create experiences such as Add task, Create request, Upload document, Add vendor, or New invoice.
- Target a Data List or Document Library structurally with `attrs.data.list`.
- Include a target form `layout` when the desired create/edit form is known.
- Use `passvalues` for safe defaults and `queryParams` for contextual parameters when the scenario requires them.
- Validate target list/library, layout, and passvalue field references before handoff.

### Open Dashboard

Export pattern:

```json
{
  "action-type": "6",
  "data": {
    "page": {
      "AppID": "[AppID]",
      "ListSetID": "[ListSetID]",
      "PageID": "[PageID]"
    }
  },
  "op": "target"
}
```

Generation guidance:

- Use Open dashboard for navigation, drill-down pages, reports, team pages, analytics, and operational workspaces.
- Prefer `Open dashboard` over Link for included Yeeflow dashboard pages.
- Validate that `PageID` resolves to a Type `103` dashboard layout.

Export finding: one sample Open dashboard action omits `PageID`. Compatibility inspection warns; generated-final validation treats this as an error.

### Open Approval Form

Export pattern:

```json
{
  "action-type": "8",
  "data": {
    "form": {
      "AppID": "[AppID]",
      "ListSetID": "[ListSetID]",
      "ProcKey": "[ProcKey]"
    }
  },
  "setVars": "[variable initialization rules]",
  "op": "modal",
  "modalsize": 2
}
```

Generation guidance:

- Use Open approval form to start workflow requests such as AP approval, invoice/payment request, purchase request, leave request, or budget approval.
- Target the approval form structurally with `ProcKey`.
- Use `setVars` only when defaults are required and every variable id resolves to the target approval form definition.
- Validate that the approval form exists, is intended to open, and is published when the generated package is final.

## Open Behavior

The export-proven open behavior field is `attrs.op`.

| UI behavior | Export value | Applies to |
| --- | --- | --- |
| Default | omitted / empty | Link, Add list item, Open dashboard |
| Pop-up window | `modal` | Add list item, Open dashboard, Open approval form |
| Slide in | `slide` | Open dashboard, Open approval form |
| Full page | `target` | Add list item, Open dashboard, Open approval form |
| New window | `new` | Add list item, Open dashboard, Open approval form |

`attrs.modalsize` and `attrs.cusize` customize the opened surface. The export proves `modalsize` values `0`, `1`, `2`, `3`, and `9`; `9` is used with custom width shapes.

Validation rules:

- Generated actions must use a known `op` value.
- Generated custom size must use an object shape when present.
- Generated actions that open resources must resolve target identity inside the package unless intentionally and explicitly cross-app.

## Business Selection Guidance

Use Link when the destination is a URL: external docs, help, website, or a deliberately raw deep link.

Use Add list item when the user intent is quick-create: Create request, Add task, Upload document, Add vendor, New invoice, or similar list/library item creation.

Use Open dashboard when the intent is navigation or drill-down: reporting, analytics, team workspaces, operational queues, or related dashboards.

Use Open approval form when the intent is to start a workflow/request: AP approval, payment request, purchase request, HR request, budget approval, or other approval process.

Use Action/form-action binding when the intent is in-form or in-page logic rather than navigation: set variables, confirm, query data, submit, or other front-end action sequences. Dashboard-specific Action binding remains unproven in this export.

## Validator And Generator Rules Added

- Container/Button action `action-type` must be known for generated apps.
- Link actions must include a literal URL or URL expression variable.
- Add list item actions must resolve `attrs.data.list.ListID`; optional `layout` must resolve; `passvalues[].Name` must resolve to target fields.
- Open dashboard actions must resolve `attrs.data.page.PageID` to a Type `103` dashboard.
- Open approval form actions must resolve `attrs.data.form.ProcKey` to an included approval form.
- Open mode values must be export-proven: empty/default, `modal`, `slide`, `target`, or `new`.
- Modal size values must be export-proven: `0`, `1`, `2`, `3`, or `9`.
- Generated-final unresolved action targets are hard errors; compatibility/source-export inspection warns first.
- Import-readiness now runs the Container/Button action inspector.

## Proof Boundary

Container/Button action settings in this dashboard export are export-proven for Link, Add list item, Open dashboard, Open approval form, open modes, modal sizes, current-app target references, passvalues, queryParams, and Open approval form `setVars`.

The screenshot is UI-reference-backed only.

The new inspector and validator checks are validator-backed.

Runtime navigation/open behavior, cross-application targeting, literal external Link behavior, Add list item form-save behavior, dashboard open behavior, approval form start behavior, and form-action binding behavior are not runtime-proven by this pass.
