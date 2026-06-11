# Agent/Copilot Tool And Resource Access

Source export: `/Users/Renger/Downloads/DEMO Innovation Ecosystem Platform.yap`

Inspection status: export-proven and locally validated only.

## Tool Inventory

The studied export contains 30 AI resource components:

| Target kind | Count |
| --- | ---: |
| Knowledge components | 6 |
| Local data-list tools | 15 |
| External connection tools | 5 |
| Connected-Agent tools | 3 |
| Current application resource access tools | 1 |

## Local Resource Tools

Local list-backed tools use:

- `Component.Type = 2`
- `Settings.Data.Value = <target list id>`
- `Settings.Data.AppID = 41`
- `Settings.Data.ListSetID = <app listset id>`
- `Settings.Inputs[]`
- `Settings.Outputs[]`

Proven subtypes:

| SubType | Operation family |
| ---: | --- |
| 3 | Query records |
| 4 | Create records |
| 5 | Update records by item ID |
| 6 | Delete records by item ID |

The export proves list-tool field mappings by field internal names such as `Title`, `Text1`, `Datetime1`, and `ListDataID`. Validators should check that those fields resolve against the target list, but should warn rather than invent unsupported runtime semantics for AI-filled values.

## External Connection Tools

External connection tools use `Settings.Data.Value` to reference a connection in `OtherModules: Connections`.

Proven examples:

| Tool family | Connection |
| --- | --- |
| Outlook OpenAPI operations | Microsoft Graph - Outlook |
| SharePoint OpenAPI operations | Microsoft Graph - SharePoint |
| HTTP request | HTTP Request |

`credentialstype = "2"` appears on user/delegated OpenAPI tools in the Copilot context. `credentialstype = "1"` appears on configured app connection tools in the deletion Agent. Treat both as runtime-sensitive until Yeeflow UI/runtime proof establishes exact run-as behavior.

## Connected-Agent Tools

Copilot connected-Agent tools use:

- `Component.Type = 2`
- `Component.SubType = 1`
- `Settings.Data.Value = <target Agent ID>`
- `Settings.resType = 2`

The export proves a Copilot can delegate to create/update/delete Agents. A generated package must include the target Agent resources and remap those IDs together; otherwise the binding is ambiguous.

## Current Application Resource Access

Partner Q&A includes an "Access current application resources" tool with:

- `Component.Type = 2`
- `Component.SubType = 10`
- `Settings.Data.WorkspaceID`
- `Settings.Data.AppID`
- `Settings.Data.ListSetID`
- `Settings.Data.Value = <current app/listset id>`
- `Settings.resType = 1`

This proves the configuration shape, not the runtime permission boundary. Runtime testing should open the configuration page only; do not trigger broad data access until a safe sandbox case is prepared.

## Validator Policy

Hard errors are appropriate only when:

- AI module data is structurally invalid JSON in a generated final package.
- a tool reference cannot resolve to an included list, connection, current app, or included AI resource in a generated final package.
- a generated final package embeds token/secret/password/API-key values.

Warnings/dependencies are appropriate for:

- connection-backed tools
- credential delegation/run-as fields
- external API/OpenAPI operations
- application-wide resource access
- connected-Agent tools
- incomplete knowledge name mapping

## Normalized Reference

See `docs/studies/normalized/agent-copilot-tool-reference.normalized.json`.
