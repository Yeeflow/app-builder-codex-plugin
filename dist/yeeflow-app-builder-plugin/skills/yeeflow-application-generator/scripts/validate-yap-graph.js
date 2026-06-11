#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { validateWorkflowActionShapes } = require("./workflow-action-config-validator");
const {
  loadControlFieldSchemas,
  validateFieldAgainstSchema,
} = require("./yeeflow-control-field-schema-utils");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey|authorization|bearer)/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node validate-yap-graph.js <app.yap|decoded-data.json> --mode <compatibility|generator> [--stage <draft|final>] [--json report.json] [--md report.md]",
    "",
    "Examples:",
    "  node validate-yap-graph.js \"./Procurement Management.yap\" --mode compatibility",
    "  node validate-yap-graph.js ./generated-app.decoded.json --mode generator --stage draft --json ./graph.json --md ./graph.md",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, mode: "generator", stage: "final", json: null, md: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--mode") args.mode = argv[++i];
    else if (arg === "--stage") args.stage = argv[++i];
    else if (arg === "--json") args.json = argv[++i];
    else if (arg === "--md") args.md = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !["compatibility", "generator"].includes(args.mode) || !["draft", "final"].includes(args.stage)) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function redactDetails(value) {
  if (Array.isArray(value)) return value.map(redactDetails);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redactDetails(child);
  }
  return out;
}

function addIssue(report, level, code, message, details = {}) {
  const entry = { code, message, ...redactDetails(details) };
  if (level === "error") report.errors.push(entry);
  else if (level === "dependency") report.dependencies.push(entry);
  else report.warnings.push(entry);
}

function strictLevel(report, compatibilityLevel = "warning") {
  if (report.mode === "generator" && report.stage === "final") return "error";
  if (report.mode === "generator" && report.stage === "draft") return compatibilityLevel === "error" ? "warning" : compatibilityLevel;
  return compatibilityLevel;
}

function unresolvedLevel(report) {
  if (report.mode === "generator" && report.stage === "final") return "error";
  if (report.mode === "generator" && report.stage === "draft") return "dependency";
  return "dependency";
}

