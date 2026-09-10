# Native workflow adapter: first live validation batch

Validated on 2026-09-10 against the user-authorized dedicated test application in Project Center. Product semantic baseline remains fixed at commit `41bdac08a55204bb033acea54cf3af8d7ca2f740`. No tenant payloads or decoded resources are included here.

## Confirmed representation differences

- Native Designer stores workflow nodes and lines in `childshapes`; internal product tool context uses `nodes`.
- Native form trees are objects in `pageurls[].formdef`.
- A native input binds through `binding` to a text variable in `variables.basic`.
- Native SetVariableTask uses `properties.formtype=current` and `variablesetting[]`; native text expression segments use `type=str`, whereas product text segments use `type=text`.
- AppID, Status and WorkflowType were returned as numeric strings; the save contract accepts their Int32 numeric representation. ProcModelID stays a numeric string.
- Native Designer may issue `s_...` IDs. Do not impose the product node-tool GUID-only rule on native readback or regenerate existing IDs.

## Implemented scope

`native-workflow.mjs` patches an existing input label or an existing current-workflow text assignment, preserves unrelated properties, converts only supported text segments, normalizes only the three observed Int32 envelope properties, and checks exact definition readback. It does not create complete workflows or compile arbitrary product nodes/actions/steps. Its graph checker verifies identity and reciprocal references, not full workflow semantics.

## Live proof

1. Created a native blank Approval Form and input as a Designer baseline; baseline creation is not plugin generation proof.
2. Changed the input title through MCP; exact decompressed definition readback matched and a fresh Designer load displayed the new title.
3. Used the tested adapter implementation to map a product-style text assignment into the native resource; MCP saved it and exact readback matched.
4. Connected Start, SetVariableTask and End. Publication initially rejected a dangling incoming line; repaired the existing endpoint reference through MCP, then verified exact readback. No IDs were fabricated.
5. Published the dedicated test form, submitted one synthetic input, and opened the completed record. Status was Completed; the final text was `SCHEMA_MCP_RUNTIME_OK`, replacing the different submitted test input.

## Remaining gates

Human approval/task pages, control actions and their steps, non-text expressions, complex variable categories, broader controls, and general product-to-native graph creation have not passed this live batch. The initial runtime result must not be generalized to all 159 priority definitions. Plugin release and installation are separate and have not been performed for this batch.
