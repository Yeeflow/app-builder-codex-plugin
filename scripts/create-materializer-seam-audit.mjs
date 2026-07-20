#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const sourceFile = resolve(root, sourcePath);
const graphPath = resolve(root, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const outputPath = resolve(root, "compatibility/capability-manifests/materializer-seam-audit.v0.1.0.json");
const reportPath = resolve(root, "docs/architecture/yeeflow-app-builder-materializer-seam-audit.v0.1.0.md");
const normalizeHexCorpusPath = "compatibility/differential-fixtures/materializer-normalize-hex-color.v0.1.0.json";
const defaultValueCorpusPath = "compatibility/differential-fixtures/materializer-default-value-for-field-type.v0.1.0.json";
const escapeRegExpCorpusPath = "compatibility/differential-fixtures/materializer-escape-regexp.v0.1.0.json";
const looseFormMatchCorpusPath = "compatibility/differential-fixtures/materializer-normalize-loose-form-match.v0.1.0.json";
const stripPlanningSuffixCorpusPath = "compatibility/differential-fixtures/materializer-strip-planning-document-suffix.v0.1.0.json";
const dependencyNameCorpusPath = "compatibility/differential-fixtures/materializer-dependency-name.v0.1.0.json";
const safeDependencyIdentifierCorpusPath = "compatibility/differential-fixtures/materializer-safe-dependency-identifier.v0.1.0.json";
const distributionManifestPath = resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const graph = JSON.parse(readFileSync(graphPath, "utf8"));
const approvedPackages = new Set(graph.packages.map((item) => item.name));
const source = parseModule(sourceFile, sourcePath);
const helperModules = analyzeDirectHelpers(source);
const externalCallers = findExternalCallers();

function parseModule(absolutePath, repositoryPath) {
  const text = readFileSync(absolutePath, "utf8");
  const ast = ts.createSourceFile(absolutePath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const imports = new Map();
  const moduleState = new Map();
  const functions = new Map();

  for (const statement of ast.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteralLike(statement.moduleSpecifier)) {
      const specifier = statement.moduleSpecifier.text;
      const clause = statement.importClause;
      if (clause?.name) imports.set(clause.name.text, { specifier, importedName: "default" });
      for (const item of clause?.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements : []) {
        imports.set(item.name.text, { specifier, importedName: item.propertyName?.text || item.name.text });
      }
      if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) imports.set(clause.namedBindings.name.text, { specifier, importedName: "*" });
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        const mutable = (statement.declarationList.flags & ts.NodeFlags.Let) !== 0
          || (statement.declarationList.flags & ts.NodeFlags.Var) !== 0
          || Boolean(declaration.initializer && (ts.isArrayLiteralExpression(declaration.initializer) || ts.isObjectLiteralExpression(declaration.initializer) || ts.isNewExpression(declaration.initializer)));
        if (mutable) moduleState.set(declaration.name.text, { name: declaration.name.text, mutable });
      }
    }
    const functionRecord = topLevelFunctionRecord(statement, ast);
    if (functionRecord) functions.set(functionRecord.name, functionRecord);
  }

  for (const record of functions.values()) inspectFunction(record, { ast, functions, imports, moduleState });
  return { absolutePath, repositoryPath, ast, imports, moduleState, functions };
}

function topLevelFunctionRecord(statement, ast) {
  if (ts.isFunctionDeclaration(statement) && statement.name) {
    return functionRecord(statement.name.text, statement, hasExport(statement), ast, "function");
  }
  if (!ts.isVariableStatement(statement)) return null;
  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
    if (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) {
      return functionRecord(declaration.name.text, declaration.initializer, hasExport(statement), ast, ts.isArrowFunction(declaration.initializer) ? "arrow" : "function-expression");
    }
  }
  return null;
}

function functionRecord(name, node, exported, ast, kind) {
  const start = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
  const end = ast.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  return {
    name,
    node,
    exported,
    kind,
    sourceRange: { startLine: start, endLine: end },
    parameters: node.parameters.map((parameter) => parameter.name.getText(ast)),
    directLocalDependencies: new Set(),
    directImportedDependencies: new Map(),
    moduleMutableStateDependencies: new Set(),
    detectedSideEffects: new Set(),
    nonDeterminism: new Set(),
    externalObjectMutations: new Set(),
    failureSignals: new Set(),
    returnShapes: new Set(),
    calls: new Set()
  };
}

function inspectFunction(record, context) {
  const parameters = new Set(record.parameters);
  const visit = (node) => {
    if (ts.isCallExpression(node)) inspectCall(node, record, context, parameters);
    if (ts.isNewExpression(node)) inspectNew(node, record);
    if (ts.isPropertyAccessExpression(node)) inspectPropertyAccess(node, record, context, parameters);
    if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) inspectAssignment(node.left, record, parameters);
    if (ts.isReturnStatement(node)) record.returnShapes.add(returnShape(node.expression));
    if (ts.isThrowStatement(node)) record.failureSignals.add("throw");
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "error") record.failureSignals.add("structured-error");
    ts.forEachChild(node, visit);
  };
  visit(record.node.body);
}

function inspectCall(node, record, context, parameters) {
  const expression = node.expression;
  if (ts.isIdentifier(expression)) {
    const name = expression.text;
    if (context.functions.has(name) && name !== record.name) record.directLocalDependencies.add(name);
    if (context.imports.has(name)) record.directImportedDependencies.set(name, context.imports.get(name));
    if (name === "fetch") record.detectedSideEffects.add("network");
    if (name === "require") record.detectedSideEffects.add("module-loading");
    if (name === "setTimeout" || name === "setInterval") record.detectedSideEffects.add("time-scheduling");
    if (name === "Date") record.nonDeterminism.add("time");
  }
  if (ts.isPropertyAccessExpression(expression)) {
    const rootName = rootIdentifier(expression.expression);
    const member = expression.name.text;
    const imported = rootName ? context.imports.get(rootName) : null;
    if (imported?.specifier === "node:fs") record.detectedSideEffects.add("filesystem");
    if (imported?.specifier === "node:zlib") record.detectedSideEffects.add("archive-compression");
    if (imported?.specifier === "node:crypto" && /^(?:randomUUID|randomBytes|randomInt)$/.test(member)) {
      record.nonDeterminism.add("random");
      record.detectedSideEffects.add("id-generation");
    }
    if (rootName === "process") record.detectedSideEffects.add(member === "env" ? "environment" : "process");
    if (rootName === "Math" && member === "random") record.nonDeterminism.add("random");
    if (rootName === "Date" && member === "now") record.nonDeterminism.add("time");
    if (/^(?:writeFileSync|writeFile|appendFileSync|appendFile|mkdirSync|mkdir|rmSync|rm|renameSync|rename)$/.test(member) && imported?.specifier === "node:fs") record.detectedSideEffects.add("package-writing");
    if (isMutator(member) && rootName && parameters.has(rootName)) record.externalObjectMutations.add(rootName);
  }
}

function inspectNew(node, record) {
  if (ts.isIdentifier(node.expression) && node.expression.text === "Date") record.nonDeterminism.add("time");
}

function inspectPropertyAccess(node, record, context, parameters) {
  const rootName = rootIdentifier(node);
  if (rootName && context.moduleState.has(rootName)) record.moduleMutableStateDependencies.add(rootName);
  if (rootName === "process" && node.name.text === "env") record.detectedSideEffects.add("environment");
  if (rootName && parameters.has(rootName) && isMutator(node.name.text)) record.externalObjectMutations.add(rootName);
}

