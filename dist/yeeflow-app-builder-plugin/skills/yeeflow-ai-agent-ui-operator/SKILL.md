---
name: yeeflow-ai-agent-ui-operator
description: Safely operate the Yeeflow AI Agent management UI to create, inspect, edit, verify, publish, export, or pause on unclear Agent configuration. Use when working in an authenticated Yeeflow browser session, especially for AI Agent fields, variables, Persona & Prompt, icons, tools, and publish status.
---

# Yeeflow AI Agent UI Operator

## Operating Principles

- Use the existing authenticated Chrome tab when the user says Chrome is already open.
- Do not open a new browser window unless the current page is unrecoverable.
- Start from the AI Agent management page whenever creating or checking Agents.
- Check for exact-name duplicates before creating.
- Save and verify one Agent before moving to the next when using manual UI entry.

## Field Workflow

1. Upload the matching 64x64 icon.
2. Enter exact name and short description.
3. Enter Persona & Prompt, preserving multiline formatting where the UI allows.
4. Add variables carefully:
   - one row at a time
   - fill name, type, and description before adding another row
   - remove or correct placeholder rows before saving
5. Do not add tools unless the user provides real resource/API bindings.
6. Save, verify fields, publish, then return to management page.

## Tool Setup Rule

For reusable AI Agent templates, defer tools by default. The Yeeflow Tools UI exposes operational tool types that require real bindings such as lists, approval forms, workflows, target Agents, or HTTP connections. Do not map simple document tool guidance into those controls by guessing.

## Stop Conditions

Pause and report if:

- the page is not clearly the AI Agent management or Agent detail page
- an exact-name Agent already exists but is incomplete
- a variable placeholder row cannot be removed
- variable count, type, or description cannot be verified
- Persona & Prompt disappears after save
- publish fails
- navigation behavior changes or is unclear

<!-- agent-copilot-application-resource-learning:start -->
## App Resource UI Safety

When inspecting app-bound Agents in Yeeflow UI, expect tools that point to app lists, knowledge resources, connected Agents/Copilots, or application connections. Do not execute external Outlook, SharePoint, OAuth, or HTTP tools during verification unless safe test credentials and call scope are explicitly approved.

For runtime checks, prefer non-executing confirmation first: Agent appears, configuration page opens, components/tool names render, linked list/knowledge/connection references are visible, and no live external call is triggered.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Workflow Invocation UI Safety

When checking an Agent that is referenced by a workflow AI Assistant action, verify the Agent input/output variables match the workflow action mappings before publishing or runtime testing. Do not run the scheduled workflow or AI action from the UI unless the schedule, data, and downstream email behavior are explicitly safe.

For data-list workflow cases such as `Spark & AI (1).yap`, also verify whether the workflow maps a current-row upload field into an Agent `img` input and whether the Agent has an application-resource access tool scoped to local data lists. Do not trigger the workflow from UI when the host list contains real rows or the tool can update live business data.
<!-- scheduled-workflow-ai-assistant-learning:end -->
