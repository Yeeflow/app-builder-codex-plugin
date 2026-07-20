#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { distributionLeakageFindings } from "./lib/core-distribution-validation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = argumentValue("--output", "dist/yeeflow-app-builder-plugin/core");
const graphPath = resolve(root, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const distributionContractPath = argumentValue("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const materializerPublicApiPath = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const localRuntimePublicApiPath = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const planningPublicApiPath = resolve(root, "compatibility/capability-manifests/app-builder-core-planning-public-api.v0.1.0.json");
const manifestName = "yeeflow-app-builder-core-distribution.v0.1.0.json";
const candidateContext = loadCandidateBuildContext();
const coreVersion = candidateContext?.candidateVersion || process.env.YEEFLOW_CANDIDATE_CORE_VERSION || "0.1.0";
const sourceCommit = candidateContext?.sourceProvenance?.gitHead || process.env.YEEFLOW_CANDIDATE_SOURCE_COMMIT || gitMetadata(["rev-parse", "HEAD"]) || "isolated-snapshot";
const sourceTreeState = candidateContext?.sourceTreeState || process.env.YEEFLOW_CANDIDATE_SOURCE_TREE_STATE || (() => {
  const status = gitMetadata(["status", "--porcelain"]);
  return status === null ? "isolated-snapshot" : (status ? "dirty" : "clean");
})();
const distributedScripts = [
  "lib/markdown-planning-core-adapter.mjs",
  "lib/application-plan-static-foundation-core-adapter.mjs",
  "lib/form-control-type-authority-core-adapter.mjs",
  "lib/markdown-planning-utils.mjs",
  "lib/planning-placeholder-utils.mjs",
  "lib/workflow-set-data-list-projection-core-adapter.mjs",
  "lib/workflow-set-data-list-projection-utils.mjs",
  "lib/workflow-query-data-core-adapter.mjs",
  "lib/workflow-static-plan-core-adapter.mjs",
  "lib/workflow-query-data-utils.mjs",
  "lib/materializer-core-adapter.mjs",
  "lib/approval-form-layout-builder.mjs",
  "lib/data-list-sublist-frozen-descriptor-host-context.mjs",
  "lib/data-list-sublist-dynamic-summary-host-scope-context.mjs",
  "lib/yeeflow-oauth-client.mjs",
  "lib/yeeflow-oauth-login-flow.mjs",
  "lib/yeeflow-oauth-token-claims.mjs",
  "lib/yeeflow-api-auth.mjs",
  "yeeflow-env-utils.mjs",
  "yeeflow-oauth-login.mjs",
  "yeeflow-api-auth-smoke.mjs",
  "yeeflow-api-call-capability.mjs",
  "yeeflow-application-delete.mjs",
  "yeeflow-assignment-routing-api-coverage-test.mjs",
  "yeeflow-directory-connectivity-test.mjs",
  "yeeflow-package-api-automation.mjs",
  "yeeflow-workspace-applications.mjs",
  "yeeflow-workspace-list.mjs",
  "lib/local-runtime-core-adapter.mjs",
  "materialize-full-app-generated-final.mjs",
  "validate-workflow-set-data-list-plan.mjs",
  "validate-set-variable-plan.mjs",
  "validate-form-action-open-resource-plan.mjs",
  "validate-form-action-query-data-plan.mjs",
  "validate-form-action-set-data-list-plan.mjs",
  "validate-workflow-query-data-plan.mjs",
  "validate-workflow-loop-plan.mjs",
  "validate-form-action-print-barcode-plan.mjs",
  "validate-approval-form-layout-template.mjs",
  "validate-functional-spec-to-app-plan-traceability.mjs",
  "validate-app-plan-resource-order.mjs",
  "validate-generation-readiness-review.mjs",
];
const distributionContract = JSON.parse(readFileSync(distributionContractPath, "utf8"));
const materializerPublicApi = JSON.parse(readFileSync(materializerPublicApiPath, "utf8"));
const localRuntimePublicApi = JSON.parse(readFileSync(localRuntimePublicApiPath, "utf8"));
const planningPublicApi = JSON.parse(readFileSync(planningPublicApiPath, "utf8"));
if (!Array.isArray(materializerPublicApi.runtimeExports) || !materializerPublicApi.runtimeExports.length) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Materializer public API contract does not declare runtime exports.");
if (!Array.isArray(localRuntimePublicApi.runtimeExports) || !localRuntimePublicApi.runtimeExports.length) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Local Runtime public API contract does not declare runtime exports.");
if (!Array.isArray(planningPublicApi.runtimeExports) || !planningPublicApi.runtimeExports.length) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Planning public API contract does not declare runtime exports.");
const artifacts = [
  {
    packageName: "@yeeflow/app-builder-core-planning",
    packageVersion: coreVersion,
    sourcePath: "packages/app-builder-core-planning/src/index.ts",
    compiledPath: argumentValue("--compiled", "packages/app-builder-core-planning/lib/index.js"),
    artifactName: "yeeflow-app-builder-core-planning.v0.1.0.mjs",
    exports: planningPublicApi.runtimeExports,
    additionalSourcePaths: ["packages/app-builder-core-planning/src/markdown-planning-utils.ts", "packages/app-builder-core-planning/src/workflow-query-data-static-plan.ts", "packages/app-builder-core-planning/src/workflow-static-plan.ts", "packages/app-builder-core-planning/src/data-list-form-control-static-schema.ts", "packages/app-builder-core-planning/src/application-plan-static-foundation.ts"],
    additionalCompiledPaths: ["packages/app-builder-core-planning/lib/markdown-planning-utils.js", "packages/app-builder-core-planning/lib/workflow-query-data-static-plan.js", "packages/app-builder-core-planning/lib/workflow-static-plan.js", "packages/app-builder-core-planning/lib/data-list-form-control-static-schema.js", "packages/app-builder-core-planning/lib/application-plan-static-foundation.js"],
    prepareArtifactText: preparePlanningArtifactText,
    excludedCompiledExports: ["capabilityMetadata"],
  },
  {
    packageName: "@yeeflow/app-builder-core-materializer",
    packageVersion: coreVersion,
    sourcePath: "packages/app-builder-core-materializer/src/index.ts",
    compiledPath: resolve(root, "packages/app-builder-core-materializer/lib/index.js"),
    artifactName: "yeeflow-app-builder-core-materializer.v0.1.0.mjs",
    exports: materializerPublicApi.runtimeExports,
    additionalSourcePaths: ["packages/app-builder-core-materializer/src/internal/data-list-default-view-layout-projection.ts", "packages/app-builder-core-materializer/src/internal/data-list-additional-view-layout-projection.ts", "packages/app-builder-core-materializer/src/internal/data-list-scalar-resource-definition-intent.ts", "packages/app-builder-core-materializer/src/internal/data-list-lookup-resolution-intent.ts", "packages/app-builder-core-materializer/src/internal/data-list-type1-identity-control-placement.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-scalar-row-schema.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-schema.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-frozen-descriptor-shadow.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-static-configuration.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-scalar-summary-intent.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-dynamic-summary-intent.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-nested-control-placement.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-lookup-intent.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-lookup-additional-field-intent.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-identity-control-intent.ts", "packages/app-builder-core-materializer/src/internal/approval-form-sublist-lookup-static-configuration.ts", "packages/app-builder-core-materializer/src/internal/template-static-normalization.ts", "packages/app-builder-core-materializer/src/internal/resource-definition-static-intent.ts", "packages/app-builder-core-materializer/src/internal/document-library-static-configuration.ts", "packages/app-builder-core-materializer/src/internal/approval-form-static-configuration.ts", "packages/app-builder-core-materializer/src/internal/dashboard-static-configuration.ts"],
    additionalCompiledPaths: ["packages/app-builder-core-materializer/lib/internal/data-list-default-view-layout-projection.js", "packages/app-builder-core-materializer/lib/internal/data-list-additional-view-layout-projection.js", "packages/app-builder-core-materializer/lib/internal/data-list-scalar-resource-definition-intent.js", "packages/app-builder-core-materializer/lib/internal/data-list-lookup-resolution-intent.js", "packages/app-builder-core-materializer/lib/internal/data-list-type1-identity-control-placement.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-scalar-row-schema.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-embedded-schema.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-frozen-descriptor-shadow.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-static-configuration.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-scalar-summary-intent.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-dynamic-summary-intent.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-nested-control-placement.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-embedded-lookup-intent.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-lookup-additional-field-intent.js", "packages/app-builder-core-materializer/lib/internal/data-list-sublist-identity-control-intent.js", "packages/app-builder-core-materializer/lib/internal/approval-form-sublist-lookup-static-configuration.js", "packages/app-builder-core-materializer/lib/internal/template-static-normalization.js", "packages/app-builder-core-materializer/lib/internal/resource-definition-static-intent.js", "packages/app-builder-core-materializer/lib/internal/document-library-static-configuration.js", "packages/app-builder-core-materializer/lib/internal/approval-form-static-configuration.js", "packages/app-builder-core-materializer/lib/internal/dashboard-static-configuration.js"],
    prepareArtifactText: prepareMaterializerArtifactText,
  },
  {
    packageName: "@yeeflow/app-builder-core-local-runtime",
    packageVersion: coreVersion,
    sourcePath: "runtimes/app-builder-core-local-runtime/src/index.ts",
    compiledPath: resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"),
    artifactName: "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs",
    exports: localRuntimePublicApi.runtimeExports,
    additionalSourcePaths: ["runtimes/app-builder-core-local-runtime/src/internal-data-list-scalar-resource-identity-lowering.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-lookup-resolution-lowering.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-type1-identity-control-placement-lowering.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-scalar-row-schema-lowering.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-child-resource-inventory.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-scalar-summary-intent-lowering.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-dynamic-summary-intent-lowering.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-nested-control-placement-lowering.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-embedded-lookup-lowering.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-identity-control-lowering.ts"],
    additionalCompiledPaths: ["runtimes/app-builder-core-local-runtime/lib/internal-data-list-scalar-resource-identity-lowering.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-lookup-resolution-lowering.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-type1-identity-control-placement-lowering.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-scalar-row-schema-lowering.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-child-resource-inventory.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-scalar-summary-intent-lowering.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-dynamic-summary-intent-lowering.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-nested-control-placement-lowering.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-embedded-lookup-lowering.js", "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-identity-control-lowering.js"],
    prepareArtifactText: prepareLocalRuntimeArtifactText,
  },
];

assertContractAlignment(artifacts, distributionContract);
const builtArtifacts = [];
for (const artifact of artifacts) builtArtifacts.push(await buildArtifact(artifact));
const planningArtifact = builtArtifacts.find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-planning");
const graphText = readFileSync(graphPath, "utf8");
const graph = JSON.parse(graphText);
const manifest = {
  schemaVersion: "1.0.0",
  coreVersion,
  packageGraphVersion: graph.graphVersion,
  sourceCommit,
  sourceTreeState,
  primaryArtifactPath: planningArtifact.path,
  sourceInputSha256: planningArtifact.sourceInputSha256,
  compiledInputSha256: planningArtifact.compiledInputSha256,
  dependencyGraphSha256: sha256(graphText),
  artifactSha256: planningArtifact.sha256,
  artifacts: builtArtifacts,
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, manifestName), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
mirrorPluginScripts();
console.log(`CORE_DISTRIBUTION_BUILT artifacts=${builtArtifacts.length} planningSha256=${planningArtifact.sha256}`);
console.log(`CORE_DISTRIBUTION_PLUGIN_MIRRORS_BUILT count=${distributedScripts.length}`);

async function buildArtifact(definition) {
  const sourceFile = resolve(root, definition.sourcePath);
  const compiledFile = definition.compiledPath;
  if (!existsSync(compiledFile)) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", `Compiled artifact is missing: ${definition.compiledPath}.`);
  if (!existsSync(sourceFile)) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", `Core source input is missing: ${definition.sourcePath}.`);
  const rawCompiled = readFileSync(compiledFile, "utf8");
  const compiledModule = await import(pathToFileURL(compiledFile).href);
  const actualExports = Object.keys(compiledModule).filter((name) => !(definition.excludedCompiledExports || []).includes(name)).sort();
  const approvedExports = [...definition.exports].sort();
  if (JSON.stringify(actualExports) !== JSON.stringify(approvedExports)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", `Compiled Core export surface does not match the approved contract: ${definition.artifactName}.`);
  const rawAdditionalCompiled = (definition.additionalCompiledPaths || []).map((relativePath) => {
    const path = resolve(root, relativePath);
    if (!existsSync(path)) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", `Compiled artifact dependency is missing: ${relativePath}.`);
    return { path, text: readFileSync(path, "utf8") };
  });
  const artifactText = (definition.prepareArtifactText
    ? definition.prepareArtifactText(rawCompiled, rawAdditionalCompiled)
    : rawCompiled).replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  if (distributionLeakageFindings(artifactText).length) fail("CORE_DISTRIBUTION_WORKSPACE_LEAKAGE", `Artifact contains forbidden resolution leakage: ${definition.artifactName}.`);
  const outputFile = resolve(outputDir, definition.artifactName);
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, artifactText, "utf8");
  return {
    path: `core/${definition.artifactName}`,
    packageName: definition.packageName,
    packageVersion: definition.packageVersion,
    sourceInputSha256: sha256([readFileSync(sourceFile), ...(definition.additionalSourcePaths || []).map((relativePath) => {
      const path = resolve(root, relativePath);
      if (!existsSync(path)) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", `Core source dependency is missing: ${relativePath}.`);
      return readFileSync(path);
    })].join("\n")),
    compiledInputSha256: sha256([rawCompiled, ...rawAdditionalCompiled.map((item) => item.text)].join("\n")),
    sha256: sha256(artifactText),
    exports: definition.exports,
  };
}

function preparePlanningArtifactText(indexText, additionalCompiled) {
  const markdown = additionalCompiled.find((item) => item.path.endsWith("markdown-planning-utils.js"));
  const workflowQueryData = additionalCompiled.find((item) => item.path.endsWith("workflow-query-data-static-plan.js"));
  const workflowStatic = additionalCompiled.find((item) => item.path.endsWith("workflow-static-plan.js"));
  const formControl = additionalCompiled.find((item) => item.path.endsWith("data-list-form-control-static-schema.js"));
  const applicationPlan = additionalCompiled.find((item) => item.path.endsWith("application-plan-static-foundation.js"));
  if (!markdown || !workflowQueryData || !workflowStatic || !formControl || !applicationPlan) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", "Planning Core compiled dependency is missing.");
  const indexWithoutReexports = indexText
    .replace(/export\s*\{[\s\S]*?\}\s*from\s*["']\.\/markdown-planning-utils\.js["'];?\s*/u, "")
    .replace(/export\s*\{\s*projectWorkflowQueryDataStaticPlan\s*\}\s*from\s*["']\.\/workflow-query-data-static-plan\.js["'];?\s*/u, "")
    .replace(/export\s*\{\s*projectWorkflowStaticPlan\s*\}\s*from\s*["']\.\/workflow-static-plan\.js["'];?\s*/u, "")
    .replace(/export\s*\{\s*projectDataListFormControlStaticSchema\s*\}\s*from\s*["']\.\/data-list-form-control-static-schema\.js["'];?\s*/u, "")
    .replace(/export\s*\{\s*projectApplicationPlanStaticFoundation\s*\}\s*from\s*["']\.\/application-plan-static-foundation\.js["'];?\s*/u, "")
    .replace(/export\s+const\s+capabilityMetadata\s*=\s*\{[\s\S]*?\};?\s*/u, "")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  return `${markdown.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${workflowQueryData.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${workflowStatic.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${formControl.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${applicationPlan.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${indexWithoutReexports}`;
}

function prepareMaterializerArtifactText(indexText, additionalCompiled) {
  const internal = additionalCompiled.find((item) => item.path.endsWith("data-list-default-view-layout-projection.js"));
  const additional = additionalCompiled.find((item) => item.path.endsWith("data-list-additional-view-layout-projection.js"));
  const identity = additionalCompiled.find((item) => item.path.endsWith("data-list-scalar-resource-definition-intent.js"));
  const lookup = additionalCompiled.find((item) => item.path.endsWith("data-list-lookup-resolution-intent.js"));
  const typeOne = additionalCompiled.find((item) => item.path.endsWith("data-list-type1-identity-control-placement.js"));
  const sublist = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-scalar-row-schema.js"));
  const embedded = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-embedded-schema.js"));
  const frozenDescriptor = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-frozen-descriptor-shadow.js"));
  const staticConfiguration = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-static-configuration.js"));
  const summary = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-scalar-summary-intent.js"));
  const dynamicSummary = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-dynamic-summary-intent.js"));
  const nestedControl = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-nested-control-placement.js"));
  const embeddedLookup = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-embedded-lookup-intent.js"));
  const lookupAdditional = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-lookup-additional-field-intent.js"));
  const sublistIdentity = additionalCompiled.find((item) => item.path.endsWith("data-list-sublist-identity-control-intent.js"));
  const approvalLookup = additionalCompiled.find((item) => item.path.endsWith("approval-form-sublist-lookup-static-configuration.js"));
  const templateStatic = additionalCompiled.find((item) => item.path.endsWith("template-static-normalization.js"));
  const resourceStatic = additionalCompiled.find((item) => item.path.endsWith("resource-definition-static-intent.js"));
  const documentLibraryStatic = additionalCompiled.find((item) => item.path.endsWith("document-library-static-configuration.js"));
  const approvalStatic = additionalCompiled.find((item) => item.path.endsWith("approval-form-static-configuration.js"));
  const dashboardStatic = additionalCompiled.find((item) => item.path.endsWith("dashboard-static-configuration.js"));
  if (!internal || !additional || !identity || !lookup || !typeOne || !sublist || !embedded || !frozenDescriptor || !staticConfiguration || !summary || !dynamicSummary || !nestedControl || !embeddedLookup || !lookupAdditional || !sublistIdentity || !approvalLookup || !templateStatic || !resourceStatic || !documentLibraryStatic || !approvalStatic || !dashboardStatic) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", "Materializer internal compiled dependency is missing.");
  const reexport = /export\s*\{\s*projectDataListDefaultViewLayoutInternal\s+as\s+projectDataListDefaultViewLayout\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-default-view-layout-projection\.js["'];?\s*/u;
  const defaultViewSelectorReexport = /export\s*\{\s*projectDataListDefaultViewSelector\s*\}\s*from\s*["']\.\/internal\/data-list-default-view-layout-projection\.js["'];?\s*/u;
  const additionalReexport = /export\s*\{\s*projectDataListAdditionalViewLayoutInternal\s+as\s+projectDataListAdditionalViewLayout\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-additional-view-layout-projection\.js["'];?\s*/u;
  const identityReexport = /export\s*\{\s*projectDataListScalarResourceDefinitionIntentInternal\s+as\s+projectDataListScalarResourceDefinitionIntent\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-scalar-resource-definition-intent\.js["'];?\s*/u;
  const lookupReexport = /export\s*\{\s*projectDataListLookupResolutionIntentInternal\s+as\s+projectDataListLookupResolutionIntent\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-lookup-resolution-intent\.js["'];?\s*/u;
  const typeOneReexport = /export\s*\{\s*projectDataListType1IdentityControlPlacementInternal\s+as\s+projectDataListType1IdentityControlPlacement\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-type1-identity-control-placement\.js["'];?\s*/u;
  const sublistReexport = /export\s*\{\s*projectDataListSublistScalarRowSchemaInternal\s+as\s+projectDataListSublistScalarRowSchema\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-scalar-row-schema\.js["'];?\s*/u;
  const staticConfigurationReexport = /export\s*\{\s*projectDataListSublistStaticConfigurationInternal\s+as\s+projectDataListSublistStaticConfiguration\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-static-configuration\.js["'];?\s*/u;
  const summaryReexport = /export\s*\{\s*projectDataListSublistScalarSummaryIntentInternal\s+as\s+projectDataListSublistScalarSummaryIntent\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-scalar-summary-intent\.js["'];?\s*/u;
  const dynamicSummaryReexport = /export\s*\{\s*projectDataListSublistDynamicSummaryIntentInternal\s+as\s+projectDataListSublistDynamicSummaryIntent\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-dynamic-summary-intent\.js["'];?\s*/u;
  const nestedControlReexport = /export\s*\{\s*projectDataListSublistNestedControlPlacementIntentInternal\s+as\s+projectDataListSublistNestedControlPlacementIntent\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-nested-control-placement\.js["'];?\s*/u;
  const embeddedLookupReexport = /export\s*\{\s*projectDataListSublistEmbeddedLookupIntentInternal\s+as\s+projectDataListSublistEmbeddedLookupIntent\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-embedded-lookup-intent\.js["'];?\s*/u;
  const lookupAdditionalReexport = /export\s*\{\s*projectDataListSublistLookupAdditionalFieldIntentInternal\s+as\s+projectDataListSublistLookupAdditionalFieldIntent\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-lookup-additional-field-intent\.js["'];?\s*/u;
  const sublistIdentityReexport = /export\s*\{\s*projectDataListSublistIdentityControlIntentInternal\s+as\s+projectDataListSublistIdentityControlIntent\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-identity-control-intent\.js["'];?\s*/u;
  const approvalLookupReexport = /export\s*\{\s*projectApprovalFormSubListLookupStaticConfigurationInternal\s+as\s+projectApprovalFormSubListLookupStaticConfiguration\s*,?\s*\}\s*from\s*["']\.\/internal\/approval-form-sublist-lookup-static-configuration\.js["'];?\s*/u;
  const templateStaticReexport = /export\s*\{\s*projectTemplateStaticNormalization\s*\}\s*from\s*["']\.\/internal\/template-static-normalization\.js["'];?\s*/u;
  const resourceStaticReexport = /export\s*\{\s*projectResourceDefinitionStaticIntent\s*\}\s*from\s*["']\.\/internal\/resource-definition-static-intent\.js["'];?\s*/u;
  const documentLibraryStaticReexport = /export\s*\{\s*projectDocumentLibraryStaticConfiguration\s*\}\s*from\s*["']\.\/internal\/document-library-static-configuration\.js["'];?\s*/u;
  const approvalStaticReexport = /export\s*\{\s*projectApprovalFormStaticConfiguration\s*\}\s*from\s*["']\.\/internal\/approval-form-static-configuration\.js["'];?\s*/u;
  const dashboardStaticReexport = /export\s*\{\s*projectDashboardStaticConfiguration\s*\}\s*from\s*["']\.\/internal\/dashboard-static-configuration\.js["'];?\s*/u;
  const internalImport = /import\s*\{\s*projectFixedFilterIntents\s*,?\s*\}\s*from\s*["']\.\.\/index\.js["'];?\s*/u;
  const internalExport = /export\s+function\s+projectDataListDefaultViewLayoutInternal\s*\(/u;
  const additionalImport = /import\s*\{\s*projectDataListDefaultViewLayoutInternal\s*,?\s*\}\s*from\s*["']\.\/data-list-default-view-layout-projection\.js["'];?\s*/u;
  const additionalExport = /export\s+function\s+projectDataListAdditionalViewLayoutInternal\s*\(/u;
  if (!reexport.test(indexText) || !defaultViewSelectorReexport.test(indexText) || !additionalReexport.test(indexText) || !identityReexport.test(indexText) || !lookupReexport.test(indexText) || !typeOneReexport.test(indexText) || !sublistReexport.test(indexText) || !staticConfigurationReexport.test(indexText) || !summaryReexport.test(indexText) || !dynamicSummaryReexport.test(indexText) || !nestedControlReexport.test(indexText) || !embeddedLookupReexport.test(indexText) || !lookupAdditionalReexport.test(indexText) || !sublistIdentityReexport.test(indexText) || !approvalLookupReexport.test(indexText) || !templateStaticReexport.test(indexText) || !resourceStaticReexport.test(indexText) || !documentLibraryStaticReexport.test(indexText) || !approvalStaticReexport.test(indexText) || !dashboardStaticReexport.test(indexText) || !internalImport.test(internal.text) || !internalExport.test(internal.text) || !additionalImport.test(additional.text) || !additionalExport.test(additional.text)) {
    fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Materializer LayoutView public promotion bundle shape is invalid.");
  }
  const bundledIndex = indexText
    .replace(reexport, "")
    .replace(defaultViewSelectorReexport, "")
    .replace(additionalReexport, "")
    .replace(identityReexport, "")
    .replace(lookupReexport, "")
    .replace(typeOneReexport, "")
    .replace(sublistReexport, "")
    .replace(staticConfigurationReexport, "")
    .replace(summaryReexport, "")
    .replace(dynamicSummaryReexport, "")
    .replace(nestedControlReexport, "")
    .replace(embeddedLookupReexport, "")
    .replace(lookupAdditionalReexport, "")
    .replace(sublistIdentityReexport, "")
    .replace(approvalLookupReexport, "")
    .replace(templateStaticReexport, "")
    .replace(resourceStaticReexport, "")
    .replace(documentLibraryStaticReexport, "")
    .replace(approvalStaticReexport, "")
    .replace(dashboardStaticReexport, "")
    .replace(nestedControlReexport, "")
    .replace(/import\s*\{\s*projectDataListSublistFrozenDescriptorInternal\s*,?\s*\}\s*from\s*["']\.\/internal\/data-list-sublist-frozen-descriptor-shadow\.js["'];?\s*/u, "")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledInternal = internal.text
    .replace(internalImport, "")
    .replace(internalExport, "export function projectDataListDefaultViewLayout(")
    .replace(/\bnormalizedKey\b/gu, "layoutViewNormalizedKey")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledAdditional = additional.text
    .replace(additionalImport, "")
    .replace(additionalExport, "export function projectDataListAdditionalViewLayout(")
    .replace(/\bprojectDataListDefaultViewLayoutInternal\b/gu, "projectDataListDefaultViewLayout")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledLookup = lookup.text
    .replace(/export function projectDataListLookupResolutionIntentInternal/u, "export function projectDataListLookupResolutionIntent")
    .replace(/\bnormalizeKey\b/gu, "lookupResolutionNormalizedKey")
    .replace(/\bunique\b/gu, "lookupResolutionUnique")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledTypeOne = typeOne.text
    .replace(/export function projectDataListType1IdentityControlPlacementInternal/u, "export function projectDataListType1IdentityControlPlacement")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledSublist = sublist.text
    .replace(/export function projectDataListSublistScalarRowSchemaInternal/u, "export function projectDataListSublistScalarRowSchema")
    .replace(/\bnormalizeRow\b/gu, "sublistNormalizeRow")
    .replace(/\bscalarType\b/gu, "sublistScalarType")
    .replace(/\brequiredText\b/gu, "sublistRequiredText")
    .replace(/\blosslessId\b/gu, "sublistLosslessId")
    .replace(/\bclean\b/gu, "sublistClean")
    .replace(/\bfreeze\b/gu, "sublistFreeze")
    .replace(/Object\.sublistFreeze/gu, "Object.freeze")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledEmbedded = embedded.text.replace(/export function /gu, "function ").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledFrozen = frozenDescriptor.text.replace(/import[\s\S]*?from\s*["']\.\/data-list-sublist-embedded-schema\.js["'];?\s*/u, "").replace(/export function projectDataListSublistFrozenDescriptorInternal/u, "function projectDataListSublistFrozenDescriptorInternal").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledStaticConfiguration = staticConfiguration.text.replace(/export function projectDataListSublistStaticConfigurationInternal/u, "export function projectDataListSublistStaticConfiguration").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledSummary = summary.text.replace(/export function projectDataListSublistScalarSummaryIntentInternal/u, "export function projectDataListSublistScalarSummaryIntent").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledDynamicSummary = dynamicSummary.text
    .replace(/export function projectDataListSublistDynamicSummaryIntentInternal/u, "export function projectDataListSublistDynamicSummaryIntent")
    .replace(/\boperations\b/gu, "dynamicSummaryOperations")
    .replace(/\btext\b/gu, "dynamicSummaryText")
    .replace(/\bfinding\b/gu, "dynamicSummaryFinding")
    .replace(/\bfrozenResult\b/gu, "dynamicSummaryFrozenResult")
    .replace(/Object\.dynamicSummaryFrozenResult/gu, "Object.freeze")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledNestedControl = nestedControl.text
    .replace(/export function projectDataListSublistNestedControlPlacementIntentInternal/u, "export function projectDataListSublistNestedControlPlacementIntent")
    .replace(/\bscalarTypes\b/gu, "nestedControlScalarTypes")
    .replace(/\bcontrolKind\b/gu, "nestedControlKind")
    .replace(/\blossless\b/gu, "nestedControlLossless")
    .replace(/\btext\(/gu, "nestedControlText(")
    .replace(/function nestedControlText/u, "function nestedControlText")
    .replace(/\bfinding\(/gu, "nestedControlFinding(")
    .replace(/function nestedControlFinding/u, "function nestedControlFinding")
    .replace(/\bfrozen\(/gu, "nestedControlFrozen(")
    .replace(/function nestedControlFrozen/u, "function nestedControlFrozen")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledEmbeddedLookup = embeddedLookup.text.replace(/export function projectDataListSublistEmbeddedLookupIntentInternal/u, "export function projectDataListSublistEmbeddedLookupIntent").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledLookupAdditional = lookupAdditional.text.replace(/export function projectDataListSublistLookupAdditionalFieldIntentInternal/u, "export function projectDataListSublistLookupAdditionalFieldIntent").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledSublistIdentity = sublistIdentity.text.replace(/export function projectDataListSublistIdentityControlIntentInternal/u, "export function projectDataListSublistIdentityControlIntent").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledApprovalLookup = approvalLookup.text.replace(/export function projectApprovalFormSubListLookupStaticConfigurationInternal/u, "export function projectApprovalFormSubListLookupStaticConfiguration").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledTemplateStatic = templateStatic.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledResourceStatic = resourceStatic.text.replace(/\bkey\b/gu, "resourceStaticKey").replace(/\brec\b/gu, "resourceStaticRecord").replace(/\bchildren\b/gu, "resourceStaticChildren").replace(/\bfreeze\b/gu, "resourceStaticFreeze").replace(/Object\.resourceStaticFreeze/gu, "Object.freeze").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledDocumentLibraryStatic = documentLibraryStatic.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledApprovalStatic = approvalStatic.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledDashboardStatic = dashboardStatic.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  return `${bundledEmbedded}\n${bundledFrozen}\n${bundledIndex}\n${bundledInternal}\n${bundledAdditional}\n${identity.text.replace(/export function projectDataListScalarResourceDefinitionIntentInternal/u, "export function projectDataListScalarResourceDefinitionIntent").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${bundledLookup}\n${bundledTypeOne}\n${bundledSublist}\n${bundledStaticConfiguration}\n${bundledSummary}\n${bundledDynamicSummary}\n${bundledNestedControl}\n${bundledEmbeddedLookup}\n${bundledLookupAdditional}\n${bundledSublistIdentity}\n${bundledApprovalLookup}\n${bundledTemplateStatic}\n${bundledResourceStatic}\n${bundledDocumentLibraryStatic}\n${bundledApprovalStatic}\n${bundledDashboardStatic}`;
}

function prepareLocalRuntimeArtifactText(indexText, additionalCompiled) {
  const identity = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-scalar-resource-identity-lowering.js"));
  const lookup = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-lookup-resolution-lowering.js"));
  const typeOne = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-type1-identity-control-placement-lowering.js"));
  const sublist = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-sublist-scalar-row-schema-lowering.js"));
  const inventory = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-sublist-child-resource-inventory.js"));
  const summary = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-sublist-scalar-summary-intent-lowering.js"));
  const dynamicSummary = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-sublist-dynamic-summary-intent-lowering.js"));
  const nestedControl = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-sublist-nested-control-placement-lowering.js"));
  const embeddedLookup = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-sublist-embedded-lookup-lowering.js"));
  const sublistIdentity = additionalCompiled.find((item) => item.path.endsWith("internal-data-list-sublist-identity-control-lowering.js"));
  const reexport = /export\s*\{\s*lowerDataListScalarResourceIdentityAtHost\s*\}\s*from\s*["']\.\/internal-data-list-scalar-resource-identity-lowering\.js["'];?\s*/u;
  const lookupReexport = /export\s*\{\s*lowerDataListLookupResolutionAtHost\s*\}\s*from\s*["']\.\/internal-data-list-lookup-resolution-lowering\.js["'];?\s*/u;
  const typeOneReexport = /export\s*\{\s*lowerDataListType1IdentityControlPlacementAtHost\s*\}\s*from\s*["']\.\/internal-data-list-type1-identity-control-placement-lowering\.js["'];?\s*/u;
  const sublistReexport = /export\s*\{\s*lowerDataListSublistScalarRowSchemaAtHostInternal\s+as\s+lowerDataListSublistScalarRowSchemaAtHost\s*\}\s*from\s*["']\.\/internal-data-list-sublist-scalar-row-schema-lowering\.js["'];?\s*/u;
  const inventoryReexport = /export\s*\{\s*buildDataListSublistChildResourceInventoryInternal\s+as\s+buildDataListSublistChildResourceInventoryAtHost\s*\}\s*from\s*["']\.\/internal-data-list-sublist-child-resource-inventory\.js["'];?\s*/u;
  const summaryReexport = /export\s*\{\s*lowerDataListSublistScalarSummaryIntentAtHost\s*\}\s*from\s*["']\.\/internal-data-list-sublist-scalar-summary-intent-lowering\.js["'];?\s*/u;
  const dynamicSummaryReexport = /export\s*\{\s*lowerDataListSublistDynamicSummaryIntentAtHost\s*\}\s*from\s*["']\.\/internal-data-list-sublist-dynamic-summary-intent-lowering\.js["'];?\s*/u;
  const nestedControlReexport = /export\s*\{\s*lowerDataListSublistNestedControlPlacementAtHost\s*\}\s*from\s*["']\.\/internal-data-list-sublist-nested-control-placement-lowering\.js["'];?\s*/u;
  const embeddedLookupReexport = /export\s*\{\s*lowerDataListSublistEmbeddedLookupIntentAtHost\s*\}\s*from\s*["']\.\/internal-data-list-sublist-embedded-lookup-lowering\.js["'];?\s*/u;
  const sublistIdentityReexport = /export\s*\{\s*lowerDataListSublistIdentityControlIntentAtHost\s*\}\s*from\s*["']\.\/internal-data-list-sublist-identity-control-lowering\.js["'];?\s*/u;
  if (!identity || !lookup || !typeOne || !sublist || !inventory || !summary || !dynamicSummary || !nestedControl || !embeddedLookup || !sublistIdentity || !reexport.test(indexText) || !lookupReexport.test(indexText) || !typeOneReexport.test(indexText) || !sublistReexport.test(indexText) || !inventoryReexport.test(indexText) || !summaryReexport.test(indexText) || !dynamicSummaryReexport.test(indexText) || !nestedControlReexport.test(indexText) || !embeddedLookupReexport.test(indexText) || !sublistIdentityReexport.test(indexText)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Local Runtime bundle shape is invalid.");
  const bundledSublist = sublist.text
    .replace(/export function lowerDataListSublistScalarRowSchemaAtHostInternal/u, "export function lowerDataListSublistScalarRowSchemaAtHost")
    .replace(/\btext\b/gu, "sublistText")
    .replace(/\breference\b/gu, "sublistReference")
    .replace(/\.sublistReference/gu, ".reference")
    .replace(/\bduplicates\b/gu, "sublistDuplicates")
    .replace(/\bfail\b/gu, "sublistFail")
    .replace(/\bfreeze\b/gu, "sublistFreeze")
    .replace(/Object\.sublistFreeze/gu, "Object.freeze")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledInventory = inventory.text
    .replace(/export const sublistChildResourceIdentityErrors/u, "const sublistChildResourceIdentityErrors")
    .replace(/export function buildDataListSublistChildResourceInventoryInternal/u, "export function buildDataListSublistChildResourceInventoryAtHost")
    .replace(/\bidentity\b/gu, "inventoryIdentity")
    .replace(/\blogicalKey\b/gu, "inventoryLogicalKey")
    .replace(/\bcompare\b/gu, "inventoryCompare")
    .replace(/\bfail\b/gu, "inventoryFail")
    .replace(/\bdeepFreeze\b/gu, "inventoryDeepFreeze")
    .replace(/Object\.inventoryDeepFreeze/gu, "Object.freeze")
    .replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledDynamicSummary = dynamicSummary.text.replace(/\boperations\b/gu, "dynamicSummaryOperations").replace(/\btext\b/gu, "dynamicSummaryText").replace(/\bfail\b/gu, "dynamicSummaryFail").replace(/Object\.dynamicSummaryFail/gu, "Object.freeze").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  const bundledNestedControl = nestedControl.text.replace(/\btext\(/gu, "nestedControlText(").replace(/function nestedControlText/u, "function nestedControlText").replace(/\bfail\(/gu, "nestedControlFail(").replace(/function nestedControlFail/u, "function nestedControlFail").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  return `${indexText.replace(reexport, "").replace(lookupReexport, "").replace(typeOneReexport, "").replace(sublistReexport, "").replace(inventoryReexport, "").replace(summaryReexport, "").replace(dynamicSummaryReexport, "").replace(nestedControlReexport, "").replace(embeddedLookupReexport, "").replace(sublistIdentityReexport, "").replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${identity.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${lookup.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${typeOne.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${bundledSublist}\n${bundledInventory}\n${summary.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${bundledDynamicSummary}\n${bundledNestedControl}\n${embeddedLookup.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}\n${sublistIdentity.text.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "")}`;
}

function assertContractAlignment(definitions, contract) {
  if (!Array.isArray(contract.approvedArtifacts) || contract.approvedArtifacts.length !== definitions.length) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Distribution contract does not declare every build artifact.");
  for (const definition of definitions) {
    const path = `core/${definition.artifactName}`;
    const approved = contract.approvedArtifacts.find((artifact) => artifact?.path === path);
    if (!approved || approved.packageName !== definition.packageName || approved.packageVersion !== definition.packageVersion || JSON.stringify(approved.exports) !== JSON.stringify(definition.exports)) {
      fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", `Distribution contract does not match the approved source export surface: ${path}.`);
    }
  }
}

function mirrorPluginScripts() {
  const pluginRoot = resolve(root, "dist/yeeflow-app-builder-plugin");
  for (const relativePath of distributedScripts) {
    const sourceFile = resolve(root, "scripts", relativePath);
    const distributionFile = resolve(pluginRoot, "scripts", relativePath);
    mkdirSync(dirname(distributionFile), { recursive: true });
    copyFileSync(sourceFile, distributionFile);
  }
}

function argumentValue(option, fallback) {
  const index = process.argv.indexOf(option);
  return resolve(root, index < 0 ? fallback : process.argv[index + 1]);
}
function gitMetadata(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}
function loadCandidateBuildContext() {
  const file = resolve(root, ".yeeflow-candidate-build-context.json");
  if (!existsSync(file)) return null;
  const context = JSON.parse(readFileSync(file, "utf8"));
  if (context?.schemaVersion !== "1.0.0" || !/^1\.0\.0-rc\.\d+$/u.test(context?.candidateVersion || "") || typeof context?.candidateId !== "string" || typeof context?.sourceProvenance?.gitHead !== "string" || typeof context?.sourceTreeState !== "string") {
    fail("CORE_CANDIDATE_BUILD_CONTEXT_INVALID", "Candidate build context is missing required immutable provenance.");
  }
  for (const [key, value] of [["YEEFLOW_CANDIDATE_CORE_VERSION", context.candidateVersion], ["YEEFLOW_CANDIDATE_SOURCE_COMMIT", context.sourceProvenance.gitHead], ["YEEFLOW_CANDIDATE_SOURCE_TREE_STATE", context.sourceTreeState]]) {
    if (process.env[key] && process.env[key] !== value) fail("CORE_CANDIDATE_BUILD_CONTEXT_MISMATCH", `Candidate build context conflicts with ${key}.`);
  }
  return context;
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
