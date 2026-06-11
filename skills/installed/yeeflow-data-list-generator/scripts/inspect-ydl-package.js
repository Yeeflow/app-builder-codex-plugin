#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey)/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node inspect-ydl-package.js <export.ydl> --json <report.json> --md <report.md>",
    "",
    "Example:",
    "  node inspect-ydl-package.js \"./Portfolio Management.ydl\" --json ./portfolio-inspection.json --md ./portfolio-inspection.md",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, json: null, md: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") args.json = argv[++i];
    else if (arg === "--md") args.md = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.json || !args.md) usage();
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

function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redactSecrets(child);
  }
  return out;
}

function tryParseJson(value) {
  if (typeof value !== "string" || value.trim() === "") return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, value: null, error: error.message };
  }
}

function parseMaybeJson(value) {
  const parsed = tryParseJson(value);
  return parsed.ok ? parsed.value : value;
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  } else if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) walk(child, visitor, `${pointer}.${key}`);
  }
}

function walkControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  visitor(control, pointer);
  for (const childKey of ["children", "columns"]) {
    if (!Array.isArray(control[childKey])) continue;
    control[childKey].forEach((child, index) => walkControls(child, visitor, `${pointer}.${childKey}[${index}]`));
  }
}

function fieldRules(field, warnings, location) {
  if (!field || typeof field.Rules !== "string" || field.Rules.trim() === "") return {};
  const parsed = tryParseJson(field.Rules);
  if (!parsed.ok) {
    warnings.push({
      code: "MALFORMED_RULES_JSON",
      message: `Rules JSON could not be parsed for ${field.DisplayName || field.FieldName || location}`,
      location,
      error: parsed.error,
    });
    return {};
  }
  return redactSecrets(parsed.value);
}

function normalizeType(field, rules = {}) {
  const fieldType = safeString(field.FieldType).toLowerCase();
  const controlType = safeString(field.Type).toLowerCase();
  const combined = `${fieldType} ${controlType}`;

  if (controlType === "lookup" || rules.listid || rules.listsetid || rules.listfield) return "lookup";
  if (controlType === "textarea" || controlType === "richtext") return "longText";
  if (controlType === "checkbox") return "multiChoice";
  if (controlType === "radio" || controlType === "dropdown" || controlType === "select") return "choice";
  if (controlType === "datepicker") return rules.showtime === true || rules.showtime === "true" ? "datetime" : "date";
  if (controlType === "switch" || fieldType === "bit") return "boolean";
  if (controlType === "hyperlink") return "hyperlink";
  if (controlType === "list") return "list";
  if (controlType === "flowstatus") return "flowstatus";
  if (combined.includes("file") || combined.includes("attachment")) return "file";
  if (combined.includes("identity") || combined.includes("user") || combined.includes("person")) return "user";
  if (combined.includes("currency")) return "currency";
  if (combined.includes("percent")) return "percent";
  if (combined.includes("decimal") || combined.includes("number") || combined.includes("int")) return "number";
  if (combined.includes("calculated") || rules.calculated || rules.expression || rules.formula) return "calculated";
  if (combined.includes("datetime")) return "datetime";
  if (combined.includes("date")) return "date";
  if (combined.includes("text") || controlType === "input") return "text";
  return "unknown";
}

function isTruthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function displayTitle(value) {
  if (!value) return "";
  return safeString(value).replace(/\s+/g, " ").trim();
}

