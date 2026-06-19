#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const REQUIRED_FIELDS = [
  "applicationName",
  "surfaceId",
  "surfaceName",
  "surfaceType",
  "appPlanResourceRef",
  "sourceResourceType",
  "sourceResourceName",
  "sourceListOrFormName",
  "surfaceResponsibility",
  "businessPurpose",
  "primaryUserRole",
  "dataSource",
  "fieldGroups",
  "requiredFields",
  "fieldTypeMapping",
  "requiredActions",
  "forbiddenRegions",
  "allowedRegions",
  "controlMapping",
  "responsiveRules",
  "htmlPreviewRequirements",
  "screenshotEvidenceRequirements",
  "blueprintRequirements",
  "designSystemRef",
  "uiPatternTemplateRef",
  "visualQualityRequirements",
  "proofBoundary",
];

const OFFICIAL_APPLICATION_LAYOUT_TYPES = new Set([
  "application-layout-1-vertical-nav",
  "application-layout-2-horizontal-nav",
  "application-layout-3-header-nav",
  "application-layout-4-no-nav",
]);

const INHERITED_READY_STATUS_FIELDS = [
  "layoutFidelityStatus",
  "modernVisualQualityStatus",
  "surfaceResponsibilityStatus",
  "fieldCoverageStatus",
  "actionCoverageStatus",
  "forbiddenRegionStatus",
  "semanticConsistencyStatus",
  "lowerPageVisualConcretenessStatus",
  "visualUsabilityStatus",
  "textOverflowStatus",
  "overlapStatus",
  "spacingStatus",
  "mobileUsabilityStatus",
  "templateReuseRiskStatus",
  "fullPageCoverageStatus",
  "pageEndStatus",
  "appPlanTraceabilityStatus",
];

const REQUIRED_SURFACE_HINTS = [
  { pattern: /\bdashboard page\b|\bdashboard pages plan\b/i, type: /\bdashboard\b/i, label: "Dashboard page" },
  { pattern: /\bapproval submission form\b|\bsubmission form\b/i, type: /\bapproval\b.*\bsubmission\b/i, label: "Approval Submission form" },
  { pattern: /\bapproval task form\b|\btask form\b/i, type: /\bapproval\b.*\btask\b/i, label: "Approval Task form" },
  { pattern: /\bapproval print page\b|\bprint page\b/i, type: /\bapproval\b.*\bprint\b/i, label: "Approval Print page" },
  { pattern: /\bdata list new\/edit form\b|\bdata list add\/edit form\b|\bnew\/edit form\b/i, type: /\bdata\s+list\b.*\b(new|edit|add\/edit)\b|\bnew\/edit\b/i, label: "Data List New/Edit form" },
  { pattern: /\bdata list view form\b|\bdata list detail form\b|\bview\/detail form\b/i, type: /\bdata\s+list\b.*\b(view|detail)\b|\bview\s+form\b|\bdetail\s+form\b/i, label: "Data List View/detail form" },
  { pattern: /\bdocument library new\/edit form\b|\bdocument new\/edit form\b/i, type: /\bdocument\b.*\b(new|edit|add\/edit)\b/i, label: "Document Library New/Edit form" },
  { pattern: /\bdocument library view form\b|\bdocument view\/detail form\b/i, type: /\bdocument\b.*\b(view|detail)\b/i, label: "Document Library View/detail form" },
];

