# Yeeflow `.ywf` Wrapper Builder

Build a Yeeflow `.ywf` wrapper from a final validated decoded `Def` JSON file, then immediately round-trip validate the wrapper.

This tool does not import into Yeeflow, operate the UI, modify the source decoded Def, or resolve placeholders. It should only be used after metadata has been applied and final decoded-Def validation has passed.

## Usage

```bash
node build-ywf-wrapper.js \
  ./travel-request-def.sandbox.json \
  ./travel-request.sandbox.ywf \
  --flow-name "Travel Request Approval" \
  --flow-key TR \
  --workflow-type 2 \
  --description "Sandbox generated Travel Request Approval"
```

## Required Inputs

- decoded Def JSON path
- output `.ywf` path
- `--flow-name`
- `--flow-key`
- `--workflow-type`
- optional `--description`

## Pre-Write Validation

The script refuses to write a wrapper if:

- the decoded Def file is not valid JSON
- `defkey` is missing
- `workflowType` is missing
- any placeholder matching `__...REQUIRED...__` remains
- `--flow-key` does not equal `def.defkey`
- `--workflow-type` does not equal `def.workflowType`

## Wrapper Shape

```json
{
  "Def": "<base64 encoded decoded Def JSON>",
  "FlowName": "<FlowName>",
  "FlowKey": "<FlowKey>",
  "WorkflowType": 2,
  "Description": "<Description or empty string>",
  "Icon": "",
  "Img": null,
  "Settings": null
}
```

## Round-Trip Validation

After writing, the script reads the `.ywf` back and checks:

- wrapper JSON is valid
- `Def` exists
- `Def` base64-decodes into valid JSON
- decoded `Def` equals the original decoded Def object
- wrapper `FlowKey` equals decoded `defkey`
- wrapper `WorkflowType` equals decoded `workflowType`
- no unresolved placeholders remain

## Output

The script prints a structured JSON report:

```json
{
  "status": "pass | fail",
  "inputDef": "./travel-request-def.sandbox.json",
  "outputWrapper": "./travel-request.sandbox.ywf",
  "flowName": "Travel Request Approval",
  "flowKey": "TR",
  "workflowType": 2,
  "errors": [],
  "warnings": [],
  "roundTrip": {
    "wrapperJsonValid": true,
    "defBase64Valid": true,
    "decodedJsonValid": true,
    "decodedEqualsSource": true,
    "flowKeyMatches": true,
    "workflowTypeMatches": true,
    "placeholdersRemaining": 0
  }
}
```

## Recommended Pipeline

```bash
node apply-ywf-metadata.js ./travel-request-def.json ./travel-request-sandbox-metadata.json ./travel-request-def.sandbox.json
node validate-ywf-def.js ./travel-request-def.sandbox.json --mode final --dependency-map ./travel-request-dependencies.json
node build-ywf-wrapper.js ./travel-request-def.sandbox.json ./travel-request.sandbox.ywf --flow-name "Travel Request Approval" --flow-key TR --workflow-type 2
```