function decodeYdl(inputPath) {
  const largeNumbers = new Set();
  const raw = fs.readFileSync(inputPath, "utf8");
  const wrapper = parseJsonPreservingLargeInts(raw, largeNumbers);
  const format = {
    isJson: true,
    topLevelKeys: Object.keys(wrapper),
    hasTitle: Object.prototype.hasOwnProperty.call(wrapper, "Title"),
    hasDescription: Object.prototype.hasOwnProperty.call(wrapper, "Description"),
    hasIconUrl: Object.prototype.hasOwnProperty.call(wrapper, "IconUrl"),
    hasIsListSet: Object.prototype.hasOwnProperty.call(wrapper, "IsListSet"),
    hasResource: typeof wrapper.Resource === "string",
    resourceHasGzipPrefix: typeof wrapper.Resource === "string" && wrapper.Resource.startsWith(GZIP_PREFIX),
  };

  if (!format.hasResource) throw new Error("Top-level Resource field is missing or is not a string");
  if (!format.resourceHasGzipPrefix) throw new Error(`Resource does not start with ${GZIP_PREFIX}`);

  const base64Payload = wrapper.Resource.slice(GZIP_PREFIX.length);
  const compressed = Buffer.from(base64Payload, "base64");
  const resourceText = zlib.gunzipSync(compressed).toString("utf8");
  const resource = parseJsonPreservingLargeInts(resourceText, largeNumbers);
  if (typeof resource.Data !== "string") throw new Error("Decoded Resource.Data is missing or is not a JSON string");
  const data = parseJsonPreservingLargeInts(resource.Data, largeNumbers);

  return { wrapper, resource: redactSecrets(resource), data: redactSecrets(data), format, largeNumbers: [...largeNumbers].sort() };
}

function getMainList(data) {
  return data && data.Item && data.Item.ListModel ? data.Item.ListModel : {};
}

function buildFieldInventory(item, warnings) {
  return asArray(item.Defs).map((field, index) => {
    const rules = fieldRules(field, warnings, `Item.Defs[${index}]`);
    return {
      FieldID: field.FieldID ?? null,
      ListID: field.ListID ?? null,
      FieldName: field.FieldName ?? null,
      InternalName: field.InternalName ?? null,
      DisplayName: field.DisplayName ?? null,
      DisplayName_EN: field.DisplayName_EN ?? null,
      FieldType: field.FieldType ?? null,
      Type: field.Type ?? null,
      DefaultValue: field.DefaultValue ?? null,
      IsSystem: field.IsSystem ?? null,
      IsSort: field.IsSort ?? null,
      IsIndex: field.IsIndex ?? null,
      IsFilter: field.IsFilter ?? null,
      Status: field.Status ?? null,
      Category: field.Category ?? null,
      normalizedType: normalizeType(field, rules),
      Rules: rules,
    };
  });
}

function sampleValueShape(value) {
  if (value === null) return { kind: "null", preview: null };
  if (value === undefined) return { kind: "missing", preview: null };
  if (value === "") return { kind: "emptyString", preview: "" };
  if (Array.isArray(value)) return { kind: "array", preview: JSON.stringify(value).slice(0, 120) };
  if (isObject(value)) return { kind: "object", preview: JSON.stringify(redactSecrets(value)).slice(0, 120) };
  if (typeof value === "boolean") return { kind: "boolean", preview: value };
  if (typeof value === "number") return { kind: "number", preview: value };
  const text = String(value);
  const parsed = tryParseJson(text);
  if (parsed.ok && Array.isArray(parsed.value)) return { kind: "jsonStringArray", preview: text.slice(0, 120) };
  if (parsed.ok && isObject(parsed.value)) return { kind: "jsonStringObject", preview: text.slice(0, 120) };
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { kind: "dateString", preview: text };
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(text)) return { kind: "datetimeString", preview: text };
  if (LARGE_INTEGER_RE.test(text)) return { kind: "largeIdString", preview: text };
  if (/^https?:\/\//i.test(text)) return { kind: "urlString", preview: text.slice(0, 120) };
  if (/^-?\d+(\.\d+)?$/.test(text)) return { kind: "numericString", preview: text };
  return { kind: "string", preview: text.slice(0, 120) };
}

