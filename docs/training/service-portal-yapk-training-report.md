# Service Portal YAPK Training Report

## Scope

This focused training pass studied `/Users/rengerhu/Downloads/Supplier Management-v1.2.yapk` and the supplied Service Portal screenshots.

The goal was to learn the export shape for Yeeflow Service Portal enough to plan future generated applications that include external portal access to selected app resources.

This pass does not claim generated Service Portal runtime proof. It is export-proven and validator-backed.

## Confirmed From Export

The decoded YAPK uses top-level `PortalInfo` for Service Portal data. No-portal generated packages should continue to use `PortalInfo: null`.

The sample `PortalInfo` object contains:

- portal identity and domain fields: `ID`, `Type`, `Name`, `Domain`, `Status`, `Flag`, `DefaultGroupId`;
- branding assets: `IconUrl`, `LogoUrl`;
- style settings as a JSON string in `Settings`;
- portal user groups in `Groups[]`;
- portal source/menu/list-form configuration in `Resources[]`;
- access permissions in `Perms[]`.

The app root links back to the portal through `ListSet.Ext3`:

```json
{
  "externalPortal": {
    "id": 2003
  }
}
```

## Portal User Management

The package includes a child resource:

- `List.Type = 128`
- `List.TableCode = "userinfo"`
- `List.Title = "__external_portal_user-<suffix>__"`
- sample `ListID = PortalInfo.ID`

Observed system fields:

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

No actual portal user rows were exported in this sample. Generated packages must not claim to migrate external user accounts, passwords, or login state from this evidence.

## Portal Groups

Portal groups are in `PortalInfo.Groups[]`.

Observed sample:

```json
{
  "ID": "<long id>",
  "Code": "<uuid>",
  "Name": "Standard users",
  "Description": null
}
```

These group IDs are referenced by `PortalInfo.Perms[].PermObjID`.

## Portal Resource Registry

`PortalInfo.Resources[]` is a typed configuration list.

The sample includes:

1. `Category: "portal"`, `Type: "resource"`, `Title: "portal source"`
   - `Content.lists[]`: Data List and Document Library resources exposed to portal.
   - `Content.dashboards[]`: Dashboard pages exposed to portal.
2. `Category: "portal"`, `Type: "menus"`, `Title: "portal menus"`
   - `Content.menus[]`: portal navigation, including `type: "classes"` group items and nested `childs[]`.
3. `Category: "41_<ListID>"`, `Type: "listforms"`
   - `Content.forms[]`: add/edit/view form routing for one exposed list.

The sample portal source exposed:

- Data Lists:
  - `Products and services`
  - `Supplier Contracts`
  - `Supplier List`
  - `Supplier(Real)`
- Document Library:
  - `DUCS`
- Dashboard:
  - `Home page`

Service Portal must not expose Approval forms or Form reports.

## Portal Permissions

`PortalInfo.Perms[]` controls resource access.

Observed row fields:

- `ID`
- `ItemType`
- `ItemID`
- `PermType`
- `PermObjID`
- `Perm`
- `Ext`

Observed relationship:

- `ItemType = 1`: `ItemID` is a child ListID for Data List or Document Library.
- `ItemType = 2`: `ItemID` is a Dashboard `LayoutID`.
- `PermType = 3` in this sample.
- `PermObjID` references a `PortalInfo.Groups[].ID` or the special observed audience `999999`.
- For lists/document libraries, `Ext` is a JSON string with `views[]` LayoutIDs.
- For dashboards, `Ext` can be an empty string.

Observed `Perm` values were `1`, `25`, and `249`. The exact bit semantics should not be guessed from one export.

## Portal-Aware Page Binding

One dashboard Collection data source used:

```json
{
  "ExtPortal": {
    "id": 2003
  }
}
```

This is evidence that portal-aware dashboard/resource controls may carry the current portal ID inside `attrs.data.list.ExtPortal.id`.

## Screenshots Cross-Check

The screenshots confirm UI features that match the decoded structure:

- portal name `SupplierPortal`;
- independent portal login URL;
- service portal appearance/navigation settings;
- left portal navigation with Home page, DUCS, and Data management group;
- runtime external portal user view showing the Supplier List.

The screenshot also shows login page customization values and legal links. Those values were not found in this sample's decoded `PortalInfo.Settings`; keep that as an open export-location question.

## Training Rules Added

- Service Portal must be planned explicitly in App Plan before generation.
- Generate `PortalInfo` only when planned.
- `PortalInfo: null` remains the required no-portal shape.
- Exposed portal resources are limited to Data Lists, Document Libraries, and Dashboards.
- Portal users are represented by a Type `128` external portal user list; do not fabricate real users/passwords.
- Portal navigation uses `PortalInfo.Resources[]` with `Type: "menus"` and FontAwesome icons.
- Resource availability uses `PortalInfo.Resources[]` with `Type: "resource"`.
- Resource permissions use `PortalInfo.Perms[]`.
- Portal list forms use `PortalInfo.Resources[]` with `Type: "listforms"` and `Category: "41_<ListID>"`.
- Permission and source/menu/listform IDs must resolve to current generated resources.
- Approval forms and Form reports must be rejected from Service Portal source, menus, and permissions.

## New Validator/Inspector

Added:

```bash
node scripts/inspect-service-portal-yapk.mjs --package <package.yapk> --json
```

The inspector emits a redacted Service Portal summary and fails unsupported resource types, unknown menu/source targets, unknown permission targets, unknown group references, and invalid listform layout references.

Regression:

```bash
node scripts/test-service-portal-yapk-inspector.mjs
```

## Open Questions

1. Where are login page customization values, legal links, and login authentication settings stored in exported YAPK when they are included?
2. What are the exact semantic meanings of `Perm` values `1`, `25`, and `249`?
3. Is `999999` the product-standard "all/default portal users" audience, and when should it be generated?
4. Should fresh generated Service Portals always include the Type `128` portal user list with `ListID = PortalInfo.ID`, or is that export-dependent?
5. What is the import/runtime behavior for newly generated Service Portal packages with real user groups and newly exposed resources?

These should be answered with focused exports or runtime proof before claiming full Service Portal generation maturity.
