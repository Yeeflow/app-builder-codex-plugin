#!/usr/bin/env node
const fs = require("fs");

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error("Usage: validate_copilot_instruction.js <manifest.json>");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const templates = manifest.templates || manifest.copilots || [];
const requiredSections = [
  "Role:",
  "Purpose:",
  "How to work:",
  "Recommended tool guidance",
  "Reusable template note:",
  "Output style:",
  "Guardrails:",
];
const errors = [];

for (const t of templates) {
  const text = t.instruction || t.instructions || "";
  if (!text.trim()) {
    errors.push(`${t.name}: missing instruction`);
    continue;
  }
  for (const section of requiredSections) {
    if (!text.includes(section)) errors.push(`${t.name}: missing section ${section}`);
  }
  if (/approve|reject|send|pay|sign|hire|terminate/i.test(text) && !/Do not approve|Do not.*send|Do not.*pay|Do not.*sign|Do not.*hire|Do not.*terminate/i.test(text)) {
    errors.push(`${t.name}: contains sensitive action language without clear restriction`);
  }
  if (!/human review|human owner|human approval/i.test(text)) {
    errors.push(`${t.name}: missing human review/escalation language`);
  }
}

console.log(JSON.stringify({ templates: templates.length, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
