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

INPUT = Path("/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.1 - dashboard03 kanban and new vendor action.yapk")
OUTPUT = Path("/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.2 - merged dashboard and compliance queue.yapk")
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
    raw = base64.b64decode(resource)
    script = r"""
const zlib = require("zlib");
let chunks = [];
process.stdin.on("data", c => chunks.push(c));
process.stdin.on("end", () => {
  const input = Buffer.concat(chunks);
  try { process.stdout.write(zlib.brotliDecompressSync(input).toString("utf8")); return; } catch {}
  const stream = zlib.createBrotliDecompress();
  let out = [];
  stream.on("data", c => out.push(c));
  stream.on("error", () => process.stdout.write(Buffer.concat(out).toString("utf8")));
  stream.on("end", () => process.stdout.write(Buffer.concat(out).toString("utf8")));
  stream.end(input);
});
"""
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
    raise RuntimeError(f"Page not found: {title}")


def child_by_title(data, title):
    for child in data.get("Childs", []):
        if child.get("List", {}).get("Title") == title:
            return child
    raise RuntimeError(f"List not found: {title}")


def parse_page(page):
    return json.loads(page["LayoutInResources"][0]["Resource"])


def dump_page(page, page_json):
    page["LayoutInResources"][0]["Resource"] = json.dumps(page_json, ensure_ascii=False, separators=(",", ":"))


def content_container(page_json):
    root = page_json["children"][0]
    main = root["children"][0]
    return main["children"][0]


def walk(node, visit):
    if isinstance(node, dict):
        visit(node)
        for value in node.get("children", []) or []:
            walk(value, visit)
    elif isinstance(node, list):
        for item in node:
            walk(item, visit)


def clone_with_prefix(node, prefix):
    out = copy.deepcopy(node)

    def visit(item):
        if isinstance(item, dict) and isinstance(item.get("id"), str):
            item["id"] = f"{prefix}-{item['id']}"

    walk(out, visit)
    return out


def list_ref(child):
    info = child["List"]
    return {
        "AppID": 41,
        "ListID": str(info["ListID"]),
        "ListSetID": "2060579520443801601",
        "Type": 1,
        "Title": info["Title"],
    }


def merge_dashboards(data):
    main_page = page_by_title(data, "Vendor Management Dashboard")
    page_02 = page_by_title(data, "Vendor Management Dashboard 02")
    page_03 = page_by_title(data, "Vendor Management Dashboard 03")
    main_json = parse_page(main_page)
    merged_children = list(content_container(main_json).get("children", []))
    merged_children.extend(clone_with_prefix(child, "merged02") for child in content_container(parse_page(page_02)).get("children", []))
    merged_children.extend(clone_with_prefix(child, "merged03") for child in content_container(parse_page(page_03)).get("children", []))
    content_container(main_json)["children"] = merged_children
    dump_page(main_page, main_json)
    return len(merged_children)


def set_text(node, text):
    attrs = node.setdefault("attrs", {})
    heads = attrs.setdefault("heads", {})
    heads["text"] = text
    node["label"] = text
    node["nv_label"] = text


def build_compliance_queue(data):
    queue_page = page_by_title(data, "Vendor Management Dashboard 04")
    queue_page["Title"] = "Compliance Review / Operations Queue"
    queue_page_json = parse_page(queue_page)
    queue_page_json["title"] = "Compliance Review / Operations Queue"
    reviews = child_by_title(data, "Compliance Reviews")
    docs = child_by_title(data, "Vendor Documents")
    activity = child_by_title(data, "Vendor Activity / History")

    def visit(node):
        typ = node.get("type")
        label = node.get("label") or node.get("nv_label") or ""
        attrs = node.setdefault("attrs", {})
        if typ == "heading" and label in {"Vendor Records", "Operational queue section"}:
            set_text(node, "Compliance Review Queue")
        elif typ == "kanban":
            attrs.setdefault("data", {})["list"] = list_ref(reviews)
            attrs["data"]["cateField"] = "Text2"
            node["label"] = "Compliance review status board"
            node["nv_label"] = "Compliance review status board"
        elif typ == "timeline-v":
            attrs.setdefault("data", {})["list"] = list_ref(activity)
            attrs["data"]["sort"] = [{"SortName": "Datetime1", "Direction": "desc"}]
            node["label"] = "Review activity timeline"
            node["nv_label"] = "Review activity timeline"
        elif typ == "data-list":
            attrs["data"] = {"list": list_ref(docs)}
            attrs["listarr"] = [
                {"Field": "Title", "FieldName": "Document Name", "DisplayName": "Document Name", "Order": 1, "Show": True},
                {"Field": "Text1", "FieldName": "Vendor", "DisplayName": "Vendor", "Order": 2, "Show": True},
                {"Field": "Text2", "FieldName": "Document Type", "DisplayName": "Document Type", "Order": 3, "Show": True},
                {"Field": "Text3", "FieldName": "Review Status", "DisplayName": "Review Status", "Order": 4, "Show": True},
                {"Field": "Datetime1", "FieldName": "Expiry Date", "DisplayName": "Expiry Date", "Order": 5, "Show": True},
            ]
            node["label"] = "Missing and expiring documents"
            node["nv_label"] = "Missing and expiring documents"
        elif typ == "dynamic-field":
            obj_f = attrs.get("obj-f")
            if obj_f == "Text5":
                attrs["obj-f"] = "Decimal1"

    walk(queue_page_json, visit)
    dump_page(queue_page, queue_page_json)
    return str(queue_page["LayoutID"])


