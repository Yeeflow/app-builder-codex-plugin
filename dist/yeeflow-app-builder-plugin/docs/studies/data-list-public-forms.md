# Data List Public Forms

## Scope

Source export:

`<downloads>/Data Lists (4).yap`

Target data lists:

- `Data list with fields part A`
- `Data list with fields part B`

This is an export-learning pass for Data List Public Forms. Screenshots provided by the user were used as UI reference only and are not committed. No runtime import, public URL open, anonymous submission, or data creation test was run.

Proof boundary:

- Data List Public Forms in this export: export-proven.
- Screenshot control palette availability: UI-reference-backed.
- Validator behavior after this pass: validator-backed.
- Anonymous public URL behavior and submit execution: not runtime-proven.
- Document Library applicability: unproven; no Type `16` document library public-form export was present.
- Form Report: not involved.

## Public Forms Versus Custom List Forms

Data List Public Forms are separate from Custom List Forms. Custom List Forms configure authenticated New/Edit/View item experiences inside the data list UI. Public Forms are anonymous/no-login collection forms intended to be shared publicly, similar in purpose to Google Forms or Microsoft Forms.

Because Public Forms can be submitted without login, they use a restricted field/control palette. Generators must not reuse Custom List Form or Approval Form assumptions blindly.

## Export Storage

In the studied export, each target Data List stores public forms on the list resource:

`Data.Childs[].PublicForms[]`

Each public form entry contains:

- `ListID`
- `ID`
- `Type`
- `Name`
- `Desc`
- `Ext`
- `ExpiredTip`
- `RefId`
- `Resource`

`Resource` is a JSON string, not a gzip-prefixed sub-resource. The parsed public form resource contains:

- `pagetype: 3`
- `ver: 2`
- `attrs`
- `children`
- `tempVars`

The main page content is nested under `children`. The field/control layout uses nested `container` controls with a `flex_grid` that contains list-bound field controls and the submit control.

Public share metadata may live in public-form entry fields such as `Ext`, public settings, or related share fields in future exports. Any public URL or share code must be redacted in committed docs, normalized refs, and logs, for example:

`https://share.yeeflow.com/f/<REDACTED_PUBLIC_FORM_CODE>`

## Inventory

| List | Public forms | Public form names | Fields in `Defs` | Visual controls | List-bound controls | Submit controls | Proof |
|---|---:|---|---:|---:|---:|---:|---|
| `Data list with fields part A` | 1 | `Public form` | 75 | 57 | 51 | 1 | export-proven |
| `Data list with fields part B` | 1 | `Public form test` | 18 | 15 | 10 | 1 | export-proven |

Totals:

- Public forms found: 2
- Visual controls inspected: 72
- List-bound controls inspected: 61
- Submit controls found: 2
- Inspector errors: 0
- Inspector warnings: 0

## Export-Proven Public Field Types

The following top-level list field types are represented by public form field controls in the two target lists:

- `input`
- `textarea`
- `richtext`
- `input_number`
- `percent`
- `currency`
- `switch`
- `radio`
- `checkbox`
- `datepicker`
- `time`
- `file-upload`
- `icon-upload`
- `rate`
- `hyperlink`
- `signer`
- `list`

Field controls use the same broad list-bound pattern seen in custom list forms:

- `type` stores the visual/control type, usually matching the list field `Type`.
- `binding` stores the list field `FieldName`.
- `fieldID` points to the list field `FieldID`.
- `label` mirrors the display label.
- `attrs` stores field-control settings such as `required`, `placeholder`, numeric formatting, rich text toolbar options, rating settings, hyperlink settings, and sub-list configuration.

The native primary `Title` field appears in both public forms as an export-proven list-bound control. This should be treated as a special primary-field exception. It does not prove that default/system fields are generally allowed.

## Disallowed Or Unavailable Fields

The screenshots show unavailable Public Form palette entries for several field families and default list fields. The export also defines fields that are not used in the public form controls.

UI-reference-backed unavailable or not-public-safe custom field types:

- `identity-picker`
- `organization-picker`
- `location-picker`
- `lookup`
- `calculated-column`
- `metadata`
- `mutiple-metadata`
- `cost-center-picker`
- `tag`
- `autonumber`

UI-reference-backed default/system fields that should not be generated into Public Forms:

- `Id`
- `Created By`
- `Created Time`
- `Modified By`
- `Modified Time`

Generation rule:

Do not generate login-dependent fields, default/system fields, lookup/calculated fields, tenant-specific picker fields, or unknown field types into Data List Public Forms unless a future export or product rule proves support. If a generated public form includes a known-disallowed field type, validators should report a hard error. Unknown or ambiguous field types should warn first.

## Field Family Notes

Text and input:

