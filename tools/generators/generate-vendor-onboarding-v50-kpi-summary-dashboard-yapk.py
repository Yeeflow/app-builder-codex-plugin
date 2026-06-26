#!/usr/bin/env python3
import base64
import datetime as dt
import json
import os
import subprocess
import tempfile
import urllib.request
from pathlib import Path

INPUT = Path("/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.2 - merged dashboard and compliance queue.yapk")
OUTPUT = Path("/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.3 - kpi summary vars and navigator labels.yapk")
LISTSET_ID = "2060579520443801601"
APP_ID = 41
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


def walk(node, visit, path=()):
    if isinstance(node, dict):
        visit(node, path)
        for idx, value in enumerate(node.get("children", []) or []):
            walk(value, visit, path + (idx,))
    elif isinstance(node, list):
        for idx, item in enumerate(node):
            walk(item, visit, path + (idx,))


def list_ref(child):
    info = child["List"]
    return {
        "AppID": APP_ID,
        "ListID": str(info["ListID"]),
        "ListSetID": LISTSET_ID,
        "Type": 1,
        "Title": info["Title"],
    }


def heading_text(node):
    attrs = node.get("attrs") or {}
    title = (attrs.get("headc") or {}).get("title") or {}
    if isinstance(title, dict):
        return title.get("value")
    return None


def set_label(node, label):
    node["label"] = label
    node["nv_label"] = label


def temp_var_expr(name):
    return {"exprType": "variable", "valueType": "string", "id": f"__temp_{name}", "type": "expr", "name": name}


def format_temp_expr(name):
    return [{
        "type": "func",
        "func": "formatNumber",
        "params": [[temp_var_expr(name)], [{"type": "num", "value": "0"}], [{"type": "bool", "value": True}]],
    }]


def summary_control(control_id, label, temp_var):
    return {
        "id": control_id,
        "type": "summary",
        "label": label,
        "nv_label": label,
        "displayLabel": False,
        "attrs": {
            "layout": {
                "desc": {"value": label, "variable": None, "ty": {"size": [None, 12], "wei": "300"}, "c": "rgba(7, 22, 56, 0.55)"},
                "number": {"ty": {"size": [None, 20], "wei": "700"}, "c": "#111827"},
                "pic": {},
                "title": {},
            },
            "common": {
                "padding": [None, {"top": 0, "right": 0, "bottom": 0, "left": 0}],
                "border": {
                    "normal": {"type": "0", "width": [None, {"top": 0, "right": 0, "bottom": 0, "left": 0}], "color": "rgba(255, 255, 255, 0)", "radius": [None, 0]},
                    "hover": {"type": "0", "width": [None, {"top": 0, "right": 0, "bottom": 0, "left": 0}], "color": "rgba(255, 255, 255, 0)", "radius": [None, 0]},
                },
            },
            "save_var": temp_var_expr(temp_var),
        },
        "children": [],
    }


def summary_ext(control_id, source_child, conditions=None):
    return {
        "category": "___Pivot___",
        "key": "summary",
        "i": control_id,
        "attr": {
            "AppID": APP_ID,
            "ListID": str(source_child["List"]["ListID"]),
            "ListSetID": LISTSET_ID,
            "settings": {
                "values": [{
                    "type": "input",
                    "label": "Id",
                    "attr": {"displayLabel": True, "readonly": True},
                    "fieldName": "ListDataID",
                    "fieldType": "Bigint",
                    "func": "COUNT",
                    "id": "ListDataID",
                }],
                "preConditions": None,
                "Conditions": conditions or [],
            },
        },
    }


def simple_condition(key, field, value, pre="and"):
    return {"key": key, "pre": pre, "left": field, "op": "0", "right": value, "showCus": True}


def or_group(key, field, values):
    return {
        "key": key,
        "pre": "and",
        "left": "Title",
        "op": "0",
        "right": None,
        "conditions": [
            {"key": f"{key}-{idx}", "pre": "or", "left": field, "op": "0", "right": value, "showCus": True}
            for idx, value in enumerate(values, 1)
        ],
    }


