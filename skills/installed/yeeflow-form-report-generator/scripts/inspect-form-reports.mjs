#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PRIVATE_NUMBER_RE = /\b\d{8,}\b/g;

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node scripts/inspect-form-reports.mjs <input.yap> --out-dir <normalized-dir>",
    "",
    "Decodes a Yeeflow .yap read-only and writes redacted Form Report normalized references.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, outDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out-dir") args.outDir = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.outDir) usage();
  return args;
}

function quoteLargeIntegers(jsonText) {
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
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function decodeYap(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText);
  const data = parseJson(resource.Data);
  return { wrapper, resource, data };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseJsonMaybe(value, fallback = null) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function redactString(value, idMap = new Map()) {
  if (value === null || value === undefined) return value;
  const text = String(value);
  if (idMap.has(text)) return idMap.get(text);
  return text
    .replace(EMAIL_RE, "<email>")
    .replace(PRIVATE_NUMBER_RE, (match) => idMap.get(match) || "<id>");
}

function sanitize(value, idMap = new Map(), key = "") {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, idMap, key));
  if (!isObject(value)) return typeof value === "string" ? redactString(value, idMap) : value;
  const out = {};
  for (const [childKey, child] of Object.entries(value)) {
    if (/^(Name|Title|Description|Label|PropName|CreatedBy|ModifiedBy|TenantID|Created|Modified)$/i.test(childKey)) {
      out[childKey] = child === null ? null : `<redacted-${childKey.toLowerCase()}>`;
    } else if (/email/i.test(childKey)) {
      out[childKey] = "<email>";
    } else {
      out[childKey] = sanitize(child, idMap, childKey);
    }
  }
  return key ? out : out;
}

function fieldPatternName(field) {
  const type = String(field.L_Type || field.Type || "").toLowerCase();
  const map = {
    input: "field-text-single-line.normalized.json",
    textarea: "field-text-multiple-line.normalized.json",
    richtext: "field-text-rich-text.normalized.json",
    input_number: "field-number.normalized.json",
    percent: "field-percent.normalized.json",
    currency: "field-currency.normalized.json",
    switch: "field-switch.normalized.json",
    datepicker: "field-date-picker.normalized.json",
    time: "field-time-picker.normalized.json",
    "identity-picker": "field-user.normalized.json",
    "organization-picker": "field-department.normalized.json",
    "location-picker": "field-location.normalized.json",
    "cost-center-picker": "field-cost-center.normalized.json",
    "file-upload": "field-attachment.normalized.json",
    "icon-upload": "field-image.normalized.json",
    lookup: "field-lookup.normalized.json",
    metadata: "field-metadata.normalized.json",
    "mutiple-metadata": "field-multiple-meta.normalized.json",
  };
  return map[type] || null;
}

function classifyField(field, reportSettings, variables) {
  const key = String(field.Key || "");
  const id = String(field.ID || "");
  if (field.IsSystem) return { source: "system", sourceType: "system", sourceRef: id };
  const subListId = String(reportSettings.SubListID || "");
  if (subListId && key.startsWith(`${subListId}_`)) {
    const subFieldId = key.slice(`${subListId}_`.length);
    return {
      source: "sub-list-field",
      sourceType: variables.listFieldTypes.get(`${subListId}:${subFieldId}`) || field.Type || "unknown",
      sourceRef: `${subListId}.${subFieldId}`,
    };
  }
  if (key.startsWith("vlist_")) {
    return {
      source: "approval-list-variable",
      sourceType: variables.basicTypes.get(id) || field.Type || "list",
      sourceRef: id,
    };
  }
  return {
    source: "approval-variable",
    sourceType: variables.basicTypes.get(id) || field.Type || "unknown",
    sourceRef: id,
  };
}

