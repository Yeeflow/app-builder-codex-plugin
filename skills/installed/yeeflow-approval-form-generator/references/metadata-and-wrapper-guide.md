# Metadata And Wrapper Guide

## Metadata Mapping

Generated drafts may contain placeholders for environment-specific values:

```text
__APP_ID_REQUIRED_*__
__LISTSET_ID_REQUIRED_*__
__LIST_ID_REQUIRED_*__
__FIELD_INTERNAL_NAME_REQUIRED_*__
__POSITION_ID_REQUIRED_*__
__DOCUMENT_TEMPLATE_ID_REQUIRED_*__
__AGENT_ID_REQUIRED_*__
```

Placeholders are allowed only in draft decoded Def JSON. They are forbidden in final `.ywf` wrappers.

Use a dependency mapping file to track each placeholder:

- dependency key
- dependency type
- required value
- where used in Def
- whether required for final export
- notes

## Applying Metadata

Use:

```bash
node scripts/apply-ywf-metadata.js \
  ./source-def.json \
  ./filled-metadata.json \
  ./source-def.sandbox.json
```

The script verifies:

- every metadata entry is ready
- required values are not empty
- semantic locators match expected current values
- every placeholder in the Def is covered
- no unresolved placeholders remain in output

## Wrapper Build

Only after final validation passes:

```bash
node scripts/build-ywf-wrapper.js \
  ./validated-def.json \
  ./output.ywf \
  --flow-name "Form Name" \
  --flow-key KEY \
  --workflow-type 2 \
  --description "Description"
```

The builder checks:

- decoded Def JSON validity
- no unresolved placeholders
- FlowKey equals decoded `defkey`
- WorkflowType equals decoded `workflowType`
- base64 `Def` encoding
- wrapper JSON validity
- round-trip decode equals source Def

Never use the wrapper builder to bypass validation.
