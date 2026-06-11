# Customer Success Renewal YAPK Runtime Hardening

Date: 2026-06-01

This note records the validator lessons from the Customer Success Renewal Management runtime test. It is intentionally redacted: do not commit raw `.yapk` files, raw `Resource`, raw `Sign`, decoded full payloads, API responses, tenant/workspace IDs, or private package/list/layout IDs.

Canonical YAPK schema file: `schemas/yapk-schema.json`.

YAP schema remains separate at `schemas/yap-schema.json`; do not mix YAP `Defs`/gzip wrapper rules with YAPK `Fields`/Brotli wrapper rules.

## Schema-V3 Runtime Gate

Generated YAPK packages must validate as an `AppExportPackageInfo` wrapper whose `Resource` is `base64(Brotli(JSON.stringify(AppPackageInfo)))`. The decoded `AppPackageInfo` must include the required schema-v3 keys:

- `ListSet`
- `Pages`
- `Forms`
- `FormReports`
- `FormNewReports`
- `DataReports`
- `Groups`
- `Tags`
- `Metadatas`
- `Agents`
- `Connections`
- `Knowledges`
- `Themes`
- `Components`
- `PortalInfo`
- `Childs`

For `AppID = 41`, root and child list resources must use `TableCode: "flowcraft"` and `IndexCode: "flowcraft"`. No-portal packages must use `PortalInfo: null`. If the schema file appears object-based for `PortalInfo`, treat `PortalInfo: null` as the product-runtime override for no-portal packages; `{}` and `[]` are hard failures.

## Runtime Issue Pattern Library

| Symptom | Likely cause | Gate now enforced |
| --- | --- | --- |
| Install succeeds but the app tile fails | API/signature success was mistaken for resource materialization; missing schema-v3 codes or unsafe IDs | Schema-v3 wrapper/decode checks, `flowcraft` codes, API-issued/lossless ID gate |
| Only data lists appear | Dashboard shell is not current or navigation targets missing layout resources | Dashboard `Type: 103`, `Ext2: {"src":true}`, `LayoutInResources[0].ID/RefId = LayoutID`, `Main > Content` |
| Dashboards already in application / invalid layout resources | Layout ownership or resource IDs do not match page `LayoutID` | Layout resource ID/RefId equality and duplicate ID checks |
| Version management unchanged after upgrade check | `UpgradeCheck:true` was classified as applied success | `upgrade_check_passed` is separate from `upgrade_applied`; committed upgrades require `upgrade-apply-yapk` |
| Text controls render wrong | Generated ad hoc `type:"text"` shape instead of native Text control export shape | Native `heading` + `label:"Text"` + `attrs.headc.title` + `attrs.heads` checks |
| Default view/query weak | Views include visible columns but omit required system query fields | Default view visible column and system query hard errors |

## Validation Modes

Use `full-app-plan-conformance` when the user asks for the approved full application. It requires plan, spec, template coverage, strict visual checks, schema validation, data-list validation, dashboard validation, Text-control audit, and safety scan.

Use `focused-runtime-repair` when the user declares a repair scope such as dashboard shell, Text controls, schema-v3 codes, or data-list defaults. Missing full plan/spec should not fail focused repair, but the changed package must still pass non-regression gates: schema-v3 decode, product-safe data-list rules, dashboard shell/data-table rules, native Text controls, ID safety, API helper classification, and safety scan.

## Helper Policy

Use lossless parsing/serialization for any YAPK read/edit/write helper. Use API-issued IDs for new package, list, field, layout, dashboard, and layout-resource IDs. Local fallback IDs, rounded-looking IDs, duplicate IDs, and unsafe JavaScript numeric IDs are hard failures before signing or upload.
