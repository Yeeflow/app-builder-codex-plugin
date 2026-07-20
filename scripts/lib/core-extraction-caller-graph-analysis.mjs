import { readFileSync } from "node:fs";
import { extname, normalize, resolve } from "node:path";
import ts from "typescript";

function scriptKind(file) {
  return extname(file) === ".ts" ? ts.ScriptKind.TS : ts.ScriptKind.JS;
}

function isFunction(node) {
  return ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node);
}

function nameOf(node, source) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) return node.parent.name.text;
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  return `anonymous@${position.line + 1}:${position.character + 1}`;
}

function exported(node) {
  if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) return true;
  if (ts.isVariableDeclaration(node.parent) && ts.isVariableDeclarationList(node.parent.parent)) {
    return node.parent.parent.parent?.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) || false;
  }
  return false;
}

function parentFunction(node, functionsByNode) {
  let current = node.parent;
  while (current) {
    if (functionsByNode.has(current)) return functionsByNode.get(current);
    current = current.parent;
  }
  return null;
}

function callbackCall(node) {
  let current = node.parent;
  while (current) {
    if (ts.isCallExpression(current) && current.arguments.some((argument) => argument === node || argument.pos <= node.pos && argument.end >= node.end)) return current;
    if (isFunction(current)) return null;
    current = current.parent;
  }
  return null;
}

/**
 * Builds a production-source-only caller graph. The caller count deliberately
 * means AST call-sites, not test imports, exports, or text occurrences.
 */
export function analyzeCallerGraph({ root, modulePaths }) {
  const knownFiles = new Set(modulePaths.map((path) => normalize(resolve(root, path))));
  const program = ts.createProgram([...knownFiles], {
    allowJs: true,
    checkJs: false,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const modules = new Map();
  const allRecords = [];
  const symbolToRecord = new Map();

  for (const modulePath of modulePaths) {
    const absolute = normalize(resolve(root, modulePath));
    const source = program.getSourceFile(absolute) || ts.createSourceFile(absolute, readFileSync(absolute, "utf8"), ts.ScriptTarget.ESNext, true, scriptKind(absolute));
    const records = [];
    const byNode = new Map();
    const byName = new Map();
    const visit = (node) => {
      if (isFunction(node)) {
        const name = nameOf(node, source);
        const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
        const record = {
          id: `${modulePath}#${name}@${line}`,
          module: modulePath,
          function: name,
          line,
          start: node.getStart(source),
          exported: exported(node),
          symbol: functionSymbol(node, checker),
          node,
        };
        records.push(record);
        if (record.symbol) symbolToRecord.set(resolveAlias(record.symbol, checker), record);
        byNode.set(node, record);
        if (!byName.has(name)) byName.set(name, []);
        byName.get(name).push(record);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    for (const candidates of byName.values()) candidates.sort((left, right) => left.start - right.start);
    modules.set(absolute, { absolute, modulePath, source, records, byNode, byName });
    allRecords.push(...records);
  }

  const edges = [];
  const addEdge = (edge) => edges.push({ ...edge, fromFunctionId: edge.fromFunctionId || null });
  for (const module of modules.values()) {
    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        const caller = parentFunction(node, module.byNode);
        const line = module.source.getLineAndCharacterOfPosition(node.getStart(module.source)).line + 1;
        const symbolNode = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression;
        const target = symbolToRecord.get(resolveAlias(checker.getSymbolAtLocation(symbolNode), checker));
        const kind = target?.module === module.modulePath ? "direct-local" : "imported-binding";
        if (target) addEdge({ kind, fromModule: module.modulePath, fromFunctionId: caller?.id, toFunctionId: target.id, line });
      }
      ts.forEachChild(node, visit);
    };
    visit(module.source);
    for (const record of module.records) {
      if (!record.function.startsWith("anonymous@")) continue;
      const call = callbackCall(record.node);
      if (!call) continue;
      const caller = parentFunction(call, module.byNode);
      const line = module.source.getLineAndCharacterOfPosition(call.getStart(module.source)).line + 1;
      addEdge({ kind: "callback-only", fromModule: module.modulePath, fromFunctionId: caller?.id, toFunctionId: record.id, line });
    }
  }

  const evidenceById = new Map();
  for (const record of allRecords) {
    const incoming = edges.filter((edge) => edge.toFunctionId === record.id);
    const directLocalCalls = incoming.filter((edge) => edge.kind === "direct-local");
    const importedBindingCalls = incoming.filter((edge) => edge.kind === "imported-binding");
    const callbackOnlyCalls = incoming.filter((edge) => edge.kind === "callback-only");
    const exportedConsumers = [...new Set(importedBindingCalls.map((edge) => edge.fromModule))].sort();
    const callerCount = directLocalCalls.length + importedBindingCalls.length + callbackOnlyCalls.length;
    evidenceById.set(record.id, {
      currentFunctionId: record.id,
      presentInCurrentProductionSource: true,
      callerCount,
      directLocalCallCount: directLocalCalls.length,
      importedBindingCallCount: importedBindingCalls.length,
      exportedFunctionConsumerCount: exportedConsumers.length,
      exportedConsumerModules: exportedConsumers,
      callbackOnlyInvocationCount: callbackOnlyCalls.length,
      trulyUnreachable: callerCount === 0 && !record.exported,
      exportedWithoutProductionConsumer: callerCount === 0 && record.exported,
      calls: incoming.map(({ kind, fromModule, fromFunctionId, line }) => ({ kind, fromModule, fromFunctionId, line })),
    });
  }

  return {
    schemaVersion: "1.0.0",
    analysisMethod: "TypeScript AST call-expression and import-binding resolution over the declared production source scope only.",
    sourceModules: modulePaths.slice().sort(),
    records: allRecords.map(({ node, start, symbol, ...record }) => ({ ...record, callerEvidence: evidenceById.get(record.id) })),
    edges: edges.sort((left, right) => `${left.toFunctionId}:${left.line}:${left.kind}`.localeCompare(`${right.toFunctionId}:${right.line}:${right.kind}`)),
    evidenceById,
  };
}

function functionSymbol(node, checker) {
  if (node.name && ts.isIdentifier(node.name)) return checker.getSymbolAtLocation(node.name);
  if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) return checker.getSymbolAtLocation(node.parent.name);
  return null;
}

function resolveAlias(symbol, checker) {
  if (!symbol) return null;
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

export function resolveInventoryFunction(graph, entry) {
  const exact = graph.evidenceById.get(entry.id);
  if (exact) return exact;
  const candidates = graph.records.filter((record) => record.module === entry.module && record.function === entry.function);
  if (candidates.length) {
    const selected = candidates.sort((left, right) => Math.abs(left.line - entry.line) - Math.abs(right.line - entry.line))[0];
    return { ...selected.callerEvidence, matchedBy: "module-and-function-name" };
  }
  return {
    currentFunctionId: null,
    presentInCurrentProductionSource: false,
    callerCount: 0,
    directLocalCallCount: 0,
    importedBindingCallCount: 0,
    exportedFunctionConsumerCount: 0,
    exportedConsumerModules: [],
    callbackOnlyInvocationCount: 0,
    trulyUnreachable: false,
    exportedWithoutProductionConsumer: false,
    calls: [],
    matchedBy: "historical-function-not-present-in-current-production-source",
  };
}
