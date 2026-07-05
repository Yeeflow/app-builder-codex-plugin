# Reverse-Related Collection Section Training Report

## Scope

This training promotes the learned Data List View Item form pattern for reverse-related Collection sections. The source evidence is the Hospital Doctor Information Management lookup E2E report and the manually exported reverse-related Collection section sample.

The pattern applies when the current View Item form is the parent/lookup target and another child Data List stores a lookup field pointing to the current record.

## Learned Pattern

Examples:

| Host View Item form | Related child list | Child lookup field | Runtime relationship |
| --- | --- | --- | --- |
| Departments View Item | Doctor Profiles | Text2 | Doctor Profiles.Text2 = current Departments.ListDataID |
| Specialties View Item | Doctor Profiles | Text3 | Doctor Profiles.Text3 = current Specialties.ListDataID |

The section belongs only on View Item or Workbench View Item forms. New/Edit forms should not receive reverse-related Collections by default because a persisted current `ListDataID` may not exist.

## Required Runtime Contract

Reverse-related sections must provide both read-side and create-side context.

Read-side Collection filter:

- `collection.attrs.data.filter[]` must exist.
- The filter left side must be the child lookup storage field, such as `Text2` or `Text3`.
- The filter right side must be a current host item `ListDataID` `list_field` expression.
- Parent display text, parent title, hardcoded row IDs, sample IDs, or labels are invalid.

Search:

- If a `search-filter` exists, its `binding` must be consumed by `collection.attrs.data.fulltext[].value`.
- `fulltext.fields[]` must name real child-list fields.
- Do not generate a search control without the matching Collection fulltext binding.

Add record:

- If child creation is allowed, generate an `action_button` with `attrs["action-type"] = "5"` and a valid `attrs.control_action`.
- The Add button target list must match the child Collection source list.
- `action_button.attrs.passvalues[]` must include:
  - `Name = <child lookup FieldName>`
  - `Value = current host ListDataID expression`

The read filter alone proves display, but it does not link newly added child records. The `passvalues` default alone links new records, but it does not restrict the displayed Collection. Both are required for a full reverse-related create/view workflow.

## Designer Stability Update 2026-07-05

The Departments View Item designer failure was reclassified again after the fix11 live repair. The earlier dropbar finding is still useful, but it is not the complete root cause.

The working official `.ydl` export contains a reverse-related `collection`, toolbar `action_button`, and `search-filter`, but the reverse-related section is an independent `Content.children[]` section after the current-record details section. The official tree is effectively:

```text
Content.children[0] = header section
Content.children[1] = current record details section
Content.children[2] = independent reverse-related child Collection section
```

The generated fix9/fix10 variants removed row operations/dropbar and matched live readback, but the designer still loaded forever because the reverse-related Collection remained nested inside the current-record details card/`section_content_area` and kept a non-official row-template shape. The recovered fix11 package used the official independent section structure and designer opened.

Generation must therefore:

- Place each reverse-related child Collection as an independent `Content` child section, never inside the current-record details card, field grid, or `section_content_area`.
- Keep official-shape toolbar Search/Add when planned.
- Keep Collection runtime attrs to the official surface: `data`, `layout`, `actions`, and `pagination`; put generator metadata on the owning section instead of the Collection node.
- Ensure Collection row `dynamic-field` controls use Collection item context with `attrs.source = "3"` and `attrs["obj-f"] = <child field>`.
- Prune row-level operation/dropbar controls unless a separate export-proven row action pattern is explicitly supported by the App Plan.
- Parse every `#### Reverse-Related Collection Selection` subsection under `## 10. Custom Data List Forms Plan`, not only the first occurrence. If multiple host lists plan reverse-related child Collections, every row must be materialized and validated.

The incorrect lesson is "delete `grid_table_col_item_operations` and the designer is fixed." The correct lesson is "use the official independent reverse-related Collection section runtime shape; row operations/dropbar are one unsafe residue inside that larger shape."

## 0.9.8 Regression Update: Official YDL Shape Must Be Fully Reproduced

The 0.9.8 Hospital Doctor validation showed a partial fix was still not enough. The generated package moved the reverse-related Collection into an independent section and removed row dropbar operations, but `Departments View Item` still loaded forever in the designer because the internal tree did not fully match the official `.ydl` export shape.

