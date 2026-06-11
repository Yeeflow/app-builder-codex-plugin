# Smart Lookup Picker Custom Code Control Study

Source export: `/Users/Renger/Downloads/Demo (Custom Code).yap`
Script: `/Users/Renger/Documents/Codex Projects/Yeeflow Custom Code_26/templates/smart-lookup-picker/smart-lookup-picker.tsx`
Inspection JSON: `custom-code-control-smart-lookup-picker-inspection.json`

This study documents how Yeeflow stores and configures the same Smart Lookup Picker custom code script across dashboard, approval-form, and data-list custom-form contexts. The export was decoded read-only. This is static export evidence, not runtime proof.

## Summary

The export contains three Custom Code controls:

| Context | Page/Form/List | Control ID | Control Type | Script Storage | Parameter Storage |
|---|---|---|---|---|---|
| Dashboard | `smart-lookup-picker` | `d99fa701-09d4-411c-b173-c4ea3b2b95cf` | `codein` | embedded in `attrs["codein-script"]` | `attrs["codein-script-param"]` |
| Approval form | `Test Picker` / `TP_Test` | `fe7d181d-d75f-4d7f-88de-c8e41ebd4f8b` | `codein` | embedded in `attrs["codein-script"]` | `attrs["codein-script-param"]` |
| Data-list custom form | `Event Planning` / `New Item` | `893b7e87-ec77-4149-bea6-9eb5b511091c` | `codein` | embedded in `attrs["codein-script"]` | `attrs["codein-script-param"]` |

No public-form Custom Code control was found.

The embedded script hash is the same for all three controls: `f50339d70508e09e`. The `.yap` does not expose a separate custom-code script ID, file ID, resource reference, or compiled bundle reference for this example. The TSX source is embedded directly in each control.

## Placement Patterns

Dashboard placement:

- Location: `Item.Layouts[0].LayoutInResources[0].Resource`
- Layout title: `smart-lookup-picker`
- Layout type: `103`
- Control path: `children[0].children[0]`
- Runtime variable context: dashboard `tempVars[]`
- Output target prefix: `__temp_`

Approval-form placement:

- Location: `Forms[0].DefResource.pageurls[0].formdef`
- Form name: `Test Picker`
- Form key: `TP_Test`
- Form `ListID`: `0`
- Control path: `formdef.children[0].children[0]`
- Runtime variable context: approval-form `variables.basic[]`
- Output target prefix: `__variables_`

Data-list custom-form placement:

- Location: `Childs[1].Layouts[1].LayoutInResources[0].Resource`
- Data list: `Event Planning`
- List ID: `2056020356954468353`
- Layout title: `New Item`
- Layout type: `1`
- Control path: `children[0].children[0]`
- Runtime variable context: current list fields
- Output target prefix: `__list_`

Public-form placement:

- Not present in this export.
- Treat public-form use as unproven for generation until a focused public-form export and runtime test prove script loading, list query permissions, and writeback behavior.

## Smart Lookup Picker Script Behavior

Component entry:

- Exported Yeeflow class: `CodeInApplication implements CodeInComp`
- React component: `SmartLookupPicker extends React.Component`
- Runtime props passed from `render(...)`: `context`, `fieldsValues`, `readonly`, `params`, and configured output-target fallback map

Required parameters for useful runtime behavior:

- `dataListId`
- `displayField`
- `valueField`

Optional but recommended output parameters:

- `saveToField`: combined JSON output
- `selectedItemsField`: matched selected values only
- `newItemsField`: manual/free-text values only

Optional behavior and UI parameters:

- `multiSelect`
- `allowManualEntry`
- `maxResults`
- `placeholderText`
- `labelText`
- `noResultText`
- `manualTagText`
- `minSearchChars`
- `debounceMs`

Yeeflow APIs and runtime objects used:

- `context.params`
- `fieldsValues`
- `context.getFieldValue(...)`
- `context.modules.yeeSDKClient.lists.queryItems(...)`
- defensive setters such as `setFieldValue`, `setVariableValue`, `setTempVariableValue`, `setDashboardVariableValue`, `setPageVariableValue`, and object-style setters where available

The script uses `requiredFields(params)` to capture configured writable output targets before Yeeflow expression/variable parameters may evaluate into current runtime values. It also uses `fieldsValues` keys as a fallback for dashboard/temp-variable target resolution.

## Parameter Reference

| Parameter | TSX Type | Required | Export Type | Purpose |
|---|---|---:|---|---|
| `dataListId` | `variable` | Yes | `{ type: 2, value: [{ type: "str", value }] }` | Source list ID for lookup query |
| `displayField` | `variable` | Yes | `{ type: 2, value: [{ type: "str", value }] }` | Field used for display/search |
| `valueField` | `variable` | Yes | `{ type: 2, value: [{ type: "str", value }] }` | Field saved for matched records |
| `saveToField` | `variable` | No | `{ type: 1, value: { prefix, value } }` | Full combined JSON output target |
| `selectedItemsField` | `variable` | No | `{ type: 1, value: { prefix, value } }` | Matched selected values output target |
| `newItemsField` | `variable` | No | `{ type: 1, value: { prefix, value } }` | Manual values output target |
| `multiSelect` | `variable` | No | `{ type: 2, value: [{ type: "bool", value }] }` | Enables multiple selected chips |
| `allowManualEntry` | `variable` | No | `{ type: 2, value: [{ type: "bool", value }] }` | Allows free-text/manual chips |
| `maxResults` | `string` | No | static string | Suggestion result limit |
| `placeholderText` | `string` | No | static string | Input placeholder |
| `labelText` | `string` | No | static string | Visible component label |
| `noResultText` | `string` | No | static string | No-result message |
| `manualTagText` | `string` | No | static string | Manual-chip badge |
| `minSearchChars` | `string` | No | static string | Minimum search characters |
| `debounceMs` | `string` | No | static string | Search debounce delay |

