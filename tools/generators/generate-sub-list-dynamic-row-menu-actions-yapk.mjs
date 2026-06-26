import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./scripts/yeeflow-env-utils.mjs";

const BROTLI_PREFIX = "::brotli::";
const SOURCE_YAPK = process.env.YEEFLOW_SOURCE_YAPK || "/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.4-row-menu-actions.yapk";
const OUT_YAPK = "/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.5-row-menu-actions-resource-fixed.yapk";
const OUT_DIR = ".tmp/sub-list-dynamic-row-menu-actions-yapk";
const OUT_REPORT = `${OUT_DIR}/generation-report.json`;

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function assertEnvReadable(filePath) {
  const flags = execFileSync("ls", ["-lO", filePath], { encoding: "utf8" });
  if (/\bdataless\b/.test(flags)) throw new Error(`${filePath} is marked dataless and cannot be read for signing.`);
}

function postJsonWithCurl(url, apiKey, body) {
  const stdout = execFileSync("curl", [
    "--silent", "--show-error", "--max-time", "20",
    "--request", "POST",
    "--header", `apiKey: ${apiKey}`,
    "--header", "Accept: application/json",
    "--header", "Content-Type: application/json",
    "--data-binary", "@-",
    "--write-out", "\n%{http_code}",
    url,
  ], { input: JSON.stringify(body), maxBuffer: 1024 * 1024 }).toString("utf8");
  const splitAt = stdout.lastIndexOf("\n");
  return { body: splitAt >= 0 ? stdout.slice(0, splitAt) : "", status: Number(splitAt >= 0 ? stdout.slice(splitAt + 1) : "0") };
}