The generator must build the reverse-related section as:

```text
1_columns_section
  content_card_wrapper
    section_title_area
      section_title_header
    section_content_area
      related_<child>_<lookup>_collection_wrapper
        grid_table_col_caption
          grid_table_col_title_wrapper
            grid_table_col_title
          grid_table_col_operations
            op_normal
              search-filter
              reverse_related_add_button
        grid_table_col_content
          grid_table_col_header
          grid_table_col_body (Collection)
            grid_col_item
```

Required implementation details learned from the fix1 designer-open proof:

- `section_content_area` keeps the standard `gap = --sp--s200`.
- The Collection node must keep only official runtime attrs: `data`, `layout`, `actions`, and `pagination`.
- Generator metadata such as dataset template provenance or reverse-related markers must stay on the owning section/wrapper, not on the Collection node.
- `collection.attrs.actions` must be an empty array unless a separately export-proven row action pattern exists.
- Row `dynamic-field` controls must use simple item-context binding only: `attrs.source = "3"` plus `attrs["obj-f"] = <child field>`.
- Row `dynamic-field` controls must not carry generated extra bindings such as `attrs.field`, `attrs.fieldName`, `attrs.data`, top-level `field`, or top-level `FieldName`.
- The Add action list context should include the current application `ListSetID` and must set the child lookup field default to current host `ListDataID`.
- Source-template strings such as `Active Loan Pipeline` must be removed from generated reverse-related sections.

App Plan conformance must distinguish the planned/display lookup name from the runtime storage field. For example, an App Plan row may say `Specialty`, while the generated runtime field is resolved to `Text4`. The generated section should retain both:

- `childLookupFieldResolved`: the actual storage field used in filters and passvalues.
- `childLookupFieldPlanned`: the original App Plan/display field name.

The validator may match either alias for plan-to-package conformance, but the runtime filter and passvalues checks must continue to require the resolved storage field.

## 0.9.9 Styling Regression Update: Reverse-Related Collections Must Clone the Full Grid-Table Golden Reference

The 0.9.9 Hospital Doctor follow-up proved that a designer-open reverse-related Collection can still be visually invalid. The generated `Departments View Item` section opened, but the related `Doctors in this Department` area rendered as a plain stacked `Grid`/field list instead of the approved Collection grid-table styling.

Root cause:

- The generator hand-built a shallow Collection-like tree after the designer-loading fix.
- The shallow tree contained some familiar labels, such as `grid_table_col_caption`, `grid_table_col_header`, `grid_table_col_body`, and `grid_col_item`.
- It did not preserve the full exported `collection_control_grid_table` root `grid_table_col_wrapper`, locked styles, content wrapper, row spacing, header/body column signatures, and internal control settings.

This is not acceptable. The reverse-related Collection may use a simplified row item context for designer safety, but the Collection wrapper itself must still be cloned from the approved `collection_control_grid_table` golden reference.

Generation must therefore:

- Load `docs/reference/collection-control-grid-table.template.json`.
- Clone `templateResource.rootContainer` as the reverse-related Collection wrapper.
- Preserve the root identity `grid_table_col_wrapper`.
- Stamp `collectionTemplateId = "collection_control_grid_table"` and `derivedFromCollectionTemplate = "collection_control_grid_table"` on the wrapper and Collection node.
- Replace only approved slots:
  - `grid_table_col_title`
  - `op_normal` Search/Add controls
  - `grid_table_col_body.attrs.data/filter/fulltext`
  - `grid_table_col_header` column headings
  - `grid_col_item` item-context cells
- Remove unproven row operation/dropbar residue unless a separately export-proven row-operation contract is selected.
- Run the shared Collection style enforcement so Dynamic user padding, operation-menu button backgrounds, and title typography remain aligned with the golden reference.

Validator hardening:

- A reverse-related Collection wrapper that only mimics grid-table labels must fail.
- `grid_table_col_wrapper` is required.
- `collection_control_grid_table` provenance marker is required.
- The existing official section shape gate must reject shallow hand-built grids, even if they have search, add, filter, and passvalues.

Regression expectation:

