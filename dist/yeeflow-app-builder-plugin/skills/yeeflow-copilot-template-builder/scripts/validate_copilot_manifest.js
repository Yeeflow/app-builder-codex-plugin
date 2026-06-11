#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const manifestPath = process.argv[2];
const iconManifestPath = process.argv[3];
const packageFolder = process.argv[4] || "output/Copilot";

if (!manifestPath) {
  console.error("Usage: validate_copilot_manifest.js <manifest.json> [icon_manifest.json] [package-folder]");
  process.exit(2);
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const manifest = readJson(manifestPath);
const templates = manifest.templates || manifest.copilots || [];
const errors = [];

let iconEntries = [];
if (iconManifestPath && fs.existsSync(iconManifestPath)) {
  const iconManifest = readJson(iconManifestPath);
  iconEntries = iconManifest.icons || iconManifest.templates || iconManifest.entries || [];
}

if (!Array.isArray(templates) || templates.length === 0) {
  errors.push("No templates array found");
} else {
  for (const t of templates) {
    for (const key of ["name", "short_description", "icon_file_path", "instruction", "tool_calls"]) {
      if (!(key in t)) errors.push(`${t.name || "unnamed"}: missing ${key}`);
    }
    if (t.icon_file_path && !fs.existsSync(t.icon_file_path)) {
      errors.push(`${t.name}: icon missing on disk ${t.icon_file_path}`);
    }
    if (iconEntries.length) {
      const matches = iconEntries.filter((i) =>
        i.template_name === t.name ||
        i.templateName === t.name ||
        i.name === t.name ||
        i.template === t.name
      );
      if (matches.length !== 1) errors.push(`${t.name}: expected exactly one icon manifest match, found ${matches.length}`);
    }
    const packagePath = path.join(packageFolder, `${t.name}.yaic`);
    if (fs.existsSync(packageFolder) && !fs.existsSync(packagePath)) {
      errors.push(`${t.name}: missing .yaic package ${packagePath}`);
    }
    const companionIcon = path.join(packageFolder, "icons", `${slugify(t.name)}.png`);
    if (fs.existsSync(path.join(packageFolder, "icons")) && !fs.existsSync(companionIcon)) {
      errors.push(`${t.name}: missing companion package icon ${companionIcon}`);
    }
  }
}

console.log(JSON.stringify({ templates: templates.length, packageFolder, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
