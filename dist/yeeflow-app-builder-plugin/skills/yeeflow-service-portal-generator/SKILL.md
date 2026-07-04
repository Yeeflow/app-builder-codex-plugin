---
name: yeeflow-service-portal-generator
description: plan, inspect, validate, and generate Yeeflow Service Portal payloads in .yapk applications, including PortalInfo, portal resources, menus, users, user groups, list/document/dashboard exposure, list form routing, and portal permission matrices.
---

# Yeeflow Service Portal Generator

Use this skill when a Yeeflow app needs a Service Portal for external users, portal users, portal user groups, portal login/navigation/appearance settings, or portal access to selected app resources.

Service Portal is an application-level capability. It exposes selected resources from the current app to an independent portal site and user population. It is distinct from public forms and from normal internal application navigation.

## Required References

Before planning, inspecting, or generating Service Portal payloads, read:

- `../../../docs/standards/service-portal-generation-standard.md`
- `../../../docs/reference/service-portal-yapk-example.normalized.json`
- `../../../docs/training/service-portal-yapk-training-report.md`

For package inspection, use:

```bash
node scripts/inspect-service-portal-yapk.mjs --package <package.yapk> --json
```

Proof boundary: current Service Portal knowledge is export-proven and validator-backed from `Supplier Management-v1.2.yapk`. New generated Service Portal packages still require focused install, Version Management, portal-login, portal-navigation, resource access, permission, and export-back proof before being called runtime-proven.

## When To Use Service Portal

Use Service Portal when the application must let external or non-internal users access selected app resources through a separate portal URL, independent portal account management, portal groups, portal navigation, and portal appearance/authentication settings.

Common examples:

- suppliers logging in to view or update supplier profile records;
- vendors viewing contracts or document library files;
- customers viewing support tickets or submitting updates through selected Data Lists;
- partners accessing a dashboard and a few shared document/data resources.

Do not use Service Portal when:

- all users are internal Yeeflow application users;
- the requirement is only one public intake form;
- Approval forms or Form reports must be exposed directly, because the export-proven portal source supports Data List, Document Library, and Dashboard resources only;
- real external user credential migration is required but no safe user-migration export/proof exists.

## App Plan Requirements

The App Plan must include a `Service Portal Planning` section before generation.

Required planning content:

- planned/not planned;
- portal name and domain/subdomain intent;
- portal icon/logo/appearance/navigation colors;
- login/authentication assumptions and any legal/privacy/terms links;
- portal user groups;
- resources exposed to portal;
- portal navigation menu and icons;
- access matrix by resource and group/audience;
- exposed view IDs or view names for Data List / Document Library resources;
- add/edit/view form routing for each exposed list or document library when non-default forms are needed;
- runtime proof plan.

Rows such as `Not planned`, `N/A`, `None`, or `Not applicable` are planning placeholders only. They must not materialize into `PortalInfo`, portal user lists, portal groups, portal permissions, portal menus, or hidden resources.

## Core YAPK Shape

Service Portal lives in decoded top-level `AppPackageInfo.PortalInfo`.

No portal:

```json
"PortalInfo": null
```

Planned portal:

```json
{
  "ID": 2003,
  "Type": 2,
  "Name": "SupplierPortal",
  "Description": null,
  "IconUrl": "<url or empty>",
  "LogoUrl": "<url or empty>",
  "Settings": "{\"navigator-menu\":{...},\"appearance\":{...}}",
  "Flag": 0,
  "Status": 1,
  "DefaultGroupId": 0,
  "Domain": "example.yeeflow.app",
  "Groups": [],
  "Resources": [],
  "Perms": []
}
```

The root app should link to the portal:

```json
"ListSet": {
  "Ext3": "{\"externalPortal\":{\"id\":2003}}"
}
```

## Portal User List

The sample export includes a Type `128` external portal user system list:

- `ListID` matches `PortalInfo.ID` in the sample;
- `Title` follows `__external_portal_user-<suffix>__`;
- `TableCode = "userinfo"`;
- `Type = 128`;
- user rows were not exported.

Generate the portal user system list only as a portal infrastructure resource, not as a real user credential migration. Do not fabricate passwords, login state, or portal user account rows.

## Portal Groups

Portal groups live in `PortalInfo.Groups[]`:

```json
{
  "ID": "<long id>",
  "Code": "<uuid>",
  "Name": "Standard users",
  "Description": null
}
```

Use these IDs in `PortalInfo.Perms[].PermObjID`.

