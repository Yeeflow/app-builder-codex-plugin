#!/usr/bin/env python3
import base64
import copy
import datetime as dt
import json
import os
import subprocess
import tempfile
import urllib.request
import zlib
from pathlib import Path

INPUT = Path("/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.9.12 - vendor lookup target fix.yapk")
OUTPUT = Path("/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.9.18 - remove text0 dashboard refs.yapk")
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


def decode_resource(resource):
    raw = base64.b64decode(resource)
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
    result = subprocess.run(
        [process_exec(), "-e", script],
        input=raw,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    text = result.stdout.decode("utf-8")
    if not text.strip():
        raise RuntimeError("Decoded Resource was empty.")
    return json.loads(text)


def process_exec():
    return subprocess.run(["which", "node"], stdout=subprocess.PIPE, check=True).stdout.decode().strip()


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
        result = subprocess.run([process_exec(), "-e", script, tmp_path], stdout=subprocess.PIPE, check=True)
        return result.stdout.decode("utf-8")
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def post_json(url, api_key, payload):
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "apiKey": api_key,
        },
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


def parse_json(value, fallback=None):
    if value in (None, ""):
        return fallback
    if isinstance(value, (dict, list)):
        return copy.deepcopy(value)
    try:
        return json.loads(value)
    except Exception:
        return fallback


