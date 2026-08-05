#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nestedPlugin = resolve(root, "dist/yeeflow-app-builder-plugin");
const surfaces = [];

if (existsSync(resolve(root, "skills/installed"))) {
  surfaces.push({ name: "source-installed", surfaceRoot: root, skillsRoot: resolve(root, "skills/installed") });
}
if (existsSync(resolve(root, "generated-skills"))) {
  surfaces.push({ name: "source-generated", surfaceRoot: root, skillsRoot: resolve(root, "generated-skills") });
}
if (existsSync(nestedPlugin)) {
  surfaces.push({ name: "source-dist", surfaceRoot: nestedPlugin, skillsRoot: resolve(nestedPlugin, "skills") });
} else if (existsSync(resolve(root, "skills")) && !existsSync(resolve(root, "skills/installed"))) {
  surfaces.push({ name: "installed-cache", surfaceRoot: root, skillsRoot: resolve(root, "skills") });
}

assert.ok(surfaces.length > 0, "SKILL_REFERENCE_SURFACE_NOT_FOUND");

const findings = [];
let skillCount = 0;
let referenceCount = 0;
const surfaceReferenceCounts = Object.fromEntries(surfaces.map((surface) => [surface.name, 0]));

for (const surface of surfaces) {
  for (const entry of readdirSync(surface.skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = resolve(surface.skillsRoot, entry.name, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    skillCount += 1;
    const markdown = readFileSync(skillFile, "utf8");
    const references = [...markdown.matchAll(/`((?:\.\.\/)+[^`\n]+)`/gu)].map((match) => match[1]);
    for (const referencePath of references) {
      referenceCount += 1;
      surfaceReferenceCounts[surface.name] += 1;
      const target = resolve(dirname(skillFile), referencePath);
      const escaped = relative(surface.surfaceRoot, target).startsWith("..");
      if (escaped || !existsSync(target) || !statSync(target).isFile()) {
        findings.push({
          surface: surface.name,
          skill: entry.name,
          reference: referencePath,
          code: escaped ? "SKILL_REFERENCE_ESCAPES_SURFACE" : "SKILL_REFERENCE_TARGET_MISSING",
        });
      }
    }
  }
}

assert.equal(findings.length, 0, JSON.stringify(findings, null, 2));
for (const surface of surfaces) {
  assert.ok(
    surfaceReferenceCounts[surface.name] >= 10,
    `SKILL_REFERENCE_COVERAGE_TOO_LOW: ${surface.name}=${surfaceReferenceCounts[surface.name]}`,
  );
}

console.log(JSON.stringify({
  status: "pass",
  marker: "SKILL_RELATIVE_REFERENCE_GATES_PASSED",
  surfaces: surfaces.map((surface) => surface.name),
  skillCount,
  referenceCount,
  surfaceReferenceCounts,
}, null, 2));