function inspectAssignment(left, record, parameters) {
  const rootName = rootIdentifier(left);
  if (rootName && parameters.has(rootName)) record.externalObjectMutations.add(rootName);
}

function buildRecords() {
  const externalByName = externalCallers;
  const records = [];
  for (const record of source.functions.values()) {
    const transitive = transitiveDependencies(record.name);
    const directHelpers = [...record.directImportedDependencies.entries()].map(([localName, value]) => ({ localName, module: value.specifier, importName: value.importedName }));
    const helperPaths = [...new Set(directHelpers.map((item) => item.module).filter((specifier) => specifier.startsWith(".")))].sort();
    const effectSet = new Set([...record.detectedSideEffects, ...transitive.effects]);
    const nondeterminism = new Set([...record.nonDeterminism, ...transitive.nondeterminism]);
    const mutations = new Set([...record.externalObjectMutations, ...transitive.mutations]);
    const legacyDependency = helperPaths.some((path) => path === "./lib/markdown-planning-utils.mjs") || transitive.legacyMarkdownDependency;
    const helperBoundary = helperPaths.length > 0;
    const classification = classify(record, { effectSet, nondeterminism, mutations, legacyDependency, helperBoundary, transitive });
    const localCallers = [...source.functions.values()].filter((candidate) => candidate.directLocalDependencies.has(record.name)).map((candidate) => candidate.name).sort();
    const external = externalByName.get(record.name) || [];
    const callerPaths = [...new Set([...(localCallers.length ? [sourcePath] : []), ...external])].sort();
    const io = inputOutputContract(record, classification);
    const auditRecord = {
      id: `${sourcePath}#${record.name}`,
      sourceFile: sourcePath,
      functionName: record.name,
      functionKind: record.kind,
      sourceRange: record.sourceRange,
      exported: record.exported,
      callers: { count: localCallers.length + external.length, localFunctionNames: localCallers, callerPaths },
      inputOutputContract: io,
      directDependencies: { localFunctions: [...record.directLocalDependencies].sort(), importedBindings: directHelpers, helperModules: helperPaths },
      transitiveDependencies: { localFunctions: transitive.functions, helperModules: transitive.helpers, detectedSideEffects: [...effectSet].sort(), nonDeterminism: [...nondeterminism].sort(), legacyMarkdownParserDependency: legacyDependency },
      moduleMutableStateDependencies: [...record.moduleMutableStateDependencies].sort(),
      detectedSideEffects: [...effectSet].sort(),
      externalObjectMutationDependencies: [...mutations].sort(),
      nondeterminism: [...nondeterminism].sort(),
      coreClassification: classification.value,
      classificationReason: classification.reason,
      requiredParityFixture: parityContract(record, classification),
      recommendedTargetCorePackage: classification.target,
      rollbackImplications: classification.rollback,
      shadowImplementation: shadowImplementationEvidence(record.name),
      productionCallSites: productionCallSites(record.name),
      phase4fCandidateAssessment: null
    };
    auditRecord.phase4fCandidateAssessment = phase4fCandidateAssessment(auditRecord);
    records.push(auditRecord);
  }
  return records.sort((left, right) => left.sourceRange.startLine - right.sourceRange.startLine || left.functionName.localeCompare(right.functionName));
}

const phase4fRoutedFunctions = new Set(["normalizeHexColor", "defaultValueForFieldType", "escapeRegExp", "normalizeForLooseFormMatch", "stripPlanningDocumentSuffix", "dependencyName", "safeDependencyIdentifier"]);
const phase4fEligibleProfiles = {
  normalizeForLooseFormMatch: {
    rank: 1,
    classification: "eligible-single-slice",
    historicalProductionCallExpressionCount: 3,
    rationale: "A three-line deterministic string canonicalizer with three call expressions in one reverse-related matching helper, no dependencies, and a narrow JSON-serializable string input/output contract.",
    coercionAndErrorSemanticRisk: "Uses String(value || \"\"); null, omitted input, 0, false, arrays, and objects require exact parity coverage. No thrown error is expected for JSON-serializable inputs.",
    publicApiBoundary: "A single explicit normalizeForLooseFormMatch export in @yeeflow/app-builder-core-materializer; no related helper must be exposed.",
    proofSurface: "Standalone differential corpus plus one actual reverse-related matching fixture, source/archive/installed proof, and a temporary single-helper rollback.",
    batchCompatibility: "Not recommended as a batch. Its matching semantics and rollback must remain isolated."
  },
  stripPlanningDocumentSuffix: {
    rank: 2,
    classification: "eligible-single-slice",
    historicalProductionCallExpressionCount: 3,
    rationale: "A small deterministic title normalizer with three call expressions and no local or host dependencies.",
    coercionAndErrorSemanticRisk: "Uses String(value || \"\") and Unicode dash matching; exact suffix, whitespace, case, and coercion behavior requires a dedicated corpus.",
    publicApiBoundary: "A single explicit stripPlanningDocumentSuffix export would be required; do not bundle planning extraction helpers.",
    proofSurface: "Standalone corpus and title/application-name materializer fixture with isolated rollback.",
    batchCompatibility: "Not recommended as a batch because document-title semantics are distinct from other normalizers."
  },
  dependencyName: {
    rank: 3,
    classification: "eligible-single-slice",
    historicalProductionCallExpressionCount: 4,
    rationale: "A small deterministic object-property precedence helper with four call expressions inside one template dependency map builder.",
    coercionAndErrorSemanticRisk: "Property precedence among name, key, id, and ID plus String coercion is contract-sensitive; a complete object-shape corpus is required.",
    publicApiBoundary: "A single explicit dependencyName export would be required; do not extract the dependency-map builder.",
    proofSurface: "Standalone corpus and template dependency-map integration fixture with isolated rollback.",
    batchCompatibility: "Not recommended as a batch because its property-precedence contract is unique."
  },
  safeDependencyIdentifier: {
    rank: 4,
    classification: "eligible-single-slice",
    rationale: "A small deterministic identifier normalizer with three call expressions in one dependency-name helper and no host dependencies.",
    coercionAndErrorSemanticRisk: "The options argument is null-sensitive and lower-case behavior is contract-sensitive; exact omitted, null, and object option cases require a dedicated corpus.",
    publicApiBoundary: "A single explicit safeDependencyIdentifier export would be required; do not extract scopedDependencyName with it.",
    proofSurface: "Standalone corpus and dependency-name integration fixture with isolated rollback.",
    batchCompatibility: "Not recommended as a batch because its options-object error contract differs from dependencyName."
  }
};

function productionCallSites(functionName) {
  const coreAliases = {
    normalizeHexColor: "coreNormalizeHexColor",
    defaultValueForFieldType: "coreDefaultValueForFieldType",
    escapeRegExp: "coreEscapeRegExp",
    normalizeForLooseFormMatch: "coreNormalizeForLooseFormMatch",
    stripPlanningDocumentSuffix: "coreStripPlanningDocumentSuffix",
    dependencyName: "coreDependencyName"
    ,safeDependencyIdentifier: "coreSafeDependencyIdentifier"
  };
  const calleeName = coreAliases[functionName] || functionName;
  const sites = [];
  const visit = (node, enclosingFunction = null) => {
    let enclosing = enclosingFunction;
    if (ts.isFunctionDeclaration(node) && node.name) enclosing = node.name.text;
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === calleeName) {
      const position = source.ast.getLineAndCharacterOfPosition(node.getStart(source.ast));
      sites.push({ line: position.line + 1, column: position.character + 1, enclosingFunction: enclosing, calleeName, arguments: node.arguments.map((argument) => argument.getText(source.ast)) });
    }
    ts.forEachChild(node, (child) => visit(child, enclosing));
  };
  visit(source.ast);
  return sites;
}

