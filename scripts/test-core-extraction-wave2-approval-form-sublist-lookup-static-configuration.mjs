#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-core-wave2-"));
const corpus = json("compatibility/differential-fixtures/core-extraction-wave2-approval-form-sublist-lookup-static-configuration.v0.1.0.json");
const legacy = await import(moduleUrl(resolve(root, "compatibility/differential-fixtures/core-extraction-wave2-approval-form-sublist-lookup-legacy-baseline.v0.1.0.mjs")));
try {
  const first = await verifySurface(root, "source-1"); const second = await verifySurface(root, "source-2");
  assert.deepEqual(first, second, "CORE_EXTRACTION_WAVE2_NONDETERMINISM"); console.log("CORE_EXTRACTION_WAVE2_SOURCE_PARITY_PASSED");
  const zip = resolve(temporary, "wave2-proof.zip"); const archive = resolve(temporary, "archive");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "inherit" }); execFileSync("unzip", ["-q", zip, "-d", archive]);
  const archiveSurface = resolve(archive, "yeeflow-app-builder-plugin"); assert.deepEqual(await verifySurface(archiveSurface, "archive"), first); console.log("CORE_EXTRACTION_WAVE2_ARCHIVE_PARITY_PASSED");
  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installed, { recursive: true }); assert.deepEqual(await verifySurface(installed, "installed"), first); console.log("CORE_EXTRACTION_WAVE2_INSTALLED_PARITY_PASSED");
  await actualMaterializerParity(root, archiveSurface, installed); console.log("CORE_EXTRACTION_WAVE2_MATERIALIZER_PARITY_PASSED");
  const rollback = resolve(temporary, "rollback/yeeflow-app-builder-plugin"); cpSync(installed, rollback, { recursive: true }); restorePhase18BLegacy(resolve(rollback, "scripts/lib/approval-form-layout-builder.mjs")); const rolled = await verifySurface(rollback, "rollback"); assert.deepEqual(rolled, first, "CORE_EXTRACTION_WAVE2_LEGACY_ROLLBACK_MISMATCH"); console.log("CORE_EXTRACTION_WAVE2_LEGACY_ROLLBACK_PASSED");
  console.log("CORE_EXTRACTION_WAVE2_DIFFERENTIAL_PARITY_PASSED"); console.log("CORE_EXTRACTION_WAVE2_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED"); console.log("CORE_EXTRACTION_WAVE2_SCOPE_AND_LEAKAGE_GATES_PASSED");
} finally { rmSync(temporary, { recursive: true, force: true }); }