const SURFACE_RESPONSIBILITY_RULES = [
  {
    match: /\bapproval\b.*\bsubmission\b/i,
    requiredActions: [/save\s+as\s+draft/i, /\bsubmit\b/i],
    forbidden: /\b(approval route preview|audit activity|workflow history|reviewer-only|reviewer decision|dashboard analytics|data analytics|duplicated hero|duplicate hero|title hero|logic-only required document checklist)\b/i,
  },
  {
    match: /\bapproval\b.*\btask\b/i,
    actionAlternatives: [[/approve/i, /reject/i], [/complete/i]],
    forbidden: /\b(save as draft|submit only|data list new|data list edit|generic dashboard|dashboard analytics)\b/i,
  },
  {
    match: /\bapproval\b.*\bprint\b/i,
    requiredEvidence: /\bread[- ]only\b|\bprint[- ]oriented\b/i,
    forbidden: /\b(editable|input|save\b|submit\b|approve\b|reject\b|filter|analytics|dashboard control)\b/i,
  },
  {
    match: /\bdata\s+list\b.*\b(new|edit|add\/edit)\b|\bnew\/edit\b/i,
    requiredActions: [/\bsave\b/i, /\bcancel\b|submit/i],
    forbidden: /\b(collection|data filters?|data analytics|kanban|timeline|audit activity|approval route preview|unrelated document|unrelated task|approval-only status card)\b/i,
  },
  {
    match: /\bdata\s+list\b.*\b(view|detail)\b|\bview\s+form\b|\bdetail\s+form\b/i,
    forbidden: /\b(unrelated task|unrelated document|unrelated approval|generic dashboard analytics|editable new\/edit-only inputs)\b/i,
  },
  {
    match: /\bdocument\b.*\b(new|edit|add\/edit)\b/i,
    requiredFields: [/file|upload/i, /document.*(name|title)|title|name/i, /type/i, /status/i],
    requiredActions: [/\bsave\b|\bupload\b/i, /\bcancel\b/i],
    forbidden: /\b(approval route preview|dashboard analytics|reviewer decision|kanban)\b/i,
  },
  {
    match: /\bdocument\b.*\b(view|detail)\b/i,
    requiredFields: [/file|document/i, /type|status|uploaded|metadata/i],
    requiredActions: [/open|download|preview/i],
    forbidden: /\b(editable approval|dashboard analytics|new\/edit-only input)\b/i,
  },
  {
    match: /\bdashboard\b/i,
    requiredEvidence: /\b(kpi|summary|analytics|filter|collection|data table|kanban|timeline|action|dashboard)\b/i,
  },
];

const PROOF_BOUNDARY =
  "UI Surface Contract validation proves design-contract readiness only; it does not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.";

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.contracts) {
    console.error("Usage: node scripts/validate-ui-surface-contracts.mjs --contracts <dir-or-json> [--app-plan <app-plan.md>] [--design-system <design-system.md|json>]");
    process.exit(2);
  }

  const contracts = loadContracts(args.contracts);
  const findings = [];
  const appPlanText = args["app-plan"] ? fs.readFileSync(args["app-plan"], "utf8") : "";
  const designSystemText = args["design-system"] ? fs.readFileSync(args["design-system"], "utf8") : "";

  if (!contracts.length) {
    add(findings, "error", "UI_SURFACE_CONTRACTS_EMPTY", "No UI Surface Contracts were found.", { contracts: safePath(args.contracts) });
  }

  for (const [index, contract] of contracts.entries()) {
    validateContract(contract, index, findings, { appPlanText, designSystemText });
  }
  validateAppPlanSurfaceCoverage(contracts, appPlanText, findings);

  const failedIds = new Set(findings.filter((finding) => finding.level === "error").map((finding) => finding.surfaceId).filter(Boolean));
  const surfaceIds = contracts.map((contract) => text(contract.surfaceId || contract.surfaceName)).filter(Boolean);
  const result = {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    surfaceCount: contracts.length,
    passedSurfaces: surfaceIds.filter((surfaceId) => !failedIds.has(surfaceId)),
    failedSurfaces: [...failedIds],
    findings,
    proofBoundary: PROOF_BOUNDARY,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "pass" ? 0 : 1);
}

