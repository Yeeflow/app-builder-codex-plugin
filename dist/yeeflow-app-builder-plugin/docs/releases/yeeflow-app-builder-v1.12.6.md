# Yeeflow App Builder v1.12.6

## Version decision

- Previous stable version: `1.12.5`
- New version: `1.12.6` (patch)
- Scope: Lookup-aware Dashboard Dynamic field configuration, validation, and regression coverage.

## Included changes

- Resolve Collection, Kanban, and Timeline current-item Dynamic fields against their source Data List before generation.
- For Lookup fields, derive `attrs.dis-f` from the Lookup's configured target display field instead of assuming `Title`.
- Reject missing, unresolved, or mismatched Lookup display-field configuration in the Dashboard generated-final hard gate.
- Add a training standard and regression fixture for valid, missing, mismatched, and unresolved Lookup display fields.

## Verification boundary

- Source and distribution tests prove the serialized contract and validation behavior.
- API save acceptance and persisted component readback prove configuration only.
- Dashboard Designer-open and browser rendering with a real associated record remain required to establish visible Lookup-label behavior.