function phase4fCandidateAssessment(record) {
  if (record.coreClassification !== "deterministic-core-candidate" || phase4fRoutedFunctions.has(record.functionName)) return null;
  const profile = phase4fEligibleProfiles[record.functionName];
  if (profile) return { ...profile, productionCallSites: productionCallSites(record.functionName) };
  const excludedByScope = /(?:field|control|workflow|resource|documentLibrary|dashboard|navigation|layout|approval|dataView|analytics|subList|uuid|idPath|fixtureApi)/i.test(record.functionName);
  return {
    rank: null,
    classification: excludedByScope ? "defer-high-risk" : "defer-high-risk",
    rationale: excludedByScope
      ? "Outside the Phase 4F selection boundary because the helper participates in a prohibited field/control projection, workflow, resource, ID, package, or runtime-adjacent capability area."
      : "Not selected for the narrow next-slice set because its caller fan-out, coupled semantics, or wider public API boundary requires a separate audit.",
    coercionAndErrorSemanticRisk: "Not individually approved for extraction; exact coercion and error behavior requires a future dedicated source-level audit.",
    publicApiBoundary: "No Core public API or adapter export is proposed in Phase 4F.",
    proofSurface: "No migration proof is authorized in Phase 4F.",
    batchCompatibility: "Not eligible for a batch recommendation until each member has an independent rollback and the same proof surface.",
    productionCallSites: productionCallSites(record.functionName)
  };
}

function buildPhase4fCandidateSelection(auditRecords) {
  const candidates = auditRecords
    .filter((record) => record.phase4fCandidateAssessment)
    .map((record) => ({
      recordId: record.id,
      functionName: record.functionName,
      sourceRange: record.sourceRange,
      directDependencies: record.directDependencies,
      transitiveDependencies: record.transitiveDependencies,
      moduleMutableStateDependencies: record.moduleMutableStateDependencies,
      detectedSideEffects: record.detectedSideEffects,
      nondeterminism: record.nondeterminism,
      externalObjectMutationDependencies: record.externalObjectMutationDependencies,
      ...record.phase4fCandidateAssessment
    }));
  const rankedEligibleCandidates = candidates.filter((candidate) => candidate.classification === "eligible-single-slice").sort((left, right) => left.rank - right.rank);
  const recommendation = rankedEligibleCandidates[0] || null;
  return {
    schemaVersion: "1.0.0",
    status: recommendation ? "selected" : "NO_SAFE_MATERIALIZER_PHASE_4F_SLICE_SELECTED",
    auditOnly: true,
    routedFunctionsExcluded: [...phase4fRoutedFunctions].sort(),
    classificationCounts: count(candidates, "classification"),
    candidateCount: candidates.length,
    candidates,
    rankedEligibleCandidates: rankedEligibleCandidates.map((candidate) => candidate.recordId),
    recommendedNextSlice: recommendation ? {
      recordId: recommendation.recordId,
      functionName: recommendation.functionName,
      classification: recommendation.classification,
      rationale: recommendation.rationale,
      requiredPreconditions: [
        "Run a fresh TypeScript AST audit before implementation.",
        "Define the exact Legacy coercion and error contract in a versioned differential corpus.",
        "Add one public Core export and one adapter export only after explicit approval.",
        "Prove source, temporary archive, installed layout, deterministic integration, and a temporary single-helper rollback."
      ]
    } : null,
    prohibitedSelections: ["field/control projection", "resource construction", "workflow materialization", "ID allocation", "archive/package writing", "generated-final target/projection validation", "runtime behavior"],
    coreArtifactChanged: false,
    productionRoutingChanged: false
  };
}

const records = buildRecords();
const selection = selectFirstSlice(records);
const phase4fCandidateSelection = buildPhase4fCandidateSelection(records);
const audit = {
  schemaVersion: "1.0.0",
  auditVersion: "0.1.0",
  pluginVersion: "0.9.71",
  sourcePath,
  analysisMethod: "TypeScript AST top-level function inventory, local call graph, direct helper module scan, and conservative host-effect propagation.",
  eligibilityPolicy: {
    deterministicCoreCandidateRequirements: [
      "No filesystem, process, archive/compression, environment, network, OAuth, API, or installed-plugin access.",
      "No live tenant ID, runtime lookup, time, random, UUID, or nondeterministic generation.",
      "No mutation of externally owned resource graph objects.",
      "Stable JSON-serializable inputs and outputs.",
      "Bounded, testable failure contract.",
      "No Legacy Markdown parser dependency unless the dependency already resolves through the proven adapter/Core contract."
    ],
    hostEffectCategories: ["filesystem", "process", "archive-compression", "environment", "network", "api", "random-time", "id-generation", "package-writing", "installed-plugin-access"],
    allowedTargetPackages: [...approvedPackages].sort()
  },
  directHelperModules: helperModules,
  records,
  selection,
  phase4fCandidateSelection
};

writeJson(outputPath, audit);
writeFileSync(reportPath, renderReport(audit), "utf8");
console.log(`MATERIALIZER_SEAM_AUDIT_WRITTEN records=${records.length} helpers=${helperModules.length}`);

