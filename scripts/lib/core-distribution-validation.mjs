export function distributionLeakageFindings(text) {
  const checks = [
    ["workspace-import", /(?:import|export)\s*(?:[^"']*?from\s*)?["']@yeeflow\//u],
    ["bare-import", /(?:import|export)\s*(?:[^"']*?from\s*)?["'](?![./])/u],
    ["dynamic-import", /\bimport\s*\(\s*["']/u],
    ["require", /\brequire\s*\(\s*["']/u],
    ["file-url", /file:\/\//u],
    ["posix-path", /\/(?:Users|home|tmp)\//u],
    ["windows-path", /\b[A-Za-z]:\\/u],
    ["repository-path", /(?:^|[^A-Za-z])packages\//u],
    ["node-modules", /node_modules\//u],
    ["source-map", /sourceMappingURL=/u],
  ];
  return checks.filter(([, pattern]) => pattern.test(text)).map(([kind]) => ({ kind, code: "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE" }));
}
