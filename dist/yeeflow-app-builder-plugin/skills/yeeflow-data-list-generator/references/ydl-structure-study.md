# .ydl Structure Study

## Wrapper Format

Standalone Yeeflow data-list exports are JSON wrappers:

```json
{
  "Title": "List Name",
  "Description": "...",
  "IconUrl": null,
  "IsListSet": false,
  "Resource": "[______gizp______]<base64-gzip-resource-json>"
}
```

Decode `Resource` by stripping `[______gizp______]`, base64-decoding, then gunzipping. The result is Resource JSON. `Resource.Data` is a JSON string containing the decoded data-list package.

## Resource JSON

Important Resource fields:

- `MainListType`
- `AppID`
- `ReplaceIds`
- `ReportIds`
- `FormKeys`
- `Data`
- `SimplePortal`

`ReplaceIds` controls import-time remapping. Local generated IDs belong there; external resolved dependency IDs do not.

## Decoded Resource.Data

The decoded data package contains:

- `Item`: main list resource
- `Childs`: child resources if included
- `Forms`: list workflows
- `FormReports`
- `DataReports`
- `FormNewReports`
- `AppGroups`
- `AppTags`
- `AppMetadatas`
- `AppThemes`
- `AppComponents`
- `PortalInfo`
- `OtherModules`

## Item Structure

`Item` contains:

- `ListModel`: identity, app/list metadata, display settings
- `Defs`: field definitions
- `Layouts`: views and custom forms
- `PublicForms`
- `RemindRules`
- `FlowMappings`
- `ListDatas`: sample records keyed by `ListDataID`

## Field Definitions

Fields live in `Item.Defs[]`.

Common keys:

- `FieldID`
- `ListID`
- `FieldName`
- `InternalName`
- `DisplayName`
- `FieldType`
- `Type`
- `DefaultValue`
- `Rules`: JSON string
- `IsSystem`, `IsSort`, `IsIndex`, `IsFilter`

Observed type mappings:

| Normalized | FieldType / Type |
| --- | --- |
| text | `Text` / `input` |
| longText | `Text` / `textarea` |
| choice | `Text` / `radio` or dropdown-style Rules |
| multiChoice | `Text` / `checkbox` |
| lookup | `Text` / `lookup` |
| date | `Datetime` / `datepicker` |
| datetime | `Datetime` / `datepicker` with time |
| boolean | `Bit` / `switch` |
| hyperlink | `Text` / `hyperlink` |
| list | `Text` / `list` |
| flowstatus | `Text` / `flowstatus` |

## Layouts

`Item.Layouts[]` stores both views and custom forms.

- Views usually use `Type: 0` or empty.
- Custom forms use `Type: 1`.
- Board/pipeline-style view `Type: 104` was observed but is not fully proven for generation.

View `LayoutView` is a JSON string containing displayed columns, filters/query, sort, and rowColor.

Custom form `LayoutView` should be `null`; the form body is stored in `LayoutInResources[0].Resource`.

## Sample Data

Sample records are stored in `Item.ListDatas`.

Observed value shapes:

- single lookup: plain target `ListDataID` string
- multi lookup: JSON-stringified array of target IDs
- checkbox/multi-choice: JSON-stringified array
- date: `YYYY-MM-DD`
- datetime: `YYYY-MM-DD HH:mm:ss`
- empty values: usually `""`

Sample data is sandbox/test evidence, not production metadata.

## List Workflows

List workflows are stored in `Data.Forms[]`.

Observed workflow nodes include `StartNoneEvent`, `SequenceFlow`, `ContentList`, `QueryData`, `AI`, and `EndNoneEvent`.

Validate list workflow dependencies against full app metadata before wrapper build.
