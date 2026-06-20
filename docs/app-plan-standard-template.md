# Yeeflow App Plan Template Compatibility Entrypoint

The canonical App Plan template is:

`docs/standards/app-plan-standard-template.md`

Use that canonical template for every new Yeeflow application build. This compatibility file remains so older scripts, docs, and prompts that still read `docs/app-plan-standard-template.md` do not fail, but it must not be treated as a competing App Plan standard.

The canonical flow is:

1. Produce a standardized Functional Specification with `docs/standards/functional-specification-standard-template.md`.
2. Review and validate the Functional Specification.
3. Produce the standardized Yeeflow App Plan from that reviewed Functional Specification with `docs/standards/app-plan-standard-template.md`.
4. Review and validate the App Plan.
5. Produce and validate the Page Function Plan with `docs/standards/page-function-plan-standard-template.md`.
6. Produce and review the Application Design System with `docs/standards/application-design-system-template.md`.
7. Proceed to full-page design images, page implementation blueprints, Yeeflow resource/package generation, decoded resource-vs-blueprint parity checks, signing, install/import/upgrade, or runtime proof only after the required planning gates pass.

The App Plan is a Yeeflow resource generation contract organized by Yeeflow resource generation order. It is not a generic project plan, script plan, page design document, or free-form checklist.

Dashboard golden-reference and Dashboard section-template selection belong in the Stage 3 Page Function Plan. The App Plan should declare Dashboard resources and stable Page Function Plan references only.
