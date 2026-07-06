# Workflow Assignment Task Assignee Golden Reference Training Report

## Scope

This training adds focused Assignment Task assignee rules from `Workflow actions layout.json`.

The goal is to stop generated Approval workflows from treating every `MultiAssignmentTask` as applicant line-manager approval, and to preserve export-proven assignee shapes for common business routing patterns.

## Golden Reference Patterns

Reference file:

```text
docs/reference/workflow-assignment-task-assignee-golden-references.json
```

Covered patterns:

- applicant line manager approval from `Line manager approval`
- applicant department manager / department head approval from `Department head approval`
- direct Job Position assignment from `Finance manager approval`, `Casher confirm`, and `General manager approval`
- workflow user variable assignment from `Owner approval`
- workflow user variable line-manager assignment from `Owner's manager confirm`
- multiple assignees from `Owner's manager approval`

## Generation Rules

- Applicant line manager uses application applicant context, not a workflow variable named `ApplicantUserID`.
- Department manager / Department head uses applicant department manager expression.
- Workflow user variable assignment uses `type=variable` expression-button data.
- Workflow user variable manager assignment uses `type=user` with nested variable reference and `prop=LineManager`.
- Multiple assignees remain multiple objects in `properties.usertaskassignment[]`.
- Job Position assignees require real tenant Job Position proof. The generator must not copy sample export IDs, invent IDs, or silently replace an unresolved Job Position task with applicant line manager.
- OAuth expiration is recoverable state, not final proof of API unavailability. For Job Position routing, the plugin must attempt OAuth refresh, retry read-only `GET /positions`, and record OAuth/lookup proof before using placeholders or unresolved fallbacks.
- Admin-created Job Positions require confirmed admin permission, explicit user approval, a single accepted `POST /positions` response with numeric ID recorded, bounded read-back polling without retrying create, duplicate-name scan, and optional current-user assignment via `POST /positions/{id}/users` only after confirmation.
- Final generated `.ywf` / `.yapk` workflows must not contain Job Position placeholders. Placeholder/unassigned routing is allowed only as staged blocking output after OAuth recovery/API lookup/admin creation paths have been exhausted and documented.

## Implementation Updates

- `scripts/materialize-full-app-generated-final.mjs` now builds `usertaskassignment[]` based on `assigneeRole`, `assignmentStrategy`, workflow node name, and optional Job Position proof columns.
- App Plan workflow tables may include optional Job Position columns: `Required Job Position`, `Job Position ID`, `Job Position Source`, and `Job Position Proof Status`.
- App Plan workflow tables may also include OAuth/API proof columns for Job Position routing: `Job Position OAuth Status`, `OAuth Refresh Status`, `Job Position Lookup Status`, `Job Position Lookup Attempted`, `Job Position Create Attempt Count`, `Job Position Create Response ID Recorded`, `Job Position Duplicate Scan`, `Job Position Creation Confirmed`, and `Job Position Admin Confirmed`.
- Unresolved Job Position requirements emit blocker metadata and placeholder values so generated-final preflight fails before signing.
- Generated-final validation now fails API-assisted Job Position assignments that lack OAuth proof, skip read-only lookup proof, retry create after an accepted create response, omit the create response ID, or omit duplicate-name scan proof.
- Source and dist mirrors were updated.

## Validation

Focused checks run:

```text
node --check scripts/materialize-full-app-generated-final.mjs
node scripts/test-workflow-assignment-assignee-guardrails.mjs
node scripts/test-workflow-layout-golden-reference-gates.mjs
node --check dist/yeeflow-app-builder-plugin/scripts/materialize-full-app-generated-final.mjs
node dist/yeeflow-app-builder-plugin/scripts/test-workflow-assignment-assignee-guardrails.mjs
jq . docs/reference/workflow-assignment-task-assignee-golden-references.json
```

Result: pass.

## Remaining Boundary

These shapes are export-proven and validator-backed. Runtime task routing still requires a safe submitted request and observed task owner proof before being called runtime-proven.
