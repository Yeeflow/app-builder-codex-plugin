# Copilot Application Resource Structure

Source export: `/Users/Renger/Downloads/DEMO Innovation Ecosystem Platform.yap`

Inspection status: export-proven and locally validated only.

## Export Location

Copilots are stored in the same `Data.OtherModules[]` entry as AI Agents:

- module `Type = "Agents"`
- Copilot resource discriminator `Type = 1`

The studied export contains 2 Copilots:

| Copilot | Model | Suggestions | Skills | Components |
| --- | --- | ---: | ---: | ---: |
| Partner Q&A | default model object | 3 | 2 | 4 |
| NHIC Innovation Copilot | default model object | 3 | 1 | 5 |

## Record Shape

Export-proven top-level keys match AI Agent records:

`ID`, `Name`, `Description`, `Type`, `IconUrl`, `Settings`, `Draft`, `Attr`, `Status`, `IsPublished`, `Publisher`, `PublishDate`, `Components`.

Copilot instructions are stored in `Settings.Instructions` and `Draft.Instructions`. Some Copilot records also carry `Settings.Prompt`, but Copilot generation guidance should continue treating `Instructions` as the user-facing configuration field unless another export proves otherwise.

Copilot quick prompts are stored in `Settings.Suggestions` and/or `Draft.Suggestions`.

## Copilot Components

The export proves these Copilot component patterns:

| Copilot | Component pattern |
| --- | --- |
| Partner Q&A | Knowledge, Outlook OpenAPI tool, SharePoint OpenAPI tool, current application resource access tool |
| NHIC Innovation Copilot | Knowledge, connected-Agent tools for create/update/delete, Outlook connection tool |

Connected-Agent tools store `Settings.Data.Value` as the target AI Agent resource ID and `Settings.resType = 2`. They must be remapped together with the target Agent during any generated package import experiment.

The current application resource access tool targets the app/listset and is marked as application-scoped in the normalized reference. Its exact runtime permission behavior is not proven by local validation.

## Agent vs Copilot Comparison

| Area | AI Agent | Copilot |
| --- | --- | --- |
| Module location | `OtherModules[].Type = "Agents"` | `OtherModules[].Type = "Agents"` |
| Resource type ID | `Type = 0` | `Type = 1` |
| Wrapper metadata | `Name`, `Description`, `IconUrl`, `Status`, `IsPublished`, publisher metadata | Same top-level shape |
| App ownership | App-owned module entry inside `.yap` | App-owned module entry inside `.yap` |
| Prompt/instruction storage | `Settings.Prompt`; `Draft.Prompt` | `Settings.Instructions`; `Draft.Instructions`; prompt may also be present but is not the primary Copilot guidance field |
| Tool list storage | `Components[]` | `Components[]` |
| Resource access configuration | List tools, knowledge components, connection tools | Knowledge, connected-Agent tools, connection tools, current app-resource access |
| OpenAPI/REST tool configuration | Connection tools can appear, as shown in deletion Agent | Outlook/SharePoint OpenAPI tools and email tool appear |
| Connection references | `Settings.Data.Value` can target a connection ID | Same |
| Credential delegation | `credentialstype` appears on connection tools; meaning is runtime-sensitive | `credentialstype = "2"` appears on delegated/user OpenAPI tools |
| Permissions | Prompt/tool descriptions enforce business rules; runtime enforcement still needs proof | Copilot instructions and tool descriptions guide user-facing behavior |
| Quick prompts | Not present in studied Agents | `Settings.Suggestions` / `Draft.Suggestions` |
| Canvas/configuration settings | Not proven in this export | Copilot Canvas not proven by a concrete key in this export |
| Runtime context settings | Inputs/outputs and prompt define context | Instructions, suggestions, skills, and connected tools define context |
| Import/export behavior | App-contained structure is export-proven only | App-contained structure is export-proven only |
| ReplaceIds behavior | AI resource IDs appear as large IDs, but remap behavior is not runtime-proven | Same; connected-Agent references add extra remap risk |
| App navigation/resource center | Stored in `OtherModules`, not normal root navigation | Stored in `OtherModules`, not normal root navigation |

## Import/Generation Safety

Do not convert reusable Copilot templates into app-bound operational Copilots unless target app resources are explicit. Bound tools may reference lists, knowledge resources, other Agents, or external connections. Missing or stale references should block generated final packages or remain warnings for export compatibility checks.

Do not claim Copilot Canvas or AI Assistant context enrichment unless a concrete key is present in the export. This export proves quick prompts, connected-Agent tools, OpenAPI connection tools, and app-resource access; it does not prove Services runtime, code interpreter/data analysis, MCP, or AI-assisted service code generation.

## Normalized Reference

See `docs/studies/normalized/copilot-resource-reference.normalized.json`.