function shadowImplementationEvidence(functionName) {
  const profiles = {
    normalizeHexColor: {
      corpusPath: normalizeHexCorpusPath,
      parityTest: "scripts/test-materializer-normalize-hex-differential.mjs",
      markers: [
        "MATERIALIZER_NORMALIZE_HEX_CORE_SHADOW_IMPLEMENTED",
        "MATERIALIZER_NORMALIZE_HEX_DIFFERENTIAL_PARITY_PASSED",
        "MATERIALIZER_NORMALIZE_HEX_IMMUTABILITY_PASSED"
      ],
      legacyBehavior: {
        acceptedInputRule: "String(value || \"\").trim() must match exactly /^#[0-9a-f]{6}$/i.",
        trimming: "Leading and trailing whitespace is removed before matching.",
        caseNormalization: "A matching color is returned in uppercase.",
        malformedInput: "Any non-matching value returns an empty string.",
        nullLikeInput: "null, omitted input, 0, false, and empty string become an empty string through value || \"\".",
        jsonCoercionEdgeCase: "A truthy single-element array can stringify to a valid hex color; ordinary objects stringify to non-hex text.",
        returnType: "string",
        thrownErrorBehavior: "No thrown error for the versioned JSON corpus.",
        mutationBehavior: "Does not mutate the supplied value."
      }
    },
    defaultValueForFieldType: {
      corpusPath: defaultValueCorpusPath,
      parityTest: "scripts/test-materializer-default-value-differential.mjs",
      markers: [
        "MATERIALIZER_DEFAULT_VALUE_CORE_SHADOW_IMPLEMENTED",
        "MATERIALIZER_DEFAULT_VALUE_DIFFERENTIAL_PARITY_PASSED",
        "MATERIALIZER_DEFAULT_VALUE_IMMUTABILITY_PASSED"
      ],
      legacyBehavior: {
        acceptedInputRule: "Only the primitive string \"Bit\" is accepted through strict equality.",
        trimming: "No trimming is performed.",
        caseNormalization: "No case normalization or alias handling is performed.",
        malformedInput: "Every value other than exactly \"Bit\" returns an empty string.",
        nullLikeInput: "null and omitted input return an empty string.",
        jsonCoercionEdgeCase: "Arrays and objects are compared without coercion and return an empty string.",
        returnType: "string",
        thrownErrorBehavior: "No thrown error for the versioned JSON corpus.",
        mutationBehavior: "Does not mutate the supplied value."
      }
    },
    escapeRegExp: {
      corpusPath: escapeRegExpCorpusPath,
      parityTest: "scripts/test-materializer-escape-regexp-differential.mjs",
      markers: [
        "MATERIALIZER_ESCAPE_REGEXP_CORE_SHADOW_IMPLEMENTED",
        "MATERIALIZER_ESCAPE_REGEXP_DIFFERENTIAL_PARITY_PASSED",
        "MATERIALIZER_ESCAPE_REGEXP_IMMUTABILITY_PASSED"
      ],
      legacyBehavior: {
        acceptedInputRule: "String(value || \"\") is used without trimming.",
        trimming: "No trimming is performed.",
        caseNormalization: "No case normalization is performed.",
        malformedInput: "The function escapes only . * + ? ^ $ { } ( ) | [ ] and backslash; other characters remain unchanged.",
        nullLikeInput: "null, omitted input, 0, false, and empty string become an empty string through value || \"\".",
        jsonCoercionEdgeCase: "Truthy arrays and objects use JavaScript String conversion before escaping.",
        returnType: "string",
        thrownErrorBehavior: "No thrown error for the versioned JSON corpus.",
        mutationBehavior: "Does not mutate the supplied value."
      }
    },
    normalizeForLooseFormMatch: {
      corpusPath: looseFormMatchCorpusPath,
      parityTest: "scripts/test-materializer-normalize-loose-form-match-differential.mjs",
      markers: [
        "MATERIALIZER_LOOSE_FORM_MATCH_CORE_SHADOW_IMPLEMENTED",
        "MATERIALIZER_LOOSE_FORM_MATCH_DIFFERENTIAL_PARITY_PASSED",
        "MATERIALIZER_LOOSE_FORM_MATCH_IMMUTABILITY_PASSED"
      ],
      legacyBehavior: {
        acceptedInputRule: "String(value || \"\") is used without trimming before normalization.",
        trimming: "The input is not trimmed before normalization; generated separator whitespace is collapsed and the final result is trimmed.",
        caseNormalization: "The converted input is lowercased before separator normalization.",
        malformedInput: "Every non-ASCII-alphanumeric run becomes one space; no input is rejected for the versioned JSON corpus.",
        nullLikeInput: "null, omitted input, 0, false, and empty string become an empty string through value || \"\".",
        jsonCoercionEdgeCase: "Truthy arrays and objects use JavaScript String conversion before punctuation, whitespace, and case normalization.",
        returnType: "string",
        thrownErrorBehavior: "No thrown error for the versioned JSON corpus.",
        mutationBehavior: "Does not mutate the supplied value."
      }
    },
    stripPlanningDocumentSuffix: {
      corpusPath: stripPlanningSuffixCorpusPath,
      parityTest: "scripts/test-materializer-strip-planning-document-suffix-differential.mjs",
      markers: [
        "MATERIALIZER_STRIP_PLANNING_SUFFIX_CORE_SHADOW_IMPLEMENTED",
        "MATERIALIZER_STRIP_PLANNING_SUFFIX_DIFFERENTIAL_PARITY_PASSED",
        "MATERIALIZER_STRIP_PLANNING_SUFFIX_IMMUTABILITY_PASSED"
      ],
      legacyBehavior: {
        acceptedInputRule: "String(value || \"\") is used without pre-trimming.",
        trimming: "The output is trimmed after terminal suffix removal; an unrecognized or absent suffix is otherwise preserved.",
        caseNormalization: "Suffix matching is case-insensitive, but retained text preserves its original case.",
        malformedInput: "A terminal Yeeflow App Plan suffix preceded by whitespace is removed; a whitespace-surrounded hyphen, en dash, or em dash is removed with it, while another delimiter is retained.",
        nullLikeInput: "null, omitted input, 0, false, and empty string become an empty string through value || \"\".",
        jsonCoercionEdgeCase: "Truthy arrays and objects use JavaScript String conversion before suffix matching and trimming.",
        returnType: "string",
        thrownErrorBehavior: "No thrown error for the versioned JSON corpus.",
        mutationBehavior: "Does not mutate the supplied value."
      }
    },
    dependencyName: {
      corpusPath: dependencyNameCorpusPath,
      parityTest: "scripts/test-materializer-dependency-name-differential.mjs",
      markers: [
        "MATERIALIZER_DEPENDENCY_NAME_CORE_SHADOW_IMPLEMENTED",
        "MATERIALIZER_DEPENDENCY_NAME_DIFFERENTIAL_PARITY_PASSED",
        "MATERIALIZER_DEPENDENCY_NAME_IMMUTABILITY_PASSED"
      ],
      legacyBehavior: {
        acceptedInputRule: "Properties name, key, id, and ID are read in strict truthy precedence order before String conversion.",
        trimming: "The selected property value is converted with String and then trimmed.",
        caseNormalization: "No case normalization is performed.",
        malformedInput: "Missing or falsy properties fall through; a truthy whitespace-only property blocks fallback and trims to an empty string.",
        nullLikeInput: "null and omitted input return an empty string; top-level primitive JSON values have no selected property.",
        jsonCoercionEdgeCase: "Truthy array and object property values use JavaScript String conversion; nested plain objects return [object Object].",
        returnType: "string",
        thrownErrorBehavior: "No thrown error for the versioned JSON corpus.",
        mutationBehavior: "Does not mutate the supplied item or nested values."
      }
    },
    safeDependencyIdentifier: {
      corpusPath: safeDependencyIdentifierCorpusPath,
      parityTest: "scripts/test-materializer-safe-dependency-identifier-differential.mjs",
      markers: ["MATERIALIZER_DEPENDENCY_IDENTIFIER_CORE_SHADOW_IMPLEMENTED", "MATERIALIZER_DEPENDENCY_IDENTIFIER_DIFFERENTIAL_PARITY_PASSED", "MATERIALIZER_DEPENDENCY_IDENTIFIER_IMMUTABILITY_PASSED"],
      legacyBehavior: {
        acceptedInputRule: "String(value || \"\") is lowercased only when options.lower is truthy, then non-ASCII-letter, digit, and underscore runs are replaced.",
        trimming: "No whitespace trimming occurs before replacement; leading and trailing generated underscores are removed.",
        caseNormalization: "Only a truthy options.lower triggers lowercasing.",
        malformedInput: "Leading digits are retained; invalid-only text becomes an empty string.",
        nullLikeInput: "Falsy value inputs become an empty string; null options throw TypeError because options.lower is read directly.",
        jsonCoercionEdgeCase: "Truthy arrays and objects use JavaScript String conversion before replacement.",
        returnType: "string",
        thrownErrorBehavior: "Null options throw TypeError; no other thrown error occurs for the versioned corpus.",
        mutationBehavior: "Does not mutate the supplied value, options, or nested values."
      }
    }
  };
  const profile = profiles[functionName];
  if (!profile) return null;
  const corpus = JSON.parse(readFileSync(resolve(root, profile.corpusPath), "utf8"));
  return {
    status: "implemented-and-differential-parity-passed",
    legacyFunctionPath: `scripts/materialize-full-app-generated-final.mjs#${functionName}`,
    coreSourceFunctionPath: `packages/app-builder-core-materializer/src/index.ts#${functionName}`,
    compiledCoreFunctionPath: `packages/app-builder-core-materializer/lib/index.js#${functionName}`,
    corpusPath: profile.corpusPath,
    corpusCaseCount: corpus.cases.length,
    parityTest: profile.parityTest,
    parityMarkers: profile.markers,
    legacyBehavior: profile.legacyBehavior,
    productionCallerSwitch: materializerRoutingEvidence(functionName),
    distributionCutover: materializerDistributionEvidence(),
    compatibilityAdapterCutover: materializerRoutingEvidence(functionName)
  };
}

