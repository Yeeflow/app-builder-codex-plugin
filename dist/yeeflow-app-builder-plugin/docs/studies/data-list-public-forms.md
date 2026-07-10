# Data List Public Forms

## Scope

Source export:

`/Users/Renger/Downloads/Data Lists (4).yap`

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

## Public Form Page Layout Golden Reference

`Customer Satisfaction.ydl` adds the export-proven `Public form page layout standard` public form. This is the default golden reference page layout template for generated Public Forms.

Template resource:

`docs/reference/public-form-page-layout-standard.template.json`

Generation rule:

Every generated Public Form must be plan-first and must declare a page layout template selection. Use `public-form-page-layout-standard` unless the user explicitly provides and approves another Public Form page layout template. Do not hand-build a simplified public form body.

Locked template contract:

- `Resource.pagetype = 3`
- `Resource.ver = 2`
- root Content area uses full width (`attrs.container.cw = "2"`)
- root Content padding remains zero on all sides
- root page background remains the template background
- `public_form_title_wrapper`, `public_form_content_section`, and `pubic_form_bottom_section` keep synchronized custom widths, defaulting to `1280px`
- `pubic_form_submit_button` remains required and stays inside `pubic_form_bottom_section > section_content_center_area`

Editable public-form regions:

- `public_form_title_section`
- `public_form_title_header`
- `public_form_title_text`
- `public_form_description`
- `public_form_title_cta_area`
- `public_form_title_cta_button_primary`
- `public_form_title_cta_button_secondary`
- `public_form_content_section`
- `1_columns_section`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`
- `content_card_wrapper`
- `content_card_60_wrapper`
- `content_card_40_wrapper`
- `section_title_header`
- `section_title_text`
- `section_title_description`
- `Operations`
- `section_content_area`
- `pubic_form_bottom_section`
- `section_content_center_area`
- `pubic_form_submit_button`

All business field controls must be placed inside `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`, specifically inside `section_content_area`. The top-level `public_form_content_section` may only contain approved section layout containers: `1_columns_section`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`.

Generated output must treat those regions as optional choices, not retain the complete example set. Remove `public_form_title_cta_area` when no real CTA is configured; remove copied column sections with no mapped business content; replace retained section placeholder copy with business-specific text; and remove `Operations` when it contains no configured actions. If neither a business-specific `section_title_header` nor configured `Operations` remains, remove the entire `section_title_area`. Standalone `.ydl` and full-application generation use the same cleanup contract.

Public Form field groups may reuse the Data List Form field-layout templates when the fields are public-form-compatible:

- `public_form_fields_1col_v1_1`, rooted at `form_grid_fields_1col_wrapper`
- `data_list_form_fields_grid_v1_1`, rooted at `form_grid_fields_wrapper`
- `data_list_form_control_sublist_v1_1`, rooted at the approved Sub List `list` control

`public_form_fields_1col_v1_1` is the preferred field layout for survey/questionnaire Public Forms, forms with a small number of fields, and forms with long question-style labels. It is a Public Form-specific golden reference learned from `Customer Satisfaction (1).ydl` and `form_grid_fields_1col_wrapper.json`. The root Grid has one column at every responsive breakpoint and its Grid attributes are locked.

When field-layout templates are used in a Public Form, they must be hosted inside an approved Public Form content card's `section_content_area`. Generation may remap labels, bindings, field IDs, option rules, and public-form-compatible field controls, but must keep the template grid/sub-list structure, spacing, zero-margin discipline, responsive columns, and designer labels. Do not use Data List Form grids to sneak login-dependent or public-form-unsupported fields into anonymous Public Forms.

For `public_form_fields_1col_v1_1`, every field cell must be a `form_grid_field_container` containing `form_grid_field_title` and `form_grid_field_control`. The field control's native Display title must be off (`displayLabel: [null, false]`) because the separate title heading carries the prompt/description, and the field control margin must be set to `--sp--s0` on all sides to remove the default Public Form field margin. Dynamic display, custom validation, and control actions may be used; if multiple fields share the same display rule, place them in a shared container or nested grid and put the dynamic display rule on that group.

