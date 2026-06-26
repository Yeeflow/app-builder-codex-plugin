#!/usr/bin/env python3
import base64
import copy
import datetime as dt
import json
import os
import subprocess
import tempfile
import urllib.request
from pathlib import Path

INPUT = Path("/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.0 - Sample Dashboard page.yapk")
OUTPUT = Path("/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.1 - dashboard03 kanban and new vendor action.yapk")
ENV_PATHS = [
    Path.cwd() / ".env.local",
    Path("/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates - formreport-clean-visual-design-hardening/.env.local"),
]


def load_env():
    env = dict(os.environ)
    for env_path in ENV_PATHS:
        if not env_path.exists():
            continue
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    api_key = env.get("YEEFLOW_API_KEY")
    api_base = env.get("YEEFLOW_API_BASE_URL") or env.get("YEEFLOW_BASE_URL")
    tenant_id = env.get("YEEFLOW_TENANT_ID")
    if not api_key or not api_base:
        raise RuntimeError("YEEFLOW_API_KEY and YEEFLOW_API_BASE_URL are required for signing.")
    api_base = api_base.rstrip("/")
    if not api_base.endswith("/v1"):
        api_base = f"{api_base}/v1"
    return {"api_key": api_key, "api_base": api_base, "tenant_id": tenant_id}


def node_exec():
    return subprocess.run(["which", "node"], stdout=subprocess.PIPE, check=True).stdout.decode().strip()


def decode_resource(resource):
    script = r"""
const zlib = require("zlib");
let chunks = [];
process.stdin.on("data", c => chunks.push(c));
process.stdin.on("end", () => {
  const input = Buffer.concat(chunks);
  try {
    process.stdout.write(zlib.brotliDecompressSync(input).toString("utf8"));
    return;
  } catch {}
  const stream = zlib.createBrotliDecompress();
  let out = [];
  stream.on("data", c => out.push(c));
  stream.on("error", () => process.stdout.write(Buffer.concat(out).toString("utf8")));
  stream.on("end", () => process.stdout.write(Buffer.concat(out).toString("utf8")));
  stream.end(input);
});
"""
    raw = base64.b64decode(resource)
    text = subprocess.check_output([node_exec(), "-e", script], input=raw).decode("utf-8")
    if not text.strip():
        raise RuntimeError("Decoded Resource was empty.")
    return json.loads(text)


def encode_resource(data):
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as tmp:
        json.dump(data, tmp, ensure_ascii=False, separators=(",", ":"))
        tmp_path = tmp.name
    script = r"""
const fs = require("fs");
const zlib = require("zlib");
const input = fs.readFileSync(process.argv[1]);
process.stdout.write(zlib.brotliCompressSync(input).toString("base64"));
"""
    try:
        return subprocess.check_output([node_exec(), "-e", script, tmp_path]).decode("utf-8")
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def post_json(url, api_key, payload):
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json", "apiKey": api_key},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.status, json.loads(response.read().decode("utf-8") or "{}")


def sign_wrapper(wrapper, env):
    signing_wrapper = dict(wrapper)
    if env.get("tenant_id"):
        signing_wrapper["TenantID"] = env["tenant_id"]
    unsigned = dict(signing_wrapper)
    unsigned.pop("Sign", None)
    status, sign_json = post_json(f"{env['api_base']}/utils/apppackage/setsign", env["api_key"], unsigned)
    if status < 200 or status > 299:
        raise RuntimeError(f"setsign failed with HTTP {status}")
    sign = sign_json if isinstance(sign_json, str) else (
        sign_json.get("Data") or sign_json.get("data") or sign_json.get("Sign") or sign_json.get("sign")
    )
    if not isinstance(sign, str) or len(base64.b64decode(sign)) != 32:
        raise RuntimeError("setsign response did not contain a 32-byte signature.")
    signed = dict(signing_wrapper)
    signed["Sign"] = sign
    status, _ = post_json(f"{env['api_base']}/utils/apppackage/verifysign", env["api_key"], signed)
    if status < 200 or status > 299:
        raise RuntimeError(f"verifysign failed with HTTP {status}")
    return signed, {"signBytes": len(base64.b64decode(sign)), "verifyStatus": status}


def page_by_title(data, title):
    for page in data.get("Pages", []):
        if page.get("Title") == title:
            return page
    raise RuntimeError(f"Dashboard page not found: {title}")


