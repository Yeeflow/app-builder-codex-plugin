import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./scripts/yeeflow-env-utils.mjs";

const BROTLI_PREFIX = "::brotli::";
const SOURCE_YAPK = process.env.YEEFLOW_SOURCE_YAPK || "/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.2-grid-fixed.yapk";
const OUT_YAPK = "/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.3-purchase-request.yapk";
const OUT_DIR = ".tmp/sub-list-dynamic-purchase-request-yapk";
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
  return execFileSync("python3", ["-c", script, ...args], { input, maxBuffer: 20 * 1024 * 1024 });
}

function makePurchaseFormDef(formDefText) {
  const script = String.raw`
import copy, json, re, sys, uuid

doc = json.load(sys.stdin)
old_title = "Dynamic Sub List Runtime Form"
new_title = "Purchase Request Form"
old_key = "SLDR"
new_key = "PRF"

def new_uuid():
    return str(uuid.uuid4())

def walk(node):
    if isinstance(node, dict):
        yield node
        for child in node.get("children") or []:
            yield from walk(child)

def replace_text(value):
    if isinstance(value, str):
        return value.replace(old_title, new_title).replace("Runtime Line Items", "Purchase Items").replace("Line Items", "Purchase Items").replace("LineItems", "PurchaseItems").replace(old_key, new_key).replace("sldr", "prf")
    return value

def deep_replace(obj):
    if isinstance(obj, dict):
        return {k: deep_replace(replace_text(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deep_replace(v) for v in obj]
    return replace_text(obj)

doc = deep_replace(doc)
doc["defkey"] = new_key
doc["ProcModelListID"] = "3001"

page_ids = [new_uuid(), new_uuid()]
for i, page in enumerate(doc.get("pageurls") or []):
    if i < len(page_ids):
        page["id"] = page_ids[i]
        page["name"] = new_title if i == 0 else f"{new_title} Review"
        page["title"] = page["name"]
        if isinstance(page.get("formdef"), dict):
            page["formdef"]["id"] = page["id"]
            page["formdef"]["title"] = page["name"]

for node in doc.get("childshapes") or []:
    stencil = (node.get("stencil") or {}).get("id")
    if stencil == "StartNoneEvent":
        node["id"] = node["resourceid"] = "prf-node-start"
        props = node.setdefault("properties", {})
        props["name"] = "Start"
        props["taskurl"] = props["taskUrl"] = props["TaskUrl"] = page_ids[0]
        node["outgoing"] = [{"id": "prf-flow-start-end", "resourceid": "prf-flow-start-end"}]
    elif stencil == "SequenceFlow":
        node["id"] = node["resourceid"] = "prf-flow-start-end"
        node["source"] = {"id": "prf-node-start", "resourceid": "prf-node-start"}
        node["target"] = {"id": "prf-node-end", "resourceid": "prf-node-end"}
        node["incoming"] = [{"resourceid": "prf-node-start"}]
        node["outgoing"] = [{"resourceid": "prf-node-end"}]
    elif stencil == "EndNoneEvent":
        node["id"] = node["resourceid"] = "prf-node-end"
        node["incoming"] = [{"id": "prf-flow-start-end", "resourceid": "prf-flow-start-end"}]

doc["variables"] = {
    "basic": [{"idx": "prf-var-purchase-items", "id": "PurchaseItems", "name": "Purchase Items", "type": "list", "editable": True, "value": "listref_purchase_items"}],
    "listref": [{"id": "listref_purchase_items", "name": "PurchaseItems", "idx": "prf-listref-purchase-items", "fields": [
        {"idx": new_uuid(), "id": "field_1", "name": "Item Description", "type": "text", "editable": True},
        {"idx": new_uuid(), "id": "field_2", "name": "Quantity", "type": "number", "editable": True},
        {"idx": new_uuid(), "id": "field_4", "name": "Notes", "type": "text", "editable": True},
    ]}],
    "filter": []
}

for page in doc.get("pageurls") or []:
    formdef = page.get("formdef")
    if not isinstance(formdef, dict):
        continue
    for ctrl in walk(formdef):
        ctrl["id"] = new_uuid()
        if ctrl.get("type") == "list":
            ctrl["label"] = "Purchase Items"
            ctrl["nv_label"] = "Purchase items dynamic sub list"
            ctrl["binding"] = "PurchaseItems"
            ctrl["displayLabel"] = [None, False]
            attrs = ctrl.setdefault("attrs", {})
            attrs["list-display-preference"] = "dynamic"
            for field in attrs.get("list-fields") or []:
                if field.get("id") == "field_1":
                    field["name"] = "Item Description"
                    if isinstance(field.get("control"), dict): field["control"]["label"] = "Item Description"
                if field.get("id") == "field_2": field["name"] = "Quantity"
                if field.get("id") == "field_4": field["name"] = "Notes"
            for field in attrs.get("list-variables") or []:
                if field.get("id") == "field_1": field["name"] = "Item Description"
                if field.get("id") == "field_2": field["name"] = "Quantity"
                if field.get("id") == "field_4": field["name"] = "Notes"
        if ctrl.get("attrs", {}).get("list_field") is True:
            ctrl["attrs"]["list_field_binding"] = "PurchaseItems"
            if ctrl.get("binding") == "field_1": ctrl["label"] = "Item Description"
            if ctrl.get("binding") == "field_2": ctrl["label"] = "Quantity"
            if ctrl.get("binding") == "field_4": ctrl["label"] = "Notes"
        if ctrl.get("type") in ("grid", "flex_grid", "list"):
            ctrl["displayLabel"] = [None, False]

print(json.dumps(doc, separators=(",", ":")), end="")
`;
  return pythonTransform(script, formDefText).toString("utf8");
}

