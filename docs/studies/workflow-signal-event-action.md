# Workflow Signal Event Action Study

Proof boundary: this is export-proven, product-documented, config-reference-backed, and validator-backed learning only. No workflow was imported, published, triggered, submitted, recalled, terminated, or executed in this pass. No downstream Set data list cleanup action was executed and no email was sent.

## Sources

| Source | Role | Proof label |
|---|---|---|
| `/Users/Renger/Downloads/Workflow Actions Runtime Baseline (6)_Signal event.yap` | Export/schema source of truth | export-proven |
| `/Users/Renger/Downloads/node-configurations.json` | Node configuration path/control-type reference | config-reference-backed |
| Yeeflow Help Center: Signal Event Action, https://<yourdomain>.yeeflow.com/<redacted-path> | Product behavior and terminology | product-documented |
| Yeeflow Help Center: Start Action, https://<yourdomain>.yeeflow.com/<redacted-path> | Start terminate/recall relationship | product-documented |
| Yeeflow Help Center: Manage your requests, https://<yourdomain>.yeeflow.com/<redacted-path> | Request terminate/recall behavior | product-documented |
| Existing Start action and Set data list studies | Comparison/reference | export-proven / validator-backed |

Raw exports, decoded payloads, private IDs, user names, emails, tenant IDs, credentials, and raw API responses are not committed.

## Summary

The export contains one Signal event node. It serializes as `SignalEvent`, appears only in the approval form workflow `Workflow Action Approval Test`, has no incoming flow, has one outgoing flow, and listens for both cancel/terminate and revoke/recall event definitions.

| Workflow host | WorkflowType | `SignalEvent` count | Event definitions found | Downstream first action | Proof |
|---|---:|---:|---|---|---|
| Approval form workflow | `2` | 1 | `RevokeEventDefinition`, `CancelEventDefinition` | `ContentList` edit | export-proven |
| Data-list workflow | `1` | 0 | none | none | export-proven absence in this export |
| Scheduled workflow | `3` | 0 | none | none | export-proven absence in this export |

## Signal Event Inventory

| Field / behavior | Export finding | Proof |
|---|---|---|
| Front-end action | Signal event | product-documented + export-proven mapping |
| Internal type | `SignalEvent` | export-proven + config-reference-backed |
| Host workflow | Approval form workflow, `WorkflowType = 2` | export-proven |
| Node label | `Signal event` | export-proven |
| Incoming flow count | `0` | export-proven |
| Outgoing flow count | `1` | export-proven |
| Event definition path | `properties.eventdefinitions` | export-proven + config-reference-backed |
| Revoke/recall event | `RevokeEventDefinition` | export-proven |
| Cancel/terminate event | `CancelEventDefinition` | export-proven |
| Downstream first action | `ContentList` named `Set Data List_6` | export-proven |

## No-Incoming Graph Behavior

Signal event is a special event source, not a normal action reached through the primary Start branch.

| Graph rule | Export finding | Validation guidance |
|---|---|---|
| Start action has no incoming flow | `StartNoneEvent` still has no incoming flow | Existing Start rule remains. |
| Signal event has no incoming flow | `SignalEvent.incoming[]` is empty and no `SequenceFlow` targets it | Allow `SignalEvent` as a no-incoming event-source component. |
| Signal event has outgoing flow | one `SequenceFlow` leaves the Signal event | Warn if missing because no compensation branch can run. |
| Signal event can coexist with Start | approval workflow contains both `StartNoneEvent` and `SignalEvent` | Graph connectivity validation should treat Start and Signal event as valid component roots. |
| Normal action nodes | downstream `ContentList` is reached from Signal event | Normal actions still need valid sequence references in their branch. |

## Event Definition Config

The export stores selected events as an array:

```json
{
  "properties": {
    "eventdefinitions": [
      "RevokeEventDefinition",
      "CancelEventDefinition"
    ]
  }
}
```

`node-configurations.json` also maps Signal event to `config_SignalEvent` with `properties.eventdefinitions` and the same enum values. The config reference says at least one event should be selected. Treat unknown values as warnings unless an import-breaking failure is proven.

## Relation To Start Action

| Concept | Start action | Signal event | Proof |
|---|---|---|---|
| Internal type | `StartNoneEvent` | `SignalEvent` | export-proven |
| Primary purpose | Starts the normal workflow after submission | Starts an event branch after cancel/revoke event | product-documented + export-proven |
| Incoming flow | none | none | export-proven |
| Terminate/recall settings | `terminate`, `terminate-conditions`, `revoke-conditions` on approval Start when present | `eventdefinitions[]` chooses cancel/revoke listeners | export-proven |
| Relationship | Start controls whether submitter can terminate/recall | Signal event listens for those events and runs follow-up actions | product-documented; runtime not tested |

