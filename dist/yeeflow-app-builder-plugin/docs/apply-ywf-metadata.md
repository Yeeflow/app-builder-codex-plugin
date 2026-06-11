# Yeeflow Metadata Applicator

Apply filled sandbox metadata to a decoded Yeeflow approval form `Def` JSON draft.

This tool is intentionally limited to decoded JSON drafts. It does not import into Yeeflow, operate the UI, base64 encode `Def`, or create final `.ywf` files.

## Usage

```bash
node apply-ywf-metadata.js \
  ./travel-request-def.json \
  ./travel-request-sandbox-metadata.json \
  ./travel-request-def.sandbox.json
```

## Metadata Requirements

Each placeholder entry must include:

- `placeholder`: unresolved placeholder matching `__...REQUIRED...__`
- `requiredValue`: real sandbox value to apply
- `status`: must be `ready`
- `whereUsedByNode`: at least one semantic locator

Workflow node locators match by:

- `nodeName`
- `nodeStencil`
- `propertyPath`
- `expectedCurrentValue`

Before replacement, the script confirms `expectedCurrentValue` still matches the current source Def value. If the source draft has drifted, the script stops and reports the mismatch.

## Safety Checks

The script fails without writing output when:

- any metadata entry is still `status: "missing"`
- any `requiredValue` is empty
- any semantic locator cannot be found
- any locator's `expectedCurrentValue` does not match the source Def
- any placeholder exists in the source Def but is not covered by metadata
- unresolved `__...REQUIRED...__` placeholders remain after replacement

## Output

The script prints a structured JSON report:

```json
{
  "status": "pass | fail",
  "source": "./travel-request-def.json",
  "metadata": "./travel-request-sandbox-metadata.json",
  "output": "./travel-request-def.sandbox.json",
  "replacementsApplied": 0,
  "errors": [],
  "warnings": [],
  "remainingPlaceholders": []
}
```

After a successful metadata application, run decoded Def validation:

```bash
node validate-ywf-def.js ./travel-request-def.sandbox.json --mode final --dependency-map ./travel-request-dependencies.json
```
