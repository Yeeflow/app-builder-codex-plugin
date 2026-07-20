import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(directory, "../../core/yeeflow-app-builder-core-planning.v0.1.0.mjs"),
  resolve(directory, "../../dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs"),
];
const artifact = candidates.find((path) => existsSync(path));
if (!artifact) throw new Error("CORE_COMPAT_ADAPTER_ARTIFACT_MISSING: Distributed Core artifact is missing.");
let core;
try {
  core = await import(pathToFileURL(artifact).href);
} catch (error) {
  throw new Error(`CORE_COMPAT_ADAPTER_ARTIFACT_LOAD_FAILED: Distributed Core artifact cannot be imported: ${error instanceof Error ? error.message : String(error)}.`);
}
const exportsRequired = [
  "splitMarkdownTableRow",
  "isMarkdownTableSeparator",
  "parseMarkdownTables",
  "stripMarkdownFencedBlocks",
  "findMarkdownTable",
  "markdownRowValue",
  "markdownRowValues",
  "extractMarkdownSubsection",
  "isNegativeRequirementStatement",
  "positivePlanningText",
  "hasTechnicalPlaceholderIdContext",
  "projectPlanningLabel",
  "projectWorkflowSetDataListProjection",
];
for (const name of exportsRequired) if (typeof core[name] !== "function") throw new Error(`CORE_COMPAT_ADAPTER_EXPORT_MISSING: Required Core export is missing: ${name}.`);
export const splitMarkdownTableRow = core.splitMarkdownTableRow;
export const isMarkdownTableSeparator = core.isMarkdownTableSeparator;
export const parseMarkdownTables = core.parseMarkdownTables;
export const stripMarkdownFencedBlocks = core.stripMarkdownFencedBlocks;
export const findMarkdownTable = core.findMarkdownTable;
export const markdownRowValue = core.markdownRowValue;
export const markdownRowValues = core.markdownRowValues;
export const extractMarkdownSubsection = core.extractMarkdownSubsection;
export const isNegativeRequirementStatement = core.isNegativeRequirementStatement;
export const positivePlanningText = core.positivePlanningText;
export const hasTechnicalPlaceholderIdContext = core.hasTechnicalPlaceholderIdContext;
export const projectPlanningLabel = core.projectPlanningLabel;
export const projectWorkflowSetDataListProjection = core.projectWorkflowSetDataListProjection;
