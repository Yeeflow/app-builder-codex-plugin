import { asArray, isObject, parseJsonMaybe } from "./yapk-decode-utils.mjs";

// A Dashboard clone is not safe to save until every copied target points at an
// ID allocated for the target application.  This deliberately remaps values
// recursively: action targets are often nested in local Collection actions or
// an item-template's control_action rather than on the visible Button itself.
export function remapDashboardActionTargets(decoded, mappings = {}) {
  const maps = normalizeMappings(mappings);
  const counts = { list: 0, listSet: 0, layout: 0, field: 0, action: 0 };
  for (const page of asArray(decoded?.Pages)) {
    if (String(page?.Type) !== "103") continue;
    for (const layoutResource of asArray(page?.LayoutInResources)) {
      const resource = parseJsonMaybe(layoutResource?.Resource);
      if (!isObject(resource)) continue;
      remapValue(resource, maps, counts);
      layoutResource.Resource = JSON.stringify(resource);
    }
  }
  return { decoded, counts };
}

function normalizeMappings(mappings) {
  return {
    list: new Map(Object.entries(mappings.listIds || mappings.list || {})),
    listSet: new Map(Object.entries(mappings.listSetIds || mappings.listSet || {})),
    layout: new Map(Object.entries(mappings.layoutIds || mappings.layout || {})),
    field: new Map(Object.entries(mappings.fieldIds || mappings.field || {})),
    action: new Map(Object.entries(mappings.actionIds || mappings.action || {})),
  };
}

function remapValue(value, maps, counts) {
  if (Array.isArray(value)) {
    value.forEach((item) => remapValue(item, maps, counts));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, current] of Object.entries(value)) {
    const map = mapForKey(key, maps);
    // Action definitions expose their target as `id`, while bindings use
    // control_action.  Only values explicitly listed in actionIds are changed;
    // ordinary control ids remain untouched.
    if (maps.action.has(String(current))) {
      value[key] = maps.action.get(String(current));
      counts.action += 1;
      continue;
    }
    if (map && map.has(String(current))) {
      value[key] = map.get(String(current));
      counts[map === maps.list ? "list" : map === maps.listSet ? "listSet" : map === maps.layout ? "layout" : map === maps.field ? "field" : "action"] += 1;
      continue;
    }
    remapValue(current, maps, counts);
  }
}

function mapForKey(key, maps) {
  if (key === "ListID") return maps.list;
  if (key === "ListSetID") return maps.listSet;
  if (["layout", "LayoutID", "linkLayout", "link"].includes(key)) return maps.layout;
  if (["FieldID", "fieldID"].includes(key)) return maps.field;
  if (["control_action", "action", "actionId", "ActionID"].includes(key)) return maps.action;
  return null;
}
