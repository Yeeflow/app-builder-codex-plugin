#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(ROOT, "docs", "examples", "runtime-evidence.redacted.example.json");

const childTests = [
  {
    name: "UI/Summary/KPI runtime hard-gate regression suite",
    command: ["scripts/test-ui-summary-kpi-runtime-hard-gates.mjs"],
    validators: [
      "inspect-yeeflow-ui-design-contract",
      "inspect-dashboard-style-shapes",
      "inspect-dashboard-summary-control-contract",
      "inspect-data-analytics-control-identity",
      "inspect-visible-kpi-runtime-bindings",
      "inspect-runtime-evidence",
      "inspect-grid-table-quality",
    ],
  },
  {
    name: "UI generation hard-gate skill wording/layout suite",
    command: ["scripts/test-ui-generation-hard-gate-skills.mjs"],
    validators: ["yeeflow-ui-generation-hard-gates skill wording"],
  },
  {
    name: "Dashboard generation resource/report hard-gate regression suite",
    command: ["scripts/test-dashboard-generation-hard-gates.mjs"],
    validators: [
      "validate-dashboard-generation-hard-gates",
      "filter field/value/style metadata",
      "Container coded width/layout keys",
      "KPI native Icon structure",
      "Summary field selection and canonical app URL reporting",
    ],
  },
  {
    name: "Dashboard dataset presentation golden-reference regression suite",
    command: ["scripts/test-dashboard-dataset-presentation-golden-references.mjs"],
    validators: [
      "validate-dashboard-dataset-presentation-golden-references",
      "approved Dashboard Collection presentation template selection",
      "App Plan dataset presentation reference enforcement",
    ],
  },
  {
    name: "Dashboard install/runtime root binding and v1.1 padding regression suite",
    command: ["scripts/test-dashboard-install-runtime-root-binding-gates.mjs"],
    validators: [
      "validate-yapk-package Type 103 page root binding",
      "Dashboard Page Layouts v1.1 Content padding parity",
      "package API canonical runtime URL boundary",
    ],
  },
  {
    name: "YAPK dashboard runtime materialization and preflight regression suite",
    command: ["scripts/test-yapk-dashboard-runtime-materialization-preflight-gates.mjs"],
    validators: [
      "validate-generated-yapk-export-shape",
      "validate-dashboard-generation-hard-gates",
      "validate-generated-final-resource-completeness",
      "validate-standard-package-schema",
      "validate-yapk-package",
      "Dashboard business-bound runtime materialization",
    ],
  },
  {
    name: "Yeeflow application layout design rule regression suite",
    command: ["scripts/test-application-layout-design-rules.mjs"],
    validators: [
      "inspect-application-layout-design-rules",
      "official Yeeflow application layout design standard",
    ],
  },
  {
    name: "Marketing Event design/runtime fidelity study hard-gate wording suite",
    command: ["scripts/test-design-runtime-fidelity-study-hard-gates.mjs"],
    validators: [
      "Marketing Event v0.6.45 design-to-runtime lessons",
      "primary navigation and content-fidelity training guidance",
    ],
  },
  {
    name: "Runtime navigation proof hard-gate regression suite",
    command: ["scripts/test-runtime-navigation-proof-gates.mjs"],
    validators: [
      "inspect-runtime-navigation-proof",
      "exact primary navigation and support-resource visibility proof",
    ],
  },
  {
    name: "Supplier runtime/design fidelity regression suite",
    command: ["scripts/test-supplier-runtime-design-fidelity-gates.mjs"],
    validators: [
      "inspect-supplier-runtime-design-fidelity",
      "Supplier runtime ListSetID, design PNG, Data Filter, Collection, analytics, progress, Summary/KPI gates",
    ],
  },
  {
    name: "Full-page design blueprint generation regression suite",
    command: ["scripts/test-full-page-design-blueprint-generation-gates.mjs"],
    validators: [
      "inspect-full-page-design-artifacts",
      "inspect-page-implementation-blueprint",
      "compare-blueprint-to-decoded-resource",
    ],
  },
  {
    name: "UI control property fidelity regression suite",
    command: ["scripts/test-ui-control-property-fidelity.mjs"],
    validators: [
      "inspect-ui-control-property-fidelity",
      "Container/Data Filter/filter-action/KPI card/Summary/full-page property fidelity",
    ],
  },
  {
    name: "Yeeflow control property knowledge base regression suite",
    command: ["scripts/test-yeeflow-control-property-knowledge-base.mjs"],
    validators: [
      "inspect-yeeflow-control-configurations",
      "product-catalog control property registry and extension rules",
    ],
  },
  {
    name: "Phase 1 UI closed-loop infrastructure regression suite",
    command: ["scripts/test-ui-closed-loop-phase1.mjs"],
    validators: [
      "generate-ui-contract-from-design",
      "capture-runtime-ui-evidence",
      "validate-ui-upgrade-scope",
    ],
  },
  {
    name: "Phase 2 design/runtime structure comparison regression suite",
    command: ["scripts/test-ui-closed-loop-phase2.mjs"],
    validators: [
      "compare-design-to-runtime-structure",
    ],
  },
  {
    name: "Phase 3A closed-loop hard-gate regression suite",
    command: ["scripts/test-ui-closed-loop-phase3.mjs"],
    validators: [
      "closed-loop workflow enforcement",
      "Marketing Event-inspired synthetic regressions",
    ],
  },
  {
    name: "Phase 3B workflow/report enforcement regression suite",
    command: ["scripts/test-ui-closed-loop-phase3b.mjs"],
    validators: [
      "inspect-ui-closed-loop-workflow-enforcement",
      "closed-loop final report artifact enforcement",
    ],
  },
];

