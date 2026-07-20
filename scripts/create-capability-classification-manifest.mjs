#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(
  repositoryRoot,
  "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json",
);
const baseMigrationOwnedPaths = [
  ".gitignore",
  "docs/architecture/yeeflow-app-builder-core-handoff.md",
  "docs/architecture/yeeflow-app-builder-core-migration-state.json",
  "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json",
  "compatibility/capability-manifests/english-only-allowlist.json",
  "compatibility/plugin-baselines/yeeflow-app-builder-source-dist-topology.v0.9.71.json",
  "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json",
  "compatibility/capability-manifests/yeeflow-app-builder-mixed-file-decomposition.v0.9.71.json",
  "docs/architecture/yeeflow-app-builder-mixed-file-decomposition-audit.v0.9.71.md",
  "compatibility/capability-manifests/materializer-seam-audit.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-materializer-seam-audit.v0.1.0.md",
  "compatibility/capability-manifests/field-control-projection-audit.v0.1.0.json",
  "compatibility/capability-manifests/field-control-projection-capability-matrix.v0.1.0.json",
  "compatibility/capability-manifests/data-list-scalar-field-projection-contract.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-5a-field-control-projection.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5b-data-list-scalar-field-projection.v0.1.0.md",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "tsconfig.json",
  "scripts/create-capability-classification-manifest.mjs",
  "scripts/validate-capability-classification-manifest.mjs",
  "scripts/validate-english-only-content.mjs",
  "scripts/test-english-only-content-gate.mjs",
  "scripts/create-source-dist-topology-contract.mjs",
  "scripts/validate-source-dist-topology.mjs",
  "scripts/test-phase0-topology-and-capability-manifests.mjs",
  "compatibility/capability-manifests/core-v1-rc-application-e2e-coverage-matrix.v1.0.0.json",
  "compatibility/capability-manifests/core-v1-rc-candidate-assembly-contract.v1.0.0.json",
  "compatibility/capability-manifests/core-v1-rc-rollback-install-plan.v1.0.0.json",
  "compatibility/capability-manifests/core-v1-rc-integration-readiness.v1.0.0.json",
  "docs/architecture/yeeflow-app-builder-core-v1-release-candidate-integration-and-application-e2e-readiness.v1.0.0.md",
  "scripts/create-core-v1-rc-integration-readiness-evidence.mjs",
  "scripts/validate-core-v1-rc-integration-readiness.mjs",
  "scripts/test-core-v1-rc-integration-readiness.mjs",
  "scripts/create-phase1-workspace-skeleton.mjs",
  "scripts/test-workspace-skeleton.mjs",
  "scripts/validate-workspace-package-boundaries.mjs",
  "scripts/validate-dependency-boundaries.mjs",
  "scripts/test-dependency-boundaries.mjs",
  "scripts/create-mixed-file-decomposition-ledger.mjs",
  "scripts/validate-mixed-file-decomposition-ledger.mjs",
  "scripts/test-mixed-file-decomposition-ledger.mjs",
  "scripts/create-materializer-seam-audit.mjs",
  "scripts/validate-materializer-seam-audit.mjs",
  "scripts/test-materializer-seam-audit.mjs",
  "scripts/test-materializer-normalize-hex-differential.mjs",
  "scripts/test-materializer-default-value-differential.mjs",
  "scripts/test-materializer-default-value-adapter-routing.mjs",
  "scripts/test-materializer-escape-regexp-differential.mjs",
  "scripts/test-materializer-escape-regexp-adapter-routing.mjs",
  "scripts/test-materializer-normalize-loose-form-match-differential.mjs",
  "scripts/test-materializer-normalize-loose-form-match-adapter-routing.mjs",
  "scripts/test-materializer-strip-planning-document-suffix-differential.mjs",
  "scripts/test-materializer-strip-planning-document-suffix-adapter-routing.mjs",
  "scripts/test-materializer-dependency-name-differential.mjs",
  "scripts/test-materializer-dependency-name-adapter-routing.mjs",
  "scripts/test-materializer-safe-dependency-identifier-differential.mjs",
  "scripts/test-materializer-safe-dependency-identifier-adapter-routing.mjs",
  "scripts/validate-field-control-projection-audit.mjs",
  "scripts/test-field-control-projection-audit.mjs",
  "scripts/test-data-list-scalar-field-projection-differential.mjs",
  "scripts/validate-data-list-scalar-field-projection-public-api.mjs",
  "scripts/test-data-list-scalar-field-projection-distribution.mjs",
  "scripts/test-data-list-scalar-field-projection-distribution-gates.mjs",
  "scripts/validate-data-list-scalar-field-projection-routing-readiness.mjs",
  "scripts/validate-markdown-planning-differential.mjs",
  "scripts/test-markdown-planning-differential.mjs",
  "compatibility/differential-fixtures/markdown-planning-utils.v0.9.71.json",
  "compatibility/capability-manifests/yeeflow-app-builder-core-architecture-convergence.v0.1.0.json",
  "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json",
  "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-core-architecture-convergence.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-core-distribution.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-core-materializer-public-api.v0.1.0.md",
  "scripts/validate-architecture-convergence.mjs",
  "scripts/test-architecture-convergence.mjs",
  "scripts/build-core-distribution.mjs",
  "scripts/validate-core-distribution.mjs",
  "scripts/build-plugin-archive.mjs",
  "scripts/test-core-distribution-gates.mjs",
  "scripts/test-core-distribution-resolution.mjs",
  "scripts/test-materializer-core-public-api-contract.mjs",
  "scripts/test-materializer-core-distribution-resolution.mjs",
  "scripts/lib/materializer-core-adapter.mjs",
  "scripts/validate-materializer-core-adapter.mjs",
  "scripts/test-materializer-core-adapter-gates.mjs",
  "scripts/test-materializer-normalize-hex-adapter-routing.mjs",
  "scripts/lib/core-distribution-validation.mjs",
  "scripts/lib/markdown-planning-core-adapter.mjs",
  "scripts/validate-markdown-planning-core-adapter.mjs",
  "scripts/test-markdown-planning-core-adapter-parity.mjs",
  "scripts/test-markdown-planning-core-adapter-resolution.mjs",
  "scripts/test-markdown-planning-core-adapter-selected-callers.mjs",
  "scripts/test-form-action-print-barcode-core-adapter-parity.mjs",
  "scripts/test-form-action-print-barcode-core-adapter-resolution.mjs",
  "compatibility/differential-fixtures/form-action-print-barcode-plan.v0.9.71.json",
  "scripts/test-approval-form-layout-core-adapter-parity.mjs",
  "scripts/test-approval-form-layout-core-adapter-resolution.mjs",
  "compatibility/differential-fixtures/approval-form-layout-template.v0.9.71.json",
  "scripts/test-functional-spec-traceability-core-adapter-parity.mjs",
  "scripts/test-functional-spec-traceability-core-adapter-resolution.mjs",
  "compatibility/differential-fixtures/functional-spec-to-app-plan-traceability.v0.9.71.json",
  "scripts/test-resource-order-core-adapter-parity.mjs",
  "scripts/test-resource-order-core-adapter-resolution.mjs",
  "compatibility/differential-fixtures/app-plan-resource-order.v0.9.71.json",
  "scripts/test-generation-readiness-core-adapter-parity.mjs",
  "scripts/test-generation-readiness-core-adapter-resolution.mjs",
  "compatibility/differential-fixtures/generation-readiness-review.v0.9.71.json",
  "compatibility/differential-fixtures/materializer-normalize-hex-color.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-normalize-hex-materializer-integration.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-default-value-for-field-type.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-default-value-for-field-type-integration.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-escape-regexp.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-escape-regexp-materializer-integration.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-normalize-loose-form-match.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-normalize-loose-form-match-integration.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-strip-planning-document-suffix.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-strip-planning-document-suffix-integration.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-dependency-name.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-dependency-name-integration.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-safe-dependency-identifier.v0.1.0.json",
  "compatibility/differential-fixtures/materializer-safe-dependency-identifier-integration.v0.1.0.json",
  "compatibility/differential-fixtures/data-list-scalar-field-projection.v0.1.0.json",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs",
  "compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json",
  "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json",
  "compatibility/capability-manifests/fixed-filter-key-findings-host-contract.v0.1.0.json",
  "compatibility/capability-manifests/data-list-default-view-layout-distribution-readiness.v0.1.0.json",
  "compatibility/capability-manifests/local-runtime-fixed-filter-lowering-distribution-readiness.v0.1.0.json",
  "compatibility/capability-manifests/data-list-default-view-layout-public-api-readiness.v0.1.0.json",
  "compatibility/capability-manifests/data-list-default-view-layout-public-api-promotion.v0.1.0.json",
  "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json",
  "compatibility/differential-fixtures/fixed-filter-parser-host-lowering.v0.1.0.json",
  "compatibility/differential-fixtures/data-list-default-view-layout-projection.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-5e-remaining-field-control-projection-family-audit.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5f-resource-definition-construction-contract-audit.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5h-fixed-filter-key-findings-host-contract-audit.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5i-fixed-filter-parser-host-lowering-shadow.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5j-data-list-default-view-layout-projection-reaudit.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5k-data-list-default-view-layout-internal-shadow.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5l-data-list-default-view-layout-distribution-readiness-audit.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5m-local-runtime-fixed-filter-lowering-distribution-contract-audit.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5n-local-runtime-fixed-filter-lowering-distribution-proof.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5o-data-list-default-view-layout-public-api-readiness-audit.v0.1.0.md",
  "docs/architecture/yeeflow-app-builder-phase-5p-data-list-default-view-layout-public-api-promotion.v0.1.0.md",
  "scripts/create-phase5e-field-control-projection-family-audit.mjs",
  "scripts/validate-phase5e-field-control-projection-family-audit.mjs",
  "scripts/test-phase5e-field-control-projection-family-audit.mjs",
  "scripts/create-phase5f-resource-definition-contract-audit.mjs",
  "scripts/validate-phase5f-resource-definition-construction-audit.mjs",
  "scripts/test-phase5f-resource-definition-construction-audit.mjs",
  "scripts/create-phase5h-fixed-filter-key-findings-host-contract-audit.mjs",
  "scripts/validate-phase5h-fixed-filter-key-findings-host-contract.mjs",
  "scripts/test-phase5h-fixed-filter-key-findings-host-contract.mjs",
  "scripts/validate-fixed-filter-parser-host-lowering-shadow.mjs",
  "scripts/test-fixed-filter-parser-host-lowering-differential.mjs",
  "scripts/test-fixed-filter-parser-host-lowering-gates.mjs",
  "scripts/test-fixed-filter-parser-distribution.mjs",
  "scripts/validate-data-list-default-view-layout-internal-shadow.mjs",
  "scripts/test-data-list-default-view-layout-projection-differential.mjs",
  "scripts/test-data-list-default-view-layout-projection-gates.mjs",
  "scripts/create-phase5l-data-list-default-view-layout-distribution-readiness-audit.mjs",
  "scripts/validate-phase5l-data-list-default-view-layout-distribution-readiness.mjs",
  "scripts/test-phase5l-data-list-default-view-layout-distribution-readiness.mjs",
  "scripts/create-phase5m-local-runtime-fixed-filter-lowering-distribution-contract-audit.mjs",
  "scripts/validate-phase5m-local-runtime-fixed-filter-lowering-distribution-contract.mjs",
  "scripts/test-phase5m-local-runtime-fixed-filter-lowering-distribution-contract.mjs",
  "scripts/validate-local-runtime-fixed-filter-lowering-public-api.mjs",
  "scripts/test-local-runtime-fixed-filter-lowering-distribution.mjs",
  "scripts/test-local-runtime-fixed-filter-lowering-distribution-gates.mjs",
  "scripts/create-phase5o-data-list-default-view-layout-public-api-readiness-audit.mjs",
  "scripts/validate-phase5o-data-list-default-view-layout-public-api-readiness.mjs",
  "scripts/test-phase5o-data-list-default-view-layout-public-api-readiness.mjs",
  "scripts/create-phase5p-data-list-default-view-layout-public-api-promotion.mjs",
  "scripts/validate-phase5p-data-list-default-view-layout-public-api-promotion.mjs",
  "scripts/validate-data-list-default-view-layout-public-api.mjs",
  "scripts/test-data-list-default-view-layout-distribution.mjs",
  "scripts/test-data-list-default-view-layout-distribution-gates.mjs",
  "compatibility/capability-manifests/data-list-lookup-resolution-dual-public-distribution-promotion.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-6d-data-list-lookup-resolution-dual-public-distribution-promotion.v0.1.0.md",
  "scripts/create-phase6d-data-list-lookup-resolution-dual-public-distribution-promotion.mjs",
  "scripts/validate-phase6d-data-list-lookup-resolution-dual-public-distribution-promotion.mjs",
  "scripts/validate-data-list-lookup-resolution-public-api.mjs",
  "scripts/test-data-list-lookup-resolution-distribution.mjs",
  "scripts/test-data-list-lookup-resolution-distribution-gates.mjs",
  "compatibility/differential-fixtures/data-list-lookup-resolution-routing.v0.1.0.json",
  "compatibility/capability-manifests/data-list-lookup-resolution-selective-routing-proof.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-6e-data-list-lookup-resolution-selective-routing-proof.v0.1.0.md",
  "scripts/create-phase6e-data-list-lookup-resolution-routing-proof.mjs",
  "scripts/validate-phase6e-data-list-lookup-resolution-routing-proof.mjs",
  "scripts/test-data-list-lookup-resolution-adapter-routing.mjs",
  "compatibility/capability-manifests/data-list-lookup-resolution-family-closure.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-6f-data-list-lookup-resolution-family-closure.v0.1.0.md",
  "scripts/create-phase6f-data-list-lookup-family-closure-audit.mjs",
  "scripts/validate-phase6f-data-list-lookup-family-closure.mjs",
  "scripts/test-phase6f-data-list-lookup-family-closure.mjs",
  "compatibility/capability-manifests/data-list-advanced-field-template-graph-contract.v0.1.0.json",
  "compatibility/capability-manifests/data-list-advanced-field-template-graph-candidate-selection.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-7a-advanced-field-template-graph-contract-audit.v0.1.0.md",
  "scripts/create-phase7a-advanced-field-template-graph-contract-audit.mjs",
  "scripts/validate-phase7a-advanced-field-template-graph-contract.mjs",
  "scripts/test-phase7a-advanced-field-template-graph-contract.mjs",
  "compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-7b-data-list-type1-identity-control-placement-internal-shadow.v0.1.0.md",
  "scripts/create-phase7b-data-list-type1-identity-control-placement-shadow.mjs",
  "scripts/validate-phase7b-data-list-type1-identity-control-placement-shadow.mjs",
  "scripts/test-data-list-type1-identity-control-placement-shadow.mjs",
  "scripts/test-phase7b-data-list-type1-identity-control-placement-shadow-gates.mjs",
  "compatibility/capability-manifests/data-list-type1-identity-control-placement-core-public-api-readiness.v0.1.0.json",
  "compatibility/capability-manifests/data-list-type1-identity-control-placement-local-runtime-public-api-readiness.v0.1.0.json",
  "compatibility/capability-manifests/data-list-type1-identity-control-placement-dual-distribution-readiness.v0.1.0.json",
  "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-7c-data-list-type1-identity-control-placement-dual-public-distribution-readiness.v0.1.0.md",
  "scripts/create-phase7c-data-list-type1-identity-control-placement-readiness.mjs",
  "scripts/validate-phase7c-data-list-type1-identity-control-placement-readiness.mjs",
  "scripts/test-phase7c-data-list-type1-identity-control-placement-readiness.mjs",
  "compatibility/capability-manifests/data-list-type1-identity-control-placement-dual-public-distribution-promotion.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion.v0.1.0.md",
  "scripts/create-phase7d-data-list-type1-identity-control-placement-promotion.mjs",
  "scripts/validate-data-list-type1-identity-control-placement-public-api.mjs",
  "scripts/test-data-list-type1-identity-control-placement-distribution.mjs",
  "scripts/test-data-list-type1-identity-control-placement-distribution-gates.mjs",
  "compatibility/differential-fixtures/data-list-type1-identity-control-placement-routing.v0.1.0.json",
  "compatibility/capability-manifests/data-list-type1-identity-control-placement-selective-routing-proof.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-7e-data-list-type1-identity-control-placement-selective-routing-proof.v0.1.0.md",
  "scripts/create-phase7e-data-list-type1-identity-control-placement-routing-proof.mjs",
  "scripts/validate-phase7e-data-list-type1-identity-control-placement-routing-proof.mjs",
  "scripts/test-data-list-type1-identity-control-placement-adapter-routing.mjs",
  "compatibility/capability-manifests/data-list-advanced-field-template-graph-family-closure.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-7f-advanced-field-template-graph-family-closure.v0.1.0.md",
  "scripts/create-phase7f-advanced-field-template-graph-family-closure-audit.mjs",
  "scripts/validate-phase7f-advanced-field-template-graph-family-closure.mjs",
  "scripts/test-phase7f-advanced-field-template-graph-family-closure.mjs",
  "compatibility/capability-manifests/data-list-sublist-nested-template-graph-contract.v0.1.0.json",
  "compatibility/capability-manifests/data-list-sublist-nested-template-graph-candidate-selection.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-8a-data-list-sublist-nested-template-graph-contract-audit.v0.1.0.md",
  "scripts/create-phase8a-data-list-sublist-nested-template-graph-contract-audit.mjs",
  "scripts/validate-phase8a-data-list-sublist-nested-template-graph-contract.mjs",
  "scripts/test-phase8a-data-list-sublist-nested-template-graph-contract.mjs",
  "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json",
  "compatibility/differential-fixtures/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-8b-data-list-sublist-explicit-scalar-row-schema-shadow.v0.1.0.md",
  "scripts/create-phase8b-data-list-sublist-scalar-row-schema-shadow.mjs",
  "scripts/validate-phase8b-data-list-sublist-scalar-row-schema-shadow.mjs",
  "scripts/test-data-list-sublist-scalar-row-schema-shadow.mjs",
  "scripts/test-phase8b-data-list-sublist-scalar-row-schema-shadow-gates.mjs",
  "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-core-public-api-readiness.v0.1.0.json",
  "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-local-runtime-public-api-readiness.v0.1.0.json",
  "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-dual-distribution-readiness.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-phase-8c-data-list-sublist-scalar-row-schema-dual-public-distribution-readiness.v0.1.0.md",
  "scripts/create-phase8c-data-list-sublist-scalar-row-schema-dual-distribution-readiness.mjs",
  "scripts/validate-phase8c-data-list-sublist-scalar-row-schema-readiness.mjs",
  "scripts/test-phase8c-data-list-sublist-scalar-row-schema-readiness.mjs",
  "scripts/validate-phase-closure-proof-lineage.mjs",
  "scripts/test-phase-closure-proof-lineage.mjs",
];
const migrationOwnedPaths = [...new Set([...baseMigrationOwnedPaths, ...workspacePaths()])].sort((left, right) => left.localeCompare(right));