Shared validators now enforce the page layout contract for standalone `.ydl` and full `.yap/.yapk` output through `scripts/lib/public-form-template-utils.cjs`.

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

Public Forms are anonymous submission forms, so they cannot depend on signed-in user, organization, tenant metadata, app data browsing, or related-record context. The product UI screenshots show that these field families are unavailable for Public Forms, and generated Public Forms must reject them during App Plan review, materialization, and final validation.

User-confirmed unsupported Data List field families:

- User, represented in exports as `identity-picker` / `user`
- Department, represented in exports as `organization-picker`, `groupselect`, or `department`
- Metadata, represented in exports as `metadata`
- Tag, represented in exports as `tag`
- Multi Meta, represented in exports as `mutiple-metadata` or `multiple-metadata`
- Location, represented in exports as `location-picker` / `location`
- Cost center, represented in exports as `cost-center-picker` / `costcenter`
- Lookup, represented in exports as `lookup`

Additional UI-reference-backed unavailable or not-public-safe custom field types:

- `calculated-column`
- `autonumber`

UI-reference-backed default/system fields that should not be generated into Public Forms:

- `Id`
- `Created By`
- `Created Time`
- `Modified By`
- `Modified Time`

Generation rule:

Do not generate login-dependent fields, default/system fields, lookup/calculated fields, tenant-specific picker fields, metadata/tag/location/cost-center fields, or unknown field types into Data List Public Forms unless a future export or product rule proves support. If the source Data List contains such fields, omit them from the Public Form and explain the omission in the App Plan / artifact plan. If a generated public form includes a known-disallowed field type, validators must report a hard error. Unknown or ambiguous field types should warn first.

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

Public Forms must not include data-browsing or filter controls. This specifically forbids Collection/Data table/Data list controls, Pivot Table, Chart/Data Analytics, Summary/KPI, Data filter controls, Search filter, Select filter, Date/Number/User filters, and Dynamic record display controls such as Dynamic field, Dynamic user, Dynamic image, or Dynamic file. Public Forms are for anonymous submission, not authenticated record browsing or dashboard-style filtering.

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
- Known-disallowed Public Form control types are used, including Data filter/Search filter/Collection/Data table controls.
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
- Keep Public Forms separate from Custom List Forms and Approval Forms. Public Forms are additive and never replace the host Data List's standard New/Edit/View custom forms.
- Complete normal Type `1` Data List generation first: fields, default and business views, Data List Form Layouts v1.1 New/Edit/View forms, `List.LayoutView.add/edit/view`, workflows, navigation, permissions, package validation, and full generated-final preflight. Then attach planned Public Forms under `PublicForms[]`.
- Do not create a reduced Public Form-only Data List package or a dedicated hand-built generator path. Full-app and standalone Data List generation must use the shared Data List builder and validators whether `PublicForms[]` is empty or populated.
- Use safe layout controls such as `container` and `flex_grid`.
- Include only public-safe, export-proven field types unless product evidence expands the allowlist.
- Do not include default/system fields except the export-proven primary `Title` field when needed.
- Do not include login-dependent picker fields unless future product/runtime proof explicitly allows them.
- Include a `submit-button` for anonymous collection forms.
- Validate every list-bound field reference before packaging.
- Redact public URLs/share codes in docs, logs, normalized refs, and generated reports.
- Preserve existing app-creation gates: valid `Defs`/`Layouts` arrays, `ListModel.Flags = 1`, valid `FieldIndex`/`FieldName`, unique identifiers, and valid internal names.
- Treat `YAPK_PUBLIC_FORM_CANNOT_REPLACE_CUSTOM_FORMS` and `DATA_LIST_PUBLIC_FORM_CUSTOM_FORMS_REQUIRED` as generated-final blockers.

## Normalized References

Redacted refs are stored in:

`docs/studies/normalized/data-list-public-forms/`

They are synthetic or redacted shape references only. They do not contain raw public form resources, real share URLs, tenant IDs, user IDs, or private payloads.
