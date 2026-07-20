import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const artifact = [resolve(directory, "../../core/yeeflow-app-builder-core-planning.v0.1.0.mjs"), resolve(directory, "../../dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs")].find(existsSync);
if (!artifact) throw new Error("FORM_CONTROL_SCHEMA_CORE_ADAPTER_ARTIFACT_MISSING: Distributed Core Planning artifact is missing.");
const core = await import(pathToFileURL(artifact).href).catch((error) => { throw new Error(`FORM_CONTROL_SCHEMA_CORE_ADAPTER_ARTIFACT_LOAD_FAILED: ${error instanceof Error ? error.message : String(error)}`); });
if (typeof core.projectDataListFormControlStaticSchema !== "function") throw new Error("FORM_CONTROL_SCHEMA_CORE_ADAPTER_EXPORT_MISSING: Required Core facade is missing.");
const project = core.projectDataListFormControlStaticSchema;
export const resolveSchemaAuthoritativeFormControlType = (field = {}) => project({ kind: "resolve", value: field }).value;
export const isTextSchemaType = (value) => project({ kind: "is-text-schema", value }).value;
export const isChoiceSchemaType = (value) => project({ kind: "is-choice-schema", value }).value;
export const isChoiceControlType = (value) => project({ kind: "is-choice-control", value }).value;
export const canonicalControlType = (value) => project({ kind: "canonical-control", value }).value;