## Portal Resources

`PortalInfo.Resources[]` has typed entries.

### Resource Source

`Category = "portal"`, `Type = "resource"`, `Title = "portal source"`.

`Content` is a JSON string:

```json
{
  "lists": [
    { "id": "<ListID>", "type": 1, "title": "Supplier List", "isHidden": false },
    { "id": "<ListID>", "type": 16, "title": "Documents", "isHidden": false }
  ],
  "dashboards": [
    { "id": "<LayoutID>", "type": 103, "title": "Home page", "isHidden": false }
  ]
}
```

Allowed list types are:

- Type `1`: Data List;
- Type `16`: Document Library.

Allowed dashboard type:

- Type `103`: Dashboard page by LayoutID.

Never expose Approval forms or Form reports in the portal source.

### Portal Menus

`Category = "portal"`, `Type = "menus"`, `Title = "portal menus"`.

`Content` is a JSON string:

```json
{
  "menus": [
    { "id": "<LayoutID>", "type": 103, "title": "Home page", "isHidden": false, "icon": "fa-regular fa-house" },
    {
      "id": "<uuid>",
      "type": "classes",
      "title": "Data management",
      "icon": "fa-regular fa-database",
      "childs": [
        { "id": "<ListID>", "type": 1, "title": "Supplier List", "isHidden": false, "icon": "fa-regular fa-grid-4" }
      ]
    }
  ]
}
```

Visible portal navigation items and menu groups should have suitable FontAwesome icons. Hidden source resources may be included with `isHidden: true`.

### List Form Routing

`Type = "listforms"` configures portal add/edit/view form behavior.

Use:

- `Category = "41_<target ListID>"`;
- `Content.forms[]` entries for `add`, `edit`, and `view`;
- form `id = "default"` or a same-list Type `1` custom form LayoutID;
- `opentype.open` and `opentype.size` from the planned portal UX.

## Portal Permissions

Portal permissions live in `PortalInfo.Perms[]`:

```json
{
  "ID": "<permission id>",
  "ItemType": 1,
  "ItemID": "<ListID>",
  "PermType": 3,
  "PermObjID": "<PortalInfo.Groups[].ID or 999999>",
  "Perm": 25,
  "Ext": "{\"views\":[\"<LayoutID>\"]}"
}
```

Rules:

- `ItemType = 1` points to a Data List or Document Library child ListID.
- `ItemType = 2` points to a Dashboard page LayoutID.
- `PermObjID` must be a portal group ID or the observed special audience `999999`.
- List/document-library rows should include `Ext.views[]` with allowed view LayoutIDs.
- Dashboard rows may have empty `Ext`.
- Observed `Perm` values are `1`, `25`, and `249`; do not assign human-readable meanings to these bitmasks without product confirmation or an export-backed mapping.

## Portal-Aware Page Bindings

When portal dashboards or page controls bind to a portal-exposed Data List, the sample export proves the data source may include:

```json
"ExtPortal": {
  "id": "<PortalInfo.ID>"
}
```

Preserve this when generating portal-aware dashboard/list controls.

## Validation Checklist

Before signing readiness:

- If Service Portal is absent, `PortalInfo` is exactly `null`.
- If Service Portal is planned, `PortalInfo` is an object with required identity/settings/resources/perms arrays.
- `ListSet.Ext3.externalPortal.id` matches `PortalInfo.ID`.
- A Type `128` portal user system list is present or explicitly deferred with proof boundary.
- `PortalInfo.Resources` includes source and menu entries.
- Exposed resources resolve to current app Data Lists, Document Libraries, or Dashboards.
- Menus resolve to current exposed resources or `classes` groups.
- Portal listforms resolve to same-list Type `1` layouts or `default`.
- Permission ItemIDs resolve to exposed resources.
- Permission group IDs resolve to `PortalInfo.Groups[]` or observed special audience `999999`.
- Permission `Ext.views[]` resolves to valid views on the same resource.
- No Approval form or Form report is included in portal source, menu, or permissions.
- All visible menu items have FontAwesome icons.
- Run `scripts/inspect-service-portal-yapk.mjs`.

## Unknowns And Stop Conditions

Stop or mark as `export-proven-only` when any of these matter:

- login page customization text/legal links/authentication method must be generated, because their exact export location was not proven in this sample;
- exact `Perm` bitmask semantics are required;
- real portal user account migration is required;
- runtime login/access proof is required but cannot be performed;
- a resource other than Data List, Document Library, or Dashboard must be exposed.