function addPurchaseForm(appPackageText, purchaseDefResource) {
  const script = String.raw`
import copy, json, sys
app = json.load(sys.stdin)
source = app["Forms"][0]
ids = []
def collect(obj):
    if isinstance(obj, dict):
        for v in obj.values(): collect(v)
    elif isinstance(obj, list):
        for v in obj: collect(v)
    elif isinstance(obj, int):
        ids.append(obj)
collect(app)
base = max(ids) + 1000 if ids else 3000000000000000000
form = copy.deepcopy(source)
form["Name"] = "Purchase Request Form"
form["Key"] = "PRF"
form["Description"] = "Purchase request form for testing Dynamic Sub List purchase items."
form["ProcModelID"] = base + 1
form["DefResourceID"] = base + 2
form["DeployedDefID"] = base + 3
form["DefResource"] = sys.argv[1]
form["NoRule"] = {"Prefix": "PR-{index}", "StartIndex": 1, "CustomLength": 4, "AutoIncrement": 1}
form["Perms"] = []
app["Forms"].append(form)

layout = json.loads(app["ListSet"].get("LayoutView") or "{}")
sort = layout.setdefault("sort", [])
if not any(str(item.get("ListID")) == "PRF" for item in sort if isinstance(item, dict)):
    sort.append({"AppID": app["ListSet"].get("AppID", source.get("AppID")), "ListID": "PRF", "ListSetID": str(app["ListSet"].get("ListID")), "Type": 105, "IsHidden": False, "Title": "Purchase Request Form"})
app["ListSet"]["LayoutView"] = json.dumps(layout, separators=(",", ":"))
print(json.dumps(app, separators=(",", ":")), end="")
`;
  return pythonTransform(script, appPackageText, [purchaseDefResource]).toString("utf8");
}

function utcNowNoMillis() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function main() {
  const baseline = readJsonFile(SOURCE_YAPK);
  const appPackageText = zlib.brotliDecompressSync(Buffer.from(baseline.Resource, "base64")).toString("utf8");
  const formResource = pythonTransform("import json,sys; print(json.load(sys.stdin)['Forms'][0]['DefResource'], end='')", appPackageText).toString("utf8");
  const formDefText = decodeEmbeddedBrotliText(formResource);
  const purchaseFormDef = makePurchaseFormDef(formDefText);
  const purchaseResource = encodeEmbeddedBrotliText(purchaseFormDef);
  const appWithPurchase = addPurchaseForm(appPackageText, purchaseResource);
  const wrapper = {
    ...baseline,
    PackageId: crypto.randomUUID(),
    Version: "V1.3",
    Date: utcNowNoMillis(),
    Notes: "Adds a Purchase Request approval form with Dynamic Sub List purchase items for runtime testing.",
    Resource: zlib.brotliCompressSync(Buffer.from(appWithPurchase, "utf8")).toString("base64"),
  };
  const { signed, signBytes, verifyStatus, baseVariant } = await signYapkWrapper(wrapper);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_YAPK, `\uFEFF${JSON.stringify(signed)}\n`);
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify({ status: "pass", sourceYapk: SOURCE_YAPK, outputYapk: OUT_YAPK, version: signed.Version, signBytes, verifyStatus, baseVariant, formsAdded: ["Purchase Request Form"], proofBoundary: "Generated/signed/verified only; manual runtime test pending." }, null, 2)}\n`);
  console.log(JSON.stringify({ status: "pass", package: OUT_YAPK, version: signed.Version, signBytes, verifyStatus }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
