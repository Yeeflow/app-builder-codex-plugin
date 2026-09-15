import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
export const services = ["yeeflow"];
export function validateApps(value) {
  if (!value || !value.apps || Object.keys(value).some(k => k !== "apps") ||
      Object.keys(value.apps).sort().join() !== [...services].sort().join())
    throw new Error("PLUGIN_APPS_SERVICE_SET_INVALID: exactly one unified Yeeflow mapping required");
  const ids = services.map(key => {
    const app = value.apps[key];
    if (!app || Object.keys(app).join() !== "id" || typeof app.id !== "string" ||
        !/^(asdk_app_|connector_|templated_apps_)[A-Za-z0-9][A-Za-z0-9_-]*$/.test(app.id))
      throw new Error(`PLUGIN_APP_ID_INVALID: ${key}; use registered App ID, not plugin directory ID`);
    return app.id;
  });
  if (new Set(ids).size !== services.length) throw new Error("PLUGIN_APP_ID_DUPLICATE");
  return value;
}
export function profileOptions(argv) {
  const take = (key, fallback) => {
    const i = argv.indexOf(key);
    if (i < 0) return fallback;
    if (argv.lastIndexOf(key) !== i || !argv[i+1] || argv[i+1].startsWith("--")) throw new Error(`PLUGIN_ARGUMENT_INVALID: ${key}`);
    return argv[i+1];
  };
  const profile = take("--profile", "codex");
  if (!["codex", "chatgpt-web"].includes(profile)) throw new Error("PLUGIN_PROFILE_INVALID");
  const appsPath = take("--apps", null), name = take("--name", "yeeflow-app-builder"), displayName = take("--display-name", null);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) throw new Error("PLUGIN_NAME_INVALID");
  if (profile === "codex" && (appsPath || argv.includes("--name") || displayName)) throw new Error("PLUGIN_WEB_OPTIONS_REQUIRE_WEB_PROFILE");
  if (profile === "chatgpt-web" && !appsPath) throw new Error("PLUGIN_WEB_APPS_REQUIRED");
  return { profile, appsPath, name, displayName };
}
export function applyHostProfile(stageRoot, repoRoot, options, apps) {
  const manifestPath = resolve(stageRoot, ".codex-plugin/plugin.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  // The canonical validator owns the complete shared dependency graph.
  copyFileSync(resolve(repoRoot, "skills/installed/yeeflow-application-generator/scripts/validate-yap-package.js"), resolve(stageRoot, "skills/yeeflow-application-generator/scripts/validate-yap-package.js"));
  copyFileSync(resolve(repoRoot, "scripts/test-skill-entrypoint-compat.mjs"), resolve(stageRoot, "scripts/test-skill-entrypoint-compat.mjs"));
  const guidance = readFileSync(resolve(repoRoot, "docs/standards/plugin-resource-access.md"), "utf8");
  for (const skill of readdirSync(resolve(stageRoot, "skills"))) {
    const file = resolve(stageRoot, "skills", skill, "SKILL.md");
    if (!existsSync(file)) continue;
    const body = readFileSync(file, "utf8");
    const marker = "<!-- plugin-resource-access -->";
    writeFileSync(file, body.split(marker)[0].trimEnd() + "\n\n" + marker + "\n" + guidance);
  }
  if (options.profile === "codex") {
    delete manifest.apps;
    rmSync(resolve(stageRoot, ".app.json"), { force: true });
    manifest.mcpServers = "./.mcp.json";
  }
  if (options.profile === "chatgpt-web") {
    validateApps(apps);
    delete manifest.mcpServers;
    // Removing only the manifest field leaves default MCP autodiscovery active.
    rmSync(resolve(stageRoot, ".mcp.json"), { force: true });
    rmSync(resolve(stageRoot, "mcp.json"), { force: true });
    manifest.apps = "./.app.json";
    manifest.name = options.name;
    if (options.displayName) manifest.interface.displayName = options.displayName;
    manifest.interface.longDescription = manifest.interface.longDescription.replace("in Codex", "in ChatGPT");
    writeFileSync(resolve(stageRoot, ".app.json"), JSON.stringify(apps, null, 2) + "\n");
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}
