# AI Agent Application Resource Structure

Source export: `/Users/Renger/Downloads/DEMO Innovation Ecosystem Platform.yap`

Inspection status: export-proven and locally validated only. The original export was decoded read-only into `tmp/agent-copilot-application-resource-learning/`, which is ignored and must not be committed.

## Export Location

AI Agents are stored in `Data.OtherModules[]` where `Type = "Agents"`. The module `Data` is an array that contains both AI Agent and Copilot records.

Export-proven AI Agent discriminator:

| Resource | Proven value |
| --- | --- |
| AI Agent | `Type = 0` |
| Copilot | `Type = 1` |

The studied export contains 4 AI Agents:

| Agent | Model | Inputs | Outputs | Components |
| --- | --- | ---: | ---: | ---: |
| NHIC AI Assistant | `gpt-5` | 0 | 0 | 7 |
| NHIC Record Creation Agent | `gpt-5` | 1 | 1 | 4 |
| NHIC Record Update Agent | `gpt-5` | 1 | 1 | 4 |
| NHIC Record Deletion Agent | `gpt-5` | 2 | 1 | 6 |

## Record Shape

Export-proven top-level keys:

`ID`, `Name`, `Description`, `Type`, `IconUrl`, `Settings`, `Draft`, `Attr`, `Status`, `IsPublished`, `Publisher`, `PublishDate`, `Components`.

`Settings` and `Draft` are JSON strings. For AI Agents, prompt content is stored under `Settings.Prompt`; model can appear as `Settings.ModelId`. Inputs and outputs are arrays under `InputVariables` and `OutputVariables`.

Do not expose raw `Publisher`, user IDs, tenant IDs, or raw large numeric IDs in public docs. Normalized references use placeholders such as `<REDACTED_AGENT_ID>`.

## Component Shape

Agent `Components[]` stores knowledge bindings and tools.

| Component type | Proven meaning |
| --- | --- |
| `Type = 1`, `SubType = 0` | Knowledge component |
| `Type = 2`, `SubType = 3` | Query data-list tool |
| `Type = 2`, `SubType = 4` | Create data-list item tool |
| `Type = 2`, `SubType = 5` | Update-by-ID data-list item tool |
| `Type = 2`, `SubType = 6` | Delete-by-ID data-list item tool |
| `Type = 2`, `SubType = 7` | Connection-backed HTTP/API tool |
| `Type = 2`, `SubType = 8` | OpenAPI/operation-discovery connection tool |
| `Type = 2`, `SubType = 10` | Current application resource access tool |

List tools store `Settings.Data.Value` as the target list ID and include `Inputs` and `Outputs`. Export-proven list tool inputs include filter arrays, selected field arrays, paging expression tokens, and field-fill inputs for create/update/delete operations.

## Generation Rules

For generated app packages, do not hand-generate AI Agents from this export as final importable resources until import behavior is runtime-proven. If generation is attempted later, use fresh resource IDs, include target list/knowledge/connection resources together, and validate every `Settings.Data.Value` reference.

Connected external tools must be generated as deferred or placeholder bindings unless safe test credentials are available. Do not copy real connection IDs, endpoints, OAuth metadata, client IDs, or token-like values.

## Normalized Reference

See `docs/studies/normalized/ai-agent-resource-reference.normalized.json`.