def hidden_summary_container(vendors, documents):
    controls = [
        ("vo-kpi-summary-total-vendors", "Total Vendors Summary", "vTotalVendors", vendors, []),
        ("vo-kpi-summary-pending-onboarding", "Pending Onboarding Summary", "vPendingOnboarding", vendors, [or_group("vo-kpi-pending-onboarding", "Text8", ["New Request", "Document Collection", "Compliance Review", "Blocked"])]),
        ("vo-kpi-summary-high-risk", "High Risk Vendors Summary", "vHighRiskVendors", vendors, [or_group("vo-kpi-high-risk", "Text9", ["High", "Critical"])]),
        ("vo-kpi-summary-expiring-documents", "Expiring Documents Summary", "vExpiringDocuments", documents, [or_group("vo-kpi-expiring-documents", "Text3", ["Missing", "Expired"])]),
    ]
    container = {
        "id": "vo-hidden-kpi-summary-container",
        "type": "container",
        "label": "Hidden KPI summary source controls",
        "nv_label": "Hidden KPI summary source controls",
        "displayLabel": False,
        "attrs": {
            "style": {"direction": [None, "row"], "gap": [None, 8]},
            "common": {"padding": [None, None], "hide": [None, True, True, True]},
        },
        "children": [summary_control(control_id, label, temp_var) for control_id, label, temp_var, _, _ in controls],
    }
    exts = [summary_ext(control_id, source, conditions) for control_id, _, _, source, conditions in controls]
    temp_vars = [
        {"idx": "vo-temp-total-vendors", "id": "vTotalVendors"},
        {"idx": "vo-temp-pending-onboarding", "id": "vPendingOnboarding"},
        {"idx": "vo-temp-high-risk-vendors", "id": "vHighRiskVendors"},
        {"idx": "vo-temp-expiring-documents", "id": "vExpiringDocuments"},
    ]
    return container, exts, temp_vars


def restructure_main_dashboard(page_json):
    main = page_json["children"][0]
    if not main:
        raise RuntimeError("Main container missing.")
    content = next((child for child in main.get("children", []) if child.get("nv_label") == "Content"), None)
    if not content:
        raise RuntimeError("Content container missing.")

    # 5.0.2 had body sections accidentally nested under the page header. Pull them
    # back under Content, then put KPI cards directly after the header.
    page_header = content.get("children", [None])[0]
    if not page_header:
        raise RuntimeError("Page header missing.")
    body_sections = []
    if len(page_header.get("children", [])) > 1:
        body_sections = page_header["children"][1:]
        page_header["children"] = page_header["children"][:1]

    kpi = next((child for child in main.get("children", []) if child.get("nv_label") == "Lifecycle KPI section"), None)
    if not kpi:
        kpi = next((child for child in content.get("children", []) if child.get("nv_label") == "Lifecycle KPI section"), None)
    if not kpi:
        raise RuntimeError("Lifecycle KPI section missing.")

    main["children"] = [content]
    ordered = [page_header, kpi]
    ordered.extend(section for section in body_sections if section is not kpi)
    for section in content.get("children", [])[1:]:
        if section not in ordered:
            ordered.append(section)
    content["children"] = ordered
    return content, kpi


def patch_kpi_values(page_json, kpi_section, vendors, documents):
    hidden_container, exts, temp_vars = hidden_summary_container(vendors, documents)
    page_json["tempVars"] = [var for var in page_json.get("tempVars", []) if not str(var.get("id", "")).startswith("vTotalVendors")]
    existing_ids = {var.get("id") for var in page_json["tempVars"]}
    page_json["tempVars"].extend(var for var in temp_vars if var["id"] not in existing_ids)
    page_json["exts"] = [ext for ext in page_json.get("exts", []) if not str(ext.get("i", "")).startswith("vo-kpi-summary-")]
    page_json["exts"].extend(exts)

    # Replace static KPI number Text controls with temp-variable expressions.
    replacements = {
        "128": ("vTotalVendors", "Total vendors KPI value"),
        "24": ("vPendingOnboarding", "Pending onboarding KPI value"),
        "7": ("vHighRiskVendors", "High risk vendors KPI value"),
        "13": ("vExpiringDocuments", "Expiring documents KPI value"),
    }

    def visit(node, _path):
        if node.get("type") != "heading":
            return
        value = heading_text(node)
        if value not in replacements:
            return
        temp_var, label = replacements[value]
        title = node.setdefault("attrs", {}).setdefault("headc", {}).setdefault("title", {})
        title["value"] = None
        title["variable"] = format_temp_expr(temp_var)
        set_label(node, label)

    walk(kpi_section, visit)
    kpi_section["children"] = [child for child in kpi_section.get("children", []) if child.get("id") != "vo-hidden-kpi-summary-container"]
    kpi_section["children"].append(hidden_container)
    return len(exts)


