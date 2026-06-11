# build-ydl-wrapper.js

`build-ydl-wrapper.js` creates a Yeeflow `.ydl` wrapper from a final-validated decoded data-list package JSON.

It is a local package builder only. It does not import into Yeeflow, operate the UI, or modify source exports.

## Usage

```bash
node build-ydl-wrapper.js \
  ./asset-inventory-def.test-generated-ids.json \
  ./asset-inventory.test-generated-ids.ydl \
  --title "Asset Inventory" \
  --description "Sandbox generated Asset Inventory data list"
```

## Input

The input may be either:

- decoded `Resource.Data` JSON containing `Item`
- Resource-level JSON containing `Data` as a JSON string

The builder preserves the decoded data object exactly in `Resource.Data`.

## Wrapper Format

The generated `.ydl` wrapper uses:

```json
{
  "Title": "Asset Inventory",
  "Description": "Sandbox generated Asset Inventory data list",
  "IconUrl": null,
  "IsListSet": false,
  "Resource": "[______gizp______]<base64-gzip-resource-json>"
}
```

The Resource JSON contains:

- `MainListType`
- `AppID`
- `ReplaceIds`
- `ReportIds`
- `FormKeys`
- `Data`
- `SimplePortal`

## Safety Rules

The builder refuses to write a wrapper when:

- input JSON cannot be parsed
- unresolved placeholders matching `^__.*REQUIRED.*__$` remain
- `validate-ydl-list.js --mode generator --stage final` fails
- title is missing
- AppID is missing
- ListID is missing
- `Item.Defs` is missing
- `Item.Layouts` is missing
- `Item.ListDatas` is missing

## Round-Trip Validation

After writing, the builder immediately:

1. reads the generated `.ydl`
2. validates wrapper JSON
3. checks the Resource prefix
4. base64-decodes Resource
5. gunzips Resource
6. parses Resource JSON
7. parses `Resource.Data`
8. confirms decoded data equals the source decoded data package
9. confirms no placeholders remain
10. runs `validate-ydl-list.js --mode generator --stage final` against the generated `.ydl`

## Output

The command prints a JSON report:

```json
{
  "status": "pass | fail",
  "inputData": "...",
  "outputWrapper": "...",
  "title": "...",
  "errors": [],
  "warnings": [],
  "roundTrip": {
    "wrapperJsonValid": true,
    "resourcePrefixValid": true,
    "resourceBase64Valid": true,
    "resourceGunzipValid": true,
    "resourceJsonValid": true,
    "resourceDataJsonValid": true,
    "decodedEqualsSource": true,
    "placeholdersRemaining": 0,
    "finalValidationPassed": true
  }
}
```

## Important Limitation

Passing wrapper build means the local package structure round-trips and validates. It does not mean the `.ydl` is production-ready.

Generated standalone IDs are sandbox/test-only until Yeeflow import/export round-trip behavior is proven and production metadata is confirmed.