The export also includes `newItemsFieldTarget`, `saveToFieldTarget`, and `selectedItemsFieldTarget`. These are not declared in the TSX `inputParameters()` method. Treat them as observed extra designer/runtime metadata, not script-required parameters.

## Export To TSX Mapping

| Context | Control | Parameter | Yeeflow Type | Value Source | TSX Prop | Required | Notes |
|---|---|---|---|---|---|---:|---|
| Dashboard | `d99fa...` | `dataListId` | expression | string token `2056019465404825603` | `dataListId` | Yes | Source list is `Portfolio Management` |
| Dashboard | `d99fa...` | `displayField` | expression | string token `Title` | `displayField` | Yes | Matches user guide default |
| Dashboard | `d99fa...` | `valueField` | expression | string token `ListDataID` | `valueField` | Yes | Saves row ID |
| Dashboard | `d99fa...` | `saveToField` | binding | `__temp_` / `Selected_Value` | `saveToField` | No | Dashboard temp var exists |
| Dashboard | `d99fa...` | `selectedItemsField` | binding | `__temp_` / `selectedItemsField` | `selectedItemsField` | No | Dashboard temp var exists |
| Dashboard | `d99fa...` | `newItemsField` | binding | `__temp_` / `newItemsField` | `newItemsField` | No | Dashboard temp var exists |
| Approval form | `fe7d...` | `saveToField` | binding | `__variables_` / `saveToField` | `saveToField` | No | Variable exists as text |
| Approval form | `fe7d...` | `selectedItemsField` | binding | `__variables_` / `selectedItemsField` | `selectedItemsField` | No | Variable exists as text |
| Approval form | `fe7d...` | `newItemsField` | binding | `__variables_` / `newItemsField` | `newItemsField` | No | Variable exists as text |
| Data-list form | `893b...` | `saveToField` | binding | `__list_` / `Title` | `saveToField` | No | Writes combined JSON to native display field; validate business intent before generating |
| Data-list form | `893b...` | `selectedItemsField` | binding | `__list_` / `Text2` | `selectedItemsField` | No | List field exists |
| Data-list form | `893b...` | `newItemsField` | binding | `__list_` / `Text7` | `newItemsField` | No | List field exists |

All three contexts pass the required `dataListId`, `displayField`, and `valueField` parameters correctly against the TSX expectations.

## Configuration Examples

Dashboard output targets:

```json
{
  "saveToField": {
    "type": 1,
    "value": {
      "prefix": "__temp_",
      "value": "Selected_Value"
    }
  }
}
```

Approval-form output targets:

```json
{
  "saveToField": {
    "type": 1,
    "value": {
      "prefix": "__variables_",
      "value": "saveToField"
    }
  }
}
```

Data-list custom-form output targets:

```json
{
  "saveToField": {
    "type": 1,
    "value": {
      "prefix": "__list_",
      "value": "Title"
    }
  }
}
```

Expression/static config values:

```json
{
  "dataListId": {
    "type": 2,
    "value": [{ "type": "str", "value": "2056019465404825603" }]
  },
  "multiSelect": {
    "type": 2,
    "value": [{ "type": "bool", "value": true }]
  },
  "maxResults": "8"
}
```

## Source-Of-Truth Reconciliation

| Source | What It Proves | Notes |
|---|---|---|
| Runtime export-backed `.yap` | Control location, embedded script storage, parameter JSON shape, context-specific target prefixes | Primary source for generation structure |
| TSX source | Required/optional props, runtime APIs, writeback behavior, normalization and fallback logic | Primary source for script behavior |
| Example config | Intended common setup values | Helpful but not exhaustive |
| User guide | Business purpose, setup steps, expected behavior, limitations | Good delivery guidance, not proof of app JSON shape |

Differences found:

- The user guide says the template is optimized for approval forms and data-list forms and can be used on dashboards with temp variables. The export backs all three contexts.
- The `.tsx` description mentions approval forms and data-list forms, but dashboard support is implemented through target-resolution logic and confirmed structurally by the export.
- The export includes three extra `*Target` parameters not declared in `inputParameters()`. These should not be generated as required script parameters unless future exports prove they are needed.
- The data-list demo writes the combined JSON to `Title`; future generated apps should prefer a dedicated text/JSON field unless the business display value intentionally should be overwritten.

## Generation Rules

- Do not add a Custom Code control unless the script is available or generated as part of the package.
- Embed the script in `attrs["codein-script"]` for the currently proven package pattern.
- Store configuration in `attrs["codein-script-param"]`.
- Pass every required TSX parameter.
- Use `__temp_` for dashboard temp-variable output targets.
- Use `__variables_` for approval-form variables.
- Use `__list_` for data-list fields.
- Use text-compatible output targets for JSON/string outputs.
- Give the component a meaningful business title/section and avoid relying only on the generic `Custom code` label.
- Public-form generation requires separate proof.

## Validation Rules

Warning-level checks added through `scripts/inspect-yap-custom-code-controls.mjs`:

- Custom Code control missing script.
- Embedded script missing `CodeInApplication`.
- Required Smart Lookup Picker parameter missing.
- Parameter type review or mismatch.
- Duplicate parameter names.
- Unknown parameter names not declared by `inputParameters()`.
- Public-form query usage needs review.
- Generic label/title needs improvement.

These checks are static inspections. They do not prove render, list query, permissions, or writeback.
