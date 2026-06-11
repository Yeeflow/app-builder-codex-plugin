#!/usr/bin/env node
const fs = require("fs");
const manifestPath = process.argv[2];
const iconManifestPath = process.argv[3];
if (!manifestPath) {
  console.error("Usage: validate_ai_agent_manifest.js <manifest.json> [icon_manifest.json]");
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const templates = manifest.templates || manifest.ai_agents || manifest.agents || [];
if (!Array.isArray(templates) || templates.length === 0) throw new Error("No templates array found");
const iconEntries = iconManifestPath && fs.existsSync(iconManifestPath)
  ? JSON.parse(fs.readFileSync(iconManifestPath, "utf8")).icons || JSON.parse(fs.readFileSync(iconManifestPath, "utf8")).templates || []
  : [];
const errors = [];
for (const t of templates) {
  for (const key of ["name", "short_description", "icon_file_path", "input_variables", "output_variables", "persona_and_prompt"]) {
    if (!(key in t)) errors.push(t.name + ": missing " + key);
  }
  for (const group of ["input_variables", "output_variables"]) {
    if (!Array.isArray(t[group])) errors.push(t.name + ": " + group + " is not an array");
    else for (const v of t[group]) {
      if (!v.name || !v.type || !v.short_description) errors.push(t.name + ": incomplete " + group + " entry");
    }
  }
  if (t.icon_file_path && !fs.existsSync(t.icon_file_path)) errors.push(t.name + ": icon missing on disk " + t.icon_file_path);
  if (iconEntries.length) {
    const matches = iconEntries.filter(i => i.template_name === t.name || i.templateName === t.name || i.name === t.name);
    if (matches.length !== 1) errors.push(t.name + ": expected exactly one icon manifest match, found " + matches.length);
  }
}
console.log(JSON.stringify({ templates: templates.length, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
