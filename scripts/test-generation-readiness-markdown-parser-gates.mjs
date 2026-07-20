#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseMarkdownTables, splitMarkdownTableRow, stripMarkdownFencedBlocks } from "./lib/markdown-planning-utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "generation-readiness-markdown-parser-"));

try {
  const readinessValidators = [
    "validate-generation-readiness-review.mjs",
    "validate-form-action-query-data-plan.mjs",
    "validate-workflow-query-data-plan.mjs",
    "validate-workflow-loop-plan.mjs",
    "validate-workflow-set-data-list-plan.mjs",
    "validate-set-variable-plan.mjs",
    "validate-form-action-set-data-list-plan.mjs",
    "validate-form-action-open-resource-plan.mjs",
    "validate-form-action-print-barcode-plan.mjs",
  ];
  for (const script of readinessValidators) {
    const source = fs.readFileSync(path.join(root, "scripts", script), "utf8");
    assert.equal(source.includes('split("|")'), false, `${script} must not use raw split(\"|\")`);
    assert.equal(source.includes("split('|')"), false, `${script} must not use raw split('|')`);
    assert.match(source, /markdown-planning-(?:utils|core-adapter)\.mjs/, `${script} must use the shared Markdown planning parser`);
  }

  assert.deepEqual(
    splitMarkdownTableRow("| Name | Notes | JSON |"),
    ["Name", "Notes", "JSON"],
  );
  assert.deepEqual(
    splitMarkdownTableRow('| Example | A \\| B | `[{"value":"A|B"}]` |'),
    ["Example", "A | B", '`[{"value":"A|B"}]`'],
  );

  const fencedExample = [
    "Before",
    "```markdown",
    "| Workflow Host | Workflow Name | Node Name | Page Size |",
    "| --- | --- | --- | --- |",
    "| Scheduled | Fake workflow | Fake query | 5000 |",
    "```",
    "After",
  ].join("\n");
  assert.equal(parseMarkdownTables(fencedExample).length, 0);
  assert.equal(stripMarkdownFencedBlocks(fencedExample).includes("Fake workflow"), false);

  const template = fs.readFileSync(path.join(root, "docs/standards/app-plan-standard-template.md"), "utf8");
  const fixture = path.join(tempDir, "escaped-pipe-and-fenced-example.md");
  fs.writeFileSync(fixture, [
    template,
    "",
    "The business label may be written as A \\| B and the export example may contain `[{\"value\":\"A|B\"}]`.",
    "",
    "```markdown",
    "#### Form Action Query Data Planning",
    "| Surface | Host Page / Form | Action Name | Step Name | Query Mode | Source Resource Type | Source Resource | Filters / Conditions | Sort Fields | Page Number | Page Size | Result Target | Result Field Mapping | Result Count Target | Trigger / Consumer | Data Persistence | Proof Boundary | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Dashboard | Fake | Fake | Fake | multiple | Data List | Fake | none | none | 0 | 5000 | temp | none | none | none | page-only | export-proven | This fenced example must be ignored. |",
    "```",
    "",
  ].join("\n"));

  const result = spawnSync(process.execPath, [
    path.join(root, "scripts/validate-generation-readiness-review.mjs"),
    "--plan", fixture,
    "--json",
  ], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout || result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  console.log("generation-readiness Markdown parser gates: pass (escaped pipes + inline code pipes + fenced examples)");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
