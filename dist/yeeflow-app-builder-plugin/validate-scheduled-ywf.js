#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  collectLongNumericStrings,
  collectStrings,
  isObject,
  readCanonicalJson,
} = require("./scripts/lib/standalone-artifact-utils.cjs");

const OUTER_KEYS = ["Def", "Description", "FlowKey", "FlowName", "Icon", "Img", "Settings", "WorkflowType"];
const REQUIRED_SETTING_KEYS = ["TimeZone", "Times", "StartDate", "EndDate", "Frequency", "Interval"];
const { validateWorkflowActionShapes } = require("./workflow-action-config-validator.js");

function issue(level, code, message, context = null) { return { level, code, message, context }; }

function decodeCanonicalBase64Json(encoded) {
  if (typeof encoded !== "string" || !encoded.trim()) throw new Error("Def must be a non-empty base64 string");
  const normalized = encoded.replace(/\s/g, "");
  const bytes = Buffer.from(normalized, "base64");
  if (bytes.toString("base64").replace(/=+$/, "") !== normalized.replace(/=+$/, "")) throw new Error("Def is not canonical base64");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return JSON.parse(text);
}

function idOf(shape) { return String(shape?.resourceid ?? shape?.resourceId ?? shape?.id ?? ""); }
function refId(ref) { return String(ref?.resourceid ?? ref?.resourceId ?? ref?.id ?? ref ?? ""); }

function validateGraph(def, errors, warnings, options = {}) {
  if (!Array.isArray(def.childshapes) || !def.childshapes.length) {
    errors.push(issue("error", "SCHEDULED_YWF_GRAPH_REQUIRED", "Def.childshapes must be a non-empty array"));
    return;
  }
  const ids = new Set();
  let starts = 0;
  let ends = 0;
  for (const [index, shape] of def.childshapes.entries()) {
    const id = idOf(shape);
    if (!id) errors.push(issue("error", "SCHEDULED_YWF_NODE_ID_REQUIRED", "Every workflow shape requires an id/resourceid", { index }));
    else if (ids.has(id)) errors.push(issue("error", "SCHEDULED_YWF_NODE_ID_DUPLICATE", "Workflow shape IDs must be unique", { id }));
    else ids.add(id);
    const stencil = shape?.stencil?.id;
    if (stencil === "StartNoneEvent") starts += 1;
    if (stencil === "EndNoneEvent") ends += 1;
  }
  if (starts !== 1) errors.push(issue("error", "SCHEDULED_YWF_START_COUNT_INVALID", "Scheduled Workflow must contain exactly one StartNoneEvent", { starts }));
  if (ends < 1) errors.push(issue("error", "SCHEDULED_YWF_END_REQUIRED", "Scheduled Workflow must contain at least one EndNoneEvent"));
  for (const shape of def.childshapes) {
    if (shape?.stencil?.id !== "SequenceFlow") continue;
    const source = refId(shape.source);
    const target = refId(shape.target);
    if (!source || !ids.has(source)) errors.push(issue("error", "SCHEDULED_YWF_FLOW_SOURCE_UNRESOLVED", "SequenceFlow source does not resolve", { flow: idOf(shape), source }));
    if (!target || !ids.has(target)) errors.push(issue("error", "SCHEDULED_YWF_FLOW_TARGET_UNRESOLVED", "SequenceFlow target does not resolve", { flow: idOf(shape), target }));
  }
  if (!isObject(def.variables)) errors.push(issue("error", "SCHEDULED_YWF_VARIABLES_REQUIRED", "Def.variables must be an object"));
  if (!Array.isArray(def.pageurls)) errors.push(issue("error", "SCHEDULED_YWF_PAGEURLS_REQUIRED", "Def.pageurls must be an array"));
  if (def.lineType !== undefined && def.lineType !== "rounded") warnings.push(issue("warning", "SCHEDULED_YWF_LINE_TYPE_UNUSUAL", "Export-proven Workflow Designer v2 packages normally use lineType = rounded", { lineType: def.lineType }));
  const actionShapes = def.childshapes.filter((shape) => !new Set(["StartNoneEvent", "EndNoneEvent", "SequenceFlow", "EndRejectEvent"]).has(shape?.stencil?.id));
  const actionResult = validateWorkflowActionShapes(actionShapes, { mode: options.stage === "final" ? "generator" : "inspect", stage: options.stage || "structural" });
  for (const found of actionResult.issues) (found.level === "error" ? errors : warnings).push(issue(found.level, found.code, found.message, found));
}

function validIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validTimeZone(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  if (/^[A-Za-z][A-Za-z ]+ Standard Time$/.test(value)) return true;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; } catch { return false; }
}

function dependencyMapSets(value) {
  const map = isObject(value) ? value : {};
  return Object.fromEntries(["lists", "fields", "agents", "services", "connections"].map((key) => [key, new Set(Array.isArray(map[key]) ? map[key].map(String) : [])]));
}

function validateDependencies(def, options, errors) {
  const deps = dependencyMapSets(options.dependencyMap);
  const required = [];
  for (const shape of def?.childshapes || []) {
    const type = shape?.stencil?.id;
    const props = shape?.properties || {};
    if (type === "AI") required.push({ kind: "agents", id: String(props?.data?.AgentID || ""), node: idOf(shape) });
    if (type === "QueryData") required.push({ kind: "lists", id: String(props.listid || props.listId || ""), node: idOf(shape) });
    if (type === "InvokeCode") {
      required.push({ kind: "services", id: String(props.serviceId || ""), node: idOf(shape) });
      for (const connection of Array.isArray(props.connections) ? props.connections : []) required.push({ kind: "connections", id: String(connection?.value?.connectionid || ""), node: idOf(shape) });
    }
  }
  const concrete = required.filter((item) => item.id && item.id !== "0");
  if (options.stage === "final" && concrete.length && !options.dependencyMap) errors.push(issue("error", "SCHEDULED_YWF_DEPENDENCY_MAP_REQUIRED", "Final Scheduled Workflow generation requires a dependency map for referenced resources", { count: concrete.length }));
  for (const item of concrete) if (options.dependencyMap && !deps[item.kind].has(item.id)) errors.push(issue("error", "SCHEDULED_YWF_DEPENDENCY_UNRESOLVED", "Scheduled Workflow resource reference is missing from the dependency map", item));
}

