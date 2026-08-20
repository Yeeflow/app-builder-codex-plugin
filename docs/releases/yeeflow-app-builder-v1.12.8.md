# Yeeflow App Builder v1.12.8

## Version decision

- Previous stable version: `1.12.7`
- New version: `1.12.8` (patch)
- Scope: Data List MCP Data View completeness, persisted-readback closure, and generated-final regression coverage.

## Included changes

- Require every Type `1` Data List, including hidden support lists, to have exactly one named default Type `0` View with `Ext1.Url = "default"`.
- Require parseable View settings, resolved visible columns, and query coverage for every visible column before a Data List is complete.
- Retain required New/Edit/View Type `1` forms and `ListModel.LayoutView` routing as part of the same closure.
- Add the completion validator to the full-app materialization regression suite and train MCP creation flows to distinguish save/readback from Designer and browser usability.

## Verification boundary

- Source and distribution gates prove the serialized Data View/form contract.
- Persisted readback proves only that the saved metadata satisfies that contract.
- Designer-open and browser action runtime are still required before claiming a generated View or its New/Edit/View actions are usable.