const trackedPaths = execFileSync("git", ["ls-files", "-z"], {
  cwd: repositoryRoot,
  encoding: "utf8",
}).split("\0").filter(Boolean);

const sourcePaths = [...new Set([...trackedPaths, ...migrationOwnedPaths, ...workspacePaths()])]
  .filter((sourcePath) => !isProtectedDuplicate(sourcePath))
  .sort((left, right) => left.localeCompare(right));

const manifest = {
  schemaVersion: "1.0.0",
  architectureName: "Yeeflow App Builder Core",
  baseline: {
    gitCommit: "fcc8b8e16b784f1032759ee1b6b588a144497feb",
    pluginVersion: "0.9.71",
    generatedAt: "2026-07-17",
    sourceInventoryMethod: "git ls-files plus explicit migration-owned paths",
  },
  scope: {
    description: "Every tracked repository path and each migration-owned path required to implement Phase 0. Protected duplicate files are intentionally excluded.",
    protectedExclusions: [
      "dist/yeeflow-app-builder-plugin/**/* 2.*",
      "dist/yeeflow-app-builder-plugin/**/* 3.*",
    ],
  },
  migrationOwnedPaths,
  records: sourcePaths.map(classifyPath),
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`CAPABILITY_CLASSIFICATION_MANIFEST_WRITTEN ${relative(repositoryRoot, outputPath)} ${manifest.records.length}`);

