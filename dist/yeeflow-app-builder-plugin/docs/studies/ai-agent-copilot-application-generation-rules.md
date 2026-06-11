# AI Agent And Copilot Application Generation Rules

Classification: generated-package validation guidance with runtime import proof from the Asia Tech visitor Copilot package.

## Current Proof Boundary

Generated app-contained AI Agent and Copilot resources can be included in a Yeeflow app package when local references are complete, scoped to application resources, and free of external connections or credentials.

The Asia Tech visitor Copilot package proved:

- generated package import was accepted by Yeeflow
- the imported app card appeared in the workspace
- app-contained AI resources can import when every Agent/Copilot record has numeric `Publisher: 0`
- oversized numeric-looking IDs such as 20-digit child-list `LayoutID` values block import because Yeeflow parses those values through `System.Int64`

It did not prove:

- opening generated Agent or Copilot configuration
- Copilot chat execution
- Agent execution
- image extraction runtime behavior
- AI-driven data-list mutation

Do not upgrade generated Agent/Copilot execution claims until those surfaces are opened and tested in a controlled runtime pass.

## Safe Generation Shape

For generated application packages:

- Keep Agents and Copilots inside `OtherModules` with generated IDs.
- Set Agent/Copilot top-level `Publisher: 0`; do not use `null`.
- Keep generated numeric-looking IDs inside signed `System.Int64` range (`<= 9223372036854775807`).
- Keep all tool scopes inside the generated app/listset when possible.
- Prefer Access application resources tools over external connectors.
- For Access application resources tools, use compact resource entries. `resources.dataLists.items[]` should contain `{ "id": "<ListID>", "permissions": <number> }`, not verbose `AppID/ListID/ListSetID/Title` entries and not string permission arrays.
- Calculate `permissions` with bitwise OR: create/add = `1`, update/edit = `2`, delete = `4`, read/view = `8`. For example read/create/update is `8 | 1 | 2 = 11`.
- Preserve connected-Agent references as explicit dependencies.
- Keep quick prompts instructional and non-destructive.
- Do not include external API keys, OAuth connections, real tenant connections, or live email-sending configuration.
- Do not include real uploaded images or real contact data.

## Validation Expectations

Generated packages should validate:

- AI resource IDs are present and generated.
- Agent/Copilot settings parse as JSON.
- connected-Agent references resolve to generated Agents.
- AI Agent/Copilot `Publisher` is numeric, normally `0`.
- Access application resources tool scopes reference generated lists.
- Access application resources tool list entries use `id` plus numeric bitmask `permissions`.
- Data-list workflow Add Item triggers use `FlowMappings.Setting.NewTrigger = true`, `FlowMappings.FieldName = null`, and `Data.Forms[].Settings = null`.
- no external connections are required for baseline import.
- no secrets or credential-looking values appear in generated resources.
- no numeric-looking generated ID exceeds signed `System.Int64`.

Warnings are still appropriate for:

- runtime-sensitive list mutation tools.
- connected-Agent tools that have not been opened in runtime.
- image/file inputs that have not been runtime-executed.
- workflow AI Assistant nodes that reference Agents but have not been executed.

## Runtime Test Policy

The first safe runtime pass should inspect structure without executing AI:

- import package
- open app
- open data lists and dashboards
- open Copilot configuration and verify quick prompts
- open Agent configuration and verify inputs/tools
- open workflow designer and AI Assistant node
- avoid Copilot chat, Agent execution, image upload, workflow execution, and email sending unless the run is explicitly controlled and uses fake data only