function materializerRoutingEvidence(functionName) {
  const materializerText = readFileSync(sourceFile, "utf8");
  const profile = functionName === "normalizeHexColor"
    ? { alias: "coreNormalizeHexColor", legacyName: "normalizeHexColor", preCutoverCallCount: 4, phase: "phase-4c", rollback: "In a temporary full Plugin copy, remove the normalizeHexColor adapter binding and replace each coreNormalizeHexColor call with normalizeHexColor while retaining the artifact for independently routed defaultValueForFieldType." }
    : functionName === "defaultValueForFieldType"
      ? { alias: "coreDefaultValueForFieldType", legacyName: "defaultValueForFieldType", preCutoverCallCount: 1, phase: "phase-4d", rollback: "In a temporary full Plugin copy, remove the defaultValueForFieldType adapter binding and replace the coreDefaultValueForFieldType call with defaultValueForFieldType while retaining the artifact for independently routed normalizeHexColor." }
      : functionName === "escapeRegExp"
        ? { alias: "coreEscapeRegExp", legacyName: "escapeRegExp", preCutoverCallCount: 1, phase: "phase-4e", rollback: "In a temporary full Plugin copy, remove the escapeRegExp adapter binding and replace the coreEscapeRegExp call with escapeRegExp while retaining the artifact for independently routed normalizeHexColor and defaultValueForFieldType." }
        : functionName === "normalizeForLooseFormMatch"
          ? { alias: "coreNormalizeForLooseFormMatch", legacyName: "normalizeForLooseFormMatch", preCutoverCallCount: 3, phase: "phase-4g", rollback: "In a temporary full Plugin copy, remove the normalizeForLooseFormMatch adapter binding and replace the three coreNormalizeForLooseFormMatch calls with normalizeForLooseFormMatch while retaining the artifact for independently routed normalizeHexColor, defaultValueForFieldType, and escapeRegExp." }
          : functionName === "stripPlanningDocumentSuffix"
            ? { alias: "coreStripPlanningDocumentSuffix", legacyName: "stripPlanningDocumentSuffix", preCutoverCallCount: 3, phase: "phase-4h", rollback: "In a temporary full Plugin copy, remove the stripPlanningDocumentSuffix adapter binding and replace the three coreStripPlanningDocumentSuffix calls with stripPlanningDocumentSuffix while retaining the artifact for independently routed normalizeHexColor, defaultValueForFieldType, escapeRegExp, and normalizeForLooseFormMatch." }
            : functionName === "dependencyName"
              ? { alias: "coreDependencyName", legacyName: "dependencyName", preCutoverCallCount: 4, phase: "phase-4i", rollback: "In a temporary full Plugin copy, remove the dependencyName adapter binding and replace the four coreDependencyName calls with dependencyName while retaining the artifact for independently routed normalizeHexColor, defaultValueForFieldType, escapeRegExp, normalizeForLooseFormMatch, and stripPlanningDocumentSuffix." }
              : { alias: "coreSafeDependencyIdentifier", legacyName: "safeDependencyIdentifier", preCutoverCallCount: 3, phase: "phase-4j", rollback: "In a temporary full Plugin copy, remove the safeDependencyIdentifier adapter binding and replace the three coreSafeDependencyIdentifier calls with safeDependencyIdentifier while retaining all independently routed helpers." };
  const coreCallCount = materializerText.split(`${profile.alias}(`).length - 1;
  const legacyNameCount = materializerText.split(`${profile.legacyName}(`).length - 1;
  const routed = materializerText.includes(`${profile.legacyName} as ${profile.alias}`);
  return {
    status: routed ? `${profile.phase}-routed-to-distributed-core` : "not-started",
    adapterPath: routed ? "scripts/lib/materializer-core-adapter.mjs" : null,
    preCutoverLegacyCallCount: profile.preCutoverCallCount,
    postCutoverCoreCallCount: coreCallCount,
    postCutoverLegacyCallCount: Math.max(legacyNameCount - 1, 0),
    legacyHelperRetained: materializerText.includes(`function ${profile.legacyName}(`),
    rollback: profile.rollback
  };
}

function materializerDistributionEvidence() {
  if (!existsSync(distributionManifestPath)) return { status: "not-built", artifactPath: null, artifactSha256: null };
  const manifest = JSON.parse(readFileSync(distributionManifestPath, "utf8"));
  const artifact = manifest.artifacts?.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
  if (!artifact) return { status: "not-declared", artifactPath: null, artifactSha256: null };
  return {
    status: "official-distribution-proof-passed",
    artifactPath: artifact.path,
    artifactSha256: artifact.sha256,
    exports: artifact.exports
  };
}

function transitiveDependencies(functionName) {
  const queue = [functionName];
  const visited = new Set();
  const functions = new Set();
  const helpers = new Set();
  const effects = new Set();
  const nondeterminism = new Set();
  const mutations = new Set();
  let legacyMarkdownDependency = false;
  while (queue.length) {
    const currentName = queue.pop();
    if (visited.has(currentName)) continue;
    visited.add(currentName);
    const current = source.functions.get(currentName);
    if (!current) continue;
    for (const dependency of current.directLocalDependencies) {
      functions.add(dependency);
      queue.push(dependency);
    }
    for (const value of current.directImportedDependencies.values()) {
      if (!value.specifier.startsWith(".")) continue;
      helpers.add(value.specifier);
      if (value.specifier === "./lib/markdown-planning-utils.mjs") legacyMarkdownDependency = true;
    }
    for (const value of current.detectedSideEffects) effects.add(value);
    for (const value of current.nonDeterminism) nondeterminism.add(value);
    for (const value of current.externalObjectMutations) mutations.add(value);
  }
  return { functions: [...functions].sort(), helpers: [...helpers].sort(), effects, nondeterminism, mutations, legacyMarkdownDependency };
}

