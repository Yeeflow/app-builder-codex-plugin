import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(directory, "../../core/yeeflow-app-builder-core-planning.v0.1.0.mjs"),
  resolve(directory, "../../dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs"),
];
const artifact = candidates.find((candidate) => existsSync(candidate));
if (!artifact) throw new Error("WORKFLOW_SET_DATA_LIST_CORE_ADAPTER_ARTIFACT_MISSING: Distributed Core Planning artifact is missing.");
let core;
try {
  core = await import(pathToFileURL(artifact).href);
} catch (error) {
  throw new Error(`WORKFLOW_SET_DATA_LIST_CORE_ADAPTER_ARTIFACT_LOAD_FAILED: Distributed Core Planning artifact cannot be imported: ${error instanceof Error ? error.message : String(error)}.`);
}
if (typeof core.projectWorkflowSetDataListProjection !== "function") throw new Error("WORKFLOW_SET_DATA_LIST_CORE_ADAPTER_EXPORT_MISSING: Required Core facade is missing.");

export const projectWorkflowSetDataListProjection = core.projectWorkflowSetDataListProjection;
