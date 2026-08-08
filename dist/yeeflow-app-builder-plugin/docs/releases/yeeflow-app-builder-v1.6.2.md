# Yeeflow App Builder v1.6.2

## Summary

This patch adds the `collection_control_responsive` Dashboard Collection golden reference, captured from the verified responsive Collection source pattern. It is designed for native Table view on computer, laptop, and tablet, with the corresponding Card view on mobile.

## Responsive Collection Contract

- Preserve the complete export-shaped wrapper, native `tablecols`, search/filter/pagination contracts, and the native responsive display preference.
- Treat the Card item tree as mandatory: target-field mapping must retain valid Card children and must not carry foreign `control_display` control references from the source page.
- Preserve mobile Full width operation regions, Card item-operation mobile `z-index: 2`, and the mobile operation-menu `bottomRight` popup position.
- Preserve only schema-valid Dynamic field, Dynamic user, Progress, sort, action, and delete-confirmation bindings. Unprovable source bindings are removed or cause validation failure.

## Validation Scope

The release adds source/distribution parity, template validation, materializer enforcement, and positive/negative regression tests for the responsive Collection contract. Earlier Projects Dashboard verification provided Designer evidence for the repaired Card content path. This release does not claim a new tenant runtime test for every generated Dashboard, nor does it broaden the existing proof boundary for record writes, action execution, or mobile browser interaction.

## Release Status

RC packaging, isolated Marketplace installation smoke, fresh-task discovery, final tag, and stable promotion are recorded separately after they complete.