- Negative fixture: a hand-built reverse-related section with `grid_table_col_caption`, `grid_table_col_content`, and `grid_table_col_body`, but without the cloned `grid_table_col_wrapper`/template marker. Expected failure: `DATA_LIST_FORM_REVERSE_RELATED_OFFICIAL_SECTION_SHAPE_MISMATCH` and/or `DATA_LIST_FORM_REVERSE_RELATED_COLLECTION_TEMPLATE_MARKER_MISSING`.
- Positive fixture: a reverse-related section cloned from `collection_control_grid_table`, then remapped to the parent/child lookup contract. Expected result: designer-safe, golden-reference-styled, and validator pass.

## 0.9.10 Search Label And Card Style Regression Update

The 0.9.10 Hospital Doctor style regression showed that cloning the grid-table wrapper is still not sufficient when the surrounding View Item section and toolbar controls are partially hand-built.

Observed invalid output:

- The reverse-related Collection Search filter rendered the label/title `Search items`.
- The approved `collection_control_grid_table` golden reference hides the Search filter label with `displayLabel: [null, false]`; only the placeholder should be visible.
- The reverse-related section's outer `content_card_wrapper` had the correct `nv_label`, but did not preserve the Data List View Item golden card styling.
- The generated card missed the same white background, padding, border, 16px radius, shadow, full-width setting, and full-width parity metadata visible on the current-record details card above it.

Correct generation contract:

- Reverse-related Search filters inside `grid_table_col_operations > op_normal` must serialize `displayLabel: [null, false]`.
- Do not emit `displayLabel: true`, omit `displayLabel`, or move the title into a visible heading for the Search filter.
- The reverse-related section's outer `content_card_wrapper` must preserve the same Data List View Item card style contract as the standard View Item `content_card_wrapper`: `style.widthtype = [null, "1"]`, `common.padding = 28px on all sides`, white classic background, `#d8e1ef` border, 16px radius, drop shadow `rgba(15, 23, 42, 0.06)`, and `fullWidthParityWithGoldenReference: true`.
- The generator may avoid copying source-business metadata such as `Active Loan Pipeline`, but it must not drop the style/common card properties.

Hard gates:

- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_LABEL_VISIBLE`: fail if any reverse-related Search filter does not have `displayLabel: [null, false]`.
- `DATA_LIST_FORM_REVERSE_RELATED_CONTENT_CARD_STYLE_MISMATCH`: fail if the owning `content_card_wrapper` lacks the View Item golden card style properties.

Regression fixtures:

- Positive fixture: reverse-related section with hidden Search label and standard `content_card_wrapper` card style passes.
- Negative fixture: Search filter with visible/missing label hiding fails.
- Negative fixture: reverse-related `content_card_wrapper` with only layout direction/gap and no card background/border/radius/shadow fails.

## 0.9.11 Search Variable And Add Button Width Regression Update

The follow-up Hospital Doctor stylefix validation found two additional reverse-related Collection contract failures after the visible Search label/card-style fix:

- Search filter controls used a plain business binding such as `filter_doctor_profiles_1`.
- Collection `fulltext` used a different runtime id such as `__filter_filter_doctor_profiles_1`.
- The form resource did not register the filter variable in `filterVars[]`.
- Designer could not show or resolve the Search filter variable even though the input rendered.
- `reverse_related_add_button` preserved the Add action/passvalues but lost the golden reference inline-width positioning, so Designer rendered it as default/full width.

Correct Search filter contract:

- The Search filter control `binding` must be the Yeeflow system filter id, for example `__filter_filter_1` or a namespaced equivalent such as `__filter_filter_doctor_profiles_1`.
- The owning form resource must declare the corresponding filter variable in `filterVars[]` with the id without the `__filter_` prefix, for example `filter_1` or `filter_doctor_profiles_1`.
- Collection `attrs.data.fulltext[].value[]` must consume the exact same system id in its expression token: `id = "__filter_filter_1"` and `name = "filter_1"`.
- Do not split the Search filter control binding, fulltext expression id, and `filterVars[]` declaration across different names.

Correct Add button contract:

- `reverse_related_add_button` must preserve the golden reference inline width setting:
  `attrs.common.positioning.widthtype = [null, "2"]`.
- It should also preserve the standard button container sizing:
  `attrs.common.container.size = [null, "grow", "none"]`.
- The Add button still must target the child list, include a runtime action/control_action, and pass the current host item `ListDataID` into the child lookup field.

Hard gates:

- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FILTER_VAR_CONTRACT_INVALID`: fail if the Search filter binding is a plain business variable instead of a `__filter_filter_*` system id.
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FILTER_VAR_NOT_DECLARED`: fail if the Search filter variable is not registered in form `filterVars[]`.
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FULLTEXT_ID_MISMATCH`: fail if the Collection fulltext expression does not consume the same system filter id as the Search filter binding.
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_BUTTON_WIDTH_MISMATCH`: fail if the Add button loses the golden reference inline-width positioning.

Regression fixtures:

- Positive fixture: Search filter binding, form `filterVars[]`, and Collection fulltext all resolve to the same filter variable; Add button keeps inline width.
- Negative fixture: Search filter binding is a plain variable name.
- Negative fixture: Search filter binding is not declared in `filterVars[]`.
- Negative fixture: Collection fulltext uses the right display name but a different runtime expression id.
- Negative fixture: Add button has action/passvalues but no inline-width positioning.

## App Plan Requirement

When a parent/detail lookup relationship should appear on a parent View Item form, the App Plan should include a Reverse-Related Collection Selection table:

| Host Data List | View Item Form | Related Child List | Child Lookup Field | Section Title | Collection Template | Search | Add Record | Default Value |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Departments | Departments View Item | Doctor Profiles | Text2 | Doctor Profiles in this Department | collection_control_grid_table | Title/Text fields | Add doctor | Text2 = current ListDataID |
| Specialties | Specialties View Item | Doctor Profiles | Text3 | Doctor Profiles in this Specialty | collection_control_grid_table | Title/Text fields | Add doctor | Text3 = current ListDataID |

## Validator Changes

`scripts/validate-data-list-form-layout-template.mjs` now enforces reverse-related contracts for sections marked with `reverseRelatedCollectionSection` or equivalent metadata:

- `DATA_LIST_FORM_REVERSE_RELATED_COLLECTION_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_FILTER_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_LOOKUP_FIELD_MISMATCH`
- `DATA_LIST_FORM_REVERSE_RELATED_FILTER_VALUE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_BINDING_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FULLTEXT_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_BINDING_MISMATCH`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FIELDS_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_BUTTON_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_TARGET_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_TARGET_MISMATCH`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_ACTION_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_LOOKUP_FIELD_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_VALUE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_ROW_OPERATION_UNPROVEN`
- `DATA_LIST_FORM_REVERSE_RELATED_SECTION_WRAPPER_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_INDEPENDENT_SECTION_REQUIRED`
- `DATA_LIST_FORM_REVERSE_RELATED_COLLECTION_ATTRS_UNOFFICIAL`
- `DATA_LIST_FORM_REVERSE_RELATED_OFFICIAL_SECTION_SHAPE_MISMATCH`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_OFFICIAL_SLOT_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_OFFICIAL_SLOT_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_ITEM_CONTEXT_SOURCE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_ITEM_CONTEXT_EXTRA_BINDINGS`
- `DATA_LIST_FORM_REVERSE_RELATED_ITEM_FIELD_MISSING`

The gate is marker-scoped to avoid failing ordinary read-only related Collections. Once the generator declares a section as reverse-related, the full contract must pass.

The validator also enforces App Plan to generated-package conformance when both `--plan` and `--package` are provided:

- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_TABLE_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_ROW_INCOMPLETE`
- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_TEMPLATE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_DEFAULT_VALUE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_NOT_MATERIALIZED`

This conformance gate makes reverse-related sections an application-building contract rather than documentation-only guidance. If the App Plan includes a `Reverse-Related Collection Selection` row, the generated package must contain a matching View Item or Workbench View Item section for the same host list, related child list, and child lookup field. The generated section must then satisfy the read-side filter, optional search/fulltext binding, and optional Add/passvalues rules above.

## Proof Boundary

This training is export-proven and validator-backed. The original E2E proved reverse-related display filters. The manually exported section proved search/Add/passvalues shape. The current validator proves App Plan row to generated-package materialization before signing readiness. A future generated E2E should still prove the full Add-save-readback loop from a generated app, including that the child lookup field stores the parent `ListDataID`.