def dump_json(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def update_field(field, new_name=None, new_index=None, new_field_type=None, new_type=None, new_internal=None, new_rules=None):
    if new_name:
        field["FieldName"] = new_name
    if new_index is not None:
        field["FieldIndex"] = new_index
    if new_field_type:
        field["FieldType"] = new_field_type
    if new_type:
        field["Type"] = new_type
    if new_internal:
        field["InternalName"] = new_internal
    if new_rules is not None:
        field["Rules"] = dump_json(new_rules)


def remap_value(value, field_map):
    if isinstance(value, str):
        return field_map.get(value, value)
    if isinstance(value, list):
        return [remap_value(item, field_map) for item in value]
    if isinstance(value, dict):
        return {key: remap_value(item, field_map) for key, item in value.items()}
    return value


def remap_layouts(child, field_map):
    for layout in child.get("Layouts", []):
        view = parse_json(layout.get("LayoutView"), None)
        if view is not None:
            layout["LayoutView"] = dump_json(remap_value(view, field_map))


def patch_lookup_rules_in_layouts(child, lookup_rules_by_field):
    for layout in child.get("Layouts", []):
        view = parse_json(layout.get("LayoutView"), None)
        if view is None:
            continue
        for section in ("query", "layout"):
            for item in view.get(section, []) if isinstance(view.get(section), list) else []:
                field_name = item.get("FieldName") or item.get("field") or item.get("Field")
                if field_name in lookup_rules_by_field:
                    item["Rules"] = copy.deepcopy(lookup_rules_by_field[field_name])
        layout["LayoutView"] = dump_json(view)


def remap_items(child, field_map):
    items = child.get("List", {}).get("Items")
    if not isinstance(items, dict):
        return
    for item_id, row in list(items.items()):
        if not isinstance(row, dict):
            continue
        new_row = {}
        for key, value in row.items():
            new_row[field_map.get(key, key)] = value
        items[item_id] = new_row


def reorder_title_first(child):
    fields = child.get("Fields", [])
    fields.sort(key=lambda field: (0 if field.get("FieldName") == "Title" else 1, field.get("FieldID", 0)))


def set_rows(child, rows):
    child["List"]["Items"] = {str(row["ListDataID"]): row for row in rows}


def item_id(base, offset):
    return str(base + offset)


VENDOR_NAMES = [
    "Northstar Components",
    "Blue Harbor Logistics",
    "Evergreen Security Labs",
    "Apex Cloud Services",
    "Pacific Office Supply",
    "Summit Payroll Partners",
    "Brightline Facilities",
    "Atlas Data Systems",
    "HarborPoint Finance",
    "Nimbus Manufacturing",
]


def seed_rows(children_by_title):
    vendors = children_by_title["Vendors"]
    vendor_ids = [item_id(2060663000000000000, i) for i in range(10)]
    vendor_rows = []
    vendor_types = ["Strategic Supplier", "Service Provider", "Technology Partner", "Compliance Provider"]
    countries = ["United States", "Singapore", "United Kingdom", "Germany", "Japan"]
    onboarding = ["New Request", "Document Collection", "Compliance Review", "Approved", "Active"]
    risks = ["Low", "Medium", "High", "Critical"]
    compliance = ["Approved", "In Review", "Action Required", "Expired", "Blocked"]
    for i, name in enumerate(VENDOR_NAMES):
        vendor_rows.append({
            "ListDataID": vendor_ids[i],
            "Title": name,
            "Text1": f"VEN-{1001 + i}",
            "Text2": vendor_types[i % len(vendor_types)],
            "Text3": countries[i % len(countries)],
            "Text4": f"Contact {i + 1}",
            "Text5": f"vendor{i + 1}@example.com",
            "Text6": f"+1-555-010{i}",
            "Text7": ["Procurement Lead", "Compliance Owner", "Finance Owner"][i % 3],
            "Text8": onboarding[i % len(onboarding)],
            "Text9": risks[i % len(risks)],
            "Text10": compliance[i % len(compliance)],
            "Decimal1": round((45 + i * 5) / 100, 2),
            "Decimal2": round((70 + i * 2) / 100, 2),
            "Decimal3": 25000 + i * 7500,
            "Datetime1": f"2026-0{(i % 6) + 1}-15 00:00:00",
            "Bit1": i % 2 == 0,
            "Datetime2": f"2026-0{(i % 6) + 1}-01 00:00:00",
        })
    set_rows(vendors, vendor_rows)

    if "Vendors 2" in children_by_title:
        vendors2 = children_by_title["Vendors 2"]
        vendor2_rows = []
        for i, name in enumerate(VENDOR_NAMES):
            vendor2_rows.append({
                "ListDataID": item_id(2060663000000001000, i),
                "Title": name,
                "Text1": f"VEN-{1001 + i}",
                "Text2": f"vendor{i + 1}@example.com",
            })
        set_rows(vendors2, vendor2_rows)

    docs = children_by_title["Vendor Documents"]
    doc_types = ["Insurance Certificate", "Tax Form", "Business Registration", "Security Questionnaire", "Data Processing Agreement"]
    doc_status = ["Submitted", "In Review", "Approved", "Missing", "Expired"]
    set_rows(docs, [{
        "ListDataID": item_id(2060663000000000100, i),
        "Title": f"{doc_types[i % len(doc_types)]} - {VENDOR_NAMES[i]}",
        "Text1": vendor_ids[i],
        "Text2": doc_types[i % len(doc_types)],
        "Text3": doc_status[i % len(doc_status)],
        "Datetime1": f"2026-07-{i + 1:02d} 00:00:00",
    } for i in range(10)])

    reviews = children_by_title["Compliance Reviews"]
    review_status = ["Draft", "In Review", "Action Required", "Approved", "Rejected", "Closed"]
    vendor2_id = None
    if "Vendors 2" in children_by_title:
        vendor2_items = children_by_title["Vendors 2"]["List"].get("Items") or {}
        vendor2_id = next(iter(vendor2_items.keys()), None)
    review_rows = [{
        "ListDataID": item_id(2060663000000000200, i),
        "Title": f"Quarterly compliance review - {VENDOR_NAMES[i]}",
        "Text1": vendor_ids[i],
        "Text2": review_status[i % len(review_status)],
        "Decimal1": round((55 + i * 4) / 100, 2),
        "Datetime1": f"2026-06-{i + 1:02d} 00:00:00",
    } for i in range(10)]
    if vendor2_id and any(field.get("FieldName") == "Text3" for field in reviews.get("Fields", [])):
        for row in review_rows:
            row["Text3"] = vendor2_id
    set_rows(reviews, review_rows)

    activity = children_by_title["Vendor Activity / History"]
    activity_types = ["Request Submitted", "Document Uploaded", "Compliance Review Started", "Review Completed", "Status Updated"]
    set_rows(activity, [{
        "ListDataID": item_id(2060663000000000300, i),
        "Title": f"{activity_types[i % len(activity_types)]} - {VENDOR_NAMES[i]}",
        "Text1": vendor_ids[i],
        "Text2": activity_types[i % len(activity_types)],
        "Datetime1": f"2026-05-{i + 1:02d} 09:00:00",
        "Text4": ["Procurement Lead", "Compliance Owner", "Finance Owner"][i % 3],
        "Text5": f"Sample activity note for {VENDOR_NAMES[i]}.",
    } for i in range(10)])


def patch_children(data):
    children_by_title = {child["List"]["Title"]: child for child in data.get("Childs", []) if "List" in child}
    maps = {
        "Vendors": {
            "Text0": "Title",
            "Decimal11": "Decimal1",
            "Decimal12": "Decimal2",
            "Decimal13": "Decimal3",
            "DateTime14": "Datetime1",
            "Bit15": "Bit1",
            "DateTime16": "Datetime2",
        },
        "Vendor Documents": {"DateTime4": "Datetime1"},
        "Compliance Reviews": {"Decimal3": "Decimal1", "DateTime4": "Datetime1"},
        "Vendor Activity / History": {"DateTime3": "Datetime1"},
    }

    for title, field_map in maps.items():
        child = children_by_title[title]
        child["List"]["TableCode"] = "flowcraft"
        for field in child["Fields"]:
            old_name = field.get("FieldName")
            if old_name in field_map:
                new_name = field_map[old_name]
                update_field(field, new_name=new_name, new_index=int("".join(ch for ch in new_name if ch.isdigit())))
                if new_name.startswith("Datetime"):
                    field["FieldType"] = "Datetime"
                elif new_name.startswith("Decimal"):
                    field["FieldType"] = "Decimal"
                elif new_name.startswith("Bit"):
                    field["FieldType"] = "Bit"
        remap_layouts(child, field_map)
        remap_items(child, field_map)
        reorder_title_first(child)

    # Align Compliance Reviews with the manual Compliance Reviews2 field shape where it matters for Add.
    reviews = children_by_title["Compliance Reviews"]
    for field in reviews["Fields"]:
        if field.get("FieldName") == "Text2":
            field["Type"] = "radio"
            field["InternalName"] = "Review_Status"
            rules = parse_json(field.get("Rules"), {})
            rules.pop("max-selection", None)
            rules.pop("filterSetting", None)
            field["Rules"] = dump_json(rules)
        elif field.get("FieldName") == "Decimal1":
            field["InternalName"] = "Risk_Score"
            rules = parse_json(field.get("Rules"), {})
            rules["number_min"] = 0
            field["Rules"] = dump_json(rules)
        elif field.get("FieldName") == "Datetime1":
            field["InternalName"] = "Review_Date"

    vendor_target = children_by_title["Vendors"]
    vendor_target_id = str(vendor_target["List"]["ListID"])
    vendor_addition = []
    for order, field_name in enumerate(["Title", "Text1"]):
        field = next((item for item in vendor_target.get("Fields", []) if item.get("FieldName") == field_name), None)
        if field:
            vendor_addition.append({
                "FieldName": field["FieldName"],
                "FieldID": field["FieldID"],
                "IsShow": True,
                "RelationName": "",
                "Value": None,
                "Order": str(order),
            })

    # Ensure every lookup field has selected display fields. Leave the unresolved
    # picker record-selection behavior as a known product-team follow-up.
    for title in ["Vendor Documents", "Compliance Reviews", "Vendor Activity / History", "Compliance Reviews2"]:
        if title not in children_by_title:
            continue
        child = children_by_title[title]
        lookup_rules_by_field = {}
        for field in child["Fields"]:
            if field.get("Type") != "lookup":
                continue
            rules = parse_json(field.get("Rules"), {})
            target = children_by_title.get("Vendors 2") if field.get("DisplayName") == "Vendor2" else vendor_target
            target_id = str(target["List"]["ListID"])
            target_addition = []
            for order, field_name in enumerate(["Title", "Text1"]):
                target_field = next((item for item in target.get("Fields", []) if item.get("FieldName") == field_name), None)
                if target_field:
                    target_addition.append({
                        "FieldName": target_field["FieldName"],
                        "FieldID": target_field["FieldID"],
                        "IsShow": True,
                        "RelationName": "",
                        "Value": None,
                        "Order": str(order),
                    })
            rules.update({
                "listid": target_id,
                "listfield": "Title",
                "list_tooltip_field": None,
                "addition": copy.deepcopy(target_addition),
                "sort-first": {"SortName": "Text1", "SortByDesc": False},
                "sort-second": None,
                "listfilter": None,
                "search-scope": None,
                "search-fields": None,
            })
            field["Rules"] = dump_json(rules)
            lookup_rules_by_field[field["FieldName"]] = rules
        patch_lookup_rules_in_layouts(child, lookup_rules_by_field)

    seed_rows(children_by_title)
    return maps


def patch_page_field_refs(data, maps):
    list_ids = {child["List"]["Title"]: str(child["List"]["ListID"]) for child in data.get("Childs", []) if "List" in child}
    map_by_list_id = {list_ids[title]: field_map for title, field_map in maps.items()}

    def walk(node, active_map=None):
        if isinstance(node, list):
            return [walk(item, active_map) for item in node]
        if not isinstance(node, dict):
            return active_map.get(node, node) if active_map and isinstance(node, str) else node
        next_map = active_map
        data_list = node.get("attrs", {}).get("data", {}).get("list") if isinstance(node.get("attrs"), dict) else None
        if isinstance(data_list, dict):
            list_id = str(data_list.get("ListID") or "")
            if list_id in map_by_list_id:
                next_map = map_by_list_id[list_id]
        return {key: walk(value, next_map) for key, value in node.items()}

    for page in data.get("Pages", []):
        for resource in page.get("LayoutInResources", []) or []:
            resource_text = resource.get("Resource")
            if not isinstance(resource_text, str) or not resource_text.strip():
                continue
            try:
                page_json = json.loads(resource_text)
            except Exception:
                continue
            patched = dump_json(walk(page_json))
            patched = patched.replace('"prop":"Text0"', '"prop":"Title"')
            patched = patched.replace('"Field":"Text0"', '"Field":"Title"')
            patched = patched.replace('"FieldName":"Text0"', '"FieldName":"Title"')
            resource["Resource"] = patched


def main():
    env = load_env()
    wrapper = json.loads(INPUT.read_text(encoding="utf-8-sig"))
    data = decode_resource(wrapper["Resource"])
    maps = patch_children(data)
    patch_page_field_refs(data, maps)
    wrapper["Resource"] = encode_resource(data)
    wrapper["Title"] = "Vendor Onboarding & Compliance Management v4.1 Dashboard-4.9.18"
    wrapper["Version"] = "4.9.18 - remove text0 dashboard refs"
    wrapper["Description"] = "Removes remaining Text0 references and forces lookup display/search fields to existing Title fields; lookup picker record selection remains a known product-team follow-up."
    wrapper["Notes"] = "Every lookup field and dashboard binding now uses existing Title display fields with Vendor Code as the additional display field. No decoded package metadata should reference Text0."
    wrapper["Date"] = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    signed, signing = sign_wrapper(wrapper, env)
    OUTPUT.write_text(json.dumps(signed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = {
        "output": str(OUTPUT),
        "signing": signing,
        "lists": [
            {
                "title": child["List"]["Title"],
                "items": len(child["List"].get("Items") or {}),
                "fields": [field["FieldName"] for field in child.get("Fields", [])],
            }
            for child in data.get("Childs", [])
            if child.get("List", {}).get("Title") in ["Vendors", "Vendor Documents", "Compliance Reviews", "Vendor Activity / History", "Compliance Reviews2"]
        ],
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