export function validateContract(contract, index, findings, context = {}) {
  const surfaceId = text(contract.surfaceId || contract.surfaceName || `surface-${index + 1}`);
  const surfaceType = text(contract.surfaceType);
  const combined = searchable(contract);
  const visibleCombined = searchable([
    contract.surfaceResponsibility,
    contract.businessPurpose,
    contract.allowedRegions,
    contract.relatedRegions,
    contract.subListRequirements,
    contract.controlMapping,
    contract.fieldGroups,
    contract.requiredActions,
    contract.optionalActions,
    contract.htmlPreviewRequirements,
    contract.blueprintRequirements,
    contract.explicitlyPlannedRegions,
  ]);

  for (const field of REQUIRED_FIELDS) {
    if (field === "forbiddenRegions" && Array.isArray(contract[field])) continue;
    if (isEmpty(contract[field])) {
      add(findings, "error", "UI_SURFACE_CONTRACT_REQUIRED_FIELD_MISSING", `UI Surface Contract is missing required field ${field}.`, {
        surfaceId,
        surfaceType,
        field,
      });
    }
  }

  if (!text(contract.appPlanResourceRef) || !text(contract.sourceResourceName)) {
    add(findings, "error", "UI_SURFACE_CONTRACT_APP_PLAN_TRACEABILITY_MISSING", "UI Surface Contract must map to an App Plan resource and source resource.", {
      surfaceId,
      surfaceType,
    });
  } else if (context.appPlanText && !context.appPlanText.toLowerCase().includes(text(contract.sourceResourceName).toLowerCase())) {
    add(findings, "error", "UI_SURFACE_CONTRACT_APP_PLAN_RESOURCE_NOT_FOUND", "UI Surface Contract source resource was not found in the provided App Plan.", {
      surfaceId,
      sourceResourceName: text(contract.sourceResourceName),
    });
  }

  if (!text(contract.designSystemRef)) {
    add(findings, "error", "UI_SURFACE_CONTRACT_DESIGN_SYSTEM_REF_MISSING", "UI Surface Contract must reference the Application Design System.", { surfaceId });
  } else if (context.designSystemText && !mentionsDesignSystem(context.designSystemText, contract.designSystemRef)) {
    add(findings, "warning", "UI_SURFACE_CONTRACT_DESIGN_SYSTEM_REF_UNVERIFIED", "The provided design system did not clearly include the referenced designSystemRef.", {
      surfaceId,
      designSystemRef: text(contract.designSystemRef),
    });
  }

  if (!text(contract.uiPatternTemplateRef)) {
    add(findings, "error", "UI_SURFACE_CONTRACT_PATTERN_TEMPLATE_REF_MISSING", "UI Surface Contract must reference an approved UI pattern template.", { surfaceId });
  }

  if (isEmpty(contract.visualQualityRequirements)) {
    add(findings, "error", "UI_SURFACE_CONTRACT_VISUAL_QUALITY_MISSING", "UI Surface Contract must declare high-fidelity visual quality requirements.", { surfaceId });
  }

  validateLayoutAndChromeContract(contract, findings, surfaceId, surfaceType);
  validateInheritedReadiness(contract, findings, surfaceId, surfaceType);

  const requiredFields = asTextArray(contract.requiredFields);
  const shownFields = new Set([...asTextArray(contract.editableFields), ...asTextArray(contract.readOnlyFields), ...asTextArray(contract.optionalFields), ...fieldsFromGroups(contract.fieldGroups)].map(normalize));
  const missingFields = requiredFields.filter((field) => !shownFields.has(normalize(field)) && !hasDeferral(contract, field));
  for (const field of missingFields) {
    add(findings, "error", "UI_SURFACE_CONTRACT_REQUIRED_FIELD_UNCOVERED", "Required field is not covered by editable/read-only/field group declarations.", {
      surfaceId,
      field,
    });
  }

  const requiredActions = asTextArray(contract.requiredActions);
  const declaredActions = new Set([...asTextArray(contract.requiredActions), ...asTextArray(contract.optionalActions), ...actionsFromMapping(contract.controlMapping)].map(normalize));
  for (const action of requiredActions) {
    if (!declaredActions.has(normalize(action)) && !hasDeferral(contract, action)) {
      add(findings, "error", "UI_SURFACE_CONTRACT_REQUIRED_ACTION_UNCOVERED", "Required action is not covered in action/control declarations.", {
        surfaceId,
        action,
      });
    }
  }

  for (const rule of SURFACE_RESPONSIBILITY_RULES) {
    if (!rule.match.test(surfaceType)) continue;
    if (rule.requiredActions) {
      const actionText = asTextArray(contract.requiredActions).join(" ");
      for (const required of rule.requiredActions) {
        if (!required.test(actionText) && !hasDeferral(contract, String(required))) {
          add(findings, "error", "UI_SURFACE_CONTRACT_SURFACE_ACTION_MISSING", "Surface type is missing a required action.", {
            surfaceId,
            surfaceType,
            required: required.source,
          });
        }
      }
    }
    if (rule.actionAlternatives) {
      const actionText = asTextArray(contract.requiredActions).join(" ");
      const matched = rule.actionAlternatives.some((alternative) => alternative.every((pattern) => pattern.test(actionText)));
      if (!matched) {
        add(findings, "error", "UI_SURFACE_CONTRACT_SURFACE_ACTION_MISSING", "Surface type is missing the required decision/completion action set.", {
          surfaceId,
          surfaceType,
        });
      }
    }
    if (rule.requiredFields) {
      for (const required of rule.requiredFields) {
        if (!required.test(requiredFields.join(" ")) && !hasDeferral(contract, String(required))) {
          add(findings, "error", "UI_SURFACE_CONTRACT_SURFACE_FIELD_MISSING", "Surface type is missing required field coverage.", {
            surfaceId,
            surfaceType,
            required: required.source,
          });
        }
      }
    }
    if (rule.requiredEvidence && !rule.requiredEvidence.test(combined)) {
      add(findings, "error", "UI_SURFACE_CONTRACT_SURFACE_RESPONSIBILITY_EVIDENCE_MISSING", "Surface responsibility evidence is missing for this surface type.", {
        surfaceId,
        surfaceType,
      });
    }
    if (rule.forbidden && rule.forbidden.test(visibleCombined) && !hasExplicitPlanning(contract, rule.forbidden)) {
      add(findings, "error", "UI_SURFACE_CONTRACT_FORBIDDEN_REGION_DECLARED", "UI Surface Contract includes a forbidden region/control for this surface type without explicit planning.", {
        surfaceId,
        surfaceType,
      });
    }
  }

  if (/related documents/i.test(combined) && /approval.*submission/i.test(surfaceType) && !/sub\s*list/i.test(combined)) {
    add(findings, "error", "UI_SURFACE_CONTRACT_SUB_LIST_REQUIRED", "Approval Submission related document rows must be represented as a planned Sub List, not a generic lower-page region.", {
      surfaceId,
    });
  }
}

