# Dashboard Summary Card Generation Standard

Official v0.6.19 adds a stricter runtime-binding companion standard in `docs/standards/dashboard-runtime-binding-standard.md`. Use this file for the Summary card host/control scope, and use the runtime-binding standard to verify `attrs.data.list`, aggregate field binding, matching `page.exts[]`, `settings.values[]`, filter consumption, lookup filter record-id behavior, and `Resource.ReportIds[]` registration.

The UI/Summary/KPI hard gates in `docs/standards/ui-summary-kpi-runtime-hard-gates.md` are now required for generated-final dashboard claims. Summary/KPI generation has three separate proof states: designer-configured Summary control, validator-valid Summary contract, and runtime-proven visible dynamic KPI rendering. Do not collapse these into one claim.

## Purpose

This standard defines how Yeeflow application generators must create KPI and summary cards on Yeeflow surfaces that support the Summary control. It converts the golden reference pattern from the Service Desk Pro Executive Dashboard into a required generation rule.

The goal is to avoid static sample KPI values such as `128`, `24`, or `7` in generated applications. Visible KPI cards must display actual calculated data from the source data list while preserving full visual-design control over typography, layout, colors, and spacing.

## Scope

The Summary control is available only on these generated surfaces:

- Dashboard pages.
- Data List custom forms, including custom view/new/edit/print layouts when the export-proven host supports Summary.

This standard does not apply to, and must not generate Summary controls on:

- Approval forms.
- Data List public forms.
- Other form/page hosts where Summary controls are not export-proven or product-supported.

For unsupported surfaces, generators must not attempt to satisfy this standard by inserting Summary controls. Use a supported alternative display pattern, mark the metric as deferred if it cannot be calculated safely, and do not claim Summary-card pattern compliance for that surface.

## Data Analytics Control Inventory

Summary is one Yeeflow Data Analytics control. The broader Data Analytics inventory also includes:

- Pie chart
- Column chart
- Line chart
- Gauge
- Funnel chart
- Color block heatmap
- Pivot table

All generated Data Analytics controls require runtime-safe IDs. Use UUID-based control IDs unless an export-proven Yeeflow sample proves another ID shape is valid for that exact control type. Preserve existing analytics control IDs during upgrades; only newly added analytics controls get newly generated UUID/API-issued IDs. Summary has a proven UUID runtime shape through KPI Runtime Binding Proof v1.0.1. Other analytics controls require export-proven control shapes before a generator can claim runtime correctness, and runtime screenshot/evidence is required before claiming analytics dashboard quality.

## Golden Reference

Use the Service Desk Pro `Executive Dashboard` dashboard as the best-practice reference for summary cards:

- Summary controls calculate the real values.
- Summary controls save their values into dashboard temporary variables.
- A hidden container keeps the Summary controls out of the visual UI.
- Styled Text controls display the temporary variable values inside KPI cards.
- The visible KPI card design remains independent from the Summary control's default rendering.

## Required Pattern

For every dashboard or Data List custom-form KPI or summary card that represents a count, sum, average, min, max, rate, or status total:

1. Create one Summary control for each metric.
2. Bind each Summary control to the correct data list and field/filter.
3. Configure each Summary control to save its calculated value into a page/form temporary variable supported by the host surface.
4. Place all Summary controls inside a dedicated hidden container.
5. Hide that container with a dynamic display rule that is always false, such as `1 == 0`.
6. Create a visible KPI card using Container, Grid, and Text controls.
7. Bind the visible numeric Text control to the saved temporary variable.
8. Style the visible card manually for spacing, typography, color, borders, and responsive layout.
9. Do not use the Summary control's default visual output as the final KPI card UI.
10. Do not use static sample numbers for final generated KPI values.

## Required Variables

Each generated dashboard or supported Data List custom form with summary cards must define named temporary variables for the metric values.

Use clear names based on the business meaning:

```text
totalVendors
pendingOnboardingCount
highRiskVendorCount
expiringDocumentCount
openTicketCount
monthlyRevenueTotal
averageResolutionHours
```

Avoid generic variable names:

```text
value1
summary1
count
temp
number
```

## Hidden Summary Container Rules

Every supported surface that uses KPI summary cards must include a hidden Summary source container.

Required container naming:

```text
Hidden Summary Data Sources
```

Required behavior:

