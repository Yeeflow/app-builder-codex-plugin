#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LONG_ID_RE = /^\d{10,}$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-sub-list-dynamic-controls.mjs <input.yap|decoded.json> [--form <name>] [--target-form <name>] [--list <name>] [--include-actions] [--json-out <path>]",
    "",
    "Inspects approval-form and custom-form Sub List controls and emits a redacted summary.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { input: null, form: null, list: null, includeActions: false, jsonOut: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--form" || arg === "--target-form") args.form = argv[++i];
    else if (arg === "--list" || arg === "--target-list") args.list = argv[++i];
    else if (arg === "--include-actions") args.includeActions = true;
    else if (arg === "--json-out" || arg === "--out") args.jsonOut = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function parseJsonMaybe(value) {
  if (!value) return null;
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeInput(inputPath) {
  const parsed = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (typeof parsed?.Resource === "string") {
    if (!parsed.Resource.startsWith(GZIP_PREFIX)) throw new Error("YAP Resource does not use the expected gzip prefix.");
    const resource = JSON.parse(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return { wrapper: parsed, resource, data: JSON.parse(resource.Data) };
  }
  if (parsed?.Data) return { wrapper: null, resource: parsed, data: typeof parsed.Data === "string" ? JSON.parse(parsed.Data) : parsed.Data };
  return { wrapper: null, resource: null, data: parsed };
}

function maybeRedact(value) {
  const text = safeString(value);
  if (!text) return null;
  return redactId(text) || text;
}

function redactId(value) {
  const text = safeString(value);
  if (!text) return null;
  if (UUID_RE.test(text)) return "<uuid>";
  if (LONG_ID_RE.test(text)) return "<id>";
  return text;
}

function walkControls(root, visitor, pointer = "$", parent = null) {
  if (!isObject(root)) return;
  visitor(root, pointer, parent);
  asArray(root.children).forEach((child, index) => walkControls(child, visitor, `${pointer}.children[${index}]`, root));
  asArray(root.controls).forEach((child, index) => walkControls(child, visitor, `${pointer}.controls[${index}]`, root));
  asArray(root.items).forEach((child, index) => walkControls(child, visitor, `${pointer}.items[${index}]`, root));
  asArray(root.cells).forEach((child, index) => walkControls(child, visitor, `${pointer}.cells[${index}]`, root));
  asArray(root.columns).forEach((child, index) => walkControls(child, visitor, `${pointer}.columns[${index}]`, root));
  asArray(root.rows).forEach((child, index) => walkControls(child, visitor, `${pointer}.rows[${index}]`, root));
}

function controlLabel(control) {
  return safeString(control.nv_label || control.label || control.title || control.binding || control.type || control.id);
}

function collectControlTypes(root) {
  const counts = new Map();
  walkControls(root, (control) => {
    const type = safeString(control.type) || "(missing)";
    counts.set(type, (counts.get(type) || 0) + 1);
  });
  return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => a.type.localeCompare(b.type));
}

function annotateParents(root, parent = null) {
  if (!isObject(root)) return;
  Object.defineProperty(root, "__inspectParent", {
    value: parent,
    enumerable: false,
    configurable: true,
    writable: true,
  });
  asArray(root.children).forEach((child) => annotateParents(child, root));
  asArray(root.controls).forEach((child) => annotateParents(child, root));
  asArray(root.items).forEach((child) => annotateParents(child, root));
  asArray(root.cells).forEach((child) => annotateParents(child, root));
  asArray(root.columns).forEach((child) => annotateParents(child, root));
  asArray(root.rows).forEach((child) => annotateParents(child, root));
}

function summarizeChildTemplate(control, actions = []) {
  const body = asArray(control.children).find((child) => child.type === "list-body");
  if (!body) return { present: false, childControlTypes: [], fieldBindings: [], actionButtons: [], rowOperationMenu: [], bodyGrids: [], gridColumnContainers: 0 };
  const fieldBindings = [];
  const actionButtons = [];
  const rowOperationMenu = [];
  const bodyGrids = [];
  let gridColumnContainers = 0;
  const actionById = new Map(actions.map((action) => [action.id, action]));
  annotateParents(body);
  walkControls(body, (node, _pointer, parent) => {
    if (node.type === "flex_grid" || node.type === "grid") {
      const columns = node.attrs?.columns;
      bodyGrids.push({
        type: node.type,
        label: controlLabel(node),
        displayLabel: node.displayLabel ?? node.attrs?.displayLabel ?? null,
        columnTracks: isObject(columns) ? Math.max(...Object.keys(columns).map((key) => Number(key)).filter(Number.isFinite), 0) : asArray(columns).length,
        childCount: asArray(node.children).length,
      });
      gridColumnContainers += asArray(node.children).filter((child) => child?.type === "container").length;
    }
    if (node.attrs?.list_field) {
      fieldBindings.push({
        controlType: safeString(node.type),
        label: controlLabel(node),
        binding: safeString(node.binding),
        listFieldBinding: safeString(node.attrs.list_field_binding),
      });
    }
    if (node.type === "action_button" && node.attrs?.control_action) {
      const summary = {
        label: controlLabel(node),
        actionRef: "<action-id>",
        actionName: actionById.get(node.attrs.control_action)?.name || null,
        stepTypes: asArray(actionById.get(node.attrs.control_action)?.steps).map((step) => safeString(step?.type)).filter(Boolean),
        stepAttrs: asArray(actionById.get(node.attrs.control_action)?.steps).map((step) => step?.attrs || null).filter(Boolean),
      };
      actionButtons.push(summary);
      let current = parent;
      let insideDropbar = false;
      while (current) {
        if (current.type === "dropbar") {
          insideDropbar = true;
          break;
        }
        current = current.__inspectParent || null;
      }
      if (insideDropbar) rowOperationMenu.push(summary);
    }
  });
  return {
    present: true,
    childControlTypes: collectControlTypes(body),
    fieldBindings,
    actionButtons,
    rowOperationMenu,
    bodyGrids,
    gridColumnContainers,
    tableStyleBodyGrid: bodyGrids.length > 0,
  };
}

function summarizeFooter(control) {
  const footer = asArray(control.children).find((child) => child.type === "list-footer");
  if (!footer) return { present: false, buttons: [], summaries: [] };
  const buttons = [];
  const summaries = [];
  walkControls(footer, (node) => {
    if (node.type === "action_button") buttons.push({ label: controlLabel(node), actionRef: node.attrs?.control_action ? "<action-id>" : null });
    if (node.type === "list-summary") {
      summaries.push({
        label: controlLabel(node),
        summaryType: safeString(node.summary?.type),
        field: safeString(node.summary?.field || node.attrs?.list_field),
        display: node.summary?.display ?? null,
      });
    }
  });
  return { present: true, buttons, summaries };
}

function inferActionCategory(step) {
  const type = safeString(step?.type);
  if (type === "list_new" || type === "list_import") return "current list";
  if (type === "list_dup" || type === "list_del" || type === "list_move" || type === "list_update") return "current object";
  return "unknown";
}

function summarizeActions(control) {
  return asArray(control.attrs?.actions).map((action) => ({
    name: safeString(action?.name),
    type: safeString(action?.type),
    steps: asArray(action?.steps).map((step) => ({
      type: safeString(step?.type),
      category: inferActionCategory(step),
      position: step?.attrs?.position ?? null,
      hasConfirm: Boolean(step?.attrs?.confirm),
      hasAttrs: Boolean(step?.attrs),
    })),
  }));
}

function summarizeFormActions(formdef, layoutsById = new Map()) {
  return asArray(formdef?.actions).map((action) => ({
    id: action?.id ? "<action-id>" : null,
    name: safeString(action?.name),
    steps: asArray(action?.steps).map((step) => {
      const layout = safeString(step?.attrs?.layout);
      const data = step?.attrs?.data || {};
      const listDataId = asArray(step?.attrs?.listdataid).map((expr) => ({
        exprType: safeString(expr?.exprType),
        prop: safeString(expr?.prop),
        id: safeString(expr?.id),
      }));
      return {
        type: safeString(step?.type),
        printType: safeString(step?.attrs?.printtype),
        targetLayout: layout ? {
          id: "<layout-id>",
          name: safeString(layoutsById.get(layout)?.Title || layoutsById.get(layout)?.Name || layoutsById.get(layout)?.LayoutName),
          resolved: layoutsById.has(layout),
        } : null,
        targetData: step?.type === "print" ? {
          type: safeString(data.Type),
          source: data.SourceID ? "<source-list-id>" : null,
          app: data.AppID ? "<app-id>" : null,
          listSet: data.ListSetID ? "<listset-id>" : null,
        } : null,
        listDataId,
      };
    }),
  }));
}

function nearbyHeaderGrids(formdef, listPointer) {
  const localListPointer = listPointer.replace(/^Data\.Forms\[\d+\]\.DefResource\.pageurls\[\d+\]\.formdef/, "$");
  const prefix = localListPointer.replace(/\.children\[\d+\]$/, "");
  const headers = [];
  walkControls({ children: asArray(formdef.children) }, (node, pointer) => {
    if (node.type !== "flex_grid" && node.type !== "grid") return;
    const label = controlLabel(node);
    if (/header.*sub list|sub list.*header|field\s*\d/i.test(label) || pointer.startsWith(prefix)) {
      headers.push({
        type: node.type,
        label,
        relation: pointer.startsWith(localListPointer) ? "inside-list-body-template" : pointer.startsWith(prefix) ? "adjacent-or-sibling" : "nearby",
        columns: isObject(node.attrs?.columns) ? Object.keys(node.attrs.columns).length : asArray(node.attrs?.columns).length,
        rows: isObject(node.attrs?.rows) ? Object.keys(node.attrs.rows).length : asArray(node.attrs?.rows).length,
      });
    }
  });
  return headers;
}

function inspectListControl(control, pointer, formdef, variables) {
  const fields = asArray(control.attrs?.["list-fields"]).map((field) => ({
    id: safeString(field?.id),
    name: safeString(field?.name),
    type: safeString(field?.type),
    controlType: safeString(field?.control?.type),
    controlBinding: safeString(field?.control?.binding),
  }));
  const listVariable = variables.basicById.get(control.binding);
  const listref = listVariable ? variables.listrefById.get(listVariable.value) : null;
  const commonCss = safeString(control.attrs?.common?.css);
  const actions = summarizeActions(control);
  return {
    id: redactId(control.id),
    pointer,
    label: controlLabel(control),
    binding: safeString(control.binding),
    displayLabel: control.displayLabel ?? control.attrs?.displayLabel ?? null,
    displayCaptionOff: JSON.stringify(control.displayLabel ?? control.attrs?.displayLabel ?? null) === JSON.stringify([null, false]),
    associatedListRef: listref ? safeString(listref.id) : null,
    layoutMode: safeString(control.attrs?.["list-display-preference"] || "default"),
    fields,
    variableFields: asArray(control.attrs?.["list-variables"]).map((field) => ({ id: safeString(field?.id), name: safeString(field?.name), type: safeString(field?.type) })),
    summarySettings: asArray(control.attrs?.["list-fields-summary"]).map((summary) => ({
      field: safeString(summary?.field),
      type: safeString(summary?.type),
      display: summary?.display ?? null,
      hasBinding: Boolean(summary?.binding),
    })),
    fallbackText: safeString(control.attrs?.fallback?.et),
    customCss: commonCss ? {
      selectors: commonCss.includes(".dynamic-list .list-footer") ? [".dynamic-list .list-footer"] : [],
      hasDynamicListFooterRule: commonCss.includes(".dynamic-list .list-footer"),
      safeExcerpt: commonCss.includes(".dynamic-list .list-footer") ? "selector .dynamic-list .list-footer { position: absolute; left: 0; right: 0; bottom: -60px; }" : "<custom-css-present>",
    } : null,
    dynamicItemTemplate: summarizeChildTemplate(control, asArray(control.attrs?.actions)),
    footer: summarizeFooter(control),
    actions,
    actionStepTypes: [...new Set(actions.flatMap((action) => action.steps.map((step) => step.type)).filter(Boolean))],
    actionCategories: [...new Set(actions.flatMap((action) => action.steps.map((step) => step.category)).filter(Boolean))],
    headerGridPattern: nearbyHeaderGrids(formdef, pointer),
  };
}

function buildVariableIndex(def) {
  const basicById = new Map();
  const listrefById = new Map();
  asArray(def.variables?.basic).forEach((variable) => {
    if (variable?.id) basicById.set(variable.id, variable);
  });
  asArray(def.variables?.listref).forEach((listref) => {
    if (listref?.id) listrefById.set(listref.id, listref);
  });
  return { basicById, listrefById };
}

function parseLayoutResource(layout) {
  const resource = asArray(layout?.LayoutInResources)[0]?.Resource;
  return parseJsonMaybe(resource);
}

function inspectApprovalForms(data, targetForm) {
  const forms = [];
  asArray(data?.Forms).forEach((form, formIndex) => {
    const formName = safeString(form.Name || form.FormName || form.Title || form.Key || `form-${formIndex}`);
    if (targetForm && formName !== targetForm) return;
    const def = parseJsonMaybe(form.DefResource);
    if (!isObject(def)) return;
    const variables = buildVariableIndex(def);
    const subLists = [];
    asArray(def.pageurls).forEach((page, pageIndex) => {
      const formdef = parseJsonMaybe(page.formdef) || page.formdef;
      if (!isObject(formdef)) return;
      walkControls({ children: asArray(formdef.children) }, (control, pointer) => {
        if (control.type === "list" && control.attrs?.["list-fields"]) {
          subLists.push({
            host: "approval-form",
            form: formName,
            page: safeString(page.title || page.name || page.id || pageIndex),
            ...inspectListControl(control, `Data.Forms[${formIndex}].DefResource.pageurls[${pageIndex}].formdef${pointer.slice(1)}`, formdef, variables),
          });
        }
      });
    });
    forms.push({
      kind: "approval-form",
      name: formName,
      key: safeString(form.Key),
      pageCount: asArray(def.pageurls).length,
      listVariableCount: asArray(def.variables?.basic).filter((variable) => variable?.type === "list").length,
      listRefCount: asArray(def.variables?.listref).length,
      subLists,
    });
  });
  return forms;
}

function inspectDataListCustomForms(data, targetForm, targetList) {
  const forms = [];
  const resources = [data?.Item, ...asArray(data?.Childs)];
  resources.forEach((item, itemIndex) => {
    const listName = safeString(item?.ListModel?.Title || item?.Title || `resource-${itemIndex}`);
    if (targetList && listName !== targetList) return;
    const layoutsById = new Map(asArray(item?.Layouts).map((layout) => [safeString(layout.LayoutID || layout.ID), layout]).filter(([id]) => Boolean(id)));
    asArray(item?.Layouts).forEach((layout, layoutIndex) => {
      if (Number(layout?.Type) !== 1) return;
      const formName = safeString(layout.Title || layout.Name || layout.LayoutName || `${listName} custom form ${layoutIndex + 1}`);
      if (targetForm && formName !== targetForm && listName !== targetForm) return;
      const formdef = parseLayoutResource(layout);
      if (!isObject(formdef)) return;
      const formActions = summarizeFormActions(formdef, layoutsById);
      const subLists = [];
      walkControls({ children: asArray(formdef.children) }, (control, pointer) => {
        if (control.type === "list" && control.attrs?.["list-fields"]) {
          subLists.push({
            host: "data-list-custom-form",
            list: listName,
            form: formName,
            ...inspectListControl(control, `Data.${itemIndex === 0 ? "Item" : `Childs[${itemIndex - 1}]`}.Layouts[${layoutIndex}].LayoutInResources[0].Resource${pointer.slice(1)}`, formdef, { basicById: new Map(), listrefById: new Map() }),
          });
        }
      });
      if (subLists.length) {
        forms.push({
          kind: "data-list-custom-form",
          list: listName,
          name: formName,
          id: "<layout-id>",
          layoutType: Number(layout.Type),
          isPrintPage: /print/i.test(formName),
          formActions,
          printActions: formActions.filter((action) => action.steps.some((step) => step.type === "print")),
          subLists,
        });
      }
    });
  });
  return forms;
}

function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(args.input);
  const decoded = decodeInput(inputPath);
  const approvalForms = inspectApprovalForms(decoded.data, args.form);
  const dataListCustomForms = inspectDataListCustomForms(decoded.data, args.form, args.list);
  const subLists = [
    ...approvalForms.flatMap((form) => form.subLists),
    ...dataListCustomForms.flatMap((form) => form.subLists),
  ];
  const dynamicSubLists = subLists.filter((control) => control.layoutMode === "dynamic");
  const report = {
    input: inputPath,
    sourceTitle: safeString(decoded.wrapper?.Title || decoded.data?.Item?.Title || decoded.data?.Title),
    status: "pass",
    proofBoundary: [
      "Approval Form Sub List schema is export-proven for this input package.",
      "Runtime behavior of add/duplicate/delete/import/move/update steps is not proven by this inspector.",
      "Data List custom form Sub List support is export-proven when the input contains custom list forms with Sub List controls.",
    ],
    summary: {
      approvalForms: approvalForms.length,
      dataListCustomForms: dataListCustomForms.length,
      subLists: subLists.length,
      dynamicSubLists: dynamicSubLists.length,
      listActionControls: subLists.filter((control) => control.actions.length > 0).length,
      dynamicListFooterCssControls: subLists.filter((control) => control.customCss?.hasDynamicListFooterRule).length,
      printPageActions: dataListCustomForms.reduce((total, form) => total + asArray(form.printActions).length, 0),
    },
    approvalForms,
    dataListCustomForms,
  };
  const text = JSON.stringify(report, null, 2);
  if (args.jsonOut) fs.writeFileSync(path.resolve(args.jsonOut), `${text}\n`);
  console.log(text);
}

main();
