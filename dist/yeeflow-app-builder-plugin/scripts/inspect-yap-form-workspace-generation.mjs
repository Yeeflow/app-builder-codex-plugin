#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const INLINE_WIDTHTYPE = "2";
const SCROLL_OVERFLOWS = new Set(["scroll", "auto"]);
const HIDDEN_OVERFLOWS = new Set(["hidden", "scroll", "auto"]);
const GENERIC_ICON_RE = /(^$|atom|circle|placeholder|default|generic|question|help)/i;
const DESIGNER_RISK_CONTROL_TYPES = new Set(["collection", "dynamic-field"]);
const DESIGNER_SAFE_CONTROL_TYPES = new Set(["section", "section-column", "container", "list", "heading", "text", "icon", "button", "workflowcontrolpanel", "workflowhistory"]);
const HEADING_PLACEHOLDER_RE = /^(here is the title|text|heading|title)$/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-yap-form-workspace-generation.mjs <app.yap|decoded-resource.json> [--out <report.json>]",
    "",
    "Checks YAP approval/form workspace materialization, designer-readable form tree, helper workflow shape, page settings, inline controls, and multi-column overflow.",
    "The checks are scoped structural helpers. validate-yap-graph.js remains authoritative for real approval workflow graph validation.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, out: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") args.out = argv[++index];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let output = "";
  let index = 0;
  let inString = false;
  let escaped = false;
  while (index < jsonText.length) {
    const char = jsonText[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      index += 1;
      continue;
    }
    if (char === "\"") {
      inString = true;
      output += char;
      index += 1;
      continue;
    }
    if (char === "-" || (char >= "0" && char <= "9")) {
      const start = index;
      let end = index;
      if (jsonText[end] === "-") end += 1;
      while (end < jsonText.length && jsonText[end] >= "0" && jsonText[end] <= "9") end += 1;
      if (jsonText[end] === "." || jsonText[end] === "e" || jsonText[end] === "E") {
        while (end < jsonText.length && /[0-9eE+\-.]/.test(jsonText[end])) end += 1;
        output += jsonText.slice(start, end);
      } else {
        const token = jsonText.slice(start, end);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          output += `"${token}"`;
        } else {
          output += token;
        }
      }
      index = end;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}

