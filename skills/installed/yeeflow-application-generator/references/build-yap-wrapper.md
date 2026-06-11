# build-yap-wrapper.js

`build-yap-wrapper.js` wraps decoded Yeeflow application package JSON into a `.yap` file using the confirmed Yeeflow application export format:

```text
[______gizp______] + base64(gzip(Resource JSON))
```

The tool is read-only with respect to source exports. It does not import packages, operate Yeeflow UI, or modify original `.yap`, `.ydl`, or `.ywf` files.

## Usage

```bash
node build-yap-wrapper.js \
  ./some-decoded-yap-data.json \
  ./rebuilt-test.yap \
  --title "Test App" \
  --description "Round-trip rebuilt application package"
```

For rebuilding a decoded Resource JSON from a real export during compatibility testing:

```bash
node build-yap-wrapper.js \
  ./real-export-resource.json \
  ./rebuilt-test.yap \
  --title "Test App" \
  --description "Round-trip rebuilt application package" \
  --validation-mode compatibility
```

Options:

- `--title`: required top-level wrapper title.
- `--description`: optional top-level wrapper description.
- `--icon-url`: optional top-level wrapper icon; if omitted, the builder uses the root `ListModel.IconUrl` when present.
- `--validation-mode generator`: strict mode for generated app packages.
- `--validation-mode compatibility`: tolerant mode for round-tripping real historical exports.

## Supported Input Shapes

The input may be:

1. Decoded `Resource.Data` JSON:

```json
{
  "Item": {},
  "Childs": [],
  "Forms": []
}
```

2. Decoded Resource-level JSON:

```json
{
  "MainListType": 1024,
  "AppID": 41,
  "ReplaceIds": [],
  "ReportIds": [],
  "FormKeys": [],
  "Data": "{...}",
  "SimplePortal": null
}
```

When Resource-level JSON is provided, safe Resource keys are preserved and `Data` is replaced with the normalized JSON string for the decoded app data.

## Output Wrapper Shape

The generated `.yap` wrapper uses:

```json
{
  "Title": "Test App",
  "Description": "Round-trip rebuilt application package",
  "IconUrl": "<icon-url-or-root-listmodel-icon>",
  "IsListSet": true,
  "Resource": "[______gizp______]<base64-gzip-resource-json>"
}
```

The Resource JSON preserves or constructs:

- `MainListType`
- `AppID`
- `ReplaceIds`
- `ReportIds`
- `FormKeys`
- `Data` as a JSON string
- `SimplePortal`
- other Resource-level keys present in the source Resource JSON

## Pre-Write Validation

Before writing the wrapper, the builder checks:

- input JSON parses
- decoded app data contains `Data.Item`
- decoded app data contains `Data.Childs`
- `Data.Forms` is an array when present
- `AppID` exists at Resource or root ListModel level
- `ReplaceIds` exists or can be collected from the decoded app data
- no unresolved placeholders matching `^__.*REQUIRED.*__$`
- `validate-yap-package.js` passes in the selected validation mode
- `validate-yap-graph.js` passes in the selected validation mode

In generated/final mode, validator failures stop the build.

## Round-Trip Validation

After writing, the builder immediately:

1. Reads the generated `.yap`.
2. Confirms top-level wrapper JSON is valid.
3. Confirms the Resource prefix.
4. Base64-decodes Resource.
5. Gunzips Resource.
6. Parses Resource JSON.
7. Parses Resource.Data JSON.
8. Confirms decoded Resource.Data equals the source decoded app data.
9. Runs `validate-yap-package.js`.
10. Runs `validate-yap-graph.js`.
11. Confirms unresolved placeholders remaining equals `0`.

## Report Shape

The builder prints JSON:

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
    "packageValidationPassed": true,
    "graphValidationPassed": true,
    "placeholdersRemaining": 0
  }
}
```

## Safety Rules

- Preserve large numeric IDs as strings.
- Do not print raw token, secret, password, credential, client secret, API key, access key, or authorization values.
- Do not import generated packages automatically.
- Do not use compatibility-mode success as proof that a generated app is ready.
- Use generator/final validation for generated app packages.
- Do not build if placeholders remain.
- Do not build if package or graph validation fails.

## Current Limitations

This is the first wrapper builder. It packages an already-decoded app structure; it does not generate app resources from a normalized spec.

It does not yet:

- generate a new app from business requirements
- compare exported-back `.yap` packages
- infer missing root app/ListModel metadata
- repair graph references
- validate every report/dashboard/AI schema deeply

For the first Department Access Management `.yap` generation test, this builder should be used only after decoded child lists, approval form DefResource, `ReplaceIds`, package structure, and app graph all validate successfully.

## v5 Baseline Note

The `Department Access Management_v5` test showed that wrapper `IconUrl` cannot be treated as optional for generated app packages. Earlier generated packages with missing or null top-level icon metadata produced incomplete import-dialog behavior. The builder should preserve or set a non-null icon for generator/final packages.