def list_by_title(data, title):
    for child in data.get("Childs", []):
        if child.get("List", {}).get("Title") == title:
            return child
    raise RuntimeError(f"Data list not found: {title}")


def parse_page(page):
    resource = page["LayoutInResources"][0]["Resource"]
    return json.loads(resource)


def dump_page(page, page_json):
    page["LayoutInResources"][0]["Resource"] = json.dumps(page_json, ensure_ascii=False, separators=(",", ":"))


def walk(node, visit):
    if isinstance(node, dict):
        visit(node)
        for value in list(node.values()):
            walk(value, visit)
    elif isinstance(node, list):
        for item in node:
            walk(item, visit)


def patch_new_vendor_button(page_json, vendors):
    list_info = vendors["List"]
    action_target = {
        "AppID": 41,
        "ListID": str(list_info["ListID"]),
        "ListSetID": "2060579520443801601",
        "Type": 1,
        "Title": list_info["Title"],
    }
    patched = []

    def visit(node):
        if node.get("type") != "action_button":
            return
        label = node.get("label") or node.get("nv_label") or ""
        if label != "New Vendor Request":
            return
        attrs = node.setdefault("attrs", {})
        attrs["action-type"] = "5"
        attrs["data"] = {"list": copy.deepcopy(action_target)}
        attrs["op"] = "modal"
        attrs["modalsize"] = 2
        attrs.pop("control_action", None)
        patched.append(node.get("id"))

    walk(page_json, visit)
    if not patched:
        raise RuntimeError("New Vendor Request action_button was not found.")
    return patched


def copy_dashboard_04_to_03(data):
    page_03 = page_by_title(data, "Vendor Management Dashboard 03")
    page_04 = page_by_title(data, "Vendor Management Dashboard 04")
    source = parse_page(page_04)
    target = copy.deepcopy(source)
    target["title"] = "Vendor Management Dashboard 03"
    dump_page(page_03, target)
    return {
        "sourcePage": page_04.get("Title"),
        "targetPage": page_03.get("Title"),
        "targetLayoutID": str(page_03.get("LayoutID")),
    }


def summarize_dashboard_03(data):
    page = page_by_title(data, "Vendor Management Dashboard 03")
    page_json = parse_page(page)
    counts = {}
    dynamic_fields = []

    def visit(node):
        typ = node.get("type")
        if typ:
            counts[typ] = counts.get(typ, 0) + 1
        if typ in {"dynamic-field", "dynamic-user", "dynamic-file", "dynamic-image"}:
            dynamic_fields.append(node.get("attrs", {}).get("obj-f"))

    walk(page_json, visit)
    return {"controlCounts": counts, "dynamicFields": [item for item in dynamic_fields if item]}


def main():
    env = load_env()
    wrapper = json.loads(INPUT.read_text(encoding="utf-8-sig"))
    data = decode_resource(wrapper["Resource"])

    vendors = list_by_title(data, "Vendors")
    page_0 = page_by_title(data, "Vendor Management Dashboard")
    page_0_json = parse_page(page_0)
    button_ids = patch_new_vendor_button(page_0_json, vendors)
    dump_page(page_0, page_0_json)

    copy_result = copy_dashboard_04_to_03(data)
    dashboard_03_summary = summarize_dashboard_03(data)

    wrapper["Resource"] = encode_resource(data)
    wrapper["Title"] = "Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.1"
    wrapper["Version"] = "5.0.1 - dashboard03 kanban and new vendor action"
    wrapper["Description"] = "Adds Add list item action to New Vendor Request and rebuilds Dashboard 03 from the manually configured Dashboard 04 Kanban/timeline reference."
    wrapper["Notes"] = "New Vendor Request opens the Vendors new-item modal. Vendor Management Dashboard 03 now uses the Dashboard 04 Kanban and Vertical Timeline dynamic-control configuration."
    wrapper["Date"] = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    signed, signing = sign_wrapper(wrapper, env)
    OUTPUT.write_text(json.dumps(signed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(OUTPUT),
        "signing": signing,
        "patchedButtons": button_ids,
        "dashboardCopy": copy_result,
        "dashboard03": dashboard_03_summary,
    }, indent=2))


if __name__ == "__main__":
    main()
