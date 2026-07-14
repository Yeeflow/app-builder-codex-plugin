const PRINT_STEP_TYPE = "print";
const BARCODE_STEP_TYPE = "barcode";
const BARCODE_MODES = new Set(["multiple", "select", "auto"]);
const BARCODE_TYPES = new Set(["auto", "ean-13"]);

function buildDashboardPrintStep(options = {}) {
  const target = options.target || {};
  if (!target.SourceID || !target.ListSetID) throw new Error("FORM_ACTION_PRINT_DASHBOARD_TARGET_MISSING: Dashboard print requires SourceID and ListSetID.");
  const titleTokens = expressionTokens(options.titleTokens, "FORM_ACTION_PRINT_TITLE_EXPRESSION_INVALID");
  const paperSize = String(options.paperSize || "A4").toUpperCase();
  if (paperSize !== "A4") throw new Error("FORM_ACTION_PRINT_PAPER_SIZE_UNPROVEN: this focused export proves A4 only.");
  const layout = String(options.layout || "landscape").toLowerCase();
  if (!new Set(["portrait", "landscape"]).has(layout)) throw new Error("FORM_ACTION_PRINT_LAYOUT_INVALID: layout must be portrait or landscape.");
  const scalePercent = Number(options.scalePercent ?? 100);
  if (!Number.isFinite(scalePercent) || scalePercent <= 0 || scalePercent > 200) throw new Error("FORM_ACTION_PRINT_SCALE_INVALID: scale must be 1..200 percent.");
  const margins = String(options.margins || "minimum").toLowerCase();
  if (margins !== "minimum") throw new Error("FORM_ACTION_PRINT_MARGINS_UNPROVEN: this focused export proves Minimum margins only.");
  return {
    type: PRINT_STEP_TYPE,
    name: required(options.name, "name"),
    attrs: {
      printtype: "select",
      data: {
        AppID: target.AppID ?? 41,
        ListSetID: String(target.ListSetID),
        Type: "page",
        SourceID: String(target.SourceID),
      },
      ptit: titleTokens,
      settings: {
        Size: "6",
        Layout: layout,
        Scale: String(scalePercent / 100),
        Margins: "3",
      },
    },
  };
}

function buildBarcodeScanStep(options = {}) {
  const mode = String(options.mode || "multiple").toLowerCase();
  if (!BARCODE_MODES.has(mode)) throw new Error(`FORM_ACTION_BARCODE_MODE_INVALID: ${mode}`);
  const barcodeType = String(options.barcodeType || "auto").toLowerCase();
  if (!BARCODE_TYPES.has(barcodeType)) throw new Error(`FORM_ACTION_BARCODE_TYPE_UNPROVEN: ${barcodeType}`);
  const response = tempTarget(options.resultVariable, "FORM_ACTION_BARCODE_RESULT_VARIABLE_INVALID");
  const message = tempTarget(options.errorVariable, "FORM_ACTION_BARCODE_ERROR_VARIABLE_INVALID");
  const attrs = { mode, response, message };
  if (barcodeType !== "auto") attrs.type = barcodeType;
  const step = { type: BARCODE_STEP_TYPE, name: required(options.name, "name"), attrs };
  if (options.onReadError && String(options.onReadError).toLowerCase() !== "stop") {
    throw new Error("FORM_ACTION_BARCODE_CONTINUE_ON_ERROR_UNPROVEN: this focused export proves Stop action only.");
  }
  return step;
}

function validatePrintBarcodeStep(step = {}, context = {}) {
  const findings = [];
  const add = (code, message) => findings.push({ code, message });
  if (step.type === PRINT_STEP_TYPE) validatePrint(step, context, add);
  if (step.type === BARCODE_STEP_TYPE) validateBarcode(step, context, add);
  return findings;
}