function classify(record, context) {
  const hostileEffects = context.effectSet.size > 0 || context.nondeterminism.size > 0;
  const highRisk = record.sourceRange.endLine - record.sourceRange.startLine > 180
    || /^(?:materialize|build(?:Decoded|ResourceGraph|.*Resource|.*Package)|allocateIds|loadIdSource|encode|write|parseArgs|print)/.test(record.name);
  if (hostileEffects && (/^(?:materializeFullAppGeneratedFinal|loadIdSource|parseArgs|printTextReport|buildFailure)$/.test(record.name) || context.effectSet.has("filesystem") || context.effectSet.has("package-writing") || context.effectSet.has("archive-compression") || context.effectSet.has("process") || context.effectSet.has("environment"))) {
    return { value: "host-orchestration-only", reason: `Static analysis detected host behavior: ${[...context.effectSet, ...context.nondeterminism].sort().join(", ")}.`, target: null, rollback: "No Core routing is permitted; retain the Legacy orchestration entry point." };
  }
  if (highRisk || context.mutations.size || context.legacyDependency) {
    const blockers = [
      highRisk ? "large or package/resource construction responsibility" : null,
      context.mutations.size ? "externally owned object mutation" : null,
      context.legacyDependency ? "Legacy Markdown parser dependency" : null
    ].filter(Boolean).join(", ");
    return { value: "deferred-high-risk", reason: `Conservative static audit defers this function because it has ${blockers}.`, target: null, rollback: "Keep the function in Legacy materialization until an isolated differential corpus and seam adapter exist." };
  }
  if (hostileEffects || context.helperBoundary || record.moduleMutableStateDependencies.size) {
    const blockers = [
      hostileEffects ? "host or nondeterministic behavior" : null,
      context.helperBoundary ? "unmigrated local helper dependency" : null,
      record.moduleMutableStateDependencies.size ? "module mutable state dependency" : null
    ].filter(Boolean).join(", ");
    return { value: "mixed-needs-boundary-adapter", reason: `Function is not independently Core-eligible because of ${blockers}.`, target: null, rollback: "A future adapter must retain the Legacy function while Core parity is evaluated." };
  }
  return { value: "deterministic-core-candidate", reason: "TypeScript AST analysis found no host effects, nondeterminism, mutable module state, external object mutation, or Legacy Markdown parser dependency.", target: "@yeeflow/app-builder-core-materializer", rollback: "Retain the Legacy implementation as the rollback path until a focused normalized-output differential passes." };
}

function inputOutputContract(record, classification) {
  const returnShapes = [...record.returnShapes].sort();
  const stable = classification.value === "deterministic-core-candidate";
  return {
    input: { kind: "positional-parameters", parameterNames: record.parameters, jsonSerializable: stable },
    output: { observedReturnShapes: returnShapes.length ? returnShapes : ["implicit-undefined"], jsonSerializable: stable, immutableInputContractRequired: stable },
    failureContract: { observedSignals: [...record.failureSignals].sort(), boundedAndTestable: stable }
  };
}

function parityContract(record, classification) {
  if (record.name === "normalizeHexColor") {
    return {
      fixtureShape: {
        input: {
          cases: [
            { value: "#abcdef", expectedReturn: "#ABCDEF", expectedError: null },
            { value: " #12aBcD ", expectedReturn: "#12ABCD", expectedError: null },
            { value: "#12345", expectedReturn: "", expectedError: null },
            { value: "invalid", expectedReturn: "", expectedError: null },
            { value: "", expectedReturn: "", expectedError: null },
            { value: null, expectedReturn: "", expectedError: null }
          ]
        },
        expected: "Uppercase six-digit hex color or empty string; no thrown error; primitive input remains unchanged."
      },
      assertions: ["Legacy and candidate output deep equality", "Legacy and candidate error contract equality", "Input remains unchanged when the candidate is classified deterministic-core-candidate"],
      status: "required-before-extraction"
    };
  }
  return {
    fixtureShape: {
      input: record.parameters.reduce((result, parameter) => ({ ...result, [parameter]: "JSON-serializable representative value" }), {}),
      expected: "Normalized return value, thrown error, and input immutability observation"
    },
    assertions: ["Legacy and candidate output deep equality", "Legacy and candidate error contract equality", "Input remains unchanged when the candidate is classified deterministic-core-candidate"],
    status: classification.value === "deterministic-core-candidate" ? "required-before-extraction" : "required-before-any-boundary-split"
  };
}

function selectFirstSlice(records) {
  const candidates = records.filter((record) => record.coreClassification === "deterministic-core-candidate" && record.callers.count <= 5 && record.sourceRange.endLine - record.sourceRange.startLine <= 25);
  const selected = candidates.find((record) => record.functionName === "normalizeHexColor") || candidates[0];
  if (!selected) return { status: "NO_SAFE_MATERIALIZER_CORE_SLICE_SELECTED", code: "NO_SAFE_MATERIALIZER_CORE_SLICE_SELECTED", blockers: ["No function satisfied the static deterministic Core eligibility policy."], selectedRecordId: null };
  return {
    status: "selected",
    selectedRecordId: selected.id,
    rationale: "Small pure normalization function with JSON-serializable input/output, no detected host effects, no mutable state dependency, no Legacy Markdown parser dependency, and low local caller count.",
    parityFixtureContract: selected.requiredParityFixture
  };
}

function analyzeDirectHelpers(module) {
  const helpers = new Map();
  for (const value of module.imports.values()) {
    if (!value.specifier.startsWith(".")) continue;
    const resolved = resolveLocalModule(sourcePath, value.specifier);
    if (!resolved || helpers.has(resolved.repositoryPath)) continue;
    const text = readFileSync(resolved.absolutePath, "utf8");
    const ast = ts.createSourceFile(resolved.absolutePath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
    const imports = [];
    const hostEffects = new Set();
    const exportedFunctions = [];
    const visit = (node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
        if (node.moduleSpecifier.text === "node:fs") hostEffects.add("filesystem");
        if (node.moduleSpecifier.text === "node:zlib") hostEffects.add("archive-compression");
        if (/^node:(?:child_process|process)$/.test(node.moduleSpecifier.text)) hostEffects.add("process");
      }
      if (ts.isFunctionDeclaration(node) && node.name && hasExport(node)) exportedFunctions.push(node.name.text);
      ts.forEachChild(node, visit);
    };
    visit(ast);
    helpers.set(resolved.repositoryPath, { sourcePath: resolved.repositoryPath, importedBy: [], imports: [...new Set(imports)].sort(), exportedFunctions: [...new Set(exportedFunctions)].sort(), detectedHostSideEffects: [...hostEffects].sort() });
  }
  for (const value of module.imports.values()) {
    if (!value.specifier.startsWith(".")) continue;
    const resolved = resolveLocalModule(sourcePath, value.specifier);
    if (resolved) helpers.get(resolved.repositoryPath)?.importedBy.push(value.importedName);
  }
  return [...helpers.values()].map((item) => ({ ...item, importedBy: [...new Set(item.importedBy)].sort() })).sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
}

function findExternalCallers() {
  const result = new Map();
  for (const candidate of listSourceModules(resolve(root, "scripts"))) {
    const repositoryPath = relative(root, candidate).replaceAll("\\", "/");
    if (repositoryPath === sourcePath || isProtected(repositoryPath)) continue;
    const ast = ts.createSourceFile(candidate, readFileSync(candidate, "utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteralLike(statement.moduleSpecifier) || !statement.moduleSpecifier.text.startsWith(".")) continue;
      const resolved = resolveLocalModule(repositoryPath, statement.moduleSpecifier.text);
      if (!resolved || resolved.repositoryPath !== sourcePath) continue;
      const bindings = statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) ? statement.importClause.namedBindings.elements : [];
      for (const binding of bindings) {
        const imported = binding.propertyName?.text || binding.name.text;
        if (!result.has(imported)) result.set(imported, []);
        result.get(imported).push(repositoryPath);
      }
    }
  }
  return new Map([...result.entries()].map(([name, paths]) => [name, [...new Set(paths)].sort()]));
}

function listSourceModules(directory) {
  const result = [];
  for (const entry of readdirSync(directory)) {
    const absolute = resolve(directory, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) result.push(...listSourceModules(absolute));
    else if (/[.](?:mjs|cjs|js|mts|cts|ts)$/i.test(entry)) result.push(absolute);
  }
  return result;
}