function buildVariables(formDef) {
  const basicTypes = new Map();
  const listRefs = new Map();
  const listFieldTypes = new Map();
  for (const variable of asArray(formDef.variables?.basic)) {
    basicTypes.set(String(variable.id), String(variable.type || "unknown"));
  }
  for (const listRef of asArray(formDef.variables?.listref)) {
    const listRefInfo = {
      id: String(listRef.id),
      name: "<redacted-listref-name>",
      fieldCount: asArray(listRef.fields).length,
      fields: asArray(listRef.fields).map((field) => ({
        id: String(field.id),
        name: "<redacted-field-name>",
        type: String(field.type || "unknown"),
      })),
    };
    listRefs.set(listRefInfo.id, listRefInfo);
  }
  for (const variable of asArray(formDef.variables?.basic)) {
    const listrefId = variable.value?.listref;
    if (variable.type === "list" && listrefId && listRefs.has(String(listrefId))) {
      const listVariableKey = `vlist_${variable.id}`;
      for (const field of listRefs.get(String(listrefId)).fields) {
        listFieldTypes.set(`${listVariableKey}:${field.id}`, field.type);
      }
    }
  }
  return { basicTypes, listRefs, listFieldTypes };
}

function writeJson(outDir, filename, value) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, filename), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function publicSchemaKeys(value) {
  return Object.keys(value || {}).filter((key) => !/^(TenantID|CreatedBy|ModifiedBy|Created|Modified)$/i.test(key));
}