function buildSampleDataInventory(item, fieldsByName) {
  const recordsObject = item.ListDatas || {};
  const recordEntries = Object.entries(recordsObject);
  const valueShapeByField = {};
  const lookupValues = [];
  const multiSelectJsonStringValues = [];
  const dateValues = [];
  const datetimeValues = [];
  const emptyNullPatterns = {};
  const systemFieldsFound = new Set();

  for (const [recordId, record] of recordEntries) {
    if (!isObject(record)) continue;
    for (const [key, value] of Object.entries(record)) {
      const shape = sampleValueShape(value);
      if (!valueShapeByField[key]) {
        const field = fieldsByName.get(key);
        valueShapeByField[key] = {
          fieldName: key,
          displayName: field ? field.DisplayName : null,
          internalName: field ? field.InternalName : null,
          normalizedType: field ? field.normalizedType : null,
          shapes: {},
          examples: [],
        };
      }
      valueShapeByField[key].shapes[shape.kind] = (valueShapeByField[key].shapes[shape.kind] || 0) + 1;
      if (valueShapeByField[key].examples.length < 3 && shape.kind !== "missing") {
        valueShapeByField[key].examples.push({ recordId, value: shape.preview, shape: shape.kind });
      }
      if (shape.kind === "emptyString" || shape.kind === "null") emptyNullPatterns[key] = (emptyNullPatterns[key] || 0) + 1;

      const field = fieldsByName.get(key);
      if (field && isTruthy(field.IsSystem)) systemFieldsFound.add(key);
      if (field && field.normalizedType === "lookup" && value !== "" && value !== null && value !== undefined) {
        lookupValues.push({ recordId, fieldName: key, valueShape: shape.kind, valuePreview: shape.preview });
      }
      if (shape.kind === "jsonStringArray") multiSelectJsonStringValues.push({ recordId, fieldName: key, valuePreview: shape.preview });
      if (shape.kind === "dateString") dateValues.push({ recordId, fieldName: key, value: shape.preview });
      if (shape.kind === "datetimeString") datetimeValues.push({ recordId, fieldName: key, value: shape.preview });
    }
  }

  return {
    sampleRecordCount: recordEntries.length,
    recordIds: recordEntries.slice(0, 50).map(([id]) => id),
    recordIdsTruncated: recordEntries.length > 50,
    systemFieldsFound: [...systemFieldsFound],
    valueShapeByField: Object.values(valueShapeByField),
    lookupValues,
    checkboxOrMultiSelectJsonStringValues: multiSelectJsonStringValues,
    dateValues,
    datetimeValues,
    emptyNullPatterns,
  };
}

function buildLookupInventory(fields, sampleData, sourceListName) {
  const sampleByField = new Map();
  for (const value of sampleData.lookupValues || []) {
    if (!sampleByField.has(value.fieldName)) sampleByField.set(value.fieldName, []);
    sampleByField.get(value.fieldName).push(value);
  }

  return fields
    .filter((field) => field.normalizedType === "lookup")
    .map((field) => {
      const rules = field.Rules || {};
      return {
        sourceList: sourceListName,
        sourceField: field.FieldName,
        sourceDisplayName: field.DisplayName,
        sourceInternalName: field.InternalName,
        targetAppID: rules.appid ?? rules.AppID ?? null,
        targetListSetID: rules.listsetid ?? rules.ListSetID ?? null,
        targetListID: rules.listid ?? rules.ListID ?? null,
        targetDisplayField: rules.listfield ?? rules.displayfield ?? rules.DisplayField ?? null,
        multiple: rules.multiple === true || rules.multiple === "true",
        searchFields: rules.search_fields || rules.searchFields || [],
        filters: rules.filters || rules.filter || rules.query || null,
        sampleValueShapes: (sampleByField.get(field.FieldName) || []).slice(0, 10),
      };
    });
}

function parseLayoutResource(layout, warnings, index) {
  const parsedLayoutView = tryParseJson(layout.LayoutView);
  if (!parsedLayoutView.ok && typeof layout.LayoutView === "string" && layout.LayoutView.trim()) {
    warnings.push({
      code: "MALFORMED_LAYOUT_VIEW_JSON",
      message: `LayoutView JSON could not be parsed for ${layout.Title || layout.LayoutID || index}`,
      location: `Item.Layouts[${index}].LayoutView`,
      error: parsedLayoutView.error,
    });
  }
  const resourceCandidate = layout.LayoutInResources && layout.LayoutInResources[0] && layout.LayoutInResources[0].Resource;
  const parsedResource = tryParseJson(resourceCandidate);
  if (!parsedResource.ok && typeof resourceCandidate === "string" && resourceCandidate.trim()) {
    warnings.push({
      code: "MALFORMED_LAYOUT_RESOURCE_JSON",
      message: `Layout form Resource JSON could not be parsed for ${layout.Title || layout.LayoutID || index}`,
      location: `Item.Layouts[${index}].LayoutInResources[0].Resource`,
      error: parsedResource.error,
    });
  }
  return {
    layoutView: parsedLayoutView.ok ? redactSecrets(parsedLayoutView.value) : null,
    formResource: parsedResource.ok ? redactSecrets(parsedResource.value) : null,
  };
}