function classifyPath(sourcePath) {
  const base = {
    sourcePath,
    classification: "evidence-only",
    sideEffects: [],
    targetPackage: null,
    parityFixtures: [],
    migrationStatus: "pending",
  };

  if (sourcePath.startsWith("dist/")) {
    return { ...base, classification: "generated-distribution", sideEffects: ["distribution"], migrationStatus: "not-planned" };
  }
  if (sourcePath.startsWith("packages/")) {
    const packageName = sourcePath.split("/")[1];
    return { ...base, classification: "core", targetPackage: `@yeeflow/${packageName}` };
  }
  if (sourcePath.startsWith("runtimes/app-builder-core-local-runtime/")) {
    return { ...base, classification: "adapter", targetPackage: "@yeeflow/app-builder-core-local-runtime" };
  }
  if (sourcePath.startsWith("adapters/codex-plugin-adapter/")) {
    return { ...base, classification: "adapter", sideEffects: ["codex"], targetPackage: "@yeeflow/codex-plugin-adapter" };
  }
  if (sourcePath.startsWith("skills/") || sourcePath === ".agents/plugins/marketplace.json") {
    return { ...base, classification: "adapter", sideEffects: ["codex"], targetPackage: "@yeeflow/codex-plugin-adapter" };
  }
  if (sourcePath.startsWith("docs/reference/") && !sourcePath.includes(".invalid.fixture")) {
    return { ...base, classification: "core", targetPackage: "@yeeflow/app-builder-core-templates" };
  }
  if (sourcePath.startsWith("schemas/")) {
    return { ...base, classification: "core", targetPackage: "@yeeflow/app-builder-core-contracts" };
  }
  if (sourcePath.startsWith("fixtures/") || sourcePath.startsWith("examples/") || sourcePath.startsWith("generated/") || sourcePath.startsWith("docs/")) {
    return base;
  }
  if (sourcePath === "build-yap-wrapper.js" || sourcePath === "build-ydl-wrapper.js" || sourcePath === "build-ywf-wrapper.js" || sourcePath === "apply-ywf-metadata.js") {
    return { ...base, classification: "compatibility-shim", sideEffects: ["filesystem", "cli"], targetPackage: "@yeeflow/codex-plugin-adapter" };
  }
  if (sourcePath.startsWith("scripts/test-") || sourcePath.startsWith("scripts/fixtures/") || sourcePath.includes(".fixture.")) {
    return base;
  }
  if (sourcePath === "scripts/create-core-v1-rc-integration-readiness-evidence.mjs" || sourcePath === "scripts/validate-core-v1-rc-integration-readiness.mjs") {
    return base;
  }
  if (sourcePath.startsWith("scripts/lib/")) {
    return classifyLibraryPath(base);
  }
  if (sourcePath.startsWith("scripts/")) {
    return classifyScriptPath(base);
  }
  if (sourcePath.endsWith(".normalized.json") || sourcePath.includes("configurations")) {
    return { ...base, classification: "core", targetPackage: "@yeeflow/app-builder-core-templates" };
  }
  if (sourcePath.endsWith(".js") || sourcePath.endsWith(".mjs") || sourcePath.endsWith(".cjs")) {
    return { ...base, classification: "mixed", sideEffects: ["filesystem", "cli"], targetPackage: "@yeeflow/app-builder-core" };
  }
  return base;
}

