import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const artifact = [resolve(directory, "../../core/yeeflow-app-builder-core-planning.v0.1.0.mjs"), resolve(directory, "../../dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs")].find((candidate) => existsSync(candidate));
if (!artifact) throw new Error("WORKFLOW_QUERY_DATA_CORE_ADAPTER_ARTIFACT_MISSING: Distributed Core Planning artifact is missing.");
let core;
try { core = await import(pathToFileURL(artifact).href); } catch (error) { throw new Error(`WORKFLOW_QUERY_DATA_CORE_ADAPTER_ARTIFACT_LOAD_FAILED: ${error instanceof Error ? error.message : String(error)}`); }
if (typeof core.projectWorkflowQueryDataStaticPlan !== "function") throw new Error("WORKFLOW_QUERY_DATA_CORE_ADAPTER_EXPORT_MISSING: Required Core facade is missing.");
export const projectWorkflowQueryDataStaticPlan = core.projectWorkflowQueryDataStaticPlan;