- The container must contain only Summary controls and small helper controls needed for calculation.
- The container must not appear in the user-facing dashboard.
- The container must use `attrs.common.hide = [null, true, true, true]` so it is hidden on desktop, tablet, and mobile.
- The container must use `attrs.style.direction = [null, "row"]`.
- The display rule must be intentionally impossible, for example `1 == 0`.
- The hidden state must not rely on styling tricks alone when a dynamic display rule is available.

Required Summary control naming:

```text
Summary - Total Vendors
Summary - Pending Onboarding
Summary - High Risk Vendors
Summary - Expiring Documents
```

## Visible KPI Card Rules

The visible cards must be designed as normal dashboard UI, not as raw Summary controls.

Required structure:

```text
Lifecycle KPI Section
  KPI Card Row
    KPI Card - Total Vendors
      KPI Label - Total Vendors
      KPI Value - Total Vendors
      KPI Description - Total Vendors
    KPI Card - Pending Onboarding
      KPI Label - Pending Onboarding
      KPI Value - Pending Onboarding
      KPI Description - Pending Onboarding
```

Required visible controls:

- Container or Grid for the card row.
- One card-like Container per KPI.
- Text control for KPI label.
- Text control for KPI value.
- Text control for KPI description or trend note.

Required style rules:

- Card row must use a grid or flex row layout.
- Cards must have meaningful padding.
- Cards must have a border, background, or visual grouping.
- Card gaps must be configured intentionally.
- KPI value must have stronger hierarchy than label and description.
- KPI cards must not be plain text blocks directly on the dashboard root.

## Data Binding Rules

Visible KPI value Text controls must be bound to temporary variables populated by Summary controls.

Required binding flow:

```text
Data List -> Summary control -> save value to temp variable -> visible Text control
```

Forbidden binding flow:

```text
Static Text "128"
Static Text "24"
Static Text "7"
Static Text "13"
```

Static placeholder values may only be used in early internal drafts. They must be replaced before a package is marked ready, successful, full UI, or quality-proofed.

## Summary Control Configuration Rules

Each Summary control must define:

- Source data list.
- Metric type, such as count, sum, average, min, or max.
- Target field when the metric requires a field.
- Designer-shaped field metadata in `attrs.data.field`, `attrs.field`, `fieldObject`, and `fieldInfo`.
- Count field shape with `ListDataID` where required.
- Filter condition when the metric represents a subset.
- Target dashboard/form temporary variable.
- `save_var` as a designer-exported expression object, not a plain string.
- Clear control name in Navigator.
- Page `ReportIds` coverage for the Summary control ID.

Examples:

```text
Summary - Total Vendors
Source: Vendors
Metric: Count all records
Filter: none
Save value to: totalVendors
```

```text
Summary - High Risk Vendors
Source: Vendors
Metric: Count records
Filter: Risk Level is High or Critical
Save value to: highRiskVendorCount
```

```text
Summary - Expiring Documents
Source: Vendor Documents
Metric: Count records
Filter: Expiry Date within next 30 days
Save value to: expiringDocumentCount
```

## Formatting Rules

Visible Text controls may format the variable value for presentation.

Allowed formatting:

- Number with thousand separators.
- Currency symbol and decimal precision.
- Percent sign.
- Prefix or suffix text.
- Empty-state fallback such as `0`.

Examples:

```text
{{totalVendors}}
${{monthlyRevenueTotal}}
{{onboardingCompletionRate}}%
{{averageResolutionHours}} hrs
```

If the platform does not support inline formatting in the Text control, the generator must document the limitation and use the safest supported field/variable display pattern.

Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape described below, unless another focused runtime proof proves a different shape. If the dynamic binding shape is not runtime-proven, generation must stop or use an explicitly labeled fallback value and record the gap. A fallback value is a visual fallback, not runtime proof of dynamic KPI rendering.

### UUID Summary v1.0.1 Runtime-Proven Binding Shape

KPI Runtime Binding Proof v1.0.1 proved dynamic visible KPI binding for one exact dashboard shape:

- Summary control IDs are UUIDs.
- Each Summary UUID appears in `Resource.ReportIds[]`.
- Each Summary UUID has a matching `Resource.exts[]` entry with `i` equal to the Summary ID, `category: "___Pivot___"`, and `key: "summary"`.
- Each Summary saves to a dashboard temp variable with a designer-shaped `attrs.save_var` expression object.
- `Resource.tempVars[]` declares the same temp variable ids/names.
- Visible KPI Heading/Text controls bind through `attrs.headc.title.variable[]`.
- The proof does not use static or formatted fallback values.
- Summary field metadata is complete in `attrs.data.field`, `attrs.field`, `fieldObject`, and `fieldInfo`.

