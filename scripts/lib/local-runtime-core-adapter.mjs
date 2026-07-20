import { existsSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const artifactFileName = "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs";
const directory = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(directory, `../../core/${artifactFileName}`),
  resolve(directory, `../../dist/yeeflow-app-builder-plugin/core/${artifactFileName}`),
];
const artifact = candidates.find((candidate) => existsSync(candidate));

if (!artifact) throw new Error("LOCAL_RUNTIME_CORE_ADAPTER_ARTIFACT_MISSING: Distributed Core Local Runtime artifact is missing.");
if (!isApprovedArtifactPath(artifact)) throw new Error("LOCAL_RUNTIME_CORE_ADAPTER_FORBIDDEN_RESOLUTION: Adapter resolution escaped the approved Plugin core artifact locations.");

let runtime;
try {
  runtime = await import(pathToFileURL(artifact).href);
} catch (error) {
  throw new Error(`LOCAL_RUNTIME_CORE_ADAPTER_ARTIFACT_LOAD_FAILED: Distributed Core Local Runtime artifact cannot be imported: ${error instanceof Error ? error.message : String(error)}.`);
}

for (const name of ["lowerFixedFilterProjectionAtHost", "lowerDataListScalarResourceIdentityAtHost", "lowerDataListLookupResolutionAtHost", "lowerDataListType1IdentityControlPlacementAtHost", "lowerDataListSublistScalarSummaryIntentAtHost", "lowerDataListSublistDynamicSummaryIntentAtHost", "lowerDataListSublistNestedControlPlacementAtHost", "lowerDataListSublistEmbeddedLookupIntentAtHost", "lowerDataListSublistIdentityControlIntentAtHost"]) {
  if (typeof runtime[name] !== "function") {
    throw new Error(`LOCAL_RUNTIME_CORE_ADAPTER_EXPORT_MISSING: Required Core Local Runtime export is missing: ${name}.`);
  }
}

export const lowerFixedFilterProjectionAtHost = runtime.lowerFixedFilterProjectionAtHost;
export const lowerDataListScalarResourceIdentityAtHost = runtime.lowerDataListScalarResourceIdentityAtHost;
export const lowerDataListLookupResolutionAtHost = runtime.lowerDataListLookupResolutionAtHost;
export const lowerDataListType1IdentityControlPlacementAtHost = runtime.lowerDataListType1IdentityControlPlacementAtHost;
export const lowerDataListSublistScalarSummaryIntentAtHost = runtime.lowerDataListSublistScalarSummaryIntentAtHost;
export const lowerDataListSublistDynamicSummaryIntentAtHost = runtime.lowerDataListSublistDynamicSummaryIntentAtHost;
export const lowerDataListSublistNestedControlPlacementAtHost = runtime.lowerDataListSublistNestedControlPlacementAtHost;
export const lowerDataListSublistEmbeddedLookupIntentAtHost = runtime.lowerDataListSublistEmbeddedLookupIntentAtHost;
export const lowerDataListSublistIdentityControlIntentAtHost = runtime.lowerDataListSublistIdentityControlIntentAtHost;

function isApprovedArtifactPath(candidate) {
  const expectedRelativePaths = new Set([
    `..${sep}..${sep}core${sep}${artifactFileName}`,
    `..${sep}..${sep}dist${sep}yeeflow-app-builder-plugin${sep}core${sep}${artifactFileName}`,
  ]);
  return expectedRelativePaths.has(relative(directory, candidate));
}