- `input`, `textarea`, `richtext`, and `hyperlink` are export-proven.
- Public form controls preserve placeholder, required, max-length, encrypted field, rich text toolbar/type, and hyperlink open/button-name settings where present.

Numeric and financial:

- `input_number`, `currency`, `percent`, and `rate` are export-proven.
- Numeric controls preserve formatting settings such as thousands display, rounding, min/max/step, currency code/display format, and rating type/count/icon/half-star settings where present.
- `calculated-column` is not export-proven as a Public Form field control in this export and is UI-reference-backed as unavailable.

Selection and choice:

- `switch`, `radio`, and `checkbox` are export-proven.
- `select` is not present in the target public forms.
- `tag` is present as a list field in the export but is not used as a public form field control.

Date and time:

- `datepicker` and `time` are export-proven.

Identity and organization:

- `identity-picker` and `organization-picker` are UI-reference-backed as unavailable. Do not generate them into anonymous Public Forms.

Uploads, media, signature:

- `file-upload`, `icon-upload`, and `signer` are export-proven structurally.
- Upload/image/signature runtime behavior is not proven by this export-learning pass.

Advanced/reference:

- `list` is export-proven as a Public Form field control and includes nested sub-list field control settings.
- `lookup`, `metadata`, `mutiple-metadata`, `cost-center-picker`, `location-picker`, and `autonumber` are not export-proven as top-level Public Form field controls in this pass.

## Visual Controls

Export-proven structural controls found in the public form resources include:

- `container`
- `flex_grid`
- `action_button`
- `submit-button`

The sub-list control includes nested control types inside `attrs.list-fields`, including `text`, `number`, `boolean`, `date`, `file`, `metadata`, `user`, `costcenter`, `groupselect`, `location`, `lookup`, `img`, and `total`. These are nested sub-list control structures, not proof that the corresponding top-level public field types are available.

UI-reference-backed General controls visible in screenshots:

- Section
- Grid
- Container
- Text
- Paragraph
- Picture
- Divider
- Spacer
- Button
- Tab
- Table
- Toggle
- Icon
- Timer

UI-reference-backed Advanced controls visible in screenshots:

- Drop bar
- Alert
- Progress bar
- Progress circle
- Steps bar
- QR Code
- Barcode
- Custom code
- Embed
- Submit

Generation rule:

Public Form generators must only use export-proven or UI-reference-backed Public Form controls. They must not add other general, advanced, dashboard, custom-list-form-only, approval-form-only, or workflow controls to a Public Form.

## Submit Behavior

Both target public forms include one `submit-button` control. This proves the structural submit control exists in Public Form resources.

This pass does not prove:

- anonymous submit runtime behavior
- public URL access behavior
- save/data creation behavior
- upload execution
- validation message behavior
- redirect/success page behavior

Validators should require a submit control when a generated Public Form is intended to collect submissions. Unknown action/submit extensions should warn first unless a future export or runtime test proves they break import/open.

## Validation Rules

Hard errors for generated Public Forms:

- `PublicForms[]` entry references a missing list.
- Public form `Resource` is missing or not valid JSON.
- `Resource.children` is missing or not an array.
- List-bound control `binding`/`fieldID` cannot resolve to a field in the same list.
- Known-disallowed default/system fields are used, except the export-proven primary `Title` special case.
- Known-disallowed public form field types are used.
- Duplicate control IDs occur within a public form.

Warnings:

- `Resource.pagetype` differs from the export-proven value `3`.
- `tempVars` is present but not an array.
- Unknown public form visual control type appears.
- A collection public form has no submit control.
- Public URL/share metadata is present and must be redacted before docs/logs/refs are committed.
- Unknown public-form settings are present but not yet understood.

## Generation Rules

When generating Data List Public Forms:

- Store public forms under `Data.Childs[].PublicForms[]`.
- Use `Resource` as JSON string with `pagetype: 3`, `ver: 2`, `attrs`, `children`, and `tempVars`.
- Keep Public Forms separate from Custom List Forms and Approval Forms.
- Use safe layout controls such as `container` and `flex_grid`.
- Include only public-safe, export-proven field types unless product evidence expands the allowlist.
- Do not include default/system fields except the export-proven primary `Title` field when needed.
- Do not include login-dependent picker fields unless future product/runtime proof explicitly allows them.
- Include a `submit-button` for anonymous collection forms.
- Validate every list-bound field reference before packaging.
- Redact public URLs/share codes in docs, logs, normalized refs, and generated reports.
- Preserve existing app-creation gates: valid `Defs`/`Layouts` arrays, `ListModel.Flags = 1`, valid `FieldIndex`/`FieldName`, unique identifiers, and valid internal names.

## Normalized References

Redacted refs are stored in:

`docs/studies/normalized/data-list-public-forms/`

They are synthetic or redacted shape references only. They do not contain raw public form resources, real share URLs, tenant IDs, user IDs, or private payloads.
