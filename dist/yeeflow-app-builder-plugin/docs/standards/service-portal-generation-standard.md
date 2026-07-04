# Service Portal Generation Standard

This standard is based on `Supplier Management-v1.2.yapk`, a current Yeeflow export that includes a configured Service Portal.

Proof boundary: the structure below is export-proven and validator-backed. New generated Service Portal packages still require focused install, Version Management, portal-login, navigation, resource-access, and permission proof before being called runtime-proven.

## Planning Rules

Service Portal is an advanced app-level capability and must be explicitly planned before package generation.

The App Plan must include a `Service Portal Planning` section with:

- whether a Service Portal is planned;
- portal name, domain/subdomain intent, icon/logo intent, and appearance/navigation colors;
- login/authentication assumptions and any login-page copy or legal links;
- portal user groups to create;
- exposed application resources;
- portal navigation menu;
- per-resource access for each portal user group or special audience;
- list/document-library views exposed through portal permissions;
- list form routing for add/edit/view when the portal should use non-default forms;
- proof boundary and runtime test plan.

If Service Portal is not planned, `PortalInfo` must be `null` in YAPK output. Do not emit `{}` or `[]`.

## Resource Eligibility

Service Portal can expose only resources from the same application:

- Data List resources: child `List.Type = 1`;
- Document Library resources: child `List.Type = 16`;
- Dashboard pages: `Pages[].Type = 103`, referenced by `LayoutID`.

Do not expose Approval forms, Form reports, Data reports, workflow-only resources, Custom Services, AI Agents, or hidden support resources unless a focused product export proves the shape and the App Plan explicitly requests it.

## YAPK Shape

The Service Portal lives in top-level decoded `AppPackageInfo.PortalInfo`.

Observed required object shape:

- `ID`
- `Type`
- `Name`
- `Description`
- `IconUrl`
- `LogoUrl`
- `Settings`
- `Flag`
- `Status`
- `DefaultGroupId`
- `Domain`
- `Groups`
- `Resources`
- `Perms`

The root `ListSet.Ext3` should include:

```json
{
  "externalPortal": {
    "id": "<PortalInfo.ID>"
  }
}
```

`PortalInfo.Settings` is a JSON string. The sample proves these keys:

```json
{
  "navigator-menu": {
    "position": "left",
    "hover": { "color": "var(--c--background)" },
    "bgc": "var(--c--primary-dark-hover)",
    "color": "var(--c--background)",
    "active": { "color": "var(--c--background)" }
  },
  "appearance": {
    "bgc": "var(--c--primary-darker)",
    "color": "var(--c--background)"
  }
}
```

The screenshot also shows login page customization fields, privacy/terms links, and authentication method options. Those values were not found in the decoded sample `PortalInfo.Settings`; treat their export location as unknown until another focused export proves it.

## Portal User List

The sample includes a Type `128` child list for external portal users:

- `List.ListID` equals `PortalInfo.ID` in the sample.
- `List.Title` follows `__external_portal_user-<suffix>__`.
- `List.TableCode = "userinfo"`.
- `List.Type = 128`.
- `List.Flags = 2`.
- `List.LayoutView.add/edit/view` point to the `__userinfo__` Type `1` layout.
- Exported user items were empty; actual portal user credentials/passwords are not proven to migrate through this package.

Observed portal user fields:

- `AppcenterID`
- `Flag`
- `Name_CN`
- `SPAccount`
- `SPAccount_Short`
- `DepartmentID`
- `Email`
- `Photo`
- `Deleted`
- `DelTime`
- `LastLoginTime`

Generated apps should not fabricate real external users, passwords, login sessions, or portal user membership records unless the user provides an explicit safe migration scope and a focused export proves how those rows should be serialized.

## Portal Groups

Portal user groups live in `PortalInfo.Groups[]`.

Observed shape:

```json
{
  "ID": "<long id>",
  "Code": "<uuid>",
  "Name": "Standard users",
  "Description": null
}
```

Use API-issued/package-local IDs consistently and preserve group IDs for portal permissions. Use UUID-like `Code` values for generated groups.

## Portal Resource Registry

`PortalInfo.Resources[]` contains several typed configuration objects.

### Portal Source

`Category = "portal"`, `Type = "resource"`, `Title = "portal source"`.

