# Service Portal, Policy, And Group Guardrail Standard

## Service Portal Payloads

Service portal payloads are generated only when the approved app plan explicitly requests service portal behavior.

When the plan excludes service portal, generated packages should reject or warn on:

- `PortalInfo`
- service portal resources
- service portal permissions
- service portal navigation payloads
- app portal resource/permission structures

This does not remove portal support from the plugin. It makes portal generation plan-gated and separates app-level navigation from service-portal navigation.

## App Group IDs

App/navigation groups that the runtime expects to be persisted resources must use API-issued long/integer-compatible ids. Small local ids such as `1`, `2`, `3`, and `4` are placeholders and should fail generated-final validation.

Validators should distinguish:

- `ListGroupInfo` structural validity
- app navigation group runtime suitability
- generated placeholder/local ids

## Policy Catalogs

Business policy variants should be modeled as data, not as one hardcoded universal rule.

For leave-style apps, policy records should support:

- Balance Limited
- Balance Block Mode
- Attachment Required After Days
- HR Review Required

Submit validation/action metadata should use those policy fields to decide whether to block, warn, require attachment, or route for review. This pattern applies beyond leave requests: use policy catalogs for rule variants, exception handling, and submit gates.
