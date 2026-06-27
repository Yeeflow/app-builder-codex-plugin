# Data Table Golden Reference Templates Training Report

## Source Evidence

The training used three export-shaped Data table JSON files supplied by the user:

- `Data_table_control_standard_v_scorll.json`
- `Data_table_control_standard_v_noscorll.json`
- `Data_table_control_caption_v_scorll.json`

Each source contains a single Yeeflow `data-list` control labeled `Data table`.

## Registered Templates

The plugin now treats Data table as a template family with three independent template IDs:

- `data_table_control_standard_scroll`
- `data_table_control_standard_no_scroll`
- `data_table_control_caption_scroll`

This is intentionally three templates rather than one parameterized template. Column width mode and caption toolbar behavior are selection-time business contracts, and separate IDs make App Plan selection and validator enforcement unambiguous.

## Key Differences

- `data_table_control_standard_scroll` preserves `attrs.table.cwt = [null, "0"]` and does not enable caption.
- `data_table_control_standard_no_scroll` preserves `attrs.table.cwt = [null, "1"]` and does not enable caption.
- `data_table_control_caption_scroll` preserves `attrs.table.cwt = [null, "0"]` and requires caption title, search, add item, and more-menu behavior.

## Generator Rules

Generated Data table controls must clone the selected export-shaped template. The generator may change only:

- `attrs.data.list`
- `attrs.listarr`
- `attrs.caption.title`
- `attrs.caption.placeholder`
- `attrs.caption.addtext`

Caption text fields are editable only for `data_table_control_caption_scroll`.

## Supported Surfaces

The templates may be used on Dashboard pages, custom Data List forms, Approval form Submission forms, Approval form Task forms, Approval form Print pages, Data List workflow Task forms, and Schedule workflow Task forms.

## Validation

New validator and regression coverage:

- `scripts/validate-data-table-golden-references.mjs`
- `scripts/test-data-table-golden-reference-gates.mjs`

The validator checks registry completeness, source template shape, template ID provenance, locked style fidelity, column width mode, caption contract, data source binding, display-column binding, unresolved placeholders, and App Plan selected-template materialization.

## Proof Boundary

This training is export-shaped and validator-backed. It does not claim runtime proof for search execution, add item, import/export, approval print rendering, or workflow task behavior. Runtime proof remains a separate gate when those behaviors are claimed.
