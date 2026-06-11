# Data List Public Form Runtime Proof

## Scope

Branch:

`codex/data-list-public-form-runtime-proof`

Generated package:

`data-list-public-form-runtime-proof.v1.yap`

Downloads copy:

`/Users/Renger/Downloads/data-list-public-form-runtime-proof.v1.yap`

Package strategy:

Focused generated package based on the learned Data List Public Form schema from `Data Lists (4).yap`, not the full source export.

App:

`Data List Public Form Runtime Proof`

Target data list:

`Public Form Runtime Test`

Public form:

`Runtime Public Form`

## Representative Public Form Contents

The generated package includes one Data List with one Public Form stored under `Data.Childs[].PublicForms[]`. The Public Form `Resource` is a JSON string with `pagetype: 3`, `ver: 2`, `attrs`, `children`, and `tempVars`.

Representative list-bound field controls:

- `Title` primary-field exception / `input`
- single line / `input`
- multiple line / `textarea`
- number / `input_number`
- percent / `percent`
- switch / `switch`
- radio / `radio`
- date / `datepicker`
- time / `time`
- hyperlink / `hyperlink`

Controls and layout:

- container
- `flex_grid`
- centered submit container
- `submit-button`

The package intentionally avoids default/system fields other than the `Title` primary-field exception, login-dependent fields, lookup/reference fields, upload/image/signature behavior, and sub-list row entry.

## Local Validation

Validation was run on the generated package before manual import testing.

Results:

- JS syntax check: pass
- Public form inspector: pass, 0 errors, 0 warnings
- Data-list field inspector: pass, 0 errors, 0 warnings
- App-creation rules inspector: pass, 0 errors, 0 warnings
- YAP schema-standard inspector: pass, 0 errors, 0 warnings
- Data-view inspector: pass
- Package validator: pass with warnings only, 0 errors
- Graph validator: pass with warnings only, 0 errors

Known validator warnings were unrelated to public-form import/open proof: runtime-sensitive field semantics for percent/time/hyperlink, missing standard custom edit/view forms because this package focuses on Public Forms, dashboard UI-standard warnings, and token-color warnings.

## User-Proven Runtime Result

The user manually imported the generated package into Yeeflow and confirmed:

- package import succeeded
- app opened
- target data list opened
- the Public Form exists inside the data list
- Public Form designer opened
- Public Form controls rendered
- no unsupported field/control error was reported
- no missing field binding error was reported

The first imported package revealed designer usability issues:

- the generated grid control used a thin grid attrs shape, which caused the grid Appearance settings in the designer not to expand correctly
- the grid displayed a caption, but the desired Public Form layout should turn the caption off
- the submit button was full-width/inside the grid rather than inline and centered

The generator was updated and the package was regenerated. The fixed package:

- uses the export-proven Public Form `flex_grid` shape with `ver: 1`, structured `columns`, `rows`, `cgap`, and `cgapU`
- sets grid caption display off with `displayLabel: [null, false]`
- places the submit button in a separate container below the grid
- centers the submit container with row direction, centered alignment, and centered justification
- sets submit button width to the export-proven inline width shape `common.positioning.widthtype: [null, "2"]`

The user manually imported the regenerated package and confirmed that the test passed.

## Share URL Redaction

No public share URL is recorded in this document. Public share URLs and share codes must remain redacted in docs, logs, normalized refs, and final reports.

Use this placeholder if a share URL must be documented later:

`https://share.yeeflow.com/f/<REDACTED_PUBLIC_FORM_CODE>`

## Proof Boundary

Runtime-proven for this generated representative Data List Public Form package:

- package import
- app open
- target data list open
- Public Form presence inside the data list
- Public Form designer open
- representative allowed list-bound control rendering
- grid layout rendering after the export-shaped grid fix
- submit button rendering as inline and centered after the container fix
- no observed unsupported field/control error
- no observed missing field binding error

Not proven:

- anonymous submit
- real public data collection
- public share/open outside authenticated designer unless separately confirmed
- file/image upload
- signature capture
- lookup/runtime reference resolution
- sub-list data entry
- email/notification behavior
- Document Library public form behavior
- Form Report behavior

Proof labels:

- Data List Public Form schema: export-proven from `Data Lists (4).yap`
- Generated package import/open/designer/control-render path: user-proven for this focused package
- Validators: validator-backed
- Public URL anonymous access and submit behavior: not runtime-proven