function controlType(control) {
  return control.type || control.controlType || control.Type || control.name || null;
}

function controlBinding(control) {
  return control.binding || control.field || control.FieldName || control.valueField || (control.attrs && (control.attrs.binding || control.attrs.field));
}

function buildViewAndFormInventory(item, fieldsByName, warnings) {
  const views = [];
  const customForms = [];

  asArray(item.Layouts).forEach((layout, index) => {
    const { layoutView, formResource } = parseLayoutResource(layout, warnings, index);
    const type = safeString(layout.Type);

    if (type === "1" && formResource) {
      const controls = [];
      const boundFields = new Set();
      const containers = [];
      const grids = [];
      const lookupControls = [];
      const listControls = [];
      const customCodeControls = [];
      const unboundDisplayTextControls = [];

      asArray(formResource.children).forEach((child, childIndex) => {
        walkControls(child, (control, pointer) => {
          const cType = controlType(control);
          const binding = controlBinding(control);
          const label = control.label || control.title || control.name || control.value || null;
          const info = { id: control.id || null, type: cType, label, binding: binding || null, pointer: `children[${childIndex}]${pointer.slice(1)}` };
          controls.push(info);
          if (binding) boundFields.add(binding);
          if (["container", "section", "panel", "div"].includes(safeString(cType))) containers.push(info);
          if (["grid", "flex_grid", "table_grid"].includes(safeString(cType))) grids.push(info);
          if (safeString(cType) === "lookup") lookupControls.push(info);
          if (safeString(cType) === "list") listControls.push(info);
          if (safeString(cType).toLowerCase().includes("code")) customCodeControls.push(info);
          if (!binding && ["text", "heading", "html", "richtext"].includes(safeString(cType))) unboundDisplayTextControls.push(info);
        });
      });

      customForms.push({
        title: layout.Title || formResource.title || null,
        type: layout.Type,
        layoutId: layout.LayoutID || null,
        formJsonParsed: true,
        formTitle: formResource.title || null,
        controlCount: controls.length,
        boundFields: [...boundFields].map((fieldName) => {
          const field = fieldsByName.get(fieldName);
          return {
            fieldName,
            displayName: field ? field.DisplayName : null,
            internalName: field ? field.InternalName : null,
            normalizedType: field ? field.normalizedType : null,
          };
        }),
        containers,
        grids,
        lookupControls,
        listControls,
        customCodeControls,
        unboundDisplayTextControls,
        formJson: formResource,
      });
      return;
    }

    if (layoutView || type !== "1") {
      const visibleColumns = [];
      const hiddenColumns = [];
      const rawLayout = layoutView && Array.isArray(layoutView.layout) ? layoutView.layout : [];
      rawLayout.forEach((column, order) => {
        const field = fieldsByName.get(column.field || column.name || column.FieldName);
        const entry = {
          order,
          fieldName: column.field || column.name || column.FieldName || null,
          title: column.title || column.Title || (field && field.DisplayName) || null,
          hidden: column.hidden === true,
          width: column.width ?? null,
        };
        if (entry.hidden) hiddenColumns.push(entry);
        else visibleColumns.push(entry);
      });

      views.push({
        title: layout.Title || null,
        type: layout.Type ?? null,
        viewTypeNotes: safeString(layout.Type) === "104" ? "Type 104 observed; likely a board/pipeline-style list view, confirm in Yeeflow before generation." : null,
        layoutId: layout.LayoutID || null,
        isDefault: isTruthy(layout.IsDefault),
        displayedColumns: visibleColumns,
        hiddenColumns,
        columnOrder: visibleColumns.map((column) => column.fieldName || column.title).filter(Boolean),
        filters: layoutView ? layoutView.filter || layoutView.query || [] : [],
        sorts: layoutView ? layoutView.sort || [] : [],
        rowColor: layoutView ? layoutView.rowColor || null : null,
        rawLayoutView: layoutView,
      });
    }
  });

  return { views, customForms };
}

function stencilId(node) {
  return node && node.stencil && (node.stencil.id || node.stencil);
}