def patch_header_buttons(data, compliance_page_id):
    main_page = page_by_title(data, "Vendor Management Dashboard")
    main_json = parse_page(main_page)
    vendors = child_by_title(data, "Vendors")
    patched = []

    def visit(node):
        if node.get("type") != "action_button":
            return
        label = node.get("label") or node.get("nv_label") or ""
        attrs = node.setdefault("attrs", {})
        if label == "New Vendor Request":
            attrs["action-type"] = "5"
            attrs["data"] = {"list": list_ref(vendors)}
            attrs["op"] = "modal"
            attrs["modalsize"] = 2
            patched.append(label)
        elif label == "View Compliance Queue":
            attrs["action-type"] = "6"
            attrs["data"] = {
                "page": {
                    "AppID": 41,
                    "ListSetID": "2060579520443801601",
                    "PageID": str(compliance_page_id),
                    "Title": "Compliance Review / Operations Queue",
                }
            }
            attrs["op"] = "target"
            attrs.pop("modalsize", None)
            patched.append(label)

    walk(main_json, visit)
    dump_page(main_page, main_json)
    return patched


def patch_navigation(data, compliance_page_id):
    layout = json.loads(data["ListSet"]["LayoutView"])
    new_sort = []
    hidden = {"2060588418865258498", "2060625800075374633"}
    for item in layout.get("sort", []):
        list_id = str(item.get("ListID"))
        if list_id in hidden:
            continue
        if list_id == "2060694220555698176":
            item["Title"] = "Compliance Review / Operations Queue"
            item["DisplayName"] = "Compliance Review / Operations Queue"
            item["Icon"] = "fa-regular fa-list-check"
        new_sort.append(item)
    if not any(str(item.get("ListID")) == str(compliance_page_id) for item in new_sort):
        new_sort.insert(1, {
            "AppID": 41,
            "ListID": str(compliance_page_id),
            "ListSetID": "2060579520443801601",
            "Type": 103,
            "IsHidden": False,
            "Title": "Compliance Review / Operations Queue",
            "Icon": "fa-regular fa-list-check",
        })
    layout["sort"] = new_sort
    data["ListSet"]["LayoutView"] = json.dumps(layout, ensure_ascii=False, separators=(",", ":"))
    return [item.get("Title") for item in new_sort]


def summarize(data):
    out = {}
    for title in ["Vendor Management Dashboard", "Compliance Review / Operations Queue"]:
        page = next(page for page in data["Pages"] if page.get("Title") == title)
        page_json = parse_page(page)
        counts = {}
        def visit(node):
            typ = node.get("type")
            if typ:
                counts[typ] = counts.get(typ, 0) + 1
        walk(page_json, visit)
        out[title] = counts
    return out


def main():
    env = load_env()
    wrapper = json.loads(INPUT.read_text(encoding="utf-8-sig"))
    data = decode_resource(wrapper["Resource"])
    merged_section_count = merge_dashboards(data)
    compliance_page_id = build_compliance_queue(data)
    buttons = patch_header_buttons(data, compliance_page_id)
    navigation = patch_navigation(data, compliance_page_id)

    wrapper["Resource"] = encode_resource(data)
    wrapper["Title"] = "Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.2"
    wrapper["Version"] = "5.0.2 - merged dashboard and compliance queue"
    wrapper["Description"] = "Merges the three Vendor Management dashboard pages into one page and adds a separate Compliance Review / Operations Queue dashboard target."
    wrapper["Notes"] = "New Vendor Request opens the Vendors new-item modal. View Compliance Queue opens the Compliance Review / Operations Queue dashboard. Old split dashboard pages are removed from navigation."
    wrapper["Date"] = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    signed, signing = sign_wrapper(wrapper, env)
    OUTPUT.write_text(json.dumps(signed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(OUTPUT),
        "signing": signing,
        "mergedSectionCount": merged_section_count,
        "patchedButtons": buttons,
        "navigation": navigation,
        "summary": summarize(data),
    }, indent=2))


if __name__ == "__main__":
    main()
