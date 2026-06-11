# validate-yap-package.js

`validate-yap-package.js` is a read-only structural validator for Yeeflow `.yap` application packages.

It accepts either:

- a wrapped `.yap` export, or
- a decoded `Resource.Data` JSON file.

It does not import packages, operate the Yeeflow UI, or modify source exports.

## Usage

```bash
node validate-yap-package.js "./NHIC Innovation Ecosystem Platform.yap" --mode compatibility
node validate-yap-package.js "./generated-app.decoded.json" --mode generator --stage draft
node validate-yap-package.js "./generated-app.decoded.json" --mode generator --stage final
```

## Modes

| Mode | Purpose |
| --- | --- |
| `compatibility` | Tolerant validation for historical real exports. |
| `generator` | Stricter validation for generated packages. |

## Stages

| Stage | Placeholder behavior |
| --- | --- |
| `draft` | unresolved `__...REQUIRED...__` placeholders are warnings |
| `final` | unresolved placeholders are errors in generator mode |

## Checks

The validator checks:

- `.yap` wrapper JSON validity
- `Resource` prefix, base64, and gzip decoding
- decoded Resource JSON validity
- decoded `Resource.Data` JSON validity
- required `Data` sections such as `Item`, `Childs`, `Forms`, reports, modules, groups, and themes
- root app/ListSet metadata
- generated app-shell readiness, including wrapper icon, root `CustomType`, root `Perm`, root `WorkspaceID`, root audit users, app theme arrays, and root navigation
- root Type `103` app page registration, including the rule that `LayoutInResources` resource IDs are separate from the page `LayoutID`
- child resource `ListModel`, `Defs`, `Layouts`, custom forms, and sample data
- workflow/form `DefResource` parsing
- approval form page URLs and task URLs
- workflow graph references
- `ContentList` target list/field references
- `QueryData` target references where parseable
- lookup field target list/display field resolution
- report and dashboard list references where parseable
- `ReplaceIds` presence, duplicates, and local ID coverage
- app-level internal lookup sample values, where same-package target sample records should exist and target sample record IDs should be included in `ReplaceIds`
- sensitive resource warnings for token/credential-like lists/fields, connections, AI agents, knowledges, document libraries, HTTP nodes, and document generation

## Output

The script prints JSON:

```json
{
  "status": "pass | pass_with_warnings | fail",
  "mode": "compatibility | generator",
  "stage": "draft | final",
  "errors": [],
  "warnings": [],
  "dependencies": [],
  "summary": {
    "childResources": 0,
    "dataLists": 0,
    "forms": 0,
    "approvalForms": 0,
    "listWorkflows": 0,
    "reports": 0,
    "dashboards": 0,
    "agents": 0,
    "copilots": 0,
    "connections": 0,
    "knowledges": 0,
    "replaceIds": 0,
    "lookupRelationships": 0,
    "contentListReferences": 0
  }
}
```

`fail` exits with code `1`.

## Safety Rules

- Preserve large numeric IDs as strings.
- Do not print raw token, secret, password, credential, API key, or client secret values.
- Treat AI Agents, Knowledges/Copilots, Connections, document libraries, HTTP nodes, and document-generation nodes as dependencies or risks.
- Do not treat compatibility warnings from historical exports as generation approval.
- Generated final packages still need app-graph validation and sandbox import/export comparison before production use.
- A generator/final pass means the package matches known structural rules; it does not prove runtime behavior until sandbox import/open/export-back testing passes.
- For internal lookup sample data, export-back should confirm dependent lookup values were remapped to the exported target sample record IDs.

## Current Scope

This first validator is structural. It now includes the app-shell checks learned from the successful `Department Access Management_v5` baseline, but it is still not a complete runtime validator.

Future companion tools should include:

- `validate-yap-graph.js`
- `build-yap-wrapper.js`
- `compare-yap-export-back.js`
- `generate-yap-dependency-map.js`

## Recommended Future Check: Fresh ID Families

The Visitor Access Management v5 fresh-compatible baseline showed that app-level generated packages need a fresh local ID family and fresh approval form key for each sandbox test.

Recommended additions:

- Report the apparent generated ID family for root app/listset, child lists, fields, layouts, forms, workflow nodes, and sample records.
- Report approval form keys/FlowKeys found in `Data.Forms[]`.
- In generator mode, warn when a package appears to reuse a known generated/imported ID family.
- In generator mode, warn or fail when a package reuses a known generated/imported approval form key.
- In generator/final mode, recommend a fresh ID family unless the package explicitly declares that it is testing update behavior.

Reason:

- A package can pass structural validation and import, but still open as a blank app if generated IDs or form keys collide with an already-imported generated app.

## Implemented Check: App-Level Approval Form `ListID`

The Visitor Access Management v6 expansion showed that app-level approval form rows must keep `Data.Forms[].ListID = 0`.

The validator now fails generator/final mode when an approval form has a non-zero `Data.Forms[].ListID`.

Failure caught:

```json
{
  "code": "APPROVAL_FORM_LISTID_NOT_ZERO",
  "message": "App-level approval form registration should keep Data.Forms[].ListID as 0; using the ProcModelID here can import without registering the form in navigation."
}
```

Correct pattern:

```json
{
  "Key": "VAW",
  "ListID": 0,
  "ProcModelID": "2110030000000000001"
}
```

Generator implication:

