# Feature Skill Map

After a generated package validates, imports, works at runtime, and has a documented baseline, update or create the relevant skill.

## Existing Skill Updates

- Approval form feature: update `yeeflow-approval-form-generator` and `yeeflow-application-generator`.
- Data list feature: update `yeeflow-data-list-generator` and `yeeflow-application-generator`.
- App shell / `.yap` feature: update `yeeflow-application-generator`.

## New Or Updated Feature Skills

- Dashboard feature: create or update `yeeflow-dashboard-generator`, and update `yeeflow-application-generator`.
- Document library feature: create or update `yeeflow-document-library-generator`, and update `yeeflow-application-generator`.
- Reports feature: create or update `yeeflow-report-generator`, and update `yeeflow-application-generator`.
- AI Agent/Copilot feature: create a dedicated skill only after export study and sensitive dependency handling are clear.
- Workflow actions or other application resources: create a dedicated skill only after real export study, validation rules, runtime proof, and a baseline doc exist.

## Required Skill Content

Skill updates should include:

- proven patterns
- hard rules
- validators/scripts
- stop conditions
- summarized examples, not raw huge exports
- remaining gaps

Do not bundle large `.yap`, `.ydl`, or `.ywf` exports.

Do not bundle secrets, tenant credentials, tokens, connection strings, or raw sensitive resource definitions.

Run `node --check` on any bundled JavaScript scripts.

## Success Definition

A feature is not considered learned until all are true:

1. real export studied
2. pattern documented
3. validator catches common failures
4. generated test package validates
5. package imports
6. runtime behavior works
7. export-back behavior understood when available
8. successful baseline documented
9. relevant skill updated or created

