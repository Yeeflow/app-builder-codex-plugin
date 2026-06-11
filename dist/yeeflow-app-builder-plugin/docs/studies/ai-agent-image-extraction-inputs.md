# AI Agent Image Extraction Inputs

Source export: `<downloads>/Spark & AI (1).yap`

Classification: export-proven Agent structure only.

## Agent

- Name: `Dental Aligner Label Info`
- Resource module: `Data.OtherModules[]` with `Type = "Agents"`
- Resource type: `Type = 0`
- Published: `true`
- Tool count: `1`

## Prompt Role

The Agent prompt is specialized for dental-aligner label extraction and explicitly tells the Agent to:

- inspect the input label image
- extract structured fields from left/right/bottom label zones
- return `N/A` instead of inventing missing values
- use the application-resource access tool to update the target `Stock Box` item

The prompt also instructs the Agent to derive a `Category Code` and resolve a matching `Category` list item for the lookup field.

## Input Variables

Observed `Settings.InputVariables[]`:

| ID | Type | Purpose |
| --- | --- | --- |
| `label_image` | `img` | input dental label image |
| `stock_box_item_id` | `text` | originating Stock Box row ID |

## Output Variables

Observed `Settings.OutputVariables[]`:

| ID | Type | Purpose |
| --- | --- | --- |
| `Category Code` | `text` | extracted category code |
| `Category ID` | `text` | mapped Category row ID |

This export does not use workflow-side `outputVariables[]`; the Agent appears to rely on its own tool side effects to update the list row.

## Expected Extracted Fields

The prompt names these extracted business values:

- Label Name
- Product_Step
- Product Name
- Doctor Name
- Produced/Registered
- Label Number
- Box Info
- Ref Number
- Lot Number
- Date
- extraction confidence
- notes

The host `Stock Box` list contains matching or adjacent target fields for many of these values.

## Image Extraction Boundaries

This branch intentionally did not run live image extraction because:

- the source export belongs to a real business app
- the list already contains records
- the Agent tool can update list items
- executing the flow would risk real-record mutation and live AI usage

The structure is therefore export-proven, not execution-proven.
