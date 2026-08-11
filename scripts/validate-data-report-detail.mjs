#!/usr/bin/env node

import { readFileSync } from "node:fs";

if (process.argv[1] && process.argv[1].endsWith("validate-data-report-detail.mjs")) {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf("--input");
  if (inputIndex < 0 || !args[inputIndex + 1]) {
    console.error("Usage: node scripts/validate-data-report-detail.mjs --input <detail.json>");
    process.exit(2);
  }
  let detail;
  try {
    detail = JSON.parse(readFileSync(args[inputIndex + 1], "utf8"));
  } catch (error) {
    console.error(`DATA_REPORT_DETAIL_JSON_INVALID: ${error.message}`);
    process.exit(1);
  }
  const findings = validateDataReportDetail(detail);
  console.log(JSON.stringify({ status: findings.length ? "fail" : "pass", findings }, null, 2));
  process.exit(findings.length ? 1 : 0);
}

export function validateDataReportDetail(detail) {
  const findings = [];
  const add = (code, message) => findings.push({ code, message });
  const object = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (!object(detail)) return [{ code: "DATA_REPORT_DETAIL_INVALID", message: "detail must be an object." }];

  const { Model, List, Fields, Layouts } = detail;
  if (!object(Model)) add("DATA_REPORT_MODEL_MISSING", "Model is required.");
  if (!object(List)) add("DATA_REPORT_LIST_MISSING", "List is required.");
  if (!Array.isArray(Fields) || Fields.length === 0) add("DATA_REPORT_FIELDS_MISSING", "Fields must be a non-empty array.");
  if (!Array.isArray(Layouts) || Layouts.length === 0) add("DATA_REPORT_LAYOUTS_MISSING", "Layouts must be a non-empty array.");
  if (findings.length) return findings;

  if (!text(Model.Name)) add("DATA_REPORT_MODEL_NAME_MISSING", "Model.Name is required.");
  if (!text(List.ListID)) add("DATA_REPORT_LIST_ID_MISSING", "List.ListID is required.");
  if (List.Type !== 64) add("DATA_REPORT_LIST_TYPE_INVALID", "List.Type must be 64 for DataReport.");
  if (List.Items && Object.keys(List.Items).length > 0) add("DATA_REPORT_RESULT_ITEMS_FORBIDDEN", "Data Report definitions must not seed result List.Items.");

  const fieldIds = new Set();
  const fieldNames = new Set();
  const internalNames = new Set();
  for (const field of Fields) {
    if (!object(field)) { add("DATA_REPORT_FIELD_INVALID", "Each field must be an object."); continue; }
    if (String(field.ListID) !== String(List.ListID)) add("DATA_REPORT_FIELD_LIST_UNRESOLVED", "Every field must resolve to List.ListID.");
    for (const [key, values] of [["FieldID", fieldIds], ["FieldName", fieldNames], ["InternalName", internalNames]]) {
      if (!text(field[key])) add("DATA_REPORT_FIELD_IDENTITY_MISSING", `Field ${key} is required.`);
      else if (values.has(String(field[key]))) add("DATA_REPORT_FIELD_IDENTITY_DUPLICATE", `Field ${key} must be unique.`);
      else values.add(String(field[key]));
    }
  }
  const title = Fields.find((field) => field?.FieldName === "Title");
  if (!title || title.FieldType !== "Text" || Number(title.FieldIndex) !== 0 || title.IsSystem !== true) {
    add("DATA_REPORT_NATIVE_TITLE_INVALID", "A native Title text field at FieldIndex 0 with IsSystem true is required.");
  }

  const defaultLayouts = Layouts.filter((layout) => layout?.IsDefault === true && layout?.Type === 0);
  if (defaultLayouts.length !== 1) add("DATA_REPORT_DEFAULT_LAYOUT_INVALID", "Exactly one default Type 0 layout is required.");
  for (const layout of Layouts) {
    if (String(layout?.ListID) !== String(List.ListID)) add("DATA_REPORT_LAYOUT_LIST_UNRESOLVED", "Every layout must resolve to List.ListID.");
    parseJsonString(layout?.LayoutView, "DATA_REPORT_LAYOUT_VIEW_INVALID", "LayoutView must be valid JSON.", add);
  }

  const settings = parseJsonString(Model.Settings, "DATA_REPORT_SETTINGS_INVALID", "Model.Settings must be valid JSON.", add);
  const stages = settings?.Stages;
  if (!Array.isArray(stages) || stages.length === 0) {
    add("DATA_REPORT_STAGES_MISSING", "Model.Settings.Stages must be non-empty.");
    return findings;
  }
  const stageIds = new Set();
  const outputTables = new Set();
  const priorTables = [];
  const allowed = new Set(["input", "group", "join", "map", "output"]);
  let outputs = 0;
  for (let index = 0; index < stages.length; index += 1) {
    const stage = stages[index];
    if (!object(stage)) { add("DATA_REPORT_STAGE_INVALID", "Each stage must be an object."); continue; }
    if (!allowed.has(stage.Type)) add("DATA_REPORT_STAGE_TYPE_UNSUPPORTED", `Stage type ${stage.Type || "(missing)"} is not baseline-proven.`);
    if (!text(stage.Id) || stageIds.has(String(stage.Id))) add("DATA_REPORT_STAGE_ID_INVALID", "Stage Id must be present and unique.");
    else stageIds.add(String(stage.Id));
    if (!text(stage.OutputTableName)) add("DATA_REPORT_STAGE_OUTPUT_TABLE_MISSING", "Stage OutputTableName is required.");
    else if (outputTables.has(stage.OutputTableName) && !(stage.Type === "output" && index > 0 && stage.OutputTableName === stages[index - 1]?.OutputTableName)) add("DATA_REPORT_STAGE_OUTPUT_TABLE_DUPLICATE", "Stage OutputTableName must be unique except final output mirroring its previous map.");
    else outputTables.add(stage.OutputTableName);
    if (stage.Type === "output") {
      outputs += 1;
      if (index !== stages.length - 1) add("DATA_REPORT_OUTPUT_STAGE_NOT_FINAL", "The output stage must be final.");
    }
    if (stage.Type === "input") {
      if (!text(stage.AppID) || !text(stage.ListID) || !Array.isArray(stage.Fields) || stage.Fields.length === 0) add("DATA_REPORT_INPUT_STAGE_INCOMPLETE", "Input stages need AppID, ListID, and source Fields.");
    } else {
      const sql = Array.isArray(stage.Sqls) ? stage.Sqls.join(" ") : "";
      const referenced = priorTables.filter((table) => sql.includes(table) || (Array.isArray(stage.Tables) && stage.Tables.includes(table)));
      const required = stage.Type === "join" ? 2 : 1;
      if (referenced.length < required) add("DATA_REPORT_STAGE_DEPENDENCY_UNRESOLVED", `${stage.Type} stage must reference ${required} prior output table(s).`);
    }
    if (text(stage.OutputTableName)) priorTables.push(stage.OutputTableName);
  }
  if (outputs !== 1) add("DATA_REPORT_OUTPUT_STAGE_INVALID", "Exactly one output stage is required.");
  return findings;
}

function parseJsonString(value, code, message, add) {
  if (typeof value === "object" && value !== null) return value;
  if (typeof value !== "string") { add(code, message); return null; }
  try { return JSON.parse(value); } catch { add(code, message); return null; }
}

function text(value) { return value !== undefined && value !== null && String(value).trim() !== ""; }
