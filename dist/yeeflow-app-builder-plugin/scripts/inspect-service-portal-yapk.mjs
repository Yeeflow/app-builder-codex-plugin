#!/usr/bin/env node
import { readDecodedYapk, parseJsonMaybe, isObject } from "./lib/yapk-decode-utils.mjs";

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.package) {
    console.error("Usage: node scripts/inspect-service-portal-yapk.mjs --package <app.yapk> [--json]");
    process.exit(2);
  }

  let result;
  try {
    const { wrapper, decoded } = readDecodedYapk(args.package);
    result = inspectServicePortal(wrapper, decoded);
  } catch (error) {
    result = {
      status: "fail",
      findings: [
        {
          severity: "error",
          code: "SERVICE_PORTAL_YAPK_DECODE_FAILED",
          message: error?.message || String(error),
        },
      ],
    };
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printText(result);
  }

  if (result.status === "fail") process.exit(1);
}

export function inspectServicePortal(wrapper, decoded) {
  const findings = [];
  const portal = decoded?.PortalInfo;
  const childById = new Map(asArray(decoded?.Childs).map((child) => [String(child?.List?.ListID), child]));
  const pageByLayoutId = new Map(asArray(decoded?.Pages).map((page) => [String(page?.LayoutID ?? page?.ID), page]));
  const groupById = new Map();

  if (portal === null || portal === undefined) {
    return {
      status: "pass",
      hasPortal: false,
      summary: {
        wrapperTitle: wrapper?.Title,
        wrapperListID: maskId(wrapper?.ListID),
        portalInfo: null,
      },
      findings,
    };
  }

  if (!isObject(portal) || Array.isArray(portal)) {
    add(findings, "error", "SERVICE_PORTAL_PORTALINFO_INVALID", "PortalInfo must be null for no portal or an object for a generated service portal.", {
      actualType: Array.isArray(portal) ? "array" : typeof portal,
    });
    return { status: "fail", hasPortal: true, findings };
  }

  for (const key of ["ID", "Type", "Name", "Status", "Domain", "Groups", "Resources", "Perms"]) {
    if (!Object.prototype.hasOwnProperty.call(portal, key)) {
      add(findings, "error", "SERVICE_PORTAL_REQUIRED_KEY_MISSING", `PortalInfo is missing required key ${key}.`, { key });
    }
  }

  for (const group of asArray(portal.Groups)) {
    if (group?.ID !== undefined) groupById.set(String(group.ID), group);
  }

  const listSource = [];
  const dashboardSource = [];
  const menus = [];
  const listForms = [];

  for (const [index, resource] of asArray(portal.Resources).entries()) {
    if (!isObject(resource)) {
      add(findings, "error", "SERVICE_PORTAL_RESOURCE_INVALID", "PortalInfo.Resources entries must be objects.", { index });
      continue;
    }
    const content = parseJsonMaybe(resource.Content);
    if (!content) {
      add(findings, "error", "SERVICE_PORTAL_RESOURCE_CONTENT_INVALID_JSON", "PortalInfo.Resources[].Content must be a JSON string.", {
        index,
        category: resource.Category,
        type: resource.Type,
        title: resource.Title,
      });
      continue;
    }
    if (resource.Category === "portal" && resource.Type === "resource") {
      for (const item of asArray(content.lists)) {
        listSource.push(item);
        validatePortalListSource(findings, item, childById);
      }
      for (const item of asArray(content.dashboards)) {
        dashboardSource.push(item);
        validatePortalDashboardSource(findings, item, pageByLayoutId);
      }
    } else if (resource.Category === "portal" && resource.Type === "menus") {
      for (const item of asArray(content.menus)) {
        menus.push(summarizeMenu(item));
        validatePortalMenu(findings, item, childById, pageByLayoutId);
      }
    } else if (resource.Type === "listforms") {
      const targetListId = String(resource.Category || "").replace(/^41_/, "");
      const child = childById.get(targetListId);
      if (!child) {
        add(findings, "error", "SERVICE_PORTAL_LISTFORMS_TARGET_UNKNOWN", "Portal listforms resource category must point to an existing child list.", {
          category: resource.Category,
        });
      }
      for (const form of asArray(content.forms)) {
        listForms.push({
          listID: maskId(targetListId),
          listTitle: child?.List?.Title || null,
          type: form?.type,
          id: maskId(form?.id),
          open: form?.opentype?.open ?? null,
          size: form?.opentype?.size ?? null,
        });
        if (form?.id && form.id !== "default" && child) {
          const exists = asArray(child.Layouts).some((layout) => String(layout.LayoutID) === String(form.id));
          if (!exists) {
            add(findings, "error", "SERVICE_PORTAL_LISTFORM_LAYOUT_UNKNOWN", "Portal list form IDs must resolve to layouts on the same list.", {
              listTitle: child.List?.Title,
              formType: form.type,
              formId: maskId(form.id),
            });
          }
        }
      }
    }
  }

  const permissionMatrix = [];
  for (const [index, perm] of asArray(portal.Perms).entries()) {
    const itemType = String(perm?.ItemType);
    const itemId = String(perm?.ItemID);
    const target =
      itemType === "1"
        ? childById.get(itemId)?.List
        : itemType === "2"
          ? pageByLayoutId.get(itemId)
          : null;
    if (!target) {
      add(findings, "error", "SERVICE_PORTAL_PERMISSION_TARGET_UNKNOWN", "Portal permission ItemID must reference a portal-exposed list/document library or dashboard.", {
        index,
        itemType: perm?.ItemType,
        itemId: maskId(perm?.ItemID),
      });
    }
    const permObjId = String(perm?.PermObjID);
    if (permObjId !== "999999" && !groupById.has(permObjId)) {
      add(findings, "error", "SERVICE_PORTAL_PERMISSION_GROUP_UNKNOWN", "Portal permission PermObjID must be a portal group ID or the observed special audience 999999.", {
        index,
        permObjID: maskId(perm?.PermObjID),
      });
    }
    permissionMatrix.push({
      itemType: perm?.ItemType,
      itemKind: itemType === "1" ? "list-or-document-library" : itemType === "2" ? "dashboard" : "unknown",
      itemID: maskId(perm?.ItemID),
      itemTitle: target?.Title || null,
      permType: perm?.PermType,
      permObjID: maskId(perm?.PermObjID),
      permObjName: permObjId === "999999" ? "special-portal-audience-999999" : groupById.get(permObjId)?.Name || null,
      perm: perm?.Perm,
      viewIDs: asArray(parseJsonMaybe(perm?.Ext)?.views).map(maskId),
    });
  }

  const portalUserList = asArray(decoded.Childs).find((child) => child?.List?.Type === 128 || String(child?.List?.Title || "").includes("__external_portal_user"));
  if (!portalUserList) {
    add(findings, "warning", "SERVICE_PORTAL_USER_LIST_MISSING", "The sample export includes a Type 128 external portal user list; generated portals may need this system list unless a runtime export proves otherwise.");
  } else if (String(portalUserList.List?.ListID) !== String(portal.ID)) {
    add(findings, "warning", "SERVICE_PORTAL_USER_LIST_ID_DIFFERS", "The sample export uses the same ID for PortalInfo.ID and the Type 128 external portal user list.", {
      portalID: maskId(portal.ID),
      userListID: maskId(portalUserList.List?.ListID),
    });
  }

  const ext3 = parseJsonMaybe(decoded?.ListSet?.Ext3);
  if (isObject(ext3?.externalPortal) && String(ext3.externalPortal.id) !== String(portal.ID)) {
    add(findings, "error", "SERVICE_PORTAL_LISTSET_EXT3_MISMATCH", "ListSet.Ext3.externalPortal.id must match PortalInfo.ID.", {
      externalPortalId: maskId(ext3.externalPortal.id),
      portalId: maskId(portal.ID),
    });
  }

  const status = findings.some((finding) => finding.severity === "error") ? "fail" : "pass";
  return {
    status,
    hasPortal: true,
    summary: {
      wrapperTitle: wrapper?.Title,
      wrapperListID: maskId(wrapper?.ListID),
      portal: {
        id: maskId(portal.ID),
        type: portal.Type,
        name: portal.Name,
        status: portal.Status,
        flag: portal.Flag,
        domain: redactDomain(portal.Domain),
        defaultGroupId: maskId(portal.DefaultGroupId),
        iconUrl: portal.IconUrl ? "<url-redacted>" : null,
        logoUrl: portal.LogoUrl ? "<url-redacted>" : null,
      },
      listSetExternalPortalId: maskId(ext3?.externalPortal?.id),
      groups: asArray(portal.Groups).map((group) => ({
        id: maskId(group.ID),
        code: group.Code ? "<uuid>" : null,
        name: group.Name,
        description: group.Description ?? null,
      })),
      exposedLists: listSource.map((item) => ({
        id: maskId(item?.id),
        type: item?.type,
        title: item?.title,
        isHidden: Boolean(item?.isHidden),
      })),
      exposedDashboards: dashboardSource.map((item) => ({
        id: maskId(item?.id),
        type: item?.type,
        title: item?.title,
        isHidden: Boolean(item?.isHidden),
      })),
      menus,
      listForms,
      permissionMatrix,
      portalUserList: portalUserList
        ? {
            listID: maskId(portalUserList.List?.ListID),
            title: portalUserList.List?.Title,
            type: portalUserList.List?.Type,
            tableCode: portalUserList.List?.TableCode,
            fieldNames: asArray(portalUserList.Fields).map((field) => field.FieldName),
            itemCount: portalUserList.List?.Items ? Object.keys(portalUserList.List.Items).length : 0,
          }
        : null,
      settingsKeys: portal.Settings ? Object.keys(parseJsonMaybe(portal.Settings) || {}) : [],
    },
    findings,
  };
}