function extractExpressionFieldRefs(value) {
  const refs = [];
  walk(value, (node) => {
    if (!isObject(node)) return;
    if (node.exprType === "list_field" || node.type === "list_field") {
      refs.push({
        kind: "list_field",
        prop: node.prop || null,
        id: node.id || null,
        name: node.name || null,
      });
    }
    if (node.exprType === "variable" || node.type === "variable") {
      refs.push({
        kind: "variable",
        prop: node.prop || null,
        id: node.id || null,
        name: node.name || null,
      });
    }
  });
  return refs;
}

function buildWorkflowInventory(data) {
  return asArray(data.Forms).map((form, index) => {
    const defText = form.DefResource || form.Def || form.def || null;
    let def = null;
    let parseError = null;
    if (typeof defText === "string") {
      const parsed = tryParseJson(defText);
      if (parsed.ok) def = redactSecrets(parsed.value);
      else parseError = parsed.error;
    }

    const childshapes = def ? asArray(def.childshapes) : [];
    const nodeTypes = {};
    const contentListNodes = [];
    const queryDataNodes = [];
    const aiNodes = [];
    const httpActionNodes = [];
    const fieldsReferenced = new Set();
    const targetListsReferenced = new Set();

    childshapes.forEach((node) => {
      const type = stencilId(node) || "Unknown";
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
      const props = node.properties || {};
      const name = props.name || node.name || type;

      if (type === "ContentList") {
        const listdatas = asArray(props.listdatas);
        const wheres = asArray(props.wheres);
        const refs = extractExpressionFieldRefs({ listdatas, wheres });
        refs.forEach((ref) => {
          if (ref.prop) fieldsReferenced.add(ref.prop);
          if (ref.id) fieldsReferenced.add(ref.id);
        });
        if (props.listid) targetListsReferenced.add(String(props.listid));
        contentListNodes.push({
          name,
          operation: props.type || props.operation || null,
          listtype: props.listtype || null,
          appid: props.appid || null,
          listsetid: props.listsetid || null,
          listid: props.listid || null,
          listdatas,
          wheres,
          expressionRefs: refs,
        });
      }

      if (type === "QueryData") {
        if (props.listid) targetListsReferenced.add(String(props.listid));
        queryDataNodes.push({
          name,
          appid: props.appid || null,
          listsetid: props.listsetid || null,
          listid: props.listid || null,
          filters: props.filters || [],
          sorts: props.sorts || [],
          result: props.result || [],
        });
      }

      if (type === "AI") {
        aiNodes.push({
          name,
          actionName: props.actionname || props.actionName || null,
          agentIds: collectAgentIds(props),
        });
      }

      if (/http|api|webhook/i.test(type) || /http|api|webhook/i.test(name)) {
        httpActionNodes.push({ name, type, properties: redactSecrets(props) });
      }

      extractExpressionFieldRefs(props).forEach((ref) => {
        if (ref.prop) fieldsReferenced.add(ref.prop);
        if (ref.id) fieldsReferenced.add(ref.id);
      });
    });

    return {
      name: form.FlowName || form.Name || form.name || (def && def.name) || null,
      key: form.FlowKey || form.Key || form.key || (def && def.defkey) || null,
      defkey: def ? def.defkey || null : null,
      workflowType: def ? def.workflowType || form.WorkflowType || null : form.WorkflowType || null,
      defResourceParses: Boolean(def),
      defParseError: parseError,
      variablesCount: def && def.variables ? asArray(def.variables.basic).length : 0,
      listrefCount: def && def.variables ? asArray(def.variables.listref).length : 0,
      nodeTypes,
      contentListNodes,
      queryDataNodes,
      aiNodes,
      httpActionNodes,
      fieldsReferenced: [...fieldsReferenced],
      targetListsReferenced: [...targetListsReferenced],
      rawFormIndex: index,
    };
  });
}

function collectAgentIds(value) {
  const ids = new Set();
  walk(value, (node) => {
    if (!isObject(node)) return;
    for (const [key, child] of Object.entries(node)) {
      if (/agent/i.test(key) && (typeof child === "string" || typeof child === "number")) ids.add(String(child));
    }
  });
  return [...ids];
}

