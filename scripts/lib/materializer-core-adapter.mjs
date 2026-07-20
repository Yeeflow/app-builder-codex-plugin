import { existsSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const artifactFileName = "yeeflow-app-builder-core-materializer.v0.1.0.mjs";
const directory = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(directory, `../../core/${artifactFileName}`),
  resolve(directory, `../../dist/yeeflow-app-builder-plugin/core/${artifactFileName}`),
];
const artifact = candidates.find((candidate) => existsSync(candidate));

if (!artifact) throw new Error("MATERIALIZER_CORE_ADAPTER_ARTIFACT_MISSING: Distributed Core materializer artifact is missing.");
if (!isApprovedArtifactPath(artifact)) throw new Error("MATERIALIZER_CORE_ADAPTER_FORBIDDEN_RESOLUTION: Adapter resolution escaped the approved Plugin core artifact locations.");

let core;
try {
  core = await import(pathToFileURL(artifact).href);
} catch (error) {
  throw new Error(`MATERIALIZER_CORE_ADAPTER_ARTIFACT_LOAD_FAILED: Distributed Core materializer artifact cannot be imported: ${error instanceof Error ? error.message : String(error)}.`);
}

for (const name of ["normalizeHexColor", "defaultValueForFieldType", "escapeRegExp", "normalizeForLooseFormMatch", "stripPlanningDocumentSuffix", "dependencyName", "safeDependencyIdentifier", "projectDataListScalarField", "projectDataListScalarResourceDefinitionIntent", "projectDataListLookupResolutionIntent", "projectDataListDefaultViewLayout", "projectDataListDefaultViewSelector", "projectDataListAdditionalViewLayout", "projectDataListType1IdentityControlPlacement", "projectDataListEmbeddedSublistDescriptor", "projectDataListSublistStaticConfiguration", "projectDataListSublistScalarSummaryIntent", "projectDataListSublistDynamicSummaryIntent", "projectDataListSublistNestedControlPlacementIntent", "projectDataListSublistEmbeddedLookupIntent", "projectDataListSublistLookupAdditionalFieldIntent", "projectDataListSublistIdentityControlIntent", "projectApprovalFormSubListLookupStaticConfiguration", "projectTemplateStaticNormalization", "projectResourceDefinitionStaticIntent", "projectDocumentLibraryStaticConfiguration", "projectApprovalFormStaticConfiguration", "projectDashboardStaticConfiguration"]) {
  if (typeof core[name] !== "function") {
    throw new Error(`MATERIALIZER_CORE_ADAPTER_EXPORT_MISSING: Required Core export is missing: ${name}.`);
  }
}

export const normalizeHexColor = core.normalizeHexColor;
export const defaultValueForFieldType = core.defaultValueForFieldType;
export const escapeRegExp = core.escapeRegExp;
export const normalizeForLooseFormMatch = core.normalizeForLooseFormMatch;
export const stripPlanningDocumentSuffix = core.stripPlanningDocumentSuffix;
export const dependencyName = core.dependencyName;
export const safeDependencyIdentifier = core.safeDependencyIdentifier;
export const projectDataListScalarField = core.projectDataListScalarField;
export const projectDataListScalarResourceDefinitionIntent = core.projectDataListScalarResourceDefinitionIntent;
export const projectDataListLookupResolutionIntent = core.projectDataListLookupResolutionIntent;
export const projectDataListDefaultViewLayout = core.projectDataListDefaultViewLayout;
export const projectDataListDefaultViewSelector = core.projectDataListDefaultViewSelector;
export const projectDataListAdditionalViewLayout = core.projectDataListAdditionalViewLayout;
export const projectDataListType1IdentityControlPlacement = core.projectDataListType1IdentityControlPlacement;
export const projectDataListEmbeddedSublistDescriptor = core.projectDataListEmbeddedSublistDescriptor;
export const projectDataListSublistStaticConfiguration = core.projectDataListSublistStaticConfiguration;
export const projectDataListSublistScalarSummaryIntent = core.projectDataListSublistScalarSummaryIntent;
export const projectDataListSublistDynamicSummaryIntent = core.projectDataListSublistDynamicSummaryIntent;
export const projectDataListSublistNestedControlPlacementIntent = core.projectDataListSublistNestedControlPlacementIntent;
export const projectDataListSublistEmbeddedLookupIntent = core.projectDataListSublistEmbeddedLookupIntent;
export const projectDataListSublistLookupAdditionalFieldIntent = core.projectDataListSublistLookupAdditionalFieldIntent;
export const projectDataListSublistIdentityControlIntent = core.projectDataListSublistIdentityControlIntent;
export const projectApprovalFormSubListLookupStaticConfiguration = core.projectApprovalFormSubListLookupStaticConfiguration;
export const projectTemplateStaticNormalization = core.projectTemplateStaticNormalization;
export const projectResourceDefinitionStaticIntent = core.projectResourceDefinitionStaticIntent;
export const projectDocumentLibraryStaticConfiguration = core.projectDocumentLibraryStaticConfiguration;
export const projectApprovalFormStaticConfiguration = core.projectApprovalFormStaticConfiguration;
export const projectDashboardStaticConfiguration = core.projectDashboardStaticConfiguration;

function isApprovedArtifactPath(candidate) {
  const expectedRelativePaths = new Set([
    `..${sep}..${sep}core${sep}${artifactFileName}`,
    `..${sep}..${sep}dist${sep}yeeflow-app-builder-plugin${sep}core${sep}${artifactFileName}`,
  ]);
  return expectedRelativePaths.has(relative(directory, candidate));
}