function validatePortalListSource(findings, item, childById) {
  const type = Number(item?.type);
  const child = childById.get(String(item?.id));
  if (!child) {
    add(findings, "error", "SERVICE_PORTAL_SOURCE_LIST_UNKNOWN", "Portal source lists must reference an existing child resource.", {
      id: maskId(item?.id),
      title: item?.title,
    });
    return;
  }
  if (![1, 16].includes(type)) {
    add(findings, "error", "SERVICE_PORTAL_UNSUPPORTED_LIST_TYPE", "Service Portal may expose Data List Type 1 and Document Library Type 16 resources, not approval forms or reports.", {
      id: maskId(item?.id),
      title: item?.title,
      type: item?.type,
    });
  }
  if (Number(child.List?.Type) !== type) {
    add(findings, "error", "SERVICE_PORTAL_SOURCE_LIST_TYPE_MISMATCH", "Portal source type must match the referenced child resource type.", {
      title: item?.title,
      sourceType: item?.type,
      childType: child.List?.Type,
    });
  }
}

function validatePortalDashboardSource(findings, item, pageByLayoutId) {
  const page = pageByLayoutId.get(String(item?.id));
  if (!page) {
    add(findings, "error", "SERVICE_PORTAL_DASHBOARD_UNKNOWN", "Portal dashboards must reference an existing Type 103 page LayoutID.", {
      id: maskId(item?.id),
      title: item?.title,
    });
    return;
  }
  if (Number(item?.type) !== 103 || Number(page.Type) !== 103) {
    add(findings, "error", "SERVICE_PORTAL_DASHBOARD_TYPE_INVALID", "Portal dashboards must be Type 103 pages.", {
      title: item?.title,
      sourceType: item?.type,
      pageType: page.Type,
    });
  }
}