function collectWarnings({ inputPath, format, largeNumbers, fields, lookups, views, customForms, workflows, sampleData }) {
  const warnings = [];

  if (largeNumbers.length) {
    warnings.push({
      code: "LARGE_NUMERIC_IDS_PRESERVED",
      message: `${largeNumbers.length} large numeric ID values were detected and preserved as strings.`,
      count: largeNumbers.length,
    });
  }

  if (!format.resourceHasGzipPrefix) {
    warnings.push({ code: "RESOURCE_PREFIX_MISSING", message: "Resource does not use the expected gzip/base64 prefix." });
  }

  for (const field of fields) {
    if (field.normalizedType === "unknown") {
      warnings.push({
        code: "UNKNOWN_FIELD_TYPE",
        message: `Unknown field/control type for ${field.DisplayName || field.FieldName}`,
        fieldName: field.FieldName,
        fieldType: field.FieldType,
        controlType: field.Type,
      });
    }
    if (SECRET_KEY_RE.test(`${field.DisplayName || ""} ${field.InternalName || ""} ${field.FieldName || ""}`)) {
      warnings.push({
        code: "CREDENTIAL_LIKE_FIELD_NAME",
        message: `Credential-like field name found and values should not be exposed: ${field.DisplayName || field.FieldName}`,
        fieldName: field.FieldName,
      });
    }
  }

  for (const lookup of lookups) {
    if (lookup.targetListID) {
      warnings.push({
        code: "LOOKUP_TARGET_EXTERNAL_OR_UNRESOLVED",
        message: `Lookup ${lookup.sourceDisplayName || lookup.sourceField} targets list ${lookup.targetListID}. Standalone .ydl may not include that dependency.`,
        sourceField: lookup.sourceField,
        targetListID: lookup.targetListID,
      });
    }
  }

  for (const form of customForms) {
    if (form.customCodeControls.length) {
      warnings.push({
        code: "CUSTOM_CODE_CONTROLS_FOUND",
        message: `Custom form ${form.title || "Untitled"} contains custom code controls.`,
        formTitle: form.title,
        controls: form.customCodeControls.map((control) => ({ id: control.id, label: control.label, type: control.type })),
      });
    }
  }

  for (const workflow of workflows) {
    for (const listId of workflow.targetListsReferenced || []) {
      warnings.push({
        code: "WORKFLOW_REFERENCES_TARGET_LIST",
        message: `Workflow ${workflow.name || workflow.key} references target list ${listId}. Validate this dependency before generation/import.`,
        workflowKey: workflow.key,
        targetListID: listId,
      });
    }
    if ((workflow.aiNodes || []).length) {
      warnings.push({
        code: "AI_WORKFLOW_NODES_FOUND",
        message: `Workflow ${workflow.name || workflow.key} contains AI nodes that may require external agent/runtime dependencies.`,
        workflowKey: workflow.key,
      });
    }
    if ((workflow.httpActionNodes || []).length) {
      warnings.push({
        code: "HTTP_OR_EXTERNAL_ACTION_NODES_FOUND",
        message: `Workflow ${workflow.name || workflow.key} contains HTTP/API-like nodes. Check credentials and endpoints before reuse.`,
        workflowKey: workflow.key,
      });
    }
  }

  const missingLookupSamples = lookups.filter((lookup) => !(lookup.sampleValueShapes || []).length);
  if (sampleData.sampleRecordCount && missingLookupSamples.length) {
    warnings.push({
      code: "LOOKUP_WITHOUT_SAMPLE_VALUES",
      message: `${missingLookupSamples.length} lookup fields did not have non-empty sample values in this export.`,
      fields: missingLookupSamples.map((lookup) => lookup.sourceField),
    });
  }

  if (!inputPath.toLowerCase().endsWith(".ydl")) {
    warnings.push({ code: "NON_YDL_EXTENSION", message: "Input file does not use the .ydl extension." });
  }

  return warnings;
}

