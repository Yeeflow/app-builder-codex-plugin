# Account Health First-Generation Smoke Hardening

## Summary

Account Health first-generation smoke testing moved several runtime lessons into pre-sign validation. Generated YAPK packages must pass the same hardening gates before signing that previously surfaced during focused repair.

## Rules Promoted To Validators

- Run `scripts/yapk-first-generation-preflight.mjs --package <file.yapk> --json` before signing, install dry-run, upgrade check, upgrade apply, or handoff.
- Validate against canonical `schemas/yapk-schema.json`; do not use versioned schema filenames in active generator logic.
- Decode wrapper `Resource` as Brotli/base64 `AppPackageInfo` and validate decoded content before calling `setsign`.
- Keep `AppID` on the wrapper and documented embedded dashboard list references only. Do not emit extra decoded `AppID` fields on `ListSet`, `Pages[]`, `Childs[].List`, `Childs[].Fields[]`, or `Childs[].Layouts[]`.
- Root `ListSet.LayoutView` must be a JSON string when present. Dashboard page `LayoutView` remains `null`; generated child `List.LayoutView` remains `null` unless export-proven custom form routing is complete.
- Keep business sample/demo data out of generated-final decoded rows and use a companion post-install seed artifact. The only `Childs[].List.Items` exception is a Type `16` Document Library structural folder row that satisfies the export-proven folder contract; every folder field value must serialize as a string.
- Preserve native/system `Title`; do not generate a custom `Text0` primary field.
- Enforce FieldName suffix/index alignment and FieldName storage family alignment.
- Dashboard shells require `Type: 103`, `Ext2` containing `{"src":true}`, matching `LayoutInResources` IDs, root navigation to the included dashboard `LayoutID`, and dashboard JSON with `Main > Content`.
- Dashboard Data table columns require both `Field` and `FieldName`; `Field` must resolve to a source-list field or known system field.
- Generated Text controls use the native heading/Text shape. Ad hoc `type:"text"` controls are invalid.

## Proof Boundary

This hardening is validator-backed and regression-tested locally. It does not create runtime proof for Account Health or any other generated application by itself. API upload, install, upgrade check, and signing acceptance remain separate from visible Yeeflow runtime materialization.
