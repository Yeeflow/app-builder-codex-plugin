# Stock Box Image Extraction Case Study

Source export: `/Users/Renger/Downloads/Spark & AI (1).yap`

Classification: export-proven case study only.

## App and List

- Application: `Spark & AI`
- Target data list: `Stock Box`
- Related lookup/master list: `Category`

The exact list IDs were preserved only in the ignored inspection directory.

## Stock Box Fields Relevant To The Flow

Observed key fields:

| Display name | Field slot | Internal name | Control type |
| --- | --- | --- | --- |
| Product Name | `Title` | `BoxUID` | `input` |
| Category Code | `Text1` | `CategoryCode` | `lookup` |
| Label Name | `Text3` | `LabelName` | `input` |
| Lot Number | `Text4` | `LotNumber` | `input` |
| Ref Number | `Text5` | `RefNumber` | `input` |
| File | `Text6` | `File` | `file-upload` |
| Doctor Name | `Text7` | `DoctorName` | `input` |
| Box Info | `Text8` | `BoxInfo` | `input` |
| Image File | `Text9` | `ImageFile` | `icon-upload` |
| OCR_Raw_Text | `Text10` | `OCRRawText` | `textarea` |
| OCR_Confidence | `Decimal2` | `OCRConfidence` | `input_number` |
| Produced/ Registered | `Text19` | localized internal name | `input` |
| Lable Number | `Text20` | localized internal name | `input` |
| Date | `Text22` | localized internal name | `input` |
| Product_Step | `Text18` | localized internal name | `input` |
| Flow status | `Text24` | `extract_update_stock_box_label_data` | `flowstatus` |
| Label Info | `Text25` | `Label_Info` | `calculated-column` |

The list also has system/native workflow context available, including `ListDataID`, even though it is not declared as a normal custom field in `Defs[]`.

## Workflow Linkage

The `Stock Box` list contains two `FlowMappings[]` entries. The relevant one links:

- mapping title: `Extract&Update In-Stock`
- mapping key: `extract_update_stock_box_label_data`
- trigger marker: `Setting.NewTrigger = true`
- status field: `Text24`

## Business Flow

Export-proven business path:

1. A new `Stock Box` item is created.
2. The list-level `FlowMappings[]` registration starts workflow `Extract&Update In-Stock`.
3. The workflow `AI` node sends:
   - `Image File` -> Agent input `label_image`
   - native `ListDataID` -> Agent input `stock_box_item_id`
4. The Agent analyzes the image and uses the app-resource access tool to update the same row.
5. The Agent also resolves the `Category` lookup target and returns category output variables.

## Safety Notes

- `Stock Box` already contains rows in the export.
- The branch intentionally did not inspect raw row values or image payloads.
- No live AI call or live update was run.
- All committed references are redacted and structural.
