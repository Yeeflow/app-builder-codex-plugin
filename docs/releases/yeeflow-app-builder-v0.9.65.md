# Yeeflow App Builder v0.9.65

## Scope

- Shared Data List and Approval Form choice-option normalization.
- One runtime option per planned business value across ASCII and Chinese delimiters, line breaks, JSON arrays, and structured arrays.
- Planning annotation cleanup, full explicit-enum preservation, and `choices` / `color_choices` parity.
- Signing blockers for merged, annotated, duplicate, missing-color, or value/order-drifting options.

## Validation

- Source and dist focused choice materialization suites: 14 cases each.
- Real Leave Management regression: four merged choice fields and two planning-annotation leaks are detected by the new validator.
- Approval Form and Data List field-template regressions passed.
- Validator entrypoint drift, source/dist parity, Node syntax, release safety, and zip integrity are required before RC promotion.

## Proof Boundary

Generation and package-preflight behavior are covered. Existing persisted records that contain an old merged option value are not automatically migrated and require a separately planned data migration after the field-option schema upgrade.