def first_heading(node):
    found = None

    def visit(item, _path):
        nonlocal found
        if found is not None:
            return
        if item.get("type") == "heading":
            text = heading_text(item)
            if isinstance(text, str) and text.strip():
                found = text.strip()

    walk(node, visit)
    return found


def apply_semantic_labels(page_json, page_title):
    dynamic_field_names = {
        "Title": "Title dynamic field",
        "Text1": "Vendor lookup dynamic field",
        "Text2": "Status/type dynamic field",
        "Text3": "Review status dynamic field",
        "Text4": "Actor/team dynamic field",
        "Text5": "Description dynamic field",
        "Text8": "Onboarding status dynamic field",
        "Text9": "Risk level dynamic field",
        "Text10": "Compliance status dynamic field",
        "Decimal1": "Risk score dynamic field",
        "Datetime1": "Date dynamic field",
    }

    def visit(node, _path):
        typ = node.get("type")
        if typ == "flex_grid":
            set_label(node, "Lifecycle KPI card grid")
        elif typ == "kanban":
            set_label(node, "Onboarding status Kanban" if page_title == "Vendor Management Dashboard" else "Compliance review Kanban")
        elif typ == "timeline-v":
            set_label(node, "Recent vendor activity timeline" if page_title == "Vendor Management Dashboard" else "Review activity timeline")
        elif typ == "kanban-body":
            set_label(node, "Kanban item card body")
        elif typ == "kanban-footer":
            set_label(node, "Kanban item card footer")
        elif typ == "dynamic-field":
            field = (node.get("attrs") or {}).get("obj-f")
            set_label(node, dynamic_field_names.get(field, f"{field or 'Field'} dynamic field"))
        elif typ == "dynamic-user":
            set_label(node, "Owner dynamic user")

        if typ == "container":
            heading = first_heading(node)
            if heading == "Vendor Management Dashboard":
                set_label(node, "Page header content")
            elif heading == "Total Vendors":
                set_label(node, "Total vendors KPI card")
            elif heading == "Pending Onboarding":
                set_label(node, "Pending onboarding KPI card")
            elif heading == "High Risk Vendors":
                set_label(node, "High risk vendors KPI card")
            elif heading == "Expiring Documents":
                set_label(node, "Expiring documents KPI card")
            elif heading == "Onboarding Completion":
                set_label(node, "Progress and compliance alert section")
            elif heading == "Compliance Alert":
                set_label(node, "Compliance alert card")
            elif heading == "Onboarding Status Board":
                set_label(node, "Onboarding status board section")
            elif heading == "Recent Vendor Activity":
                set_label(node, "Recent vendor activity section")
            elif heading == "Compliance Review Queue":
                set_label(node, "Compliance review queue section")
            elif heading == "Missing and Expiring Documents":
                set_label(node, "Missing documents section")

    walk(page_json, visit)


def rename_controls(page_json):
    generic = {"Container", "Grid", "Text", "Dynamic field", "Dynamic user", "Kanban", "Icon", "Text Editor"}
    type_names = {
        "container": "Container",
        "flex_grid": "Grid",
        "heading": "Text",
        "kanban": "Kanban",
        "kanban-body": "Kanban card body",
        "kanban-footer": "Kanban card footer",
        "timeline-v": "Vertical timeline",
        "dynamic-field": "Dynamic field",
        "dynamic-user": "Dynamic user",
        "progress": "Progress bar",
        "progress-circle": "Progress circle",
        "summary": "Summary",
    }
    counters = {}

    def meaningful_from_text(node):
        text = heading_text(node)
        if isinstance(text, str) and text.strip():
            return text.strip()[:80]
        return None

    def visit(node, path):
        typ = node.get("type")
        label = node.get("nv_label") or node.get("label")
        text_label = meaningful_from_text(node)
        if text_label:
            set_label(node, text_label)
            return
        if label and label not in generic and not str(label).startswith("merged"):
            node["nv_label"] = label
            return
        base = type_names.get(typ, typ or "Control")
        counters[base] = counters.get(base, 0) + 1
        # Use stable, navigable names rather than leaving product defaults.
        set_label(node, f"{base} {counters[base]:02d}")

    walk(page_json, visit)

    # Restore important section names after generic pass.
    main = page_json["children"][0]
    set_label(main, "Main")
    if main.get("children"):
        set_label(main["children"][0], "Content")
    return counters