function validateScheduledYwfObject(wrapper, options = {}) {
  const errors = [];
  const warnings = [];
  if (!isObject(wrapper)) return { errors: [issue("error", "SCHEDULED_YWF_OUTER_NOT_OBJECT", ".ywf root must be an object")], warnings, def: null, settings: null };
  const actual = Object.keys(wrapper).sort();
  if (JSON.stringify(actual) !== JSON.stringify(OUTER_KEYS)) errors.push(issue("error", "SCHEDULED_YWF_OUTER_KEYS_INVALID", "Scheduled .ywf must contain exactly the export-proven outer keys", { expected: OUTER_KEYS, actual }));
  if (wrapper.WorkflowType !== 3) errors.push(issue("error", "SCHEDULED_YWF_TYPE_INVALID", "WorkflowType must equal 3"));
  if (typeof wrapper.FlowName !== "string" || !wrapper.FlowName.trim()) errors.push(issue("error", "SCHEDULED_YWF_NAME_REQUIRED", "FlowName must be a non-empty string"));
  if (typeof wrapper.FlowKey !== "string" || !wrapper.FlowKey.trim()) errors.push(issue("error", "SCHEDULED_YWF_KEY_REQUIRED", "FlowKey must be a non-empty string"));
  else if (!/^[A-Za-z0-9_]+$/.test(wrapper.FlowKey)) errors.push(issue("error", "SCHEDULED_YWF_KEY_INVALID", "FlowKey must contain only letters, numbers, and underscores"));
  if (typeof wrapper.Description !== "string") errors.push(issue("error", "SCHEDULED_YWF_DESCRIPTION_INVALID", "Description must be a string"));
  if (typeof wrapper.Icon !== "string") errors.push(issue("error", "SCHEDULED_YWF_ICON_INVALID", "Icon must be a string"));
  if (wrapper.Img !== null && typeof wrapper.Img !== "string") errors.push(issue("error", "SCHEDULED_YWF_IMG_INVALID", "Img must be null or a string"));

  let def = null;
  try { def = decodeCanonicalBase64Json(wrapper.Def); }
  catch (error) { errors.push(issue("error", "SCHEDULED_YWF_DEF_INVALID", "Def must be canonical base64 UTF-8 JSON", { message: error.message })); }
  if (def) {
    if (def.workflowType !== 3) errors.push(issue("error", "SCHEDULED_YWF_DEF_TYPE_INVALID", "Decoded Def.workflowType must equal 3"));
    if (String(def.defkey || "") !== wrapper.FlowKey) errors.push(issue("error", "SCHEDULED_YWF_KEY_MISMATCH", "FlowKey must equal decoded Def.defkey", { flowKey: wrapper.FlowKey, defkey: def.defkey }));
    for (const key of ["AppListSetID", "ProcModelAppID", "ProcModelListID", "ProcModelListSetID"]) if (!(key in def)) errors.push(issue("error", "SCHEDULED_YWF_DEF_METADATA_REQUIRED", `Decoded Def.${key} key is required`, { key }));
    for (const key of ["AppListSetID", "ProcModelAppID"]) if (def[key] === null || def[key] === undefined || String(def[key]) === "") errors.push(issue("error", "SCHEDULED_YWF_DEF_METADATA_VALUE_REQUIRED", `Decoded Def.${key} requires a value`, { key }));
    validateGraph(def, errors, warnings, options);
    validateDependencies(def, options, errors);
  }

  let settings = null;
  if (typeof wrapper.Settings !== "string") errors.push(issue("error", "SCHEDULED_YWF_SETTINGS_NOT_STRING", "Settings must be a JSON string"));
  else {
    try { settings = JSON.parse(wrapper.Settings); }
    catch (error) { errors.push(issue("error", "SCHEDULED_YWF_SETTINGS_JSON_INVALID", "Settings is not valid JSON", { message: error.message })); }
  }
  if (settings !== null) {
    if (!isObject(settings)) errors.push(issue("error", "SCHEDULED_YWF_SETTINGS_INVALID", "Settings must decode to an object"));
    else {
      for (const key of REQUIRED_SETTING_KEYS) if (!(key in settings)) errors.push(issue("error", "SCHEDULED_YWF_SETTING_REQUIRED", `Settings.${key} is required`, { key }));
      if (!validTimeZone(settings.TimeZone)) errors.push(issue("error", "SCHEDULED_YWF_TIMEZONE_INVALID", "Settings.TimeZone must be a valid IANA or export-proven Windows-style timezone"));
      if (!Array.isArray(settings.Times) || !settings.Times.length || settings.Times.some((item) => typeof item !== "string" || !/^(?:0?[1-9]|1[0-2]):[0-5]\d(?:AM|PM)$/i.test(item))) errors.push(issue("error", "SCHEDULED_YWF_TIMES_INVALID", "Settings.Times must be a non-empty array of 12-hour time strings such as 8:30AM"));
      if (!validIsoDate(settings.StartDate)) errors.push(issue("error", "SCHEDULED_YWF_START_DATE_INVALID", "Settings.StartDate must be a valid YYYY-MM-DD date"));
      if (typeof settings.EndDate !== "string" || (settings.EndDate && !validIsoDate(settings.EndDate))) errors.push(issue("error", "SCHEDULED_YWF_END_DATE_INVALID", "Settings.EndDate must be empty or a valid YYYY-MM-DD date"));
      if (validIsoDate(settings.StartDate) && validIsoDate(settings.EndDate) && settings.EndDate < settings.StartDate) errors.push(issue("error", "SCHEDULED_YWF_DATE_RANGE_INVALID", "Settings.EndDate must not be earlier than StartDate"));
      const frequency = String(settings.Frequency);
      if (!new Set(["0", "1"]).has(frequency)) errors.push(issue("error", "SCHEDULED_YWF_FREQUENCY_INVALID", "Settings.Frequency must use export-proven daily (0) or weekly (1)"));
      if (!Number.isInteger(settings.Interval) || settings.Interval <= 0) errors.push(issue("error", "SCHEDULED_YWF_INTERVAL_INVALID", "Settings.Interval must be a positive integer"));
      if (frequency === "1" && (!Array.isArray(settings.Values) || !settings.Values.length || settings.Values.some((item) => !/^[0-6]$/.test(String(item))))) errors.push(issue("error", "SCHEDULED_YWF_WEEKLY_VALUES_INVALID", "Weekly schedules require Settings.Values[] weekday numbers"));
      if (frequency !== "1" && settings.Values !== undefined) errors.push(issue("error", "SCHEDULED_YWF_VALUES_NOT_DAILY", "Settings.Values is only supported for weekly schedules"));
      if (settings.IsWorkday !== undefined && typeof settings.IsWorkday !== "boolean") errors.push(issue("error", "SCHEDULED_YWF_IS_WORK_DAY_INVALID", "Settings.IsWorkday must be boolean when present"));
      if (frequency !== "0" && settings.IsWorkday !== undefined) errors.push(issue("error", "SCHEDULED_YWF_IS_WORK_DAY_NOT_DAILY", "Settings.IsWorkday is only supported for daily schedules"));
    }
  }

  const combined = { wrapper, def, settings };
  for (const item of collectStrings(combined)) if (/^__.*(?:REQUIRED|PLACEHOLDER).*__$/.test(item.value)) errors.push(issue("error", "SCHEDULED_YWF_PLACEHOLDER_UNRESOLVED", "Unresolved required placeholder remains", item));
  const emailHits = collectStrings(def || {}).flatMap((item) => [...item.value.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)].map((match) => ({ pointer: item.pointer, email: match[0] })));
  if (emailHits.length && !options.allowRecipients) {
    const target = options.stage === "final" ? errors : warnings;
    target.push(issue(options.stage === "final" ? "error" : "warning", "SCHEDULED_YWF_FIXED_RECIPIENT_REQUIRES_ACK", "Fixed email recipients require explicit acknowledgement before final generation", { count: emailHits.length, pointers: emailHits.map((item) => item.pointer) }));
  }

  if (options.issuedIds) {
    const issued = new Set(options.issuedIds.map(String));
    for (const found of collectLongNumericStrings(combined)) if (!issued.has(found.id)) errors.push(issue("error", "SCHEDULED_YWF_ID_NOT_ISSUED", "Long numeric ID is missing from issued-ID provenance", found));
  } else if (options.stage === "final") {
    errors.push(issue("error", "SCHEDULED_YWF_ID_PROVENANCE_REQUIRED", "Final standalone Scheduled Workflow generation requires issued-ID provenance"));
  }
  return { errors, warnings, def, settings };
}