`Content` is a JSON string:

```json
{
  "lists": [
    { "id": "<child ListID>", "type": 1, "title": "Supplier List", "isHidden": false },
    { "id": "<child ListID>", "type": 16, "title": "DUCS", "isHidden": false }
  ],
  "dashboards": [
    { "id": "<dashboard LayoutID>", "type": 103, "title": "Home page", "isHidden": false }
  ]
}
```

Every `lists[]` entry must point to an existing child list/document library and every `dashboards[]` entry must point to an existing dashboard page.

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

Visible menu items and groups should carry suitable FontAwesome icons. Hidden resource entries may omit icons.

### Portal List Forms

Portal list form settings use one `PortalInfo.Resources[]` object per configured list:

- `Category = "41_<target child ListID>"`;
- `Type = "listforms"`;
- `Content.forms[]` maps `add`, `edit`, and `view` to `default` or a same-list Type `1` custom form layout ID;
- `opentype.open` and `opentype.size` must be preserved from the planned portal UX.

Example:

```json
{
  "forms": [
    { "type": "add", "id": "default", "opentype": { "open": "current", "size": -1 } },
    { "type": "edit", "id": "<same-list custom form LayoutID>", "opentype": { "open": "current", "size": -1 } },
    { "type": "view", "id": "<same-list custom form LayoutID>", "opentype": { "open": "current", "size": -1 } }
  ]
}
```

## Portal Permissions

Portal permissions live in `PortalInfo.Perms[]`.

Observed shape:

```json
{
  "ID": "<permission id>",
  "ItemType": 1,
  "ItemID": "<child ListID>",
  "PermType": 3,
  "PermObjID": "<PortalInfo.Groups[].ID or 999999>",
  "Perm": 25,
  "Ext": "{\"views\":[\"<LayoutID>\"]}"
}
```

Rules:

- `ItemType = 1` references a Data List or Document Library child ListID.
- `ItemType = 2` references a Dashboard page LayoutID.
- `PermObjID` must reference `PortalInfo.Groups[].ID` or the observed special portal audience `999999`.
- List/document-library permission rows should include `Ext.views[]` with allowed view LayoutIDs.
- Dashboard permission rows may have empty `Ext`.
- Observed `Perm` values are `1`, `25`, and `249`; the exact bitmask semantics are not fully proven from this single export, so generation must use explicit mapped permission presets only when product meaning is confirmed or user supplies an export-backed mapping.

## Portal-Aware Dashboard/List Binding

The sample includes one dashboard Collection data source with:

```json
{
  "AppID": 41,
  "ListID": "<portal-exposed child ListID>",
  "Type": 1,
  "Title": "<resource title>",
  "ListSetID": "<root app ListSetID>",
  "ExtPortal": {
    "id": "<PortalInfo.ID>"
  }
}
```

When a dashboard/page inside a portal needs portal-aware resource access, preserve `attrs.data.list.ExtPortal.id`.

## Validation Rules

Before signing readiness for any generated package with Service Portal:

- `PortalInfo` is object when planned, `null` when not planned.
- `ListSet.Ext3.externalPortal.id` matches `PortalInfo.ID`.
- Type `128` external portal user list is present or explicitly deferred with proof boundary.
- `PortalInfo.Resources` includes source registry and menus.
- Exposed resources are only Type `1`, Type `16`, or Type `103`.
- Every source/menu/permission ID resolves to a current generated resource or portal group.
- `PortalInfo.Perms[].Ext.views[]` resolves to same-resource views.
- Portal listforms target same-list Type `1` layouts or `default`.
- Visible portal menu entries include FontAwesome icons.
- No Approval forms or Form reports are included in portal source, menus, or permissions.

Use:

```bash
node scripts/inspect-service-portal-yapk.mjs --package <package.yapk> --json
```

## Unknowns / Needs Focused Runtime Proof

- Exact export location for login page customization text, legal links, and login authentication options was not found in this sample's decoded `PortalInfo.Settings`.
- The semantic meaning of `Perm` values `1`, `25`, and `249` needs product confirmation or a matrix export.
- Whether generated packages should create portal user rows is unproven; current safe default is to create the portal user system list and portal groups, not real user credentials.
- Runtime behavior of newly generated Service Portal packages still needs focused install/open/login/resource-access/export-back proof.