Runtime proof must include before/after source data mutation evidence, expected-value notes, inspector output, and refreshed/recalculated after-evidence. The v1.0.1 proof changed the KPI values from `3 / 600 / 2 / 300` to `4 / 1000 / 3 / 700`. Because Summary recalculation can be asynchronous or cache-delayed, stale after-evidence that still shows before values is not proof.

Do not generalize this proof to semantic/non-UUID Summary IDs, approval forms, public forms, unsupported surfaces, or other visible binding shapes. If a generated package does not use the exact proven UUID Summary shape and does not provide before/after mutation proof, visible KPI binding remains unproven and fallback KPI values must be explicitly labeled fallback. Marketing Event dashboards may use this shape, but must still run their own before/after mutation proof before claiming runtime dynamic KPI success.

## Sample Data Rule

Generated applications may include sample data to make summary cards visible during testing.

However:

- The KPI card must still be data-bound.
- The sample number must come from sample records through Summary controls.
- The visible KPI value must not be typed manually.

Sample records are acceptable. Static sample KPI text is not acceptable.

## Control Naming Rules

Every control used in a summary-card section must be renamed in Navigator.

Required names:

- `Lifecycle KPI Section`
- `Hidden Summary Data Sources`
- `KPI Card Row`
- `KPI Card - <Metric Name>`
- `KPI Label - <Metric Name>`
- `KPI Value - <Metric Name>`
- `KPI Description - <Metric Name>`
- `Summary - <Metric Name>`

Forbidden default names:

- `Container`
- `Grid`
- `Text`
- `Summary`
- `Button`

Default names are allowed only during temporary local experimentation and must be fixed before handoff.

## Validator Requirements

Application quality validation must fail a generated dashboard or supported Data List custom form when:

- KPI values are static Text controls.
- A summary card has no Summary control source.
- A Summary control does not save to a temp variable.
- A visible KPI value is not bound to a temp variable or summary result.
- Hidden Summary controls are visible in the UI.
- KPI card controls still use default Navigator names.
- KPI cards are plain text blocks without card/grid/container structure.
- A generated application claims full UI quality while KPI cards show hardcoded sample values.
- A Summary control is generated on an unsupported surface such as an approval form or Data List public form.

Suggested hard errors:

```text
SUMMARY_CARD_STANDARD_SCOPE_INVALID
SUMMARY_CONTROL_UNSUPPORTED_SURFACE
SUMMARY_CARD_STATIC_VALUE
SUMMARY_CONTROL_MISSING
SUMMARY_CONTROL_SAVE_VAR_MISSING
SUMMARY_TEMP_VAR_MISSING
SUMMARY_VALUE_BINDING_MISSING
SUMMARY_SOURCE_CONTAINER_VISIBLE
KPI_CARD_STRUCTURE_MISSING
KPI_CONTROL_DEFAULT_NAME
```

## Generator Checklist

Before returning a generated package, check every dashboard or supported Data List custom-form summary section:

- [ ] The summary section is on a Dashboard page or supported Data List custom form.
- [ ] No Summary control is present on approval forms, Data List public forms, or unsupported hosts.
- [ ] Each KPI metric has a matching Summary control.
- [ ] Each Summary control has a real source data list.
- [ ] Each Summary control has the correct metric and filter.
- [ ] Each Summary control saves to a meaningful temp variable.
- [ ] Hidden Summary source container is present and hidden with an impossible display rule.
- [ ] Visible KPI cards are separate styled containers.
- [ ] Visible KPI values bind to temp variables.
- [ ] No final KPI value is static sample text.
- [ ] All controls have meaningful Navigator names.
- [ ] Sample records, if included, drive the KPI values through real summaries.

## Proof Boundary

This standard is based on the Service Desk Pro Executive Dashboard golden reference, the Vendor Onboarding v4.1 hard checks, and the KPI Runtime Binding Proof v1.0.1 UUID Summary runtime proof. The UUID Summary proof narrows dynamic visible KPI success to that exact package/runtime shape; it does not prove every Summary/KPI configuration. This standard should be treated as the default generation rule for dashboard and supported Data List custom-form summary cards in Yeeflow App Builder and Yeeflow App Builder.

If a generator cannot safely implement the Summary-control-to-temp-variable pattern for a specific supported surface, it must:

1. Do not silently fall back to static KPI text.
2. Document the unsupported part.
3. Mark the summary card as deferred or use a clearly labeled non-final fallback.
4. Do not call the package complete or full UI quality-proofed until the issue is resolved.