function loadIssuedIds(filePath) {
  if (!filePath) return null;
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const ids = Array.isArray(value) ? value : value.issuedIds;
  if (!Array.isArray(ids)) throw new Error("Issued-ID provenance must be an array or contain issuedIds[]");
  return ids.map(String);
}

function validateScheduledYwfFile(filePath, options = {}) {
  const report = { status: "fail", file: path.resolve(filePath), stage: options.stage || "structural", errors: [], warnings: [], roundTrip: { canonicalUtf8: false, wrapperJsonValid: false, defBase64Valid: false, settingsJsonValid: false } };
  let wrapper;
  try {
    const read = readCanonicalJson(filePath);
    wrapper = read.value;
    report.roundTrip.wrapperJsonValid = true;
    report.roundTrip.canonicalUtf8 = read.bytes.equals(read.canonical);
    const requireCanonical = options.requireCanonical === undefined ? options.stage === "final" : options.requireCanonical;
    if (requireCanonical && !report.roundTrip.canonicalUtf8) report.errors.push(issue("error", "SCHEDULED_YWF_NON_CANONICAL_BYTES", ".ywf must be canonical UTF-8 JSON in final mode"));
    else if (!report.roundTrip.canonicalUtf8) report.warnings.push(issue("warning", "SCHEDULED_YWF_NON_CANONICAL_BYTES", "Existing export is valid JSON but not canonical generated bytes"));
  } catch (error) {
    report.errors.push(issue("error", error.code || "SCHEDULED_YWF_READ_FAILED", "Unable to read Scheduled .ywf", { message: error.message }));
    return report;
  }
  const result = validateScheduledYwfObject(wrapper, options);
  report.errors.push(...result.errors);
  report.warnings.push(...result.warnings);
  report.roundTrip.defBase64Valid = Boolean(result.def);
  report.roundTrip.settingsJsonValid = Boolean(result.settings);
  report.status = report.errors.length ? "fail" : report.warnings.length ? "pass_with_warnings" : "pass";
  return report;
}

function cli() {
  const args = process.argv.slice(2);
  const file = args.shift();
  if (!file) {
    console.error("Usage: node validate-scheduled-ywf.js <file.ywf> [--stage structural|final] [--issued-ids provenance.json] [--allow-recipients]");
    process.exit(2);
  }
  const options = { stage: "structural", requireCanonical: undefined, allowRecipients: false, issuedIds: null, dependencyMap: null };
  while (args.length) {
    const arg = args.shift();
    if (arg === "--stage") options.stage = args.shift();
    else if (arg === "--issued-ids") options.issuedIds = loadIssuedIds(args.shift());
    else if (arg === "--dependency-map") options.dependencyMap = JSON.parse(fs.readFileSync(args.shift(), "utf8"));
    else if (arg === "--allow-recipients") options.allowRecipients = true;
    else if (arg === "--allow-noncanonical") options.requireCanonical = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!new Set(["structural", "final"]).has(options.stage)) throw new Error("--stage must be structural or final");
  const report = validateScheduledYwfFile(file, options);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

if (require.main === module) cli();
module.exports = { cli, decodeCanonicalBase64Json, loadIssuedIds, validateScheduledYwfFile, validateScheduledYwfObject };