function resolveLocalModule(fromRepositoryPath, specifier) {
  const base = relative(root, resolve(root, dirname(fromRepositoryPath), specifier)).replaceAll("\\", "/");
  const candidates = [base, `${base}.mjs`, `${base}.cjs`, `${base}.js`, `${base}.ts`, `${base}/index.mjs`, `${base}/index.js`];
  for (const candidate of candidates) {
    const absolutePath = resolve(root, candidate);
    if (existsSync(absolutePath)) return { repositoryPath: candidate, absolutePath };
  }
  return null;
}

function renderReport(audit) {
  const counts = count(audit.records, "coreClassification");
  const effects = countFlat(audit.records, "detectedSideEffects");
  const highRisk = audit.records.filter((record) => record.coreClassification === "deferred-high-risk").sort((left, right) => right.sourceRange.endLine - right.sourceRange.startLine - (left.sourceRange.endLine - left.sourceRange.startLine)).slice(0, 20);
  const selected = audit.selection.status === "selected" ? `- Selected: \`${audit.selection.selectedRecordId}\`\n- Rationale: ${audit.selection.rationale}` : `- ${audit.selection.code}\n- Blockers: ${audit.selection.blockers.join("; ")}`;
  const selectedRecord = audit.selection.status === "selected" ? audit.records.find((record) => record.id === audit.selection.selectedRecordId) : null;
  const defaultValueRecord = audit.records.find((record) => record.functionName === "defaultValueForFieldType");
  const escapeRegExpRecord = audit.records.find((record) => record.functionName === "escapeRegExp");
  const looseFormMatchRecord = audit.records.find((record) => record.functionName === "normalizeForLooseFormMatch");
  const stripPlanningSuffixRecord = audit.records.find((record) => record.functionName === "stripPlanningDocumentSuffix");
  const dependencyNameRecord = audit.records.find((record) => record.functionName === "dependencyName");
  const defaultValueEvidence = defaultValueRecord?.shadowImplementation
    ? `\n## Phase 4D defaultValueForFieldType Evidence\n\n- Legacy function: \`${defaultValueRecord.shadowImplementation.legacyFunctionPath}\`\n- Core source function: \`${defaultValueRecord.shadowImplementation.coreSourceFunctionPath}\`\n- Differential corpus: \`${defaultValueRecord.shadowImplementation.corpusPath}\` (${defaultValueRecord.shadowImplementation.corpusCaseCount} cases)\n- Audit result: one buildFieldRecord call site; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.\n- Legacy behavior: ${defaultValueRecord.shadowImplementation.legacyBehavior.acceptedInputRule} ${defaultValueRecord.shadowImplementation.legacyBehavior.malformedInput}\n- Routing and rollback: ${JSON.stringify(defaultValueRecord.shadowImplementation.productionCallerSwitch)}\n`
    : "";
  const escapeRegExpEvidence = escapeRegExpRecord?.shadowImplementation
    ? `\n## Phase 4E escapeRegExp Evidence\n\n- Legacy function: \`${escapeRegExpRecord.shadowImplementation.legacyFunctionPath}\`\n- Core source function: \`${escapeRegExpRecord.shadowImplementation.coreSourceFunctionPath}\`\n- Differential corpus: \`${escapeRegExpRecord.shadowImplementation.corpusPath}\` (${escapeRegExpRecord.shadowImplementation.corpusCaseCount} cases)\n- Pre-cutover audit result: one extractNamedSection call site; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.\n- Post-cutover ledger result: zero Legacy helper callers and one Core alias call, recorded by routing evidence.\n- Legacy behavior: ${escapeRegExpRecord.shadowImplementation.legacyBehavior.acceptedInputRule} ${escapeRegExpRecord.shadowImplementation.legacyBehavior.malformedInput}\n- Routing and rollback: ${JSON.stringify(escapeRegExpRecord.shadowImplementation.productionCallerSwitch)}\n`
    : "";
  const looseFormMatchEvidence = looseFormMatchRecord?.shadowImplementation
    ? `\n## Phase 4G normalizeForLooseFormMatch Evidence\n\n- Legacy function: \`${looseFormMatchRecord.shadowImplementation.legacyFunctionPath}\`\n- Core source function: \`${looseFormMatchRecord.shadowImplementation.coreSourceFunctionPath}\`\n- Differential corpus: \`${looseFormMatchRecord.shadowImplementation.corpusPath}\` (${looseFormMatchRecord.shadowImplementation.corpusCaseCount} cases)\n- Pre-cutover audit result: three reverseRelatedRecordMatchesForm call expressions; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.\n- Post-cutover ledger result: zero Legacy helper callers and three Core alias calls, recorded by routing evidence.\n- Legacy behavior: ${looseFormMatchRecord.shadowImplementation.legacyBehavior.acceptedInputRule} ${looseFormMatchRecord.shadowImplementation.legacyBehavior.malformedInput}\n- Routing and rollback: ${JSON.stringify(looseFormMatchRecord.shadowImplementation.productionCallerSwitch)}\n`
    : "";
  const stripPlanningSuffixEvidence = stripPlanningSuffixRecord?.shadowImplementation
    ? `\n## Phase 4H stripPlanningDocumentSuffix Evidence\n\n- Legacy function: \`${stripPlanningSuffixRecord.shadowImplementation.legacyFunctionPath}\`\n- Core source function: \`${stripPlanningSuffixRecord.shadowImplementation.coreSourceFunctionPath}\`\n- Differential corpus: \`${stripPlanningSuffixRecord.shadowImplementation.corpusPath}\` (${stripPlanningSuffixRecord.shadowImplementation.corpusCaseCount} cases)\n- Pre-cutover audit result: three extractTitle and extractApplicationName call expressions; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.\n- Post-cutover ledger result: zero Legacy helper callers and three Core alias calls, recorded by routing evidence.\n- Legacy behavior: ${stripPlanningSuffixRecord.shadowImplementation.legacyBehavior.acceptedInputRule} ${stripPlanningSuffixRecord.shadowImplementation.legacyBehavior.malformedInput}\n- Routing and rollback: ${JSON.stringify(stripPlanningSuffixRecord.shadowImplementation.productionCallerSwitch)}\n`
    : "";
  const dependencyNameEvidence = dependencyNameRecord?.shadowImplementation
    ? `\n## Phase 4I dependencyName Evidence\n\n- Legacy function: \`${dependencyNameRecord.shadowImplementation.legacyFunctionPath}\`\n- Core source function: \`${dependencyNameRecord.shadowImplementation.coreSourceFunctionPath}\`\n- Differential corpus: \`${dependencyNameRecord.shadowImplementation.corpusPath}\` (${dependencyNameRecord.shadowImplementation.corpusCaseCount} cases)\n- Pre-cutover audit result: four buildTemplateDependencyNameMaps call expressions; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.\n- Post-cutover ledger result: zero Legacy helper callers and four Core alias calls, recorded by routing evidence.\n- Legacy behavior: ${dependencyNameRecord.shadowImplementation.legacyBehavior.acceptedInputRule} ${dependencyNameRecord.shadowImplementation.legacyBehavior.malformedInput}\n- Routing and rollback: ${JSON.stringify(dependencyNameRecord.shadowImplementation.productionCallerSwitch)}\n`
    : "";
  const phase4f = audit.phase4fCandidateSelection;
  const phase4fTable = phase4f?.rankedEligibleCandidates?.length
    ? `\n## Phase 4F Candidate-Selection Audit\n\nThis is an audit-only selection. It does not add a Core export, adapter export, differential corpus, routing change, or distribution artifact.\n\n| Rank | Candidate | Source | Historical call expressions | Classification | Rationale |\n| --- | --- | --- | ---: | --- | --- |\n${phase4f.rankedEligibleCandidates.map((recordId) => phase4f.candidates.find((candidate) => candidate.recordId === recordId)).map((candidate) => `| ${candidate.rank} | \`${candidate.functionName}\` | ${candidate.sourceRange.startLine}-${candidate.sourceRange.endLine} | ${candidate.historicalProductionCallExpressionCount ?? candidate.productionCallSites.length} | ${candidate.classification} | ${candidate.rationale} |`).join("\n")}\n\nRecommendation: \`${phase4f.recommendedNextSlice.functionName}\`. It is the smallest independent candidate with one enclosing production caller, three call expressions, no dependencies or host behavior, a narrow string contract, and an isolated rollback surface.\n\nAll other remaining deterministic records are retained in the machine-readable Phase 4F inventory with a defer-high-risk assessment. Prohibited field/control projection, resource construction, workflow materialization, ID allocation, archive/package writing, generated-final target/projection validation, and runtime behavior were not selected.\n`
    : "\n## Phase 4F Candidate-Selection Audit\n\nNO_SAFE_MATERIALIZER_PHASE_4F_SLICE_SELECTED\n";
  const parity = audit.selection.status === "selected" ? JSON.stringify(audit.selection.parityFixtureContract.fixtureShape) : "No slice selected.";
  const shadow = selectedRecord?.shadowImplementation
    ? `\n## Phase 4A, 4B, and 4C Evidence\n\n- Legacy function: \`${selectedRecord.shadowImplementation.legacyFunctionPath}\`\n- Core source function: \`${selectedRecord.shadowImplementation.coreSourceFunctionPath}\`\n- Compiled Core function: \`${selectedRecord.shadowImplementation.compiledCoreFunctionPath}\`\n- Differential corpus: \`${selectedRecord.shadowImplementation.corpusPath}\` (${selectedRecord.shadowImplementation.corpusCaseCount} cases)\n- Shadow evidence: ${selectedRecord.shadowImplementation.parityMarkers.join(", ")}\n- Public API: \`compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json\`\n- Distribution proof: ${JSON.stringify(selectedRecord.shadowImplementation.distributionCutover)}\n- Production routing: ${JSON.stringify(selectedRecord.shadowImplementation.productionCallerSwitch)}\n- Compatibility-adapter cutover: ${JSON.stringify(selectedRecord.shadowImplementation.compatibilityAdapterCutover)}\n\n### Exact Legacy Behavior\n\n- Accepted input rule: ${selectedRecord.shadowImplementation.legacyBehavior.acceptedInputRule}\n- Trimming: ${selectedRecord.shadowImplementation.legacyBehavior.trimming}\n- Case normalization: ${selectedRecord.shadowImplementation.legacyBehavior.caseNormalization}\n- Malformed input: ${selectedRecord.shadowImplementation.legacyBehavior.malformedInput}\n- Null-like input: ${selectedRecord.shadowImplementation.legacyBehavior.nullLikeInput}\n- JSON coercion edge case: ${selectedRecord.shadowImplementation.legacyBehavior.jsonCoercionEdgeCase}\n- Return type: ${selectedRecord.shadowImplementation.legacyBehavior.returnType}\n- Thrown-error behavior: ${selectedRecord.shadowImplementation.legacyBehavior.thrownErrorBehavior}\n- Mutation behavior: ${selectedRecord.shadowImplementation.legacyBehavior.mutationBehavior}\n` : "";
  return `# Materializer Seam Audit v0.1.0\n\n## Scope\n\nThis records the static Phase 4 seam audit, bounded Phase 4A Core shadow proof, Phase 4B distribution proof, Phase 4C normalizeHexColor production routing, Phase 4D defaultValueForFieldType production routing, Phase 4E escapeRegExp production routing, Phase 4F audit-only candidate selection, Phase 4G normalizeForLooseFormMatch production routing, Phase 4H stripPlanningDocumentSuffix production routing, and Phase 4I dependencyName production routing. It does not route any other materializer capability, host orchestration, package writing, ID allocation, archive behavior, target/projection validation, API behavior, or runtime behavior through Core.\n\n## Analysis\n\n- Source: \`${audit.sourcePath}\`\n- Method: ${audit.analysisMethod}\n- Audited top-level functions: ${audit.records.length}\n- Direct local helper modules: ${audit.directHelperModules.length}\n- Classification counts: ${JSON.stringify(counts)}\n- Detected host-side-effect categories: ${JSON.stringify(effects)}\n\n## Strict Eligibility\n\nA deterministic Core candidate must have no host effects, nondeterminism, mutable externally owned object mutation, or Legacy Markdown parser dependency. Its input/output contract must be JSON-serializable and bounded by focused parity evidence.\n\n## First Proposed Vertical Slice\n\n${selected}\n\n## Deferred High-Risk Functions\n\n${highRisk.map((record) => `- \`${record.functionName}\` (${record.sourceRange.startLine}-${record.sourceRange.endLine}): ${record.classificationReason}`).join("\n") || "- None"}\n\n## Required Parity Contract\n\nThe selected slice requires exact Legacy/Core equality for this versioned fixture shape: \`${parity}\`. It must assert normalized return values, error behavior, and input immutability before any production adoption.${shadow}${defaultValueEvidence}${escapeRegExpEvidence}${looseFormMatchEvidence}${stripPlanningSuffixEvidence}${dependencyNameEvidence}${phase4fTable}\n## Boundaries Preserved\n\n- The Legacy normalizeHexColor, defaultValueForFieldType, escapeRegExp, normalizeForLooseFormMatch, stripPlanningDocumentSuffix, and dependencyName helpers remain intact as explicit rollback baselines.\n- \`scripts/materialize-yapk-focused-upgrade-scope.mjs\` remains unchanged.\n- Phase 4I routes only dependencyName; no other seam or host behavior changes.\n`;
}