function validateAppPlanSurfaceCoverage(contracts, appPlanText, findings) {
  if (!appPlanText) return;
  const surfaceTypes = contracts.map((contract) => text(contract.surfaceType));
  for (const hint of REQUIRED_SURFACE_HINTS) {
    if (!hint.pattern.test(appPlanText)) continue;
    if (!surfaceTypes.some((surfaceType) => hint.type.test(surfaceType))) {
      add(findings, "error", "UI_SURFACE_CONTRACT_REQUIRED_SURFACE_MISSING", "UI Surface Contracts must cover every UI surface required by the approved App Plan.", {
        requiredSurfaceType: hint.label,
      });
    }
  }
  if (/form report/i.test(appPlanText) && !/visible page|required ui surface|canonical design surface/i.test(appPlanText)) {
    const formReportSurfaces = surfaceTypes.filter((surfaceType) => /form report/i.test(surfaceType));
    if (formReportSurfaces.length) {
      add(findings, "error", "UI_SURFACE_CONTRACT_FORM_REPORT_SURFACE_NOT_REQUIRED", "Form Reports are standalone Yeeflow resources and are not required as UI design surfaces unless explicitly planned as visible pages.", {
        surfaces: formReportSurfaces,
      });
    }
  }
}

function validateLayoutAndChromeContract(contract, findings, surfaceId, surfaceType) {
  const layoutType = text(contract.applicationLayoutType);
  if (/dashboard/i.test(surfaceType)) {
    if (!layoutType) {
      add(findings, "error", "UI_SURFACE_CONTRACT_APPLICATION_LAYOUT_TYPE_MISSING", "Dashboard UI Surface Contracts must declare the official Yeeflow applicationLayoutType.", { surfaceId });
    } else if (!OFFICIAL_APPLICATION_LAYOUT_TYPES.has(layoutType)) {
      add(findings, "error", "UI_SURFACE_CONTRACT_APPLICATION_LAYOUT_TYPE_UNSUPPORTED", "Dashboard UI Surface Contracts must use one of the official Yeeflow application layout IDs.", {
        surfaceId,
        applicationLayoutType: layoutType,
      });
    }
    if (contract.includeHeaderNavigation !== true && !/true|yes|required/i.test(text(contract.includeHeaderNavigation))) {
      add(findings, "error", "UI_SURFACE_CONTRACT_DASHBOARD_HEADER_NAV_REQUIRED", "Dashboard UI Surface Contracts must require official header/navigation chrome.", { surfaceId });
    }
  } else if (/\b(approval|data\s+list|document)\b/i.test(surfaceType)) {
    if (contract.includeHeaderNavigation === true || /true|yes|required/i.test(text(contract.includeHeaderNavigation))) {
      add(findings, "error", "UI_SURFACE_CONTRACT_FORM_APP_CHROME_FORBIDDEN", "Approval, Data List, and Document form surfaces must be complete form surfaces without application chrome.", { surfaceId, surfaceType });
    }
    const marker = text(contract.applicationLayoutType || contract.surfaceLayoutMarker);
    if (marker && !/form-surface-no-app-chrome|no-app-chrome|form surface/i.test(marker)) {
      add(findings, "error", "UI_SURFACE_CONTRACT_FORM_LAYOUT_MARKER_INVALID", "Form surfaces should declare a no-app-chrome surface marker, not dashboard application chrome.", {
        surfaceId,
        applicationLayoutType: marker,
      });
    }
  }
}