function tryParseJson(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeInput(inputPath, report) {
  let raw;
  try {
    raw = fs.readFileSync(inputPath, "utf8");
  } catch (error) {
    addIssue(report, "error", "INPUT_READ_FAILED", "Input could not be read.", { input: inputPath, error: error.message });
    return null;
  }

  let parsed;
  try {
    parsed = parseJsonPreservingLargeInts(raw, report._largeNumbers);
  } catch (error) {
    addIssue(report, "error", "INPUT_JSON_INVALID", "Input is not valid JSON.", { input: inputPath, error: error.message });
    return null;
  }

  if (parsed && typeof parsed.Resource === "string") {
    if (!parsed.Resource.startsWith(GZIP_PREFIX)) {
      addIssue(report, "error", "RESOURCE_PREFIX_MISSING", `Wrapped .yap Resource must start with ${GZIP_PREFIX}.`);
      return null;
    }
    let resourceText;
    try {
      resourceText = zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
    } catch (error) {
      addIssue(report, "error", "RESOURCE_DECODE_FAILED", "Resource base64/gzip decode failed.", { error: error.message });
      return null;
    }
    let resource;
    try {
      resource = parseJsonPreservingLargeInts(resourceText, report._largeNumbers);
    } catch (error) {
      addIssue(report, "error", "RESOURCE_JSON_INVALID", "Decoded Resource JSON is invalid.", { error: error.message });
      return null;
    }
    if (typeof resource.Data !== "string") {
      addIssue(report, "error", "RESOURCE_DATA_MISSING", "Decoded Resource.Data must be a JSON string.");
      return null;
    }
    let data;
    try {
      data = parseJsonPreservingLargeInts(resource.Data, report._largeNumbers);
    } catch (error) {
      addIssue(report, "error", "RESOURCE_DATA_JSON_INVALID", "Resource.Data JSON is invalid.", { error: error.message });
      return null;
    }
    report.inputType = "wrapped-yap";
    return { wrapper: parsed, resource, data };
  }

  if (parsed && typeof parsed.Data === "string" && (parsed.MainListType !== undefined || parsed.AppID !== undefined || parsed.ReplaceIds !== undefined)) {
    let data;
    try {
      data = parseJsonPreservingLargeInts(parsed.Data, report._largeNumbers);
    } catch (error) {
      addIssue(report, "error", "RESOURCE_DATA_JSON_INVALID", "Decoded Resource.Data JSON is invalid.", { error: error.message });
      return null;
    }
    report.inputType = "decoded-resource-json";
    return { wrapper: null, resource: parsed, data };
  }

  report.inputType = "decoded-data-json";
  return { wrapper: null, resource: null, data: parsed };
}

function listIdOf(item) {
  return safeString(item && item.ListModel && item.ListModel.ListID);
}

function listSetIdOf(item, rootListSetId) {
  const list = item && item.ListModel ? item.ListModel : {};
  const candidates = [list.ListSetID, list.ListSetId, list.ListSiteID, list.CustomType, rootListSetId];
  for (const candidate of candidates) {
    const match = safeString(candidate).match(/\d{12,}/);
    if (match) return match[0];
  }
  return "";
}

function classifyListResource(item, isRoot = false) {
  const list = item && item.ListModel ? item.ListModel : {};
  const type = Number(list.Type);
  if (isRoot || type === 1024) return "app";
  if (type === 16) return "documentLibrary";
  if (type === 32) return "formReportResource";
  if (type === 64) return "dataReportResource";
  if (type === 1) return "dataList";
  return "unknownResource";
}

function isDocumentLibraryOnlyPackage(data) {
  const children = asArray(data && data.Childs);
  return children.length > 0 && children.every((child) => classifyListResource(child) === "documentLibrary");
}

function nodeLabel(value, fallback) {
  return safeString(value) || fallback;
}

function makeNode(id, type, label, meta = {}) {
  return { id, type, label: nodeLabel(label, id), ...redactDetails(meta) };
}

function addNode(graph, node) {
  if (!node || !node.id) return;
  if (!graph._nodeIds.has(node.id)) {
    graph._nodeIds.add(node.id);
    graph.nodes.push(node);
  }
}

function addEdge(graph, edge) {
  if (!edge || !edge.from || !edge.to) return;
  const key = `${edge.from}\u0000${edge.to}\u0000${edge.type}\u0000${edge.label || ""}\u0000${edge.path || ""}`;
  if (!graph._edgeIds.has(key)) {
    graph._edgeIds.add(key);
    graph.edges.push(redactDetails(edge));
  }
}

function fieldKeys(field) {
  return [
    field.FieldName,
    field.InternalName,
    field.DisplayName,
    field.FieldID,
    field.Name,
  ].map(safeString).filter(Boolean);
}

function getFieldRecord(context, listId, key) {
  const fields = context.fieldsByList.get(safeString(listId));
  if (!fields || key === undefined || key === null || key === "") return null;
  return fields.get(safeString(key)) || null;
}

function addUnresolvedNode(context, type, targetId, label) {
  if (targetId) context.unresolvedTargets.add(String(targetId));
  const id = `unresolved:${type}:${safeString(targetId) || "unknown"}`;
  addNode(context.graph, makeNode(id, "unresolved", label || id, { targetId: safeString(targetId) || null }));
  return id;
}

function reportMissingReference(context, code, message, details = {}) {
  context.report.summary.unresolvedEdges += 1;
  addIssue(context.report, unresolvedLevel(context.report), code, message, details);
}

function decodeMaybeBase64Json(value) {
  if (!value) return null;
  if (isObject(value)) return value;
  if (typeof value !== "string") return null;
  const candidates = [value];
  try {
    candidates.push(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    // Ignore.
  }
  for (const candidate of candidates) {
    if (!candidate || !candidate.trim().startsWith("{")) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

function shapeType(shape) {
  return shape && shape.stencil && (shape.stencil.id || shape.stencil) || shape && shape.type || "unknown";
}

function shapeId(shape) {
  return safeString(shape && (shape.resourceid || shape.resourceId || shape.id));
}

function refId(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return safeString(ref.resourceid || ref.resourceId || ref.id);
}

function collectShapes(def) {
  const out = [];
  function visit(nodes) {
    for (const node of asArray(nodes)) {
      out.push(node);
      if (node.childshapes) visit(node.childshapes);
    }
  }
  visit(def && def.childshapes);
  return out;
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function walkControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  visitor(control, pointer);
  for (const key of ["children", "columns"]) {
    if (Array.isArray(control[key])) control[key].forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`));
  }
}

function extractLargeIds(value) {
  const found = new Set();
  walk(value, (node) => {
    if (typeof node === "string") {
      const matches = node.match(/\d{16,}/g);
      if (matches) matches.forEach((item) => found.add(item));
    }
  });
  return [...found];
}

function buildContext(report, resource, data) {
  const graph = { nodes: [], edges: [], _nodeIds: new Set(), _edgeIds: new Set() };
  const context = {
    report,
    resource,
    data,
    graph,
    listsById: new Map(),
    fieldsByList: new Map(),
    aiResourcesById: buildAiResourcesById(data),
    localIds: new Set(),
    replaceIds: new Set(asArray(resource && resource.ReplaceIds).map(String)),
    unresolvedTargets: new Set(),
    listDependencyEdges: [],
  };
  report.summary.replaceIds = context.replaceIds.size;
  return context;
}

function validate(inputPath, mode, stage) {
  const report = {
    status: "pass",
    mode,
    stage,
    errors: [],
    warnings: [],
    dependencies: [],
    graph: { nodes: [], edges: [] },
    summary: {
      nodes: 0,
      edges: 0,
      lists: 0,
      documentLibraries: 0,
      fields: 0,
      approvalForms: 0,
      scheduledWorkflows: 0,
      listWorkflows: 0,
      reports: 0,
      dashboards: 0,
      agents: 0,
      connections: 0,
      lookups: 0,
      contentListEdges: 0,
      queryDataEdges: 0,
      unresolvedEdges: 0,
      cycles: 0,
      workflowActionConfig: {
        checkedNodes: 0,
        supportedNodes: 0,
        unsupportedNodes: 0,
        partialNodes: 0,
        unsafeNodes: 0,
      },
    },
    _largeNumbers: new Set(),
    _controlFieldSchemas: loadControlFieldSchemas(__dirname),
  };

  const decoded = decodeInput(inputPath, report);
  if (!decoded) return finish(report);
  const { resource, data } = decoded;
  const context = buildContext(report, resource, data);

  validateBasicStructure(context);
  inventoryResources(context);
  addRootNavigationEdges(context);
  addLookupEdgesFromFields(context);
  addFormsAndWorkflowEdges(context);
  addReportDashboardModuleEdges(context);
  validateReplaceIdsAndPlaceholders(context, decoded);
  detectListCycles(context);

  if (report._largeNumbers.size) {
    addIssue(report, "warning", "LARGE_NUMERIC_IDS", "Large numeric IDs were preserved as strings.", { count: report._largeNumbers.size });
  }

  report.graph = { nodes: context.graph.nodes, edges: context.graph.edges };
  report.summary.nodes = context.graph.nodes.length;
  report.summary.edges = context.graph.edges.length;
  return finish(report);
}

function addRootNavigationEdges(context) {
  const root = context.data && context.data.Item && context.data.Item.ListModel ? context.data.Item.ListModel : {};
  const rootId = safeString(root.ListID);
  const appNodeId = rootId ? `app:${rootId}` : null;
  const documentLibraryOnlyPackage = isDocumentLibraryOnlyPackage(context.data);
  const layoutView = tryParseJson(root.LayoutView);
  if (!layoutView) {
    addIssue(context.report, strictLevel(context.report), "ROOT_LAYOUTVIEW_INVALID", "Root app/ListSet LayoutView must be parseable JSON navigation metadata.");
    return;
  }
  const rootPageLayouts = new Map();
  for (const layout of asArray(context.data && context.data.Item && context.data.Item.Layouts)) {
    if (safeString(layout.Type) !== "103") continue;
    const layoutId = safeString(layout.LayoutID);
    if (!layoutId) continue;
    rootPageLayouts.set(layoutId, layout);
    addNode(context.graph, makeNode(`page:${layoutId}`, "appPage", safeString(layout.Title || layoutId), {
      listId: rootId || null,
      layoutId,
      appId: root.AppID || null,
    }));
  }
  if (!rootPageLayouts.size) {
    addIssue(
      context.report,
      documentLibraryOnlyPackage ? "warning" : strictLevel(context.report),
      "ROOT_APP_PAGE_LAYOUT_MISSING",
      "Root app/ListSet has no Type 103 app page layout. Document-library-only exports can omit root pages; richer generated apps usually need an openable app shell.",
    );
  }
  const navItems = flattenNavigationItems(layoutView.sort || []);
  if (!navItems.length) {
    addIssue(
      context.report,
      documentLibraryOnlyPackage ? "warning" : strictLevel(context.report),
      "ROOT_NAVIGATION_EMPTY",
      "Root app/ListSet LayoutView.sort is empty. The minimal Document Library Sample export uses only {sortVer:1}; richer generated apps usually need navigation entries.",
    );
    return;
  }
  const formKeys = new Set(asArray(context.data && context.data.Forms).map((form) => safeString(form.Key || form.FlowKey || form.key)).filter(Boolean));
  for (const item of navItems) {
    const type = safeString(item.Type);
    const listId = safeString(item.ListID);
    if (!appNodeId || type === "process" || listId.startsWith("/p/")) continue;
    if (type === "103") {
      if (rootPageLayouts.has(listId)) {
        addEdge(context.graph, { from: appNodeId, to: `page:${listId}`, type: "rootNavigation", label: item.Title || "app page navigation", navType: type });
      } else {
        const unresolved = addUnresolvedNode(context, "navigation", listId, `Unresolved app page ${listId}`);
        addEdge(context.graph, { from: appNodeId, to: unresolved, type: "rootNavigationUnresolved", label: item.Title || "app page navigation", navType: type });
        reportMissingReference(context, "ROOT_NAV_PAGE_REFERENCE_UNRESOLVED", "Root navigation item references a missing Type 103 app page layout.", { title: item.Title, type: item.Type, listId });
      }
    } else if (["1", "16", "32", "64"].includes(type)) {
      if (context.listsById.has(listId)) {
        addEdge(context.graph, { from: appNodeId, to: `list:${listId}`, type: "rootNavigation", label: item.Title || "navigation", navType: type });
      } else {
        const unresolved = addUnresolvedNode(context, "navigation", listId, `Unresolved navigation target ${listId}`);
        addEdge(context.graph, { from: appNodeId, to: unresolved, type: "rootNavigationUnresolved", label: item.Title || "navigation", navType: type });
        reportMissingReference(context, "ROOT_NAV_LIST_REFERENCE_UNRESOLVED", "Root navigation item references a missing list/page resource.", { title: item.Title, type: item.Type, listId });
      }
    } else if (type === "105") {
      if (formKeys.has(listId)) {
        addEdge(context.graph, { from: appNodeId, to: `form:${listId}`, type: "rootNavigation", label: item.Title || "form navigation", navType: type });
      } else {
        const unresolved = addUnresolvedNode(context, "form", listId, `Unresolved navigation form ${listId}`);
        addEdge(context.graph, { from: appNodeId, to: unresolved, type: "rootNavigationUnresolved", label: item.Title || "form navigation", navType: type });
        reportMissingReference(context, "ROOT_NAV_FORM_REFERENCE_UNRESOLVED", "Root navigation item references a missing approval/form key.", { title: item.Title, formKey: listId });
      }
    }
  }
}

function flattenNavigationItems(items) {
  const out = [];
  for (const item of asArray(items)) {
    if (!item || typeof item !== "object") continue;
    if (Array.isArray(item.list)) out.push(...flattenNavigationItems(item.list));
    else out.push(item);
  }
  return out;
}

function validateBasicStructure(context) {
  const { data, resource, report } = context;
  if (!isObject(data)) {
    addIssue(report, "error", "DATA_NOT_OBJECT", "Decoded Resource.Data must be an object.");
    return;
  }
  if (!isObject(data.Item)) addIssue(report, "error", "DATA_ITEM_MISSING", "Data.Item is required.");
  if (!Array.isArray(data.Childs)) addIssue(report, "error", "DATA_CHILDS_NOT_ARRAY", "Data.Childs must be an array.");
  if (data.Forms !== undefined && data.Forms !== null && !Array.isArray(data.Forms)) addIssue(report, "error", "DATA_FORMS_NOT_ARRAY", "Data.Forms must be an array when present.");
  for (const key of ["OtherModules", "FormReports", "DataReports", "FormNewReports", "AppGroups", "AppThemes"]) {
    if (data[key] !== undefined && data[key] !== null && !Array.isArray(data[key])) {
      addIssue(report, "error", `${key.toUpperCase()}_NOT_ARRAY`, `Data.${key} must be an array when present.`);
    }
  }
  if (resource && !Array.isArray(resource.ReplaceIds)) addIssue(report, "error", "REPLACEIDS_NOT_ARRAY", "Resource.ReplaceIds must be an array.");
  if (resource && isDocumentLibraryOnlyPackage(data) && resource.SimplePortal !== null) {
    addIssue(report, "warning", "DOCUMENT_LIBRARY_SIMPLEPORTAL_NOT_NULL", "Known-good document-library exports use Resource.SimplePortal = null. Generated [] wrappers failed Yeeflow create in v1/v2.", { simplePortalType: Array.isArray(resource.SimplePortal) ? "array" : typeof resource.SimplePortal });
  }
}

function inventoryResources(context) {
  const { data, resource, graph, listsById, fieldsByList, localIds, report } = context;
  const rootItem = data && data.Item;
  const rootList = rootItem && rootItem.ListModel ? rootItem.ListModel : {};
  const rootListSetId = safeString((resource && (resource.ListSetID || resource.ListSetId)) || rootList.ListID);
  const items = [rootItem, ...asArray(data && data.Childs)].filter(Boolean);

  items.forEach((item, index) => {
    const isRoot = index === 0;
    if (!isObject(item) || !isObject(item.ListModel)) return;
    const list = item.ListModel;
    const listId = listIdOf(item);
    const title = safeString(list.Title || list.Name);
    const resourceType = classifyListResource(item, isRoot);
    const listSetId = listSetIdOf(item, rootListSetId);
    if (listId) {
      listsById.set(listId, { item, title, listId, listSetId, resourceType, isRoot });
      localIds.add(listId);
      addNode(graph, makeNode(`${resourceType === "app" ? "app" : "list"}:${listId}`, resourceType, title || listId, {
        listId,
        listSetId,
        appId: list.AppID || resource && resource.AppID || null,
      }));
      if (resourceType === "dataList") report.summary.lists += 1;
      if (resourceType === "documentLibrary") {
        report.summary.documentLibraries += 1;
        addIssue(report, "dependency", "DOCUMENT_LIBRARY_RESOURCE", "Document library resource present; validate Type 16 fields, views, forms, folder behavior, and upload behavior before runtime claims.", { title, listId });
      }
      if (resourceType === "dataReportResource" || resourceType === "formReportResource") report.summary.reports += 1;
    } else if (report.mode === "generator" && report.stage === "final") {
      addIssue(report, "error", "RESOURCE_LISTID_MISSING", "Resource ListID is missing.", { title, index });
    }

    const fieldMap = new Map();
    asArray(item.Defs).forEach((field) => {
      const fieldId = safeString(field.FieldID);
      const fieldName = safeString(field.FieldName);
      const label = safeString(field.DisplayName || fieldName || fieldId);
      if (fieldId) localIds.add(fieldId);
      for (const key of fieldKeys(field)) fieldMap.set(key, field);
      if (!isRoot && resourceType === "dataList" && fieldName === "Title" && (field.Status !== 0 || field.IsSystem !== true || field.IsIndex !== true)) {
        addIssue(
          report,
          strictLevel(report),
          "DATA_LIST_TITLE_FIELD_NATIVE_METADATA_INVALID",
          "Generated child data lists must preserve Yeeflow's native Title field metadata; otherwise api/crafts/datas/{AppID}/{ListID}/query can fail at runtime.",
          {
            list: title,
            listId,
            fieldId,
            status: field.Status,
            isSystem: field.IsSystem,
            isIndex: field.IsIndex,
            expected: { Status: 0, IsSystem: true, IsIndex: true },
          }
        );
      }
      if (!isRoot && resourceType === "dataList" && fieldName === "Title" && field.FieldIndex !== 0) {
        addIssue(
          report,
          strictLevel(report),
          "DATA_LIST_TITLE_FIELD_NATIVE_FIELDINDEX_INVALID",
          "Generated child data lists must keep the native Title field at FieldIndex 0 for import-safe materialization.",
          {
            list: title,
            listId,
            fieldId,
            fieldIndex: field.FieldIndex,
            expected: { FieldIndex: 0 },
          }
        );
      }
      validateFieldAgainstSchema(field, report._controlFieldSchemas).forEach((schemaIssue) => {
        addIssue(report, "warning", `FIELD_SCHEMA_${schemaIssue.code}`, schemaIssue.message, {
          list: title,
          listId,
          fieldId,
          fieldName: fieldName || null,
          fieldType: field.Type || null,
          ...(schemaIssue.detail || {}),
        });
      });
      if (listId && (fieldName || fieldId)) {
        const nodeId = `field:${listId}:${fieldName || fieldId}`;
        addNode(graph, makeNode(nodeId, "field", label, {
          listId,
          fieldId: fieldId || null,
          fieldName: fieldName || null,
          internalName: field.InternalName || null,
          fieldType: field.FieldType || null,
          controlType: field.Type || null,
        }));
        report.summary.fields += 1;
      }
    });
    if (!isRoot && resourceType === "documentLibrary") {
      for (const fieldName of ["Title", "Text1", "Bigint2", "Text4"]) {
        if (!fieldMap.has(fieldName)) {
          addIssue(report, "warning", "DOCUMENT_LIBRARY_DEFAULT_FIELD_MISSING", "Document library is missing an export-proven default field.", { title, listId, fieldName });
        }
      }
      const upload = fieldMap.get("Text4");
      if (upload && safeString(upload.Type) !== "file-upload") {
        addIssue(report, "warning", "DOCUMENT_LIBRARY_UPLOAD_FIELD_TYPE_UNUSUAL", "Document library Text4 upload field should use the file-upload control type in studied exports.", { title, listId, fieldName: "Text4", controlType: upload.Type || null });
      }
      if (!fieldMap.has("Bigint1")) {
        addIssue(report, "warning", "DOCUMENT_LIBRARY_PARENT_FIELD_MISSING", "Document library exports include Bigint1/ParentID for folder hierarchy support; keep it unless a focused export proves it is optional.", { title, listId });
      }
    }
    if (listId) fieldsByList.set(listId, fieldMap);

    asArray(item.Layouts).forEach((layout) => {
      const layoutId = safeString(layout.LayoutID);
      if (layoutId) localIds.add(layoutId);
      if (Number(layout.Type) === 103) {
        report.summary.dashboards += 1;
        addNode(graph, makeNode(`dashboard:${layoutId || title}`, "dashboard", layout.Title || title || layoutId, { layoutId: layoutId || null, listId: listId || null }));
      } else if (Number(layout.Type) === 1) {
        addNode(graph, makeNode(`customForm:${layoutId || title}`, "customForm", layout.Title || title || layoutId, { layoutId: layoutId || null, listId: listId || null }));
      }
    });
  });
}

function addLookupEdgesFromFields(context) {
  const { listsById, fieldsByList, graph, report } = context;
  for (const [sourceListId, listRecord] of listsById.entries()) {
    const fields = fieldsByList.get(sourceListId);
    if (!fields) continue;
    const seenFields = new Set();
    for (const field of fields.values()) {
      const fieldId = safeString(field.FieldID);
      if (fieldId && seenFields.has(fieldId)) continue;
      if (fieldId) seenFields.add(fieldId);
      const rules = tryParseJson(field.Rules) || {};
      const controlType = safeString(field.Type).toLowerCase();
      if (controlType !== "lookup" && !rules.listid && !rules.listfield && !rules.listsetid) continue;
      report.summary.lookups += 1;
      const sourceFieldNode = `field:${sourceListId}:${field.FieldName || field.FieldID}`;
      const targetListId = safeString(rules.listid || rules.ListID || rules.listId);
      const displayField = safeString(rules.listfield || rules.ListField || rules.displayfield || rules.displayField);
      const edgeMeta = {
        sourceListId,
        sourceField: field.DisplayName || field.FieldName || field.FieldID,
        targetListId,
        displayField: displayField || null,
        multiple: !!(rules.multiple || rules.RelationFieldIsMultiple),
      };
      if (targetListId && listsById.has(targetListId)) {
        addEdge(graph, { from: sourceFieldNode, to: `list:${targetListId}`, type: "lookupTarget", label: "lookup target", ...edgeMeta });
        context.listDependencyEdges.push([sourceListId, targetListId, "lookup"]);
        if (displayField) addLookupDisplayFieldEdge(context, sourceFieldNode, targetListId, displayField, edgeMeta, "$.Item/Childs.Defs.Rules");
        addSearchFieldEdges(context, sourceFieldNode, targetListId, rules, edgeMeta);
      } else if (targetListId) {
        const unresolved = addUnresolvedNode(context, "list", targetListId, `Unresolved lookup target ${targetListId}`);
        addEdge(graph, { from: sourceFieldNode, to: unresolved, type: "lookupTargetUnresolved", label: "lookup target", ...edgeMeta });
        reportMissingReference(context, "LOOKUP_TARGET_UNRESOLVED", "Lookup target list does not resolve inside package.", { list: listRecord.title, field: field.DisplayName || field.FieldName, targetListId });
      } else {
        reportMissingReference(context, "LOOKUP_TARGET_MISSING", "Lookup field is missing target listid.", { list: listRecord.title, field: field.DisplayName || field.FieldName });
      }
    }
  }
}

function addLookupDisplayFieldEdge(context, fromNode, targetListId, displayField, edgeMeta, pathHint) {
  const field = getFieldRecord(context, targetListId, displayField);
  if (field) {
    addEdge(context.graph, {
      from: fromNode,
      to: `field:${targetListId}:${field.FieldName || field.FieldID}`,
      type: "lookupDisplayField",
      label: "lookup display field",
      path: pathHint,
      ...edgeMeta,
    });
  } else {
    const unresolved = addUnresolvedNode(context, "field", `${targetListId}:${displayField}`, `Unresolved lookup display field ${displayField}`);
    addEdge(context.graph, { from: fromNode, to: unresolved, type: "lookupDisplayFieldUnresolved", label: "lookup display field", path: pathHint, ...edgeMeta });
    reportMissingReference(context, "LOOKUP_DISPLAY_FIELD_UNRESOLVED", "Lookup display field does not resolve on target list.", { targetListId, displayField });
  }
}

function addSearchFieldEdges(context, fromNode, targetListId, rules, edgeMeta) {
  const rawSearch = rules.searchfields || rules.searchFields || rules.search_fields || rules.search || [];
  const searchFields = Array.isArray(rawSearch) ? rawSearch : String(rawSearch || "").split(",").map((item) => item.trim()).filter(Boolean);
  for (const searchField of searchFields) {
    const key = safeString(searchField && (searchField.field || searchField.FieldName || searchField.name || searchField));
    if (!key) continue;
    const field = getFieldRecord(context, targetListId, key);
    if (field) {
      addEdge(context.graph, { from: fromNode, to: `field:${targetListId}:${field.FieldName || field.FieldID}`, type: "lookupSearchField", label: "lookup search field", ...edgeMeta });
    } else {
      reportMissingReference(context, "LOOKUP_SEARCH_FIELD_UNRESOLVED", "Lookup search field does not resolve on target list.", { targetListId, searchField: key });
    }
  }
}

function addFormsAndWorkflowEdges(context) {
  const forms = asArray(context.data && context.data.Forms);
  forms.forEach((form, index) => {
    const def = decodeMaybeBase64Json(form.DefResource);
    const formKey = safeString(form.Key || form.DefKey || form.defkey || `form-${index}`);
    const formName = safeString(form.Name || form.Title || formKey);
    const formNodeId = `form:${formKey}`;
    const kind = classifyForm(form, def);
    addNode(context.graph, makeNode(formNodeId, kind, formName, { key: formKey, workflowType: form.WorkflowType || def && def.workflowType || null }));
    if (kind === "approvalForm") context.report.summary.approvalForms += 1;
    else if (kind === "scheduledWorkflow") context.report.summary.scheduledWorkflows += 1;
    else context.report.summary.listWorkflows += 1;
    if (!def) {
      addIssue(context.report, strictLevel(context.report), "FORM_DEFRESOURCE_UNPARSED", "Form/workflow DefResource could not be parsed for graph validation.", { form: formName, key: formKey });
      return;
    }
    const variableKeys = buildVariableKeySet(def);
    addPageEdges(context, formNodeId, formKey, formName, def);
    validateWorkflowActionConfigurations(context, formName, formKey, def);
    addWorkflowShapeEdges(context, formNodeId, formName, formKey, def, variableKeys, kind);
    addApprovalFormLookupControlEdges(context, formNodeId, formName, def, variableKeys);
  });
}

function validateWorkflowActionConfigurations(context, formName, formKey, def) {
  const shapes = collectShapes(def);
  const actionReport = validateWorkflowActionShapes(shapes, {
    mode: context.report.mode,
    stage: context.report.stage,
    pointerForIndex: (index) => `Data.Forms[${formKey}].DefResource.childshapes[${index}]`,
  });
  for (const [key, value] of Object.entries(actionReport.summary)) {
    context.report.summary.workflowActionConfig[key] = (context.report.summary.workflowActionConfig[key] || 0) + value;
  }
  actionReport.issues.forEach((entry) => {
    let level = entry.level;
    if (level === "dependency") level = "dependency";
    else if (level !== "error") level = "warning";
    addIssue(context.report, level, entry.code, entry.message, { form: formName, key: formKey, ...entry });
  });
}

function classifyForm(form, def) {
  const workflowType = Number(form.WorkflowType || def && def.workflowType);
  if (workflowType === 2) return "approvalForm";
  if (workflowType === 3) return "scheduledWorkflow";
  const shapes = collectShapes(def || {});
  if (shapes.some((shape) => shapeType(shape) === "MultiAssignmentTask") && asArray(def && def.pageurls).length) return "approvalForm";
  return "listWorkflow";
}

function buildVariableKeySet(def) {
  const keys = new Set();
  for (const group of ["basic", "listref", "list"]) {
    const vars = def && def.variables && def.variables[group];
    if (Array.isArray(vars)) {
      vars.forEach((item) => {
        for (const key of [item.id, item.name, item.label, item.FieldName, item.fieldName]) {
          if (key !== undefined && key !== null && key !== "") keys.add(String(key));
        }
      });
    } else if (isObject(vars)) {
      Object.entries(vars).forEach(([key, value]) => {
        keys.add(String(key));
        if (isObject(value)) {
          for (const candidate of [value.id, value.name, value.label, value.FieldName, value.fieldName]) {
            if (candidate !== undefined && candidate !== null && candidate !== "") keys.add(String(candidate));
          }
        }
      });
    }
  }
  return keys;
}

function addPageEdges(context, formNodeId, formKey, formName, def) {
  const pageIds = new Set();
  const pageById = new Map();
  asArray(def.pageurls).forEach((page, index) => {
    const pageId = safeString(page.id || page.pageid || page.pageId || page.key || `${formKey}-page-${index}`);
    pageIds.add(pageId);
    pageById.set(pageId, page);
    const pageNodeId = `page:${formKey}:${pageId}`;
    addNode(context.graph, makeNode(pageNodeId, "formPage", page.title || page.name || pageId, { formKey, pageId, pageurl: page.pageurl || page.url || null }));
    addEdge(context.graph, { from: formNodeId, to: pageNodeId, type: "formPage", label: "uses page" });
  });

  const taskUrlRefs = new Set();
  collectShapes(def).forEach((shape) => {
    const props = shape.properties || {};
    for (const key of ["taskurl", "taskUrl", "TaskUrl", "pageurl", "pageUrl"]) {
      const value = safeString(props[key]);
      if (value) taskUrlRefs.add(value);
    }
    const type = shapeType(shape);
    if (type !== "MultiAssignmentTask" && type !== "CandidateTask") return;
    const aliases = ["taskurl", "taskUrl", "TaskUrl"].map((key) => ({ key, value: safeString(props[key]) }));
    const first = aliases.find((entry) => entry.value);
    const node = props.name || shapeId(shape);
    const severity = strictLevel(context.report);
    if (!first) {
      addIssue(context.report, severity, "TASK_PAGE_REFERENCE_MISSING", "Assignment Task / Claim Task nodes must reference a task page before generated import/publish readiness.", { form: formName, key: formKey, node, nodeType: type });
      return;
    }
    if (aliases.some((entry) => entry.value !== first.value)) {
      addIssue(context.report, severity, "TASK_PAGE_REFERENCE_ALIASES_NOT_MIRRORED", "Assignment Task / Claim Task task page references must be mirrored across taskurl, taskUrl, and TaskUrl.", { form: formName, key: formKey, node, nodeType: type, taskurl: props.taskurl || null, taskUrl: props.taskUrl || null, TaskUrl: props.TaskUrl || null });
    }
    const page = pageById.get(first.value);
    if (page && page.pagetype !== 1) {
      addIssue(context.report, severity, "TASK_PAGE_REFERENCE_PAGETYPE_INVALID", "Assignment Task / Claim Task task page references must resolve to a page with outer pagetype = 1.", { form: formName, key: formKey, node, nodeType: type, pageReference: first.value, pagetype: page.pagetype });
    }
    if (props.pagetype !== 1) {
      addIssue(context.report, severity, "TASK_NODE_PAGETYPE_INVALID", "Assignment Task / Claim Task workflow nodes should carry properties.pagetype = 1.", { form: formName, key: formKey, node, nodeType: type, pagetype: props.pagetype });
    }
  });
  for (const ref of taskUrlRefs) {
    if (pageIds.has(ref)) {
      addEdge(context.graph, { from: formNodeId, to: `page:${formKey}:${ref}`, type: "taskPageReference", label: "task page" });
    } else if (!ref.startsWith("http")) {
      reportMissingReference(context, "TASK_PAGE_REFERENCE_UNRESOLVED", "Approval/list workflow task page reference does not resolve to pageurls.", { form: formName, key: formKey, pageReference: ref });
    }
  }
}

function addWorkflowShapeEdges(context, formNodeId, formName, formKey, def, variableKeys, kind) {
  const shapes = collectShapes(def);
  const shapeIds = new Set(shapes.map(shapeId).filter(Boolean));
  let startCount = 0;
  let endCount = 0;
  let rejectEndCount = 0;
  const sequenceEdges = [];

  shapes.forEach((shape) => {
    const type = shapeType(shape);
    const id = shapeId(shape);
    if (type === "StartNoneEvent") startCount += 1;
    if (type === "EndNoneEvent") endCount += 1;
    if (type === "EndRejectEvent") rejectEndCount += 1;
    if (type === "SequenceFlow") {
      const source = refId(shape.source);
      const target = refId(shape.target);
      sequenceEdges.push([source, target]);
      if (source && !shapeIds.has(source)) reportMissingReference(context, "SEQUENCE_SOURCE_UNRESOLVED", "SequenceFlow source does not resolve to a workflow node.", { form: formName, sequenceFlow: id, source });
      if (target && !shapeIds.has(target)) reportMissingReference(context, "SEQUENCE_TARGET_UNRESOLVED", "SequenceFlow target does not resolve to a workflow node.", { form: formName, sequenceFlow: id, target });
    }
    if (type === "ContentList") addContentListEdges(context, formNodeId, formName, shape, variableKeys);
    if (type === "QueryData") addQueryDataEdges(context, formNodeId, formName, shape);
    if (type === "AIAgent" || type === "AIAgentAsk" || type === "AI" || /^AI/i.test(type)) {
      addAiWorkflowEdges(context, formNodeId, formName, shape);
      addIssue(context.report, "dependency", "AI_WORKFLOW_NODE", "Workflow contains AI-related node; validate agent/tool dependencies separately.", { form: formName, nodeType: type, nodeId: id });
    }
    if (/http|api|webhook|connection/i.test(type)) {
      context.report.summary.connections += 1;
      addIssue(context.report, "dependency", "EXTERNAL_ACTION_NODE", "Workflow contains external action/API node; validate connection dependencies separately.", { form: formName, nodeType: type, nodeId: id });
    }
    if (/document|file/i.test(type)) {
      addIssue(context.report, "dependency", "DOCUMENT_WORKFLOW_NODE", "Workflow contains document/file-related node; validate document library/template dependencies separately.", { form: formName, nodeType: type, nodeId: id });
    }
  });

  if (startCount === 0) addIssue(context.report, strictLevel(context.report), "WORKFLOW_START_MISSING", "Workflow graph has no StartNoneEvent.", { form: formName, key: formKey });
  if (endCount === 0 && rejectEndCount === 0) addIssue(context.report, strictLevel(context.report), "WORKFLOW_END_MISSING", "Workflow graph has no end event.", { form: formName, key: formKey });
  if (kind === "approvalForm" && rejectEndCount === 0) {
    addIssue(context.report, context.report.mode === "compatibility" ? "warning" : "warning", "APPROVAL_REJECT_PATH_NOT_DETECTED", "Approval form has no EndRejectEvent detected.", { form: formName, key: formKey });
  }
  if (sequenceEdges.length && !workflowLooksConnected(shapes, sequenceEdges)) {
    addIssue(context.report, strictLevel(context.report, "warning"), "WORKFLOW_GRAPH_DISCONNECTED", "Workflow sequence graph appears disconnected.", { form: formName, key: formKey });
  }
}

function workflowLooksConnected(shapes, edges) {
  const nodes = new Set(shapes.map(shapeId).filter(Boolean).filter((id) => {
    const shape = shapes.find((candidate) => shapeId(candidate) === id);
    return shape && shapeType(shape) !== "SequenceFlow";
  }));
  if (nodes.size <= 1) return true;
  const adjacency = new Map([...nodes].map((id) => [id, new Set()]));
  edges.forEach(([source, target]) => {
    if (adjacency.has(source) && adjacency.has(target)) {
      adjacency.get(source).add(target);
      adjacency.get(target).add(source);
    }
  });
  const visited = new Set();
  for (const first of nodes) {
    if (visited.has(first)) continue;
    const component = new Set([first]);
    const stack = [first];
    visited.add(first);
    while (stack.length) {
      const current = stack.pop();
      for (const next of adjacency.get(current) || []) {
        if (!visited.has(next)) {
          visited.add(next);
          component.add(next);
          stack.push(next);
        }
      }
    }
    const hasEventSource = [...component].some((id) => {
      const shape = shapes.find((candidate) => shapeId(candidate) === id);
      return ["StartNoneEvent", "SignalEvent"].includes(shapeType(shape));
    });
    if (!hasEventSource) return false;
  }
  return true;
}

function addContentListEdges(context, formNodeId, formName, shape, variableKeys) {
  const props = shape.properties || {};
  const listId = safeString(props.listid || props.listId || props.ListID || props.targetListId);
  if (!listId) {
    reportMissingReference(context, "CONTENTLIST_TARGET_MISSING", "ContentList node is missing target list ID.", { form: formName, nodeId: shapeId(shape) });
    return;
  }
  const edgeMeta = { form: formName, nodeId: shapeId(shape), targetListId: listId };
  if (context.listsById.has(listId)) {
    addEdge(context.graph, { from: formNodeId, to: `list:${listId}`, type: "contentListTarget", label: "ContentList target", ...edgeMeta });
    context.report.summary.contentListEdges += 1;
    context.listDependencyEdges.push([`form:${formName}`, listId, "contentList"]);
  } else {
    const unresolved = addUnresolvedNode(context, "list", listId, `Unresolved ContentList target ${listId}`);
    addEdge(context.graph, { from: formNodeId, to: unresolved, type: "contentListTargetUnresolved", label: "ContentList target", ...edgeMeta });
    reportMissingReference(context, "CONTENTLIST_TARGET_UNRESOLVED", "ContentList target list does not resolve inside package.", edgeMeta);
  }

  const mappings = parseContentListMappings(props);
  mappings.forEach((mapping, index) => {
    const targetField = mapping.targetField;
    if (targetField) {
      const field = getFieldRecord(context, listId, targetField);
      if (field) {
        addEdge(context.graph, { from: formNodeId, to: `field:${listId}:${field.FieldName || field.FieldID}`, type: "contentListMapping", label: "maps target field", targetField, nodeId: shapeId(shape) });
      } else {
        reportMissingReference(context, "CONTENTLIST_TARGET_FIELD_UNRESOLVED", "ContentList target field mapping does not resolve.", { form: formName, nodeId: shapeId(shape), listId, targetField, mappingIndex: index });
      }
    }
    for (const variable of mapping.sourceVariables) {
      if (!variableKeys.has(variable) && !isWellKnownExpression(variable)) {
        addIssue(context.report, strictLevel(context.report, "warning"), "CONTENTLIST_SOURCE_VARIABLE_UNRESOLVED", "ContentList mapping source variable/expression was not found in workflow variables.", { form: formName, nodeId: shapeId(shape), sourceVariable: variable, targetField: targetField || null });
      }
    }
  });
}

function parseContentListMappings(props) {
  const out = [];
  const candidates = [
    props.columns,
    props.Columns,
    props.setcolumns,
    props.setColumns,
    props.data,
    props.Data,
    props.mappings,
    props.Mappings,
  ];
  for (const candidate of candidates) {
    const value = typeof candidate === "string" ? tryParseJson(candidate) || candidate : candidate;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const parsed = parseMappingItem(item);
        if (parsed) out.push(parsed);
      });
    } else if (isObject(value)) {
      Object.entries(value).forEach(([key, val]) => {
        const parsed = parseMappingItem({ Column: key, Value: val });
        if (parsed) out.push(parsed);
      });
    }
  }
  return out;
}

function parseMappingItem(item) {
  if (!isObject(item)) return null;
  const targetField = safeString(item.Column || item.column || item.FieldName || item.fieldName || item.Target || item.target || item.name);
  const sourceVariables = new Set();
  walk(item.Value !== undefined ? item.Value : item.value !== undefined ? item.value : item, (node) => {
    if (!isObject(node)) return;
    const exprType = safeString(node.exprType || node.type);
    if (exprType === "variable" && node.id) sourceVariables.add(String(node.id));
    if (node.prop && (node.type === "application" || node.type === "instance")) sourceVariables.add(String(node.prop));
    if (node.func) sourceVariables.add(String(node.func));
  });
  return { targetField, sourceVariables: [...sourceVariables] };
}

function isWellKnownExpression(variable) {
  return /^(now|today|flowNo|flowno|currentUser|currentDate|currentDatetime|instance|application)$/i.test(String(variable));
}

function addQueryDataEdges(context, formNodeId, formName, shape) {
  const props = shape.properties || {};
  const listId = safeString(props.listid || props.listId || props.ListID || props.sourceListId || props.targetListId);
  if (!listId) {
    reportMissingReference(context, "QUERYDATA_TARGET_MISSING", "QueryData node is missing source/target list ID.", { form: formName, nodeId: shapeId(shape) });
    return;
  }
  if (context.listsById.has(listId)) {
    addEdge(context.graph, { from: formNodeId, to: `list:${listId}`, type: "queryDataTarget", label: "QueryData target", form: formName, nodeId: shapeId(shape), targetListId: listId });
    context.report.summary.queryDataEdges += 1;
  } else {
    const unresolved = addUnresolvedNode(context, "list", listId, `Unresolved QueryData target ${listId}`);
    addEdge(context.graph, { from: formNodeId, to: unresolved, type: "queryDataTargetUnresolved", label: "QueryData target", form: formName, nodeId: shapeId(shape), targetListId: listId });
    reportMissingReference(context, "QUERYDATA_TARGET_UNRESOLVED", "QueryData target list does not resolve inside package.", { form: formName, nodeId: shapeId(shape), targetListId: listId });
  }
}

function addAiWorkflowEdges(context, formNodeId, formName, shape) {
  const props = shape.properties || {};
  const agentId = safeString(props.data && props.data.AgentID);
  if (!agentId) {
    reportMissingReference(context, "AI_ACTION_AGENT_REFERENCE_MISSING", "AI Assistant workflow action is missing properties.data.AgentID.", { form: formName, nodeId: shapeId(shape) });
    return;
  }
  const targetNode = `aiResource:${agentId}`;
  if (context.aiResourcesById.has(agentId)) {
    addEdge(context.graph, { from: formNodeId, to: targetNode, type: "aiAssistantAgent", label: "AI Assistant Agent", form: formName, nodeId: shapeId(shape), agentId });
  } else {
    const unresolved = addUnresolvedNode(context, "agent", agentId, `Unresolved AI Agent ${agentId}`);
    addEdge(context.graph, { from: formNodeId, to: unresolved, type: "aiAssistantAgentUnresolved", label: "AI Assistant Agent", form: formName, nodeId: shapeId(shape), agentId });
    reportMissingReference(context, "AI_ACTION_AGENT_REFERENCE_UNRESOLVED", "AI Assistant workflow action references an AI Agent not found in package OtherModules.", { form: formName, nodeId: shapeId(shape), agentId });
  }
}

function buildAiResourcesById(data) {
  const out = new Map();
  for (const module of asArray(data && data.OtherModules)) {
    if (safeString(module.Type) !== "Agents") continue;
    for (const item of asArray(module.Data)) {
      const id = safeString(item && item.ID);
      if (id) out.set(id, item);
    }
  }
  return out;
}

function addApprovalFormLookupControlEdges(context, formNodeId, formName, def, variableKeys) {
  asArray(def.pageurls).forEach((page, pageIndex) => {
    const formdef = page.formdef || page.formDef || page.def || page.FormDef;
    if (!formdef) return;
    asArray(formdef.children).forEach((child, childIndex) => {
      walkControls(child, (control, pointer) => {
        const attrs = control.attrs || {};
        const type = safeString(control.type || control.controlType).toLowerCase();
        const hasLookupAttrs = attrs.listid || attrs.listId || attrs.relationListId || attrs.RelationListId || attrs.listfield;
        if (!type.includes("lookup") && !hasLookupAttrs) return;
        const sourceListId = safeString(attrs.listid || attrs.listId || attrs.relationListId || attrs.RelationListId);
        const displayField = safeString(attrs.listfield || attrs.listField || attrs.displayfield || attrs.displayField);
        const controlNodeId = `control:${page.id || pageIndex}:${control.id || control.binding || `${childIndex}-${pointer}`}`;
        addNode(context.graph, makeNode(controlNodeId, "lookupControl", control.label || control.title || control.binding || control.id || "lookup control", {
          form: formName,
          pageId: page.id || null,
          binding: control.binding || null,
          multiple: !!(attrs.RelationFieldIsMultiple || attrs.multiple),
        }));
        addEdge(context.graph, { from: formNodeId, to: controlNodeId, type: "formControl", label: "contains control" });
        context.report.summary.lookups += 1;
        if (sourceListId && context.listsById.has(sourceListId)) {
          addEdge(context.graph, { from: controlNodeId, to: `list:${sourceListId}`, type: "lookupControlSource", label: "lookup source list", sourceListId, form: formName });
          if (displayField) addLookupDisplayFieldEdge(context, controlNodeId, sourceListId, displayField, { form: formName, sourceListId }, `pageurls[${pageIndex}].formdef${pointer}`);
          addSearchFieldEdges(context, controlNodeId, sourceListId, attrs, { form: formName, sourceListId });
          addLookupAdditionEdges(context, controlNodeId, formName, sourceListId, attrs.addition, variableKeys);
        } else if (sourceListId) {
          const unresolved = addUnresolvedNode(context, "list", sourceListId, `Unresolved lookup control source ${sourceListId}`);
          addEdge(context.graph, { from: controlNodeId, to: unresolved, type: "lookupControlSourceUnresolved", label: "lookup source list", sourceListId, form: formName });
          reportMissingReference(context, "LOOKUP_CONTROL_SOURCE_UNRESOLVED", "Approval form lookup control source list does not resolve inside package.", { form: formName, sourceListId, binding: control.binding || null });
        } else {
          reportMissingReference(context, "LOOKUP_CONTROL_SOURCE_MISSING", "Approval form lookup control is missing source list id.", { form: formName, binding: control.binding || null });
        }
      });
    });
  });
}

function addLookupAdditionEdges(context, controlNodeId, formName, sourceListId, addition, variableKeys) {
  if (!Array.isArray(addition)) return;
  addition.forEach((entry, index) => {
    if (!isObject(entry)) return;
    const sourceCandidates = [
      entry.field,
      entry.fieldName,
      entry.sourceField,
      entry.sourceFieldName,
      entry.source,
      entry.SourceField,
      entry.FieldName,
      entry.FieldID,
      entry.fieldID,
      entry.id,
    ].map(safeString).filter(Boolean);
    const targetCandidates = [
      entry.target,
      entry.targetVariable,
      entry.targetField,
      entry.to,
      entry.value,
      entry.name,
      entry.variable,
      entry.Target,
    ].map(safeString).filter(Boolean);

    let resolvedSource = null;
    for (const candidate of sourceCandidates) {
      const field = getFieldRecord(context, sourceListId, candidate);
      if (field) {
        resolvedSource = field;
        break;
      }
    }
    if (resolvedSource) {
      addEdge(context.graph, { from: controlNodeId, to: `field:${sourceListId}:${resolvedSource.FieldName || resolvedSource.FieldID}`, type: "lookupAdditionalSourceField", label: "additional source field", form: formName, additionIndex: index });
    } else if (sourceCandidates.length && !sourceCandidates.some(isKnownSystemLookupField)) {
      addIssue(context.report, strictLevel(context.report, "warning"), "LOOKUP_ADDITION_SOURCE_FIELD_UNRESOLVED", "Lookup additional field source does not resolve.", { form: formName, sourceListId, sourceCandidates, additionIndex: index });
    }

    for (const target of targetCandidates) {
      if (target && !variableKeys.has(target)) {
        addIssue(context.report, strictLevel(context.report, "warning"), "LOOKUP_ADDITION_TARGET_VARIABLE_UNRESOLVED", "Lookup additional field target variable does not resolve.", { form: formName, targetVariable: target, additionIndex: index });
      }
    }
  });
}

function isKnownSystemLookupField(value) {
  return ["ListDataID", "CreatedBy", "Created", "ModifiedBy", "Modified", "-1", "-2", "-3", "-4", "-5"].includes(String(value));
}

function addReportDashboardModuleEdges(context) {
  addReportEdgesFromArray(context, "DataReports", context.data && context.data.DataReports);
  addReportEdgesFromArray(context, "FormReports", context.data && context.data.FormReports);
  addReportEdgesFromArray(context, "FormNewReports", context.data && context.data.FormNewReports);
  addDashboardEdges(context);
  addOtherModuleEdges(context);
}

function addReportEdgesFromArray(context, key, reports) {
  asArray(reports).forEach((reportItem, index) => {
    const reportId = safeString(reportItem.ReportID || reportItem.ReportId || reportItem.ID || reportItem.Id || reportItem.LayoutID || `${key}-${index}`);
    const reportNodeId = `report:${reportId}`;
    addNode(context.graph, makeNode(reportNodeId, "report", reportItem.Title || reportItem.Name || reportId, { reportCollection: key, reportId }));
    context.report.summary.reports += 1;
    for (const id of extractLargeIds(reportItem)) {
      if (context.listsById.has(id)) {
        addEdge(context.graph, { from: reportNodeId, to: `list:${id}`, type: "reportSource", label: "report source", sourceId: id });
      }
    }
  });
}

function addDashboardEdges(context) {
  const resources = [context.data && context.data.Item, ...asArray(context.data && context.data.Childs)].filter(Boolean);
  const rootPageLayouts = new Set(asArray(context.data && context.data.Item && context.data.Item.Layouts)
    .filter((layout) => Number(layout.Type) === 103)
    .map((layout) => safeString(layout.LayoutID))
    .filter(Boolean));
  resources.forEach((item) => {
    asArray(item.Layouts).forEach((layout) => {
      if (Number(layout.Type) !== 103) return;
      const layoutId = safeString(layout.LayoutID || layout.ID || layout.Title);
      const dashboardNodeId = `dashboard:${layoutId}`;
      for (const lir of asArray(layout.LayoutInResources)) {
        const parsed = tryParseJson(lir.Resource) || lir.Resource;
        for (const id of extractLargeIds(parsed)) {
          if (context.listsById.has(id)) {
            addEdge(context.graph, { from: dashboardNodeId, to: `list:${id}`, type: "dashboardDataSource", label: "dashboard data source", sourceId: id });
          }
        }
        addDashboardPageEdges(context, dashboardNodeId, layout, parsed, rootPageLayouts);
      }
    });
  });
}

function addDashboardPageEdges(context, dashboardNodeId, layout, page, rootPageLayouts) {
  if (!isObject(page)) return;
  const title = layout.Title || safeString(layout.LayoutID);
  walk(page, (node, pointer) => {
    if (!isObject(node)) return;
    const dataList = node.attrs && node.attrs.data && node.attrs.data.list;
    if (dataList && safeString(dataList.ListID)) {
      const listId = safeString(dataList.ListID);
      if (context.listsById.has(listId)) {
        addEdge(context.graph, { from: dashboardNodeId, to: `list:${listId}`, type: "dashboardControlSource", label: "dashboard control data.list", sourceId: listId, pointer, path: pointer });
        if (node.type === "collection") addEdge(context.graph, { from: dashboardNodeId, to: `list:${listId}`, type: "dashboardCollectionSource", label: "dashboard collection data.list", sourceId: listId, pointer, path: pointer });
      }
      else reportMissingReference(context, "DASHBOARD_CONTROL_LIST_REFERENCE_UNRESOLVED", "Dashboard control data.list references a missing list.", { title, pointer, listId });
    }
    const dataForm = node.attrs && node.attrs.data && node.attrs.data.form;
    if (dataForm && safeString(dataForm.ListSetID) && !context.listsById.has(safeString(dataForm.ListSetID))) {
      addIssue(context.report, context.report.mode === "generator" ? "error" : "dependency", "DASHBOARD_FORM_EXTERNAL_LISTSET_REFERENCE", "Dashboard action references a form/listset outside the package.", { title, pointer, listSetId: safeString(dataForm.ListSetID), procKey: safeString(dataForm.ProcKey) });
    }
    const pageRef = node.type === "opendashboard" && node.attrs && node.attrs.data && node.attrs.data.page;
    if (pageRef && safeString(pageRef.PageID)) {
      const pageId = safeString(pageRef.PageID);
      if (rootPageLayouts.has(pageId)) addEdge(context.graph, { from: dashboardNodeId, to: `dashboard:${pageId}`, type: "dashboardActionPage", label: "opendashboard action", pageId, pointer });
      else reportMissingReference(context, "DASHBOARD_ACTION_PAGE_REFERENCE_UNRESOLVED", "Dashboard opendashboard action references a missing Type 103 page.", { title, pointer, pageId });
    }
  });
  asArray(page.exts).forEach((ext, index) => {
    const attr = ext && ext.attr;
    if (!isObject(attr)) return;
    addDashboardListRef(context, dashboardNodeId, title, `$.exts[${index}].attr.ListID`, attr.ListID);
    walk(attr, (node, pointer) => {
      if (!isObject(node)) return;
      addDashboardListRef(context, dashboardNodeId, title, `$.exts[${index}].attr${pointer.slice(1)}.listid`, node.listid);
      addDashboardListRef(context, dashboardNodeId, title, `$.exts[${index}].attr${pointer.slice(1)}.ListID`, node.ListID);
    });
  });
}

function addDashboardListRef(context, dashboardNodeId, title, pointer, value) {
  const listId = safeString(value);
  if (!listId) return;
  if (context.listsById.has(listId)) addEdge(context.graph, { from: dashboardNodeId, to: `list:${listId}`, type: "dashboardConfigSource", label: "dashboard ext data source", sourceId: listId, pointer });
  else reportMissingReference(context, "DASHBOARD_DATA_SOURCE_UNRESOLVED", "Dashboard ext data source ListID/listid does not resolve to a package list or report resource.", { title, pointer, listId });
}

function addOtherModuleEdges(context) {
  asArray(context.data && context.data.OtherModules).forEach((module, index) => {
    const title = safeString(module.Title || module.Name || module.ModuleName || module.Type || `module-${index}`);
    const typeText = `${module.Type || ""} ${title}`.toLowerCase();
    if (safeString(module.Type) === "Agents" && Array.isArray(module.Data)) {
      module.Data.forEach((aiResource, resourceIndex) => {
        const id = safeString(aiResource && aiResource.ID || `module-${index}-${resourceIndex}`);
        const name = safeString(aiResource && aiResource.Name || `AI resource ${resourceIndex + 1}`);
        const isCopilot = Number(aiResource && aiResource.Type) === 1;
        const nodeType = isCopilot ? "copilot" : "agent";
        const nodeId = `aiResource:${id}`;
        addNode(context.graph, makeNode(nodeId, nodeType, name, { moduleIndex: index, resourceIndex, resourceId: id, aiType: aiResource && aiResource.Type !== undefined ? aiResource.Type : null }));
        if (isCopilot) {
          addIssue(context.report, "dependency", "COPILOT_RESOURCE", "Copilot resource present; validate resources, tools, and credential dependencies separately.", { module: title, resource: name, id });
        } else {
          context.report.summary.agents += 1;
          addIssue(context.report, "dependency", "AI_AGENT_RESOURCE", "AI Agent resource present; validate tools, knowledge, and credential dependencies separately.", { module: title, resource: name, id });
        }
        for (const refId of extractLargeIds(aiResource)) {
          if (context.listsById.has(refId)) {
            addEdge(context.graph, { from: nodeId, to: `list:${refId}`, type: "moduleResourceReference", label: "module resource reference", sourceId: refId });
          } else if (context.aiResourcesById.has(refId) && refId !== id) {
            addEdge(context.graph, { from: nodeId, to: `aiResource:${refId}`, type: "connectedAgentReference", label: "connected Agent/Copilot reference", sourceId: refId });
          }
        }
      });
      return;
    }
    let nodeType = "module";
    if (/agent/.test(typeText)) nodeType = "agent";
    else if (/copilot/.test(typeText)) nodeType = "copilot";
    else if (/connection|credential|connector/.test(typeText)) nodeType = "connection";
    else if (/knowledge/.test(typeText)) nodeType = "knowledge";
    const nodeId = `${nodeType}:${safeString(module.ID || module.Id || module.Key || index)}`;
    addNode(context.graph, makeNode(nodeId, nodeType, title, { moduleIndex: index, moduleType: module.Type || null }));
    if (nodeType === "agent") {
      context.report.summary.agents += 1;
      addIssue(context.report, "dependency", "AI_AGENT_RESOURCE", "AI Agent resource present; validate tools, knowledge, and credential dependencies separately.", { module: title });
    } else if (nodeType === "copilot") {
      addIssue(context.report, "dependency", "COPILOT_RESOURCE", "Copilot resource present; validate resources, tools, and credential dependencies separately.", { module: title });
    } else if (nodeType === "connection") {
      context.report.summary.connections += 1;
      addIssue(context.report, "dependency", "CONNECTION_RESOURCE", "Connection/credential-like resource present; raw secret values are redacted.", { module: title });
    } else if (nodeType === "knowledge") {
      addIssue(context.report, "dependency", "KNOWLEDGE_RESOURCE", "Knowledge resource present; validate AI knowledge dependencies separately.", { module: title });
    }
    for (const id of extractLargeIds(module)) {
      if (context.listsById.has(id)) {
        addEdge(context.graph, { from: nodeId, to: `list:${id}`, type: "moduleResourceReference", label: "module resource reference", sourceId: id });
      }
    }
    walk(module, (value, pointer) => {
      if (isObject(value) && Object.keys(value).some((key) => SECRET_KEY_RE.test(key))) {
        addIssue(context.report, "warning", "SECRET_LIKE_MODULE_FIELD_REDACTED", "Sensitive-looking module field detected and redacted in reports.", { module: title, path: pointer });
      }
    });
  });
}

function validateReplaceIdsAndPlaceholders(context, decoded) {
  const { report, replaceIds, localIds } = context;
  const replaceIdArray = asArray(context.resource && context.resource.ReplaceIds).map(String);
  const duplicateReplaceIds = replaceIdArray.filter((id, index) => replaceIdArray.indexOf(id) !== index);
  if (duplicateReplaceIds.length) {
    addIssue(report, strictLevel(report, "warning"), "REPLACEIDS_DUPLICATE", "Resource.ReplaceIds contains duplicate IDs.", { count: new Set(duplicateReplaceIds).size });
  }
  if (!replaceIdArray.length) {
    addIssue(report, strictLevel(report), "REPLACEIDS_EMPTY", "Resource.ReplaceIds is empty or unavailable.");
  }
  const missingLocalIds = [...localIds].filter((id) => LARGE_INTEGER_RE.test(id) && !replaceIds.has(id));
  if (missingLocalIds.length && report.mode === "generator" && report.stage === "final") {
    addIssue(report, "error", "LOCAL_IDS_MISSING_FROM_REPLACEIDS", "Local generated graph IDs are missing from ReplaceIds.", { count: missingLocalIds.length, sample: missingLocalIds.slice(0, 15) });
  } else if (missingLocalIds.length) {
    addIssue(report, "warning", "LOCAL_IDS_MISSING_FROM_REPLACEIDS", "Some local graph IDs are missing from ReplaceIds.", { count: missingLocalIds.length, sample: missingLocalIds.slice(0, 15) });
  }

  const unresolvedIdsInReplaceIds = [...context.unresolvedTargets].filter((id) => replaceIds.has(id));
  if (unresolvedIdsInReplaceIds.length) {
    addIssue(report, strictLevel(report), "UNRESOLVED_EXTERNAL_IDS_IN_REPLACEIDS", "Unresolved external dependency IDs appear in ReplaceIds; external dependency IDs should not be remapped.", { ids: unresolvedIdsInReplaceIds.slice(0, 20), count: unresolvedIdsInReplaceIds.length });
  }

  const placeholderPaths = [];
  walk(decoded, (value, pointer) => {
    if (typeof value === "string" && PLACEHOLDER_RE.test(value)) placeholderPaths.push({ path: pointer, value });
  });
  if (placeholderPaths.length) {
    const level = report.mode === "generator" && report.stage === "final" ? "error" : "warning";
    addIssue(report, level, "UNRESOLVED_PLACEHOLDERS", "Unresolved placeholders remain in package graph.", { count: placeholderPaths.length, sample: placeholderPaths.slice(0, 20) });
  }
}

function detectListCycles(context) {
  const adjacency = new Map();
  for (const [from, to] of context.listDependencyEdges) {
    if (!String(from).match(/^\d+$/) || !String(to).match(/^\d+$/)) continue;
    if (!adjacency.has(from)) adjacency.set(from, new Set());
    adjacency.get(from).add(to);
  }
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  function dfs(node, stack) {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      cycles.push(stack.slice(start).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of adjacency.get(node) || []) dfs(next, stack);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }
  for (const node of adjacency.keys()) dfs(node, []);
  context.report.summary.cycles = cycles.length;
  if (cycles.length) {
    addIssue(context.report, "warning", "DEPENDENCY_CYCLES_DETECTED", "List-level dependency cycles were detected; confirm import/order semantics.", { count: cycles.length, sample: cycles.slice(0, 5) });
  }
}

function finish(report) {
  delete report._largeNumbers;
  delete report._controlFieldSchemas;
  if (report.errors.length) report.status = "fail";
  else if (report.warnings.length || report.dependencies.length) report.status = "pass_with_warnings";
  else report.status = "pass";
  return report;
}

function writeMarkdown(report, outputPath, inputPath) {
  const lines = [];
  lines.push(`# Yeeflow .yap Graph Validation`);
  lines.push("");
  lines.push(`- Input: \`${inputPath}\``);
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Mode: \`${report.mode}\``);
  lines.push(`- Stage: \`${report.stage}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("| --- | ---: |");
  for (const [key, value] of Object.entries(report.summary)) {
    lines.push(`| ${key} | ${value} |`);
  }
  lines.push("");
  writeIssueTable(lines, "Errors", report.errors);
  writeIssueTable(lines, "Warnings", report.warnings);
  writeIssueTable(lines, "Dependencies", report.dependencies);
  lines.push("## Graph Samples");
  lines.push("");
  lines.push(`- Nodes: ${report.graph.nodes.length}`);
  lines.push(`- Edges: ${report.graph.edges.length}`);
  lines.push("");
  lines.push("### First Nodes");
  lines.push("");
  lines.push("| Type | Label | ID |");
  lines.push("| --- | --- | --- |");
  report.graph.nodes.slice(0, 25).forEach((node) => {
    lines.push(`| ${escapeMd(node.type)} | ${escapeMd(node.label)} | \`${escapeMd(node.id)}\` |`);
  });
  lines.push("");
  lines.push("### First Edges");
  lines.push("");
  lines.push("| Type | From | To | Label |");
  lines.push("| --- | --- | --- | --- |");
  report.graph.edges.slice(0, 40).forEach((edge) => {
    lines.push(`| ${escapeMd(edge.type)} | \`${escapeMd(edge.from)}\` | \`${escapeMd(edge.to)}\` | ${escapeMd(edge.label || "")} |`);
  });
  lines.push("");
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
}

function writeIssueTable(lines, title, issues) {
  lines.push(`## ${title}`);
  lines.push("");
  if (!issues.length) {
    lines.push("None.");
    lines.push("");
    return;
  }
  lines.push("| Code | Message |");
  lines.push("| --- | --- |");
  issues.slice(0, 100).forEach((issue) => {
    lines.push(`| \`${escapeMd(issue.code)}\` | ${escapeMd(issue.message)} |`);
  });
  if (issues.length > 100) lines.push(`| ... | ${issues.length - 100} additional entries omitted from Markdown preview. See JSON report. |`);
  lines.push("");
}

function escapeMd(value) {
  return String(value === undefined || value === null ? "" : value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function main() {
  const args = parseArgs(process.argv);
  const report = validate(args.input, args.mode, args.stage);
  const jsonText = `${JSON.stringify(report, null, 2)}\n`;
  if (args.json) fs.writeFileSync(args.json, jsonText);
  if (args.md) writeMarkdown(report, args.md, args.input);
  process.stdout.write(jsonText);
  process.exit(report.status === "fail" ? 1 : 0);
}

if (require.main === module) main();

module.exports = { validate };