const results = [];

try {
  validateRuntimeEvidenceTemplate();
  results.push({ name: "runtime evidence redacted template", status: "pass", command: "template validation" });

  for (const test of childTests) {
    const result = runChild(test);
    results.push(result);
    if (result.status !== "pass") {
      printSummaryAndExit(1);
    }
  }

  printSummaryAndExit(0);
} catch (error) {
  results.push({ name: "runtime evidence redacted template", status: "fail", command: "template validation", error: error.message });
  printSummaryAndExit(1);
}

function validateRuntimeEvidenceTemplate() {
  assert.equal(fs.existsSync(templatePath), true, `missing runtime evidence template: ${templatePath}`);
  const raw = fs.readFileSync(templatePath, "utf8");
  const evidence = JSON.parse(raw);

  assert.equal(evidence.dynamicVisibleKpiRuntimeProven, false, "top-level template example must keep fallback KPI binding unproven");
  assert.equal(evidence.runtimeScreenshotCaptured, true, "template must model runtime screenshot evidence as required");
  assert.equal(evidence.installOrSigningOnly, false, "template must not treat install/signing as runtime UI proof");
  assert.ok(Array.isArray(evidence.kpis) && evidence.kpis.length > 0, "template must include visible KPI entries");
  for (const kpi of evidence.kpis) {
    assert.equal(kpi.fallback, true, "template KPI values must be fallback examples");
    assert.equal(kpi.fallbackLabeled, true, "template fallback KPI values must be explicitly labeled");
    assert.equal(kpi.runtimeProven, false, "template must not claim runtime-proven dynamic KPI rendering");
  }
  assert.match(raw, /runtime screenshot evidence required before UI-quality claim/i);
  assert.match(raw, /dynamic visible KPI binding is proven only for the exact UUID Summary v1\.0\.1 shape/i);
  assert.match(raw, /beforeValues/i);
  assert.match(raw, /afterValues/i);
  assert.match(raw, /refreshedRecalculatedRuntimeEvidenceCaptured/i);
  assert.match(raw, /Summary recalculation can be asynchronous or cache-delayed/i);
  assert.match(raw, /Does not prove semantic or non-UUID Summary IDs/i);

  const forbiddenPatterns = [
    /https?:\/\/(?!example\.invalid\b)[^\s"]+/i,
    /\bBearer\s+[A-Za-z0-9._-]+/i,
    /\bsk-[A-Za-z0-9_-]+/i,
    /\b(?:access|refresh|id)_token\b/i,
    /"Resource"\s*:/,
    /"Sign"\s*:/,
    /rawApiResponse/i,
    /rawPackagePayload/i,
    /\b\d{15,}\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(raw, pattern, `runtime evidence template contains private-looking value: ${pattern}`);
  }
}

function runChild(test) {
  const childPath = path.join(ROOT, test.command[0]);
  if (!fs.existsSync(childPath)) {
    return {
      name: test.name,
      status: "skip",
      command: test.command.join(" "),
      validators: test.validators,
      note: "child test not present in this layout",
    };
  }

  const result = spawnSync(process.execPath, [childPath], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return {
    name: test.name,
    status: result.status === 0 ? "pass" : "fail",
    command: `node ${test.command.join(" ")}`,
    validators: test.validators,
    exitCode: result.status,
  };
}

function printSummaryAndExit(exitCode) {
  const counts = {
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
    skipped: results.filter((result) => result.status === "skip").length,
  };
  console.log(JSON.stringify({
    status: exitCode === 0 ? "pass" : "fail",
    testsRun: results.length,
    ...counts,
    childCommands: results.map((result) => ({
      name: result.name,
      status: result.status,
      command: result.command,
      validators: result.validators,
      note: result.note,
    })),
  }, null, 2));
  process.exit(exitCode);
}