function validatePortalMenu(findings, item, childById, pageByLayoutId) {
  if (item?.type === "classes") {
    if (!item.icon) {
      add(findings, "warning", "SERVICE_PORTAL_MENU_GROUP_ICON_MISSING", "Portal navigation groups should carry FontAwesome icon metadata.", { title: item.title });
    }
    for (const child of asArray(item.childs)) validatePortalMenu(findings, child, childById, pageByLayoutId);
    return;
  }
  const type = Number(item?.type);
  const id = String(item?.id);
  const exists = type === 103 ? pageByLayoutId.has(id) : childById.has(id);
  if (!exists) {
    add(findings, "error", "SERVICE_PORTAL_MENU_TARGET_UNKNOWN", "Portal menu item must reference an exposed app resource.", {
      id: maskId(item?.id),
      type: item?.type,
      title: item?.title,
    });
  }
  if (![1, 16, 103].includes(type)) {
    add(findings, "error", "SERVICE_PORTAL_MENU_TYPE_UNSUPPORTED", "Portal navigation must use Data List, Document Library, Dashboard, or classes group menu items.", {
      title: item?.title,
      type: item?.type,
    });
  }
  if (!item.icon && !item.isHidden) {
    add(findings, "warning", "SERVICE_PORTAL_MENU_ICON_MISSING", "Visible portal navigation items should carry a FontAwesome icon.", {
      title: item?.title,
      type: item?.type,
    });
  }
}

function summarizeMenu(item) {
  if (item?.type === "classes") {
    return {
      id: maskId(item.id),
      type: "classes",
      title: item.title,
      icon: item.icon || null,
      childs: asArray(item.childs).map(summarizeMenu),
    };
  }
  return {
    id: maskId(item?.id),
    type: item?.type,
    title: item?.title,
    isHidden: Boolean(item?.isHidden),
    icon: item?.icon || null,
  };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--package") out.package = argv[++i];
    else if (arg === "--json") out.json = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
  }
  return out;
}

function printText(report) {
  console.log(`Service Portal inspection: ${report.status}`);
  console.log(`Has portal: ${report.hasPortal ? "yes" : "no"}`);
  if (report.summary?.portal) {
    console.log(`Portal: ${report.summary.portal.name} (${report.summary.portal.domain})`);
    console.log(`Exposed lists/libraries: ${report.summary.exposedLists.length}`);
    console.log(`Exposed dashboards: ${report.summary.exposedDashboards.length}`);
    console.log(`Portal groups: ${report.summary.groups.length}`);
    console.log(`Permissions: ${report.summary.permissionMatrix.length}`);
  }
  if (report.findings.length) {
    console.log("Findings:");
    for (const finding of report.findings) console.log(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
  }
}

function add(findings, severity, code, message, details = {}) {
  findings.push({ severity, code, message, details });
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function maskId(value) {
  if (value === undefined || value === null) return value;
  const string = String(value);
  if (/^\d{8,}$/.test(string)) return `${string.slice(0, 4)}…${string.slice(-4)}`;
  return string;
}

function redactDomain(value) {
  if (!value) return value;
  const string = String(value);
  const parts = string.split(".");
  if (parts.length < 2) return "<domain-redacted>";
  return `${parts[0].slice(0, 2)}…${parts.at(-2)}.${parts.at(-1)}`;
}

function isMain(url) {
  return url === new URL(`file://${process.argv[1]}`).href;
}