- Keep app-level approval form `ListID` as numeric `0`.
- Store the generated workflow/form process ID in `ProcModelID`.
- Keep the form key in `Key` and `Resource.FormKeys`.
- Keep root navigation Type `105` pointed at the form key.

## Proven Visitor Expansion Validation Pattern

The Visitor Access Management v6.1 through v10 packages confirm the package-validation profile for incremental generated app expansion.

Successful chain:

| Version | Field | Slot | ID family | FlowKey |
| --- | --- | --- | --- | --- |
| v6.1 | Visitor Name | `Text8` | `211...` | `VAW` |
| v7 | Visitor Company | `Text9` | `212...` | `VAX` |
| v8 | Access Area | `Text10` | `213...` | `VAY` |
| v9 | Host Employee | `Text11` | `214...` | `VAZ` |
| v10 | Visitor Contact | `Text12` | `215...` | `VBA` |

The v10 generated package passed package validation with:

- app-level approval form `Data.Forms[].ListID = 0`
- one approval form
- two child data lists
- 16 fields in `Visitor Access Requests`
- `Visitor Contact` added as `Text12`
- `ReplaceIds` including the new local field ID
- no placeholders, errors, warnings, AI resources, connections, or external dependencies

Package validator expectations for future expansions:

- Fail generator/final mode if app-level approval form `Data.Forms[].ListID` is not `0`.
- Report or warn on apparent reuse of a prior generated ID family or FlowKey when detectable.
- Confirm new local field IDs are included in `ReplaceIds`.
- Confirm no unrelated modules are accidentally introduced during a one-field expansion.
- Pair package validation with graph validation and extracted approval-form validation before wrapper build.

Current proven Visitor schema:

| Field | Slot |
| --- | --- |
| Department lookup | `Text2` |
| Department Code | `Text3` |
| Visit Purpose | `Text4` |
| Visitor Name | `Text8` |
| Visitor Company | `Text9` |
| Access Area | `Text10` |
| Host Employee | `Text11` |
| Visitor Contact | `Text12` |
| Visit Date | `Datetime2` |

## Multi-Type Field Validation Recommendations

The manual Visitor Access Management v10 export confirmed additional app-level field/control patterns. See `docs/approval-form-and-yap-field-type-pattern-study.md`.

Recommended package checks:

- Data-list number fields:
  - `FieldType = "Decimal"`
  - `Type = "input_number"`
  - `Rules` parses when present
  - known numeric attrs such as `displayThousandths`, `rounded-to`, `number_min`, and future `number_max` have valid shapes
- Data-list switch fields:
  - `FieldType = "Bit"`
  - `Type = "switch"`
  - sample values should be `"1"`, `"0"`, empty, or absent
- Approval number controls:
  - control `type = "input_number"`
  - bound variable exists and has `type = "number"`
  - default control `value`, if present, is numeric
- Approval choice controls:
  - control `type = "radio"`
  - bound variable exists and has `type = "text"`
  - `attrs.choices[]` is a non-empty string array
  - dropdown controls use `attrs.displayStyle = "dropdown"`
  - `attrs.color_choices[]`, if present, aligns with choices
- Approval switch controls:
  - control `type = "switch"`
  - bound variable exists and has `type = "boolean"`
  - control `value`, if present, is boolean
- Dynamic display:
  - target control `attrs.control_display[]` references an existing source variable
  - `controlId` matches the target control ID
  - condition value type is compatible with the source variable type
- Persistence:
  - `ContentList` mappings from number variables should target `Decimal/input_number`
  - boolean variables should target `Bit/switch`
  - text/radio variables should target text/radio-compatible fields

## Proven v11 Multi-Type Package Validation Baseline

`visitor-access-management.v11-five-fields-multitype.yap` is the first generated app-level package that passed validation and runtime testing with multiple new field/control types in one expansion.

Successful validation profile:

- Fresh ID family: `216...`
- Fresh FlowKey/form key: `VBB`
- App-level approval form `Data.Forms[].ListID = 0`
- Package validation: `pass`
- Graph validation: `pass`
- Extracted approval-form validation: `pass`
- Wrapper round-trip validation: `pass`
- `ReplaceIds`: `46`
- Child resources: `2`
- Approval forms: `1`
- Dashboards: `1` root Type `103` shell page only
- No agents, copilots, connections, knowledges, document libraries, list workflows, or external actions

v11 confirms these generated package structures:

| Field | Slot | Expected package validation |
| --- | --- | --- |
| Visitor Email | `Text13` | `Text` / `input` field with local field ID in `ReplaceIds` |
| Visitor Phone | `Text14` | `Text` / `input` field with local field ID in `ReplaceIds` |
| Number of Visitors | `Decimal1` | `Decimal` / `input_number` field with parseable numeric rules |
| Access Type | `Text15` | `Text` / `radio` field for dropdown-compatible text choice |
| Requires Escort | `Bit1` | `Bit` / `switch` field with switch-compatible sample values |

Confirmed sample value shapes:

- Decimal samples are numeric values.
- Choice/dropdown samples are selected option text.
- Bit/switch list samples are `"1"` or `"0"`.
- Approval switch controls use boolean `true` or `false`.

Validation rule upgrade:

- Multi-field expansion is acceptable in generator/final mode after the underlying field/control types are proven.
- The validator should continue to fail unresolved placeholders, non-zero approval-form `ListID`, missing local IDs in `ReplaceIds`, unresolved target fields, and incompatible `ContentList` mappings.
- Conditional display should validate that `attrs.control_display[]` references an existing source variable and that the target control ID matches the owning control.
