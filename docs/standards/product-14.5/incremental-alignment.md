# Product 14.5 incremental alignment

Source: be-ai-builder features/14.5.0, fixed reviewed commit `41bdac08a55204bb033acea54cf3af8d7ca2f740`. This is not a live HEAD claim. Product resources and source remain read-only; this plugin carries original rule summaries and compact capability metadata only.

| Area | Current | Proposed | Evidence / boundary |
| --- | --- | --- | --- |
| Filters | Export-shaped filters, page dependency gates, a known select/Collection empty-value failure | Explicit mode, actual condition consumption, distinct bound-field options, apply/reset reference validation | `resources/best-practices/controls/filter-controls.md`; workflow/control schemas. Keep the Collection operator 9 runtime blocker. Surface-neutral behavior does not grant host support. |
| Sublist | Separate Workflow and export-proven DataList lowering, dynamic actions | Explicit editor compatibility, static/formula separation, authoritative Lookup identities, non-destructive updates | `resources/best-practices/controls/sublist-field-configuration.md`; Workflow Sublist tools. Do not apply Workflow descriptor shapes to DataList. |
| Fields | Normalized field metadata and export-backed validation | Versioned compact projection of configurations, plain schema, embedded JSON and dynamic value schemas; preserve DefaultValue strings | `resources/schemas/datalist/field/*/schema.json`. 27 is a catalog count, not new capability count; retain other plugin types. IsFilter is not IsSort. |
| FormReport | FormNewReports + Type 32 child, source variables, warning-level mappings | Reproducible capability projection, strict optional product filter validation, identity-based child field/view closure | `resources/schemas/workflow/formreport/{fields,filters}/schema.json`, FormReportCapabilityProjector, SetDefinition and Finalize tools. Product composite DTO is not a transport envelope. |

Proof: product-rule-supported. Local test results are recorded in the delivery note. Online rendering/execution, installation and transport mapping changes are not tested in this upgrade. No product Dashboard dependency merge path is introduced.

## Generation and validation contract

Use `scripts/product-14.5-contracts.cjs` for explicit product-profile planning validation and safe patch helpers. Its input contracts are local validation inputs, never MCP payloads. Product profile selection is explicit; unknown hosts or formats fail closed for that requested operation while unrelated work can continue.

Filters require `immediate` or `apply-button`, exact dependent control IDs and a condition consuming the same variable. The immediate plan names reload targets; apply mode names a real apply button without a variable. Selection filters bind an authoritative field and derive runtime-distinct options, never enumerated values or a default selection. Unset conditions are ignored by the product; do not synthesize a bypass expression. Preserve the existing select/Collection failure gate until that exact runtime has evidence. Omitted remove targets mean only staged variables; an explicit empty set means no targets.

Workflow sublist patches must preserve IDs, fields, business types, explicit editors, layout order and unspecified attributes. Formula paths and change-action references are handled separately from static properties. A custom validation failure condition is true on invalid input and has a separate error-message artifact. Lookup source FieldName resolves against the source list; nonempty RelationName resolves by target row-field ID and compatible type, never label. Empty RelationName is display-only. DataList frozen descriptor lowering is unchanged.

The field projection records explicit default declarations and nested type constraints without exporting product resources. Do not convert numbers/objects to invented string encodings, and do not stringify an already encoded default. Unspecified defaults stay unspecified. Undeclared defaults warn rather than deleting established export values. IsFilter requests need a confirmed transport mapping; never alias to IsSort or silently drop the request.

FormReport product filter checks use the fixed capability catalog. Source filter identities come from the source workflow, even for undisplayed fields. Check every field, backing Type 32 list, and view dependency before completion. False flags must survive unchanged. Product Boolean predicates and one-level groups are validated only under the explicit product profile; no conversion to legacy numeric operators is invented. Existing package validation retains export-backed transport shape and adds identity/count checks where proven.
