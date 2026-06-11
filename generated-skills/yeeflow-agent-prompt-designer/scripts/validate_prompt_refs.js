#!/usr/bin/env node
const fs = require("fs");
const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error("Usage: validate_prompt_refs.js <manifest.json>");
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const templates = manifest.templates || [];
const errors = [];
for (const t of templates) {
  const prompt = t.persona_and_prompt || t.prompt || "";
  for (const section of ["Role:", "Your job is to:", "Goals:", "Skills:", "Workflow:", "OutputFormat:", "Constraints:"]) {
    if (!prompt.includes(section)) errors.push(t.name + ": missing section " + section);
  }
  for (const v of [...(t.input_variables || []), ...(t.output_variables || [])]) {
    if (!prompt.includes("{{" + v.name + "}}")) errors.push(t.name + ": missing {{" + v.name + "}}");
  }
}
console.log(JSON.stringify({ templates: templates.length, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