function validatePrint(step, context, add) {
  const attrs = step.attrs || {};
  if (context.hostSurface === "public_form") add("FORM_ACTION_PRINT_PUBLIC_FORM_FORBIDDEN", "Public Forms do not support Print page steps.");
  if (context.strictGenerated && !String(step.name || "").trim()) add("FORM_ACTION_PRINT_STEP_NAME_MISSING", "Generated Print page steps require a business name.");
  if (attrs.printtype !== "select") add("FORM_ACTION_PRINT_TYPE_INVALID", "Dashboard Print page must use attrs.printtype = select.");
  if (attrs.data?.Type !== "page" || !attrs.data?.SourceID || !attrs.data?.ListSetID) add("FORM_ACTION_PRINT_DASHBOARD_TARGET_MISSING", "Dashboard Print page requires data.Type=page, SourceID, and ListSetID.");
  if (!isExpressionTokenArray(attrs.ptit)) add("FORM_ACTION_PRINT_TITLE_EXPRESSION_INVALID", "Print page title must be a non-empty expression-token array.");
  if (String(attrs.settings?.Size || "") !== "6") add("FORM_ACTION_PRINT_A4_REQUIRED", "The export-proven Dashboard print template uses A4 (Size=6).");
  if (!new Set(["portrait", "landscape"]).has(String(attrs.settings?.Layout || ""))) add("FORM_ACTION_PRINT_LAYOUT_INVALID", "Print layout must be portrait or landscape.");
  const scale = Number(attrs.settings?.Scale);
  if (!(scale > 0 && scale <= 2)) add("FORM_ACTION_PRINT_SCALE_INVALID", "Print Scale must serialize as a decimal between 0 and 2.");
  if (String(attrs.settings?.Margins || "") !== "3") add("FORM_ACTION_PRINT_MINIMUM_MARGINS_REQUIRED", "The focused Dashboard print export uses Minimum margins (Margins=3).");
}

function validateBarcode(step, context, add) {
  const attrs = step.attrs || {};
  if (context.strictGenerated && !String(step.name || "").trim()) add("FORM_ACTION_BARCODE_STEP_NAME_MISSING", "Generated Barcode scan steps require a business name.");
  if (!BARCODE_MODES.has(String(attrs.mode || ""))) add("FORM_ACTION_BARCODE_MODE_INVALID", "Barcode mode must be multiple, select, or auto.");
  const type = String(attrs.type || "auto");
  if (!BARCODE_TYPES.has(type)) add("FORM_ACTION_BARCODE_TYPE_UNPROVEN", "Only Auto and ean-13 are export-proven in this training.");
  for (const [key, code] of [["response", "FORM_ACTION_BARCODE_RESULT_VARIABLE_INVALID"], ["message", "FORM_ACTION_BARCODE_ERROR_VARIABLE_INVALID"]]) {
    if (attrs[key]?.prefix !== "__temp_" || !String(attrs[key]?.value || "").trim()) add(code, `${key} must target a declared page temp variable using prefix __temp_.`);
    const name = String(attrs[key]?.value || "").replace(/^__temp_/, "");
    if (name && context.declaredTempVariables && !context.declaredTempVariables.has(name) && !context.declaredTempVariables.has(`__temp_${name}`)) add(code, `${key} temp variable ${name} is not declared on the host page.`);
  }
}

function tempTarget(value, code) {
  const name = String(value || "").trim().replace(/^__temp_/, "");
  if (!name) throw new Error(`${code}: temp variable is required.`);
  return { prefix: "__temp_", value: name };
}

function expressionTokens(value, code) {
  if (!isExpressionTokenArray(value)) throw new Error(`${code}: expression tokens are required.`);
  return clone(value);
}

function isExpressionTokenArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => item && typeof item === "object" && !Array.isArray(item) && (item.type || item.exprType));
}

function required(value, name) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${name} is required.`);
  return text;
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

module.exports = {
  PRINT_STEP_TYPE,
  BARCODE_STEP_TYPE,
  BARCODE_MODES,
  BARCODE_TYPES,
  buildDashboardPrintStep,
  buildBarcodeScanStep,
  validatePrintBarcodeStep,
};
