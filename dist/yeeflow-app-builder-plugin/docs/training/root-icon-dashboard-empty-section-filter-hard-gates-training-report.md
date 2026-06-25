# Root Icon, Dashboard Empty Section, and Filter Shape Hard Gates Training Report

## Context

The 0.8.45 Office Asset Loan Management regression found that generated packages could pass the existing dashboard and icon gates while still carrying runtime-visible defects:

- The wrapper `IconUrl` used the approved FontAwesome JSON contract, but decoded root application icon surfaces could be blank or drift from the wrapper.
- Dashboard Page Layouts v1.1 pages could keep copied `content_card_wrapper` sections whose `section_content_area` had no business content.
- `select-filter` controls could omit rendered label text even when typography existed.
- `select-filter` and `search-filter` placeholders could be malformed objects produced by spreading a string into numeric keys, creating a runtime `[object Object]` risk.

## Training Decision

These are generated-final hard-gate issues, not planning-document requirements. Generation must clone and map approved templates, remove unused copied sections, and preserve export-shaped filter contracts before any package is considered signing-ready.

## Generator Rules

1. Application icon propagation:
   - The wrapper `IconUrl` must use FontAwesome JSON with `b`, `i`, and `c`.
   - Decoded root `ListSet.IconUrl` must carry the same FontAwesome JSON.
   - Existing decoded root icon surfaces must not be blank, image URLs, or mismatched FontAwesome JSON.

2. Dashboard section materialization:
   - Dashboard Page Layouts v1.1 may copy repeatable/removable section modules only when the section is used.
   - A visible `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper` must contain real business content inside its `section_content_area`.
   - Title-only sections must be removed from the generated resource, not left as empty template scaffolding.

3. Filter shape preservation:
   - `select-filter` controls must preserve the approved label and placeholder export shape.
   - `attrs.lab.value` must be present and business-specific.
   - `attrs.lab.ty` must remain `[null, "xs-light"]`.
   - `attrs.lablay` must remain `[null, "top"]`.
   - `attrs.placeholder` must be either a valid string or an object with a valid `value`; numeric string-spread keys are forbidden.
   - `search-filter` placeholders must also use a valid string or `{ "value": "..." }` shape and must never use numeric string-spread keys.

## Gate Coverage

This training adds or extends gates for:

- wrapper/root application icon surface validation;
- root icon mismatch detection independent of domain mismatch;
- empty visible Dashboard v1.1 business section rejection;
- select-filter label value validation;
- select-filter placeholder object-shape validation;
- search-filter placeholder object-shape validation;
- full-app materializer pruning of unused v1.1 copied sections.

## Proof Boundary

Passing these local gates is required before signing. It does not replace `setsign`, `verifysign`, install/import acceptance, Version Management proof, or browser runtime proof.