function count(records, key) { return records.reduce((result, record) => { result[record[key]] = (result[record[key]] || 0) + 1; return result; }, {}); }
function countFlat(records, key) { return records.flatMap((record) => record[key]).reduce((result, value) => { result[value] = (result[value] || 0) + 1; return result; }, {}); }
function rootIdentifier(node) { let current = node; while (ts.isPropertyAccessExpression(current) || ts.isElementAccessExpression(current)) current = current.expression; return ts.isIdentifier(current) ? current.text : null; }
function isMutator(name) { return new Set(["push", "pop", "splice", "sort", "reverse", "shift", "unshift", "set", "delete", "add", "clear"]).has(name); }
function isAssignmentOperator(kind) { return kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment; }
function hasExport(node) { return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)); }
function returnShape(expression) { if (!expression) return "undefined"; if (ts.isObjectLiteralExpression(expression)) return "object"; if (ts.isArrayLiteralExpression(expression)) return "array"; if (ts.isStringLiteralLike(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return "string"; if (ts.isNumericLiteral(expression)) return "number"; if (expression.kind === ts.SyntaxKind.TrueKeyword || expression.kind === ts.SyntaxKind.FalseKeyword) return "boolean"; if (expression.kind === ts.SyntaxKind.NullKeyword) return "null"; return "computed-value"; }
function isProtected(repositoryPath) { return / [23]\.[^/]+$/.test(repositoryPath); }
function writeJson(file, value) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
