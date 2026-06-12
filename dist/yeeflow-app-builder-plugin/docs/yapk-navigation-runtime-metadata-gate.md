# YAPK Navigation Runtime Metadata Gate

Generated-final `.yapk` navigation must carry the metadata Yeeflow needs to materialize groups and resolve child entries at runtime. A group with only `Type: "classes"` and `list[]` is incomplete.

## Required Group Shape

```json
{
  "ID": "<api-issued-id>",
  "AppID": 41,
  "ListSetID": "<current-root-listset-id>",
  "Type": "classes",
  "Title": "<group-title>",
  "Icon": "folder",
  "list": []
}
```

Every group `ID` must be present in the ID provenance manifest. `AppID` must equal the package/root app ID. `ListSetID` must equal the current root `ListSet.ListID`. Runtime groups must use `list[]`; `children` and `Childs` are forbidden.

## Required Child Shape

Every child item must include `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`.

Type-specific rules:

- dashboard/page: `Type: 103`, include `LayoutID`, and use `ListID = LayoutID`
- approval form: `Type: 105` and `ListID = Forms[].Key`
- data list: `Type: 1` and `ListID = Childs[].List.ListID`

Every child target must resolve in the decoded package.

## Validator

```bash
node scripts/validate-yapk-navigation-runtime-metadata.mjs \
  --package dist/<app>.yapk \
  --id-provenance dist/<app>-id-provenance-report.json
```

Generation, signing, install, upgrade-check, and handoff must stop if this validator fails.