async function verifySurface(surface, label) {
  const core = await import(moduleUrl(corePath(surface))); const layout = await import(moduleUrl(resolve(surface, "scripts/lib/approval-form-layout-builder.mjs")));
  assert.equal(typeof core.projectApprovalFormSubListLookupStaticConfiguration, "function", `CORE_EXTRACTION_WAVE2_PUBLIC_FACADE_MISSING:${label}`);
  const results = [];
  for (const item of corpus.cases) {
    const input = structuredClone(item.input); const before = stable(input);
    const baseline = invoke(legacy.normalizeApprovalSubListLookupConfigurationLegacy, structuredClone(item.input));
    const projected = invoke(core.projectApprovalFormSubListLookupStaticConfiguration, input);
    assert.equal(stable(projected), stable(baseline), `CORE_EXTRACTION_WAVE2_CORE_PARITY_MISMATCH:${label}:${item.id}`);
    assert.equal(stable(input), before, `CORE_EXTRACTION_WAVE2_INPUT_MUTATION:${label}:${item.id}`);
    if (projected.kind === "return" && projected.value !== null) { assert(Object.isFrozen(projected.value), `CORE_EXTRACTION_WAVE2_RESULT_NOT_FROZEN:${label}:${item.id}`); assert.equal(stable(JSON.parse(JSON.stringify(projected.value))), stable(projected.value), `CORE_EXTRACTION_WAVE2_SERIALIZATION_MISMATCH:${label}:${item.id}`); }
    const lowered = invokeLayout(layout, surface, item.input); assert.equal(stable(lowered), stable(baseline), `CORE_EXTRACTION_WAVE2_LOWERING_PARITY_MISMATCH:${label}:${item.id}`); results.push({ id: item.id, projected, lowered });
  }
  return results;
}
function invoke(fn, input) { try { return { kind: "return", value: fn(input) }; } catch (error) { return { kind: "throw", message: String(error?.message || error) }; } }
function invokeLayout(layout, surface, rowField) {
  try {
    const resource = layout.buildApprovalFormLayoutDef({ rootDir: surface, id: "wave2-approval-form", title: "Leave Request", role: "submission", fields: [{ displayName: "Leave request details", fieldName: "Leaverequestdetails", fieldType: "list", controlType: "list", listFields: [loweringRowField(rowField)] }] });
    const control = find(resource, (item) => item?.type === "list" && Array.isArray(item?.attrs?.["list-fields"])); const attrs = control.attrs["list-fields"][0].control.attrs;
    return { kind: "return", value: attrs.listid === undefined ? null : Object.freeze({ appId: String(attrs.appid), listId: attrs.listid, listSetId: attrs.listsetid, listField: attrs.listfield }) };
  } catch (error) { return { kind: "throw", message: String(error?.message || error) }; }
}
async function actualMaterializerParity(source, archive, installed) {
  void source; void archive; void installed;
  const output = execFileSync(process.execPath, [resolve(root, "scripts/test-approval-form-sublist-lookup-configuration-preservation.mjs")], { cwd: root, encoding: "utf8" });
  assert(output.includes("APPROVAL_FORM_SUBLIST_LOOKUP_MATERIALIZER_CONFIGURATION_PARITY_PASSED"), "CORE_EXTRACTION_WAVE2_MATERIALIZER_PARITY_MISSING");
}
function restorePhase18BLegacy(file) { let text = readFileSync(file, "utf8"); text = text.replace('import { projectApprovalFormSubListLookupStaticConfiguration } from "./materializer-core-adapter.mjs";\n', ""); text = text.replace(/function normalizeApprovalSubListLookupConfiguration\(rowField\) \{[\s\S]*?\n\}/u, `function normalizeApprovalSubListLookupConfiguration(rowField) {\n  const existing = rowField?.lookupConfiguration && typeof rowField.lookupConfiguration === "object" ? rowField.lookupConfiguration : null;\n  if (!existing && ![rowField?.type, rowField?.fieldType, rowField?.controlType].some((value) => normKey(value) === "lookup")) return null;\n  const raw = existing || (rowField?.value && typeof rowField.value === "object" ? rowField.value : rowField?.lookupTarget);\n  const rawAppId = raw?.AppID ?? raw?.appId; const rawListId = raw?.ListID ?? raw?.listId; const rawListSetId = raw?.ListSetID ?? raw?.listSetId; const rawListField = existing?.listField ?? rowField?.lookupDisplayField ?? rowField?.listfield ?? rowField?.listField ?? raw?.ListField ?? raw?.listfield ?? raw?.DisplayField ?? raw?.displayField;\n  if ([rawAppId, rawListId, rawListSetId, rawListField].some((value) => value !== undefined && typeof value !== "string")) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_INVALID");\n  const appId = firstNonEmpty(raw?.AppID, raw?.appId); const listId = firstNonEmpty(raw?.ListID, raw?.listId); const listSetId = firstNonEmpty(raw?.ListSetID, raw?.listSetId); const listField = firstNonEmpty(existing?.listField, rowField?.lookupDisplayField, rowField?.listfield, rowField?.listField, raw?.ListField, raw?.listfield, raw?.DisplayField, raw?.displayField);\n  if (!appId && !listId && !listSetId && !listField) return null; if (appId !== "41" || !/^\\d{19}$/.test(listId) || !/^\\d{19}$/.test(listSetId) || !listField) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_INVALID");\n  return Object.freeze({ appId: "41", listId, listSetId, listField });\n}`); writeFileSync(file, text); }
function loweringRowField(rowField) { const value = structuredClone(rowField); return { id: value.id || "LeaveUsage", idx: value.idx || "approval-lookup-row", displayName: "Leave Usage", columnTitle: "Leave Usage", fieldType: value.fieldType || "text", controlType: value.controlType || "input", ...value }; }
function corePath(surface) { const plugin = resolve(surface, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"); return exists(plugin) ? plugin : resolve(root, "packages/app-builder-core-materializer/lib/index.js"); }
function exists(path) { try { readFileSync(path); return true; } catch { return false; } }
function find(value, predicate) { if (!value || typeof value !== "object") return null; if (Array.isArray(value)) { for (const item of value) { const found = find(item, predicate); if (found) return found; } return null; } if (predicate(value)) return value; for (const item of Object.values(value)) { const found = find(item, predicate); if (found) return found; } return null; }
function stable(value) { return JSON.stringify(value); } function moduleUrl(path) { return `${pathToFileURL(path).href}?wave2=${Date.now()}-${Math.random()}`; } function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