async function signYapkWrapper(wrapper) {
  loadDotenvFile(fs, ".env.local", { assertReadable: assertEnvReadable });
  const env = resolveYeeflowEnvironment(process.env);
  const apiKey = env.apiKey;
  if (!apiKey) throw new Error("YEEFLOW_API_KEY is required for YAPK signing.");
  const unsigned = { ...wrapper };
  delete unsigned.Sign;
  let sign = null;
  let selectedBase = null;
  let lastStatus = null;
  const baseVariant = env.usedLegacyBaseUrl ? "legacy-api-base-alias" : "api-base";
  try {
    const result = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/setsign`, apiKey, unsigned);
    lastStatus = result.status;
    if (result.status >= 200 && result.status <= 299) {
      const json = JSON.parse(result.body);
      sign = json?.Data ?? json?.data ?? json?.Sign ?? json?.sign ?? (typeof json === "string" ? json : null);
      if (typeof sign !== "string" || Buffer.from(sign, "base64").length !== 32) throw new Error("setsign did not return a 32-byte signature.");
      selectedBase = { url: env.apiBaseUrl, variant: baseVariant };
    }
  } catch {
    sign = null;
  }
  if (!sign || !selectedBase) throw new Error(`setsign failed for configured API base; last HTTP status ${lastStatus ?? "none"}.`);
  const signed = { ...wrapper, Sign: sign };
  const verify = postJsonWithCurl(`${selectedBase.url}/utils/apppackage/verifysign`, apiKey, signed);
  if (verify.status < 200 || verify.status > 299) throw new Error(`verifysign failed with HTTP ${verify.status}.`);
  return { signed, signBytes: Buffer.from(sign, "base64").length, verifyStatus: verify.status, baseVariant: selectedBase.variant };
}

function decodeEmbeddedBrotliText(encoded) {
  const raw = Buffer.from(encoded, "base64");
  const prefix = Buffer.from(BROTLI_PREFIX, "utf8");
  if (!raw.subarray(0, prefix.length).equals(prefix)) throw new Error("DefResource does not use embedded Brotli prefix.");
  return zlib.brotliDecompressSync(raw.subarray(prefix.length)).toString("utf8");
}

function encodeEmbeddedBrotliText(text) {
  return Buffer.concat([Buffer.from(BROTLI_PREFIX, "utf8"), zlib.brotliCompressSync(Buffer.from(text, "utf8"))]).toString("base64");
}

function pythonTransform(script, input, args = []) {
  return execFileSync("python3", ["-c", script, ...args], { input, maxBuffer: 30 * 1024 * 1024 });
}

function mutatePurchaseFormDef(formDefText) {
  const script = String.raw`
import copy, json, sys, uuid

doc = json.load(sys.stdin)

def new_id():
    return str(uuid.uuid4())

def walk(node):
    if isinstance(node, dict):
        yield node
        for child in node.get("children") or []:
            yield from walk(child)

def first(root, pred):
    for node in walk(root):
        if pred(node):
            return node
    return None

def make_action(name, step_type, attrs=None):
    step = {"type": step_type}
    if attrs is not None:
        step["attrs"] = attrs
    return {"id": new_id(), "name": name, "type": "list", "steps": [step]}

def find_action(actions, name):
    for action in actions:
        if action.get("name") == name:
            return action
    return None

def ensure_action(actions, name, step_type, attrs=None):
    action = find_action(actions, name)
    expected_step = {"type": step_type}
    if attrs is not None:
        expected_step["attrs"] = attrs
    if action is None:
        action = make_action(name, step_type, attrs)
        actions.append(action)
    else:
        action["type"] = "list"
        action["steps"] = [expected_step]
    return action

def clone_button(template, label, action_id, icon):
    button = copy.deepcopy(template)
    button["id"] = new_id()
    button["label"] = label
    attrs = button.setdefault("attrs", {})
    attrs["control_action"] = action_id
    attrs["icon-type"] = "3"
    attrs["icon"] = icon
    return button

def mutate_sub_list(sub_list):
    actions = sub_list.setdefault("attrs", {}).setdefault("actions", [])
    duplicate = ensure_action(actions, "Duplicate item", "list_dup")
    ensure_action(actions, "Delete item", "list_del", {"confirm": {"require": True, "message": [{"type": "str", "value": "Are you sure that you want to delete this item?"}]}})
    insert_before = ensure_action(actions, "Insert before current item", "list_new", {"position": "0"})
    insert_after = ensure_action(actions, "Insert after current item", "list_new", {"position": "1"})
    move_up = ensure_action(actions, "Move up", "list_move")
    move_down = ensure_action(actions, "Move down", "list_move", {"moveMode": "2"})

    dropbar = first(sub_list, lambda node: node.get("type") == "dropbar")
    if not dropbar:
        return False
    menu_container = first(dropbar, lambda node: node.get("type") == "container" and any(isinstance(child, dict) and child.get("type") == "action_button" for child in (node.get("children") or [])))
    if not menu_container:
        return False
    existing_buttons = [child for child in (menu_container.get("children") or []) if isinstance(child, dict) and child.get("type") == "action_button"]
    existing_lines = [child for child in (menu_container.get("children") or []) if isinstance(child, dict) and child.get("type") == "line"]
    template = existing_buttons[0] if existing_buttons else {"type": "action_button", "attrs": {"align": [None, "justify"], "button": {"ty": [None, "base-regular"], "normal": {"border": {"type": "0"}}, "hover": {"bg": "var(--c--neutral-light)"}}, "label": {"variable": None}, "icon-type": "3"}}
    divider = copy.deepcopy(existing_lines[0]) if existing_lines else {"id": new_id(), "type": "line", "label": "Divider", "attrs": {"sketchpicker": "var(--c--neutral-light-active)", "space": [None, "--sp--s075"]}, "parentCol": 1}
    divider["id"] = new_id()

    menu_container["children"] = [
        clone_button(template, "Duplicate", duplicate["id"], "fa-regular fa-copy"),
        divider,
        clone_button(template, "Insert before", insert_before["id"], "fa-regular fa-arrow-up-to-bracket"),
        clone_button(template, "Insert after", insert_after["id"], "fa-regular fa-arrow-down-from-bracket"),
        clone_button(template, "Move up", move_up["id"], "fa-regular fa-arrow-up"),
        clone_button(template, "Move down", move_down["id"], "fa-regular fa-arrow-down"),
    ]
    return True

changed = False
for page in doc.get("pageurls") or []:
    formdef = page.get("formdef")
    if not isinstance(formdef, dict):
        continue
    for node in walk(formdef):
        if node.get("type") == "list" and node.get("binding") == "PurchaseItems":
            node["displayLabel"] = [None, False]
            changed = mutate_sub_list(node) or changed

if not changed:
    raise SystemExit("PurchaseItems Sub List row menu was not found or not updated.")

print(json.dumps(doc, separators=(",", ":")), end="")
`;
  return pythonTransform(script, formDefText).toString("utf8");
}

function replacePurchaseFormResource(appPackageText, purchaseDefResource, resourceIdBase) {
  const script = String.raw`
import json, sys
app = json.load(sys.stdin)
resource = sys.argv[1]
resource_id_base = int(sys.argv[2])
updated = False
for form in app.get("Forms") or []:
    if form.get("Name") == "Purchase Request Form" or form.get("Key") == "PRF":
        form["DefResource"] = resource
        # Bump definition resource IDs so Yeeflow materializes the updated
        # request page instead of reusing a previously deployed cached form.
        form["DefResourceID"] = resource_id_base + 1
        form["DeployedDefID"] = resource_id_base + 2
        form["Status"] = 1
        form["Deployed"] = True
        updated = True
if not updated:
    raise SystemExit("Purchase Request Form was not found in AppPackageInfo.")
print(json.dumps(app, separators=(",", ":")), end="")
`;
  return pythonTransform(script, appPackageText, [purchaseDefResource, String(resourceIdBase)]).toString("utf8");
}

function extractPurchaseFormResource(appPackageText) {
  const script = String.raw`
import json, sys
app = json.load(sys.stdin)
for form in app.get("Forms") or []:
    if form.get("Name") == "Purchase Request Form" or form.get("Key") == "PRF":
        print(form["DefResource"], end="")
        raise SystemExit(0)
raise SystemExit("Purchase Request Form was not found in AppPackageInfo.")
`;
  return pythonTransform(script, appPackageText).toString("utf8");
}

function utcNowNoMillis() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const baseline = readJsonFile(SOURCE_YAPK);
  const appPackageText = zlib.brotliDecompressSync(Buffer.from(baseline.Resource, "base64")).toString("utf8");
  const purchaseResource = extractPurchaseFormResource(appPackageText);
  const purchaseFormDef = decodeEmbeddedBrotliText(purchaseResource);
  const mutatedFormDef = mutatePurchaseFormDef(purchaseFormDef);
  const mutatedResource = encodeEmbeddedBrotliText(mutatedFormDef);
  const resourceIdBase = Date.now() * 1000;
  const mutatedAppPackage = replacePurchaseFormResource(appPackageText, mutatedResource, resourceIdBase);

  const wrapper = {
    ...baseline,
    PackageId: crypto.randomUUID(),
    Resource: zlib.brotliCompressSync(Buffer.from(mutatedAppPackage, "utf8")).toString("base64"),
    Version: "V1.5",
    Date: utcNowNoMillis(),
    Notes: "Bumps Purchase Request form definition resource IDs and applies Dynamic Sub List row menu actions: Duplicate, Insert before, Insert after, Move up, and Move down.",
  };
  delete wrapper.Sign;
  const signed = await signYapkWrapper(wrapper);
  fs.writeFileSync(OUT_YAPK, `${JSON.stringify(signed.signed)}\n`);
  const report = {
    status: "pass",
    sourceYapk: SOURCE_YAPK,
    outputYapk: OUT_YAPK,
    version: "V1.5",
    signBytes: signed.signBytes,
    verifyStatus: signed.verifyStatus,
    baseVariant: signed.baseVariant,
    definitionResourceIdsUpdated: true,
    rowMenuActions: ["Duplicate", "Insert before", "Insert after", "Move up", "Move down"],
    proofBoundary: "Generated/signed/verified only; manual runtime test pending.",
  };
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: "pass", package: OUT_YAPK, version: "V1.5", signBytes: signed.signBytes, verifyStatus: signed.verifyStatus }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