function validateInheritedReadiness(contract, findings, surfaceId, surfaceType) {
  const ready = contract.readyForBlueprint === true || /readyForBlueprint\s*[:=]\s*true|ready for blueprint:\s*yes/i.test(searchable(contract));
  if (!ready) return;

  for (const field of INHERITED_READY_STATUS_FIELDS) {
    const value = text(contract[field]);
    if (!value) {
      add(findings, "error", "UI_SURFACE_CONTRACT_INHERITED_GATE_STATUS_MISSING", "Blueprint-ready UI Surface Contracts must declare every inherited Full-page Design Artifact gate status.", {
        surfaceId,
        surfaceType,
        field,
      });
      continue;
    }
    if (!isPassingStatus(value, field) && !hasDeferral(contract, field)) {
      add(findings, "error", "UI_SURFACE_CONTRACT_INHERITED_GATE_NOT_PASSING", "readyForBlueprint is blocked unless every inherited Full-page Design Artifact gate passes or is explicitly deferred with reason/fallback/proof impact.", {
        surfaceId,
        surfaceType,
        field,
        status: value,
      });
    }
  }
}

function loadContracts(inputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(inputPath)
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => contractsFromJson(JSON.parse(fs.readFileSync(path.join(inputPath, name), "utf8"))));
  }
  return contractsFromJson(JSON.parse(fs.readFileSync(inputPath, "utf8")));
}

function contractsFromJson(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.contracts)) return value.contracts;
  if (Array.isArray(value.surfaces)) return value.surfaces;
  if (Array.isArray(value.uiSurfaceContracts)) return value.uiSurfaceContracts;
  return [value];
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) args[arg.slice(2)] = argv[index + 1];
  }
  return args;
}

function add(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, ...detail });
}

function text(value) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function isEmpty(value) {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return String(value).trim() === "";
}

function asTextArray(value) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value === "string") return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).flatMap(asTextArray);
  return [];
}

function fieldsFromGroups(groups) {
  return asTextArray(groups);
}

function actionsFromMapping(mapping) {
  if (!mapping) return [];
  if (Array.isArray(mapping)) return mapping.flatMap((entry) => asTextArray(entry.actions || entry.action || entry.actionName));
  if (typeof mapping === "object") return Object.values(mapping).flatMap(actionsFromMapping);
  return [];
}

function searchable(value) {
  return text(value).toLowerCase();
}

function normalize(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function isPassingStatus(value, field = "") {
  const normalized = normalize(value);
  if (/templateReuseRisk/i.test(field)) return /^pass$|^warning$|pass-with-reviewed-risk/.test(normalized);
  return /^pass$|^passed$|^validated$|pass-with-reviewed-risk/.test(normalized);
}

function hasDeferral(contract, needle = "") {
  const combined = searchable([contract.deferredItems, contract.deferrals, contract.fallback, contract.proofImpact, contract.deferredReason, contract.unsupportedItems]);
  return /deferred|runtime-proof-required|export-learning-required/.test(combined) && (!needle || combined.includes(normalize(needle).slice(0, 20)));
}

function hasExplicitPlanning(contract, pattern) {
  const explicit = searchable([contract.explicitlyPlannedRegions, contract.allowedRegions, contract.appPlanTraceabilityNotes, contract.proofImpact]);
  return pattern.test(explicit) && /\b(explicitly planned|app plan|allowed|mapped|visible ui)\b/i.test(explicit);
}

function mentionsDesignSystem(designSystemText, ref) {
  const normalized = normalize(ref).split("/").pop();
  return normalize(designSystemText).includes(normalized) || /application design system/i.test(designSystemText);
}

function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

main();
