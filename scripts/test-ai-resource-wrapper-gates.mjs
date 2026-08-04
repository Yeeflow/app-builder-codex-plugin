import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fixture = (...parts) => join(root, "fixtures", "standalone-resource-tools", ...parts);
const temp = mkdtempSync(join(tmpdir(), "yeeflow-ai-wrapper-gates-"));

function canonical(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function digest(value) { return createHash("sha256").update(value).digest("hex"); }

function provenance(kind, envelopePath, importReadPath) {
  const envelope = JSON.parse(readFileSync(envelopePath, "utf8"));
  const importRead = JSON.parse(readFileSync(importReadPath, "utf8"));
  const value = {
    source: "yeeflow-official-import-export-api",
    artifactType: kind === "agent" ? "yaia" : "yaic",
    packageJsonSha256: digest(envelope.PackageJson),
    envelopeSha256: digest(canonical(envelope)),
    importReadSha256: digest(canonical(importRead)),
    operation: "importRead",
    endpointKind: kind,
    responseId: `test-${kind}-response`
  };
  const output = join(temp, `${kind}.provenance.json`);
  writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
  return output;
}

for (const item of [
  { kind: "agent", ext: "yaia", envelope: fixture("agent.structural-envelope.json"), importRead: fixture("agent.import-read.json") },
  { kind: "copilot", ext: "yaic", envelope: fixture("copilot.structural-envelope.json"), importRead: fixture("copilot.import-read.json") },
]) {
  const output = join(temp, `valid.${item.ext}`);
  const prov = provenance(item.kind, item.envelope, item.importRead);
  const builder = join(root, `build-${item.ext}-wrapper.js`);
  const validator = join(root, `validate-${item.ext}.js`);
  const built = JSON.parse(execFileSync(process.execPath, [builder, item.envelope, output, "--provenance", prov, "--import-read", item.importRead], { encoding: "utf8" }));
  assert.match(built.status, /^pass/);
  const checked = JSON.parse(execFileSync(process.execPath, [validator, output, "--stage", "final", "--provenance", prov, "--import-read", item.importRead], { encoding: "utf8" }));
  assert.match(checked.status, /^pass/);
  const missingProof = spawnSync(process.execPath, [validator, output, "--stage", "final"], { encoding: "utf8" });
  assert.notEqual(missingProof.status, 0);
  assert.match(missingProof.stdout, /AI_RESOURCE_OFFICIAL_PROVENANCE_REQUIRED/);

  const downgrade = spawnSync(process.execPath, [builder, item.envelope, output, "--stage", "structural", "--provenance", prov, "--import-read", item.importRead], { encoding: "utf8" });
  assert.notEqual(downgrade.status, 0);
  assert.match(downgrade.stdout, /AI_RESOURCE_BUILD_STAGE_FIXED_FINAL/);
}

const invalidStage = spawnSync(process.execPath, [join(root, "validate-yaia.js"), fixture("agent.structural-envelope.json"), "--stage", "typo"], { encoding: "utf8" });
assert.notEqual(invalidStage.status, 0);
assert.match(invalidStage.stdout, /AI_RESOURCE_STAGE_INVALID/);

const extraEnvelope = { ...JSON.parse(readFileSync(fixture("agent.structural-envelope.json"), "utf8")), Extra: true };
const extraPath = join(temp, "extra-envelope.json");
writeFileSync(extraPath, canonical(extraEnvelope));
const extra = spawnSync(process.execPath, [join(root, "build-yaia-wrapper.js"), extraPath, join(temp, "extra.yaia"), "--provenance", provenance("agent", fixture("agent.structural-envelope.json"), fixture("agent.import-read.json")), "--import-read", fixture("agent.import-read.json")], { encoding: "utf8" });
assert.notEqual(extra.status, 0);
assert.match(extra.stdout, /AI_RESOURCE_INPUT_ENVELOPE_KEYS_INVALID/);

for (const item of [
  { kind: "agent", ext: "yaia" },
  { kind: "copilot", ext: "yaic" },
]) {
  const output = join(temp, `official.${item.ext}`);
  const receipt = join(temp, `official.${item.ext}.receipt.json`);
  const finalized = JSON.parse(execFileSync(process.execPath, [join(root, `finalize-${item.ext}-from-official-response.js`), fixture(`${item.kind}.official-response-evidence.json`), output, "--receipt", receipt], { encoding: "utf8" }));
  assert.match(finalized.status, /^pass/);
  assert.equal(finalized.mode, "official-response-evidence");
  const receiptValue = JSON.parse(readFileSync(receipt, "utf8"));
  assert.equal(receiptValue.artifactType, item.ext);
  assert.equal(receiptValue.responseId, `fixture-${item.kind}-response-1`);
}

const forgedEvidence = JSON.parse(readFileSync(fixture("agent.official-response-evidence.json"), "utf8"));
forgedEvidence.responseId = "";
const forgedPath = join(temp, "forged-evidence.json");
writeFileSync(forgedPath, canonical(forgedEvidence));
const forged = spawnSync(process.execPath, [join(root, "finalize-yaia-from-official-response.js"), forgedPath, join(temp, "forged.yaia"), "--receipt", join(temp, "forged.receipt.json")], { encoding: "utf8" });
assert.notEqual(forged.status, 0);
assert.match(forged.stdout, /AI_RESOURCE_EVIDENCE_RECEIPT_INCOMPLETE/);

console.log(JSON.stringify({ status: "pass", marker: "AI_RESOURCE_WRAPPER_GATES_PASSED", cases: 13 }, null, 2));
