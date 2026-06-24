import fs from "node:fs";
import path from "node:path";

export const DIST_PLUGIN_ROOT = "dist/yeeflow-app-builder-plugin";

export function isInstalledPluginPayloadRoot(root) {
  const resolvedRoot = path.resolve(root);
  return (
    fs.existsSync(path.join(resolvedRoot, ".codex-plugin", "plugin.json")) &&
    fs.existsSync(path.join(resolvedRoot, "scripts")) &&
    !fs.existsSync(path.join(resolvedRoot, DIST_PLUGIN_ROOT, ".codex-plugin", "plugin.json"))
  );
}

export function pluginRootMode(root) {
  return isInstalledPluginPayloadRoot(root) ? "installed-cache-root" : "source-root";
}

export function artifactPathsForRoot(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const source = path.join(resolvedRoot, relativePath);
  if (isInstalledPluginPayloadRoot(resolvedRoot)) {
    return {
      mode: "installed-cache-root",
      source,
      mirror: source,
      mirrorRequired: false,
    };
  }
  return {
    mode: "source-root",
    source,
    mirror: path.join(resolvedRoot, DIST_PLUGIN_ROOT, relativePath),
    mirrorRequired: true,
  };
}