function workspacePaths() {
  const roots = ["packages", "runtimes", "adapters"];
  const files = [];
  for (const root of roots) {
    const absoluteRoot = resolve(repositoryRoot, root);
    if (!existsSync(absoluteRoot)) continue;
    for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) collectWorkspacePaths(resolve(absoluteRoot, entry.name), files);
  }
  return files.map((path) => relative(repositoryRoot, path));
}

function collectWorkspacePaths(path, files) {
  const entry = statSync(path);
  if (entry.isDirectory()) {
    if (path.endsWith("/lib") || path.endsWith("/node_modules")) return;
    for (const child of readdirSync(path)) collectWorkspacePaths(resolve(path, child), files);
  } else if (entry.isFile() && !path.endsWith(".tsbuildinfo")) {
    files.push(path);
  }
}

function classifyLibraryPath(base) {
  const filename = base.sourcePath.split("/").at(-1);
  const materializerFiles = new Set([
    "approval-form-layout-builder.mjs",
    "choice-field-option-utils.cjs",
    "form-action-open-resource-utils.cjs",
    "form-action-print-barcode-utils.cjs",
    "form-action-query-data-utils.cjs",
    "form-action-set-data-list-utils.cjs",
    "public-form-action-utils.cjs",
    "public-form-template-utils.cjs",
    "set-variable-contract-utils.cjs",
    "workflow-assignee-expression-utils.cjs",
    "workflow-condition-editor-utils.cjs",
    "workflow-query-data-utils.mjs",
  ]);
  const canonicalModelFiles = new Set([
    "approval-workflow-designer-shape-utils.cjs",
    "approval-workflow-designer-shape-utils.mjs",
    "approval-workflow-graph-reference-utils.cjs",
    "form-control-type-authority.mjs",
  ]);
  if (materializerFiles.has(filename)) {
    return { ...base, classification: "core", targetPackage: "@yeeflow/app-builder-core-materializer", parityFixtures: ["compatibility/differential-fixtures/pending" ] };
  }
  if (canonicalModelFiles.has(filename)) {
    return { ...base, classification: "core", targetPackage: "@yeeflow/app-builder-core-canonical-model", parityFixtures: ["compatibility/differential-fixtures/pending" ] };
  }
  if (filename === "data-list-view-filter-utils.cjs") {
    return { ...base, classification: "core", targetPackage: "@yeeflow/app-builder-core-validators", parityFixtures: ["compatibility/differential-fixtures/pending" ] };
  }
  if (filename === "yapk-decode-utils.mjs") {
    return { ...base, classification: "mixed", sideEffects: ["filesystem", "cli"], targetPackage: "@yeeflow/app-builder-core-package-engine" };
  }
  return { ...base, classification: "mixed", sideEffects: ["filesystem", "cli"], targetPackage: "@yeeflow/app-builder-core" };
}

function classifyScriptPath(base) {
  const name = base.sourcePath.split("/").at(-1);
  if (name.startsWith("build-") || name.startsWith("run-") || name.startsWith("release-") || name.includes("install") || name.includes("oauth") || name.includes("browser") || name.includes("workspace")) {
    return { ...base, classification: "adapter", sideEffects: ["filesystem", "cli"], targetPackage: "@yeeflow/codex-plugin-adapter" };
  }
  return { ...base, classification: "mixed", sideEffects: ["filesystem", "cli"], targetPackage: "@yeeflow/app-builder-core" };
}

function isProtectedDuplicate(sourcePath) {
  return sourcePath.startsWith("dist/yeeflow-app-builder-plugin/") && / [23]\.[^/]+$/.test(sourcePath);
}