The studied approval Start action includes `terminate: false`, `terminate-conditions: null`, and one `revoke-conditions[]` row. The Signal event listens for both `RevokeEventDefinition` and `CancelEventDefinition`. Validators should warn if a Signal event listens for cancel/revoke but the approval Start settings make that event unavailable when this can be inspected, because such a branch may never trigger. This is a design warning, not runtime proof.

## Downstream Cleanup Pattern

The Signal event flows to a Set data list / `ContentList` edit action.

| Downstream action | Export shape | Safety note | Proof |
|---|---|---|---|
| Action type | `ContentList` | Reuses Set data list schema. | export-proven |
| Target mode | `listtype="select"` | Selected data-list target IDs are redacted. | export-proven |
| Operation | `type="edit"` | Mutating action; do not execute in learning pass. | export-proven |
| Mapping | one `listdatas[]` row updates `Decimal1` with `Per="2"` | Numeric operation code `2` was learned as Decrease in Set data list study. | export-proven schema |
| Filter | one `wheres[]` row filters by `ListDataID` using a workflow variable | Nonempty filter reduces broad-update risk; execution remains untested. | export-proven |

This supports the compensation/cleanup pattern: a recall/terminate event can run a follow-up branch to release or reverse previously created/updated data. The sample uses Set data list edit, but record mutation and numeric operation execution are not runtime-proven here.

## Help Center Comparison

| Concept | Product behavior | Export/config field | Match | Proof |
|---|---|---|---|---|
| Signal event handles cancelled/recalled workflow events | Help Center describes cancelled/recalled triggers | `properties.eventdefinitions[]` | matched | product-documented + export-proven |
| At least one event must be selected | Help Center and config reference say one or both events | two array entries found | matched | product-documented + config-reference-backed + export-proven |
| Supported follow-up actions | Help Center lists Assignment/Claim Task, Send Email, Set Variable, Set Content List, HTTP Request | export shows Set data list / `ContentList` | partial; one action type found | product-documented + export-proven |
| End action not needed after Signal event branch | Help Center says end actions do not take effect on trigger event | studied branch contains no end after the Signal event branch | matched in this export; runtime not tested | product-documented + export-proven |
| Start terminate/recall behavior | Start docs and request-management docs distinguish terminate vs recall | approval Start fields plus Signal event eventdefinitions | related but not executed | product-documented + export-proven |

## Generation Rules

- Use `SignalEvent` only for Signal event actions when export-proven.
- Treat Signal event as an event source in approval workflows; do not require an incoming flow.
- Preserve at least one outgoing flow to a compensation/follow-up branch.
- Preserve `properties.eventdefinitions[]` and use only export/config-backed values until another export proves more:
  - `CancelEventDefinition`
  - `RevokeEventDefinition`
- Use Signal event for recall/terminate compensation patterns, such as updating or releasing records created earlier in the workflow.
- Validate downstream Set data list edit/remove filters carefully; broad update/delete after recall/terminate is high risk.
- Do not use Signal event in data-list or scheduled workflows unless an export or focused runtime proof demonstrates that host.
- Do not claim recall/terminate execution, compensation execution, Set data list mutation, or email behavior without a focused runtime baseline.

## Validator Recommendations

- Warning-first: validate `SignalEvent`.
- Warn when `properties.eventdefinitions` is missing, not an array, empty, or contains unknown values.
- Warn when a Signal event has incoming flows.
- Warn when a Signal event has no outgoing flow.
- Allow Signal event as a no-incoming workflow graph component root, similar to Start action.
- Warn if Signal event appears outside approval-form workflows unless a future export proves that host.
- Warn if Signal event listens for cancel/revoke but Start terminate/revoke configuration appears unavailable.
- If downstream Set data list edit/remove actions are present, reuse Set data list broad-filter checks.

## Runtime Boundary

This pass does not import, publish, submit, recall, terminate, trigger, or execute the workflow. It does not prove that Signal event branches run at runtime, that `CancelEventDefinition` or `RevokeEventDefinition` fire, that downstream actions execute, or that data-list updates occur.

Recommended next step: merge this export-learning branch if review is clean, then run a focused combined runtime baseline for Claim Task + Set variable + Set data list + Signal event designer/open/publish proof. Recall/terminate execution and cleanup mutation should remain deferred until explicitly scoped with disposable requests and safe target records.

## Runtime Baseline Update

The combined `Workflow Actions Batch Runtime Baseline` imported and opened successfully. The approval workflow designer rendered a `SignalEvent` with no incoming flow and one outgoing flow to a downstream `ContentList` cleanup branch. The Signal event panel opened and showed both Canceled and Recalled selected. The approval workflow published successfully.

This upgrades the generated Signal event shape to import/open/designer/publish-proven only. Recall or terminate triggering, event firing, downstream cleanup mutation, and any email or task behavior remain not runtime-proven.