function buildReport(inputPath) {
  const decodeWarnings = [];
  const { wrapper, resource, data, format, largeNumbers } = decodeYdl(inputPath);
  const item = data.Item || {};
  const mainList = getMainList(data);
  const fieldWarnings = [];
  const fields = buildFieldInventory(item, fieldWarnings);
  const fieldsByName = new Map(fields.map((field) => [field.FieldName, field]));
  const sampleData = buildSampleDataInventory(item, fieldsByName);
  const lookupRelationships = buildLookupInventory(fields, sampleData, mainList.Title || wrapper.Title || null);
  const { views, customForms } = buildViewAndFormInventory(item, fieldsByName, fieldWarnings);
  const workflows = buildWorkflowInventory(data);
  const warnings = [
    ...decodeWarnings,
    ...fieldWarnings,
    ...collectWarnings({ inputPath, format, largeNumbers, fields, lookups: lookupRelationships, views, customForms, workflows, sampleData }),
  ];

  const childResources = asArray(data.Childs).map((child) => ({
    title: child.ListModel && child.ListModel.Title || null,
    AppID: child.ListModel && child.ListModel.AppID || null,
    ListSetID: child.ListModel && child.ListModel.ListSetID || null,
    ListID: child.ListModel && child.ListModel.ListID || null,
    fieldCount: asArray(child.Defs).length,
    layoutCount: asArray(child.Layouts).length,
    sampleRecordCount: child.ListDatas ? Object.keys(child.ListDatas).length : 0,
  }));

  const listSummary = {
    title: wrapper.Title || mainList.Title || null,
    description: wrapper.Description || null,
    iconUrl: wrapper.IconUrl || null,
    isListSet: wrapper.IsListSet,
    AppID: resource.AppID || mainList.AppID || null,
    MainListType: resource.MainListType || mainList.ListType || null,
    ListSetID: mainList.ListSetID || resource.ListSetID || null,
    ListID: mainList.ListID || null,
    fieldCount: fields.length,
    layoutCount: asArray(item.Layouts).length,
    viewCount: views.length,
    customFormCount: customForms.length,
    workflowCount: workflows.length,
    sampleRecordCount: sampleData.sampleRecordCount,
    childResourceCount: childResources.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    input: path.resolve(inputPath),
    format,
    topLevel: {
      Title: wrapper.Title ?? null,
      Description: wrapper.Description ?? null,
      IconUrl: wrapper.IconUrl ?? null,
      IsListSet: wrapper.IsListSet ?? null,
    },
    resourceSummary: {
      MainListType: resource.MainListType ?? null,
      AppID: resource.AppID ?? null,
      ReplaceIdsCount: Array.isArray(resource.ReplaceIds) ? resource.ReplaceIds.length : 0,
      ReportIdsCount: Array.isArray(resource.ReportIds) ? resource.ReportIds.length : 0,
      FormKeysCount: Array.isArray(resource.FormKeys) ? resource.FormKeys.length : 0,
      dataKeys: Object.keys(data),
    },
    listSummary,
    fieldInventory: fields,
    lookupRelationships,
    viewInventory: views,
    customFormInventory: customForms,
    workflowInventory: workflows,
    sampleDataInventory: sampleData,
    childResources,
    warnings,
    largeNumericIdsPreserved: largeNumbers,
  };
}