def patch_main_dashboard(data):
    page = page_by_title(data, "Vendor Management Dashboard")
    page_json = parse_page(page)
    content, kpi_section = restructure_main_dashboard(page_json)
    set_label(content, "Content")
    vendors = child_by_title(data, "Vendors")
    documents = child_by_title(data, "Vendor Documents")
    summary_count = patch_kpi_values(page_json, kpi_section, vendors, documents)
    rename_controls(page_json)
    apply_semantic_labels(page_json, "Vendor Management Dashboard")
    # Re-assert primary structural and section labels after the full rename pass.
    main = page_json["children"][0]
    content = main["children"][0]
    set_label(main, "Main")
    set_label(content, "Content")
    if content.get("children"):
        set_label(content["children"][0], "Page header")
    if len(content.get("children", [])) > 1:
        set_label(content["children"][1], "Lifecycle KPI section")
    set_label(kpi_section, "Lifecycle KPI section")
    dump_page(page, page_json)
    return {
        "contentChildren": [child.get("nv_label") for child in content.get("children", [])],
        "summaryControls": summary_count,
        "tempVars": [var.get("id") for var in page_json.get("tempVars", [])],
        "exts": len(page_json.get("exts", [])),
    }


def patch_other_dashboard_labels(data):
    summaries = {}
    for title in ["Compliance Review / Operations Queue"]:
        try:
            page = page_by_title(data, title)
        except RuntimeError:
            continue
        page_json = parse_page(page)
        counters = rename_controls(page_json)
        apply_semantic_labels(page_json, title)
        main = page_json["children"][0]
        set_label(main, "Main")
        if main.get("children"):
            set_label(main["children"][0], "Content")
        dump_page(page, page_json)
        summaries[title] = counters
    return summaries


def inspect_generic_labels(page_json):
    bad = []

    def visit(node, path):
        label = node.get("nv_label") or node.get("label")
        if label in {"Container", "Grid", "Text", "Dynamic field", "Kanban"}:
            bad.append({"path": list(path), "type": node.get("type"), "label": label, "id": node.get("id")})

    walk(page_json, visit)
    return bad


def summarize(data):
    summary = {}
    for title in ["Vendor Management Dashboard", "Compliance Review / Operations Queue"]:
        page = next(page for page in data["Pages"] if page.get("Title") == title)
        page_json = parse_page(page)
        counts = {}

        def visit(node, _path):
            typ = node.get("type")
            if typ:
                counts[typ] = counts.get(typ, 0) + 1

        walk(page_json, visit)
        summary[title] = {
            "counts": counts,
            "genericLabels": inspect_generic_labels(page_json)[:10],
            "tempVars": page_json.get("tempVars", []),
            "exts": len(page_json.get("exts", [])),
        }
    return summary


def main():
    env = load_env()
    wrapper = json.loads(INPUT.read_text(encoding="utf-8-sig"))
    data = decode_resource(wrapper["Resource"])
    main_patch = patch_main_dashboard(data)
    other_patches = patch_other_dashboard_labels(data)

    wrapper["Resource"] = encode_resource(data)
    wrapper["Title"] = "Vendor Onboarding & Compliance Management v4.1 Dashboard-5.0.3"
    wrapper["Version"] = "5.0.3 - kpi summary variables and navigator labels"
    wrapper["Description"] = "Moves Lifecycle KPI cards to the top, binds KPI display text through hidden summary controls and dashboard temp variables, and renames dashboard controls for a clean Navigator."
    wrapper["Notes"] = "Uses the Service Desk Pro Executive Dashboard pattern: hidden summary controls save counts to temp variables, visible KPI text renders the variables. Also restores Main > Content section order and meaningful navigator labels."
    wrapper["Date"] = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    signed, signing = sign_wrapper(wrapper, env)
    OUTPUT.write_text(json.dumps(signed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(OUTPUT),
        "signing": signing,
        "mainPatch": main_patch,
        "otherPatches": other_patches,
        "summary": summarize(data),
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