function main() {
  const args = parseArgs(process.argv);
  const { data } = decodeYap(args.input);
  const forms = asArray(data.Forms).map((form, index) => {
    const def = parseJsonMaybe(form.DefResource, {});
    return { index, form, def };
  });
  const formsByKey = new Map(forms.map((entry, index) => [String(entry.form.Key || entry.def.defkey || `form-${index + 1}`), entry]));
  const reportConfigs = asArray(data.FormNewReports);
  const reportIds = new Map(reportConfigs.map((report, index) => [String(report.ID), `<report-id-${index + 1}>`]));
  const formKeys = new Map(forms.map((entry, index) => [String(entry.form.Key || entry.def.defkey), `<approval-form-key-${index + 1}>`]));
  const idMap = new Map(reportIds);
  for (const [key, value] of formKeys.entries()) idMap.set(key, value);
  asArray(data.Childs).forEach((child, index) => idMap.set(String(child.ListModel?.ListID), `<resource-id-${index + 1}>`));
  if (data.Item?.ListModel?.ListID) idMap.set(String(data.Item.ListModel.ListID), "<app-resource-id>");

  const childByListId = new Map(asArray(data.Childs).map((child) => [String(child.ListModel?.ListID), child]));
  const reports = [];
  const normalizedSamples = new Map();
  const fieldSamples = new Map();
  const mappingCounts = new Map();
  let subListReport = null;
  let noFilterReport = null;
  let filteredReport = null;
  let detailEnabled = null;
  let detailDisabled = null;

  reportConfigs.forEach((report, index) => {
    const settings = parseJsonMaybe(report.Settings, {});
    const attr = parseJsonMaybe(report.Attr, {});
    const formEntry = formsByKey.get(String(report.DefKey));
    const formDef = formEntry?.def || {};
    const variables = buildVariables(formDef);
    const child = childByListId.get(String(report.ID));
    const fields = asArray(settings.Fields).map((field, fieldIndex) => {
      const source = classifyField(field, settings, variables);
      const normalizedField = {
        exportPath: `Data.FormNewReports[${index}].Settings.Fields[${fieldIndex}]`,
        childFieldPath: child ? `Data.Childs[${asArray(data.Childs).indexOf(child)}].Defs[${fieldIndex}]` : null,
        fieldId: String(field.ID || ""),
        key: String(field.Key || ""),
        variableSource: source.source,
        variableType: source.sourceType,
        variableRef: source.sourceRef,
        reportFieldType: field.L_Type || field.Type || null,
        storedType: field.Type || null,
        isSystem: Boolean(field.IsSystem),
        required: Boolean(field.Required),
        rules: sanitize(field.Rules || null, idMap),
      };
      const mappingKey = `${source.sourceType} -> ${normalizedField.reportFieldType}`;
      mappingCounts.set(mappingKey, (mappingCounts.get(mappingKey) || 0) + 1);
      const sampleName = fieldPatternName(field);
      if (sampleName && !fieldSamples.has(sampleName)) fieldSamples.set(sampleName, normalizedField);
      return normalizedField;
    });
    const subListFieldCount = fields.filter((field) => field.variableSource === "sub-list-field").length;
    const reportSummary = {
      reportPlaceholder: `<form-report-${index + 1}>`,
      reportResourceId: reportIds.get(String(report.ID)) || "<report-id>",
      reportCollectionPath: `Data.FormNewReports[${index}]`,
      childResourcePath: child ? `Data.Childs[${asArray(data.Childs).indexOf(child)}]` : null,
      childResourceType: child?.ListModel?.Type ?? null,
      sourceApprovalForm: formKeys.get(String(report.DefKey)) || "<approval-form-key>",
      sourceApprovalFormPath: formEntry ? `Data.Forms[${formEntry.index}]` : null,
      selectedVariablesCount: fields.filter((field) => !field.isSystem && field.variableSource !== "sub-list-field").length,
      selectedSubList: settings.SubListID ? String(settings.SubListID) : null,
      selectedSubListFieldCount: subListFieldCount,
      filterCondition: settings.Filters ? sanitize(settings.Filters, idMap) : null,
      fieldCount: fields.length,
      uniqueFieldKeys: new Set(fields.map((field) => field.key)).size === fields.length,
      attr: sanitize(attr, idMap),
      permissions: {
        inheritedFromApplication: child ? child.ListModel?.IsBreakInherit === false : null,
        listModelPerm: child?.ListModel?.Perm ?? null,
        customPermissionSchemaFound: child ? child.ListModel?.IsBreakInherit === true : null,
      },
      views: asArray(child?.Layouts).map((layout, layoutIndex) => ({
        exportPath: `Data.Childs[${asArray(data.Childs).indexOf(child)}].Layouts[${layoutIndex}]`,
        type: layout.Type,
        isDefault: Boolean(layout.IsDefault),
        isItemPerm: Boolean(layout.IsItemPerm),
        layoutViewKeys: Object.keys(parseJsonMaybe(layout.LayoutView, {}) || {}),
        detailPageAccess: parseJsonMaybe(layout.LayoutView, {})?.Attr_IsViewDetail ?? null,
      })),
      fields,
      proofLevel: "export-proven",
    };
    reports.push(reportSummary);
    if (!settings.Filters && !noFilterReport) noFilterReport = reportSummary;
    if (settings.Filters && !filteredReport) filteredReport = reportSummary;
    if (settings.SubListID && !subListReport) subListReport = reportSummary;
    if (reportSummary.views.some((view) => view.detailPageAccess === true) && !detailEnabled) detailEnabled = reportSummary;
    if (reportSummary.views.some((view) => view.detailPageAccess === false) && !detailDisabled) detailDisabled = reportSummary;
  });

  const appLayout = parseJsonMaybe(data.Item?.ListModel?.LayoutView, {});
  const navEntries = asArray(appLayout.sort).map((entry, index) => ({
    exportPath: `Data.Item.ListModel.LayoutView.sort[${index}]`,
    listId: sanitize(entry.ListID, idMap),
    type: entry.Type,
    isHidden: entry.IsHidden ?? null,
    title: "<redacted-title>",
  }));
  const inventory = {
    input: path.resolve(args.input),
    proofLevel: "export-proven",
    counts: {
      approvalForms: forms.length,
      formNewReports: reportConfigs.length,
      formReportChildResources: asArray(data.Childs).filter((child) => Number(child.ListModel?.Type) === 32).length,
    },
    sourceRelationships: reports.map((report) => ({
      report: report.reportPlaceholder,
      sourceApprovalForm: report.sourceApprovalForm,
      selectedSubList: report.selectedSubList,
      fieldCount: report.fieldCount,
    })),
    navigation: navEntries,
    mappings: [...mappingCounts.entries()].sort().map(([mapping, count]) => ({ mapping, count })),
    reports: reports.map((report) => ({
      ...report,
      fields: undefined,
    })),
  };

  normalizedSamples.set("form-report-inventory.normalized.json", inventory);
  normalizedSamples.set("form-report-basic-resource.normalized.json", {
    proofLevel: "export-proven",
    collectionPath: "Data.FormNewReports[]",
    childResourcePath: "Data.Childs[] where ListModel.Type = 32 and ListModel.ListID = FormNewReports[].ID",
    reportConfigKeys: reportConfigs[0] ? publicSchemaKeys(reportConfigs[0]) : [],
    childListModelKeys: childByListId.get(String(reportConfigs[0]?.ID)) ? publicSchemaKeys(childByListId.get(String(reportConfigs[0].ID)).ListModel || {}) : [],
  });
  normalizedSamples.set("form-report-source-approval-form.normalized.json", {
    proofLevel: "export-proven",
    reportSourcePath: "Data.FormNewReports[].DefKey",
    approvalFormKeyPath: "Data.Forms[].Key",
    associations: reports.map((report) => ({
      report: report.reportPlaceholder,
      reportDefKey: report.sourceApprovalForm,
      sourceApprovalFormPath: report.sourceApprovalFormPath,
    })),
  });
  if (filteredReport) normalizedSamples.set("form-report-filter-condition.normalized.json", {
    proofLevel: "export-proven",
    exportPath: `${filteredReport.reportCollectionPath}.Settings.Filters`,
    filters: filteredReport.filterCondition,
  });
  if (noFilterReport) normalizedSamples.set("form-report-no-filter-all-records.normalized.json", {
    proofLevel: "export-proven",
    exportPath: `${noFilterReport.reportCollectionPath}.Settings.Filters`,
    filters: null,
    interpretation: "No filter object/array is present in the export for this report.",
  });
  normalizedSamples.set("form-report-selected-variables.normalized.json", {
    proofLevel: "export-proven",
    exportPath: "Data.FormNewReports[].Settings.Fields[]",
    fields: reports[0]?.fields.slice(0, 12) || [],
  });
  if (subListReport) normalizedSamples.set("form-report-sublist-included.normalized.json", {
    proofLevel: "export-proven",
    subListPath: `${subListReport.reportCollectionPath}.Settings.SubListID`,
    subListId: subListReport.selectedSubList,
    subListFields: subListReport.fields.filter((field) => field.variableSource === "sub-list-field"),
    mainFieldsAlsoPresent: subListReport.fields.some((field) => field.variableSource === "approval-variable"),
  });
  normalizedSamples.set("form-report-permissions-inherited.normalized.json", {
    proofLevel: "export-proven",
    childResourcePath: "Data.Childs[] where ListModel.Type = 32",
    inheritedReports: reports.map((report) => ({
      report: report.reportPlaceholder,
      inheritedFromApplication: report.permissions.inheritedFromApplication,
      listModelPerm: report.permissions.listModelPerm,
    })),
  });
  if (reports.some((report) => report.permissions.customPermissionSchemaFound)) {
    normalizedSamples.set("form-report-permissions-custom.normalized.json", {
      proofLevel: "export-proven",
      note: "Custom permission schema was observed; values are redacted.",
      reports: reports.filter((report) => report.permissions.customPermissionSchemaFound).map((report) => report.reportPlaceholder),
    });
  }
  if (detailEnabled) normalizedSamples.set("form-report-view-detail-access-enabled.normalized.json", {
    proofLevel: "export-proven",
    exportPath: "Data.Childs[].Layouts[].LayoutView.Attr_IsViewDetail",
    sample: detailEnabled.views.find((view) => view.detailPageAccess === true),
  });
  if (detailDisabled) normalizedSamples.set("form-report-view-detail-access-disabled.normalized.json", {
    proofLevel: "export-proven",
    exportPath: "Data.Childs[].Layouts[].LayoutView.Attr_IsViewDetail",
    sample: detailDisabled.views.find((view) => view.detailPageAccess === false),
  });

  for (const [filename, sample] of fieldSamples.entries()) {
    normalizedSamples.set(filename, {
      proofLevel: "export-proven",
      field: sample,
    });
  }

  fs.mkdirSync(args.outDir, { recursive: true });
  for (const [filename, sample] of normalizedSamples.entries()) writeJson(args.outDir, filename, sample);
  console.log(JSON.stringify({
    status: "pass",
    input: path.resolve(args.input),
    outDir: path.resolve(args.outDir),
    formReportCount: reportConfigs.length,
    sourceApprovalFormCount: forms.length,
    normalizedFiles: [...normalizedSamples.keys()].sort(),
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
}