function table(headers, rows) {
  const clean = (value) => safeString(value).replace(/\n/g, " ").replace(/\|/g, "\\|");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(clean).join(" | ")} |`),
  ].join("\n");
}

function renderMarkdown(report) {
  const s = report.listSummary;
  const fieldRows = report.fieldInventory.map((field) => [
    field.DisplayName || "",
    field.FieldName || "",
    field.InternalName || "",
    field.FieldType || "",
    field.Type || "",
    field.normalizedType || "",
    field.IsSystem ?? "",
  ]);
  const lookupRows = report.lookupRelationships.map((lookup) => [
    lookup.sourceDisplayName || lookup.sourceField || "",
    lookup.targetListID || "",
    lookup.targetListSetID || "",
    lookup.targetDisplayField || "",
    lookup.multiple,
    (lookup.sampleValueShapes || []).map((sample) => `${sample.valueShape}:${sample.valuePreview}`).slice(0, 2).join("; "),
  ]);
  const viewRows = report.viewInventory.map((view) => [
    view.title || "",
    view.type || "",
    view.isDefault,
    view.displayedColumns.length,
    view.columnOrder.slice(0, 10).join(", "),
    JSON.stringify(view.filters || []).slice(0, 160),
    JSON.stringify(view.sorts || []).slice(0, 120),
  ]);
  const formRows = report.customFormInventory.map((form) => [
    form.title || "",
    form.controlCount,
    form.boundFields.length,
    form.containers.length,
    form.grids.length,
    form.lookupControls.length,
    form.listControls.length,
    form.customCodeControls.length,
  ]);
  const workflowRows = report.workflowInventory.map((workflow) => [
    workflow.name || "",
    workflow.key || "",
    workflow.workflowType || "",
    workflow.variablesCount,
    Object.entries(workflow.nodeTypes || {}).map(([key, count]) => `${key}:${count}`).join(", "),
    workflow.contentListNodes.length,
    workflow.queryDataNodes.length,
    workflow.aiNodes.length,
    (workflow.targetListsReferenced || []).join(", "),
  ]);
  const sampleRows = report.sampleDataInventory.valueShapeByField.map((shape) => [
    shape.displayName || shape.fieldName,
    shape.fieldName,
    shape.normalizedType || "",
    Object.entries(shape.shapes || {}).map(([key, count]) => `${key}:${count}`).join(", "),
    shape.examples.map((example) => `${example.shape}=${example.value}`).join("; "),
  ]);
  const warningRows = report.warnings.map((warning) => [
    warning.code || "",
    warning.message || "",
  ]);

  return [
    `# Yeeflow .ydl Inspection: ${s.title || path.basename(report.input)}`,
    "",
    "## Package Format",
    "",
    `- Input: \`${report.input}\``,
    `- Top-level JSON: ${report.format.isJson}`,
    `- Resource prefix \`${GZIP_PREFIX}\`: ${report.format.resourceHasGzipPrefix}`,
    `- Decoded Resource.Data JSON: true`,
    "",
    "## List Summary",
    "",
    table(["Metric", "Value"], [
      ["Title", s.title || ""],
      ["AppID", s.AppID || ""],
      ["MainListType", s.MainListType || ""],
      ["ListSetID", s.ListSetID || ""],
      ["ListID", s.ListID || ""],
      ["Fields", s.fieldCount],
      ["Layouts", s.layoutCount],
      ["Views", s.viewCount],
      ["Custom forms", s.customFormCount],
      ["Workflows", s.workflowCount],
      ["Sample records", s.sampleRecordCount],
      ["Child resources", s.childResourceCount],
    ]),
    "",
    "## Fields",
    "",
    fieldRows.length ? table(["Display", "FieldName", "Internal", "FieldType", "Control", "Normalized", "System"], fieldRows) : "_No fields found._",
    "",
    "## Lookup Relationships",
    "",
    lookupRows.length ? table(["Source field", "Target ListID", "Target ListSetID", "Display field", "Multiple", "Sample values"], lookupRows) : "_No lookup fields found._",
    "",
    "## Views",
    "",
    viewRows.length ? table(["Title", "Type", "Default", "Columns", "Column order", "Filters", "Sorts"], viewRows) : "_No views found._",
    "",
    "## Custom Forms",
    "",
    formRows.length ? table(["Title", "Controls", "Bound fields", "Containers", "Grids", "Lookups", "Lists", "Custom code"], formRows) : "_No custom forms found._",
    "",
    "## List Workflows",
    "",
    workflowRows.length ? table(["Name", "Key", "Type", "Variables", "Node types", "ContentList", "QueryData", "AI", "Target lists"], workflowRows) : "_No list workflows found._",
    "",
    "## Sample Data Value Shapes",
    "",
    sampleRows.length ? table(["Field", "FieldName", "Type", "Shapes", "Examples"], sampleRows) : "_No sample records found._",
    "",
    "## Warnings",
    "",
    warningRows.length ? table(["Code", "Message"], warningRows) : "_No warnings._",
    "",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const report = buildReport(args.input);
  fs.writeFileSync(args.json, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(args.md, renderMarkdown(report));
  console.log(JSON.stringify({
    status: "pass",
    input: path.resolve(args.input),
    json: path.resolve(args.json),
    md: path.resolve(args.md),
    summary: report.listSummary,
    warnings: report.warnings.length,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    status: "fail",
    errors: [error.message],
  }, null, 2));
  process.exit(1);
}