function parseJson(text, largeNumbers = new Set()) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function tryParseJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !/^[{[]/.test(trimmed)) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function loadPackage(inputPath) {
  const largeNumbers = new Set();
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (parsed?.Resource?.startsWith?.(GZIP_PREFIX)) {
    const body = Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64");
    const resource = parseJson(zlib.gunzipSync(body).toString("utf8"), largeNumbers);
    const app = typeof resource.Data === "string" ? parseJson(resource.Data, largeNumbers) : resource.Data;
    return { wrapper: parsed, resource, app, largeNumbers: [...largeNumbers] };
  }
  const app = typeof parsed?.Data === "string" ? parseJson(parsed.Data, largeNumbers) : parsed;
  return { wrapper: null, resource: parsed?.Data ? parsed : null, app, largeNumbers: [...largeNumbers] };
}

function asString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function isLongNumericString(value) {
  return typeof value === "string" && /^\d{16,}$/.test(value);
}

function attrValue(value) {
  return Array.isArray(value) ? value[1] : value;
}

function controlType(control) {
  return asString(control?.type || control?.controlName || control?.name).toLowerCase();
}

function labelOf(control) {
  return asString(control?.label || control?.name || control?.id || control?.title || control?.attrs?.label);
}

function childrenOf(control) {
  return Array.isArray(control?.children) ? control.children : [];
}

function designerIdOf(control) {
  return asString(control?.id || control?.ID || control?.controlId || control?.controlID);
}

function nativeTextOf(control) {
  return asString(
    attrValue(control?.attrs?.headc?.title?.value)
      ?? attrValue(control?.attrs?.textc?.value)
      ?? attrValue(control?.attrs?.text?.value)
      ?? attrValue(control?.attrs?.content?.value)
      ?? ""
  );
}

function walkControls(control, visit, pointer = "$") {
  if (!control || typeof control !== "object") return;
  visit(control, pointer);
  childrenOf(control).forEach((child, index) => walkControls(child, visit, `${pointer}.children[${index}]`));
}

function allControls(formdef) {
  const controls = [];
  for (const child of formdef?.children || []) walkControls(child, (control, pointer) => controls.push({ control, pointer }));
  return controls;
}

function commonPositionValue(control, key) {
  return attrValue(control?.attrs?.common?.positioning?.[key])
    ?? attrValue(control?.attrs?.common?.[key])
    ?? attrValue(control?.attrs?.style?.[key]);
}

function styleValue(control, key) {
  return attrValue(control?.attrs?.style?.[key])
    ?? attrValue(control?.attrs?.common?.style?.[key]);
}

function isInline(control) {
  const widthtype = commonPositionValue(control, "widthtype");
  return asString(widthtype) === INLINE_WIDTHTYPE;
}

function hasExportControlShape(control) {
  const type = controlType(control);
  if (!type) return false;
  if (/^[A-Z]/.test(asString(control.type))) return false;
  if (!control.attrs || typeof control.attrs !== "object") return false;
  return true;
}

function hasAction(control) {
  const raw = JSON.stringify(control || {});
  return Boolean(control?.actions || control?.action || control?.control_action || control?.attrs?.actions || /formAction|setVariable|set-variable|selected|click|onClick|control_action/i.test(raw));
}

function isExportProvenControl(control) {
  return control?.attrs?.exportProven === true
    || control?.attrs?.exportProven?.[1] === true
    || control?.attrs?.__exportProven === true
    || control?.attrs?.__exportProven?.[1] === true;
}

function formKey(form) {
  return asString(form?.Key || form?.FlowKey || form?.FormKey || form?.ProcCode || "");
}

function parseDefResource(form) {
  const parsed = tryParseJson(form?.DefResource);
  return parsed && typeof parsed === "object" ? parsed : {};
}

function formPageurls(def) {
  return Array.isArray(def?.pageurls) ? def.pageurls : [];
}

function requesterPage(def) {
  return formPageurls(def).find((page) => Number(page?.type) === 1 && Number(page?.pagetype) === 1 && page?.formdef)
    || formPageurls(def).find((page) => page?.formdef)
    || null;
}

function shapeStencil(shape) {
  return asString(shape?.stencil?.id || shape?.type || shape?.shapeType || shape?.eventType || shape?.taskType);
}

function shapeId(shape) {
  return asString(shape?.id || shape?.resourceid || shape?.resourceId);
}

function refId(value) {
  if (typeof value === "object" && value) return asString(value.id || value.resourceid || value.resourceId);
  return asString(value);
}

function taskUrlOf(shape) {
  return asString(shape?.properties?.taskurl || shape?.properties?.taskUrl || shape?.properties?.TaskUrl || shape?.taskurl || shape?.taskUrl || shape?.TaskUrl);
}

function isTaskNode(shape) {
  return /MultiAssignmentTask|CandidateTask/i.test(shapeStencil(shape));
}

function idsInRefs(refs) {
  if (!Array.isArray(refs)) return new Set();
  return new Set(refs.map(refId).filter(Boolean));
}

function pagePaddingZero(formdef) {
  const padding = formdef?.attrs?.container?.padding?.["1"] ?? formdef?.attrs?.container?.padding;
  if (!padding || typeof padding !== "object") return false;
  return ["top", "right", "bottom", "left"].every((key) => Number(padding[key]) === 0);
}

function findWorkspaceShell(formdef) {
  const roots = formdef?.children || [];
  let shell = roots.find((control) => /multi_column_form_workspace_shell|form_workspace_shell|workspace_shell/i.test(labelOf(control)));
  if (shell) return shell;
  for (const root of roots) {
    walkControls(root, (control) => {
      if (!shell && /multi_column_form_workspace_shell|form_workspace_shell|workspace_shell/i.test(labelOf(control))) shell = control;
    });
  }
  if (shell) return shell;
  return roots.find((control) => controlType(control) === "container" && childrenOf(control).filter((child) => controlType(child) === "container").length >= 4) || null;
}

function overflowOf(control) {
  return asString(styleValue(control, "overflow") ?? commonPositionValue(control, "overflow")).toLowerCase();
}

function isColumnPanel(control) {
  return controlType(control) === "container" && /navigation|collection|selected|workspace|attributes|details|panel/i.test(labelOf(control));
}

function inspectChildListData(app, errors) {
  for (const child of app?.Childs || []) {
    const title = asString(child?.ListModel?.Title);
    if (child?.ListModel && child.ListModel.ListType === undefined) {
      errors.push({
        code: "YAP_CHILD_LISTTYPE_MISSING",
        message: `${title || "Child list"} must include ListModel.ListType for export-shaped approval form generation.`,
      });
    }
    const fields = new Set((child?.Defs || []).map((field) => asString(field?.FieldName)).filter(Boolean));
    const listDatas = child?.ListDatas;
    if (Array.isArray(listDatas) || (listDatas && Array.isArray(listDatas?.Datas))) {
      errors.push({
        code: "YAP_LISTDATAS_KEYED_RECORDS_MISSING",
        message: `${title || "Child list"} should store sample rows as a record-id keyed ListDatas object, not an array or ListDatas.Datas wrapper.`,
      });
      continue;
    }
    if (listDatas && typeof listDatas === "object") {
      for (const [rowId, row] of Object.entries(listDatas)) {
        if (!row || typeof row !== "object") continue;
        for (const key of Object.keys(row)) {
          if (["ListDataID", "ID", "id"].includes(key)) continue;
          if (!fields.has(key)) {
            errors.push({
              code: "YAP_LISTDATA_FIELD_UNKNOWN",
              message: `${title || "Child list"} sample row uses a key that does not exist in Defs[].FieldName.`,
              detail: { list: title || null, row: rowId, field: key },
            });
          }
        }
      }
    }
    for (const field of child?.Defs || []) {
      if (field?.Rules !== undefined && typeof field.Rules !== "string") {
        errors.push({
          code: "YAP_FIELD_RULES_NOT_STRING",
          message: `${title || "Child list"} field Rules should use export-style stringified JSON for YAP import compatibility.`,
          detail: { list: title || null, field: field.FieldName || null },
        });
      }
    }
  }
}

function inspectServiceDeskFieldNumbering(app, errors) {
  const tickets = (app?.Childs || []).find((child) => /tickets/i.test(asString(child?.ListModel?.Title)) && !/activit/i.test(asString(child?.ListModel?.Title)));
  const activities = (app?.Childs || []).find((child) => /ticket activit/i.test(asString(child?.ListModel?.Title)));
  if (tickets) {
    const fieldNames = new Set((tickets.Defs || []).map((field) => asString(field?.FieldName)));
    if (fieldNames.has("Text1") || !fieldNames.has("Text2")) {
      errors.push({
        code: "YAP_SERVICE_DESK_FIELD_NUMBERING_DRIFT",
        message: "Service Desk YAP workspace Tickets list should preserve the v8-proven native Title plus Text2... field numbering. Text1 numbering drift caused async import failures.",
      });
    }
  }
  if (activities) {
    const fieldNames = new Set((activities.Defs || []).map((field) => asString(field?.FieldName)));
    if (fieldNames.has("Lookup1") || fieldNames.has("Text1") || !fieldNames.has("Text2")) {
      errors.push({
        code: "YAP_SERVICE_DESK_FIELD_NUMBERING_DRIFT",
        message: "Service Desk YAP workspace Ticket Activities list should preserve the v8-proven native Title plus Text2... field numbering. Lookup1/Text1 drift caused async import failures.",
      });
    }
  }
}

function inspect(inputPath) {
  const { wrapper, resource, app, largeNumbers } = loadPackage(inputPath);
  const errors = [];
  const warnings = [];
  const rootModel = app?.Item?.ListModel || {};
  const replaceIds = Array.isArray(resource?.ReplaceIds)
    ? resource.ReplaceIds.map(asString)
    : Object.keys(resource?.ReplaceIds || {}).map(asString);
  if (!replaceIds.length) {
    errors.push({
      code: "YAP_REPLACEIDS_EMPTY",
      message: "Generated YAP approval/form workspace packages must rebuild non-empty Resource.ReplaceIds from the final decoded package before import.",
    });
  }
  if (rootModel.ListID && !isLongNumericString(rootModel.ListID)) {
    errors.push({
      code: "YAP_LOCAL_ID_SHAPE_INVALID",
      message: "Root app/ListSet ID should be an export-style long numeric string, not a short synthetic ID.",
      path: "Data.Item.ListModel.ListID",
    });
  }
  const layoutView = tryParseJson(rootModel.LayoutView);
  const nav = Array.isArray(layoutView?.sort) ? layoutView.sort : [];
  const navFormKeys = new Set(nav.filter((item) => Number(item?.Type) === 105).map((item) => asString(item.ListID)).filter(Boolean));
  const resourceFormKeys = new Set((resource?.FormKeys || []).map(asString));
  const forms = Array.isArray(app?.Forms) ? app.Forms : [];
  const workspaceForms = forms.filter((form) => Number(form?.WorkflowType) === 2 || navFormKeys.has(formKey(form)) || /workspace|approval|requester/i.test(asString(form?.Name)));

  if (!workspaceForms.length) {
    return {
      input: inputPath,
      status: "not_applicable",
      message: "No YAP approval/form workspace was detected; scoped YAP form-workspace checks were not applied.",
      errors,
      warnings,
      summary: { forms: forms.length, type105NavItems: navFormKeys.size },
      largeNumericIdsPreserved: largeNumbers.length,
      wrapperPresent: Boolean(wrapper),
    };
  }

  inspectChildListData(app, errors);
  inspectServiceDeskFieldNumbering(app, errors);

  for (const form of workspaceForms) {
    const key = formKey(form);
    const def = parseDefResource(form);
    const defKey = asString(def?.defkey || def?.key);
    const page = requesterPage(def);
    const formdef = page?.formdef || {};
    const formPrefix = form?.Name ? `${form.Name}: ` : "";

    if (form.ListID !== 0) errors.push({ code: "YAP_FORM_LISTID_MATERIALIZATION_INVALID", message: `${formPrefix}YAP approval/form workspace should use Data.Forms[].ListID = 0 for Service Desk Pro-style materialization.` });
    if (form.Status !== 1 || form.Deployed !== true) errors.push({ code: "YAP_FORM_STATUS_NOT_PUBLISHED", message: `${formPrefix}Generated approval forms must be published/export-shaped: Status=1 and Deployed=true.`, detail: { status: form.Status, deployed: form.Deployed } });
    const noRule = form.NoRule;
    if (!noRule || typeof noRule !== "object" || Array.isArray(noRule) || typeof noRule.Prefix !== "string" || !noRule.Prefix.includes("{index}") || Number(noRule.CustomLength) < 1 || Number(noRule.AutoIncrement) < 1) {
      errors.push({ code: "YAP_NORULE_INVALID", message: `${formPrefix}Generated approval forms must preserve a valid export-shaped NoRule object.` });
    }
    if (!key || !navFormKeys.has(key)) errors.push({ code: "YAP_FORM_NAV_TYPE105_MISSING", message: `${formPrefix}Root navigation must include a Type 105 form entry pointing to the form key.` });
    if (key && resourceFormKeys.size && !resourceFormKeys.has(key)) errors.push({ code: "YAP_FORM_KEY_MISMATCH", message: `${formPrefix}Form key is not listed in Resource.FormKeys.` });
    if (!key || !defKey || key !== defKey) errors.push({ code: "YAP_FORM_DEFKEY_MISMATCH", message: `${formPrefix}Data.Forms key and embedded DefResource defkey/key must match.` });
    const defMissing = ["name", "title", "workflowType", "AppListSetID", "ProcModelAppID", "ProcModelListID", "ProcModelListSetID", "ext", "lineType", "iconURL", "flowPage", "variables", "graphposition", "graphzoom", "graphver"].filter((field) => def?.[field] === undefined);
    if (defMissing.length) errors.push({ code: "YAP_APPROVAL_DEFRESOURCE_METADATA_INCOMPLETE", message: `${formPrefix}Approval DefResource is missing export-shaped process metadata.`, detail: { missing: defMissing } });

    if (Object.prototype.hasOwnProperty.call(formdef, "controls")) errors.push({ code: "YAP_FORMDEF_CONTROLS_UNSUPPORTED", message: `${formPrefix}Use export-style formdef.children; unsupported formdef.controls can import as a blank designer form.` });
    if (!Array.isArray(formdef?.children) || formdef.children.length === 0) errors.push({ code: "YAP_FORMDEF_CHILDREN_MISSING", message: `${formPrefix}Requester form page must include formdef.children.` });
    if (page?.id !== undefined && typeof page.id !== "string") errors.push({ code: "YAP_PAGEURL_ID_SHAPE_INVALID", message: `${formPrefix}DefResource.pageurls[].id should use the export-observed string ID shape, not numeric IDs.` });
    const controls = allControls(formdef);
    if (!controls.length) errors.push({ code: "YAP_FORM_DESIGNER_READABLE_TREE_MISSING", message: `${formPrefix}Designer-readable export-style control tree is missing.` });
    const designerIds = new Map();
    for (const { control, pointer } of controls) {
      const type = controlType(control);
      const designerId = designerIdOf(control);
      if (!designerId) {
        errors.push({ code: "YAP_FORM_CONTROL_ID_MISSING", message: `${formPrefix}Every generated approval form control must include a unique designer-level id.`, pointer });
        errors.push({ code: "YAP_FORM_DESIGNER_SELECTION_RISK", message: `${formPrefix}Missing designer IDs can cause selecting one control to select many or all controls.`, pointer });
      } else if (designerIds.has(designerId)) {
        errors.push({ code: "YAP_FORM_CONTROL_ID_DUPLICATE", message: `${formPrefix}Generated approval form control IDs must be unique across the form tree.`, pointer, detail: { firstPointer: designerIds.get(designerId) } });
        errors.push({ code: "YAP_FORM_DESIGNER_SELECTION_RISK", message: `${formPrefix}Duplicate designer IDs can cause multi-control selection in designer.`, pointer });
      } else {
        designerIds.set(designerId, pointer);
      }
      if (type && !DESIGNER_SAFE_CONTROL_TYPES.has(type) && !isExportProvenControl(control)) {
        errors.push({ code: "YAP_FORM_DESIGNER_UNPROVEN_CONTROL", message: `${formPrefix}Generated approval form workspaces should use export-proven designer-safe controls only unless another control family has separate proof.`, pointer, detail: { controlType: type } });
        errors.push({ code: "YAP_FORM_DESIGNER_HYDRATION_RISK", message: `${formPrefix}Unproven approval controls can leave the designer blank, loading, or partially hydrated.`, pointer, detail: { controlType: type } });
      }
      if (type === "heading") {
        const native = asString(attrValue(control?.attrs?.headc?.title?.value));
        const label = labelOf(control);
        if (!native) errors.push({ code: "YAP_HEADING_NATIVE_TITLE_MISSING", message: `${formPrefix}Heading controls must populate attrs.headc.title.value, not only label/display metadata.`, pointer });
        else if (HEADING_PLACEHOLDER_RE.test(native)) errors.push({ code: "YAP_HEADING_NATIVE_TITLE_PLACEHOLDER", message: `${formPrefix}Heading controls must not render default placeholder text such as Here is the title.`, pointer });
        if (label && native && label !== native) errors.push({ code: "YAP_CONTROL_LABEL_NATIVE_TEXT_MISMATCH", message: `${formPrefix}Heading label and native title value should stay synchronized.`, pointer });
      }
      if (type === "text") {
        const native = nativeTextOf(control);
        const label = labelOf(control);
        if (!native) errors.push({ code: "YAP_TEXT_NATIVE_VALUE_MISSING", message: `${formPrefix}Text controls must populate export-style native text metadata, not only label/display metadata.`, pointer });
        if (label && native && label !== native) errors.push({ code: "YAP_CONTROL_LABEL_NATIVE_TEXT_MISMATCH", message: `${formPrefix}Text label and native value should stay synchronized.`, pointer });
      }
      if (!hasExportControlShape(control)) {
        errors.push({ code: "YAP_FORM_CONTROL_EXPORT_SHAPE_INVALID", message: `${formPrefix}Control is not in export-style lowercase type/attrs shape.`, pointer });
      }
      if (DESIGNER_RISK_CONTROL_TYPES.has(type) && !isExportProvenControl(control)) {
        errors.push({
          code: "YAP_FORM_DESIGNER_UNPROVEN_CONTROL",
          message: `${formPrefix}Generated ${type} controls are designer-load risks in YAP approval/form workspaces unless copied from an export-proven shape. The successful Service Desk smoke used list/container/heading/icon only.`,
          pointer,
        });
      }
    }

    const shapes = Array.isArray(def?.childshapes) ? def.childshapes : [];
    const starts = shapes.filter((shape) => /StartNoneEvent/i.test(shapeStencil(shape)));
    const ends = shapes.filter((shape) => /EndNoneEvent/i.test(shapeStencil(shape)));
    const taskNodes = shapes.filter(isTaskNode);
    const sequences = shapes.filter((shape) => /SequenceFlow/i.test(shapeStencil(shape)));
    if (!starts.length) errors.push({ code: "YAP_WORKFLOW_START_MISSING", message: `${formPrefix}Workflow helper check expects StartNoneEvent.` });
    if (!sequences.length) errors.push({ code: "YAP_WORKFLOW_SEQUENCE_MISSING", message: `${formPrefix}Workflow helper check expects SequenceFlow links; validate-yap-graph.js is authoritative for graph correctness.` });
    if (!ends.length) errors.push({ code: "YAP_WORKFLOW_END_MISSING", message: `${formPrefix}Workflow helper check expects EndNoneEvent.` });
    const start = starts[0];
    const end = ends[0];
    const startOutgoing = idsInRefs(start?.outgoing);
    const endIncoming = idsInRefs(end?.incoming);
    const linkedSequence = sequences.find((sequence) => startOutgoing.has(shapeId(sequence)) && endIncoming.has(shapeId(sequence)));
    shapes.forEach((shape, shapeIndex) => {
      if (shape.id !== undefined && typeof shape.id !== "string") errors.push({ code: "YAP_CHILD_SHAPE_ID_SHAPE_INVALID", message: `${formPrefix}Workflow childshape id should use export-observed string shape.`, shapeIndex });
      if (shape.resourceid !== undefined && typeof shape.resourceid !== "string") errors.push({ code: "YAP_CHILD_SHAPE_ID_SHAPE_INVALID", message: `${formPrefix}Workflow childshape resourceid should use export-observed string shape.`, shapeIndex });
    });
    if (start && !startOutgoing.size) errors.push({ code: "YAP_WORKFLOW_START_NOT_LINKED", message: `${formPrefix}StartNoneEvent must have outgoing sequence linkage.` });
    if (end && !endIncoming.size) errors.push({ code: "YAP_WORKFLOW_END_NOT_LINKED", message: `${formPrefix}EndNoneEvent must have incoming sequence linkage.` });
    for (const sequence of sequences) {
      if (!refId(sequence?.source) || !refId(sequence?.target)) errors.push({ code: "YAP_WORKFLOW_SEQUENCE_SOURCE_TARGET_MISSING", message: `${formPrefix}SequenceFlow must include source and target references.` });
    }
    if (start && page?.id && taskUrlOf(start) !== asString(page.id)) errors.push({ code: "YAP_WORKFLOW_START_TASKURL_MISSING", message: `${formPrefix}Start task URL fields should point to the requester form page.` });
    else if (start && !taskUrlOf(start)) errors.push({ code: "YAP_WORKFLOW_START_TASKURL_MISSING", message: `${formPrefix}Start task URL fields are missing.` });
    if (start && end && sequences.length && !linkedSequence && !taskNodes.length) {
      errors.push({ code: "YAP_WORKFLOW_SEQUENCE_SOURCE_TARGET_MISSING", message: `${formPrefix}No SequenceFlow links StartNoneEvent to EndNoneEvent for this simple workspace workflow.` });
    } else if (start && end && sequences.length && !linkedSequence && taskNodes.length) {
      warnings.push({
        code: "YAP_WORKFLOW_HELPER_DIRECT_START_END_NOT_APPLICABLE",
        message: `${formPrefix}This helper detected a real approval task branch instead of a minimal StartNoneEvent -> EndNoneEvent graph. Treat validate-yap-graph.js as the authoritative graph validator for this approval workflow.`,
      });
    }

    if (formdef?.attrs?.hideHeader !== true) errors.push({ code: "YAP_FORM_PAGE_HEADER_NOT_HIDDEN", message: `${formPrefix}Workspace-style approval/requester forms should hide the default form header.` });
    if (asString(formdef?.attrs?.container?.cw) !== "2") errors.push({ code: "YAP_FORM_PAGE_WIDTH_NOT_FULL", message: `${formPrefix}Workspace-style forms should use full content width: attrs.container.cw = \"2\".` });
    if (!pagePaddingZero(formdef)) errors.push({ code: "YAP_FORM_PAGE_PADDING_NOT_ZERO", message: `${formPrefix}Workspace-style forms should use zero page padding.` });

    for (const { control, pointer } of controls) {
      const type = controlType(control);
      if (type === "icon" && !isInline(control)) errors.push({ code: "YAP_ICON_WIDTH_NOT_INLINE", message: `${formPrefix}Icon controls must use inline width behavior.`, pointer });
      if ((type === "heading" || type === "text") && !isInline(control)) errors.push({ code: "YAP_TEXT_WIDTH_NOT_INLINE", message: `${formPrefix}Text/heading controls must use inline width behavior.`, pointer });
      if (type === "button" && !isInline(control)) errors.push({ code: "YAP_BUTTON_WIDTH_NOT_INLINE", message: `${formPrefix}Button controls must use inline width behavior.`, pointer });
      if (type === "dynamic-field" && !isInline(control)) errors.push({ code: "YAP_DYNAMIC_FIELD_WIDTH_NOT_INLINE", message: `${formPrefix}Dynamic field controls must use inline width behavior.`, pointer });
      if (["icon", "heading", "text", "button", "dynamic-field"].includes(type) && commonPositionValue(control, "widthtype") === undefined) {
        errors.push({ code: "YAP_CONTROL_WIDTH_BEHAVIOR_MISSING", message: `${formPrefix}Inline-sensitive controls need explicit generated width behavior.`, pointer });
      }
      if (type === "icon") {
        const size = attrValue(control?.attrs?.icon?.size);
        const width = Number(commonPositionValue(control, "width"));
        const height = Number(commonPositionValue(control, "height"));
        const iconName = asString(attrValue(control?.attrs?.icon?.icon) || control?.attrs?.icon?.name || control?.icon);
        if (GENERIC_ICON_RE.test(iconName)) errors.push({ code: "YAP_ICON_CONTEXT_GENERIC", message: `${formPrefix}Icon controls should use contextual icons rather than generic/default symbols.`, pointer });
        if ((Number.isFinite(width) && width > 24) || (Number.isFinite(height) && height > 24)) errors.push({ code: "YAP_ICON_SIZE_LAYOUT_RISK", message: `${formPrefix}Icon controls should be bounded and should not distort multi-column layout.`, pointer });
        if (size && size !== "--sp--s200" && Number(size) !== 16 && Number(size) > 20) errors.push({ code: "YAP_ICON_SIZE_MISMATCH", message: `${formPrefix}Icons in menu/text rows should match nearby text size; 16px is the proven Service Desk smoke size.`, pointer });
      }
    }

    const shell = findWorkspaceShell(formdef);
    if (shell) {
      const shellOverflow = overflowOf(shell);
      if (!HIDDEN_OVERFLOWS.has(shellOverflow) || shellOverflow !== "hidden") errors.push({ code: "YAP_WORKSPACE_SHELL_OVERFLOW_INVALID", message: `${formPrefix}Multi-column workspace shell should use hidden outer overflow.` });
      const directPanels = childrenOf(shell).filter(isColumnPanel);
      const scrollPanels = directPanels.filter((panel) => SCROLL_OVERFLOWS.has(overflowOf(panel)));
      if (directPanels.length >= 3 && scrollPanels.length < directPanels.length) errors.push({ code: "YAP_WORKSPACE_COLUMN_SCROLL_MISSING", message: `${formPrefix}Each workspace column should have its own vertical scroll behavior.` });
      for (const panel of directPanels) {
        const overflow = overflowOf(panel);
        if (!overflow || overflow === "default") errors.push({ code: "YAP_WORKSPACE_PANEL_OVERFLOW_DEFAULT_RISK", message: `${formPrefix}Workspace panels should not rely on Default overflow.`, pointer: labelOf(panel) });
      }
      let scrollRegionCount = 0;
      walkControls(shell, (control) => {
        if (SCROLL_OVERFLOWS.has(overflowOf(control))) scrollRegionCount += 1;
      });
      if (scrollRegionCount < 4) errors.push({ code: "YAP_WORKSPACE_SCROLL_REGION_MISSING", message: `${formPrefix}Multi-column workspace should include scroll regions for panel bodies or columns.` });
    } else {
      errors.push({ code: "YAP_WORKSPACE_SHELL_OVERFLOW_INVALID", message: `${formPrefix}Workspace shell was not found, so overflow rules cannot be verified.` });
      errors.push({ code: "YAP_WORKSPACE_SCROLL_REGION_MISSING", message: `${formPrefix}Workspace scroll regions were not found.` });
    }
  }

  const titleField = (app?.Childs || []).flatMap((child) => child?.Defs || []).find((field) => field?.FieldName === "Title" && field?.InternalName === "Title");
  if (titleField) {
    warnings.push({
      code: "YAP_NATIVE_TITLE_SCHEMA_CONFLICT",
      message: "Canonical YAP schema currently requires digit-suffixed FieldName, but runtime-safe native Title uses FieldName/InternalName Title. Preserve runtime-safe Title and track schema update separately.",
    });
  }

  return {
    input: inputPath,
    status: errors.length ? "fail" : warnings.length ? "pass_with_warnings" : "pass",
    wrapperPresent: Boolean(wrapper),
    resourcePresent: Boolean(resource),
    summary: {
      appTitle: rootModel.Title || null,
      forms: forms.length,
      workspaceForms: workspaceForms.length,
      type105NavItems: navFormKeys.size,
      errors: errors.length,
      warnings: warnings.length,
    },
    errors,
    warnings,
    largeNumericIdsPreserved: largeNumbers.length,
  };
}

const args = parseArgs(process.argv);
const report = inspect(args.input);
if (args.out) fs.writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.errors.length ? 1 : 0);
